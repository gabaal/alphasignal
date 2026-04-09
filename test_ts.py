import sqlite3
conn = sqlite3.connect('backend/alphasignal.db')
print(conn.execute("SELECT MIN(timestamp), MAX(timestamp), COUNT(*) FROM orderbook_snapshots WHERE ticker='BTC-USD' AND timestamp > datetime('now','-24 hours')").fetchone())
conn.close()
