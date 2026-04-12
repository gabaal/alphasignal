import os
import sqlite3
import requests
import stripe
import redis

# Initialize Redis connection pointing to localhost instance
import socket
REDIS_UP = False
try:
    with socket.create_connection(('localhost', 6379), timeout=1):
        REDIS_UP = True
except:
    pass

if REDIS_UP:
    try:
        redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
        # We don't need a ping here if the socket connect worked, or we can ping with a short timeout.
        # But some redis versions might still hang on ping.
    except:
        REDIS_UP = False

if not REDIS_UP:
    print("Redis Connection Warning: Falling back to mock redis.", flush=True)
    # Mock Redis object for local development environments lacking a running redis-server
    class MockRedis:
        def __init__(self):
            self.data = {}
            self.lists = {}
        def ping(self): return True
        def set(self, k, v): self.data[k] = v
        def get(self, k): return self.data.get(k)
        def lpush(self, k, v):
            if k not in self.lists: self.lists[k] = []
            self.lists[k].insert(0, v)
        def ltrim(self, k, start, end):
            if k in self.lists: self.lists[k] = self.lists[k][start:end+1]
        def lrange(self, k, start, end):
            if k in self.lists: return self.lists[k][start:end+1]
            return []
        def publish(self, ch, m): pass
        def pubsub(self):
            class MockPubSub:
                def subscribe(self, *args): pass
                def listen(self): return []
            return MockPubSub()
    redis_client = MockRedis()

def load_env():
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    os.environ[k] = v

load_env()
PORT = 8006

# ============================================================
# Cloud Database & Auth Configuration (Supabase)
# ============================================================
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "your-anon-key")
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# ============================================================
# Stripe Payment Configuration
# ============================================================
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
print(f"Stripe Config: PK={'Set' if STRIPE_PUBLISHABLE_KEY else 'MISSING'}, SK={'Set' if STRIPE_SECRET_KEY else 'MISSING'}")
stripe.api_key = STRIPE_SECRET_KEY

class SupabaseClient:
    @staticmethod
    def query(table, filters=None, method="GET", data=None):
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        if filters: url += f"?{filters}"
        
        headers = {**SUPABASE_HEADERS, "Prefer": "return=minimal,resolution=merge-duplicates"}
        try:
            if method == "POST":
                r = requests.post(url, headers=headers, json=data, timeout=5)
            else:
                r = requests.get(url, headers=headers, timeout=5)
            
            if r.status_code in [200, 201, 204]:
                return r.json() if r.text else True
            return []
        except: return []

    @staticmethod
    def upsert(table, data):
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        headers = {**SUPABASE_HEADERS, "Prefer": "return=minimal,resolution=merge-duplicates"}
        try:
            r = requests.post(url, headers=headers, json=data, timeout=5)
            return r.status_code in [200, 201]
        except: return False

    @staticmethod
    def upsert_batch(table, data_list):
        if not data_list: return True
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        headers = {**SUPABASE_HEADERS, "Prefer": "return=minimal,resolution=merge-duplicates"}
        try:
            r = requests.post(url, headers=headers, json=data_list, timeout=10)
            return r.status_code in [200, 201]
        except: return False

    @staticmethod
    def auth_login(email, password):
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        try:
            r = requests.post(url, headers=SUPABASE_HEADERS, json={"email": email, "password": password}, timeout=5)
            data = r.json()
            if r.status_code == 200: return data
            return {"error": data.get("error_description") or data.get("msg") or "Login failed"}
        except Exception as e: return {"error": f"Connection failed: {str(e)}"}

    @staticmethod
    def auth_signup(email, password):
        url = f"{SUPABASE_URL}/auth/v1/signup"
        try:
            r = requests.post(url, headers=SUPABASE_HEADERS, json={"email": email, "password": password}, timeout=5)
            data = r.json()
            if r.status_code == 200: return data
            return {"error": data.get("msg") or data.get("error_description") or "Signup failed"}
        except Exception as e: return {"error": f"Connection failed: {str(e)}"}


# ============================================================
# Pack G1: Expanded Multi-Asset Universe
# ============================================================
UNIVERSE = {
    'EXCHANGE': ['COIN', 'HOOD', 'VIRT', 'MARA'],
    'MINERS':   ['RIOT', 'CLSK', 'IREN', 'WULF', 'CORZ', 'HUT'],
    'PROXY':    ['MSTR', 'GLXY.TO'],
    'ETF':      ['IBIT', 'FBTC', 'ARKB', 'BITO'],
    'EQUITIES': ['NVDA', 'TSLA', 'PLTR', 'SMCI', 'AMD'],   # crypto-correlated tech
    'DEFI':     ['AAVE-USD', 'LDO-USD', 'MKR-USD', 'CRV-USD', 'RUNE-USD', 'SNX-USD', 'JTO-USD', 'EIGEN-USD'],
    'L1':       ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'AVAX-USD', 'DOT-USD',
                 'TON-USD', 'ATOM-USD', 'NEAR-USD', 'TRX-USD', 'INJ-USD', 'XRP-USD',
                 'SEI-USD'],
    'L2':       ['OP-USD', 'ALGO-USD', 'STRK-USD'],
    'AI':       ['FET-USD', 'RENDER-USD', 'OCEAN-USD', 'WLD-USD', 'GRT-USD', 'IO-USD'],
    'STABLES':  ['USDC-USD', 'USDT-USD'],
    'MEMES':    ['DOGE-USD', 'SHIB-USD', 'BONK-USD', 'WIF-USD', 'FLOKI-USD', 'PEPE-USD', 'MOG-USD'],
    'PYTH':     ['PYTH-USD'],
}

# Aliases for rebranded/deprecated tickers (MATIC → POL after Polygon rebrand)
TICKER_ALIASES = {
    'MATIC-USD': 'POL-USD',
    'MATIC':     'POL-USD',
}

WHALE_WALLETS = {
    '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': 'Binance Cold Storage',
    'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': 'Bitfinex Reserve',
    '0x2b6ed29a95753c375764b104735cc29778c09a18': 'Jump Trading (Institutional)',
    '0x00000000219ab540356cbb839cbe05303d7705fa': 'ETH2.0 Staking Deposit',
    '0x1062a47ab45383506260907d39352e854b41a540': 'Wintermute Liquidity Cluster',
    '0x71660c4cf122851df5465df8e48386377e82484a': 'DWF Labs Entity',
    'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2': 'Robinhood Custody',
    '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF': 'Mt. Gox Recovery',
    'bc1qazcm763858nkj2dj986etajv6wquslv8uxwczt': 'US Department of Justice'
}

SENTIMENT_KEYWORDS = {
    'positive': ['bullish', 'buy', 'growth', 'profit', 'surged', 'adoption', 'partnership', 'expansion', 'outperform', 'upgrade', 'high', 'etf', 'halving', 'rally', 'positive', 'gain', 'support', 'record', 'new high'],
    'negative': ['bearish', 'sell', 'lawsuit', 'sec', 'crash', 'plummets', 'losses', 'regulation', 'ban', 'hacked', 'downgrade', 'low', 'negative', 'drop', 'fell', 'fear', 'outflow', 'redemption']
}

# ============================================================
# Pack G4: Persistent Intelligence (Hybrid Cache)
# ============================================================
# Use DATA_DIR env var for Railway Volume mounting (e.g. DATA_DIR=/data)
data_dir = os.getenv('DATA_DIR', '').rstrip('/')
if data_dir:
    DB_PATH = os.path.join(data_dir, 'alphasignal.db')
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'alphasignal.db')

def init_db():
    # Keep local SQLite for fast L1/L2 caching, but primary intelligence moves to Cloud
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS alerts_history (id INTEGER PRIMARY KEY, type TEXT, ticker TEXT, message TEXT, severity TEXT, price REAL, timestamp DATETIME)''')
    # Migration: Add price column if it doesn't exist
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN price REAL")
    except: pass
    # Migration: Add snapshot fields for permalinks
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN z_score REAL")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN alpha REAL")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN direction TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN category TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN btc_correlation REAL")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN sentiment REAL")
    except: pass
    # Migration: manual close support
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN status TEXT DEFAULT 'active'")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN closed_at TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN exit_price REAL")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN final_roi REAL")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN user_email TEXT")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_ah_user ON alerts_history(user_email)")
    except: pass
    c.execute('''CREATE TABLE IF NOT EXISTS tracked_tickers (
        ticker TEXT NOT NULL,
        user_email TEXT,
        PRIMARY KEY (ticker, user_email)
    )''')
    # Migration: add user_email column if old schema exists
    try:
        c.execute("ALTER TABLE tracked_tickers ADD COLUMN user_email TEXT")
    except: pass
    c.execute('''CREATE TABLE IF NOT EXISTS price_history (ticker TEXT, date TEXT, price REAL, PRIMARY KEY (ticker, date))''')
    c.execute('''CREATE TABLE IF NOT EXISTS cache_store (key TEXT PRIMARY KEY, value TEXT, expires_at REAL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS orderbook_snapshots (id INTEGER PRIMARY KEY, ticker TEXT, snapshot_data TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    c.execute('''CREATE TABLE IF NOT EXISTS user_settings (user_email TEXT PRIMARY KEY, discord_webhook TEXT, telegram_webhook TEXT, telegram_chat_id TEXT, alerts_enabled INTEGER DEFAULT 1)''')
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN telegram_chat_id TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN z_threshold REAL DEFAULT 2.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN whale_threshold REAL DEFAULT 5.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN depeg_threshold REAL DEFAULT 1.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN vol_spike_threshold REAL DEFAULT 2.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN cme_gap_threshold REAL DEFAULT 1.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN alerts_last_seen TEXT")
    except: pass
    # B7: separate Telegram-only mute flag so /unsub doesn't disable Discord/badge
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN telegram_alerts_enabled INTEGER DEFAULT 1")
    except: pass
    # Digest-specific opt-out: separate from alerts_enabled
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN digest_enabled INTEGER DEFAULT 1")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN algo_webhook TEXT")
    except: pass
    c.execute('''CREATE TABLE IF NOT EXISTS exchange_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        exchange TEXT NOT NULL,
        api_key TEXT NOT NULL,
        api_secret TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, exchange)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS market_ticks (symbol TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, price REAL, volume REAL, open_interest REAL)''')
    # Ensure index on market_ticks for leaderboard lookups
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_market_ticks_sym_ts ON market_ticks (symbol, timestamp DESC)")
    except: pass
    c.execute('''CREATE TABLE IF NOT EXISTS sentiment_history (symbol TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, score REAL, index_value REAL, volume REAL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS ml_predictions (symbol TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, predicted_return REAL, confidence REAL, features_json TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS portfolio_history (timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, equity REAL, draw_down REAL, assets_json TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS trade_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, ticker TEXT, action TEXT, price REAL, target REAL, stop REAL, rr REAL, slippage REAL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        ticker TEXT NOT NULL,
        target_price REAL,
        note TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, ticker)
    )''')
    # Migration: add price_at_add column for portfolio P&L tracking
    try:
        c.execute("ALTER TABLE watchlist ADD COLUMN price_at_add REAL")
    except: pass

    c.execute('''CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        ticker TEXT NOT NULL,
        side TEXT DEFAULT 'LONG',
        qty REAL NOT NULL,
        entry_price REAL NOT NULL,
        target_price REAL,
        stop_price REAL,
        opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS trading_bots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        name TEXT NOT NULL,
        asset TEXT NOT NULL,
        condition_zscore REAL,
        condition_regime TEXT,
        action_side TEXT,
        action_amount REAL,
        action_exchange TEXT,
        take_profit_pct REAL DEFAULT 0.0,
        stop_loss_pct REAL DEFAULT 0.0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_triggered DATETIME
    )''')
    try:
        c.execute("ALTER TABLE trading_bots ADD COLUMN take_profit_pct REAL DEFAULT 0.0")
    except: pass
    try:
        c.execute("ALTER TABLE trading_bots ADD COLUMN stop_loss_pct REAL DEFAULT 0.0")
    except: pass
    conn.commit()
    conn.close()
