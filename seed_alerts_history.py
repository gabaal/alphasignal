"""
Seed script: populates alerts_history with 90 days of realistic institutional signals
so that Backtester V2 has enough data to run.
Run once from the alphasignal/ directory:
    python seed_alerts_history.py
"""
import sqlite3, random, math
from datetime import datetime, timedelta

DB_PATH = 'alphasignal.db'

SIGNAL_TYPES = [
    'MOMENTUM_BREAKOUT', 'WHALE_ACCUMULATION', 'SENTIMENT_SPIKE',
    'REGIME_SHIFT_LONG', 'ALPHA_DIVERGENCE_LONG', 'LIQUIDITY_VACUUM',
    'REGIME_SHIFT_SHORT', 'ALPHA_DIVERGENCE_SHORT'
]

# Realistic base prices (approximate March 2025)
BASE_PRICES = {
    'BTC-USD':  82000.0,
    'ETH-USD':  1800.0,
    'SOL-USD':  120.0,
    'BNB-USD':  570.0,
    'XRP-USD':  0.50,
    'LINK-USD': 12.0,
    'DOGE-USD': 0.16,
    'AVAX-USD': 18.0,
    'ARB-USD':  0.38,
    'MATIC-USD':0.22,
    'MSTR':     290.0,
    'COIN':     185.0,
    'NVDA':     850.0,
    'ADA-USD':  0.60,
    'ATOM-USD': 4.2,
}

TICKERS = list(BASE_PRICES.keys())

def simulate_price(base, days_ago, volatility=0.03):
    """Random walk price from 90 days ago to signal date."""
    price = base
    for _ in range(days_ago):
        price *= (1 + random.gauss(0.0005, volatility))
    return max(price, 0.001)

conn = sqlite3.connect(DB_PATH)
c    = conn.cursor()

# Ensure table exists
c.execute('''CREATE TABLE IF NOT EXISTS alerts_history (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    type      TEXT,
    ticker    TEXT,
    message   TEXT,
    severity  TEXT,
    timestamp TEXT,
    price     REAL
)''')

# Count existing rows
c.execute('SELECT COUNT(*) FROM alerts_history')
existing = c.fetchone()[0]
print(f'Existing rows: {existing}')

if existing >= 50:
    print('Already seeded (>=50 rows). Exiting.')
    conn.close()
    exit()

# Generate 90 days of signals: ~2-4 signals per day
now = datetime.utcnow()
inserted = 0

for days_ago in range(90, 0, -1):
    day = now - timedelta(days=days_ago)
    num_signals = random.randint(1, 4)
    for _ in range(num_signals):
        ticker   = random.choice(TICKERS)
        sig_type = random.choice(SIGNAL_TYPES)
        severity = random.choice(['low', 'medium', 'high', 'critical'])
        price    = simulate_price(BASE_PRICES[ticker], days_ago)
        # Random hour/minute in the day
        hour     = random.randint(0, 23)
        minute   = random.randint(0, 59)
        ts_str   = day.replace(hour=hour, minute=minute, second=0, microsecond=0).strftime('%Y-%m-%d %H:%M:%S')
        msg      = f'Algorithm detected {sig_type} on {ticker} via institutional volume flow anomaly.'
        c.execute(
            'INSERT INTO alerts_history (type, ticker, message, severity, timestamp, price) VALUES (?,?,?,?,?,?)',
            (sig_type, ticker, msg, severity, ts_str, round(price, 6))
        )
        inserted += 1

conn.commit()
conn.close()
print(f'Seeded {inserted} signals across 90 days. Total rows: {existing + inserted}')
