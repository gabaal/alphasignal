// docs-b.js — remaining hub documentation
// Institutional | Analytics | Audit | Risk | Advanced Charting | Order Flow | Alerts | Personal

// ============= INSTITUTIONAL HUB =============
function renderDocsViewTokenUnlocks() {
    renderViewDocPage({
        hub: 'Institutional Hub', hubIcon: 'key', hubColor: '#fb923c',
        title: 'Token Unlocks', viewId: 'institutional-hub',
        summary: 'Track scheduled token unlock events across major protocols. Unlocks represent new circulating supply entering the market, often causing short-term sell pressure from early investors and team members.',
        components: [
            {
                name: 'Upcoming Unlock Schedule Table', type: 'TABLE', icon: 'lock_open',
                description: 'A table listing all tracked token unlock events in chronological order. Each row shows: Token, Unlock Date, Amount (tokens + USD equivalent), % of Circulating Supply, Beneficiary category (Team / Investors / Community), and a Sell Pressure rating (LOW / MEDIUM / HIGH). Colour-coded by proximity: green (>30 days), amber (7-30 days), red (<7 days).',
                howToRead: 'Sort by date ascending to see the most imminent risks. The % of Circulating Supply column is the most important — a small absolute dollar number can still be highly impactful if it is a large % of supply.',
                signals: [
                    'Unlock >5% of circulating supply within 7 days = significant sell pressure likely',
                    'Team or VC unlock with HIGH sell pressure = insiders likely to liquidate; reduce exposure',
                    'Community unlock = typically less immediate sell pressure than investor or team unlocks',
                    'Price already declining ahead of unlock = market pricing it in; potential buy after the unlock date'
                ]
            },
            {
                name: 'Supply Impact Score Badges', type: 'STAT', icon: 'warning',
                description: 'For each upcoming unlock, a colour-coded badge (1-10) estimates the expected market impact based on: unlock size vs average daily volume, historical behaviour of this token on prior unlocks, and the current market regime.',
                howToRead: 'Score 1-3 = Low impact, tradeable through. Score 4-6 = Moderate, consider reducing leverage. Score 7-10 = High impact, either hedge or exit before the unlock date.',
                signals: [
                    'Score 8-10 = treat like a macro event; reduce or exit 48h before unlock',
                    'Score 4-6 with declining price trend = compounding risk; treat as HIGH',
                    'Multiple high-score unlocks in same week = elevated systemic sell pressure across alts'
                ]
            }
        ]
    });
}

function renderDocsViewYieldLab() {
    renderViewDocPage({
        hub: 'Institutional Hub', hubIcon: 'key', hubColor: '#fb923c',
        title: 'DeFi Yield Lab', viewId: 'yield-lab',
        summary: 'Compare real yield opportunities across major DeFi protocols. Separates genuine yield (from protocol revenue) from inflationary token emissions that inflate APY numbers artificially.',
        components: [
            {
                name: 'Protocol APY Comparison Table', type: 'TABLE', icon: 'savings',
                description: 'A ranked table of DeFi protocols showing: Protocol name, Asset, Base APY (from real revenue), Reward APY (token emissions), Total APY, TVL ($B), Risk Score (1-10), and a REAL YIELD flag. Sorted by real yield descending.',
                howToRead: 'Focus on protocols with the REAL YIELD flag — these pay from actual fee revenue, not token printing. High total APY driven entirely by reward APY is unsustainable and will compress as token price falls.',
                signals: [
                    'Real yield >5% from a blue-chip protocol = institutional-grade opportunity',
                    'Total APY >100% with zero real yield = unsustainable farming; exit before rewards drop',
                    'TVL declining while APY rising = capital leaving, remaining TVL earning more — health check needed'
                ]
            },
            {
                name: 'Protocol Risk Score Bar', type: 'CHART', icon: 'shield',
                description: 'A horizontal bar chart ranking protocols by composite risk score (1-10) combining: smart contract audit status, time since last audit, TVL concentration, developer activity, and insurance coverage.',
                howToRead: 'Lower bar = lower risk. Use alongside APY — a protocol with risk score 9 offering 15% APY is not comparable to a risk score 2 protocol offering the same APY.',
                signals: [
                    'Risk score 1-3 with real yield >4% = institutional-grade allocation candidate',
                    'Risk score >7 regardless of APY = speculation only; size very small',
                    'Risk score jumping from 3 to 7 suddenly = a new vulnerability or finding; exit immediately'
                ]
            }
        ]
    });
}

function renderDocsViewPortfolioOptimizer() {
    renderViewDocPage({
        hub: 'Institutional Hub', hubIcon: 'key', hubColor: '#fb923c',
        title: 'Portfolio Optimizer', viewId: 'portfolio-optimizer',
        summary: 'ML-powered portfolio construction using Modern Portfolio Theory combined with regime-adaptive weights. Generates optimal allocations that maximise risk-adjusted return for the current market environment.',
        components: [
            {
                name: 'ML Rebalancing Recommendation Table', type: 'TABLE', icon: 'account_tree',
                description: 'Shows the current optimal portfolio weights per asset, current holdings (%), suggested change (+ increase / – decrease), and expected impact on portfolio Sharpe Ratio. The ML engine factors in the current regime classification.',
                howToRead: 'The Suggested Change column tells you what to do. Green = increase allocation. Red = reduce. The Sharpe Impact column shows how much each trade improves overall portfolio efficiency.',
                signals: [
                    'Large increase suggestion for an asset currently at 0% = new opportunity identified',
                    'Suggestion to reduce a winning position = model sees diminishing marginal Sharpe gain',
                    'All suggestions pointing to stable assets = model expects a risk-off period ahead'
                ]
            },
            {
                name: 'Efficient Frontier Scatter', type: 'CHART', icon: 'scatter_plot',
                description: 'Classic Markowitz Efficient Frontier scatter plot. X-axis = Volatility (risk), Y-axis = Expected Return. Current portfolio marked in red; ML-optimal portfolio in cyan on the frontier line. 1,000 Monte Carlo simulated portfolios shown as grey points.',
                howToRead: 'Points on the frontier line (upper-left boundary) are the most efficient risk/return combinations. If the red dot (current) is well below the frontier, significant optimisation gains are possible.',
                signals: [
                    'Current portfolio far below frontier = major rebalancing opportunity available',
                    'Frontier shifting downward = all portfolios expected to earn less; risk-off regime',
                    'Current portfolio ON the frontier = already optimal; focus on regime monitoring'
                ]
            }
        ]
    });
}

function renderDocsViewTradeLab() {
    renderViewDocPage({
        hub: 'Institutional Hub', hubIcon: 'key', hubColor: '#fb923c',
        title: 'Trade Idea Lab', viewId: 'tradelab',
        summary: 'Structure and evaluate trade ideas with institutional discipline. Build a complete trade thesis including entry rationale, risk/reward calculation, and position sizing before committing capital.',
        components: [
            {
                name: 'Thesis Builder Form', type: 'FORM', icon: 'tips_and_updates',
                description: 'A structured form where you input: Asset, Direction (Long/Short), Entry Price, Stop Loss, Target Price, Timeframe, and a Thesis Description. Auto-calculates Risk/Reward Ratio, Suggested Position Size (based on 1% account risk), and Maximum Draw Before Exit.',
                howToRead: 'Fill every field before acting. A forced systematic approach prevents emotional decisions. The AI Thesis Validator button sends your thesis to the model for critique and counter-argument generation.',
                signals: [
                    'Risk/Reward below 1.5:1 = re-evaluate the trade before proceeding',
                    'AI Validator returning more counter-arguments = high-risk setup; size down',
                    'Position size suggested exceeding 5% = verify the stop loss is not too tight'
                ]
            },
            {
                name: 'Risk/Reward Calculator', type: 'STAT', icon: 'calculate',
                description: 'Real-time display of: Gross R/R Ratio, Net R/R (after 0.1% fees), Expected Value (EV) assuming 55% win rate, and Maximum Loss in dollar terms. Updates instantly as thesis form inputs change.',
                howToRead: 'Positive EV with R/R >2:1 = statistically worthwhile setup. Negative EV = the trade does not make mathematical sense even with a slight edge.',
                signals: [
                    'EV positive and R/R >2:1 = proceed with the trade idea',
                    'EV negative at 55% win rate = improve the entry price or widen the target',
                    'Maximum Loss exceeding 2% of portfolio = reduce position size'
                ]
            }
        ]
    });
}

// ============= ANALYTICS HUB =============
function renderDocsViewWhalePulse() {
    renderViewDocPage({
        hub: 'Analytics Hub', hubIcon: 'analytics', hubColor: '#22c55e',
        title: 'Whale Pulse', viewId: 'analytics-hub',
        summary: 'Real-time monitoring of large on-chain transactions (>$500K). Whale movements are often the earliest detectable signal of institutional accumulation or distribution before price reacts.',
        components: [
            {
                name: 'Whale Transaction Feed', type: 'FEED', icon: 'waves',
                description: 'Live-scrolling feed of whale transactions. Each entry shows: timestamp, asset, transaction size ($M), direction (Exchange Inflow / Exchange Outflow / Wallet Transfer), from/to address labels (if known), and an impact badge. Inflows to exchanges = potential sell pressure. Outflows from exchanges = potential accumulation.',
                howToRead: 'Exchange Inflows (red) = whales moving funds TO an exchange, typically to sell. Exchange Outflows (green) = funds moving to cold wallets, typically accumulating. Wallet-to-wallet transfers are neutral unless the wallet is a known fund.',
                signals: [
                    'Multiple large exchange inflows within 1 hour = distribution pressure imminent',
                    'Large outflow from exchange to cold wallet by known fund = institutional accumulation signal',
                    'Cluster of whale transactions at price support = institutional defence of a level'
                ]
            },
            {
                name: 'Volume Bubble Scatter', type: 'CHART', icon: 'bubble_chart',
                description: 'A scatter plot where each bubble = one whale transaction. X-axis = time (last 24h), Y-axis = transaction size ($M), bubble colour = inflow (red) or outflow (green). Large bubbles high on the Y-axis are the most significant.',
                howToRead: 'Look for clusters of same-colour bubbles — multiple whales acting in the same direction simultaneously indicates coordinated activity.',
                signals: [
                    '3+ green bubbles >$10M within 1 hour = coordinated accumulation event; high-conviction buy',
                    'Large red bubble at price resistance = institutional seller defending that level',
                    'Bubbles absent for >6 hours = whale inactivity; wait for them to resume before trading directionally'
                ]
            }
        ]
    });
}

function renderDocsViewChainVelocity() {
    renderViewDocPage({
        hub: 'Analytics Hub', hubIcon: 'analytics', hubColor: '#22c55e',
        title: 'Chain Velocity', viewId: 'velocity',
        relatedDocs: [
            { name: 'Whale Pulse', route: 'docs-whale-pulse', icon: 'waves' },
            { name: 'On-Chain Analytics', route: 'docs-onchain', icon: 'link' },
            { name: 'Sector Rotation', route: 'docs-rotation', icon: 'swap_horiz' },
        ],
        summary: 'Cross-chain capital velocity and volume acceleration tracking across Ethereum, Solana, Avalanche, and Cardano. Identifies which L1 ecosystem is attracting institutional attention before price confirms the rotation.',
        components: [
            {
                name: 'Velocity Time-Series Chart', type: 'CHART', icon: 'speed',
                description: 'A multi-line time-series chart showing volume acceleration (Velocity Score) for each tracked L1 over the past 30 days. Velocity = current 24h volume ÷ 5-day moving average volume. A score above 1.0 means volume is expanding relative to recent norms. Lines are colour-coded by chain: Ethereum (cyan), Solana (green), Avalanche (orange), Cardano (purple). The 1.0 baseline is drawn as a dashed white reference line.',
                howToRead: 'Lines crossing above 1.0 from below = capital accelerating into that chain. Lines well above 2.0 = unusual surge — check whether it is organic demand or a one-off event. Lines persistently below 1.0 = capital leaving that ecosystem.',
                signals: [
                    'Solana velocity >1.8 while Ethereum <0.9 = active rotation from ETH to SOL; rotate sector exposure',
                    'All chains simultaneously above 1.5 = broad risk-on tide lifting all L1s; long basket exposure optimal',
                    'Single chain spiking alone above 2.5 = check for a protocol-specific event (airdrop, listing, exploit)',
                    'All chains falling below 0.7 together = macro risk-off; cash or stables preferred'
                ]
            },
            {
                name: 'Cross-Chain Capital Flow Sankey', type: 'CHART', icon: 'moving',
                description: 'A D3.js Sankey flow diagram showing where capital entered the ecosystem (left: Fiat, BTC, Stables) and where it flowed to (right: individual L1 networks and DeFi verticals). Line thickness is proportional to 24h volume. Labels show the USD equivalent of each flow stream.',
                howToRead: 'Follow the thickest lines to see where new capital is being deployed. A thick line entering Solana DeFi from Stables = new capital deploying into SOL-based yield strategies — a bullish indicator for SOL. Thin lines everywhere = capital is not moving between chains; range-bound market.',
                signals: [
                    'Thick flow into L2s (Arbitrum, Optimism) from ETH = users seeking lower fees; ETH ecosystem healthy',
                    'Capital flowing from L1s back to Stables = risk reduction in progress; across-chain de-risking',
                    'Heavy BTC → ETH Sankey line = ETH accumulation phase; likely precedes ETH outperformance',
                    'Multiple chains receiving inflows from Fiat simultaneously = new retail entry; early market expansion'
                ]
            },
            {
                name: 'Network Signature Radar', type: 'CHART', icon: 'radar',
                description: 'A 4-axis radar chart plotting each chain across: Momentum (price vs 20D MA), Social Heat (mention velocity), Liquidity (DEX volume rank), and Institutional Vigor (Z-score of volume acceleration). Each chain is a separate coloured polygon. A large, even polygon = well-rounded high-conviction chain.',
                howToRead: 'A chain with large Momentum but small Liquidity = price moving on thin volume — unsustainable. A chain with high Social Heat but low Institutional Vigor = hype without capital confirmation. Strong Vigor + Momentum together = high-confidence rotation signal.',
                signals: [
                    'Chain dominating all four axes = strongest current opportunity; lead allocation target',
                    'High Social Heat + Low Vigor for a chain = narrative ahead of capital; wait for Vigor to confirm',
                    'All chains showing small, compressed polygons = no clear rotation target; market undecided'
                ]
            }
        ]
    });
}

function renderDocsViewOnchain() {
    renderViewDocPage({
        hub: 'Analytics Hub', hubIcon: 'analytics', hubColor: '#22c55e',
        title: 'On-Chain Analytics', viewId: 'onchain',
        relatedDocs: [
            { name: 'Whale Pulse', route: 'docs-whale-pulse', icon: 'waves' },
            { name: 'Options Flow', route: 'docs-options-flow', icon: 'waterfall_chart' },
            { name: 'Market Regime', route: 'docs-regime', icon: 'category' },
            { name: 'Macro Compass', route: 'docs-macro-compass', icon: 'explore' },
        ],
        summary: 'Five proven on-chain valuation and behaviour metrics that have historically identified Bitcoin market cycle tops and bottoms. These are the metrics institutional analysts track when price action alone is insufficient.',
        components: [
            {
                name: 'MVRV Z-Score', type: 'CHART', icon: 'show_chart',
                description: 'Market Value to Realised Value Z-Score. Compares BTC market cap to realised cap (what all coins last moved at) and normalises to a Z-score. Green zone (Z < 0) = historically undervalued. Red zone (Z > 7) = historically overvalued (prior cycle tops: 2013=8.4, 2017=9.5, 2021=8.0).',
                howToRead: 'The Z-score is more reliable than price alone because it accounts for what holders actually paid. Below 0 = unrealised losses widespread, an accumulation opportunity. Above 6 = significant unrealised profit and distribution risk.',
                signals: [
                    'Z-Score entering green zone (<0) = institutional accumulation zone; DCA aggressively',
                    'Z-Score >6 = consider taking 25-50% profits; reduce leverage to zero',
                    'Z-Score crossing from red to green = top likely forming; prepare exit plan'
                ]
            },
            {
                name: 'SOPR (Spent Output Profit Ratio)', type: 'CHART', icon: 'trending_up',
                description: 'Measures whether coins being spent are moving at a profit or a loss. SOPR > 1 = coins spent at profit (sellers happy to sell). SOPR < 1 = coins spent at a loss (forced selling or capitulation).',
                howToRead: 'In bull markets, SOPR > 1 consistently. A brief dip below 1 followed by a bounce = healthy bull market correction, buyable. SOPR persistently below 1 = bear market capitulation in progress.',
                signals: [
                    'SOPR dipping below 1.0 then bouncing in a bull trend = buy the dip signal',
                    'SOPR stuck below 1 for >30 days = bear market confirmed; wait for sustained recovery above 1',
                    'SOPR spiking far above 1 (e.g. 1.05+) = profit-taking wave; potential local top'
                ]
            },
            {
                name: 'Puell Multiple', type: 'CHART', icon: 'currency_bitcoin',
                description: 'Daily miner issuance (in USD) divided by the 365-day moving average of daily issuance. Green zone (<0.5) = miners under-earning vs history, cheap BTC relative to miner income. Red zone (>4) = miners over-earning, historically a sell zone.',
                howToRead: 'When miners earn significantly less than their historical average, they are under less pressure to sell. When they earn much more, they have incentive to sell large quantities.',
                signals: [
                    'Puell Multiple <0.5 = deep value zone; historically outstanding entry point',
                    'Puell Multiple >4 = miners selling aggressively; supply headwind for price',
                    'Puell Multiple rising steadily = halving cycle progressing; bull market intact'
                ]
            },
            {
                name: 'NVT Ratio (Network Value to Transactions)', type: 'CHART', icon: 'receipt_long',
                description: "Bitcoin's P/E equivalent. Market cap divided by daily on-chain transaction volume. High NVT = price is high relative to actual network activity (overvalued). Low NVT = price is low relative to network usage (undervalued).",
                howToRead: 'NVT Signal (90-day smoothed) is more reliable than raw NVT. Rising NVT while price stagnates = on-chain usage falling, bearish. Falling NVT while price rises = strong organic adoption, sustainable rally.',
                signals: [
                    'NVT Signal above 150 = historically overvalued; reduce exposure',
                    'NVT Signal below 40 = deep value; long-term accumulation zone',
                    'NVT falling as price rises = bullish — utility growing faster than price'
                ]
            },
            {
                name: 'Realised Price Overlay', type: 'CHART', icon: 'price_check',
                description: 'Overlays the Realised Price (average cost basis of all BTC in existence) on the BTC price chart. When spot price is below Realised Price, the average holder is at a loss — historically a reliable capitulation zone.',
                howToRead: 'Price crossing above Realised Price from below = bull market re-entry signal (occurred early 2019, Jan 2023). Price falling below Realised Price = entering loss territory for average holders; panic selling risk rises.',
                signals: [
                    'Spot reclaiming Realised Price from below = strong buy signal; historically led to new bull runs',
                    'Spot 20%+ below Realised Price = maximum bearish sentiment; contrarian accumulation zone',
                    'Distance between Spot and Realised growing rapidly = overextended rally; plan profit-taking levels'
                ]
            }
        ]
    });
}

function renderDocsViewOptionsFlow() {
    renderViewDocPage({
        hub: 'Analytics Hub', hubIcon: 'analytics', hubColor: '#22c55e',
        title: 'Options Flow', viewId: 'options-flow',
        summary: 'Deribit options market structure analysis. Institutional options positioning reveals expected volatility, directional bias, and key price levels that large players are hedging around.',
        components: [
            {
                name: 'Put/Call Ratio Gauge', type: 'GAUGE', icon: 'donut_large',
                description: 'A gauge showing the current Put/Call OI ratio for BTC options across all Deribit expiries. Ratio > 1 = more puts outstanding than calls (bearish hedging). Ratio < 1 = more calls outstanding (bullish positioning). Green zone: 0.5-0.8. Red zone: >1.2.',
                howToRead: 'Contrarian indicator at extremes. Very high P/C ratio (>1.5) = too much bearish hedging = market often reverses up. Very low P/C ratio (<0.4) = overconfident calls = market often corrects.',
                signals: [
                    'P/C ratio >1.5 = extreme put buying; contrarian buy signal for spot',
                    'P/C ratio <0.4 = call euphoria; market may reverse',
                    'P/C ratio rising toward 1.0 from low levels = institutions hedging into a rally; be cautious'
                ]
            },
            {
                name: 'IV Smile Curve (Deribit 30D)', type: 'CHART', icon: 'show_chart',
                description: 'Implied Volatility plotted vs strike moneyness from -30% (OTM Puts) to +30% (OTM Calls). The dashed baseline shows 30-day historical volatility.',
                howToRead: 'Steeper left tail (OTM Puts high IV) = institutions buying downside protection. A right-skewed smile = call premium elevated = bullish institutional hedging.',
                signals: [
                    'Left tail IV >80% with right <65% = institutional put-buying; real fear of downside',
                    'IV Smile flatter than HV baseline = volatility compression; breakout imminent',
                    'Right tail IV exceeds left = call skew; institutions expect or are hedging for a rally'
                ]
            },
            {
                name: 'Top Open Interest Strikes Table', type: 'TABLE', icon: 'table_rows',
                description: 'Ranked table of the 10 strike prices with highest combined OI (calls + puts). Shows Strike, Call OI ($M), Put OI ($M), Net Skew, and Expiry Date. These are the price levels institutional options writers are most concentrated around.',
                howToRead: 'Large call OI at a strike = resistance target; dealers short gamma above that level will sell spot to hedge. Large put OI = support; dealers short gamma below will buy spot to hedge.',
                signals: [
                    'Large call wall 5-10% above current price = hard near-term resistance ceiling',
                    'Large put wall 5-10% below price = institutional floor being defended',
                    'Balanced call and put OI at same strike = key battleground level; direction of break is significant'
                ]
            }
        ]
    });
}

function renderDocsViewNewsroom() {
    renderViewDocPage({
        hub: 'Analytics Hub', hubIcon: 'analytics', hubColor: '#22c55e',
        title: 'Newsroom', viewId: 'newsroom',
        summary: 'Real-time crypto news with AI sentiment classification. News drives short-term price volatility. This view filters for high-impact stories and tags them for immediate relevance assessment.',
        components: [
            {
                name: 'Live News Feed', type: 'FEED', icon: 'newspaper',
                description: 'Scrollable feed of crypto news from 15+ aggregated sources. Each card shows: headline, source, timestamp, relevant ticker tags, and a Sentiment badge (BULLISH / BEARISH / NEUTRAL / REGULATORY) with AI confidence %. Cards are colour-bordered by sentiment type.',
                howToRead: 'Filter by ticker to see only news relevant to your current positions. Sort by time to catch breaking events. The AI sentiment badge reflects the likely short-term price impact, not long-term fundamentals.',
                signals: [
                    'Multiple BEARISH cards for same ticker within 1 hour = news-driven selling pressure',
                    'REGULATORY tag = unpredictable impact; reduce exposure until clarity emerges',
                    'BULLISH card from tier-1 source (Reuters, Bloomberg) = higher credibility; more likely to sustain'
                ]
            },
            {
                name: 'Keyword Sentiment Heatmap', type: 'CHART', icon: 'grid_view',
                description: 'A heatmap of keyword frequency over the past 48 hours, coloured by aggregate sentiment. Each cell = one keyword, intensity = frequency. Green cells = keywords appearing in bullish headlines. Red cells = bearish.',
                howToRead: 'Dominant red cells in ETF, SEC, or regulatory keywords = regulatory headwind story dominating. Dominant green cells around halving, adoption, ETF inflows = bullish cycle narrative prevailing.',
                signals: [
                    'ETF + BULLISH keywords dominating = institutional narrative driving; supportive for price',
                    'Regulation + BEARISH dominating = regulatory uncertainty cycle; reduce altcoin exposure',
                    'Macro keywords (Fed, CPI) appearing = macro driving crypto; cross-reference Macro Compass'
                ]
            }
        ]
    });
}

// ============= AUDIT & PERFORMANCE =============
function renderDocsViewTradeLedger() {
    renderViewDocPage({
        hub: 'Audit & Performance', hubIcon: 'trending_up', hubColor: '#60a5fa',
        title: 'Trade Ledger', viewId: 'trade-ledger',
        summary: 'A complete auditable log of all trades made using AlphaSignal recommendations. Tracks execution against signal, measures slippage, and builds a verifiable track record.',
        components: [
            {
                name: 'Trade Log Table', type: 'TABLE', icon: 'receipt_long',
                description: 'Paginated table of all recorded trades: Date, Asset, Direction, Entry, Exit, Size, Gross P&L, Net P&L (after fees), Signal Source (Z-Score / ML / Manual), and Outcome (WIN/LOSS). Filterable by date range, asset, signal source, and outcome.',
                howToRead: 'Sort by Net P&L descending to identify best trades. Sort ascending to find worst trades and identify patterns in losing setups. The Signal Source column reveals which inputs are generating actual alpha.',
                signals: [
                    'Z-Score sourced trades outperforming ML = momentum signals more effective in current regime',
                    'Manual trades consistently underperforming system signals = reduce discretionary sizing',
                    'Average slippage >0.3% = execution is costing significant alpha; improve order types'
                ]
            },
            {
                name: 'Performance Attribution Breakdown', type: 'CHART', icon: 'pie_chart',
                description: 'A stacked bar chart breaking total P&L into attribution buckets: Alpha (signal-generated edge), Beta (market direction), and Noise (random variance). Allows understanding of what is actually driving returns.',
                howToRead: 'A tall Alpha bar relative to Beta = the system is generating genuine signal-based edge rather than just riding the market. Heavy Beta exposure in a bull market is not skill — it is market exposure.',
                signals: [
                    'Alpha > Beta consistently = genuine edge; continue following the system',
                    'Beta > Alpha = returns simply from market exposure; consider just buying BTC',
                    'Noise component high = high variance strategy; reduce position sizes'
                ]
            }
        ]
    });
}

function renderDocsViewPerformance() {
    renderViewDocPage({
        hub: 'Audit & Performance', hubIcon: 'trending_up', hubColor: '#60a5fa',
        title: 'Performance Dashboard', viewId: 'audit-hub',
        relatedDocs: [
            { name: 'Trade Ledger', route: 'docs-trade-ledger', icon: 'receipt_long' },
            { name: 'Signal Archive', route: 'docs-signal-archive', icon: 'archive' },
            { name: 'Backtester V2', route: 'docs-backtester', icon: 'history' },
        ],
        summary: 'Comprehensive portfolio performance metrics in institutional reporting format. Track win rate, ROI, and equity growth across all time horizons.',
        components: [
            {
                name: 'Key Performance Stat Cards', type: 'STAT', icon: 'bar_chart',
                description: 'Four headline stats: Total ROI (%), Win Rate (%), Profit Factor, and Current Drawdown (%). Each card shows the current value and a 30-day change delta with directional arrow.',
                howToRead: 'All four metrics together paint the performance picture. High win rate with low profit factor = small wins, big losses (bad). Low win rate with high profit factor = large wins, small losses (good).',
                signals: [
                    'Win Rate >60% AND Profit Factor >1.5 = exceptional performance; scale up allocation',
                    'Drawdown increasing while Win Rate falling = system in a difficult regime; reduce sizing',
                    'All metrics improving simultaneously over 30 days = strong current regime alignment'
                ]
            },
            {
                name: 'Monthly ROI Heatmap Calendar', type: 'CHART', icon: 'calendar_month',
                description: 'Calendar heatmap of monthly portfolio returns, coloured by magnitude: dark green (>+5%), light green (+1-5%), grey (flat), orange (-5 to -1%), red (<-5%). Three years of history.',
                howToRead: 'Look for seasonal patterns and drawdown clustering. Extended red streaks reveal the worst historical regime for this approach. Green clusters show when conditions are most favourable.',
                signals: [
                    'Red month followed by 2+ green months = drawdown recovery; increase allocation as recovery confirms',
                    'Consistent specific month underperforming = seasonal risk; plan for it in advance',
                    'All recent months green = strong current regime; momentum likely to continue short term'
                ]
            },
            {
                name: 'Portfolio Equity Curve', type: 'CHART', icon: 'show_chart',
                description: 'A time-series line chart of portfolio value normalised to a $100 starting point vs BTC buy-and-hold (also $100 baseline). Drawdown periods shaded in red below the equity curve.',
                howToRead: 'When the portfolio line stays above the BTC line, the strategy is outperforming passive holding. Red shaded zones show when and how deep drawdowns occurred.',
                signals: [
                    'Portfolio consistently above BTC line = alpha being generated above market return',
                    'Portfolio below BTC during extended bull = strategy has negative alpha vs HODL',
                    'Recovery from drawdown without making new highs = structural underperformance; strategy review needed'
                ]
            }
        ]
    });
}

// ============= RISK & STRESS =============
function renderDocsViewRiskMatrix() {
    renderViewDocPage({
        hub: 'Risk & Stress', hubIcon: 'grid_on', hubColor: '#ef4444',
        title: 'Risk Matrix', viewId: 'risk-hub',
        relatedDocs: [
            { name: 'Stress Test Lab', route: 'docs-stress-lab', icon: 'warning' },
            { name: 'Liquidations', route: 'docs-liquidations', icon: 'local_fire_department' },
            { name: 'OI Radar', route: 'docs-oi-radar', icon: 'track_changes' },
        ],
        summary: 'Institutional position risk management. Calculate Value-at-Risk, volatility-adjusted position sizing, and portfolio-level correlation exposure before every trade.',
        components: [
            {
                name: 'Portfolio VaR Gauge', type: 'GAUGE', icon: 'shield',
                description: 'A 180-degree gauge displaying current 1-day 95% Value-at-Risk as a percentage of portfolio value. VaR represents the maximum expected loss on 95% of trading days. The red zone begins at 5% VaR — the institutional threshold above which positions must be reduced.',
                howToRead: 'Below 3% = conservative, well-managed risk. 3-5% = moderate, acceptable for active trading. Above 5% = excessive — reduce position sizes or add hedges immediately.',
                signals: [
                    'VaR >5% = reduce open positions by 30-50% until VaR returns to safe zone',
                    'VaR rising without opening new trades = existing positions becoming more volatile; tighten stops',
                    'VaR near 0% = overly conservative; potential to increase allocation if signals are strong'
                ]
            },
            {
                name: 'Volatility-Adjusted Position Sizer', type: 'FORM', icon: 'calculate',
                description: 'Interactive calculator: input Asset, Entry Price, Stop Loss, and Account Size. Outputs exact position size (coins + USD) using a fixed 1% account risk rule, adjusted for the asset\'s current 14-day ATR.',
                howToRead: 'The ATR adjustment means volatile assets automatically receive smaller position sizes. A stop-loss at 2x the ATR is considered statistically sound — beyond normal daily noise.',
                signals: [
                    'Suggested size <0.5% of portfolio = the stop is too wide; tighten it or skip the trade',
                    'Suggested size >5% = the stop is very tight; widen it to reduce false-stop risk',
                    'ATR adjustment halving the position = excessive volatility for this setup; wait for compression'
                ]
            },
            {
                name: 'Portfolio Correlation Scatter', type: 'CHART', icon: 'scatter_plot',
                description: 'A scatter plot of all current open positions. X-axis = individual position VaR, Y-axis = correlation to BTC. Bubble size = position size ($). Coloured by sector. Reveals whether positions are truly diversified or all correlated to the same macro risk factor.',
                howToRead: 'Ideal portfolio = positions spread across both axes. Bubbles clustered in the top-right (high VaR + high BTC correlation) = dangerously concentrated risk.',
                signals: [
                    'All positions in top-right quadrant = entire portfolio is one correlated BTC bet; diversify urgently',
                    'Positions spread evenly across quadrants = genuinely diversified institutional portfolio',
                    'High-value bubble alone in top-right = single position dominating portfolio risk; reduce it'
                ]
            }
        ]
    });
}

function renderDocsViewStressLab() {
    renderViewDocPage({
        hub: 'Risk & Stress', hubIcon: 'grid_on', hubColor: '#ef4444',
        title: 'Stress Test Lab', viewId: 'stress',
        summary: 'Simulate how your current portfolio would perform under historical extreme market scenarios. Preparation is the difference between surviving a crash and being liquidated.',
        components: [
            {
                name: 'Scenario Stress Test Table', type: 'TABLE', icon: 'warning',
                description: 'Pre-loaded historical scenarios: March 2020 COVID Crash (-50% in 2 weeks), FTX Collapse Nov 2022 (-30% in 3 days), May 2021 China Mining Ban (-50%), Luna/UST Depeg (-90% for alts). Each row shows estimated portfolio P&L ($) and % loss if that scenario repeated today.',
                howToRead: 'Find your worst scenario loss. If it exceeds your maximum acceptable drawdown, reduce position sizes now — not during the crash.',
                signals: [
                    'Any scenario showing >20% portfolio loss = current sizing too aggressive; reduce now',
                    'March 2020 scenario showing manageable loss = portfolio is robust for systemic crashes',
                    'Luna scenario shows catastrophic loss = over-concentrated in DeFi or small-cap alts'
                ]
            },
            {
                name: 'Z-Score Stress Distribution Chart', type: 'CHART', icon: 'area_chart',
                description: 'A bell curve simulation of 1,000 portfolio return scenarios based on current volatility and correlations. X-axis shows return outcomes from -50% to +50%. Vertical lines mark the 5th percentile (worst 5% of outcomes) and 95th percentile.',
                howToRead: 'The 5th percentile line is your practical worst-case scenario. If this line represents a loss you cannot financially or psychologically tolerate, reduce position sizes until it moves to an acceptable level.',
                signals: [
                    '5th percentile loss >15% = portfolio is too risky for the capital at stake',
                    'Distribution skewed left (fat left tail) = downside risk is asymmetrically higher than upside',
                    'Narrow distribution (tight bell) = portfolio risk well-contained; current sizing is appropriate'
                ]
            }
        ]
    });
}

// ============= ADVANCED CHARTING =============
function renderDocsViewChartingSuite() {
    renderViewDocPage({
        hub: 'Advanced Charting', hubIcon: 'candlestick_chart', hubColor: '#c084fc',
        title: 'Charting Suite', viewId: 'advanced-charting',
        summary: 'Five integrated chart panels for complete price and order flow analysis. All panels synchronise to the same timeframe and asset selection.',
        components: [
            {
                name: 'OHLCV Candlestick Chart', type: 'CHART', icon: 'candlestick_chart',
                description: 'Primary price chart with selectable timeframe (1m to 1W). Overlays available: 20/50/200 EMA, Bollinger Bands, VWAP, and AlphaSignal entry markers (green triangles) and exit markers (red triangles) from the signal engine.',
                howToRead: 'Read candle body and wick structure: doji = indecision, marubozu = strong conviction, hammer = reversal. VWAP acts as the institutional fair value reference — price below VWAP is cheap, above is expensive intraday.',
                signals: [
                    'Price reclaiming VWAP from below in first 30 minutes of session = institutional morning buy',
                    'Three consecutive doji candles at resistance = indecision; breakout imminent',
                    'Long lower wick rejection at key level = institutional defence; likely bounce'
                ]
            },
            {
                name: 'Volume Profile', type: 'CHART', icon: 'bar_chart',
                description: 'Horizontal volume histogram displayed on the right side of the price chart. Each horizontal bar = total volume traded at that price level. The Point of Control (POC) is the price with the highest volume — the fairest value per the market.',
                howToRead: 'High-volume nodes (thick bars) = strong support or resistance. Low-volume nodes (thin bars) = price moved through quickly — future price tends to traverse these zones rapidly.',
                signals: [
                    'Price approaching high-volume node from below = strong resistance ahead; reduce size',
                    'Low-volume node between current price and target = price likely to reach target rapidly once breakout confirms',
                    'POC rising over consecutive sessions = value area migrating upward; trend strong'
                ]
            },
            {
                name: 'Cumulative Volume Delta (CVD)', type: 'CHART', icon: 'show_chart',
                description: 'The running total of buy-initiated volume minus sell-initiated volume. A rising CVD during a price rise confirms aggressive buyers are driving the move. A falling CVD during a price rise signals passive selling into strength — a divergence and warning.',
                howToRead: 'CVD should confirm price direction. Rising price + rising CVD = genuine buying. Rising price + falling CVD = price pushed up by lack of sellers, not real demand — unsustainable.',
                signals: [
                    'Price at highs + CVD declining = bearish divergence; take profits or hedge',
                    'Price falling + CVD rising = selling exhaustion; buyers still present; potential reversal forming',
                    'CVD making new highs while price consolidates = coiled bullish spring; breakout likely'
                ]
            },
            {
                name: 'Market Depth Chart', type: 'CHART', icon: 'stacked_bar_chart',
                description: 'Real-time order book depth chart showing cumulative bid (green, left) and ask (red, right) walls up to 2% from the mid-price. Thin book = high slippage risk. Thick walls = institutional orders resting.',
                howToRead: 'Look for wall imbalances. If bids are 3x heavier than asks, price is likely to move up as there is more buy support than sell supply in the near order book.',
                signals: [
                    'Large bid wall appearing just below current price = institutional support level',
                    'Ask wall >3x larger than bid wall = distribution zone; delay buys',
                    'Sudden disappearance of a large wall = it was spoofed; do not rely on it for a level trade'
                ]
            }
        ]
    });
}

function renderDocsViewTradingViewWidget() {
    renderViewDocPage({
        hub: 'Advanced Charting', hubIcon: 'candlestick_chart', hubColor: '#c084fc',
        title: 'TradingView Widget', viewId: 'advanced-charting',
        summary: 'Full-featured professional TradingView chart embedded directly in the terminal. Access 100+ built-in indicators, drawing tools, and multi-timeframe analysis without leaving AlphaSignal.',
        components: [
            {
                name: 'TradingView Advanced Chart', type: 'WIDGET', icon: 'show_chart',
                description: 'An embedded TradingView Pro-grade chart pre-loaded with the current selected asset. Includes all built-in TradingView indicators (RSI, MACD, Ichimoku, Fibonacci), drawing tools (trend lines, channels, Fib retracements), multi-timeframe capability from 1m to 1M, and chart layout saving.',
                howToRead: 'Use this as your primary charting environment for technical analysis before acting on AlphaSignal signals. The terminal pre-loads key institutional indicators. Add your own via the Indicators menu.',
                signals: [
                    'RSI >70 at resistance = overbought; wait for pullback before entering long',
                    'MACD golden cross on daily timeframe = medium-term trend reversal signal',
                    'Price bouncing off weekly 200 EMA = most significant support level in crypto; high-conviction long zone'
                ]
            }
        ]
    });
}

// ============= ORDER FLOW (GOMM) =============
function renderDocsViewOrderFlow() {
    renderViewDocPage({
        hub: 'Order Flow (GOMM)', hubIcon: 'bar_chart', hubColor: '#00f2ff',
        title: 'Liquidity Dashboard', viewId: 'liquidity',
        summary: 'Real-time order flow analysis using the Global Order Market Microstructure (GOMM) model. Reveals where institutional liquidity is positioned, identifying high-probability trade locations.',
        components: [
            {
                name: 'Aggregated Order Book Depth', type: 'CHART', icon: 'stacked_bar_chart',
                description: 'Aggregated order book across Binance, Bybit, OKX, and Coinbase showing cumulative bid and ask depth in BTC equivalent. Updated every 250ms. X-axis shows price distance from mid (0.1% increments). Y-axis = cumulative volume.',
                howToRead: 'Steep curves on the bid side = strong support. Steep curves on the ask side = strong resistance. A cliff on either side = thin liquidity ahead — high slippage risk if price reaches that level.',
                signals: [
                    'Bid curve 3x steeper than ask = significant buy imbalance; upward price pressure building',
                    'Sudden curve flattening on bids = large bid wall lifted; support removed; risk off',
                    'Symmetric curves = balanced market; wait for an imbalance to form before trading'
                ]
            },
            {
                name: 'Execution Tape Feed', type: 'FEED', icon: 'receipt',
                description: 'Live tape of large individual market orders executing (threshold: >50 BTC / >500 ETH). Each entry shows: timestamp, asset, size, direction (BUY/SELL), exchange, and the price impact (% move caused by single order).',
                howToRead: 'Large buy orders (green) = institutional aggression. Large sell orders (red) = motivated sellers who need immediate fills. Orders causing >0.1% price impact are significant.',
                signals: [
                    '3+ large buy orders within 5 minutes from different exchanges = coordinated institutional accumulation',
                    'Large sell orders clustering at same price = algo or institutional distribution at a target level',
                    'No large trades for >30 minutes = calm before a storm; directional break likely'
                ]
            },
            {
                name: 'Institutional Liquidity Heatmap', type: 'CHART', icon: 'whatshot',
                description: 'A time x price heatmap of order book liquidity over the past 4 hours (updated every 5 minutes). Bright zones = high historical order book density at that price level = institutional interest. Dark zones = thin liquidity.',
                howToRead: 'Bright horizontal lines = price levels where institutions have consistently placed orders. These act as magnetic levels. Dark corridors = price will move rapidly through these zones.',
                signals: [
                    'Approaching a bright horizontal band = institutional orders resting; expect slowing or reversal',
                    'Dark corridor between current price and target = fast path to target; breakout trades work well here',
                    'Bright band being cleared repeatedly = liquidity absorption; strong directional move likely to follow'
                ]
            }
        ]
    });
}

// ============= ALERTS HUB =============
function renderDocsViewAlerts() {
    renderViewDocPage({
        hub: 'Alerts Hub', hubIcon: 'notifications_active', hubColor: '#f43f5e',
        title: 'Live Signal Alerts', viewId: 'alerts-hub',
        summary: 'Real-time push alerts from the AlphaSignal engine. Every alert represents a statistically significant event that has crossed your configured thresholds — designed to be actionable within minutes.',
        components: [
            {
                name: 'Alert Feed Cards', type: 'FEED', icon: 'notifications',
                description: 'Live-updating card feed of alerts. Each card shows: timestamp, alert type (Z-Score Spike / Whale Move / Regime Change / ML Signal / Funding Spike), asset ticker, severity (LOW / MEDIUM / HIGH / CRITICAL), and a one-line action summary. CRITICAL alerts pulse with a red glow.',
                howToRead: 'Focus on CRITICAL and HIGH severity alerts first. The action summary is designed to be executable without needing to open the full view. Click a card to navigate directly to the relevant view.',
                signals: [
                    'CRITICAL Z-Score alert = asset moved 2+ standard deviations; investigate immediately',
                    'CRITICAL Regime Change = market structure has shifted; all open strategies need re-evaluation',
                    'Three HIGH alerts for the same asset within 1 hour = confluent multi-signal setup; highest priority'
                ]
            },
            {
                name: 'Severity Filter Controls', type: 'WIDGET', icon: 'tune',
                description: 'Toggle buttons to filter the alert feed by severity level. Default shows all levels. Reducing noise during high-activity periods allows focus on the most impactful alerts.',
                howToRead: 'During high-volatility periods, set to CRITICAL only to avoid alert fatigue. During quiet periods, include LOW and MEDIUM to catch early setups.',
                signals: [
                    'CRITICAL filter active and feed is empty = relatively calm market; safe to hold positions',
                    'CRITICAL feed overwhelming (10+ in 1 hour) = extreme volatility event; reduce all positions and wait'
                ]
            }
        ]
    });
}

function renderDocsViewPriceAlerts() {
    renderViewDocPage({
        hub: 'Alerts Hub', hubIcon: 'notifications_active', hubColor: '#f43f5e',
        title: 'Price Alerts', viewId: 'price-alerts-hub',
        summary: 'Set custom price trigger alerts for any tracked asset. Alerts fire via in-terminal notification and (if configured) browser push notification.',
        components: [
            {
                name: 'Alert Manager Table', type: 'TABLE', icon: 'price_check',
                description: 'Table of all configured price alerts showing: Asset, Alert Price, Direction (ABOVE / BELOW), Status (ACTIVE / TRIGGERED / EXPIRED), Distance to Target (%), and Created Date. TRIGGERED alerts highlighted in green or red depending on direction.',
                howToRead: 'Sort by Distance ascending to see which alerts are closest to triggering. TRIGGERED alerts require review — decide whether to reload the alert or the thesis has been confirmed.',
                signals: [
                    'Alert triggered during off-hours = missed opportunity or overnight move; review on open',
                    'Alert triggered multiple times at same price = the level is being tested repeatedly; significant technical level',
                    'All alerts clustering at same price zone = consensus technical level across multiple analysis sessions'
                ]
            },
            {
                name: 'Alert Creation Form', type: 'FORM', icon: 'add_alert',
                description: 'Dropdown to select asset, input fields for target price and direction (above/below), optional note field for the thesis, and a toggle for browser push notification. Submitted alerts appear immediately in the manager table.',
                howToRead: 'Always add a note describing WHY the alert exists. This prevents confusion when the alert triggers and the original thesis has been forgotten.',
                signals: [
                    'Best practice: set alerts at key technical levels identified in the Charting Suite before price reaches them',
                    'Pair every LONG entry alert with a corresponding STOP alert below the position'
                ]
            }
        ]
    });
}

function renderDocsViewSignalLeaderboard() {
    renderViewDocPage({
        hub: 'Alerts Hub', hubIcon: 'notifications_active', hubColor: '#f43f5e',
        title: 'Signal Leaderboard', viewId: 'leaderboard-hub',
        summary: 'A ranked leaderboard of the best-performing signals over selectable time horizons. Identifies which signal types, assets, and strategies have generated the most alpha.',
        components: [
            {
                name: 'Signal Performance Leaderboard', type: 'TABLE', icon: 'leaderboard',
                description: 'A ranked table of all signals sorted by ROI over the selected period (7D / 30D / 90D / All-Time). Each row shows: Rank, Signal, Asset, Direction, Return (%), Win/Total, Win Rate %, and Average Holding Period.',
                howToRead: 'Sort by 30D to see what is working in the current regime. Sort by All-Time for enduring strategies. A signal ranked high short-term but low all-time = regime-specific, not universal.',
                signals: [
                    'Signal consistently top-3 across 7D, 30D, and 90D = all-weather strategy; allocate heavily',
                    'Signal top on 7D but absent from 90D = recent streak, may not persist; trade smaller',
                    'Win rate >70% with >10 trades = statistically significant; this is real edge'
                ]
            }
        ]
    });
}

function renderDocsViewMarketBrief() {
    renderViewDocPage({
        hub: 'Alerts Hub', hubIcon: 'notifications_active', hubColor: '#f43f5e',
        title: 'Market Brief', viewId: 'market-brief-hub',
        summary: 'An AI-generated daily structured market brief synthesising all terminal data into a concise morning read. Updated at 06:00 UTC every day.',
        components: [
            {
                name: 'Daily AI Market Brief', type: 'AI', icon: 'summarize',
                description: 'A structured five-section brief generated by GPT-4o with live terminal data injected as context: (1) Overnight Summary — key price moves and volumes; (2) Signal Environment — Z-score distribution and top signals; (3) Macro Watch — upcoming events and correlation status; (4) Risk Signals — liquidation concentration and OI build-up; (5) Actionable Ideas — the top 2-3 setups for the day.',
                howToRead: 'The Actionable Ideas section is the highest-value content. Read in order from top to bottom. The Overnight Summary provides context; the Actionable Ideas is where to spend your trading attention.',
                signals: [
                    'Actionable Ideas section empty = model has no high-conviction setup; best day to observe, not trade',
                    'Actionable Ideas aligned with Signal Cards in the Alpha Strategy hub = strong confluent signal',
                    'Risk Signals section unusually long = model detecting widespread instability; reduce all position sizes'
                ]
            }
        ]
    });
}

// ============= PERSONAL =============
function renderDocsViewMyTerminal() {
    renderViewDocPage({
        hub: 'Personal', hubIcon: 'person', hubColor: '#34d399',
        title: 'My Terminal', viewId: 'my-terminal',
        summary: 'Your personalised terminal dashboard. Track watchlist performance, manage notification preferences, and access account settings from a centralised personal hub.',
        components: [
            {
                name: 'Watchlist Table with Live P&L', type: 'TABLE', icon: 'bookmark_add',
                description: 'Your saved assets displayed as a live table: Ticker, Added Price, Current Price, P&L ($), P&L (%), 24h Change %, and AlphaSignal Grade. Updates every 30 seconds. Colour-coded: green rows = profitable positions, red rows = underwater.',
                howToRead: 'Sort by P&L % to see biggest winners and losers at a glance. The Grade column shows whether the signal engine still rates the asset favourably relative to when you added it.',
                signals: [
                    'Grade dropping from A to C while P&L positive = take profits; system losing conviction',
                    'Grade improving to A while P&L negative = model sees recovery; averaging down may be appropriate',
                    'All watchlist positions negative with grades declining = broad market weakness; review overall exposure'
                ]
            },
            {
                name: 'Notification Preference Controls', type: 'WIDGET', icon: 'notifications_none',
                description: 'Toggle panel controlling which alert types generate in-terminal notifications and which generate browser push notifications. Categories: Z-Score Spikes, Regime Changes, Whale Moves, Price Alerts, Market Brief.',
                howToRead: 'Enable browser push for CRITICAL-only alerts to avoid notification fatigue. Keep all in-terminal notifications enabled so nothing is missed when the terminal is open.',
                signals: [
                    'Disabling Regime Change push notifications = high risk; regime shifts are the most impactful events',
                    'Best practice: enable push for Z-Score >2.0 and Regime Change only; check terminal manually for others'
                ]
            }
        ]
    });
}

function renderDocsViewAskTerminal() {
    renderViewDocPage({
        hub: 'Personal', hubIcon: 'person', hubColor: '#34d399',
        title: 'Ask Terminal', viewId: 'ask-terminal',
        summary: 'A conversational AI interface powered by GPT-4o with full AlphaSignal context injected. Ask any question about current market conditions, specific assets, or how to use terminal features.',
        components: [
            {
                name: 'AI Chat Interface', type: 'AI', icon: 'smart_toy',
                description: 'A full-turn conversational chat powered by GPT-4o. The model receives a live context injection of the current regime, top signals, fear/greed index, and your watchlist before every message. Conversation history is maintained for the session.',
                howToRead: 'Ask specific, data-referencing questions for best results. "What does the current Z-score environment mean for BTC?" will produce better answers than "Is BTC going up?"',
                signals: [
                    'Ask for a counter-argument to any trade idea to stress-test it before committing',
                    'Ask to explain any chart or metric directly by name — the AI has full terminal documentation context',
                    'Ask for a pre-trade checklist for a specific setup to ensure all risk parameters are verified'
                ]
            },
            {
                name: 'Suggested Query Chips', type: 'WIDGET', icon: 'lightbulb',
                description: 'A row of pre-written query chips that update dynamically based on current market conditions. If the system detects an extreme Z-score, a chip appears asking about it. If a regime change occurs, a chip suggests explaining the shift.',
                howToRead: 'Chips represent the most contextually relevant questions right now. They are generated by the same AI that powers the market memo. Click a chip to instantly send that query.',
                signals: [
                    'Multiple chips appearing simultaneously = an unusual market event is occurring; click through all of them',
                    'Chip suggesting "Explain the current liquidation cascade" = significant liquidation event detected'
                ]
            }
        ]
    });
}

function renderDocsViewCommandCenter() {
    renderViewDocPage({
        hub: 'Personal', hubIcon: 'person', hubColor: '#34d399',
        title: 'Command Center', viewId: 'command-center',
        summary: 'The home screen of the AlphaSignal Terminal. A high-density command dashboard giving an instant read of all critical system metrics in a single view — market regime, conviction dials, live ETF flows, BTC macro correlations, signal confidence, and hub quick-access.',
        components: [
            {
                name: 'Fear & Greed Gauge', type: 'GAUGE', icon: 'speed',
                description: 'A live semi-circle doughnut gauge showing the current BTC Fear & Greed score (0–100). Computed in real-time from BTC price deviation vs SMA-50 and 30-day annualised volatility. Color shifts from red (Extreme Fear) through yellow (Neutral) to green (Extreme Greed).',
                howToRead: 'Scores above 75 = Extreme Greed — historically a reversal warning zone. Scores below 25 = Extreme Fear — historically a high-probability accumulation zone.',
                signals: [
                    'Score crossing 75 from below = sentiment overheat; consider reducing exposure',
                    'Score crossing 25 from above = capitulation zone; historically strong risk/reward for entries',
                    'Score pinned between 40–60 for 5+ days = consolidation regime; wait for directional break'
                ]
            },
            {
                name: '7D ETF Net Flows', type: 'CHART', icon: 'bar_chart',
                description: 'Stacked bar chart showing 10 trading days of estimated institutional ETF inflows/outflows for IBIT (BlackRock), FBTC (Fidelity), ARKB (ARK), and BITB (Bitwise) sourced live from yfinance. A cumulative net flow line overlays on the right axis. Click to expand into a full-width zoom modal.',
                howToRead: 'Consecutive positive stacked bars with rising cumulative line = sustained institutional accumulation. LIVE badge = real price data. MODELLED badge = seeded fallback (market closed or yfinance timeout).',
                signals: [
                    'All four ETFs positive on the same day = coordinated institutional accumulation',
                    'IBIT positive while others negative = BlackRock-only demand; institutional-grade signal',
                    'Cumulative line turning down after sustained uptrend = distribution beginning'
                ]
            },
            {
                name: 'Volatility Regime', type: 'WIDGET', icon: 'area_chart',
                description: 'Live regime classification from BTC SMA analysis. Returns TRENDING, VOLATILE, ACCUMULATION, DISTRIBUTION, or RANGING. Three pill badges show confidence %, trend (BULLISH/BEARISH), and volatility (LOW/MEDIUM/HIGH).',
                howToRead: 'TRENDING + BULLISH + LOW volatility = ideal momentum environment. VOLATILE = widen stops. DISTRIBUTION + HIGH volatility = risk-off.',
                signals: [
                    'TRENDING to DISTRIBUTION shift = macro reversal; de-risk',
                    'ACCUMULATION + LOW volatility = coiled spring; breakout incoming',
                    'VOLATILE + BEARISH = worst environment; wait for re-classification'
                ]
            },
            {
                name: 'Market Pulse — BTC Macro Correlations', type: 'WIDGET', icon: 'pulse_alert',
                description: 'Four live BTC correlations over 35 days: BTC/DXY (dollar), BTC/SPX (US equities), BTC/ETH (dominance), BTC/10Y (yield sensitivity). Each row shows a fill bar, RISK-ON/OFF/DECOUPLED badge, and signed Pearson coefficient. A LEAD-LAG strip shows whether BTC or alts are outperforming.',
                howToRead: 'BTC/SPX > +0.6 = equities driving crypto. BTC/ETH dropping toward 0.6 = alt season rotation. BTC/10Y positive = rising yields pressuring crypto.',
                signals: [
                    'BTC/ETH drops from 0.9 to below 0.6 = alt season rotation; shift to altcoins',
                    'BTC/SPX near zero while BTC rallies = BTC finding own narrative; strongest bull signal',
                    'ALTS OUTPERFORMING in lead-lag + BTC/ETH falling = confirmed alt season'
                ]
            },
            {
                name: 'Alpha vs Z-Score Scatter', type: 'CHART', icon: 'scatter_plot',
                description: 'All tracked assets plotted by Relative Alpha % (Y) vs Z-Score momentum (X). Four quadrants: top-right (green) = high conviction; top-left (cyan) = hidden gems; bottom-right (red) = overextended; bottom-left = avoid. Click to expand.',
                howToRead: 'Focus on top-right quadrant for best risk-adjusted setups. Empty top-right = no current high-conviction opportunities; wait.',
                signals: [
                    'Multiple assets in top-right = broad high-conviction environment; scale up',
                    'Top-right empty = no setups; reduce exposure',
                    'Single bubble top-right = concentrated opportunity; go deep'
                ]
            },
            {
                name: 'Macro Correlation Matrix', type: 'CHART', icon: 'grid_on',
                description: 'Pairwise Pearson heatmap for BTC, ETH, SOL, BNB, XRP, ADA, AVAX, LINK, 10Y, and SPX. Cyan = positive correlation, red = negative. Opacity = strength. Click to expand into a full labelled grid.',
                howToRead: 'All-cyan crypto block = beta market, assets moving together. SPX/10Y rows turning red vs crypto = macro decoupling — bullish.',
                signals: [
                    'All crypto correlations above 0.7 = BTC dominance trade; alts suppressed',
                    'SPX row going negative vs BTC = BTC decoupling from equities; bullish',
                    '10Y row going negative = rate cuts priced in; bullish macro backdrop'
                ]
            },
            {
                name: 'Signal Confidence Radar', type: 'CHART', icon: 'radar',
                description: 'A 6-axis radar chart scoring selected assets across Momentum, Sentiment, Volatility, Trend, Liquidity, and Network (0–100 each). Use the ticker dropdown (BTC / ETH / SOL / LINK / ADA) to switch assets. Click the card to expand into a full-size modal with enhanced labels and tooltips.',
                howToRead: 'Wide, evenly-filled polygon = balanced high-confidence signal. Single axis spike = one-dimensional — less reliable. Sentiment + Momentum both above 70 = narrative-aligned momentum; highest probability setup.',
                signals: [
                    'All 6 dimensions above 70 = highest conviction setup; rare',
                    'Momentum high + Sentiment low = price leading narrative; watch for confirmation or reversal',
                    'Network high + Trend low = on-chain accumulation without price confirmation; delayed breakout watch'
                ]
            },
            {
                name: 'CME Magnet Gaps', type: 'WIDGET', icon: 'candlestick_chart',
                description: 'Compact list of unfilled CME Bitcoin futures price gaps formed when spot crypto trades over weekends while futures markets are closed. UNFILLED = gap fully open. PARTIAL = price has partially entered the gap.',
                howToRead: 'CME gaps above price = upside magnets. Gaps below = downside targets. Partial gaps are higher-probability next targets as price has already visited once.',
                signals: [
                    'Multiple unfilled gaps above price = bullish bias for gap-fill trades',
                    'Gap immediately below + declining momentum = gap-fill pullback likely',
                    'All gaps filled = neutral; next gap forms at next weekend open'
                ]
            },
            {
                name: 'BTC Price Sparkline', type: 'CHART', icon: 'show_chart',
                description: 'Minimalist 24-hour BTC price sparkline in the header bar. Shows current price, 24h change %, and volatility regime badge. Polls every 5 minutes from the live Binance WebSocket feed.',
                howToRead: 'Falling sparkline while signals bullish = divergence — investigate. Flat sparkline + CRITICAL alerts = on-chain event not yet in price.',
                signals: [
                    'Sharp spike = significant 24h event; check Alert Feed',
                    'Flat line + multiple alerts = on-chain driven, not price-driven'
                ]
            }
        ]
    });
}

// ============= ANALYTICS HUB — TRADINGVIEW HUB =============
function renderDocsViewTradingViewHub() {
    renderViewDocPage({
        hub: 'Analytics Hub', hubIcon: 'analytics', hubColor: '#22c55e',
        title: 'TradingView Hub', viewId: 'tradingview-hub',
        relatedDocs: [
            { name: 'On-Chain Analytics', route: 'docs-onchain', icon: 'link' },
            { name: 'Custom Charts', route: 'docs-custom-charts', icon: 'bar_chart' },
            { name: 'Charting Suite', route: 'docs-charting-suite', icon: 'candlestick_chart' },
        ],
        summary: 'A dedicated hub of 13 TradingView-powered market intelligence widgets covering global crypto, equity sector, forex, and macro market data. All widgets are live, interactive, and powered by TradingView\'s public embed API — no account required.',
        components: [
            {
                name: 'Global Market Overview', type: 'WIDGET', icon: 'public',
                description: 'Multi-tabbed TradingView Market Overview widget showing live price, change %, and sparklines for assets across three tabs: Crypto (BTC, ETH, SOL, BNB, XRP, ADA), Indices (S&P 500, Nasdaq, Dow, Nikkei), and Commodities (Gold, Silver, Crude Oil, DXY). Each row is clickable to open a TradingView chart for that symbol.',
                howToRead: 'Switch tabs to compare different asset classes. Red = negative 24h change, green = positive. Use the Indices and Commodities tabs to gauge macro risk-on/risk-off environment.',
                signals: ['Indices red + Crypto green = crypto decorrelating, internal demand driving', 'All tabs red = broad risk-off; reduce leverage', 'Gold green + Nasdaq red = flight to safety; bearish for BTC short-term']
            },
            {
                name: 'BTC · ETH · SOL Symbol Comparison', type: 'WIDGET', icon: 'compare_arrows',
                description: 'Normalized area chart comparing 12-month price performance for BTC, ETH, and SOL on the same axis (base = 0%). Shows relative outperformance and underperformance cycles across the L1 triad.',
                howToRead: 'The divergence between lines reveals rotational opportunities. When ETH and SOL significantly lag BTC, an ETH/BTC or SOL/BTC long is a common rotation trade.',
                signals: ['SOL diverging upward from BTC = altcoin season starting in L1 assets', 'All three lines converging downward = broad deleveraging; no safe haven in crypto', 'BTC dominant for >60 days while others flat = BTC accumulation cycle']
            },
            {
                name: 'Technical Analysis Gauges (BTC / ETH / SOL / BNB)', type: 'WIDGET', icon: 'speed',
                description: 'Four TradingView Technical Analysis summary gauges — one per asset (BTC, ETH, SOL, BNB). Each gauge aggregates 26 built-in indicators (RSI, MACD, Stochastic, CCI, ADX, and more) across all selected timeframes into one directional verdict: STRONG BUY, BUY, NEUTRAL, SELL, or STRONG SELL.',
                howToRead: 'The gauge needle sweeps from deep red (STRONG SELL) through grey (NEUTRAL) to deep green (STRONG BUY). Click any timeframe tab (1D, 1W, 1M) to change the underlying aggregation window.',
                signals: ['All 4 gauges on STRONG BUY = rare broad momentum; significant upside probable', 'BTC NEUTRAL + ETH/SOL STRONG BUY = altcoin rotation in progress', 'All 4 gauges SELL = systematic weakness; avoid longs']
            },
            {
                name: 'Crypto Market Screener', type: 'WIDGET', icon: 'manage_search',
                description: 'Full TradingView crypto screener table covering hundreds of assets with live data columns: Price, 24h Change %, Volume, Market Cap, RSI (14), Relative Volume, and EMA alignment. Sortable by any column. Click any row to open a TradingView chart.',
                howToRead: 'Sort by 24h Change descending to find today\'s top movers. Sort by RSI to find oversold (<30) or overbought (>70) assets. Filter by Market Cap to focus on large-cap or small-cap opportunities.',
                signals: ['Multiple large-caps appearing in oversold RSI screener = broad capitulation, recovery likely', 'Small-cap volume spike without news = whale accumulation or pump setup', 'Most assets showing green % but BTC red = late-stage altcoin rally; BTC catch-up likely']
            },
            {
                name: 'Economic Calendar', type: 'WIDGET', icon: 'calendar_month',
                description: 'TradingView\'s live Economic Calendar showing all scheduled macro events with impact rating (high/medium/low), previous reading, consensus estimate, and actual result once released. Filtered to US, EU, UK, Japan, and China events.',
                howToRead: 'High-impact events (red) cause the most BTC volatility. The "Actual vs Forecast" comparison at release time is what drives price moves — not the absolute value.',
                signals: ['Multiple high-impact events in one week = reduce leverage heading in', 'CPI Actual < Forecast = dovish surprise; bullish for BTC and risk assets', 'NFP miss = growth concerns; risk-off short-term']
            },
            {
                name: 'Market Hotlists', type: 'WIDGET', icon: 'local_fire_department',
                description: 'Three TradingView Hotlist panels showing real-time: Top Gainers (biggest % price increase), Top Losers (biggest % price decline), and Most Active Volume (highest trading volume). All on the same widget with tab switching. Each row shows a price sparkline of recent performance.',
                howToRead: 'Top Gainers reveals what the market is chasing today. Most Active Volume shows where liquidity is concentrated — high volume = tighter spreads and more reliable signals.',
                signals: ['Same asset appearing in both Gainers and High Volume = strong confirmed move', 'Losers dominated by large-caps = broad market weakness', 'Low-cap coin in Gainers with no news = potential pump; do not chase']
            },
            {
                name: 'Crypto Coins Heatmap', type: 'WIDGET', icon: 'grid_view',
                description: 'Treemap visualization of the crypto market where each cell = one asset. Cell size = market cap. Cell colour = 24h price change (dark green = strong positive, dark red = strong negative). Zoomable — click a sector to drill into constituent assets.',
                howToRead: 'The overall colour of the heatmap gives an instant visual read on market breadth. Mostly green = broad rally. Large red BTC cell pulling everything down = systematic sell, not just altcoin weakness.',
                signals: ['BTC green + most alts red = BTC dominance rising, risk-off for alts', 'Small-caps uniformly green while large-caps red = altcoin season early rotation', 'Dark green across the entire map = euphoria; historically precedes correction']
            },
            {
                name: 'Forex Cross Rates Matrix', type: 'WIDGET', icon: 'currency_exchange',
                description: 'Live cross-rate comparison table between EUR, USD, JPY, GBP, CHF, AUD, CAD, BTC, and ETH. Each cell shows the relative price of the row currency in terms of the column currency, colour-coded by 24h change.',
                howToRead: 'Focus on the BTC and ETH rows. When BTC/USD is rising while BTC/EUR is flat, the USD is weakening — adding macro tailwind. If BTC is rising against all currencies simultaneously, it\'s genuine internal demand.',
                signals: ['BTC outperforming all fiat pairs = genuine bullish, not just dollar-weakness narrative', 'JPY strengthening against USD = carry trade unwinding; risk-off event likely', 'AUD/USD rising = commodity demand up; positive environment for risk assets']
            },
            {
                name: 'Forex Heat Map', type: 'WIDGET', icon: 'whatshot',
                description: 'Currency strength visualizer showing EUR, USD, JPY, GBP, CHF, AUD, CAD, and NZD on a colour grid. Each cell shows percentage change vs every other currency. Strongest currency = darkest green column. Weakest = darkest red.',
                howToRead: 'Find the strongest and weakest currencies quickly. A very strong USD (deep green USD column) is historically negative for BTC. A weak USD environment provides a crypto tailwind.',
                signals: ['USD column all green = risk-off USD strength; headwind for BTC', 'CHF and JPY strong simultaneously = traditional safe-havens bid; global risk aversion', 'AUD dominant = commodity cycle positive; typically good for risk assets including crypto']
            },
            {
                name: 'S&P 500 Sector Heatmap', type: 'WIDGET', icon: 'grid_on',
                description: 'Treemap of the S&P 500 broken down by sector (Technology, Financials, Energy, Healthcare, Consumer Discretionary, etc.). Cell size = sector weight in the index. Colour = sector performance. Zoomable to individual stocks within each sector.',
                howToRead: 'Technology sector performance is most correlated with crypto risk sentiment. If Tech is green, crypto typically follows. Energy green + Financials red = rotation from growth to value; risk-off for crypto.',
                signals: ['Technology dark green = growth narrative strong; positive for BTC and high-beta alts', 'Defensive sectors (Utilities, Staples) outperforming = institutional risk-off rotation', 'Broad red across all sectors = systemic equity sell; crypto will feel the same pressure']
            },
        ]
    });
}

// ============= PERSONAL — DAILY WORKFLOW PLAYBOOK =============
function renderDocsViewDailyWorkflow() {
    renderViewDocPage({
        hub: 'Personal', hubIcon: 'person', hubColor: '#34d399',
        title: 'Daily Workflow Playbook',
        viewId: 'command-center',
        relatedDocs: [
            { name: 'Command Center',   route: 'docs-command-center',   icon: 'dashboard'      },
            { name: 'Signal Intelligence', route: 'docs-signals',       icon: 'radar'          },
            { name: 'Market Regime',    route: 'docs-regime',           icon: 'category'       },
            { name: 'Charting Suite',   route: 'docs-charting-suite',   icon: 'candlestick_chart' },
        ],
        summary: 'A structured 20-minute daily session guide describing how to use the AlphaSignal Terminal from open to close — covering regime context, signal review, macro confirmation, trade entry, and end-of-day performance audit. Follow this sequence to ensure every trade decision is grounded in multi-factor confluence before execution.',
        components: [
            {
                name: 'Phase 1 — Morning Brief (5 min)', type: 'WIDGET', icon: 'wb_sunny',
                description: 'Open the <span onclick="switchView(\'command-center\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Command Center</span> first. The three critical reads on open are the <span onclick="switchView(\'command-center\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Fear &amp; Greed gauge</span> (market risk posture), the <span onclick="switchView(\'macro-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Macro Regime Radar</span> (is the underlying regime still intact from yesterday?), and the <span onclick="switchView(\'macro-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Sector Treemap</span> (where is capital flowing right now?). These three together establish the day\'s strategic context before a single signal is evaluated. Fear &amp; Greed below 30 combined with a Liquidity-positive regime is historically a strong accumulation environment — in this configuration, signals are weighted more aggressively. Fear &amp; Greed above 75 combined with HIGH-VOL expansion demands tighter stops and smaller sizes regardless of signal quality.',
                howToRead: 'Read left to right: Regime first (strategic context), Fear/Greed second (sentiment overlay), Sector Treemap third (capital flow direction). All three together tell you whether today is an offensive or defensive day.',
                signals: [
                    'Fear &amp; Greed < 25 + Regime LIQUIDITY POSITIVE = aggressive accumulation environment',
                    'Fear &amp; Greed > 75 + HIGH-VOL EXPANSION = reduce all position sizes before reviewing signals',
                    'Sector Treemap: L1s green while DeFi red = institutional base-layer accumulation, early bull stage',
                    'All sectors red + regime DISTRIBUTION = cash is the correct position for the day'
                ]
            },
            {
                name: 'Phase 2 — Signal Review (10 min)', type: 'CHART', icon: 'radar',
                description: 'Navigate to <span onclick="switchView(\'signals\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Signal Hub</span>. Work through four screens in order: (1) <span onclick="switchView(\'signals\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Live Signals</span> — scan the Z-Score bell curve, target signals with Z &gt; 2.5 that are not tail outliers. Check the Firing Density histogram — a spike after a quiet period signals a breakout catalyst. (2) <span onclick="switchView(\'alpha-score\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Alpha Score</span> — sort descending, the top 5 assets above score 75 become today\'s watchlist. Cross-reference each against the <span onclick="switchView(\'signals\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Signal Confidence Radar</span> to confirm multi-factor support rather than a single-indicator pop. (3) <span onclick="switchView(\'strategy-lab\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Strategy Lab</span> — for any high-score asset, pull up the Guppy EMA ribbon. Short EMAs compressing above long EMAs signals tension before a breakout. (4) <span onclick="switchView(\'signal-archive\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Signal Archive</span> — filter ML_LONG + HIGH severity in the last 24h for the machine\'s highest-conviction calls of the session.',
                howToRead: 'The sequence matters: Bell curve (market breadth) → Alpha Score (opportunity ranking) → Strategy Lab (entry timing) → Archive (ML confirmation). Do not jump to the Archive first — context from the previous steps prevents acting on isolated signals.',
                signals: [
                    'Z > 2.5 + Positive Alpha % = extreme bullish outlier, primary long candidate',
                    'Alpha Score > 75 + ML_LONG in archive + HIGH severity = full-conviction setup',
                    'Guppy: short EMAs above long EMAs, compressing = breakout imminent, time the entry',
                    'Firing Density spike after 2-week grey plateau = market waking up, all signals more reliable'
                ]
            },
            {
                name: 'Phase 3 — Macro Context (5 min)', type: 'TABLE', icon: 'monitoring',
                description: 'Navigate to <span onclick="switchView(\'macro-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Macro Intel</span> then <span onclick="switchView(\'institutional-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Institutional</span>. The <span onclick="switchView(\'macro-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Macro Calendar</span> is checked first — FOMC, CPI, and NFP events within 48 hours require position sizes to be halved regardless of signal quality, as scheduled macro volatility is not alpha. The <span onclick="switchView(\'macro-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Yield Curve chart</span> confirms whether the bond market is pricing in stress that has not yet appeared in crypto price action. A deepening 2Y/10Y inversion indicates institutional risk-off that will eventually reach crypto. Finally, <span onclick="switchView(\'institutional-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Institutional &rarr; Capital Flows</span> reveals whether ETF net flow this week is positive or negative — institutional accumulation is the most reliable confirming signal for any bullish setup identified in Phase 2.',
                howToRead: 'This phase is a filter, not a generator. It either confirms or veto-es setups from Phase 2. A perfect Phase 2 signal that collides with a FOMC event in 24h gets halved in size. A perfect Phase 2 signal with positive ETF flows and a normal yield curve gets full allocation.',
                signals: [
                    'FOMC within 48h = halve all position sizes; close leveraged trades before the event',
                    'CPI below consensus = dovish surprise; accelerate entry on any high-conviction Phase 2 setup',
                    'Yield 2Y/10Y deepening inversion = risk-off pressure building; favour stable assets over altcoins',
                    'ETF net flow positive 3+ consecutive days = institutional accumulation confirmed; weight signals bullish'
                ]
            },
            {
                name: 'Phase 4 — Trade Decision (5 min)', type: 'CHART', icon: 'candlestick_chart',
                description: 'For each shortlisted asset from Phase 2 that passed the Phase 3 filter, open <span onclick="switchView(\'advanced-charting\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Advanced Charting &rarr; TradingView</span> to set the exact entry level. Then cross-reference two order-flow confirmations: (1) <span onclick="switchView(\'advanced-charting\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Market Depth 3D</span> — if the bid wall is 3&times; the ask wall near current price, that represents real institutional support. Do not enter if asks dominate. (2) <span onclick="switchView(\'liquidity\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Order Flow &rarr; Whale Pulse</span> — any large wallet accumulation in the last 6 hours confirms or contradicts the thesis. Contradicting whale data (selling into the Signal) is a veto. The final check is the <span onclick="switchView(\'liquidity\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Tape Imbalance</span> rolling indicator — positive and rising rolling imbalance with buy pressure absorbing sells is the entry trigger. All four must align before committing capital.',
                howToRead: 'Think of this phase as a traffic-light check: TradingView sets the price level (WHERE to enter), Market Depth confirms liquidity support (IS the level defended?), Whale Pulse confirms smart money direction (WHO is on the right side?), Tape Imbalance confirms execution timing (WHEN to pull the trigger).',
                signals: [
                    'Bid wall 3x ask wall near entry price = institutional support level, execute',
                    'Whale Pulse: large accumulation in 6h matching signal direction = smart money aligned, add conviction',
                    'Tape Imbalance rising and positive = buy pressure absorbing sellers, immediate entry signal',
                    'Whale Pulse selling into a bullish signal = veto the trade; smart money disagrees'
                ]
            },
            {
                name: 'Phase 5 — End of Day (5 min)', type: 'STAT', icon: 'bar_chart',
                description: 'Navigate to <span onclick="switchView(\'audit-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Audit &amp; Performance</span>. The <span onclick="switchView(\'audit-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Performance Dashboard</span> shows whether today\'s signals generated alpha — check the equity curve and rolling Sharpe. Once per week (not daily), navigate to <span onclick="switchView(\'institutional-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Institutional &rarr; AI Rebalancer</span> and run a full rebalance plan. Accept EXECUTE &rarr; TRADE LEDGER tickets only for ADD actions with an ML score above 80% — lower-confidence additions are deferred until the next weekly rebalance. Finally, check the <span onclick="switchView(\'risk-hub\')" style="color:#34d399;cursor:pointer;text-decoration:underline;font-weight:700">Risk Matrix</span> — any position that now carries a high composite risk score due to the day\'s volatility should have its stop tightened or size reduced before close. The goal of this phase is not to make decisions but to measure and maintain discipline.',
                howToRead: 'The audit phase is about honesty: did the system work today, and did you follow it? Compare the equity curve against BTC buy-and-hold. If you are underperforming after following the system, the regime may be misaligned — reduce sizes. If you are outperforming, increase systematic adherence and reduce discretionary overrides.',
                signals: [
                    'Rolling Sharpe declining over 5 sessions = current regime misaligning with strategy; reduce sizing until it recovers',
                    'AI Rebalancer: ADD action with ML Score > 80% = execute ticket and log to Trade Ledger',
                    'Risk Matrix: position VaR > 5% after a volatile day = tighten stop or reduce size before close',
                    'Equity curve making new all-time high = system in strong regime; highest-conviction period to follow signals'
                ]
            }
        ]
    });
}
// ============= ANALYTICS HUB — CUSTOM CHARTS =============
function renderDocsViewCustomCharts() {
    renderViewDocPage({
        hub: 'Analytics Hub', hubIcon: 'analytics', hubColor: '#22c55e',
        title: 'Custom Charts', viewId: 'custom-analytics',
        relatedDocs: [
            { name: 'On-Chain Analytics', route: 'docs-onchain', icon: 'link' },
            { name: 'TradingView Hub', route: 'docs-tradingview-hub', icon: 'show_chart' },
            { name: 'OI Radar', route: 'docs-oi-radar', icon: 'track_changes' },
        ],
        summary: 'Four proprietary charts built on AlphaSignal\'s own backend data using LightweightCharts. Unlike the TradingView Hub, these charts use real data from our API — BTC dominance via proxy market cap calculation, live Binance FAPI funding rates, on-chain metrics (MVRV, SOPR), and price-derived rolling volatility. Each card is click-to-expand into a full-screen modal.',
        components: [
            {
                name: 'BTC Dominance', type: 'CHART', icon: 'currency_bitcoin',
                description: 'Area chart showing Bitcoin\'s share of a three-asset proxy market cap (BTC, ETH, SOL) over 60 days. BTC displayed as an orange area fill, ETH as a blue line, Alts (SOL proxy) as a grey line. Data sourced from the /api/dominance endpoint using yfinance price data multiplied by approximate circulating supply.',
                howToRead: 'The BTC area fill rising = Bitcoin increasing its share of the crypto market. Falling BTC dominance = capital flowing into altcoins. Watch for the grey Alts line surging while BTC falls — this signals altcoin season.',
                signals: ['BTC dominance rising above 60% = risk-off; institutional capital rotating into BTC only', 'Dominance falling while price rising = broad altcoin rally kicking in', 'ETH line crossing above historical average = ETH outperformance cycle; ETH/BTC long', 'All three converging = correlation spike; macro event likely driving all assets together']
            },
            {
                name: 'Funding Rate Bar Chart', type: 'CHART', icon: 'percent',
                description: 'Horizontal bar chart showing the current 8-hour perpetual funding rate for 8 assets: BTC, ETH, SOL, LINK, ADA, BNB, XRP, and DOGE. Bars are colour-coded: green = positive rate (longs paying shorts), red = negative rate (shorts paying longs). Each bar shows the absolute rate and the annualised equivalent. Data sourced live from Binance FAPI premiumIndex endpoint.',
                howToRead: 'Longer green bars = market is heavily long on that asset — longs are paying a premium to hold positions. This is a crowded trade risk signal. Short red bars mean shorts are dominant — potential squeeze setup.',
                signals: ['BTC funding > 0.05% (8h) = extremely crowded long; correction risk elevated', 'Negative funding across multiple assets = mass short positioning; potential squeeze setup', 'BTC positive while alts negative = divergence; alts at risk of being dragged down if BTC corrects', 'All bars near zero = balanced positioning; breakout more sustainable when it comes']
            },
            {
                name: 'MVRV / SOPR Overlay', type: 'CHART', icon: 'stacked_line_chart',
                description: 'Dual line chart with MVRV Z-Score (red) and SOPR (green) both normalized to 0–1 on the same axis using min-max scaling. This removes the different absolute scales of each metric and allows direct visual comparison of their cycle positioning. Data sourced from the /api/onchain endpoint.',
                howToRead: 'When both lines converge near 0: market is at historical lows — classic accumulation zone. When both lines converge near 1: market is at historical highs — distribution zone. Divergence between the two (one high, one low) marks transitional periods.',
                signals: ['Both near 0 simultaneously = extremely strong buy signal; highest historical confidence', 'MVRV near 1 while SOPR still rising = MVRV topping first; phased exit recommended', 'SOPR crossing above 0.5 from below = on-chain participants moving into profit; momentum confirming', 'Both crossing 0.8+ = late cycle; reduce exposure, set trailing stops']
            },
            {
                name: '30-Day Rolling Volatility', type: 'CHART', icon: 'ssid_chart',
                description: 'Annualised 30-day rolling volatility chart (purple area fill) computed from daily log-returns of BTC price data from the on-chain API. Formula: √(30-day variance × 365) × 100. Spikes in this chart historically align with liquidation cascades, macro shocks, and regime transitions.',
                howToRead: 'Low flat volatility (< 30%) = compressed market, energy coiling — breakout imminent. Rising volatility (> 60%) = regime change in progress. Extreme spike (> 100%) = crisis event.',
                signals: ['Volatility compressing to multi-year lows = major move imminent; direction unknown', 'Volatility spike then rapid collapse = false breakout or flash crash reversal setup', 'Sustained high volatility (> 60% for > 30 days) = trending regime; momentum strategies optimal', 'Volatility declining from peak = regime normalising; position sizes can increase']
            },
            {
                name: 'Correlation Matrix',
                type: 'HEATMAP', icon: 'grid_on',
                description: '10x10 colour-coded Pearson correlation heatmap across BTC, ETH, SOL, BNB, XRP, ADA, AVAX, LINK, 10Y Treasury, and S&P 500. Each cell = 90-day rolling Pearson coefficient. Green cells = positive correlation, red = negative. Diagonal is always 1.0. Sourced live from /api/correlation-matrix.',
                howToRead: 'Read each row as how that asset moves with all others. Deep green = strong co-movement. Deep red = inverse relationship. Pale cells = low/no correlation. A row that has gone pale = decoupling event.',
                signals: ['BTC-SPX correlation rising above 0.7 = risk-on regime, equity macro now driving BTC price', 'All crypto correlations converging toward 1.0 = systemic risk, liquidity squeeze ? reduce exposure', 'BTC-ETH correlation dropping below 0.5 = altcoin rotation underway, ETH diverging', 'BTC-10Y correlation turning deeply negative = dollar/yield headwind ? macro-driven selloff risk', 'Crypto vs macro correlation all near zero = idiosyncratic crypto-native market ? alpha environment']
            },
        ]
    });
}
