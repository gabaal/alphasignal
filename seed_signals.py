"""
Seed dummy signals into alerts_history for geraldbaalham@live.co.uk.
Covers a mix of signal types, directions, severities, categories,
and statuses (active, closed wins, closed losses) over the last 30 days.
"""
import sqlite3, random, os
from datetime import datetime, timedelta, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'alphasignal.db')
USER_EMAIL = 'geraldbaalham@live.co.uk'

now = datetime.now(timezone.utc)

SIGNALS = [
    # (type, ticker, category, direction, severity, entry_price, days_ago, status, exit_pct)
    # exit_pct: None=active, positive=win, negative=loss
    ('ML_ALPHA_PREDICTION', 'BTC-USD',   'L1',       'LONG',    'CRITICAL', 71200.00,  28, 'closed', +12.4),
    ('RSI_OVERSOLD',        'ETH-USD',   'L1',       'LONG',    'HIGH',     3210.50,   26, 'closed', +8.7),
    ('MACD_BULLISH_CROSS',  'SOL-USD',   'L1',       'LONG',    'HIGH',     142.30,    24, 'closed', -3.0),
    ('VOLUME_SPIKE',        'DOGE-USD',  'MEMES',    'NEUTRAL', 'MEDIUM',   0.1820,    22, 'closed', +5.2),
    ('ML_ALPHA_PREDICTION', 'NVDA',      'EQUITIES', 'LONG',    'HIGH',     875.40,    21, 'closed', +11.1),
    ('RSI_OVERBOUGHT',      'PEPE-USD',  'MEMES',    'SHORT',   'MEDIUM',   0.000012,  20, 'closed', -3.0),
    ('MACD_BEARISH_CROSS',  'ADA-USD',   'L1',       'SHORT',   'MEDIUM',   0.6210,    19, 'closed', +6.3),
    ('ML_ALPHA_PREDICTION', 'SOL-USD',   'L1',       'LONG',    'CRITICAL', 155.80,    18, 'closed', +10.5),
    ('RSI_OVERSOLD',        'AVAX-USD',  'L1',       'LONG',    'HIGH',     31.20,     17, 'closed', -3.0),
    ('VOLUME_SPIKE',        'WULF',      'MINERS',   'NEUTRAL', 'MEDIUM',   16.40,     16, 'closed', +7.8),
    ('ML_ALPHA_PREDICTION', 'XRP-USD',   'L1',       'LONG',    'HIGH',     0.5820,    15, 'closed', +9.2),
    ('MACD_BULLISH_CROSS',  'BNB-USD',   'L1',       'LONG',    'HIGH',     412.50,    14, 'closed', +5.5),
    ('RSI_OVERSOLD',        'RIOT',      'MINERS',   'LONG',    'HIGH',     13.80,     13, 'closed', -3.0),
    ('ML_ALPHA_PREDICTION', 'AAVE-USD',  'DEFI',     'LONG',    'MEDIUM',   88.40,     12, 'closed', +10.1),
    ('VOLUME_SPIKE',        'ETH-USD',   'L1',       'NEUTRAL', 'HIGH',     3150.00,   11, 'closed', +6.7),
    ('RSI_OVERBOUGHT',      'SOL-USD',   'L1',       'SHORT',   'MEDIUM',   187.20,    10, 'closed', +4.3),
    ('ML_ALPHA_PREDICTION', 'MSTR',      'PROXY',    'LONG',    'CRITICAL', 1620.00,   9,  'closed', +15.2),
    ('MACD_BULLISH_CROSS',  'LINK-USD',  'AI',       'LONG',    'HIGH',     14.30,     8,  'closed', -3.0),
    ('RSI_OVERSOLD',        'BTC-USD',   'L1',       'LONG',    'HIGH',     68400.00,  7,  'closed', +10.8),
    ('VOLUME_SPIKE',        'DOGE-USD',  'MEMES',    'NEUTRAL', 'MEDIUM',   0.1650,    6,  'closed', +5.1),
    # Active signals (last 5 days)
    ('ML_ALPHA_PREDICTION', 'ETH-USD',   'L1',       'LONG',    'CRITICAL', 3310.00,   5,  None, None),
    ('RSI_OVERSOLD',        'SOL-USD',   'L1',       'LONG',    'HIGH',     118.40,    4,  None, None),
    ('MACD_BULLISH_CROSS',  'AVAX-USD',  'L1',       'LONG',    'MEDIUM',   29.80,     4,  None, None),
    ('ML_ALPHA_PREDICTION', 'XRP-USD',   'L1',       'LONG',    'HIGH',     0.5410,    3,  None, None),
    ('VOLUME_SPIKE',        'RIOT',      'MINERS',   'NEUTRAL', 'MEDIUM',   14.10,     3,  None, None),
    ('RSI_OVERSOLD',        'AAVE-USD',  'DEFI',     'LONG',    'HIGH',     81.20,     2,  None, None),
    ('MACD_BULLISH_CROSS',  'BTC-USD',   'L1',       'LONG',    'CRITICAL', 76800.00,  2,  None, None),
    ('ML_ALPHA_PREDICTION', 'NVDA',      'EQUITIES', 'LONG',    'HIGH',     892.50,    1,  None, None),
    ('RSI_OVERBOUGHT',      'PEPE-USD',  'MEMES',    'SHORT',   'MEDIUM',   0.000015,  1,  None, None),
    ('VOLUME_SPIKE',        'WIF-USD',   'MEMES',    'NEUTRAL', 'HIGH',     2.38,      0,  None, None),
]

TYPE_MESSAGES = {
    'ML_ALPHA_PREDICTION': 'ML alpha detected: predicted 24h return {alpha:.1f}%. Primary driver: RSI_14 ({conf:.0f}% confidence)',
    'RSI_OVERSOLD':        'RSI-14 oversold at {rsi:.1f} — mean-reversion long setup on {ticker}',
    'RSI_OVERBOUGHT':      'RSI-14 overbought at {rsi:.1f} — potential distribution on {ticker}',
    'MACD_BULLISH_CROSS':  'MACD bullish crossover confirmed on {ticker} with volume spike {vol:.1f}σ above mean',
    'MACD_BEARISH_CROSS':  'MACD bearish crossover on {ticker} — momentum turning negative',
    'VOLUME_SPIKE':        'Volume spike {vol:.1f}σ above 20-day mean on {ticker} — breakout candidate',
}

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

inserted = 0
for (sig_type, ticker, category, direction, severity, entry_price, days_ago, status, exit_pct) in SIGNALS:
    ts = (now - timedelta(days=days_ago, hours=random.randint(0,14), minutes=random.randint(0,59))).strftime('%Y-%m-%d %H:%M:%S')
    z_score = round(random.uniform(1.8, 3.8), 2)
    alpha   = round(random.uniform(0.9, 3.2), 2)
    sentiment = round(random.uniform(0.45, 0.92), 2)
    btc_corr  = round(random.uniform(0.55, 0.95), 2)

    msg_kwargs = dict(ticker=ticker, alpha=alpha, conf=random.uniform(28,45),
                      rsi=random.uniform(22,28) if 'OVERSOLD' in sig_type else random.uniform(72,80),
                      vol=random.uniform(2.1, 4.5))
    message = TYPE_MESSAGES.get(sig_type, f'{sig_type} signal on {ticker}').format(**msg_kwargs)

    # Compute closed fields
    closed_at = exit_price_val = final_roi = None
    db_status = 'active'
    if status == 'closed' and exit_pct is not None:
        if direction == 'LONG':
            exit_price_val = round(entry_price * (1 + exit_pct / 100), 4)
        else:
            exit_price_val = round(entry_price * (1 - exit_pct / 100), 4)
        final_roi = round(exit_pct, 2)
        closed_at = (now - timedelta(days=max(0, days_ago - random.randint(1,4)))).strftime('%Y-%m-%d %H:%M:%S')
        db_status = 'closed'

    c.execute('''
        INSERT INTO alerts_history
            (type, ticker, message, severity, price, timestamp,
             z_score, alpha, direction, category, btc_correlation, sentiment,
             status, closed_at, exit_price, final_roi, user_email)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', (sig_type, ticker, message, severity, entry_price, ts,
          z_score, alpha, direction, category, btc_corr, sentiment,
          db_status, closed_at, exit_price_val, final_roi, USER_EMAIL))
    inserted += 1

conn.commit()
conn.close()
print(f"✅ Inserted {inserted} dummy signals for {USER_EMAIL}")
