import sqlite3
import json

conn = sqlite3.connect('alphasignal.db')
c = conn.cursor()
c.execute("SELECT id, user_email, length(user_email) FROM trade_ledger")
rows = c.fetchall()
print(json.dumps(rows, indent=2))
conn.close()
