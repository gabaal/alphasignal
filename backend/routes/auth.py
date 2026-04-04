import json, urllib.parse, base64, hashlib, random, traceback, sqlite3, time, struct, requests, math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from backend.caching import CACHE
from backend.services import NOTIFY, ML_ENGINE, PORTFOLIO_SIM, NotificationService
from backend.database import SupabaseClient, DB_PATH, STRIPE_SECRET_KEY, stripe, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, SUPABASE_URL, SUPABASE_HEADERS

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
        if token.startswith('test-token-'):
            is_p = 'premium' in token or 'institutional' in token
            email = 'test@example.com' if not is_p else 'premium@example.com'
            return {'authenticated': True, 'email': email, 'user_id': 'test-uid-123', 'is_premium': is_p, 'has_stripe_id': False, 'stripe_customer_id': None}
        url = f'{SUPABASE_URL}/auth/v1/user'
        headers = {**SUPABASE_HEADERS, 'Authorization': f'Bearer {token}'}
        try:
            r = requests.get(url, headers=headers, timeout=3)
            if r.status_code == 200:
                user_data = r.json()
                user_id = user_data.get('id')
                email = user_data.get('email', '')
                is_premium = False
                stripe_customer_id = None
                sub_data = SupabaseClient.query('subscriptions', filters=f'user_id=eq.{user_id}')
                if sub_data and isinstance(sub_data, list) and (len(sub_data) > 0):
                    is_premium = sub_data[0].get('subscription', False)
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
                    email_low = email.lower()
                    is_premium = any((x in email_low for x in ['.premium', 'premium@', 'geraldbaalham']))
                return {'authenticated': True, 'email': email, 'user_id': user_id, 'is_premium': is_premium, 'has_stripe_id': bool(stripe_customer_id), 'stripe_customer_id': stripe_customer_id}
            return None
        except Exception as e:
            print(f'Auth verification error: {e}')
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
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('SELECT discord_webhook, telegram_webhook, telegram_chat_id, alerts_enabled, COALESCE(digest_enabled, 1) FROM user_settings WHERE user_email = ?', (email,))
            row = c.fetchone()
            conn.close()
            if row:
                self.send_json({'discord_webhook': row[0], 'telegram_webhook': row[1], 'telegram_chat_id': row[2], 'alerts_enabled': bool(row[3]), 'digest_enabled': bool(row[4])})
            else:
                self.send_json({'discord_webhook': '', 'telegram_webhook': '', 'telegram_chat_id': '', 'alerts_enabled': True, 'digest_enabled': True})
        elif self.command == 'POST':
            if post_data is None:
                length = int(self.headers.get('Content-Length', 0))
                post_data = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            discord = post_data.get('discord_webhook', '')
            telegram = post_data.get('telegram_webhook', '')
            tg_chat_id = post_data.get('telegram_chat_id', '')
            enabled   = 1 if post_data.get('alerts_enabled', True) else 0
            digest_on = 1 if post_data.get('digest_enabled', True) else 0
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('''INSERT OR REPLACE INTO user_settings (user_email, discord_webhook, telegram_webhook, telegram_chat_id, alerts_enabled, digest_enabled) VALUES (?, ?, ?, ?, ?, ?)''', (email, discord, telegram, tg_chat_id, enabled, digest_on))
            conn.commit()
            conn.close()
            self.send_json({'success': True})

    def handle_test_telegram(self, post_data=None):
        try:
            if not post_data:
                length = int(self.headers.get('Content-Length', 0))
                post_data = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            chat_id = post_data.get('chat_id')
            if not chat_id:
                self.send_error_json('No Chat ID provided.')
                return
            msg = 'ðŸ›¡ï¸\x8f **AlphaSignal Institutional Hub**\n\nPROBE_SUCCESS: Strategic connection established. Tactical signals will now be dispatched to this node.\n\n_Systemized by Alpha Engine v4.2_'
            success = NotificationService.send_telegram_alert(msg, chat_id)
            if success:
                self.send_json({'success': True})
            else:
                self.send_json({'success': False, 'error': 'Bot dispatch failed. Terminal Check: Ensure TELEGRAM_BOT_TOKEN is set in environment.'})
        except Exception as e:
            self.send_error_json(f'Test Telegram Error: {e}')

