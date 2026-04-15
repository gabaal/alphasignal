import sqlite3
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', 'database.db'))
try:
    conn = sqlite3.connect(db_path)
    # Target MOG-USD and any other extreme anomalies over 1000%
    conn.execute("DELETE FROM alerts_history WHERE ticker = 'MOG-USD' OR alpha > 1000 OR change > 1000")
    conn.commit()
    conn.close()
    print("Cleaned database successfully")
except Exception as e:
    print(f"DB Error: {e}")
