#!/usr/bin/env python3
"""
dedupe_academy_scripts.py
--------------------------
One-shot cleanup: removes duplicate app script blocks from academy pages.
Keeps only the FIRST occurrence of the CDN+app script block.
"""

import re
from pathlib import Path

ACADEMY_DIR = Path(__file__).parent.parent / "academy"

# Matches a full CDN+app script block starting from the CDN comment or tape.js
SCRIPT_BLOCK_RE = re.compile(
    r'(?:<!--\s*CDN dependencies\s*-->|<script src=["\'](?:tape\.js|https://cdn\.jsdelivr)["\'])'
    r'.*?'
    r'<script src=["\'][^"\']*(?:router\.js|ai-chat\.js)[^"\']*["\'][^>]*>(?:.*?)?</script>',
    re.DOTALL
)

NEW_BLOCK = """\n    <!-- CDN dependencies -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0" defer></script>
    <script src="https://unpkg.com/lightweight-charts@3.8.0/dist/lightweight-charts.standalone.production.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js" defer></script>
    <script src="https://s3.tradingview.com/tv.js" async></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>
    <script src="https://unpkg.com/d3-sankey@0.12.3/dist/d3-sankey.min.js" defer></script>
    <script src="https://js.stripe.com/v3/" defer></script>
    <!-- App core -->
    <script src="/js/utils.js?v=2.86" defer></script>
    <script src="/js/auth.js?v=2.87" defer></script>
    <script src="/js/core.js?v=2.80" defer></script>
    <script src="/js/heatmap_engine.js?v=2.80" defer></script>
    <script src="/js/charts.js?v=2.80" defer></script>
    <!-- Views -->
    <script src="/js/views/hub-nav-v2.js?v=2.80" defer></script>
    <script src="/js/views/global-markets.js?v=2.80" defer></script>
    <script src="/js/views/signals.js?v=2.80" defer></script>
    <script src="/js/views/performance.js?v=2.80" defer></script>
    <script src="/js/views/macro-intel.js?v=2.80" defer></script>
    <script src="/js/views/whales.js?v=2.80" defer></script>
    <script src="/js/views/block-radar.js?v=2.80" defer></script>
    <script src="/js/views/macro-analytics.js?v=2.80" defer></script>
    <script src="/js/views/strategy.js?v=2.80" defer></script>
    <script src="/js/views/portfolio.js?v=2.80" defer></script>
    <script src="/js/views/narrative.js?v=2.80" defer></script>
    <script src="/js/views/trade-lab.js?v=2.80" defer></script>
    <script src="/js/views/audit.js?v=2.80" defer></script>
    <script src="/js/views/liquidity-archive.js?v=2.80" defer></script>
    <script src="/js/views/gex-profile.js?v=2.80" defer></script>
    <script src="/js/views/volume-profile.js?v=2.80" defer></script>
    <script src="/js/views/alerts-archive.js?v=2.80" defer></script>
    <script src="/js/views/onchain.js?v=2.80" defer></script>
    <script src="/js/views/command-center-v2.js?v=2.85" defer></script>
    <script src="/js/views/power-trio.js?v=2.80" defer></script>
    <script src="/js/views/trade-setup.js?v=2.80" defer></script>
    <script src="/js/views/trade-plan.js?v=2.80" defer></script>
    <script src="/js/views/home.js?v=2.82" defer></script>
    <script src="/js/views/algo-hub.js?v=2.80"></script>
    <script src="/js/views/algo-params.js?v=2.80" defer></script>
    <script src="/js/views/explain.js?v=2.80" defer></script>
    <script src="/js/views/my-terminal.js?v=2.80"></script>
    <script src="/js/views/signal-permalink.js?v=2.80" defer></script>
    <script src="/js/views/onboarding.js?v=2.86" defer></script>
    <script src="/js/views/price-alerts.js?v=2.80" defer></script>
    <script src="/js/views/signal-leaderboard.js?v=2.80" defer></script>
    <script src="/js/views/market-brief.js?v=2.80" defer></script>
    <script src="/js/views/exchange-keys.js?v=2.80" defer></script>
    <script src="/js/views/webhooks.js?v=2.80" defer></script>
    <script src="/js/docs-a.js?v=2.80" defer></script>
    <script src="/js/docs-b.js?v=2.80" defer></script>
    <script src="/js/docs-c.js?v=2.80" defer></script>
    <script src="/js/export.js?v=2.80" defer></script>
    <script src="/js/seo-meta.js?v=2.80" defer></script>
    <script src="/js/views/academy_videos_data.js?v=2.80" defer></script>
    <script src="/js/views/academy-watch.js?v=2.80" defer></script>
    <script src="/js/views/derivatives.js?v=2.80" defer></script>
    <script src="/js/views/pattern-predictor.js?v=2.82" defer></script>
    <script src="/js/main.js?v=2.84" defer></script>
    <script src="/js/router.js?v=2.84" defer></script>
    <script src="/js/ai-chat.js?v=2.80" defer></script>"""

def dedupe(path):
    content = path.read_bytes().decode('utf-8', errors='replace')
    matches = list(SCRIPT_BLOCK_RE.finditer(content))
    if len(matches) <= 1:
        return False  # nothing to dedupe

    # Remove ALL matches, insert one canonical block at the position of the first match
    first_start = matches[0].start()
    last_end    = matches[-1].end()
    content = content[:first_start] + NEW_BLOCK + content[last_end:]
    path.write_text(content, encoding='utf-8')
    return True

if __name__ == "__main__":
    html_files = sorted(ACADEMY_DIR.glob("*.html"))
    deduped = 0
    for path in html_files:
        if path.name == "index.html":
            continue
        if dedupe(path):
            print(f"  deduped: {path.name}")
            deduped += 1
        else:
            print(f"  ok:      {path.name}")
    print(f"\n[DONE] {deduped} files deduped.")
