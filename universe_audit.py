"""
Universe Health Audit — checks all tickers for:
  1. Latest price in market_ticks (DB) and whether it's zero / stale
  2. Live yfinance fast_info price
  3. Mismatch between DB price and live price (>20% drift = stale)
"""
import sqlite3, sys, math
from datetime import datetime, timedelta

DB = 'alphasignal.db'

# Import universe
try:
    import sys; sys.path.insert(0, '.')
    from backend.database import UNIVERSE
    ALL = list(set([t for sub in UNIVERSE.values() for t in sub]))
except Exception as e:
    print(f"Could not load UNIVERSE: {e}"); sys.exit(1)

print(f"\n{'='*72}")
print(f"  ALPHASIGNAL UNIVERSE HEALTH AUDIT  —  {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
print(f"  Tickers: {len(ALL)}")
print(f"{'='*72}\n")

conn = sqlite3.connect(DB)
c = conn.cursor()

# ── 1. DB price check ──────────────────────────────────────────────────────
db_prices = {}
db_ts     = {}
STALE_HOURS = 2

for t in ALL:
    c.execute(
        "SELECT price, timestamp FROM market_ticks WHERE symbol=? AND price>0 ORDER BY timestamp DESC LIMIT 1",
        (t,)
    )
    row = c.fetchone()
    if row:
        db_prices[t] = float(row[0])
        db_ts[t]     = row[1]
conn.close()

# ── 2. Live yfinance price check ───────────────────────────────────────────
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch_live(ticker):
    candidates = [ticker]
    if '-' not in ticker:   candidates.append(ticker + '-USD')
    elif ticker.endswith('-USD'): candidates.append(ticker[:-4])
    for sym in candidates:
        try:
            info = yf.Ticker(sym).fast_info
            px = info.get('last_price') or info.get('lastPrice') or info.get('regularMarketPrice')
            if px and float(px) > 0:
                return ticker, round(float(px), 10)
        except: continue
    return ticker, None

print("Fetching live prices from yfinance (parallel)...")
live_prices = {}
with ThreadPoolExecutor(max_workers=12) as pool:
    futures = {pool.submit(fetch_live, t): t for t in ALL}
    for fut in as_completed(futures):
        t, px = fut.result()
        if px: live_prices[t] = px

print(f"Live prices fetched: {len(live_prices)}/{len(ALL)}\n")

# ── 3. Report ──────────────────────────────────────────────────────────────
def fmt(v):
    if v is None: return 'N/A'
    if v >= 1:    return f'${v:,.4f}'
    if v <= 0:    return '$0.00 ⚠️'
    dps = max(4, -int(math.floor(math.log10(abs(v)))) + 3)
    return f'${v:.{dps}f}'

OK, ZERO_DB, NO_DB, STALE_DB, LIVE_MISS, DRIFT = [], [], [], [], [], []
now = datetime.utcnow()

for t in sorted(ALL):
    db_p  = db_prices.get(t)
    live_p = live_prices.get(t)
    ts    = db_ts.get(t)

    # Staleness check
    stale = False
    if ts:
        try:
            ts_dt = datetime.fromisoformat(ts.replace('Z','').replace('T',' '))
            age_h = (now - ts_dt).total_seconds() / 3600
            stale = age_h > STALE_HOURS
        except: stale = True

    if db_p is None:      NO_DB.append(t)
    elif db_p == 0:       ZERO_DB.append(t)
    elif stale:           STALE_DB.append(t)

    if live_p is None:    LIVE_MISS.append(t)

    # Drift: live vs DB >20%
    if db_p and live_p and db_p > 0:
        drift_pct = abs(live_p - db_p) / db_p * 100
        if drift_pct > 20:
            DRIFT.append((t, db_p, live_p, round(drift_pct, 1)))

    status = '✅' if (db_p and db_p > 0 and not stale and live_p) else '⚠️ ' if (db_p and db_p > 0) else '❌'
    db_str   = fmt(db_p)  if db_p  else 'missing'
    live_str = fmt(live_p) if live_p else 'yf miss'
    age_str  = f'{age_h:.1f}h ago' if ts and not stale else (f'STALE {age_h:.1f}h' if stale else '—')
    print(f"  {status} {t:<14}  DB: {db_str:<18}  Live: {live_str:<18}  {age_str}")

# ── 4. Summary ────────────────────────────────────────────────────────────
print(f"\n{'='*72}")
print(f"  SUMMARY")
print(f"{'='*72}")
print(f"  ✅ Healthy          : {len(ALL) - len(set(NO_DB+ZERO_DB+STALE_DB+LIVE_MISS))}/{len(ALL)}")
print(f"  ❌ Not in market_ticks : {len(NO_DB)}  {NO_DB}")
print(f"  ❌ Zero price in DB    : {len(ZERO_DB)}  {ZERO_DB}")
print(f"  ⚠️  Stale (>{STALE_HOURS}h old)   : {len(STALE_DB)}  {STALE_DB}")
print(f"  ⚠️  yfinance miss      : {len(LIVE_MISS)}  {LIVE_MISS}")
if DRIFT:
    print(f"\n  📊 PRICE DRIFT (DB vs Live >20%):")
    for t, db_p, live_p, pct in DRIFT:
        print(f"       {t:<14}  DB={fmt(db_p)}  Live={fmt(live_p)}  drift={pct}%")
print(f"\n  Action needed: {len(set(NO_DB+ZERO_DB+LIVE_MISS))} ticker(s)")
print(f"{'='*72}\n")
