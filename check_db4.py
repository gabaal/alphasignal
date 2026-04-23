import sqlite3

def check():
    conn = sqlite3.connect('backend/alphasignal.db')
    c = conn.cursor()
    c.execute("SELECT ticker, exit_price FROM alerts_history WHERE status='closed' AND exit_price=0.0")
    rows = c.fetchall()
    print(f"Signals closed with 0.0 exit price: {len(rows)}")
    conn.close()

if __name__ == '__main__':
    check()
