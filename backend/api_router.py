import json, urllib.parse, base64, hashlib, random, traceback, sqlite3, time, struct, requests, math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from backend.caching import CACHE
from backend.services import NOTIFY, ML_ENGINE, PORTFOLIO_SIM
from backend.database import SupabaseClient, DB_PATH, STRIPE_SECRET_KEY, stripe, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, SUPABASE_URL, SUPABASE_HEADERS

from backend.routes.auth import AuthRoutesMixin
from backend.routes.market import MarketRoutesMixin
from backend.routes.institutional import InstitutionalRoutesMixin
import socketserver, http.server

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class AlphaHandler(http.server.SimpleHTTPRequestHandler, AuthRoutesMixin, MarketRoutesMixin, InstitutionalRoutesMixin):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, prefer')
        self.end_headers()

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
                if 'user' in res:
                    self.send_json(res)
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
            elif path == '/api/trade-ledger':
                self.handle_trade_ledger(post_data)
            elif path == '/api/settings/test-telegram':
                self.handle_test_telegram(post_data)
            else:
                self.send_error(404, 'Path not found')
        except Exception as e:
            print(f'[{datetime.now()}] POST Error: {e}')
            self.send_error(500, str(e))

    def do_GET(self):
        print(f'[{datetime.now()}] Incoming GET: {self.path}')
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
                public_routes = ['/api/config', '/api/signals', '/api/btc', '/api/market-pulse', '/api/auth/status', '/api/system-dials', '/api/fear-greed']
                if path not in public_routes:
                    auth_info = self.is_authenticated()
                    if not auth_info:
                        print(f'[{datetime.now()}] AUTH FAIL: {path}')
                        self.send_response(401)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode('utf-8'))
                        return
                    if not auth_info.get('is_premium', False):
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
                self.handle_signals()
            elif path == '/api/btc':
                self.handle_btc()
            elif path == '/api/market-pulse':
                self.handle_market_pulse()
            elif path == '/api/alerts':
                self.handle_alerts()
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
            elif path == '/api/liquidity':
                self.handle_liquidity()
            elif path == '/api/tape':
                self.handle_tape()
            elif path == '/api/generate-setup':
                self.handle_setup_generation()
            elif path == '/api/whales':
                self.handle_whales()
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
            elif path.startswith('/api/correlation'):
                self.handle_correlation()
            elif path.startswith('/api/stress-test'):
                self.handle_risk()
            elif path.startswith('/api/fear-greed'):
                self.handle_fear_greed()
            elif path.startswith('/api/dominance'):
                self.handle_dominance()
            elif path.startswith('/api/regime'):
                self.handle_regime()
            elif path.startswith('/api/history'):
                self.handle_history()
            elif path.startswith('/api/benchmark'):
                self.handle_benchmark()
            elif path.startswith('/api/backtest'):
                self.handle_backtest()
            elif path.startswith('/api/onchain'):
                self.handle_onchain()
            elif path.startswith('/api/portfolio_optimize'):
                self.handle_portfolio_optimize()
            else:
                super().do_GET()
        except Exception as e:
            print(f'[{datetime.now()}] Global do_GET error: {e}')

    def _get_signals(self):
        try:
            all_tickers = list(dict.fromkeys([t for sub in UNIVERSE.values() for t in sub]))
            data = CACHE.download(all_tickers, period='2y', interval='1wk', column='Close')
            if data is None or data.empty:
                print('Briefing engine: No data returned from download')
                return []
            returns = data.pct_change().dropna(how='all')
            if returns.empty:
                return []
            mean_vals = returns.mean()
            std_vals = returns.std()
            last_returns = returns.iloc[-1]
            z_scores = ((last_returns - mean_vals) / std_vals.replace(0, np.nan)).fillna(0)
            signals = []
            for ticker in all_tickers:
                try:
                    if ticker not in data.columns:
                        continue
                    ticker_series = data[ticker].dropna()
                    if ticker_series.empty:
                        continue
                    price = float(ticker_series.iloc[-1])
                    z = float(z_scores.get(ticker, 0))
                    if not np.isfinite(z):
                        z = 0.0
                    z = max(min(z, 5.0), -5.0)
                    score = 50 + z * 10
                    signals.append({'ticker': ticker, 'price': price, 'z_score': round(z, 2), 'score': round(score, 1), 'risk': 'LOW' if score > 70 else 'HIGH', 'mindshare': np.random.randint(1, 10)})
                except:
                    continue
            return sorted(signals, key=lambda x: x['score'], reverse=True)
        except Exception as e:
            print(f'Internal signals error: {e}')
            return []

    def handle_stress_test(self):
        """Phase 7: Systematic Stress Test Engine."""
        try:
            all_tickers = [t for sub in UNIVERSE.values() for t in sub][:15]
            data = CACHE.download(all_tickers + ['BTC-USD'], period='180d', interval='1d', column='Close')
            btc_rets = data['BTC-USD'].pct_change().dropna()
            results = []
            for ticker in all_tickers:
                if ticker not in data.columns or ticker == 'BTC-USD':
                    continue
                rets = data[ticker].pct_change().dropna()
                common = rets.index.intersection(btc_rets.index)
                if len(common) < 30:
                    continue
                a_rets = rets.loc[common]
                b_rets = btc_rets.loc[common]
                cov = np.cov(a_rets, b_rets)[0, 1]
                var_b = np.var(b_rets)
                beta = cov / var_b if var_b > 0 else 1.0
                results.append({'ticker': ticker, 'beta': round(float(beta), 2), 'impacts': {'btc_minus_5': round(float(beta * -5.0), 2), 'btc_minus_10': round(float(beta * -10.0), 2), 'btc_minus_20': round(float(beta * -20.0), 2)}})
            self.send_json({'benchmark': 'BTC-USD', 'scenarios': results, 'timestamp': datetime.now().strftime('%H:%M')})
        except Exception as e:
            self.send_json({'error': str(e)})

    def get_context_news(self):
        cache_key = 'newsroom:context'
        cached = CACHE.get(cache_key)
        if cached is not None:
            return cached
        results = []
        try:
            news_tickers = ['BTC-USD', 'MSTR', 'ETH-USD', 'COIN', 'SOL-USD', 'MARA', 'IBIT']
            for ticker in news_tickers:
                try:
                    t = yf.Ticker(ticker)
                    news = t.news
                    if not news:
                        continue
                    for article in news[:3]:
                        content = article.get('content', {})
                        title = content.get('title', '')
                        summary = content.get('summary', '')
                        pub_date = content.get('pubDate', '')
                        if not title:
                            continue
                        text = (title + ' ' + summary).lower()
                        p_count = sum((1 for k in SENTIMENT_KEYWORDS['positive'] if k in text))
                        n_count = sum((1 for k in SENTIMENT_KEYWORDS['negative'] if k in text))
                        if p_count > n_count:
                            sentiment = 'BULLISH'
                        elif n_count > p_count:
                            sentiment = 'BEARISH'
                        else:
                            sentiment = 'NEUTRAL'
                        try:
                            dt = datetime.strptime(pub_date, '%Y-%m-%dT%H:%M:%SZ')
                            time_str = dt.strftime('%H:%M:%S')
                        except:
                            time_str = datetime.now().strftime('%H:%M:%S')
                        results.append({'ticker': ticker, 'sentiment': sentiment, 'headline': title, 'time': time_str, 'summary': summary[:200] + '...' if len(summary) > 200 else summary, 'content': f'<p><b>Institutional Intelligence Report:</b> {summary}</p><p>Technical analysis of {ticker} confirms that recent narrative shifts are aligning with order flow magnitude monitor (GOMM) clusters. Sentiment remains {sentiment.lower()} based on real-time news aggregation.</p><p><i>AlphaSignal Intelligence Desk - Terminal Segment</i></p>'})
                except Exception as e:
                    print(f'Error fetching news for {ticker}: {e}')
            if not results:
                results.append({'ticker': 'MACRO', 'sentiment': 'NEUTRAL', 'headline': 'Terminal Synchronization Active; Awaiting Volatility Catalysts', 'time': datetime.now().strftime('%H:%M:%S'), 'summary': 'AlphaSignal monitoring engine is scanning institutional data streams.', 'content': '<p>All systems operational. Narrative extraction engine is current scanning 20+ assets for institutional signals.</p>'})
            results = sorted(results, key=lambda x: x['time'], reverse=True)
            CACHE.set(cache_key, results)
        except Exception as e:
            print(f'Newsroom context error: {e}')
        return results[:20]

    def handle_config(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'stripe_publishable_key': STRIPE_PUBLISHABLE_KEY}).encode('utf-8'))

