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
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontSize: 11, fontFamily: 'JetBrains Mono' },
        grid: { vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, horzLines: { color: 'rgba(255, 255, 255, 0.03)' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true }
    });
    
    const candleSeries = chart.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
    const volumeSeries = chart.addHistogramSeries({ color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '', scaleMargins: { top: 0.8, bottom: 0 } });
    
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

    // Phase 11.3: Institutional Volume Profile (VAP)
    const renderVolumeProfile = (data) => {
        const buckets = 30; // 30 price tiers
        const prices = data.map(k => k.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const range = maxPrice - minPrice;
        const step = range / buckets;
        
        const profile = new Array(buckets).fill(0);
        data.forEach(k => {
            const idx = Math.min(buckets - 1, Math.floor((k.close - minPrice) / step));
            profile[idx] += k.value;
        });

        const vapSeries = chart.addHistogramSeries({
            color: 'rgba(59, 130, 246, 0.3)', 
            priceFormat: { type: 'volume' },
            priceScaleId: 'left', 
            title: 'VAP'
        });
        
        chart.priceScale('left').applyOptions({
            scaleMargins: { top: 0.1, bottom: 0.1 },
            visible: true,
            borderColor: 'rgba(255,255,255,0.05)'
        });

        // We map the histogram to the most recent time period to keep it as a vertical profile "wall"
        const lastTime = data[data.length - 1].time;
        const profileData = profile.map((vol, i) => {
            // To simulate a vertical profile, we spread it across a few bars or a fixed window
            const priceLevel = minPrice + (i * step);
            return {
                time: data[Math.max(0, data.length - buckets + i)].time,
                value: vol,
                color: 'rgba(59, 130, 246, 0.25)'
            };
        });
        vapSeries.setData(profileData);
    };

    if (klines.length > 0) {
        renderVolumeProfile(klines);
    }
    
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
        const toggle = document.getElementById('heatmap-toggle');
        const intensity = document.getElementById('heatmap-intensity');
        if (toggle) {
            const legend = document.getElementById('heatmap-legend-overlay');
            if (legend) legend.style.display = toggle.checked ? 'flex' : 'none';
            if (!toggle.checked) window.activeHeatmap.canvas.style.display = 'none';
        }
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
    const legend = document.getElementById('heatmap-legend-overlay');
    if (window.activeHeatmap) {
        const isVisible = toggle.checked;
        window.activeHeatmap.canvas.style.display = isVisible ? 'block' : 'none';
        if (legend) legend.style.display = isVisible ? 'flex' : 'none';
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
        <div class="legend-bar-institutional" style="display:flex; gap:1.5rem; padding:0.8rem; border-top:1px solid var(--border); background:rgba(255,255,255,0.02); font-size:0.75rem;">
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
        layout: { background: { color: '#09090b' }, textColor: '#9ca3af', fontSize: 11, fontFamily: 'Inter' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.02)' }, horzLines: { color: 'rgba(255,255,255,0.02)' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true }
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

async function renderAdvDepth(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if (!container) return;

    container.innerHTML = `
        <div style="position:relative; width:100%; height:520px; background:#050508; border-radius:12px; overflow:hidden;">
            <canvas id="depth3d-canvas" style="width:100%; height:100%; display:block;"></canvas>
            <div style="position:absolute; top:14px; left:18px; display:flex; gap:20px; align-items:center; pointer-events:none;">
                <span style="font-size:0.6rem; font-weight:900; letter-spacing:2px; color:#00f2ff;">3D ORDERBOOK TOPOLOGY</span>
                <span style="display:flex;align-items:center;gap:5px;font-size:0.6rem;color:#26a69a;">
                    <span style="width:10px;height:10px;background:#26a69a;border-radius:2px;display:inline-block;"></span> BID DEPTH
                </span>
                <span style="display:flex;align-items:center;gap:5px;font-size:0.6rem;color:#ef5350;">
                    <span style="width:10px;height:10px;background:#ef5350;border-radius:2px;display:inline-block;"></span> ASK DEPTH
                </span>
            </div>
            <div style="position:absolute;bottom:14px;right:18px;font-size:0.55rem;color:rgba(255,255,255,0.25);pointer-events:none;">DRAG TO ROTATE • SCROLL TO ZOOM</div>
        </div>`;

    const canvas = document.getElementById('depth3d-canvas');
    if (!canvas || typeof THREE === 'undefined') {
        container.innerHTML = '<div class="error-msg">WebGL renderer unavailable.</div>';
        return;
    }

    // Check WebGL availability before touching THREE.WebGLRenderer
    const testCtx = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (!testCtx) {
        container.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:520px;background:#050508;border-radius:12px;flex-direction:column;gap:12px;color:var(--text-dim)">
                <span class="material-symbols-outlined" style="font-size:2.5rem;color:#ef4444">error</span>
                <div style="font-size:0.8rem;font-weight:700">WebGL Unavailable</div>
                <div style="font-size:0.65rem;text-align:center;max-width:280px">Your browser has exhausted its WebGL context limit. Close other tabs or refresh the page to reset.</div>
            </div>`;
        return;
    }

    // --- Three.js Scene Setup ---
    const W = container.clientWidth, H = 520;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050508, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 18, 30);
    camera.lookAt(0, 0, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0x223355, 1.2));
    const dirLight = new THREE.DirectionalLight(0x88bbff, 1.0);
    dirLight.position.set(10, 30, 20);
    scene.add(dirLight);

    // Grid on floor
    const grid = new THREE.GridHelper(60, 30, 0x0a1020, 0x0a1020);
    grid.position.y = -0.1;
    scene.add(grid);

    // --- Inline OrbitControls ---
    let isDragging = false, lastMouse = { x: 0, y: 0 };
    let theta = 0.3, phi = 0.55, radius = 35;
    function updateCamera() {
        camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(0, 2, 0);
    }
    updateCamera();

    canvas.addEventListener('mousedown', e => { isDragging = true; lastMouse = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mousemove', e => {
        if (!isDragging) return;
        theta -= (e.clientX - lastMouse.x) * 0.008;
        phi = Math.max(0.1, Math.min(1.5, phi - (e.clientY - lastMouse.y) * 0.008));
        lastMouse = { x: e.clientX, y: e.clientY };
        updateCamera();
    });
    canvas.addEventListener('wheel', e => {
        radius = Math.max(10, Math.min(80, radius + e.deltaY * 0.05));
        updateCamera();
    }, { passive: true });

    // --- Build 3D terrain mesh from depth data ---
    function buildDepthMesh(levels, color, side) {
        if (!levels || levels.length < 2) return null;
        const n = Math.min(levels.length, 40);
        const shape = new THREE.Shape();
        const xScale = 20 / n;
        const yScale = 0.018;
        const xOffset = side === 'bid' ? -n * xScale : 0;

        shape.moveTo(xOffset + (side === 'bid' ? n * xScale : 0), 0);
        for (let i = 0; i < n; i++) {
            const x = side === 'bid' ? xOffset + (n - i) * xScale : xOffset + i * xScale;
            const y = levels[i] * yScale;
            if (i === 0) shape.lineTo(x, y); else shape.lineTo(x, y);
        }
        shape.lineTo(side === 'bid' ? xOffset : xOffset + n * xScale, 0);
        shape.closePath();

        const extrudeSettings = { depth: 1.2, bevelEnabled: false };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const mat = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.25,
            transparent: true,
            opacity: 0.82,
            shininess: 60,
            side: THREE.DoubleSide
        });

        // Rotate so the shape lies in the XZ plane
        geo.rotateX(-Math.PI / 2);
        return new THREE.Mesh(geo, mat);
    }

    let bidMesh = null, askMesh = null;

    function rebuildMeshes(rawBids, rawAsksFull) {
        if (bidMesh) { scene.remove(bidMesh); bidMesh.geometry.dispose(); }
        if (askMesh) { scene.remove(askMesh); askMesh.geometry.dispose(); }

        // Cumulative sum for depth chart
        let bidCum = 0, askCum = 0;
        const bidLevels = rawBids.map(b => { bidCum += parseFloat(b[1]); return bidCum; });
        const askLevels = rawAsksFull.map(a => { askCum += parseFloat(a[1]); return askCum; });

        bidMesh = buildDepthMesh(bidLevels, 0x26a69a, 'bid');
        askMesh = buildDepthMesh(askLevels, 0xef5350, 'ask');
        if (bidMesh) scene.add(bidMesh);
        if (askMesh) scene.add(askMesh);
    }

    // --- Animation loop ---
    let animId;
    function animate() {
        animId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Store for cleanup
    window.activeDepth3D = { animId, renderer };

    // --- Data source ---
    const isEquity = ['MSTR', 'COIN', 'MARA', 'RIOT', 'CLSK'].includes(symbol.toUpperCase());

    if (isEquity) {
        try {
            const history = await fetchAPI(`/liquidity-history?ticker=${symbol}`);
            if (history && history.data && history.data.length > 0) {
                const latest = history.data[history.data.length - 1];
                const rawBids = Object.entries(latest.bids || {}).map(([p, v]) => [parseFloat(p), parseFloat(v)]).sort((a, b) => b[0] - a[0]);
                const rawAsks = Object.entries(latest.asks || {}).map(([p, v]) => [parseFloat(p), parseFloat(v)]).sort((a, b) => a[0] - b[0]);
                rebuildMeshes(rawBids, rawAsks);
            }
        } catch (e) { console.error('3D Depth fallback error:', e); }
    } else {
        window.BinanceSocketManager.subscribe(symbol, 'depth20@100ms', (data) => {
            if (!data.bids || !data.asks) return;
            const rawBids = [...data.bids].reverse().map(b => [parseFloat(b[0]), parseFloat(b[1])]);
            const rawAsks = data.asks.map(a => [parseFloat(a[0]), parseFloat(a[1])]);
            rebuildMeshes(rawBids, rawAsks);
        });
    }

    // Handle resize
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
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true }
    });
    
    const priceSeries = chart.addLineSeries({ color: 'rgba(255,255,255,0.7)', lineWidth: 1, title: 'Price Action' });
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
    
    chart.priceScale('left').applyOptions({ visible: true, borderColor: 'rgba(255,255,255,0.1)' });
    chart.priceScale('left_liq').applyOptions({ visible: false });
    
    // LIVE WEBSOCKET AGGREGATOR
    let currentCandleStart = Math.floor(Date.now() / 60000) * 60;
    
    window.BinanceSocketManager.subscribe(symbol, 'aggTrade', (wsData) => {
        // wsData.p: Price, wsData.q: Quantity, wsData.T: Timestamp, wsData.m: Buyer is Maker (Sell)
        let ts = Math.floor(wsData.T / 1000);
        let qty = parseFloat(wsData.q);
        let price = parseFloat(wsData.p);
        let isSell = wsData.m; // true = taker sell (red), false = taker buy (green)
        
        // Align to 1m boundary
        let candleTime = Math.floor(ts / 60) * 60;
        if(candleTime > currentCandleStart) currentCandleStart = candleTime;
        
        // 1. Update CVD (Sum of directional volume)
        runningCVD += (isSell ? -qty : qty);
        cvdSeries.update({ time: currentCandleStart, value: runningCVD });
        
        // 2. Capture large market orders (Whale Flux)
        if(qty > 5) { // If > 5 BTC/ETH block size limit
            blockSeries.update({ time: ts, value: qty, color: isSell ? '#ef5350' : '#26a69a' });
        }
    });
    
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
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
        timeScale: { timeVisible: true }
    });
    const norm = (data) => {
        if(!data.length) return [];
        let start = data[0].close;
        return data.map(d => ({time: d.time, value: ((d.close - start)/start)*100}));
    };
    chart.addLineSeries({color:'#facc15', lineWidth:2, title: sym}).setData(norm(activeData));
    chart.addLineSeries({color:'rgba(255,255,255,0.4)', lineWidth:1, title: 'BTC Benchmark'}).setData(norm(btcData));
    
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
            layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
            grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } }
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
            layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
            grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } }
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
            <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#00f2ff;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">bolt</span>PERPETUAL FUNDING RATE HEATMAP — 24H ROLLING</span>
            <div style="display:flex;gap:16px;font-size:0.55rem;color:var(--text-dim);">
                <span style="color:#ef5350;">■ NEGATIVE (Shorts Pay)</span>
                <span style="color:rgba(255,255,255,0.2);">■ NEUTRAL</span>
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
                    : 'rgba(255,255,255,0.04)';
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
                <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#00f2ff;">
                    <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">bar_chart</span>
                    LIVE TAPE IMBALANCE — ${symbol.replace('USDT','/USDT')} · 5S BUCKETS
                </span>
                <div style="display:flex;align-items:center;gap:14px;">
                    <span id="tape-running-label" style="font-size:0.6rem;color:var(--text-dim);font-family:'JetBrains Mono'">Accumulating...</span>
                    <span id="tape-live-badge" style="font-size:0.55rem;color:#26a69a;animation:pulse 1.5s infinite;">● LIVE</span>
                </div>
            </div>
            <div style="flex:1;min-height:360px;position:relative;">
                <canvas id="tape-canvas"></canvas>
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
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 8, family: 'JetBrains Mono' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'JetBrains Mono', size: 9 } },
                    title: { display: true, text: `Net Volume (${symbol.replace('USDT','')})`, color: 'rgba(255,255,255,0.25)', font: { size: 9 } }
                }
            }
        }
    });

    // Normalize symbol: BTCUSDT → BTCUSDT, BTC → BTCUSDT
    const wsSymbol = symbol.toUpperCase().endsWith('USDT')
        ? symbol.toUpperCase()
        : symbol.toUpperCase().replace('-USD', '') + 'USDT';

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
            <canvas id="volsurf-canvas" style="width:100%;height:100%;display:block;"></canvas>
            <div style="position:absolute;top:14px;left:18px;pointer-events:none;display:flex;align-items:center;gap:14px;">
                <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#00f2ff;">
                    <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">stacked_line_chart</span>
                    IMPLIED VOLATILITY SURFACE — ${currency}
                </span>
                <span id="iv-source-badge" style="font-size:0.55rem;color:rgba(255,255,255,0.3);animation:pulse 2s infinite;">● LOADING...</span>
            </div>
            <div id="iv-stats-bar" style="position:absolute;top:14px;right:18px;display:flex;gap:16px;pointer-events:none;"></div>
            <div style="position:absolute;bottom:14px;left:18px;display:flex;gap:12px;pointer-events:none;">
                <span style="font-size:0.55rem;color:rgba(255,255,255,0.3);">DRAG TO ROTATE • SCROLL TO ZOOM</span>
            </div>
            <div style="position:absolute;bottom:14px;right:14px;display:flex;gap:8px;align-items:center;pointer-events:none;">
                <div style="width:60px;height:8px;background:linear-gradient(to right,#3b82f6,#10b981,#f59e0b,#ef4444);border-radius:4px;"></div>
                <span style="font-size:0.5rem;color:var(--text-dim);">LOW IV → HIGH IV</span>
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
            <div style="font-size:0.55rem;color:var(--text-dim);">Updated: <span style="color:rgba(255,255,255,0.5);">${surfaceData.timestamp ? surfaceData.timestamp.slice(11,16) + ' UTC' : '--'}</span></div>`;
    }

    const moneyAxis   = surfaceData.moneyness_axis;     // length 20
    const expiryLabels = surfaceData.expiry_labels;      // length 6
    const ivGrid      = surfaceData.iv_grid;             // ivGrid[strike][expiry]
    const xS = moneyAxis.length;
    const zS = expiryLabels.length;

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

    // ── Flatten min/max IV for colour normalisation ───────────────────────────
    const allIVs = ivGrid.flat().filter(v => v != null && !isNaN(v));
    const minIV  = Math.min(...allIVs);
    const maxIV  = Math.max(...allIVs);
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
        style: 'position:absolute;pointer-events:none;background:rgba(9,9,11,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:6px 10px;font-size:0.65rem;color:white;display:none;font-family:JetBrains Mono,monospace;'
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
                tooltip.innerHTML = `<div style="color:#00f2ff;margin-bottom:3px;">${exp} \u00b7 ${(money * 100).toFixed(0)}% moneyness</div><div>IV: <b style="color:${iv > 80 ? '#ef4444' : iv > 50 ? '#facc15' : '#22c55e'}">${iv.toFixed(1)}%</b></div><div style="color:rgba(255,255,255,0.4);font-size:0.55rem;margin-top:2px;">${moneyDesc}</div>`;
            }
        } else {
            tooltip.style.display = 'none';
        }
    });
    canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    const _animRef = { id: null };
    const _animate = () => { _animRef.id = requestAnimationFrame(_animate); renderer.render(scene, camera); };
    _animate();
    window.activeDepth3D = { animId: _animRef.id, renderer, _ref: _animRef };

    const _ro = new ResizeObserver(() => {
        const w = container.clientWidth;
        renderer.setSize(w, H);
        camera.aspect = w / H;
        camera.updateProjectionMatrix();
    });
    _ro.observe(container);
}
