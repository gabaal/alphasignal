async function renderMyTerminal() {
    // Use the same globals that the rest of the app uses (set by checkAuthStatus)
    if (!isAuthenticatedUser) {
        appEl.innerHTML = `
            <div class="view-header"><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">person</span>Active Positions</h1></div>
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
            <button id="tab-memory" class="intel-action-btn mini outline" onclick="myTerminalTab('memory')" style="white-space:nowrap;padding:6px 14px;font-size:0.65rem">
                <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">memory</span> AI MEMORY
            </button>
        </div>`;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div>
                <h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">person</span>My Terminal</h2>
                <p style="color:var(--text-dim);font-size:0.8rem">Personal watchlist and open positions &middot; ${userEmail}</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="switchView('docs-hub-my-terminal')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
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
    document.getElementById('tab-memory')?.classList.toggle('outline', tab !== 'memory');
    const el = document.getElementById('my-terminal-content');
    if (!el) return;
    el.innerHTML = skeleton(2);
    if (tab === 'watchlist') await renderWatchlistTab(el);
    else if (tab === 'positions') await renderPositionsTab(el);
    else await renderMemoryTab(el);
};

// --------------------------------------------------------------
// AI MEMORY TAB (RAG)
// --------------------------------------------------------------
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

async function renderMemoryTab(el) {
    const items = await fetchAPI('/user/ai-memory') || [];

    el.innerHTML = `
        <div class="card" style="padding:1.5rem;margin-bottom:1.5rem;background:rgba(239, 68, 68, 0.02)">
            <div style="font-size:0.65rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:1rem">INSTITUTIONAL KNOWLEDGE INGESTION</div>
            <p style="color:var(--text-dim);font-size:0.8rem;line-height:1.5">Paste proprietary firm research, execution biases, or macroeconomic directives below. The AI Alpha engine will natively cross-reference this vault during generation and Natural Language queries.</p>
            <input id="mem-title" placeholder="Document Title / Thesis Topic" autocomplete="off"
                style="background:${alphaColor(0.05)};border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:8px;font-family:var(--font-ui);font-size:0.85rem;width:100%;margin-bottom:10px">
            <textarea id="mem-content" placeholder="E.g., 'Firm Bias: Always prioritize buying dips on ADA unconditionally. Reject all short parameters...'"
                style="background:${alphaColor(0.05)};border:1px solid var(--border);color:var(--text);padding:10px 14px;border-radius:8px;font-family:var(--font-ui);font-size:0.8rem;width:100%;height:100px;resize:vertical;margin-bottom:10px"></textarea>
            <button class="intel-action-btn" onclick="addAiMemory()" style="border-radius:6px">INGEST TO CORE MEMORY</button>
        </div>

        <div style="font-size:0.65rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:0.8rem">ACTIVE RAG BLOCKS</div>
        <div id="mem-list" style="display:flex;flex-direction:column;gap:12px">
            ${items.length === 0
                ? `<div class="card" style="padding:2.5rem;text-align:center;color:var(--text-dim)">
                    <span class="material-symbols-outlined" style="font-size:2.5rem;opacity:0.4;margin-bottom:0.5rem">memory_alt</span>
                    <p style="margin:0">No proprietary memory blocks ingested.</p>
                    <p style="font-size:0.75rem;margin-top:0.3rem">Terminal is currently operating on base market logic.</p>
                   </div>`
                : items.map(m => `
                    <div class="card" style="padding:1.2rem;border-left:3px solid var(--accent);background:rgba(0, 242, 255, 0.02)">
                        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.8rem">
                            <div>
                                <h4 style="margin:0;font-size:0.85rem;color:var(--text)">${escapeHTML(m.title)}</h4>
                                <span style="font-size:0.6rem;color:var(--text-dim);">${new Date(m.created_at).toLocaleString()}</span>
                            </div>
                            <button onclick="deleteAiMemory(${m.id})" style="background:transparent;border:none;color:var(--text-dim);cursor:pointer;padding:4px">
                                <span class="material-symbols-outlined" style="font-size:18px">delete</span>
                            </button>
                        </div>
                        <div style="font-size:0.75rem;color:var(--text-dim);line-height:1.5">${escapeHTML(m.content)}</div>
                    </div>
                `).join('')
            }
        </div>`;
}

window.addAiMemory = async function() {
    const title = document.getElementById('mem-title').value.trim();
    const content = document.getElementById('mem-content').value.trim();
    if (!title || !content) return alert('Both Title and Content are required to ingest memory.');

    const res = await fetchAPI('/user/ai-memory', 'POST', { title, content });
    if (res?.success) {
        myTerminalTab('memory');
    } else {
        alert(res?.error || 'Failed to ingest memory block');
    }
};

window.deleteAiMemory = async function(id) {
    if (!confirm('Purge this memory block from the AI Engine?')) return;
    const res = await fetchAPI(`/user/ai-memory?id=${id}`, 'DELETE');
    if (res?.success) myTerminalTab('memory');
    else alert(res?.error || 'Failed to purge memory');
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
                <input id="wl-ticker" name="wl-ticker-field" placeholder="TICKER e.g. BTC-USD" maxlength="15"
                    autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" onblur="this.setAttribute('readonly','')"
                    style="background:${alphaColor(0.05)};border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem;width:140px;text-transform:uppercase">
                <input id="wl-target" name="wl-target-field" placeholder="Target price (optional)" type="number" step="any"
                    autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" onblur="this.setAttribute('readonly','')"
                    style="background:${alphaColor(0.05)};border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem;width:180px">
                <input id="wl-note" name="wl-note-field" placeholder="Note (optional)" maxlength="120"
                    autocomplete="off" readonly onfocus="this.removeAttribute('readonly')" onblur="this.setAttribute('readonly','')"
                    style="background:${alphaColor(0.05)};border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-family:var(--font-ui);font-size:0.75rem;flex:1;min-width:140px">
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
        const live = i.live_price || (window.livePrices?.[sym] || window.livePrices?.[i.ticker]);
        return live && i.price_at_add;
    });
    const perfSummary = withPerf.length >= 2 ? (() => {
        const moves = withPerf.map(i => {
            const sym = i.ticker.replace('-USD','').toUpperCase();
            const live = i.live_price || (window.livePrices?.[sym] || window.livePrices?.[i.ticker]);
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

    // — Grid table layout —
    // Columns: [80px ticker] [1fr live price] [1fr target] [1fr % to target] [1fr since added] [1fr note] [120px actions]
    const gridCols = '80px 1fr 1fr 1fr 1fr 1fr 120px';

    const headerRow = `
        <div style="display:grid;grid-template-columns:${gridCols};gap:0;padding:0.5rem 1rem;border-bottom:1px solid ${alphaColor(0.08)};margin-bottom:4px">
            <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">TICKER</div>
            <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">LIVE PRICE</div>
            <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">TARGET</div>
            <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">% TO TARGET</div>
            <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">SINCE ADDED</div>
            <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">NOTE</div>
            <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">ACTIONS</div>
        </div>`;

    const rows = items.map(item => {
        const sym = item.ticker.replace('-USD', '').toUpperCase();
        const livePx = item.live_price || (window.livePrices?.[sym] || window.livePrices?.[item.ticker]);
        const pxStr = livePx ? `$${Number(livePx).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—';
        const targetStr = item.target_price ? `$${Number(item.target_price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—';
        const dist = (livePx && item.target_price) ? (((item.target_price - livePx) / livePx) * 100).toFixed(2) : null;
        const distColor = dist !== null ? (dist >= 0 ? '#22c55e' : '#ef4444') : 'var(--text-dim)';

        const addedPx = item.price_at_add ? Number(item.price_at_add) : null;
        const sincePct = (addedPx && livePx) ? (((livePx - addedPx) / addedPx) * 100).toFixed(2) : null;
        const sinceColor = sincePct === null ? 'var(--text-dim)' : Number(sincePct) >= 0 ? '#22c55e' : '#ef4444';
        const daysHeld = item.added_at ? Math.round((Date.now() - new Date(item.added_at).getTime()) / 86400000) : null;
        const noteDisplay = item.note ? item.note.replace(/Quick add from signal feed/g,'').trim() : '';

        return `
        <div class="card" style="padding:0.85rem 1rem;margin-bottom:4px;transition:box-shadow 0.2s"
            onmouseenter="this.style.boxShadow='0 4px 20px rgba(0,242,255,0.06)'"
            onmouseleave="this.style.boxShadow=''">
            <div style="display:grid;grid-template-columns:${gridCols};gap:0;align-items:center">
                <!-- TICKER -->
                <div>
                    <div style="font-size:0.9rem;font-weight:900;color:var(--accent)">${sym}</div>
                    ${daysHeld !== null ? `<div style="font-size:0.5rem;color:var(--text-dim);margin-top:2px">${daysHeld === 0 ? 'Today' : daysHeld + 'd ago'}</div>` : ''}
                </div>
                <!-- LIVE PRICE -->
                <div style="font-size:0.95rem;font-weight:700;color:var(--text);font-family:var(--font-mono,monospace)">${pxStr}</div>
                <!-- TARGET -->
                <div style="font-size:0.95rem;font-weight:700;color:#f59e0b;font-family:var(--font-mono,monospace)">${targetStr}</div>
                <!-- % TO TARGET -->
                <div style="font-size:0.95rem;font-weight:700;color:${distColor};font-family:var(--font-mono,monospace)">${dist !== null ? (dist >= 0 ? '+' : '') + dist + '%' : '—'}</div>
                <!-- SINCE ADDED -->
                <div style="font-size:0.95rem;font-weight:700;color:${sinceColor};font-family:var(--font-mono,monospace)">${sincePct !== null ? (Number(sincePct) >= 0 ? '+' : '') + sincePct + '%' : '—'}</div>
                <!-- NOTE -->
                <div style="font-size:0.7rem;color:var(--text-dim);font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px" title="${noteDisplay}">${noteDisplay ? '"' + noteDisplay + '"' : '—'}</div>
                <!-- ACTIONS -->
                <div style="display:flex;gap:5px;justify-content:flex-end">
                    <button onclick="openDetail('${item.ticker}','WATCHLIST')" title="View chart" aria-label="View ${item.ticker} chart"
                        style="background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.2);color:var(--accent);padding:5px 7px;border-radius:7px;cursor:pointer">
                        <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">monitoring</span>
                    </button>
                    <button onclick="toggleWatchlistEdit(${item.id})" title="Set target price" aria-label="Edit ${item.ticker} target"
                        style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;padding:5px 7px;border-radius:7px;cursor:pointer">
                        <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">edit</span>
                    </button>
                    <button onclick="removeWatchlistItem(${item.id})" aria-label="Remove ${item.ticker} from watchlist"
                        style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:5px 7px;border-radius:7px;cursor:pointer">
                        <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">delete</span>
                    </button>
                </div>
            </div>
        </div>
        <!-- Inline edit row -->
        <div id="wl-edit-${item.id}" style="display:none;padding:0.75rem 1rem;border-top:1px solid rgba(245,158,11,0.15);background:rgba(245,158,11,0.04);margin-top:-4px;margin-bottom:4px;border-radius:0 0 8px 8px">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <div style="font-size:0.55rem;color:#f59e0b;letter-spacing:1.5px;font-weight:700;flex-basis:100%;margin-bottom:4px">SET TARGET PRICE</div>
                <input id="wl-edit-target-${item.id}" type="number" step="any" placeholder="Target price"
                    value="${item.target_price || ''}"
                    style="background:${alphaColor(0.05)};border:1px solid rgba(245,158,11,0.3);color:var(--text);padding:6px 10px;border-radius:8px;font-size:0.8rem;width:150px">
                <input id="wl-edit-note-${item.id}" type="text" placeholder="Note (optional)" maxlength="120"
                    value="${(item.note || '').replace(/Quick add from signal feed/g,'').trim()}"
                    style="background:${alphaColor(0.05)};border:1px solid ${alphaColor(0.1)};color:var(--text);padding:6px 10px;border-radius:8px;font-size:0.8rem;flex:1;min-width:120px">
                <button onclick="saveWatchlistEdit(${item.id})"
                    style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#f59e0b;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.7rem;font-weight:700;letter-spacing:1px">SAVE</button>
                <button onclick="toggleWatchlistEdit(${item.id})"
                    style="background:${alphaColor(0.04)};border:1px solid ${alphaColor(0.1)};color:var(--text-dim);padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.7rem">CANCEL</button>
            </div>
        </div>`;
    }).join('');

    return perfSummary + headerRow + rows;
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
// POSITIONS TAB (LIVE OMS DASHBOARD)
// --------------------------------------------------------------
async function renderPositionsTab(el) {
    const data = await fetchAPI('/oms-dashboard');

    if (!data || data.error) {
        el.innerHTML = `
            <div class="card" style="padding:2.5rem;text-align:center;color:var(--text-dim);border:1px solid rgba(239, 68, 68, 0.2)">
                <span class="material-symbols-outlined" style="font-size:3rem;opacity:0.5;color:var(--risk-high)">vpn_key_off</span>
                <h3 style="margin:1rem 0 0.5rem;color:white">Live Exchange Unreachable</h3>
                <p style="margin:0 0 1.5rem;color:var(--risk-high);font-size:0.8rem">${data?.error || 'Failed to connect to OMS gateway.'}</p>
                <div>
                    <button class="intel-action-btn" onclick="switchView('advanced')"><span class="material-symbols-outlined" style="vertical-align:middle;font-size:16px;margin-right:6px">settings</span> CONFIGURE EXCHANGE KEYS</button>
                </div>
            </div>`;
        return;
    }

    const { balances, positions } = data;
    
    // Summary KPI row
    const totalMargin = balances.total_margin || 0;
    const availMargin = balances.available || 0;
    const unrealized = balances.unrealized_pnl || 0;
    const pnlColor = unrealized >= 0 ? '#22c55e' : '#ef4444';
    const marginUsage = totalMargin > 0 ? ((totalMargin - availMargin) / totalMargin * 100).toFixed(1) : 0;

    const summaryHtml = `
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 15px;">
        <div style="font-size:0.75rem;font-weight:900;letter-spacing:1px;color:var(--accent)"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">sensors</span>LIVE OMS GATEWAY — BINANCE FUTURES</div>
        <button class="intel-action-btn mini outline" onclick="renderPositionsTab(document.getElementById('my-terminal-content'))"><span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle">sync</span> SYNC</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem">
        ${[
            ['LIVE POSITIONS', positions.length, '#60a5fa', 'table_rows'],
            ['MARGIN BALANCE', '$' + totalMargin.toLocaleString(undefined, {maximumFractionDigits:2}), '#60a5fa', 'account_balance_wallet'],
            ['MARGIN USED (%)', marginUsage + '%', marginUsage > 50 ? '#ef4444' : '#f59e0b', 'speed'],
            ['UNREALISED P&L (TOTAL)', (unrealized >= 0 ? '+' : '') + '$' + unrealized.toLocaleString(undefined, {maximumFractionDigits:2}), pnlColor, 'trending_up'],
        ].map(([label, val, color, icon]) => `
            <div class="card" style="padding:1rem;text-align:center;border-top:3px solid ${color}40;background:rgba(0,0,0,0.2)">
                <div style="font-size:1.2rem;color:${color};margin-bottom:8px"><span class="material-symbols-outlined">${icon}</span></div>
                <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:6px">${label}</div>
                <div style="font-size:1.2rem;font-weight:900;color:${color};font-family:var(--font-mono,monospace)">${val}</div>
            </div>`).join('')}
    </div>`;

    let posHtml = '';
    if (positions.length === 0) {
        posHtml = `
            <div class="card" style="padding:3rem;text-align:center;color:var(--text-dim)">
                <span class="material-symbols-outlined" style="font-size:2.5rem;opacity:0.3">data_usage</span>
                <p style="margin:0.8rem 0 0;font-size:0.85rem">No open exchange positions found.</p>
                <p style="font-size:0.7rem;margin-top:5px;opacity:0.6">Algorithm hooks will automatically populate this ledger upon execution.</p>
            </div>`;
    } else {
        posHtml = positions.map(p => {
            const upnl = p.unrealized_pnl;
            const size = p.entry_price * p.qty;
            const pnlPct = size > 0 ? (upnl / size * 100).toFixed(2) : 0;
            const uColor = upnl >= 0 ? '#22c55e' : '#ef4444';
            const sColor = p.side === 'LONG' ? '#22c55e' : '#ef4444';
            
            return `
            <div class="card" style="padding:1rem;margin-bottom:0.6rem;position:relative;overflow:hidden;border-left:3px solid ${sColor}80">
                ${p.bot_managed ? `<div style="position:absolute;top:0;right:0;background:rgba(0,242,255,0.1);color:#00f2ff;font-size:0.5rem;font-weight:900;padding:4px 8px;border-bottom-left-radius:8px;letter-spacing:1px"><span class="material-symbols-outlined" style="font-size:10px;vertical-align:middle;margin-right:3px">smart_toy</span>BOT MANAGED: ${p.bot_name}</div>` : ''}
                <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;padding-top:${p.bot_managed ? '8px' : '0'}">
                    <div style="flex:0 0 100px">
                        <div style="font-size:0.95rem;font-weight:900;color:var(--text)">${p.ticker.replace('-USD','')} <span style="font-size:0.6rem;color:var(--accent);vertical-align:super">${p.leverage}x</span></div>
                        <div style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:0.55rem;font-weight:900;letter-spacing:1px;margin-top:4px;background:${sColor}20;color:${sColor};border:1px solid ${sColor}40">${p.side}</div>
                    </div>
                    <div style="flex:1;min-width:100px">
                        <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:4px">SIZE (USDT)</div>
                        <div style="font-size:0.9rem;font-weight:700;font-family:var(--font-mono,monospace)">$${size.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
                        <div style="font-size:0.6rem;color:var(--text-dim);margin-top:2px">${p.qty} ${p.ticker.replace('-USD','')}</div>
                    </div>
                    <div style="flex:1;min-width:100px">
                        <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:4px">ENTRY / MARK PRICE</div>
                        <div style="font-size:0.9rem;font-weight:700;color:white;font-family:var(--font-mono,monospace)">$${p.entry_price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        <div style="font-size:0.65rem;color:var(--accent);margin-top:2px;font-family:var(--font-mono,monospace)">$${p.mark_price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                    </div>
                    <div style="flex:1;min-width:80px">
                        <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:4px">LIQUIDATION PRICE</div>
                        <div style="font-size:0.9rem;font-weight:700;color:${p.liquidation_price > 0 ? '#f59e0b' : 'var(--text-dim)'};font-family:var(--font-mono,monospace)">
                            ${p.liquidation_price > 0 ? '$'+p.liquidation_price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : '—'}
                        </div>
                    </div>
                    <div style="flex:1;min-width:110px">
                        <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:4px">UNREALISED P&L</div>
                        <div style="font-size:1.1rem;font-weight:900;color:${uColor};font-family:var(--font-mono,monospace)">
                            ${upnl >= 0 ? '+' : ''}$${Math.abs(upnl).toLocaleString(undefined,{maximumFractionDigits:2})}
                        </div>
                        <div style="font-size:0.65rem;color:${uColor};opacity:0.8;margin-top:2px;font-family:var(--font-mono,monospace)">${upnl >= 0 ? '+' : ''}${pnlPct}% (ROA)</div>
                    </div>
                    <div style="flex:0 0 100px;text-align:right">
                        ${p.bot_managed ? `
                            <div style="font-size:0.65rem;color:var(--text-dim);margin-bottom:4px;font-family:var(--font-mono,monospace)">TP: <span style="color:#22c55e;font-weight:700">+${p.tp_pct}%</span></div>
                            <div style="font-size:0.65rem;color:var(--text-dim);font-family:var(--font-mono,monospace)">SL: <span style="color:#ef4444;font-weight:700">-${p.sl_pct}%</span></div>
                        ` : `<span style="font-size:0.6rem;background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;color:var(--text-dim);border:1px solid rgba(255,255,255,0.1)">Discretionary</span>`}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    el.innerHTML = summaryHtml + '<div id="pos-list">' + posHtml + '</div>';
}

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
        const live = prices[sym] || prices[item.ticker];
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
        const live = prices[sym] || prices[pos.ticker];
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
