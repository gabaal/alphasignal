function createTradingViewChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { 
            background: { color: '#09090b' }, 
            textColor: '#d1d5db',
            fontSize: 10,
            fontFamily: 'JetBrains Mono'
        },
        grid: { 
            vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, 
            horzLines: { color: 'rgba(255, 255, 255, 0.03)' } 
        },
        rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
        width: container.clientWidth || 800,
        height: container.clientHeight || 300
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444', 
        borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444'
    });

    const formatted = data.map(d => {
        let ts = d.unix_time || Math.floor(new Date(d.date || d.timestamp).getTime() / 1000);
        return {
            time: ts,
            open: d.open || d.price,
            high: d.high || d.price,
            low: d.low || d.price,
            close: d.close || d.price
        };
    }).filter(d => !isNaN(d.time)).sort((a,b) => a.time - b.time);

    candleSeries.setData(formatted);
    chart.timeScale().fitContent();
    return chart;
}
// Global state variables are now centralized in js/core.js

// PWA Offline Monitoring
async function renderHeatmap() {
    appEl.innerHTML = skeleton(4);
    const data = await fetchAPI('/heatmap');
    if (!data) return;
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>Statistical Intensity Heatmap</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-liquidity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Visualizing real-time Z-score deviations across the institutional universe.</p>
        </div>
        
        <div class="heatmap-legend">
            <div class="legend-labels">
                <span class="neg">EXTREME BREAKDOWN (-3SD)</span>
                <span class="pos">EXTREME BREAKOUT (+3SD)</span>
            </div>
            <div class="legend-bar"></div>
        </div>

        <div class="heatmap-grid">
            ${data.map(sec => `
                <div class="heatmap-sector">
                    <h3>${sec.sector}</h3>
                    <div class="heatmap-assets">
                        ${sec.assets.map(a => {
                            const intensity = Math.min(Math.abs(a.zScore) / 3, 1);
                            const color = a.zScore >= 0 ? `rgba(0,255,136,${0.2 + intensity * 0.7})` : `rgba(255,62,62,${0.2 + intensity * 0.7})`;
                            // White text for intense backgrounds, dark for light
                            const textColor = intensity > 0.5 ? '#fff' : '#000';
                            const border = Math.abs(a.zScore) > 2.5 ? `1px solid ${a.zScore > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}` : '1px solid var(--border)';
                            
                            return `
                                <div class="heatmap-box" 
                                     onclick="openDetail('${a.ticker}', '${sec.sector}')"
                                     style="background: ${color}; border: ${border}; color: ${textColor};" 
                                     title="${a.ticker}: ${a.change > 0 ? '+' : ''}${a.change}% (Z=${a.zScore}, Div=${a.divergence})">
                                    ${a.ticker.split('-')[0]}
                                    ${Math.abs(a.divergence) > 0.5 ? `<div class="divergence-dot" title="Sentiment Divergence Detected: ${a.divergence}"></div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>`;
}

// ============= Detail Overlay =============
function renderChart(history) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (window.detailChart) window.detailChart.destroy();

    const datasets = [{
        label: 'Price',
        data: history.map(h => h.price),
        borderColor: '#00f2ff',
        backgroundColor: 'rgba(0,242,255,0.05)',
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        tension: 0.2
    }];

    if (window.activeOverlays.ema) {
        datasets.push({
            label: 'EMA 12',
            data: history.map(h => h.ema12),
            borderColor: '#ff00ff',
            borderWidth: 1.5,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
        });
        datasets.push({
            label: 'EMA 26',
            data: history.map(h => h.ema26),
            borderColor: '#ff8800',
            borderWidth: 1.5,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
        });
    }

    if (window.activeOverlays.vol) {
        datasets.push({
            label: 'Upper Band',
            data: history.map(h => h.upper),
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            fill: '+1',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            pointRadius: 0
        });
        datasets.push({
            label: 'Lower Band',
            data: history.map(h => h.lower),
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            fill: false,
            pointRadius: 0
        });
    }

    window.detailChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => h.date),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: window.activeOverlays.ema || window.activeOverlays.vol, labels: { color: 'white', font: { size: 10, family: 'JetBrains Mono' } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { 
                        color: '#888', 
                        font: { family: 'JetBrains Mono' },
                        callback: function(value) {
                            return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value);
                        }
                    } 
                },
                x: { grid: { display: false }, ticks: { color: '#888', font: { family: 'JetBrains Mono' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } }
            }
        }
    });
}

// ============= Pack G2: Mindshare View =============
function renderWhaleFlowChart(history) {
    const ctx = document.getElementById('whale-flow-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => `${h.hour}h`),
            datasets: [{
                label: 'Net Flow',
                data: history.map(h => h.flow),
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#666', font: { size: 10 } }
                }
            }
        }
    });
}

function renderMonteCarloChart(data) {
    const ctx = document.getElementById('monteCarloChart');
    if (!ctx) return;
    if (window.activeMCChart) window.activeMCChart.destroy();

    const datasets = [];

    // Faint sample paths behind bands
    (data.paths || []).forEach((p, i) => {
        datasets.push({
            label: `Path ${i+1}`, data: p,
            borderColor: `rgba(0, 242, 255, 0.06)`,
            borderWidth: 1, pointRadius: 0, fill: false, tension: 0.2
        });
    });

    // P95 upper band (green fill to P50)
    if (data.p95) {
        datasets.push({
            label: 'P95 Bull', data: data.p95,
            borderColor: 'rgba(34,197,94,0.5)', borderWidth: 1.5,
            backgroundColor: 'rgba(34,197,94,0.08)',
            pointRadius: 0, fill: '+1', tension: 0.3
        });
    }

    // P50 median (bright white line)
    if (data.p50) {
        datasets.push({
            label: 'Median (P50)', data: data.p50,
            borderColor: 'rgba(255,255,255,0.85)', borderWidth: 2.5,
            pointRadius: 0, fill: false, tension: 0.3
        });
    }

    // P5 lower band (red fill to P50)
    if (data.p5) {
        datasets.push({
            label: 'P5 Bear', data: data.p5,
            borderColor: 'rgba(239,68,68,0.5)', borderWidth: 1.5,
            backgroundColor: 'rgba(239,68,68,0.08)',
            pointRadius: 0, fill: '-1', tension: 0.3
        });
    }

    // Current price baseline
    datasets.push({
        label: 'Current Spot',
        data: Array(data.dates.length).fill(data.current_price),
        borderColor: 'rgba(255,62,62,0.35)', borderWidth: 2,
        borderDash: [5, 5], pointRadius: 0, fill: false
    });

    window.activeMCChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: { labels: data.dates, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { filter: (item) => ['Median (P50)', 'P95 Bull', 'P5 Bear', 'Current Spot'].includes(item.text),
                              color: '#888', font: { family: 'JetBrains Mono', size: 10 }, boxWidth: 12 }
                },
                tooltip: { enabled: false },
                datalabels: { display: false }
            },
            scales: {
                x: { grid: { display:false }, ticks: { color: '#888', font: { family: 'JetBrains Mono', size:10 }, maxRotation:0 } },
                y: { position: 'right', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888', font: { family: 'JetBrains Mono' }, callback: (val) => '$' + val.toLocaleString() } }
            }
        }
    });
}

function renderWalkForwardPanel(data) {
    const el = document.getElementById('walk-forward-panel');
    if (!el || !data.folds) return;
    const rows = data.folds.map(f => {
        const decay = f.out_sample_sharpe < f.in_sample_sharpe;
        return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
            <td style="padding:8px 4px;color:var(--text-dim);font-size:0.72rem">Fold ${f.fold}</td>
            <td style="padding:8px 4px;font-size:0.72rem;color:#aaa">${f.period}</td>
            <td style="padding:8px;font-size:0.72rem;text-align:center">${f.best_fast}/${f.best_slow}</td>
            <td style="padding:8px;font-size:0.72rem;text-align:center;color:#facc15">${f.in_sample_sharpe}</td>
            <td style="padding:8px;font-size:0.72rem;text-align:center;color:${decay ? '#ef4444' : '#22c55e'}">${f.out_sample_sharpe}</td>
        </tr>`;
    }).join('');
    el.innerHTML = `
        <table style="width:100%;border-collapse:collapse">
            <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
                <th style="padding:6px 4px;font-size:0.6rem;letter-spacing:1px;color:var(--text-dim);text-align:left">FOLD</th>
                <th style="padding:6px 4px;font-size:0.6rem;letter-spacing:1px;color:var(--text-dim);text-align:left">PERIOD</th>
                <th style="padding:6px;font-size:0.6rem;letter-spacing:1px;color:var(--text-dim);text-align:center">FAST/SLOW</th>
                <th style="padding:6px;font-size:0.6rem;letter-spacing:1px;color:#facc15;text-align:center">IN-SAMPLE</th>
                <th style="padding:6px;font-size:0.6rem;letter-spacing:1px;color:#aaa;text-align:center">OUT-OF-SAMPLE</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <p style="font-size:0.7rem;color:var(--text-dim);margin-top:8px;line-height:1.4">
            Walk-forward validation splits 2Y of history into 6 train/test folds. In-sample Sharpe is optimised; 
            out-of-sample Sharpe tests decay of edge on unseen data.
        </p>`;
}

async function runStrategyCompare(ticker) {
    const lb = document.getElementById('strategy-leaderboard');
    const tag = document.getElementById('leaderboard-tag');
    if (!lb) return;
    lb.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:var(--text-dim);font-size:0.85rem"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:18px">sync</span>Running all 15 strategies on ${ticker}...</div>`;
    if (tag) tag.textContent = ticker;
    try {
        const data = await fetchAPI(`/strategy-compare?ticker=${ticker}`);
        if (!data || !data.strategies) { lb.textContent = 'Failed to load'; return; }
        const rows = data.strategies.map((s, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
            return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
                <td style="padding:7px 4px;font-size:0.72rem;color:var(--text-dim)">${medal}</td>
                <td style="padding:7px 4px;font-size:0.75rem">${s.label}</td>
                <td style="padding:7px;font-size:0.75rem;text-align:center;color:${s.sharpe > 0 ? '#22c55e' : '#ef4444'};font-weight:600">${s.sharpe}</td>
                <td style="padding:7px;font-size:0.75rem;text-align:center;color:${s.return > 0 ? '#22c55e' : '#ef4444'}">${s.return > 0 ? '+' : ''}${s.return}%</td>
                <td style="padding:7px;font-size:0.75rem;text-align:center;color:#ef4444">${s.maxDD}%</td>
            </tr>`;
        }).join('');
        lb.innerHTML = `<table style="width:100%;border-collapse:collapse">
            <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
                <th style="padding:5px 4px;font-size:0.6rem;letter-spacing:1px;color:var(--text-dim)">#</th>
                <th style="padding:5px 4px;font-size:0.6rem;letter-spacing:1px;color:var(--text-dim);text-align:left">STRATEGY</th>
                <th style="padding:5px;font-size:0.6rem;letter-spacing:1px;color:#22c55e;text-align:center">SHARPE</th>
                <th style="padding:5px;font-size:0.6rem;letter-spacing:1px;color:var(--text-dim);text-align:center">180D RTN</th>
                <th style="padding:5px;font-size:0.6rem;letter-spacing:1px;color:#ef4444;text-align:center">MAX DD</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
    } catch(e) { lb.innerHTML = `<p style="color:#ef4444;font-size:0.8rem">Compare failed: ${e.message}</p>`; }
}


function renderStrategyChart(curve) {
    const ctx = document.getElementById('strategyChart').getContext('2d');
    if (window.activeStrategyChart) window.activeStrategyChart.destroy();

    window.activeStrategyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: curve.map(p => p.date),
            datasets: [
                {
                    label: 'Strategy Equity',
                    data: curve.map(p => p.portfolio),
                    borderColor: '#00f2ff',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(0, 242, 255, 0.05)'
                },
                {
                    label: 'Benchmark (BTC)',
                    data: curve.map(p => p.benchmark || p.btc),
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#8b949e', font: { family: 'Outfit', weight: 800, size: 10 } } },
                tooltip: { 
                    backgroundColor: 'rgba(13, 17, 23, 0.95)',
                    titleColor: '#00f2ff',
                    bodyColor: '#e6edf3',
                    borderColor: '#30363d',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) { return context.dataset.label + ': ' + context.parsed.y + '%'; }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#8b949e', maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { family: 'JetBrains Mono', size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 }, callback: value => value + '%' } }
            }
        }
    });
}

function cleanupAdvChart() {
    if (activeBinanceWS) { activeBinanceWS.close(); activeBinanceWS = null; }
    if (window.activeHeatmap) {
        window.activeHeatmap.destroy();
        window.activeHeatmap = null;
    }
    if (window.activeDepth3D) {
        cancelAnimationFrame(window.activeDepth3D.animId);
        window.activeDepth3D.renderer.dispose();
        window.activeDepth3D = null;
    }
    const c = document.getElementById('advanced-chart-container');
    if (c) c.innerHTML = '<div class="loader" style="margin:4rem auto"></div>';
}

function renderAdvancedChart() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">candlestick_chart</span> Advanced Charting <span class="premium-badge">PRO SUITE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-advanced-charting')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                <p>Multi-dimensional analysis powered by live Binance feeds.</p>
            </div>
            <div style="display:flex; gap:10px; padding-bottom:10px;">
                <select id="adv-symbol" style="background:var(--card-bg); color:var(--text); border:1px solid var(--border); padding:5px 10px; border-radius:4px; font-family:'JetBrains Mono'">
                    <optgroup label="Core Assets" style="background:#111">
                        <option value="BTCUSDT">BTC/USDT</option>
                        <option value="ETHUSDT">ETH/USDT</option>
                        <option value="SOLUSDT">SOL/USDT</option>
                    </optgroup>
                    <optgroup label="Institutional Proxies" style="background:#111">
                        <option value="MSTR">MSTR (MicroStrategy)</option>
                        <option value="COIN">COIN (Coinbase)</option>
                        <option value="MARA">MARA (Marathon)</option>
                    </optgroup>
                    <optgroup label="High Volatility" style="background:#111">
                        <option value="DOGEUSDT">DOGE/USDT</option>
                        <option value="PEPEUSDT">PEPE/USDT</option>
                    </optgroup>
                </select>
                <select id="adv-interval" style="background:var(--card-bg); color:var(--text); border:1px solid var(--border); padding:5px 10px; border-radius:4px; font-family:'JetBrains Mono'">
                    <option value="1m">1m</option>
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="1d">1d</option>
                </select>
                <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.03); padding:4px 12px; border-radius:20px; border:1px solid rgba(255,255,255,0.1)">
                    <span style="font-size:0.7rem; color:var(--text-dim); font-weight:800; letter-spacing:1px">HEATMAP</span>
                    <label class="switch" style="transform:scale(0.7)">
                        <input type="checkbox" id="heatmap-toggle" onchange="toggleHeatmapOverlay()">
                        <span class="slider round"></span>
                    </label>
                    <input type="range" id="heatmap-intensity" min="0" max="1" step="0.1" value="0.6" style="width:60px" oninput="updateHeatmapIntensity(this.value)">
                </div>
            </div>
        </div>
        
        <div style="display:flex; gap:1rem; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.5rem; overflow-x:auto">
            <button class="filter-btn active" id="tab-overview" onclick="setAdvTab('overview')">Price & Overlays</button>
            <button class="filter-btn" id="tab-pulse" onclick="setAdvTab('pulse')">Liquidation Pulse</button>
            <button class="filter-btn" id="tab-depth" onclick="setAdvTab('depth')">Market Depth 3D</button>
            <button class="filter-btn" id="tab-derivatives" onclick="setAdvTab('derivatives')">Derivatives (OI)</button>
            <button class="filter-btn" id="tab-comparative" onclick="setAdvTab('comparative')">Comparative Index</button>
            <button class="filter-btn" id="tab-cvd" onclick="setAdvTab('cvd')">CVD Order Flow</button>
            <button class="filter-btn" id="tab-exchange" onclick="setAdvTab('exchange')">Exchange Flows</button>
            <button class="filter-btn" id="tab-funding" onclick="setAdvTab('funding')">Funding Rates</button>
            <button class="filter-btn" id="tab-tape-imbalance" onclick="setAdvTab('tape-imbalance')">Tape Imbalance</button>
            <button class="filter-btn" id="tab-options-surface" onclick="setAdvTab('options-surface')">Vol Surface</button>
        </div>

        <div class="card" style="padding:1rem; min-height:500px; position:relative;">
            <div id="advanced-chart-container" style="width:100%; height:500px; border-radius:8px; overflow:hidden;"></div>
            
            <div id="heatmap-legend-overlay" style="position:absolute; bottom:30px; left:30px; z-index:10; background:rgba(13,17,23,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:12px; font-size:0.65rem; color:#d1d5db; pointer-events:none; backdrop-filter:blur(8px); display:none; flex-direction:column; gap:8px;">
                <div style="font-weight:900; color:var(--accent); letter-spacing:1.5px; margin-bottom:4px; font-size:0.55rem; text-transform:uppercase">Liquidity Atlas</div>
                <div style="display:flex; align-items:center; gap:10px">
                    <div style="width:12px; height:4px; background:linear-gradient(to right, hsla(180,100%,20%,0.8), hsla(180,100%,80%,0.8)); border-radius:2px;"></div>
                    <span>Institutional Bids</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px">
                    <div style="width:12px; height:4px; background:linear-gradient(to right, hsla(0,100%,20%,0.8), hsla(45,100%,80%,0.8)); border-radius:2px;"></div>
                    <span>Institutional Asks</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px">
                    <div style="width:12px; height:4px; background:#ffd700; border-radius:2px; box-shadow:0 0 6px rgba(255,215,0,0.6)"></div>
                    <span>Structural Walls (>4h)</span>
                </div>
                <div style="margin-top:4px; color:var(--text-dim); font-size:0.55rem; font-style:italic">Normalization: Relative to Visible Volume</div>
            </div>
        </div>
    `;
    
    document.getElementById('adv-symbol').addEventListener('change', dispatchAdvTab);
    document.getElementById('adv-interval').addEventListener('change', dispatchAdvTab);

    window.setAdvTab = (tab) => {
        currentAdvTab = tab;
        document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        dispatchAdvTab();
    };

    dispatchAdvTab();
}

// ============================================================
// Phase 9: On-Chain Analytics Dashboard
// ============================================================