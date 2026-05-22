import sqlite3
conn = sqlite3.connect('backend/alphasignal.db')
c = conn.cursor()
c.execute("""
    SELECT type, ticker, severity, price, timestamp, z_score, alpha,
           direction, status, exit_price, final_roi, max_roi
    FROM alerts_history
    ORDER BY timestamp DESC
    LIMIT 5
""")
for r in c.fetchall():
    print(r)
conn.close()
