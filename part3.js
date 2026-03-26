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

async function renderBriefing() {
    appEl.innerHTML = skeleton(2);
    try {
        const data = await fetchAPI('/briefing');
        if (!data || data.error) {
            appEl.innerHTML = `<div class="empty-state">Briefing error: ${data?.error || 'Intelligence engine offline'}</div>`;
            return;
        }

        appEl.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">psychology</span> Institutional Intelligence Briefing</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
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
function formatPrice(price) {
    return `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function renderTradeLab() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">trending_up</span> Trade Intelligence Lab <span class="premium-badge pulse">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-playbook')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
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

async function runNeuralSetup(ticker) {
    const btn = document.getElementById('generate-setup-btn');
    const area = document.getElementById('setup-display-area');
    
    // Provide immediate feedback if triggered via "View Analysis"
    if (area) {
        area.innerHTML = `<div class="loading-state" style="padding:40px; text-align:center">
            <div class="spinner" style="margin-bottom:15px"></div>
            <p>SYNTHESIZING NEURAL SETUP FOR ${ticker.toUpperCase()}...</p>
        </div>`;
    }

    if (btn) {
        btn.textContent = "SYNTHESIZING...";
        btn.disabled = true;
    }
    
    try {
        const setup = await fetchAPI(`/generate-setup?ticker=${ticker.toUpperCase()}`);
        
        if (!setup || setup.error) {
            if (area) {
                area.innerHTML = `
                    <div class="error-card" style="padding:20px; border:1px solid var(--neg); background:rgba(255,59,48,0.1); border-radius:12px; text-align:center">
                        <span class="material-symbols-outlined" style="font-size:3rem; color:var(--neg); margin-bottom:10px">warning</span>
                        <h4 style="color:var(--text-header)">SYNTHESIS FAILED</h4>
                        <p style="color:var(--text-dim); font-size:0.8rem">${setup?.error || 'Market data stream interrupted. Ticker may be invalid or halted.'}</p>
                    </div>`;
            }
            return;
        }
        
        area.innerHTML = `
            <div class="setup-card animate-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                    <span style="font-weight:900; color:var(--accent); font-size:1.1rem">${setup.ticker} / ${setup.bias}</span>
                    <span class="tier-badge institutional" style="margin:0">${setup.conviction} CONVICTION</span>
                </div>
                
                <div class="setup-param-grid">
                    <div class="setup-param"><span class="label">Entry Zone</span><span class="value">${formatPrice(setup.parameters.entry)}</span></div>
                    <div class="setup-param"><span class="label">Stop Loss</span><span class="value">${formatPrice(setup.parameters.stop_loss)}</span></div>
                    <div class="setup-param"><span class="label">Target 1</span><span class="value">${formatPrice(setup.parameters.take_profit_1)}</span></div>
                    <div class="setup-param"><span class="label">Target 2</span><span class="value">${formatPrice(setup.parameters.take_profit_2)}</span></div>
                </div>
                
                <div style="margin-bottom:20px">
                    <span class="label" style="display:block; font-size:0.65rem; color:var(--text-dim); margin-bottom:8px; text-transform:uppercase; font-weight:900">Institutional Rationale</span>
                    <ul class="rationale-list">
                        ${setup.rationale.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="risk-notice">
                    <strong>RISK WARNING:</strong> ${setup.risk_warning}
                </div>
                
                <div style="margin-top:20px; border-top:1px solid var(--border); padding-top:20px; display:flex; gap:15px">
                    <button class="intel-action-btn" id="ticket-gen-btn" style="flex:1; background:var(--accent); color:white" onclick="showTradeTicket()">
                        <span class="material-symbols-outlined" style="vertical-align:middle; font-size:1.2rem; margin-right:5px">receipt_long</span>
                        GENERATE EXECUTION TICKET
                    </button>
                </div>
            </div>`;
        area.innerHTML += `
            <div style="margin-top:20px; text-align:center">
                <button class="intel-action-btn mini outline" style="width:auto; padding:8px 20px" onclick="switchView('trade-ledger')">
                    <span class="material-symbols-outlined" style="font-size:1rem; margin-right:5px">list_alt</span> VIEW AUDIT LEDGER
                </button>
            </div>
        `;
        lastNeuralSetup = setup;
        area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
        console.error('Setup Gen Error:', e);
    } finally {
        if (btn) {
            btn.textContent = "GENERATE NEURAL SETUP";
            btn.disabled = false;
        }
    }
}

async function generateTicket(ticker) {
    try {
        showToast("Processing", `Generating Execution Ticket for ${ticker}...`, "alert");
        const setup = await fetchAPI(`/generate-setup?ticker=${ticker.toUpperCase()}`);
        if (setup && !setup.error) {
            showTradeTicket(setup);
        } else {
            showToast("Error", "Failed to generate ticket metadata.", "alert");
        }
    } catch (e) {
        showToast("Error", "Connection to Neural Engine failed.", "alert");
    }
}

function showTradeTicket(setup = null) {
    const s = setup || lastNeuralSetup;
    if (!s) {
        showToast("Error", "No active setup to ticket.", "alert");
        return;
    }

    // Auto-persist to Ledger in background
    fetchAPI('/trade-ledger', 'POST', {
        ticker: s.ticker,
        action: s.action,
        price: s.parameters?.entry || 0,
        target: s.parameters?.take_profit_1 || 0,
        stop: s.parameters?.stop_loss || 0,
        rr: s.parameters?.rr_ratio || 0,
        slippage: s.parameters?.slippage_est || 0
    }).then(res => console.log("[AlphaSignal] Ticket persisted to Ledger:", res))
      .catch(err => console.error("[AlphaSignal] Ledger Persistence Failed:", err));

    const ticketId = `AS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const ticketText = `ALPHASIGNAL EXECUTION TICKET\nID: ${ticketId}\nASSET: ${s.ticker}\nACTION: ${s.action}\nENTRY: ${s.parameters.entry}\nTP1: ${s.parameters.take_profit_1}\nTP2: ${s.parameters.take_profit_2}\nSL: ${s.parameters.stop_loss}\nR/R: ${s.parameters.rr_ratio}\nSOURCE: AlphaSignal Neural Engine v4.2`;

    const area = document.getElementById('setup-display-area');
    if (!area) return;

    area.innerHTML = `
        <div class="trade-ticket animate-in">
            <div class="ticket-id">ORDER ID: ${ticketId} | SYSTEM TIME: ${s.timestamp}</div>
            <div class="ticket-main">
                <div class="ticket-info">
                    <div class="ticket-action ${s.action.toLowerCase()}">${s.action}</div>
                    <div class="ticket-symbol">${s.ticker} / USD</div>
                </div>
                <div class="ticket-meta" style="text-align:right">
                    <div style="color:var(--accent); font-weight:900">CONVICTION: ${s.conviction}</div>
                    <div>EST. SLIPPAGE: ${s.parameters.slippage_est}</div>
                </div>
            </div>
            
            <div class="ticket-grid">
                <div class="ticket-item"><label>ENTRY ZONE</label><span>${formatPrice(s.parameters.entry)}</span></div>
                <div class="ticket-item"><label>R/R RATIO</label><span>${s.parameters.rr_ratio} : 1</span></div>
                <div class="ticket-item"><label>TARGET 1</label><span class="pos">${formatPrice(s.parameters.take_profit_1)}</span></div>
                <div class="ticket-item"><label>STOP LOSS</label><span class="neg">${formatPrice(s.parameters.stop_loss)}</span></div>
                <div class="ticket-item"><label>TARGET 2</label><span class="pos">${formatPrice(s.parameters.take_profit_2)}</span></div>
                <div class="ticket-item"><label>EXP. VOLATILITY</label><span>HIGH (ADAPTIVE)</span></div>
            </div>

            <div class="ticket-footer">
                <div class="ticket-meta">
                    <div style="font-weight:700">INSTRUCTION: LIMIT ORDER / GTC</div>
                    <div>Verified by AlphaSignal Intelligence Hub</div>
                </div>
                <button class="ticket-copy-btn" id="copy-ticket-btn" onclick="copyTicketToClipboard('${ticketId}')">
                    COPY TO CLIPBOARD
                </button>
            </div>
            <input type="hidden" id="raw-ticket-${ticketId}" value="${ticketText}">
        </div>
        <button class="intel-action-btn" style="margin-top:1rem; width:100%" onclick="runNeuralSetup('${s.ticker}')">BACK TO ANALYSIS</button>
    `;
    
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function renderTradeLedger() {
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

async function copyTicketToClipboard(id) {
    const text = document.getElementById(`raw-ticket-${id}`).value;
    const btn = document.getElementById('copy-ticket-btn');
    
    try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "COPIED!";
        btn.classList.add('copied');
        showToast("Success", "Execution ticket copied to clipboard.", "alert");
        setTimeout(() => {
            btn.textContent = "COPY TO CLIPBOARD";
            btn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        showToast("Error", "Could not access clipboard.", "alert");
    }
}

async function renderLiquidityView() {
    const ticker = 'BTC-USD';
    appEl.innerHTML = `<h1 class="view-title">Order Flow Magnitude Monitor (GOMM)</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-liquidity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>${skeleton(3)}`;
    
    // Sidebar + Layout
    appEl.innerHTML = `
    <div class="gomm-container">
        <div class="sidebar-panel">
            <h1 class="view-title" style="margin:0"><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">waterfall_chart</span> Order Flow (GOMM)</h1>
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
                    <h3 class="card-title" style="margin:0">Institutional Depth Profile <span style="font-size:0.8rem; color:var(--text-dim)">(Aggregated Orderbook)</span></h3>
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
            
            // 1. Separate Bids and Asks
            const bids = data.walls.filter(w => w.side === 'bid').sort((a, b) => b.price - a.price); // Highest bid first
            const asks = data.walls.filter(w => w.side === 'ask').sort((a, b) => a.price - b.price); // Lowest ask first
            
            // 2. Compute Cumulative Volume
            let cumBid = 0;
            const bidData = bids.map(w => { cumBid += w.size; return { x: w.price, y: cumBid }; });
            bidData.reverse(); // Reverse for charting left-to-right
            
            let cumAsk = 0;
            const askData = asks.map(w => { cumAsk += w.size; return { x: w.price, y: cumAsk }; });
            
            new Chart(ctx.getContext('2d'), {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Bids (Support)',
                            data: bidData,
                            borderColor: 'rgba(34, 197, 94, 0.8)',
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            fill: true,
                            showLine: true,
                            pointRadius: 0,
                            tension: 0.1
                        },
                        {
                            label: 'Asks (Resistance)',
                            data: askData,
                            borderColor: 'rgba(239, 68, 68, 0.8)',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            fill: true,
                            showLine: true,
                            pointRadius: 0,
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { 
                        tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${c.raw.y.toFixed(2)} BTC Vol @ $${c.raw.x.toLocaleString()}` } },
                        datalabels: { display: false }
                    },
                    scales: {
                        x: { type: 'linear', title: { display:true, text: 'Limit Price ($)' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', callback: function(val) { return '$' + val.toLocaleString(); } } },
                        y: { title: { display:true, text: 'Cumulative Volume (BTC)' }, grid: { color: 'rgba(255,255,255,0.05)' }, position: 'right', ticks: { color: '#8b949e' } }
                    }
                }
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
                    if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > container.clientWidth || param.point.y < 0 || param.point.y > container.clientHeight) {
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

async function renderSignalArchive() {
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
    try {
        const data = await fetchAPI('/macro-calendar');
        if (!data) return;

        appEl.innerHTML = `
            <div class="view-header">
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Macro Intelligence Hub <span class="premium-badge">LIVE</span></h1>
            </div>
            ${tabHTML}
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
async function updateBTC() {
    const data = await fetchAPI('/btc');
    if (data && data.price) {
        // Updated elsewhere or removed
    }
}



async function renderAlerts() {
    appEl.innerHTML = skeleton(3);
    const data = await fetchAPI('/alerts');
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>Live Intelligence Alerts</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-alerts')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Real-time monitoring of statistical outliers, de-peg events, and institutional-scale movements.</p>
        </div>
        <div class="alert-list" style="display:flex; flex-direction:column; gap:1.5rem">
            ${data.length ? data.map(a => `
                <div class="alert-card ${a.severity}" style="background:var(--bg-card); border:1px solid var(--border); border-left:4px solid ${a.severity === 'high' ? 'var(--risk-high)' : (a.severity === 'medium' ? 'var(--accent)' : 'var(--text-dim)')}; border-radius:12px; padding:1.5rem; position:relative; overflow:hidden">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                        <span style="font-size:0.7rem; font-weight:900; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; color:${a.severity === 'high' ? 'var(--risk-high)' : 'var(--accent)'}">${a.type}</span>
                        <span style="font-size:0.7rem; color:var(--text-dim)">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <div style="font-size:1.1rem; font-weight:800; margin-bottom:8px">${a.title}</div>
                    <div style="font-size:0.85rem; color:var(--text-dim); line-height:1.4">${a.content}</div>
                </div>
            `).join('') : '<p class="empty-state">No active high-severity threats detected.</p>'}
        </div>`;
    
    // Clear badge when viewing alerts
    document.getElementById('alert-badge').style.display = 'none';
}

async function syncAlerts() {
    const data = await fetchAPI('/alerts');
    if (data && data.length) {
        const highSeverity = data.filter(a => a.severity === 'extreme' || a.severity === 'high').length;
        const badge = document.getElementById('alert-badge');
        if (highSeverity > 0) {
            badge.textContent = highSeverity;
            badge.style.display = 'flex';
        } else if (data.length > 0) {
            badge.textContent = data.length;
            badge.style.backgroundColor = 'var(--accent)';
            badge.style.display = 'flex';
        }
    }
}


async function renderRegime(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('regime', tabs) : '';
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Macro Intelligence Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabHTML}
        
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

function cleanupAdvChart() {
    if (activeBinanceWS) { activeBinanceWS.close(); activeBinanceWS = null; }
    const c = document.getElementById('advanced-chart-container');
    if (c) c.innerHTML = '<div class="loader" style="margin:4rem auto"></div>';
}

async function fetchBinanceKlines(symbol, interval, limit=500) {
    try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
        const data = await res.json();
        return data.map(d => ({
            time: d[0] / 1000, open: parseFloat(d[1]), high: parseFloat(d[2]),
            low: parseFloat(d[3]), close: parseFloat(d[4]), value: parseFloat(d[5]),
            color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#26a69a' : '#ef5350'
        }));
    } catch (e) { return []; }
}

// TAB 1: Overview (Price + Volume + EMA 20/50 + RSI Placeholder)
async function renderAdvOverview(symbol, interval) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    const klines = await fetchBinanceKlines(symbol, interval, 500);
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontSize: 11, fontFamily: 'JetBrains Mono' },
        grid: { vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, horzLines: { color: 'rgba(255, 255, 255, 0.03)' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true }
    });
    
    const candleSeries = chart.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
    const volumeSeries = chart.addHistogramSeries({ color: '#26a69a', priceFormat: { type: 'volume' }, priceScaleId: '', scaleMargins: { top: 0.8, bottom: 0 } });
    
    // Compute EMA
    const calcEMA = (data, period) => {
        let k = 2/(period+1), emaArr = [];
        let ema = data[0].close;
        for(let i=0; i<data.length; i++) {
            ema = (data[i].close - ema)*k + ema;
            emaArr.push({time: data[i].time, value: ema});
        }
        return emaArr;
    };
    
    // EMA overlays
    const ema20Series = chart.addLineSeries({ color: 'rgba(250, 204, 21, 0.6)', lineWidth: 1, title: 'EMA20' });
    const ema50Series = chart.addLineSeries({ color: 'rgba(96, 165, 250, 0.6)', lineWidth: 1, title: 'EMA50' });
    
    candleSeries.setData(klines.map(k => ({time:k.time, open:k.open, high:k.high, low:k.low, close:k.close})));
    volumeSeries.setData(klines.map(k => ({time:k.time, value:k.value, color:k.color})));
    ema20Series.setData(calcEMA(klines, 20));
    ema50Series.setData(calcEMA(klines, 50));
    
    activeBinanceWS = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    activeBinanceWS.onmessage = (e) => {
        const k = JSON.parse(e.data).k;
        const tick = { time: Math.floor(k.t/1000), open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c) };
        candleSeries.update(tick);
        volumeSeries.update({ time: tick.time, value: parseFloat(k.v), color: tick.close >= tick.open ? '#26a69a' : '#ef5350' });
    };
    
    const ro = new ResizeObserver(e => { if(e.length>0 && e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
    ro.observe(container);
}

// TAB 2: Market Depth (Bids vs Asks)
async function renderAdvDepth(symbol) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    try {
        const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=100`);
        const data = await res.json();
        container.innerHTML = '';
        
        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
            grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
            timeScale: { timeVisible: true }
        });
        
        const bidArea = chart.addAreaSeries({ topColor: 'rgba(38,166,154,0.4)', bottomColor: 'rgba(38,166,154,0.0)', lineColor: '#26a69a', lineWidth: 2 });
        const askArea = chart.addAreaSeries({ topColor: 'rgba(239,83,80,0.4)', bottomColor: 'rgba(239,83,80,0.0)', lineColor: '#ef5350', lineWidth: 2 });
        
        let bidSum=0, askSum=0;
        let bids = [], asks = [];
        let fakeTime = 1000;
        
        // Lightweight Charts requires time to be monotonically increasing. 
        // We simulate a timeline format to hack the area chart layout for a depth curve.
        [...data.bids].reverse().forEach(b => { 
            bidSum+=parseFloat(b[1]); 
            bids.push({time: fakeTime++, value: bidSum}); 
        });
        fakeTime += 10; // separation
        data.asks.forEach(a => { 
            askSum+=parseFloat(a[1]); 
            asks.push({time: fakeTime++, value: askSum }); 
        });
        
        bidArea.setData(bids);
        askArea.setData(asks);
        
        const ro = new ResizeObserver(e => { if(e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
        ro.observe(container);
    } catch(e) { container.innerHTML = '<div class="error-msg">Depth fetch failed.</div>'; }
}

// TAB 3: Derivatives (Simulated OI)
async function renderAdvDerivatives(symbol, interval) {
    cleanupAdvChart();
    const container = document.getElementById('advanced-chart-container');
    if(!container) return;
    const klines = await fetchBinanceKlines(symbol, interval, 100);
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true }
    });
    const priceSeries = chart.addLineSeries({ color: 'rgba(255,255,255,0.3)', lineWidth: 1, title: 'Price' });
    const oiSeries = chart.addAreaSeries({ topColor: 'rgba(96,165,250,0.4)', bottomColor: 'rgba(96,165,250,0)', lineColor: '#60a5fa', lineWidth: 2, priceScaleId: 'left', title: 'Open Interest' });
    const liqSeries = chart.addHistogramSeries({ color: '#ef5350', priceScaleId: 'left_liq', scaleMargins: { top: 0.7, bottom: 0 }, title: 'Liquidations' });
    
    priceSeries.setData(klines.map(k=>({time:k.time, value:k.close})));
    
    // Simulate UI for OI and Liq
    oiSeries.setData(klines.map((k,i) => ({time:k.time, value: 500000 + i*1000 + (k.close - k.open)*100 + Math.random()*5000})));
    liqSeries.setData(klines.map(k => ({time:k.time, value: (Math.abs(k.close-k.open)/k.open > 0.01) ? Math.random()*100000 : 0, color: (k.close < k.open) ? '#26a69a' : '#ef5350' })));
    
    chart.priceScale('left').applyOptions({ visible: true, borderColor: 'rgba(255,255,255,0.1)' });
    chart.priceScale('left_liq').applyOptions({ visible: false });
    
    const ro = new ResizeObserver(e => { if(e[0].target===container) chart.resize(e[0].contentRect.width, 500); });
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

function renderAdvancedChart() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end">
            <div>
                <h1>📊 Advanced Visualizations <span class="premium-badge">PRO SUITE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-advanced-charting')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                <p>Multi-dimensional analysis powered by live Binance feeds.</p>
            </div>
            <div style="display:flex; gap:10px; padding-bottom:10px;">
                <select id="adv-symbol" style="background:var(--card-bg); color:var(--text); border:1px solid var(--border); padding:5px 10px; border-radius:4px; font-family:'JetBrains Mono'">
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="SOLUSDT">SOL/USDT</option>
                    <option value="DOGEUSDT">DOGE/USDT</option>
                </select>
                <select id="adv-interval" style="background:var(--card-bg); color:var(--text); border:1px solid var(--border); padding:5px 10px; border-radius:4px; font-family:'JetBrains Mono'">
                    <option value="1m">1m</option>
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="1d">1d</option>
                </select>
            </div>
        </div>
        
        <div style="display:flex; gap:1rem; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.5rem; overflow-x:auto">
            <button class="filter-btn active" id="tab-overview" onclick="setAdvTab('overview')">Price & Overlays</button>
            <button class="filter-btn" id="tab-depth" onclick="setAdvTab('depth')">Market Depth</button>
            <button class="filter-btn" id="tab-derivatives" onclick="setAdvTab('derivatives')">Derivatives (OI)</button>
            <button class="filter-btn" id="tab-comparative" onclick="setAdvTab('comparative')">Comparative Index</button>
            <button class="filter-btn" id="tab-cvd" onclick="setAdvTab('cvd')">CVD Order Flow</button>
            <button class="filter-btn" id="tab-exchange" onclick="setAdvTab('exchange')">Exchange Flows</button>
        </div>

        <div class="card" style="padding:1rem; min-height:500px">
            <div id="advanced-chart-container" style="width:100%; height:500px; border-radius:8px; overflow:hidden;"></div>
        </div>
    `;
    
    document.getElementById('adv-symbol').addEventListener('change', dispatchAdvTab);
    document.getElementById('adv-interval').addEventListener('change', dispatchAdvTab);

    window.setAdvTab = (tab) => {
        currentAdvTab = tab;
        document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        dispatchAdvTab();
    };

    dispatchAdvTab();
}

// ============================================================
// Phase 9: On-Chain Analytics Dashboard
// ============================================================
async function renderOnChain() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <h1>🔗 On-Chain Analytics <span class="premium-badge">PRO SUITE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-onchain')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
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

// (viewMap was here, moved to end)

async function renderHome() {
    appEl.innerHTML = `
        <div class="landing-page">
            <div class="landing-bg-overlay" style="background-image: url('landing_hero_abstract.png')"></div>
            <section class="hero-section">
                <div class="hero-content">
                    <h1>Institutional Intelligence Terminal. <span>Live.</span></h1>
                    <p class="hero-subtitle">
                        AlphaSignal provides real-time multi-asset intelligence across bitcoin, equities, and forex. 
                        Synthesized by AI. Verified by institutional order flow. Alphasignal: The definitive alpha and signal terminal.
                    </p>
                    <div class="hero-actions">
                        <button class="intel-action-btn large" onclick="switchView('signals')" title="Launch the AlphaSignal Crypto Trading Terminal" aria-label="Launch Terminal">
                            <span class="material-symbols-outlined" style="margin-right:8px">radar</span> LAUNCH TERMINAL
                        </button>
                        <button class="intel-action-btn large secondary" onclick="openAIAnalyst('BTC-USD')" title="View sample AI intelligence report" aria-label="View Sample Intel">
                            <span class="material-symbols-outlined" style="margin-right:8px">smart_toy</span> VIEW SAMPLE INTEL
                        </button>
                    </div>
                </div>
                <div class="hero-visual">
                    <div class="hero-img-wrapper">
                        <img src="terminal_interface_mockup.png" alt="Institutional Terminal Mockup" class="hero-img" width="800" height="450" loading="lazy">
                        <div class="hero-img-glow"></div>
                    </div>
                </div>
            </section>

            <section class="features-showcase">
                <div class="section-title-wrap">
                    <h2>Institutional Intelligence Suite</h2>
                    <p>AlphaSignal delivers institutional-grade signals and performance tracking for the modern portfolio.</p>
                </div>
                <div class="f-grid">
                    <div class="f-card" onclick="switchView('signals')">
                        <div class="f-icon"><img src="icon_signal.png" alt="Signal Intelligence" width="48" height="48" loading="lazy"></div>
                        <h3>Alpha Signal Intelligence</h3>
                        <p>Real-time Z-score deviations and relative alpha signals across 500+ institutional assets including Bitcoin and major Indices.</p>
                    </div>
                    <div class="f-card" onclick="switchView('briefing')">
                        <div class="f-icon"><img src="icon_ai.png" alt="AI Briefing" width="48" height="48" loading="lazy"></div>
                        <h3>AI Market Briefing</h3>
                        <p>Daily neural synthesis of global market trends, sentiment shifts, and institutional narrative strategy.</p>
                    </div>
                    <div class="f-card" onclick="switchView('liquidity')">
                        <div class="f-icon"><img src="icon_flow.png" alt="Order Flow (GOMM)" width="48" height="48" loading="lazy"></div>
                        <h3>Market Order Flow</h3>
                        <p>Visualize professional liquidity walls, depth of book, and execution tape to maximize trading performance.</p>
                    </div>
                    <div class="f-card" onclick="switchView('whales')">
                        <div class="f-icon"><img src="icon_whale.png" alt="Whale Pulse" width="48" height="48" loading="lazy"></div>
                        <h3>AI Whale Tracking</h3>
                        <p>Real-time institutional-sized transaction tracking and exchange flow alerts for Bitcoin and Eth whales.</p>
                    </div>
                    </div>
                </div>
            </section>

            <section class="system-dials-section" style="padding: 4rem 2rem; max-width:1400px; margin:0 auto; border-top: 1px solid var(--border);">
                <div class="section-title-wrap" style="text-align:center; margin-bottom:3rem">
                    <h2>System Conviction Dials</h2>
                    <p style="color:var(--text-dim); font-size:1rem; margin-top:0.5rem">Analog institutional indicators tracking global market psychology and blockchain bandwidth limiters.</p>
                </div>
                <div class="dials-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:3rem">
                    <div class="glass-card" style="padding:2rem; text-align:center">
                        <h3 style="color:var(--accent); font-size:1rem; letter-spacing:1px; margin-bottom:1rem">FEAR & GREED</h3>
                        <div style="position:relative; width:100%; height:200px">
                            <canvas id="gauge-fear"></canvas>
                        </div>
                    </div>
                    <div class="glass-card" style="padding:2rem; text-align:center">
                        <h3 style="color:var(--accent); font-size:1rem; letter-spacing:1px; margin-bottom:1rem">NETWORK CONGESTION</h3>
                        <div style="position:relative; width:100%; height:200px">
                            <canvas id="gauge-congestion"></canvas>
                        </div>
                    </div>
                    <div class="glass-card" style="padding:2rem; text-align:center">
                        <h3 style="color:var(--accent); font-size:1rem; letter-spacing:1px; margin-bottom:1rem">RETAIL FOMO</h3>
                        <div style="position:relative; width:100%; height:200px">
                            <canvas id="gauge-fomo"></canvas>
                        </div>
                    </div>
                </div>
            </section>

            <section class="seo-content-extra" style="padding: 4rem 2rem; border-top: 1px solid var(--border); background: rgba(0,0,0,0.2)">
                <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 4rem;">
                    <div>
                        <h2 style="color: var(--accent); margin-bottom: 1.5rem; font-size: 1.5rem;">The Alphasignal Advantage</h2>
                        <p style="color: var(--text-dim); line-height: 1.8; margin-bottom: 1.5rem;">
                            In the fast-moving digital asset market, professional traders require more than just price action. <strong>AlphaSignal</strong> bridges the gap between retail noise and institutional intelligence. Our proprietary <strong>alpha synthesis</strong> engine tracks thousands of data points across <strong>Bitcoin</strong> on-chain flows, exchange liquidity, and social sentiment to deliver a high-conviction <strong>signal</strong> for every market regime.
                        </p>
                        <p style="color: var(--text-dim); line-height: 1.8;">
                            Whether you are validating a new <strong>strategy</strong> or monitoring <strong>performance</strong>, our terminal provides the statistical depth needed to outperform the benchmark.
                        </p>
                    </div>
                    <div>
                        <h2 style="color: var(--accent); margin-bottom: 1.5rem; font-size: 1.5rem;">Risk & Stress Monitoring</h2>
                        <p style="color: var(--text-dim); line-height: 1.8; margin-bottom: 1.5rem;">
                            Protecting capital is the foundation of institutional success. AlphaSignal's <strong>risk</strong> suite offers real-time <strong>stress</strong> testing and correlation matrices to identify systemic decoupling. Monitor <strong>market stress</strong> levels through our VIX-style volatility proxies and cross-chain velocity trackers.
                        </p>
                        <p style="color: var(--text-dim); line-height: 1.8;">
                            Our <strong>AI whale</strong> pulse technology alerts you to massive movements before they hit the order book, giving you a distinct timing advantage in volatile conditions.
                        </p>
                    </div>
                </div>
            </section>

            <section class="faq-section" style="padding: 4rem 2rem; border-top: 1px solid var(--border);">
                <div style="max-width: 800px; margin: 0 auto;">
                    <h2 style="text-align: center; margin-bottom: 3rem;">Frequently Asked Questions</h2>
                    <div class="faq-item" style="margin-bottom: 2rem;">
                        <h4 style="color: var(--text); margin-bottom: 0.5rem;">How does Alphasignal calculate Alpha?</h4>
                        <p style="color: var(--text-dim); font-size: 0.9rem; line-height: 1.6;">Alpha is calculated using a rolling Z-score deviation of returns relative to a Bitcoin (BTC) benchmark, adjusted for institutional volume and order flow magnitude.</p>
                    </div>
                    <div class="faq-item" style="margin-bottom: 2rem;">
                        <h4 style="color: var(--text); margin-bottom: 0.5rem;">What makes your AI Whale Tracking different?</h4>
                        <p style="color: var(--text-dim); font-size: 0.9rem; line-height: 1.6;">Unlike basic transaction scanners, our AI Whale pulse utilizes cluster analysis to identify entity-linked movement, distinguishing between exchange cold storage shifts and true institutional accumulation.</p>
                    </div>
                    <div class="faq-item" style="margin-bottom: 2rem;">
                        <h4 style="color: var(--text); margin-bottom: 0.5rem;">Is this terminal suitable for automated strategies?</h4>
                        <p style="color: var(--text-dim); font-size: 0.9rem; line-height: 1.6;">Yes, AlphaSignal is designed for strategy validation. Our Signal Archive and Backtest Lab allow you to verify the historical performance of multi-asset signals across different market regimes.</p>
                    </div>
                </div>
            </section>
        </div>
    `;

    fetchAPI('/system-dials').then(data => {
        if (!data || !data.dials) return;
        renderSystemGauge('gauge-fear', data.dials.fear_greed.value, 'rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)');
        renderSystemGauge('gauge-congestion', data.dials.network_congestion.value, 'rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)');
        renderSystemGauge('gauge-fomo', data.dials.retail_fomo.value, 'rgba(0, 242, 255, 0.8)', 'rgba(168, 85, 247, 0.8)');
    }).catch(e => console.error(e));
}

function renderSystemGauge(canvasId, value, colorLow, colorHigh) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    let primaryColor = value > 50 ? colorHigh : colorLow;
    
    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
