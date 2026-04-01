async function renderTradeLab(tabs = null) {
    if (!tabs) tabs = institutionalHubTabs;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('tradelab', tabs)}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Trade Intelligence Lab</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Institutional Hub <span class="premium-badge">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-tradelab')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
           
            <p>Synthesizing institutional flow, macro catalysts, and technical regimes into actionable setups.</p>
        </div>
        
        <div class="trade-lab-layout">
            <section class="picks-section">
                <div class="section-header">
                    <span class="material-symbols-outlined">analytics</span>
                    <h3>Institutional Alpha Picks (Systematic)</h3>
                </div>
                <div id="alpha-picks-grid" class="picks-grid">
                    ${skeleton(2)}
                </div>
            </section>

            <section class="generator-section">
                <div class="card">
                    <h3 class="card-title">Neural Setup Generator</h3>
                    <p class="view-desc">On-demand synthesis for a specific asset using the latest GOMM and Macro context.</p>
                    <div class="generator-controls">
                        <input type="text" id="gen-ticker" value="BTC-USD" class="strat-select" style="width:120px; text-transform:uppercase">
                        <button class="setup-generator-btn" id="generate-setup-btn" style="flex:1">GENERATE NEURAL SETUP</button>
                    </div>
                    <div id="setup-display-area"></div>
                </div>
                <div class="lab-disclaimer">
                    * Setups are generated using cross-exchange liquidity walls and systemic risk markers. Always verify against personal risk parameters.
                </div>
            </section>
        </div>
        <section class="leaderboard-section" style="margin-top:3rem">
            <div class="section-header">
                <span class="material-symbols-outlined">military_tech</span>
                <h3>Institutional Alpha Leaderboard (Historical Performance)</h3>
            </div>
            <div id="leaderboard-grid" class="leaderboard-grid">${skeleton(1)}</div>
        </section>
        `;

    // 1. Fetch Alpha Picks
    const picks = await fetchAPI('/trade-lab');
    const picksGrid = document.getElementById('alpha-picks-grid');
    if (!picksGrid) return; // user navigated away during fetch
    if (picks && picks.length) {
        picksGrid.innerHTML = picks.map(p => `
            <div class="pick-mini-card">
                <div class="pick-header">
                    <span class="ticker">${p.ticker}</span>
                    <span class="rr-badge">RR ${p.rr_ratio}</span>
                </div>
                <div class="pick-params">
                    <div class="p-item"><label>ENTRY</label><span>${formatPrice(p.entry)}</span></div>
                    <div class="p-item"><label>TARGET</label><span class="pos">${formatPrice(p.tp1)}</span></div>
                    <div class="p-item"><label>STOP</label><span class="neg">${formatPrice(p.stop_loss)}</span></div>
                </div>
                <div style="display:flex; gap:8px; margin-top:10px">
                    <button class="intel-action-btn mini" style="flex:1" onclick="runNeuralSetup('${p.ticker}')">ANALYSIS</button>
                    <button class="intel-action-btn mini" style="flex:1; background:var(--accent); color:white" onclick="generateTicket('${p.ticker}')">TICKET</button>
                </div>
            </div>
        `).join('');
    } else {
        picksGrid.innerHTML = '<p class="empty-state">No high-conviction systematic setups detected in this cycle.</p>';
    }

    // 2. Fetch Leaderboard (Phase 8 Performance Tracking)
    try {
        const leaderboard = await fetchAPI('/leaderboard');
        const lbGrid = document.getElementById('leaderboard-grid');
        if (lbGrid) {
            if (leaderboard && leaderboard.length) {
                lbGrid.innerHTML = `
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th>TICKER</th>
                                <th>SIGNAL DATE</th>
                                <th>ENTRY</th>
                                <th>MAX EXCURSION</th>
                                <th>STATE</th>
                                <th>RETURN</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leaderboard.map(lb => `
                                <tr>
                                    <td class="ticker">${lb.ticker}</td>
                                    <td>${lb.date}</td>
                                    <td>${formatPrice(lb.entry)}</td>
                                    <td>${formatPrice(lb.max_excursion)}</td>
                                    <td><span class="status-badge ${lb.state.toLowerCase()}">${lb.state}</span></td>
                                    <td class="return ${lb.return >= 0 ? 'pos' : 'neg'}">${lb.return >= 0 ? '+' : ''}${lb.return}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                lbGrid.innerHTML = '<p class="empty-state" style="padding:20px; text-align:center; color:var(--text-dim)">No historical performance records available for this cycle.</p>';
            }
        }
    } catch (e) {
        console.error("Leaderboard fetch failed:", e);
        const lbGrid = document.getElementById('leaderboard-grid');
        if (lbGrid) lbGrid.innerHTML = '<p class="error-msg">Failed to sync institutional leaderboard.</p>';
    }

    // 3. Setup Generator Logic
    const setupBtn = document.getElementById('generate-setup-btn');
    if (setupBtn) setupBtn.onclick = async () => {
        const ticker = document.getElementById('gen-ticker').value || 'BTC-USD';
        runNeuralSetup(ticker);
    };
}

async function renderTradeLedger(tabs = null) {
    if (!tabs) tabs = auditHubTabs;
    appEl.innerHTML = skeleton();
    try {
        const res = await fetchAPI('/trade-ledger');
        if (!res || res.error) {
            appEl.innerHTML = `
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">assignment</span>Audit &amp; Performance <span class="premium-badge">AUDIT</span></h1>
                </div>
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Institutional Trade Ledger</h2>
                <div class="paywall-feature-block">
                    <span class="material-symbols-outlined" style="font-size:4rem; color:var(--accent); margin-bottom:1.5rem">history_edu</span>
                    <h3>PERSISTENT AUDIT HISTORY</h3>
                    <p>The Trade Ledger persists your institutional execution tickets across sessions. This feature is restricted to Premium Alpha accounts.</p>
                </div>
            `;
            return;
        }

        let trades = Array.isArray(res) ? res : (res.data || []);
        let currentPage = 1;
        const itemsPerPage = 15;

        // ── Edit Modal ─────────────────────────────────────────────
        const modalHtml = `
        <div id="ledger-edit-modal" onclick="if(event.target===this)closeLedgerEdit()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:3000;align-items:center;justify-content:center;padding:2rem">
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:1.8rem;width:100%;max-width:480px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
                    <div style="font-size:0.8rem;font-weight:900;color:var(--accent);letter-spacing:1.5px">EDIT LEDGER RECORD</div>
                    <button onclick="closeLedgerEdit()" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:4px 12px;border-radius:7px;cursor:pointer;font-size:0.75rem;font-weight:700">✕</button>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.2rem">
                    <div>
                        <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;font-weight:700;display:block;margin-bottom:4px">ACTION</label>
                        <select id="ledit-action" style="width:100%;background:var(--card-bg);color:var(--text);border:1px solid var(--border);padding:8px 10px;border-radius:7px;font-size:0.8rem">
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;font-weight:700;display:block;margin-bottom:4px">PRICE</label>
                        <input id="ledit-price" type="number" step="any" style="width:100%;background:var(--card-bg);color:var(--text);border:1px solid var(--border);padding:8px 10px;border-radius:7px;font-size:0.8rem;box-sizing:border-box">
                    </div>
                    <div>
                        <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;font-weight:700;display:block;margin-bottom:4px">TARGET</label>
                        <input id="ledit-target" type="number" step="any" style="width:100%;background:var(--card-bg);color:var(--text);border:1px solid var(--border);padding:8px 10px;border-radius:7px;font-size:0.8rem;box-sizing:border-box">
                    </div>
                    <div>
                        <label style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;font-weight:700;display:block;margin-bottom:4px">STOP</label>
                        <input id="ledit-stop" type="number" step="any" style="width:100%;background:var(--card-bg);color:var(--text);border:1px solid var(--border);padding:8px 10px;border-radius:7px;font-size:0.8rem;box-sizing:border-box">
                    </div>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-bottom:1.2rem">R/R will be recalculated automatically from price, target &amp; stop.</div>
                <button id="ledit-save-btn" onclick="saveLedgerEdit()" style="width:100%;background:linear-gradient(135deg,#00d4aa,#00a896);color:#000;border:none;padding:10px;border-radius:8px;font-weight:900;font-size:0.8rem;cursor:pointer;letter-spacing:1px">SAVE CHANGES</button>
            </div>
        </div>`;

        function drawLedgerPage() {
            const totalPages = Math.ceil(trades.length / itemsPerPage) || 1;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const currentTrades = trades.slice(startIndex, startIndex + itemsPerPage);

            appEl.innerHTML = modalHtml + `
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:15px">
                    <div>
                        <h2>Institutional Trade Ledger</h2>
                        <p class="subtitle" style="margin:0">Auditable record of generated neural execution tickets.</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:5px">
                        <button class="filter-btn" id="btn-prev-ledger" ${currentPage === 1 ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>&larr; Prev</button>
                        <span style="font-size:0.75rem; color:var(--text-dim); font-family:'JetBrains Mono'">Page ${currentPage} of ${totalPages}</span>
                        <button class="filter-btn" id="btn-next-ledger" ${currentPage === totalPages ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>Next &rarr;</button>
                        <button class="intel-action-btn mini" onclick="switchView('tradelab')" style="margin-left:10px">
                            <span class="material-symbols-outlined">add</span> NEW SETUP
                        </button>
                    </div>
                </div>

                <div class="ledger-container">
                    <table class="ledger-table">
                        <thead>
                            <tr>
                                <th>TIMESTAMP</th>
                                <th>TICKER</th>
                                <th>ACTION</th>
                                <th>PRICE</th>
                                <th>TARGET</th>
                                <th>STOP</th>
                                <th>R/R</th>
                                <th style="width:80px">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${currentTrades.length ? currentTrades.map(t => `
                                <tr id="ledger-row-${t.id}">
                                    <td style="color:var(--text-dim); font-size:0.7rem">${t.timestamp}</td>
                                    <td style="font-weight:900">${t.ticker}</td>
                                    <td style="color:${t.action === 'BUY' ? 'var(--risk-low)' : 'var(--risk-high)'}; font-weight:900">${t.action}</td>
                                    <td style="font-family:'JetBrains Mono'">${formatPrice(t.price)}</td>
                                    <td style="color:var(--risk-low)">${formatPrice(t.target)}</td>
                                    <td style="color:var(--risk-high)">${formatPrice(t.stop)}</td>
                                    <td style="font-weight:900; color:var(--accent)">${t.rr}:1</td>
                                    <td>
                                        <div style="display:flex;gap:6px;justify-content:center">
                                            <button title="Edit" onclick="openLedgerEdit(${t.id})" style="background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.25);color:#00d4aa;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.7rem;line-height:1" onmouseenter="this.style.background='rgba(0,212,170,0.25)'" onmouseleave="this.style.background='rgba(0,212,170,0.1)'">
                                                <span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle">edit</span>
                                            </button>
                                            <button title="Delete" onclick="deleteLedgerRow(${t.id})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#ef4444;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.7rem;line-height:1" onmouseenter="this.style.background='rgba(239,68,68,0.25)'" onmouseleave="this.style.background='rgba(239,68,68,0.1)'">
                                                <span class="material-symbols-outlined" style="font-size:13px;vertical-align:middle">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-dim)">No execution tickets recorded in the ledger.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            const btnPrev = document.getElementById('btn-prev-ledger');
            const btnNext = document.getElementById('btn-next-ledger');
            if(btnPrev) btnPrev.addEventListener('click', () => { if(currentPage > 1) { currentPage--; drawLedgerPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
            if(btnNext) btnNext.addEventListener('click', () => { if(currentPage < totalPages) { currentPage++; drawLedgerPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
        }

        // ── Delete handler ─────────────────────────────────────────
        window.deleteLedgerRow = async function(id) {
            if (!confirm('Delete this ledger record? This cannot be undone.')) return;
            const res = await fetchAPI(`/trade-ledger/${id}`, 'DELETE');
            if (res && res.status === 'deleted') {
                trades = trades.filter(t => t.id !== id);
                if ((currentPage - 1) * itemsPerPage >= trades.length && currentPage > 1) currentPage--;
                drawLedgerPage();
                showToast('LEDGER', 'Record deleted.', 'success');
            } else {
                showToast('LEDGER', res?.error || 'Delete failed.', 'alert');
            }
        };

        // ── Edit handlers ──────────────────────────────────────────
        window._ledgerEditId = null;
        window.openLedgerEdit = function(id) {
            const t = trades.find(x => x.id === id);
            if (!t) return;
            window._ledgerEditId = id;
            document.getElementById('ledit-action').value  = t.action;
            document.getElementById('ledit-price').value   = t.price;
            document.getElementById('ledit-target').value  = t.target;
            document.getElementById('ledit-stop').value    = t.stop;
            document.getElementById('ledger-edit-modal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };
        window.closeLedgerEdit = function() {
            const m = document.getElementById('ledger-edit-modal');
            if (m) m.style.display = 'none';
            document.body.style.overflow = '';
        };
        window.saveLedgerEdit = async function() {
            const id = window._ledgerEditId;
            if (!id) return;
            const btn = document.getElementById('ledit-save-btn');
            if (btn) { btn.disabled = true; btn.textContent = 'SAVING...'; }
            const body = {
                action: document.getElementById('ledit-action').value,
                price:  parseFloat(document.getElementById('ledit-price').value) || 0,
                target: parseFloat(document.getElementById('ledit-target').value) || 0,
                stop:   parseFloat(document.getElementById('ledit-stop').value) || 0,
            };
            const res = await fetchAPI(`/trade-ledger/${id}`, 'PATCH', body);
            if (res && res.status === 'updated') {
                const idx = trades.findIndex(t => t.id === id);
                if (idx !== -1) {
                    trades[idx] = { ...trades[idx], ...body, rr: res.rr };
                }
                closeLedgerEdit();
                drawLedgerPage();
                showToast('LEDGER', 'Record updated.', 'success');
            } else {
                showToast('LEDGER', res?.error || 'Update failed.', 'alert');
                if (btn) { btn.disabled = false; btn.textContent = 'SAVE CHANGES'; }
            }
        };

        currentPage = 1;
        drawLedgerPage();
    } catch (e) {
        appEl.innerHTML = `<div class="error">Failed to load trade ledger.</div>`;
    }
}
