import json, urllib.parse, base64, hashlib, random, traceback, sqlite3, time, struct, requests, math
from backend.routes.realdata import (
    fetch_fear_greed, fetch_network_congestion, fetch_retail_fomo,
    fetch_defi_llama_chains, fetch_coingecko_categories, fetch_binance_trades
)
import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from backend.caching import CACHE
from backend.services import NOTIFY, ML_ENGINE, PORTFOLIO_SIM, get_ticker_name, get_sentiment
from backend.database import SupabaseClient, DB_PATH, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, stripe, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, SUPABASE_URL, SUPABASE_HEADERS

class MarketRoutesMixin:
    def handle_sectors(self):
        try:
            cats = fetch_coingecko_categories()
            # Normalise market caps to percentage weights for the treemap
            total = sum(c['value'] for c in cats) or 1
            payload = [
                {'name': c['name'],
                 'value': round(c['value'] / total * 100, 2),
                 'perf':  round(c['perf'], 2)}
                for c in cats
            ]
            self.send_json({'name': 'root', 'children': payload, 'source': 'coingecko'})
        except Exception as e:
            print(f'Sectors Error: {e}')
            self.send_json({'error': 'Failed to sync sectors'})

    def handle_system_dials(self):
        try:
            fg      = fetch_fear_greed()
            congestion = fetch_network_congestion()
            fomo    = fetch_retail_fomo('Bitcoin')
            dials = {
                'fear_greed':         {'value': fg['value'],       'label': fg['label']},
                'network_congestion': {'value': congestion,        'label': 'Network Congestion'},
                'retail_fomo':        {'value': fomo['value'],     'label': 'Retail FOMO',
                                       'source': fomo['source']},
            }
            self.send_json({'dials': dials, 'source': 'alternative.me+mempool.space+trends'})
        except Exception as e:
            print(f'Dials Error: {e}')
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
        # ── 1. Try real alternative.me Fear & Greed Index ────────────────────
        try:
            fg = fetch_fear_greed()
            if fg and fg.get('source') != 'fallback' and isinstance(fg.get('value'), int):
                score = fg['value']
                raw_label = fg.get('label', '')
                # Normalise label to uppercase short form
                label_map = {
                    'Extreme Fear': 'EXTREME FEAR', 'Fear': 'FEAR',
                    'Neutral': 'NEUTRAL', 'Greed': 'GREED', 'Extreme Greed': 'EXTREME GREED'
                }
                label = label_map.get(raw_label, raw_label.upper())
                self.send_json({'score': score, 'label': label, 'source': 'alternative.me'})
                return
        except Exception as e:
            print(f'[FearGreed/alternative.me] {e}')

        # ── 2. Fallback: derive from BTC price deviation vs SMA-50 ───────────
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
                if score < 25:   label = 'EXTREME FEAR'
                elif score < 45: label = 'FEAR'
                elif score < 55: label = 'NEUTRAL'
                elif score < 75: label = 'GREED'
                else:            label = 'EXTREME GREED'
                self.send_json({'score': score, 'label': label, 'source': 'derived'})
                return
        except Exception as e:
            print(f'[FearGreed/derived] {e}')
        self.send_json({'score': 50, 'label': 'NEUTRAL', 'source': 'fallback'})

    # --- Phase 15-A: CryptoPanic news cache ---
    _news_cache = {'data': None, 'ts': 0}

    def handle_news(self):
        """Fetch live crypto news from CryptoPanic public RSS — no API key required."""
        now = time.time()
        # 10-minute cache
        if self._news_cache['data'] and (now - self._news_cache['ts']) < 600:
            self.send_json(self._news_cache['data'])
            return
        try:
            import xml.etree.ElementTree as ET
            r = requests.get(
                'https://cryptopanic.com/news/rss/',
                timeout=6,
                headers={'User-Agent': 'AlphaSignal/1.25 (institutional terminal)'}
            )
            articles = []
            if r.status_code == 200:
                root = ET.fromstring(r.content)
                ns = {'dc': 'http://purl.org/dc/elements/1.1/'}
                for item in root.findall('.//item')[:25]:
                    title = item.findtext('title', '').strip()
                    link  = item.findtext('link', '').strip()
                    pubdate = item.findtext('pubDate', '').strip()
                    source = item.findtext('dc:creator', 'CryptoPanic', ns).strip()
                    # Basic sentiment heuristic
                    lc = title.lower()
                    sentiment = 'BULLISH' if any(w in lc for w in ['surge', 'rally', 'soar', 'pump', 'all-time', 'ath', 'bullish', 'gain']) \
                               else 'BEARISH' if any(w in lc for w in ['crash', 'plunge', 'drop', 'dump', 'bear', 'sell', 'fear', 'risk', 'ban']) \
                               else 'NEUTRAL'
                    articles.append({
                        'title': title, 'url': link,
                        'source': source, 'published': pubdate,
                        'sentiment': sentiment
                    })
            if articles:
                result = {'articles': articles, 'source': 'cryptopanic_rss',
                          'last_update': datetime.now().strftime('%Y-%m-%d %H:%M')}
                MarketRoutesMixin._news_cache = {'data': result, 'ts': now}
                self.send_json(result)
                return
        except Exception as e:
            print(f'[News/CryptoPanic] {e}')
        # Fallback to existing static news
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
            # Map ticker to Binance symbol
            symbol = ticker.replace('-USD', 'USDT').replace('-', '')
            if not symbol.endswith('USDT') and not symbol.endswith('BTC'):
                symbol = symbol + 'USDT'
            raw = fetch_binance_trades(symbol, limit=50)
            trades = []
            buy_vol = 0.0
            sell_vol = 0.0
            for t in raw:
                price  = float(t['price'])
                qty    = float(t['qty'])
                val    = round(price * qty, 2)
                # isBuyerMaker=True means a sell order filled a buy order → taker is seller
                side   = 'SELL' if t.get('isBuyerMaker') else 'BUY'
                ts_ms  = t.get('time', 0)
                ts_str = datetime.fromtimestamp(ts_ms / 1000).strftime('%H:%M:%S') if ts_ms else '--'
                if side == 'BUY':
                    buy_vol += val
                else:
                    sell_vol += val
                trades.append({
                    'id':          str(t.get('id', '')),
                    'time':        ts_str,
                    'price':       price,
                    'size':        round(qty, 4),
                    'value':       val,
                    'side':        side,
                    'exchange':    'Binance',
                    'institutional': val > 250000
                })
            if not trades:
                # Fallback generator for equities/missing symbols
                import hashlib, random
                from datetime import datetime as dt, timedelta
                seed = int(hashlib.md5(ticker.encode()).hexdigest()[:8], 16)
                rng = random.Random(seed + int(time.time() // 10)) # rotates every 10s
                
                # We need a rough price reference. If not available, use random base.
                base_price = 100.0
                if 'base_price' in query:
                    try: base_price = float(query['base_price'][0])
                    except: pass

                buy_vol = 0.0
                sell_vol = 0.0
                for i in range(12):
                    p = round(base_price * rng.uniform(0.998, 1.002), 2)
                    side = rng.choice(['BUY', 'SELL'])
                    
                    # Generate sizes and ensure some are large (whale prints)
                    if rng.random() > 0.8:
                        size = round(rng.uniform(1000, 5000), 2)  # Whale
                    else:
                        size = round(rng.uniform(10, 500), 2)     # Normal

                    val = round(p * size, 2)
                    if side == 'BUY': buy_vol += val
                    else: sell_vol += val

                    trades.append({
                        'id': f"sim_{int(time.time()*1000)}_{i}",
                        'time': (dt.now() - timedelta(seconds=rng.randint(0, 10))).strftime('%H:%M:%S'),
                        'price': p,
                        'size': size,
                        'value': val,
                        'side': side,
                        'exchange': 'Simulation',
                        'institutional': val > 100000
                    })
                
                # Add synthetic marker
                source = 'synthetic'
            else:
                source = 'binance_rest'

            self.send_json({
                'ticker': ticker,
                'trades': sorted(trades, key=lambda x: x['time'], reverse=True)[:30],
                'aggregation': {'buy_volume': round(buy_vol, 2), 'sell_volume': round(sell_vol, 2)},
                'source': source
            })
        except Exception as e:
            print(f'[TapeEngine] {e}')
            self.send_json({'ticker': ticker, 'trades': [], 'aggregation': {'buy_volume': 0, 'sell_volume': 0}, 'source': 'error'})

    def handle_macro_calendar_legacy(self):
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

    _etf_flows_cache = {'data': None, 'ts': 0}

    def handle_etf_flows(self):
        """Real ETF flow proxy using yfinance IBIT/FBTC/ARKB/BITB daily price data.
        Flow intensity = daily net AUM change estimate (price × shares outstanding proxy).
        Falls back to seeded realistic data if yfinance is unavailable."""
        import time as _time
        now = _time.time()
        # 15-minute cache
        if self._etf_flows_cache['data'] and (now - self._etf_flows_cache['ts']) < 900:
            self.send_json(self._etf_flows_cache['data'])
            return
        try:
            etfs = [
                {'ticker': 'IBIT',  'name': 'IBIT (BlackRock)',  'color': '#7dd3fc', 'aum_b': 40.2},
                {'ticker': 'FBTC',  'name': 'FBTC (Fidelity)',   'color': '#86efac', 'aum_b': 16.8},
                {'ticker': 'ARKB',  'name': 'ARKB (Ark)',        'color': '#facc15', 'aum_b': 3.4},
                {'ticker': 'BITB',  'name': 'BITB (Bitwise)',    'color': '#a78bfa', 'aum_b': 2.1},
            ]
            labels = []
            datasets = []
            total_aum = sum(e['aum_b'] for e in etfs)
            try:
                import yfinance as yf
                # Fetch 15 days to guarantee 10 trading days
                tickers = [e['ticker'] for e in etfs]
                raw = yf.download(tickers, period='15d', interval='1d', auto_adjust=True, progress=False)
                close = raw['Close'] if isinstance(raw.columns, pd.MultiIndex) else raw
                close = close.dropna(how='all').tail(10)
                labels = [d.strftime('%a %d %b') for d in close.index]
                cumulative_net = [0.0] * len(labels)
                for etf in etfs:
                    tk = etf['ticker']
                    if tk not in close.columns:
                        raise ValueError(f'{tk} not in data')
                    prices = close[tk].values.tolist()
                    # Compute daily flow proxy: AUM × daily return (in $M)
                    flows = []
                    for i in range(len(prices)):
                        if i == 0:
                            flows.append(0.0)
                        else:
                            daily_ret = (prices[i] - prices[i-1]) / prices[i-1] if prices[i-1] else 0
                            # Scale by AUM in millions
                            flow_m = round(etf['aum_b'] * 1000 * daily_ret, 1)
                            flows.append(flow_m)
                    etf['flows'] = flows
                    for i, f in enumerate(flows):
                        cumulative_net[i] = round(cumulative_net[i] + f, 1)
                for etf in etfs:
                    datasets.append({'name': etf['name'], 'color': etf['color'], 'data': etf['flows']})
                # Build running cumulative total
                running = 0.0
                cumulative_running = []
                for v in cumulative_net:
                    running = round(running + v, 1)
                    cumulative_running.append(running)
                result = {
                    'labels': labels,
                    'datasets': datasets,
                    'cumulative': cumulative_running,
                    'total_aum_b': round(total_aum, 1),
                    'source': 'yfinance_live'
                }
                MarketRoutesMixin._etf_flows_cache = {'data': result, 'ts': now}
                self.send_json(result)
                return
            except Exception as yf_err:
                print(f'[ETF Flows] yfinance error: {yf_err}, using seeded fallback')
            # Seeded fallback — realistic but deterministic per calendar week
            import random as _rnd
            seed_val = int(now / 86400 / 7)  # changes weekly
            _rnd.seed(seed_val)
            from datetime import datetime as _dt, timedelta as _td
            today = _dt.now()
            trading_days = []
            d = today - _td(days=14)
            while len(trading_days) < 10:
                if d.weekday() < 5:
                    trading_days.append(d)
                d += _td(days=1)
            labels = [d.strftime('%a %d %b') for d in trading_days]
            etf_flows_data = [
                {'name': 'IBIT (BlackRock)', 'color': '#7dd3fc', 'base': 420},
                {'name': 'FBTC (Fidelity)',  'color': '#86efac', 'base': 210},
                {'name': 'ARKB (Ark)',       'color': '#facc15', 'base': 52},
                {'name': 'BITB (Bitwise)',   'color': '#a78bfa', 'base': 28},
            ]
            cumulative_running = []
            running = 0.0
            day_totals = [0.0] * 10
            fallback_datasets = []
            for etf in etf_flows_data:
                flows = [round(etf['base'] * (_rnd.uniform(0.4, 1.8)) * (_rnd.choice([-1, 1, 1, 1])), 0) for _ in range(10)]
                fallback_datasets.append({'name': etf['name'], 'color': etf['color'], 'data': flows})
                for i, f in enumerate(flows):
                    day_totals[i] = round(day_totals[i] + f, 0)
            for v in day_totals:
                running = round(running + v, 0)
                cumulative_running.append(running)
            result = {
                'labels': labels,
                'datasets': fallback_datasets,
                'cumulative': cumulative_running,
                'total_aum_b': round(total_aum, 1),
                'source': 'seeded_fallback'
            }
            MarketRoutesMixin._etf_flows_cache = {'data': result, 'ts': now}
            self.send_json(result)
        except Exception as e:
            print(f'[ETF Flows] Fatal error: {e}')
            self.send_json({'error': 'ETF Flows unavailable', 'labels': [], 'datasets': [], 'cumulative': []})

    def handle_signal_density(self):
        """Return 30-day daily signal firing counts for the authenticated user."""
        auth_info  = self.is_authenticated()
        user_email = auth_info.get('email') if auth_info else None
        try:
            import datetime as dt
            today  = dt.date.today()
            cutoff = (today - dt.timedelta(days=29)).isoformat()

            conn = sqlite3.connect(DB_PATH)
            c    = conn.cursor()

            if user_email:
                c.execute(
                    """SELECT DATE(timestamp) as day, COUNT(*) as cnt
                       FROM alerts_history
                       WHERE timestamp >= ? AND user_email = ?
                       GROUP BY day
                       ORDER BY day ASC""",
                    (cutoff, user_email)
                )
            else:
                # Unauthenticated — return global system density
                c.execute(
                    """SELECT DATE(timestamp) as day, COUNT(*) as cnt
                       FROM alerts_history
                       WHERE timestamp >= ? AND user_email IS NULL
                       GROUP BY day
                       ORDER BY day ASC""",
                    (cutoff,)
                )

            rows = c.fetchall()
            conn.close()

            # Build a full 30-day series (0 for days with no signal)
            counts_map = {r[0]: r[1] for r in rows}
            labels, counts = [], []
            for i in range(30):
                d     = today - dt.timedelta(days=29 - i)
                d_str = d.strftime('%Y-%m-%d')
                labels.append(f'D-{29 - i}')
                counts.append(counts_map.get(d_str, 0))

            has_real = any(v > 0 for v in counts)
            # If no history yet, generate a plausible synthetic baseline
            if not has_real:
                import hashlib as _hl
                seed = int(_hl.md5(str(today).encode()).hexdigest()[:8], 16)
                rng  = np.random.default_rng(seed)
                counts = [int(v) for v in rng.integers(1, 8, 30)]
                counts[-6] = 9; counts[-5] = 22; counts[-4] = 17; counts[-3] = 11

            self.send_json({
                'labels': labels,
                'counts': counts,
                'source': 'live' if has_real else 'synthetic'
            })
        except Exception as e:
            print(f'[SignalDensity] {e}')
            self.send_json({'error': str(e)})

    def handle_config(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'stripe_publishable_key': STRIPE_PUBLISHABLE_KEY}).encode('utf-8'))

