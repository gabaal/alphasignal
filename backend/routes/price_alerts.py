"""
Price Alert Routes — real-time threshold notifications
GET  /api/price-alerts          list user's active alerts
POST /api/price-alerts          create alert {ticker, target_price, direction, note}
DELETE /api/price-alerts/<id>   delete alert
Background thread checks every 60s and fires email+Telegram on trigger.
"""
import sqlite3, os, threading, time, requests
from datetime import datetime
from backend.database import DB_PATH


# PA1: HTML-safe escaping for Telegram (mirrors B5 fix in signal alerts)
def _pa_escape(text):
    """Escape HTML special chars for Telegram HTML parse mode."""
    return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


# ─────────────────────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────────────────────

def _init_price_alerts_table():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS price_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            ticker TEXT NOT NULL,
            target_price REAL NOT NULL,
            direction TEXT NOT NULL,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def _get_current_price(ticker):
    """Get most recent price from market_ticks."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            "SELECT price FROM market_ticks WHERE symbol=? AND price>0 ORDER BY timestamp DESC LIMIT 1",
            (ticker,)
        )
        row = c.fetchone()
        conn.close()
        return float(row[0]) if row else None
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────
# Notification helpers
# ─────────────────────────────────────────────────────────────

def _notify_price_alert(user_email, ticker, target_price, current_price, direction, note):
    ticker_clean = ticker.replace('-USD', '')
    move = ((current_price - target_price) / target_price) * 100
    subject = f"AlphaSignal Price Alert: {ticker_clean} hit ${current_price:,.4f}"

    # Email via Resend
    try:
        api_key   = os.getenv('RESEND_API_KEY', '')
        from_addr = os.getenv('RESEND_FROM', 'AlphaSignal <digest@alphasignal.digital>')
        if api_key:
            html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#05070a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" style="background:#0d1117;border-radius:12px;border:1px solid #1e2433;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="padding:24px 28px;background:linear-gradient(135deg,#0d1117,#0a0f1e);border-bottom:1px solid #1e2433;">
          <span style="font-size:22px;font-weight:900;color:#f8fafc;">Alpha<span style="color:#7dd3fc;">Signal</span></span>
          <span style="display:block;font-size:9px;font-weight:700;letter-spacing:3px;color:#6b7280;margin-top:3px;">PRICE ALERT TRIGGERED</span>
        </td></tr>
        <tr><td style="padding:28px;background:#0d1117;">
          <div style="font-size:32px;font-weight:900;color:#7dd3fc;margin-bottom:4px;">{ticker_clean}</div>
          <div style="font-size:14px;color:#94a3b8;margin-bottom:20px;">Your price alert has been triggered</div>
          <table width="100%" style="margin-bottom:20px;">
            <tr>
              <td style="padding:12px;background:#080b12;border-radius:8px;text-align:center;border:1px solid #1e2433;">
                <div style="font-size:9px;color:#6b7280;letter-spacing:2px;margin-bottom:6px;">TRIGGER PRICE</div>
                <div style="font-size:20px;font-weight:900;color:#f59e0b;">${target_price:,.4f}</div>
              </td>
              <td style="width:16px;"></td>
              <td style="padding:12px;background:#080b12;border-radius:8px;text-align:center;border:1px solid #1e2433;">
                <div style="font-size:9px;color:#6b7280;letter-spacing:2px;margin-bottom:6px;">CURRENT PRICE</div>
                <div style="font-size:20px;font-weight:900;color:#7dd3fc;">${current_price:,.4f}</div>
              </td>
              <td style="width:16px;"></td>
              <td style="padding:12px;background:#080b12;border-radius:8px;text-align:center;border:1px solid #1e2433;">
                <div style="font-size:9px;color:#6b7280;letter-spacing:2px;margin-bottom:6px;">MOVE</div>
                <div style="font-size:20px;font-weight:900;color:{'#22c55e' if move >= 0 else '#ef4444'};">{'+' if move >= 0 else ''}{move:.2f}%</div>
              </td>
            </tr>
          </table>
          {f'<p style="color:#94a3b8;font-size:13px;font-style:italic;border-left:3px solid #7dd3fc;padding-left:12px;">{note}</p>' if note else ''}
          <div style="text-align:center;margin-top:24px;">
            <a href="https://alphasignal.digital/?view=signals" style="display:inline-block;background:#7dd3fc;color:#000;font-weight:900;font-size:12px;letter-spacing:2px;padding:12px 28px;border-radius:8px;text-decoration:none;">OPEN TERMINAL &rarr;</a>
          </div>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#080b12;border-top:1px solid #1e2433;text-align:center;">
          <span style="font-size:10px;color:#374151;">AlphaSignal Terminal &middot; <a href="https://alphasignal.digital" style="color:#4b5563;">alphasignal.digital</a></span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""
            # PA4: log HTTP status so delivery failures surface in server logs
            resend_resp = requests.post(
                'https://api.resend.com/emails',
                headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
                json={'from': from_addr, 'to': [user_email], 'subject': subject, 'html': html},
                timeout=10
            )
            print(f'[PriceAlert] Email -> {user_email} | status={resend_resp.status_code}', flush=True)
            if resend_resp.status_code not in (200, 201):
                print(f'[PriceAlert] Email FAILED: {resend_resp.text[:200]}', flush=True)
    except Exception as e:
        print(f'[PriceAlert] Email error: {e}', flush=True)

    # PA1 fix: use HTML parse mode + escaped content (mirrors B5 fix for signal alerts)
    # PA3 fix: check telegram_alerts_enabled before sending
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN', '')
        if bot_token:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute(
                "SELECT telegram_chat_id, COALESCE(telegram_alerts_enabled, 1) "
                "FROM user_settings WHERE user_email=?",
                (user_email,)
            )
            row = c.fetchone()
            conn.close()
            if row and row[0] and row[1]:  # has chat_id AND telegram not muted
                icon = '\U0001f4c8' if direction == 'ABOVE' else '\U0001f4c9'
                move_sign = '+' if move >= 0 else ''
                # PA1: HTML mode — escape all user-supplied / computed content
                msg = (
                    f"{icon} <b>Price Alert: {_pa_escape(ticker_clean)}</b>\n\n"
                    f"Your alert (<b>{'above' if direction == 'ABOVE' else 'below'}</b> "
                    f"<code>${_pa_escape(f'{target_price:,.4f}')}</code>) was triggered.\n\n"
                    f"<b>Current price:</b> <code>${_pa_escape(f'{current_price:,.4f}')}</code>\n"
                    f"<b>Move:</b> <code>{_pa_escape(f'{move_sign}{move:.2f}%')}</code>\n"
                    + (f"<i>Note: {_pa_escape(note)}</i>\n" if note else '') +
                    f"\n<a href=\"https://alphasignal.digital/?view=signals\">Open Terminal</a>"
                )
                # PA4: log Telegram delivery status
                tg_resp = requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": row[0], "text": msg, "parse_mode": "HTML"},
                    timeout=8
                )
                print(f'[PriceAlert] Telegram -> chat_id={row[0]} | status={tg_resp.status_code}', flush=True)
                if tg_resp.status_code != 200:
                    print(f'[PriceAlert] Telegram FAILED: {tg_resp.text[:200]}', flush=True)
    except Exception as e:
        print(f'[PriceAlert] Telegram error: {e}', flush=True)


# PA5: log triggered price alert to alerts_history so it appears in Signal Archive
def _archive_price_alert(user_email, ticker, target_price, current_price, direction, note):
    ticker_clean = ticker.replace('-USD', '')
    move = ((current_price - target_price) / target_price) * 100
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            "INSERT INTO alerts_history (type, ticker, message, severity, triggered_at, user_email) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                'price_alert',
                ticker_clean,
                f"Price alert triggered: {ticker_clean} {'above' if direction == 'ABOVE' else 'below'} "
                f"${target_price:,.4f} — current ${current_price:,.4f} ({'+' if move>=0 else ''}{move:.2f}%)"
                + (f" | Note: {note}" if note else ""),
                'HIGH',
                datetime.utcnow().isoformat(),
                user_email
            )
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f'[PriceAlert] Archive error: {e}', flush=True)


# ─────────────────────────────────────────────────────────────
# Background checker
# ─────────────────────────────────────────────────────────────

def start_price_alert_checker():
    """Check all active price alerts every 60 seconds."""
    _init_price_alerts_table()

    def _loop():
        print('[PriceAlert] Checker started — polling every 60s', flush=True)
        while True:
            try:
                conn = sqlite3.connect(DB_PATH)
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                # PA2 fix: join user_settings to gate on alerts_enabled
                # Only fire for users who have alerts globally enabled
                c.execute("""
                    SELECT pa.*
                    FROM price_alerts pa
                    JOIN user_settings us ON pa.user_email = us.user_email
                    WHERE us.alerts_enabled = 1
                """)
                alerts = [dict(r) for r in c.fetchall()]
                conn.close()

                fired_ids = []
                for alert in alerts:
                    try:
                        current = _get_current_price(alert['ticker'])
                        if current is None:
                            continue
                        target    = float(alert['target_price'])
                        direction = alert['direction']
                        triggered = (
                            (direction == 'ABOVE' and current >= target) or
                            (direction == 'BELOW' and current <= target)
                        )
                        if triggered:
                            fired_ids.append(alert['id'])
                            # PA5 fix: archive to alerts_history before dispatching
                            _archive_price_alert(
                                alert['user_email'], alert['ticker'], target, current,
                                direction, alert.get('note', '')
                            )
                            threading.Thread(
                                target=_notify_price_alert,
                                args=(alert['user_email'], alert['ticker'], target, current,
                                      direction, alert.get('note', '')),
                                daemon=True
                            ).start()
                            print(f"[PriceAlert] TRIGGERED: {alert['ticker']} @ {current:.4f} "
                                  f"({direction} {target:.4f}) for {alert['user_email']}", flush=True)
                    except Exception as e:
                        print(f'[PriceAlert] Check error: {e}', flush=True)

                # Auto-delete fired alerts
                if fired_ids:
                    conn = sqlite3.connect(DB_PATH)
                    c = conn.cursor()
                    c.executemany("DELETE FROM price_alerts WHERE id=?", [(i,) for i in fired_ids])
                    conn.commit()
                    conn.close()

            except Exception as e:
                print(f'[PriceAlert] Loop error: {e}', flush=True)
            time.sleep(60)

    t = threading.Thread(target=_loop, daemon=True, name='PriceAlertChecker')
    t.start()
    return t


# ─────────────────────────────────────────────────────────────
# HTTP Route Mixin
# ─────────────────────────────────────────────────────────────

class PriceAlertRoutesMixin:

    def handle_price_alerts_get(self, auth_info):
        user_email = auth_info.get('email')
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute(
                "SELECT * FROM price_alerts WHERE user_email=? ORDER BY created_at DESC",
                (user_email,)
            )
            alerts = [dict(r) for r in c.fetchall()]
            conn.close()
            self.send_json(alerts)
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_price_alerts_post(self, auth_info, post_data):
        user_email  = auth_info.get('email')
        ticker      = (post_data.get('ticker') or '').upper().strip()
        target      = post_data.get('target_price')
        direction   = (post_data.get('direction') or 'ABOVE').upper()
        note        = (post_data.get('note') or '')[:200]

        if not ticker or target is None:
            self.send_json({'error': 'ticker and target_price required'})
            return
        if direction not in ('ABOVE', 'BELOW'):
            self.send_json({'error': 'direction must be ABOVE or BELOW'})
            return
        try:
            target = float(target)
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            # Enforce max 20 alerts per user
            c.execute("SELECT COUNT(*) FROM price_alerts WHERE user_email=?", (user_email,))
            if c.fetchone()[0] >= 20:
                conn.close()
                self.send_json({'error': 'Maximum 20 active alerts per account'})
                return
            c.execute(
                "INSERT INTO price_alerts (user_email, ticker, target_price, direction, note) VALUES (?,?,?,?,?)",
                (user_email, ticker, target, direction, note)
            )
            alert_id = c.lastrowid
            conn.commit()
            conn.close()
            self.send_json({'success': True, 'id': alert_id})
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_price_alerts_delete(self, auth_info, alert_id):
        user_email = auth_info.get('email')
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("DELETE FROM price_alerts WHERE id=? AND user_email=?", (alert_id, user_email))
            deleted = c.rowcount > 0
            conn.commit()
            conn.close()
            self.send_json({'success': deleted})
        except Exception as e:
            self.send_json({'error': str(e)})
