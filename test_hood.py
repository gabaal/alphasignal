import pandas as pd
import yfinance as yf
import numpy as np

raw = yf.download("HOOD", period='60d', interval='1d', progress=False)
data = raw
if isinstance(raw.columns, pd.MultiIndex):
    data = raw.xs("Close", axis=1, level=0)
elif "Close" in raw.columns:
    data = raw["Close"]
    
print("Type of data:", type(data))
print("Columns of data:", getattr(data, 'columns', None))

sq = data.squeeze()
print("Type of sq:", type(sq))
print("sq.values shape:", sq.values.shape)
try:
    prices = pd.Series([float(p) for p in sq.values], index=sq.index)
except Exception as e:
    print("Error doing float(p):", repr(e))
    
print("std_val = sq.pct_change().dropna().std()")
returns = sq.pct_change().dropna()
std_val = returns.std()
print("Type of std_val:", type(std_val))
try:
    z = (returns.iloc[-1] - returns.mean()) / std_val
    print("Type of z:", type(z))
    float(z)
except Exception as e:
    print("Error doing float(z):", repr(e))
