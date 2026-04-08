import sqlite3, random
from datetime import datetime, timedelta, timezone

DB_PATH = "alphasignal.db"
USER_EMAIL = "geraldbaalham@live.co.uk"
now = datetime.now(timezone.utc)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Run all migrations first
for col, typedef in [
    ("price", "REAL"), ("z_score", "REAL"), ("alpha", "REAL"),
    ("direction", "TEXT"), ("category", "TEXT"), ("btc_correlation", "REAL"),
    ("sentiment", "REAL"), ("status", "TEXT DEFAULT active"),
    ("closed_at", "TEXT"), ("exit_price", "REAL"),
    ("final_roi", "REAL"), ("user_email", "TEXT"),
]:
    try:
        c.execute("ALTER TABLE alerts_history ADD COLUMN " + col + " " + typedef)
    except Exception:
        pass

conn.commit()

SIGNALS = [
    ("ML_ALPHA_PREDICTION","BTC-USD","L1","LONG","CRITICAL",71200.00,28,"closed",12.4),
    ("RSI_OVERSOLD","ETH-USD","L1","LONG","HIGH",3210.50,26,"closed",8.7),
    ("MACD_BULLISH_CROSS","SOL-USD","L1","LONG","HIGH",142.30,24,"closed",-3.0),
    ("VOLUME_SPIKE","DOGE-USD","MEMES","NEUTRAL","MEDIUM",0.182,22,"closed",5.2),
    ("ML_ALPHA_PREDICTION","NVDA","EQUITIES","LONG","HIGH",875.40,21,"closed",11.1),
    ("RSI_OVERBOUGHT","PEPE-USD","MEMES","SHORT","MEDIUM",0.000012,20,"closed",-3.0),
    ("MACD_BEARISH_CROSS","ADA-USD","L1","SHORT","MEDIUM",0.6210,19,"closed",6.3),
    ("ML_ALPHA_PREDICTION","SOL-USD","L1","LONG","CRITICAL",155.80,18,"closed",10.5),
    ("RSI_OVERSOLD","AVAX-USD","L1","LONG","HIGH",31.20,17,"closed",-3.0),
    ("VOLUME_SPIKE","WULF","MINERS","NEUTRAL","MEDIUM",16.40,16,"closed",7.8),
    ("ML_ALPHA_PREDICTION","XRP-USD","L1","LONG","HIGH",0.582,15,"closed",9.2),
    ("MACD_BULLISH_CROSS","BNB-USD","L1","LONG","HIGH",412.50,14,"closed",5.5),
    ("RSI_OVERSOLD","RIOT","MINERS","LONG","HIGH",13.80,13,"closed",-3.0),
    ("ML_ALPHA_PREDICTION","AAVE-USD","DEFI","LONG","MEDIUM",88.40,12,"closed",10.1),
    ("VOLUME_SPIKE","ETH-USD","L1","NEUTRAL","HIGH",3150.00,11,"closed",6.7),
    ("RSI_OVERBOUGHT","SOL-USD","L1","SHORT","MEDIUM",187.20,10,"closed",4.3),
    ("ML_ALPHA_PREDICTION","MSTR","PROXY","LONG","CRITICAL",1620.00,9,"closed",15.2),
    ("MACD_BULLISH_CROSS","LINK-USD","AI","LONG","HIGH",14.30,8,"closed",-3.0),
    ("RSI_OVERSOLD","BTC-USD","L1","LONG","HIGH",68400.00,7,"closed",10.8),
    ("VOLUME_SPIKE","DOGE-USD","MEMES","NEUTRAL","MEDIUM",0.165,6,"closed",5.1),
    ("ML_ALPHA_PREDICTION","ETH-USD","L1","LONG","CRITICAL",3310.00,5,None,None),
    ("RSI_OVERSOLD","SOL-USD","L1","LONG","HIGH",118.40,4,None,None),
    ("MACD_BULLISH_CROSS","AVAX-USD","L1","LONG","MEDIUM",29.80,4,None,None),
    ("ML_ALPHA_PREDICTION","XRP-USD","L1","LONG","HIGH",0.541,3,None,None),
    ("VOLUME_SPIKE","RIOT","MINERS","NEUTRAL","MEDIUM",14.10,3,None,None),
    ("RSI_OVERSOLD","AAVE-USD","DEFI","LONG","HIGH",81.20,2,None,None),
    ("MACD_BULLISH_CROSS","BTC-USD","L1","LONG","CRITICAL",76800.00,2,None,None),
    ("ML_ALPHA_PREDICTION","NVDA","EQUITIES","LONG","HIGH",892.50,1,None,None),
    ("RSI_OVERBOUGHT","PEPE-USD","MEMES","SHORT","MEDIUM",0.000015,1,None,None),
    ("VOLUME_SPIKE","WIF-USD","MEMES","NEUTRAL","HIGH",2.38,0,None,None),
]

inserted = 0
for (sig_type, ticker, category, direction, severity, entry_price, days_ago, status, exit_pct) in SIGNALS:
    ts = (now - timedelta(days=days_ago, hours=random.randint(0,14), minutes=random.randint(0,59))).strftime("%Y-%m-%d %H:%M:%S")
    msg = sig_type.replace("_"," ") + " signal detected on " + ticker
    alpha = round(random.uniform(0.9, 3.2), 2)
    z_score = round(random.uniform(1.8, 3.8), 2)
    btc_corr = round(random.uniform(0.55, 0.95), 2)
    sentiment = round(random.uniform(0.45, 0.92), 2)
    closed_at = exit_price_val = final_roi = None
    db_status = "active"
    if status == "closed" and exit_pct is not None:
        exit_price_val = round(entry_price * (1 + exit_pct/100), 4) if direction != "SHORT" else round(entry_price * (1 - exit_pct/100), 4)
        final_roi = round(exit_pct, 2)
        closed_at = (now - timedelta(days=max(0, days_ago - random.randint(1,4)))).strftime("%Y-%m-%d %H:%M:%S")
        db_status = "closed"
    c.execute(
        "INSERT INTO alerts_history (type,ticker,message,severity,price,timestamp,z_score,alpha,direction,category,btc_correlation,sentiment,status,closed_at,exit_price,final_roi,user_email) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (sig_type,ticker,msg,severity,entry_price,ts,z_score,alpha,direction,category,btc_corr,sentiment,db_status,closed_at,exit_price_val,final_roi,USER_EMAIL)
    )
    inserted += 1

conn.commit()
# verify
count = conn.execute("SELECT COUNT(id) FROM alerts_history WHERE user_email=?", (USER_EMAIL,)).fetchone()[0]
conn.close()
print("Inserted " + str(inserted) + " signals. Total for user: " + str(count))
