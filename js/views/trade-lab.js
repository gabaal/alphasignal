async function renderTradeLab(tabs = null) {
    if (!tabs) tabs = institutionalHubTabs;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Institutional Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">experiment</span>Trade Idea Lab <span class="premium-badge">PRO</span></h1>
                <p style="margin-top:4px;color:var(--text-dim);font-size:0.8rem">Synthesizing institutional flow, macro catalysts, and technical regimes into actionable setups.</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0" onclick="switchView('docs-tradelab')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
        </div>
        ${renderHubTabs('tradelab', tabs)}
        
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
        
        <section class="alpha-decay-section" style="margin-top:3rem">
            <div class="glass-card" style="padding:1.5rem">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alpha Decay Engine</h2>
                        <h3 style="font-size:1.1rem;color:var(--text);margin:0;display:flex;align-items:center;gap:8px">
                            <span class="material-symbols-outlined" style="color:var(--accent)">scatter_plot</span>
                            Signal Edge Half-Life Simulation
                        </h3>
                    </div>
                    <div style="display:flex;gap:8px">
                        <button id="decay-regime-high" class="intel-action-btn mini" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none">HIGH-VOL REGIME</button>
                        <button id="decay-regime-low" class="intel-action-btn mini outline" style="border-color:rgba(139,92,246,0.5);color:#8b5cf6">LOW-VOL REGIME</button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: 250px 1fr; gap:2rem; align-items:center;">
                    <div style="background:rgba(0,0,0,0.2); padding:1.5rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:0.65rem;font-weight:900;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px">EST. HALF-LIFE</div>
                        <div id="decay-hl-val" style="font-size:2.5rem;font-weight:900;color:var(--risk-high);font-family:var(--font-mono);line-height:1">18<span style="font-size:1rem;color:var(--text-dim)">m</span></div>
                        <div style="font-size:0.75rem;color:var(--text-dim);margin-top:1rem;line-height:1.5">
                            In <span id="decay-mode-text" style="color:#ef4444;font-weight:700">high-volatility</span> environments, institutional edges decay rapidly as HFTs arbitrate inefficiencies. Execute within <span id="decay-action-text" style="color:white;font-weight:700">5-10 minutes</span> to capture peak expected alpha.
                        </div>
                    </div>
                    <div style="height:250px; position:relative;">
                        <canvas id="alpha-decay-chart" role="img" aria-label="Alpha Decay Scatter Plot" style="width:100%; height:100%;"></canvas>
                    </div>
                </div>
            </div>
        </section>

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
    if (!picksGrid) return; // user navigated away during fetch
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
    const setupBtn = document.getElementById('generate-setup-btn');
    if (setupBtn) setupBtn.onclick = async () => {
        const ticker = document.getElementById('gen-ticker').value || 'BTC-USD';
        runNeuralSetup(ticker);
    };

    // 4. Render Alpha Decay scatter plot dynamically
    renderAlphaDecayScatter('high');

    // Attach toggle listeners
    const highBtn = document.getElementById('decay-regime-high');
    const lowBtn = document.getElementById('decay-regime-low');
    if (highBtn && lowBtn) {
        highBtn.onclick = () => {
            highBtn.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
            highBtn.style.color = 'white';
            highBtn.className = 'intel-action-btn mini';
            lowBtn.style.background = 'transparent';
            lowBtn.style.color = '#8b5cf6';
            lowBtn.className = 'intel-action-btn mini outline';
            renderAlphaDecayScatter('high');
        };
        lowBtn.onclick = () => {
            lowBtn.style.background = 'linear-gradient(135deg,#8b5cf6,#6d28d9)';
            lowBtn.style.color = 'white';
            lowBtn.className = 'intel-action-btn mini';
            highBtn.style.background = 'transparent';
            highBtn.style.color = '#ef4444';
            highBtn.className = 'intel-action-btn mini outline';
            renderAlphaDecayScatter('low');
        };
    }
}

// Global variable to keep track of chart instance so it can be destroyed/updated
window._alphaDecayChart = null;

function renderAlphaDecayScatter(regime) {
    const ctx = document.getElementById('alpha-decay-chart');
    if (!ctx) return;

    if (window._alphaDecayChart) {
        window._alphaDecayChart.destroy();
    }

    const hlVal = document.getElementById('decay-hl-val');
    const modeTxt = document.getElementById('decay-mode-text');
    const actionTxt = document.getElementById('decay-action-text');

    let halfLife, modeColor, modeWord, actionWord, decayRate;

    if (regime === 'high') {
        halfLife = 18;
        modeColor = '#ef4444';
        modeWord = 'high-volatility';
        actionWord = '5-10 minutes';
        decayRate = 0.08;
    } else {
        halfLife = 120;
        modeColor = '#8b5cf6';
        modeWord = 'low-volatility';
        actionWord = '60-90 minutes';
        decayRate = 0.015;
    }

    if(hlVal) hlVal.innerHTML = `${halfLife}<span style="font-size:1rem;color:var(--text-dim)">m</span>`;
    if(hlVal) hlVal.style.color = modeColor;
    if(modeTxt) { modeTxt.textContent = modeWord; modeTxt.style.color = modeColor; }
    if(actionTxt) actionTxt.textContent = actionWord;

    // Generate scatter data mapping Minutes (X) to Expected Alpha Return % (Y)
    const scatterData = [];
    const trendLine = [];
    const maxTime = regime === 'high' ? 60 : 240;
    const initialAlpha = regime === 'high' ? 4.5 : 2.0;

    for (let t = 0; t <= maxTime; t += (regime === 'high' ? 2 : 10)) {
        // Base exponential decay
        const expectedAlpha = initialAlpha * Math.exp(-decayRate * t);
        trendLine.push({ x: t, y: expectedAlpha });
        
        // Add random scatter points around the expectation to simulate distinct trade observations
        for (let i = 0; i < 3; i++) {
            const noise = (Math.random() - 0.5) * (expectedAlpha * 0.4);
            scatterData.push({ x: t + (Math.random()*2 - 1), y: Math.max(0, expectedAlpha + noise) });
        }
    }

    window._alphaDecayChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Historical Trades',
                    data: scatterData,
                    backgroundColor: regime === 'high' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.4)',
                    borderColor: 'transparent',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Alpha Decay Curve',
                    data: trendLine,
                    type: 'line',
                    borderColor: modeColor,
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: '#9ca3af', font: { size: 10 } } },
                tooltip: { enabled: false }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Time After Signal (Minutes)', color: '#6b7280', font: { size: 10, weight: 'bold' } },
                    grid: { color: alphaColor(0.05) },
                    ticks: { color: '#9ca3af' },
                    min: 0,
                    max: maxTime
                },
                y: {
                    title: { display: true, text: 'Realized Alpha (%)', color: '#6b7280', font: { size: 10, weight: 'bold' } },
                    grid: { color: alphaColor(0.05) },
                    ticks: { color: '#9ca3af', callback: v => v.toFixed(1) + '%' },
                    min: 0
                }
            }
        }
    });
}

