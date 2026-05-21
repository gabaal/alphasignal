"""
tweet_recap.py
--------------
AlphaSignal daily Twitter recap generator.

Run from the project root:
    python tools/tweet_recap.py

Prints 2-3 ready-to-copy tweet options based on the last 24 hours of
signals in alerts_history. Just pick the one you like and paste into Twitter.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')  # needed on Windows

import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
DB_PATH    = Path(__file__).parent.parent / "backend" / "alphasignal.db"
HOURS_BACK = 24          # look-back window
MAX_TWEET  = 280         # hard Twitter limit
URL        = "alphasignal.digital"
# ─────────────────────────────────────────────────────────────────────────────

SEVERITY_EMOJI = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "⚪"}
DIR_EMOJI      = {"LONG": "📈", "SHORT": "📉", "NEUTRAL": "➡️"}
TYPE_LABEL     = {
    "ML_ALPHA_PREDICTION": "ML Alpha",
    "RSI_OVERSOLD":        "RSI Oversold",
    "RSI_OVERBOUGHT":      "RSI Overbought",
    "MACD_BULLISH_CROSS":  "MACD Bullish Cross",
    "MACD_BEARISH_CROSS":  "MACD Bearish Cross",
    "VOLUME_SPIKE":        "Volume Spike",
    "WHALE_TXN":           "Whale Transaction",
    "DEPEG":               "Depeg Alert",
    "CME_GAP":             "CME Gap",
}


def fmt_price(p: float) -> str:
    if p is None:
        return "N/A"
    if p >= 1_000:
        return f"${p:,.0f}"
    if p >= 1:
        return f"${p:.2f}"
    return f"${p:.4f}"


def sym(ticker: str) -> str:
    return ticker.replace("-USD", "").replace("-USDT", "")


def fetch_signals(hours: int):
    since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    conn  = sqlite3.connect(DB_PATH)
    c     = conn.cursor()
    # One row per unique ticker+direction (best severity first)
    c.execute("""
        SELECT
            type, ticker, severity, price, timestamp,
            z_score, alpha, direction, status,
            exit_price, final_roi, max_roi
        FROM alerts_history
        WHERE timestamp > ?
        GROUP BY ticker, direction
        ORDER BY
            CASE severity
                WHEN 'critical' THEN 1
                WHEN 'high'     THEN 2
                WHEN 'medium'   THEN 3
                ELSE 4
            END,
            ABS(COALESCE(alpha, 0)) DESC
    """, (since,))
    rows = c.fetchall()
    conn.close()
    return rows


def closed_outcomes(hours: int):
    """Signals that closed in the window with a known ROI."""
    since = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    conn  = sqlite3.connect(DB_PATH)
    c     = conn.cursor()
    c.execute("""
        SELECT ticker, direction, price, exit_price, final_roi, type, severity
        FROM alerts_history
        WHERE closed_at > ?
          AND final_roi IS NOT NULL
          AND exit_price IS NOT NULL
        ORDER BY ABS(final_roi) DESC
        LIMIT 5
    """, (since,))
    rows = c.fetchall()
    conn.close()
    return rows


# ── Tweet builders ────────────────────────────────────────────────────────────

def tweet_signal_recap(signals):
    """Tweet 1: best signals fired in the last 24h."""
    if not signals:
        return None

    # Deduplicate tickers, keep top 4
    seen   = set()
    top    = []
    for row in signals:
        tk = sym(row[1])
        if tk not in seen:
            seen.add(tk)
            top.append(row)
        if len(top) == 4:
            break

    lines = ["🤖 AlphaSignal fired in the last 24h:\n"]
    for sig_type, ticker, severity, price, ts, z_score, alpha, direction, *_ in top:
        s_em  = SEVERITY_EMOJI.get(severity, "⚪")
        d_em  = DIR_EMOJI.get(direction, "➡️")
        label = TYPE_LABEL.get(sig_type, sig_type.replace("_", " ").title())
        z_str = f" | Z={z_score:+.2f}" if z_score else ""
        a_str = f" | α={alpha:+.1f}%"  if alpha  else ""
        lines.append(f"{s_em}{d_em} {sym(ticker)} — {label}{z_str}{a_str}")

    total   = len(signals)
    uniq    = len(set(sym(r[1]) for r in signals))
    lines.append(f"\n{total} signal(s) across {uniq} asset(s).")
    lines.append(f"\nSee them all → {URL} 🔍")

    return "\n".join(lines)


def tweet_proof(outcomes):
    """Tweet 2: closed trade results — the most credibility-building post."""
    if not outcomes:
        return None

    best = outcomes[0]
    ticker, direction, entry, exit_p, roi, sig_type, severity = best

    d_em   = DIR_EMOJI.get(direction, "➡️")
    s_em   = SEVERITY_EMOJI.get(severity, "⚪")
    label  = TYPE_LABEL.get(sig_type, sig_type.replace("_", " ").title())
    result = "✅ WIN" if roi and roi > 0 else "❌ LOSS"
    roi_s  = f"{roi:+.2f}%" if roi is not None else "pending"

    lines = [
        f"{result} {d_em} {sym(ticker)}",
        f"",
        f"Signal: {s_em} {label}",
        f"Entry:  {fmt_price(entry)}",
        f"Exit:   {fmt_price(exit_p)}",
        f"ROI:    {roi_s}",
        f"",
        f"All signals tracked in real time → {URL}",
    ]

    # Add other outcomes as a brief footnote if room
    if len(outcomes) > 1:
        others = ", ".join(
            f"{sym(r[0])} {r[4]:+.1f}%" for r in outcomes[1:4] if r[4] is not None
        )
        if others:
            footnote = f"\nAlso closed: {others}"
            candidate = "\n".join(lines) + footnote
            if len(candidate) <= MAX_TWEET:
                lines.append(footnote)

    return "\n".join(lines)


def tweet_stats(signals, hours=24):
    """Tweet 3: engine stats — great for credibility / curiosity hooks."""
    if not signals:
        return None

    total      = len(signals)
    uniq       = len(set(sym(r[1]) for r in signals))
    criticals  = sum(1 for r in signals if r[2] == "critical")
    longs      = sum(1 for r in signals if r[7] == "LONG")
    shorts     = sum(1 for r in signals if r[7] == "SHORT")
    ml_count   = sum(1 for r in signals if r[0] == "ML_ALPHA_PREDICTION")

    bias = "bullish 📈" if longs > shorts else "bearish 📉" if shorts > longs else "neutral ➡️"

    lines = [
        f"📊 AlphaSignal engine stats — last {hours}h:",
        f"",
        f"Signals fired:   {total} ({uniq} assets)",
        f"Critical alerts: {criticals}",
        f"ML predictions:  {ml_count}",
        f"Market bias:     {bias} ({longs}L / {shorts}S)",
        f"",
        f"Filters remove noise. Only high-conviction signals reach you.",
        f"→ {URL}",
    ]
    return "\n".join(lines)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"\n{'='*60}")
    print(f"  AlphaSignal Tweet Generator — last {HOURS_BACK}h")
    print(f"{'='*60}\n")

    signals  = fetch_signals(HOURS_BACK)
    outcomes = closed_outcomes(HOURS_BACK)

    tweets = [
        ("TWEET 1 - Signal Recap (best for engagement)",
         tweet_signal_recap(signals)),
        ("TWEET 2 - Proof / Result (best for trust)",
         tweet_proof(outcomes)),
        ("TWEET 3 - Engine Stats (best for curiosity)",
         tweet_stats(signals, HOURS_BACK)),
    ]

    any_printed = False
    for label, body in tweets:
        if not body:
            continue
        char_count = len(body)
        over = " !! OVER LIMIT - trim before posting!" if char_count > MAX_TWEET else ""
        print(f"--- {label} ---")
        print(f"   ({char_count}/{MAX_TWEET} chars){over}\n")
        print(body)
        print()
        any_printed = True

    if not any_printed:
        print("No signals found in the last 24 hours. Try increasing HOURS_BACK.")

    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
