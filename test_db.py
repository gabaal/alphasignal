import sqlite3, json
conn = sqlite3.connect('backend/alphasignal.db')
row = conn.execute("SELECT snapshot_data FROM orderbook_snapshots WHERE ticker='BTC-USD' ORDER BY timestamp DESC LIMIT 1").fetchone()
if row:
    print(row[0][:500])
else:
    print("No data")
conn.close()
