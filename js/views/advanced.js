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
        activeBinanceWS = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
        activeBinanceWS.onmessage = (e) => {
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
    container.innerHTML = `
        <div style="padding:1.5rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
                <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#00f2ff;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">bar_chart</span>LIVE TAPE IMBALANCE — 30S BUCKETS</span>
                <span id="tape-live-badge" style="font-size:0.55rem;color:#26a69a;animation:pulse 1s infinite;">● LIVE</span>
            </div>
            <canvas id="tape-canvas" style="max-height:420px;"></canvas>
        </div>`;
    const buckets = Array(30).fill(0);
    const labels = Array.from({length:30}, (_,i) => `-${(29-i)*30}s`);
    const ctx = document.getElementById('tape-canvas').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar', data: {
            labels,
            datasets: [{
                label: 'Buy/Sell Imbalance',
                data: [...buckets],
                backgroundColor: buckets.map(v => v >= 0 ? 'rgba(38,166,154,0.7)' : 'rgba(239,83,80,0.7)'),
                borderRadius: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            plugins: { legend: { labels: { color: 'white' } }, tooltip: { callbacks: { label: c => `Imbalance: ${c.raw > 0 ? '+' : ''}${c.raw.toFixed(2)} BTC` } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'var(--text-dim)', font: { size: 8 } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-dim)', font: { family: 'JetBrains Mono', size: 9 } } }
            }
        }
    });
    let buyVol = 0, sellVol = 0, lastBucket = Date.now();
    window.BinanceSocketManager.subscribe(symbol.replace('USDT','').replace('USDT','') + 'USDT', 'aggTrade', trade => {
        const vol = parseFloat(trade.q || 0);
        if (trade.m) sellVol += vol; else buyVol += vol;
        const now = Date.now();
        if (now - lastBucket >= 30000) {
            buckets.shift(); buckets.push(parseFloat((buyVol - sellVol).toFixed(3)));
            chart.data.datasets[0].data = [...buckets];
            chart.data.datasets[0].backgroundColor = buckets.map(v => v >= 0 ? 'rgba(38,166,154,0.7)' : 'rgba(239,83,80,0.7)');
            chart.update('none');
            buyVol = 0; sellVol = 0; lastBucket = now;
        }
    });
}

// ─── Options Volatility Surface ──────────────────────────────────────────────
function renderAdvOptionsSurface(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if (!container) return;
    container.innerHTML = `
        <div style="position:relative;width:100%;height:520px;background:#050508;border-radius:12px;overflow:hidden;">
            <canvas id="volsurf-canvas" style="width:100%;height:100%;display:block;"></canvas>
            <div style="position:absolute;top:14px;left:18px;pointer-events:none;">
                <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#00f2ff;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">stacked_line_chart</span>IMPLIED VOLATILITY SURFACE — ${symbol.replace('USDT','')}</span>
            </div>
            <div style="position:absolute;bottom:14px;left:18px;display:flex;gap:12px;pointer-events:none;">
                <span style="font-size:0.55rem;color:rgba(255,255,255,0.3);">DRAG TO ROTATE • SCROLL TO ZOOM</span>
            </div>
            <div style="position:absolute;bottom:14px;right:14px;display:flex;gap:8px;align-items:center;pointer-events:none;">
                <div style="width:50px;height:8px;background:linear-gradient(to right,#3b82f6,#10b981,#f59e0b,#ef4444);border-radius:4px;"></div>
                <span style="font-size:0.5rem;color:var(--text-dim);">LOW IV → HIGH IV</span>
            </div>
        </div>`;
    const canvas = document.getElementById('volsurf-canvas');
    if (!canvas || typeof THREE === 'undefined') return;
    const W = container.clientWidth, H = 520;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H); renderer.setClearColor(0x050508, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 1000);
    camera.position.set(15, 12, 22); camera.lookAt(0, 3, 0);
    scene.add(new THREE.AmbientLight(0x334466, 1.5));
    const dl = new THREE.DirectionalLight(0xaaddff, 1.2); dl.position.set(10, 20, 10); scene.add(dl);
    // Build IV surface grid: 20 strikes × 6 expiries
    const strikes = Array.from({length:20}, (_,i) => 0.7 + i * 0.03); // 70% to 130% moneyness
    const expiries = [7, 14, 30, 60, 90, 180]; // days to expiry
    const xS = 20, zS = 6;
    const geo = new THREE.BufferGeometry();
    const positions = [], colors = [], indices = [];
    const ivGrid = [];
    for (let z = 0; z < zS; z++) {
        for (let x = 0; x < xS; x++) {
            const money = strikes[x], t = expiries[z] / 365;
            const atm = -Math.pow(money - 1, 2) * 2.5;  // parabolic smile
            const termStr = Math.log(t + 0.05) * 0.08;  // term structure
            const iv = Math.max(0.1, 0.30 + atm + termStr + (Math.random() - 0.5) * 0.02);
            ivGrid.push(iv);
            const px = (x - xS/2) * 0.9, py = iv * 14, pz = (z - zS/2) * 2.5;
            positions.push(px, py, pz);
            // Color by IV: blue→green→yellow→red
            const t2 = Math.min(1, (iv - 0.1) / 0.5);
            const r = t2 < 0.5 ? t2 * 2 * 0.2 : 0.2 + (t2 - 0.5) * 2 * 0.8;
            const g = t2 < 0.5 ? 0.2 + t2 * 2 * 0.6 : 0.8 - (t2 - 0.5) * 2 * 0.6;
            const b = t2 < 0.5 ? 0.8 - t2 * 2 * 0.6 : 0.2;
            colors.push(r, g, b);
        }
    }
    for (let z = 0; z < zS-1; z++) for (let x = 0; x < xS-1; x++) {
        const a = z*xS+x, b = z*xS+x+1, c = (z+1)*xS+x, d = (z+1)*xS+x+1;
        indices.push(a,b,c); indices.push(b,d,c);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices); geo.computeVertexNormals();
    const mat = new THREE.MeshPhongMaterial({ vertexColors: true, side: THREE.DoubleSide, shininess: 80, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Mesh(geo, mat));
    const wf = new THREE.WireframeGeometry(geo);
    scene.add(new THREE.LineSegments(wf, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.07, transparent: true })));
    scene.add(new THREE.GridHelper(22, 20, 0x0a1020, 0x0a1020));
    // OrbitControls inline
    let dragging=false,lastM={x:0,y:0},theta=-0.3,phi=0.45,radius=30;
    const upCam = () => { camera.position.set(radius*Math.sin(phi)*Math.sin(theta),radius*Math.cos(phi),radius*Math.sin(phi)*Math.cos(theta)); camera.lookAt(0,3,0); };
    canvas.addEventListener('mousedown', e => { dragging=true; lastM={x:e.clientX,y:e.clientY}; });
    canvas.addEventListener('mouseup', () => dragging=false);
    canvas.addEventListener('mousemove', e => { if(!dragging) return; theta-=(e.clientX-lastM.x)*0.008; phi=Math.max(0.1,Math.min(1.5,phi-(e.clientY-lastM.y)*0.008)); lastM={x:e.clientX,y:e.clientY}; upCam(); });
    canvas.addEventListener('wheel', e => { radius=Math.max(10,Math.min(60,radius+e.deltaY*0.05)); upCam(); }, { passive:true });
    upCam();
    let animId;
    const animate = () => { animId = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();
    window.activeDepth3D = { animId, renderer };
}

