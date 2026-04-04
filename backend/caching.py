import json
import time
import sqlite3
import threading
import requests
import pandas as pd
import yfinance as yf
import io
from datetime import datetime
from .database import SupabaseClient, DB_PATH

class DataCache:
    def __init__(self, ttl=300):
        self._cache = {}
        self._ttl = ttl

    def get(self, key):
        # L1 (Memory)
        if key in self._cache:
            data, ts = self._cache[key]
            if time.time() - ts < self._ttl:
                return data
            else:
                del self._cache[key]
        
        # L2 (SQLite fallback)
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT value, expires_at FROM cache_store WHERE key = ?", (key,))
            row = c.fetchone()
            conn.close()
            if row:
                val, exp = row
                if exp > time.time():
                    data = json.loads(val)
                    self._cache[key] = (data, time.time())
                    return data
        except: pass

        # L3 (Supabase Primary)
        cloud_data = SupabaseClient.query("cache_store", filters=f"key=eq.{key}")
        if cloud_data:
            data = json.loads(cloud_data[0]['value'])
            self._cache[key] = (data, time.time())
            return data

        return None

    def set(self, key, data):
        self._cache[key] = (data, time.time())
        # Set local L2
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("INSERT OR REPLACE INTO cache_store (key, value, expires_at) VALUES (?, ?, ?)", 
                      (key, json.dumps(data, default=str), time.time() + self._ttl))
            conn.commit()
            conn.close()
        except: pass
        
        # Sync to Cloud L3 via background thread to avoid blocking
        def sync():
            SupabaseClient.upsert("cache_store", {
                "key": key,
                "value": json.dumps(data, default=str),
                "expires_at": time.time() + self._ttl
            })
        threading.Thread(target=sync, daemon=True).start()

    def set_batch(self, key_data_pairs):
        """Batch set into SQLite and Supabase."""
        if not key_data_pairs: return
        now = time.time()
        payloads = []
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            for key, data in key_data_pairs.items():
                self._cache[key] = (data, now)
                val_str = json.dumps(data, default=str)
                exp = now + self._ttl
                c.execute("INSERT OR REPLACE INTO cache_store (key, value, expires_at) VALUES (?, ?, ?)", 
                          (key, val_str, exp))
                payloads.append({"key": key, "value": val_str, "expires_at": exp})
            conn.commit()
            conn.close()
        except: pass
        
        if payloads:
            def sync_batch():
                SupabaseClient.upsert_batch("cache_store", payloads)
            threading.Thread(target=sync_batch, daemon=True).start()

    def download(self, tickers, period='1y', interval='1d', column=None):
        """Standardized downloader for single and multi-asset requests."""
        if isinstance(tickers, str): tickers = [tickers]
        unique_tickers = list(dict.fromkeys(tickers))
        key = f"dl:{','.join(unique_tickers)}:{period}:{interval}:{column}"
        
        # Check L2 Cache
        cached = self.get(key)
        if cached is not None:
            if isinstance(cached, dict) and 'df' in cached:
                return pd.read_json(io.StringIO(cached['df']))
            return cached
            
        try:
            raw = yf.download(unique_tickers, period=period, interval=interval, progress=False)
            if raw.empty: return None
            
            # 1. Standardize Output to DataFrame
            data = raw
            
            # 2. Standardize Output to DataFrame or Series
            # Handle cases where yfinance returns a Series instead of DataFrame
            if not hasattr(raw, 'columns'):
                data = raw
                if column:
                     # If it's a Series and column name matches, it's our data
                     pass 
            # Case A: Multi-asset request (YFinance returns MultiIndex [Metric, Ticker])
            elif isinstance(raw.columns, pd.MultiIndex):
                if column:
                    try:
                        data = raw.xs(column, axis=1, level=0)
                    except:
                        if column in raw.columns.levels[0]:
                            data = raw[column]
                else:
                    # Keep MultiIndex, do not flatten to Ticker_Metric
                    data = raw
            
            # Case B: Single-asset request
            else:
                if column and column in raw.columns:
                    data = raw[column]
                else:
                    data = raw
            
            # 3. Cache and return
            serializable = data
            if isinstance(data, pd.DataFrame):
                # Ensure no duplicates (should be unique by now if extraction worked)
                if not data.columns.is_unique:
                    data = data.loc[:, ~data.columns.duplicated()]
                serializable = {'df': data.to_json()}
            elif isinstance(data, pd.Series):
                serializable = {'prices': data.values.tolist(), 'dates': data.index.strftime('%Y-%m-%d').tolist()}
            
            self.set(key, serializable)
            return data
        except Exception as e:
            print(f"[{datetime.now()}] Download error for {tickers}: {e}")
            return None

    def ticker_info(self, ticker):
        key = f"info:{ticker}"
        cached = self.get(key)
        if cached is not None:
            return cached
        t = yf.Ticker(ticker)
        self.set(key, t)
        return t

CACHE = DataCache(ttl=300)


class BinanceCache:
    """Lightweight in-process TTL cache for Binance FAPI, Binance spot, and blockchain.info calls.

    Each cache bucket has its own TTL tuned to the data's natural update frequency:
    - Order book (spot:depth)     →   5s  (near-real-time for liquidity view)
    - Mark price / premium index  →  30s  (funding changes each 8h, mark price semi-live)
    - Open interest               →  60s  (slow-moving)
    - Long/Short ratio            →  60s  (5-min Binance resolution)
    - 24h ticker stats            → 120s  (rolling window, very stable)
    - Mempool unconfirmed count   → 120s  (mempool resolves in minutes)
    - BTC price (blockchain.info) →  60s  (use as fallback only)
    - Funding rate history        → 300s  (8h snapshots, fully static between payouts)
    - Hashrate / tx count         → 300s  (~10-min blockchain.info update cadence)
    """

    _TTLS = {
        'fapi:premium':           30,
        'fapi:oi':                60,
        'fapi:ls':                60,
        'fapi:funding_hist':     300,
        'spot:depth':              5,
        'spot:ticker24h':        120,
        'blockchain:unconfirmed':120,
        'blockchain:price':       60,
        'blockchain:hashrate':   300,
        'blockchain:txcount':    300,
    }

    def __init__(self):
        self._store = {}          # key -> (data, expires_at)
        self._lock  = threading.Lock()

    def _key(self, bucket, sym=''):
        return f'{bucket}:{sym}' if sym else bucket

    def get(self, bucket, sym=''):
        key = self._key(bucket, sym)
        with self._lock:
            entry = self._store.get(key)
            if entry and time.time() < entry[1]:
                return entry[0]
        return None

    def set(self, bucket, data, sym=''):
        key = self._key(bucket, sym)
        ttl = self._TTLS.get(bucket, 60)
        with self._lock:
            self._store[key] = (data, time.time() + ttl)

    def fetch(self, bucket, sym, url, params=None, timeout=6):
        """Return cached data if fresh, otherwise GET the URL, cache and return.

        Returns the parsed JSON on success, None on error/miss.
        """
        cached = self.get(bucket, sym)
        if cached is not None:
            return cached
        try:
            r = requests.get(url, params=params,
                             headers={'User-Agent': 'AlphaSignal/1.25'},
                             timeout=timeout)
            if r.ok:
                data = r.json()
                self.set(bucket, data, sym)
                return data
        except Exception as e:
            print(f'[BinanceCache/{bucket}/{sym}] {e}')
        return None

    def fetch_text(self, bucket, sym, url, timeout=5):
        """Like fetch() but returns raw text (for blockchain.info simple endpoints)."""
        cached = self.get(bucket, sym)
        if cached is not None:
            return cached
        try:
            r = requests.get(url, headers={'User-Agent': 'AlphaSignal/1.25'}, timeout=timeout)
            if r.ok:
                data = r.text.strip()
                self.set(bucket, data, sym)
                return data
        except Exception as e:
            print(f'[BinanceCache/{bucket}/{sym}] {e}')
        return None


BCACHE = BinanceCache()

