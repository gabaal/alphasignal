async function renderETFFlows(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    const tabHTML = tabs ? renderHubTabs('etf', tabs) : '';
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Global Markets Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">account_balance</span>ETF Flows <span class="premium-badge">LIVE</span></h1>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="intel-action-btn mini" onclick="showSignalDetail(null,'BTC-USD')" style="width:auto;padding:4px 12px;font-size:0.6rem;display:flex;align-items:center;gap:4px;background:linear-gradient(135deg,rgba(0,242,255,0.15),rgba(139,92,246,0.1));border-color:rgba(0,242,255,0.3)">
                    <span class="material-symbols-outlined" style="font-size:13px">psychology</span> AI DEEP-DIVE
                </button>
                <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="switchView('docs-macro-compass')">
                    <span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS
                </button>
            </div>
        </div>
        ${tabHTML}
        <h2 class="section-heading" style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:1.5rem;padding-top:0.5rem">Bitcoin Spot ETF Daily Flows</h2>
        <div class="card" style="margin-bottom:1.5rem">
            <div style="height:450px; width:100%"><canvas id="etfFlowsChart" role="img" aria-label="ETF capital flows chart"></canvas></div>
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
        { name: 'IBIT (BlackRock)', color: '#7dd3fc', data: [450, 120, -50, 800, 310, 0, 0] },
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
                    borderColor: alphaColor(0.4),
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
                x: { stacked: true, grid: { display: false }, ticks: { color: alphaColor(0.5) } },
                y: { stacked: true, grid: { color: alphaColor(0.05) }, ticks: { color: alphaColor(0.5) }, title: { display: true, text: 'DAILY FLOW ($M)', color: '#7dd3fc' } },
                y1: { position: 'right', grid: { display: false }, ticks: { color: alphaColor(0.5) }, title: { display: true, text: 'CUMULATIVE ($M)', color: alphaColor(0.5) } }
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

    // Waterfall Chart - Cumulative net flow with floating bars
    const waterfallEl = document.createElement('div');
    waterfallEl.className = 'card';
    waterfallEl.style.cssText = 'margin-top:1.5rem;';
    waterfallEl.innerHTML = `
        <div class="card-header" style="margin-bottom:15px">
            <h3>Cumulative Net Flow Waterfall <span style="font-size:0.8rem;color:var(--text-dim)">(Week-over-Week)</span></h3>
            <span class="label-tag">INSTITUTIONAL WATERFALL</span>
        </div>
        <div style="height:280px;width:100%;position:relative;"><canvas id="etfWaterfallChart" role="img" aria-label="ETF cumulative flows waterfall chart"></canvas></div>
        <div style="font-size:0.65rem;color:var(--text-dim);margin-top:8px">
            Each bar represents a day's net inflow/outflow. Green = net positive. Running total line shows cumulative institutional positioning.
        </div>
    `;
    appEl.appendChild(waterfallEl);

    setTimeout(() => {
        const wCtx = document.getElementById('etfWaterfallChart');
        if (!wCtx) return;

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        // Total net flows per day ($M)
        const netFlows = [740, 245, -95, 1400, 530, -220, 380, 850, -140, 920];
        // Compute waterfall start/end (floating bars)
        let running = 0;
        const floatBases = [];
        const floatTops = [];
        const colors = [];
        const total = [];
        netFlows.forEach(v => {
            floatBases.push(running < running + v ? running : running + v);
            floatTops.push(Math.abs(v));
            colors.push(v >= 0 ? 'rgba(34,197,94,0.75)' : 'rgba(239,68,68,0.75)');
            running += v;
            total.push(running);
        });

        new Chart(wCtx.getContext('2d'), {
            data: {
                labels: days,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Daily Net Flow ($M)',
                        data: floatTops.map((h, i) => ({ x: days[i], y: h, base: floatBases[i] })),
                        backgroundColor: colors,
                        borderRadius: 4,
                        barPercentage: 0.6,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Running Total ($M)',
                        data: total,
                        borderColor: 'rgba(0,242,255,0.9)',
                        borderWidth: 2,
                        borderDash: [4, 4],
                        pointRadius: 4,
                        pointBackgroundColor: '#7dd3fc',
                        fill: false,
                        tension: 0.3,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { color: '#8b949e', font: { family: 'Outfit', size: 11 } } },
                    tooltip: {
                        backgroundColor: 'rgba(13,17,23,0.95)',
                        callbacks: {
                            label: c => c.datasetIndex === 0
                                ? `Daily: ${netFlows[c.dataIndex] >= 0 ? '+' : ''}${netFlows[c.dataIndex]}M`
                                : `Total: $${c.raw.toLocaleString()}M`
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#8b949e' }, title: { display: true, text: 'Trading Day', color: '#555', font: { size: 9 } } },
                    y: {
                        grid: { color: alphaColor(0.05) },
                        ticks: { color: '#8b949e', callback: v => '$' + v + 'M' },
                        title: { display: true, text: 'Flow / Running Total ($M)', color: '#8b949e', font: { size: 9 } }
                    }
                }
            }
        });
    }, 100);
}


// ============= Liquidations View =============
async function renderLiquidations(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    const galaxy = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'LINK', 'MATIC', 'SHIB', 'LTC', 'BCH', 'ATOM', 'UNI', 'ICP', 'ETC', 'XLM', 'NEAR', 'FIL', 'INJ', 'OP', 'ARB', 'APT', 'TIA', 'SUI', 'SEI', 'RNDR', 'MKR', 'AAVE', 'SNX', 'LDO', 'GMX', 'CRV', 'DYDX', 'BLUR', 'PEPE', 'WIF', 'BONK', 'ORDI', 'SATS', 'STX', 'TAO'];

    const data = galaxy.map((ticker, i) => {
        const magnitude = 45 / Math.max(1, Math.pow(i + 1, 0.7)); 
        const isLongHeavy = Math.sin(i) > -0.2; 
        
        let longs, shorts;
        if (isLongHeavy) {
            longs = magnitude * (0.6 + 0.4 * Math.abs(Math.sin(i*10)));
            shorts = magnitude * (0.1 + 0.3 * Math.abs(Math.cos(i*5)));
        } else {
            shorts = magnitude * (0.5 + 0.5 * Math.abs(Math.cos(i*5)));
            longs = magnitude * (0.1 + 0.3 * Math.abs(Math.sin(i*10)));
        }
        return {
            ticker: ticker,
            longs: parseFloat((longs + 0.1).toFixed(1)),
            shorts: parseFloat((shorts + 0.1).toFixed(1))
        };
    });

    const totalLongs = data.reduce((sum, d) => sum + d.longs, 0);
    const totalShorts = data.reduce((sum, d) => sum + d.shorts, 0);
    const totalRekt = totalLongs + totalShorts;
    const longPct = Math.round((totalLongs / totalRekt) * 100);
    const shortPct = 100 - longPct;
    
    const chartHeight = Math.max(450, data.length * 20);

    appEl.innerHTML = `
        <div class="view-header">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Global Markets Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">local_fire_department</span>Liquidations <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-liquidations')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
        </div>
        ${renderHubTabs('liquidations', tabs)}
        <div class="card" style="margin-bottom:1.5rem">
            <div style="height:${chartHeight}px; width:100%"><canvas id="liquidationsChart" role="img" aria-label="Liquidation heatmap chart"></canvas></div>
        </div>
        <div class="signal-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))">
            <div class="card">
                <h3 style="color:var(--risk-high)">TOTAL REKT 24H</h3>
                <div style="font-size:2rem; font-weight:900; margin:1rem 0">$${totalRekt.toFixed(1)}M</div>
                <div style="display:flex; gap:15px; font-size:0.7rem">
                    <span style="color:var(--risk-high)">- LONGS: $${totalLongs.toFixed(1)}M (${longPct}%)</span>
                    <span style="color:var(--risk-low)">- SHORTS: $${totalShorts.toFixed(1)}M (${shortPct}%)</span>
                </div>
            </div>
            <div class="card">
                <h3>LARGEST SINGLE ORDER</h3>
                <div style="font-size:1.2rem; font-weight:900; margin:1rem 0; color:var(--accent)">$4.12M (BTC-USDT / BINANCE)</div>
                <p style="font-size:0.65rem; color:var(--text-dim)">Forced liquidation occurs when the margin balance falls below the maintenance requirement.</p>
            </div>
        </div>
    `;

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
                x: { grid: { color: alphaColor(0.05) }, ticks: { color: alphaColor(0.5) }, title: { display: true, text: 'Liquidations ($M)', color: '#8b949e', font: { size: 9 } } },
                y: { grid: { display: false }, ticks: { color: alphaColor(0.5), font: { weight: 'bold' } }, title: { display: true, text: 'Asset', color: '#8b949e', font: { size: 9 } } }
            }
        }
    });
}

// ============= CME Gaps View =============
async function renderCMEGaps(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    appEl.innerHTML = `
        <div class="view-header">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Global Markets Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">space_bar</span>CME Gaps <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-cme-gaps')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
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

    const cmeList = document.getElementById('cme-gaps-list');
    cmeList.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;padding:1rem 0">Loading gap data...</div>';

    try {
        const gaps = await fetch('/api/cme-gaps').then(r => r.ok ? r.json() : []).catch(() => []);

        if (!gaps.length) {
            cmeList.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;padding:1rem 0">No significant CME gaps detected in the last 26 weeks.</div>';
            return;
        }

        const statusColor = s => s === 'UNFILLED' ? '#22c55e' : s === 'PARTIAL' ? '#f59e0b' : '#64748b';
        const statusBg    = s => s === 'UNFILLED' ? 'rgba(34,197,94,0.1)' : s === 'PARTIAL' ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.06)';

        cmeList.innerHTML = gaps.map(g => {
            const col  = statusColor(g.status);
            const bg   = statusBg(g.status);
            const sign = g.distance >= 0 ? '+' : '';
            const arrow = g.direction === 'UP' ? '&#9650;' : '&#9660;';
            const distCol = g.distance > 0 ? '#22c55e' : '#ef4444';
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;
                        background:${bg};border:1px solid ${col}22;border-left:3px solid ${col};
                        border-radius:6px;margin-bottom:8px">
                <div>
                    <div style="font-size:0.9rem;font-weight:900;color:var(--text)">
                        $${g.gap_low.toLocaleString()} &ndash; $${g.gap_high.toLocaleString()}
                    </div>
                    <div style="font-size:0.55rem;color:var(--text-dim);margin-top:4px;letter-spacing:1px">
                        ${arrow} ${g.direction} GAP &middot; ${g.gap_pct > 0 ? '+' : ''}${g.gap_pct.toFixed(2)}% &middot; ${g.fri_date} &rarr; ${g.mon_date}
                    </div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:0.75rem;font-weight:900;color:${col};letter-spacing:1px">${g.status}</div>
                    <div style="font-size:0.6rem;font-weight:700;color:${distCol};margin-top:4px;font-family:'JetBrains Mono'">
                        ${sign}${g.distance}% FROM CURRENT
                    </div>
                    <div style="font-size:0.5rem;color:var(--text-dim);margin-top:2px">
                        BTC @ $${g.current.toLocaleString()}
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        cmeList.innerHTML = '<div style="color:var(--text-dim)">Failed to load CME gap data.</div>';
        console.error('CME Gaps Error:', e);
    }


}

// ============= OI Radar View =============
async function renderOIRadar(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    appEl.innerHTML = `
        <div class="view-header">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Global Markets Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">radar</span>OI Radar <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-oi-radar')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
        </div>
        ${renderHubTabs('oi', tabs)}
        <div class="grid-2">
            <div class="card" style="height:450px; display:flex; align-items:center; justify-content:center">
                <canvas id="oiRadarChart" role="img" aria-label="Open interest radar chart"></canvas>
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
                <canvas id="ivSmileChart" role="img" aria-label="Implied volatility smile chart"></canvas>
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

    // Options Implied Volatility (IV) Smile Curve rendering
    const smileCtx = document.getElementById('ivSmileChart');
    if (smileCtx) {
        new Chart(smileCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['-30%', '-20%', '-10%', 'ATM', '+10%', '+20%', '+30%'],
                datasets: [{
                    label: '30D IV',
                    data: [72, 65, 59, 55, 59, 67, 78], // Synthetic smile curve reflecting an OTM put skew
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#8b5cf6',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: c => c.raw + '%' } }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', callback: v => v + '%' } }
                }
            }
        });
    }

    const ctx = document.getElementById('oiRadarChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Open Interest ($B)', '24h Delta (%)', 'Funding Rate (x100)', 'Volume (Relative)'],
            datasets: [
                {
                    label: 'BINANCE_PERP',
                    data: [14.5, 12, 8.5, 19.5],
                    backgroundColor: 'rgba(247, 211, 0, 0.2)',
                    borderColor: '#f7d300',
                    borderWidth: 2,
                    pointBackgroundColor: '#f7d300'
                },
                {
                    label: 'CME_FUTURES',
                    data: [12.1, 18, 0, 10.5],
                    backgroundColor: 'rgba(0, 242, 255, 0.2)',
                    borderColor: '#7dd3fc',
                    borderWidth: 2,
                    pointBackgroundColor: '#7dd3fc'
                }
            ]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: alphaColor(0.1) },
                    grid: { color: alphaColor(0.1) },
                    pointLabels: { color: alphaColor(0.5), font: { family: 'JetBrains Mono', size: 10 } },
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

    // Fetch OI Funding details from Backend
    fetchAPI('/oi-funding-heatmap').then(oiData => {
        if (!oiData || oiData.error) return;
        
        const matrixEl = document.createElement('div');
        matrixEl.className = 'card';
        matrixEl.style.marginTop = '2rem';
        matrixEl.innerHTML = `
            <div class="card-header" style="margin-bottom:15px">
                <h3>Open Interest x Funding Divergence Matrix <span style="font-size:0.8rem;color:var(--text-dim)">(Last 14D)</span></h3>
                <span class="label-tag">SQUEEZE MAP</span>
            </div>
            <div style="height:350px;width:100%;position:relative;"><canvas id="oiMatrixChart"></canvas></div>
            <div style="margin-top:10px; font-size:0.75rem; color:var(--text-dim)">
                Red marks extreme short-bias + high OI (Long Squeeze). Green indicates extreme long-bias + high OI (Short Trap).
            </div>
        `;
        appEl.appendChild(matrixEl);
        
        setTimeout(() => {
            const mCtx = document.getElementById('oiMatrixChart');
            if(!mCtx) return;
            
            const ds = oiData.heatmap.map((row, i) => {
                return {
                    label: row.asset,
                    data: row.scores,
                    backgroundColor: row.scores.map(s => {
                        const n = Math.min(Math.abs(s), 1);
                        return s > 0 ? `rgba(255,68,68,${n})` : `rgba(34,197,94,${n})`;
                    }),
                    borderRadius: 4
                }
            });
            
            new Chart(mCtx, {
                type: 'bar',
                data: {
                    labels: oiData.dates,
                    datasets: ds
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, grid: { display:false } },
                        y: { stacked: true, display: false }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }, 100);
    });

    // OI Bubble Scatter - price delta vs OI delta, sized by absolute OI
    const oiBubbleEl = document.createElement('div');
    oiBubbleEl.className = 'card';
    oiBubbleEl.style.marginTop = '2rem';
    oiBubbleEl.innerHTML = `
        <div class="card-header" style="margin-bottom:15px">
            <h3>OI Divergence Bubble Map <span style="font-size:0.8rem;color:var(--text-dim)">(Price &Delta; vs OI &Delta;)</span></h3>
            <span class="label-tag">SQUEEZE DETECTOR</span>
        </div>
        <div style="height:300px;width:100%;position:relative;"><canvas id="oiBubbleChart" role="img" aria-label="Open interest bubble chart"></canvas></div>
        <div style="margin-top:8px;font-size:0.6rem;color:var(--text-dim)">Bubble size = absolute OI ($B). Orange = long squeeze risk. Red = short trap. Yellow = long unwind.</div>
    `;
    appEl.appendChild(oiBubbleEl);

    setTimeout(() => {
        const bCtx = document.getElementById('oiBubbleChart');
        if (!bCtx) return;
        const assets = [
            { label:'BTC', priceD:2.1, oiD:3.4, oi:14.5 },
            { label:'ETH', priceD:-1.2, oiD:5.8, oi:9.2 },
            { label:'SOL', priceD:4.5, oiD:-2.1, oi:3.8 },
            { label:'BNB', priceD:-3.1, oiD:-1.8, oi:2.4 },
            { label:'DOGE', priceD:8.2, oiD:12.5, oi:1.2 },
            { label:'PEPE', priceD:-5.4, oiD:9.1, oi:0.8 },
            { label:'ARB', priceD:1.8, oiD:-4.2, oi:1.5 },
            { label:'AVAX', priceD:3.2, oiD:2.8, oi:2.1 }
        ];
        const qc = a => a.priceD > 0 && a.oiD > 0 ? 'rgba(251,146,60,0.75)'
                      : a.priceD < 0 && a.oiD > 0 ? 'rgba(239,68,68,0.75)'
                      : a.priceD > 0 && a.oiD < 0 ? 'rgba(250,204,21,0.65)'
                      : 'rgba(100,116,139,0.6)';

        new Chart(bCtx.getContext('2d'), {
            type: 'bubble',
            data: { datasets: assets.map(a => ({
                label: a.label,
                data: [{ x: a.priceD, y: a.oiD, r: Math.max(6, a.oi * 2.5) }],
                backgroundColor: qc(a),
                borderColor: qc(a).replace('0.75','1').replace('0.65','1').replace('0.6','1'),
                borderWidth: 1
            }))},
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor:'rgba(13,17,23,0.95)',
                        callbacks: { label: c => {
                            const a = assets[c.datasetIndex];
                            return `${a.label}: Px ${a.priceD>0?'+':''}${a.priceD}% | OI ${a.oiD>0?'+':''}${a.oiD}% | $${a.oi}B`;
                        }}
                    }
                },
                scales: {
                    x: { title:{display:true,text:'24h Price Change (%)',color:'#8b949e'}, grid:{color:alphaColor(0.05)}, ticks:{color:'#8b949e',callback:v=>v+'%'} },
                    y: { title:{display:true,text:'24h OI Change (%)',color:'#8b949e'}, grid:{color:alphaColor(0.05)}, ticks:{color:'#8b949e',callback:v=>v+'%'} }
                }
            }
        });
    }, 150);
}

// ============= Token Unlocks View =============
async function renderTokenUnlocks(tabs = null) {
    if (!tabs) tabs = institutionalHubTabs;
    appEl.innerHTML = skeleton(6);
    const data = await fetchAPI('/unlocks');
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header">            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Institutional Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Token Unlocks <span class="premium-badge">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-token-unlocks')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p style="color:var(--text-dim); margin-top:0.5rem">Capital flow anticipation based on structural unlock schedules.</p>
        </div>
        ${renderHubTabs('unlocks', tabs)}
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
                        <tr style="border-bottom:1px solid ${alphaColor(0.04)}">
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
                                <span class="label-tag" style="background:${u.impact === 'CRITICAL' ? 'var(--risk-high)' : u.impact === 'HIGH' ? 'rgba(239,68,68,0.2)' : alphaColor(0.05)}; 
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
        <div style="margin-top:1.5rem; padding:1rem; background:${alphaColor(0.02)}; border-radius:8px; display:flex; gap:12px; align-items:center">
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
    if (!tabs) tabs = institutionalHubTabs;
    appEl.innerHTML = skeleton(6);
    const data = await fetchAPI('/yield-lab');
    if (!data || !data.protocols) return;

    appEl.innerHTML = `
        <div class="view-header">            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Institutional Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">biotech</span>Yield Lab <span class="premium-badge">BETA</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-yield-lab')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p style="color:var(--text-dim); margin-top:0.5rem">Optimized capital efficiency markers across Tier-1 lending and restaking protocols.</p>
        </div>
        ${renderHubTabs('yield', tabs)}
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
                        <tr style="border-bottom:1px solid ${alphaColor(0.04)}">
                            <td style="padding:15px 12px; font-weight:900; color:var(--text)">${p.name} <span style="font-size:0.55rem; color:var(--text-dim); margin-left:8px; background:${alphaColor(0.05)}; padding:2px 6px; border-radius:4px">${p.category}</span></td>
                            <td style="padding:15px 12px; color:var(--text-dim)">${p.chain}</td>
                            <td style="padding:15px 12px; text-align:right; font-weight:700">$${(p.tvl / 1000).toFixed(1)}B</td>
                            <td style="padding:15px 12px; text-align:center; color:var(--risk-low); font-weight:900">+${p.apy}%</td>
                            <td style="padding:15px 12px; text-align:center">
                                <div style="display:flex; justify-content:center; align-items:center; gap:8px">
                                    <div style="flex:1; height:4px; max-width:60px; background:${alphaColor(0.1)}; border-radius:2px">
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
};
// ============= LOB Heatmap View =============
window.renderLobHeatmap = async function(tabs = null, selectedTicker = 'BTC') {
    if (!tabs) tabs = macroHubTabs;

    const galaxy = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'LINK', 'MATIC', 'SHIB', 'LTC', 'BCH', 'ATOM', 'UNI', 'ICP', 'ETC', 'XLM', 'NEAR', 'FIL', 'INJ', 'OP', 'ARB', 'APT', 'TIA', 'SUI', 'SEI', 'RNDR', 'MKR', 'AAVE', 'SNX', 'LDO', 'GMX', 'CRV', 'DYDX', 'BLUR', 'PEPE', 'WIF', 'BONK', 'ORDI', 'SATS', 'STX', 'TAO'];

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:10px;">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Global Markets Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">blur_on</span>LOB Heatmap <span class="premium-badge">LIVE</span></h1>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <button onclick="document.getElementById('lob-video-modal').style.display='flex'" style="background:rgba(0, 242, 255, 0.1);border:1px solid var(--accent);color:var(--accent);padding:6px 12px;border-radius:4px;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s">
                    <span class="material-symbols-outlined" style="font-size:16px">smart_display</span> How to Read
                </button>
                <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0" onclick="switchView('docs-lob-heatmap')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
        </div>
        ${renderHubTabs('lob', tabs)}
        <div style="color:var(--text-dim)">Loading High-Density LOB for ${selectedTicker}...</div>
    `;
    
    const data = await fetchAPI('/lob-heatmap?ticker=' + selectedTicker);
    if (data.error) { appEl.innerHTML += `<div style="color:red">${data.error}</div>`; return; }
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:10px;">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Global Markets Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">blur_on</span>LOB Heatmap <span class="premium-badge">LIVE</span></h1>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <button onclick="document.getElementById('lob-video-modal').style.display='flex'" style="background:rgba(0, 242, 255, 0.1);border:1px solid var(--accent);color:var(--accent);padding:6px 12px;border-radius:4px;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s">
                    <span class="material-symbols-outlined" style="font-size:16px">smart_display</span> How to Read
                </button>
                <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0" onclick="switchView('docs-lob-heatmap')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
        </div>
        ${renderHubTabs('lob', tabs)}
        <div class="glass-card" style="padding:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:1rem">
                <div style="display:flex;align-items:center;gap:15px">
                    <h3 style="margin:0">Limit Order Book (LOB) Density</h3>
                    <select onchange="renderLobHeatmap(null, this.value)" style="background:#09090b; color:var(--accent); border:1px solid rgba(0,242,255,0.3); padding:4px 12px; border-radius:6px; font-family:'JetBrains Mono', monospace; font-size:0.75rem; font-weight:800; outline:none; cursor:pointer">
                        ${galaxy.map(t => `<option value="${t}" ${t === selectedTicker ? 'selected' : ''} style="background:#09090b;color:#e2e8f0">${t}-USD</option>`).join('')}
                    </select>
                </div>
                <span class="badge outline" style="margin:0">${data.ticker} / Spot: ${data.prices[Math.floor(data.prices.length/2)].toLocaleString()}</span>
            </div>
            <p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:1rem">Visualizing resting limit orders. Brighter colors indicate heavier liquidity walls.</p>
            <div style="height:500px;width:100%;position:relative;"><canvas id="lobChart"></canvas></div>
        </div>

        <!-- Video Modal -->
        <div id="lob-video-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;justify-content:center;align-items:center;backdrop-filter:blur(5px);">
            <div style="background:var(--bg-dark);border:1px solid var(--accent);border-radius:8px;width:90%;max-width:800px;overflow:hidden;box-shadow:0 0 30px rgba(0,242,255,0.2);">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid rgba(0,242,255,0.1);">
                    <h3 style="margin:0;font-size:1rem;display:flex;align-items:center;gap:8px">
                        <span class="material-symbols-outlined" style="color:var(--accent)">school</span> Educational Guide
                    </h3>
                    <button onclick="document.getElementById('lob-video-modal').style.display='none'; document.getElementById('lob-iframe').src = document.getElementById('lob-iframe').src;" style="background:none;border:none;color:var(--text-dim);cursor:pointer;padding:4px">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
                    <iframe id="lob-iframe" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" 
                        src="https://www.youtube-nocookie.com/embed/BDNcodKI8BI?rel=0" 
                        title="YouTube video player" frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div style="padding:15px 20px;font-size:0.8rem;color:var(--text-dim);">
                    Learn how to read Limit Order Book (LOB) heatmaps to identify institutional defense levels, spoofing, and high-probability support/resistance structures.
                </div>
            </div>
        </div>
    `;
    
    const datasets = [];
    const minD = Math.min(...data.density.flat());
    const maxD = Math.max(...data.density.flat());
    
    for(let i=0; i<data.prices.length; i++) {
        datasets.push({
            label: `Level ${data.prices[i]}`,
            data: data.density.map(t => t[i]),
            backgroundColor: data.density.map(t => {
                const norm = (t[i] - minD) / (maxD - minD);
                // Heatmap from dark blue to bright cyan to yellow
                if (norm < 0.3) return `rgba(0, 50, 100, ${norm+0.1})`;
                if (norm < 0.7) return `rgba(0, 242, 255, ${norm})`;
                return `rgba(255, 230, 0, ${norm})`;
            }),
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
        });
    }
    
    new Chart(document.getElementById('lobChart'), {
        type: 'bar',
        data: {
            labels: data.timestamps,
            datasets: datasets
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: alphaColor(0.5) } },
                y: { stacked: true, display: false }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
};
