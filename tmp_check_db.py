import sqlite3, json
DB_PATH = r"c:\Users\geral\.gemini\antigravity\scratch\alphasignal\alphasignal.db"
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("SELECT * FROM portfolio_history ORDER BY timestamp DESC LIMIT 1")
row = c.fetchone()
if row:
    print(f"Timestamp: {row[0]}")
    print(f"Equity: {row[1]}")
    print(f"Drawdown: {row[2]}")
    print(f"Assets: {row[3]}")
else:
    print("No data in portfolio_history")
conn.close()
