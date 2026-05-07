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

import os

# --- Static + View pages ---
URLS = [
    "https://alphasignal.digital/",
    "https://alphasignal.digital/academy",
]

# --- pSEO Asset landing pages (all 81 tickers from sitemap) ---
ASSET_TICKERS = [
    # Tier 1 - highest priority
    'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'BNB', 'ADA', 'AVAX', 'LINK', 'DOT',
    'PEPE', 'SHIB', 'WIF', 'BONK', 'FLOKI',
    'MSTR', 'IBIT', 'FBTC', 'COIN', 'MARA', 'RIOT',
    # Tier 2 - mid cap / DeFi
    'NEAR', 'ATOM', 'TON', 'INJ', 'SEI', 'OP', 'ARB', 'SUI', 'APT', 'LTC',
    'TRX', 'UNI', 'AAVE', 'MKR', 'LDO', 'CRV', 'RUNE', 'SNX', 'JTO', 'EIGEN',
    'FET', 'RENDER', 'OCEAN', 'WLD', 'PYTH',
    'ARKB', 'BITO', 'BITB', 'HODL', 'BTCO', 'EZBC',
    'CLSK', 'IREN', 'WULF', 'CORZ', 'HUT', 'BTBT', 'CIFR', 'BTDR',
    'HOOD', 'VIRT',
    # Tier 3 - small cap / narrative
    'HBAR', 'TRUMP', 'POPCAT', 'PNUT', 'ACT', 'MOODENG', 'GOAT', 'FARTCOIN',
    'TAO', 'IMX', 'ALGO', 'STRK', 'WBTC', 'STX', 'MATIC',
    'NVDA', 'TSLA', 'AAPL', 'SPY',
]
for _t in ASSET_TICKERS:
    URLS.append(f"https://alphasignal.digital/asset/{_t}")

# --- Academy articles ---
if os.path.exists("academy"):
    for f in os.listdir("academy"):
        if f.endswith(".html"):
            URLS.append(f"https://alphasignal.digital/academy/{f[:-5]}")

if os.path.exists("docs"):
    for f in os.listdir("docs"):
        if f.endswith(".html"):
            URLS.append(f"https://alphasignal.digital/docs/{f[:-5]}")

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

    # Also ping Google's sitemap endpoint for good measure
    try:
        ping = requests.get(
            "https://www.google.com/ping",
            params={"sitemap": "https://alphasignal.digital/sitemap.xml"},
            timeout=5
        )
        print(f"\n[Sitemap Ping] Google notified of sitemap update: HTTP {ping.status_code}")
    except Exception as pe:
        print(f"\n[Sitemap Ping] Failed: {pe}")

    print("\nGoogle will crawl these pages within 24-48 hours.")
    print("Monitor progress: Search Console > Coverage\n")

if __name__ == "__main__":
    main()
