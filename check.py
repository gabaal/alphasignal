import sqlite3
import yfinance as yf
import pandas as pd

conn = sqlite3.connect('backend/alphasignal.db', timeout=30)
c = conn.cursor()
c.execute("""SELECT symbol, predicted_return, confidence
                         FROM ml_predictions
                         WHERE timestamp > datetime('now', '-24 hours')
                         ORDER BY predicted_return DESC LIMIT 15""")
preds = c.fetchall()
print('ML Preds:', preds)

if not preds:
    c.execute("""SELECT ticker, 0.03, 0.7 FROM alerts_history
                 WHERE timestamp > datetime('now', '-48 hours')
                 GROUP BY ticker ORDER BY COUNT(*) DESC LIMIT 10""")
    preds = c.fetchall()
    print('Fallback Preds:', preds)

import warnings
warnings.filterwarnings('ignore')

for tk in [p[0] for p in preds]:
    df = yf.download(tk, period='90d', interval='1d', progress=False)
    print(tk, len(df))
    if df.empty:
        print(f'{tk} is empty')
    else:
        if isinstance(df.columns, pd.MultiIndex):
            print(f'MultiIndex')
        else:
            print(f'SingleIndex')
