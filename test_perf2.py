import sys, os
sys.path.append(os.getcwd())
from backend.caching import CACHE
import sqlite3

conn = sqlite3.connect('backend/alphasignal.db')
c = conn.cursor()
c.execute('SELECT DISTINCT ticker FROM alerts_history WHERE price IS NOT NULL AND price > 0')
unique_tickers = [r[0] for r in c.fetchall()]
conn.close()

batch_data = CACHE.download(unique_tickers, period='1d', interval='1m', column='Close')
current_prices = {}
if batch_data is not None and not batch_data.empty:
    for ticker in unique_tickers:
        try:
            series = batch_data[ticker] if len(unique_tickers) > 1 else batch_data
            val = series.dropna().iloc[-1]
            current_prices[ticker] = float(val.iloc[0] if hasattr(val, 'iloc') else val)
        except Exception as e:
            print(f"Error for {ticker}: {e}")

print("Current Prices:", list(current_prices.items())[:5])
print("Len current prices:", len(current_prices))
