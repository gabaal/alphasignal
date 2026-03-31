async function renderSignals(category = 'ALL', tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    currentSignalCategory = category;
    appEl.innerHTML = skeleton(8);
    let signals = await fetchAPI('/signals');
    if (!signals) {
        appEl.innerHTML = '<div class="error-msg">Fail to sync with intelligence streams. Check connection.</div>';
        return;
    }
    


    lastSignalsData = signals;
    updateScroller(signals);
    startCountdown(); // Reset timer on successful fetch

    const filtered = category === 'ALL' ? signals : signals.filter(s => s.category === category);
    const cats = ['ALL', 'EXCHANGE', 'PROXY', 'MINERS', 'ETF', 'DEFI', 'L1', 'STABLES', 'MEMES'];

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('signals', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-signals')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
           
        </div>
        
        <!-- Signal Analytics Row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
            <div class="card">
                <div class="card-header" style="margin-bottom:10px">
                    <h2>Strategy Firing Density (30D)</h2>
                    <span class="label-tag">VOLATILITY CLUSTER MAP</span>
                </div>
                <div style="height:120px; width:100%; position:relative;">
                    <canvas id="signalDensityChart"></canvas>
                </div>
            </div>
            <div class="card">
                <div class="card-header" style="margin-bottom:10px">
                    <h2>Z-Score Distribution</h2>
                    <span class="label-tag">GAUSSIAN CURVE</span>
                </div>
                <div style="height:120px; width:100%; position:relative;">
                    <canvas id="zscoreBellChart"></canvas>
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
                return `
                <div class="signal-card ${Math.abs(s.zScore) > 2 ? 'z-outlier' : ''}" onclick="openDetail('${s.ticker}', '${s.category}', ${s.btcCorrelation}, ${s.alpha}, ${s.sentiment}, '60d', ${s.category === 'TRACKED'})">
                    <div class="card-controls" style="position:absolute; top:12px; right:12px; display:flex; gap:8px; z-index:10">
                        <div class="ai-trigger" onclick="event.stopPropagation(); openAIAnalyst('${s.ticker}')" title="Run AI Deep-Dive"><span class="material-symbols-outlined" style="font-size: 18px;">smart_toy</span></div>
                        <div class="ai-trigger" onclick="event.stopPropagation(); addToWatchlist_quick('${s.ticker}')" title="Add to My Watchlist" style="background:rgba(34,197,94,0.12);border-color:rgba(34,197,94,0.3)"><span class="material-symbols-outlined" style="font-size: 18px;color:#22c55e">add_circle</span></div>
                        <div class="share-trigger" onclick="event.stopPropagation(); shareSignal('${s.ticker}', ${s.alpha}, ${s.sentiment}, ${s.zScore})" title="Share to X (Twitter)"><span class="material-symbols-outlined" style="font-size: 18px;">share</span></div>
                    </div>
                    <div class="card-header">
                        <div>
                            <div class="ticker">${s.ticker}</div>
                            <div class="label-tag cat-${s.category.toLowerCase()}">${s.category}</div>
                        </div>
                        <div class="price-box" style="text-align:right">
                            <div style="font-weight:700">${formatPrice(s.price)}</div>
                            <div class="${s.change >= 0 ? 'pos' : 'neg'}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</div>
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
                               background:rgba(188,19,254,0.07);border:1px solid rgba(188,19,254,0.2);
                               display:flex;align-items:center;gap:7px;transition:background 0.2s;"
                        onmouseover="this.style.background='rgba(188,19,254,0.14)'"
                        onmouseout="this.style.background='rgba(188,19,254,0.07)'">
                        <span class="material-symbols-outlined" style="font-size:14px;color:#bc13fe;flex-shrink:0;">psychology</span>
                        <span style="font-size:0.6rem;font-weight:900;letter-spacing:1px;color:#bc13fe;">AI THESIS</span>
                        <span id="${cardId}-chevron" class="material-symbols-outlined" style="font-size:14px;color:rgba(188,19,254,0.5);margin-left:auto;transition:transform 0.2s;">expand_more</span>
                    </div>
                    <div id="${cardId}-thesis" style="display:none;padding:8px 10px 2px;font-size:0.75rem;
                        line-height:1.6;color:var(--text-dim);border-left:2px solid rgba(188,19,254,0.3);
                        margin-top:6px;"></div>
                </div>
            `}).join('')}
        </div>`;


    // Render 30D Signal Density Histogram
    setTimeout(() => {
        const sdCtx = document.getElementById('signalDensityChart');
        if (sdCtx) {
            // Generate synthetic 30D distribution
            const labels = Array.from({length: 30}, (_, i) => `T-${30-i}d`);
            const dataBase = labels.map(() => Math.floor(Math.random() * 8) + 1);
            // Add a cluster spike
            dataBase[25] = 24; dataBase[26] = 18; dataBase[27] = 12;

            new Chart(sdCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Signals Fired',
                        data: dataBase,
                        backgroundColor: dataBase.map(v => v > 15 ? 'rgba(239, 68, 68, 0.8)' : v > 8 ? 'rgba(0, 242, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'),
                        borderRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(13, 17, 23, 0.95)' } },
                    scales: {
                        x: { display: false, grid: { display: false } },
                        y: { display: false, grid: { display: false }, suggestedMax: 30 }
                    }
                }
            });
        }
    }, 50);

    // Z-Score Bell Curve — built from live signal Z-scores
    setTimeout(() => {
        const bellCtx = document.getElementById('zscoreBellChart');
        if (!bellCtx || !signals || !signals.length) return;

        // Bin the actual signal Z-scores into buckets from -4 to +4
        const buckets = [-4,-3,-2,-1,0,1,2,3,4];
        const bucketLabels = buckets.map(b => b.toFixed(0));
        const counts = new Array(buckets.length).fill(0);
        signals.forEach(s => {
            const z = Math.max(-4, Math.min(4, s.zScore || 0));
            const idx = Math.round(z + 4); // shift to 0-8 range
            if (idx >= 0 && idx < counts.length) counts[idx]++;
        });

        // Compute Gaussian PDF for overlay (scaled to match histogram)
        const maxCount = Math.max(...counts, 1);
        const mean = signals.reduce((a, s) => a + (s.zScore || 0), 0) / signals.length;
        const variance = signals.reduce((a, s) => a + Math.pow((s.zScore || 0) - mean, 2), 0) / signals.length;
        const std = Math.sqrt(variance) || 1;
        const gaussian = buckets.map(x => {
            const exp = Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
            return (exp / (std * Math.sqrt(2 * Math.PI))) * signals.length * 0.9;
        });

        new Chart(bellCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: bucketLabels,
                datasets: [
                    {
                        label: 'Signal Count',
                        data: counts,
                        backgroundColor: counts.map((_, i) => {
                            const z = buckets[i];
                            if (Math.abs(z) >= 3) return 'rgba(239,68,68,0.75)';
                            if (Math.abs(z) >= 2) return 'rgba(251,146,60,0.65)';
                            if (Math.abs(z) >= 1) return 'rgba(0,242,255,0.5)';
                            return 'rgba(255,255,255,0.2)';
                        }),
                        borderRadius: 3,
                        order: 2
                    },
                    {
                        label: 'Gaussian Fit',
                        data: gaussian,
                        type: 'line',
                        borderColor: 'rgba(188,19,254,0.8)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
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
                        callbacks: { label: c => c.datasetIndex === 0 ? `${c.raw} signals` : `Fit: ${c.raw.toFixed(1)}` }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'JetBrains Mono', size: 9 } } },
                    y: { display: false, grid: { display: false } }
                }
            }
        });
    }, 50);

    // Signal Confidence Radar — loads after signals are painted
    setTimeout(async () => {
        const radarSection = document.createElement('div');
        radarSection.innerHTML = `
            <div class="card" style="padding:1.5rem;margin-top:2rem;background:rgba(5,5,30,0.7);border:1px solid rgba(0,242,255,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;">
                    <h3 style="margin:0;font-size:0.85rem;color:var(--accent);letter-spacing:1px;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">radar</span>SIGNAL CONFIDENCE RADAR
                        <select id="radar-ticker-select" style="background:rgba(0,0,0,0.4);border:1px solid rgba(0,242,255,0.2);color:white;font-size:0.7rem;padding:2px 8px;border-radius:4px;margin-left:12px;font-family:'JetBrains Mono';" onchange="loadSignalRadar(this.value)">
                            <option value="BTC-USD">BTC</option><option value="ETH-USD">ETH</option>
                            <option value="SOL-USD">SOL</option><option value="LINK-USD">LINK</option>
                            <option value="ADA-USD">ADA</option>
                        </select>
                    </h3>
                    <span style="font-size:0.55rem;color:var(--text-dim);">6-DIMENSION ML SIGNAL DECOMPOSITION</span>
                </div>
                <div style="display:flex;justify-content:center;padding-bottom:2rem;">
                    <div style="width:340px;height:340px;"><canvas id="signalRadarChart"></canvas></div>
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
                        borderColor: '#00f2ff',
                        backgroundColor: 'rgba(0,242,255,0.08)',
                        pointBackgroundColor: '#00f2ff',
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
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">ML</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-alpha-score')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
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
                    <h2><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">bolt</span> Alpha Score <span class="premium-badge">LIVE</span></h2>
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
