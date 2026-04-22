import sqlite3

STABLES = (
    'USDC-USD','USDT-USD','DAI-USD','BUSD-USD','TUSD-USD',
    'FRAX-USD','LUSD-USD','USDP-USD','GUSD-USD','PYUSD-USD',
    'USDE-USD','FDUSD-USD','EURC-USD','USDS-USD',
)
RESET_TYPES = ('RSI_OVERBOUGHT','MACD_BULLISH_CROSS','MACD_BEARISH_CROSS','VOLUME_SPIKE')
PRESERVE    = ('RSI_OVERSOLD','ML_ALPHA_PREDICTION','ML_LONG','ML_SHORT')

def counts(c):
    c.execute("""
        SELECT type,
               COUNT(*) as total,
               SUM(CASE WHEN COALESCE(status,'active')='closed' THEN 1 ELSE 0 END) as closed,
               SUM(CASE WHEN COALESCE(status,'active')='closed' AND COALESCE(final_roi,0)>0 THEN 1 ELSE 0 END) as wins,
               SUM(CASE WHEN COALESCE(status,'active')='closed' AND COALESCE(final_roi,0)<0 THEN 1 ELSE 0 END) as losses
        FROM alerts_history GROUP BY type ORDER BY total DESC
    """)
    print(f"{'TYPE':<40} {'TOTAL':>6} {'CLOSED':>7} {'WINS':>5} {'LOSSES':>7}")
    print('-'*67)
    for row in c.fetchall():
        print(f"{str(row[0]):<40} {row[1]:>6} {row[2]:>7} {row[3]:>5} {row[4]:>7}")

conn = sqlite3.connect('alphasignal.db', timeout=30)
c = conn.cursor()

c.execute('SELECT COUNT(*) FROM alerts_history')
total_before = c.fetchone()[0]

# Count what will be deleted
stable_ph = ','.join('?' * len(STABLES))
c.execute(f'SELECT COUNT(*) FROM alerts_history WHERE ticker IN ({stable_ph})', STABLES)
stable_count = c.fetchone()[0]

type_ph = ','.join('?' * len(RESET_TYPES))
c.execute(f"SELECT COUNT(*) FROM alerts_history WHERE type IN ({type_ph}) AND COALESCE(status,'active')='closed'", RESET_TYPES)
closed_count = c.fetchone()[0]

print('=== BEFORE CLEANUP ===')
counts(c)
print()
print(f'  Total rows:                 {total_before}')
print(f'  Stablecoin signals:         {stable_count}  <- will DELETE')
print(f'  Regime-blind closed signals:{closed_count}  <- will DELETE (RSI_OB, MACD, VOL_SPIKE)')
print()

# --- Run the deletes ---
c.execute(f'DELETE FROM alerts_history WHERE ticker IN ({stable_ph})', STABLES)
deleted_stable = c.rowcount

c.execute(f"DELETE FROM alerts_history WHERE type IN ({type_ph}) AND COALESCE(status,'active')='closed'", RESET_TYPES)
deleted_closed = c.rowcount

conn.commit()

c.execute('SELECT COUNT(*) FROM alerts_history')
total_after = c.fetchone()[0]

print('=== AFTER CLEANUP ===')
counts(c)
print()
print(f'  Stablecoin rows deleted:    {deleted_stable}')
print(f'  Closed bad-signal rows del: {deleted_closed}')
print(f'  Total removed:              {deleted_stable + deleted_closed}')
print(f'  Rows remaining:             {total_after}')
print()
print('Done. Restart server to clear the signal history cache.')
conn.close()
