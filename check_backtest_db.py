#!/usr/bin/env python3
import sqlite3, os, sys

# Find the DB
DB_PATH = None
for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.db'):
            DB_PATH = os.path.join(root, f)
            print(f'Found DB: {DB_PATH}')
            break
    if DB_PATH:
        break

if not DB_PATH:
    print('No .db file found!')
    sys.exit(1)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# List all tables
c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in c.fetchall()]
print(f'\nTables: {tables}')

# Check alerts_history
if 'alerts_history' in tables:
    c.execute("SELECT COUNT(*) FROM alerts_history")
    total = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM alerts_history WHERE price > 0")
    with_price = c.fetchone()[0]
    print(f'\nalerts_history: {total} total rows, {with_price} with price > 0')

    c.execute("SELECT ticker, type, price, timestamp FROM alerts_history WHERE price > 0 ORDER BY timestamp DESC LIMIT 10")
    rows = c.fetchall()
    print('Recent rows:')
    for r in rows:
        print(f'  {str(r[0]):15s} | {str(r[1]):30s} | {float(r[2]):.4f} | {r[3]}')

    c.execute("SELECT MIN(timestamp), MAX(timestamp) FROM alerts_history WHERE price > 0")
    dr = c.fetchone()
    print(f'Date range: {dr[0]} -> {dr[1]}')

    c.execute("SELECT DISTINCT ticker FROM alerts_history WHERE price > 0")
    tickers = [r[0] for r in c.fetchall()]
    print(f'Tickers ({len(tickers)}): {tickers}')
else:
    print('\nNO alerts_history table found!')
    
    # Check what's available
    for t in tables:
        c.execute(f"SELECT COUNT(*) FROM '{t}'")
        cnt = c.fetchone()[0]
        print(f'  {t}: {cnt} rows')

conn.close()
print('\nDone.')
