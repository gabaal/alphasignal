import sqlite3
conn = sqlite3.connect('../alphasignal.db')
cur = conn.cursor()
try:
    cur.execute('ALTER TABLE user_settings ADD COLUMN algo_rsi_oversold REAL DEFAULT 30.0')
except:
    pass
try:
    cur.execute('ALTER TABLE user_settings ADD COLUMN algo_rsi_overbought REAL DEFAULT 80.0')
except:
    pass
conn.commit()
conn.close()
