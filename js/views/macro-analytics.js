async function renderMacroSync(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('pulse', tabs) : '';
    appEl.innerHTML = skeleton(2);
    const [data, sectors, corrData] = await Promise.all([fetchAPI('/macro'), fetchAPI('/sectors'), fetchAPI('/correlation-matrix')]);
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">monitoring</span> Macro Intel</h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-macro-compass')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
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
    if (!tabs) tabs = macroHubTabs;
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/rotation');
    if (!data || !data.matrix) return;
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('rotation', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-rotation')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
           
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
    // Capital Rotation Sunburst — D3 hierarchical radial chart
    setTimeout(() => {
        const efSection = document.createElement('div');
        efSection.innerHTML = `
            <div class="card" style="padding:1.5rem;margin-top:2rem;background:rgba(5,5,30,0.7);border:1px solid rgba(0,242,255,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                    <h3 style="margin:0;font-size:0.85rem;color:var(--accent);letter-spacing:1px;"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:6px;">donut_large</span>CAPITAL ROTATION SUNBURST</h3>
                    <span style="font-size:0.55rem;color:var(--text-dim);">CLICK SEGMENT TO DRILL DOWN · 30D MOMENTUM WEIGHTED</span>
                </div>
                <div id="sunburst-container" style="width:100%;display:flex;justify-content:center;padding-bottom:1.5rem;"></div>
            </div>`;
        appEl.appendChild(efSection);
        if (typeof d3 === 'undefined') return;
        const W = Math.min(540, window.innerWidth - 60), R = W / 2;
        const root_data = {
            name: 'Total Capital', value: 0, children: [
                { name: 'Crypto', value: 40, perf: 12.4, children: [
                    { name: 'BTC', value: 22, perf: 15.2 }, { name: 'ETH', value: 12, perf: 8.7 }, { name: 'Alts', value: 6, perf: 18.1 }
                ]},
                { name: 'Equities', value: 35, perf: -2.1, children: [
                    { name: 'Tech', value: 14, perf: 3.2 }, { name: 'Energy', value: 11, perf: -8.4 }, { name: 'Finance', value: 10, perf: 1.1 }
                ]},
                { name: 'Bonds', value: 15, perf: -0.8, children: [
                    { name: '2Y UST', value: 8, perf: -0.4 }, { name: '10Y UST', value: 7, perf: -1.2 }
                ]},
                { name: 'Commodities', value: 10, perf: 4.5, children: [
                    { name: 'Gold', value: 6, perf: 6.1 }, { name: 'Oil', value: 4, perf: 1.8 }
                ]}
            ]
        };
        const palettes = { 'Crypto': '#00f2ff', 'Equities': '#f59e0b', 'Bonds': '#a78bfa', 'Commodities': '#10b981' };
        const hierarchy = d3.hierarchy(root_data).sum(d => d.value).sort((a,b) => b.value - a.value);
        const partition = d3.partition().size([2*Math.PI, R]);
        partition(hierarchy);
        const arc = d3.arc().startAngle(d => d.x0).endAngle(d => d.x1).innerRadius(d => d.y0 + 10).outerRadius(d => d.y1 - 2);
        const svg = d3.select('#sunburst-container').append('svg')
            .attr('width', W).attr('height', W)
            .style('font-family', 'JetBrains Mono');
        const g = svg.append('g').attr('transform', `translate(${R},${R})`);
        const getColor = d => { const anc = d.ancestors().find(a => palettes[a.data.name]); return anc ? palettes[anc.data.name] : '#666'; };
        const paths = g.selectAll('path').data(hierarchy.descendants().filter(d => d.depth > 0))
            .enter().append('path')
            .attr('d', arc)
            .attr('fill', d => getColor(d))
            .attr('fill-opacity', d => 1 - d.depth * 0.25)
            .attr('stroke', '#0a0a1a').attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', function(e,d) { d3.select(this).attr('fill-opacity', 0.9); })
            .on('mouseout', function(e,d) { d3.select(this).attr('fill-opacity', 1 - d.depth * 0.25); })
            .append('title').text(d => `${d.data.name}\n${d.value}% allocation\n${d.data.perf >= 0 ? '+' : ''}${d.data.perf?.toFixed(1) || 0}% 30d`);
        g.selectAll('text').data(hierarchy.descendants().filter(d => d.depth > 0 && (d.x1-d.x0) > 0.2))
            .enter().append('text')
            .attr('transform', d => { const [x,y] = arc.centroid(d); return `translate(${x},${y})`; })
            .attr('text-anchor', 'middle').attr('font-size', d => d.depth === 1 ? 10 : 8)
            .attr('fill', 'white').attr('pointer-events', 'none')
            .text(d => d.data.name);
        g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.3em')
            .attr('font-size', 11).attr('fill', '#00f2ff').attr('font-weight', 900).text('CAPITAL');
        g.append('text').attr('text-anchor', 'middle').attr('dy', '1em')
            .attr('font-size', 10).attr('fill', 'rgba(255,255,255,0.5)').text('ROTATION');
    }, 400);
}

