import sqlite3
from datetime import datetime
from backend.services import NotificationService

def debug():
    BULLISH = {'VOLUME_SPIKE'}
    conn = sqlite3.connect('backend/alphasignal.db')
    c = conn.cursor()
    c.execute("SELECT id, type, ticker, price, timestamp FROM alerts_history WHERE status='active' AND ticker='TSLA' AND type='VOLUME_SPIKE'")
    row = c.fetchone()
    print("Row:", row)
    sig_id, sig_type, ticker, entry_p, sig_ts = row

    expiry_days, tp, sl = NotificationService.get_signal_thresholds(sig_type)
    print("Thresholds:", expiry_days, tp, sl)

    now_dt = datetime.utcnow()
    sig_dt = datetime.fromisoformat(sig_ts)
    hours = (now_dt - sig_dt).total_seconds() / 3600.0
    print("Hours passed:", hours)
    
    if hours >= (expiry_days * 24.0):
        print("SHOULD CLOSE")
    
if __name__ == '__main__':
    debug()
