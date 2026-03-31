async function renderPortfolioLab(customBasket = null, tabs = null) {
    appEl.innerHTML = skeleton(1);
    const endpoint = customBasket ? `/portfolio-sim?basket=${customBasket}` : '/portfolio-sim';
    const [data, optData] = await Promise.all([
        fetchAPI(endpoint),
        fetchAPI('/portfolio_optimize')
    ]);
    if (!data || !data.metrics) {
        appEl.innerHTML = `<div class="empty-state">
            <span class="material-symbols-outlined" style="font-size:3rem; color:var(--accent); margin-bottom:1rem">hourglass_empty</span>
            <p>Portfolio simulation error. Calibration in progress.</p>
        </div>`;
        return;
    }

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Institutional Hub <span class="premium-badge">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-portfolio-optimizer')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p>Backtesting and simulation of a dynamically rebalanced portfolio driven by Alpha Engine scores.</p>
        </div>
        ${tabs ? renderHubTabs('optimizer', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">AI Portfolio Optimizer</h2>

        <!-- 1. Risk Metrics Row -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1.5rem; margin-bottom: 2rem">
            <div class="card" style="padding:1.5rem; border-top: 4px solid var(--accent)">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">VALUE AT RISK (95% CI)</div>
                <div id="var-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">EST DAILY VAR</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid var(--risk-low)">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">PORTFOLIO BETA</div>
                <div id="beta-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">VS BTC INDEX</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid #f7931a">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">SORTINO RATIO</div>
                <div id="sortino-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">DOWNSIDE ADJ</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid white">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">ANN. VOLATILITY</div>
                <div id="vol-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">REALIZED 30D</div>
            </div>
        </div>

        <!-- 2. Main 2-Column Dashboard -->
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:2rem; margin-bottom: 2rem">
            
            <!-- LEFT COLUMN: Charts & Input -->
            <div style="display:flex; flex-direction:column; gap:2rem">
                <div class="card" style="padding:1.5rem; background:rgba(10,11,30,0.5); backdrop-filter:blur(10px)">
                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">EQUITY CURVE VS BENCHMARK (30D)</h3>
                    <canvas id="portfolioChart" style="max-height:400px"></canvas>
                </div>
                
                <div class="card" style="padding:1.5rem; background:rgba(0, 242, 255, 0.03); border:1px solid var(--accent)">
                    <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">CUSTOM PORTFOLIO BUILDER</h3>
                    <div style="display:flex; flex-direction:column; gap:1rem">
                        <p style="font-size:0.7rem; color:var(--text-dim)">Input target symbols for institutional basket simulation.</p>
                        <input type="text" id="portfolio-basket" placeholder="BTC-USD, ETH-USD, SOL-USD..." 
                               style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:12px; border-radius:8px; font-family:inherit"
                               value="${customBasket || ''}">
                        <button class="action-btn-styled" style="width:100%" 
                                onclick="renderPortfolioLab(document.getElementById('portfolio-basket').value)">
                            SIMULATE BASKET
                        </button>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Analysis & Weights -->
            <div style="display:flex; flex-direction:column; gap:2rem">
                <div class="card" style="padding:1.5rem; background:rgba(0,0,0,0.4)">
                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">INSTITUTIONAL RISK SCORECARD</h3>
                    <div class="metrics-grid" style="display:grid; grid-template-columns: 1fr; gap:1.2rem">
                        <div class="metric-item">
                            <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim)">ALPHA GENERATION</div>
                            <div style="font-size:1.4rem; font-weight:900; color:${data.metrics.alpha_gen >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">
                                ${data.metrics.alpha_gen >= 0 ? '+' : ''}${data.metrics.alpha_gen.toFixed(1)}%
                            </div>
                        </div>
                        <div class="metric-item">
                            <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim)">PROBABLE SHARPE</div>
                            <div id="main-sharpe" style="font-size:1.4rem; font-weight:900; color:white">${data.metrics.sharpe.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div class="card" style="padding:1.5rem; background:rgba(0,0,0,0.4)">
                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">CONSTITUENT WEIGHTINGS</h3>
                    <div class="weights-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap:10px; margin-bottom: 20px">
                        ${Object.entries(data.allocation).map(([ticker, weight]) => `
                            <div style="background:rgba(255,255,255,0.03); padding:8px; border-radius:6px; display:flex; justify-content:space-between; border:1px solid rgba(255,255,255,0.05)">
                                <span style="font-size:0.65rem; font-weight:900; color:white">${ticker.split('-')[0]}</span>
                                <span style="font-size:0.65rem; color:var(--accent)">${weight}%</span>
                            </div>
                        `).join('')}
                    </div>
                    <canvas id="allocationChart" style="max-height:160px"></canvas>
                </div>
            </div>
        </div>

        <!-- 3. Correlation Engine & AI Optimizer Section -->
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:2rem; margin-bottom: 2rem">
            <div class="card" style="padding:1.2rem">
                <h3 style="margin-bottom:1.2rem; font-size:0.85rem; color:var(--accent); letter-spacing:1px">CROSS-ASSET CORRELATION MATRIX (30D)</h3>
                <div id="correlation-heatmap" style="min-height:280px; display:grid; gap:2px"></div>
            </div>
            
            <div class="card" style="padding:1.5rem; background:rgba(0, 242, 255, 0.04); border:1px solid rgba(0, 242, 255, 0.15)">
                <h3 style="margin-bottom:1rem; font-size:0.85rem; color:var(--accent); letter-spacing:1px">AI REBALANCE ADVISORY (MARKOWITZ-SHARPE)</h3>
                <div style="display:flex; gap:2rem; align-items:center">
                    <div style="flex:1">
                        <div id="rebalance-allocations" style="display:flex; flex-direction:column; gap:8px">
                            ${(optData && optData.allocations && optData.allocations.length > 0) ? optData.allocations.map(a => `
                                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                                    <span style="font-size:0.75rem; color:var(--text)">${a.asset}</span>
                                    <span style="font-size:0.75rem; color:var(--accent); font-weight:700">${(a.target_weight * 100).toFixed(1)}%</span>
                                </div>
                            `).join('') : `<p style="font-size:0.7rem; color:var(--risk-high); opacity:0.8">${(optData && optData.error) ? optData.error : 'Data synchronization in progress...'}</p>`}
                        </div>
                        <!-- Phase 17-C: AI Rebalancer -->
                        <button class="intel-action-btn secondary" style="margin-top:0.5rem; width:100%; background:linear-gradient(135deg,rgba(0,212,170,0.15),rgba(0,168,150,0.1)); border:1px solid rgba(0,212,170,0.3); color:#00d4aa" onclick="document.getElementById('ai-rebalancer-section').style.display='block'; renderAIRebalancer()">
                            <span class="material-symbols-outlined" style="font-size:1.1rem; vertical-align:middle; margin-right:8px">smart_toy</span>
                            AI REBALANCER (GPT MEMO)
                        </button>                        <button class="intel-action-btn" style="margin-top:1.5rem; width:100%" onclick="executeRebalance()">
                            <span class="material-symbols-outlined" style="font-size:1.1rem; vertical-align:middle; margin-right:8px">sync_alt</span>
                            EXECUTE REBALANCE
                        </button>
                    </div>
                    <div style="width:160px; height:160px">
                        <canvas id="optimizer-chart-lab"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 1. Portfolio vs Benchmark Chart
    try {
        const ctxPort = document.getElementById('portfolioChart').getContext('2d');
        new Chart(ctxPort, {
            type: 'line',
            data: {
                labels: data.history.map(h => h.date),
                datasets: [
                    {
                        label: 'ALPHA PORTFOLIO',
                        data: data.history.map(h => h.portfolio),
                        borderColor: 'var(--accent)',
                        backgroundColor: 'rgba(0, 242, 255, 0.05)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 2,
                        pointBackgroundColor: 'var(--accent)'
                    },
                    {
                        label: 'BTC BENCHMARK',
                        data: data.history.map(h => h.benchmark),
                        borderColor: '#f7931a',
                        borderDash: [2, 2],
                        borderWidth: 3,
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: 'var(--text-dim)', font: { size: 10, family: 'JetBrains Mono' } } 
                    },
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.05)' }, 
                        ticks: { color: 'var(--text-dim)', font: { size: 10, family: 'JetBrains Mono' }, callback: v => v + '%' }
                    }
                },
                plugins: {
                    legend: { labels: { color: 'white', font: { weight: '800', size: 11 } } },
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        backgroundColor: 'rgba(10,11,30,0.9)',
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 }
                    }
                }
            }
        });
    } catch (e) {
        console.error("Portfolio Chart Error:", e);
    }

    // 2. Allocation Donut Chart
    try {
        const ctxAlloc = document.getElementById('allocationChart').getContext('2d');
        new Chart(ctxAlloc, {
            type: 'radar',
            data: {
                labels: Object.keys(data.allocation),
                datasets: [{
                    label: 'Allocation %',
                    data: Object.values(data.allocation),
                    backgroundColor: 'rgba(0, 242, 255, 0.2)',
                    borderColor: '#00f2ff',
                    borderWidth: 2,
                    pointBackgroundColor: '#00f2ff',
                    pointBorderColor: 'rgba(255,255,255,0.8)',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#8b949e', font: { size: 9, family: 'JetBrains Mono' } },
                        ticks: { display: false, backdropColor: 'transparent' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(10,11,30,0.9)', titleFont: { size: 13 }, bodyFont: { size: 12 } }
                }
            }
        });
    } catch (e) {
        console.error("Allocation Chart Error:", e);
    }

    // 2.1 AI Optimizer Donut Chart (NEW)
    if (optData && optData.allocations) {
        try {
            const ctxOpt = document.getElementById('optimizer-chart-lab').getContext('2d');
            new Chart(ctxOpt, {
                type: 'doughnut',
                data: {
                    labels: optData.allocations.map(a => a.asset),
                    datasets: [{
                        data: optData.allocations.map(a => parseFloat((a.target_weight * 100).toFixed(1))),
                        backgroundColor: ['#facc15', '#60a5fa', '#22c55e', '#ef5350', '#8b5cf6'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } catch (e) {
            console.error("Optimizer Chart Error:", e);
        }
    }

    // 4. Efficient Frontier — load async after initial render
    setTimeout(async () => {
        // Inject the frontier container into appEl
        const existingFrontier = document.getElementById('efficient-frontier-section');
        if (!existingFrontier) {
            const efSection = document.createElement('div');
            efSection.id = 'efficient-frontier-section';
            efSection.innerHTML = `
                <div class="card" style="padding:1.5rem; margin-bottom:2rem; background:rgba(5,5,30,0.7); border:1px solid rgba(0,242,255,0.15);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
                        <h3 style="font-size:0.9rem; color:var(--accent); letter-spacing:1px; margin:0;">
                            <span class="material-symbols-outlined" style="vertical-align:middle; margin-right:6px; font-size:1.1rem;">scatter_plot</span>
                            MARKOWITZ EFFICIENT FRONTIER
                            <span class="premium-badge pulse" style="margin-left:8px;">PRO</span>
                        </h3>
                        <span style="font-size:0.55rem; color:var(--text-dim);">2,000 MONTE CARLO SIMULATIONS</span>
                    </div>
                    <div id="ef-loading" style="text-align:center; padding:3rem; color:var(--text-dim); font-size:0.7rem;">
                        <div class="loader" style="margin:0 auto 1rem;"></div>
                        Running Monte Carlo simulations...
                    </div>
                    <canvas id="frontierChart" style="display:none; max-height:420px;"></canvas>
                    <div id="frontier-optimal-cards" style="display:none; display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-top:1.5rem;"></div>
                </div>`;
            appEl.appendChild(efSection);
        }

        try {
            const basket = customBasket || 'BTC-USD,ETH-USD,SOL-USD,LINK-USD,ADA-USD';
            const ef = await fetchAPI(`/efficient-frontier?basket=${encodeURIComponent(basket)}`);
            const loadingEl = document.getElementById('ef-loading');
            const chartEl = document.getElementById('frontierChart');
            const cardsEl = document.getElementById('frontier-optimal-cards');

            if (!ef || !ef.points || ef.points.length === 0) {
                if (loadingEl) loadingEl.innerHTML = `<span style="color:var(--risk-high)">${ef?.error || 'Frontier calculation failed.'}</span>`;
                return;
            }

            if (loadingEl) loadingEl.style.display = 'none';
            if (chartEl) chartEl.style.display = 'block';

            // Build scatter dataset colored by Sharpe
            const minSharpe = Math.min(...ef.points.map(p => p.sharpe));
            const maxSharpe = Math.max(...ef.points.map(p => p.sharpe));
            const sharpeRange = maxSharpe - minSharpe || 1;

            function sharpeColor(s) {
                const t = (s - minSharpe) / sharpeRange;
                const r = Math.round(239 * (1 - t));
                const g = Math.round(80 + 166 * t);
                return `rgba(${r},${g},80,0.7)`;
            }

            const ctx = document.getElementById('frontierChart').getContext('2d');
            new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Simulated Portfolios',
                            data: ef.points.map(p => ({ x: p.vol, y: p.ret })),
                            backgroundColor: ef.points.map(p => sharpeColor(p.sharpe)),
                            pointRadius: 3,
                            pointHoverRadius: 5,
                        },
                        ef.max_sharpe ? {
                            label: '★ Max Sharpe',
                            data: [{ x: ef.max_sharpe.vol, y: ef.max_sharpe.ret }],
                            backgroundColor: '#00f2ff',
                            pointRadius: 12,
                            pointStyle: 'star',
                            pointHoverRadius: 14,
                        } : null,
                        ef.min_vol ? {
                            label: '★ Min Volatility',
                            data: [{ x: ef.min_vol.vol, y: ef.min_vol.ret }],
                            backgroundColor: '#ffffff',
                            pointRadius: 12,
                            pointStyle: 'star',
                            pointHoverRadius: 14,
                        } : null,
                    ].filter(Boolean)
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'white', font: { family: 'JetBrains Mono', size: 10 } } },
                        tooltip: {
                            backgroundColor: 'rgba(5,5,30,0.95)',
                            titleColor: '#00f2ff',
                            bodyColor: '#e6edf3',
                            callbacks: {
                                label: ctx => `Vol: ${ctx.parsed.x.toFixed(1)}%  Ret: ${ctx.parsed.y.toFixed(1)}%`
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Annualised Volatility (%)', color: 'var(--text-dim)', font: { size: 10 } },
                            grid: { color: 'rgba(255,255,255,0.04)' },
                            ticks: { color: 'var(--text-dim)', font: { family: 'JetBrains Mono', size: 9 }, callback: v => v + '%' }
                        },
                        y: {
                            title: { display: true, text: 'Annualised Return (%)', color: 'var(--text-dim)', font: { size: 10 } },
                            grid: { color: 'rgba(255,255,255,0.04)' },
                            ticks: { color: 'var(--text-dim)', font: { family: 'JetBrains Mono', size: 9 }, callback: v => v + '%' }
                        }
                    }
                }
            });

            // Optimal portfolio weight cards
            if (cardsEl && ef.max_sharpe && ef.min_vol) {
                cardsEl.style.display = 'grid';
                const renderWeights = (p, label, color) => `
                    <div style="background:rgba(0,0,0,0.3); border:1px solid ${color}33; border-radius:10px; padding:1.2rem;">
                        <div style="font-size:0.6rem; font-weight:900; color:${color}; margin-bottom:0.8rem; letter-spacing:1px;">${label}</div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:0.8rem;">
                            ${Object.entries(p.weights).map(([asset, w]) => `
                                <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:6px 10px; font-size:0.65rem;">
                                    <span style="color:white; font-weight:900;">${asset}</span>
                                    <span style="color:${color}; margin-left:6px;">${(w * 100).toFixed(1)}%</span>
                                </div>`).join('')}
                        </div>
                        <div style="display:flex; gap:1.5rem; font-size:0.65rem; color:var(--text-dim);">
                            <span>Ret: <b style="color:white;">${p.ret.toFixed(1)}%</b></span>
                            <span>Vol: <b style="color:white;">${p.vol.toFixed(1)}%</b></span>
                            <span>Sharpe: <b style="color:${color};">${p.sharpe.toFixed(2)}</b></span>
                        </div>
                    </div>`;
                cardsEl.innerHTML =
                    renderWeights(ef.max_sharpe, '★ MAXIMUM SHARPE RATIO PORTFOLIO', '#00f2ff') +
                    renderWeights(ef.min_vol, '★ MINIMUM VOLATILITY PORTFOLIO', '#ffffff');
            }
        } catch (e) {
            console.error('Efficient Frontier render error:', e);
        }
    }, 800);
}

