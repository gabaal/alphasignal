import sys
import os
sys.path.append(os.getcwd())
from backend.caching import CACHE
import sqlite3

conn = sqlite3.connect('backend/alphasignal.db')
c = conn.cursor()
c.execute('SELECT DISTINCT ticker FROM alerts_history WHERE price IS NOT NULL AND price > 0')
unique_tickers = [r[0] for r in c.fetchall()]
conn.close()

print(f"Fetching {len(unique_tickers)} tickers...")
batch_data = CACHE.download(unique_tickers, period='1d', interval='1m', column='Close')
if batch_data is None:
    print("batch_data is None")
elif batch_data.empty:
    print("batch_data is empty")
else:
    print(f"Shape: {batch_data.shape}")
    print("Columns:", batch_data.columns.tolist()[:10])
