import pandas as pd
import yfinance as yf
import numpy as np

SECTOR_MAP = {
    'L1': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'AVAX-USD', 'XRP-USD'],
    'MINERS': ['MARA', 'RIOT', 'CLSK', 'IREN', 'WULF'],
    'DEFI': ['AAVE-USD', 'LDO-USD', 'MKR-USD', 'UNI-USD'],
    'MEMES': ['DOGE-USD', 'SHIB-USD', 'BONK-USD', 'WIF-USD', 'PEPE-USD'],
    'AI': ['FET-USD', 'RENDER-USD', 'WLD-USD', 'GRT-USD', 'TAO-USD'],
}
all_tickers = list(set([t for sub in SECTOR_MAP.values() for t in sub]))

print("Fetching data...")
raw = yf.download(all_tickers, period='180d', interval='1d', progress=False)
data = raw['Close'] if 'Close' in raw.columns else raw
returns_df = data.pct_change().dropna()

print(f"Data shape: {returns_df.shape}")

for sector_name, sector_tickers in SECTOR_MAP.items():
    valid = [t for t in sector_tickers if t in returns_df.columns]
    if len(valid) < 2:
        print(f"{sector_name}: skipped")
        continue
    sector_rets = returns_df[valid]
    corr_matrix = sector_rets.corr().values
    n = corr_matrix.shape[0]
    upper = [corr_matrix[i][j] for i in range(n) for j in range(i+1, n)]
    avg_corr = float(np.mean(upper)) if upper else 0.5
    print(f"{sector_name}: avg_corr = {avg_corr}")
    
