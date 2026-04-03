import sqlite3
db = r'C:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\alphasignal.db'
conn = sqlite3.connect(db)
c = conn.cursor()
c.execute("SELECT COUNT(*) FROM alerts_history WHERE timestamp > datetime('now', '-48 hours')")
print('alerts_history (last 48h):', c.fetchone()[0])
c.execute("SELECT COUNT(*) FROM ml_predictions WHERE timestamp > datetime('now', '-24 hours')")
print('ml_predictions (last 24h):', c.fetchone()[0])
c.execute("SELECT symbol, predicted_return, confidence FROM ml_predictions WHERE timestamp > datetime('now', '-24 hours') ORDER BY predicted_return DESC LIMIT 5")
print('Top 5 ML predictions:')
for r in c.fetchall(): print(' ', r)
conn.close()
