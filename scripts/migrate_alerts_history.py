"""
migrate_alerts_history.py
─────────────────────────
One-off backfill: reads every row in alerts_history and populates
signal_events + user_signal_state.

Safe to re-run — uses INSERT OR IGNORE on both tables.

Usage:
    python scripts/migrate_alerts_history.py             # dry-run (no writes)
    python scripts/migrate_alerts_history.py --apply     # write to DB
"""

import sqlite3
import sys
import os

# Resolve DB path using same logic as database.py
data_dir = os.getenv('DATA_DIR', '').rstrip('/')
if data_dir:
    DB_PATH = os.path.join(data_dir, 'alphasignal.db')
else:
    _here = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(_here, '..', 'backend', 'alphasignal.db')

APPLY = '--apply' in sys.argv

print(f"DB: {DB_PATH}")
print(f"Mode: {'APPLY (writing)' if APPLY else 'DRY RUN (read-only)'}")
print()

conn = sqlite3.connect(DB_PATH, timeout=60)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# ── 1. Fetch all alerts_history rows ────────────────────────────────────────
c.execute("""
    SELECT id, type, ticker, message, severity, price, timestamp,
           z_score, alpha, direction, category, mtf_score, mtf_detail,
           btc_correlation, sentiment, status, closed_at, exit_price,
           final_roi, max_roi, tp1_hit, user_email
    FROM alerts_history
    ORDER BY id ASC
""")
rows = c.fetchall()
print(f"alerts_history rows: {len(rows)}")

# ── 2. Group by event fingerprint: (ticker, type, timestamp) ─────────────────
# Within each group, one row becomes the signal_events row (use the MIN id).
# All rows in the group become user_signal_state rows.
from collections import defaultdict

groups = defaultdict(list)
for row in rows:
    # Fingerprint on ticker + type + timestamp (truncated to minute for slight clock skew)
    ts_minute = (row['timestamp'] or '')[:16]
    key = (row['ticker'], row['type'], ts_minute)
    groups[key].append(row)

print(f"Unique signal events (by ticker+type+minute): {len(groups)}")
print(f"Total user_signal_state rows expected:        {len(rows)}")
print()

if not APPLY:
    print("DRY RUN complete. Pass --apply to write changes.")
    conn.close()
    sys.exit(0)

# ── 3. Backfill signal_events (preserve original alerts_history.id) ──────────
se_inserted = 0
uss_inserted = 0
uss_skipped = 0

for key, group_rows in groups.items():
    # Use the first (lowest id) row as the canonical event record
    canonical = min(group_rows, key=lambda r: r['id'])

    try:
        c.execute("""
            INSERT OR IGNORE INTO signal_events
                (id, type, ticker, message, severity, price, timestamp,
                 z_score, alpha, direction, category, mtf_score, mtf_detail,
                 btc_correlation, sentiment)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            canonical['id'],
            canonical['type'],
            canonical['ticker'],
            canonical['message'],
            canonical['severity'],
            canonical['price'],
            canonical['timestamp'],
            canonical['z_score'],
            canonical['alpha'],
            canonical['direction'],
            canonical['category'],
            canonical['mtf_score'],
            canonical['mtf_detail'],
            canonical['btc_correlation'],
            canonical['sentiment'],
        ))
        if c.rowcount:
            se_inserted += 1
        se_id = canonical['id']

        # ── 4. Backfill user_signal_state for every user in this group ────────
        for row in group_rows:
            if not row['user_email']:
                continue
            try:
                c.execute("""
                    INSERT OR IGNORE INTO user_signal_state
                        (signal_id, user_email, status, closed_at, exit_price,
                         final_roi, max_roi, tp1_hit, triggered_at, ah_id)
                    VALUES (?,?,?,?,?,?,?,?,?,?)
                """, (
                    se_id,
                    row['user_email'],
                    row['status'] or 'active',
                    row['closed_at'],
                    row['exit_price'],
                    row['final_roi'],
                    row['max_roi'] or 0.0,
                    row['tp1_hit'] or 0,
                    row['timestamp'],
                    row['id'],     # ah_id cross-reference
                ))
                if c.rowcount:
                    uss_inserted += 1
                else:
                    uss_skipped += 1
            except Exception as e:
                print(f"  [WARN] uss insert failed for row {row['id']}: {e}")

    except Exception as e:
        print(f"  [WARN] se insert failed for key {key}: {e}")

conn.commit()
conn.close()

print(f"signal_events inserted:      {se_inserted}")
print(f"user_signal_state inserted:  {uss_inserted}")
print(f"user_signal_state skipped:   {uss_skipped}  (already existed)")
print()
print("Migration complete.")
