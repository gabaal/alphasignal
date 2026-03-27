import os, sys
sys.path.append(os.getcwd())
from backend.caching import CACHE
from backend.routes.institutional import InstitutionalRoutesMixin
import pandas as pd

class Dummy(InstitutionalRoutesMixin):
    pass

dummy = Dummy()
assets = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'LINK-USD', 'ADA-USD']

for ticker in assets:
    print(f"Testing {ticker}...")
    df = CACHE.download(ticker, period='60d', interval='1d')
    if df is None or df.empty:
        print(f"  FAILED: df is empty/None")
        continue
    
    print(f"  Got DF columns: {df.columns.tolist()!r}")
    
    closes = dummy._get_price_series(df, ticker)
    if closes is None:
        print(f"  FAILED: closes is None")
        continue
    
    print(f"  closes len: {len(closes)}")
    
    closes = closes.squeeze()
    if isinstance(closes, pd.DataFrame): 
        closes = closes.iloc[:,0]
        
    try:
        returns = closes.pct_change().dropna()
        print(f"  returns len: {len(returns)}")
    except Exception as e:
        print(f"  EXCEPTION during pct_change: {e}")
