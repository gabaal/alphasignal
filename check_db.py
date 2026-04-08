import sys
sys.path.insert(0, ".")
from backend.database import DB_PATH
print("DB_PATH:", DB_PATH)
import sqlite3
conn = sqlite3.connect(DB_PATH)
user = "geraldbaalham@live.co.uk"
count = conn.execute("SELECT COUNT(id) FROM alerts_history WHERE user_email=?", (user,)).fetchone()[0]
print("Signals for user:", count)
rows = conn.execute("SELECT id, type, ticker, status FROM alerts_history WHERE user_email=? LIMIT 5", (user,)).fetchall()
for r in rows: print(" ", r)
conn.close()
