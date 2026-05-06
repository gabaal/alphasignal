async function renderPortfolioLab(customBasket = null, customWeights = null, tabs = null) {
    appEl.innerHTML = skeleton(1);
    let endpoint = customBasket ? `/portfolio-sim?basket=${customBasket}` : '/portfolio-sim';
    if (customWeights) endpoint += (endpoint.includes('?') ? '&' : '?') + `weights=${customWeights}`;
    const [data, optData] = await Promise.all([
        fetchAPI(endpoint),
        fetchAPI('/portfolio_optimize')
    ]);
    if (!data || !data.metrics) {
        appEl.innerHTML = `<div class="empty-state">
            <span class="material-symbols-outlined" style="font-size:3rem; color:var(--accent); margin-bottom:1rem">hourglass_empty</span>
            <p>Portfolio simulation error. Calibration in progress.</p>
        </div>`;
        return;
    }

    const universe = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'LINK-USD', 'ADA-USD', 'BNB-USD', 'XRP-USD', 'DOGE-USD', 'MATIC-USD', 'DOT-USD', 'AVAX-USD', 'LTC-USD', 'UNI-USD', 'NEAR-USD', 'APT-USD', 'ARB-USD', 'SUI-USD', 'OP-USD', 'TIA-USD', 'INJ-USD', 'WULF', 'MARA', 'RIOT', 'CLSK', 'HIVE', 'CAN', 'IREN', 'COIN', 'MSTR', 'HOOD', 'IBIT', 'SPY', 'QQQ', 'NVDA'];
    const activeBasket = (customBasket || 'BTC-USD,ETH-USD,SOL-USD,LINK-USD,ADA-USD').split(',').map(s => s.trim());
    const availableAssets = universe.filter(u => !activeBasket.includes(u));

    window._lastPortfolioExport = Object.assign({}, data.metrics);
    window._lastPortfolioExport['portfolio_assets'] = activeBasket.join('; ');
    if (optData) {
        window._lastPortfolioExport['optimal_sharpe_prob'] = optData.optimal_sharpe;
        window._lastPortfolioExport['optimal_sharpe_weights'] = optData.max_sharpe ? Object.entries(optData.max_sharpe).map(e => e[0] + ':' + (e[1]*100).toFixed(1)+'%').join('; ') : '';
        window._lastPortfolioExport['min_vol_weights'] = optData.min_vol ? Object.entries(optData.min_vol).map(e => e[0] + ':' + (e[1]*100).toFixed(1)+'%').join('; ') : '';
    }

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Institutional Hub</h2>
            <div style="display:flex; align-items:center; gap:12px; width:100%">
                <h1 style="margin:0"><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">auto_mode</span>Portfolio Optimizer <span class="premium-badge">PRO</span></h1>
                <span class="premium-badge" style="background:rgba(34,197,94,0.15); color:#4ade80; border:1px solid rgba(34,197,94,0.3); font-size:0.55rem; letter-spacing:1px" title="Simulation includes 0.1% fees and real-world orderbook slippage">REALISTIC_EXECUTION_ACTIVE</span>
                <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-portfolio-optimizer')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            </div>
            <p style="margin-top:4px">Backtesting and simulation of a dynamically rebalanced portfolio driven by Alpha Engine scores (30-min resolution with real-world slippage & fees).</p>
        </div>
        ${tabs ? renderHubTabs('optimizer', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">AI Portfolio Optimizer</h2>

        <!-- 1. Risk Metrics Row -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:1.5rem; margin-bottom: 2rem">
            <div class="card" style="padding:1.5rem; border-top: 4px solid var(--accent)">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">VALUE AT RISK (95% CI)</div>
                <div id="var-val" style="font-size:1.8rem; font-weight:900">${data.metrics.var_95 !== undefined ? data.metrics.var_95.toFixed(2) + '%' : '-'}</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">EST DAILY VAR</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid var(--risk-low)">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">PORTFOLIO BETA</div>
                <div id="beta-val" style="font-size:1.8rem; font-weight:900">${data.metrics.beta !== undefined ? data.metrics.beta.toFixed(2) : '-'}</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">VS BTC INDEX</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid #f7931a">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">SORTINO RATIO</div>
                <div id="sortino-val" style="font-size:1.8rem; font-weight:900">${data.metrics.sortino !== undefined ? data.metrics.sortino.toFixed(2) : '-'}</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">DOWNSIDE ADJ</div>
            </div>
            <div class="card" style="padding:1.5rem; border-top: 4px solid white">
                <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim); margin-bottom:10px">ANN. VOLATILITY</div>
                <div id="vol-val" style="font-size:1.8rem; font-weight:900">${data.metrics.volatility_ann !== undefined ? data.metrics.volatility_ann.toFixed(2) + '%' : '-'}</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:5px">REALIZED 30D</div>
            </div>
        </div>

        <!-- 2. Main 2-Column Dashboard -->
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:2rem; margin-bottom: 2rem">
            
            <!-- LEFT COLUMN: Charts & Input -->
            <div style="display:flex; flex-direction:column; gap:2rem">
                <div class="card" style="padding:1.5rem;  backdrop-filter:blur(10px)">
                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">EQUITY CURVE VS BENCHMARK (30D)</h3>
                    <canvas id="portfolioChart" role="img" aria-label="Portfolio allocation pie chart" style="max-height:400px"></canvas>
                </div>
                
                <div class="card" style="padding:1.5rem; background:rgba(0, 242, 255, 0.03); border:1px solid var(--accent)">
                    <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px; display:flex; justify-content:space-between; align-items:center;">
                        <span>CUSTOM PORTFOLIO BUILDER</span>
                        <label style="font-size:0.55rem; color:white; display:flex; align-items:center; gap:6px; cursor:pointer;" title="Apply ML Alpha Weightings or Equal Weight">
                            <input type="checkbox" id="ml-weight-toggle" checked>
                            <span style="font-weight:700">ML ALPHA WEIGHTINGS</span>
                        </label>
                    </h3>
                    <div style="display:flex; flex-direction:column; gap:1.5rem">
                        <!-- Asset Universe -->
                        <div>
                            <div style="font-size:0.65rem; color:var(--text-dim); margin-bottom:8px; font-weight:900; letter-spacing:1px">ASSET UNIVERSE (DRAG TO BASKET)</div>
                            <div id="asset-universe-zone" style="display:flex; flex-wrap:wrap; gap:8px; min-height:45px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; border:1px dashed rgba(255,255,255,0.1)">
                                ${availableAssets.map(a => `<div class="draggable-asset" draggable="true" data-asset="${a}" style="padding:6px 12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:100px; font-size:0.75rem; color:white; cursor:grab; user-select:none; display:flex; align-items:center; gap:4px;"><span class="material-symbols-outlined" style="font-size:12px; color:var(--text-dim)">add</span>${a.replace('-USD','')}</div>`).join('')}
                            </div>
                        </div>

                        <!-- Dropzone Basket -->
                        <div>
                            <div style="font-size:0.65rem; color:var(--accent); margin-bottom:8px; font-weight:900; letter-spacing:1px">SIMULATION BASKET (DROP HERE)</div>
                            <div id="portfolio-basket-zone" style="display:flex; flex-wrap:wrap; gap:8px; min-height:60px; padding:15px; background:rgba(0,242,255,0.05); border-radius:8px; border:1px solid rgba(0,242,255,0.2)">
                                ${activeBasket.map(a => `<div class="draggable-asset in-basket" draggable="true" data-asset="${a}" style="padding:6px 12px; background:rgba(0,242,255,0.15); border:1px solid rgba(0,242,255,0.3); border-radius:100px; font-size:0.75rem; color:#00f2ff; cursor:grab; user-select:none; display:flex; align-items:center; gap:4px; font-weight:700" onclick="removeAssetFromBasket('${a}')"><span class="material-symbols-outlined" style="font-size:12px; color:rgba(0,242,255,0.5)">close</span>${a.replace('-USD','')}</div>`).join('')}
                            </div>
                            <p style="font-size:0.65rem; color:var(--text-dim); margin-top:10px; line-height:1.4;">Drag assets to construct your portfolio. Changes trigger instantaneous ML re-calculation of VaR, Beta, and Markowitz allocation frontiers.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Analysis & Weights -->
            <div style="display:flex; flex-direction:column; gap:2rem">
                <div class="card" style="padding:1.5rem; ">

                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px; display:flex; justify-content:space-between; align-items:center;">
                        INSTITUTIONAL RISK SCORECARD
                        <div style="display:flex; gap:8px;">
                            <button onclick="exportCSV(window._lastPortfolioExport, 'portfolio_metrics')" class="intel-action-btn mini outline" style="padding:4px 8px; font-size:0.5rem; display:flex; align-items:center; gap:4px" title="Export Risk Data">CSV <span class="material-symbols-outlined" style="font-size:10px">download</span></button>
                            <button onclick="exportJSON(window._lastPortfolioExport, 'portfolio_metrics')" class="intel-action-btn mini outline" style="padding:4px 8px; font-size:0.5rem; display:flex; align-items:center; gap:4px" title="Export Risk Data">JSON <span class="material-symbols-outlined" style="font-size:10px">download</span></button>
                        </div>
                    </h3>
                    <div class="metrics-grid" style="display:grid; grid-template-columns: 1fr; gap:1.2rem">
                        <div class="metric-item">
                            <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim)">ALPHA GENERATION</div>
                            <div style="font-size:1.4rem; font-weight:900; color:${data.metrics.alpha_gen >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">
                                ${data.metrics.alpha_gen >= 0 ? '+' : ''}${data.metrics.alpha_gen.toFixed(1)}%
                            </div>
                        </div>
                        <div class="metric-item">
                            <div style="font-size:0.6rem; font-weight:900; color:var(--text-dim)">PROBABLE SHARPE</div>
                            <div id="main-sharpe" style="font-size:1.4rem; font-weight:900; color:white">${data.metrics.sharpe.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div class="card" style="padding:1.5rem; ">
                    <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">CONSTITUENT WEIGHTINGS</h3>
                    <div class="weights-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap:10px; margin-bottom: 20px">
                        ${Object.entries(data.allocation).map(([ticker, weight]) => `
                            <div style="background:${alphaColor(0.03)}; padding:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid ${alphaColor(0.05)}">
                                <span style="font-size:0.65rem; font-weight:900; color:white">${ticker.split('-')[0]}</span>
                                <div style="display:flex; align-items:center;">
                                    <input type="number" class="manual-weight-input" data-ticker="${ticker.split('-')[0]}" value="${weight.toFixed(1)}" step="0.1" min="0" max="100" style="width:40px; background:transparent; border:none; color:var(--accent); text-align:right; font-size:0.65rem; font-weight:700; outline:none;" onchange="updatePortfolioWeights()">
                                    <span style="font-size:0.65rem; color:var(--text-dim)">%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <canvas id="allocationChart" role="img" aria-label="Target allocation doughnut chart" style="max-height:160px"></canvas>
                </div>
            </div>
        </div>

        <!-- 3. Correlation Engine & AI Optimizer Section -->
        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:2rem; margin-bottom: 2rem">
            <div class="card" style="padding:1.2rem">
                <h3 style="margin-bottom:1.2rem; font-size:0.85rem; color:var(--accent); letter-spacing:1px">CROSS-ASSET CORRELATION MATRIX (30D)</h3>
                <div id="correlation-heatmap" style="min-height:280px; display:grid; gap:2px"></div>
            </div>
            
            <div class="card" style="padding:1.5rem; background:rgba(0, 242, 255, 0.04); border:1px solid rgba(0, 242, 255, 0.15)">
                <h3 style="margin-bottom:1rem; font-size:0.85rem; color:var(--accent); letter-spacing:1px">AI REBALANCE ADVISORY (MARKOWITZ-SHARPE)</h3>
                <div style="display:flex; gap:2rem; align-items:center">
                    <div style="flex:1">
                        <div id="rebalance-allocations" style="display:flex; flex-direction:column; gap:8px">
                            ${(optData && optData.allocations && optData.allocations.length > 0) ? optData.allocations.map(a => `
                                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid ${alphaColor(0.05)}">
                                    <span style="font-size:0.75rem; color:var(--text)">${a.asset}</span>
                                    <span style="font-size:0.75rem; color:var(--accent); font-weight:700">${(a.target_weight * 100).toFixed(1)}%</span>
                                </div>
                            `).join('') : `<p style="font-size:0.7rem; color:var(--risk-high); opacity:0.8">${(optData && optData.error) ? optData.error : 'Data synchronization in progress...'}</p>`}
                        </div>
                        <!-- Phase 17-C: AI Rebalancer -->
                        <button class="intel-action-btn secondary" style="margin-top:0.5rem; width:100%; background:linear-gradient(135deg,rgba(0,212,170,0.15),rgba(0,168,150,0.1)); border:1px solid rgba(0,212,170,0.3); color:#00d4aa" onclick="const s=document.getElementById('ai-rebalancer-section'); if(s){s.style.display='block';} renderAIRebalancer && renderAIRebalancer()">
                            <span class="material-symbols-outlined" style="font-size:1.1rem; vertical-align:middle; margin-right:8px">smart_toy</span>
                            AI REBALANCER (GPT MEMO)
                        </button>
                        <div id="ai-rebalancer-section" style="display:none; margin-top:1rem; padding:1rem; background:rgba(0,212,170,0.05); border:1px solid rgba(0,212,170,0.2); border-radius:8px; font-size:0.75rem; color:var(--text-dim)">
                            <div style="display:flex;align-items:center;gap:8px;color:#00d4aa;font-weight:900;margin-bottom:0.5rem"><span class="material-symbols-outlined" style="font-size:1rem;animation:spin 1s linear infinite">sync</span> Synthesizing rebalancing memo...</div>
                            <div id="ai-rebalancer-output"></div>
                        </div>
                        <div style="margin-top:1.5rem; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:0.7rem; color:var(--text-dim); font-weight:900; letter-spacing:1px">NETWORK ROUTING</span>
                            <select id="execution-routing-mode" style="background:transparent; border:1px solid var(--border); color:white; font-size:0.65rem; padding:4px 8px; border-radius:4px; font-family:'JetBrains Mono'">
                                <option value="local">LOCAL LEDGER</option>
                                <option value="binance_testnet">BINANCE TESTNET (PAPER)</option>
                            </select>
                        </div>
                        <button class="intel-action-btn" style="margin-top:0.5rem; width:100%" onclick="executeRebalance()">
                            <span class="material-symbols-outlined" style="font-size:1.1rem; vertical-align:middle; margin-right:8px">sync_alt</span>
                            EXECUTE REBALANCE
                        </button>
                    </div>
                    <div style="width:160px; height:160px">
                        <canvas id="optimizer-chart-lab" role="img" aria-label="Portfolio optimization chart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 0. Attach Drag & Drop Listeners
    const universeZone = document.getElementById('asset-universe-zone');
    const basketZone = document.getElementById('portfolio-basket-zone');

    document.querySelectorAll('.draggable-asset').forEach(el => {
        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', el.dataset.asset);
            e.dataTransfer.effectAllowed = 'move';
            el.style.opacity = '0.5';
        });
        el.addEventListener('dragend', (e) => {
            el.style.opacity = '1';
        });
    });

    [universeZone, basketZone].forEach(zone => {
        if(!zone) return;
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            zone.style.borderColor = 'var(--accent)';
        });
        zone.addEventListener('dragleave', (e) => {
            zone.style.borderColor = zone.id === 'portfolio-basket-zone' ? 'rgba(0,242,255,0.2)' : 'rgba(255,255,255,0.1)';
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = zone.id === 'portfolio-basket-zone' ? 'rgba(0,242,255,0.2)' : 'rgba(255,255,255,0.1)';
            const asset = e.dataTransfer.getData('text/plain');
            if (!asset) return;

            let currentBasketPaths = Array.from(basketZone.querySelectorAll('.draggable-asset')).map(x => x.dataset.asset);
            
            if (zone.id === 'portfolio-basket-zone') {
                if (!currentBasketPaths.includes(asset)) {
                    currentBasketPaths.push(asset);
                    renderPortfolioLab(currentBasketPaths.join(','));
                }
            } else if (zone.id === 'asset-universe-zone') {
                if (currentBasketPaths.includes(asset)) {
                    currentBasketPaths = currentBasketPaths.filter(x => x !== asset);
                    if (currentBasketPaths.length === 0) return alert('Basket cannot be empty');
                    renderPortfolioLab(currentBasketPaths.join(','));
                }
            }
        });
    });

    window.removeAssetFromBasket = function(asset) {
        let currentBasketPaths = Array.from(document.getElementById('portfolio-basket-zone').querySelectorAll('.draggable-asset')).map(x => x.dataset.asset);
        if (currentBasketPaths.includes(asset)) {
            currentBasketPaths = currentBasketPaths.filter(x => x !== asset);
            if (currentBasketPaths.length === 0) return alert('Basket cannot be empty');
            renderPortfolioLab(currentBasketPaths.join(','));
        }
    };

    window.updatePortfolioWeights = function() {
        const inputs = Array.from(document.querySelectorAll('.manual-weight-input'));
        const activeBasket = Array.from(document.getElementById('portfolio-basket-zone').querySelectorAll('.draggable-asset')).map(x => x.dataset.asset);
        
        const weightsMap = {};
        inputs.forEach(input => {
            let val = parseFloat(input.value) || 0;
            if (val < 0) val = 0;
            weightsMap[input.dataset.ticker] = val;
        });
        
        const customWeightsArray = activeBasket.map(asset => {
             const baseTicker = asset.split('-')[0];
             return weightsMap[baseTicker] || 0;
        });
        
        renderPortfolioLab(activeBasket.join(','), customWeightsArray.join(','));
    };

    window.renderAIRebalancer = async function() {
        const box = document.getElementById('ai-rebalancer-section');
        if (!box) return;
        
        box.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:#00d4aa;font-weight:900;margin-bottom:0.5rem"><span class="material-symbols-outlined spin" style="font-size:1rem;">sync</span> Synthesizing rebalancing memo...</div>`;
        const btn = document.querySelector('button[onclick*="renderAIRebalancer"]');
        if (btn) btn.disabled = true;

        try {
            const currentWeights = data.allocation || {};
            // optData.allocations is an array of {asset: 'BTC', target_weight: 0.5}
            const optimalWeights = {};
            if (optData && optData.allocations) {
                optData.allocations.forEach(a => { optimalWeights[a.asset] = parseFloat((a.target_weight * 100).toFixed(1)); });
            }

            const resp = await fetchAPI('/explain-rebalance', 'POST', {
                current_weights: currentWeights,
                optimal_weights: optimalWeights
            });

            if (resp && resp.explanation) {
                box.innerHTML = `<div style="font-size:0.65rem;font-weight:900;letter-spacing:1.5px;color:var(--accent);margin-bottom:8px">- CIO REBALANCING DIRECTIVE</div><div style="color:var(--text); font-size:1.05rem; line-height: 1.6">${resp.explanation.replace(/\n\n/g, '<br><br>')}</div>`;
            } else {
                throw new Error('Empty optimization response');
            }
        } catch (err) {
            box.innerHTML = `<span style="color:var(--risk-high)">AI Rebalancer temporarily offline.</span>`;
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    // 1. Portfolio vs Benchmark Chart
    try {
        const ctxPort = document.getElementById('portfolioChart').getContext('2d');
        new Chart(ctxPort, {
            type: 'line',
            data: {
                labels: data.history.map(h => h.date),
                datasets: [
                    {
                        label: 'ALPHA PORTFOLIO',
                        data: data.history.map(h => h.portfolio),
                        borderColor: '#00f2ff',
                        backgroundColor: 'rgba(0, 242, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 2,
                        pointBackgroundColor: '#00f2ff'
                    },
                    {
                        label: 'BTC BENCHMARK',
                        data: data.history.map(h => h.benchmark),
                        borderColor: '#f7931a',
                        borderDash: [2, 2],
                        borderWidth: 3,
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: '#9ca3af', font: { size: 10, family: 'JetBrains Mono' } } 
                    },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
                        ticks: { color: '#9ca3af', font: { size: 10, family: 'JetBrains Mono' }, callback: v => v + '%' },
                        title: { display: true, text: 'Portfolio Return (%)', color: '#9ca3af', font: { size: 9 } }
                    }
                },
                plugins: {
                    legend: { labels: { color: 'white', font: { weight: '800', size: 11 } } },
                    tooltip: { 
                        mode: 'index', 
                        intersect: false,
                        backgroundColor: 'rgba(10,11,30,0.9)',
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 }
                    }
                }
            }
        });
    } catch (e) {
        console.error("Portfolio Chart Error:", e);
    }

    // 2. Allocation Donut Chart
    try {
        const ctxAlloc = document.getElementById('allocationChart').getContext('2d');
        new Chart(ctxAlloc, {
            type: 'radar',
            data: {
                labels: Object.keys(data.allocation),
                datasets: [{
                    label: 'Allocation %',
                    data: Object.values(data.allocation),
                    backgroundColor: 'rgba(0, 242, 255, 0.2)',
                    borderColor: '#7dd3fc',
                    borderWidth: 2,
                    pointBackgroundColor: '#7dd3fc',
                    pointBorderColor: alphaColor(0.8),
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: alphaColor(0.1) },
                        grid: { color: alphaColor(0.1) },
                        pointLabels: { color: '#8b949e', font: { size: 9, family: 'JetBrains Mono' } },
                        ticks: { display: false, backdropColor: 'transparent' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(10,11,30,0.9)', titleFont: { size: 13 }, bodyFont: { size: 12 } }
                }
            }
        });
    } catch (e) {
        console.error("Allocation Chart Error:", e);
    }

    // 2.1 AI Optimizer Donut Chart (NEW)
    if (optData && optData.allocations) {
        try {
            const ctxOpt = document.getElementById('optimizer-chart-lab').getContext('2d');
            new Chart(ctxOpt, {
                type: 'doughnut',
                data: {
                    labels: optData.allocations.map(a => a.asset),
                    datasets: [{
                        data: optData.allocations.map(a => parseFloat((a.target_weight * 100).toFixed(1))),
                        backgroundColor: ['#facc15', '#60a5fa', '#22c55e', '#ef5350', '#8b5cf6'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } catch (e) {
            console.error("Optimizer Chart Error:", e);
        }
    }

    // 3. Correlation Heatmap
    if (data.metrics && data.metrics.correlation_matrix) {
        const matrixObj = data.metrics.correlation_matrix;
        const container = document.getElementById('correlation-heatmap');
        if (container) {
            const assets = Object.keys(matrixObj);
            const n = assets.length;
            container.style.gridTemplateColumns = `auto repeat(${n}, 1fr)`;
            
            let html = `<div></div>`; // Top left empty
            assets.forEach(a => html += `<div style="font-size:0.55rem; color:var(--text-dim); text-align:center; padding-bottom:5px; font-weight:700">${a.replace('-USD','')}</div>`);
            
            assets.forEach(row => {
                html += `<div style="font-size:0.55rem; color:var(--text-dim); display:flex; align-items:center; padding-right:5px; font-weight:700">${row.replace('-USD','')}</div>`;
                assets.forEach(col => {
                    const val = matrixObj[row][col];
                    let bg, textColor;
                    if (val === 1.0) { bg = `rgba(0, 242, 255, 0.4)`; textColor = 'white'; }
                    else if (val > 0) { bg = `rgba(0, 242, 255, ${val * 0.6})`; textColor = val > 0.4 ? 'black' : 'var(--text-dim)'; }
                    else { bg = `rgba(255, 80, 80, ${Math.abs(val) * 0.6})`; textColor = Math.abs(val) > 0.4 ? 'black' : 'var(--text-dim)'; }
                    
                    html += `<div style="background:${bg}; color:${textColor}; font-size:0.6rem; font-weight:800; display:flex; align-items:center; justify-content:center; border-radius:4px; height: 35px;">${val.toFixed(2)}</div>`;
                });
            });
            container.innerHTML = html;
        }
    }

    // 4. Efficient Frontier - load async after initial render
    setTimeout(async () => {
        // Inject the frontier container into appEl
        const existingFrontier = document.getElementById('efficient-frontier-section');
        if (!existingFrontier) {
            const efSection = document.createElement('div');
            efSection.id = 'efficient-frontier-section';
            efSection.innerHTML = `
                <div class="card" style="padding:1.5rem; margin-bottom:2rem;  border:1px solid rgba(0,242,255,0.15);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
                        <h3 style="font-size:0.9rem; color:var(--accent); letter-spacing:1px; margin:0;">
                            <span class="material-symbols-outlined" style="vertical-align:middle; margin-right:6px; font-size:1.1rem;">scatter_plot</span>
                            MARKOWITZ EFFICIENT FRONTIER
                            <span class="premium-badge pulse" style="margin-left:8px;">PRO</span>
                        </h3>
                        <span style="font-size:0.55rem; color:var(--text-dim);">2,000 MONTE CARLO SIMULATIONS</span>
                    </div>
                    <div id="ef-loading" style="text-align:center; padding:3rem; color:var(--text-dim); font-size:0.7rem;">
                        <div class="loader" style="margin:0 auto 1rem;"></div>
                        Running Monte Carlo simulations...
                    </div>
                    <canvas id="frontierChart" role="img" aria-label="Efficient frontier portfolio chart" style="display:none; max-height:420px;"></canvas>
                    <div id="frontier-optimal-cards" style="display:none; display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-top:1.5rem;"></div>
                </div>`;
            appEl.appendChild(efSection);
        }

        try {
            const basket = customBasket || 'BTC-USD,ETH-USD,SOL-USD,LINK-USD,ADA-USD';
            const ef = await fetchAPI(`/efficient-frontier?basket=${encodeURIComponent(basket)}`);
            const loadingEl = document.getElementById('ef-loading');
            const chartEl = document.getElementById('frontierChart');
            const cardsEl = document.getElementById('frontier-optimal-cards');

            if (!ef || !ef.points || ef.points.length === 0) {
                if (loadingEl) loadingEl.innerHTML = `<span style="color:var(--risk-high)">${ef?.error || 'Frontier calculation failed.'}</span>`;
                return;
            }

            if (loadingEl) loadingEl.style.display = 'none';
            if (chartEl) chartEl.style.display = 'block';

            // If user navigated away while loading, abort rendering
            if (!document.getElementById('frontierChart')) return;

            // Build scatter dataset colored by Sharpe
            const minSharpe = Math.min(...ef.points.map(p => p.sharpe));
            const maxSharpe = Math.max(...ef.points.map(p => p.sharpe));
            const sharpeRange = maxSharpe - minSharpe || 1;

            function sharpeColor(s) {
                const t = (s - minSharpe) / sharpeRange;
                const r = Math.round(239 * (1 - t));
                const g = Math.round(80 + 166 * t);
                return `rgba(${r},${g},80,0.7)`;
            }

            const ctx = document.getElementById('frontierChart').getContext('2d');
            new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Simulated Portfolios',
                            data: ef.points.map(p => ({ x: p.vol, y: p.ret })),
                            backgroundColor: ef.points.map(p => sharpeColor(p.sharpe)),
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            order: 2
                        },
                        ef.max_sharpe ? {
                            label: '- Max Sharpe',
                            data: [{ x: ef.max_sharpe.vol, y: ef.max_sharpe.ret }],
                            backgroundColor: '#7dd3fc',
                            pointBackgroundColor: '#7dd3fc',
                            borderColor: '#ffffff',
                            pointBorderColor: '#ffffff',
                            borderWidth: 2,
                            pointRadius: 12,
                            pointStyle: 'star',
                            pointHoverRadius: 14,
                            order: 0
                        } : null,
                        ef.min_vol ? {
                            label: '- Min Volatility',
                            data: [{ x: ef.min_vol.vol, y: ef.min_vol.ret }],
                            backgroundColor: '#ffffff',
                            pointBackgroundColor: '#ffffff',
                            borderColor: '#3b82f6',
                            pointBorderColor: '#3b82f6',
                            borderWidth: 2,
                            pointRadius: 12,
                            pointStyle: 'star',
                            pointHoverRadius: 14,
                            order: 1
                        } : null,
                    ].filter(Boolean)
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'white', font: { family: 'JetBrains Mono', size: 10 } } },
                        tooltip: {
                            backgroundColor: 'rgba(5,5,30,0.95)',
                            titleColor: '#7dd3fc',
                            bodyColor: '#e6edf3',
                            callbacks: {
                                label: ctx => `Vol: ${ctx.parsed.x.toFixed(1)}%  Ret: ${ctx.parsed.y.toFixed(1)}%`
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Annualised Volatility (%)', color: '#9ca3af', font: { size: 10 } },
                            grid: { color: alphaColor(0.04) },
                            ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 9 }, callback: v => v + '%' }
                        },
                        y: {
                            title: { display: true, text: 'Annualised Return (%)', color: '#9ca3af', font: { size: 10 } },
                            grid: { color: alphaColor(0.04) },
                            ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono', size: 9 }, callback: v => v + '%' }
                        }
                    }
                }
            });

            // Optimal portfolio weight cards
            if (cardsEl && ef.max_sharpe && ef.min_vol) {
                cardsEl.style.display = 'grid';
                const renderWeights = (p, label, color) => `
                    <div style=" border:1px solid ${color}33; border-radius:10px; padding:1.2rem;">
                        <div style="font-size:0.6rem; font-weight:900; color:${color}; margin-bottom:0.8rem; letter-spacing:1px;">${label}</div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:0.8rem;">
                            ${Object.entries(p.weights).map(([asset, w]) => `
                                <div style="background:${alphaColor(0.05)}; border-radius:6px; padding:6px 10px; font-size:0.65rem;">
                                    <span style="color:white; font-weight:900;">${asset}</span>
                                    <span style="color:${color}; margin-left:6px;">${(w * 100).toFixed(1)}%</span>
                                </div>`).join('')}
                        </div>
                        <div style="display:flex; gap:1.5rem; font-size:0.65rem; color:var(--text-dim);">
                            <span>Ret: <b style="color:white;">${p.ret.toFixed(1)}%</b></span>
                            <span>Vol: <b style="color:white;">${p.vol.toFixed(1)}%</b></span>
                            <span>Sharpe: <b style="color:${color};">${p.sharpe.toFixed(2)}</b></span>
                        </div>
                    </div>`;
                cardsEl.innerHTML =
                    renderWeights(ef.max_sharpe, '- MAXIMUM SHARPE RATIO PORTFOLIO', '#7dd3fc') +
                    renderWeights(ef.min_vol, '- MINIMUM VOLATILITY PORTFOLIO', '#ffffff');
            }
        } catch (e) {
            console.error('Efficient Frontier render error:', e);
        }
    }, 800);

    // Render Phase 6 Correlation Array
    if (typeof loadCorrelationMatrix === 'function') {
        loadCorrelationMatrix(activeBasket.join(','), 'correlation-heatmap', '/portfolio/correlations');
    }
}

window.executeRebalance = async function() {
    if (!confirm("CONFIRM_EXECUTION: Are you sure you want to dispatch rebalancing tickets to the institutional ledger?")) return;
    
    let activeBasket = 'BTC-USD,ETH-USD,SOL-USD,LINK-USD,ADA-USD';
    const zone = document.getElementById('portfolio-basket-zone');
    if (zone) {
        const assets = Array.from(zone.querySelectorAll('.draggable-asset')).map(x => x.dataset.asset);
        if (assets.length > 0) activeBasket = assets.join(',');
    }
    
    try {
        const res = await fetchAPI('/portfolio/execute', 'POST', { 
            email: localStorage.getItem('user_email') || 'geraldbaalham@live.co.uk',
            basket: activeBasket,
            mode: document.getElementById('execution-routing-mode')?.value || 'local'
        });
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
};
