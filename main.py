import json
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
import http.server
import socketserver
import yfinance as yf
import pandas as pd
import numpy as np
import urllib.parse
import time
import sqlite3
import threading
import io
import socket
import struct
import hashlib
import base64
import requests
from datetime import datetime, timedelta
import random
import traceback
import stripe
import math
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import concurrent.futures

# --- Sentry Error Monitoring ---
try:
    import sentry_sdk
    _sentry_dsn = os.environ.get('SENTRY_DSN', '')
    if _sentry_dsn:
        sentry_sdk.init(
            dsn=_sentry_dsn,
            traces_sample_rate=0.05,   # 5% of requests traced (free tier safe)
            environment=os.environ.get('ENVIRONMENT', 'production'),
            release=os.environ.get('RAILWAY_GIT_COMMIT_SHA', 'unknown'),
        )
        print("[Sentry] Error monitoring active.", flush=True)
    else:
        print("[Sentry] SENTRY_DSN not set — monitoring disabled.", flush=True)
except ImportError:
    print("[Sentry] sentry-sdk not installed — skipping.", flush=True)
    sentry_sdk = None


# --- INJECTED BACKEND MODULES ---
from backend.database import load_env, PORT, SUPABASE_URL, SUPABASE_KEY, SUPABASE_HEADERS, STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, SupabaseClient, UNIVERSE, WHALE_WALLETS, SENTIMENT_KEYWORDS, data_dir, DB_PATH, init_db, redis_client
from backend.caching import DataCache, CACHE
from backend.services import NotificationService, MLAlphaEngine, PortfolioSimulator, HarvestService, get_sentiment, get_sentiment_batch, get_orderbook_imbalance, NOTIFY, ML_ENGINE, PORTFOLIO_SIM



from backend.api_router import AlphaHandler, ThreadedHTTPServer
WS_CLIENTS = set()
WS_LOCK = threading.Lock()
LIVE_PRICES = {"BTC": 0.0, "ETH": 0.0, "SOL": 0.0}

class WebSocketServer:
    PORT = 8007
    
    def __init__(self):
        self.running = True

    def _handshake(self, conn):
        try:
            # Read until we find the end of headers or hit a limit
            data = b""
            while b"\r\n\r\n" not in data and len(data) < 16384:
                chunk = conn.recv(4096)
                if not chunk: break
                data += chunk
            
            if not data: return False
            text = data.decode('utf-8', errors='ignore')
            
            headers = {}
            for line in text.replace('\r\n', '\n').split('\n'):
                if ':' in line:
                    k, v = line.split(':', 1)
                    headers[k.strip().lower()] = v.strip()
            
            key = headers.get('sec-websocket-key')
            if not key: 
                return False
        except Exception as e:
            print(f"[{datetime.now()}] WS Handshake error: {e}", flush=True)
            return False
        magic = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
        accept = base64.b64encode(hashlib.sha1((key + magic).encode()).digest()).decode()
        response = (
            'HTTP/1.1 101 Switching Protocols\r\n'
            'Upgrade: websocket\r\n'
            'Connection: Upgrade\r\n'
            f'Sec-WebSocket-Accept: {accept}\r\n\r\n'
        )
        conn.send(response.encode())
        return True

    def _encode(self, msg):
        payload = msg.encode('utf-8')
        n = len(payload)
        header = bytearray([0x81])
        if n < 126:
            header.append(n)
        elif n < 65536:
            header.append(126)
            header += struct.pack('>H', n)
        else:
            header.append(127)
            header += struct.pack('>Q', n)
        return bytes(header) + payload

    def _handle_client(self, conn, addr):
        try:
            if not self._handshake(conn): return
            with WS_LOCK: WS_CLIENTS.add(conn)
            while self.running:
                try:
                    data = conn.recv(1024)
                    if not data: break
                except: break
        except: pass
        finally:
            with WS_LOCK: WS_CLIENTS.discard(conn)
            try: conn.close()
            except: pass

    def broadcast(self, msg):
        encoded = self._encode(msg)
        dead = set()
        with WS_LOCK:
            for c in WS_CLIENTS:
                try: c.sendall(encoded)
                except: dead.add(c)
            for c in dead: WS_CLIENTS.discard(c)

    def redis_subscriber_loop(self):
        """Dedicated listener for distributed Redis events. Pushes everything to local WS_CLIENTS."""
        pubsub = redis_client.pubsub()
        pubsub.subscribe('alphasignal:pubsub:broadcast')
        for message in pubsub.listen():
            if message['type'] == 'message':
                self.broadcast(message['data'])

    def price_harvester_loop(self):
        """Background thread to fetch prices every 15s without blocking the WS loop."""
        tickers = {'BTC': 'BTC-USD', 'ETH': 'ETH-USD', 'SOL': 'SOL-USD'}
        while self.running:
            try:
                for sym, tick in tickers.items():
                    try:
                        info = yf.Ticker(tick).fast_info
                        px = info.get('last_price') or info.get('lastPrice')
                        if px and float(px) > 0:
                            LIVE_PRICES[sym] = round(float(px), 2)
                    except: pass
                time.sleep(15)
            except: time.sleep(5)

    def price_publisher_loop(self):
        """Fetch prices every 5 seconds and publish to WS clients.
        Every 60s also pre-warms the signal price cache and checks TP/SL crossings.
        """
        from backend.database import redis_client
        from backend.routes.institutional import InstitutionalRoutesMixin
        use_redis = hasattr(redis_client, 'connection_pool')
        BULLISH_T = {'ML_LONG','RSI_OVERSOLD','MACD_BULLISH_CROSS','REGIME_BULL','WHALE_ACCUMULATION',
                     'VOLUME_SPIKE','MOMENTUM_BREAKOUT','ALPHA_DIVERGENCE_LONG','ML_ALPHA_PREDICTION'}
        # Track which signals have already been notified (persist in memory until restart)
        _notified: dict = {}   # {signal_id: 'HIT_TP1'|'HIT_TP2'|'STOPPED'}
        _last_prewarm = 0.0
        
        while self.running:
            try:

                try:
                    conn = sqlite3.connect(DB_PATH, timeout=30)
                    cur = conn.cursor()
                    cur.execute("SELECT COUNT(*) FROM alerts_history WHERE timestamp > datetime('now', '-1 day')")
                    signal_count = cur.fetchone()[0]
                    new_today = signal_count
                    conn.close()
                except:
                    signal_count = 0; new_today = 0

                try:
                    sc = InstitutionalRoutesMixin._signals_cache
                    if sc and sc.get('data') and isinstance(sc['data'], dict):
                        top_alpha = sc['data'].get('signals', [])[:10]
                    else:
                        top_alpha = []
                except Exception:
                    top_alpha = []

                payload = json.dumps({
                    "type": "prices", "data": LIVE_PRICES,
                    "signal_count": signal_count, "new_today": new_today,
                    "top_alpha": top_alpha
                })
                if use_redis:
                    redis_client.publish('alphasignal:pubsub:broadcast', payload)
                else:
                    self.broadcast(payload)

                # - Item 4+5: background prewarm + TP/SL alerts (every 60s) -
                now = time.time()
                if now - _last_prewarm >= 60:
                    _last_prewarm = now
                    try:
                        from concurrent.futures import ThreadPoolExecutor, as_completed
                        conn2 = sqlite3.connect(DB_PATH, timeout=30)
                        cur2  = conn2.cursor()
                        cur2.execute("""
                            SELECT DISTINCT ticker, id, type, price
                            FROM alerts_history
                            WHERE COALESCE(status,'active')='active'
                              AND timestamp > datetime('now', '-30 day')
                        """)
                        active_rows = cur2.fetchall()
                        conn2.close()

                        # Deduplicate tickers for pricing
                        sig_tickers = list({r[0] for r in active_rows})

                        def _fetch_px(orig_t):
                            candidates = [orig_t] + ([orig_t+'-USD'] if '-' not in orig_t else [orig_t[:-4]])
                            for sym2 in candidates:
                                try:
                                    info2 = yf.Ticker(sym2).fast_info
                                    px2 = info2.get('last_price') or info2.get('lastPrice')
                                    if px2 and float(px2) > 0:
                                        return orig_t, round(float(px2), 6)
                                except: continue
                            return orig_t, None

                        pc  = InstitutionalRoutesMixin._price_cache
                        ttl = InstitutionalRoutesMixin._PRICE_CACHE_TTL

                        # Parallel fetch - only for tickers whose cache has expired
                        stale = [t for t in sig_tickers if t not in pc or (now - pc[t][1]) >= ttl]
                        if stale:
                            with ThreadPoolExecutor(max_workers=min(10, len(stale))) as pool2:
                                futs = {pool2.submit(_fetch_px, t): t for t in stale}
                                for fut in as_completed(futs):
                                    orig_t2, px2 = fut.result()
                                    if px2:
                                        pc[orig_t2] = (px2, time.time())

                        # - Item 5: TP/SL crossing notifications -
                        tg_token = None; tg_chat = None
                        try:
                            conn3 = sqlite3.connect(DB_PATH, timeout=30)
                            cur3  = conn3.cursor()
                            cur3.execute("SELECT value FROM app_settings WHERE key='telegram_token' LIMIT 1")
                            r3 = cur3.fetchone()
                            if r3: tg_token = r3[0]
                            cur3.execute("SELECT value FROM app_settings WHERE key='telegram_chat_id' LIMIT 1")
                            r3 = cur3.fetchone()
                            if r3: tg_chat = r3[0]
                            conn3.close()
                        except: pass

                        for ticker2, sig_id, sig_type, entry_p in active_rows:
                            if not entry_p or entry_p <= 0: continue
                            cached2 = pc.get(ticker2)
                            if not cached2: continue
                            curr_p2 = cached2[0]
                            direction = 1 if (sig_type or '').upper() in BULLISH_T else -1
                            roi = round(direction * (curr_p2 - entry_p) / entry_p * 100, 2)
                            new_state = None
                            if roi > 10:   new_state = 'HIT_TP2'
                            elif roi > 5:  new_state = 'HIT_TP1'
                            elif roi < -3: new_state = 'STOPPED'
                            if new_state and _notified.get(sig_id) != new_state:
                                _notified[sig_id] = new_state
                                emoji = {'HIT_TP2':'-','HIT_TP1':'-','STOPPED':'-'}.get(new_state,'-')
                                msg = (f"{emoji} AlphaSignal Alert\n"
                                       f"*{ticker2}* - {(sig_type or '').replace('_',' ')}\n"
                                       f"State: *{new_state}*  ROI: *{roi:+.2f}%*\n"
                                       f"Entry: ${entry_p}  Current: ${curr_p2}")
                                # Broadcast to WS clients (shows in notification bell)
                                self.broadcast(json.dumps({
                                    'type': 'signal_alert',
                                    'ticker': ticker2, 'signal_id': sig_id,
                                    'state': new_state, 'roi': roi, 'message': msg
                                }))
                                # Telegram push if configured
                                if tg_token and tg_chat:
                                    try:
                                        import requests as _req
                                        _req.post(
                                            f'https://api.telegram.org/bot{tg_token}/sendMessage',
                                            json={'chat_id': tg_chat, 'text': msg, 'parse_mode': 'Markdown'},
                                            timeout=5
                                        )
                                    except: pass
                                print(f"[SignalAlert] {ticker2} {new_state} ROI={roi:+.2f}%", flush=True)
                    except Exception as pw_err:
                        print(f"[PricePrewarm] {pw_err}", flush=True)

            except Exception as e:
                if sentry_sdk:
                    sentry_sdk.capture_exception(e)
                print(f"[PriceLoop] {e}", flush=True)
            time.sleep(5)





    def run(self):
        srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            srv.bind(('0.0.0.0', self.PORT))
        except OSError:
            print(f"WS port {self.PORT} already in use, skipping.")
            return
        srv.listen(10)
        print(f"[WebSocket] Live price stream on ws://127.0.0.1:{self.PORT}")
        threading.Thread(target=self.redis_subscriber_loop, daemon=True).start()
        threading.Thread(target=self.price_harvester_loop, daemon=True).start()
        threading.Thread(target=self.price_publisher_loop, daemon=True).start()
        while self.running:
            try:
                conn, addr = srv.accept()
                threading.Thread(target=self._handle_client, args=(conn, addr), daemon=True).start()
            except: break

import websockets
import asyncio

# Global cache legacy variable removed; transitioned to Redis instance in database.py

class BinanceLiveStream:
    def __init__(self):
        self.ws_url = "wss://stream.binance.com:9443/ws"
        
    async def stream_loop(self):
        subscribe_msg = {
            "method": "SUBSCRIBE",
            "params": [
                "btcusdt@depth20@100ms",
                "btcusdt@aggTrade"
            ],
            "id": 1
        }
        
        while True:
            try:
                async with websockets.connect(self.ws_url) as websocket:
                    await websocket.send(json.dumps(subscribe_msg))
                    print("[Binance WS] Connected to btcusdt Orderbook and Tape.")
                    
                    async for message in websocket:
                        data = json.loads(message)
                        if 'bids' in data and 'asks' in data:
                            bids = [[float(b[0]), float(b[1])] for b in data['bids']]
                            asks = [[float(a[0]), float(a[1])] for a in data['asks']]
                            redis_client.set('alphasignal:liquidity', json.dumps({"bids": bids, "asks": asks}))
                        if 'e' in data and data['e'] == 'aggTrade':
                            p = float(data['p'])
                            q = float(data['q'])
                            usd = p * q
                            if usd > 50000:
                                whale_ev = {"time": data['T'], "price": p, "qty": q, "value": usd, "side": "sell" if data['m'] else "buy"}
                                redis_client.lpush('alphasignal:whales', json.dumps(whale_ev))
                                redis_client.ltrim('alphasignal:whales', 0, 49)
            except Exception as e:
                print(f"[Binance WS] Error: {e}, retrying in 5s...")
                await asyncio.sleep(5)

    def run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.stream_loop())

if __name__ == "__main__":
    print("Initializing AlphaSignal Terminal...", flush=True)
    init_db() # Ensure all persistent intelligence tables exist

    # Seed historical signals on first boot / after Railway wipe
    try:
        from startup_seed import seed_if_needed
        seed_if_needed()
    except Exception as seed_err:
        print(f"[Boot] Seed skipped: {seed_err}", flush=True)

    # Start TCPServer FIRST to ensure API is responsive
    print(f"Binding TCPServer to 0.0.0.0:{PORT}...", flush=True)
    try:
        httpd = ThreadedHTTPServer(("0.0.0.0", PORT), AlphaHandler)
        print(f"SUCCESS: AlphaSignal serving at http://127.0.0.1:{PORT}", flush=True)
        # We will serve_forever() at the end, but we need to start background threads first.
    except Exception as e:
        print(f"CRITICAL: Server failed to start: {e}", flush=True)
        os._exit(1)

    # Start Live Binance Stream
    binance_stream = BinanceLiveStream()
    threading.Thread(target=binance_stream.run, daemon=True).start()
    
    # Start WebSocket Live Price Server
    ws_server = WebSocketServer()
    ws_thread = threading.Thread(target=ws_server.run, daemon=True)
    ws_thread.start()

    # SEED CACHE FOR PORTFOLIO OPTIMIZATION (Ensure data is ready for Rebalance Advisory)
    print("Seeding Institutional Portfolio Cache...", flush=True)
    for asset in ['BTC-USD', 'ETH-USD', 'SOL-USD', 'LINK-USD', 'ADA-USD']:
        try:
            CACHE.download(asset, period='60d', interval='1d')
            print(f"[{datetime.now()}] SEEDED: {asset}")
        except Exception as e:
            print(f"[{datetime.now()}] SEED_ERROR {asset}: {e}")

    # Start Harvester: Run every 1 minute (60s) for real-time alpha alerts
    harvester = HarvestService(CACHE, ws_server=ws_server, interval=60)
    
    # Phase 6.3: Immediate Boot-Time Snapshot (Non-Blocking)
    print("Initiating immediate institutional liquidity snapshot (Background)...", flush=True)
    threading.Thread(target=harvester.record_orderbook_snapshots, daemon=True).start()
    
    h_thread = threading.Thread(target=harvester.run, daemon=True)
    print("Starting background Harvester thread...", flush=True)
    h_thread.start()

    # Start ML Alpha Engine Training
    ml_thread = threading.Thread(target=ML_ENGINE.run_training_loop, daemon=True)
    print("Starting ML Alpha Engine training loop...", flush=True)
    ml_thread.start()

    # Start Portfolio Simulator
    port_thread = threading.Thread(target=PORTFOLIO_SIM.run_simulation_loop, daemon=True)
    print("Starting Institutional Portfolio Simulation loop...", flush=True)
    port_thread.start()

    # Start Daily Digest Cron (sends at 07:30 UTC)
    from backend.routes.digest import start_digest_cron
    start_digest_cron()

    # Start Price Alert Checker (polls every 60s)
    from backend.routes.price_alerts import start_price_alert_checker
    start_price_alert_checker()

    # Start Telegram Bot (long-polling)
    from backend.routes.telegram_bot import start_bot as start_telegram_bot
    start_telegram_bot()

    httpd.serve_forever()

