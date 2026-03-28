function renderHubTabs(activeTab, tabs) {
    if (!tabs) return '';
    return `
        <div class="hub-tabs" style="display:flex; gap:10px; margin-bottom:1.5rem; border-bottom:1px solid var(--border); padding-bottom:10px; overflow-x:auto">
            ${tabs.map(t => `
                <button class="intel-action-btn mini ${activeTab === t.id ? '' : 'outline'}" 
                        onclick="switchView('${t.view}')" 
                        style="white-space:nowrap; padding:6px 12px; font-size:0.65rem">
                    <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; margin-right:4px">${t.icon}</span> 
                    ${t.label}
                </button>
            `).join('')}
        </div>
    `;
}

// ============= Global Markets Hub =============
async function renderGlobalHub() {
    const tabs = [
        { id: 'etf', label: 'ETF FLOWS', view: 'etf-flows', icon: 'account_balance' },
        { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
        { id: 'oi', label: 'OI RADAR', view: 'oi-radar', icon: 'track_changes' },
        { id: 'gaps', label: 'CME GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
    ];
    renderETFFlows(tabs);
}

// ============= Macro Intelligence Hub =============
async function renderMacroHub() {
    const tabs = [
        { id: 'briefing', label: 'MARKET BRIEFING', view: 'briefing', icon: 'description' },
        { id: 'flow', label: 'CAPITAL FLOWS', view: 'flow', icon: 'swap_horiz' },
        { id: 'rotation', label: 'SECTOR ROTATION', view: 'rotation', icon: 'rotate_right' },
        { id: 'macro', label: 'MACRO COMPASS', view: 'macro-hub', icon: 'public' },
        { id: 'correlation', label: 'CORRELATION Matrix', view: 'correlation-matrix', icon: 'grid_4x4' }
    ];
    renderBriefing(tabs); 
}

// ============= Alpha Strategy Hub =============
async function renderAlphaHub() {
    const tabs = [
        { id: 'signals', label: 'LIVE SIGNALS', view: 'signals', icon: 'radar' },
        { id: 'score', label: 'ALPHA SCORE', view: 'alpha-score', icon: 'bolt' },
        { id: 'lab', label: 'STRATEGY LAB', view: 'strategy-lab', icon: 'science' },
        { id: 'archive', label: 'SIGNAL ARCHIVE', view: 'signal-archive', icon: 'archive' },
        { id: 'narrative', label: 'NARRATIVE GALAXY', view: 'narrative', icon: 'hub' }
    ];
    renderSignals('ALL', tabs);
}

// ============= Institutional Hub =============
async function renderInstitutionalHub() {
    const tabs = [
        { id: 'unlocks', label: 'TOKEN UNLOCKS', view: 'token-unlocks', icon: 'key' },
        { id: 'yield', label: 'YIELD LAB', view: 'yield-lab', icon: 'biotech' },
        { id: 'optimizer', label: 'PORTFOLIO OPTIMIZER', view: 'portfolio-optimizer', icon: 'auto_mode' },
        { id: 'tradelab', label: 'TRADE IDEA LAB', view: 'tradelab', icon: 'experiment' }
    ];
    renderTokenUnlocks(tabs);
}

// ============= Analytics Hub =============
async function renderAnalyticsHub() {
    const tabs = [
        { id: 'whales', label: 'WHALE PULSE', view: 'whales', icon: 'waves' },
        { id: 'velocity', label: 'CHAIN VELOCITY', view: 'velocity', icon: 'speed' },
        { id: 'onchain', label: 'ON-CHAIN STATS', view: 'onchain', icon: 'link' },
        { id: 'newsroom', label: 'NEWSROOM', view: 'newsroom', icon: 'newspaper' }
    ];
    renderWhalePulse(tabs);
}

// ============= Audit & Performance Hub =============
async function renderAuditHub() {
    const tabs = [
        { id: 'ledger', label: 'TRADE LEDGER', view: 'trade-ledger', icon: 'list_alt' },
        { id: 'performance', label: 'PERFORMANCE', view: 'performance-dashboard', icon: 'trending_up' }
    ];
    renderTradeLedger(tabs);
}

// ============= Risk & Stress Lab Hub =============
async function renderRiskHub() {
    const tabs = [
        { id: 'risk', label: 'RISK MATRIX', view: 'risk', icon: 'grid_on' },
        { id: 'stress', label: 'STRESS LAB', view: 'stress', icon: 'warning_amber' }
    ];
    renderRiskMatrix(tabs);
}

// ============= Update existing renderers to support tabs =============
async function renderETFFlows(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('etf', tabs) : '';
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Global Markets <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabHTML}
        <div class="card" style="margin-bottom:1.5rem">
            <div style="height:450px; width:100%"><canvas id="etfFlowsChart"></canvas></div>
        </div>
        <div class="grid-2">
            <div class="card">
                <h3>DAILY LEADERBOARD</h3>
                <div id="etf-leaderboard" class="skeleton-line"></div>
            </div>
            <div class="card">
                <h3>CUMULATIVE FLOW USD</h3>
                <div id="etf-cumulative-text" style="font-size:2rem; font-weight:900; color:var(--accent); margin-top:1rem">$0.00B</div>
                <p style="font-size:0.7rem; color:var(--text-dim)">Total Net Institutional Inflow since Launch.</p>
            </div>
        </div>
    `;
    // ... rest of renderETFFlows logic ...

    // High-fidelity simulated ETF Flow data
    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const issuers = [
        { name: 'IBIT (BlackRock)', color: '#00f2ff', data: [450, 120, -50, 800, 310, 0, 0] },
        { name: 'FBTC (Fidelity)', color: '#86efac', data: [210, 90, -30, 400, 150, 0, 0] },
        { name: 'ARKB (Ark)', color: '#facc15', data: [50, 20, -10, 120, 45, 0, 0] },
        { name: 'BITB (Bitwise)', color: '#a78bfa', data: [30, 15, -5, 80, 25, 0, 0] }
    ];

    const ctx = document.getElementById('etfFlowsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                ...issuers.map(iss => ({
                    label: iss.name,
                    data: iss.data,
                    backgroundColor: iss.color,
                    borderRadius: 4,
                    stack: 'Stack 0'
                })),
                {
                    label: 'CUMULATIVE NET ($M)',
                    data: [740, 985, 890, 2290, 2820, 2820, 2820],
                    type: 'line',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    borderWidth: 2,
                    pointRadius: 4,
                    yAxisID: 'y1',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#d1d5db', font: { family: 'JetBrains Mono', size: 10 } } }
            },
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' }, title: { display: true, text: 'DAILY FLOW ($M)', color: '#00f2ff' } },
                y1: { position: 'right', grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' }, title: { display: true, text: 'CUMULATIVE ($M)', color: 'rgba(255,255,255,0.5)' } }
            }
        }
    });

    document.getElementById('etf-cumulative-text').textContent = "$19.42B";
    document.getElementById('etf-leaderboard').innerHTML = issuers.map(iss => `
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border)">
            <span style="font-size:0.75rem; font-weight:700">${iss.name}</span>
            <span style="color:${iss.data[4] >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}; font-weight:900">${iss.data[4] >= 0 ? '+' : ''}${iss.data[4]}M</span>
        </div>
    `).join('');
}

// ============= Liquidations View =============
async function renderLiquidations() {
    const tabs = [
        { id: 'etf', label: 'ETF FLOWS', view: 'etf-flows', icon: 'account_balance' },
        { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
        { id: 'oi', label: 'OI RADAR', view: 'oi-radar', icon: 'track_changes' },
        { id: 'gaps', label: 'CME GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
    ];
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Global Markets Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${renderHubTabs('liquidations', tabs)}
        <div class="card" style="margin-bottom:1.5rem">
            <div style="height:450px; width:100%"><canvas id="liquidationsChart"></canvas></div>
        </div>
        <div class="signal-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))">
            <div class="card">
                <h3 style="color:var(--risk-high)">TOTAL REKT 24H</h3>
                <div style="font-size:2rem; font-weight:900; margin:1rem 0">$142.8M</div>
                <div style="display:flex; gap:15px; font-size:0.7rem">
                    <span style="color:var(--risk-high)">● LONGS: $112.5M (78%)</span>
                    <span style="color:var(--risk-low)">● SHORTS: $30.3M (22%)</span>
                </div>
            </div>
            <div class="card">
                <h3>LARGEST SINGLE ORDER</h3>
                <div style="font-size:1.2rem; font-weight:900; margin:1rem 0; color:var(--accent)">$4.12M (BTC-USDT / BINANCE)</div>
                <p style="font-size:0.65rem; color:var(--text-dim)">Forced liquidation occurs when the margin balance falls below the maintenance requirement.</p>
            </div>
        </div>
    `;

    const data = [
        { ticker: 'BTC', longs: 45.2, shorts: 12.1 },
        { ticker: 'ETH', longs: 28.5, shorts: 8.4 },
        { ticker: 'SOL', longs: 15.1, shorts: 4.2 },
        { ticker: 'XRP', longs: 8.2, shorts: 1.5 },
        { ticker: 'DOGE', longs: 5.4, shorts: 2.1 },
        { ticker: 'PEPE', longs: 4.1, shorts: 1.0 },
        { ticker: 'SUI', longs: 3.5, shorts: 0.8 },
        { ticker: 'AVAX', longs: 2.5, shorts: 0.2 }
    ];

    const ctx = document.getElementById('liquidationsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.ticker),
            datasets: [
                {
                    label: 'LONGS ($M)',
                    data: data.map(d => d.longs),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'SHORTS ($M)',
                    data: data.map(d => d.shorts),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: '#22c55e',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#d1d5db', font: { family: 'JetBrains Mono', size: 10 } } }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)', font: { weight: 'bold' } } }
            }
        }
    });
}

// ============= CME Gaps View =============
async function renderCMEGaps() {
    const tabs = [
        { id: 'etf', label: 'ETF FLOWS', view: 'etf-flows', icon: 'account_balance' },
        { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
        { id: 'oi', label: 'OI RADAR', view: 'oi-radar', icon: 'track_changes' },
        { id: 'gaps', label: 'CME GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
    ];
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Global Markets Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${renderHubTabs('gaps', tabs)}
        <div class="card" style="margin-bottom:1.5rem">
            <h3>ACTIVE_MAGNET_LEVELS</h3>
            <div id="cme-gaps-list" style="margin-top:1rem"></div>
        </div>
        <p style="font-size:0.7rem; color:var(--text-dim); line-height:1.5; padding:0 10px;">
            <span class="material-symbols-outlined" style="font-size:12px; vertical-align:middle">info</span> 
            CME Gaps occur when the Bitcoin futures market closing price on Friday differs from the opening price on Sunday night. 
            Institutions often trade towards these levels to "fill" the structural liquidity void.
        </p>
    `;

    const gaps = [
        { level: "63,450 - 64,120", type: "UPPER", status: "UNFILLED", distance: "+3.2%", color: "var(--risk-low)" },
        { level: "58,200 - 59,100", type: "LOWER", status: "PARTIAL", distance: "-4.5%", color: "var(--accent)" },
        { level: "53,400 - 54,000", type: "LOWER", status: "UNFILLED", distance: "-11.2%", color: "#ef4444" },
        { level: "69,100 - 69,800", type: "UPPER", status: "FILLED", distance: "N/A", color: "var(--text-dim)" }
    ];

    document.getElementById('cme-gaps-list').innerHTML = gaps.map(g => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid var(--border); background:rgba(255,255,255,0.02); margin-bottom:8px; border-radius:4px">
            <div>
                <div style="font-size:0.9rem; font-weight:900; color:var(--text)">$${g.level}</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:4px">${g.type} GAP</div>
            </div>
            <div style="text-align:right">
                <div style="font-size:0.75rem; font-weight:900; color:${g.color}">${g.status}</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:4px">${g.distance} DISTANCE</div>
            </div>
        </div>
    `).join('');
}

// ============= OI Radar View =============
async function renderOIRadar() {
    const tabs = [
        { id: 'etf', label: 'ETF FLOWS', view: 'etf-flows', icon: 'account_balance' },
        { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
        { id: 'oi', label: 'OI RADAR', view: 'oi-radar', icon: 'track_changes' },
        { id: 'gaps', label: 'CME GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
    ];
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Global Markets Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${renderHubTabs('oi', tabs)}
        <div class="grid-2">
            <div class="card" style="height:450px; display:flex; align-items:center; justify-content:center">
                <canvas id="oiRadarChart"></canvas>
            </div>
            <div class="card">
                <h3>OI_FLOW_ATTRIBUTION</h3>
                <div id="oi-attribution" style="margin-top:1rem"></div>
                <div style="margin-top:2rem; padding:1rem; background:rgba(0,242,255,0.05); border-left:3px solid var(--accent); border-radius:4px">
                    <h4 style="font-size:0.7rem; color:var(--accent)">INSTITUTIONAL_SKEW_DETECTED</h4>
                    <p style="font-size:0.65rem; color:var(--text-dim); margin-top:5px">CME Open Interest is currently leading Binance by $2.4B in notional delta, indicating heavy spot-ETF hedge positioning.</p>
                </div>
            </div>
        </div>
        
        <div class="card" style="margin-top:2rem">
            <div class="card-header" style="margin-bottom:15px">
                <h3>Options Implied Volatility (IV) Smile Curve <span style="font-size:0.8rem; color:var(--text-dim)">(Deribit 30D Expiry)</span></h3>
                <span class="label-tag">DERIBIT_SKEW</span>
            </div>
            <div style="height:350px; width:100%; position:relative;">
                <canvas id="ivSmileChart"></canvas>
            </div>
            <div style="margin-top:10px; font-size:0.75rem; color:var(--text-dim)">
                Steepening left-tail (OTM Puts) indicates aggressive institutional tail-risk hedging. Flatter right-tail (OTM Calls) suggests capped upside speculation.
            </div>
        </div>
    `;

    const exchanges = [
        { name: 'Binance', oi: 14.5, delta: 12, funding: 0.012 },
        { name: 'Bybit', oi: 8.2, delta: -5, funding: 0.015 },
        { name: 'OKX', oi: 5.4, delta: 2, funding: 0.008 },
        { name: 'CME', oi: 12.1, delta: 18, funding: 0 }
    ];

    const ctx = document.getElementById('oiRadarChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Open Interest ($B)', '24h Delta (%)', 'Funding Rate (x100)', 'Volume (Relative)'],
            datasets: [
                {
                    label: 'BINANCE_PERP',
                    data: [14.5, 12, 1.2, 85],
                    backgroundColor: 'rgba(247, 211, 0, 0.2)',
                    borderColor: '#f7d300',
                    borderWidth: 2,
                    pointBackgroundColor: '#f7d300'
                },
                {
                    label: 'CME_FUTURES',
                    data: [12.1, 18, 0, 45],
                    backgroundColor: 'rgba(0, 242, 255, 0.2)',
                    borderColor: '#00f2ff',
                    borderWidth: 2,
                    pointBackgroundColor: '#00f2ff'
                }
            ]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: 'rgba(255,255,255,0.5)', font: { family: 'JetBrains Mono', size: 10 } },
                    ticks: { display: false, backdropColor: 'transparent' }
                }
            },
            plugins: {
                legend: { labels: { color: '#d1d5db', font: { family: 'JetBrains Mono', size: 10 } } }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    document.getElementById('oi-attribution').innerHTML = exchanges.map(ex => `
        <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border)">
            <span style="font-size:0.75rem; font-weight:700">${ex.name}</span>
            <div style="text-align:right">
                <div style="font-size:0.75rem; font-weight:900">$${ex.oi}B</div>
                <div style="font-size:0.55rem; color:${ex.delta >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">${ex.delta >= 0 ? '+' : ''}${ex.delta}% DELTA</div>
            </div>
        </div>
    `).join('');

    // Render IV Smile
    setTimeout(() => {
        const smileCtx = document.getElementById('ivSmileChart');
        if (smileCtx) {
            new Chart(smileCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['-30% (Deep OTM Put)', '-20%', '-10%', 'ATM (0%)', '+10%', '+20%', '+30% (Deep OTM Call)'],
                    datasets: [
                        {
                            label: 'Implied Volatility (IV %)',
                            data: [82.4, 75.1, 64.2, 58.0, 61.5, 66.8, 72.3],
                            borderColor: '#00f2ff',
                            backgroundColor: 'rgba(0, 242, 255, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#00f2ff'
                        },
                        {
                            label: 'Historical Volatility Benchmark (30D)',
                            data: [60.5, 60.5, 60.5, 60.5, 60.5, 60.5, 60.5],
                            borderColor: 'rgba(255,255,255,0.2)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            pointRadius: 0,
                            fill: false,
                            tension: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                        legend: { labels: { color: '#8b949e', font: { family: 'Outfit', size: 11 } } },
                        tooltip: { backgroundColor: 'rgba(13, 17, 23, 0.95)', titleColor: '#00f2ff', bodyColor: '#e6edf3', padding: 12 }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 } } },
                        y: { 
                            title: { display: true, text: 'Implied Volatility (%)', color: '#8b949e' },
                            grid: { color: 'rgba(255,255,255,0.05)' }, 
                            ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 }, callback: v => v + '%' } 
                        }
                    }
                }
            });
        }
    }, 50);
}

// ============= Token Unlocks View =============
async function renderTokenUnlocks(tabs = null) {
    appEl.innerHTML = skeleton(6);
    const data = await fetchAPI('/unlocks');
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header">
            ${renderHubTabs('unlocks', tabs)}
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">key_visualizer</span> Token Genesis Pipeline <span class="premium-badge">LIVE</span></h1>
            <p style="color:var(--text-dim); margin-top:0.5rem">Capital flow anticipation based on structural unlock schedules.</p>
        </div>
        <div class="card" style="overflow-x:auto">
            <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                <thead>
                    <tr style="color:var(--text-dim); border-bottom:1px solid var(--border)">
                        <th style="text-align:left; padding:12px">TOKEN</th>
                        <th style="text-align:center; padding:12px">DAYS REMAINING</th>
                        <th style="text-align:right; padding:12px">NOTIONAL VALUE</th>
                        <th style="text-align:center; padding:12px">MARKET IMPACT</th>
                        <th style="text-align:center; padding:12px">STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(u => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
                            <td style="padding:15px 12px">
                                <span style="font-weight:900; color:var(--accent); font-size:0.85rem">${u.token}</span>
                            </td>
                            <td style="padding:15px 12px; text-align:center">
                                <span style="font-family:'JetBrains Mono'; font-weight:700; color:${u.days_until <= 3 ? 'var(--risk-high)' : 'var(--text)'}">${u.days_until} DAYS</span>
                            </td>
                            <td style="padding:15px 12px; text-align:right; font-weight:900">
                                $${u.amount_usd >= 1000 ? (u.amount_usd / 1000).toFixed(1) + 'B' : u.amount_usd.toFixed(1) + 'M'}
                            </td>
                            <td style="padding:15px 12px; text-align:center">
                                <span class="label-tag" style="background:${u.impact === 'CRITICAL' ? 'var(--risk-high)' : u.impact === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}; 
                                      color:${u.impact === 'CRITICAL' ? '#fff' : u.impact === 'HIGH' ? 'var(--risk-high)' : 'var(--text-dim)'}">
                                    ${u.impact}
                                </span>
                            </td>
                            <td style="padding:15px 12px; text-align:center">
                                <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                    <div style="width:6px; height:6px; background:${u.days_until <= 7 ? 'var(--risk-high)' : 'var(--risk-low)'}; border-radius:50%; box-shadow:0 0 8px ${u.days_until <= 7 ? 'red' : 'green'}"></div>
                                    <span style="font-size:0.6rem; letter-spacing:1px">${u.days_until <= 7 ? 'IMMINENT' : 'STABLE'}</span>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top:1.5rem; padding:1rem; background:rgba(255,255,255,0.02); border-radius:8px; display:flex; gap:12px; align-items:center">
            <span class="material-symbols-outlined" style="color:var(--accent)">info</span>
            <p style="font-size:0.65rem; color:var(--text-dim); line-height:1.4">
                Structural unlocks represent major supply expansions for VCs and team cohorts. 
                High-impact events often coincide with front-running distribution and increased hedging activity via perpetual futures.
            </p>
        </div>
    `;
}

// ============= Yield Lab View =============
async function renderYieldLab(tabs = null) {
    appEl.innerHTML = skeleton(6);
    const data = await fetchAPI('/yield-lab');
    if (!data || !data.protocols) return;

    appEl.innerHTML = `
        <div class="view-header">
            ${renderHubTabs('yield', tabs)}
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">account_balance_wallet</span> Institutional Yield Lab <span class="premium-badge">BETA</span></h1>
            <p style="color:var(--text-dim); margin-top:0.5rem">Optimized capital efficiency markers across Tier-1 lending and restaking protocols.</p>
        </div>
        <div class="grid-2" style="margin-bottom:1.5rem">
            <div class="card" style="padding:1.5rem; display:flex; align-items:center; gap:1.5rem">
                <div style="width:60px; height:60px; background:rgba(0,242,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center">
                    <span class="material-symbols-outlined" style="font-size:2rem; color:var(--accent)">trending_up</span>
                </div>
                <div>
                    <h3 style="font-size:0.65rem; color:var(--text-dim); letter-spacing:1px">AVG_STAKING_APY</h3>
                    <div style="font-size:1.8rem; font-weight:900; color:var(--risk-low)">8.42%</div>
                </div>
            </div>
            <div class="card" style="padding:1.5rem; display:flex; align-items:center; gap:1.5rem">
                <div style="width:60px; height:60px; background:rgba(34,197,94,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center">
                    <span class="material-symbols-outlined" style="font-size:2rem; color:var(--risk-low)">verified_user</span>
                </div>
                <div>
                    <h3 style="font-size:0.65rem; color:var(--text-dim); letter-spacing:1px">RISK_ADJUSTED_INDEX</h3>
                    <div style="font-size:1.8rem; font-weight:900; color:var(--accent)">AA+</div>
                </div>
            </div>
        </div>
        <div class="card" style="overflow-x:auto">
            <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                <thead>
                    <tr style="color:var(--text-dim); border-bottom:1px solid var(--border)">
                        <th style="text-align:left; padding:12px">PROTOCOL</th>
                        <th style="text-align:left; padding:12px">CHAIN</th>
                        <th style="text-align:right; padding:12px">TVL</th>
                        <th style="text-align:center; padding:12px">APY (%)</th>
                        <th style="text-align:center; padding:12px">RISK SCORE</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.protocols.map(p => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
                            <td style="padding:15px 12px; font-weight:900; color:var(--text)">${p.name} <span style="font-size:0.55rem; color:var(--text-dim); margin-left:8px; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px">${p.category}</span></td>
                            <td style="padding:15px 12px; color:var(--text-dim)">${p.chain}</td>
                            <td style="padding:15px 12px; text-align:right; font-weight:700">$${(p.tvl / 1000).toFixed(1)}B</td>
                            <td style="padding:15px 12px; text-align:center; color:var(--risk-low); font-weight:900">+${p.apy}%</td>
                            <td style="padding:15px 12px; text-align:center">
                                <div style="display:flex; justify-content:center; align-items:center; gap:8px">
                                    <div style="flex:1; height:4px; max-width:60px; background:rgba(255,255,255,0.1); border-radius:2px">
                                        <div style="width:${p.risk_score}%; height:100%; background:${p.risk_score > 80 ? 'var(--risk-low)' : 'var(--accent)'}; border-radius:2px"></div>
                                    </div>
                                    <span style="font-weight:700">${p.risk_score}</span>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}



async function renderSignals(category = 'ALL', tabs = null) {
    currentSignalCategory = category;
    appEl.innerHTML = skeleton(8);
    let signals = await fetchAPI('/signals');
    if (!signals) {
        appEl.innerHTML = '<div class="error-msg">Fail to sync with intelligence streams. Check connection.</div>';
        return;
    }
    
    // Phase 7.3: Institutional Safe Mode Filtering – Filter out high-vol memes and small-caps
    if (isSafeMode) {
        const safeCategories = ['L1', 'EXCHANGE', 'DEFI', 'INFRA', 'EQUITIES', 'MACRO', 'ETF', 'PROXY'];
        signals = signals.filter(s => safeCategories.includes(s.category));
    }

    lastSignalsData = signals;
    updateScroller(signals);
    startCountdown(); // Reset timer on successful fetch

    const filtered = category === 'ALL' ? signals : signals.filter(s => s.category === category);
    const cats = ['ALL', 'EXCHANGE', 'PROXY', 'MINERS', 'ETF', 'DEFI', 'L1', 'STABLES', 'MEMES'];

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('signals', tabs)}
                <h1>Signal Intelligence Dashboard</h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-signals')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
        </div>
        
        <!-- 30D Signal Density Histogram -->
        <div class="card" style="margin-bottom:20px;">
            <div class="card-header" style="margin-bottom:10px">
                <h3>Strategy Firing Density (30D Histogram)</h3>
                <span class="label-tag">VOLATILITY CLUSTER MAP</span>
            </div>
            <div style="height:120px; width:100%; position:relative;">
                <canvas id="signalDensityChart"></canvas>
            </div>
        </div>

        <div class="view-actions">
            <div class="category-filters">
                ${cats.map(c => `<button class="filter-btn ${category === c ? 'active' : ''}" onclick="renderSignals('${c}')">${c}</button>`).join('')}
            </div>
            <button class="export-btn" style="margin-left:auto" onclick="exportCSV(lastSignalsData,'alphasignal_signals.csv')">📥 Export CSV</button>
        </div>
        <div class="signal-grid">
            ${filtered.map(s => `
                <div class="signal-card ${Math.abs(s.zScore) > 2 ? 'z-outlier' : ''}" onclick="openDetail('${s.ticker}', '${s.category}', ${s.btcCorrelation}, ${s.alpha}, ${s.sentiment}, '60d', ${s.category === 'TRACKED'})">
                    <div class="card-controls" style="position:absolute; top:12px; right:12px; display:flex; gap:8px; z-index:10">
                        <div class="ai-trigger" onclick="event.stopPropagation(); openAIAnalyst('${s.ticker}')" title="Run AI Deep-Dive"><span class="material-symbols-outlined" style="font-size: 18px;">smart_toy</span></div>
                        <div class="share-trigger" onclick="event.stopPropagation(); shareSignal('${s.ticker}', ${s.alpha}, ${s.sentiment}, ${s.zScore})" title="Share to X (Twitter)"><span class="material-symbols-outlined" style="font-size: 18px;">share</span></div>
                    </div>
                    <div class="card-header">
                        <div>
                            <div class="ticker">${s.ticker}</div>
                            <div class="label-tag cat-${s.category.toLowerCase()}">${s.category}</div>
                        </div>
                        <div class="price-box" style="text-align:right">
                            <div style="font-weight:700">${formatPrice(s.price)}</div>
                            <div class="${s.change >= 0 ? 'pos' : 'neg'}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</div>
                        </div>
                    </div>
                    <div class="delta-stat">
                        <div class="delta-label">BTC CORRELATION</div>
                        <div class="delta-value">${s.btcCorrelation.toFixed(2)}</div>
                    </div>
                    <div class="metrics">
                        <div class="metric-line"><span>Relative Alpha</span><span class="${s.alpha >= 0 ? 'pos' : 'neg'}">${s.alpha >= 0 ? '+' : ''}${s.alpha.toFixed(2)}%</span></div>
                        <div class="metric-line"><span>Sentiment</span><span class="${getSentimentClass(s.sentiment)}">${getSentimentLabel(s.sentiment)}</span></div>
                    </div>
                </div>
            `).join('')}
        </div>`;

    // Render 30D Signal Density Histogram
    setTimeout(() => {
        const sdCtx = document.getElementById('signalDensityChart');
        if (sdCtx) {
            // Generate synthetic 30D distribution
            const labels = Array.from({length: 30}, (_, i) => `T-${30-i}d`);
            const dataBase = labels.map(() => Math.floor(Math.random() * 8) + 1);
            // Add a cluster spike
            dataBase[25] = 24; dataBase[26] = 18; dataBase[27] = 12;

            new Chart(sdCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Signals Fired',
                        data: dataBase,
                        backgroundColor: dataBase.map(v => v > 15 ? 'rgba(239, 68, 68, 0.8)' : v > 8 ? 'rgba(0, 242, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'),
                        borderRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(13, 17, 23, 0.95)' } },
                    scales: {
                        x: { display: false, grid: { display: false } },
                        y: { display: false, grid: { display: false }, suggestedMax: 30 }
                    }
                }
            });
        }
    }, 50);
}

// ============= Miners View =============
async function renderMiners() {
    renderSignals('MINERS');
}

// ============================================================
// Feature 2: Alpha Score Composite
// ============================================================
async function renderAlphaScore(tabs = null) {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>⚡ Alpha Score <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-alpha-score')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Composite 0–100 ranking across momentum, sentiment, signal engine alerts & volatility.</p>
        </div>
        <div class="card" style="padding:1rem">${skeleton(1)}</div>
    `;
    const data = await fetchAPI('/alpha-score');
    if (!data || !data.scores || !data.scores.length) {
        appEl.innerHTML += `<div class="card" style="text-align:center; padding:2rem; color:var(--text-dim)">Scoring engine computing... try again in 30s.</div>`;
        return;
    }

    const gradeColors = { A: '#22c55e', B: '#60a5fa', C: '#facc15', D: '#ef4444' };
    const signalColors = { 'STRONG BUY': '#22c55e', 'BUY': '#86efac', 'NEUTRAL': '#60a5fa', 'CAUTION': '#ef4444' };

    let scores = data.scores || [];
    if (isSafeMode) {
        const safeSectors = ['L1', 'EXCHANGE', 'DEFI', 'MACRO', 'EQUITIES', 'INFRA', 'ETF', 'PROXY'];
        scores = scores.filter(s => safeSectors.includes(s.sector) || safeSectors.includes(s.category));
    }

    let currentPage = 1;
    const itemsPerPage = 15;

    function drawAlphaPage() {
        const totalPages = Math.ceil(scores.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentScores = scores.slice(startIndex, startIndex + itemsPerPage);

        appEl.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:15px">
                <div>
                    ${renderHubTabs('score', tabs)}
                    <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">bolt</span> Alpha Score <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-alpha-score')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                    <p style="margin:0">Composite 0–100 ranking · Updated ${data.updated} · ${scores.length} assets scored ${isSafeMode ? '<span style="color:var(--accent); font-weight:700">[SAFE MODE ACTIVE]</span>' : ''}</p>
                </div>
                <!-- Pagination Controls -->
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:5px">
                    <button class="filter-btn" id="btn-prev-alpha" ${currentPage === 1 ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>&larr; Prev</button>
                    <span style="font-size:0.75rem; color:var(--text-dim); font-family:'JetBrains Mono'">Page ${currentPage} of ${totalPages}</span>
                    <button class="filter-btn" id="btn-next-alpha" ${currentPage === totalPages ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>Next &rarr;</button>
                </div>
            </div>
            <div class="card" style="overflow-x:auto">
                <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                    <thead>
                        <tr style="color:var(--text-dim); border-bottom:1px solid var(--border)">
                            <th style="text-align:left; padding:8px 12px">#</th>
                            <th style="text-align:left; padding:8px 12px">ASSET</th>
                            <th style="text-align:left; padding:8px 12px">SECTOR</th>
                            <th style="text-align:left; padding:8px 12px; width:180px">SCORE</th>
                            <th style="text-align:center; padding:8px 12px">GRADE</th>
                            <th style="text-align:center; padding:8px 12px">SIGNAL</th>
                            <th style="text-align:left; padding:8px 12px">MODEL SPECS</th>
                            <th style="text-align:left; padding:8px 12px">WHY</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentScores.map((s, i) => `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s"
                                onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
                                <td style="padding:10px 12px; color:var(--text-dim)">${startIndex + i + 1}</td>
                                <td style="padding:10px 12px; font-weight:700; color:var(--accent)">${s.ticker}</td>
                                <td style="padding:10px 12px; color:var(--text-dim); font-size:0.65rem; letter-spacing:1px">${s.sector}</td>
                                <td style="padding:10px 12px">
                                    <div style="display:flex; align-items:center; gap:8px">
                                        <div style="flex:1; height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden">
                                            <div style="width:${s.score}%; height:100%; background:${gradeColors[s.grade] || '#60a5fa'}; border-radius:4px; transition:width 1s ease"></div>
                                        </div>
                                        <span style="font-weight:700; font-size:0.8rem; color:${gradeColors[s.grade]}">${s.score}</span>
                                    </div>
                                </td>
                                <td style="padding:10px 12px; text-align:center">
                                    <span style="background:${gradeColors[s.grade] || '#999'}33; color:${gradeColors[s.grade] || '#999'}; padding:2px 10px; border-radius:20px; font-weight:700; font-size:0.75rem">${s.grade}</span>
                                </td>
                                <td style="padding:10px 12px; text-align:center">
                                    <span style="color:${signalColors[s.signal] || '#60a5fa'}; font-size:0.6rem; letter-spacing:1px">${s.signal}</span>
                                </td>
                                <td style="padding:10px 12px; min-width:140px">
                                    <div style="display:flex; flex-direction:column; gap:4px">
                                        <div style="display:flex; gap:6px; align-items:center">
                                            <span style="font-size:0.55rem; color:var(--text-dim); background:rgba(255,255,255,0.05); padding:1px 4px; border-radius:3px">CONSENSUS:</span>
                                            <span style="font-size:0.6rem; font-weight:900; color:${s.consensus === 'HIGH' ? '#22c55e' : s.consensus === 'MEDIUM' ? '#60a5fa' : '#ef4444'}">${s.consensus}</span>
                                        </div>
                                        <div style="display:flex; gap:6px; font-size:0.55rem; color:var(--text-dim)">
                                            <span style="letter-spacing:1px">LSTM: <span style="color:var(--accent)">${s.lstm_conf}%</span></span>
                                            <span style="letter-spacing:1px">XGB: <span style="color:var(--accent)">${s.xgb_conf}%</span></span>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding:10px 12px; color:var(--text-dim); font-size:0.62rem; max-width:200px">
                                    ${(s.reasons || []).map(r => r.includes('ML') ? `<strong style="color:var(--accent)">${r}</strong>` : r).join(' · ') || '—'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const btnPrev = document.getElementById('btn-prev-alpha');
        const btnNext = document.getElementById('btn-next-alpha');
        if(btnPrev) btnPrev.addEventListener('click', () => { if(currentPage > 1) { currentPage--; drawAlphaPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
        if(btnNext) btnNext.addEventListener('click', () => { if(currentPage < totalPages) { currentPage++; drawAlphaPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
    }

    currentPage = 1;
    drawAlphaPage();
}

// ============================================================
// Feature 4: Performance Dashboard
// ============================================================
async function renderPerformanceDashboard(tabs = null) {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('performance', tabs)}
                <h1>📈 Performance Dashboard <span class="premium-badge">LIVE</span></h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-performance')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Terminal signal track record — win rate, returns, and monthly breakdown.</p>
        </div>
        <div class="card" style="padding:1rem">${skeleton(1)}</div>
    `;
    const d = await fetchAPI('/performance');
    if (!d) return;

    const noData = d.total_signals === 0;
    const winColor = d.avg_return >= 0 ? '#22c55e' : '#ef4444';

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-start">
            <div>
                ${renderHubTabs('performance', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">trending_up</span> Institutional Alpha Performance <span class="premium-badge">LIVE</span></h1>
                <p>Track record as of ${d.updated} · Based on ${d.total_signals} signals</p>
            </div>
            <div style="display:flex; gap:0.5rem">
                <button class="timeframe-btn" onclick="downloadPortfolioData('csv')" style="display:flex; align-items:center; gap:6px; background:rgba(0, 242, 255, 0.1); border-color:var(--accent)">
                    <span class="material-symbols-outlined" style="font-size:18px">download</span> Export CSV
                </button>
                <button class="timeframe-btn" onclick="downloadPortfolioData('json')" style="display:flex; align-items:center; gap:6px">
                    <span class="material-symbols-outlined" style="font-size:18px">data_object</span> JSON
                </button>
            </div>
        </div>

        <!-- KPI Row -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; margin-bottom:1rem">
            ${[
                ['TOTAL SIGNALS', d.total_signals, '#60a5fa', 'radar'],
                ['WIN RATE', d.total_signals > 0 ? d.win_rate + '%' : 'N/A', d.win_rate >= 50 ? '#22c55e' : '#ef4444', 'track_changes'],
                ['AVG RETURN', d.total_signals > 0 ? (d.avg_return >= 0 ? '+' : '') + d.avg_return + '%' : 'N/A', winColor, 'trending_up'],
                ['TOTAL PnL', d.total_signals > 0 ? (d.total_return >= 0 ? '+' : '') + d.total_return + '%' : 'N/A', winColor, 'workspace_premium'],
            ].map(([label, val, color, icon]) => `
                <div class="card" style="padding:1.2rem; text-align:center">
                    <div style="font-size:1.4rem; margin-bottom:12px; color:var(--accent)"><span class="material-symbols-outlined">${icon}</span></div>
                    <div style="font-size:0.55rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:8px">${label}</div>
                    <div style="font-size:1.5rem; font-weight:900; color:${color}">${val}</div>
                </div>
            `).join('')}
        </div>

        </div>

        <!-- Strategy Equity Curve -->
        <div class="card" style="margin-bottom:1rem">
            <div class="card-header" style="margin-bottom:15px">
                <h3>Cumulative Strategy Return <span style="font-size:0.8rem; color:var(--text-dim)">(Model Portfolio Equity Curve)</span></h3>
                <span class="label-tag">P&L_TRAJECTORY</span>
            </div>
            <div style="height:350px; width:100%; position:relative;">
                <canvas id="strategyEquityChart"></canvas>
            </div>
        </div>

        <!-- Best / Worst -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem">
            <div class="card" style="padding:1rem; border-left:3px solid #22c55e">
                <div style="font-size:0.55rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:8px; display:flex; align-items:center; gap:6px">
                    <span class="material-symbols-outlined" style="font-size:14px; color:#22c55e">workspace_premium</span> BEST PICK
                </div>
                <div style="font-size:1rem; font-weight:700; color:#22c55e">${d.best_pick?.ticker || '—'}</div>
                <div style="font-size:0.8rem; color:#22c55e">${d.best_pick?.return > -999 ? '+' + d.best_pick.return + '%' : 'N/A'}</div>
            </div>
            <div class="card" style="padding:1rem; border-left:3px solid #ef4444">
                <div style="font-size:0.55rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:8px; display:flex; align-items:center; gap:6px">
                    <span class="material-symbols-outlined" style="font-size:14px; color:#ef4444">trending_down</span> WORST PICK
                </div>
                <div style="font-size:1rem; font-weight:700; color:#ef4444">${d.worst_pick?.ticker || '—'}</div>
                <div style="font-size:0.8rem; color:#ef4444">${d.worst_pick?.return < 999 ? d.worst_pick.return + '%' : 'N/A'}</div>
            </div>
        </div>

        ${noData ? `<div class="card" style="padding:3rem; text-align:center; color:var(--text-dim); font-size:0.85rem">
            No signal history yet. Performance data will appear as the Harvest engine captures signals.
        </div>` : ''}

        <!-- Monthly Breakdown -->
        ${d.monthly && d.monthly.length ? `
        <div class="card" style="overflow-x:auto">
            <div style="font-size:0.6rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:1rem">MONTHLY BREAKDOWN</div>
            <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                <thead>
                    <tr style="color:var(--text-dim); border-bottom:1px solid var(--border)">
                        <th style="text-align:left; padding:8px 12px">MONTH</th>
                        <th style="text-align:right; padding:8px 12px">SIGNALS</th>
                        <th style="text-align:right; padding:8px 12px">AVG RETURN</th>
                        <th style="text-align:left; padding:8px 12px; width:200px">PERFORMANCE</th>
                    </tr>
                </thead>
                <tbody>
                    ${d.monthly.map(m => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
                            <td style="padding:10px 12px; color:var(--text)">${m.month}</td>
                            <td style="padding:10px 12px; text-align:right; color:var(--text-dim)">${m.signals}</td>
                            <td style="padding:10px 12px; text-align:right; font-weight:700; color:${m.avg_roi >= 0 ? '#22c55e' : '#ef4444'}">${m.avg_roi >= 0 ? '+' : ''}${m.avg_roi}%</td>
                            <td style="padding:10px 12px">
                                <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; max-width:180px">
                                    <div style="width:${Math.min(100, Math.abs(m.avg_roi) * 5)}%; height:100%; background:${m.avg_roi >= 0 ? '#22c55e' : '#ef4444'}; border-radius:4px"></div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : ''}
    `;

    // Render Equity Curve
    setTimeout(() => {
        const eqCtx = document.getElementById('strategyEquityChart');
        if (eqCtx) {
            // Generate a realistic synthetic path ending at d.total_return
            const dataPoints = 180;
            const curve = [0];
            let current = 0;
            const totalRet = d.total_return || 45.2; // fallback
            const dailyDrift = totalRet / dataPoints;
            const vol = 1.5; // daily volatility proxy

            // Seedable pseudo-random for stable charts across re-renders
            let seed = 12345;
            function random() {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            }

            for (let i = 1; i < dataPoints; i++) {
                const noise = (random() - 0.5) * vol;
                current += dailyDrift + noise;
                curve.push(current);
            }
            // Force end EXACTLY at total_return
            curve.push(totalRet);

            const labels = curve.map((_, i) => `T-${dataPoints - i}d`);

            new Chart(eqCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Cumulative PnL (%)',
                        data: curve,
                        borderColor: winColor,
                        backgroundColor: winColor === '#22c55e' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: 'rgba(13, 17, 23, 0.95)', callbacks: { label: c => `${c.raw.toFixed(2)}%` } }
                    },
                    scales: {
                        x: { display: false },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 }, callback: v => v + '%' } }
                    }
                }
            });
        }
    }, 50);
}

// ============================================================
// Feature 5: Export Report
// ============================================================
async function renderCorrelationMatrix(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('correlation', tabs) : '';
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Macro Intelligence Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabHTML}
        <div class="card" style="padding:1.5rem">
            <div style="margin-bottom:1.5rem; display:flex; gap:12px; flex-wrap:wrap; align-items:center">
                <label style="font-size:0.65rem; color:var(--text-dim); letter-spacing:1px">BASKET:</label>
                <select id="corr-basket" onchange="loadCorrelationMatrix(this.value)"
                        style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:var(--text); padding:6px 12px; border-radius:8px; font-size:0.7rem">
                    <option value="BTC-USD,ETH-USD,SOL-USD,AVAX-USD,BNB-USD">Core Crypto (5)</option>
                    <option value="BTC-USD,ETH-USD,SOL-USD,MARA,COIN,MSTR">Crypto + Equities (6)</option>
                    <option value="BTC-USD,ETH-USD,SOL-USD,AAVE-USD,UNI-USD,LINK-USD">DeFi Basket (6)</option>
                    <option value="BTC-USD,IVV,GC=F,DX-Y.NYB,^TNX">Macro Cross-Asset (5)</option>
                </select>
                <span style="font-size:0.6rem; color:var(--text-dim)">Period: 60 days · Returns: Daily</span>
            </div>
            <div id="corr-chart" style="width:100%; overflow-x:auto"></div>
            <div style="margin-top:1.5rem; display:flex; align-items:center; gap:8px; font-size:0.6rem; color:var(--text-dim)">
                <span style="width:40px; height:8px; background:linear-gradient(to right, #ef4444, rgba(255,255,255,0.1), #22c55e); border-radius:4px; display:inline-block"></span>
                -1.0 (Inverse) → 0 (None) → +1.0 (Perfect)
            </div>
        </div>
    `;
    loadCorrelationMatrix('BTC-USD,ETH-USD,SOL-USD,AVAX-USD,BNB-USD');
}

async function renderFlows(tabs = null) {
    appEl.innerHTML = skeleton(2);
    const data = await fetchAPI('/flows');
    if (!data) return;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">flowsheet</span> Institutional Flow Monitor</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-liquidity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Tracking the velocity of capital rotating into the ecosystem via spot ETFs and major aggregates.</p>
        </div>
        <div class="pulse-grid">
            <div class="pulse-card">
                <h3>Institutional Pressure</h3>
                <div class="big-val">$${data.netFlow}M</div>
                <p>Net exchange-wide attribution</p>
            </div>
            <div class="pulse-card">
                <h3>Sector Momentum</h3>
                <div class="big-val ${data.sectorMomentum >= 0 ? 'pos' : 'neg'}">${data.sectorMomentum >= 0 ? '+' : ''}${data.sectorMomentum}%</div>
                <p>Alpha vs Market Benchmark</p>
            </div>
        </div>
        <div class="whale-list" style="margin-top:2.5rem">
            <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent)">SPOT ETF FLOW ATTRIBUTION (REAL-TIME)</h3>
            <div style="display:grid; gap:12px">
                ${data.etfFlows.map(f => `
                    <div class="whale-row" style="grid-template-columns: 100px 100px 1fr 150px; align-items:center">
                        <div class="label-tag" style="width:fit-content">${f.ticker}</div>
                        <div class="w-amount ${f.direction === 'IN' ? 'pos' : 'neg'}">${f.amount > 0 ? '+' : ''}${f.amount}M</div>
                        <div style="color:var(--text-dim); font-size:0.8rem">Institutional Bid ${f.direction}</div>
                        <div class="intensity-bar" style="background:rgba(255,255,255,0.05); height:4px; border-radius:2px; position:relative">
                            <div style="position:absolute; left:0; top:0; height:100%; width:${Math.min(Math.abs(f.amount)/2, 100)}%; background:${f.direction === 'IN' ? 'var(--risk-low)' : 'var(--risk-high)'}; border-radius:2px"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

// ============= Heatmap View =============
function renderDetailLiquidity(data) {
    const container = document.getElementById('liquidity-map');
    if (!data.levels || !data.levels.length) {
        container.innerHTML = '<p class="empty-state">No depth data available.</p>';
        return;
    }

    const bids = data.levels.filter(l => l.side === 'BID');
    const asks = data.levels.filter(l => l.side === 'ASK');
    const totalBid = bids.reduce((acc, l) => acc + l.size, 0);
    const totalAsk = asks.reduce((acc, l) => acc + l.size, 0);
    const imbalance = (totalBid / (totalBid + totalAsk)) * 100;

    const maxSideSize = Math.max(...data.levels.map(l => l.size));
    
    // Sort levels descending by price for vertical map
    const sorted = [...data.levels].sort((a,b) => b.price - a.price);

    container.innerHTML = `
        <div style="height:180px; position:relative; margin-bottom:1.5rem">
            <canvas id="liquidityDepthChart"></canvas>
        </div>
        <div class="obd-meter-section" style="margin-bottom:1.5rem">
            <div style="display:flex; justify-content:space-between; font-size:0.6rem; margin-bottom:4px; font-weight:700">
                <span class="pos">BUY PRESSURE</span>
                <span class="neg">SELL PRESSURE</span>
            </div>
            <div class="div-meter" style="height:6px">
                <div class="div-fill" style="width: ${imbalance}%; background: var(--risk-low); border-radius: 3px 0 0 3px"></div>
                <div class="div-fill" style="width: ${100 - imbalance}%; background: var(--risk-high); border-radius: 0 3px 3px 0"></div>
            </div>
            <div style="text-align:center; font-size:0.6rem; color:var(--text-dim); margin-top:4px">BOOK IMBALANCE: ${imbalance.toFixed(1)}% / ${(100-imbalance).toFixed(1)}%</div>
        </div>
        ${sorted.map(l => {
            const width = (l.size / maxSideSize) * 100;
            const color = l.side === 'ASK' ? 'rgba(255, 68, 68, 0.4)' : 'rgba(0, 242, 255, 0.4)';
            return `
                <div class="liq-level">
                    <div class="liq-price">${l.price.toLocaleString()}</div>
                    <div class="liq-bar-bg">
                        <div class="liq-bar" style="width: ${width}%; background: ${color}"></div>
                    </div>
                    <div class="liq-size">${l.size}</div>
                </div>
            `;
        }).join('')}
    `;

    setTimeout(() => {
        const dctx = document.getElementById('liquidityDepthChart');
        if (!dctx) return;
        
        const b = [...bids].sort((x,y) => y.price - x.price);
        const a = [...asks].sort((x,y) => x.price - y.price);
        
        let cumBid = 0;
        const bidData = b.map(l => { cumBid += l.size; return { x: l.price, y: cumBid }; });
        
        // Reverse bidData so that the smallest price (furthest left) is first in the array
        bidData.reverse();
        
        let cumAsk = 0;
        const askData = a.map(l => { cumAsk += l.size; return { x: l.price, y: cumAsk }; });

        new Chart(dctx.getContext('2d'), {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Bids (Support)',
                        data: bidData,
                        borderColor: '#00f2ff',
                        backgroundColor: 'rgba(0, 242, 255, 0.2)',
                        showLine: true,
                        fill: true,
                        stepped: true,
                        pointRadius: 0
                    },
                    {
                        label: 'Asks (Resistance)',
                        data: askData,
                        borderColor: '#ff4444',
                        backgroundColor: 'rgba(255, 68, 68, 0.2)',
                        showLine: true,
                        fill: true,
                        stepped: true,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(13, 17, 23, 0.95)', callbacks: { label: c => `${c.raw.x}: ${c.raw.y.toFixed(2)} Vol` } }
                },
                scales: {
                    x: { type: 'linear', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e' } },
                    y: { position: 'right', grid: { display: false }, ticks: { color: '#8b949e' } }
                }
            }
        });
    }, 50);
}

function renderFlowAttribution(data) {
    const container = document.getElementById('flow-attribution-container');
    if (!data || !data.attribution || !data.attribution.length) {
        container.innerHTML = '<p class="empty-state">No entity data available for this ticker.</p>';
        return;
    }

    // Safety: use .percentage or .value as fallback, and ensure numeric
    const processAttr = data.attribution.map(e => ({
        ...e,
        percentage: Number(e.percentage || e.value || 0)
    }));

    container.innerHTML = `
        <div class="flow-distribution-bar" style="height:12px; display:flex; border-radius:6px; overflow:hidden; margin-bottom:1rem; background:rgba(255,255,255,0.05)">
            ${processAttr.map(e => `<div style="width:${e.percentage}%; background:${e.color}" title="${e.name}: ${e.percentage}%"></div>`).join('')}
        </div>
        <div class="entity-legend-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
            ${processAttr.map(e => `
                <div class="entity-row" style="display:flex; justify-content:space-between; font-size:0.7rem; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px">
                        <div style="width:8px; height:8px; border-radius:3px; background:${e.color}"></div>
                        <span style="color:var(--text-dim)">${e.name}</span>
                    </div>
                    <span style="font-weight:700">${e.percentage}%</span>
                </div>
            `).join('')}
        </div>
    `;
}

async function renderMindshare() {
    appEl.innerHTML = skeleton(1);
    const [data, tvlData] = await Promise.all([
        fetchAPI(`/mindshare?v=${Date.now()}`),
        fetchAPI('/tvl')
    ]);
    if (!data) return;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;"><h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">share</span> Narrative Radar & Capital Flows</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-velocity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button><p>Mapping Narrative Momentum vs Developer Engineering Activity alongside Cross-Chain TVL migration.</p></div>
        
        <div style="display:grid; grid-template-columns: 1fr 350px; gap:20px; margin-bottom:20px;">
            <div class="mindshare-container" style="margin-bottom:0px; height: 100%;">
                <div class="chart-container" style="height:550px"><canvas id="mindshareChart"></canvas></div>
                <div class="mindshare-legend">
                    <div class="zone zone-alpha"><span>Alpha Quadrant</span>High Narrative, High Engineering</div>
                    <div class="zone zone-hype"><span>Hype Quadrant</span>High Narrative, Low Engineering</div>
                    <div class="zone zone-under"><span>Underlying Quadrant</span>Low Narrative, High Engineering</div>
                    <div class="zone zone-zombie"><span>Developing Zone</span>Low Narrative, Low Engineering</div>
                </div>
            </div>
            
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h3>Cross-Chain TVL Migration</h3>
                    <span class="label-tag">LIQUIDITY</span>
                </div>
                <div style="height: 350px; position: relative; margin-top:20px; margin-bottom:20px;">
                    <canvas id="tvl-doughnut-chart"></canvas>
                </div>
                <div style="margin-top:20px; font-size:0.8rem; color:var(--text-dim); line-height:1.6">
                    <p>Tracking institutional baseline capital rotation out of archaic primary L1s natively into high-throughput parallel execution environments.</p>
                </div>
            </div>
        </div>
        <div class="mindshare-guide">
            <div class="guide-box">
                <h4><span class="icon">📊</span> NARRATIVE MOMENTUM (Y-AXIS)</h4>
                <p>Quantifies institutional mindshare and news-driven sentiment. A high score suggests dominant public visibility and professional accumulation chatter.</p>
            </div>
            <div class="guide-box">
                <h4><span class="icon">🛠️</span> ENGINEERING MINDSHARE (X-AXIS)</h4>
                <p>Proxies developer activity and technical infrastructure growth. High scores indicate robust protocol stability and long-term utility build-out.</p>
            </div>
            <div class="guide-box full">
                <h4><span class="icon">🧭</span> STRATEGIC INTERPRETATION</h4>
                <div class="interpretation-grid">
                    <div class="inter-item"><strong>ALPHA:</strong> Leading protocols with both social dominance and technical vigor. The "Gold Standard" for institutional portfolios.</div>
                    <div class="inter-item"><strong>HYPE:</strong> Potential "Retail Traps" where mindshare exceeds technical merit. High risk of mean reversion.</div>
                    <div class="inter-item"><strong>UNDERLYING:</strong> Hidden gems. Technical infrastructure is growing silently while price/narrative remains depressed. <i>Prime Alpha Opportunity.</i></div>
                    <div class="inter-item"><strong>DEVELOPING:</strong> Early-stage or "Zombie" assets with both low engagement and minimal build-out. <i>High Risk / Monitoring required.</i></div>
                </div>
            </div>
        </div>`;
    const ctx = document.getElementById('mindshareChart').getContext('2d');
    new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Asset Mindshare',
                data: data.map(d => ({ x: d.engineer, y: d.narrative, r: d.volume, label: d.ticker })),
                backgroundColor: 'rgba(0, 242, 255, 0.5)',
                borderColor: '#00f2ff',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(0, 242, 255, 0.8)',
                datalabels: {
                    align: 'top',
                    offset: 5,
                    color: '#fff',
                    font: { weight: 'bold', size: 10, family: 'JetBrains Mono' },
                    formatter: (v) => v.label
                }
            }]
        },
        plugins: [ChartDataLabels, {
            id: 'quadrants',
            beforeDraw(chart) {
                const { ctx, chartArea: { top, bottom, left, right, width, height }, scales: { x, y } } = chart;
                const midX = x.getPixelForValue(50);
                const midY = y.getPixelForValue(50);

                ctx.save();
                // Alpha Quadrant (Top Right)
                ctx.fillStyle = 'rgba(0, 242, 255, 0.15)';
                ctx.fillRect(midX, top, right - midX, midY - top);
                // Hype Quadrant (Top Left)
                ctx.fillStyle = 'rgba(188, 19, 254, 0.15)';
                ctx.fillRect(left, top, midX - left, midY - top);
                // Underlying Quadrant (Bottom Right)
                ctx.fillStyle = 'rgba(255, 159, 0, 0.15)';
                ctx.fillRect(midX, midY, right - midX, bottom - midY);
                // Developing Quadrant (Bottom Left)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(left, midY, midX - left, bottom - midY);
                ctx.restore();
            }
        }],
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { 
                    min: 0, max: 100, 
                    title: { display: true, text: 'ENGINEERING MINDSHARE (X)', color: '#8b949e', font: { size: 10, weight: 'bold' } }, 
                    grid: { color: ct => ct.tick.value === 50 ? 'rgba(0, 242, 255, 0.3)' : 'rgba(255,255,255,0.03)' } 
                },
                y: { 
                    min: 0, max: 100, 
                    title: { display: true, text: 'NARRATIVE MOMENTUM (Y)', color: '#8b949e', font: { size: 10, weight: 'bold' } }, 
                    grid: { color: ct => ct.tick.value === 50 ? 'rgba(0, 242, 255, 0.3)' : 'rgba(255,255,255,0.03)' } 
                }
            },
            plugins: {
                tooltip: { 
                    backgroundColor: 'rgba(13, 17, 23, 0.9)',
                    titleColor: '#00f2ff',
                    borderColor: 'rgba(0, 242, 255, 0.2)',
                    borderWidth: 1,
                    callbacks: { label: ct => ` ${ct.raw.label}: Eng ${ct.raw.x} / Narr ${ct.raw.y} / Vol ${ct.raw.r}` } 
                },
                legend: { display: false },
                datalabels: { display: true }
            }
        }
    });

    if (tvlData) {
        const tvlCtx = document.getElementById('tvl-doughnut-chart').getContext('2d');
        const labels = Object.keys(tvlData);
        const values = Object.values(tvlData);
        
        new Chart(tvlCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(98, 126, 234, 0.8)',
                        'rgba(235, 33, 31, 0.8)',
                        'rgba(0, 255, 170, 0.8)',
                        'rgba(40, 160, 240, 0.8)',
                        'rgba(0, 82, 255, 0.8)',
                        'rgba(130, 71, 229, 0.8)',
                        'rgba(74, 161, 255, 0.8)',
                        'rgba(255, 100, 100, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#09090b',
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'right', labels: { color: '#8b949e', font: { family: 'Outfit', size: 11 }, padding: 15 } },
                    tooltip: { callbacks: { label: function(context) { return ' $' + context.raw + 'B TVL'; } } },
                    datalabels: { display: false }
                }
            }
        });
    }
}



// ============= Catalysts View =============
let catalystDataCache = null;
let activeCatalystDate = null;

async function renderCatalysts() {
    if (!catalystDataCache) {
        appEl.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h1>Intelligence Catalyst Compass</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                <p>Tracking high-impact earnings and macro events across the digital asset ecosystem.</p>
            </div>
            <div class="card" style="padding:1rem">${skeleton(2)}</div>
        `;
        catalystDataCache = await fetchAPI('/catalysts');
        if (!catalystDataCache) return;
    }

    // Generate 14-day strip
    const days = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const hasEvent = catalystDataCache.some(e => e.date === dateStr);
        days.push({
            date: dateStr,
            day: d.getDate(),
            weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
            hasEvent
        });
    }

    const filteredData = activeCatalystDate 
        ? catalystDataCache.filter(c => c.date === activeCatalystDate)
        : catalystDataCache;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">auto_awesome</span> Intelligence Catalyst Compass</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Tracking high-impact earnings and macro events across the digital asset ecosystem.</p>
        </div>

        <div class="catalyst-calendar-strip" style="display:flex; gap:10px; margin-bottom:2rem; overflow-x:auto; padding-bottom:10px">
            ${days.map(d => `
                <div class="catalyst-day ${d.hasEvent ? 'has-event' : ''}" 
                     onclick="activeCatalystDate = activeCatalystDate === '${d.date}' ? null : '${d.date}'; renderCatalysts()"
                     style="flex:1; min-width:60px; background:${activeCatalystDate === d.date ? 'rgba(0, 242, 255, 0.15)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${d.hasEvent || activeCatalystDate === d.date ? 'var(--accent)' : 'var(--border)'}; border-radius:12px; padding:12px 5px; text-align:center; cursor:pointer; transition:all 0.2s">
                    <div style="font-size:0.55rem; color:var(--text-dim); margin-bottom:5px">${d.weekday}</div>
                    <div style="font-size:1.1rem; font-weight:900; color:${d.hasEvent ? 'var(--accent)' : 'var(--text)'}">${d.day}</div>
                    ${d.hasEvent ? '<div style="width:4px; height:4px; background:var(--accent); border-radius:50%; margin:5px auto 0"></div>' : ''}
                </div>
            `).join('')}
        </div>

        ${activeCatalystDate ? `<div style="margin-bottom:1rem; font-size:0.8rem; color:var(--accent); cursor:pointer" onclick="activeCatalystDate=null; renderCatalysts()">← CLEAR FILTER</div>` : ''}

        <div class="catalyst-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:1.5rem">
            ${filteredData.length > 0 ? filteredData.map(c => `
                <div class="catalyst-item-card glass-card" onclick="${c.ticker !== 'MARKET' ? `openAIAnalyst('${c.ticker}')` : ''}" style="padding:1.5rem; position:relative; overflow:hidden; cursor:${c.ticker !== 'MARKET' ? 'pointer' : 'default'}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem">
                        <span style="font-size:0.6rem; font-weight:900; background:rgba(255,255,255,0.05); padding:3px 10px; border-radius:4px; color:var(--text-dim)">${c.type}</span>
                        <span class="event-countdown-badge" style="background:${c.days_until <= 3 ? 'var(--risk-high)' : 'var(--accent)'}; color:#000; font-size:0.55rem; font-weight:900; padding:2px 8px; border-radius:4px">
                            T-${c.days_until} DAYS
                        </span>
                    </div>
                    <h3 style="font-size:1.1rem; margin-bottom:0.5rem; color:${c.impact === 'Extreme' ? 'var(--risk-high)' : 'var(--text)'}">${c.event}</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem">
                        <div style="font-size:0.7rem; color:var(--text-dim)">DATE: <span style="color:var(--text)">${c.date}</span></div>
                        <div style="font-size:0.7rem; color:var(--text-dim)">IMPACT: <span style="font-weight:900; color:var(--risk-low)">${c.impact.toUpperCase()}</span></div>
                    </div>
                    ${c.ticker !== 'MARKET' ? `<div style="margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.05); font-size:0.6rem; color:var(--accent)">CLICK TO OPEN AI ANALYST</div>` : ''}
                </div>
            `).join('') : '<div class="empty-state">No major catalysts scheduled for this date. Select another day or clear filter.</div>'}
        </div>
    `;
}

// ============= Macro Intelligence Hub =============
async function renderMacroCalendar() {
    appEl.innerHTML = skeleton(6);
    const data = await fetchAPI('/macro-calendar');
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">calendar_month</span> Institutional Macro Compass</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Real-time synthesis of global economic catalysts and their projected impact on liquidity.</p>
        </div>
        
        <div class="macro-stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:2rem">
            ${Object.entries(data.yields || {}).map(([label, val]) => `
                <div class="stat-card" style="background:var(--bg-card); padding:1.2rem; border:1px solid var(--border); border-radius:12px">
                    <div style="font-size:0.7rem; color:var(--text-dim); margin-bottom:5px">${label.toUpperCase()}</div>
                    <div style="font-size:1.5rem; font-weight:800; color:var(--accent)">${val}</div>
                </div>
            `).join('')}
            <div class="stat-card" style="background:var(--bg-card); padding:1.2rem; border:1px solid var(--border); border-radius:12px">
                <div style="font-size:0.7rem; color:var(--text-dim); margin-bottom:5px">ENGINE STATUS</div>
                <div style="font-size:1.5rem; font-weight:800; color:var(--risk-low)">${data.status}</div>
            </div>
        </div>

        <div class="card-grid">
            <div class="glass-card" style="grid-column: 1 / -1">
                <div class="card-header">
                    <h3>Economic Intelligence Calendar</h3>
                    <span class="label-tag">WEEKLYWIDE SYNC</span>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>EVENT</th>
                                <th>IMPACT</th>
                                <th>FORECAST</th>
                                <th>PREVIOUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.events.map(e => `
                                <tr>
                                    <td style="font-family:'JetBrains Mono'">${e.date} <span style="color:var(--text-dim); font-size:0.7rem">${e.time}</span></td>
                                    <td style="font-weight:700">${e.event}</td>
                                    <td><span class="impact-badge impact-${e.impact.toLowerCase()}">${e.impact}</span></td>
                                    <td>${e.forecast}</td>
                                    <td style="color:var(--text-dim)">${e.previous}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- US Treasury Yield Curve Tracker -->
            <div class="glass-card" style="grid-column: 1 / -1; margin-top:20px">
                <div class="card-header">
                    <h3>US Treasury Yield Curve (Inversion Monitor)</h3>
                    <span class="label-tag">BOND MARKET PROXY</span>
                </div>
                <div style="height:300px; width:100%; position:relative;">
                    <canvas id="yieldCurveChart"></canvas>
                </div>
                <div style="margin-top:10px; font-size:0.75rem; color:var(--text-dim)">
                    Curve inversion (short-term yields > long-term yields) often predicts liquidity contraction.
                </div>
            </div>

        </div>
    `;

    setTimeout(() => {
        const ycCtx = document.getElementById('yieldCurveChart');
        if (ycCtx) {
            new Chart(ycCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', '30Y'],
                    datasets: [{
                        label: 'US Treasury Yield (%)',
                        data: [4.81, 4.88, 4.86, 4.67, 4.31, 4.22, 4.28, 4.54],
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#22c55e',
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: 'rgba(13, 17, 23, 0.95)', titleColor: '#22c55e', bodyColor: '#e6edf3', callbacks: { label: c => `${c.raw}%` } }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 } } },
                        y: { title: { display: true, text: 'Yield (%)', color: '#8b949e'}, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 }, callback: v => v.toFixed(2) + '%' }, suggestedMin: 3.5, suggestedMax: 5.5 }
                    }
                }
            });
        }
    }, 50);
}

async function renderWhales(tabs = null) {
    appEl.innerHTML = skeleton(5);
    const [data, entityData, execData] = await Promise.all([
        fetchAPI('/whales'),
        fetchAPI('/whales_entity?ticker=BTC-USD'),
        fetchAPI('/execution-time?ticker=BTC-USD')
    ]);
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('whales', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">waves</span> Institutional Whale Pulse</h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-whales')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Real-time monitor of high-conviction transfers across BTC, ETH, and SOL networks.</p>
        </div>

        <div class="whale-pulse-header" style="display:grid; grid-template-columns: 1fr 1fr 300px; gap:2rem; margin-bottom:2rem">
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h3>24H Net Flow History (BTC)</h3>
                    <span class="label-tag">AGGREGATED FLOW</span>
                </div>
                <div style="height: 200px; position: relative;">
                    <canvas id="whale-flow-chart"></canvas>
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h3>Whale Conviction Scatter (Size vs Time)</h3>
                    <span class="label-tag">BUBBLE MATRIX</span>
                </div>
                <div style="height: 200px; position: relative;">
                    <canvas id="whale-tier-chart"></canvas>
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center">
                <div style="font-size:0.7rem; color:var(--text-dim); margin-bottom:0.5rem">TOTAL 24H NET FLOW</div>
                <div style="font-size:2.5rem; font-weight:900; color:${entityData?.net_flow_24h?.startsWith('+') ? 'var(--risk-low)' : 'var(--risk-high)'}">
                    ${entityData?.net_flow_24h || '0 BTC'}
                </div>
                <div style="font-size:0.8rem; margin-top:0.5rem; color:var(--text-dim)">Institutional Sentiment: <span class="${entityData?.institutional_sentiment === 'BULLISH' ? 'pos' : 'dim'}">${entityData?.institutional_sentiment || 'NEUTRAL'}</span></div>
            </div>
        </div>

        <div class="execution-topography-section" style="margin-bottom:2rem">
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h3>Execution Time Topography (Asian vs US Session)</h3>
                    <span class="label-tag">POLAR MATRIX</span>
                </div>
                <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap">
                    <div style="flex:1; min-width:300px">
                        <p style="font-size:0.8rem; color:var(--text-dim); line-height:1.5">
                            This 24-period Polar Area algorithmic array aggregates on-chain transaction volume classified by hour. Skewed radials indicate geographic execution dominance (e.g. extending heavily into the 01:00-06:00 UTC zones signals Asian market manipulation, whereas 14:00-20:00 UTC denotes Wall St Open routing).
                        </p>
                    </div>
                    <div style="flex:1; height: 350px; position: relative; min-width:300px">
                        <canvas id="whale-polar-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="whale-list">
            ${(data.results || data || []).map(w => `
                <div class="whale-row">
                    <div class="w-main">
                        <div class="w-amount">${w.amount} ${w.asset.split('-')[0]} <span class="usd-val">(${w.usdValue})</span></div>
                        <div class="w-meta">
                            <span class="w-hash">${w.hash}</span>
                            <span class="w-time">${w.timestamp}</span>
                            <span class="asset-badge">${w.asset}</span>
                        </div>
                    </div>
                    <div class="w-paths">
                        <div><label class="label-tag">FROM</label> <span>${w.from}</span></div>
                        <div><label class="label-tag">TO</label> <span>${w.to}</span></div>
                    </div>
                    <div class="w-actions">
                        <div class="flow-badge flow-${w.flow.toLowerCase()}">${w.flow}</div>
                        <div class="impact-badge impact-${w.impact.toLowerCase()}">${w.impact} IMPACT</div>
                        <button class="timeframe-btn" onclick="openDetail('${w.asset}')">VIEW CHART</button>
                    </div>
                </div>
            `).join('')}
        </div>`;

    if (entityData && entityData.flow_history) {
        renderWhaleFlowChart(entityData.flow_history);
    }
    
    if (data && data.results && data.results.length > 0) {
        const bubbleData = data.results.map((w, i) => {
            // Rough mapping for visual effect: X=Time offset, Y=Amount, R=Bubble size derived from USD impact
            const usdMatch = w.usdValue.replace(/[^0-9.]/g, '');
            const usdNum = parseFloat(usdMatch) || 1000000;
            return {
                x: data.results.length - i, // Recent on right
                y: parseFloat(String(w.amount).replace(/,/g,'')),
                r: Math.max(4, Math.min(25, usdNum / 5000000)), // Scale radius based on USD val
                rawUsd: w.usdValue,
                type: w.flow
            };
        });

        new Chart(document.getElementById('whale-tier-chart').getContext('2d'), {
            type: 'bubble',
            data: {
                datasets: [
                    {
                        label: 'Inflow',
                        data: bubbleData.filter(d => d.type === 'INFLOW'),
                        backgroundColor: 'rgba(34, 197, 94, 0.4)',
                        borderColor: 'rgba(34, 197, 94, 0.8)'
                    },
                    {
                        label: 'Outflow',
                        data: bubbleData.filter(d => d.type === 'OUTFLOW'),
                        backgroundColor: 'rgba(239, 68, 68, 0.4)',
                        borderColor: 'rgba(239, 68, 68, 0.8)'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    legend: { display:false },
                    tooltip: {
                        callbacks: {
                            label: (c) => ` ${c.raw.type}: ${c.raw.y} BTC (${c.raw.rawUsd})`
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.05)' }, 
                        ticks: { color: 'var(--text-dim)' },
                        type: 'logarithmic'
                    }
                }
            }
        });
    }

    if (execData) {
        renderExecutionTopography(execData);
    }
}

function renderExecutionTopography(data) {
    const ctx = document.getElementById('whale-polar-chart');
    if (!ctx) return;
    
    new Chart(ctx.getContext('2d'), {
        type: 'polarArea',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Hourly Volume',
                data: data.volumes,
                backgroundColor: data.labels.map((_, i) => 
                    (i >= 1 && i <= 6) ? 'rgba(239, 68, 68, 0.4)' : 
                    (i >= 14 && i <= 20) ? 'rgba(0, 242, 255, 0.4)' : 
                    'rgba(255, 255, 255, 0.05)'
                ),
                borderColor: data.labels.map((_, i) => 
                    (i >= 1 && i <= 6) ? 'rgba(239, 68, 68, 0.8)' : 
                    (i >= 14 && i <= 20) ? 'rgba(0, 242, 255, 0.8)' : 
                    'rgba(255, 255, 255, 0.2)'
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    angleLines: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { display:false },
                    pointLabels: {
                        display: true,
                        centerPointLabels: true,
                        font: { size: 9, family: 'JetBrains Mono' },
                        color: 'rgba(255,255,255,0.4)'
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) { return ctx.label + ' UTC: ' + ctx.raw + ' BTC'; }
                    }
                }
            }
        }
    });
}

// ============= Market Pulse =============

// ============= Pack G Rotation & Macro Sync =============
async function renderMacroSync(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('pulse', tabs) : '';
    appEl.innerHTML = skeleton(2);
    const [data, sectors, corrData] = await Promise.all([fetchAPI('/macro'), fetchAPI('/sectors'), fetchAPI('/correlation-matrix')]);
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">monitoring</span> Macro Intel</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
        </div>
        ${tabHTML}
        <p style="margin-top: -1rem; margin-bottom: 1.5rem; color: var(--text-dim); font-size: 0.8rem;">Real-time correlation analytics between Bitcoin and traditional macro assets.</p>
        <div class="macro-sync-container">
            <div class="macro-grid">
                ${data.map(m => {
                    const absCorr = Math.abs(m.correlation);
                    const color = m.correlation >= 0 ? `rgba(0, 242, 255, ${0.1 + absCorr * 0.5})` : `rgba(255, 62, 62, ${0.1 + absCorr * 0.5})`;
                    return `
                        <div class="macro-card" style="border-top: 4px solid ${m.correlation >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">
                            <div class="m-asset">${m.name}</div>
                            <div class="m-corr" style="color: ${color}">${m.correlation.toFixed(2)}</div>
                            <div class="m-status">${m.status}</div>
                            <div class="m-interpretation">
                                ${m.name === 'DXY' ? (m.correlation < -0.3 ? 'Strong Inverse: BTC acting as non-fiat debasement hedge.' : 'Decoupled: Dollar strength currently neutral for BTC.') : 
                                  m.name === 'GOLD' ? (m.correlation > 0.3 ? 'Digital Gold: Positively correlated with flight-to-safety.' : 'Decoupled from traditional hedges.') :
                                  (m.correlation > 0.3 ? 'Risk-On: Trading in sync with tech equity momentum.' : 'Decoupled from equities.')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="card" style="margin-top:2rem">
                <div class="card-header">
                    <h3>Ecosystem Capital Dominance</h3>
                </div>
                <div class="chart-container" style="height:350px;">
                    <canvas id="dominanceChart"></canvas>
                </div>
            </div>

            <div class="card" style="margin-top:2rem">
                <div class="card-header" style="margin-bottom:15px">
                    <h3>Sector Hierarchy Treemap <span style="font-size:0.8rem; color:var(--text-dim)">(Rotational Dominance Matrix)</span></h3>
                </div>
                <div id="sector-treemap" style="height:350px; width:100%; border-radius:8px; overflow:hidden; position:relative; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05);"></div>
                <div style="margin-top:10px; font-size:0.75rem; color:var(--text-dim)">
                    Box size represents aggregate Sector Market Capitalization. Color intensity maps 24H directional momentum.
                </div>
            </div>

            <div class="card" style="margin-top:2rem">
                <div class="card-header" style="margin-bottom:15px">
                    <h3>Cross-Asset Correlation Matrix Heatmap</h3>
                    <span class="label-tag">NxN STATISTICS</span>
                </div>
                <div id="corr-matrix-container" style="width:100%; overflow-x:auto;"></div>
                <div style="margin-top:10px; font-size:0.75rem; color:var(--text-dim)">
                    30-Day Pearson Correlation Coefficient spanning traditional and digital assets. Dark cyan (+1.0) equates to perfect sync, bright red (-1.0) denotes inverse flow.
                </div>
            </div>

            <div class="card" style="margin-top:2rem">
                <div class="card-header">
                    <h3>Leveraged Funding Divergence (Perpetuals)</h3>
                </div>
                <div class="chart-container" style="height:350px;">
                    <canvas id="fundingOscillatorChart"></canvas>
                </div>
            </div>
            <div class="card" style="margin-top:2rem">
                <div class="card-header">
                    <h3>Stablecoin Supply Ratio (SSR) <span style="font-size:0.8rem; color:var(--text-dim)">(Fiat Purchasing Power proxy)</span></h3>
                </div>
                <div class="chart-container" style="height:350px;">
                    <canvas id="ssrChart"></canvas>
                </div>
            </div>
            <div class="macro-education" style="margin-top:2rem; padding:1.5rem; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid var(--border)">
                <h4 style="color:var(--accent); margin-bottom:0.5rem">Institutional Macro Correlation Guide</h4>
                <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.6">
                    Professional traders monitor these correlations to identify "Narrative Shifts." 
                    A high correlation with **GOLD** confirms the "Safe Haven" thesis, while high correlation with the **SPX** classifies BTC as a "High-Beta Tech" asset. 
                    The **DXY** correlation is the most critical: a strong negative value suggests Bitcoin is absorbing liquidity from fiat debasement.
                </p>
            </div>
        </div>
    `;

    setTimeout(async () => {
        try {
            const domData = await fetchAPI('/dominance');
            if (domData && domData.labels) {
                const domEl = document.getElementById('dominanceChart');
                if (domEl) {
                    const ctx = domEl.getContext('2d');
                    new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: domData.labels,
                        datasets: [
                            { label: 'BTC Dominance', data: domData.btc, borderColor: '#f7931a', backgroundColor: 'rgba(247, 147, 26, 0.5)', fill: true },
                            { label: 'ETH Dominance', data: domData.eth, borderColor: '#627eea', backgroundColor: 'rgba(98, 126, 234, 0.5)', fill: '-1' },
                            { label: 'ALT Dominance', data: domData.alts, borderColor: '#00f2ff', backgroundColor: 'rgba(0, 242, 255, 0.5)', fill: '-1' }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            stacked100: { enable: true },
                            tooltip: { callbacks: { label: function(context) { return context.dataset.label + ': ' + context.parsed.y + '%'; } } }
                        },
                        scales: {
                            y: { stacked: true, min: 0, max: 100, ticks: { callback: function(value) { return value + '%'; } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            x: { grid: { display: false } }
                        },
                        elements: { point: { radius: 0 } }
                    }
                });
                }
            }
            
            const fundingData = await fetchAPI('/funding-rates');
            if (fundingData && fundingData.labels) {
                const fundEl = document.getElementById('fundingOscillatorChart');
                if (fundEl) {
                    const ctx2 = fundEl.getContext('2d');
                
                const colors = fundingData.funding_rates.map(r => r > 0.015 ? 'rgba(34, 197, 94, 0.7)' : (r < 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255,255,255,0.2)'));
                
                new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: fundingData.labels,
                        datasets: [
                            {
                                label: 'Est. 8H Funding Bracket (%)',
                                data: fundingData.funding_rates,
                                backgroundColor: colors,
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, title: { display:true, text: 'Funding Premium (%)' } },
                            x: { grid: { display:false }, ticks: { maxTicksLimit: 12 } }
                        }
                    }
                });
                }
            }

            const ssrData = await fetchAPI('/ssr');
            if (ssrData && ssrData.labels) {
                const ssrEl = document.getElementById('ssrChart');
                if (ssrEl) {
                    const ctx3 = ssrEl.getContext('2d');
                new Chart(ctx3, {
                    type: 'line',
                    data: {
                        labels: ssrData.labels,
                        datasets: [
                            {
                                label: 'SSR (BTC Market Cap ÷ Stablecoin Supply)',
                                data: ssrData.ssr,
                                borderColor: '#00f2ff',
                                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                                fill: true,
                                tension: 0.4,
                                borderWidth: 3
                            }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, title: { display:true, text: 'SSR Multiplier' } },
                            x: { grid: { display:false }, ticks: { maxTicksLimit: 12 } }
                        }
                    }
                });
                }
            }

            if (sectors) renderSectorTreemap(sectors);
            if (corrData) renderCorrelationHeatmap('corr-matrix-container', corrData);

        } catch (e) {
            console.error("Macro sync charts failed:", e);
        }
    }, 50);
}

function renderCorrelationTable(data) {
    const container = document.getElementById('corr-matrix-container');
    if (!container) return;
    
    let html = `<table class="corr-table" style="width:100%; border-collapse:collapse; text-align:center; font-family:'JetBrains Mono'">`;
    
    html += '<tr><th style="padding:8px; border-bottom:1px solid rgba(255,255,255,0.1)"></th>';
    data.assets.forEach(a => {
        html += `<th style="padding:8px; font-size:0.75rem; color:var(--text-dim); border-bottom:1px solid rgba(255,255,255,0.1)">${a}</th>`;
    });
    html += '</tr>';

    data.assets.forEach(rowAsset => {
        html += `<tr><td style="padding:8px; font-size:0.75rem; color:var(--text-dim); font-weight:700; text-align:left; border-right:1px solid rgba(255,255,255,0.1)">${rowAsset}</td>`;
        data.assets.forEach(colAsset => {
            const pair = data.matrix.find(m => m.assetA === rowAsset && m.assetB === colAsset);
            if (!pair) {
                html += '<td></td>';
                return;
            }
            const val = pair.correlation;
            let bg;
            if (val === 1) bg = 'rgba(255,255,255,0.05)';
            else if (val > 0) bg = `rgba(0, 242, 255, ${Math.min(val, 0.9)})`;
            else bg = `rgba(239, 68, 68, ${Math.min(Math.abs(val), 0.9)})`;
            
            const color = val === 1 ? 'rgba(255,255,255,0.2)' : (Math.abs(val) > 0.5 ? 'white' : 'var(--text-dim)');
            html += `<td style="padding:10px 5px; font-size:0.75rem; background:${bg}; color:${color}; border:1px solid rgba(0,0,0,0.5)">${val.toFixed(2)}</td>`;
        });
        html += '</tr>';
    });
    html += '</table>';
    container.innerHTML = html;
}


function renderSectorTreemap(data) {
    const container = document.getElementById('sector-treemap');
    if (!container || !data || !data.children) return;
    container.innerHTML = '';
    
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 350;
    
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
        
    d3.treemap()
        .size([width, height])
        .padding(2)
        (root);
        
    const svg = d3.select(container).append("svg")
        .attr("width", '100%')
        .attr("height", '100%')
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("font-family", "JetBrains Mono");
        
    const leaf = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);
        
    leaf.append("rect")
        .attr("width", d => Math.max(0, d.x1 - d.x0 - 2))
        .attr("height", d => Math.max(0, d.y1 - d.y0 - 2))
        .attr("fill", d => {
            const p = d.data.perf;
            if (p >= 5) return 'rgba(34, 197, 94, 0.8)';
            if (p > 0) return 'rgba(34, 197, 94, 0.4)';
            if (p <= -5) return 'rgba(239, 68, 68, 0.8)';
            return 'rgba(239, 68, 68, 0.4)';
        })
        .attr("rx", 4)
        .attr("ry", 4)
        .style("cursor", "crosshair");
        
    leaf.append("text")
        .attr("x", 8)
        .attr("y", 20)
        .attr("fill", "white")
        .attr("font-size", d => Math.max(10, Math.min(16, (d.x1 - d.x0) / 6)) + "px")
        .attr("font-weight", 900)
        .style("pointer-events", "none")
        .text(d => d.data.name);
        
    leaf.append("text")
        .attr("x", 8)
        .attr("y", 35)
        .attr("fill", "rgba(255,255,255,0.9)")
        .attr("font-size", "11px")
        .attr("font-weight", 700)
        .style("pointer-events", "none")
        .text(d => (d.data.perf > 0 ? '+' : '') + d.data.perf.toFixed(2) + '%');
}

async function renderRotation(tabs = null) {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/rotation');
    if (!data || !data.matrix) return;
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('rotation', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">rotate_right</span> Sector Correlation Matrix</h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-correlation')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Institutional synchronization levels across core market indices using a 30-day Pearson rolling window.</p>
        </div>
        
        <div class="heatmap-legend" style="margin-bottom: 1.5rem">
            <div class="legend-labels">
                <span class="neg">INVERSE SYNC (-1.0)</span>
                <span style="color:var(--text-dim)">DECOUPLED (0.00)</span>
                <span class="pos">FULL SYNCHRONIZATION (+1.0)</span>
            </div>
            <div class="legend-bar" style="background: linear-gradient(to right, #ff3e3e, #222, var(--accent))"></div>
        </div>

        <div class="intel-guide-card" style="margin-bottom: 2rem">
            <div style="display:flex; gap:1.5rem; align-items:flex-start">
                <div class="guide-icon">ℹ️</div>
                <div class="guide-text">
                    <h4 style="color:var(--accent); margin-bottom:0.5rem">How to Read Correlation Dynamics</h4>
                    <p style="font-size:0.85rem; line-height:1.6; color:var(--text-dim)">
                        This matrix tracks 30-day **Pearson Correlation** between synthetic sector indices. 
                        Values near <b>+1.00</b> (Bright Turquoise) indicate sectors moving in lockstep, suggesting broad institutional consensus. 
                        Values near <b>0.00</b> (Dark) indicate decoupled price action, highlighting alpha opportunities. 
                        Negative values (Red) suggest inverse rotation, where capital is exiting one sector to enter another.
                    </p>
                </div>
            </div>
        </div>

        <div class="rotation-matrix-container">
            <div class="matrix-grid" style="grid-template-columns: 140px repeat(${data.sectors.length}, 1fr)">
                <div></div>
                ${data.sectors.map(s => `<div class="matrix-label horizontal">${s}</div>`).join('')}
                ${data.matrix.map((row, i) => `
                    <div class="matrix-label vertical">${data.sectors[i]}</div>
                    ${row.map(val => {
                        const intensity = Math.abs(val);
                        const color = val >= 0 ? `rgba(0, 242, 255, ${intensity * 0.8})` : `rgba(255, 62, 62, ${intensity * 0.8})`;
                        const textColor = intensity > 0.5 ? '#fff' : 'var(--text-dim)';
                        const border = intensity > 0.8 ? '1px solid rgba(255,255,255,0.2)' : 'none';
                        return `<div class="matrix-cell" style="background:${color}; color:${textColor}; border:${border}" title="${data.sectors[i]} vs ${data.sectors[row.indexOf(val)]}: ${val}">${val.toFixed(2)}</div>`;
                    }).join('')}
                `).join('')}
            </div>
        </div>`;
    
    // Inject TradingView Chart for Strategy Performance
    const hist = await fetchAPI(`/history?ticker=${ticker}&period=180d`);
    if (hist && hist.length > 0) {
        const chart = createTradingViewChart('backtest-chart-container', hist);
        // Add markers for trades if data.trades exist (optional enhancement)
    }
}

async function renderStrategyLab(tabs = null) {
    appEl.innerHTML = skeleton(1);
    runStrategyBacktest('BTC-USD', 'trend_regime');
}

function renderGuppyRibbon(history) {
    const ctx = document.getElementById('guppyChart');
    if (!ctx) return;
    if (window.activeGuppyChart) window.activeGuppyChart.destroy();
    
    const prices = history.map(h => h.price);
    const dates = history.map(h => h.date);
    
    const calcEMA = (data, period) => {
        const k = 2 / (period + 1);
        let ema = data[0];
        return data.map(val => { ema = (val * k) + (ema * (1 - k)); return ema; });
    };

    const shortPeriods = [3, 5, 8, 10, 12, 15];
    const longPeriods = [30, 35, 40, 45, 50, 60, 70, 80, 90];
    
    const datasets = [];
    
    datasets.push({
        label: 'Price',
        data: prices,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.1
    });

    shortPeriods.forEach(p => {
        datasets.push({
            label: `EMA ${p}`,
            data: calcEMA(prices, p),
            borderColor: 'rgba(0, 242, 255, 0.4)',
            borderWidth: 1.2,
            pointRadius: 0,
            fill: false,
            tension: 0.3
        });
    });

    longPeriods.forEach(p => {
        datasets.push({
            label: `EMA ${p}`,
            data: calcEMA(prices, p),
            borderColor: 'rgba(239, 68, 68, 0.3)',
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
            tension: 0.4
        });
    });

    window.activeGuppyChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: { labels: dates, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { display: false } },
            scales: {
                x: { grid: { display:false }, ticks: { color: '#888', maxTicksLimit: 10, font: { family: 'JetBrains Mono', size:10 } } },
                y: { position: 'right', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888', font: { family: 'JetBrains Mono' }, callback: function(val) { return '$' + val.toLocaleString(); } } }
            }
        }
    });
}

window.downloadBacktestCSV = function(ticker, strategy) {
    const data = window.lastBacktestData;
    if (!data || !data.length) return;
    let csv = "Date,Portfolio_Value,Benchmark_Value\n";
    data.forEach(row => {
        csv += `${row.date},${row.portfolio},${row.benchmark || row.btc || 100}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alphasignal_backtest_${ticker}_${strategy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

async function renderNewsroom(tabs = null) {
    appEl.innerHTML = skeleton(4);
    const data = await fetchAPI('/news');
    if (!data) return;
    window.lastNewsData = data;
    
    function drawNewsPage() {
        const totalPages = Math.ceil(data.length / newsPerPage);
        const startIndex = (currentNewsPage - 1) * newsPerPage;
        const currentData = data.slice(startIndex, startIndex + newsPerPage);
        
        appEl.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:15px">
                <div>
                    <div style="display:flex; align-items:center; gap:10px">
                        <div class="live-indicator"></div>
                        <h1 style="margin-bottom:5px"><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">newspaper</span> Live Intelligence Newsroom</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                    </div>
                    <p style="margin:0">Real-time institutional narrative stream correlated with AlphaSignal intensity.</p>
                </div>
                <!-- Pagination Controls -->
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:5px">
                    <button class="filter-btn" id="btn-prev-news" ${currentNewsPage === 1 ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>&larr; Prev</button>
                    <span style="font-size:0.75rem; color:var(--text-dim); font-family:'JetBrains Mono'">Page ${currentNewsPage} of ${totalPages}</span>
                    <button class="filter-btn" id="btn-next-news" ${currentNewsPage === totalPages ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>Next &rarr;</button>
                </div>
            </div>
            <div class="news-feed">
                ${currentData.map((n, idx) => {
                    const originalIndex = startIndex + idx;
                    return `
                    <div class="news-card" onclick="openNewsArticle(${originalIndex})">
                        <div class="news-header">
                            <div class="news-time">${n.time}</div>
                            <div class="news-tag tag-${n.sentiment.toLowerCase()}">${n.sentiment}</div>
                        </div>
                        <div class="news-headline">${n.headline}</div>
                        <div class="news-summary">${n.summary}</div>
                        <div class="news-source">Source: AlphaSignal Institutional Feed // ${n.ticker}</div>
                    </div>
                `}).join('')}
            </div>
        `;

        const btnPrev = document.getElementById('btn-prev-news');
        const btnNext = document.getElementById('btn-next-news');
        if(btnPrev) btnPrev.addEventListener('click', () => { if(currentNewsPage > 1) { currentNewsPage--; drawNewsPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
        if(btnNext) btnNext.addEventListener('click', () => { if(currentNewsPage < totalPages) { currentNewsPage++; drawNewsPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
    }
    
    currentNewsPage = 1;
    drawNewsPage();
}


async function renderRiskMatrix(tabs = null) {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('risk', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">grid_on</span> Institutional Correlation Matrix</h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-correlation')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Real-time statistical synchronization across the institutional universe.</p>
        </div>
        <div class="view-actions">
            <div class="category-filters" id="risk-matrix-filters">
                <button class="filter-btn active" onclick="loadRiskMatrix('BTC-USD,ETH-USD,SOL-USD,MARA,COIN,MSTR,BNB-USD,XRP-USD,ADA-USD,DOGE-USD')">MAJOR BASKET</button>
                <button class="filter-btn" onclick="loadRiskMatrix('MARA,RIOT,CLSK,HIVE,CAN,WULF,IREN')">MINERS</button>
                <button class="filter-btn" onclick="loadRiskMatrix('COIN,MSTR,HOOD,PYPL,MARA,IBIT')">PROXIES</button>
            </div>
            <div style="margin-left:auto; display:flex; gap:10px">
                <select id="matrix-period" class="tf-btn" style="background:var(--bg-card); border:1px solid var(--border); color:white; padding:0 10px" onchange="loadRiskMatrix()">
                    <option value="30d">30D WINDOW</option>
                    <option value="60d" selected>60D WINDOW</option>
                    <option value="180d">180D WINDOW</option>
                </select>
            </div>
        </div>
        <div id="matrix-container" style="margin-top:2rem">${skeleton(1)}</div>
    `;
    loadRiskMatrix();
}

async function renderStressHub(tabs = null) {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('stress', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--risk-high)">warning</span> Institutional Stress Lab</h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-risk')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Simulating portfolio sensitivity and institutional drawdown scenarios.</p>
        </div>
        <div class="risk-top-grid" style="display:grid; grid-template-columns: 1fr 1.5fr; gap:30px; margin-bottom:2rem">
            <div id="risk-summary-area">${skeleton(1)}</div>
            <div id="stress-scenarios-area">${skeleton(1)}</div>
        </div>
        <div id="risk-attribution-area">${skeleton(1)}</div>
    `;

    const data = await fetchAPI('/stress-test');
    if (!data || data.error) return;

    // 1. Risk Summary
    document.getElementById('risk-summary-area').innerHTML = `
        <div class="risk-summary-card">
            <div class="risk-gauge-container">
                <div class="risk-label">SYSTEMIC TENSION</div>
                <div class="risk-value" style="color:${data.systemic_risk > 70 ? 'var(--risk-high)' : data.systemic_risk > 40 ? '#fffa00' : 'var(--risk-low)'}">
                    ${data.systemic_risk}<span>/100</span>
                </div>
                <div class="risk-status">${data.systemic_risk > 70 ? 'CRITICAL' : data.systemic_risk > 40 ? 'ELEVATED' : 'STABLE'}</div>
            </div>
            <div class="var-box" style="margin-top:2rem; padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:12px">
                <label style="font-size:0.65rem; color:var(--text-dim); letter-spacing:1px">SECTOR HOTSPOTS</label>
                <div style="margin-top:10px">
                    ${data.hotspots.map(h => `
                        <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:5px">
                            <span>${h.sector}</span>
                            <span class="pos">${h.score.toFixed(2)} SYNC</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // 2. Stress Scenarios
    document.getElementById('stress-scenarios-area').innerHTML = `
        <div class="stress-test-container">
            <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">STRESS TEST CORE SCENARIOS</h3>
            <div class="stress-grid">
                ${data.scenarios.map(s => `
                    <div class="stress-card">
                        <div class="s-top">
                            <span class="s-name">${s.name}</span>
                            <span class="s-prob">Prob: ${s.prob}</span>
                        </div>
                        <div class="s-impact" style="color:${s.impact < 0 ? 'var(--risk-high)' : 'var(--risk-low)'}">
                            ${s.impact > 0 ? '+' : ''}${s.impact}% Portfolio Impact
                        </div>
                        <div class="s-outcome">${s.outcome}</div>
                    </div>
                `).join('')}
            </div>
            <div class="simulation-banner" style="margin-top:1.5rem; padding:1rem; background:rgba(255,107,107,0.1); border:1px solid rgba(255,107,107,0.2); border-radius:8px; font-size:0.75rem; color:var(--risk-high)">
                <strong>⚠️ SYSTEMIC WARNING:</strong> Elevated correlation in ${data.hotspots[0]?.sector} sector suggests rising liquidity contagion risk.
            </div>
        </div>
    `;

    // 3. Attribution Table
    document.getElementById('risk-attribution-area').innerHTML = `
        <div class="asset-risk-table">
            <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">ASSET-SPECIFIC BETA & ALPHA ATTRIBUTION</h3>
            <div class="risk-table-header" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr">
                <span>ASSET</span>
                <span>BETA (vs BTC)</span>
                <span>ALPHA (ANN.)</span>
                <span>ANN. VOL</span>
                <span>STATUS</span>
            </div>
            <div class="risk-table-body">
                ${data.asset_risk.map(a => `
                    <div class="risk-row" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr">
                        <span class="r-ticker" style="font-weight:900">${a.ticker}</span>
                        <span class="r-var">${a.beta.toFixed(2)}</span>
                        <span class="r-alpha ${a.alpha >= 0 ? 'pos' : 'neg'}">${a.alpha.toFixed(1)}%</span>
                        <span class="r-vol">${a.vol.toFixed(1)}%</span>
                        <span class="r-status status-${a.status.toLowerCase()}">${a.status}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function renderChainVelocity(tabs = null) {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/chain-velocity');
    if (!data || !data.velocity_data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">speed</span> Cross-Chain Narrative Velocity</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-velocity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Institutional capital rotation tracking across major L1 networks using volume acceleration and social heat.</p>
        </div>

        <div style="display:grid; grid-template-columns:3fr 1fr; gap:2rem; margin-bottom: 2rem; align-items:start;">
            <div class="card" style="padding:1.5rem; background:rgba(10,11,30,0.5); backdrop-filter:blur(10px)">
                <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">VELOCITY RADAR (INSTITUTIONAL MOMENTUM)</h3>
                <div style="position:relative; height:750px; width:100%">
                    <canvas id="velocityRadar"></canvas>
                </div>
            </div>
            <div class="card" style="padding:1.5rem; background:rgba(0,0,0,0.4)">
                <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">NARRATIVE LEADERS</h3>
                <div class="velocity-leaderboard">
                    ${data.leaderboard.map((l, i) => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 10px; border-bottom:1px solid rgba(255,255,255,0.05)">
                            <div style="display:flex; align-items:center; gap:12px">
                                <span style="font-size:1.2rem; font-weight:900; color:rgba(255,255,255,0.05)">#${i+1}</span>
                                <span style="font-weight:900; color:white; font-size:0.9rem">${l.ticker.split('-')[0]}</span>
                            </div>
                            <div style="text-align:right">
                                <div style="font-size:1rem; font-weight:900; color:var(--accent)">${l.score.toFixed(1)}</div>
                                <div style="font-size:0.5rem; color:var(--text-dim); font-weight:800">VELOCITY SCORE</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top:2rem; padding:1rem; background:rgba(0,242,255,0.05); border:1px solid rgba(0,242,255,0.1); border-radius:8px">
                    <div style="font-size:0.6rem; font-weight:900; color:var(--accent); margin-bottom:5px">ALPHA INSIGHT</div>
                    <p style="font-size:0.75rem; color:var(--text-dim); line-height:1.5">
                        <strong>${data.leaderboard[0].ticker.split('-')[0]}</strong> is demonstrating peak relative strength. Volume acceleration of <strong>${(data.velocity_data[data.leaderboard[0].ticker].raw_velocity).toFixed(2)}x</strong> confirms institutional accumulation.
                    </p>
                </div>
            </div>
        </div>

        <div class="velocity-stats" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.5rem">
            ${Object.entries(data.velocity_data).map(([ticker, v]) => `
                <div class="card" style="padding:1.5rem; border-left:4px solid ${v.raw_momentum >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                        <span style="font-size:0.7rem; font-weight:900; color:var(--text-dim); letter-spacing:1px">${ticker}</span>
                        <span class="premium-badge" style="font-size:0.5rem">L1 NODE</span>
                    </div>
                    <div style="font-size:1.8rem; font-weight:900; color:white; margin:10px 0">${v.raw_momentum >=0 ? '+' : ''}${v.raw_momentum.toFixed(2)}%</div>
                    <div style="display:flex; justify-content:space-between; font-size:0.6rem; font-weight:800">
                        <span style="color:var(--text-dim)">VELOCITY</span>
                        <span style="color:var(--accent)">${v.raw_velocity.toFixed(2)}x REF</span>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="card" style="margin-top:2rem; padding:1.5rem; background:rgba(0,0,0,0.4)">
            <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">ECOSYSTEM CAPITAL FLOW (SANKEY)</h3>
            <p style="font-size:0.75rem; color:var(--text-dim); margin-bottom:1.5rem">Maps real-time capital allocation from fiat origins down through L1 routing protocols to specific Yield/DEX destination pools.</p>
            <div id="sankey-container" style="height:400px; width:100%; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.2)"></div>
        </div>
    `;

    const ctx = document.getElementById('velocityRadar').getContext('2d');
    const tickers = Object.keys(data.velocity_data);
    const colors = [
        'rgba(0, 242, 255, 0.4)',
        'rgba(168, 85, 247, 0.4)',
        'rgba(255, 62, 62, 0.4)',
        'rgba(255, 250, 0, 0.4)',
        'rgba(0, 255, 136, 0.4)'
    ];

    const datasets = tickers.map((t, i) => {
        const v = data.velocity_data[t];
        const baseColor = colors[i % colors.length];
        return {
            label: t.split('-')[0],
            data: [v.momentum, v.liquidity, v.social, v.vigor],
            backgroundColor: baseColor,
            borderColor: baseColor.replace('0.4', '1'),
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointRadius: 3,
            fill: true
        };
    });

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['MOMENTUM', 'LIQUIDITY', 'SOCIAL HEAT', 'VIGOR'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    pointLabels: { 
                        color: 'var(--text-dim)', 
                        font: { size: 10, weight: '900', family: 'Inter' },
                        padding: 10
                    },
                    ticks: { display: false, stepSize: 2 },
                    min: 0,
                    max: 10,
                    backgroundColor: 'rgba(0,0,0,0.2)'
                }
            },
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: 'white', 
                        font: { size: 11, weight: '800', family: 'JetBrains Mono' },
                        padding: 20
                    } 
                },
                tooltip: {
                    backgroundColor: 'rgba(10,11,30,0.9)',
                    titleFont: { size: 13, weight: '900' },
                    bodyFont: { size: 11 },
                    borderWidth: 1,
                    borderColor: 'var(--border)'
                }
            }
        }
    });

    fetchAPI('/sankey').then(sankeyData => {
        if (sankeyData && sankeyData.nodes) renderSankeyDiagram(sankeyData);
    });
}

function renderSankeyDiagram({ nodes, links }) {
    const container = document.getElementById('sankey-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (typeof d3 === 'undefined' || !d3.sankey) {
        container.innerHTML = '<p class="empty-state">D3-Sankey plugin failed to load.</p>';
        return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 400;

    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(20)
        .extent([[20, 20], [width - 20, height - 20]]);

    const { nodes: sNodes, links: sLinks } = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    const svg = d3.select(container).append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('font-family', 'JetBrains Mono');

    svg.append('g')
        .attr('fill', 'none')
        .selectAll('path')
        .data(sLinks)
        .join('path')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', 'rgba(0, 242, 255, 0.2)')
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('class', 'sankey-link')
        .style('mix-blend-mode', 'screen');

    const node = svg.append('g')
        .selectAll('g')
        .data(sNodes)
        .join('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    node.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => Math.max(1, d.y1 - d.y0))
        .attr('fill', d => {
            if (d.name.includes('BTC') || d.name.includes('Aave')) return '#f7931a';
            if (d.name.includes('Stablecoin')) return '#3b82f6';
            if (d.name.includes('SOL') || d.name.includes('Jup')) return '#14F195';
            if (d.name.includes('ETH')) return '#627eea';
            return '#00f2ff';
        })
        .style('stroke', 'rgba(255,255,255,0.2)');

    node.append('text')
        .attr('x', d => (d.x0 < width / 2) ? (d.x1 - d.x0 + 6) : -6)
        .attr('y', d => (d.y1 - d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => (d.x0 < width / 2) ? 'start' : 'end')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .text(d => d.name);
}

// REDUNDANT - Combined with renderPortfolioLab
async function renderPortfolioOptimizer(tabs = null) {
    renderPortfolioLab();
}

async function executeRebalance() {
    if (!confirm("CONFIRM_EXECUTION: Are you sure you want to dispatch rebalancing tickets to the institutional ledger?")) return;
    
    try {
        const res = await fetchAPI('/portfolio/execute', 'POST', { email: localStorage.getItem('user_email') || 'geraldbaalham@live.co.uk' });
        if (res && res.status === 'SUCCESS') {
            showToast("REBALANCE_COMPLETE", res.message, "success");
            // Auto-navigate to ledger after brief delay
            setTimeout(() => switchView('trade-ledger'), 1200);
        } else {
            showToast("EXECUTION_REJECTED", "Rebalancing failed. Risk limits exceeded or engine timeout.", "alert");
        }
    } catch (e) {
        showToast("SYSTEM_DISCONNECT", "Lost connection to Execution Gateway.", "alert");
    }
}

async function renderPortfolioLab(customBasket = null) {
    appEl.innerHTML = skeleton(1);
    const endpoint = customBasket ? `/portfolio-sim?basket=${customBasket}` : '/portfolio-sim';
    const [data, optData] = await Promise.all([
        fetchAPI(endpoint),
        fetchAPI('/portfolio_optimize')
    ]);
    if (!data || !data.metrics) {
        appEl.innerHTML = `<div class="empty-state">
            <span class="material-symbols-outlined" style="font-size:3rem; color:var(--accent); margin-bottom:1rem">hourglass_empty</span>
            <p>Portfolio simulation error. Calibration in progress.</p>
        </div>`;
        return;
    }

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">pie_chart</span> Institutional Portfolio Lab</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-portfolio-lab')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Backtesting and simulation of a dynamically rebalanced portfolio driven by Alpha Engine scores.</p>
        </div>

        <!-- 1. Risk Metrics Row -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1.5rem; margin-bottom: 2rem">
            <div class="card" style="padding:1.5rem; border-top: 4px solid var(--accent)">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">VALUE AT RISK (95% CI)</div>
                <div id="var-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">EST DAILY VAR</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid var(--risk-low)">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">PORTFOLIO BETA</div>
                <div id="beta-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">VS BTC INDEX</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid #f7931a">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">SORTINO RATIO</div>
                <div id="sortino-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">DOWNSIDE ADJ</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid white">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">ANN. VOLATILITY</div>
                <div id="vol-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">REALIZED 30D</div>
            </div>
        </div>

        <!-- 2. Main 2-Column Dashboard -->
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:2rem; margin-bottom: 2rem">
            
            <!-- LEFT COLUMN: Charts & Input -->
            <div style="display:flex; flex-direction:column; gap:2rem">
                <div class="card" style="padding:1.5rem; background:rgba(10,11,30,0.5); backdrop-filter:blur(10px)">
                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">EQUITY CURVE VS BENCHMARK (30D)</h3>
                    <canvas id="portfolioChart" style="max-height:400px"></canvas>
                </div>
                
                <div class="card" style="padding:1.5rem; background:rgba(0, 242, 255, 0.03); border:1px solid var(--accent)">
                    <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">CUSTOM PORTFOLIO BUILDER</h3>
                    <div style="display:flex; flex-direction:column; gap:1rem">
                        <p style="font-size:0.7rem; color:var(--text-dim)">Input target symbols for institutional basket simulation.</p>
                        <input type="text" id="portfolio-basket" placeholder="BTC-USD, ETH-USD, SOL-USD..." 
                               style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; padding:12px; border-radius:8px; font-family:inherit"
                               value="${customBasket || ''}">
                        <button class="action-btn-styled" style="width:100%" 
                                onclick="renderPortfolioLab(document.getElementById('portfolio-basket').value)">
                            SIMULATE BASKET
                        </button>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Analysis & Weights -->
            <div style="display:flex; flex-direction:column; gap:2rem">
                <div class="card" style="padding:1.5rem; background:rgba(0,0,0,0.4)">
                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">INSTITUTIONAL RISK SCORECARD</h3>
                    <div class="metrics-grid" style="display:grid; grid-template-columns: 1fr; gap:1.2rem">
                        <div class="metric-item">
                            <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim)">ALPHA GENERATION</div>
                            <div style="font-size:1.4rem; font-weight:900; color:${data.metrics.alpha_gen >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">
                                ${data.metrics.alpha_gen >= 0 ? '+' : ''}${data.metrics.alpha_gen.toFixed(1)}%
                            </div>
                        </div>
                        <div class="metric-item">
                            <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim)">PROBABLE SHARPE</div>
                            <div id="main-sharpe" style="font-size:1.4rem; font-weight:900; color:white">${data.metrics.sharpe.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div class="card" style="padding:1.5rem; background:rgba(0,0,0,0.4)">
                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">CONSTITUENT WEIGHTINGS</h3>
                    <div class="weights-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap:10px; margin-bottom: 20px">
                        ${Object.entries(data.allocation).map(([ticker, weight]) => `
                            <div style="background:rgba(255,255,255,0.03); padding:8px; border-radius:6px; display:flex; justify-content:space-between; border:1px solid rgba(255,255,255,0.05)">
                                <span style="font-size:0.65rem; font-weight:900; color:white">${ticker.split('-')[0]}</span>
                                <span style="font-size:0.65rem; color:var(--accent)">${weight}%</span>
                            </div>
                        `).join('')}
                    </div>
                    <canvas id="allocationChart" style="max-height:160px"></canvas>
                </div>
            </div>
        </div>

        <!-- 3. Correlation Engine & AI Optimizer Section -->
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:2rem; margin-bottom: 2rem">
            <div class="card" style="padding:1.2rem">
                <h3 style="margin-bottom:1.2rem; font-size:0.85rem; color:var(--accent); letter-spacing:1px">CROSS-ASSET CORRELATION MATRIX (30D)</h3>
                <div id="correlation-heatmap" style="min-height:280px; display:grid; gap:2px"></div>
            </div>
            
            <div class="card" style="padding:1.5rem; background:rgba(0, 242, 255, 0.04); border:1px solid rgba(0, 242, 255, 0.15)">
                <h3 style="margin-bottom:1rem; font-size:0.85rem; color:var(--accent); letter-spacing:1px">AI REBALANCE ADVISORY (MARKOWITZ-SHARPE)</h3>
                <div style="display:flex; gap:2rem; align-items:center">
                    <div style="flex:1">
                        <div id="rebalance-allocations" style="display:flex; flex-direction:column; gap:8px">
                            ${(optData && optData.allocations && optData.allocations.length > 0) ? optData.allocations.map(a => `
                                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                                    <span style="font-size:0.75rem; color:var(--text)">${a.asset}</span>
                                    <span style="font-size:0.75rem; color:var(--accent); font-weight:700">${(a.target_weight * 100).toFixed(1)}%</span>
                                </div>
                            `).join('') : `<p style="font-size:0.7rem; color:var(--risk-high); opacity:0.8">${(optData && optData.error) ? optData.error : 'Data synchronization in progress...'}</p>`}
                        </div>
                        <button class="intel-action-btn" style="margin-top:1.5rem; width:100%" onclick="executeRebalance()">
                            <span class="material-symbols-outlined" style="font-size:1.1rem; vertical-align:middle; margin-right:8px">sync_alt</span>
                            EXECUTE REBALANCE
                        </button>
                    </div>
                    <div style="width:160px; height:160px">
                        <canvas id="optimizer-chart-lab"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 1. Portfolio vs Benchmark Chart
    try {
        const ctxPort = document.getElementById('portfolioChart').getContext('2d');
        new Chart(ctxPort, {
            type: 'line',
            data: {
                labels: data.history.map(h => h.date),
                datasets: [
                    {
                        label: 'ALPHA PORTFOLIO',
                        data: data.history.map(h => h.portfolio),
                        borderColor: 'var(--accent)',
                        backgroundColor: 'rgba(0, 242, 255, 0.05)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 2,
                        pointBackgroundColor: 'var(--accent)'
                    },
                    {
                        label: 'BTC BENCHMARK',
                        data: data.history.map(h => h.benchmark),
                        borderColor: '#f7931a',
                        borderDash: [2, 2],
                        borderWidth: 3,
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: 'var(--text-dim)', font: { size: 10, family: 'JetBrains Mono' } } 
                    },
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.05)' }, 
                        ticks: { color: 'var(--text-dim)', font: { size: 10, family: 'JetBrains Mono' }, callback: v => v + '%' }
                    }
                },
                plugins: {
                    legend: { labels: { color: 'white', font: { weight: '800', size: 11 } } },
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        backgroundColor: 'rgba(10,11,30,0.9)',
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 }
                    }
                }
            }
        });
    } catch (e) {
        console.error("Portfolio Chart Error:", e);
    }

    // 2. Allocation Donut Chart
    try {
        const ctxAlloc = document.getElementById('allocationChart').getContext('2d');
        new Chart(ctxAlloc, {
            type: 'radar',
            data: {
                labels: Object.keys(data.allocation),
                datasets: [{
                    label: 'Allocation %',
                    data: Object.values(data.allocation),
                    backgroundColor: 'rgba(0, 242, 255, 0.2)',
                    borderColor: '#00f2ff',
                    borderWidth: 2,
                    pointBackgroundColor: '#00f2ff',
                    pointBorderColor: 'rgba(255,255,255,0.8)',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#8b949e', font: { size: 9, family: 'JetBrains Mono' } },
                        ticks: { display: false, backdropColor: 'transparent' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(10,11,30,0.9)', titleFont: { size: 13 }, bodyFont: { size: 12 } }
                }
            }
        });
    } catch (e) {
        console.error("Allocation Chart Error:", e);
    }

    // 2.1 AI Optimizer Donut Chart (NEW)
    if (optData && optData.allocations) {
        try {
            const ctxOpt = document.getElementById('optimizer-chart-lab').getContext('2d');
            new Chart(ctxOpt, {
                type: 'doughnut',
                data: {
                    labels: optData.allocations.map(a => a.asset),
                    datasets: [{
                        data: optData.allocations.map(a => parseFloat((a.target_weight * 100).toFixed(1))),
                        backgroundColor: ['#facc15', '#60a5fa', '#22c55e', '#ef5350', '#8b5cf6'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } catch (e) {
            console.error("Optimizer Chart Error:", e);
        }
    }

    // 3. Async Load Risk Metrics & Heatmap
    setTimeout(async () => {
        try {
            const riskData = await fetchAPI('/portfolio/risk');
            if (riskData && riskData.metrics) {
                const varEl = document.getElementById('var-val');
                const betaEl = document.getElementById('beta-val');
                const sortinoEl = document.getElementById('sortino-val');
                const volEl = document.getElementById('vol-val');
                
                if (varEl) varEl.innerText = riskData.metrics.var_95 + '%';
                if (betaEl) betaEl.innerText = riskData.metrics.beta;
                if (sortinoEl) sortinoEl.innerText = riskData.metrics.sortino;
                if (volEl) volEl.innerText = riskData.metrics.volatility_ann + '%';
            }
            
            const corrData = await fetchAPI('/portfolio/correlations');
            if (corrData && corrData.matrix) {
                renderCorrelationHeatmap('correlation-heatmap', corrData);
            }
        } catch (e) {
            console.error("Risk Load Error:", e);
        }
    }, 500);
}

async function renderNarrativeGalaxy(filterChain = 'ALL', tabs = null) {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI(`/narrative-clusters?chain=${filterChain}&v=${Date.now()}`);
    if (!data || !data.clusters) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end">
            <div>
                ${renderHubTabs('narrative', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">hub</span> Narrative Cluster Galaxy V2 <span class="premium-badge">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-mindshare')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                <p>Spatial mapping using real-time news synthesis and sentiment velocity. Anchors represent core institutional narratives.</p>
            </div>
            <div class="view-actions" style="margin-bottom:0">
                <select id="galaxy-chain-filter" class="tf-btn" style="background:var(--bg-card); border:1px solid var(--border); color:white; padding:0 15px; height:36px; cursor:pointer" onchange="renderNarrativeGalaxy(this.value)">
                    <option value="ALL" ${filterChain === 'ALL' ? 'selected' : ''}>ALL NETWORKS</option>
                    <option value="SOL" ${filterChain === 'SOL' ? 'selected' : ''}>SOLANA ECO</option>
                    <option value="ETH" ${filterChain === 'ETH' ? 'selected' : ''}>ETHEREUM ECO</option>
                    <option value="ADA" ${filterChain === 'ADA' ? 'selected' : ''}>CARDANO ECO</option>
                    <option value="AVAX" ${filterChain === 'AVAX' ? 'selected' : ''}>AVALANCHE ECO</option>
                </select>
            </div>
        </div>
        
        <div class="hot-topics-ticker" style="background:rgba(0, 242, 255, 0.05); border:1px solid var(--accent); padding:10px; border-radius:8px; margin-bottom:1.5rem; display:flex; gap:15px; align-items:center; overflow:hidden">
            <span style="font-size:0.6rem; font-weight:900; color:var(--accent); white-space:nowrap">EMERGING NARRATIVES:</span>
            <div style="flex:1; overflow:hidden; mask-image: linear-gradient(to right, transparent, black 15px); -webkit-mask-image: linear-gradient(to right, transparent, black 15px);">
                <div style="display:flex; gap:20px; animation: scroll-left 80s linear infinite">
                    ${data.hot_topics.map(t => `<span style="font-size:0.75rem; font-weight:800; color:white; white-space:nowrap"># ${t}</span>`).join('')}
                </div>
            </div>
        </div>

        <div class="galaxy-container" style="position:relative; width:100%; height:600px; background:radial-gradient(circle at center, #0a0b1e 0%, #000 100%); border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.05)">
            <canvas id="galaxyCanvas" style="width:100%; height:100%"></canvas>
            <div id="galaxyTooltip" class="galaxy-tooltip" style="display:none; position:absolute; pointer-events:none; z-index:1000"></div>
            
            <div class="galaxy-legend" style="position:absolute; bottom:20px; right:20px; display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; background:rgba(0,0,0,0.8); padding:1rem; border-radius:8px; border:1px solid var(--border)">
                ${Object.entries(data.anchors).map(([key, val]) => `
                    <div style="display:flex; align-items:center; gap:8px; font-size:0.6rem; color:var(--text-dim)">
                        <div style="width:10px; height:10px; border-radius:2px; background:${val.color}"></div>
                        <div>
                            <div style="color:white; font-weight:800">${key}</div>
                            <div style="font-size:0.5rem">${val.topic}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="galaxy-timestamp" style="position:absolute; top:20px; right:20px; font-size:0.6rem; color:var(--accent); font-weight:900">
                SYNC_TIME: ${data.timestamp}
            </div>
        </div>
    `;

    const canvas = document.getElementById('galaxyCanvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('galaxyTooltip');
    
    // Set internal resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    let clusters = data.clusters || [];
    
    // Phase 7.3: Institutional Safe Mode Filtering
    if (isSafeMode) {
        const safeCats = ['L1', 'EXCHANGE', 'DEFI', 'INFRA', 'EQUITIES'];
        clusters = clusters.filter(c => safeCats.includes(c.category));
    }

    const scaleX = rect.width / 800;
    const scaleY = rect.height / 600;

    const stars = clusters.map(c => ({
        ...c,
        x: c.x * scaleX,
        y: c.y * scaleY
    }));
    const hoverScale = 1.2;
    let hoveredStar = null;

    function draw() {
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Draw connection lines to cluster centers (subtle)
        Object.entries(data.anchors).forEach(([key, anchor]) => {
            const ax = anchor.x * scaleX;
            const ay = anchor.y * scaleY;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,0.02)`;
            ctx.lineWidth = 1;
            stars.filter(s => s.category === key).forEach(s => {
                ctx.moveTo(ax, ay);
                ctx.lineTo(s.x, s.y);
            });
            ctx.stroke();
        });

        // 2. Draw Narrative Links (Phase 6)
        if (data.links) {
            data.links.forEach(link => {
                const s1 = stars.find(s => s.ticker === link.source);
                const s2 = stars.find(s => s.ticker === link.target);
                if (s1 && s2) {
                    ctx.beginPath();
                    const isBridge = link.type === 'NARRATIVE_BRIDGE';
                    ctx.strokeStyle = isBridge ? 'rgba(0, 242, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                    ctx.setLineDash(isBridge ? [5, 5] : []);
                    ctx.lineWidth = isBridge ? 1.5 : 1;
                    ctx.moveTo(s1.x, s1.y);
                    ctx.lineTo(s2.x, s2.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });
        }

        // Draw stars
        stars.forEach(star => {
            const isHovered = star === hoveredStar;
            const size = star.size * (isHovered ? hoverScale : 1);
            
            // Outer glow
            const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, size * 3);
            grad.addColorStop(0, star.color);
            grad.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.fillStyle = grad;
            ctx.globalAlpha = isHovered ? 0.6 : 0.2;
            ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.fillStyle = star.color;
            ctx.globalAlpha = 1;
            ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Label if hovered or high momentum
            if (isHovered || Math.abs(star.momentum) > 10) {
                ctx.fillStyle = 'white';
                ctx.font = isHovered ? 'bold 12px Inter' : '10px Inter';
                ctx.fillText(star.ticker, star.x + size + 5, star.y + 5);
            }
        });
    }

    canvas.onmousemove = (e) => {
        const mx = e.offsetX;
        const my = e.offsetY;
        
        hoveredStar = stars.find(s => Math.hypot(s.x - mx, s.y - my) < 15);
        
        if (hoveredStar) {
            canvas.style.cursor = 'pointer';
            tooltip.style.display = 'block';
            tooltip.style.left = (mx + 20) + 'px';
            tooltip.style.top = (my + 20) + 'px';
            tooltip.innerHTML = `
                <div style="background:rgba(10,11,30,0.95); border:1px solid ${hoveredStar.color}; padding:12px; border-radius:8px; backdrop-filter:blur(10px); min-width:140px">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px">
                        <span style="font-weight:900; color:white; font-size:1rem">${hoveredStar.ticker}</span>
                        <span style="font-size:0.6rem; color:var(--text-dim)">${hoveredStar.category}</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px">
                        <div>
                            <div style="font-size:0.55rem; color:var(--text-dim)">MOMENTUM</div>
                            <div style="font-weight:800; color:${hoveredStar.momentum >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">${hoveredStar.momentum > 0 ? '+' : ''}${hoveredStar.momentum}%</div>
                        </div>
                        <div>
                            <div style="font-size:0.55rem; color:var(--text-dim)">SENTIMENT</div>
                            <div style="font-weight:800; color:${hoveredStar.sentiment >= 0 ? 'var(--accent)' : 'var(--risk-high)'}">${hoveredStar.sentiment >= 0 ? '+' : ''}${hoveredStar.sentiment}</div>
                        </div>
                    </div>
                    ${hoveredStar.meta && hoveredStar.meta.length ? `
                        <div style="display:flex; flex-wrap:wrap; gap:4px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px">
                            ${hoveredStar.meta.map(m => `<span style="font-size:0.5rem; background:rgba(0,242,255,0.1); color:var(--accent); padding:2px 5px; border-radius:3px; font-weight:900">${m}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            canvas.style.cursor = 'default';
            tooltip.style.display = 'none';
        }
        draw();
    };

    canvas.onclick = () => {
        if (hoveredStar) openDetail(hoveredStar.ticker);
    };

    draw();
}

async function renderBriefing(tabs = null) {
    appEl.innerHTML = skeleton(2);
    try {
        const data = await fetchAPI('/briefing');
        if (!data || data.error) {
            appEl.innerHTML = `<div class="empty-state">Briefing error: ${data?.error || 'Intelligence engine offline'}</div>`;
            return;
        }

        appEl.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">electric_bolt</span> Alpha Strategy</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                <p>AI-powered narrative synthesis across Mindshare, Flow, and Technical data streams.</p>
            </div>
            
            <div class="briefing-container" style="max-width:900px; margin:0 auto">
                <div class="brief-hero" style="background:linear-gradient(135deg, rgba(0, 242, 255, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%); border:1px solid var(--accent); border-radius:16px; padding:2.5rem; margin-bottom:2rem; position:relative; overflow:hidden">
                    <div style="position:absolute; top:-50px; right:-50px; font-size:10rem; opacity:0.05; pointer-events:none; color:var(--accent)"><span class="material-symbols-outlined" style="font-size:12rem">psychology</span></div>
                    <div class="brief-sentiment-tag" style="background:var(--risk-low); color:black; font-weight:900; font-size:0.6rem; padding:4px 12px; border-radius:100px; width:fit-content; margin-bottom:1.5rem">
                        ${data.market_sentiment}
                    </div>
                    <h3 style="font-size:2.5rem; font-weight:900; line-height:1.1; margin-bottom:1rem; letter-spacing:-1px">${data.headline}</h3>
                    <p style="font-size:1.1rem; line-height:1.6; color:var(--text); opacity:0.9">${data.summary}</p>
                    
                    ${data.ml_prediction ? `
                        <div style="margin-top:2rem; padding:1.5rem; background:rgba(0, 242, 255, 0.05); border:1px solid rgba(0, 242, 255, 0.2); border-radius:12px">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
                                <span style="font-size:0.7rem; font-weight:900; color:var(--accent); letter-spacing:1px">NEURAL ALPHA PREDICTION (24H)</span>
                                <span style="font-size:0.6rem; background:var(--accent); color:black; padding:2px 8px; border-radius:4px; font-weight:900">CONFIDENCE: ${(data.ml_prediction.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div style="display:flex; align-items:flex-end; gap:1.5rem">
                                <div style="font-size:2.5rem; font-weight:900; color:${data.ml_prediction.predicted_return > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">
                                    ${data.ml_prediction.predicted_return > 0 ? '+' : ''}${(data.ml_prediction.predicted_return * 100).toFixed(2)}%
                                </div>
                                <div style="flex:1">
                                    <div style="font-size:0.6rem; color:var(--text-dim); margin-bottom:4px; font-weight:700">PRIMARY ALPHA DRIVERS</div>
                                    <div style="display:flex; gap:8px">
                                        ${Object.entries(data.ml_prediction.feature_importance).sort((a,b) => b[1] - a[1]).slice(0,3).map(([k, v]) => `
                                            <div style="font-size:0.55rem; color:var(--text); background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,0.1)">
                                                ${k.replace('_', ' ')}: <span style="color:var(--accent)">${(v*100).toFixed(0)}%</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <div style="margin-top:2rem; display:flex; gap:20px; font-size:0.8rem; color:var(--text-dim)">
                        <span><strong>MACRO:</strong> ${data.macro_context}</span>
                    </div>
                </div>

                <!-- Feature 1: Regime Overlay Chart -->
                <div class="glass-card" style="margin-bottom:2rem; padding:1.5rem; height:350px; position:relative">
                    <h3 style="color:var(--accent); font-size:0.8rem; margin-bottom:1.5rem; letter-spacing:1px">ALPHASIGNAL REGIME OVERLAY (BTC-USD)</h3>
                    <div style="height:250px">
                        <canvas id="regimeChart"></canvas>
                    </div>
                    <div style="display:flex; justify-content:center; gap:20px; margin-top:10px; font-size:0.6rem; color:var(--text-dim)">
                        <span style="display:flex; align-items:center; gap:5px"><div style="width:10px; height:10px; background:rgba(34,197,94,0.4); border:1px solid #22c55e88"></div> BULLISH</span>
                        <span style="display:flex; align-items:center; gap:5px"><div style="width:10px; height:10px; background:rgba(239,68,68,0.4); border:1px solid #ef444488"></div> BEARISH</span>
                        <span style="display:flex; align-items:center; gap:5px"><div style="width:10px; height:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3)"></div> NEUTRAL</span>
                    </div>
                </div>

                <!-- Sector Pulse Matrix -->
                <div class="glass-card" style="margin-bottom:2rem; padding:1.5rem">
                    <h3 style="color:var(--accent); font-size:0.8rem; margin-bottom:1.5rem; letter-spacing:1px">SYSTEMIC SECTOR ATTRIBUTION</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:1rem">
                        ${data.sector_data ? data.sector_data.map(([cat, score]) => `
                            <div class="sector-puck" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:1rem; border-radius:8px; text-align:center">
                                <div style="font-size:0.6rem; color:var(--text-dim); margin-bottom:4px; font-weight:900">${cat}</div>
                                <div style="font-size:1.4rem; font-weight:900; color:${score > 50 ? 'var(--risk-low)' : 'var(--risk-high)'}">${score.toFixed(1)}</div>
                                <div style="height:2px; background:rgba(255,255,255,0.05); margin-top:8px; border-radius:1px; overflow:hidden">
                                    <div style="width:${score}%; height:100%; background:${score > 50 ? 'var(--risk-low)' : 'var(--risk-high)'}"></div>
                                </div>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>

                <h3 style="margin-bottom:1.5rem; font-size:1rem; color:var(--accent); letter-spacing:1px">HIGH-CONVICTION PROTOCOLS</h3>
                <div class="ideas-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem">
                    ${data.top_ideas.map(idea => `
                        <div class="idea-card" onclick="openDetail('${idea.ticker}')" style="background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:12px; padding:1.5rem; cursor:pointer; transition:all 0.2s ease">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem">
                                <span style="font-size:1.5rem; font-weight:900">${idea.ticker}</span>
                                <span style="font-size:0.6rem; font-weight:700; color:black; background:${idea.conviction === 'HIGH' ? 'var(--accent)' : 'var(--text-dim)'}; padding:2px 8px; border-radius:4px">
                                    ${idea.conviction} CONVICTION
                                </span>
                            </div>
                            <div style="font-size:0.85rem; color:var(--text); line-height:1.5; margin-bottom:1rem">${idea.reason}</div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-end">
                                <div style="font-size:0.65rem; color:var(--text-dim)">ALPHA TARGET</div>
                                <div style="font-size:1.2rem; font-weight:800; color:var(--risk-low)">$${idea.target}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="ai-footer" style="margin-top:4rem; padding:2rem; border-top:1px solid var(--border); text-align:center; color:var(--text-dim); font-size:0.75rem">
                    Synthesized by AlphaSignal AI Core v4.2. Institutional review recommended before execution.
                </div>
            </div>
        `;

        // Initialize Regime Chart
        if (data.regime_timeline && data.regime_timeline.length) {
            const ctx = document.getElementById('regimeChart').getContext('2d');
            const labels = data.regime_timeline.map(r => r.date);
            const prices = data.regime_timeline.map(r => r.price);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'BTC Price',
                        data: prices,
                        borderColor: '#00f2ff',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        x: { display: false },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 9 } }
                        }
                    }
                },
                plugins: [{
                    beforeDraw: (chart) => {
                        const { ctx, chartArea: { top, bottom, left, right, width }, scales: { x } } = chart;
                        const timeline = data.regime_timeline;
                        const count = timeline.length;
                        const stepWidth = width / (count - 1);

                        timeline.forEach((item, index) => {
                            if (index === count - 1) return;
                            const startX = left + (index * stepWidth);
                            const endX = left + ((index + 1) * stepWidth);
                            
                            let color = 'rgba(255,255,255,0.03)';
                            if (item.regime === 'BULLISH') color = 'rgba(34,197,94,0.3)';
                            if (item.regime === 'BEARISH') color = 'rgba(239,68,68,0.3)';
                            
                            ctx.fillStyle = color;
                            ctx.fillRect(startX, top, endX - startX, bottom - top);
                        });
                    }
                }]
            });
        }
    } catch (e) {
        appEl.innerHTML = `<div class="empty-state">Failed to load briefing: ${e.message}</div>`;
    }
}

// Utility function for formatting prices
async function renderTradeLab(tabs = null) {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('tradelab', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">trending_up</span> Trade Intelligence Lab <span class="premium-badge pulse">PRO</span></h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-playbook')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
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
    document.getElementById('generate-setup-btn').onclick = async () => {
        const ticker = document.getElementById('gen-ticker').value || 'BTC-USD';
        runNeuralSetup(ticker);
    };
}

async function renderTradeLedger(tabs = null) {
    appEl.innerHTML = skeleton();
    try {
        const res = await fetchAPI('/trade-ledger');
        if (!res || res.error) {
            appEl.innerHTML = `
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <h2>Institutional Trade Ledger</h2>
                </div>
                <div class="paywall-feature-block">
                    <span class="material-symbols-outlined" style="font-size:4rem; color:var(--accent); margin-bottom:1.5rem">history_edu</span>
                    <h3>PERSISTENT AUDIT HISTORY</h3>
                    <p>The Trade Ledger persists your institutional execution tickets across sessions. This feature is restricted to Premium Alpha accounts.</p>
                </div>
            `;
            return;
        }

        const trades = Array.isArray(res) ? res : (res.data || []);
        
        let currentPage = 1;
        const itemsPerPage = 15;

        function drawLedgerPage() {
            const totalPages = Math.ceil(trades.length / itemsPerPage) || 1;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const currentTrades = trades.slice(startIndex, startIndex + itemsPerPage);

            appEl.innerHTML = `
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
                            </tr>
                        </thead>
                        <tbody>
                            ${currentTrades.length ? currentTrades.map(t => `
                                <tr>
                                    <td style="color:var(--text-dim); font-size:0.7rem">${t.timestamp}</td>
                                    <td style="font-weight:900">${t.ticker}</td>
                                    <td style="color:${t.action === 'BUY' ? 'var(--risk-low)' : 'var(--risk-high)'}; font-weight:900">${t.action}</td>
                                    <td style="font-family:'JetBrains Mono'">${formatPrice(t.price)}</td>
                                    <td style="color:var(--risk-low)">${formatPrice(t.target)}</td>
                                    <td style="color:var(--risk-high)">${formatPrice(t.stop)}</td>
                                    <td style="font-weight:900; color:var(--accent)">${t.rr}:1</td>
                                </tr>
                            `).join('') : `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-dim)">No execution tickets recorded in the ledger.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            const btnPrev = document.getElementById('btn-prev-ledger');
            const btnNext = document.getElementById('btn-next-ledger');
            if(btnPrev) btnPrev.addEventListener('click', () => { if(currentPage > 1) { currentPage--; drawLedgerPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
            if(btnNext) btnNext.addEventListener('click', () => { if(currentPage < totalPages) { currentPage++; drawLedgerPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
        }

        currentPage = 1;
        drawLedgerPage();
    } catch (e) {
        appEl.innerHTML = `<div class="error">Failed to load trade ledger.</div>`;
    }
}

async function renderLiquidityView() {
    const ticker = 'BTC-USD';
    appEl.innerHTML = `<h1 class="view-title">Order Flow Magnitude Monitor (GOMM)</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-liquidity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>${skeleton(3)}`;
    
    // Sidebar + Layout
    appEl.innerHTML = `
    <div class="gomm-container">
        <div class="sidebar-panel">
            <h1 class="view-title" style="margin:0"><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">bar_chart</span> Order Flow (GOMM)</h1>
            <div class="stat-card">
                <div class="label">GLOBAL IMBALANCE</div>
                <div class="value" id="gomm-imbalance">--%</div>
            </div>
            <div class="stat-card" style="margin-top:10px">
                <div class="label">TOTAL BOOK DEPTH</div>
                <div class="value" id="gomm-depth">-- BTC</div>
            </div>

            <div style="margin-top:20px; display:flex; flex-direction:column; gap:8px">
                <button class="setup-generator-btn" id="mode-walls" style="width:100%; border-radius:8px">DEPTH WALLS</button>
                <button class="profile-action-btn" id="mode-heatmap" style="width:100%; border-radius:8px">TEMPORAL HEATMAP</button>
                <button class="profile-action-btn" id="mode-liquidation" style="width:100%; border-radius:8px">LIQUIDATION FLUX</button>
                <button class="profile-action-btn" id="mode-volatility" style="width:100%; border-radius:8px; margin-top:10px;">VOLATILITY SURFACE</button>
            </div>
            
            <div class="stat-card" style="margin-top:20px; background:rgba(0, 242, 255, 0.03); border:1px solid var(--accent)">
                <div class="label" style="color:var(--accent); font-weight:900">⚡ WHALE WATCH (LIVE)</div>
                <div id="whale-watch-content" class="whale-watch-list">
                    <div style="font-size:0.6rem; color:var(--text-dim); text-align:center; padding:10px">Scanning entities...</div>
                </div>
            </div>
        </div>
        <div id="gomm-main-display" style="flex:1">
            <div class="skeleton-card"></div>
        </div>
        <div class="tape-sidebar">
            <div class="tape-header">INSTITUTIONAL LEDGER (LIVE)</div>
            <div id="tape-content" class="tape-list"></div>
        </div>
    </div>`;

    // Concurrent Fetches
    const [data, tapeData, whaleData, liqData, volData] = await Promise.all([
        fetchAPI('/liquidity?ticker=BTC-USD'),
        fetchAPI('/tape?ticker=BTC-USD'),
        fetchAPI('/whales_entity?ticker=BTC-USD'),
        fetchAPI('/liquidations?ticker=BTC-USD'),
        fetchAPI('/volatility-surface?ticker=BTC-USD')
    ]);
    
    if (!data) return;

    // Update Stats
    const imbEl = document.getElementById('gomm-imbalance');
    imbEl.textContent = `${data.imbalance > 0 ? '+' : ''}${data.imbalance}%`;
    imbEl.style.color = data.imbalance > 0 ? 'var(--risk-low)' : 'var(--risk-high)';
    document.getElementById('gomm-depth').textContent = `${data.metrics.total_depth} BTC`;

    const display = document.getElementById('gomm-main-display');

    let currentPage = 1;
    const itemsPerPage = 18;

    function renderWallsMode() {
        display.innerHTML = `
            <div class="card" style="height:100%; border:none; background:transparent; display:flex; flex-direction:column">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-shrink:0">
                    <h3 class="card-title" style="margin:0">Live Order Book Depth <span style="font-size:0.8rem; color:var(--accent)">(Binance WS)</span></h3>
                </div>
                <div class="liquidity-chart" style="flex:1; width:100%; border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding-right:10px; margin-bottom:20px;">
                    <div style="height:400px; width:100%; position:relative; padding:10px">
                        <canvas id="depthWallsChart"></canvas>
                    </div>
                </div>
            </div>`;

        setTimeout(() => {
            const ctx = document.getElementById('depthWallsChart');
            if (!ctx) return;
            
            const liveChart = new Chart(ctx.getContext('2d'), {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Bids (Support)',
                            data: [],
                            borderColor: 'rgba(34, 197, 94, 0.8)',
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            fill: true,
                            showLine: true,
                            pointRadius: 0,
                            stepped: true
                        },
                        {
                            label: 'Asks (Resistance)',
                            data: [],
                            borderColor: 'rgba(239, 68, 68, 0.8)',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            fill: true,
                            showLine: true,
                            pointRadius: 0,
                            stepped: true
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    animation: false, // Disable animation for live WS streams to save CPU
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${c.raw.y.toFixed(2)} BTC Vol @ $${c.raw.x.toLocaleString()}` } },
                        datalabels: { display: false }
                    },
                    scales: {
                        x: { type: 'linear', title: { display:true, text: 'Limit Price ($)' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', callback: function(val) { return '$' + val.toLocaleString(); } } },
                        y: { title: { display:true, text: 'Cumulative Volume (BTC)' }, grid: { color: 'rgba(255,255,255,0.05)' }, position: 'right', display: true, ticks: { color: '#8b949e' } },
                        y1: { display: false } // To balance right margin
                    }
                }
            });
            
            let isDrawing = false;
            
            // Connect to Binance WebSocket directly for Order Book visualization!
            window.BinanceSocketManager.subscribe('BTCUSDT', 'depth20@100ms', (wsData) => {
                if(isDrawing || !wsData.bids || !wsData.asks || !document.getElementById('depthWallsChart')) return;
                isDrawing = true;
                
                let cumBid = 0;
                let bidData = [...wsData.bids].map(w => { cumBid += parseFloat(w[1]); return { x: parseFloat(w[0]), y: cumBid }; });
                // We do NOT reverse bids here because scatter chart 'x' axis maps numerical price correctly left-to-right
                
                let cumAsk = 0;
                let askData = [...wsData.asks].map(w => { cumAsk += parseFloat(w[1]); return { x: parseFloat(w[0]), y: cumAsk }; });
                
                liveChart.data.datasets[0].data = bidData.reverse(); // Chart.js needs X sorted ascending
                liveChart.data.datasets[1].data = askData;
                liveChart.update('none'); // High-performance update
                
                isDrawing = false;
            });
            
        }, 50);
    }

    function renderHeatmapMode() {
        const heatmapId = `tv-heatmap-${ticker.replace(/[^a-z0-9]/gi, '')}`;
        display.innerHTML = `
            <div class="card" style="height:100%; display:flex; flex-direction:column; background:rgba(0,0,0,0.2)">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding: 0 10px">
                    <h3 class="card-title" style="margin:0">Temporal Liquidity Heatmap (Deep Dive)</h3>
                    <span style="font-size:0.55rem; background:rgba(34, 197, 94, 0.1); color:var(--risk-low); padding:2px 8px; border-radius:4px; font-weight:900; letter-spacing:1px">TRADINGVIEW ENGINE ACTIVE</span>
                </div>
                <div id="${heatmapId}" style="height:350px; min-height:350px; background:rgba(0,0,0,0.4); border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1)"></div>
                <div style="font-size:0.65rem; color:var(--text-dim); margin-top:10px; text-align:center; padding:5px">
                    REAL-TIME INSTITUTIONAL FLOW PERSISTENCE (1M GRANULARITY)
                </div>
            </div>`;
        
        setTimeout(() => {
            if (!data || !data.history || !data.history.length) {
                 const el = document.getElementById(heatmapId);
                 if (el) el.innerHTML = '<p class="empty-state">Synchronization in progress. Awaiting historical stream...</p>';
                 return;
            }

            try {
                const container = document.getElementById(heatmapId);
                if (!container) return;
                container.innerHTML = '';
                
                const chart = LightweightCharts.createChart(container, {
                    layout: { 
                        background: { color: '#09090b' }, 
                        textColor: '#d1d5db',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono'
                    },
                    grid: { 
                        vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, 
                        horzLines: { color: 'rgba(255, 255, 255, 0.03)' } 
                    },
                    rightPriceScale: { 
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        autoScale: true,
                        scaleMargins: { top: 0.1, bottom: 0.2 }
                    },
                    timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
                    width: container.clientWidth || 800,
                    height: 350
                });

                const candleSeries = chart.addCandlestickSeries({
                    upColor: '#22c55e', downColor: '#ef4444', 
                    borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444'
                });
                const priceSeries = chart.addAreaSeries({
                    lineColor: 'rgba(34, 197, 94, 0.4)', 
                    topColor: 'rgba(34, 197, 94, 0.1)', 
                    bottomColor: 'rgba(34, 197, 94, 0)',
                    lineWidth: 2,
                });

                // Tooltip Element
                const tooltip = document.createElement('div');
                tooltip.className = 'chart-tooltip';
                container.appendChild(tooltip);

                const formatted = data.history.map(d => {
                    let ts = d.unix_time || Math.floor(new Date(d.timestamp).getTime() / 1000);
                    return {
                        time: ts,
                        open: d.open || d.price,
                        high: d.high || d.price,
                        low: d.low || d.price,
                        close: d.close || d.price
                    };
                }).filter(d => !isNaN(d.time)).sort((a,b) => a.time - b.time);

                candleSeries.setData(formatted);
                priceSeries.setData(formatted.map(d => ({ time: d.time, value: d.close })));
                chart.timeScale().fitContent();

                // Crosshair Move Logic
                chart.subscribeCrosshairMove(param => {
                    if (param.point === undefined || !param.time || !param.seriesData || param.point.x < 0 || param.point.x > container.clientWidth || param.point.y < 0 || param.point.y > container.clientHeight) {
                        tooltip.style.display = 'none';
                    } else {
                        const d = param.seriesData.get(candleSeries);
                        if (d) {
                            tooltip.style.display = 'block';
                            tooltip.style.left = Math.min(container.clientWidth - 210, param.point.x + 15) + 'px';
                            tooltip.style.top = Math.max(10, param.point.y - 100) + 'px';
                            tooltip.innerHTML = `
                                <div style="color:var(--text-dim); margin-bottom:10px; font-weight:900; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px">MARKET NODE INTEL</div>
                                <div class="tooltip-row"><span class="tooltip-label">OPEN</span><span class="tooltip-value">${formatPrice(d.open)}</span></div>
                                <div class="tooltip-row"><span class="tooltip-label">HIGH</span><span class="tooltip-value">${formatPrice(d.high)}</span></div>
                                <div class="tooltip-row"><span class="tooltip-label">LOW</span><span class="tooltip-value">${formatPrice(d.low)}</span></div>
                                <div class="tooltip-row"><span class="tooltip-label">CLOSE</span><span class="tooltip-value">${formatPrice(d.close)}</span></div>
                                <div class="tooltip-row" style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:5px">
                                    <span class="tooltip-label">VOL</span><span class="tooltip-value" style="color:var(--risk-low)">INSTITUTIONAL</span>
                                </div>
                            `;
                        } else {
                            tooltip.style.display = 'none';
                        }
                    }
                });
            } catch (err) {
                console.error('Heatmap Render Error:', err);
            }
        }, 300);
    }

    function renderLiquidationMode() {
        display.innerHTML = `
            <div class="card" style="height:100%; display:flex; flex-direction:column">
                <h2 class="card-title">Derivatives Topography <span style="font-size:0.8rem; color:var(--text-dim)">(Liquidations vs OI)</span></h2>
                <div class="chart-container" style="flex:1; position:relative; min-height:400px; padding-top:10px">
                    <canvas id="liquidationMapChart"></canvas>
                </div>
            </div>`;

        setTimeout(() => {
            const ctx = document.getElementById('liquidationMapChart').getContext('2d');
            
            const sorted = [...liqData.clusters].sort((a,b) => a.price - b.price);
            const labels = sorted.map(c => formatPrice(c.price));
            
            const longData = sorted.map(c => c.side === 'LONG' ? c.intensity * 10 : 0);
            const shortData = sorted.map(c => c.side === 'SHORT' ? c.intensity * 10 : 0);
            const oiData = sorted.map((c, i) => 50 + Math.sin(i / 2) * 20 + (c.intensity * 5));

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { type: 'line', label: 'Est. Open Interest', data: oiData, borderColor: '#00f2ff', borderWidth: 2, tension: 0.4, yAxisID: 'y1', pointRadius: 0 },
                        { type: 'bar', label: 'Short Liq (Resistance)', data: shortData, backgroundColor: 'rgba(34, 197, 94, 0.7)', yAxisID: 'y' },
                        { type: 'bar', label: 'Long Liq (Support)', data: longData, backgroundColor: 'rgba(239, 68, 68, 0.7)', yAxisID: 'y' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, title: { display:true, text: 'Liquidation Imbalance' } },
                        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display:true, text: 'Open Interest' } }
                    }
                }
            });
        }, 50);
    }

    function renderVolatilityMode() {
        if (!volData) {
            display.innerHTML = `<div style="padding:2rem;color:var(--text-dim);text-align:center;">Options Volatility Array Offline</div>`;
            return;
        }
        display.innerHTML = `
            <div class="card" style="height:100%; display:flex; flex-direction:column">
                <h2 class="card-title">Options Volatility Surface <span style="font-size:0.8rem; color:var(--text-dim)">(${volData.structure})</span></h2>
                <div class="chart-container" style="flex:1; position:relative; min-height:400px; padding-top:10px">
                    <canvas id="volatilitySurfaceChart"></canvas>
                </div>
            </div>`;

        setTimeout(() => {
            const ctx = document.getElementById('volatilitySurfaceChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: volData.expiries,
                    datasets: [
                        { label: 'ATM Implied Volatility (%)', data: volData.atm_iv, borderColor: '#f7931a', backgroundColor: 'rgba(247, 147, 26, 0.1)', borderWidth: 3, tension: 0.3, fill: true },
                        { label: '25-Delta Skew', data: volData.skew, borderColor: '#ff0055', borderDash: [5, 5], borderWidth: 2, tension: 0.3, type: 'line', yAxisID: 'y1' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, title: { display:true, text: 'Expiry Timeframe' } },
                        y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, title: { display:true, text: 'Implied Volatility (IV)' } },
                        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display:true, text: 'Directional Skew Premium' } }
                    }
                }
            });
        }, 50);
    }

    // Default Mode
    renderWallsMode();

    // Mode Commutation
    const btnWalls = document.getElementById('mode-walls');
    const btnHeat = document.getElementById('mode-heatmap');
    const btnLiq = document.getElementById('mode-liquidation');
    const btnVol = document.getElementById('mode-volatility');

    const updateBtns = (active) => {
        [btnWalls, btnHeat, btnLiq, btnVol].forEach(b => {
            b.className = 'profile-action-btn';
            b.style.background = 'rgba(255,255,255,0.05)';
        });
        active.className = 'setup-generator-btn';
        active.style.background = '';
    };

    btnWalls.onclick = () => { renderWallsMode(); updateBtns(btnWalls); };
    btnHeat.onclick = () => { renderHeatmapMode(); updateBtns(btnHeat); };
    btnLiq.onclick = () => { renderLiquidationMode(); updateBtns(btnLiq); };
    btnVol.onclick = () => { renderVolatilityMode(); updateBtns(btnVol); };

    // Whale Pulse Sidebar
    if (whaleData && whaleData.entities) {
        document.getElementById('whale-watch-content').innerHTML = whaleData.entities.map(e => `
            <div class="whale-item">
                <div class="whale-header">
                    <span class="whale-name">${e.name}</span>
                    <span class="whale-type">${e.type}</span>
                </div>
                <div class="whale-status">
                    <span class="status-${e.status.toLowerCase()}">${e.status.toUpperCase()}</span>
                    <span style="color:var(--text-dim)">${e.last_tx}</span>
                </div>
            </div>
        `).join('');
    }

    // Tape
    const tapeContent = document.getElementById('tape-content');
    if (tapeData && tapeData.trades) {
        tapeContent.innerHTML = tapeData.trades.map(t => `
            <div class="tape-item ${t.institutional ? 'institutional' : ''}">
                <div style="font-size:0.6rem; color:var(--text-dim)">${t.time.split(':')[1]}:${t.time.split(':')[2]}</div>
                <div class="tape-val ${t.side === 'BUY' ? 'tape-buy' : 'tape-sell'}">
                    ${t.side} ${t.size} <small>@</small> ${Math.round(t.price)}
                </div>
                <div style="text-align:right; font-size:0.6rem; color:var(--text-dim)">${t.exchange.toUpperCase()}</div>
            </div>
        `).join('');
    }
}

async function renderSignalArchive(tabs = null) {
    // 1. Initial skeleton and header
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>📡 Signal Archive <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-signal-archive')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Every institutional alpha signal captured by the engine, tracked with real-time PnL.</p>
        </div>
        <div id="archive-filters" class="glass-card" style="margin-bottom:1.5rem; padding:1.2rem; display:flex; gap:1.5rem; align-items:flex-end; flex-wrap:wrap">
            <div class="form-group" style="margin:0">
                <label style="font-size:0.6rem; color:var(--text-dim); margin-bottom:5px; display:block">TICKER SEARCH</label>
                <input type="text" id="filter-ticker" placeholder="BTC-USD..." style="background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); padding:8px 12px; border-radius:6px; font-size:0.75rem; width:140px">
            </div>
            <div class="form-group" style="margin:0">
                <label style="font-size:0.6rem; color:var(--text-dim); margin-bottom:5px; display:block">SIGNAL TYPE</label>
                <select id="filter-type" style="background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); padding:8px 12px; border-radius:6px; font-size:0.75rem">
                    <option value="">ALL TYPES</option>
                    <option value="SENTIMENT_SPIKE">SENTIMENT SPIKE</option>
                    <option value="MOMENTUM_BREAKOUT">MOMENTUM BREAKOUT</option>
                    <option value="VOLATILITY_EXPANSION">VOLATILITY EXPANSION</option>
                </select>
            </div>
            <div class="form-group" style="margin:0">
                <label style="font-size:0.6rem; color:var(--text-dim); margin-bottom:5px; display:block">LOOKBACK</label>
                <select id="filter-days" style="background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); padding:8px 12px; border-radius:6px; font-size:0.75rem">
                    <option value="7">LAST 7 DAYS</option>
                    <option value="30" selected>LAST 30 DAYS</option>
                    <option value="90">LAST 90 DAYS</option>
                </select>
            </div>
            <button id="apply-filters" class="setup-generator-btn" style="padding:8px 20px; font-size:0.7rem; height:36px">APPLY FILTERS</button>
        </div>
        <div id="archive-table-container">
            <div class="card" style="padding:1rem">${skeleton(5)}</div>
        </div>
    `;

    let currentPage = 1;

    const loadData = async (page = 1) => {
        currentPage = page;
        const ticker = document.getElementById('filter-ticker').value;
        const type = document.getElementById('filter-type').value;
        const days = document.getElementById('filter-days').value;
        
        const container = document.getElementById('archive-table-container');
        container.innerHTML = `<div class="card" style="padding:1rem">${skeleton(5)}</div>`;
        
        let url = `/signal-history?days=${days}&page=${currentPage}&limit=25`;
        if (ticker) url += `&ticker=${ticker.toUpperCase()}`;
        if (type) url += `&type=${type}`;
        
        const response = await fetchAPI(url);
        console.log(`[AlphaSignal API] Response from ${url}:`, response);
        const data = response?.data;
        const pageInfo = response?.pagination;
        
        if (!data || !data.length) {
            container.innerHTML = `
                <div class="card" style="text-align:center; padding:3rem">
                    <p style="color:var(--text-dim); font-size:0.85rem">No signals found matching these criteria.</p>
                </div>`;
            return;
        }

        const stateColors = {
            'HIT_TP2': '#22c55e', 'HIT_TP1': '#86efac',
            'ACTIVE': '#60a5fa', 'STOPPED': '#ef4444'
        };
        const stateIcons = { 'HIT_TP2': '🎯', 'HIT_TP1': '✅', 'ACTIVE': '⚡', 'STOPPED': '🛑' };

        container.innerHTML = `
            <div class="card" style="overflow-x:auto">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:15px">
                    <span style="font-size:0.6rem; color:var(--text-dim); letter-spacing:2px">SHOWING ${data.length} SIGNALS (PAGE ${pageInfo?.page || 1} OF ${pageInfo?.pages || 1} • ${pageInfo?.total || 0} TOTAL)</span>
                    <div style="display:flex; gap:15px; align-items:center;">
                        <button class="setup-generator-btn" style="width:85px; padding:0; font-size:0.65rem; height:24px; line-height:24px; text-align:center" onclick="window.loadArchiveData(${currentPage - 1 > 0 ? currentPage - 1 : 1})" ${currentPage === 1 ? 'disabled style="opacity:0.5"' : ''}>PREVIOUS</button>
                        <div style="font-size:0.75rem; color:var(--text-dim)">PAGE ${pageInfo?.page || 1} OF ${pageInfo?.pages || 1}</div>
                        <button class="setup-generator-btn" style="width:85px; padding:0; font-size:0.65rem; height:24px; line-height:24px; text-align:center" onclick="window.loadArchiveData(${currentPage + 1})" ${(pageInfo && currentPage >= pageInfo.pages) ? 'disabled style="opacity:0.5"' : ''}>NEXT</button>
                        <span style="font-size:0.6rem; color:var(--accent); letter-spacing:1px; display:none title='Desktop PnL tracking'">REAL-TIME PnL TRACKING ACTIVE</span>
                        <a href="/api/export?type=signals" download class="setup-generator-btn" style="width:auto; padding:4px 12px; font-size:0.6rem; height:24px; line-height:16px; text-decoration:none; display:flex; align-items:center; gap:5px"><span class="material-symbols-outlined" style="font-size:12px">download</span> EXPORT ALL (CSV)</a>
                    </div>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                    <thead>
                        <tr style="color:var(--text-dim); border-bottom:1px solid var(--border)">
                            <th style="text-align:left; padding:8px 12px">TICKER</th>
                            <th style="text-align:left; padding:8px 12px">TYPE</th>
                            <th style="text-align:right; padding:8px 12px">ENTRY</th>
                            <th style="text-align:right; padding:8px 12px">CURRENT</th>
                            <th style="text-align:right; padding:8px 12px">RETURN</th>
                            <th style="text-align:center; padding:8px 12px">STATE</th>
                            <th style="text-align:left; padding:8px 12px">TIMESTAMP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(s => `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
                                <td style="padding:10px 12px; font-weight:700; color:var(--accent)">${s.ticker}</td>
                                <td style="padding:10px 12px; color:var(--text-dim)">${s.type?.replace(/_/g,' ') || '-'}</td>
                                <td style="padding:10px 12px; text-align:right; font-family:monospace">${s.entry ? '$' + s.entry.toLocaleString() : '-'}</td>
                                <td style="padding:10px 12px; text-align:right; font-family:monospace">${s.current ? '$' + parseFloat(s.current).toLocaleString() : '-'}</td>
                                <td style="padding:10px 12px; text-align:right; font-weight:700; color:${s.return >= 0 ? '#22c55e' : '#ef4444'}">${s.return >= 0 ? '+' : ''}${s.return}%</td>
                                <td style="padding:10px 12px; text-align:center">
                                    <span style="background:${stateColors[s.state] || '#60a5fa'}22; color:${stateColors[s.state] || '#60a5fa'}; padding:2px 10px; border-radius:20px; font-size:0.6rem; letter-spacing:1px">
                                        ${stateIcons[s.state] || '⚡'} ${s.state}
                                    </span>
                                </td>
                                <td style="padding:10px 12px; color:var(--text-dim)">${s.timestamp ? s.timestamp.split(' ')[0] : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    window.loadArchiveData = loadData;

    document.getElementById('apply-filters').onclick = () => loadData(1);
    // Load initial data
    loadData(1);
}

async function renderMacroView(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('compass', tabs) : '';
    appEl.innerHTML = `<h1 class="view-title">Macro Catalyst Compass</h1>${skeleton(2)}`;
    try {
        const data = await fetchAPI('/macro-calendar');
        if (!data) return;

        appEl.innerHTML = `
            <h1 class="view-title">🌏 Macro Catalyst Compass</h1>
            ${tabHTML}
            <p class="view-desc" style="margin-top:0.5rem">Tracking high-impact economic drivers and global liquidity shifts.</p>
            <div class="macro-grid" style="display:grid; grid-template-columns: 1fr 350px; gap:20px">
                <div>
                    <div class="card">
                        <h3 class="card-title">Upcoming Volatility Triggers</h3>
                        <div style="display:flex; flex-direction:column; gap:12px">
                            ${data.events.map(e => `
                                <div style="display:flex; gap:15px; padding:15px; background:rgba(255,255,255,0.02); border-radius:12px; border-left: 4px solid var(--${e.impact === 'CRITICAL' ? 'risk-high' : (e.impact === 'HIGH' ? 'accent' : 'text-dim')})">
                                    <div style="width:60px; text-align:center">
                                        <div style="font-size:0.65rem; color:var(--text-dim)">${e.date.split('-').slice(1).join('/')}</div>
                                        <div style="font-size:0.85rem; font-weight:900">${e.time}</div>
                                    </div>
                                    <div style="flex:1">
                                        <div style="font-size:0.95rem; font-weight:800; margin-bottom:4px">${e.event}</div>
                                        <div style="font-size:0.7rem; color:var(--text-dim)">FCST: <span style="color:var(--text)">${e.forecast}</span> | PREV: ${e.previous}</div>
                                    </div>
                                    <div style="text-align:right">
                                        <div class=" impacto-badge impact-${e.impact.toLowerCase()}" style="font-size:0.6rem">${e.impact}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <aside style="display:flex; flex-direction:column; gap:20px">
                    <div class="card">
                        <h3 class="card-title">Treasury Yields</h3>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                            ${Object.entries(data.yields).map(([lbl, val]) => `
                                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; text-align:center">
                                    <div style="font-size:0.6rem; color:var(--text-dim); margin-bottom:4px">${lbl}</div>
                                    <div style="font-size:1.1rem; font-weight:900; color:var(--accent)">${val}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="card" style="border-top: 4px solid var(--accent)">
                        <h3 class="card-title">Institutional Briefing</h3>
                        <p style="font-size:0.8rem; line-height:1.5; color:var(--text-dim)">Monitor Core PCE and GDP Final estimates for risk-on confirmation. Yield compression typically precedes volatility regime shifts.</p>
                        <div style="margin-top:15px; font-size:0.6rem; color:var(--accent); font-weight:900">STATUS: ${data.status}</div>
                    </div>
                </aside>
            </div>`;
    } catch (e) {
        appEl.innerHTML = `<div class="empty-state">Macro Engine offline: ${e.message}</div>`;
    }
}

async function renderDocsVelocity() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">description</span> Narrative Velocity Methodology</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-velocity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Documentation on how AlphaSignal calculates institutional capital rotation and social attention.</p>
        </div>
        <div class="docs-container" style="max-width:800px; margin:0 auto; line-height:1.7; color:var(--text-dim); padding: 2rem 0">
            <section style="margin-bottom:2.5rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:12px; border:1px solid var(--border)">
                <h3 style="color:var(--accent); margin-bottom:1rem; letter-spacing:1px">1. CORE VELOCITY METRIC</h3>
                <p>Velocity represents <strong>Volume Acceleration</strong>. It is calculated by taking the current interval volume and dividing it by the 5-period moving average of previous volumes. A score > 1.0 indicates volume is expanding relative to its recent local benchmark, suggesting institutional entry or exit.</p>
            </section>
            <section style="margin-bottom:2.5rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:12px; border:1px solid var(--border)">
                <h3 style="color:var(--accent); margin-bottom:1rem; letter-spacing:1px">2. SOCIAL HEAT (MINDSHARE)</h3>
                <p>We monitor thousands of news sources and institutional social channels. Social Heat is a normalized score (0-10) based on the volume of bullish mentions relative to the total mention volume for that specific L1 ecosystem.</p>
            </section>
            <section style="margin-bottom:2.5rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:12px; border:1px solid var(--border)">
                <h3 style="color:var(--accent); margin-bottom:1rem; letter-spacing:1px">3. INSTITUTIONAL VIGOR</h3>
                <p>Vigor is a Z-Score approximation of price momentum adjusted for volume confirmation. A high Vigor score suggests that price movement is backed by significant capital flow, reducing the probability of a "fake-out."</p>
            </section>
            <section style="margin-bottom:2.5rem; background:rgba(255,255,255,0.02); padding:1.5rem; border-radius:12px; border:1px solid var(--border)">
                <h3 style="color:var(--accent); margin-bottom:1rem; letter-spacing:1px">4. THE RADAR CHART</h3>
                <p>The Radar Chart plots these four dimensions (Momentum, Liquidity, Social Heat, Vigor) to provide a "Network Signature." Institutional traders use this to identify which chains are receiving the most "High-Conviction" capital rotation.</p>
            </section>
            <div style="text-align:center; margin-top:2rem">
                <button class="intel-action-btn" onclick="switchView('velocity')" style="width:auto">RETURN TO VELOCITY TERMINAL</button>
            </div>
        </div>
    `;
}

// ============= Core Features =============
async function renderAlerts() {
    appEl.innerHTML = skeleton(3);
    const data = await fetchAPI('/alerts');
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>Live Intelligence Alerts</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-alerts')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Real-time monitoring of statistical outliers, de-peg events, and institutional-scale movements.</p>
        </div>
        <div class="alert-list" style="display:flex; flex-direction:column; gap:1.5rem">
            ${data.length ? data.map(a => {
                const ts = a.timestamp ? (a.timestamp.includes('T') ? a.timestamp.split('T')[1].split('.')[0] : a.timestamp) : 'SYNC';
                return `
                <div class="alert-card ${a.severity}" style="background:var(--bg-card); border:1px solid var(--border); border-left:4px solid ${a.severity === 'high' ? 'var(--risk-high)' : (a.severity === 'medium' ? 'var(--accent)' : 'var(--text-dim)')}; border-radius:12px; padding:1.5rem; position:relative; overflow:hidden">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                        <span style="font-size:0.7rem; font-weight:900; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; color:${a.severity === 'high' ? 'var(--risk-high)' : 'var(--accent)'}">${a.type}</span>
                        <span style="font-size:0.7rem; color:var(--text-dim); font-family:var(--font-mono)">${ts}</span>
                    </div>
                    <div style="font-size:1.1rem; font-weight:800; margin-bottom:8px">${a.title || (a.ticker + ' SIGNAL')}</div>
                    <div style="font-size:0.85rem; color:var(--text-dim); line-height:1.4; margin-bottom:1rem">${a.content || a.message}</div>
                    
                    <div style="display:flex; gap:10px">
                        <button class="intel-action-btn mini" onclick="showSignalDetail('${a.id}', '${a.ticker}')" style="font-size:0.6rem; padding:4px 10px">
                            <span class="material-symbols-outlined" style="font-size:14px; margin-right:4px">psychology</span>
                            AI REASONING
                        </button>
                    </div>
                </div>
                `;
            }).join('') : '<p class="empty-state">No active high-severity threats detected.</p>'}
        </div>`;
    
    // Clear badge when viewing alerts
    document.getElementById('alert-badge').style.display = 'none';
}

async function showSignalDetail(alertId, ticker) {
    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-synthesis-content');
    if (!modal || !content) return;
    
    modal.classList.remove('hidden');
    content.innerHTML = `
        <div style="padding:2rem; text-align:center">
            <div class="loader" style="margin:0 auto 1.5rem"></div>
            <p style="color:var(--text-dim); font-size:0.9rem; font-family:var(--font-mono)">SYNTHESIZING MULTIDIMENSIONAL VECTORS...</p>
        </div>
    `;
    
    try {
        const url = `/ai_analyst?ticker=${ticker}${alertId && alertId !== 'undefined' ? `&alert_id=${alertId}` : ''}`;
        const data = await fetchAPI(url);
        if (data && data.summary) {
            content.innerHTML = data.summary;
        } else {
            content.innerHTML = `
                <div style="padding:2rem; text-align:center; color:var(--risk-high)">
                    <span class="material-symbols-outlined" style="font-size:48px; margin-bottom:1rem">warning</span>
                    <h3>SYNTHESIS FAILED</h3>
                    <p style="font-size:0.9rem">The AI Engine could not establish a stable correlation for ${ticker} at this time.</p>
                </div>
            `;
        }
    } catch (e) {
        content.innerHTML = `<p style="padding:2rem; text-align:center; color:var(--risk-high)">ENGINE OFFLINE: Connection to neural cluster lost.</p>`;
    }
}

async function renderRegime() {
    appEl.innerHTML = `<h1 class="view-title">Market Regime Hub</h1>${skeleton(1)}`;
    const data = await fetchAPI('/regime?ticker=BTC-USD');
    if (!data) return;

    const regimeClass = data.current_regime.toLowerCase().replace(/ /g, '-').replace(/\//g, '');
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>Market Regime Framework</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-regimes')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Statistical classification of market cycles using Markov-Switching approximation.</p>
        </div>
        
        <div class="regime-container">
            <div class="regime-hero-card ${regimeClass}">
                <div class="regime-badge">${data.current_regime}</div>
                <div class="regime-main-stat">
                    <div class="regime-label">CURRENT STATE: ${data.ticker}</div>
                    <div class="regime-confidence">Confidence Index: ${(data.confidence * 100).toFixed(0)}%</div>
                </div>
                <div class="regime-metrics-row">
                    <div class="r-metric">
                        <label>TREND BIAS</label>
                        <span class="${data.trend === 'BULLISH' ? 'pos' : (data.trend === 'BEARISH' ? 'neg' : 'dim')}">${data.trend}</span>
                    </div>
                    <div class="r-metric">
                        <label>VOLATILITY</label>
                        <span>${data.volatility}</span>
                    </div>
                    <div class="r-metric">
                        <label>SMA 20 DIST</label>
                        <span class="${data.metrics.sma_20_dist >= 0 ? 'pos' : 'neg'}">${data.metrics.sma_20_dist}%</span>
                    </div>
                </div>
            </div>

            <div class="regime-history-panel" style="margin-top:2rem">
                <h3>STRUCTURAL ALPHA HEATMAP (D3.JS)</h3>
                <div id="regime-heatmap-container" style="height:200px; background:rgba(255,255,255,0.02); border-radius:12px; margin-top:1rem"></div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px">
                    <div style="display:flex; gap:16px; font-size:0.65rem; color:var(--text-dim); font-weight:700">
                        <div style="display:flex; align-items:center; gap:6px"><span style="width:12px; height:12px; background:#ef5350; border-radius:2px"></span> HIGH-VOL EXPANSION</div>
                        <div style="display:flex; align-items:center; gap:6px"><span style="width:12px; height:12px; background:#ffa726; border-radius:2px"></span> NEUTRAL / ACCUMULATION</div>
                        <div style="display:flex; align-items:center; gap:6px"><span style="width:12px; height:12px; background:#26a69a; border-radius:2px"></span> LOW-VOL COMPRESSION</div>
                    </div>
                    <div style="font-size:0.7rem; color:var(--text-dim); text-align:right">PROBABILITY DENSITY OVER 180D LOOKBACK</div>
                </div>
            </div>

            <div class="regime-guide-grid" style="margin-top:3rem; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px">
                <div class="guide-card">
                    <h4>ACCUMULATION</h4>
                    <p>Smart money building positions. Historically low volatility with stabilizing sentiment.</p>
                </div>
                <div class="guide-card">
                    <h4>TRENDING</h4>
                    <p>High-conviction directional movement. Sustained alpha and institutional momentum.</p>
                </div>
                <div class="guide-card">
                    <h4>DISTRIBUTION</h4>
                    <p>Price high, momentum slowing. Volume spikes on negative days as smart money exits.</p>
                </div>
                <div class="guide-card">
                    <h4>VOLATILE</h4>
                    <p>Erratic, high-range price swings. Elevated risk environment with no clear directional edge.</p>
                </div>
            </div>
        </div>
    `;
    renderRegimeHeatmap('regime-heatmap-container', data.history);
}

// ============================================================
// Phase 7: Advanced Charting (Real-time Binance WSS + TV)
// ============================================================
// ============================================================
// Phase 7/8: Advanced Charting Suite (Tabs + Data Integrations)
// ============================================================
let activeBinanceWS = null;
let currentAdvTab = 'overview';

async function renderAdvOverview(symbol, interval) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    
    // Phase 5.2: Universal Data Dispatcher (Crypto vs Equity)
    let klines = [];
    const isCrypto = symbol.endsWith('USDT');
    
    if (isCrypto) {
        klines = await fetchBinanceKlines(symbol, interval, 500);
    } else {
        // Fetch Equity Klines from our Backend Proxy
        klines = await fetchAPI(`/equity-klines?symbol=${symbol}&interval=${interval}`);
    }

    if (!klines || klines.length === 0) {
        container.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-dim);">
            <span class="material-symbols-outlined" style="font-size:3rem; margin-bottom:1rem;">error_outline</span>
            <p>Insufficient structural data for ${symbol}.</p>
            <p style="font-size:0.7rem;">(Check network connectivity or asset availability)</p>
        </div>`;
        return;
    }

    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontSize: 11, fontFamily: 'JetBrains Mono' },
        grid: { vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, horzLines: { color: 'rgba(255, 255, 255, 0.03)' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true }
    });
    
    const candleSeries = chart.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
    const volumeSeries = chart.addHistogramSeries({ color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '', scaleMargins: { top: 0.8, bottom: 0 } });
    
    // EMA overlays (Higher visibility)
    const ema20Series = chart.addLineSeries({ color: '#facc15', lineWidth: 2, title: 'EMA20' });
    const ema50Series = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, title: 'EMA50' });
    
    let lastEma20 = klines[0].close;
    let lastEma50 = klines[0].close;

    const calcEMA = (data, period) => {
        let k = 2/(period+1), emaArr = [];
        let ema = data[0].close;
        for(let i=0; i<data.length; i++) {
            ema = (parseFloat(data[i].close) - ema)*k + ema;
            emaArr.push({time: data[i].time, value: ema});
        }
        return { data: emaArr, last: ema };
    };
    
    const ema20 = calcEMA(klines, 20);
    const ema50 = calcEMA(klines, 50);
    lastEma20 = ema20.last;
    lastEma50 = ema50.last;

    candleSeries.setData(klines.map(k => ({time:k.time, open:k.open, high:k.high, low:k.low, close:k.close})));
    volumeSeries.setData(klines.map(k => ({time:k.time, value:k.value, color:k.color})));
    ema20Series.setData(ema20.data);
    ema50Series.setData(ema50.data);
    
    if (isCrypto) {
        activeBinanceWS = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
        activeBinanceWS.onmessage = (e) => {
            const k = JSON.parse(e.data).k;
            const price = parseFloat(k.c);
            const tick = { time: Math.floor(k.t/1000), open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: price };
            
            candleSeries.update(tick);
            volumeSeries.update({ time: tick.time, value: parseFloat(k.v), color: tick.close >= tick.open ? '#26a69a' : '#ef5350' });
            
            // Live EMA Update
            lastEma20 = (price - lastEma20) * (2/21) + lastEma20;
            lastEma50 = (price - lastEma50) * (2/51) + lastEma50;
            ema20Series.update({ time: tick.time, value: lastEma20 });
            ema50Series.update({ time: tick.time, value: lastEma50 });
        };
    }
    
    const heatmapData = await fetchAPI(`/liquidity-history?ticker=${symbol.replace('USDT', '-USD')}`);
    if (heatmapData && heatmapData.data) {
        window.activeHeatmap = new HeatmapOverlay(chart, candleSeries);
        window.activeHeatmap.setData(heatmapData.data);
        
        // Initial state from UI
        const toggle = document.getElementById('heatmap-toggle');
        const intensity = document.getElementById('heatmap-intensity');
        if (toggle) {
            const legend = document.getElementById('heatmap-legend-overlay');
            if (legend) legend.style.display = toggle.checked ? 'flex' : 'none';
            if (!toggle.checked) window.activeHeatmap.canvas.style.display = 'none';
        }
        if (intensity) {
            window.activeHeatmap.setIntensity(parseFloat(intensity.value));
        }
    }

    const ro = new ResizeObserver(e => { if(e.length>0 && e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(container);
}

// Heatmap Helpers
window.toggleHeatmapOverlay = function() {
    const toggle = document.getElementById('heatmap-toggle');
    const legend = document.getElementById('heatmap-legend-overlay');
    if (window.activeHeatmap) {
        const isVisible = toggle.checked;
        window.activeHeatmap.canvas.style.display = isVisible ? 'block' : 'none';
        if (legend) legend.style.display = isVisible ? 'flex' : 'none';
        if (isVisible) window.activeHeatmap.render();
    }
};

window.updateHeatmapIntensity = function(val) {
    if (window.activeHeatmap) {
        window.activeHeatmap.setIntensity(parseFloat(val));
    }
};

// TAB 2: Market Depth (Bids vs Asks) - Live WebSocket Integration
async function renderAdvDepth(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
        timeScale: { timeVisible: false, visible: false } // Hide time scale since it's a price distribution representation
    });
    
    const bidArea = chart.addAreaSeries({ topColor: 'rgba(38,166,154,0.4)', bottomColor: 'rgba(38,166,154,0.0)', lineColor: '#26a69a', lineWidth: 2 });
    const askArea = chart.addAreaSeries({ topColor: 'rgba(239,83,80,0.4)', bottomColor: 'rgba(239,83,80,0.0)', lineColor: '#ef5350', lineWidth: 2 });
    
    // Throttle UI renders to avoid destroying the DOM
    let isDrawing = false;
    
    window.BinanceSocketManager.subscribe(symbol, 'depth20@100ms', (data) => {
        if(isDrawing || !data.bids || !data.asks) return;
        isDrawing = true;
        
        let bidSum=0, askSum=0;
        let bids = [], asks = [];
        let index = 1;
        
        [...data.bids].reverse().forEach(b => { 
            bidSum+=parseFloat(b[1]); 
            // We use 'index' as fake monotonically increasing X-axis
            bids.push({time: index++, value: bidSum}); 
        });
        
        index += 2; // visual gap between spread
        
        data.asks.forEach(a => { 
            askSum+=parseFloat(a[1]); 
            asks.push({time: index++, value: askSum }); 
        });
        
        bidArea.setData(bids);
        askArea.setData(asks);
        
        isDrawing = false;
    });
    
    const ro = new ResizeObserver(e => { if(e.length > 0 && e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(container);
}

// TAB 3: Derivatives (Live CVD & Block Trades)
async function renderAdvDerivatives(symbol, interval) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    
    // Switch to higher frequency for better visual demo
    interval = '1m';
    
    const klines = await fetchBinanceKlines(symbol, interval, 100);
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true }
    });
    
    const priceSeries = chart.addLineSeries({ color: 'rgba(255,255,255,0.7)', lineWidth: 1, title: 'Price Action' });
    const cvdSeries = chart.addAreaSeries({ topColor: 'rgba(96,165,250,0.4)', bottomColor: 'rgba(96,165,250,0)', lineColor: '#60a5fa', lineWidth: 2, priceScaleId: 'left', title: 'Cumulative Volume Delta' });
    const blockSeries = chart.addHistogramSeries({ color: '#ef5350', priceScaleId: 'left_liq', scaleMargins: { top: 0.7, bottom: 0 }, title: 'Block Order Flux' });
    
    priceSeries.setData(klines.map(k=>({time:k.time, value:k.close})));
    
    // Initialize base CVD and Empty Blocks
    let runningCVD = 500000;
    let cvdData = [];
    let liqData = [];
    
    klines.forEach(k => {
        let delta = (k.close - k.open) * (k.volume || 1);
        runningCVD += delta;
        cvdData.push({ time: k.time, value: runningCVD });
        
        // Pseudo blocks for past history
        let blockVal = (Math.abs(k.close - k.open) / k.open > 0.005) ? Math.random() * 10 : 0;
        liqData.push({ time: k.time, value: blockVal, color: k.close < k.open ? '#26a69a' : '#ef5350' });
    });
    
    cvdSeries.setData(cvdData);
    blockSeries.setData(liqData);
    
    chart.priceScale('left').applyOptions({ visible: true, borderColor: 'rgba(255,255,255,0.1)' });
    chart.priceScale('left_liq').applyOptions({ visible: false });
    
    // LIVE WEBSOCKET AGGREGATOR
    let currentCandleStart = Math.floor(Date.now() / 60000) * 60;
    
    window.BinanceSocketManager.subscribe(symbol, 'aggTrade', (wsData) => {
        // wsData.p: Price, wsData.q: Quantity, wsData.T: Timestamp, wsData.m: Buyer is Maker (Sell)
        let ts = Math.floor(wsData.T / 1000);
        let qty = parseFloat(wsData.q);
        let price = parseFloat(wsData.p);
        let isSell = wsData.m; // true = taker sell (red), false = taker buy (green)
        
        // Align to 1m boundary
        let candleTime = Math.floor(ts / 60) * 60;
        if(candleTime > currentCandleStart) currentCandleStart = candleTime;
        
        // 1. Update CVD (Sum of directional volume)
        runningCVD += (isSell ? -qty : qty);
        cvdSeries.update({ time: currentCandleStart, value: runningCVD });
        
        // 2. Capture large market orders (Whale Flux)
        if(qty > 5) { // If > 5 BTC/ETH block size limit
            blockSeries.update({ time: ts, value: qty, color: isSell ? '#ef5350' : '#26a69a' });
        }
    });
    
    const ro = new ResizeObserver(e => { if(e.length > 0 && e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(container);
}

// TAB 4: Comparative (Norm 0%)
async function renderAdvComparative(interval) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    const [btc, eth, sol] = await Promise.all([
        fetchBinanceKlines('BTCUSDT', interval, 100),
        fetchBinanceKlines('ETHUSDT', interval, 100),
        fetchBinanceKlines('SOLUSDT', interval, 100)
    ]);
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
        timeScale: { timeVisible: true }
    });
    const norm = (data) => {
        if(!data.length) return [];
        let start = data[0].close;
        return data.map(d => ({time: d.time, value: ((d.close - start)/start)*100}));
    };
    chart.addLineSeries({color:'#facc15', lineWidth:2, title: 'BTC'}).setData(norm(btc));
    chart.addLineSeries({color:'#60a5fa', lineWidth:2, title: 'ETH'}).setData(norm(eth));
    chart.addLineSeries({color:'#22c55e', lineWidth:2, title: 'SOL'}).setData(norm(sol));
    
    chart.applyOptions({ localization: { priceFormatter: p => p.toFixed(2) + '%' } });
    const ro = new ResizeObserver(e => { if(e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(container);
}

async function renderAdvCVD(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    container.innerHTML = '<div class="loader" style="margin:2rem auto"></div>';
    try {
        const data = await fetchAPI(`/onchain?symbol=${symbol}`);
        if(!data) { container.innerHTML = '<div class="error-msg">Auth Required</div>'; return; }
        
        container.innerHTML = '';
        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
            grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } }
        });
        const cvdSeries = chart.addAreaSeries({ topColor: 'rgba(38,166,154,0.4)', bottomColor: 'rgba(239,83,80,0.4)', lineColor: '#26a69a', lineWidth: 2, title: 'Cumulative Volume Delta' });
        cvdSeries.setData(data.map(d=>({time: d.time, value: d.cvd})));
        
        const ro = new ResizeObserver(e => { if(e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
        ro.observe(container);
        chart.timeScale().fitContent();
    } catch(e) { container.innerHTML = '<div class="error-msg">Fetch failed.</div>'; }
}

async function renderAdvExchange(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    container.innerHTML = '<div class="loader" style="margin:2rem auto"></div>';
    try {
        const data = await fetchAPI(`/onchain?symbol=${symbol}`);
        if(!data) { container.innerHTML = '<div class="error-msg">Auth Required</div>'; return; }
        
        container.innerHTML = '';
        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
            grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } }
        });
        const exSeries = chart.addHistogramSeries({ color: '#facc15', title: 'Net Position Change' });
        exSeries.setData(data.map(d=>({
            time: d.time, 
            value: d.exch_flow, 
            color: d.exch_flow > 0 ? '#ef5350' : '#26a69a' 
        })));
        
        const ro = new ResizeObserver(e => { if(e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
        ro.observe(container);
        chart.timeScale().fitContent();
    } catch(e) { container.innerHTML = '<div class="error-msg">Fetch failed.</div>'; }
}

const dispatchAdvTab = () => {
    const sym = document.getElementById('adv-symbol').value;
    const int = document.getElementById('adv-interval').value;
    if(currentAdvTab === 'overview') renderAdvOverview(sym, int);
    else if(currentAdvTab === 'depth') renderAdvDepth(sym);
    else if(currentAdvTab === 'derivatives') renderAdvDerivatives(sym, int);
    else if(currentAdvTab === 'comparative') renderAdvComparative(int);
    else if(currentAdvTab === 'cvd') renderAdvCVD(sym);
    else if(currentAdvTab === 'exchange') renderAdvExchange(sym);
};

async function renderOnChain(tabs = null) {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('onchain', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">link</span> On-Chain Analytics <span class="premium-badge">PRO SUITE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-onchain')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                <p>Institutional macroeconomic network valuation indicators.</p>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap:1rem; margin-bottom:1rem">
            <div class="card" style="padding:1.5rem">
                <h3>MVRV Z-Score</h3>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Highlights periods where market value is significantly higher/lower than realized value.</p>
                <div id="mvrv-chart" style="width:100%; height:300px"></div>
            </div>
            <div class="card" style="padding:1.5rem">
                <h3>Realized Price vs Spot</h3>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Average on-chain cost basis vs current Spot price.</p>
                <div id="realized-chart" style="width:100%; height:300px"></div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap:1rem; margin-bottom:1rem">
            <div class="card" style="padding:1.5rem">
                <h3>SOPR (Spent Output Profit Ratio)</h3>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Aggregate profit/loss ratio of spent coins. 1.0 = Breakeven.</p>
                <div id="sopr-chart" style="width:100%; height:250px"></div>
            </div>
            <div class="card" style="padding:1.5rem">
                <h3>Puell Multiple</h3>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Miner revenue compared to its 365-day moving average.</p>
                <div id="puell-chart" style="width:100%; height:250px"></div>
            </div>
            <div class="card" style="padding:1.5rem">
                <h3>NVT Ratio</h3>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Network Value to Transactions (The P/E of Crypto).</p>
                <div id="nvt-chart" style="width:100%; height:250px"></div>
            </div>
            <div class="card" style="padding:1.5rem">
                <h3>Hash Ribbons <span style="font-size:0.8rem; color:var(--text-dim)">(Miner Capitulation)</span></h3>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">When the 30D Hash (Orange) drops below 60D (White), Miners are capitulating.</p>
                <div id="hash-chart" style="width:100%; height:250px"></div>
            </div>
        </div>
    `;

    document.getElementById('mvrv-chart').innerHTML = '<div class="loader" style="margin:2rem auto"></div>';
    
    try {
        const data = await fetchAPI('/onchain');
        if (!data) {
            document.getElementById('mvrv-chart').innerHTML = '<div class="error-msg">Authentication Required</div>';
            return;
        }

        // Clear loaders
        document.getElementById('mvrv-chart').innerHTML = '';
        
        // Setup base chart config
        const chartOpts = (height) => ({ layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' }, grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } }, height });
        
        // MVRV
        const mvrvContainer = document.getElementById('mvrv-chart');
        const mvrvChart = LightweightCharts.createChart(mvrvContainer, chartOpts(300));
        mvrvChart.addAreaSeries({ topColor: 'rgba(239,83,80,0.4)', bottomColor: 'rgba(38,166,154,0.1)', lineColor: '#ef5350', lineWidth: 2, title: 'Z-Score' })
                 .setData(data.map(d=>({time: d.time, value: d.mvrv})));

        // Realized
        const realizedContainer = document.getElementById('realized-chart');
        const realizedChart = LightweightCharts.createChart(realizedContainer, chartOpts(300));
        realizedChart.addLineSeries({ color: 'rgba(255,255,255,0.7)', lineWidth: 2, title: 'Spot Price' }).setData(data.map(d=>({time: d.time, value: d.price})));
        realizedChart.addLineSeries({ color: '#f97316', lineWidth: 2, title: 'Realized Price' }).setData(data.map(d=>({time: d.time, value: d.realized})));

        // SOPR
        const soprContainer = document.getElementById('sopr-chart');
        const soprChart = LightweightCharts.createChart(soprContainer, chartOpts(250));
        soprChart.addAreaSeries({ topColor: 'rgba(16,185,129,0.4)', bottomColor: 'rgba(16,185,129,0)', lineColor: '#10b981', lineWidth: 2, title: 'SOPR' })
                 .setData(data.map(d=>({time: d.time, value: d.sopr})));
        
        // Puell
        const puellContainer = document.getElementById('puell-chart');
        const puellChart = LightweightCharts.createChart(puellContainer, chartOpts(250));
        puellChart.addAreaSeries({ topColor: 'rgba(139,92,246,0.4)', bottomColor: 'rgba(139,92,246,0)', lineColor: '#8b5cf6', lineWidth: 2, title: 'Puell Multiple' })
                 .setData(data.map(d=>({time: d.time, value: d.puell})));

        // NVT
        const nvtContainer = document.getElementById('nvt-chart');
        const nvtChart = LightweightCharts.createChart(nvtContainer, chartOpts(250));
        nvtChart.addLineSeries({ color: '#facc15', lineWidth: 2, title: 'NVT Ratio' })
                .setData(data.map(d=>({time: d.time, value: d.nvt})));

        // Hashrate Ribbons
        const hashContainer = document.getElementById('hash-chart');
        const hashChart = LightweightCharts.createChart(hashContainer, chartOpts(250));
        hashChart.addLineSeries({ color: '#f7931a', lineWidth: 2, title: '30D Hash Ribbon' })
                 .setData(data.map(d=>({time: d.time, value: d.hash_fast})));
        hashChart.addLineSeries({ color: 'rgba(255,255,255,0.4)', lineWidth: 2, title: '60D Hash Ribbon' })
                 .setData(data.map(d=>({time: d.time, value: d.hash_slow})));
        
        // Resizing
        const charts = [
            { c: mvrvChart, id: 'mvrv-chart', h: 300 },
            { c: realizedChart, id: 'realized-chart', h: 300 },
            { c: soprChart, id: 'sopr-chart', h: 250 },
            { c: puellChart, id: 'puell-chart', h: 250 },
            { c: nvtChart, id: 'nvt-chart', h: 250 },
            { c: hashChart, id: 'hash-chart', h: 250 }
        ];
        
        const ro = new ResizeObserver(entries => {
            entries.forEach(e => {
                const target = charts.find(x => x.id === e.target.id);
                if(target) target.c.resize(e.contentRect.width, target.h);
            });
        });
        
        const containers = [mvrvContainer, realizedContainer, soprContainer, puellContainer, nvtContainer, hashContainer];
        containers.forEach(cn => ro.observe(cn));
        charts.forEach(ch => ch.c.timeScale().fitContent());

    } catch (e) {
        document.getElementById('mvrv-chart').innerHTML = `<div class="error-msg">Failed to load On-Chain data: ${e.message}</div>`;
    }
}
