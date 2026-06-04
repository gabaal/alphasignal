import os, sys, json, requests
sys.path.insert(0, '.')

with open('.env') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

EMAIL = "muq-raker@pm.me"
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']   # anon/service key

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# ── 1. List all public tables via information_schema RPC ─────────────────────
print("=== ALL PUBLIC TABLES ===")
r = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/get_all_tables",
    headers=headers,
    json={}
)
if r.status_code != 200:
    # Fallback: just try known table names
    tables = ['users', 'profiles', 'subscriptions', 'user_settings',
              'page_views', 'sessions', 'user_events', 'activity_log',
              'analytics', 'watchlist', 'tracked_tickers']
    print(f"RPC not available ({r.status_code}), trying known tables: {tables}")
else:
    tables = [t['table_name'] for t in r.json()]
    print(f"Tables: {tables}")

# ── 2. Check subscriptions table for this user ───────────────────────────────
print("\n=== SUBSCRIPTIONS ===")
r = requests.get(
    f"{SUPABASE_URL}/rest/v1/subscriptions",
    headers=headers,
    params={"email": f"eq.{EMAIL}", "limit": 10}
)
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    if data:
        print(json.dumps(data, indent=2, default=str))
        user_id = data[0].get('user_id')
    else:
        print("No rows by email — trying user_id lookup...")
        user_id = None
else:
    print(r.text[:300])
    user_id = None

# ── 3. user_settings ─────────────────────────────────────────────────────────
print("\n=== USER_SETTINGS ===")
r = requests.get(
    f"{SUPABASE_URL}/rest/v1/user_settings",
    headers=headers,
    params={"email": f"eq.{EMAIL}", "limit": 10}
)
print(f"Status: {r.status_code}")
if r.status_code == 200 and r.json():
    data = r.json()
    print(json.dumps(data, indent=2, default=str))
    if not user_id:
        user_id = data[0].get('user_id')
else:
    print(r.text[:300] if r.status_code != 200 else "No rows")

# ── 4. If we have user_id, try all tables ────────────────────────────────────
if user_id:
    print(f"\n=== USER_ID = {user_id} ===")
    for table in tables:
        try:
            r = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}",
                headers={**headers, "Prefer": "count=exact"},
                params={"user_id": f"eq.{user_id}", "limit": 100}
            )
            if r.status_code == 200 and r.json():
                print(f"\n[{table}] ({len(r.json())} rows):")
                print(json.dumps(r.json()[:5], indent=2, default=str))
        except:
            pass
else:
    print("\nNo user_id found. Checking server logs instead...")
    # Parse server log for email activity
    import subprocess
    result = subprocess.run(
        ['python', '-c', f'''
import sqlite3
db = sqlite3.connect("backend/alphasignal.db")
rows = db.execute("SELECT * FROM user_settings WHERE email LIKE ?", ("%muq-raker%",)).fetchall()
print("user_settings:", rows)
rows = db.execute("SELECT * FROM tracked_tickers WHERE user_email LIKE ?", ("%muq-raker%",)).fetchall()
print("tracked_tickers:", rows)
'''],
        capture_output=True, text=True, cwd='.'
    )
    print(result.stdout)
    print(result.stderr)
