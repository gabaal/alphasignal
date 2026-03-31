// ============= MACRO INTEL HUB =============
function renderDocsViewBriefing() {
    renderViewDocPage({
        hub: 'Macro Intelligence', hubIcon: 'monitoring', hubColor: '#a78bfa',
        title: 'Strategy Briefing', viewId: 'briefing',
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
        title: 'Macro Compass', viewId: 'macro',
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
              signals: ['DXY falling from multi-year highs = historically strong crypto tailwind','DXY >105 = headwind for all risk assets including crypto','BTC rising while DXY rising = very bullish — unique internal demand overcoming headwinds'] },
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
        hub: 'Alpha Strategy', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Signal Intelligence', viewId: 'signals',
        summary: 'The core signal engine monitors 50+ assets across MVRV deviations, momentum oscillators, on-chain flows, and social sentiment. Z-score measures how statistically extreme each signal is.',
        components: [
            { name: 'Signal Cards Grid', type: 'WIDGET', icon: 'radar',
              description: 'Each asset generates a card: Ticker, Category, Price, 24h Change, Relative Alpha (%), Sentiment label, BTC Correlation, Z-Score badge. Category filter bar allows sector-level screening. Cards with Z >1.75 pulse with a glow border.',
              howToRead: 'Z-Score colour: cyan (0.5-1.0 mild), amber (1.0-1.75 moderate), red (>1.75 extreme outlier). Positive alpha = asset outperforming BTC. The AI THESIS button generates a GPT-4o-mini trade rationale.',
              signals: ['Z >2.0 with green alpha = extreme bullish outlier; high-conviction long','Z >1.75 with negative alpha = extreme bearish; short candidate or avoid','Bullish sentiment + low Z = early momentum, not yet extreme — watch to confirm','BEARISH + high Z = crowded short; watch for squeeze potential'] },
            { name: 'Strategy Firing Density Histogram (30D)', type: 'CHART', icon: 'bar_chart',
              description: '30-day bar chart of daily signal count. Colour by density: grey (<4), cyan (4-7), amber (7-12), red (>18). Reveals whether the current signal environment is active or quiet.',
              howToRead: 'High bars on the right = active environment. Grey plateau then sudden spike = market waking up. Consecutive red bars = extreme activity coinciding with major price moves.',
              signals: ['3+ red bars in 5 days = hyperactive environment; high volatility period active','Sustained grey for 2+ weeks = low conviction; reduce position sizes','Single sudden red spike after grey = breakout catalyst has triggered'] },
            { name: 'Z-Score Bell Curve Distribution', type: 'CHART', icon: 'area_chart',
              description: 'Histogram of all current Z-scores with a Gaussian curve fitted on top in purple. X-axis: -2σ to +2σ in 0.25 buckets. Bar colours match signal card scheme.',
              howToRead: 'Normal bell = most assets at baseline. Positive skew = broad bullish momentum. Fat tails on both sides = high dispersion market.',
              signals: ['Distribution skewing positive = systematic broad-market strength; index exposure appropriate','Fat tails both sides = pairs trades or sector rotation opportunities','Most assets at Z=0 = low conviction; wait for distribution to widen'] },
            { name: 'Signal Confidence Radar', type: 'CHART', icon: 'track_changes',
              description: '6-axis radar scoring confidence for a selected asset: Momentum, Volatility, Network Activity, Liquidity, Social Hype, Dev Commits. Asset selectable via dropdown.',
              howToRead: 'Large even hexagon = well-rounded conviction. Lopsided shape = single-factor signal, lower reliability.',
              signals: ['High Momentum + Network Activity + Liquidity = strongest signal trinity','High Social Hype + Low Network Activity = hype pump; extreme caution','All axes below 40 = asset is dormant; skip regardless of Z-score'] },
        ]
    });
}
function renderDocsViewMLEngine() {
    renderViewDocPage({
        hub: 'Alpha Strategy', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'ML Alpha Engine', viewId: 'signals',
        summary: 'The dual-model ensemble (LSTM + XGBoost) generates 24h price direction predictions. This view exposes the model internals — confidence scores, feature importances, and agreement metrics.',
        components: [
            { name: 'ML Prediction Table', type: 'TABLE', icon: 'smart_toy',
              description: 'Ranked table: Asset, ML Direction (LONG/SHORT/NEUTRAL), LSTM Confidence %, XGBoost Confidence %, Ensemble Consensus (HIGH/MEDIUM/LOW), Primary reason. Sorted by ensemble confidence.',
              howToRead: 'Focus on HIGH consensus rows — both models agree. Both >70% = elite signal quality.',
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
        hub: 'Alpha Strategy', hubIcon: 'electric_bolt', hubColor: '#facc15',
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
              signals: ['>40% Grade A = euphoric bull; caution on new entries — late cycle','> 60% Grade D = broad capitulation; contrarian buy zone likely forming','Even distribution across A/B/C/D = balanced market; individual asset selection critical'] },
        ]
    });
}
function renderDocsViewStrategyLab() {
    renderViewDocPage({
        hub: 'Alpha Strategy', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Strategy Lab', viewId: 'strategy-lab',
        summary: 'Live strategy testing with institutional metrics. Select a pre-built strategy, configure parameters, and see the equity curve, statistical metrics, and Monte Carlo confidence bands update in real-time.',
        components: [
            { name: 'Strategy Selector & Parameters', type: 'FORM', icon: 'science',
              description: 'Dropdown to select a strategy (MVRV Reversion, Momentum Cross, Regime-Adaptive, VWAP Bounce) with configurable asset, lookback window, and signal threshold.',
              howToRead: 'Start with default parameters. Modify one parameter at a time. Wide thresholds fire fewer but higher-quality signals.',
              signals: ['MVRV Reversion works best in HIGH-VOL regimes','Regime-Adaptive works across all market states','Momentum Cross requires a confirmed trend — check Regime view first before using'] },
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
        hub: 'Alpha Strategy', hubIcon: 'electric_bolt', hubColor: '#facc15',
        title: 'Backtester V2', viewId: 'backtester-v2',
        summary: 'Institutional-grade backtests across the full AlphaSignal history. Every metric is computed on actual historical signals — not reconstructed or curve-fitted.',
        components: [
            { name: 'Rolling Sharpe Ratio Chart', type: 'CHART', icon: 'show_chart',
              description: '30-day rolling Sharpe Ratio time-series across the full backtest period. Reference line at Sharpe = 1.0 marks the minimum acceptable institutional threshold.',
              howToRead: 'Above 1.0 = generating better risk-adjusted returns than 1:1. Above 2.0 = excellent. Below 0 = losing money relative to risk taken.',
              signals: ['Consistently >1.5 over 90+ days = institutionally viable strategy; deploy capital','Dropping from 2.0 to 0.5 = entering difficult regime; reduce exposure','Recovering from negative to positive = regime aligning again'] },
            { name: 'Monthly P&L Heatmap Calendar', type: 'CHART', icon: 'calendar_month',
              description: 'Calendar heatmap of monthly returns: dark green (>+5%), light green (+1-5%), grey (flat), orange (-1 to -5%), red (<-5%). Reveals seasonal patterns in strategy performance.',
              howToRead: 'Look for consistent red or green months across multiple years — these are structural patterns worth accounting for.',
              signals: ['Consistent red in January = reduce exposure in Jan for this strategy','Consistent green in Q4 = end-of-year institutional buying benefits this strategy','Isolated red months surrounded by green = one-off event, not structural'] },
            { name: 'Trade Summary Statistics Panel', type: 'STAT', icon: 'analytics',
              description: 'Full stats: Total Trades, Win Rate %, Avg Win, Avg Loss, Profit Factor (Wins/Losses), Max Drawdown %, Calmar Ratio (Annual Return / Max DD), Best/Worst single trade.',
              howToRead: 'Profit Factor >1.5 = makes .50 per  lost. Win Rate alone misleads — 40% win rate with 3:1 reward/risk beats 70% win rate with 1:2.',
              signals: ['Profit Factor >2.0 = excellent edge; full allocation justified','Max Drawdown >30% = strong risk management protocols required','Calmar >1.0 = annual return exceeds max drawdown; strong risk-adjusted profile'] },
        ]
    });
}
function renderDocsViewSignalArchive() {
    renderViewDocPage({
        hub: 'Alpha Strategy', hubIcon: 'electric_bolt', hubColor: '#facc15',
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
        hub: 'Alpha Strategy', hubIcon: 'electric_bolt', hubColor: '#facc15',
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
