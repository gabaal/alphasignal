import os
import sys
import pandas as pd
import yfinance as yf
import math

# Add current dir to path
sys.path.append(os.getcwd())

assets = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'LINK-USD', 'ADA-USD']
stats = []

for ticker in assets:
    print(f"Downloading {ticker}...")
    try:
        df = yf.download(ticker, period='60d', interval='1d', progress=False)
        if df.empty:
            print(f"FAILED: {ticker} is empty")
            continue
        print(f"SUCCESS: {ticker} shape={df.shape}")
        
        # Handle MultiIndex if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [c[0] for c in df.columns]
            
        closes = df['Close'].squeeze()
        if isinstance(closes, pd.DataFrame):
            closes = closes.iloc[:,0]
            
        returns = closes.pct_change().dropna()
        volatility = returns.std() * math.sqrt(365)
        momentum = float(closes.iloc[-1] / closes.iloc[0] - 1)
        
        print(f"  Vol: {volatility:.4f}, Mom: {momentum:.4f}")
    except Exception as e:
        print(f"  ERROR {ticker}: {e}")

print("Done.")
