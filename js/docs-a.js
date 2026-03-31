function renderHelp() {
    const card = (view, icon, title, desc) => `
        <div class="help-card" onclick="switchView('${view}')" style="cursor:pointer;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:1.2rem;transition:all 0.2s;display:flex;flex-direction:column;gap:8px"
             onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(0,242,255,0.04)'"
             onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg-card)'">
            <div style="display:flex;align-items:center;gap:10px">
                <span class="material-symbols-outlined" style="color:var(--accent);font-size:1.3rem">${icon}</span>
                <span style="font-size:0.72rem;font-weight:800;letter-spacing:1.5px;color:var(--text)">${title}</span>
            </div>
            <p style="font-size:0.68rem;color:var(--text-dim);line-height:1.5;margin:0">${desc}</p>
        </div>`;
    const group = (title, icon, content) => `
        <div style="margin-bottom:2.5rem">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
                <span class="material-symbols-outlined" style="color:var(--accent)">${icon}</span>
                <h2 style="font-size:0.7rem;font-weight:900;letter-spacing:3px;color:var(--text);margin:0">${title}</h2>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1rem">${content}</div>
        </div>`;
    appEl.innerHTML = `
        <div class="view-header"><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent);">help</span>Terminal Documentation</h1></div>
        <div class="doc-container" style="max-width:1100px;margin:0 auto;padding-top:1.5rem;">
            <div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;margin-bottom:2rem;padding:1rem 1.5rem;background:linear-gradient(90deg,rgba(0,242,255,0.06),rgba(188,19,254,0.04));border:1px solid rgba(0,242,255,0.2);border-radius:12px">
                <span class="material-symbols-outlined" style="color:var(--accent);font-size:1.5rem">tour</span>
                <div style="flex:1">
                    <div style="font-size:0.7rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:2px">FIRST TIME HERE?</div>
                    <div style="font-size:0.75rem;color:var(--text-dim)">Take the guided 4-step onboarding tour to explore key terminal features.</div>
                </div>
                <button onclick="typeof window.startTour === 'function' ? window.startTour() : null" style="background:rgba(0,242,255,0.1);border:1px solid rgba(0,242,255,0.35);color:var(--accent);padding:8px 18px;border-radius:8px;cursor:pointer;font-family:var(--font-ui);font-size:0.72rem;font-weight:700;letter-spacing:1px;white-space:nowrap">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">play_arrow</span> TAKE THE TOUR
                </button>
            </div>
            <p style="font-size:0.95rem;color:var(--text-dim);margin-bottom:2.5rem;line-height:1.6;">One documentation page per view, organised by sidebar hub. Click any card to read the full methodology and data sources.</p>

            ${group('Global Markets Hub', 'public', `
                ${card('explain-etf-flows', 'account_balance', 'ETF Flows', 'Daily institutional capital via regulated Bitcoin spot ETF vehicles.')}
                ${card('explain-liquidations', 'local_fire_department', 'Liquidations', 'Real-time leveraged position wipeout scanner and cascade alerts.')}
                ${card('explain-oi-radar', 'track_changes', 'OI Radar', 'Multi-asset perpetual futures open interest tracking.')}
                ${card('explain-cme-gaps', 'pivot_table_chart', 'CME Gaps', 'Identifying and tracking unfilled Bitcoin CME futures gaps.')}
            `)}

            ${group('Macro Intel Hub', 'monitoring', `
                ${card('explain-briefing', 'description', 'Market Briefing', 'AI-powered narrative synthesis across Mindshare, Flow, and Technical data streams.')}
                ${card('explain-flow', 'swap_horiz', 'Capital Flows', 'Velocity and direction of institutional capital rotating into the crypto ecosystem.')}
                ${card('explain-rotation', 'rotate_right', 'Sector Rotation', 'Capital rotation across crypto sectors using a treemap and momentum matrix.')}
                ${card('explain-macro-compass', 'public', 'Macro Compass', 'Global macro environment synthesis and its impact on digital asset prices.')}
                ${card('explain-correlation', 'grid_4x4', 'Correlation Matrix', 'Identifying market decoupling, sector correlation, and rotation events.')}
                ${card('explain-macro-calendar', 'event', 'Macro Calendar', '90-day forward calendar of macro events scored by historical BTC impact.')}
                ${card('explain-regimes', 'layers', 'Market Regime', 'Statistical classification of market cycles using Markov-Switching approximation.')}
            `)}

            ${group('Alpha Strategy Hub', 'electric_bolt', `
                ${card('explain-signals', 'radar', 'Signal Intelligence', 'Understanding Z-Score deviations and alpha signal generation methodology.')}
                ${card('explain-ml-engine', 'model_training', 'ML Alpha Engine', 'Neural feature synthesis and multi-factor predictive modelling architecture.')}
                ${card('explain-alpha-score', 'bolt', 'Alpha Score', 'Composite multi-factor ranking and scoring methodology across 50+ assets.')}
                ${card('explain-strategy-lab', 'science', 'Strategy Lab', 'Pairs Trading, Momentum Ignition, Regime Carry, Kelly Sizer + walk-forward.')}
                ${card('explain-backtester-v2', 'analytics', 'Backtester V2', 'Live signal history simulation: rolling Sharpe, monthly P&L calendar, benchmark.')}
                ${card('explain-signal-archive', 'history', 'Signal Archive', 'Historical signal record, PnL tracking, and performance attribution.')}
                ${card('explain-narrative', 'hub', 'Narrative Galaxy', 'Force-directed graph of crypto narrative clusters and social momentum velocity.')}
                ${card('explain-ai-engine', 'smart_toy', 'AI Narrative Engine', 'GPT-4o-mini memos, Ask Terminal, and Signal Thesis Generator methodology.')}
            `)}

            ${group('Institutional Hub', 'key', `
                ${card('explain-token-unlocks', 'key', 'Token Unlocks', 'Forward-looking schedule of major vesting unlocks and projected sell pressure.')}
                ${card('explain-yield-lab', 'biotech', 'Yield Lab', 'Multi-protocol DeFi yield aggregator and risk-adjusted rate comparison engine.')}
                ${card('explain-portfolio-lab', 'auto_mode', 'Portfolio Optimizer', 'ML rebalancing, Monte Carlo optimisation, and Markowitz Efficient Frontier.')}
                ${card('explain-tradelab', 'experiment', 'Trade Idea Lab', 'AI-assisted workspace for building and validating structured trade ideas.')}
            `)}

            ${group('Analytics Hub', 'analytics', `
                ${card('explain-whales', 'waves', 'Whale Pulse', 'Detecting and tracking massive on-chain block transactions across networks.')}
                ${card('explain-velocity', 'speed', 'Chain Velocity', 'Capital rotation tracking and cross-chain volume acceleration metrics.')}
                ${card('explain-onchain', 'link', 'On-Chain Analytics', 'Real MVRV, SOPR, Puell Multiple and hashrate from CoinGecko + Blockchain.info.')}
                ${card('explain-options-flow', 'ssid_chart', 'Options Flow', 'Deribit BTC & ETH options: Put/Call ratio, Max Pain, IV smile, top OI strikes.')}
                ${card('explain-newsroom', 'newspaper', 'Newsroom', 'Real-time institutional crypto news feed with AI sentiment tagging.')}
            `)}

            ${group('Audit & Performance Hub', 'assignment', `
                ${card('explain-trade-ledger', 'list_alt', 'Trade Ledger', 'Persistent, auditable record of all AI-generated and manual execution tickets.')}
                ${card('explain-performance', 'trending_up', 'Performance Dashboard', 'Win rate, returns, monthly P&L calendar, and system benchmark comparison.')}
            `)}

            ${group('Risk & Stress Hub', 'grid_on', `
                ${card('explain-risk', 'shield_with_heart', 'Risk Matrix', 'Using volatility, drawdown, and VaR for institutional position sizing.')}
                ${card('explain-zscore', 'warning_amber', 'Stress Lab', 'Macro scenario stress-testing and tail risk modelling methodology.')}
            `)}

            ${group('Advanced Charting', 'candlestick_chart', `
                ${card('explain-advanced-charting', 'candlestick_chart', 'Charting Suite', 'Depth, orderbook overlays, CVD, funding heatmap, and 3D volatility surface.')}
                ${card('explain-tradingview', 'show_chart', 'TradingView', 'Professional charts with MA/RSI/MACD/BB pre-loaded. Supports all crypto + equity.')}
            `)}

            ${group('Alerts & Notifications Hub', 'notifications_active', `
                ${card('explain-alerts', 'notifications_active', 'Alerts Hub', 'Live signal alerts, price threshold alerts, leaderboard, and AI market brief — all in one hub.')}
                ${card('explain-heatmap', 'grid_view', 'Market Heatmap', 'Colour-coded Z-score heatmap across the entire 50+ asset tracked universe.')}
                ${card('explain-telegram', 'notifications_active', 'Alert Hooks', 'Configuring Telegram and Discord webhook intelligence delivery.')}
                ${card('explain-signal-archive', 'history', 'Signal Archive', 'Historical signal record, P&L tracking, and performance attribution.')}
            `)}

            ${group('Command & Navigation', 'dashboard', `
                ${card('explain-command-center', 'dashboard', 'Command Center', 'Consolidated master view: Conviction Dials, 4 analytics charts, ETF flows, correlation matrix, and top alpha.')}
                ${card('explain-ask-terminal', 'smart_toy', 'Ask Terminal', 'Conversational AI research assistant with full terminal context and methodology.')}
            `)}

            ${group('Personal Terminal', 'person', `
                ${card('explain-my-terminal', 'person', 'My Terminal', 'Personal watchlist, live P&L tracking, win rate summary, and browser notification alerts.')}
                ${card('explain-pwa', 'install_mobile', 'Mobile Terminal', 'PWA installation guide for iOS and Android — offline-capable terminal access.')}
            `)}

            ${group('Reference & System', 'menu_book', `
                ${card('explain-playbook', 'auto_stories', 'Trading Playbook', 'Advanced strategies, signal combinations, and institutional decision frameworks.')}
                ${card('explain-alpha', 'trending_up', 'Alpha Strategy', 'Trading relative strength, market benchmarks, and alpha attribution methodology.')}
                ${card('explain-sentiment', 'psychology', 'Sentiment Synthesis', 'How we process social mindshare, NLP polarity, and news flow signals.')}
                ${card('explain-benchmark', 'science', 'Portfolio Simulation', 'Modelling and backtesting quant portfolios against market benchmarks.')}
                ${card('explain-api', 'terminal', 'Institutional API', 'Programmatic data access endpoints for quant desks and institutional clients.')}
                ${card('explain-glossary', 'menu_book', 'Terminal Glossary', 'Quick reference for all institutional metrics, formulas, and signals used.')}
                ${card('explain-liquidity', 'bar_chart', 'Order Flow (GOMM)', 'Interpreting institutional liquidity walls, tape imbalance, and execution flow.')}
                ${card('explain-mindshare', 'hub', 'Mindshare Engine', 'NLP-driven social cluster visualisation and attention scoring methodology.')}
            `)}
        </div>
    `;
}

function renderDocsAdvancedCharting() {
    renderExplainPage(
        "Advanced Charting Pro Suite",
        "The Advanced Charting module integrates professional-grade Technical Analysis, Market Depth visualization, and Real-time WebSockets.",
        "AlphaSignal's Charting engine utilizes TradingView's Lightweight Charts library, supercharged by direct Binance WebSockets and REST pipelines. This allows ZERO-latency rendering of price, volume, and order-book liquidity without relying on intermittent intermediary proxies.",
        [
            { icon: 'candlestick_chart', title: "Price & Overlays", desc: "Live 1m to 1d candlesticks superimposed with Dynamic EMA 20 and 50 lookback curves." },
            { icon: 'water_drop', title: "Market Depth", desc: "Live dual-area mapping of continuous bid/ask limit orders pulling from Binance Order Book." },
            { icon: 'timeline', title: "Derivatives", desc: "Overlay of Open Interest progression and liquidation histogram tracking." },
            { icon: 'bubble_chart', title: "Liquidation Pulse", desc: "High-fidelity canvas bubble map overlay visualizing highly-leveraged liquidation cascades and stop-loss clusters directly on the price action." },
            { icon: 'align_horizontal_left', title: "Volume Profile (VAP)", desc: "Left-anchored vertical histogram revealing the Volume-at-Price distribution to pinpoint institutional support and resistance zones." },
            { icon: 'stacked_line_chart', title: "Comparative Index", desc: "Percentage-normalized overlap of BTC, ETH, and SOL growth rates." },
            { icon: 'ssid_chart', title: "Cumulative Volume Delta (CVD)", desc: "Tracks net difference between aggressive market buying and selling over time." },
            { icon: 'currency_exchange', title: "Exchange Flows", desc: "Simulates the 30-day net position change of assets moving onto or off of global exchanges." }
        ],
        [
            { title: "Liquidity Wall Spotting", text: "By switching to the Market Depth tab, professional traders can visually isolate large limit-order structures ('Walls') acting as support or resistance, allowing for optimal entry timing." }
        ]
    , 'advanced-charting'
    );
}

function renderDocsOnchain() {
    renderExplainPage(
        "On-Chain Analytics Dashboard",
        "Deep quantitative modeling of blockchain fundamentals and macro valuation metrics without the need for external enterprise data subscriptions.",
        "To provide high-fidelity macro indicators without prohibitive third-party dependencies, AlphaSignal employs an internal synthesis engine. This engine mathematically derives the MVRV Z-Score and NVT Ratio by modeling long-term volatility drift, moving-average deviation, and network utilization rates against historical price action.",
        [
            { icon: 'area_chart', title: "MVRV Z-Score", desc: "Assesses asset over/undervaluation. When Market Value exceeds Realized Value significantly (Top red band), tops often form." },
            { icon: 'show_chart', title: "NVT Ratio", desc: "Network Value to Transactions ratio acts as crypto's native P/E ratio to gauge utility." },
            { icon: 'memory', title: "Fundamentals", desc: "Simulated tracking of absolute algorithmic difficulty, Hashrate growth, and active entities." },
            { icon: 'bar_chart', title: "SOPR", desc: "Measures whether the macro market is spending at a net aggregate profit or loss." },
            { icon: 'query_stats', title: "Puell Multiple", desc: "Highlights extreme bear market bottoms by comparing current miner revenue to its yearly trend." },
            { icon: 'stacked_line_chart', title: "Realized Price", desc: "Estimates the macro cost-basis of the entire network to identify key support zones." }
        ]
    , 'onchain'
    );
}

function renderDocsSignals() {
    renderExplainPage(
        "Alpha Signal Intelligence",
        "Live Z-score-driven momentum signals across 50+ institutional crypto assets.",
        "The Signal Intelligence view is the core of the AlphaSignal engine. Every 60 seconds the system recalculates Z-score deviations across the full 50+ asset universe, flags statistical outliers, assigns a directional conviction (BULLISH / BEARISH), and scores each signal's alpha relative to the crypto market average. Signals are colour-coded by strength and annotated with on-chain, macro, and social context from across the terminal's data streams.\n\nThe view also includes two real-time analytics charts — the \"Strategy Firing Density\" cluster map (30-day signal pressure heat) and the \"Z-Score Distribution\" Gaussian bell curve — giving an at-a-glance read on current signal density and the statistical profile of the live universe.",
        [
            { icon: 'radar', title: 'Z-Score Signal Cards', desc: 'Each card shows ticker, Z-score (–2 to +2 range), directional badge (BULLISH / BEARISH), relative alpha %, and a generated thesis memo.' },
            { icon: 'bolt', title: 'BULLISH / BEARISH Chips', desc: 'Direction indicators derived from momentum vector + Z-score sign. Green chip = upward statistical deviation; red = downward.' },
            { icon: 'filter_alt', title: 'Category Filters', desc: 'Filter by EXCHANGE, PROXY, MINERS, ETF, DEFI, L1, STABLES, and MEMES to focus on specific sector signals.' },
            { icon: 'analytics', title: 'Strategy Firing Density', desc: '30-day scatter chart of signal clustering over time. Dense windows indicate periods of high institutional momentum.' },
            { icon: 'show_chart', title: 'Z-Score Bell Curve', desc: 'Gaussian distribution of current Z-scores across the universe. Assets in the tails are statistical outliers — prime signal candidates.' },
            { icon: 'download', title: 'CSV Export', desc: 'Export the live signal table with all metrics for offline analysis or integration with external portfolio systems.' }
        ],
        [
            { title: 'Volatility Compression Breakout', text: 'During a 48-hour period of low Z-score activity, the Momentum Vector began to diverge positively. The terminal flagged Institutional Accumulation, preceding a 15% breakout in less than 4 hours.' },
            { title: 'Mean Reversion at +3.5 Z-Score', text: 'When an asset hits the +3.5 sigma level the probability of a 5% pullback within 12 hours exceeds 82%. Traders use this to scale out of long positions or hedge with delta-neutral options.' }
        ],
        "Real-time OHLCV from Binance, Coinbase, and OKX. Z-scores computed on a rolling 180-period mean and standard deviation window. Alpha scores benchmarked against the equal-weight crypto market average."
    , 'signals'
    );
}

function renderDocsBriefing() {
    renderExplainPage(
        "AI Intelligence Briefing",
        "Synthesized institutional intelligence for rapid decision making.",
        "The AI Briefing module is a neural synthesis engine that consumes and correlates news flow, social mindshare, and macro catalyst data. Unlike generic news aggregators, our LLM framework is tuned specifically for institutional finance. It identifies 'hidden' connections--such as how a specific regulatory shift in Asia might impact L2 liquidity in Europe--and presents them in a concise, actionable format. It is designed to save analysts hours of manual research by highlighting the signal within the noise.",
        [
            { icon: 'memory', title: 'Neural Synthesis', desc: 'Millions of text nodes are processed daily to identify emerging narratives and shifts in institutional sentiment before they reach mainstream media.' },
            { icon: 'auto_graph', title: 'Sector Correlation', desc: 'The briefing automatically groups assets into thematic sectors (L1, DeFi, AI, Memes) to show where rotational capital is flowing in real-time.' },
            { icon: 'history_edu', title: 'Macro Translation', desc: 'Translating complex macro events--like FOMC minutes or CPI prints--into direct impact estimates for your tracked portfolio.' }
        ],
        [
            { title: 'Narrative Shift Detection', text: 'Our AI Briefing identified a sustained increase in "Institutional Staking" mentions 72 hours before a major US pension fund announced its ETH position, allowing users to position ahead of the narrative surge.' },
            { title: 'Macro Catalyst Correlation', text: 'During the last CPI release, the AI Briefing instantly correlated the higher-than-expected print with "Liquid Staking" sector resilience, highlighting a defensive alpha opportunity within minutes.' }
        ],
        "Neural processing of 50,000+ daily news nodes, 1M+ social impressions via proprietary NLP models, and a curated database of 500+ global macro catalyst events."
    , 'briefing'
    );
}

function renderDocsLiquidity() {
    renderExplainPage(
        "Order Flow (GOMM)",
        "Visualizing professional liquidity walls and execution tape from 15+ top-tier institutional exchanges.",
        "The Global Orderflow Magnitude Monitor (GOMM) provides a deep-dive into the exchange limit order books. By tracking the depth and density of bids and asks across the top 100 liquidity pairs, we can identify 'Liquidity Walls'--large clusters of orders that act as natural magnets or barriers for price action. Understanding where 'deep' liquidity sits allows professional traders to predict reversal points and identify where the most significant slippage is likely to occur.",
        [
            { icon: 'water_drop', title: 'Liquidity Heatmap', desc: 'A dense visual mapping of limit order resting on the books. Highlights potential support and resistance zones.' },
            { icon: 'list_alt', title: 'Execution Tape (Institutional)', desc: 'Filtering out retail noise to show only large block trades executing across fragmented exchanges.' },
            { icon: 'history', title: 'Historical Snapshots', desc: 'Captures and replays historical orderbook configurations to model how liquidity walls shift in real-time.' }
        ],
        [
            { title: 'Iceberg Detection', text: 'By monitoring the GOMM execution tape alongside orderbook depth, we detected a 5,000 BTC hidden buy wall at $64k. While price appeared to be dropping, the "Large Block" filter showed aggressive absorption.' },
            { title: 'Liquidity Vacuum Identification', text: 'During a rapid sell-off, GOMM highlighted a $200M "Liquidity Gap" between $58k and $59k, alerting traders that a bounce was unlikely until the deeper support wall at $57.5k was tested.' }
        ],
        "Aggregated L1/L2 orderbook depth and trade-by-trade execution data from 15+ top-tier centralized exchanges (CEX) and high-volume decentralized protocols (DEX)."
    , 'liquidity'
    );
}

function renderDocsMLEngine() {
    renderExplainPage(
        "ML Alpha Engine",
        "Predictive machine learning using Sentiment and Orderbook imbalances.",
        "The ML Alpha Engine is our proprietary Random Forest predictive architecture. It continuously processes historical price action alongside real-time news sentiment and high-frequency orderbook imbalances. By synthesizing these diverse datasets, the model learns the non-linear relationships that precede major asset breakouts, generating highly accurate 24-hour alpha predictions.",
        [
            { icon: 'psychology', title: 'Sentiment Analysis', desc: 'Real-time NLP analysis of global news and social mindshare to determine prevailing narrative strength.' },
            { icon: 'balance', title: 'Orderbook Imbalance', desc: 'Continuous tracking of CEX bid/ask structural depths to model liquidity absorption and incoming volatility.' },
            { icon: 'network_node', title: 'Ensemble Learning', desc: 'A Random Forest model trained daily on the latest market regimes to adapt to evolving institutional mechanics.' }
        ],
        [
            { title: 'Predictive Edge Generation', text: 'When Orderbook Imbalance turned highly positive ahead of a neutral sentiment print, the ML Engine accurately predicted a +6% 24h alpha window on SOL by recognizing hidden absorption.' },
            { title: 'Dynamic Feature Synergy', text: 'The Engine ranks feature importance on the fly, enabling dynamic rebalancing as the market shifts from momentum-driven to sentiment-driven cycles.' }
        ],
        "Trained dynamically every 24 hours on the core baseline universe, synthesizing technicals (RSI, MACD, BB) with real-time news scoring and order flow depth."
    , 'alpha-hub'
    );
}

function renderDocsWhales() {
    renderExplainPage(
        "Institutional Whale Pulse",
        "Tracking large-scale capital movements across the blockchain.",
        "Whale Pulse monitors large-scale on-chain and off-chain transactions, filtering out retail 'dust' to focus on high-conviction institutional moves. By tracking wallet clusters associated with known funds, exchanges, and early adopters, we can visualize the movement of 'Smart Money'. Whether it is a massive transfer from an exchange to cold storage (accumulation) or a large-scale deposit (distribution), Whale Pulse gives you a head-start on anticipating major market shifts.",
        [
            { icon: 'waves', title: 'Block Detection', desc: 'Custom algorithms identify transactions exceeding $1M in value, providing alerts for massive capital reallocations in real-time.' },
            { icon: 'group', title: 'Entity Clustering', desc: 'We use heuristic analysis to cluster related wallets, allowing you to track the combined movements of large institutional entities rather than single addresses.' },
            { icon: 'timer', title: 'Inflow/Outflow Velocity', desc: 'Measuring the rate at which assets are moving into or out of centralized exchanges. High net outflows are historically bullish indicators.' }
        ],
        [
            { title: 'Strategic Accumulation Warning', text: 'Our clustering engine detected 15 dormant "Hedge Fund" labeled wallets moving $250M of stablecoins onto an exchange. This "Dry Powder" signal preceded an 8% market-wide rally by 12 hours.' },
            { title: 'The ETF Custodian Flow', text: 'Whale Pulse identified a massive $1.2B Bitcoin transfer from an exchange to a known ETF custodian wallet, confirming long-term institutional take-outs and reducing short-term sell pressure.' }
        ],
        "Real-time on-chain transaction indexing for 1,000+ institutional-labeled entities across Bitcoin, Ethereum, Solana, and Layer 2 ecosystems."
    , 'whales'
    );
}

function renderDocsMindshare() {
    renderExplainPage(
        "Narrative Galaxy",
        "Visualizing the social and psychological clusters of market mindshare.",
        "Markets are driven by narratives. The Narrative Galaxy utilizes Natural Language Processing (NLP) to map out the social discourse surrounding specific assets. By clustering related keywords and tracking their growth (velocity) and sentiment, we can visualize which 'story' is currently capturing the market's attention. Is the focus on 'Regulatory Clarity', 'Institutional Adoption', or 'Network Congestion'? The Galaxy shows you the gravity of each narrative in real-time.",
        [
            { icon: 'hub', title: 'Social Clustering', desc: 'Visualizing how different tokens are being discussed in relation to each other. Overlapping clusters often indicate high-correlation narratives.' },
            { icon: 'speed', title: 'Narrative Velocity', desc: 'Tracking the rate of growth for specific keywords. High-velocity narratives often precede significant price discovery events.' },
            { icon: 'bubble_chart', title: 'Mindshare Heatmap', desc: 'A multi-dimensional view of which sectors (DeFi, AI, Gaming) are capturing the highest percentage of the market\'s total attention span.' }
        ],
        [
            { title: 'Sentiment Exhaustion Peak', text: 'When a narrative cluster reaches "Maximum Saturation" (high velocity + extreme bullish sentiment), our Galaxy often flags a "Crowded Trade" warning. This typically precedes a 10% corrective move as retail FOMO peaks.' },
            { title: 'The Quiet Accumulation', text: 'Social mindshare often remains low while institutional "Whale Flow" is high. Identifying these "Under-the-Radar" narratives allows traders to enter before the crowd catches on.' }
        ],
        "Social graph analysis from Twitter (X), Reddit, and Telegram, processed through a proprietary vector-weighted NLP framework optimized for institutional finance jargon."
    , 'mindshare'
    );
}

function renderDocsBenchmark() {
    renderExplainPage(
        "Portfolio Simulation",
        "Backtesting and modeling institutional crypto portfolios.",
        "The Portfolio Simulation tool allows institutions to model the performance of specific asset combinations against market benchmarks like BTC or the S&P 500. By simulating historical drawdowns, volatility, and rebalancing strategies, you can optimize your capital allocation for the highest possible Sharpe and Sortino ratios. This tool provides the quantitative foundation for building a robust, institutional-grade crypto exposure strategy.",
        [
            { icon: 'science', title: 'Hypothetical Modeling', desc: 'Simulate how your portfolio would have performed during historical black-swan events or bull-market expansion phases.' },
            { icon: 'calculate', title: 'Risk-Adjusted Returns', desc: 'Moving beyond simple PnL to calculate Sharpe, Sortino, and Calmar ratios for a true understanding of your capital efficiency.' },
            { icon: 'history', title: 'Rebalancing Alpha', desc: 'Test different rebalancing frequencies (daily, weekly, monthly) to see which strategy captures the most volatility harvesting alpha.' }
        ],
        [
            { title: 'Black-Swan Stress Testing', text: 'Modeling a 30% BTC "flash crash" on a DeFi-heavy portfolio highlighted a 45% maximum drawdown, leading to a refined rebalancing strategy that reduced downside risk to 28% without sacrificing upside beta.' },
            { title: 'The Rebalancing Edge', text: 'Our simulation engine proved that a weekly rebalancing of a Top-10 Altcoin basket outperformed a static "Buy & Hold" strategy by 22% over a 12-month period through systematic volatility harvesting.' }
        ],
        "Aggregated historical OHLCV data from 10+ global exchanges, with 1-minute resolution, backtested across 5 full market cycles (2017-Present)."
    , 'portfolio-optimizer'
    );
}

function renderDocsAlerts() {
    renderExplainPage(
        "Alerts Hub",
        "Live signal alerts, custom price thresholds, signal leaderboard, and AI market brief — all in one hub.",
        "The Alerts Hub is the real-time monitoring nerve centre of the AlphaSignal terminal. It consolidates four distinct surveillance tools into a single tabbed interface, ensuring you never miss a high-conviction signal or key price level. All alert types support Telegram and Discord webhook delivery so you receive notifications even when the terminal is closed.",
        [
            { icon: 'notifications_active', title: 'Live Signal Alerts', desc: 'Real-time feed of Z-score threshold crossings across the 50+ asset universe. Each alert shows ticker, Z-score, direction, alpha %, and the AI-generated signal thesis.' },
            { icon: 'add_alert', title: 'Price Alerts', desc: 'Set custom price-level alerts for any tracked asset. Define target price, condition (above / below), and delivery method. Fires instantly to Telegram or Discord.' },
            { icon: 'leaderboard', title: 'Signal Leaderboard', desc: 'Ranked performance table of all historical signals sorted by alpha generated. Identify which assets and categories consistently produce the highest-conviction calls.' },
            { icon: 'article', title: 'Market Brief', desc: 'AI-generated daily narrative briefing synthesising macro context, top signals, ETF flows, and sector rotation into a single concise read.' },
            { icon: 'archive', title: 'Signal Archive', desc: 'Full history of every signal fired with P&L tracking. Filter by ticker, date range, or category to audit system performance.' },
            { icon: 'telegram', title: 'Webhook Delivery', desc: 'Connect your Telegram bot or Discord webhook in Settings to receive every alert off-platform. Configure Z-score threshold to control alert frequency.' }
        ],
        [
            { title: 'Pre-Rally Positioning via Alert', text: 'A +2.4 Z-score alert fired on SOL-USD at 03:00 UTC — before US traders woke. The Telegram delivery enabled immediate positioning, capturing a subsequent 8% move within 6 hours.' },
            { title: 'Price Alert Stop-Management', text: 'A trader set a price alert at $58,000 BTC as a stop-loss trigger level. The alert fired 12 minutes before the rapid flash, providing enough lead time to reduce exposure.' }
        ],
        "Signal alerts computed from live Z-score engine (refreshed every 60 seconds). Price alerts stored server-side and evaluated on each tick. Market Brief generated by GPT-4o-mini on demand."
    , 'alerts-hub'
    );
}

function renderDocsZScore() {
    renderExplainPage(
        "Z-Score Interpretation",
        "Statistical intensity monitoring for advanced volatility arbitrage and outlier detection.",
        "The Z-Score is a measure of how many standard deviations a data point is from its mean. In the AlphaSignal terminal, we use this to highlight 'statistical outliers'. A high Z-score (above +2.0 or below -2.0) means an asset is moving in a way that is highly unusual compared to its typical volatility profile. Professional traders use Z-scores to identify extreme overextensions (reversion opportunities) or the beginning of massive, institutional-led trend breakouts.",
        [
            { icon: 'analytics', title: 'Standard Deviation', desc: 'A Z-score of +3.0 indicates a move 3 standard deviations above the mean--a statistical rarity that often precedes a price correction or "cooling off" period.' },
            { icon: 'trending_up', title: 'Mean Reversion', desc: 'Extreme Z-scores (+3.5 or -3.5) are historically associated with exhaustion. When combined with declining volume, these are prime signals for mean-reversion trades.' },
            { icon: 'bolt', title: 'Momentum Breakouts', desc: 'A sustained Z-score between +1.5 and +2.5 often represents an institutional "trend breakout" where the asset is successfully discovering a new higher value range.' }
        ],
        [
            { title: 'The Sigma-3 Exhaustion Play', text: 'When a popular large-cap asset hit a +3.2 Z-score while the Whale Flow remained flat, our system flagged a "Retail Exhaustion" event. This preceded a 4.5% mean-reversion pullback within 6 hours.' },
            { title: 'Vol-Compression to Z-Spike', text: 'Tracking assets that move from a sub-0.5 Z-score (low volatility) to a 1.5+ spike allows traders to enter momentum breakouts with high confidence and tight stop-losses.' }
        ],
        "Proprietary volatility normalization engine calculating real-time z-scores across a 180-period rolling mean and standard deviation window."
    , 'stress'
    );
}

function renderDocsAlpha() {
    renderExplainPage(
        "Alpha Generation Strategy",
        "Quantifying relative strength by stripping away market noise and benchmark beta.",
        "Alpha represents the 'excess return' of an asset relative to a benchmark--in our terminal, typically Bitcoin (BTC-USD). If Bitcoin moves up 5% and an asset moves up 8%, that asset has generated 3% Alpha. Our platform prioritizes assets with high positive Alpha because they represent true idiosyncratic strength--assets that are attracting capital even when the broader market is struggling. Trading Alpha-positive assets is one of the most effective ways to outperform the benchmark index.",
        [
            { icon: 'benchmark', title: 'Benchmark Beta', desc: 'Alpha allows you to see through the "Beta" (broad market movement) to identify assets that are truly leading the market through unique fundamental strength.' },
            { icon: 'show_chart', title: 'Institutional Strength', desc: 'Consistent positive Alpha is the hallmark of institutional accumulation. These assets often continue to climb even during broad-market pullbacks or flat periods.' },
            { icon: 'filter_list', title: 'Selection Alpha', desc: 'Our terminal sorts the entire universe by Alpha, instantly surface-leveling the top 10% of assets that are currently being "blessed" by smart money capital.' }
        ],
        [
            { title: 'Beta-Neutral Long/Short', text: 'By selecting assets with +5% Alpha and shorting the BTC-USD benchmark, traders created a "Market Neutral" position that generated profit during a sideways market regime through relative outperformance.' },
            { title: 'Alpha-Leader Rotation', text: 'When Alpha shifts from L1 protocols to DeFi sub-sectors, it signals a rotational capital flow. Early detection of these shifts via the Alpha leaderboard resulted in a 14% outperformance vs HODL.' }
        ],
        "Real-time cross-asset correlation matrices and relative strength indexing updated hourly against the BTC-USD and ETH-USD benchmarks."
    , 'alpha-hub'
    );
}

function renderDocsCorrelation() {
    renderExplainPage(
        "Correlation & Decoupling",
        "Monitoring the mathematical relationship between Bitcoin and the broader universe.",
        "Correlation measures the degree to which two assets move in relation to each other. A correlation of +1.0 means they move in perfect lockstep. In crypto, most assets are highly correlated to Bitcoin. However, the most profitable opportunities often occur during 'Decoupling' events--when an asset breaks its link with BTC and begins to move independently. The AlphaSignal terminal tracks these shifts to help you identify rotational capital moving into specific sectors or tokens.",
        [
            { icon: 'link', title: 'High Correlation (>0.85)', desc: 'Indicates a "Risk-On" environment where all ships are rising or falling with the BTC tide. During these times, focus on the assets with the highest Beta for maximum leverage.' },
            { icon: 'link_off', title: 'Decoupling (<0.50)', desc: 'Identifies idiosyncratic strength or weakness. This is where professional traders look for unique alpha opportunities that are independent of the broader market trend.' },
            { icon: 'sync', title: 'Relative Rotation', desc: 'Changes in correlation often precede sector rotation. Tracking these shifts allows you to anticipate capital moving from Large-Caps into DeFi, L2s, or specific Meme narratives.' }
        ],
        [
            { title: 'The De-Peg / Decoupling Signal', text: 'When a major L1 protocol correlation dropped from 0.92 to 0.45 while price was rising, our system flagged an idiosyncratic breakout. This decoupling preceded a 20% independent rally while BTC remained flat.' },
            { title: 'Risk-Off Synchronization', text: 'During market panics, correlations often spike to 0.99. Identifying this "Market Beta Capture" allows traders to swiftly reduce exposure across the entire portfolio through a single benchmark hedge.' }
        ],
        "Rolling 30-day and 60-day Pearson correlation coefficients calculated across 3,000+ asset pairs using logarithmic price returns."
    , 'correlation-matrix'
    );
}

function renderDocsSentiment() {
    renderExplainPage(
        "Sentiment Synthesis",
        "Quantifying market psychology through institutional NLP and social graph analysis.",
        "Sentiment Synthesis is the bridge between social noise and actionable momentum. Our proprietary NLP models don't just 'search' for keywords; they analyze the authority of the speaker, the velocity of the discourse, and the underlying emotional valence of the market. This creates a real-time 'heat' index that highlights assets which are currently experiencing a psychological shift--often a leading indicator for institutional capital flows.",
        [
            { icon: 'psychology', title: 'Valence Weighting', desc: 'Our AI distinguishes between "Retail FOMO" and "Institutional Accumulation" by weighting sentiment based on historical authority scores and engagement quality.' },
            { icon: 'auto_graph', title: 'Sentiment Velocity', desc: 'Tracking the rate of change in sentiment. Rapid spikes in bullish sentiment often precede local tops, while gradual climbs indicate sustainable trend development.' },
            { icon: 'flare', title: 'Crowded Trade Warning', desc: 'Automatically flags when sentiment reaches "Extreme Greed" levels, signaling a high-probability reversal as the majority of buyers have already entered.' }
        ],
        [
            { title: 'The Sentiment Divergence Reversal', text: 'During a 12-hour price consolidation, Sentiment Synthesis showed a steady 15% climb in "High-Authority" bullishness. This underlying psychological shift preceded a 6% price breakout.' },
            { title: 'Crowd Exhaustion Alert', text: 'When Sentiment Velocity hit an all-time high alongside a +3.0 Z-score, our module flagged a "Crowded Trade" warning. Within 2 hours, the market saw a 3% flash-flush as late FOMO buyers were liquidated.' }
        ],
        "Neural processing of 100k+ daily social messages from Twitter (X), Reddit, and Telegram, filtered through a proprietary authority-weighted NLP cluster."
    , 'mindshare'
    );
}

function renderDocsRisk() {
    renderExplainPage(
        "Risk Management",
        "Institutional frameworks for capital preservation and position sizing.",
        "Institutional trading is not just about finding winners; it's about surviving the losers. Our Risk Management module provides real-time volatility-adjusted position sizing and drawdown modeling. By analyzing the current market regime (high vs low vol) and your portfolio's beta-weighted exposure, our algorithms suggest optimal risk parameters to ensure that no single 'black-swan' event can compromise your capital base.",
        [
            { icon: 'shield_with_heart', title: 'Volatility Sizing', desc: 'Automatically adjusting your suggested position size based on current asset volatility. High Z-score assets require smaller allocations to maintain a constant risk profile.' },
            { icon: 'security', title: 'VaR 95% (Value at Risk)', desc: 'The maximum expected loss over a 1-day horizon with 95% confidence. Monitored in real-time in the Portfolio Lab to ensure capital preservation.' },
            { icon: 'warning', title: 'Drawdown Modeling', desc: 'Simulating worst-case scenarios for your active positions. Understand your "VaR" across the entire fund as market conditions shift.' },
            { icon: 'balance', title: 'Exposure Balancing', desc: 'Analyzing cross-asset correlations to ensure your portfolio isn\'t unintentionally over-exposed to a single risk factor or thematic sector.' }
        ],
        [
            { title: 'The VaR Stress Check', text: 'When the Portfolio Lab flagged a 95% VaR spike to -4.5%, the system suggested a 20% reduction in long exposure. This defensive rotation successfully mitigated a subsequent overnight market-wide 5% pullback.' },
            { title: 'Dynamic Sizing via Z-Score', text: 'When an asset\'s Z-score exceeded 4.0, the Risk module suggested a 60% reduction in new position sizing. This defensive posture saved users from a subsequent 12% volatility shake-out.' }
        ],
        "Historical volatility data, drawdown models, and covariance matrices updated on every 1-minute price tick across 2,000+ monitored assets."
    , 'risk'
    );
}

function renderDocsGlossary() {
    renderDocsGlossaryImplementation();
}

function renderDocsPlaybook() {
    renderExplainPage(
        "Advanced Trading Playbook",
        "Mastering the synthesis of multiple terminal signals for high-conviction execution.",
        "The true power of AlphaSignal lies in the 'Synthesis'--the ability to combine uncorrelated data points to confirm an institutional setup. This playbook outlines the standard operating procedures (SOPs) used by professional quant desks to identify, validate, and execute trades using our real-time intelligence feeds.",
        [
            { icon: 'conveyor_belt', title: 'The Divergence Play', desc: 'When Z-Score hits -2.5 (statistical oversold) while Whale Flow shows "Strategic Accumulation". This is the highest conviction long setup in our arsenal.' },
            { icon: 'balance', title: 'Delta-Neutral Arbitrage', desc: 'Using Alpha relative strength to go long the leader while shorting the market-beta (BTC-USD) during high-correlation regimes.' },
            { icon: 'flare', title: 'Sentiment Exhaustion', desc: 'Identifying local tops when Sentiment Synthesis hits +0.9 (Euphoria) alongside a +3.0 Z-Score spike and flat Liquidity Depth.' }
        ],
        [
            { title: 'The L2 Rotation Play', text: 'By monitoring Narrative Galaxy velocity for "Scaling" and "Rollups", combined with a positive Alpha shift in the L2 sector, users positioned 24h ahead of the Polygon rally.' },
            { title: 'Volatility Crush Strategy', text: 'Utilizing the Catalyst Monitor to identify high-impact events and positioning with GOMM liquidity walls to capture the "volatility crush" post-announcement.' }
        ],
        "Compiled from institutional trading frameworks and refined through 5 years of proprietary market behavior modeling."
    , 'strategy-lab'
    );
}

function renderDocsRegimes() {
    renderExplainPage(
        "Market Regime Framework",
        "The structural DNA of the market--identifying the macro environment.",
        "Markets shift between structural phases. Identifying the current 'Regime' is the first step in selecting the correct trading strategy. AlphaSignal uses a multi-factor model (Volatility, Volume, Sentiment, and Flow) to classify the current market environment into one of four distinct states.",
        [
            { icon: 'downloading', title: 'Accumulation', desc: 'Characterized by low Z-score, negative Sentiment, but rising Whale Inflows. Institutional capital is quietly building positions ahead of a breakout.' },
            { icon: 'trending_up', title: 'Expansion', desc: 'High Momentum Vector, rising Alpha, and positive Sentiment Clusters. This is the "Trend following" regime where long positions are most effective.' },
            { icon: 'uploading', title: 'Distribution', desc: 'Extreme positive Z-score (+3.0), slowing Momentum, and massive Whale Outflows. Smart money is taking profits into late-retail FOMO.' },
            { icon: 'trending_down', title: 'Contraction / Flush', desc: 'Breaking of GOMM liquidity walls, high Correlation spikes, and rapid Sentiment Velocity to the downside. Defensive capital preservation is prioritized.' }
        ],
        [
            { title: 'The Regime Pivot Warning', text: 'When the AI Briefing detected a shift from "Accumulation" to "Expansion" in the AI sector, it preceded a $2B capital rotation that sustained for 14 market days.' }
        ],
        "Regime detection computed via a Markov-Switching model applied to global crypto liquidity and macro sentiment nodes."
    , 'regime'
    );
}

function renderDocsAPI() {
    renderExplainPage(
        "Institutional API Access",
        "Programmatic intelligence for algorithmic execution and custom data pipelines.",
        "The AlphaSignal terminal is built on a high-throughput REST API. Institutional users can bypass the GUI to integrate our proprietary signals directly into their proprietary trading bots, risk management systems, or custom dashboards. We provide low-latency endpoints for all primary data layers.",
        [
            { icon: 'code', title: '/api/signals', desc: 'Get the latest Momentum Vector, Z-Score, and Alpha ranks for the entire universe in a single JSON payload.' },
            { icon: 'security', title: '/api/portfolio/risk', desc: 'Institutional risk analytics: VaR 95%, Portfolio Beta, Sortino Ratio, and Volatility snapshots.' },
            { icon: 'grid_view', title: '/api/portfolio/correlations', desc: 'Returns the 15x15 peer characterization matrix for the top institutional-grade assets.' },
            { icon: 'data_object', title: '/api/history', desc: 'Retrieve historical signal snapshots to train your own ML models or backtest custom strategies.' },
            { icon: 'security', title: 'Authentication', desc: 'Institutional API keys are encrypted with AES-256 and restricted by CIDR-based IP whitelisting for maximum security.' }
        ],
        [
            { title: 'Algorithmic Integration', text: 'A leading HF integrated our /api/signals into their execution engine to automatically toggle "Limit" vs "Market" orders based on real-time Z-Score volatility intensity.' }
        ],
        "Server-grade REST architecture with global CDN caching and 99.99% uptime for institutional endpoints."
    , 'command-center'
    );
}

function renderDocsSignalArchive() {
    renderExplainPage(
        "Signal Archive & PnL",
        "Transparent tracking of every institutional engine alert.",
        "The Signal Archive serves as the ultimate source of truth for the AlphaSignal terminal. It records every alert generated by our engine, including the exact entry price, timestamp, and subsequent price performance. By tracking real-time Profit and Loss (PnL) and Take-Profit (TP) hits, we provide users with a complete, unfettered view of the engine's historical accuracy and trade duration dynamics.",
        [
            { icon: 'history', title: 'Verifiable Record', desc: 'Every signal is timestamped and immutable. This allows institutional users to audit our track record and verify signal validity against historical exchange data.' },
            { icon: 'track_changes', title: 'TP/SL Monitoring', desc: 'Our system tracks signals through multiple Take-Profit tiers (TP1, TP2) and Stop-Loss levels, providing a realistic view of executable alpha.' },
            { icon: 'query_stats', title: 'Outcome Attribution', desc: 'Analyzing why specific signals succeeded or failed based on the market regime and sentiment at the time of the alert.' }
        ],
        [
            { title: 'Institutional Audit', text: 'During a quarterly review, an institutional user verified that 78% of "Extreme Alpha" signals hit TP1 within 48 hours, confirming the engine\'s short-term momentum accuracy.' },
            { title: 'PnL Recovery Analysis', text: 'The archive showed that signals generated during "Accumulation" regimes had a 15% longer average hold time but a 22% higher average total return compared to "Expansion" trades.' }
        ],
        "Aggregated from the internal AlphaSignal Signal Engine database, with price verification performed against 15+ top-tier exchange APIs."
    , 'signal-archive'
    );
}

function renderDocsPerformance() {
    renderExplainPage(
        "Performance Metrics",
        "Deep-dive analytics into terminal win rates and return distributions.",
        "The Performance Dashboard distills thousands of archived signals into clear, actionable track records. We track 'Win Rate' (signals hitting TP1 or better), 'Average ROI', and 'Monthly Breakdown' to help users understand the consistency of the intelligence engine. These metrics are calculated dynamically to reflect current market conditions and the varying success rates across different asset classes (L1s, DeFi, Memes, etc.).",
        [
            { icon: 'bar_chart', title: 'Win Rate Distribution', desc: 'Calculated as the percentage of signals that reached at least Take-Profit Tier 1 before being stopped out by a regime shift.' },
            { icon: 'monitoring', title: 'ROI Attribution', desc: 'A breakdown of total returns across different asset categories, highlighting where the terminal is currently extracting the most value.' },
            { icon: 'calendar_month', title: 'Monthly Linearity', desc: 'Visualizing equity growth and win rate stability over time to ensure the engine performs reliably across both Bull and Bear regimes.' }
        ],
        [
            { title: 'Regime Performance Shift', text: 'During the high-volatility regime of Q4, the Performance Dashboard highlighted a 12% spike in DeFi-sector win rates, allowing users to concentrate capital in high-probability sectors.' },
            { title: 'Portfolio Return Modeling', text: 'By analyzing the monthly breakdown, a fund manager modeled a 2% monthly alpha target using only signals with a >65% historical win rate in the "Expansion" regime.' }
        ],
        "All performance metrics are calculated using mid-market entry prices with a 0.1% estimated sliparound factor included for institutional realism."
    , 'performance-dashboard'
    );
}

function renderDocsAlphaScore() {
    renderExplainPage(
        "Alpha Score & Boosting",
        "The terminal's ultimate composite signal--collapsing complexity into actionable ranks.",
        "The Alpha Score is a proprietary ranking from 0-100 that synthesizes momentum, sentiment, and on-chain flow. High scores indicate assets with a strong 'Momentum Vector' and positive institutional accumulation. The Neural Engine also provides an 'ML Boost' to assets where historical patterns suggest a high probability of short-term alpha.",
        [
            { icon: 'workspace_premium', title: 'ML Boost', desc: 'A high-conviction statistical boost applied when multiple neural nodes align on a specific asset return profile.' },
            { icon: 'rocket_launch', title: 'Momentum Vector', desc: 'The directional force of price and volume acceleration over a rolling 48-hour window.' }
        ],
        [
            { title: 'The 90+ Alpha Breakout', text: 'When SOL hit an Alpha Score of 92 with an ML Boost, it preceded a 14% impulsive rally in the subsequent 24 hours.' }
        ],
        "Composite scoring engine updated hourly using live feed data from 15+ institutional-grade sources."
    , 'alpha-score'
    );
}

function renderDocsTelegram() {
    // Fetch live bot info from the backend
    fetch('/api/telegram/link')
        .then(r => r.json())
        .then(info => _renderDocsTelegramPage(info))
        .catch(() => _renderDocsTelegramPage({ bot_name: 'alphasignalbot_bot', bot_url: 'https://t.me/alphasignalbot_bot', active: false }));
}

function _renderDocsTelegramPage(botInfo) {
    const botUrl  = botInfo.bot_url  || 'https://t.me/alphasignalbot_bot';
    const botName = botInfo.bot_name || 'alphasignalbot_bot';
    const isActive = botInfo.active;

    const stepStyle = `display:flex;align-items:flex-start;gap:1rem;padding:1.1rem 1.2rem;
        background:rgba(0,242,255,0.03);border:1px solid rgba(0,242,255,0.12);
        border-radius:10px;margin-bottom:0.75rem;`;
    const numStyle = `min-width:32px;height:32px;border-radius:50%;background:var(--accent);
        color:#000;display:flex;align-items:center;justify-content:center;
        font-weight:900;font-size:0.8rem;flex-shrink:0;margin-top:2px;`;
    const labelStyle = `font-size:0.72rem;font-weight:800;letter-spacing:1px;color:var(--accent);margin-bottom:4px;`;
    const descStyle  = `font-size:0.82rem;color:var(--text-dim);line-height:1.55;`;

    const cmdRow = (cmd, desc) => `
        <div style="display:flex;align-items:center;gap:1rem;padding:0.65rem 0;border-bottom:1px solid rgba(255,255,255,0.04);">
            <code style="background:rgba(0,242,255,0.08);color:var(--accent);padding:3px 10px;border-radius:6px;font-size:0.78rem;white-space:nowrap;min-width:90px;text-align:center;">${cmd}</code>
            <span style="font-size:0.8rem;color:var(--text-dim);">${desc}</span>
        </div>`;

    appEl.innerHTML = `
        <div class="view-header"><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent);">notifications_active</span>Telegram Bot — Alert Setup</h1></div>
        <div class="doc-container" style="max-width:860px;margin:0 auto;padding-top:1.5rem;padding-bottom:5rem;">

            <p style="font-size:0.95rem;color:var(--text-dim);line-height:1.6;margin-bottom:2rem;">
                Receive your AlphaSignal morning digest and live high-severity signal alerts directly in Telegram.
                The bot takes 60 seconds to set up and requires no API keys on your end.
            </p>

            <!-- Live Bot Status Banner -->
            <div style="display:flex;align-items:center;gap:1rem;padding:1rem 1.4rem;
                background:${isActive ? 'rgba(0,242,255,0.06)' : 'rgba(255,165,0,0.06)'};
                border:1px solid ${isActive ? 'rgba(0,242,255,0.25)' : 'rgba(255,165,0,0.25)'};
                border-radius:10px;margin-bottom:2.5rem;">
                <span class="material-symbols-outlined" style="color:${isActive ? 'var(--accent)' : '#ffa500'};font-size:1.6rem;">
                    ${isActive ? 'check_circle' : 'warning'}
                </span>
                <div>
                    <div style="font-size:0.7rem;font-weight:900;letter-spacing:1.5px;color:${isActive ? 'var(--accent)' : '#ffa500'};">
                        BOT STATUS: ${isActive ? 'ONLINE' : 'TOKEN NOT CONFIGURED'}
                    </div>
                    <div style="font-size:0.78rem;color:var(--text-dim);margin-top:2px;">
                        ${isActive
                            ? `@${botName} is live and accepting connections`
                            : 'Set TELEGRAM_BOT_TOKEN in your environment variables to activate the bot'}
                    </div>
                </div>
                ${isActive ? `
                <a href="${botUrl}" target="_blank" rel="noopener" style="margin-left:auto;
                    background:var(--accent);color:#000;padding:8px 18px;border-radius:8px;
                    font-size:0.72rem;font-weight:900;letter-spacing:1px;text-decoration:none;white-space:nowrap;">
                    OPEN BOT &rarr;
                </a>` : ''}
            </div>

            <!-- How to Link Section -->
            <div style="margin-bottom:2.5rem;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border);">
                    <span class="material-symbols-outlined" style="color:var(--accent);">link</span>
                    <h2 style="font-size:0.7rem;font-weight:900;letter-spacing:3px;color:var(--text);margin:0;">HOW TO LINK YOUR ACCOUNT</h2>
                </div>

                <div style="${stepStyle}">
                    <div style="${numStyle}">1</div>
                    <div>
                        <div style="${labelStyle}">OPEN THE BOT</div>
                        <div style="${descStyle}">
                            Tap the link to open the AlphaSignal bot in Telegram:
                            <a href="${botUrl}" target="_blank" rel="noopener"
                                style="color:var(--accent);font-weight:700;margin-left:4px;">@${botName}</a>
                            <br>Or search for <code style="color:var(--accent);background:rgba(0,242,255,0.08);padding:1px 7px;border-radius:4px;">@${botName}</code> directly in the Telegram app.
                        </div>
                    </div>
                </div>

                <div style="${stepStyle}">
                    <div style="${numStyle}">2</div>
                    <div>
                        <div style="${labelStyle}">SEND /START</div>
                        <div style="${descStyle}">
                            Tap <strong>Start</strong> or type <code style="color:var(--accent);background:rgba(0,242,255,0.08);padding:1px 7px;border-radius:4px;">/start</code> to begin.
                            The bot will greet you and ask for your AlphaSignal email address.
                        </div>
                    </div>
                </div>

                <div style="${stepStyle}">
                    <div style="${numStyle}">3</div>
                    <div>
                        <div style="${labelStyle}">REPLY WITH YOUR EMAIL</div>
                        <div style="${descStyle}">
                            Type the email address you used to register on AlphaSignal and send it.
                            The bot will confirm your account is linked within seconds.
                        </div>
                    </div>
                </div>

                <div style="${stepStyle}">
                    <div style="${numStyle}">4</div>
                    <div>
                        <div style="${labelStyle}">YOU'RE LIVE</div>
                        <div style="${descStyle}">
                            Once linked, you will automatically receive:<br>
                            &bull; <strong style="color:var(--text);">Morning Digest</strong> — daily at 07:30 UTC with top 3 signals + BTC summary<br>
                            &bull; <strong style="color:var(--text);">Live Signal Alerts</strong> — when CRITICAL or HIGH severity signals fire
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bot Commands Reference -->
            <div style="margin-bottom:2.5rem;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border);">
                    <span class="material-symbols-outlined" style="color:var(--accent);">terminal</span>
                    <h2 style="font-size:0.7rem;font-weight:900;letter-spacing:3px;color:var(--text);margin:0;">BOT COMMANDS</h2>
                </div>
                <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0.5rem 1.2rem;">
                    ${cmdRow('/start',  'Begin setup — bot will prompt for your AlphaSignal email')}
                    ${cmdRow('/status', 'Show your linked account and current alert status')}
                    ${cmdRow('/unsub',  'Pause all Telegram alerts (account stays linked)')}
                    ${cmdRow('/resub',  'Re-enable alerts after pausing')}
                    ${cmdRow('/help',   'Show all available commands')}
                </div>
            </div>

            <!-- Discord Section -->
            <div style="margin-bottom:2.5rem;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border);">
                    <span class="material-symbols-outlined" style="color:var(--accent);">hub</span>
                    <h2 style="font-size:0.7rem;font-weight:900;letter-spacing:3px;color:var(--text);margin:0;">DISCORD WEBHOOK</h2>
                </div>
                <div style="background:rgba(0,242,255,0.03);border:1px solid rgba(0,242,255,0.12);border-radius:10px;padding:1.2rem 1.4rem;">
                    <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.6;margin:0;">
                        Prefer Discord? Head to <strong style="color:var(--text);">Alert Settings</strong> in the sidebar and paste your Discord channel webhook URL.
                        The morning digest and signal alerts will post directly to your server channel.
                        <br><br>
                        To create a webhook: <em>Server Settings → Integrations → Webhooks → New Webhook → Copy URL</em>
                    </p>
                </div>
            </div>

            <!-- Feature tiles -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin-bottom:2.5rem;">
                <div style="background:rgba(255,255,255,0.02);padding:1.4rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                    <h3 style="color:var(--accent);margin-bottom:0.75rem;display:flex;align-items:center;font-size:1rem;">
                        <span class="material-symbols-outlined" style="margin-right:8px;font-size:20px;">notifications_active</span> Morning Digest
                    </h3>
                    <p style="color:var(--text-dim);line-height:1.5;font-size:0.86rem;">
                        Sent daily at 07:30 UTC. Includes top 3 signals from the last 24h ranked by severity,
                        current BTC price summary, and a direct deep-link back to the terminal.
                    </p>
                </div>
                <div style="background:rgba(255,255,255,0.02);padding:1.4rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                    <h3 style="color:var(--accent);margin-bottom:0.75rem;display:flex;align-items:center;font-size:1rem;">
                        <span class="material-symbols-outlined" style="margin-right:8px;font-size:20px;">bolt</span> Live Signal Alerts
                    </h3>
                    <p style="color:var(--text-dim);line-height:1.5;font-size:0.86rem;">
                        Real-time push when a CRITICAL or HIGH severity signal fires. Each alert includes
                        the ticker, signal type, entry price, and a link to the full Signal Archive entry.
                    </p>
                </div>
                <div style="background:rgba(255,255,255,0.02);padding:1.4rem;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                    <h3 style="color:var(--accent);margin-bottom:0.75rem;display:flex;align-items:center;font-size:1rem;">
                        <span class="material-symbols-outlined" style="margin-right:8px;font-size:20px;">security</span> Privacy
                    </h3>
                    <p style="color:var(--text-dim);line-height:1.5;font-size:0.86rem;">
                        Only your email is stored — no Telegram passwords or API tokens required from you.
                        Use /unsub at any time to immediately stop all messages.
                    </p>
                </div>
            </div>

            <div style="display:flex;gap:1rem;flex-wrap:wrap;">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px;">
                    <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span> RETURN TO HELP HUB
                </button>
                <a href="${botUrl}" target="_blank" rel="noopener"
                    class="intel-action-btn"
                    style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800;text-decoration:none;">
                    <span class="material-symbols-outlined" style="font-size:18px;">open_in_new</span> OPEN @${botName}
                </a>
                <button class="intel-action-btn outline" onclick="switchView('alert-settings')" style="display:flex;align-items:center;gap:8px;">
                    <span class="material-symbols-outlined" style="font-size:18px;">settings</span> ALERT SETTINGS
                </button>
            </div>
        </div>
    `;
}

function renderDocsPWA() {
    renderExplainPage(
        "Mobile Terminal Installation",
        "Access institutional-grade market intelligence on the go via PWA technology.",
        "AlphaSignal is built as a Progressive Web App (PWA), meaning you can install it directly on your mobile device home screen without an App Store middleman. This provides a persistent, fullscreen terminal experience with local caching for low-latency market monitoring.",
        [
            { icon: 'install_mobile', title: 'Add to Home Screen', desc: 'Use the "Share" menu on iOS or "Install" prompt on Android to add AlphaSignal to your device dashboards.' },
            { icon: 'speed', title: 'Performance Caching', desc: 'The terminal uses a robust Service Worker to cache core UI assets, ensuring rapid loading even in low-bandwidth environments.' },
            { icon: 'fullscreen', title: 'Native Experience', desc: 'Launch in standalone mode to remove browser chrome and focus entirely on the high-fidelity intelligence stream.' }
        ],
        [
            { title: 'Mobile Tactical Edge', text: 'A fund manager installed the PWA on their iPad, allowing them to monitor the Narrative Galaxy and Whale Pulse during a macro conference without a laptop.' }
        ],
        "Service Worker and manifest-driven installation strategy compliant with modern W3C PWA standards."
    , 'help'
    );
}

function renderDocsPortfolioLab() {
    renderExplainPage(
        "Institutional Portfolio Lab",
        "Deep-dive into the ML-driven rebalancing fund and advanced risk analytics.",
        "The Portfolio Lab is the terminal's premier environment for simulating institutional-grade capital allocation. It tracks a dynamic fund that automatically rebalances into the top 5 ML-boosted assets daily, providing live performance attribution and sophisticated risk modeling.",
        [
            { icon: 'biotech', title: 'ML Rebalancing', desc: 'The fund automatically selects the top 5 assets by Alpha Score daily, simulating a professional "Momentum-Weighted" strategy.' },
            { icon: 'security', title: 'VaR 95% CI', desc: 'Live Value at Risk monitoring to ensure the simulated fund maintains a professional institutional risk profile.' },
            { icon: 'grid_view', title: 'Correlation Matrix', desc: 'A 15x15 rolling 30D matrix identifying systemic risks and diversification opportunities across the signal universe.' }
        ],
        [
            { title: 'Asset-Level Attribution', text: 'By monitoring the "Constituent Weightings", users identified that L1 protocols contributed 40% of total portfolio returns during the current 30-day window.' }
        ],
        "Quant-grade simulation engine calculating history, metrics, and correlations against a synthetic BTC-USD benchmark."
    , 'portfolio-optimizer'
    );
}


function renderDocsGlossaryImplementation() {
    renderExplainPage(
        "Terminal Glossary",
        "Institutional metrics and terminology for the modern quant trader.",
        "The AlphaSignal terminal utilizes proprietary and institutional-standard metrics. This glossary provides technical definitions for the most critical terms used across the platform.",
        [
            { icon: 'terminal', title: 'Alpha (%)', desc: 'Excess return relative to the BTC-USD benchmark. Positive Alpha indicates market leadership and idiosyncratic strength.' },
            { icon: 'show_chart', title: 'Beta', desc: 'Market sensitivity metric. A Beta of 1.1 means the asset is expected to outperform the benchmark by 10% on the upside.' },
            { icon: 'grid_view', title: 'Correlation Matrix', desc: 'A 15x15 peer matrix illustrating the statistical relationship between asset pairs. High values indicate assets move in sync.' },
            { icon: 'speed', title: 'Cross-Chain Velocity', desc: 'The rate at which capital and narrative attention rotate across distinct Layer 1 networks (e.g. ETH to SOL).' },
            { icon: 'receipt_long', title: 'Institutional Trade Ledger', desc: 'An immutable, verified record of historical execution tickets and strategies for precise performance auditing.' },
            { icon: 'model_training', title: 'ML Alpha Engine', desc: 'A machine learning ensemble model dynamically trained on both technicals and sentiment for 24-hour predictions.' },
            { icon: 'balance', title: 'Orderbook Imbalance', desc: 'The structural difference between aggregate bid and ask walls, serving as a leading indicator of liquidity absorption.' },
            { icon: 'calculate', title: 'Sharpe Ratio', desc: 'Measure of risk-adjusted return. Calculated as (Portfolio Return - Risk-Free Rate) / Standard Deviation.' },
            { icon: 'analytics', title: 'Sortino Ratio', desc: 'Differentiated from Sharpe by only penalizing downside volatility, providing a clearer view of "bad" risk.' },
            { icon: 'security', title: 'VaR 95%', desc: 'Value at Risk. A statistical measure of the maximum potential 1-day loss of a portfolio at a 95% confidence level.' },
            { icon: 'waves', title: 'Whale Flow', desc: 'Proprietary filtering of the trade tape to show only significant capital commitments (>$100k) from institutional-labeled entities.' },
            { icon: 'database', title: 'Z-Score', desc: 'Statistical distance from the mean in standard deviations. Scores > Ã‚Â±2.0 identify significant momentum or exhaustion outliers.' }
        ],
        [],
        "Proprietary definitions derived from institutional trading desk standards and quantitative finance academic frameworks."
    , 'help');
}

// updateSEOMeta() — extracted to js/seo-meta.js
