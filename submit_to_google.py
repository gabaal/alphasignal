#!/usr/bin/env python3
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import socket, struct, datetime, time as _time

def _ntp_utcnow():
    """Return real UTC datetime from NTP, bypassing the skewed system clock."""
    try:
        msg = b'\x1b' + 47 * b'\0'
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(4)
            s.sendto(msg, ("pool.ntp.org", 123))
            data, _ = s.recvfrom(1024)
        ntp_ts = struct.unpack('!12I', data)[10] - 2208988800
        offset = ntp_ts - _time.time()
        if abs(offset) > 5:
            print(f"[INFO] System clock off by {offset:+.0f}s - NTP correction applied")
        return datetime.datetime.fromtimestamp(ntp_ts, tz=datetime.timezone.utc).replace(tzinfo=None)
    except Exception as e:
        print(f"[WARN] NTP fetch failed ({e}), using system clock")
        return datetime.datetime.utcnow()

# Patch google.auth._helpers.utcnow BEFORE google-auth generates any JWT
# This is the exact internal function that stamps iat/exp in the token
import importlib
_helpers_mod = importlib.import_module("google.auth._helpers")
_helpers_mod.utcnow = _ntp_utcnow

import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SERVICE_ACCOUNT_FILE = "service_account.json"
SCOPES = ["https://www.googleapis.com/auth/indexing"]
INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish"

URLS = [
    # Academy articles (28 pages)
    "https://alphasignal.digital/academy/on-chain-whale-tracking",
    "https://alphasignal.digital/academy/fundamental-mvrv-z-score",
    "https://alphasignal.digital/academy/statistical-mean-reversion-z-scores",
    "https://alphasignal.digital/academy/understanding-gamma-exposure-gex",
    "https://alphasignal.digital/academy/options-flow-dark-pools",
    "https://alphasignal.digital/academy/options-implied-volatility-smile",
    "https://alphasignal.digital/academy/order-book-liquidity-heatmaps",
    "https://alphasignal.digital/academy/vwap-institutional-execution",
    "https://alphasignal.digital/academy/volume-profile-market-profile",
    "https://alphasignal.digital/academy/crypto-liquidations-tracker",
    "https://alphasignal.digital/academy/capital-sector-rotation",
    "https://alphasignal.digital/academy/stablecoin-macro-liquidity-flows",
    "https://alphasignal.digital/academy/algorithmic-ai-trade-signals",
    "https://alphasignal.digital/academy/cme-futures-gaps-bitcoin",
    "https://alphasignal.digital/academy/ai-narrative-velocity-sentiment",
    "https://alphasignal.digital/academy/hidden-markov-market-regimes",
    "https://alphasignal.digital/academy/institutional-yield-farming",
    "https://alphasignal.digital/academy/token-unlocks-supply-dilution",
    "https://alphasignal.digital/academy/mastering-risk-to-reward-ratio",
    "https://alphasignal.digital/academy/trading-psychology-fomo-panic",
    "https://alphasignal.digital/academy/support-and-resistance-fundamentals",
    "https://alphasignal.digital/academy/position-sizing-and-leverage",
    "https://alphasignal.digital/academy/trading-moving-average-crossovers",
    "https://alphasignal.digital/academy/rsi-macd-momentum-oscillators",
    "https://alphasignal.digital/academy/fibonacci-retracements-crypto",
    "https://alphasignal.digital/academy/breakout-trading-strategies",
    "https://alphasignal.digital/academy/how-to-set-proper-stop-loss",
    "https://alphasignal.digital/academy/importance-of-trading-journal",
    # Core app pages
    "https://alphasignal.digital/",
    "https://alphasignal.digital/?view=signals",
    "https://alphasignal.digital/?view=market-brief-hub",
    "https://alphasignal.digital/?view=etf-flows",
    "https://alphasignal.digital/?view=whales",
    "https://alphasignal.digital/?view=onchain",
    "https://alphasignal.digital/?view=options-flow",
    "https://alphasignal.digital/?view=macro-calendar",
    "https://alphasignal.digital/?view=liquidations",
    "https://alphasignal.digital/?view=gex-profile",
    "https://alphasignal.digital/?view=backtester-v2",
    "https://alphasignal.digital/?view=alpha-score",
    "https://alphasignal.digital/?view=regime",
    "https://alphasignal.digital/?view=rotation",
    "https://alphasignal.digital/?view=narrative",
    "https://alphasignal.digital/?view=portfolio-optimizer",
    "https://alphasignal.digital/?view=help",
]

def get_credentials():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    creds.refresh(Request())
    return creds

def submit_url(session, url, token):
    payload = {"url": url, "type": "URL_UPDATED"}
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    response = session.post(INDEXING_API_URL, headers=headers, json=payload)
    return response.status_code, response.json()

def main():
    print("=" * 60)
    print("  AlphaSignal - Google Indexing API Submission")
    print("=" * 60)

    try:
        creds = get_credentials()
        token = creds.token
        print(f"\n[OK] Authenticated as: {creds.service_account_email}\n")
    except Exception as e:
        print(f"\n[ERROR] Auth failed: {e}")
        print("  - Check service_account.json is in the alphasignal/ folder")
        print("  - Check the service account was added as Owner in Search Console")
        return

    session = requests.Session()
    success, failed = 0, 0
    errors = []

    print(f"Submitting {len(URLS)} URLs...\n")

    for i, url in enumerate(URLS, 1):
        status, resp = submit_url(session, url, token)
        ok = status == 200
        icon = "[OK]  " if ok else "[FAIL]"
        short = url.replace("https://alphasignal.digital", "")
        print(f"  [{i:02d}/{len(URLS)}] {icon} {short}")
        if ok:
            success += 1
        else:
            failed += 1
            errors.append({"url": url, "error": resp})

    print("\n" + "=" * 60)
    print(f"  COMPLETE: {success} submitted OK   {failed} failed")
    print("=" * 60)

    if errors:
        print("\nFailed URLs and reasons:")
        for r in errors:
            print(f"  - {r['url']}")
            print(f"    {r['error']}")

    print("\nGoogle will crawl these pages within 24-48 hours.")
    print("Monitor progress: Search Console > Coverage\n")

if __name__ == "__main__":
    main()
