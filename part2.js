                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { 
                        color: '#888', 
                        font: { family: 'JetBrains Mono' },
                        callback: function(value) {
                            return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value);
                        }
                    } 
                },
                x: { grid: { display: false }, ticks: { color: '#888', font: { family: 'JetBrains Mono' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } }
            }
        }
    });
}

// ============= Pack G2: Mindshare View =============
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

// ============= Whale Pulse =============
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
                <div style="font-size:0.7rem; color:var(--text-dim); margin-bottom:5px">ENGINE_STATUS</div>
                <div style="font-size:1.5rem; font-weight:800; color:var(--risk-low)">${data.status}</div>
            </div>
        </div>

        <div class="card-grid">
            <div class="glass-card" style="grid-column: 1 / -1">
                <div class="card-header">
                    <h3>Economic Intelligence Calendar</h3>
                    <span class="label-tag">WEEKLYWIDE_SYNC</span>
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
        </div>
    `;
}

async function renderWhales() {
    appEl.innerHTML = skeleton(5);
    const [data, entityData, execData] = await Promise.all([
        fetchAPI('/whales'),
        fetchAPI('/whales_entity?ticker=BTC-USD'),
        fetchAPI('/execution-time?ticker=BTC-USD')
    ]);
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">waves</span> Institutional Whale Pulse</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-whales')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Real-time monitor of high-conviction transfers across BTC, ETH, and SOL networks.</p>
        </div>

        <div class="whale-pulse-header" style="display:grid; grid-template-columns: 1fr 1fr 300px; gap:2rem; margin-bottom:2rem">
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h3>24H Net Flow History (BTC)</h3>
                    <span class="label-tag">AGGREGATED_FLOW</span>
                </div>
                <div style="height: 200px; position: relative;">
                    <canvas id="whale-flow-chart"></canvas>
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h3>Volume Tier Matrix (Whales vs Retail)</h3>
                    <span class="label-tag">FLOW_DISPARITY</span>
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
                    <span class="label-tag">POLAR_MATRIX</span>
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
            ${data.map(w => `
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
    
    if (entityData && entityData.volume_tiers) {
        new Chart(document.getElementById('whale-tier-chart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Retail (<$1k)', 'Pro ($1k-$100k)', 'Whale (>$100k)'],
                datasets: [{
                    label: 'Volume Density (%)',
                    data: entityData.volume_tiers,
                    backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(247, 147, 26, 0.7)', 'rgba(34, 197, 94, 0.7)'],
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display:true, text:'% of Transaction Volume' } },
                    y: { grid: { display:false } }
                }
            }
        });
    }

    if (execData) {
        renderExecutionTopography(execData);
    }
}

function renderWhaleFlowChart(history) {
    const ctx = document.getElementById('whale-flow-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => `${h.hour}h`),
            datasets: [{
                label: 'Net Flow',
                data: history.map(h => h.flow),
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#666', font: { size: 10 } }
                }
            }
        }
    });
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
async function renderMarketPulse() {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/market-pulse');
    if (!data || !data.leadLag) return;
async function renderMacroPulse(tabs) {
    renderMacroSync(tabs);
}

// ============= Pack G Rotation & Macro Sync =============
async function renderMacroSync(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('pulse', tabs) : '';
    appEl.innerHTML = skeleton(2); // Keep skeleton for initial load
    const [data, sectors, corrData, pulseData] = await Promise.all([fetchAPI('/macro'), fetchAPI('/sectors'), fetchAPI('/correlation-matrix'), fetchAPI('/market-pulse')]);
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Macro Intelligence Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabHTML}
        <div class="macro-sync-container">
            <div class="macro-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:15px">
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
                    <span class="label-tag">NxN_STATISTICS</span>
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
                const ctx = document.getElementById('dominanceChart').getContext('2d');
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
            
            const fundingData = await fetchAPI('/funding-rates');
            if (fundingData && fundingData.labels) {
                const ctx2 = document.getElementById('fundingOscillatorChart').getContext('2d');
                
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

            const ssrData = await fetchAPI('/ssr');
            if (ssrData && ssrData.labels) {
                const ctx3 = document.getElementById('ssrChart').getContext('2d');
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

            if (sectors) renderSectorTreemap(sectors);
            if (corrData && corrData.assets) renderCorrelationTable(corrData);

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

async function renderRotation() {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/rotation');
    if (!data || !data.matrix) return;
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">rotate_right</span> Sector Correlation Matrix</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-correlation')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
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

async function renderStrategyLab() {
    appEl.innerHTML = skeleton(1);
    runStrategyBacktest('BTC-USD', 'trend_regime');
}

async function runStrategyBacktest(ticker, strategy, fast = 20, slow = 50) {
    const data = await fetchAPI(`/backtest?ticker=${ticker}&strategy=${strategy}&fast=${fast}&slow=${slow}`);
    if (!data || !data.summary) return;
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">science</span> Strategy Lab <span class="premium-badge pulse">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-playbook')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Validate quantitative alphas using high-fidelity historical simulations.</p>
        </div>

        <div class="strategy-workspace" style="display:grid; grid-template-columns: 320px 1fr; gap:30px">
            <div class="strategy-controls">
                <div class="control-box">
                    <label>ASSET SELECTION</label>
                    <select id="strat-ticker" class="strat-select" onchange="runStrategyBacktest(this.value, document.getElementById('strat-type').value, document.getElementById('strat-fast')?.value || 20, document.getElementById('strat-slow')?.value || 50)">
                        <option value="BTC-USD" ${ticker === 'BTC-USD' ? 'selected' : ''}>BTC-USD (Bitcoin)</option>
                        <option value="ETH-USD" ${ticker === 'ETH-USD' ? 'selected' : ''}>ETH-USD (Ethereum)</option>
                        <option value="SOL-USD" ${ticker === 'SOL-USD' ? 'selected' : ''}>SOL-USD (Solana)</option>
                        <option value="MSTR" ${ticker === 'MSTR' ? 'selected' : ''}>MSTR (MicroStrategy)</option>
                        <option value="COIN" ${ticker === 'COIN' ? 'selected' : ''}>COIN (Coinbase)</option>
                        <option value="MARA" ${ticker === 'MARA' ? 'selected' : ''}>MARA (Marathon)</option>
                    </select>
                </div>

                <div class="control-box">
                    <label>QUANT STRATEGY</label>
                    <select id="strat-type" class="strat-select" onchange="runStrategyBacktest(document.getElementById('strat-ticker').value, this.value, document.getElementById('strat-fast')?.value || 20, document.getElementById('strat-slow')?.value || 50)">
                        <option value="trend_regime" ${strategy === 'trend_regime' ? 'selected' : ''}>EMA Crossover (Custom)</option>
                        <option value="volatility_breakout" ${strategy === 'volatility_breakout' ? 'selected' : ''}>Volatility Breakout (Keltner)</option>
                        <option value="rsi_mean_revert" ${strategy === 'rsi_mean_revert' ? 'selected' : ''}>RSI Mean Reversion (Trend-Filtered)</option>
                        <option value="bollinger_bands" ${strategy === 'bollinger_bands' ? 'selected' : ''}>Bollinger Band Mean Reversion</option>
                        <option value="vwap_cross" ${strategy === 'vwap_cross' ? 'selected' : ''}>VWAP Crossover (EMA5 Anchor)</option>
                        <option value="macd_momentum" ${strategy === 'macd_momentum' ? 'selected' : ''}>MACD Momentum (12/26/9)</option>
                        <option value="stochastic_cross" ${strategy === 'stochastic_cross' ? 'selected' : ''}>Stochastic Oscillator Cross</option>
                        <option value="z_score" ${strategy === 'z_score' ? 'selected' : ''}>Statistical Arbitrage (Z-Score Core)</option>
                        <option value="supertrend" ${strategy === 'supertrend' ? 'selected' : ''}>Adaptive Supertrend Volatility System</option>
                        <option value="obv_flow" ${strategy === 'obv_flow' ? 'selected' : ''}>Smart Money Flow Divergence (OBV/CVD)</option>
                    </select>
                </div>
                
                <div class="control-box" style="margin-top: 15px; display: flex; gap: 10px;">
                    <div style="flex:1">
                        <label>FAST MA</label>
                        <input type="number" id="strat-fast" class="strat-input" value="${fast}" style="width:100%; border-radius:8px; padding:10px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:white; font-family:'Outfit'" onchange="runStrategyBacktest(document.getElementById('strat-ticker').value, document.getElementById('strat-type').value, this.value, document.getElementById('strat-slow').value)">
                    </div>
                    <div style="flex:1">
                        <label>SLOW MA</label>
                        <input type="number" id="strat-slow" class="strat-input" value="${slow}" style="width:100%; border-radius:8px; padding:10px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:white; font-family:'Outfit'" onchange="runStrategyBacktest(document.getElementById('strat-ticker').value, document.getElementById('strat-type').value, document.getElementById('strat-fast').value, this.value)">
                    </div>
                </div>
                
                <div class="lab-metrics-grid" style="margin-top:2rem">
                    <div class="mini-stat">
                        <label>SHARPE RATIO</label>
                        <div class="val">${data.summary.sharpe}</div>
                    </div>
                    <div class="mini-stat">
                        <label>MAX DRAWDOWN</label>
                        <div class="val neg">-${Math.abs(data.summary.maxDrawdown)}%</div>
                    </div>
                    <div class="mini-stat">
                        <label>WIN RATE</label>
                        <div class="val">${data.summary.winRate}%</div>
                    </div>
                </div>

                <button class="intel-action-btn" style="margin-top: 2rem; width: 100%" onclick="shareStrategyResult('${ticker}', ${data.summary.totalReturn})">
                    <span class="material-symbols-outlined">share</span> SHARE PERFORMANCE
                </button>
                <button class="intel-action-btn" style="margin-top: 10px; width: 100%; background:rgba(0, 242, 255, 0.05); border-color:var(--accent); color:var(--accent)" onclick="window.downloadBacktestCSV('${ticker}', '${strategy}')">
                    <span class="material-symbols-outlined" style="font-size:16px">download</span> EXPORT CSV
                </button>
            </div>

            <div class="strategy-results">
                <div class="backtest-summary-cards" style="display:flex; gap:20px; margin-bottom:20px">
                    <div class="summary-card main-return">
                        <label>STRATEGY RETURN (180D)</label>
                        <div class="val ${data.summary.totalReturn >= 0 ? 'pos' : 'neg'}">${data.summary.totalReturn >= 0 ? '+' : ''}${data.summary.totalReturn}%</div>
                    </div>
                    <div class="summary-card bench-return">
                        <label>BENCHMARK (BTC)</label>
                        <div class="val ${data.summary.benchmarkReturn !== undefined ? (data.summary.benchmarkReturn >= 0 ? 'pos' : 'neg') : (data.summary.btcReturn >= 0 ? 'pos' : 'neg')}">${data.summary.benchmarkReturn !== undefined ? (data.summary.benchmarkReturn >= 0 ? '+' : '') + data.summary.benchmarkReturn : (data.summary.btcReturn >= 0 ? '+' : '') + data.summary.btcReturn}%</div>
                    </div>
                    <div class="summary-card alpha-card">
                        <label>EXCESS ALPHA</label>
                        <div class="val pos">${data.summary.alpha >= 0 ? '+' : ''}${data.summary.alpha}%</div>
                    </div>
                </div>

                <div id="strat-tv-container" style="height: 300px; margin-bottom: 20px; background:rgba(0,0,0,0.3); border-radius:12px; border:1px solid rgba(255,255,255,0.05); overflow:hidden"></div>
                <div class="chart-container" style="height: 250px; background: rgba(0,0,0,0.1); border-radius:16px; border:1px solid var(--border); padding: 20px">
                    <canvas id="strategyChart"></canvas>
                </div>

                <div class="glass-card" style="margin-top: 20px; padding: 20px">
                    <div class="card-header" style="margin-bottom:15px">
                        <h3>Monte Carlo Trajectory Matrix</h3>
                        <span class="label-tag">PROBABILITY</span>
                    </div>
                    <div style="height: 350px; position:relative;">
                        <canvas id="monteCarloChart"></canvas>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 15px; display:flex; gap:20px; text-align:center">
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px"><span style="color:#00f2ff">SIMULATIONS:</span><br>20 Paths</div>
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px"><span style="color:#facc15">HORIZON:</span><br>30 Days</div>
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px" id="mc-sigma-label"><span style="color:#bc13fe">VOLATILITY:</span><br>--</div>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px; padding: 20px">
                    <div class="card-header" style="margin-bottom:15px">
                        <h3>Guppy Multiple Moving Average (GMMA)</h3>
                        <span class="label-tag">TREND MECHANICS</span>
                    </div>
                    <div style="height:350px; width:100%; position:relative; border-radius:8px; overflow:hidden">
                        <canvas id="guppyChart"></canvas>
                    </div>
                    <div style="margin-top:15px; font-size:0.75rem; color:var(--text-dim); line-height:1.5">
                        The Guppy Density Ribbon stacks an array of 15 overlapping Exponential Moving Averages. Structural compression signals imminent breakout probability across institutional limits.
                    </div>
                </div>

            </div>
        </div>
    `;

    // Initialize Institutional Visuals
    const curve = data.equityCurve || data.weeklyReturns;
    window.lastBacktestData = curve;
    const histResp = await fetchAPI(`/history?ticker=${ticker}&period=180d`);
    if (histResp && histResp.history && histResp.history.length > 0) {
        createTradingViewChart('strat-tv-container', histResp.history);
        renderGuppyRibbon(histResp.history);
    }
    renderStrategyChart(curve);

    try {
        const mcData = await fetchAPI(`/monte-carlo?ticker=${ticker}`);
        if (mcData && mcData.paths) {
            document.getElementById('mc-sigma-label').innerHTML = `<span style="color:#bc13fe">VOLATILITY:</span><br>${mcData.sigma}% (Ann.)`;
            renderMonteCarloChart(mcData);
        }
    } catch(e) {}
}

function renderMonteCarloChart(data) {
    const ctx = document.getElementById('monteCarloChart');
    if (!ctx) return;
    if (window.activeMCChart) window.activeMCChart.destroy();
    
    const datasets = data.paths.map((p, i) => ({
        label: `Path ${i+1}`,
        data: p,
        borderColor: `rgba(0, 242, 255, ${0.05 + (Math.random() * 0.15)})`,
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.2
    }));
    
    // Add baseline
    datasets.push({
        label: 'Current Spot',
        data: Array(data.dates.length).fill(data.current_price),
        borderColor: 'rgba(255, 62, 62, 0.4)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
    });
    
    window.activeMCChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: { labels: data.dates, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { display: false } },
            scales: {
                x: { grid: { display:false }, ticks: { color: '#888', font: { family: 'JetBrains Mono', size:10 }, maxRotation:0 } },
                y: { position: 'right', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888', font: { family: 'JetBrains Mono' }, callback: function(val) { return '$' + val.toLocaleString(); } } }
            }
        }
    });
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

function renderStrategyChart(curve) {
    const ctx = document.getElementById('strategyChart').getContext('2d');
    if (window.activeStrategyChart) window.activeStrategyChart.destroy();

    window.activeStrategyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: curve.map(p => p.date),
            datasets: [
                {
                    label: 'Strategy Equity',
                    data: curve.map(p => p.portfolio),
                    borderColor: '#00f2ff',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(0, 242, 255, 0.05)'
                },
                {
                    label: 'Benchmark (BTC)',
                    data: curve.map(p => p.benchmark || p.btc),
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1.5,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#8b949e', font: { family: 'Outfit', weight: 800, size: 10 } } },
                tooltip: { 
                    backgroundColor: 'rgba(13, 17, 23, 0.95)',
                    titleColor: '#00f2ff',
                    bodyColor: '#e6edf3',
                    borderColor: '#30363d',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) { return context.dataset.label + ': ' + context.parsed.y + '%'; }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#8b949e', maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { family: 'JetBrains Mono', size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 }, callback: value => value + '%' } }
            }
        }
    });
}

function shareStrategyResult(ticker, returns) {
    const text = `Validating my alpha on ${ticker} with AlphaSignal Strategy Lab. Strategy Return: ${returns}% (180D). 🚀 #AlphaSignal #CryptoIntelligence`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
}

// ============= Newsroom View =============
let currentNewsPage = 1;
const newsPerPage = 5;

async function renderNewsroom() {
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

function openNewsArticle(index) {
    const news = window.lastNewsData[index];
    if (!news) return;

    const modal = document.getElementById('news-modal');
    const body = document.getElementById('news-article-body');
    
    modal.classList.remove('hidden');
    body.innerHTML = `
        <div class="article-header">
            <div class="article-meta">
                <div class="news-tag tag-${news.sentiment.toLowerCase()}">${news.sentiment}</div>
                <div class="news-time">${news.time} // ${news.ticker}</div>
            </div>
            <h2 class="article-title">${news.headline}</h2>
        </div>
        <div class="article-content">
            ${news.content || `<p>${news.summary}</p><p>Full intelligence report is currently being synthesized by AlphaSignal Prime. Check back shortly for deep-dive analysis into the institutional flow dynamics of ${news.ticker}.</p>`}
        </div>
        <div class="article-footer">
            <span>© 2026 AlphaSignal Institutional</span>
            <button class="timeframe-btn" onclick="document.getElementById('news-modal').classList.add('hidden')">CLOSE INTEL</button>
        </div>
    `;
}

async function renderAlphaScore(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('alpha', tabs) : '';
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">electric_bolt</span> Alpha Strategy Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabHTML}
    `;
}

async function renderRiskMatrix() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">grid_on</span> Institutional Correlation Matrix</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-correlation')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
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

async function loadRiskMatrix(tickers = null) {
    if (tickers) window.currentRiskTickers = tickers;
    const currentTickers = window.currentRiskTickers || 'BTC-USD,ETH-USD,SOL-USD,MARA,COIN,MSTR,BNB-USD,XRP-USD,ADA-USD,DOGE-USD';
    const period = document.getElementById('matrix-period')?.value || '60d';
    
    // UI Update for buttons
    const btns = document.querySelectorAll('#risk-matrix-filters .filter-btn');
    btns.forEach(b => {
        if (b.getAttribute('onclick')?.includes(currentTickers)) b.classList.add('active');
        else b.classList.remove('active');
    });

    const container = document.getElementById('matrix-container');
    const data = await fetchAPI(`/correlation?tickers=${currentTickers}&period=${period}`);
    
    if (!data || data.error) {
        container.innerHTML = `<div class="error-msg">Matrix Load Failed: ${data?.error || 'Unknown Error'}</div>`;
        return;
    }

    const tks = currentTickers.split(',');
    container.innerHTML = `
        <div class="rotation-matrix-container">
            <div class="matrix-grid" style="grid-template-columns: 100px repeat(${tks.length}, 1fr)">
                <div></div>
                ${tks.map(t => `<div class="matrix-label horizontal" style="font-size:0.6rem">${t.split('-')[0]}</div>`).join('')}
                ${data.matrix.map((row, i) => `
                    <div class="matrix-label vertical" style="font-size:0.6rem; height:40px">${tks[i].split('-')[0]}</div>
                    ${row.map(val => {
                        const intensity = Math.abs(val);
                        const color = val >= 0 ? `rgba(0, 242, 255, ${intensity * 0.8})` : `rgba(255, 107, 107, ${intensity * 0.8})`;
                        return `<div class="matrix-cell" style="background:${color}; height:40px; font-size:0.7rem; border:0.5px solid rgba(255,255,255,0.05)" title="${tks[i]} vs ${tks[row.indexOf(val)]}: ${val}">${val.toFixed(2)}</div>`;
                    }).join('')}
                `).join('')}
            </div>
        </div>
        <div style="margin-top:2rem; padding:1.5rem; background:rgba(0,242,255,0.05); border:1px solid var(--accent); border-radius:12px">
            <h4 style="color:var(--accent); margin-bottom:0.5rem">Institutional Insight</h4>
            <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.6">
                A correlation above <b>0.85</b> indicates high institutional synchronization. When systemic correlation spikes across all sectors, it often signals a <b>"Risk-Off"</b> regime where alpha is compressed. Conversely, decoupling (low correlation) highlights idiosyncratic opportunities.
            </p>
        </div>
    `;
}

async function renderStressHub() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--risk-high)">warning</span> Institutional Stress Lab</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-risk')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
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

async function renderChainVelocity() {
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
                                <div style="font-size:0.5rem; color:var(--text-dim); font-weight:800">VELOCITY_SCORE</div>
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
                        <span class="premium-badge" style="font-size:0.5rem">L1_NODE</span>
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

async function renderPortfolioOptimizer() {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/portfolio_optimize');
    if(!data) {
        appEl.innerHTML = `<div class="empty-state">
            <span class="material-symbols-outlined" style="font-size:3rem; color:var(--accent); margin-bottom:1rem">lock</span>
            <p>Authentication Required.</p>
        </div>`;
        return;
    }

    const allocHTML = data.allocations.map(a => `
        <div style="display:flex; justify-content:space-between; padding:1rem; border-bottom:1px solid rgba(255,255,255,0.05)">
            <strong style="color:var(--text)">${a.asset}</strong>
            <span style="color:var(--accent); font-weight:bold">${(a.target_weight * 100).toFixed(1)}%</span>
        </div>
    `).join('');

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">donut_large</span> AI Portfolio Rebalancer</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-portfolio-lab')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Risk-adjusted target allocations generated dynamically using Markowitz Efficient Frontier models.</p>
        </div>
        
        <div style="display:grid; grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr); gap:2rem; flex-wrap:wrap;">
            <div class="card" style="padding:2rem">
                <h3 style="margin-bottom:1rem; color:var(--text-dim)">OPTIMAL ASSET WEIGHTS</h3>
                ${allocHTML}
                <div style="margin-top:2rem; padding:1rem; background:rgba(0,0,0,0.3); border-radius:8px">
                    <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.5"><span class="material-symbols-outlined" style="font-size:1rem; vertical-align:middle">info</span> <strong>Model Logic:</strong> Simulated 60D forward-projection optimized for Sortino/Sharpe ratios. Single asset allocations are strictly capped at 50% for risk aversion.</p>
                </div>
            </div>
            
            <div class="card" style="padding:2rem; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:400px">
                <div style="position:relative; width:100%; max-width:300px; height:300px">
                    <canvas id="optimizer-chart"></canvas>
                </div>
            </div>
        </div>
    `;

    const ctx = document.getElementById('optimizer-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.allocations.map(a => a.asset),
            datasets: [{
                data: data.allocations.map(a => parseFloat((a.target_weight * 100).toFixed(1))),
                backgroundColor: ['#facc15', '#60a5fa', '#22c55e', '#ef5350', '#8b5cf6'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#d1d5db', font: { family: 'JetBrains Mono' }, padding: 20 } }
            }
        }
    });
}

async function renderPortfolioLab(customBasket = null) {
    appEl.innerHTML = skeleton(1);
    const endpoint = customBasket ? `/portfolio-sim?basket=${customBasket}` : '/portfolio-sim';
    const data = await fetchAPI(endpoint);
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
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">EST_DAIL_VAR</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid var(--risk-low)">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">PORTFOLIO BETA</div>
                <div id="beta-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">VS_BTC_INDEX</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid #f7931a">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">SORTINO RATIO</div>
                <div id="sortino-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">DOWNSIDE_ADJ</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid white">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">ANN. VOLATILITY</div>
                <div id="vol-val" style="font-size:1.8rem; font-weight:900">-</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">REALIZED_30D</div>
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

        <!-- 3. Correlation Engine Section -->
        <div class="card" style="padding:1.2rem; margin-bottom: 2rem">
            <h3 style="margin-bottom:1.2rem; font-size:0.85rem; color:var(--accent); letter-spacing:1px">CROSS-ASSET CORRELATION MATRIX (30D)</h3>
            <div id="correlation-heatmap" style="min-height:280px; max-width:600px; display:grid; gap:2px"></div>
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
            type: 'doughnut',
            data: {
                labels: Object.keys(data.allocation),
                datasets: [{
                    data: Object.values(data.allocation),
                    backgroundColor: [
                        '#00f2ff', '#a855f7', '#ff3e3e', '#fffa00', '#00ff88', '#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#6366f1'
                    ],
                    borderWidth: 0,
                    hoverOffset: 20
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
        console.error("Allocation Chart Error:", e);
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
                renderCorrelationHeatmap(corrData);
            }
        } catch (e) {
            console.error("Risk Load Error:", e);
        }
    }, 500);
}

async function renderNarrativeGalaxy(filterChain = 'ALL') {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI(`/narrative-clusters?chain=${filterChain}&v=${Date.now()}`);
    if (!data || !data.clusters) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">hub</span> Narrative Cluster Galaxy V2 <span class="premium-badge">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-mindshare')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                <p>Spatial mapping using real-time news synthesis and sentiment velocity. Anchors represent core institutional narratives.</p>
            </div>
            <div class="view-actions" style="margin-bottom:0">
                <select id="galaxy-chain-filter" class="tf-btn" style="background:var(--bg-card); border:1px solid var(--border); color:white; padding:0 15px; height:36px; cursor:pointer" onchange="renderNarrativeGalaxy(this.value)">
                    <option value="ALL" ${filterChain === 'ALL' ? 'selected' : ''}>ALL NETWORKS</option>
                    <option value="SOL" ${filterChain === 'SOL' ? 'selected' : ''}>SOLANA_ECO</option>
                    <option value="ETH" ${filterChain === 'ETH' ? 'selected' : ''}>ETHEREUM_ECO</option>
                    <option value="ADA" ${filterChain === 'ADA' ? 'selected' : ''}>CARDANO_ECO</option>
                    <option value="AVAX" ${filterChain === 'AVAX' ? 'selected' : ''}>AVALANCHE_ECO</option>
                </select>
            </div>
        </div>
        
        <div class="hot-topics-ticker" style="background:rgba(0, 242, 255, 0.05); border:1px solid var(--accent); padding:10px; border-radius:8px; margin-bottom:1.5rem; display:flex; gap:15px; align-items:center; overflow:hidden">
            <span style="font-size:0.6rem; font-weight:900; color:var(--accent); white-space:nowrap">EMERGING NARRATIVES:</span>
            <div style="flex:1; overflow:hidden; mask-image: linear-gradient(to right, transparent, black 15px); -webkit-mask-image: linear-gradient(to right, transparent, black 15px);">
                <div style="display:flex; gap:20px; animation: scroll-left 80s linear infinite">
                    ${data.hot_topics.map(t => `<span style="font-size:0.75rem; font-weight:800; color:white; white-space:nowrap"># ${t}</span>`).join('')}
