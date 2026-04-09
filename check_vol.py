import sqlite3, json, datetime
conn = sqlite3.connect('backend/alphasignal.db')
rows = conn.execute("SELECT timestamp, snapshot_data FROM orderbook_snapshots WHERE ticker='BTC-USD' AND timestamp > datetime('now', '-24 hours') ORDER BY timestamp ASC").fetchall()
for ts_str, snap_json in rows:
    try:
        if '08:10' < ts_str.split(' ')[1] < '09:00':
            snap = json.loads(snap_json)
            sizes = [w['size'] for w in snap.get('walls', [])]
            print(f"{ts_str}: {len(sizes)} walls, max: {max(sizes) if sizes else 0}")
    except: pass
conn.close()
