#!/usr/bin/env python3
"""
Seed alerts_history with synthetic but price-accurate signals
for Dec 2025 – Mar 2026 to give Backtester V2 meaningful data.

- Uses real yfinance OHLCV data so entry prices are authentic.
- Distributes signals across trading days with realistic timing.
- Deduplicates against existing rows (ticker + timestamp).
- Targets ~400-500 new signals across 15 tickers / 4 months.
"""

import sqlite3, random, sys
from datetime import datetime, timedelta, timezone

try:
    import yfinance as yf
except ImportError:
    sys.exit("yfinance not installed. Run: pip install yfinance")

DB_PATH = "alphasignal.db"

# ── Tickers to seed ────────────────────────────────────────────────────────────
TICKERS = [
    "BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "BNB-USD",
    "DOGE-USD", "ADA-USD", "LINK-USD", "AVAX-USD", "ATOM-USD",
    "ARB-USD", "MATIC-USD",
    "COIN", "MSTR", "NVDA",
]

# ── Signal type pools (bullish / bearish / neutral) ───────────────────────────
BULLISH = [
    "WHALE_ACCUMULATION", "SENTIMENT_SPIKE", "LIQUIDITY_VACUUM",
    "MOMENTUM_BREAKOUT", "ALPHA_DIVERGENCE_LONG", "REGIME_SHIFT_LONG",
    "MACD_BULLISH_CROSS", "RSI_OVERSOLD", "ML_LONG",
]
BEARISH = [
    "REGIME_SHIFT_SHORT", "ALPHA_DIVERGENCE_SHORT", "Z_SCORE_HIGH",
    "RSI_OVERBOUGHT", "MACD_BEARISH_CROSS", "ML_SHORT", "FUNDING_EXTREME",
]

# Weight: 60% bullish, 40% bearish (realistic for a trending market)
ALL_TYPES = BULLISH * 3 + BEARISH * 2

# ── Date window ───────────────────────────────────────────────────────────────
START = datetime(2025, 12, 1, tzinfo=timezone.utc)
END   = datetime(2026, 3, 29, 23, 59, tzinfo=timezone.utc)

# ── Signals per day per ticker (Poisson-like distribution) ───────────────────
# On average ~3 signals per day spread across all tickers
DAILY_SIGNALS_TARGET = 3   # total signals per trading day

random.seed(42)  # deterministic — re-running produces same data

# ── Download price history ────────────────────────────────────────────────────
print("Downloading historical price data from yfinance...")
price_data = {}   # ticker -> {date_str -> close_price}

for tk in TICKERS:
    try:
        df = yf.download(tk, start="2025-11-28", end="2026-04-01",
                         interval="1d", progress=False, auto_adjust=True)
        if df.empty:
            print(f"  SKIP {tk}: no data")
            continue
        # Handle multi-level columns
        if hasattr(df.columns, 'levels'):
            try:
                closes = df["Close"][tk] if tk in df["Close"].columns else df["Close"].iloc[:, 0]
            except Exception:
                closes = df["Close"].iloc[:, 0]
        else:
            closes = df["Close"]

        daily = {}
        for dt_idx, price in closes.items():
            if hasattr(dt_idx, 'date'):
                d = dt_idx.date().isoformat()
            else:
                d = str(dt_idx)[:10]
            if price and float(price) > 0:
                daily[d] = float(price)

        price_data[tk] = daily
        print(f"  OK  {tk}: {len(daily)} bars, latest close=${list(daily.values())[-1]:.4f}")
    except Exception as e:
        print(f"  ERR {tk}: {e}")

if not price_data:
    sys.exit("No price data downloaded. Check network connection.")

# ── Load existing signal timestamps to avoid duplicates ──────────────────────
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("SELECT ticker, timestamp FROM alerts_history")
existing = set((r[0], r[1][:10]) for r in c.fetchall())  # (ticker, date)
print(f"\nExisting signals: {len(existing)} (will skip duplicates)")

# ── Generate signals ──────────────────────────────────────────────────────────
new_rows = []
current = START

while current <= END:
    date_str = current.date().isoformat()

    # Find tickers that have price data for this day
    available = [(tk, price_data[tk][date_str])
                 for tk in price_data
                 if date_str in price_data.get(tk, {})]

    if available:
        # Draw DAILY_SIGNALS_TARGET tickers randomly (with possible repeats avoided)
        n_today = random.choices([1, 2, 3, 4, 5], weights=[5, 20, 35, 25, 15])[0]
        chosen = random.sample(available, min(n_today, len(available)))

        for tk, close_price in chosen:
            if (tk, date_str) in existing:
                continue  # skip duplicate date+ticker

            sig_type = random.choice(ALL_TYPES)

            # Realistic intraday time: between 02:00 and 22:00 UTC
            hour   = random.randint(2, 22)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            ts = datetime(
                current.year, current.month, current.day,
                hour, minute, second, tzinfo=timezone.utc
            )
            ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")

            # Add slight price noise (±0.5% from close — simulates intraday entry)
            noise  = 1 + random.uniform(-0.005, 0.005)
            price  = round(close_price * noise, 6)

            new_rows.append((tk, sig_type, price, ts_str))
            existing.add((tk, date_str))  # prevent same ticker twice today

    current += timedelta(days=1)

print(f"\nGenerated {len(new_rows)} new signals to insert.")

# ── Insert ────────────────────────────────────────────────────────────────────
if not new_rows:
    print("Nothing to insert.")
    conn.close()
    sys.exit(0)

c.executemany(
    "INSERT INTO alerts_history (ticker, type, price, timestamp) VALUES (?, ?, ?, ?)",
    new_rows
)
conn.commit()

# ── Verify ────────────────────────────────────────────────────────────────────
c.execute("SELECT COUNT(*) FROM alerts_history WHERE price > 0")
total = c.fetchone()[0]
c.execute("SELECT MIN(timestamp), MAX(timestamp) FROM alerts_history WHERE price > 0")
dr = c.fetchone()
conn.close()

print(f"\n✓ Inserted {len(new_rows)} signals.")
print(f"✓ alerts_history now has {total} total rows with price > 0")
print(f"✓ Date range: {dr[0]}  →  {dr[1]}")
print("\nDone. Restart the server and click RUN BACKTEST.")
