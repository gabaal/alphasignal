function updateSEOMeta(view) {
    const viewMetadata = {
        // === ROOT / HOME ===
        'home': {
            title: 'AlphaSignal — Institutional Crypto Intelligence Terminal',
            desc: 'AlphaSignal is a real-time institutional intelligence terminal for Bitcoin, crypto, and macro markets. AI-powered signals, options flow, whale tracking, portfolio optimiser, macro calendar, and 60+ analytical views.'
        },

        // === COMMAND CENTER ===
        'command-center': {
            title: 'Institutional Command Center',
            desc: 'Consolidated real-time intelligence dashboard aggregating key signals from all AlphaSignal hubs — ETF flows, macro correlation, top alpha signals, and system conviction dials.'
        },
        'ask-terminal': {
            title: 'Ask Terminal — AI Research Assistant',
            desc: 'Conversational AI research assistant with full AlphaSignal terminal context. Ask about signals, market regimes, options flow, or any institutional metric and receive GPT-4 powered analysis instantly.'
        },

        // === GLOBAL MARKETS HUB ===
        'global-hub': {
            title: 'Global Markets Intelligence Hub',
            desc: 'Consolidated institutional view of Bitcoin spot ETF flows, leveraged liquidation cascades, open interest radar, and CME futures gap analysis.'
        },
        'etf-flows': {
            title: 'Bitcoin Spot ETF Flows — Live Institutional Capital Tracker',
            desc: 'Real-time daily net flows across all regulated Bitcoin spot ETFs including BlackRock IBIT, Fidelity FBTC, and ARK ARKB. Track institutional accumulation and distribution cycles.'
        },
        'liquidations': {
            title: 'Crypto Liquidation Cascade Scanner — Live Leverage Wipeouts',
            desc: 'Real-time monitoring of long and short liquidations across Binance, OKX, Bybit, and Deribit. Detect liquidation clusters and cascade alerts before they impact spot price.'
        },
        'oi-radar': {
            title: 'Open Interest Radar — Derivatives Leverage Monitor',
            desc: 'Cross-asset perpetual futures open interest tracking with funding rate overlay. Identify over-leveraged conditions and OI vs price divergences across 20+ assets.'
        },
        'cme-gaps': {
            title: 'CME Bitcoin Gap Tracker — Unfilled Price Gaps',
            desc: 'Track all unfilled CME Bitcoin futures price gaps with historical fill probability scoring. 77% of CME gaps fill within 90 days — a key institutional pricing tool.'
        },

        // === MACRO INTEL HUB ===
        'macro-hub': {
            title: 'Macro Intelligence Hub',
            desc: 'Multi-dimensional analysis of global macro catalysts, capital flows, sector rotation, correlation matrices, and market regime classification — all in one institutional hub.'
        },
        'briefing': {
            title: 'AI Market Intelligence Briefing',
            desc: 'Daily GPT-powered synthesis of global market trends, institutional sentiment, and narrative shifts across Bitcoin, macro, and crypto ecosystem data streams.'
        },
        'flow': {
            title: 'Institutional Capital Flows Monitor',
            desc: 'Track the velocity and direction of institutional capital via ETF flows, exchange reserve changes, and stablecoin minting velocity — the definitive macro bull/bear signal.'
        },
        'rotation': {
            title: 'Crypto Sector Rotation Tracker',
            desc: 'Weighted treemap and momentum matrix showing capital rotation across L1, DeFi, AI, Memes, Gaming, and RWA sectors. Identify the next sector rotation before the crowd.'
        },
        'macro': {
            title: 'Macro Compass — Global Economic Impact Dashboard',
            desc: 'Synthesised macro intelligence covering DXY strength, yield curve shape, equity correlation, and risk regime classification and their real-time impact on crypto markets.'
        },
        'correlation-matrix': {
            title: 'Cross-Asset Correlation Matrix',
            desc: 'Live statistical heatmap of rolling 30-day correlations across BTC, ETH, SPX, DXY, Gold, and 10Y Treasury yields. Identify decoupling events and rotation signals.'
        },
        'macro-calendar': {
            title: 'Macro Event Calendar — FOMC, CPI, NFP, PCE Impact Scorer',
            desc: '90-day forward calendar of institutional macro events scored by historical Bitcoin price impact. FOMC, CPI, NFP, and PCE dates with median BTC move and volatility data.'
        },
        'regime': {
            title: 'Market Regime Framework — Markov Cycle Classification',
            desc: 'Statistical classification of Bitcoin market cycles using Markov-Switching approximation. Identifies Accumulation, Distribution, Trending Bull, and Trending Bear regimes in real-time.'
        },

        // === ALPHA STRATEGY HUB ===
        'alpha-hub': {
            title: 'Alpha Strategy Hub — Institutional Signal Intelligence',
            desc: 'Institutional AI alpha synthesis, Z-score signal generation, ML alpha scoring, strategy lab, signal backtester, archive, and narrative galaxy — all in one strategy hub.'
        },
        'signals': {
            title: 'Live Alpha Signals — Z-Score Market Intelligence',
            desc: 'Real-time Z-score deviation signals across 50+ institutional crypto assets. High-conviction alpha signals powered by ML neural features, orderflow magnitude, and on-chain data.'
        },
        'alpha-score': {
            title: 'Alpha Score Dashboard — Multi-Factor Asset Ranking',
            desc: 'Composite multi-factor alpha score ranking across 50+ assets combining Z-score signal strength, ML prediction confidence, on-chain momentum, and neural sentiment.'
        },
        'strategy-lab': {
            title: 'Strategy Lab — Pairs Trading, Momentum & Kelly Sizer',
            desc: 'Institutional strategy laboratory with Pairs Trading, Momentum Ignition, Regime Carry, Kelly Position Sizer, Dual Momentum, and walk-forward validation.'
        },
        'backtester-v2': {
            title: 'Signal Backtester V2 — Historical Performance Simulator',
            desc: 'Backtest live AlphaSignal Z-score signals against real historical data. Rolling Sharpe ratio, monthly P&L calendar, maximum drawdown, and BTC benchmark comparison.'
        },
        'signal-archive': {
            title: 'Signal Execution Archive — Historical Alpha Record',
            desc: 'Immutable audit trail of all historical AlphaSignal Z-score signals with execution timestamps, outcome tracking, and institutional win-rate analytics.'
        },
        'narrative': {
            title: 'Narrative Galaxy — Crypto Mindshare Cluster Map',
            desc: 'Force-directed graph visualization of crypto market narratives. Track narrative velocity, sentiment polarity, crowded trades, and emerging thesis clusters across social media.'
        },

        // === INSTITUTIONAL HUB ===
        'institutional-hub': {
            title: 'Institutional Hub — Portfolio, Unlocks & Yield Intelligence',
            desc: 'Institutional-grade intelligence for token unlock schedules, DeFi yield comparison, AI portfolio optimisation, and structured trade idea generation with execution ledger integration.'
        },
        'token-unlocks': {
            title: 'Token Unlock Schedule — Supply Shock & Sell Pressure Tracker',
            desc: 'Forward-looking 90-day calendar of major token vesting unlocks scored by supply shock severity. Track investor and team unlock events before they create sell pressure.'
        },
        'yield-lab': {
            title: 'DeFi Yield Lab — Protocol Rate Comparison Engine',
            desc: 'Multi-protocol DeFi yield aggregator comparing Aave, Compound, Lido, Rocket Pool APY rates with risk-adjusted scoring and DeFi vs TradFi spread tracking.'
        },
        'portfolio-optimizer': {
            title: 'AI Portfolio Optimizer — Monte Carlo & Markowitz Rebalancer',
            desc: 'AI-powered portfolio optimiser using Monte Carlo simulation and Markowitz Efficient Frontier. GPT-4 generates a rebalancing memo with execution tickets for full audit trail.'
        },
        'portfolio': {
            title: 'Portfolio Simulation Lab — VaR & Attribution Modelling',
            desc: 'Simulate institutional portfolio performance, Value-at-Risk modelling, drawdown analysis, and correlation attribution across your custom asset basket.'
        },
        'tradelab': {
            title: 'Trade Idea Lab — AI-Assisted Execution Workspace',
            desc: 'Build structured institutional trade ideas with AI-generated thesis memos, risk/reward calculation, and one-click conversion to the institutional trade ledger.'
        },

        // === ANALYTICS HUB ===
        'analytics-hub': {
            title: 'Analytics Hub — Whale, On-Chain, Options & Newsroom Intelligence',
            desc: 'Full institutional analytics suite: whale pulse tracking, cross-chain velocity, real MVRV/SOPR on-chain data, Deribit options flow scanner, and AI-tagged crypto newsroom.'
        },
        'whales': {
            title: 'AI Whale Pulse Monitor — Institutional Transaction Tracker',
            desc: 'Real-time detection of institutional-sized Bitcoin, Ethereum, and Solana on-chain transactions. Entity clustering distinguishes true accumulation from exchange cold wallet shifts.'
        },
        'velocity': {
            title: 'Cross-Chain Capital Velocity — Volume Acceleration Tracker',
            desc: 'Track capital rotation velocity and volume acceleration across Ethereum, Solana, Avalanche, and Cardano. Identify which chain is attracting institutional attention next.'
        },
        'onchain': {
            title: 'On-Chain Analytics — MVRV, SOPR & Puell Multiple',
            desc: 'Real on-chain intelligence: MVRV ratio, SOPR, Puell Multiple, and hashrate data sourced live from CoinGecko and Blockchain.info. Institutional-grade blockchain fundamentals.'
        },
        'options-flow': {
            title: 'Deribit Options Flow Scanner — PCR, Max Pain & IV Smile',
            desc: 'Live BTC and ETH options market intelligence from Deribit: Put/Call ratio, Max Pain strike, ATM implied volatility, IV smile chart, and top open-interest strikes.'
        },
        'newsroom': {
            title: 'Institutional Crypto Newsroom — AI Sentiment Tagged News Feed',
            desc: 'Real-time institutional crypto news with AI BULLISH/BEARISH/NEUTRAL sentiment tagging. Filtered for regulatory developments, ETF news, protocol announcements, and macro policy shifts.'
        },

        // === AUDIT & PERFORMANCE HUB ===
        'audit-hub': {
            title: 'Audit & Performance Hub — Trade Ledger & Analytics',
            desc: 'Institutional audit and performance tracking hub with persistent trade ledger, AI thesis archive, monthly P&L calendar, and BTC benchmark comparison.'
        },
        'trade-ledger': {
            title: 'Institutional Trade Ledger — Auditable Execution Record',
            desc: 'Persistent, auditable log of all AI-generated and manual execution tickets with status tracking, AI thesis archive, PnL attribution, and CSV export for compliance.'
        },
        'performance-dashboard': {
            title: 'Performance Analytics Dashboard — Track Record & Attribution',
            desc: 'Institutional performance analytics with win rate, monthly P&L calendar, rolling Sharpe ratio, maximum drawdown tracking, and BTC benchmark comparison.'
        },

        // === RISK & STRESS HUB ===
        'risk-hub': {
            title: 'Risk & Stress Hub — Portfolio Protection Intelligence',
            desc: 'Institutional risk management hub with real-time risk matrix for position sizing, tail-risk stress testing, volatility regime detection, and macro scenario modelling.'
        },
        'risk': {
            title: 'Risk Matrix — Institutional Position Sizing & VaR',
            desc: 'Real-time institutional risk matrix combining volatility, drawdown, and Value-at-Risk for disciplined position sizing. Protect capital across all market regimes.'
        },
        'stress': {
            title: 'Stress Lab — Macro Scenario & Tail Risk Analysis',
            desc: 'Macro stress-testing your portfolio against historic crash scenarios. Quantify tail-risk exposure, correlation spikes, and maximum drawdown under extreme market conditions.'
        },

        // === ADVANCED CHARTING ===
        'advanced-charting': {
            title: 'Advanced Charting Suite — Professional Institutional Charts',
            desc: 'Professional institutional charting with TradingView integration, funding rate heatmap, 3D volatility surface, tape imbalance histogram, CVD chart, and multi-asset overlays.'
        },

        // === STANDALONE ===
        'mindshare': {
            title: 'Social Mindshare Analytics — Narrative Dominance Tracker',
            desc: 'NLP-driven social sentiment and narrative dominance tracking across Bitcoin, Ethereum, and 50+ crypto assets. Real-time crowd positioning and mindshare shift detection.'
        },
        'liquidity': {
            title: 'Order Flow Magnitude Monitor (GOMM) — Institutional Tape',
            desc: 'Visualise professional liquidity walls, order book depth, CVD divergence, and institutional execution tape. Identify large block order flow before price discovery completes.'
        },
        'heatmap': {
            title: 'Market Heatmap — Z-Score Signal Intensity Grid',
            desc: 'Colour-coded Z-score heatmap across the full 50+ asset universe. Instantly identify where statistical alpha is concentrated by sector and asset class.'
        },
        'alerts': {
            title: 'Real-Time Signal Alerts — Discord & Telegram Webhooks',
            desc: 'Configure Z-score alert thresholds and receive institutional signal alerts via Discord or Telegram webhooks. Customisable sensitivity with test-fire capability.'
        },
        'help': {
            title: 'Help & Documentation Hub — AlphaSignal Terminal Guides',
            desc: 'Complete documentation for all 60+ AlphaSignal views organised by hub. Covers methodology, data sources, analytical frameworks, and institutional best practices.'
        },
        'backtest': {
            title: 'Signal Backtester — Historical Strategy Validation',
            desc: 'Quantitative backtesting of institutional signals against historical market data for performance validation.'
        },
        'catalysts': {
            title: 'Market Catalysts Calendar',
            desc: 'Comprehensive calendar of institutional-grade volatility events, macro releases, and regulatory triggers affecting crypto markets.'
        },

        // === DOCUMENTATION PAGES ===
        'explain-signals': { title: 'Docs — Signal Intelligence Methodology', desc: 'How AlphaSignal generates Z-score deviations, ML neural features, and high-conviction alpha signals across 50+ crypto assets.' },
        'explain-briefing': { title: 'Docs — AI Market Briefing Methodology', desc: 'How the AlphaSignal AI synthesises global market trends, sentiment data, and institutional narratives into a daily institutional memo.' },
        'explain-liquidity': { title: 'Docs — Order Flow GOMM Methodology', desc: 'Interpreting institutional liquidity walls, tape imbalance, CVD divergence, and orderbook depth analysis.' },
        'explain-ml-engine': { title: 'Docs — ML Alpha Engine Architecture', desc: 'LSTM-based predictive modelling using sentiment vectors, orderbook imbalance, and on-chain features to generate forward return predictions.' },
        'explain-whales': { title: 'Docs — Whale Pulse Tracker Methodology', desc: 'How AlphaSignal detects and clusters institutional-sized on-chain transactions to distinguish accumulation from exchange shuffling.' },
        'explain-mindshare': { title: 'Docs — Narrative Galaxy & Mindshare Engine', desc: 'NLP processing pipeline for social cluster visualisation, narrative velocity scoring, and crowded trade detection.' },
        'explain-benchmark': { title: 'Docs — Portfolio Simulation Methodology', desc: 'How to model and benchmark quant crypto portfolios using the AlphaSignal Monte Carlo and attribution engine.' },
        'explain-alerts': { title: 'Docs — Signal Alerts Configuration Guide', desc: 'Setting up Z-score alert thresholds, Discord and Telegram webhook integration, and sensitivity calibration.' },
        'explain-zscore': { title: 'Docs — Z-Score Interpretation & Stress Lab', desc: 'Decoding statistical signal intensity, outlier detection, and macro scenario stress testing methodology.' },
        'explain-alpha': { title: 'Docs — Alpha Strategy Methodology', desc: 'Trading relative strength benchmarks vs Bitcoin and calculating risk-adjusted alpha using institutional signals.' },
        'explain-correlation': { title: 'Docs — Correlation Matrix Methodology', desc: 'Understanding rolling cross-asset correlations, decoupling events, and sector rotation signals.' },
        'explain-sentiment': { title: 'Docs — Sentiment Synthesis Engine', desc: 'How social mindshare, NLP polarity scores, and news flow are synthesised into actionable sentiment intelligence.' },
        'explain-risk': { title: 'Docs — Risk Management Framework', desc: 'Institutional position sizing, Value-at-Risk modelling, and drawdown protection frameworks.' },
        'explain-playbook': { title: 'Docs — Institutional Trading Playbook', desc: 'Advanced strategies, signal combinations, and institutional decision frameworks for systematic trading.' },
        'explain-regimes': { title: 'Docs — Market Regime Classification', desc: 'Markov-Switching regime detection methodology for identifying Accumulation, Distribution, and Trending market cycles.' },
        'explain-advanced-charting': { title: 'Docs — Advanced Charting Suite Guide', desc: 'Professional charting with TradingView, funding heatmap, 3D volatility surface, and orderbook overlay methodology.' },
        'explain-onchain': { title: 'Docs — On-Chain Analytics Methodology', desc: 'Real MVRV, SOPR, Puell Multiple, and hashrate data sourcing from CoinGecko and Blockchain.info.' },
        'explain-api': { title: 'Docs — Institutional API Reference', desc: 'Programmatic access to AlphaSignal real-time signals, liquidity depth, and narrative intelligence for quant desks.' },
        'explain-glossary': { title: 'Docs — Terminal Glossary & Metric Reference', desc: 'Quick-reference guide to all technical metrics, signals, and institutional terminology used across the AlphaSignal platform.' },
        'explain-performance': { title: 'Docs — Performance Analytics Methodology', desc: 'Institutional win rate, return distribution, monthly P&L attribution, and benchmark comparison methodology.' },
        'explain-alpha-score': { title: 'Docs — Alpha Score Composite Methodology', desc: 'Multi-factor alpha score: Z-score signal strength, ML confidence, on-chain momentum, and neural sentiment weighting.' },
        'explain-telegram': { title: 'Docs — Alert Hooks Setup Guide', desc: 'Complete setup guide for Discord and Telegram webhook integration with Z-score sensitivity thresholds.' },
        'explain-pwa': { title: 'Docs — Mobile PWA Installation Guide', desc: 'Install AlphaSignal as a Progressive Web App on iOS and Android for full native terminal access.' },
        'explain-portfolio-lab': { title: 'Docs — Portfolio Optimizer Methodology', desc: 'Monte Carlo simulation, Markowitz Efficient Frontier, ML-constrained rebalancing, and GPT-4 memo generation.' },
        'explain-velocity': { title: 'Docs — Chain Velocity & Capital Rotation', desc: 'Cross-chain volume acceleration tracking and capital rotation methodology across L1 networks.' },
        'explain-signal-archive': { title: 'Docs — Signal Archive Methodology', desc: 'How the AlphaSignal immutable signal archive records, tracks, and attributes historical signal performance.' },
        'explain-topologies': { title: 'Docs — Charting Topologies & Geometries', desc: 'Ecosystem capital flows, whale wallet Sankey, yield curve spread monitor, and signal confidence radar methodology.' },
        'explain-ai-engine': { title: 'Docs — AI Narrative Engine & Ask Terminal', desc: 'GPT-4o-mini memo generation, Ask Terminal conversational AI, and Signal Thesis Generator methodology.' },
        'explain-strategy-lab': { title: 'Docs — Strategy Lab Methodology', desc: 'Pairs Trading, Momentum Ignition, Regime Carry, Kelly Sizer, and Dual Momentum walk-forward validation methodology.' },
        'explain-backtester-v2': { title: 'Docs — Signal Backtester V2 Guide', desc: 'Historical signal simulation with rolling Sharpe, monthly P&L calendar, and BTC benchmark comparison methodology.' },
        'explain-tradingview': { title: 'Docs — TradingView Integration Guide', desc: 'Professional TradingView chart integration with pre-loaded MA/RSI/MACD/BB studies and all crypto and equity symbols.' },
        // Phase 17 and new doc pages
        'explain-etf-flows': { title: 'Docs — Bitcoin Spot ETF Flows Methodology', desc: 'Daily institutional ETF flow tracking across BlackRock IBIT, Fidelity FBTC, ARK ARKB and more — data sourcing and interpretation guide.' },
        'explain-liquidations': { title: 'Docs — Liquidation Cascade Scanner Guide', desc: 'Real-time leverage wipeout detection across Binance, OKX, Bybit, and Deribit — interpretation and cascade alert methodology.' },
        'explain-oi-radar': { title: 'Docs — Open Interest Radar Methodology', desc: 'Cross-asset perpetual futures OI tracking with funding rate overlay — identifying over-leveraged conditions and divergence signals.' },
        'explain-cme-gaps': { title: 'Docs — CME Bitcoin Gap Analysis Guide', desc: 'CME futures gap detection, historical fill probability scoring, and gap trading methodology for institutional traders.' },
        'explain-flow': { title: 'Docs — Capital Flows Monitor Methodology', desc: 'ETF flow aggregation, stablecoin velocity tracking, and exchange net position change methodology.' },
        'explain-rotation': { title: 'Docs — Sector Rotation Tracker Methodology', desc: 'Weighted sector treemap, momentum matrix, and beta expansion alert methodology for crypto capital rotation analysis.' },
        'explain-macro-compass': { title: 'Docs — Macro Compass Methodology', desc: 'DXY inverse correlation, yield curve monitoring, and macro risk regime classification methodology.' },
        'explain-macro-calendar': { title: 'Docs — Macro Event Calendar Guide', desc: 'FOMC/CPI/NFP/PCE event impact scoring methodology using 2-year historical BTC price data.' },
        'explain-narrative': { title: 'Docs — Narrative Galaxy Methodology', desc: 'Force-directed NLP cluster mapping, narrative velocity scoring, and crowded trade saturation detection.' },
        'explain-token-unlocks': { title: 'Docs — Token Unlock Schedule Guide', desc: 'Supply shock scoring, unlock calendar data sourcing, and historical price impact methodology for token unlock events.' },
        'explain-yield-lab': { title: 'Docs — DeFi Yield Lab Methodology', desc: 'Multi-protocol APY comparison, risk-adjusted yield scoring, and DeFi vs TradFi spread tracking methodology.' },
        'explain-tradelab': { title: 'Docs — Trade Idea Lab Guide', desc: 'AI-assisted trade thesis generation, risk/reward calculation, and trade ledger integration workflow.' },
        'explain-options-flow': { title: 'Docs — Options Flow Scanner Methodology', desc: 'Deribit PCR, Max Pain, IV smile, and OI strike data sourcing and institutional interpretation guide.' },
        'explain-newsroom': { title: 'Docs — Institutional Newsroom Guide', desc: 'AI sentiment tagging, news filtering methodology, and breaking news alert threshold configuration.' },
        'explain-trade-ledger': { title: 'Docs — Institutional Trade Ledger Guide', desc: 'Execution ticket lifecycle, PnL attribution, AI thesis archive, and compliance export methodology.' },
        'explain-heatmap': { title: 'Docs — Market Heatmap Guide', desc: 'Z-score heatmap computation, sector grouping, and colour scale interpretation for the 50+ asset universe.' },
        'explain-command-center': { title: 'Docs — Command Center Guide', desc: 'Consolidated master view architecture, data aggregation sources, and hub-level intelligence summary methodology.' },
        'explain-ask-terminal': { title: 'Docs — Ask Terminal AI Guide', desc: 'GPT-4o-mini conversational AI, terminal context injection, and on-demand research memo generation methodology.' },
        'explain-my-terminal': { title: 'Docs — My Terminal & Personal Watchlist Guide', desc: 'How to use the personal watchlist, track live P&L, review win rate, and configure browser notification alerts in AlphaSignal My Terminal.' },

        // === ALERTS HUB & TABS ===
        'alerts-hub': {
            title: 'Alerts Hub — Live Signal Alerts, Price Alerts & Market Brief',
            desc: 'Centralised institutional alert hub: real-time Z-score signal alerts, custom price-level triggers, signal leaderboard, AI market brief, and full signal archive — with Telegram & Discord delivery.'
        },
        'price-alerts': {
            title: 'Price Alerts — Custom Threshold Alert Engine',
            desc: 'Set custom price-level alerts for any tracked asset. Receive instant notifications via Telegram or Discord when your target price is hit above or below.'
        },
        'price-alerts-hub': {
            title: 'Price Alerts Hub — Custom Threshold Alert Engine',
            desc: 'Institutional price alert management. Set multi-asset price triggers with delivery to Telegram or Discord webhooks. Configurable condition logic and persistent storage.'
        },
        'signal-leaderboard': {
            title: 'Signal Leaderboard — Top Performing Alpha Signals',
            desc: 'Ranked leaderboard of all historical AlphaSignal Z-score signals sorted by alpha generated. Identify the consistently highest-conviction assets and signal categories.'
        },
        'leaderboard-hub': {
            title: 'Signal Leaderboard Hub — Top Performing Alpha Signals',
            desc: 'Ranked leaderboard of all historical AlphaSignal Z-score signals sorted by alpha performance. Filter by ticker, category, and timeframe to pinpoint sustainable edge.'
        },
        'market-brief': {
            title: 'AI Market Brief — Daily Institutional Intelligence Memo',
            desc: 'AI-generated daily institutional briefing synthesising macro context, top Z-score signals, ETF capital flows, sector rotation, and options skew into one concise read.'
        },
        'market-brief-hub': {
            title: 'Market Brief Hub — AI Daily Intelligence Briefing',
            desc: 'On-demand AI-powered market brief. Synthesises live macro data, top signals, ETF flows, and narrative momentum into a structured institutional memo. Generated by GPT-4o-mini.'
        },

        // === MY TERMINAL ===
        'my-terminal': {
            title: 'My Terminal — Personal Watchlist & Live P&L Tracker',
            desc: 'Your personalised AlphaSignal workspace. Track custom watchlist positions with live P&L, portfolio win rate, and browser notification alerts. Persists across sessions.'
        },

        // === AI REBALANCER ===
        'ai-rebalancer': {
            title: 'AI Portfolio Rebalancer — Monte Carlo Optimisation Engine',
            desc: 'AI-powered portfolio rebalancing using Monte Carlo simulation, Markowitz Efficient Frontier, and GPT-4 generated execution memos. Full audit trail via the institutional trade ledger.'
        },

        // === MISC ROUTES ===
        'signal': {
            title: 'Live Alpha Signal — Z-Score Intelligence Detail',
            desc: 'Detailed Z-score signal view for a single institutional crypto asset. Includes momentum vector, alpha score, on-chain context, and AI-generated trade thesis.'
        },
    };

    const meta = viewMetadata[view] || {
        title: view.charAt(0).toUpperCase() + view.slice(1),
        desc: 'AlphaSignal Institutional Intelligence Terminal - Real-time signals and AI insights.'
    };

    const fullTitle = `${meta.title} | AlphaSignal -- Bitcoin & Crypto Trading Signals`;
    const viewUrl = view === 'home' ? 'https://alphasignal.digital/' : `https://alphasignal.digital/?view=${view}`;

    document.title = fullTitle;

    // 1. Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', meta.desc);

    // 2. Update Canonical Link
    const canon = document.getElementById('canonical-link');
    if (canon) canon.setAttribute('href', viewUrl);

    // 3. Update Social (Open Graph & Twitter)
    const updateAttr = (id, attr, val) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute(attr, val);
    };

    updateAttr('og-title', 'content', fullTitle);
    updateAttr('og-desc', 'content', meta.desc);
    updateAttr('og-url', 'content', viewUrl);
    updateAttr('twitter-title', 'content', fullTitle);
    updateAttr('twitter-desc', 'content', meta.desc);
    updateAttr('twitter-url', 'content', viewUrl);

    // 4. Update JSON-LD (Breadcrumbs & FAQ)
    const ldJsonEl = document.getElementById('ld-json-dynamic');
    if (ldJsonEl) {
        const schemas = [];
        
        // Always add Breadcrumbs
        schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Signals",
                "item": "https://alphasignal.digital/"
            }, {
                "@type": "ListItem",
                "position": 2,
                "name": meta.title,
                "item": viewUrl
            }]
        });

        // Add FAQ if on Home View
        if (view === 'home' || view === 'landing') {
            schemas.push({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    { "@type": "Question", "name": "How does AlphaSignal calculate Alpha?", "acceptedAnswer": { "@type": "Answer", "text": "Alpha is calculated using a rolling Z-score deviation of returns relative to a Bitcoin (BTC) benchmark, adjusted for institutional volume and order flow magnitude. A Z-score above +2.0 indicates a statistically significant positive deviation -- the core of our signal generation logic." } },
                    { "@type": "Question", "name": "What makes the Options Flow Scanner different?", "acceptedAnswer": { "@type": "Answer", "text": "AlphaSignal sources live data directly from the Deribit API -- the world's largest crypto options exchange by volume. We compute Put/Call ratio, Max Pain strike, ATM Implied Volatility, and the full IV smile across all strikes in real time." } },
                    { "@type": "Question", "name": "How does the AI Portfolio Rebalancer work?", "acceptedAnswer": { "@type": "Answer", "text": "The AI Rebalancer uses Monte Carlo simulation to model 10,000 portfolio scenarios. It applies Markowitz Efficient Frontier optimisation constrained by ML signal confidence scores, then generates a GPT-4 rebalancing memo. All recommended trades convert to execution tickets in the Trade Ledger." } },
                    { "@type": "Question", "name": "What data sources power the Macro Event Calendar?", "acceptedAnswer": { "@type": "Answer", "text": "The calendar aggregates FOMC, CPI, NFP, and PCE schedules from the Federal Reserve and BLS. Each event is scored for historical BTC impact using 2 years of real price data via yfinance, showing median move and directional bias." } },
                    { "@type": "Question", "name": "Is this terminal suitable for automated strategies?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. The Signal Archive and Backtester V2 allow historical performance validation across market regimes. The Trade Idea Lab and Trade Ledger support structured execution, and the institutional API provides programmatic data access for quant desks." } },
                    { "@type": "Question", "name": "Can I use AlphaSignal on mobile?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. AlphaSignal is a Progressive Web App (PWA) installable on iOS and Android. Navigate to the terminal on your mobile browser and select Add to Home Screen for a full native-app experience." } }
                ]
            });
        }

        ldJsonEl.textContent = JSON.stringify(schemas);
    }

    console.log(`SEO Update: Full synchronization complete for view "${view}"`);
}

