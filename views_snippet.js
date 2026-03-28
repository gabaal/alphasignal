
// ================================================================
// Phase 16-E: Backtester V2 — Real Signal History + Live Prices
// ================================================================

async function renderBacktesterV2(tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    appEl.innerHTML = `
        ${renderHubTabs(tabs, 'backtester-v2')}
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#00d4aa">analytics</span>Signal Backtester <span class="premium-badge">V2</span></h1>
                <p>Walk-forward simulation on live institutional signals with real price data, rolling Sharpe, and BTC benchmark.</p>
            </div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                <label style="font-size:0.7rem;color:var(--text-dim)">HOLD PERIOD</label>
                <select id="btv2-hold" style="background:var(--card-bg);color:var(--text);border:1px solid var(--border);padding:6px 12px;border-radius:6px;font-size:0.75rem">
                    <option value="3">3 Days</option><option value="5" selected>5 Days</option>
                    <option value="10">10 Days</option><option value="20">20 Days</option>
                </select>
                <button onclick="loadBacktesterV2()" style="background:linear-gradient(135deg,#00d4aa,#00a896);color:#000;border:none;padding:8px 18px;border-radius:8px;font-weight:800;font-size:0.75rem;cursor:pointer;letter-spacing:1px">RUN BACKTEST</button>
            </div>
        </div>
        <div id="btv2-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:1.5rem">
            ${['Win Rate','Total Trades','Total Return','Sharpe','Max Drawdown','Profit Factor','Calmar'].map(s =>
                '<div class="glass-card" style="padding:1rem;text-align:center"><div style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:4px">' + s.toUpperCase() + '</div><div class="btv2-stat" id="btv2-' + s.toLowerCase().replace(/\s+/g,'-') + '" style="font-size:1.3rem;font-weight:800;color:#00d4aa">--</div></div>'
            ).join('')}
        </div>
        <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
                <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim)">ROLLING 30-DAY SHARPE + CUMULATIVE RETURN</div>
                <div style="display:flex;gap:12px;font-size:0.65rem">
                    <span style="color:#00d4aa">&#9632; Strategy</span>
                    <span style="color:#f7931a">&#9632; BTC Benchmark</span>
                    <span style="color:#bc13fe">&#9632; Rolling Sharpe</span>
                </div>
            </div>
            <canvas id="btv2-sharpe-chart" height="280"></canvas>
        </div>
        <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem">
            <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">MONTHLY P&L CALENDAR</div>
            <div id="btv2-calendar" style="display:flex;flex-wrap:wrap;gap:6px"></div>
        </div>
        <div class="glass-card" style="padding:1.5rem">
            <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">RECENT TRADE LOG (Last 50)</div>
            <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:separate;border-spacing:0 4px;font-size:0.75rem">
                    <thead><tr style="color:var(--text-dim)">${['Ticker','Signal','Entry','Exit','Entry $','Exit $','Strat P&L','BTC P&L','Alpha'].map(h => '<th style="text-align:left;padding:6px 10px;font-size:0.6rem;letter-spacing:1px;white-space:nowrap">' + h + '</th>').join('')}</tr></thead>
                    <tbody id="btv2-tbody"><tr><td colspan="9" style="padding:2rem;text-align:center;color:var(--text-dim)">Click RUN BACKTEST to load</td></tr></tbody>
                </table>
            </div>
        </div>
    `;
    loadBacktesterV2();
}

async function loadBacktesterV2() {
    const hold = document.getElementById('btv2-hold') ? document.getElementById('btv2-hold').value : '5';
    ['win-rate','total-trades','total-return','sharpe','max-drawdown','profit-factor','calmar'].forEach(id => {
        const el = document.getElementById('btv2-' + id);
        if (el) el.innerHTML = '<span style="font-size:0.8rem;color:var(--text-dim)">...</span>';
    });
    try {
        const data = await fetchAPI('/backtest-v2?hold=' + hold + '&limit=200');
        if (data.error && !data.trades) { showToast('BACKTESTER', data.error, 'alert'); return; }
        const s = data.stats || {};
        const statMap = {
            'win-rate':      { val: (s.win_rate != null ? s.win_rate + '%' : '--'),        color: (s.win_rate||0) >= 55 ? '#22c55e' : '#ef4444' },
            'total-trades':  { val: s.total_trades != null ? s.total_trades : '--',         color: '#fff' },
            'total-return':  { val: (s.total_return != null ? ((s.total_return>=0?'+':'') + s.total_return + '%') : '--'), color: (s.total_return||0) >= 0 ? '#22c55e' : '#ef4444' },
            'sharpe':        { val: s.sharpe != null ? s.sharpe : '--',                    color: (s.sharpe||0) >= 1 ? '#00d4aa' : (s.sharpe||0) >= 0 ? '#ffd700' : '#ef4444' },
            'max-drawdown':  { val: s.max_drawdown != null ? '-' + s.max_drawdown + '%' : '--', color: '#ef4444' },
            'profit-factor': { val: s.profit_factor != null ? s.profit_factor : '--',      color: (s.profit_factor||0) >= 1.5 ? '#22c55e' : '#ffd700' },
            'calmar':        { val: s.calmar != null ? s.calmar : '--',                    color: (s.calmar||0) >= 1 ? '#00d4aa' : '#ffd700' }
        };
        Object.keys(statMap).forEach(function(id) {
            var item = statMap[id];
            var el = document.getElementById('btv2-' + id);
            if (el) { el.textContent = item.val; el.style.color = item.color; }
        });
        if (data.rolling_sharpe && data.rolling_sharpe.length) renderBtv2Chart(data.rolling_sharpe);
        if (data.monthly_returns) renderBtv2Calendar(data.monthly_returns);
        if (data.trades && data.trades.length) renderBtv2Table(data.trades.slice().reverse());
    } catch(e) {
        showToast('BACKTESTER', 'Failed: ' + e.message, 'alert');
    }
}

function renderBtv2Chart(rolling) {
    var ctx = document.getElementById('btv2-sharpe-chart');
    if (!ctx) return;
    if (ctx._chart) ctx._chart.destroy();
    ctx._chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rolling.map(function(r) { return r.date; }),
            datasets: [
                { label: 'Strategy (%)', data: rolling.map(function(r){return r.strat_cumulative;}), borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)', fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y1' },
                { label: 'BTC (%)', data: rolling.map(function(r){return r.btc_cumulative;}), borderColor: '#f7931a', borderDash: [4,3], fill: false, tension: 0.4, pointRadius: 0, yAxisID: 'y1' },
                { label: 'Rolling Sharpe', data: rolling.map(function(r){return r.sharpe;}), borderColor: '#bc13fe', fill: false, tension: 0.4, pointRadius: 0, yAxisID: 'y2' }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { color: '#9ca3af', font: { size: 10 } } }, tooltip: { backgroundColor: 'rgba(13,17,23,0.95)', borderColor: 'rgba(0,212,170,0.2)', borderWidth: 1 } },
            scales: {
                x: { ticks: { color: '#6b7280', maxTicksLimit: 12, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y1: { position: 'left', ticks: { color: '#9ca3af', font: { size: 10 }, callback: function(v){return v+'%';} }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y2: { position: 'right', ticks: { color: '#bc13fe', font: { size: 10 } }, grid: { display: false } }
            }
        }
    });
}

function renderBtv2Calendar(monthly) {
    var el = document.getElementById('btv2-calendar');
    if (!el) return;
    var sorted = Object.entries(monthly).sort(function(a,b){ return a[0].localeCompare(b[0]); });
    var max = Math.max.apply(null, Object.values(monthly).map(Math.abs).concat([1]));
    el.innerHTML = sorted.map(function(entry) {
        var ym = entry[0], pnl = entry[1];
        var intensity = Math.min(Math.abs(pnl) / max, 1);
        var bg = pnl > 0 ? ('rgba(34,197,94,' + (0.15 + intensity * 0.7) + ')') : ('rgba(239,68,68,' + (0.15 + intensity * 0.7) + ')');
        var parts = ym.split('-');
        var monthName = new Date(+parts[0], +parts[1]-1).toLocaleString('en', {month:'short'});
        return '<div title="' + ym + ': ' + (pnl>=0?'+':'') + pnl + '%" style="background:' + bg + ';border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;min-width:80px;text-align:center;cursor:default;transition:transform 0.15s" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
            '<div style="font-size:0.6rem;color:var(--text-dim);font-weight:700">' + monthName + ' ' + parts[0].slice(2) + '</div>' +
            '<div style="font-size:0.9rem;font-weight:800;color:' + (pnl>=0?'#22c55e':'#ef4444') + ';margin-top:2px">' + (pnl>=0?'+':'') + pnl + '%</div>' +
            '</div>';
    }).join('');
}

function renderBtv2Table(trades) {
    var tbody = document.getElementById('btv2-tbody');
    if (!tbody) return;
    tbody.innerHTML = trades.map(function(t) {
        var pnlColor = t.pnl_pct >= 0 ? '#22c55e' : '#ef4444';
        var btcColor = t.btc_pnl >= 0 ? '#f7931a' : '#ef4444';
        var alpha = +(t.pnl_pct - t.btc_pnl).toFixed(1);
        return '<tr style="background:rgba(255,255,255,0.02)">' +
            '<td style="padding:8px 10px;font-weight:700">' + t.ticker + '</td>' +
            '<td style="padding:8px 10px"><span style="font-size:0.6rem;padding:2px 7px;border-radius:10px;background:rgba(0,212,170,0.1);color:#00d4aa">' + t.signal + '</span></td>' +
            '<td style="padding:8px 10px;color:var(--text-dim)">' + t.entry_date + '</td>' +
            '<td style="padding:8px 10px;color:var(--text-dim)">' + t.exit_date + '</td>' +
            '<td style="padding:8px 10px">$' + t.entry_price.toLocaleString() + '</td>' +
            '<td style="padding:8px 10px">$' + t.exit_price.toLocaleString() + '</td>' +
            '<td style="padding:8px 10px;font-weight:700;color:' + pnlColor + '">' + (t.pnl_pct>=0?'+':'') + t.pnl_pct + '%</td>' +
            '<td style="padding:8px 10px;color:' + btcColor + '">' + (t.btc_pnl>=0?'+':'') + t.btc_pnl + '%</td>' +
            '<td style="padding:8px 10px"><span style="font-size:0.6rem;padding:2px 6px;border-radius:8px;background:' + (alpha>=0?'rgba(0,212,170,0.1)':'rgba(239,68,68,0.1)') + ';color:' + (alpha>=0?'#00d4aa':'#ef4444') + '">' + (alpha>=0?'+':'') + alpha + '% ' + (alpha>=0?'ALPHA':'BETA') + '</span></td>' +
            '</tr>';
    }).join('');
}
