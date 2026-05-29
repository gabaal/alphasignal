import sqlite3
c = sqlite3.connect('backend/alphasignal.db')
c.execute("DELETE FROM alerts_history WHERE user_email = 'geraldbaalham@live.co.uk'")
c.commit()
print("Deleted locally.")
