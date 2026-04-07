import sqlite3
c = sqlite3.connect('alphasignal.db')
cur = c.cursor()

cur.execute("SELECT symbol, price, timestamp FROM market_ticks WHERE symbol='VIRT' ORDER BY timestamp DESC LIMIT 5")
print('VIRT ticks:', cur.fetchall())

cur.execute("SELECT symbol, price, timestamp FROM market_ticks WHERE symbol='XRP-USD' ORDER BY timestamp DESC LIMIT 3")
print('XRP-USD ticks:', cur.fetchall())

cur.execute("SELECT COUNT(*) FROM market_ticks WHERE timestamp > datetime('now', '-1 hour')")
print('Ticks in last 1hr:', cur.fetchone()[0])

cur.execute("SELECT MAX(timestamp) FROM market_ticks")
print('Latest tick:', cur.fetchone()[0])

c.close()
