/**
 * Pattern Predictor View
 * ========================
 * Renders the Composite Index Pattern Predictor dashboard.
 * Calls:
 *   GET /api/composite-index?limit=120  → sparkline of recent CI values
 *   GET /api/market-prediction?lookback=30&top_n=5 → pattern match + prediction
 */

function renderPatternPredictor() {
    const app = appEl;
    if (!app) return;

    app.innerHTML = `
    <div class="pp-shell" id="pp-shell">

        <!-- ── Header ── -->
        <div class="pp-header">
            <div class="pp-header-left">
                <span class="pp-icon material-symbols-outlined">psychology</span>
                <div>
                    <h1 class="pp-title">Composite Index Predictor</h1>
                    <p class="pp-subtitle">Market DNA fingerprinting · Pattern memory engine · Multi-factor signal fusion</p>
                </div>
            </div>
            <div class="pp-header-controls">
                <label class="pp-control-label">Lookback</label>
                <select id="pp-lookback" class="pp-select">
                    <option value="10">10 min</option>
                    <option value="20">20 min</option>
                    <option value="30" selected>30 min</option>
                    <option value="60">60 min</option>
                    <option value="120">120 min</option>
                </select>
                <button id="pp-refresh-btn" class="pp-btn-primary" onclick="ppRefresh()">
                    <span class="material-symbols-outlined" style="font-size:15px">refresh</span>
                    SCAN
                </button>
            </div>
        </div>

        <!-- ── Composite Index Sparkline ── -->
        <div class="pp-card pp-card-full">
            <div class="pp-card-header">
                <span class="material-symbols-outlined pp-card-icon" style="color:var(--accent,#00f2ff)">show_chart</span>
                <span class="pp-card-title">Live Composite Index  <span class="pp-badge pp-badge-live">● LIVE</span></span>
                <span id="pp-ci-current" class="pp-ci-badge">—</span>
            </div>
            <div class="pp-sparkline-wrap">
                <canvas id="pp-ci-chart" height="120"></canvas>
            </div>
        </div>

        <!-- ── Factor Gauges Row ── -->
        <div class="pp-gauges-row" id="pp-gauges-row">
            <div class="pp-gauge-card" id="pp-gauge-rsi">
                <div class="pp-gauge-label">RSI-14</div>
                <div class="pp-gauge-value" id="pp-rsi-val">—</div>
                <div class="pp-gauge-bar"><div class="pp-gauge-fill" id="pp-rsi-fill" style="width:50%;background:#facc15"></div></div>
                <div class="pp-gauge-note" id="pp-rsi-note">Loading…</div>
            </div>
            <div class="pp-gauge-card" id="pp-gauge-bb">
                <div class="pp-gauge-label">Bollinger Position</div>
                <div class="pp-gauge-value" id="pp-bb-val">—</div>
                <div class="pp-gauge-bar"><div class="pp-gauge-fill" id="pp-bb-fill" style="width:50%;background:#a78bfa"></div></div>
                <div class="pp-gauge-note" id="pp-bb-note">Loading…</div>
            </div>
            <div class="pp-gauge-card" id="pp-gauge-fg">
                <div class="pp-gauge-label">Fear &amp; Greed</div>
                <div class="pp-gauge-value" id="pp-fg-val">—</div>
                <div class="pp-gauge-bar"><div class="pp-gauge-fill" id="pp-fg-fill" style="width:50%;background:#fb923c"></div></div>
                <div class="pp-gauge-note" id="pp-fg-note">Loading…</div>
            </div>
            <div class="pp-gauge-card" id="pp-gauge-vol">
                <div class="pp-gauge-label">Vol Change</div>
                <div class="pp-gauge-value" id="pp-vol-val">—</div>
                <div class="pp-gauge-bar"><div class="pp-gauge-fill" id="pp-vol-fill" style="width:50%;background:#34d399"></div></div>
                <div class="pp-gauge-note" id="pp-vol-note">Loading…</div>
            </div>
            <div class="pp-gauge-card" id="pp-gauge-regime">
                <div class="pp-gauge-label">Market Regime</div>
                <div class="pp-gauge-value" id="pp-regime-val" style="font-size:1rem">—</div>
                <div class="pp-gauge-note" id="pp-regime-note" style="margin-top:8px">From HMM engine</div>
            </div>
        </div>

        <!-- ── Prediction Result ── -->
        <div class="pp-prediction-row">
            <div class="pp-pred-card" id="pp-pred-direction-card">
                <div class="pp-pred-icon material-symbols-outlined" id="pp-pred-icon">pending</div>
                <div class="pp-pred-label">Predicted Direction</div>
                <div class="pp-pred-value" id="pp-pred-direction">SCANNING…</div>
            </div>
            <div class="pp-pred-card">
                <div class="pp-pred-icon material-symbols-outlined" style="color:#a78bfa">trending_up</div>
                <div class="pp-pred-label">Expected Move</div>
                <div class="pp-pred-value" id="pp-pred-change">—</div>
            </div>
            <div class="pp-pred-card">
                <div class="pp-pred-icon material-symbols-outlined" style="color:#34d399">security</div>
                <div class="pp-pred-label">Match Confidence</div>
                <div class="pp-pred-value" id="pp-pred-confidence">—</div>
            </div>
            <div class="pp-pred-card">
                <div class="pp-pred-icon material-symbols-outlined" style="color:#facc15">database</div>
                <div class="pp-pred-label">History Depth</div>
                <div class="pp-pred-value" id="pp-pred-history">—</div>
            </div>
        </div>

        <!-- ── Top Matches ── -->
        <div class="pp-card pp-card-full">
            <div class="pp-card-header">
                <span class="material-symbols-outlined pp-card-icon" style="color:#a78bfa">compare_arrows</span>
                <span class="pp-card-title">Best Historical Pattern Matches</span>
                <span class="pp-badge" id="pp-match-count" style="background:rgba(167,139,250,0.15);color:#a78bfa">—</span>
            </div>
            <div id="pp-matches-table-wrap">
                <div class="pp-spinner-wrap"><span class="pp-spinner material-symbols-outlined">sync</span></div>
            </div>
        </div>

        <!-- ── CI History mini-table ── -->
        <div class="pp-card pp-card-full">
            <div class="pp-card-header">
                <span class="material-symbols-outlined pp-card-icon" style="color:#34d399">history</span>
                <span class="pp-card-title">Recent CI Ticks</span>
                <span class="pp-badge" id="pp-ticks-count" style="background:rgba(52,211,153,0.12);color:#34d399">—</span>
            </div>
            <div id="pp-ticks-wrap">
                <div class="pp-spinner-wrap"><span class="pp-spinner material-symbols-outlined">sync</span></div>
            </div>
        </div>

        <p class="pp-footnote">
            ⚡ Composite Index = weighted blend of RSI-14, Bollinger Band position, MACD, Volume spike,
            Fear &amp; Greed, market Z-score and BTC sentiment. One tick recorded per minute. Pattern
            matching uses Euclidean distance over the CI time-series window.
        </p>
    </div>

    <style>
    /* ── Shell ── */
    .pp-shell { max-width: 1400px; margin: 0 auto; padding: 24px 20px 60px; font-family: 'Inter', 'JetBrains Mono', monospace; }

    /* ── Header ── */
    .pp-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; }
    .pp-header-left { display: flex; align-items: center; gap: 14px; }
    .pp-icon { font-size: 36px; color: var(--accent, #00f2ff); filter: drop-shadow(0 0 10px rgba(0,242,255,0.5)); animation: pp-pulse 3s ease-in-out infinite; }
    @keyframes pp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.06)} }
    .pp-title { font-size: 1.5rem; font-weight: 900; letter-spacing: 1.5px; margin: 0; background: linear-gradient(135deg, #00f2ff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .pp-subtitle { font-size: 0.7rem; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin: 4px 0 0; text-transform: uppercase; }
    .pp-header-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .pp-control-label { font-size: 0.65rem; letter-spacing: 1px; color: rgba(255,255,255,0.4); text-transform: uppercase; }
    .pp-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(0,242,255,0.2); color: #fff; border-radius: 8px; padding: 6px 10px; font-size: 0.75rem; cursor: pointer; outline: none; }
    .pp-btn-primary { display: flex; align-items: center; gap: 6px; padding: 8px 18px; background: linear-gradient(135deg, rgba(0,242,255,0.15), rgba(167,139,250,0.15)); border: 1px solid rgba(0,242,255,0.3); color: var(--accent, #00f2ff); border-radius: 8px; font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px; cursor: pointer; transition: all .2s; }
    .pp-btn-primary:hover { background: linear-gradient(135deg, rgba(0,242,255,0.25), rgba(167,139,250,0.25)); border-color: rgba(0,242,255,0.6); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,242,255,0.2); }
    .pp-btn-primary:active { transform: translateY(0); }

    /* ── Cards ── */
    .pp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px 24px; margin-bottom: 16px; backdrop-filter: blur(12px); }
    .pp-card-full { width: 100%; box-sizing: border-box; }
    .pp-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .pp-card-icon { font-size: 20px; }
    .pp-card-title { font-size: 0.8rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.8); flex: 1; }
    .pp-badge { font-size: 0.65rem; font-weight: 900; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; }
    .pp-badge-live { background: rgba(34,197,94,0.15); color: #22c55e; animation: pp-live-blink 2s ease-in-out infinite; }
    @keyframes pp-live-blink { 0%,100%{opacity:1} 50%{opacity:.5} }
    .pp-ci-badge { font-size: 1.1rem; font-weight: 900; letter-spacing: 1px; padding: 4px 14px; border-radius: 8px; transition: all .3s; }

    /* ── Sparkline ── */
    .pp-sparkline-wrap { position: relative; height: 120px; }

    /* ── Gauge Row ── */
    .pp-gauges-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px; }
    @media (max-width: 900px) { .pp-gauges-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 500px) { .pp-gauges-row { grid-template-columns: 1fr; } }
    .pp-gauge-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px; transition: border-color .2s, transform .2s; }
    .pp-gauge-card:hover { border-color: rgba(0,242,255,0.3); transform: translateY(-2px); }
    .pp-gauge-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
    .pp-gauge-value { font-size: 1.4rem; font-weight: 900; color: #fff; margin-bottom: 8px; }
    .pp-gauge-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
    .pp-gauge-fill { height: 100%; border-radius: 4px; transition: width .6s cubic-bezier(.4,0,.2,1); }
    .pp-gauge-note { font-size: 0.62rem; letter-spacing: .5px; color: rgba(255,255,255,0.35); margin-top: 4px; }

    /* ── Prediction Row ── */
    .pp-prediction-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    @media (max-width: 700px) { .pp-prediction-row { grid-template-columns: repeat(2, 1fr); } }
    .pp-pred-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px 16px; text-align: center; transition: all .25s; position: relative; overflow: hidden; }
    .pp-pred-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center top, rgba(0,242,255,0.05), transparent 70%); pointer-events: none; }
    .pp-pred-card:hover { transform: translateY(-3px); border-color: rgba(0,242,255,0.25); }
    .pp-pred-icon { font-size: 28px; margin-bottom: 8px; display: block; }
    .pp-pred-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
    .pp-pred-value { font-size: 1.3rem; font-weight: 900; color: #fff; letter-spacing: 1px; }

    /* ── Matches Table ── */
    .pp-table { width: 100%; border-collapse: collapse; font-size: 0.72rem; }
    .pp-table th { text-align: left; padding: 8px 12px; font-size: 0.6rem; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: 700; }
    .pp-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); transition: background .15s; }
    .pp-table tr:hover td { background: rgba(0,242,255,0.03); }
    .pp-table .pp-match-dist { color: var(--accent,#00f2ff); font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .pp-match-bar { display: inline-block; height: 6px; border-radius: 3px; vertical-align: middle; margin-left: 6px; transition: width .4s; }
    .pp-change-pos { color: #22c55e; font-weight: 900; }
    .pp-change-neg { color: #ef4444; font-weight: 900; }
    .pp-change-neu { color: #facc15; font-weight: 900; }

    /* ── Ticks Table ── */
    .pp-ticks-scroll { max-height: 260px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(0,242,255,0.2) transparent; }

    /* ── Spinner ── */
    .pp-spinner-wrap { text-align: center; padding: 32px; }
    .pp-spinner { font-size: 28px; color: rgba(0,242,255,0.5); animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

    /* ── Footnote ── */
    .pp-footnote { font-size: 0.65rem; color: rgba(255,255,255,0.25); text-align: center; line-height: 1.7; margin-top: 24px; letter-spacing: .3px; }

    /* ── CI Direction colouring ── */
    .pp-bull { color: #22c55e !important; -webkit-text-fill-color: #22c55e !important; }
    .pp-bear { color: #ef4444 !important; -webkit-text-fill-color: #ef4444 !important; }
    .pp-neut { color: #facc15 !important; -webkit-text-fill-color: #facc15 !important; }
    </style>
    `;

    // Kick off data load
    ppLoad();

    // Auto-refresh every 60s
    if (window._ppAutoRefresh) clearInterval(window._ppAutoRefresh);
    window._ppAutoRefresh = setInterval(ppLoad, 60000);
}

// ── data loaders ──────────────────────────────────────────────────────────────

async function ppLoad() {
    try {
        await Promise.all([ppLoadCI(), ppLoadPrediction()]);
    } catch (e) {
        console.warn('[PatternPredictor] Load error:', e);
    }
}

async function ppRefresh() {
    const btn = document.getElementById('pp-refresh-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px;animation:spin 1s linear infinite">sync</span> SCANNING…`;
    }
    await ppLoad();
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px">refresh</span> SCAN`;
    }
}

async function ppLoadCI() {
    try {
        const res = await fetch('/api/composite-index?limit=120');
        const data = await res.json();
        if (!data || !data.history) return;
        ppRenderSparkline(data.history);
        ppRenderGauges(data.latest);
        ppRenderTicksTable(data.history);
        const ticksBadge = document.getElementById('pp-ticks-count');
        if (ticksBadge) ticksBadge.textContent = `${data.count} ticks`;
    } catch (e) {
        console.warn('[CI] fetch error:', e);
    }
}

async function ppLoadPrediction() {
    const lookback = parseInt(document.getElementById('pp-lookback')?.value || 30, 10);
    try {
        const res = await fetch(`/api/market-prediction?lookback=${lookback}&top_n=5`);
        const data = await res.json();
        ppRenderPrediction(data);
        ppRenderMatchesTable(data);
    } catch (e) {
        console.warn('[Prediction] fetch error:', e);
        ppRenderPrediction({ error: 'fetch_failed' });
    }
}

// ── renderers ─────────────────────────────────────────────────────────────────

let _ppChart = null;

function ppRenderSparkline(history) {
    const canvas = document.getElementById('pp-ci-chart');
    if (!canvas) return;

    const labels = history.map(r => r.ts ? r.ts.slice(11, 16) : '');
    const values = history.map(r => r.ci_value);

    // Colour gradient: green for positive, red for negative
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 120);
    const lastVal = values[values.length - 1] || 0;
    const isPos = lastVal >= 0;
    grad.addColorStop(0, isPos ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    const borderColor = isPos ? '#22c55e' : '#ef4444';

    if (_ppChart) { _ppChart.destroy(); _ppChart = null; }

    _ppChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: values,
                borderColor,
                backgroundColor: grad,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `CI: ${ctx.parsed.y.toFixed(2)}`,
                    },
                    backgroundColor: 'rgba(13,17,23,0.95)',
                    borderColor: 'rgba(0,242,255,0.2)',
                    borderWidth: 1,
                    titleColor: '#00f2ff',
                    bodyColor: '#fff',
                    titleFont: { family: 'JetBrains Mono, monospace', size: 10 },
                }
            },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', lineWidth: 1 },
                    ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 9 }, maxTicksLimit: 5 },
                }
            }
        }
    });

    // Update current CI badge
    const badge = document.getElementById('pp-ci-current');
    if (badge && lastVal !== undefined) {
        badge.textContent = lastVal.toFixed(2);
        badge.style.background = lastVal > 10 ? 'rgba(34,197,94,0.15)' :
                                  lastVal < -10 ? 'rgba(239,68,68,0.15)' :
                                  'rgba(250,204,21,0.12)';
        badge.style.color = lastVal > 10 ? '#22c55e' : lastVal < -10 ? '#ef4444' : '#facc15';
        badge.style.border = `1px solid ${lastVal > 10 ? 'rgba(34,197,94,0.3)' : lastVal < -10 ? 'rgba(239,68,68,0.3)' : 'rgba(250,204,21,0.2)'}`;
    }
}

function ppRenderGauges(latest) {
    if (!latest) return;

    // RSI
    const rsi = latest.rsi || 50;
    ppSetGauge('rsi', rsi.toFixed(1),
        `${rsi}%`, rsi < 30 ? '#22c55e' : rsi > 70 ? '#ef4444' : '#facc15',
        rsi < 30 ? 'Oversold — bullish reversal zone' : rsi > 70 ? 'Overbought — pullback risk' : 'Neutral territory');

    // Bollinger
    const bb = (latest.bb_pos || 0.5);
    ppSetGauge('bb', (bb * 100).toFixed(0) + '%',
        `${(bb * 100).toFixed(0)}%`, '#a78bfa',
        bb < 0.2 ? 'Near lower band — mean reversion signal' : bb > 0.8 ? 'Near upper band — stretched' : 'Mid-band range');

    // Fear & Greed
    const fg = latest.fear_greed || 50;
    ppSetGauge('fg', fg.toFixed(0),
        `${fg}%`, fg < 25 ? '#22c55e' : fg > 75 ? '#ef4444' : '#fb923c',
        fg < 25 ? 'Extreme Fear — contrarian buy' : fg > 75 ? 'Extreme Greed — caution' : 'Moderate sentiment');

    // Volume change
    const vc = (latest.vol_change || 0) * 100;
    const vcPct = Math.min(100, Math.abs(vc) * 5 + 50);
    ppSetGauge('vol', (vc >= 0 ? '+' : '') + vc.toFixed(1) + '%',
        `${vcPct}%`, vc > 5 ? '#22c55e' : vc < -5 ? '#ef4444' : '#34d399',
        vc > 10 ? 'Volume spike — momentum signal' : vc < -10 ? 'Volume drop — caution' : 'Normal volume');

    // Regime
    const regime = latest.regime || 'Unknown';
    const regEl = document.getElementById('pp-regime-val');
    const regNote = document.getElementById('pp-regime-note');
    if (regEl) {
        regEl.textContent = regime;
        regEl.style.color = regime.includes('BULL') || regime === 'Risk-On' ? '#22c55e' :
                            regime.includes('BEAR') || regime === 'Dislocation' ? '#ef4444' : '#facc15';
    }
    if (regNote) regNote.textContent = 'HMM market regime state';
}

function ppSetGauge(key, displayVal, fillPct, color, note) {
    const val  = document.getElementById(`pp-${key}-val`);
    const fill = document.getElementById(`pp-${key}-fill`);
    const noteEl = document.getElementById(`pp-${key}-note`);
    if (val) val.textContent = displayVal;
    if (fill) { fill.style.width = fillPct; fill.style.background = color; }
    if (noteEl) noteEl.textContent = note;
}

function ppRenderPrediction(data) {
    const dirEl    = document.getElementById('pp-pred-direction');
    const chgEl    = document.getElementById('pp-pred-change');
    const confEl   = document.getElementById('pp-pred-confidence');
    const histEl   = document.getElementById('pp-pred-history');
    const iconEl   = document.getElementById('pp-pred-icon');
    const cardEl   = document.getElementById('pp-pred-direction-card');

    if (data.error) {
        if (data.error === 'insufficient_history') {
            const need = data.rows_needed || 30;
            const have = data.rows_available || 0;
            if (dirEl) dirEl.textContent = 'BUILDING…';
            if (chgEl) chgEl.textContent = `${have}/${need * 2} ticks`;
            if (confEl) confEl.textContent = 'Need more data';
            if (histEl) histEl.textContent = `${have} rows`;
            if (iconEl) { iconEl.textContent = 'hourglass_empty'; iconEl.style.color = '#facc15'; }
        } else {
            if (dirEl) dirEl.textContent = 'ERROR';
            if (chgEl) chgEl.textContent = '—';
        }
        return;
    }

    const pred = data.prediction || {};
    const dir  = pred.direction || 'NEUTRAL';
    const chg  = pred.predicted_change || 0;
    const conf = pred.confidence || 0;
    const hist = data.history_size || 0;

    if (dirEl) {
        dirEl.textContent = dir;
        dirEl.className = 'pp-pred-value ' + (dir === 'BULLISH' ? 'pp-bull' : dir === 'BEARISH' ? 'pp-bear' : 'pp-neut');
    }
    if (iconEl) {
        iconEl.textContent = dir === 'BULLISH' ? 'arrow_upward' : dir === 'BEARISH' ? 'arrow_downward' : 'remove';
        iconEl.style.color  = dir === 'BULLISH' ? '#22c55e' : dir === 'BEARISH' ? '#ef4444' : '#facc15';
    }
    if (cardEl) {
        cardEl.style.borderColor = dir === 'BULLISH' ? 'rgba(34,197,94,0.3)' : dir === 'BEARISH' ? 'rgba(239,68,68,0.3)' : 'rgba(250,204,21,0.2)';
    }
    if (chgEl) {
        chgEl.textContent = (chg >= 0 ? '+' : '') + (chg * 100).toFixed(3) + '%';
        chgEl.className = 'pp-pred-value ' + (chg > 0.0005 ? 'pp-bull' : chg < -0.0005 ? 'pp-bear' : 'pp-neut');
    }
    if (confEl) confEl.textContent = (conf * 100).toFixed(1) + '%';
    if (histEl) histEl.textContent = hist.toLocaleString() + ' rows';
}

function ppRenderMatchesTable(data) {
    const wrap = document.getElementById('pp-matches-table-wrap');
    const badge = document.getElementById('pp-match-count');
    if (!wrap) return;

    const matches = data.matches || [];
    if (badge) badge.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;

    if (data.error === 'insufficient_history') {
        wrap.innerHTML = `<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.3);font-size:0.75rem;letter-spacing:1px">
            ⏳ BUILDING HISTORY — ${data.rows_available || 0} / ${(data.rows_needed || 30) * 2} ticks collected.<br>
            <span style="color:rgba(255,255,255,0.2);font-size:0.65rem">Pattern matching activates once enough 1-minute ticks are stored. Check back in a few hours.</span>
        </div>`;
        return;
    }

    if (!matches.length) {
        wrap.innerHTML = `<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.3);font-size:0.75rem;letter-spacing:1px">No matches found yet — history is accumulating.</div>`;
        return;
    }

    const maxDist = Math.max(...matches.map(m => m.distance), 1);

    const rows = matches.map((m, i) => {
        const chg = m.price_change_pct || 0;
        const chgClass = chg > 0.05 ? 'pp-change-pos' : chg < -0.05 ? 'pp-change-neg' : 'pp-change-neu';
        const chgStr = (chg >= 0 ? '+' : '') + chg.toFixed(3) + '%';
        const barW = Math.round((1 - m.distance / maxDist) * 100);
        const barColor = chg > 0 ? '#22c55e' : chg < 0 ? '#ef4444' : '#facc15';
        const similarity = Math.round((1 - m.distance / maxDist) * 100);
        return `<tr>
            <td style="color:rgba(255,255,255,0.4);font-size:0.65rem">Match #${i + 1}</td>
            <td class="pp-match-dist">${m.distance.toFixed(3)}
                <span class="pp-match-bar" style="width:${barW}px;background:${barColor}"></span>
            </td>
            <td style="font-size:0.68rem">${similarity}%</td>
            <td style="font-size:0.68rem;color:rgba(255,255,255,0.5)">${(m.window_start||'').slice(0,16).replace('T',' ')}</td>
            <td style="font-size:0.68rem;color:rgba(255,255,255,0.5)">${(m.window_end||'').slice(0,16).replace('T',' ')}</td>
            <td class="${chgClass}">${chgStr}</td>
            <td style="font-size:0.68rem;color:rgba(167,139,250,0.8)">${m.regime || '—'}</td>
        </tr>`;
    }).join('');

    wrap.innerHTML = `<div style="overflow-x:auto">
        <table class="pp-table">
            <thead><tr>
                <th>Rank</th>
                <th>Distance</th>
                <th>Similarity</th>
                <th>Window Start</th>
                <th>Window End</th>
                <th>BTC Move After</th>
                <th>Regime</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

function ppRenderTicksTable(history) {
    const wrap = document.getElementById('pp-ticks-wrap');
    if (!wrap || !history.length) return;

    const recent = [...history].reverse().slice(0, 60);
    const rows = recent.map(r => {
        const ci = r.ci_value || 0;
        const ciColor = ci > 10 ? '#22c55e' : ci < -10 ? '#ef4444' : '#facc15';
        const ciDir   = ci > 10 ? '↑' : ci < -10 ? '↓' : '→';
        return `<tr>
            <td style="font-size:0.65rem;color:rgba(255,255,255,0.4)">${(r.ts||'').slice(0,16).replace('T',' ')}</td>
            <td style="font-weight:900;color:${ciColor}">${ciDir} ${ci.toFixed(2)}</td>
            <td style="color:rgba(255,255,255,0.6)">${(r.rsi||0).toFixed(1)}</td>
            <td style="color:#a78bfa">${((r.bb_pos||0)*100).toFixed(0)}%</td>
            <td style="color:rgba(255,255,255,0.6)">${(r.fear_greed||50).toFixed(0)}</td>
            <td style="font-size:0.68rem;color:rgba(255,255,255,0.5)">${r.regime||'—'}</td>
            <td style="font-size:0.68rem;color:rgba(255,255,255,0.5)">$${(r.btc_price||0).toLocaleString('en-US',{maximumFractionDigits:0})}</td>
        </tr>`;
    }).join('');

    wrap.innerHTML = `<div class="pp-ticks-scroll"><table class="pp-table">
        <thead><tr>
            <th>Time (UTC)</th>
            <th>CI Value</th>
            <th>RSI</th>
            <th>BB Pos</th>
            <th>F&amp;G</th>
            <th>Regime</th>
            <th>BTC Price</th>
        </tr></thead>
        <tbody>${rows}</tbody>
    </table></div>`;
}
