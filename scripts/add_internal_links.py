#!/usr/bin/env python3
"""
add_internal_links.py
Injects a visible "Continue Learning" + "Use in Terminal" section into every
academy page, just before the hidden seo-crawler-nav block.

Each article gets:
  - Up to 3 related academy article links (topically relevant)
  - 1-2 matching docs/ feature page links ("Use This in AlphaSignal")
"""
import os, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ACADEMY_DIR = 'academy'
INJECTION_MARKER = 'seo-crawler-nav'

# ── Mapping: slug -> (title, [related_academy_slugs], [docs_slugs_with_labels]) ──
# related_academy: up to 3 topically close articles
# docs_links: list of (docs_slug, label) tuples

ARTICLES = {
  "bollinger-bands-volatility": {
    "title": "Bollinger Bands and Volatility Envelopes",
    "related": ["rsi-macd-momentum-oscillators", "breakout-trading-strategies", "candlestick-patterns"],
    "docs": [("signals", "Live Signals"), ("backtester-v2", "Strategy Backtester")],
  },
  "breakout-trading-strategies": {
    "title": "Breakout Trading Strategies",
    "related": ["bollinger-bands-volatility", "support-and-resistance-fundamentals", "volume-profile-market-profile"],
    "docs": [("signals", "Live Signals"), ("backtester-v2", "Strategy Backtester")],
  },
  "candlestick-patterns": {
    "title": "Candlestick Patterns",
    "related": ["support-and-resistance-fundamentals", "trendlines-and-channels", "trading-psychology-fomo-panic"],
    "docs": [("signals", "Live Signals"), ("command-center", "Command Center")],
  },
  "options-flow-dark-pools": {
    "title": "Decoding Institutional Options Flow & Dark Pools",
    "related": ["understanding-gamma-exposure-gex", "options-implied-volatility-smile", "on-chain-whale-tracking"],
    "docs": [("options-flow", "Options Flow Scanner"), ("analytics-hub", "Market Analytics")],
  },
  "divergence-trading-strategies": {
    "title": "Divergence Trading Strategies",
    "related": ["rsi-macd-momentum-oscillators", "bollinger-bands-volatility", "statistical-mean-reversion-z-scores"],
    "docs": [("signals", "Live Signals"), ("backtester-v2", "Strategy Backtester")],
  },
  "elliott-wave-theory": {
    "title": "Elliott Wave Theory",
    "related": ["fibonacci-retracements-crypto", "trendlines-and-channels", "harmonic-patterns-trading"],
    "docs": [("signals", "Live Signals"), ("tradingview-hub", "TradingView Hub")],
  },
  "fibonacci-retracements-crypto": {
    "title": "Fibonacci Retracements in Cryptocurrency",
    "related": ["elliott-wave-theory", "support-and-resistance-fundamentals", "harmonic-patterns-trading"],
    "docs": [("signals", "Live Signals"), ("tradingview-hub", "TradingView Hub")],
  },
  "fundamental-mvrv-z-score": {
    "title": "Identifying Generational Tops: MVRV Z-Score",
    "related": ["on-chain-whale-tracking", "stablecoin-macro-liquidity-flows", "statistical-mean-reversion-z-scores"],
    "docs": [("onchain", "On-Chain Analytics"), ("signals", "Live Signals")],
  },
  "harmonic-patterns-trading": {
    "title": "Harmonic Patterns in Trading",
    "related": ["fibonacci-retracements-crypto", "elliott-wave-theory", "candlestick-patterns"],
    "docs": [("signals", "Live Signals"), ("tradingview-hub", "TradingView Hub")],
  },
  "hidden-markov-market-regimes": {
    "title": "Understanding Market Regimes with Hidden Markov Models",
    "related": ["capital-sector-rotation", "statistical-mean-reversion-z-scores", "stablecoin-macro-liquidity-flows"],
    "docs": [("regime", "Market Regime Engine"), ("macro-hub", "Macro Compass")],
  },
  "how-to-set-proper-stop-loss": {
    "title": "How to Set a Proper Stop Loss",
    "related": ["position-sizing-and-leverage", "mastering-risk-to-reward-ratio", "trading-psychology-fomo-panic"],
    "docs": [("risk-hub", "Risk Matrix"), ("tradelab", "Trade Idea Lab")],
  },
  "ichimoku-cloud-strategy": {
    "title": "Ichimoku Cloud Strategy",
    "related": ["rsi-macd-momentum-oscillators", "trading-moving-average-crossovers", "trendlines-and-channels"],
    "docs": [("signals", "Live Signals"), ("tradingview-hub", "TradingView Hub")],
  },
  "importance-of-trading-journal": {
    "title": "The Importance of a Trading Journal",
    "related": ["trading-psychology-fomo-panic", "mastering-risk-to-reward-ratio", "how-to-set-proper-stop-loss"],
    "docs": [("trade-ledger", "Trade Ledger"), ("audit-hub", "Portfolio Audit")],
  },
  "institutional-yield-farming": {
    "title": "Navigating Institutional DeFi Yield Farming",
    "related": ["stablecoin-macro-liquidity-flows", "token-unlocks-supply-dilution", "on-chain-whale-tracking"],
    "docs": [("yield-lab", "DeFi Yield Lab"), ("onchain", "On-Chain Analytics")],
  },
  "mastering-risk-to-reward-ratio": {
    "title": "Mastering the Risk to Reward Ratio in Trading",
    "related": ["position-sizing-and-leverage", "how-to-set-proper-stop-loss", "importance-of-trading-journal"],
    "docs": [("risk-hub", "Risk Matrix"), ("tradelab", "Trade Idea Lab")],
  },
  "on-chain-whale-tracking": {
    "title": "On-Chain Whale Tracking and Exchange Flows",
    "related": ["fundamental-mvrv-z-score", "stablecoin-macro-liquidity-flows", "options-flow-dark-pools"],
    "docs": [("onchain", "On-Chain Analytics"), ("analytics-hub", "Market Analytics")],
  },
  "options-implied-volatility-smile": {
    "title": "The Options Volatility Surface: IV Smile and Term Structure",
    "related": ["options-flow-dark-pools", "understanding-gamma-exposure-gex", "statistical-mean-reversion-z-scores"],
    "docs": [("options-flow", "Options Flow Scanner"), ("gex-profile", "GEX Profile")],
  },
  "order-blocks-institutional": {
    "title": "Order Blocks and Institutional Price Levels",
    "related": ["support-and-resistance-fundamentals", "vwap-institutional-execution", "volume-profile-market-profile"],
    "docs": [("signals", "Live Signals"), ("liquidity", "Liquidity Dashboard")],
  },
  "order-book-liquidity-heatmaps": {
    "title": "How to Read Order Book Liquidity Heatmaps",
    "related": ["vwap-institutional-execution", "volume-profile-market-profile", "order-blocks-institutional"],
    "docs": [("lob-heatmap", "LOB Heatmap"), ("liquidity", "Liquidity Dashboard")],
  },
  "pairs-trading-crypto-arbitrage": {
    "title": "Pairs Trading and Crypto Arbitrage",
    "related": ["statistical-mean-reversion-z-scores", "capital-sector-rotation", "hidden-markov-market-regimes"],
    "docs": [("strategy-lab", "Strategy Lab"), ("backtester-v2", "Strategy Backtester")],
  },
  "position-sizing-and-leverage": {
    "title": "Position Sizing and Leverage Strategies",
    "related": ["mastering-risk-to-reward-ratio", "how-to-set-proper-stop-loss", "trading-psychology-fomo-panic"],
    "docs": [("risk-hub", "Risk Matrix"), ("portfolio-optimizer", "Portfolio Optimizer")],
  },
  "price-action-trading-naked": {
    "title": "Price Action Trading (Naked Charts)",
    "related": ["candlestick-patterns", "support-and-resistance-fundamentals", "breakout-trading-strategies"],
    "docs": [("tradingview-hub", "TradingView Hub"), ("signals", "Live Signals")],
  },
  "rsi-macd-momentum-oscillators": {
    "title": "RSI and MACD: Momentum Oscillators Explained",
    "related": ["bollinger-bands-volatility", "divergence-trading-strategies", "trading-moving-average-crossovers"],
    "docs": [("signals", "Live Signals"), ("backtester-v2", "Strategy Backtester")],
  },
  "smart-money-concepts-smc": {
    "title": "Smart Money Concepts (SMC)",
    "related": ["order-blocks-institutional", "vwap-institutional-execution", "on-chain-whale-tracking"],
    "docs": [("liquidity", "Liquidity Dashboard"), ("analytics-hub", "Market Analytics")],
  },
  "stablecoin-macro-liquidity-flows": {
    "title": "Macro Liquidity: Tracking Stablecoin Supply Flows",
    "related": ["on-chain-whale-tracking", "fundamental-mvrv-z-score", "capital-sector-rotation"],
    "docs": [("onchain", "On-Chain Analytics"), ("macro-hub", "Macro Compass")],
  },
  "statistical-mean-reversion-z-scores": {
    "title": "Statistical Mean Reversion: Trading with Z-Scores",
    "related": ["fundamental-mvrv-z-score", "pairs-trading-crypto-arbitrage", "divergence-trading-strategies"],
    "docs": [("signals", "Live Signals"), ("backtester-v2", "Strategy Backtester")],
  },
  "support-and-resistance-fundamentals": {
    "title": "Support and Resistance Fundamentals",
    "related": ["candlestick-patterns", "trendlines-and-channels", "breakout-trading-strategies"],
    "docs": [("signals", "Live Signals"), ("tradingview-hub", "TradingView Hub")],
  },
  "token-unlocks-supply-dilution": {
    "title": "Trading Token Unlocks and Supply Dilution",
    "related": ["institutional-yield-farming", "stablecoin-macro-liquidity-flows", "on-chain-whale-tracking"],
    "docs": [("institutional-hub", "Token Unlock Tracker"), ("onchain", "On-Chain Analytics")],
  },
  "trading-moving-average-crossovers": {
    "title": "Trading Moving Average Crossovers",
    "related": ["rsi-macd-momentum-oscillators", "ichimoku-cloud-strategy", "breakout-trading-strategies"],
    "docs": [("signals", "Live Signals"), ("backtester-v2", "Strategy Backtester")],
  },
  "trading-psychology-fomo-panic": {
    "title": "Trading Psychology: Overcoming FOMO and Panic",
    "related": ["importance-of-trading-journal", "mastering-risk-to-reward-ratio", "how-to-set-proper-stop-loss"],
    "docs": [("command-center", "Command Center"), ("trade-ledger", "Trade Ledger")],
  },
  "trendlines-and-channels": {
    "title": "Trendlines and Price Channels",
    "related": ["support-and-resistance-fundamentals", "breakout-trading-strategies", "candlestick-patterns"],
    "docs": [("signals", "Live Signals"), ("tradingview-hub", "TradingView Hub")],
  },
  "understanding-gamma-exposure-gex": {
    "title": "Understanding Gamma Exposure (GEX) in Crypto Markets",
    "related": ["options-flow-dark-pools", "options-implied-volatility-smile", "statistical-mean-reversion-z-scores"],
    "docs": [("gex-profile", "GEX Profile"), ("options-flow", "Options Flow Scanner")],
  },
  "volume-profile-market-profile": {
    "title": "Trade Like a Pro: Volume Profile & Market Profile",
    "related": ["order-book-liquidity-heatmaps", "vwap-institutional-execution", "order-blocks-institutional"],
    "docs": [("volume-profile", "Volume Profile"), ("liquidity", "Liquidity Dashboard")],
  },
  "vwap-institutional-execution": {
    "title": "VWAP and Institutional Execution Footprints",
    "related": ["order-book-liquidity-heatmaps", "volume-profile-market-profile", "smart-money-concepts-smc"],
    "docs": [("liquidity", "Liquidity Dashboard"), ("lob-heatmap", "LOB Heatmap")],
  },
  "wyckoff-method-accumulation-distribution": {
    "title": "The Wyckoff Method: Accumulation and Distribution",
    "related": ["volume-profile-market-profile", "on-chain-whale-tracking", "smart-money-concepts-smc"],
    "docs": [("analytics-hub", "Market Analytics"), ("signals", "Live Signals")],
  },
  "capital-sector-rotation": {
    "title": "Mastering Capital Sector Rotation Strategies",
    "related": ["hidden-markov-market-regimes", "stablecoin-macro-liquidity-flows", "pairs-trading-crypto-arbitrage"],
    "docs": [("rotation", "Sector Rotation"), ("macro-hub", "Macro Compass")],
  },
  "cme-futures-gaps-bitcoin": {
    "title": "Trading CME Futures Gaps in Bitcoin",
    "related": ["statistical-mean-reversion-z-scores", "breakout-trading-strategies", "fundamental-mvrv-z-score"],
    "docs": [("cme-gaps", "CME Gap Tracker"), ("signals", "Live Signals")],
  },
  "crypto-liquidations-tracker": {
    "title": "Exploiting High-Leverage Crypto Liquidations",
    "related": ["on-chain-whale-tracking", "position-sizing-and-leverage", "order-book-liquidity-heatmaps"],
    "docs": [("liquidations", "Liquidations Scanner"), ("oi-radar", "OI Radar")],
  },
  "ai-narrative-velocity-sentiment": {
    "title": "Narrative Velocity and Semantic Sentiment Analysis",
    "related": ["hidden-markov-market-regimes", "stablecoin-macro-liquidity-flows", "on-chain-whale-tracking"],
    "docs": [("narrative", "Narrative Galaxy"), ("market-brief-hub", "AI Market Brief")],
  },
  "algorithmic-ai-trade-signals": {
    "title": "Exploiting Algorithmic AI Trade Signals",
    "related": ["statistical-mean-reversion-z-scores", "hidden-markov-market-regimes", "rsi-macd-momentum-oscillators"],
    "docs": [("signals", "Live Signals"), ("backtester-v2", "Strategy Backtester")],
  },
}

# Lookup: slug -> display title (for related link labels)
TITLES = {slug: data["title"] for slug, data in ARTICLES.items()}

def build_block(slug):
    data = ARTICLES[slug]
    related = data["related"]
    docs = data["docs"]

    related_items = ""
    for r in related:
        t = TITLES.get(r, r.replace("-", " ").title())
        related_items += f'      <li><a href="/academy/{r}">{t}</a></li>\n'

    docs_items = ""
    for d_slug, d_label in docs:
        docs_items += f'      <li><a href="/docs/{d_slug}">{d_label} &rarr;</a></li>\n'

    return f'''
<section class="academy-related-links" aria-label="Related content" style="
  max-width:820px; margin:3rem auto 2rem; padding:2rem;
  background:rgba(125,211,252,0.04); border:1px solid rgba(125,211,252,0.12);
  border-radius:12px; font-family:'Inter',sans-serif;">
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
    <div>
      <h3 style="font-size:0.7rem; font-weight:800; letter-spacing:2px;
                 color:#7dd3fc; text-transform:uppercase; margin-bottom:1rem;">
        Continue Learning
      </h3>
      <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.6rem;">
{related_items.rstrip()}
      </ul>
    </div>
    <div>
      <h3 style="font-size:0.7rem; font-weight:800; letter-spacing:2px;
                 color:#7dd3fc; text-transform:uppercase; margin-bottom:1rem;">
        Use This in AlphaSignal
      </h3>
      <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.6rem;">
{docs_items.rstrip()}
      </ul>
    </div>
  </div>
</section>
'''

def inject_css():
    return '''<style>
.academy-related-links a {
  color: #7dd3fc;
  text-decoration: none;
  font-size: 0.85rem;
  line-height: 1.5;
  transition: color 0.15s;
}
.academy-related-links a:hover { color: #fff; text-decoration: underline; }
</style>
'''

def patch_file(path, slug):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            html = f.read()
    except UnicodeDecodeError:
        with open(path, 'r', encoding='latin-1') as f:
            html = f.read()

    # Skip if already patched
    if 'academy-related-links' in html:
        print(f"  [SKIP] {slug} — already patched")
        return False

    marker_idx = html.find(INJECTION_MARKER)
    if marker_idx == -1:
        print(f"  [WARN] {slug} — injection marker not found")
        return False

    # Find the opening < of the <nav> tag
    nav_start = html.rfind('<', 0, marker_idx)

    block = inject_css() + build_block(slug)
    html = html[:nav_start] + block + html[nav_start:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"  [OK]   {slug}")
    return True


def main():
    print("=" * 65)
    print("  AlphaSignal - Internal Cross-Link Injector")
    print("=" * 65)

    files = sorted(f for f in os.listdir(ACADEMY_DIR) if f.endswith('.html'))
    patched, skipped = 0, 0

    for fname in files:
        slug = fname[:-5]
        if slug not in ARTICLES:
            print(f"  [SKIP] {slug} — not in mapping")
            skipped += 1
            continue
        path = os.path.join(ACADEMY_DIR, fname)
        if patch_file(path, slug):
            patched += 1
        else:
            skipped += 1

    print()
    print("=" * 65)
    print(f"  DONE: {patched} patched   {skipped} skipped")
    print("=" * 65)


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
