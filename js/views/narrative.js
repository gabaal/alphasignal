async function renderNarrativeGalaxy(filterChain = 'ALL', tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI(`/narrative-clusters?chain=${filterChain}&v=${Date.now()}`);
    if (!data || !data.clusters) return;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end">
            <div>                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alpha Strategy Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">hub</span>Narrative Galaxy <span class="premium-badge">NLP</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-narrative')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                <p>Spatial mapping using real-time news synthesis and sentiment velocity. Anchors represent core institutional narratives.</p>
            </div>
        ${renderHubTabs('narrative', tabs)}
            <div class="view-actions" style="margin-bottom:0">
                <select id="galaxy-chain-filter" class="tf-btn" style="background:var(--bg-input); border:1px solid var(--border); color:var(--text); padding:0 15px; height:36px; cursor:pointer" onchange="renderNarrativeGalaxy(this.value)">
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
                    ${data.hot_topics.map(t => `<span style="font-size:0.75rem; font-weight:800; color:var(--text); white-space:nowrap"># ${t}</span>`).join('')}
                </div>
            </div>
        </div>

        <div class="galaxy-container" style="position:relative; width:100%; height:600px; background: ${document.documentElement.getAttribute('data-theme') === 'light' ? 'radial-gradient(circle at center, #ffffff 0%, #e2e8f0 100%)' : 'radial-gradient(circle at center, #0a0b1e 0%, #000 100%)'}; border-radius:16px; overflow:hidden; border:1px solid ${alphaColor(0.05)}">
            <canvas id="galaxyCanvas" role="img" aria-label="Narrative galaxy bubble chart � social mindshare visualization" style="width:100%; height:100%"></canvas>
            <div id="galaxyTooltip" class="galaxy-tooltip" style="display:none; position:absolute; pointer-events:none; z-index:1000"></div>
            
            <div class="galaxy-legend" style="position:absolute; bottom:20px; right:20px; display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;  padding:1rem; border-radius:8px; border:1px solid var(--border)">
                ${Object.entries(data.anchors).map(([key, val]) => `
                    <div style="display:flex; align-items:center; gap:8px; font-size:0.6rem; color:var(--text-dim)">
                        <div style="width:10px; height:10px; border-radius:2px; background:${val.color}"></div>
                        <div>
                            <div style="color:var(--text); font-weight:800">${key}</div>
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
                        const medal  = i === 0 ? '??' : i === 1 ? '??' : i === 2 ? '??' : `#${i+1}`;
                        return `<div style="margin-bottom:12px">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                                <span style="font-size:0.65rem;font-weight:800;color:${color}">${medal} ${cat}</span>
                                <span style="font-size:0.6rem;color:var(--text-dim)">${Math.round(count)} signal${Math.round(count) !== 1 ? 's' : ''}</span>
                            </div>
                            <div style="height:4px;background:${alphaColor(0.06)};border-radius:2px">
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
            <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:1rem">NARRATIVE SENTIMENT VELOCITY � TOP 20 SIGNALS</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
                ${(data.clusters || []).sort((a,b) => Math.abs(b.sentiment||0) - Math.abs(a.sentiment||0)).slice(0,20).map(c => {
                    const sent = c.sentiment || 0;
                    const isPos = sent >= 0;
                    const color = isPos ? '#22c55e' : '#ef4444';
                    const bg    = isPos ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
                    const bar   = Math.min(Math.abs(sent) * 100, 100);
                    const anchor = data.anchors?.[c.category] || {};
                    return `<div style="background:${bg};border:1px solid ${color}22;border-radius:8px;padding:10px">
                        <div style="font-size:0.65rem;font-weight:800;color:var(--text);margin-bottom:2px">${(c.ticker||'�').replace('-USD','')}</div>
                        <div style="font-size:0.5rem;color:var(--text-dim);margin-bottom:6px">${c.category || ''}</div>
                        <div style="height:3px;background:${alphaColor(0.06)};border-radius:2px;margin-bottom:4px">
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

    // ── Axis layout constants ──────────────────────────────────────────────
    const PAD_LEFT   = 52;   // room for Y-axis labels
    const PAD_BOTTOM = 36;   // room for X-axis labels
    const PAD_TOP    = 16;
    const PAD_RIGHT  = 16;
    const plotW = rect.width  - PAD_LEFT - PAD_RIGHT;
    const plotH = rect.height - PAD_TOP  - PAD_BOTTOM;

    // ── Map bubbles from sentiment + momentum onto padded plot area ──────────
    // sentiment: –1.0 → +1.0  maps to  left → right (X axis)
    // momentum:  –25% → +25%  maps to  bottom → top (Y axis, canvas inverted)
    const SENT_RANGE = 1.0;   // clamp sentiment to ±1.0
    const MOM_RANGE  = 7.5;   // clamp momentum  to ±7.5 %

    const stars = clusters.map(c => {
        const sent = Math.max(-SENT_RANGE, Math.min(SENT_RANGE, c.sentiment || 0));
        const mom  = Math.max(-MOM_RANGE,  Math.min(MOM_RANGE,  c.momentum  || 0));
        // X: –1 → PAD_LEFT, +1 → PAD_LEFT + plotW
        const x = PAD_LEFT + ((sent + SENT_RANGE) / (2 * SENT_RANGE)) * plotW;
        // Y: +MOM → PAD_TOP (top), –MOM → PAD_TOP + plotH (bottom)
        const y = PAD_TOP  + ((MOM_RANGE - mom) / (2 * MOM_RANGE)) * plotH;
        return { ...c, x, y };
    });
    const hoverScale = 1.2;
    let hoveredStar = null;

    // ── Axis drawing helper ────────────────────────────────────────────────
    function drawAxes() {
        const TICK_COUNT  = 5;
        const TICK_LEN    = 4;
        const axisColor   = alphaColor(0.18);
        const gridColor   = alphaColor(0.04);
        const labelColor  = alphaColor(0.35);
        const accentColor = 'rgba(0,242,255,0.55)';
        const axisX = PAD_LEFT;                        // x position of Y-axis
        const axisY = PAD_TOP + plotH;                 // y position of X-axis

        ctx.save();
        ctx.font = '9px Inter, sans-serif';
        ctx.textBaseline = 'middle';

        // ── Vertical grid lines + X-axis ticks ──
        for (let i = 0; i <= TICK_COUNT; i++) {
            const x = axisX + (plotW / TICK_COUNT) * i;
            // grid line
            ctx.beginPath();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.moveTo(x, PAD_TOP);
            ctx.lineTo(x, axisY);
            ctx.stroke();
            // tick
            ctx.beginPath();
            ctx.strokeStyle = axisColor;
            ctx.moveTo(x, axisY);
            ctx.lineTo(x, axisY + TICK_LEN);
            ctx.stroke();
            // label: sentiment –1.0 → +1.0
            const val = ((i / TICK_COUNT) * 2 - 1).toFixed(1);
            ctx.fillStyle = labelColor;
            ctx.textAlign = 'center';
            ctx.fillText((parseFloat(val) > 0 ? '+' : '') + val, x, axisY + TICK_LEN + 9);
        }

        // ── Horizontal grid lines + Y-axis ticks ──
        for (let i = 0; i <= TICK_COUNT; i++) {
            const y = PAD_TOP + (plotH / TICK_COUNT) * i;
            // grid line
            ctx.beginPath();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.moveTo(axisX, y);
            ctx.lineTo(axisX + plotW, y);
            ctx.stroke();
            // tick
            ctx.beginPath();
            ctx.strokeStyle = axisColor;
            ctx.moveTo(axisX - TICK_LEN, y);
            ctx.lineTo(axisX, y);
            ctx.stroke();
            // label: momentum +5% → –5% (canvas Y inverted)
            const val = (((TICK_COUNT - i) / TICK_COUNT) * 2 * MOM_RANGE - MOM_RANGE).toFixed(1);
            ctx.fillStyle = labelColor;
            ctx.textAlign = 'right';
            ctx.fillText((parseFloat(val) > 0 ? '+' : '') + val + '%', axisX - TICK_LEN - 3, y);
        }

        // ── Axis lines ──
        ctx.beginPath();
        ctx.strokeStyle = axisColor;
        ctx.lineWidth = 1;
        // Y-axis
        ctx.moveTo(axisX, PAD_TOP);
        ctx.lineTo(axisX, axisY + TICK_LEN);
        // X-axis
        ctx.moveTo(axisX - TICK_LEN, axisY);
        ctx.lineTo(axisX + plotW, axisY);
        ctx.stroke();

        // ── Zero cross-hair lines ──
        const zeroX = axisX + plotW / 2;
        const zeroY = PAD_TOP + plotH / 2;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,242,255,0.12)';
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1;
        ctx.moveTo(zeroX, PAD_TOP);
        ctx.lineTo(zeroX, axisY);
        ctx.moveTo(axisX, zeroY);
        ctx.lineTo(axisX + plotW, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);

        // ── Axis labels ──
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'center';
        ctx.letterSpacing = '1px';
        // X label
        ctx.fillText('SENTIMENT  →', axisX + plotW / 2, axisY + PAD_BOTTOM - 4);
        // Y label (rotated)
        ctx.save();
        ctx.translate(10, PAD_TOP + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('MOMENTUM  ↑', 0, 0);
        ctx.restore();

        ctx.restore();
    }

    function draw() {
        ctx.clearRect(0, 0, rect.width, rect.height);

        drawAxes();

        // Draw connection lines to cluster centers (centroid of member stars)
        Object.entries(data.anchors).forEach(([key, anchor]) => {
            const members = stars.filter(s => s.category === key);
            if (!members.length) return;
            const ax = members.reduce((s, m) => s + m.x, 0) / members.length;
            const ay = members.reduce((s, m) => s + m.y, 0) / members.length;
            ctx.beginPath();
            ctx.strokeStyle = `${alphaColor(0.02)}`;
            ctx.lineWidth = 1;
            members.forEach(s => {
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
                    ctx.strokeStyle = isBridge ? 'rgba(0, 242, 255, 0.08)' : alphaColor(0.03);
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
                ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'light' ? '#000' : 'white';
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
                <div style=" border:1px solid ${hoveredStar.color}; padding:12px; border-radius:8px; backdrop-filter:blur(10px); min-width:140px">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px">
                        <span style="font-weight:900; color:var(--text); font-size:1rem">${hoveredStar.ticker}</span>
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
                        <div style="display:flex; flex-wrap:wrap; gap:4px; border-top:1px solid ${alphaColor(0.1)}; padding-top:8px">
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
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Macro Intelligence Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">article</span>Market Briefing <span class="premium-badge">AI</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-briefing')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                <p>AI-powered narrative synthesis across Mindshare, Flow, and Technical data streams.</p>
            </div>
            ${tabs ? renderHubTabs('briefing', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Daily Market Intelligence Briefing</h2>
            
            <div class="briefing-container" style="max-width:900px; margin:0 auto">


                <!-- AI Daily Memo -->
                <div class="glass-card" id="ai-memo-card" style="margin-bottom:2rem;padding:1.5rem;border:1px solid rgba(139,92,246,0.3);background:linear-gradient(135deg,rgba(139,92,246,0.06),rgba(0,0,0,0.4))">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                        <div style="display:flex;align-items:center;gap:10px">
                            <span class="material-symbols-outlined" style="color:#8b5cf6">smart_toy</span>
                            <span style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:#8b5cf6">AI INSTITUTIONAL MEMO</span>
                        </div>
                        <button onclick="refreshAIMemo()" style="background:none;border:1px solid rgba(139,92,246,0.3);color:#8b5cf6;padding:4px 10px;border-radius:6px;font-size:0.6rem;cursor:pointer;letter-spacing:1px">REFRESH</button>
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
                                            <div style="font-size:0.55rem; color:var(--text); background:${alphaColor(0.05)}; padding:4px 8px; border-radius:4px; border:1px solid ${alphaColor(0.1)}">
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
                        <canvas id="regimeChart" role="img" aria-label="Market regime classification chart"></canvas>
                    </div>
                    <div style="display:flex; justify-content:center; gap:20px; margin-top:10px; font-size:0.6rem; color:var(--text-dim)">
                        <span style="display:flex; align-items:center; gap:5px"><div style="width:10px; height:10px; background:rgba(34,197,94,0.4); border:1px solid #22c55e88"></div> BULLISH</span>
                        <span style="display:flex; align-items:center; gap:5px"><div style="width:10px; height:10px; background:rgba(239,68,68,0.4); border:1px solid #ef444488"></div> BEARISH</span>
                        <span style="display:flex; align-items:center; gap:5px"><div style="width:10px; height:10px; background:${alphaColor(0.1)}; border:1px solid ${alphaColor(0.3)}"></div> NEUTRAL</span>
                    </div>
                </div>

                <!-- Sector Pulse Matrix -->
                <div class="glass-card" style="margin-bottom:2rem; padding:1.5rem">
                    <h3 style="color:var(--accent); font-size:0.8rem; margin-bottom:1.5rem; letter-spacing:1px">SYSTEMIC SECTOR ATTRIBUTION</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:1rem">
                        ${data.sector_data ? data.sector_data.map(([cat, score]) => `
                            <div class="sector-puck" style="background:${alphaColor(0.03)}; border:1px solid ${alphaColor(0.05)}; padding:1rem; border-radius:8px; text-align:center">
                                <div style="font-size:0.6rem; color:var(--text-dim); margin-bottom:4px; font-weight:900">${cat}</div>
                                <div style="font-size:1.4rem; font-weight:900; color:${score > 50 ? 'var(--risk-low)' : 'var(--risk-high)'}">${score.toFixed(1)}</div>
                                <div style="height:2px; background:${alphaColor(0.05)}; margin-top:8px; border-radius:1px; overflow:hidden">
                                    <div style="width:${score}%; height:100%; background:${score > 50 ? 'var(--risk-low)' : 'var(--risk-high)'}"></div>
                                </div>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>

                <h3 style="margin-bottom:1.5rem; font-size:1rem; color:var(--accent); letter-spacing:1px">HIGH-CONVICTION PROTOCOLS</h3>
                <div class="ideas-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem">
                    ${data.top_ideas.map(idea => `
                        <div class="idea-card" onclick="openDetail('${idea.ticker}')" style="background:${alphaColor(0.02)}; border:1px solid var(--border); border-radius:12px; padding:1.5rem; cursor:pointer; transition:all 0.2s ease">
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
                        borderColor: '#7dd3fc',
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
                            grid: { color: alphaColor(0.05) },
                            ticks: { color: alphaColor(0.4), font: { size: 9 } }
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
                            
                            let color = alphaColor(0.03);
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
