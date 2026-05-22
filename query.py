import sqlite3
c = sqlite3.connect('backend/alphasignal.db').cursor()
for row in c.execute("SELECT gate, reason, count(*) FROM signal_suppression_log WHERE direction='SHORT' GROUP BY gate, reason ORDER BY count(*) DESC LIMIT 20"):
    print(row)
