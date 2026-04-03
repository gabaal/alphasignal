"""
seed_history.py — Backfill alerts_history and ml_predictions for AI Rebalancer.

Run from the alphasignal project root:
    python seed_history.py

What it does:
  1. alerts_history  — 60 days of realistic signal rows (RSI, MACD, Volume, ML, Regime)
                       across 12 tickers, ~4-8 signals per day per ticker
  2. ml_predictions  — 48 hours of ML prediction rows with realistic predicted_return
                       and confidence values for the same tickers
"""

import sqlite3
import os
import random
import math
from datetime import datetime, timedelta

# ── Locate the database ────────────────────────────────────────────────────
_base = os.path.dirname(os.path.abspath(__file__))
_data = os.path.join(_base, 'data')
DB_PATH = os.path.join(_data, 'alphasignal.db') if os.path.isdir(_data) else os.path.join(_base, 'backend', 'alphasignal.db')

# Try common locations
for candidate in [
    os.path.join(_base, 'data', 'alphasignal.db'),
    os.path.join(_base, 'backend', 'alphasignal.db'),
    os.path.join(_base, 'alphasignal.db'),
]:
    if os.path.exists(candidate):
        DB_PATH = candidate
        break

print(f"[seed] Using DB: {DB_PATH}")

# ── Config ─────────────────────────────────────────────────────────────────
TICKERS = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'AVAX-USD',
    'ARB-USD', 'OP-USD',  'MATIC-USD', 'LINK-USD', 'DOGE-USD',
    'MSTR',    'COIN',
]

SIGNAL_TYPES = ['RSI_OVERSOLD', 'RSI_OVERBOUGHT', 'MACD_CROSS_UP', 'MACD_CROSS_DOWN',
                'VOLUME_SPIKE', 'ML_LONG', 'ML_SHORT', 'REGIME_BULL', 'REGIME_BEAR',
                'WHALE_ACCUMULATION', 'FUNDING_EXTREME', 'Z_SCORE_HIGH']

SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
SEVERITY_WEIGHTS = [0.35, 0.40, 0.18, 0.07]

# Realistic price anchors (approximate)
PRICE_ANCHORS = {
    'BTC-USD': 82000, 'ETH-USD': 1800, 'SOL-USD': 120, 'BNB-USD': 580,
    'AVAX-USD': 22, 'ARB-USD': 0.42, 'OP-USD': 0.85, 'MATIC-USD': 0.38,
    'LINK-USD': 12.5, 'DOGE-USD': 0.17, 'MSTR': 310, 'COIN': 175,
}

def noisy(base, pct=0.05):
    """Return base ± pct% noise."""
    return base * (1 + random.uniform(-pct, pct))

def weighted_choice(choices, weights):
    r = random.random()
    cumulative = 0
    for c, w in zip(choices, weights):
        cumulative += w
        if r < cumulative:
            return c
    return choices[-1]

# ── Open DB ────────────────────────────────────────────────────────────────
conn = sqlite3.connect(DB_PATH)
cur  = conn.cursor()

# Ensure tables exist (idempotent)
cur.execute('''CREATE TABLE IF NOT EXISTS alerts_history (
    id INTEGER PRIMARY KEY,
    type TEXT, ticker TEXT, message TEXT,
    severity TEXT, price REAL,
    timestamp DATETIME
)''')
cur.execute('''CREATE TABLE IF NOT EXISTS ml_predictions (
    symbol TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    predicted_return REAL,
    confidence REAL,
    features_json TEXT
)''')

# ── 1. Seed alerts_history (60 days) ──────────────────────────────────────
print("[seed] Seeding alerts_history (60 days)...")
now  = datetime.utcnow()
rows = []

for day_offset in range(60, 0, -1):
    day_base = now - timedelta(days=day_offset)

    for ticker in TICKERS:
        price_base = PRICE_ANCHORS.get(ticker, 1.0)
        # Walk price with slight drift + noise per day
        price = noisy(price_base * (1 + 0.001 * (60 - day_offset)), pct=0.03)

        # 4–8 signals per ticker per day, spread through the day
        n_signals = random.randint(4, 8)
        for _ in range(n_signals):
            hour   = random.randint(0, 23)
            minute = random.randint(0, 59)
            ts     = day_base.replace(hour=hour, minute=minute, second=random.randint(0, 59), microsecond=0)

            sig_type = random.choice(SIGNAL_TYPES)
            severity = weighted_choice(SEVERITIES, SEVERITY_WEIGHTS)

            # Generate a realistic message
            if 'RSI' in sig_type:
                val = random.randint(20, 35) if 'OVERSOLD' in sig_type else random.randint(68, 85)
                message = f"{ticker} RSI({val}) {'oversold — potential long entry' if 'OVERSOLD' in sig_type else 'overbought — watch for reversal'}"
            elif 'MACD' in sig_type:
                message = f"{ticker} MACD {'bullish crossover detected' if 'UP' in sig_type else 'bearish crossover — momentum fading'}"
            elif 'VOLUME' in sig_type:
                mult = round(random.uniform(2.1, 5.8), 1)
                message = f"{ticker} volume spike {mult}x above 20D average — watch for breakout"
            elif 'ML' in sig_type:
                conf = round(random.uniform(0.68, 0.94), 2)
                message = f"{ticker} ML model {'LONG' if 'LONG' in sig_type else 'SHORT'} signal (conf={conf})"
            elif 'REGIME' in sig_type:
                message = f"{ticker} market regime classified as {'BULL' if 'BULL' in sig_type else 'BEAR'} — adjusting exposure"
            elif 'WHALE' in sig_type:
                amt = round(random.uniform(5, 45), 1)
                message = f"{ticker} whale accumulation detected — {amt}M USD inflow"
            elif 'FUNDING' in sig_type:
                rate = round(random.uniform(0.05, 0.18), 3)
                message = f"{ticker} funding rate extreme: {rate}% — potential mean reversion"
            else:
                z = round(random.uniform(2.1, 4.2), 2)
                message = f"{ticker} Z-score {z} — {severity.lower()} deviation from mean"

            rows.append((sig_type, ticker, message, severity, round(price, 4), ts.strftime('%Y-%m-%d %H:%M:%S')))

# Batch insert
cur.executemany(
    'INSERT INTO alerts_history (type, ticker, message, severity, price, timestamp) VALUES (?,?,?,?,?,?)',
    rows
)
print(f"[seed] Inserted {len(rows)} alerts_history rows across {60} days × {len(TICKERS)} tickers")

# ── 2. Seed ml_predictions (48 hours) ─────────────────────────────────────
print("[seed] Seeding ml_predictions (48 hours)...")
ml_rows = []

# Crypto market regime — slight positive bias
RETURN_PARAMS = {
    'BTC-USD':   (0.028, 0.015), 'ETH-USD':  (0.032, 0.020), 'SOL-USD':  (0.045, 0.025),
    'BNB-USD':   (0.025, 0.015), 'AVAX-USD': (0.040, 0.025), 'ARB-USD':  (0.055, 0.030),
    'OP-USD':    (0.052, 0.030), 'MATIC-USD':(0.038, 0.022), 'LINK-USD': (0.033, 0.018),
    'DOGE-USD':  (0.020, 0.035), 'MSTR':     (0.042, 0.028), 'COIN':     (0.035, 0.022),
}

import json

for hours_ago in range(48, 0, -1):
    ts = (now - timedelta(hours=hours_ago)).strftime('%Y-%m-%d %H:%M:%S')
    for ticker in TICKERS:
        mu, sigma = RETURN_PARAMS.get(ticker, (0.025, 0.020))
        # Gaussian noise around expected return
        pred_ret = round(random.gauss(mu, sigma), 4)
        # Confidence: higher when prediction magnitude is larger
        base_conf = 0.60 + 0.25 * min(abs(pred_ret) / 0.06, 1.0)
        confidence = round(min(0.96, base_conf + random.gauss(0, 0.04)), 4)
        # Features JSON for display purposes
        features = {
            'rsi_14':     round(random.uniform(35, 72), 1),
            'macd_hist':  round(random.gauss(0, 0.8), 3),
            'volume_z':   round(random.gauss(0.3, 0.9), 2),
            'funding':    round(random.gauss(0.01, 0.03), 4),
            'regime':     random.choice(['BULL', 'BULL', 'NEUTRAL', 'BEAR']),
            'mom_5d':     round(random.gauss(0.02, 0.04), 4),
        }
        ml_rows.append((ticker, ts, pred_ret, confidence, json.dumps(features)))

cur.executemany(
    'INSERT INTO ml_predictions (symbol, timestamp, predicted_return, confidence, features_json) VALUES (?,?,?,?,?)',
    ml_rows
)
print(f"[seed] Inserted {len(ml_rows)} ml_predictions rows ({48}h × {len(TICKERS)} tickers)")

# ── Commit ─────────────────────────────────────────────────────────────────
conn.commit()
conn.close()
print("[seed] Done! AI Rebalancer should now have sufficient history.")
print(f"       alerts_history: {len(rows)} rows | ml_predictions: {len(ml_rows)} rows")
