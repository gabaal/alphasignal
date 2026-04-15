import sqlite3, yfinance as yf
from backend.services import MLAlphaEngine
engine = MLAlphaEngine()
engine.train_all()

ticker = 'NVDA'
try:
    hist_df = yf.download(ticker, period='30d', interval='1d', progress=False)
    if not hist_df.empty:
        if isinstance(hist_df.columns, pd.MultiIndex):
            hist_df.columns = [c[0] for c in hist_df.columns]
        pred = engine.predict(ticker, hist_df)
        print(f"[{ticker}] LIVE PREDICTION TODAY: {pred}")
except Exception as e:
    import traceback
    traceback.print_exc()

ticker = 'WULF'
try:
    hist_df = yf.download(ticker, period='30d', interval='1d', progress=False)
    if not hist_df.empty:
        if isinstance(hist_df.columns, pd.MultiIndex):
            hist_df.columns = [c[0] for c in hist_df.columns]
        pred = engine.predict(ticker, hist_df)
        print(f"[{ticker}] LIVE PREDICTION TODAY: {pred}")
except Exception as e:
    import traceback
    traceback.print_exc()

# Let's ALSO see if there are any errors parsing the database.
conn = sqlite3.connect(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\alphasignal.db')
c = conn.cursor()
c.execute("SELECT MIN(z_threshold) FROM user_settings WHERE alerts_enabled = 1")
print("MIN Z: ", c.fetchone()[0])
