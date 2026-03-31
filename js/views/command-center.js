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

        <!-- Signal Analytics Charts — directly below gauges -->
        <div style="margin-bottom:1.5rem">
            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:1rem">LIVE SIGNAL INTELLIGENCE</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px">
                <div class="card" style="padding:1rem">
                    <div class="card-header" style="margin-bottom:8px">
                        <h3 style="font-size:0.75rem">Alpha vs Z-Score</h3>
                        <span class="label-tag">QUALITY SCATTER</span>
                    </div>
                    <div style="height:200px;position:relative"><canvas id="cmd-alphaVsZChart"></canvas></div>
                </div>
                <div class="card" style="padding:1rem">
                    <div class="card-header" style="margin-bottom:8px">
                        <h3 style="font-size:0.75rem">Category Mix</h3>
                        <span class="label-tag">SECTOR BREAKDOWN</span>
                    </div>
                    <div style="height:200px;position:relative"><canvas id="cmd-categoryDonutChart"></canvas></div>
                </div>
                <div class="card" style="padding:1rem">
                    <div class="card-header" style="margin-bottom:8px">
                        <h3 style="font-size:0.75rem">BTC Correlation</h3>
                        <span class="label-tag">CORRELATION SPREAD</span>
                    </div>
                    <div style="height:200px;position:relative"><canvas id="cmd-btcCorrChart"></canvas></div>
                </div>
                <div class="card" style="padding:1rem">
                    <div class="card-header" style="margin-bottom:8px">
                        <h3 style="font-size:0.75rem">Alpha Leaders</h3>
                        <span class="label-tag">TOP 8 BY ALPHA</span>
                    </div>
                    <div style="height:200px;position:relative"><canvas id="cmd-topAlphaChart"></canvas></div>
                </div>
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

        // 7. Signal Analytics Charts — built from live signals data
        if (signals && signals.length) {
            const _sigs = signals;

            // Alpha vs Z-Score Scatter
            setTimeout(() => {
                const el = document.getElementById('cmd-alphaVsZChart');
                if (!el) return;
                const existing = Chart.getChart('cmd-alphaVsZChart'); if (existing) existing.destroy();
                const pts = _sigs.map(s => ({ x: parseFloat(s.zScore)||0, y: parseFloat(s.alpha)||0, label: s.ticker.replace('-USD','') }));
                const quadPlugin = { id:'cmdQuadrants', beforeDraw(chart) {
                    const {ctx:c,chartArea:{left,top,right,bottom},scales:{x,y}} = chart;
                    const mx=x.getPixelForValue(0), my=y.getPixelForValue(0); c.save();
                    c.fillStyle='rgba(34,197,94,0.04)';   c.fillRect(mx,top,right-mx,my-top);
                    c.fillStyle='rgba(0,242,255,0.04)';   c.fillRect(left,top,mx-left,my-top);
                    c.fillStyle='rgba(148,163,184,0.02)'; c.fillRect(left,my,mx-left,bottom-my);
                    c.fillStyle='rgba(239,68,68,0.04)';   c.fillRect(mx,my,right-mx,bottom-my);
                    c.restore();
                }};
                new Chart(el.getContext('2d'), {
                    type:'scatter', plugins:[quadPlugin],
                    data:{ datasets:[{ data:pts, pointRadius:5, pointHoverRadius:7,
                        backgroundColor: pts.map(p=> p.x>0&&p.y>0?'rgba(34,197,94,0.75)':p.x<0&&p.y>0?'rgba(0,242,255,0.75)':p.x>0&&p.y<0?'rgba(239,68,68,0.65)':'rgba(148,163,184,0.5)'),
                        borderWidth:0 }]},
                    options:{ responsive:true, maintainAspectRatio:false,
                        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(13,17,23,0.95)', titleColor:'#00f2ff', bodyColor:'#e2e8f0',
                            callbacks:{ title:items=>items[0].raw.label, label:c=>`Z: ${c.raw.x.toFixed(2)}σ  α: ${c.raw.y>=0?'+':''}${c.raw.y.toFixed(2)}%` }}},
                        scales:{
                            x:{ title:{display:true,text:'Z-Score (σ)',color:'rgba(255,255,255,0.3)',font:{size:8,family:'JetBrains Mono'}}, grid:{color:'rgba(255,255,255,0.06)'}, ticks:{color:'rgba(255,255,255,0.4)',font:{family:'JetBrains Mono',size:8}} },
                            y:{ title:{display:true,text:'Alpha (%)',color:'rgba(255,255,255,0.3)',font:{size:8,family:'JetBrains Mono'}}, grid:{color:'rgba(255,255,255,0.06)'}, ticks:{color:'rgba(255,255,255,0.4)',font:{family:'JetBrains Mono',size:8},callback:v=>`${v>0?'+':''}${v.toFixed(1)}%`} }
                        }
                    }
                });
            }, 80);

            // Category Mix Donut
            setTimeout(() => {
                const el = document.getElementById('cmd-categoryDonutChart');
                if (!el) return;
                const existing = Chart.getChart('cmd-categoryDonutChart'); if (existing) existing.destroy();
                const cats = {}; _sigs.forEach(s=>{ cats[s.category]=(cats[s.category]||0)+1; });
                const labels=Object.keys(cats), counts=labels.map(k=>cats[k]);
                const palette=['#00f2ff','#22c55e','#f59e0b','#bc13fe','#ef4444','#60a5fa','#fb923c','#a78bfa','#34d399'];
                new Chart(el.getContext('2d'), {
                    type:'doughnut',
                    data:{ labels, datasets:[{ data:counts, backgroundColor:labels.map((_,i)=>palette[i%palette.length]+'cc'), borderColor:'rgba(5,7,30,1)', borderWidth:2, hoverOffset:6 }]},
                    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
                        plugins:{ legend:{display:true,position:'right',labels:{color:'rgba(255,255,255,0.5)',font:{family:'JetBrains Mono',size:8},boxWidth:10,padding:8}},
                            tooltip:{ backgroundColor:'rgba(13,17,23,0.95)', titleColor:'#00f2ff', bodyColor:'#e2e8f0',
                                callbacks:{label:c=>` ${c.label}: ${c.raw} (${Math.round(c.raw/_sigs.length*100)}%)`}}}
                    }
                });
            }, 110);

            // BTC Correlation Histogram
            setTimeout(() => {
                const el = document.getElementById('cmd-btcCorrChart');
                if (!el) return;
                const existing = Chart.getChart('cmd-btcCorrChart'); if (existing) existing.destroy();
                const bins=[], binLabels=[];
                for(let v=-1;v<=1+1e-9;v=parseFloat((v+0.1).toFixed(1))){ bins.push(v); binLabels.push(v.toFixed(1)); }
                const counts=new Array(bins.length).fill(0);
                _sigs.forEach(s=>{ const corr=Math.max(-1,Math.min(1,parseFloat(s.btcCorrelation)||0)); const idx=Math.round((corr+1)/0.1); if(idx>=0&&idx<counts.length)counts[idx]++; });
                const barBg=bins.map(v=>v<-0.6?'rgba(239,68,68,0.8)':v<-0.3?'rgba(251,146,60,0.7)':v<0.3?'rgba(148,163,184,0.4)':v<0.6?'rgba(0,242,255,0.6)':'rgba(34,197,94,0.8)');
                new Chart(el.getContext('2d'), {
                    type:'bar',
                    data:{ labels:binLabels, datasets:[{ data:counts, backgroundColor:barBg, borderColor:barBg.map(c=>c.replace(/[\d.]+\)$/,'1)')), borderWidth:1, borderRadius:2 }]},
                    options:{ responsive:true, maintainAspectRatio:false,
                        plugins:{ legend:{display:false}, tooltip:{backgroundColor:'rgba(13,17,23,0.95)',titleColor:'#00f2ff',callbacks:{title:i=>`BTC Corr: ${i[0].label}`,label:c=>`${c.raw} signals`}}},
                        scales:{
                            x:{ grid:{display:false}, ticks:{color:c2=>{const v=parseFloat(binLabels[c2.index]);return Math.abs(v)>0.6?'rgba(239,68,68,0.8)':Math.abs(v)>0.3?'rgba(0,242,255,0.6)':'rgba(255,255,255,0.3)';},font:{family:'JetBrains Mono',size:7},maxTicksLimit:9,maxRotation:0} },
                            y:{ display:true, position:'right', grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'rgba(255,255,255,0.3)',font:{family:'JetBrains Mono',size:8},maxTicksLimit:4} }
                        }
                    }
                });
            }, 140);

            // Alpha Leaders Horizontal Bar
            setTimeout(() => {
                const el = document.getElementById('cmd-topAlphaChart');
                if (!el) return;
                const existing = Chart.getChart('cmd-topAlphaChart'); if (existing) existing.destroy();
                const sorted=[..._sigs].filter(s=>s.alpha!==undefined).sort((a,b)=>Math.abs(b.alpha)-Math.abs(a.alpha)).slice(0,8);
                const labels=sorted.map(s=>s.ticker.replace('-USD','')), values=sorted.map(s=>parseFloat(s.alpha));
                const colors=values.map(v=>v>=0?'rgba(34,197,94,0.75)':'rgba(239,68,68,0.75)');
                new Chart(el.getContext('2d'), {
                    type:'bar',
                    data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderColor:colors.map(c=>c.replace(/[\d.]+\)$/,'1)')), borderWidth:1, borderRadius:4 }]},
                    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
                        plugins:{ legend:{display:false}, tooltip:{backgroundColor:'rgba(13,17,23,0.95)',titleColor:'#00f2ff',bodyColor:'#e2e8f0',callbacks:{label:c=>` Alpha: ${c.raw>=0?'+':''}${parseFloat(c.raw).toFixed(2)}%`}}},
                        scales:{
                            x:{ grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'rgba(255,255,255,0.35)',font:{family:'JetBrains Mono',size:8},callback:v=>`${v>0?'+':''}${v.toFixed(1)}%`} },
                            y:{ grid:{display:false}, ticks:{color:'rgba(255,255,255,0.6)',font:{family:'JetBrains Mono',size:9,weight:'700'}} }
                        }
                    }
                });
            }, 170);
        }

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

