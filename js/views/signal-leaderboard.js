async function renderSignalLeaderboard(tabs = null) {
    appEl.innerHTML = `<div class="skeleton-loader" style="height:400px"></div>`;

    const data = await fetchAPI('/signal-leaderboard') || { signals: [], stats: {} };
    let { signals = [] } = data;
    signals = signals.map(s => ({ ...s, move_pct: parseFloat(s.move_pct ?? 0) }));

    const signalTypes = ['ALL', ...Array.from(new Set(signals.map(s => s.type))).sort()];
    const dateRanges  = [
        { label: '7D',  days: 7 },
        { label: '30D', days: 30 },
        { label: '90D', days: 90 },
        { label: 'ALL', days: null },
    ];
    const PAGE_SIZE = 25;

    appEl.innerHTML = `
        <div class="view-header">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alerts Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">leaderboard</span>Signal Leaderboard <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabs ? renderHubTabs('signal-leaderboard', tabs) : ''}

        <!-- Filter Bar -->
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;padding:14px 16px;background:${alphaColor(0.03)};border:1px solid var(--border);border-radius:10px">
            <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:0.6rem;letter-spacing:1.5px;color:var(--text-dim)">TYPE</span>
                <select id="lb-type-filter" style="border:1px solid rgba(0,242,255,0.2);color:white;font-size:0.65rem;padding:4px 8px;border-radius:6px;font-family:'JetBrains Mono'">
                    ${signalTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:0.6rem;letter-spacing:1.5px;color:var(--text-dim)">PERIOD</span>
                <div style="display:flex;gap:4px" id="lb-range-btns">
                    ${dateRanges.map((r, i) => `
                        <button id="lb-range-${r.label}" onclick="lbSetRange('${r.label}')"
                            style="font-size:0.6rem;padding:3px 10px;border-radius:6px;font-family:'JetBrains Mono';font-weight:700;letter-spacing:1px;
                                   border:1px solid rgba(0,242,255,${i===3?'0.4':'0.15'});
                                   background:rgba(0,242,255,${i===3?'0.12':'0.03'});
                                   color:${i===3?'var(--accent)':'var(--text-dim)'};cursor:pointer">
                            ${r.label}
                        </button>`).join('')}
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
                <span style="font-size:0.6rem;letter-spacing:1.5px;color:var(--text-dim)">STATUS</span>
                <div style="display:flex;gap:4px;flex-wrap:wrap" id="lb-status-btns">
                    ${['ALL','OPEN','TP HIT','SL HIT','EXPIRED'].map((s,i) => {
                        const colors = {
                            'ALL':     ['rgba(0,242,255,0.4)',  'rgba(0,242,255,0.12)',  'var(--accent)'],
                            'OPEN':    ['rgba(125,211,252,0.4)','rgba(125,211,252,0.12)','var(--accent)'],
                            'TP HIT':  ['rgba(34,197,94,0.4)', 'rgba(34,197,94,0.12)',  'var(--risk-low)'],
                            'SL HIT':  ['rgba(239,68,68,0.4)', 'rgba(239,68,68,0.12)',  'var(--risk-high)'],
                            'EXPIRED': ['rgba(245,158,11,0.4)','rgba(245,158,11,0.12)', '#f59e0b'],
                        };
                        const [bc, bg, col] = colors[s];
                        const isActive = i === 0;
                        return `<button id="lb-status-${s.replace(' ','-')}" onclick="lbSetStatus('${s}')"
                            style="font-size:0.6rem;padding:3px 9px;border-radius:6px;font-family:'JetBrains Mono';font-weight:700;letter-spacing:0.5px;
                                   border:1px solid ${isActive ? bc : alphaColor(0.1)};
                                   background:${isActive ? bg : alphaColor(0.03)};
                                   color:${isActive ? col : 'var(--text-dim)'};cursor:pointer;transition:all 0.15s">
                            ${s}
                        </button>`;
                    }).join('')}
                </div>
            </div>
        </div>

        <!-- KPI Row -->
        <div id="lb-stats-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;"></div>

        <!-- Win Rate Bar -->
        <div class="card" style="margin-bottom:20px;padding:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-size:0.7rem;letter-spacing:2px;color:var(--text-dim);">SIGNAL WIN RATE GAUGE</span>
                <span id="lb-wr-pct" style="font-size:0.8rem;font-weight:700;color:var(--risk-high);">-</span>
            </div>
            <div style="background:${alphaColor(0.06)};border-radius:6px;height:8px;overflow:hidden;">
                <div id="lb-wr-bar" style="width:0%;height:100%;background:var(--risk-high);border-radius:6px;transition:width 0.8s ease,background 0.4s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:6px;">
                <span style="font-size:0.6rem;color:var(--text-dim);">0% - Bearish</span>
                <span style="font-size:0.6rem;color:var(--text-dim);">50% - Neutral</span>
                <span style="font-size:0.6rem;color:var(--text-dim);">100% - Bullish</span>
            </div>
        </div>

        <!-- Table Card -->
        <div class="card">
            <div class="card-header" style="margin-bottom:16px;">
                <h2>Signal Outcomes</h2>
                <span id="lb-table-label" class="label-tag"></span>
            </div>
            <div id="lb-table-wrap" style="overflow-x:auto;"></div>
            <!-- Pagination -->
            <div id="lb-pagination" style="display:flex;align-items:center;justify-content:space-between;padding:14px 4px 4px;flex-wrap:wrap;gap:8px;"></div>
        </div>
    `;

    // - State -
    window._lbRange  = 'ALL';
    window._lbPage   = 1;
    window._lbSortCol = 'timestamp';
    window._lbSortDir = 'desc';
    window._lbStatus = 'ALL';

    // Column definitions: { key, label, align }
    const COLS = [
        { key: 'ticker',        label: 'TICKER',        align: 'left'  },
        { key: 'type',          label: 'SIGNAL TYPE',   align: 'left'  },
        { key: 'direction',     label: 'DIR',           align: 'left'  },
        { key: 'signal_price',  label: 'SIGNAL PRICE',  align: 'right' },
        { key: 'current_price', label: 'CLOSE PRICE',   align: 'right' },
        { key: 'move_pct',      label: 'MOVE',          align: 'right' },
        { key: 'close_reason',  label: 'CLOSE',         align: 'center'},
        { key: 'outcome',       label: 'OUTCOME',       align: 'center'},
        { key: 'timestamp',     label: 'DATE',          align: 'left'  },
    ];

    window.lbSetStatus = (status) => {
        window._lbStatus = status;
        window._lbPage   = 1;
        const statusColors = {
            'ALL':     ['rgba(0,242,255,0.4)',  'rgba(0,242,255,0.12)',  'var(--accent)'],
            'OPEN':    ['rgba(125,211,252,0.4)','rgba(125,211,252,0.12)','var(--accent)'],
            'TP HIT':  ['rgba(34,197,94,0.4)', 'rgba(34,197,94,0.12)',  'var(--risk-low)'],
            'SL HIT':  ['rgba(239,68,68,0.4)', 'rgba(239,68,68,0.12)',  'var(--risk-high)'],
            'EXPIRED': ['rgba(245,158,11,0.4)','rgba(245,158,11,0.12)', '#f59e0b'],
        };
        document.querySelectorAll('#lb-status-btns button').forEach(b => {
            const key  = b.textContent.trim();
            const active = key === status;
            const [bc, bg, col] = statusColors[key] || [alphaColor(0.2), alphaColor(0.06), 'var(--text-dim)'];
            b.style.borderColor = active ? bc : alphaColor(0.1);
            b.style.background  = active ? bg : alphaColor(0.03);
            b.style.color       = active ? col : 'var(--text-dim)';
        });
        lbRefresh();
    };

    window.lbSetRange = (label) => {
        window._lbRange = label;
        window._lbPage  = 1;
        document.querySelectorAll('#lb-range-btns button').forEach(b => {
            const active = b.id === `lb-range-${label}`;
            b.style.borderColor = active ? 'rgba(0,242,255,0.4)' : 'rgba(0,242,255,0.15)';
            b.style.background  = active ? 'rgba(0,242,255,0.12)' : 'rgba(0,242,255,0.03)';
            b.style.color       = active ? 'var(--accent)' : 'var(--text-dim)';
        });
        lbRefresh();
    };

    window.lbSetSort = (col) => {
        if (window._lbSortCol === col) {
            window._lbSortDir = window._lbSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            window._lbSortCol = col;
            window._lbSortDir = col === 'timestamp' ? 'desc' : 'asc';
        }
        window._lbPage = 1;
        lbRefresh();
    };

    window.lbSetPage = (p) => {
        window._lbPage = p;
        lbRefresh();
        // Scroll table into view
        document.getElementById('lb-table-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    window.lbRefresh = () => {
        const typeVal     = document.getElementById('lb-type-filter')?.value || 'ALL';
        const excludeOpen = document.getElementById('lb-exclude-open')?.checked || false;
        const range       = window._lbRange;
        const rangeObj    = dateRanges.find(r => r.label === range);
        const cutoff      = rangeObj?.days ? Date.now() - rangeObj.days * 864e5 : 0;

        // 1. Filter
        const statusVal   = window._lbStatus || 'ALL';
        let filtered = window._lbAllSignals.filter(s => {
            if (typeVal !== 'ALL' && s.type !== typeVal) return false;
            if (cutoff && s.timestamp && new Date(s.timestamp).getTime() < cutoff) return false;
            if (statusVal !== 'ALL') {
                if (statusVal === 'OPEN'    && s.close_reason !== 'OPEN')    return false;
                if (statusVal === 'TP HIT'  && s.close_reason !== 'TP HIT')  return false;
                if (statusVal === 'SL HIT'  && s.close_reason !== 'SL HIT')  return false;
                if (statusVal === 'EXPIRED' && s.close_reason !== 'EXPIRED') return false;
            }
            return true;
        });

        // 2. Sort (on full filtered set)
        const col = window._lbSortCol;
        const dir = window._lbSortDir === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
            let av = a[col], bv = b[col];
            if (col === 'timestamp') { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
            else if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
            return av < bv ? -dir : av > bv ? dir : 0;
        });

        // 3. KPIs (from full filtered+sorted set, not just current page)
        const wins   = filtered.filter(s => s.outcome === 'WIN').length;
        const losses = filtered.filter(s => s.outcome === 'LOSS').length;
        const total  = filtered.length;
        const wr     = total > 0 ? Math.round(wins / total * 100) : 0;
        const avgRet = total > 0 ? parseFloat((filtered.reduce((a, s) => a + s.move_pct, 0) / total).toFixed(2)) : 0;
        const winColor = wr >= 55 ? 'var(--risk-low)' : wr >= 45 ? '#f59e0b' : 'var(--risk-high)';
        const avgColor = avgRet >= 0 ? 'var(--risk-low)' : 'var(--risk-high)';

        const statsEl = document.getElementById('lb-stats-row');
        if (statsEl) statsEl.innerHTML = [
            ['SIGNALS TRACKED', total,                                      'var(--accent)'],
            ['WIN RATE',        wr + '%',                                   winColor],
            ['AVG RETURN',      (avgRet >= 0 ? '+' : '') + avgRet + '%',   avgColor],
            ['WINS / LOSSES',   `${wins} / ${losses}`,                     'var(--text)'],
        ].map(([label, value, color]) => `
            <div class="card" style="padding:18px;text-align:center;">
                <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:8px;">${label}</div>
                <div style="font-size:1.6rem;font-weight:900;color:${color};">${value}</div>
            </div>`).join('');

        const wrPct = document.getElementById('lb-wr-pct');
        const wrBar = document.getElementById('lb-wr-bar');
        if (wrPct) { wrPct.textContent = wr + '%'; wrPct.style.color = winColor; }
        if (wrBar) { wrBar.style.width = wr + '%'; wrBar.style.background = winColor; }

        // 4. Pagination
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        window._lbPage   = Math.min(window._lbPage, totalPages);
        const page       = window._lbPage;
        const start      = (page - 1) * PAGE_SIZE;
        const pageData   = filtered.slice(start, start + PAGE_SIZE);

        // Label
        const lbl = document.getElementById('lb-table-label');
        if (lbl) lbl.textContent = `${total} SIGNALS - ${range} - ${typeVal}${statusVal !== 'ALL' ? ' - ' + statusVal : ''}`;

        // 5. Render table
        const wrap = document.getElementById('lb-table-wrap');
        if (!wrap) return;

        if (total === 0) {
            wrap.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-dim);">
                <span class="material-symbols-outlined" style="font-size:48px;display:block;margin-bottom:12px;opacity:0.3;">bar_chart</span>
                <p>No signals match the current filters.</p></div>`;
        } else {
            const sortArrow = (key) => {
                if (window._lbSortCol !== key) return `<span style="opacity:0.25;margin-left:3px">-</span>`;
                return window._lbSortDir === 'asc'
                    ? `<span style="color:var(--accent);margin-left:3px">-</span>`
                    : `<span style="color:var(--accent);margin-left:3px">-</span>`;
            };

            wrap.innerHTML = `
            <table style="width:100%;border-collapse:collapse;min-width:700px;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border);">
                        ${COLS.map(c => `
                            <th onclick="lbSetSort('${c.key}')"
                                style="text-align:${c.align};padding:8px 12px;font-size:0.6rem;letter-spacing:2px;
                                       color:${window._lbSortCol===c.key?'var(--accent)':'var(--text-dim)'};
                                       cursor:pointer;user-select:none;white-space:nowrap;
                                       transition:color 0.15s;"
                                onmouseenter="this.style.color='var(--text)'"
                                onmouseleave="this.style.color='${window._lbSortCol===c.key?'var(--accent)':'var(--text-dim)'}'">
                                ${c.label}${sortArrow(c.key)}
                            </th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${pageData.map(s => {
                        const moveColor = s.move_pct >= 0 ? 'var(--risk-low)' : 'var(--risk-high)';
                        const badge = s.outcome === 'WIN'
                            ? `<span style="background:rgba(34,197,94,0.15);color:var(--risk-low);padding:3px 10px;border-radius:4px;font-size:0.65rem;font-weight:900;">WIN</span>`
                            : `<span style="background:rgba(239,68,68,0.15);color:var(--risk-high);padding:3px 10px;border-radius:4px;font-size:0.65rem;font-weight:900;">LOSS</span>`;
                        const openTag = !s.closed
                            ? `<span style="font-size:0.5rem;background:rgba(245,158,11,0.15);color:#f59e0b;padding:1px 5px;border-radius:3px;margin-left:4px">OPEN</span>`
                            : '';
                        const reasonColors = {
                            'TP HIT':  ['rgba(34,197,94,0.15)',  'var(--risk-low)'],
                            'SL HIT':  ['rgba(239,68,68,0.15)',  'var(--risk-high)'],
                            'EXPIRED': ['rgba(245,158,11,0.15)', '#f59e0b'],
                            'OPEN':    ['rgba(125,211,252,0.12)','var(--accent)'],
                        };
                        const [rBg, rCol] = reasonColors[s.close_reason] || [alphaColor(0.06), 'var(--text-dim)'];
                        const reasonBadge = `<span style="background:${rBg};color:${rCol};padding:3px 8px;border-radius:4px;font-size:0.6rem;font-weight:700;white-space:nowrap">${s.close_reason || '-'}</span>`;
                        return `<tr style="border-bottom:1px solid ${alphaColor(0.04)};transition:background 0.2s;"
                                    onmouseenter="this.style.background='rgba(0,242,255,0.02)'"
                                    onmouseleave="this.style.background=''">
                            <td style="padding:10px 12px;font-size:0.8rem;font-weight:700;color:var(--accent);cursor:pointer;white-space:nowrap;"
                                onclick="openDetail('${s.ticker}','${s.direction||'SIGNAL'}')"
                                onmouseenter="this.style.textDecoration='underline';this.style.textDecorationColor='rgba(0,242,255,0.5)'"
                                onmouseleave="this.style.textDecoration='none'"
                                title="Open ${s.ticker} chart">${s.ticker}${openTag}</td>
                            <td style="padding:10px 12px;font-size:0.7rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${s.type}">${s.type}</td>
                            <td style="padding:10px 12px;">
                                <span style="font-size:0.65rem;font-weight:700;color:${s.direction==='LONG'?'var(--risk-low)':'var(--risk-high)'};">${s.direction}</span>
                            </td>
                            <td style="padding:10px 12px;text-align:right;font-size:0.78rem;">$${parseFloat(s.signal_price).toLocaleString()}</td>
                            <td style="padding:10px 12px;text-align:right;font-size:0.78rem;">$${parseFloat(s.current_price).toLocaleString()}</td>
                            <td style="padding:10px 12px;text-align:right;font-size:0.78rem;font-weight:700;color:${moveColor};">${s.move_pct>=0?'+':''}${s.move_pct}%</td>
                            <td style="padding:10px 12px;text-align:center;">${reasonBadge}</td>
                            <td style="padding:10px 12px;text-align:center;">${badge}</td>
                            <td style="padding:10px 12px;font-size:0.7rem;color:var(--text-dim);">${s.timestamp ? new Date(s.timestamp).toLocaleDateString() : '-'}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>`;
        }

        // 6. Pagination controls
        const pgEl = document.getElementById('lb-pagination');
        if (!pgEl) return;
        if (totalPages <= 1) { pgEl.innerHTML = ''; return; }

        // Show up to 7 page buttons with ellipsis
        const pageBtns = [];
        const makeBtn = (p, label = p) => {
            const active = p === page;
            return `<button onclick="lbSetPage(${p})"
                style="min-width:32px;padding:4px 8px;font-size:0.65rem;font-family:'JetBrains Mono';font-weight:700;border-radius:6px;cursor:pointer;
                       border:1px solid ${active?'rgba(0,242,255,0.5)':alphaColor(0.1)};
                       background:${active?'rgba(0,242,255,0.15)':alphaColor(0.04)};
                       color:${active?'var(--accent)':'var(--text-dim)'}">
                ${label}
            </button>`;
        };

        pageBtns.push(makeBtn(1));
        if (page > 3) pageBtns.push(`<span style="color:var(--text-dim);font-size:0.7rem;padding:0 4px">-</span>`);
        for (let p = Math.max(2, page-1); p <= Math.min(totalPages-1, page+1); p++) pageBtns.push(makeBtn(p));
        if (page < totalPages - 2) pageBtns.push(`<span style="color:var(--text-dim);font-size:0.7rem;padding:0 4px">-</span>`);
        if (totalPages > 1) pageBtns.push(makeBtn(totalPages));

        pgEl.innerHTML = `
            <button onclick="lbSetPage(${page-1})" ${page===1?'disabled':''} style="font-size:0.65rem;padding:4px 10px;border-radius:6px;cursor:pointer;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.04)};color:${page===1?alphaColor(0.2):'var(--text-dim)'}">- PREV</button>
            <div style="display:flex;align-items:center;gap:4px">
                ${pageBtns.join('')}
            </div>
            <div style="display:flex;align-items:center;gap:12px">
                <span style="font-size:0.65rem;color:var(--text-dim);font-family:'JetBrains Mono'">
                    PAGE <strong style="color:var(--text)">${page}</strong> OF <strong style="color:var(--text)">${totalPages}</strong>
                    &nbsp;-&nbsp; ROWS ${start+1}-${Math.min(start+PAGE_SIZE, total)} OF ${total}
                </span>
                <button onclick="lbSetPage(${page+1})" ${page===totalPages?'disabled':''} style="font-size:0.65rem;padding:4px 10px;border-radius:6px;cursor:pointer;border:1px solid ${alphaColor(0.1)};background:${alphaColor(0.04)};color:${page===totalPages?alphaColor(0.2):'var(--text-dim)'}">NEXT -</button>
            </div>`;
    };

    window._lbAllSignals = signals;
    document.getElementById('lb-type-filter')?.addEventListener('change', () => { window._lbPage = 1; lbRefresh(); });
    lbRefresh();
}
