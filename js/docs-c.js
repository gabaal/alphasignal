// docs-c.js - Hub-Level Overview Documentation
// One generalised help page per left-sidebar menu section.
// Each page explains what the hub is for, what problem it solves,
// defines key terminology, and describes every view within it.

// ============= SHARED RENDERER =============
function renderHubOverviewPage({ hubId, icon, color, title, tagline, purpose, whoIsItFor, keyTerms, views, workflowTip, relatedHubs, hubTabs, activeTabId }) {
    const termRows = (keyTerms || []).map(t => `
        <div style="padding:1rem 1.25rem;border-bottom:1px solid ${alphaColor(0.05)}">
            <div style="display:flex;align-items:flex-start;gap:12px">
                <span class="material-symbols-outlined" style="font-size:18px;color:${color};margin-top:2px;flex-shrink:0">${t.icon || 'help_outline'}</span>
                <div>
                    <span style="font-size:0.95rem;font-weight:800;color:var(--text);letter-spacing:0.5px">${t.term}</span>
                    <p style="font-size:0.85rem;color:var(--text-dim);line-height:1.65;margin:4px 0 0">${t.def}</p>
                </div>
            </div>
        </div>`).join('');

    const viewCards = (views || []).map(v => `
        <div onclick="switchView('${v.route || ''}')" style="background:${alphaColor(0.025)};border:1px solid ${alphaColor(0.06)};border-radius:12px;padding:1.25rem 1.4rem;cursor:${v.route ? 'pointer' : 'default'};transition:background 0.18s;position:relative"
            onmouseover="this.style.background=alphaColor(0.05)" onmouseout="this.style.background=alphaColor(0.025)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <span class="material-symbols-outlined" style="font-size:19px;color:${color}">${v.icon}</span>
                <span style="font-size:0.95rem;font-weight:800;color:var(--text)">${v.name}</span>
                ${v.badge ? `<span style="font-size:0.65rem;font-weight:700;padding:2px 7px;border-radius:100px;background:${alphaColor(0.07)};border:1px solid ${alphaColor(0.12)};color:${color}">${v.badge}</span>` : ''}
            </div>
            <p style="font-size:0.85rem;color:var(--text-dim);line-height:1.65;margin:0 0 8px">${v.desc}</p>
            ${v.howToUse ? `<p style="font-size:0.82rem;color:${alphaColor(0.9)};line-height:1.6;margin:0;border-top:1px solid ${alphaColor(0.05)};padding-top:8px"><span style="font-weight:800;color:${color}">How to use:</span> ${v.howToUse}</p>` : ''}
            ${v.route ? `<span class="material-symbols-outlined" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:15px;color:${alphaColor(0.2)}">chevron_right</span>` : ''}
        </div>`).join('');

    const relatedChips = (relatedHubs || []).map(r => `
        <button onclick="switchView('${r.view}')" style="background:${alphaColor(0.04)};border:1px solid ${alphaColor(0.08)};color:var(--text-dim);padding:6px 14px;border-radius:100px;font-size:0.75rem;font-weight:700;letter-spacing:1px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s"
            onmouseover="this.style.borderColor='${color}';this.style.color='${color}'" onmouseout="this.style.borderColor=alphaColor(0.08);this.style.color='var(--text-dim)'">
            <span class="material-symbols-outlined" style="font-size:14px">${r.icon}</span>${r.name}
        </button>`).join('');

    appEl.innerHTML = `
        ${hubTabs ? window.renderHubTabs(activeTabId || 'overview', hubTabs) : ''}
        <!-- Header (Full Width) -->
        <div class="view-header" style="margin-bottom:2rem; max-width:860px">
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:${color};text-transform:uppercase;margin:0 0 6px">Hub Overview</h2>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:0.75rem">
                <span class="material-symbols-outlined" style="font-size:2.2rem;color:${color}">${icon}</span>
                <h1 style="margin:0;font-size:1.8rem;font-weight:900">${title}</h1>
                <button onclick="switchView('help')" style="margin-left:auto;background:${alphaColor(0.04)};border:1px solid ${alphaColor(0.1)};color:var(--text-dim);padding:5px 12px;border-radius:100px;font-size:0.7rem;font-weight:700;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;gap:5px"
                    onmouseover="this.style.borderColor='${color}';this.style.color='${color}'" onmouseout="this.style.borderColor=alphaColor(0.1);this.style.color='var(--text-dim)'">
                    <span class="material-symbols-outlined" style="font-size:14px">arrow_back</span> ALL DOCS
                </button>
            </div>
            <div>
                <p style="font-size:1.1rem;color:${color};font-weight:700;margin:0 0 8px;line-height:1.5">${tagline}</p>
                <p style="font-size:0.95rem;color:var(--text-dim);line-height:1.7;margin:0;margin-bottom:1.5rem">${purpose}</p>
            </div>
        </div>

        <!-- Documentation Content (Max-Width Constrained) -->
        <div style="max-width:860px;padding-bottom:5rem">
            <!-- Who is it for -->
            <div style="background:${alphaColor(0.03)};border:1px solid ${alphaColor(0.07)};border-left:3px solid ${color};border-radius:10px;padding:1rem 1.25rem;margin-bottom:2rem">
                <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:${color};margin-bottom:6px">WHO IS THIS FOR?</div>
                <p style="font-size:0.95rem;color:var(--text-dim);line-height:1.7;margin:0">${whoIsItFor}</p>
            </div>

            <!-- Key Terms Glossary -->
            ${termRows ? `
            <div style="border:1px solid ${alphaColor(0.07)};border-radius:14px;overflow:hidden;margin-bottom:2rem">
                <div style="padding:0.9rem 1.25rem;background:${alphaColor(0.03)};border-bottom:1px solid ${alphaColor(0.06)};display:flex;align-items:center;gap:8px">
                    <span class="material-symbols-outlined" style="color:${color};font-size:1.1rem">menu_book</span>
                    <span style="font-size:0.85rem;font-weight:900;letter-spacing:1px;color:${color}">KEY CONCEPTS & TERMINOLOGY</span>
                </div>
                ${termRows}
            </div>` : ''}

            <!-- Views in this hub -->
            <div style="margin-bottom:2rem">
                <div style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:1rem">VIEWS IN THIS HUB</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:12px">
                    ${viewCards}
                </div>
            </div>

            <!-- Workflow tip -->
            ${workflowTip ? `
            <div style="background:${alphaColor(0.03)};border:1px solid ${alphaColor(0.07)};border-radius:12px;padding:1.1rem 1.4rem;margin-bottom:2rem">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <span class="material-symbols-outlined" style="color:${color};font-size:20px">tips_and_updates</span>
                    <span style="font-size:0.8rem;font-weight:900;letter-spacing:1px;color:${color}">WORKFLOW TIP</span>
                </div>
                <p style="font-size:0.9rem;color:var(--text-dim);line-height:1.7;margin:0">${workflowTip}</p>
            </div>` : ''}

            <!-- Related hubs -->
            ${relatedChips ? `
            <div>
                <div style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px">RELATED HUBS</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px">${relatedChips}</div>
            </div>` : ''}
        </div>`;
}


// ============= 1. MACRO INTELLIGENCE HUB =============
function renderHubOverviewMacro() {
    renderHubOverviewPage({
        hubTabs: typeof macroHubTabs !== 'undefined' ? macroHubTabs : [],
        activeTabId: 'overview',
        hubId: 'macro-intel',
        icon: 'monitoring',
        color: '#a78bfa',
        title: 'Macro Intelligence Hub',
        tagline: '"What is the market weather today?" - your daily regime briefing before any trade.',
        purpose: 'The Macro Intelligence Hub is the highest-level layer of the AlphaSignal terminal. Before looking at individual assets, a professional trader needs to understand the dominant macro regime - is capital flowing into risk assets, or are institutions de-risking? This hub aggregates yield curve data, ETF flows, derivatives positioning, sector rotation momentum, and liquidity events into a single coherent risk picture. It answers the one question that overrides everything else: is this an environment where taking risk makes sense?',
        whoIsItFor: 'Anyone who makes trading or investment decisions in crypto. Swing traders use it to avoid buying into a macro headwind. Institutional desks use it to set daily directional bias before allocating. Quant strategies that ignore macro context consistently underperform in regime-change environments - this hub is the fix.',

        keyTerms: [
            { icon: 'public', term: 'Market Regime', def: 'A classification of the current market into broadly defined states: High-Volatility Expansion (trending, large moves), Low-Volatility Compression (tight range, energy coiling), or Neutral/Accumulation (institutions quietly positioning). Each regime requires a completely different set of strategies. Trading a breakout strategy in a compression regime generates losses; it is not the strategy that is wrong - it is the regime awareness.' },
            { icon: 'show_chart', term: 'Yield Curve', def: 'A chart of US Treasury bond yields across maturities - from 3 months to 30 years. When short-term yields exceed long-term yields (an inverted curve), it historically predicts an economic recession within 6-18 months. As capital fears a recession, it flees risk assets including crypto. The 2Y/10Y spread is the most watched institutional signal.' },
            { icon: 'account_balance', term: 'ETF Flows', def: 'Bitcoin Spot ETFs (IBIT, FBTC, ARKB, etc.) allow traditional finance institutions to gain BTC exposure without holding the asset. When these funds report net inflows, institutional money is entering the crypto space. Net outflows indicate institutions reducing exposure. These flows represent the clearest real-time signal of Wall Street\'s conviction in Bitcoin.' },
            { icon: 'local_fire_department', term: 'Liquidation Cascade', def: 'When leveraged traders are forced to close positions because the market moved against them, their forced orders push the price further in that direction, triggering the next layer of stops - a cascade. Liquidation events create extreme local volatility, sudden price dislocations, and often mark short-term capitulation bottoms or blowoff tops.' },
            { icon: 'track_changes', term: 'Open Interest (OI)', def: 'The total number of outstanding (open) derivative contracts across all exchanges. Rising OI means new positions are being opened and leverage is building. Falling OI means positions are closing. High OI combined with extreme funding rates signals an over-leveraged market that is primed for a violent squeeze in either direction.' },
            { icon: 'candlestick_chart', term: 'CME Gap', def: 'CME Bitcoin Futures trade only on weekdays. When the market moves significantly over a weekend, a price "gap" forms between Friday\'s close and Sunday\'s open. These gaps are structural liquidity voids - price has a statistical tendency to "fill" them before resuming trend, making them highly reliable target levels.' },
            { icon: 'pivot_table_chart', term: 'LOB (Limit Order Book)', def: 'The real-time queue of all resting buy and sell orders at specific price levels across exchanges. Thick concentrations of orders in the LOB act as institutional "walls" that price is drawn to. Sudden disappearance of a large wall (spoofing) indicates a deceptive order was placed and pulled to manipulate short-term sentiment.' },
            { icon: 'currency_exchange', term: 'DXY (US Dollar Index)', def: 'Measures the strength of the US Dollar against a basket of major currencies. Crypto and equities have an inverse relationship to the DXY - when the dollar strengthens, risk assets typically fall. Fed rate decisions are the primary driver of DXY moves, making it a leading macro indicator for all risk assets.' },
        ],

        views: [
            { icon: 'description', name: 'Strategy Briefing', badge: 'AI', route: 'briefing', desc: 'AI-generated institutional morning brief. Covers macro context, top conviction opportunities, and risk warnings synthesised from all terminal data. Includes System Conviction Dials (Fear & Greed, Retail Sentiment) and a BTC vs 60/40 benchmark overlay.', howToUse: 'Read this first every morning. If the Risk Warnings section is longer than the Key Opportunities section, adopt a defensive bias for the day.' },
            { icon: 'swap_horiz', name: 'Sector Rotation', badge: 'LIVE', route: 'rotation', desc: 'Tracks which crypto sectors (L1s, DeFi, Memes, AI tokens) are attracting capital and which are bleeding. The Sector Momentum Treemap shows relative strength; the Rotation Matrix Table ranks sectors by 1D, 7D, and 30D momentum.', howToUse: 'If L1s are rotating green while DeFi is red, allocate to base-layer tokens, not protocols. Rotate your exposure to follow the money.' },
            { icon: 'explore', name: 'Macro Compass', badge: 'LIVE', route: 'macro-hub', desc: 'Cross-asset correlation matrix (BTC vs S&P 500, Gold, DXY, US 10Y Yield) plus a US Yield Curve Monitor and DXY overlay. Determines whether Bitcoin is trading as a risk asset, safe haven, or in a detached cycle.', howToUse: 'If BTC/SPX correlation is above 0.7, treat Bitcoin like the Nasdaq - Fed decisions will dominate. If correlation is below 0.3, focus on on-chain signals instead.' },
            { icon: 'event', name: 'Macro Calendar', badge: 'LIVE', route: 'macro-calendar', desc: 'Forward-looking calendar of high-impact economic events (FOMC, CPI, NFP, PCE) with a proprietary BTC Impact Score (0-10) estimating expected crypto volatility for each event.', howToUse: 'Any event scoring 7+ requires reducing leveraged exposure 24h in advance. Use the calendar to plan your trading week around scheduled risk, not react to it.' },
            { icon: 'layers', name: 'Market Regime', badge: 'ML', route: 'regime', desc: 'Hidden Markov Model classification of the current regime with confidence score. Three states: High-Volatility Expansion, Low-Volatility Compression, Neutral/Accumulation. Includes a 90-day history heatmap and regime transition probability matrix.', howToUse: 'Only deploy trend-following strategies in High-Vol Expansion. Use mean-reversion and range trades in Low-Vol Compression. Observe both in Neutral.' },
            { icon: 'account_balance', name: 'ETF Flows', badge: 'LIVE', route: 'etf-flows', desc: 'Real-time institutional capital movement through Bitcoin Spot ETFs. Stacked bar chart of daily net flows per issuer, a daily leaderboard, and a cumulative waterfall chart.', howToUse: 'Three or more consecutive days of net positive flow across all issuers = strong institutional support regime. Cumulative decline = distribution phase beginning.' },
            { icon: 'local_fire_department', name: 'Liquidations', badge: 'LIVE', route: 'liquidations', desc: 'Forced position closure monitor across all major derivatives exchanges. Tracks cascade scanner by asset, total rekt volume (24h), and the single largest liquidation order.', howToUse: 'After a large liquidation cascade (longs >$200M in a day), price often rebounds sharply as the forced selling exhausts. These are high-quality entry windows, not times to panic.' },
            { icon: 'track_changes', name: 'OI Radar', badge: 'LIVE', route: 'oi-radar', desc: 'Open Interest across Binance Perpetuals and CME Futures on a spider chart. Includes IV Smile curve, OI Divergence Bubble Map (8 assets), and an OI - Funding Squeeze Matrix for identifying long/short trap setups.', howToUse: 'When the Bubble Map shows BTC in the orange quadrant (OI rising as price rises), the market is overly leveraged long - a squeeze risk. Reduce leveraged longs.' },
            { icon: 'pivot_table_chart', name: 'CME Gaps', badge: 'LIVE', route: 'cme-gaps', desc: 'Registry of all active unfilled CME Bitcoin Futures gaps with price range, fill status (UNFILLED/PARTIAL/FILLED), and distance from current spot price.', howToUse: 'A gap within 2-3% of current price has a high probability of being filled imminently. Use gap levels as precise take-profit targets on existing positions.' },
            { icon: 'blur_on', name: 'LOB Heatmap', badge: 'LIVE', route: 'lob-heatmap', desc: 'High-density visual canvas of the Limit Order Book across 50 price levels. Bright cyan/yellow bands = institutional liquidity walls. Dark zones = thin, fast-moving price regions.', howToUse: 'Use before execution to identify the nearest institutional wall above and below current price. Entry near a bright bid wall offers structural support for a long.' },
        ],

        workflowTip: 'Start every session here. Check the Market Regime first - it determines which strategies are valid today. Then check ETF Flows for institutional conviction. Then the Macro Calendar for scheduled risks. The Macro Compass tells you whether Bitcoin is correlated to equities today (use macro events as signals) or decorrelated (use on-chain signals instead). This entire hub should take under 5 minutes to scan - it is designed for efficiency, not deep analysis.',

        relatedHubs: [
            { name: 'Market Analytics', view: 'analytics-hub', icon: 'analytics' },
            { name: 'Strategy & Backtester', view: 'alpha-hub', icon: 'electric_bolt' },
            { name: 'Portfolio & Risk', view: 'institutional-hub', icon: 'key' },
        ]
    });
}


// ============= 2. ALPHA STRATEGY HUB =============
function renderHubOverviewAlpha() {
    renderHubOverviewPage({
        hubTabs: typeof alphaHubTabs !== 'undefined' ? alphaHubTabs : [],
        activeTabId: 'overview',
        hubId: 'alpha-strategy',
        icon: 'electric_bolt',
        color: '#facc15',
        title: 'Alpha Strategy & Backtester Hub',
        tagline: '"Where is the statistical edge?" - the quantitative core of signal discovery and strategy validation.',
        purpose: 'The Alpha Strategy Hub is where trade ideas are born, tested, and validated. It monitors 50+ assets across Z-score deviations, ML ensemble predictions, on-chain flows, and social sentiment - then distils them into ranked, actionable signals. Everything in this hub is grounded in quantitative methodology: no gut feel, no social media hype. The hub also houses the full backtesting infrastructure to validate any strategy before committing capital.',
        whoIsItFor: 'Intermediate to advanced traders who want systematic, data-driven signal generation rather than discretionary chart reading. Suitable for both active traders (checking live signals daily) and quant researchers (running backtests and strategy optimisations). This is the analytical heart of the terminal for anyone generating their own trading theses.',

        keyTerms: [
            { icon: 'ssid_chart', term: 'Z-Score', def: 'A statistical measure of how many standard deviations an asset\'s current value is from its rolling mean. A Z-score of 0 = perfectly average behaviour. A Z-score of 2.0 = the asset is behaving 2 standard deviations beyond normal - a statistically rare event. In financial markets, Z-scores above 1.75 on momentum or volume metrics have historically preceded significant price moves. The AlphaSignal engine flags these as high-priority signals.' },
            { icon: 'smart_toy', term: 'ML Alpha Engine', def: 'A dual-model ensemble combining an LSTM (Long Short-Term Memory recurrent neural network, which learns temporal price patterns) and XGBoost (a gradient-boosted decision tree model trained on fundamental and technical features). When both models agree on direction with >70% confidence, the terminal issues a HIGH consensus signal - the highest-quality alert the system generates.' },
            { icon: 'electric_bolt', term: 'Alpha', def: 'The return of an investment above the market benchmark (usually BTC). Alpha = 5% means the asset delivered 5% more return than simply holding Bitcoin over the same period. Positive alpha is the goal - it is the measure of genuine skill or edge beyond simply being long a rising market. Negative alpha means you would have been better off holding BTC.' },
            { icon: 'radar', term: 'Signal', def: 'A statistically validated event that indicates a probable price move in a specific direction. AlphaSignal generates three types: Z-Score Deviation Signals (momentum anomalies), ML Direction Signals (model-predicted 24h direction), and Rule-Based Alerts (RSI, MACD, funding rate extremes). Not every signal is a trade - signals require confirmation from the macro context.' },
            { icon: 'history', term: 'Backtesting', def: 'Applying a trading strategy to historical data to evaluate what would have happened if you had followed it. A backtest reveals a strategy\'s win rate, profit factor, maximum drawdown, and Sharpe Ratio. Crucially, backtest results on their own can be deceptive - curve-fitting to historical data creates the illusion of a good strategy. AlphaSignal uses out-of-sample holdout data to guard against this.' },
            { icon: 'analytics', term: 'Sharpe Ratio', def: 'A measure of risk-adjusted return. Calculated as (Strategy Return - Risk-Free Rate) - Standard Deviation of Returns. A Sharpe above 1.0 is acceptable; above 2.0 is excellent; above 3.0 is exceptional. A high return with a low Sharpe means you took excessive risk to achieve it - the equivalent of going all-in on a single bet and getting lucky.' },
            { icon: 'hub', term: 'Narrative', def: 'A story or theme that the market is collectively trading on - for example, "AI tokens are the next mega-cycle" or "RWA tokenisation will replace traditional finance." Narratives drive price before fundamentals catch up. The Narrative Galaxy tracks narrative strength and velocity (how fast it is growing vs. fading) using NLP analysis of social media, news, and developer activity.' },
            { icon: 'leaderboard', term: 'Point of Control (POC)', def: 'In Market Profile analysis, the POC is the single price level that has traded the highest total volume. It represents the market\'s fairest agreed value over the session. Price tends to mean-revert toward the POC after extended moves away from it, making it both a target for profit-taking and a support/resistance reference.' },
        ],

        views: [
            { icon: 'radar', name: 'Live Signals', badge: 'LIVE', route: 'signals', desc: 'Real-time signal cards for 50+ assets. Each card shows Ticker, Price, 24h Change, Relative Alpha (%), Sentiment, BTC Correlation, and Z-Score badge. Cards with Z > 1.75 pulse with a glow border. Includes a 30-day firing density histogram and Z-score bell curve distribution.', howToUse: 'Filter by sector to focus on your area. Sort by Z-score descending to find the most statistically extreme outliers. Only act on signals that agree with the macro regime.' },
            { icon: 'bolt', name: 'Alpha Score', badge: 'COMPOSITE', route: 'alpha-score', desc: 'A composite 0-100 ranking of every tracked asset across momentum, sentiment, on-chain activity, ML prediction, and volatility. Grades assets A through D. The most efficient single-screen opportunity screener in the terminal.', howToUse: 'Start here on your morning scan. Focus on Grade A assets showing STRONG BUY with HIGH ML consensus - these are the terminal\'s highest-conviction setups.' },
            { icon: 'leaderboard', name: 'Market Profile (TPO)', badge: 'PRO', route: 'volume-profile', desc: 'Time-Price Opportunity mapping of traded volume at specific price levels. Calculates Value Area High, Value Area Low, and Point of Control. Identifies institutional fair value and key liquidity zones.', howToUse: 'Before entering a trade, check the Market Profile. Enter near the POC or Value Area Low for longs - these are statistically high-probability reversal zones with institutional order flow behind them.' },
            { icon: 'science', name: 'Strategy Lab', badge: 'LIVE', route: 'strategy-lab', desc: 'Live strategy testing on any asset. Choose from MVRV Reversion, Momentum Cross, Regime-Adaptive, or VWAP Bounce. See the equity curve, Guppy EMA ribbon, and 500-path Monte Carlo simulation bands update in real-time.', howToUse: 'Use the Regime-Adaptive strategy as a baseline. Run it across assets in your watchlist to identify where the current regime aligns best - that is where to focus new entries.' },
            { icon: 'analytics', name: 'Backtester V2', badge: 'INSTITUTIONAL', route: 'backtester-v2', desc: 'Institutional-grade backtesting on actual historical AlphaSignal signals. Rolling Sharpe Ratio chart, monthly P&L heatmap calendar, and full trade statistics (Win Rate, Profit Factor, Max Drawdown, Calmar Ratio).', howToUse: 'Run a backtest before deploying a new strategy live. A Sharpe above 1.5 over 12+ months is the minimum threshold to consider live allocation. Below 1.0, stay paper trading.' },
            { icon: 'archive', name: 'Signal Archive', badge: 'LIVE', route: 'signal-archive', desc: 'The complete historical record of every signal generated, with outcome tracking (WIN/LOSS/OPEN) and running cumulative P&L curve. Filters by date, ticker, direction, and outcome.', howToUse: 'Filter by WIN and look for common conditions. Filter by LOSS to identify which environments the signal engine underperforms - these are the regimes to avoid or hedge.' },
            { icon: 'hub', name: 'Narrative Galaxy', badge: 'NLP', route: 'narrative', desc: 'Force-directed network graph of market narrative strength and velocity across social media, news, and on-chain activity. Node size = mention volume, colour = momentum (green gaining, red fading). Narrative Velocity Table ranks by 7-day growth rate.', howToUse: 'New nodes growing rapidly = emerging narrative before price confirms. Enter assets aligned with ACCELERATING narratives. Exit when the table shows PEAKING or FADING.' },
        ],

        workflowTip: 'Your daily flow in this hub: (1) Check Alpha Score for today\'s ranked opportunities. (2) Open the top 2-3 assets in Signal Cards to review Z-score and ML consensus. (3) If Z > 1.75 and ML consensus is HIGH, structure the trade in the Trade Idea Lab. (4) Use the Backtester to confirm the strategy has worked historically in similar regimes. Only enter after all four steps align.',

        relatedHubs: [
            { name: 'Macro Intelligence', view: 'macro-hub', icon: 'monitoring' },
            { name: 'Market Analytics', view: 'analytics-hub', icon: 'analytics' },
            { name: 'Portfolio & Risk', view: 'institutional-hub', icon: 'key' },
        ]
    });
}


// ============= 3. PORTFOLIO & RISK HUB =============
function renderHubOverviewInstitutional() {
    renderHubOverviewPage({
        hubTabs: typeof institutionalHubTabs !== 'undefined' ? institutionalHubTabs : [],
        activeTabId: 'overview',
        hubId: 'portfolio-risk',
        icon: 'key',
        color: '#fb923c',
        title: 'Portfolio & Risk Hub',
        tagline: '"How do we manage the downside?" - institutional-grade risk management and portfolio construction.',
        purpose: 'The Portfolio & Risk Hub is the accountability layer between a signal and an actual position. A high-Z score signal is worthless if your position sizing is reckless, your portfolio is over-correlated, or a scheduled token unlock is about to flood the market with supply. This hub provides the tools to build, optimise, and stress-test a portfolio using the same frameworks used by institutional asset managers: Modern Portfolio Theory, Value-at-Risk, and scenario analysis.',
        whoIsItFor: 'Anyone managing a portfolio of more than 2-3 assets simultaneously. Traders who rely on gut-feel for position sizing will find that this hub dramatically reduces drawdowns. It is especially critical before entering large positions - run the Risk Matrix check every time. Portfolio managers, family office operators, and quantitative traders will use this hub daily.',

        keyTerms: [
            { icon: 'shield', term: 'Value at Risk (VaR)', def: 'VaR is the maximum expected loss on 95% of trading days, expressed as a percentage of portfolio value. A portfolio VaR of 3% means on 95% of days you should not lose more than 3% of your total capital. On the remaining 5% of days (tail events), losses can exceed this level. VaR is the primary institutional risk management benchmark - it is the first metric risk managers look at each morning.' },
            { icon: 'auto_mode', term: 'Markowitz Efficient Frontier', def: 'The mathematical principle that for every level of risk, there is an optimal portfolio combination that maximises return - and for every desired return, there is a portfolio with minimum risk. The "Efficient Frontier" is the curve of these optimal portfolios. Any portfolio below the frontier is sub-optimal: you are either taking too much risk for your return, or leaving return on the table for your level of risk.' },
            { icon: 'scatter_plot', term: 'Correlation', def: 'A statistical measure of how two assets move relative to each other. A correlation of +1.0 means they move in perfect lockstep. A correlation of -1.0 means they move in exactly opposite directions. A correlation of 0 means they are independent. A portfolio of highly correlated assets provides no diversification - in a crash, they all fall together. True diversification requires assets with low or negative correlation.' },
            { icon: 'science', term: 'Sharpe Ratio', def: 'Risk-adjusted return. Divides portfolio return by its volatility. A ratio above 1.0 is institutionally acceptable; above 2.0 is excellent. Two strategies with identical returns can have very different Sharpe Ratios - the one with lower volatility is objectively superior because it achieved the same gains with less risk and fewer psychological drawdowns.' },
            { icon: 'key', term: 'Token Unlock', def: 'Scheduled events where previously locked (vested) tokens become available for sale. When team members, early investors, or protocol treasuries receive large quantities of tokens at once, the additional supply can depress the price significantly. Market participants often sell in anticipation of the unlock, meaning price may decline before the date, not just on it.' },
            { icon: 'biotech', term: 'Real Yield (DeFi)', def: 'DeFi protocols pay yield in two ways: from actual business revenue (fees generated by the protocol) or by printing and distributing new tokens as rewards. Real Yield refers only to the portion sourced from genuine revenue. A protocol offering 200% APY almost entirely from token emissions is functionally printing money - the yield is only sustainable as long as the token price holds. Real Yield is sustainable regardless of token price.' },
            { icon: 'warning', term: 'Maximum Drawdown', def: 'The largest peak-to-trough decline in portfolio value over a given period. A -40% maximum drawdown means the portfolio fell 40% from its highest point to its lowest, before any recovery. Drawdown is arguably more important than return - a strategy that returns 20% per year but occasionally draws down 60% will psychologically force most traders to exit at the worst possible moment.' },
            { icon: 'calculate', term: 'ATR (Average True Range)', def: 'A measure of an asset\'s average daily price movement. Used by the Risk Matrix to calculate position sizing. A stop-loss placed at 2- the ATR is placed beyond the typical daily noise, reducing false stop-outs. An asset with a high ATR (large daily moves) automatically receives a smaller position size when using ATR-adjusted sizing.' },
        ],

        views: [
            { icon: 'auto_mode', name: 'Portfolio Optimizer', badge: 'ML', route: 'portfolio-optimizer', desc: 'ML-powered portfolio construction using Markowitz Efficient Frontier analysis. Generates optimal allocations via AI CIO Directive, interactive basket builder, ML Rebalancing Table, Efficient Frontier Scatter, and a live 15-asset Correlation Matrix.', howToUse: 'Add your current holdings to the basket. If the current portfolio sits well below the frontier, follow the ML rebalancing suggestions to improve your Sharpe Ratio.' },
            { icon: 'grid_on', name: 'Risk Matrix', badge: 'INSTITUTIONAL', route: 'risk', desc: 'Portfolio-level VaR gauge, ATR-adjusted position sizer, and a correlation scatter plot of all open positions. The position sizer automatically calculates exact trade sizes based on 1% account risk logic.', howToUse: 'Before every new position, run it through the position sizer. If VaR exceeds 5% after the addition, either do not add the trade or reduce an existing position first.' },
            { icon: 'warning', name: 'Stress Test Lab', badge: 'SCENARIO', route: 'stress', desc: 'Simulates your portfolio\'s P&L under historical extreme events: March 2020 COVID Crash, FTX Collapse, May 2021 Mining Ban, Luna/UST Depeg. Includes Z-score distribution stress chart and asset-level beta attribution table.', howToUse: 'Run this monthly. If any scenario shows a loss exceeding your maximum tolerable drawdown, reduce position sizes now - before a crisis forces you to do it under emotional pressure.' },
            { icon: 'experiment', name: 'Trade Idea Lab', badge: 'STRUCTURED', route: 'tradelab', desc: 'Structured thesis builder with AI critique. Enter asset, direction, entry, stop, and target. Auto-calculates Risk/Reward, Expected Value (at 55% win rate), and optimal position size. AI Validator generates counter-arguments to stress-test your idea.', howToUse: 'Use this for every trade above -500 in notional value. If the AI returns more counter-arguments than supporting points, reduce position size by 50%.' },
            { icon: 'key', name: 'Token Unlocks', badge: 'PRO', route: 'token-unlocks', desc: 'Upcoming unlock schedule for major protocols, ranked by Supply Impact Score. Shows unlock size, beneficiary type, and proximity-coded proximity alerts (red = within 7 days).', howToUse: 'Check this every Sunday before planning the week\'s trades. Avoid opening new long positions in tokens scoring 7+ within 7 days of an unlock event.' },
            { icon: 'biotech', name: 'DeFi Yield Lab', badge: 'BETA', route: 'yield-lab', desc: 'APY comparison table for major DeFi protocols, separating real yield (from protocol revenue) from inflationary token emissions. Includes composite risk scores for each protocol.', howToUse: 'Focus exclusively on protocols with the REAL YIELD flag. A Risk Score below 3 with a real yield above 4% is an institutional-grade yield opportunity.' },
        ],

        workflowTip: 'Never skip the Risk Matrix before a new position. The three-step pre-trade checklist: (1) Run the position through the Position Sizer - is the size appropriate for your stop level? (2) Check VaR - does this addition push overall portfolio risk above 5%? (3) Check the Correlation Matrix - does this asset increase or decrease your portfolio diversification? All three green = proceed. Any red = adjust before trading.',

        relatedHubs: [
            { name: 'Strategy & Backtester', view: 'alpha-hub', icon: 'electric_bolt' },
            { name: 'Macro Intelligence', view: 'macro-hub', icon: 'monitoring' },
            { name: 'Trade Ledger Audit', view: 'audit-hub', icon: 'trending_up' },
        ]
    });
}


// ============= 4. MARKET ANALYTICS HUB =============
function renderHubOverviewAnalytics() {
    renderHubOverviewPage({
        hubTabs: typeof analyticsHubTabs !== 'undefined' ? analyticsHubTabs : [],
        activeTabId: 'overview',
        hubId: 'market-analytics',
        icon: 'analytics',
        color: '#22c55e',
        title: 'Market Analytics Hub',
        tagline: '"What is the institutional reality beneath the price?" - on-chain, options, and whale intelligence.',
        purpose: 'The Market Analytics Hub cuts directly through social media noise by looking purely at where capital and data actually are, not where commentators say they are. It combines four distinct intelligence layers: Whale Transaction Monitoring (on-chain block transfers that telegraph accumulation or distribution before price moves), On-Chain Cycle Metrics (MVRV, SOPR, Puell Multiple - the indicators that have reliably identified every Bitcoin cycle top and bottom), Options Market Structure (where institutional hedgers are positioning and at what strike prices), and Chain Velocity (which blockchain ecosystem is attracting cross-chain capital right now). Together these layers paint a picture of what sophisticated money is actually doing - not saying.',
        whoIsItFor: 'Traders who understand that price action is the last thing to move, not the first. Anyone who has been caught in a rug pull, unexpected dump, or liquidity trap will find this hub invaluable. It is designed for crypto-native traders who know that on-chain data provides a fundamentally different - and often earlier - signal than technical analysis alone.',

        keyTerms: [
            { icon: 'waves', term: 'Whale', def: 'An entity (individual, fund, or exchange) that holds or moves a large enough quantity of cryptocurrency to meaningfully impact market prices. In the AlphaSignal context, a whale transaction is defined as any on-chain transfer greater than $500,000 in value. Whale movements are tracked because institutions must move large blocks of capital on-chain to deploy or withdraw from the market, leaving a visible footprint before the price reacts.' },
            { icon: 'speed', term: 'Chain Velocity', def: 'A measure of how fast capital is accelerating through a specific blockchain network, calculated as the current 24-hour transaction volume divided by the 5-day moving average volume. A Chain Velocity above 1.0 means volume is expanding relative to recent norms - capital is moving into that ecosystem. Velocity tracking across multiple chains simultaneously reveals cross-chain capital rotation before prices confirm the move.' },
            { icon: 'link', term: 'MVRV Z-Score', def: 'The Market Value to Realised Value Z-Score compares Bitcoin\'s total market capitalisation to its "realised cap" (the sum of what every coin last moved at - essentially the aggregate cost basis). A negative Z-score means the average holder is underwater - historically the deepest accumulation zones. A Z-score above 7 has marked every major Bitcoin cycle top.' },
            { icon: 'trending_up', term: 'SOPR (Spent Output Profit Ratio)', def: 'Measures whether coins being moved on-chain are being sent at a profit (SOPR > 1) or at a loss (SOPR < 1). In healthy bull markets, SOPR stays above 1 because profit-takers sell but buyers absorb them. SOPR persistently below 1 = capitulation - holders being forced to sell at a loss, marking bear market lows.' },
            { icon: 'ssid_chart', term: 'Implied Volatility (IV) Smile', def: 'Options are priced with Implied Volatility (IV) - the market\'s expectation of future price swings. When IV is higher for OTM Puts than OTM Calls, the curve takes a "smirk" shape with a steep left tail - institutions are buying downside protection (fearing a crash). When IV is higher for OTM Calls, the curve skews right - institutions are positioning for a rally. The shape of the IV smile reveals institutional fear or greed without needing to know anyone\'s actual positions.' },
            { icon: 'waterfall_chart', term: 'Put/Call Ratio', def: 'The ratio of outstanding Put options (bets on price falling) to Call options (bets on price rising). A ratio above 1.0 means more puts than calls - institutionally bearish hedging is dominant. Counterintuitively, extremes in the Put/Call ratio are contrarian signals: very high ratios (>1.5) indicate too much bearish hedging, and markets often rally to squeeze out the over-hedged shorts.' },
            { icon: 'currency_bitcoin', term: 'Puell Multiple', def: 'A Bitcoin miner profitability measure: daily miner revenue (in USD) divided by the 365-day moving average. When miners earn far below their historical average (Puell below 0.5), they have reduced selling incentive - supply pressure eases. When they earn far above average (Puell above 4), they sell aggressively to lock in profits, creating price headwinds.' },
            { icon: 'moving', term: 'Sankey Diagram', def: 'A flow diagram where the width of each connecting line is proportional to the volume of capital flowing between two points. In the Chain Velocity view, the Sankey shows where new fiat and stable capital is being deployed: flowing into Ethereum DeFi, Solana liquid staking, or being withdrawn back to stables. Following the thickest lines reveals the market\'s true allocation direction.' },
        ],

        views: [
            { icon: 'waves', name: 'Whale Pulse', badge: 'ON-CHAIN', route: 'whales', desc: 'Real-time feed of on-chain transactions >$500K. Each entry shows direction (Exchange Inflow = likely sell pressure, Exchange Outflow = likely accumulation), timestamp, and size. Includes a Volume Bubble Scatter and an Execution Time Polar Chart showing which market sessions whales are most active in.', howToUse: 'Watch for clustering: three or more large exchange inflows within 1 hour = distribution pressure building. Three or more large outflows = institutional accumulation. Act with the whales, not against them.' },
            { icon: 'speed', name: 'Chain Velocity', badge: 'LIVE', route: 'velocity', desc: 'Cross-chain capital velocity time-series across Ethereum, Solana, Avalanche, and Cardano. Cross-Chain Capital Flow Sankey shows where capital is entering and flowing to. Network Signature Radar compares chains across Momentum, Social Heat, Liquidity, and Institutional Vigor.', howToUse: 'If Solana velocity is above 1.8 while Ethereum is below 0.9, rotate sector exposure to SOL-native assets. The ecosystem receiving strong Sankey inflows from Stables is where new capital is deploying.' },
            { icon: 'link', name: 'On-Chain Analytics', badge: 'ON-CHAIN', route: 'onchain', desc: 'Nine institutional-grade on-chain metrics: MVRV Z-Score, SOPR, Puell Multiple, NVT Ratio, Realised Price Overlay, Hash Ribbons, CVD, Exchange Net Flow. Each with historical cycle reference lines.', howToUse: 'Use multiple metrics in confluence. MVRV below 0 + SOPR below 1 + Puell below 0.5 simultaneously = maximum bear market signal - the highest-conviction long entry the on-chain data can generate.' },
            { icon: 'ssid_chart', name: 'Options Flow', badge: 'DERIVATIVES', route: 'options-flow', desc: 'Institutional options market structure: Put/Call Ratio gauge, IV Smile curve (aggregated Deribit + equity proxies), Top Open Interest Strikes Table (the levels dealers are most hedged around), and IV Term Structure showing contango vs backwardation.', howToUse: 'Before entering a large position, check the Top OI Strikes. A large call wall 5% above your entry = defined near-term resistance ceiling. A large put wall below = structural floor.' },
            { icon: 'analytics', name: 'Gamma Exposure (GEX)', badge: 'DERIVATIVES', route: 'gex-profile', desc: 'Dealer Gamma Exposure profile showing where options market makers must buy and sell spot to delta-hedge their books. Negative GEX zones = high volatility expected. Positive GEX zones = price is "pinned" and suppressed.', howToUse: 'Enter long when spot is at or below the largest negative GEX strike - dealers will be forced to buy spot aggressively, accelerating your gain.' },
            { icon: 'psychology', name: 'Mindshare & Narrative', badge: 'NLP', route: 'mindshare', desc: 'Social consciousness mapping of the crypto market using NLP across Twitter/X, Reddit, Telegram, and news. Shows relative share of voice per asset and narrative momentum.', howToUse: 'Look for assets with rising mindshare but low price response - these are early-stage narratives building before the broader market discovers them.' },
            { icon: 'newspaper', name: 'Newsroom', badge: 'LIVE', route: 'newsroom', desc: 'Real-time AI-classified news feed from 15+ aggregated sources. Sentiment tags (BULLISH/BEARISH/REGULATORY/NEUTRAL) with AI confidence scores. Keyword sentiment heatmap for 48-hour narrative tracking.', howToUse: 'Set the Newsroom to run in a side tab during active trading sessions. REGULATORY tags require immediate position review - regulatory news is the most volatile and unpredictable catalyst.' },
            { icon: 'candlestick_chart', name: 'Advanced Charting', badge: 'PRO', route: 'advanced-charting', desc: 'Five-panel charting suite: OHLCV Candlestick with VWAP and EMA overlays, Volume Profile, CVD (Cumulative Volume Delta), Market Depth, and a full embedded TradingView professional chart.', howToUse: 'Use CVD divergence as your primary timing signal: price at highs + CVD declining = bearish divergence, take profits. Price falling + CVD rising = buyers still present, potential reversal.' },
        ],

        workflowTip: 'Use this hub to validate or invalidate signals from the Alpha Strategy Hub. A perfect trade setup flow: ML Engine fires a LONG signal on SOL - Check Chain Velocity (is SOL absorbing capital?) - Check Whale Pulse (are exchanges seeing outflows of SOL?) - Check On-Chain metrics (is SOPR above 1?) - Check Options Flow (is there a large call wall above entry?). If all four confirm the ML signal, your conviction is institutional-grade.',

        relatedHubs: [
            { name: 'Macro Intelligence', view: 'macro-hub', icon: 'monitoring' },
            { name: 'Strategy & Backtester', view: 'alpha-hub', icon: 'electric_bolt' },
            { name: 'Liquidity & Order Flow', view: 'liquidity', icon: 'bar_chart' },
        ]
    });
}


// ============= 5. TRADE LEDGER AUDIT HUB =============
function renderHubOverviewAudit() {
    renderHubOverviewPage({
        hubTabs: typeof auditHubTabs !== 'undefined' ? auditHubTabs : [],
        activeTabId: 'overview',
        hubId: 'audit-hub',
        icon: 'trending_up',
        color: '#60a5fa',
        title: 'Trade Ledger & Audit Hub',
        tagline: '"Is my performance genuine edge or just market beta?" - the honest accounting layer.',
        purpose: 'The Trade Ledger Audit Hub is where accountability meets data. After executing trades based on AlphaSignal signals, this hub provides the infrastructure to objectively evaluate whether those trades generated genuine Alpha (return above the Bitcoin benchmark) or were simply riding market beta (market-wide moves that any passive holder would have captured). Most traders significantly overestimate their skill because they compare returns to cash rather than to Bitcoin. This hub forces the correct comparison and provides institutional-grade attribution analysis.',
        whoIsItFor: 'Anyone who wants to know whether they are actually good at trading, or just good at being in a bull market. Portfolio managers who need to report performance attribution. Traders who want to identify which signal types, strategies, and market conditions generate their best results - and which destroy capital.',

        keyTerms: [
            { icon: 'trending_up', term: 'Alpha vs Beta', def: 'Alpha is the performance above the benchmark (BTC). Beta is the percentage of your return explained by simply holding BTC. If the market went up 40% and your portfolio went up 45%, your Beta return was 40% and your Alpha was 5%. If the market went up 40% and your portfolio went up 30%, you generated -10% Alpha - you would have been better off doing nothing. This hub separates these two components in every trade.' },
            { icon: 'bar_chart', term: 'Win Rate', def: 'The percentage of trades that close profitably. A useful but dangerously misleading metric on its own. A 90% win rate means nothing if the 10% of losing trades each lose 10x the average win (a classic high-win-rate disaster pattern). Win Rate must always be read alongside Profit Factor and Average Win/Loss ratio to be meaningful.' },
            { icon: 'analytics', term: 'Profit Factor', def: 'Total gross profits divided by total gross losses. A Profit Factor of 1.5 means for every -1 lost, the strategy made -1.50. Above 1.5 is acceptable; above 2.0 is excellent. This is the single most honest measure of a strategy\'s edge because it captures both win frequency and win magnitude simultaneously.' },
            { icon: 'account_tree', term: 'Calmar Ratio', def: 'Annualised return divided by Maximum Drawdown. A Calmar of 1.0 means the annual return equals the maximum experienced drawdown - acceptable. A Calmar of 2.0+ means the strategy earned twice its worst historical loss - excellent. The Calmar Ratio is preferred by institutional fund managers over Sharpe because it focuses on tail risk rather than volatility.' },
            { icon: 'receipt_long', term: 'Slippage', def: 'The difference between the expected execution price of a trade and the actual price at which it filled. Slippage occurs because large orders move the market as they fill. Slippage of 0.3% per trade sounds small but compounds to significant performance drag over hundreds of trades. The Trade Ledger tracks average slippage to reveal whether execution quality is costing the strategy meaningful alpha.' },
        ],

        views: [
            { icon: 'list_alt', name: 'Trade Ledger', badge: 'AUDIT', route: 'trade-ledger', desc: 'Complete auditable log of all recorded trades: Date, Asset, Direction, Entry/Exit prices, Size, Gross & Net P&L (post-fees), Signal Source (Z-Score / ML / Manual), and Outcome. Performance Attribution breakdown separates Alpha, Beta, and Noise contributions.', howToUse: 'Filter by Signal Source to identify which input types are actually generating your alpha. If Manual trades consistently underperform System trades, reduce discretionary sizing.' },
            { icon: 'trending_up', name: 'Performance Dashboard', badge: 'LIVE', route: 'performance-dashboard', desc: 'Institution-format performance summary: Win Rate, ROI, Profit Factor, and Current Drawdown stat cards with 30-day deltas. Monthly ROI heatmap calendar for seasonal pattern identification. Portfolio equity curve vs BTC buy-and-hold baseline.', howToUse: 'Review monthly. If the equity curve is below the BTC line for more than 30 consecutive days, your strategy is generating negative alpha - time for a systematic review.' },
            { icon: 'insert_chart', name: 'Strategy Report', badge: 'REPORT', route: 'strategy-report', desc: 'Comprehensive strategy performance report combining signal attribution, regime analysis, and forward scenario projections. Exportable for external review or institutional reporting.', howToUse: 'Generate quarterly. The regime analysis section reveals whether your strategy is regime-dependent (only profitable in certain market states) or all-weather.' },
        ],

        workflowTip: 'Review the Performance Dashboard weekly. Look at three things: (1) is the equity curve above or below the BTC baseline? (2) Is the Profit Factor above 1.5? (3) Is Win Rate trending up or down? Monthly review of the Trade Ledger by signal source will tell you whether the system, not luck, is generating your returns. This is the single habit that separates traders who improve from those who stagnate.',

        relatedHubs: [
            { name: 'Strategy & Backtester', view: 'alpha-hub', icon: 'electric_bolt' },
            { name: 'Portfolio & Risk', view: 'institutional-hub', icon: 'key' },
        ]
    });
}


// ============= 6. ALERTS & WEBHOOKS HUB =============
function renderHubOverviewAlerts() {
    renderHubOverviewPage({
        hubTabs: typeof alertsHubTabs !== 'undefined' ? alertsHubTabs : [],
        activeTabId: 'overview',
        hubId: 'alerts-hub',
        icon: 'notifications_active',
        color: '#f43f5e',
        title: 'Alerts & Webhooks Hub',
        tagline: '"Never miss a signal." - real-time alert delivery and programmatic connectivity.',
        purpose: 'The Alerts Hub is the notification and connectivity layer of the terminal. It bridges the gap between the terminal\'s signal engine and your actual trading workflow - pushing actionable alerts via in-terminal feed, Telegram, and outbound webhook to your own algorithmic systems. This hub also provides the leaderboard of best-performing signal types and the AI-generated Daily Market Brief, so that even during periods away from the screen, you stay informed and prepared.',
        whoIsItFor: 'All users - from part-time traders who cannot monitor charts continuously, to algorithmic traders who need programmatic signal delivery. Price Alerts are especially valuable for anyone setting entry triggers at specific technical levels. The Market Brief is the minimum daily context for any user who wants to maintain situational awareness without spending hours in the terminal.',

        keyTerms: [
            { icon: 'notifications', term: 'Signal Alert', def: 'An automated notification dispatched when a tracked asset crosses a predefined statistical threshold. AlphaSignal generates three alert types: Z-Score Spike (momentum anomaly), Whale Move (large on-chain transaction detected), and Regime Change (market structure classification shift). Alerts carry severity ratings: CRITICAL, HIGH, MEDIUM, and LOW.' },
            { icon: 'webhook', term: 'Webhook', def: 'An outbound HTTP POST request automatically sent to a URL of your choice when a specified event occurs. In the AlphaSignal context, each alert can blast a structured JSON payload to your trading bot, Discord server, Excel spreadsheet, or any endpoint that accepts HTTP. Webhooks enable full automation - the terminal can trigger your execution system without any human intervention.' },
            { icon: 'price_check', term: 'Price Alert', def: 'A custom user-configured trigger that fires when a specific asset crosses a target price level. Unlike signal alerts (which are system-generated), Price Alerts are fully user-defined. Best practice is to set Price Alerts at key technical levels identified during chart analysis - so the alert confirms a thesis rather than being created reactively.' },
            { icon: 'leaderboard', term: 'Signal Leaderboard', def: 'A time-ranked table of all historical signals sorted by return performance. It answers the question: which signal types, across which assets, and in which market conditions have historically generated the most alpha? The leaderboard is updated with every closed signal outcome - providing a live, growing dataset of what actually works.' },
        ],

        views: [
            { icon: 'notifications', name: 'Live Signal Alerts', badge: 'LIVE', route: 'alerts-hub', desc: 'Real-time alert card feed filtered by severity (CRITICAL/HIGH/MEDIUM/LOW). Each card shows alert type, asset ticker, severity badge, and a one-line action summary. CRITICAL alerts pulse with a red glow border. Severity filter controls allow noise reduction during high-activity periods.', howToUse: 'During high-volatility sessions, filter to CRITICAL only to prevent alert fatigue. During quiet markets, include MEDIUM to catch early setups building momentum.' },
            { icon: 'add_alert', name: 'Price Alerts', badge: 'CUSTOM', route: 'price-alerts-hub', desc: 'Custom price trigger manager for any tracked asset. Alert Manager Table shows all active, triggered, and expired alerts with distance-to-target percentage. Alert creation form includes thesis note field and browser push notification toggle.', howToUse: 'Set price alerts before a trade session - not during. Identify key technical levels in the Charting suite, then set alerts at those levels so you respond to signal confirmation, not impulse.' },
            { icon: 'leaderboard', name: 'Signal Leaderboard', badge: 'LIVE', route: 'leaderboard-hub', desc: 'Ranked performance table of all signals sorted by ROI across 7D/30D/90D/All-Time horizons. Shows rank, signal type, asset, direction, return, win rate, and average holding period.', howToUse: 'Sort by 30D to see what signal types are working in the current regime. Signal types consistently ranking in the top 3 across all time horizons are all-weather strategies - allocate to these with higher conviction.' },
            { icon: 'article', name: 'Market Brief', badge: 'AI', route: 'market-brief-hub', desc: 'AI-generated daily market brief (updated 06:00 UTC) across five structured sections: Overnight Summary, Signal Environment, Macro Watch, Risk Signals, and Actionable Ideas. Synthesises all terminal data into a 3-minute morning read.', howToUse: 'Read the Market Brief before any other view. The Actionable Ideas section is pre-prioritised - if it is empty, the model has no high-conviction setup and cash is the best position.' },
            { icon: 'webhook', name: 'Webhooks', badge: 'API', route: 'webhooks', desc: 'Configure outbound JSON webhook endpoints for external automation. Set Z-score threshold, select event types, and test payload delivery. Alerts blast structured data including ticker, direction, z_score, alpha_score, and timestamp.', howToUse: 'Configure a webhook to your own trading bot or a Discord channel for passive monitoring. Use the Test Payload button to validate your endpoint before going live.' },
            { icon: 'archive', name: 'Signal Archive', badge: 'HISTORY', route: 'signal-archive', desc: 'Historical record of all signals with outcome tracking (WIN/LOSS/OPEN). Filter by date range, asset, direction, and outcome. Running cumulative P&L curve shows the full live track record.', howToUse: 'Filter by WIN and look for common conditions across the winning signals. This is your pattern recognition training - what did the best signals share in terms of Z-score, regime, and sector?' },
        ],

        workflowTip: 'The most effective alert configuration: (1) Enable Telegram connection for off-screen alerts. (2) Set the Z-score threshold to 1.75 to receive only statistically significant alerts. (3) Configure at least one Price Alert per active position at your stop-loss level - this creates forced discipline. (4) Read the Market Brief every morning before markets open. These four habits together constitute a complete passive monitoring system.',

        relatedHubs: [
            { name: 'Strategy & Backtester', view: 'alpha-hub', icon: 'electric_bolt' },
            { name: 'Active Positions', view: 'my-terminal', icon: 'person' },
            { name: 'Exchange Connections', view: 'exchange-keys', icon: 'cable' },
        ]
    });
}


// ============= 7. ACTIVE POSITIONS (MY TERMINAL) =============
function renderHubOverviewMyTerminal() {
    renderHubOverviewPage({
        hubId: 'my-terminal',
        icon: 'person',
        color: '#34d399',
        title: 'Active Positions Hub',
        tagline: '"Your personal command layer." - live P&L tracking, AI chat, and your personalised intelligence dashboard.',
        purpose: 'The Active Positions Hub is the personalised layer of the AlphaSignal terminal - the space that reflects your specific portfolio, your watchlist, and your current positions. While every other hub provides market-wide intelligence, this hub contextualises that intelligence around what you specifically hold. It includes a live multi-asset watchlist with inline P&L tracking for both crypto and equity positions, the AI Ask Terminal for real-time conversational analysis, and the Command Center dashboard that aggregates the terminal\'s most important signals into a single-screen institutional overview.',
        whoIsItFor: 'Every authenticated user. Whether you hold 2 assets or 20, this hub keeps your portfolio performance visible and current throughout the trading session. The Dashboard is the recommended default landing view for experienced users who want a compressed, high-density read of the entire terminal\'s current state in under 30 seconds.',

        keyTerms: [
            { icon: 'bookmark_add', term: 'Watchlist', def: 'Your curated list of assets to monitor, complete with entry price, current price, live P&L (Crypto via Binance WebSocket, Equities via Yahoo Finance API), and custom target price. The watchlist is the personal layer of the terminal - every asset you track appears with live data, so there is no need to check external apps for portfolio performance.' },
            { icon: 'dashboard', term: 'Command Center Dashboard', def: 'The highest-density view in the entire terminal. A single screen containing 9 live components: Fear & Greed Gauge, ETF Net Flows indicator, Volatility Regime dial, Market Pulse correlations, Scatter Plot, Confidence Radar, Macro Correlation Matrix, CME Gaps registry, and BTC sparkline. Designed to be scanned in under 30 seconds to determine the daily market posture.' },
            { icon: 'smart_toy', term: 'Ask Terminal (AI Chat)', def: 'An AI assistant fine-tuned on AlphaSignal\'s full data context. Ask it what the current Z-score leader is, which assets have the highest ML confidence this week, or what the macro setup looks like for the next 48 hours. It responds using live terminal data rather than generic knowledge, making it the fastest way to synthesise information across multiple hubs simultaneously.' },
        ],

        views: [
            { icon: 'bookmark_add', name: 'Watchlist & Positions', badge: 'LIVE', route: 'my-terminal', desc: 'Live cross-asset watchlist table: Ticker, Added Price, Current Price, P&L (%), Target Price (inline editable), and Status. Supports both crypto (Binance live prices) and equities (Yahoo Finance). Includes a Portfolio Summary stat bar and Notification Preference Controls.', howToUse: 'Add every position you currently hold. Set a target price for each. When Status shows "TARGET HIT!", execute your planned exit - do not let the target discipline break down in the moment.' },
            { icon: 'dashboard', name: 'Command Center', badge: 'LIVE', route: 'command-center', desc: '9-panel institutional dashboard: Fear & Greed gauge, ETF Net Flows, Volatility Regime, Market Pulse correlations, Confidence Radar, Macro Correlation Matrix, CME Gaps Panel, Performance Stats, and BTC price sparkline. Aggregates the most important signals into a single framed view.', howToUse: 'Set this as your browser screen each morning. The entire dashboard should be read in under 60 seconds - if every panel is green/positive, it is a risk-on day. Reds across the board = reduce or hedge.' },
            { icon: 'smart_toy', name: 'Ask Terminal', badge: 'AI', route: 'ask-terminal', desc: 'Conversational AI interface trained on live terminal data. Query across Z-scores, ML signals, macro conditions, and on-chain metrics in natural language. Suggested chips provide structured starting queries.', howToUse: 'Use this when you want synthesised intelligence across multiple hubs quickly. Ask "Which assets have the highest ML confidence today?" or "What is the macro setup for the next 48 hours?" rather than navigating each hub individually.' },
        ],

        workflowTip: 'Start your morning on the Command Center Dashboard. In 30 seconds you will know: the Fear & Greed reading (market sentiment), ETF flows (institutional conviction), CME gaps (target price levels), and current Volatility Regime. Then open the Watchlist to check overnight P&L on positions. Finally, ask the Ask Terminal for today\'s highest-conviction signals. Total morning routine: under 3 minutes.',

        relatedHubs: [
            { name: 'Alerts & Webhooks', view: 'alerts-hub', icon: 'notifications_active' },
            { name: 'Strategy & Backtester', view: 'alpha-hub', icon: 'electric_bolt' },
            { name: 'Trade Ledger Audit', view: 'audit-hub', icon: 'trending_up' },
        ]
    });
}


// ============= 8. EXCHANGE CONNECTIONS HUB =============
function renderHubOverviewExchangeKeys() {
    renderHubOverviewPage({
        hubId: 'exchange-connections',
        icon: 'cable',
        color: '#ef4444',
        title: 'Exchange Connections Hub',
        tagline: '"From signal to execution in one click." - institutional API connectivity and algorithmic automation.',
        purpose: 'The Exchange Connections Hub is the final link in the AlphaSignal institutional chain - connecting the terminal\'s AI-generated signals directly to live exchange execution. By securely linking exchange API keys, users unlock 1-Click execution from any Signal Card, eliminating the delay between identifying an opportunity and acting on it. The hub also supports outbound Algorithmic Webhooks, allowing users to forward signals to their own trading bots, automation scripts, or team notification systems in real-time.',
        whoIsItFor: 'Premium Institutional members who want to close the signal-to-execution gap. Active traders who recognise that the difference between acting in 3 seconds vs 30 seconds is often the difference between a good fill and significant slippage. Algorithmic traders who want to integrate AlphaSignal signals into their own automation pipelines.',

        keyTerms: [
            { icon: 'key', term: 'API Key', def: 'A credential that grants programmatic access to your exchange account. AlphaSignal requires keys with TRADE permission only - withdrawal permission is never required and should never be enabled for security. Keys are encrypted at rest using AES-256 and are never transmitted in plaintext. Once linked, the terminal can submit limit and market orders on your behalf from the Signal Feed.' },
            { icon: 'webhook', term: 'Algorithmic Webhook', def: 'When a signal crosses your configured Z-score threshold, the terminal automatically sends an HTTP POST request containing a JSON payload to any URL you specify. The payload includes: ticker, direction, z_score, alpha_score, ml_confidence, entry_price, and timestamp. This allows zero-latency, zero-human-intervention signal forwarding to any external system.' },
            { icon: 'bolt', term: '1-Click Execution', def: 'Once an exchange API key is successfully linked, a fast execution button appears on every Signal Card in the Signal Intelligence view. Clicking it opens a pre-populated order form with the signal\'s suggested entry price, direction, and ATR-calculated position size. A single confirmation click submits the order directly to the exchange, bypassing the need to log into the exchange separately.' },
            { icon: 'security', term: 'Encryption at Rest', def: 'API credentials stored in the AlphaSignal KeyVault are encrypted using AES-256 before being written to the database. The decryption key is stored separately and is never accessible via the API or frontend. Even in the event of a database breach, raw API credentials cannot be extracted - only the encrypted ciphertext is stored.' },
        ],

        views: [
            { icon: 'key', name: 'Exchange API Keys', badge: 'SECURE', route: 'exchange-keys', desc: 'Manage exchange API connections for Binance, Bybit, OKX, and Kraken. Credentials are validated on post and encrypted at rest. Once connected, Signal Cards display a 1-Click execution button pre-populated with ATR-calculated position sizes.', howToUse: 'Generate a TRADE-ONLY key on your exchange (no withdrawal permissions). Paste it here and click Validate. Test with a small market order before using for production trades.' },
            { icon: 'webhook', name: 'Algorithmic Webhooks', badge: 'API', route: 'webhooks', desc: 'Configure outbound JSON payload delivery to any HTTP endpoint. Set signal type filters, Z-score threshold, and test connectivity with a live payload preview. Supports Discord, Slack, custom bot endpoints, and any HTTP-accepting automation platform.', howToUse: 'Set the Z-score threshold to 1.75 minimum to filter for genuinely significant signals. Use the Test Payload to verify your endpoint parses the schema correctly before enabling live delivery.' },
        ],

        workflowTip: 'Security checklist before linking API keys: (1) Generate a NEW key specifically for AlphaSignal - never reuse a key from another service. (2) Enable TRADE permissions only - no spot/margin/futures withdrawal. (3) IP whitelist the AlphaSignal server IP for additional security. (4) Set a modest default order size and test with a minimal order before going live. Exchange connectivity is powerful - treat it with the same discipline as managing your own key security.',

        relatedHubs: [
            { name: 'Strategy & Backtester', view: 'alpha-hub', icon: 'electric_bolt' },
            { name: 'Alerts & Webhooks', view: 'alerts-hub', icon: 'notifications_active' },
            { name: 'Portfolio & Risk', view: 'institutional-hub', icon: 'key' },
        ]
    });
}
