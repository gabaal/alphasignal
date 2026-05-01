import sqlite3

def check():
    conn = sqlite3.connect('backend/alphasignal.db')
    c = conn.cursor()
    c.execute("SELECT ticker, type, exit_price, final_roi, closed_at FROM alerts_history WHERE status='closed' AND closed_at > datetime('now', '-1 hour')")
    rows = c.fetchall()
    for r in rows:
        print(r)
    conn.close()

if __name__ == '__main__':
    check()
