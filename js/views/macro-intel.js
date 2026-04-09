async function renderMindshare() {
    appEl.innerHTML = skeleton(1);
    const [data, tvlData] = await Promise.all([
        fetchAPI(`/mindshare?v=${Date.now()}`),
        fetchAPI('/tvl')
    ]);
    if (!data) return;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;"><h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">share</span> Narrative Radar & Capital Flows</h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-narrative')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button><p>Mapping Narrative Momentum vs Developer Engineering Activity alongside Cross-Chain TVL migration.</p></div>
        
        <div style="display:grid; grid-template-columns: 1fr 350px; gap:20px; margin-bottom:20px;">
            <div class="mindshare-container" style="margin-bottom:0px; height: 100%;">
                <div class="chart-container" style="height:550px"><canvas id="mindshareChart" role="img" aria-label="Narrative mindshare bubble chart"></canvas></div>
                <div class="mindshare-legend">
                    <div class="zone zone-alpha"><span>Alpha Quadrant</span>High Narrative, High Engineering</div>
                    <div class="zone zone-hype"><span>Hype Quadrant</span>High Narrative, Low Engineering</div>
                    <div class="zone zone-under"><span>Underlying Quadrant</span>Low Narrative, High Engineering</div>
                    <div class="zone zone-zombie"><span>Developing Zone</span>Low Narrative, Low Engineering</div>
                </div>
            </div>
            
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h2>Cross-Chain TVL Migration</h2>
                    <span class="label-tag">LIQUIDITY</span>
                </div>
                <div style="height: 350px; position: relative; margin-top:20px; margin-bottom:20px;">
                    <canvas id="tvl-doughnut-chart" role="img" aria-label="Cross-chain TVL distribution chart"></canvas>
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
                borderColor: '#7dd3fc',
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
                // Alpha Quadrant (Top Right) — cyan glass
                ctx.fillStyle = 'rgba(125,211,252,0.07)';
                ctx.fillRect(midX, top, right - midX, midY - top);
                // Hype Quadrant (Top Left) — purple glass
                ctx.fillStyle = 'rgba(139,92,246,0.06)';
                ctx.fillRect(left, top, midX - left, midY - top);
                // Underlying Quadrant (Bottom Right) — emerald glass
                ctx.fillStyle = 'rgba(52,211,153,0.05)';
                ctx.fillRect(midX, midY, right - midX, bottom - midY);
                // Developing Quadrant (Bottom Left) — neutral glass
                ctx.fillStyle = 'rgba(148,163,184,0.04)';
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
                    grid: { color: ct => ct.tick.value === 50 ? 'rgba(0, 242, 255, 0.3)' : alphaColor(0.03) } 
                },
                y: { 
                    min: 0, max: 100, 
                    title: { display: true, text: 'NARRATIVE MOMENTUM (Y)', color: '#8b949e', font: { size: 10, weight: 'bold' } }, 
                    grid: { color: ct => ct.tick.value === 50 ? 'rgba(0, 242, 255, 0.3)' : alphaColor(0.03) } 
                }
            },
            plugins: {
                tooltip: { 
                    backgroundColor: 'rgba(13, 17, 23, 0.9)',
                    titleColor: '#7dd3fc',
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
                    borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b',
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
                <h2>Intelligence Catalyst Compass</h2>
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
            <h2><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">auto_awesome</span> Intelligence Catalyst Compass</h2>
            <p>Tracking high-impact earnings and macro events across the digital asset ecosystem.</p>
        </div>

        <div class="catalyst-calendar-strip" style="display:flex; gap:10px; margin-bottom:2rem; overflow-x:auto; padding-bottom:10px">
            ${days.map(d => `
                <div class="catalyst-day ${d.hasEvent ? 'has-event' : ''}" 
                     onclick="activeCatalystDate = activeCatalystDate === '${d.date}' ? null : '${d.date}'; renderCatalysts()"
                     style="flex:1; min-width:60px; background:${activeCatalystDate === d.date ? 'rgba(0, 242, 255, 0.15)' : alphaColor(0.02)}; border:1px solid ${d.hasEvent || activeCatalystDate === d.date ? 'var(--accent)' : 'var(--border)'}; border-radius:12px; padding:12px 5px; text-align:center; cursor:pointer; transition:all 0.2s">
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
                        <span style="font-size:0.6rem; font-weight:900; background:${alphaColor(0.05)}; padding:3px 10px; border-radius:4px; color:var(--text-dim)">${c.type}</span>
                        <span class="event-countdown-badge" style="background:${c.days_until <= 3 ? 'var(--risk-high)' : 'var(--accent)'}; color:#000; font-size:0.55rem; font-weight:900; padding:2px 8px; border-radius:4px">
                            T-${c.days_until} DAYS
                        </span>
                    </div>
                    <h3 style="font-size:1.1rem; margin-bottom:0.5rem; color:${c.impact === 'Extreme' ? 'var(--risk-high)' : 'var(--text)'}">${c.event}</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem">
                        <div style="font-size:0.7rem; color:var(--text-dim)">DATE: <span style="color:var(--text)">${c.date}</span></div>
                        <div style="font-size:0.7rem; color:var(--text-dim)">IMPACT: <span style="font-weight:900; color:var(--risk-low)">${c.impact.toUpperCase()}</span></div>
                    </div>
                    ${c.ticker !== 'MARKET' ? `<div style="margin-top:1rem; padding-top:1rem; border-top:1px solid ${alphaColor(0.05)}; font-size:0.6rem; color:var(--accent)">CLICK TO OPEN AI ANALYST</div>` : ''}
                </div>
            `).join('') : '<div class="empty-state">No major catalysts scheduled for this date. Select another day or clear filter.</div>'}
        </div>
    `;
}

// ============= Macro Intelligence Hub =============
async function renderMacroCalendar(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    appEl.innerHTML = skeleton(6);
    const data = await fetchAPI('/macro-calendar');
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Macro Intelligence Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">calendar_month</span>Macro Calendar <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-macro-calendar')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p>Upcoming FOMC, CPI, NFP, PCE dates with historical BTC impact scoring from real price data.</p>
        </div>
        ${tabs ? renderHubTabs('calendar', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Macro Event Calendar</h2>
        

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
                    <h2>Economic Intelligence Calendar</h2>
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
                    <span id="yc-source-badge" style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;padding:2px 8px;border-radius:100px;background:rgba(148,163,184,0.1);color:#94a3b8;margin-left:8px">LOADING…</span>
                </div>
                <div style="height:300px; width:100%; position:relative;">
                    <div id="yc-loading-mcal" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--text-dim);font-size:0.7rem">
                        <div class="loader" style="width:24px;height:24px"></div>Loading live yields…
                    </div>
                    <canvas id="yieldCurveChart" role="img" aria-label="US Treasury yield curve chart" style="display:none"></canvas>
                </div>
                <div id="yc-footer" style="margin-top:10px; font-size:0.75rem; color:var(--text-dim)">
                    Curve inversion (short-term yields &gt; long-term yields) often predicts liquidity contraction.
                </div>
            </div>

        </div>
    `;

    // Live Yield Curve — fetch real anchor points and interpolate full 8-point curve
    setTimeout(async () => {
        const ycCtx  = document.getElementById('yieldCurveChart');
        const loader = document.getElementById('yc-loading-mcal');
        const badge  = document.getElementById('yc-source-badge');
        const footer = document.getElementById('yc-footer');
        if (!ycCtx) return;

        // lerp helper
        const lerp = (a, b, t) => +(a + (b - a) * t).toFixed(3);

        let y1M, y3M, y6M, y1Y, y2Y, y5Y, y10Y, y30Y, source = 'synthetic', inverted = false;

        try {
            const ycData = await fetchAPI('/yield-curve');
            if (ycData && ycData.latest && ycData.latest.y2 != null) {
                const { y2: s, y5, y10, y30 } = ycData.latest; // y2 = ^IRX = short rate
                source = ycData.source || 'yahoo_finance';
                // Interpolate: short(0y) → 5Y → 10Y → 30Y
                // Maturities in years: 1/12, 3/12, 6/12, 1, 2, 5, 10, 30
                y1M  = lerp(s, y5, (1/12) / 5);   // ~0.017 of 0→5
                y3M  = s;                           // ^IRX is 13-week ≈ 3M
                y6M  = lerp(s, y5, 0.5 / 5);
                y1Y  = lerp(s, y5, 1   / 5);
                y2Y  = lerp(s, y5, 2   / 5);
                y5Y  = y5;
                y10Y = y10;
                y30Y = y30;
                inverted = (y2Y - y10Y) > 0;       // 2Y/10Y inversion check
            } else throw new Error('no data');
        } catch(e) {
            // Fallback: static curve as of last known values
            [y1M, y3M, y6M, y1Y, y2Y, y5Y, y10Y, y30Y] = [5.18, 5.22, 5.10, 4.90, 4.61, 4.32, 4.28, 4.52];
            source = 'synthetic';
        }

        const yieldsData  = [y1M, y3M, y6M, y1Y, y2Y, y5Y, y10Y, y30Y];
        const labels      = ['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', '30Y'];
        const curveColor  = inverted ? '#f87171' : '#22c55e';
        const curveFill   = inverted ? 'rgba(248,113,113,0.06)' : 'rgba(34,197,94,0.06)';
        const yMin        = Math.floor(Math.min(...yieldsData) * 10) / 10 - 0.2;
        const yMax        = Math.ceil(Math.max(...yieldsData)  * 10) / 10 + 0.2;

        // Update badge
        if (badge) {
            badge.textContent  = source === 'synthetic' ? '◌ SYNTHETIC' : '● LIVE Yahoo';
            badge.style.background = source === 'synthetic' ? 'rgba(148,163,184,0.1)' : 'rgba(34,197,94,0.12)';
            badge.style.color      = source === 'synthetic' ? '#94a3b8'               : '#22c55e';
        }

        // Update footer with inversion status
        if (footer) {
            const spread = +(y10Y - y2Y).toFixed(2);
            const spreadDir = spread >= 0 ? `+${spread}%` : `${spread}%`;
            footer.innerHTML = inverted
                ? `<span style="color:#ef4444;font-weight:700">⚠ YIELD CURVE INVERTED — 2Y/10Y Spread: ${spreadDir}</span> · Short-term yields above long-term signals elevated recession risk.`
                : `<span style="color:#22c55e;font-weight:700">✓ Normal Curve — 2Y/10Y Spread: +${spread}%</span> · 2Y: ${y2Y}% · 10Y: ${y10Y}% · 30Y: ${y30Y}%`;
        }

        // Hide loader, show canvas
        if (loader) loader.style.display = 'none';
        ycCtx.style.display = 'block';

        new Chart(ycCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'US Treasury Yield (%)',
                    data: yieldsData,
                    borderColor: curveColor,
                    backgroundColor: curveFill,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: yieldsData.map((v, i) =>
                        (i > 0 && yieldsData[i] > yieldsData[i-1]) ? '#f87171' : curveColor
                    ),
                    pointBorderColor: curveColor,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13,17,23,0.95)',
                        titleColor: curveColor,
                        bodyColor: '#e6edf3',
                        padding: 10,
                        callbacks: {
                            label: c => ` ${c.raw.toFixed(2)}%`,
                            afterLabel: c => {
                                const prev = c.dataIndex > 0 ? yieldsData[c.dataIndex - 1] : null;
                                if (prev === null) return '';
                                const diff = (c.raw - prev).toFixed(2);
                                return diff > 0 ? ` ▲ +${diff}% vs prior` : ` ▼ ${diff}% vs prior`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: alphaColor(0.05) },
                        ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 } }
                    },
                    y: {
                        title: { display: true, text: 'Yield (%)', color: '#8b949e' },
                        grid: { color: (ctx) => ctx.tick.value === 0 ? alphaColor(0.15) : alphaColor(0.05) },
                        ticks: {
                            color: '#8b949e',
                            font: { family: 'JetBrains Mono', size: 10 },
                            callback: v => v.toFixed(2) + '%'
                        },
                        suggestedMin: yMin,
                        suggestedMax: yMax
                    }
                }
            }
        });
    }, 50);
}

