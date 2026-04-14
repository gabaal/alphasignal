import sqlite3

def test_db():
    conn = sqlite3.connect(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\alphasignal.db')
    c = conn.cursor()
    email = 'geraldbaalham@live.co.uk'
    c.execute('SELECT z_threshold, alerts_enabled, whale_threshold, depeg_threshold, vol_spike_threshold, cme_gap_threshold, rebalance_threshold, discord_webhook, telegram_chat_id FROM user_settings WHERE user_email=?', (email,))
    ext = c.fetchone()
    print("EXT:", ext)
    
    post_data = {'rebalance_threshold': 3.5, 'alerts_enabled': True}
    
    z = float(post_data.get('z_threshold', ext[0] if ext and ext[0] is not None else 2.0))
    z = max(0.5, min(z, 10.0))
    whale_t  = float(post_data.get('whale_threshold', ext[2] if ext and ext[2] is not None else 5.0))
    depeg_t  = float(post_data.get('depeg_threshold', ext[3] if ext and ext[3] is not None else 1.0))
    vol_t    = float(post_data.get('vol_spike_threshold', ext[4] if ext and ext[4] is not None else 2.0))
    cme_t    = float(post_data.get('cme_gap_threshold', ext[5] if ext and ext[5] is not None else 1.0))
    rebalance_t = float(post_data.get('rebalance_threshold', ext[6] if ext and ext[6] is not None else 2.5))
    discord  = str(post_data.get('discord_webhook', ext[7] if ext and ext[7] is not None else '')).strip()
    telegram = str(post_data.get('telegram_chat_id', ext[8] if ext and ext[8] is not None else '')).strip()
    
    enabled_raw = post_data.get('alerts_enabled')
    enabled = bool(enabled_raw) if enabled_raw is not None else (bool(ext[1]) if ext else True)
    
    print("VALUES:", (email, z, enabled, discord, telegram, whale_t, depeg_t, vol_t, cme_t, rebalance_t))
    
    c.execute("""INSERT INTO user_settings (user_email, z_threshold, alerts_enabled, discord_webhook, telegram_chat_id,
                                             whale_threshold, depeg_threshold, vol_spike_threshold, cme_gap_threshold, rebalance_threshold)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(user_email) DO UPDATE SET
                   z_threshold        = excluded.z_threshold,
                   alerts_enabled     = excluded.alerts_enabled,
                   whale_threshold    = excluded.whale_threshold,
                   depeg_threshold    = excluded.depeg_threshold,
                   vol_spike_threshold = excluded.vol_spike_threshold,
                   cme_gap_threshold  = excluded.cme_gap_threshold,
                   rebalance_threshold = excluded.rebalance_threshold,
                   discord_webhook    = CASE WHEN excluded.discord_webhook != '' THEN excluded.discord_webhook ELSE discord_webhook END,
                   telegram_chat_id   = CASE WHEN excluded.telegram_chat_id != '' THEN excluded.telegram_chat_id ELSE telegram_chat_id END""",
              (email, z, enabled, discord, telegram, whale_t, depeg_t, vol_t, cme_t, rebalance_t))
    conn.commit()
    
    c.execute('SELECT rebalance_threshold FROM user_settings WHERE user_email=?', (email,))
    print("AFTER REBALANCE:", c.fetchone())
    conn.close()

if __name__ == '__main__':
    test_db()
