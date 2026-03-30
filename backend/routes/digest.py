import sqlite3, json, os, requests, threading, time
from datetime import datetime, timedelta
from backend.database import DB_PATH, SUPABASE_URL, SUPABASE_HEADERS
from backend.services import NOTIFY

# ── Configurable send time (UTC) ──────────────────────────────
DIGEST_HOUR_UTC   = 7
DIGEST_MINUTE_UTC = 30

def _get_top_signals(limit=5):
    """Top signals from last 24h by severity, then recency."""
    try:
        conn = sqlite3.connect(DB_PATH)
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
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT symbol, price FROM market_ticks WHERE symbol='BTC-USD' ORDER BY timestamp DESC LIMIT 1")
        row = c.fetchone()
        conn.close()
        return float(row[1]) if row else None
    except:
        return None

def _get_user_watchlist(user_email):
    """Fetch user's watchlist from Supabase, return items near target (within 5%)."""
    try:
        # Get user_id from Supabase first
        url = f"{SUPABASE_URL}/rest/v1/watchlist?select=ticker,target_price,note&user_id=eq."
        # We need to look up user_id by email via auth.users — instead query by email join
        # Simpler: use service-role key if available, else skip watchlist personalisation
        # For now return empty list gracefully — watchlist alerts still work in-browser
        return []
    except:
        return []

def _build_telegram_digest(user_email, signals, btc_price):
    """Build Telegram-formatted digest message."""
    now = datetime.utcnow().strftime('%d %b %Y')
    lines = [
        f"📊 *AlphaSignal Morning Digest — {now}*",
        f"━━━━━━━━━━━━━━━━━━━━━━",
    ]

    # BTC summary
    if btc_price:
        lines.append(f"₿ *BTC:* ${btc_price:,.0f}")
        lines.append("")

    # Top signals
    if signals:
        lines.append(f"🔔 *Top Signals (Last 24h)*")
        for i, s in enumerate(signals[:3], 1):
            sev = s.get('severity', 'MEDIUM')
            icon = {'CRITICAL': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡'}.get(sev, '⚪')
            ticker = s.get('ticker', '?').replace('-USD', '')
            sig_type = s.get('type', '')
            price_str = f"@ ${s['price']:,.2f}" if s.get('price') else ''
            ts = s.get('timestamp', '')[:10]
            lines.append(f"{icon} *{ticker}* — {sig_type} {price_str}")
            # Truncate message to 80 chars
            msg = s.get('message', '')
            if msg:
                lines.append(f"   _{msg[:80]}{'...' if len(msg) > 80 else ''}_")
    else:
        lines.append("✅ No signals in the last 24h — markets are quiet.")

    lines += [
        "",
        "━━━━━━━━━━━━━━━━━━━━━━",
        "📱 [Open AlphaSignal Terminal](https://alphasignal.app)",
        "_Unsubscribe: disable alerts in Settings_"
    ]
    return "\n".join(lines)

def _build_discord_digest(user_email, signals, btc_price):
    """Build Discord embed payload."""
    now = datetime.utcnow().strftime('%d %b %Y')
    fields = []

    if btc_price:
        fields.append({"name": "BTC Price", "value": f"`${btc_price:,.0f}`", "inline": True})

    for s in signals[:3]:
        sev = s.get('severity', 'MEDIUM')
        icon = {'CRITICAL': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡'}.get(sev, '⚪')
        ticker = s.get('ticker', '?').replace('-USD', '')
        price_str = f"@ ${s['price']:,.2f}" if s.get('price') else ''
        msg = (s.get('message', '') or '')[:100]
        fields.append({
            "name": f"{icon} {ticker} — {s.get('type','')} {price_str}",
            "value": msg or "No details",
            "inline": False
        })

    if not signals:
        fields.append({"name": "No Signals", "value": "Markets were quiet in the last 24h.", "inline": False})

    return {
        "embeds": [{
            "title": f"📊 Morning Digest — {now}",
            "color": 0x00f2ff,
            "fields": fields,
            "footer": {"text": "AlphaSignal Terminal • alphasignal.app"},
            "timestamp": datetime.utcnow().isoformat()
        }]
    }

def send_digest_to_user(user_email):
    """Build and send the daily digest to a single user via Telegram + Discord."""
    try:
        signals  = _get_top_signals(limit=3)
        btc      = _get_btc_summary()

        # ── Telegram ───────────────────────────────────────────
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if bot_token:
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT telegram_chat_id FROM user_settings WHERE user_email = ?", (user_email,))
                row = c.fetchone()
                conn.close()
                if row and row[0]:
                    msg = _build_telegram_digest(user_email, signals, btc)
                    tg_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                    requests.post(tg_url, json={
                        "chat_id": row[0],
                        "text": msg,
                        "parse_mode": "Markdown",
                        "disable_web_page_preview": False
                    }, timeout=10)
                    print(f"[Digest] Telegram sent to {user_email}")
            except Exception as e:
                print(f"[Digest] Telegram error for {user_email}: {e}")

        # ── Discord ────────────────────────────────────────────
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT discord_webhook FROM user_settings WHERE user_email = ?", (user_email,))
            row = c.fetchone()
            conn.close()
            if row and row[0]:
                payload = _build_discord_digest(user_email, signals, btc)
                requests.post(row[0], json=payload, timeout=10)
                print(f"[Digest] Discord sent to {user_email}")
        except Exception as e:
            print(f"[Digest] Discord error for {user_email}: {e}")

    except Exception as e:
        print(f"[Digest] Fatal error for {user_email}: {e}")

def _get_eligible_users():
    """Return all user emails with alerts enabled and at least one delivery channel."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            SELECT user_email FROM user_settings
            WHERE alerts_enabled = 1
              AND (
                  (telegram_chat_id IS NOT NULL AND telegram_chat_id != '')
                  OR (discord_webhook IS NOT NULL AND discord_webhook != '')
              )
        """)
        rows = [r[0] for r in c.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        print(f"[Digest] Error fetching users: {e}")
        return []

def start_digest_cron():
    """Background thread: sends digest to all eligible users at DIGEST_HOUR_UTC:DIGEST_MINUTE_UTC UTC daily."""
    def _loop():
        print(f"[Digest] Cron started — will send at {DIGEST_HOUR_UTC:02d}:{DIGEST_MINUTE_UTC:02d} UTC daily", flush=True)
        while True:
            try:
                now = datetime.utcnow()
                target = now.replace(hour=DIGEST_HOUR_UTC, minute=DIGEST_MINUTE_UTC, second=0, microsecond=0)
                if now >= target:
                    # Already past today's send time — schedule for tomorrow
                    target += timedelta(days=1)
                wait_seconds = (target - now).total_seconds()
                print(f"[Digest] Next send at {target.strftime('%Y-%m-%d %H:%M UTC')} ({wait_seconds/3600:.1f}h)", flush=True)
                time.sleep(wait_seconds)

                # Send time reached
                users = _get_eligible_users()
                print(f"[Digest] Sending to {len(users)} user(s)...", flush=True)
                for email in users:
                    try:
                        send_digest_to_user(email)
                    except Exception as e:
                        print(f"[Digest] Error for {email}: {e}")

                # Sleep 61 seconds to avoid double-firing at minute boundary
                time.sleep(61)
            except Exception as e:
                print(f"[Digest] Cron error: {e}")
                time.sleep(60)

    t = threading.Thread(target=_loop, daemon=True, name="DigestCron")
    t.start()
    return t


class DigestRoutesMixin:
    """POST /api/digest/send — manual trigger for testing."""
    def handle_digest_send(self, auth_info):
        try:
            user_email = auth_info.get('email')
            if not user_email:
                return self.send_json({'error': 'No email in auth'})
            # Run in background so response is instant
            threading.Thread(target=send_digest_to_user, args=(user_email,), daemon=True).start()
            self.send_json({'success': True, 'message': f'Digest queued for {user_email}'})
        except Exception as e:
            self.send_json({'error': str(e)})
