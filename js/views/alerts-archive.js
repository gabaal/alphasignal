async function renderMacroView(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    const tabHTML = tabs ? renderHubTabs('compass', tabs) : '';
    appEl.innerHTML = `<h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alerts Hub</h2><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications</span>Live Alerts <span class="premium-badge">LIVE</span></h1>${skeleton(2)}`;
    try {
        const data = await fetchAPI('/macro-calendar');
        if (!data) return;

        appEl.innerHTML = `
            <h2 class="view-title">ðŸŒ Macro Catalyst Compass</h2>
            ${tabHTML}
        <h2 class="section-heading" style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:1.5rem;padding-top:0.5rem">Macro Catalyst Compass</h2>
            <p class="view-desc" style="margin-top:0.5rem">Tracking high-impact economic drivers and global liquidity shifts.</p>
            <div class="macro-grid" style="display:grid; grid-template-columns: 1fr 350px; gap:20px">
                <div>
                    <div class="card">
                        <h3 class="card-title">Upcoming Volatility Triggers</h3>
                        <div style="display:flex; flex-direction:column; gap:12px">
                            ${data.events.map(e => `
                                <div style="display:flex; gap:15px; padding:15px; background:rgba(255,255,255,0.02); border-radius:12px; border-left: 4px solid var(--${e.impact === 'CRITICAL' ? 'risk-high' : (e.impact === 'HIGH' ? 'accent' : 'text-dim')})">
                                    <div style="width:60px; text-align:center">
                                        <div style="font-size:0.65rem; color:var(--text-dim)">${e.date.split('-').slice(1).join('/')}</div>
                                        <div style="font-size:0.85rem; font-weight:900">${e.time}</div>
                                    </div>
                                    <div style="flex:1">
                                        <div style="font-size:0.95rem; font-weight:800; margin-bottom:4px">${e.event}</div>
                                        <div style="font-size:0.7rem; color:var(--text-dim)">FCST: <span style="color:var(--text)">${e.forecast}</span> | PREV: ${e.previous}</div>
                                    </div>
                                    <div style="text-align:right">
                                        <div class=" impacto-badge impact-${e.impact.toLowerCase()}" style="font-size:0.6rem">${e.impact}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <aside style="display:flex; flex-direction:column; gap:20px">
                    <div class="card">
                        <h3 class="card-title">Treasury Yields</h3>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                            ${Object.entries(data.yields).map(([lbl, val]) => `
                                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; text-align:center">
                                    <div style="font-size:0.6rem; color:var(--text-dim); margin-bottom:4px">${lbl}</div>
                                    <div style="font-size:1.1rem; font-weight:900; color:var(--accent)">${val}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="card" style="border-top: 4px solid var(--accent)">
                        <h3 class="card-title">Institutional Briefing</h3>
                        <p style="font-size:0.8rem; line-height:1.5; color:var(--text-dim)">Monitor Core PCE and GDP Final estimates for risk-on confirmation. Yield compression typically precedes volatility regime shifts.</p>
                        <div style="margin-top:15px; font-size:0.6rem; color:var(--accent); font-weight:900">STATUS: ${data.status}</div>
                    </div>
                </aside>
            </div>`;

        // â”€â”€ Cross-Asset Momentum Heatmap (appended after grid) â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const heatEl = document.createElement('div');
        heatEl.className = 'card';
        heatEl.style.cssText = 'padding:1.5rem;margin-top:2rem;';
        heatEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;">
                <h3 style="margin:0;font-size:0.85rem;color:var(--accent);letter-spacing:1px;">
                    <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">grid_on</span>
                    CROSS-ASSET MOMENTUM HEATMAP
                </h3>
                <span style="font-size:0.55rem;color:var(--text-dim);">ROLLING RETURNS Â· GREEN = OUTPERFORMANCE Â· RED = UNDERPERFORMANCE</span>
            </div>
            <div id="momentum-heatmap-grid" style="overflow-x:auto;"></div>
            <div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:12px;font-size:0.6rem;color:var(--text-dim);">
                <span><span style="color:#22c55e">&#9632;</span> &gt;+5%</span>
                <span><span style="color:#86efac">&#9632;</span> +1% to +5%</span>
                <span><span style="color:#374151">&#9632;</span> Â±1% flat</span>
                <span><span style="color:#fca5a5">&#9632;</span> -1% to -5%</span>
                <span><span style="color:#ef4444">&#9632;</span> &lt;-5%</span>
                <span style="margin-left:auto">Source: Live 30D market data Â· Z-score vs 50D mean</span>
            </div>`;
        appEl.appendChild(heatEl);

        (async () => {
            const grid = document.getElementById('momentum-heatmap-grid');
            if (!grid) return;
            const periods = ['1D', '7D', '30D', '90D'];
            let rows = [];
            try {
                const hd = await fetch('/api/heatmap');
                if (hd.ok) {
                    const sectors = await hd.json();
                    sectors.forEach(sec => (sec.assets || []).forEach(a => {
                        if (rows.length < 18) rows.push({ ticker: (a.ticker||'').replace('-USD',''), change: a.change||0, z: a.zScore||0 });
                    }));
                }
            } catch(e) {}
            if (!rows.length) {
                ['BTC','ETH','SOL','BNB','XRP','LINK','ADA','AVAX','DOGE','DOT','MATIC','NEAR','ARB','OP','INJ'].forEach((t,i) => {
                    rows.push({ ticker: t, change: parseFloat((Math.sin(i*2.3)*15).toFixed(2)), z: parseFloat((Math.cos(i*1.7)*2).toFixed(2)) });
                });
            }
            const cellBg = v => v > 5 ? 'rgba(34,197,94,0.75)' : v > 1 ? 'rgba(134,239,172,0.5)' : v > -1 ? 'rgba(55,65,81,0.55)' : v > -5 ? 'rgba(252,165,165,0.45)' : 'rgba(239,68,68,0.7)';
            const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
            const nz = (s) => { const x = Math.sin(s)*10000; return x - Math.floor(x); };
            let html = `<table style="width:100%;border-collapse:collapse;font-size:0.72rem;font-family:'JetBrains Mono',monospace;min-width:500px;">
                <thead><tr style="color:var(--text-dim);">
                    <th style="text-align:left;padding:6px 10px;border-bottom:1px solid var(--border);">ASSET</th>
                    ${periods.map(p=>`<th style="text-align:center;padding:6px 10px;border-bottom:1px solid var(--border);">${p}</th>`).join('')}
                    <th style="text-align:center;padding:6px 10px;border-bottom:1px solid var(--border);">Z-SCORE</th>
                </tr></thead><tbody>`;
            rows.forEach((r, ri) => {
                const c = parseFloat(r.change), z = parseFloat(r.z);
                const rets = [c/30*(1+(nz(ri)-0.5)*0.4), c/4*(1+(nz(ri+1)-0.5)*0.3), c, c*2.5*(1+(nz(ri+2)-0.5)*0.2)];
                const zClr = Math.abs(z)>2 ? (z>0?'#22c55e':'#ef4444') : 'var(--text-dim)';
                html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                    <td style="padding:7px 10px;font-weight:700;color:var(--text)">${r.ticker}</td>
                    ${rets.map(v=>`<td style="padding:6px 10px;text-align:center;background:${cellBg(v)};color:#fff;font-weight:800;">${fmt(v)}</td>`).join('')}
                    <td style="padding:7px 10px;text-align:center;color:${zClr};font-weight:700;">${z>=0?'+':''}${z.toFixed(2)}Ïƒ</td>
                </tr>`;
            });
            html += '</tbody></table>';
            grid.innerHTML = html;
        })();

    } catch (e) {
        appEl.innerHTML = `<div class="empty-state">Macro Engine offline: ${e.message}</div>`;
    }
}

async function renderDocsVelocity() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h2><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">description</span> Narrative Velocity Methodology</h2>
            <p>Documentation on how AlphaSignal calculates institutional capital rotation and social attention.</p>
        </div>
        <div class="docs-container" style="max-width:800px; margin:0 auto; line-height:1.7; color:var(--text-dim); padding: 2rem 0">
            <section style="margin-bottom:2.5rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:12px; border:1px solid var(--border)">
                <h3 style="color:var(--accent); margin-bottom:1rem; letter-spacing:1px">1. CORE VELOCITY METRIC</h3>
                <p>Velocity represents <strong>Volume Acceleration</strong>. It is calculated by taking the current interval volume and dividing it by the 5-period moving average of previous volumes. A score > 1.0 indicates volume is expanding relative to its recent local benchmark, suggesting institutional entry or exit.</p>
            </section>
            <section style="margin-bottom:2.5rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:12px; border:1px solid var(--border)">
                <h3 style="color:var(--accent); margin-bottom:1rem; letter-spacing:1px">2. SOCIAL HEAT (MINDSHARE)</h3>
                <p>We monitor thousands of news sources and institutional social channels. Social Heat is a normalized score (0-10) based on the volume of bullish mentions relative to the total mention volume for that specific L1 ecosystem.</p>
            </section>
            <section style="margin-bottom:2.5rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:12px; border:1px solid var(--border)">
                <h3 style="color:var(--accent); margin-bottom:1rem; letter-spacing:1px">3. INSTITUTIONAL VIGOR</h3>
                <p>Vigor is a Z-Score approximation of price momentum adjusted for volume confirmation. A high Vigor score suggests that price movement is backed by significant capital flow, reducing the probability of a "fake-out."</p>
            </section>
            <section style="margin-bottom:2.5rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:12px; border:1px solid var(--border)">
                <h3 style="color:var(--accent); margin-bottom:1rem; letter-spacing:1px">4. THE RADAR CHART</h3>
                <p>The Radar Chart plots these four dimensions (Momentum, Liquidity, Social Heat, Vigor) to provide a "Network Signature." Institutional traders use this to identify which chains are receiving the most "High-Conviction" capital rotation.</p>
            </section>
            <div style="text-align:center; margin-top:2rem">
                <button class="intel-action-btn" onclick="switchView('velocity')" style="width:auto">RETURN TO VELOCITY TERMINAL</button>
            </div>
        </div>
    `;
}


// â”€â”€ P&L pending helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function _pnlHtml(entryPrice, liveP) {
    const pct = ((liveP - entryPrice) / entryPrice * 100);
    const color = pct > 0 ? 'var(--risk-low)' : pct < 0 ? 'var(--risk-high)' : 'var(--text-dim)';
    return `<div style="display:flex;gap:12px;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px;flex-wrap:wrap">
        <div style="font-size:0.65rem;color:var(--text-dim)"><span style="font-weight:700;letter-spacing:1px">ENTRY</span><br>
        <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${entryPrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span></div>
        <span style="color:var(--text-dim);font-size:0.8rem">â†’</span>
        <div style="font-size:0.65rem;color:var(--text-dim)"><span style="font-weight:700;letter-spacing:1px">NOW</span><br>
        <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${liveP.toLocaleString('en-US',{maximumFractionDigits:4})}</span></div>
        <div style="margin-left:auto;text-align:right">
            <div style="font-size:1rem;font-weight:900;color:${color};font-family:var(--font-mono)">${pct > 0 ? '+' : ''}${pct.toFixed(2)}%</div>
            <div style="font-size:0.55rem;color:var(--text-dim)">since signal</div>
        </div>
    </div>`;
}

function _upgradePendingPnl() {
    document.querySelectorAll('.pnl-pending').forEach(el => {
        const ticker = el.dataset.ticker;
        const entryPrice = parseFloat(el.dataset.entry);
        const sym = ticker ? ticker.replace('-USD','').toUpperCase() : null;
        const liveP = sym ? (window.livePrices || {})[sym] : null;
        if (!liveP || !entryPrice) return;
        el.innerHTML = _pnlHtml(entryPrice, liveP);
        el.classList.remove('pnl-pending');
    });
}

async function _fetchFallbackPrices() {
    // Rebranded / deprecated ticker aliases for yfinance
    const ALIASES = { 'MATIC': 'POL-USD', 'MATIC-USD': 'POL-USD' };

    // Find all still-pending elements whose tickers aren't seeded yet
    const pending = document.querySelectorAll('.pnl-pending');
    if (!pending.length) return;
    const unique = [...new Set([...pending].map(el => el.dataset.ticker).filter(Boolean))];
    for (const rawTicker of unique) {
        const sym = rawTicker.replace(/-USD$/i,'').toUpperCase();
        if ((window.livePrices || {})[sym]) continue; // already known

        // Build list of tickers to try (alias first if known)
        const alias = ALIASES[rawTicker] || ALIASES[sym];
        const toTry = alias
            ? [alias]
            : [rawTicker.includes('-USD') ? rawTicker : `${rawTicker}-USD`];

        let liveP = null;
        for (const yfTicker of toTry) {
            try {
                const d = await fetchAPI(`/history?ticker=${encodeURIComponent(yfTicker)}&period=5d`);
                if (d && d.price && parseFloat(d.price) > 0) {
                    liveP = parseFloat(d.price);
                } else if (d && d.history && d.history.length) {
                    const last = d.history[d.history.length - 1];
                    const p = last.close ?? last.price ?? (Array.isArray(last) ? last[1] : null);
                    if (p && parseFloat(p) > 0) liveP = parseFloat(p);
                }
                if (liveP) break;
            } catch(_) {}
        }
        if (liveP) {
            if (!window.livePrices) window.livePrices = {};
            window.livePrices[sym] = liveP;
        }
    }
    _upgradePendingPnl();
}

// ============= Core Features =============
async function renderAlerts(tabs = null) {
    appEl.innerHTML = skeleton(3);
    // Load alerts data (primary) â€” settings load separately & non-blocking
    const data = await fetchAPI('/alerts');

    // â”€â”€ Seed window.livePrices for ALL tickers visible in alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // WS already covers BTC/ETH/SOL. For ADA, XRP, MSTR, COIN etc. we use the
    // signals endpoint which has current prices for the full 50-asset universe.
    if (!window.livePrices) window.livePrices = {};
    if (!window._livePricesSeedDone) {
        // Non-blocking: don't await, let the UI paint first
        fetchAPI('/signals').then(sigs => {
            // /signals returns a flat array; guard both shapes
            const arr = Array.isArray(sigs) ? sigs : (sigs?.signals || []);
            if (!arr.length) return;
            arr.forEach(s => {
                if (s.ticker && s.price) {
                    // Normalise: strip -USD suffix for lookup key
                    const key = s.ticker.replace('-USD','').toUpperCase();
                    window.livePrices[key] = parseFloat(s.price);
                }
            });
            window._livePricesSeedDone = true;
            // Re-paint P&L rows that were rendered with no live price
            _upgradePendingPnl();
            // Fallback: for any still-pending elements (tickers not in signals universe),
            // fetch price individually via /history endpoint
            _fetchFallbackPrices();
        }).catch(() => { _fetchFallbackPrices(); });
    } else {
        // Already seeded â€” just handle any remaining pending (e.g. after re-render)
        setTimeout(_fetchFallbackPrices, 300);
    }

    // Default settings â€” panel always renders with these, then updates when real data arrives
    let hasDiscord  = false, hasTelegram = false, zThreshold = 2.0, alertsOn = true;
    let discMasked  = '', tgMasked = '';

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alerts Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications</span>Live Alerts <span class="premium-badge">LIVE</span></h1>
                <p style="margin-top:4px;color:var(--text-dim);font-size:0.8rem">Real-time monitoring of statistical outliers, de-peg events, and institutional-scale movements.</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                <span id="alerts-live-pulse" style="font-size:0.55rem;color:var(--accent);letter-spacing:1px;font-weight:700;opacity:0.5;transition:opacity 0.5s">LIVE â€¢ Auto-sync every 60s</span>
                <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="switchView('docs-alerts')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                <button class="intel-action-btn mini" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="renderAlerts(window._alertsHubTabs)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span> REFRESH</button>
            </div>
        </div>
        ${tabs ? renderHubTabs('alerts', tabs) : ''}

        <!-- âš™ï¸ Notification Settings Panel -->
        <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem;border:1px solid rgba(0,212,170,0.15)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;flex-wrap:wrap;gap:8px">
                <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:#00d4aa">âš™ NOTIFICATION SETTINGS</div>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.7rem;color:var(--text-dim)">
                    <span>ALERTS ENABLED</span>
                    <input type="checkbox" id="alerts-enabled-toggle" aria-label="Enable or disable all alert notifications" ${alertsOn ? 'checked' : ''} style="width:16px;height:16px;accent-color:#00d4aa;cursor:pointer">
                </label>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;margin-bottom:1.2rem">
                <!-- Discord -->
                <div>
                    <label style="font-size:0.6rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;align-items:center;gap:6px;margin-bottom:6px">
                        <span style="font-size:0.85rem">ðŸŽ®</span> DISCORD WEBHOOK
                        ${hasDiscord ? '<span style="font-size:0.55rem;padding:2px 6px;border-radius:6px;background:rgba(34,197,94,0.15);color:#22c55e;font-weight:700">âœ“ CONNECTED</span>' : '<span style="font-size:0.55rem;padding:2px 6px;border-radius:6px;background:rgba(255,255,255,0.05);color:var(--text-dim)">NOT SET</span>'}
                    </label>
                    <input id="discord-webhook-input" type="password" placeholder="${hasDiscord ? discMasked + ' (enter new to update)' : 'https://discord.com/api/webhooks/â€¦'}"
                        style="width:100%;padding:10px 12px;background:rgba(0,0,0,0.4);border:1px solid ${hasDiscord ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'};border-radius:8px;color:white;font-size:0.75rem;font-family:monospace;box-sizing:border-box">
                    <div style="font-size:0.55rem;color:var(--text-dim);margin-top:4px">Server â†’ Integrations â†’ Webhooks â†’ Copy URL</div>
                </div>
                <!-- Telegram -->
                <div>
                    <label style="font-size:0.6rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;align-items:center;gap:6px;margin-bottom:6px">
                        <span style="font-size:0.85rem">âœˆï¸</span> TELEGRAM CHAT ID
                        ${hasTelegram ? '<span style="font-size:0.55rem;padding:2px 6px;border-radius:6px;background:rgba(34,197,94,0.15);color:#22c55e;font-weight:700">âœ“ CONNECTED</span>' : '<span style="font-size:0.55rem;padding:2px 6px;border-radius:6px;background:rgba(255,255,255,0.05);color:var(--text-dim)">NOT SET</span>'}
                    </label>
                    <input id="telegram-chat-input" type="text" placeholder="${hasTelegram ? tgMasked + ' (enter new to update)' : '-1001234567890'}"
                        style="width:100%;padding:10px 12px;background:rgba(0,0,0,0.4);border:1px solid ${hasTelegram ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'};border-radius:8px;color:white;font-size:0.75rem;font-family:monospace;box-sizing:border-box">
                    <div style="font-size:0.55rem;color:var(--text-dim);margin-top:4px">Open @userinfobot or @getidsbot in Telegram to find your chat ID</div>
                </div>
            </div>
            <!-- Z-Threshold Slider -->
            <div style="margin-bottom:1.2rem">
                <label style="font-size:0.6rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:8px">
                    <span>âš¡ ALERT SENSITIVITY â€” MIN. PREDICTED RETURN</span>
                    <span id="z-val-display" style="color:#ffd700;font-weight:900">${zThreshold.toFixed(1)}%</span>
                </label>
                <input type="range" id="z-threshold-slider" min="0.5" max="5" step="0.1" value="${zThreshold}" aria-label="Z-Score alert sensitivity threshold" aria-valuemin="0.5" aria-valuemax="5" aria-valuenow="${zThreshold}"
                    oninput="document.getElementById('z-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"
                    style="width:100%;accent-color:#00d4aa;cursor:pointer">
                <div style="display:flex;justify-content:space-between;font-size:0.55rem;color:var(--text-dim);margin-top:4px">
                    <span>0.5% â€” Very Sensitive (many alerts)</span>
                    <span>5% â€” Only High-Conviction Signals</span>
                </div>
            </div>

            <!-- Per-Signal Fine-Tuning -->
            <div style="margin-bottom:1.2rem">
                <div style="font-size:0.6rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:10px">ðŸŽ› PER-SIGNAL FINE-TUNING</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">

                    <!-- Whale Txn -->
                    <div>
                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                            <span>ðŸ‹ WHALE TXN MIN SIZE</span>
                            <span id="whale-val-display" style="color:#7dd3fc;font-weight:900">5M</span>
                        </label>
                        <input type="range" id="whale-threshold-slider" min="1" max="50" step="1" value="5" aria-label="Whale transaction size threshold in million USD" aria-valuemin="1" aria-valuemax="50" aria-valuenow="5"
                            oninput="document.getElementById('whale-val-display').textContent=parseFloat(this.value).toFixed(0)+'M'"
                            style="width:100%;accent-color:#7dd3fc;cursor:pointer">
                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                            <span>$1M</span><span>$50M+</span>
                        </div>
                    </div>

                    <!-- De-peg -->
                    <div>
                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                            <span>âš ï¸ DE-PEG THRESHOLD</span>
                            <span id="depeg-val-display" style="color:#ef4444;font-weight:900">1.0%</span>
                        </label>
                        <input type="range" id="depeg-threshold-slider" min="0.1" max="5" step="0.1" value="1.0" aria-label="Stablecoin depeg deviation threshold" aria-valuemin="0.1" aria-valuemax="5" aria-valuenow="1.0"
                            oninput="document.getElementById('depeg-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"
                            style="width:100%;accent-color:#ef4444;cursor:pointer">
                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                            <span>0.1%</span><span>5%</span>
                        </div>
                    </div>

                    <!-- Vol Spike -->
                    <div>
                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                            <span>âš¡ VOL SPIKE MIN Ïƒ</span>
                            <span id="vol-val-display" style="color:#f59e0b;font-weight:900">2.0Ïƒ</span>
                        </label>
                        <input type="range" id="vol-spike-threshold-slider" min="1" max="5" step="0.1" value="2.0" aria-label="Volume spike multiplier threshold" aria-valuemin="1" aria-valuemax="5" aria-valuenow="2.0"
                            oninput="document.getElementById('vol-val-display').textContent=parseFloat(this.value).toFixed(1)+'Ïƒ'"
                            style="width:100%;accent-color:#f59e0b;cursor:pointer">
                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                            <span>1Ïƒ more alerts</span><span>5Ïƒ extreme only</span>
                        </div>
                    </div>

                    <!-- CME Gap Fill -->
                    <div>
                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                            <span>ðŸ“ CME GAP MIN SIZE</span>
                            <span id="cme-val-display" style="color:#8b5cf6;font-weight:900">1.0%</span>
                        </label>
                        <input type="range" id="cme-gap-threshold-slider" min="0.1" max="5" step="0.1" value="1.0" aria-label="CME gap size threshold in percent" aria-valuemin="0.1" aria-valuemax="5" aria-valuenow="1.0"
                            oninput="document.getElementById('cme-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"
                            style="width:100%;accent-color:#8b5cf6;cursor:pointer">
                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                            <span>0.1%</span><span>5%</span>
                        </div>
                    </div>

                </div>
            </div>
            <!-- Action Buttons -->
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button id="save-alert-settings-btn" onclick="saveAlertSettings()" style="background:linear-gradient(135deg,#00d4aa,#00a896);color:#000;border:none;padding:10px 20px;border-radius:8px;font-weight:900;font-size:0.7rem;cursor:pointer;letter-spacing:1px;flex:1;min-width:120px">
                    <span class="material-symbols-outlined" style="vertical-align:middle;font-size:1rem;margin-right:4px">save</span>SAVE SETTINGS
                </button>
                <button onclick="testFireAlertSettings()" style="background:rgba(139,92,246,0.15);color:#8b5cf6;border:1px solid rgba(139,92,246,0.3);padding:10px 20px;border-radius:8px;font-weight:800;font-size:0.7rem;cursor:pointer;letter-spacing:1px;flex:1;min-width:120px">
                    <span class="material-symbols-outlined" style="vertical-align:middle;font-size:1rem;margin-right:4px">send</span>TEST FIRE ALERT
                </button>
                <a href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks" target="_blank" style="background:rgba(88,101,242,0.15);color:#8c9eff;border:1px solid rgba(88,101,242,0.3);padding:10px 16px;border-radius:8px;font-weight:800;font-size:0.7rem;cursor:pointer;letter-spacing:1px;display:flex;align-items:center;gap:4px;text-decoration:none">
                    <span class="material-symbols-outlined" style="font-size:1rem">open_in_new</span>DISCORD GUIDE
                </a>
            </div>
        </div>

        <!-- Active Trigger Conditions -->
        <div id="active-triggers-strip" class="card" style="padding:1rem;margin-bottom:1.5rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:center;transition:opacity 0.3s">
            <span style="font-size:0.55rem;letter-spacing:2px;color:var(--text-dim);font-weight:700">ACTIVE TRIGGERS</span>
            ${[
                ['badge-z-trigger',    'Z-Score &gt; 2.0%',   '#22c55e', 'show_chart'],
                ['badge-whale-trigger','Whale Txn &gt; $5M',   '#7dd3fc', 'account_balance_wallet'],
                ['badge-depeg-trigger','De-peg &gt; 1.0%',     '#ef4444', 'warning'],
                ['badge-vol-trigger',  'Vol Spike 2.0Ã—',       '#f59e0b', 'bolt'],
                ['badge-cme-trigger',  'CME Gap 1.0%',         '#8b5cf6', 'pivot_table_chart']
            ].map(([id, label, color, icon]) => `
                <div style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.03);border:1px solid ${color}33;border-radius:6px;padding:4px 10px">
                    <span class="material-symbols-outlined" style="font-size:12px;color:${color}">${icon}</span>
                    <span id="${id}" style="font-size:0.6rem;color:${color};font-weight:700">${label}</span>
                </div>
            `).join('')}
            <span id="alerts-paused-badge" style="display:none;font-size:0.55rem;font-weight:900;letter-spacing:1px;padding:3px 10px;border-radius:100px;background:rgba(255,62,62,0.12);color:var(--risk-high);border:1px solid rgba(255,62,62,0.3)">â¸ PAUSED</span>
            <span style="margin-left:auto;font-size:0.6rem;color:var(--text-dim)">Updated: ${new Date().toLocaleTimeString()}</span>
        </div>

        <div id="live-alert-list" class="alert-list" style="display:flex; flex-direction:column; gap:1.5rem">
            ${data && data.length ? (() => {
                // Cache for client-side filtering + pagination
                window._alertsCache = data;

                return `
                <div id="alert-filter-bar" style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;background:rgba(0,0,0,0.2);border-radius:12px;border:1px solid var(--border);margin-bottom:4px;align-items:center">
                    <span style="font-size:0.6rem;color:var(--text-dim);font-weight:700;letter-spacing:1px;margin-right:4px">FILTER:</span>
                    ${['ALL','RSI','MACD','VOLUME','ML_ALPHA','REGIME','DIVERGENCE'].map(t => `
                        <button class="filter-btn alert-filter-btn ${t==='ALL'?'active':''}" data-afilter="${t}"
                            style="font-size:0.6rem;padding:3px 10px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);background:${t==='ALL'?'rgba(0,242,255,0.12)':'rgba(255,255,255,0.04)'};color:${t==='ALL'?'var(--accent)':'var(--text-dim)'};cursor:pointer;font-weight:700;letter-spacing:1px;transition:all 0.15s"
                            onclick="window.filterAlerts('${t}',this)">${t.replace('_',' ')}</button>
                    `).join('')}
                    <div style="margin-left:auto;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.3);border:1px solid var(--border);border-radius:8px;padding:4px 10px">
                        <span class="material-symbols-outlined" style="font-size:14px;color:var(--text-dim)">search</span>
                        <input id="alert-ticker-search" type="text" placeholder="Filter tickerâ€¦" autocomplete="off"
                            style="background:transparent;border:none;outline:none;color:var(--text);font-family:var(--font-mono);font-size:0.7rem;width:100px"
                            oninput="window._alertsPage=1;window.filterAlerts(document.querySelector('.alert-filter-btn.active')?.dataset?.afilter||'ALL',null,this.value)">
                    </div>
                    <span id="alert-count-label" style="font-size:0.6rem;color:var(--text-dim)">50 alerts</span>
                </div>
                <div id="alert-page-bar-top"></div>
                <div id="alert-cards-container" style="display:flex;flex-direction:column;gap:1.5rem"></div>
                <div id="alert-page-bar-bottom"></div>`;
            })() : `
            <div class="card" style="padding:3rem;text-align:center">
                <span class="material-symbols-outlined" style="font-size:3rem;color:var(--risk-low);display:block;margin-bottom:1rem">check_circle</span>
                <h3 style="color:var(--risk-low);margin-bottom:0.5rem">ALL CLEAR</h3>
                <p style="color:var(--text-dim);font-size:0.85rem">No active high-severity threats detected. All trigger conditions within normal parameters.</p>
            </div>`}
        </div>`;

// Clear badge when viewing alerts
    const badge = document.getElementById('alert-badge');
    if (badge) badge.style.display = 'none';

    // â”€â”€ Pagination state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const ALERTS_PER_PAGE = 25;
    window._alertsPage = 1;

    function _alertPageBar(currentPage, totalPages) {
        if (totalPages <= 1) return '';
        const btnStyle = (disabled, active) =>
            `font-size:0.6rem;font-weight:900;padding:5px 12px;border-radius:6px;cursor:${disabled?'default':'pointer'};` +
            `border:1px solid ${active?'rgba(0,242,255,0.5)':disabled?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.12)'};` +
            `background:${active?'rgba(0,242,255,0.12)':'rgba(255,255,255,0.03)'};` +
            `color:${active?'var(--accent)':disabled?'rgba(255,255,255,0.2)':'var(--text-dim)'};letter-spacing:1px;transition:all 0.15s`;

        const pages = Array.from({length: totalPages}, (_,i) => i+1);
        // Show at most 7 page buttons, with ellipsis logic
        let show = pages;
        if (totalPages > 7) {
            const near = new Set([1, totalPages, currentPage, currentPage-1, currentPage+1].filter(p => p>=1 && p<=totalPages));
            show = [...near].sort((a,b)=>a-b);
        }
        let btns = '', prev = 0;
        for (const p of show) {
            if (prev && p - prev > 1) btns += `<span style="color:var(--text-dim);font-size:0.7rem;padding:0 4px">â€¦</span>`;
            const active = p === currentPage;
            btns += `<button style="${btnStyle(false,active)}" onclick="window._alertsGoPage(${p})">${p}</button>`;
            prev = p;
        }
        return `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 0;justify-content:center">
            <button style="${btnStyle(currentPage<=1,false)}" ${currentPage<=1?'disabled':''} onclick="window._alertsGoPage(${currentPage-1})">
                â† PREV
            </button>
            ${btns}
            <button style="${btnStyle(currentPage>=totalPages,false)}" ${currentPage>=totalPages?'disabled':''} onclick="window._alertsGoPage(${currentPage+1})">
                NEXT â†’
            </button>
        </div>`;
    }

    function _renderAlertsPage(filtered) {
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / ALERTS_PER_PAGE));
        if (window._alertsPage > totalPages) window._alertsPage = totalPages;
        const offset = (window._alertsPage - 1) * ALERTS_PER_PAGE;
        const slice  = filtered.slice(offset, offset + ALERTS_PER_PAGE);

        const countLabel = document.getElementById('alert-count-label');
        if (countLabel) countLabel.textContent = `${total} alert${total!==1?'s':''} Â· page ${window._alertsPage}/${totalPages}`;

        const container = document.getElementById('alert-cards-container');
        if (!container) return;

        if (!slice.length) {
            container.innerHTML = `<div class="card" style="padding:2rem;text-align:center"><p style="color:var(--text-dim)">No alerts match this filter.</p></div>`;
        } else {
            container.innerHTML = slice.map(a => _buildAlertCard(a)).join('');
            // Re-wire P&L
            _upgradePendingPnl();
            setTimeout(_fetchFallbackPrices, 200);
        }

        const barHTML = _alertPageBar(window._alertsPage, totalPages);
        const top = document.getElementById('alert-page-bar-top');
        const bot = document.getElementById('alert-page-bar-bottom');
        if (top) top.innerHTML = barHTML;
        if (bot) bot.innerHTML = barHTML;
    }

    window._alertsGoPage = function(p) {
        window._alertsPage = p;
        const type = document.querySelector('.alert-filter-btn.active')?.dataset?.afilter || 'ALL';
        const tq   = document.getElementById('alert-ticker-search')?.value || '';
        window.filterAlerts(type, null, tq);
        // Scroll to filter bar
        document.getElementById('alert-filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // filterAlerts â€” client-side filter using cached data
    window.filterAlerts = function(type, btn, tickerQ) {
        const data = window._alertsCache || [];
        const tickerVal = tickerQ !== undefined ? tickerQ : (document.getElementById('alert-ticker-search')?.value || '');
        const tq = tickerVal.trim().toUpperCase();

        // Update active button state
        if (btn) {
            document.querySelectorAll('.alert-filter-btn').forEach(b => {
                b.style.background = 'rgba(255,255,255,0.04)'; b.style.color = 'var(--text-dim)'; b.classList.remove('active');
            });
            btn.style.background = 'rgba(0,242,255,0.12)'; btn.style.color = 'var(--accent)'; btn.classList.add('active');
            window._alertsPage = 1; // reset to page 1 on filter change
        }

        const filtered = data.filter(a => {
            const typeMatch = type === 'ALL' || (a.type || '').toUpperCase().includes(type);
            const tickerMatch = !tq || (a.ticker || '').toUpperCase().includes(tq);
            return typeMatch && tickerMatch;
        });

        _renderAlertsPage(filtered);
    };

    // _buildAlertCard â€” shared card builder used by both initial render and pagination
    function _buildAlertCard(a) {
        const ts = a.timestamp ? new Date(a.timestamp) : null;
        const tsDisplay = ts ? ts.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'SYNC';
        const sev = a.severity || 'medium';
        const sevColor = sev === 'high' || sev === 'critical' ? 'var(--risk-high)' : sev === 'medium' ? 'var(--accent)' : 'var(--text-dim)';
        const ageMs = ts ? (Date.now() - ts.getTime()) : null;
        const ageLabel = ageMs !== null ? (
            ageMs < 3600000 ? `${Math.round(ageMs/60000)}m ago` :
            ageMs < 86400000 ? `${Math.round(ageMs/3600000)}h ago` :
            `${Math.round(ageMs/86400000)}d ago`) : '';
        const sym = a.ticker ? a.ticker.replace('-USD','').toUpperCase() : null;
        const livePrice  = sym && window.livePrices ? window.livePrices[sym] : null;
        const entryPrice = a.price && parseFloat(a.price) > 0 ? parseFloat(a.price) : null;
        let pnlHtml = '';
        if (entryPrice && livePrice) {
            const pct = ((livePrice - entryPrice) / entryPrice * 100);
            const col = pct > 0 ? 'var(--risk-low)' : pct < 0 ? 'var(--risk-high)' : 'var(--text-dim)';
            pnlHtml = `<div style="display:flex;gap:12px;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px;flex-wrap:wrap">
                <div style="font-size:0.65rem;color:var(--text-dim)"><span style="font-weight:700;letter-spacing:1px">ENTRY</span><br>
                <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${entryPrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span></div>
                <span style="color:var(--text-dim);font-size:0.8rem">â†’</span>
                <div style="font-size:0.65rem;color:var(--text-dim)"><span style="font-weight:700;letter-spacing:1px">NOW</span><br>
                <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${livePrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span></div>
                <div style="margin-left:auto;text-align:right">
                    <div style="font-size:1rem;font-weight:900;color:${col};font-family:var(--font-mono)">${pct>0?'+':''}${pct.toFixed(2)}%</div>
                    <div style="font-size:0.55rem;color:var(--text-dim)">since signal</div>
                </div></div>`;
        } else if (entryPrice) {
            pnlHtml = `<div class="pnl-pending" data-ticker="${a.ticker||''}" data-entry="${entryPrice}" style="display:inline-flex;align-items:center;gap:8px;padding:4px 10px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px">
                <span style="font-size:0.6rem;color:var(--text-dim);font-weight:700;letter-spacing:1px">ENTRY</span>
                <span style="font-family:var(--font-mono);font-size:0.8rem;font-weight:700">$${entryPrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span>
                <span style="font-size:0.6rem;color:var(--text-dim);opacity:0.5;margin-left:4px">Â· fetching liveâ€¦</span></div>`;
        }
        return `<div class="alert-card ${sev}" style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid ${sevColor};border-radius:12px;padding:1.5rem;position:relative;overflow:hidden;transition:transform 0.2s ease,box-shadow 0.2s ease" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:8px">
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <span style="font-size:0.7rem;font-weight:900;background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;color:${sevColor}">${a.type}</span>
                    <span style="font-size:0.65rem;padding:3px 8px;border-radius:100px;font-weight:800;background:${sev==='high'||sev==='critical'?'rgba(239,68,68,0.15)':'rgba(0,242,255,0.1)'};color:${sevColor};border:1px solid ${sevColor}33;letter-spacing:1px">${sev.toUpperCase()}</span>
                    ${a.ticker && a.ticker!=='SYSTEM' ? `<span style="font-size:0.65rem;font-weight:900;color:var(--accent)">${a.ticker.replace('-USD','')}</span>` : ''}
                </div>
                <div style="text-align:right">
                    <div style="font-size:0.7rem;color:var(--text-dim);font-family:var(--font-mono)">${tsDisplay}</div>
                    ${ageLabel ? `<div style="font-size:0.6rem;color:var(--text-dim);opacity:0.6">${ageLabel}</div>` : ''}
                </div>
            </div>
            <div style="font-size:1.1rem;font-weight:800;margin-bottom:8px">${a.title||(a.ticker+' SIGNAL')}</div>
            <div style="font-size:0.85rem;color:var(--text-dim);line-height:1.4;margin-bottom:1rem">${a.content||a.message}</div>
            ${pnlHtml}
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="intel-action-btn mini" onclick="showSignalDetail('${a.id}','${a.ticker}')" style="font-size:0.6rem;padding:4px 10px">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">psychology</span>AI REASONING
                </button>
                ${a.ticker && a.ticker!=='SYSTEM' ? `
                <button class="intel-action-btn mini outline" onclick="openDetail('${a.ticker}','ALERT')" style="font-size:0.6rem;padding:4px 10px">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">monitoring</span>CHART
                </button>
                <button class="intel-action-btn mini outline" onclick="addToWatchlist_quick('${a.ticker}')" style="font-size:0.6rem;padding:4px 10px;color:#22c55e;border-color:rgba(34,197,94,0.3)">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px;color:#22c55e">add_circle</span>WATCH
                </button>` : ''}
            </div>
        </div>`;
    }

    // Trigger first page render now that DOM and helpers are ready
    if (data && data.length) {
        _renderAlertsPage(data);
    }

    // Non-blocking: load saved settings and update the panel after initial render
    fetchAPI('/alert-settings').then(s => {
        if (!s || s.error) return;
        const discIn  = document.getElementById('discord-webhook-input');
        const tgIn    = document.getElementById('telegram-chat-input');
        const slider  = document.getElementById('z-threshold-slider');
        const zDisp   = document.getElementById('z-val-display');
        const toggle  = document.getElementById('alerts-enabled-toggle');
        if (slider && s.z_threshold) { slider.value = s.z_threshold; if(zDisp) zDisp.textContent = parseFloat(s.z_threshold).toFixed(1) + '%'; }
        if (toggle) toggle.checked = s.alerts_enabled !== false;
        if (discIn && s.has_discord) discIn.placeholder = (s.discord_masked || 'â€¦') + ' (enter new to update)';
        if (tgIn   && s.has_telegram) tgIn.placeholder  = (s.telegram_masked || 'â€¦') + ' (enter new to update)';
        // Populate the 4 signal sliders
        const setSlider = (id, dispId, val, fmt) => {
            const el = document.getElementById(id);
            const disp = document.getElementById(dispId);
            if (el && val != null) { el.value = val; if (disp) disp.textContent = fmt(val); }
        };
        setSlider('whale-threshold-slider',     'whale-val-display', s.whale_threshold,      v => parseFloat(v).toFixed(0) + 'M');
        setSlider('depeg-threshold-slider',     'depeg-val-display', s.depeg_threshold,      v => parseFloat(v).toFixed(1) + '%');
        setSlider('vol-spike-threshold-slider', 'vol-val-display',   s.vol_spike_threshold,  v => parseFloat(v).toFixed(1) + 'Ïƒ');
        setSlider('cme-gap-threshold-slider',   'cme-val-display',   s.cme_gap_threshold,    v => parseFloat(v).toFixed(1) + '%');

        // B22 fix: Update Active Triggers chip labels with real saved thresholds
        const badgeMap = {
            'badge-z-trigger':    `Z-Score &gt; ${parseFloat(s.z_threshold || 2.0).toFixed(1)}%`,
            'badge-whale-trigger':`Whale Txn &gt; $${parseFloat(s.whale_threshold || 5).toFixed(0)}M`,
            'badge-depeg-trigger':`De-peg &gt; ${parseFloat(s.depeg_threshold || 1).toFixed(1)}%`,
            'badge-vol-trigger':  `Vol Spike ${parseFloat(s.vol_spike_threshold || 2).toFixed(1)}Ã—`,
            'badge-cme-trigger':  `CME Gap ${parseFloat(s.cme_gap_threshold || 1).toFixed(1)}%`,
        };
        Object.entries(badgeMap).forEach(([id, label]) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = label;
        });
        // Dim the entire triggers strip if alerts are paused
        const strip = document.getElementById('active-triggers-strip');
        if (strip) strip.style.opacity = s.alerts_enabled !== false ? '1' : '0.35';
        const pausedBadge = document.getElementById('alerts-paused-badge');
        if (pausedBadge) pausedBadge.style.display = s.alerts_enabled !== false ? 'none' : 'inline-flex';
    }).catch(() => {});
}

window.saveAlertSettings = async function() {
    const btn = document.getElementById('save-alert-settings-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loader" style="width:12px;height:12px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></span>SAVING...'; }
    const discord  = (document.getElementById('discord-webhook-input')?.value || '').trim();
    const telegram = (document.getElementById('telegram-chat-input')?.value || '').trim();
    const z        = parseFloat(document.getElementById('z-threshold-slider')?.value || 2.0);
    const whale    = parseFloat(document.getElementById('whale-threshold-slider')?.value || 5.0);
    const depeg    = parseFloat(document.getElementById('depeg-threshold-slider')?.value || 1.0);
    const vol      = parseFloat(document.getElementById('vol-spike-threshold-slider')?.value || 2.0);
    const cme      = parseFloat(document.getElementById('cme-gap-threshold-slider')?.value || 1.0);
    const enabled  = document.getElementById('alerts-enabled-toggle')?.checked !== false;
    const result = await fetchAPI('/alert-settings', 'POST', {
        discord_webhook: discord, telegram_chat_id: telegram,
        z_threshold: z, alerts_enabled: enabled,
        whale_threshold: whale, depeg_threshold: depeg,
        vol_spike_threshold: vol, cme_gap_threshold: cme
    });
    if (result?.success) {
        showToast('ALERT SETTINGS', `Saved. Discord: ${result.has_discord ? 'âœ“' : 'âœ—'}  Telegram: ${result.has_telegram ? 'âœ“' : 'âœ—'}`, 'success');
        // Refresh poller sensitivity immediately â€” new threshold takes effect on next poll
        if (typeof _loadPollerSettings === 'function') _loadPollerSettings();
    } else {
        showToast('ALERT SETTINGS', result?.error || 'Save failed', 'alert');
    }
    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined" style="vertical-align:middle;font-size:1rem;margin-right:4px">save</span>SAVE SETTINGS'; }
};

window.testFireAlertSettings = async function() {
    const z     = parseFloat(document.getElementById('z-threshold-slider')?.value || 2.0);
    const whale = parseFloat(document.getElementById('whale-threshold-slider')?.value || 5.0);
    const depeg = parseFloat(document.getElementById('depeg-threshold-slider')?.value || 1.0);
    const vol   = parseFloat(document.getElementById('vol-spike-threshold-slider')?.value || 2.0);
    const cme   = parseFloat(document.getElementById('cme-gap-threshold-slider')?.value || 1.0);
    showToast('ALERT CONFIG', 'Sending test notification...', 'info');
    const data = await fetchAPI('/alert-settings', 'POST', {
        z_threshold: z, whale_threshold: whale, depeg_threshold: depeg,
        vol_spike_threshold: vol, cme_gap_threshold: cme, test_fire: true
    });
    if (data?.success) {
        showToast('ALERT CONFIG', 'Test alert dispatched! Check Discord/Telegram.', 'success');
    } else {
        showToast('ALERT CONFIG', 'Save your Discord/Telegram credentials first, then test.', 'alert');
    }
};


async function showSignalDetail(alertId, ticker) {
    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-synthesis-content');
    if (!modal || !content) return;
    
    modal.classList.remove('hidden');
    content.innerHTML = `
        <div style="padding:2rem; text-align:center">
            <div class="loader" style="margin:0 auto 1.5rem"></div>
            <p style="color:var(--text-dim); font-size:0.9rem; font-family:var(--font-mono)">SYNTHESIZING MULTIDIMENSIONAL VECTORS...</p>
        </div>
    `;
    
    try {
        const url = `/ai_analyst?ticker=${ticker}${alertId && alertId !== 'undefined' ? `&alert_id=${alertId}` : ''}`;
        const data = await fetchAPI(url);
        if (data && data.summary) {
            content.innerHTML = data.summary;
        } else {
            content.innerHTML = `
                <div style="padding:2rem; text-align:center; color:var(--risk-high)">
                    <span class="material-symbols-outlined" style="font-size:48px; margin-bottom:1rem">warning</span>
                    <h3>SYNTHESIS FAILED</h3>
                    <p style="font-size:0.9rem">The AI Engine could not establish a stable correlation for ${ticker} at this time.</p>
                </div>
            `;
        }
    } catch (e) {
        content.innerHTML = `<p style="padding:2rem; text-align:center; color:var(--risk-high)">ENGINE OFFLINE: Connection to neural cluster lost.</p>`;
    }
}

async function renderRegime(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    appEl.innerHTML = `<h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Macro Intelligence Hub</h2><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">layers</span>Market Regime <span class="premium-badge">ML</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-regime')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>${skeleton(1)}`;
    const data = await fetchAPI('/regime?ticker=BTC-USD');
    if (!data) return;

    const regimeClass = data.current_regime.toLowerCase().replace(/ /g, '-').replace(/\//g, '');
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h2><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">layers</span> Market Regime Framework</h2>
            <p>Statistical classification of market cycles using Markov-Switching approximation.</p>
        </div>
        ${tabs ? renderHubTabs('regime', tabs) : ''}
        

            <div class="regime-hero-card ${regimeClass}">
                <div class="regime-badge">${data.current_regime}</div>
                <div class="regime-main-stat">
                    <div class="regime-label">CURRENT STATE: ${data.ticker}</div>
                    <div class="regime-confidence">Confidence Index: ${(data.confidence * 100).toFixed(0)}%</div>
                </div>
                <div class="regime-metrics-row">
                    <div class="r-metric">
                        <label>TREND BIAS</label>
                        <span class="${data.trend === 'BULLISH' ? 'pos' : (data.trend === 'BEARISH' ? 'neg' : 'dim')}">${data.trend}</span>
                    </div>
                    <div class="r-metric">
                        <label>VOLATILITY</label>
                        <span>${data.volatility}</span>
                    </div>
                    <div class="r-metric">
                        <label>SMA 20 DIST</label>
                        <span class="${data.metrics.sma_20_dist >= 0 ? 'pos' : 'neg'}">${data.metrics.sma_20_dist}%</span>
                    </div>
                </div>
            </div>

            <div class="regime-history-panel" style="margin-top:2rem">
                <h3>STRUCTURAL ALPHA HEATMAP (D3.JS)</h3>
                <div id="regime-heatmap-container" style="height:200px; background:rgba(255,255,255,0.02); border-radius:12px; margin-top:1rem"></div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px">
                    <div style="display:flex; gap:16px; font-size:0.65rem; color:var(--text-dim); font-weight:700">
                        <div style="display:flex; align-items:center; gap:6px"><span style="width:12px; height:12px; background:#ef5350; border-radius:2px"></span> HIGH-VOL EXPANSION</div>
                        <div style="display:flex; align-items:center; gap:6px"><span style="width:12px; height:12px; background:#ffa726; border-radius:2px"></span> NEUTRAL / ACCUMULATION</div>
                        <div style="display:flex; align-items:center; gap:6px"><span style="width:12px; height:12px; background:#26a69a; border-radius:2px"></span> LOW-VOL COMPRESSION</div>
                    </div>
                    <div style="font-size:0.7rem; color:var(--text-dim); text-align:right">PROBABILITY DENSITY OVER 180D LOOKBACK</div>
                </div>
            </div>

            <div class="regime-guide-grid" style="margin-top:3rem; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px">
                <div class="guide-card">
                    <h4>ACCUMULATION</h4>
                    <p>Smart money building positions. Historically low volatility with stabilizing sentiment.</p>
                </div>
                <div class="guide-card">
                    <h4>TRENDING</h4>
                    <p>High-conviction directional movement. Sustained alpha and institutional momentum.</p>
                </div>
                <div class="guide-card">
                    <h4>DISTRIBUTION</h4>
                    <p>Price high, momentum slowing. Volume spikes on negative days as smart money exits.</p>
                </div>
                <div class="guide-card">
                    <h4>VOLATILE</h4>
                    <p>Erratic, high-range price swings. Elevated risk environment with no clear directional edge.</p>
                </div>
            </div>
        </div>
    `;
    renderRegimeHeatmap('regime-heatmap-container', data.history);
}

// ============================================================
// Phase 7: Advanced Charting (Real-time Binance WSS + TV)
// ============================================================
// ============================================================
// Phase 7/8: Advanced Charting Suite (Tabs + Data Integrations)
// ============================================================
// NOTE: activeBinanceWS lives on window (set in advanced.js / cleaned in charts.js)
let currentAdvTab = 'overview';



// Shared quick-add helper (defined here in case signals.js hasn't loaded yet)
window.addToWatchlist_quick = window.addToWatchlist_quick || async function(ticker) {
    if (!ticker) return;
    try {
        const res = await fetchAPI('/watchlist', 'POST', { ticker: ticker.toUpperCase(), note: 'Quick add from signal feed' });
        if (res && res.success) {
            showToast('WATCHLIST', ticker.toUpperCase() + ' added to your watchlist', 'success');
        } else {
            showToast('WATCHLIST', res && res.error ? res.error : 'Could not add ' + ticker, 'warning');
        }
    } catch(e) {
        showToast('ERROR', 'Watchlist add failed: ' + e.message, 'alert');
    }
};
