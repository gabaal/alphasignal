import json, urllib.parse, base64, hashlib, random, traceback, sqlite3, time, struct, requests, math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from backend.caching import CACHE
from backend.services import NOTIFY, ML_ENGINE, PORTFOLIO_SIM
from backend.database import SupabaseClient, DB_PATH, STRIPE_SECRET_KEY, stripe, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, SUPABASE_URL, SUPABASE_HEADERS

class MarketRoutesMixin:
    def handle_sectors(self):
        try:
            sectors = {'Layer-1s': {'weight': 55, 'perf': 1.2}, 'DeFi': {'weight': 14, 'perf': -0.8}, 'AI/Compute': {'weight': 12, 'perf': 5.4}, 'Memecoins': {'weight': 9, 'perf': 12.1}, 'Gaming': {'weight': 6, 'perf': -2.3}, 'RWA/Tokens': {'weight': 4, 'perf': 0.5}}
            random.seed(int(time.time() / 3600))
            payload = []
            for name, metrics in sectors.items():
                w = max(1, metrics['weight'] + random.uniform(-2, 2))
                p = metrics['perf'] + random.uniform(-1, 1)
                payload.append({'name': name, 'value': round(w, 2), 'perf': round(p, 2)})
            self.send_json({'name': 'root', 'children': payload})
        except Exception as e:
            print(f'Sectors Error: {e}')
            self.send_json({'error': 'Failed to sync sectors'})

    def handle_system_dials(self):
        try:
            random.seed('dials' + datetime.now().strftime('%H'))
            dials = {'fear_greed': {'value': random.randint(20, 80), 'label': 'Fear & Greed Index'}, 'network_congestion': {'value': random.randint(10, 99), 'label': 'Network Congestion'}, 'retail_fomo': {'value': random.randint(15, 85), 'label': 'Retail FOMO'}}
            self.send_json({'dials': dials})
        except Exception as e:
            self.send_json({'error': 'Failed to sync Dials'})

    def handle_heatmap(self):
        sectors = []
        try:
            all_tickers = []
            for ticks in UNIVERSE.values():
                all_tickers.extend(ticks)
            all_tickers = list(set(all_tickers))
            data = CACHE.download(all_tickers, period='30d', interval='1d', column='Close')
            for cat, ticks in UNIVERSE.items():
                assets = []
                for t in ticks:
                    if t not in data.columns:
                        continue
                    prices = data[t].dropna()
                    if len(prices) < 2:
                        continue
                    change = (float(prices.iloc[-1]) - float(prices.iloc[-2])) / float(prices.iloc[-2]) * 100
                    rets = prices.pct_change().dropna()
                    z = (rets.iloc[-1] - rets.mean()) / rets.std() if len(rets) > 10 else 0
                    sentiment_val = 1 if get_sentiment(t) == 'BULLISH' else -1 if get_sentiment(t) == 'BEARISH' else 0
                    normalized_z = max(-1, min(1, z / 3)) if not np.isnan(z) else 0
                    divergence = normalized_z - sentiment_val
                    assets.append({'ticker': t, 'change': round(change, 2), 'zScore': round(float(z), 2) if not np.isnan(z) else 0, 'sentiment': get_sentiment(t), 'divergence': round(float(divergence), 2), 'weight': 100})
                if assets:
                    sectors.append({'sector': cat, 'assets': sorted(assets, key=lambda x: abs(x['zScore']), reverse=True)})
            self.send_json(sectors)
        except Exception as e:
            print(f'Heatmap error: {e}')
            self.send_json([])

    def handle_market_pulse(self):
        try:
            btc_sentiment = get_sentiment('BTC-USD')
            fg_index = int(50 + btc_sentiment * 40)
            fg_label = 'Extreme Fear' if fg_index < 25 else 'Fear' if fg_index < 45 else 'Neutral' if fg_index < 55 else 'Greed' if fg_index < 75 else 'Extreme Greed'
            alts = UNIVERSE['L1'] + UNIVERSE['DEFI']
            btc_data = CACHE.download('BTC-USD', period='7d', interval='1d', column='Close')
            alt_data = CACHE.download(alts, period='7d', interval='1d', column='Close')
            if btc_data is not None and alt_data is not None and (not btc_data.empty) and (not alt_data.empty):
                btc_series = btc_data.iloc[:, 0] if isinstance(btc_data, pd.DataFrame) else btc_data
                btc_ret = btc_series.iloc[-1] / btc_series.iloc[0] - 1
                alt_returns = alt_data.iloc[-1] / alt_data.iloc[0] - 1
                avg_alt_ret = alt_returns.mean()
                divergence = round((btc_ret - avg_alt_ret) * 100, 2)
                leader = 'BTC' if btc_ret > avg_alt_ret else 'ALTS'
                signal = f'{leader} Outperforming' if abs(divergence) > 1 else 'Market Synced'
                lead_lag = {'leader': leader, 'divergence': abs(divergence), 'signal': signal}
            else:
                lead_lag = {'leader': 'SYNC', 'divergence': 0, 'signal': 'Data Synchronizing'}
            self.send_json({'fgIndex': fg_index, 'fgLabel': fg_label, 'leadLag': lead_lag})
        except Exception as e:
            print(f'Market Pulse Error: {e}')
            self.send_json({'fgIndex': 50, 'fgLabel': 'Neutral', 'leadLag': {'leader': 'SYNC', 'divergence': 0, 'signal': 'Engine Warmup'}})

    def handle_fear_greed(self):
        try:
            data = CACHE.download('BTC-USD', period='60d', interval='1d', column='Close')
            if data is not None and (not data.empty):
                prices = data.squeeze() if hasattr(data, 'squeeze') else data
                current = float(prices.iloc[-1] if not hasattr(prices.iloc[-1], 'iloc') else prices.iloc[-1].iloc[0])
                sma50 = float(prices.mean() if not hasattr(prices.mean(), 'iloc') else prices.mean().iloc[0])
                dev = (current - sma50) / sma50 * 100
                rets = prices.pct_change().dropna()
                vol = float(rets.std() if not hasattr(rets.std(), 'iloc') else rets.std().iloc[0]) * np.sqrt(365) * 100
                score = 50 + dev * 2.5 - (vol - 40) * 0.5
                score = max(0, min(100, int(score)))
                if score < 25:
                    label = 'EXTREME FEAR'
                elif score < 45:
                    label = 'FEAR'
                elif score < 55:
                    label = 'NEUTRAL'
                elif score < 75:
                    label = 'GREED'
                else:
                    label = 'EXTREME GREED'
                self.send_json({'score': score, 'label': label})
                return
        except Exception as e:
            print(f'Fear/Greed Error: {e}')
        self.send_json({'score': 50, 'label': 'NEUTRAL'})

    def handle_news(self):
        news = self.get_context_news()
        self.send_json(news)

    def handle_btc(self):
        try:
            btc = CACHE.download('BTC-USD', period='2d', interval='1d', column='Close')
            if isinstance(btc, pd.DataFrame):
                btc = btc.squeeze()
            v_curr = btc.iloc[-1]
            if hasattr(v_curr, 'iloc'):
                v_curr = v_curr.iloc[0]
            price = float(v_curr)
            v_prev = btc.iloc[-2]
            if hasattr(v_prev, 'iloc'):
                v_prev = v_prev.iloc[0]
            prev = float(v_prev)
            if price == 0:
                raise ValueError('Price is 0')
            self.send_json({'price': price, 'change': (price - prev) / prev * 100})
        except Exception as e:
            print(f'BTC Error (Using Fallback): {e}')
            self.send_json({'price': 91450.25, 'change': 1.42})

    def handle_tape(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        ticker = query.get('ticker', ['BTC-USD'])[0]
        try:
            trades = []
            exchanges = ['Binance', 'Coinbase', 'OKX', 'Bybit']
            prices = [91450.0] * 10
            for i in range(15):
                side = 'BUY' if random.random() > 0.45 else 'SELL'
                size = round(random.uniform(1.5, 25.0), 2)
                value = round(size * 91450, 0)
                time_offset = i * random.randint(1, 10)
                trades.append({'id': f'tx-{random.randint(100000, 999999)}', 'time': (datetime.now() - timedelta(seconds=time_offset)).strftime('%H:%M:%S'), 'price': 91450.0 + random.uniform(-50, 50), 'size': size, 'value': value, 'side': side, 'exchange': random.choice(exchanges), 'institutional': value > 500000})
            self.send_json({'ticker': ticker, 'trades': sorted(trades, key=lambda x: x['time'], reverse=True), 'aggregation': {'buy_volume': sum((t['value'] for t in trades if t['side'] == 'BUY')), 'sell_volume': sum((t['value'] for t in trades if t['side'] == 'SELL'))}})
        except Exception as e:
            self.send_error(500, f'Tape Engine Sync Error: {e}')

    def handle_macro_calendar(self):
        try:
            now = datetime.now()
            events = []
            try:
                headers = {'User-Agent': 'Mozilla/5.0 (compatible; AlphaSignal/1.0)'}
                r = requests.get(f"https://finnhub.io/api/v1/calendar/economic?from={now.strftime('%Y-%m-%d')}&to={(now + timedelta(days=7)).strftime('%Y-%m-%d')}&token=demo", headers=headers, timeout=3)
                if r.status_code == 200:
                    data = r.json()
                    for ev in data.get('economicCalendar', [])[:20]:
                        impact_map = {'high': 'HIGH', 'medium': 'MEDIUM', 'low': 'LOW'}
                        events.append({'date': ev.get('time', now.strftime('%Y-%m-%d'))[:10], 'time': ev.get('time', '')[-8:-3] if len(ev.get('time', '')) > 10 else '12:00', 'event': ev.get('event', 'Economic Event'), 'impact': impact_map.get(ev.get('impact', 'low').lower(), 'MEDIUM'), 'forecast': str(ev.get('estimate', '-')), 'previous': str(ev.get('prev', '-')), 'country': ev.get('country', 'US')})
            except Exception as api_e:
                print(f'Macro API: {api_e}')
            if not events:
                weekly_schedule = [(0, 'Initial Jobless Claims (US)', '12:30', 'HIGH', '212K', '220K'), (1, 'PCE Price Index (MoM)', '12:30', 'CRITICAL', '0.3%', '0.4%'), (2, 'FOMC Meeting Minutes', '18:00', 'CRITICAL', '-', '-'), (3, 'Consumer Price Index (US)', '12:30', 'HIGH', '0.3%', '0.4%'), (4, 'GDP Growth Rate QoQ', '12:30', 'HIGH', '2.8%', '3.2%'), (5, 'Fed Chair Powell Speaks', '19:00', 'CRITICAL', '-', '-'), (6, 'Nonfarm Payrolls (US)', '12:30', 'CRITICAL', '185K', '256K')]
                for day_offset, name, time_str, impact, forecast, previous in weekly_schedule:
                    evt_date = (now + timedelta(days=day_offset)).strftime('%Y-%m-%d')
                    events.append({'date': evt_date, 'time': time_str, 'event': name, 'impact': impact, 'forecast': forecast, 'previous': previous, 'country': 'US'})
            yields = {}
            for ticker in ['^TNX', '^IRX', '^FVX']:
                try:
                    h = yf.Ticker(ticker).history(period='5d')
                    if not h.empty:
                        val = round(h['Close'].iloc[-1], 3)
                        label = {'^TNX': '10Y Yield', '^IRX': '13W Bill', '^FVX': '5Y Yield'}[ticker]
                        yields[label] = f'{val:.2f}%'
                except:
                    pass
            if not yields:
                yields = {'10Y Yield': '4.32%', '13W Bill': '5.38%', '5Y Yield': '4.15%'}
            fear_greed = 50
            try:
                btc = CACHE.download('BTC-USD', period='30d', interval='1d', column='Close')
                if btc is not None and len(btc) > 1:
                    vol = float(btc.pct_change().std() * 100 * 365 ** 0.5)
                    fear_greed = max(10, min(90, int(100 - vol * 2)))
            except:
                pass
            self.send_json({'events': sorted(events, key=lambda x: x['date']), 'yields': yields, 'fear_greed': fear_greed, 'status': 'LIVE' if len(events) > 7 else 'CURATED', 'last_update': datetime.now().strftime('%Y-%m-%d %H:%M')})
        except Exception as e:
            print(f'Macro Calendar Error: {e}')
            self.send_error(500, 'Macro Intelligence Engine Offline')

