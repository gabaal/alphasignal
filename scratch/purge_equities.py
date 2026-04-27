import sqlite3
import os

from backend.database import UNIVERSE, DB_PATH

NON_CRYPTO = list(set(UNIVERSE.get('EQUITIES', []) + UNIVERSE.get('TREASURY', [])))

if not NON_CRYPTO:
    print("No non-crypto equities to purge.")
    exit()

print(f"Purging signals for: {NON_CRYPTO}")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Check how many exist
placeholders = ','.join(['?']*len(NON_CRYPTO))
c.execute(f"SELECT COUNT(*) FROM alerts_history WHERE ticker IN ({placeholders})", NON_CRYPTO)
count = c.fetchone()[0]
print(f"Found {count} signals to delete in alerts_history.")

if count > 0:
    c.execute(f"DELETE FROM alerts_history WHERE ticker IN ({placeholders})", NON_CRYPTO)
    print(f"Deleted {c.rowcount} rows from alerts_history.")

c.execute(f"SELECT COUNT(*) FROM market_ticks WHERE symbol IN ({placeholders})", NON_CRYPTO)
m_count = c.fetchone()[0]
if m_count > 0:
    c.execute(f"DELETE FROM market_ticks WHERE symbol IN ({placeholders})", NON_CRYPTO)
    print(f"Deleted {c.rowcount} rows from market_ticks.")

conn.commit()
conn.close()
print("Purge complete.")
