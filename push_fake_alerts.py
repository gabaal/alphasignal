import sqlite3
import json
import time
from datetime import datetime
from backend.services import NOTIFY
from backend.database import DB_PATH

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Get the target user email
c.execute("SELECT user_email FROM user_settings WHERE alerts_enabled = 1 AND user_email IS NOT NULL")
users = [r[0] for r in c.fetchall()]

if not users:
    print("No users with alerts enabled found!")
    users = ['geraldbaalham@live.co.uk']  # default fallback

fake_signals = [
    {
        "ticker": "BTC-USD",
        "direction": "LONG",
        "pred_return": 0.045,
        "price": 82145.50,
        "category": "CRYPTO",
        "driver": "INSTITUTIONAL_FLOW",
        "confidence": 0.92
    },
    {
        "ticker": "NVDA",
        "direction": "SHORT",
        "pred_return": -0.021,
        "price": 195.40,
        "category": "EQUITIES",
        "driver": "RSI_OVERBOUGHT",
        "confidence": 0.85
    },
    {
        "ticker": "TSLA",
        "direction": "LONG",
        "pred_return": 0.038,
        "price": 312.25,
        "category": "EQUITIES",
        "driver": "MOMENTUM_SPIKE",
        "confidence": 0.88
    },
    {
        "ticker": "SOL-USD",
        "direction": "LONG",
        "pred_return": 0.052,
        "price": 288.50,
        "category": "CRYPTO",
        "driver": "MACD_CROSSOVER",
        "confidence": 0.95
    }
]

for user in users:
    for sig in fake_signals:
        ticker = sig['ticker']
        direction = sig['direction']
        pred = sig['pred_return']
        price = sig['price']
        conf = sig['confidence']
        driver = sig['driver']
        
        color = 0x22c55e if pred > 0 else 0xef4444
        severity = 'critical' if abs(pred) >= 0.04 else 'high'
        alpha_str = f"+{pred*100:.1f}%" if pred > 0 else f"{pred*100:.1f}%"
        
        message = f"ML Engine predicts {alpha_str} alpha window. Primary driver: {driver} ({conf*100:.0f}% confidence)."
        
        fields = [
            {"name": "Direction", "value": direction, "inline": True},
            {"name": "Current Price", "value": f"${price:,.2f}", "inline": True},
            {"name": "Predicted Alpha", "value": alpha_str, "inline": True},
            {"name": "Primary Driver", "value": driver, "inline": True},
            {"name": "ML Confidence", "value": f"{conf*100:.0f}%", "inline": True},
            {"name": "Status", "value": "TEST SIGNAL", "inline": True},
        ]
        
        # 1. Insert into alerts_history
        c.execute(
            "INSERT INTO alerts_history "
            "(type, ticker, message, severity, price, timestamp, z_score, alpha, direction, category, user_email) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ("ML_ALPHA_PREDICTION", ticker, message, severity, price,
             datetime.now().isoformat(), round(pred*100, 2), round(abs(pred)*100, 2), direction, sig['category'], user)
        )
        
        # 2. Insert into ml_predictions
        dummy_importance = {driver: 0.8, 'Volume': 0.1, 'MACD': 0.1}
        c.execute("INSERT INTO ml_predictions (symbol, predicted_return, confidence, features_json) VALUES (?, ?, ?, ?)",
                 (ticker, pred, conf, json.dumps(dummy_importance)))
                 
        conn.commit()
        
        # 3. Push webhook
        print(f"Sending Webhook to {user} for {ticker}...")
        NOTIFY.push_webhook(
            user,
            f"TEST ALPHA SIGNAL: {ticker} - {direction}",
            r"This is a mock institutional signal pushed via your IDE.",
            embed_color=color,
            fields=fields
        )
        time.sleep(1) # stagger logic
        
conn.close()
print("All mock signals injected and pushed successfully!")
