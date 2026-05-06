async function renderMacroSync(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    const tabHTML = tabs ? renderHubTabs('macro', tabs) : '';
    appEl.innerHTML = skeleton(2);
    const [data, sectors] = await Promise.all([fetchAPI('/macro'), fetchAPI('/sectors')]);
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Macro Intelligence Hub</h2>
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">monitoring</span>Macro Compass <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-macro-compass')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
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
                    <canvas id="dominanceChart" role="img" aria-label="BTC market dominance chart"></canvas>
                </div>
            </div>

            <div class="card" style="margin-top:2rem">
                <div class="card-header" style="margin-bottom:15px">
                    <h3>Sector Hierarchy Treemap <span style="font-size:0.8rem; color:var(--text-dim)">(Rotational Dominance Matrix)</span></h3>
                </div>
                <div id="sector-treemap" style="height:220px; width:100%; border-radius:8px; overflow:hidden; position:relative;  border:1px solid ${alphaColor(0.05)};"></div>
                <div style="margin-top:10px; font-size:0.75rem; color:var(--text-dim)">
                    Box size represents aggregate Sector Market Capitalization. Color intensity maps 24H directional momentum.
                </div>
            </div>


            <div class="card" style="margin-top:2rem">
                <div class="card-header">
                    <h3>Leveraged Funding Divergence (Perpetuals)</h3>
                </div>
                <div class="chart-container" style="height:350px;">
                    <canvas id="fundingOscillatorChart" role="img" aria-label="Funding rate oscillator chart"></canvas>
                </div>
            </div>
            <div class="card" style="margin-top:2rem">
                <div class="card-header">
                    <h3>Stablecoin Supply Ratio (SSR) <span style="font-size:0.8rem; color:var(--text-dim)">(Fiat Purchasing Power proxy)</span></h3>
                </div>
                <div class="chart-container" style="height:350px;">
                    <canvas id="ssrChart" role="img" aria-label="Stablecoin supply ratio chart"></canvas>
                </div>
            </div>
            <div class="macro-education" style="margin-top:2rem; padding:1.5rem; background:${alphaColor(0.02)}; border-radius:12px; border:1px solid var(--border)">
                <h4 style="color:var(--accent); margin-bottom:0.5rem">Institutional Macro Correlation Guide</h4>
                <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.6">
                    Professional traders monitor these correlations to identify "Narrative Shifts." 
                    A high correlation with <b>GOLD</b> confirms the "Safe Haven" thesis, while high correlation with the <b>SPX</b> classifies BTC as a "High-Beta Tech" asset. 
                    The <b>DXY</b> correlation is the most critical: a strong negative value suggests Bitcoin is absorbing liquidity from fiat debasement.
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
                            { label: 'ALT Dominance', data: domData.alts, borderColor: '#7dd3fc', backgroundColor: 'rgba(0, 242, 255, 0.5)', fill: '-1' }
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
                            y: { stacked: true, min: 0, max: 100, ticks: { callback: function(value) { return value + '%'; } }, grid: { color: alphaColor(0.05) } },
                            x: { grid: { display: false } }
                        },
                        elements: { point: { radius: 0 } }
                    }
                });
                }
            }
            
            const fundingData = await fetchAPI('/funding-rates');
            if (fundingData && fundingData.rows) {
                const fundEl = document.getElementById('fundingOscillatorChart');
                if (fundEl) {
                    const ctx2 = fundEl.getContext('2d');
                
                const labels = fundingData.rows.map(r => r.asset);
                const rates = fundingData.rows.map(r => r.current);
                const colors = rates.map(r => r > 0.015 ? 'rgba(34, 197, 94, 0.7)' : (r < 0 ? 'rgba(239, 68, 68, 0.7)' : alphaColor(0.2)));
                
                new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Est. 8H Funding Bracket (%)',
                                data: rates,
                                backgroundColor: colors,
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                            y: { grid: { color: alphaColor(0.05) }, title: { display:true, text: 'Funding Premium (%)' } },
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
                                label: 'SSR (BTC Market Cap - Stablecoin Supply)',
                                data: ssrData.ssr,
                                borderColor: '#7dd3fc',
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
                            y: { grid: { color: alphaColor(0.05) }, title: { display:true, text: 'SSR Multiplier' } },
                            x: { grid: { display:false }, ticks: { maxTicksLimit: 12 } }
                        }
                    }
                });
                }
            }

            if (sectors) renderSectorTreemap(sectors);

        } catch (e) {
            console.error("Macro sync charts failed:", e);
        }
    }, 50);
}

function renderCorrelationTable(data) {
    const container = document.getElementById('corr-matrix-container');
    if (!container) return;
    
    let html = `<table class="corr-table" style="margin:0 auto; width:max-content; border-collapse:collapse; text-align:center; font-family:'JetBrains Mono'">`;
    
    html += `<tr><th style="padding:8px; border-bottom:1px solid ${alphaColor(0.1)}"></th>`;
    data.assets.forEach(a => {
        html += `<th style="width:45px; height:45px; padding:0; font-size:0.65rem; color:var(--text-dim); border-bottom:1px solid ${alphaColor(0.1)}">${a}</th>`;
    });
    html += '</tr>';

    data.assets.forEach(rowAsset => {
        html += `<tr><td style="padding:0 12px; height:45px; font-size:0.65rem; color:var(--text-dim); font-weight:700; text-align:right; border-right:1px solid ${alphaColor(0.1)}">${rowAsset}</td>`;
        data.assets.forEach(colAsset => {
            const pair = data.matrix.find(m => m.assetA === rowAsset && m.assetB === colAsset);
            if (!pair) {
                html += `<td style="width:45px; height:45px; padding:0; border:1px solid rgba(0,0,0,0.5)"></td>`;
                return;
            }
            const val = pair.correlation;
            let bg;
            if (val === 1) bg = alphaColor(0.05);
            else if (val > 0) bg = `rgba(0, 242, 255, ${Math.min(val, 0.9)})`;
            else bg = `rgba(239, 68, 68, ${Math.min(Math.abs(val), 0.9)})`;
            
            const color = val === 1 ? alphaColor(0.2) : (Math.abs(val) > 0.5 ? 'white' : 'var(--text-dim)');
            html += `<td style="width:45px; height:45px; padding:0; font-size:0.65rem; background:${bg}; color:${color}; border:1px solid rgba(0,0,0,0.5)">${val.toFixed(2)}</td>`;
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
        .attr("fill", alphaColor(0.9))
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
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Macro Intelligence Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">swap_horiz</span>Sector Rotation <span class="premium-badge">LIVE</span></h1>
                <p style="margin-top:4px;color:var(--text-dim);font-size:0.8rem">Institutional synchronization levels across core market indices using a 30-day Pearson rolling window.</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0" onclick="switchView('docs-rotation')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
        </div>
        ${renderHubTabs('rotation', tabs)}
        
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
                <div class="guide-icon"><span class="material-symbols-outlined" style="font-size:1.4rem;color:var(--accent)">info</span></div>
                <div class="guide-text">
                    <h4 style="color:var(--accent); margin-bottom:0.5rem">How to Read Correlation Dynamics</h4>
                    <p style="font-size:0.85rem; line-height:1.6; color:var(--text-dim)">
                        This matrix tracks 30-day <b>Pearson Correlation</b> between synthetic sector indices. 
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
                        const border = intensity > 0.8 ? '1px solid ${alphaColor(0.2)}' : 'none';
                        return `<div class="matrix-cell" style="background:${color}; color:${textColor}; border:${border}" title="${data.sectors[i]} vs ${data.sectors[row.indexOf(val)]}: ${val}">${val.toFixed(2)}</div>`;
                    }).join('')}
                `).join('')}
            </div>
        </div>`;
    
    // Capital Rotation Sunburst moved to its own view - see renderCapitalRotation()
}

// ============================================================
// Capital Rotation Sunburst - standalone Macro Intel tab
// ============================================================
async function renderCapitalRotation(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Macro Intelligence Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">donut_large</span>Capital Rotation <span class="premium-badge">LIVE</span></h1>
                <p style="color:var(--text-dim);font-size:0.8rem;margin-top:6px">
                    30-day momentum-weighted allocation map across Crypto, Equities, Bonds &amp; Commodities.
                    Click any segment to drill into its sub-allocation - click the centre label to reset.
                </p>
            </div>
        </div>
        ${renderHubTabs('capital-rotation', tabs)}

        <div class="card" style="padding:1.5rem;border:1px solid rgba(0,242,255,0.12);">
            <div id="cr-summary-bar" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap;gap:12px">
                <div style="display:flex;gap:6px;align-items:center">
                    <div class="loader" style="width:14px;height:14px;border-width:2px"></div>
                    <span style="font-size:0.65rem;color:var(--text-dim)">Loading live market data-</span>
                </div>
            </div>
            <div id="sunburst-container" style="width:100%;display:flex;justify-content:center;padding-bottom:1.5rem;"></div>
        </div>
        
        <div class="card" style="margin-top:2rem;padding:1.5rem;border:1px solid rgba(0,242,255,0.12);">
            <div class="card-header" style="margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;">
                <h3>Capital Flow Dynamics <span style="font-size:0.8rem; color:var(--text-dim)">(30D Velocity)</span></h3>
                <button onclick="document.getElementById('sankey-video-modal').style.display='flex'" style="background:rgba(0, 242, 255, 0.1);border:1px solid var(--accent);color:var(--accent);padding:6px 12px;border-radius:4px;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s">
                    <span class="material-symbols-outlined" style="font-size:16px">smart_display</span> How to Read
                </button>
            </div>
            <div id="sankey-container" style="width:100%;height:400px;position:relative;"></div>
        </div>

        <!-- Video Modal -->
        <div id="sankey-video-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;justify-content:center;align-items:center;backdrop-filter:blur(5px);">
            <div style="background:var(--bg-dark);border:1px solid var(--accent);border-radius:8px;width:90%;max-width:800px;overflow:hidden;box-shadow:0 0 30px rgba(0,242,255,0.2);">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid rgba(0,242,255,0.1);">
                    <h3 style="margin:0;font-size:1rem;display:flex;align-items:center;gap:8px">
                        <span class="material-symbols-outlined" style="color:var(--accent)">school</span> Educational Guide
                    </h3>
                    <button onclick="document.getElementById('sankey-video-modal').style.display='none'; document.getElementById('sankey-iframe').src = document.getElementById('sankey-iframe').src;" style="background:none;border:none;color:var(--text-dim);cursor:pointer;padding:4px">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
                    <!-- Valid YouTube Embed for Sankey Diagram Tutorial -->
                    <iframe id="sankey-iframe" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" 
                        src="https://www.youtube-nocookie.com/embed/dAOzDsluIX0?rel=0" 
                        title="YouTube video player" frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div style="padding:15px 20px;font-size:0.8rem;color:var(--text-dim);">
                    Sankey charts visualize the flow of capital from left (source) to right (destination). The width of the bands represents the volume of capital moving between sectors.
                </div>
            </div>
        </div>
    `;

    // - Fetch live data -
    let root_data;
    let flows_data;
    try {
        const data = await fetchAPI('/capital-rotation');
        if (data && data.children) {
            root_data = data;
            flows_data = data.flows;
            // Populate summary bar from API
            document.getElementById('cr-summary-bar').innerHTML = `
                <div>
                    <div style="font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);font-weight:700;margin-bottom:6px">ALLOCATION INTELLIGENCE - LIVE 30D</div>
                    <div style="display:flex;gap:20px;flex-wrap:wrap">
                        ${(data.summary || []).map(s => `
                            <div style="text-align:center">
                                <div style="width:10px;height:10px;border-radius:50%;background:${s.col};margin:0 auto 4px"></div>
                                <div style="font-size:0.65rem;color:${s.col};font-weight:900">${s.label}</div>
                                <div style="font-size:0.6rem;color:var(--text-dim)">${s.pct}</div>
                                <div style="font-size:0.6rem;font-weight:700;color:${s.perf.startsWith('+') ? '#22c55e' : '#ef4444'}">${s.perf} 30D</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="font-size:0.55rem;color:var(--text-dim);text-align:right;line-height:1.8">
                    Model: 30D Momentum-Weighted<br>
                    Source: ${data.source || 'yfinance - Live'}<br>
                    Updated: ${data.updated || '-'}
                </div>
            `;
        } else {
            throw new Error(data?.error || 'No data');
        }
    } catch(e) {
        document.getElementById('cr-summary-bar').innerHTML =
            `<div style="color:#ef4444;font-size:0.75rem">- Live data unavailable: ${e.message}. Using last-known allocation model.</div>`;
        // Fallback to static model
        root_data = {
            name: 'Total Capital', value: 0, children: [
                { name: 'Crypto',      value: 40, perf: 0, children: [
                    { name: 'BTC', value: 22, perf: 0 }, { name: 'ETH', value: 12, perf: 0 }, { name: 'Alts', value: 6, perf: 0 }
                ]},
                { name: 'Equities',    value: 35, perf: 0, children: [
                    { name: 'Tech', value: 14, perf: 0 }, { name: 'Energy', value: 11, perf: 0 }, { name: 'Finance', value: 10, perf: 0 }
                ]},
                { name: 'Bonds',       value: 15, perf: 0, children: [
                    { name: '2Y UST', value: 8, perf: 0 }, { name: '10Y UST', value: 7, perf: 0 }
                ]},
                { name: 'Commodities', value: 10, perf: 0, children: [
                    { name: 'Gold', value: 6, perf: 0 }, { name: 'Oil', value: 4, perf: 0 }
                ]}
            ]
        };
    }

    setTimeout(() => {
        if (typeof d3 === 'undefined') return;

        const W = Math.min(520, window.innerWidth - 80), R = W / 2;
        const palettes = { 'Crypto': '#7dd3fc', 'Equities': '#f59e0b', 'Bonds': '#a78bfa', 'Commodities': '#10b981' };
        const childRanges = { 'Crypto': ['#1e6fa8','#b8eaff'], 'Equities': ['#92510a','#fcd786'], 'Bonds': ['#5630b5','#d9c8ff'], 'Commodities': ['#065c3c','#6dffc4'] };
        const childColorMap = new Map();
        const getColor = d => {
            if (childColorMap.has(d)) return childColorMap.get(d);
            const sect = d.ancestors().find(a => palettes[a.data.name]);
            if (!sect) return '#555';
            if (d === sect) return palettes[sect.data.name];
            const siblings = sect.children || [];
            const idx = siblings.findIndex(s => s === d);
            const range = childRanges[sect.data.name] || ['#333','#eee'];
            const t = siblings.length > 1 ? idx / (siblings.length - 1) : 0.5;
            const col = d3.interpolateRgb(range[0], range[1])(t);
            childColorMap.set(d, col);
            return col;
        };

        const hierarchy = d3.hierarchy(root_data).sum(d => d.value).sort((a, b) => b.value - a.value);
        const partition  = d3.partition().size([2 * Math.PI, R]);
        partition(hierarchy);
        hierarchy.each(d => d.current = { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 });

        const arc = d3.arc()
            .startAngle(d => d.x0).endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .innerRadius(d => d.y0 + 8).outerRadius(d => Math.max(d.y0 + 8, d.y1 - 3));

        const arcVisible   = d => d.y1 <= R && d.y0 >= 0 && d.x1 > d.x0;
        const labelVisible = d => d.y1 <= R && d.y0 >= 0 && (d.x1 - d.x0) > 0.12;
        const labelTransform = d => {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        };

        const svg = d3.select('#sunburst-container').append('svg')
            .attr('viewBox', `0 0 ${W} ${W}`)
            .attr('width', W).attr('height', W)
            .style('font-family', 'JetBrains Mono, monospace');

        const g = svg.append('g').attr('transform', `translate(${R},${R})`);

        const paths = g.selectAll('path')
            .data(hierarchy.descendants().filter(d => d.depth > 0))
            .enter().append('path')
            .attr('d', d => arc(d.current))
            .attr('fill', d => getColor(d))
            .attr('fill-opacity', d => arcVisible(d.current) ? (1 - d.depth * 0.2) : 0)
            .attr('stroke', '#0a0e1a').attr('stroke-width', 1.5)
            .style('cursor', 'pointer');

        paths.append('title').text(d =>
            `${d.ancestors().map(d => d.data.name).reverse().slice(1).join(' - ')}\n` +
            `${d.value}% allocation\n${(d.data.perf >= 0 ? '+' : '')}${d.data.perf?.toFixed(1) || 0}% 30D`
        );

        const labels = g.selectAll('text.arc-label')
            .data(hierarchy.descendants().filter(d => d.depth > 0))
            .enter().append('text').attr('class', 'arc-label')
            .attr('transform', d => labelTransform(d.current))
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('font-size', d => d.depth === 1 ? 11 : 9.5)
            .attr('font-weight', d => d.depth === 1 ? 900 : 700)
            .attr('fill', 'white')
            .attr('stroke', 'rgba(0,0,0,0.55)').attr('stroke-width', 2.5).attr('paint-order', 'stroke')
            .attr('pointer-events', 'none')
            .style('opacity', d => labelVisible(d.current) ? 1 : 0)
            .text(d => d.data.name);

        const centerGroup = g.append('g').style('cursor', 'pointer').on('click', () => clicked(null, hierarchy));
        const centerName = centerGroup.append('text')
            .attr('text-anchor', 'middle').attr('dy', '-0.5em')
            .attr('font-size', 11).attr('font-weight', 900).attr('fill', '#7dd3fc').text('CAPITAL');
        const centerSub = centerGroup.append('text')
            .attr('text-anchor', 'middle').attr('dy', '1em')
            .attr('font-size', 9).attr('fill', alphaColor(0.45)).text('ROTATION');

        // Detail panel
        const detailEl = document.createElement('div');
        detailEl.style.cssText = 'margin-top:1rem;padding:1rem 1.2rem;background:${alphaColor(0.03)};border:1px solid ${alphaColor(0.07)};border-radius:8px;font-size:0.72rem;display:none;';
        document.getElementById('sunburst-container').parentElement.appendChild(detailEl);

        let focusNode = hierarchy;

        function clicked(event, p) {
            const next = (focusNode === p && p.parent) ? p.parent : p;
            focusNode = next;

            const xScale = d3.scaleLinear().domain([next.x0, next.x1]).range([0, 2 * Math.PI]);
            const yScale = d3.scaleLinear().domain([next.y0, R]).range([0, R]);

            hierarchy.each(d => d.target = {
                x0: xScale(Math.max(next.x0, Math.min(next.x1, d.x0))),
                x1: xScale(Math.max(next.x0, Math.min(next.x1, d.x1))),
                y0: yScale(d.y0),
                y1: yScale(d.y1)
            });

            const t = g.transition().duration(500);

            paths.transition(t)
                .tween('data', d => { const i = d3.interpolate(d.current, d.target); return t => { d.current = i(t); }; })
                .attrTween('d', d => () => arc(d.current))
                .attr('fill-opacity', d => arcVisible(d.target) ? (1 - d.depth * 0.2) : 0)
                .attr('pointer-events', d => arcVisible(d.target) ? 'auto' : 'none');

            labels.transition(t)
                .tween('data', d => { const i = d3.interpolate(d.current, d.target); return t => { d.current = i(t); }; })
                .attrTween('transform', d => () => labelTransform(d.current))
                .style('opacity', d => labelVisible(d.target) ? 1 : 0);

            if (next === hierarchy) {
                centerName.text('CAPITAL').attr('fill', '#7dd3fc');
                centerSub.text('ROTATION').attr('fill', alphaColor(0.45));
                detailEl.style.display = 'none';
            } else {
                const perfStr = (next.data.perf >= 0 ? '+' : '') + (next.data.perf?.toFixed(1) || '0') + '%';
                const col = next.data.perf >= 0 ? '#22c55e' : '#ef4444';
                centerName.text(next.data.name).attr('fill', getColor(next));
                centerSub.text(`${next.value}% - ${perfStr}`).attr('fill', col);
                const rows = (next.children || []).map(c => {
                    const cp = (c.data.perf >= 0 ? '+' : '') + (c.data.perf?.toFixed(1) || '0') + '%';
                    const cc = c.data.perf >= 0 ? '#22c55e' : '#ef4444';
                    return `<tr>
                        <td style="padding:5px 10px 5px 0;font-weight:700;color:var(--text)">${c.data.name}</td>
                        <td style="padding:5px 10px;color:var(--text-dim)">${c.value}% alloc</td>
                        <td style="padding:5px 0;font-weight:700;color:${cc};font-family:monospace">${cp} 30D</td>
                    </tr>`;
                }).join('');
                detailEl.style.display = 'block';
                detailEl.innerHTML = `
                    <div style="font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);margin-bottom:8px;font-weight:700">
                        ${next.data.name.toUpperCase()} BREAKDOWN - CLICK CENTRE TO RESET
                    </div>
                    <table style="width:100%;border-collapse:collapse">${rows}</table>`;
            }
        }

        paths.on('click', clicked)
             .on('mouseover', function(e, d) { d3.select(this).attr('fill-opacity', 0.95); })
             .on('mouseout', function(e, d) { d3.select(this).attr('fill-opacity', arcVisible(d.current) ? (1 - d.depth * 0.2) : 0); });

        // --- Render Sankey Diagram ---
        if (typeof d3.sankey === 'function' && flows_data && flows_data.nodes && flows_data.links && flows_data.nodes.length > 0) {
            const sankeyContainer = document.getElementById('sankey-container');
            sankeyContainer.innerHTML = '';
            
            const sW = sankeyContainer.clientWidth || 800;
            const sH = sankeyContainer.clientHeight || 400;
            
            const sankeySvg = d3.select('#sankey-container').append('svg')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('viewBox', `0 0 ${sW} ${sH}`)
                .style('font-family', 'JetBrains Mono, monospace');
                
            const sankey = d3.sankey()
                .nodeId(d => d.name)
                .nodeWidth(15)
                .nodePadding(10)
                .extent([[10, 10], [sW - 10, sH - 10]]);
                
            const {nodes: sNodes, links: sLinks} = sankey({
                nodes: flows_data.nodes.map(d => Object.assign({}, d)),
                links: flows_data.links.map(d => Object.assign({}, d))
            });
            
            // Define gradients for links
            const defs = sankeySvg.append("defs");
            sLinks.forEach((link, i) => {
                const gradient = defs.append("linearGradient")
                    .attr("id", `gradient-${i}`)
                    .attr("gradientUnits", "userSpaceOnUse")
                    .attr("x1", link.source.x1)
                    .attr("x2", link.target.x0);
                    
                const srcColor = palettes[link.source.name] || '#7dd3fc';
                const tgtColor = palettes[link.target.name] || '#f59e0b';
                
                gradient.append("stop").attr("offset", "0%").attr("stop-color", srcColor);
                gradient.append("stop").attr("offset", "100%").attr("stop-color", tgtColor);
            });
            
            // Draw links
            const link = sankeySvg.append("g")
                .attr("fill", "none")
                .attr("stroke-opacity", 0.4)
              .selectAll("g")
              .data(sLinks)
              .join("g")
                .style("mix-blend-mode", "screen");
                
            link.append("path")
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke", (d, i) => `url(#gradient-${i})`)
                .attr("stroke-width", d => Math.max(1, d.width));
                
            link.append("title")
                .text(d => `${d.source.name} → ${d.target.name}\nVolume: ${d.value}`);
                
            // Draw nodes
            const node = sankeySvg.append("g")
              .selectAll("rect")
              .data(sNodes)
              .join("rect")
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("height", d => Math.max(2, d.y1 - d.y0))
                .attr("width", d => d.x1 - d.x0)
                .attr("fill", d => palettes[d.name] || '#555')
                .attr("rx", 2);
                
            node.append("title")
                .text(d => `${d.name}\nTotal: ${d.value}`);
                
            // Draw labels
            sankeySvg.append("g")
                .style("font-size", "10px")
                .style("fill", "#fff")
              .selectAll("text")
              .data(sNodes)
              .join("text")
                .attr("x", d => d.x0 < sW / 2 ? d.x1 + 6 : d.x0 - 6)
                .attr("y", d => (d.y1 + d.y0) / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", d => d.x0 < sW / 2 ? "start" : "end")
                .text(d => d.name);
        } else if (!d3.sankey) {
            document.getElementById('sankey-container').innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:2rem;">Sankey library not loaded.</div>';
        }

    }, 200);
}
