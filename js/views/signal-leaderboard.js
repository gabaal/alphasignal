async function renderSignalLeaderboard(tabs = null) {
    appEl.innerHTML = `<div class="skeleton-loader" style="height:400px"></div>`;

    const data = await fetchAPI('/signal-leaderboard') || { signals: [], stats: {} };
    let { signals = [] } = data;

    // ── Ensure all signals have a numeric move_pct ──
    signals = signals.map(s => ({ ...s, move_pct: parseFloat(s.move_pct ?? 0) }));

    // ── Derive filter options ──
    const signalTypes = ['ALL', ...Array.from(new Set(signals.map(s => s.type))).sort()];
    const dateRanges  = [
        { label: '7D',   days: 7 },
        { label: '30D',  days: 30 },
        { label: '90D',  days: 90 },
        { label: 'ALL',  days: null },
    ];

    // ── Render shell with filters ──
    appEl.innerHTML = `
        <div class="view-header">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alerts Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">leaderboard</span>Signal Leaderboard <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabs ? renderHubTabs('signal-leaderboard', tabs) : ''}

        <!-- ── Filter Bar ── -->
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:20px;padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px">
            <!-- Signal type filter -->
            <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:0.6rem;letter-spacing:1.5px;color:var(--text-dim)">TYPE</span>
                <select id="lb-type-filter" style="background:rgba(0,0,0,0.4);border:1px solid rgba(0,242,255,0.2);color:white;font-size:0.65rem;padding:4px 8px;border-radius:6px;font-family:'JetBrains Mono'">
                    ${signalTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
            </div>
            <!-- Date range filter -->
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
            <!-- Exclude open signals toggle -->
            <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.65rem;color:var(--text-dim)">
                    <input type="checkbox" id="lb-exclude-open" style="accent-color:var(--accent);width:14px;height:14px" onchange="lbRefresh()">
                    <span>EXCLUDE OPEN SIGNALS</span>
                </label>
            </div>
        </div>

        <!-- ── KPI row (updated by filter) ── -->
        <div id="lb-stats-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;"></div>

        <!-- ── Win rate bar ── -->
        <div class="card" style="margin-bottom:20px;padding:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-size:0.7rem;letter-spacing:2px;color:var(--text-dim);">SIGNAL WIN RATE GAUGE</span>
                <span id="lb-wr-pct" style="font-size:0.8rem;font-weight:700;color:var(--risk-high);">—</span>
            </div>
            <div style="background:rgba(255,255,255,0.06);border-radius:6px;height:8px;overflow:hidden;">
                <div id="lb-wr-bar" style="width:0%;height:100%;background:var(--risk-high);border-radius:6px;transition:width 0.8s ease,background 0.4s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:6px;">
                <span style="font-size:0.6rem;color:var(--text-dim);">0% — Bearish</span>
                <span style="font-size:0.6rem;color:var(--text-dim);">50% — Neutral</span>
                <span style="font-size:0.6rem;color:var(--text-dim);">100% — Bullish</span>
            </div>
        </div>

        <!-- ── Signal Table ── -->
        <div class="card">
            <div class="card-header" style="margin-bottom:16px;">
                <h2>Signal Outcomes</h2>
                <span id="lb-table-label" class="label-tag">LAST 200 SIGNALS · 1H+ LOOKBACK</span>
            </div>
            <div id="lb-table-wrap" style="overflow-x:auto;"></div>
        </div>
    `;

    // ── State ──
    window._lbAllSignals = signals;
    window._lbRange      = 'ALL';

    // ── Filter + render logic ──
    window.lbSetRange = (label) => {
        window._lbRange = label;
        document.querySelectorAll('#lb-range-btns button').forEach(b => {
            const active = b.id === `lb-range-${label}`;
            b.style.borderColor  = active ? 'rgba(0,242,255,0.4)' : 'rgba(0,242,255,0.15)';
            b.style.background   = active ? 'rgba(0,242,255,0.12)' : 'rgba(0,242,255,0.03)';
            b.style.color        = active ? 'var(--accent)' : 'var(--text-dim)';
        });
        lbRefresh();
    };

    window.lbRefresh = () => {
        const typeVal    = document.getElementById('lb-type-filter')?.value || 'ALL';
        const excludeOpen = document.getElementById('lb-exclude-open')?.checked || false;
        const range      = window._lbRange;
        const rangeObj   = dateRanges.find(r => r.label === range);
        const cutoff     = rangeObj?.days ? Date.now() - rangeObj.days * 864e5 : 0;

        let filtered = window._lbAllSignals.filter(s => {
            if (typeVal !== 'ALL' && s.type !== typeVal) return false;
            if (cutoff && s.timestamp && new Date(s.timestamp).getTime() < cutoff) return false;
            if (excludeOpen && !s.closed) return false;
            return true;
        });

        // Recalculate KPIs from filtered set
        const wins   = filtered.filter(s => s.outcome === 'WIN').length;
        const losses = filtered.filter(s => s.outcome === 'LOSS').length;
        const total  = filtered.length;
        const wr     = total > 0 ? Math.round(wins / total * 100) : 0;
        const avgRet = total > 0 ? parseFloat((filtered.reduce((a, s) => a + s.move_pct, 0) / total).toFixed(2)) : 0;

        const winColor = wr >= 55 ? 'var(--risk-low)' : wr >= 45 ? '#f59e0b' : 'var(--risk-high)';
        const avgColor = avgRet >= 0 ? 'var(--risk-low)' : 'var(--risk-high)';

        // Update KPI row
        const statsEl = document.getElementById('lb-stats-row');
        if (statsEl) statsEl.innerHTML = [
            ['SIGNALS TRACKED', total, 'var(--accent)'],
            ['WIN RATE', wr + '%', winColor],
            ['AVG RETURN', (avgRet >= 0 ? '+' : '') + avgRet + '%', avgColor],
            ['WINS / LOSSES', `${wins} / ${losses}`, 'var(--text)'],
        ].map(([label, value, color]) => `
            <div class="card" style="padding:18px;text-align:center;">
                <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:8px;">${label}</div>
                <div style="font-size:1.6rem;font-weight:900;color:${color};">${value}</div>
            </div>`).join('');

        // Update gauge
        const wrPct = document.getElementById('lb-wr-pct');
        const wrBar = document.getElementById('lb-wr-bar');
        if (wrPct) { wrPct.textContent = wr + '%'; wrPct.style.color = winColor; }
        if (wrBar) { wrBar.style.width = wr + '%'; wrBar.style.background = winColor; }

        // Update table label
        const lbl = document.getElementById('lb-table-label');
        if (lbl) lbl.textContent = `${total} SIGNALS · ${range} · ${typeVal}${excludeOpen ? ' · CLOSED ONLY' : ''}`;

        // Render table
        const wrap = document.getElementById('lb-table-wrap');
        if (!wrap) return;
        if (filtered.length === 0) {
            wrap.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-dim);">
                <span class="material-symbols-outlined" style="font-size:48px;display:block;margin-bottom:12px;opacity:0.3;">bar_chart</span>
                <p>No signals match the current filters.</p></div>`;
            return;
        }
        wrap.innerHTML = `
        <table style="width:100%;border-collapse:collapse;min-width:700px;">
            <thead>
                <tr style="border-bottom:1px solid var(--border);">
                    ${['TICKER','SIGNAL TYPE','DIR','SIGNAL PRICE','CURRENT PRICE','MOVE','OUTCOME','DATE'].map((h, i) =>
                        `<th style="text-align:${i>=3&&i<=5?'right':i===6?'center':'left'};padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">${h}</th>`
                    ).join('')}
                </tr>
            </thead>
            <tbody>
                ${filtered.map(s => {
                    const isWin    = s.outcome === 'WIN';
                    const moveColor = s.move_pct >= 0 ? 'var(--risk-low)' : 'var(--risk-high)';
                    const badge = isWin
                        ? `<span style="background:rgba(34,197,94,0.15);color:var(--risk-low);padding:3px 10px;border-radius:4px;font-size:0.65rem;font-weight:900;">WIN</span>`
                        : `<span style="background:rgba(239,68,68,0.15);color:var(--risk-high);padding:3px 10px;border-radius:4px;font-size:0.65rem;font-weight:900;">LOSS</span>`;
                    const openTag = !s.closed ? `<span style="font-size:0.5rem;background:rgba(245,158,11,0.15);color:#f59e0b;padding:1px 5px;border-radius:3px;margin-left:4px">OPEN</span>` : '';
                    return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.2s;"
                                onmouseenter="this.style.background='rgba(0,242,255,0.02)'"
                                onmouseleave="this.style.background=''">
                        <td style="padding:10px 12px;font-size:0.8rem;font-weight:700;color:var(--accent);">${s.ticker}${openTag}</td>
                        <td style="padding:10px 12px;font-size:0.7rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${s.type}">${s.type}</td>
                        <td style="padding:10px 12px;">
                            <span style="font-size:0.65rem;font-weight:700;color:${s.direction==='LONG'?'var(--risk-low)':'var(--risk-high)'};">${s.direction}</span>
                        </td>
                        <td style="padding:10px 12px;text-align:right;font-size:0.78rem;">$${parseFloat(s.signal_price).toLocaleString()}</td>
                        <td style="padding:10px 12px;text-align:right;font-size:0.78rem;">$${parseFloat(s.current_price).toLocaleString()}</td>
                        <td style="padding:10px 12px;text-align:right;font-size:0.78rem;font-weight:700;color:${moveColor};">${s.move_pct>=0?'+':''}${s.move_pct}%</td>
                        <td style="padding:10px 12px;text-align:center;">${badge}</td>
                        <td style="padding:10px 12px;font-size:0.7rem;color:var(--text-dim);">${s.timestamp ? new Date(s.timestamp).toLocaleDateString() : '—'}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
    };

    // ── Wire up type filter ──
    document.getElementById('lb-type-filter')?.addEventListener('change', lbRefresh);

    // ── Initial render ──
    lbRefresh();
}
