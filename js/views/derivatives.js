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
        renderOptionsFlow();
    } else if (activeMode === 'gex-profile') {
        if (typeof renderGexProfile === 'function') renderGexProfile();
        else display.innerHTML = '<div style="padding:2rem;color:var(--text-dim)">GEX Profile module loading...</div>';
    } else if (activeMode === 'vol-surface') {
        if (typeof renderVolatilitySurface === 'function') renderVolatilitySurface();
        else display.innerHTML = '<div style="padding:2rem;color:var(--text-dim)">Volatility Surface module loading...</div>';
    } else if (activeMode === 'max-pain') {
        if (typeof renderOptionsMaxPain === 'function') renderOptionsMaxPain();
        else display.innerHTML = '<div style="padding:2rem;color:var(--text-dim)">Max Pain module loading...</div>';
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
        if (!data) return;

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeEl = document.getElementById('funding-update-time');
        if (timeEl) timeEl.textContent = 'Updated ' + now;

        const grid = document.getElementById('funding-grid');
        if (!grid) return;

        // data should be an array of { symbol, rate, annualized, next_funding }
        const rates = Array.isArray(data) ? data : (data.rates || Object.entries(data).map(([k, v]) => ({ symbol: k, rate: v })));

        const maxAbs = Math.max(...rates.map(r => Math.abs(parseFloat(r.rate || 0))), 0.001);

        grid.innerHTML = rates.map(r => {
            const rate     = parseFloat(r.rate || 0);
            const pct      = (rate * 100).toFixed(4);
            const annual   = (rate * 100 * 3 * 365).toFixed(1); // 3x daily for Binance 8hr intervals
            const sym      = (r.symbol || '').replace('USDT', '');
            const abs      = Math.abs(rate);
            const intensity = Math.min(abs / maxAbs, 1);

            let bg, textColor, label;
            if (rate > 0.0002) {
                // Positive funding: longs pay shorts → crowded long → bearish risk
                bg        = 'rgba(239,68,68,' + (0.15 + intensity * 0.65) + ')';
                textColor = '#fca5a5';
                label     = 'LONGS CROWDED';
            } else if (rate < -0.0002) {
                // Negative funding: shorts pay longs → crowded short → squeeze risk
                bg        = 'rgba(34,197,94,' + (0.15 + intensity * 0.65) + ')';
                textColor = '#86efac';
                label     = 'SHORTS CROWDED';
            } else {
                bg        = 'rgba(255,255,255,0.04)';
                textColor = 'rgba(255,255,255,0.5)';
                label     = 'NEUTRAL';
            }

            return '<div style="background:' + bg + ';border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px 14px;cursor:default;transition:transform 0.15s" ' +
                    'onmouseover="this.style.transform=\'scale(1.03)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
                '<div style="font-size:0.85rem;font-weight:900;letter-spacing:1px;color:var(--text);margin-bottom:6px">' + sym + '</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:' + textColor + ';font-family:\'JetBrains Mono\'">' + (rate >= 0 ? '+' : '') + pct + '%</div>' +
                '<div style="font-size:0.55rem;color:rgba(255,255,255,0.4);margin-top:2px">' + (rate >= 0 ? '+' : '') + annual + '% ann.</div>' +
                '<div style="font-size:0.55rem;font-weight:800;letter-spacing:1px;color:' + textColor + ';margin-top:8px;opacity:0.9">' + label + '</div>' +
            '</div>';
        }).join('');

        // Stats
        const positive = rates.filter(r => parseFloat(r.rate) > 0.0002);
        const negative = rates.filter(r => parseFloat(r.rate) < -0.0002);
        const avgRate  = rates.reduce((s, r) => s + parseFloat(r.rate || 0), 0) / (rates.length || 1);
        const maxRate  = rates.reduce((a, r) => Math.abs(parseFloat(r.rate || 0)) > Math.abs(parseFloat(a.rate || 0)) ? r : a, rates[0] || {});

        const statsEl = document.getElementById('funding-stats');
        if (statsEl) {
            statsEl.innerHTML =
                '<div style="text-align:center"><div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:4px">LONGS CROWDED</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:#ef4444">' + positive.length + ' / ' + rates.length + '</div></div>' +

                '<div style="text-align:center"><div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:4px">SHORTS CROWDED</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:#22c55e">' + negative.length + ' / ' + rates.length + '</div></div>' +

                '<div style="text-align:center"><div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:4px">AVG FUNDING</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:' + (avgRate >= 0 ? '#ef4444' : '#22c55e') + '">' + (avgRate * 100).toFixed(4) + '%</div></div>' +

                '<div style="text-align:center"><div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:4px">HOTTEST PERP</div>' +
                '<div style="font-size:1.1rem;font-weight:900;color:var(--accent)">' + ((maxRate.symbol || '').replace('USDT', '') || '—') + '</div></div>';
        }

    } catch (e) {
        console.error('Funding Heatmap Error:', e);
        const grid = document.getElementById('funding-grid');
        if (grid) grid.innerHTML = '<div style="color:var(--text-dim);padding:2rem;font-size:0.8rem">Failed to load funding data: ' + e.message + '</div>';
    }
}
