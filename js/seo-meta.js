function updateSEOMeta(view) {
    const viewMetadata = {
        // === ROOT / HOME ===
        'home': {
            title: 'AlphaSignal â€” Institutional Crypto Intelligence Terminal',
            desc: 'AlphaSignal is a real-time institutional intelligence terminal for Bitcoin, crypto, and macro markets. AI-powered signals, options flow, whale tracking, portfolio optimiser, macro calendar, and 60+ analytical views.'
        },

        // === COMMAND CENTER ===
        'command-center': {
            title: 'Institutional Command Center',
            desc: 'Consolidated real-time intelligence dashboard aggregating key signals from all AlphaSignal hubs â€” ETF flows, macro correlation, top alpha signals, and system conviction dials.'
        },
        'ask-terminal': {
            title: 'Ask Terminal â€” AI Research Assistant',
            desc: 'Conversational AI research assistant with full AlphaSignal terminal context. Ask about signals, market regimes, options flow, or any institutional metric and receive GPT-4 powered analysis instantly.'
        },

        // === GLOBAL MARKETS HUB ===
        'global-hub': {
            title: 'Global Markets Intelligence Hub',
            desc: 'Consolidated institutional view of Bitcoin spot ETF flows, leveraged liquidation cascades, open interest radar, and CME futures gap analysis.'
        },
        'etf-flows': {
            title: 'Bitcoin Spot ETF Flows â€” Live Institutional Capital Tracker',
            desc: 'Real-time daily net flows across all regulated Bitcoin spot ETFs including BlackRock IBIT, Fidelity FBTC, and ARK ARKB. Track institutional accumulation and distribution cycles.'
        },
        'liquidations': {
            title: 'Crypto Liquidation Cascade Scanner â€” Live Leverage Wipeouts',
            desc: 'Real-time monitoring of long and short liquidations across Binance, OKX, Bybit, and Deribit. Detect liquidation clusters and cascade alerts before they impact spot price.'
        },
        'oi-radar': {
            title: 'Open Interest Radar â€” Derivatives Leverage Monitor',
            desc: 'Cross-asset perpetual futures open interest tracking with funding rate overlay. Identify over-leveraged conditions and OI vs price divergences across 20+ assets.'
        },
        'cme-gaps': {
            title: 'CME Bitcoin Gap Tracker â€” Unfilled Price Gaps',
            desc: 'Track all unfilled CME Bitcoin futures price gaps with historical fill probability scoring. 77% of CME gaps fill within 90 days â€” a key institutional pricing tool.'
        },

        // === MACRO INTEL HUB ===
        'macro-hub': {
            title: 'Macro Intelligence Hub',
            desc: 'Multi-dimensional analysis of global macro catalysts, capital flows, sector rotation, correlation matrices, and market regime classification â€” all in one institutional hub.'
        },
        'briefing': {
            title: 'AI Market Intelligence Briefing',
            desc: 'Daily GPT-powered synthesis of global market trends, institutional sentiment, and narrative shifts across Bitcoin, macro, and crypto ecosystem data streams.'
        },
        'flow': {
            title: 'Institutional Capital Flows Monitor',
            desc: 'Track the velocity and direction of institutional capital via ETF flows, exchange reserve changes, and stablecoin minting velocity â€” the definitive macro bull/bear signal.'
        },
        'rotation': {
            title: 'Crypto Sector Rotation Tracker',
            desc: 'Weighted treemap and momentum matrix showing capital rotation across L1, DeFi, AI, Memes, Gaming, and RWA sectors. Identify the next sector rotation before the crowd.'
        },
        'macro': {
            title: 'Macro Compass â€” Global Economic Impact Dashboard',
            desc: 'Synthesised macro intelligence covering DXY strength, yield curve shape, equity correlation, and risk regime classification and their real-time impact on crypto markets.'
        },
        'correlation-matrix': {
            title: 'Cross-Asset Correlation Matrix',
            desc: 'Live statistical heatmap of rolling 30-day correlations across BTC, ETH, SPX, DXY, Gold, and 10Y Treasury yields. Identify decoupling events and rotation signals.'
        },
        'macro-calendar': {
            title: 'Macro Event Calendar â€” FOMC, CPI, NFP, PCE Impact Scorer',
            desc: '90-day forward calendar of institutional macro events scored by historical Bitcoin price impact. FOMC, CPI, NFP, and PCE dates with median BTC move and volatility data.'
        },
        'regime': {
            title: 'Market Regime Framework â€” Markov Cycle Classification',
            desc: 'Statistical classification of Bitcoin market cycles using Markov-Switching approximation. Identifies Accumulation, Distribution, Trending Bull, and Trending Bear regimes in real-time.'
        },

        // === ALPHA STRATEGY HUB ===
        'alpha-hub': {
            title: 'Alpha Strategy Hub â€” Institutional Signal Intelligence',
            desc: 'Institutional AI alpha synthesis, Z-score signal generation, ML alpha scoring, strategy lab, signal backtester, archive, and narrative galaxy â€” all in one strategy hub.'
        },
        'signals': {
            title: 'Live Alpha Signals â€” Z-Score Market Intelligence',
            desc: 'Real-time Z-score deviation signals across 50+ institutional crypto assets. High-conviction alpha signals powered by ML neural features, orderflow magnitude, and on-chain data.'
        },
        'alpha-score': {
            title: 'Alpha Score Dashboard â€” Multi-Factor Asset Ranking',
            desc: 'Composite multi-factor alpha score ranking across 50+ assets combining Z-score signal strength, ML prediction confidence, on-chain momentum, and neural sentiment.'
        },
        'strategy-lab': {
            title: 'Strategy Lab â€” Pairs Trading, Momentum & Kelly Sizer',
            desc: 'Institutional strategy laboratory with Pairs Trading, Momentum Ignition, Regime Carry, Kelly Position Sizer, Dual Momentum, and walk-forward validation.'
        },
        'backtester-v2': {
            title: 'Signal Backtester V2 â€” Historical Performance Simulator',
            desc: 'Backtest live AlphaSignal Z-score signals against real historical data. Rolling Sharpe ratio, monthly P&L calendar, maximum drawdown, and BTC benchmark comparison.'
        },
        'signal-archive': {
            title: 'Signal Execution Archive â€” Historical Alpha Record',
            desc: 'Immutable audit trail of all historical AlphaSignal Z-score signals with execution timestamps, outcome tracking, and institutional win-rate analytics.'
        },
        'narrative': {
            title: 'Narrative Galaxy â€” Crypto Mindshare Cluster Map',
            desc: 'Force-directed graph visualization of crypto market narratives. Track narrative velocity, sentiment polarity, crowded trades, and emerging thesis clusters across social media.'
        },

        // === INSTITUTIONAL HUB ===
        'institutional-hub': {
            title: 'Institutional Hub â€” Portfolio, Unlocks & Yield Intelligence',
            desc: 'Institutional-grade intelligence for token unlock schedules, DeFi yield comparison, AI portfolio optimisation, and structured trade idea generation with execution ledger integration.'
        },
        'token-unlocks': {
            title: 'Token Unlock Schedule â€” Supply Shock & Sell Pressure Tracker',
            desc: 'Forward-looking 90-day calendar of major token vesting unlocks scored by supply shock severity. Track investor and team unlock events before they create sell pressure.'
        },
        'yield-lab': {
            title: 'DeFi Yield Lab â€” Protocol Rate Comparison Engine',
            desc: 'Multi-protocol DeFi yield aggregator comparing Aave, Compound, Lido, Rocket Pool APY rates with risk-adjusted scoring and DeFi vs TradFi spread tracking.'
        },
        'portfolio-optimizer': {
            title: 'AI Portfolio Optimizer â€” Monte Carlo & Markowitz Rebalancer',
            desc: 'AI-powered portfolio optimiser using Monte Carlo simulation and Markowitz Efficient Frontier. GPT-4 generates a rebalancing memo with execution tickets for full audit trail.'
        },
        'portfolio': {
            title: 'Portfolio Simulation Lab â€” VaR & Attribution Modelling',
            desc: 'Simulate institutional portfolio performance, Value-at-Risk modelling, drawdown analysis, and correlation attribution across your custom asset basket.'
        },
        'tradelab': {
            title: 'Trade Idea Lab â€” AI-Assisted Execution Workspace',
            desc: 'Build structured institutional trade ideas with AI-generated thesis memos, risk/reward calculation, and one-click conversion to the institutional trade ledger.'
        },

        // === ANALYTICS HUB ===
        'analytics-hub': {
            title: 'Analytics Hub â€” Whale, On-Chain, Options & Newsroom Intelligence',
            desc: 'Full institutional analytics suite: whale pulse tracking, cross-chain velocity, real MVRV/SOPR on-chain data, Deribit options flow scanner, and AI-tagged crypto newsroom.'
        },
        'whales': {
            title: 'AI Whale Pulse Monitor â€” Institutional Transaction Tracker',
            desc: 'Real-time detection of institutional-sized Bitcoin, Ethereum, and Solana on-chain transactions. Entity clustering distinguishes true accumulation from exchange cold wallet shifts.'
        },
        'velocity': {
            title: 'Cross-Chain Capital Velocity â€” Volume Acceleration Tracker',
            desc: 'Track capital rotation velocity and volume acceleration across Ethereum, Solana, Avalanche, and Cardano. Identify which chain is attracting institutional attention next.'
        },
        'onchain': {
            title: 'On-Chain Analytics â€” MVRV, SOPR & Puell Multiple',
            desc: 'Real on-chain intelligence: MVRV ratio, SOPR, Puell Multiple, and hashrate data sourced live from CoinGecko and Blockchain.info. Institutional-grade blockchain fundamentals.'
        },
        'options-flow': {
            title: 'Deribit Options Flow Scanner â€” PCR, Max Pain & IV Smile',
            desc: 'Live BTC and ETH options market intelligence from Deribit: Put/Call ratio, Max Pain strike, ATM implied volatility, IV smile chart, and top open-interest strikes.'
        },
        'newsroom': {
            title: 'Institutional Crypto Newsroom â€” AI Sentiment Tagged News Feed',
            desc: 'Real-time institutional crypto news with AI BULLISH/BEARISH/NEUTRAL sentiment tagging. Filtered for regulatory developments, ETF news, protocol announcements, and macro policy shifts.'
        },
        'tradingview-hub': {
            title: 'TradingView Intelligence Hub - 13 Live Market Widgets | AlphaSignal',
            desc: '13 live TradingView widgets in one terminal tab: market overview, BTC/ETH/SOL comparison, technical analysis gauges, crypto screener, economic calendar, hotlists, crypto heatmap, forex heat map, and S&P 500 sector heatmap.'
        },
        'custom-analytics': {
            title: 'Custom Analytics Charts - BTC Dominance, Funding Rates & Volatility | AlphaSignal',
            desc: 'Four proprietary live charts built on AlphaSignal backend data: BTC dominance area chart (60D), per-asset funding rate bar chart (live Binance FAPI), normalized MVRV/SOPR overlay, and 30-day rolling annualised volatility. All click-to-expand.'
        },

        // === AUDIT & PERFORMANCE HUB ===
        'audit-hub': {
            title: 'Audit & Performance Hub â€” Trade Ledger & Analytics',
            desc: 'Institutional audit and performance tracking hub with persistent trade ledger, AI thesis archive, monthly P&L calendar, and BTC benchmark comparison.'
        },
        'trade-ledger': {
            title: 'Institutional Trade Ledger â€” Auditable Execution Record',
            desc: 'Persistent, auditable log of all AI-generated and manual execution tickets with status tracking, AI thesis archive, PnL attribution, and CSV export for compliance.'
        },
        'performance-dashboard': {
            title: 'Performance Analytics Dashboard â€” Track Record & Attribution',
            desc: 'Institutional performance analytics with win rate, monthly P&L calendar, rolling Sharpe ratio, maximum drawdown tracking, and BTC benchmark comparison.'
        },

        // === RISK & STRESS HUB ===
        'risk-hub': {
            title: 'Risk & Stress Hub â€” Portfolio Protection Intelligence',
            desc: 'Institutional risk management hub with real-time risk matrix for position sizing, tail-risk stress testing, volatility regime detection, and macro scenario modelling.'
        },
        'risk': {
            title: 'Risk Matrix â€” Institutional Position Sizing & VaR',
            desc: 'Real-time institutional risk matrix combining volatility, drawdown, and Value-at-Risk for disciplined position sizing. Protect capital across all market regimes.'
        },
        'stress': {
            title: 'Stress Lab â€” Macro Scenario & Tail Risk Analysis',
            desc: 'Macro stress-testing your portfolio against historic crash scenarios. Quantify tail-risk exposure, correlation spikes, and maximum drawdown under extreme market conditions.'
        },

        // === ADVANCED CHARTING ===
        'advanced-charting': {
            title: 'Advanced Charting Suite â€” Professional Institutional Charts',
            desc: 'Professional institutional charting with TradingView integration, funding rate heatmap, 3D volatility surface, tape imbalance histogram, CVD chart, and multi-asset overlays.'
        },

        // === STANDALONE ===
        'mindshare': {
            title: 'Social Mindshare Analytics â€” Narrative Dominance Tracker',
            desc: 'NLP-driven social sentiment and narrative dominance tracking across Bitcoin, Ethereum, and 50+ crypto assets. Real-time crowd positioning and mindshare shift detection.'
        },
        'liquidity': {
            title: 'Order Flow Magnitude Monitor (GOMM) â€” Institutional Tape',
            desc: 'Visualise professional liquidity walls, order book depth, CVD divergence, and institutional execution tape. Identify large block order flow before price discovery completes.'
        },
        'heatmap': {
            title: 'Market Heatmap â€” Z-Score Signal Intensity Grid',
            desc: 'Colour-coded Z-score heatmap across the full 50+ asset universe. Instantly identify where statistical alpha is concentrated by sector and asset class.'
        },
        'alerts': {
            title: 'Real-Time Signal Alerts â€” Discord & Telegram Webhooks',
            desc: 'Configure Z-score alert thresholds and receive institutional signal alerts via Discord or Telegram webhooks. Customisable sensitivity with test-fire capability.'
        },
        'help': {
            title: 'Help & Documentation Hub â€” AlphaSignal Terminal Guides',
            desc: 'Complete documentation for all 60+ AlphaSignal views organised by hub. Covers methodology, data sources, analytical frameworks, and institutional best practices.'
        },
        'backtest': {
            title: 'Signal Backtester â€” Historical Strategy Validation',
            desc: 'Quantitative backtesting of institutional signals against historical market data for performance validation.'
        },
        'catalysts': {
            title: 'Market Catalysts Calendar',
            desc: 'Comprehensive calendar of institutional-grade volatility events, macro releases, and regulatory triggers affecting crypto markets.'
        },

        // === LEGACY EXPLAIN-* REDIRECT ALIASES (canonical URLs now at docs-*) ===
        // These preserved for any Google-indexed explain-* pages â€” all routes in main.js
        // redirect to their docs-* equivalents. Kept here for SEO title/desc fallback only.
        'explain-signals': { title: 'Signal Intelligence Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-signals. AlphaSignal Z-score deviation signals across 50+ institutional crypto assets.' },
        'explain-briefing': { title: 'AI Briefing Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-briefing. GPT-4o macro memo and system conviction dials.' },
        'explain-liquidity': { title: 'Order Flow GOMM Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-order-flow. Institutional liquidity walls, tape imbalance, CVD.' },
        'explain-ml-engine': { title: 'ML Alpha Engine Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-ml-engine. LSTM predictions, confidence delta, signal correlation.' },
        'explain-whales': { title: 'Whale Pulse Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-whale-pulse. Institutional on-chain transaction tracker.' },
        'explain-mindshare': { title: 'Narrative Galaxy Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-narrative. NLP cluster map and narrative velocity.' },
        'explain-benchmark': { title: 'Performance Dashboard Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-performance. Portfolio equity curve and P&L attribution.' },
        'explain-alerts': { title: 'Live Alerts Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-alerts. Z-score alert feed, severity levels, filter controls.' },
        'explain-zscore': { title: 'Z-Score & Stress Lab Docs | AlphaSignal', desc: 'Z-Score interpretation guide. See docs-signals and docs-stress-lab for full per-chart documentation.' },
        'explain-alpha': { title: 'Alpha Strategy Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-alpha-score. Composite alpha ranking and grade distribution.' },
        'explain-correlation': { title: 'Correlation Matrix Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-onchain. Cross-asset correlation matrix methodology.' },
        'explain-sentiment': { title: 'Sentiment Engine Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-newsroom. AI sentiment tagging and news feed signals.' },
        'explain-risk': { title: 'Risk Matrix Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-risk-matrix. Portfolio VaR and position sizing guide.' },
        'explain-playbook': { title: 'Trading Playbook Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-strategy-lab. Pairs trading, momentum, Kelly Sizer.' },
        'explain-regimes': { title: 'Market Regime Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-regime. Markov-Switching regime classification guide.' },
        'explain-advanced-charting': { title: 'Charting Suite Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-charting-suite. OHLCV, CVD, Volume Profile guide.' },
        'explain-onchain': { title: 'On-Chain Analytics Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-onchain. MVRV, SOPR, Puell Multiple guide.' },
        'explain-api': { title: 'Institutional API Docs | AlphaSignal', desc: 'Programmatic access to AlphaSignal signals. See the Help Hub for full documentation.' },
        'explain-glossary': { title: 'Terminal Glossary | AlphaSignal', desc: 'Quick-reference guide to AlphaSignal terminal metrics and institutional terminology.' },
        'explain-performance': { title: 'Performance Analytics Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-performance. Win rate, Sharpe, monthly P&L calendar.' },
        'explain-alpha-score': { title: 'Alpha Score Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-alpha-score. Multi-factor composite ranking methodology.' },
        'explain-telegram': { title: 'Alert Hooks Setup | AlphaSignal', desc: 'Setup guide for Discord and Telegram webhook integration with Z-score sensitivity thresholds.' },
        'explain-pwa': { title: 'Mobile PWA Guide | AlphaSignal', desc: 'Install AlphaSignal as a Progressive Web App on iOS and Android for full native terminal access.' },
        'explain-portfolio-lab': { title: 'Portfolio Optimizer Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-portfolio-optimizer. Monte Carlo and Efficient Frontier guide.' },
        'explain-velocity': { title: 'Chain Velocity Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-chain-velocity. Cross-chain capital rotation tracker.' },
        'explain-signal-archive': { title: 'Signal Archive Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-signal-archive. Historical signal audit trail and win rate.' },
        'explain-topologies': { title: 'Charting Topologies Docs | AlphaSignal', desc: 'Institutional charting topologies and geometric visualisation methodology.' },
        'explain-ai-engine': { title: 'AI Engine & Ask Terminal Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-ask-terminal. GPT-4o AI chat and thesis generator.' },
        'explain-strategy-lab': { title: 'Strategy Lab Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-strategy-lab. Pairs trading, Momentum Ignition, Kelly Sizer.' },
        'explain-backtester-v2': { title: 'Backtester V2 Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-backtester. Equity curve, monthly P&L, drawdown analysis.' },
        'explain-tradingview': { title: 'TradingView Integration Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-tradingview. Embedded TradingView Pro chart guide.' },
        'explain-etf-flows': { title: 'ETF Flows Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-etf-flows. Bitcoin Spot ETF daily flows and leaderboard.' },
        'explain-liquidations': { title: 'Liquidation Scanner Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-liquidations. Leverage wipeout detection and cascade alerts.' },
        'explain-oi-radar': { title: 'OI Radar Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-oi-radar. Open interest vs price divergence and funding rate.' },
        'explain-cme-gaps': { title: 'CME Gaps Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-cme-gaps. Gap inventory, fill probability scoring guide.' },
        'explain-flow': { title: 'Capital Flows Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-order-flow. ETF flows, stablecoin velocity, exchange positions.' },
        'explain-rotation': { title: 'Sector Rotation Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-rotation. RRG chart, momentum matrix, rotation leaders.' },
        'explain-macro-compass': { title: 'Macro Compass Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-macro-compass. M2, DXY, yield curve, global risk scatter.' },
        'explain-macro-calendar': { title: 'Macro Calendar Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-macro-calendar. FOMC/CPI/NFP BTC impact scoring.' },
        'explain-narrative': { title: 'Narrative Galaxy Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-narrative. 3D cluster chart and narrative velocity.' },
        'explain-token-unlocks': { title: 'Token Unlocks Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-token-unlocks. Supply shock scoring and unlock calendar.' },
        'explain-yield-lab': { title: 'DeFi Yield Lab Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-yield-lab. APY comparison, risk scores, DeFi vs TradFi.' },
        'explain-tradelab': { title: 'Trade Idea Lab Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-tradelab. Thesis builder, R/R calculator, ledger integration.' },
        'explain-options-flow': { title: 'Options Flow Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-options-flow. PCR, Max Pain, IV Smile, OI strikes.' },
        'explain-newsroom': { title: 'Newsroom Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-newsroom. AI sentiment feed and keyword heatmap.' },
        'explain-trade-ledger': { title: 'Trade Ledger Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-trade-ledger. Execution log, P&L attribution, CSV export.' },
        'explain-heatmap': { title: 'Market Heatmap Docs | AlphaSignal', desc: 'Z-score heatmap across the 50+ asset universe. See the Help Hub for full documentation.' },
        'explain-command-center': { title: 'Command Center Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-command-center. Hub quick-links, BTC sparkline, conviction dials.' },
        'explain-ask-terminal': { title: 'Ask Terminal Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-ask-terminal. GPT-4o AI chat with terminal context injection.' },
        'explain-my-terminal': { title: 'My Terminal Docs | AlphaSignal', desc: 'Full per-chart documentation now at docs-my-terminal. Live P&L watchlist, win rate, notifications.' },

        // === ALERTS HUB & TABS ===
        'alerts-hub': {
            title: 'Alerts Hub â€” Live Signal Alerts, Price Alerts & Market Brief',
            desc: 'Centralised institutional alert hub: real-time Z-score signal alerts, custom price-level triggers, signal leaderboard, AI market brief, and full signal archive â€” with Telegram & Discord delivery.'
        },
        'price-alerts': {
            title: 'Price Alerts â€” Custom Threshold Alert Engine',
            desc: 'Set custom price-level alerts for any tracked asset. Receive instant notifications via Telegram or Discord when your target price is hit above or below.'
        },
        'price-alerts-hub': {
            title: 'Price Alerts Hub â€” Custom Threshold Alert Engine',
            desc: 'Institutional price alert management. Set multi-asset price triggers with delivery to Telegram or Discord webhooks. Configurable condition logic and persistent storage.'
        },
        'signal-leaderboard': {
            title: 'Signal Leaderboard â€” Top Performing Alpha Signals',
            desc: 'Ranked leaderboard of all historical AlphaSignal Z-score signals sorted by alpha generated. Identify the consistently highest-conviction assets and signal categories.'
        },
        'leaderboard-hub': {
            title: 'Signal Leaderboard Hub â€” Top Performing Alpha Signals',
            desc: 'Ranked leaderboard of all historical AlphaSignal Z-score signals sorted by alpha performance. Filter by ticker, category, and timeframe to pinpoint sustainable edge.'
        },
        'market-brief': {
            title: 'AI Market Brief â€” Daily Institutional Intelligence Memo',
            desc: 'AI-generated daily institutional briefing synthesising macro context, top Z-score signals, ETF capital flows, sector rotation, and options skew into one concise read.'
        },
        'market-brief-hub': {
            title: 'Market Brief Hub â€” AI Daily Intelligence Briefing',
            desc: 'On-demand AI-powered market brief. Synthesises live macro data, top signals, ETF flows, and narrative momentum into a structured institutional memo. Generated by GPT-4o-mini.'
        },

        // === MY TERMINAL ===
        'my-terminal': {
            title: 'My Terminal â€” Personal Watchlist & Live P&L Tracker',
            desc: 'Your personalised AlphaSignal workspace. Track custom watchlist positions with live P&L, portfolio win rate, and browser notification alerts. Persists across sessions.'
        },

        // === AI REBALANCER ===
        'ai-rebalancer': {
            title: 'AI Portfolio Rebalancer â€” Monte Carlo Optimisation Engine',
            desc: 'AI-powered portfolio rebalancing using Monte Carlo simulation, Markowitz Efficient Frontier, and GPT-4 generated execution memos. Full audit trail via the institutional trade ledger.'
        },


        // === DOCS â€” PER-VIEW DOCUMENTATION PAGES (v1.57) ===
        'docs-etf-flows': { title: 'Bitcoin ETF Flows â€“ Chart Guide | AlphaSignal Docs', desc: 'Full documentation for the AlphaSignal ETF Flows view. Explains the Bitcoin Spot ETF Daily Flows bar chart, Daily Leaderboard table, and Cumulative Net Flow Waterfall â€” with how-to-read guides and key trading signals for each component.' },
        'docs-liquidations': { title: 'Liquidation Scanner â€“ Chart Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal Liquidations view. Covers the liquidation cascade chart, heatmap, and cumulative chart â€” what each component means, how to read abnormal clusters, and when they signal high-conviction entries.' },
        'docs-oi-radar': { title: 'Open Interest Radar â€“ Chart Guide | AlphaSignal Docs', desc: 'Technical reference for the AlphaSignal OI Radar view. Explains OI vs price divergence charts and funding rate heatmap â€” including signals for over-leveraged conditions and leverage flush risks.' },
        'docs-cme-gaps': { title: 'CME Gap Tracker â€“ Chart Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal CME Gaps view. Covers the gap inventory table, fill probability scoring, and price overlay â€” with historical fill rate data and strategies built around CME gap mechanics.' },
        'docs-briefing': { title: 'AI Macro Briefing â€“ Component Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Macro Briefing view. Explains the GPT-4o macro memo, System Conviction Dials (Fear & Greed, Network Congestion, Retail Sentiment), and BTC Correlation Tracker â€” with signal interpretation for each gauge.' },
        'docs-rotation': { title: 'Sector Rotation â€“ RRG Chart Guide | AlphaSignal Docs', desc: 'Technical reference for the Alpha Signal Sector Rotation view. Documents the Relative Rotation Graph (RRG), 30-day sector heatmap, and momentum leader table â€” with institutional rotation cycle interpretation.' },
        'docs-macro-compass': { title: 'Macro Compass â€“ Regime Chart Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Macro Compass. Explains the M2 vs BTC chart, DXY overlay, yield curve monitor, and global risk scatter â€” with regime-based trading signals for each indicator.' },
        'docs-macro-calendar': { title: 'Macro Event Calendar â€“ Guide | AlphaSignal Docs', desc: 'Full documentation for the Alpha Signal Macro Calendar. Covers the event timeline, BTC impact scoring, and historical volatility overlay â€” explaining how FOMC, CPI, and NFP events have historically moved Bitcoin.' },
        'docs-regime': { title: 'Market Regime Engine â€“ Classification Guide | AlphaSignal Docs', desc: 'Technical reference for the AlphaSignal Regime Classifier. Documents the Regime Dial, 12-month history chart, and Strategy Allocation Table â€” with signal rules for each of the four regime states.' },
        'docs-signals': { title: 'Alpha Signals â€“ Z-Score Card Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Signals view. Explains Z-score signal cards, momentum vector bars, and historical signal performance â€” with a full breakdown of how the rolling Z-score is calculated and how to trade the levels.' },
        'docs-ml-engine': { title: 'ML Engine â€“ Prediction Model Guide | AlphaSignal Docs', desc: 'Technical reference for the Alpha Signal ML Engine. Documents the 7-day directional probability bars, confidence delta chart, and signal correlation matrix â€” explaining how the ensemble model generates its predictions.' },
        'docs-alpha-score': { title: 'Alpha Score â€“ Composite Ranking Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Alpha Score view. Explains the composite ranking table, grade distribution chart, and score breakdown â€” covering all five contributing factors and how to use grades for asset selection.' },
        'docs-strategy-lab': { title: 'Strategy Lab â€“ Rules Builder Guide | AlphaSignal Docs', desc: 'Full documentation for the Alpha Signal Strategy Lab. Covers the visual signal rules builder, backtest performance chart, and parameter sensitivity table â€” with guidance on building and validating custom signal strategies.' },
        'docs-backtester': { title: 'Signal Backtester V2 â€“ Performance Guide | AlphaSignal Docs', desc: 'Technical reference for the AlphaSignal Backtester V2. Explains the equity curve, monthly return heatmap, drawdown analysis, and regime breakdown â€” with institutional interpretation of Sharpe, Sortino, and Calmar ratios.' },
        'docs-signal-archive': { title: 'Signal Archive â€“ Historical Record Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal Archive view. Covers the historical signal table, win rate analysis, and signal replay chart â€” a complete auditable record of all Z-score signals and their outcomes.' },
        'docs-narrative': { title: 'Narrative Galaxy â€“ Trend Cluster Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Narrative Galaxy. Explains the 3D force-directed cluster chart, trending keyword timeline, and dominant narrative radar â€” with signals for identifying emerging vs fading market narratives.' },
        'docs-token-unlocks': { title: 'Token Unlock Schedule â€“ Table Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal Token Unlocks view. Explains the unlock schedule table, supply impact score badges, and sell pressure ratings â€” with signal rules for positioning around major protocol unlock events.' },
        'docs-yield-lab': { title: 'DeFi Yield Lab â€“ Protocol Comparison Guide | AlphaSignal Docs', desc: 'Technical reference for the AlphaSignal Yield Lab. Covers the APY comparison table, real yield vs emissions breakdown, and protocol risk score bars â€” signals for identifying sustainable DeFi yield vs inflationary traps.' },
        'docs-portfolio-optimizer': { title: 'Portfolio Optimizer â€“ Efficient Frontier Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal Portfolio Optimizer. Explains the ML rebalancing table, allocation radar, and Efficient Frontier scatter â€” with institutional portfolio construction and regime-adaptive weighting signals.' },
        'docs-tradelab': { title: 'Trade Idea Lab â€“ Thesis Builder Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Trade Idea Lab. Covers the systematic thesis builder form, risk/reward calculator, and AI thesis validator â€” with rules for structuring institutional-grade trade setups before committing capital.' },
        'docs-whale-pulse': { title: 'Whale Pulse â€“ On-Chain Transaction Guide | AlphaSignal Docs', desc: 'Technical reference for the Alpha Signal Whale Pulse. Explains the whale transaction feed, execution time polar chart, and volume bubble scatter â€” with signals for identifying coordinated institutional accumulation and distribution.' },
        'docs-chain-velocity': { title: 'Chain Velocity â€“ Cross-Chain Capital Flow Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Chain Velocity view. Explains the velocity time-series chart, cross-chain Sankey flow diagram, and Network Signature Radar â€” with signals for identifying institutional capital rotation across Ethereum, Solana, Avalanche, and Cardano.' },
        'docs-onchain': { title: 'On-Chain Analytics â€“ MVRV, SOPR, NVT, Puell Guide | AlphaSignal Docs', desc: 'Full documentation for the AlphaSignal On-Chain Analytics view. Covers MVRV Z-Score, SOPR, Puell Multiple, NVT Ratio, and Realised Price Overlay â€” all five Bitcoin cycle valuation metrics with actionable signal rules.' },
        'docs-options-flow': { title: 'Options Flow â€“ Deribit Structure Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal Options Flow view. Explains the Put/Call Ratio gauge, Max Pain chart, IV Smile Curve, and top OI strikes table â€” with signals for reading institutional options positioning.' },
        'docs-newsroom': { title: 'Newsroom â€“ AI Sentiment Feed Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Newsroom. Covers the live news feed with AI sentiment classification and keyword heatmap â€” including signal rules for high-impact regulatory, institutional, and macro news events.' },
        'docs-trade-ledger': { title: 'Trade Ledger â€“ Audit Log Guide | AlphaSignal Docs', desc: 'Technical reference for the Alpha Signal Trade Ledger. Explains the trade log table, signal source attribution, and performance attribution â€” a complete auditable track record of every signal-based trade.' },
        'docs-performance': { title: 'Performance Dashboard â€“ Equity Curve Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Performance Dashboard. Covers key stat cards, monthly ROI heatmap calendar, and portfolio equity curve vs BTC benchmark â€” with institutional performance attribution interpretation.' },
        'docs-risk-matrix': { title: 'Risk Matrix â€“ Portfolio VaR Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal Risk Matrix. Explains the Portfolio VaR gauge, volatility-adjusted position sizer, and correlation scatter â€” with institutional risk management rules for sizing and hedging every position.' },
        'docs-stress-lab': { title: 'Stress Test Lab â€“ Scenario Guide | AlphaSignal Docs', desc: 'Technical reference for the AlphaSignal Stress Test Lab. Covers the historical scenario table (FTX, March 2020, Luna) and distribution chart â€” stress-testing current portfolio exposure against extreme market events.' },
        'docs-charting-suite': { title: 'Charting Suite â€“ Order Flow Charts Guide | AlphaSignal Docs', desc: 'Full documentation for the Alpha Signal Charting Suite. Explains the OHLCV chart, Volume Profile, Cumulative Volume Delta (CVD), and Market Depth â€” with institutional interpretation signals for each panel.' },
        'docs-tradingview-hub': { title: 'TradingView Hub Docs - 13 Widget Guide | AlphaSignal', desc: 'Complete documentation for the AlphaSignal TradingView Intelligence Hub. Covers all 13 live widgets: Market Overview, Symbol Comparison, TA Gauges (BTC/ETH/SOL/BNB), Crypto Screener, Economic Calendar, Hotlists, Crypto Heatmap, Forex Cross Rates, Forex Heat Map, and S&P 500 Sector Heatmap — with actionable signal rules for each.' },
        'docs-custom-charts': { title: 'Custom Charts Docs - Dominance, Funding, MVRV/SOPR, Volatility | AlphaSignal', desc: 'Technical reference for the AlphaSignal Custom Charts tab. Documents BTC Dominance (60D proxy market cap), Funding Rate bar chart (live Binance FAPI), MVRV/SOPR Overlay (normalized 0-1 dual-line), and 30-Day Rolling Volatility (annualised) — with cycle signal rules for each chart.' },
        'docs-tradingview': { title: 'TradingView Widget â€“ Embedded Chart Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal TradingView integration. Covers the embedded TradingView Pro chart with all built-in indicators, drawing tools, and multi-timeframe analysis directly inside the terminal.' },
        'docs-order-flow': { title: 'Liquidity Dashboard â€“ GOMM Order Flow Guide | AlphaSignal Docs', desc: 'Technical reference for the Alpha Signal GOMM Liquidity Dashboard. Explains the aggregated order book, live execution tape, and institutional liquidity heatmap â€” with signals for identifying high-probability institutional price levels.' },
        'docs-alerts': { title: 'Live Signal Alerts â€“ Alert Feed Guide | AlphaSignal Docs', desc: 'Documentation for AlphaSignal Live Alerts. Explains alert feed cards, severity levels (LOW / MEDIUM / HIGH / CRITICAL), and filter controls â€” including signal rules for CRITICAL Z-Score and Regime Change alert responses.' },
        'docs-price-alerts': { title: 'Price Alerts â€“ Custom Trigger Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal Price Alerts view. Covers the alert manager table, creation form, and browser push notification setup â€” with best practice rules for pairing entry alerts with corresponding stop alerts.' },
        'docs-signal-leaderboard': { title: 'Signal Leaderboard â€“ Performance Ranking Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Signal Leaderboard. Explains the ranked performance table with 7D / 30D / 90D / All-Time filtering â€” identifying which signal types generate genuine repeatable alpha across all market regimes.' },
        'docs-market-brief': { title: 'AI Market Brief â€“ Daily Memo Guide | AlphaSignal Docs', desc: 'Documentation for the Alpha Signal Market Brief. Explains the five-section AI daily brief (Overnight Summary, Signal Environment, Macro Watch, Risk Signals, Actionable Ideas) â€” generated by GPT-4o with live terminal data injection.' },
        'docs-my-terminal': { title: 'My Terminal â€“ Watchlist & Notification Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal My Terminal personal hub. Covers the live P&L watchlist table, portfolio summary stats, and notification preference controls â€” with signals for grade changes and optimal alert configuration.' },
        'docs-ask-terminal': { title: 'Ask Terminal â€“ AI Chat Guide | AlphaSignal Docs', desc: 'Technical reference for the Alpha Signal Ask Terminal AI interface. Explains the GPT-4o chat with live terminal context injection and dynamic suggested query chips â€” with best practice question patterns for market analysis.' },
        'docs-command-center': { title: 'Command Center â€“ Dashboard Guide | AlphaSignal Docs', desc: 'Documentation for the AlphaSignal Command Center home screen. Explains the Alpha Score vs Z-Score scatter plot, Hub Quick-Link Grid, BTC sparkline, and System Conviction Dials â€” the single-glance intelligence overview for every session.' },

        // === MISC ROUTES ===
        'signal': {
            title: 'Live Alpha Signal â€” Z-Score Intelligence Detail',
            desc: 'Detailed Z-score signal view for a single institutional crypto asset. Includes momentum vector, alpha score, on-chain context, and AI-generated trade thesis.'
        },
    };

    const meta = viewMetadata[view] || {
        title: view.charAt(0).toUpperCase() + view.slice(1),
        desc: 'AlphaSignal (Alpha Signal) â€“ Institutional Crypto Intelligence Terminal. Real-time signals, on-chain analytics, and AI insights. alphasignal.digital'
    };

    const fullTitle = `${meta.title} | AlphaSignal â€“ Crypto Intelligence Terminal`;
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

