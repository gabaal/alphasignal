import sqlite3
import pandas as pd
import numpy as np
import time

def fetch_data():
    conn = sqlite3.connect('backend/alphasignal.db')
    data = pd.read_sql("SELECT ticker, timestamp, close_price FROM ohlc_data", conn)
    conn.close()
    
    if data.empty:
        print("No OHLC data found!")
        return
        
    data['timestamp'] = pd.to_datetime(data['timestamp'])
    
    pivot = data.pivot_table(index='timestamp', columns='ticker', values='close_price').sort_index()
    returns_df = pivot.pct_change().dropna()
    print("Returns DF Shape:", returns_df.shape)
    
    SECTOR_MAP = {
        'L1': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'AVAX-USD', 'XRP-USD'],
        'MINERS': ['MARA', 'RIOT', 'CLSK', 'IREN', 'WULF'],
        'DEFI': ['AAVE-USD', 'LDO-USD', 'MKR-USD', 'UNI-USD'],
        'MEMES': ['DOGE-USD', 'SHIB-USD', 'BONK-USD', 'WIF-USD', 'PEPE-USD'],
        'AI': ['FET-USD', 'RENDER-USD', 'WLD-USD', 'GRT-USD', 'TAO-USD'],
    }
    
    for sector_name, sector_tickers in SECTOR_MAP.items():
        valid = [t for t in sector_tickers if t in returns_df.columns]
        if len(valid) < 2:
            print(f"{sector_name}: Not enough valid tickers ({len(valid)})")
            continue
            
        sector_rets = returns_df[valid]
        corr_matrix = sector_rets.corr().values
        
        n = corr_matrix.shape[0]
        upper = [corr_matrix[i][j] for i in range(n) for j in range(i+1, n)]
        
        avg_corr = float(np.nanmean(upper)) if upper else 0.5
        print(f"Sector {sector_name}: Valid={valid}")
        print(f"  Upper triangle: {upper}")
        print(f"  Avg Corr: {avg_corr}")

fetch_data()
