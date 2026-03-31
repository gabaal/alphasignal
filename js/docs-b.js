function renderDocsStrategyLab() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#bc13fe">science</span>Documentation &mdash; Strategy Lab</h1>
            <p>Quantitative strategy framework, walk-forward validation, and Monte Carlo simulation.</p>
        </div>
        <div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:0.75rem">Available Strategies</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
                    ${[
                        ['Pairs Trading', 'Statistical arbitrage between correlated assets using Z-Score divergence. Entry when spread crosses 2 standard deviations, exit at mean reversion.'],
                        ['Momentum Ignition', 'Detects institutional momentum triggers via volume acceleration above the 2.5x rolling average. Rides the ignition window.'],
                        ['Regime Carry', 'Allocates long when the market regime is trending or accumulation. Sits in cash during distribution regimes.'],
                        ['Kelly Sizer', 'Dynamic position sizing using the Kelly Criterion against historical win rate and risk-reward. Capped at 25% max allocation.'],
                        ['Dual Momentum', 'Gary Antonacci absolute + relative momentum hybrid. Rotates between BTC, equities, and cash based on 12-month lookback.']
                    ].map(([name, desc]) => `
                        <div style="background:rgba(188,19,254,0.05);border:1px solid rgba(188,19,254,0.15);border-radius:8px;padding:1rem">
                            <div style="font-size:0.7rem;font-weight:800;color:#bc13fe;margin-bottom:6px">${name}</div>
                            <div style="font-size:0.75rem;color:var(--text-dim);line-height:1.6">${desc}</div>
                        </div>`).join('')}
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:0.75rem">Walk-Forward Validation</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The Strategy Lab runs each strategy through a parametric walk-forward test that splits the historical window into rolling in-sample (training) and out-of-sample (test) periods. The Sharpe Ratio, MaxDD, and CAGR are computed on the out-of-sample only to prevent overfitting.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:0.75rem">Monte Carlo Percentile Bands</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">1,000 Monte Carlo simulations are run by randomly sampling and re-ordering the daily return sequence. The P5, P50, and P95 bands show the range of plausible equity curves under different luck distributions &mdash; helping identify whether the strategy's edge is real or luck-dependent.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:0.75rem">Strategy Comparison Leaderboard</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Click <strong>COMPARE STRATEGIES</strong> to run all 5 strategies simultaneously and rank by Sharpe, CAGR, or Max Drawdown in the leaderboard table. Useful for identifying the optimal strategy for current market regime.</p>
            </div>

            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB</button>
                <button class="intel-action-btn" onclick="switchView('strategy-lab')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800"><span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW</button>
            </div>
        </div>`;
}

function renderDocsBacktesterV2() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#00d4aa">analytics</span>Documentation &mdash; Signal Backtester V2</h1>
            <p>Walk-forward simulation using live institutional signal history and real price data.</p>
        </div>
        <div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#00d4aa;margin-bottom:0.75rem">How It Works</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Backtester V2 pulls the last 200 signals from the live <code>alerts_history</code> database, fetches 2 years of real price data per ticker via Yahoo Finance, and simulates entries at the signal date with exits after the configured hold period (3, 5, 10, or 20 trading days). Benchmarks each trade against a buy-and-hold BTC position over the same period.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#00d4aa;margin-bottom:0.75rem">Key Metrics</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
                    ${[
                        ['Win Rate', 'Percentage of trades that closed profitable. >55% is considered edge over random.'],
                        ['Profit Factor', 'Total gross profit / total gross loss. >1.5 indicates a robust strategy.'],
                        ['Sharpe Ratio', 'Annualised risk-adjusted return. >1.0 = good, >2.0 = exceptional.'],
                        ['Max Drawdown', 'Largest peak-to-trough decline in equity. The key measure of tail risk.'],
                        ['Calmar Ratio', 'CAGR divided by Max Drawdown. >1.0 = strong risk-adjusted performance.'],
                        ['Alpha/Beta Badge', 'Excess return vs BTC for each trade. Positive = strategy beat the benchmark.']
                    ].map(([m, d]) => `<div style="background:rgba(0,212,170,0.05);border:1px solid rgba(0,212,170,0.1);border-radius:8px;padding:1rem"><div style="font-size:0.65rem;font-weight:800;color:#00d4aa;margin-bottom:4px">${m}</div><div style="font-size:0.75rem;color:var(--text-dim);line-height:1.5">${d}</div></div>`).join('')}
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#00d4aa;margin-bottom:0.75rem">Monthly P&L Calendar</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The calendar heatmap aggregates all signal P&Ls by month. Colour intensity maps to the magnitude of the monthly return &mdash; dark green = strong positive month, dark red = significant drawdown month. Hover for exact figures.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#00d4aa;margin-bottom:0.75rem">Rolling Sharpe Chart</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The dual-axis chart plots cumulative strategy return (teal) vs BTC benchmark (orange) on the left axis, and the rolling 30-day Sharpe ratio (purple) on the right. When Sharpe dips below 0, the strategy is underperforming on a risk-adjusted basis for that window.</p>
            </div>

            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB</button>
                <button class="intel-action-btn" onclick="switchView('backtester-v2')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800"><span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW</button>
            </div>
        </div>`;
}

function renderDocsTradingView() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#2196f3">show_chart</span>Documentation &mdash; TradingView Integration</h1>
            <p>Professional-grade charting embedded directly in the AlphaSignal terminal.</p>
        </div>
        <div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#2196f3;margin-bottom:0.75rem">Access</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Navigate to <strong>Advanced Charting</strong> and click the <span style="color:#2196f3;font-weight:700">TRADINGVIEW</span> tab. The widget loads automatically synced to your currently selected symbol and timeframe.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#2196f3;margin-bottom:0.75rem">Supported Symbols</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8rem">
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:BTCUSDT</strong> &mdash; Bitcoin / Tether</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:ETHUSDT</strong> &mdash; Ethereum / Tether</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:SOLUSDT</strong> &mdash; Solana / Tether</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:DOGEUSDT</strong> &mdash; Dogecoin / Tether</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">NASDAQ:MSTR</strong> &mdash; MicroStrategy</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">NASDAQ:COIN</strong> &mdash; Coinbase Global</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">NASDAQ:MARA</strong> &mdash; Marathon Digital</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:PEPEUSDT</strong> &mdash; PEPE / Tether</div>
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#2196f3;margin-bottom:0.75rem">Pre-loaded Studies</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The widget loads with four institutional studies pre-applied: <strong>50-period Simple Moving Average</strong>, <strong>RSI (14)</strong>, <strong>MACD (12/26/9)</strong>, and <strong>Bollinger Bands (20, 2)</strong>. Additional studies, drawing tools, and price alerts can be added directly within the widget.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#2196f3;margin-bottom:0.75rem">Export & Pop-out</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Use the widget's built-in <strong>camera icon</strong> to snapshot the chart, or the <strong>pop-out button</strong> to open a full 1200x700 window for deeper analysis. These are TradingView native features and work independently of AlphaSignal's export engine.</p>
            </div>

            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB</button>
                <button class="intel-action-btn" onclick="switchView('advanced-charting')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800"><span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW</button>
            </div>
        </div>`;
}




// --- Global Markets Hub ---
function renderDocsETFFlows() {
    renderExplainPage(
        "Bitcoin Spot ETF Flows Monitor",
        "Daily institutional capital flow tracking across all SEC-approved Bitcoin spot ETF vehicles.",
        "AlphaSignal's ETF Flows view aggregates daily net flow data across BlackRock IBIT, Fidelity FBTC, ARK ARKB, Bitwise BITB, and 7 further vehicles. Net inflows indicate institutional accumulation; consistent outflows signal de-risking. The 7-day rolling total is the highest-signal variant — single-day swings are noise, sustained directional flows are regime-defining.",
        [
            { icon: 'account_balance', title: 'Daily Net Flow Bar Chart', desc: 'Per-ETF and aggregate net flow bars for the trailing 30 days. Color-coded green for inflows, red for outflows.' },
            { icon: 'timeline', title: '7D Rolling Totals', desc: 'Smoothed 7-day cumulative net flow by vehicle. Sustained +$1B+ weekly inflows historically precede bullish price continuations.' },
            { icon: 'table_chart', title: 'AUM League Table', desc: 'Ranked ETF AUM snapshot with today\'s flow, 7D total, and YTD net flow — allowing quick identification of dominant flow vehicles.' },
            { icon: 'notifications_active', title: 'Outflow Reversal Alerts', desc: 'When a previously positive-flow ETF switches to sustained outflow for 3+ days, a system alert fires via the Alerts hub.' }
        ],
        [{ title: 'Identifying Institutional Accumulation Windows', text: 'In March 2024, sustained IBIT inflows exceeding $500M/day for 5 consecutive days preceded a 22% BTC rally. The ETF Flow tracker flagged the regime shift before price confirmed.' }],
        "ETF flow data from BitMEX Research, The Block, and Farside Investors. AUM data from SEC 13F filings and ETF provider daily disclosures. Updated daily by 20:00 UTC."
    , 'etf-flows'
    );
}

function renderDocsLiquidations() {
    renderExplainPage(
        "Liquidation Cascade Scanner",
        "Real-time leveraged position wipeout detection across major derivatives venues.",
        "The Liquidation Scanner aggregates forced liquidation events from Binance, OKX, Bybit, and Deribit in near real-time. Sustained high-volume liquidations — especially clustered cascades — are leading indicators of capitalisation events. The scanner distinguishes between routine liquidations and systemic cascades by applying a rolling hourly Z-score deviation filter.",
        [
            { icon: 'local_fire_department', title: 'Live Liquidation Feed', desc: 'Timestamped liquidation events by venue, direction (long/short), and USD size. Large block liquidations are highlighted.' },
            { icon: 'bar_chart', title: 'Cascade Heatmap', desc: 'Price-binned heatmap showing cumulative liquidation volume at each price level — revealing where leverage clusters exist ahead of the market.' },
            { icon: 'trending_down', title: 'Long/Short Ratio', desc: 'Rolling ratio of long-vs-short liquidations. Extreme long-liquidation events (>80% of volume) signal capitulation bottoms.' },
            { icon: 'warning_amber', title: 'Cascade Alert System', desc: 'When 15-minute liquidation volume exceeds 2.5x its 30-day rolling average, a CASCADE WARNING fires to the terminal.' }
        ],
        [{ title: 'The Cascade Bottom Signal', text: 'On a major flash crash day, the scanner registered $480M in long liquidations within 90 minutes — the highest reading in 60 days. This extreme reading historically signals within 72 hours of a local bottom.' }],
        "Liquidation data from Binance WebSocket, OKX, Bybit, and Deribit public API streams. Large liquidation definition: single event >$1M USD equivalent. Cascade definition: 15m volume >2.5x 30D average."
    , 'liquidations'
    );
}

function renderDocsOIRadar() {
    renderExplainPage(
        "Open Interest Radar",
        "Cross-asset perpetual futures open interest tracking with funding rate overlay.",
        "Open Interest (OI) measures the total dollar value of all open derivative positions on an asset. Rising OI with rising price confirms a healthy trend; rising OI with falling price signals aggressive shorting. The OI Radar monitors the top 20 perpetual futures markets across Binance, Bybit, and OKX, with real-time funding rate overlay to distinguish directional from hedged positioning.",
        [
            { icon: 'track_changes', title: 'OI League Table', desc: 'Top 20 perp markets ranked by total OI, with 24h OI change percentage and current funding rate alongside price.' },
            { icon: 'area_chart', title: 'OI vs Price Overlay', desc: '72-hour chart of OI and price together — divergences (OI rising + price falling) are flagged as potential short squeeze setups.' },
            { icon: 'payments', title: 'Funding Rate Monitor', desc: 'Live funding rates per asset. Sustained negative funding (shorts paying longs) signals an overcrowded short that historically resolves with a squeeze.' },
            { icon: 'bolt', title: 'OI Spike Alerts', desc: 'When OI surges >15% within a 4-hour window, the system fires an alert — a key leading indicator of either a breakout or a trap.' }
        ],
        [{ title: 'Detecting the Short Squeeze Setup', text: 'BTC OI increased 18% in 6 hours while price was flat and funding turned negative at -0.05%. The OI Radar flagged the extreme short positioning. A 12% squeeze followed within 24 hours.' }],
        "OI data from Binance, Bybit, and OKX perpetuals REST APIs. Funding rates from Coinglass aggregator. Updated every 15 minutes."
    , 'oi-radar'
    );
}

function renderDocsCMEGaps() {
    renderExplainPage(
        "CME Bitcoin Gap Analysis",
        "Identifying, tracking, and trading unfilled Bitcoin CME futures gaps.",
        "CME Bitcoin futures trade Monday–Friday during regular US market hours. When spot crypto moves significantly over the weekend while CME is closed, it creates a 'gap' between Friday's close and Monday's open. Statistical analysis of 4+ years of CME gap data shows that approximately 78% of gaps are eventually filled — making gap identification a high-probability trade setup for patient institutional traders.",
        [
            { icon: 'pivot_table_chart', title: 'Active Gap Registry', desc: 'Live list of all unfilled CME gaps with price level, gap size ($), gap size (%), days open, and historical fill probability score.' },
            { icon: 'history', title: 'Gap Fill History', desc: 'Historical record of all prior gaps with fill status, time-to-fill, and the price action context at time of formation.' },
            { icon: 'calculate', title: 'Fill Probability Scoring', desc: 'Each gap scored 0–100 by size, direction, current distance from price, and age. Higher scores = higher mean-reversion statistical probability.' },
            { icon: 'show_chart', title: 'Gap Distance Monitor', desc: 'Live tracking of BTC\'s distance from each open gap level, updated in real-time to identify when price approaches fill territory.' }
        ],
        [{ title: 'The Gap Fade Trade', text: 'After a bullish Sunday rally left a $5,200 gap below at $58,400, the CME Gap tracker scored it HIGH priority. A tactical partial short at $63,000 captured a 7% move back to partially fill the gap within 4 trading days.' }],
        "CME gap data calculated from CME BTC front-month futures Friday close vs Monday open. Price data via yfinance. Gap fill probability scoring uses 2022-2024 historical gap dataset."
    , 'cme-gaps'
    );
}

// --- Macro Intel Hub ---
function renderDocsFlow() {
    renderExplainPage(
        "Capital Flows Monitor",
        "Velocity and direction of institutional capital rotating into and out of the crypto ecosystem.",
        "Capital flow analysis tracks three primary channels of institutional capital: spot ETF flows (regulated capital), stablecoin supply expansion (on-ramp capital ready to deploy), and exchange net position changes (capital moving into self-custody vs to exchanges for selling). The synthesis of these three streams provides the most complete picture of institutional money movement available outside regulated prime broker data.",
        [
            { icon: 'swap_horiz', title: 'ETF Net Flow Aggregator', desc: 'Daily consolidated net flow across all 11 US Bitcoin spot ETFs. Sustained positive flow = institutional accumulation regime.' },
            { icon: 'currency_exchange', title: 'Stablecoin Supply Velocity', desc: 'Week-over-week USDT + USDC supply growth rate. Rapid expansion signals incoming buy-side pressure as dry powder builds on exchanges.' },
            { icon: 'account_balance', title: 'Exchange Net Position Change', desc: 'Rolling 30-day change in BTC held on exchanges vs self-custody. Declining exchange balances = reduced sell pressure (bullish signal).' },
            { icon: 'trending_up', title: 'Composite Flow Score', desc: 'AlphaSignal\'s proprietary score (0–100) combining all three channels into a single capital flow conviction indicator.' }
        ],
        [{ title: 'The Institutional Accumulation Signal', text: 'When ETF flows turned positive ($300M+ weekly), stablecoin supply grew 4% in 2 weeks, AND exchange balances dropped 15K BTC in a month simultaneously, the composite score hit 84/100 — preceding a 35% BTC rally over the next 6 weeks.' }],
        "ETF flows from Farside Investors. Stablecoin supply from CoinGecko and Glassnode public APIs. Exchange balance data from CryptoQuant and on-chain aggregation via Blockchain.info."
    , 'flow'
    );
}

function renderDocsRotation() {
    renderExplainPage(
        "Sector Rotation Tracker",
        "Capital rotation across crypto sectors visualised through a weighted treemap and momentum matrix.",
        "Crypto capital does not move uniformly — it rotates through sector narratives in sequence: typically Bitcoin leads, followed by large-cap L1s, then DeFi, then lower-cap narratives. AlphaSignal's Sector Rotation Tracker monitors the relative strength and momentum of 8 major sectors simultaneously, enabling traders to position ahead of sector rotations rather than chasing them.",
        [
            { icon: 'rotate_right', title: 'Weighted Sector Treemap', desc: 'Live treemap showing relative market cap and 7-day performance across Layer 1, DeFi, AI, Memes, RWA, Gaming, Infra, and L2 sectors.' },
            { icon: 'grid_on', title: 'Momentum Matrix', desc: '8×4 matrix of sector performance across 1D, 7D, 30D, and 90D timeframes — identifying which sectors are leading and which are lagging.' },
            { icon: 'speed', title: 'Rotation Velocity Score', desc: 'Measures the rate at which capital is entering or exiting each sector relative to BTC. High positive velocity = rotation is in early stages.' },
            { icon: 'notifications', title: 'Beta Expansion Alerts', desc: 'When a sector\'s 7-day beta to BTC exceeds 2.0 (outperforming BTC 2:1+), a rotation alert fires — historically a leading signal of narrative momentum.' }
        ],
        [{ title: 'DeFi Rotation Signal', text: 'After BTC consolidated at $60K for 3 weeks, the Momentum Matrix showed DeFi sector switching from negative to positive 7D momentum while BTC was flat. Rotation alert fired. DeFi sector gained 40% over the following 3 weeks.' }],
        "Sector performance data from CoinGecko sector classifications and 7-day price returns. Sector definitions updated monthly. Beta calculations use 90-day rolling correlation to BTC-USD price series."
    , 'rotation'
    );
}

// --- Alpha Strategy Hub ---
function renderDocsMacroCompass() {
    renderExplainPage(
        "Macro Compass",
        "A synthesised dashboard tracking the global macro environment and its impact on digital assets.",
        "The Macro Compass aggregates key macro signals — equity correlation, DXY strength, yield curve shapes, and commodity trends — into a coherent view. Bitcoin has a 0.6–0.8 rolling correlation with risk-on assets during macro stress events, making macro context essential for timing entries and exits across all terminal instruments.",
        [
            { icon: 'public',        title: 'Macro Correlation Matrix', desc: 'Rolling 30-day correlations between BTC, SPX, NASDAQ, DXY, Gold, and 10Y Treasury yields.' },
            { icon: 'show_chart',    title: 'Yield Curve Monitor',      desc: 'US Treasury 2Y/10Y/30Y spread tracking. Sustained inversion has preceded risk-off environments.' },
            { icon: 'trending_down', title: 'DXY Impact Model',         desc: 'Real-time DXY overlay against BTC to quantify the inverse relationship and identify dollar-driven moves.' },
            { icon: 'layers',        title: 'Risk Regime Overlay',      desc: 'Current macro regime classification (Risk-On / Risk-Off / Transitional) based on equity volatility and credit spreads.' }
        ],
        [{ title: 'The DXY Breakout Trade', text: 'When DXY broke above 105 following hotter-than-expected CPI, the Compass immediately flagged a shift to Risk-Off regime. BTC declined 8% over 72 hours.' }],
        "Federal Reserve FRED database, DTCC yield curve data, and Bloomberg cross-asset correlation matrices. Updated daily."
    , 'macro'
    );
}

function renderDocsMacroCalendar() {
    renderExplainPage(
        "Macro Event Calendar",
        "A 90-day forward calendar of institutional macro events scored by historical BTC impact.",
        "The Macro Event Calendar tracks scheduled economic releases — FOMC decisions, CPI prints, NFP reports, and PCE data — and scores each by its average historical BTC price impact over the past 6 occurrences. This turns the economic calendar from a passive reference into an active positioning tool.",
        [
            { icon: 'event',         title: 'Event Timeline',        desc: '90-day chronological listing of macro events with days-until countdown and event type badge.' },
            { icon: 'bar_chart',     title: 'Historical BTC Impact', desc: 'Per-event scoring showing median BTC move, average volatility, and historical directional bias.' },
            { icon: 'warning',       title: 'Impact Tier Badges',    desc: 'Events classified HIGH / MEDIUM / LOW by weighted impact score, enabling rapid calendar triage.' },
            { icon: 'timeline',      title: 'Historical Move Bars',  desc: 'Bar chart showing the last 6 real BTC same-date moves for each event instance.' }
        ],
        [{ title: 'Pre-FOMC Positioning', text: 'FOMC meetings average 4.2% BTC volatility on announcement day. The calendar HIGH impact flag and historical bars gave traders a clear reference for sizing hedges in advance.' }],
        "FOMC, CPI, NFP, and PCE schedules from the Federal Reserve and BLS. Historical impact scored against 2-year BTC price data via yfinance."
    , 'macro-calendar'
    );
}

function renderDocsNarrative() {
    renderExplainPage(
        "Narrative Galaxy",
        "A force-directed graph visualising the social and informational gravity of crypto market narratives.",
        "Markets move on narratives before they move on fundamentals. The Narrative Galaxy maps conceptual clusters being discussed across Twitter/X, Reddit, and Telegram — showing which themes are gaining momentum, which are crowded, and which are quietly building beneath the surface.",
        [
            { icon: 'hub', title: 'Force-Directed Cluster Map', desc: 'Each narrative is a node. Related narratives are pulled together by semantic similarity. Node size reflects mention volume.' },
            { icon: 'speed', title: 'Narrative Velocity', desc: 'Tracks the rate of mention growth for each cluster. High-velocity narratives (>200% 7-day growth) often precede price moves.' },
            { icon: 'sentiment_satisfied', title: 'Sentiment Polarity', desc: 'Green nodes carry net bullish sentiment; red nodes bearish. Intensity scales with conviction level.' },
            { icon: 'warning_amber', title: 'Saturation Warning', desc: 'When a narrative reaches maximum mindshare without new information, it is flagged as a Crowded Trade contrarian signal.' }
        ],
        [{ title: 'Quiet Accumulation Detection', text: 'Three weeks before a major L2 announcement, the Galaxy detected rising semantic clustering around the project with low social volume. Early-positioning traders captured the subsequent 40% move.' }],
        "NLP processing of 100K+ daily social posts via keyword embedding models. Cluster assignments updated every 6 hours."
    , 'narrative'
    );
}

// --- Institutional Hub ---
function renderDocsTokenUnlocks() {
    renderExplainPage(
        "Token Unlock Schedule",
        "Forward-looking schedule of major token vesting unlocks and their projected sell pressure.",
        "Token unlocks are scheduled supply emission events where previously locked tokens — held by early investors, team members, or protocol treasuries — become tradeable. Large unlocks create predictable sell pressure windows. AlphaSignal tracks the next 90 days of unlock events across 50+ protocols, scored by unlock size relative to circulating supply.",
        [
            { icon: 'key', title: 'Unlock Calendar', desc: 'Chronological listing of upcoming unlocks with date, volume, USD value at current price, and % of circulating supply.' },
            { icon: 'bar_chart', title: 'Supply Shock Score', desc: 'Each unlock scored 0-100 based on size as % of float, recipient category (team vs investor), and vesting cliff structure.' },
            { icon: 'trending_down', title: 'Historical Price Impact', desc: 'For recurring protocols, shows actual price performance in the 7 days before and after prior unlock events.' },
            { icon: 'notifications_active', title: 'Unlock Alerts', desc: 'Configurable alerts for unlocks exceeding a user-defined supply shock threshold, delivered 7 days and 24 hours in advance.' }
        ],
        [{ title: 'The Investor Unlock Fade', text: 'A $120M investor unlock was tracked 3 weeks in advance. The HIGH Supply Shock Score prompted traders to open a tactical short 5 days prior, capturing a 9% decline into the unlock date.' }],
        "Token unlock data from TokenUnlocks.app and CryptoRank. Verified against on-chain vesting contract monitoring."
    , 'token-unlocks'
    );
}

function renderDocsYieldLab() {
    renderExplainPage(
        "Yield Lab",
        "A multi-protocol yield aggregator and DeFi rate comparison engine for institutional allocators.",
        "The Yield Lab consolidates staking APYs, lending rates, and liquidity provision yields across major DeFi protocols and CeFi venues. The lab normalises rates for comparative analysis, models impermanent loss risk for LP positions, and tracks the historical spread between DeFi and TradFi risk-free rates.",
        [
            { icon: 'biotech', title: 'Protocol Rate Comparison', desc: 'Side-by-side APY comparison across Aave, Compound, Lido, Rocket Pool, and 10+ venues, updated hourly.' },
            { icon: 'calculate', title: 'Risk-Adjusted Yield', desc: 'Adjusts raw APY for smart contract risk (audit score), liquidity depth, and token concentration.' },
            { icon: 'candlestick_chart', title: 'Yield Curve History', desc: 'Historical chart of key protocol yields over time to identify yield compression and expansion cycles.' },
            { icon: 'account_balance', title: 'DeFi vs TradFi Spread', desc: 'Tracks the spread between top DeFi lending rates and the US 3-month T-Bill — widening spread signals DeFi relative attractiveness.' }
        ],
        [{ title: 'Carry Trade Optimisation', text: 'When ETH staking yield expanded to 5.2% vs a 4.3% US 10Y yield, the Yield Lab flagged a 90bps positive carry opportunity, enabling institutions to justify an ETH overweight.' }],
        "Protocol yield data from DeFiLlama, on-chain rate queries via The Graph, and US Treasury rates from the Federal Reserve FRED API."
    , 'yield-lab'
    );
}

function renderDocsTradeLab() {
    renderExplainPage(
        "Trade Idea Lab",
        "An AI-assisted workspace for building and validating structured trade ideas before execution.",
        "The Trade Idea Lab provides a structured environment for developing systematic trade theses. Define your conviction, set risk parameters, and the lab generates a structured execution plan — complete with an AI-generated trade thesis memo. All ideas can be auto-converted into execution tickets in the Trade Ledger with a single click.",
        [
            { icon: 'experiment', title: 'Thesis Builder', desc: 'Guided form to define entry trigger, conviction level, position sizing, stop-loss, and take-profit levels for any asset.' },
            { icon: 'smart_toy', title: 'AI Thesis Memo', desc: 'GPT-powered narrative explaining the trade rationale, key risk factors, and historical analogues — generated from your inputs.' },
            { icon: 'calculate', title: 'Risk/Reward Calculator', desc: 'Automatic R:R ratio calculation, max loss in USD, and expected value computation based on historical win rate.' },
            { icon: 'send', title: 'One-Click Execution', desc: 'Convert any validated trade idea directly into a pending execution ticket in the institutional Trade Ledger.' }
        ],
        [{ title: 'Thesis-to-Ticket Workflow', text: 'An analyst entered a BTC long thesis triggered by a +2.3 Z-score. The AI memo flagged the ETF flow tailwind. The risk calculator sized the position at 4.2% of portfolio. One click sent it to the Trade Ledger.' }],
        "Trade thesis generation powered by GPT-4o-mini. Risk calculations use historical signal win rate from the AlphaSignal backtest database."
    , 'tradelab'
    );
}

// --- Analytics Hub ---
function renderDocsOptionsFlow() {
    renderExplainPage(
        "Options Flow Scanner",
        "Real-time BTC and ETH options data — Put/Call ratio, Max Pain, IV smile, and top OI strikes.",
        "The options market is where institutional traders express high-conviction views with defined risk. AlphaSignal's scanner pulls live data from Deribit — the world's largest crypto options exchange by volume — and synthesises it into actionable intelligence.",
        [
            { icon: 'ssid_chart', title: 'Put/Call Ratio (PCR)', desc: 'Ratio of put volume to call volume. PCR > 1.0 signals bearish hedging; < 0.7 signals directional call buying.' },
            { icon: 'push_pin', title: 'Max Pain Strike', desc: 'The price at which the maximum number of options expire worthless. Price tends to gravitate here near expiry.' },
            { icon: 'area_chart', title: 'IV Smile Chart', desc: 'Implied Volatility plotted across strikes (±30% from ATM), revealing skew and directional market fear.' },
            { icon: 'table_chart', title: 'Top OI Strikes', desc: 'The 10 highest open-interest strikes, showing where market participants have concentrated their positioning.' }
        ],
        [{ title: 'The IV Skew Signal', text: 'When put skew (downside IV premium over ATM) exceeded 15% on BTC, it historically preceded a 7-12% correction within 14 days as institutions loaded protective puts.' }],
        "Live data from Deribit public REST API. BTC and ETH options refreshed every 15 minutes. IV smile computed from front-month expiry strikes."
    , 'options-flow'
    );
}

function renderDocsNewsroom() {
    renderExplainPage(
        "Crypto Newsroom",
        "A curated, real-time feed of institutional-grade crypto news with AI sentiment tagging.",
        "The Newsroom aggregates the highest-signal news sources in the crypto ecosystem, applying NLP sentiment analysis to each headline as it arrives. AlphaSignal's Newsroom filters for institutional relevance — regulatory developments, large protocol announcements, ETF-related news, and macro policy shifts.",
        [
            { icon: 'newspaper', title: 'Live News Feed', desc: 'Real-time crypto news pulled from CryptoPanic RSS, filtered for headline relevance and institutional impact threshold.' },
            { icon: 'psychology', title: 'AI Sentiment Tagging', desc: 'Each headline classified BULLISH / BEARISH / NEUTRAL by a keyword-weighted NLP model trained on crypto-specific vocabulary.' },
            { icon: 'filter_alt', title: 'Category Filters', desc: 'Filter by topic: Regulation, ETF/TradFi, Protocol, Macro, or General to focus on relevant catalysts.' },
            { icon: 'bolt', title: 'Breaking News Alerts', desc: 'High-impact headlines trigger instant dashboard toast notifications to your terminal.' }
        ],
        [{ title: 'Regulatory Front-Running', text: 'An SEC enforcement headline appeared in the Newsroom 4 minutes before price action reflected the news. The BEARISH tag and alert gave users a narrow window to reduce exposure ahead of a 6% pullback.' }],
        "News sourced from CryptoPanic public RSS. NLP sentiment classification via keyword embedding model. Breaking news detection threshold: 3+ simultaneous high-impact keyword matches."
    , 'newsroom'
    );
}

// --- Audit & Performance Hub ---
function renderDocsTradeLedger() {
    renderExplainPage(
        "Institutional Trade Ledger",
        "A persistent, auditable record of all AI-generated execution tickets and manual trade ideas.",
        "The Trade Ledger is the terminal's audit trail. Every execution ticket generated by the AI Rebalancer, Trade Idea Lab, or manually by the user is logged here with full metadata: asset, direction, size, entry price, status, and AI thesis. Designed for institutional accountability and regulatory compliance review.",
        [
            { icon: 'list_alt', title: 'Execution Ticket Log', desc: 'Chronologically ordered log of all tickets with asset, direction, position size, entry price, and current status.' },
            { icon: 'assignment_turned_in', title: 'Status Tracking', desc: 'Tickets move through PENDING ? EXECUTED ? CLOSED states with PnL displayed for closed positions.' },
            { icon: 'smart_toy', title: 'AI Thesis Archive', desc: 'Each ticket retains the original AI-generated trade memo for retrospective review and performance attribution.' },
            { icon: 'download', title: 'CSV Export', desc: 'Full ledger export as CSV for offline analysis, compliance reporting, or integration with portfolio management systems.' }
        ],
        [{ title: 'Performance Attribution', text: 'Filtering the Trade Ledger to AI Rebalancer tickets and comparing PnL against a static HODL benchmark quantifies exactly how much alpha the AI system is generating net of transaction costs.' }],
        "All tickets stored in persistent SQLite ledger on the server. Data is user-specific and persists across sessions. Export available at any time."
    , 'trade-ledger'
    );
}

// --- Miscellaneous ---
function renderDocsHeatmap() {
    renderExplainPage(
        "Market Heatmap",
        "A colour-coded visualisation of Z-score deviations across the entire tracked asset universe.",
        "The Market Heatmap provides an at-a-glance overview of where statistical opportunities are concentrated across the 50+ asset universe. Each cell represents one asset; colour intensity reflects the magnitude of its current Z-score deviation from rolling mean returns. This is the fastest way to identify where alpha is currently concentrated.",
        [
            { icon: 'grid_view', title: 'Z-Score Heat Grid', desc: 'Full asset universe displayed as a colour-coded grid — instantly identify which assets have the highest statistical deviation.' },
            { icon: 'palette', title: 'Colour Scale', desc: 'Green = positive Z-score (bullish deviation); Red = negative Z-score (bearish deviation). Intensity scales with sigma magnitude.' },
            { icon: 'filter_alt', title: 'Sector Grouping', desc: 'Assets grouped by sector (L1, DeFi, Memes, AI, Gaming) for rapid sector-level comparison in a single view.' },
            { icon: 'touch_app', title: 'Click-Through Detail', desc: 'Click any cell to open a full signal detail overlay including ML prediction and on-chain metrics.' }
        ],
        [{ title: 'Sector Concentration Scan', text: 'During a DeFi narrative rotation, the heatmap showed 7 of 8 tracked DeFi tokens simultaneously in the +1.5 to +2.5 Z-score band, visually confirming the rotation in progress.' }],
        "Z-score computed from 90-day rolling returns using yfinance OHLCV data. Heatmap refreshed every 5 minutes."
    , 'heatmap'
    );
}

function renderDocsCommandCenter() {
    renderExplainPage(
        "Institutional Command Center",
        "Consolidated master dashboard — every critical signal from every hub, on one screen.",
        "The Command Center is designed for senior traders and portfolio managers who need system-level situational awareness without navigating between hubs. It surfaces the most critical real-time intelligence from each module simultaneously: Conviction Dials, Live Analytics Charts, ETF Flows, Macro Correlation Matrix, Top Alpha Signals, and CME Gap Tracker.\n\nThe four Signal Intelligence Analytics Charts (Alpha vs Z-Score Scatter, Category Mix Donut, BTC Correlation Histogram, Alpha Leaders) are interactive — click any chart to expand it to fullscreen with richer labels and axis annotations.",
        [
            { icon: 'dashboard', title: 'System Conviction Dials', desc: 'Live Fear & Greed, Network Congestion, and Retail FOMO gauges providing a composite read of current market psychology.' },
            { icon: 'scatter_plot', title: 'Alpha vs Z-Score Scatter', desc: 'Quadrant scatter of all live signals. Top-right = quality signals (high alpha + high Z-score). Click to expand with labelled quadrant zones.' },
            { icon: 'donut_large', title: 'Category Mix Donut', desc: 'Real-time sector distribution of the live signal universe. Identifies which categories are currently generating the most signals.' },
            { icon: 'bar_chart', title: 'BTC Correlation Histogram', desc: 'Distribution of BTC correlation values across all tracked assets. Colour-coded: cyan = positively correlated, red = inversely correlated.' },
            { icon: 'leaderboard', title: 'Alpha Leaders Bar', desc: 'Top 8 assets by relative alpha vs the crypto market average. Click to expand to top 12 with full labels.' },
            { icon: 'grid_4x4', title: 'Macro Correlation Matrix', desc: 'Pairwise Pearson correlation heatmap. Click to expand to full size with row/column asset labels and scrollable grid.' },
            { icon: 'account_balance', title: 'ETF Flow Summary', desc: '5-day ETF net flow bar chart showing the most recent institutional capital movement.' },
            { icon: 'electric_bolt', title: 'Top Institutional Alpha', desc: 'Live feed of the 5 highest-conviction signals currently active across the terminal signal universe.' }
        ],
        [{ title: 'Morning Situational Brief', text: 'Open Command Center at market open. The Conviction Dials + Alpha vs Z-Score scatter give a 10-second read on risk appetite and where statistical opportunity is concentrated — before navigating to individual hubs.' }],
        "Aggregates live data from 8 underlying terminal modules. Click any analytics chart to zoom. Click through hub cards to open individual full views."
    , 'command-center'
    );
}

function renderDocsMyTerminal() {
    renderExplainPage(
        "My Terminal",
        "Your personal watchlist, open positions tracker, and portfolio performance summary.",
        "My Terminal is your personalised workspace within the AlphaSignal system. Add any tracked asset to your watchlist with a defined entry price, and the terminal will instantly calculate your live P&L, percentage return, and portfolio-level win rate. It persists across sessions and forms the foundation of your personal institutional trading record.",
        [
            { icon: 'bookmark_add', title: 'Watchlist Management', desc: 'Add any of the 50+ tracked assets to your watchlist with a target entry price. Remove positions with a single click. Managed per-user server-side.' },
            { icon: 'trending_up', title: 'Live P&L Tracking', desc: 'Each watchlist position calculates live P&L in real-time using the WebSocket price feed. Colour-coded green/red for at-a-glance performance.' },
            { icon: 'analytics', title: 'Portfolio Summary Stats', desc: 'Header stats show Average Return across all positions, total Win Rate (% of positions above entry), and number of actively watched assets.' },
            { icon: 'notifications', title: 'Browser Notifications', desc: 'My Terminal requests browser notification permission on load so the terminal can fire price alerts even when the tab is in the background.' },
            { icon: 'person', title: 'Session Persistence', desc: 'Watchlist data is stored server-side and tied to your user account. Your positions survive browser restarts and device changes.' }
        ],
        [
            { title: 'Portfolio Conviction Tracking', text: 'A trader watching 8 positions had 6 in positive P&L. The 75% win rate displayed on the summary header provided a quick confidence check before adding new positions from the Signal Intelligence view.' }
        ],
        "Watchlist stored in server-side SQLite database per user. Live prices sourced from WebSocket feed (BTC/ETH/SOL) and supplemented by the signals endpoint for the full 50+ asset universe."
    , 'my-terminal'
    );
}

function renderDocsAskTerminal() {
    renderExplainPage(
        "Ask Terminal — AI Research Assistant",
        "A conversational AI interface for on-demand institutional research within the terminal.",
        "Ask Terminal is powered by GPT-4o-mini and has full context of the AlphaSignal methodology, signal universe, and current market data. Ask it to explain a Z-score reading, summarise the macro outlook, generate a trading thesis for a specific asset, or interpret an options flow signal.",
        [
            { icon: 'smart_toy', title: 'Contextual AI Research', desc: 'Ask any question about markets, signals, or the terminal methodology. The AI has the full AlphaSignal framework as context.' },
            { icon: 'history', title: 'Conversation History', desc: 'Session-level conversation history maintained so you can build on previous questions without repeating context.' },
            { icon: 'description', title: 'On-Demand Memos', desc: 'Request a structured analysis memo for any asset — the AI synthesises signal data, macro context, and options flow.' },
            { icon: 'translate', title: 'Plain-English Explanations', desc: 'Ask the terminal to explain any metric or indicator in plain English — ideal for onboarding new team members.' }
        ],
        [{ title: 'Rapid Due Diligence', text: 'An analyst asked about the current BTC options skew and what it implies for price. The AI returned a 3-paragraph brief citing PCR, IV skew direction, and historical analogues in under 4 seconds.' }],
        "Powered by OpenAI GPT-4o-mini API. Responses generated in real-time with no caching to ensure contextual accuracy."
    , 'ask-terminal'
    );
}
