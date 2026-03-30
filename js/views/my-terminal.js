async function renderMyTerminal() {
    const auth = window._authState;
    if (!auth || !auth.authenticated) {
        appEl.innerHTML = `
            <div class="view-header"><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">person</span>My Terminal</h1></div>
            <div class="card" style="padding:2.5rem;text-align:center;margin-top:2rem">
                <span class="material-symbols-outlined" style="font-size:3rem;color:var(--accent);opacity:0.5">lock</span>
                <h3 style="margin:1rem 0 0.5rem">Sign In Required</h3>
                <p style="color:var(--text-dim);margin-bottom:1.5rem">Your personal watchlist and positions are tied to your account.</p>
                <button class="intel-action-btn" onclick="showAuth()" style="margin:0 auto">SIGN IN / REGISTER</button>
            </div>`;
        return;
    }

    const tabsHTML = `
        <div class="hub-tabs" style="display:flex;gap:10px;margin-bottom:1.5rem;border-bottom:1px solid var(--border);padding-bottom:10px;overflow-x:auto">
            <button id="tab-watchlist" class="intel-action-btn mini" onclick="myTerminalTab('watchlist')" style="white-space:nowrap;padding:6px 14px;font-size:0.65rem">
                <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">visibility</span> WATCHLIST
            </button>
            <button id="tab-positions" class="intel-action-btn mini outline" onclick="myTerminalTab('positions')" style="white-space:nowrap;padding:6px 14px;font-size:0.65rem">
                <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">show_chart</span> POSITIONS
            </button>
        </div>`;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">person</span>My Terminal</h1>
                <p style="color:var(--text-dim);font-size:0.8rem">Personal watchlist and open positions · ${auth.email}</p>
            </div>
        </div>
        ${tabsHTML}
        <div id="my-terminal-content">${skeleton(2)}</div>`;

    window._myTerminalTab = 'watchlist';
    myTerminalTab('watchlist');
}

window.myTerminalTab = async function(tab) {
    window._myTerminalTab = tab;
    document.getElementById('tab-watchlist')?.classList.toggle('outline', tab !== 'watchlist');
    document.getElementById('tab-positions')?.classList.toggle('outline', tab !== 'positions');
    const el = document.getElementById('my-terminal-content');
    if (!el) return;
    el.innerHTML = skeleton(2);
    tab === 'watchlist' ? await renderWatchlistTab(el) : await renderPositionsTab(el);
};

// ══════════════════════════════════════════════════════════════
// WATCHLIST TAB
// ══════════════════════════════════════════════════════════════
async function renderWatchlistTab(el) {
    const items = await fetchAPI('/watchlist') || [];

    el.innerHTML = `
        <!-- Add form -->
        <div class="card" style="padding:1.2rem;margin-bottom:1rem">
            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:0.8rem">ADD TO WATCHLIST</div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
                <input id="wl-ticker" placeholder="TICKER e.g. BTC-USD" maxlength="15"
                    style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem;width:140px;text-transform:uppercase">
                <input id="wl-target" placeholder="Target price (optional)" type="number" step="any"
                    style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem;width:180px">
                <input id="wl-note" placeholder="Note (optional)" maxlength="120"
                    style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem;flex:1;min-width:140px">
                <button class="intel-action-btn mini" onclick="addToWatchlist()" style="white-space:nowrap">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">add</span> ADD
                </button>
            </div>
        </div>

        <!-- List -->
        <div id="wl-list">
            ${items.length === 0
                ? `<div class="card" style="padding:2rem;text-align:center;color:var(--text-dim)">
                    <span class="material-symbols-outlined" style="font-size:2rem;opacity:0.4">visibility_off</span>
                    <p style="margin:0.5rem 0 0">Your watchlist is empty — add a ticker above.</p>
                   </div>`
                : renderWatchlistCards(items)
            }
        </div>`;
}

function renderWatchlistCards(items) {
    return items.map(item => {
        const livePx = window.livePrices?.[item.ticker];
        const pxStr = livePx ? `$${Number(livePx).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—';
        const targetStr = item.target_price ? `$${Number(item.target_price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—';
        const dist = (livePx && item.target_price) ? (((item.target_price - livePx) / livePx) * 100).toFixed(2) : null;
        const distColor = dist !== null ? (dist >= 0 ? '#22c55e' : '#ef4444') : 'var(--text-dim)';
        return `
        <div class="card" style="padding:1rem;margin-bottom:0.6rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
            <div style="flex:0 0 80px">
                <div style="font-size:0.9rem;font-weight:900;color:var(--accent)">${item.ticker.replace('-USD','')}</div>
                <div style="font-size:0.6rem;color:var(--text-dim);margin-top:2px">${new Date(item.added_at).toLocaleDateString()}</div>
            </div>
            <div style="flex:1;min-width:80px">
                <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">LIVE PRICE</div>
                <div style="font-size:1rem;font-weight:700;color:var(--text)">${pxStr}</div>
            </div>
            <div style="flex:1;min-width:80px">
                <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">TARGET</div>
                <div style="font-size:1rem;font-weight:700;color:#f59e0b">${targetStr}</div>
            </div>
            <div style="flex:1;min-width:80px">
                <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">TO TARGET</div>
                <div style="font-size:1rem;font-weight:700;color:${distColor}">${dist !== null ? (dist >= 0 ? '+' : '') + dist + '%' : '—'}</div>
            </div>
            ${item.note ? `<div style="flex:2;min-width:120px;font-size:0.72rem;color:var(--text-dim);font-style:italic">"${item.note}"</div>` : ''}
            <button onclick="removeWatchlistItem(${item.id})"
                style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.7rem;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">delete</span>
            </button>
        </div>`;
    }).join('');
}

window.addToWatchlist = async function() {
    const ticker = document.getElementById('wl-ticker')?.value.trim().toUpperCase();
    const target = document.getElementById('wl-target')?.value;
    const note   = document.getElementById('wl-note')?.value.trim();
    if (!ticker) return showToast('Enter a ticker symbol', 'warning');
    const res = await fetchAPI('/watchlist', { method: 'POST', body: JSON.stringify({ ticker, target_price: target || null, note }) });
    if (res?.success) {
        showToast(`${ticker} added to watchlist`, 'success');
        const el = document.getElementById('my-terminal-content');
        if (el) await renderWatchlistTab(el);
    } else {
        showToast(res?.error || 'Failed to add', 'error');
    }
};

window.removeWatchlistItem = async function(id) {
    const res = await fetchAPI(`/watchlist/${id}`, { method: 'DELETE' });
    if (res?.success) {
        showToast('Removed from watchlist', 'success');
        const el = document.getElementById('my-terminal-content');
        if (el) await renderWatchlistTab(el);
    } else {
        showToast('Failed to remove', 'error');
    }
};

// ══════════════════════════════════════════════════════════════
// POSITIONS TAB
// ══════════════════════════════════════════════════════════════
async function renderPositionsTab(el) {
    const items = await fetchAPI('/positions') || [];

    el.innerHTML = `
        <!-- Add form -->
        <div class="card" style="padding:1.2rem;margin-bottom:1rem">
            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:0.8rem">LOG A POSITION</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:10px">
                <input id="pos-ticker" placeholder="TICKER" maxlength="15"
                    style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem;text-transform:uppercase">
                <select id="pos-side" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem">
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                </select>
                <input id="pos-qty" placeholder="Quantity" type="number" step="any" min="0"
                    style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem">
                <input id="pos-entry" placeholder="Entry price $" type="number" step="any" min="0"
                    style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem">
                <input id="pos-target" placeholder="Target $ (opt)" type="number" step="any"
                    style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem">
                <input id="pos-stop" placeholder="Stop $ (opt)" type="number" step="any"
                    style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem">
            </div>
            <input id="pos-notes" placeholder="Notes (optional)" maxlength="200"
                style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem;width:100%;box-sizing:border-box;margin-bottom:10px">
            <button class="intel-action-btn mini" onclick="addPosition()" style="white-space:nowrap">
                <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">add_circle</span> LOG POSITION
            </button>
        </div>

        <!-- Summary KPI row -->
        ${items.length > 0 ? renderPositionsSummary(items) : ''}

        <!-- Table -->
        <div id="pos-list">
            ${items.length === 0
                ? `<div class="card" style="padding:2rem;text-align:center;color:var(--text-dim)">
                    <span class="material-symbols-outlined" style="font-size:2rem;opacity:0.4">bar_chart</span>
                    <p style="margin:0.5rem 0 0">No open positions logged yet.</p>
                   </div>`
                : renderPositionsCards(items)
            }
        </div>`;
}

function renderPositionsSummary(items) {
    let totalValue = 0, totalPnl = 0, winners = 0;
    items.forEach(p => {
        const live = window.livePrices?.[p.ticker];
        if (!live) return;
        const entryVal = p.qty * p.entry_price;
        const liveVal  = p.qty * live;
        const pnl = p.side === 'SHORT' ? entryVal - liveVal : liveVal - entryVal;
        totalValue += liveVal;
        totalPnl += pnl;
        if (pnl > 0) winners++;
    });
    const pnlColor = totalPnl >= 0 ? '#22c55e' : '#ef4444';
    return `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1rem">
        ${[
            ['OPEN POSITIONS', items.length, '#60a5fa', 'table_rows'],
            ['PORTFOLIO VALUE', totalValue > 0 ? '$'+totalValue.toLocaleString(undefined,{maximumFractionDigits:0}) : '—', '#60a5fa', 'account_balance_wallet'],
            ['UNREALISED P&L', totalValue > 0 ? (totalPnl >= 0 ? '+' : '') + '$'+ totalPnl.toLocaleString(undefined,{maximumFractionDigits:0}) : '—', pnlColor, 'trending_up'],
            ['WIN RATE', items.length > 0 ? Math.round(winners/items.length*100)+'%' : '—', winners/items.length >= 0.5 ? '#22c55e' : '#ef4444', 'emoji_events'],
        ].map(([label, val, color, icon]) => `
            <div class="card" style="padding:1rem;text-align:center">
                <div style="font-size:1.2rem;color:${color};margin-bottom:8px"><span class="material-symbols-outlined">${icon}</span></div>
                <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:6px">${label}</div>
                <div style="font-size:1.2rem;font-weight:900;color:${color}">${val}</div>
            </div>`).join('')}
    </div>`;
}

function renderPositionsCards(items) {
    return items.map(p => {
        const live = window.livePrices?.[p.ticker];
        const liveStr = live ? `$${Number(live).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—';
        const entryVal = p.qty * p.entry_price;
        const liveVal  = live ? p.qty * live : null;
        const pnl = liveVal !== null ? (p.side === 'SHORT' ? entryVal - liveVal : liveVal - entryVal) : null;
        const pnlPct = pnl !== null ? (pnl / entryVal * 100) : null;
        const pnlColor = pnl === null ? 'var(--text-dim)' : pnl >= 0 ? '#22c55e' : '#ef4444';
        const sideColor = p.side === 'LONG' ? '#22c55e' : '#ef4444';
        const rr = (p.target_price && p.stop_price) ?
            Math.abs((p.target_price - p.entry_price) / (p.entry_price - p.stop_price)).toFixed(2) : null;
        return `
        <div class="card" style="padding:1rem;margin-bottom:0.6rem">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
                <div style="flex:0 0 90px">
                    <div style="font-size:0.9rem;font-weight:900;color:var(--accent)">${p.ticker.replace('-USD','')}</div>
                    <div style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.55rem;font-weight:900;letter-spacing:1px;margin-top:4px;background:${sideColor}20;color:${sideColor};border:1px solid ${sideColor}40">${p.side}</div>
                </div>
                <div style="flex:1;min-width:80px">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">QTY × ENTRY</div>
                    <div style="font-size:0.85rem;font-weight:700">${p.qty} @ $${Number(p.entry_price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                </div>
                <div style="flex:1;min-width:80px">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">LIVE</div>
                    <div style="font-size:0.85rem;font-weight:700">${liveStr}</div>
                </div>
                <div style="flex:1;min-width:80px">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">UNREALISED P&L</div>
                    <div style="font-size:0.85rem;font-weight:900;color:${pnlColor}">
                        ${pnl !== null ? (pnl >= 0 ? '+' : '') + '$' + Math.abs(pnl).toLocaleString(undefined,{maximumFractionDigits:2}) : '—'}
                        ${pnlPct !== null ? `<span style="font-size:0.7rem;opacity:0.8">(${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)</span>` : ''}
                    </div>
                </div>
                ${rr ? `<div style="flex:0 0 60px;text-align:center">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">R:R</div>
                    <div style="font-size:0.85rem;font-weight:700;color:var(--accent)">${rr}R</div>
                </div>` : ''}
                <button onclick="removePosition(${p.id})"
                    style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.7rem;flex-shrink:0">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">close</span>
                </button>
            </div>
            ${p.notes ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:0.72rem;color:var(--text-dim);font-style:italic">"${p.notes}"</div>` : ''}
        </div>`;
    }).join('');
}

window.addPosition = async function() {
    const ticker = document.getElementById('pos-ticker')?.value.trim().toUpperCase();
    const side   = document.getElementById('pos-side')?.value;
    const qty    = parseFloat(document.getElementById('pos-qty')?.value);
    const entry  = parseFloat(document.getElementById('pos-entry')?.value);
    const target = document.getElementById('pos-target')?.value;
    const stop   = document.getElementById('pos-stop')?.value;
    const notes  = document.getElementById('pos-notes')?.value.trim();
    if (!ticker || !qty || !entry) return showToast('Ticker, qty and entry price required', 'warning');
    const res = await fetchAPI('/positions', {
        method: 'POST',
        body: JSON.stringify({ ticker, side, qty, entry_price: entry, target_price: target || null, stop_price: stop || null, notes })
    });
    if (res?.success) {
        showToast(`${ticker} ${side} position logged`, 'success');
        const el = document.getElementById('my-terminal-content');
        if (el) await renderPositionsTab(el);
    } else {
        showToast(res?.error || 'Failed to log position', 'error');
    }
};

window.removePosition = async function(id) {
    const res = await fetchAPI(`/positions/${id}`, { method: 'DELETE' });
    if (res?.success) {
        showToast('Position closed', 'success');
        const el = document.getElementById('my-terminal-content');
        if (el) await renderPositionsTab(el);
    } else {
        showToast('Failed to close position', 'error');
    }
};
