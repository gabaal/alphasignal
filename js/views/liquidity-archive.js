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
    window.gommTicker = sessionStorage.getItem('gomm-ticker') || 'BTC-USD';

    // Helper to change ticker and reload
    window._gommSetTicker = function(newTicker) {
        window.gommTicker = newTicker;
        sessionStorage.setItem('gomm-ticker', newTicker);
        renderLiquidityView(); // Re-render everything
    };

    const cryptoUniverse = [
        // L1
        'BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'AVAX-USD', 'DOT-USD', 'TON-USD', 'ATOM-USD',
        'NEAR-USD', 'TRX-USD', 'INJ-USD', 'XRP-USD', 'SEI-USD',
        // L2 & BTC layer
        'OP-USD', 'ALGO-USD', 'STRK-USD', 'STX-USD', 'WBTC-USD',
        // DeFi
        'AAVE-USD', 'LDO-USD', 'MKR-USD', 'CRV-USD', 'RUNE-USD', 'SNX-USD', 'JTO-USD', 'EIGEN-USD',
        // AI
        'FET-USD', 'RENDER-USD', 'OCEAN-USD', 'WLD-USD',
        // Memes
        'DOGE-USD', 'BONK-USD', 'WIF-USD', 'FLOKI-USD',
        // Other
        'PYTH-USD'
    ];

    const tickerDropdownHTML = `
        <select id="gomm-ticker-select" onchange="window._gommSetTicker(this.value)" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:6px 12px;border-radius:6px;font-size:0.75rem;font-weight:900;margin-left:auto;cursor:pointer;max-width:140px;">
            ${cryptoUniverse.map(t => `<option value="${t}" ${window.gommTicker === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
    `;

    const tabBarHTML = `
        <div class="hub-tabs" style="display:flex;gap:10px;margin-bottom:1.5rem;border-bottom:1px solid var(--border);padding-bottom:10px;overflow-x:auto;align-items:center">
            ${gommTabs.map(t => `
                <button id="gomm-tab-${t.id}"
                        class="intel-action-btn mini ${activeMode === t.id ? '' : 'outline'}"
                        onclick="window._gommSwitch('${t.id}')"
                        style="white-space:nowrap;padding:6px 12px;font-size:0.65rem">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">${t.icon}</span>${t.label}
                </button>
            `).join('')}
            ${tickerDropdownHTML}
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
                            <div id="gomm-depth" style="font-size:1.1rem;font-weight:900;color:var(--text)">--</div>
                        </div>
                    </div>
                </div>
                <div class="glass-card" style="padding:1rem;border:1px solid rgba(0,242,255,0.2)">
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:0.75rem">- WHALE WATCH</div>
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
        fetchAPI(`/liquidity?ticker=${window.gommTicker}`),
        fetchAPI(`/tape?ticker=${window.gommTicker}`),
        fetchAPI(`/whales_entity?ticker=${window.gommTicker}`),
        fetchAPI(`/liquidations?ticker=${window.gommTicker}`),
        fetch(`/api/volatility-surface?ticker=${window.gommTicker}`).then(r => r.ok ? r.json() : null).catch(() => null)
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
        sectionTitle.textContent = 'Depth Walls - Institutional Order Clusters';
        if (!data || !data.walls || data.walls.length === 0) {
            display.innerHTML = `<div class="empty-state">Order book data unavailable</div>`;
            return;
        }

        const walls = data.walls;
        function aggWalls(arr) {
            const m = new Map();
            arr.forEach(w => { const p = Math.round(w.price); m.set(p, (m.get(p)||0) + w.size); });
            return Array.from(m, ([price, size]) => ({price, size})).filter(w => w.size >= 0.01);
        }
        let bids = aggWalls(walls.filter(w => String(w.side).toLowerCase() === 'bid')).sort((a,b) => b.price - a.price);
        let asks = aggWalls(walls.filter(w => String(w.side).toLowerCase() === 'ask')).sort((a,b) => a.price - b.price);

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

        // Cumulative depth: bids sorted high-low (closest to price first), asks low-high
        const bidLevels = [], askLevels = [];
        let cumB = 0, cumA = 0;
        topBids.forEach(b => { cumB += b.size; bidLevels.push({ price: b.price, cum: cumB }); });
        topAsks.forEach(a => { cumA += a.size; askLevels.push({ price: a.price, cum: cumA }); });

        // X-axis: bids displayed low-high (left of mid), then asks low-high (right of mid)
        // With linear axis, we just provide [{x, y}] coordinates directly.
        const midPrice = asks.length > 0 ? asks[0].price : (currentPrice || bids[0]?.price * 1.001 || 84000);
        const bidData = [...bidLevels].filter(b => b.price <= midPrice).reverse().map(b => ({ x: b.price, y: b.cum })); 
        // Ensure bids touch zero exactly at the current mid price (or closest Ask)
        bidData.push({ x: midPrice, y: 0 });
        bidData.sort((a, b) => a.x - b.x);

        const askData = [];
        askData.push({ x: midPrice, y: 0 }); // Anchor asks to zero at mid price
        askLevels.filter(a => a.price >= midPrice).forEach(a => askData.push({ x: a.price, y: a.cum }));
        askData.sort((a, b) => a.x - b.x);

        // Y-axis max = same for both sides so curves are visually balanced
        const maxDepth = Math.max(cumB, cumA);
        const baseCur = window.gommTicker.split('-')[0] || 'BTC';

        display.innerHTML = `
            <div class="card">
                <div style="height:380px"><canvas id="gommWallChart" role="img" aria-label="Order wall chart"></canvas></div>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.75rem 0;font-size:0.6rem">
                    <span style="color:var(--text-dim);letter-spacing:1px;margin-right:0.5rem">TOP BIDS:</span>
                    ${topBids.slice(0,4).map(w => `<span style="color:var(--risk-low);background:rgba(34,197,94,0.1);padding:2px 6px;border-radius:4px">$${w.price.toFixed(0)} <b>${w.size.toFixed(2)}</b> ${baseCur}</span>`).join('')}
                    <span style="color:var(--text-dim);letter-spacing:1px;margin:0 0.5rem">TOP ASKS:</span>
                    ${topAsks.slice(0,4).map(w => `<span style="color:var(--risk-high);background:rgba(239,68,68,0.1);padding:2px 6px;border-radius:4px">$${w.price.toFixed(0)} <b>${w.size.toFixed(2)}</b> ${baseCur}</span>`).join('')}
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
                data: {
                    datasets: [
                        { label: `Bid Depth (${baseCur})`,  data: bidData, borderColor: 'rgba(34,197,94,1)',  backgroundColor: 'rgba(34,197,94,0.2)', fill: true, tension: 0.2, borderWidth: 2.5, pointRadius: 0, yAxisID: 'y'  },
                        { label: `Ask Depth (${baseCur})`,  data: askData, borderColor: 'rgba(239,68,68,1)',  backgroundColor: 'rgba(239,68,68,0.2)', fill: true, tension: 0.2, borderWidth: 2.5, pointRadius: 0, yAxisID: 'y1' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    animation: { duration: 400 },
                    plugins: {
                        legend: { labels: { color: '#aaa', font: { size: 11 }, boxWidth: 14 } },
                        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y != null ? c.parsed.y.toFixed(4) : '-'} ${baseCur}` } }
                    },
                    scales: {
                        x:  { type: 'linear', grid: { color: alphaColor(0.04) }, ticks: { color: '#888', maxTicksLimit: 12, callback: v => '$'+v.toLocaleString() } },
                        y:  { position: 'left',  grid: { color: 'rgba(34,197,94,0.08)' },  ticks: { color: 'rgba(34,197,94,0.8)' }, title: { display: true, text: `- Bid Depth (${baseCur})`, color: 'rgba(34,197,94,0.7)' }, min: 0 },
                        y1: { position: 'right', grid: { drawOnChartArea: false },           ticks: { color: 'rgba(239,68,68,0.8)' }, title: { display: true, text: `Ask Depth (${baseCur}) -`, color: 'rgba(239,68,68,0.7)' }, min: 0 }
                    }
                }
            });

            // - Live update: poll every 5s, mutate chart data in-place -
            if (window._gommLiveInterval) clearInterval(window._gommLiveInterval);
            window._gommLiveInterval = setInterval(async () => {
                if (!document.getElementById('gommWallChart') || !window._gommWallChartInst) {
                    clearInterval(window._gommLiveInterval); return;
                }
                try {
                    const fresh = await fetchAPI(`/liquidity?ticker=${window.gommTicker}`);
                    if (!fresh || !fresh.walls) return;

                    let fb = aggWalls(fresh.walls.filter(w => String(w.side).toLowerCase() === 'bid')).sort((a,b) => b.price - a.price);
                    let fa = aggWalls(fresh.walls.filter(w => String(w.side).toLowerCase() === 'ask')).sort((a,b) => a.price - b.price);
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
                    const midP = fa.length > 0 ? fa[0].price : (fresh.current_price || fb[0]?.price * 1.001 || 84000);
                    const bData = [...bLvl].filter(b => b.price <= midP).reverse().map(b => ({x: b.price, y: b.cum}));
                    bData.push({x: midP, y: 0});
                    bData.sort((a,b) => a.x - b.x);
                    
                    const aData = [{x: midP, y: 0}, ...aLvl.filter(a => a.price >= midP).map(a => ({x: a.price, y: a.cum}))];
                    aData.sort((a,b) => a.x - b.x);

                    const chart = window._gommWallChartInst;
                    chart.data.datasets[0].data = bData;
                    chart.data.datasets[1].data = aData;
                    chart.update('active');

                    // Refresh sidebar stats
                    const iEl = document.getElementById('gomm-imbalance');
                    const dEl = document.getElementById('gomm-depth');
                    if (iEl && fresh.imbalance) { iEl.textContent = fresh.imbalance; iEl.style.color = parseFloat(fresh.imbalance) > 0 ? 'var(--risk-low)' : 'var(--risk-high)'; }
                    if (dEl && fresh.total_depth) dEl.textContent = fresh.total_depth;
                } catch(e) { /* silent - skip noisy poll failures */ }
            }, 1000);

            if (typeof injectAIChartTranslator === 'function') {
                injectAIChartTranslator(display.querySelector('.card'), 'depth', () => {
                    return {
                        top_bids: topBids.slice(0, 3).map(b => ({ price: b.price, size: b.size })),
                        top_asks: topAsks.slice(0, 3).map(a => ({ price: a.price, size: a.size })),
                        imbalance: document.getElementById('gomm-imbalance')?.textContent || '0%',
                        total_depth: document.getElementById('gomm-depth')?.textContent || '0'
                    };
                });
            }

        }, 50);
    }

    function renderHeatmapMode() {
        sectionTitle.textContent = 'Price History - 5-Minute Candle Overview (48h)';
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
                    <span style="color:var(--text-dim);margin-left:auto">${history.length} candles - 5m interval</span>
                </div>
                <div style="height:360px"><canvas id="gommHeatChart" role="img" aria-label="Order flow heatmap chart"></canvas></div>
                <div style="display:flex;gap:1rem;margin-top:0.5rem;font-size:0.6rem">
                    <span style="color:rgba(34,197,94,0.9)">- Bullish candle</span>
                    <span style="color:rgba(239,68,68,0.9)">- Bearish candle</span>
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
                        x:  { grid: { color: alphaColor(0.04) }, ticks: { color: '#888', maxTicksLimit: 12, font: { size: 9 } }, title: { display: true, text: 'Time (5-min candles)', color: '#555', font: { size: 9 } } },
                        y:  { position: 'left',  grid: { color: 'rgba(0,242,255,0.05)' }, ticks: { color: 'rgba(0,242,255,0.7)', callback: v => '$'+(v/1000).toFixed(0)+'K' }, title: { display: true, text: 'Price (USD)', color: 'rgba(0,242,255,0.5)', font: { size: 9 } } },
                        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#666', font: { size: 9 } }, title: { display: true, text: 'Candle Body ($)', color: '#555', font: { size: 9 } } }
                    }
                }
            });
        }, 100);
    }

    function renderLiquidationMode() {
        sectionTitle.textContent = 'Liquidation Flux - Derivatives Topography (Liq vs OI)';
        if (!liqData || !liqData.clusters) {
            display.innerHTML = `<div class="empty-state">Liquidation data unavailable</div>`;
            return;
        }
        const sorted = [...liqData.clusters].sort((a, b) => a.price - b.price);
        display.innerHTML = `<div class="card">
            <div style="height:420px"><canvas id="gommLiqChart" role="img" aria-label="Liquidity flux chart"></canvas></div>
            <div style="margin-top:1.5rem; border-top:1px solid var(--border); padding-top:1.5rem; display:flex; flex-direction:column; align-items:center;">
                <button id="ai-translate-liq-btn" class="setup-generator-btn" style="font-size:0.95rem; padding:12px 40px; font-weight:700; letter-spacing:0.5px;">
                    <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:8px">auto_awesome</span> In Plain English
                </button>
                <div id="ai-translate-liq-box" style="display:none; width:100%; margin-top:1rem; padding:1rem; background:rgba(0,242,255,0.05); border:1px solid rgba(0,242,255,0.2); border-radius:8px; font-size:1.15rem; color:var(--text); line-height:1.6; box-sizing:border-box;"></div>
            </div>
        </div>`;
        setTimeout(() => {
            const ctx = document.getElementById('gommLiqChart')?.getContext('2d');
            if (ctx) {
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
                            x: { grid: { color: alphaColor(0.05) }, ticks: { color: '#aaa' }, title: { display: true, text: 'Price Level ($)', color: '#666', font: { size: 9 } } },
                            y:  { type: 'linear', position: 'left',  grid: { color: alphaColor(0.05) }, ticks: { color: '#aaa' }, title: { display: true, text: 'Liquidation Volume', color: '#888', font: { size: 9 } } },
                            y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#aaa' }, title: { display: true, text: 'Est. OI', color: '#7dd3fc', font: { size: 9 } } }
                        }
                    }
                });
            }

            const btn = document.getElementById('ai-translate-liq-btn');
            if (btn) {
                btn.addEventListener('click', async (e) => {
                    const box = document.getElementById('ai-translate-liq-box');
                    btn.disabled = true;
                    btn.innerHTML = `<span class="material-symbols-outlined spin" style="font-size:14px;vertical-align:middle;margin-right:8px">sync</span> Analyzing liquidations...`;
                    box.style.display = 'block';
                    box.innerHTML = `<div class="skeleton-card" style="height:60px"></div>`;
                    try {
                        const resp = await fetchAPI('/explain-chart', 'POST', {
                            chart_type: 'pulse',
                            symbol: document.getElementById('liq-search-input')?.value || 'BTC-USD',
                            data: sorted.map(c => ({ price: c.price, side: c.side, intensity: c.intensity }))
                        });
                        if (resp && resp.explanation) {
                            box.innerHTML = `<div style="font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:8px">- AI TACTICAL OVERVIEW</div><div style="color:var(--text-main)">${resp.explanation.replace(/\n\n/g, '<br><br>')}</div>`;
                        } else {
                            throw new Error('Empty response');
                        }
                    } catch (err) {
                        box.innerHTML = `<span style="color:var(--risk-high)">AI Engine offline. Configure your API key.</span>`;
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:8px">auto_awesome</span> In Plain English`;
                    }
                });
            }
        }, 50);
    }

    function renderVolatilityMode() {
        sectionTitle.textContent = 'Volatility Surface - Options IV Smile & Skew';
        if (!volData) { display.innerHTML = `<div class="empty-state">Options volatility data unavailable</div>`; return; }

        // Map backend fields - chart fields
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

        // 25- skew: (OTM put IV - OTM call IV) per expiry
        // Put side - moneyness 0.75, Call side - moneyness 1.25
        let skew = volData.skew || null;
        if (!skew && grid.length && money.length) {
            const putIdx  = money.reduce((b, m, i) => Math.abs(m - 0.75) < Math.abs(money[b] - 0.75) ? i : b, 0);
            const callIdx = money.reduce((b, m, i) => Math.abs(m - 1.25) < Math.abs(money[b] - 1.25) ? i : b, 0);
            skew = (grid[putIdx] || []).map((iv, i) => parseFloat((iv - (grid[callIdx]?.[i] || iv)).toFixed(2)));
        }

        display.innerHTML = `
            <div class="card">
                <div style="height:420px"><canvas id="gommVolChart" role="img" aria-label="Volatility surface chart"></canvas></div>
                <div style="margin-top:1rem; border-top:1px solid var(--border); padding-top:1rem; display:flex; flex-direction:column; align-items:center;">
                    <button id="ai-translate-btn" class="setup-generator-btn" style="font-size:1.15rem; padding:12px 40px; font-weight:700; letter-spacing:0.5px;">
                        <span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:8px">auto_awesome</span> In Plain English
                    </button>
                    <div id="ai-translate-box" style="display:none; width:100%; margin-top:1rem; padding:1rem; background:rgba(0,242,255,0.05); border:1px solid rgba(0,242,255,0.2); border-radius:8px; font-size:1.15rem; color:var(--text); line-height:1.6; box-sizing:border-box;"></div>
                </div>
            </div>`;
        setTimeout(() => {
            document.getElementById('ai-translate-btn')?.addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                const box = document.getElementById('ai-translate-box');
                btn.disabled = true;
                btn.innerHTML = `<span class="material-symbols-outlined spin" style="font-size:14px;vertical-align:middle;margin-right:8px">sync</span> Translating matrix...`;
                box.style.display = 'block';
                box.innerHTML = `<div class="skeleton-card" style="height:60px"></div>`;
                try {
                    const resp = await fetchAPI('/explain-chart', 'POST', {
                        chart_type: 'options',
                        data: { atm_iv: atmRow, skew: skew, expiries: labels }
                    });
                    if (resp && resp.explanation) {
                        box.innerHTML = `<div style="font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:8px">- AI SURFACE TRANSLATION</div><div style="color:var(--text-main)">${resp.explanation.replace(/\n\n/g, '<br><br>')}</div>`;
                    } else {
                        throw new Error('Empty response');
                    }
                } catch (err) {
                    box.innerHTML = `<span style="color:var(--risk-high)">AI Engine offline. Configure your API key.</span>`;
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:8px">auto_awesome</span> In Plain English`;
                }
            });

            const ctx = document.getElementById('gommVolChart')?.getContext('2d');
            if (!ctx) return;
            new Chart(ctx, {
                type: 'line',
                data: { labels,
                    datasets: [
                        { label: 'ATM IV (%)', data: atmRow, borderColor: '#f7931a', backgroundColor: 'rgba(247,147,26,0.1)', borderWidth: 3, tension: 0.3, fill: true },
                        { label: '25- Skew',   data: skew,   borderColor: '#ff0055', borderDash: [5,5], borderWidth: 2, tension: 0.3, yAxisID: 'y1' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { grid: { color: alphaColor(0.05) }, ticks: { color: '#aaa' }, title: { display: true, text: 'Expiry', color: '#666', font: { size: 9 } } },
                        y:  { type: 'linear', position: 'left',  grid: { color: alphaColor(0.05) }, ticks: { color: '#aaa' }, title: { display: true, text: 'Implied Volatility (%)', color: '#f7931a', font: { size: 9 } } },
                        y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#aaa' }, title: { display: true, text: '25- Skew (%)', color: '#ff0055', font: { size: 9 } } }
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

    // - Live Whale Watch Poller -
    const WHALE_POLL = 15000; // 15s - hourly backend seed, but last_tx + HFW addr change

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
                ? `<a href="https://blockstream.info/tx/${e.tx_hash}" target="_blank" rel="noopener" style="font-size:0.55rem;color:var(--accent);text-decoration:none;opacity:0.7;margin-left:4px" title="View on Blockstream">-</a>`
                : '';
            const baseCur = window.gommTicker.split('-')[0] || 'BTC';
            const valueLine = e.value_usd
                ? `<div style="margin-top:3px;display:flex;gap:6px;align-items:center">
                     <span style="font-size:0.65rem;font-weight:800;color:var(--text-main)">${e.value_usd}</span>
                     <span style="font-size:0.5rem;color:var(--text-dim)">${e.value_btc} ${baseCur}</span>
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
            const fresh = await fetchAPI(`/whales_entity?ticker=${window.gommTicker}`);
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


    // - Live Tape Poller -
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

    // Live polling loop - stops when tape-content is removed from DOM
    const tapeTimer = setInterval(async () => {
        const el = document.getElementById('tape-content');
        if (!el) { clearInterval(tapeTimer); return; }
        try {
            const fresh = await fetchAPI(`/tape?ticker=${window.gommTicker}`);
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
        } catch(e) { /* silent - keep polling */ }
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

        <!-- State filter tabs: ACTIVE / ALL / CLOSED -->
        <div id="archive-state-tabs" style="display:flex;gap:6px;margin-bottom:1rem;align-items:center">
            <span style="font-size:0.5rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-right:4px">VIEW:</span>
            <button id="atab-active" onclick="window._setArchiveState('active')" style="font-size:0.6rem;font-weight:900;padding:5px 14px;border-radius:20px;border:1px solid rgba(74,222,128,0.5);background:rgba(74,222,128,0.12);color:#4ade80;cursor:pointer;letter-spacing:1px;transition:all 0.15s">
                - ACTIVE
            </button>
            <button id="atab-all" onclick="window._setArchiveState('all')" style="font-size:0.6rem;font-weight:900;padding:5px 14px;border-radius:20px;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.03)};color:var(--text-dim);cursor:pointer;letter-spacing:1px;transition:all 0.15s">
                ALL
            </button>
            <button id="atab-closed" onclick="window._setArchiveState('closed')" style="font-size:0.6rem;font-weight:900;padding:5px 14px;border-radius:20px;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.03)};color:var(--text-dim);cursor:pointer;letter-spacing:1px;transition:all 0.15s">
                CLOSED
            </button>
        </div>

        <div id="archive-filters" class="glass-card" style="margin-bottom:1.5rem;padding:1.2rem;display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
            <!-- Ticker search -->
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">TICKER</label>
                <input type="text" id="filter-ticker" name="signal-ticker-search" placeholder="BTC-USD, ETH-" maxlength="20"
                    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                    readonly onfocus="this.removeAttribute('readonly')" onblur="this.setAttribute('readonly','')"
                    style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.75rem;width:130px;font-family:var(--font-mono)"
                    onkeydown="if(event.key==='Enter') loadData(1)">
            </div>
            <!-- Signal type -->
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">SIGNAL TYPE</label>
                <select id="filter-type" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.73rem">
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
                <select id="filter-severity" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.73rem">
                    <option value="">ALL</option>
                    <option value="critical">CRITICAL -</option>
                    <option value="high">HIGH -</option>
                    <option value="medium">MEDIUM -</option>
                </select>
            </div>
            <!-- Direction -->
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">DIRECTION</label>
                <select id="filter-direction" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:7px 11px;border-radius:6px;font-size:0.73rem">
                    <option value="">ALL</option>
                    <option value="bullish">BULLISH -</option>
                    <option value="bearish">BEARISH -</option>
                    <option value="neutral">NEUTRAL -</option>
                </select>
            </div>
            <!-- Date Range Picker -->
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:240px">
                <label style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);display:flex;align-items:center;gap:6px">
                    DATE RANGE
                    <span id="active-range-label" style="font-size:0.5rem;padding:1px 7px;border-radius:10px;background:rgba(0,242,255,0.1);color:var(--accent);font-weight:700">30D</span>
                </label>
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                    <button id="drp-today" class="drp-pill" onclick="window._drpSelect('today',0)" style="font-size:0.58rem;font-weight:700;padding:4px 9px;border-radius:20px;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.03)};color:var(--text-dim);cursor:pointer;transition:all 0.15s;white-space:nowrap">TODAY</button>
                    <button id="drp-7d"    class="drp-pill" onclick="window._drpSelect('7d',7)"   style="font-size:0.58rem;font-weight:700;padding:4px 9px;border-radius:20px;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.03)};color:var(--text-dim);cursor:pointer;transition:all 0.15s;white-space:nowrap">7D</button>
                    <button id="drp-30d"  class="drp-pill drp-active" onclick="window._drpSelect('30d',30)" style="font-size:0.58rem;font-weight:700;padding:4px 9px;border-radius:20px;border:1px solid rgba(0,242,255,0.5);background:rgba(0,242,255,0.12);color:var(--accent);cursor:pointer;transition:all 0.15s;white-space:nowrap">30D</button>
                    <button id="drp-90d"  class="drp-pill" onclick="window._drpSelect('90d',90)"  style="font-size:0.58rem;font-weight:700;padding:4px 9px;border-radius:20px;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.03)};color:var(--text-dim);cursor:pointer;transition:all 0.15s;white-space:nowrap">90D</button>
                    <button id="drp-365d" class="drp-pill" onclick="window._drpSelect('365d',365)" style="font-size:0.58rem;font-weight:700;padding:4px 9px;border-radius:20px;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.03)};color:var(--text-dim);cursor:pointer;transition:all 0.15s;white-space:nowrap">1Y</button>
                    <button id="drp-all"  class="drp-pill" onclick="window._drpSelect('all',-1)"  style="font-size:0.58rem;font-weight:700;padding:4px 9px;border-radius:20px;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.03)};color:var(--text-dim);cursor:pointer;transition:all 0.15s;white-space:nowrap">ALL TIME</button>
                    <button id="drp-custom" class="drp-pill" onclick="window._drpSelect('custom',null)" style="font-size:0.58rem;font-weight:700;padding:4px 9px;border-radius:20px;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.03)};color:var(--text-dim);cursor:pointer;transition:all 0.15s;white-space:nowrap">CUSTOM&#8230;</button>
                </div>
                <div id="drp-custom-inputs" style="display:none;gap:6px;align-items:flex-end;margin-top:4px;flex-wrap:wrap">
                    <div style="display:flex;flex-direction:column;gap:2px">
                        <label style="font-size:0.5rem;color:var(--text-dim);font-weight:700">FROM</label>
                        <input type="date" id="drp-from" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:6px;font-size:0.7rem;font-family:var(--font-mono);color-scheme: ${document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'}">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:2px">
                        <label style="font-size:0.5rem;color:var(--text-dim);font-weight:700">TO</label>
                        <input type="date" id="drp-to" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:6px;font-size:0.7rem;font-family:var(--font-mono);color-scheme: ${document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'}">
                    </div>
                    <button onclick="loadData(1)" style="background:rgba(0,242,255,0.1);border:1px solid rgba(0,242,255,0.3);color:var(--accent);padding:5px 12px;border-radius:6px;font-size:0.65rem;font-weight:700;cursor:pointer">APPLY RANGE</button>
                </div>
            </div>
            <!-- Action buttons -->
            <div style="display:flex;gap:8px;align-items:flex-end">
                <button id="apply-filters" class="setup-generator-btn" style="padding:7px 18px;font-size:0.7rem;height:36px">
                    <span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle;margin-right:4px">filter_list</span>APPLY
                </button>
                <button onclick="window._drpSelect('30d',30);document.getElementById('filter-ticker').value='';document.getElementById('filter-type').value='';document.getElementById('filter-severity').value='';document.getElementById('filter-direction').value='';loadData(1)"
                    class="intel-action-btn mini outline" style="width:auto;padding:7px 14px;font-size:0.7rem;height:36px">RESET</button>
            </div>
        </div>

        <div id="archive-table-container">
            <div class="card" style="padding:1rem">${skeleton(5)}</div>
        </div>
    `;

    let currentPage = 1;

    // - State tab filter (active / all / closed) -
    let stateFilter = 'active'; // default to showing active signals only

    window._setArchiveState = function(state) {
        stateFilter = state;
        // Restyle tabs
        const styles = {
            active: { border:'rgba(74,222,128,0.5)',  bg:'rgba(74,222,128,0.12)',  color:'#4ade80' },
            all:    { border:'rgba(0,242,255,0.5)',   bg:'rgba(0,242,255,0.12)',   color:'var(--accent)' },
            closed: { border:'rgba(148,163,184,0.4)', bg:'rgba(148,163,184,0.08)', color:'#94a3b8' },
        };
        ['active','all','closed'].forEach(s => {
            const btn = document.getElementById('atab-' + s);
            if (!btn) return;
            const isActive = s === state;
            btn.style.border    = '1px solid ' + (isActive ? styles[s].border : alphaColor(0.1));
            btn.style.background = isActive ? styles[s].bg : alphaColor(0.03);
            btn.style.color     = isActive ? styles[s].color : 'var(--text-dim)';
        });
        loadData(1);
    };

    // - Sort state lives OUTSIDE loadData so it persists across page navigation -
    let sortCol = null;
    let sortDir = 'desc';
    // Server-side columns trigger a re-fetch sorted across the full dataset.
    // Computed columns (return/current/state) are derived from live prices - sort client-side only.
    const SERVER_SORT_COLS = new Set(['ticker','type','severity','entry','date','direction']);
    const CLIENT_SORT_COLS = new Set(['return','current','state']);

    // - Date Range Picker state -
    let drpMode = '30d';   // active pill id
    let drpDays = 30;      // days value (-1 = all time, 0 = today)

    window._drpSelect = function(id, days) {
        drpMode = id;
        drpDays = days;
        // Restyle all pills
        document.querySelectorAll('.drp-pill').forEach(b => {
            const active = b.id === 'drp-' + id;
            b.style.background = active ? 'rgba(0,242,255,0.12)' : alphaColor(0.03);
            b.style.color = active ? 'var(--accent)' : 'var(--text-dim)';
            b.style.borderColor = active ? 'rgba(0,242,255,0.5)' : alphaColor(0.1);
        });
        // Show/hide custom date inputs
        const ci = document.getElementById('drp-custom-inputs');
        if (ci) ci.style.display = id === 'custom' ? 'flex' : 'none';
        // Update badge label
        const lbl = document.getElementById('active-range-label');
        const LABELS = { today:'TODAY', '7d':'7D', '30d':'30D', '90d':'90D', '365d':'1Y', all:'ALL', custom:'CUSTOM' };
        if (lbl) lbl.textContent = LABELS[id] || id.toUpperCase();
        // Auto-load for all presets (not CUSTOM - user must pick dates then press APPLY)
        if (id !== 'custom') loadData(1);
    };

    const loadData = async (page = 1) => {
        currentPage = page;
        const ticker    = document.getElementById('filter-ticker')?.value.trim() || '';
        const type      = document.getElementById('filter-type')?.value || '';
        const severity  = document.getElementById('filter-severity')?.value || '';
        const direction = document.getElementById('filter-direction')?.value || '';

        const container = document.getElementById('archive-table-container');
        container.innerHTML = `<div class="card" style="padding:1rem">${skeleton(5)}</div>`;

        // Build URL based on date range mode
        let url;
        if (drpMode === 'custom') {
            const from = document.getElementById('drp-from')?.value || '';
            const to   = document.getElementById('drp-to')?.value   || '';
            url = `/signal-history?page=${currentPage}&limit=25`;
            if (from) url += `&from=${from}`;
            if (to)   url += `&to=${to}`;
        } else if (drpMode === 'today') {
            const d = new Date().toISOString().split('T')[0];
            url = `/signal-history?from=${d}&to=${d}&page=${currentPage}&limit=25`;
        } else if (drpDays === -1) {
            url = `/signal-history?days=3650&page=${currentPage}&limit=25`; // ALL TIME = 10y lookback
        } else {
            url = `/signal-history?days=${drpDays}&page=${currentPage}&limit=25`;
        }
        if (ticker)    url += `&ticker=${ticker.toUpperCase()}`;
        if (type)      url += `&type=${type}`;
        if (severity)  url += `&severity=${severity}`;
        if (direction) url += `&direction=${direction}`;
        if (stateFilter && stateFilter !== 'all') url += `&state=${stateFilter}`;
        // Append server-side sort params so the DB returns the full dataset sorted
        if (sortCol && SERVER_SORT_COLS.has(sortCol)) {
            url += `&sort_col=${sortCol}&sort_dir=${sortDir}`;
        }

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

        // Cache for CSV export & sort
        window._archiveCurrentData = data;

        const stateColors = {
            'HIT_TP2': '#22c55e', 'HIT_TP1': '#86efac',
            'ACTIVE': '#60a5fa', 'STOPPED': '#ef4444', 'CLOSED': '#94a3b8'
        };
        const stateIcons = { 'HIT_TP2': '-', 'HIT_TP1': '-', 'ACTIVE': '-', 'STOPPED': '-', 'CLOSED': '-' };
        const BULLISH_TYPES = new Set(['ML_LONG','RSI_OVERSOLD','MACD_BULLISH_CROSS','REGIME_BULL','WHALE_ACCUMULATION','VOLUME_SPIKE','MOMENTUM_BREAKOUT','ALPHA_DIVERGENCE_LONG','ML_ALPHA_PREDICTION']);
        const BEARISH_TYPES = new Set(['ML_SHORT','RSI_OVERBOUGHT','MACD_BEARISH_CROSS','REGIME_BEAR','ALPHA_DIVERGENCE_SHORT']);
        const SEV_RANK = { critical: 3, high: 2, medium: 1, low: 0 };

        function getColValue(s, col) {
            switch(col) {
                case 'ticker':    return (s.ticker || '').toUpperCase();
                case 'type':      return (s.type || '').toUpperCase();
                case 'severity':  return SEV_RANK[(s.severity||'').toLowerCase()] ?? 0;
                case 'entry':     return parseFloat(s.entry) || 0;
                case 'current':   return parseFloat(s.current) || 0;
                case 'return':    return parseFloat(s.return) || 0;
                case 'state':     return (s.state || '').toUpperCase();
                case 'date':      return s.timestamp || '';
                case 'direction': {
                    const t = (s.type||'').toUpperCase();
                    return BULLISH_TYPES.has(t) ? 0 : BEARISH_TYPES.has(t) ? 1 : 2;
                }
                default: return '';
            }
        }

        function sortedData(d) {
            if (!sortCol || SERVER_SORT_COLS.has(sortCol)) return d;
            return [...d].sort((a, b) => {
                const av = getColValue(a, sortCol);
                const bv = getColValue(b, sortCol);
                const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }

        // - Render just the <tbody> rows -
        // Signal store: populated each render so drawer can look up by id
        window._archiveSignals = window._archiveSignals || {};

        function renderRows(d) {
            sortedData(d).forEach(s => { window._archiveSignals[String(s.id)] = s; });
            return sortedData(d).map(s => {
                const sigType  = (s.type || '').toUpperCase();
                const isBull   = BULLISH_TYPES.has(sigType);
                const isBear   = BEARISH_TYPES.has(sigType);
                const dirLabel = isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL';
                const dirArrow = isBull ? '-' : isBear ? '-' : '-';
                const dirColor = isBull ? '#22c55e' : isBear ? '#ef4444' : '#94a3b8';
                const dirBg    = isBull ? 'rgba(34,197,94,0.1)' : isBear ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)';
                const dirBorder= isBull ? 'rgba(34,197,94,0.3)' : isBear ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.3)';
                const sev = (s.severity||'').toLowerCase();

                // --- ACTION: plain-language BUY / SELL ---
                const actionLabel = isBear ? '🔴 SELL' : isBull ? '🟢 BUY' : '⚪ WATCH';
                const actionColor = isBear ? '#ef4444' : isBull ? '#22c55e' : '#94a3b8';
                const actionBg    = isBear ? 'rgba(239,68,68,0.12)' : isBull ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.08)';

                // --- TP / SL levels derived from entry price (10% TP, 3% SL) ---
                const TP_PCT = 10, SL_PCT = 3;
                const entryPx = parseFloat(s.entry) || 0;
                let tpPrice = null, slPrice = null;
                if (entryPx > 0) {
                    if (isBear) {
                        tpPrice = entryPx * (1 - TP_PCT / 100);
                        slPrice = entryPx * (1 + SL_PCT / 100);
                    } else {
                        tpPrice = entryPx * (1 + TP_PCT / 100);
                        slPrice = entryPx * (1 - SL_PCT / 100);
                    }
                }
                const tpStr = tpPrice ? formatPrice(tpPrice) : '--';
                const slStr = slPrice ? formatPrice(slPrice) : '--';

                return `
                <tr class="archive-row" onclick="window._openSignalDrawer('${s.id}')" style="cursor:pointer;border-bottom:1px solid ${alphaColor(0.04)};transition:background 0.2s" onmouseover="this.style.background=alphaColor(0.03)" onmouseout="this.style.background=''">
                    <td data-label="TICKER" style="padding:10px 12px;font-weight:700;color:var(--accent)">${s.ticker}</td>
                    <td data-label="TYPE" style="padding:10px 12px;color:var(--text-dim);font-size:0.7rem">${(s.type||'-').replace(/_/g,' ')}</td>
                    <td data-label="ACTION" style="padding:10px 12px;text-align:center">
                        <span style="background:${actionBg};border:1px solid ${actionColor}40;color:${actionColor};padding:3px 8px;border-radius:5px;font-size:0.6rem;font-weight:800;letter-spacing:0.5px;white-space:nowrap">${actionLabel}</span>
                        ${entryPx > 0 ? `<div style="margin-top:3px;font-size:0.55rem;font-family:monospace;white-space:nowrap">
                            <span style="color:#22c55e" title="Take Profit">TP ${tpStr}</span>
                            <span style="color:#64748b;margin:0 2px">·</span>
                            <span style="color:#ef4444" title="Stop Loss">SL ${slStr}</span>
                        </div>` : ''}
                    </td>
                    <td data-label="SEV" class="col-sev" style="padding:10px 12px;text-align:center"><span style="font-size:0.65rem">${(sev||'--').toUpperCase()}</span></td>
                    <td data-label="ENTRY" style="padding:10px 12px;text-align:right;font-family:monospace">${s.entry ? formatPrice(s.entry) : '-'}</td>
                    <td data-label="CURRENT" style="padding:10px 12px;text-align:right;font-family:monospace">${
                        s.state === 'CLOSED' && s.exit_price
                            ? `<span title="Exit price locked at close" style="color:#94a3b8">🔒 ${formatPrice(s.exit_price)}</span>`
                            : (s.current ? formatPrice(s.current) : '-')
                    }</td>
                    <td data-label="RETURN" style="padding:10px 12px;text-align:right;font-weight:700;color:${
                        (s.state === 'CLOSED' ? (s.final_roi ?? s.return) : s.return) >= 0 ? '#22c55e' : '#ef4444'
                    }">${
                        s.state === 'CLOSED' && s.final_roi != null
                            ? `${s.final_roi >= 0 ? '+' : ''}${s.final_roi}%`
                            : `${s.return >= 0 ? '+' : ''}${s.return}%`
                    }</td>
                    <td data-label="STATE" style="padding:10px 12px;text-align:center">
                        <span style="background:${stateColors[s.state]||'#60a5fa'}22;color:${stateColors[s.state]||'#60a5fa'};padding:2px 10px;border-radius:20px;font-size:0.6rem;letter-spacing:1px">
                            ${stateIcons[s.state]||'-'} ${s.state}
                        </span>
                    </td>
                    <td data-label="DATE" class="col-date" style="padding:10px 12px;color:var(--text-dim);font-size:0.7rem">${
                        (() => {
                            if (!s.timestamp) return '-';
                            // Handle both ISO 'T' separator and space separator
                            const sep = s.timestamp.includes('T') ? 'T' : ' ';
                            const [datePart, timePart] = s.timestamp.split(sep);
                            const hhmm = timePart ? timePart.substring(0, 5) : '';
                            const age = s.age_days != null
                                ? (s.age_days === 0 ? 'today' : s.age_days === 1 ? '1d ago' : s.age_days + 'd ago')
                                : '';
                            return `${datePart}${hhmm ? `<br><span style="font-size:0.65rem;color:#7dd3fc;font-family:var(--font-mono);font-weight:700">${hhmm} UTC</span>` : ''}<br><span style="font-size:0.55rem;color:var(--text-dim);opacity:0.6">${age}</span>`;
                        })()
                    }</td>
                    <td data-label="DIR" class="col-dir" style="padding:10px 12px;text-align:center">
                        <span style="background:${dirBg};border:1px solid ${dirBorder};color:${dirColor};padding:3px 9px;border-radius:20px;font-size:0.6rem;font-weight:700;letter-spacing:0.5px;white-space:nowrap">
                            ${dirArrow} ${dirLabel}
                        </span>
                    </td>
                    <td data-label="ACTIONS" style="padding:8px 12px;text-align:center;white-space:nowrap" onclick="event.stopPropagation()">
                        <button onclick="openDetail('${s.ticker}','CRYPTO');event.stopPropagation()" style="background:none;border:1px solid rgba(0,242,255,0.3);color:var(--accent);border-radius:4px;padding:2px 7px;font-size:0.55rem;cursor:pointer;font-weight:700;margin-right:4px" title="Open Chart">CHART</button>
                        <button onclick="showSignalDetail(null,'${s.ticker}');event.stopPropagation()" style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);color:#8b5cf6;border-radius:4px;padding:2px 7px;font-size:0.55rem;cursor:pointer;font-weight:700;margin-right:4px" title="AI Analysis">AI</button>
                        ${s.state === 'CLOSED'
                            ? `<button onclick="window._archiveReopenSignal(${s.id},this);event.stopPropagation()" style="background:rgba(148,163,184,0.1);border:1px solid rgba(148,163,184,0.3);color:#94a3b8;border-radius:4px;padding:2px 7px;font-size:0.55rem;cursor:pointer;font-weight:700">REOPEN</button>`
                            : `<button onclick="window._archiveCloseSignal(${s.id},this);event.stopPropagation()" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);color:#ef4444;border-radius:4px;padding:2px 7px;font-size:0.55rem;cursor:pointer;font-weight:700">CLOSE</button>`
                        }
                    </td>
                </tr>`;
            }).join('');
        }

        // - Performance Summary Strip -
        const summ     = response?.summary || {};
        const fWins    = summ.wins    ?? 0;
        const fLosses  = summ.losses  ?? 0;
        const fClosed  = summ.closed  ?? 0;
        const fActive  = summ.active  ?? data.length;
        const fAvgRoi  = summ.avg_roi != null ? parseFloat(summ.avg_roi).toFixed(2) : null;
        const fTotal   = summ.total   ?? pageInfo?.total ?? 0;
        const fHitRate = fWins + fLosses > 0 ? ((fWins / (fWins + fLosses)) * 100).toFixed(0) : '--';
        const pWins    = summ.page_wins   ?? data.filter(s => s.state === 'HIT_TP1' || s.state === 'HIT_TP2').length;
        const pLosses  = summ.page_losses ?? data.filter(s => s.state === 'STOPPED').length;

        // Best signal this page (highest absolute return)
        const bestSig  = [...data].sort((a, b) => Math.abs(b.return) - Math.abs(a.return))[0];
        const bestStr  = bestSig
            ? `${bestSig.ticker.replace('-USD','')} ${bestSig.return >= 0 ? '+' : ''}${bestSig.return}%`
            : '--';
        const bestCol  = bestSig ? (bestSig.return >= 0 ? '#22c55e' : '#ef4444') : 'var(--text-dim)';

        const summaryHTML = `
          <div style="margin-bottom:1.2rem">
            <div style="font-size:0.55rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:8px">- PERFORMANCE SUMMARY <span style="color:var(--accent);font-size:0.5rem">(CLOSED SIGNALS)</span></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:0.6rem">${
              [
                ['WIN RATE',     fHitRate !== '--' ? fHitRate + '%' : '--',  parseFloat(fHitRate) >= 50 ? '#22c55e' : '#ef4444', 'emoji_events'],
                ['WINS -',       fWins,    '#22c55e', 'thumb_up'],
                ['LOSSES -',     fLosses,  '#ef4444', 'thumb_down'],
                ['CLOSED',       fClosed,  '#94a3b8', 'lock'],
                ['ACTIVE',       fActive,  '#60a5fa', 'bolt'],
                ['AVG RETURN',   fAvgRoi != null ? (parseFloat(fAvgRoi) >= 0 ? '+' : '') + fAvgRoi + '%' : '--', parseFloat(fAvgRoi) >= 0 ? '#22c55e' : '#ef4444', 'trending_up'],
                ['BEST SIGNAL',  bestStr,  bestCol,   'military_tech'],
              ].map(([label, val, color, icon]) =>
                `<div class="glass-card" style="padding:0.9rem 1rem;text-align:center;position:relative;overflow:hidden">
                  <span class="material-symbols-outlined" style="font-size:1.1rem;color:${color};opacity:0.25;position:absolute;top:8px;right:8px">${icon}</span>
                  <div style="font-size:0.48rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:5px">${label}</div>
                  <div style="font-size:1.15rem;font-weight:900;color:${color};font-family:var(--font-mono)">${val}</div>
                </div>`
              ).join('')
            }</div>
            <div style="font-size:0.52rem;color:var(--text-dim);letter-spacing:0.5px">- Wins/Losses = manually CLOSED signals with locked ROI &nbsp;-&nbsp; Live page states: <span style="color:#22c55e">${pWins} hit target</span> / <span style="color:#ef4444">${pLosses} stopped</span> this page</div>
          </div>`;

        function buildThead() {
            function aTH(col, label, align='left') {
                const isServer = SERVER_SORT_COLS.has(col);
                const active = sortCol === col;
                const ind = active ? (sortDir === 'asc' ? ' -' : ' -') : (isServer ? ' <span style="opacity:0.3;font-size:0.7em">-</span>' : ' <span style="opacity:0.25;font-size:0.65em" title="Sorts current page only">-*</span>');
                const color = active ? 'var(--accent)' : 'var(--text-dim)';
                return `<th style="text-align:${align};padding:8px 12px;cursor:pointer;user-select:none;color:${color};white-space:nowrap;transition:color 0.15s" onclick="window._archiveSort('${col}')">${label}${ind}</th>`;
            }
            return `
                ${aTH('ticker','TICKER','left')}
                ${aTH('type','TYPE','left')}
                ${aTH('direction','ACTION','center')}
                ${aTH('severity','SEV','center')}
                ${aTH('entry','ENTRY','right')}
                ${aTH('current','CURRENT','right')}
                ${aTH('return','RETURN','right')}
                ${aTH('state','STATE','center')}
                ${aTH('date','DATE','left')}
                ${aTH('direction','DIRECTION','center')}
                <th style="text-align:center;padding:8px 12px;color:var(--text-dim)">ACTIONS</th>
            `;
        }

        container.innerHTML = `<style>
          /* - Archive Mobile Responsive - */
          @media (max-width:768px) {
            #archive-table thead { display:none; }
            #archive-table, #archive-table tbody, .archive-row, #archive-table td {
              display:block; width:100%;
            }
            .archive-row {
              border:1px solid ${alphaColor(0.06)} !important;
              border-radius:8px;
              margin-bottom:8px;
              padding:4px 0;
              background:${alphaColor(0.02)};
            }
            #archive-table td {
              display:flex;
              justify-content:space-between;
              align-items:center;
              padding:6px 14px !important;
              border:none !important;
              font-size:0.75rem !important;
            }
            #archive-table td::before {
              content: attr(data-label);
              font-size:0.55rem;
              font-weight:900;
              letter-spacing:1.5px;
              color:var(--text-dim);
              text-transform:uppercase;
              margin-right:auto;
              flex-shrink:0;
            }
            .col-sev, .col-date { display:none !important; }
          }
          @media (max-width:480px) {
            .col-dir { display:none !important; }
            #archive-filters > div { width:100%; }
          }
        </style>` + summaryHTML + `
            <div class="card" style="overflow-x:auto">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:15px">
                    <span style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px">SHOWING ${data.length} SIGNALS (PAGE ${pageInfo?.page||1} OF ${pageInfo?.pages||1} &bull; ${pageInfo?.total||0} TOTAL)</span>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <button class="btv2-export-btn" onclick="_archiveExportPage()"><span class="material-symbols-outlined" style="font-size:13px">download</span> EXPORT PAGE CSV</button>
                        <a href="${(()=>{
                            const t=document.getElementById('filter-ticker')?.value.trim()||'';
                            const ty=document.getElementById('filter-type')?.value||'';
                            const sv=document.getElementById('filter-severity')?.value||'';
                            const dv=document.getElementById('filter-direction')?.value||'';
                            // Mirror loadData URL logic exactly, using DRP closure vars
                            let u='/api/export?type=signals';
                            if (drpMode === 'custom') {
                                const from = document.getElementById('drp-from')?.value || '';
                                const to   = document.getElementById('drp-to')?.value   || '';
                                if (from) u += '&from=' + from;
                                if (to)   u += '&to='   + to;
                            } else if (drpMode === 'today') {
                                const d = new Date().toISOString().split('T')[0];
                                u += '&from=' + d + '&to=' + d;
                            } else if (drpDays === -1) {
                                u += '&days=3650';
                            } else {
                                u += '&days=' + drpDays;
                            }
                            if(t) u+='&ticker='+encodeURIComponent(t.toUpperCase());
                            if(ty) u+='&sigtype='+encodeURIComponent(ty);
                            if(sv) u+='&severity='+encodeURIComponent(sv);
                            if(dv) u+='&direction='+encodeURIComponent(dv);
                            return u;
                        })()}" download class="btv2-export-btn"><span class="material-symbols-outlined" style="font-size:13px">file_download</span> EXPORT ALL (${fTotal})</a>
                        <button class="setup-generator-btn" style="width:85px;padding:0;font-size:0.65rem;height:24px;line-height:24px;text-align:center" onclick="window.loadArchiveData(${currentPage-1>0?currentPage-1:1})" ${currentPage===1?'disabled style="opacity:0.5"':''}>PREVIOUS</button>
                        <div style="font-size:0.75rem;color:var(--text-dim)">PAGE ${pageInfo?.page||1} OF ${pageInfo?.pages||1}</div>
                        <button class="setup-generator-btn" style="width:85px;padding:0;font-size:0.65rem;height:24px;line-height:24px;text-align:center" onclick="window.loadArchiveData(${currentPage+1})" ${(pageInfo&&currentPage>=pageInfo.pages)?'disabled style="opacity:0.5"':''}>NEXT</button>
                    </div>
                </div>
                <div class="table-responsive-wrapper">
                    <table id="archive-table" style="width:100%;border-collapse:collapse;font-size:0.75rem">
                        <thead id="archive-thead"><tr style="border-bottom:1px solid var(--border)">${buildThead()}</tr></thead>
                        <tbody id="archive-tbody">${renderRows(data)}</tbody>
                    </table>
                </div>
            </div>${renderTypeBreakdown(data, response)}`;

        if (window._initEquityCurve && response?.summary?.pnl_curve) {
            setTimeout(() => window._initEquityCurve(response.summary.pnl_curve), 50);
        }
        if (window._initPhase2Charts && response?.summary) {
            setTimeout(() => window._initPhase2Charts(response.summary), 80);
        }

        // - Per-type strategy breakdown table -
        function renderTypeBreakdown(pageData, resp) {
            // Build per-type stats from the full-dataset breakdown returned by the API,
            // falling back to computing from current page data if not available.
            const byType = {};
            const BULLISH_T = new Set(['ML_LONG','RSI_OVERSOLD','MACD_BULLISH_CROSS','REGIME_BULL',
                'WHALE_ACCUMULATION','VOLUME_SPIKE','MOMENTUM_BREAKOUT','ALPHA_DIVERGENCE_LONG','ML_ALPHA_PREDICTION']);

            // Prefer server-provided per_type breakdown
            const serverBreakdown = resp?.summary?.by_type || null;
            if (serverBreakdown && Object.keys(serverBreakdown).length) {
                Object.entries(serverBreakdown).forEach(([type, s]) => {
                    byType[type] = {
                        wins:    s.wins    ?? 0,
                        losses:  s.losses  ?? 0,
                        active:  s.active  ?? 0,
                        closed:  s.closed  ?? 0,
                        avg_roi: s.avg_roi != null ? parseFloat(s.avg_roi) : null,
                        total:   s.total   ?? 0,
                        isBull:  BULLISH_T.has(type)
                    };
                });
            } else {
                // Fallback: compute from current page rows
                (pageData || []).forEach(s => {
                    const t = (s.type || 'UNKNOWN').toUpperCase();
                    if (!byType[t]) byType[t] = { wins:0, losses:0, active:0, closed:0, avg_roi:null, total:0, roiSum:0, roiCount:0, isBull: BULLISH_T.has(t) };
                    byType[t].total++;
                    if (s.state === 'HIT_TP1' || s.state === 'HIT_TP2') byType[t].wins++;
                    else if (s.state === 'STOPPED') byType[t].losses++;
                    else if (s.state === 'CLOSED') byType[t].closed++;
                    else byType[t].active++;
                    const roi = s.final_roi != null ? parseFloat(s.final_roi) : (s.return != null ? parseFloat(s.return) : null);
                    if (roi != null && !isNaN(roi)) { byType[t].roiSum += roi; byType[t].roiCount++; }
                });
                Object.values(byType).forEach(r => {
                    r.avg_roi = r.roiCount > 0 ? r.roiSum / r.roiCount : null;
                });
            }

            let totalWins = 0, totalLosses = 0, totalActive = 0, totalClosed = 0, totalRoiSum = 0, totalRoiCount = 0;
            
            const rows = Object.entries(byType)
                .sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))
                .map(([type, s]) => {
                    totalWins += s.wins;
                    totalLosses += s.losses;
                    totalActive += s.active;
                    totalClosed += s.closed;
                    const decidedForRoi = (s.wins + s.losses + s.closed);
                    if (s.avg_roi != null && decidedForRoi > 0) {
                        totalRoiSum += (parseFloat(s.avg_roi) * decidedForRoi);
                        totalRoiCount += decidedForRoi;
                    }

                    const decided  = s.wins + s.losses;
                    const MIN_SAMPLE = 10;  // below this, win rate is statistically unreliable
                    let winRate, winRateN, wrColor;
                    if (decided === 0) {
                        winRate  = '--';
                        winRateN = null;
                        wrColor  = 'var(--text-dim)';
                    } else if (decided < MIN_SAMPLE) {
                        // Low sample — show muted estimate with warning
                        winRateN = (s.wins / decided) * 100;
                        winRate  = `~${winRateN.toFixed(0)}%`;
                        wrColor  = '#f59e0b';  // amber — caution, not red/green
                    } else {
                        winRateN = (s.wins / decided) * 100;
                        winRate  = winRateN.toFixed(0) + '%';
                        wrColor  = winRateN >= 55 ? '#22c55e' : winRateN >= 40 ? '#f59e0b' : '#ef4444';
                    }
                    const avgRoi   = s.avg_roi != null ? (parseFloat(s.avg_roi) >= 0 ? '+' : '') + parseFloat(s.avg_roi).toFixed(2) + '%' : '--';
                    const avgColor = s.avg_roi != null ? (parseFloat(s.avg_roi) >= 0 ? '#22c55e' : '#ef4444') : 'var(--text-dim)';
                    const badge    = s.isBull
                        ? '<span style="font-size:0.5rem;background:rgba(34,197,94,0.12);color:#22c55e;padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:middle">LONG</span>'
                        : '<span style="font-size:0.5rem;background:rgba(239,68,68,0.12);color:#ef4444;padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:middle">SHORT</span>';
                    return `<tr style="border-bottom:1px solid ${alphaColor(0.04)};transition:background 0.15s" onmouseover="this.style.background=alphaColor(0.03)" onmouseout="this.style.background=''">
                        <td style="padding:12px 14px;font-weight:700;font-size:0.85rem;white-space:nowrap">
                            <span style="color:var(--text)">${type.replace(/_/g,' ')}</span>${badge}
                        </td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:#22c55e;font-family:monospace;font-size:1rem">${s.wins}</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:#ef4444;font-family:monospace;font-size:1rem">${s.losses}</td>
                        <td style="padding:12px 14px;text-align:center;color:#94a3b8;font-family:monospace;font-size:0.95rem">${s.closed}</td>
                        <td style="padding:12px 14px;text-align:center;color:#60a5fa;font-family:monospace;font-size:0.95rem">${s.active}</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:700;color:${avgColor};font-family:monospace;font-size:0.95rem">${avgRoi}</td>
                        <td style="padding:12px 14px;text-align:center">
                            <span style="font-weight:900;font-size:1rem;color:${wrColor};font-family:monospace">${winRate}</span>
                            ${decided > 0 && decided < MIN_SAMPLE
                                ? `<div style="font-size:0.5rem;color:#f59e0b;margin-top:2px;opacity:0.8">${decided} decided · low n</div>`
                                : decided > 0
                                    ? `<div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px">${decided} decided</div>`
                                    : ''
                            }
                        </td>
                    </tr>`;
                }).join('');

            if (!rows) return '';

            const tDecided = totalWins + totalLosses;
            const tWinRate = tDecided > 0 ? ((totalWins / tDecided) * 100).toFixed(0) + '%' : '--';
            const tAvgRoiStr = totalRoiCount > 0 ? ((totalRoiSum / totalRoiCount) >= 0 ? '+' : '') + (totalRoiSum / totalRoiCount).toFixed(2) + '%' : '--';
            const tAvgColor = totalRoiCount > 0 ? ((totalRoiSum / totalRoiCount) >= 0 ? '#22c55e' : '#ef4444') : 'var(--text-dim)';
            const tWrColor = tDecided > 0 ? (((totalWins / tDecided) * 100) >= 55 ? '#22c55e' : ((totalWins / tDecided) * 100) >= 40 ? '#f59e0b' : '#ef4444') : 'var(--text-dim)';

            return `
            <div class="card" style="margin-top:1.5rem;overflow-x:auto">
                <style>
                    .sortable-th:hover { background: rgba(255,255,255,0.05); }
                </style>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;flex-wrap:wrap">
                    <span class="material-symbols-outlined" style="color:var(--accent);font-size:1.3rem">bar_chart</span>
                    <div>
                        <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim)">STRATEGY PERFORMANCE BREAKDOWN</div>
                        <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">All-time win rate and avg return by signal type &middot; <span style="color:var(--accent)">Click columns to sort</span></div>
                    </div>
                </div>
                <table id="strategy-breakdown-table" style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:600px">
                    <thead>
                        <tr style="border-bottom:2px solid ${alphaColor(0.12)}">
                            <th class="sortable-th" onclick="if(window.sortBreakdownTable) window.sortBreakdownTable(this)" style="cursor:pointer;user-select:none;text-align:left;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">SIGNAL TYPE</th>
                            <th class="sortable-th" onclick="if(window.sortBreakdownTable) window.sortBreakdownTable(this)" style="cursor:pointer;user-select:none;text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:#22c55e">WINS</th>
                            <th class="sortable-th" onclick="if(window.sortBreakdownTable) window.sortBreakdownTable(this)" style="cursor:pointer;user-select:none;text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:#ef4444">LOSSES</th>
                            <th class="sortable-th" onclick="if(window.sortBreakdownTable) window.sortBreakdownTable(this)" style="cursor:pointer;user-select:none;text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:#94a3b8">CLOSED</th>
                            <th class="sortable-th" onclick="if(window.sortBreakdownTable) window.sortBreakdownTable(this)" style="cursor:pointer;user-select:none;text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:#60a5fa">ACTIVE</th>
                            <th class="sortable-th" onclick="if(window.sortBreakdownTable) window.sortBreakdownTable(this)" style="cursor:pointer;user-select:none;text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">AVG RETURN</th>
                            <th class="sortable-th" onclick="if(window.sortBreakdownTable) window.sortBreakdownTable(this)" style="cursor:pointer;user-select:none;text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">WIN RATE</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    <tfoot>
                        <tr style="border-top:2px solid ${alphaColor(0.2)};background:${alphaColor(0.02)}">
                            <td style="padding:12px 14px;font-weight:900;font-size:0.85rem;color:var(--text);letter-spacing:1px">OVERALL TOTALS</td>
                            <td style="padding:12px 14px;text-align:center;font-weight:900;color:#22c55e;font-family:monospace;font-size:1.1rem">${totalWins}</td>
                            <td style="padding:12px 14px;text-align:center;font-weight:900;color:#ef4444;font-family:monospace;font-size:1.1rem">${totalLosses}</td>
                            <td style="padding:12px 14px;text-align:center;font-weight:900;color:#94a3b8;font-family:monospace;font-size:1.05rem">${totalClosed}</td>
                            <td style="padding:12px 14px;text-align:center;font-weight:900;color:#60a5fa;font-family:monospace;font-size:1.05rem">${totalActive}</td>
                            <td style="padding:12px 14px;text-align:center;font-weight:900;color:${tAvgColor};font-family:monospace;font-size:1.05rem">${tAvgRoiStr}</td>
                            <td style="padding:12px 14px;text-align:center">
                                <span style="font-weight:900;font-size:1.1rem;color:${tWrColor};font-family:monospace">${tWinRate}</span>
                                ${tDecided > 0 ? `<div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px">${tDecided} decided</div>` : ''}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="card" style="margin-top:1.5rem;padding:1.5rem;display:flex;flex-direction:row;gap:20px;height:250px">
                <div style="flex:1;position:relative;height:100%;width:100%;">
                    <div style="position:absolute;top:0;left:0;z-index:10;pointer-events:none">
                        <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim)">CUMULATIVE PNL CURVE</div>
                        <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">All-time cumulative return &middot; <span style="color:var(--accent)">closed signals only</span></div>
                    </div>
                    <canvas id="equity-curve-canvas"></canvas>
                </div>
                <div style="width:140px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;text-align:right" id="equity-curve-summary">
                    <!-- Updated via Chart initialization -->
                    <span style="font-size:1.8rem;font-weight:900;color:var(--text-dim);letter-spacing:-0.5px;font-family:monospace">--%</span>
                    <div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px;letter-spacing:1px">-- TRADES</div>
                </div>
            </div>
            <div style="margin-top:1.5rem;display:grid;grid-template-columns:repeat(auto-fit, minmax(350px, 1fr));gap:1.5rem">
                <!-- Asset Distribution Chart -->
                <div class="card" onclick="window._openChartModal('asset')" style="padding:1.5rem;height:350px;position:relative;display:flex;flex-direction:column;cursor:pointer;transition:border-color 0.2s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
                    <div style="margin-bottom:1rem;pointer-events:none">
                        <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim)">P&L BY ASSET CLASS</div>
                        <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">Top performances &middot; <span style="color:var(--accent)">closed signals only</span></div>
                    </div>
                    <div style="flex:1;position:relative;width:100%;min-height:200px" id="asset-dist-wrapper">
                        <canvas id="asset-dist-canvas"></canvas>
                    </div>
                </div>
                <!-- Execution Heatmap -->
                <div class="card" onclick="window._openChartModal('heatmap')" style="padding:1.5rem;height:350px;position:relative;display:flex;flex-direction:column;cursor:pointer;transition:border-color 0.2s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
                    <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none">
                        <div>
                            <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim)">EXECUTION HEATMAP</div>
                            <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">Avg P&L by Global Hour & Day</div>
                        </div>
                        <div style="display:flex;gap:4px;align-items:center;font-size:0.5rem;color:var(--text-dim);padding-bottom:2px">
                            <span style="background:rgba(239, 68, 68, 0.4);width:8px;height:8px;border-radius:2px"></span> NEG
                            <span style="background:rgba(0, 242, 255, 0.4);width:8px;height:8px;border-radius:2px;margin-left:4px"></span> POS
                        </div>
                    </div>
                    <div id="heatmap-container" style="flex:1;display:flex;flex-direction:column;width:100%;overflow:hidden">
                        <!-- Rendered via JS -->
                    </div>
                </div>
            </div>`;
        }

        // - Sort handler: always client-side -
        window._archiveSort = function(col) {
            if (sortCol === col) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortCol = col;
                sortDir = 'desc';
            }
            if (SERVER_SORT_COLS.has(col)) {
                // Server-side: re-fetch from page 1 with the full dataset sorted
                loadData(1);
            } else {
                // Client-side: sort the already-fetched page data in-memory (instant)
                const thead = document.getElementById('archive-thead');
                const tbody = document.getElementById('archive-tbody');
                if (thead) thead.innerHTML = `<tr style="border-bottom:1px solid var(--border)">${buildThead()}</tr>`;
                if (tbody) tbody.innerHTML = renderRows(window._archiveCurrentData || data);
            }
        };
    };


    window.loadArchiveData = loadData;
    window.loadData = loadData; // expose for RESET button

    // - Signal Close / Reopen handlers -
    // Guard set: prevents duplicate API calls if the button is somehow clicked twice
    const _closingInFlight = new Set();
    window._archiveCloseSignal = async function(id, btn) {
        if (_closingInFlight.has(id)) return;   // already in progress - ignore duplicate
        _closingInFlight.add(id);
        btn.disabled = true; btn.textContent = '...';
        try {
            const res = await fetch(`/api/signal/${id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error(await res.text());
            const result = await res.json();
            const roiStr = result.final_roi != null ? ` - ROI locked: ${result.final_roi >= 0 ? '+' : ''}${result.final_roi}%` : '';
            showToast('SIGNAL CLOSED', `Signal #${id} closed.${roiStr}`, result.final_roi >= 0 ? 'success' : 'alert');
            loadData(currentPage);
        } catch(e) {
            showToast('ERROR', `Could not close signal: ${e.message}`, 'alert');
            btn.disabled = false; btn.textContent = 'CLOSE';
        } finally {
            _closingInFlight.delete(id);
        }
    };
    window._archiveReopenSignal = async function(id, btn) {
        btn.disabled = true; btn.textContent = '...';
        try {
            const res = await fetch(`/api/signal/${id}/reopen`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            if (!res.ok) throw new Error(await res.text());
            showToast('SIGNAL REOPENED', `Signal #${id} is ACTIVE again.`, 'success');
            loadData(1);
        } catch(e) {
            showToast('ERROR', `Could not reopen signal: ${e.message}`, 'alert');
            btn.disabled = false; btn.textContent = 'REOPEN';
        }
    };

    // Expose current page data for CSV export
    window._archiveCurrentData = null;
    window._archiveExportPage = function() {
        if (!window._archiveCurrentData || !window._archiveCurrentData.length) {
            showToast('EXPORT', 'No data to export on this page.', 'alert'); return;
        }
        exportCSV(window._archiveCurrentData, `alphasignal_archive_page_${new Date().toISOString().split('T')[0]}.csv`);
        showToast('EXPORT', 'Page data exported as CSV.', 'success');
    };


    // - Signal Detail Drawer -
    (function _initDrawer() {
        if (document.getElementById('sig-drawer')) return;
        const st = document.createElement('style');
        st.textContent = [
            '#sig-drawer-overlay{position:fixed;inset:0;z-index:9998;opacity:0;pointer-events:none;transition:opacity .3s}',
            '#sig-drawer-overlay.open{opacity:1;pointer-events:all}',
            '#sig-drawer{position:fixed;top:0;right:0;width:440px;max-width:100vw;height:100vh;z-index:9999;',
            'background:#0a1628;border-left:1px solid rgba(0,242,255,0.15);',
            'padding:2rem 1.5rem 4rem;overflow-y:auto;',
            'transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1)}',
            '#sig-drawer.open{transform:translateX(0)}',
            '.sdw-label{font-size:.48rem;font-weight:900;letter-spacing:1.5px;color:#6b7280;margin-bottom:4px}',
            '.sdw-val{font-size:1.05rem;font-weight:900;font-family:monospace}',
            '.sdw-card{background:${alphaColor(.04)};border:1px solid ${alphaColor(.07)};border-radius:10px;padding:.85rem 1rem;text-align:center}',
            '.sdw-tp{display:flex;align-items:center;gap:8px;padding:.5rem .75rem;border-radius:8px;margin-bottom:6px;font-size:.72rem}',
        ].join('');
        document.head.appendChild(st);
        const ov = document.createElement('div');
        ov.id = 'sig-drawer-overlay';
        ov.onclick = () => window._closeSignalDrawer();
        document.body.appendChild(ov);
        const dr = document.createElement('div');
        dr.id = 'sig-drawer';
        document.body.appendChild(dr);
    })();

    window._closeSignalDrawer = function() {
        document.getElementById('sig-drawer')?.classList.remove('open');
        document.getElementById('sig-drawer-overlay')?.classList.remove('open');
    };

    window._openSignalDrawer = function(rawId) {
        const id = String(rawId);
        const s  = (window._archiveSignals || {})[id];
        if (!s) { console.warn('[Drawer] signal not found:', id, Object.keys(window._archiveSignals||{}).slice(0,5)); return; }
        const drawer = document.getElementById('sig-drawer');
        const isClosed  = s.state === 'CLOSED';
        const roi       = isClosed && s.final_roi != null ? s.final_roi : s.return;
        const roiColor  = roi >= 0 ? '#22c55e' : '#ef4444';
        const exitPx    = isClosed && s.exit_price ? s.exit_price : s.current;
        const SC        = {ACTIVE:'#60a5fa',HIT_TP1:'#22c55e',HIT_TP2:'#16a34a',STOPPED:'#ef4444',CLOSED:'#94a3b8'};
        const SI        = {ACTIVE:'\u26a1',HIT_TP1:'\uD83C\uDFAF',HIT_TP2:'\uD83C\uDFC6',STOPPED:'\uD83D\uDED1',CLOSED:'\uD83D\uDD12'};
        const sc        = SC[s.state] || '#60a5fa';
        const entry     = Number(s.entry || 0);
        const tp2px     = entry > 0 ? formatPrice(entry * 1.10) : '-';
        const tp1px     = entry > 0 ? formatPrice(entry * 1.05) : '-';
        const slpx      = entry > 0 ? formatPrice(entry * 0.97) : '-';
        const sym       = s.ticker.replace('-USD','');
        const tsStr     = (s.timestamp||'').replace('T',' ').slice(0,16);
        const closedStr = (s.closed_at||'').slice(0,16);
        const metaClosed = isClosed ? `<div><span style="opacity:.6">CLOSED AT</span><br><b style="color:#94a3b8">${closedStr}</b></div>` : '';
        const actionHtml = !isClosed
            ? `<button onclick="window._archiveCloseSignal(${s.id},this);window._closeSignalDrawer()"
                style="width:100%;padding:.85rem;background:linear-gradient(135deg,rgba(239,68,68,.15),rgba(239,68,68,.05));border:1px solid rgba(239,68,68,.3);color:#ef4444;border-radius:10px;cursor:pointer;font-size:.75rem;font-weight:700;letter-spacing:1.5px">
                CLOSE SIGNAL &#x26; LOCK ROI
               </button>`
            : `<div style="text-align:center;padding:.75rem;background:rgba(148,163,184,.06);border:1px solid rgba(148,163,184,.1);border-radius:10px;font-size:.7rem;color:#94a3b8;letter-spacing:1px">
                \uD83D\uDD12 SIGNAL CLOSED &nbsp;&middot;&nbsp; ROI LOCKED AT ${s.final_roi!=null?(s.final_roi>=0?'+':'')+s.final_roi+'%':'-'}
               </div>`;
        const thesisHtml = s.message
            ? `<div style="margin-bottom:1.2rem">
                 <div style="font-size:.5rem;font-weight:900;letter-spacing:2px;color:#6b7280;margin-bottom:8px">AI THESIS</div>
                 <div style="background:${alphaColor(.03)};border:1px solid ${alphaColor(.07)};border-radius:10px;padding:1rem;font-size:.75rem;color:#94a3b8;line-height:1.6">${s.message}</div>
               </div>` : '';

        drawer.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">
            <div>
              <div style="font-size:1.6rem;font-weight:900;color:#00f2ff;letter-spacing:-0.5px">${sym}</div>
              <div style="font-size:.6rem;color:#6b7280;margin-top:2px">${s.ticker} &nbsp;&middot;&nbsp; ${(s.type||'').replace(/_/g,' ')}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="background:${sc}22;color:${sc};padding:4px 12px;border-radius:20px;font-size:.6rem;font-weight:700;letter-spacing:1px">${SI[s.state]||''} ${s.state}</span>
              <button onclick="window._closeSignalDrawer()" style="background:${alphaColor(.06)};border:1px solid ${alphaColor(.1)};color:#6b7280;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;line-height:1">&#x2715;</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:1.2rem">
            <div class="sdw-card"><div class="sdw-label">ENTRY</div><div class="sdw-val" style="color:#e2e8f0">${s.entry ? formatPrice(s.entry) : '-'}</div></div>
            <div class="sdw-card"><div class="sdw-label">${isClosed ? 'EXIT' : 'CURRENT'}</div><div class="sdw-val" style="color:${isClosed?'#94a3b8':'#e2e8f0'}">${exitPx ? formatPrice(exitPx) : '-'}</div></div>
            <div class="sdw-card"><div class="sdw-label">ROI</div><div class="sdw-val" style="color:${roiColor}">${isClosed ? '\uD83D\uDD12 ' : ''}${roi >= 0 ? '+' : ''}${roi}%</div></div>
          </div>
          <div style="margin-bottom:1.2rem">
            <div style="font-size:.5rem;font-weight:900;letter-spacing:2px;color:#6b7280;margin-bottom:8px">SIGNAL LEVELS</div>
            <div class="sdw-tp" style="background:rgba(22,163,74,.12);border:1px solid rgba(22,163,74,.2)"><span style="color:#16a34a;font-weight:900;min-width:36px">TP2</span><span style="color:#6b7280">+10%</span><span style="margin-left:auto;color:#16a34a;font-family:monospace">${tp2px}</span></div>
            <div class="sdw-tp" style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.15)"><span style="color:#22c55e;font-weight:900;min-width:36px">TP1</span><span style="color:#6b7280">+5%</span><span style="margin-left:auto;color:#22c55e;font-family:monospace">${tp1px}</span></div>
            <div class="sdw-tp" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.15)"><span style="color:#ef4444;font-weight:900;min-width:36px">SL</span><span style="color:#6b7280">-3%</span><span style="margin-left:auto;color:#ef4444;font-family:monospace">${slpx}</span></div>
          </div>
          ${thesisHtml}
          <div style="margin-bottom:1.5rem">
            <div style="font-size:.5rem;font-weight:900;letter-spacing:2px;color:#6b7280;margin-bottom:8px">METADATA</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.7rem;color:#94a3b8">
              <div><span style="opacity:.6">GENERATED</span><br><b style="color:#e2e8f0">${tsStr} UTC</b></div>
              <div><span style="opacity:.6">AGE</span><br><b style="color:#e2e8f0">${s.age_days != null ? s.age_days + ' days' : '-'}</b></div>
              <div><span style="opacity:.6">SEVERITY</span><br><b style="color:#e2e8f0">${(s.severity||'').toUpperCase()}</b></div>
              ${metaClosed}
            </div>
          </div>
          ${actionHtml}
        `;
        drawer.classList.add('open');
        document.getElementById('sig-drawer-overlay')?.classList.add('open');
    };

    document.getElementById('apply-filters').onclick = () => loadData(1);
    // Load initial data
    loadData(1);
}


if (typeof window.sortBreakdownTable === 'undefined') {
    window.sortBreakdownTable = function(th) {
        const table = th.closest('table');
        if (!table) return;
        const tbody = table.querySelector('tbody');
        const rowArr = Array.from(tbody.querySelectorAll('tr'));
        const headCells = Array.from(th.parentNode.children);
        const colIdx = headCells.indexOf(th);
        
        const isAsc = (table.dataset.sortCol == colIdx && table.dataset.sortAsc == 'true');
        
        rowArr.sort((a, b) => {
            let vA = a.cells[colIdx].textContent.trim();
            let vB = b.cells[colIdx].textContent.trim();
            
            // Extract the first number from the cell (ignoring secondary text like "decided")
            let matchA = vA.match(/-?[0-9]*\.?[0-9]+/);
            let matchB = vB.match(/-?[0-9]*\.?[0-9]+/);
            
            let nA = matchA ? parseFloat(matchA[0]) : NaN;
            let nB = matchB ? parseFloat(matchB[0]) : NaN;
            
            if (!isNaN(nA) && !isNaN(nB)) {
                vA = nA; 
                vB = nB;
            } else if (isNaN(nA) && !isNaN(nB)) {
                return isAsc ? 1 : 1; // push NaN to bottom
            } else if (!isNaN(nA) && isNaN(nB)) {
                return isAsc ? -1 : -1; // push NaN to bottom
            } else {
                vA = vA.toLowerCase();
                vB = vB.toLowerCase();
            }
            
            if (vA < vB) return isAsc ? -1 : 1;
            if (vA > vB) return isAsc ? 1 : -1;
            return 0;
        });
        
        table.dataset.sortCol = colIdx;
        table.dataset.sortAsc = (!isAsc).toString();
        
        rowArr.forEach(r => tbody.appendChild(r));
        
        headCells.forEach((c, i) => {
            let html = c.innerHTML.replace(' ▲', '').replace(' ▼', '');
            if (i === colIdx) html += (!isAsc ? ' ▲' : ' ▼');
            c.innerHTML = html;
        });
    };
}

if (typeof window._initEquityCurve === 'undefined') {
    window._initEquityCurve = function(pnlSeries) {
        if (!pnlSeries || !pnlSeries.length) return;
        const ctx = document.getElementById('equity-curve-canvas');
        if (!ctx) return;
        
        let cumulative = 0;
        let peak = -Infinity;
        const labels = [];
        const dataPoints = [];
        const drawdownPoints = [];
        const winRatePoints = [];
        const recentOutcomes = [];
        
        pnlSeries.forEach(point => {
            cumulative += point.roi;
            if (cumulative > peak) peak = cumulative;
            const dd = Math.min(0, cumulative - peak);
            
            recentOutcomes.push(point.roi > 0 ? 1 : 0);
            if (recentOutcomes.length > 30) recentOutcomes.shift();
            const wr = recentOutcomes.length > 0 ? (recentOutcomes.reduce((a,b)=>a+b, 0) / recentOutcomes.length) * 100 : 0;
            
            const dt = new Date(point.date);
            labels.push(dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            dataPoints.push(cumulative.toFixed(2));
            drawdownPoints.push(dd.toFixed(2));
            winRatePoints.push(wr.toFixed(2));
        });
        
        if (window._equityChartInstance) {
            window._equityChartInstance.destroy();
        }
        
        const isUp = cumulative >= 0;
        const lineColor = isUp ? '#00f2ff' : '#ef4444';
        const gradColor = isUp ? 'rgba(0, 242, 255, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        
        window._equityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cumulative P&L (%)',
                        data: dataPoints,
                        borderColor: lineColor,
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, gradColor);
                            gradient.addColorStop(1, 'rgba(0,0,0,0)');
                            return gradient;
                        },
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHitRadius: 10,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#fff',
                        fill: true,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Max Drawdown (%)',
                        data: drawdownPoints,
                        borderColor: 'rgba(239, 68, 68, 0.8)',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        borderWidth: 1,
                        pointRadius: 0,
                        pointHitRadius: 5,
                        fill: true,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: '30-Day Win Rate (%)',
                        data: winRatePoints,
                        borderColor: 'rgba(234, 179, 8, 0.6)',
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHitRadius: 5,
                        fill: false,
                        tension: 0.2,
                        yAxisID: 'yWinRate'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 22, 40, 0.95)',
                        titleColor: '#94a3b8',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        displayColors: true,
                        boxPadding: 4,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(2) + '%';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { display: false, drawBorder: false },
                        ticks: {
                            color: 'rgba(148, 163, 184, 0.5)',
                            font: { size: 9, family: 'monospace' },
                            maxTicksLimit: 6,
                            maxRotation: 0
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 10, family: 'monospace' },
                            callback: function(value) { return value + '%'; }
                        }
                    },
                    yWinRate: {
                        type: 'linear',
                        display: false,
                        position: 'right',
                        min: 0, 
                        max: 100,
                        grid: { display: false, drawBorder: false }
                    }
                }
            }
        });
        
        const summaryDiv = document.getElementById('equity-curve-summary');
        if (summaryDiv) {
            const finalWinRate = winRatePoints.length > 0 ? winRatePoints[winRatePoints.length-1] : 0;
            const finalDrawdown = drawdownPoints.length > 0 ? drawdownPoints[drawdownPoints.length-1] : 0;
            
            summaryDiv.innerHTML = `<span style="font-size:1.4rem;font-weight:900;color:${lineColor};letter-spacing:-0.5px;font-family:monospace">${isUp?'+':''}${cumulative.toFixed(2)}%</span>
            <div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px;letter-spacing:1px">${pnlSeries.length} TRADES</div>
            <div style="font-size:0.55rem;color:rgba(234, 179, 8, 0.8);margin-top:8px;font-family:monospace;font-weight:bold">WR: ${finalWinRate}%</div>
            <div style="font-size:0.55rem;color:rgba(239, 68, 68, 0.8);margin-top:2px;font-family:monospace;font-weight:bold">DD: ${finalDrawdown}%</div>`;
        }
    };
}

if (typeof window._initPhase2Charts === 'undefined') {
    window._initPhase2Charts = function(summary) {
        if (!summary) return;
        window._lastSummaryData = summary;
        
        // 1. Asset Distribution Bar Chart
        if (summary.by_ticker && summary.by_ticker.length) {
            const ctxAsset = document.getElementById('asset-dist-canvas');
            if (ctxAsset) {
                // Top 10 and Bottom 5 mapping
                const sorted = [...summary.by_ticker].sort((a,b) => b.total_roi - a.total_roi);
                let displayTickers = sorted;
                if (sorted.length > 15) {
                    displayTickers = [...sorted.slice(0, 10), ...sorted.slice(-5)];
                }
                
                const labels = displayTickers.map(t => t.symbol);
                const data = displayTickers.map(t => t.total_roi);
                const bgColors = data.map(v => v >= 0 ? 'rgba(0, 242, 255, 0.4)' : 'rgba(239, 68, 68, 0.4)');
                const borderColors = data.map(v => v >= 0 ? '#00f2ff' : '#ef4444');
                
                if (window._assetChartInstance) window._assetChartInstance.destroy();
                
                window._assetChartInstance = new Chart(ctxAsset, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: bgColors,
                            borderColor: borderColors,
                            borderWidth: 1,
                            borderRadius: 2,
                            barThickness: 'flex'
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(10, 22, 40, 0.9)',
                                titleColor: '#94a3b8',
                                bodyColor: '#fff',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderWidth: 1,
                                displayColors: false,
                                callbacks: {
                                    label: function(context) {
                                        const t = displayTickers[context.dataIndex];
                                        return `Total P&L: ${t.total_roi}% | Trades: ${t.total}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                                ticks: { color: '#94a3b8', font: { size: 9, family: 'monospace' }, callback: v => v+'%' }
                            },
                            y: {
                                grid: { display: false, drawBorder: false },
                                ticks: { color: '#94a3b8', font: { size: 9, family: 'monospace', weight: 'bold' } }
                            }
                        }
                    }
                });
            }
        }

        // 2. Heatmap DOM builder
        if (summary.heatmap_data && summary.heatmap_data.length) {
            const hCont = document.getElementById('heatmap-container');
            if (hCont) {
                const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
                
                // Initialize matrix
                const matrix = {};
                for(let d=0; d<7; d++) {
                    matrix[d] = {};
                    for(let h=0; h<24; h+=2) { // 2-hour buckets
                        matrix[d][h] = { roi:0, count:0 };
                    }
                }
                
                summary.heatmap_data.forEach(r => {
                    let bucketH = Math.floor(r.hour / 2) * 2;
                    if (matrix[r.dow] && matrix[r.dow][bucketH]) {
                        matrix[r.dow][bucketH].roi += r.total_roi;
                        matrix[r.dow][bucketH].count += r.total;
                    }
                });
                
                let maxAbsRoi = 0.001; 
                for(let d=0; d<7; d++){
                    for(let h=0; h<24; h+=2){
                        if(matrix[d][h].count > 0 && Math.abs(matrix[d][h].roi) > maxAbsRoi) {
                            maxAbsRoi = Math.abs(matrix[d][h].roi);
                        }
                    }
                }

                let html = `<div style="display:flex;flex-direction:column;gap:4px;height:100%;justify-content:center">`;
                // Header (Hours)
                html += `<div style="display:flex;gap:4px;margin-left:30px">`;
                for(let h=0; h<24; h+=2) {
                    html += `<div style="flex:1;text-align:center;font-size:0.45rem;color:var(--text-dim);font-family:monospace">${h.toString().padStart(2,'0')}h</div>`;
                }
                html += `</div>`;
                
                for(let d=0; d<7; d++) {
                    html += `<div style="display:flex;gap:4px;flex:1;min-height:0">`;
                    html += `<div style="width:25px;display:flex;align-items:center;justify-content:flex-end;font-size:0.55rem;font-weight:900;color:var(--text-dim);padding-right:5px">${DAYS[d]}</div>`;
                    for(let h=0; h<24; h+=2) {
                        const cell = matrix[d][h];
                        let bg = 'rgba(255,255,255,0.02)';
                        let title = `No Trades`;
                        if (cell.count > 0) {
                            const intensity = Math.max(0.15, Math.min(0.9, Math.abs(cell.roi) / maxAbsRoi));
                            if (cell.roi >= 0) {
                                bg = `rgba(0, 242, 255, ${intensity})`;
                            } else {
                                bg = `rgba(239, 68, 68, ${intensity})`;
                            }
                            title = `${cell.roi >= 0 ? '+':''}${cell.roi.toFixed(2)}% ROI (${cell.count} trades)`;
                        }
                        html += `<div title="${title}" style="flex:1;background:${bg};border-radius:2px;transition:all 0.2s;cursor:crosshair" onmouseover="this.style.opacity=0.5" onmouseout="this.style.opacity=1"></div>`;
                    }
                    html += `</div>`;
                }
                html += `</div>`;
                hCont.innerHTML = html;
            }
        }
    };

    window._openChartModal = function(type) {
        const summary = window._lastSummaryData;
        if (!summary) return;

        let modal = document.getElementById('chart-zoom-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'chart-zoom-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(6,11,20,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;padding:40px;box-sizing:border-box;backdrop-filter:blur(10px);opacity:0;transition:opacity 0.2s ease-in-out';
            modal.onclick = function(e) { if(e.target === modal) window._closeChartModal(); };
            
            const content = document.createElement('div');
            content.id = 'chart-zoom-content';
            content.className = 'card';
            content.style.cssText = 'width:100%;max-width:1400px;height:100%;max-height:85vh;padding:2.5rem;position:relative;display:flex;flex-direction:column;background:var(--bg-mid);border:1px solid var(--border)';
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.style.cssText = 'position:absolute;top:1rem;right:1.5rem;background:none;border:none;color:var(--text-dim);font-size:2.5rem;cursor:pointer;line-height:1';
            closeBtn.onclick = window._closeChartModal;
            closeBtn.onmouseover = () => closeBtn.style.color = '#fff';
            closeBtn.onmouseout = () => closeBtn.style.color = 'var(--text-dim)';
            
            const header = document.createElement('div');
            header.id = 'chart-zoom-header';
            header.style.marginBottom = '2rem';
            
            const body = document.createElement('div');
            body.id = 'chart-zoom-body';
            body.style.flex = '1';
            body.style.position = 'relative';
            body.style.display = 'flex';
            body.style.flexDirection = 'column';
            body.style.overflow = 'hidden';
            
            content.appendChild(closeBtn);
            content.appendChild(header);
            content.appendChild(body);
            modal.appendChild(content);
            document.body.appendChild(modal);
        }
        
        const header = document.getElementById('chart-zoom-header');
        const body = document.getElementById('chart-zoom-body');
        
        if (type === 'asset') {
            header.innerHTML = `<div style="font-size:1.2rem;font-weight:900;letter-spacing:2px;color:var(--text-bright)">P&L BY ASSET CLASS</div>
                               <div style="color:var(--text-dim);margin-top:5px;font-size:0.85rem">Expanded View &middot; <span style="color:var(--accent)">closed signals only</span></div>`;
            body.innerHTML = `<canvas id="asset-zoom-canvas"></canvas>`;
            modal.style.display = 'flex';
            setTimeout(() => modal.style.opacity = '1', 10);
            
            const ctx = document.getElementById('asset-zoom-canvas');
            if (window._assetZoomChartInstance) window._assetZoomChartInstance.destroy();
            
            const sorted = [...summary.by_ticker].sort((a,b) => b.total_roi - a.total_roi);
            const displayTickers = sorted.slice(0, 50); // Show up to top 50 in big modal
            const labels = displayTickers.map(t => t.symbol);
            const data = displayTickers.map(t => t.total_roi);
            const bgColors = data.map(v => v >= 0 ? 'rgba(0, 242, 255, 0.4)' : 'rgba(239, 68, 68, 0.4)');
            const borderColors = data.map(v => v >= 0 ? '#00f2ff' : '#ef4444');
            
            window._assetZoomChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: bgColors,
                        borderColor: borderColors,
                        borderWidth: 1,
                        borderRadius: 2,
                        barThickness: 'flex'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(10, 22, 40, 0.9)',
                            titleColor: '#94a3b8',
                            bodyColor: '#fff',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    const t = displayTickers[context.dataIndex];
                                    return `Total P&L: ${t.total_roi}% | Trades: ${t.total} | Win Rate: ${t.total > 0 ? Math.round((t.wins/t.total)*100) : 0}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 11, family: 'monospace' }, callback: v => v+'%' } },
                        y: { grid: { display: false, drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 11, family: 'monospace', weight: 'bold' } } }
                    }
                }
            });
            
        } else if (type === 'heatmap') {
            header.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-end">
                                    <div>
                                        <div style="font-size:1.2rem;font-weight:900;letter-spacing:2px;color:var(--text-bright)">EXECUTION HEATMAP</div>
                                        <div style="color:var(--text-dim);margin-top:5px;font-size:0.85rem">Avg P&L by Global Hour & Day &middot; Expanded View</div>
                                    </div>
                                    <div style="display:flex;gap:6px;align-items:center;font-size:0.75rem;color:var(--text-dim)">
                                        <span style="background:rgba(239, 68, 68, 0.5);width:12px;height:12px;border-radius:2px"></span> NEGATIVE RETURN
                                        <span style="background:rgba(0, 242, 255, 0.5);width:12px;height:12px;border-radius:2px;margin-left:10px"></span> POSITIVE RETURN
                                    </div>
                                </div>`;
            
            // Rebuild matrix for zoomed view with larger styling
            const DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
            const matrix = {};
            for(let d=0; d<7; d++) {
                matrix[d] = {};
                for(let h=0; h<24; h+=2) { matrix[d][h] = { roi:0, count:0, win:0 }; }
            }
            summary.heatmap_data.forEach(r => {
                let bucketH = Math.floor(r.hour / 2) * 2;
                if (matrix[r.dow] && matrix[r.dow][bucketH]) {
                    matrix[r.dow][bucketH].roi += r.total_roi;
                    matrix[r.dow][bucketH].count += r.total;
                }
            });
            let maxAbsRoi = 0.001; 
            for(let d=0; d<7; d++){ for(let h=0; h<24; h+=2){ if(matrix[d][h].count > 0 && Math.abs(matrix[d][h].roi) > maxAbsRoi) maxAbsRoi = Math.abs(matrix[d][h].roi); } }

            let html = `<div style="display:flex;flex-direction:column;gap:8px;height:100%;justify-content:center">`;
            html += `<div style="display:flex;gap:8px;margin-left:110px">`;
            for(let h=0; h<24; h+=2) {
                html += `<div style="flex:1;text-align:center;font-size:0.85rem;font-weight:bold;color:var(--text-dim);font-family:monospace">${h.toString().padStart(2,'0')}h</div>`;
            }
            html += `</div>`;
            for(let d=0; d<7; d++) {
                html += `<div style="display:flex;gap:8px;flex:1;min-height:0">`;
                html += `<div style="width:100px;display:flex;align-items:center;justify-content:flex-end;font-size:0.85rem;font-weight:900;color:var(--text-dim);padding-right:10px">${DAYS[d]}</div>`;
                for(let h=0; h<24; h+=2) {
                    const cell = matrix[d][h];
                    let bg = 'rgba(255,255,255,0.02)';
                    let title = `No Trades`;
                    if (cell.count > 0) {
                        const intensity = Math.max(0.15, Math.min(0.9, Math.abs(cell.roi) / maxAbsRoi));
                        bg = cell.roi >= 0 ? `rgba(0, 242, 255, ${intensity})` : `rgba(239, 68, 68, ${intensity})`;
                        title = `${cell.roi >= 0 ? '+':''}${cell.roi.toFixed(2)}% ROI (${cell.count} trades)`;
                    }
                    html += `<div title="${title}" style="flex:1;background:${bg};border-radius:4px;transition:all 0.15s;cursor:crosshair;display:flex;align-items:center;justify-content:center" onmouseover="this.style.transform='scale(1.05)';this.style.zIndex='10'" onmouseout="this.style.transform='none';this.style.zIndex='1'">
                                ${cell.count > 0 ? `<span style="font-size:0.75rem;font-family:monospace;font-weight:bold;color:rgba(255,255,255,0.8);pointer-events:none">${cell.roi >= 0 ? '+':''}${Math.round(cell.roi)}%</span>` : ''}
                             </div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
            
            body.innerHTML = html;
            modal.style.display = 'flex';
            setTimeout(() => modal.style.opacity = '1', 10);
        }
    };

    window._closeChartModal = function() {
        const m = document.getElementById('chart-zoom-modal');
        if(m) {
            m.style.opacity = '0';
            setTimeout(() => m.style.display = 'none', 200);
        }
    };
}
