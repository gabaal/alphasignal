import sys, os
sys.path.insert(0, ".")
from backend.database import DB_PATH
import sqlite3

conn = sqlite3.connect(DB_PATH)
# Check what emails exist in user_settings (these come from real Supabase auth)
print("Emails in user_settings:")
for row in conn.execute("SELECT user_email, alerts_enabled FROM user_settings").fetchall():
    print(" repr:", repr(row[0]))

# Check what emails exist in alerts_history
print("\nEmails in alerts_history:")
for row in conn.execute("SELECT DISTINCT user_email FROM alerts_history").fetchall():
    print(" repr:", repr(row[0]))
conn.close()
