"""
dedupe_signals.py
-----------------
1. Shows duplicate signal stats before cleanup
2. Deduplicates alerts_history, keeping the best row per duplicate group
   (prefers CLOSED > HIT_TP1 > HIT_SL > ACTIVE, then highest id as tiebreak)
3. Prints win-rate leaderboard by ticker and by signal type from clean data
4. Optionally writes the deduplication to the DB (pass --write to apply)

Duplicate definition:
  Same ticker + same type + timestamp within 60 seconds of each other
  (catches the millisecond bulk-fire bug)

Usage:
  python -m scripts.dedupe_signals           # dry-run, just report
  python -m scripts.dedupe_signals --write   # apply dedup to DB
"""

import sqlite3
import os
import sys
import argparse
from collections import defaultdict
from datetime import datetime, timezone

# Resolve DB path the same way the app does
_here   = os.path.dirname(os.path.abspath(__file__))
_root   = os.path.dirname(_here)
_data   = os.path.join(_root, 'data')
DB_PATH = os.path.join(_data, 'alphasignal.db') if os.path.isdir(_data) \
          else os.path.join(_root, 'backend', 'alphasignal.db')

# State priority for keeping the "best" row in a dupe group
STATE_PRIORITY = {
    'CLOSED':   0,
    'HIT_TP2':  1,
    'HIT_TP1':  2,
    'HIT_SL':   3,
    'EXPIRED':  4,
    'ACTIVE':   5,
}

def parse_ts(ts_str):
    if not ts_str:
        return None
    try:
        return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
    except Exception:
        return None


def load_all_signals(conn):
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT id, ticker, type, timestamp, status, direction,
               price, final_roi, closed_at, exit_price, severity
        FROM alerts_history
        ORDER BY ticker, type, timestamp
    """).fetchall()
    return [dict(r) for r in rows]


def group_duplicates(rows, window_seconds=60):
    """
    Group rows that share (ticker, type) and whose timestamps
    are within window_seconds of each other.
    Returns list of groups; each group is a list of row dicts.
    """
    # Sort by ticker, type, then timestamp
    from itertools import groupby

    def key(r):
        return (r['ticker'] or '', r['type'] or '')

    sorted_rows = sorted(rows, key=key)
    groups = []

    for _, ticker_type_rows in groupby(sorted_rows, key=key):
        bucket = []
        last_ts = None

        for row in sorted(ticker_type_rows, key=lambda r: r['timestamp'] or ''):
            ts = parse_ts(row['timestamp'])
            if last_ts is None or (ts and (ts - last_ts).total_seconds() > window_seconds):
                if bucket:
                    groups.append(bucket)
                bucket = [row]
                last_ts = ts
            else:
                bucket.append(row)
                if ts and ts > last_ts:
                    last_ts = ts

        if bucket:
            groups.append(bucket)

    return groups


def pick_best(group):
    """Pick the row to keep from a duplicate group."""
    def score(r):
        state_score = STATE_PRIORITY.get(r.get('status', 'ACTIVE'), 99)
        # Prefer rows with final_roi populated
        has_roi = 0 if r.get('final_roi') is not None else 1
        # Use highest id as tiebreak (latest write)
        return (state_score, has_roi, -r['id'])

    return min(group, key=score)


def win_rate_table(rows):
    """
    Build win rate stats from clean (deduped) closed signals.
    A win = final_roi > 0
    """
    by_ticker = defaultdict(lambda: {'wins': 0, 'losses': 0, 'total_roi': 0.0, 'count': 0})
    by_type   = defaultdict(lambda: {'wins': 0, 'losses': 0, 'total_roi': 0.0, 'count': 0})

    for r in rows:
        if r['status'] not in ('closed', 'hit_tp2', 'hit_tp1', 'hit_sl', 'expired', 'CLOSED', 'HIT_TP2', 'HIT_TP1', 'HIT_SL', 'EXPIRED'):
            continue
        if r['final_roi'] is None:
            continue

        roi  = float(r['final_roi'])
        tick = r['ticker'] or 'UNKNOWN'
        typ  = r['type']   or 'UNKNOWN'
        win  = roi > 0

        for d in (by_ticker[tick], by_type[typ]):
            d['count']     += 1
            d['total_roi'] += roi
            if win:
                d['wins']   += 1
            else:
                d['losses'] += 1

    return by_ticker, by_type


def fmt_table(data_dict, label, min_signals=1):
    rows = []
    for name, d in data_dict.items():
        if d['count'] < min_signals:
            continue
        wr  = d['wins'] / d['count'] * 100
        avg = d['total_roi'] / d['count']
        rows.append((name, d['count'], d['wins'], d['losses'], wr, avg))

    rows.sort(key=lambda x: -x[4])  # sort by win rate desc

    header = f"\n{'='*70}\n{label}\n{'='*70}"
    header += f"\n{'Ticker/Type':<18} {'Signals':>8} {'Wins':>6} {'Losses':>7} {'Win%':>7} {'Avg ROI':>9}"
    header += f"\n{'-'*70}"
    lines   = [header]
    for r in rows:
        lines.append(f"{r[0]:<18} {r[1]:>8} {r[2]:>6} {r[3]:>7} {r[4]:>6.1f}% {r[5]:>+8.2f}%")
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Deduplicate alerts_history and show win rates')
    parser.add_argument('--write',  action='store_true', help='Apply deduplication to the DB')
    parser.add_argument('--window', type=int, default=60,
                        help='Seconds window to consider signals duplicates (default: 60)')
    parser.add_argument('--db',     default=DB_PATH, help='Path to SQLite DB')
    args = parser.parse_args()

    if not os.path.exists(args.db):
        print(f"ERROR: DB not found at {args.db}")
        sys.exit(1)

    print(f"DB: {args.db}")
    print(f"Duplicate window: {args.window}s\n")

    conn = sqlite3.connect(args.db, timeout=30)

    rows   = load_all_signals(conn)
    groups = group_duplicates(rows, window_seconds=args.window)

    total      = len(rows)
    keep_ids   = set()
    delete_ids = set()
    dupe_count = 0

    for group in groups:
        if len(group) == 1:
            keep_ids.add(group[0]['id'])
        else:
            best = pick_best(group)
            keep_ids.add(best['id'])
            for row in group:
                if row['id'] != best['id']:
                    delete_ids.add(row['id'])
            dupe_count += len(group) - 1

    print(f"Total signals in DB:   {total:,}")
    print(f"Unique signals (clean): {len(keep_ids):,}")
    print(f"Duplicates to remove:  {dupe_count:,}  ({dupe_count/total*100:.1f}%)")

    # Show win rates BEFORE dedup
    print("\n--- Win rates (ALL rows, including dupes) ---")
    by_ticker_all, by_type_all = win_rate_table(rows)
    print(fmt_table(by_ticker_all, "BY TICKER (all rows)", min_signals=1))
    print(fmt_table(by_type_all,   "BY TYPE   (all rows)", min_signals=1))

    # Show win rates AFTER dedup (clean rows only)
    clean_rows = [r for r in rows if r['id'] in keep_ids]
    print("\n--- Win rates (DEDUPED rows only) ---")
    by_ticker_clean, by_type_clean = win_rate_table(clean_rows)
    print(fmt_table(by_ticker_clean, "BY TICKER (deduped, min 1 signal)", min_signals=1))
    print(fmt_table(by_type_clean,   "BY TYPE   (deduped, min 1 signal)", min_signals=1))

    # Apply if --write
    if args.write:
        print(f"\nApplying deduplication: deleting {len(delete_ids):,} rows...")
        chunk_size = 500
        delete_list = list(delete_ids)
        for i in range(0, len(delete_list), chunk_size):
            chunk = delete_list[i:i + chunk_size]
            placeholders = ','.join('?' * len(chunk))
            conn.execute(f"DELETE FROM alerts_history WHERE id IN ({placeholders})", chunk)
        conn.commit()
        print(f"Done. {len(delete_ids):,} duplicate rows removed.")
        print(f"Remaining rows: {conn.execute('SELECT COUNT(*) FROM alerts_history').fetchone()[0]:,}")
    else:
        print(f"\nDRY RUN — no changes made. Run with --write to apply.")

    conn.close()


if __name__ == '__main__':
    main()
