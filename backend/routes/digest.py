import sqlite3, os, requests, threading, time
from datetime import datetime, timedelta
from backend.database import DB_PATH, SUPABASE_URL, SUPABASE_HEADERS
from backend.services import NOTIFY

def _fix(s):
    """Decode mojibake: UTF-8 bytes that were mis-read as Latin-1 and re-encoded.
    e.g. -> - (em-dash), -> - (emoji).
    Falls back to original string if decoding fails."""
    try:
        return s.encode('latin-1').decode('utf-8')
    except Exception:
        return s


# - Configurable send time (UTC) -
DIGEST_HOUR_UTC   = int(os.getenv('DIGEST_HOUR_UTC',   '7'))
DIGEST_MINUTE_UTC = int(os.getenv('DIGEST_MINUTE_UTC', '30'))


# -
# DATA HELPERS
# -

def _get_top_signals(limit=5):
    """Top signals from last 24h by severity, then recency."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("""
            SELECT id, type, ticker, message, severity, price, timestamp
            FROM alerts_history
            WHERE timestamp > datetime('now', '-24 hours')
            ORDER BY
                CASE severity
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    ELSE 4
                END,
                timestamp DESC
            LIMIT ?
        """, (limit,))
        rows = [dict(r) for r in c.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        print(f"[Digest] Error fetching signals: {e}")
        return []


def _get_btc_summary():
    """Latest BTC price from market_ticks."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        c = conn.cursor()
        c.execute("SELECT symbol, price FROM market_ticks WHERE symbol='BTC-USD' ORDER BY timestamp DESC LIMIT 1")
        row = c.fetchone()
        conn.close()
        return float(row[1]) if row else None
    except Exception:
        return None


def _get_leaderboard_stats():
    """Win-rate from DB market_ticks only - no live yfinance calls."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        # Pull recent signals with entry price
        c.execute("""
            SELECT ticker, type, price AS entry_price, timestamp
            FROM alerts_history
            WHERE price > 0
              AND timestamp > datetime('now', '-7 days')
            ORDER BY timestamp DESC
            LIMIT 50
        """)
        rows = c.fetchall()
        if not rows:
            conn.close()
            return None

        wins, losses = 0, 0
        for r in rows:
            try:
                ticker     = r['ticker']
                entry      = float(r['entry_price'])
                sig_type   = r['type']
                # Grab the latest market_ticks price for this ticker
                c.execute("""
                    SELECT price FROM market_ticks
                    WHERE symbol = ?
                    ORDER BY timestamp DESC LIMIT 1
                """, (ticker,))
                tick = c.fetchone()
                if not tick:
                    continue
                curr = float(tick[0])
                move = (curr - entry) / entry
                is_bullish = sig_type in ('RSI_OVERSOLD', 'MACD_BULLISH_CROSS', 'ML_ALPHA_PREDICTION')
                won = (move > 0 and is_bullish) or (move < 0 and not is_bullish)
                if won: wins += 1
                else:   losses += 1
            except Exception:
                continue

        conn.close()
        total = wins + losses
        if total == 0:
            return None
        return {'wins': wins, 'losses': losses, 'total': total,
                'win_rate': round(wins / total * 100, 1)}
    except Exception as e:
        print(f"[Digest] Leaderboard stats error: {e}")
        return None
def _get_market_brief_excerpt():
    """Pull AI brief from memory cache first, then DB cache_store fallback."""
    try:
        from backend.routes.ai_engine import _brief_cache
        if _brief_cache.get('brief'):
            full   = _brief_cache['brief']
            excerpt = full[:320].rsplit(' ', 1)[0] + '-'
            return excerpt
    except Exception:
        pass
    # Fallback: check persistent cache_store table
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        c = conn.cursor()
        c.execute("""
            SELECT value FROM cache_store
            WHERE key = 'market_brief'
              AND (expires_at IS NULL OR expires_at > ?)
            LIMIT 1
        """, (time.time(),))
        row = c.fetchone()
        conn.close()
        if row and row[0]:
            full    = row[0][:320].rsplit(' ', 1)[0] + '-'
            return full
    except Exception:
        pass
    return None
def _get_eligible_users():
    """Return all user emails opted in to the daily digest.
    Uses digest_enabled column when present; falls back to alerts_enabled
    so existing users are not silently opted out after the schema migration.
    """
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        c = conn.cursor()
        # Prefer digest_enabled if the column exists
        try:
            c.execute("""
                SELECT user_email FROM user_settings
                WHERE digest_enabled = 1
                  AND user_email IS NOT NULL
                  AND user_email != ''
            """)
        except Exception:
            # Column doesn't exist yet - fall back to alerts_enabled
            c.execute("""
                SELECT user_email FROM user_settings
                WHERE alerts_enabled = 1
                  AND user_email IS NOT NULL
                  AND user_email != ''
            """)
        rows = [r[0] for r in c.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        print(f"[Digest] Error fetching users: {e}")
        return []


# -
# EMAIL DIGEST  (Resend API)
# -

def _sev_color(sev):
    return {'CRITICAL': '#ef4444', 'HIGH': '#fb923c', 'MEDIUM': '#facc15'}.get(sev, '#94a3b8')

def _sev_label(sev):
    return {'CRITICAL': '- CRITICAL', 'HIGH': '- HIGH', 'MEDIUM': '- MEDIUM'}.get(sev, '- LOW')


def _build_email_html(user_email, signals, btc_price, lb_stats=None, brief_excerpt=None):
    """Render a premium dark-themed HTML digest email."""
    now = datetime.utcnow().strftime('%A, %d %B %Y')
    terminal_url = 'https://alphasignal.digital'

    btc_row = ''
    if btc_price:
        btc_row = f"""
        <tr>
          <td style="padding:14px 28px;background:#0d1117;border-bottom:1px solid #1e2433;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="font-family:'JetBrains Mono',monospace,sans-serif;font-size:11px;
                    font-weight:700;letter-spacing:2px;color:#6b7280;">BTC / USD</span>
                </td>
                <td align="right">
                  <span style="font-family:'JetBrains Mono',monospace,sans-serif;font-size:22px;
                    font-weight:900;color:#7dd3fc;">${btc_price:,.0f}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>"""

    signal_rows = ''
    if signals:
        for s in signals[:3]:
            sev      = s.get('severity', 'MEDIUM')
            color    = _sev_color(sev)
            label    = _sev_label(sev)
            ticker   = s.get('ticker', '?').replace('-USD', '')
            sig_type = s.get('type', '').replace('_', ' ')
            price_str = f"${s['price']:,.4f}" if s.get('price') else ''
            raw_msg  = _fix(s.get('message') or '')
            msg      = raw_msg[:120] + ('...' if len(raw_msg) > 120 else '')
            msg_row  = (
                f'<tr><td colspan="2" style="padding-top:6px;">'
                f'<span style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;line-height:1.5;">'
                f'{msg}</span></td></tr>'
            ) if msg else ''
            signal_rows += f"""
            <tr>
              <td style="padding:16px 28px;border-bottom:1px solid #1e2433;border-left:3px solid {color};">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <span style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;
                        letter-spacing:2px;color:{color};text-transform:uppercase;">{label}</span>
                    </td>
                    <td align="right">
                      <span style="font-family:'JetBrains Mono',monospace,sans-serif;font-size:11px;
                        color:#94a3b8;">{price_str}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top:4px;">
                      <span style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;
                        color:#f8fafc;">{ticker}</span>
                      <span style="font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;
                        margin-left:8px;">{sig_type}</span>
                    </td>
                  </tr>
                  {msg_row}
                </table>
              </td>
            </tr>"""
    else:
        signal_rows = """
        <tr>
          <td style="padding:24px 28px;text-align:center;color:#64748b;font-family:Arial,sans-serif;font-size:13px;">
            No signals fired in the last 24h - markets were quiet.
          </td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>AlphaSignal Morning Digest</title>
</head>
<body style="margin:0;padding:0;background:#05070a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#05070a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background:#0d1117;border-radius:12px;
                 border:1px solid #1e2433;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 28px 20px;background:linear-gradient(135deg,#0d1117 0%,#0a0f1e 100%);
                border-bottom:1px solid #1e2433;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;
                      color:#f8fafc;letter-spacing:-0.5px;">Alpha<span style="color:#7dd3fc;">Signal</span></span>
                    <span style="display:block;font-family:Arial,sans-serif;font-size:9px;
                      font-weight:700;letter-spacing:3px;color:#6b7280;margin-top:3px;">
                      INSTITUTIONAL INTELLIGENCE TERMINAL</span>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;
                      letter-spacing:2px;color:#7dd3fc;background:rgba(0,242,255,0.1);
                      border:1px solid rgba(0,242,255,0.25);padding:4px 10px;border-radius:20px;">
                      MORNING DIGEST</span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:12px;">
                    <span style="font-family:Arial,sans-serif;font-size:12px;color:#6b7280;">{now} - 07:30 UTC</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BTC price -->
          {btc_row}

          <!-- Performance Stats -->
          {f'''
          <tr>
            <td style="padding:14px 28px;background:#0d1117;border-bottom:1px solid #1e2433;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;color:#6b7280;">SIGNAL WIN RATE (LAST 100 SIGNALS)</span>
                  </td>
                  <td align="right">
                    <span style="font-family:\'JetBrains Mono\',monospace,sans-serif;font-size:18px;font-weight:900;color:{'#22c55e' if lb_stats['win_rate']>=55 else '#f59e0b' if lb_stats['win_rate']>=45 else '#ef4444'};">{ lb_stats['win_rate'] }%</span>
                    <span style="font-family:Arial,sans-serif;font-size:10px;color:#6b7280;margin-left:6px;">{lb_stats['wins']}W / {lb_stats['losses']}L</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>''' if lb_stats else ''}

          <!-- AI Brief excerpt -->
          {f'''
          <tr>
            <td style="padding:16px 28px;background:#0d1117;border-bottom:1px solid #1e2433;border-left:3px solid #bc13fe;">
              <span style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;color:#bc13fe;display:block;margin-bottom:6px;">AI MARKET BRIEF</span>
              <span style="font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;line-height:1.6;">{brief_excerpt}</span>
            </td>
          </tr>''' if brief_excerpt else ''}

          <!-- Signal heading -->
          <tr>
            <td style="padding:16px 28px 8px;background:#0d1117;">
              <span style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;
                letter-spacing:3px;color:#6b7280;">TOP SIGNALS - LAST 24H</span>
            </td>
          </tr>

          <!-- Signal rows -->
          {signal_rows}

          <!-- CTA -->
          <tr>
            <td style="padding:24px 28px;background:#0d1117;text-align:center;">
              <a href="{terminal_url}" target="_blank"
                style="display:inline-block;background:#7dd3fc;color:#000;font-family:Arial,sans-serif;
                  font-size:12px;font-weight:900;letter-spacing:2px;padding:12px 28px;
                  border-radius:8px;text-decoration:none;">
                OPEN TERMINAL &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;background:#080b12;border-top:1px solid #1e2433;text-align:center;">
              <span style="font-family:Arial,sans-serif;font-size:10px;color:#374151;line-height:1.6;">
                You're receiving this because you enabled alerts on
                <a href="{terminal_url}" style="color:#4b5563;text-decoration:none;">alphasignal.digital</a>.<br>
                <a href="{terminal_url}/?view=alert-settings" style="color:#4b5563;">Unsubscribe</a>
                &nbsp;-&nbsp;
                <a href="{terminal_url}" style="color:#4b5563;">AlphaSignal Terminal</a>
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _send_resend_email(to_email, subject, html_body):
    """Send an email via the Resend API. Requires RESEND_API_KEY env var."""
    api_key  = os.getenv('RESEND_API_KEY', '')
    from_addr = os.getenv('RESEND_FROM', 'AlphaSignal <digest@alphasignal.digital>')
    if not api_key:
        print('[Digest] RESEND_API_KEY not set - skipping email', flush=True)
        return False
    try:
        resp = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'from': from_addr,
                'to': [to_email],
                'subject': subject,
                'html': html_body,
            },
            timeout=15
        )
        if resp.status_code in (200, 201, 202):
            print(f'[Digest] Email sent to {to_email}', flush=True)
            return True
        else:
            print(f'[Digest] Email failed ({resp.status_code}): {resp.text}', flush=True)
            return False
    except Exception as e:
        print(f'[Digest] Email error for {to_email}: {e}', flush=True)
        return False


# -
# TELEGRAM DIGEST
# -
# ----------------------------------------------------------------------------

def _build_telegram_digest(user_email, signals, btc_price):
    """Build Telegram digest message using HTML parse_mode (safer than Markdown)."""
    now = datetime.utcnow().strftime('%d %b %Y')
    parts = [
        f"<b>AlphaSignal Morning Digest - {now}</b>",
        "-------------------------",
    ]
    if btc_price:
        parts.append(f"- <b>BTC:</b> ${btc_price:,.0f}")
        parts.append("")
    if signals:
        parts.append("- <b>Top Signals (Last 24h)</b>")
        for s in signals[:3]:
            sev      = s.get('severity', 'MEDIUM')
            icon     = {'CRITICAL': '[CRITICAL]', 'HIGH': '[HIGH]', 'MEDIUM': '[MED]'}.get(sev, '[LOW]')
            ticker   = (s.get('ticker') or '?').replace('-USD', '')
            sig_type = (s.get('type') or '').replace('_', ' ')
            price_str = f"@ ${s['price']:,.2f}" if s.get('price') else ''
            parts.append(f"{icon} <b>{ticker}</b> - {sig_type} {price_str}".strip())
            msg = _fix(s.get('message') or '')
            if msg:
                safe_msg = msg[:80] + ('...' if len(msg) > 80 else '')
                parts.append(f"   <i>{safe_msg}</i>")
    else:
        parts.append("- No signals in the last 24h - markets are quiet.")
    parts += [
        "",
        "-------------------------",
        "- <a href='https://alphasignal.digital'>Open AlphaSignal Terminal</a>",
        "<i>Unsubscribe: disable Daily Digest in Settings</i>",
    ]
    return "\n".join(parts)
def _build_discord_digest(user_email, signals, btc_price):
    now = datetime.utcnow().strftime('%d %b %Y')
    fields = []
    if btc_price:
        fields.append({"name": "BTC Price", "value": f"`${btc_price:,.0f}`", "inline": True})
    for s in signals[:3]:
        sev    = s.get('severity', 'MEDIUM')
        icon   = {'CRITICAL': '[!!]', 'HIGH': '[!]', 'MEDIUM': '[-]'}.get(sev, '[ok]')
        ticker = s.get('ticker', '?').replace('-USD', '')
        price_str = f"@ ${s['price']:,.2f}" if s.get('price') else ''
        msg    = _fix(s.get('message', '') or '')[:100]
        fields.append({
            "name": f"{icon} {ticker} - {s.get('type','')} {price_str}",
            "value": msg or "No details",
            "inline": False
        })
    if not signals:
        fields.append({"name": "No Signals", "value": "Markets were quiet in the last 24h.", "inline": False})
    return {
        "embeds": [{
            "title": f"AlphaSignal Morning Digest - {now}",
            "color": 0x00f2ff,
            "fields": fields,
            "footer": {"text": "AlphaSignal Terminal - alphasignal.digital"},
            "timestamp": datetime.utcnow().isoformat()
        }]
    }


# ----------------------------------------------------------------------------
# MAIN SEND FUNCTION
# ----------------------------------------------------------------------------

def send_digest_to_user(user_email):
    """Send daily digest to one user: Email + Telegram + Discord."""
    try:
        signals = _get_top_signals(limit=3)
        btc     = _get_btc_summary()
        lb      = _get_leaderboard_stats()
        brief   = _get_market_brief_excerpt()

        # --- Email (Resend) ---------------------------------------------------
        try:
            now_str = datetime.utcnow().strftime('%d %b %Y')
            subject = f"AlphaSignal Morning Digest - {now_str}"
            html    = _build_email_html(user_email, signals, btc, lb_stats=lb, brief_excerpt=brief)
            _send_resend_email(user_email, subject, html)
        except Exception as e:
            print(f"[Digest] Email build error for {user_email}: {e}")

        # --- Telegram ---------------------------------------------------------
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if bot_token:
            try:
                conn = sqlite3.connect(DB_PATH, timeout=30)
                c = conn.cursor()
                c.execute("SELECT telegram_chat_id FROM user_settings WHERE user_email = ?", (user_email,))
                row = c.fetchone()
                conn.close()
                if row and row[0]:
                    msg = _build_telegram_digest(user_email, signals, btc)
                    requests.post(
                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                        json={"chat_id": row[0], "text": msg,
                              "parse_mode": "HTML", "disable_web_page_preview": False},
                        timeout=10
                    )
                    print(f"[Digest] Telegram sent to {user_email}", flush=True)
            except Exception as e:
                print(f"[Digest] Telegram error for {user_email}: {e}")

        # - Discord -
        try:
            conn = sqlite3.connect(DB_PATH, timeout=30)
            c = conn.cursor()
            c.execute("SELECT discord_webhook FROM user_settings WHERE user_email = ?", (user_email,))
            row = c.fetchone()
            conn.close()
            if row and row[0]:
                payload = _build_discord_digest(user_email, signals, btc)
                requests.post(row[0], json=payload, timeout=10)
                print(f"[Digest] Discord sent to {user_email}", flush=True)
        except Exception as e:
            print(f"[Digest] Discord error for {user_email}: {e}")

    except Exception as e:
        print(f"[Digest] Fatal error for {user_email}: {e}")


# -
# CRON SCHEDULER
# -

def start_digest_cron():
    """Background daemon: fires digest at DIGEST_HOUR_UTC:DIGEST_MINUTE_UTC UTC daily."""
    def _loop():
        print(f"[Digest] Cron started - will send at {DIGEST_HOUR_UTC:02d}:{DIGEST_MINUTE_UTC:02d} UTC daily", flush=True)
        while True:
            try:
                now    = datetime.utcnow()
                target = now.replace(hour=DIGEST_HOUR_UTC, minute=DIGEST_MINUTE_UTC, second=0, microsecond=0)
                if now >= target:
                    target += timedelta(days=1)
                wait_seconds = (target - now).total_seconds()
                print(f"[Digest] Next send at {target.strftime('%Y-%m-%d %H:%M UTC')} ({wait_seconds/3600:.1f}h)", flush=True)
                time.sleep(wait_seconds)

                users = _get_eligible_users()
                print(f"[Digest] Sending to {len(users)} user(s)...", flush=True)
                for email in users:
                    try:
                        send_digest_to_user(email)
                    except Exception as e:
                        print(f"[Digest] Error for {email}: {e}")

                time.sleep(61)  # avoid double-fire at boundary
            except Exception as e:
                print(f"[Digest] Cron error: {e}")
                time.sleep(60)

    t = threading.Thread(target=_loop, daemon=True, name="DigestCron")
    t.start()
    return t


# -
# HTTP ROUTE MIXIN
# -

class DigestRoutesMixin:
    """POST /api/digest/send - manual trigger for testing."""
    def handle_digest_send(self, auth_info):
        try:
            user_email = auth_info.get('email')
            if not user_email:
                return self.send_json({'error': 'No email in auth'})
            threading.Thread(target=send_digest_to_user, args=(user_email,), daemon=True).start()
            self.send_json({'success': True, 'message': f'Digest queued for {user_email}'})
        except Exception as e:
            self.send_json({'error': str(e)})
