/**
 * Global Closed Signals Breakdown
 * Shows aggregate performance across ALL platform users' closed signals.
 * Route: /global-closed-signals  (view key: 'global-closed-signals')
 * Backend: GET /signal-history?scope=all&state=closed&days=365
 */

async function renderGlobalClosedSignals(tabs) {
    if (!tabs) tabs = window.auditHubTabs || [];

    const CHART_CYAN   = 'rgba(0,242,255,0.9)';
    const CHART_PURPLE = 'rgba(139,92,246,0.85)';
    const CHART_GREEN  = '#22c55e';
    const CHART_RED    = '#ef4444';
    const CHART_AMBER  = '#f59e0b';
    const GRID_COLOR   = 'rgba(255,255,255,0.05)';

    // ---- Skeleton shell ----
    appEl.innerHTML = `
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Platform Intelligence</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">public</span>Global Signal Breakdown <span class="premium-badge">LIVE</span></h1>
                <p style="margin:4px 0 0;font-size:0.78rem;color:var(--text-dim)">Aggregated closed trade performance across all AlphaSignal users &mdash; anonymised.</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <select id="gcs-days" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:6px 12px;border-radius:6px;font-size:0.72rem;font-weight:700;cursor:pointer;">
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">180 Days</option>
                    <option value="365" selected>1 Year</option>
                    <option value="730">All Time</option>
                </select>
                <button id="gcs-export-btn" class="intel-action-btn mini outline" style="width:auto;padding:5px 12px;font-size:0.62rem;display:flex;align-items:center;gap:4px;">
                    <span class="material-symbols-outlined" style="font-size:13px">download</span>CSV
                </button>
            </div>
        </div>
        ${renderHubTabs('global-closed-signals', tabs)}

        <!-- KPI Row -->
        <div id="gcs-kpi-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem">
            ${[0,1,2,3,4,5].map(() => '<div class="glass-card" style="padding:1.2rem"><div class="skeleton-line" style="width:50%;margin-bottom:8px"></div><div class="skeleton-line" style="width:70%;height:28px"></div></div>').join('')}
        </div>

        <!-- Equity Curve + Asset Split row -->
        <div style="display:grid;grid-template-columns:1fr 280px;gap:1.5rem;margin-bottom:1.5rem;align-items:start">
            <div class="glass-card" style="padding:1.5rem">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                    <div>
                        <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:2px">PLATFORM EQUITY CURVE</div>
                        <div style="font-size:0.72rem;color:var(--text-dim)">Cumulative closed-trade P&amp;L across all users</div>
                    </div>
                    <span class="premium-badge" style="font-size:0.45rem;padding:2px 6px">AGGREGATE</span>
                </div>
                <div style="height:260px;position:relative">
                    <canvas id="gcs-equity-chart"></canvas>
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:1rem">ASSET CLASS SPLIT</div>
                <div style="height:200px;position:relative;margin-bottom:1rem">
                    <canvas id="gcs-asset-chart"></canvas>
                </div>
                <div id="gcs-asset-legend" style="display:flex;flex-direction:column;gap:6px;font-size:0.68rem"></div>
            </div>
        </div>

        <!-- Strategy Breakdown + Direction + Monthly -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem;align-items:start">
            <div class="glass-card" style="padding:1.5rem">
                <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:1rem">STRATEGY PERFORMANCE BREAKDOWN</div>
                <div id="gcs-strategy-table-wrap" style="overflow-x:auto">
                    <div class="skeleton-card" style="height:200px"></div>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:1.5rem">
                <div class="glass-card" style="padding:1.5rem">
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:1rem">LONG / SHORT SPLIT</div>
                    <div style="height:160px;position:relative">
                        <canvas id="gcs-direction-chart"></canvas>
                    </div>
                </div>
                <div class="glass-card" style="padding:1.5rem">
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:1rem">MONTHLY WIN RATE</div>
                    <div style="height:140px;position:relative">
                        <canvas id="gcs-monthly-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Performers Table -->
        <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent)">TOP PERFORMING CLOSED SIGNALS</div>
                <div style="display:flex;gap:8px">
                    <button id="gcs-sort-roi" class="intel-action-btn mini" style="font-size:0.58rem;padding:4px 10px">SORT BY ROI</button>
                    <button id="gcs-sort-date" class="intel-action-btn mini outline" style="font-size:0.58rem;padding:4px 10px">SORT BY DATE</button>
                </div>
            </div>
            <div id="gcs-top-table-wrap" style="overflow-x:auto">
                <div class="skeleton-card" style="height:250px"></div>
            </div>
            <div id="gcs-pagination" style="display:flex;justify-content:center;gap:8px;margin-top:1rem"></div>
        </div>
    `;

    // ---- State ----
    let allSignals = [], byType = [], daysFilter = 365;
    let currentSort = 'roi';
    let currentPage = 1;
    const PAGE_SIZE = 20;

    const daysEl = document.getElementById('gcs-days');
    if (daysEl) daysEl.addEventListener('change', () => { daysFilter = parseInt(daysEl.value); currentPage = 1; loadData(); });

    // ---- Data Load ----
    async function loadData() {
        try {
            const d = await fetchAPI('/signal-history?scope=all&state=closed&days=' + daysFilter + '&limit=500&page=1');
            if (!d || !d.signals) return;
            allSignals = d.signals || [];
            byType     = d.by_type || [];
            renderAll(d.stats || {});
        } catch(e) {
            console.error('[GCS] load error', e);
        }
    }

    function renderAll(stats) {
        renderKPIs(stats);
        renderEquityCurve();
        renderAssetBreakdown();
        renderStrategyTable();
        renderDirectionChart();
        renderMonthlyChart();
        renderTopTable();
        wireExport();
    }

    // ---- KPI Row ----
    function renderKPIs(stats) {
        const closed       = stats.closed_count || allSignals.length;
        const wrNum        = stats.win_rate != null ? stats.win_rate : computeWinRateNum();
        const avgRoiNum    = stats.avg_roi  != null ? stats.avg_roi  : computeAvgRoiNum();
        const totalRoi     = allSignals.reduce(function(s, r) { return s + (r.final_roi || r.return || 0); }, 0);
        const best         = allSignals.reduce(function(b, r) { var v = r.final_roi || r.return || 0; return v > b ? v : b; }, -Infinity);
        const uniqueCount  = new Set(allSignals.map(function(r) { return r.ticker; })).size;

        var wrColor  = wrNum  >= 50 ? CHART_GREEN : CHART_RED;
        var roiColor = avgRoiNum >= 0 ? CHART_GREEN : CHART_RED;
        var pnlColor = totalRoi >= 0 ? CHART_GREEN : CHART_RED;

        var kpis = [
            { label: 'TOTAL CLOSED SIGNALS', val: closed.toLocaleString(),                                              color: 'var(--accent)', icon: 'task_alt' },
            { label: 'PLATFORM WIN RATE',     val: wrNum.toFixed(1) + '%',                                              color: wrColor,         icon: 'track_changes' },
            { label: 'AVG CLOSED ROI',        val: (avgRoiNum >= 0 ? '+' : '') + avgRoiNum.toFixed(2) + '%',           color: roiColor,        icon: 'trending_up' },
            { label: 'CUMULATIVE P&amp;L',    val: (totalRoi >= 0 ? '+' : '') + totalRoi.toFixed(1) + '%',             color: pnlColor,        icon: 'workspace_premium' },
            { label: 'BEST SINGLE TRADE',     val: (isFinite(best) ? (best >= 0 ? '+' : '') + best.toFixed(2) : '0') + '%', color: CHART_GREEN, icon: 'emoji_events' },
            { label: 'ASSETS COVERED',        val: uniqueCount.toString(),                                              color: CHART_CYAN,      icon: 'currency_bitcoin' },
        ];

        document.getElementById('gcs-kpi-row').innerHTML = kpis.map(function(k) {
            return '<div class="glass-card" style="padding:1.2rem;text-align:center;transition:transform 0.2s;cursor:default" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'translateY(0)\'">'
                 + '<div style="font-size:1.3rem;margin-bottom:10px;color:' + k.color + '"><span class="material-symbols-outlined">' + k.icon + '</span></div>'
                 + '<div style="font-size:0.52rem;color:var(--text-dim);letter-spacing:1.8px;margin-bottom:6px">' + k.label + '</div>'
                 + '<div style="font-size:1.35rem;font-weight:900;color:' + k.color + '">' + k.val + '</div>'
                 + '</div>';
        }).join('');
    }

    function computeWinRateNum() {
        var closed = allSignals.filter(function(s) { return s.final_roi != null; });
        if (!closed.length) return 0;
        var wins = closed.filter(function(s) { return s.final_roi > 0; }).length;
        return (wins / closed.length) * 100;
    }
    function computeAvgRoiNum() {
        var vals = allSignals.map(function(s) { return s.final_roi || s.return || 0; }).filter(function(v) { return v !== 0; });
        if (!vals.length) return 0;
        return vals.reduce(function(a, b) { return a + b; }, 0) / vals.length;
    }

    // ---- Equity Curve ----
    function renderEquityCurve() {
        var sorted = allSignals.filter(function(s) { return !!s.timestamp; })
            .slice().sort(function(a, b) { return new Date(a.timestamp) - new Date(b.timestamp); });
        if (!sorted.length) return;

        var SAMPLE = 200;
        var step = Math.max(1, Math.floor(sorted.length / SAMPLE));
        var sampled = sorted.filter(function(_, i) { return i % step === 0; });

        var cum = 0;
        var points = sampled.map(function(s) { cum += (s.final_roi || s.return || 0); return +cum.toFixed(2); });
        var labels = sampled.map(function(s) { var d = new Date(s.timestamp); return (d.getMonth()+1) + '/' + d.getDate(); });

        var ctx = document.getElementById('gcs-equity-chart');
        if (!ctx) return;
        if (ctx._gcsChart) { ctx._gcsChart.destroy(); }

        var gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(0,242,255,0.18)');
        gradient.addColorStop(1, 'rgba(0,242,255,0.00)');

        ctx._gcsChart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Cumulative ROI %', data: points, borderColor: CHART_CYAN, borderWidth: 2, pointRadius: 0, tension: 0.35, fill: true, backgroundColor: gradient }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 800, easing: 'easeOutCubic' },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function(c) { return 'Cumulative: ' + (c.parsed.y >= 0 ? '+' : '') + c.parsed.y.toFixed(2) + '%'; } }, backgroundColor: 'rgba(9,12,20,0.95)', borderColor: 'rgba(0,242,255,0.3)', borderWidth: 1, titleColor: '#94a3b8', bodyColor: '#e2e8f0' }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 9 }, maxTicksLimit: 8 }, grid: { color: GRID_COLOR } },
                    y: { ticks: { color: '#94a3b8', font: { size: 9 }, callback: function(v) { return v.toFixed(0) + '%'; } }, grid: { color: GRID_COLOR } }
                }
            }
        });
    }

    // ---- Asset Class Donut ----
    function renderAssetBreakdown() {
        var LAYER1 = { 'BTC-USD':1,'ETH-USD':1,'SOL-USD':1,'BNB-USD':1,'XRP-USD':1,'ADA-USD':1,'DOT-USD':1,'AVAX-USD':1,'LINK-USD':1,'ATOM-USD':1,'NEAR-USD':1,'TRX-USD':1,'TON-USD':1 };
        var DEFI   = { 'AAVE-USD':1,'UNI-USD':1,'CRV-USD':1,'COMP-USD':1,'MKR-USD':1,'SNX-USD':1,'RUNE-USD':1,'INJ-USD':1,'LDO-USD':1,'PENDLE-USD':1 };
        var AI     = { 'FET-USD':1,'RENDER-USD':1,'OCEAN-USD':1,'WLD-USD':1,'TAO-USD':1,'AKT-USD':1 };
        var MEME   = { 'DOGE-USD':1,'SHIB-USD':1,'PEPE-USD':1,'BONK-USD':1,'WIF-USD':1,'FLOKI-USD':1,'BOME-USD':1 };
        var cats   = { 'Layer 1': 0, 'DeFi': 0, 'AI / Infra': 0, 'Memes': 0, 'Other': 0 };
        allSignals.forEach(function(s) {
            var t = s.ticker;
            if (LAYER1[t])      cats['Layer 1']++;
            else if (DEFI[t])   cats['DeFi']++;
            else if (AI[t])     cats['AI / Infra']++;
            else if (MEME[t])   cats['Memes']++;
            else                cats['Other']++;
        });
        var lbl  = Object.keys(cats);
        var vals = Object.values(cats);
        var colors = [CHART_CYAN, CHART_PURPLE, CHART_AMBER, '#ec4899', '#64748b'];

        var ctx = document.getElementById('gcs-asset-chart');
        if (!ctx) return;
        if (ctx._gcsChart) ctx._gcsChart.destroy();
        ctx._gcsChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: lbl, datasets: [{ data: vals, backgroundColor: colors, borderColor: 'rgba(9,12,20,0.8)', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(9,12,20,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#94a3b8', bodyColor: '#e2e8f0' } } }
        });

        var total = vals.reduce(function(a, b) { return a + b; }, 0) || 1;
        var legendEl = document.getElementById('gcs-asset-legend');
        if (legendEl) {
            legendEl.innerHTML = lbl.map(function(l, i) {
                return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'
                     + '<div style="display:flex;align-items:center;gap:6px"><div style="width:8px;height:8px;border-radius:50%;background:' + colors[i] + ';flex-shrink:0"></div><span style="color:var(--text-dim);font-size:0.68rem">' + l + '</span></div>'
                     + '<span style="font-weight:700;color:var(--text);font-size:0.7rem">' + ((vals[i]/total)*100).toFixed(0) + '%</span>'
                     + '</div>';
            }).join('');
        }
    }

    // ---- Strategy Table ----
    function renderStrategyTable() {
        var wrap = document.getElementById('gcs-strategy-table-wrap');
        if (!wrap) return;

        var rows = [];
        if (byType && byType.length > 0) {
            rows = byType.map(function(t) {
                return { type: t.type || t.effective_type || 'Unknown', wins: t.wins || 0, losses: t.losses || 0, closed: t.closed || (t.wins + t.losses), active: t.active || 0, avg_roi: t.avg_roi != null ? parseFloat(t.avg_roi) : null };
            });
        } else {
            var map = {};
            allSignals.forEach(function(s) {
                var t = s.type || 'UNKNOWN';
                if (!map[t]) map[t] = { type: t, wins: 0, losses: 0, closed: 0, rois: [] };
                var roi = s.final_roi || s.return || 0;
                if (roi > 0) map[t].wins++;
                else if (roi < 0) map[t].losses++;
                map[t].closed++;
                if (roi !== 0) map[t].rois.push(roi);
            });
            rows = Object.values(map).map(function(r) {
                var avg = r.rois.length ? r.rois.reduce(function(a,b){return a+b;},0)/r.rois.length : null;
                return { type: r.type, wins: r.wins, losses: r.losses, closed: r.closed, active: 0, avg_roi: avg };
            });
        }

        rows.sort(function(a, b) { return (b.avg_roi || -999) - (a.avg_roi || -999); });

        var th = ['Strategy','Trades','Win Rate','Avg ROI','Active'].map(function(h) {
            return '<th style="padding:6px 10px;text-align:left;color:var(--text-dim);font-weight:700;font-size:0.58rem;letter-spacing:1.2px;white-space:nowrap">' + h + '</th>';
        }).join('');

        var tb = rows.slice(0, 12).map(function(r) {
            var wr_pct = r.closed > 0 ? (r.wins / r.closed) : 0;
            var wr_str = r.closed > 0 ? (wr_pct * 100).toFixed(0) + '%' : '&mdash;';
            var roi_color = r.avg_roi == null ? 'var(--text-dim)' : r.avg_roi >= 0 ? CHART_GREEN : CHART_RED;
            var roi_str   = r.avg_roi != null ? (r.avg_roi >= 0 ? '+' : '') + r.avg_roi.toFixed(2) + '%' : '&mdash;';
            var bar_pct   = (wr_pct * 100).toFixed(0);
            return '<tr style="border-bottom:1px solid rgba(255,255,255,0.03);transition:background 0.15s" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">'
                 + '<td style="padding:7px 10px;font-weight:700;color:var(--text)">' + r.type.replace(/_/g,' ') + '</td>'
                 + '<td style="padding:7px 10px;color:var(--text-dim)">' + r.closed + '</td>'
                 + '<td style="padding:7px 10px"><div style="display:flex;align-items:center;gap:6px"><div style="width:50px;height:4px;border-radius:100px;background:rgba(255,255,255,0.07);overflow:hidden"><div style="width:' + bar_pct + '%;height:100%;background:' + (wr_pct>=0.5?CHART_GREEN:CHART_RED) + ';border-radius:100px"></div></div><span style="color:' + (wr_pct>=0.5?CHART_GREEN:CHART_RED) + ';font-weight:700">' + wr_str + '</span></div></td>'
                 + '<td style="padding:7px 10px;font-weight:900;color:' + roi_color + '">' + roi_str + '</td>'
                 + '<td style="padding:7px 10px;color:var(--text-dim)">' + (r.active || 0) + '</td>'
                 + '</tr>';
        }).join('');

        wrap.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:0.72rem"><thead><tr style="border-bottom:1px solid var(--border)">' + th + '</tr></thead><tbody>' + tb + '</tbody></table>';
    }

    // ---- Direction Bar Chart ----
    function renderDirectionChart() {
        var longs  = allSignals.filter(function(s) { return s.direction === 'LONG'; }).length;
        var shorts = allSignals.filter(function(s) { return s.direction === 'SHORT'; }).length;
        var ctx = document.getElementById('gcs-direction-chart');
        if (!ctx) return;
        if (ctx._gcsChart) ctx._gcsChart.destroy();
        ctx._gcsChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['LONG','SHORT'], datasets: [{ data: [longs, shorts], backgroundColor: [CHART_GREEN+'cc', CHART_RED+'cc'], borderColor: [CHART_GREEN, CHART_RED], borderWidth: 1, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, animation: { duration: 600 }, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(9,12,20,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#94a3b8', bodyColor: '#e2e8f0' } }, scales: { x: { ticks: { color: '#94a3b8', font: { size: 10, weight: '700' } }, grid: { display: false } }, y: { ticks: { color: '#94a3b8', font: { size: 9 } }, grid: { color: GRID_COLOR } } } }
        });
    }

    // ---- Monthly Win Rate ----
    function renderMonthlyChart() {
        var months = {};
        allSignals.forEach(function(s) {
            if (!s.timestamp) return;
            var d = new Date(s.timestamp);
            var key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
            if (!months[key]) months[key] = { wins: 0, total: 0 };
            months[key].total++;
            if ((s.final_roi || s.return || 0) > 0) months[key].wins++;
        });
        var MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var keys   = Object.keys(months).sort().slice(-9);
        var labels = keys.map(function(k) { var p = k.split('-'); return MONTH_NAMES[parseInt(p[1])-1] + ' ' + p[0].slice(2); });
        var data   = keys.map(function(k) { return months[k].total > 0 ? +((months[k].wins / months[k].total) * 100).toFixed(1) : 0; });

        var ctx = document.getElementById('gcs-monthly-chart');
        if (!ctx) return;
        if (ctx._gcsChart) ctx._gcsChart.destroy();
        ctx._gcsChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: [{ data: data, backgroundColor: data.map(function(v) { return v >= 50 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'; }), borderColor: data.map(function(v) { return v >= 50 ? CHART_GREEN : CHART_RED; }), borderWidth: 1, borderRadius: 3 }] },
            options: { responsive: true, maintainAspectRatio: false, animation: { duration: 600 }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c) { return 'Win rate: ' + c.parsed.y + '%'; } }, backgroundColor: 'rgba(9,12,20,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#94a3b8', bodyColor: '#e2e8f0' } }, scales: { x: { ticks: { color: '#94a3b8', font: { size: 8 }, maxRotation: 45 }, grid: { display: false } }, y: { min: 0, max: 100, ticks: { color: '#94a3b8', font: { size: 9 }, callback: function(v) { return v + '%'; } }, grid: { color: GRID_COLOR } } } }
        });
    }

    // ---- Top Performers Table ----
    function renderTopTable() {
        var wrap   = document.getElementById('gcs-top-table-wrap');
        var pagDiv = document.getElementById('gcs-pagination');
        if (!wrap) return;

        var sorted = allSignals.slice().sort(function(a, b) {
            if (currentSort === 'roi') return (b.final_roi || b.return || 0) - (a.final_roi || a.return || 0);
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        var total = sorted.length;
        var pages = Math.ceil(total / PAGE_SIZE);
        var slice = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

        function stateColor(st) {
            var map = { 'HIT_TP2': CHART_GREEN, 'HIT_TP1': '#86efac', 'CLOSED': '#94a3b8', 'STOPPED': CHART_RED, 'ACTIVE': CHART_CYAN };
            return map[st] || '#94a3b8';
        }
        function dirIcon(d) {
            if (d === 'LONG')  return '<span style="color:' + CHART_GREEN + ';font-weight:900;font-size:0.6rem">▲ L</span>';
            return '<span style="color:' + CHART_RED + ';font-weight:900;font-size:0.6rem">▼ S</span>';
        }

        var th = ['Ticker','Strategy','Dir','Entry','Exit','ROI','State','Date','Trader'].map(function(h) {
            return '<th style="padding:6px 10px;text-align:left;color:var(--text-dim);font-weight:700;font-size:0.58rem;letter-spacing:1.2px;white-space:nowrap">' + h + '</th>';
        }).join('');

        var tb = slice.map(function(s) {
            var roi     = s.final_roi != null ? s.final_roi : (s.return || 0);
            var rColor  = roi >= 0 ? CHART_GREEN : CHART_RED;
            var rStr    = (roi >= 0 ? '+' : '') + roi.toFixed(2) + '%';
            var dateFmt = s.closed_at || s.timestamp;
            var dateStr = dateFmt ? new Date(dateFmt).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'2-digit'}) : '&mdash;';
            var entryStr = s.entry   ? '$' + Number(s.entry).toLocaleString('en',{maximumFractionDigits:4})     : '&mdash;';
            var exitStr  = s.exit_price ? '$' + Number(s.exit_price).toLocaleString('en',{maximumFractionDigits:4}) : '&mdash;';
            return '<tr style="border-bottom:1px solid rgba(255,255,255,0.03);transition:background 0.15s" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">'
                 + '<td style="padding:7px 10px;font-weight:900;color:var(--accent)">' + s.ticker + '</td>'
                 + '<td style="padding:7px 10px;color:var(--text);font-size:0.65rem">' + (s.type||'').replace(/_/g,' ') + '</td>'
                 + '<td style="padding:7px 10px">' + dirIcon(s.direction) + '</td>'
                 + '<td style="padding:7px 10px;color:var(--text-dim)">' + entryStr + '</td>'
                 + '<td style="padding:7px 10px;color:var(--text-dim)">' + exitStr + '</td>'
                 + '<td style="padding:7px 10px;font-weight:900;color:' + rColor + '">' + rStr + '</td>'
                 + '<td style="padding:7px 10px"><span style="font-size:0.58rem;font-weight:700;color:' + stateColor(s.state) + ';letter-spacing:0.5px">' + (s.state||'&mdash;') + '</span></td>'
                 + '<td style="padding:7px 10px;color:var(--text-dim);font-size:0.65rem">' + dateStr + '</td>'
                 + '<td style="padding:7px 10px;color:var(--text-dim);font-size:0.62rem">' + (s.trader || 'an***') + '</td>'
                 + '</tr>';
        }).join('');

        wrap.innerHTML = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.72rem;min-width:700px"><thead><tr style="border-bottom:1px solid var(--border)">' + th + '</tr></thead><tbody>' + tb + '</tbody></table><div style="text-align:center;margin-top:8px;font-size:0.65rem;color:var(--text-dim)">Showing ' + slice.length + ' of ' + total + ' closed signals &nbsp;&middot;&nbsp; Trader identities anonymised</div></div>';

        if (pagDiv) {
            if (pages <= 1) { pagDiv.innerHTML = ''; return; }
            var btns = '';
            var maxShow = Math.min(pages, 8);
            for (var p = 1; p <= maxShow; p++) {
                var isActive = p === currentPage;
                btns += '<button onclick="window._gcsPaginate(' + p + ')" style="padding:4px 10px;border-radius:6px;font-size:0.65rem;font-weight:700;cursor:pointer;border:1px solid ' + (isActive?'rgba(0,242,255,0.5)':'var(--border)') + ';background:' + (isActive?'rgba(0,242,255,0.1)':'transparent') + ';color:' + (isActive?'var(--accent)':'var(--text-dim)') + '">' + p + '</button>';
            }
            if (pages > 8) btns += '<span style="color:var(--text-dim);font-size:0.65rem;align-self:center">&hellip; ' + pages + ' pages</span>';
            pagDiv.innerHTML = btns;
        }
    }

    window._gcsPaginate = function(p) { currentPage = p; renderTopTable(); };

    // Sort buttons
    var sortRoiBtn  = document.getElementById('gcs-sort-roi');
    var sortDateBtn = document.getElementById('gcs-sort-date');
    if (sortRoiBtn) sortRoiBtn.addEventListener('click', function() {
        currentSort = 'roi'; currentPage = 1;
        sortRoiBtn.classList.remove('outline'); sortDateBtn.classList.add('outline');
        renderTopTable();
    });
    if (sortDateBtn) sortDateBtn.addEventListener('click', function() {
        currentSort = 'date'; currentPage = 1;
        sortDateBtn.classList.remove('outline'); sortRoiBtn.classList.add('outline');
        renderTopTable();
    });

    // ---- CSV Export ----
    function wireExport() {
        var btn = document.getElementById('gcs-export-btn');
        if (!btn) return;
        btn.addEventListener('click', function() {
            var url = '/export?type=signals&scope=all&state=closed&days=' + daysFilter;
            var a = document.createElement('a');
            a.href = url;
            a.download = 'alphasignal_global_closed_' + new Date().toISOString().slice(0,10) + '.csv';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });
    }

    // ---- Kick off ----
    await loadData();
}

window.renderGlobalClosedSignals = renderGlobalClosedSignals;
