import os
import datetime

# Core App Pages
core_urls = [
    "https://alphasignal.digital/",
    "https://alphasignal.digital/home",
    "https://alphasignal.digital/command-center",
    "https://alphasignal.digital/ask-terminal",
    "https://alphasignal.digital/my-terminal",
    "https://alphasignal.digital/global-hub",
    "https://alphasignal.digital/etf-flows",
    "https://alphasignal.digital/liquidations",
    "https://alphasignal.digital/oi-radar",
    "https://alphasignal.digital/cme-gaps",
    "https://alphasignal.digital/macro-hub",
    "https://alphasignal.digital/briefing",
    "https://alphasignal.digital/flow",
    "https://alphasignal.digital/rotation",
    "https://alphasignal.digital/macro",
    "https://alphasignal.digital/correlation-matrix",
    "https://alphasignal.digital/macro-calendar",
    "https://alphasignal.digital/regime",
    "https://alphasignal.digital/heatmap",
    "https://alphasignal.digital/alpha-hub",
    "https://alphasignal.digital/signals",
    "https://alphasignal.digital/alpha-score",
    "https://alphasignal.digital/strategy-lab",
    "https://alphasignal.digital/backtester-v2",
    "https://alphasignal.digital/signal-archive",
    "https://alphasignal.digital/mindshare",
    "https://alphasignal.digital/narrative",
    "https://alphasignal.digital/institutional-hub",
    "https://alphasignal.digital/token-unlocks",
    "https://alphasignal.digital/yield-lab",
    "https://alphasignal.digital/portfolio-optimizer",
    "https://alphasignal.digital/tradelab",
    "https://alphasignal.digital/ai-rebalancer",
    "https://alphasignal.digital/analytics-hub",
    "https://alphasignal.digital/whales",
    "https://alphasignal.digital/velocity",
    "https://alphasignal.digital/onchain",
    "https://alphasignal.digital/options-flow",
    "https://alphasignal.digital/newsroom",
    "https://alphasignal.digital/liquidity",
    "https://alphasignal.digital/gex-profile",
    "https://alphasignal.digital/volume-profile",
    "https://alphasignal.digital/lob-heatmap",
    "https://alphasignal.digital/exchange-keys",
    "https://alphasignal.digital/webhooks",
    "https://alphasignal.digital/audit-hub",
    "https://alphasignal.digital/trade-ledger",
    "https://alphasignal.digital/performance-dashboard",
    "https://alphasignal.digital/risk-hub",
    "https://alphasignal.digital/stress",
    "https://alphasignal.digital/advanced-charting",
    "https://alphasignal.digital/tradingview-hub",
    "https://alphasignal.digital/custom-analytics",
    "https://alphasignal.digital/alerts",
    "https://alphasignal.digital/alerts-hub",
    "https://alphasignal.digital/price-alerts",
    "https://alphasignal.digital/price-alerts-hub",
    "https://alphasignal.digital/signal-leaderboard",
    "https://alphasignal.digital/leaderboard-hub",
    "https://alphasignal.digital/market-brief",
    "https://alphasignal.digital/market-brief-hub",
    "https://alphasignal.digital/help"
]

today = datetime.datetime.now().strftime("%Y-%m-%d")

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n')
    
    # Write Core
    f.write('  <!-- ===== APPLICATION VIEWS ===== -->\n')
    for url in core_urls:
        f.write('  <url>\n')
        f.write(f'    <loc>{url}</loc>\n')
        f.write(f'    <lastmod>{today}</lastmod>\n')
        f.write('    <changefreq>daily</changefreq>\n')
        f.write('    <priority>0.9</priority>\n')
        f.write('  </url>\n')

    # Write Docs
    if os.path.exists("docs"):
        f.write('\n  <!-- ===== DOCUMENTATION PAGES ===== -->\n')
        for file in sorted(os.listdir("docs")):
            if file.endswith(".html"):
                slug = file[:-5]
                f.write('  <url>\n')
                f.write(f'    <loc>https://alphasignal.digital/docs/{slug}</loc>\n')
                f.write(f'    <lastmod>{today}</lastmod>\n')
                f.write('    <changefreq>monthly</changefreq>\n')
                f.write('    <priority>0.5</priority>\n')
                f.write('  </url>\n')
                
    # Write Academy
    if os.path.exists("academy"):
        f.write('\n  <!-- ===== ACADEMY PAGES ===== -->\n')
        for file in sorted(os.listdir("academy")):
            if file.endswith(".html"):
                slug = file[:-5]
                f.write('  <url>\n')
                f.write(f'    <loc>https://alphasignal.digital/academy/{slug}</loc>\n')
                f.write(f'    <lastmod>{today}</lastmod>\n')
                f.write('    <changefreq>monthly</changefreq>\n')
                f.write('    <priority>0.8</priority>\n')
                f.write('  </url>\n')

    f.write('</urlset>\n')

print("Sitemap successfully regenerated.")
