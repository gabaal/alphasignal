/**
 * AlphaSignal Institutional Hub - GEX Profile View
 * Advanced Dealer Gamma Exposure (GEX) and Hedging Dynamics.
 */

window.renderGexProfile = async function(tabs = null) {
    if (!tabs) tabs = window.analyticsHubTabs; // Default fallback
    
    // Check if we are in the Institutional Hub or Analytics Hub to highlight correct tab bar
    const activeHub = window.location.pathname.includes('institutional') ? 'institutional' : 'analytics';
    const hubTabs = activeHub === 'institutional' ? window.institutionalHubTabs : window.analyticsHubTabs;

    appEl.innerHTML = `
        <div class="view-header">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Derivatives Intelligence</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#8b5cf6">ssid_chart</span>Dealer Gamma Exposure (GEX) <span class="premium-badge">INSTITUTIONAL</span></h1>
                <p>Analyzing market maker hedging obligations. High GEX suppresses volatility (Magnets), Negative GEX amplifies cascades.</p>
            </div>
            <div style="display:flex;gap:10px;align-items:center">
                <select id="gex-ticker-select" onchange="renderGexProfile()" style="background:var(--bg-input);border:1px solid var(--border);color:white;padding:6px 12px;border-radius:8px;font-family:var(--font-mono);font-size:0.75rem">
                    <option value="BTC">BTC-USD</option>
                    <option value="ETH">ETH-USD</option>
                    <option value="SOL">SOL-USD</option>
                </select>
                <button class="intel-action-btn mini outline" onclick="switchView('docs-gex')">
                    <span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS
                </button>
            </div>
        </div>
        ${renderHubTabs('gex', hubTabs)}

        <div id="gex-loading" style="padding:4rem;text-align:center"><div class="loader"></div></div>
        
        <div id="gex-content" style="display:none">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin-bottom:1.5rem">
                <!-- Zero Gamma Pivot -->
                <div class="glass-card" style="padding:1.5rem; border-left:4px solid #8b5cf6">
                    <div style="font-size:0.6rem; font-weight:900; letter-spacing:1.5px; color:var(--text-dim); margin-bottom:0.5rem">ZERO GAMMA PIVOT</div>
                    <div id="gex-pivot" style="font-size:2.5rem; font-weight:900; color:#8b5cf6">--</div>
                    <div style="font-size:0.7rem; color:var(--text-dim); margin-top:5px">Critical volatility threshold price.</div>
                </div>
                
                <!-- Net GEX -->
                <div class="glass-card" style="padding:1.5rem">
                    <div style="font-size:0.6rem; font-weight:900; letter-spacing:1.5px; color:var(--text-dim); margin-bottom:0.5rem">NET AGGREGATE GEX</div>
                    <div id="gex-total" style="font-size:2.5rem; font-weight:900">--</div>
                    <div id="gex-regime" style="font-size:0.7rem; font-weight:700; margin-top:5px">--</div>
                </div>

                <!-- Gamma Concentration -->
                <div class="glass-card" style="padding:1.5rem">
                    <div style="font-size:0.6rem; font-weight:900; letter-spacing:1.5px; color:var(--text-dim); margin-bottom:0.5rem">HEDGING GRAVITY</div>
                    <div id="gex-gravity" style="font-size:2.5rem; font-weight:900; color:var(--accent)">--</div>
                    <div style="font-size:0.7rem; color:var(--text-dim); margin-top:5px">Concentration near ATM strikes.</div>
                </div>
            </div>

            <div class="grid-2-1" style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem">
                <div class="glass-card" style="padding:1.5rem">
                    <div class="card-header" style="margin-bottom:1.5rem">
                        <h3>Gamma Exposure Profile (By Strike)</h3>
                        <span class="label-tag">EXPIRATION: NEXT FRIDAY</span>
                    </div>
                    <div style="height:450px"><canvas id="gexProfileChart"></canvas></div>
                </div>

                <div style="display:flex; flex-direction:column; gap:1.5rem">
                    <div class="glass-card" style="padding:1.5rem">
                        <h3>Institutional Hedging Memo</h3>
                        <div id="gex-memo" style="font-size:0.8rem; line-height:1.7; color:var(--text-dim); margin-top:1rem; font-family:var(--font-mono)">
                            <div class="loader-mini"></div> Analyzing dealer positioning...
                        </div>
                    </div>
                    
                    <div class="glass-card" style="padding:1.2rem; background:rgba(139,92,246,0.05); border:1px solid rgba(139,92,246,0.2)">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:0.75rem">
                            <span class="material-symbols-outlined" style="color:#8b5cf6">info</span>
                            <h4 style="margin:0; font-size:0.75rem">How to Trade GEX</h4>
                        </div>
                        <ul style="font-size:0.65rem; color:var(--text-dim); padding-left:1.2rem; line-height:1.8">
                            <li><b>Positive GEX:</b> Market is "pinned". Volatility is sold into rallies and bought into dips. Mean reversion favored.</li>
                            <li><b>Negative GEX:</b> Market is "unstable". Dealers hedge by selling as price falls, creating recursive cascades. Momentum favored.</li>
                            <li><b>Gamma Flip:</b> The Zero Gamma Pivot marks the inflection point between these two regimes.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    const ticker = document.getElementById('gex-ticker-select')?.value || 'BTC';
    
    try {
        const data = await fetchAPI(`/gex-profile?ticker=${ticker}`);
        document.getElementById('gex-loading').style.display = 'none';
        const content = document.getElementById('gex-content');
        content.style.display = 'block';

        if (data.error) throw new Error(data.error);

        // Calculate metrics
        const totalGex = data.profile.reduce((a, b) => a + b.gamma, 0);
        const isPos = totalGex >= 0;
        
        // Find Pivot (closest strike to zero-crossing or ATM)
        const pivot = data.spot; // Simplified for synthetic
        
        document.getElementById('gex-pivot').textContent = '$' + pivot.toLocaleString();
        const totalEl = document.getElementById('gex-total');
        totalEl.textContent = (isPos ? '+' : '') + (totalGex / 1000).toFixed(1) + 'M';
        totalEl.style.color = isPos ? '#00d4aa' : '#ef4444';
        
        const regimeEl = document.getElementById('gex-regime');
        regimeEl.textContent = isPos ? 'STABLE REGIME (VOL DAMPENING)' : 'UNSTABLE REGIME (VOL AMPLIFYING)';
        regimeEl.style.color = isPos ? '#00d4aa' : '#ef4444';
        
        const gravity = Math.abs(data.profile.find(p => Math.abs(p.strike - data.spot) < 1000)?.gamma || 0);
        document.getElementById('gex-gravity').textContent = (gravity / 100).toFixed(1) + '%';

        // Render Chart
        const ctx = document.getElementById('gexProfileChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.profile.map(p => '$' + (p.strike / 1000).toFixed(0) + 'k'),
                datasets: [{
                    label: 'Gamma Exposure',
                    data: data.profile.map(p => p.gamma),
                    backgroundColor: data.profile.map(p => p.gamma >= 0 ? 'rgba(0,212,170,0.6)' : 'rgba(239,68,68,0.6)'),
                    borderColor: data.profile.map(p => p.gamma >= 0 ? '#00d4aa' : '#ef4444'),
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'JetBrains Mono', size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'JetBrains Mono', size: 10 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13,17,23,0.95)',
                        titleFont: { family: 'JetBrains Mono' },
                        bodyFont: { family: 'JetBrains Mono' },
                        borderColor: 'rgba(139,92,246,0.3)',
                        borderWidth: 1
                    }
                }
            }
        });

        // AI Memo Integration
        const memoEl = document.getElementById('gex-memo');
        const state = isPos ? 'Positive' : 'Negative';
        const impact = isPos ? 'Volatility dampening expected as dealers sell strength.' : 'Volatility amplification expected as dealers chase delta.';
        
        memoEl.innerHTML = `
            <span style="color:#8b5cf6">POSITIONING:</span> ${state} GEX Detected.<br/><br/>
            <span style="color:#8b5cf6">DYNAMICS:</span> ${impact}<br/><br/>
            <span style="color:#8b5cf6">STRATEGY:</span> ${isPos ? 'Scalp mean-reversion within gamma walls.' : 'Avoid catching knives; wait for pivot reclaim.'}
        `;

        // --- Gamma Sensitivity Matrix Implementation ---
        const matrixContainer = document.createElement('div');
        matrixContainer.className = 'glass-card';
        matrixContainer.style.marginTop = '1.5rem';
        matrixContainer.style.padding = '1.5rem';
        matrixContainer.innerHTML = `
            <div class="card-header" style="margin-bottom:1.5rem">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%">
                    <h3>Gamma Sensitivity Matrix (Projector)</h3>
                    <span class="label-tag" style="background:rgba(0,242,255,0.1); color:var(--accent)">MODE: REGIME SHIFT PREDICTION</span>
                </div>
            </div>
            <div style="overflow-x:auto">
                <table style="width:100%; border-collapse:collapse; font-size:0.7rem; font-family:var(--font-mono)">
                    <thead>
                        <tr style="color:var(--text-dim); text-align:left; border-bottom:1px solid var(--border)">
                            <th style="padding:10px">PRICE SHIFT</th>
                            <th style="padding:10px">PROJECTED PRICE</th>
                            <th style="padding:10px">EST. NET GEX</th>
                            <th style="padding:10px">REGIME STATE</th>
                            <th style="padding:10px">HEDGING DELTA</th>
                        </tr>
                    </thead>
                    <tbody id="gex-sensitivity-body"></tbody>
                </table>
            </div>
        `;
        content.appendChild(matrixContainer);

        const body = document.getElementById('gex-sensitivity-body');
        const shifts = [-10, -5, -3, -1, 0, 1, 3, 5, 10];
        
        shifts.forEach(s => {
            const projPrice = data.spot * (1 + s/100);
            
            // Simulate GEX shift: ATM bell curve moves with price
            // We approximate this by shifting the original profile's weight
            let projGex = 0;
            data.profile.forEach(p => {
                const dist = (p.strike - projPrice) / projPrice;
                const base_g = Math.exp(-(dist**2)/(2*0.05**2)) * 1000;
                let g = base_g;
                if (p.strike < projPrice) g = -Math.abs(g) * 0.8;
                else g = Math.abs(g) * 1.1;
                projGex += g;
            });

            const isProjPos = projGex >= 0;
            const regime = isProjPos ? 'STABLE' : 'UNSTABLE';
            const color = isProjPos ? 'var(--risk-low)' : 'var(--risk-high)';
            const opacity = s === 0 ? 1 : 0.6;
            const rowStyle = s === 0 ? 'background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.3)' : '';

            body.innerHTML += `
                <tr style="${rowStyle}; opacity:${opacity}">
                    <td style="padding:12px; color:${s < 0 ? 'var(--risk-high)' : s > 0 ? 'var(--risk-low)' : 'white'}">${s > 0 ? '+' : ''}${s}%</td>
                    <td style="padding:12px">$${projPrice.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                    <td style="padding:12px; color:${color}">${(isProjPos ? '+' : '')}${(projGex/1000).toFixed(1)}M</td>
                    <td style="padding:12px"><span style="background:${color}22; color:${color}; padding:2px 8px; border-radius:4px; font-size:0.6rem; font-weight:900">${regime}</span></td>
                    <td style="padding:12px; color:var(--text-dim)">${(Math.abs(projGex - totalGex) / 100).toFixed(1)}% Change</td>
                </tr>
            `;
        });

    } catch (e) {
        document.getElementById('gex-loading').innerHTML = `<div class="error-msg">GEX Load Failed: ${e.message}</div>`;
    }
}
