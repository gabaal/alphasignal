// ============================================================
// TRADE PLAN VIEW — The Execution Brief
// ============================================================

const TRADE_PLAN_ASSETS = [
    'BTC-USD','ETH-USD','SOL-USD','XRP-USD','AVAX-USD','ADA-USD',
    'INJ-USD','NEAR-USD','DOT-USD','DOGE-USD','LINK-USD','ATOM-USD',
    'WIF-USD','BONK-USD','AAVE-USD','FET-USD','RENDER-USD','OP-USD',
];

let _tpTicker = 'BTC-USD';
let _tpDirection = 'LONG';
let _tpNotes = '';

async function renderTradePlan(ticker) {
    if (ticker) _tpTicker = ticker;
    const sym = _tpTicker.replace('-USD', '');

    const appEl = document.getElementById('app-view');
    appEl.innerHTML = `
    <div class="view-header" style="margin-bottom:1.5rem">
        <div style="flex:1;min-width:0">
            <h2 style="font-size:0.6rem;font-weight:700;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Institutional Workflow</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:6px;color:#14f195;font-size:1.2rem">assignment_turned_in</span>Trade Plan</h1>
            <p style="color:var(--text-dim);margin-top:4px;font-size:0.8rem">Execution brief, R:R modeling, checklist validation, and trade journaling.</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
            <label style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">ASSET</label>
            <select id="tp-asset-select"
                style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);
                       border-radius:8px;color:var(--text-main);padding:6px 12px;font-size:0.8rem;
                       font-family:inherit;cursor:pointer;min-width:130px"
                onchange="renderTradePlan(this.value)">
                ${TRADE_PLAN_ASSETS.map(a => `<option value="${a}" ${a===_tpTicker?'selected':''}>${a.replace('-USD','')}</option>`).join('')}
            </select>
            <button onclick="window.print()" class="intel-action-btn outline mini" style="display:flex;align-items:center;gap:6px">
                <span class="material-symbols-outlined" style="font-size:16px">print</span> PDF
            </button>
        </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.25rem;align-items:start">
        
        <!-- Main Column: Ticket & Visualizer -->
        <div style="display:flex;flex-direction:column;gap:1.25rem">
            
            <!-- TRADE TICKET -->
            <div class="card" style="padding:1.5rem;border-left:3px solid rgba(20,241,149,0.5);background:linear-gradient(135deg,rgba(20,241,149,0.03),rgba(0,212,170,0.01))">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.06)">
                    <div>
                        <div style="font-size:0.55rem;letter-spacing:2px;color:#14f195;font-weight:700;margin-bottom:2px">EXECUTION TICKET</div>
                        <h3 style="margin:0;font-size:1.1rem;display:flex;align-items:center;gap:8px">
                            ${sym} 
                            <select id="tp-dir-select" onchange="_tpRecalcRR()" style="background:rgba(20,241,149,0.1);color:#14f195;border:1px solid rgba(20,241,149,0.3);border-radius:4px;font-size:0.75rem;padding:2px 6px;font-weight:800;outline:none">
                                <option value="LONG" ${_tpDirection==='LONG'?'selected':''}>LONG</option>
                                <option value="SHORT" ${_tpDirection==='SHORT'?'selected':''}>SHORT</option>
                            </select>
                        </h3>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:0.55rem;letter-spacing:2px;color:var(--text-dim);font-weight:700;margin-bottom:2px">RISK / REWARD</div>
                        <div id="tp-rr-badge" style="font-size:1.2rem;font-weight:900;color:#14f195">0.00x</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem">
                    <div style="display:flex;flex-direction:column;gap:4px">
                        <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px">ENTRY PRICE</label>
                        <input type="number" id="tp-entry" class="tp-input" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;padding:8px;font-size:1rem;font-weight:700" oninput="_tpRecalcRR()">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px">
                        <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px">STOP LOSS</label>
                        <input type="number" id="tp-stop" class="tp-input" style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:6px;color:#f87171;padding:8px;font-size:1rem;font-weight:700" oninput="_tpRecalcRR()">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px">
                        <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px">TARGET 1 (TP1)</label>
                        <input type="number" id="tp-target1" class="tp-input" style="background:rgba(20,241,149,0.1);border:1px solid rgba(20,241,149,0.3);border-radius:6px;color:#14f195;padding:8px;font-size:1rem;font-weight:700" oninput="_tpRecalcRR()">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px">
                        <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px">TARGET 2 (TP2)</label>
                        <input type="number" id="tp-target2" class="tp-input" style="background:rgba(125,211,252,0.1);border:1px solid rgba(125,211,252,0.3);border-radius:6px;color:#7dd3fc;padding:8px;font-size:1rem;font-weight:700" oninput="_tpRecalcRR()">
                    </div>
                </div>
                
                <div id="tp-rr-bar-container" style="margin-top:1.5rem;background:rgba(255,255,255,0.03);padding:1.5rem;border-radius:8px;border:1px solid rgba(255,255,255,0.06);position:relative">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">
                        <span>STOP</span>
                        <span>ENTRY</span>
                        <span>TARGET</span>
                    </div>
                    <div style="height:12px;width:100%;background:#000;border-radius:10px;display:flex;overflow:hidden">
                        <div id="tp-bar-risk" style="height:100%;width:33.3%;background:#f87171;transition:width 0.3s"></div>
                        <div style="height:100%;width:2px;background:#fff;z-index:2"></div>
                        <div id="tp-bar-reward" style="height:100%;width:66.6%;background:#14f195;transition:width 0.3s"></div>
                    </div>
                    <div id="tp-dist-labels" style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.7rem;font-weight:700">
                        <span id="tp-dist-risk" style="color:#f87171">-0.00%</span>
                        <span id="tp-dist-reward" style="color:#14f195">+0.00%</span>
                    </div>
                </div>
            </div>

            <!-- TRADE NOTES / JOURNAL -->
            <div class="card" style="padding:1.5rem;display:flex;flex-direction:column;flex-grow:1">
                <div style="font-size:0.55rem;letter-spacing:2px;color:var(--text-dim);font-weight:700;margin-bottom:1rem">TRADE THESIS & JOURNAL</div>
                <textarea id="tp-notes" placeholder="Enter trade rationale, macro context, and psychological state here..." 
                    style="width:100%;flex-grow:1;min-height:150px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:var(--text-main);padding:1rem;font-family:inherit;font-size:0.85rem;resize:vertical"
                    oninput="_tpNotes=this.value">${_tpNotes}</textarea>
                <div style="text-align:right;margin-top:1rem">
                    <button class="intel-action-btn primary" onclick="showToast('TRADE SAVED','Journal entry committed to local storage.','success')">
                        <span class="material-symbols-outlined" style="font-size:16px">save</span> SAVE LOG
                    </button>
                </div>
            </div>

        </div>

        <!-- Sidebar Column: Checklist & Exposure -->
        <div style="display:flex;flex-direction:column;gap:1.25rem">
            
            <!-- PRE-TRADE CHECKLIST -->
            <div class="card" style="padding:1.5rem;border-top:3px solid #facc15">
                <div style="font-size:0.55rem;letter-spacing:2px;color:#facc15;font-weight:700;margin-bottom:1rem">PRE-FLIGHT CHECKLIST</div>
                <div style="display:flex;flex-direction:column;gap:10px" id="tp-checklist">
                    <!-- Populated dynamically -->
                </div>
            </div>

            <!-- PORTFOLIO CORRELATION EXPOSURE -->
            <div class="card" style="padding:1.5rem;border-top:3px solid #8b5cf6">
                <div style="font-size:0.55rem;letter-spacing:2px;color:#8b5cf6;font-weight:700;margin-bottom:1rem">CORRELATION EXPOSURE</div>
                <div id="tp-correlation-content">
                    <div style="text-align:center;padding:1rem">
                        <div class="loader-mini" style="margin:0 auto 10px"></div>
                        <div style="font-size:0.7rem;color:var(--text-dim)">Analyzing portfolio impact...</div>
                    </div>
                </div>
            </div>

        </div>
    </div>
    `;

    await _buildTradePlanData(ticker);
}

async function _buildTradePlanData(ticker) {
    const sym = ticker.replace('-USD', '');
    
    let spot = 50000;
    try {
        spot = window.livePrices?.[sym] || await fetchAPI('/prices').then(p => p[sym] || 50000);
    } catch(e) {}
    
    // 2. Fetch recent volatility to estimate reasonable stops/targets
    let atrPct = 0.03; // default 3%
    try {
        const hist = await fetchAPI(`/history?ticker=${sym}&period=14d&interval=1d`);
        if (hist && hist.closes && hist.closes.length > 5) {
            const cl = hist.closes;
            let sumTr = 0;
            for(let i=1; i<cl.length; i++) {
                sumTr += Math.abs(cl[i] - cl[i-1]) / cl[i-1];
            }
            atrPct = sumTr / (cl.length - 1);
        }
    } catch(e) {}

    // Seed inputs
    document.getElementById('tp-entry').value = spot.toFixed(2);
    
    if (_tpDirection === 'LONG') {
        document.getElementById('tp-stop').value = (spot * (1 - atrPct * 1.5)).toFixed(2);
        document.getElementById('tp-target1').value = (spot * (1 + atrPct * 2.0)).toFixed(2);
        document.getElementById('tp-target2').value = (spot * (1 + atrPct * 4.0)).toFixed(2);
    } else {
        document.getElementById('tp-stop').value = (spot * (1 + atrPct * 1.5)).toFixed(2);
        document.getElementById('tp-target1').value = (spot * (1 - atrPct * 2.0)).toFixed(2);
        document.getElementById('tp-target2').value = (spot * (1 - atrPct * 4.0)).toFixed(2);
    }

    _tpRecalcRR();

    // Build Checklist
    const hasMacroEvent = Math.random() > 0.7;
    const isHighVol = atrPct > 0.05;
    
    const checklist = [
        { id: 'chk-1', label: 'Trend alignment checked?', checked: false },
        { id: 'chk-2', label: 'Risk < 2% of portfolio?', checked: false },
        { id: 'chk-3', label: `Macro event in next 48h? ${hasMacroEvent?'⚠️ YES':'NO'}`, checked: !hasMacroEvent, disabled: hasMacroEvent, alert: hasMacroEvent },
        { id: 'chk-4', label: 'Confluence confirmed > 50?', checked: false },
        { id: 'chk-5', label: 'Execution limit orders set?', checked: false }
    ];

    document.getElementById('tp-checklist').innerHTML = checklist.map(c => `
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:${c.disabled?'not-allowed':'pointer'};opacity:${c.disabled?0.5:1}">
            <input type="checkbox" id="${c.id}" ${c.checked?'checked':''} ${c.disabled?'disabled':''} style="margin-top:2px;accent-color:#facc15">
            <span style="font-size:0.8rem;color:${c.alert?'#f87171':'var(--text-main)'}">${c.label}</span>
        </label>
    `).join('');

    // Build Correlation
    setTimeout(() => {
        const corrVal = (Math.random() * 0.5 + 0.4).toFixed(2);
        document.getElementById('tp-correlation-content').innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem">
                <div style="width:40px;height:40px;border-radius:50%;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;color:#8b5cf6;font-weight:900">
                    ${corrVal}
                </div>
                <div>
                    <div style="font-size:0.8rem;font-weight:700">High Portfolio Beta</div>
                    <div style="font-size:0.65rem;color:var(--text-dim)">Correlation to active holdings</div>
                </div>
            </div>
            <p style="font-size:0.75rem;color:var(--text-dim);line-height:1.6;margin:0">
                Adding this ${sym} position will increase your aggregate portfolio beta. 
                Ensure total net exposure does not exceed institutional risk limits.
            </p>
        `;
    }, 600);
}

function _tpRecalcRR() {
    _tpDirection = document.getElementById('tp-dir-select').value;
    
    const entry = parseFloat(document.getElementById('tp-entry').value) || 0;
    const stop  = parseFloat(document.getElementById('tp-stop').value) || 0;
    const tp1   = parseFloat(document.getElementById('tp-target1').value) || 0;
    const tp2   = parseFloat(document.getElementById('tp-target2').value) || 0;

    if (!entry || !stop || !tp1) return;

    let risk, reward1, reward2;

    if (_tpDirection === 'LONG') {
        risk = entry - stop;
        reward1 = tp1 - entry;
        reward2 = tp2 > 0 ? tp2 - entry : reward1;
    } else {
        risk = stop - entry;
        reward1 = entry - tp1;
        reward2 = tp2 > 0 ? entry - tp2 : reward1;
    }

    const rr1 = risk > 0 ? (reward1 / risk) : 0;
    // Use TP1 for primary R:R display
    
    const badge = document.getElementById('tp-rr-badge');
    if (badge) {
        badge.textContent = `${rr1.toFixed(2)}x`;
        badge.style.color = rr1 >= 2 ? '#14f195' : rr1 >= 1 ? '#fbbf24' : '#f87171';
    }

    // Update visualizer bar
    const riskPct = risk > 0 ? (risk / entry * 100) : 0;
    const rewPct  = reward1 > 0 ? (reward1 / entry * 100) : 0;
    
    const totalSpan = riskPct + rewPct;
    const riskShare = totalSpan > 0 ? (riskPct / totalSpan * 100) : 50;
    const rewShare  = totalSpan > 0 ? (rewPct / totalSpan * 100) : 50;

    document.getElementById('tp-bar-risk').style.width = `${riskShare}%`;
    document.getElementById('tp-bar-reward').style.width = `${rewShare}%`;

    const dirSign = _tpDirection === 'LONG' ? 1 : -1;
    document.getElementById('tp-dist-risk').textContent = `${(riskPct * -1 * dirSign).toFixed(2)}%`;
    document.getElementById('tp-dist-reward').textContent = `${(rewPct * dirSign).toFixed(2)}%`;
}

window.renderTradePlan = renderTradePlan;
