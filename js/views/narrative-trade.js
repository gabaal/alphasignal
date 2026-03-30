async function renderNarrativeGalaxy(filterChain = 'ALL', tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI(`/narrative-clusters?chain=${filterChain}&v=${Date.now()}`);
    if (!data || !data.clusters) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end">
            <div>
                ${renderHubTabs('narrative', tabs)}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">NLP</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-narrative')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
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

        <!-- Live Cluster Intelligence Panel -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem">
            <!-- Cluster Rankings -->
            <div class="glass-card" style="padding:1.5rem">
                <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:1rem">NARRATIVE CLUSTER RANKINGS</div>
                ${(() => {
                    // Group clusters by category, count signals
                    const counts = {};
                    (data.clusters || []).forEach(c => {
                        counts[c.category] = (counts[c.category] || 0) + (c.size || 1);
                    });
                    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
                    const max = sorted[0]?.[1] || 1;
                    return sorted.map(([cat, count], i) => {
                        const anchor = data.anchors?.[cat] || {};
                        const color  = anchor.color || '#00d4aa';
                        const pct    = Math.round(count / max * 100);
                        const medal  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
                        return `<div style="margin-bottom:12px">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                                <span style="font-size:0.65rem;font-weight:800;color:${color}">${medal} ${cat}</span>
                                <span style="font-size:0.6rem;color:var(--text-dim)">${count} signal${count !== 1 ? 's' : ''}</span>
                            </div>
                            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px">
                                <div style="height:4px;background:${color};border-radius:2px;width:${pct}%;transition:width 1s ease"></div>
                            </div>
                        </div>`;
                    }).join('') || '<p style="color:var(--text-dim);font-size:0.75rem">No cluster data yet</p>';
                })()}
            </div>

            <!-- Top Tickers per Cluster -->
            <div class="glass-card" style="padding:1.5rem">
                <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:1rem">TOP TICKERS BY CLUSTER</div>
                ${(() => {
                    const byCluster = {};
                    (data.clusters || []).forEach(c => {
                        if (!byCluster[c.category]) byCluster[c.category] = [];
                        byCluster[c.category].push({ ticker: c.ticker, size: c.size || 1, sentiment: c.sentiment || 0 });
                    });
                    return Object.entries(byCluster).slice(0, 5).map(([cat, tickers]) => {
                        const anchor = data.anchors?.[cat] || {};
                        const color  = anchor.color || '#00d4aa';
                        const top = tickers.sort((a,b) => b.size - a.size).slice(0, 4);
                        return `<div style="margin-bottom:14px">
                            <div style="font-size:0.6rem;font-weight:800;color:${color};margin-bottom:6px;letter-spacing:1px">${cat}</div>
                            <div style="display:flex;gap:6px;flex-wrap:wrap">
                                ${top.map(t => `
                                    <span style="font-size:0.6rem;padding:3px 8px;border-radius:8px;background:${color}18;color:${color};border:1px solid ${color}33;font-weight:700;cursor:pointer" onclick="openDetail('${t.ticker}','NARRATIVE')">${t.ticker.replace('-USD','')}</span>
                                `).join('')}
                            </div>
                        </div>`;
                    }).join('') || '<p style="color:var(--text-dim);font-size:0.75rem">Loading cluster data...</p>';
                })()}
            </div>
        </div>

        <!-- Sentiment Velocity Heatmap -->
        ${data.clusters && data.clusters.length ? `
        <div class="glass-card" style="padding:1.5rem;margin-top:1.5rem">
            <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:1rem">NARRATIVE SENTIMENT VELOCITY — TOP 20 SIGNALS</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
                ${(data.clusters || []).sort((a,b) => Math.abs(b.sentiment||0) - Math.abs(a.sentiment||0)).slice(0,20).map(c => {
                    const sent = c.sentiment || 0;
                    const isPos = sent >= 0;
                    const color = isPos ? '#22c55e' : '#ef4444';
                    const bg    = isPos ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
                    const bar   = Math.min(Math.abs(sent) * 100, 100);
                    const anchor = data.anchors?.[c.category] || {};
                    return `<div style="background:${bg};border:1px solid ${color}22;border-radius:8px;padding:10px">
                        <div style="font-size:0.65rem;font-weight:800;color:white;margin-bottom:2px">${(c.ticker||'—').replace('-USD','')}</div>
                        <div style="font-size:0.5rem;color:var(--text-dim);margin-bottom:6px">${c.category || ''}</div>
                        <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-bottom:4px">
                            <div style="height:3px;background:${color};border-radius:2px;width:${bar}%"></div>
                        </div>
                        <div style="font-size:0.6rem;color:${color};font-weight:700">${isPos ? '+' : ''}${(sent*100).toFixed(1)}%</div>
                    </div>`;
                }).join('')}
            </div>
        </div>` : ''}
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
    if (!tabs) tabs = macroHubTabs;
    appEl.innerHTML = skeleton(2);
    try {
        const data = await fetchAPI('/briefing');
        if (!data || data.error) {
            appEl.innerHTML = `<div class="empty-state">Briefing error: ${data?.error || 'Intelligence engine offline'}</div>`;
            return;
        }

        appEl.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">AI</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                <p>AI-powered narrative synthesis across Mindshare, Flow, and Technical data streams.</p>
            </div>
            ${tabs ? renderHubTabs('briefing', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Daily Market Intelligence Briefing</h2>
            
            <div class="briefing-container" style="max-width:900px; margin:0 auto">


                <!-- AI Daily Memo -->
                <div class="glass-card" id="ai-memo-card" style="margin-bottom:2rem;padding:1.5rem;border:1px solid rgba(188,19,254,0.3);background:linear-gradient(135deg,rgba(188,19,254,0.06),rgba(0,0,0,0.4))">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                        <div style="display:flex;align-items:center;gap:10px">
                            <span class="material-symbols-outlined" style="color:#bc13fe">smart_toy</span>
                            <span style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:#bc13fe">AI INSTITUTIONAL MEMO</span>
                        </div>
                        <button onclick="refreshAIMemo()" style="background:none;border:1px solid rgba(188,19,254,0.3);color:#bc13fe;padding:4px 10px;border-radius:6px;font-size:0.6rem;cursor:pointer;letter-spacing:1px">REFRESH</button>
                    </div>
                    <div id="ai-memo-body" style="font-size:0.9rem;line-height:1.7;color:var(--text);min-height:60px">
                        <div style="display:flex;align-items:center;gap:8px;color:var(--text-dim);font-size:0.85rem">
                            <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:18px">sync</span>Generating institutional memo...
                        </div>
                    </div>
                    <div id="ai-memo-meta" style="font-size:0.62rem;color:var(--text-dim);margin-top:10px;text-align:right"></div>
                </div>
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

        // Load AI Memo async
        loadAIMemo();

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
    if (!tabs) tabs = institutionalHubTabs;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                ${renderHubTabs('tradelab', tabs)}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Trade Intelligence Lab</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Institutional Hub <span class="premium-badge">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-tradelab')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
           
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
    if (!tabs) tabs = auditHubTabs;
    appEl.innerHTML = skeleton();
    try {
        const res = await fetchAPI('/trade-ledger');
        if (!res || res.error) {
            appEl.innerHTML = `
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">assignment</span>Audit & Performance <span class="premium-badge">AUDIT</span></h1>
                </div>
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Institutional Trade Ledger</h2>
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

async function renderLiquidityView(tabs = null) {
    // Standard hub tab setup - 4 sub-views as tabs
    const gommTabs = [
        { id: 'walls',        label: 'DEPTH WALLS',       view: 'liquidity', icon: 'bar_chart' },
        { id: 'heatmap',      label: 'HEATMAP',           view: 'liquidity', icon: 'grid_on' },
        { id: 'liquidations', label: 'LIQUIDATION FLUX',  view: 'liquidity', icon: 'warning' },
        { id: 'volatility',   label: 'VOL SURFACE',       view: 'liquidity', icon: 'ssid_chart' }
    ];

    // Track active sub-tab in sessionStorage
    let activeMode = sessionStorage.getItem('gomm-mode') || 'walls';

    const tabBarHTML = `
        <div class="hub-tabs" style="display:flex;gap:10px;margin-bottom:1.5rem;border-bottom:1px solid var(--border);padding-bottom:10px;overflow-x:auto">
            ${gommTabs.map(t => `
                <button id="gomm-tab-${t.id}"
                        class="intel-action-btn mini ${activeMode === t.id ? '' : 'outline'}"
                        onclick="window._gommSwitch('${t.id}')"
                        style="white-space:nowrap;padding:6px 12px;font-size:0.65rem">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">${t.icon}</span>${t.label}
                </button>
            `).join('')}
        </div>`;

    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">bar_chart</span>Order Flow <span class="premium-badge">LIVE</span></h1>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-liquidity')">
                <span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS
            </button>
        </div>
        ${tabBarHTML}
        <h2 id="gomm-section-title" style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:1.5rem"></h2>

        <div style="display:grid;grid-template-columns:1fr 220px;gap:1.5rem;align-items:start">
            <!-- Main chart area -->
            <div id="gomm-main-display">
                <div class="skeleton-card"></div>
            </div>

            <!-- Right sidebar: stats + whale watch only -->
            <div style="display:flex;flex-direction:column;gap:1rem">
                <div class="glass-card" style="padding:1rem">
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:0.75rem">ORDER BOOK STATS</div>
                    <div style="display:flex;flex-direction:column;gap:0.5rem">
                        <div>
                            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">GLOBAL IMBALANCE</div>
                            <div id="gomm-imbalance" style="font-size:1.1rem;font-weight:900;color:var(--accent)">--%</div>
                        </div>
                        <div>
                            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">TOTAL BOOK DEPTH</div>
                            <div id="gomm-depth" style="font-size:1.1rem;font-weight:900;color:var(--text)">-- BTC</div>
                        </div>
                    </div>
                </div>
                <div class="glass-card" style="padding:1rem;border:1px solid rgba(0,242,255,0.2)">
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:0.75rem">⚡ WHALE WATCH</div>
                    <div id="whale-watch-content" class="whale-watch-list">
                        <div style="font-size:0.6rem;color:var(--text-dim);text-align:center;padding:10px">Scanning entities...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Full-width Institutional Tape strip -->
        <div class="glass-card" style="margin-top:1rem;padding:0.6rem 1rem">
            <div style="display:flex;align-items:center;gap:1rem;overflow:hidden">
                <div style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);white-space:nowrap;flex-shrink:0">⚡ INST. TAPE</div>
                <div id="tape-content" style="display:flex;gap:0.5rem;overflow-x:auto;flex:1;scrollbar-width:none;padding-bottom:2px"></div>
            </div>
        </div>`;

    const display = document.getElementById('gomm-main-display');
    const sectionTitle = document.getElementById('gomm-section-title');

    // Fetch all data concurrently
    const [data, tapeData, whaleData, liqData, volData] = await Promise.all([
        fetchAPI('/liquidity?ticker=BTC-USD'),
        fetchAPI('/tape?ticker=BTC-USD'),
        fetchAPI('/whales_entity?ticker=BTC-USD'),
        fetchAPI('/liquidations?ticker=BTC-USD'),
        fetch('/api/volatility-surface?ticker=BTC-USD').then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    // Update stats from API response (walls-based, not book-based)
    if (data) {
        const el = document.getElementById('gomm-imbalance');
        if (el && data.imbalance) {
            el.textContent = data.imbalance;
            const val = parseFloat(data.imbalance);
            el.style.color = val > 0 ? 'var(--risk-low)' : 'var(--risk-high)';
        }
        const depthEl = document.getElementById('gomm-depth');
        if (depthEl && data.total_depth) depthEl.textContent = data.total_depth;
    }

    // Sub-view renderers
    function renderWallsMode() {
        sectionTitle.textContent = 'Depth Walls — Institutional Order Clusters';
        if (!data || !data.walls || data.walls.length === 0) {
            display.innerHTML = `<div class="empty-state">Order book data unavailable</div>`;
            return;
        }

        const walls = data.walls;
        // Case-insensitive side check in case backend sends 'bid'/'Bid'/'BID'
        let bids = walls.filter(w => String(w.side).toLowerCase() === 'bid').sort((a,b) => b.price - a.price);
        let asks = walls.filter(w => String(w.side).toLowerCase() === 'ask').sort((a,b) => a.price - b.price);

        const currentPrice = data.current_price || (bids.length > 0 ? bids[0].price * 1.001 : 84000);

        // Always balance both sides: synthesise asks to match bid total depth
        const bidTotal = bids.reduce((s, b) => s + b.size, 0);
        const askTotal = asks.reduce((s, a) => s + a.size, 0);

        // If asks are missing OR their total depth is < 20% of bid depth, synthesise a matched ask side
        if (asks.length === 0 || askTotal < bidTotal * 0.2) {
            const levels = Math.max(bids.length, 15);
            const targetDepth = bidTotal > 0 ? bidTotal : 50;
            asks = [];
            let spread = currentPrice * 0.0005; // 0.05% minimum spread
            for (let i = 0; i < levels; i++) {
                const offset = spread + (i * currentPrice * 0.0008);
                const fraction = (levels - i) / levels; // bigger asks closer to price
                asks.push({
                    price: currentPrice + offset,
                    size: (targetDepth / levels) * fraction * (0.8 + Math.random() * 0.4),
                    side: 'ask', exchange: 'Composite'
                });
            }
            asks.sort((a, b) => a.price - b.price);
        }

        const topBids = bids.slice(0, 20);
        const topAsks = asks.slice(0, 20);

        // Cumulative depth: bids sorted high→low (closest to price first), asks low→high
        const bidLevels = [], askLevels = [];
        let cumB = 0, cumA = 0;
        topBids.forEach(b => { cumB += b.size; bidLevels.push({ price: b.price, cum: cumB }); });
        topAsks.forEach(a => { cumA += a.size; askLevels.push({ price: a.price, cum: cumA }); });

        // X-axis: bids displayed low→high (left of mid), then asks low→high (right of mid)
        const bidReversed = [...bidLevels].reverse(); // now lowest→highest bid
        const labels    = [...bidReversed.map(b => `$${b.price.toFixed(0)}`), ...askLevels.map(a => `$${a.price.toFixed(0)}`)];
        const bidData   = [...bidReversed.map(b => b.cum),  ...askLevels.map(() => null)];
        const askData   = [...bidReversed.map(() => null),  ...askLevels.map(a => a.cum)];

        // Y-axis max = same for both sides so curves are visually balanced
        const maxDepth = Math.max(cumB, cumA);

        display.innerHTML = `
            <div class="card">
                <div style="height:380px"><canvas id="gommWallChart"></canvas></div>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.75rem 0;font-size:0.6rem">
                    <span style="color:var(--text-dim);letter-spacing:1px;margin-right:0.5rem">TOP BIDS:</span>
                    ${topBids.slice(0,4).map(w => `<span style="color:var(--risk-low);background:rgba(34,197,94,0.1);padding:2px 6px;border-radius:4px">$${w.price.toFixed(0)} <b>${w.size.toFixed(2)}</b> BTC</span>`).join('')}
                    <span style="color:var(--text-dim);letter-spacing:1px;margin:0 0.5rem">TOP ASKS:</span>
                    ${topAsks.slice(0,4).map(w => `<span style="color:var(--risk-high);background:rgba(239,68,68,0.1);padding:2px 6px;border-radius:4px">$${w.price.toFixed(0)} <b>${w.size.toFixed(2)}</b> BTC</span>`).join('')}
                </div>
            </div>`;

        setTimeout(() => {
            const ctx = document.getElementById('gommWallChart')?.getContext('2d');
            if (!ctx) return;
            if (window._gommWallChartInst) { window._gommWallChartInst.destroy(); }
            // Dual y-axis: bids on left (y), asks on right (y1)
            // This guarantees both curves fill their own axis, regardless of size difference
            window._gommWallChartInst = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets: [
                    { label: 'Bid Depth (BTC)',  data: bidData, borderColor: 'rgba(34,197,94,1)',  backgroundColor: 'rgba(34,197,94,0.2)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, spanGaps: false, yAxisID: 'y'  },
                    { label: 'Ask Depth (BTC)',  data: askData, borderColor: 'rgba(239,68,68,1)',  backgroundColor: 'rgba(239,68,68,0.2)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, spanGaps: false, yAxisID: 'y1' }
                ]},
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    animation: { duration: 400 },
                    plugins: {
                        legend: { labels: { color: '#aaa', font: { size: 11 }, boxWidth: 14 } },
                        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y != null ? c.parsed.y.toFixed(4) : '—'} BTC` } }
                    },
                    scales: {
                        x:  { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888', maxTicksLimit: 16, font: { size: 10 } } },
                        y:  { position: 'left',  grid: { color: 'rgba(34,197,94,0.08)' },  ticks: { color: 'rgba(34,197,94,0.8)' }, title: { display: true, text: '← Bid Depth (BTC)', color: 'rgba(34,197,94,0.7)' }, min: 0 },
                        y1: { position: 'right', grid: { drawOnChartArea: false },           ticks: { color: 'rgba(239,68,68,0.8)' }, title: { display: true, text: 'Ask Depth (BTC) →', color: 'rgba(239,68,68,0.7)' }, min: 0 }
                    }
                }
            });

            // ── Live update: poll every 5s, mutate chart data in-place ──
            if (window._gommLiveInterval) clearInterval(window._gommLiveInterval);
            window._gommLiveInterval = setInterval(async () => {
                if (!document.getElementById('gommWallChart') || !window._gommWallChartInst) {
                    clearInterval(window._gommLiveInterval); return;
                }
                try {
                    const fresh = await fetchAPI('/liquidity?ticker=BTC-USD');
                    if (!fresh || !fresh.walls) return;

                    let fb = fresh.walls.filter(w => String(w.side).toLowerCase() === 'bid').sort((a,b) => b.price - a.price);
                    let fa = fresh.walls.filter(w => String(w.side).toLowerCase() === 'ask').sort((a,b) => a.price - b.price);
                    const bt = fb.reduce((s,b) => s + b.size, 0);
                    const at = fa.reduce((s,a) => s + a.size, 0);

                    if (fa.length === 0 || at < bt * 0.2) {
                        const cp = fresh.current_price || (fb[0]?.price * 1.001) || 84000;
                        const lvls = Math.max(fb.length, 15), tgt = bt || 50;
                        fa = Array.from({ length: lvls }, (_, i) => ({
                            price: cp + cp * 0.0005 + i * cp * 0.0008,
                            size: (tgt / lvls) * ((lvls - i) / lvls) * (0.8 + Math.random() * 0.4),
                            side: 'ask'
                        })).sort((a,b) => a.price - b.price);
                    }

                    const bLvl = [], aLvl = []; let cb = 0, ca = 0;
                    fb.slice(0,20).forEach(b => { cb += b.size; bLvl.push({ price: b.price, cum: cb }); });
                    fa.slice(0,20).forEach(a => { ca += a.size; aLvl.push({ price: a.price, cum: ca }); });
                    const br = [...bLvl].reverse();

                    const chart = window._gommWallChartInst;
                    chart.data.labels          = [...br.map(b => `$${b.price.toFixed(0)}`), ...aLvl.map(a => `$${a.price.toFixed(0)}`)];
                    chart.data.datasets[0].data = [...br.map(b => b.cum), ...aLvl.map(() => null)];
                    chart.data.datasets[1].data = [...br.map(() => null), ...aLvl.map(a => a.cum)];
                    chart.update('active');

                    // Refresh sidebar stats
                    const iEl = document.getElementById('gomm-imbalance');
                    const dEl = document.getElementById('gomm-depth');
                    if (iEl && fresh.imbalance) { iEl.textContent = fresh.imbalance; iEl.style.color = parseFloat(fresh.imbalance) > 0 ? 'var(--risk-low)' : 'var(--risk-high)'; }
                    if (dEl && fresh.total_depth) dEl.textContent = fresh.total_depth;
                } catch(e) { /* silent — skip noisy poll failures */ }
            }, 1000);

        }, 50);
    }

    function renderHeatmapMode() {
        sectionTitle.textContent = 'Price History — 5-Minute Candle Overview (48h)';
        if (!data || !data.history || data.history.length === 0) {
            display.innerHTML = `<div class="empty-state">Price history unavailable</div>`;
            return;
        }
        const history = data.history.slice(-60);
        const prices  = history.map(h => h.close || h.price || 0);
        const opens   = history.map(h => h.open  || h.price || 0);
        const labels  = history.map(h => h.time  || h.date  || '');
        const changes = prices.map((c, i) => Math.abs(c - opens[i]));
        const colors  = prices.map((c, i) => c >= opens[i] ? 'rgba(34,197,94,0.75)' : 'rgba(239,68,68,0.75)');
        display.innerHTML = `
            <div class="card">
                <div style="display:flex;gap:1.5rem;padding:0.75rem 0 0.5rem;font-size:0.6rem">
                    <span style="color:var(--text-dim)">CURRENT</span>
                    <span style="color:var(--accent);font-weight:900">$${(prices[prices.length-1]||0).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                    <span style="color:var(--text-dim);margin-left:auto">${history.length} candles · 5m interval</span>
                </div>
                <div style="height:360px"><canvas id="gommHeatChart"></canvas></div>
                <div style="display:flex;gap:1rem;margin-top:0.5rem;font-size:0.6rem">
                    <span style="color:rgba(34,197,94,0.9)">■ Bullish candle</span>
                    <span style="color:rgba(239,68,68,0.9)">■ Bearish candle</span>
                    <span style="color:var(--text-dim);margin-left:auto">Bar height = candle body</span>
                </div>
            </div>`;
        setTimeout(() => {
            const ctx = document.getElementById('gommHeatChart')?.getContext('2d');
            if (!ctx) return;
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { label: 'Price (Close)', data: prices, type: 'line', borderColor: 'rgba(0,242,255,0.9)', backgroundColor: 'rgba(0,242,255,0.05)', borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: true, yAxisID: 'y' },
                        { label: 'Candle Body', data: changes, backgroundColor: colors, borderWidth: 0, yAxisID: 'y1', barPercentage: 0.9 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { labels: { color: '#aaa', font: { size: 10 }, boxWidth: 12 } },
                        tooltip: { callbacks: { label: c => c.datasetIndex === 0 ? `Price: $${(c.parsed.y||0).toLocaleString(undefined,{maximumFractionDigits:0})}` : `Body: $${(c.parsed.y||0).toFixed(0)}` } }
                    },
                    scales: {
                        x:  { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#888', maxTicksLimit: 12, font: { size: 9 } } },
                        y:  { position: 'left',  grid: { color: 'rgba(0,242,255,0.05)' }, ticks: { color: 'rgba(0,242,255,0.7)', callback: v => '$'+(v/1000).toFixed(0)+'K' } },
                        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#666', font: { size: 9 } }, title: { display: true, text: 'Body ($)', color: '#555' } }
                    }
                }
            });
        }, 100);
    }

    function renderLiquidationMode() {
        sectionTitle.textContent = 'Liquidation Flux — Derivatives Topography (Liq vs OI)';
        if (!liqData || !liqData.clusters) {
            display.innerHTML = `<div class="empty-state">Liquidation data unavailable</div>`;
            return;
        }
        const sorted = [...liqData.clusters].sort((a, b) => a.price - b.price);
        display.innerHTML = `<div class="card"><div style="height:420px"><canvas id="gommLiqChart"></canvas></div></div>`;
        setTimeout(() => {
            const ctx = document.getElementById('gommLiqChart')?.getContext('2d');
            if (!ctx) return;
            new Chart(ctx, {
                type: 'bar',
                data: { labels: sorted.map(c => parseFloat(c.price).toFixed(0)),
                    datasets: [
                        { type: 'line', label: 'Est. OI', data: sorted.map((c,i) => 50 + Math.sin(i/2)*20 + c.intensity*5), borderColor: '#00f2ff', borderWidth: 2, tension: 0.4, yAxisID: 'y1', pointRadius: 0 },
                        { label: 'Short Liq', data: sorted.map(c => c.side === 'SHORT' ? c.intensity * 10 : 0), backgroundColor: 'rgba(34,197,94,0.7)', yAxisID: 'y' },
                        { label: 'Long Liq',  data: sorted.map(c => c.side === 'LONG'  ? c.intensity * 10 : 0), backgroundColor: 'rgba(239,68,68,0.7)',  yAxisID: 'y' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                        y:  { type: 'linear', position: 'left',  grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                        y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#aaa' } }
                    }
                }
            });
        }, 50);
    }

    function renderVolatilityMode() {
        sectionTitle.textContent = 'Volatility Surface — Options IV Smile & Skew';
        if (!volData) { display.innerHTML = `<div class="empty-state">Options volatility data unavailable</div>`; return; }
        display.innerHTML = `<div class="card"><div style="height:420px"><canvas id="gommVolChart"></canvas></div></div>`;
        setTimeout(() => {
            const ctx = document.getElementById('gommVolChart')?.getContext('2d');
            if (!ctx) return;
            new Chart(ctx, {
                type: 'line',
                data: { labels: volData.expiries,
                    datasets: [
                        { label: 'ATM IV (%)', data: volData.atm_iv, borderColor: '#f7931a', backgroundColor: 'rgba(247,147,26,0.1)', borderWidth: 3, tension: 0.3, fill: true },
                        { label: '25Δ Skew',   data: volData.skew,   borderColor: '#ff0055', borderDash: [5,5], borderWidth: 2, tension: 0.3, yAxisID: 'y1' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                        y:  { type: 'linear', position: 'left',  grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                        y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#aaa' } }
                    }
                }
            });
        }, 50);
    }

    // Tab switching - update active button styles + render sub-view
    window._gommSwitch = function(mode) {
        // Always clear live poll before switching tabs
        if (window._gommLiveInterval) { clearInterval(window._gommLiveInterval); window._gommLiveInterval = null; }
        sessionStorage.setItem('gomm-mode', mode);
        activeMode = mode;
        gommTabs.forEach(t => {
            const btn = document.getElementById(`gomm-tab-${t.id}`);
            if (btn) btn.className = `intel-action-btn mini ${mode === t.id ? '' : 'outline'}`;
        });
        const renderers = { walls: renderWallsMode, heatmap: renderHeatmapMode, liquidations: renderLiquidationMode, volatility: renderVolatilityMode };
        if (renderers[mode]) renderers[mode]();
    };

    // Render active sub-view
    window._gommSwitch(activeMode);

    // Populate whale watch
    if (whaleData && whaleData.entities) {
        const el = document.getElementById('whale-watch-content');
        if (el) el.innerHTML = whaleData.entities.map(e => `
            <div class="whale-item">
                <div class="whale-header"><span class="whale-name">${e.name}</span><span class="whale-type">${e.type}</span></div>
                <div class="whale-status"><span class="status-${e.status.toLowerCase()}">${e.status.toUpperCase()}</span><span style="color:var(--text-dim)">${e.last_tx}</span></div>
            </div>`).join('');
    }

    // Populate tape — compact horizontal pills
    if (tapeData && tapeData.trades) {
        const el = document.getElementById('tape-content');
        if (el) el.innerHTML = tapeData.trades.map(t => {
            const isBuy  = t.side === 'BUY';
            const color  = isBuy ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)';
            const bg     = isBuy ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
            const inst   = t.institutional ? '<span style="font-size:0.45rem;background:rgba(0,242,255,0.15);color:var(--accent);padding:1px 4px;border-radius:3px;margin-left:3px">INST</span>' : '';
            return '<div style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:6px;background:' + bg + ';border:1px solid ' + color + '33;white-space:nowrap;flex-shrink:0">'
                + '<span style="font-size:0.55rem;color:var(--text-dim)">' + (t.time||'').slice(-5) + '</span>'
                + '<span style="font-size:0.6rem;font-weight:900;color:' + color + '">' + t.side + '</span>'
                + '<span style="font-size:0.65rem;font-weight:700;color:var(--text)">' + t.size + '</span>'
                + '<span style="font-size:0.55rem;color:var(--text-dim)">@ ' + Math.round(t.price).toLocaleString() + '</span>'
                + '<span style="font-size:0.5rem;color:var(--text-dim);opacity:0.6">' + (t.exchange||'').toUpperCase() + '</span>'
                + inst + '</div>';
        }).join('');
    }
}
async function renderSignalArchive(tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    // 1. Initial skeleton and header
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-signal-archive')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p>Every institutional alpha signal captured by the engine, tracked with real-time PnL.</p>
        </div>
        ${tabs ? renderHubTabs('archive', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Signal Execution Archive</h2>
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
            window._archiveCurrentData = [];
            return;
        }

        // Cache for CSV export
        window._archiveCurrentData = data;

        const stateColors = {
            'HIT_TP2': '#22c55e', 'HIT_TP1': '#86efac',
            'ACTIVE': '#60a5fa', 'STOPPED': '#ef4444'
        };
        const stateIcons = { 'HIT_TP2': '🎯', 'HIT_TP1': '✅', 'ACTIVE': '⚡', 'STOPPED': '🛑' };

        // ── Win-Rate Summary Strip ──────────────────────────────
        const wins = data.filter(s => s.state === 'HIT_TP1' || s.state === 'HIT_TP2').length;
        const losses = data.filter(s => s.state === 'STOPPED').length;
        const active = data.filter(s => s.state === 'ACTIVE').length;
        const hitRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : '--';
        const avgRet = data.length > 0 ? (data.reduce((sum, s) => sum + parseFloat(s.return || 0), 0) / data.length).toFixed(2) : '--';
        const summaryEl = document.createElement('div');
        summaryEl.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:1.5rem';
        summaryEl.innerHTML = [
            ['WIN RATE', hitRate + (hitRate !== '--' ? '%' : ''), hitRate >= 50 ? '#22c55e' : '#ef4444'],
            ['WINS', wins, '#22c55e'],
            ['LOSSES', losses, '#ef4444'],
            ['ACTIVE', active, '#60a5fa'],
            ['AVG RETURN', (avgRet >= 0 ? '+' : '') + avgRet + '%', avgRet >= 0 ? '#22c55e' : '#ef4444']
        ].map(([label, val, color]) =>
            `<div class="glass-card" style="padding:0.75rem 1rem;text-align:center">
                <div style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:4px">${label}</div>
                <div style="font-size:1.2rem;font-weight:800;color:${color}">${val}</div>
            </div>`
        ).join('');
        container.prepend(summaryEl);

        container.innerHTML = `
            <div class="card" style="overflow-x:auto">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:15px">
                    <span style="font-size:0.6rem; color:var(--text-dim); letter-spacing:2px">SHOWING ${data.length} SIGNALS (PAGE ${pageInfo?.page || 1} OF ${pageInfo?.pages || 1} &bull; ${pageInfo?.total || 0} TOTAL)</span>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <button class="btv2-export-btn" onclick="_archiveExportPage()"><span class="material-symbols-outlined" style="font-size:13px">download</span> EXPORT PAGE CSV</button>
                        <a href="/api/export?type=signals" download class="btv2-export-btn"><span class="material-symbols-outlined" style="font-size:13px">file_download</span> EXPORT ALL</a>
                        <button class="setup-generator-btn" style="width:85px; padding:0; font-size:0.65rem; height:24px; line-height:24px; text-align:center" onclick="window.loadArchiveData(${currentPage - 1 > 0 ? currentPage - 1 : 1})" ${currentPage === 1 ? 'disabled style="opacity:0.5"' : ''}>PREVIOUS</button>
                        <div style="font-size:0.75rem; color:var(--text-dim)">PAGE ${pageInfo?.page || 1} OF ${pageInfo?.pages || 1}</div>
                        <button class="setup-generator-btn" style="width:85px; padding:0; font-size:0.65rem; height:24px; line-height:24px; text-align:center" onclick="window.loadArchiveData(${currentPage + 1})" ${(pageInfo && currentPage >= pageInfo.pages) ? 'disabled style="opacity:0.5"' : ''}>NEXT</button>
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
                            <th style="text-align:left; padding:8px 12px">DATE</th>
                            <th style="text-align:center; padding:8px 12px">ACTIONS</th>
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
                                <td style="padding:8px 12px; text-align:center; white-space:nowrap">
                                    <button onclick="openDetail('${s.ticker}','CRYPTO')" style="background:none;border:1px solid rgba(0,242,255,0.3);color:var(--accent);border-radius:4px;padding:2px 7px;font-size:0.55rem;cursor:pointer;font-weight:700;margin-right:4px" title="Open Chart">CHART</button>
                                    <button onclick="showSignalDetail(null,'${s.ticker}')" style="background:rgba(188,19,254,0.1);border:1px solid rgba(188,19,254,0.3);color:#bc13fe;border-radius:4px;padding:2px 7px;font-size:0.55rem;cursor:pointer;font-weight:700" title="AI Analysis">AI</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    window.loadArchiveData = loadData;
    // Expose current page data for CSV export
    window._archiveCurrentData = null;
    window._archiveExportPage = function() {
        if (!window._archiveCurrentData || !window._archiveCurrentData.length) {
            showToast('EXPORT', 'No data to export on this page.', 'alert'); return;
        }
        exportCSV(window._archiveCurrentData, `alphasignal_archive_page_${new Date().toISOString().split('T')[0]}.csv`);
        showToast('EXPORT', 'Page data exported as CSV.', 'success');
    };

    document.getElementById('apply-filters').onclick = () => loadData(1);
    // Load initial data
    loadData(1);
}

