
// ================================================================
// Phase 15-16 Documentation Pages
// ================================================================

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
        </div>`;
}
