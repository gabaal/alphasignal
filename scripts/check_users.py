import sqlite3
import datetime

db = sqlite3.connect('backend/alphasignal.db')
db.row_factory = sqlite3.Row
cur = db.cursor()

yesterday = '2026-06-10'
today     = '2026-06-11'

print("=" * 60)
print(f"NEW SIGNUPS on {yesterday}")
print("=" * 60)
cur.execute("""
    SELECT email, referrer, landing_page, created_at
    FROM signups
    WHERE created_at >= ? AND created_at < ?
    ORDER BY created_at DESC
""", (yesterday, today))
rows = cur.fetchall()
print(f"Total: {len(rows)}")
print()
for r in rows:
    print(f"  {r['created_at']}  {r['email']}")
    print(f"    referrer:     {r['referrer'] or '(direct/none)'}")
    print(f"    landing_page: {r['landing_page'] or '-'}")
    print()

print("=" * 60)
print(f"REFERRER BREAKDOWN (signups {yesterday})")
print("=" * 60)
cur.execute("""
    SELECT COALESCE(referrer, '(direct)') as src, COUNT(*) as n
    FROM signups
    WHERE created_at >= ? AND created_at < ?
    GROUP BY src ORDER BY n DESC
""", (yesterday, today))
for r in cur.fetchall():
    print(f"  {r['n']:>3}  {r['src']}")

print()
print("=" * 60)
print(f"VISITOR SESSIONS that converted yesterday")
print("=" * 60)
cur.execute("""
    SELECT email, referrer, landing_page, created_at, converted_at
    FROM visitor_sessions
    WHERE converted_at >= ? AND converted_at < ?
    ORDER BY converted_at DESC
""", (yesterday, today))
sessions = cur.fetchall()
print(f"Total: {len(sessions)}")
for r in sessions:
    print(f"  {r['converted_at']}  {r['email'] or 'anon'}")
    print(f"    referrer:     {r['referrer'] or '(direct/none)'}")
    print(f"    landing:      {r['landing_page'] or '-'}")
    print()

print("=" * 60)
print("SESSION REFERRER BREAKDOWN")
print("=" * 60)
cur.execute("""
    SELECT COALESCE(referrer, '(direct)') as src, COUNT(*) as n
    FROM visitor_sessions
    WHERE converted_at >= ? AND converted_at < ?
    GROUP BY src ORDER BY n DESC
""", (yesterday, today))
for r in cur.fetchall():
    print(f"  {r['n']:>3}  {r['src']}")

db.close()
