import sqlite3
import os
db_path = os.path.abspath('database.db')
c = sqlite3.connect(db_path)
results = c.execute("SELECT id, ticker, z_score, alpha FROM alerts_history WHERE ticker='MOG-USD'").fetchall()
print('MOG-USD in DB:', len(results))
for r in results:
    print(r)
