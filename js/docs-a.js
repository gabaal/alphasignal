// ============= Help Hub — Sidebar-Mirrored Index =============
function renderHelp() {
    const hubs = [
        { id: 'global-markets', name: 'Global Markets', icon: 'public', color: '#00f2ff', view: 'global-hub',
          docs: [
            { name: 'ETF Flows', desc: '3 components: Stacked bar chart, Daily leaderboard table, Cumulative waterfall chart', route: 'docs-etf-flows', icon: 'account_balance' },
            { name: 'Liquidations', desc: '3 components: Cascade scanner chart, Total rekt stat, Largest single order stat', route: 'docs-liquidations', icon: 'local_fire_department' },
            { name: 'OI Radar', desc: '5 components: Exchange spider chart, IV smile curve, OI divergence bubble map, Attribution table, OI x Funding Matrix', route: 'docs-oi-radar', icon: 'track_changes' },
            { name: 'CME Gaps', desc: '1 component: Active magnet levels registry', route: 'docs-cme-gaps', icon: 'candlestick_chart' },
            { name: 'LOB Heatmap', desc: '1 component: High-density Limit Order Book visual depth canvas', route: 'docs-lob-heatmap', icon: 'blur_on' },
          ]
        },
        { id: 'macro-intel', name: 'Macro Intelligence', icon: 'monitoring', color: '#a78bfa', view: 'macro-hub',
          docs: [
            { name: 'Strategy Briefing', desc: '3 components: AI institutional memo, Conviction dials, BTC benchmark chart', route: 'docs-briefing', icon: 'memory' },
            { name: 'Sector Rotation', desc: '2 components: Sector momentum treemap, Rotation matrix table', route: 'docs-rotation', icon: 'swap_horiz' },
            { name: 'Macro Compass', desc: '3 components: Macro correlation heatmap, Yield curve chart, DXY overlay', route: 'docs-macro-compass', icon: 'explore' },
            { name: 'Macro Calendar', desc: '2 components: Economic event calendar, BTC impact score table', route: 'docs-macro-calendar', icon: 'calendar_month' },
            { name: 'Market Regime', desc: '3 components: Regime classifier gauge, Transition matrix, Regime heatmap history', route: 'docs-regime', icon: 'category' },
          ]
        },
        { id: 'alpha-strategy', name: 'Quant Strategy Lab', icon: 'electric_bolt', color: '#facc15', view: 'alpha-hub',
          docs: [
            { name: 'Signal Intelligence', desc: '3 components: Signal cards, Firing density histogram, Z-score bell curve (Confidence Radar now on Command Center)', route: 'docs-signals', icon: 'radar' },
            { name: 'ML Alpha Engine', desc: '3 components: Prediction table, Feature importance bar chart, Model accuracy gauge', route: 'docs-ml-engine', icon: 'smart_toy' },
            { name: 'Alpha Score', desc: '2 components: Composite ranking table with score bars, Grade distribution', route: 'docs-alpha-score', icon: 'electric_bolt' },
            { name: 'Strategy Lab', desc: '4 components: Strategy selector, Equity curve, Guppy ribbon, Monte Carlo bands', route: 'docs-strategy-lab', icon: 'science' },
            { name: 'Market Profile (TPO)', desc: '1 component: Interactive horizontal volume distribution and Point of Control (POC)', route: 'docs-volume-profile', icon: 'bar_chart' },
            { name: 'Backtester V2', desc: '3 components: Rolling Sharpe chart, Monthly P&L heatmap calendar, Trade summary stats', route: 'docs-backtester', icon: 'history' },
            { name: 'Signal Archive', desc: '2 components: Historical signal table, Running P&L tracker', route: 'docs-signal-archive', icon: 'archive' },
            { name: 'Narrative Galaxy', desc: '2 components: Force-directed galaxy graph, Velocity indicator table', route: 'docs-narrative', icon: 'hub' },
            { name: 'How Signals Work', desc: 'Full system explainer: data harvest, ML inference, rule detection, ROI calc, stop loss automation, alert delivery & signal archive lifecycle', route: 'docs-how-signals-work', icon: 'schema' },
          ]
        },
        { id: 'institutional-hub', name: 'Institutional Hub', icon: 'key', color: '#fb923c', view: 'institutional-hub',
          docs: [
            { name: 'Token Unlocks', desc: '2 components: Unlock schedule table, Supply impact score badges', route: 'docs-token-unlocks', icon: 'lock_open' },
            { name: 'DeFi Yield Lab', desc: '3 components: Protocol APY comparison table, Avg staking stat, Risk score bar', route: 'docs-yield-lab', icon: 'savings' },
            { name: 'Portfolio Optimizer', desc: '3 components: ML rebalancing table, Radar allocation chart, Efficient frontier scatter', route: 'docs-portfolio-optimizer', icon: 'account_tree' },
            { name: 'Trade Idea Lab', desc: '2 components: Thesis builder form, Risk/reward calculator', route: 'docs-tradelab', icon: 'tips_and_updates' },
          ]
        },
        { id: 'analytics-hub', name: 'Analytics Hub', icon: 'analytics', color: '#22c55e', view: 'analytics-hub',
          docs: [
            { name: 'Whale Pulse', desc: '3 components: Whale transaction feed, Execution time polar chart, Volume bubble scatter', route: 'docs-whale-pulse', icon: 'waves' },
            { name: 'Whale Pulse & Chain Velocity', desc: '2 components: Velocity time-series chart, Cross-chain Sankey diagram', route: 'docs-whale-pulse', icon: 'speed' },
            { name: 'On-Chain Analytics', desc: '9 components: MVRV Z-Score, SOPR, Puell Multiple, NVT Ratio, Realized Price, Hash Ribbons, Investor Sentiment Index, CVD, Exchange Net Flow', route: 'docs-onchain', icon: 'link' },
            { name: 'Options Flow', desc: '5 components: Put/Call ratio gauge, Max Pain chart, IV Smile, Top OI strikes table, IV Term Structure', route: 'docs-options-flow', icon: 'waterfall_chart' },
            { name: 'Newsroom', desc: '2 components: Live news feed with sentiment tags, Keyword frequency heatmap', route: 'docs-newsroom', icon: 'newspaper' },
            { name: 'TradingView Hub', desc: '13 widgets: Market Overview, Symbol Comparison, Technical Analysis (BTC/ETH/SOL/BNB), Screener, Economic Calendar, Hotlists, Crypto Heatmap, Forex Cross Rates, Forex Heat Map, S&P 500 Sector Heatmap', route: 'docs-tradingview-hub', icon: 'show_chart' },
            { name: 'Custom Charts', desc: '4 charts: BTC Dominance area chart, Funding Rate bar chart, MVRV/SOPR Overlay, 30-Day Rolling Volatility — all built on live backend data', route: 'docs-custom-charts', icon: 'bar_chart' },
            { name: 'Dealer Gamma Exposure', desc: '1 component: Call vs Put Gamma exposure profile', route: 'docs-gex', icon: 'analytics' },
          ]
        },
        { id: 'audit-hub', name: 'Trade Ledger Audit', icon: 'trending_up', color: '#60a5fa', view: 'audit-hub',
          docs: [
            { name: 'Trade Ledger', desc: '2 components: Trade log table with P&L, Performance attribution breakdown', route: 'docs-trade-ledger', icon: 'receipt_long' },
            { name: 'Performance Dashboard', desc: '3 components: Win rate stat cards, Monthly ROI heatmap calendar, Equity curve', route: 'docs-performance', icon: 'bar_chart' },
          ]
        },
        { id: 'risk-hub', name: 'Risk & Stress', icon: 'grid_on', color: '#ef4444', view: 'risk-hub',
          docs: [
            { name: 'Risk Matrix', desc: '3 components: VaR gauge, Volatility-adjusted position sizer, Correlation scatter plot', route: 'docs-risk-matrix', icon: 'shield' },
            { name: 'Stress Test Lab', desc: '2 components: Scenario stress table, Z-score distribution chart', route: 'docs-stress-lab', icon: 'warning' },
          ]
        },
        { id: 'advanced-charting', name: 'Advanced Charting', icon: 'candlestick_chart', color: '#c084fc', view: 'advanced-charting',
          docs: [
            { name: 'Charting Suite', desc: '5 components: Candle chart, Volume Profile, CVD, Exchange Inflow/Outflow, Market Depth', route: 'docs-charting-suite', icon: 'candlestick_chart' },
            { name: 'TradingView Widget', desc: '1 component: Full TradingView professional chart with pre-loaded institutional studies', route: 'docs-tradingview', icon: 'show_chart' },
          ]
        },
        { id: 'order-flow', name: 'Order Flow (GOMM)', icon: 'bar_chart', color: '#00f2ff', view: 'liquidity',
          docs: [
            { name: 'Liquidity Dashboard', desc: '3 components: Orderbook depth chart, Execution tape feed, Institutional liquidity heatmap', route: 'docs-order-flow', icon: 'bar_chart' },
          ]
        },
        { id: 'alerts-hub', name: 'Alerts Hub', icon: 'notifications_active', color: '#f43f5e', view: 'alerts-hub',
          docs: [
            { name: 'Live Signal Alerts', desc: '2 components: Alert feed cards, Severity filter controls', route: 'docs-alerts', icon: 'notifications' },
            { name: 'Price Alerts', desc: '2 components: Alert manager table, Target price form', route: 'docs-price-alerts', icon: 'price_check' },
            { name: 'Signal Leaderboard', desc: '1 component: Ranked leaderboard table with win rate and ROI', route: 'docs-signal-leaderboard', icon: 'leaderboard' },
            { name: 'Market Brief', desc: '1 component: AI-generated daily market brief with structured sections', route: 'docs-market-brief', icon: 'summarize' },
          ]
        },
        { id: 'personal', name: 'Active Positions', icon: 'person', color: '#34d399', view: 'my-terminal',
          docs: [
            { name: 'Active Positions', desc: '3 components: Watchlist table with live P&L, Portfolio summary stats, Notification controls', route: 'docs-my-terminal', icon: 'bookmark_add' },
            { name: 'Ask Terminal', desc: '2 components: AI chat interface, Suggested query chips', route: 'docs-ask-terminal', icon: 'smart_toy' },
            { name: 'In Plain English AI', desc: 'Context-aware AI Chart Translator applied to institutional data views.', route: 'docs-plain-english', icon: 'auto_awesome' },
            { name: 'Command Center', desc: '9 live components: Fear/Greed gauge, ETF Net Flows, Volatility Regime, Market Pulse correlations, Scatter plot, Confidence Radar, Macro Correlation Matrix, CME Gaps, BTC sparkline', route: 'docs-command-center', icon: 'dashboard' },
            { name: 'Daily Workflow Playbook', desc: 'A structured 20-minute daily session guide — Morning Brief, Signal Review, Macro Context, Trade Decision, End-of-Day review', route: 'docs-daily-workflow', icon: 'today' },
          ]
        },
        { id: 'integrations-hub', name: 'Integrations Hub', icon: 'cable', color: '#ef4444', view: 'exchange-keys',
          docs: [
            { name: 'API Keys & Webhooks', desc: '2 components: Exchange API secure linking, Outbound Algorithmic Webhook config', route: 'docs-integrations', icon: 'key' }
          ]
        },
    ];

    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">help</span>Help &amp; Documentation</h1>
            <p style="color:var(--text-dim)">View-level reference guides — one document per view, explaining every chart, table, and widget. Organised by the left-hand navigation menu.</p>
        </div>
        <div style="max-width:960px;display:flex;flex-direction:column;gap:2rem;padding-bottom:5rem">
            ${hubs.map(hub => `
            <div style="border:1px solid ${alphaColor(0.07)};border-radius:14px;overflow:hidden">
                <div style="padding:1rem 1.4rem;background:${alphaColor(0.03)};border-bottom:1px solid ${alphaColor(0.06)};display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
                    <div style="display:flex;align-items:center;gap:10px">
                        <span class="material-symbols-outlined" style="color:${hub.color};font-size:1.2rem">${hub.icon}</span>
                        <span style="font-size:0.85rem;font-weight:900;letter-spacing:1px;color:${hub.color}">${hub.name}</span>
                        <span style="font-size:0.55rem;color:var(--text-dim);font-weight:700;background:${alphaColor(0.05)};padding:2px 8px;border-radius:100px;border:1px solid ${alphaColor(0.08)}">${hub.docs.length} VIEW${hub.docs.length > 1 ? 'S' : ''}</span>
                    </div>
                    <button onclick="switchView('${hub.view}')" style="background:${alphaColor(0.05)};border:1px solid ${alphaColor(0.1)};color:var(--text-dim);padding:4px 12px;border-radius:100px;font-size:0.6rem;font-weight:700;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.2s" onmouseover="this.style.borderColor='${hub.color}';this.style.color='${hub.color}'" onmouseout="this.style.borderColor=alphaColor(0.1);this.style.color='var(--text-dim)'">
                        <span class="material-symbols-outlined" style="font-size:13px">open_in_new</span> OPEN HUB
                    </button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0">
                    ${hub.docs.map((doc, idx) => `
                    <div onclick="switchView('${doc.route}')" style="padding:1.1rem 1.4rem;cursor:pointer;border-right:1px solid ${alphaColor(0.05)};border-bottom:1px solid ${alphaColor(0.05)};transition:background 0.18s;position:relative" onmouseover="this.style.background=alphaColor(0.04)" onmouseout="this.style.background='transparent'">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                            <span class="material-symbols-outlined" style="font-size:16px;color:${hub.color}">${doc.icon}</span>
                            <span style="font-size:0.85rem;font-weight:700;color:var(--text)">${doc.name}</span>
                        </div>
                        <p style="font-size:0.7rem;line-height:1.5;color:var(--text-dim);margin:0">${doc.desc}</p>
                        <span class="material-symbols-outlined" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:14px;color:${alphaColor(0.15)}">chevron_right</span>
                    </div>`).join('')}
                </div>
            </div>`).join('')}
        </div>
    `;
}

// ============= GLOBAL MARKETS HUB =============
function renderDocsViewETFFlows() {
    renderViewDocPage({
        hub: 'Global Markets', hubIcon: 'public', hubColor: '#00f2ff',
        title: 'ETF Flows', viewId: 'etf-flows',
        relatedDocs: [
            { name: 'Liquidations', route: 'docs-liquidations', icon: 'local_fire_department' },
            { name: 'OI Radar', route: 'docs-oi-radar', icon: 'track_changes' },
            { name: 'Macro Compass', route: 'docs-macro-compass', icon: 'explore' },
        ],
        summary: 'Track real-time institutional capital movement through U.S.-regulated Bitcoin Spot ETF vehicles. These flows are the clearest signal of Wall Street accumulation and distribution cycles currently available to retail traders.',
        components: [
            {
                name: 'Bitcoin Spot ETF Daily Flows', type: 'CHART', icon: 'account_balance',
                description: 'A stacked bar chart showing each ETF issuer\'s net daily flow in millions of dollars. Positive bars (above zero) indicate net inflows — new capital entering the ETF. Negative bars indicate outflows — capital being redeemed. A white line overlay tracks the cumulative running total across all issuers on the right Y-axis. Issuers tracked: BlackRock IBIT (cyan), Fidelity FBTC (green), ARK ARKB (yellow), and Bitwise BITB (purple).',
                howToRead: 'The left Y-axis measures individual daily flow per issuer in $M. The right Y-axis (white line) measures the cumulative total across all ETFs. Each bar stack shows the composite picture: how many issuers are flowing in the same direction simultaneously.',
                signals: [
                    'All bars green on the same day = broad institutional accumulation',
                    'IBIT dominant green while others red = BlackRock-specific buying pressure',
                    'Cumulative line curling downward after sustained highs = distribution phase beginning',
                    '3+ consecutive days of net positive signals institutional price support regime'
                ]
            },
            {
                name: 'Daily Flow Leaderboard', type: 'TABLE', icon: 'leaderboard',
                description: 'A ranked table sorting all tracked ETFs by their most recent trading day\'s net flow. Colour-coded: green values indicate net inflows, red values indicate net outflows. This gives an immediate single-line read on which institutional vehicle is currently driving the market.',
                howToRead: 'Read top-to-bottom as a ranking of institutional conviction by issuer. The top fund by flow is where the real money is moving today.',
                signals: [
                    'Leaderboard flip (e.g. FBTC overtaking IBIT) = custodian rotation, often during rebalancing',
                    'All four funds showing red = serious distribution event, high caution',
                    'Bottom-ranked fund going green while others red = contrarian accumulation',
                    'Total combined flow exceeding $500M in a day = significant macro event driver'
                ]
            },
            {
                name: 'Cumulative Flow USD', type: 'STAT', icon: 'monetization_on',
                description: 'A single large-format stat displaying the total net cumulative inflow across all tracked Bitcoin Spot ETFs since their January 2024 launch. This is the definitive measure of structural institutional adoption.',
                howToRead: 'Compare this figure week-over-week. Growth confirms sustained institutional interest. A declining cumulative total (net negative week) is a rare but significant warning signal.',
                signals: [
                    'Cumulative total declining week-over-week = distribution pressure building',
                    'Cumulative total crossing round-number milestones ($20B, $30B) = media catalyst for new retail inflows',
                    'Rapid acceleration (>$1B added in one week) = short-squeeze catalyst'
                ]
            },
            {
                name: 'Cumulative Net Flow Waterfall (Week-over-Week)', type: 'CHART', icon: 'waterfall_chart',
                description: 'A floating bar waterfall chart showing the last 10 trading days of net ETF flows as individual gain/loss blocks. Each bar floats from the previous day\'s cumulative total, so the chart visually shows whether momentum is building or eroding. A dashed cyan line tracks the running sum. Green bars extend upward (inflow day), red bars fall downward (outflow day).',
                howToRead: 'Follow the dashed cyan line direction. Bars above the previous bar = accumulation momentum building. Bars that break below the previous baseline = structural selling beginning. The height of each bar reflects the magnitude of that day\'s flow.',
                signals: [
                    'Cascading red bars compressing the cyan line = sustained distribution, price weakness likely',
                    'A large green bar after multiple red bars = institutional capitulation buy (reversal signal)',
                    'Consistently small positive bars = steady accumulation, price likely grinding higher',
                    'Alternating green/red bars of equal size = distribution at price; choppy price action expected'
                ]
            },
        ]
    });
}

function renderDocsViewLiquidations() {
    renderViewDocPage({
        hub: 'Global Markets', hubIcon: 'public', hubColor: '#00f2ff',
        title: 'Liquidations', viewId: 'liquidations',
        relatedDocs: [
            { name: 'ETF Flows', route: 'docs-etf-flows', icon: 'account_balance' },
            { name: 'OI Radar', route: 'docs-oi-radar', icon: 'track_changes' },
            { name: 'Risk Matrix', route: 'docs-risk-matrix', icon: 'shield' },
        ],
        summary: 'Monitor forced position closures across all major derivatives exchanges. Liquidation cascades are one of the most reliable indicators of short-term price extremes and are essential context for any leveraged trade.',
        components: [
            {
                name: 'Liquidation Cascade Scanner', type: 'CHART', icon: 'local_fire_department',
                description: 'A horizontal bar chart showing forced liquidations broken down by asset (BTC, ETH, SOL, XRP, DOGE, etc.) and direction. Red bars represent LONG liquidations — traders who were betting on price increases and got forced out. Green bars represent SHORT liquidations — traders betting on price falls who got squeezed out. The X-axis measures liquidations in millions of dollars.',
                howToRead: 'Longer red bars = longs being wiped out, price likely dropped sharply. Longer green bars = shorts being squeezed, price likely spiked sharply. The ratio of red to green bars reveals which side of the market is over-leveraged.',
                signals: [
                    'BTC longs >$50M in 24h = aggressive long squeeze event, potential for further downside',
                    'Shorts >$30M across multiple assets simultaneously = broad short-squeeze, momentum strong',
                    'Longs dominating but price not recovering = cascading liquidations, do not catch the knife',
                    'Equal long/short liquidations = indecision; wait for a clear directional break'
                ]
            },
            {
                name: 'Total Rekt 24H', type: 'STAT', icon: 'local_fire_department',
                description: 'Displays the total combined liquidation volume across all assets and exchanges in the past 24 hours, with the Long/Short breakdown as a percentage. A headline figure that immediately contextualises the severity of the current move.',
                howToRead: 'Higher totals (>$200M/day) indicate a volatile, leveraged market environment. The Long/Short percentage split shows which side of the market is more aggressively leveraged.',
                signals: [
                    '>$500M total in 24h = extreme volatility event; institutional risk-off likely',
                    '78%+ Long-biased liquidations = the market was over-leveraged long, possible bottom forming',
                    '78%+ Short-biased liquidations = short squeeze in progress, momentum trade setup active'
                ]
            },
            {
                name: 'Largest Single Order', type: 'STAT', icon: 'bolt',
                description: 'Displays the single largest forced liquidation order detected in the current 24-hour window, including the asset pair, exchange, and notional size in USD. Large single liquidations from specific exchanges can reveal which institutional venues are most exposed.',
                howToRead: 'A liquidation >$1M from CME indicates institutional futures positioning unwound. A liquidation from Binance or Bybit >$2M is a significant retail leverage flush.',
                signals: [
                    'Single liquidations >$5M = a large leveraged fund or whale position was forced out',
                    'CME-origin large liquidation = institutional momentum shift, follow with caution',
                    'Repeated large orders at the same price = cluster liquidation zone, likely a magnet for price'
                ]
            },
        ]
    });
}

function renderDocsViewOIRadar() {
    renderViewDocPage({
        hub: 'Global Markets', hubIcon: 'public', hubColor: '#00f2ff',
        title: 'OI Radar', viewId: 'oi-radar',
        relatedDocs: [
            { name: 'Liquidations', route: 'docs-liquidations', icon: 'local_fire_department' },
            { name: 'Options Flow', route: 'docs-options-flow', icon: 'waterfall_chart' },
            { name: 'CME Gaps', route: 'docs-cme-gaps', icon: 'candlestick_chart' },
        ],
        summary: 'Open Interest (OI) measures the total number of outstanding derivative contracts. This hub aggregates OI data across Binance, Bybit, OKX, and CME to reveal where leverage is concentrated and which direction the squeeze will come.',
        components: [
            {
                name: 'Exchange OI Spider Chart', type: 'CHART', icon: 'track_changes',
                description: 'A radar/spider chart comparing Binance Perpetuals vs CME Futures across four dimensions: Open Interest ($B), 24h Delta (%), Funding Rate (—100), and Volume (relative). Each axis normalises to 100, allowing direct comparison of the two dominant trading venues. The cyan polygon represents CME; the yellow polygon represents Binance.',
                howToRead: 'When the CME polygon is larger than Binance on the OI axis, institutional futures positioning is dominant. When Binance dominates the Funding Rate axis, perpetual speculators are over-extended.',
                signals: [
                    'CME OI leading Binance by >$2B = institutional hedging or ETF arbitrage in play',
                    'Binance funding rate >0.03% = perpetuals overheated long; short squeeze risk reducing',
                    'Both polygons shrinking simultaneously = market de-risking; liquidity withdrawing',
                    'Funding rate near 0 on all venues = market is balanced; breakout likely imminent'
                ]
            },
            {
                name: 'OI Flow Attribution Table', type: 'TABLE', icon: 'table_chart',
                description: 'A table listing each major derivatives exchange with their absolute OI ($B), 24-hour change delta (%), and current funding rate. This gives a structured breakdown of where capital is committed across the derivatives ecosystem.',
                howToRead: 'Sort mentally by OI size for concentration risk. A positive delta means OI is growing (new positions opening). A negative delta means positions are closing (de-leveraging).',
                signals: [
                    'OI growing on CME while Binance OI falls = regulated institutions buying, retail exiting',
                    'Negative OI delta across all venues = broad de-risking; price instability likely',
                    'Funding rate diverging significantly between venues = basis trade opportunity'
                ]
            },
            {
                name: 'Options Implied Volatility Smile Curve', type: 'CHART', icon: 'show_chart',
                description: 'A line chart plotting Implied Volatility (IV%) against strike price moneyness — from deep OTM Puts (-30%) through ATM (0%) to deep OTM Calls (+30%). A dashed baseline shows 30-day Historical Volatility for reference. The IV Smile is sourced from Deribit 30-day expiry options.',
                howToRead: 'A steeper left tail (OTM Puts showing high IV) means institutions are aggressively buying downside protection. A flatter right tail (OTM Calls with lower or equal IV) means the market is not pricing in a large upside move. An inverted smile (higher IV at OTM calls) would indicate a call skew — bullish.',
                signals: [
                    'Left-tail IV >80% with right-tail <65% = institutional put-buying, fear of downside',
                    'IV Smile flatter than historical baseline = volatility compression; breakout imminent',
                    'Both tails symmetric and elevated = market pricing in a large move, direction unknown',
                    'Right-tail IV exceeds left-tail = call skew; institutions expect rally or are hedging short'
                ]
            },
            {
                name: 'OI Divergence Bubble Map', type: 'CHART', icon: 'bubble_chart',
                description: 'A bubble scatter chart plotting 24h Price Change (X-axis) against 24h OI Change (Y-axis) for 8 assets simultaneously. Bubble size = absolute OI ($B). Colour coding: Orange = price up + OI up (long-squeeze risk), Red = price down + OI up (short-trap risk), Yellow = price up + OI down (long unwind), Grey = price down + OI down (de-leveraging).',
                howToRead: 'Each bubble is one asset. Assets in the orange quadrant (top-right) are most vulnerable to a long squeeze - OI is growing as price rises, meaning traders are adding longs into a rally. Assets in the red quadrant (top-left) are building a squeeze setup on the short side.',
                signals: [
                    'Large BTC bubble in orange quadrant = high leverage long squeeze risk for the overall market',
                    'Multiple small-cap coins in red quadrant simultaneously = coordinated short-squeeze signal',
                    'Assets clustering near origin (0%, 0%) = low conviction market, range-bound expected',
                    'A single asset migrating from grey to orange over consecutive days = accumulation detected'
                ]
            },
            {
                name: 'OI x Funding Squeeze Matrix', type: 'CHART', icon: 'grid_on',
                description: 'A dynamic heatmap matrix crossing Open Interest concentration with funding/basis divergence to isolate Long/Short trap probability.',
                howToRead: 'High OI combined with highly negative funding indicates an aggressive short build-up. High OI with high positive funding indicates over-leveraged longs.',
                signals: [
                    'High OI + Extreme Negative Funding = High probability of a violent Short Squeeze',
                    'High OI + Extreme Positive Funding = Longs overextended; flush risk elevated',
                    'Matrix clustering in the top right = Market structurally primed for a directional volatile break'
                ]
            }
        ]

    });
}

function renderDocsViewCMEGaps() {
    renderViewDocPage({
        hub: 'Global Markets', hubIcon: 'public', hubColor: '#00f2ff',
        title: 'CME Gaps', viewId: 'cme-gaps',
        summary: 'CME Bitcoin Futures trade only on weekdays (Sunday 6PM to Friday 5PM ET). Gaps form when the Friday closing price differs materially from the Sunday opening price. These unfilled price voids act as institutional "magnet" levels that price is statistically drawn to fill.',
        components: [
            {
                name: 'Active Magnet Levels Registry', type: 'TABLE', icon: 'candlestick_chart',
                description: 'A structured list of all currently active (unfilled) CME Gap levels. Each entry shows the price range of the gap, whether it is an UPPER gap (above current price) or LOWER gap (below current price), its fill status (UNFILLED, PARTIAL, FILLED), and the current percentage distance from spot price. Colour coding: green for upper gaps, red/amber for lower gaps based on proximity.',
                howToRead: 'UNFILLED gaps are open structural liquidity voids. The "Distance" column shows how far price needs to travel to fill each gap. PARTIAL gaps have been partially filled but the level still exerts magnetic pull. FILLED gaps are historical reference — they no longer act as magnets.',
                signals: [
                    'A gap within 2-3% of current price = high probability of imminent gap fill, plan entries',
                    'Multiple unfilled lower gaps stacking = downside targets are well-defined; use as take-profit',
                    'No unfilled lower gaps + upper gap exists = path of least resistance is up',
                    'Friday/Sunday gap >2% = use Monday to confirm direction before committing to a trade',
                    'Price rapidly approaching a gap level from above = institutional sell-orders likely near gap top'
                ]
            },
        ]
    });
}

// MACRO INTEL APPENDED

// ============= MACRO INTEL HUB =============
function renderDocsViewBriefing() {
    renderViewDocPage({
        hub: 'Macro Intelligence', hubIcon: 'monitoring', hubColor: '#a78bfa',
        title: 'Strategy Briefing', viewId: 'macro-hub',
        summary: 'The AI-powered institutional morning brief. Every data point is synthesised into actionable macro context by the AlphaSignal intelligence engine.',
        components: [
            { name: 'AI Institutional Memo', type: 'AI', icon: 'memory',
              description: 'A GPT-4o-mini generated memo covering: Macro Context (current regime, BTC vs key levels, fear/greed reading), Key Opportunities (highest-alpha setups from the ML engine), and Risk Warnings (elevated Z-scores, liquidation concentration, macro event risks). Regenerated every 15 minutes.',
              howToRead: 'Read top-to-bottom as a structured pre-trade briefing. Bold purple terms are key concepts. The Key Opportunities paragraph contains the most actionable content.',
              signals: ['Multiple assets in Opportunities = broad momentum; consider basket exposure','Risk Warnings longer than Opportunities = defensive posture recommended','Mentions of liquidation cluster = volatile session expected','Refresh generates a new memo if market conditions have shifted'] },
            { name: 'System Conviction Dials', type: 'GAUGE', icon: 'speed',
              description: 'Three 180-degree analog gauges: Fear & Greed Index (0-100), Network Congestion (gas fees proxy), and Retail Sentiment Score. Each sweeps from red through amber to green.',
              howToRead: 'All three dials together give the market health picture. Fear & Greed <25 = extreme fear (contrarian buy zone). Retail Sentiment >80 = euphoria warning.',
              signals: ['All three dials green simultaneously = high-conviction bullish environment','Fear & Greed <25 + Retail Sentiment <30 = capitulation; historically strong buy zone','Retail Sentiment >80 + Fear & Greed >80 = distribution warning','Network Congestion spike without price move = quiet on-chain accumulation'] },
            { name: 'BTC vs 60/40 Benchmark Chart', type: 'CHART', icon: 'show_chart',
              description: 'Dual-line chart comparing BTC cumulative return against a traditional 60/40 portfolio over a rolling 90-day window. Contextualises BTC performance within traditional finance frameworks.',
              howToRead: 'When BTC line diverges positively, Bitcoin is outperforming traditional assets. Negative divergence signals institutional rotation to safe assets.',
              signals: ['BTC crossing above 60/40 after underperformance = momentum re-entry signal','BTC underperforming 60/40 for >30 days = macro headwinds; reduce sizing','Both lines declining = risk-off; cash or stables preferred'] },
        ]
    });
}
function renderDocsViewSectorRotation() {
    renderViewDocPage({
        hub: 'Macro Intelligence', hubIcon: 'monitoring', hubColor: '#a78bfa',
        title: 'Sector Rotation', viewId: 'rotation',
        summary: 'Track which crypto sectors are attracting capital and which are bleeding. Rotation patterns reveal where institutional money is moving before price confirms.',
        components: [
            { name: 'Sector Momentum Treemap', type: 'CHART', icon: 'grid_view',
              description: 'Each rectangle represents a crypto sector. Size = relative market cap weight. Colour = 7-day momentum: dark green (strong positive), light green (mild), grey (flat), orange (mild negative), red (strong negative).',
              howToRead: 'Green-heavy treemap = broad market strength. Only one or two green sectors = narrow rotation. Memes outsizing all others = retail FOMO phase.',
              signals: ['L1s green while DeFi red = base layer accumulation, early bull signal','All sectors red except Stables = active risk-off; go defensive','L2s outperforming L1s = scaling narrative gaining traction'] },
            { name: 'Rotation Matrix Table', type: 'TABLE', icon: 'swap_horiz',
              description: 'Ranks sectors by 1D, 7D, and 30D momentum scores with direction arrows. Compare columns to identify emerging rotations before they appear in price charts.',
              howToRead: '1D flipping positive while 7D still negative = early reversal candidate. Positive 7D but negative 1D = approaching top.',
              signals: ['1D arrow flipping from down to up with 7D negative = reversal candidate','DeFi and L2s rotating positive together = ETH ecosystem accumulation','All sectors showing double-down arrows = flash crash; wait for stabilisation'] },
        ]
    });
}
function renderDocsViewMacroCompass() {
    renderViewDocPage({
        hub: 'Macro Intelligence', hubIcon: 'monitoring', hubColor: '#a78bfa',
        title: 'Macro Compass', viewId: 'macro-hub',
        summary: 'Cross-asset correlation analysis combining crypto, equities, bonds, and the US Dollar. Essential for understanding whether Bitcoin is trading as a risk asset, safe haven, or in a detached regime.',
        components: [
            { name: 'Cross-Asset Correlation Heatmap', type: 'CHART', icon: 'grid_on',
              description: 'A colour-coded matrix of Pearson correlations between BTC and macro assets: S&P 500, Gold, DXY, US 10Y Yield, Nasdaq. Values -1.0 to +1.0. Cyan = positive, red = negative.',
              howToRead: 'Focus on the BTC row. High BTC/SPX (>0.6) = Bitcoin as a risk asset; macro events dominate. Low BTC/DXY is normal.',
              signals: ['BTC/SPX >0.7 = trade BTC like Nasdaq; Fed decisions will dominate','BTC/Gold correlation rising = safe-haven narrative gaining institutional traction','BTC decorrelating from all assets = unique internal catalyst; on-chain analysis most relevant'] },
            { name: 'US Yield Curve Monitor', type: 'CHART', icon: 'timeline',
              description: 'Line chart of US Treasury yields across maturities (3M, 2Y, 5Y, 10Y, 30Y) vs 90-days-ago. Inversion (short > long rates) highlighted in red.',
              howToRead: 'Normal upward slope = healthy growth. Inverted curve historically precedes recession by 6-18 months. 2Y/10Y spread is the key watch metric.',
              signals: ['Deepening inversion = recession risk rising; risk-off expected','10Y yield >5% = competition for capital; crypto outflows to bonds accelerate','Curve rapidly steepening after inversion = recession arriving; gold > BTC short term'] },
            { name: 'DXY (US Dollar Index) Overlay', type: 'CHART', icon: 'currency_exchange',
              description: 'Dual-axis chart of DXY vs BTC price over 90 days. The inverse correlation between dollar strength and crypto is one of the most consistent macro relationships.',
              howToRead: 'Both moving inversely = correlation active, macro-driven. If both rise simultaneously, internal BTC demand is overcoming macro headwinds.',
              signals: ['DXY falling from multi-year highs = historically strong crypto tailwind','DXY >105 = headwind for all risk assets including crypto','BTC rising while DXY rising = very bullish ? unique internal demand overcoming headwinds'] },
        ]
    });
}
function renderDocsViewMacroCalendar() {
    renderViewDocPage({
        hub: 'Macro Intelligence', hubIcon: 'monitoring', hubColor: '#a78bfa',
        title: 'Macro Calendar', viewId: 'macro-calendar',
        summary: 'Forward-looking calendar of high-impact economic events scored for their expected effect on Bitcoin. Prevents being caught off-guard by scheduled macro volatility.',
        components: [
            { name: 'Economic Event Calendar', type: 'WIDGET', icon: 'calendar_month',
              description: 'Timeline of upcoming macro events: FOMC meetings, CPI, Non-Farm Payrolls, PCE, GDP, and Fed speeches. Each tagged with date/time (UTC) and impact level (HIGH/MEDIUM/LOW).',
              howToRead: 'Red tags (HIGH) will almost certainly cause short-term BTC volatility. Amber (MEDIUM) depends on outcome vs consensus. Green (LOW) are typically non-events.',
              signals: ['FOMC within 48h = reduce leveraged exposure','CPI below expectations = dovish signal; strong bullish crypto catalyst','Multiple HIGH events in one week = risk management week; smaller position sizes'] },
            { name: 'BTC Impact Score Table', type: 'TABLE', icon: 'bolt',
              description: 'Table with proprietary BTC Impact Score (0-10) for each event, combining: historical BTC volatility around this event type, current positioning, and deviation from consensus.',
              howToRead: 'Score 7+ = direct preparation needed. Score 3 or below = tradeable without adjustment.',
              signals: ['Impact 8-10 = close leveraged positions 24h before','Impact 7+ with OI > = extreme leverage flush risk','Post-event: if BTC does not move on a 9/10 event, the subsequent direction is very significant'] },
        ]
    });
}
function renderDocsViewRegime() {
    renderViewDocPage({
        hub: 'Macro Intelligence', hubIcon: 'monitoring', hubColor: '#a78bfa',
        title: 'Market Regime', viewId: 'regime',
        summary: 'The AlphaSignal Regime Engine classifies the market into High-Volatility Expansion, Low-Volatility Compression, or Neutral/Accumulation. Each regime demands a completely different trading approach.',
        components: [
            { name: 'Current Regime Classifier', type: 'GAUGE', icon: 'category',
              description: 'Large-format display of the currently detected regime with confidence score (0-100%). Three regimes: HIGH-VOL EXPANSION (trending, large moves), LOW-VOL COMPRESSION (tight range, coiling energy), NEUTRAL/ACCUMULATION (mid-range, institutional patterns). Uses a Hidden Markov Model.',
              howToRead: 'The regime label is the primary output. Below 60% confidence = regime transition; be cautious.',
              signals: ['HIGH-VOL >80% confidence = trend-following strategies outperform','LOW-VOL >75% confidence = breakout imminent; reduce size and wait','Confidence falling from >80% to <60% = transitioning; reduce all exposure temporarily'] },
            { name: 'Regime Transition Probability Matrix', type: 'TABLE', icon: 'transform',
              description: '3x3 matrix showing statistical probability of transitioning from current regime to each other regime over next 7 days. Built from historical sequence data.',
              howToRead: 'Find the current regime row. The column with highest probability = most likely next state.',
              signals: ['High probability LOW-VOL to HIGH-VOL = breakout imminent; prepare levels','HIGH-VOL to NEUTRAL probable = trend exhausting; take profits on winners','Equal probabilities = model uncertain; very mixed market signals'] },
            { name: 'Regime History Heatmap', type: 'CHART', icon: 'view_timeline',
              description: '90-day colour-coded heatmap: red (High-Vol), teal (Low-Vol Compression), amber (Neutral). Each column = one calendar day.',
              howToRead: 'Look for duration patterns. Long teal runs almost always precede red periods. Rapid alternation = choppy market.',
              signals: ['Teal run >14 days = breakout overdue; energy has been coiling','Pattern amber > teal > red = textbook accumulation > compression > expansion sequence','Red spikes then immediately amber = failed breakout; likely retraces'] },
        ]
    });
}
// ============= ALPHA STRATEGY HUB =============
function renderDocsViewSignals() {
    renderViewDocPage({
        hub: 'Quant Strategy Lab', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Signal Intelligence', viewId: 'signals',
        relatedDocs: [
            { name: 'ML Engine', route: 'docs-ml-engine', icon: 'smart_toy' },
            { name: 'Backtester V2', route: 'docs-backtester', icon: 'history' },
            { name: 'Signal Archive', route: 'docs-signal-archive', icon: 'archive' },
            { name: 'Alpha Score', route: 'docs-alpha-score', icon: 'electric_bolt' },
        ],
        summary: 'The core signal engine monitors 50+ assets across MVRV deviations, momentum oscillators, on-chain flows, and social sentiment. Z-score measures how statistically extreme each signal is.',
        components: [
            { name: 'Signal Cards Grid', type: 'WIDGET', icon: 'radar',
              description: 'Each asset generates a card: Ticker, Category, Price, 24h Change, Relative Alpha (%), Sentiment label, BTC Correlation, Z-Score badge. Category filter bar allows sector-level screening. Cards with Z >1.75 pulse with a glow border.',
              howToRead: 'Z-Score colour: cyan (0.5-1.0 mild), amber (1.0-1.75 moderate), red (>1.75 extreme outlier). Positive alpha = asset outperforming BTC. The AI THESIS button generates a GPT-4o-mini trade rationale.',
              signals: ['Z >2.0 with green alpha = extreme bullish outlier; high-conviction long','Z >1.75 with negative alpha = extreme bearish; short candidate or avoid','Bullish sentiment + low Z = early momentum, not yet extreme ? watch to confirm','BEARISH + high Z = crowded short; watch for squeeze potential'] },
            { name: 'Strategy Firing Density Histogram (30D)', type: 'CHART', icon: 'bar_chart',
              description: '30-day bar chart of daily signal count. Colour by density: grey (<4), cyan (4-7), amber (7-12), red (>18). Reveals whether the current signal environment is active or quiet.',
              howToRead: 'High bars on the right = active environment. Grey plateau then sudden spike = market waking up. Consecutive red bars = extreme activity coinciding with major price moves.',
              signals: ['3+ red bars in 5 days = hyperactive environment; high volatility period active','Sustained grey for 2+ weeks = low conviction; reduce position sizes','Single sudden red spike after grey = breakout catalyst has triggered'] },
            { name: 'Z-Score Bell Curve Distribution', type: 'CHART', icon: 'area_chart',
              description: 'Histogram of all current Z-scores with a Gaussian curve fitted on top in purple. X-axis: -2s to +2s in 0.25 buckets. Bar colours match signal card scheme.',
              howToRead: 'Normal bell = most assets at baseline. Positive skew = broad bullish momentum. Fat tails on both sides = high dispersion market.',
              signals: ['Distribution skewing positive = systematic broad-market strength; index exposure appropriate','Fat tails both sides = pairs trades or sector rotation opportunities','Most assets at Z=0 = low conviction; wait for distribution to widen'] },
            { name: 'Signal Confidence Radar', type: 'CHART', icon: 'track_changes',
              description: '6-axis radar scoring confidence for a selected asset: Momentum, Volatility, Network Activity, Liquidity, Social Hype, Dev Commits. Asset selectable via dropdown.',
              howToRead: 'Large even hexagon = well-rounded conviction. Lopsided shape = single-factor signal, lower reliability.',
              signals: ['High Momentum + Network Activity + Liquidity = strongest signal trinity','High Social Hype + Low Network Activity = hype pump; extreme caution','All axes below 40 = asset is dormant; skip regardless of Z-score'] },
            { name: 'Signal Permalink Engine', type: 'AUTOMATION', icon: 'link',
              description: 'Native sharing mechanic attached to each Signal Card. Generates a deterministic URL (`?view=signal&id={ticker}`) that allows external or internal routing directly to a specific asset\'s live intelligence feed.',
              howToRead: 'Click the "Copy Permalink" button to copy the sharable institutional view of this asset. When pasted into the browser, it forces the terminal to fetch live ticker data on load.',
              signals: ['Send permalinks to team members for peer-review before executing large allocations','Use permalinks in your own external documentation or note-taking systems to link back to live AlphaSignal state'] }
        ]
    });
}
function renderDocsViewMLEngine() {
    renderViewDocPage({
        hub: 'Quant Strategy Lab', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'ML Alpha Engine', viewId: 'signals',
        summary: 'The dual-model ensemble (LSTM + XGBoost) generates 24h price direction predictions. This view exposes the model internals ? confidence scores, feature importances, and agreement metrics.',
        components: [
            { name: 'ML Prediction Table', type: 'TABLE', icon: 'smart_toy',
              description: 'Ranked table: Asset, ML Direction (LONG/SHORT/NEUTRAL), LSTM Confidence %, XGBoost Confidence %, Ensemble Consensus (HIGH/MEDIUM/LOW), Primary reason. Sorted by ensemble confidence.',
              howToRead: 'Focus on HIGH consensus rows ? both models agree. Both >70% = elite signal quality.',
              signals: ['Both models >75% same direction = highest-conviction terminal setup','Models disagreeing = LOW consensus; skip or reduce size significantly','NEUTRAL across majority of assets = no strong trend; cash is a valid position'] },
            { name: 'Feature Importance Bar Chart', type: 'CHART', icon: 'bar_chart',
              description: 'Horizontal bars ranking the top 10 XGBoost input features by contribution: RSI deviation, MVRV Z-score, funding rate, volume delta, social velocity, on-chain active addresses.',
              howToRead: 'Longest bar = factor currently driving predictions most. If funding rate dominates, derivatives are key. If MVRV dominates, on-chain valuation is primary.',
              signals: ['Social velocity top-ranked = hype-driven cycle; models may lag, use cautiously','MVRV or on-chain top-ranked = fundamental model signal, higher reliability','Volume delta first = short-term flow prediction useful for day-trade confirmation'] },
            { name: 'Model Accuracy Gauge', type: 'GAUGE', icon: 'speed',
              description: '180-degree gauge showing rolling 30-day directional accuracy. Reference line at 58% = the statistical edge threshold. Calculated on a live holdout set.',
              howToRead: '>58% = model has edge. 50-58% = marginal edge, reduce position sizing 50%. <50% = discard predictions temporarily.',
              signals: ['>65% = strong model period; weight signals heavily in decisions','Falling from 65% to 55% over 2 weeks = regime change causing model drift','Below 50% = do not act on ML signals until recalibration'] },
        ]
    });
}
function renderDocsViewAlphaScore() {
    renderViewDocPage({
        hub: 'Quant Strategy Lab', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Alpha Score', viewId: 'alpha-score',
        summary: 'A composite 0-100 ranking of every tracked asset across momentum, sentiment, on-chain activity, ML prediction, and volatility. The most efficient single-screen opportunity screener.',
        components: [
            { name: 'Composite Alpha Score Ranking Table', type: 'TABLE', icon: 'electric_bolt',
              description: 'Paginated table (15/page): Rank, Ticker, Sector, Score progress bar, Grade (A/B/C/D), Signal label (STRONG BUY / BUY / NEUTRAL / CAUTION), Model consensus, LSTM %, XGBoost %, and reason summary. Bars colour-coded by grade: green (A), blue (B), yellow (C), red (D).',
              howToRead: 'Grade A + STRONG BUY + HIGH consensus = best current opportunities. Grade D + CAUTION = avoid or short candidates. WHY column summarises the specific driving factors.',
              signals: ['Multiple Grade-A assets in same sector = sector-wide momentum; allocation recommended','Asset dropping from A to C in 48h = signal deterioration; exit or reduce immediately','Grade-B with both models >70% = underrated; better risk/reward than crowded Grade-A'] },
            { name: 'Grade Distribution Summary', type: 'STAT', icon: 'grade',
              description: 'Stat cards showing count and percentage of assets in each grade bucket (A/B/C/D). Market-wide health read at a glance.',
              howToRead: 'Healthy bull market = 30-40% of assets in A or B. Bear market compresses most into D.',
              signals: ['>40% Grade A = euphoric bull; caution on new entries ? late cycle','> 60% Grade D = broad capitulation; contrarian buy zone likely forming','Even distribution across A/B/C/D = balanced market; individual asset selection critical'] },
        ]
    });
}
function renderDocsViewStrategyLab() {
    renderViewDocPage({
        hub: 'Quant Strategy Lab', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Strategy Lab', viewId: 'strategy-lab',
        summary: 'Live strategy testing with institutional metrics. Select a pre-built strategy, configure parameters, and see the equity curve, statistical metrics, and Monte Carlo confidence bands update in real-time.',
        components: [
            { name: 'Strategy Selector & Parameters', type: 'FORM', icon: 'science',
              description: 'Dropdown to select a strategy (MVRV Reversion, Momentum Cross, Regime-Adaptive, VWAP Bounce) with configurable asset, lookback window, and signal threshold.',
              howToRead: 'Start with default parameters. Modify one parameter at a time. Wide thresholds fire fewer but higher-quality signals.',
              signals: ['MVRV Reversion works best in HIGH-VOL regimes','Regime-Adaptive works across all market states','Momentum Cross requires a confirmed trend ? check Regime view first before using'] },
            { name: 'Strategy Equity Curve', type: 'CHART', icon: 'show_chart',
              description: 'Cumulative portfolio value from  over the backtested period. Green dots = entries, red dots = exits. Compared against BTC buy-and-hold baseline.',
              howToRead: 'Strategy line consistently above BTC baseline = alpha being generated. Large sudden drops = drawdown periods. Smooth steady rise = robust strategy.',
              signals: ['Strategy above BTC baseline consistently = genuine alpha, not just market beta','Strategy below BTC >30 days = underperforming simple holding; reconsider allocation','Equity plateau = strategy in losing streak; wait for confirmation before going live'] },
            { name: 'Guppy EMA Density Ribbon', type: 'CHART', icon: 'waves',
              description: 'Price chart with 15 EMAs: 6 short-period (3-15) in cyan, 9 long-period (30-75) in red. Ribbon compression = volatility coiling. Expansion = trend confirmed.',
              howToRead: 'Cyan ribbon above red = bullish structure. Red above cyan = bearish. Crossing = trend change. ALL ribbons compressed together = large move imminent.',
              signals: ['Cyan crossing above red = strong trend reversal to upside','Both ribbons tight = breakout imminent; watch for volume confirmation','Price holding above cyan ribbon during pullback = trend intact; buy the dip'] },
            { name: 'Monte Carlo Simulation Bands', type: 'CHART', icon: 'scatter_plot',
              description: '500 simulated 30-day return paths from current equity. Shaded region = 5th-95th percentile. Bold median line = expected trajectory.',
              howToRead: 'Wide band = high variance / uncertainty. Narrow band = more predictable. The 5th percentile line is your downside scenario.',
              signals: ['Narrow band sloping up = high-confidence bullish outlook for this strategy','Wide downward band = risky in current conditions; reduce allocation','5th percentile below your stop-loss threshold = position size needs reduction'] },
        ]
    });
}
function renderDocsViewBacktester() {
    renderViewDocPage({
        hub: 'Quant Strategy Lab', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Backtester V2', viewId: 'backtester-v2',
        summary: 'Institutional-grade backtests across the full AlphaSignal history. Every metric is computed on actual historical signals ? not reconstructed or curve-fitted.',
        components: [
            { name: 'Rolling Sharpe Ratio Chart', type: 'CHART', icon: 'show_chart',
              description: '30-day rolling Sharpe Ratio time-series across the full backtest period. Reference line at Sharpe = 1.0 marks the minimum acceptable institutional threshold.',
              howToRead: 'Above 1.0 = generating better risk-adjusted returns than 1:1. Above 2.0 = excellent. Below 0 = losing money relative to risk taken.',
              signals: ['Consistently >1.5 over 90+ days = institutionally viable strategy; deploy capital','Dropping from 2.0 to 0.5 = entering difficult regime; reduce exposure','Recovering from negative to positive = regime aligning again'] },
            { name: 'Monthly P&L Heatmap Calendar', type: 'CHART', icon: 'calendar_month',
              description: 'Calendar heatmap of monthly returns: dark green (>+5%), light green (+1-5%), grey (flat), orange (-1 to -5%), red (<-5%). Reveals seasonal patterns in strategy performance.',
              howToRead: 'Look for consistent red or green months across multiple years ? these are structural patterns worth accounting for.',
              signals: ['Consistent red in January = reduce exposure in Jan for this strategy','Consistent green in Q4 = end-of-year institutional buying benefits this strategy','Isolated red months surrounded by green = one-off event, not structural'] },
            { name: 'Trade Summary Statistics Panel', type: 'STAT', icon: 'analytics',
              description: 'Full stats: Total Trades, Win Rate %, Avg Win, Avg Loss, Profit Factor (Wins/Losses), Max Drawdown %, Calmar Ratio (Annual Return / Max DD), Best/Worst single trade.',
              howToRead: 'Profit Factor >1.5 = makes .50 per  lost. Win Rate alone misleads ? 40% win rate with 3:1 reward/risk beats 70% win rate with 1:2.',
              signals: ['Profit Factor >2.0 = excellent edge; full allocation justified','Max Drawdown >30% = strong risk management protocols required','Calmar >1.0 = annual return exceeds max drawdown; strong risk-adjusted profile'] },
        ]
    });
}
function renderDocsViewSignalArchive() {
    renderViewDocPage({
        hub: 'Quant Strategy Lab', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Signal Archive', viewId: 'signal-archive',
        summary: 'Historical record of every signal generated, with outcome tracking. Build conviction in the methodology and identify which categories have the strongest track record.',
        components: [
            { name: 'Historical Signal Table', type: 'TABLE', icon: 'archive',
              description: 'Filterable table: Date, Ticker, Direction, Entry Z-Score, Entry/Exit Price, Return %, Duration, and Outcome badge (WIN/LOSS/OPEN). Filter by date range, ticker, direction, outcome.',
              howToRead: 'Sort by Return descending to find highest-alpha historical setups. Filter OPEN for active signals. Filter WIN to understand conditions that produce the best outcomes.',
              signals: ['Filtering LONG + WIN shows the best historical patterns; look for common conditions','Multiple consecutive LOSS for same ticker = strategy not suited for that asset','High-Z signals (>2.0) winning more frequently = confirms extreme Z-scores are reliable'] },
            { name: 'Running P&L Tracker', type: 'CHART', icon: 'trending_up',
              description: 'Cumulative return curve treating each signal as 1 unit of capital. This is the true live track record of the signal engine over its full operational history.',
              howToRead: 'Steadily rising curve = genuine statistical edge over time. Plateau = drawdown phase. Slope of recent section (right side) indicates current edge strength.',
              signals: ['Curve making new all-time highs = system in strong regime; highest conviction period','Drawdown for >60 days = difficult period; reduce position sizes on signals','Steep recent upward slope = system firing high-quality signals currently'] },
        ]
    });
}
function renderDocsViewNarrative() {
    renderViewDocPage({
        hub: 'Quant Strategy Lab', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Narrative Galaxy', viewId: 'narrative',
        summary: 'Force-directed network graph of market narrative strength and velocity across social media, on-chain data, and news. Narratives gaining momentum often precede price action.',
        components: [
            { name: 'Force-Directed Narrative Galaxy', type: 'MAP', icon: 'hub',
              description: 'Interactive graph where each node = a market narrative (e.g. BTC ETF Flows, ETH Staking, AI x Crypto). Node size = social mention volume. Colour: green (gaining), grey (flat), red (fading). Edges connect co-occurring narratives. Click a node to see constituent assets.',
              howToRead: 'Large green nodes = hot narratives with growing mindshare. Thick edges between two large nodes = narratives mutually reinforcing each other.',
              signals: ['New node growing rapidly = emerging narrative before price action confirms it','Large node shrinking and turning grey = narrative exhaustion; sell into this','Two bullish clusters merging = multiplicative effect; allocate to cross-narrative assets'] },
            { name: 'Narrative Velocity Table', type: 'TABLE', icon: 'speed',
              description: 'Narratives ranked by 7-day mention growth velocity. Shows: Name, Current Volume, 7D Change %, Peak Volume, and Momentum tag (ACCELERATING / PEAKING / FADING).',
              howToRead: 'ACCELERATING = early-to-mid stage, best entry. PEAKING = late stage, good for exits. FADING = actively avoid.',
              signals: ['New narrative hitting ACCELERATING from zero = ground floor opportunity','Narrative showing PEAKING + price at ATH = exit signal; distribute into narrative strength','Multiple narratives FADING simultaneously = broad exhaustion; correction likely'] },
        ]
    });
}

// ============= AI DOCUMENTATION =============
function renderDocsViewPlainEnglish() {
    renderViewDocPage({
        hub: 'Active Positions', hubIcon: 'person', hubColor: '#34d399',
        title: 'In Plain English AI', viewId: 'home',
        summary: 'The "In Plain English" AI Translator is a context-aware ML component injected directly into high-density institutional charts. It dynamically synthesises raw order flow, volatility options, and liquidation cascades into actionable risk management memos without leaving the terminal.',
        components: [
            { name: 'Live Tape Context (Pulse Persona)', type: 'AI', icon: 'auto_awesome',
              description: 'Available on the TradingView Advanced charting view (Live Order Tape). It reads the continuous websocket feed of block trades, isolating institutional accumulation or distribution in the last 100 ticks.',
              howToRead: 'Look for the "Aggressor" detection to see if blocks are hitting the bid or the ask. Read the "Regime" conclusion.',
              signals: ['"Sustained Ask-hitting" = aggressive long buying into resistance','Block clusters > $5M = whales stepping in to absorb retail flow'] },
            { name: 'Institutional Options Context (Quant Persona)', type: 'AI', icon: 'auto_awesome',
              description: 'Available on the Institutional Options Scanner view. It ingests the multi-expiry Options Implied Volatility matrix across Deribit and Equity Proxies to read term structure and smile characteristics.',
              howToRead: 'If the AI notes "Contango", longer-dated options are more expensive (normal). "Backwardation" implies near-term panic or event pricing.',
              signals: ['Call Skew identified = Institutions are aggressively buying upside exposure','Left-tail premium = Heavy put buying, downside protection being accumulated'] },
            { name: 'Ecosystem Capital Flow (Flow Persona)', type: 'AI', icon: 'auto_awesome',
              description: 'Available in the Chain Velocity Sankey view. Reads cross-chain value velocity to determine which L1 ecosystems are absorbing capital in real-time.',
              howToRead: 'Focus on where stablecoin inflows are being directed. The AI isolates genuine flow from circular wash trading.',
              signals: ['Concentrated flow into an L1 ecosystem without price move = leading indicator of rotation'] },
            { name: 'Narrative Galaxy Context (Narrative Persona)', type: 'AI', icon: 'auto_awesome',
              description: 'Available on the Narrative Galaxy graph. Understands social velocity and isolates high-momentum themes driving price.',
              howToRead: 'The AI will distill complex clustering into a single dominant market thesis.',
              signals: ['"Narrative exhaustion detected" = Theme is heavily discussed but momentum is slowing; risk-off marker'] }
        ]
    });
}

function renderDocsViewLOBHeatmap() {
    renderViewDocPage({
        hub: 'Global Markets', hubIcon: 'public', hubColor: '#00f2ff',
        title: 'LOB Heatmap', viewId: 'lob-heatmap',
        summary: 'High-density visual representation of limit order book (LOB) depth across 50 resting bid/ask price levels. Identifies institutional liquidity walls and spoofed orders before they execute.',
        components: [
            {
                name: 'Limit Order Book (LOB) Density Canvas', type: 'CHART', icon: 'blur_on',
                description: 'An advanced heat-gradient canvas component mapping 50 levels of bid/ask liquidity. Dark blue/black indicates thin liquidity; bright cyan/yellow indicates dense resting orders (liquidity walls).',
                howToRead: 'Follow the brightest yellow/cyan bands. Price is magnetically drawn to these high-liquidity zones. Sudden disappearance of a bright band indicates order spoofing or pulling.',
                signals: [
                    'Bright band at round number = institutional limit order resting; likely short-term reversal upon hitting',
                    'Dark zone between current price and a bright band = low friction path; price will move quickly',
                    'Asymmetrical brightness (dense bids, thin asks) = bullish structural support underneath current price'
                ]
            }
        ]
    });
}

function renderDocsViewVolumeProfile() {
    renderViewDocPage({
        hub: 'Alpha Strategy', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Market Profile (TPO)', viewId: 'volume-profile',
        summary: 'Time-Price Opportunity (TPO) mapping of traded volume at specific price levels. Highlights the Value Area and Point of Control (POC) to establish institutional fair value.',
        components: [
            {
                name: 'Horizontal Volume Distribution', type: 'CHART', icon: 'bar_chart',
                description: 'A horizontal bar chart showing cumulative volume traded at each price level over the selected timeframe. Calculates Value Area High (VAH), Value Area Low (VAL), and the Point of Control (POC).',
                howToRead: 'The Point of Control (POC) is the single price level with the most volume. Price tends to mean-revert to the POC. The Value Area contains 70% of the volume; breakouts from this area are significant.',
                signals: [
                    'Price extending far above POC = overvalued short-term; expect mean reversion',
                    'High Volume Node forming = new acceptance of price; establishes strong support/resistance',
                    'Low Volume Node (gap between peaks) = low friction zone; price will traverse this rapidly'
                ]
            }
        ]
    });
}
