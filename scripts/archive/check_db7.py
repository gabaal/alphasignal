import sqlite3
from datetime import datetime
from backend.services import NotificationService

def test():
    conn = sqlite3.connect('backend/alphasignal.db')
    c = conn.cursor()
    c.execute("SELECT id, type, ticker, price, user_email, timestamp FROM alerts_history WHERE status='active' AND ticker='TSLA' AND type='VOLUME_SPIKE'")
    active_rows = c.fetchall()
    
    price_map = {}
    now_dt = datetime.utcnow()
    now_ts = now_dt.isoformat()
    BULLISH = {'VOLUME_SPIKE'}
    
    for sig_id, sig_type, ticker, entry_p, user_email, sig_ts in active_rows:
        expiry_days, tp2_threshold, sl_threshold = NotificationService.get_signal_thresholds(sig_type)
        
        try:
            sig_dt = datetime.fromisoformat(sig_ts) if sig_ts else None
            if sig_dt:
                hours_passed = (now_dt - sig_dt).total_seconds() / 3600.0
                if hours_passed >= (expiry_days * 24.0):
                    curr_p = price_map.get(ticker)
                    final_roi = 0.0
                    exit_px = 0.0
                    if curr_p and entry_p and entry_p > 0:
                        direction = 1 if (sig_type or '').upper() in BULLISH else -1
                        final_roi = round(direction * (curr_p - entry_p) / entry_p * 100, 2)
                        exit_px = round(curr_p, 10)
                    
                    print(f"Executing update for {ticker}: {now_ts}, {exit_px}, {final_roi}, {sig_id}")
                    c.execute(
                        "UPDATE alerts_history SET status='closed', closed_at=?, exit_price=?, final_roi=? WHERE id=?",
                        (now_ts, exit_px, final_roi, sig_id)
                    )
                    continue
        except Exception as e:
            print("EXCEPTION:", repr(e))

if __name__ == '__main__':
    test()
