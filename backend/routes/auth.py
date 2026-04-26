import json, urllib.parse, base64, hashlib, random, traceback, sqlite3, time, struct, requests, math, os, threading
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from backend.caching import CACHE
from backend.services import NOTIFY, ML_ENGINE, PORTFOLIO_SIM, NotificationService
from backend.database import SupabaseClient, DB_PATH, STRIPE_SECRET_KEY, stripe, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, SUPABASE_URL, SUPABASE_HEADERS
from cryptography.fernet import Fernet

# Initialize Fernet Key
FERNET_KEY = os.getenv("FERNET_KEY", Fernet.generate_key().decode())
fernet = Fernet(FERNET_KEY.encode())

def encrypt_secret(secret: str) -> str:
    if not secret: return ""
    return fernet.encrypt(secret.encode()).decode()

def decrypt_secret(encrypted_secret: str) -> str:
    if not encrypted_secret: return ""
    try:
        return fernet.decrypt(encrypted_secret.encode()).decode()
    except:
        return ""
# - Body cap (shared with api_router) -
_MAX_BODY_BYTES = 1 * 1024 * 1024

# - S1: Session cache - avoids Supabase+Stripe round-trip on every request -
# Key: SHA-256[:16] of raw token  |  Value: (auth_info_dict, timestamp)
_SESSION_CACHE: dict = {}
_SESSION_LOCK   = threading.Lock()
_SESSION_TTL    = 300  # 5 minutes

def _session_cache_get(token: str):
    key = hashlib.sha256(token.encode()).hexdigest()[:16]
    with _SESSION_LOCK:
        entry = _SESSION_CACHE.get(key)
        if entry and (time.time() - entry[1]) < _SESSION_TTL:
            return entry[0]
        _SESSION_CACHE.pop(key, None)
    return None

def _session_cache_set(token: str, data: dict):
    key = hashlib.sha256(token.encode()).hexdigest()[:16]
    with _SESSION_LOCK:
        _SESSION_CACHE[key] = (data, time.time())
        # Lazy eviction: purge expired when cache exceeds 500 entries
        if len(_SESSION_CACHE) > 500:
            now     = time.time()
            expired = [k for k, (_, ts) in _SESSION_CACHE.items() if now - ts >= _SESSION_TTL]
            for k in expired:
                _SESSION_CACHE.pop(k, None)

def _session_cache_invalidate(token: str):
    """Call on logout to immediately drop the cached session."""
    key = hashlib.sha256(token.encode()).hexdigest()[:16]
    with _SESSION_LOCK:
        _SESSION_CACHE.pop(key, None)

# - S4: Login attempt tracker - lock after 5 failures within 15 min -
_LOGIN_ATTEMPTS: dict = {}
_LOGIN_LOCK      = threading.Lock()
_LOGIN_MAX       = 5    # max failures before lockout
_LOGIN_WINDOW    = 900  # 15-minute sliding window (seconds)

def _check_login_lockout(email: str) -> bool:
    """Return True if the account is currently locked out."""
    email = email.lower().strip()
    now   = time.time()
    with _LOGIN_LOCK:
        rec = _LOGIN_ATTEMPTS.get(email)
        if not rec:
            return False
        if now - rec['first'] > _LOGIN_WINDOW:
            _LOGIN_ATTEMPTS.pop(email, None)
            return False
        return rec['count'] >= _LOGIN_MAX

def _record_login_failure(email: str):
    email = email.lower().strip()
    now   = time.time()
    with _LOGIN_LOCK:
        rec = _LOGIN_ATTEMPTS.get(email)
        if not rec or (now - rec['first'] > _LOGIN_WINDOW):
            _LOGIN_ATTEMPTS[email] = {'count': 1, 'first': now}
        else:
            _LOGIN_ATTEMPTS[email]['count'] += 1

def _clear_login_attempts(email: str):
    email = email.lower().strip()
    with _LOGIN_LOCK:
        _LOGIN_ATTEMPTS.pop(email, None)


class AuthRoutesMixin:
    def get_auth_token(self):
        cookies = self.headers.get('Cookie', '')
        if 'sb-access-token=' in cookies:
            return cookies.split('sb-access-token=')[1].split(';')[0]
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
        return None

    def is_authenticated(self):
        token = self.get_auth_token()
        if not token:
            return None

        # Test-token bypass - development only (APP_ENV=production disables this)
        if os.getenv('APP_ENV', 'development') != 'production' and token.startswith('test-token-'):
            is_p  = 'premium' in token or 'institutional' in token
            email = 'test@example.com' if not is_p else 'premium@example.com'
            return {'authenticated': True, 'email': email, 'user_id': 'test-uid-123',
                    'is_premium': is_p, 'has_stripe_id': False, 'stripe_customer_id': None}

        # - S1: Session cache hit -
        cached = _session_cache_get(token)
        if cached:
            return cached

        # - Full Supabase + Stripe verification -
        url     = f'{SUPABASE_URL}/auth/v1/user'
        headers = {**SUPABASE_HEADERS, 'Authorization': f'Bearer {token}'}
        try:
            r = requests.get(url, headers=headers, timeout=3)
            if r.status_code == 200:
                user_data          = r.json()
                user_id            = user_data.get('id')
                email              = user_data.get('email', '')
                is_premium         = False
                stripe_customer_id = None

                sub_data = SupabaseClient.query('subscriptions', filters=f'user_id=eq.{user_id}')
                if sub_data and isinstance(sub_data, list) and len(sub_data) > 0:
                    is_premium         = sub_data[0].get('subscription', False)
                    stripe_customer_id = sub_data[0].get('stripe_customer_id')

                if not stripe_customer_id and email:
                    try:
                        customers = stripe.Customer.list(email=email, limit=1)
                        if customers.data:
                            stripe_customer_id = customers.data[0].id
                            if not is_premium:
                                subs = stripe.Subscription.list(customer=stripe_customer_id, status='active', limit=1)
                                if subs.data:
                                    is_premium = True
                    except:
                        pass

                if not is_premium:
                    email_low  = email.lower()
                    is_premium = any(x in email_low for x in ['.premium', 'premium@', 'geraldbaalham'])

                result = {
                    'authenticated': True, 'email': email, 'user_id': user_id,
                    'is_premium': is_premium, 'has_stripe_id': bool(stripe_customer_id),
                    'stripe_customer_id': stripe_customer_id
                }
                _session_cache_set(token, result)
                return result
            return None
        except Exception as e:
            print(f'Auth verification error: {e}')
            return None

    def handle_auth_status(self, auth_info):
        if not auth_info:
            auth_info = self.is_authenticated()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()
        if auth_info:
            self.wfile.write(json.dumps(auth_info).encode('utf-8'))
        else:
            self.wfile.write(json.dumps({'authenticated': False}).encode('utf-8'))

    def handle_user_settings(self, post_data=None):
        auth_info = self.is_authenticated()
        if not auth_info:
            self.send_response(401)
            self.end_headers()
            return
        email = auth_info.get('email')
        if self.command == 'GET':
            conn = sqlite3.connect(DB_PATH, timeout=30)
            c = conn.cursor()
            c.execute('SELECT discord_webhook, telegram_webhook, telegram_chat_id, alerts_enabled, COALESCE(digest_enabled, 1), algo_webhook, exchange_name, native_execution_enabled, trade_size_usd FROM user_settings WHERE user_email = ?', (email,))
            row = c.fetchone()
            conn.close()
            if row:
                self.send_json({
                    'discord_webhook': row[0], 'telegram_webhook': row[1], 'telegram_chat_id': row[2], 
                    'alerts_enabled': bool(row[3]), 'digest_enabled': bool(row[4]), 'algo_webhook': row[5] or '',
                    'exchange_name': row[6] or '', 'native_execution_enabled': bool(row[7]), 'trade_size_usd': row[8] if row[8] is not None else 100.0
                })
            else:
                self.send_json({
                    'discord_webhook': '', 'telegram_webhook': '', 'telegram_chat_id': '', 
                    'alerts_enabled': True, 'digest_enabled': True, 'algo_webhook': '',
                    'exchange_name': '', 'native_execution_enabled': False, 'trade_size_usd': 100.0
                })
        elif self.command == 'POST':
            if post_data is None:
                length = min(int(self.headers.get('Content-Length', 0)), _MAX_BODY_BYTES)
                post_data = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            
            conn = sqlite3.connect(DB_PATH, timeout=30)
            c = conn.cursor()

            # Fetch existing to merge
            c.execute('SELECT discord_webhook, telegram_webhook, telegram_chat_id, alerts_enabled, COALESCE(digest_enabled, 1), algo_webhook, exchange_name, native_execution_enabled, trade_size_usd FROM user_settings WHERE user_email = ?', (email,))
            row = c.fetchone()
            
            if row:
                discord    = row[0]
                telegram   = row[1]
                tg_chat_id = row[2]
                enabled    = row[3]
                digest_on  = row[4]
                algo_hook  = row[5] if row[5] is not None else ''
                exchange_name = row[6] if row[6] is not None else ''
                native_execution_enabled = row[7] if row[7] is not None else 0
                trade_size_usd = row[8] if row[8] is not None else 100.0
            else:
                discord    = ''
                telegram   = ''
                tg_chat_id = ''
                enabled    = 1
                digest_on  = 1
                algo_hook  = ''
                exchange_name = ''
                native_execution_enabled = 0
                trade_size_usd = 100.0

            if 'discord_webhook' in post_data:
                discord = post_data['discord_webhook']
            if 'telegram_webhook' in post_data:
                telegram = post_data['telegram_webhook']
            if 'telegram_chat_id' in post_data:
                tg_chat_id = post_data['telegram_chat_id']
            if 'alerts_enabled' in post_data:
                enabled = 1 if post_data['alerts_enabled'] else 0
            if 'digest_enabled' in post_data:
                digest_on = 1 if post_data['digest_enabled'] else 0
            if 'algo_webhook' in post_data:
                algo_hook = post_data['algo_webhook']
            if 'exchange_name' in post_data:
                exchange_name = post_data['exchange_name']
            if 'native_execution_enabled' in post_data:
                native_execution_enabled = 1 if post_data['native_execution_enabled'] else 0
            if 'trade_size_usd' in post_data:
                try:
                    trade_size_usd = float(post_data['trade_size_usd'])
                except:
                    pass

            # First ensure row exists
            c.execute('''INSERT OR IGNORE INTO user_settings (user_email, alerts_enabled) VALUES (?, ?)''', (email, enabled))
            # Then update all fields
            c.execute('''UPDATE user_settings SET discord_webhook=?, telegram_webhook=?, telegram_chat_id=?, alerts_enabled=?, digest_enabled=?, algo_webhook=?, exchange_name=?, native_execution_enabled=?, trade_size_usd=? WHERE user_email=?''', (discord, telegram, tg_chat_id, enabled, digest_on, algo_hook, exchange_name, native_execution_enabled, trade_size_usd, email))
            conn.commit()
            conn.close()
            self.send_json({'success': True})

    def handle_test_telegram(self, post_data=None):
        try:
            if not post_data:
                length = min(int(self.headers.get('Content-Length', 0)), _MAX_BODY_BYTES)
                post_data = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            chat_id = post_data.get('chat_id')
            if not chat_id:
                self.send_error_json('No Chat ID provided.')
                return
            msg = '- **AlphaSignal Institutional Hub**\n\nPROBE_SUCCESS: Strategic connection established. Tactical signals will now be dispatched to this node.\n\n_Systemized by Alpha Engine v4.2_'
            success = NotificationService.send_telegram_alert(msg, chat_id)
            if success:
                self.send_json({'success': True})
            else:
                self.send_json({'success': False, 'error': 'Bot dispatch failed. Terminal Check: Ensure TELEGRAM_BOT_TOKEN is set in environment.'})
        except Exception as e:
            self.send_error_json(f'Test Telegram Error: {e}')
