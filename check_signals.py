import sqlite3
from datetime import datetime, timezone

conn = sqlite3.connect('backend/alphasignal.db')
c = conn.cursor()

print("=== ML_PREDICTIONS (last 10) ===")
c.execute("PRAGMA table_info(ml_predictions)")
cols = [r[1] for r in c.fetchall()]
print("Columns:", cols)
c.execute("SELECT * FROM ml_predictions ORDER BY rowid DESC LIMIT 10")
for r in c.fetchall():
    print(" ", r)

print("\n=== ALERTS_HISTORY (last 10) ===")
c.execute("PRAGMA table_info(alerts_history)")
cols = [r[1] for r in c.fetchall()]
print("Columns:", cols)
c.execute(f"SELECT * FROM alerts_history ORDER BY rowid DESC LIMIT 10")
for r in c.fetchall():
    print(" ", r)

print("\n=== SIGNAL_SUPPRESSION_LOG — all unique gates ===")
c.execute("SELECT gate, reason, COUNT(*), MIN(timestamp), MAX(timestamp) FROM signal_suppression_log GROUP BY gate, reason")
for r in c.fetchall():
    print(" ", r)

conn.close()
