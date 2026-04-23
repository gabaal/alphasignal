import sqlite3

def check():
    conn = sqlite3.connect('backend/alphasignal.db')
    c = conn.cursor()
    c.execute("SELECT ticker, type, status, closed_at FROM alerts_history WHERE timestamp LIKE '2026-04-16%'")
    rows = c.fetchall()
    for r in rows:
        print(r)
    conn.close()

if __name__ == '__main__':
    check()
