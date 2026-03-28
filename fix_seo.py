c = open('js/main.js', encoding='utf-8').read()

# The new entries to add
new_entries = """        // Phase 15-B: AI Narrative Engine
        'ask-terminal': { title: 'Ask the Terminal \u2014 AI Market Intelligence', desc: 'Natural language AI interface for market analysis and signal interpretation powered by GPT-4o-mini.' },
        'explain-ai-engine': { title: 'Documentation \u2014 AI Narrative Engine', desc: 'How AlphaSignal uses GPT-4o-mini to generate institutional memos, signal theses, and respond to natural language market queries.' },
        // Phase 15-E: Strategy Lab
        'explain-strategy-lab': { title: 'Documentation \u2014 Strategy Lab', desc: "Guide to AlphaSignal's quant strategies: Pairs Trading, Momentum Ignition, Regime Carry, Kelly Sizer, and Dual Momentum with walk-forward validation." },
        // Phase 16-C: TradingView
        'explain-tradingview': { title: 'Documentation \u2014 TradingView Integration', desc: 'Professional charting via embedded TradingView Advanced Chart widget with MA, RSI, MACD, and Bollinger Bands on all crypto and equity assets.' },
        // Phase 16-D: Real On-Chain
        'explain-onchain': { title: 'Documentation \u2014 On-Chain Analytics (Real Data)', desc: 'Real on-chain metrics from CoinGecko + Blockchain.info: MVRV-Z Score, SOPR, Puell Multiple, NVT Ratio, and live BTC hashrate with 1-hour cache.' },
        // Phase 16-E: Signal Backtester V2
        'backtester-v2': { title: 'Signal Backtester V2 \u2014 Walk-Forward Simulation', desc: 'Institutional-grade backtester using live AlphaSignal signal history: rolling 30-day Sharpe ratio, monthly P&L calendar heatmap, and BTC benchmark comparison.' },
        'explain-backtester-v2': { title: 'Documentation \u2014 Signal Backtester V2', desc: 'Guide to backtester interpretation: win rate, profit factor, Calmar ratio, rolling Sharpe chart, and monthly P&L calendar heatmap.' },
"""

# Also fix the fullTitle em-dash encoding on line 1266
c = c.replace(
    "const fullTitle = `${meta.title} | AlphaSignal \u00e2\u20ac\u201c Institutional Crypto Intelligence`;",
    "const fullTitle = `${meta.title} | AlphaSignal \u2014 Institutional Crypto Intelligence`;"
)
c = c.replace(
    "const fullTitle = `${meta.title} | AlphaSignal â€" Institutional Crypto Intelligence`;",
    "const fullTitle = `${meta.title} | AlphaSignal \u2014 Institutional Crypto Intelligence`;"
)

# Find the closing of the viewMetadata dict (the last entry before };)
# Look for the pattern: 'explain-velocity' entry followed by    };
import re
pattern = r"('explain-velocity'.*?cross-chain capital rotation tracking\.' \},\n)(\s*\};)"
match = re.search(pattern, c, re.DOTALL)
if match:
    insert_pos = match.start(2)
    c = c[:insert_pos] + new_entries + c[insert_pos:]
    print("SUCCESS: Inserted Phase 15-16 SEO entries")
else:
    print("Pattern not found, trying alternate...")
    # Find the }; that closes viewMetadata
    idx_meta = c.find("    const meta = viewMetadata[view]")
    if idx_meta > 0:
        # Find the }; just before it
        closing = c.rfind("    };", 0, idx_meta)
        if closing > 0:
            c = c[:closing] + new_entries + c[closing:]
            print(f"SUCCESS via rfind at pos {closing}")
        else:
            print("FAIL: could not find closing };")
    else:
        print("FAIL: could not find const meta =")

with open('js/main.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
print("File saved.")

# Verify
c2 = open('js/main.js', encoding='utf-8').read()
print("backtester-v2 in SEO dict:", "'backtester-v2'" in c2[90000:120000])
print("ask-terminal in SEO dict:", "'ask-terminal'" in c2[90000:120000])
