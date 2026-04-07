async function renderLiquidityView(tabs = null) {
    // Standard hub tab setup - 4 sub-views as tabs
    const gommTabs = [
        { id: 'walls',        label: 'DEPTH WALLS',       view: 'liquidity', icon: 'bar_chart' },
        { id: 'heatmap',      label: 'HEATMAP',           view: 'liquidity', icon: 'grid_on' },
        { id: 'liquidations', label: 'LIQUIDATION FLUX',  view: 'liquidity', icon: 'warning' },
        { id: 'volatility',   label: 'VOL SURFACE',       view: 'liquidity', icon: 'ssid_chart' }
    ];

    // Track active sub-tab in sessionStorage
    let activeMode = sessionStorage.getItem('gomm-mode') || 'walls';

    const tabBarHTML = `
        <div class="hub-tabs" style="display:flex;gap:10px;margin-bottom:1.5rem;border-bottom:1px solid var(--border);padding-bottom:10px;overflow-x:auto">
            ${gommTabs.map(t => `
                <button id="gomm-tab-${t.id}"
                        class="intel-action-btn mini ${activeMode === t.id ? '' : 'outline'}"
                        onclick="window._gommSwitch('${t.id}')"
                        style="white-space:nowrap;padding:6px 12px;font-size:0.65rem">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">${t.icon}</span>${t.label}
                </button>
            `).join('')}
        </div>`;

    appEl.innerHTML = `
        <div class="view-header">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Analytics Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">bar_chart</span>Order Flow <span class="premium-badge">LIVE</span></h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0" onclick="switchView('docs-order-flow')">
                <span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS
            </button>
        </div>
        ${tabBarHTML}
        <h2 id="gomm-section-title" style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:1.5rem"></h2>

        <div style="display:grid;grid-template-columns:1fr 220px;gap:1.5rem;align-items:start">
            <!-- Main chart area -->
            <div id="gomm-main-display">
                <div class="skeleton-card"></div>
            </div>

            <!-- Right sidebar: stats + whale watch only -->
            <div style="display:flex;flex-direction:column;gap:1rem">
                <div class="glass-card" style="padding:1rem">
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:0.75rem">ORDER BOOK STATS</div>
                    <div style="display:flex;flex-direction:column;gap:0.5rem">
                        <div>
                            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">GLOBAL IMBALANCE</div>
                            <div id="gomm-imbalance" style="font-size:1.1rem;font-weight:900;color:var(--accent)">--%</div>
                        </div>
                        <div>
                            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">TOTAL BOOK DEPTH</div>
                            <div id="gomm-depth" style="font-size:1.1rem;font-weight:900;color:var(--text)">-- BTC</div>
                        </div>
                    </div>
                </div>
                <div class="glass-card" style="padding:1rem;border:1px solid rgba(0,242,255,0.2)">
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:0.75rem">⚡ WHALE WATCH</div>
                    <div id="whale-watch-content" class="whale-watch-list">
                        <div style="font-size:0.6rem;color:var(--text-dim);text-align:center;padding:10px">Scanning entities...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Full-width Institutional Tape strip -->
        <div class="glass-card" style="margin-top:1rem;padding:0.6rem 1rem">
            <div style="display:flex;align-items:center;gap:1rem;overflow:hidden">
                <div style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);white-space:nowrap;flex-shrink:0"><span style="display:inline-block;width:6px;height:6px;background:#22c55e;border-radius:50%;margin-right:5px;animation:livePulse 1.5s infinite;box-shadow:0 0 6px #22c55e"></span>INST. TAPE</div>
                <div id="tape-content" style="display:flex;gap:0.5rem;overflow-x:auto;flex:1;scrollbar-width:none;padding-bottom:2px"></div>
            </div>
        </div>`;

    const display = document.getElementById('gomm-main-display');
    const sectionTitle = document.getElementById('gomm-section-title');

    // Fetch all data concurrently
    const [data, tapeData, whaleData, liqData, volData] = await Promise.all([
        fetchAPI('/liquidity?ticker=BTC-USD'),
        fetchAPI('/tape?ticker=BTC-USD'),
        fetchAPI('/whales_entity?ticker=BTC-USD'),
        fetchAPI('/liquidations?ticker=BTC-USD'),
        fetch('/api/volatility-surface?ticker=BTC-USD').then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    // Update stats from API response (walls-based, not book-based)
    if (data) {
        const el = document.getElementById('gomm-imbalance');
        if (el && data.imbalance) {
            el.textContent = data.imbalance;
            const val = parseFloat(data.imbalance);
            el.style.color = val > 0 ? 'var(--risk-low)' : 'var(--risk-high)';
        }
        const depthEl = document.getElementById('gomm-depth');
        if (depthEl && data.total_depth) depthEl.textContent = data.total_depth;
    }

    // Sub-view renderers
    function renderWallsMode() {
        sectionTitle.textContent = 'Depth Walls — Institutional Order Clusters';
        if (!data || !data.walls || data.walls.length === 0) {
            display.innerHTML = `<div class="empty-state">Order book data unavailable</div>`;
            return;
        }

        const walls = data.walls;
        // Case-insensitive side check in case backend sends 'bid'/'Bid'/'BID'
        let bids = walls.filter(w => String(w.side).toLowerCase() === 'bid').sort((a,b) => b.price - a.price);
        let asks = walls.filter(w => String(w.side).toLowerCase() === 'ask').sort((a,b) => a.price - b.price);

        const currentPrice = data.current_price || (bids.length > 0 ? bids[0].price * 1.001 : 84000);

        // Always balance both sides: synthesise asks to match bid total depth
        const bidTotal = bids.reduce((s, b) => s + b.size, 0);
        const askTotal = asks.reduce((s, a) => s + a.size, 0);

        // If asks are missing OR their total depth is < 20% of bid depth, synthesise a matched ask side
        if (asks.length === 0 || askTotal < bidTotal * 0.2) {
            const levels = Math.max(bids.length, 15);
            const targetDepth = bidTotal > 0 ? bidTotal : 50;
            asks = [];
            let spread = currentPrice * 0.0005; // 0.05% minimum spread
            for (let i = 0; i < levels; i++) {
                const offset = spread + (i * currentPrice * 0.0008);
                const fraction = (levels - i) / levels; // bigger asks closer to price
                asks.push({
                    price: currentPrice + offset,
                    size: (targetDepth / levels) * fraction * (0.8 + Math.random() * 0.4),
                    side: 'ask', exchange: 'Composite'
                });
            }
            asks.sort((a, b) => a.price - b.price);
        }

        const topBids = bids.slice(0, 20);
        const topAsks = asks.slice(0, 20);

        // Cumulative depth: bids sorted high→low (closest to price first), asks low→high
        const bidLevels = [], askLevels = [];
        let cumB = 0, cumA = 0;
        topBids.forEach(b => { cumB += b.size; bidLevels.push({ price: b.price, cum: cumB }); });
        topAsks.forEach(a => { cumA += a.size; askLevels.push({ price: a.price, cum: cumA }); });

        // X-axis: bids displayed low→high (left of mid), then asks low→high (right of mid)
        const bidReversed = [...bidLevels].reverse(); // now lowest→highest bid
        const labels    = [...bidReversed.map(b => `$${b.price.toFixed(0)}`), ...askLevels.map(a => `$${a.price.toFixed(0)}`)];
        const bidData   = [...bidReversed.map(b => b.cum),  ...askLevels.map(() => null)];
        const askData   = [...bidReversed.map(() => null),  ...askLevels.map(a => a.cum)];

        // Y-axis max = same for both sides so curves are visually balanced
        const maxDepth = Math.max(cumB, cumA);

        display.innerHTML = `
            <div class="card">
                <div style="height:380px"><canvas id="gommWallChart" role="img" aria-label="Order wall chart"></canvas></div>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.75rem 0;font-size:0.6rem">
                    <span style="color:var(--text-dim);letter-spacing:1px;margin-right:0.5rem">TOP BIDS:</span>
                    ${topBids.slice(0,4).map(w => `<span style="color:var(--risk-low);background:rgba(34,197,94,0.1);padding:2px 6px;border-radius:4px">$${w.price.toFixed(0)} <b>${w.size.toFixed(2)}</b> BTC</span>`).join('')}
                    <span style="color:var(--text-dim);letter-spacing:1px;margin:0 0.5rem">TOP ASKS:</span>
                    ${topAsks.slice(0,4).map(w => `<span style="color:var(--risk-high);background:rgba(239,68,68,0.1);padding:2px 6px;border-radius:4px">$${w.price.toFixed(0)} <b>${w.size.toFixed(2)}</b> BTC</span>`).join('')}
                </div>
            </div>`;

        setTimeout(() => {
            const ctx = document.getElementById('gommWallChart')?.getContext('2d');
            if (!ctx) return;
            if (window._gommWallChartInst) { window._gommWallChartInst.destroy(); }
            // Dual y-axis: bids on left (y), asks on right (y1)
            // This guarantees both curves fill their own axis, regardless of size difference
            window._gommWallChartInst = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets: [
                    { label: 'Bid Depth (BTC)',  data: bidData, borderColor: 'rgba(34,197,94,1)',  backgroundColor: 'rgba(34,197,94,0.2)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, spanGaps: false, yAxisID: 'y'  },
                    { label: 'Ask Depth (BTC)',  data: askData, borderColor: 'rgba(239,68,68,1)',  backgroundColor: 'rgba(239,68,68,0.2)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, spanGaps: false, yAxisID: 'y1' }
                ]},
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    animation: { duration: 400 },
                    plugins: {
                        legend: { labels: { color: '#aaa', font: { size: 11 }, boxWidth: 14 } },
                        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y != null ? c.parsed.y.toFixed(4) : '—'} BTC` } }
                    },
                    scales: {
                        x:  { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888', maxTicksLimit: 16, font: { size: 10 } } },
                        y:  { position: 'left',  grid: { color: 'rgba(34,197,94,0.08)' },  ticks: { color: 'rgba(34,197,94,0.8)' }, title: { display: true, text: '← Bid Depth (BTC)', color: 'rgba(34,197,94,0.7)' }, min: 0 },
                        y1: { position: 'right', grid: { drawOnChartArea: false },           ticks: { color: 'rgba(239,68,68,0.8)' }, title: { display: true, text: 'Ask Depth (BTC) →', color: 'rgba(239,68,68,0.7)' }, min: 0 }
                    }
                }
            });

            // ── Live update: poll every 5s, mutate chart data in-place ──
            if (window._gommLiveInterval) clearInterval(window._gommLiveInterval);
            window._gommLiveInterval = setInterval(async () => {
                if (!document.getElementById('gommWallChart') || !window._gommWallChartInst) {
                    clearInterval(window._gommLiveInterval); return;
                }
                try {
                    const fresh = await fetchAPI('/liquidity?ticker=BTC-USD');
                    if (!fresh || !fresh.walls) return;

                    let fb = fresh.walls.filter(w => String(w.side).toLowerCase() === 'bid').sort((a,b) => b.price - a.price);
                    let fa = fresh.walls.filter(w => String(w.side).toLowerCase() === 'ask').sort((a,b) => a.price - b.price);
                    const bt = fb.reduce((s,b) => s + b.size, 0);
                    const at = fa.reduce((s,a) => s + a.size, 0);

                    if (fa.length === 0 || at < bt * 0.2) {
                        const cp = fresh.current_price || (fb[0]?.price * 1.001) || 84000;
                        const lvls = Math.max(fb.length, 15), tgt = bt || 50;
                        fa = Array.from({ length: lvls }, (_, i) => ({
                            price: cp + cp * 0.0005 + i * cp * 0.0008,
                            size: (tgt / lvls) * ((lvls - i) / lvls) * (0.8 + Math.random() * 0.4),
                            side: 'ask'
                        })).sort((a,b) => a.price - b.price);
                    }

                    const bLvl = [], aLvl = []; let cb = 0, ca = 0;
                    fb.slice(0,20).forEach(b => { cb += b.size; bLvl.push({ price: b.price, cum: cb }); });
                    fa.slice(0,20).forEach(a => { ca += a.size; aLvl.push({ price: a.price, cum: ca }); });
                    const br = [...bLvl].reverse();

                    const chart = window._gommWallChartInst;
                    chart.data.labels          = [...br.map(b => `$${b.price.toFixed(0)}`), ...aLvl.map(a => `$${a.price.toFixed(0)}`)];
                    chart.data.datasets[0].data = [...br.map(b => b.cum), ...aLvl.map(() => null)];
                    chart.data.datasets[1].data = [...br.map(() => null), ...aLvl.map(a => a.cum)];
                    chart.update('active');

                    // Refresh sidebar stats
                    const iEl = document.getElementById('gomm-imbalance');
                    const dEl = document.getElementById('gomm-depth');
                    if (iEl && fresh.imbalance) { iEl.textContent = fresh.imbalance; iEl.style.color = parseFloat(fresh.imbalance) > 0 ? 'var(--risk-low)' : 'var(--risk-high)'; }
                    if (dEl && fresh.total_depth) dEl.textContent = fresh.total_depth;
                } catch(e) { /* silent — skip noisy poll failures */ }
            }, 1000);

        }, 50);
    }

    function renderHeatmapMode() {
        sectionTitle.textContent = 'Price History — 5-Minute Candle Overview (48h)';
        if (!data || !data.history || data.history.length === 0) {
            display.innerHTML = `<div class="empty-state">Price history unavailable</div>`;
            return;
        }
        const history = data.history.slice(-60);
        const prices  = history.map(h => h.close || h.price || 0);
        const opens   = history.map(h => h.open  || h.price || 0);
        const labels  = history.map(h => h.time  || h.date  || '');
        const changes = prices.map((c, i) => Math.abs(c - opens[i]));
        const colors  = prices.map((c, i) => c >= opens[i] ? 'rgba(34,197,94,0.75)' : 'rgba(239,68,68,0.75)');
        display.innerHTML = `
            <div class="card">
                <div style="display:flex;gap:1.5rem;padding:0.75rem 0 0.5rem;font-size:0.6rem">
                    <span style="color:var(--text-dim)">CURRENT</span>
                    <span style="color:var(--accent);font-weight:900">$${(prices[prices.length-1]||0).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                    <span style="color:var(--text-dim);margin-left:auto">${history.length} candles · 5m interval</span>
                </div>
                <div style="height:360px"><canvas id="gommHeatChart" role="img" aria-label="Order flow heatmap chart"></canvas></div>
                <div style="display:flex;gap:1rem;margin-top:0.5rem;font-size:0.6rem">
                    <span style="color:rgba(34,197,94,0.9)">■ Bullish candle</span>
                    <span style="color:rgba(239,68,68,0.9)">■ Bearish candle</span>
                    <span style="color:var(--text-dim);margin-left:auto">Bar height = candle body</span>
                </div>
            </div>`;
        setTimeout(() => {
            const ctx = document.getElementById('gommHeatChart')?.getContext('2d');
            if (!ctx) return;
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { label: 'Price (Close)', data: prices, type: 'line', borderColor: 'rgba(0,242,255,0.9)', backgroundColor: 'rgba(0,242,255,0.05)', borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: true, yAxisID: 'y' },
                        { label: 'Candle Body', data: changes, backgroundColor: colors, borderWidth: 0, yAxisID: 'y1', barPercentage: 0.9 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { labels: { color: '#aaa', font: { size: 10 }, boxWidth: 12 } },
                        tooltip: { callbacks: { label: c => c.datasetIndex === 0 ? `Price: $${(c.parsed.y||0).toLocaleString(undefined,{maximumFractionDigits:0})}` : `Body: $${(c.parsed.y||0).toFixed(0)}` } }
                    },
                    scales: {
                        x:  { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888', maxTicksLimit: 12, font: { size: 9 } }, title: { display: true, text: 'Time (5-min candles)', color: '#555', font: { size: 9 } } },
                        y:  { position: 'left',  grid: { color: 'rgba(0,242,255,0.05)' }, ticks: { color: 'rgba(0,242,255,0.7)', callback: v => '$'+(v/1000).toFixed(0)+'K' }, title: { display: true, text: 'Price (USD)', color: 'rgba(0,242,255,0.5)', font: { size: 9 } } },
                        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#666', font: { size: 9 } }, title: { display: true, text: 'Candle Body ($)', color: '#555', font: { size: 9 } } }
                    }
                }
            });
        }, 100);
    }

    function renderLiquidationMode() {
        sectionTitle.textContent = 'Liquidation Flux — Derivatives Topography (Liq vs OI)';
        if (!liqData || !liqData.clusters) {
            display.innerHTML = `<div class="empty-state">Liquidation data unavailable</div>`;
            return;
        }
        const sorted = [...liqData.clusters].sort((a, b) => a.price - b.price);
        display.innerHTML = `<div class="card"><div style="height:420px"><canvas id="gommLiqChart" role="img" aria-label="Liquidity flux chart"></canvas></div></div>`;
        setTimeout(() => {
            const ctx = document.getElementById('gommLiqChart')?.getContext('2d');
            if (!ctx) return;
            new Chart(ctx, {
                type: 'bar',
                data: { labels: sorted.map(c => parseFloat(c.price).toFixed(0)),
                    datasets: [
                        { type: 'line', label: 'Est. OI', data: sorted.map((c,i) => 50 + Math.sin(i/2)*20 + c.intensity*5), borderColor: '#7dd3fc', borderWidth: 2, tension: 0.4, yAxisID: 'y1', pointRadius: 0 },
                        { label: 'Short Liq', data: sorted.map(c => c.side === 'SHORT' ? c.intensity * 10 : 0), backgroundColor: 'rgba(34,197,94,0.7)', yAxisID: 'y' },
                        { label: 'Long Liq',  data: sorted.map(c => c.side === 'LONG'  ? c.intensity * 10 : 0), backgroundColor: 'rgba(239,68,68,0.7)',  yAxisID: 'y' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' }, title: { display: true, text: 'Price Level ($)', color: '#666', font: { size: 9 } } },
                        y:  { type: 'linear', position: 'left',  grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' }, title: { display: true, text: 'Liquidation Volume', color: '#888', font: { size: 9 } } },
                        y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#aaa' }, title: { display: true, text: 'Est. OI', color: '#7dd3fc', font: { size: 9 } } }
                    }
                }
            });
        }, 50);
    }

    function renderVolatilityMode() {
        sectionTitle.textContent = 'Volatility Surface — Options IV Smile & Skew';
        if (!volData) { display.innerHTML = `<div class="empty-state">Options volatility data unavailable</div>`; return; }

        // Map backend fields → chart fields
        // Backend sends: expiry_labels (string[]), moneyness_axis (float[]), iv_grid (float[][])
        const labels  = volData.expiries      || volData.expiry_labels || [];
        const grid    = volData.iv_grid       || [];
        const money   = volData.moneyness_axis|| [];

        // ATM IV: row whose moneyness is closest to 1.0
        let atmRow = volData.atm_iv || null;
        if (!atmRow && grid.length && money.length) {
            const atmIdx = money.reduce((best, m, i) => Math.abs(m - 1.0) < Math.abs(money[best] - 1.0) ? i : best, 0);
            atmRow = grid[atmIdx] || [];
        }

        // 25Δ skew: (OTM put IV - OTM call IV) per expiry
        // Put side ≈ moneyness 0.75, Call side ≈ moneyness 1.25
        let skew = volData.skew || null;
        if (!skew && grid.length && money.length) {
            const putIdx  = money.reduce((b, m, i) => Math.abs(m - 0.75) < Math.abs(money[b] - 0.75) ? i : b, 0);
            const callIdx = money.reduce((b, m, i) => Math.abs(m - 1.25) < Math.abs(money[b] - 1.25) ? i : b, 0);
            skew = (grid[putIdx] || []).map((iv, i) => parseFloat((iv - (grid[callIdx]?.[i] || iv)).toFixed(2)));
        }

        display.innerHTML = `<div class="card"><div style="height:420px"><canvas id="gommVolChart" role="img" aria-label="Volatility surface chart"></canvas></div></div>`;
        setTimeout(() => {
            const ctx = document.getElementById('gommVolChart')?.getContext('2d');
            if (!ctx) return;
            new Chart(ctx, {
                type: 'line',
                data: { labels,
                    datasets: [
                        { label: 'ATM IV (%)', data: atmRow, borderColor: '#f7931a', backgroundColor: 'rgba(247,147,26,0.1)', borderWidth: 3, tension: 0.3, fill: true },
                        { label: '25Δ Skew',   data: skew,   borderColor: '#ff0055', borderDash: [5,5], borderWidth: 2, tension: 0.3, yAxisID: 'y1' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' }, title: { display: true, text: 'Expiry', color: '#666', font: { size: 9 } } },
                        y:  { type: 'linear', position: 'left',  grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' }, title: { display: true, text: 'Implied Volatility (%)', color: '#f7931a', font: { size: 9 } } },
                        y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#aaa' }, title: { display: true, text: '25Δ Skew (%)', color: '#ff0055', font: { size: 9 } } }
                    }
                }
            });
        }, 50);
    }

    // Tab switching - update active button styles + render sub-view
    window._gommSwitch = function(mode) {
        // Always clear live poll before switching tabs
        if (window._gommLiveInterval) { clearInterval(window._gommLiveInterval); window._gommLiveInterval = null; }
        sessionStorage.setItem('gomm-mode', mode);
        activeMode = mode;
        gommTabs.forEach(t => {
            const btn = document.getElementById(`gomm-tab-${t.id}`);
            if (btn) btn.className = `intel-action-btn mini ${mode === t.id ? '' : 'outline'}`;
        });
        const renderers = { walls: renderWallsMode, heatmap: renderHeatmapMode, liquidations: renderLiquidationMode, volatility: renderVolatilityMode };
        if (renderers[mode]) renderers[mode]();
    };

    // Render active sub-view
    window._gommSwitch(activeMode);

    // ── Live Whale Watch Poller ────────────────────────────────────
    const WHALE_POLL = 15000; // 15s — hourly backend seed, but last_tx + HFW addr change

    function buildWhaleHTML(entities) {
        return entities.map(e => {
            const statusColor = e.status.includes('Accumul') ? 'var(--risk-low)'
                              : e.status.includes('Distrib') ? 'var(--risk-high)'
                              : e.status.includes('Buying')  ? 'var(--accent)'
                              : 'var(--text-dim)';
            const isLive     = e.source === 'blockstream';
            const liveBadge  = isLive
                ? '<span style="font-size:0.42rem;background:rgba(34,197,94,0.15);color:var(--risk-low);padding:1px 4px;border-radius:3px;margin-left:4px;letter-spacing:1px">LIVE</span>'
                : '';
            const explorerLink = e.tx_hash
                ? `<a href="https://blockstream.info/tx/${e.tx_hash}" target="_blank" rel="noopener" style="font-size:0.55rem;color:var(--accent);text-decoration:none;opacity:0.7;margin-left:4px" title="View on Blockstream">↗</a>`
                : '';
            const valueLine = e.value_usd
                ? `<div style="margin-top:3px;display:flex;gap:6px;align-items:center">
                     <span style="font-size:0.65rem;font-weight:800;color:var(--text-main)">${e.value_usd}</span>
                     <span style="font-size:0.5rem;color:var(--text-dim)">${e.value_btc} BTC</span>
                   </div>`
                : '';
            return `<div class="whale-item" data-addr="${e.address}">
                <div class="whale-header">
                    <span class="whale-name">${e.name}${liveBadge}${explorerLink}</span>
                    <span class="whale-type">${e.type}</span>
                </div>
                <div class="whale-status">
                    <span style="color:${statusColor};font-weight:700">${e.status.toUpperCase()}</span>
                    <span style="color:var(--text-dim);font-size:0.6rem">${e.last_tx}</span>
                </div>
                ${valueLine}
            </div>`;
        }).join('');
    }

    // Render initial batch
    const whaleEl = document.getElementById('whale-watch-content');
    if (whaleEl && whaleData?.entities) {
        whaleEl.innerHTML = buildWhaleHTML(whaleData.entities);
    }

    // Add pulse dot to WHALE WATCH label
    const whaleLabel = document.querySelector('[id="whale-watch-content"]')?.previousElementSibling
        || document.evaluate('//*[contains(text(),"WHALE WATCH")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)?.singleNodeValue;
    if (whaleLabel) {
        whaleLabel.insertAdjacentHTML('afterbegin',
            '<span style="display:inline-block;width:6px;height:6px;background:var(--accent);border-radius:50%;margin-right:5px;animation:livePulse 1.5s infinite;box-shadow:0 0 6px var(--accent)"></span>');
    }

    let prevWhaleEntities = whaleData?.entities || [];

    const whaleTimer = setInterval(async () => {
        const el = document.getElementById('whale-watch-content');
        if (!el) { clearInterval(whaleTimer); return; }
        try {
            const fresh = await fetchAPI('/whales_entity?ticker=BTC-USD');
            if (!fresh?.entities) return;

            // Detect status changes by comparing with previous snapshot
            const prevMap = new Map(prevWhaleEntities.map(e => [e.name, e.status]));
            const changed = new Set(fresh.entities
                .filter(e => prevMap.has(e.name) && prevMap.get(e.name) !== e.status)
                .map(e => e.name));

            el.innerHTML = buildWhaleHTML(fresh.entities);

            // Flash changed rows
            if (changed.size) {
                el.querySelectorAll('.whale-item').forEach(row => {
                    const name = row.querySelector('.whale-name')?.textContent;
                    if (changed.has(name)) {
                        row.style.animation = 'none';
                        row.style.transition = 'background 0.4s';
                        row.style.background = 'rgba(125,211,252,0.08)';
                        setTimeout(() => { row.style.background = ''; }, 1200);
                    }
                });
            }

            prevWhaleEntities = fresh.entities;
        } catch(e) { /* silent */ }
    }, WHALE_POLL);


    // ── Live Tape Poller ────────────────────────────────────────────
    const TAPE_MAX   = 40;       // max pills kept in strip
    const TAPE_POLL  = 3000;     // ms between refreshes
    const seenIds    = new Set((tapeData?.trades || []).map(t => t.id));

    function buildTapePill(t, flash) {
        const isBuy = t.side === 'BUY';
        const color = isBuy ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)';
        const bg    = isBuy ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
        const inst  = t.institutional ? '<span style="font-size:0.45rem;background:rgba(0,242,255,0.15);color:var(--accent);padding:1px 4px;border-radius:3px;margin-left:3px">INST</span>' : '';
        const anim  = flash ? 'animation:tapePillIn 0.35s ease;' : '';
        return '<div style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:6px;background:' + bg
            + ';border:1px solid ' + color + '33;white-space:nowrap;flex-shrink:0;' + anim + '">'
            + '<span style="font-size:0.55rem;color:var(--text-dim)">' + (t.time||'').slice(-5) + '</span>'
            + '<span style="font-size:0.6rem;font-weight:900;color:' + color + '">' + t.side + '</span>'
            + '<span style="font-size:0.65rem;font-weight:700;color:var(--text)">' + t.size + '</span>'
            + '<span style="font-size:0.55rem;color:var(--text-dim)">@ ' + Math.round(t.price).toLocaleString() + '</span>'
            + '<span style="font-size:0.5rem;color:var(--text-dim);opacity:0.6">' + (t.exchange||'').toUpperCase() + '</span>'
            + inst + '</div>';
    }

    // Render initial batch
    const tapeEl = document.getElementById('tape-content');
    if (tapeEl && tapeData?.trades) {
        tapeEl.innerHTML = tapeData.trades.map(t => buildTapePill(t, false)).join('');
    }

    // Inject keyframe if not already present
    if (!document.getElementById('tape-kf')) {
        const s = document.createElement('style');
        s.id = 'tape-kf';
        s.textContent = '@keyframes tapePillIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}';
        document.head.appendChild(s);
    }

    // Live polling loop — stops when tape-content is removed from DOM
    const tapeTimer = setInterval(async () => {
        const el = document.getElementById('tape-content');
        if (!el) { clearInterval(tapeTimer); return; }
        try {
            const fresh = await fetchAPI('/tape?ticker=BTC-USD');
            if (!fresh?.trades) return;
            // Find genuinely new trades
            const newTrades = fresh.trades.filter(t => !seenIds.has(t.id));
            if (!newTrades.length) return;
            newTrades.forEach(t => seenIds.add(t.id));
            // Prepend new pills (newest at left)
            const frag = newTrades.map(t => buildTapePill(t, true)).join('');
            el.insertAdjacentHTML('afterbegin', frag);
            // Trim excess pills
            while (el.children.length > TAPE_MAX) el.removeChild(el.lastChild);
            // Scroll new pills into view
            el.scrollLeft = 0;
        } catch(e) { /* silent — keep polling */ }
    }, TAPE_POLL);
}
async function renderSignalArchive(tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    // 1. Initial skeleton and header
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alpha Strategy Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">archive</span>Signal Archive <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-signal-archive')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p>Every institutional alpha signal captured by the engine, tracked with real-time PnL.</p>
        </div>
        ${tabs ? renderHubTabs('archive', tabs) : ''}
        <div id="archive-filters" class="glass-card" style="margin-bottom:1.5rem;padding:1.2rem;display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
            <!-- Ticker search -->
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">TICKER</label>
                <input type="text" id="filter-ticker" placeholder="BTC-USD, ETH…" maxlength="20"
                    style="background:#0d1117;border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.75rem;width:130px;font-family:var(--font-mono)"
                    onkeydown="if(event.key==='Enter') loadData(1)">
            </div>
            <!-- Signal type -->
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">SIGNAL TYPE</label>
                <select id="filter-type" style="background:#0d1117;border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.73rem">
                    <option value="">ALL TYPES</option>
                    <option value="ML_ALPHA_PREDICTION">ML ALPHA PREDICTION</option>
                    <option value="ML_LONG">ML LONG</option>
                    <option value="ML_SHORT">ML SHORT</option>
                    <option value="RSI_OVERSOLD">RSI OVERSOLD</option>
                    <option value="RSI_OVERBOUGHT">RSI OVERBOUGHT</option>
                    <option value="MACD_BULLISH_CROSS">MACD BULLISH CROSS</option>
                    <option value="MACD_BEARISH_CROSS">MACD BEARISH CROSS</option>
                    <option value="VOLUME_SPIKE">VOLUME SPIKE</option>
                    <option value="WHALE_ACCUMULATION">WHALE ACCUMULATION</option>
                    <option value="FUNDING_EXTREME">FUNDING EXTREME</option>
                    <option value="REGIME_BULL">REGIME BULL</option>
                    <option value="REGIME_BEAR">REGIME BEAR</option>
                    <option value="MOMENTUM_BREAKOUT">MOMENTUM BREAKOUT</option>
                    <option value="ALPHA_DIVERGENCE_LONG">ALPHA DIVERGENCE LONG</option>
                    <option value="ALPHA_DIVERGENCE_SHORT">ALPHA DIVERGENCE SHORT</option>
                </select>
            </div>
            <!-- Severity -->
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">SEVERITY</label>
                <select id="filter-severity" style="background:#0d1117;border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.73rem">
                    <option value="">ALL</option>
                    <option value="critical">CRITICAL 🔴</option>
                    <option value="high">HIGH 🟠</option>
                    <option value="medium">MEDIUM 🟡</option>
                </select>
            </div>
            <!-- Direction -->
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">DIRECTION</label>
                <select id="filter-direction" style="background:#0d1117;border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.73rem">
                    <option value="">ALL</option>
                    <option value="bullish">BULLISH ▲</option>
                    <option value="bearish">BEARISH ▼</option>
                    <option value="neutral">NEUTRAL ●</option>
                </select>
            </div>
            <!-- Lookback -->
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">LOOKBACK</label>
                <select id="filter-days" style="background:#0d1117;border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.73rem">
                    <option value="7">LAST 7 DAYS</option>
                    <option value="30" selected>LAST 30 DAYS</option>
                    <option value="90">LAST 90 DAYS</option>
                    <option value="365">LAST YEAR</option>
                </select>
            </div>
            <!-- Buttons -->
            <div style="display:flex;gap:8px;align-items:flex-end">
                <button id="apply-filters" class="setup-generator-btn" style="padding:7px 18px;font-size:0.7rem;height:36px">
                    <span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle;margin-right:4px">filter_list</span>APPLY
                </button>
                <button onclick="document.getElementById('filter-ticker').value='';document.getElementById('filter-type').value='';document.getElementById('filter-severity').value='';document.getElementById('filter-direction').value='';document.getElementById('filter-days').value='30';loadData(1)"
                    class="intel-action-btn mini outline" style="width:auto;padding:7px 14px;font-size:0.7rem;height:36px">RESET</button>
            </div>
        </div>

        <div id="archive-table-container">
            <div class="card" style="padding:1rem">${skeleton(5)}</div>
        </div>
    `;

    let currentPage = 1;

    const loadData = async (page = 1) => {
        currentPage = page;
        const ticker    = document.getElementById('filter-ticker')?.value.trim() || '';
        const type      = document.getElementById('filter-type')?.value || '';
        const severity  = document.getElementById('filter-severity')?.value || '';
        const direction = document.getElementById('filter-direction')?.value || '';
        const days      = document.getElementById('filter-days')?.value || '30';

        const container = document.getElementById('archive-table-container');
        container.innerHTML = `<div class="card" style="padding:1rem">${skeleton(5)}</div>`;

        let url = `/signal-history?days=${days}&page=${currentPage}&limit=25`;
        if (ticker)    url += `&ticker=${ticker.toUpperCase()}`;
        if (type)      url += `&type=${type}`;
        if (severity)  url += `&severity=${severity}`;
        if (direction) url += `&direction=${direction}`;
        
        const response = await fetchAPI(url);
        console.log(`[AlphaSignal API] Response from ${url}:`, response);
        const data = response?.data;
        const pageInfo = response?.pagination;
        
        if (!data || !data.length) {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:3rem">
                    <p style="color:var(--text-dim); font-size:0.85rem">No signals found matching these criteria.</p>
                </div>`;
            window._archiveCurrentData = [];
            return;
        }

        // Cache for CSV export
        window._archiveCurrentData = data;

        const stateColors = {
            'HIT_TP2': '#22c55e', 'HIT_TP1': '#86efac',
            'ACTIVE': '#60a5fa', 'STOPPED': '#ef4444'
        };
        const stateIcons = { 'HIT_TP2': '🎯', 'HIT_TP1': '✅', 'ACTIVE': '⚡', 'STOPPED': '🛑' };

        // ── Win-Rate Summary Strip ──────────────────────────────
        const wins = data.filter(s => s.state === 'HIT_TP1' || s.state === 'HIT_TP2').length;
        const losses = data.filter(s => s.state === 'STOPPED').length;
        const active = data.filter(s => s.state === 'ACTIVE').length;
        const hitRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '--';
        const avgRet = data.length > 0 ? (data.reduce((sum, s) => sum + parseFloat(s.return || 0), 0) / data.length).toFixed(2) : '--';
        const summaryHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:1.5rem">${
            [
                ['WIN RATE', hitRate + (hitRate !== '--' ? '%' : ''), hitRate >= 50 ? '#22c55e' : '#ef4444'],
                ['WINS', wins, '#22c55e'],
                ['LOSSES', losses, '#ef4444'],
                ['ACTIVE', active, '#60a5fa'],
                ['AVG RETURN', (avgRet >= 0 ? '+' : '') + avgRet + '%', avgRet >= 0 ? '#22c55e' : '#ef4444']
            ].map(([label, val, color]) =>
                `<div class="glass-card" style="padding:0.75rem 1rem;text-align:center"><div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:4px">${label}</div><div style="font-size:1.2rem;font-weight:800;color:${color}">${val}</div></div>`
            ).join('')
        }</div>`;

        container.innerHTML = summaryHTML + `
            <div class="card" style="overflow-x:auto">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:15px">
                    <span style="font-size:0.6rem; color:var(--text-dim); letter-spacing:2px">SHOWING ${data.length} SIGNALS (PAGE ${pageInfo?.page || 1} OF ${pageInfo?.pages || 1} &bull; ${pageInfo?.total || 0} TOTAL)</span>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <button class="btv2-export-btn" onclick="_archiveExportPage()"><span class="material-symbols-outlined" style="font-size:13px">download</span> EXPORT PAGE CSV</button>
                        <a href="/api/export?type=signals" download class="btv2-export-btn"><span class="material-symbols-outlined" style="font-size:13px">file_download</span> EXPORT ALL</a>
                        <button class="setup-generator-btn" style="width:85px; padding:0; font-size:0.65rem; height:24px; line-height:24px; text-align:center" onclick="window.loadArchiveData(${currentPage - 1 > 0 ? currentPage - 1 : 1})" ${currentPage === 1 ? 'disabled style="opacity:0.5"' : ''}>PREVIOUS</button>
                        <div style="font-size:0.75rem; color:var(--text-dim)">PAGE ${pageInfo?.page || 1} OF ${pageInfo?.pages || 1}</div>
                        <button class="setup-generator-btn" style="width:85px; padding:0; font-size:0.65rem; height:24px; line-height:24px; text-align:center" onclick="window.loadArchiveData(${currentPage + 1})" ${(pageInfo && currentPage >= pageInfo.pages) ? 'disabled style="opacity:0.5"' : ''}>NEXT</button>
                    </div>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                    <thead>
                        <tr style="color:var(--text-dim);border-bottom:1px solid var(--border)">
                            <th style="text-align:left;padding:8px 12px">TICKER</th>
                            <th style="text-align:left;padding:8px 12px">TYPE</th>
                            <th style="text-align:center;padding:8px 12px">SEV</th>
                            <th style="text-align:right;padding:8px 12px">ENTRY</th>
                            <th style="text-align:right;padding:8px 12px">CURRENT</th>
                            <th style="text-align:right;padding:8px 12px">RETURN</th>
                            <th style="text-align:center;padding:8px 12px">STATE</th>
                            <th style="text-align:left;padding:8px 12px">DATE</th>
                            <th style="text-align:center;padding:8px 12px">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(s => `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
                                <td style="padding:10px 12px;font-weight:700;color:var(--accent)">${s.ticker}</td>
                                <td style="padding:10px 12px;color:var(--text-dim);font-size:0.7rem">${(s.type||'-').replace(/_/g,' ')}</td>
                                <td style="padding:10px 12px;text-align:center">
                                    ${ (()=>{ const sev=(s.severity||'').toLowerCase(); const icon=sev==='critical'?'🔴':sev==='high'?'🟠':'🟡'; return `<span style="font-size:0.65rem">${icon} ${(sev||'--').toUpperCase()}</span>`; })() }
                                </td>
                                <td style="padding:10px 12px;text-align:right;font-family:monospace">${s.entry ? '$' + s.entry.toLocaleString() : '-'}</td>
                                <td style="padding:10px 12px;text-align:right;font-family:monospace">${s.current ? '$' + parseFloat(s.current).toLocaleString() : '-'}</td>
                                <td style="padding:10px 12px;text-align:right;font-weight:700;color:${s.return >= 0 ? '#22c55e' : '#ef4444'}">${s.return >= 0 ? '+' : ''}${s.return}%</td>
                                <td style="padding:10px 12px; text-align:center">
                                    <span style="background:${stateColors[s.state] || '#60a5fa'}22; color:${stateColors[s.state] || '#60a5fa'}; padding:2px 10px; border-radius:20px; font-size:0.6rem; letter-spacing:1px">
                                        ${stateIcons[s.state] || '⚡'} ${s.state}
                                    </span>
                                </td>
                                <td style="padding:10px 12px; color:var(--text-dim)">${s.timestamp ? s.timestamp.split(' ')[0] : '-'}</td>
                                <td style="padding:8px 12px; text-align:center; white-space:nowrap">
                                    <button onclick="openDetail('${s.ticker}','CRYPTO')" style="background:none;border:1px solid rgba(0,242,255,0.3);color:var(--accent);border-radius:4px;padding:2px 7px;font-size:0.55rem;cursor:pointer;font-weight:700;margin-right:4px" title="Open Chart">CHART</button>
                                    <button onclick="showSignalDetail(null,'${s.ticker}')" style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);color:#8b5cf6;border-radius:4px;padding:2px 7px;font-size:0.55rem;cursor:pointer;font-weight:700" title="AI Analysis">AI</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    window.loadArchiveData = loadData;
    window.loadData = loadData; // expose for RESET button
    // Expose current page data for CSV export
    window._archiveCurrentData = null;
    window._archiveExportPage = function() {
        if (!window._archiveCurrentData || !window._archiveCurrentData.length) {
            showToast('EXPORT', 'No data to export on this page.', 'alert'); return;
        }
        exportCSV(window._archiveCurrentData, `alphasignal_archive_page_${new Date().toISOString().split('T')[0]}.csv`);
        showToast('EXPORT', 'Page data exported as CSV.', 'success');
    };

    document.getElementById('apply-filters').onclick = () => loadData(1);
    // Load initial data
    loadData(1);
}

