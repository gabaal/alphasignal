function createTradingViewChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { 
            background: { color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b' }, 
            textColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#d1d5db',
            fontSize: 10,
            fontFamily: 'JetBrains Mono'
        },
        grid: { 
            vertLines: { color: alphaColor(0.03) }, 
            horzLines: { color: alphaColor(0.03) } 
        },
        rightPriceScale: { borderColor: alphaColor(0.1) },
        timeScale: { borderColor: alphaColor(0.1), timeVisible: true },
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
            borderColor: alphaColor(0.2),
            borderWidth: 1,
            fill: '+1',
            backgroundColor: alphaColor(0.05),
            pointRadius: 0
        });
        datasets.push({
            label: 'Lower Band',
            data: history.map(h => h.lower),
            borderColor: alphaColor(0.2),
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
                    grid: { color: alphaColor(0.05) }, 
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
                    grid: { color: alphaColor(0.05) },
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
            borderColor: alphaColor(0.85), borderWidth: 2.5,
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
                y: { position: 'right', grid: { color: alphaColor(0.05) }, ticks: { color: '#888', font: { family: 'JetBrains Mono' }, callback: (val) => '$' + val.toLocaleString() } }
            }
        }
    });
}

function renderWalkForwardPanel(data) {
    const el = document.getElementById('walk-forward-panel');
    if (!el || !data.folds) return;
    const rows = data.folds.map(f => {
        const decay = f.out_sample_sharpe < f.in_sample_sharpe;
        return `<tr style="border-bottom:1px solid ${alphaColor(0.04)}">
            <td style="padding:8px 4px;color:var(--text-dim);font-size:0.72rem">Fold ${f.fold}</td>
            <td style="padding:8px 4px;font-size:0.72rem;color:#aaa">${f.period}</td>
            <td style="padding:8px;font-size:0.72rem;text-align:center">${f.best_fast}/${f.best_slow}</td>
            <td style="padding:8px;font-size:0.72rem;text-align:center;color:#facc15">${f.in_sample_sharpe}</td>
            <td style="padding:8px;font-size:0.72rem;text-align:center;color:${decay ? '#ef4444' : '#22c55e'}">${f.out_sample_sharpe}</td>
        </tr>`;
    }).join('');
    el.innerHTML = `
        <table style="width:100%;border-collapse:collapse">
            <thead><tr style="border-bottom:1px solid ${alphaColor(0.1)}">
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
    lb.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:6px;padding:4px 0">
            ${[1,2,3,4,5].map(i => `<div style="height:18px;border-radius:4px;background:linear-gradient(90deg,${alphaColor(0.04)} 25%,${alphaColor(0.09)} 50%,${alphaColor(0.04)} 75%);background-size:200% 100%;animation:shimmer 1.4s ${i*0.1}s infinite"></div>`).join('')}
        </div>`;
    if (tag) tag.textContent = ticker;
    try {
        const data = await fetchAPI(`/strategy-compare?ticker=${ticker}`);
        if (!data || !data.strategies) { lb.textContent = 'Failed to load'; return; }
        const rows = data.strategies.map((s, i) => {
            const medal = i === 0 ? '-' : i === 1 ? '-' : i === 2 ? '-' : `${i+1}.`;
            return `<tr style="border-bottom:1px solid ${alphaColor(0.04)}">
                <td style="padding:7px 4px;font-size:0.72rem;color:var(--text-dim)">${medal}</td>
                <td style="padding:7px 4px;font-size:0.75rem">${s.label}</td>
                <td style="padding:7px;font-size:0.75rem;text-align:center;color:${s.sharpe > 0 ? '#22c55e' : '#ef4444'};font-weight:600">${s.sharpe}</td>
                <td style="padding:7px;font-size:0.75rem;text-align:center;color:${s.return > 0 ? '#22c55e' : '#ef4444'}">${s.return > 0 ? '+' : ''}${s.return}%</td>
                <td style="padding:7px;font-size:0.75rem;text-align:center;color:#ef4444">${s.maxDD}%</td>
            </tr>`;
        }).join('');
        lb.innerHTML = `<table style="width:100%;border-collapse:collapse">
            <thead><tr style="border-bottom:1px solid ${alphaColor(0.1)}">
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
                    borderColor: alphaColor(0.2),
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
                        label: function(context) { const v = context.parsed.y; return context.dataset.label + ': ' + (v>=0?'+':'') + v.toFixed(2) + '%'; }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#8b949e', maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { family: 'JetBrains Mono', size: 10 } } },
                y: { grid: { color: alphaColor(0.03) }, ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 }, callback: v => (v>=0?'+':'') + v + '%' } }
            }
        }
    });
}

function cleanupAdvChart() {
    // Close the kline socket - guard against CLOSING (2) / CLOSED (3) states
    // to prevent the "Ping received after close" browser warning
    const bws = window.activeBinanceWS;
    if (bws && bws.readyState === WebSocket.OPEN) {
        bws.onerror = () => {};  // silence any close-race error
        bws.close();
    }
    window.activeBinanceWS = null;

    if (window.activeHeatmap) {
        window.activeHeatmap.destroy();
        window.activeHeatmap = null;
    }
    if (window.activeDepth3D) {
        const ref = window.activeDepth3D;
        // Kill animation loop - both via alive flag (immediate) and cancelAnimationFrame
        if (ref._ref) ref._ref.alive = false;
        cancelAnimationFrame(ref._ref ? ref._ref.id : ref.animId);
        // Disconnect ResizeObserver so it doesn't fire after navigation
        if (ref._ro) { try { ref._ro.disconnect(); } catch(e) {} }
        try {
            // Flag on _animRef closure - still reachable when webglcontextlost fires async
            if (ref._ref) ref._ref.intentionalCleanup = true;
            ref.renderer.forceContextLoss();
            ref.renderer.dispose();
        } catch(e) {}
        window.activeDepth3D = null;
    }
    // Tear down BinanceSocketManager streams silently
    if (window.BinanceSocketManager) {
        Object.values(window.BinanceSocketManager.sockets || {}).forEach(ws => {
            try { if (ws && ws.readyState === WebSocket.OPEN) ws.close(); } catch(e) {}
        });
        window.BinanceSocketManager.sockets = {};
        window.BinanceSocketManager.callbacks = {};
    }
    const c = document.getElementById('advanced-chart-container');
    if (c) c.innerHTML = '<div class="loader" style="margin:4rem auto"></div>';
}


// -
// Multi-Ticker Backtester Comparison
// -
async function runMultiTickerCompare(strategy, fast, slow) {
    fast = fast || 20; slow = slow || 50;
    const btn = document.getElementById('multi-ticker-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'LOADING...'; }
    const tickers = ['BTC-USD', 'ETH-USD', 'SOL-USD'];
    const colors  = { 'BTC-USD': '#00f2ff', 'ETH-USD': '#bc13fe', 'SOL-USD': '#22c55e' };
    try {
        // Stagger fetches 200ms apart to avoid yfinance rate-limiting dropping ETH
        const results = [];
        const tickerLabels = { 'BTC-USD': 'BTC', 'ETH-USD': 'ETH', 'SOL-USD': 'SOL' };
        const progress = ['-', '-', '-'];
        const updateBtn = () => {
            if (btn) btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">compare_arrows</span> ' +
                tickers.map((t,i) => `<span style="margin-left:6px;font-size:0.65rem">${tickerLabels[t]} ${progress[i]}</span>`).join('');
        };
        updateBtn();
        for (let i = 0; i < tickers.length; i++) {
            const t = tickers[i];
            let r = await fetchAPI('/backtest?ticker=' + t + '&strategy=' + strategy + '&fast=' + fast + '&slow=' + slow);
            if (!r || !r.summary) {
                await new Promise(res => setTimeout(res, 400));
                r = await fetchAPI('/backtest?ticker=' + t + '&strategy=' + strategy + '&fast=' + fast + '&slow=' + slow);
            }
            results.push(r);
            progress[i] = r && r.summary ? '-' : '-';
            updateBtn();
            if (i < tickers.length - 1) await new Promise(res => setTimeout(res, 200));
        }
        let existing = document.getElementById('multi-chart-panel');
        if (existing) existing.remove();
        const panel = document.createElement('div');
        panel.id = 'multi-chart-panel';
        panel.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:2rem;backdrop-filter:blur(8px)';
        const statsHtml = tickers.map(function(t, i) {
            const r = results[i]; const ret = r && r.summary ? r.summary.totalReturn : null;
            const col = colors[t];
            if (ret === null) return '<div style="background:${alphaColor(0.03)};border-radius:10px;padding:1rem;text-align:center"><div style="color:var(--text-dim);font-size:0.7rem">' + t + '</div><div style="color:var(--text-dim)">No data</div></div>';
            return '<div style="background:${alphaColor(0.03)};border:1px solid ' + col + '30;border-radius:10px;padding:1rem;text-align:center"><div style="font-size:0.65rem;color:' + col + ';font-weight:900;letter-spacing:1px">' + t.replace('-USD','') + '</div><div style="font-size:1.4rem;font-weight:900;color:' + (ret>=0?'var(--risk-low)':'var(--risk-high)') + ';font-family:var(--font-mono)">' + (ret>=0?'+':'') + ret + '%</div><div style="font-size:0.6rem;color:var(--text-dim);margin-top:4px">Sharpe: ' + (r.summary.sharpe||'-') + ' - WR: ' + (r.summary.winRate||'-') + '%</div></div>';
        }).join('');
        panel.innerHTML = '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:2rem;max-width:900px;width:100%;max-height:90vh;overflow:auto"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem"><div><h2 style="margin:0;font-size:1.1rem">Multi-Asset Strategy Comparison</h2><p style="margin:4px 0 0;font-size:0.7rem;color:var(--text-dim);letter-spacing:1px">' + strategy.replace(/_/g,' ').toUpperCase() + ' - FAST:' + fast + ' SLOW:' + slow + '</p></div><button id="multi-close-btn" style="background:${alphaColor(0.06)};border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px 14px;cursor:pointer;font-family:var(--font-ui)">X CLOSE</button></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">' + statsHtml + '</div><div style="height:320px;position:relative"><canvas id="multi-ticker-canvas"></canvas></div></div>';
        panel.querySelector('button').onclick = function() { document.getElementById('multi-chart-panel').remove(); };
        document.body.appendChild(panel);
        renderMultiTickerChart(tickers, results, colors);
    } catch(e) { console.error('[MultiTicker]', e); }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px">compare_arrows</span> COMPARE BTC / ETH / SOL'; } }
}

function renderMultiTickerChart(tickers, results, colors) {
    const canvas = document.getElementById('multi-ticker-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const datasets = tickers.map(function(t, i) {
        const r = results[i];
        const curve = (r && (r.equityCurve || r.equity_curve || r.curve)) || [];
        return { label: t.replace('-USD',''), data: curve.map(function(p){return p.portfolio;}),
            borderColor: colors[t], borderWidth: 2, pointRadius: 0, tension: 0.1, fill: false };
    });
    const longestResult = results.reduce(function(a,b){
        return ((b&&(b.equityCurve||b.equity_curve||b.curve)||[]).length > (a&&(a.equityCurve||a.equity_curve||a.curve)||[]).length ? b : a);
    }, results[0]);
    const labels = ((longestResult&&(longestResult.equityCurve||longestResult.equity_curve||longestResult.curve))||[]).map(function(p){return p.date;});
    new Chart(ctx, {
        type: 'line', data: { labels: labels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#8b949e', font: { family: 'Outfit', size: 11 } } },
                tooltip: { backgroundColor: 'rgba(13,17,23,0.95)', titleColor: '#00f2ff', bodyColor: '#e6edf3',
                    borderColor: '#30363d', borderWidth: 1, padding: 12,
                    callbacks: { label: function(c){ const v = c.parsed.y - 100; return c.dataset.label + ': ' + (v>=0?'+':'') + v.toFixed(2) + '%'; } }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#8b949e', maxTicksLimit: 8, font: { size: 10 } } },
                y: {
                    grid: { color: alphaColor(0.03) },
                    title: { display: true, text: 'Cumulative Return (%)', color: '#8b949e', font: { size: 10, family: 'JetBrains Mono' } },
                    ticks: { color: '#8b949e', font: { size: 10 }, callback: function(v){ const r = v - 100; return (r>=0?'+':'') + r.toFixed(0) + '%'; } }
                }
            }
        }
    });
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
                    <optgroup label="Core Crypto" style="background:#111">
                        <option value="BTCUSDT">BTC/USDT</option>
                        <option value="ETHUSDT">ETH/USDT</option>
                        <option value="SOLUSDT">SOL/USDT</option>
                        <option value="BNBUSDT">BNB/USDT</option>
                        <option value="XRPUSDT">XRP/USDT</option>
                    </optgroup>
                    <optgroup label="Alt Crypto" style="background:#111">
                        <option value="ADAUSDT">ADA/USDT</option>
                        <option value="AVAXUSDT">AVAX/USDT</option>
                        <option value="LINKUSDT">LINK/USDT</option>
                        <option value="DOGEUSDT">DOGE/USDT</option>
                        <option value="PEPEUSDT">PEPE/USDT</option>
                    </optgroup>
                    <optgroup label="BTC Equity Proxies" style="background:#111">
                        <option value="MSTR">MSTR</option>
                        <option value="COIN">COIN</option>
                        <option value="MARA">MARA</option>
                        <option value="HOOD">HOOD</option>
                    </optgroup>
                </select>
                <select id="adv-interval" style="background:var(--card-bg); color:var(--text); border:1px solid var(--border); padding:5px 10px; border-radius:4px; font-family:'JetBrains Mono'">
                    <option value="1m">1m</option>
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="1d">1d</option>
                </select>
            </div>
        </div>
        
        <div style="display:flex; gap:1rem; margin-bottom:1rem; border-bottom:1px solid ${alphaColor(0.05)}; padding-bottom:0.5rem; overflow-x:auto">
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

        <!-- Overlay toggle controls - only visible on Price & Overlays tab -->
        <div id="adv-overlay-controls" style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.75rem; flex-wrap:wrap;">
            <span style="font-size:0.6rem; font-weight:700; letter-spacing:1.5px; color:var(--text-dim); margin-right:4px;">OVERLAYS:</span>
            <button id="ovr-ema20" class="filter-btn active" onclick="toggleAdvOverlay('ema20')" title="Toggle EMA 20">
                <span style="display:inline-block; width:10px; height:3px; background:#facc15; border-radius:2px; margin-right:5px; vertical-align:middle;"></span>EMA 20
            </button>
            <button id="ovr-ema50" class="filter-btn active" onclick="toggleAdvOverlay('ema50')" title="Toggle EMA 50">
                <span style="display:inline-block; width:10px; height:3px; background:#3b82f6; border-radius:2px; margin-right:5px; vertical-align:middle;"></span>EMA 50
            </button>
            <button id="ovr-heatmap" class="filter-btn" onclick="toggleAdvOverlay('heatmap')" title="Toggle Liquidity Heatmap">
                <span style="display:inline-block; width:10px; height:3px; background:linear-gradient(to right,#00f2ff,#ff6b6b); border-radius:2px; margin-right:5px; vertical-align:middle;"></span>LIQ HEATMAP
            </button>
            <span id="adv-overlay-hint" style="margin-left:auto; font-size:0.58rem; color:var(--text-dim); opacity:0.6;">Click to show/hide</span>
        </div>

        <div class="card" style="padding:1rem; min-height:500px; position:relative;">
            <div id="advanced-chart-container" style="width:100%; min-height:500px; border-radius:8px;"></div>
            
            <div id="heatmap-legend-overlay" style="position:absolute; top:20px; left:20px; z-index:10; background:rgba(13,17,23,0.85); border:1px solid ${alphaColor(0.1)}; border-radius:8px; padding:10px; font-size:0.65rem; color:#d1d5db; pointer-events:none; backdrop-filter:blur(8px); display:none; flex-direction:column; gap:6px;">
                <div style="font-weight:900; color:var(--accent); letter-spacing:1.5px; margin-bottom:2px; font-size:0.55rem; text-transform:uppercase">Liquidity Atlas</div>
                <div style="display:flex; align-items:center; gap:8px">
                    <div style="width:10px; height:4px; background:linear-gradient(to right, hsla(180,100%,40%,0.8), hsla(180,100%,80%,0.8)); border-radius:2px;"></div>
                    <span>Bids</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px">
                    <div style="width:10px; height:4px; background:linear-gradient(to right, hsla(0,100%,40%,0.8), hsla(25,100%,60%,0.8)); border-radius:2px;"></div>
                    <span>Asks</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('adv-symbol').addEventListener('change', dispatchAdvTab);
    document.getElementById('adv-interval').addEventListener('change', dispatchAdvTab);

    window.setAdvTab = (tab) => {
        currentAdvTab = tab;
        document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tab}`)?.classList.add('active');
        // Show overlay controls only on Price & Overlays tab
        const ovrBar = document.getElementById('adv-overlay-controls');
        if (ovrBar) ovrBar.style.display = tab === 'overview' ? 'flex' : 'none';
        dispatchAdvTab();
    };

    dispatchAdvTab();
}

// ============================================================
// Phase 9: On-Chain Analytics Dashboard
// ============================================================
// ============================================================
// Phase 16-C: TradingView Advanced Chart Widget
// ============================================================

/** Map internal symbol codes to TradingView format */
function toTVSymbol(sym) {
    const map = {
        'BTCUSDT':  'BINANCE:BTCUSDT',
        'ETHUSDT':  'BINANCE:ETHUSDT',
        'SOLUSDT':  'BINANCE:SOLUSDT',
        'BNBUSDT':  'BINANCE:BNBUSDT',
        'XRPUSDT':  'BINANCE:XRPUSDT',
        'ADAUSDT':  'BINANCE:ADAUSDT',
        'AVAXUSDT': 'BINANCE:AVAXUSDT',
        'LINKUSDT': 'BINANCE:LINKUSDT',
        'DOGEUSDT': 'BINANCE:DOGEUSDT',
        'PEPEUSDT': 'BINANCE:PEPEUSDT',
        'MSTR':     'NASDAQ:MSTR',
        'COIN':     'NASDAQ:COIN',
        'MARA':     'NASDAQ:MARA',
        'HOOD':     'NASDAQ:HOOD',
    };
    return map[sym] || 'BINANCE:BTCUSDT';
}

/** Map adv-interval values to TradingView interval codes */
function toTVInterval(iv) {
    return { '1m': '1', '5m': '5', '15m': '15', '1h': '60', '4h': '240', '1d': 'D' }[iv] || '60';
}

/**
 * Render the TradingView Advanced Chart widget inside #advanced-chart-container.
 * Called when the user clicks the TRADINGVIEW tab.
 */
function renderTradingViewWidget(sym, interval) {
    const container = document.getElementById('advanced-chart-container');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';
    container.style.height = '600px';



    if (typeof TradingView === 'undefined') {
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;color:var(--text-dim)">
                <span class="material-symbols-outlined" style="font-size:48px;color:#2196f3">show_chart</span>
                <div style="font-size:0.9rem">TradingView widget loading...</div>
                <div style="font-size:0.7rem;opacity:0.5">Requires internet connection</div>
            </div>`;
        // Retry after library loads
        setTimeout(() => renderTradingViewWidget(sym, interval), 1500);
        return;
    }

    new TradingView.widget({
        container_id: 'advanced-chart-container',
        symbol: toTVSymbol(sym),
        interval: toTVInterval(interval),
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',             // Candlestick
        locale: 'en',
        toolbar_bg: '#05070a',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: true,
        height: 600,
        width: '100%',
        studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies',
            'BB@tv-basicstudies'
        ],
        show_popup_button: true,
        popup_width: '1200',
        popup_height: '700',
        backgroundColor: 'rgba(5, 7, 10, 1)',
        gridColor: alphaColor(0.04),
        overrides: {
            'paneProperties.background': '#05070a',
            'paneProperties.backgroundType': 'solid',
        }
    });
}
