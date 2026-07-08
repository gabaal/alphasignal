import sqlite3
from collections import Counter
import urllib.parse

db = sqlite3.connect('backend/alphasignal.db')
db.row_factory = sqlite3.Row
cur = db.cursor()

def clean_referrer(ref):
    if not ref:
        return "(direct/none)"
    try:
        parsed = urllib.parse.urlparse(ref)
        domain = parsed.netloc.lower()
        if not domain:
            domain = ref.lower()
        
        # Group domains
        if 'reddit.com' in domain:
            return 'reddit.com'
        elif 'google.' in domain:
            return 'google.com'
        elif 't.co' in domain or 'twitter.com' in domain or 'x.com' in domain:
            return 'twitter / x.com'
        elif 'ycombinator.com' in domain:
            return 'ycombinator.com'
        elif 'facebook.com' in domain:
            return 'facebook.com'
        elif 'linkedin.com' in domain:
            return 'linkedin.com'
        else:
            return domain
    except:
        return ref

print("=" * 60)
print("ALL-TIME VISITOR SESSIONS SUMMARY")
print("=" * 60)

# Total visitor sessions
cur.execute("SELECT COUNT(*) FROM visitor_sessions")
total_sessions = cur.fetchone()[0]
print(f"Total Visitor Sessions: {total_sessions}")

# Referrer breakdown of all visitor sessions
cur.execute("SELECT referrer FROM visitor_sessions")
sessions = cur.fetchall()
session_refs = [clean_referrer(r['referrer']) for r in sessions]
session_counts = Counter(session_refs)

print("\nVisitor Sessions Referrer Breakdown:")
for ref, count in session_counts.most_common(20):
    pct = (count / total_sessions * 100) if total_sessions > 0 else 0
    print(f"  {count:>5} ({pct:>5.1f}%)  {ref}")

print("\n" + "=" * 60)
print("ALL-TIME SIGNUPS SUMMARY")
print("=" * 60)

# Total signups
cur.execute("SELECT COUNT(*) FROM signups")
total_signups = cur.fetchone()[0]
print(f"Total Signups: {total_signups}")

# Referrer breakdown of all signups
cur.execute("SELECT referrer FROM signups")
signups = cur.fetchall()
signup_refs = [clean_referrer(r['referrer']) for r in signups]
signup_counts = Counter(signup_refs)

print("\nSignups Referrer Breakdown:")
for ref, count in signup_counts.most_common(20):
    pct = (count / total_signups * 100) if total_signups > 0 else 0
    print(f"  {count:>5} ({pct:>5.1f}%)  {ref}")

db.close()
