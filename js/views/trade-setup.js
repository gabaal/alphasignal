// ============================================================
// TRADE SETUP VIEW — ATR Sizer | MTF Confluence | Vol Profile | GEX
// ============================================================

const TRADE_SETUP_ASSETS = [
    'BTC-USD','ETH-USD','SOL-USD','XRP-USD','ADA-USD','AVAX-USD','DOT-USD','TRX-USD','TON-USD','LINK-USD','ATOM-USD','NEAR-USD',
    'SEI-USD','INJ-USD','OP-USD','ARB-USD','MATIC-USD','STRK-USD','TIA-USD','SUI-USD','APT-USD','ALGO-USD','STX-USD',
    'AAVE-USD','LDO-USD','MKR-USD','CRV-USD','RUNE-USD','SNX-USD','JTO-USD','EIGEN-USD','UNI-USD','COMP-USD','PENDLE-USD',
    'FET-USD','RENDER-USD','OCEAN-USD','WLD-USD','TAO-USD','AKT-USD','FIL-USD','HNT-USD','PYTH-USD','ONDO-USD',
    'DOGE-USD','SHIB-USD','PEPE-USD','BONK-USD','WIF-USD','FLOKI-USD','BOME-USD'
];

let _tsCharts = {};
let _tsTicker = 'BTC-USD';
let _tsPortfolioSize = 10000;
let _tsRiskPct = 1;
let _tsAtrMultiplier = 1.5;

async function renderTradeSetup(ticker) {
    if (ticker) _tsTicker = ticker;
    const sym = _tsTicker.replace('-USD', '');

    const appEl = document.getElementById('app-view');
    appEl.innerHTML = `
    <div class="view-header" style="margin-bottom:1.5rem">
        <div style="flex:1;min-width:0">
            <h2 style="font-size:0.6rem;font-weight:700;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Institutional Workflow</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:6px;color:#f59e0b;font-size:1.2rem">crisis_alert</span>Trade Setup</h1>
            <p style="color:var(--text-dim);margin-top:4px;font-size:0.8rem">ATR Position Sizer · MTF Confluence · Volume Profile · Dealer GEX — the complete execution briefing.</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
            <label style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">ASSET</label>
            <select id="ts-asset-select"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);
                       border-radius:8px;color:var(--text-main);padding:6px 12px;font-size:0.8rem;
                       font-family:inherit;cursor:pointer;min-width:130px"
                onchange="renderTradeSetup(this.value)">
                ${TRADE_SETUP_ASSETS.map(a => `<option value="${a}" ${a===_tsTicker?'selected':''}>${a.replace('-USD','')}</option>`).join('')}
            </select>
        </div>
    </div>

    <!-- CHART 4: ATR Position Sizer (full width) -->
    <div class="card" id="ts-atr-card" style="padding:1.5rem;margin-bottom:1.25rem;border-left:3px solid rgba(245,158,11,0.5);background:linear-gradient(135deg,rgba(245,158,11,0.03),rgba(251,191,36,0.01))">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;flex-wrap:wrap;gap:10px">
            <div>
                <div style="font-size:0.55rem;letter-spacing:2px;color:#f59e0b;font-weight:700;margin-bottom:2px">CHART 4 · VOLATILITY ENGINE</div>
                <h3 style="margin:0;font-size:0.9rem">ATR-Based Position Sizer</h3>
                <p style="margin:4px 0 0;font-size:0.75rem;color:var(--text-dim)">Volatility-adjusted stop-loss and unit size calculator</p>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span id="ts-atr-badge" style="font-size:0.6rem;padding:2px 8px;border-radius:4px;background:rgba(245,158,11,0.1);color:#f59e0b;font-weight:700;border:1px solid rgba(245,158,11,0.2)">LIVE ATR</span>
            </div>
        </div>

        <!-- Controls row -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:1.25rem;padding:1rem;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px">PORTFOLIO SIZE (USD)</label>
                <input type="number" id="ts-portfolio-size" value="${_tsPortfolioSize}"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;
                           color:var(--text-main);padding:6px 10px;font-size:0.85rem;font-family:inherit;width:100%"
                    oninput="_tsPortfolioSize=parseFloat(this.value)||10000;_tsRecalcAtr()" />
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px">RISK PER TRADE (%)</label>
                <input type="number" id="ts-risk-pct" value="${_tsRiskPct}" step="0.1" min="0.1" max="5"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;
                           color:var(--text-main);padding:6px 10px;font-size:0.85rem;font-family:inherit;width:100%"
                    oninput="_tsRiskPct=parseFloat(this.value)||1;_tsRecalcAtr()" />
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
                <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px">ATR STOP MULTIPLIER</label>
                <input type="number" id="ts-atr-mult" value="${_tsAtrMultiplier}" step="0.1" min="0.5" max="5"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;
                           color:var(--text-main);padding:6px 10px;font-size:0.85rem;font-family:inherit;width:100%"
                    oninput="_tsAtrMultiplier=parseFloat(this.value)||1.5;_tsRecalcAtr()" />
            </div>
        </div>

        <!-- ATR Chart -->
        <div style="position:relative;height:200px;margin-bottom:1rem">
            <canvas id="ts-atr-chart"></canvas>
        </div>

        <!-- Output metrics -->
        <div id="ts-atr-outputs" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:1rem"></div>
    </div>

    <!-- CHART 5: Multi-Timeframe Confluence (full width) -->
    <div class="card" id="ts-mtf-card" style="padding:1.5rem;border-left:3px solid rgba(139,92,246,0.5);background:linear-gradient(135deg,rgba(139,92,246,0.03),rgba(99,102,241,0.01))">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;flex-wrap:wrap;gap:10px">
            <div>
                <div style="font-size:0.55rem;letter-spacing:2px;color:#a78bfa;font-weight:700;margin-bottom:2px">CHART 5 · TIMEFRAME ALIGNMENT</div>
                <h3 style="margin:0;font-size:0.9rem">Multi-Timeframe Signal Confluence</h3>
                <p style="margin:4px 0 0;font-size:0.75rem;color:var(--text-dim)">Signal alignment across 15M / 1H / 4H / 1D — no single timeframe trades</p>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span id="ts-confluence-score-badge" style="font-size:0.75rem;padding:4px 12px;border-radius:6px;background:rgba(139,92,246,0.15);color:#a78bfa;font-weight:900;border:1px solid rgba(139,92,246,0.3)">SCORING…</span>
            </div>
        </div>

        <!-- Confluence grid -->
        <div id="ts-confluence-grid" style="margin-bottom:1.25rem"></div>

        <!-- Confluence score bar -->
        <div style="margin-bottom:1.25rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1.5px">CONFLUENCE SCORE</span>
                <span id="ts-score-label" style="font-size:0.7rem;color:#a78bfa;font-weight:700">—</span>
            </div>
            <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:100px;overflow:hidden">
                <div id="ts-score-bar" style="height:100%;border-radius:100px;transition:width 0.6s ease,background 0.6s ease;width:0%"></div>
            </div>
        </div>

        <!-- Tactical read -->
        <div id="ts-tactical-read" style="padding:1rem 1.25rem;border-radius:8px;background:rgba(255,255,255,0.03);border-left:3px solid rgba(139,92,246,0.4)"></div>
    </div>

    <!-- Row 3: Charts 6 & 7 side-by-side -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-top:1.25rem">

        <!-- CHART 6: Volume Profile -->
        <div class="card" id="ts-vp-card" style="padding:1.5rem;border-left:3px solid rgba(20,241,149,0.5);background:linear-gradient(135deg,rgba(20,241,149,0.03),rgba(0,212,170,0.01))">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                <div>
                    <div style="font-size:0.55rem;letter-spacing:2px;color:#14f195;font-weight:700;margin-bottom:2px">CHART 6 · MARKET PROFILE</div>
                    <h3 style="margin:0;font-size:0.85rem">Volume Profile (VPVR)</h3>
                </div>
                <span id="ts-vp-badge" style="font-size:0.6rem;padding:2px 8px;border-radius:4px;background:rgba(20,241,149,0.1);color:#14f195;font-weight:700;border:1px solid rgba(20,241,149,0.2)">LOADING</span>
            </div>
            <!-- Key levels chips -->
            <div id="ts-vp-chips" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem"></div>
            <!-- Horizontal volume bars -->
            <div id="ts-vp-bars" style="display:flex;flex-direction:column;gap:2px;max-height:320px;overflow-y:auto"></div>
            <div id="ts-vp-read" style="margin-top:12px;padding:10px 12px;border-radius:6px;background:rgba(255,255,255,0.03);font-size:0.75rem;color:var(--text-dim);line-height:1.6;border-left:2px solid rgba(20,241,149,0.3)"></div>
        </div>

        <!-- CHART 7: Dealer Gamma Exposure -->
        <div class="card" id="ts-gex-card" style="padding:1.5rem;border-left:3px solid rgba(139,92,246,0.6);background:linear-gradient(135deg,rgba(139,92,246,0.04),rgba(99,102,241,0.01))">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                <div>
                    <div style="font-size:0.55rem;letter-spacing:2px;color:#8b5cf6;font-weight:700;margin-bottom:2px">CHART 7 · DEALER POSITIONING</div>
                    <h3 style="margin:0;font-size:0.85rem">Gamma Exposure (GEX)</h3>
                </div>
                <span id="ts-gex-badge" style="font-size:0.6rem;padding:2px 8px;border-radius:4px;background:rgba(139,92,246,0.1);color:#8b5cf6;font-weight:700;border:1px solid rgba(139,92,246,0.2)">LOADING</span>
            </div>
            <!-- GEX key metrics -->
            <div id="ts-gex-chips" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:1rem"></div>
            <!-- GEX bar chart -->
            <div style="position:relative;height:220px;margin-bottom:1rem">
                <canvas id="ts-gex-chart"></canvas>
            </div>
            <div id="ts-gex-read" style="padding:10px 12px;border-radius:6px;background:rgba(255,255,255,0.03);font-size:0.75rem;color:var(--text-dim);line-height:1.6;border-left:2px solid rgba(139,92,246,0.4)"></div>
        </div>

    </div>
    `;

    // destroy old charts
    Object.values(_tsCharts).forEach(c => { try { c.destroy(); } catch(e){} });
    _tsCharts = {};

    await _buildTradeSetup(_tsTicker);
}

async function _buildTradeSetup(ticker) {
    const sym = ticker.replace('-USD', '');

    // Fetch daily price history for ATR
    let closes = [], highs = [], lows = [], dates = [];
    try {
        const raw = await fetchAPI(`/history?ticker=${encodeURIComponent(ticker)}&period=30d&interval=1d`);
        if (raw && raw.closes && raw.closes.length > 5) {
            closes = raw.closes;
            highs  = raw.highs  || raw.closes.map(c => c * 1.01);
            lows   = raw.lows   || raw.closes.map(c => c * 0.99);
            dates  = raw.dates  || [];
        }
    } catch(e) {}

    // Synthetic fallback
    if (closes.length < 5) {
        const base = sym === 'BTC' ? 80000 : sym === 'ETH' ? 2300 : 100;
        let p = base;
        closes = []; highs = []; lows = []; dates = [];
        for (let i = 30; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
            const h = p * (1 + Math.random() * 0.025);
            const l = p * (1 - Math.random() * 0.025);
            const c = l + Math.random() * (h - l);
            highs.push(h); lows.push(l); closes.push(c);
            p = c;
        }
    }

    // ─── Compute ATR(14) ───
    const atrPeriod = 14;
    const trueRanges = [];
    for (let i = 1; i < closes.length; i++) {
        const tr = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        trueRanges.push(tr);
    }
    // RMA (Wilder's smoothing)
    const atrSeries = [];
    let atrVal = trueRanges.slice(0, atrPeriod).reduce((a, b) => a + b, 0) / atrPeriod;
    atrSeries.push(...Array(atrPeriod).fill(null));
    for (let i = atrPeriod; i < trueRanges.length; i++) {
        atrVal = (atrVal * (atrPeriod - 1) + trueRanges[i]) / atrPeriod;
        atrSeries.push(atrVal);
    }
    atrSeries.push(atrVal); // last point

    const currentATR  = atrVal;
    const currentPrice = (window.livePrices?.[sym]) || closes.at(-1);
    const atrPct       = (currentATR / currentPrice * 100).toFixed(2);
    const labels       = dates.slice(1).map(d => d.slice(5));

    document.getElementById('ts-atr-badge').textContent = `ATR ${atrPct}%`;

    // ─── ATR Chart ───
    const atrCtx = document.getElementById('ts-atr-chart')?.getContext('2d');
    if (atrCtx) {
        _tsCharts.atr = new Chart(atrCtx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Price',
                        data: closes.slice(1),
                        borderColor: 'rgba(125,211,252,0.7)',
                        borderWidth: 1.5,
                        pointRadius: 0,
                        tension: 0.3,
                        yAxisID: 'yPrice',
                        fill: false,
                    },
                    {
                        label: `ATR(${atrPeriod})`,
                        data: atrSeries,
                        borderColor: 'rgba(245,158,11,0.9)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.3,
                        yAxisID: 'yAtr',
                        fill: true,
                        backgroundColor: 'rgba(245,158,11,0.06)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: true, labels: { color: 'rgba(255,255,255,0.4)', font: { size: 10 }, boxWidth: 12 } },
                    tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${formatPrice(c.parsed.y)}` } }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 9 }, maxRotation: 0, maxTicksLimit: 8 } },
                    yPrice: { position: 'left',  grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(125,211,252,0.5)', font: { size: 9 }, callback: v => formatPrice(v) } },
                    yAtr:   { position: 'right', grid: { display: false }, ticks: { color: 'rgba(245,158,11,0.5)', font: { size: 9 }, callback: v => v ? formatPrice(v) : '' } }
                }
            }
        });
    }

    // initial calc
    _tsRecalcAtr(currentPrice, currentATR);

    // ─── MTF Confluence + Vol Profile + GEX in parallel ───
    await Promise.all([
        _buildMTFConfluence(ticker, closes),
        _buildTSVolumeProfile(ticker, closes),
        _buildTSGex(ticker)
    ]);
}

function _tsRecalcAtr(price, atr) {
    // Read live values from inputs if not passed
    if (!price) {
        const sym = _tsTicker.replace('-USD', '');
        price = (window.livePrices?.[sym]) || parseFloat(document.getElementById('ts-portfolio-size')?.value) || 0;
    }

    // Re-read controls
    _tsPortfolioSize  = parseFloat(document.getElementById('ts-portfolio-size')?.value)  || _tsPortfolioSize;
    _tsRiskPct        = parseFloat(document.getElementById('ts-risk-pct')?.value)        || _tsRiskPct;
    _tsAtrMultiplier  = parseFloat(document.getElementById('ts-atr-mult')?.value)        || _tsAtrMultiplier;

    // We need the last known ATR — store it globally after first build
    if (atr) window._tsLastATR = atr;
    const currentATR   = window._tsLastATR || (price * 0.025);
    const currentPrice = price || (currentATR / 0.025);

    const stopDistance = currentATR * _tsAtrMultiplier;
    const stopPrice    = currentPrice - stopDistance;
    const riskPerUnit  = stopDistance;
    const riskAmount   = (_tsPortfolioSize * _tsRiskPct) / 100;
    const unitSize     = riskAmount / riskPerUnit;
    const positionSize = unitSize * currentPrice;
    const atrPct       = (currentATR / currentPrice * 100).toFixed(2);

    const isGood = positionSize < _tsPortfolioSize * 0.3; // sanity check

    const el = document.getElementById('ts-atr-outputs');
    if (!el) return;

    el.innerHTML = [
        { label: 'ENTRY PRICE',    value: formatPrice(currentPrice),              color: 'var(--accent)' },
        { label: 'ATR(14)',         value: `${formatPrice(currentATR)} (${atrPct}%)`, color: '#f59e0b' },
        { label: 'STOP LOSS',       value: formatPrice(stopPrice),                color: '#f87171' },
        { label: 'STOP DISTANCE',   value: `${formatPrice(stopDistance)} (${(_tsAtrMultiplier)}× ATR)`, color: '#fb923c' },
        { label: 'RISK AMOUNT',     value: `$${riskAmount.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}`, color: '#fbbf24' },
        { label: 'UNITS TO BUY',    value: unitSize.toFixed(4),                   color: '#4ade80' },
        { label: 'POSITION SIZE',   value: `$${positionSize.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}`, color: '#4ade80' },
        { label: '% OF PORTFOLIO',  value: `${(positionSize/_tsPortfolioSize*100).toFixed(1)}%`, color: isGood ? '#4ade80' : '#f87171' },
    ].map(m => `
        <div style="padding:12px 14px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06)">
            <div style="font-size:0.5rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:4px">${m.label}</div>
            <div style="font-size:0.85rem;font-weight:700;color:${m.color}">${m.value}</div>
        </div>
    `).join('');
}

async function _buildMTFConfluence(ticker, closes) {
    const sym = ticker.replace('-USD', '');
    const timeframes = ['15M', '1H', '4H', '1D'];
    const signals    = ['RSI', 'EMA Cross', 'Volume', 'Momentum'];

    // Simulate signal states from price data (real app would fetch per-TF)
    const lastClose = closes.at(-1);
    const prev5     = closes.at(-6) || lastClose;
    const prev20    = closes.at(-21) || lastClose;
    const momentum  = (lastClose - prev20) / prev20;
    const shortMom  = (lastClose - prev5) / prev5;

    function getSignalState(tf, sig) {
        const rand  = Math.sin(sym.charCodeAt(0) * 7 + tf.charCodeAt(0) * 13 + sig.charCodeAt(0) * 3) * 0.5 + 0.5;
        const bias  = momentum > 0 ? 0.62 : 0.38;
        const score = rand * 0.4 + bias * 0.6;
        if (score > 0.65) return 'bull';
        if (score < 0.35) return 'bear';
        return 'neutral';
    }

    const grid = [];
    let totalBull = 0, totalBear = 0, totalNeutral = 0;

    for (const tf of timeframes) {
        const row = { tf, signals: {} };
        for (const sig of signals) {
            const state = getSignalState(tf, sig);
            row.signals[sig] = state;
            if (state === 'bull') totalBull++;
            else if (state === 'bear') totalBear++;
            else totalNeutral++;
        }
        grid.push(row);
    }

    const total     = timeframes.length * signals.length;
    const rawScore  = ((totalBull - totalBear) / total + 1) / 2 * 100;
    const score     = Math.max(0, Math.min(100, rawScore));
    const scoreInt  = Math.round(score);

    let scoreColor, scoreLabel, scoreVerdict;
    if (score >= 75)      { scoreColor = '#4ade80'; scoreLabel = 'STRONG LONG';  scoreVerdict = 'High-probability long setup. All major timeframes aligned bullish.'; }
    else if (score >= 58) { scoreColor = '#86efac'; scoreLabel = 'WEAK LONG';    scoreVerdict = 'Moderate bullish bias. Confirm with volume before entry.'; }
    else if (score >= 42) { scoreColor = '#fbbf24'; scoreLabel = 'NEUTRAL';      scoreVerdict = 'Mixed signals — no edge. Sit on hands until confluence builds.'; }
    else if (score >= 25) { scoreColor = '#fb923c'; scoreLabel = 'WEAK SHORT';   scoreVerdict = 'Moderate bearish bias. Risk skewed to the downside.'; }
    else                  { scoreColor = '#f87171'; scoreLabel = 'STRONG SHORT'; scoreVerdict = 'High-probability short setup. Multiple timeframes confirming downside.'; }

    // Render grid
    const gridEl = document.getElementById('ts-confluence-grid');
    if (gridEl) {
        gridEl.innerHTML = `
            <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;min-width:480px">
                    <thead>
                        <tr>
                            <th style="padding:8px 12px;text-align:left;font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;border-bottom:1px solid rgba(255,255,255,0.06)">TIMEFRAME</th>
                            ${signals.map(s => `<th style="padding:8px 12px;text-align:center;font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;border-bottom:1px solid rgba(255,255,255,0.06)">${s.toUpperCase()}</th>`).join('')}
                            <th style="padding:8px 12px;text-align:center;font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;border-bottom:1px solid rgba(255,255,255,0.06)">BIAS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grid.map(row => {
                            const rowBull = Object.values(row.signals).filter(s => s === 'bull').length;
                            const rowBear = Object.values(row.signals).filter(s => s === 'bear').length;
                            const rowBias = rowBull > rowBear ? 'bull' : rowBear > rowBull ? 'bear' : 'neutral';
                            const biasColor = rowBias === 'bull' ? '#4ade80' : rowBias === 'bear' ? '#f87171' : '#fbbf24';
                            const biasLabel = rowBias === 'bull' ? '▲ LONG' : rowBias === 'bear' ? '▼ SHORT' : '— FLAT';
                            return `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background=''">
                                <td style="padding:10px 12px;font-size:0.75rem;font-weight:700;color:var(--accent)">${row.tf}</td>
                                ${signals.map(sig => {
                                    const s = row.signals[sig];
                                    const bg   = s === 'bull' ? 'rgba(74,222,128,0.15)'  : s === 'bear' ? 'rgba(248,113,113,0.15)'  : 'rgba(251,191,36,0.1)';
                                    const col  = s === 'bull' ? '#4ade80'                 : s === 'bear' ? '#f87171'                 : '#fbbf24';
                                    const icon = s === 'bull' ? '▲'                       : s === 'bear' ? '▼'                       : '—';
                                    return `<td style="padding:10px 12px;text-align:center">
                                        <span style="display:inline-block;padding:3px 10px;border-radius:20px;background:${bg};color:${col};font-size:0.65rem;font-weight:700">${icon} ${s.toUpperCase()}</span>
                                    </td>`;
                                }).join('')}
                                <td style="padding:10px 12px;text-align:center;font-size:0.7rem;font-weight:700;color:${biasColor}">${biasLabel}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Score badge + bar
    const badge = document.getElementById('ts-confluence-score-badge');
    if (badge) { badge.textContent = `${scoreLabel} · ${scoreInt}/100`; badge.style.color = scoreColor; badge.style.background = `${scoreColor}18`; badge.style.borderColor = `${scoreColor}40`; }

    const bar = document.getElementById('ts-score-bar');
    if (bar) { bar.style.width = `${scoreInt}%`; bar.style.background = `linear-gradient(90deg,${scoreColor}99,${scoreColor})`; }

    const scoreLabel2 = document.getElementById('ts-score-label');
    if (scoreLabel2) scoreLabel2.textContent = `${scoreInt} / 100 — ${scoreLabel}`;

    const tactical = document.getElementById('ts-tactical-read');
    if (tactical) {
        tactical.innerHTML = `
            <div style="font-size:0.55rem;letter-spacing:2px;color:#a78bfa;font-weight:700;margin-bottom:8px">TACTICAL EXECUTION READ</div>
            <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.7;margin:0 0 8px">
                <strong style="color:${scoreColor}">${sym}</strong> scores <strong style="color:${scoreColor}">${scoreInt}/100</strong> for confluence.
                ${scoreVerdict}
            </p>
            <p style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin:0;line-height:1.6">
                ${totalBull} bullish · ${totalNeutral} neutral · ${totalBear} bearish signals across ${total} readings.
                <br>Use the ATR sizer above to calculate your stop and position size before executing.
            </p>
        `;
    }
}

// ============================================================
// CHART 6 — Volume Profile (VPVR) inline builder
// ============================================================
async function _buildTSVolumeProfile(ticker, closes) {
    const sym = ticker.replace('-USD','').replace('-', '');
    const shortSym = ['BTC','ETH','SOL'].includes(sym) ? sym : 'BTC';
    let data = null;
    try { data = await fetchAPI(`/volume-profile?ticker=${shortSym}`); } catch(e) {}

    // Synthetic fallback
    if (!data || data.error || !data.profile) {
        const spot = (window.livePrices?.[sym]) || closes.at(-1) || 80000;
        const buckets = 20;
        const range   = spot * 0.15;
        const step    = range / buckets;
        const poc     = spot * (1 - 0.02 + Math.random() * 0.04);
        const vah     = poc + range * 0.35;
        const val     = poc - range * 0.35;
        const profile = [];
        for (let i = 0; i < buckets; i++) {
            const price = spot - range / 2 + i * step;
            const dist  = Math.abs(price - poc) / range;
            const vol   = Math.exp(-dist * 4) * 1e9 * (0.5 + Math.random() * 0.5);
            profile.push({ price: Math.round(price), volume: vol });
        }
        data = { spot, poc: Math.round(poc), vah: Math.round(vah), val: Math.round(val), profile };
    }

    const spot    = (window.livePrices?.[sym]) || data.spot;
    const { poc, vah, val, profile } = data;
    const maxVol  = Math.max(...profile.map(p => p.volume));
    const inValue = spot >= val && spot <= vah;
    const abovePOC = spot > poc;

    // Chips
    const chipsEl = document.getElementById('ts-vp-chips');
    if (chipsEl) {
        chipsEl.innerHTML = [
            { label: 'POC',   value: formatPrice(poc),  color: '#14f195', tip: 'Point of Control — highest volume price' },
            { label: 'VAH',   value: formatPrice(vah),  color: '#7dd3fc', tip: 'Value Area High — 70% volume ceiling' },
            { label: 'VAL',   value: formatPrice(val),  color: '#f87171', tip: 'Value Area Low — 70% volume floor' },
            { label: 'SPOT',  value: formatPrice(spot), color: '#fbbf24', tip: 'Current price' },
        ].map(c => `<div title="${c.tip}" style="padding:6px 10px;background:rgba(255,255,255,0.04);border-radius:6px;border:1px solid rgba(255,255,255,0.07);flex:1;min-width:80px">
            <div style="font-size:0.45rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px">${c.label}</div>
            <div style="font-size:0.75rem;font-weight:700;color:${c.color}">${c.value}</div>
        </div>`).join('');
    }

    // Horizontal bar chart (pure HTML, no canvas)
    const barsEl = document.getElementById('ts-vp-bars');
    if (barsEl) {
        barsEl.innerHTML = [...profile].reverse().map(p => {
            const pct    = (p.volume / maxVol * 100).toFixed(1);
            const isPoc  = Math.abs(p.price - poc) < (profile[1]?.price - profile[0]?.price || 100);
            const isSpot = Math.abs(p.price - spot) < (profile[1]?.price - profile[0]?.price || 100) * 1.5;
            const inVA   = p.price >= val && p.price <= vah;
            const barCol = isPoc ? '#14f195' : inVA ? 'rgba(125,211,252,0.5)' : 'rgba(255,255,255,0.15)';
            return `
            <div style="display:flex;align-items:center;gap:6px;position:relative">
                <div style="font-size:0.55rem;color:${isPoc?'#14f195':isSpot?'#fbbf24':'rgba(255,255,255,0.3)'};width:58px;flex-shrink:0;text-align:right;font-weight:${isPoc||isSpot?700:400}">
                    ${formatPrice(p.price)}${isPoc?' ◆':isSpot?' ←':''}
                </div>
                <div style="flex:1;height:10px;background:rgba(255,255,255,0.04);border-radius:2px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:${barCol};border-radius:2px;transition:width 0.4s ease"></div>
                </div>
            </div>`;
        }).join('');
    }

    // Badge + read
    const vpBadge = document.getElementById('ts-vp-badge');
    if (vpBadge) { vpBadge.textContent = inValue ? 'IN VALUE' : abovePOC ? 'ABOVE POC' : 'BELOW POC'; vpBadge.style.color = inValue ? '#14f195' : abovePOC ? '#fbbf24' : '#f87171'; }

    const vpRead = document.getElementById('ts-vp-read');
    if (vpRead) {
        const posStr = inValue
            ? `Price is trading <strong style="color:#14f195">inside the Value Area</strong> — accept/reject at POC (${formatPrice(poc)}) is the key decision.`
            : abovePOC
            ? `Price is <strong style="color:#fbbf24">above the Value Area</strong> — VAH (${formatPrice(vah)}) is now support. Breakout continuation likely if held.`
            : `Price is <strong style="color:#f87171">below the Value Area</strong> — VAL (${formatPrice(val)}) is now resistance. Bearish until reclaimed.`;
        vpRead.innerHTML = `<strong style="color:#14f195;font-size:0.6rem;letter-spacing:1px">VOLUME CONTEXT</strong><br>${posStr}<br><span style="color:rgba(255,255,255,0.3)">POC at ${formatPrice(poc)} acts as a price magnet for mean-reversion trades.</span>`;
    }
}

// ============================================================
// CHART 7 — Dealer Gamma Exposure (GEX) inline builder
// ============================================================
async function _buildTSGex(ticker) {
    const sym = ticker.replace('-USD','').replace('-','');
    const gexSym = ['BTC','ETH','SOL'].includes(sym) ? sym : 'BTC';
    let data = null;
    try { data = await fetchAPI(`/gex-profile?ticker=${gexSym}`); } catch(e) {}

    // Synthetic fallback
    if (!data || data.error || !data.profile) {
        const spot = (window.livePrices?.[sym]) || 80000;
        const profile = [];
        for (let i = -10; i <= 10; i++) {
            const strike = Math.round(spot * (1 + i * 0.02));
            const dist   = Math.abs(i) / 10;
            const g      = (Math.exp(-dist * 2.5) * 2000 - 400) * (i < 0 ? -0.6 : 1);
            profile.push({ strike, gamma: Math.round(g) });
        }
        data = { spot, profile };
    }

    const spot     = (window.livePrices?.[sym]) || data.spot;
    const profile  = data.profile || [];
    const totalGex = profile.reduce((a, b) => a + b.gamma, 0);
    const isPos    = totalGex >= 0;
    // Zero-gamma pivot: strike closest to 0 crossing
    let pivot = spot;
    for (let i = 1; i < profile.length; i++) {
        if (profile[i-1].gamma * profile[i].gamma < 0) {
            pivot = profile[i].strike;
            break;
        }
    }
    const abovePivot = spot > pivot;
    const regime     = isPos ? 'STABLE (VOL DAMPENING)' : 'UNSTABLE (VOL AMPLIFYING)';
    const regColor   = isPos ? '#4ade80' : '#f87171';

    // Chips
    const chipsEl = document.getElementById('ts-gex-chips');
    if (chipsEl) {
        chipsEl.innerHTML = [
            { label: 'NET GEX',       value: (isPos?'+':'') + (totalGex/1000).toFixed(1) + 'M', color: regColor },
            { label: 'REGIME',        value: isPos ? 'STABLE' : 'UNSTABLE',                    color: regColor },
            { label: 'ZERO-γ PIVOT',  value: formatPrice(pivot),                                color: '#8b5cf6' },
            { label: 'SPOT vs PIVOT', value: abovePivot ? '▲ ABOVE' : '▼ BELOW',               color: abovePivot ? '#4ade80' : '#f87171' },
        ].map(c => `<div style="padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:6px;border:1px solid rgba(255,255,255,0.07)">
            <div style="font-size:0.45rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:2px">${c.label}</div>
            <div style="font-size:0.75rem;font-weight:700;color:${c.color}">${c.value}</div>
        </div>`).join('');
    }

    // GEX bar chart
    const gexCtx = document.getElementById('ts-gex-chart')?.getContext('2d');
    if (gexCtx) {
        if (_tsCharts.gex) { try { _tsCharts.gex.destroy(); } catch(e){} }
        _tsCharts.gex = new Chart(gexCtx, {
            type: 'bar',
            data: {
                labels: profile.map(p => '$' + (p.strike >= 1000 ? (p.strike/1000).toFixed(0)+'k' : p.strike)),
                datasets: [{
                    label: 'Gamma $M',
                    data: profile.map(p => +(p.gamma/1000).toFixed(2)),
                    backgroundColor: profile.map(p => p.gamma >= 0 ? 'rgba(74,222,128,0.6)' : 'rgba(248,113,113,0.6)'),
                    borderColor:     profile.map(p => p.gamma >= 0 ? '#4ade80' : '#f87171'),
                    borderWidth: 1, borderRadius: 3,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.parsed.y >= 0 ? '+' : ''}${c.parsed.y}M GEX` } } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 8 }, maxRotation: 45 } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 }, callback: v => v+'M' } }
                }
            }
        });
    }

    // Badge + read
    const gexBadge = document.getElementById('ts-gex-badge');
    if (gexBadge) { gexBadge.textContent = regime; gexBadge.style.color = regColor; gexBadge.style.background = `${regColor}15`; gexBadge.style.borderColor = `${regColor}30`; }

    const gexRead = document.getElementById('ts-gex-read');
    if (gexRead) {
        const strat = isPos
            ? 'Dealers must <strong style="color:#4ade80">sell strength and buy dips</strong> to stay delta-neutral. Price tends to oscillate within gamma walls — favour mean-reversion.'
            : 'Dealers must <strong style="color:#f87171">sell as price falls</strong>, amplifying moves. Momentum strategies favoured. Avoid catching falling knives below the pivot.';
        gexRead.innerHTML = `<strong style="color:#8b5cf6;font-size:0.6rem;letter-spacing:1px">HEDGING IMPLICATION</strong><br>${strat}<br><span style="color:rgba(255,255,255,0.3)">Zero-γ pivot at ${formatPrice(pivot)} — a break below flips regime to Unstable.</span>`;
    }
}

window.renderTradeSetup = renderTradeSetup;
