import sqlite3
import pandas as pd
from backend.services import ML_ENGINE, HarvestService, DB_PATH
from backend.database import UNIVERSE
import time

try:
    print("Starting ML_ENGINE.train_all()")
    ML_ENGINE.train_all()
    print("Finished ML_ENGINE.train_all()")
    
    # Run the exact prediction block that HarvestService uses
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT ticker FROM tracked_tickers")
    tracked = [r[0] for r in c.fetchall()]
    conn.close()
    
    all_tickers = list(set([t for sub in UNIVERSE.values() for t in sub] + tracked))
    # Pick a few tickers for safety
    all_tickers = all_tickers[:10]
    if 'NVDA' not in all_tickers: all_tickers.append('NVDA')
    
    h = HarvestService()
    # Mock self.running so the loop breaks after 1 iter
    h.running = False
    
    # We will just manually run the Harvest loop logic for ONE iteration
    data = h.cache.download(all_tickers, period='60d', interval='1d')
    print("Downloaded data type:", type(data))
    if data is not None:
        print("Columns type:", type(data.columns))
        print("Columns first:", data.columns[0] if len(data.columns)>0 else "None")

    if isinstance(data.columns, pd.MultiIndex):
        all_tickers = data.columns.get_level_values(1).unique()
    else:
        all_tickers = [data.name] if hasattr(data, 'name') else []
        
    for ticker in all_tickers:
        print(f"Processing {ticker}...")
        try:
            if isinstance(data.columns, pd.MultiIndex):
                hist_df = data.xs(ticker, axis=1, level=1).dropna()
            else:
                hist_df = data.dropna()
                
            if len(hist_df) < 30: 
                print(f"{ticker} not enough data ({len(hist_df)})")
                continue
            
            prediction = ML_ENGINE.predict(ticker, hist_df)
            if not prediction: 
                print(f"{ticker} prediction NONE")
                continue
                
            print(f"{ticker} PREDICTION = {prediction['predicted_return']}")
            
        except Exception as e:
            print(f"Exception on {ticker}: {e}")

except Exception as e:
    import traceback
    traceback.print_exc()
