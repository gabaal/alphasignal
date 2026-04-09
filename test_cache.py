import sqlite3, json
import pandas as pd
import io
import numpy as np

conn = sqlite3.connect('backend/alphasignal.db')
row = conn.execute("SELECT key, value FROM cache_store WHERE key LIKE 'dl:%:180d:1d:Close' AND length(key) > 50").fetchone()

if row:
    key, val = row
    print("Found cache key:", key)
    cached = json.loads(val)
    df = pd.read_json(io.StringIO(cached['df']))
    print("DataFrame shape:", df.shape)
    returns_df = df.pct_change().dropna()
    print("Returns shape:", returns_df.shape)
    
    SECTOR_MAP = {
        'L1': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'AVAX-USD', 'XRP-USD'],
        'MINERS': ['MARA', 'RIOT', 'CLSK', 'IREN', 'WULF'],
        'DEFI': ['AAVE-USD', 'LDO-USD', 'MKR-USD', 'UNI-USD'],
        'MEMES': ['DOGE-USD', 'SHIB-USD', 'BONK-USD', 'WIF-USD', 'PEPE-USD'],
        'AI': ['FET-USD', 'RENDER-USD', 'WLD-USD', 'GRT-USD', 'TAO-USD'],
    }
    for s_name, s_tickers in SECTOR_MAP.items():
        valid = [t for t in s_tickers if t in returns_df.columns]
        if len(valid) < 2: continue
        sector_rets = returns_df[valid]
        corr_matrix = sector_rets.corr().values
        n = corr_matrix.shape[0]
        upper = [corr_matrix[i][j] for i in range(n) for j in range(i+1, n)]
        avg_corr = float(np.mean(upper)) if upper else 0.5
        print(f"{s_name} valid={valid} avg_corr={avg_corr}")
else:
    print("No cache found.")
conn.close()
