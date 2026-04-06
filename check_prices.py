import sqlite3
conn = sqlite3.connect('alphasignal.db')
c = conn.cursor()
c.execute("SELECT ticker, AVG(price), MIN(price), MAX(price), COUNT(*) FROM alerts_history WHERE price > 0 GROUP BY ticker ORDER BY AVG(price)")
for r in c.fetchall():
    print(f'{r[0]:15s} avg={r[1]:.6f}  min={r[2]:.6f}  max={r[3]:.6f}  n={r[4]}')

# Remove bad ARB-USD rows (yfinance returned wrong scale ~0.0009)
c.execute("SELECT COUNT(*) FROM alerts_history WHERE ticker='ARB-USD' AND price < 0.01")
bad = c.fetchone()[0]
if bad > 0:
    c.execute("DELETE FROM alerts_history WHERE ticker='ARB-USD' AND price < 0.01")
    conn.commit()
    print(f'\nDeleted {bad} bad ARB-USD rows (price < $0.01)')
else:
    print('\nARB-USD prices look OK')

conn.close()
