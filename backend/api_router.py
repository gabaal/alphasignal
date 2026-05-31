import json, urllib.parse, base64, hashlib, random, traceback, sqlite3, time, struct, requests, math, threading, os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from backend.caching import CACHE
from backend.services import NOTIFY, ML_ENGINE, PORTFOLIO_SIM
from backend.database import SupabaseClient, DB_PATH, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, stripe, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, SUPABASE_URL, SUPABASE_HEADERS

from backend.routes.auth import (AuthRoutesMixin, _session_cache_invalidate,
                                  _check_login_lockout, _record_login_failure,
                                  _clear_login_attempts, _LOGIN_WINDOW)
from backend.routes.market import MarketRoutesMixin
from backend.routes.institutional import InstitutionalRoutesMixin
from backend.routes.ai_engine import AIEngineRoutesMixin
from backend.routes.personal import PersonalRoutesMixin
from backend.routes.digest import DigestRoutesMixin
from backend.routes.price_alerts import PriceAlertRoutesMixin, start_price_alert_checker as _pa_start
from backend.routes.telegram_bot import start_bot as _tg_start  # noqa
import socketserver, http.server

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

# Allowed CORS origins - add staging/preview URLs as needed
_ALLOWED_ORIGINS = {
    'https://alphasignal.digital',
    'https://www.alphasignal.digital',
    'http://localhost:8006',
    'http://127.0.0.1:8006',
}

# Max request body: 1 MB
_MAX_BODY_BYTES = 1 * 1024 * 1024

# - S2: Per-IP rate limiter -
_RATE_BUCKETS: dict = {}
_RATE_LOCK     = threading.Lock()

_RATE_LIMITS = {
    'auth':    10,   # login / signup - 10 req/min per IP
    'ai':       20,  # AI analyst / ask-terminal / signal-thesis
    'default': 600,  # everything else
}

def _rate_key(path: str) -> str:
    if '/api/user/ai-memory' in path:
        return 'default'
    if '/auth/login' in path or '/auth/signup' in path:
        return 'auth'
    if any(x in path for x in ('ai-analyst', 'ask-terminal', 'signal-thesis', 'ai-memo', 'ai-trade-now', 'explain-surface', 'explain-tape', 'explain-chart', 'explain-rebalance')):
        return 'ai'
    return 'default'

def _rate_check(ip: str, path: str) -> bool:
    """Return True if request is allowed, False if rate-limited."""
    key   = _rate_key(path)
    limit = _RATE_LIMITS[key]
    now   = time.time()
    with _RATE_LOCK:
        bucket = _RATE_BUCKETS.setdefault(ip, {}).setdefault(key, [])
        bucket[:] = [t for t in bucket if now - t < 60]
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True


class AlphaHandler(http.server.SimpleHTTPRequestHandler, AuthRoutesMixin, MarketRoutesMixin, InstitutionalRoutesMixin, AIEngineRoutesMixin, PersonalRoutesMixin, DigestRoutesMixin, PriceAlertRoutesMixin):
    def end_headers(self):
        # Strict CORS - reflect origin only if it's in the allowlist
        origin = self.headers.get('Origin', '')
        cors_origin = origin if origin in _ALLOWED_ORIGINS else 'https://alphasignal.digital'
        self.send_header('Access-Control-Allow-Origin', cors_origin)
        self.send_header('Vary', 'Origin')
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        super().end_headers()

    def log_message(self, fmt, *args):
        """Suppress static asset log noise."""
        if args and any(str(args[0]).endswith(x) for x in ('.js', '.css', '.png', '.ico', '.woff2')):
            return
        super().log_message(fmt, *args)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, prefer')
        self.end_headers()

    def do_DELETE(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path.rstrip('/')
            auth_info = self.is_authenticated()
            if not auth_info:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
                return
            # Extract ID from path: /api/watchlist/123 or /api/positions/123
            parts = path.split('/')
            item_id = parts[-1] if len(parts) > 1 else None
            if path.startswith('/api/watchlist'):
                self.handle_watchlist_delete(auth_info, item_id)
            elif path.startswith('/api/positions'):
                self.handle_positions_delete(auth_info, item_id)
            elif path.startswith('/api/price-alerts'):
                self.handle_price_alerts_delete(auth_info, item_id)
            elif path.startswith('/api/trade-ledger'):
                self.handle_trade_ledger_delete(auth_info, item_id)
            elif path.startswith('/api/algo-bots'):
                query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                q_id = query.get('id', [None])[0]
                self.handle_trading_bots_delete(auth_info, q_id or item_id)
            elif path.startswith('/api/user/exchange-keys'):
                # Extract id from query if it exists instead of path segment
                query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                q_id = query.get('id', [None])[0]
                self.handle_exchange_keys_delete(auth_info, q_id or item_id)
            elif path.startswith('/api/user/ai-memory'):
                query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                q_id = query.get('id', [None])[0]
                self.handle_ai_knowledge_delete(auth_info, q_id or item_id)
            elif path.startswith('/api/signal-notes'):
                self.handle_signal_notes_delete()
            else:
                self.send_response(404)
                self.end_headers()
        except Exception as e:
            print(f'[{datetime.now()}] DELETE Error: {e}')
            self.send_error(500, 'Internal server error')

    def do_PATCH(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path.rstrip('/')
            auth_info = self.is_authenticated()
            if not auth_info:
                self.send_response(401); self.send_header('Content-Type','application/json'); self.end_headers()
                self.wfile.write(json.dumps({'error':'Unauthorized'}).encode()); return
            length = min(int(self.headers.get('Content-Length', 0)), _MAX_BODY_BYTES)
            body = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            parts = path.split('/')
            item_id = parts[-1] if len(parts) > 1 else None
            if path.startswith('/api/watchlist'):
                self.handle_watchlist_patch(auth_info, item_id, body)
            elif path.startswith('/api/trade-ledger'):
                self.handle_trade_ledger_patch(auth_info, item_id, body)
            else:
                self.send_response(404); self.end_headers()
        except Exception as e:
            print(f'[{datetime.now()}] PATCH Error: {e}')
            self.send_error(500, 'Internal server error')

    def send_json(self, data):
        try:
            def sanitize(obj):
                if isinstance(obj, (float, np.float64, np.float32)):
                    if np.isnan(obj) or np.isinf(obj):
                        return 0.0
                    return float(obj)
                if isinstance(obj, (np.int64, np.int32, np.int16, np.int8)):
                    return int(obj)
                if isinstance(obj, np.ndarray):
                    return [sanitize(i) for i in obj.tolist()]
                if isinstance(obj, dict):
                    return {k: sanitize(v) for k, v in obj.items()}
                if isinstance(obj, list):
                    return [sanitize(i) for i in obj]
                if pd.isna(obj) if hasattr(pd, 'isna') else False:
                    return None
                return obj
            clean_data = sanitize(data)
            json_bytes = json.dumps(clean_data, default=str).encode('utf-8')
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(json_bytes)))
            self.end_headers()
            self.wfile.write(json_bytes)
        except Exception as e:
            print(f'[{datetime.now()}] send_json error: {e}')

    def send_error_json(self, message, code=400):
        try:
            print(f'[{datetime.now()}] API_ERROR ({code}): {message}')
            json_bytes = json.dumps({'error': str(message), 'success': False}).encode('utf-8')
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(json_bytes)))
            self.end_headers()
            self.wfile.write(json_bytes)
        except Exception as e:
            print(f'[{datetime.now()}] send_error_json error: {e}')

    def do_POST(self):
        # S2: rate limit before any processing
        ip = self.client_address[0]
        if not _rate_check(ip, self.path):
            self.send_response(429)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Retry-After', '60')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Rate limit exceeded. Slow down.'}).encode())
            return
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            length = min(int(self.headers.get('Content-Length', 0)), _MAX_BODY_BYTES)
            post_data = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            if path == '/api/admin/purge-equities':
                try:
                    conn = sqlite3.connect(DB_PATH, timeout=30)
                    c = conn.cursor()
                    symbols = ('AMD', 'TSLA', 'PLTR', 'NVDA', 'SMCI', 'KULR', 'MIGI', 'SMLR')
                    tables_ticker = ['alerts_history', 'tracked_tickers', 'watchlist', 'positions', 'price_alerts']
                    tables_symbol = ['market_ticks', 'ml_predictions', 'sentiment_history']
                    
                    stats = {}
                    for table in tables_ticker:
                        try:
                            c.execute(f"DELETE FROM {table} WHERE ticker IN {symbols}")
                            stats[table] = c.rowcount
                        except: pass
                        
                    for table in tables_symbol:
                        try:
                            c.execute(f"DELETE FROM {table} WHERE symbol IN {symbols}")
                            stats[table] = c.rowcount
                        except: pass
                        
                    conn.commit()
                    conn.close()
                    self.send_json({'success': True, 'deleted_counts': stats})
                except Exception as e:
                    self.send_error_json(str(e))
                return
            elif path == '/api/admin/clear-alerts':
                try:
                    if post_data.get('password') != '@WatchBottle13@':
                        return self.send_error_json('Unauthorized', 401)
                    conn = sqlite3.connect(DB_PATH, timeout=30)
                    c = conn.cursor()
                    c.execute("DELETE FROM alerts_history")
                    count = c.rowcount
                    conn.commit()
                    conn.close()
                    self.send_json({'success': True, 'deleted': count})
                except Exception as e:
                    self.send_error_json(str(e))
                return
            elif path == '/api/auth/login':
                email_attempt = post_data.get('email', '')
                # S4: lockout check
                if _check_login_lockout(email_attempt):
                    self.send_response(429)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Retry-After', str(_LOGIN_WINDOW))
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Account temporarily locked. Try again in 15 minutes.'}).encode())
                    return
                res = SupabaseClient.auth_login(email_attempt, post_data.get('password'))
                # Dev test tokens only in non-production
                if os.getenv('APP_ENV', 'development') != 'production':
                    if email_attempt == 'user@example.com':
                        res = {'access_token': 'test-token-basic', 'user': {'id': 'test-uid-basic', 'email': 'user@example.com'}}
                    elif email_attempt == 'premium@example.com':
                        res = {'access_token': 'test-token-premium', 'user': {'id': 'test-uid-premium', 'email': 'premium@example.com'}}
                    elif email_attempt == 'gatest@outlook.com':
                        res = {'access_token': 'test-token-premium', 'user': {'id': 'test-uid-premium', 'email': 'gatest@outlook.com'}}
                if 'access_token' in res:
                    _clear_login_attempts(email_attempt)  # S4: reset on success
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Set-Cookie', f"sb-access-token={res['access_token']}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600")
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True, 'user': res['user']}).encode('utf-8'))
                else:
                    _record_login_failure(email_attempt)  # S4: track failure
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(res).encode('utf-8'))
            elif path == '/api/auth/signup':
                res = SupabaseClient.auth_signup(post_data.get('email'), post_data.get('password'))
                # Supabase returns user at top level {'id':..,'email':..} when email confirmation is ON
                # or nested under 'user' key when confirmation is OFF
                user_obj = res.get('user') or (res if 'id' in res and 'email' in res else None)
                if user_obj:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    # If access_token present (no email confirm required), set the cookie
                    if 'access_token' in res:
                        self.send_header('Set-Cookie', f"sb-access-token={res['access_token']}; Path=/; HttpOnly; Max-Age=3600")
                    self.wfile.write(json.dumps({'success': True, 'user': user_obj}).encode('utf-8'))
                else:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(res).encode('utf-8'))
            elif path == '/api/auth/logout':
                # S1: invalidate session cache so the token can't be reused
                token = self.get_auth_token()
                if token:
                    _session_cache_invalidate(token)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Set-Cookie', 'sb-access-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            elif path == '/api/stripe/create-checkout-session':
                auth_info = self.is_authenticated()
                if not auth_info:
                    print(f'[{datetime.now()}] Checkout Error: User not authenticated')
                    self.send_response(401)
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
                    return
                try:
                    origin = self.headers.get('Origin') or 'http://localhost:8006'
                    cust_email = auth_info.get('email')
                    stripe_params = {'payment_method_types': ['card'], 'line_items': [{'price_data': {'currency': 'usd', 'product_data': {'name': 'AlphaSignal Institutional Subscription', 'description': 'Real-time multi-asset intelligence dashboard access.'}, 'unit_amount': 799, 'recurring': {'interval': 'month'}}, 'quantity': 1}], 'mode': 'subscription', 'success_url': f'{origin}/?session_id={{CHECKOUT_SESSION_ID}}', 'cancel_url': f'{origin}/', 'metadata': {'user_id': auth_info.get('user_id')}}
                    if cust_email and '@' in cust_email and ('.' in cust_email):
                        stripe_params['customer_email'] = cust_email
                    checkout_session = stripe.checkout.Session.create(**stripe_params)
                    print(f"[{datetime.now()}] Stripe Session Created: {checkout_session.id} for user {auth_info.get('user_id')}")
                    self.send_json({'id': checkout_session.id})
                except Exception as e:
                    print(f'[{datetime.now()}] Stripe Session Error: {e}')
                    import traceback
                    traceback.print_exc()
                    self.send_error(500, 'Internal server error')
            elif path == '/api/stripe/webhook':
                length = min(int(self.headers.get('Content-Length', 0)), _MAX_BODY_BYTES)
                payload = self.rfile.read(length)
                sig_header = self.headers.get('Stripe-Signature')
                webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
                event = None
                try:
                    if webhook_secret and sig_header:
                        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
                    else:
                        event = json.loads(payload)
                except Exception as e:
                    print(f'[{datetime.now()}] Webhook Verification Error: {e}')
                    self.send_error(400, 'Invalid payload')
                    return
                try:
                    event_type = event.get('type')
                    data_object = event.get('data', {}).get('object', {})
                    print(f'[{datetime.now()}] Webhook Received: {event_type}')
                    if event_type == 'checkout.session.completed':
                        session = data_object
                        user_id = session.get('metadata', {}).get('user_id')
                        if user_id:
                            print(f'[{datetime.now()}] Webhook: Fulfillment for {user_id}')
                            payload = {'user_id': user_id, 'subscription': True, 'updated_at': datetime.now().isoformat()}
                            if session.get('customer'):
                                payload['stripe_customer_id'] = session.get('customer')
                            res = SupabaseClient.upsert('subscriptions', payload)
                            if not res and 'stripe_customer_id' in payload:
                                print(f'[{datetime.now()}] Retrying upsert without stripe_customer_id...')
                                del payload['stripe_customer_id']
                                SupabaseClient.upsert('subscriptions', payload)
                    elif event_type in ['customer.subscription.deleted', 'customer.subscription.updated']:
                        subscription = data_object
                        customer_id = subscription.get('customer')
                        status = subscription.get('status')
                        if customer_id:
                            url = f'{SUPABASE_URL}/rest/v1/subscriptions?stripe_customer_id=eq.{customer_id}'
                            res_raw = requests.get(url, headers=SUPABASE_HEADERS, timeout=5)
                            if res_raw.status_code == 400:
                                print(f'[{datetime.now()}] Schema mismatch: searching for user via Stripe email fallback...')
                                try:
                                    cust_obj = stripe.Customer.retrieve(customer_id)
                                    email = cust_obj.get('email')
                                    if email:
                                        pass
                                except:
                                    pass
                            res = res_raw.json() if res_raw.status_code == 200 else []
                            if res and isinstance(res, list) and (len(res) > 0):
                                user_id = res[0].get('user_id')
                                is_active = status == 'active'
                                print(f'[{datetime.now()}] Webhook: Syncing sub for {user_id} (Status: {status})')
                                payload = {'user_id': user_id, 'subscription': is_active, 'updated_at': datetime.now().isoformat()}
                                if customer_id:
                                    payload['stripe_customer_id'] = customer_id
                                u_res = SupabaseClient.upsert('subscriptions', payload)
                                if not u_res and 'stripe_customer_id' in payload:
                                    del payload['stripe_customer_id']
                                    SupabaseClient.upsert('subscriptions', payload)
                    self.send_json({'status': 'received'})
                except Exception as e:
                    print(f'[{datetime.now()}] Webhook Processing Error: {e}')
                    self.send_error(500, 'Processing Error')
            elif path == '/api/stripe/create-portal-session':
                auth_info = self.is_authenticated()
                if not auth_info:
                    self.send_response(401)
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'AUTHENTICATION_REQUIRED: Please log in again.'}).encode('utf-8'))
                    return
                if not auth_info.get('stripe_customer_id'):
                    print(f"[{datetime.now()}] Portal Error: User {auth_info.get('email')} has no stripe_customer_id")
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'METRIC_ERROR: No active Stripe subscription found for this account. If you just subscribed, please wait a moment.'}).encode('utf-8'))
                    return
                try:
                    origin = self.headers.get('Origin') or 'http://localhost:8006'
                    portal_session = stripe.billing_portal.Session.create(customer=auth_info.get('stripe_customer_id'), return_url=f'{origin}/')
                    self.send_json({'url': portal_session.url})
                except Exception as e:
                    print(f'[{datetime.now()}] Stripe Portal Error: {e}')
                    self.send_error(500, 'Internal server error')
            elif path == '/api/user/settings':
                self.handle_user_settings(post_data)
            elif path == '/api/user/algo-params':
                self.handle_algo_params(post_data)
            elif path == '/api/alert-settings':
                self.handle_alert_settings(post_data)
            elif path == '/api/trade-ledger':
                self.handle_trade_ledger(post_data)
            elif path == '/api/signal-notes':
                self.handle_signal_notes_post(post_data)
            elif path == '/api/settings/test-telegram':
                self.handle_test_telegram(post_data)
            elif path == '/api/portfolio/execute':
                self.handle_portfolio_execute(post_data)
            elif path == '/api/ask-terminal':
                self.handle_ask_terminal(post_data)
            elif path == '/api/explain-surface':
                self.handle_explain_surface(post_data)
            elif path == '/api/explain-tape':
                self.handle_explain_tape(post_data)
            elif path == '/api/explain-chart':
                self.handle_explain_chart(post_data)
            elif path == '/api/explain-rebalance':
                self.handle_explain_rebalance(post_data)
            elif path == '/api/options-synthesis':
                self.handle_explain_options(post_data)
            elif path == '/api/watchlist':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_watchlist_post(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/positions':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_positions_post(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/digest/send':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_digest_send(auth_info)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/price-alerts':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_price_alerts_post(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/onboarding-complete':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_onboarding_complete(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/user/exchange-keys':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_exchange_keys_post(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/user/ai-memory':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_ai_knowledge_post(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/algo-bots':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_trading_bots_post(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/algo-bots/toggle':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_trading_bots_toggle(auth_info, post_data.get('id'))
                else: self.send_response(401); self.end_headers()
            elif path == '/api/algo-bots/backtest':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_algo_backtest(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/execute-trade':
                auth_info = self.is_authenticated()
                if auth_info: self.handle_execute_trade(auth_info, post_data)
                else: self.send_response(401); self.end_headers()
            elif path.startswith('/api/signal/') and path.endswith('/close'):
                # POST /api/signal/{id}/close  - manually deactivate a signal
                auth_info = self.is_authenticated()
                if not auth_info:
                    self.send_response(401); self.end_headers(); return
                try:
                    sig_id = int(path.split('/')[3])
                    from datetime import datetime as _dt
                    exit_px = None; final_roi = None
                    # Fetch entry price + type to compute final ROI at close time
                    with sqlite3.connect(DB_PATH, timeout=30) as conn:
                        c = conn.cursor()
                        c.execute("SELECT price, type, ticker, user_email FROM alerts_history WHERE id=?", (sig_id,))
                        sig_row = c.fetchone()
                    if sig_row:
                        entry_p, sig_type, ticker, sig_owner = sig_row
                        # Security: only the owning user (or legacy NULL-owner) can close
                        if sig_owner and sig_owner != auth_info.get('email'):
                            self.send_response(403)
                            self.send_header('Content-Type', 'application/json')
                            self.send_header('Access-Control-Allow-Origin', '*')
                            self.end_headers()
                            self.wfile.write(b'{"error":"forbidden"}')
                            return
                        cached = InstitutionalRoutesMixin._price_cache.get(ticker)
                        if cached:
                            exit_px = cached[0]
                        else:
                            # Quick live fetch for this one ticker
                            try:
                                import yfinance as yf
                                candidates = [ticker] + ([ticker+'-USD'] if '-' not in ticker else [ticker[:-4]])
                                for sym in candidates:
                                    try:
                                        info = yf.Ticker(sym).fast_info
                                        px = info.get('last_price') or info.get('lastPrice')
                                        if px and float(px) > 0:
                                            exit_px = round(float(px), 6)
                                            break
                                    except: continue
                            except: pass
                        BULLISH_T = {'ML_LONG','RSI_OVERSOLD','MACD_BULLISH_CROSS','REGIME_BULL','WHALE_ACCUMULATION',
                                     'VOLUME_SPIKE','MOMENTUM_BREAKOUT','ALPHA_DIVERGENCE_LONG','ML_ALPHA_PREDICTION'}
                        if exit_px and entry_p and entry_p > 0:
                            direction = 1 if (sig_type or '').upper() in BULLISH_T else -1
                            final_roi = round(direction * (exit_px - entry_p) / entry_p * 100, 2)
                    with sqlite3.connect(DB_PATH, timeout=30) as conn:
                        c = conn.cursor()
                        c.execute("UPDATE alerts_history SET status='closed', closed_at=?, exit_price=?, final_roi=? WHERE id=?",
                                  (_dt.utcnow().isoformat(), exit_px, final_roi, sig_id))
                        conn.commit()
                    InstitutionalRoutesMixin._sig_history_cache.clear()
                    self.send_json({'success': True, 'id': sig_id, 'state': 'CLOSED',
                                    'exit_price': exit_px, 'final_roi': final_roi})
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    self.send_error(500, 'Internal server error')
            elif path.startswith('/api/signal/') and path.endswith('/reopen'):
                # POST /api/signal/{id}/reopen - re-activate a closed signal
                auth_info = self.is_authenticated()
                if not auth_info:
                    self.send_response(401); self.end_headers(); return
                try:
                    sig_id = int(path.split('/')[3])
                    conn = sqlite3.connect(DB_PATH, timeout=30)
                    c = conn.cursor()
                    # Security: verify the signal belongs to this user
                    c.execute("SELECT user_email FROM alerts_history WHERE id=?", (sig_id,))
                    owner_row = c.fetchone()
                    if owner_row and owner_row[0] and owner_row[0] != auth_info.get('email'):
                        conn.close()
                        self.send_response(403)
                        self.send_header('Content-Type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(b'{"error":"forbidden"}')
                        return
                    c.execute("UPDATE alerts_history SET status='active', closed_at=NULL, exit_price=NULL, final_roi=NULL WHERE id=?", (sig_id,))
                    conn.commit(); conn.close()
                    InstitutionalRoutesMixin._sig_history_cache.clear()
                    self.send_json({'success': True, 'id': sig_id, 'state': 'ACTIVE'})
                except Exception as e:
                    self.send_error(500, 'Internal server error')
            else:
                self.send_error(404, 'Path not found')
        except Exception as e:
            print(f'[{datetime.now()}] POST Error: {e}')
            self.send_error(500, 'Internal server error')

    def _proxy_websocket(self):
        import socket
        import select
        try:
            ws_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            ws_sock.connect(('127.0.0.1', 8007))
            req_line = f"{self.command} {self.path} {self.request_version}\r\n"
            ws_sock.sendall(req_line.encode('utf-8'))
            for k, v in self.headers.items():
                ws_sock.sendall(f"{k}: {v}\r\n".encode('utf-8'))
            ws_sock.sendall(b"\r\n")
            while True:
                r, _, _ = select.select([self.connection, ws_sock], [], [], 300)
                if not r: break
                if self.connection in r:
                    try: data = self.connection.recv(8192)
                    except: break
                    if not data: break
                    ws_sock.sendall(data)
                if ws_sock in r:
                    try: data = ws_sock.recv(8192)
                    except: break
                    if not data: break
                    self.connection.sendall(data)
        except Exception as e:
            print(f"[{datetime.now()}] WS Proxy Error: {e}")
        finally:
            try: ws_sock.close()
            except: pass

    def do_GET(self):

        if self.path == '/ws':
            self._proxy_websocket()
            return
        
        # URL normalization for SEO (301 Redirects)
        parsed = urllib.parse.urlparse(self.path)
        orig_path = parsed.path
        query = parsed.query
        
        # Bypassed for API routes and health check
        is_api = orig_path.startswith('/api/') or orig_path == '/health'
        
        # Bypassed for static assets with specific extensions (excluding .html)
        static_extensions = {'.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.json', '.xml', '.webmanifest', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.mp4'}
        _, ext = os.path.splitext(orig_path.lower())
        is_static_asset = ext in static_extensions
        
        if not is_api and not is_static_asset:
            normalized_path = orig_path
            
            # 1. Index variants
            if normalized_path.endswith('/index.html'):
                normalized_path = normalized_path[:-11]
            elif normalized_path.endswith('/index'):
                normalized_path = normalized_path[:-6]
            if normalized_path == '':
                normalized_path = '/'
                
            # 2. File extensions (redirect .html)
            if normalized_path.endswith('.html') and normalized_path != '.html':
                normalized_path = normalized_path[:-5]
                
            # 3. Case normalization for asset tickers
            parts = normalized_path.split('/')
            if len(parts) >= 3 and parts[1] == 'asset':
                ticker = parts[2]
                if ticker != ticker.upper():
                    parts[2] = ticker.upper()
                    normalized_path = '/'.join(parts)
            
            # 4. Trailing slashes (except root /)
            if normalized_path.endswith('/') and normalized_path != '/':
                normalized_path = normalized_path.rstrip('/')
                
            if not normalized_path:
                normalized_path = '/'
                
            if normalized_path != orig_path:
                redirect_url = normalized_path
                if query:
                    redirect_url += '?' + query
                
                print(f"[{datetime.now()}] SEO 301 Redirect: {self.path} -> {redirect_url}", flush=True)
                self.send_response(301)
                self.send_header('Location', redirect_url)
                self.send_header('Cache-Control', 'public, max-age=31536000')
                self.end_headers()
                return

        # --- pSEO: Asset-specific deep landing pages (HIGH PRIORITY) ---
        clean_path = self.path.split('?')[0].rstrip('/')
        path_parts = clean_path.split('/')
        if clean_path.startswith('/asset/') and len(path_parts) == 3:
            try:
                ticker = path_parts[-1].upper()
                clean_ticker = ticker.replace('-USD', '')
                print(f"[{datetime.now()}] !!! pSEO_ROUTER_HIT: {clean_ticker} !!!", flush=True)
                
                # Pre-warm signals cache if empty (ensures pSEO values aren't 0.0 on cold boot)
                sc = InstitutionalRoutesMixin._signals_cache
                if not sc or not sc.get('data'):
                    print(f"[{datetime.now()}] pSEO: Signals cache empty, triggering background sync...", flush=True)
                    # We trigger handle_signals but since we are not in a standard request-response loop 
                    # for the JSON part, we just let it populate the class-level _signals_cache.
                    # Note: we ignore the send_json failure if it happens.
                    try:
                        # We create a dummy handler to run the logic without sending response to THIS client
                        self.handle_signals()
                    except: pass

                self.handle_asset_seo(clean_ticker)
                return
            except Exception as e:
                print(f"[{datetime.now()}] !!! pSEO_ROUTER_CRASH: {e} !!!", flush=True)
                traceback.print_exc()
                # Fallback to home if pSEO fails
                self.path = '/'
                super().do_GET()
                return
            
        if clean_path.startswith('/signal/') and len(path_parts) == 3:
            try:
                signal_id = int(path_parts[-1])
                print(f"[{datetime.now()}] !!! pSEO_SIGNAL_HIT: {signal_id} !!!", flush=True)
                self.handle_signal_seo(signal_id)
                return
            except Exception as e:
                print(f"[{datetime.now()}] !!! pSEO_SIGNAL_CRASH: {e} !!!", flush=True)
                traceback.print_exc()
                self.path = '/'
                super().do_GET()
                return

        # --- SEO 301: /explain-{slug} -> /docs/{slug} (legacy explain-* routes) ---
        # These were previously client-side only (JS switchView). Now Googlebot gets a
        # proper 301, consolidating any link equity from old indexed /explain-* URLs.
        _EXPLAIN_MAP = {
            # Direct docs-* equivalents
            'explain-signals':        '/docs/signals',
            'explain-briefing':       '/docs/briefing',
            'explain-liquidity':      '/docs/order-flow',
            'explain-flow':           '/docs/order-flow',
            'explain-whales':         '/docs/whale-pulse',
            'explain-ml-engine':      '/docs/ml-engine',
            'explain-mindshare':      '/docs/narrative',
            'explain-narrative':      '/docs/narrative',
            'explain-benchmark':      '/docs/performance',
            'explain-performance':    '/docs/performance',
            'explain-alerts':         '/docs/alerts',
            'explain-zscore':         '/docs/signals',
            'explain-alpha':          '/docs/alpha-score',
            'explain-alpha-score':    '/docs/alpha-score',
            'explain-correlation':    '/docs/onchain',
            'explain-onchain':        '/docs/onchain',
            'explain-sentiment':      '/docs/newsroom',
            'explain-newsroom':       '/docs/newsroom',
            'explain-risk':           '/docs/risk-matrix',
            'explain-playbook':       '/docs/strategy-lab',
            'explain-strategy-lab':   '/docs/strategy-lab',
            'explain-regimes':        '/docs/regime',
            'explain-signal-archive': '/docs/signal-archive',
            'explain-portfolio-lab':  '/docs/portfolio-optimizer',
            'explain-backtester-v2':  '/docs/backtester',
            'explain-tradingview':    '/docs/tradingview-hub',
            'explain-etf-flows':      '/docs/etf-flows',
            'explain-liquidations':   '/docs/liquidations',
            'explain-oi-radar':       '/docs/oi-radar',
            'explain-cme-gaps':       '/docs/cme-gaps',
            'explain-rotation':       '/docs/rotation',
            'explain-macro-compass':  '/docs/macro-compass',
            'explain-macro-calendar': '/docs/macro-calendar',
            'explain-token-unlocks':  '/docs/token-unlocks',
            'explain-yield-lab':      '/docs/yield-lab',
            'explain-tradelab':       '/docs/tradelab',
            'explain-options-flow':   '/docs/options-flow',
            'explain-trade-ledger':   '/docs/trade-ledger',
            'explain-command-center': '/docs/command-center',
            'explain-ask-terminal':   '/docs/ask-terminal',
            'explain-my-terminal':    '/docs/my-terminal',
            # Ones that had no docs equivalent - send to /help
            'explain-api':            '/help',
            'explain-glossary':       '/help',
            'explain-velocity':       '/help',
            'explain-telegram':       '/help',
            'explain-pwa':            '/help',
            'explain-heatmap':        '/help',
            'explain-ai-engine':      '/help',
            'explain-topologies':     '/help',
        }
        if clean_path.startswith('/explain-') and len(path_parts) == 2:
            slug = path_parts[-1]  # e.g. 'explain-signals'
            new_path = _EXPLAIN_MAP.get(slug, '/help')
            print(f"[{datetime.now()}] SEO 301 explain: {clean_path} -> {new_path}", flush=True)
            self.send_response(301)
            self.send_header('Location', new_path)
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            return


        # The sitemap previously listed /docs-etf-flows style URLs. These now 301 to
        # /docs/etf-flows so all canonicals are consistent and Google can reindex cleanly.
        if clean_path.startswith('/docs-') and len(path_parts) == 2:
            slug = path_parts[-1][5:]  # strip leading 'docs-'
            new_path = f'/docs/{slug}'
            print(f"[{datetime.now()}] SEO 301 docs flat: {clean_path} -> {new_path}", flush=True)
            self.send_response(301)
            self.send_header('Location', new_path)
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            return

        # --- pSEO: docs/* pages - inject server-side canonical + title ---
        # Converts /docs/signals -> view key 'docs-signals', serves index.html with correct meta
        if clean_path.startswith('/docs/') and len(path_parts) == 3:
            try:
                doc_slug = path_parts[-1]  # e.g. 'signals', 'etf-flows'
                view_key = f'docs-{doc_slug}'
                print(f"[{datetime.now()}] pSEO_DOCS_HIT: {view_key}", flush=True)
                self.handle_docs_seo(view_key, clean_path)
                return
            except Exception as e:
                print(f"[{datetime.now()}] pSEO_DOCS_CRASH: {e}", flush=True)
                traceback.print_exc()
                # Fallback to plain index.html
                self.path = '/'
                super().do_GET()
                return

        # --- pSEO: academy-watch page ---
        if clean_path == '/academy-watch':
            try:
                self.handle_docs_seo('academy-watch', clean_path)
                return
            except Exception as e:
                print(f"[{datetime.now()}] pSEO_ACADEMY_WATCH_CRASH: {e}", flush=True)
                self.path = '/'
                super().do_GET()
                return


        # S2: rate limit GET requests (AI endpoints get stricter limit)
        ip = self.client_address[0]
        if self.path.startswith('/api/') and not _rate_check(ip, self.path):
            self.send_response(429)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Retry-After', '60')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Rate limit exceeded. Slow down.'}).encode())
            return
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            query_params = urllib.parse.parse_qs(parsed.query)
            if 'session_id' in query_params:
                session_id = query_params['session_id'][0]
                try:
                    session = stripe.checkout.Session.retrieve(session_id)
                    if session.payment_status == 'paid' or session.status == 'complete':
                        user_id = session.metadata.get('user_id')
                        if user_id:
                            print(f'[{datetime.now()}] FULFILLMENT: Updating subscription for user {user_id}')
                            SupabaseClient.query('subscriptions', method='POST', data={'user_id': user_id, 'subscription': True, 'stripe_customer_id': session.customer, 'updated_at': datetime.now().isoformat()})
                except Exception as e:
                    print(f'[{datetime.now()}] FULFILLMENT ERROR: {e}')
            path = path.rstrip('/')

            auth_info = None
            if path.startswith('/api/'):
                public_routes = [
                    # Fully public — no auth required
                    '/api/dev/mock-signals', '/health', '/api/config', '/api/signals', '/api/btc',
                    '/api/market-pulse', '/api/auth/status', '/api/fear-greed', '/api/news',
                    '/api/signal-permalink', '/api/telegram/link', '/api/signal-radar',
                    '/api/signal-density', '/api/system-dials', '/api/signal-leaderboard',
                    '/api/funding-rates', '/api/options-signal', '/api/prices', '/api/universe',
                    '/api/signal-thesis', '/api/admin/purge-equities', '/api/og-image',
                    # Command Center — fully public
                    '/api/macro', '/api/ai-trade-now', '/api/regime', '/api/correlation-matrix',
                    '/api/etf-flows', '/api/cme-gaps', '/api/capital-rotation', '/api/mindshare',
                    '/api/risk', '/api/depeg', '/api/macro-calendar', '/api/options-flow',
                    '/api/equity-options-flow', '/api/ai-rebalancer', '/api/signal-history',
                    '/api/alerts', '/api/alerts/badge', '/api/klines', '/api/equity-klines',
                    '/api/liquidity', '/api/liquidity-history', '/api/ai_analyst', '/api/atr',
                    '/api/whales', '/api/gex-profile', '/api/options-max-pain',
                    '/api/volume-profile', '/api/lob-heatmap', '/api/oi-funding-heatmap',
                    '/api/global-liquidity-heatmap',
                    '/api/volatility-surface', '/api/monte-carlo', '/api/factor-web', '/api/sankey',
                    '/api/footprint',
                    '/api/orderbook',
                    '/api/tape',
                    '/api/liquidation-map',
                    '/api/stripe/webhook',
                    '/privacy', '/terms', '/roadmap',
                ]
                free_auth_routes = [
                    # Account management — login required, no premium needed
                    '/api/watchlist', '/api/positions', '/api/oms-dashboard', '/api/digest/send',
                    '/api/price-alerts', '/api/market-brief', '/api/onboarding-complete',
                    '/api/alert-settings', '/api/user/settings', '/api/user/ai-memory',
                    '/api/stripe/',
                ]
                # /api/signal/{id} is fully public - no auth gate for shared links
                if path.startswith('/api/signal/'):
                    pass  # skip gate, handle_signal_permalink does not require auth
                elif not any(path.startswith(r) for r in public_routes):
                    auth_info = self.is_authenticated()
                    if not auth_info:
                        print(f'[{datetime.now()}] AUTH FAIL: {path}')
                        self.send_response(401)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
                        return
                    if not auth_info.get('is_premium', False) and not any(path.startswith(r) for r in free_auth_routes):
                        print(f'[{datetime.now()}] PREMIUM REJECT: {path}')
                        self.send_response(402)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': 'Subscription Required'}).encode('utf-8'))
                        return
                elif path == '/api/auth/status':
                    auth_info = self.is_authenticated()

            if path == '/api/auth/status':
                self.handle_auth_status(auth_info)
            elif path == '/api/admin/purge-equities':
                import sqlite3
                from backend.database import DB_PATH, UNIVERSE
                NON_CRYPTO = list(set(UNIVERSE.get('EQUITIES', []) + UNIVERSE.get('TREASURY', [])))
                if not NON_CRYPTO:
                    self.send_json({"status": "ok", "message": "No non-crypto equities to purge"})
                    return
                try:
                    conn = sqlite3.connect(DB_PATH, timeout=30)
                    c = conn.cursor()
                    placeholders = ','.join(['?']*len(NON_CRYPTO))
                    c.execute(f"DELETE FROM alerts_history WHERE ticker IN ({placeholders})", NON_CRYPTO)
                    ah_deleted = c.rowcount
                    c.execute(f"DELETE FROM market_ticks WHERE symbol IN ({placeholders})", NON_CRYPTO)
                    mt_deleted = c.rowcount
                    conn.commit()
                    conn.close()
                    self.send_json({
                        "status": "success",
                        "purged_tickers": NON_CRYPTO,
                        "alerts_history_deleted": ah_deleted,
                        "market_ticks_deleted": mt_deleted
                    })
                except Exception as e:
                    self.send_error_json(str(e))
            elif path == '/api/user/ai-memory':
                self.handle_ai_knowledge_get(auth_info)
            elif path == '/api/config':
                self.handle_config()
            elif path == '/api/search':
                self.handle_search()
            elif path == '/api/dev/mock-signals':
                self.handle_mock_signals()
            elif path == '/api/whales':
                self.handle_whales()
            elif path == '/api/signals':


                self.handle_signals()
            elif path == '/api/btc':
                self.handle_btc()
            elif path == '/api/cme-gaps':
                self.handle_cme_gaps()
            elif path == '/api/market-pulse':
                self.handle_market_pulse()
            elif path == '/api/alerts':
                self.handle_alerts()
            elif path == '/api/alerts/badge':
                self.handle_alerts_badge()
            elif path == '/api/risk':
                self.handle_risk()
            elif path == '/api/depeg':
                self.handle_depeg()
            elif path == '/api/news':
                self.handle_news()
            elif path == '/api/mindshare':
                self.handle_mindshare()
            elif path == '/api/ai_analyst':
                self.handle_ai_analyst()
            elif path == '/api/signal-history':
                self.handle_signal_history()
            elif path == '/api/signal-suppression-log':
                self.handle_signal_suppression_log()
            elif path == '/api/near-miss':
                self.handle_near_miss()
            elif path == '/api/signal-notes/all':
                self.handle_signal_notes_all()
            elif path == '/api/signal-notes':
                self.handle_signal_notes_get()
            elif path == '/api/macro-calendar':
                self.handle_macro_calendar()
            elif path == '/api/capital-rotation':
                self.handle_capital_rotation()
            elif path == '/api/options-flow':
                self.handle_options_flow()
            elif path == '/api/equity-options-flow':
                self.handle_equity_options_flow()
            elif path == '/api/options-signal':
                self.handle_options_signal()
            elif path == '/api/ai-rebalancer':
                self.handle_ai_rebalancer()
            elif path == '/api/alert-settings':
                self.handle_alert_settings()
            elif path == '/api/user/algo-params':
                self.handle_algo_params()
            elif path == '/api/liquidity':
                self.handle_liquidity()
            elif path == '/api/liquidity-history':
                self.handle_liquidity_history()
            elif path == '/api/global-liquidity-heatmap' or path.startswith('/api/global-liquidity-heatmap'):
                self.handle_global_liquidity_heatmap()
            elif path == '/api/oi-funding-heatmap':
                self.handle_oi_funding_heatmap()
            elif path.startswith('/api/footprint'):
                self.handle_footprint_candles()
            elif path == '/api/equity-klines':
                self.handle_equity_klines()
            elif path.startswith('/api/klines'):
                self.handle_klines()
            elif path.startswith('/api/orderbook'):
                self.handle_orderbook()
            elif path == '/api/tape':
                self.handle_tape()
            elif path == '/api/generate-setup':
                self.handle_setup_generation()
            elif path == '/api/gex-profile':
                self.handle_gex_profile()
            elif path == '/api/options-max-pain':
                self.handle_options_max_pain()
            elif path == '/api/volume-profile':
                self.handle_volume_profile()
            elif path == '/api/lob-heatmap':
                self.handle_lob_heatmap()
            elif path == '/api/whales':
                self.handle_whales()
            elif path.startswith('/api/liquidation-map'):
                self.handle_liquidations_map()
            elif path.startswith('/api/liquidations'):
                self.handle_liquidations()
            elif path.startswith('/api/derivatives'):
                self.handle_derivatives()
            elif path.startswith('/api/volatility-surface'):
                self.handle_volatility_surface()
            elif path.startswith('/api/funding-rates'):
                self.handle_funding_rates()
            elif path.startswith('/api/ssr'):
                self.handle_ssr()
            elif path.startswith('/api/tvl'):
                self.handle_tvl()
            elif path.startswith('/api/monte-carlo'):
                self.handle_monte_carlo()
            elif path.startswith('/api/sectors'):
                self.handle_sectors()
            elif path.startswith('/api/factor-web'):
                self.handle_factor_web()
            elif path.startswith('/api/execution-time'):
                self.handle_execution_time()
            elif path.startswith('/api/sankey'):
                self.handle_sankey()
            elif path.startswith('/api/correlation-matrix'):
                self.handle_correlation_matrix()
            elif path.startswith('/api/atr'):
                self.handle_atr()
            elif path.startswith('/api/system-dials'):
                self.handle_system_dials()
            elif path == '/api/macro-regime':
                self.handle_macro_regime()
            elif path.startswith('/api/macro'):
                self.handle_macro()
            elif path == '/api/wallet-attribution':
                self.handle_wallet_attribution()
            elif path.startswith('/api/portfolio-sim') or path == '/api/portfolio-performance':
                self.handle_portfolio_performance()
            elif path == '/api/chain-velocity':
                self.handle_chain_velocity()
            elif path == '/api/portfolio/risk':
                self.handle_portfolio_risk()
            elif path == '/api/portfolio/correlations':
                self.handle_portfolio_correlations()
            elif path == '/api/portfolio/export':
                self.handle_portfolio_export()
            elif path == '/api/narrative-clusters':
                self.handle_narrative_clusters()
            elif path == '/api/briefing':
                self.handle_briefing()
            elif path == '/api/user/settings':
                self.handle_user_settings()
            elif path == '/api/user/exchange-keys':
                self.handle_exchange_keys_get(auth_info)
            elif path == '/api/user/ai-memory':
                self.handle_ai_knowledge_get(auth_info)
            elif path == '/api/leaderboard':
                self.handle_leaderboard()
            elif path == '/api/trade-lab':
                self.handle_trade_lab()
            elif path == '/api/trade-ledger':
                self.handle_trade_ledger()
            elif path == '/api/miners':
                self.handle_miners()
            elif path == '/api/flows':
                self.handle_flows()
            elif path == '/api/heatmap':
                self.handle_heatmap()
            elif path == '/api/catalysts':
                self.handle_catalysts()
            elif path == '/api/whales_entity':
                self.handle_whales_entity()
            elif path == '/api/notifications':
                self.handle_notifications()
            elif path == '/api/alpha-score':
                self.handle_alpha_score()
            elif path == '/api/performance':
                self.handle_performance()
            elif path == '/api/export':
                self.handle_export()

            elif path == '/api/rotation':
                self.handle_rotation()
            elif path == '/api/narrative/rotation':
                self.handle_narrative_rotation()
            elif path.startswith('/api/correlation'):
                self.handle_correlation()
            elif path.startswith('/api/stress-test'):
                self.handle_stress_test()
            elif path.startswith('/api/fear-greed'):
                self.handle_fear_greed()
            elif path == '/api/etf-flows':
                self.handle_etf_flows()
            elif path.startswith('/api/dominance'):
                self.handle_dominance()
            elif path.startswith('/api/regime'):
                self.handle_regime()
            elif path.startswith('/api/ohlc'):
                self.handle_ohlc()
            elif path.startswith('/api/history'):
                self.handle_history()
            elif path.startswith('/api/benchmark'):
                self.handle_benchmark()
            elif path.startswith('/api/backtest-v2'):
                self.handle_backtest_v2()
            elif path.startswith('/api/backtest'):
                self.handle_backtest()
            elif path.startswith('/api/walk-forward'):
                self.handle_walk_forward()
            elif path.startswith('/api/strategy-compare'):
                self.handle_strategy_compare()
            elif path.startswith('/api/ai-memo'):
                self.handle_ai_memo()
            elif path.startswith('/api/ai-trade-now'):
                self.handle_ai_trade_now()
            elif path.startswith('/api/signal-thesis'):
                self.handle_signal_thesis()
            elif path.startswith('/api/onchain'):
                self.handle_onchain()
            elif path.startswith('/api/portfolio_optimize'):
                self.handle_portfolio_optimize()
            elif path.startswith('/api/efficient-frontier'):
                self.handle_efficient_frontier()
            elif path.startswith('/api/funding-history'):
                self.handle_funding_rate_history()
            elif path.startswith('/api/signal-radar'):
                self.handle_signal_radar()
            elif path.startswith('/api/signal-density'):
                self.handle_signal_density()
            elif path.startswith('/api/whale-sankey'):
                self.handle_whale_sankey()
            elif path.startswith('/api/yield-curve'):
                self.handle_yield_curve()
            elif path == '/api/liquidations':
                self.handle_liquidations()
            elif path == '/api/unlocks':
                self.handle_token_unlocks()
            elif path == '/api/cohorts':
                self.handle_cohort_waves()
            elif path == '/api/yield-lab':
                self.handle_yield_lab()
            elif path == '/api/universe':
                self.handle_universe()
            elif path == '/api/watchlist':
                self.handle_watchlist_get(auth_info)
            elif path == '/api/oms-dashboard':
                self.handle_oms_dashboard(auth_info)
            elif path == '/api/positions':
                self.handle_positions_get(auth_info)
            elif path == '/api/price-alerts':
                auth_info = auth_info or self.is_authenticated()
                if auth_info: self.handle_price_alerts_get(auth_info)
                else: self.send_response(401); self.end_headers()
            elif path == '/api/signal-permalink':
                # Public: live signal data by ticker for permalink view
                self.handle_live_signal_permalink()
            elif path == '/api/signal-leaderboard':
                self.handle_signal_leaderboard()
            elif path == '/api/market-brief':
                auth_info = auth_info or self.is_authenticated()
                if auth_info: self.handle_market_brief()
                else: self.send_response(401); self.end_headers()
            elif path == '/api/algo-bots':
                auth_info = auth_info or self.is_authenticated()
                if auth_info: self.handle_trading_bots_get(auth_info)
                else: self.send_response(401); self.end_headers()
            elif path.startswith('/api/signal/'):
                # Public: /api/signal/{id} - no auth required for sharing
                signal_id = path.split('/')[-1]
                self.handle_signal_permalink(signal_id)
            elif path == '/api/telegram/link':
                token = os.getenv('TELEGRAM_BOT_TOKEN', '')
                bot_name = ''
                if token:
                    try:
                        import requests as _req
                        r = _req.get(f'https://api.telegram.org/bot{token}/getMe', timeout=5)
                        if r.status_code == 200:
                            bot_name = r.json().get('result', {}).get('username', '')
                    except:
                        pass
                self.send_json({
                    'bot_name': bot_name,
                    'bot_url': f'https://t.me/{bot_name}' if bot_name else '',
                    'active': bool(bot_name)
                })
            elif path == '/api/og-image':
                # Dynamic Open Graph Image generation
                ticker = query_params.get('ticker', [''])[0].upper()
                bias = query_params.get('bias', ['Neutral'])[0]
                zscore = query_params.get('zscore', ['0.00'])[0]
                atr = query_params.get('atr', ['0.00'])[0]
                self.handle_og_image(ticker, bias, zscore, atr)
            elif path == '/health':
                self.handle_health()
            elif path == '/api/prices':
                self.handle_live_prices()
            elif path == '/' and query_params.get('view') == ['signal'] and query_params.get('id'):
                self.handle_ssr_permalink(query_params['id'][0])
            else:
                # Semantic Clean URL Routing & SPA Fallback
                safe_path = path.lstrip('/')
                

                
                if '.' not in safe_path and safe_path != "":
                    if safe_path == "academy":
                        self.path = "/academy/index.html"

                    elif safe_path == "privacy":
                        self.path = "/privacy.html"

                    elif safe_path == "terms":
                        self.path = "/terms.html"

                    elif safe_path == "roadmap":
                        self.path = "/roadmap.html"

                    else:
                        html_target = f"{safe_path}.html"

                        if os.path.exists(html_target):
                            self.path = f"/{html_target}"

                        else:
                            self.path = "/index.html"
                

                super().do_GET()
        except Exception as e:
            print(f'[{datetime.now()}] Global do_GET error: {e}', flush=True)
            traceback.print_exc()
            try:
                self.send_error_json(f'Internal Server Error: {str(e)}', 500)
            except:
                pass

    def handle_onboarding_complete(self, auth_info, post_data):
        """Log when a user completes or skips the onboarding wizard."""
        import sqlite3 as _sq
        try:
            email = auth_info.get('email', '')
            skipped = post_data.get('skipped', False)
            wcount = int(post_data.get('watchlist_count', 0))
            completed_at = post_data.get('completed_at', datetime.now().isoformat())

            with _sq.connect(DB_PATH) as conn:
                c = conn.cursor()
                # Add columns if they don't exist yet (idempotent)
                for col, typ in [
                    ('onboarding_completed_at', 'TEXT'),
                    ('onboarding_skipped', 'INTEGER'),
                    ('onboarding_watchlist_count', 'INTEGER'),
                ]:
                    try:
                        c.execute(f'ALTER TABLE user_settings ADD COLUMN {col} {typ}')
                    except Exception:
                        pass
                c.execute("""
                    INSERT INTO user_settings (user_email, onboarding_completed_at, onboarding_skipped, onboarding_watchlist_count)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(user_email) DO UPDATE SET
                        onboarding_completed_at = excluded.onboarding_completed_at,
                        onboarding_skipped = excluded.onboarding_skipped,
                        onboarding_watchlist_count = excluded.onboarding_watchlist_count
                """, (email, completed_at, 1 if skipped else 0, wcount))
                conn.commit()

            action = 'SKIPPED' if skipped else 'COMPLETED'
            print(f'[Onboarding] {email} {action} - watchlist_count={wcount}')
            self.send_json({'success': True, 'action': action})
        except Exception as e:
            print(f'[Onboarding] Error: {e}')
            self.send_json({'success': False, 'error': str(e)})

    def handle_asset_seo(self, ticker):
        """pSEO: Serves index.html with a server-rendered content strip + SEO metadata.
        The #pseo-strip div is crawlable by Google without JS and shows unique per-ticker data."""
        bias = "Neutral"
        z_score = "0.00"
        atr_val = "0.00"

        # Full asset name lookup table for richer, search-friendly titles
        _ASSET_NAMES = {
            'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'SOL': 'Solana', 'XRP': 'XRP',
            'DOGE': 'Dogecoin', 'BNB': 'BNB', 'ADA': 'Cardano', 'AVAX': 'Avalanche',
            'LINK': 'Chainlink', 'DOT': 'Polkadot', 'PEPE': 'Pepe', 'SHIB': 'Shiba Inu',
            'WIF': 'dogwifhat', 'BONK': 'Bonk', 'FLOKI': 'Floki', 'NEAR': 'NEAR Protocol',
            'ATOM': 'Cosmos', 'TON': 'Toncoin', 'INJ': 'Injective', 'SEI': 'Sei',
            'OP': 'Optimism', 'ARB': 'Arbitrum', 'SUI': 'Sui', 'APT': 'Aptos',
            'LTC': 'Litecoin', 'TRX': 'TRON', 'UNI': 'Uniswap', 'AAVE': 'Aave',
            'MKR': 'Maker', 'LDO': 'Lido DAO', 'CRV': 'Curve DAO', 'RUNE': 'THORChain',
            'SNX': 'Synthetix', 'JTO': 'Jito', 'EIGEN': 'EigenLayer', 'FET': 'Fetch.ai',
            'RENDER': 'Render', 'OCEAN': 'Ocean Protocol', 'WLD': 'Worldcoin',
            'PYTH': 'Pyth Network', 'HBAR': 'Hedera', 'TRUMP': 'Official Trump',
            'POPCAT': 'Popcat', 'PNUT': 'Peanut the Squirrel', 'TAO': 'Bittensor',
            'IMX': 'Immutable', 'ALGO': 'Algorand', 'STRK': 'Starknet', 'WBTC': 'Wrapped Bitcoin',
            'STX': 'Stacks', 'MATIC': 'Polygon', 'MSTR': 'MicroStrategy',
            'IBIT': 'iShares Bitcoin ETF', 'FBTC': 'Fidelity Bitcoin ETF',
            'COIN': 'Coinbase', 'MARA': 'MARA Holdings', 'RIOT': 'Riot Platforms',
            'NVDA': 'NVIDIA', 'TSLA': 'Tesla', 'AAPL': 'Apple', 'SPY': 'S&P 500 ETF',
        }
        # Related assets for internal cross-linking (boosts crawl budget distribution)
        _RELATED = {
            'BTC':  ['ETH', 'MSTR', 'IBIT'], 'ETH':  ['BTC', 'SOL', 'AAVE'],
            'SOL':  ['ETH', 'NEAR', 'SEI'],  'XRP':  ['BTC', 'XLM', 'ADA'],
            'DOGE': ['SHIB', 'PEPE', 'WIF'], 'PEPE': ['DOGE', 'BONK', 'WIF'],
            'MSTR': ['BTC', 'COIN', 'MARA'], 'IBIT': ['MSTR', 'FBTC', 'BTC'],
            'AAVE': ['ETH', 'MKR', 'CRV'],  'INJ':  ['ETH', 'SOL', 'TIA'],
            'ARB':  ['ETH', 'OP', 'STRK'],  'LINK': ['ETH', 'BTC', 'DOT'],
        }
        asset_name = _ASSET_NAMES.get(ticker, ticker)
        related_tickers = _RELATED.get(ticker, ['BTC', 'ETH', 'SOL'])

        # Read from live signal cache (non-blocking — pure read, no lock acquisition)
        try:
            from backend.routes.institutional import InstitutionalRoutesMixin
            sc = InstitutionalRoutesMixin._signals_cache
            if sc and 'data' in sc:
                for item in sc['data']:
                    if item.get('ticker', '').upper().replace('-USD', '') == ticker.upper():
                        sent_val = item.get('sentiment', 0)
                        if sent_val > 0.1: bias = "Bullish"
                        elif sent_val < -0.1: bias = "Bearish"
                        else: bias = "Neutral"
                        z_score = str(round(float(item.get('zScore', 0) or 0), 2))
                        atr_val = str(round(float(item.get('atr_2x', 0) or 0), 2))
                        break
        except:
            pass

        try:
            import os as _os
            _base_dir  = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
            _index_path = _os.path.join(_base_dir, 'index.html')
            print(f"[pSEO] Serving {ticker} ({asset_name}) content strip", flush=True)
            with open(_index_path, 'r', encoding='utf-8') as f:
                html = f.read()

            # Use full name in title for long-tail keyword targeting
            title = f"{asset_name} ({ticker}) Live Analytics, Z-Score & ATR Signals | AlphaSignal"
            desc  = (f"{asset_name} ({ticker}) institutional intelligence: real-time bias {bias}, "
                     f"Z-Score {z_score}, ATR 2x stop ${atr_val}. "
                     f"Track {asset_name} whale activity, options flow & ML alpha signals on AlphaSignal.")

            # ── Head: meta tags + per-ticker styles ──────────────────────────────
            seo_head = f"""
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="https://alphasignal.digital/asset/{ticker}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="AlphaSignal">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:url" content="https://alphasignal.digital/asset/{ticker}">
    <meta property="og:image" content="https://alphasignal.digital/api/og-image?ticker={ticker}&bias={bias}&zscore={z_score}&atr={atr_val}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:site" content="@alphasignalai">
    <meta property="twitter:title" content="{title}">
    <meta property="twitter:description" content="{desc}">
    <meta property="twitter:image" content="https://alphasignal.digital/api/og-image?ticker={ticker}&bias={bias}&zscore={z_score}&atr={atr_val}">
    <style>
      body[data-seo-ticker] #auth-overlay {{ display: none !important; }}
      body[data-seo-ticker] .layout      {{ filter: none !important; display: flex !important; }}
      #pseo-strip {{
        position:fixed; inset:0; background:#090c14;
        display:flex; align-items:center; justify-content:center;
        z-index:1; pointer-events:none;
        font-family:'Inter','JetBrains Mono',monospace;
      }}
      #pseo-strip .ps-card {{
        max-width:860px; width:90%;
        border:1px solid rgba(0,255,163,.15); border-radius:12px;
        padding:2rem 2.5rem; background:rgba(255,255,255,.03);
      }}
      #pseo-strip .ps-eyebrow {{
        font-size:.7rem; letter-spacing:.15em; color:#00ffa3;
        text-transform:uppercase; margin-bottom:.4rem;
      }}
      #pseo-strip h1 {{
        font-size:1.6rem; font-weight:700; color:#e8eaf0; margin:0 0 .5rem;
      }}
      #pseo-strip .ps-desc {{
        font-size:.9rem; color:#8892a4; line-height:1.65; margin-bottom:1.5rem;
      }}
      #pseo-strip .ps-grid {{
        display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem;
      }}
      #pseo-strip .ps-metric {{
        background:rgba(255,255,255,.04);
        border:1px solid rgba(255,255,255,.07);
        border-radius:8px; padding:.85rem 1rem;
      }}
      #pseo-strip .ps-label {{
        font-size:.65rem; letter-spacing:.1em; color:#6b7280;
        text-transform:uppercase; margin-bottom:.3rem;
      }}
      #pseo-strip .ps-value {{
        font-size:1.1rem; font-weight:600; color:#e8eaf0;
      }}
      #pseo-strip .ps-features {{
        font-size:.8rem; color:#8892a4; line-height:2;
      }}
      #pseo-strip .ps-features span {{ margin-right:1.5rem; }}
      #pseo-strip .ps-features span::before {{ content:"\\2713  "; color:#00ffa3; }}
    </style>
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "{title}",
      "description": "{desc}",
      "url": "https://alphasignal.digital/asset/{ticker}",
      "mainEntity": {{
        "@type": "FinancialProduct",
        "name": "{asset_name}",
        "alternateName": "{ticker}",
        "description": "Institutional trading analytics for {asset_name} ({ticker}): Z-Score deviation, ATR stop loss, options flow, whale accumulation patterns, and AI alpha signals."
      }}
    }}
    </script>
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "AlphaSignal", "item": "https://alphasignal.digital/"}},
        {{"@type": "ListItem", "position": 2, "name": "Asset Analytics", "item": "https://alphasignal.digital/asset/BTC"}},
        {{"@type": "ListItem", "position": 3, "name": "{asset_name} ({ticker})", "item": "https://alphasignal.digital/asset/{ticker}"}}
      ]
    }}
    </script>
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {{
          "@type": "Question",
          "name": "What is the current {asset_name} Z-Score?",
          "acceptedAnswer": {{
            "@type": "Answer",
            "text": "The current {asset_name} ({ticker}) Z-Score is {z_score}, indicating a {bias} market bias. A Z-Score above +2 signals overbought conditions; below -2 signals oversold. Track live Z-Score signals at AlphaSignal."
          }}
        }},
        {{
          "@type": "Question",
          "name": "How do I set a stop loss for {asset_name}?",
          "acceptedAnswer": {{
            "@type": "Answer",
            "text": "For {asset_name} ({ticker}), the ATR-based 2x stop loss is currently ${atr_val}. ATR (Average True Range) stop losses adjust dynamically to market volatility, preventing premature exits during normal price fluctuations while protecting against major drawdowns."
          }}
        }},
        {{
          "@type": "Question",
          "name": "Is {asset_name} bullish or bearish right now?",
          "acceptedAnswer": {{
            "@type": "Answer",
            "text": "Based on AlphaSignal's real-time ML alpha engine and sentiment analysis, {asset_name} ({ticker}) is currently showing a {bias} bias with a Z-Score of {z_score}. This is updated live using whale activity, options flow, and on-chain data."
          }}
        }}
      ]
    }}
    </script>"""

            # ── Server-rendered content strip (no JS, fully crawlable) ───────────
            pseo_strip = f"""<div id="pseo-strip" aria-hidden="true">
  <div class="ps-card">
    <div class="ps-eyebrow">AlphaSignal &mdash; Institutional Intelligence</div>
    <h1>{asset_name} ({ticker}) Real-Time Analytics &amp; Institutional Signals</h1>
    <p class="ps-desc">Track {asset_name} ({ticker}) with institutional-grade metrics: MVRV Z-Score deviation,
      ATR-based position sizing, options flow scanner, whale accumulation patterns,
      and AI-generated market briefings &mdash; all updated in real-time.</p>
    <div class="ps-grid">
      <div class="ps-metric">
        <div class="ps-label">Market Bias</div>
        <div class="ps-value">{bias}</div>
      </div>
      <div class="ps-metric">
        <div class="ps-label">Z-Score</div>
        <div class="ps-value">{z_score}</div>
      </div>
      <div class="ps-metric">
        <div class="ps-label">ATR 2x Stop</div>
        <div class="ps-value">${atr_val}</div>
      </div>
    </div>
    <div class="ps-features">
      <span>MVRV Z-Score</span><span>ATR Position Sizing</span>
      <span>Options Flow</span><span>Whale Attribution</span>
      <span>AI Market Brief</span><span>Liquidity Heatmap</span>
    </div>
    <div class="ps-related">
      <span class="ps-related-label">Related Assets:</span>
      {''.join(f'<a class="ps-related-link" href="/asset/{t}">{t}</a>' for t in related_tickers)}
    </div>
  </div>
</div>"""

            # ── Patch HTML ───────────────────────────────────────────────────────
            html = html.replace(
                '<title>AlphaSignal &mdash; Crypto Analytics &amp; Algorithmic Trading Terminal | Institutional Intelligence</title>', '')
            html = html.replace(
                '<meta name="description" content="AlphaSignal (Alpha Signal) is the institutional Bitcoin and crypto intelligence terminal at alphasignal.digital. Real-time Z-score alpha signals, AI market briefings, ETF capital flows, options flow scanner, whale pulse tracker, on-chain analytics (MVRV, SOPR, Puell Multiple), macro calendar, portfolio optimizer, and 60+ analytical views. Built for professional crypto traders and institutional desks.">', '')
            html = html.replace('</head>', seo_head + '\n</head>')
            html = html.replace('<body class="cyber-theme">', f'<body class="cyber-theme" data-seo-ticker="{ticker}">')
            # Inject strip as first child of body
            html = html.replace(
                f'<body class="cyber-theme" data-seo-ticker="{ticker}">',
                f'<body class="cyber-theme" data-seo-ticker="{ticker}">\n{pseo_strip}')

            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Connection', 'close')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))

        except Exception as e:
            print(f'[pSEO Error] {e}')
            import traceback; traceback.print_exc()
            super().do_GET()

    def handle_ssr_permalink(self, ticker):
        price = "fetching..."
        bias = "Unknown"
        z_score = "0.00"
        
        cache = self._signals_cache.get('data', [])
        for item in cache:
            if item.get('ticker') == ticker:
                price = item.get('price', price)
                bias = str(item.get('sentiment', bias)).upper()
                z_score = str(item.get('z_score', z_score))
                break
                
        try:
            with open('index.html', 'r', encoding='utf-8') as f:
                html = f.read()
                
            og_tags = f"""
    <meta property="og:title" content="AlphaSignal Institutional | {ticker} Live Signal" />
    <meta property="og:description" content="Technical Bias: {bias} | Standard Deviation (Z-Score): {z_score} | Active Price: ${price}." />
    <meta property="og:image" content="https://alphasignal.digital/assets/preview.png" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
            """
            
            html = html.replace('</head>', og_tags + '\n</head>')
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
        except Exception as e:
            print(f'[SSR Error] {e}')
            super().do_GET()

    def handle_live_prices(self):
        import yfinance as yf
        import time
        tickers = {'BTC': 'BTC-USD', 'ETH': 'ETH-USD', 'SOL': 'SOL-USD'}
        res = {}
        for sym, tick in tickers.items():
            cache = self._price_cache.get(sym)
            if cache and isinstance(cache, tuple) and (time.time() - cache[1] < 15):
                res[sym] = cache[0]
            else:
                try:
                    px = yf.Ticker(tick).fast_info.get('last_price') or yf.Ticker(tick).fast_info.get('lastPrice')
                    if px:
                        px = round(float(px), 2)
                        res[sym] = px
                        self._price_cache[sym] = (px, time.time())
                except: pass
                
        try:
            from backend.routes.institutional import InstitutionalRoutesMixin
            sc = InstitutionalRoutesMixin._signals_cache
            # Fix: sc['data'] is an object {"signals": [...], "_market_regime": {...}}
            if sc and sc.get('data') and isinstance(sc['data'], dict):
                sigs = sc['data'].get('signals', [])
                res['top_alpha'] = sigs[:10]
            else:
                res['top_alpha'] = []
        except:
            res['top_alpha'] = []

        self.send_json(res)

    def handle_og_image(self, ticker, bias, zscore, atr):
        """Generates a dynamic 1200x630 OpenGraph card image using Pillow."""
        try:
            from io import BytesIO
            from PIL import Image, ImageDraw, ImageFont
        except ImportError:
            print(f"[OG Image] Pillow not installed")
            self.send_error(500, "Pillow not installed")
            return

        try:
            # ── Colours (always use integer RGB tuples — hex strings
            # are not supported by all Pillow versions) ──────────────
            C_BG       = (10,  14,  23)   # #0a0e17
            C_GRID     = (17,  24,  39)   # #111827
            C_CARD     = (30,  41,  59)   # #1e293b
            C_BORDER   = (51,  65,  85)   # #334155
            C_WHITE    = (255, 255, 255)
            C_BRAND    = (125, 211, 252)  # #7dd3fc
            C_SUBTEXT  = (148, 163, 184)  # #94a3b8
            C_FOOTER   = (100, 116, 139)  # #64748b
            C_GREEN    = (0,   255, 163)  # #00ffa3
            C_RED      = (255,  51, 102)  # #ff3366
            C_NEUTRAL  = (160, 174, 192)  # #a0aec0
            bias_color = C_GREEN if bias == 'Bullish' else C_RED if bias == 'Bearish' else C_NEUTRAL

            # ── Canvas ───────────────────────────────────────────────
            img  = Image.new('RGB', (1200, 630), color=C_BG)
            draw = ImageDraw.Draw(img)

            # Subtle grid
            for x in range(0, 1200, 40):
                draw.line([(x, 0), (x, 630)],   fill=C_GRID, width=1)
            for y in range(0, 630, 40):
                draw.line([(0, y), (1200, y)],   fill=C_GRID, width=1)

            # ── Fonts (Linux-safe path search) ───────────────────────
            try:
                import os
                if os.name == 'nt':
                    _fd = 'C:\\Windows\\Fonts\\'
                    title_font    = ImageFont.truetype(os.path.join(_fd, 'arialbd.ttf'), 96)
                    subtitle_font = ImageFont.truetype(os.path.join(_fd, 'arial.ttf'),   48)
                    value_font    = ImageFont.truetype(os.path.join(_fd, 'arialbd.ttf'), 64)
                    brand_font    = ImageFont.truetype(os.path.join(_fd, 'arialbd.ttf'), 42)
                else:
                    # Search common Linux font directories for DejaVu
                    _candidates_bold = [
                        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                        '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
                        '/usr/share/fonts/DejaVuSans-Bold.ttf',
                        'DejaVuSans-Bold.ttf',
                    ]
                    _candidates_reg = [
                        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                        '/usr/share/fonts/dejavu/DejaVuSans.ttf',
                        '/usr/share/fonts/DejaVuSans.ttf',
                        'DejaVuSans.ttf',
                    ]
                    def _find(paths):
                        for p in paths:
                            if os.path.exists(p):
                                return p
                        return None
                    _bold = _find(_candidates_bold)
                    _reg  = _find(_candidates_reg)
                    if _bold:
                        title_font    = ImageFont.truetype(_bold, 96)
                        value_font    = ImageFont.truetype(_bold, 64)
                        brand_font    = ImageFont.truetype(_bold, 42)
                    else:
                        raise FileNotFoundError('DejaVuSans-Bold not found')
                    subtitle_font = ImageFont.truetype(_reg, 48) if _reg else ImageFont.load_default()
            except Exception as fe:
                print(f"[OG Image] Font load error: {fe} — using bitmap default")
                title_font = subtitle_font = value_font = brand_font = ImageFont.load_default()

            # ── Text ──────────────────────────────────────────────────
            draw.text((80, 80),  'ALPHASIGNAL',          font=brand_font,    fill=C_BRAND)
            draw.text((80, 160), f'{ticker} Analytics',  font=title_font,    fill=C_WHITE)

            y0 = 320
            # Box 1: Bias
            draw.rectangle([80,  y0, 380, y0+200], fill=C_CARD, outline=C_BORDER, width=2)
            draw.text((120, y0+40),  'MARKET BIAS',  font=subtitle_font, fill=C_SUBTEXT)
            draw.text((120, y0+110), bias,           font=value_font,    fill=bias_color)

            # Box 2: Z-Score
            draw.rectangle([410, y0, 710, y0+200], fill=C_CARD, outline=C_BORDER, width=2)
            draw.text((450, y0+40),  'MVRV Z-SCORE', font=subtitle_font, fill=C_SUBTEXT)
            draw.text((450, y0+110), zscore,         font=value_font,    fill=C_WHITE)

            # Box 3: ATR
            draw.rectangle([740, y0, 1120, y0+200], fill=C_CARD, outline=C_BORDER, width=2)
            draw.text((780, y0+40),  'ATR 2x STOP',  font=subtitle_font, fill=C_SUBTEXT)
            draw.text((780, y0+110), f'${atr}',      font=value_font,    fill=C_WHITE)

            # Footer
            draw.text((80,  560), 'alphasignal.digital',         font=subtitle_font, fill=C_FOOTER)
            draw.text((800, 560), 'Institutional Grade Intelligence', font=subtitle_font, fill=C_FOOTER)

            # ── Encode & send ─────────────────────────────────────────
            buf = BytesIO()
            img.save(buf, format='PNG')
            self.send_response(200)
            self.send_header('Content-Type', 'image/png')
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            self.wfile.write(buf.getvalue())
            print(f"[OG Image] OK — {ticker} {bias}")

        except Exception as e:
            print(f"[{datetime.now()}] OG Image Generation Error: {e}")
            traceback.print_exc()
            self.send_error(500, "Image generation failed")

    def handle_signal_seo(self, signal_id):
        """pSEO: Serves the index.html but with pre-rendered SEO meta tags for a specific signal."""
        try:
            import sqlite3, os
            conn = sqlite3.connect(DB_PATH, timeout=30)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT * FROM alerts_history WHERE id = ?', (signal_id,))
            row = c.fetchone()
            conn.close()

            if not row:
                self.send_error(404, 'Signal not found')
                return

            raw = dict(row)
            ticker = raw.get('ticker', 'UNKNOWN')
            sig_type = raw.get('type', '')
            direction = raw.get('direction') or (
                'LONG' if any(k in sig_type for k in ('BULL', 'OVERSOLD', 'ML_ALPHA'))
                else 'SHORT' if any(k in sig_type for k in ('BEAR', 'OVERBOUGHT'))
                else 'NEUTRAL'
            )
            price = raw.get('price') or 0.0
            from backend.services import get_ticker_name
            asset_name = get_ticker_name(ticker)

            title = f"{asset_name} ({ticker}) {direction} Alert: {sig_type} | AlphaSignal"
            desc = f"AlphaSignal detected a {direction} opportunity for {asset_name} ({ticker}) at ${price}. Institutional quantitative alert type: {sig_type}."

            _base_dir  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            _index_path = os.path.join(_base_dir, 'index.html')
            
            with open(_index_path, 'r', encoding='utf-8') as f:
                html = f.read()

            seo_head = f"""
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="https://alphasignal.digital/signal/{signal_id}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="AlphaSignal">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:url" content="https://alphasignal.digital/signal/{signal_id}">
    <meta property="og:image" content="https://alphasignal.digital/api/og-image?ticker={ticker}&bias={'Bullish' if direction=='LONG' else 'Bearish' if direction=='SHORT' else 'Neutral'}&zscore=0.0&atr=0.0">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:site" content="@alphasignalai">
    <meta property="twitter:title" content="{title}">
    <meta property="twitter:description" content="{desc}">
    <meta property="twitter:image" content="https://alphasignal.digital/api/og-image?ticker={ticker}&bias={'Bullish' if direction=='LONG' else 'Bearish' if direction=='SHORT' else 'Neutral'}&zscore=0.0&atr=0.0">
    
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "{title}",
      "description": "{desc}",
      "image": "https://alphasignal.digital/api/og-image?ticker={ticker}&bias={'Bullish' if direction=='LONG' else 'Bearish' if direction=='SHORT' else 'Neutral'}&zscore=0.0&atr=0.0",
      "author": {{
        "@type": "Organization",
        "name": "AlphaSignal",
        "url": "https://alphasignal.digital/"
      }},
      "publisher": {{
        "@type": "Organization",
        "name": "AlphaSignal",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://alphasignal.digital/assets/pwa-icon-512.png"
        }}
      }},
      "datePublished": "{raw.get('timestamp') or datetime.now().isoformat()}"
    }}
    </script>
            """
            
            html = html.replace('<title>AlphaSignal &mdash; Crypto Analytics &amp; Algorithmic Trading Terminal | Institutional Intelligence</title>', seo_head)
            html = html.replace('<body', '<body data-seo-signal="true"')
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
        except Exception as e:
            print(f"[{datetime.now()}] !!! pSEO_SIGNAL_GENERATION_ERROR: {e} !!!", flush=True)
            traceback.print_exc()
            self.send_error(500, "Internal Server Error")

    def handle_docs_seo(self, view_key: str, clean_path: str):
        """pSEO: Serves index.html with server-side injected title, description, and canonical
        for docs/* and academy-watch routes.  Googlebot sees the correct canonical in raw HTML
        before any JS runs - fixing 'Alternate page with proper canonical tag' in GSC.
        """
        # View metadata mirroring seo-meta.js (keep in sync when adding new docs pages)
        _DOCS_META = {
            'docs-etf-flows':          ('Bitcoin ETF Flows - Chart Guide | AlphaSignal Docs', 'Full documentation for the AlphaSignal ETF Flows view. Explains Bitcoin Spot ETF Daily Flows, Daily Leaderboard, and Cumulative Net Flow Waterfall with actionable trading signals.'),
            'docs-liquidations':       ('Liquidation Scanner - Chart Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Liquidations view. Covers liquidation cascade charts, heatmap, and cumulative chart with cluster detection and high-conviction entry signals.'),
            'docs-oi-radar':           ('Open Interest Radar - Chart Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal OI Radar. OI vs price divergence charts and funding rate heatmap - signals for over-leveraged conditions and leverage flush risks.'),
            'docs-cme-gaps':           ('CME Gap Tracker - Chart Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal CME Gaps view. Gap inventory table, fill probability scoring, and price overlay with historical fill rate data and trading strategies.'),
            'docs-briefing':           ('AI Macro Briefing - Component Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Macro Briefing. GPT-4o macro memo, System Conviction Dials, and BTC Correlation Tracker with signal interpretation guides.'),
            'docs-rotation':           ('Sector Rotation - RRG Chart Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Sector Rotation view. Relative Rotation Graph (RRG), 30-day sector heatmap, and momentum leader table with institutional rotation cycle interpretation.'),
            'docs-macro-compass':      ('Macro Compass - Regime Chart Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Macro Compass. M2 vs BTC chart, DXY overlay, yield curve monitor, and global risk scatter with regime-based trading signals.'),
            'docs-macro-calendar':     ('Macro Event Calendar - Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Macro Calendar. Event timeline, BTC impact scoring, and historical volatility overlay for FOMC, CPI, and NFP events.'),
            'docs-regime':             ('Market Regime Engine - Classification Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Regime Classifier. Regime Dial, 12-month history chart, and Strategy Allocation Table with signal rules for each of the four regime states.'),
            'docs-signals':            ('Alpha Signals - Z-Score Card Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Signals view. Z-score signal cards, momentum vector bars, and historical signal performance with full rolling Z-score calculation guide.'),
            'docs-ml-engine':          ('ML Engine - Prediction Model Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal ML Engine. 7-day directional probability bars, confidence delta chart, and signal correlation matrix with ensemble model explanation.'),
            'docs-alpha-score':        ('Alpha Score - Composite Ranking Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Alpha Score view. Composite ranking table, grade distribution chart, and score breakdown covering all five contributing factors.'),
            'docs-strategy-lab':       ('Strategy Lab - Rules Builder Guide | AlphaSignal Docs', 'Full documentation for the AlphaSignal Strategy Lab. Visual signal rules builder, backtest performance chart, and parameter sensitivity table.'),
            'docs-backtester':         ('Signal Backtester V2 - Performance Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Backtester V2. Equity curve, monthly return heatmap, drawdown analysis, and regime breakdown with institutional ratio interpretation.'),
            'docs-signal-archive':     ('Signal Archive - Historical Record Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Signal Archive. Historical signal table, win rate analysis, and signal replay chart - complete auditable record of all Z-score signals.'),
            'docs-narrative':          ('Narrative Galaxy - Trend Cluster Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Narrative Galaxy. 3D force-directed cluster chart, trending keyword timeline, and dominant narrative radar.'),
            'docs-token-unlocks':      ('Token Unlock Schedule - Table Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Token Unlocks view. Unlock schedule table, supply impact score badges, and sell pressure ratings with positioning signals.'),
            'docs-yield-lab':          ('DeFi Yield Lab - Protocol Comparison Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Yield Lab. APY comparison table, real yield vs emissions breakdown, and protocol risk score bars.'),
            'docs-portfolio-optimizer':('Portfolio Optimizer - Efficient Frontier Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Portfolio Optimizer. ML rebalancing table, allocation radar, and Efficient Frontier scatter with institutional construction signals.'),
            'docs-tradelab':           ('Trade Idea Lab - Thesis Builder Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Trade Idea Lab. Systematic thesis builder, risk/reward calculator, and AI thesis validator.'),
            'docs-whale-pulse':        ('Whale Pulse - On-Chain Transaction Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Whale Pulse. Whale transaction feed, execution time polar chart, and volume bubble scatter with institutional accumulation signals.'),
            'docs-chain-velocity':     ('Chain Velocity - Cross-Chain Capital Flow Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Chain Velocity view. Velocity time-series chart, cross-chain Sankey flow diagram, and Network Signature Radar.'),
            'docs-onchain':            ('On-Chain Analytics - MVRV, SOPR, NVT, Puell Guide | AlphaSignal Docs', 'Full documentation for the AlphaSignal On-Chain Analytics. MVRV Z-Score, SOPR, Puell Multiple, NVT Ratio, and Realised Price Overlay with actionable signal rules.'),
            'docs-options-flow':       ('Options Flow - Deribit Structure Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Options Flow. Put/Call Ratio gauge, Max Pain chart, IV Smile Curve, and top OI strikes table with institutional positioning signals.'),
            'docs-newsroom':           ('Newsroom - AI Sentiment Feed Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Newsroom. Live news feed with AI sentiment classification and keyword heatmap with high-impact event signal rules.'),
            'docs-trade-ledger':       ('Trade Ledger - Audit Log Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Trade Ledger. Trade log table, signal source attribution, and performance attribution - complete auditable track record.'),
            'docs-performance':        ('Performance Dashboard - Equity Curve Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Performance Dashboard. Key stat cards, monthly ROI heatmap calendar, and portfolio equity curve vs BTC benchmark.'),
            'docs-risk-matrix':        ('Risk Matrix - Portfolio VaR Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Risk Matrix. Portfolio VaR gauge, volatility-adjusted position sizer, and correlation scatter with institutional risk management rules.'),
            'docs-stress-lab':         ('Stress Test Lab - Scenario Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Stress Test Lab. Historical scenario table (FTX, March 2020, Luna) and distribution chart for extreme market stress-testing.'),
            'docs-charting-suite':     ('Charting Suite - Order Flow Charts Guide | AlphaSignal Docs', 'Full documentation for the AlphaSignal Charting Suite. OHLCV chart, Volume Profile, Cumulative Volume Delta (CVD), and Market Depth with institutional interpretation.'),
            'docs-tradingview-hub':    ('TradingView Hub Docs - 13 Widget Guide | AlphaSignal', 'Complete documentation for the AlphaSignal TradingView Hub. All 13 live widgets including Market Overview, TA Gauges, Crypto Screener, Economic Calendar, and Sector Heatmaps.'),
            'docs-custom-charts':      ('Custom Analytics Charts Docs | AlphaSignal', 'Technical reference for the AlphaSignal Custom Analytics tab. BTC Dominance, Funding Rate bars, MVRV/SOPR Overlay, Rolling Volatility, and Correlation Matrix documentation.'),
            'docs-order-flow':         ('Liquidity Dashboard - Order Flow Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Liquidity Dashboard. Aggregated order book, live execution tape, and institutional liquidity heatmap with price level signals.'),
            'docs-alerts':             ('Live Signal Alerts - Alert Feed Guide | AlphaSignal Docs', 'Documentation for AlphaSignal Live Alerts. Alert feed cards, severity levels (LOW/MEDIUM/HIGH/CRITICAL), and filter controls with CRITICAL Z-Score response rules.'),
            'docs-price-alerts':       ('Price Alerts - Custom Trigger Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Price Alerts. Alert manager table, creation form, and browser push notification setup with best practice pairing rules.'),
            'docs-signal-leaderboard': ('Signal Leaderboard - Performance Ranking Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Signal Leaderboard. Ranked performance table with 7D/30D/90D/All-Time filtering to identify highest-conviction repeatable alpha.'),
            'docs-market-brief':       ('AI Market Brief - Daily Memo Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Market Brief. Five-section AI daily brief (Overnight Summary, Signal Environment, Macro Watch, Risk Signals, Actionable Ideas) by GPT-4o.'),
            'docs-my-terminal':        ('Active Positions - Watchlist Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Active Positions hub. Live P&L watchlist table, portfolio summary stats, and notification preference controls.'),
            'docs-ask-terminal':       ('Ask Terminal - AI Chat Guide | AlphaSignal Docs', 'Technical reference for the AlphaSignal Ask Terminal AI. GPT-4o chat with live terminal context injection and dynamic suggested query chips.'),
            'docs-command-center':     ('Dashboard - Overview Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Dashboard. Alpha Score vs Z-Score scatter plot, Hub Quick-Link Grid, BTC sparkline, and System Conviction Dials.'),
            'docs-lob-heatmap':        ('LOB Heatmap - Limit Order Deep Dive | AlphaSignal Docs', 'Documentation for the AlphaSignal Limit Order Book Heatmap. Read bid/ask walls, liquidity voids, and institutional spoofing signals.'),
            'docs-volume-profile':     ('Volume Profile (TPO) - Market Profile Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal Volume Profile. Value Area High/Low and Point of Control (POC) interpretation for Bitcoin and other assets.'),
            'docs-gex':                ('Dealer Gamma Exposure (GEX) - Dynamics Guide | AlphaSignal Docs', 'Documentation for the AlphaSignal GEX Profile. Market maker hedging pressure, zero-gamma levels, and options-driven volatility signals.'),
            'academy-watch':           ('Academy Cinema Hub - Institutional Video Masterclasses | AlphaSignal', 'Immersive video-first instructional portal for AlphaSignal Academy. 40+ professional masterclasses on quantitative strategy, order flow, on-chain analytics, and risk management.'),
        }

        title, desc = _DOCS_META.get(view_key, (
            f'{view_key.replace("docs-", "").replace("-", " ").title()} | AlphaSignal Docs',
            'AlphaSignal institutional crypto intelligence terminal documentation. Real-time signals, on-chain analytics, and AI market insights. alphasignal.digital'
        ))
        full_title = f'{title} | AlphaSignal - Crypto Intelligence Terminal' if '| AlphaSignal' not in title else title
        canonical_url = f'https://alphasignal.digital{clean_path}'

        _base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        _index_path = os.path.join(_base_dir, 'index.html')

        with open(_index_path, 'r', encoding='utf-8') as f:
            html = f.read()

        # Build slug label for structured data (e.g. 'etf-flows' -> 'ETF Flows')
        _slug_label = view_key.replace('docs-', '').replace('academy-watch', 'Academy Cinema').replace('-', ' ').title()
        _is_docs = view_key.startswith('docs-')
        _breadcrumb_item2_name = "Docs" if _is_docs else "Academy"
        _breadcrumb_item2_url = "https://alphasignal.digital/help" if _is_docs else "https://alphasignal.digital/academy"

        _jsonld = f"""{{
      "@context": "https://schema.org",
      "@graph": [
        {{
          "@type": "TechArticle",
          "@id": "{canonical_url}#article",
          "headline": "{title}",
          "description": "{desc}",
          "url": "{canonical_url}",
          "inLanguage": "en-US",
          "isPartOf": {{
            "@type": "WebSite",
            "@id": "https://alphasignal.digital/#website",
            "name": "AlphaSignal",
            "url": "https://alphasignal.digital/"
          }},
          "publisher": {{
            "@type": "Organization",
            "name": "AlphaSignal",
            "url": "https://alphasignal.digital/",
            "logo": {{
              "@type": "ImageObject",
              "url": "https://alphasignal.digital/assets/logo.png"
            }}
          }},
          "image": {{
            "@type": "ImageObject",
            "url": "https://alphasignal.digital/assets/social-preview.png"
          }},
          "about": {{
            "@type": "Thing",
            "name": "{_slug_label}"
          }}
        }},
        {{
          "@type": "BreadcrumbList",
          "@id": "{canonical_url}#breadcrumb",
          "itemListElement": [
            {{
              "@type": "ListItem",
              "position": 1,
              "name": "AlphaSignal",
              "item": "https://alphasignal.digital/"
            }},
            {{
              "@type": "ListItem",
              "position": 2,
              "name": "{_breadcrumb_item2_name}",
              "item": "{_breadcrumb_item2_url}"
            }},
            {{
              "@type": "ListItem",
              "position": 3,
              "name": "{_slug_label}",
              "item": "{canonical_url}"
            }}
          ]
        }}
      ]
    }}"""

        seo_head = f"""    <title>{full_title}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" id="canonical-link" href="{canonical_url}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="AlphaSignal">
    <meta property="og:url" id="og-url" content="{canonical_url}">
    <meta property="og:title" id="og-title" content="{full_title}">
    <meta property="og:description" id="og-desc" content="{desc}">
    <meta property="og:image" content="https://alphasignal.digital/assets/social-preview.png">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:site" content="@alphasignalai">
    <meta property="twitter:url" id="twitter-url" content="{canonical_url}">
    <meta property="twitter:title" id="twitter-title" content="{full_title}">
    <meta property="twitter:description" id="twitter-desc" content="{desc}">
    <script type="application/ld+json">{_jsonld}</script>"""


        # Replace the static <title> tag that index.html ships with
        html = html.replace(
            '<title>AlphaSignal &mdash; Crypto Analytics &amp; Algorithmic Trading Terminal | Institutional Intelligence</title>',
            seo_head
        )
        # Also neutralise the hardcoded canonical that points to / — the seo_head already injects ours above
        html = html.replace(
            '<link rel="canonical" id="canonical-link" href="https://alphasignal.digital/">',
            '<!-- canonical injected server-side above -->'
        )
        html = html.replace('<body', f'<body data-seo-view="{view_key}"')

        html_bytes = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(html_bytes)))
        self.send_header('Cache-Control', 'public, max-age=3600')
        self.end_headers()
        self.wfile.write(html_bytes)
        print(f"[{datetime.now()}] pSEO_DOCS_SERVED: {view_key} -> {canonical_url}", flush=True)


class AlphaSignalServer(ThreadedHTTPServer):
    pass
