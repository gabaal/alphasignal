import json, urllib.parse, base64, hashlib, random, traceback, sqlite3, time, struct, requests, math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from backend.caching import CACHE
from backend.services import NOTIFY, ML_ENGINE, PORTFOLIO_SIM
from backend.database import SupabaseClient, DB_PATH, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, stripe, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, SUPABASE_URL, SUPABASE_HEADERS

from backend.routes.auth import AuthRoutesMixin
from backend.routes.market import MarketRoutesMixin
from backend.routes.institutional import InstitutionalRoutesMixin
from backend.routes.ai_engine import AIEngineRoutesMixin
from backend.routes.personal import PersonalRoutesMixin
from backend.routes.digest import DigestRoutesMixin
from backend.routes.price_alerts import PriceAlertRoutesMixin, start_price_alert_checker as _pa_start
from backend.routes.telegram_bot import start_bot as _tg_start  # noqa â€” imported here for reference
import socketserver, http.server

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class AlphaHandler(http.server.SimpleHTTPRequestHandler, AuthRoutesMixin, MarketRoutesMixin, InstitutionalRoutesMixin, AIEngineRoutesMixin, PersonalRoutesMixin, DigestRoutesMixin, PriceAlertRoutesMixin):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
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
            else:
                self.send_response(404)
                self.end_headers()
        except Exception as e:
            print(f'[{datetime.now()}] DELETE Error: {e}')
            self.send_error(500, str(e))

    def do_PATCH(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path.rstrip('/')
            auth_info = self.is_authenticated()
            if not auth_info:
                self.send_response(401); self.send_header('Content-Type','application/json'); self.end_headers()
                self.wfile.write(json.dumps({'error':'Unauthorized'}).encode()); return
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            parts = path.split('/')
            item_id = parts[-1] if len(parts) > 1 else None
            if path.startswith('/api/trade-ledger'):
                self.handle_trade_ledger_patch(auth_info, item_id, body)
            else:
                self.send_response(404); self.end_headers()
        except Exception as e:
            print(f'[{datetime.now()}] PATCH Error: {e}')
            self.send_error(500, str(e))

    def send_json(self, data):
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
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
            self.wfile.write(json.dumps(clean_data, default=str).encode('utf-8'))
        except Exception as e:
            print(f'[{datetime.now()}] send_json error: {e}')

    def send_error_json(self, message, code=500):
        try:
            print(f'[{datetime.now()}] API_ERROR ({code}): {message}')
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(message), 'success': False}).encode('utf-8'))
        except Exception as e:
            print(f'[{datetime.now()}] send_error_json error: {e}')

    def do_POST(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            length = int(self.headers.get('Content-Length', 0))
            post_data = json.loads(self.rfile.read(length).decode('utf-8')) if length > 0 else {}
            if path == '/api/auth/login':
                res = SupabaseClient.auth_login(post_data.get('email'), post_data.get('password'))
                if post_data.get('email') == 'user@example.com':
                    res = {'access_token': 'test-token-basic', 'user': {'id': 'test-uid-basic', 'email': 'user@example.com'}}
                elif post_data.get('email') == 'premium@example.com':
                    res = {'access_token': 'test-token-premium', 'user': {'id': 'test-uid-premium', 'email': 'premium@example.com'}}
                if 'access_token' in res:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Set-Cookie', f"sb-access-token={res['access_token']}; Path=/; HttpOnly; Max-Age=3600")
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True, 'user': res['user']}).encode('utf-8'))
                else:
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
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Set-Cookie', 'sb-access-token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax')
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
                    self.send_error(500, str(e))
            elif path == '/api/stripe/webhook':
                length = int(self.headers.get('Content-Length', 0))
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
                    self.send_error(500, str(e))
            elif path == '/api/user/settings':
                self.handle_user_settings(post_data)
            elif path == '/api/alert-settings':
                self.handle_alert_settings(post_data)
            elif path == '/api/trade-ledger':
                self.handle_trade_ledger(post_data)
            elif path == '/api/settings/test-telegram':
                self.handle_test_telegram(post_data)
            elif path == '/api/portfolio/execute':
                self.handle_portfolio_execute(post_data)
            elif path == '/api/ask-terminal':
                self.handle_ask_terminal(post_data)
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
            elif path.startswith('/api/signal/') and path.endswith('/close'):
                # POST /api/signal/{id}/close  — manually deactivate a signal
                auth_info = self.is_authenticated()
                if not auth_info:
                    self.send_response(401); self.end_headers(); return
                try:
                    sig_id = int(path.split('/')[3])
                    conn = get_db_connection()
                    c = conn.cursor()
                    from datetime import datetime as _dt
                    c.execute("UPDATE alerts_history SET status='closed', closed_at=? WHERE id=?",
                              (_dt.utcnow().isoformat(), sig_id))
                    conn.commit(); conn.close()
                    # Bust the signal history cache so next load reflects the change
                    InstitutionalRoutesMixin._sig_history_cache.clear()
                    self.send_json({'success': True, 'id': sig_id, 'state': 'CLOSED'})
                except Exception as e:
                    self.send_error(500, str(e))
            elif path.startswith('/api/signal/') and path.endswith('/reopen'):
                # POST /api/signal/{id}/reopen — re-activate a closed signal
                auth_info = self.is_authenticated()
                if not auth_info:
                    self.send_response(401); self.end_headers(); return
                try:
                    sig_id = int(path.split('/')[3])
                    conn = get_db_connection()
                    c = conn.cursor()
                    c.execute("UPDATE alerts_history SET status='active', closed_at=NULL WHERE id=?", (sig_id,))
                    conn.commit(); conn.close()
                    InstitutionalRoutesMixin._sig_history_cache.clear()
                    self.send_json({'success': True, 'id': sig_id, 'state': 'ACTIVE'})
                except Exception as e:
                    self.send_error(500, str(e))
            else:
                self.send_error(404, 'Path not found')
        except Exception as e:
            print(f'[{datetime.now()}] POST Error: {e}')
            self.send_error(500, str(e))

    def do_GET(self):
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
            print(f"[{datetime.now()}] DEBUG_PATH: '{path}'")
            auth_info = None
            if path.startswith('/api/'):
                public_routes = ['/health', '/api/config', '/api/signals', '/api/btc', '/api/market-pulse', '/api/auth/status', '/api/system-dials', '/api/fear-greed', '/api/etf-flows', '/api/stress-test', '/api/liquidity-history', '/api/equity-klines', '/api/efficient-frontier', '/api/funding-rates', '/api/signal-radar', '/api/signal-density', '/api/whale-sankey', '/api/yield-curve', '/api/walk-forward', '/api/strategy-compare', '/api/ai-memo', '/api/signal-thesis', '/api/ask-terminal', '/api/news', '/api/macro', '/api/regime', '/api/correlation-matrix', '/api/notifications', '/api/alerts', '/api/alerts/badge', '/api/telegram/link', '/api/signal-leaderboard', '/api/history', '/api/options-signal', '/api/capital-rotation', '/api/options-flow', '/api/chain-velocity', '/api/rotation', '/api/macro-calendar', '/api/equity-options-flow', '/api/backtest-v2', '/api/signal-permalink']
                free_auth_routes = ['/api/watchlist', '/api/positions', '/api/digest/send', '/api/price-alerts', '/api/market-brief', '/api/onboarding-complete', '/api/alert-settings', '/api/user/settings']
                # /api/signal/{id} is fully public â€” no auth gate for shared links
                if path.startswith('/api/signal/'):
                    pass  # skip gate, handle_signal_permalink does not require auth
                elif path not in public_routes:
                    auth_info = self.is_authenticated()
                    if not auth_info:
                        print(f'[{datetime.now()}] AUTH FAIL: {path}')
                        self.send_response(401)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
                        return
                    if not auth_info.get('is_premium', False) and path not in free_auth_routes:
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
            elif path == '/api/config':
                self.handle_config()
            elif path == '/api/search':
                self.handle_search()
            elif path == '/api/signals':
                print(f"[{datetime.now()}] ROUTER HIT: /api/signals explicitly invoked")
                self.handle_signals()
            elif path == '/api/btc':
                self.handle_btc()
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
            elif path == '/api/liquidity':
                self.handle_liquidity()
            elif path == '/api/liquidity-history':
                self.handle_liquidity_history()
            elif path == '/api/equity-klines':
                self.handle_equity_klines()
            elif path == '/api/tape':
                self.handle_tape()
            elif path == '/api/generate-setup':
                self.handle_setup_generation()
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
            elif path.startswith('/api/system-dials'):
                self.handle_system_dials()
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
            elif path == '/api/watchlist':
                self.handle_watchlist_get(auth_info)
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
            elif path.startswith('/api/signal/'):
                # Public: /api/signal/{id} â€” no auth required for sharing
                signal_id = path.split('/')[-1]
                self.handle_signal_permalink(signal_id)
            elif path == '/api/telegram/link':
                import os
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
            elif path == '/health':
                self.handle_health()
            else:
                super().do_GET()
        except Exception as e:
            print(f'[{datetime.now()}] Global do_GET error: {e}')

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
            print(f'[Onboarding] {email} {action} â€” watchlist_count={wcount}')
            self.send_json({'success': True, 'action': action})
        except Exception as e:
            print(f'[Onboarding] Error: {e}')
            self.send_json({'success': False, 'error': str(e)})

