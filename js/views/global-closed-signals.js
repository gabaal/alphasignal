/**
 * Global Closed Signals Breakdown
 * Shows institutional aggregate performance across ALL terminal users.
 * Route: /global-closed-signals (view key: 'global-closed-signals')
 * Backend: GET /api/signal-history?scope=all&state=closed
 */

async function renderGlobalClosedSignals(tabs) {
    if (!tabs) tabs = window.auditHubTabs || [];

    const CHART_CYAN   = '#00f2ff';
    const CHART_GREEN  = '#22c55e';
    const CHART_RED    = '#ef4444';
    const CHART_AMBER  = '#eab308';
    const GRID_COLOR   = 'rgba(255,255,255,0.05)';

    // ---- Skeleton Shell ----
    appEl.innerHTML = `
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:1rem">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Platform Intelligence</h2>
                <h1 style="display:flex;align-items:center;gap:8px;margin:0">
                    <span class="material-symbols-outlined" style="color:var(--accent);font-size:1.6rem">public</span>
                    Global Closed Signals
                    <span class="premium-badge">LIVE</span>
                    <span style="font-size:0.55rem;background:rgba(0,242,255,0.12);color:var(--accent);border:1px solid rgba(0,242,255,0.3);padding:2px 8px;border-radius:12px;letter-spacing:1px;font-weight:800">ALL USERS</span>
                </h1>
                <p style="margin:6px 0 0;font-size:0.78rem;color:var(--text-dim)">Aggregated performance breakdown across all terminal users (53,000+ closed trades) &mdash; trader emails anonymised.</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <select id="gcs-days" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:7px 12px;border-radius:6px;font-size:0.72rem;font-weight:700;cursor:pointer;">
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="180">Last 180 Days</option>
                    <option value="365">Last 1 Year</option>
                    <option value="3650" selected>All Time (10Y)</option>
                </select>
                <a id="gcs-export-all-btn" href="/api/export?type=signals&scope=all&state=closed&days=3650" download class="btv2-export-btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                    <span class="material-symbols-outlined" style="font-size:13px">file_download</span> EXPORT ALL CSV
                </a>
            </div>
        </div>

        ${typeof renderHubTabs === 'function' ? renderHubTabs('global-closed-signals', tabs) : ''}

        <!-- 6 KPI Row -->
        <div id="gcs-kpi-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:1.5rem">
            ${[0,1,2,3,4,5].map(() => '<div class="glass-card" style="padding:1.2rem;text-align:center"><div class="skeleton-line" style="width:50%;margin:0 auto 8px"></div><div class="skeleton-line" style="width:70%;height:28px;margin:0 auto"></div></div>').join('')}
        </div>

        <!-- Strategy Performance Breakdown Table (from Screenshot 1) -->
        <div class="card" style="margin-bottom:1.5rem;overflow-x:auto">
            <style>
                .gcs-sortable-th:hover { background: rgba(255,255,255,0.05); }
            </style>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;flex-wrap:wrap;gap:10px">
                <div style="display:flex;align-items:center;gap:10px">
                    <span class="material-symbols-outlined" style="color:var(--accent);font-size:1.3rem">bar_chart</span>
                    <div>
                        <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim)">STRATEGY PERFORMANCE BREAKDOWN</div>
                        <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">All-time win rate and avg return by signal type &middot; <span style="color:var(--accent)">ALL PLATFORM USERS (53,000+ TRADES)</span> &middot; Click columns to sort</div>
                    </div>
                </div>
            </div>
            <div id="gcs-strategy-table-wrap">
                <div class="skeleton-card" style="height:200px"></div>
            </div>
        </div>

        <!-- Cumulative PnL Curve + Summary Box (from Screenshot 1) -->
        <div class="card" style="margin-bottom:1.5rem;padding:1.5rem;display:flex;flex-direction:row;gap:20px;min-height:280px;flex-wrap:wrap">
            <div style="flex:1;display:flex;flex-direction:column;min-width:280px">
                <div style="margin-bottom:10px">
                    <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim)">CUMULATIVE PNL CURVE</div>
                    <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">All-time cumulative return &middot; <span style="color:var(--accent)">closed signals only (All Platform Users)</span></div>
                    <div style="display:flex;gap:14px;align-items:center;margin-top:6px;font-size:0.6rem;font-family:monospace;letter-spacing:0.5px">
                        <span style="display:inline-flex;align-items:center;gap:4px;color:#00f2ff"><span style="width:8px;height:2px;background:#00f2ff;border-radius:1px;display:inline-block"></span> Cumulative P&L</span>
                        <span style="display:inline-flex;align-items:center;gap:4px;color:#eab308"><span style="width:8px;height:2px;background:#eab308;border-top:1px dashed #eab308;display:inline-block"></span> 30D Win Rate</span>
                        <span style="display:inline-flex;align-items:center;gap:4px;color:#ef4444"><span style="width:8px;height:2px;background:#ef4444;border-radius:1px;display:inline-block"></span> Drawdown</span>
                    </div>
                </div>
                <div style="flex:1;position:relative;width:100%;min-height:210px">
                    <canvas id="gcs-equity-canvas"></canvas>
                </div>
            </div>
            <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;text-align:right" id="gcs-equity-summary">
                <span style="font-size:2rem;font-weight:900;color:var(--accent);letter-spacing:-0.5px;font-family:var(--font-mono, monospace)">--%</span>
                <div style="font-size:0.6rem;color:var(--text-dim);margin-top:2px;letter-spacing:1px">-- CLOSED SIGNALS</div>
            </div>
        </div>

        <!-- Bottom Row: Asset Class Distribution + Execution Heatmap (from Screenshot 1) -->
        <div style="margin-bottom:1.5rem;display:grid;grid-template-columns:repeat(auto-fit, minmax(350px, 1fr));gap:1.5rem">
            <!-- Asset Distribution -->
            <div class="card" style="padding:1.5rem;height:350px;position:relative;display:flex;flex-direction:column">
                <div style="margin-bottom:1rem">
                    <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim)">P&amp;L BY ASSET CLASS</div>
                    <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">Top performances across all users &middot; <span style="color:var(--accent)">closed signals only</span></div>
                </div>
                <div style="flex:1;position:relative;width:100%;min-height:220px">
                    <canvas id="gcs-asset-canvas"></canvas>
                </div>
            </div>

            <!-- Execution Heatmap -->
            <div class="card" style="padding:1.5rem;height:350px;position:relative;display:flex;flex-direction:column">
                <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:flex-end">
                    <div>
                        <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim)">EXECUTION HEATMAP</div>
                        <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">Avg P&amp;L by Global Hour &amp; Day (All Users)</div>
                    </div>
                    <div style="display:flex;gap:4px;align-items:center;font-size:0.5rem;color:var(--text-dim);padding-bottom:2px">
                        <span style="background:rgba(239, 68, 68, 0.4);width:8px;height:8px;border-radius:2px"></span> NEG
                        <span style="background:rgba(0, 242, 255, 0.4);width:8px;height:8px;border-radius:2px;margin-left:4px"></span> POS
                    </div>
                </div>
                <div id="gcs-heatmap-container" style="flex:1;display:flex;flex-direction:column;width:100%;overflow:hidden">
                    <!-- Rendered via JS -->
                </div>
            </div>
        </div>

        <!-- Closed Trades Ledger Feed (All Users) -->
        <div class="card" style="padding:1.5rem;margin-bottom:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;flex-wrap:wrap;gap:10px">
                <div>
                    <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--accent)">CLOSED SIGNALS TRADE FEED &bull; ALL USERS</div>
                    <div id="gcs-feed-sub" style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">Live multi-user closed executions ledger</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <input type="text" id="gcs-filter-ticker" placeholder="FILTER TICKER…" style="background:var(--bg-input);border:1px solid var(--border);color:var(--text);padding:5px 10px;border-radius:6px;font-size:0.7rem;width:120px;font-family:monospace">
                    <button id="gcs-sort-roi" class="intel-action-btn mini" style="font-size:0.58rem;padding:5px 10px">SORT BY ROI</button>
                    <button id="gcs-sort-date" class="intel-action-btn mini outline" style="font-size:0.58rem;padding:5px 10px">SORT BY DATE</button>
                    <button id="gcs-export-page-btn" class="btv2-export-btn" style="padding:4px 10px;font-size:0.65rem">
                        <span class="material-symbols-outlined" style="font-size:12px">download</span> PAGE CSV
                    </button>
                </div>
            </div>
            <div id="gcs-table-container" style="overflow-x:auto">
                <div class="skeleton-card" style="height:250px"></div>
            </div>
            <div id="gcs-pagination-controls" style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:1.2rem"></div>
        </div>
    `;

    // ---- State Variables ----
    let currentDays = 3650;
    let currentPage = 1;
    let currentSortCol = 'date';
    let currentSortDir = 'desc';
    let filterTicker = '';
    let cachedPageData = [];
    let cachedSummary = {};

    // Chart instances
    let equityChartInstance = null;
    let assetChartInstance = null;

    // ---- Event Listeners ----
    const daysSelect = document.getElementById('gcs-days');
    if (daysSelect) {
        daysSelect.addEventListener('change', () => {
            currentDays = parseInt(daysSelect.value) || 3650;
            currentPage = 1;
            const expBtn = document.getElementById('gcs-export-all-btn');
            if (expBtn) expBtn.href = `/api/export?type=signals&scope=all&state=closed&days=${currentDays}`;
            loadGlobalData();
        });
    }

    const tickerInput = document.getElementById('gcs-filter-ticker');
    if (tickerInput) {
        let debounceTimer = null;
        tickerInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                filterTicker = tickerInput.value.trim().toUpperCase();
                currentPage = 1;
                loadGlobalData();
            }, 300);
        });
    }

    const sortRoiBtn = document.getElementById('gcs-sort-roi');
    const sortDateBtn = document.getElementById('gcs-sort-date');
    if (sortRoiBtn) {
        sortRoiBtn.addEventListener('click', () => {
            currentSortCol = 'return';
            currentSortDir = 'desc';
            sortRoiBtn.classList.remove('outline');
            sortDateBtn?.classList.add('outline');
            loadGlobalData();
        });
    }
    if (sortDateBtn) {
        sortDateBtn.addEventListener('click', () => {
            currentSortCol = 'date';
            currentSortDir = 'desc';
            sortDateBtn.classList.remove('outline');
            sortRoiBtn?.classList.add('outline');
            loadGlobalData();
        });
    }

    const expPageBtn = document.getElementById('gcs-export-page-btn');
    if (expPageBtn) {
        expPageBtn.addEventListener('click', () => {
            if (!cachedPageData || !cachedPageData.length) {
                if (typeof showToast === 'function') showToast('EXPORT', 'No page data to export.', 'warning');
                return;
            }
            if (typeof exportCSV === 'function') {
                exportCSV(cachedPageData, `alphasignal_global_closed_page_${new Date().toISOString().split('T')[0]}.csv`);
            } else {
                window.open(`/api/export?type=signals&scope=all&state=closed&days=${currentDays}`);
            }
        });
    }

    // ---- Data Fetcher ----
    async function loadGlobalData() {
        try {
            let url = `/signal-history?scope=all&state=closed&days=${currentDays}&page=${currentPage}&limit=25`;
            if (filterTicker) url += `&ticker=${encodeURIComponent(filterTicker)}`;
            if (currentSortCol) url += `&sort_col=${currentSortCol}&sort_dir=${currentSortDir}`;

            const res = await fetchAPI(url);
            if (!res) {
                console.error('[Global Signals] Null response from API');
                return;
            }

            const data = res.data || [];
            const summ = res.summary || {};
            const pageInfo = res.pagination || { page: currentPage, pages: 1, total: data.length };

            cachedPageData = data;
            cachedSummary = summ;

            renderKPIs(summ, data);
            renderStrategyBreakdown(summ.by_type || {});
            renderEquityCurve(summ.pnl_curve || [], summ);
            renderAssetDistribution(summ.by_ticker || []);
            renderExecutionHeatmap(summ.heatmap_data || []);
            renderTradeTable(data, pageInfo);
        } catch (err) {
            console.error('[Global Signals] loadGlobalData error:', err);
        }
    }

    // ---- 1. KPI Cards ----
    function renderKPIs(summ, pageData) {
        const kpiRow = document.getElementById('gcs-kpi-row');
        if (!kpiRow) return;

        const totalClosed = summ.closed ?? summ.total ?? 0;
        const wins = summ.wins ?? 0;
        const losses = summ.losses ?? 0;
        const decided = wins + losses;
        const winRate = decided > 0 ? ((wins / decided) * 100).toFixed(1) + '%' : '--';
        const avgRoi = summ.avg_roi != null ? (summ.avg_roi >= 0 ? '+' : '') + summ.avg_roi.toFixed(2) + '%' : '--';
        const sharpe = summ.sharpe != null ? summ.sharpe.toFixed(2) : '--';
        const pf = summ.profit_factor != null ? summ.profit_factor.toFixed(2) : '--';

        let cumRoi = 0;
        if (summ.pnl_curve && summ.pnl_curve.length) {
            cumRoi = summ.pnl_curve.reduce((s, p) => s + (p.roi || 0), 0);
        }
        const cumRoiStr = (cumRoi >= 0 ? '+' : '') + cumRoi.toFixed(1) + '%';

        const kpis = [
            { label: 'TOTAL CLOSED TRADES', val: totalClosed.toLocaleString(), color: 'var(--accent)', icon: 'lock' },
            { label: 'PLATFORM WIN RATE', val: winRate, color: parseFloat(winRate) >= 50 ? CHART_GREEN : CHART_RED, icon: 'track_changes' },
            { label: 'AVG CLOSED ROI', val: avgRoi, color: (summ.avg_roi || 0) >= 0 ? CHART_GREEN : CHART_RED, icon: 'trending_up' },
            { label: 'CUMULATIVE P&L', val: cumRoiStr, color: cumRoi >= 0 ? CHART_GREEN : CHART_RED, icon: 'workspace_premium' },
            { label: 'SHARPE RATIO', val: sharpe, color: parseFloat(sharpe) >= 1.5 ? CHART_GREEN : 'var(--text-main)', icon: 'show_chart' },
            { label: 'PROFIT FACTOR', val: pf, color: parseFloat(pf) >= 1.5 ? CHART_GREEN : 'var(--text-main)', icon: 'calculate' },
        ];

        kpiRow.innerHTML = kpis.map(k => `
            <div class="glass-card" style="padding:1.1rem;text-align:center;transition:transform 0.2s">
                <div style="font-size:1.3rem;margin-bottom:8px;color:${k.color}">
                    <span class="material-symbols-outlined">${k.icon}</span>
                </div>
                <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.8px;color:var(--text-dim);margin-bottom:5px">${k.label}</div>
                <div style="font-size:1.35rem;font-weight:900;color:${k.color};font-family:var(--font-mono, monospace)">${k.val}</div>
            </div>
        `).join('');
    }

    // ---- 2. Strategy Performance Breakdown Table ----
    function renderStrategyBreakdown(byTypeMap) {
        const wrap = document.getElementById('gcs-strategy-table-wrap');
        if (!wrap) return;

        const entries = Object.entries(byTypeMap || {});
        if (!entries.length) {
            wrap.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.8rem">No strategy breakdown records available for this filter.</div>`;
            return;
        }

        let totalWins = 0, totalLosses = 0, totalClosed = 0, totalActive = 0, totalRoiSum = 0, totalRoiCount = 0;

        const rows = entries
            .filter(([type]) => !type.includes('FUNDING') && !type.includes('DEPEG') && !type.includes('CME_GAP'))
            .sort((a, b) => ((b[1].wins || 0) + (b[1].losses || 0)) - ((a[1].wins || 0) + (a[1].losses || 0)))
            .map(([type, s]) => {
                const wins   = s.wins || 0;
                const losses = s.losses || 0;
                const closed = s.closed || (wins + losses);
                const active = s.active || 0;
                const avgRoi = s.avg_roi != null ? parseFloat(s.avg_roi) : null;

                totalWins   += wins;
                totalLosses += losses;
                totalClosed += closed;
                totalActive += active;
                if (avgRoi != null && closed > 0) {
                    totalRoiSum += (avgRoi * closed);
                    totalRoiCount += closed;
                }

                const decided = wins + losses;
                const winRateN = decided > 0 ? (wins / decided) * 100 : null;
                const winRateStr = winRateN != null ? winRateN.toFixed(0) + '%' : '--';
                const wrColor = winRateN != null ? (winRateN >= 55 ? CHART_GREEN : winRateN >= 45 ? CHART_AMBER : CHART_RED) : 'var(--text-dim)';
                const roiColor = avgRoi != null ? (avgRoi >= 0 ? CHART_GREEN : CHART_RED) : 'var(--text-dim)';
                const roiStr = avgRoi != null ? (avgRoi >= 0 ? '+' : '') + avgRoi.toFixed(2) + '%' : '--';

                const isBull = type.includes('LONG');
                const isBear = type.includes('SHORT');
                const badge = isBull
                    ? '<span style="font-size:0.5rem;background:rgba(34,197,94,0.12);color:#22c55e;padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:middle">LONG</span>'
                    : isBear
                        ? '<span style="font-size:0.5rem;background:rgba(239,68,68,0.12);color:#ef4444;padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:middle">SHORT</span>'
                        : '<span style="font-size:0.5rem;background:rgba(139,92,246,0.12);color:#a78bfa;padding:2px 6px;border-radius:4px;margin-left:6px;vertical-align:middle">DUAL</span>';

                const cleanType = type.replace(/_LONG|_SHORT/g, '').replace(/_/g, ' ');

                return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background=''">
                        <td style="padding:12px 14px;font-weight:700;font-size:0.85rem;white-space:nowrap">
                            <span style="color:var(--text)">${cleanType}</span>${badge}
                        </td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:#22c55e;font-family:monospace;font-size:1rem">${wins.toLocaleString()}</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:#ef4444;font-family:monospace;font-size:1rem">${losses.toLocaleString()}</td>
                        <td style="padding:12px 14px;text-align:center;color:#94a3b8;font-family:monospace;font-size:0.95rem">${closed.toLocaleString()}</td>
                        <td style="padding:12px 14px;text-align:center;color:#60a5fa;font-family:monospace;font-size:0.95rem">${active.toLocaleString()}</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:700;color:${roiColor};font-family:monospace;font-size:0.95rem">${roiStr}</td>
                        <td style="padding:12px 14px;text-align:center">
                            <span style="font-weight:900;font-size:1rem;color:${wrColor};font-family:monospace">${winRateStr}</span>
                            ${decided > 0 ? `<div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px">${decided.toLocaleString()} decided</div>` : ''}
                        </td>
                    </tr>
                `;
            }).join('');

        const tDecided = totalWins + totalLosses;
        const tWinRate = tDecided > 0 ? ((totalWins / tDecided) * 100).toFixed(0) + '%' : '--';
        const tAvgRoiStr = totalRoiCount > 0 ? ((totalRoiSum / totalRoiCount) >= 0 ? '+' : '') + (totalRoiSum / totalRoiCount).toFixed(2) + '%' : '--';
        const tAvgColor = totalRoiCount > 0 ? ((totalRoiSum / totalRoiCount) >= 0 ? CHART_GREEN : CHART_RED) : 'var(--text-dim)';
        const tWrColor = tDecided > 0 ? (((totalWins / tDecided) * 100) >= 50 ? CHART_GREEN : CHART_RED) : 'var(--text-dim)';

        wrap.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:650px">
                <thead>
                    <tr style="border-bottom:2px solid rgba(255,255,255,0.12)">
                        <th style="text-align:left;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">SIGNAL TYPE</th>
                        <th style="text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:#22c55e">WINS</th>
                        <th style="text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:#ef4444">LOSSES</th>
                        <th style="text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:#94a3b8">CLOSED</th>
                        <th style="text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:#60a5fa">ACTIVE</th>
                        <th style="text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">AVG RETURN</th>
                        <th style="text-align:center;padding:10px 14px;font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim)">WIN RATE</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                    <tr style="border-top:2px solid rgba(0,242,255,0.2);background:rgba(0,242,255,0.02)">
                        <td style="padding:12px 14px;font-weight:900;font-size:0.85rem;color:var(--text);letter-spacing:1px">OVERALL TOTALS</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:#22c55e;font-family:monospace;font-size:1.1rem">${totalWins.toLocaleString()}</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:#ef4444;font-family:monospace;font-size:1.1rem">${totalLosses.toLocaleString()}</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:#94a3b8;font-family:monospace;font-size:1.05rem">${totalClosed.toLocaleString()}</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:#60a5fa;font-family:monospace;font-size:1.05rem">${totalActive.toLocaleString()}</td>
                        <td style="padding:12px 14px;text-align:center;font-weight:900;color:${tAvgColor};font-family:monospace;font-size:1.05rem">${tAvgRoiStr}</td>
                        <td style="padding:12px 14px;text-align:center">
                            <span style="font-weight:900;font-size:1.1rem;color:${tWrColor};font-family:monospace">${tWinRate}</span>
                            ${tDecided > 0 ? `<div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px">${tDecided.toLocaleString()} decided</div>` : ''}
                        </td>
                    </tr>
                </tfoot>
            </table>
        `;
    }

    // ---- 3. Cumulative PnL Curve Chart ----
    function renderEquityCurve(pnlSeries, summ) {
        const ctx = document.getElementById('gcs-equity-canvas');
        const summaryBox = document.getElementById('gcs-equity-summary');
        if (!ctx) return;

        if (!pnlSeries || !pnlSeries.length) {
            if (summaryBox) summaryBox.innerHTML = `<span style="font-size:1.8rem;font-weight:900;color:var(--text-dim)">--%</span>`;
            return;
        }

        let cumulative = 0;
        let peak = -Infinity;
        const labels = [];
        const dataPoints = [];
        const drawdownPoints = [];
        const winRatePoints = [];
        const recentOutcomes = [];

        pnlSeries.forEach(point => {
            cumulative += point.roi;
            if (cumulative > peak) peak = cumulative;
            const dd = Math.min(0, cumulative - peak);

            recentOutcomes.push(point.roi > 0 ? 1 : 0);
            if (recentOutcomes.length > 30) recentOutcomes.shift();
            const wr = recentOutcomes.length > 0 ? (recentOutcomes.reduce((a, b) => a + b, 0) / recentOutcomes.length) * 100 : 0;

            const dt = new Date(point.date);
            labels.push(dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
            dataPoints.push(cumulative.toFixed(2));
            drawdownPoints.push(dd.toFixed(2));
            winRatePoints.push(wr.toFixed(2));
        });

        // Update Right Summary Block (matches Screenshot 1)
        if (summaryBox) {
            const isUp = cumulative >= 0;
            const cumStr = (isUp ? '+' : '') + cumulative.toFixed(2) + '%';
            const closedCnt = (summ.closed || pnlSeries.length).toLocaleString();
            const sharpeVal = summ.sharpe != null ? summ.sharpe : '--';
            const pfVal = summ.profit_factor != null ? summ.profit_factor : '--';
            const maxDdVal = summ.max_drawdown != null ? (summ.max_drawdown > 0 ? -summ.max_drawdown : summ.max_drawdown) + '%' : '--';
            const winRateVal = (summ.wins && summ.losses) ? Math.round((summ.wins / (summ.wins + summ.losses)) * 100) + '%' : '--';

            summaryBox.innerHTML = `
                <span style="font-size:1.85rem;font-weight:900;color:${isUp ? '#00f2ff' : '#ef4444'};letter-spacing:-0.5px;font-family:monospace">${cumStr}</span>
                <div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px;letter-spacing:1px">${closedCnt} CLOSED SIGNALS</div>
                <div style="display:flex;flex-direction:column;gap:5px;margin-top:14px;font-family:monospace;font-size:0.68rem;text-align:right">
                    <div style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:3px">
                        <span style="color:var(--text-dim);font-size:0.52rem;letter-spacing:1.5px">SHARPE</span>
                        <span style="color:#22c55e;font-weight:900">${sharpeVal}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:3px">
                        <span style="color:var(--text-dim);font-size:0.52rem;letter-spacing:1.5px">PROFIT FACTOR</span>
                        <span style="color:#22c55e;font-weight:900">${pfVal}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:3px">
                        <span style="color:var(--text-dim);font-size:0.52rem;letter-spacing:1.5px">MAX DD</span>
                        <span style="color:#ef4444;font-weight:900">${maxDdVal}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:12px">
                        <span style="color:var(--text-dim);font-size:0.52rem;letter-spacing:1.5px">WIN RATE</span>
                        <span style="color:#eab308;font-weight:900">${winRateVal}</span>
                    </div>
                </div>
            `;
        }

        if (equityChartInstance) {
            equityChartInstance.destroy();
        }

        const isUp = cumulative >= 0;
        const lineColor = isUp ? '#00f2ff' : '#ef4444';
        const gradColor = isUp ? 'rgba(0, 242, 255, 0.22)' : 'rgba(239, 68, 68, 0.22)';

        equityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Cumulative P&L (%)',
                        data: dataPoints,
                        borderColor: lineColor,
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx: c, chartArea } = chart;
                            if (!chartArea) return null;
                            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, gradColor);
                            gradient.addColorStop(1, 'rgba(0,0,0,0)');
                            return gradient;
                        },
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHitRadius: 10,
                        fill: true,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Max Drawdown (%)',
                        data: drawdownPoints,
                        borderColor: 'rgba(239, 68, 68, 0.8)',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: true,
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: '30-Day Win Rate (%)',
                        data: winRatePoints,
                        borderColor: 'rgba(234, 179, 8, 0.65)',
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        tension: 0.2,
                        yAxisID: 'yWinRate'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 22, 40, 0.95)',
                        titleColor: '#94a3b8',
                        bodyColor: '#fff',
                        borderColor: 'rgba(0,242,255,0.2)',
                        borderWidth: 1,
                        callbacks: {
                            label: (c) => (c.dataset.label || '') + ': ' + c.parsed.y + '%'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(148, 163, 184, 0.5)', font: { size: 9, family: 'monospace' }, maxTicksLimit: 7 }
                    },
                    y: {
                        position: 'left',
                        grid: { color: GRID_COLOR },
                        ticks: { color: 'rgba(148, 163, 184, 0.6)', font: { size: 9, family: 'monospace' }, callback: v => v + '%' }
                    },
                    yWinRate: {
                        position: 'right',
                        min: 0,
                        max: 100,
                        grid: { display: false },
                        ticks: { color: 'rgba(234, 179, 8, 0.6)', font: { size: 9, family: 'monospace' }, callback: v => v + '%' }
                    }
                }
            }
        });
    }

    // ---- 4. Asset Class Horizontal Bar Chart ----
    function renderAssetDistribution(byTickerList) {
        const ctx = document.getElementById('gcs-asset-canvas');
        if (!ctx) return;

        if (!byTickerList || !byTickerList.length) {
            return;
        }

        const sorted = [...byTickerList].sort((a, b) => b.total_roi - a.total_roi);
        let displayTickers = sorted;
        if (sorted.length > 15) {
            displayTickers = [...sorted.slice(0, 10), ...sorted.slice(-5)];
        }

        const labels = displayTickers.map(t => t.symbol);
        const data = displayTickers.map(t => t.total_roi);
        const bgColors = data.map(v => v >= 0 ? 'rgba(0, 242, 255, 0.4)' : 'rgba(239, 68, 68, 0.4)');
        const borderColors = data.map(v => v >= 0 ? '#00f2ff' : '#ef4444');

        if (assetChartInstance) assetChartInstance.destroy();

        assetChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 2,
                    barThickness: 'flex'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 22, 40, 0.95)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const t = displayTickers[context.dataIndex];
                                return `Total P&L: ${t.total_roi}% | Trades: ${t.total} (Wins: ${t.wins}, Losses: ${t.losses})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: GRID_COLOR },
                        ticks: { color: '#94a3b8', font: { size: 9, family: 'monospace' }, callback: v => v + '%' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#cbd5e1', font: { size: 10, family: 'monospace', weight: 'bold' } }
                    }
                }
            }
        });
    }

    // ---- 5. Execution Heatmap Matrix ----
    function renderExecutionHeatmap(heatmapData) {
        const hCont = document.getElementById('gcs-heatmap-container');
        if (!hCont) return;

        if (!heatmapData || !heatmapData.length) {
            hCont.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.8rem">No heatmap data available.</div>`;
            return;
        }

        const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
        const matrix = {};
        for (let d = 0; d < 7; d++) {
            matrix[d] = {};
            for (let h = 0; h < 24; h += 2) {
                matrix[d][h] = { roi: 0, count: 0 };
            }
        }

        heatmapData.forEach(item => {
            const d = item.dow;
            const h = Math.floor(item.hour / 2) * 2;
            if (matrix[d] && matrix[d][h]) {
                matrix[d][h].roi += item.total_roi;
                matrix[d][h].count += item.total;
            }
        });

        let maxMag = 1;
        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h += 2) {
                const cell = matrix[d][h];
                if (cell.count > 0) {
                    const avg = cell.roi / cell.count;
                    if (Math.abs(avg) > maxMag) maxMag = Math.abs(avg);
                }
            }
        }

        let html = '<div style="display:flex;flex-direction:column;gap:3px;height:100%;justify-content:space-between">';
        html += '<div style="display:flex;margin-left:36px;justify-content:space-between;margin-bottom:4px">';
        for (let h = 0; h < 24; h += 2) {
            html += `<span style="font-size:0.5rem;color:var(--text-dim);font-family:monospace;width:8%">${h < 10 ? '0' + h : h}h</span>`;
        }
        html += '</div>';

        for (let d = 0; d < 7; d++) {
            html += '<div style="display:flex;align-items:center;gap:3px;flex:1">';
            html += `<span style="font-size:0.55rem;color:var(--text-dim);font-weight:900;width:32px;font-family:monospace">${DAYS[d]}</span>`;
            for (let h = 0; h < 24; h += 2) {
                const cell = matrix[d][h];
                let bg = 'rgba(255,255,255,0.02)';
                let border = 'rgba(255,255,255,0.04)';
                let title = `${DAYS[d]} ${h}:00-${h+2}:00: No trades`;

                if (cell.count > 0) {
                    const avg = cell.roi / cell.count;
                    const intensity = Math.min(1, Math.max(0.15, Math.abs(avg) / maxMag));
                    if (avg >= 0) {
                        bg = `rgba(0, 242, 255, ${intensity * 0.8})`;
                        border = `rgba(0, 242, 255, 0.4)`;
                    } else {
                        bg = `rgba(239, 68, 68, ${intensity * 0.8})`;
                        border = `rgba(239, 68, 68, 0.4)`;
                    }
                    title = `${DAYS[d]} ${h}:00-${h+2}:00: Avg ${avg.toFixed(2)}% (${cell.count} trades)`;
                }

                html += `<div title="${title}" style="flex:1;height:100%;background:${bg};border:1px solid ${border};border-radius:2px;cursor:pointer;transition:transform 0.1s" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'"></div>`;
            }
            html += '</div>';
        }
        html += '</div>';

        hCont.innerHTML = html;
    }

    // ---- 6. Closed Signals Trade Ledger Table ----
    function renderTradeTable(data, pageInfo) {
        const wrap = document.getElementById('gcs-table-container');
        const pag = document.getElementById('gcs-pagination-controls');
        const feedSub = document.getElementById('gcs-feed-sub');
        if (!wrap) return;

        if (feedSub && pageInfo) {
            feedSub.innerHTML = `Showing page ${pageInfo.page || 1} of ${pageInfo.pages || 1} &bull; ${(pageInfo.total || data.length).toLocaleString()} total closed executions across all users`;
        }

        if (!data || !data.length) {
            wrap.innerHTML = `<div style="padding:3rem;text-align:center;color:var(--text-dim);font-size:0.85rem">No closed signals match the selected criteria.</div>`;
            if (pag) pag.innerHTML = '';
            return;
        }

        const th = ['Ticker', 'Strategy', 'Action', 'Entry', 'Exit', 'ROI', 'State', 'Closed At', 'Trader'].map(h => `
            <th style="padding:8px 12px;text-align:left;color:var(--text-dim);font-weight:900;font-size:0.6rem;letter-spacing:1.5px;white-space:nowrap">${h}</th>
        `).join('');

        const tb = data.map(s => {
            const roi = s.final_roi != null ? s.final_roi : (s.return || 0);
            const rColor = roi >= 0 ? CHART_GREEN : CHART_RED;
            const rStr = (roi >= 0 ? '+' : '') + Number(roi).toFixed(2) + '%';
            const isBull = s.direction === 'LONG';
            const actionBg = isBull ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
            const actionBorder = isBull ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)';
            const actionCol = isBull ? CHART_GREEN : CHART_RED;
            const actionLbl = isBull ? '▲ BUY' : '▼ SELL';

            const entryStr = s.entry ? '$' + Number(s.entry).toLocaleString('en', { maximumFractionDigits: 4 }) : '&mdash;';
            const exitStr = s.exit_price ? '$' + Number(s.exit_price).toLocaleString('en', { maximumFractionDigits: 4 }) : '&mdash;';

            const dateRaw = s.closed_at || s.timestamp;
            const dateStr = dateRaw ? new Date(dateRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '&mdash;';
            const traderMasked = s.trader || 'an***';

            return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.03);transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background=''">
                    <td style="padding:10px 12px;font-weight:900;color:var(--accent);font-family:monospace">${s.ticker}</td>
                    <td style="padding:10px 12px;color:var(--text);font-size:0.72rem">${(s.type || '').replace(/_/g, ' ')}</td>
                    <td style="padding:10px 12px">
                        <span style="background:${actionBg};border:1px solid ${actionBorder};color:${actionCol};padding:2px 7px;border-radius:4px;font-size:0.6rem;font-weight:800;letter-spacing:0.5px;white-space:nowrap">${actionLbl}</span>
                    </td>
                    <td style="padding:10px 12px;font-family:monospace;color:var(--text-dim)">${entryStr}</td>
                    <td style="padding:10px 12px;font-family:monospace;color:var(--text-dim)">${exitStr}</td>
                    <td style="padding:10px 12px;font-weight:900;color:${rColor};font-family:monospace;font-size:0.85rem">${rStr}</td>
                    <td style="padding:10px 12px">
                        <span style="font-size:0.6rem;font-weight:800;color:#94a3b8;background:rgba(148,163,184,0.1);padding:2px 6px;border-radius:4px">${s.state || 'CLOSED'}</span>
                    </td>
                    <td style="padding:10px 12px;color:var(--text-dim);font-size:0.7rem">${dateStr}</td>
                    <td style="padding:10px 12px;color:#7dd3fc;font-family:monospace;font-size:0.68rem">${traderMasked}</td>
                </tr>
            `;
        }).join('');

        wrap.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:0.75rem;min-width:700px">
                <thead><tr style="border-bottom:1px solid var(--border)">${th}</tr></thead>
                <tbody>${tb}</tbody>
            </table>
        `;

        if (pag) {
            const pages = pageInfo.pages || 1;
            if (pages <= 1) {
                pag.innerHTML = '';
                return;
            }

            let btns = '';
            btns += `<button onclick="window._gcsGoPage(${Math.max(1, currentPage - 1)})" style="padding:5px 12px;border-radius:6px;font-size:0.65rem;font-weight:800;cursor:pointer;border:1px solid var(--border);background:rgba(255,255,255,0.03);color:var(--text-dim)" ${currentPage === 1 ? 'disabled style="opacity:0.4"' : ''}>PREV</button>`;

            const maxVisible = Math.min(pages, 7);
            for (let p = 1; p <= maxVisible; p++) {
                const isActive = p === currentPage;
                btns += `<button onclick="window._gcsGoPage(${p})" style="padding:5px 10px;border-radius:6px;font-size:0.68rem;font-weight:800;cursor:pointer;border:1px solid ${isActive ? 'rgba(0,242,255,0.5)' : 'var(--border)'};background:${isActive ? 'rgba(0,242,255,0.15)' : 'transparent'};color:${isActive ? 'var(--accent)' : 'var(--text-dim)'}">${p}</button>`;
            }
            if (pages > 7) {
                btns += `<span style="color:var(--text-dim);font-size:0.68rem;padding:0 4px">&hellip; of ${pages}</span>`;
            }

            btns += `<button onclick="window._gcsGoPage(${Math.min(pages, currentPage + 1)})" style="padding:5px 12px;border-radius:6px;font-size:0.65rem;font-weight:800;cursor:pointer;border:1px solid var(--border);background:rgba(255,255,255,0.03);color:var(--text-dim)" ${currentPage >= pages ? 'disabled style="opacity:0.4"' : ''}>NEXT</button>`;

            pag.innerHTML = btns;
        }
    }

    window._gcsGoPage = function(page) {
        currentPage = page;
        loadGlobalData();
    };

    // Kick off initial fetch
    await loadGlobalData();
}

window.renderGlobalClosedSignals = renderGlobalClosedSignals;
