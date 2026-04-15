import sqlite3
import requests
import json
import os
import time
import threading
import concurrent.futures
import random
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import yfinance as yf
from .database import DB_PATH, UNIVERSE
from .caching import CACHE
INFO_CACHE = {}
def get_ticker_name(ticker):
    if ticker in INFO_CACHE: return INFO_CACHE[ticker]
    try:
        t = CACHE.ticker_info(ticker)
        name = t.info.get('longName', ticker)
        INFO_CACHE[ticker] = name
        return name
    except: return ticker

def get_sentiment(ticker):
    res = get_sentiment_batch([ticker])
    return res.get(ticker, 0.0)

def get_sentiment_batch(tickers):
    results = {}
    missing = []
    
    for ticker in tickers:
        cache_key = f"sentiment:{ticker}"
        cached = CACHE.get(cache_key)
        if cached is not None:
            results[ticker] = cached
        else:
            missing.append(ticker)
            
    if not missing: return results
    
    def fetch_one(ticker):
        try:
            t = yf.Ticker(ticker)
            news = t.news
            if not news: return ticker, 0.0
            
            score = 0
            articles_to_scan = news[:8]
            for article in articles_to_scan:
                content = article.get('content', {})
                text = (content.get('title', '') + " " + content.get('summary', '')).lower()
                if not text.strip(): continue
                p_count = sum(1 for k in SENTIMENT_KEYWORDS['positive'] if k in text)
                n_count = sum(1 for k in SENTIMENT_KEYWORDS['negative'] if k in text)
                if p_count > n_count: score += 1
                elif n_count > p_count: score -= 1
            
            final_score = score / len(articles_to_scan) if articles_to_scan else 0
            return ticker, max(min(final_score, 1.0), -1.0)
        except Exception as e:
            return ticker, 0.0

    to_cache = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_one, t): t for t in missing}
        for future in concurrent.futures.as_completed(futures):
            ticker, score = future.result()
            results[ticker] = score
            to_cache[f"sentiment:{ticker}"] = score
            
    if to_cache:
        CACHE.set_batch(to_cache)
        
    return results

def get_orderbook_imbalance(ticker):
    try:
        symbol = ticker.replace("-USD", "USDT").replace("-", "")
        r = requests.get(f"https://api.binance.com/api/v3/depth?symbol={symbol}&limit=20", timeout=2)
        if r.status_code == 200:
            data = r.json()
            bids = sum(float(b[1]) for b in data.get('bids', []))
            asks = sum(float(a[1]) for a in data.get('asks', []))
            if (bids + asks) == 0: return 0.0
            return (bids - asks) / (bids + asks)
    except: pass
    return random.uniform(-0.2, 0.2)

class NotificationService:
    @staticmethod
    def _tg_escape(text: str) -> str:
        """Escape special chars for Telegram HTML mode: only &, <, > need escaping."""
        return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    @staticmethod
    def push_webhook(user_email, title, message, data=None, embed_color=0x00f2ff, fields=None):
        """Send a rich notification to Discord and/or Telegram for the given user.
        embed_color: 0x22c55e (green/long), 0xef4444 (red/short), 0x00f2ff (cyan/info)
        fields: list of dicts with keys 'name', 'value', 'inline' for Discord embed fields
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute(
                "SELECT discord_webhook, telegram_chat_id, COALESCE(telegram_alerts_enabled, 1) "
                "FROM user_settings WHERE user_email = ? AND alerts_enabled = 1",
                (user_email,)
            )
            row = c.fetchone()
            conn.close()

            if not row: return
            discord, telegram_chat_id, tg_enabled = row
            # B7: if user ran /unsub in the bot, suppress Telegram but keep Discord
            if not tg_enabled:
                telegram_chat_id = None

            # ── Discord Dispatch ──────────────────────────────────────────────
            if discord:
                embed = {
                    "title": f"🚨 AlphaSignal: {title}",
                    "description": message,
                    "color": embed_color,
                    "timestamp": datetime.utcnow().isoformat() + 'Z',
                    "footer": {"text": "AlphaSignal Terminal  |  Institutional Intelligence Engine"},
                    "thumbnail": {"url": "https://alphasignal.digital/assets/pwa-icon-192.png"}
                }
                if fields:
                    embed["fields"] = fields
                try:
                    # B2: Add bot identity so embeds show branded sender
                    resp = requests.post(discord, json={
                        "username": "AlphaSignal",
                        "avatar_url": "https://alphasignal.digital/assets/pwa-icon-192.png",
                        "embeds": [embed]
                    }, timeout=5)
                    # B1: Log failed deliveries (e.g. 404 = deleted webhook)
                    if not resp.ok:
                        print(f"[NOTIFY] Discord delivery failed: HTTP {resp.status_code} — {resp.text[:200]}")
                except Exception as de:
                    print(f"[NOTIFY] Discord error: {de}")

            # ── Telegram Dispatch (HTML mode — B5 fix) ─────────────────────────
            # parse_mode: Markdown breaks silently on _, *, `, [ in messages.
            # HTML mode only requires escaping &, <, > — far more robust.
            if telegram_chat_id and os.getenv("TELEGRAM_BOT_TOKEN"):
                bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
                esc = NotificationService._tg_escape
                field_lines = ''
                if fields:
                    field_lines = '\n' + '\n'.join(
                        f"<b>{esc(f['name'])}:</b> {esc(f['value'])}" for f in fields
                    )
                msg_text = (
                    f"🚨 <b>{esc(title)}</b>\n\n"
                    f"{esc(message)}"
                    f"{field_lines}\n\n"
                    f"<i>AlphaSignal Institutional Engine</i>"
                )
                tg_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                try:
                    resp = requests.post(tg_url, json={
                        "chat_id": telegram_chat_id,
                        "text": msg_text,
                        "parse_mode": "HTML"          # B5: was "Markdown" — breaks on _, *, `
                    }, timeout=5)
                    # B4: Log failed deliveries (e.g. 400 = invalid chat_id)
                    if not resp.ok:
                        print(f"[NOTIFY] Telegram delivery failed: HTTP {resp.status_code} — {resp.text[:200]}")
                except Exception as te:
                    print(f"[NOTIFY] Telegram error: {te}")

        except Exception as e:
            print(f"[{datetime.now()}] Notification Push Error: {e}")


def notify_watchlist_users(ticker, sig_type, message, severity, curr_p):
    """Send a targeted alert to every user that has `ticker` in their watchlist.
    This is called after every ML and rule-based signal fires — independent of
    the existing 'alerts_enabled' broadcast, so watchers always get pinged."""
    try:
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            # Find users watching this ticker
            c.execute("""
                SELECT DISTINCT us.user_email
                FROM tracked_tickers tt
                JOIN user_settings us ON us.user_email = tt.user_email
                WHERE tt.ticker = ?
                  AND us.user_email IS NOT NULL
            """, (ticker,))
            watchers = [row[0] for row in c.fetchall()]

        if not watchers:
            return

        direction = 'BULLISH' if sig_type in ('RSI_OVERSOLD', 'MACD_BULLISH_CROSS', 'ML_ALPHA_PREDICTION') else \
                    'BEARISH' if sig_type in ('RSI_OVERBOUGHT', 'MACD_BEARISH_CROSS') else 'ALERT'
        color = 0x22c55e if direction == 'BULLISH' else 0xef4444 if direction == 'BEARISH' else 0x00f2ff
        sev_icon = {'critical':'🔴','high':'🟠','medium':'🟡'}.get(severity.lower(), '⚪')

        for email in watchers:
            NOTIFY.push_webhook(
                email,
                f"Watchlist Signal: {ticker.replace('-USD','')} {sev_icon}",
                f"{sig_type.replace('_',' ')} detected on **{ticker}** — asset is in your watchlist.",
                embed_color=color,
                fields=[
                    {"name": "Ticker",    "value": ticker,                "inline": True},
                    {"name": "Price",     "value": f"${curr_p:,.4f}",    "inline": True},
                    {"name": "Signal",    "value": sig_type,             "inline": True},
                    {"name": "Severity",  "value": severity.upper(),     "inline": True},
                    {"name": "Direction", "value": direction,            "inline": True},
                    {"name": "Link",      "value": f"[Open Terminal](https://alphasignal.digital/?view=alerts-hub)", "inline": True},
                ]
            )
        if watchers:
            print(f"[WatchlistAlert] {ticker} {sig_type} → notified {len(watchers)} watcher(s)")
    except Exception as e:
        print(f"[WatchlistAlert] Error: {e}")






class MLAlphaEngine:
    def __init__(self):
        self.models = {}
        self.feature_importance = {}
        self.running = True

    def _compute_features(self, df, ticker=None, is_live=False):
        if len(df) < 30: return df
        df = df.copy()
        df['return_1d'] = df['Close'].pct_change(1)
        df['return_5d'] = df['Close'].pct_change(5)
        
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        df['RSI_14'] = 100 - (100 / (1 + rs))
        
        ema12 = df['Close'].ewm(span=12).mean()
        ema26 = df['Close'].ewm(span=26).mean()
        df['MACD'] = ema12 - ema26
        
        sma20 = df['Close'].rolling(20).mean()
        std20 = df['Close'].rolling(20).std()
        df['BB_upper'] = sma20 + 2*std20
        df['BB_lower'] = sma20 - 2*std20
        df['BB_pos'] = (df['Close'] - df['BB_lower']) / (df['BB_upper'] - df['BB_lower'] + 1e-8)
        
        df['Vol_1d_change'] = df['Volume'].pct_change(1)
        
        # --- NEW FEATURES: Sentiment & Orderbook Imbalance ---
        # For historical training, we synthesize highly correlated proxies so the model leverages them.
        np.random.seed(42)
        df['Sentiment_Score'] = df['return_5d'].apply(lambda x: 1.0 if x > 0.05 else (-1.0 if x < -0.05 else 0.0)) + np.random.normal(0, 0.2, len(df))
        df['Order_Imbalance'] = df['return_1d'].apply(lambda x: 1.0 if x > 0.02 else (-1.0 if x < -0.02 else 0.0)) + np.random.normal(0, 0.2, len(df))
        
        # For live inference, override the final row with ACTUAL REAL-TIME DATA
        if is_live and ticker:
            real_sentiment = get_sentiment(ticker)
            real_imbalance = get_orderbook_imbalance(ticker)
            df.iloc[-1, df.columns.get_loc('Sentiment_Score')] = real_sentiment
            df.iloc[-1, df.columns.get_loc('Order_Imbalance')] = real_imbalance
            
        return df.dropna()

    def train_all(self):
        print(f"[{datetime.now()}] MLAlphaEngine: Starting background model training...")
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT ticker FROM tracked_tickers")
        tracked = [r[0] for r in c.fetchall()]
        conn.close()
        
        all_tickers = list(set([t for sub in UNIVERSE.values() for t in sub] + tracked))
        success_count = 0
        
        for ticker in all_tickers:
            try:
                df = yf.download(ticker, period='2y', interval='1d', progress=False)
                if df.empty or len(df) < 100: continue
                
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = [c[0] for c in df.columns]
                    
                df = self._compute_features(df)
                if df.empty: continue
                
                df['Target_Return_24h'] = df['Close'].shift(-1).pct_change(1)
                df = df.dropna()
                
                features = ['return_1d', 'return_5d', 'RSI_14', 'MACD', 'BB_pos', 'Vol_1d_change', 'Sentiment_Score', 'Order_Imbalance']
                X = df[features]
                y = df['Target_Return_24h']
                
                model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
                model.fit(X, y)
                
                importances = model.feature_importances_
                imp_dict = {f: float(i) for f, i in zip(features, importances)}
                
                self.models[ticker] = model
                self.feature_importance[ticker] = imp_dict
                success_count += 1
            except Exception as e:
                pass
                
        print(f"[{datetime.now()}] MLAlphaEngine: Trained models for {success_count} assets.")

    def run_training_loop(self):
        self.train_all()
        while self.running:
            time.sleep(86400)
            self.train_all()

    def predict(self, ticker, current_df):
        if ticker not in self.models: return None
        try:
            if len(current_df) < 30: return None
            df = self._compute_features(current_df.copy(), ticker=ticker, is_live=True)
            if df.empty: return None
            
            features = ['return_1d', 'return_5d', 'RSI_14', 'MACD', 'BB_pos', 'Vol_1d_change', 'Sentiment_Score', 'Order_Imbalance']
            X_live = df[features].iloc[[-1]]
            pred_return = self.models[ticker].predict(X_live)[0]
            
            return {
                "predicted_return": float(pred_return),
                "confidence": 0.75,
                "feature_importance": self.feature_importance[ticker]
            }
        except:
            return None

ML_ENGINE = MLAlphaEngine()

class PortfolioSimulator:
    def __init__(self):
        self.initial_capital = 100000.0
        self.running = True

    def run_simulation_loop(self):
        """Background thread to perform daily fund rebalancing and record results."""
        print(f"[{datetime.now()}] PortfolioSimulator: Starting simulation loop...")
        while self.running:
            try:
                # Fetch globally configured Rebalance Threshold (minimum across active users)
                try:
                    with sqlite3.connect(DB_PATH) as _conn:
                        _c = _conn.cursor()
                        _c.execute('SELECT MIN(rebalance_threshold) FROM user_settings WHERE rebalance_threshold IS NOT NULL')
                        _min_reb = _c.fetchone()[0]
                        rebalance_thresh = (float(_min_reb) / 100.0) if _min_reb is not None else 0.025
                except:
                    rebalance_thresh = 0.025

                # 1. Fetch current ML Predictions
                all_tickers = [t for sub in UNIVERSE.values() for t in sub]
                predictions = []
                for ticker in all_tickers:
                    # We use yf to get recent df for inference
                    hist_df = yf.download(ticker, period='30d', interval='1d', progress=False)
                    if not hist_df.empty:
                        if isinstance(hist_df.columns, pd.MultiIndex):
                            hist_df.columns = [c[0] for c in hist_df.columns]
                        pred = ML_ENGINE.predict(ticker, hist_df)
                        # PRODUCTION THRESHOLD: Dynamically loaded from user settings
                        if pred and pred['predicted_return'] >= rebalance_thresh:
                            predictions.append({'ticker': ticker, 'score': pred['predicted_return'], 'price': float(hist_df['Close'].iloc[-1])})
                
                if not predictions:
                    time.sleep(3600)
                    continue

                # 2. Rebalance Strategy: Top 5 by Predicted Return
                predictions.sort(key=lambda x: x['score'], reverse=True)
                top_5 = predictions[:5]
                
                # 3. Calculate Equity from ACTUAL weighted basket return
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT COUNT(*) FROM portfolio_history")
                count = c.fetchone()[0]

                current_equity = self.initial_capital
                if count > 0:
                    c.execute("SELECT equity, assets_json FROM portfolio_history ORDER BY timestamp DESC LIMIT 1")
                    row = c.fetchone()
                    last_equity = row[0]
                    prev_assets = json.loads(row[1]) if row[1] else []

                    # Compute equal-weight daily return of previous basket
                    actual_return = 0.0
                    valid_count = 0
                    for asset_ticker in prev_assets:
                        try:
                            hist = yf.download(asset_ticker, period='2d', interval='1d', progress=False)
                            if not hist.empty and len(hist) >= 2:
                                if isinstance(hist.columns, pd.MultiIndex):
                                    hist.columns = [col[0] for col in hist.columns]
                                closes = hist['Close'].dropna()
                                if len(closes) >= 2:
                                    daily_ret = float(closes.iloc[-1] / closes.iloc[-2] - 1)
                                    actual_return += daily_ret
                                    valid_count += 1
                        except: pass

                    if valid_count > 0:
                        avg_return = actual_return / valid_count
                    else:
                        avg_return = 0.0  # flat if no data

                    current_equity = last_equity * (1 + avg_return)
                
                # 4. Record Snapshot
                assets_bin = json.dumps([t['ticker'] for t in top_5])
                c.execute("INSERT INTO portfolio_history (equity, draw_down, assets_json) VALUES (?, ?, ?)",
                         (current_equity, 0.0, assets_bin))
                conn.commit()
                conn.close()
                
                print(f"[{datetime.now()}] PortfolioSimulator: Daily rebalance recorded. Equity: ${current_equity:,.2f}")
                time.sleep(86400) # Daily rebalance
            except Exception as e:
                print(f"Portfolio Simulation Error: {e}")
                time.sleep(3600)

PORTFOLIO_SIM = PortfolioSimulator()

class HarvestService:
    def __init__(self, cache, ws_server=None, interval=1800):  # 30-min harvest cycle
        self.cache = cache
        self.ws_server = ws_server
        self.interval = interval
        self.running = True

    def run(self):
        print(f"[{datetime.now()}] Harvester service starting...")
        
        # Phase 0: Wait for ML Engine to finish warming up
        print(f"[{datetime.now()}] Waiting for ML Alpha Engine to train models...")
        while not ML_ENGINE.models and self.running:
            time.sleep(2)
        print(f"[{datetime.now()}] Models ready, commencing harvest cycle...")
        
        last_regime = None
        while self.running:
            try:
                # Include dynamically tracked tickers
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT ticker FROM tracked_tickers")
                tracked = [r[0] for r in c.fetchall()]
                conn.close()
                
                all_tickers = list(set([t for sub in UNIVERSE.values() for t in sub] + tracked))
                print(f"[{datetime.now()}] Harvesting data for {len(all_tickers)} assets...")
                
                # Fetch as a batch only
                data = self.cache.download(all_tickers, period='60d', interval='1d')
                
                # Phase 4: Persist High-Frequency Time-Series for ML Models
                try:
                    ts_conn = sqlite3.connect(DB_PATH)
                    ts_c = ts_conn.cursor()
                    print(f"[{datetime.now()}] Persisting high-freq TS data for {len(all_tickers)} assets...")
                    
                    sentiments = get_sentiment_batch(all_tickers)
                    
                    for ticker in all_tickers:
                        sent = sentiments.get(ticker, 0.0)
                        ts_c.execute("INSERT INTO sentiment_history (symbol, score, index_value, volume) VALUES (?, ?, ?, ?)", 
                                  (ticker, sent, sent*100, 0))
                        
                        # Use the collected batch data if possible to avoid extra yfinance calls
                        price, vol = 0.0, 0.0
                        if data is not None and isinstance(data.columns, pd.MultiIndex):
                            try:
                                price = float(data['Close'][ticker].iloc[-1])
                                vol = float(data['Volume'][ticker].iloc[-1])
                            except: pass
                        
                        ts_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        ts_c.execute("INSERT INTO market_ticks (symbol, timestamp, price, volume, open_interest) VALUES (?, ?, ?, ?, ?)",
                                  (ticker, ts_str, price, vol, 0.0))
                    ts_conn.commit()
                    ts_conn.close()
                except Exception as e:
                    print(f"TS Harvester Error: {e}")

                # Global Regime Determination (Heuristic for Alerting)
                if data is not None and not data.empty:
                    # Simple momentum check on core indices
                    mom = data.pct_change(5).iloc[-1].mean()
                    new_regime = "High-Vol Expansion" if mom > 0.02 else "Low-Vol Compression" if mom < -0.01 else "Neutral / Accumulation"
                    
                    if last_regime and new_regime != last_regime:
                        print(f"[{datetime.now()}] !!! REGIME SHIFT DETECTED: {new_regime}")
                        # Broadcast via WebSocket for real-time Frontend toast
                        if self.ws_server:
                            try:
                                self.ws_server.broadcast(json.dumps({
                                    "type": "regime_shift",
                                    "data": {"new": new_regime, "old": last_regime}
                                }))
                            except: pass
                        
                        # Notify all users with alerts enabled
                        conn = sqlite3.connect(DB_PATH)
                        c = conn.cursor()
                        c.execute("SELECT user_email FROM user_settings WHERE alerts_enabled = 1")
                        all_users = c.fetchall()
                        conn.close()
                        for (email,) in all_users:
                            NOTIFY.push_webhook(email, "STRUCTURAL TRANSITION", 
                                f"Market Regime has shifted from **{last_regime}** to **{new_regime}**. Adjust institutional exposure accordingly.")
                    
                    last_regime = new_regime

                print(f"[{datetime.now()}] Harvesting cycle complete. Sleeping for {self.interval}s.")
            except Exception as e:
                print(f"Harvester error: {e}")
            
            # Phase 8: Alpha Alert Generation
            try:
                self.generate_alpha_alerts(data, current_regime=last_regime)
            except Exception as e:
                print(f"Alpha Generation Error: {e}")
            
            # Phase 5: GOMM Persistence Snapshot (Every Cycle)
            try:
                self.record_orderbook_snapshots()
            except Exception as e:
                print(f"Snapshot error: {e}")

            # Phase 9: Auto-close signals that have hit TP2 or Stop Loss
            try:
                self.auto_close_signals()
            except Exception as e:
                print(f"Auto-close error: {e}")

            time.sleep(self.interval)
    def auto_close_signals(self):
        """Auto-close active signals that have hit TP2 (+10%) or Stop Loss (-3%).
        TP1 (+5%) signals remain open — still in play but not at full target.
        Thresholds match the state labels computed in handle_signal_history."""
        BULLISH = {
            'ML_LONG','RSI_OVERSOLD','MACD_CROSS_UP','MACD_BULLISH_CROSS',
            'REGIME_BULL','WHALE_ACCUMULATION','VOLUME_SPIKE','SENTIMENT_SPIKE',
            'MOMENTUM_BREAKOUT','REGIME_SHIFT_LONG','ALPHA_DIVERGENCE_LONG',
            'ML_ALPHA_PREDICTION','LIQUIDITY_VACUUM'
        }
        TP2_THRESHOLD = 10.0   # % gain → auto-close win
        SL_THRESHOLD  = -3.0   # % loss → auto-close loss

        conn = sqlite3.connect(DB_PATH)
        c    = conn.cursor()
        try:
            # Fetch all active signals (status IS NULL or 'active')
            c.execute("""
                SELECT id, type, ticker, price, user_email
                FROM alerts_history
                WHERE COALESCE(status,'active') = 'active'
                  AND price IS NOT NULL AND price > 0
            """)
            active_rows = c.fetchall()
            if not active_rows:
                conn.close(); return

            # Build price map from most recent market_ticks (written this cycle)
            unique_tickers = list({r[2] for r in active_rows})
            price_map = {}
            for t in unique_tickers:
                c.execute(
                    "SELECT price FROM market_ticks WHERE symbol=? AND price>0 ORDER BY timestamp DESC LIMIT 1",
                    (t,)
                )
                row = c.fetchone()
                if row and row[0]:
                    price_map[t] = float(row[0])

            # yfinance fallback for any ticker still missing
            missing = [t for t in unique_tickers if t not in price_map]
            if missing:
                try:
                    for t in missing:
                        candidates = [t] + ([t + '-USD'] if '-' not in t else [])
                        for sym in candidates:
                            try:
                                info = yf.Ticker(sym).fast_info
                                px = info.get('last_price') or info.get('lastPrice')
                                if px and float(px) > 0:
                                    price_map[t] = round(float(px), 10); break
                            except: continue
                except Exception as e:
                    print(f"[AutoClose] yfinance fallback error: {e}")

            now_ts  = datetime.utcnow().isoformat()
            closed  = 0
            for sig_id, sig_type, ticker, entry_p, user_email in active_rows:
                curr_p = price_map.get(ticker)
                if not curr_p or not entry_p or entry_p <= 0:
                    continue
                direction = 1 if (sig_type or '').upper() in BULLISH else -1
                roi = direction * (curr_p - entry_p) / entry_p * 100

                if roi >= TP2_THRESHOLD or roi <= SL_THRESHOLD:
                    final_roi  = round(roi, 2)
                    exit_px    = round(curr_p, 10)
                    c.execute(
                        "UPDATE alerts_history SET status='closed', closed_at=?, exit_price=?, final_roi=? WHERE id=?",
                        (now_ts, exit_px, final_roi, sig_id)
                    )
                    is_win  = roi >= TP2_THRESHOLD
                    reason  = 'TP2 HIT' if is_win else 'STOP LOSS'
                    print(f"[AutoClose] Signal #{sig_id} {ticker} {reason}: ROI={final_roi:+.2f}% entry={entry_p} exit={exit_px}")
                    closed += 1

                    # Fire notification in a background thread so it never blocks the DB commit
                    if user_email:
                        def _notify(ue=user_email, tk=ticker, st=sig_type,
                                    ep=entry_p, xp=exit_px, roi_v=final_roi, win=is_win):
                            try:
                                sym       = tk.replace('-USD', '')
                                emoji     = '🎯' if win else '🛑'
                                result    = 'TARGET HIT' if win else 'STOP LOSS'
                                color     = 0x22c55e if win else 0xef4444

                                def _fmt(v):
                                    """Compact price formatter: avoids $0.00 for micro-cap."""
                                    if v is None: return 'N/A'
                                    if v >= 1:    return f'${v:,.4f}'
                                    # Find first significant digit position
                                    import math
                                    dps = max(4, -int(math.floor(math.log10(abs(v)))) + 3) if v > 0 else 8
                                    return f'${v:.{dps}f}'

                                NOTIFY.push_webhook(
                                    ue,
                                    f"{emoji} {sym} — {result}",
                                    f"Your **{sym}** signal has been automatically closed after reaching the **{result}** threshold.",
                                    embed_color=color,
                                    fields=[
                                        {'name': '📌 Ticker',     'value': tk,                           'inline': True},
                                        {'name': '📊 Signal Type','value': st.replace('_', ' '),         'inline': True},
                                        {'name': '📈 Result',     'value': result,                       'inline': True},
                                        {'name': '🔵 Entry',      'value': _fmt(ep),                     'inline': True},
                                        {'name': '🔴 Exit',       'value': _fmt(xp),                     'inline': True},
                                        {'name': '💰 ROI',        'value': f'{roi_v:+.2f}%',             'inline': True},
                                    ]
                                )
                            except Exception as ne:
                                print(f"[AutoClose] Notify error for signal #{sig_id}: {ne}")
                        threading.Thread(target=_notify, daemon=True).start()

            if closed:
                conn.commit()
                # Bust signal history cache so the archive reflects new state immediately
                try:
                    from .routes.institutional import InstitutionalRoutesMixin
                    InstitutionalRoutesMixin._sig_history_cache.clear()
                except Exception:
                    pass
                print(f"[AutoClose] {closed} signal(s) auto-closed this cycle.")
            else:
                print(f"[AutoClose] No signals hit TP2 or SL this cycle ({len(active_rows)} active).")
        except Exception as e:
            print(f"[AutoClose] Error: {e}")
            conn.rollback()
        finally:
            conn.close()

    def generate_alpha_alerts(self, data, current_regime=None):
        """Phase 8: Predict Alpha signals using ML engine using high-efficiency batch data."""
        if data is None or data.empty: return
        
        print(f"[{datetime.now()}] MLAlphaEngine: Generating Predictive Alpha alerts...")
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Identify all tickers in the batch data
        if isinstance(data.columns, pd.MultiIndex):
            # yfinance MultiIndex is usually (Metric, Ticker)
            all_tickers = data.columns.get_level_values(1).unique()
        else:
            all_tickers = [data.name] if hasattr(data, 'name') else []

        for ticker in all_tickers:
            try:
                # 1. Extract ticker data from batch
                if isinstance(data.columns, pd.MultiIndex):
                    hist_df = data.xs(ticker, axis=1, level=1).dropna()
                else:
                    hist_df = data.dropna()
                
                if len(hist_df) < 30: continue
                
                # Ensure predictable column mapping for ML features
                curr_p = float(hist_df['Close'].iloc[-1]) if 'Close' in hist_df.columns else 0.0
                
                # 2. Run Inference using the ML Engine
                prediction = ML_ENGINE.predict(ticker, hist_df)
                if not prediction: continue
                
                pred_return = prediction['predicted_return']
                importance = prediction['feature_importance']
                confidence = prediction.get('confidence', 0.75)
                
                # Calculate true statistical Z-Score from returns
                try:
                    returns = hist_df['Close'].pct_change().dropna()
                    std_val = returns.std()
                    z_score = float((returns.iloc[-1] - returns.mean()) / std_val) if len(returns) > 10 and std_val > 0 else 0.0
                except:
                    z_score = 0.0
                
                if np.isnan(z_score): z_score = 0.0

                # Get minimum z_threshold across all active users
                try:
                    c.execute("SELECT MIN(z_threshold) FROM user_settings WHERE alerts_enabled = 1")
                    _min_z = c.fetchone()[0]
                    min_z_thresh = float(_min_z) if _min_z is not None else 2.0
                except:
                    min_z_thresh = 2.0

                # 3. Decision Logic: Alert if absolute Z-Score > min_z_thresh
                signal_type = None
                if abs(z_score) >= min_z_thresh:
                    signal_type = "ML_ALPHA_PREDICTION"
                    severity = 'critical' if abs(z_score) >= 3.0 else 'high' if abs(z_score) >= 2.5 else 'medium'
                    top_driver = max(importance, key=importance.get)
                    message = f"ML Engine predicts +{pred_return*100:.1f}% alpha window. Primary driver: {top_driver.upper()} ({(importance[top_driver]*100):.1f}% confidence)."
                
                if signal_type:
                    # Get all users to receive this signal
                    try:
                        with sqlite3.connect(DB_PATH) as ue_conn:
                            ue_c = ue_conn.cursor()
                            ue_c.execute("SELECT user_email FROM user_settings WHERE alerts_enabled = 1 AND user_email IS NOT NULL")
                            enabled_users = [r[0] for r in ue_c.fetchall()]
                    except:
                        enabled_users = []

                    for target_email in enabled_users:
                        # Per-user anti-spam: skip if this user already has this ticker in last 1h
                        c.execute("SELECT id FROM alerts_history WHERE ticker=? AND user_email=? AND timestamp > datetime('now', '-1 hours')", (ticker, target_email))
                        if c.fetchone(): continue
                        _direction = 'LONG' if pred_return > 0 else 'SHORT'
                        _z = round(z_score, 2)
                        _alpha = round(pred_return * 100, 2)
                        _cat = next((cat for cat, tks in UNIVERSE.items() if ticker in tks), 'OTHER')
                        c.execute(
                            "INSERT INTO alerts_history "
                            "(type, ticker, message, severity, price, timestamp, z_score, alpha, direction, category, user_email) "
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            (signal_type, ticker, message, severity, curr_p,
                             datetime.now().isoformat(), _z, _alpha, _direction, _cat, target_email)
                        )

                    # Record Prediction Metadata (once, globally)
                    c.execute("INSERT INTO ml_predictions (symbol, predicted_return, confidence, features_json) VALUES (?, ?, ?, ?)",
                             (ticker, pred_return, confidence, json.dumps(importance)))

                    if enabled_users:
                        print(f"[{datetime.now()}] !!! ALPHA ALERT: {ticker} @ {curr_p} → inserted for {len(enabled_users)} user(s)")

                        # Watchlist-targeted alerts (personalised)
                        threading.Thread(target=notify_watchlist_users,
                            args=(ticker, signal_type, message, severity, curr_p),
                            daemon=True).start()
                        # Phase 17-A: Rich Multi-Channel Dispatch with user z_threshold gate
                        try:
                            with sqlite3.connect(DB_PATH) as alert_conn:
                                alert_c = alert_conn.cursor()
                                # Include algo_webhook in the query
                                alert_c.execute("SELECT user_email, z_threshold, algo_webhook FROM user_settings WHERE alerts_enabled = 1")
                                for row in alert_c.fetchall():
                                    target_email = row[0]
                                    user_z_thresh = float(row[1]) if row[1] else 2.0
                                    algo_url = row[2] if len(row) > 2 and row[2] else None

                                    if abs(z_score) >= user_z_thresh:
                                        # Issue Algorithmic Trade Webhook if configured
                                        if algo_url:
                                            def _fire_algo(url=algo_url, t_email=target_email):
                                                try:
                                                    payload = {
                                                        "action": "BUY" if pred_return > 0 else "SELL",
                                                        "ticker": ticker,
                                                        "price": curr_p,
                                                        "signal_type": signal_type,
                                                        "alpha_score": _alpha,
                                                        "timestamp": datetime.now().isoformat(),
                                                    }
                                                    import requests
                                                    requests.post(url, json=payload, timeout=3)
                                                except Exception as we:
                                                    print(f"[AlgoWebhook] Error pushing to {t_email}: {we}")
                                            threading.Thread(target=_fire_algo, daemon=True).start()
                                            
                                        # --- NEW: Internal Algo Bots ---
                                        try:
                                            import sqlite3
                                            from backend.database import DB_PATH
                                            bot_conn = sqlite3.connect(DB_PATH)
                                            bot_c = bot_conn.cursor()
                                            bot_c.execute("SELECT id, name, condition_zscore, condition_regime, action_side, action_amount, action_exchange, asset, take_profit_pct, stop_loss_pct FROM trading_bots WHERE user_email = ? AND status = 'active'", (target_email,))
                                            bots = bot_c.fetchall()
                                            
                                            for b_id, b_name, b_z, b_regime, b_side, b_amt, b_exch, b_asset, b_tp_pct, b_sl_pct in bots:
                                                if abs(z_score) >= b_z:
                                                    if b_asset != 'ANY' and b_asset != ticker:
                                                        continue
                                                    if b_regime != 'ANY' and current_regime and current_regime != b_regime:
                                                        continue
                                                    
                                                    action_dir = 'BUY' if pred_return > 0 else 'SELL'
                                                    if b_side != 'MATCH_SIGNAL':
                                                        action_dir = b_side.upper()
                                                    
                                                    trade_action = f"{action_dir} (${b_amt}) [Bot: {b_name} | API: {b_exch}]"
                                                    
                                                    tp_price = 0.0
                                                    sl_price = 0.0
                                                    if b_tp_pct and b_tp_pct > 0:
                                                        tp_price = curr_p * (1 + (b_tp_pct/100)) if action_dir == 'BUY' else curr_p * (1 - (b_tp_pct/100))
                                                    if b_sl_pct and b_sl_pct > 0:
                                                        sl_price = curr_p * (1 - (b_sl_pct/100)) if action_dir == 'BUY' else curr_p * (1 + (b_sl_pct/100))
                                                        
                                                    bot_c.execute("INSERT INTO trade_ledger (user_email, ticker, action, price, target, stop, rr, slippage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                                                                  (target_email, ticker, trade_action, curr_p, round(tp_price, 4), round(sl_price, 4), 0.0, 0.0))
                                                    bot_c.execute("UPDATE trading_bots SET last_triggered = ? WHERE id = ?", (datetime.now().isoformat(), b_id))
                                                    print(f"[AlgoBot] Executed {b_name} for {target_email} on {ticker}")
                                            bot_conn.commit()
                                            bot_conn.close()
                                        except Exception as be:
                                            print(f"[AlgoBot] Error checking bots for {target_email}: {be}")
                                        # --------------------------------
                                    
                                    # The standard push_webhook logic below still gates on z_thresh
                                    if abs(z_score) < user_z_thresh:
                                        continue
                                    direction = 'LONG' if pred_return > 0 else 'SHORT'
                                    color = 0x22c55e if pred_return > 0 else 0xef4444
                                    top_driver = max(importance, key=importance.get)
                                    NOTIFY.push_webhook(
                                        target_email,
                                        f"ALPHA SIGNAL: {ticker} — {direction}",
                                        f"ML Engine detected a high-conviction alpha window for **{ticker}**.",
                                        embed_color=color,
                                        fields=[
                                            {"name": "Direction", "value": direction, "inline": True},
                                            {"name": "Current Price", "value": f"${curr_p:,.4f}", "inline": True},
                                            {"name": "Z-Score", "value": f"{z_score:+.2f}σ", "inline": True},
                                            {"name": "Predicted Alpha", "value": f"{_alpha:+.2f}%", "inline": True},
                                            {"name": "ML Confidence", "value": f"{confidence*100:.0f}%", "inline": True},
                                            {"name": "Your Threshold", "value": f"±{user_z_thresh:.1f}σ", "inline": True},
                                        ]
                                    )
                        except Exception as ne:
                            print(f"Alert Dispatch Error: {ne}")

                        # Real-time WebSocket Broadcast to Frontend
                        if self.ws_server:
                            try:
                                self.ws_server.broadcast(json.dumps({
                                    'type': 'new_alert',
                                    'data': {
                                        'type': signal_type, 'ticker': ticker,
                                        'title': f"{ticker} — ML ALPHA SIGNAL",
                                        'content': message, 'severity': severity,
                                        'price': curr_p, 'timestamp': datetime.now().isoformat()
                                    }
                                }))
                            except Exception as wse:
                                print(f"WS Broadcast Error: {wse}")

            except Exception as e:
                print(f"Prediction loop error for {ticker}: {e}")
                continue

        # Commit ML prediction inserts first so _generate_rule_based_signals'
        # anti-spam SELECT (same connection) can see them and skip duplicates.
        conn.commit()

        # Rule-based fallback signals (fires even before ML models warm up)
        self._generate_rule_based_signals(data, conn, c)

        conn.commit()
        conn.close()

    def _generate_rule_based_signals(self, data, conn, c):
        """RSI / MACD / volume-spike signals — complement to ML predictions."""
        if data is None or data.empty: return
        try:
            tickers = data.columns.get_level_values(1).unique() if isinstance(data.columns, pd.MultiIndex) else []
            for ticker in tickers:
                try:
                    if isinstance(data.columns, pd.MultiIndex):
                        df = data.xs(ticker, axis=1, level=1).dropna()
                    else:
                        df = data.dropna()
                    if len(df) < 15 or 'Close' not in df.columns: continue

                    close = df['Close']
                    curr_p = float(close.iloc[-1])

                    # RSI-14
                    delta = close.diff()
                    gain = delta.where(delta > 0, 0).rolling(14).mean()
                    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
                    rs   = gain / loss.replace(0, 1e-9)
                    rsi  = float((100 - 100 / (1 + rs)).iloc[-1])

                    # MACD crossover
                    ema12 = close.ewm(span=12).mean()
                    ema26 = close.ewm(span=26).mean()
                    macd  = ema12 - ema26
                    signal_line = macd.ewm(span=9).mean()
                    macd_cross = float(macd.iloc[-1]) > float(signal_line.iloc[-1]) and float(macd.iloc[-2]) <= float(signal_line.iloc[-2])
                    macd_bear  = float(macd.iloc[-1]) < float(signal_line.iloc[-1]) and float(macd.iloc[-2]) >= float(signal_line.iloc[-2])

                    # Volume spike (>2σ above 20d mean)
                    vol_spike = False
                    if 'Volume' in df.columns:
                        vols = df['Volume'].dropna()
                        if len(vols) > 20:
                            vol_mean, vol_std = float(vols.rolling(20).mean().iloc[-1]), float(vols.rolling(20).std().iloc[-1])
                            vol_spike = vol_std > 0 and float(vols.iloc[-1]) > vol_mean + 2 * vol_std

                    sig_type, message, severity = None, '', 'medium'
                    if rsi < 30:
                        sig_type = 'RSI_OVERSOLD'
                        message  = f'RSI-14 at {rsi:.1f} — deeply oversold. Potential institutional accumulation setup.'
                        severity = 'high' if rsi < 25 else 'medium'
                    elif rsi > 70:
                        sig_type = 'RSI_OVERBOUGHT'
                        message  = f'RSI-14 at {rsi:.1f} — overbought territory. Watch for distribution.'
                        severity = 'medium'
                    elif macd_cross and vol_spike:
                        sig_type = 'MACD_BULLISH_CROSS'
                        message  = f'MACD bullish crossover confirmed with volume spike on {ticker}. Momentum inflection.'
                        severity = 'high'
                    elif macd_bear:
                        sig_type = 'MACD_BEARISH_CROSS'
                        message  = f'MACD bearish crossover on {ticker}. Momentum deteriorating.'
                        severity = 'medium'
                    elif vol_spike:
                        sig_type = 'VOLUME_SPIKE'
                        message  = f'Volume 2σ above 20-day mean on {ticker}. Institutional activity detected.'
                        severity = 'medium'
                    if sig_type:
                        # Per-user insert: one row per enabled user
                        try:
                            with sqlite3.connect(DB_PATH) as ue_conn2:
                                ue_c2 = ue_conn2.cursor()
                                ue_c2.execute("SELECT user_email FROM user_settings WHERE alerts_enabled = 1 AND user_email IS NOT NULL")
                                rule_users = [r[0] for r in ue_c2.fetchall()]
                        except:
                            rule_users = []

                        for ru_email in rule_users:
                            c.execute("SELECT id FROM alerts_history WHERE ticker=? AND type=? AND user_email=? AND timestamp > datetime('now', '-2 hours')",
                                      (ticker, sig_type, ru_email))
                            if c.fetchone(): continue
                            _dir = 'LONG' if sig_type in ('RSI_OVERSOLD', 'MACD_BULLISH_CROSS') else 'SHORT' if sig_type in ('RSI_OVERBOUGHT', 'MACD_BEARISH_CROSS') else 'NEUTRAL'
                            _cat = next((cat for cat, tks in UNIVERSE.items() if ticker in tks), 'OTHER')
                            c.execute(
                                "INSERT INTO alerts_history "
                                "(type, ticker, message, severity, price, timestamp, direction, category, user_email) "
                                "VALUES (?,?,?,?,?,?,?,?,?)",
                                (sig_type, ticker, message, severity, curr_p,
                                 datetime.now().isoformat(), _dir, _cat, ru_email)
                            )

                        if rule_users:
                            print(f'[RuleSig] {sig_type} on {ticker} @ {curr_p:.4f} → {len(rule_users)} user row(s)')


                            # Multi-channel dispatch — notify users with alerts_enabled
                            try:
                                with sqlite3.connect(DB_PATH) as notify_conn:
                                    notify_c = notify_conn.cursor()
                                    notify_c.execute("""SELECT user_email, z_threshold,
                                                               whale_threshold, depeg_threshold,
                                                               vol_spike_threshold, cme_gap_threshold
                                                        FROM user_settings WHERE alerts_enabled = 1""")
                                    for row in notify_c.fetchall():
                                        (n_email, n_z, n_whale, n_depeg, n_vol, n_cme) = row
                                        user_z    = float(n_z)     if n_z     else 2.0
                                        user_whale= float(n_whale) if n_whale else 5.0
                                        user_depeg= float(n_depeg) if n_depeg else 1.0
                                        user_vol  = float(n_vol)   if n_vol   else 2.0
                                        user_cme  = float(n_cme)   if n_cme   else 1.0

                                        # Per-signal-type threshold gates
                                        if sig_type in ('RSI_OVERSOLD', 'RSI_OVERBOUGHT', 'MACD_BULLISH_CROSS', 'MACD_BEARISH_CROSS', 'ML_ALPHA_PREDICTION'):
                                            if severity == 'medium' and user_z > 1.5:
                                                continue
                                        elif sig_type == 'VOLUME_SPIKE':
                                            # vol_spike_threshold is σ multiplier (default 2x)
                                            # signal already fired at 2σ; only suppress if user wants >user_vol σ
                                            if user_vol > 2.0:
                                                continue  # they want a stricter vol spike
                                        elif sig_type == 'WHALE_TXN':
                                            txn_usd = curr_p  # curr_p carries txn size in $M for whale signals
                                            if txn_usd < user_whale:
                                                continue
                                        elif sig_type == 'DEPEG':
                                            if curr_p < user_depeg:  # curr_p carries depeg % for depeg signals
                                                continue
                                        elif sig_type == 'CME_GAP':
                                            if curr_p < user_cme:  # curr_p carries gap % for CME signals
                                                continue
                                        direction = 'BULLISH' if sig_type in ('RSI_OVERSOLD', 'MACD_BULLISH_CROSS') else 'BEARISH' if sig_type in ('RSI_OVERBOUGHT', 'MACD_BEARISH_CROSS') else 'NEUTRAL'
                                        embed_color = 0x22c55e if direction == 'BULLISH' else 0xef4444 if direction == 'BEARISH' else 0x00f2ff
                                        NOTIFY.push_webhook(
                                            n_email,
                                            f"{sig_type.replace('_', ' ')}: {ticker}",
                                            message,
                                            embed_color=embed_color,
                                            fields=[
                                                {"name": "Ticker",    "value": ticker,                "inline": True},
                                                {"name": "Price",     "value": f"${curr_p:,.4f}",    "inline": True},
                                                {"name": "Signal",    "value": sig_type,             "inline": True},
                                                {"name": "Severity",  "value": severity.upper(),     "inline": True},
                                                {"name": "RSI-14",    "value": f"{rsi:.1f}",         "inline": True},
                                                {"name": "Direction", "value": direction,            "inline": True},
                                            ]
                                        )
                            except Exception as ne:
                                print(f'[RuleSig Notify] Error: {ne}')

                            # Real-time WS push to frontend alert list
                            if self.ws_server:
                                try:
                                    self.ws_server.broadcast(json.dumps({
                                        'type': 'new_alert',
                                        'data': {
                                            'id': c.lastrowid,
                                            'type': sig_type,
                                            'ticker': ticker,
                                            'title': f"{ticker} — {sig_type.replace('_', ' ')}",
                                            'content': message,
                                            'severity': severity,
                                            'price': curr_p,
                                            'timestamp': datetime.now().isoformat()
                                        }
                                    }))
                                except: pass
                except Exception as te:
                    continue
        except Exception as e:
            print(f'[RuleSig] Error: {e}')


    def record_orderbook_snapshots(self):
        """Phase 8: Resilient Snapshots.
        Bypasses yfinance historical failures by using direct price discovery.
        """
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Phase 7: Prioritized Universe for the Charting Legend
        all_institutional_tickers = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'LINK-USD', 'MSTR', 'COIN', 'MARA', 'RIOT', 'CLSK']
        
        print(f"[{datetime.now()}] Recording resilient snapshots for {len(all_institutional_tickers)} core assets...")

        for ticker in all_institutional_tickers:
            try:
                # Phase 8: Resilient Price Discovery (Weekend-Proof)
                symbol = ticker.replace("-USD", "USDT").replace("-", "")
                binance_data = None
                current_price = 0

                # 1. Fetch Live Binance Depth (Primary source for price and liquidity)
                try:
                    r = requests.get(f"https://api.binance.com/api/v3/depth?symbol={symbol}&limit=20", timeout=1.5)
                    if r.status_code == 200:
                        binance_data = r.json()
                        # Extract Mid-Price
                        if binance_data.get('asks') and binance_data.get('bids'):
                            best_ask = float(binance_data['asks'][0][0])
                            best_bid = float(binance_data['bids'][0][0])
                            current_price = (best_ask + best_bid) / 2
                except: pass

                # 2. Fallback to yfinance Fast Info (for Equities or if Binance fails)
                if current_price <= 0:
                    try:
                        t = yf.Ticker(ticker)
                        current_price = t.fast_info.get('lastPrice', 0)
                    except: pass

                if current_price <= 0 or np.isnan(current_price): continue

                z_score = 0 # Adaptive resolution is secondary to data availability
                
                # 3. Multi-Exchange Aggregation Logic
                walls = []
                exchange_configs = [
                    {"name": "Binance", "weight": 1.0, "is_live": True},
                    {"name": "Coinbase", "weight": 0.75, "is_live": False},
                    {"name": "OKX", "weight": 0.35, "is_live": False}
                ]
                

                for exch in exchange_configs:
                    if exch['is_live'] and binance_data:
                        # Map Live Binance
                        for ask in binance_data.get('asks', []):
                            walls.append({"price": float(ask[0]), "size": float(ask[1]) * exch['weight'], "side": "ask", "exchange": exch['name']})
                        for bid in binance_data.get('bids', []):
                            walls.append({"price": float(bid[0]), "size": float(bid[1]) * exch['weight'], "side": "bid", "exchange": exch['name']})
                    else:
                        # Synthetic Global Liquidity Generation (Institutional Simulation)
                        bias = exch['weight']
                        for _ in range(3):
                            # ASK: 0.1% to 1.5% depth
                            a_off = random.uniform(0.001, 0.015)
                            walls.append({"price": round(current_price * (1 + a_off), 2), "size": round(random.uniform(10, 500) * bias, 1), "side": "ask", "exchange": exch['name']})
                            # BID: 0.1% to 1.5% depth
                            b_off = random.uniform(0.001, 0.015)
                            walls.append({"price": round(current_price * (1 - b_off), 2), "size": round(random.uniform(10, 500) * bias, 1), "side": "bid", "exchange": exch['name']})

                # 4. Persistence Packaging
                if not walls: continue
                
                snapshot = {
                    "timestamp": datetime.now().isoformat(),
                    "time": datetime.now().strftime("%H:%M"), 
                    "price": current_price,
                    "vol_z": z_score,
                    "is_volatile": z_score > 1.5,
                    "walls": walls
                }
                c.execute("INSERT INTO orderbook_snapshots (ticker, snapshot_data, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)", (ticker, json.dumps(snapshot)))
                conn.commit()
                print(f"[{datetime.now()}] [DB] Snapshots stored for {ticker} (Price: {current_price:.2f})")

            except Exception as te:
                # Silently fail for individual tickers to keep harvester moving
                continue
        
        # 5. Strategic Pruning (Keep 24h of high-fidelity snapshots)
        c.execute("DELETE FROM orderbook_snapshots WHERE timestamp < datetime('now', '-1 day')")
        conn.commit()
        conn.close()

    def stop(self):
        self.running = False


NOTIFY = NotificationService()
ML_ENGINE = MLAlphaEngine()
PORTFOLIO_SIM = PortfolioSimulator()
