function _pnlHtml(entryPrice, liveP) {

    const pct = ((liveP - entryPrice) / entryPrice * 100);

    const color = pct > 0 ? 'var(--risk-low)' : pct < 0 ? 'var(--risk-high)' : 'var(--text-dim)';

    return `<div style="display:flex;gap:12px;align-items:center;padding:8px 12px;background:${alphaColor(0.03)};border-radius:8px;border:1px solid ${alphaColor(0.06)};margin-bottom:10px;flex-wrap:wrap">

        <div style="font-size:0.65rem;color:var(--text-dim)"><span style="font-weight:700;letter-spacing:1px">ENTRY</span><br>

        <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${entryPrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span></div>

        <span style="color:var(--text-dim);font-size:0.8rem"></span>

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

    // Load alerts data (primary) -- settings load separately & non-blocking

    const data = await fetchAPI('/alerts');



    // -- Seed window.livePrices for ALL tickers visible in alerts --------------

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

        // Already seeded -- just handle any remaining pending (e.g. after re-render)

        setTimeout(_fetchFallbackPrices, 300);

    }



    // Default settings -- panel always renders with these, then updates when real data arrives
    let hasDiscord  = false, hasTelegram = false, zThreshold = 2.0, alertsOn = true;
    let discMasked  = '', tgMasked = '';
    let whaleSize = 5, depeg = 1.0, volSpike = 2.0, cmeGap = 1.0, rebalance = 2.5;
    let tp1Pct = 5.0, tp2Pct = 10.0, slPct = 3.0;
    let rsiOs = 30.0, rsiOb = 80.0;

    try {
        const stored = localStorage.getItem('alert_settings');
        if (stored) {
            const s = JSON.parse(stored);
            if (s.zThreshold !== undefined) zThreshold = parseFloat(s.zThreshold);
            if (s.alertsOn !== undefined) alertsOn = !!s.alertsOn;
            if (s.whaleSize !== undefined) whaleSize = parseFloat(s.whaleSize);
            if (s.depeg !== undefined) depeg = parseFloat(s.depeg);
            if (s.volSpike !== undefined) volSpike = parseFloat(s.volSpike);
            if (s.cmeGap !== undefined) cmeGap = parseFloat(s.cmeGap);
            if (s.rebalance !== undefined) rebalance = parseFloat(s.rebalance);
            if (s.tp1Pct !== undefined) tp1Pct = parseFloat(s.tp1Pct);
            if (s.tp2Pct !== undefined) tp2Pct = parseFloat(s.tp2Pct);
            if (s.slPct  !== undefined) slPct  = parseFloat(s.slPct);
            if (s.rsiOs  !== undefined) rsiOs  = parseFloat(s.rsiOs);
            if (s.rsiOb  !== undefined) rsiOb  = parseFloat(s.rsiOb);
            if (s.discord) { hasDiscord = true; discMasked = s.discord.substring(0, 20) + '...'; }
            if (s.telegram) { hasTelegram = true; tgMasked = '...' + s.telegram.substring(s.telegram.length - 4); }
        }
    } catch(e) {}



    appEl.innerHTML = `

        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">

            <div>

                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alerts Hub</h2>

                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications</span>Live Alerts <span class="premium-badge">LIVE</span></h1>

                <p style="margin-top:4px;color:var(--text-dim);font-size:0.8rem">Real-time monitoring of statistical outliers, de-peg events, and institutional-scale movements.</p>

            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">

                <span id="alerts-live-pulse" style="font-size:0.55rem;color:var(--accent);letter-spacing:1px;font-weight:700;opacity:0.5;transition:opacity 0.5s">LIVE * Auto-sync every 60s</span>

                <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="switchView('docs-alerts')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>

                <button class="intel-action-btn mini" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="renderAlerts(window._alertsHubTabs)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span> REFRESH</button>

            </div>

        </div>

        ${tabs ? renderHubTabs('alerts', tabs) : ''}



        <!-- Notification Settings Panel -->

        <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem;border:1px solid rgba(0,212,170,0.15)">

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;flex-wrap:wrap;gap:8px">

                <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:#00d4aa"> NOTIFICATION SETTINGS</div>

                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.7rem;color:var(--text-dim)">

                    <span>ALERTS ENABLED</span>

                    <input type="checkbox" id="alerts-enabled-toggle" aria-label="Enable or disable all alert notifications" ${alertsOn ? 'checked' : ''} style="width:16px;height:16px;accent-color:#00d4aa;cursor:pointer">

                </label>

            </div>

            <div style="display:none;">

            </div>

            <!-- Z-Threshold Slider -->

            <div style="margin-bottom:1.2rem">

                <label style="font-size:0.6rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:8px">

                    <span> ALERT SENSITIVITY -- MIN. PREDICTED RETURN</span>

                    <span id="z-val-display" style="color:#ffd700;font-weight:900">${zThreshold.toFixed(1)}%</span>

                </label>

                <input type="range" id="z-threshold-slider" min="0.5" max="5" step="0.1" value="${zThreshold}" aria-label="Z-Score alert sensitivity threshold" aria-valuemin="0.5" aria-valuemax="5" aria-valuenow="${zThreshold}"

                    oninput="document.getElementById('z-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"

                    style="width:100%;accent-color:#00d4aa;cursor:pointer">

                <div style="display:flex;justify-content:space-between;font-size:0.55rem;color:var(--text-dim);margin-top:4px">

                    <span>0.5% -- Very Sensitive (many alerts)</span>

                    <span>5% -- Only High-Conviction Signals</span>

                </div>

            </div>



            <!-- Per-Signal Fine-Tuning -->

            <div style="margin-bottom:1.2rem">

                <div style="font-size:0.6rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:10px"> PER-SIGNAL FINE-TUNING</div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">



                    <!-- Whale Txn -->

                    <div>

                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">

                            <span> WHALE TXN MIN SIZE</span>

                            <span id="whale-val-display" style="color:#7dd3fc;font-weight:900">${whaleSize}M</span>

                        </label>

                        <input type="range" id="whale-threshold-slider" min="1" max="50" step="1" value="${whaleSize}" aria-label="Whale transaction size threshold in million USD" aria-valuemin="1" aria-valuemax="50" aria-valuenow="${whaleSize}"

                            oninput="document.getElementById('whale-val-display').textContent=parseFloat(this.value).toFixed(0)+'M'"

                            style="width:100%;accent-color:#7dd3fc;cursor:pointer">

                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">

                            <span>$1M</span><span>$50M+</span>

                        </div>

                    </div>



                    <!-- De-peg -->

                    <div>

                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">

                            <span> DE-PEG THRESHOLD</span>

                            <span id="depeg-val-display" style="color:#ef4444;font-weight:900">${depeg.toFixed(1)}%</span>

                        </label>

                        <input type="range" id="depeg-threshold-slider" min="0.1" max="5" step="0.1" value="${depeg}" aria-label="Stablecoin depeg deviation threshold" aria-valuemin="0.1" aria-valuemax="5" aria-valuenow="${depeg}"

                            oninput="document.getElementById('depeg-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"

                            style="width:100%;accent-color:#ef4444;cursor:pointer">

                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">

                            <span>0.1%</span><span>5%</span>

                        </div>

                    </div>



                    <!-- Vol Spike -->

                    <div>

                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">

                            <span> VOL SPIKE MIN -</span>

                            <span id="vol-val-display" style="color:#f59e0b;font-weight:900">${volSpike.toFixed(1)}-</span>

                        </label>

                        <input type="range" id="vol-spike-threshold-slider" min="1" max="5" step="0.1" value="${volSpike}" aria-label="Volume spike multiplier threshold" aria-valuemin="1" aria-valuemax="5" aria-valuenow="${volSpike}"

                            oninput="document.getElementById('vol-val-display').textContent=parseFloat(this.value).toFixed(1)+'-'"

                            style="width:100%;accent-color:#f59e0b;cursor:pointer">

                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">

                            <span>1- more alerts</span><span>5- extreme only</span>

                        </div>

                    </div>



                    <!-- CME Gap Fill -->

                    <div>

                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">

                            <span> CME GAP MIN SIZE</span>

                            <span id="cme-val-display" style="color:#8b5cf6;font-weight:900">${depeg.toFixed(1)}%</span>

                        </label>

                        <input type="range" id="cme-gap-threshold-slider" min="0.1" max="5" step="0.1" value="${cmeGap}" aria-label="CME gap size threshold in percent" aria-valuemin="0.1" aria-valuemax="5" aria-valuenow="${depeg}"

                            oninput="document.getElementById('cme-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"

                            style="width:100%;accent-color:#8b5cf6;cursor:pointer">

                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">

                            <span>0.1%</span><span>5%</span>

                        </div>

                    </div>



                    <!-- Portfolio Rebalance -->
                    <div>
                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                            <span> PORTFOLIO REBALANCE</span>
                            <span id="rebalance-val-display" style="color:#ec4899;font-weight:900">${rebalance.toFixed(1)}%</span>
                        </label>
                        <input type="range" id="rebalance-threshold-slider" min="0.5" max="10" step="0.1" value="${rebalance}" aria-label="Portfolio rebalance predicted return threshold" aria-valuemin="0.5" aria-valuemax="10" aria-valuenow="${rebalance}"
                            oninput="document.getElementById('rebalance-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"
                            style="width:100%;accent-color:#ec4899;cursor:pointer">
                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                            <span>0.5%</span><span>10%</span>
                        </div>
                    </div>

                    <!-- RSI OVERSOLD -->
                    <div>
                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                            <span> RSI OVERSOLD MAX</span>
                            <span id="rsi-os-val-display" style="color:#22c55e;font-weight:900">${rsiOs.toFixed(1)}</span>
                        </label>
                        <input type="range" id="rsi-os-slider" min="10" max="50" step="1" value="${rsiOs}"
                            oninput="document.getElementById('rsi-os-val-display').textContent=parseFloat(this.value).toFixed(1)"
                            style="width:100%;accent-color:#22c55e;cursor:pointer">
                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                            <span>10</span><span>50</span>
                        </div>
                    </div>

                    <!-- RSI OVERBOUGHT -->
                    <div>
                        <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                            <span> RSI OVERBOUGHT MIN</span>
                            <span id="rsi-ob-val-display" style="color:#ef4444;font-weight:900">${rsiOb.toFixed(1)}</span>
                        </label>
                        <input type="range" id="rsi-ob-slider" min="50" max="95" step="1" value="${rsiOb}"
                            oninput="document.getElementById('rsi-ob-val-display').textContent=parseFloat(this.value).toFixed(1)"
                            style="width:100%;accent-color:#ef4444;cursor:pointer">
                        <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                            <span>50</span><span>95</span>
                        </div>
                    </div>
                </div>

                <!-- TP/SL Divider -->
                <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border)">
                    <p style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:var(--accent);margin-bottom:1rem">SIGNAL EXIT THRESHOLDS</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem">

                        <!-- TP1 -->
                        <div>
                            <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                                <span>TP1 (L1)</span>
                                <span id="tp1-val-display" style="color:#22c55e;font-weight:900">${tp1Pct.toFixed(1)}%</span>
                            </label>
                            <input type="range" id="tp1-pct-slider" min="1" max="20" step="0.5" value="${tp1Pct}"
                                oninput="document.getElementById('tp1-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"
                                style="width:100%;accent-color:#22c55e;cursor:pointer">
                            <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                                <span>1%</span><span>20%</span>
                            </div>
                        </div>

                        <!-- TP2 -->
                        <div>
                            <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                                <span>TP2 (L2)</span>
                                <span id="tp2-val-display" style="color:#00f2ff;font-weight:900">${tp2Pct.toFixed(1)}%</span>
                            </label>
                            <input type="range" id="tp2-pct-slider" min="1" max="30" step="0.5" value="${tp2Pct}"
                                oninput="document.getElementById('tp2-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"
                                style="width:100%;accent-color:#00f2ff;cursor:pointer">
                            <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                                <span>1%</span><span>30%</span>
                            </div>
                        </div>

                        <!-- Stop Loss -->
                        <div>
                            <label style="font-size:0.58rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px">
                                <span>STOP LOSS</span>
                                <span id="sl-val-display" style="color:#ef4444;font-weight:900">${slPct.toFixed(1)}%</span>
                            </label>
                            <input type="range" id="sl-pct-slider" min="0.5" max="15" step="0.5" value="${slPct}"
                                oninput="document.getElementById('sl-val-display').textContent=parseFloat(this.value).toFixed(1)+'%'"
                                style="width:100%;accent-color:#ef4444;cursor:pointer">
                            <div style="display:flex;justify-content:space-between;font-size:0.5rem;color:var(--text-dim);margin-top:3px">
                                <span>0.5%</span><span>15%</span>
                            </div>
                        </div>

                    </div>
                    <p style="font-size:0.55rem;color:var(--text-dim);margin-top:8px;opacity:0.7">These thresholds determine when a signal is classified as TP1 Hit, TP2 Hit, or Stopped Out in the Alerts Hub and Signal Leaderboard.</p>
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

                ['badge-vol-trigger',  'Vol Spike 2.0x',       '#f59e0b', 'bolt'],

                ['badge-cme-trigger',  'CME Gap 1.0%',         '#8b5cf6', 'pivot_table_chart']

            ].map(([id, label, color, icon]) => `

                <div style="display:flex;align-items:center;gap:5px;background:${alphaColor(0.03)};border:1px solid ${color}33;border-radius:6px;padding:4px 10px">

                    <span class="material-symbols-outlined" style="font-size:12px;color:${color}">${icon}</span>

                    <span id="${id}" style="font-size:0.6rem;color:${color};font-weight:700">${label}</span>

                </div>

            `).join('')}

            <span id="alerts-paused-badge" style="display:none;font-size:0.55rem;font-weight:900;letter-spacing:1px;padding:3px 10px;border-radius:100px;background:rgba(255,62,62,0.12);color:var(--risk-high);border:1px solid rgba(255,62,62,0.3)"> PAUSED</span>

            <span style="margin-left:auto;font-size:0.6rem;color:var(--text-dim)">Updated: ${new Date().toLocaleTimeString()}</span>

        </div>



        <div id="live-alert-list" class="alert-list" style="display:flex; flex-direction:column; gap:1.5rem">

            ${data && data.length ? (() => {

                // Cache for client-side filtering

                window._alertsCache = data;



                return `

                <div id="alert-filter-bar" style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-radius:12px;border:1px solid var(--border);margin-bottom:4px;align-items:center">

                    <span style="font-size:0.6rem;color:var(--text-dim);font-weight:700;letter-spacing:1px;margin-right:4px">FILTER:</span>

                    ${['ALL','RSI','MACD','VOLUME','ML_ALPHA','REGIME','DIVERGENCE'].map(t => `

                        <button class="filter-btn alert-filter-btn ${t==='ALL'?'active':''}" data-afilter="${t}"

                            style="font-size:0.6rem;padding:3px 10px;border-radius:100px;border:1px solid ${alphaColor(0.1)};background:${t==='ALL'?'rgba(0,242,255,0.12)':alphaColor(0.04)};color:${t==='ALL'?'var(--accent)':'var(--text-dim)'};cursor:pointer;font-weight:700;letter-spacing:1px;transition:all 0.15s"

                            onclick="window.filterAlerts('${t}',this)">${t.replace('_',' ')}</button>

                    `).join('')}

                    <div style="margin-left:auto;display:flex;align-items:center;gap:6px;border:1px solid var(--border);border-radius:8px;padding:4px 10px">

                        <span class="material-symbols-outlined" style="font-size:14px;color:var(--text-dim)">search</span>

                        <input id="alert-ticker-search" type="text" placeholder="Filter ticker..." autocomplete="off"

                            style="background:transparent;border:none;outline:none;color:var(--text);font-family:var(--font-mono);font-size:0.7rem;width:100px"

                            oninput="window.filterAlerts(document.querySelector('.alert-filter-btn.active')?.dataset?.afilter||'ALL',null,this.value)">

                    </div>

                    <span id="alert-count-label" style="font-size:0.6rem;color:var(--text-dim)">50 alerts</span>

                </div>

                <div id="alert-cards-container" style="display:flex;flex-direction:column;gap:1.5rem">`;

            })() : ''}

            ${data && data.length ? data.map(a => {

                const ts = a.timestamp ? new Date(a.timestamp) : null;

                const tsDisplay = ts ? ts.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'SYNC';

                const sevColor = a.severity === 'high' || a.severity === 'critical' ? 'var(--risk-high)' : (a.severity === 'medium' ? 'var(--accent)' : 'var(--text-dim)');



                // P&L tracking: compute time since signal

                const ageMs = ts ? (Date.now() - ts.getTime()) : null;

                const ageLabel = ageMs !== null ? (

                    ageMs < 3600000 ? `${Math.round(ageMs/60000)}m ago` :

                    ageMs < 86400000 ? `${Math.round(ageMs/3600000)}h ago` :

                    `${Math.round(ageMs/86400000)}d ago`

                ) : '';



                // Live price from WS broadcast (window.livePrices set by WebSocket handler)

                const sym = a.ticker ? a.ticker.replace('-USD','').toUpperCase() : null;

                const livePrice = sym && window.livePrices ? window.livePrices[sym] : null;

                const entryPrice = a.price && parseFloat(a.price) > 0 ? parseFloat(a.price) : null;

                let pnlHtml = '';

                if (entryPrice && livePrice && sym) {

                    let pnlPct = ((livePrice - entryPrice) / entryPrice * 100);
                    if (a.type && (a.type.toUpperCase().includes('OVERBOUGHT') || a.type.toUpperCase().includes('BEARISH'))) {
                        pnlPct = -pnlPct;
                    }
                    const pnlColor = pnlPct > 0 ? 'var(--risk-low)' : pnlPct < 0 ? 'var(--risk-high)' : 'var(--text-dim)';

                    const pnlSign = pnlPct > 0 ? '+' : '';

                    pnlHtml = `<div style="display:flex;gap:12px;align-items:center;padding:8px 12px;background:${alphaColor(0.03)};border-radius:8px;border:1px solid ${alphaColor(0.06)};margin-bottom:10px;flex-wrap:wrap">

                        <div style="font-size:0.65rem;color:var(--text-dim)">

                            <span style="font-weight:700;letter-spacing:1px">ENTRY</span><br>

                            <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${entryPrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span>

                        </div>

                        <span style="color:var(--text-dim);font-size:0.8rem"></span>

                        <div style="font-size:0.65rem;color:var(--text-dim)">

                            <span style="font-weight:700;letter-spacing:1px">NOW</span><br>

                            <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${livePrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span>

                        </div>

                        <div style="margin-left:auto;text-align:right">

                            <div style="font-size:1rem;font-weight:900;color:${pnlColor};font-family:var(--font-mono)">${pnlSign}${pnlPct.toFixed(2)}%</div>

                            <div style="font-size:0.55rem;color:var(--text-dim)">since signal</div>

                        </div>

                    </div>`;

                } else if (entryPrice) {

                    // No live price yet -- render a pending placeholder that gets upgraded

                    // by the bulk-seed callback once /signals resolves

                    pnlHtml = `<div class="pnl-pending" data-ticker="${a.ticker || ''}" data-entry="${entryPrice}" style="display:inline-flex;align-items:center;gap:8px;padding:4px 10px;background:${alphaColor(0.03)};border-radius:6px;border:1px solid ${alphaColor(0.06)};margin-bottom:10px">

                        <span style="font-size:0.6rem;color:var(--text-dim);font-weight:700;letter-spacing:1px">ENTRY</span>

                        <span style="font-family:var(--font-mono);font-size:0.8rem;font-weight:700">$${entryPrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span>

                        <span style="font-size:0.6rem;color:var(--text-dim);opacity:0.5;margin-left:4px"> fetching live...</span>

                    </div>`;

                }



                return `

                <div class="alert-card ${a.severity}" style="background:var(--bg-card); border:1px solid var(--border); border-left:4px solid ${sevColor}; border-radius:12px; padding:1.5rem; position:relative; overflow:hidden; transition:transform 0.2s ease,box-shadow 0.2s ease" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">

                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;flex-wrap:wrap;gap:8px">

                        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">

                            <span style="font-size:0.7rem; font-weight:900; background:${alphaColor(0.05)}; padding:4px 8px; border-radius:4px; color:${sevColor}">${a.type}</span>

                            <span style="font-size:0.65rem;padding:3px 8px;border-radius:100px;font-weight:800;background:${a.severity === 'high' || a.severity === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(0,242,255,0.1)'};color:${sevColor};border:1px solid ${sevColor}33;letter-spacing:1px">${a.severity?.toUpperCase() || 'INFO'}</span>

                            ${a.ticker && a.ticker !== 'SYSTEM' ? `<span style="font-size:0.65rem;font-weight:900;color:var(--accent)">${a.ticker.replace('-USD','')}</span>` : ''}

                        </div>

                        <div style="text-align:right">

                            <div style="font-size:0.7rem; color:var(--text-dim); font-family:var(--font-mono)">${tsDisplay}</div>

                            ${ageLabel ? `<div style="font-size:0.6rem;color:var(--text-dim);opacity:0.6">${ageLabel}</div>` : ''}

                        </div>

                    </div>

                    <div style="font-size:1.1rem; font-weight:800; margin-bottom:8px">${a.title || (a.ticker + ' SIGNAL')}</div>

                    <div style="font-size:0.85rem; color:var(--text-dim); line-height:1.4; margin-bottom:1rem">${a.content || a.message}</div>

                    ${pnlHtml}

                    <div style="display:flex; gap:10px;flex-wrap:wrap">

                        <button class="intel-action-btn mini" onclick="showSignalDetail('${a.id}', '${a.ticker}')" style="font-size:0.6rem; padding:4px 10px">

                            <span class="material-symbols-outlined" style="font-size:14px; margin-right:4px">psychology</span>

                            AI REASONING

                        </button>

                        ${a.ticker && a.ticker !== 'SYSTEM' ? `

                        <button class="intel-action-btn mini outline" onclick="openDetail('${a.ticker}', 'ALERT')" style="font-size:0.6rem;padding:4px 10px">

                            <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">monitoring</span>

                            CHART

                        </button>

                        <button class="intel-action-btn mini outline" onclick="addToWatchlist_quick('${a.ticker}')" style="font-size:0.6rem;padding:4px 10px;color:#22c55e;border-color:rgba(34,197,94,0.3)">

                            <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px;color:#22c55e">add_circle</span>

                            WATCH

                        </button>

` : ''}

                    </div>

                </div>

                `;

            }).join('') : `

            <div class="card" style="padding:3rem;text-align:center">

                <span class="material-symbols-outlined" style="font-size:3rem;color:var(--risk-low);display:block;margin-bottom:1rem">check_circle</span>

                <h3 style="color:var(--risk-low);margin-bottom:0.5rem">ALL CLEAR</h3>

                <p style="color:var(--text-dim);font-size:0.85rem">No active high-severity threats detected. All trigger conditions within normal parameters.</p>

            </div>`}

            ${window._alertsCache ? '</div>' : ''}

        </div>`;



// Clear badge when viewing alerts

    const badge = document.getElementById('alert-badge');

    if (badge) badge.style.display = 'none';



    // filterAlerts -- client-side filter using cached data

    window.filterAlerts = function(type, btn, tickerQ) {

        const data = window._alertsCache || [];

        const tickerVal = tickerQ !== undefined ? tickerQ : (document.getElementById('alert-ticker-search')?.value || '');

        const tq = tickerVal.trim().toUpperCase();



        // Update active button state

        if (btn) {

            document.querySelectorAll('.alert-filter-btn').forEach(b => {

                b.style.background = alphaColor(0.04); b.style.color = 'var(--text-dim)'; b.classList.remove('active');

            });

            btn.style.background = 'rgba(0,242,255,0.12)'; btn.style.color = 'var(--accent)'; btn.classList.add('active');

        }



        const filtered = data.filter(a => {

            const typeMatch = type === 'ALL' || (a.type || '').toUpperCase().includes(type);

            const tickerMatch = !tq || (a.ticker || '').toUpperCase().includes(tq);

            return typeMatch && tickerMatch;

        });



        const container = document.getElementById('alert-cards-container');

        const countLabel = document.getElementById('alert-count-label');

        if (countLabel) countLabel.textContent = filtered.length + ' alerts';

        if (!container) return;



        if (!filtered.length) {

            container.innerHTML = `<div class="card" style="padding:2rem;text-align:center"><p style="color:var(--text-dim)">No alerts match this filter.</p></div>`;

            return;

        }



        container.innerHTML = filtered.map(a => {

            const ts = a.timestamp ? new Date(a.timestamp) : null;

            const tsDisplay = ts ? ts.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'SYNC';

            const sev = a.severity || 'medium';

            const sevColor = sev === 'high' || sev === 'critical' ? 'var(--risk-high)' : sev === 'medium' ? 'var(--accent)' : 'var(--text-dim)';

            const ep = a.price && parseFloat(a.price) > 0 ? parseFloat(a.price) : null;

            const lp = window.livePrices ? (window.livePrices[a.ticker] || window.livePrices[(a.ticker||'').replace('-USD','')]) : null;

            const pnlHtml = ep && lp ? (() => { let pct = ((lp-ep)/ep*100); if (a.type && (a.type.toUpperCase().includes('OVERBOUGHT') || a.type.toUpperCase().includes('BEARISH'))) { pct = -pct; } const col = pct>=0?'var(--risk-low)':'var(--risk-high)'; return `<div style="display:inline-flex;gap:8px;padding:4px 10px;background:${alphaColor(0.03)};border-radius:6px;margin-bottom:10px"><span style="font-size:0.6rem;color:var(--text-dim)">ENTRY $${ep.toLocaleString()}</span><span style="font-family:var(--font-mono);font-size:0.8rem;font-weight:700;color:${col}">${pct>=0?'+':''}${pct.toFixed(2)}%</span></div>`; })() : ep ? `<div style="display:inline-flex;gap:8px;padding:4px 10px;background:${alphaColor(0.03)};border-radius:6px;margin-bottom:10px"><span style="font-size:0.6rem;color:var(--text-dim)">ENTRY $${ep.toLocaleString('en-US',{maximumFractionDigits:4})}</span></div>` : '';

            return `<div class="alert-card ${sev}" style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid ${sevColor};border-radius:12px;padding:1.5rem">

                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:8px">

                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">

                        <span style="font-size:0.65rem;font-weight:900;padding:3px 8px;border-radius:4px;background:${alphaColor(0.05)};color:${sevColor}">${a.type||''}</span>

                        <span style="font-size:0.7rem;color:var(--accent);font-weight:900">${(a.ticker||'').replace('-USD','')}</span>

                    </div>

                    <span style="font-size:0.65rem;color:var(--text-dim);font-family:var(--font-mono)">${tsDisplay}</span>

                </div>

                <div style="font-size:1rem;font-weight:800;margin-bottom:8px">${a.title||''}</div>

                <div style="font-size:0.82rem;color:var(--text-dim);line-height:1.5;margin-bottom:10px">${a.content||a.message||''}</div>

                ${pnlHtml}

            </div>`;

        }).join('');

    };



    // Non-blocking: load saved settings and update the panel after initial render

    fetchAPI('/alert-settings').then(s => {

        if (!s || s.error) return;
        const slider  = document.getElementById('z-threshold-slider');
        const zDisp   = document.getElementById('z-val-display');
        const toggle  = document.getElementById('alerts-enabled-toggle');
        if (slider && s.z_threshold) { slider.value = s.z_threshold; if(zDisp) zDisp.textContent = parseFloat(s.z_threshold).toFixed(1) + '%'; }
        if (toggle) toggle.checked = s.alerts_enabled !== false;
        // Populate the 4 signal sliders

        const setSlider = (id, dispId, val, fmt) => {

            const el = document.getElementById(id);

            const disp = document.getElementById(dispId);

            if (el && val != null) { el.value = val; if (disp) disp.textContent = fmt(val); }

        };

        setSlider('whale-threshold-slider',     'whale-val-display', s.whale_threshold,      v => parseFloat(v).toFixed(0) + 'M');

        setSlider('depeg-threshold-slider',     'depeg-val-display', s.depeg_threshold,      v => parseFloat(v).toFixed(1) + '%');
        setSlider('vol-spike-threshold-slider', 'vol-val-display',   s.vol_spike_threshold,  v => parseFloat(v).toFixed(1) + '-');
        setSlider('cme-gap-threshold-slider',   'cme-val-display',   s.cme_gap_threshold,    v => parseFloat(v).toFixed(1) + '%');
        setSlider('rebalance-threshold-slider', 'rebalance-val-display', s.rebalance_threshold, v => parseFloat(v).toFixed(1) + '%');
        setSlider('tp1-pct-slider', 'tp1-val-display', s.tp1_pct, v => parseFloat(v).toFixed(1) + '%');
        setSlider('tp2-pct-slider', 'tp2-val-display', s.tp2_pct, v => parseFloat(v).toFixed(1) + '%');
        setSlider('sl-pct-slider',  'sl-val-display',  s.sl_pct,  v => parseFloat(v).toFixed(1) + '%');



        // B22 fix: Update Active Triggers chip labels with real saved thresholds

        const badgeMap = {

            'badge-z-trigger':    `Z-Score &gt; ${parseFloat(s.z_threshold || 2.0).toFixed(1)}%`,

            'badge-whale-trigger':`Whale Txn &gt; $${parseFloat(s.whale_threshold || 5).toFixed(0)}M`,

            'badge-depeg-trigger':`De-peg &gt; ${parseFloat(s.depeg_threshold || 1).toFixed(1)}%`,

            'badge-vol-trigger':  `Vol Spike ${parseFloat(s.vol_spike_threshold || 2).toFixed(1)}x`,

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
    const rebalance = parseFloat(document.getElementById('rebalance-threshold-slider')?.value || 2.5);
    const enabled  = document.getElementById('alerts-enabled-toggle')?.checked !== false;

    
    const tp1    = parseFloat(document.getElementById('tp1-pct-slider')?.value || 5.0);
    const tp2    = parseFloat(document.getElementById('tp2-pct-slider')?.value || 10.0);
    const sl     = parseFloat(document.getElementById('sl-pct-slider')?.value || 3.0);
    const rsiOs  = parseFloat(document.getElementById('rsi-os-slider')?.value || 30.0);
    const rsiOb  = parseFloat(document.getElementById('rsi-ob-slider')?.value || 80.0);

    localStorage.setItem('alert_settings', JSON.stringify({
        discord, telegram, zThreshold: z, alertsOn: enabled,
        whaleSize: whale, depeg, volSpike: vol, cmeGap: cme, rebalance,
        tp1Pct: tp1, tp2Pct: tp2, slPct: sl, rsiOs: rsiOs, rsiOb: rsiOb
    }));

    const result = await fetchAPI('/alert-settings', 'POST', {
        discord_webhook: discord, telegram_chat_id: telegram,
        z_threshold: z, alerts_enabled: enabled,
        whale_threshold: whale, depeg_threshold: depeg,
        vol_spike_threshold: vol, cme_gap_threshold: cme,
        rebalance_threshold: rebalance,
        tp1_pct: tp1, tp2_pct: tp2, sl_pct: sl,
        algo_rsi_oversold: rsiOs, algo_rsi_overbought: rsiOb
    });

    if (result?.success) {

        showToast('ALERT SETTINGS', `Saved. Discord: ${result.has_discord ? '\u2713' : '\u2717'}  Telegram: ${result.has_telegram ? '\u2713' : '\u2717'}`, 'success');

        // Refresh poller sensitivity immediately -- new threshold takes effect on next poll

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

        // Fetch AI analysis AND live ATR in parallel
        const cleanTicker = (ticker || 'BTC-USD').replace(/^([A-Z]+)$/, '$1-USD');
        const [data, atrData] = await Promise.all([
            fetchAPI(`/ai_analyst?ticker=${ticker}${alertId && alertId !== 'undefined' ? `&alert_id=${alertId}` : ''}`),
            fetchAPI(`/atr?ticker=${cleanTicker}`).catch(() => null)
        ]);

        // ── Build ATR panel HTML ───────────────────────────────────────────
        let atrHtml = '';
        if (atrData && !atrData.error && atrData.atr) {
            const fmt = (n, dp=2) => n.toLocaleString(undefined, {minimumFractionDigits: dp, maximumFractionDigits: dp});
            const regimeColors = { LOW: '#22c55e', NORMAL: '#00f2ff', ELEVATED: '#facc15', HIGH: '#ef4444' };
            const rc = regimeColors[atrData.volatility_regime] || '#00f2ff';

            // Default account = $25k, 1% risk, 2× ATR stop
            const acct = 25000;
            const riskUsd = acct * 0.01;
            const units  = atrData.stop_distance > 0 ? riskUsd / atrData.stop_distance : 0;
            const notional = units * atrData.current_price;

            atrHtml = `
            <div style="margin-bottom:1.2rem; padding:1rem 1.2rem; background:rgba(0,242,255,0.04); border:1px solid rgba(0,242,255,0.15); border-radius:12px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.8rem; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="material-symbols-outlined" style="font-size:1rem; color:var(--accent);">calculate</span>
                        <span style="font-size:0.65rem; font-weight:900; letter-spacing:2px; color:var(--accent);">ATR POSITION SIZING</span>
                        <span style="font-size:0.5rem; font-weight:900; padding:2px 8px; border-radius:100px; background:${rc}22; border:1px solid ${rc}; color:${rc}; letter-spacing:1px;">${atrData.volatility_regime} VOL</span>
                    </div>
                    <span style="font-size:0.55rem; color:var(--text-dim); font-family:'JetBrains Mono';">Wilder 14D · 1% Risk · $${acct.toLocaleString()} acct</span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:8px;">
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px; text-align:center;">
                        <div style="font-size:0.5rem; font-weight:900; letter-spacing:1px; color:var(--text-dim); margin-bottom:3px;">ATR (14D)</div>
                        <div style="font-size:0.85rem; font-weight:900; color:white; font-family:'JetBrains Mono';">$${fmt(atrData.atr)}</div>
                        <div style="font-size:0.5rem; color:var(--text-dim);">${atrData.atr_pct}% of price</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px; text-align:center;">
                        <div style="font-size:0.5rem; font-weight:900; letter-spacing:1px; color:var(--text-dim); margin-bottom:3px;">2× ATR STOP</div>
                        <div style="font-size:0.85rem; font-weight:900; color:#facc15; font-family:'JetBrains Mono';">$${fmt(atrData.stop_distance)}</div>
                        <div style="font-size:0.5rem; color:var(--text-dim);">${atrData.stop_pct}% below entry</div>
                    </div>
                    <div style="background:rgba(0,242,255,0.05); border:1px solid rgba(0,242,255,0.15); border-radius:8px; padding:8px 10px; text-align:center;">
                        <div style="font-size:0.5rem; font-weight:900; letter-spacing:1px; color:var(--accent); margin-bottom:3px;">POSITION SIZE</div>
                        <div style="font-size:0.85rem; font-weight:900; color:white; font-family:'JetBrains Mono';">${fmt(units, 4)}</div>
                        <div style="font-size:0.5rem; color:var(--text-dim);">${atrData.ticker.split('-')[0]} units</div>
                    </div>
                    <div style="background:rgba(0,242,255,0.05); border:1px solid rgba(0,242,255,0.15); border-radius:8px; padding:8px 10px; text-align:center;">
                        <div style="font-size:0.5rem; font-weight:900; letter-spacing:1px; color:var(--accent); margin-bottom:3px;">NOTIONAL</div>
                        <div style="font-size:0.85rem; font-weight:900; color:white; font-family:'JetBrains Mono';">$${fmt(notional)}</div>
                        <div style="font-size:0.5rem; color:var(--text-dim);">1% risk = $${fmt(riskUsd)}</div>
                    </div>
                    <div style="background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.15); border-radius:8px; padding:8px 10px; text-align:center;">
                        <div style="font-size:0.5rem; font-weight:900; letter-spacing:1px; color:#ef4444; margin-bottom:3px;">ATR STOP PRICE</div>
                        <div style="font-size:0.85rem; font-weight:900; color:#ef4444; font-family:'JetBrains Mono';">$${fmt(atrData.current_price - atrData.stop_distance)}</div>
                        <div style="font-size:0.5rem; color:var(--text-dim);">entry − 2× ATR</div>
                    </div>
                </div>
            </div>`;
        }

        if (data && data.summary) {

            content.innerHTML = atrHtml + data.summary;

        } else {

            content.innerHTML = atrHtml + `

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

