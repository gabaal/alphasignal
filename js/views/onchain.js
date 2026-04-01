async function renderOnChain(tabs = null) {
    if (!tabs) tabs = analyticsHubTabs;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">analytics</span>Analytics Hub <span class="premium-badge">ON-CHAIN</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-onchain')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                <p>Institutional macroeconomic network valuation indicators.</p>
            </div>
        </div>
        ${tabs ? renderHubTabs('onchain', tabs) : ''}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">On-Chain Analytics Suite</h2>

        <!-- Zoom Modal -->
        <div id="onchain-modal" onclick="if(event.target===this)closeOnchainModal()"
            style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(12px);z-index:3000;align-items:center;justify-content:center;padding:2rem">
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:1.5rem;width:100%;max-width:1100px;position:relative">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                    <div>
                        <div id="onchain-modal-title" style="font-size:0.9rem;font-weight:900;color:var(--accent);letter-spacing:1px"></div>
                        <div id="onchain-modal-sub" style="font-size:0.55rem;color:var(--text-dim);letter-spacing:2px;margin-top:3px"></div>
                    </div>
                    <button onclick="closeOnchainModal()" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.75rem;font-weight:700">âœ• CLOSE</button>
                </div>
                <div id="onchain-modal-chart" style="height:65vh;width:100%"></div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap:1rem; margin-bottom:1rem">
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('mvrv')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">MVRV Z-Score</h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Highlights periods where market value is significantly higher/lower than realized value.</p>
                <div id="mvrv-chart" style="width:100%; height:300px"></div>
            </div>
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('realized')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">Realized Price vs Spot</h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Average on-chain cost basis vs current Spot price.</p>
                <div id="realized-chart" style="width:100%; height:300px"></div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap:1rem; margin-bottom:1rem">
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('sopr')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">SOPR</h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Aggregate profit/loss ratio of spent coins. 1.0 = Breakeven.</p>
                <div id="sopr-chart" style="width:100%; height:250px"></div>
            </div>
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('puell')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">Puell Multiple</h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Miner revenue compared to its 365-day moving average.</p>
                <div id="puell-chart" style="width:100%; height:250px"></div>
            </div>
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('nvt')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">NVT Ratio</h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Network Value to Transactions (The P/E of Crypto).</p>
                <div id="nvt-chart" style="width:100%; height:250px"></div>
            </div>
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('hash')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">Hash Ribbons <span style="font-size:0.8rem;color:var(--text-dim)">(Miner Capitulation)</span></h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">When the 30D Hash (Orange) drops below 60D (White), Miners are capitulating.</p>
                <div id="hash-chart" style="width:100%; height:250px"></div>
            </div>
        </div>

        <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:2rem 0 1.5rem">Investor Sentiment Suite</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap:1rem; margin-bottom:1rem">
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('sentiment')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">Investor Sentiment Index</h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Composite score from MVRV, SOPR &amp; Puell. Above 0 = Greed, Below 0 = Fear.</p>
                <div id="sentiment-chart" style="width:100%; height:300px"></div>
            </div>
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('cvd')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">Cumulative Volume Delta</h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Aggregated buy vs sell pressure. Rising = buyers in control, falling = sellers dominating.</p>
                <div id="cvd-chart" style="width:100%; height:300px"></div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap:1rem; margin-bottom:1rem">
            <div class="card" style="padding:1.5rem;cursor:zoom-in;transition:border-color 0.2s" onclick="openOnchainModal('exchflow')" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <h3 style="margin:0">Exchange Net Flow</h3>
                    <span style="font-size:0.5rem;color:rgba(0,242,255,0.5);letter-spacing:2px;font-weight:700">CLICK TO EXPAND</span>
                </div>
                <p style="color:var(--text-dim); font-size:0.8rem; margin-bottom:1rem">Net coin movement to/from exchanges. Negative (green) = outflow = holding sentiment.</p>
                <div id="exchflow-chart" style="width:100%; height:250px"></div>
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
        window._onchainData = data; // cache for modal

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

        // â”€â”€ Investor Sentiment Index (composite: normalize MVRV + SOPR + Puell) â”€â”€
        const sentimentData = (() => {
            const mvrvVals  = data.map(d => d.mvrv);
            const soprVals  = data.map(d => d.sopr);
            const puellVals = data.map(d => d.puell);
            const norm = (arr, lo, hi) => arr.map(v => ((v - lo) / Math.max(hi - lo, 0.001)) * 200 - 100);
            const mvrvN  = norm(mvrvVals,  Math.min(...mvrvVals),  Math.max(...mvrvVals));
            const soprN  = norm(soprVals,  Math.min(...soprVals),  Math.max(...soprVals));
            const puellN = norm(puellVals, Math.min(...puellVals), Math.max(...puellVals));
            return data.map((d, i) => ({ time: d.time, value: parseFloat(((mvrvN[i] + soprN[i] + puellN[i]) / 3).toFixed(2)) }));
        })();
        const sentimentContainer = document.getElementById('sentiment-chart');
        const sentimentChart = LightweightCharts.createChart(sentimentContainer, chartOpts(300));
        const sentSeries = sentimentChart.addAreaSeries({ topColor: 'rgba(0,212,170,0.35)', bottomColor: 'rgba(239,68,68,0.15)', lineColor: '#00d4aa', lineWidth: 2, title: 'Sentiment' });
        sentSeries.setData(sentimentData);
        // Zero baseline
        sentimentChart.addLineSeries({ color: 'rgba(255,255,255,0.2)', lineWidth: 1, lineStyle: 2 }).setData(data.map(d => ({ time: d.time, value: 0 })));

        // â”€â”€ CVD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const cvdContainer = document.getElementById('cvd-chart');
        const cvdChart = LightweightCharts.createChart(cvdContainer, chartOpts(300));
        cvdChart.addAreaSeries({ topColor: 'rgba(96,165,250,0.4)', bottomColor: 'rgba(96,165,250,0.05)', lineColor: '#60a5fa', lineWidth: 2, title: 'CVD' })
                .setData(data.map(d => ({ time: d.time, value: d.cvd })));

        // â”€â”€ Exchange Net Flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const exchflowContainer = document.getElementById('exchflow-chart');
        const exchflowChart = LightweightCharts.createChart(exchflowContainer, chartOpts(250));
        exchflowChart.addHistogramSeries({ priceFormat: { type: 'price', precision: 0 } })
            .setData(data.map(d => ({ time: d.time, value: d.exch_flow, color: d.exch_flow < 0 ? '#10b981' : '#ef4444' })));
        
        // Resizing
        const charts = [
            { c: mvrvChart,       id: 'mvrv-chart',      h: 300 },
            { c: realizedChart,   id: 'realized-chart',  h: 300 },
            { c: soprChart,       id: 'sopr-chart',      h: 250 },
            { c: puellChart,      id: 'puell-chart',     h: 250 },
            { c: nvtChart,        id: 'nvt-chart',       h: 250 },
            { c: hashChart,       id: 'hash-chart',      h: 250 },
            { c: sentimentChart,  id: 'sentiment-chart', h: 300 },
            { c: cvdChart,        id: 'cvd-chart',       h: 300 },
            { c: exchflowChart,   id: 'exchflow-chart',  h: 250 }
        ];
        
        const ro = new ResizeObserver(entries => {
            entries.forEach(e => {
                const target = charts.find(x => x.id === e.target.id);
                if(target) target.c.resize(e.contentRect.width, target.h);
            });
        });
        
        const containers = [mvrvContainer, realizedContainer, soprContainer, puellContainer, nvtContainer, hashContainer, sentimentContainer, cvdContainer, exchflowContainer];
        containers.forEach(cn => ro.observe(cn));
        charts.forEach(ch => ch.c.timeScale().fitContent());

    } catch (e) {
        const el = document.getElementById('mvrv-chart');
        if (el) el.innerHTML = `<div class="error-msg">Failed to load On-Chain data: ${e.message}</div>`;
    }
}

function openOnchainModal(type) {
    const data = window._onchainData;
    if (!data) return;
    const modal = document.getElementById('onchain-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const configs = {
        mvrv:      { title: 'MVRV Z-SCORE', sub: 'MARKET VALUE VS REALISED VALUE â€” 365D' },
        realized:  { title: 'REALIZED PRICE VS SPOT', sub: 'ON-CHAIN COST BASIS vs CURRENT PRICE' },
        sopr:      { title: 'SOPR â€” SPENT OUTPUT PROFIT RATIO', sub: '1.0 = BREAKEVEN THRESHOLD' },
        puell:     { title: 'PUELL MULTIPLE', sub: 'MINER REVENUE / 365D MA' },
        nvt:       { title: 'NVT RATIO', sub: 'NETWORK VALUE TO TRANSACTIONS (P/E OF CRYPTO)' },
        hash:      { title: 'HASH RIBBONS', sub: '30D VS 60D HASHRATE â€” MINER CAPITULATION SIGNAL' },
        sentiment: { title: 'INVESTOR SENTIMENT INDEX', sub: 'COMPOSITE SCORE: MVRV + SOPR + PUELL â€” ABOVE 0 = GREED, BELOW 0 = FEAR' },
        cvd:       { title: 'CUMULATIVE VOLUME DELTA', sub: 'AGGREGATED BUY VS SELL PRESSURE OVER TIME' },
        exchflow:  { title: 'EXCHANGE NET FLOW', sub: 'GREEN = OUTFLOW (BULLISH) Â· RED = INFLOW (SELLING PRESSURE)' }
    };
    const cfg = configs[type] || { title: type.toUpperCase(), sub: '' };
    document.getElementById('onchain-modal-title').textContent = cfg.title;
    document.getElementById('onchain-modal-sub').textContent = cfg.sub;

    const container = document.getElementById('onchain-modal-chart');
    container.innerHTML = '';
    if (container._lwChart) { try { container._lwChart.remove(); } catch(e){} }

    const opts = { layout: { background: { color: '#09090b' }, textColor: '#d1d5db', fontFamily: 'JetBrains Mono' }, grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } }, width: container.clientWidth, height: container.clientHeight };
    const chart = LightweightCharts.createChart(container, opts);
    container._lwChart = chart;

    if (type === 'mvrv') {
        chart.addAreaSeries({ topColor: 'rgba(239,83,80,0.4)', bottomColor: 'rgba(38,166,154,0.1)', lineColor: '#ef5350', lineWidth: 2 }).setData(data.map(d=>({time:d.time,value:d.mvrv})));
    } else if (type === 'realized') {
        chart.addLineSeries({ color: 'rgba(255,255,255,0.8)', lineWidth: 2, title: 'Spot' }).setData(data.map(d=>({time:d.time,value:d.price})));
        chart.addLineSeries({ color: '#f97316', lineWidth: 2, title: 'Realized' }).setData(data.map(d=>({time:d.time,value:d.realized})));
    } else if (type === 'sopr') {
        chart.addAreaSeries({ topColor: 'rgba(16,185,129,0.4)', bottomColor: 'rgba(16,185,129,0)', lineColor: '#10b981', lineWidth: 2 }).setData(data.map(d=>({time:d.time,value:d.sopr})));
    } else if (type === 'puell') {
        chart.addAreaSeries({ topColor: 'rgba(139,92,246,0.4)', bottomColor: 'rgba(139,92,246,0)', lineColor: '#8b5cf6', lineWidth: 2 }).setData(data.map(d=>({time:d.time,value:d.puell})));
    } else if (type === 'nvt') {
        chart.addLineSeries({ color: '#facc15', lineWidth: 2 }).setData(data.map(d=>({time:d.time,value:d.nvt})));
    } else if (type === 'hash') {
        chart.addLineSeries({ color: '#f7931a', lineWidth: 2, title: '30D' }).setData(data.map(d=>({time:d.time,value:d.hash_fast})));
        chart.addLineSeries({ color: 'rgba(255,255,255,0.4)', lineWidth: 2, title: '60D' }).setData(data.map(d=>({time:d.time,value:d.hash_slow})));
    } else if (type === 'sentiment') {
        const mv = data.map(d => d.mvrv), sp = data.map(d => d.sopr), pu = data.map(d => d.puell);
        const norm = (arr) => { const lo = Math.min(...arr), hi = Math.max(...arr); return arr.map(v => ((v-lo)/Math.max(hi-lo,0.001))*200-100); };
        const mn = norm(mv), sn = norm(sp), pn = norm(pu);
        const sd = data.map((d,i) => ({ time: d.time, value: parseFloat(((mn[i]+sn[i]+pn[i])/3).toFixed(2)) }));
        chart.addAreaSeries({ topColor: 'rgba(0,212,170,0.35)', bottomColor: 'rgba(239,68,68,0.15)', lineColor: '#00d4aa', lineWidth: 2 }).setData(sd);
        chart.addLineSeries({ color: 'rgba(255,255,255,0.2)', lineWidth: 1, lineStyle: 2 }).setData(data.map(d => ({ time: d.time, value: 0 })));
    } else if (type === 'cvd') {
        chart.addAreaSeries({ topColor: 'rgba(96,165,250,0.4)', bottomColor: 'rgba(96,165,250,0.05)', lineColor: '#60a5fa', lineWidth: 2 }).setData(data.map(d=>({time:d.time,value:d.cvd})));
    } else if (type === 'exchflow') {
        chart.addHistogramSeries({ priceFormat: { type: 'price', precision: 0 } }).setData(data.map(d=>({ time:d.time, value:d.exch_flow, color: d.exch_flow < 0 ? '#10b981' : '#ef4444' })));
    }
    chart.timeScale().fitContent();

    // Resize on window resize
    window._onchainModalRO = new ResizeObserver(() => {
        chart.resize(container.clientWidth, container.clientHeight);
    });
    window._onchainModalRO.observe(container);
}

function closeOnchainModal() {
    const modal = document.getElementById('onchain-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    const container = document.getElementById('onchain-modal-chart');
    if (container && container._lwChart) { try { container._lwChart.remove(); } catch(e){} container._lwChart = null; }
    if (window._onchainModalRO) { window._onchainModalRO.disconnect(); window._onchainModalRO = null; }
}


// ================================================================
// Phase 16-E: Backtester V2 â€” Real Signal History + Live Prices
// ================================================================

async function renderBacktesterV2(tabs = null) {
    if (!tabs) tabs = alphaHubTabs;
    appEl.innerHTML = `
        ${renderHubTabs('backtester', tabs)}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Signal Backtester V2</h2>
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-backtester')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                <p>Walk-forward simulation on live institutional signals with real price data, rolling Sharpe, and BTC benchmark.</p>
            </div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                <label style="font-size:0.7rem;color:var(--text-dim)">HOLD PERIOD</label>
                <select id="btv2-hold" style="background:var(--card-bg);color:var(--text);border:1px solid var(--border);padding:6px 12px;border-radius:6px;font-size:0.75rem">
                    <option value="3">3 Days</option><option value="5" selected>5 Days</option>
                    <option value="10">10 Days</option><option value="20">20 Days</option>
                </select>
                <button onclick="loadBacktesterV2()" style="background:linear-gradient(135deg,#00d4aa,#00a896);color:#000;border:none;padding:8px 18px;border-radius:8px;font-weight:800;font-size:0.75rem;cursor:pointer;letter-spacing:1px">RUN BACKTEST</button>
            </div>
        </div>
        <div id="btv2-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:1.5rem">
            ${['Win Rate','Total Trades','Total Return','Sharpe','Max Drawdown','Profit Factor','Calmar','Consec. Wins','Consec. Losses'].map(s =>
                '<div class="glass-card" style="padding:1rem;text-align:center"><div style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:4px">' + s.toUpperCase() + '</div><div class="btv2-stat" id="btv2-' + s.toLowerCase().replace(/[\s.]+/g,'-').replace(/-+/g,'-') + '" style="font-size:1.3rem;font-weight:800;color:#00d4aa">--</div></div>'
            ).join('')}
        </div>
        <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
                <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim)">ROLLING 30-DAY SHARPE + CUMULATIVE RETURN</div>
                <div style="display:flex;gap:12px;font-size:0.65rem">
                    <span style="color:#00d4aa">&#9632; Strategy</span>
                    <span style="color:#f7931a">&#9632; BTC Benchmark</span>
                    <span style="color:#bc13fe">&#9632; Rolling Sharpe</span>
                </div>
            </div>
            <canvas id="btv2-sharpe-chart" height="280"></canvas>
        </div>
        <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem">
            <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">MONTHLY P&L CALENDAR</div>
            <div id="btv2-calendar" style="display:flex;flex-wrap:wrap;gap:6px"></div>
        </div>
        <div class="glass-card" style="padding:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:1rem">
                <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim)">RECENT TRADE LOG (Last 50)</div>
                <button class="btv2-export-btn" onclick="window._btv2ExportCSV()">
                    <span class="material-symbols-outlined" style="font-size:13px">download</span> EXPORT TRADES CSV
                </button>
            </div>
            <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:separate;border-spacing:0 4px;font-size:0.75rem">
                    <thead><tr style="color:var(--text-dim)">${['Ticker','Signal','Entry','Exit','Entry $','Exit $','Strat P&L','BTC P&L','Alpha'].map(h => '<th style="text-align:left;padding:6px 10px;font-size:0.6rem;letter-spacing:1px;white-space:nowrap">' + h + '</th>').join('')}</tr></thead>
                    <tbody id="btv2-tbody"><tr><td colspan="9" style="padding:2rem;text-align:center;color:var(--text-dim)">Click RUN BACKTEST to load</td></tr></tbody>
                </table>
            </div>
        </div>
    `;
    // Don't auto-run â€” let the user click RUN BACKTEST (avoids blank chart when no data)
}

async function loadBacktesterV2() {
    const hold = document.getElementById('btv2-hold') ? document.getElementById('btv2-hold').value : '5';
    ['win-rate','total-trades','total-return','sharpe','max-drawdown','profit-factor','calmar'].forEach(id => {
        const el = document.getElementById('btv2-' + id);
        if (el) el.innerHTML = '<span style="font-size:0.8rem;color:var(--text-dim)">...</span>';
    });
    try {
        const data = await fetchAPI('/backtest-v2?hold=' + hold + '&limit=200');
        // Show error toast for any error condition
        if (data.error || !data.trades || !data.trades.length) {
            const msg = data.error || 'No signal history yet. Signals generate automatically as the system runs.';
            showToast('BACKTESTER', msg, 'alert');
            // Show friendly empty state in table
            const tbody = document.getElementById('btv2-tbody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.8rem">
                <span class="material-symbols-outlined" style="display:block;font-size:2rem;margin-bottom:8px;color:var(--border)">bar_chart</span>
                ${msg}<br><span style="font-size:0.7rem;margin-top:6px;display:block">Signals are logged automatically. Check back once the system has run for a few hours.</span>
            </td></tr>`;
            // Reset stat displays to dashes
            ['win-rate','total-trades','total-return','sharpe','max-drawdown','profit-factor','calmar','consec--wins','consec--losses'].forEach(id => {
                const el = document.getElementById('btv2-' + id); if (el) { el.textContent = '--'; el.style.color = 'var(--text-dim)'; }
            });
            return;
        }
        const s = data.stats || {};
        const statMap = {
            'win-rate':      { val: (s.win_rate != null ? s.win_rate + '%' : '--'),        color: (s.win_rate||0) >= 55 ? '#22c55e' : '#ef4444' },
            'total-trades':  { val: s.total_trades != null ? s.total_trades : '--',         color: '#fff' },
            'total-return':  { val: (s.total_return != null ? ((s.total_return>=0?'+':'') + s.total_return + '%') : '--'), color: (s.total_return||0) >= 0 ? '#22c55e' : '#ef4444' },
            'sharpe':        { val: s.sharpe != null ? s.sharpe : '--',                    color: (s.sharpe||0) >= 1 ? '#00d4aa' : (s.sharpe||0) >= 0 ? '#ffd700' : '#ef4444' },
            'max-drawdown':  { val: s.max_drawdown != null ? '-' + s.max_drawdown + '%' : '--', color: '#ef4444' },
            'profit-factor': { val: s.profit_factor != null ? s.profit_factor : '--',      color: (s.profit_factor||0) >= 1.5 ? '#22c55e' : '#ffd700' },
            'calmar':        { val: s.calmar != null ? s.calmar : '--',                    color: (s.calmar||0) >= 1 ? '#00d4aa' : '#ffd700' }
        };
        Object.keys(statMap).forEach(function(id) {
            var item = statMap[id];
            var el = document.getElementById('btv2-' + id);
            if (el) { el.textContent = item.val; el.style.color = item.color; }
        });
        if (data.rolling_sharpe && data.rolling_sharpe.length) renderBtv2Chart(data.rolling_sharpe);
        if (data.monthly_returns) renderBtv2Calendar(data.monthly_returns);
        if (data.trades && data.trades.length) {
            // Compute consecutive wins/losses from sorted trades
            const sorted = data.trades.slice().sort((a,b) => a.entry_date.localeCompare(b.entry_date));
            let maxWins = 0, maxLoss = 0, curWin = 0, curLoss = 0;
            sorted.forEach(t => {
                if (t.pnl_pct >= 0) { curWin++; curLoss = 0; maxWins = Math.max(maxWins, curWin); }
                else { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
            });
            const elW = document.getElementById('btv2-consec--wins');
            const elL = document.getElementById('btv2-consec--losses');
            if (elW) { elW.textContent = maxWins; elW.style.color = '#22c55e'; }
            if (elL) { elL.textContent = maxLoss; elL.style.color = '#ef4444'; }
            // Cache for CSV export
            window.lastBacktestData = data.trades;
            window._btv2ExportCSV = function() {
                if (!window.lastBacktestData || !window.lastBacktestData.length) {
                    showToast('EXPORT', 'Run backtest first to generate data.', 'alert'); return;
                }
                exportCSV(window.lastBacktestData, `alphasignal_backtest_${new Date().toISOString().split('T')[0]}.csv`);
                showToast('EXPORT', 'Backtest trades exported as CSV.', 'success');
            };
            renderBtv2Table(data.trades.slice().reverse());
        }
    } catch(e) {
        showToast('BACKTESTER', 'Failed: ' + e.message, 'alert');
    }
}

function renderBtv2Chart(rolling) {
    var ctx = document.getElementById('btv2-sharpe-chart');
    if (!ctx) return;
    if (ctx._chart) ctx._chart.destroy();
    ctx._chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rolling.map(function(r) { return r.date; }),
            datasets: [
                { label: 'Strategy (%)', data: rolling.map(function(r){return r.strat_cumulative;}), borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)', fill: true, tension: 0.4, pointRadius: 0, yAxisID: 'y1' },
                { label: 'BTC (%)', data: rolling.map(function(r){return r.btc_cumulative;}), borderColor: '#f7931a', borderDash: [4,3], fill: false, tension: 0.4, pointRadius: 0, yAxisID: 'y1' },
                { label: 'Rolling Sharpe', data: rolling.map(function(r){return r.sharpe;}), borderColor: '#bc13fe', fill: false, tension: 0.4, pointRadius: 0, yAxisID: 'y2' }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { color: '#9ca3af', font: { size: 10 } } }, tooltip: { backgroundColor: 'rgba(13,17,23,0.95)', borderColor: 'rgba(0,212,170,0.2)', borderWidth: 1 } },
            scales: {
                x: { ticks: { color: '#6b7280', maxTicksLimit: 12, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y1: { position: 'left', ticks: { color: '#9ca3af', font: { size: 10 }, callback: function(v){return v+'%';} }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y2: { position: 'right', ticks: { color: '#bc13fe', font: { size: 10 } }, grid: { display: false } }
            }
        }
    });
}

function renderBtv2Calendar(monthly) {
    var el = document.getElementById('btv2-calendar');
    if (!el) return;
    var sorted = Object.entries(monthly).sort(function(a,b){ return a[0].localeCompare(b[0]); });
    var max = Math.max.apply(null, Object.values(monthly).map(Math.abs).concat([1]));
    el.innerHTML = sorted.map(function(entry) {
        var ym = entry[0], pnl = entry[1];
        var intensity = Math.min(Math.abs(pnl) / max, 1);
        var bg = pnl > 0 ? ('rgba(34,197,94,' + (0.15 + intensity * 0.7) + ')') : ('rgba(239,68,68,' + (0.15 + intensity * 0.7) + ')');
        var parts = ym.split('-');
        var monthName = new Date(+parts[0], +parts[1]-1).toLocaleString('en', {month:'short'});
        return '<div title="' + ym + ': ' + (pnl>=0?'+':'') + pnl + '%" style="background:' + bg + ';border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 14px;min-width:80px;text-align:center;cursor:default;transition:transform 0.15s" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
            '<div style="font-size:0.6rem;color:var(--text-dim);font-weight:700">' + monthName + ' ' + parts[0].slice(2) + '</div>' +
            '<div style="font-size:0.9rem;font-weight:800;color:' + (pnl>=0?'#22c55e':'#ef4444') + ';margin-top:2px">' + (pnl>=0?'+':'') + pnl + '%</div>' +
            '</div>';
    }).join('');
}

function renderBtv2Table(trades) {
    var tbody = document.getElementById('btv2-tbody');
    if (!tbody) return;
    tbody.innerHTML = trades.map(function(t) {
        var pnlColor = t.pnl_pct >= 0 ? '#22c55e' : '#ef4444';
        var btcColor = t.btc_pnl >= 0 ? '#f7931a' : '#ef4444';
        var alpha = +(t.pnl_pct - t.btc_pnl).toFixed(1);
        return '<tr style="background:rgba(255,255,255,0.02)">' +
            '<td style="padding:8px 10px;font-weight:700">' + t.ticker + '</td>' +
            '<td style="padding:8px 10px"><span style="font-size:0.6rem;padding:2px 7px;border-radius:10px;background:rgba(0,212,170,0.1);color:#00d4aa">' + t.signal + '</span></td>' +
            '<td style="padding:8px 10px;color:var(--text-dim)">' + t.entry_date + '</td>' +
            '<td style="padding:8px 10px;color:var(--text-dim)">' + t.exit_date + '</td>' +
            '<td style="padding:8px 10px">$' + t.entry_price.toLocaleString() + '</td>' +
            '<td style="padding:8px 10px">$' + t.exit_price.toLocaleString() + '</td>' +
            '<td style="padding:8px 10px;font-weight:700;color:' + pnlColor + '">' + (t.pnl_pct>=0?'+':'') + t.pnl_pct + '%</td>' +
            '<td style="padding:8px 10px;color:' + btcColor + '">' + (t.btc_pnl>=0?'+':'') + t.btc_pnl + '%</td>' +
            '<td style="padding:8px 10px"><span style="font-size:0.6rem;padding:2px 6px;border-radius:8px;background:' + (alpha>=0?'rgba(0,212,170,0.1)':'rgba(239,68,68,0.1)') + ';color:' + (alpha>=0?'#00d4aa':'#ef4444') + '">' + (alpha>=0?'+':'') + alpha + '% ' + (alpha>=0?'ALPHA':'BETA') + '</span></td>' +
            '</tr>';
    }).join('');
}


// ================================================================
// Phase 17-B: Options Flow Scanner (Deribit)
// ================================================================
async function renderOptionsFlow(tabs = null) {
    if (!tabs) tabs = analyticsHubTabs;
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">analytics</span>Analytics Hub <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('docs-options-flow')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
            <p>Real-time BTC & ETH Deribit options data â€” Put/Call ratio, Max Pain, IV smile, top OI strikes.</p>
        </div>
        ${renderHubTabs('options', tabs)}
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Deribit Options Flow Scanner</h2>
        <div style="display:flex;gap:10px;margin-bottom:1rem;flex-wrap:wrap">
            <button id="opts-btc-btn" class="intel-action-btn mini" onclick="loadOptionsFlow('BTC')" style="background:linear-gradient(135deg,#f7931a,#ff6b00);color:#000">BTC OPTIONS</button>
            <button id="opts-eth-btn" class="intel-action-btn mini outline" onclick="loadOptionsFlow('ETH')">ETH OPTIONS</button>
        </div>
        <div id="opts-summary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:1.5rem">
            ${['Put/Call Ratio','Max Pain','ATM IV','IV Rank','Call OI','Put OI'].map(s =>
                `<div class="glass-card" style="padding:1rem;text-align:center"><div style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:4px">${s}</div><div class="opts-stat" id="opts-${s.toLowerCase().replace(/[^a-z]/g,'-')}" style="font-size:1.3rem;font-weight:800;color:var(--accent)">--</div></div>`
            ).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">IV SMILE (Â±30% STRIKES)</div>
                <canvas id="opts-smile-chart" height="220"></canvas>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">PUT / CALL VOLUME SPLIT</div>
                <canvas id="opts-pcr-chart" height="220" style="max-width:220px;margin:0 auto;display:block"></canvas>
            </div>
        </div>
        <div class="glass-card" style="padding:1.5rem">
            <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">TOP STRIKES BY OPEN INTEREST</div>
            <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:separate;border-spacing:0 3px;font-size:0.75rem">
                    <thead><tr style="color:var(--text-dim)">
                        ${['Strike','Type','Expiry','IV %','Volume','Open Interest'].map(h => `<th style="text-align:left;padding:6px 10px;font-size:0.6rem;letter-spacing:1px">${h}</th>`).join('')}
                    </tr></thead>
                    <tbody id="opts-strikes-table"><tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--text-dim)">Loading Deribit data...</td></tr></tbody>
                </table>
            </div>
        </div>
    `;
    window._optsCurrency = 'BTC';
    loadOptionsFlow('BTC');
}

async function loadOptionsFlow(currency) {
    window._optsCurrency = currency;
    document.getElementById('opts-btc-btn').className = `intel-action-btn mini ${currency === 'BTC' ? '' : 'outline'}`;
    document.getElementById('opts-eth-btn').className = `intel-action-btn mini ${currency === 'ETH' ? '' : 'outline'}`;
    ['put-call-ratio','max-pain','atm-iv','iv-rank','call-oi','put-oi'].forEach(id => {
        const el = document.getElementById('opts-' + id);
        if (el) el.innerHTML = '<span style="font-size:0.8rem;color:var(--text-dim)">...</span>';
    });
    try {
        const data = await fetchAPI('/options-flow', 'GET');
        if (!data || data.error) { showToast('OPTIONS FLOW', data.error || 'API unavailable', 'alert'); return; }
        const d = data[currency];
        if (!d || d.error) { showToast('OPTIONS FLOW', d && d.error || 'No data for ' + currency, 'alert'); return; }

        const ids = ['put-call-ratio','max-pain','atm-iv','iv-rank','call-oi','put-oi'];
        const vals = [d.pcr, '$' + (d.max_pain||0).toLocaleString(), d.atm_iv + '%', d.iv_pct_rank + 'th', d.call_oi, d.put_oi];
        const colors = [d.pcr > 1 ? '#ef4444' : '#22c55e','#00d4aa','#bc13fe','#ffd700','#22c55e','#ef4444'];
        ids.forEach((id, i) => {
            const el = document.getElementById('opts-' + id);
            if (el) { el.textContent = vals[i]; el.style.color = colors[i]; }
        });

        // IV Smile chart
        if (d.iv_smile && d.iv_smile.length) {
            const sc = document.getElementById('opts-smile-chart');
            if (sc) {
                if (sc._chart) sc._chart.destroy();
                sc._chart = new Chart(sc, {
                    type: 'line',
                    data: {
                        labels: d.iv_smile.map(p => (p.moneyness >= 0 ? '+' : '') + p.moneyness + '%'),
                        datasets: [{
                            label: 'IV %', data: d.iv_smile.map(p => p.iv),
                            borderColor: '#bc13fe', backgroundColor: 'rgba(188,19,254,0.1)',
                            borderWidth: 2, tension: 0.4, pointRadius: 3, fill: true
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: {
                        x: { ticks: { color: '#6b7280', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                        y: { ticks: { color: '#9ca3af', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.04)' } }
                    }}
                });
            }
        }

        // PCR doughnut
        const pc = document.getElementById('opts-pcr-chart');
        if (pc) {
            if (pc._chart) pc._chart.destroy();
            pc._chart = new Chart(pc, {
                type: 'doughnut',
                data: { labels: ['Calls', 'Puts'], datasets: [{ data: [d.call_volume, d.put_volume], backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)'], borderWidth: 0 }] },
                options: { cutout: '65%', plugins: { legend: { labels: { color: '#9ca3af', font: { size: 10 } } } } }
            });
        }

        // Strikes table
        const tbody = document.getElementById('opts-strikes-table');
        if (tbody && d.top_strikes) {
            tbody.innerHTML = d.top_strikes.map(s => `
                <tr style="background:rgba(255,255,255,0.02)">
                    <td style="padding:7px 10px;font-weight:700">$${s.strike.toLocaleString()}</td>
                    <td style="padding:7px 10px"><span style="font-size:0.6rem;padding:2px 7px;border-radius:10px;background:${s.type==='C'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'};color:${s.type==='C'?'#22c55e':'#ef4444'}">${s.type==='C'?'CALL':'PUT'}</span></td>
                    <td style="padding:7px 10px;color:var(--text-dim);font-size:0.7rem">${s.expiry}</td>
                    <td style="padding:7px 10px;color:#bc13fe;font-weight:700">${s.iv}%</td>
                    <td style="padding:7px 10px">${s.volume.toLocaleString()}</td>
                    <td style="padding:7px 10px;font-weight:700;color:var(--accent)">${s.oi.toLocaleString()}</td>
                </tr>`).join('');
        }
    } catch(e) {
        showToast('OPTIONS FLOW', 'Error: ' + e.message, 'alert');
    }
}

// ================================================================
// Phase 17-C: AI Portfolio Rebalancer (injected into renderPortfolioOptimizer)
// ================================================================
async function renderAIRebalancer() {
    const rebalEl = document.getElementById('ai-rebalancer-section');
    if (!rebalEl) return;
    rebalEl.innerHTML = `<div style="text-align:center;padding:2rem"><div class="loader" style="margin:0 auto"></div><p style="color:var(--text-dim);margin-top:1rem;font-size:0.8rem">Running Max-Sharpe optimization across ML signals...</p></div>`;
    try {
        const data = await fetchAPI('/ai-rebalancer', 'GET');
        if (data.error) { rebalEl.innerHTML = `<div class="error-msg">${data.error}</div>`; return; }

        const sharpeImprove = data.proposed_sharpe && data.current_sharpe
            ? (((data.proposed_sharpe - data.current_sharpe) / Math.abs(data.current_sharpe || 0.01)) * 100).toFixed(1) + '%'
            : 'N/A';

        rebalEl.innerHTML = `
            <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(0,212,170,0.15);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
                    <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:#00d4aa">AI REBALANCING MEMO</div>
                    <div style="display:flex;gap:12px;font-size:0.65rem">
                        <span>Current Sharpe: <b style="color:#ffd700">${data.current_sharpe}</b></span>
                        <span>â†’ Proposed: <b style="color:#22c55e">${data.proposed_sharpe}</b></span>
                        <span>Improvement: <b style="color:#00d4aa">${sharpeImprove}</b></span>
                    </div>
                </div>
                <div style="font-size:0.78rem;color:var(--text-dim);line-height:1.7;white-space:pre-wrap;font-family:'JetBrains Mono',monospace">${data.memo}</div>
            </div>
            <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem;overflow-x:auto">
                <div style="font-size:0.7rem;font-weight:800;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:1rem">ALLOCATION DIFF â€” ${data.updated}</div>
                <table style="width:100%;border-collapse:separate;border-spacing:0 4px;font-size:0.75rem">
                    <thead><tr style="color:var(--text-dim)">
                        ${['Ticker','ML Score','Current','â†’ Suggested','Action'].map(h => `<th style="text-align:left;padding:6px 10px;font-size:0.6rem;letter-spacing:1px">${h}</th>`).join('')}
                    </tr></thead>
                    <tbody>
                        ${(data.weights || []).map(w => {
                            const act = w.action;
                            const clr = act === 'ADD' ? '#22c55e' : act === 'REDUCE' ? '#ef4444' : '#60a5fa';
                            return `<tr style="background:rgba(255,255,255,0.02)">
                                <td style="padding:8px 10px;font-weight:700">${w.ticker}</td>
                                <td style="padding:8px 10px;color:#bc13fe">${w.ml_score}%</td>
                                <td style="padding:8px 10px;color:var(--text-dim)">${w.current_pct}</td>
                                <td style="padding:8px 10px;font-weight:700;color:#00d4aa">${w.suggested_pct}</td>
                                <td style="padding:8px 10px"><span style="font-size:0.6rem;padding:2px 8px;border-radius:8px;background:${clr}22;color:${clr};font-weight:700">${act}</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ${data.tickets && data.tickets.length ? (() => { window._arebTickets = data.tickets; return `
            <button onclick="executeAIRebalance(window._arebTickets)" style="background:linear-gradient(135deg,#00d4aa,#00a896);color:#000;border:none;padding:10px 24px;border-radius:8px;font-weight:800;font-size:0.75rem;cursor:pointer;letter-spacing:1px;width:100%">
                âš¡ EXECUTE ${data.tickets.length} REBALANCE TICKETS
            </button>`; })() : ''}
        `;
    } catch(e) {
        if (rebalEl) rebalEl.innerHTML = `<div class="error-msg">Rebalancer Error: ${e.message}</div>`;
    }
}

async function executeAIRebalance(tickets) {
    if (!confirm(`Execute ${tickets.length} rebalance tickets? This will create entries in your Trade Ledger.`)) return;
    for (const t of tickets) {
        await fetchAPI('/trade-ledger', 'POST', { ticker: t.ticker, action: t.action, price: 0, target: 0, stop: 0, weight: t.weight });
    }
    showToast('REBALANCE', `${tickets.length} tickets executed and logged.`, 'success');
}

// ================================================================
// Standalone AI Rebalancer View (full page, routed as ai-rebalancer)
// ================================================================
async function renderAIRebalancerView(tabs = null) {
    if (!tabs) tabs = institutionalHubTabs;
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">smart_toy</span>AI Portfolio Rebalancer <span class="premium-badge">AI</span></h1>
            <p>Max-Sharpe portfolio optimisation via Monte Carlo simulation across ML signal predictions. GPT-generated institutional memo.</p>
        </div>
        ${renderHubTabs('rebalancer', tabs)}
        <div id="ai-reb-top" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:1.5rem">
            ${['Current Sharpe','Proposed Sharpe','Sharpe Improvement','Assets Analysed','Rebalance Tickets','Last Updated'].map(s =>
                `<div class="glass-card" style="padding:1rem;text-align:center"><div style="font-size:0.55rem;font-weight:900;letter-spacing:1.5px;color:var(--text-dim);margin-bottom:4px">${s}</div><div id="areb-${s.toLowerCase().replace(/[^a-z]/g,'-')}" style="font-size:1.2rem;font-weight:800;color:var(--accent)">--</div></div>`
            ).join('')}
        </div>
        <div style="text-align:center;margin-bottom:1.5rem">
            <button id="areb-run-btn" onclick="runAIRebalancerView()" style="background:linear-gradient(135deg,#00d4aa,#00a896);color:#000;border:none;padding:12px 32px;border-radius:10px;font-weight:900;font-size:0.8rem;cursor:pointer;letter-spacing:1.5px">
                <span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;font-size:1rem">auto_awesome</span>GENERATE REBALANCE PLAN
            </button>
        </div>
        <div id="areb-content" style="display:none"></div>
    `;
}

window.runAIRebalancerView = async function() {
    const btn = document.getElementById('areb-run-btn');
    const content = document.getElementById('areb-content');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loader" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></span>OPTIMISING...'; }

    try {
        const data = await fetchAPI('/ai-rebalancer', 'GET');
        if (!data || data.error) {
            showToast('AI REBALANCER', data?.error || 'Optimization failed', 'alert');
            if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;font-size:1rem">auto_awesome</span>GENERATE REBALANCE PLAN'; }
            return;
        }

        const improve = data.proposed_sharpe && data.current_sharpe
            ? (((data.proposed_sharpe - data.current_sharpe) / Math.abs(data.current_sharpe || 0.01)) * 100).toFixed(1)
            : 'N/A';
        const improveColor = parseFloat(improve) > 0 ? '#22c55e' : '#ef4444';

        // Populate stat badges
        const vals = {
            'current-sharpe':      data.current_sharpe ?? '--',
            'proposed-sharpe':     data.proposed_sharpe ?? '--',
            'sharpe-improvement':  improve !== 'N/A' ? improve + '%' : 'N/A',
            'assets-analysed':     data.tickers_used?.length ?? '--',
            'rebalance-tickets':   data.tickets?.length ?? 0,
            'last-updated':        data.updated ?? '--'
        };
        const valColors = { 'sharpe-improvement': improveColor, 'proposed-sharpe': '#22c55e', 'rebalance-tickets': '#ffd700' };
        Object.entries(vals).forEach(([k, v]) => {
            const el = document.getElementById('areb-' + k);
            if (el) { el.textContent = v; if (valColors[k]) el.style.color = valColors[k]; }
        });

        content.style.display = 'block';
        content.innerHTML = `
            <!-- Memo -->
            <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem;border:1px solid rgba(0,212,170,0.2)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
                    <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:#00d4aa">âš¡ AI REBALANCING MEMO</div>
                    <div style="font-size:0.65rem;color:var(--text-dim)">${data.updated}</div>
                </div>
                <div style="font-size:0.78rem;color:var(--text-dim);line-height:1.8;white-space:pre-wrap;font-family:'JetBrains Mono',monospace,serif">${data.memo}</div>
            </div>

            <!-- Allocation table -->
            <div class="glass-card" style="padding:1.5rem;margin-bottom:1.5rem;overflow-x:auto">
                <div style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:1rem">ALLOCATION DIFF â€” ML MAX-SHARPE WEIGHTS</div>
                <table style="width:100%;border-collapse:separate;border-spacing:0 4px;font-size:0.75rem">
                    <thead><tr style="color:var(--text-dim)">
                        ${['Ticker','ML Score','Current Alloc','â†’ Suggested','Action'].map(h => `<th style="text-align:left;padding:8px 12px;font-size:0.6rem;letter-spacing:1px">${h}</th>`).join('')}
                    </tr></thead>
                    <tbody>
                        ${(data.weights || []).sort((a,b) => parseFloat(b.suggested_pct) - parseFloat(a.suggested_pct)).map(w => {
                            const act = w.action;
                            const clr = act === 'ADD' ? '#22c55e' : act === 'REDUCE' ? '#ef4444' : '#60a5fa';
                            const pct = parseFloat(w.suggested_pct);
                            const bar = Math.min(pct * 2.5, 100);
                            return `<tr style="background:rgba(255,255,255,0.02)">
                                <td style="padding:10px 12px;font-weight:800;font-family:monospace">${w.ticker}</td>
                                <td style="padding:10px 12px;color:#bc13fe;font-weight:700">${w.ml_score}%</td>
                                <td style="padding:10px 12px;color:var(--text-dim)">${w.current_pct}</td>
                                <td style="padding:10px 12px">
                                    <span style="font-weight:800;color:#00d4aa">${w.suggested_pct}</span>
                                    <div style="height:3px;background:rgba(0,212,170,0.15);border-radius:2px;margin-top:4px;width:100px">
                                        <div style="height:3px;background:#00d4aa;border-radius:2px;width:${bar}%"></div>
                                    </div>
                                </td>
                                <td style="padding:10px 12px"><span style="font-size:0.6rem;padding:3px 10px;border-radius:10px;background:${clr}22;color:${clr};font-weight:800;letter-spacing:0.5px">${act}</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            ${data.tickets?.length ? (() => { window._arebTickets = data.tickets; return `
            <button onclick="executeAIRebalance(window._arebTickets)" style="background:linear-gradient(135deg,#00d4aa,#00a896);color:#000;border:none;padding:12px 28px;border-radius:10px;font-weight:900;font-size:0.8rem;cursor:pointer;letter-spacing:1px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px">
                <span class="material-symbols-outlined" style="font-size:1.1rem">sync_alt</span>
                EXECUTE ${data.tickets.length} REBALANCE TICKET${data.tickets.length > 1 ? 'S' : ''} â†’ TRADE LEDGER
            </button>`; })() : ''}
        `;
    } catch(e) {
        showToast('AI REBALANCER', 'Error: ' + e.message, 'alert');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;font-size:1rem">auto_awesome</span>GENERATE REBALANCE PLAN'; }
    }
};


async function renderMacroCalendar(tabs = null) {
    if (!tabs) tabs = macroHubTabs;
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">event_note</span>Macro Event Calendar <span class="premium-badge">LIVE</span></h1>
            <p>Upcoming FOMC, CPI, NFP, PCE dates with historical BTC impact scoring from real price data.</p>
        </div>
        ${renderHubTabs('macro-cal', tabs)}
        <div id="macro-cal-loading" style="text-align:center;padding:3rem"><div class="loader" style="margin:0 auto"></div></div>
        <div id="macro-cal-content" style="display:none"></div>
    `;
    try {
        const data = await fetchAPI('/macro-calendar');
        document.getElementById('macro-cal-loading').style.display = 'none';
        const calEl = document.getElementById('macro-cal-content');
        if (!data || !data.events || !data.events.length) {
            calEl.innerHTML = '<div class="error-msg">No upcoming macro events in window.</div>';
            calEl.style.display = 'block'; return;
        }
        const typeColors = { FOMC: '#ef4444', CPI: '#f97316', NFP: '#22c55e', PCE: '#a78bfa', REBALANCE: '#60a5fa' };
        const tierBg = { HIGH: 'rgba(239,68,68,0.12)', MEDIUM: 'rgba(249,115,22,0.1)', LOW: 'rgba(255,255,255,0.04)' };

        calEl.innerHTML = `
            <div style="font-size:0.65rem;color:var(--text-dim);margin-bottom:1rem">Updated ${data.updated} Â· Showing next 90 days</div>
            <div style="display:flex;flex-direction:column;gap:12px">
                ${data.events.map(ev => {
                    const clr = typeColors[ev.type] || '#9ca3af';
                    const bg  = tierBg[ev.tier] || tierBg.LOW;
                    const dDir = ev.median_btc >= 0 ? '+' : '';
                    const moves6 = (ev.hist_moves || []).slice(-6);
                    const barMax = Math.max(...moves6.map(Math.abs), 1);
                    const barsHtml = moves6.map(m => {
                        const w = Math.abs(m) / barMax * 100;
                        const c = m >= 0 ? '#22c55e' : '#ef4444';
                        return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                            <div style="width:60px;text-align:right;font-size:0.55rem;color:var(--text-dim)">${m >= 0 ? '+' : ''}${m}%</div>
                            <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
                                <div style="width:${w}%;height:100%;background:${c};border-radius:3px"></div>
                            </div>
                        </div>`;
                    }).join('');

                    return `
                    <div style="background:${bg};border:1px solid ${clr}33;border-left:3px solid ${clr};border-radius:10px;padding:1.2rem;display:flex;gap:1.5rem;flex-wrap:wrap;align-items:flex-start">
                        <div style="min-width:90px;text-align:center">
                            <div style="font-size:1.8rem;font-weight:900;color:${ev.days_until <= 7 ? '#ef4444' : ev.days_until <= 21 ? '#ffd700' : 'var(--text)'}">${ev.days_until === 0 ? 'TODAY' : ev.days_until + 'd'}</div>
                            <div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px">${ev.date}</div>
                            <div style="margin-top:8px;padding:3px 8px;border-radius:6px;background:${clr}22;color:${clr};font-size:0.55rem;font-weight:900;letter-spacing:1px">${ev.type}</div>
                        </div>
                        <div style="flex:1;min-width:200px">
                            <div style="font-size:0.9rem;font-weight:800;color:var(--text);margin-bottom:4px">${ev.event}</div>
                            <div style="display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap">
                                <span style="font-size:0.65rem;color:var(--text-dim)">Median BTC move: <b style="color:${ev.median_btc >= 0 ? '#22c55e' : '#ef4444'}">${dDir}${ev.median_btc}%</b></span>
                                <span style="font-size:0.65rem;color:var(--text-dim)">Avg volatility: <b style="color:#bc13fe">${ev.avg_vol}%</b></span>
                                <span style="font-size:0.65rem;color:var(--text-dim)">Bull bias: <b style="color:#ffd700">${ev.bull_bias}%</b></span>
                            </div>
                            <div style="font-size:0.6rem;color:var(--text-dim);margin-bottom:6px">LAST 6 INSTANCES â€” BTC DAY-OF MOVE</div>
                            ${barsHtml}
                        </div>
                        <div style="text-align:center;min-width:80px">
                            <div style="font-size:0.55rem;color:var(--text-dim);margin-bottom:4px">IMPACT SCORE</div>
                            <div style="font-size:2rem;font-weight:900;color:${ev.impact_score >= 70 ? '#ef4444' : ev.impact_score >= 40 ? '#ffd700' : '#22c55e'}">${ev.impact_score}</div>
                            <div style="font-size:0.55rem;padding:2px 8px;border-radius:6px;background:${ev.tier==='HIGH'?'rgba(239,68,68,0.15)':ev.tier==='MEDIUM'?'rgba(255,215,0,0.1)':'rgba(34,197,94,0.1)'};color:${ev.tier==='HIGH'?'#ef4444':ev.tier==='MEDIUM'?'#ffd700':'#22c55e'};font-weight:700">${ev.tier}</div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
        calEl.style.display = 'block';
    } catch(e) {
        const el = document.getElementById('macro-cal-content');
        if (el) { el.innerHTML = `<div class="error-msg">Calendar Error: ${e.message}</div>`; el.style.display = 'block'; }
        const ld = document.getElementById('macro-cal-loading');
        if (ld) ld.style.display = 'none';
    }
}

// ================================================================
// Phase 17-A: Test fire alert helper + modal settings loader
// ================================================================
async function testFireAlert() {
    const z = parseFloat(document.getElementById('z-threshold-slider')?.value || 2.0);
    showToast('ALERT CONFIG', 'Sending test notification...', 'info');
    const data = await fetchAPI('/alert-settings', 'POST', { z_threshold: z, test_fire: true });
    if (data && data.success) {
        showToast('ALERT CONFIG', 'Test alert dispatched! Check Discord/Telegram.', 'success');
    } else {
        showToast('ALERT CONFIG', 'Save your webhook first, then test.', 'alert');
    }
}

// --- TradingView Hub ---
async function renderTradingViewHub(tabs) {
    if (!tabs) tabs = analyticsHubTabs;
    const badge = '<span style="font-size:0.5rem;color:#2196f3;letter-spacing:2px;font-weight:700">POWERED BY TRADINGVIEW</span>';
    const card = (id, title, h) => '<div class="card" style="padding:1.5rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="margin:0">' + title + '</h3>' + badge + '</div><div id="' + id + '" class="tradingview-widget-container" style="min-height:' + (h||460) + 'px"></div></div>';

    appEl.innerHTML =
        '<div class="view-header"><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#2196f3">show_chart</span>Analytics Hub <span class="premium-badge">TRADINGVIEW</span></h1></div>' +
        renderHubTabs('tradingview', tabs) +
        '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1rem">Market Overview</h2>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:1rem;margin-bottom:1rem">' + card('tv-market-overview','Global Market Overview \u2014 Crypto \u00b7 Indices \u00b7 Commodities', 420) + '</div>' +
        '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1.5rem 0 1rem">Symbol Comparison</h2>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:1rem;margin-bottom:1rem">' + card('tv-symbol-overview','BTC \u00b7 ETH \u00b7 SOL \u2014 12M Normalized Performance', 420) + '</div>' +
        '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1.5rem 0 1rem">Technical Analysis</h2>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:1rem;margin-bottom:1rem">' + card('tv-ta-btc','Technical Analysis \u2014 BTC') + card('tv-ta-eth','Technical Analysis \u2014 ETH') + '</div>' +
        '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1.5rem 0 1rem">Screener &amp; Calendar</h2>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:1rem;margin-bottom:1rem">' + card('tv-screener','Crypto Market Screener') + card('tv-calendar','Economic Calendar') + '</div>' +
        '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1.5rem 0 1rem">Market Hotlists</h2>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:1rem;margin-bottom:2rem">' + card('tv-hotlists','Top Gainers \u00b7 Losers \u00b7 Most Active Volume', 420) + '</div>';

    function injectTVWidget(id, type, cfg) {
        var c = document.getElementById(id); if (!c) return;
        var d = document.createElement('div'); d.className = 'tradingview-widget-container__widget'; c.appendChild(d);
        var s = document.createElement('script'); s.type = 'text/javascript';
        s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-' + type + '.js';
        s.async = true; s.textContent = JSON.stringify(cfg); c.appendChild(s);
    }

    injectTVWidget('tv-market-overview', 'market-overview', {
        colorTheme:'dark', dateRange:'12M', showChart:true, locale:'en', largeChartUrl:'',
        isTransparent:true, showSymbolLogo:true, showFloatingTooltip:false, width:'100%', height:420,
        tabs:[
            {title:'Crypto', originalTitle:'Crypto', symbols:[
                {s:'BINANCE:BTCUSDT',d:'Bitcoin'},{s:'BINANCE:ETHUSDT',d:'Ethereum'},
                {s:'BINANCE:SOLUSDT',d:'Solana'},{s:'BINANCE:BNBUSDT',d:'BNB'},
                {s:'BINANCE:XRPUSDT',d:'XRP'},{s:'BINANCE:ADAUSDT',d:'Cardano'}]},
            {title:'Indices', originalTitle:'Indices', symbols:[
                {s:'FOREXCOM:SPXUSD',d:'S&P 500'},{s:'FOREXCOM:NSXUSD',d:'Nasdaq'},
                {s:'FOREXCOM:DJI',d:'Dow Jones'},{s:'INDEX:NKY',d:'Nikkei'}]},
            {title:'Commodities', originalTitle:'Commodities', symbols:[
                {s:'CME_MINI:GC1!',d:'Gold'},{s:'CME:SI1!',d:'Silver'},
                {s:'NYMEX:CL1!',d:'Oil'},{s:'TVC:DXY',d:'DXY'}]}
        ]
    });

    injectTVWidget('tv-symbol-overview', 'symbol-overview', {
        symbols:[['Bitcoin','BINANCE:BTCUSDT|12M'],['Ethereum','BINANCE:ETHUSDT|12M'],['Solana','BINANCE:SOLUSDT|12M']],
        chartOnly:false, width:'100%', height:420, locale:'en', colorTheme:'dark', autosize:false,
        showVolume:false, showMA:false, hideDateRanges:false, hideMarketStatus:false, hideSymbolLogo:false,
        scalePosition:'right', scaleMode:'Normal', fontFamily:'JetBrains Mono', fontSize:'10',
        noTimeScale:false, valuesTracking:'1', changeMode:'price-and-percent', chartType:'area',
        lineWidth:2, lineType:0, dateRanges:['1d|1','1m|30','3m|60','12m|1D','60m|1W'], isTransparent:true
    });

    injectTVWidget('tv-ta-btc','technical-analysis',{interval:'1D',width:'100%',isTransparent:true,height:460,symbol:'BINANCE:BTCUSDT',showIntervalTabs:true,displayMode:'multiple',locale:'en',colorTheme:'dark'});
    injectTVWidget('tv-ta-eth','technical-analysis',{interval:'1D',width:'100%',isTransparent:true,height:460,symbol:'BINANCE:ETHUSDT',showIntervalTabs:true,displayMode:'multiple',locale:'en',colorTheme:'dark'});
    injectTVWidget('tv-screener','screener',{width:'100%',height:460,defaultColumn:'overview',screener_type:'crypto_mkt',displayCurrency:'USD',colorTheme:'dark',locale:'en',isTransparent:true});

    // Additional sections: inject HTML first, then widgets
    var appContent = document.querySelector('#app');
    var extraHtml =
        '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1.5rem 0 1rem">Technical Analysis \u2014 SOL</h2>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(480px,1fr));gap:1rem;margin-bottom:1rem">' +
        '<div class="card" style="padding:1.5rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="margin:0">Technical Analysis \u2014 SOL</h3><span style="font-size:0.5rem;color:#2196f3;letter-spacing:2px;font-weight:700">POWERED BY TRADINGVIEW</span></div><div id="tv-ta-sol" class="tradingview-widget-container" style="min-height:460px"></div></div>' +
        '<div class="card" style="padding:1.5rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="margin:0">Technical Analysis \u2014 BNB</h3><span style="font-size:0.5rem;color:#2196f3;letter-spacing:2px;font-weight:700">POWERED BY TRADINGVIEW</span></div><div id="tv-ta-bnb" class="tradingview-widget-container" style="min-height:460px"></div></div>' +
        '</div>' +
        '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1.5rem 0 1rem">Crypto Market Heatmap</h2>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:1rem;margin-bottom:1rem"><div class="card" style="padding:1.5rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="margin:0">Crypto Coins Heatmap \u2014 Market Cap \u00b7 Performance</h3><span style="font-size:0.5rem;color:#2196f3;letter-spacing:2px;font-weight:700">POWERED BY TRADINGVIEW</span></div><div id="tv-heatmap" class="tradingview-widget-container" style="min-height:500px"></div></div></div>' +
        '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1.5rem 0 1rem">Forex Cross Rates</h2>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:1rem;margin-bottom:2rem"><div class="card" style="padding:1.5rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><h3 style="margin:0">Forex Cross Rates \u2014 Macro Currency Matrix</h3><span style="font-size:0.5rem;color:#2196f3;letter-spacing:2px;font-weight:700">POWERED BY TRADINGVIEW</span></div><div id="tv-forex" class="tradingview-widget-container" style="min-height:420px"></div></div></div>';

    appEl.innerHTML += extraHtml;

    injectTVWidget('tv-ta-sol','technical-analysis',{interval:'1D',width:'100%',isTransparent:true,height:460,symbol:'BINANCE:SOLUSDT',showIntervalTabs:true,displayMode:'multiple',locale:'en',colorTheme:'dark'});
    injectTVWidget('tv-ta-bnb','technical-analysis',{interval:'1D',width:'100%',isTransparent:true,height:460,symbol:'BINANCE:BNBUSDT',showIntervalTabs:true,displayMode:'multiple',locale:'en',colorTheme:'dark'});
    injectTVWidget('tv-heatmap','crypto-coins-heatmap',{dataSource:'Crypto',blockSize:'market_cap_calc',blockColor:'change',locale:'en',symbolUrl:'',colorTheme:'dark',hasTopBar:true,isDataSetEnabled:false,isZoomEnabled:true,hasSymbolTooltip:true,isMonoSize:false,width:'100%',height:500});
    injectTVWidget('tv-forex','forex-cross-rates',{width:'100%',height:420,currencies:['EUR','USD','JPY','GBP','CHF','AUD','CAD','BTC','ETH'],isTransparent:true,colorTheme:'dark',locale:'en',backgroundColor:'rgba(0,0,0,0)'});
}