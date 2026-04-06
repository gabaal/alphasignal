async function renderSignalLeaderboard(tabs = null) {
    appEl.innerHTML = `<div class="skeleton-loader" style="height:400px"></div>`;

    const data = await fetchAPI('/signal-leaderboard') || { signals: [], stats: {} };
    const { signals = [], stats = {} } = data;

    const statCard = (label, value, color = 'var(--accent)') => `
        <div class="card" style="padding:18px;text-align:center;">
            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:8px;">${label}</div>
            <div style="font-size:1.6rem;font-weight:900;color:${color};">${value}</div>
        </div>`;

    const winColor = stats.win_rate >= 55 ? 'var(--risk-low)' : stats.win_rate >= 45 ? '#f59e0b' : 'var(--risk-high)';
    const avgColor = (stats.avg_return || 0) >= 0 ? 'var(--risk-low)' : 'var(--risk-high)';

    appEl.innerHTML = `
        <div class="view-header">
            ${tabs ? renderHubTabs('signal-leaderboard', tabs) : ''}
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alerts Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">leaderboard</span>Signal Leaderboard <span class="premium-badge">LIVE</span></h1>
        </div>

        <!-- Stats Row -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;">
            ${statCard('SIGNALS TRACKED', stats.total || 0)}
            ${statCard('WIN RATE', (stats.win_rate || 0) + '%', winColor)}
            ${statCard('AVG RETURN', (stats.avg_return >= 0 ? '+' : '') + (stats.avg_return || 0) + '%', avgColor)}
            ${statCard('WINS / LOSSES', `${stats.wins || 0} / ${stats.losses || 0}`, 'var(--text)')}
        </div>

        <!-- Win Rate Bar -->
        <div class="card" style="margin-bottom:20px;padding:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-size:0.7rem;letter-spacing:2px;color:var(--text-dim);">SIGNAL WIN RATE GAUGE</span>
                <span style="font-size:0.8rem;font-weight:700;color:${winColor};">${stats.win_rate || 0}%</span>
            </div>
            <div style="background:rgba(255,255,255,0.06);border-radius:6px;height:8px;overflow:hidden;">
                <div style="width:${stats.win_rate || 0}%;height:100%;background:linear-gradient(90deg,${winColor},${winColor}aa);border-radius:6px;transition:width 0.8s ease;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:6px;">
                <span style="font-size:0.6rem;color:var(--text-dim);">0% — Bearish</span>
                <span style="font-size:0.6rem;color:var(--text-dim);">50% — Neutral</span>
                <span style="font-size:0.6rem;color:var(--text-dim);">100% — Bullish</span>
            </div>
        </div>

        <!-- Signal Table -->
        <div class="card">
            <div class="card-header" style="margin-bottom:16px;">
                <h2>Signal Outcomes</h2>
                <span class="label-tag">LAST 200 SIGNALS · 1H+ LOOKBACK</span>
            </div>
            ${signals.length === 0 ? `
                <div style="text-align:center;padding:48px;color:var(--text-dim);">
                    <span class="material-symbols-outlined" style="font-size:48px;display:block;margin-bottom:12px;opacity:0.3;">bar_chart</span>
                    <p>Signal history still accumulating. Check back after the first harvest cycle.</p>
                </div>
            ` : `
            <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;min-width:700px;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border);">
                        <th style="text-align:left;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">TICKER</th>
                        <th style="text-align:left;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">SIGNAL TYPE</th>
                        <th style="text-align:left;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">DIR</th>
                        <th style="text-align:right;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">SIGNAL PRICE</th>
                        <th style="text-align:right;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">CURRENT PRICE</th>
                        <th style="text-align:right;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">MOVE</th>
                        <th style="text-align:center;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">OUTCOME</th>
                        <th style="text-align:left;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);">DATE</th>
                    </tr>
                </thead>
                <tbody>
                    ${signals.map(s => {
                        const isWin = s.outcome === 'WIN';
                        const moveColor = s.move_pct >= 0 ? 'var(--risk-low)' : 'var(--risk-high)';
                        const rowBorder = `border-bottom:1px solid rgba(255,255,255,0.04)`;
                        const badge = isWin
                            ? `<span style="background:rgba(34,197,94,0.15);color:var(--risk-low);padding:3px 10px;border-radius:4px;font-size:0.65rem;font-weight:900;">WIN</span>`
                            : `<span style="background:rgba(239,68,68,0.15);color:var(--risk-high);padding:3px 10px;border-radius:4px;font-size:0.65rem;font-weight:900;">LOSS</span>`;
                        const sevColor = s.severity === 'CRITICAL' ? 'var(--risk-high)' : s.severity === 'HIGH' ? '#f59e0b' : 'var(--text-dim)';
                        return `<tr style="${rowBorder};transition:background 0.2s;" onmouseenter="this.style.background='rgba(0,242,255,0.02)'" onmouseleave="this.style.background=''">
                            <td style="padding:10px 12px;font-size:0.8rem;font-weight:700;color:var(--accent);">${s.ticker}</td>
                            <td style="padding:10px 12px;font-size:0.7rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${s.type}">${s.type}</td>
                            <td style="padding:10px 12px;">
                                <span style="font-size:0.65rem;font-weight:700;color:${s.direction==='LONG'?'var(--risk-low)':'var(--risk-high)'};">${s.direction}</span>
                            </td>
                            <td style="padding:10px 12px;text-align:right;font-size:0.78rem;">$${s.signal_price.toLocaleString()}</td>
                            <td style="padding:10px 12px;text-align:right;font-size:0.78rem;">$${s.current_price.toLocaleString()}</td>
                            <td style="padding:10px 12px;text-align:right;font-size:0.78rem;font-weight:700;color:${moveColor};">${s.move_pct>=0?'+':''}${s.move_pct}%</td>
                            <td style="padding:10px 12px;text-align:center;">${badge}</td>
                            <td style="padding:10px 12px;font-size:0.7rem;color:var(--text-dim);">${s.timestamp ? new Date(s.timestamp).toLocaleDateString() : '—'}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
            </div>`}
        </div>
    `;
}
