"""
Backfill regime labels on predictor_accuracy rows that have regime = 'Unknown'.

Strategy:
  1. For each Unknown row, find the closest composite_index_history tick
     by timestamp and use its regime (if not 'Unknown').
  2. Any rows that can't be matched (no CI history near that time) fall back
     to the current HMM engine label.
"""

import os, sys, sqlite3

# ── resolve DB path the same way the backend does ────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE, 'backend', 'alphasignal.db')

# ── get current HMM label as ultimate fallback ────────────────────────────────
hmm_label = 'Dislocation'   # default — already confirmed from the dashboard
try:
    sys.path.insert(0, BASE)
    from backend.routes.regime_hmm import HMM_ENGINE
    res = HMM_ENGINE.predict_regime('BTC-USD')
    if res.get('current_label') and not res.get('training'):
        hmm_label = res['current_label']
        print(f"HMM engine current label: {hmm_label}")
    else:
        print(f"HMM engine still warming up — using fallback: {hmm_label}")
except Exception as e:
    print(f"HMM engine unavailable ({e}) — using fallback: {hmm_label}")

# ── connect and backfill ──────────────────────────────────────────────────────
conn = sqlite3.connect(DB_PATH, timeout=30)
conn.row_factory = sqlite3.Row
c = conn.cursor()

# Fetch all Unknown predictions
c.execute("""
    SELECT id, predicted_at FROM predictor_accuracy
    WHERE regime IS NULL OR regime = '' OR regime = 'Unknown'
    ORDER BY predicted_at
""")
rows = c.fetchall()
print(f"\nFound {len(rows)} rows to backfill.")

if not rows:
    print("Nothing to do.")
    conn.close()
    sys.exit(0)

updated = 0
used_ci  = 0
used_hmm = 0

for row in rows:
    pred_id   = row['id']
    pred_time = row['predicted_at']   # ISO string

    # Find the closest CI tick within ±90 minutes
    c.execute("""
        SELECT regime,
               ABS(strftime('%s', ts) - strftime('%s', ?)) AS diff_secs
        FROM composite_index_history
        WHERE regime IS NOT NULL
          AND regime != ''
          AND regime != 'Unknown'
          AND ABS(strftime('%s', ts) - strftime('%s', ?)) < 5400
        ORDER BY diff_secs ASC
        LIMIT 1
    """, (pred_time, pred_time))
    ci_row = c.fetchone()

    if ci_row:
        regime = ci_row['regime']
        used_ci += 1
    else:
        regime = hmm_label
        used_hmm += 1

    c.execute(
        "UPDATE predictor_accuracy SET regime = ? WHERE id = ?",
        (regime, pred_id)
    )
    updated += 1

conn.commit()
conn.close()

print(f"\nBackfill complete:")
print(f"  {updated} rows updated")
print(f"  {used_ci} matched from composite_index_history")
print(f"  {used_hmm} fell back to HMM label '{hmm_label}'")
