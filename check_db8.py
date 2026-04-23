import sqlite3

def check():
    conn = sqlite3.connect('backend/alphasignal.db')
    c = conn.cursor()
    c.execute("SELECT ticker, exit_price FROM alerts_history WHERE status='closed' AND closed_at > datetime('now', '-10 minute') LIMIT 10")
    rows = c.fetchall()
    for r in rows:
        print(r)
    conn.close()

if __name__ == '__main__':
    check()
