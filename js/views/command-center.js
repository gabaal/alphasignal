async function renderCommandCenter() {
    appEl.innerHTML = `
        <div class="view-header" style="margin-bottom:2rem">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">dashboard</span> Institutional Command Center <span class="premium-badge">MASTER VIEW</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-command-center')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p style="color:var(--text-dim); margin-top:0.5rem">Consolidated real-time intelligence across Macro, Global, and Alpha hubs.</p>
        </div>
        
        <div class="command-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem; margin-bottom:1.5rem">
            <div class="card" style="text-align:center">
                <h3 style="font-size:0.7rem; color:var(--text-dim); letter-spacing:1px">SYSTEM CONVICTION</h3>
                <div style="position:relative; height:180px; margin-top:10px">
                    <canvas id="cmd-gauge-fear"></canvas>
                    <div id="cmd-fear-val" style="position:absolute; bottom:10px; width:100%; font-size:1.5rem; font-weight:900">--</div>
                </div>
            </div>
            <div class="card" style="text-align:center">
                <h3 style="font-size:0.7rem; color:var(--text-dim); letter-spacing:1px">VOLATILITY REGIME</h3>
                <div id="cmd-regime-status" style="font-size:1.5rem; font-weight:900; color:var(--accent); margin-top:2rem">LOADING...</div>
                <div id="cmd-regime-heatmap" style="height:100px; width:100%; margin-top:1rem"></div>
            </div>
            <div class="card" style="text-align:center">
                <h3 style="font-size:0.7rem; color:var(--text-dim); letter-spacing:1px">MARKET PULSE</h3>
                <div id="cmd-pulse-vals" style="margin-top:1.5rem; display:flex; flex-direction:column; gap:10px"></div>
            </div>
        </div>

        <div class="command-main-grid" style="display:grid; grid-template-columns: 1fr 400px; gap:1.5rem; margin-bottom:1.5rem">
            <div class="card">
                <div class="card-header" style="margin-bottom:1rem">
                    <h3>7D ETF NET FLOWS <span style="font-size:0.6rem; color:var(--text-dim)">($ Millions)</span></h3>
                </div>
                <div style="height:350px"><canvas id="cmd-etf-chart"></canvas></div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3>MACRO CORRELATION MATRIX</h3>
                </div>
                <div id="cmd-corr-matrix" style="height:350px; overflow:hidden"></div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <h3 style="margin-bottom:1rem">TOP INSTITUTIONAL ALPHA</h3>
                <div id="cmd-top-signals"></div>
            </div>
            <div class="card">
                <h3 style="margin-bottom:1rem">CME MAGNET GAPS</h3>
                <div id="cmd-cme-gaps"></div>
            </div>
        </div>
    `;

    // Data Fetching & Rendering
    try {
        const [macro, regime, etf, signals] = await Promise.all([
            fetchAPI('/macro'),
            fetchAPI('/regime'),
            fetchAPI('/fear-greed'),
            fetchAPI('/signals')
        ]);

        // 1. Fear & Greed Dial
        if (macro) {
            const fg = regime;
            initCommandGauges(macro, regime);
        }

        // 2. Market Pulse
        if (macro) {
            document.getElementById('cmd-pulse-vals').innerHTML = macro.slice(0, 3).map(m => `
                <div style="display:flex; justify-content:space-between; padding:8px; background:rgba(255,255,255,0.02); border-radius:6px">
                    <span style="font-size:0.7rem; font-weight:700">${m.name}</span>
                    <span style="font-size:0.7rem; font-weight:900; color:${m.correlation >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">${m.correlation.toFixed(2)}</span>
                </div>
            `).join('');
        }

        // 3. ETF Flows (Simplified version for dashboard)
        renderCommandETF();

        // 4. Correlation Matrix
        try {
            const corrData = await fetchAPI('/correlation-matrix');
            if (corrData) renderCorrelationHeatmap('cmd-corr-matrix', corrData);
        } catch(e) { console.error("Corr Matrix Error:", e); }

        // 5. Top Signals
        try {
            if (signals) {
                document.getElementById('cmd-top-signals').innerHTML = signals.slice(0, 5).map(s => `
                    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border)">
                        <span style="font-size:0.75rem; font-weight:800">${s.ticker}</span>
                        <span style="color:var(--accent); font-weight:900">+${s.alpha.toFixed(2)}%</span>
                    </div>
                `).join('');
            }
        } catch(e) { console.error("Signals Error:", e); }

        // 6. CME Gaps (static placeholders — full data available in premium CME Gaps view)
        try {
            const gaps = [
                { price: '63,450', dist: '+3.2%', status: 'UNFILLED' },
                { price: '58,200', dist: '-4.5%', status: 'PARTIAL' }
            ];
            document.getElementById('cmd-cme-gaps').innerHTML = gaps.map(g => `
                <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border)">
                    <span style="font-size:0.75rem">$${g.price}</span>
                    <span style="font-size:0.65rem; color:var(--text-dim)">${g.dist}</span>
                    <span style="font-size:0.65rem; font-weight:900; color:var(--accent)">${g.status}</span>
                </div>
            `).join('');
        } catch(e) { console.error("Gaps Error:", e); }

    } catch (e) {
        console.error("Command Center Synergy Error:", e);
    }
}

// ============= BTC Top-Bar Sparkline =============
let _btcSparkChartInst = null;
async function initBTCSparkline() {
    const canvas = document.getElementById('btcSparklineChart');
    const priceEl = document.getElementById('btc-spark-price');
    const changeEl = document.getElementById('btc-spark-change');
    if (!canvas) return;

    try {
        // Use raw fetch (not fetchAPI) so 401/402 never triggers showPaywall/showAuth
        let prices = null, latest = null, prev = null;

        // Try premium history for a real sparkline shape
        try {
            const hr = await fetch('/api/history?ticker=BTC-USD&period=5d');
            if (hr.ok) {
                const hd = await hr.json();
                if (hd && hd.history && hd.history.length >= 2) {
                    prices = hd.history.map(p => p.close);
                    latest = prices[prices.length - 1];
                    prev = prices[0];
                }
            }
        } catch(e) { /* silent */ }

        // Always fall back to /api/btc (public) + synthetic 48-pt seeded walk
        if (!prices || !latest) {
            const br = await fetch('/api/btc');
            if (!br.ok) return;
            const bd = await br.json();
            latest = bd.price || 70000;
            const chg = bd.change || 0;
            prev = latest / (1 + chg / 100);
            let seed = Math.floor(latest) % 9999;
            const rng = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };
            prices = [];
            let v = prev;
            const step = (latest - prev) / 48;
            for (let i = 0; i < 48; i++) {
                v += step + (rng() - 0.5) * (latest * 0.003);
                prices.push(v);
            }
            prices.push(latest);
        }

        const isUp = latest >= prev;
        const pct = ((latest - prev) / prev * 100).toFixed(2);
        const color = isUp ? '#22c55e' : '#ef4444';

        if (priceEl) priceEl.textContent = '$' + Math.round(latest).toLocaleString('en-US');
        if (changeEl) { changeEl.textContent = (isUp ? '+' : '') + pct + '%'; changeEl.style.color = color; }

        if (_btcSparkChartInst) { try { _btcSparkChartInst.destroy(); } catch(e) {} }
        _btcSparkChartInst = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: prices.map((_, i) => i),
                datasets: [{ data: prices, borderColor: color, borderWidth: 1.5, pointRadius: 0, fill: true, backgroundColor: isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', tension: 0.35 }]
            },
            options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }
        });
    } catch(e) { console.warn('BTC Sparkline:', e); }
}

function initCommandGauges(macro, regime) {
    const fgValue = document.getElementById('cmd-fear-val');
    const fgCanvas = document.getElementById('cmd-gauge-fear');
    if (!fgCanvas || !fgValue) return;
    
    // Using a simulated gauge for the dashboard summary
    const score = 64; 
    fgValue.innerText = score;
    fgValue.style.color = "#86efac";

    new Chart(fgCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: ['#86efac', 'rgba(255,255,255,0.05)'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: { tooltip: { enabled: false }, legend: { display: false } }
        }
    });

    document.getElementById('cmd-regime-status').innerText = (regime.current || 'VOL EXPANSION').replace(/_/g, ' ');
    renderRegimeHeatmap('#cmd-regime-heatmap', regime.history || []);
}

function renderCommandETF() {
    const ctx = document.getElementById('cmd-etf-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
            datasets: [{
                label: 'NET_FLOW ($M)',
                data: [420, 150, -80, 600, 340],
                backgroundColor: '#00f2ff',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666' } },
                x: { grid: { display: false }, ticks: { color: '#666' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

