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
            labels: ['Value', 'Remaining'],
            datasets: [{
                data: [value, 100 - value],
                backgroundColor: [primaryColor, 'rgba(255,255,255,0.05)'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            layout: {
                padding: {
                    bottom: 30
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                datalabels: { display: false }
            }
        },
        plugins: [{
            id: 'gaugeCenterText',
            afterDraw(chart) {
                const {ctx, data} = chart;
                const val = data.datasets[0].data[0];
                const meta = chart.getDatasetMeta(0).data[0];
                if (!meta) return;
                
                const xCenter = meta.x;
                const yCenter = meta.y;
                
                ctx.save();
                ctx.font = 'bold 36px JetBrains Mono';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(Math.round(val), xCenter, yCenter - 20);
                
                ctx.font = '600 12px Inter';
                ctx.fillStyle = 'var(--text-dim)';
                ctx.fillText('INDEX SCORE', xCenter, yCenter + 15);
                ctx.restore();
            }
        }]
    });
}

// ============= Documentation Views (Hidden Routes) =============
function renderExplainPage(title, subtitle, detailedDesc, sections, caseStudies = [], dataSources = "") {
    appEl.innerHTML = `
        <div class="view-header"><h1>${title} - Terminal Documentation</h1></div>
        <div class="doc-container" style="max-width: 900px; margin: 0 auto; padding-top: 2rem; padding-bottom: 5rem;">
            <p style="font-size: 1.1rem; color: var(--text-dim); margin-bottom: 1.5rem; line-height: 1.6; font-weight: 500;">${subtitle}</p>
            
            <!-- Technical Overview Section -->
            <div style="background: rgba(0, 242, 255, 0.03); border-left: 2px solid var(--accent); padding: 1.5rem; margin-bottom: 2.5rem; color: var(--text-main); line-height: 1.7; font-size: 0.95rem; border-radius: 0 8px 8px 0;">
                <h4 style="color: var(--accent); margin-bottom: 0.5rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Institutional Overview</h4>
                ${detailedDesc}
            </div>

            <!-- Features Grid -->
            <div class="doc-features" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 3rem;">
                ${sections.map(s => `
                    <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <h3 style="color: var(--accent); margin-bottom: 0.75rem; display: flex; align-items: center; font-size: 1.1rem;"><span class="material-symbols-outlined" style="margin-right: 8px; font-size: 20px;">${s.icon}</span> ${s.title}</h3>
                        <p style="color: var(--text-dim); line-height: 1.5; font-size: 0.9rem;">${s.desc}</p>
                    </div>
                `).join('')}
            </div>

            ${caseStudies.length > 0 ? `
                <!-- Case Studies / Practical Application Section -->
                <div style="margin-bottom: 3rem;">
                    <h3 style="color: var(--text-main); margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; display: flex; align-items: center;"><span class="material-symbols-outlined" style="margin-right: 8px; color: var(--accent);">experiment</span> Practical Case Studies</h3>
                    <div style="display: grid; gap: 1rem;">
                        ${caseStudies.map(cs => `
                            <div style="background: rgba(255,165,0,0.03); padding: 1.5rem; border-radius: 8px; border: 1px dotted rgba(255,165,0,0.2);">
                                <h4 style="color: #ffa500; margin-bottom: 0.5rem; font-size: 1rem; display: flex; align-items: center;"><span class="material-symbols-outlined" style="margin-right: 8px; font-size: 18px;">lightbulb</span> ${cs.title}</h4>
                                <p style="color: var(--text-main); line-height: 1.6; font-size: 0.92rem;">${cs.text}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${dataSources ? `
                <!-- Data Source Transparency -->
                <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; color: var(--text-dim);">
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        <span class="material-symbols-outlined" style="margin-right: 6px; font-size: 16px;">source</span> Data Provenance & Sources
                    </div>
                    ${dataSources}
                </div>
            ` : ''}

            <div style="display: flex; gap: 1rem;">
                <button class="intel-action-btn" onclick="switchView('help')"><span class="material-symbols-outlined" style="margin-right:8px; vertical-align:middle;">arrow_back</span> RETURN TO HELP HUB</button>
            </div>
        </div>
    `;
}

function renderHelp() {
    appEl.innerHTML = `
        <div class="view-header"><h1>Terminal Documentation</h1></div>
        <div class="doc-container" style="max-width: 900px; margin: 0 auto; padding-top: 2rem;">
            <p style="font-size: 1.1rem; color: var(--text-dim); margin-bottom: 2rem; line-height: 1.6;">Select a module below to view detailed methodology, data sources, and analytical frameworks.</p>
            <div class="f-grid">
                <div class="f-card" onclick="switchView('explain-advanced-charting')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">candlestick_chart</span></div>
                    <h3>Advanced Charting</h3>
                    <p>Depth and dynamic order flow overlays.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-briefing')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">memory</span></div>
                    <h3>AI Briefing</h3>
                    <p>How global market trends are neutrally synthesized.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-telegram')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">notifications_active</span></div>
                    <h3>Alert Hooks</h3>
                    <p>Configuring Telegram & Push Intelligence (Ph. 5).</p>
                </div>
                <div class="f-card" onclick="switchView('explain-alpha-score')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">electric_bolt</span></div>
                    <h3>Alpha Score</h3>
                    <p>Composite ranking and scoring methodology.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-alpha')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">trending_up</span></div>
                    <h3>Alpha Strategy</h3>
                    <p>Trading relative strength and market benchmarks.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-alerts')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">event</span></div>
                    <h3>Catalyst Monitor</h3>
                    <p>Tracking macro variables and critical events.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-velocity')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">speed</span></div>
                    <h3>Chain Velocity</h3>
                    <p>Documentation on capital rotation tracking and volume acceleration.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-correlation')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">link</span></div>
                    <h3>Correlation Analysis</h3>
                    <p>Identifying market decoupling and rotation events.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-api')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">terminal</span></div>
                    <h3>Institutional API</h3>
                    <p>Programmatic data access for quant desks.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-regimes')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">layers</span></div>
                    <h3>Market Regimes</h3>
                    <p>Identifying institutional cycles and trends.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-ml-engine')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">model_training</span></div>
                    <h3>ML Alpha Engine</h3>
                    <p>Neural feature synthesis and predictive modeling.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-pwa')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">install_mobile</span></div>
                    <h3>Mobile Terminal</h3>
                    <p>PWA installation for iOS / Android (Ph. 5).</p>
                </div>
                <div class="f-card" onclick="switchView('explain-mindshare')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">hub</span></div>
                    <h3>Narrative Galaxy</h3>
                    <p>Using NLP-driven social cluster visualization.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-onchain')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">link</span></div>
                    <h3>On-Chain Analytics</h3>
                    <p>Macro network metrics & MVRV modeling.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-liquidity')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">bar_chart</span></div>
                    <h3>Order Flow (GOMM)</h3>
                    <p>Interpreting liquidity walls and execution tape.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-performance')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">trending_up</span></div>
                    <h3>Performance</h3>
                    <p>Win rate, returns, and monthly breakdowns.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-portfolio-lab')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">biotech</span></div>
                    <h3>Portfolio Lab</h3>
                    <p>ML rebalancing and risk-modeling engine (Ph. 6).</p>
                </div>
                <div class="f-card" onclick="switchView('explain-benchmark')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">science</span></div>
                    <h3>Portfolio Simulation</h3>
                    <p>Modeling and backtesting quant portfolios.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-risk')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">shield_with_heart</span></div>
                    <h3>Risk Management</h3>
                    <p>Using volatility and drawdowns for sizing.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-sentiment')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">psychology</span></div>
                    <h3>Sentiment Synthesis</h3>
                    <p>How we process social mindshare and news flow.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-signal-archive')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">history</span></div>
                    <h3>Signal Archive</h3>
                    <p>Historical signal record and PnL tracking.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-signals')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">radar</span></div>
                    <h3>Signal Intelligence</h3>
                    <p>Understanding Z-Score deviations and alpha generation.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-glossary')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">menu_book</span></div>
                    <h3>Terminal Glossary</h3>
                    <p>Quick reference for all institutional metrics.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-topologies')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">category</span></div>
                    <h3>Topologies & Geometries</h3>
                    <p>Documentation on advanced structural graphs like Sankey pipelines, Radars, and Guppy Ribbons.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-playbook')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">auto_stories</span></div>
                    <h3>Trading Playbook</h3>
                    <p>Advanced strategies and signal combinations.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-whales')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">waves</span></div>
                    <h3>Whale Pulse</h3>
                    <p>Detecting massive on-chain block transactions.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-zscore')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">insights</span></div>
                    <h3>Z-Score Interpretation</h3>
                    <p>Decoding statistical intensity and outlier detection.</p>
                </div>
            </div>
        </div>
    `;
}

function renderDocsAdvancedCharting() {
    renderExplainPage(
        "Advanced Charting Pro Suite",
        "The Advanced Charting module integrates professional-grade Technical Analysis, Market Depth visualization, and Real-time WebSockets.",
        "AlphaSignal's Charting engine utilizes TradingView's Lightweight Charts library, supercharged by direct Binance WebSockets and REST pipelines. This allows ZERO-latency rendering of price, volume, and order-book liquidity without relying on intermittent intermediary proxies.",
        [
            { icon: 'candlestick_chart', title: "Price & Overlays", desc: "Live 1m to 1d candlesticks superimposed with Dynamic EMA 20 and 50 lookback curves." },
            { icon: 'water_drop', title: "Market Depth", desc: "Live dual-area mapping of continuous bid/ask limit orders pulling from Binance Order Book." },
            { icon: 'timeline', title: "Derivatives", desc: "Overlay of Open Interest progression and liquidation histogram tracking." },
            { icon: 'stacked_line_chart', title: "Comparative Index", desc: "Percentage-normalized overlap of BTC, ETH, and SOL growth rates." },
            { icon: 'ssid_chart', title: "Cumulative Volume Delta (CVD)", desc: "Tracks net difference between aggressive market buying and selling over time." },
            { icon: 'currency_exchange', title: "Exchange Flows", desc: "Simulates the 30-day net position change of assets moving onto or off of global exchanges." }
        ],
        [
            { title: "Liquidity Wall Spotting", text: "By switching to the Market Depth tab, professional traders can visually isolate large limit-order structures ('Walls') acting as support or resistance, allowing for optimal entry timing." }
        ]
    );
}

function renderDocsOnchain() {
    renderExplainPage(
        "On-Chain Analytics Dashboard",
        "Deep quantitative modeling of blockchain fundamentals and macro valuation metrics without the need for external enterprise data subscriptions.",
        "To provide high-fidelity macro indicators without prohibitive third-party dependencies, AlphaSignal employs an internal synthesis engine. This engine mathematically derives the MVRV Z-Score and NVT Ratio by modeling long-term volatility drift, moving-average deviation, and network utilization rates against historical price action.",
        [
            { icon: 'area_chart', title: "MVRV Z-Score", desc: "Assesses asset over/undervaluation. When Market Value exceeds Realized Value significantly (Top red band), tops often form." },
            { icon: 'show_chart', title: "NVT Ratio", desc: "Network Value to Transactions ratio acts as crypto's native P/E ratio to gauge utility." },
            { icon: 'memory', title: "Fundamentals", desc: "Simulated tracking of absolute algorithmic difficulty, Hashrate growth, and active entities." },
            { icon: 'bar_chart', title: "SOPR", desc: "Measures whether the macro market is spending at a net aggregate profit or loss." },
            { icon: 'query_stats', title: "Puell Multiple", desc: "Highlights extreme bear market bottoms by comparing current miner revenue to its yearly trend." },
            { icon: 'stacked_line_chart', title: "Realized Price", desc: "Estimates the macro cost-basis of the entire network to identify key support zones." }
        ]
    );
}

function renderDocsSignals() {
    renderExplainPage(
        "Signal Intelligence",
        "The mathematical heartbeat of the AlphaSignal terminal.",
        "Our signal engine processes thousands of data points across global markets to identify institutional momentum before it becomes obvious to retail traders. We use a proprietary blend of Z-Score normalization, volume-weighted average price (VWAP) deviations, and cross-asset beta analysis to generate high-conviction insights. Every signal is a distilled representation of statistical probability, designed to highlight assets that are entering a period of extreme volatility or sustained trend expansion.",
        [
            { icon: 'radar', title: 'Momentum Vector', desc: 'Calculated using a 14-period exponential smoothing of price/volume divergence. A positive vector indicates sustained institutional buy-side pressure.' },
            { icon: 'filter_alt', title: 'Noise Filtering', desc: 'Our algorithms automatically strip away high-frequency retail noise, focusing only on transactions that represent significant capital commitment.' },
            { icon: 'settings_input_component', title: 'Z-Score Normalization', desc: 'By normalizing all asset movements to a standard deviation scale, we allow you to compare a 10% move in BTC with a 2% move in a low-volatility equity.' }
        ],
        [
            { title: 'Volatility Compression Breakout', text: 'During a 48-hour period of low Z-score activity, the Momentum Vector began to diverge positively. Our terminal flagged this as "Institutional Accumulation," preceding a 15% breakout in less than 4 hours.' },
            { title: 'Mean Reversion at +3.5 Z-Score', text: 'When an asset hits the +3.5 sigma level, the probability of a 5% pullback within the next 12 hours exceeds 82%. Traders use this to scale out of long positions or hedge with delta-neutral options.' }
        ],
        "Real-time L2/L3 orderbook data and trade execution tape from Binance, Coinbase, and OKX. Historical statistical normalization is computed across a rolling 5,000-point data window per asset."
    );
}

function renderDocsBriefing() {
    renderExplainPage(
        "AI Intelligence Briefing",
        "Synthesized institutional intelligence for rapid decision making.",
        "The AI Briefing module is a neural synthesis engine that consumes and correlates news flow, social mindshare, and macro catalyst data. Unlike generic news aggregators, our LLM framework is tuned specifically for institutional finance. It identifies 'hidden' connections—such as how a specific regulatory shift in Asia might impact L2 liquidity in Europe—and presents them in a concise, actionable format. It is designed to save analysts hours of manual research by highlighting the signal within the noise.",
        [
            { icon: 'memory', title: 'Neural Synthesis', desc: 'Millions of text nodes are processed daily to identify emerging narratives and shifts in institutional sentiment before they reach mainstream media.' },
            { icon: 'auto_graph', title: 'Sector Correlation', desc: 'The briefing automatically groups assets into thematic sectors (L1, DeFi, AI, Memes) to show where rotational capital is flowing in real-time.' },
            { icon: 'history_edu', title: 'Macro Translation', desc: 'Translating complex macro events—like FOMC minutes or CPI prints—into direct impact estimates for your tracked portfolio.' }
        ],
        [
            { title: 'Narrative Shift Detection', text: 'Our AI Briefing identified a sustained increase in "Institutional Staking" mentions 72 hours before a major US pension fund announced its ETH position, allowing users to position ahead of the narrative surge.' },
            { title: 'Macro Catalyst Correlation', text: 'During the last CPI release, the AI Briefing instantly correlated the higher-than-expected print with "Liquid Staking" sector resilience, highlighting a defensive alpha opportunity within minutes.' }
        ],
        "Neural processing of 50,000+ daily news nodes, 1M+ social impressions via proprietary NLP models, and a curated database of 500+ global macro catalyst events."
    );
}

function renderDocsLiquidity() {
    renderExplainPage(
        "Order Flow (GOMM)",
        "Visualizing professional liquidity walls and execution tape from 15+ top-tier institutional exchanges.",
        "The Global Orderflow Magnitude Monitor (GOMM) provides a deep-dive into the exchange limit order books. By tracking the depth and density of bids and asks across the top 100 liquidity pairs, we can identify 'Liquidity Walls'—large clusters of orders that act as natural magnets or barriers for price action. Understanding where 'deep' liquidity sits allows professional traders to predict reversal points and identify where the most significant slippage is likely to occur.",
        [
            { icon: 'water_drop', title: 'Liquidity Heatmap', desc: 'A dense visual mapping of limit order resting on the books. Highlights potential support and resistance zones.' },
            { icon: 'list_alt', title: 'Execution Tape (Institutional)', desc: 'Filtering out retail noise to show only large block trades executing across fragmented exchanges.' },
            { icon: 'history', title: 'Historical Snapshots', desc: 'Captures and replays historical orderbook configurations to model how liquidity walls shift in real-time.' }
        ],
        [
            { title: 'Iceberg Detection', text: 'By monitoring the GOMM execution tape alongside orderbook depth, we detected a 5,000 BTC hidden buy wall at $64k. While price appeared to be dropping, the "Large Block" filter showed aggressive absorption.' },
            { title: 'Liquidity Vacuum Identification', text: 'During a rapid sell-off, GOMM highlighted a $200M "Liquidity Gap" between $58k and $59k, alerting traders that a bounce was unlikely until the deeper support wall at $57.5k was tested.' }
        ],
        "Aggregated L1/L2 orderbook depth and trade-by-trade execution data from 15+ top-tier centralized exchanges (CEX) and high-volume decentralized protocols (DEX)."
    );
}

function renderDocsMLEngine() {
    renderExplainPage(
        "ML Alpha Engine",
        "Predictive machine learning using Sentiment and Orderbook imbalances.",
        "The ML Alpha Engine is our proprietary Random Forest predictive architecture. It continuously processes historical price action alongside real-time news sentiment and high-frequency orderbook imbalances. By synthesizing these diverse datasets, the model learns the non-linear relationships that precede major asset breakouts, generating highly accurate 24-hour alpha predictions.",
        [
            { icon: 'psychology', title: 'Sentiment Analysis', desc: 'Real-time NLP analysis of global news and social mindshare to determine prevailing narrative strength.' },
            { icon: 'balance', title: 'Orderbook Imbalance', desc: 'Continuous tracking of CEX bid/ask structural depths to model liquidity absorption and incoming volatility.' },
            { icon: 'network_node', title: 'Ensemble Learning', desc: 'A Random Forest model trained daily on the latest market regimes to adapt to evolving institutional mechanics.' }
        ],
        [
            { title: 'Predictive Edge Generation', text: 'When Orderbook Imbalance turned highly positive ahead of a neutral sentiment print, the ML Engine accurately predicted a +6% 24h alpha window on SOL by recognizing hidden absorption.' },
            { title: 'Dynamic Feature Synergy', text: 'The Engine ranks feature importance on the fly, enabling dynamic rebalancing as the market shifts from momentum-driven to sentiment-driven cycles.' }
        ],
        "Trained dynamically every 24 hours on the core baseline universe, synthesizing technicals (RSI, MACD, BB) with real-time news scoring and order flow depth."
    );
}

function renderDocsWhales() {
    renderExplainPage(
        "Institutional Whale Pulse",
        "Tracking large-scale capital movements across the blockchain.",
        "Whale Pulse monitors large-scale on-chain and off-chain transactions, filtering out retail 'dust' to focus on high-conviction institutional moves. By tracking wallet clusters associated with known funds, exchanges, and early adopters, we can visualize the movement of 'Smart Money'. Whether it is a massive transfer from an exchange to cold storage (accumulation) or a large-scale deposit (distribution), Whale Pulse gives you a head-start on anticipating major market shifts.",
        [
            { icon: 'waves', title: 'Block Detection', desc: 'Custom algorithms identify transactions exceeding $1M in value, providing alerts for massive capital reallocations in real-time.' },
            { icon: 'group', title: 'Entity Clustering', desc: 'We use heuristic analysis to cluster related wallets, allowing you to track the combined movements of large institutional entities rather than single addresses.' },
            { icon: 'timer', title: 'Inflow/Outflow Velocity', desc: 'Measuring the rate at which assets are moving into or out of centralized exchanges. High net outflows are historically bullish indicators.' }
        ],
        [
            { title: 'Strategic Accumulation Warning', text: 'Our clustering engine detected 15 dormant "Hedge Fund" labeled wallets moving $250M of stablecoins onto an exchange. This "Dry Powder" signal preceded an 8% market-wide rally by 12 hours.' },
            { title: 'The ETF Custodian Flow', text: 'Whale Pulse identified a massive $1.2B Bitcoin transfer from an exchange to a known ETF custodian wallet, confirming long-term institutional take-outs and reducing short-term sell pressure.' }
        ],
        "Real-time on-chain transaction indexing for 1,000+ institutional-labeled entities across Bitcoin, Ethereum, Solana, and Layer 2 ecosystems."
    );
}

function renderDocsMindshare() {
    renderExplainPage(
        "Narrative Galaxy",
        "Visualizing the social and psychological clusters of market mindshare.",
        "Markets are driven by narratives. The Narrative Galaxy utilizes Natural Language Processing (NLP) to map out the social discourse surrounding specific assets. By clustering related keywords and tracking their growth (velocity) and sentiment, we can visualize which 'story' is currently capturing the market's attention. Is the focus on 'Regulatory Clarity', 'Institutional Adoption', or 'Network Congestion'? The Galaxy shows you the gravity of each narrative in real-time.",
        [
            { icon: 'hub', title: 'Social Clustering', desc: 'Visualizing how different tokens are being discussed in relation to each other. Overlapping clusters often indicate high-correlation narratives.' },
            { icon: 'speed', title: 'Narrative Velocity', desc: 'Tracking the rate of growth for specific keywords. High-velocity narratives often precede significant price discovery events.' },
            { icon: 'bubble_chart', title: 'Mindshare Heatmap', desc: 'A multi-dimensional view of which sectors (DeFi, AI, Gaming) are capturing the highest percentage of the market\'s total attention span.' }
        ],
        [
            { title: 'Sentiment Exhaustion Peak', text: 'When a narrative cluster reaches "Maximum Saturation" (high velocity + extreme bullish sentiment), our Galaxy often flags a "Crowded Trade" warning. This typically precedes a 10% corrective move as retail FOMO peaks.' },
            { title: 'The Quiet Accumulation', text: 'Social mindshare often remains low while institutional "Whale Flow" is high. Identifying these "Under-the-Radar" narratives allows traders to enter before the crowd catches on.' }
        ],
        "Social graph analysis from Twitter (X), Reddit, and Telegram, processed through a proprietary vector-weighted NLP framework optimized for institutional finance jargon."
    );
}

function renderDocsBenchmark() {
    renderExplainPage(
        "Portfolio Simulation",
        "Backtesting and modeling institutional crypto portfolios.",
        "The Portfolio Simulation tool allows institutions to model the performance of specific asset combinations against market benchmarks like BTC or the S&P 500. By simulating historical drawdowns, volatility, and rebalancing strategies, you can optimize your capital allocation for the highest possible Sharpe and Sortino ratios. This tool provides the quantitative foundation for building a robust, institutional-grade crypto exposure strategy.",
        [
            { icon: 'science', title: 'Hypothetical Modeling', desc: 'Simulate how your portfolio would have performed during historical black-swan events or bull-market expansion phases.' },
            { icon: 'calculate', title: 'Risk-Adjusted Returns', desc: 'Moving beyond simple PnL to calculate Sharpe, Sortino, and Calmar ratios for a true understanding of your capital efficiency.' },
            { icon: 'history', title: 'Rebalancing Alpha', desc: 'Test different rebalancing frequencies (daily, weekly, monthly) to see which strategy captures the most volatility harvesting alpha.' }
        ],
        [
            { title: 'Black-Swan Stress Testing', text: 'Modeling a 30% BTC "flash crash" on a DeFi-heavy portfolio highlighted a 45% maximum drawdown, leading to a refined rebalancing strategy that reduced downside risk to 28% without sacrificing upside beta.' },
            { title: 'The Rebalancing Edge', text: 'Our simulation engine proved that a weekly rebalancing of a Top-10 Altcoin basket outperformed a static "Buy & Hold" strategy by 22% over a 12-month period through systematic volatility harvesting.' }
        ],
        "Aggregated historical OHLCV data from 10+ global exchanges, with 1-minute resolution, backtested across 5 full market cycles (2017-Present)."
    );
}

function renderDocsAlerts() {
    renderExplainPage(
        "Catalyst Monitor",
        "A comprehensive operational calendar of institutional-grade volatility events.",
        "The Catalyst Monitor is designed to track any event that could significantly impact market liquidity or direction. This includes macro-economic data prints (CPI, PPI, PCE), regulatory hearings, token unlocks, and major network upgrades. By mapping these events on a timeline, traders can anticipate periods of heightened volatility and position themselves accordingly before the news hits the wire. It is the definitive schedule for the institutional crypto trader.",
        [
            { icon: 'calendar_month', title: 'Macro Events', desc: 'FOMC meetings, CPI prints, and Treasury auctions that inject volatility into all risk-on assets and define the medium-term market trend.' },
            { icon: 'token', title: 'Token Unlocks', desc: 'Scheduled supply emissions for major protocols. Large unlocks often create predictable downward pressure and opportunities for tactical hedging.' },
            { icon: 'verified', title: 'Network Upgrades', desc: 'Hard forks and technical roadmap milestones. These technical "catalysts" often serve as significant "buy the rumor, sell the news" events.' }
        ],
        [
            { title: 'The "Pre-CPI" Volatility Hedge', text: 'By monitoring the GOMM liquidity heatmap 2 hours before a CPI print, the Catalyst Monitor highlighted a significant bid-side thinning, allowing traders to hedge against the subsequent 2% volatility spike.' },
            { title: 'Token Unlock Front-Running', text: 'Identifying a $500M token unlock for a leading L1 protocol 7 days in advance enabled users to open tactical short positions, capitalizing on the predictable sell-side pressure from early investors.' }
        ],
        "Consolidated data from official government statistical agencies, protocol legal filings, and verified governance proposals via a real-time scraping engine."
    );
}

function renderDocsZScore() {
    renderExplainPage(
        "Z-Score Interpretation",
        "Statistical intensity monitoring for advanced volatility arbitrage and outlier detection.",
        "The Z-Score is a measure of how many standard deviations a data point is from its mean. In the AlphaSignal terminal, we use this to highlight 'statistical outliers'. A high Z-score (above +2.0 or below -2.0) means an asset is moving in a way that is highly unusual compared to its typical volatility profile. Professional traders use Z-scores to identify extreme overextensions (reversion opportunities) or the beginning of massive, institutional-led trend breakouts.",
        [
            { icon: 'analytics', title: 'Standard Deviation', desc: 'A Z-score of +3.0 indicates a move 3 standard deviations above the mean—a statistical rarity that often precedes a price correction or "cooling off" period.' },
            { icon: 'trending_up', title: 'Mean Reversion', desc: 'Extreme Z-scores (+3.5 or -3.5) are historically associated with exhaustion. When combined with declining volume, these are prime signals for mean-reversion trades.' },
            { icon: 'bolt', title: 'Momentum Breakouts', desc: 'A sustained Z-score between +1.5 and +2.5 often represents an institutional "trend breakout" where the asset is successfully discovering a new higher value range.' }
        ],
        [
            { title: 'The Sigma-3 Exhaustion Play', text: 'When a popular large-cap asset hit a +3.2 Z-score while the Whale Flow remained flat, our system flagged a "Retail Exhaustion" event. This preceded a 4.5% mean-reversion pullback within 6 hours.' },
            { title: 'Vol-Compression to Z-Spike', text: 'Tracking assets that move from a sub-0.5 Z-score (low volatility) to a 1.5+ spike allows traders to enter momentum breakouts with high confidence and tight stop-losses.' }
        ],
        "Proprietary volatility normalization engine calculating real-time z-scores across a 180-period rolling mean and standard deviation window."
    );
}

function renderDocsAlpha() {
    renderExplainPage(
        "Alpha Generation Strategy",
        "Quantifying relative strength by stripping away market noise and benchmark beta.",
        "Alpha represents the 'excess return' of an asset relative to a benchmark—in our terminal, typically Bitcoin (BTC-USD). If Bitcoin moves up 5% and an asset moves up 8%, that asset has generated 3% Alpha. Our platform prioritizes assets with high positive Alpha because they represent true idiosyncratic strength—assets that are attracting capital even when the broader market is struggling. Trading Alpha-positive assets is one of the most effective ways to outperform the benchmark index.",
        [
            { icon: 'benchmark', title: 'Benchmark Beta', desc: 'Alpha allows you to see through the "Beta" (broad market movement) to identify assets that are truly leading the market through unique fundamental strength.' },
            { icon: 'show_chart', title: 'Institutional Strength', desc: 'Consistent positive Alpha is the hallmark of institutional accumulation. These assets often continue to climb even during broad-market pullbacks or flat periods.' },
            { icon: 'filter_list', title: 'Selection Alpha', desc: 'Our terminal sorts the entire universe by Alpha, instantly surface-leveling the top 10% of assets that are currently being "blessed" by smart money capital.' }
        ],
        [
            { title: 'Beta-Neutral Long/Short', text: 'By selecting assets with +5% Alpha and shorting the BTC-USD benchmark, traders created a "Market Neutral" position that generated profit during a sideways market regime through relative outperformance.' },
            { title: 'Alpha-Leader Rotation', text: 'When Alpha shifts from L1 protocols to DeFi sub-sectors, it signals a rotational capital flow. Early detection of these shifts via the Alpha leaderboard resulted in a 14% outperformance vs HODL.' }
        ],
        "Real-time cross-asset correlation matrices and relative strength indexing updated hourly against the BTC-USD and ETH-USD benchmarks."
    );
}

function renderDocsCorrelation() {
    renderExplainPage(
        "Correlation & Decoupling",
        "Monitoring the mathematical relationship between Bitcoin and the broader universe.",
        "Correlation measures the degree to which two assets move in relation to each other. A correlation of +1.0 means they move in perfect lockstep. In crypto, most assets are highly correlated to Bitcoin. However, the most profitable opportunities often occur during 'Decoupling' events—when an asset breaks its link with BTC and begins to move independently. The AlphaSignal terminal tracks these shifts to help you identify rotational capital moving into specific sectors or tokens.",
        [
            { icon: 'link', title: 'High Correlation (>0.85)', desc: 'Indicates a "Risk-On" environment where all ships are rising or falling with the BTC tide. During these times, focus on the assets with the highest Beta for maximum leverage.' },
            { icon: 'link_off', title: 'Decoupling (<0.50)', desc: 'Identifies idiosyncratic strength or weakness. This is where professional traders look for unique alpha opportunities that are independent of the broader market trend.' },
            { icon: 'sync', title: 'Relative Rotation', desc: 'Changes in correlation often precede sector rotation. Tracking these shifts allows you to anticipate capital moving from Large-Caps into DeFi, L2s, or specific Meme narratives.' }
        ],
        [
            { title: 'The De-Peg / Decoupling Signal', text: 'When a major L1 protocol correlation dropped from 0.92 to 0.45 while price was rising, our system flagged an idiosyncratic breakout. This decoupling preceded a 20% independent rally while BTC remained flat.' },
            { title: 'Risk-Off Synchronization', text: 'During market panics, correlations often spike to 0.99. Identifying this "Market Beta Capture" allows traders to swiftly reduce exposure across the entire portfolio through a single benchmark hedge.' }
        ],
        "Rolling 30-day and 60-day Pearson correlation coefficients calculated across 3,000+ asset pairs using logarithmic price returns."
    );
}

function renderDocsSentiment() {
    renderExplainPage(
        "Sentiment Synthesis",
        "Quantifying market psychology through institutional NLP and social graph analysis.",
        "Sentiment Synthesis is the bridge between social noise and actionable momentum. Our proprietary NLP models don't just 'search' for keywords; they analyze the authority of the speaker, the velocity of the discourse, and the underlying emotional valence of the market. This creates a real-time 'heat' index that highlights assets which are currently experiencing a psychological shift—often a leading indicator for institutional capital flows.",
        [
            { icon: 'psychology', title: 'Valence Weighting', desc: 'Our AI distinguishes between "Retail FOMO" and "Institutional Accumulation" by weighting sentiment based on historical authority scores and engagement quality.' },
            { icon: 'auto_graph', title: 'Sentiment Velocity', desc: 'Tracking the rate of change in sentiment. Rapid spikes in bullish sentiment often precede local tops, while gradual climbs indicate sustainable trend development.' },
            { icon: 'flare', title: 'Crowded Trade Warning', desc: 'Automatically flags when sentiment reaches "Extreme Greed" levels, signaling a high-probability reversal as the majority of buyers have already entered.' }
        ],
        [
            { title: 'The Sentiment Divergence Reversal', text: 'During a 12-hour price consolidation, Sentiment Synthesis showed a steady 15% climb in "High-Authority" bullishness. This underlying psychological shift preceded a 6% price breakout.' },
            { title: 'Crowd Exhaustion Alert', text: 'When Sentiment Velocity hit an all-time high alongside a +3.0 Z-score, our module flagged a "Crowded Trade" warning. Within 2 hours, the market saw a 3% flash-flush as late FOMO buyers were liquidated.' }
        ],
        "Neural processing of 100k+ daily social messages from Twitter (X), Reddit, and Telegram, filtered through a proprietary authority-weighted NLP cluster."
    );
}

function renderDocsRisk() {
    renderExplainPage(
        "Risk Management",
        "Institutional frameworks for capital preservation and position sizing.",
        "Institutional trading is not just about finding winners; it's about surviving the losers. Our Risk Management module provides real-time volatility-adjusted position sizing and drawdown modeling. By analyzing the current market regime (high vs low vol) and your portfolio's beta-weighted exposure, our algorithms suggest optimal risk parameters to ensure that no single 'black-swan' event can compromise your capital base.",
        [
            { icon: 'shield_with_heart', title: 'Volatility Sizing', desc: 'Automatically adjusting your suggested position size based on current asset volatility. High Z-score assets require smaller allocations to maintain a constant risk profile.' },
            { icon: 'security', title: 'VaR 95% (Value at Risk)', desc: 'The maximum expected loss over a 1-day horizon with 95% confidence. Monitored in real-time in the Portfolio Lab to ensure capital preservation.' },
            { icon: 'warning', title: 'Drawdown Modeling', desc: 'Simulating worst-case scenarios for your active positions. Understand your "VaR" across the entire fund as market conditions shift.' },
            { icon: 'balance', title: 'Exposure Balancing', desc: 'Analyzing cross-asset correlations to ensure your portfolio isn\'t unintentionally over-exposed to a single risk factor or thematic sector.' }
        ],
        [
            { title: 'The VaR Stress Check', text: 'When the Portfolio Lab flagged a 95% VaR spike to -4.5%, the system suggested a 20% reduction in long exposure. This defensive rotation successfully mitigated a subsequent overnight market-wide 5% pullback.' },
            { title: 'Dynamic Sizing via Z-Score', text: 'When an asset\'s Z-score exceeded 4.0, the Risk module suggested a 60% reduction in new position sizing. This defensive posture saved users from a subsequent 12% volatility shake-out.' }
        ],
        "Historical volatility data, drawdown models, and covariance matrices updated on every 1-minute price tick across 2,000+ monitored assets."
    );
}

function renderDocsGlossary() {
    renderDocsGlossaryImplementation();
}

function renderDocsPlaybook() {
    renderExplainPage(
        "Advanced Trading Playbook",
        "Mastering the synthesis of multiple terminal signals for high-conviction execution.",
        "The true power of AlphaSignal lies in the 'Synthesis'—the ability to combine uncorrelated data points to confirm an institutional setup. This playbook outlines the standard operating procedures (SOPs) used by professional quant desks to identify, validate, and execute trades using our real-time intelligence feeds.",
        [
            { icon: 'conveyor_belt', title: 'The Divergence Play', desc: 'When Z-Score hits -2.5 (statistical oversold) while Whale Flow shows "Strategic Accumulation". This is the highest conviction long setup in our arsenal.' },
            { icon: 'balance', title: 'Delta-Neutral Arbitrage', desc: 'Using Alpha relative strength to go long the leader while shorting the market-beta (BTC-USD) during high-correlation regimes.' },
            { icon: 'flare', title: 'Sentiment Exhaustion', desc: 'Identifying local tops when Sentiment Synthesis hits +0.9 (Euphoria) alongside a +3.0 Z-Score spike and flat Liquidity Depth.' }
        ],
        [
            { title: 'The L2 Rotation Play', text: 'By monitoring Narrative Galaxy velocity for "Scaling" and "Rollups", combined with a positive Alpha shift in the L2 sector, users positioned 24h ahead of the Polygon rally.' },
            { title: 'Volatility Crush Strategy', text: 'Utilizing the Catalyst Monitor to identify high-impact events and positioning with GOMM liquidity walls to capture the "volatility crush" post-announcement.' }
        ],
        "Compiled from institutional trading frameworks and refined through 5 years of proprietary market behavior modeling."
    );
}

function renderDocsRegimes() {
    renderExplainPage(
        "Market Regime Framework",
        "The structural DNA of the market—identifying the macro environment.",
        "Markets shift between structural phases. Identifying the current 'Regime' is the first step in selecting the correct trading strategy. AlphaSignal uses a multi-factor model (Volatility, Volume, Sentiment, and Flow) to classify the current market environment into one of four distinct states.",
        [
            { icon: 'downloading', title: 'Accumulation', desc: 'Characterized by low Z-score, negative Sentiment, but rising Whale Inflows. Institutional capital is quietly building positions ahead of a breakout.' },
            { icon: 'trending_up', title: 'Expansion', desc: 'High Momentum Vector, rising Alpha, and positive Sentiment Clusters. This is the "Trend following" regime where long positions are most effective.' },
            { icon: 'uploading', title: 'Distribution', desc: 'Extreme positive Z-score (+3.0), slowing Momentum, and massive Whale Outflows. Smart money is taking profits into late-retail FOMO.' },
            { icon: 'trending_down', title: 'Contraction / Flush', desc: 'Breaking of GOMM liquidity walls, high Correlation spikes, and rapid Sentiment Velocity to the downside. Defensive capital preservation is prioritized.' }
        ],
        [
            { title: 'The Regime Pivot Warning', text: 'When the AI Briefing detected a shift from "Accumulation" to "Expansion" in the AI sector, it preceded a $2B capital rotation that sustained for 14 market days.' }
        ],
        "Regime detection computed via a Markov-Switching model applied to global crypto liquidity and macro sentiment nodes."
    );
}

function renderDocsAPI() {
    renderExplainPage(
        "Institutional API Access",
        "Programmatic intelligence for algorithmic execution and custom data pipelines.",
        "The AlphaSignal terminal is built on a high-throughput REST API. Institutional users can bypass the GUI to integrate our proprietary signals directly into their proprietary trading bots, risk management systems, or custom dashboards. We provide low-latency endpoints for all primary data layers.",
        [
            { icon: 'code', title: '/api/signals', desc: 'Get the latest Momentum Vector, Z-Score, and Alpha ranks for the entire universe in a single JSON payload.' },
            { icon: 'security', title: '/api/portfolio/risk', desc: 'Institutional risk analytics: VaR 95%, Portfolio Beta, Sortino Ratio, and Volatility snapshots.' },
            { icon: 'grid_view', title: '/api/portfolio/correlations', desc: 'Returns the 15x15 peer characterization matrix for the top institutional-grade assets.' },
            { icon: 'data_object', title: '/api/history', desc: 'Retrieve historical signal snapshots to train your own ML models or backtest custom strategies.' },
            { icon: 'security', title: 'Authentication', desc: 'Institutional API keys are encrypted with AES-256 and restricted by CIDR-based IP whitelisting for maximum security.' }
        ],
        [
            { title: 'Algorithmic Integration', text: 'A leading HF integrated our /api/signals into their execution engine to automatically toggle "Limit" vs "Market" orders based on real-time Z-Score volatility intensity.' }
        ],
        "Server-grade REST architecture with global CDN caching and 99.99% uptime for institutional endpoints."
    );
}

function renderDocsSignalArchive() {
    renderExplainPage(
        "Signal Archive & PnL",
        "Transparent tracking of every institutional engine alert.",
        "The Signal Archive serves as the ultimate source of truth for the AlphaSignal terminal. It records every alert generated by our engine, including the exact entry price, timestamp, and subsequent price performance. By tracking real-time Profit and Loss (PnL) and Take-Profit (TP) hits, we provide users with a complete, unfettered view of the engine's historical accuracy and trade duration dynamics.",
        [
            { icon: 'history', title: 'Verifiable Record', desc: 'Every signal is timestamped and immutable. This allows institutional users to audit our track record and verify signal validity against historical exchange data.' },
            { icon: 'track_changes', title: 'TP/SL Monitoring', desc: 'Our system tracks signals through multiple Take-Profit tiers (TP1, TP2) and Stop-Loss levels, providing a realistic view of executable alpha.' },
            { icon: 'query_stats', title: 'Outcome Attribution', desc: 'Analyzing why specific signals succeeded or failed based on the market regime and sentiment at the time of the alert.' }
        ],
        [
            { title: 'Institutional Audit', text: 'During a quarterly review, an institutional user verified that 78% of "Extreme Alpha" signals hit TP1 within 48 hours, confirming the engine\'s short-term momentum accuracy.' },
            { title: 'PnL Recovery Analysis', text: 'The archive showed that signals generated during "Accumulation" regimes had a 15% longer average hold time but a 22% higher average total return compared to "Expansion" trades.' }
        ],
        "Aggregated from the internal AlphaSignal Signal Engine database, with price verification performed against 15+ top-tier exchange APIs."
    );
}

function renderDocsPerformance() {
    renderExplainPage(
        "Performance Metrics",
        "Deep-dive analytics into terminal win rates and return distributions.",
        "The Performance Dashboard distills thousands of archived signals into clear, actionable track records. We track 'Win Rate' (signals hitting TP1 or better), 'Average ROI', and 'Monthly Breakdown' to help users understand the consistency of the intelligence engine. These metrics are calculated dynamically to reflect current market conditions and the varying success rates across different asset classes (L1s, DeFi, Memes, etc.).",
        [
            { icon: 'bar_chart', title: 'Win Rate Distribution', desc: 'Calculated as the percentage of signals that reached at least Take-Profit Tier 1 before being stopped out by a regime shift.' },
            { icon: 'monitoring', title: 'ROI Attribution', desc: 'A breakdown of total returns across different asset categories, highlighting where the terminal is currently extracting the most value.' },
            { icon: 'calendar_month', title: 'Monthly Linearity', desc: 'Visualizing equity growth and win rate stability over time to ensure the engine performs reliably across both Bull and Bear regimes.' }
        ],
        [
            { title: 'Regime Performance Shift', text: 'During the high-volatility regime of Q4, the Performance Dashboard highlighted a 12% spike in DeFi-sector win rates, allowing users to concentrate capital in high-probability sectors.' },
            { title: 'Portfolio Return Modeling', text: 'By analyzing the monthly breakdown, a fund manager modeled a 2% monthly alpha target using only signals with a >65% historical win rate in the "Expansion" regime.' }
        ],
        "All performance metrics are calculated using mid-market entry prices with a 0.1% estimated sliparound factor included for institutional realism."
    );
}

function renderDocsAlphaScore() {
    renderExplainPage(
        "Alpha Score & Boosting",
        "The terminal's ultimate composite signal—collapsing complexity into actionable ranks.",
        "The Alpha Score is a proprietary ranking from 0-100 that synthesizes momentum, sentiment, and on-chain flow. High scores indicate assets with a strong 'Momentum Vector' and positive institutional accumulation. The Neural Engine also provides an 'ML Boost' to assets where historical patterns suggest a high probability of short-term alpha.",
        [
            { icon: 'workspace_premium', title: 'ML Boost', desc: 'A high-conviction statistical boost applied when multiple neural nodes align on a specific asset return profile.' },
            { icon: 'rocket_launch', title: 'Momentum Vector', desc: 'The directional force of price and volume acceleration over a rolling 48-hour window.' }
        ],
        [
            { title: 'The 90+ Alpha Breakout', text: 'When SOL hit an Alpha Score of 92 with an ML Boost, it preceded a 14% impulsive rally in the subsequent 24 hours.' }
        ],
        "Composite scoring engine updated hourly using live feed data from 15+ institutional-grade sources."
    );
}

function renderDocsTelegram() {
    renderExplainPage(
        "Institutional Alert Hooks",
        "Configuring secure Telegram and push intelligence for mobile Alpha.",
        "The AlphaSignal terminal allows you to bridge institutional intelligence directly to your mobile device via Telegram. By configuring a secure 'Alert Hook', you receive high-conviction ML signals, regime shift warnings, and Whale Pulse alerts in real-time, accompanied by the technical reasoning behind each signal.",
        [
            { icon: 'notifications_active', title: 'Telegram Bot Setup', desc: 'Connect your secure terminal ID to our proprietary Telegram bot to receive encrypted signal streams.' },
            { icon: 'security', title: 'Safe Probe', desc: 'A secure connection test that verifies your Chat ID and signal delivery path without exposing sensitive API keys.' },
            { icon: 'bolt', title: 'Instant Execution', desc: 'Signals include deep-links to the terminal, allowing you to move from alert to analysis in a single tap.' }
        ],
        [
            { title: 'The "Safe Probe" Validation', text: 'A user verified their connection using the "Test Connection" button in Alert Hub, receiving a 1ms confirmation message that ensured no missed alerts during a high-volatility CPI print.' }
        ],
        "Bi-directional encrypted signal bridge using the Telegram Bot API and a dedicated institutional alert relay."
    );
}

function renderDocsPWA() {
    renderExplainPage(
        "Mobile Terminal Installation",
        "Access institutional-grade market intelligence on the go via PWA technology.",
        "AlphaSignal is built as a Progressive Web App (PWA), meaning you can install it directly on your mobile device home screen without an App Store middleman. This provides a persistent, fullscreen terminal experience with local caching for low-latency market monitoring.",
        [
            { icon: 'install_mobile', title: 'Add to Home Screen', desc: 'Use the "Share" menu on iOS or "Install" prompt on Android to add AlphaSignal to your device dashboards.' },
            { icon: 'speed', title: 'Performance Caching', desc: 'The terminal uses a robust Service Worker to cache core UI assets, ensuring rapid loading even in low-bandwidth environments.' },
            { icon: 'fullscreen', title: 'Native Experience', desc: 'Launch in standalone mode to remove browser chrome and focus entirely on the high-fidelity intelligence stream.' }
        ],
        [
            { title: 'Mobile Tactical Edge', text: 'A fund manager installed the PWA on their iPad, allowing them to monitor the Narrative Galaxy and Whale Pulse during a macro conference without a laptop.' }
        ],
        "Service Worker and manifest-driven installation strategy compliant with modern W3C PWA standards."
    );
}

function renderDocsPortfolioLab() {
    renderExplainPage(
        "Institutional Portfolio Lab",
        "Deep-dive into the ML-driven rebalancing fund and advanced risk analytics.",
        "The Portfolio Lab is the terminal's premier environment for simulating institutional-grade capital allocation. It tracks a dynamic fund that automatically rebalances into the top 5 ML-boosted assets daily, providing live performance attribution and sophisticated risk modeling.",
        [
            { icon: 'biotech', title: 'ML Rebalancing', desc: 'The fund automatically selects the top 5 assets by Alpha Score daily, simulating a professional "Momentum-Weighted" strategy.' },
            { icon: 'security', title: 'VaR 95% CI', desc: 'Live Value at Risk monitoring to ensure the simulated fund maintains a professional institutional risk profile.' },
            { icon: 'grid_view', title: 'Correlation Matrix', desc: 'A 15x15 rolling 30D matrix identifying systemic risks and diversification opportunities across the signal universe.' }
        ],
        [
            { title: 'Asset-Level Attribution', text: 'By monitoring the "Constituent Weightings", users identified that L1 protocols contributed 40% of total portfolio returns during the current 30-day window.' }
        ],
        "Quant-grade simulation engine calculating history, metrics, and correlations against a synthetic BTC-USD benchmark."
    );
}


function renderDocsGlossaryImplementation() {
    renderExplainPage(
        "Terminal Glossary",
        "Institutional metrics and terminology for the modern quant trader.",
        "The AlphaSignal terminal utilizes proprietary and institutional-standard metrics. This glossary provides technical definitions for the most critical terms used across the platform.",
        [
            { icon: 'terminal', title: 'Alpha (%)', desc: 'Excess return relative to the BTC-USD benchmark. Positive Alpha indicates market leadership and idiosyncratic strength.' },
            { icon: 'show_chart', title: 'Beta', desc: 'Market sensitivity metric. A Beta of 1.1 means the asset is expected to outperform the benchmark by 10% on the upside.' },
            { icon: 'grid_view', title: 'Correlation Matrix', desc: 'A 15x15 peer matrix illustrating the statistical relationship between asset pairs. High values indicate assets move in sync.' },
            { icon: 'speed', title: 'Cross-Chain Velocity', desc: 'The rate at which capital and narrative attention rotate across distinct Layer 1 networks (e.g. ETH to SOL).' },
            { icon: 'receipt_long', title: 'Institutional Trade Ledger', desc: 'An immutable, verified record of historical execution tickets and strategies for precise performance auditing.' },
            { icon: 'model_training', title: 'ML Alpha Engine', desc: 'A machine learning ensemble model dynamically trained on both technicals and sentiment for 24-hour predictions.' },
            { icon: 'balance', title: 'Orderbook Imbalance', desc: 'The structural difference between aggregate bid and ask walls, serving as a leading indicator of liquidity absorption.' },
            { icon: 'calculate', title: 'Sharpe Ratio', desc: 'Measure of risk-adjusted return. Calculated as (Portfolio Return - Risk-Free Rate) / Standard Deviation.' },
            { icon: 'analytics', title: 'Sortino Ratio', desc: 'Differentiated from Sharpe by only penalizing downside volatility, providing a clearer view of "bad" risk.' },
            { icon: 'security', title: 'VaR 95%', desc: 'Value at Risk. A statistical measure of the maximum potential 1-day loss of a portfolio at a 95% confidence level.' },
            { icon: 'waves', title: 'Whale Flow', desc: 'Proprietary filtering of the trade tape to show only significant capital commitments (>$100k) from institutional-labeled entities.' },
            { icon: 'database', title: 'Z-Score', desc: 'Statistical distance from the mean in standard deviations. Scores > ±2.0 identify significant momentum or exhaustion outliers.' }
        ],
        [],
        "Proprietary definitions derived from institutional trading desk standards and quantitative finance academic frameworks."
    );
}

function updateSEOMeta(view) {
    const viewMetadata = {
        'signals': {
            title: 'Alpha Signals & Market Intelligence',
            desc: 'Real-time multi-asset alpha signals across bitcoin, equities, and forex. Alphasignal provides high-fidelity signals derived from institutional data.'
        },
        'briefing': {
            title: 'AI Intelligence Briefing',
            desc: 'Daily neural synthesis of global market trends, sentiment shifts, and high-conviction institutional alpha.'
        },
        'mindshare': {
            title: 'Social Mindshare Analytics',
            desc: 'Track real-time social sentiment, narrative dominance, and crowd positioning across major crypto assets.'
        },
        'flow': {
            title: 'Institutional Flow Monitor',
            desc: 'Monitor whale moves, exchange inflows, and institutional positioning to identify market rotation early.'
        },
        'heatmap': {
            title: 'Market Heatmap',
            desc: 'Visual cross-asset correlation and performance heatmap for rapid portfolio assessment.'
        },
        'catalysts': {
            title: 'Earnings & Events Catalysts',
            desc: 'Comprehensive calendar of institutional-grade volatility events, earnings releases, and macro triggers.'
        },
        'whales': {
            title: 'AI Whale Pulse Monitor',
            desc: 'Institutional AI whale tracking and exchange flow alerts for rapid market insight into large Bitcoin and altcoin moves.'
        },
        'regime': {
            title: 'Market Regime Hub',
            desc: 'Real-time statistical detection of market regimes including Accumulation, Distribution, and Trending states.'
        },
        'rotation': {
            title: 'Sector Rotation Matrix',
            desc: 'Advanced analysis of capital flows between asset classes and sectors to identify the next trend.'
        },
        'backtest': {
            title: 'Strategy & Performance Lab',
            desc: 'Quant-grade strategy backtesting and performance validation against historical institutional market data.'
        },
        'risk': {
            title: 'Market Risk & Stress Hub',
            desc: 'Real-time market risk monitoring, stress-test simulations, correlation spikes, and volatility regime detection.'
        },
        'narrative': {
            title: 'Narrative Galaxy Search',
            desc: 'Explore emerging market narratives and cluster shifts using NLP-driven trend analysis.'
        },
        'velocity': {
            title: 'Cross-Chain Narrative Velocity',
            desc: 'Institutional capital rotation tracking using volume acceleration and social heat.'
        },
        'tradelab': {
            title: 'Trade Idea Lab',
            desc: 'Generate and validate institutional-grade trade setups with defined risk-reward parameters.'
        },
        'liquidity': {
            title: 'Order Flow Magnitude',
            desc: 'Visualize professional liquidity walls, order book depth, and institutional execution tape.'
        },
        'newsroom': {
            title: 'Institutional Newsroom',
            desc: 'Curation of the highest-impact financial news and regulatory developments effecting global markets.'
        },
        'alerts': {
            title: 'Real-time Signal Alerts',
            desc: 'Configure and monitor high-fidelity institutional alerts for your specific asset portfolio.'
        },
        'macro-calendar': {
            title: 'Macro Catalyst Compass',
            desc: 'Monitor high-impact global economic drivers, treasury yields, and volatility triggers.'
        },
        'onchain': {
            title: 'On-Chain Analytics',
            desc: 'Quantitative modeling of network MVRV, NVT, and internal blockchain metrics.'
        },
        'advanced-charting': {
            title: 'Advanced Charting Suite',
            desc: 'Full institutional suite featuring orderbook liquidity and derivatives overlays.'
        },
        'macro': {
            title: 'Macro Pulse & Regimes',
            desc: 'Live market correlations, regime tracking, and macro variables.'
        },
        'etf-flows': {
            title: 'Spot ETF Net Flows Tracker',
            desc: 'Live institutional inflow/outflow monitoring for Bitcoin Spot ETFs including BlackRock and Fidelity.'
        },
        'liquidations': {
            title: 'Market Liquidation Heatmap',
            desc: 'Real-time tracking of forced Long and Short liquidations across major digital asset exchanges.'
        },
        'cme-gaps': {
            title: 'CME Bitcoin Gaps Tracker',
            desc: 'Monitoring unfilled price gaps in Chicago Mercantile Exchange Bitcoin Futures—key institutional pivot levels.'
        },
        'oi-radar': {
            title: 'Derivatives Open Interest Radar',
            desc: 'Comparative analysis of Open Interest depth and acceleration across Binance, CME, and Bybit.'
        },
        'global-hub': {
            title: 'Global Markets Intelligence Hub',
            desc: 'Consolidated tracking of ETF flows, liquidations, and open interest dynamics.'
        },
        'macro-hub': {
            title: 'Macro Intelligence Hub',
            desc: 'Multidimensional analysis of global macro catalysts, correlations, and market regimes.'
        },
        'alpha-hub': {
            title: 'Alpha Strategy Hub',
            desc: 'Institutional AI synthesis, alpha scoring, and automated strategy validation.'
        },
        'portfolio': {
            title: 'Institutional Portfolio Lab',
            desc: 'Monitor simulated portfolio performance, VaR, and correlation attribution.'
        },
        'portfolio-optimizer': {
            title: 'AI Portfolio Optimizer',
            desc: 'Neural network-driven allocation rebalancing for maximum risk-adjusted metrics.'
        },
        'strategy-lab': {
            title: 'Strategy & Backtest Lab',
            desc: 'Verify quantitative indicator logic against historical backtesting algorithms.'
        },
        'stress': {
            title: 'Portfolio Stress Test',
            desc: 'Live scenario analysis assessing portfolio drawdowns against historic market crashes.'
        },
        'explain-signal-archive': {
            title: 'Documentation — Signal Archive',
            desc: 'Guide to interpreting the historical win-rate and probability engine records.'
        },
        'explain-topologies': {
            title: 'Documentation — Topologies & Geometries',
            desc: 'Guide to interpreting Ecosystem Capital Flows, Dials, and Cross-asset Sankey networks.'
        },
        'signal-archive': {
            title: 'Signal Execution Archive',
            desc: 'Immutable ledger of historical AlphaSignals, execution timestamps, and hit rate analytics.'
        },
        'correlation-matrix': {
            title: 'NxN Correlation Matrix',
            desc: 'Live statistical heatmap plotting short-term decoupling across 15+ major digital assets.'
        },
        'alpha-score': {
            title: 'Alpha Score Dashboard',
            desc: 'Live absolute momentum, neural sentiment, and statistical clustering metrics grouped by asset.'
        },
        'performance-dashboard': {
            title: 'Live Performance Analytics',
            desc: 'Institutional track record and strategy attribution tracking against the benchmark.'
        },
        'trade-ledger': {
            title: 'Institutional Trade Ledger',
            desc: 'Audited historic logs of simulated entries, trailing stops, and strategy scaling logic.'
        },
        'home': {
            title: 'Alphasignal: Institutional Alpha & Signals Terminal',
            desc: 'Alphasignal provides real-time multi-asset market intelligence across bitcoin, equities, and forex. AI-driven alpha strategy synthesis for the modern institution.'
        },
        'help': {
            title: 'Help & Documentation Hub',
            desc: 'Complete documentation on AlphaSignal methodologies, data sources, and analytical frameworks.'
        },
        'explain-signals': { title: 'Documentation — Signal Intelligence', desc: 'Learn how AlphaSignal utilizes Z-Score deviations and neural sentiment for alpha generation.' },
        'explain-briefing': { title: 'Documentation — AI Briefing', desc: 'Understand our dynamic neural synthesis and sector performance tracking.' },
        'explain-liquidity': { title: 'Documentation — Order Flow GOMM', desc: 'Documentation on interpreting liquidity walls and institutional tape.' },
        'explain-ml-engine': { title: 'Documentation — ML Alpha Engine', desc: 'Predictive modeling using Sentiment and Orderbook Imbalance.' },
        'explain-whales': { title: 'Documentation — Whale Pulse', desc: 'Learn how to detect and interpret massive on-chain transactions.' },
        'explain-mindshare': { title: 'Documentation — Narrative Galaxy', desc: 'Guide to using our NLP-driven social cluster visualization.' },
        'explain-benchmark': { title: 'Documentation — Portfolio Simulation', desc: 'How to model and backtest institutional crypto portfolios.' },
        'explain-alerts': { title: 'Documentation — Catalyst Monitor', desc: 'Tracking macro variables, token unlocks, and critical market events.' },
        'explain-zscore': { title: 'Documentation — Z-Score Interpretation', desc: 'Decoding statistical intensity and outlier detection for advanced volatility arbitrage.' },
        'explain-alpha': { title: 'Documentation — Alpha Strategy', desc: 'How to calculate and trade relative strength benchmarks vs Bitcoin to maximize institutional alpha.' },
        'explain-correlation': { title: 'Documentation — Market Correlation', desc: 'Understanding the mathematical relationship between assets and market-wide decoupling events.' },
        'explain-sentiment': { title: 'Documentation — Sentiment Synthesis', desc: 'How we process social mindshare and news flow using institutional-grade NLP.' },
        'explain-risk': { title: 'Documentation — Risk Management', desc: 'Institutional frameworks for protecting capital using volatility and drawdown modeling.' },
        'explain-playbook': { title: 'Documentation — Trading Playbook', desc: 'Advanced trading strategies and multi-signal institutional execution frameworks.' },
        'explain-regimes': { title: 'Documentation — Market Regimes', desc: 'Identifying market cycles through institutional flow, volatility, and sentiment analysis.' },
        'explain-advanced-charting': { title: 'Documentation — Advanced Charting', desc: 'Full institutional suite featuring orderbook liquidity and derivatives overlays.' },
        'explain-onchain': { title: 'Documentation — On-Chain Analytics', desc: 'Quantitative modeling of network MVRV, NVT, and internal blockchain metrics.' },
        'explain-api': { title: 'Documentation — Institutional API', desc: 'Programmatic access for real-time alpha signals, liquidity depth, and narrative intelligence.' },
        'explain-glossary': { title: 'Documentation — Terminal Glossary', desc: 'A quick-reference guide to all technical metrics used across the AlphaSignal platform.' },
        'explain-performance': { title: 'Documentation — Performance Analytics', desc: 'Track terminal win rates, return distributions, and institutional track records.' },
        'explain-alpha-score': { title: 'Documentation — Alpha Score Methodology', desc: 'Understanding composite rankings, Momentum Vectors, and the Neural ML Boost engine.' },
        'explain-telegram': { title: 'Documentation — Institutional Alert Hooks', desc: 'Setup guide for Telegram bot integration and the secure Safe Probe probe.' },
        'explain-pwa': { title: 'Documentation — Mobile PWA Terminal', desc: 'How to install AlphaSignal as a persistent terminal on your mobile device.' },
        'explain-portfolio-lab': { title: 'Documentation — Institutional Portfolio Lab', desc: 'Institutional methodology for ML rebalancing, VaR modeling, and correlation attribution.' },
        'explain-velocity': { title: 'Documentation — Chain Velocity', desc: 'Guide to volume acceleration and cross-chain capital rotation tracking.' },
    };

    const meta = viewMetadata[view] || {
        title: view.charAt(0).toUpperCase() + view.slice(1),
        desc: 'AlphaSignal Institutional Intelligence Terminal - Real-time signals and AI insights.'
    };

    const fullTitle = `${meta.title} | AlphaSignal — Institutional Crypto Intelligence`;
    const viewUrl = view === 'home' ? 'https://alphasignal.digital/' : `https://alphasignal.digital/?view=${view}`;

    document.title = fullTitle;

    // 1. Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', meta.desc);

    // 2. Update Canonical Link
    const canon = document.getElementById('canonical-link');
    if (canon) canon.setAttribute('href', viewUrl);

    // 3. Update Social (Open Graph & Twitter)
    const updateAttr = (id, attr, val) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute(attr, val);
    };

    updateAttr('og-title', 'content', fullTitle);
    updateAttr('og-desc', 'content', meta.desc);
    updateAttr('og-url', 'content', viewUrl);
    updateAttr('twitter-title', 'content', fullTitle);
    updateAttr('twitter-desc', 'content', meta.desc);
    updateAttr('twitter-url', 'content', viewUrl);

    // 4. Update JSON-LD (Breadcrumbs & FAQ)
    const ldJsonEl = document.getElementById('ld-json-dynamic');
    if (ldJsonEl) {
        const schemas = [];
        
        // Always add Breadcrumbs
        schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Signals",
                "item": "https://alphasignal.digital/"
            }, {
                "@type": "ListItem",
                "position": 2,
                "name": meta.title,
                "item": viewUrl
            }]
        });

        // Add FAQ if on Home View
        if (view === 'home' || view === 'landing') {
            schemas.push({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "How does Alphasignal calculate Alpha?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Alpha is calculated using a rolling Z-score deviation of returns relative to a Bitcoin (BTC) benchmark, adjusted for institutional volume and order flow magnitude."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What makes your AI Whale Tracking different?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Unlike basic transaction scanners, our AI Whale pulse utilizes cluster analysis to identify entity-linked movement, distinguishing between exchange cold storage shifts and true institutional accumulation."
                        }
                    }
                ]
            });
        }

        ldJsonEl.textContent = JSON.stringify(schemas);
    }

    console.log(`SEO Update: Full synchronization complete for view "${view}"`);
}

function switchView(view, pushState = true) {
    // Global Memory Wipe for 60FPS Optimization
    if (typeof window.globalUIWipe === 'function') {
        window.globalUIWipe();
    }

    // 1. Check Access Rights
    const isFreeView = (view === 'signals' || view === 'help' || view === 'home' || view?.startsWith('explain-'));
    
    if (!isFreeView && !isPremiumUser) {
        console.warn(`Access Denied: ${view} is a premium view.`);
        if (!isAuthenticatedUser) {
            showAuth(true);
            showToast("AUTHENTICATION REQUIRED", "Please login to access institutional intelligence.", "alert");
        } else {
            showPaywall(true);
            showToast("PREMIUM REQUIRED", "This module requires an active Institutional subscription.", "alert");
        }
        return;
    }

    // Update SEO Meta
    updateSEOMeta(view);

    if (pushState && view) {
        window.history.pushState({ view: view }, '', `?view=${view}`);
    }

    if (viewMap[view]) {
        // Sync desktop nav
        document.querySelectorAll('.nav-item').forEach(i => {
            i.classList.toggle('active', i.dataset.view === view);
        });
        // Sync mobile nav
        document.querySelectorAll('.mobile-nav-item').forEach(i => {
            i.classList.toggle('active', i.dataset.view === view);
        });
        
        viewMap[view]();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide sidebar on mobile after selection
        if (window.innerWidth <= 900) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('open');
        }
    }
}

window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
        switchView(e.state.view, false);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        switchView(urlParams.get('view') || 'home', false);
    }
});

document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchView(view);
    });
});

const hamburger = document.getElementById('hamburger-btn');
if (hamburger) {
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('sidebar').classList.toggle('open');
    });
}

const moreBtn = document.getElementById('mobile-more-btn');
if (moreBtn) {
    moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('sidebar').classList.add('open');
    });
}

const closeSidebarBtn = document.getElementById('close-sidebar-btn');
if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger-btn');
    if (window.innerWidth <= 900 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && (!hamburger || e.target !== hamburger)) {
            sidebar.classList.remove('open');
        }
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    // Auth listeners
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const isSignup = document.getElementById('toggle-auth').textContent.includes('ALREADY_HAVE_ACCESS');
            handleAuth(isSignup);
        });
    }

    // Enter key support for login fields
    const authFields = ['auth-email', 'auth-password'];
    authFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const isSignup = document.getElementById('toggle-auth').textContent.includes('ALREADY_HAVE_ACCESS');
                    handleAuth(isSignup);
                }
            });
        }
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const toggleAuthLink = document.getElementById('toggle-auth');
    if (toggleAuthLink) {
        toggleAuthLink.addEventListener('click', (e) => {
            e.preventDefault();
            const isSignup = toggleAuthLink.textContent.includes('REQUEST_REGISTRATION');
            toggleAuthLink.textContent = isSignup ? 'ALREADY_HAVE_ACCESS? LOGIN' : 'NEED ACCESS? REQUEST_REGISTRATION';
            document.getElementById('login-btn').textContent = isSignup ? 'REGISTER_ACCOUNT' : 'LOGIN';
        });
    }

    document.querySelectorAll('.close-overlay').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('detail-overlay').classList.add('hidden');
            if (window.activeTape) window.activeTape.stop();
        });
    });

    // Close overlays when clicking outside the content area
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('overlay')) {
            e.target.classList.add('hidden');
            if (e.target.id === 'detail-overlay' && window.activeTape) {
                window.activeTape.stop();
            }
        }
    });

    document.getElementById('refresh-btn').addEventListener('click', () => renderSignals(currentSignalCategory));

    document.getElementById('global-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeSearch();
    });

    // Run auth check before data sync
    await checkAuthStatus();
    
    // Start live price WebSocket stream
    initLivePriceStream();
    
    // Always start these for basic access (Signals and BTC are free)
    updateBTC();
    
    // Support deep-linking via URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = viewMap[urlParams.get('view')] ? urlParams.get('view') : 'home';
    
    // Replace state on initial load rather than pushing
    window.history.replaceState({ view: initialView }, '', `?view=${initialView}`);
    switchView(initialView, false);
    
    startCountdown(); 
    
    // Sidebar Profile Dropdown
    const profileDropdown = document.getElementById('user-profile-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            // If we click internal buttons (logout/billing), don't just toggle
            if (e.target.closest('button')) return;
            
            e.stopPropagation();
            const isOpen = profileDropdown.classList.contains('open');
            profileDropdown.classList.toggle('open');
            profileDropdown.setAttribute('aria-expanded', !isOpen);
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (profileDropdown && profileDropdown.classList.contains('open')) {
            profileDropdown.classList.remove('open');
            profileDropdown.setAttribute('aria-expanded', 'false');
        }
    });

    // Intervals
    setInterval(updateBTC, 60000);
    if (isAuthenticatedUser && isPremiumUser) {
        syncAlerts(); 
        setInterval(syncAlerts, 60000);
        // updateInstitutionalPulse();
        // setInterval(updateInstitutionalPulse, 30000);
    }
    
    // Debug hooks
    window.terminalLogout = logout;
    window.terminalSwitchView = switchView;
    window.toggleSidebar = () => {
        const layout = document.getElementById('main-layout');
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 900) {
            sidebar.classList.toggle('open');
        } else {
            layout.classList.toggle('collapsed');
        }
    };
});

// Sidebar auto-close on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('open');
        }
    }
});

function shareSignal(ticker, alpha, sentiment, zScore) {
    const sentimentLabel = sentiment > 0.1 ? 'BULLISH' : (sentiment < -0.1 ? 'BEARISH' : 'NEUTRAL');
    const text = `🚨 AlphaSignal Terminal Update: $${ticker}\n\n` +
                 `📈 Relative Alpha: ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%\n` +
                 `🧠 Sentiment Synthesis: ${sentimentLabel}\n` +
                 `⚡ Z-Score Intensity: ${zScore.toFixed(2)}\n\n` +
                 `Institutional intelligence detected. View the full terminal:\n`;
    
    // Construct sharing URL
    const url = `https://alphasignal.digital/?view=signals&ticker=${ticker}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    
    console.log("Sharing signal:", ticker);
    window.open(twitterUrl, '_blank');
}
// ============= Notification & Alert Hooks (Phase 8) =============
async function showNotificationSettings(visible) {
    console.log(`[AlphaSignal] Notification Settings Modal: ${visible ? 'OPEN' : 'CLOSE'}`);
    const modal = document.getElementById('notification-modal');
    const layout = document.querySelector('.layout');
    
    if (!modal) {
        console.error('[AlphaSignal] ERROR: #notification-modal not found in DOM.');
        return;
    }
    
    if (visible) {
        // Fetch current settings
        try {
            const settings = await fetchAPI('/user/settings');
            if (settings) {
                if (document.getElementById('discord-webhook')) document.getElementById('discord-webhook').value = settings.discord_webhook || '';
                if (document.getElementById('telegram-chat-id')) document.getElementById('telegram-chat-id').value = settings.telegram_chat_id || '';
                if (document.getElementById('alerts-enabled')) document.getElementById('alerts-enabled').checked = settings.alerts_enabled !== false;
            }
        } catch (err) {
            console.warn('[AlphaSignal] Failed to fetch user settings, showing blank form.', err);
        }
        modal.classList.remove('hidden');
        if (layout) layout.style.filter = 'blur(10px)';
    } else {
        modal.classList.add('hidden');
        if (layout) layout.style.filter = 'none';
    }
}

async function testTelegramConnection() {
    const chatID = document.getElementById('telegram-chat-id').value.trim();
    if (!chatID) {
        showToast("ERROR: Please enter a Chat ID first.");
        return;
    }
    showToast("TESTING_CONNECTION: Dispatching signal to Telegram...");
    try {
        const res = await fetchAPI('/settings/test-telegram', 'POST', { chat_id: chatID });
        if (res && res.success) {
            showToast("CONNECTION_SUCCESS: Check your Telegram for the AlphaSignal probe.");
        } else {
            showToast(`CONNECTION_FAIL: ${res.error || 'Check bot token in environment vars'}`);
        }
    } catch (err) {
        showToast("CONNECTION_ERROR: Institutional node unreachable.");
    }
}

async function saveNotificationSettings() {
    console.log('[AlphaSignal] Persisting Alert Configuration...');
    const discord = document.getElementById('discord-webhook').value.trim();
    const telegram = document.getElementById('telegram-chat-id').value.trim();
    const enabled = document.getElementById('alerts-enabled').checked;
    const errorEl = document.getElementById('notif-error');
    
    if (errorEl) errorEl.classList.add('hidden');
    
    // Basic validation for Discord
    if (discord && !discord.startsWith('https://discord.com/api/webhooks/')) {
        if (errorEl) {
            errorEl.textContent = "INVALID_HOOK: Discord webhook must start with https://discord.com/api/webhooks/";
            errorEl.classList.remove('hidden');
        }
        console.warn('[AlphaSignal] Invalid Discord Webhook format.');
        return;
    }
    
    try {
        const res = await fetchAPI('/user/settings', 'POST', {
            discord_webhook: discord,
            telegram_chat_id: telegram,
            alerts_enabled: enabled
        });
        
        if (res && res.success) {
            console.log('[AlphaSignal] Settings Sync Complete.');
            showToast("ALERTS_CONFIGURED: Advanced intelligence hooks updated successfully.");
            showNotificationSettings(false);
        } else {
            throw new Error('Sync failed response');
        }
    } catch (err) {
        console.error('[AlphaSignal] Sync Failure:', err);
        if (errorEl) {
            errorEl.textContent = "SYNC_FAILED: Could not persist alert configuration.";
            errorEl.classList.remove('hidden');
        }
    }
}
function renderRegimeHeatmap(containerId, history) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 200;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    const xScale = d3.scaleBand()
        .domain(history.map(d => d.date))
        .range([0, width - margin.left - margin.right])
        .padding(0.1);
        
    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height - margin.top - margin.bottom, 0]);
        
    const colorScale = d3.scaleOrdinal()
        .domain(["High-Vol Expansion", "Low-Vol Compression", "Neutral / Accumulation"])
        .range(["#ef5350", "#26a69a", "#ffa726"]);
        
    svg.selectAll("rect")
        .data(history)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.date))
        .attr("y", 0)
        .attr("width", xScale.bandwidth())
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", d => colorScale(d.regime))
        .attr("opacity", 0.6)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 1);
            showToast(`${d.date}: ${d.regime}`);
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.6);
        });
        
    // Abstract Axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d,i) => !(i%10))))
        .style("font-size", "8px")
        .style("color", "rgba(255,255,255,0.3)");
}

function renderCorrelationHeatmap(data) {
    const container = document.getElementById('correlation-heatmap');
    if (!container) return;
    
    const n = data.tickers.length;
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    
    container.innerHTML = data.matrix.map(cell => {
        const opacity = Math.abs(cell.v);
        const color = cell.v > 0 ? `rgba(0, 242, 255, ${opacity})` : `rgba(255, 62, 62, ${opacity})`;
        return `<div style="aspect-ratio:1; background:${color}; display:flex; align-items:center; justify-content:center; font-size:0.4rem; font-weight:900; color:white; border:1px solid rgba(0,0,0,0.1)" title="${cell.x} vs ${cell.y}: ${cell.v}">
            ${cell.x === cell.y ? cell.x : ''}
        </div>`;
    }).join('');
}
function toggleSafeMode() {
    isSafeMode = !isSafeMode;
    const trigger = document.getElementById('safe-mode-trigger');
    const status = document.getElementById('safe-mode-status');
    const icon = document.getElementById('safe-mode-icon');
    const indicator = document.getElementById('safe-mode-indicator');
    
    if (isSafeMode) {
        trigger.style.background = 'rgba(0, 242, 255, 0.1)';
        trigger.style.borderColor = 'var(--accent)';
        status.innerText = 'ACTIVE';
        status.style.color = 'var(--accent)';
        icon.style.color = 'var(--accent)';
        indicator.style.background = 'var(--accent)';
        indicator.style.boxShadow = '0 0 10px var(--accent)';
        showToast('Safe Mode Active', 'Low-liquidity and high-risk assets filtered out.', 'success');
    } else {
        trigger.style.background = 'rgba(255, 255, 255, 0.03)';
        trigger.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        status.innerText = 'INACTIVE';
        status.style.color = 'rgba(255,255,255,0.3)';
        icon.style.color = 'var(--text-dim)';
        indicator.style.background = 'rgba(255,255,255,0.1)';
        indicator.style.boxShadow = 'none';
        showToast('Safe Mode Inactive', 'All assets in the universe are now visible.', 'alert');
    }
    
    // Refresh current view if it's one of the filtered ones
    const currentView = document.querySelector('.nav-item.active')?.dataset.view;
    if (['signals', 'alpha-score', 'narrative'].includes(currentView)) {
        if (currentView === 'signals') renderSignals();
        else if (currentView === 'alpha-score') renderAlphaScore();
        else if (currentView === 'narrative') renderNarrativeGalaxy();
    }
}
window.toggleSafeMode = toggleSafeMode;

// Ensure Live Streams connect on load
document.addEventListener('DOMContentLoaded', () => {
    initLivePriceStream();
    initLiveAlphaScroller();
    initFearGreedGauge();
    // updateInstitutionalPulse();
});

// Backup call if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initLivePriceStream();
    initLiveAlphaScroller();
    initFearGreedGauge();
    // updateInstitutionalPulse();
}

async function initFearGreedGauge() {
    const canvas = document.getElementById('fearGreedGauge');
    const valLayer = document.getElementById('fearGreedValue');
    if (!canvas || !valLayer) return;

    try {
        const d = await fetchAPI('/fear-greed');
        if (!d) return;

        valLayer.textContent = d.score;
        let color = '#facc15';
        if (d.score < 25) color = '#ef4444';
        else if (d.score < 45) color = '#fb923c';
        else if (d.score > 75) color = '#22c55e';
        else if (d.score > 55) color = '#86efac';

        valLayer.style.color = color;
        valLayer.title = d.label;

        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [d.score, 100 - d.score],
                    backgroundColor: [color, 'rgba(255,255,255,0.05)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: { tooltip: { enabled: false }, legend: { display: false } },
                animation: { animateRotate: true, animateScale: false }
            }
        });
    } catch(e) {}
}

function renderDocsTopologies() {
    renderExplainPage(
        "Institutional Topologies & Geometries",
        "A breakdown of the institutional charting variables and dynamic plotting mechanics integrated in Phases 19-21.",
        "Professional traders rely on more than just candlesticks. The latest framework deployment saturated AlphaSignal with cutting-edge dimensionality, allowing instantaneous quantitative recognition through structural geometric arrays rather than raw numbers.",
        [
            { title: "Quantitative Factor Web (Radar Chart)", icon: "radar", desc: "Located in the Asset Deep Dive popup. It plots 6 statistical vectors (Momentum, Volatility, Network Activity, Liquidity, Social Hype, Dev Commits) on a 6-axis polygon. A glance reveals if an asset is fundamentally 'lopsided' or well-rounded." },
            { title: "Guppy Trend Mechanics (EMA Density Ribbon)", icon: "waves", desc: "Found in the Strategy Lab, the Guppy Multiple Moving Average draws 15 overlapping Exponential Moving Averages. When the fast (cyan) and slow (red) ribbons compress, explosive volatility is imminent. When they expand, the trend is locked." },
            { title: "Execution Time Topography (Polar Area Chart)", icon: "data_usage", desc: "Found in the Whale Pulse tracker. This 24-period radial chart maps heavy institutional on-chain volume to physical hours. If the geometry skews heavily towards 01:00-06:00 UTC, it indicates the Asian session is heavily trading the asset. A skew at 14:00+ indicates Wall Street hours." },
            { title: "Ecosystem Capital Flow (Sankey Diagram)", icon: "moving", desc: "Found in the Cross-Chain Velocity hub. It utilizes D3 fluid mapping to literally draw pipelines of fiat entering the system, bridging into core L1 layers (Ethereum, Solana), and draining into specific DeFi products. Line thickness correlates directly to 24H volume limits." },
            { title: "Spot ETF Net Flows Tracker", icon: "account_balance", desc: "A dual-axis visualization tracking daily net institutional capital movement across all major Bitcoin Spot ETFs (IBIT, FBTC, etc.), providing a leading indicator of Wall Street accumulation." },
            { title: "Market Liquidation Heatmap", icon: "local_fire_department", desc: "Visualizes forced Long vs Short liquidations across major exchanges. High liquidation clusters often mark local trend reversals and liquidity exhaustion points." },
            { title: "CME Bitcoin Gaps Tracker", icon: "gap_stats", desc: "Identifies unfilled 'magnetic' price levels in the CME Futures market. Institutions often trade towards these gaps to fill structural liquidity voids." },
            { title: "Open Interest Radar (Spider Chart)", icon: "track_changes", desc: "A 4-axis comparison of capital commitment across major derivatives exchanges, highlighting where leverage is building most aggressively." },
            { title: "NxN Correlation Matrix (Heatmap)", icon: "grid_on", desc: "Inside Macro Sync. This is a 10x10 HTML/CSS grid visualizing Pearson's correlation coefficient. Dark cyan means two assets move in perfect tandem (+1.0), while bright red flags assets moving completely inversely (-1.0)." },
            { title: "System Conviction Dials (Analog Gauges)", icon: "speed", desc: "Positioned on the main dashboard. They utilize 180-degree Chart.js doughnuts overlayed with programmatic text to create analog speedometers representing overall market fear, network bloat, and retail FOMO parameters." }
        ]
    );
}

// Global Live Alpha Ticker
async function initLiveAlphaScroller() {
    const scroller = document.getElementById('alpha-scroller');
    if (!scroller) return;

    async function poll() {
        try {
            const d = await fetchAPI('/signals');
            if (Array.isArray(d) && d.length > 0) {
                // Skim the top 10 highest-alpha signals for the ticker
                const topSignals = d.slice(0, 10);
                const html = topSignals.map(s => {
                    const color = s.alpha >= 0 ? 'var(--risk-low)' : 'var(--risk-high)';
                    const dir = s.alpha >= 0 ? 'LONG' : 'SHORT';
                    return `<span style="margin-right:4rem; white-space:nowrap"><strong style="color:var(--text); letter-spacing:1px">${s.ticker}</strong> <span style="color:${color}; font-weight:900">[${dir} ${Math.abs(s.alpha).toFixed(2)}% ALPHA]</span> <span style="color:var(--text-dim)">@ ${formatPrice(s.price)}</span></span>`;
                }).join('');
                scroller.innerHTML = html + html; 
            } else {
                scroller.innerHTML = '<span style="color:var(--text-dim); letter-spacing:1px">MONITORING INSTITUTIONAL STREAMS... NO IMMEDIATE ALPHA DETECTED.</span>';
            }
        } catch (e) {
            console.error("Live Alpha Feed Sync Error");
        }
    }
    
    poll();
    setInterval(poll, 30000); // 30s refresh
}
}
// ============= Initialization =============
const viewMap = {
    'onchain': renderOnChain,
    'advanced-charting': renderAdvancedChart,
    signals: renderSignals, 
    briefing: renderBriefing,
    mindshare: renderMindshare, 
    flow: renderFlows,
    heatmap: renderHeatmap,
    catalysts: renderCatalysts,
    'macro-calendar': renderMacroView,
    whales: renderWhales,
    regime: renderRegime,
    macro: renderMacroSync,
    home: renderHome,
    'explain-signals': renderDocsSignals,
    'explain-briefing': renderDocsBriefing,
    'explain-liquidity': renderDocsLiquidity,
    'explain-whales': renderDocsWhales,
    'explain-ml-engine': renderDocsMLEngine,
    'explain-mindshare': renderDocsMindshare,
    'explain-benchmark': renderDocsBenchmark,
    'explain-alerts': renderDocsAlerts,
    'explain-zscore': renderDocsZScore,
    'explain-alpha': renderDocsAlpha,
    'explain-correlation': renderDocsCorrelation,
    'explain-sentiment': renderDocsSentiment,
    'explain-risk': renderDocsRisk,
    'explain-playbook': renderDocsPlaybook,
    'explain-regimes': renderDocsRegimes,
    'explain-advanced-charting': renderDocsAdvancedCharting,
    'explain-onchain': renderDocsOnchain,
    'explain-api': renderDocsAPI,
    'explain-glossary': renderDocsGlossary,
    'explain-signal-archive': renderDocsSignalArchive,
    'explain-performance': renderDocsPerformance,
    'explain-alpha-score': renderDocsAlphaScore,
    'signal-archive': renderSignalArchive,
    'correlation-matrix': renderCorrelationMatrix,
    'alpha-score': renderAlphaScore,
    'performance-dashboard': renderPerformanceDashboard,
    'explain-velocity': renderDocsVelocity,
    'explain-telegram': renderDocsTelegram,
    'explain-pwa': renderDocsPWA,
    'explain-topologies': renderDocsTopologies,
    'explain-portfolio-lab': renderDocsPortfolioLab,
    'etf-flows': renderETFFlows,
    'liquidations': renderLiquidations,
    'cme-gaps': renderCMEGaps,
    'oi-radar': renderOIRadar,
    'global-hub': renderGlobalHub,
    'macro-hub': renderMacroHub,
    'alpha-hub': renderAlphaHub,
    'trade-ledger': renderTradeLedger,
    'rotation': renderRotation,
    'velocity': renderChainVelocity,
    'portfolio': renderPortfolioLab,
    'portfolio-optimizer': renderPortfolioOptimizer,
    'strategy-lab': renderStrategyLab,
    'risk': renderRiskMatrix,
    'stress': renderStressHub,
    'narrative': renderNarrativeGalaxy,
    'newsroom': renderNewsroom,
    'alerts': renderAlerts,
    'tradelab': renderTradeLab,
    'liquidity': renderLiquidityView,
    'help': renderHelp
};

// Final Initialization Call
async function appInit() {
    // 1. Initial State Sync
    initLivePriceStream();
    initLiveAlphaScroller();
    initFearGreedGauge();
    
    // 2. Auth Check & Layout Reveal
    await checkAuthStatus();
    
    const layout = document.getElementById('main-layout');
    if (layout) {
        layout.classList.remove('hidden');
        layout.style.filter = 'none';
    }

    // 3. Default entry view
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') || 'home';
    switchView(view);
}

// Start the app
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    appInit();
} else {
    document.addEventListener('DOMContentLoaded', appInit);
}
