import os
import sqlite3
import requests
import stripe
import redis

# Patches for Yahoo Finance STX ticker mapping (STX -> STX4847-USD) to avoid delisting issues
import yfinance as yf
import pandas as pd

_orig_download = yf.download
_orig_Ticker = yf.Ticker

def patched_download(*args, **kwargs):
    if len(args) > 0:
        tickers = args[0]
        args_list = list(args)
    else:
        tickers = kwargs.get('tickers')
        args_list = []
        
    was_list = isinstance(tickers, (list, tuple, set, pd.Index))
    if was_list:
        mapped_tickers = [('STX4847-USD' if t in ('STX-USD', 'STX') else t) for t in tickers]
    else:
        mapped_tickers = 'STX4847-USD' if tickers in ('STX-USD', 'STX') else tickers
        
    if args_list:
        args_list[0] = mapped_tickers
        args = tuple(args_list)
    else:
        kwargs['tickers'] = mapped_tickers
        
    res = _orig_download(*args, **kwargs)
    
    if res is not None:
        if hasattr(res, 'columns'):
            if isinstance(res.columns, pd.MultiIndex):
                new_levels = [[('STX-USD' if x == 'STX4847-USD' else x) for x in level] for level in res.columns.levels]
                res.columns = res.columns.set_levels(new_levels)
            else:
                res = res.rename(columns={'STX4847-USD': 'STX-USD'})
        else:
            if getattr(res, 'name', None) == 'STX4847-USD':
                res.name = 'STX-USD'
    return res

def patched_Ticker(*args, **kwargs):
    if len(args) > 0:
        ticker = args[0]
        args_list = list(args)
        if ticker in ('STX-USD', 'STX'):
            args_list[0] = 'STX4847-USD'
        args = tuple(args_list)
    else:
        ticker = kwargs.get('ticker')
        if ticker in ('STX-USD', 'STX'):
            kwargs['ticker'] = 'STX4847-USD'
    return _orig_Ticker(*args, **kwargs)

yf.download = patched_download
yf.Ticker = patched_Ticker

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
if os.environ.get("TESTING") == "true":
    PORT = int(os.environ.get("PORT", 8006))



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
    'MINERS':   ['RIOT', 'CLSK', 'IREN', 'WULF', 'CORZ', 'HUT',
                 'BTBT', 'CIFR', 'BTDR'],                           # added: Bit Digital, Cipher, Bitdeer
    'PROXY':    ['MSTR'],
    'TREASURY': [],                          # BTC treasury companies
    'ETF':      ['IBIT', 'FBTC', 'ARKB', 'BITO',
                 'BITB', 'HODL', 'BTCO', 'EZBC'],                  # added: Bitwise, VanEck, Invesco, Franklin
    'EQUITIES': [],          # crypto-correlated tech
    'DEFI':     ['AAVE-USD', 'LDO-USD', 'MKR-USD', 'CRV-USD', 'RUNE-USD', 'SNX-USD', 'JTO-USD', 'EIGEN-USD'],
    'L1':       ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'AVAX-USD',
                 'TON-USD', 'ATOM-USD', 'NEAR-USD', 'TRX-USD', 'XRP-USD',
                 'SEI-USD'],
    'L2':       ['OP-USD', 'ALGO-USD', 'STRK-USD',
                 'WBTC-USD', 'STX-USD'],                            # added: Wrapped BTC
    'AI':       ['FET-USD', 'RENDER-USD', 'OCEAN-USD'],
    'MEMES':    ['DOGE-USD', 'BONK-USD', 'WIF-USD', 'FLOKI-USD'],
    'PYTH':     ['PYTH-USD'],
}

# Aliases for rebranded/deprecated tickers (MATIC -> POL after Polygon rebrand)
TICKER_ALIASES = {
    'MATIC-USD': 'POL-USD',
    'MATIC':     'POL-USD',
}

# Known equity / ETF tickers that must be fetched as-is (no -USD suffix).
EQUITY_TICKERS = {
    'IBIT', 'FBTC', 'ARKB', 'BITO', 'BITB', 'HODL', 'BTCO', 'EZBC', 'GBTC',  # Bitcoin ETFs
    'MSTR', 'COIN', 'MARA', 'RIOT', 'CLSK', 'CIFR', 'BTBT', 'HUT', 'IREN', 'WULF', 'CORZ', 'BTDR', 'VIRT', # BTC-related equities
    'NVDA', 'AMD', 'INTC', 'TSLA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',   # Tech equities
    'SPY', 'QQQ', 'GLD', 'SLV', 'TLT', 'IEF', 'HYG', 'LQD',                 # ETFs
    'HOOD', 'SOFI', 'PYPL', 'SQ', 'V', 'MA',                               # Fintech equities
}
for _cat in ['EXCHANGE', 'MINERS', 'PROXY', 'TREASURY', 'ETF', 'EQUITIES']:
    if _cat in UNIVERSE:
        for _t in UNIVERSE[_cat]:
            EQUITY_TICKERS.add(_t.upper().replace('-USD', ''))


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
    conn = sqlite3.connect(DB_PATH, timeout=30)
    c = conn.cursor()
    c.execute("PRAGMA journal_mode=WAL;")
    c.execute("PRAGMA synchronous=NORMAL;")
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
        c.execute("ALTER TABLE alerts_history ADD COLUMN max_roi REAL DEFAULT 0.0")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN tp1_hit INTEGER DEFAULT 0")
    except: pass
    # Migration: Multi-Timeframe confluence score and per-TF detail
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN mtf_score REAL")
    except: pass
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN mtf_detail TEXT")
    except: pass

    # ── Normalised signal tables (Phase 1: dual-write) ───────────────────────
    # signal_events: one row per real-world signal event (de-duplicated)
    c.execute('''CREATE TABLE IF NOT EXISTS signal_events (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        type            TEXT NOT NULL,
        ticker          TEXT NOT NULL,
        message         TEXT,
        severity        TEXT,
        price           REAL,
        timestamp       DATETIME NOT NULL,
        z_score         REAL,
        alpha           REAL,
        direction       TEXT,
        category        TEXT,
        mtf_score       REAL,
        mtf_detail      TEXT,
        btc_correlation REAL,
        sentiment       REAL
    )''')
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_se_ticker_ts ON signal_events(ticker, timestamp DESC)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_se_type_ts ON signal_events(type, timestamp DESC)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_se_ts ON signal_events(timestamp DESC)")
    except: pass

    # user_signal_state: one row per user × signal event
    # ah_id cross-references alerts_history.id during the dual-write migration window
    c.execute('''CREATE TABLE IF NOT EXISTS user_signal_state (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        signal_id    INTEGER NOT NULL REFERENCES signal_events(id),
        user_email   TEXT NOT NULL,
        status       TEXT DEFAULT 'active',
        closed_at    TEXT,
        exit_price   REAL,
        final_roi    REAL,
        max_roi      REAL DEFAULT 0.0,
        tp1_hit      INTEGER DEFAULT 0,
        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ah_id        INTEGER,
        UNIQUE(signal_id, user_email)
    )''')
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_uss_email ON user_signal_state(user_email)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_uss_signal ON user_signal_state(signal_id)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_uss_email_ts ON user_signal_state(user_email, triggered_at DESC)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_uss_ah_id ON user_signal_state(ah_id)")
    except: pass

    # Compatibility VIEW — exposes signal_events JOIN user_signal_state as the old flat layout.
    # Any legacy code still reading from alerts_history_view gets the same columns.
    try:
        c.execute('''
            CREATE VIEW IF NOT EXISTS alerts_history_view AS
            SELECT
                uss.ah_id              AS id,
                se.type,
                se.ticker,
                se.message,
                se.severity,
                se.price,
                se.timestamp,
                se.z_score,
                se.alpha,
                se.direction,
                se.category,
                se.btc_correlation,
                se.sentiment,
                uss.status,
                uss.closed_at,
                uss.exit_price,
                uss.final_roi,
                uss.max_roi,
                uss.tp1_hit,
                se.mtf_score,
                se.mtf_detail,
                uss.user_email,
                se.id              AS signal_event_id,
                uss.id             AS uss_id
            FROM signal_events se
            JOIN user_signal_state uss ON uss.signal_id = se.id
        ''')
    except: pass

    # Signal suppression audit log — every killed signal lands here with reason
    c.execute('''CREATE TABLE IF NOT EXISTS signal_suppression_log (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ticker    TEXT,
        direction TEXT,
        gate      TEXT,
        reason    TEXT,
        z_score   REAL,
        pred_return REAL,
        mtf_score REAL,
        price     REAL
    )''')
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_ssl_ts ON signal_suppression_log(timestamp DESC)")
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
        c.execute("ALTER TABLE user_settings ADD COLUMN rebalance_threshold REAL DEFAULT 2.5")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN algo_rsi_oversold REAL DEFAULT 30.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN algo_rsi_overbought REAL DEFAULT 70.0")
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
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN algo_z_threshold REAL DEFAULT 2.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN algo_whale_threshold REAL DEFAULT 5.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN algo_depeg_threshold REAL DEFAULT 1.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN algo_vol_spike_threshold REAL DEFAULT 2.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN algo_cme_gap_threshold REAL DEFAULT 1.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN tp1_pct REAL DEFAULT 5.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN tp2_pct REAL DEFAULT 10.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN sl_pct REAL DEFAULT 3.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN enable_ml_alpha INTEGER DEFAULT 1")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN enable_vol_spike INTEGER DEFAULT 1")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN enable_rsi INTEGER DEFAULT 1")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN enable_rsi_oversold INTEGER DEFAULT 1")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN enable_rsi_overbought INTEGER DEFAULT 1")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN enable_macd INTEGER DEFAULT 1")
    except: pass
    
    # Native Execution Engine Integrations
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN exchange_name TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN exchange_api_key TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN exchange_api_secret TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN native_execution_enabled INTEGER DEFAULT 0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN trade_size_usd REAL DEFAULT 100.0")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN dashboard_layout TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN dashboard_widths TEXT")
    except: pass
    try:
        c.execute("ALTER TABLE user_settings ADD COLUMN dashboard_hidden TEXT")
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
    c.execute('''CREATE TABLE IF NOT EXISTS ai_knowledge_base (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS signal_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        signal_id INTEGER NOT NULL,
        user_email TEXT NOT NULL,
        ticker TEXT,
        thesis TEXT,
        conviction INTEGER DEFAULT 0,
        entry_note REAL,
        target_note REAL,
        stop_note REAL,
        tags TEXT,
        outcome TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(signal_id, user_email)
    )''')
    # ── Page View Tracker ─────────────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS page_views (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        view_name  TEXT NOT NULL,
        path       TEXT,
        ip         TEXT,
        user_agent TEXT,
        ts         DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_pv_email ON page_views(user_email)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_pv_ts    ON page_views(ts DESC)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_pv_view  ON page_views(view_name)")
    except: pass

    # ── Signup Referrer Tracker ───────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS signups (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        email        TEXT NOT NULL,
        referrer     TEXT,
        landing_page TEXT,
        ip           TEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email)
    )''')
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_signups_email ON signups(email)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_signups_ref   ON signups(referrer)")
    except: pass
    # Migration: drip email dedup guard — stamped when the 1h post-signup email is sent
    try:
        c.execute("ALTER TABLE signups ADD COLUMN drip_email_sent_at DATETIME")
    except: pass

    # Migration: ensure all existing user_settings rows have alerts/digest enabled
    # (backfill for users created before auto-provision was added at login)
    try:
        c.execute("""
            UPDATE user_settings
            SET alerts_enabled = 1,
                digest_enabled  = COALESCE(digest_enabled, 1)
            WHERE alerts_enabled IS NULL OR alerts_enabled = 0
        """)
    except: pass

    # ── Anonymous Visitor Session Tracker ─────────────────────────────────────
    # Captures referrer + landing page for every visitor, even if they never sign up.
    # session_id is generated client-side (sessionStorage). If they later sign up,
    # their email is written onto this row so you can trace the full journey.
    c.execute('''CREATE TABLE IF NOT EXISTS visitor_sessions (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id   TEXT NOT NULL,
        referrer     TEXT,
        landing_page TEXT,
        ip           TEXT,
        user_agent   TEXT,
        email        TEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        converted_at DATETIME,
        UNIQUE(session_id)
    )''')
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_vs_session ON visitor_sessions(session_id)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_vs_ref     ON visitor_sessions(referrer)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_vs_email   ON visitor_sessions(email)")
    except: pass

    # ── Composite Index History (Pattern Predictor) ───────────────────────────
    # One row per minute: a numerical fingerprint of the market's multi-factor state.
    # Used to match the current pattern against history and predict directional bias.
    c.execute('''CREATE TABLE IF NOT EXISTS composite_index_history (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        ts             DATETIME NOT NULL,
        ci_value       REAL NOT NULL,        -- Composite Index score (-100 to +100)
        z_score        REAL,                 -- Market-wide mean Z-score
        rsi            REAL,                 -- BTC RSI-14
        bb_pos         REAL,                 -- BTC Bollinger Band position (0-1)
        macd           REAL,                 -- BTC MACD value
        vol_change     REAL,                 -- BTC volume % change vs prev period
        fear_greed     REAL,                 -- Fear & Greed index (0-100)
        regime         TEXT,                 -- Current HMM regime label
        sentiment      REAL,                 -- Aggregate BTC sentiment score
        btc_price      REAL,                 -- BTC price at this minute
        mvrv_proxy     REAL,                 -- MVRV proxy (price / 200d avg)
        whale_score    REAL,                 -- Net whale flow score (-1 to +1)
        exch_flow_score REAL                 -- Exchange inflow/outflow score (-1 to +1)
    )''')
    # Migrations: add new columns to existing prod databases
    for col, definition in [
        ('mvrv_proxy',      'REAL'),
        ('whale_score',     'REAL'),
        ('exch_flow_score', 'REAL'),
    ]:
        try:
            c.execute(f'ALTER TABLE composite_index_history ADD COLUMN {col} {definition}')
        except Exception:
            pass  # column already exists
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_cih_ts ON composite_index_history(ts DESC)")
    except: pass
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_cih_regime ON composite_index_history(regime, ts DESC)")
    except: pass

    # ── Predictor Accuracy (Pattern Predictor v2) ─────────────────────────────
    # Records every prediction made and resolves the outcome after lookback_minutes.
    c.execute('''CREATE TABLE IF NOT EXISTS predictor_accuracy (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        predicted_at     DATETIME NOT NULL,
        lookback_minutes INTEGER NOT NULL,
        regime           TEXT,
        predicted_dir    TEXT NOT NULL,      -- 'BULLISH' | 'BEARISH' | 'NEUTRAL'
        predicted_change REAL,
        confidence       REAL,
        btc_price_at     REAL,
        btc_price_after  REAL,               -- filled after lookback_minutes pass
        actual_change    REAL,               -- actual % move
        was_correct      INTEGER,            -- 1=correct, 0=wrong, NULL=pending
        resolved_at      DATETIME
    )''')
    try:
        c.execute("CREATE INDEX IF NOT EXISTS idx_pa_ts ON predictor_accuracy(predicted_at DESC)")
    except: pass

    # ── Migration: Fix bad ETF/equity exit prices ────────────────────────────
    try:
        c.execute("""
            SELECT uss.id, uss.signal_id, se.ticker, se.price, uss.closed_at, se.direction, se.type, uss.ah_id
            FROM user_signal_state uss
            JOIN signal_events se ON se.id = uss.signal_id
            WHERE uss.status = 'closed' AND (uss.exit_price > 1000 OR (uss.exit_price < 1.0 AND uss.exit_price > 0))
        """)
        bad_rows = c.fetchall()
        if bad_rows:
            import numpy as _np
            from datetime import datetime as _dt, timedelta as _td
            print(f"[Migration] Found {len(bad_rows)} closed ETF/equity signals with bad exit prices (>1000 or <1.0). Fixing...", flush=True)
            for uss_id, sig_id, ticker, entry_p, closed_at, direction_val, sig_type, ah_id in bad_rows:
                clean_tk = ticker.replace('-USD', '').upper()
                if clean_tk not in EQUITY_TICKERS:
                    continue
                try:
                    close_dt = None
                    if closed_at:
                        ts_str = closed_at.replace('Z', '').split('+')[0]
                        close_dt = _dt.fromisoformat(ts_str)
                    else:
                        close_dt = _dt.utcnow()
                    
                    start_date = (close_dt - _td(days=4)).strftime('%Y-%m-%d')
                    end_date = (close_dt + _td(days=4)).strftime('%Y-%m-%d')
                    
                    df = yf.download(clean_tk, start=start_date, end=end_date, progress=False)
                    if df is not None and not df.empty:
                        if isinstance(df.columns, pd.MultiIndex):
                            close_col = df.xs('Close', axis=1, level=0) if 'Close' in df.columns.get_level_values(0) else df
                        else:
                            close_col = df['Close'] if 'Close' in df.columns else df
                        
                        if not close_col.empty:
                            idx = _np.argmin([abs((pd.Timestamp(d).tz_localize(None) - close_dt).total_seconds()) for d in close_col.index])
                            val = close_col.iloc[idx]
                            close_val = float(val.iloc[0]) if isinstance(val, pd.Series) else float(val)
                            if close_val and close_val > 0:
                                BULLISH = {
                                    'ML_LONG','RSI_OVERSOLD','MACD_CROSS_UP','MACD_BULLISH_CROSS',
                                    'REGIME_BULL','WHALE_ACCUMULATION','VOLUME_SPIKE','SENTIMENT_SPIKE',
                                    'MOMENTUM_BREAKOUT','REGIME_SHIFT_LONG','ALPHA_DIVERGENCE_LONG',
                                    'ML_ALPHA_PREDICTION','LIQUIDITY_VACUUM'
                                }
                                stored_dir = (direction_val or '').upper()
                                if stored_dir in ('LONG', 'SHORT', 'BULLISH', 'BEARISH'):
                                    direction = -1 if stored_dir in ('SHORT', 'BEARISH') else 1
                                else:
                                    is_short = any(x in (sig_type or '').upper() for x in ['OVERBOUGHT', 'BEARISH', 'SHORT', 'SELL'])
                                    direction = -1 if is_short else 1
                                
                                new_roi = round(direction * (close_val - entry_p) / entry_p * 100, 2)
                                new_exit = round(close_val, 10)
                                
                                print(f"[Migration] Fixed signal #{sig_id} ({ticker}): exit_price={new_exit}, ROI={new_roi}%", flush=True)
                                c.execute("UPDATE user_signal_state SET exit_price=?, final_roi=? WHERE id=?", (new_exit, new_roi, uss_id))
                                if ah_id:
                                    c.execute("UPDATE alerts_history SET exit_price=?, final_roi=? WHERE id=?", (new_exit, new_roi, ah_id))
                except Exception as row_err:
                    print(f"[Migration] Error fixing signal #{sig_id}: {row_err}", flush=True)
    except Exception as migration_err:
        print(f"[Migration] Error running fix_bad_etf_exit_prices: {migration_err}", flush=True)

    # ── Migration: Fix OCEAN-USD delisted price merge error ───────────────────
    try:
        # First update alerts_history
        c.execute("""
            UPDATE alerts_history
            SET exit_price = 0.1180,
                final_roi = round(
                    (CASE WHEN LOWER(direction) = 'bearish' THEN (price - 0.1180) ELSE (0.1180 - price) END) / price * 100,
                    2
                )
            WHERE ticker = 'OCEAN-USD' AND status = 'closed' AND exit_price > 0.3
        """)
        updated_ah = c.rowcount
        
        # Then update user_signal_state matching those
        c.execute("""
            UPDATE user_signal_state
            SET exit_price = 0.1180,
                final_roi = (
                    SELECT round(
                        (CASE WHEN LOWER(ah.direction) = 'bearish' THEN (ah.price - 0.1180) ELSE (0.1180 - ah.price) END) / ah.price * 100,
                        2
                    )
                    FROM alerts_history ah
                    WHERE ah.id = user_signal_state.ah_id
                )
            WHERE status = 'closed' AND ah_id IN (
                SELECT id FROM alerts_history WHERE ticker = 'OCEAN-USD' AND exit_price = 0.1180
            )
        """)
        updated_uss = c.rowcount
        if updated_ah > 0 or updated_uss > 0:
            print(f"[Migration] Fixed OCEAN-USD delisted price error: updated {updated_ah} rows in alerts_history, {updated_uss} in user_signal_state", flush=True)
    except Exception as migration_err:
        print(f"[Migration] Error running fix_bad_ocean_exit_prices: {migration_err}", flush=True)

    # ── Migration: Fix MKR-USD delisted price merge error ─────────────────────
    try:
        # Reopen incorrectly closed MKR signals (which matched delisted prices 1813.7 and 1527.1511230469)
        c.execute("""
            UPDATE alerts_history
            SET status = 'active',
                closed_at = NULL,
                exit_price = NULL,
                final_roi = NULL,
                max_roi = 0.0,
                tp1_hit = 0
            WHERE ticker = 'MKR-USD' AND status = 'closed' AND exit_price IN (1813.7, 1527.1511230469)
        """)
        reopened_ah = c.rowcount

        c.execute("""
            UPDATE user_signal_state
            SET status = 'active',
                closed_at = NULL,
                exit_price = NULL,
                final_roi = NULL,
                max_roi = 0.0,
                tp1_hit = 0
            WHERE status = 'closed' AND ah_id IN (
                SELECT id FROM alerts_history WHERE ticker = 'MKR-USD' AND exit_price IS NULL AND status = 'active'
            )
        """)
        reopened_uss = c.rowcount
        if reopened_ah > 0 or reopened_uss > 0:
            print(f"[Migration] Reopened incorrectly closed MKR-USD signals: updated {reopened_ah} rows in alerts_history, {reopened_uss} in user_signal_state", flush=True)
    except Exception as migration_err:
        print(f"[Migration] Error running fix_bad_mkr_exit_prices: {migration_err}", flush=True)

    # ── Migration: Recalculate and fix any wrong final_roi signs ──
    try:
        c.execute("""
            SELECT uss.id, se.ticker, se.price, uss.exit_price, uss.final_roi, se.direction, se.type, uss.ah_id
            FROM user_signal_state uss
            JOIN signal_events se ON se.id = uss.signal_id
            WHERE uss.status = 'closed'
        """)
        closed_alerts = c.fetchall()
        corrected_count = 0
        for uss_id, ticker, entry_p, exit_p, final_roi, direction_val, sig_type, ah_id in closed_alerts:
            if entry_p and exit_p and entry_p > 0 and exit_p > 0:
                stored_dir = (direction_val or '').upper()
                if stored_dir in ('LONG', 'SHORT', 'BULLISH', 'BEARISH'):
                    direction = -1 if stored_dir in ('SHORT', 'BEARISH') else 1
                else:
                    is_short = any(x in (sig_type or '').upper() for x in ['OVERBOUGHT', 'BEARISH', 'SHORT', 'SELL'])
                    direction = -1 if is_short else 1
                
                correct_roi = round(direction * (exit_p - entry_p) / entry_p * 100, 2)
                if final_roi is None or abs(correct_roi - final_roi) > 0.01:
                    c.execute("UPDATE user_signal_state SET final_roi=? WHERE id=?", (correct_roi, uss_id))
                    if ah_id:
                        c.execute("UPDATE alerts_history SET final_roi=? WHERE id=?", (correct_roi, ah_id))
                    corrected_count += 1
        if corrected_count > 0:
            print(f"[Migration] Corrected final_roi for {corrected_count} closed alerts.", flush=True)
    except Exception as migration_err:
        print(f"[Migration] Error running fix_bad_roi_signs: {migration_err}", flush=True)

    conn.commit()
    conn.close()
