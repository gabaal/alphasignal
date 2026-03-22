import pandas as pd
import yfinance as yf
import numpy as np
import io

# Mocking the CACHE.download logic
def mock_download(tickers, period='60d'):
    print(f"Downloading {tickers} for {period}...")
    try:
        raw = yf.download(tickers, period=period, interval='1d', progress=False)
        if raw.empty:
            print(f"No data for {tickers}")
            return None
        return raw['Close']
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    tickers = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'MARA', 'COIN']
    period = '60d'
    
    data = pd.DataFrame()
    for t in tickers:
        p = mock_download(t, period=period)
        if p is not None:
            if isinstance(p, pd.DataFrame):
                p = p.iloc[:, 0]
            data[t] = p
    
    print("\nData Head:")
    print(data.head())
    print("\nData Tail:")
    print(data.tail())
    print("\nMissing Values before ffill:")
    print(data.isna().sum())
    
    # NEW: ffill to handle weekends/holidays
    data = data.ffill()
    
    rets = data.pct_change()
    print("\nReturns Head (after ffill):")
    print(rets.head(10))
    
    corr_matrix = rets.corr(min_periods=10).fillna(0)
    print("\nCorrelation Matrix:")
    print(corr_matrix)
