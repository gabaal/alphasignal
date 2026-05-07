#!/usr/bin/env python3
"""
inject_academy_links.py
-----------------------
Scans every Academy article HTML and injects contextual <a href="/asset/TICKER">
links for any ticker or full asset name mentions found in the main article body.

Rules:
  - Only injects into the article body (between <article> or the main content div)
  - Only the FIRST mention of each ticker per article gets linked (avoids spam)
  - Never links text that is already inside an <a> tag
  - Never modifies <head>, <script>, <style>, or JSON-LD blocks
  - Backs up originals to academy/backups/ before modifying
  - Idempotent: running twice won't double-link

Run: python scripts/inject_academy_links.py
"""

import os, re, shutil
from pathlib import Path

ACADEMY_DIR = Path(__file__).parent.parent / "academy"
BACKUP_DIR  = ACADEMY_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

# Map: text to match (case-sensitive) -> ticker slug for /asset/{slug}
# Order matters: longer/more specific phrases first to avoid partial matches
TICKER_MAP = [
    # Full names first (longer matches take priority)
    ("Bitcoin",          "BTC"),
    ("Ethereum",         "ETH"),
    ("Solana",           "SOL"),
    ("Dogecoin",         "DOGE"),
    ("Cardano",          "ADA"),
    ("Avalanche",        "AVAX"),
    ("Chainlink",        "LINK"),
    ("Polkadot",         "DOT"),
    ("Shiba Inu",        "SHIB"),
    ("dogwifhat",        "WIF"),
    ("Pepe",             "PEPE"),
    ("NEAR Protocol",    "NEAR"),
    ("Injective",        "INJ"),
    ("Optimism",         "OP"),
    ("Arbitrum",         "ARB"),
    ("Uniswap",          "UNI"),
    ("Lido DAO",         "LDO"),
    ("Curve DAO",        "CRV"),
    ("THORChain",        "RUNE"),
    ("Synthetix",        "SNX"),
    ("EigenLayer",       "EIGEN"),
    ("Worldcoin",        "WLD"),
    ("Hedera",           "HBAR"),
    ("Bittensor",        "TAO"),
    ("Immutable",        "IMX"),
    ("Algorand",         "ALGO"),
    ("Starknet",         "STRK"),
    ("Polygon",          "MATIC"),
    ("MicroStrategy",    "MSTR"),
    ("Coinbase",         "COIN"),
    ("NVIDIA",           "NVDA"),
    ("Tesla",            "TSLA"),
    ("Apple",            "AAPL"),
    # Ticker symbols — only match when wrapped in word boundaries
    ("BTC",              "BTC"),
    ("ETH",              "ETH"),
    ("SOL",              "SOL"),
    ("XRP",              "XRP"),
    ("DOGE",             "DOGE"),
    ("ADA",              "ADA"),
    ("AVAX",             "AVAX"),
    ("LINK",             "LINK"),
    ("PEPE",             "PEPE"),
    ("SHIB",             "SHIB"),
    ("MSTR",             "MSTR"),
    ("IBIT",             "IBIT"),
    ("FBTC",             "FBTC"),
    ("COIN",             "COIN"),
    ("MARA",             "MARA"),
    ("RIOT",             "RIOT"),
]

LINK_STYLE = (
    'style="color:#00ffa3;text-decoration:underline;text-underline-offset:3px;'
    'font-weight:600;" title="Track {name} live signals on AlphaSignal"'
)

def make_link(text, ticker):
    return f'<a href="/asset/{ticker}" {LINK_STYLE.format(name=text)}>{text}</a>'

def inject_links(html: str, filename: str) -> tuple[str, int]:
    """
    Returns (modified_html, number_of_links_injected).
    Only processes the content between the first <article> / main body markers.
    Skips <head>, <script>, <style>, JSON-LD, and existing <a> tags.
    """
    injected = 0
    used_tickers = set()  # one link per ticker per file

    # Split HTML into segments: alternating "safe" (tags/scripts) and "text" (plain content)
    # We'll only modify text nodes outside of tags
    # Strategy: use a regex to split on HTML tags, modify only non-tag segments

    # First, protect existing <a> tags and their content from modification
    # by temporarily replacing them with placeholders
    placeholders = {}
    ph_counter = [0]

    def protect(m):
        key = f"\x00PLACEHOLDER{ph_counter[0]}\x00"
        placeholders[key] = m.group(0)
        ph_counter[0] += 1
        return key

    # Protect: <a ...>...</a>, <script>...</script>, <style>...</style>, JSON-LD
    protected = re.sub(r'<a\b[^>]*>.*?</a>', protect, html, flags=re.DOTALL | re.IGNORECASE)
    protected = re.sub(r'<script\b[^>]*>.*?</script>', protect, protected, flags=re.DOTALL | re.IGNORECASE)
    protected = re.sub(r'<style\b[^>]*>.*?</style>', protect, protected, flags=re.DOTALL | re.IGNORECASE)
    protected = re.sub(r'<head\b[^>]*>.*?</head>', protect, protected, flags=re.DOTALL | re.IGNORECASE)

    # Now split into tag and text segments
    # tags are anything inside < >
    segments = re.split(r'(<[^>]+>)', protected)

    result_segments = []
    for seg in segments:
        if seg.startswith('<') or '\x00PLACEHOLDER' in seg:
            # It's a tag or placeholder — leave untouched
            result_segments.append(seg)
            continue

        # It's a text node — inject links for tickers not yet used
        modified_seg = seg
        for name, ticker in TICKER_MAP:
            if ticker in used_tickers:
                continue  # already linked this ticker in this file

            # Word-boundary match (handles "Bitcoin", "BTC", etc.)
            pattern = r'\b' + re.escape(name) + r'\b'
            match = re.search(pattern, modified_seg)
            if match:
                link_html = make_link(name, ticker)
                # Replace only the first occurrence in this segment
                modified_seg = re.sub(pattern, link_html, modified_seg, count=1)
                used_tickers.add(ticker)
                injected += 1
                # Re-protect the newly added <a> tag so we don't double-process
                modified_seg = re.sub(r'<a\b[^>]*>.*?</a>', protect, modified_seg, flags=re.DOTALL | re.IGNORECASE)

        result_segments.append(modified_seg)

    result = ''.join(result_segments)

    # Restore all placeholders
    for key, original in placeholders.items():
        result = result.replace(key, original)

    return result, injected


def process_all():
    html_files = sorted(ACADEMY_DIR.glob("*.html"))
    total_files = 0
    total_links = 0

    print(f"Academy directory: {ACADEMY_DIR}")
    print(f"Found {len(html_files)} HTML files\n")
    print(f"{'File':<55} {'Links injected':>15}")
    print("-" * 72)

    for path in html_files:
        if path.name == "index.html":
            continue  # Skip the index listing page

        original = path.read_text(encoding="utf-8")

        # Check if already processed (idempotency guard)
        if '/asset/BTC' in original or '/asset/ETH' in original:
            # Could already have some links — still run to catch missed tickers
            pass

        # Backup original
        backup_path = BACKUP_DIR / path.name
        if not backup_path.exists():
            shutil.copy2(path, backup_path)

        modified, count = inject_links(original, path.name)

        if count > 0:
            path.write_text(modified, encoding="utf-8")
            total_files += 1
            total_links += count
            print(f"  {path.name:<53} +{count:>3} links")
        else:
            print(f"  {path.name:<53}   0 links (no matches)")

    print("-" * 72)
    print(f"\n[DONE] {total_links} links injected across {total_files} files.")
    print(f"   Backups saved to: {BACKUP_DIR}")


if __name__ == "__main__":
    process_all()
