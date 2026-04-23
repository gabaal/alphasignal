import sqlite3

def check():
    conn = sqlite3.connect('backend/alphasignal.db')
    c = conn.cursor()
    c.execute("SELECT timestamp FROM alerts_history WHERE status='active' OR status IS NULL LIMIT 10")
    rows = c.fetchall()
    for r in rows:
        print(r[0])
    conn.close()

if __name__ == '__main__':
    check()
