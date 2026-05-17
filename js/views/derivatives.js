// ===========================================================
// DERIVATIVES INTELLIGENCE HUB
// 5 Sub-tabs: Funding Rate Heatmap | Options Flow | GEX Profile | Vol Surface | Options Max Pain
// ===========================================================

const derivativesTabs = [
    { id: 'funding-heatmap',  label: 'FUNDING HEATMAP',  icon: 'local_fire_department' },
    { id: 'options-flow',     label: 'OPTIONS FLOW',     icon: 'ssid_chart' },
    { id: 'gex-profile',      label: 'GEX PROFILE',      icon: 'bar_chart_4_bars' },
    { id: 'vol-surface',      label: 'VOL SURFACE',      icon: 'view_in_ar' },
    { id: 'max-pain',         label: 'MAX PAIN',         icon: 'crisis_alert' },
];

function renderDerivativesHub() {
    const appEl = document.getElementById('app-view');
    if (!appEl) return;

    let activeMode = sessionStorage.getItem('deriv-mode') || 'funding-heatmap';

    window._derivSwitch = function(mode) {
        sessionStorage.setItem('deriv-mode', mode);
        renderDerivativesHub();
    };

    const navHTML = '<div style="display:flex; gap:10px; margin-bottom:2rem; border-bottom:1px solid rgba(125,211,252,0.15); padding-bottom:12px; overflow-x:auto; scrollbar-width:none;">' +
        derivativesTabs.map(t =>
            '<button class="intel-action-btn ' + (activeMode === t.id ? '' : 'outline') + '"' +
            ' onclick="window._derivSwitch(\'' + t.id + '\')"' +
            ' style="white-space:nowrap; flex-shrink:0; padding:8px 16px; font-size:0.7rem; display:flex; align-items:center; gap:6px; border-radius:8px; font-weight:900">' +
            '<span class="material-symbols-outlined" style="font-size:16px">' + t.icon + '</span>' + t.label +
            '</button>'
        ).join('') +
    '</div>';

    appEl.innerHTML =
        '<div class="view-header">' +
            '<div>' +
                '<h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Execution Hub</h2>' +
                '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">candlestick_chart</span>Derivatives Intelligence <span class="premium-badge">LIVE</span></h1>' +
            '</div>' +
        '</div>' +
        '<div style="margin-bottom:1rem">' + navHTML + '</div>' +
        '<div id="deriv-display" style="min-height:600px"></div>';

    const display = document.getElementById('deriv-display');

    if (activeMode === 'funding-heatmap') {
        renderFundingHeatmap(display);
    } else if (activeMode === 'options-flow') {
        renderOptionsFlowInDeriv(display);
    } else if (activeMode === 'gex-profile') {
        renderGexInDeriv(display);
    } else if (activeMode === 'vol-surface') {
        renderVolSurfaceInDeriv(display);
    } else if (activeMode === 'max-pain') {
        renderMaxPainInDeriv(display);
    }
}

// ===========================================================
// FUNDING RATE HEATMAP
// Cross-asset perpetual funding rate matrix
// ===========================================================

const FUNDING_ASSETS = ['BTC', 'ETH', 'SOL', 'XRP', 'AVAX', 'DOGE', 'LINK', 'BNB', 'ADA', 'DOT'];

async function renderFundingHeatmap(display) {
    display.innerHTML =
        '<div class="card" style="padding:1.5rem">' +
            '<div class="card-header" style="margin-bottom:1.5rem">' +
                '<div>' +
                    '<h2>Funding Rate Heatmap</h2>' +
                    '<div style="font-size:0.6rem;color:var(--text-dim);margin-top:4px">CROSS-ASSET PERPETUAL FUNDING — OVERCROWDED POSITIONING DETECTOR</div>' +
                '</div>' +
                '<div style="display:flex;gap:10px;align-items:center">' +
                    '<span class="label-tag" style="background:rgba(0,242,255,0.1);color:var(--accent);border-color:rgba(0,242,255,0.2)">BINANCE FAPI</span>' +
                    '<span id="funding-update-time" style="font-size:0.6rem;color:var(--text-dim)">Fetching...</span>' +
                '</div>' +
            '</div>' +

            // Summary legend
            '<div style="display:flex;gap:20px;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap">' +
                '<div style="display:flex;align-items:center;gap:6px"><div style="width:14px;height:14px;background:#ef4444;border-radius:3px;opacity:0.8"></div><span style="font-size:0.65rem;color:var(--text-dim)">HIGH POSITIVE (Longs Overpaying)</span></div>' +
                '<div style="display:flex;align-items:center;gap:6px"><div style="width:14px;height:14px;background:#22c55e;border-radius:3px;opacity:0.8"></div><span style="font-size:0.65rem;color:var(--text-dim)">HIGH NEGATIVE (Shorts Overpaying)</span></div>' +
                '<div style="display:flex;align-items:center;gap:6px"><div style="width:14px;height:14px;background:rgba(255,255,255,0.1);border-radius:3px;border:1px solid rgba(255,255,255,0.2)"></div><span style="font-size:0.65rem;color:var(--text-dim)">NEUTRAL</span></div>' +
            '</div>' +

            // Heatmap grid placeholder
            '<div id="funding-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">' +
                FUNDING_ASSETS.map(() =>
                    '<div style="height:100px;background:rgba(255,255,255,0.03);border-radius:10px;animation:pulse-dim 1.5s infinite"></div>'
                ).join('') +
            '</div>' +

            // Stats row
            '<div id="funding-stats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-top:1.5rem;padding:1rem;background:rgba(255,255,255,0.02);border-radius:8px"></div>' +
        '</div>';

    try {
        const data = await fetchAPI('/funding-rates');
        if (!data || data.error) return;

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeEl = document.getElementById('funding-update-time');
        if (timeEl) {
            const src = data.source === 'binance_fapi' ? 'BINANCE FAPI' : 'SYNTHETIC';
            timeEl.textContent = 'Updated ' + now + ' · ' + src;
        }

        const grid = document.getElementById('funding-grid');
        if (!grid) return;

        // API returns: { assets, hours, rows: [{asset, current, annual, live}], source }
        const rows = Array.isArray(data.rows) ? data.rows : [];
        if (!rows.length) { grid.innerHTML = '<div style="color:var(--text-dim);padding:2rem">No funding data received.</div>'; return; }

        const maxAbs = Math.max(...rows.map(r => Math.abs(parseFloat(r.current || 0))), 0.001);

        grid.innerHTML = rows.map(r => {
            // API: { asset: "BTC", current: 0.0100 (percent), annual: 10.95, live: true }
            const rate      = parseFloat(r.current || 0);  // already in %, e.g. 0.01 = 0.01%
            const pct       = rate.toFixed(4);
            const annual    = parseFloat(r.annual || 0).toFixed(1);
            const sym       = r.asset || '?';
            const absRate   = Math.abs(rate);
            // maxAbs is also in %, so threshold of 0.02 = 0.02% (~neutral zone)
            const intensity = Math.min(absRate / maxAbs, 1);
            const isLive    = r.live ? '' : ' opacity:0.6;';

            let bg, textColor, label;
            if (rate > 0.02) {
                bg        = 'rgba(239,68,68,' + (0.15 + intensity * 0.65) + ')';
                textColor = '#fca5a5';
                label     = 'LONGS CROWDED';
            } else if (rate < -0.02) {
                bg        = 'rgba(34,197,94,' + (0.15 + intensity * 0.65) + ')';
                textColor = '#86efac';
                label     = 'SHORTS CROWDED';
            } else {
                bg        = 'rgba(255,255,255,0.04)';
                textColor = 'rgba(255,255,255,0.5)';
                label     = 'NEUTRAL';
            }

            const ticker = sym + '-USD';
            return '<div style="background:' + bg + ';border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 14px;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;' + isLive + '" ' +
                    'onclick="openDetail(\'' + ticker + '\',\'EXCHANGE\',0,0,0,\'60d\',false)" ' +
                    'title="Click to open ' + sym + ' Intelligence" ' +
                    'onmouseover="this.style.transform=\'scale(1.03)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.4)\'" ' +
                    'onmouseout="this.style.transform=\'scale(1)\';this.style.boxShadow=\'none\'">' +
                '<div style="font-size:0.85rem;font-weight:900;letter-spacing:1px;color:var(--text);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between">' +
                    '<span>' + sym + (r.live ? '' : ' <span style="font-size:0.45rem;color:var(--text-dim)">SYN</span>') + '</span>' +
                    '<span class="material-symbols-outlined" style="font-size:13px;color:rgba(0,242,255,0.5)">open_in_new</span>' +
                '</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:' + textColor + ';font-family:\'JetBrains Mono\'">' + (rate >= 0 ? '+' : '') + pct + '%</div>' +
                '<div style="font-size:0.55rem;color:rgba(255,255,255,0.4);margin-top:2px">' + (rate >= 0 ? '+' : '') + annual + '% ann.</div>' +
                '<div style="font-size:0.55rem;font-weight:800;letter-spacing:1px;color:' + textColor + ';margin-top:8px;opacity:0.9">' + label + '</div>' +
            '</div>';
        }).join('');

        // Stats
        const positive = rows.filter(r => parseFloat(r.current) > 0.02);
        const negative = rows.filter(r => parseFloat(r.current) < -0.02);
        const avgRate  = rows.reduce((s, r) => s + parseFloat(r.current || 0), 0) / (rows.length || 1);
        const maxRate  = rows.reduce((a, r) => Math.abs(parseFloat(r.current || 0)) > Math.abs(parseFloat(a.current || 0)) ? r : a, rows[0] || {});

        const statsEl = document.getElementById('funding-stats');
        if (statsEl) {
            statsEl.innerHTML =
                '<div style="text-align:center"><div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:4px">LONGS CROWDED</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:#ef4444">' + positive.length + ' / ' + rows.length + '</div></div>' +

                '<div style="text-align:center"><div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:4px">SHORTS CROWDED</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:#22c55e">' + negative.length + ' / ' + rows.length + '</div></div>' +

                '<div style="text-align:center"><div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:4px">AVG FUNDING</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:' + (avgRate >= 0 ? '#ef4444' : '#22c55e') + '">' + (avgRate >= 0 ? '+' : '') + avgRate.toFixed(4) + '%</div></div>' +

                '<div style="text-align:center"><div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:4px">HOTTEST PERP</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:var(--accent)">' + (maxRate.asset || '—') + '</div></div>';
        }

    } catch (e) {
        console.error('Funding Heatmap Error:', e);
        const grid = document.getElementById('funding-grid');
        if (grid) grid.innerHTML = '<div style="color:var(--text-dim);padding:2rem;font-size:0.8rem">Failed to load funding data: ' + e.message + '</div>';
    }
}

// ===========================================================
// OPTIONS FLOW — Inline (preserves Derivatives hub nav)
// ===========================================================
function renderOptionsFlowInDeriv(display) {
    display.innerHTML =
        '<div style="margin-bottom:1rem">' +
            '<div style="font-size:0.55rem;letter-spacing:1.5px;color:var(--text-dim);font-weight:700;margin-bottom:6px">DERIBIT <span style="color:#00f2ff">LIVE</span></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
                '<button id="opts-btc-btn" class="intel-action-btn mini" onclick="loadOptionsFlow(\'BTC\',\'deribit\')" style="background:linear-gradient(135deg,#f7931a,#ff6b00);color:#fff">BTC</button>' +
                '<button id="opts-eth-btn" class="intel-action-btn mini outline" onclick="loadOptionsFlow(\'ETH\',\'deribit\')" style="border-color:rgba(98,126,234,0.5);color:#627eea">ETH</button>' +
                '<button id="opts-sol-btn" class="intel-action-btn mini outline" onclick="loadOptionsFlow(\'SOL\',\'deribit\')" style="border-color:rgba(20,241,149,0.5);color:#14f195">SOL</button>' +
                '<button id="opts-xrp-btn" class="intel-action-btn mini outline" onclick="loadOptionsFlow(\'XRP\',\'deribit\')" style="border-color:rgba(0,160,255,0.5);color:#00a0ff">XRP</button>' +
                '<button id="opts-avax-btn" class="intel-action-btn mini outline" onclick="loadOptionsFlow(\'AVAX\',\'deribit\')" style="border-color:rgba(232,65,66,0.5);color:#e84142">AVAX</button>' +
            '</div>' +
            '<div style="font-size:0.55rem;letter-spacing:1.5px;color:var(--text-dim);font-weight:700;margin-bottom:6px">EQUITY PROXIES <span style="color:#f59e0b">CBOE</span></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<button id="opts-mara-btn" class="intel-action-btn mini outline" onclick="loadOptionsFlow(\'MARA\',\'equity\')" style="border-color:rgba(245,158,11,0.5);color:#f59e0b">MARA</button>' +
                '<button id="opts-coin-btn" class="intel-action-btn mini outline" onclick="loadOptionsFlow(\'COIN\',\'equity\')" style="border-color:rgba(245,158,11,0.5);color:#f59e0b">COIN</button>' +
                '<button id="opts-mstr-btn" class="intel-action-btn mini outline" onclick="loadOptionsFlow(\'MSTR\',\'equity\')" style="border-color:rgba(245,158,11,0.5);color:#f59e0b">MSTR</button>' +
            '</div>' +
        '</div>' +
        '<div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem;position:relative;overflow:hidden">' +
            '<div style="position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,#60a5fa,#8b5cf6,#ec4899)"></div>' +
            '<div style="font-size:0.7rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:12px;display:flex;align-items:center;gap:6px">' +
                '<span class="material-symbols-outlined" style="font-size:16px;color:#8b5cf6">psychology</span> AI OPTION SYNTHESIS' +
            '</div>' +
            '<div id="opts-ai-synthesis" style="font-size:0.85rem;line-height:1.6;color:var(--text-main)"><div class="ai-typing" style="height:40px"></div></div>' +
        '</div>' +
        '<div id="opts-summary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:1.5rem">' +
            ['Put/Call Ratio','Max Pain','Exp Move','25-D Skew','ATM IV','IV Rank','Call OI','Put OI'].map(s =>
                '<div class="glass-card" style="padding:1rem;text-align:center"><div style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:4px">' + s + '</div>' +
                '<div class="opts-stat" id="opts-' + s.toLowerCase().replace(/[^a-z0-9]/g,'-') + '" style="font-size:1.2rem;font-weight:800;color:var(--accent)">--</div></div>'
            ).join('') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">' +
            '<div class="glass-card" style="padding:1.5rem"><div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">IV SMILE (±30% STRIKES)</div><div style="position:relative;height:220px"><canvas id="opts-smile-chart"></canvas></div></div>' +
            '<div class="glass-card" style="padding:1.5rem"><div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">IV TERM STRUCTURE (ATM)</div><div style="position:relative;height:220px"><canvas id="opts-term-chart"></canvas></div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 2fr;gap:1.5rem;margin-bottom:1.5rem">' +
            '<div class="glass-card" style="padding:1.5rem"><div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">PUT / CALL VOL SPLIT</div><div style="position:relative;height:220px;display:flex;justify-content:center"><canvas id="opts-pcr-chart" style="max-width:220px"></canvas></div></div>' +
            '<div class="glass-card" style="padding:1.5rem"><div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">GAMMA EXPOSURE (GEX) PROFILE</div><div style="position:relative;height:220px"><canvas id="opts-gex-chart"></canvas></div></div>' +
        '</div>' +
        '<div class="glass-card" style="padding:1.5rem">' +
            '<div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">TOP STRIKES BY OPEN INTEREST</div>' +
            '<div class="table-responsive-wrapper"><table style="width:100%;border-collapse:separate;border-spacing:0 3px;font-size:0.75rem">' +
                '<thead><tr style="color:var(--text-dim)">' + ['Strike','Type','Expiry','IV %','Volume','Open Interest'].map(h => '<th style="text-align:left;padding:6px 10px;font-size:0.6rem;letter-spacing:1px">' + h + '</th>').join('') + '</tr></thead>' +
                '<tbody id="opts-strikes-table"><tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--text-dim)">Loading Deribit data...</td></tr></tbody>' +
            '</table></div>' +
        '</div>';

    // Trigger the existing data loader from onchain.js
    if (typeof loadOptionsFlow === 'function') {
        loadOptionsFlow('BTC', 'deribit');
    }
}

// ===========================================================
// GEX PROFILE — Inline
// ===========================================================
function renderGexInDeriv(display) {
    if (typeof renderGexProfile === 'function') {
        renderGexProfile(null, display);
    } else {
        display.innerHTML = '<div style="padding:2rem;color:var(--text-dim)">GEX Profile module unavailable.</div>';
    }
}

// ===========================================================
// VOLATILITY SURFACE — Inline
// ===========================================================
async function renderVolSurfaceInDeriv(display) {
    const sym = (sessionStorage.getItem('vol-surf-sym') || 'BTC');

    display.innerHTML =
        '<div class="card" style="padding:1.5rem">' +
            '<div class="card-header" style="margin-bottom:1.5rem">' +
                '<div><h2>Implied Volatility Surface</h2>' +
                '<div style="font-size:0.6rem;color:var(--text-dim);margin-top:4px">MONEYNESS × EXPIRY × IMPLIED VOL (DERIBIT / PARAMETRIC FALLBACK)</div></div>' +
                '<div style="display:flex;align-items:center;gap:10px">' +
                '<select id="vol-surf-sym" onchange="sessionStorage.setItem(\'vol-surf-sym\',this.value);renderVolSurfaceInDeriv(document.getElementById(\'deriv-display\'))" style="background:var(--bg-input);color:var(--text);border:1px solid var(--border);padding:5px 10px;border-radius:6px;font-size:0.75rem">' +
                    (typeof _DERIV_GALAXY !== 'undefined' ? _DERIV_GALAXY : ['BTC','ETH','SOL']).map(s => '<option value="' + s + '"' + (s === sym ? ' selected' : '') + '>' + s + '</option>').join('') +
                '</select>' +
                    '<span id="vol-surf-src" style="font-size:0.6rem;color:var(--text-dim)"></span>' +
                '</div>' +
            '</div>' +
            '<div id="vol-surf-content"><div style="text-align:center;padding:3rem"><div class="loader" style="margin:0 auto"></div></div></div>' +
        '</div>';

    try {
        const s    = document.getElementById('vol-surf-sym')?.value || sym;
        const data = await fetchAPI('/volatility-surface?ticker=' + s + '-USD');
        const el   = document.getElementById('vol-surf-content');
        if (!el || !data || data.error) {
            el.innerHTML = '<div style="padding:2rem;color:var(--text-dim)">' + (data?.error || 'Surface data unavailable.') + '</div>';
            return;
        }

        const srcEl = document.getElementById('vol-surf-src');
        if (srcEl) srcEl.textContent = data.source === 'deribit_live' ? '● DERIBIT LIVE' : '● PARAMETRIC MODEL';

        const moneyness  = data.moneyness_axis || [];   // e.g. [0.70, 0.73, ...]
        const expiries   = data.expiry_labels  || [];   // e.g. ["7D","14D",...]
        const grid       = data.iv_grid        || [];   // grid[strike_idx][expiry_idx]

        // Find all IV values for colour scale
        const allIVs = grid.flat().filter(v => typeof v === 'number');
        const minIV  = Math.min(...allIVs);
        const maxIV  = Math.max(...allIVs);
        const range  = maxIV - minIV || 1;

        function ivColor(iv) {
            const t = (iv - minIV) / range; // 0=low IV, 1=high IV
            // Low: blue-green → High: orange-red
            const r = Math.round(30  + t * 225);
            const g = Math.round(200 - t * 150);
            const b = Math.round(212 - t * 200);
            return 'rgba(' + r + ',' + g + ',' + b + ',0.85)';
        }

        // ATM index = moneyness closest to 1.0
        const atmIdx = moneyness.reduce((best, m, i) =>
            Math.abs(m - 1.0) < Math.abs(moneyness[best] - 1.0) ? i : best, 0);

        // IV Smile chart (front expiry = column 0)
        const smileData = grid.map(row => row[0]);

        el.innerHTML =
            // Smile chart card
            '<div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem">' +
                '<div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">' +
                    'IV SMILE — ' + (expiries[0] || 'FRONT') + ' EXPIRY' +
                '</div>' +
                '<div style="position:relative;height:220px"><canvas id="vol-smile-chart"></canvas></div>' +
            '</div>' +
            // Full surface table
            '<div class="glass-card" style="padding:1.5rem;overflow-x:auto">' +
                '<div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">' +
                    'FULL IV SURFACE TABLE' +
                '</div>' +
                '<table style="width:100%;border-collapse:collapse;font-size:0.7rem;font-family:var(--font-mono);min-width:600px">' +
                    '<thead><tr style="color:var(--text-dim);border-bottom:1px solid rgba(255,255,255,0.1)">' +
                        '<th style="padding:8px 12px;text-align:left">MONEYNESS</th>' +
                        expiries.map(e => '<th style="padding:8px 10px;text-align:center">' + e + '</th>').join('') +
                    '</tr></thead>' +
                    '<tbody>' +
                        grid.map((row, si) => {
                            const m      = moneyness[si];
                            const pct    = m != null ? ((m - 1) * 100).toFixed(1) : '?';
                            const isATM  = si === atmIdx;
                            return '<tr style="' + (isATM ? 'background:rgba(139,92,246,0.12);border-top:1px solid rgba(139,92,246,0.3);border-bottom:1px solid rgba(139,92,246,0.3)' : '') + '">' +
                                '<td style="padding:8px 12px;font-weight:' + (isATM ? '900' : '500') + ';color:' + (isATM ? '#8b5cf6' : 'var(--text-dim)') + '">' +
                                    (m != null ? (m >= 1 ? '+' : '') + pct + '% <span style="font-size:0.5rem;opacity:0.5">(' + m.toFixed(3) + ')</span>' : '—') +
                                    (isATM ? ' <span style="font-size:0.45rem;background:rgba(139,92,246,0.3);color:#c4b5fd;padding:1px 5px;border-radius:3px;margin-left:4px">ATM</span>' : '') +
                                '</td>' +
                                row.map(iv => {
                                    const v = parseFloat(iv);
                                    return '<td style="padding:8px 10px;text-align:center;font-weight:700;background:' + ivColor(v) + ';color:#fff">' + v.toFixed(1) + '%</td>';
                                }).join('') +
                            '</tr>';
                        }).join('') +
                    '</tbody>' +
                '</table>' +
                '<div style="margin-top:10px;font-size:0.55rem;color:var(--text-dim)">Colour scale: <span style="color:rgba(30,200,212,0.85)">■ Low IV</span> → <span style="color:rgba(255,50,12,0.85)">■ High IV</span></div>' +
            '</div>';

        // Draw smile chart
        const smileCtx = document.getElementById('vol-smile-chart');
        if (smileCtx && smileData.length) {
            new Chart(smileCtx, {
                type: 'line',
                data: {
                    labels: moneyness.map(m => (m != null ? (m >= 1 ? '+' : '') + ((m - 1) * 100).toFixed(1) + '%' : '?')),
                    datasets: [{
                        label: 'IV %',
                        data: smileData,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139,92,246,0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#6b7280', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                        y: { ticks: { color: '#9ca3af', font: { size: 9 }, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.04)' } }
                    }
                }
            });
        }

    } catch (e) {
        const el = document.getElementById('vol-surf-content');
        if (el) el.innerHTML = '<div style="padding:2rem;color:var(--text-dim)">Error: ' + e.message + '</div>';
    }
}
// ===========================================================
// MAX PAIN — Inline
// ===========================================================
async function renderMaxPainInDeriv(display) {
    // Persist and restore symbol selection
    const sym = sessionStorage.getItem('max-pain-sym') || 'BTC';

    display.innerHTML =
        '<div class="card" style="padding:1.5rem">' +
            '<div class="card-header" style="margin-bottom:1.5rem">' +
                '<div><h2>Options Max Pain</h2>' +
                '<div style="font-size:0.6rem;color:var(--text-dim);margin-top:4px">STRIKE WHERE MAXIMUM OPTIONS CONTRACTS EXPIRE WORTHLESS</div></div>' +
                '<select id="max-pain-sym" onchange="sessionStorage.setItem(\'max-pain-sym\',this.value);renderMaxPainInDeriv(document.getElementById(\'deriv-display\'))" style="background:var(--bg-input);color:var(--text);border:1px solid var(--border);padding:5px 10px;border-radius:6px;font-size:0.75rem">' +
                    (typeof _DERIV_GALAXY !== 'undefined' ? _DERIV_GALAXY : ['BTC','ETH','SOL']).map(s => '<option value="' + s + '"' + (s === sym ? ' selected' : '') + '>' + s + '</option>').join('') +
                '</select>' +
            '</div>' +
            '<div id="max-pain-content"><div style="text-align:center;padding:3rem"><div class="loader" style="margin:0 auto"></div></div></div>' +
        '</div>';

    try {
        const s    = document.getElementById('max-pain-sym')?.value || sym;
        // API returns: { ticker, spot, max_pain_strike, options_chain: [{strike, call_oi, put_oi}], liquidations }
        const data = await fetchAPI('/options-max-pain?ticker=' + s);
        const el   = document.getElementById('max-pain-content');
        if (!el || !data || data.error) {
            if (el) el.innerHTML = '<div style="padding:2rem;color:var(--text-dim)">' + (data?.error || 'No data.') + '</div>';
            return;
        }

        const pain   = data.max_pain_strike || 0;
        const spot   = data.spot || 0;
        const chain  = Array.isArray(data.options_chain) ? data.options_chain : [];
        const dist   = spot ? (((pain - spot) / spot) * 100).toFixed(2) : '—';
        const distN  = parseFloat(dist);

        // Totals from chain
        const totalCallOI = chain.reduce((s, r) => s + (r.call_oi || 0), 0);
        const totalPutOI  = chain.reduce((s, r) => s + (r.put_oi  || 0), 0);
        const pcr         = totalCallOI ? (totalPutOI / totalCallOI).toFixed(2) : '—';

        el.innerHTML =
            // KPI row
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.5rem">' +
                '<div class="glass-card" style="padding:1.5rem;text-align:center;border-left:4px solid #8b5cf6">' +
                    '<div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:6px">MAX PAIN STRIKE</div>' +
                    '<div style="font-size:2rem;font-weight:900;color:#8b5cf6">$' + Number(pain).toLocaleString() + '</div>' +
                '</div>' +
                '<div class="glass-card" style="padding:1.5rem;text-align:center">' +
                    '<div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:6px">SPOT PRICE</div>' +
                    '<div style="font-size:2rem;font-weight:900;color:var(--accent)">$' + Number(spot).toLocaleString(undefined, {maximumFractionDigits:0}) + '</div>' +
                '</div>' +
                '<div class="glass-card" style="padding:1.5rem;text-align:center">' +
                    '<div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:6px">DISTANCE</div>' +
                    '<div style="font-size:2rem;font-weight:900;color:' + (distN >= 0 ? '#22c55e' : '#ef4444') + '">' + (dist !== '—' && distN >= 0 ? '+' : '') + dist + '%</div>' +
                '</div>' +
                '<div class="glass-card" style="padding:1.5rem;text-align:center">' +
                    '<div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:6px">PUT/CALL OI RATIO</div>' +
                    '<div style="font-size:2rem;font-weight:900;color:' + (parseFloat(pcr) > 1 ? '#ef4444' : '#22c55e') + '">' + pcr + '</div>' +
                '</div>' +
            '</div>' +
            // OI by strike chart
            '<div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem">' +
                '<div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">OPEN INTEREST BY STRIKE</div>' +
                '<div style="height:300px;position:relative"><canvas id="max-pain-canvas"></canvas></div>' +
            '</div>' +
            // Liquidation levels
            (data.liquidations && data.liquidations.length ?
            '<div class="glass-card" style="padding:1.5rem">' +
                '<div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">NEARBY LIQUIDATION CLUSTERS</div>' +
                '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;font-family:var(--font-mono)">' +
                    '<thead><tr style="color:var(--text-dim);border-bottom:1px solid rgba(255,255,255,0.08)">' +
                        ['PRICE','TYPE','LEVERAGE','NOTIONAL'].map(h => '<th style="padding:8px 12px;text-align:left;font-size:0.6rem;letter-spacing:1px">' + h + '</th>').join('') +
                    '</tr></thead><tbody>' +
                        data.liquidations.map(l =>
                            '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">' +
                                '<td style="padding:8px 12px;font-weight:700">$' + Number(l.price).toLocaleString(undefined,{maximumFractionDigits:0}) + '</td>' +
                                '<td style="padding:8px 12px"><span style="color:' + (l.type === 'LONG' ? '#22c55e' : '#ef4444') + ';font-weight:900">' + l.type + '</span></td>' +
                                '<td style="padding:8px 12px;color:var(--text-dim)">' + l.leverage + '</td>' +
                                '<td style="padding:8px 12px;color:var(--accent)">$' + (l.volume >= 1e6 ? (l.volume/1e6).toFixed(1) + 'M' : (l.volume/1e3).toFixed(0) + 'K') + '</td>' +
                            '</tr>'
                        ).join('') +
                    '</tbody></table>' +
            '</div>' : '');

        // Chart
        if (chain.length) {
            const ctx = document.getElementById('max-pain-canvas');
            if (ctx) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: chain.map(r => '$' + Number(r.strike).toLocaleString()),
                        datasets: [
                            { label: 'Call OI', data: chain.map(r => r.call_oi || 0), backgroundColor: 'rgba(34,197,94,0.65)',  borderColor: '#22c55e', borderWidth: 1, borderRadius: 3 },
                            { label: 'Put OI',  data: chain.map(r => r.put_oi  || 0), backgroundColor: 'rgba(239,68,68,0.65)',  borderColor: '#ef4444', borderWidth: 1, borderRadius: 3 }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { labels: { color: '#9ca3af', font: { size: 10 } } },
                            annotation: {
                                annotations: {
                                    maxPainLine: {
                                        type: 'line',
                                        xMin: chain.findIndex(r => r.strike === pain),
                                        xMax: chain.findIndex(r => r.strike === pain),
                                        borderColor: '#8b5cf6',
                                        borderWidth: 2,
                                        label: { content: 'MAX PAIN', enabled: true, color: '#c4b5fd', font: { size: 9 } }
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 8 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.04)' } },
                            y: { ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } }
                        }
                    }
                });
            }
        }
    } catch (e) {
        const el = document.getElementById('max-pain-content');
        if (el) el.innerHTML = '<div style="padding:2rem;color:var(--text-dim)">Error: ' + e.message + '</div>';
    }
}
