// ── Signals localStorage cache (stale-while-revalidate, 3-min TTL) ──
const _SIG_CACHE_KEY = 'as_signals_v1';
const _SIG_CACHE_TTL = 30 * 1000; // 30 seconds
function _getSigCache() {
    try {
        const raw = localStorage.getItem(_SIG_CACHE_KEY);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > _SIG_CACHE_TTL) { localStorage.removeItem(_SIG_CACHE_KEY); return null; }
        return data;
    } catch { return null; }
}
function _setSigCache(data) {
    try { localStorage.setItem(_SIG_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

async function renderSignals(category = 'ALL', tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    currentSignalCategory = category;

    // Fast path: render immediately from cache, refresh in background
    const _cached = _getSigCache();
    let signals;
    if (_cached) {
        signals = _cached;
        // Silent background refresh — update cache without blocking render
        fetchAPI('/signals').then(fresh => { if (fresh) _setSigCache(fresh); }).catch(() => {});
    } else {
        appEl.innerHTML = skeleton(8);
        signals = await fetchAPI('/signals');
        if (!signals) {
            appEl.innerHTML = '<div class="error-msg">Fail to sync with intelligence streams. Check connection.</div>';
            return;
        }
        _setSigCache(signals);
    }
    


    lastSignalsData = signals;
    updateScroller(signals);
    startCountdown(); // Reset timer on successful fetch

    // Funding rate map: fetch once in background (non-blocking - fails gracefully)
    let fundingMap = {};
    try {
        const fr = await fetchAPI('/funding-rates');
        if (fr && fr.rows) {
            fr.rows.forEach(r => { fundingMap[r.asset] = r.current; });
        }
    } catch (_) {}

    const filtered = category === 'ALL' ? signals : signals.filter(s => s.category === category);
    const cats = ['ALL', 'EXCHANGE', 'PROXY', 'MINERS', 'ETF', 'DEFI', 'L1', 'STABLES', 'MEMES'];

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('signals', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-signals')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
           
        </div>
        
        <!-- Signal Analytics Row -->
        <div class="signal-analytics-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
            <div class="card">
                <div class="card-header" style="margin-bottom:10px">
                    <h2>Strategy Firing Density (30D)</h2>
                    <span class="label-tag">VOLATILITY CLUSTER MAP</span>
                </div>
                <div style="height:220px; width:100%; position:relative;">
                    <canvas id="signalDensityChart" role="img" aria-label="Signal density distribution chart"></canvas>
                </div>
            </div>
            <div class="card">
                <div class="card-header" style="margin-bottom:10px">
                    <h2>Z-Score Distribution</h2>
                    <span class="label-tag">GAUSSIAN CURVE</span>
                </div>
                <div style="height:220px; width:100%; position:relative;">
                    <canvas id="zscoreBellChart" role="img" aria-label="Z-score bell curve distribution"></canvas>
                </div>
            </div>
        </div>

        <div class="view-actions">
            <div class="category-filters">
                ${cats.map(c => `<button class="filter-btn ${category === c ? 'active' : ''}" onclick="renderSignals('${c}')">${c}</button>`).join('')}
            </div>
            <button class="export-btn" style="margin-left:auto" onclick="exportCSV(lastSignalsData,'alphasignal_signals.csv')">📥 Export CSV</button>
        </div>
        <div class="signal-grid">
            ${filtered.map(s => {
                const dir = s.alpha >= 0 ? 'LONG' : 'SHORT';
                const zAbs = Math.abs(s.zScore).toFixed(1);
                const cardId = `sc-${s.ticker.replace(/[^a-z0-9]/gi,'')}`;
                // Funding rate badge
                const asset = s.ticker.replace(/-USD$|-USDT$/i,'').replace(/USDT$/i,'');
                const fRate = fundingMap[asset];
                const fundingBadge = (fRate !== undefined)
                    ? (() => {
                        const col = fRate > 0.05 ? '#ef4444' : fRate > 0.01 ? '#fb923c' : fRate < -0.01 ? '#22c55e' : '#64748b';
                        const bg  = fRate > 0.05 ? 'rgba(239,68,68,0.1)' : fRate > 0.01 ? 'rgba(251,146,60,0.1)' : fRate < -0.01 ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)';
                        const sign = fRate >= 0 ? '+' : '';
                        return `<div title="Perpetual Funding Rate" style="font-size:0.48rem;font-weight:900;letter-spacing:1px;padding:2px 6px;border-radius:100px;
                            background:${bg};border:1px solid ${col}33;color:${col};white-space:nowrap">⚡ ${sign}${fRate.toFixed(4)}%</div>`;
                    })()
                    : '';
                return `
                <div class="signal-card ${Math.abs(s.zScore) > 2 ? 'z-outlier' : ''}" onclick="openDetail('${s.ticker}', '${s.category}', ${s.btcCorrelation}, ${s.alpha}, ${s.sentiment}, '60d', ${s.category === 'TRACKED'})">
                    <div class="card-controls" style="position:absolute; top:12px; right:12px; display:flex; gap:8px; z-index:10">
                        <div class="ai-trigger" onclick="event.stopPropagation(); openAIAnalyst('${s.ticker}', '${dir}', '${zAbs}')" title="Run AI Deep-Dive"><span class="material-symbols-outlined" style="font-size: 18px;">smart_toy</span></div>
                        <div class="ai-trigger" onclick="event.stopPropagation(); addToWatchlist_quick('${s.ticker}')" title="Add to My Watchlist" style="background:rgba(34,197,94,0.12);border-color:rgba(34,197,94,0.3)"><span class="material-symbols-outlined" style="font-size: 18px;color:#22c55e">add_circle</span></div>
                        <div class="share-trigger" onclick="event.stopPropagation(); shareSignal('${s.ticker}', ${s.alpha}, ${s.sentiment}, ${s.zScore})" title="Share to X (Twitter)"><span class="material-symbols-outlined" style="font-size: 18px;">share</span></div>
                    </div>
                    <div class="card-header">
                        <div>
                            <div class="ticker">${s.ticker}</div>
                            <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin-top:4px">
                                <div class="label-tag cat-${s.category.toLowerCase()}">${s.category}</div>
                                <div style="font-size:0.5rem;font-weight:900;letter-spacing:1px;padding:2px 7px;border-radius:100px;
                                    background:${dir==='LONG'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};
                                    border:1px solid ${dir==='LONG'?'rgba(34,197,94,0.35)':'rgba(239,68,68,0.35)'};
                                    color:${dir==='LONG'?'#22c55e':'#ef4444'}">${dir}</div>
                                ${fundingBadge}
                            </div>
                        </div>
                        <div class="metrics" style="align-items:flex-end;min-width:110px">
                            <div class="metric-line">
                                <span>Price</span>
                                <span>${formatPrice(s.price)}</span>
                            </div>
                            <div class="metric-line">
                                <span>24h Change</span>
                                <span class="${s.change >= 0 ? 'pos' : 'neg'}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</span>
                            </div>
                            <div class="metric-line">
                                <span>Z-Score</span>
                                <span style="color:${Math.abs(s.zScore)>=1.75?'#ef4444':Math.abs(s.zScore)>=1.0?'#fb923c':Math.abs(s.zScore)>=0.5?'#7dd3fc':'#94a3b8'}">${s.zScore >= 0 ? '+' : ''}${s.zScore.toFixed(2)}s</span>
                            </div>
                        </div>
                    </div>

                    <div class="delta-stat">
                        <div class="delta-label">BTC CORRELATION</div>
                        <div class="delta-value">${s.btcCorrelation.toFixed(2)}</div>
                    </div>
                    <div class="metrics">
                        <div class="metric-line"><span>Relative Alpha</span><span class="${s.alpha >= 0 ? 'pos' : 'neg'}">${s.alpha >= 0 ? '+' : ''}${s.alpha.toFixed(2)}%</span></div>
                        <div class="metric-line"><span>Sentiment</span><span class="${getSentimentClass(s.sentiment)}">${getSentimentLabel(s.sentiment)}</span></div>
                    </div>
                    <!-- Inline AI Thesis Strip -->
                    <div class="thesis-strip" id="${cardId}-strip"
                        onclick="event.stopPropagation(); toggleInlineThesis('${s.ticker}', '${dir}', '${zAbs}', '${cardId}')"
                        style="margin-top:10px;padding:7px 10px;border-radius:7px;cursor:pointer;
                               background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.2);
                               display:flex;align-items:center;gap:7px;transition:background 0.2s;"
                        onmouseover="this.style.background='rgba(139,92,246,0.14)'"
                        onmouseout="this.style.background='rgba(139,92,246,0.07)'">
                        <span class="material-symbols-outlined" style="font-size:14px;color:#8b5cf6;flex-shrink:0;">psychology</span>
                        <span style="font-size:0.6rem;font-weight:900;letter-spacing:1px;color:#8b5cf6;">AI THESIS</span>
                        <span id="${cardId}-chevron" class="material-symbols-outlined" style="font-size:14px;color:rgba(139,92,246,0.5);margin-left:auto;transition:transform 0.2s;">expand_more</span>
                    </div>
                    <div id="${cardId}-thesis" style="display:none;padding:8px 10px 2px;font-size:0.88rem;
                        line-height:1.7;color:var(--text-dim);border-left:2px solid rgba(139,92,246,0.3);
                        margin-top:6px;"></div>
                </div>
            `}).join('')}
        </div>`;


    // Render 30D Signal Density Histogram — live data from alerts_history
    setTimeout(async () => {
        const sdCtx = document.getElementById('signalDensityChart');
        if (!sdCtx) return;
        const existing = Chart.getChart('signalDensityChart');
        if (existing) existing.destroy();

        let labels, dataBase, source = 'synthetic';
        try {
            const density = await fetchAPI('/signal-density');
            if (density && density.counts && density.counts.length) {
                labels = density.labels;
                dataBase = density.counts;
                source = density.source || 'live';
            }
        } catch(e) { /* fall through to synthetic */ }

        if (!labels) {
            labels = Array.from({length: 30}, (_, i) => `D-${30-i}`);
            dataBase = labels.map(() => Math.floor(Math.random() * 7) + 1);
            dataBase[24] = 9; dataBase[25] = 22; dataBase[26] = 17; dataBase[27] = 11;
        }

        // Inject source badge into card header
        const headerEl = sdCtx.closest('.card')?.querySelector('.card-header');
        if (headerEl) {
            const existing = headerEl.querySelector('.density-source-badge');
            if (existing) existing.remove();
            const badge = document.createElement('span');
            badge.className = 'density-source-badge';
            badge.style.cssText = `font-size:0.5rem;font-weight:900;letter-spacing:1.5px;padding:2px 8px;border-radius:100px;background:${source==='live'?'rgba(34,197,94,0.12)':'rgba(148,163,184,0.1)'};color:${source==='live'?'#22c55e':'#94a3b8'}`;
            badge.textContent = source === 'live' ? '● LIVE DB' : '◌ SYNTHETIC';
            headerEl.appendChild(badge);
        }

        // Per-bar color scale: dim → cyan → amber → red
        const barColor = v => {
            if (v >= 18) return 'rgba(239,68,68,0.85)';
            if (v >= 12) return 'rgba(251,146,60,0.8)';
            if (v >= 7)  return 'rgba(0,242,255,0.7)';
            if (v >= 4)  return 'rgba(99,179,237,0.55)';
            return 'rgba(148,163,184,0.3)';
        };
        const borderColor = v => {
            if (v >= 18) return 'rgba(239,68,68,1)';
            if (v >= 12) return 'rgba(251,146,60,0.9)';
            if (v >= 7)  return 'rgba(0,242,255,0.9)';
            if (v >= 4)  return 'rgba(99,179,237,0.7)';
            return 'rgba(148,163,184,0.4)';
        };

        // Plugin: draw a slim amber line for zero-signal days
        const zeroDayPlugin = {
            id: 'zeroDayMarker',
            afterDraw(chart) {
                const { ctx, data, scales: { x, y } } = chart;
                const dataset = data.datasets[0].data;
                const y0 = y.getPixelForValue(0);
                ctx.save();
                dataset.forEach((val, i) => {
                    if (val === 0) {
                        const meta = chart.getDatasetMeta(0).data[i];
                        const barWidth = meta.width || 8;
                        const cx = meta.x;
                        ctx.beginPath();
                        ctx.moveTo(cx - barWidth / 2, y0);
                        ctx.lineTo(cx + barWidth / 2, y0);
                        ctx.strokeStyle = 'rgba(251,146,60,0.9)';
                        ctx.lineWidth = 2.5;
                        ctx.shadowColor = 'rgba(251,146,60,0.5)';
                        ctx.shadowBlur = 4;
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }
        };

        new Chart(sdCtx.getContext('2d'), {

            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Signals Fired',
                    data: dataBase,
                    backgroundColor: dataBase.map(barColor),
                    borderColor: dataBase.map(borderColor),
                    borderWidth: 1,
                    borderRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13,17,23,0.95)',
                        titleColor: '#7dd3fc',
                        bodyColor: '#e2e8f0',
                        callbacks: {
                            title: items => items[0].label,
                            label: c => `${c.raw} signals fired`
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false },
                        ticks: {
                            color: 'rgba(255,255,255,0.2)',
                            font: { family: 'JetBrains Mono', size: 8 },
                            maxTicksLimit: 6,
                            maxRotation: 0
                        }
                    },
                    y: {
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: {
                            color: 'rgba(255,255,255,0.35)',
                            font: { family: 'JetBrains Mono', size: 8 },
                            maxTicksLimit: 5,
                            stepSize: 5
                        },
                        title: { display: true, text: 'Signals Fired', color: 'rgba(255,255,255,0.2)', font: { size: 8 } },
                        suggestedMax: 30
                    }
                }
            },
            plugins: [zeroDayPlugin]
        });
    }, 50);

    // Z-Score Bell Curve — 0.5-step buckets with proper σ scale
    setTimeout(() => {
        const bellCtx = document.getElementById('zscoreBellChart');
        if (!bellCtx || !signals || !signals.length) return;
        const existing = Chart.getChart('zscoreBellChart');
        if (existing) existing.destroy();

        // 0.25-step buckets from -2 to +2 (17 bars, zero at index 8)
        const STEP = 0.25, MIN = -2, MAX = 2;
        const buckets = [];
        for (let z = MIN; z <= MAX + 1e-9; z += STEP) buckets.push(parseFloat(z.toFixed(2)));
        const bucketLabels = buckets.map(b => b === 0 ? '0' : (b > 0 ? `+${b}σ` : `${b}σ`));
        const counts = new Array(buckets.length).fill(0);

        signals.forEach(s => {
            const z = Math.max(MIN, Math.min(MAX, s.zScore || 0));
            // Find nearest bucket
            let best = 0, bestDist = 999;
            buckets.forEach((b, i) => { const d = Math.abs(z - b); if (d < bestDist) { bestDist = d; best = i; } });
            counts[best]++;
        });

        // Gaussian overlay
        const mean = signals.reduce((a, s) => a + (s.zScore || 0), 0) / signals.length;
        const variance = signals.reduce((a, s) => a + Math.pow((s.zScore || 0) - mean, 2), 0) / signals.length;
        const std = Math.sqrt(variance) || 1;
        const gaussian = buckets.map(x => {
            const exp = Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
            return (exp / (std * Math.sqrt(2 * Math.PI))) * signals.length * 0.22;
        });

        // Color scale tuned to ±2 range
        const barBg = buckets.map(z => {
            const a = Math.abs(z);
            if (a >= 1.75) return 'rgba(239,68,68,0.85)';
            if (a >= 1.25) return 'rgba(251,146,60,0.8)';
            if (a >= 0.75) return 'rgba(250,204,21,0.7)';
            if (a >= 0.25) return 'rgba(0,242,255,0.55)';
            return 'rgba(148,163,184,0.35)';
        });
        const barBorder = barBg.map(c => c.replace(/[\d.]+\)$/, '1)'));

        new Chart(bellCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: bucketLabels,
                datasets: [
                    {
                        label: 'Signal Count',
                        data: counts,
                        backgroundColor: barBg,
                        borderColor: barBorder,
                        borderWidth: 1,
                        borderRadius: 3,
                        order: 2
                    },
                    {
                        label: 'Gaussian Fit',
                        data: gaussian,
                        type: 'line',
                        borderColor: 'rgba(139,92,246,0.85)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.45,
                        fill: false,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13,17,23,0.95)',
                        titleColor: '#7dd3fc',
                        bodyColor: '#e2e8f0',
                        callbacks: {
                            title: items => `Z-Score: ${items[0].label}`,
                            label: c => c.datasetIndex === 0 ? `${c.raw} signals` : `Fit: ${c.raw.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            // index 8 = zero bucket (-2 + 8×0.25 = 0)
                            color: ctx => ctx.index === 8 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.04)',
                            lineWidth: ctx => ctx.index === 8 ? 1.5 : 0.5
                        },
                        ticks: {
                            color: ctx => {
                                const v = MIN + ctx.index * STEP; // σ value from bucket index
                                if (Math.abs(v) >= 1.75) return 'rgba(239,68,68,0.9)';
                                if (Math.abs(v) >= 1.0)  return 'rgba(251,146,60,0.85)';
                                if (Math.abs(v) >= 0.5)  return 'rgba(0,242,255,0.75)';
                                return 'rgba(255,255,255,0.7)';
                            },
                            font: { family: 'JetBrains Mono', size: 8 },
                            maxRotation: 0,
                            maxTicksLimit: 9  // show every other label to avoid crowding
                        },
                        title: { display: true, text: 'Z-Score (σ)', color: 'rgba(255,255,255,0.2)', font: { size: 8 } }
                    },
                    y: {
                        display: true,
                        position: 'right',
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: {
                            color: 'rgba(255,255,255,0.3)',
                            font: { family: 'JetBrains Mono', size: 8 },
                            maxTicksLimit: 4
                        },
                        title: { display: true, text: 'Count', color: 'rgba(255,255,255,0.2)', font: { size: 8 } }
                    }
                }
            }
        });
    }, 50);

    // Signal Confidence Radar — loads after signals are painted









    // Signal Confidence Radar — loads after signals are painted
    setTimeout(async () => {
        const radarSection = document.createElement('div');
        // Build radar options from all loaded signals (deduped by ticker)
        const _radarFirstTicker = signals[0] ? signals[0].ticker.replace('-USD','') : 'BTC';
        const _radarOpts = [...new Map(signals.map(s => [s.ticker, s])).values()]
            .map(s => {
                const lbl = s.ticker.replace('-USD','');
                return '<div class="radar-opt" data-val="' + s.ticker + '" style="padding:7px 14px;cursor:pointer;color:#e2e8f0;font-family:JetBrains Mono,monospace;font-size:0.7rem;transition:background 0.15s">' + lbl + '</div>';
            }).join('');
        radarSection.innerHTML = `
            <div class="card" style="padding:1.5rem;margin-top:2rem;background:rgba(5,5,30,0.7);border:1px solid rgba(0,242,255,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;">
                    <h3 style="margin:0;font-size:0.85rem;color:var(--accent);letter-spacing:1px;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">radar</span>SIGNAL CONFIDENCE RADAR
                        <div id="radar-custom-select" style="position:relative;display:inline-block;margin-left:10px;font-size:0.7rem;font-weight:normal;vertical-align:middle;">
                            <div id="radar-select-btn" style="background:#0d1117;border:1px solid rgba(0,242,255,0.25);color:#e2e8f0;padding:3px 26px 3px 10px;border-radius:4px;cursor:pointer;font-family:'JetBrains Mono',monospace;min-width:54px;user-select:none;position:relative;">
                                ${_radarFirstTicker}<span style="position:absolute;right:7px;top:50%;transform:translateY(-50%);opacity:0.5;font-size:0.55rem;">&#9660;</span>
                            </div>
                            <div id="radar-select-list" style="display:none;position:absolute;top:calc(100% + 4px);left:0;background:#0d1117;border:1px solid rgba(0,242,255,0.25);border-radius:6px;z-index:9999;min-width:80px;max-height:220px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(0,242,255,0.3) transparent;box-shadow:0 8px 24px rgba(0,0,0,0.7);">
                                ${_radarOpts}
                            </div>
                        </div>
                </div>
                <div style="display:flex;justify-content:center;padding-bottom:2rem;">
                    <div style="width:340px;height:340px;"><canvas id="signalRadarChart" role="img" aria-label="Signal confidence radar chart"></canvas></div>
                </div>
            </div>`;
        appEl.appendChild(radarSection);
        window.loadSignalRadar = async (ticker) => {
            const radarData = await fetchAPI(`/signal-radar?ticker=${ticker}`);
            if (!radarData || !radarData.values) return;
            const existing = Chart.getChart('signalRadarChart');
            if (existing) existing.destroy();
            const ctx = document.getElementById('signalRadarChart');
            if (!ctx) return;
            new Chart(ctx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: radarData.labels,
                    datasets: [{
                        label: radarData.ticker + ' Confidence',
                        data: radarData.values,
                        borderColor: '#7dd3fc',
                        backgroundColor: 'rgba(0,242,255,0.08)',
                        pointBackgroundColor: '#7dd3fc',
                        pointRadius: 4,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: true,
                    plugins: { legend: { labels: { color: 'white', font: { family: 'JetBrains Mono', size: 9 } } } },
                    scales: { r: {
                        min: 0, max: 100, ticks: { stepSize: 25, color: 'rgba(255,255,255,0.3)', backdropColor: 'transparent', font: { size: 8 } },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        pointLabels: { color: 'rgba(255,255,255,0.7)', font: { size: 9.5, family: 'JetBrains Mono' } }
                    }}
                }
            });
        };
        // Wire custom radar dropdown
        const _radarBtn  = document.getElementById('radar-select-btn');
        const _radarList = document.getElementById('radar-select-list');
        if (_radarBtn && _radarList) {
            _radarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _radarList.style.display = _radarList.style.display === 'none' ? 'block' : 'none';
            });
            _radarList.querySelectorAll('.radar-opt').forEach(opt => {
                opt.addEventListener('mouseover', () => { opt.style.background = 'rgba(0,242,255,0.1)'; });
                opt.addEventListener('mouseout',  () => { opt.style.background = 'transparent'; });
                opt.addEventListener('click', () => {
                    _radarBtn.childNodes[0].textContent = opt.textContent.trim();
                    _radarList.style.display = 'none';
                    window.loadSignalRadar(opt.dataset.val);
                });
            });
            document.addEventListener('click', () => { _radarList.style.display = 'none'; });
        }
        window.loadSignalRadar('BTC-USD');
    }, 400);
}

// ============= Miners View =============
async function renderMiners() {
    renderSignals('MINERS');
}

// ============================================================
// Feature 2: Alpha Score Composite
// ============================================================
async function renderAlphaScore(tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">ML</span></h2> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-alpha-score')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p>Composite 0–100 ranking across momentum, sentiment, signal engine alerts & volatility.</p>
        </div>
        <div class="card" style="padding:1rem">${skeleton(1)}</div>
    `;
    const data = await fetchAPI('/alpha-score');
    if (!data || !data.scores || !data.scores.length) {
        appEl.innerHTML += `<div class="card" style="text-align:center; padding:2rem; color:var(--text-dim)">Scoring engine computing... try again in 30s.</div>`;
        return;
    }

    const gradeColors = { A: '#22c55e', B: '#60a5fa', C: '#facc15', D: '#ef4444' };
    const signalColors = { 'STRONG BUY': '#22c55e', 'BUY': '#86efac', 'NEUTRAL': '#60a5fa', 'CAUTION': '#ef4444' };

    let scores = data.scores || [];


    let currentPage = 1;
    const itemsPerPage = 15;

    function drawAlphaPage() {
        const totalPages = Math.ceil(scores.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentScores = scores.slice(startIndex, startIndex + itemsPerPage);

        appEl.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:15px">
                <div>
                    ${renderHubTabs('score', tabs)}
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                        <h2><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">bolt</span> Alpha Score <span class="premium-badge">LIVE</span></h2>
                        <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0" onclick="switchView('docs-alpha-score')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                        <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0;border-color:rgba(250,204,21,0.4);color:#facc15" onclick="switchView('docs-ml-engine')"><span class="material-symbols-outlined" style="font-size:13px">smart_toy</span> ML ENGINE</button>
                    </div>
                    <p style="margin:0">Composite 0&ndash;100 ranking &middot; Updated ${data.updated} &middot; ${scores.length} assets scored</p>
                </div>
                <!-- Pagination Controls -->
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:5px">
                    <button class="filter-btn" id="btn-prev-alpha" ${currentPage === 1 ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>&larr; Prev</button>
                    <span style="font-size:0.75rem; color:var(--text-dim); font-family:'JetBrains Mono'">Page ${currentPage} of ${totalPages}</span>
                    <button class="filter-btn" id="btn-next-alpha" ${currentPage === totalPages ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>Next &rarr;</button>
                </div>
            </div>
            <div class="card" style="overflow-x:auto">
                <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                    <thead>
                        <tr style="color:var(--text-dim); border-bottom:1px solid var(--border)">
                            <th style="text-align:left; padding:8px 12px">#</th>
                            <th style="text-align:left; padding:8px 12px">ASSET</th>
                            <th style="text-align:left; padding:8px 12px">SECTOR</th>
                            <th style="text-align:left; padding:8px 12px; width:180px">SCORE</th>
                            <th style="text-align:center; padding:8px 12px">GRADE</th>
                            <th style="text-align:center; padding:8px 12px">SIGNAL</th>
                            <th style="text-align:left; padding:8px 12px">MODEL SPECS</th>
                            <th style="text-align:left; padding:8px 12px">WHY</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentScores.map((s, i) => `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s"
                                onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
                                <td style="padding:10px 12px; color:var(--text-dim)">${startIndex + i + 1}</td>
                                <td style="padding:10px 12px; font-weight:700; color:var(--accent)">${s.ticker}</td>
                                <td style="padding:10px 12px; color:var(--text-dim); font-size:0.65rem; letter-spacing:1px">${s.sector}</td>
                                <td style="padding:10px 12px">
                                    <div style="display:flex; align-items:center; gap:8px">
                                        <div style="flex:1; height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden">
                                            <div style="width:${s.score}%; height:100%; background:${gradeColors[s.grade] || '#60a5fa'}; border-radius:4px; transition:width 1s ease"></div>
                                        </div>
                                        <span style="font-weight:700; font-size:0.8rem; color:${gradeColors[s.grade]}">${s.score}</span>
                                    </div>
                                </td>
                                <td style="padding:10px 12px; text-align:center">
                                    <span style="background:${gradeColors[s.grade] || '#999'}33; color:${gradeColors[s.grade] || '#999'}; padding:2px 10px; border-radius:20px; font-weight:700; font-size:0.75rem">${s.grade}</span>
                                </td>
                                <td style="padding:10px 12px; text-align:center">
                                    <span style="color:${signalColors[s.signal] || '#60a5fa'}; font-size:0.6rem; letter-spacing:1px">${s.signal}</span>
                                </td>
                                <td style="padding:10px 12px; min-width:140px">
                                    <div style="display:flex; flex-direction:column; gap:4px">
                                        <div style="display:flex; gap:6px; align-items:center">
                                            <span style="font-size:0.55rem; color:var(--text-dim); background:rgba(255,255,255,0.05); padding:1px 4px; border-radius:3px">CONSENSUS:</span>
                                            <span style="font-size:0.6rem; font-weight:900; color:${s.consensus === 'HIGH' ? '#22c55e' : s.consensus === 'MEDIUM' ? '#60a5fa' : '#ef4444'}">${s.consensus}</span>
                                        </div>
                                        <div style="display:flex; gap:6px; font-size:0.55rem; color:var(--text-dim)">
                                            <span style="letter-spacing:1px">LSTM: <span style="color:var(--accent)">${s.lstm_conf}%</span></span>
                                            <span style="letter-spacing:1px">XGB: <span style="color:var(--accent)">${s.xgb_conf}%</span></span>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding:10px 12px; color:var(--text-dim); font-size:0.62rem; max-width:200px">
                                    ${(s.reasons || []).map(r => r.includes('ML') ? `<strong style="color:var(--accent)">${r}</strong>` : r).join(' · ') || '—'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const btnPrev = document.getElementById('btn-prev-alpha');
        const btnNext = document.getElementById('btn-next-alpha');
        if(btnPrev) btnPrev.addEventListener('click', () => { if(currentPage > 1) { currentPage--; drawAlphaPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
        if(btnNext) btnNext.addEventListener('click', () => { if(currentPage < totalPages) { currentPage++; drawAlphaPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
    }

    currentPage = 1;
    drawAlphaPage();
}

// ============================================================
// Feature 4: Performance Dashboard
// ============================================================