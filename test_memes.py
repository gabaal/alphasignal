import pandas as pd
import numpy as np

SECTOR_MAP = {
    'MEMES': ['DOGE-USD', 'SHIB-USD', 'BONK-USD', 'WIF-USD', 'PEPE-USD'],
    'AI': ['FET-USD', 'RENDER-USD', 'WLD-USD', 'GRT-USD', 'TAO-USD'],
}

import sqlite3, json, io
conn = sqlite3.connect('backend/alphasignal.db')
# get the newest cache
row = conn.execute("SELECT value FROM cache_store WHERE key LIKE 'dl:%:180d:1d:Close' AND length(key) > 50").fetchone()
if not row:
    print("No cache")
else:
    cached = json.loads(row[0])
    df = pd.read_json(io.StringIO(cached['df']))
    returns_df = df.pct_change()
    
    for s_name, s_tickers in SECTOR_MAP.items():
        valid = [t for t in s_tickers if t in returns_df.columns]
        print(f"\n{s_name} Valid:", valid)
        sector_rets = returns_df[valid]
        print("Head:")
        print(sector_rets.head())
        corr_matrix = sector_rets.corr().values
        print("Corr Matrix:")
        print(corr_matrix)
        
        n = corr_matrix.shape[0]
        upper = [corr_matrix[i][j] for i in range(n) for j in range(i+1, n)]
        print("Upper:", upper)
        avg_corr = float(np.mean(upper)) if upper else 0.5
        print(f"AVG CORR for {s_name}: {avg_corr}")
    
