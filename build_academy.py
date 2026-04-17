import os
import re

articles = {
    'order-book-liquidity-heatmaps': {
        'title': 'How to Read Order Book Liquidity Heatmaps',
        'summary': 'Decode Limit Order Book (LOB) data to identify institutional defense levels, spoofs, and high-probability support/resistance structures before price gets there.',
        'content': '''<h2>Introduction to Limit Order Books (LOB)</h2>
<p>Unlike traditional candlestick charts that only show executed trades, a <strong>Limit Order Book Heatmap</strong> exposes the active, unexecuted limit orders resting across different price levels. This allows quantitative traders to visualize true market depth and identify where institutional capital is stacked.</p>

<h3>Identifying Spoofing vs. True Support</h3>
<p>Not all liquidity is real. Large market players often employ spoofing strategies by flashing massive buy or sell walls to manipulate retail sentiment, only to pull the orders before execution. AlphaSignal's Liquidity Heatmap uses high-frequency delta decay algorithms to isolate transient spoofing from authentic institutional support structures.</p>

<h3>Trading Execution Strategies</h3>
<p>For day traders and scalpers, LOB heatmaps provide an unparalleled edge for identifying local tops and bottoms. By tracking the migration of liquidity bands, traders can anticipate breakout directionality and predict aggressive institutional market orders hunting stops.</p>
'''
    },
    'understanding-gamma-exposure-gex': {
        'title': 'Understanding Gamma Exposure (GEX) in Crypto Markets',
        'summary': 'A comprehensive guide to understanding options market maker positioning, hedging dynamics, and the impact of Gamma Exposure (GEX) on underlying asset price action.',
        'content': '''<h2>Introduction to Gamma Exposure</h2>
<p>Gamma Exposure (GEX) quantifies the directional exposure of options market makers. When retail and institutional traders buy options, market makers take the opposite side of the trade and must dynamically hedge their positions in the spot or futures market.</p>

<h3>Positive vs. Negative Gamma Regimes</h3>
<p><strong>Positive Gamma Regimes:</strong> When market makers are long gamma, they hedge by buying into dips and selling into rallies. This creates unnatural market stability and suppresses volatility, leading to tight consolidation ranges.</p>
<p><strong>Negative Gamma Regimes:</strong> Conversely, when market makers are short gamma, they must buy into rallies and sell into dips to maintain delta neutrality. This acts as a volatility amplifier, accelerating price movements and causing explosive breakouts or cascading liquidations.</p>

<h3>Using the AlphaSignal GEX Profile</h3>
<p>The AlphaSignal GEX Profile maps out key gamma strike levels for Bitcoin and Ethereum, highlighting major support walls and resistance roofs dictated by options open interest decay. Traders can use these levels to frame high-probability mean-reversion trades or anticipate volatility expansion zones.</p>
'''
    },
    'crypto-liquidations-tracker': {
        'title': 'Exploiting High-Leverage Crypto Liquidations',
        'summary': 'Learn how to track and exploit forced liquidations and margin calls across major derivatives exchanges to fade momentum and capture violent mean-reversion bounces.',
        'content': '''<h2>The Mechanics of Forced Liquidations</h2>
<p>In highly leveraged crypto derivatives markets, intense price volatility often leads to forced position liquidations. When a heavily leveraged long position is liquidated, the exchange matching engine indiscriminately issues a market sell order, causing a cascading drop in price known as a "liquidation cascade" or "long squeeze."</p>

<h3>Funding Rates and Open Interest (OI)</h3>
<p>By correlating real-time liquidation data with Open Interest (OI) and Funding Rates, traders can map out dense clusters of impending liquidations. When funding rates are wildly positive and OI is historically high, the probability of a long squeeze dramatically increases.</p>

<h3>Execution Strategies: Fading the Cascade</h3>
<p>Institutional traders use the AlphaSignal Liquidations Tracker combined with Tape velocity to identify the exact moment a liquidation cascade exhausts. Buying the blood of a forced margin call provides some of the highest risk-to-reward setups in cryptocurrency trading.</p>
'''
    },
    'options-flow-dark-pools': {
        'title': 'Decoding Institutional Options Flow & Dark Pools',
        'summary': 'Track massive options block trades, dark pool sweeps, and unusual options activity to front-run institutional capital movements in both crypto and equities.',
        'content': '''<h2>What is Options Flow?</h2>
<p>Options Flow tracking involves monitoring the tape for unusually large, aggressive block trades or sweeps executed by institutional funds. Unlike retail traders who execute single contracts, institutions execute thousands of contracts across multiple exchanges simultaneously, leaving a distinct footprint.</p>

<h3>Bullish vs. Bearish Flow Patterns</h3>
<p>Not all calls are bullish and not all puts are bearish. AlphaSignal's ML engine categorizes options flow by analyzing the bid-ask execution side, IV crush potential, and contract expiry density. A massive call block bought at the ask indicates aggressive bullish sentiment, while calls sold at the bid indicate covered writing or downside bias.</p>

<h3>Integrating Flow into Directional Strategies</h3>
<p>When heavy bullish options flow aligns with a technical breakout on the volume profile, it provides a high-confidence confirmation signal. Traders can utilize the Options Flow dashboard to follow the "smart money" and avoid crowded retail trades.</p>
'''
    },
    'capital-sector-rotation': {
        'title': 'Mastering Capital Sector Rotation Strategies',
        'summary': 'Uncover the flow of capital from Bitcoin into large-cap altcoins, DeFi, and meme coins using ecosystem rotation heatmaps and relative strength momentum.',
        'content': '''<h2>The Crypto Capital Flow Cycle</h2>
<p>Cryptocurrency bull markets typically follow a predictable capital rotation cycle. Fiat capital flows into Bitcoin, which leads the market rally. Once Bitcoin consolidates, institutional and retail profits rotate down the risk curve into Ethereum, then Large-Cap Altcoins, and eventually Micro-Cap tokens.</p>

<h3>Measuring Relative Strength</h3>
<p>The Sector Rotation dashboard utilizes algorithmic pairs trading logic (e.g., SOL/BTC, ETH/BTC) to measure the relative strength of specific ecosystems against the market benchmark. Recognizing when a sector is transitioning from the "Accumulation" quadrant to the "Leading" quadrant is essential for capturing outsized macro returns.</p>

<h3>AlphaSignal's Ecosystem Tracking</h3>
<p>By aggregating volume, social mindshare, and cumulative delta across Layer 1s, DeFi, AI, and Gaming sectors, AlphaSignal generates a deterministic view of where capital is currently parked, allowing traders to position themselves ahead of the rotation wave.</p>
'''
    },
    'volume-profile-market-profile': {
        'title': 'Trade Like a Pro: Volume Profile & Market Profile',
        'summary': 'Move beyond time-based charts. Utilize Volume Profile to discover High Volume Nodes (HVN), Point of Control (POC), and Value Areas.',
        'content': '''<h2>Time vs. Volume</h2>
<p>Traditional charts plot price over time, inherently weighing slow consolidation periods equivalently to fast trend movements. Volume Profile plots volume traded at specific price levels, establishing the concept of "Market Acceptance" and "Value."</p>

<h3>Core Structural Components</h3>
<p><strong>Point of Control (POC):</strong> The single price level where the most volume was transacted. It acts as a massive fundamental magnet for price.</p>
<p><strong>Value Area (VA):</strong> The price range where 70% of the trading volume occurred. Prices moving outside this range are considered "unfair" and often mean-revert back inside.</p>
<p><strong>Low Volume Nodes (LVN):</strong> Zones with minimal trading volume. Price tends to slice through these areas rapidly, acting as vacuum zones.</p>

<h3>Execution Frameworks</h3>
<p>Traders rely on the AlphaSignal Volume Profile to structure their risk. Entering trades near the edge of a Value Area and targeting the POC provides a statistically backed, institutional-grade methodology for asymmetric R:R (Risk/Reward) setups.</p>
'''
    },
    'institutional-yield-farming': {
        'title': 'Navigating Institutional DeFi Yield Farming',
        'summary': 'Analyze risk-adjusted return vectors, stablecoin supply constraints, and protocol emissions to optimize your decentralization finance (DeFi) yield strategy.',
        'content': '''<h2>The Architecture of On-Chain Yield</h2>
<p>DeFi yield is generated primarily through three vectors: staking rewards, liquidity provider (LP) fee generation, and token emission incentives. Understanding the underlying source of the yield is critical to evaluating the risk of capital impermanence or protocol insolvency.</p>

<h3>Evaluating Risk-Adjusted Returns</h3>
<p>While triple-digit APYs are enticing, they often mask severe inflationary tokenomics or underlying smart-contract risks. The AlphaSignal Yield Lab tracks Total Value Locked (TVL) velocity alongside Sharpe ratios to highlight sustainable, institutional-grade farming opportunities across heavily audited protocols.</p>

<h3>Stablecoin Liquidity as a Macro Indicator</h3>
<p>The expansion and contraction of stablecoin supplies (e.g., USDC, USDT) serve as a leading indicator for macro crypto liquidity. A rapidly expanding stablecoin supply indicates fresh fiat capital entering the ecosystem, typically preceding major parabolic market regimes.</p>
'''
    },
    'token-unlocks-supply-dilution': {
        'title': 'Trading Trading Token Unlocks and Supply Dilution',
        'summary': 'Track venture capitalist vesting schedules and massive token unlock events to anticipate structural supply shocks and short-selling opportunities.',
        'content': '''<h2>The Mechanics of Token Vesting</h2>
<p>To prevent early investors and team members from dumping their tokens immediately after launch, crypto projects enforce strict vesting schedules and lock-up periods. When these lock-ups expire (a "Token Unlock"), an influx of new supply hits the open market.</p>

<h3>Cliff vs. Linear Unlocks</h3>
<p><strong>Cliff Unlocks:</strong> A massive chunk of tokens is unlocked on a singular date. These events act as known fundamental catalysts and are often heavily front-run by quantitative short sellers.</p>
<p><strong>Linear Unlocks:</strong> Tokens are unlocked gradually per block or per day over several years, creating a persistent overhead supply drag on price action.</p>

<h3>AlphaSignal's Dilution Tracker</h3>
<p>By mapping out precise unlock dates and calculating the percentage of newly circulating supply relative to 24hr liquidity depth, AlphaSignal highlights vulnerable assets primed for structural downside repricing due to VC token dumping.</p>
'''
    },
    'algorithmic-ai-trade-signals': {
        'title': 'Exploiting Algorithmic AI Trade Signals',
        'summary': 'Discover how AlphaSignal utilizes deep learning neural networks, Natural Language Processing, and fundamental data to generate deterministic, emotionless trade signals.',
        'content': '''<h2>The Evolution of Quantitative Trading</h2>
<p>Traditional technical analysis relies on subjective chart patterns. AlphaSignal's AI Engine replaces human bias with rigorous machine learning models trained on decades of order book data, macro indicators, and on-chain metrics to output highly probable directional forecasts.</p>

<h3>Confidence Scoring and Z-Scores</h3>
<p>Every AI signal generated on the platform is accompanied by a statistical confidence score and a standard deviation (Z-Score) metric. This allows traders to quantitatively assess edge. A Z-Score of 3.0 indicates a massive statistical divergence, representing an exceptionally high-alpha trade setup.</p>

<h3>The Confluence Matrix</h3>
<p>The most lucrative trade signals occur when the AI Engine aligns with fundamental catalysts (e.g., massive token unlocks) and Options Flow blocks. The Strategy Lab combines these multi-dimensional vectors into a unified terminal dashboard for seamless 1-click execution.</p>
'''
    },
    'on-chain-whale-tracking': {
        'title': 'On-Chain Whale Tracking and Exchange Flows',
        'summary': 'Trace massive cryptocurrency transactions between cold storage wallets and centralized exchanges to predict local tops and bottoms.',
        'content': '''<h2>Understanding the On-Chain Ledger</h2>
<p>Because blockchain ledgers are perfectly transparent, every major transaction is permanently recorded. By clustering wallet addresses and identifying entities like Exchange Hot Wallets, Miners, and Institutional Custodians, AlphaSignal maps the flow of hidden liquidity.</p>

<h3>Exchange Inflows vs. Outflows</h3>
<p><strong>Net Inflows:</strong> When Whales move massive amounts of Bitcoin from cold storage into Centralized Exchanges (CEX), it generally signifies an intent to sell, vastly increasing downside selling pressure.</p>
<p><strong>Net Outflows:</strong> Conversely, when record amounts of cryptocurrency are withdrawn from exchanges into cold storage, it indicates deep supply accumulation and long-term holding strategies, leading to supply-side shocks.</p>

<h3>Miner Capitulation</h3>
<p>By tracking Bitcoin miner reserves, traders can identify "Miner Capitulation" phases. When mining profitability plummets during bear markets, miners are forced to dump their reserves to cover electrical costs, historically marking absolute generational market bottoms.</p>
'''
    }
}

def build_academy():
    # Load index template
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            html_template = f.read()
    except Exception as e:
        print(f"Error reading index.html: {e}")
        return
        
    os.makedirs('academy', exist_ok=True)
    
    # Strip <base> if exists, add it if not so relative paths work from /academy/
    h_idx = html_template.find('<head>')
    if h_idx != -1:
        template_with_base = html_template[:h_idx+6] + '\n    <base href="/">\n' + html_template[h_idx+6:]
    else:
        template_with_base = html_template

    for slug, doc in articles.items():
        seo_title = f"{doc['title']} - AlphaSignal Quant Academy"
        seo_desc = doc['summary'][:160]
        
        # Build document HTML using exact styles from the template UI
        html_content = [f"<div class='academy-container seo-pre-render' style='padding:5rem 2rem 10rem; max-width:900px; margin:0 auto; font-family:\"Inter\", sans-serif;'>"]
        
        # Academy Header Badge
        html_content.append(f"<div style='display:inline-block; padding:4px 12px; background:rgba(125,211,252,0.15); border:1px solid var(--accent); color:var(--accent); border-radius:6px; font-size:0.75rem; letter-spacing:2px; font-weight:700; margin-bottom:1.5rem;'>QUANT ACADEMY</div>")
        
        # Title & Summary
        html_content.append(f"<h1 style='font-size:clamp(2rem, 4vw, 3.5rem); margin-bottom:1.5rem; color:var(--text-main); font-weight:900; line-height:1.1; letter-spacing:-1px;'>{doc['title']}</h1>")
        html_content.append(f"<p style='font-size:1.35rem; line-height:1.6; color:var(--text-dim); margin-bottom:3rem; padding-bottom:3rem; border-bottom:1px solid rgba(255,255,255,0.08);'>{doc['summary']}</p>")
        
        # The Content Core
        html_content.append(f"<div class='academy-article-dynamic' style='font-size:1.15rem; line-height:1.8; color:#cbd5e1;'>")
        html_content.append(doc['content'])
        html_content.append("</div>")
        
        # Call to Action block
        html_content.append(f"""
        <div style='margin-top:5rem; padding:3rem; background:rgba(0,0,0,0.3); border:1px solid rgba(125,211,252,0.15); border-radius:16px; text-align:center;'>
            <h3 style='margin:0 0 1rem; color:#fff; font-size:1.5rem;'>Ready to apply this strategy?</h3>
            <p style='color:var(--text-dim); margin-bottom:2rem;'>Access real-time, deterministic signals and institutional liquidity tracking directly in the AlphaSignal terminal.</p>
            <a href="/" style='display:inline-block; background:var(--accent); color:#000; font-weight:800; text-decoration:none; padding:1rem 2.5rem; border-radius:8px; font-size:1.1rem; box-shadow:0 0 20px rgba(125,211,252,0.3);'>LAUNCH TERMINAL</a>
        </div>
        """)

        html_content.append("</div>")
        
        inner_html = "\n".join(html_content)
        
        # Replace title
        out_html = re.sub(r'<title>.*?</title>', f'<title>{seo_title}</title>', template_with_base)
        # Replace description
        out_html = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{seo_desc}">', out_html)
        
        # Inject Custom CSS for Article Tags natively
        custom_css = """
        <style>
            .academy-article-dynamic h2 { font-size: 2rem; color: #fff; margin: 3rem 0 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.5rem; font-weight:800; letter-spacing:-0.5px;}
            .academy-article-dynamic h3 { font-size: 1.4rem; color: #fff; margin: 2.5rem 0 1rem; font-weight:700;}
            .academy-article-dynamic p { margin-bottom: 1.5rem; }
            .academy-article-dynamic strong { color: var(--accent); }
        </style>
        """
        out_html = out_html.replace('</head>', custom_css + '\n</head>')
        
        # Inject Content
        out_html = re.sub(
            r'<div id="home-prerender"[^>]*>.*?</div>\s*</div>',
            f'{inner_html}</div>', 
            out_html, flags=re.DOTALL
        )

        with open(f"academy/{slug}.html", 'w', encoding='utf-8') as f:
            f.write(out_html)

    print(f"Generated {len(articles)} High-Density SEO Academy files successfully.")

if __name__ == '__main__':
    build_academy()
