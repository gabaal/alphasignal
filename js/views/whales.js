async function renderWhales(tabs = null) {
    if (!tabs) tabs = analyticsHubTabs;
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
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Analytics Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">waves</span>Whale Pulse <span class="premium-badge">LIVE</span></h1>
                <p>Real-time monitor of high-conviction transfers across BTC, ETH, and SOL networks.</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="intel-action-btn mini" onclick="showSignalDetail(null,'BTC-USD')" style="width:auto;padding:4px 12px;font-size:0.6rem;display:flex;align-items:center;gap:4px;background:linear-gradient(135deg,rgba(0,242,255,0.15),rgba(139,92,246,0.1));border-color:rgba(0,242,255,0.3)">
                    <span class="material-symbols-outlined" style="font-size:13px">psychology</span> AI DEEP-DIVE
                </button>
                <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="switchView('docs-whale-pulse')">
                    <span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS
                </button>
            </div>
        </div>
        ${tabs ? renderHubTabs('whales', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Whale Pulse Monitor</h2>

        <div class="whale-pulse-header" style="display:grid; grid-template-columns: 1fr 1fr 300px; gap:2rem; margin-bottom:2rem">
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h3>24H Net Flow History (BTC)</h3>
                    <span class="label-tag">AGGREGATED FLOW</span>
                </div>
                <div style="height: 200px; position: relative;">
                    <canvas id="whale-flow-chart" role="img" aria-label="Whale transaction flow chart"></canvas>
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <div class="card-header">
                    <h3>Whale Conviction Scatter (Size vs Time)</h3>
                    <span class="label-tag">BUBBLE MATRIX</span>
                </div>
                <div style="height: 200px; position: relative;">
                    <canvas id="whale-tier-chart" role="img" aria-label="Whale tier distribution chart"></canvas>
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
                        <canvas id="whale-polar-chart" role="img" aria-label="Whale activity polar chart"></canvas>
                    </div>
                </div>
            </div>
        </div>`; // ← end of main innerHTML (after polar chart section)

    if (entityData && entityData.flow_history) {
        renderWhaleFlowChart(entityData.flow_history);
    }

    // ── 1. Whale Wallet Flow Network chart (appears first) ──────────────
    const sankeyEl = document.createElement('div');
    sankeyEl.className = 'card';
    sankeyEl.style.cssText = 'padding:1.5rem;margin-top:2rem;background:rgba(5,5,30,0.7);border:1px solid rgba(0,242,255,0.12);';
    sankeyEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;">
            <h3 style="margin:0;font-size:0.85rem;color:var(--accent);letter-spacing:1px;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">account_balance_wallet</span>WHALE WALLET FLOW NETWORK</h3>
            <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:0.55rem;color:var(--text-dim);">BTC/ETH 24H NET FLOWS BETWEEN ENTITY TYPES</span>
                <span style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;padding:2px 8px;border-radius:100px;background:rgba(34,197,94,0.12);color:#22c55e">● LIVE · whale-sankey</span>
            </div>
        </div>
        <div style="height:260px;position:relative;"><canvas id="whaleSankeyCanvas" role="img" aria-label="Whale capital flow sankey diagram"></canvas></div>
        <div style="display:flex;gap:2rem;margin-top:10px;font-size:0.6rem;color:var(--text-dim);">
            <span><span style="color:#22c55e">&#9632;</span> Inflow ($M)</span>
            <span><span style="color:#ef4444">&#9632;</span> Outflow ($M)</span>
            <span>Bar length = 24H USD volume. Exchange = Binance/Coinbase/OKX aggregate.</span>
        </div>`;
    appEl.appendChild(sankeyEl);

    setTimeout(async () => {
        const fCtx = document.getElementById('whaleSankeyCanvas');
        if (!fCtx) return;

        // Try live /api/whale-sankey data
        let entities = ['Exchange Hot Wallets', 'OTC Desks', 'Cold Storage', 'Miner Wallets', 'DeFi Protocols', 'Retail Exchanges', 'Inst. Custody'];
        let inflows  = [1840, 620, 380, 320, 540, 210, 490];
        let outflows = [-1280, -290, -180, -510, -190, -140, -620];
        try {
            const sk = await fetch('/api/whale-sankey');
            if (sk.ok) {
                const sd = await sk.json();
                if (sd && sd.nodes && sd.links && sd.nodes.length > 0) {
                    entities = sd.nodes.map(n => n.name);
                    const nLen = entities.length;
                    inflows  = new Array(nLen).fill(0);
                    outflows = new Array(nLen).fill(0);
                    sd.links.forEach(l => {
                        inflows[l.target]  += l.value;
                        outflows[l.source] -= l.value;
                    });
                    // Scale from BTC to approximate $M (using meta.btc_price if available)
                    const btcPrice = sd.meta?.btc_price || 90000;
                    const scale = btcPrice / 1e6;
                    inflows  = inflows.map(v => Math.round(v * scale * 10) / 10);
                    outflows = outflows.map(v => Math.round(v * scale * 10) / 10);
                }
            }
        } catch(e) { /* silent fallback */ }
        new Chart(fCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: entities,
                datasets: [
                    { label: 'Inflow ($M)',  data: inflows,  backgroundColor: 'rgba(34,197,94,0.65)',  borderRadius: 4 },
                    { label: 'Outflow ($M)', data: outflows, backgroundColor: 'rgba(239,68,68,0.65)',  borderRadius: 4 }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { color:'#8b949e', font:{ family:'Outfit', size:11 } } },
                    tooltip: { backgroundColor:'rgba(13,17,23,0.95)',
                        callbacks: { label: c => `${c.dataset.label}: $${Math.abs(c.raw).toLocaleString()}M` }
                    }
                },
                scales: {
                    x: {
                        grid:{ color:'rgba(255,255,255,0.05)' },
                        ticks:{ color:'#8b949e', callback: v => '$' + Math.abs(v) + 'M' },
                        title: { display: true, text: '24H Flow ($M)', color: 'rgba(255,255,255,0.25)', font: { size: 9 } }
                    },
                    y: { grid:{ display:false }, ticks:{ color:'#e6edf3', font:{ family:'JetBrains Mono', size:11 } } }
                }
            }
        });
    }, 200);

    // ── 2. Whale Transaction List (at the bottom) ───────────────────────
    const txListEl = document.createElement('div');
    txListEl.style.marginTop = '2rem';
    const whaleRows = data.results || data || [];
    const first10 = whaleRows.slice(0, 10);
    const rest = whaleRows.slice(10);
    const renderRow = w => `
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
                <button class="timeframe-btn" onclick="openDetail('${w.asset}', 'WHALE TXN')">VIEW CHART</button>
            </div>
        </div>`;
    txListEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h3 style="margin:0;font-size:0.85rem;color:var(--accent);letter-spacing:1px;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">swap_vert</span>LIVE TRANSACTION FEED</h3>
            <span class="label-tag">LAST ${whaleRows.length} TXS</span>
        </div>
        <div class="whale-list">${first10.map(renderRow).join('')}</div>
        ${rest.length > 0 ? `
            <div id="whale-extra-rows" style="display:none"><div class="whale-list">${rest.map(renderRow).join('')}</div></div>
            <div style="text-align:center;margin:1rem 0 0.5rem">
                <button id="whale-toggle-btn" class="timeframe-btn" style="font-size:0.65rem;padding:6px 20px"
                    onclick="const x=document.getElementById('whale-extra-rows');const b=document.getElementById('whale-toggle-btn');if(x.style.display==='none'){x.style.display='block';b.textContent='SHOW LESS';}else{x.style.display='none';b.textContent='SHOW ALL (${rest.length} MORE)';}">
                    SHOW ALL (${rest.length} MORE)
                </button>
            </div>` : ''}`;
    appEl.appendChild(txListEl);

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
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#8b949e', font: { family: 'Outfit', size: 10 }, boxWidth: 10, padding: 10 }
                    },
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
                        title: { display: true, text: 'Transaction Size (BTC, log)', color: 'rgba(255,255,255,0.2)', font: { size: 9 } },
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

async function renderWhaleSankeyChart() {
    const sankeySection = document.getElementById('whale-sankey-section');
    if (!sankeySection || typeof d3 === 'undefined') return;
    try {
        const sk = await fetchAPI('/whale-sankey');
        if (!sk || !sk.nodes) return;
        sankeySection.querySelector('#sankey-loading').style.display = 'none';
        const W = Math.min(700, window.innerWidth - 60), H = 320;
        const svg = d3.select('#sankey-svg').attr('width', W).attr('height', H);
        // Simple force-free Sankey layout
        const d3sankey = (typeof d3.sankey !== 'undefined') ? d3.sankey : null;
        if (!d3sankey) {
            // Fallback: simple proportional bar diagram if d3-sankey not loaded
            const total = sk.links.reduce((s, l) => s + l.value, 0);
            const g = svg.append('g');
            let yOff = 20;
            sk.nodes.forEach((n, i) => {
                const inflow = sk.links.filter(l => l.target === i).reduce((s,l) => s+l.value, 0);
                const outflow = sk.links.filter(l => l.source === i).reduce((s,l) => s+l.value, 0);
                const barW = Math.max(4, (inflow + outflow) / total * (W - 120));
                g.append('rect').attr('x', 10).attr('y', yOff).attr('width', barW).attr('height', 22)
                    .attr('fill', inflow > outflow ? 'rgba(0,242,255,0.5)' : 'rgba(239,83,80,0.5)').attr('rx', 4);
                g.append('text').attr('x', barW + 16).attr('y', yOff + 15)
                    .attr('fill', 'white').attr('font-size', 10).attr('font-family', 'JetBrains Mono').text(`${n.name}  ${inflow > 0 ? '+' : ''}${(inflow-outflow).toFixed(0)} BTC`);
                yOff += 32;
            });
            return;
        }
    } catch(e) { console.error('[WhaleSankey]', e); }
}

// ============= Market Pulse =============

// ============= Pack G Rotation & Macro Sync =============
