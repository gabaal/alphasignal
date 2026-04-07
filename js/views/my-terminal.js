async function renderMyTerminal() {
    // Use the same globals that the rest of the app uses (set by checkAuthStatus)
    if (!isAuthenticatedUser) {
        appEl.innerHTML = `
            <div class="view-header"><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">person</span>My Terminal</h1></div>
            <div class="card" style="padding:2.5rem;text-align:center;margin-top:2rem">
                <span class="material-symbols-outlined" style="font-size:3rem;color:var(--accent);opacity:0.5">lock</span>
                <h3 style="margin:1rem 0 0.5rem">Sign In Required</h3>
                <p style="color:var(--text-dim);margin-bottom:1.5rem">Your personal watchlist and positions are tied to your account.</p>
                <button class="intel-action-btn" onclick="showAuth(true)" style="margin:0 auto">SIGN IN / REGISTER</button>
            </div>`;
        return;
    }

    // Fetch current user email from auth status
    const authStatus = await fetchAPI('/auth/status');
    const userEmail = authStatus?.email || '';

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
                <h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">person</span>My Terminal</h2>
                <p style="color:var(--text-dim);font-size:0.8rem">Personal watchlist and open positions &middot; ${userEmail}</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="switchView('docs-my-terminal')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
        </div>
        ${tabsHTML}
        <div id="my-terminal-content">${skeleton(2)}</div>`;

    window._myTerminalTab = 'watchlist';
    myTerminalTab('watchlist');

    // Request browser notification permission so alerts fire when tab is backgrounded
    setTimeout(() => window._requestNotifPermission?.(), 1500);
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

// --------------------------------------------------------------
// WATCHLIST TAB
// --------------------------------------------------------------
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
    // Portfolio summary — aggregate SINCE ADDED performance
    const withPerf = items.filter(i => {
        const sym = i.ticker.replace('-USD','').toUpperCase();
        const live = i.live_price || (window.livePrices?.[sym] ?? window.livePrices?.[i.ticker]);
        return live && i.price_at_add;
    });
    const perfSummary = withPerf.length >= 2 ? (() => {
        const moves = withPerf.map(i => {
            const sym = i.ticker.replace('-USD','').toUpperCase();
            const live = i.live_price || (window.livePrices?.[sym] ?? window.livePrices?.[i.ticker]);
            return { sym, pct: ((live - Number(i.price_at_add)) / Number(i.price_at_add)) * 100 };
        });
        const avg     = moves.reduce((a, v) => a + v.pct, 0) / moves.length;
        const winners = moves.filter(v => v.pct > 0).length;
        const avgColor = avg >= 0 ? '#22c55e' : '#ef4444';
        const winRate  = Math.round(winners / moves.length * 100);
        const best  = moves.reduce((a, b) => a.pct > b.pct ? a : b);
        const worst = moves.reduce((a, b) => a.pct < b.pct ? a : b);
        const _fmtPct = (v, sym) => sym + ' ' + (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
        const cards = [
            ['WATCHED',         items.length,                                      'var(--accent)',                         'assets',          'visibility'],
            ['AVG RETURN',      (avg >= 0 ? '+' : '') + avg.toFixed(2) + '%',     avgColor,                                'since added',     'trending_up'],
            ['WIN RATE',        winRate + '%',                                     winRate >= 50 ? '#22c55e' : '#ef4444',   winners + '/' + moves.length + ' positive', 'emoji_events'],
            ['BEST GAINER',     _fmtPct(best.pct,  best.sym),                     '#22c55e',                               'top performer',   'military_tech'],
            ['WORST PERFORMER', _fmtPct(worst.pct, worst.sym),                    '#ef4444',                               'needs attention', 'arrow_downward'],
        ];
        return `<div style="margin-bottom:1.2rem">
          <div style="font-size:0.55rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:8px">&#128202; PORTFOLIO SUMMARY <span style="color:var(--accent);font-size:0.5rem">(SINCE ADDED)</span></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
            ${cards.map(([label, val, color, sub, icon]) =>
              '<div class="glass-card" style="padding:0.9rem 1rem;text-align:center;position:relative;overflow:hidden">' +
              '<span class="material-symbols-outlined" style="font-size:1.1rem;color:' + color + ';opacity:0.2;position:absolute;top:8px;right:8px">' + icon + '</span>' +
              '<div style="font-size:0.48rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:5px">' + label + '</div>' +
              '<div style="font-size:1.05rem;font-weight:900;color:' + color + ';font-family:var(--font-mono,monospace)">' + val + '</div>' +
              '<div style="font-size:0.5rem;color:var(--text-dim);margin-top:3px">' + sub + '</div></div>'
            ).join('')}
          </div></div>`;
    })() : '';

    return perfSummary + items.map(item => {
        const sym = item.ticker.replace('-USD', '').toUpperCase();
        const livePx = item.live_price || (window.livePrices?.[sym] ?? window.livePrices?.[item.ticker]);
        const pxStr = livePx ? `$${Number(livePx).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—';
        const targetStr = item.target_price ? `$${Number(item.target_price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—';
        const dist = (livePx && item.target_price) ? (((item.target_price - livePx) / livePx) * 100).toFixed(2) : null;
        const distColor = dist !== null ? (dist >= 0 ? '#22c55e' : '#ef4444') : 'var(--text-dim)';

        // % since added — uses price_at_add if stored, else shows target distance
        const addedPx = item.price_at_add ? Number(item.price_at_add) : null;
        const sincePct = (addedPx && livePx) ? (((livePx - addedPx) / addedPx) * 100).toFixed(2) : null;
        const sinceColor = sincePct === null ? 'var(--text-dim)' : Number(sincePct) >= 0 ? '#22c55e' : '#ef4444';
        const daysHeld = item.added_at ? Math.round((Date.now() - new Date(item.added_at).getTime()) / 86400000) : null;

        return `
        <div class="card" style="padding:1rem;margin-bottom:0.6rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;transition:box-shadow 0.2s" onmouseenter="this.style.boxShadow='0 4px 20px rgba(0,242,255,0.06)'" onmouseleave="this.style.boxShadow=''">
            <div style="flex:0 0 80px">
                <div style="font-size:0.9rem;font-weight:900;color:var(--accent)">${sym}</div>
                ${daysHeld !== null ? `<div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px">${daysHeld === 0 ? 'Today' : daysHeld + 'd ago'}</div>` : ''}
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
            ${sincePct !== null ? `
            <div style="flex:1;min-width:80px">
                <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px">SINCE ADDED</div>
                <div style="font-size:1rem;font-weight:700;color:${sinceColor}">${Number(sincePct) >= 0 ? '+' : ''}${sincePct}%</div>
            </div>` : ''}
            ${item.note ? `<div style="flex:2;min-width:120px;font-size:0.72rem;color:var(--text-dim);font-style:italic">"${item.note}"</div>` : ''}
            <div style="display:flex;gap:6px;flex-shrink:0">
                <button onclick="openDetail('${item.ticker}','WATCHLIST')" title="View chart" aria-label="View ${item.ticker} chart"
                    style="background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.2);color:var(--accent);padding:6px 8px;border-radius:8px;cursor:pointer">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">monitoring</span>
                </button>
                <button onclick="toggleWatchlistEdit(${item.id})" title="Set target price" aria-label="Edit ${item.ticker} target"
                    style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;padding:6px 8px;border-radius:8px;cursor:pointer">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">edit</span>
                </button>
                <button onclick="removeWatchlistItem(${item.id})" aria-label="Remove ${item.ticker} from watchlist"
                    style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.7rem">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">delete</span>
                </button>
            </div>
        </div>
        <!-- Inline edit row (hidden until pencil clicked) -->
        <div id="wl-edit-${item.id}" style="display:none;padding:0.75rem 1rem 0.75rem;border-top:1px solid rgba(245,158,11,0.15);background:rgba(245,158,11,0.04);margin-top:0">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <div style="font-size:0.55rem;color:#f59e0b;letter-spacing:1.5px;font-weight:700;flex-basis:100%;margin-bottom:4px">SET TARGET PRICE</div>
                <input id="wl-edit-target-${item.id}" type="number" step="any" placeholder="Target price"
                    value="${item.target_price || ''}"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(245,158,11,0.3);color:var(--text);padding:6px 10px;border-radius:8px;font-size:0.8rem;width:150px">
                <input id="wl-edit-note-${item.id}" type="text" placeholder="Note (optional)" maxlength="120"
                    value="${(item.note || '').replace(/Quick add from signal feed/g,'').trim()}"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--text);padding:6px 10px;border-radius:8px;font-size:0.8rem;flex:1;min-width:120px">
                <button onclick="saveWatchlistEdit(${item.id})"
                    style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#f59e0b;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.7rem;font-weight:700;letter-spacing:1px">SAVE</button>
                <button onclick="toggleWatchlistEdit(${item.id})"
                    style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--text-dim);padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.7rem">CANCEL</button>
            </div>
        </div>\`;
    }).join('');
}

window.toggleWatchlistEdit = function(id) {
    const panel = document.getElementById('wl-edit-' + id);
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) document.getElementById('wl-edit-target-' + id)?.focus();
};

window.saveWatchlistEdit = async function(id) {
    const targetEl = document.getElementById('wl-edit-target-' + id);
    const noteEl   = document.getElementById('wl-edit-note-'   + id);
    const target   = targetEl ? targetEl.value : '';
    const note     = noteEl   ? noteEl.value.trim() : '';
    try {
        const res = await fetchAPI('/watchlist/' + id, 'PATCH', {
            target_price: target ? parseFloat(target) : null,
            note: note || ''
        });
        if (res && res.success) {
            showToast('WATCHLIST', 'Target price saved', 'success');
            const el = document.getElementById('my-terminal-content');
            if (el) await renderWatchlistTab(el);
        } else {
            showToast('ERROR', (res && res.error) || 'Update failed', 'alert');
        }
    } catch(e) { showToast('ERROR', e.message, 'alert'); }
};

window.addToWatchlist = async function() {
    const ticker = document.getElementById('wl-ticker')?.value.trim().toUpperCase();
    const target = document.getElementById('wl-target')?.value;
    const note   = document.getElementById('wl-note')?.value.trim();
    if (!ticker) return showToast('Enter a ticker symbol', 'warning');
    const res = await fetchAPI('/watchlist', 'POST', { ticker, target_price: target || null, note });
    if (res?.success) {
        showToast(`${ticker} added to watchlist`, 'success');
        const el = document.getElementById('my-terminal-content');
        if (el) await renderWatchlistTab(el);
    } else {
        showToast(res?.error || 'Failed to add', 'error');
    }
};

window.removeWatchlistItem = async function(id) {
    const res = await fetchAPI(`/watchlist/${id}`, 'DELETE');
    if (res?.success) {
        showToast('Removed from watchlist', 'success');
        const el = document.getElementById('my-terminal-content');
        if (el) await renderWatchlistTab(el);
    } else {
        showToast('Failed to remove', 'error');
    }
};

// --------------------------------------------------------------
// POSITIONS TAB
// --------------------------------------------------------------
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
                <button onclick="removePosition(${p.id})" aria-label="Remove ${p.ticker} position"
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
    const res = await fetchAPI('/positions', 'POST', { ticker, side, qty, entry_price: entry, target_price: target || null, stop_price: stop || null, notes });
    if (res?.success) {
        showToast(`${ticker} ${side} position logged`, 'success');
        const el = document.getElementById('my-terminal-content');
        if (el) await renderPositionsTab(el);
    } else {
        showToast(res?.error || 'Failed to log position', 'error');
    }
};

window.removePosition = async function(id) {
    const res = await fetchAPI(`/positions/${id}`, 'DELETE');
    if (res?.success) {
        showToast('Position closed', 'success');
        const el = document.getElementById('my-terminal-content');
        if (el) await renderPositionsTab(el);
    } else {
        showToast('Failed to close position', 'error');
    }
};

// --------------------------------------------------------------
// PRICE ALERT ENGINE — runs on every WS tick
// --------------------------------------------------------------

// Dedup set: tracks fired alerts so they don't repeat every tick
// Key format: "TICKER:TARGET:direction" e.g. "BTC-USD:120000:above"
window._alertsFired    = window._alertsFired    || new Set();
window._watchlistCache = window._watchlistCache || null;
window._positionsCache = window._positionsCache || null;
window._alertCacheTs   = window._alertCacheTs   || 0;

const ALERT_CACHE_TTL = 5 * 60 * 1000; // Refresh every 5 min

async function _refreshAlertCaches() {
    const now = Date.now();
    if (now - window._alertCacheTs < ALERT_CACHE_TTL && window._watchlistCache) return;
    try {
        const [wl, pos] = await Promise.all([
            fetchAPI('/watchlist'),
            fetchAPI('/positions')
        ]);
        window._watchlistCache = wl || [];
        window._positionsCache = pos || [];
        window._alertCacheTs = now;
    } catch(e) { /* silent fail — don't crash the WS loop */ }
}

function _sendPriceAlert(title, body, type = 'success') {
    // 1. In-app toast
    showToast(title, body, type);

    // 2. Browser notification (fires even when tab is in background)
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(`?? ${title}`, { body, icon: '/favicon.png', tag: title });
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(perm => {
                if (perm === 'granted') {
                    new Notification(`?? ${title}`, { body, icon: '/favicon.png', tag: title });
                }
            });
        }
    }
}

window.checkWatchlistAlerts = async function(prices) {
    // Lazy-load caches
    await _refreshAlertCaches();

    const watchlist = window._watchlistCache || [];
    const positions = window._positionsCache || [];

    // -- 1. Watchlist target alerts -----------------------------
    watchlist.forEach(item => {
        if (!item.target_price) return;

        // Match ticker: strip -USD suffix for the price key
        const sym = item.ticker.replace('-USD', '');
        const live = prices[sym] ?? prices[item.ticker];
        if (!live || !item.target_price) return;

        const target = Number(item.target_price);
        const crossed = live >= target;
        const key = `${item.ticker}:${target}:target`;

        if (crossed && !window._alertsFired.has(key)) {
            window._alertsFired.add(key);
            const pct = (((live - target) / target) * 100).toFixed(2);
            _sendPriceAlert(
                `?? ${sym} HIT TARGET`,
                `${sym} is at $${live.toLocaleString()} — your target of $${target.toLocaleString()} was reached! ${pct > 0 ? '+'+pct : pct}%`,
                'success'
            );
        }

        // Reset dedup key if price retreats 2% below target (so future crosses re-alert)
        if (live < target * 0.98 && window._alertsFired.has(key)) {
            window._alertsFired.delete(key);
        }
    });

    // -- 2. Position target + stop alerts ----------------------
    positions.forEach(pos => {
        const sym = pos.ticker.replace('-USD', '');
        const live = prices[sym] ?? prices[pos.ticker];
        if (!live) return;

        const isLong = pos.side !== 'SHORT';

        // TARGET hit
        if (pos.target_price) {
            const target = Number(pos.target_price);
            const targetHit = isLong ? live >= target : live <= target;
            const targetKey = `${pos.ticker}:${pos.id}:target`;

            if (targetHit && !window._alertsFired.has(targetKey)) {
                window._alertsFired.add(targetKey);
                const pnlPct = (Math.abs(live - pos.entry_price) / pos.entry_price * 100).toFixed(2);
                _sendPriceAlert(
                    `? ${sym} TARGET HIT`,
                    `Your ${pos.side} hit $${target.toLocaleString()} — take profit? Entry: $${Number(pos.entry_price).toLocaleString()} · +${pnlPct}%`,
                    'success'
                );
            }
        }

        // STOP-LOSS breach
        if (pos.stop_price) {
            const stop = Number(pos.stop_price);
            const stopHit = isLong ? live <= stop : live >= stop;
            const stopKey = `${pos.ticker}:${pos.id}:stop`;

            if (stopHit && !window._alertsFired.has(stopKey)) {
                window._alertsFired.add(stopKey);
                const pnlPct = (Math.abs(live - pos.entry_price) / pos.entry_price * 100).toFixed(2);
                _sendPriceAlert(
                    `?? ${sym} STOP BREACHED`,
                    `Your ${pos.side} stop of $${stop.toLocaleString()} was hit. Entry: $${Number(pos.entry_price).toLocaleString()} · -${pnlPct}%`,
                    'alert'
                );
            }
        }
    });
};

// Request browser notification permission proactively when user is on My Terminal
window._requestNotifPermission = function() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
};
