/**
 * Pattern Predictor v2
 * =====================
 * Multi-factor Composite Index dashboard with:
 *  - 1m / 1h / 1d timeframe tabs
 *  - Regime-conditioned pattern matching
 *  - Live accuracy scoreboard
 *  - On-chain factor gauges (MVRV, Whale Score)
 *  - Historical match table
 */

function renderPatternPredictor() {
    const app = appEl;
    if (!app) return;

    const REGIME_COLORS = {
        'TRENDING':     { bg: 'rgba(125,211,252,0.15)', border: 'rgba(125,211,252,0.5)', text: '#7dd3fc' },
        'ACCUMULATION': { bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.5)', text: '#818cf8' },
        'DISTRIBUTION': { bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.5)',  text: '#fb923c' },
        'VOLATILE':     { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.5)', text: '#f87171' },
        'BULL':         { bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.5)',  text: '#4ade80' },
        'BEAR':         { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.5)', text: '#f87171' },
    };
    function regimeStyle(r) {
        const k = Object.keys(REGIME_COLORS).find(k => (r||'').toUpperCase().includes(k));
        return REGIME_COLORS[k] || { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8' };
    }

    app.innerHTML = `
        <div class="view-header">
            <div>
                <h2 style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">System Intelligence</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">psychology</span>Pattern Predictor <span class="premium-badge">v2</span></h1>
                <p style="color:var(--text-dim);font-size:0.8rem;margin:4px 0 0">Multi-factor Composite Index · Regime-conditioned pattern matching · Live accuracy tracking</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <!-- Timeframe tabs -->
                <div style="display:flex;gap:4px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:3px">
                    <button id="pp-tf-1m" class="pp-tf-btn active" onclick="ppSetTimeframe('1m')">1m</button>
                    <button id="pp-tf-1h" class="pp-tf-btn" onclick="ppSetTimeframe('1h')">1h</button>
                    <button id="pp-tf-1d" class="pp-tf-btn" onclick="ppSetTimeframe('1d')">1d</button>
                </div>
                <!-- Regime filter toggle -->
                <label style="display:flex;align-items:center;gap:6px;font-size:0.7rem;color:var(--text-dim);cursor:pointer;padding:6px 10px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px">
                    <input type="checkbox" id="pp-regime-filter" checked onchange="ppRefresh()" style="accent-color:var(--accent)">
                    Regime filter
                </label>
                <button onclick="ppRefresh()" class="intel-action-btn mini" style="width:auto;padding:5px 12px;font-size:0.65rem;display:flex;align-items:center;gap:4px">
                    <span class="material-symbols-outlined" style="font-size:13px">refresh</span> REFRESH
                </button>
            </div>
        </div>

        <style>
            .pp-tf-btn {
                background:none;border:none;color:var(--text-dim);padding:4px 12px;
                border-radius:7px;cursor:pointer;font-size:0.7rem;font-weight:700;
                font-family:inherit;letter-spacing:0.5px;transition:all 0.15s;
            }
            .pp-tf-btn.active {
                background:var(--accent);color:#000;
            }
            .pp-tf-btn:hover:not(.active) { color:var(--text-main); background:rgba(255,255,255,0.06); }
            .pp-gauge-bar { height:6px;border-radius:100px;background:rgba(255,255,255,0.08);overflow:hidden;margin-top:4px }
            .pp-gauge-fill { height:100%;border-radius:100px;transition:width 0.6s ease }
            .pp-match-sim { height:4px;border-radius:100px;background:rgba(125,211,252,0.15) }
            .pp-match-sim-fill { height:100%;border-radius:100px;background:linear-gradient(90deg,rgba(125,211,252,0.4),var(--accent));transition:width 0.5s ease }
        </style>

        <!-- Accuracy Scoreboard -->
        <div id="pp-accuracy-panel" style="margin-bottom:1.5rem">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem">
                <span class="material-symbols-outlined" style="color:var(--accent);font-size:1rem">analytics</span>
                <span style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase">Prediction Accuracy</span>
                <span id="pp-accuracy-badge" style="font-size:0.5rem;padding:1px 6px;border-radius:100px;background:rgba(125,211,252,0.12);color:var(--accent);border:1px solid rgba(125,211,252,0.25)">LOADING...</span>
            </div>
            <div id="pp-accuracy-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem">
                <div class="glass-card" style="padding:1rem;text-align:center">
                    <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:4px">OVERALL ACCURACY</div>
                    <div id="pp-acc-overall" style="font-size:2rem;font-weight:900;color:var(--accent)">—</div>
                    <div id="pp-acc-n" style="font-size:0.6rem;color:var(--text-dim)">0 predictions resolved</div>
                </div>
                <div class="glass-card" style="padding:1rem">
                    <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:8px">BY REGIME</div>
                    <div id="pp-acc-regimes" style="display:flex;flex-direction:column;gap:6px;font-size:0.72rem"></div>
                </div>
                <div class="glass-card" style="padding:1rem">
                    <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:8px">LAST 5 PREDICTIONS</div>
                    <div id="pp-acc-recent" style="display:flex;flex-direction:column;gap:5px;font-size:0.7rem"></div>
                </div>
            </div>
        </div>

        <!-- Regime badge + CI Sparkline -->
        <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:1rem">
                <div>
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:4px">Composite Index</div>
                    <div style="display:flex;align-items:center;gap:10px">
                        <span id="pp-ci-value" style="font-size:2rem;font-weight:900;color:var(--accent)">—</span>
                        <div id="pp-regime-badge" style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:0.6rem;font-weight:900;letter-spacing:1px;background:rgba(148,163,184,0.1);border:1px solid rgba(148,163,184,0.2);color:#94a3b8">
                            <span class="material-symbols-outlined" style="font-size:11px">circle</span> —
                        </div>
                    </div>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);text-align:right">
                    <div id="pp-btc-price" style="font-size:1.1rem;font-weight:700;color:var(--text-main)">—</div>
                    <div>BTC Price</div>
                </div>
            </div>
            <div style="height:120px;position:relative">
                <canvas id="pp-sparkline" aria-label="Composite Index sparkline"></canvas>
            </div>
        </div>

        <!-- Factor Gauges -->
        <div style="margin-bottom:1.5rem">
            <div style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:0.75rem">Factor Gauges</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1rem" id="pp-gauges">
                <!-- injected by JS -->
            </div>
        </div>

        <!-- Prediction Panel + Matches -->
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:1.5rem;margin-bottom:1.5rem" id="pp-prediction-grid">
            <div class="glass-card" style="padding:1.5rem" id="pp-prediction-panel">
                <div style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:1rem">Prediction</div>
                <div id="pp-pred-content" style="display:flex;flex-direction:column;gap:12px">
                    <div style="text-align:center;color:var(--text-dim);font-size:0.8rem;padding:2rem 0">Loading...</div>
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <div style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:1rem">Best Historical Matches</div>
                <div id="pp-matches-table"></div>
            </div>
        </div>

        <!-- Recent CI ticks -->
        <div class="glass-card" style="padding:1.5rem">
            <div style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:1rem">Recent CI History</div>
            <div id="pp-ticks-table"></div>
        </div>
    `;

    // ── state ────────────────────────────────────────────────────────────────
    window._ppTimeframe = window._ppTimeframe || '1m';
    let _sparkChart = null;

    window.ppSetTimeframe = function(tf) {
        window._ppTimeframe = tf;
        ['1m','1h','1d'].forEach(t => {
            const btn = document.getElementById(`pp-tf-${t}`);
            if (btn) btn.classList.toggle('active', t === tf);
        });
        ppRefresh();
    };

    window.ppRefresh = function() {
        ppLoad();
        ppLoadPrediction();
        ppLoadAccuracy();
    };

    // ── sparkline + gauges ───────────────────────────────────────────────────
    async function ppLoad() {
        const tf    = window._ppTimeframe || '1m';
        const limit = tf === '1m' ? 120 : (tf === '1h' ? 72 : 30);
        try {
            const data = await fetchAPI(`/composite-index?timeframe=${tf}&limit=${limit}`);
            if (!data || !data.ticks || !data.ticks.length) return;
            const ticks = data.ticks;
            const last  = ticks[ticks.length - 1];

            // CI value
            const ciVal = parseFloat(last.ci_value || 0);
            const ciEl  = document.getElementById('pp-ci-value');
            if (ciEl) {
                ciEl.textContent = ciVal.toFixed(1);
                ciEl.style.color = ciVal > 10 ? '#4ade80' : ciVal < -10 ? '#f87171' : '#7dd3fc';
            }

            // BTC price
            const prEl = document.getElementById('pp-btc-price');
            if (prEl && last.btc_price) prEl.textContent = '$' + Number(last.btc_price).toLocaleString('en-US', {maximumFractionDigits:0});

            // Regime badge
            const regime = last.regime || 'Unknown';
            const rs     = regimeStyle(regime);
            const rb     = document.getElementById('pp-regime-badge');
            if (rb) {
                rb.textContent = '';
                rb.style.background = rs.bg;
                rb.style.borderColor = rs.border;
                rb.style.color = rs.text;
                rb.innerHTML = `<span class="material-symbols-outlined" style="font-size:11px">circle</span> ${regime}`;
            }

            // Sparkline
            const labels = ticks.map(t => t.ts ? t.ts.slice(11,16) : '');
            const values = ticks.map(t => parseFloat(t.ci_value || 0));
            const ctx    = document.getElementById('pp-sparkline');
            if (ctx) {
                if (_sparkChart) { _sparkChart.destroy(); _sparkChart = null; }
                if (typeof Chart !== 'undefined') {
                    _sparkChart = new Chart(ctx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [{
                                data: values,
                                borderColor: values.map((v, i) => i === values.length - 1 ? '#7dd3fc' : (v > 0 ? 'rgba(74,222,128,0.7)' : 'rgba(248,113,113,0.7)')),
                                borderWidth: 2,
                                pointRadius: 0,
                                fill: true,
                                backgroundColor: (ctx2) => {
                                    const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, 120);
                                    g.addColorStop(0, 'rgba(74,222,128,0.15)');
                                    g.addColorStop(0.5, 'rgba(125,211,252,0.05)');
                                    g.addColorStop(1, 'rgba(248,113,113,0.08)');
                                    return g;
                                },
                                tension: 0.4,
                            }]
                        },
                        options: {
                            responsive: true, maintainAspectRatio: false, animation: false,
                            plugins: { legend: { display: false }, tooltip: {
                                backgroundColor: 'rgba(9,12,20,0.95)',
                                callbacks: {
                                    label: c => `CI: ${c.raw.toFixed(2)}`
                                }
                            }},
                            scales: {
                                x: { display: false },
                                y: {
                                    grid: { color: 'rgba(255,255,255,0.04)' },
                                    ticks: { color: '#64748b', font: { size: 9 } },
                                    suggestedMin: -60, suggestedMax: 60,
                                }
                            }
                        }
                    });
                }
            }

            // Factor Gauges
            const gauges = [
                { label: 'RSI',         val: parseFloat(last.rsi||50),         min:0,   max:100,  unit:'',   low:30, high:70, invert:true },
                { label: 'BB Position', val: parseFloat(last.bb_pos||0.5)*100, min:0,   max:100,  unit:'%',  low:20, high:80, invert:true },
                { label: 'Fear & Greed',val: parseFloat(last.fear_greed||50),  min:0,   max:100,  unit:'',   low:25, high:75, invert:true },
                { label: 'Vol Change',  val: parseFloat(last.vol_change||0)*100,min:-100,max:100, unit:'%',  low:-30, high:30, invert:false },
                { label: 'MVRV Proxy',  val: parseFloat(last.mvrv_proxy||1.5), min:0,   max:4,    unit:'x',  low:1.0, high:3.0, invert:true },
                { label: 'Whale Score', val: parseFloat(last.whale_score||0)*100,min:-100,max:100,unit:'%',  low:-20, high:20, invert:false },
            ];
            const gaugeEl = document.getElementById('pp-gauges');
            if (gaugeEl) {
                gaugeEl.innerHTML = gauges.map(g => {
                    const pct   = Math.max(0, Math.min(100, ((g.val - g.min) / (g.max - g.min)) * 100));
                    const color = g.invert
                        ? (g.val > g.high ? '#f87171' : g.val < g.low ? '#4ade80' : '#7dd3fc')
                        : (g.val > g.high ? '#4ade80' : g.val < g.low ? '#f87171' : '#7dd3fc');
                    return `
                    <div class="glass-card" style="padding:0.9rem">
                        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">
                            <span style="font-size:0.6rem;color:var(--text-dim);font-weight:700;letter-spacing:0.5px">${g.label.toUpperCase()}</span>
                            <span style="font-size:0.85rem;font-weight:900;color:${color}">${g.val.toFixed(1)}${g.unit}</span>
                        </div>
                        <div class="pp-gauge-bar">
                            <div class="pp-gauge-fill" style="width:${pct}%;background:${color};opacity:0.8"></div>
                        </div>
                    </div>`;
                }).join('');
            }

            // Recent ticks table (only in 1m mode)
            const ticksEl = document.getElementById('pp-ticks-table');
            if (ticksEl) {
                const show = ticks.slice(-20).reverse();
                ticksEl.innerHTML = `
                <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-size:0.72rem">
                    <thead>
                        <tr style="color:var(--text-dim);font-size:0.58rem;letter-spacing:1px">
                            <th style="text-align:left;padding:4px 8px;border-bottom:1px solid var(--border)">TIME</th>
                            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--border)">CI</th>
                            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--border)">RSI</th>
                            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--border)">MVRV</th>
                            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--border)">WHALE</th>
                            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--border)">BTC</th>
                            <th style="text-align:right;padding:4px 8px;border-bottom:1px solid var(--border)">REGIME</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${show.map(t => {
                            const ci = parseFloat(t.ci_value||0);
                            const ciCol = ci > 10 ? '#4ade80' : ci < -10 ? '#f87171' : '#7dd3fc';
                            const rs2 = regimeStyle(t.regime||'');
                            return `<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">
                                <td style="padding:5px 8px;color:var(--text-dim);font-family:monospace">${(t.ts||'').slice(11,16)}</td>
                                <td style="padding:5px 8px;text-align:right;font-weight:700;color:${ciCol}">${ci.toFixed(1)}</td>
                                <td style="padding:5px 8px;text-align:right;color:var(--text-dim)">${parseFloat(t.rsi||0).toFixed(0)}</td>
                                <td style="padding:5px 8px;text-align:right;color:var(--text-dim)">${parseFloat(t.mvrv_proxy||0).toFixed(2)}x</td>
                                <td style="padding:5px 8px;text-align:right;color:${parseFloat(t.whale_score||0)>0?'#4ade80':'#f87171'}">${(parseFloat(t.whale_score||0)*100).toFixed(0)}%</td>
                                <td style="padding:5px 8px;text-align:right;color:var(--text-main)">$${Number(t.btc_price||0).toLocaleString('en-US',{maximumFractionDigits:0})}</td>
                                <td style="padding:5px 8px;text-align:right"><span style="font-size:0.55rem;padding:1px 6px;border-radius:4px;background:${rs2.bg};color:${rs2.text};border:1px solid ${rs2.border}">${t.regime||'—'}</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                </div>`;
            }
        } catch (e) {
            console.error('[PatternPredictor] load error:', e);
        }
    }

    // ── prediction panel ─────────────────────────────────────────────────────
    async function ppLoadPrediction() {
        const regimeFilter = document.getElementById('pp-regime-filter')?.checked ? '1' : '0';
        try {
            const data = await fetchAPI(`/market-prediction?lookback=30&top_n=5&regime_filter=${regimeFilter}`);
            if (!data) return;

            const predEl = document.getElementById('pp-pred-content');
            if (data.error) {
                const needed = data.rows_needed || 60;
                const have   = data.rows_available || 0;
                if (predEl) predEl.innerHTML = `
                    <div style="text-align:center;padding:1.5rem 0">
                        <div class="material-symbols-outlined" style="font-size:2rem;color:var(--text-dim);display:block;margin-bottom:8px">hourglass_top</div>
                        <div style="color:var(--text-dim);font-size:0.78rem;line-height:1.6">
                            Collecting data…<br>
                            <strong style="color:var(--text-main)">${have} / ${needed}</strong> minutes recorded
                        </div>
                        <div style="margin-top:12px;height:4px;border-radius:100px;background:rgba(255,255,255,0.06)">
                            <div style="height:100%;width:${Math.min(100,Math.round(have/needed*100))}%;background:var(--accent);border-radius:100px;transition:width 1s ease"></div>
                        </div>
                    </div>`;
                return;
            }

            const p       = data.prediction || {};
            const dir     = p.direction || 'NEUTRAL';
            const chg     = p.predicted_change || 0;
            const conf    = Math.round((p.confidence || 0) * 100);
            const dirCol  = dir === 'BULLISH' ? '#4ade80' : dir === 'BEARISH' ? '#f87171' : '#94a3b8';
            const dirIcon = dir === 'BULLISH' ? 'trending_up' : dir === 'BEARISH' ? 'trending_down' : 'trending_flat';
            const rfLabel = data.regime_filtered ? `<span style="font-size:0.55rem;color:var(--accent);background:rgba(125,211,252,0.1);padding:1px 6px;border-radius:4px;border:1px solid rgba(125,211,252,0.2)">REGIME MATCHED</span>` : '';

            if (predEl) predEl.innerHTML = `
                <div style="text-align:center;padding:0.5rem 0">
                    <span class="material-symbols-outlined" style="font-size:3rem;color:${dirCol}">${dirIcon}</span>
                    <div style="font-size:1.4rem;font-weight:900;color:${dirCol};margin:4px 0">${dir}</div>
                    <div style="font-size:0.75rem;color:var(--text-dim)">Expected move</div>
                    <div style="font-size:1.1rem;font-weight:700;color:${chg>0?'#4ade80':chg<0?'#f87171':'#94a3b8'}">${chg>=0?'+':''}${(chg*1).toFixed(3)}%</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
                    <div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:8px;padding:8px">
                        <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">CONFIDENCE</div>
                        <div style="font-size:1rem;font-weight:900;color:${conf>65?'#4ade80':conf>40?'#fb923c':'#f87171'}">${conf}%</div>
                    </div>
                    <div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:8px;padding:8px">
                        <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">MATCHES</div>
                        <div style="font-size:1rem;font-weight:900;color:var(--text-main)">${p.matches_found || 0}</div>
                    </div>
                </div>
                <div style="text-align:center;margin-top:4px">${rfLabel}</div>
                <div style="font-size:0.6rem;color:var(--text-dim);text-align:center">Lookback: ${p.lookback_minutes}m · History: ${data.history_size} ticks</div>
            `;

            // Matches table
            const matchEl = document.getElementById('pp-matches-table');
            if (matchEl && data.matches && data.matches.length) {
                const maxSim = Math.max(...data.matches.map(m => 1/(m.distance+0.01)));
                matchEl.innerHTML = data.matches.map((m, i) => {
                    const sim   = Math.round(1/(m.distance+0.01) / maxSim * 100);
                    const chgPct = m.price_change_pct || 0;
                    const chgCol = chgPct > 0 ? '#4ade80' : chgPct < 0 ? '#f87171' : '#94a3b8';
                    const rs2   = regimeStyle(m.regime||'');
                    return `
                    <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                            <div style="font-size:0.65rem;color:var(--text-dim);font-family:monospace">${(m.window_start||'').slice(0,16)} → ${(m.window_end||'').slice(11,16)}</div>
                            <div style="display:flex;align-items:center;gap:8px">
                                <span style="font-size:0.6rem;padding:1px 6px;border-radius:4px;background:${rs2.bg};color:${rs2.text};border:1px solid ${rs2.border}">${m.regime||'?'}</span>
                                <span style="font-size:0.75rem;font-weight:700;color:${chgCol}">${chgPct>=0?'+':''}${chgPct.toFixed(2)}%</span>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px">
                            <div class="pp-match-sim" style="flex:1"><div class="pp-match-sim-fill" style="width:${sim}%"></div></div>
                            <span style="font-size:0.6rem;color:var(--text-dim);width:38px;text-align:right">${sim}% sim</span>
                        </div>
                    </div>`;
                }).join('');
            } else if (matchEl) {
                matchEl.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;text-align:center;padding:2rem 0">No matches found yet — accumulating history…</div>';
            }
        } catch (e) {
            console.error('[PatternPredictor] prediction error:', e);
        }
    }

    // ── accuracy panel ───────────────────────────────────────────────────────
    async function ppLoadAccuracy() {
        try {
            const data = await fetchAPI('/predictor-accuracy');
            if (!data) return;

            const badge = document.getElementById('pp-accuracy-badge');
            if (badge) {
                badge.textContent = data.accuracy_pct != null
                    ? `${data.accuracy_pct}% ACCURACY`
                    : `${data.total_resolved||0} RESOLVED`;
            }

            const overallEl = document.getElementById('pp-acc-overall');
            if (overallEl) {
                overallEl.textContent = data.accuracy_pct != null ? `${data.accuracy_pct}%` : '—';
                overallEl.style.color = data.accuracy_pct > 60 ? '#4ade80' : data.accuracy_pct > 45 ? '#fb923c' : data.accuracy_pct != null ? '#f87171' : '#7dd3fc';
            }
            const nEl = document.getElementById('pp-acc-n');
            if (nEl) nEl.textContent = `${data.total_resolved||0} predictions resolved`;

            // By regime
            const regEl = document.getElementById('pp-acc-regimes');
            if (regEl) {
                if (data.by_regime && data.by_regime.length) {
                    regEl.innerHTML = data.by_regime.map(r => {
                        const rs2 = regimeStyle(r.regime||'');
                        return `<div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="color:${rs2.text}">${r.regime||'?'}</span>
                            <span style="font-weight:700;color:${r.accuracy_pct>60?'#4ade80':r.accuracy_pct>45?'#fb923c':'#f87171'}">${r.accuracy_pct}% <span style="color:var(--text-dim);font-weight:400">(${r.total})</span></span>
                        </div>`;
                    }).join('');
                } else {
                    regEl.innerHTML = '<span style="color:var(--text-dim);font-size:0.7rem">Accumulating data…</span>';
                }
            }

            // Recent predictions
            const recEl = document.getElementById('pp-acc-recent');
            if (recEl) {
                const recent = (data.recent || []).slice(0, 5);
                if (recent.length) {
                    recEl.innerHTML = recent.map(r => {
                        const icon = r.was_correct === 1 ? '✅' : r.was_correct === 0 ? '❌' : '⏳';
                        const dirCol = r.predicted_dir === 'BULLISH' ? '#4ade80' : r.predicted_dir === 'BEARISH' ? '#f87171' : '#94a3b8';
                        return `<div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="color:${dirCol};font-weight:700">${r.predicted_dir}</span>
                            <span style="color:var(--text-dim)">${(r.predicted_at||'').slice(11,16)}</span>
                            <span>${icon}</span>
                        </div>`;
                    }).join('');
                } else {
                    recEl.innerHTML = '<span style="color:var(--text-dim);font-size:0.7rem">First prediction logs in ~30 min…</span>';
                }
            }
        } catch (e) {
            console.error('[PatternPredictor] accuracy error:', e);
        }
    }

    // ── responsive grid ──────────────────────────────────────────────────────
    function ppSetGrid() {
        const grid = document.getElementById('pp-prediction-grid');
        if (grid) grid.style.gridTemplateColumns = window.innerWidth < 800 ? '1fr' : '1fr 2fr';
    }
    ppSetGrid();
    window.addEventListener('resize', ppSetGrid);

    // ── initial load ─────────────────────────────────────────────────────────
    ppLoad();
    ppLoadPrediction();
    ppLoadAccuracy();

    // Auto-refresh every 60s
    window._ppAutoRefresh = setInterval(() => {
        ppLoad();
        ppLoadPrediction();
        ppLoadAccuracy();
    }, 60000);
}
