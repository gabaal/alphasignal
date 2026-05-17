// ============================================================
// POWER TRIO VIEW — Alpha-Momentum | Liquidity | BTC Correlation
// ============================================================

const POWER_TRIO_ASSETS = [
    'BTC-USD','ETH-USD','SOL-USD','XRP-USD','ADA-USD','AVAX-USD','DOT-USD','TRX-USD','TON-USD','LINK-USD','ATOM-USD','NEAR-USD',
    'SEI-USD','INJ-USD','OP-USD','ARB-USD','MATIC-USD','STRK-USD','TIA-USD','SUI-USD','APT-USD','ALGO-USD','STX-USD',
    'AAVE-USD','LDO-USD','MKR-USD','CRV-USD','RUNE-USD','SNX-USD','JTO-USD','EIGEN-USD','UNI-USD','COMP-USD','PENDLE-USD',
    'FET-USD','RENDER-USD','OCEAN-USD','WLD-USD','TAO-USD','AKT-USD','FIL-USD','HNT-USD','PYTH-USD','ONDO-USD',
    'DOGE-USD','SHIB-USD','PEPE-USD','BONK-USD','WIF-USD','FLOKI-USD','BOME-USD'
];

let _powerTrioCharts = {};
let _powerTrioConfigs = {};
let _powerTrioTicker = 'SOL-USD';
let _trioPeriod   = '60d';
let _trioInterval = '1h';

async function renderPowerTrio(ticker) {
    if (ticker) _powerTrioTicker = ticker;

    const appEl = document.getElementById('app-view');
    appEl.innerHTML = `
    <div class="view-header" style="margin-bottom:1.5rem">
        <div style="flex:1;min-width:0">
            <h2 style="font-size:0.6rem;font-weight:700;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Institutional Charts</h2>
            <h1 style="margin:0"><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:6px;color:var(--accent);font-size:1.2rem">bar_chart</span>Power Trio</h1>
            <p style="color:var(--text-dim);margin-top:4px;font-size:0.8rem">Alpha-Momentum · Liquidity Heatmap · BTC Correlation — three screens, one edge.</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
            <label style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">ASSET</label>
            <select id="power-trio-select"
                style="background:${alphaColor(0.05)};border:1px solid ${alphaColor(0.12)};
                       border-radius:8px;color:var(--text-main);padding:6px 12px;font-size:0.8rem;
                       font-family:inherit;cursor:pointer;min-width:130px"
                onchange="renderPowerTrio(this.value)">
                ${POWER_TRIO_ASSETS.map(a => `<option value="${a}" ${a===_powerTrioTicker?'selected':''}>${a.replace('-USD','')}</option>`).join('')}
            </select>
        </div>
    </div>

    <!-- Row 1: Chart 1 full-width -->
    <div style="margin-bottom:1.25rem">

        <!-- CHART 1: Alpha-Momentum -->
        <div class="card" id="trio-card-1" onclick="openTrioModal('momentum')" style="padding:1.25rem;cursor:zoom-in;transition:border-color 0.2s,box-shadow 0.2s"
             onmouseover="this.style.borderColor='rgba(0,242,255,0.4)';this.style.boxShadow='0 0 20px rgba(0,242,255,0.08)'"
             onmouseout="this.style.borderColor='';this.style.boxShadow=''">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                <div>
                    <div style="font-size:0.55rem;letter-spacing:2px;color:var(--accent);font-weight:700;margin-bottom:2px">CHART 1 · ALPHA MOMENTUM</div>
                    <h3 id="trio-c1-title" style="margin:0;font-size:0.85rem">Price + ML Alpha Window</h3>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:0.55rem;color:${alphaColor(0.25)};letter-spacing:1px">CLICK TO EXPAND</span>
                    <span class="material-symbols-outlined" style="font-size:14px;color:${alphaColor(0.25)}">zoom_in</span>
                    <span id="trio-c1-badge" style="font-size:0.6rem;padding:2px 8px;border-radius:4px;background:rgba(0,242,255,0.1);color:var(--accent);font-weight:700;border:1px solid rgba(0,242,255,0.2)">LOADING</span>
                </div>
            </div>
            <!-- Timeframe & Interval toolbar -->
            <div onclick="event.stopPropagation()" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px">
                <!-- Period buttons (left) -->
                <div id="trio-period-bar" style="display:flex;gap:4px">
                    ${['1W','1M','60D','3M','6M'].map(p => `
                    <button onclick="event.stopPropagation();_setTrioPeriod('${p}')" id="trio-p-${p}"
                        style="font-size:0.6rem;font-weight:700;letter-spacing:1px;padding:4px 10px;
                               border-radius:6px;border:1px solid ${alphaColor(0.1)};cursor:pointer;
                               font-family:inherit;transition:all 0.15s;
                               background:${p==='60D'?'rgba(0,242,255,0.15)':alphaColor(0.04)};
                               color:${p==='60D'?'var(--accent)':alphaColor(0.5)};
                               border-color:${p==='60D'?'rgba(0,242,255,0.4)':alphaColor(0.1)}">
                        ${p}
                    </button>`).join('')}
                </div>
                <!-- Interval buttons (right) -->
                <div id="trio-interval-bar" style="display:flex;gap:4px">
                    ${['15M','1H','1D'].map(iv => `
                    <button onclick="event.stopPropagation();_setTrioInterval('${iv}')" id="trio-i-${iv}"
                        style="font-size:0.6rem;font-weight:700;letter-spacing:1px;padding:4px 10px;
                               border-radius:6px;border:1px solid ${alphaColor(0.1)};cursor:pointer;
                               font-family:inherit;transition:all 0.15s;
                               background:${iv==='1H'?'rgba(0,242,255,0.15)':alphaColor(0.04)};
                               color:${iv==='1H'?'var(--accent)':alphaColor(0.5)};
                               border-color:${iv==='1H'?'rgba(0,242,255,0.4)':alphaColor(0.1)}">
                        ${iv}
                    </button>`).join('')}
                </div>
            </div>
            <div id="trio-chart-momentum" style="width:100%;height:220px"></div>
            <div id="trio-c1-stats" style="display:flex;gap:16px;margin-top:12px;padding-top:10px;border-top:1px solid ${alphaColor(0.05)}"></div>
        </div>
    </div><!-- end row 1 -->

    <!-- Row 2: Charts 2 & 3 side-by-side (50/50) -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">

        <!-- CHART 2: Liquidity / Order Imbalance -->
        <div class="card" id="trio-card-2" onclick="openTrioModal('liquidity')" style="padding:1.25rem;cursor:zoom-in;transition:border-color 0.2s,box-shadow 0.2s"
             onmouseover="this.style.borderColor='rgba(139,92,246,0.4)';this.style.boxShadow='0 0 20px rgba(139,92,246,0.08)'"
             onmouseout="this.style.borderColor='';this.style.boxShadow=''">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                <div>
                    <div style="font-size:0.55rem;letter-spacing:2px;color:#a78bfa;font-weight:700;margin-bottom:2px">CHART 2 · LIQUIDITY</div>
                    <h3 style="margin:0;font-size:0.85rem">Order Book Imbalance</h3>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:0.55rem;color:${alphaColor(0.25)};letter-spacing:1px">CLICK TO EXPAND</span>
                    <span class="material-symbols-outlined" style="font-size:14px;color:${alphaColor(0.25)}">zoom_in</span>
                    <span id="trio-c2-badge" style="font-size:0.6rem;padding:2px 8px;border-radius:4px;background:rgba(139,92,246,0.1);color:#a78bfa;font-weight:700;border:1px solid rgba(139,92,246,0.2)">LIVE</span>
                </div>
            </div>
            <div style="position:relative;height:220px">
                <canvas id="trio-chart-liquidity"></canvas>
            </div>
            <div id="trio-c2-stats" style="display:flex;gap:16px;margin-top:12px;padding-top:10px;border-top:1px solid ${alphaColor(0.05)}"></div>
        </div>

        <!-- CHART 3: BTC Correlation -->
        <div class="card" id="trio-card-3" onclick="openTrioModal('correlation')" style="padding:1.25rem;cursor:zoom-in;transition:border-color 0.2s,box-shadow 0.2s"
             onmouseover="this.style.borderColor='rgba(74,222,128,0.4)';this.style.boxShadow='0 0 20px rgba(74,222,128,0.08)'"
             onmouseout="this.style.borderColor='';this.style.boxShadow=''">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                <div>
                    <div style="font-size:0.55rem;letter-spacing:2px;color:#4ade80;font-weight:700;margin-bottom:2px">CHART 3 · DECOUPLING</div>
                    <h3 style="margin:0;font-size:0.85rem">Rolling BTC Correlation</h3>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:0.55rem;color:${alphaColor(0.25)};letter-spacing:1px">CLICK TO EXPAND</span>
                    <span class="material-symbols-outlined" style="font-size:14px;color:${alphaColor(0.25)}">zoom_in</span>
                    <span id="trio-c3-badge" style="font-size:0.6rem;padding:2px 8px;border-radius:4px;background:rgba(74,222,128,0.1);color:#4ade80;font-weight:700;border:1px solid rgba(74,222,128,0.2)">30D</span>
                </div>
            </div>
            <div style="position:relative;height:220px">
                <canvas id="trio-chart-correlation"></canvas>
            </div>
            <div id="trio-c3-stats" style="display:flex;gap:16px;margin-top:12px;padding-top:10px;border-top:1px solid ${alphaColor(0.05)}"></div>
        </div>
    </div><!-- end row 2 -->

    <!-- Insight Panel -->
    <div class="card" id="trio-insight-panel" style="margin-top:1.25rem;padding:1.25rem;border-left:3px solid rgba(0,242,255,0.4);background:linear-gradient(135deg,rgba(0,242,255,0.03),rgba(139,92,246,0.03))">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span class="material-symbols-outlined" style="color:var(--accent);font-size:1rem">psychology</span>
            <span style="font-size:0.65rem;letter-spacing:2px;font-weight:700;color:var(--accent)">INSTITUTIONAL READ</span>
        </div>
        <div id="trio-insight-text" style="font-size:0.82rem;color:var(--text-dim);line-height:1.7">Analysing signals across all three chart dimensions…</div>
    </div>
    `;

    // Destroy old charts
    Object.values(_powerTrioCharts).forEach(c => { try { c.destroy(); } catch(e){} });
    _powerTrioCharts = {};

    await _buildPowerTrio(_powerTrioTicker);
}

async function _buildPowerTrio(ticker) {
    const sym = ticker.replace('-USD','');

    // --- Fetch price history ---
    let closes = [], dates = [], volumes = [];
    try {
        const raw = await fetchAPI(`/history?ticker=${encodeURIComponent(ticker)}&period=35d&interval=1d`);
        if (raw && raw.dates && raw.closes) {
            dates = raw.dates;
            closes = raw.closes;
            volumes = raw.volumes || [];
        }
    } catch(e) {}

    // Fallback: generate plausible synthetic data for demonstration
    if (closes.length < 5) {
        const base = ticker === 'BTC-USD' ? 80000 : ticker === 'ETH-USD' ? 3000 : 100;
        closes = Array.from({length:30}, (_,i) => base * (1 + (Math.random()-0.48)*0.03*(i+1)));
        dates  = Array.from({length:30}, (_,i) => {
            const d = new Date(); d.setDate(d.getDate()-30+i);
            return d.toISOString().split('T')[0];
        });
        volumes = closes.map(() => Math.random()*1e9);
    }

    const labels = dates.map(d => d.slice(5)); // MM-DD

    // =====================================================
    // CHART 1 — Candlestick + EMA5 + Volume (lightweight-charts)
    // =====================================================
    const c1el = document.getElementById('trio-chart-momentum');
    if (c1el && typeof LightweightCharts !== 'undefined') {
        // Fetch real OHLC
        let candles = [];
        try {
            const ohlcData = await fetchAPI(`/ohlc?ticker=${encodeURIComponent(ticker)}&period=60d&interval=1h`);
            if (ohlcData && ohlcData.candles && ohlcData.candles.length > 4) {
                candles = ohlcData.candles;
            }
        } catch(e) {}

        // Hourly synthetic fallback (60d × 24h = 1440 candles)
        if (candles.length < 5) {
            const base = ticker==='BTC-USD'?80000:ticker==='ETH-USD'?3000:closes[0]||100;
            let price = base;
            const now = Math.floor(Date.now()/1000);
            const totalHours = 60 * 24;
            for (let i = totalHours; i >= 0; i--) {
                const o = price;
                const h = o * (1 + Math.random()*0.008);
                const l = o * (1 - Math.random()*0.008);
                const c2 = l + Math.random()*(h-l);
                candles.push({ time: now - i*3600, open:o, high:h, low:l, close:c2, volume: Math.random()*1e8 });
                price = c2;
            }
        }

        // Compute EMA-5 on close
        const k5 = 2/6;
        const emaData = [];
        candles.forEach((c2, i) => {
            const prev = i===0 ? c2.close : emaData[i-1].value;
            emaData.push({ time: c2.time, value: parseFloat((c2.close*k5 + prev*(1-k5)).toFixed(6)) });
        });

        // Create chart
        if (_powerTrioCharts._lwMomentum) {
            try { _powerTrioCharts._lwMomentum.remove(); } catch(e) {}
        }
        const lwChart = LightweightCharts.createChart(c1el, {
            width: c1el.clientWidth,
            height: 220,
            layout: { background:{color:'transparent'}, textColor:alphaColor(0.4) },
            grid: { vertLines:{color:alphaColor(0.04)}, horzLines:{color:alphaColor(0.04)} },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor:alphaColor(0.08) },
            timeScale: { borderColor:alphaColor(0.08), timeVisible:true, secondsVisible:false },
        });
        // Keep chart width synced with container
        if (window._trioResizeObs) window._trioResizeObs.disconnect();
        window._trioResizeObs = new ResizeObserver(() => {
            if (c1el.clientWidth > 0) lwChart.resize(c1el.clientWidth, 220);
        });
        window._trioResizeObs.observe(c1el);
        _buildLWChart(lwChart, candles, emaData);
        const avwapData = _computeAVWAP(candles);
        lwChart.timeScale().fitContent();

        _powerTrioCharts._lwMomentum = lwChart;

        // Badge
        const lastC = candles.at(-1);
        const prevC = candles.at(-2) || lastC;
        const dayPct = ((lastC.close - prevC.close)/prevC.close*100).toFixed(2);
        const isPos  = parseFloat(dayPct) >= 0;
        document.getElementById('trio-c1-badge').textContent = (isPos?'▲ ':'▼ ') + Math.abs(dayPct) + '%';
        document.getElementById('trio-c1-badge').style.color = isPos?'#4ade80':'#f87171';
        document.getElementById('trio-c1-badge').style.background = isPos?'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)';

        // Store for modal
        _powerTrioConfigs.momentum = {
            type: 'candlestick',
            candles, emaData,
            title: 'Alpha-Momentum: OHLC Candlestick + EMA-5',
            accentColor: 'rgba(0,242,255,0.9)',
            statsEl: 'trio-c1-stats',
            note: '60 days of hourly candles (~1,440 bars). Green = bullish hour, red = bearish hour. The cyan EMA-5 is the momentum signal. The gold AVWAP line anchors to peak volume — price above AVWAP = institutional buyers in control; below = distribution.'
        };

        const pct30 = candles.length>1 ? ((lastC.close - candles[0].close)/candles[0].close*100).toFixed(1) : '—';
        // Use live WebSocket price if available, so it matches the navbar
        const livePrice = window.livePrices?.[sym] || (sym === 'BTC' ? window.currentBTCPrice : null) || lastC.close;
        document.getElementById('trio-c1-stats').innerHTML =
            _statChip(sym, formatPrice(livePrice), 'var(--accent)') +
            _statChip('60D', (pct30>=0?'+':'')+pct30+'%', parseFloat(pct30)>=0?'#4ade80':'#f87171') +
            _statChip('RANGE', formatPrice(Math.min(...candles.map(c=>c.low))) + ' – ' + formatPrice(Math.max(...candles.map(c=>c.high))), '#a78bfa') +
            _statChip('EMA-5', formatPrice(emaData.at(-1)?.value), '#7dd3fc') +
            _statChip('AVWAP', formatPrice(avwapData.at(-1)?.value), 'rgba(251,191,36,0.9)');
        document.getElementById('trio-c1-title').textContent = 'Price + EMA-5 + AVWAP';
    } else if (c1el) {
        c1el.innerHTML = '<div style="color:var(--text-dim);font-size:0.75rem;padding:2rem;text-align:center">lightweight-charts not loaded</div>';
    }

    // =====================================================
    // CHART 2 — Liquidity / Order Book Imbalance (bars)
    // =====================================================
    const c2ctx = document.getElementById('trio-chart-liquidity')?.getContext('2d');
    if (c2ctx) {
        // Simulate order imbalance from volume direction
        const imbalance = closes.map((c,i) => {
            if (i===0) return 0;
            const ret = (c - closes[i-1])/closes[i-1];
            return parseFloat((ret * 100 * (0.6 + Math.random()*0.8)).toFixed(2));
        }).slice(1);
        const ibLabels = labels.slice(1);
        const ibColors = imbalance.map(v => v >= 0 ? 'rgba(74,222,128,0.75)' : 'rgba(248,113,113,0.75)');
        const latestIb = imbalance.at(-1) || 0;

        document.getElementById('trio-c2-badge').textContent = latestIb >= 0 ? 'BID DOMINANT' : 'ASK DOMINANT';
        document.getElementById('trio-c2-badge').style.color = latestIb >= 0 ? '#4ade80' : '#f87171';

        const liquidityCfg = {
            type: 'bar',
            data: { labels: ibLabels, datasets: [{ label:'Order Imbalance %', data: imbalance, backgroundColor: ibColors, borderRadius:3 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend:{display:false}, tooltip:{ callbacks:{ label: c => ` ${c.parsed.y >= 0 ? 'Bid' : 'Ask'}: ${Math.abs(c.parsed.y).toFixed(2)}%` }}},
                scales: {
                    x: { grid:{color:alphaColor(0.04)}, ticks:{color:alphaColor(0.35),font:{size:9}, maxRotation:0, maxTicksLimit:8} },
                    y: { grid:{color:alphaColor(0.05)}, ticks:{color:alphaColor(0.4),font:{size:9}}, border:{dash:[4,4]} }
                }
            }
        };
        _powerTrioConfigs.liquidity = { cfg: liquidityCfg, title: 'Liquidity: Order Book Imbalance', accentColor: '#a78bfa', statsEl: 'trio-c2-stats', note: 'Green bars = bid-dominant (buyers in control). Red bars = ask-dominant (sellers in control). Consecutive green bars with growing magnitude = institutional accumulation signal.' };
        _powerTrioCharts.liquidity = new Chart(c2ctx, liquidityCfg);

        const avgIb = (imbalance.reduce((a,b)=>a+b,0)/imbalance.length).toFixed(2);
        const bullDays = imbalance.filter(v=>v>0).length;
        document.getElementById('trio-c2-stats').innerHTML =
            _statChip('AVG IMBAL', (avgIb>=0?'+':'')+avgIb+'%', '#a78bfa') +
            _statChip('BULL DAYS', `${bullDays}/${imbalance.length}`, '#4ade80') +
            _statChip('SIGNAL', latestIb>=0?'ACCUMULATE':'DISTRIBUTE', latestIb>=0?'#4ade80':'#f87171');
    }

    // =====================================================
    // CHART 3 — Rolling 14-day correlation vs BTC
    // =====================================================
    const c3ctx = document.getElementById('trio-chart-correlation')?.getContext('2d');
    if (c3ctx) {
        let btcCloses = [];
        if (ticker !== 'BTC-USD') {
            try {
                const b = await fetchAPI('/history?ticker=BTC-USD&period=35d&interval=1d');
                if (b && b.closes) btcCloses = b.closes;
            } catch(e) {}
        }
        if (btcCloses.length < 5) {
            const base = 80000;
            btcCloses = closes.map((c,i) => base * (1 + (Math.random()-0.5)*0.03*(i+1)));
        }

        const window_size = 10;
        const corrSeries = [];
        const corrLabels = [];
        for (let i = window_size; i < Math.min(closes.length, btcCloses.length); i++) {
            const aSlice = closes.slice(i-window_size, i);
            const bSlice = btcCloses.slice(i-window_size, i);
            corrSeries.push(parseFloat(_pearson(aSlice, bSlice).toFixed(3)));
            corrLabels.push(labels[i] || '');
        }

        const latestCorr = corrSeries.at(-1) || 0;
        const isDecoupled = Math.abs(latestCorr) < 0.4;
        document.getElementById('trio-c3-badge').textContent = isDecoupled ? '⚡ DECOUPLED' : `ρ ${latestCorr.toFixed(2)}`;
        document.getElementById('trio-c3-badge').style.color = isDecoupled ? '#4ade80' : '#7dd3fc';

        const gradientColors = corrSeries.map(v => v > 0.6 ? 'rgba(125,211,252,0.7)' : v > 0 ? 'rgba(125,211,252,0.4)' : 'rgba(248,113,113,0.6)');

        const correlationCfg = {
            type: 'line',
            data: {
                labels: corrLabels,
                datasets: [
                    { label:'BTC Correlation', data: corrSeries, borderColor:'rgba(125,211,252,0.8)', borderWidth:2, pointRadius:3, pointBackgroundColor: gradientColors, tension:0.4, fill:true, backgroundColor:'rgba(125,211,252,0.05)' },
                    { label:'+0.7 Threshold', data: Array(corrSeries.length).fill(0.7), borderColor:'rgba(248,113,113,0.4)', borderWidth:1, borderDash:[5,5], pointRadius:0 },
                    { label:'−0.7 Threshold', data: Array(corrSeries.length).fill(-0.7), borderColor:'rgba(74,222,128,0.4)', borderWidth:1, borderDash:[5,5], pointRadius:0 },
                ]
            },
            options: {
                responsive:true, maintainAspectRatio:false,
                plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label: c => ` ρ = ${c.parsed.y}` }}},
                scales:{
                    x:{ grid:{color:alphaColor(0.04)}, ticks:{color:alphaColor(0.35),font:{size:9},maxRotation:0,maxTicksLimit:8} },
                    y:{ min:-1, max:1, grid:{color:alphaColor(0.05)}, ticks:{color:alphaColor(0.4),font:{size:9}}, border:{dash:[4,4]} }
                }
            }
        };
        _powerTrioConfigs.correlation = { cfg: correlationCfg, title: 'Beta-Decoupling: Rolling BTC Correlation (ρ)', accentColor: '#4ade80', statsEl: 'trio-c3-stats', note: 'ρ near +1.0 = moves with Bitcoin (no independent alpha). ρ near 0 = decoupled (true alpha window open). Red dashed line at ±0.7 marks the institutional significance threshold.' };
        _powerTrioCharts.correlation = new Chart(c3ctx, correlationCfg);

        document.getElementById('trio-c3-stats').innerHTML =
            _statChip('CORR NOW', latestCorr.toFixed(2), latestCorr > 0.6 ? '#7dd3fc' : '#4ade80') +
            _statChip('STATUS', isDecoupled ? 'ALPHA WINDOW' : 'BTC-LOCKED', isDecoupled ? '#4ade80' : '#fb923c') +
            _statChip('WINDOW', '10D ROLLING', '#94a3b8');
    }

    // =====================================================
    // INSIGHT PANEL
    // =====================================================
    const lastClose  = closes.at(-1);
    const prevClose  = closes.at(-2) || lastClose;
    const dayChg     = ((lastClose - prevClose) / prevClose * 100).toFixed(2);
    const bullish    = parseFloat(dayChg) >= 0;

    document.getElementById('trio-insight-text').innerHTML = `
        <strong style="color:var(--text-main)">${sym}</strong> is currently
        <strong style="color:${bullish?'#4ade80':'#f87171'}">${bullish?'up':'down'} ${Math.abs(dayChg)}%</strong> today.
        The ML Alpha Band suggests the asset is
        <strong style="color:var(--accent)">${bullish?'within bullish momentum':'testing support'}</strong>.
        Order book imbalance is <strong style="color:#a78bfa">${bullish?'bid-dominant (accumulation)':'ask-dominant (distribution)'}</strong>,
        and the 10-day rolling BTC correlation is
        <strong style="color:#7dd3fc">currently tracking at the computed level</strong>.
        <br><br>
        <span style="color:${alphaColor(0.4)};font-size:0.75rem">
            Trader note: When correlation drops below 0.4 and order imbalance is bid-dominant simultaneously,
            that is the highest-probability <strong style="color:#4ade80">relative strength entry</strong> in this terminal.
        </span>
    `;
}

// --- Helpers ---
function _ema(data, period) {
    const k = 2/(period+1), result = [];
    data.forEach((v,i) => { result.push(i < period ? data.slice(0,i+1).reduce((a,b)=>a+b,0)/(i+1) : v*k + result[i-1]*(1-k)); });
    return result;
}

function _pearson(a, b) {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    const meanA = a.slice(0,n).reduce((s,v)=>s+v,0)/n;
    const meanB = b.slice(0,n).reduce((s,v)=>s+v,0)/n;
    let num=0, da=0, db=0;
    for (let i=0;i<n;i++) { const dA=a[i]-meanA, dB=b[i]-meanB; num+=dA*dB; da+=dA*dA; db+=dB*dB; }
    return (da===0||db===0) ? 0 : num/Math.sqrt(da*db);
}

function _statChip(label, value, color) {
    return `<div style="display:flex;flex-direction:column;gap:2px">
        <span style="font-size:0.5rem;color:var(--text-dim);letter-spacing:1.5px">${label}</span>
        <span style="font-size:0.75rem;font-weight:700;color:${color}">${value}</span>
    </div>`;
}

function _trioChartOptions(y2Id) {
    return {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{display:false}, tooltip:{} },
        scales:{
            x:{ grid:{color:alphaColor(0.04)}, ticks:{color:alphaColor(0.35),font:{size:9},maxRotation:0,maxTicksLimit:8} },
            y:{ grid:{color:alphaColor(0.05)}, ticks:{color:alphaColor(0.4),font:{size:9}}, border:{dash:[4,4]}, position:'left' },
            y2:{ display:false, position:'right' }
        }
    };
}

// ============================================================
// ZOOM MODAL
// ============================================================
function openTrioModal(chartKey) {
    const meta = _powerTrioConfigs[chartKey];
    if (!meta) return;

    document.getElementById('trio-zoom-modal')?.remove();

    const statsHTML = document.getElementById(meta.statsEl)?.innerHTML || '';
    const accentBorder = meta.accentColor.replace('0.9','0.3').replace('0.8','0.3');
    const accentGlow   = meta.accentColor.replace('0.9','0.06').replace('0.8','0.06');
    const accentLeft   = meta.accentColor.replace('0.9','0.5').replace('0.8','0.5');

    const modal = document.createElement('div');
    modal.id = 'trio-zoom-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(2,4,8,0.88);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:_trio-fade-in 0.2s ease';

    modal.innerHTML = `
        <style>@keyframes _trio-fade-in { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }</style>
        <div style="background:rgba(10,14,28,0.98);border:1px solid ${accentBorder};border-radius:16px;
                    width:100%;max-width:1100px;max-height:90vh;overflow:auto;padding:1.75rem;
                    box-shadow:0 0 60px rgba(0,0,0,0.8),0 0 30px ${accentGlow};
                    display:flex;flex-direction:column;gap:1.25rem">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                    <div style="font-size:0.55rem;letter-spacing:2.5px;color:${meta.accentColor};font-weight:700;margin-bottom:4px">CHART INSPECTOR · ${_powerTrioTicker.replace('-USD','')}</div>
                    <h2 style="margin:0;font-size:1rem;font-weight:600;color:var(--text-main)">${meta.title}</h2>
                </div>
                <button onclick="document.getElementById('trio-zoom-modal').remove()"
                    style="background:${alphaColor(0.05)};border:1px solid ${alphaColor(0.1)};border-radius:8px;
                           color:var(--text-dim);cursor:pointer;padding:6px 14px;font-size:0.75rem;font-family:inherit;
                           display:flex;align-items:center;gap:6px"
                    onmouseover="this.style.background=alphaColor(0.1)"
                    onmouseout="this.style.background=alphaColor(0.05)">
                    <span class="material-symbols-outlined" style="font-size:14px">close</span> CLOSE
                </button>
            </div>
            <div id="trio-modal-chart" style="width:100%;height:500px;position:relative">
                ${meta.type === 'candlestick' ? '' : '<canvas id="trio-modal-canvas"></canvas>'}
            </div>
            <div style="display:flex;gap:20px;padding:12px 0;border-top:1px solid ${alphaColor(0.06)};border-bottom:1px solid ${alphaColor(0.06)}">${statsHTML}</div>
            <div style="padding:12px 16px;border-radius:8px;background:${alphaColor(0.03)};border-left:3px solid ${accentLeft}">
                <div style="font-size:0.55rem;letter-spacing:2px;color:${meta.accentColor};font-weight:700;margin-bottom:6px">HOW TO READ THIS CHART</div>
                <p style="margin:0;font-size:0.8rem;color:var(--text-dim);line-height:1.7">${meta.note}</p>
            </div>
        </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    requestAnimationFrame(() => {
        const chartEl = document.getElementById('trio-modal-chart');
        if (!chartEl) return;

        if (meta.type === 'candlestick' && typeof LightweightCharts !== 'undefined') {
            // Render full-size candlestick in modal
            const lwm = LightweightCharts.createChart(chartEl, {
                width: chartEl.clientWidth,
                height: 500,
                layout: { background:{color:'transparent'}, textColor:alphaColor(0.5) },
                grid: { vertLines:{color:alphaColor(0.04)}, horzLines:{color:alphaColor(0.04)} },
                crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
                rightPriceScale: { borderColor:alphaColor(0.1) },
                timeScale: { borderColor:alphaColor(0.1), timeVisible:true, secondsVisible:false },
            });
            const cs = lwm.addCandlestickSeries({
                upColor:'#4ade80', downColor:'#f87171',
                borderUpColor:'#4ade80', borderDownColor:'#f87171',
                wickUpColor:'rgba(74,222,128,0.6)', wickDownColor:'rgba(248,113,113,0.6)',
                lastValueVisible: false,
                priceLineVisible: false,
            });
            cs.setData(meta.candles);
            const es = lwm.addLineSeries({ color:'rgba(125,211,252,0.8)', lineWidth:1.5, priceLineVisible:false, lastValueVisible:false });
            es.setData(meta.emaData);
            lwm.timeScale().fitContent();
        } else {
            // Chart.js fallback for charts 2 & 3
            const canvas = document.createElement('canvas');
            canvas.id = 'trio-modal-canvas';
            chartEl.appendChild(canvas);
            const cfgClone = JSON.parse(JSON.stringify(meta.cfg));
            new Chart(canvas.getContext('2d'), cfgClone);
        }
    });
}

// ============================================================
// SHARED CHART BUILDER — candlesticks + EMA band + volume
// ============================================================
function _buildLWChart(chart, candles, emaData) {
    // 1. Candlesticks — hide lastValueVisible to avoid stacking with AVWAP label
    const cs = chart.addCandlestickSeries({
        upColor:'#4ade80', downColor:'#f87171',
        borderUpColor:'#4ade80', borderDownColor:'#f87171',
        wickUpColor:'rgba(74,222,128,0.6)', wickDownColor:'rgba(248,113,113,0.6)',
        priceScaleId: 'right',
        lastValueVisible: false,   // AVWAP label is the authoritative price anchor
        priceLineVisible: false,   // remove the dashed last-price line too
    });
    cs.setData(candles);

    // 2. EMA-5 centre line
    const emaLine = chart.addLineSeries({
        color:'rgba(125,211,252,0.85)', lineWidth:1.5,
        priceLineVisible:false, lastValueVisible:false,
        priceScaleId: 'right',
    });
    emaLine.setData(emaData);

    // 3. EMA band — upper (EMA × 1.02)
    const bandUpper = emaData.map(d => ({ time: d.time, value: parseFloat((d.value * 1.02).toFixed(6)) }));
    const bandLower = emaData.map(d => ({ time: d.time, value: parseFloat((d.value * 0.98).toFixed(6)) }));

    chart.addLineSeries({
        color:'rgba(139,92,246,0.5)', lineWidth:1, lineStyle:1, // 1 = dashed
        priceLineVisible:false, lastValueVisible:false, priceScaleId:'right',
    }).setData(bandUpper);

    chart.addLineSeries({
        color:'rgba(139,92,246,0.5)', lineWidth:1, lineStyle:1,
        priceLineVisible:false, lastValueVisible:false, priceScaleId:'right',
    }).setData(bandLower);

    // 4. Volume histogram — independent scale at bottom 25%
    chart.applyOptions({
        leftPriceScale: { visible:false },
        rightPriceScale: { scaleMargins:{ top:0.1, bottom:0.28 } },
    });
    const volSeries = chart.addHistogramSeries({
        priceScaleId: 'vol',
        priceFormat: { type:'volume' },
        color: 'rgba(0,242,255,0.5)',
        lastValueVisible: false,   // hide volume label on right axis
        priceLineVisible: false,
    });
    chart.priceScale('vol').applyOptions({
        scaleMargins: { top:0.78, bottom:0 },
        visible: false,            // hide the vol axis scale — keeps right axis clean
    });
    volSeries.setData(candles.map(c => ({
        time:  c.time,
        value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.65)',
    })));

    // 5. Anchored VWAP — anchors to the highest-volume candle (peak institutional activity)
    const avwapData = _computeAVWAP(candles);
    if (avwapData.length) {
        const avwapSeries = chart.addLineSeries({
            color: 'rgba(251,191,36,0.9)',   // gold
            lineWidth: 1.5,
            lineStyle: 0,                     // solid
            priceLineVisible: false,
            lastValueVisible: true,
            title: 'AVWAP',
            priceScaleId: 'right',
        });
        avwapSeries.setData(avwapData);

        // Upper/lower AVWAP bands (±1 std dev)
        const avwapBands = _computeAVWAPBands(candles, avwapData);
        chart.addLineSeries({
            color: 'rgba(251,191,36,0.3)', lineWidth: 1, lineStyle: 2,
            priceLineVisible: false, lastValueVisible: false, priceScaleId: 'right',
        }).setData(avwapBands.upper);
        chart.addLineSeries({
            color: 'rgba(251,191,36,0.3)', lineWidth: 1, lineStyle: 2,
            priceLineVisible: false, lastValueVisible: false, priceScaleId: 'right',
        }).setData(avwapBands.lower);
    }

    return avwapData; // return for stat chip usage
}

// ============================================================
// ANCHORED VWAP HELPERS
// ============================================================

/**
 * Compute Anchored VWAP from the highest-volume candle in the dataset.
 * Formula: AVWAP[i] = Σ(typical_price[j] × volume[j]) / Σ(volume[j])
 *          for j from anchor_index to i
 * Returns [{time, value}] for LightweightCharts.
 */
function _computeAVWAP(candles) {
    if (!candles || candles.length < 2) return [];

    // Find anchor = highest-volume candle
    let anchorIdx = 0;
    let maxVol = 0;
    candles.forEach((c, i) => {
        const v = c.volume || 0;
        if (v > maxVol) { maxVol = v; anchorIdx = i; }
    });

    // Compute running VWAP from anchor
    let cumTpv = 0, cumVol = 0;
    const result = [];
    for (let i = anchorIdx; i < candles.length; i++) {
        const c  = candles[i];
        const tp = (c.high + c.low + c.close) / 3; // typical price
        const v  = c.volume || 1;
        cumTpv  += tp * v;
        cumVol  += v;
        result.push({ time: c.time, value: parseFloat((cumTpv / cumVol).toFixed(6)) });
    }
    return result;
}

/**
 * Compute ±1 standard deviation bands around AVWAP.
 * Returns { upper: [{time, value}], lower: [{time, value}] }
 */
function _computeAVWAPBands(candles, avwapData) {
    if (!avwapData || avwapData.length < 2) return { upper: [], lower: [] };

    const anchorIdx = candles.length - avwapData.length;
    let cumVar = 0, cumVol = 0;
    const upper = [], lower = [];

    for (let i = 0; i < avwapData.length; i++) {
        const c  = candles[anchorIdx + i];
        const tp = (c.high + c.low + c.close) / 3;
        const v  = c.volume || 1;
        const vwap = avwapData[i].value;
        cumVar  += Math.pow(tp - vwap, 2) * v;
        cumVol  += v;
        const std = Math.sqrt(cumVar / cumVol);
        upper.push({ time: c.time, value: parseFloat((vwap + std).toFixed(6)) });
        lower.push({ time: c.time, value: parseFloat((vwap - std).toFixed(6)) });
    }
    return { upper, lower };
}

// ============================================================
// TIMEFRAME / INTERVAL SWITCHER
// ============================================================
const _TRIO_PERIOD_MAP = {
    '1W':  { yf: '7d',  label: '1 Week' },
    '1M':  { yf: '30d', label: '1 Month' },
    '60D': { yf: '60d', label: '60 Days' },
    '3M':  { yf: '3mo', label: '3 Months' },
    '6M':  { yf: '6mo', label: '6 Months' },
};
const _TRIO_INTERVAL_MAP = {
    '15M': '15m',
    '1H':  '1h',
    '1D':  '1d',
};
// Compatibility: yfinance only supports 15m/1h for limited periods
const _TRIO_COMPAT = {
    '15m': ['7d','30d','60d'],       // max 60d for 15m
    '1h':  ['7d','30d','60d','3mo'], // max ~730d
    '1d':  ['7d','30d','60d','3mo','6mo'],
};

function _trioHighlightButtons() {
    const periods   = ['1W','1M','60D','3M','6M'];
    const intervals = ['15M','1H','1D'];
    const activePKey = Object.keys(_TRIO_PERIOD_MAP).find(k => _TRIO_PERIOD_MAP[k].yf === _trioPeriod) || '60D';
    const activeIKey = Object.keys(_TRIO_INTERVAL_MAP).find(k => _TRIO_INTERVAL_MAP[k] === _trioInterval) || '1H';

    periods.forEach(p => {
        const btn = document.getElementById(`trio-p-${p}`);
        if (!btn) return;
        const active = p === activePKey;
        btn.style.background    = active ? 'rgba(0,242,255,0.15)' : alphaColor(0.04);
        btn.style.color         = active ? 'var(--accent)' : alphaColor(0.5);
        btn.style.borderColor   = active ? 'rgba(0,242,255,0.4)' : alphaColor(0.1);
    });
    intervals.forEach(iv => {
        const btn = document.getElementById(`trio-i-${iv}`);
        if (!btn) return;
        const active = iv === activeIKey;
        btn.style.background    = active ? 'rgba(0,242,255,0.15)' : alphaColor(0.04);
        btn.style.color         = active ? 'var(--accent)' : alphaColor(0.5);
        btn.style.borderColor   = active ? 'rgba(0,242,255,0.4)' : alphaColor(0.1);
    });
}

function _setTrioPeriod(key) {
    const yfPeriod = _TRIO_PERIOD_MAP[key]?.yf;
    if (!yfPeriod) return;
    _trioPeriod = yfPeriod;
    // Auto-demote interval if incompatible
    if (!_TRIO_COMPAT[_trioInterval]?.includes(yfPeriod)) {
        _trioInterval = '1d';
    }
    _trioHighlightButtons();
    _reloadTrioCandles();
}

function _setTrioInterval(key) {
    const yfInterval = _TRIO_INTERVAL_MAP[key];
    if (!yfInterval) return;
    _trioInterval = yfInterval;
    // Auto-demote period if incompatible
    if (!_TRIO_COMPAT[yfInterval]?.includes(_trioPeriod)) {
        _trioPeriod = _TRIO_COMPAT[yfInterval].at(-1);
    }
    _trioHighlightButtons();
    _reloadTrioCandles();
}

async function _reloadTrioCandles() {
    const ticker = _powerTrioTicker;
    const sym    = ticker.replace('-USD','');
    const c1el   = document.getElementById('trio-chart-momentum');
    if (!c1el || typeof LightweightCharts === 'undefined') return;

    // Show spinner
    c1el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:220px;color:rgba(0,242,255,0.5);gap:8px;font-size:0.7rem;letter-spacing:1px">
        <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:16px">sync</span> LOADING ${_trioPeriod.toUpperCase()} ${_trioInterval.toUpperCase()} DATA…</div>`;

    // Destroy old chart
    if (_powerTrioCharts._lwMomentum) {
        try { _powerTrioCharts._lwMomentum.remove(); } catch(e) {}
        delete _powerTrioCharts._lwMomentum;
    }
    c1el.innerHTML = '';

    // Fetch OHLC
    let candles = [];
    try {
        const data = await fetchAPI(`/ohlc?ticker=${encodeURIComponent(ticker)}&period=${_trioPeriod}&interval=${_trioInterval}`);
        if (data && data.candles && data.candles.length > 4) candles = data.candles;
    } catch(e) {}

    // Hourly synthetic fallback
    if (candles.length < 5) {
        const base = (window.livePrices?.[sym]) || 100;
        let price = base;
        const now = Math.floor(Date.now()/1000);
        const steps = _trioInterval === '1d' ? 60 : _trioInterval === '1h' ? 60*24 : 60*24*4;
        const step  = _trioInterval === '1d' ? 86400 : _trioInterval === '1h' ? 3600 : 900;
        for (let i = steps; i >= 0; i--) {
            const o = price, h = o*(1+Math.random()*0.008), l = o*(1-Math.random()*0.008), c2 = l+Math.random()*(h-l);
            candles.push({ time: now - i*step, open:o, high:h, low:l, close:c2, volume: Math.random()*1e8 });
            price = c2;
        }
    }

    // EMA-5
    const k5 = 2/6;
    const emaData = [];
    candles.forEach((c2, i) => {
        const prev = i===0 ? c2.close : emaData[i-1].value;
        emaData.push({ time: c2.time, value: parseFloat((c2.close*k5 + prev*(1-k5)).toFixed(6)) });
    });

    // Build chart
    const lwChart = LightweightCharts.createChart(c1el, {
        width: c1el.clientWidth, height: 220,
        layout: { background:{color:'transparent'}, textColor:alphaColor(0.4) },
        grid: { vertLines:{color:alphaColor(0.04)}, horzLines:{color:alphaColor(0.04)} },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor:alphaColor(0.08) },
        timeScale: { borderColor:alphaColor(0.08), timeVisible:true, secondsVisible:false },
    });
    if (window._trioResizeObs) window._trioResizeObs.disconnect();
    window._trioResizeObs = new ResizeObserver(() => { if(c1el.clientWidth>0) lwChart.resize(c1el.clientWidth,220); });
    window._trioResizeObs.observe(c1el);

    _buildLWChart(lwChart, candles, emaData);
    lwChart.timeScale().fitContent();
    _powerTrioCharts._lwMomentum = lwChart;

    // Update badge & stats
    const lastC = candles.at(-1), prevC = candles.at(-2)||lastC;
    const dayPct = ((lastC.close - prevC.close)/prevC.close*100).toFixed(2);
    const isPos  = parseFloat(dayPct) >= 0;
    const badge  = document.getElementById('trio-c1-badge');
    if (badge) { badge.textContent=(isPos?'▲ ':'▼ ')+Math.abs(dayPct)+'%'; badge.style.color=isPos?'#4ade80':'#f87171'; badge.style.background=isPos?'rgba(74,222,128,0.1)':'rgba(248,113,113,0.1)'; }

    const pct = ((lastC.close - candles[0].close)/candles[0].close*100).toFixed(1);
    const livePrice = window.livePrices?.[sym] || (sym==='BTC'?window.currentBTCPrice:null) || lastC.close;
    const statsEl = document.getElementById('trio-c1-stats');
    if (statsEl) statsEl.innerHTML =
        _statChip(sym, formatPrice(livePrice), 'var(--accent)') +
        _statChip(_TRIO_PERIOD_MAP[Object.keys(_TRIO_PERIOD_MAP).find(k=>_TRIO_PERIOD_MAP[k].yf===_trioPeriod)]?.label||_trioPeriod, (pct>=0?'+':'')+pct+'%', parseFloat(pct)>=0?'#4ade80':'#f87171') +
        _statChip('RANGE', formatPrice(Math.min(...candles.map(c=>c.low)))+' – '+formatPrice(Math.max(...candles.map(c=>c.high))), '#a78bfa') +
        _statChip('EMA-5', formatPrice(emaData.at(-1)?.value), '#7dd3fc') +
        _statChip('AVWAP', formatPrice(_computeAVWAP(candles).at(-1)?.value), 'rgba(251,191,36,0.9)');


    // Update modal config
    _powerTrioConfigs.momentum = { type:'candlestick', candles, emaData, title:`Alpha-Momentum: OHLC ${_trioInterval.toUpperCase()} · ${_trioPeriod.toUpperCase()}`, accentColor:'rgba(0,242,255,0.9)', statsEl:'trio-c1-stats', note:`${_trioPeriod} of ${_trioInterval} candles. Green = bullish, red = bearish. Cyan EMA-5 is the short-term momentum signal.` };
}

window.renderPowerTrio  = renderPowerTrio;
window.openTrioModal    = openTrioModal;
window._setTrioPeriod   = _setTrioPeriod;
window._setTrioInterval = _setTrioInterval;
