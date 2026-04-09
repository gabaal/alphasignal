async function renderAdvOverview(symbol, interval) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    
    // Phase 5.2: Universal Data Dispatcher (Crypto vs Equity)
    let klines = [];
    const isCrypto = symbol.toUpperCase().includes('USDT') || symbol.toUpperCase().includes('BTC') || symbol.toUpperCase().includes('ETH');
    
    if (isCrypto) {
        klines = await fetchBinanceKlines(symbol, interval, 500);
    } else {
        // Fetch Equity Klines from our Backend Proxy
        klines = await fetchAPI(`/equity-klines?symbol=${symbol}&interval=${interval}`);
    }

    if (!klines || klines.length === 0) {
        container.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-dim);">
            <span class="material-symbols-outlined" style="font-size:3rem; margin-bottom:1rem;">error_outline</span>
            <p>Insufficient structural data for ${symbol}.</p>
            <p style="font-size:0.7rem;">(Check network connectivity or asset availability)</p>
        </div>`;
        return;
    }

    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b' }, textColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#d1d5db', fontSize: 11, fontFamily: 'JetBrains Mono' },
        grid: { vertLines: { color: alphaColor(0.03) }, horzLines: { color: alphaColor(0.03) } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { borderColor: alphaColor(0.1), timeVisible: true }
    });
    
    const candleSeries = chart.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
    const volumeSeries = chart.addHistogramSeries({ color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '', scaleMargins: { top: 0.65, bottom: 0 }, lastValueVisible: false, priceLineVisible: false });
    
    // EMA overlays (Higher visibility)
    const ema20Series = chart.addLineSeries({ color: '#facc15', lineWidth: 2, title: 'EMA20' });
    const ema50Series = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, title: 'EMA50' });
    
    let lastEma20 = klines[0].close;
    let lastEma50 = klines[0].close;

    const calcEMA = (data, period) => {
        let k = 2/(period+1), emaArr = [];
        let ema = data[0].close;
        for(let i=0; i<data.length; i++) {
            ema = (parseFloat(data[i].close) - ema)*k + ema;
            emaArr.push({time: data[i].time, value: ema});
        }
        return { data: emaArr, last: ema };
    };
    
    const ema20 = calcEMA(klines, 20);
    const ema50 = calcEMA(klines, 50);
    lastEma20 = ema20.last;
    lastEma50 = ema50.last;

    candleSeries.setData(klines.map(k => ({time:k.time, open:k.open, high:k.high, low:k.low, close:k.close})));
    volumeSeries.setData(klines.map(k => ({time:k.time, value:k.value, color:k.color})));
    ema20Series.setData(ema20.data);
    ema50Series.setData(ema50.data);
    // Expose for toggleAdvOverlay()
    window._advEma20 = ema20Series;
    window._advEma50 = ema50Series;
    // Sync toggle button states to on
    ['ovr-ema20','ovr-ema50'].forEach(id => document.getElementById(id)?.classList.add('active'));
    document.getElementById('ovr-heatmap')?.classList.remove('active');

    
    if (isCrypto) {
        // Close any previous kline socket before opening a new one
        if (window.activeBinanceWS) {
            try { window.activeBinanceWS.close(); } catch(e) {}
            window.activeBinanceWS = null;
        }
        const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
        window.activeBinanceWS = new WebSocket(wsUrl);
        window.activeBinanceWS.onerror = () => {};  // suppress noisy browser warning
        window.activeBinanceWS.onmessage = (e) => {
            const k = JSON.parse(e.data).k;
            const price = parseFloat(k.c);
            const tick = { time: Math.floor(k.t/1000), open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: price };
            
            candleSeries.update(tick);
            volumeSeries.update({ time: tick.time, value: parseFloat(k.v), color: tick.close >= tick.open ? '#26a69a' : '#ef5350' });
            
            // Live EMA Update
            lastEma20 = (price - lastEma20) * (2/21) + lastEma20;
            lastEma50 = (price - lastEma50) * (2/51) + lastEma50;
            ema20Series.update({ time: tick.time, value: lastEma20 });
            ema50Series.update({ time: tick.time, value: lastEma50 });
        };
    }
    
    const heatmapData = await fetchAPI(`/liquidity-history?ticker=${symbol.replace('USDT', '-USD')}`);
    if (heatmapData && heatmapData.data) {
        window.activeHeatmap = new HeatmapOverlay(chart, candleSeries);
        window.activeHeatmap.setData(heatmapData.data);
        
        // Initial state from UI
        // Default the advanced chart overlay to hidden unless activated by user
        window.activeHeatmap.canvas.style.display = 'none';
        
        const intensity = document.getElementById('heatmap-intensity');
        if (intensity) {
            window.activeHeatmap.setIntensity(parseFloat(intensity.value));
        }
    }

    const ro = new ResizeObserver(e => { if(e.length>0 && e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(container);
}

// Heatmap Helpers
window.toggleHeatmapOverlay = function() {
    const toggle = document.getElementById('heatmap-toggle');
    if (window.activeHeatmap) {
        const isVisible = toggle.checked;
        window.activeHeatmap.canvas.style.display = isVisible ? 'block' : 'none';
        if (isVisible) window.activeHeatmap.render();
    }
};

window.updateHeatmapIntensity = function(val) {
    if (window.activeHeatmap) {
        window.activeHeatmap.setIntensity(parseFloat(val));
    }
};

// TAB 2: Market Depth (Bids vs Asks) - Live WebSocket Integration
async function renderAdvPulse(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    
    container.innerHTML = `<div class="intel-card-inner" style="height:100%; display:flex; flex-direction:column;">
        <div id="pulse-chart" style="flex:1;"></div>
        <div class="legend-bar-institutional" style="display:flex; gap:1.5rem; padding:0.8rem; border-top:1px solid var(--border); background:${alphaColor(0.02)}; font-size:0.75rem;">
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; background:rgba(38,166,154,0.6); border-radius:50%; box-shadow:0 0 10px rgba(38,166,154,0.4)"></div>
                <span style="color:var(--text-dim)">SHORT LIQUIDATIONS</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <div style="width:12px; height:12px; background:rgba(239,83,80,0.6); border-radius:50%; box-shadow:0 0 10px rgba(239,83,80,0.4)"></div>
                <span style="color:var(--text-dim)">LONG LIQUIDATIONS</span>
            </div>
            <div style="margin-left:auto; color:var(--text-dim); opacity:0.8;">BUBBLE SIZE = MAGNITUDE ($M)</div>
        </div>
    </div>`;

    const chartContainer = document.getElementById('pulse-chart');
    const chart = LightweightCharts.createChart(chartContainer, {
        layout: { background: { color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b' }, textColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#9ca3af', fontSize: 11, fontFamily: 'Inter' },
        grid: { vertLines: { color: alphaColor(0.02) }, horzLines: { color: alphaColor(0.02) } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { borderColor: alphaColor(0.1), timeVisible: true }
    });

    const candleSeries = chart.addCandlestickSeries({ upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444' });
    
    // Fetch Data
    const interval = document.getElementById('adv-interval')?.value || '1h';
    const isCrypto = symbol.toUpperCase().includes('USDT') || symbol.toUpperCase().includes('BTC');
    const klines = isCrypto ? await fetchBinanceKlines(symbol, interval, 300) : await fetchAPI(`/equity-klines?symbol=${symbol}&interval=${interval}`);
    const pulseData = await fetchAPI(`/liquidation-map?symbol=${symbol}`);

    if (klines && klines.length > 0) {
        candleSeries.setData(klines.map(k => ({time:k.time, open:k.open, high:k.high, low:k.low, close:k.close})));
        
        // Map Liquidations as Markers (Bubbles)
        const markers = [];
        if (Array.isArray(pulseData)) {
            pulseData.forEach(liq => {
                const color = liq.side === 'buy' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
                const size = Math.max(1, Math.min(3, Math.floor(liq.size / 0.5))); // 1, 2, or 3
                markers.push({
                    time: liq.time,
                    position: liq.side === 'buy' ? 'belowBar' : 'aboveBar',
                    color: color,
                    shape: 'circle',
                    text: size >= 2 ? `${liq.size}M` : '', // Show text for larger pulse events
                    size: size
                });
            });
        }
        candleSeries.setMarkers(markers.sort((a,b) => a.time - b.time));
    }

    const ro = new ResizeObserver(e => { if(e.length>0 && e[0].target===chartContainer) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(chartContainer);
}

// ─── Canvas 2D Orderbook Fallback ────────────────────────────────────────────
// Renders when WebGL context limit is hit. Full-featured live 2D orderbook chart.
function renderDepth2DFallback(container, symbol) {
    const H = 520;
    const LEVELS = 25;

    container.innerHTML = `
        <div style="position:relative;width:100%;height:${H}px;background:#050508;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;">
            <!-- Header -->
            <div style="display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid ${alphaColor(0.06)};flex-shrink:0;">
                <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;color:#7dd3fc;">ORDERBOOK DEPTH — ${symbol.replace('USDT','/USDT')}</span>
                <span id="depth2d-live" style="font-size:0.5rem;color:#22c55e;animation:pulse-live 1.5s infinite;">● LIVE</span>
                <span style="font-size:0.45rem;font-weight:900;padding:2px 8px;border-radius:100px;background:rgba(148,163,184,0.1);color:#94a3b8;letter-spacing:1px;margin-left:auto;">CANVAS 2D MODE</span>
                <span id="depth2d-spread" style="font-size:0.55rem;color:${alphaColor(0.35)};font-family:'JetBrains Mono',monospace;"></span>
            </div>
            <!-- Legend -->
            <div style="display:flex;gap:20px;padding:6px 18px;flex-shrink:0;">
                <span style="font-size:0.5rem;color:#26a69a;">■ BIDS (Cumulative)</span>
                <span style="font-size:0.5rem;color:#ef5350;">■ ASKS (Cumulative)</span>
            </div>
            <!-- Canvas -->
            <div style="flex:1;position:relative;padding:8px 18px 12px;">
                <canvas id="depth2d-canvas" role="img" aria-label="2D orderbook depth chart fallback" style="width:100%;height:100%;display:block;"></canvas>
            </div>
        </div>`;

    const canvas2d = document.getElementById('depth2d-canvas');
    if (!canvas2d) return;

    function sizeCanvas() {
        const rect = canvas2d.parentElement.getBoundingClientRect();
        canvas2d.width  = Math.floor(rect.width);
        canvas2d.height = Math.floor(rect.height);
    }
    sizeCanvas();

    const ctx2d = canvas2d.getContext('2d');

    // Shared state — updated by WS
    let _rawBids = [], _rawAsks = [], _rafId = null;

    function draw(rawBids, rawAsks) {
        const W2 = canvas2d.width, H2 = canvas2d.height;
        ctx2d.clearRect(0, 0, W2, H2);

        const n = Math.min(LEVELS, rawBids.length, rawAsks.length);
        if (n < 2) return;

        // Build cumulative depth arrays
        let bidCum = 0, askCum = 0;
        const bids = rawBids.slice(0, n).map(b => { bidCum += parseFloat(b[1]); return { p: parseFloat(b[0]), c: bidCum }; });
        const asks = rawAsks.slice(0, n).map(a => { askCum += parseFloat(a[1]); return { p: parseFloat(a[0]), c: askCum }; });
        const maxDepth = Math.max(bidCum, askCum, 1);

        const BAR_H      = Math.max(6, Math.floor((H2 - 10) / n) - 2);
        const MID_X      = Math.floor(W2 / 2);
        const MAX_BAR_W  = MID_X - 60;
        const PRICE_PAD  = 55;

        // Grid lines
        ctx2d.strokeStyle = alphaColor(0.04);
        ctx2d.lineWidth = 1;
        for (let g = 1; g <= 4; g++) {
            const gx = MID_X - (MAX_BAR_W * g / 4);
            ctx2d.beginPath(); ctx2d.moveTo(gx, 0); ctx2d.lineTo(gx, H2); ctx2d.stroke();
            const gx2 = MID_X + (MAX_BAR_W * g / 4);
            ctx2d.beginPath(); ctx2d.moveTo(gx2, 0); ctx2d.lineTo(gx2, H2); ctx2d.stroke();
        }

        // Centre divider
        ctx2d.strokeStyle = 'rgba(0,242,255,0.2)';
        ctx2d.lineWidth = 1;
        ctx2d.beginPath(); ctx2d.moveTo(MID_X, 0); ctx2d.lineTo(MID_X, H2); ctx2d.stroke();

        bids.forEach((b, i) => {
            const barW  = Math.floor((b.c / maxDepth) * MAX_BAR_W);
            const y     = i * (BAR_H + 2) + 4;
            const t     = b.c / maxDepth;
            const alpha = 0.25 + t * 0.65;

            // Bar — bids go LEFT from centre
            const grad = ctx2d.createLinearGradient(MID_X, 0, MID_X - barW, 0);
            grad.addColorStop(0,   `rgba(38,166,154,${alpha})`);
            grad.addColorStop(1,   `rgba(38,166,154,${alpha * 0.3})`);
            ctx2d.fillStyle = grad;
            ctx2d.beginPath();
            ctx2d.roundRect(MID_X - barW, y, barW, BAR_H, 2);
            ctx2d.fill();

            // Price label
            ctx2d.fillStyle = alphaColor(0.5);
            ctx2d.font = `${Math.max(8, BAR_H - 4)}px JetBrains Mono, monospace`;
            ctx2d.textAlign = 'left';
            ctx2d.fillText(b.p.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 1}), MID_X - barW - PRICE_PAD, y + BAR_H - 3);
        });

        asks.forEach((a, i) => {
            const barW  = Math.floor((a.c / maxDepth) * MAX_BAR_W);
            const y     = i * (BAR_H + 2) + 4;
            const t     = a.c / maxDepth;
            const alpha = 0.25 + t * 0.65;

            // Bar — asks go RIGHT from centre
            const grad = ctx2d.createLinearGradient(MID_X, 0, MID_X + barW, 0);
            grad.addColorStop(0,   `rgba(239,83,80,${alpha})`);
            grad.addColorStop(1,   `rgba(239,83,80,${alpha * 0.3})`);
            ctx2d.fillStyle = grad;
            ctx2d.beginPath();
            ctx2d.roundRect(MID_X, y, barW, BAR_H, 2);
            ctx2d.fill();

            // Price label
            ctx2d.fillStyle = alphaColor(0.5);
            ctx2d.font = `${Math.max(8, BAR_H - 4)}px JetBrains Mono, monospace`;
            ctx2d.textAlign = 'right';
            ctx2d.fillText(a.p.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 1}), MID_X + barW + PRICE_PAD, y + BAR_H - 3);
        });

        // Spread label update
        if (rawBids[0] && rawAsks[0]) {
            const bestBid = parseFloat(rawBids[0][0]);
            const bestAsk = parseFloat(rawAsks[0][0]);
            const spread  = (bestAsk - bestBid).toFixed(2);
            const pct     = ((bestAsk - bestBid) / bestBid * 100).toFixed(3);
            const el = document.getElementById('depth2d-spread');
            if (el) el.textContent = `SPREAD $${spread} (${pct}%)`;
        }
    }

    // ── Data sources (mirror renderAdvDepth logic) ───────────────────────────
    const isEquity = ['MSTR', 'COIN', 'MARA', 'RIOT', 'CLSK'].includes(symbol.toUpperCase());

    if (isEquity) {
        fetchAPI(`/liquidity-history?ticker=${symbol}`).then(history => {
            if (history && history.data && history.data.length > 0) {
                const latest = history.data[history.data.length - 1];
                _rawBids = Object.entries(latest.bids || {}).map(([p, v]) => [parseFloat(p), parseFloat(v)]).sort((a, b) => b[0] - a[0]);
                _rawAsks = Object.entries(latest.asks || {}).map(([p, v]) => [parseFloat(p), parseFloat(v)]).sort((a, b) => a[0] - b[0]);
                draw(_rawBids, _rawAsks);
            }
        }).catch(() => {});
    } else {
        let lastRebuild = 0;
        window.BinanceSocketManager.subscribe(symbol, 'depth20@100ms', (data) => {
            if (!data.bids || !data.asks) return;
            const now = Date.now();
            if (now - lastRebuild < 250) return;
            lastRebuild = now;
            _rawBids = [...data.bids].sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
            _rawAsks = [...data.asks].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
            if (_rafId) cancelAnimationFrame(_rafId);
            _rafId = requestAnimationFrame(() => draw(_rawBids, _rawAsks));
        });
    }

    // Resize observer
    const ro2d = new ResizeObserver(() => { sizeCanvas(); draw(_rawBids, _rawAsks); });
    ro2d.observe(canvas2d.parentElement);

    // Expose to cleanupAdvChart
    window.activeDepth3D = { animId: null, renderer: null, _ref: { alive: false }, _ro: ro2d, _rafId: () => { if (_rafId) cancelAnimationFrame(_rafId); } };
}

async function renderAdvDepth(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if (!container) return;

    container.innerHTML = `
        <div style="position:relative; width:100%; height:520px; background:#050508; border-radius:12px; overflow:hidden;">
            <canvas id="depth3d-canvas" aria-hidden="true" style="width:100%; height:100%; display:block;"></canvas>
            <div style="position:absolute; top:14px; left:18px; display:flex; gap:16px; align-items:center; pointer-events:none;">
                <span style="font-size:0.6rem; font-weight:900; letter-spacing:2px; color:#7dd3fc;">3D ORDERBOOK TOPOLOGY</span>
                <span style="display:flex;align-items:center;gap:5px;font-size:0.6rem;color:#26a69a;">
                    <span style="width:8px;height:8px;background:#26a69a;border-radius:1px;display:inline-block;box-shadow:0 0 6px #26a69a;"></span> BID DEPTH
                </span>
                <span style="display:flex;align-items:center;gap:5px;font-size:0.6rem;color:#ef5350;">
                    <span style="width:8px;height:8px;background:#ef5350;border-radius:1px;display:inline-block;box-shadow:0 0 6px #ef5350;"></span> ASK DEPTH
                </span>
                <span id="depth-spread-label" style="font-size:0.55rem;color:${alphaColor(0.35)};margin-left:8px;"></span>
            </div>
            <div style="position:absolute;bottom:14px;right:18px;font-size:0.55rem;color:${alphaColor(0.25)};pointer-events:none;">DRAG TO ROTATE • SCROLL TO ZOOM</div>
        </div>`;

    const canvas = document.getElementById('depth3d-canvas');
    if (!canvas || typeof THREE === 'undefined') {
        container.innerHTML = '<div class="error-msg">WebGL renderer unavailable.</div>';
        return;
    }

    // Check WebGL availability before touching THREE.WebGLRenderer
    const testCtx = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (!testCtx) {
        // ── Canvas 2D Fallback Orderbook ─────────────────────────────────────
        // WebGL context exhausted — render a live 2D horizontal depth chart instead
        renderDepth2DFallback(container, symbol);
        return;
    }

    // ── Three.js Scene ──────────────────────────────────────────────────────
    const W = container.clientWidth, H = 520;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050508, 1);
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.018);

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);

    // ── Lighting ─────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x112244, 0.8));
    const hemi = new THREE.HemisphereLight(0x223366, 0x050508, 0.6);
    scene.add(hemi);
    const dirLight = new THREE.DirectionalLight(0x99ccff, 1.4);
    dirLight.position.set(15, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);
    // Subtle fill from below (makes bars pop)
    const fillLight = new THREE.DirectionalLight(0x004466, 0.5);
    fillLight.position.set(-10, -5, -15);
    scene.add(fillLight);

    // ── Floor plane ───────────────────────────────────────────────────────
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x080c14, metalness: 0.3, roughness: 0.9
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid overlay
    const grid = new THREE.GridHelper(70, 35, 0x0d1f33, 0x0d1f33);
    grid.position.y = 0.02;
    scene.add(grid);

    // ── Spread divider plane ──────────────────────────────────────────────
    const divGeo = new THREE.PlaneGeometry(0.15, 22);
    const divMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.25 });
    const divider = new THREE.Mesh(divGeo, divMat);
    divider.rotation.y = Math.PI / 2;
    divider.position.y = 11;
    scene.add(divider);

    // ── Inline orbit controls ─────────────────────────────────────────────
    let isDragging = false, lastMouse = { x: 0, y: 0 }, lastActivity = Date.now();
    let theta = -0.45, phi = 0.62, radius = 42;
    function updateCamera() {
        camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(0, 4, 0);
    }
    updateCamera();

    canvas.addEventListener('mousedown', e => { isDragging = true; lastMouse = { x: e.clientX, y: e.clientY }; lastActivity = Date.now(); });
    canvas.addEventListener('mouseup',   () => { isDragging = false; });
    canvas.addEventListener('mouseleave',() => { isDragging = false; });
    canvas.addEventListener('mousemove', e => {
        if (!isDragging) return;
        theta -= (e.clientX - lastMouse.x) * 0.007;
        phi = Math.max(0.15, Math.min(1.45, phi - (e.clientY - lastMouse.y) * 0.007));
        lastMouse = { x: e.clientX, y: e.clientY };
        lastActivity = Date.now();
        updateCamera();
    });
    canvas.addEventListener('wheel', e => {
        radius = Math.max(15, Math.min(90, radius + e.deltaY * 0.05));
        lastActivity = Date.now();
        updateCamera();
    }, { passive: true });

    // ── Bar chart builder ─────────────────────────────────────────────────
    // Returns a THREE.Group of BoxGeometry bars for one side of the book
    const BAR_COUNT  = 30;   // levels to show
    const BAR_WIDTH  = 0.62; // x width of each bar
    const BAR_GAP    = 0.12; // gap between bars
    const BAR_DEPTH  = 2.8;  // z depth of bar (fixed)
    const SPREAD_GAP = 1.6;  // gap between bid/ask clusters

    function buildSideBars(levels, side) {
        // levels: array of cumulative depths (ascending for asks, descending from mid for bids)
        const n = Math.min(levels.length, BAR_COUNT);
        if (n < 1) return null;
        const maxLevel = levels[n - 1] || 1;
        const group = new THREE.Group();

        for (let i = 0; i < n; i++) {
            const cumDepth = levels[i];
            const heightNorm = cumDepth / maxLevel;             // 0‒1
            const barH = Math.max(0.15, heightNorm * 20);       // 0.15–20 units

            // X position: bid bars go left (negative x), ask bars go right (positive x)
            const slot    = i * (BAR_WIDTH + BAR_GAP);
            const xPos    = side === 'bid'
                ? -(SPREAD_GAP / 2) - slot - BAR_WIDTH / 2
                :  (SPREAD_GAP / 2) + slot + BAR_WIDTH / 2;
            const yPos    = barH / 2;  // sit on floor

            // Colour intensity scales with normalised height
            // Bids: dark teal → bright cyan-green
            // Asks: dark red  → bright red-orange
            const t = Math.pow(heightNorm, 0.5);  // sqrt for better gradient spread
            let barColor, emissiveColor, emissiveInt;
            if (side === 'bid') {
                // mix #0d3330 → #26a69a
                barColor      = new THREE.Color().setHSL(0.49, 0.75, 0.08 + t * 0.28);
                emissiveColor = new THREE.Color(0x26a69a);
                emissiveInt   = 0.05 + t * 0.45;
            } else {
                // mix #3a0d0d → #ef5350
                barColor      = new THREE.Color().setHSL(0.01, 0.85, 0.08 + t * 0.28);
                emissiveColor = new THREE.Color(0xef5350);
                emissiveInt   = 0.05 + t * 0.45;
            }

            const geo = new THREE.BoxGeometry(BAR_WIDTH, barH, BAR_DEPTH);
            const mat = new THREE.MeshStandardMaterial({
                color:            barColor,
                emissive:         emissiveColor,
                emissiveIntensity: emissiveInt,
                metalness:        0.55,
                roughness:        0.35,
                transparent:      true,
                opacity:          0.72 + t * 0.26
            });
            const bar = new THREE.Mesh(geo, mat);
            bar.position.set(xPos, yPos, 0);
            bar.castShadow = true;
            group.add(bar);

            // Top-cap glow plane (makes the bar top feel lit)
            if (heightNorm > 0.3) {
                const capGeo = new THREE.PlaneGeometry(BAR_WIDTH + 0.05, BAR_DEPTH + 0.05);
                const capMat = new THREE.MeshBasicMaterial({
                    color: side === 'bid' ? 0x26a69a : 0xef5350,
                    transparent: true,
                    opacity: 0.12 + t * 0.22,
                    side: THREE.DoubleSide
                });
                const cap = new THREE.Mesh(capGeo, capMat);
                cap.rotation.x = -Math.PI / 2;
                cap.position.set(xPos, barH + 0.01, 0);
                group.add(cap);
            }
        }
        return group;
    }

    let bidGroup = null, askGroup = null;
    const spreadLabel = document.getElementById('depth-spread-label');

    function rebuildBars(rawBids, rawAsks) {
        if (bidGroup) { scene.remove(bidGroup); bidGroup.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); }
        if (askGroup) { scene.remove(askGroup); askGroup.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); }

        const n = Math.min(BAR_COUNT, rawBids.length, rawAsks.length);

        let bidCum = 0, askCum = 0;
        const bidLevels = rawBids.slice(0, n).map(b => { bidCum += parseFloat(b[1]); return bidCum; });
        const askLevels = rawAsks.slice(0, n).map(a => { askCum += parseFloat(a[1]); return askCum; });

        bidGroup = buildSideBars(bidLevels, 'bid');
        askGroup = buildSideBars(askLevels, 'ask');
        if (bidGroup) scene.add(bidGroup);
        if (askGroup) scene.add(askGroup);

        // Update spread label
        if (spreadLabel && rawBids.length && rawAsks.length) {
            const bestBid = parseFloat(rawBids[0][0]);
            const bestAsk = parseFloat(rawAsks[0][0]);
            const spread  = (bestAsk - bestBid).toFixed(2);
            const pct     = ((bestAsk - bestBid) / bestBid * 100).toFixed(3);
            spreadLabel.textContent = `SPREAD $${spread} (${pct}%)`;
        }
    }

    // ── Animation loop ────────────────────────────────────────────────────
    const animRef = { id: null };
    function animate() {
        animRef.id = requestAnimationFrame(animate);
        // Slow auto-rotate after 3s of inactivity
        if (!isDragging && Date.now() - lastActivity > 3000) {
            theta += 0.0015;
            updateCamera();
        }
        renderer.render(scene, camera);
    }
    animate();

    window.activeDepth3D = { animId: animRef.id, renderer, _ref: animRef };

    // ── Data source ───────────────────────────────────────────────────────
    const isEquity = ['MSTR', 'COIN', 'MARA', 'RIOT', 'CLSK'].includes(symbol.toUpperCase());

    if (isEquity) {
        try {
            const history = await fetchAPI(`/liquidity-history?ticker=${symbol}`);
            if (history && history.data && history.data.length > 0) {
                const latest = history.data[history.data.length - 1];
                const rawBids = Object.entries(latest.bids || {}).map(([p, v]) => [parseFloat(p), parseFloat(v)]).sort((a, b) => b[0] - a[0]);
                const rawAsks = Object.entries(latest.asks || {}).map(([p, v]) => [parseFloat(p), parseFloat(v)]).sort((a, b) => a[0] - b[0]);
                rebuildBars(rawBids, rawAsks);
            }
        } catch (e) { console.error('3D Depth fallback error:', e); }
    } else {
        // Throttle rebuilds — order book fires at 100ms, rebuilding every frame wastes GPU
        let lastRebuild = 0;
        window.BinanceSocketManager.subscribe(symbol, 'depth20@100ms', (data) => {
            if (!data.bids || !data.asks) return;
            const now = Date.now();
            if (now - lastRebuild < 250) return;  // max 4 rebuilds/s
            lastRebuild = now;
            const rawBids = [...data.bids].sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
            const rawAsks = [...data.asks].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
            rebuildBars(rawBids, rawAsks);
        });
    }

    // ── Resize handler ────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
        const w = container.clientWidth;
        renderer.setSize(w, H);
        camera.aspect = w / H;
        camera.updateProjectionMatrix();
    });
    ro.observe(container);
}

// TAB 3: Derivatives (Live CVD & Block Trades)

async function renderAdvDerivatives(symbol, interval) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    
    interval = '1m';
    const klines = await fetchBinanceKlines(symbol, interval, 100);
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b' }, textColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#d1d5db', fontFamily: 'JetBrains Mono' },
        timeScale: { borderColor: alphaColor(0.1), timeVisible: true }
    });
    
    const priceSeries = chart.addLineSeries({ color: alphaColor(0.7), lineWidth: 1, title: 'Price Action' });
    const cvdSeries = chart.addAreaSeries({ topColor: 'rgba(96,165,250,0.4)', bottomColor: 'rgba(96,165,250,0)', lineColor: '#60a5fa', lineWidth: 2, priceScaleId: 'left', title: 'Cumulative Volume Delta' });
    const blockSeries = chart.addHistogramSeries({ color: '#ef5350', priceScaleId: 'left_liq', scaleMargins: { top: 0.7, bottom: 0 }, title: 'Block Order Flux' });
    
    priceSeries.setData(klines.map(k=>({time:k.time, value:k.close})));
    
    // Initialize base CVD and Empty Blocks
    let runningCVD = 500000;
    let cvdData = [];
    let liqData = [];
    
    klines.forEach(k => {
        let delta = (k.close - k.open) * (k.volume || 1);
        runningCVD += delta;
        cvdData.push({ time: k.time, value: runningCVD });
        
        // Pseudo blocks for past history
        let blockVal = (Math.abs(k.close - k.open) / k.open > 0.005) ? Math.random() * 10 : 0;
        liqData.push({ time: k.time, value: blockVal, color: k.close < k.open ? '#26a69a' : '#ef5350' });
    });
    
    cvdSeries.setData(cvdData);
    blockSeries.setData(liqData);
    
    chart.priceScale('left').applyOptions({ visible: true, borderColor: alphaColor(0.1) });
    chart.priceScale('left_liq').applyOptions({ visible: false });
    
    // Binance aggTrade stream — crypto only; equity proxies have no Binance feed
    const isCryptoSym = symbol.toUpperCase().includes('USDT');
    if (isCryptoSym) {
        // LIVE WEBSOCKET AGGREGATOR
        let currentCandleStart = Math.floor(Date.now() / 60000) * 60;
        
        window.BinanceSocketManager.subscribe(symbol, 'aggTrade', (wsData) => {
            let ts = Math.floor(wsData.T / 1000);
            let qty = parseFloat(wsData.q);
            let price = parseFloat(wsData.p);
            let isSell = wsData.m;
            
            let candleTime = Math.floor(ts / 60) * 60;
            if(candleTime > currentCandleStart) currentCandleStart = candleTime;
            
            runningCVD += (isSell ? -qty : qty);
            cvdSeries.update({ time: currentCandleStart, value: runningCVD });
            
            if(qty > 5) {
                blockSeries.update({ time: ts, value: qty, color: isSell ? '#ef5350' : '#26a69a' });
            }
        });
    }
    
    const ro = new ResizeObserver(e => { if(e.length > 0 && e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(container);
}

// TAB 4: Comparative (Norm 0%)
async function renderAdvComparative(interval) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;

    const sym = document.getElementById('adv-symbol').value;
    
    // Phase 10: Dynamic Benchmarking (Active Asset vs BTC)
    const [activeData, btcData] = await Promise.all([
        fetchBinanceKlines(sym, interval, 100),
        fetchBinanceKlines('BTCUSDT', interval, 100)
    ]);
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b' }, textColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#d1d5db', fontFamily: 'JetBrains Mono' },
        timeScale: { timeVisible: true }
    });
    const norm = (data) => {
        if(!data.length) return [];
        let start = data[0].close;
        return data.map(d => ({time: d.time, value: ((d.close - start)/start)*100}));
    };
    chart.addLineSeries({color:'#facc15', lineWidth:2, title: sym}).setData(norm(activeData));
    chart.addLineSeries({color:alphaColor(0.4), lineWidth:1, title: 'BTC Benchmark'}).setData(norm(btcData));
    
    chart.applyOptions({ localization: { priceFormatter: p => p.toFixed(2) + '%' } });
    const ro = new ResizeObserver(e => { if(e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(container);
}

async function renderAdvCVD(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    container.innerHTML = '<div class="loader" style="margin:2rem auto"></div>';
    try {
        const data = await fetchAPI(`/onchain?symbol=${symbol}`);
        if(!data) { container.innerHTML = '<div class="error-msg">Auth Required</div>'; return; }
        
        container.innerHTML = '';
        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b' }, textColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#d1d5db', fontFamily: 'JetBrains Mono' },
            grid: { vertLines: { color: alphaColor(0.03) }, horzLines: { color: alphaColor(0.03) } }
        });
        const cvdSeries = chart.addAreaSeries({ topColor: 'rgba(38,166,154,0.4)', bottomColor: 'rgba(239,83,80,0.4)', lineColor: '#26a69a', lineWidth: 2, title: 'Cumulative Volume Delta' });
        cvdSeries.setData(data.map(d=>({time: d.time, value: d.cvd})));
        
        const ro = new ResizeObserver(e => { if(e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
        ro.observe(container);
        chart.timeScale().fitContent();
    } catch(e) { container.innerHTML = '<div class="error-msg">Fetch failed.</div>'; }
}

async function renderAdvExchange(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    container.innerHTML = '<div class="loader" style="margin:2rem auto"></div>';
    try {
        const data = await fetchAPI(`/onchain?symbol=${symbol}`);
        if(!data) { container.innerHTML = '<div class="error-msg">Auth Required</div>'; return; }
        
        container.innerHTML = '';
        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b' }, textColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#d1d5db', fontFamily: 'JetBrains Mono' },
            grid: { vertLines: { color: alphaColor(0.03) }, horzLines: { color: alphaColor(0.03) } }
        });
        const exSeries = chart.addHistogramSeries({ color: '#facc15', title: 'Net Position Change' });
        exSeries.setData(data.map(d=>({
            time: d.time, 
            value: d.exch_flow, 
            color: d.exch_flow > 0 ? '#ef5350' : '#26a69a' 
        })));
        
        const ro = new ResizeObserver(e => { if(e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
        ro.observe(container);
        chart.timeScale().fitContent();
    } catch(e) { container.innerHTML = '<div class="error-msg">Fetch failed.</div>'; }
}

window.toggleAdvOverlay = function(type) {
    const btn = document.getElementById(`ovr-${type}`);
    const isActive = btn?.classList.contains('active');
    if (type === 'ema20' && window._advEma20) {
        window._advEma20.applyOptions({ visible: !isActive });
        btn?.classList.toggle('active');
    } else if (type === 'ema50' && window._advEma50) {
        window._advEma50.applyOptions({ visible: !isActive });
        btn?.classList.toggle('active');
    } else if (type === 'heatmap') {
        const hm = window.activeHeatmap;
        const legend = document.getElementById('heatmap-legend-overlay');
        if (hm) {
            const show = !isActive;
            hm.canvas.style.display = show ? 'block' : 'none';
            if (legend) legend.style.display = show ? 'flex' : 'none';
            if (show) {
                hm.resize();
                hm.render();
            }
            btn?.classList.toggle('active');
        } else {
            // No heatmap data available
            if (btn) btn.style.opacity = '0.35';
            setTimeout(() => { if (btn) btn.style.opacity = ''; }, 1200);
        }
    }
};

const dispatchAdvTab = () => {
    const sym = document.getElementById('adv-symbol').value;
    const int = document.getElementById('adv-interval').value;
    if(currentAdvTab === 'overview') renderAdvOverview(sym, int);
    else if(currentAdvTab === 'pulse') renderAdvPulse(sym);
    else if(currentAdvTab === 'depth') renderAdvDepth(sym);
    else if(currentAdvTab === 'derivatives') renderAdvDerivatives(sym, int);
    else if(currentAdvTab === 'comparative') renderAdvComparative(int);
    else if(currentAdvTab === 'cvd') renderAdvCVD(sym);
    else if(currentAdvTab === 'exchange') renderAdvExchange(sym);
    else if(currentAdvTab === 'funding') renderAdvFundingHeatmap();
    else if(currentAdvTab === 'tape-imbalance') renderAdvTapeImbalance(sym);
    else if(currentAdvTab === 'options-surface') renderAdvOptionsSurface(sym);
};

// ─── Funding Rate Heatmap ────────────────────────────────────────────────────
async function renderAdvFundingHeatmap() {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if (!container) return;
    container.innerHTML = `<div style="padding:1.5rem; width:100%; box-sizing:border-box;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#7dd3fc;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">bolt</span>PERPETUAL FUNDING RATE HEATMAP — 24H ROLLING</span>
            <div style="display:flex;gap:16px;font-size:0.55rem;color:var(--text-dim);">
                <span style="color:#ef5350;">■ NEGATIVE (Shorts Pay)</span>
                <span style="color:${alphaColor(0.2)};">■ NEUTRAL</span>
                <span style="color:#26a69a;">■ POSITIVE (Longs Pay)</span>
            </div>
        </div>
        <div id="funding-grid" style="display:grid;gap:3px;"></div>
    </div>`;
    try {
        const data = await fetchAPI('/funding-rates');
        if (!data || !data.rows) { container.innerHTML = '<div class="error-msg">Funding data unavailable.</div>'; return; }
        const grid = document.getElementById('funding-grid');
        const cols = data.hours.length;
        grid.style.gridTemplateColumns = `80px repeat(${cols}, 1fr)`;
        // Header row
        grid.innerHTML += `<div style="font-size:0.5rem;color:var(--text-dim);display:flex;align-items:center;">ASSET</div>`;
        data.hours.forEach(h => {
            grid.innerHTML += `<div style="font-size:0.45rem;color:var(--text-dim);text-align:center;">${h}h</div>`;
        });
        data.rows.forEach(row => {
            grid.innerHTML += `<div style="font-size:0.65rem;font-weight:900;color:white;display:flex;align-items:center;padding:2px 0;">${row.asset}</div>`;
            row.rates.forEach(rate => {
                const intensity = Math.min(1, Math.abs(rate) / 0.05);
                const color = rate > 0
                    ? `rgba(38,166,154,${0.15 + intensity * 0.75})`
                    : rate < 0
                    ? `rgba(239,83,80,${0.15 + intensity * 0.75})`
                    : alphaColor(0.04);
                const display = rate > 0 ? `+${(rate * 100).toFixed(3)}%` : `${(rate * 100).toFixed(3)}%`;
                grid.innerHTML += `<div title="${display}" style="height:28px;background:${color};border-radius:3px;cursor:default;transition:all 0.2s;" onmouseenter="this.style.opacity='0.7'" onmouseleave="this.style.opacity='1'"></div>`;
            });
        });
    } catch(e) { console.error('Funding heatmap error:', e); }
}

// ─── Tape Imbalance Histogram ────────────────────────────────────────────────
function renderAdvTapeImbalance(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if (!container) return;

    const BUCKET_COUNT = 30;
    const BUCKET_MS    = 5000;   // 5-second buckets — shows data within 5s of opening

    // Pre-seed with tiny noise so the chart is never flat/invisible on first render
    const seed = (i) => (Math.sin(i * 2.3) * 0.4 + Math.cos(i * 1.7) * 0.2).toFixed(3) * 1;
    const buckets = Array.from({ length: BUCKET_COUNT }, (_, i) => seed(i));
    const labels  = Array.from({ length: BUCKET_COUNT }, (_, i) => `-${(BUCKET_COUNT - 1 - i) * 5}s`);

    container.innerHTML = `
        <div style="padding:1.5rem;height:100%;box-sizing:border-box;display:flex;flex-direction:column;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-shrink:0;">
                <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#7dd3fc;">
                    <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">bar_chart</span>
                    LIVE TAPE IMBALANCE — ${symbol.replace('USDT','/USDT')} · 5S BUCKETS
                </span>
                <div style="display:flex;align-items:center;gap:14px;">
                    <span id="tape-running-label" style="font-size:0.6rem;color:var(--text-dim);font-family:'JetBrains Mono'">Accumulating...</span>
                    <span id="tape-live-badge" style="font-size:0.55rem;color:#26a69a;animation:pulse 1.5s infinite;">● LIVE</span>
                </div>
            </div>
            <div style="flex:1;min-height:360px;position:relative;">
                <canvas id="tape-canvas" role="img" aria-label="Trade tape imbalance heatmap"></canvas>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:10px;flex-shrink:0;">
                <span style="font-size:0.55rem;color:rgba(38,166,154,0.8);">■ Buy Pressure</span>
                <span style="font-size:0.55rem;color:var(--text-dim);">Positive = more buys than sells in bucket</span>
                <span style="font-size:0.55rem;color:rgba(239,83,80,0.8);">■ Sell Pressure</span>
            </div>
        </div>`;

    const canvas = document.getElementById('tape-canvas');
    if (!canvas) return;

    // Explicitly size canvas to fill its parent
    const wrapper = canvas.parentElement;
    canvas.style.width  = '100%';
    canvas.style.height = '100%';

    const getBarColors = (data) => data.map(v =>
        v > 0.5  ? 'rgba(38,166,154,0.85)' :
        v > 0    ? 'rgba(38,166,154,0.5)'  :
        v < -0.5 ? 'rgba(239,83,80,0.85)'  :
                   'rgba(239,83,80,0.5)');

    const chart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Buy/Sell Imbalance',
                data: [...buckets],
                backgroundColor: getBarColors(buckets),
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 200 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: c => {
                            const v = c.raw;
                            return `Imbalance: ${v > 0 ? '+' : ''}${parseFloat(v).toFixed(3)} ${symbol.replace('USDT','')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: alphaColor(0.03) },
                    ticks: { color: alphaColor(0.3), font: { size: 8, family: 'JetBrains Mono' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }
                },
                y: {
                    grid: { color: alphaColor(0.05) },
                    ticks: { color: alphaColor(0.4), font: { family: 'JetBrains Mono', size: 9 } },
                    title: { display: true, text: `Net Volume (${symbol.replace('USDT','')})`, color: alphaColor(0.25), font: { size: 9 } }
                }
            }
        }
    });

    // Equity proxies have no Binance aggTrade feed — show a friendly notice
    const wsSymbol = symbol.toUpperCase().endsWith('USDT')
        ? symbol.toUpperCase()
        : null;

    if (!wsSymbol) {
        const runningLabel = document.getElementById('tape-running-label');
        const liveBadge = document.getElementById('tape-live-badge');
        if (runningLabel) { runningLabel.textContent = 'Live tape requires a crypto pair'; runningLabel.style.color = 'var(--text-dim)'; }
        if (liveBadge) { liveBadge.textContent = '○ N/A'; liveBadge.style.color = 'var(--text-dim)'; liveBadge.style.animation = 'none'; }
        return;
    }

    let buyVol = 0, sellVol = 0, tradeCount = 0;
    let lastBucket = Date.now();
    const runningLabel = document.getElementById('tape-running-label');

    window.BinanceSocketManager.subscribe(wsSymbol, 'aggTrade', trade => {
        const vol = parseFloat(trade.q || 0);
        tradeCount++;
        if (trade.m) sellVol += vol;   // isBuyerMaker → taker is seller
        else          buyVol  += vol;

        // Update live running label every trade
        const net = buyVol - sellVol;
        if (runningLabel) {
            const color = net >= 0 ? '#26a69a' : '#ef5350';
            runningLabel.style.color = color;
            runningLabel.textContent = `Current bucket: ${net >= 0 ? '+' : ''}${net.toFixed(3)} (${tradeCount} trades)`;
        }

        // Flush bucket every BUCKET_MS
        const now = Date.now();
        if (now - lastBucket >= BUCKET_MS) {
            const imbalance = parseFloat((buyVol - sellVol).toFixed(4));
            buckets.shift();
            buckets.push(imbalance);
            chart.data.datasets[0].data = [...buckets];
            chart.data.datasets[0].backgroundColor = getBarColors(buckets);
            chart.update('none');
            buyVol = 0; sellVol = 0; tradeCount = 0;
            lastBucket = now;
        }
    });
}


// ─── Options Volatility Surface ──────────────────────────────────────────────
async function renderAdvOptionsSurface(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if (!container) return;

    const currency = symbol.replace('USDT','').replace('-USD','');

    container.innerHTML = `
        <div style="position:relative;width:100%;height:520px;background:#050508;border-radius:12px;overflow:hidden;">
            <canvas id="volsurf-canvas" role="img" aria-label="Implied volatility surface 3D chart" style="width:100%;height:100%;display:block;"></canvas>

            <!-- Top-left: title + source badge -->
            <div style="position:absolute;top:14px;left:18px;pointer-events:none;display:flex;align-items:center;gap:14px;">
                <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#7dd3fc;">
                    <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">stacked_line_chart</span>
                    IMPLIED VOLATILITY SURFACE — ${currency}
                </span>
                <span id="iv-source-badge" style="font-size:0.55rem;color:${alphaColor(0.3)};animation:pulse 2s infinite;">● LOADING...</span>
            </div>

            <!-- Top-right: spot price + timestamp -->
            <div id="iv-stats-bar" style="position:absolute;top:14px;right:18px;display:flex;gap:16px;pointer-events:none;"></div>

            <!-- Bottom-left: axis labels + controls hint -->
            <div style="position:absolute;bottom:52px;left:18px;pointer-events:none;display:flex;flex-direction:column;gap:5px;">
                <span style="font-size:0.72rem;color:${alphaColor(0.32)};letter-spacing:1.5px;">← MONEYNESS (% of spot) →</span>
                <span style="font-size:0.72rem;color:${alphaColor(0.32)};letter-spacing:1.5px;">← DAYS TO EXPIRY →</span>
            </div>
            <div style="position:absolute;bottom:14px;left:18px;pointer-events:none;">
                <span style="font-size:0.5rem;color:${alphaColor(0.2)};">DRAG TO ROTATE &nbsp;•&nbsp; SCROLL TO ZOOM &nbsp;•&nbsp; HOVER FOR IV</span>
            </div>

            <!-- Bottom-centre: per-expiry ATM IV strip (populated after data loads) -->
            <div id="iv-atm-strip" style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);pointer-events:none;display:flex;gap:10px;align-items:flex-end;"></div>

            <!-- Right-side vertical colourbar (populated after data loads) -->
            <div id="iv-colourbar" style="position:absolute;top:46px;right:14px;width:56px;display:flex;flex-direction:column;align-items:center;gap:0;pointer-events:none;">
                <!-- ticks injected by JS -->
            </div>
        </div>`;

    const canvas = document.getElementById('volsurf-canvas');
    if (!canvas || typeof THREE === 'undefined') {
        container.querySelector('div').innerHTML += '<div style="color:#ef4444;text-align:center;padding:2rem;">WebGL unavailable</div>';
        return;
    }

    // ── Fetch live IV surface ──────────────────────────────────────────────────
    let surfaceData = null;
    try {
        const ticker = symbol.includes('USDT') ? symbol.replace('USDT', '-USD') : symbol;
        surfaceData = await fetchAPI(`/volatility-surface?ticker=${ticker}`);
    } catch(e) {}

    const sourceBadge = document.getElementById('iv-source-badge');
    const statsBar = document.getElementById('iv-stats-bar');

    if (!surfaceData || surfaceData.error) {
        if (sourceBadge) { sourceBadge.textContent = '⚠ UNAVAILABLE'; sourceBadge.style.color = '#ef4444'; sourceBadge.style.animation = 'none'; }
        return;
    }

    const isLive = surfaceData.source === 'deribit_live';
    if (sourceBadge) {
        sourceBadge.textContent = isLive ? `● LIVE · DERIBIT · ${surfaceData.point_count} OPTIONS` : '● PARAMETRIC MODEL';
        sourceBadge.style.color = isLive ? '#22c55e' : '#facc15';
        sourceBadge.style.animation = isLive ? 'pulse 2s infinite' : 'none';
    }
    if (statsBar && isLive && surfaceData.underlying) {
        statsBar.innerHTML = `
            <div style="font-size:0.55rem;color:var(--text-dim);">Spot: <span style="color:white;font-weight:700;">$${surfaceData.underlying.toLocaleString('en-US',{maximumFractionDigits:0})}</span></div>
            <div style="font-size:0.55rem;color:var(--text-dim);">Updated: <span style="color:${alphaColor(0.5)};">${surfaceData.timestamp ? surfaceData.timestamp.slice(11,16) + ' UTC' : '--'}</span></div>`;
    }

    const moneyAxis    = surfaceData.moneyness_axis;     // length 20
    const expiryLabels  = surfaceData.expiry_labels;      // length 6
    const ivGrid        = surfaceData.iv_grid;            // ivGrid[strike][expiry]
    const xS = moneyAxis.length;
    const zS = expiryLabels.length;

    // ── Compute real IV range ─────────────────────────────────────────────────
    const allIVs = ivGrid.flat().filter(v => v > 0);
    const minIV  = Math.min(...allIVs);
    const maxIV  = Math.max(...allIVs);

    // ── Populate right-side colourbar ─────────────────────────────────────────
    // Colour function matching the vertex shader below: blue→green→yellow→red
    function ivToHex(t) {
        const r = t < 0.5 ? t * 2 * 0.2              : 0.2 + (t - 0.5) * 2 * 0.8;
        const g = t < 0.5 ? 0.2 + t * 2 * 0.6        : 0.8 - (t - 0.5) * 2 * 0.6;
        const b = t < 0.5 ? 0.8 - t * 2 * 0.6        : 0.2;
        const toHex = c => Math.round(c * 255).toString(16).padStart(2,'0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    const colourbar = document.getElementById('iv-colourbar');
    if (colourbar) {
        // Label at top
        colourbar.innerHTML = `<span style="font-size:0.7rem;color:${alphaColor(0.5)};letter-spacing:0.5px;margin-bottom:4px;writing-mode:horizontal-tb;font-weight:700;">IV %</span>`;
        // Gradient bar
        const STEPS = 24;
        const barH  = 220; // px total
        let gradient = 'linear-gradient(to bottom,';
        for (let i = STEPS; i >= 0; i--) {
            gradient += `${ivToHex(i / STEPS)}${i > 0 ? ',' : ''}`;
        }
        gradient += ')';
        colourbar.innerHTML += `<div style="width:20px;height:${barH}px;background:${gradient};border-radius:4px;border:1px solid ${alphaColor(0.1)};position:relative;">`
            // 5 tick marks at 0%, 25%, 50%, 75%, 100% of range
            + [0, 0.25, 0.5, 0.75, 1].map(frac => {
                const ivVal = minIV + frac * (maxIV - minIV);
                const topPct = (1 - frac) * 100;
                const isHigh = ivVal >= 80;
                const color  = isHigh ? '#ef4444' : ivVal >= 50 ? '#f59e0b' : ivVal >= 30 ? '#10b981' : '#3b82f6';
                return `<div style="position:absolute;top:${topPct}%;right:-44px;transform:translateY(-50%);display:flex;align-items:center;gap:4px;">`
                    + `<div style="width:7px;height:1px;background:${alphaColor(0.3)};"></div>`
                    + `<span style="font-size:0.65rem;font-family:'JetBrains Mono',monospace;color:${color};white-space:nowrap;font-weight:700;">${ivVal.toFixed(0)}%</span>`
                    + `</div>`;
            }).join('')
            + `</div>`;
        // Zone labels below bar
        colourbar.innerHTML += [
            { label:'HIGH',  color:'#ef4444'  },
            { label:'MED',   color:'#f59e0b'  },
            { label:'NORM',  color:'#10b981'  },
            { label:'LOW',   color:'#3b82f6'  },
        ].map(z => `<span style="font-size:0.6rem;color:${z.color};letter-spacing:0.5px;font-weight:900;margin-top:3px;">${z.label}</span>`).join('');
    }

    // ── Populate per-expiry ATM IV strip (bottom centre) ─────────────────────
    const atmStrip = document.getElementById('iv-atm-strip');
    if (atmStrip && expiryLabels && ivGrid) {
        // ATM is the moneyness index closest to 1.0
        const atmIdx = moneyAxis.reduce((best, m, i) => Math.abs(m - 1) < Math.abs(moneyAxis[best] - 1) ? i : best, 0);
        atmStrip.innerHTML = expiryLabels.map((exp, zi) => {
            const iv = ivGrid[atmIdx]?.[zi];
            if (iv == null) return '';
            const t = (iv - minIV) / ((maxIV - minIV) || 1);
            const col = ivToHex(t);
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">`
                + `<span style="font-size:0.72rem;font-weight:900;color:${col};font-family:'JetBrains Mono',monospace;">${iv.toFixed(1)}%</span>`
                + `<div style="width:1px;height:10px;background:${alphaColor(0.2)};"></div>`
                + `<span style="font-size:0.62rem;color:${alphaColor(0.5)};white-space:nowrap;">${exp}</span>`
                + `</div>`;
        }).join(`<div style="width:1px;height:24px;background:${alphaColor(0.08)};align-self:center;"></div>`);
        // Prepend label
        atmStrip.innerHTML = `<span style="font-size:0.62rem;color:${alphaColor(0.35)};letter-spacing:1px;align-self:flex-end;margin-bottom:3px;margin-right:6px;font-weight:700;">ATM IV:</span>` + atmStrip.innerHTML;
    }

    // ── Three.js setup ────────────────────────────────────────────────────────
    const W = container.clientWidth, H = 520;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setClearColor(0x050508, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
    camera.position.set(15, 12, 22);
    camera.lookAt(0, 3, 0);

    scene.add(new THREE.AmbientLight(0x334466, 1.5));
    const dl = new THREE.DirectionalLight(0xaaddff, 1.2);
    dl.position.set(10, 20, 10);
    scene.add(dl);

    // ── IV range already computed above for colourbar ──────────────────────────
    const ivRange = maxIV - minIV || 1;

    // ── Build geometry ────────────────────────────────────────────────────────
    const positions = [], colors = [], indices = [];

    for (let z = 0; z < zS; z++) {
        for (let x = 0; x < xS; x++) {
            const iv = ivGrid[x][z] || minIV;
            const px = (x - xS / 2) * 0.9;
            const py = (iv / maxIV) * 12;          // height proportional to IV
            const pz = (z - zS / 2) * 2.5;
            positions.push(px, py, pz);

            // Colour map: blue(low IV) → green → yellow → red(high IV)
            const t = (iv - minIV) / ivRange;
            const r = t < 0.5 ? t * 2 * 0.2              : 0.2 + (t - 0.5) * 2 * 0.8;
            const g = t < 0.5 ? 0.2 + t * 2 * 0.6        : 0.8 - (t - 0.5) * 2 * 0.6;
            const b = t < 0.5 ? 0.8 - t * 2 * 0.6        : 0.2;
            colors.push(r, g, b);
        }
    }

    for (let z = 0; z < zS - 1; z++) {
        for (let x = 0; x < xS - 1; x++) {
            const a = z * xS + x, b2 = z * xS + x + 1,
                  c = (z + 1) * xS + x, d = (z + 1) * xS + x + 1;
            indices.push(a, b2, c);
            indices.push(b2, d, c);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({
        vertexColors: true, side: THREE.DoubleSide, shininess: 80,
        transparent: true, opacity: 0.92
    });
    scene.add(new THREE.Mesh(geo, mat));

    // Wireframe overlay
    const wf = new THREE.WireframeGeometry(geo);
    scene.add(new THREE.LineSegments(wf, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.06, transparent: true })));

    // Grid floor
    scene.add(new THREE.GridHelper(22, 20, 0x0a1020, 0x0a1020));

    // ── Text labels for expiry axis ───────────────────────────────────────────
    // (Three.js doesn't have native text — use sprites via CSS2D would need extra lib;
    //  for now we annotate via canvas overlay drawn once after first render)

    // ── Inline orbit controls ─────────────────────────────────────────────────
    let dragging = false, lastM = { x: 0, y: 0 }, theta = -0.3, phi = 0.45, radius = 30;
    const upCam = () => {
        camera.position.set(
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.cos(theta)
        );
        camera.lookAt(0, 3, 0);
    };
    canvas.addEventListener('mousedown', e => { dragging = true; lastM = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('mouseup',   () => dragging = false);
    canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        theta -= (e.clientX - lastM.x) * 0.008;
        phi = Math.max(0.1, Math.min(1.5, phi - (e.clientY - lastM.y) * 0.008));
        lastM = { x: e.clientX, y: e.clientY };
        upCam();
    });
    canvas.addEventListener('wheel', e => {
        radius = Math.max(10, Math.min(60, radius + e.deltaY * 0.05));
        upCam();
    }, { passive: true });
    upCam();

    // ── Hover tooltip ─────────────────────────────────────────────────────────
    const raycaster  = new THREE.Raycaster();
    const mousePt    = new THREE.Vector2();
    const mesh       = scene.children.find(c => c.isMesh);
    const tooltip    = Object.assign(document.createElement('div'), {
        style: 'position:absolute;pointer-events:none;background:rgba(9,9,11,0.9);border:1px solid ${alphaColor(0.1)};border-radius:6px;padding:6px 10px;font-size:0.65rem;color:white;display:none;font-family:JetBrains Mono,monospace;'
    });
    container.firstElementChild.appendChild(tooltip);

    canvas.addEventListener('mousemove', e => {
        if (!mesh) return;
        const rect = canvas.getBoundingClientRect();
        mousePt.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
        mousePt.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
        raycaster.setFromCamera(mousePt, camera);
        const hits = raycaster.intersectObject(mesh);
        if (hits.length > 0) {
            const face = hits[0].face;
            if (!face) return;
            // Snap to nearest vertex
            const vIdx = [face.a, face.b, face.c];
            const vi   = vIdx.reduce((best, v) => {
                const bPos = new THREE.Vector3().fromBufferAttribute(geo.attributes.position, best);
                const vPos = new THREE.Vector3().fromBufferAttribute(geo.attributes.position, v);
                return hits[0].point.distanceTo(vPos) < hits[0].point.distanceTo(bPos) ? v : best;
            });
            const xi    = vi % xS;
            const zi    = Math.floor(vi / xS);
            const iv    = (ivGrid[xi] && ivGrid[xi][zi]) ? ivGrid[xi][zi] : null;
            const money = moneyAxis[xi];
            const exp   = expiryLabels[zi];
            if (iv) {
                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX - rect.left + 14) + 'px';
                tooltip.style.top  = (e.clientY - rect.top  - 14) + 'px';
                const moneyDesc = money < 0.95 ? 'ITM Put / OTM Call' : money > 1.05 ? 'OTM Call / ITM Put' : 'ATM';
                tooltip.innerHTML = `<div style="color:#7dd3fc;margin-bottom:3px;">${exp} \u00b7 ${(money * 100).toFixed(0)}% moneyness</div><div>IV: <b style="color:${iv > 80 ? '#ef4444' : iv > 50 ? '#facc15' : '#22c55e'}">${iv.toFixed(1)}%</b></div><div style="color:${alphaColor(0.4)};font-size:0.55rem;margin-top:2px;">${moneyDesc}</div>`;
            }
        } else {
            tooltip.style.display = 'none';
        }
    });
    canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    // ── Animation loop — store ref BEFORE first RAF so cancelAnimationFrame works ─
    const _animRef = { id: null, alive: true, intentionalCleanup: false };
    const _animate = () => {
        if (!_animRef.alive) return;          // context lost — stop looping
        _animRef.id = requestAnimationFrame(_animate);
        renderer.render(scene, camera);
    };

    // Store on window immediately so cleanupAdvChart can reach it
    window.activeDepth3D = { animId: null, renderer, _ref: _animRef, _ro: null };
    _animate();  // kick off — _animRef.id now set correctly on first frame

    // ── WebGL context loss guard ───────────────────────────────────────────────
    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        _animRef.alive = false;
        cancelAnimationFrame(_animRef.id);
        // Intentional teardown from cleanupAdvChart — skip overlay
        if (_animRef.intentionalCleanup) return;
        // Real GPU crash — show recovery overlay
        const overlay = document.createElement('div');
        overlay.id = 'webgl-lost-overlay';
        overlay.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(5,5,8,0.92);gap:10px;z-index:10;border-radius:12px;';
        overlay.innerHTML = `
            <span class="material-symbols-outlined" style="font-size:2rem;color:#f59e0b;">warning</span>
            <span style="font-size:0.7rem;color:#f59e0b;font-weight:900;letter-spacing:2px;">GPU CONTEXT LOST</span>
            <span style="font-size:0.6rem;color:${alphaColor(0.4)};">Recovering automatically…</span>`;
        container.firstElementChild?.appendChild(overlay);
        console.warn('[IV Surface] WebGL context lost — awaiting restoration');
    }, false);

    canvas.addEventListener('webglcontextrestored', () => {
        console.info('[IV Surface] WebGL context restored — re-initialising surface');
        document.getElementById('webgl-lost-overlay')?.remove();
        _animRef.alive = false;  // ensure old loop is dead
        // Re-render after a brief delay to let the driver settle
        setTimeout(() => renderAdvVolSurface(symbol), 1000);
    }, false);

    // ── ResizeObserver — stored so cleanupAdvChart can disconnect it ───────────
    const _ro = new ResizeObserver(() => {
        const w = container.clientWidth;
        renderer.setSize(w, H);
        camera.aspect = w / H;
        camera.updateProjectionMatrix();
    });
    _ro.observe(container);
    if (window.activeDepth3D) window.activeDepth3D._ro = _ro;
}
