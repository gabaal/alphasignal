async function renderStrategyLab(tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    // Restore last-used ticker & strategy from localStorage
    const savedTicker   = localStorage.getItem('sl_ticker')   || 'BTC-USD';
    const savedStrategy = localStorage.getItem('sl_strategy') || 'trend_regime';
    runStrategyBacktest(savedTicker, savedStrategy, 20, 50, tabs);
}

// Persist ticker/strategy choice so tab-switching doesn't reset
window._slPersist = function(ticker, strategy) {
    if (ticker)   localStorage.setItem('sl_ticker',   ticker);
    if (strategy) localStorage.setItem('sl_strategy', strategy);
};


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
                y: {
                    position: 'right',
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#888', font: { family: 'JetBrains Mono' }, callback: function(val) { return '$' + val.toLocaleString(); } },
                    title: { display: true, text: 'Price (USD)', color: 'rgba(255,255,255,0.2)', font: { size: 9 } }
                }
            }
        }
    });
}

window.downloadBacktestCSV = function(ticker, strategy) {
    if (!window.isPremiumUser) { showPaywall(true); return; }
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
    if (!tabs) tabs = analyticsHubTabs;
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
                        <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">analytics</span>Analytics Hub <span class="premium-badge">AI</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-strategy-lab')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
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
            ${tabs ? renderHubTabs('newsroom', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Live Intelligence Newsroom</h2>
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
    if (!tabs) tabs = riskHubTabs;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('risk', tabs)}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Risk & Correlation Matrix</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">shield_with_heart</span>Risk & Stress <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-risk-matrix')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
           
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
    if (!tabs) tabs = riskHubTabs;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('stress', tabs)}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Macro Stress Lab</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">shield_with_heart</span>Risk & Stress <span class="premium-badge">RISK</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-stress-lab')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
           
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
    if (!tabs) tabs = analyticsHubTabs;
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/chain-velocity');
    if (!data || !data.velocity_data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">analytics</span>Analytics Hub <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-whale-pulse')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p>Institutional capital rotation tracking across major L1 networks using volume acceleration and social heat.</p>
        </div>
        ${tabs ? renderHubTabs('velocity', tabs) : ''}

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
    if (!tabs) tabs = institutionalHubTabs;
    renderPortfolioLab(null, tabs);
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

