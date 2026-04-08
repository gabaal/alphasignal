import sqlite3
conn = sqlite3.connect('backend/alphasignal.db')
r = conn.execute("SELECT COUNT(*), COUNT(DISTINCT ticker), COUNT(CASE WHEN status='closed' THEN 1 END) FROM alerts_history WHERE user_email='geraldbaalham@live.co.uk'").fetchone()
print('Total:', r[0], ' Tickers:', r[1], ' Closed:', r[2])
sample = conn.execute("SELECT type, ticker, severity, direction, status, final_roi FROM alerts_history WHERE user_email='geraldbaalham@live.co.uk' ORDER BY timestamp DESC LIMIT 5").fetchall()
for row in sample:
    print(row)
conn.close()
