"""
AlphaSignal Telegram Bot
────────────────────────
Runs as a background long-polling thread.

Commands:
  /start <token>  — Link your AlphaSignal account (token = registered email base64)
  /link  <email>  — Alternative: link by email directly (dev convenience)
  /status         — Show linked account and alert status
  /unsub          — Disable Telegram alerts (keeps account linked)
  /resub          — Re-enable Telegram alerts
  /help           — List available commands

Flow:
  1. User opens bot (t.me/<botname>), sends /start
  2. Bot asks for their AlphaSignal email
  3. User replies with email — bot saves chat_id to user_settings
  4. Morning digest + live alerts now reach them on Telegram
"""

import os
import sqlite3
import threading
import time
import requests
from datetime import datetime
from backend.database import DB_PATH

# ── State: pending link sessions ─────────────────────────────────────────────
# chat_id -> 'awaiting_email'
_PENDING = {}
_PENDING_LOCK = threading.Lock()

BOT_URL_BASE = None   # set at start time from env

# ─────────────────────────────────────────────────────────────────────────────
# Telegram API helpers
# ─────────────────────────────────────────────────────────────────────────────

def _bot_url(method):
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    return f"https://api.telegram.org/bot{token}/{method}"


def _send(chat_id, text, parse_mode="Markdown"):
    try:
        requests.post(_bot_url("sendMessage"), json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True
        }, timeout=10)
    except Exception as e:
        print(f"[TelegramBot] Send error: {e}")


def _get_updates(offset):
    try:
        r = requests.get(_bot_url("getUpdates"), params={
            "offset": offset,
            "timeout": 20,
            "allowed_updates": ["message"]
        }, timeout=30)
        if r.status_code == 200:
            return r.json().get("result", [])
    except Exception as e:
        print(f"[TelegramBot] getUpdates error: {e}")
    return []


# ─────────────────────────────────────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────────────────────────────────────

def _find_user_by_email(email):
    """Return (user_email, alerts_enabled, telegram_chat_id) or None."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            "SELECT user_email, alerts_enabled, telegram_chat_id FROM user_settings WHERE user_email = ?",
            (email.lower().strip(),)
        )
        row = c.fetchone()
        conn.close()
        return row
    except:
        return None


def _find_user_by_chat_id(chat_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            # B7: read telegram_alerts_enabled (Telegram-only mute) not global alerts_enabled
            "SELECT user_email, COALESCE(telegram_alerts_enabled, alerts_enabled, 1) FROM user_settings WHERE telegram_chat_id = ?",
            (str(chat_id),)
        )
        row = c.fetchone()
        conn.close()
        return row
    except:
        return None


def _upsert_chat_id(email, chat_id, alerts_enabled=1):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            INSERT INTO user_settings (user_email, telegram_chat_id, alerts_enabled)
            VALUES (?, ?, ?)
            ON CONFLICT(user_email) DO UPDATE SET
                telegram_chat_id = excluded.telegram_chat_id,
                alerts_enabled   = excluded.alerts_enabled
        """, (email.lower().strip(), str(chat_id), alerts_enabled))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"[TelegramBot] DB upsert error: {e}")
        return False


def _set_telegram_alerts_enabled(chat_id, enabled):
    """B7: toggles only telegram_alerts_enabled — leaves global alerts_enabled intact.
    This means /unsub silences Telegram only; Discord and terminal alerts stay on."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            "UPDATE user_settings SET telegram_alerts_enabled = ? WHERE telegram_chat_id = ?",
            (1 if enabled else 0, str(chat_id))
        )
        conn.commit()
        conn.close()
        return c.rowcount > 0
    except Exception as e:
        print(f"[TelegramBot] alerts toggle error: {e}")
        return False


def _email_is_registered(email):
    """B8: returns True if this email already has a row in user_settings (web login happened)."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT 1 FROM user_settings WHERE user_email = ? LIMIT 1", (email.lower().strip(),))
        row = c.fetchone()
        conn.close()
        return row is not None
    except:
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Command handlers
# ─────────────────────────────────────────────────────────────────────────────

def _handle_start(chat_id, args):
    existing = _find_user_by_chat_id(chat_id)
    if existing:
        email, alerts_on = existing
        _send(chat_id, (
            f"✅ Already linked to *{email}*\n"
            f"Alerts: {'🟢 ON' if alerts_on else '🔴 OFF'}\n\n"
            "Use /status to check or /unsub to disable alerts."
        ))
        return

    with _PENDING_LOCK:
        _PENDING[chat_id] = 'awaiting_email'

    _send(chat_id, (
        "👋 Welcome to *AlphaSignal Terminal*!\n\n"
        "To receive your morning digest and live alerts, "
        "please reply with the *email address* you used to register on AlphaSignal.\n\n"
        "_(e.g. `trader@example.com`)_"
    ))


def _handle_status(chat_id):
    row = _find_user_by_chat_id(chat_id)
    if not row:
        _send(chat_id, (
            "❌ Not linked yet.\n\n"
            "Send /start to connect your AlphaSignal account."
        ))
        return
    email, alerts_on = row
    _send(chat_id, (
        f"📊 *AlphaSignal — Account Status*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📧 Email: `{email}`\n"
        f"🔔 Alerts: {'🟢 Enabled' if alerts_on else '🔴 Disabled'}\n"
        f"🕐 Digest: Daily at 07:30 UTC\n\n"
        "Use /unsub to pause or /resub to re-enable."
    ))


def _handle_unsub(chat_id):
    # B7: use telegram-specific toggle — doesn't affect Discord or terminal alerts
    ok = _set_telegram_alerts_enabled(chat_id, False)
    if ok:
        _send(chat_id, (
            "🔕 *Telegram alerts paused.*\n\n"
            "You won't receive Telegram notifications until you send /resub.\n"
            "_(Discord and terminal alerts are unaffected.)_"
        ))
    else:
        _send(chat_id, "❌ Couldn't find your account. Send /start first.")


def _handle_resub(chat_id):
    # B7: re-enable Telegram-specific alerts only
    ok = _set_telegram_alerts_enabled(chat_id, True)
    if ok:
        _send(chat_id, (
            "🔔 *Telegram alerts re-enabled!*\n\n"
            "You'll receive your morning digest at 07:30 UTC and live signal alerts."
        ))
    else:
        _send(chat_id, "❌ Couldn't find your account. Send /start first.")


def _handle_help(chat_id):
    _send(chat_id, (
        "📖 *AlphaSignal Bot — Commands*\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "/start   — Link your account\n"
        "/status  — Check link & alert status\n"
        "/unsub   — Pause all Telegram alerts\n"
        "/resub   — Re-enable Telegram alerts\n"
        "/help    — Show this message\n\n"
        "🌐 [Open Terminal](https://alphasignal.digital)"
    ))


def _handle_email_reply(chat_id, email):
    """Called when user is in 'awaiting_email' state and sends a plaintext message."""
    email = email.strip().lower()
    if '@' not in email or '.' not in email.split('@')[-1]:
        _send(chat_id, "⚠️ That doesn't look like a valid email. Please try again.")
        return

    # B8: Verify the email is a registered AlphaSignal account before linking.
    # This prevents arbitrary email takeover (a user typing someone else's email).
    if not _email_is_registered(email):
        _send(chat_id, (
            "❌ No AlphaSignal account found for `" + email + "`\n\n"
            "Please register at [alphasignal.digital](https://alphasignal.digital) first, "
            "then come back and send /start."
        ))
        return

    ok = _upsert_chat_id(email, chat_id, alerts_enabled=1)
    if ok:
        with _PENDING_LOCK:
            _PENDING.pop(chat_id, None)
        _send(chat_id, (
            f"✅ *Account linked!*\n\n"
            f"📧 `{email}`\n\n"
            "You'll receive:\n"
            "• 🌅 Morning digest at *07:30 UTC* daily\n"
            "• ⚡ Live signal alerts when high-severity signals fire\n\n"
            "Use /status to check or /unsub to pause Telegram alerts at any time.\n\n"
            "🚀 [Open AlphaSignal Terminal](https://alphasignal.digital)"
        ))
        print(f"[TelegramBot] Linked {email} -> chat_id {chat_id}")
    else:
        _send(chat_id, "❌ Failed to save your details. Please try again later.")


# ─────────────────────────────────────────────────────────────────────────────
# Message dispatcher
# ─────────────────────────────────────────────────────────────────────────────

def _dispatch(message):
    chat_id = message.get("chat", {}).get("id")
    text = (message.get("text") or "").strip()
    if not chat_id or not text:
        return

    # Check pending state first
    with _PENDING_LOCK:
        state = _PENDING.get(chat_id)

    if state == 'awaiting_email' and not text.startswith('/'):
        _handle_email_reply(chat_id, text)
        return

    # Command routing
    cmd = text.split()[0].split('@')[0].lower()  # strip @botname suffix
    args = text[len(cmd):].strip()

    if cmd == '/start':
        _handle_start(chat_id, args)
    elif cmd == '/status':
        _handle_status(chat_id)
    elif cmd == '/unsub':
        _handle_unsub(chat_id)
    elif cmd == '/resub':
        _handle_resub(chat_id)
    elif cmd == '/help':
        _handle_help(chat_id)
    else:
        # Unknown command or plain text with no pending state
        _send(chat_id, (
            "🤖 Send /start to link your account, or /help for commands."
        ))


# ─────────────────────────────────────────────────────────────────────────────
# Main polling loop
# ─────────────────────────────────────────────────────────────────────────────

def run_bot():
    """Long-poll loop — runs forever in a daemon thread."""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token:
        print(f"[TelegramBot] WARN: TELEGRAM_BOT_TOKEN not set -- bot disabled.", flush=True)
        return

    # Confirm bot identity
    try:
        r = requests.get(_bot_url("getMe"), timeout=10)
        if r.status_code == 200:
            me = r.json().get("result", {})
            print(f"[TelegramBot] OK: Connected as @{me.get('username')} ({me.get('first_name')})", flush=True)
        else:
            print(f"[TelegramBot] FAIL: getMe failed: {r.text}", flush=True)
            return
    except Exception as e:
        print(f"[TelegramBot] ERR: Connection error: {e}", flush=True)
        return

    offset = 0
    print("[TelegramBot] START: Polling for updates...", flush=True)

    while True:
        try:
            updates = _get_updates(offset)
            for update in updates:
                offset = update["update_id"] + 1
                msg = update.get("message")
                if msg:
                    _dispatch(msg)
        except Exception as e:
            print(f"[TelegramBot] Poll error: {e}", flush=True)
            time.sleep(5)


def start_bot():
    """Start the bot in a background daemon thread."""
    t = threading.Thread(target=run_bot, daemon=True, name="TelegramBot")
    t.start()
    return t
