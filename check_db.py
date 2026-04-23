import sqlite3
from datetime import datetime, timedelta

def check():
    conn = sqlite3.connect('backend/alphasignal.db')
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM alerts_history WHERE status='closed' AND closed_at > datetime('now', '-1 hour')")
    count = c.fetchone()[0]
    print(f"Newly closed signals: {count}")
    conn.close()

if __name__ == '__main__':
    check()
