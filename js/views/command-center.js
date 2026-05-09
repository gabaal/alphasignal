async function renderCommandCenter() {
    appEl.innerHTML = `
        <div class="view-header" style="margin-bottom:2rem; flex-wrap:wrap; gap:0.5rem">
            <div style="flex:1; min-width:0">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
                    <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px;width:100%">Institutional Hub</h2>
                    <h1 style="margin:0"><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:6px; color:var(--accent); font-size:1.2rem">dashboard</span>Dashboard</h1>
                    <span class="premium-badge" style="flex-shrink:0">MASTER VIEW</span>
                </div>
                <p style="color:var(--text-dim); margin-top:0.5rem">Consolidated real-time intelligence across Macro, Global, and Alpha hubs.</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0;align-self:flex-start" onclick="switchView('docs-command-center')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
        </div>

        <!-- ██ AI TRADE NOW WIDGET ██ -->
        <div id="ai-trade-now-card" class="card" style="
            margin-bottom:1.5rem;
            border-left:3px solid rgba(0,242,255,0.5);
            background:linear-gradient(135deg, rgba(0,242,255,0.04) 0%, rgba(139,92,246,0.04) 100%);
            position:relative; overflow:hidden;">
            <!-- Subtle animated glow strip -->
            <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,242,255,0.4),transparent);animation:shimmer 3s infinite linear;" id="atn-glow-strip"></div>
            <div class="card-header" style="margin-bottom:0.75rem;align-items:flex-start;gap:0.5rem">
                <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                        <span class="material-symbols-outlined" style="color:rgba(139,92,246,0.9);font-size:1.1rem;vertical-align:middle">psychology</span>
                        <h3 style="margin:0;font-size:1rem;letter-spacing:1.5px;color:var(--accent)">IF I WERE TRADING RIGHT NOW</h3>
                        <span style="font-size:0.6rem;padding:2px 7px;border-radius:3px;background:rgba(139,92,246,0.2);color:#a78bfa;letter-spacing:2px;font-weight:900">AI · GPT-4o</span>
                    </div>
                    <div id="atn-meta" style="font-size:0.65rem;color:var(--text-dim);letter-spacing:1.5px;margin-top:4px">LOADING MARKET ANALYSIS...</div>
                </div>
                <button id="atn-refresh-btn" onclick="fetchAITradeNow(true)"
                    title="Force refresh AI analysis"
                    style="display:flex;align-items:center;gap:4px;background:rgba(0,242,255,0.07);border:1px solid rgba(0,242,255,0.2);
                           color:rgba(0,242,255,0.7);border-radius:7px;padding:5px 10px;cursor:pointer;
                           font-size:0.7rem;font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:1px;
                           transition:all 0.2s;flex-shrink:0"
                    onmouseover="this.style.background='rgba(0,242,255,0.14)';this.style.borderColor='rgba(0,242,255,0.45)'"
                    onmouseout="this.style.background='rgba(0,242,255,0.07)';this.style.borderColor='rgba(0,242,255,0.2)'">
                    <span class="material-symbols-outlined" style="font-size:13px">refresh</span> REFRESH
                </button>
            </div>

            <!-- Skeleton / content area -->
            <div id="atn-body">
                <!-- Skeleton loader -->
                <div id="atn-skeleton" style="display:flex;flex-direction:column;gap:10px">
                    ${[1,2,3].map(()=>`
                        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.03)">
                            <div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.06);flex-shrink:0"></div>
                            <div style="flex:1">
                                <div style="height:10px;width:35%;background:rgba(255,255,255,0.06);border-radius:4px;margin-bottom:6px"></div>
                                <div style="height:8px;width:80%;background:rgba(255,255,255,0.04);border-radius:4px"></div>
                            </div>
                            <div style="width:48px;height:20px;border-radius:4px;background:rgba(255,255,255,0.06)"></div>
                        </div>`).join('')}
                </div>

                <!-- Populated content (hidden until loaded) -->
                <div id="atn-content" style="display:none">
                    <div id="atn-headline" style="font-size:1rem;font-weight:900;color:var(--text-primary);margin-bottom:0.9rem;line-height:1.4;letter-spacing:0.3px"></div>
                    <div id="atn-trades" style="display:flex;flex-direction:column;gap:8px;margin-bottom:0.9rem"></div>
                    <div id="atn-bottom-line" style="font-size:0.8rem;padding:8px 12px;border-radius:7px;background:rgba(0,242,255,0.06);border-left:2px solid rgba(0,242,255,0.35);color:rgba(0,242,255,0.85);line-height:1.5;letter-spacing:0.3px"></div>
                </div>

                <!-- Error state (hidden until error) -->
                <div id="atn-error" style="display:none;padding:1rem;text-align:center;color:var(--text-dim);font-size:0.7rem">
                    <span class="material-symbols-outlined" style="font-size:1.5rem;display:block;margin-bottom:4px;opacity:0.4">error_outline</span>
                    AI analysis unavailable — check OpenAI key or try refreshing.
                </div>
            </div>
        </div>
        <!-- ██ END AI TRADE NOW ██ -->

        <div class="command-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem; margin-bottom:1.5rem">
            <div class="card" style="text-align:center">
                <h3 style="font-size:0.7rem; color:var(--text-dim); letter-spacing:1px">SYSTEM CONVICTION</h3>
                <div style="position:relative; height:180px; margin-top:10px">
                    <canvas id="cmd-gauge-fear" role="img" aria-label="Fear and greed index gauge"></canvas>
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
                <div id="cmd-top-signals" style="margin-top:1.5rem; border-top:1px solid var(--border); padding-top:1rem"></div>
            </div>
        </div>

        <!-- Signal Analytics Charts - directly below gauges -->
        <div style="margin-bottom:1.5rem">
            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:1rem">LIVE SIGNAL INTELLIGENCE <span style="color:rgba(0,242,255,0.4);font-size:0.5rem;margin-left:6px">CLICK TO EXPAND</span></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px">
                <div class="card" style="padding:1rem;cursor:zoom-in;transition:border-color 0.15s" onclick="openCmdChartModal('scatter')"
                    onmouseover="this.style.borderColor='rgba(0,242,255,0.35)'" onmouseout="this.style.borderColor=''">
                    <div class="card-header" style="margin-bottom:8px">
                        <h3 style="font-size:0.75rem">Alpha vs Z-Score</h3>
                        <span class="label-tag">QUALITY SCATTER</span>
                    </div>
                    <div style="height:200px;position:relative"><canvas id="cmd-alphaVsZChart" role="img" aria-label="Alpha vs Z-score scatter chart"></canvas></div>
                </div>
                <div class="card" style="padding:1rem;cursor:zoom-in;transition:border-color 0.15s" onclick="openCmdChartModal('donut')"
                    onmouseover="this.style.borderColor='rgba(0,242,255,0.35)'" onmouseout="this.style.borderColor=''">
                    <div class="card-header" style="margin-bottom:8px">
                        <h3 style="font-size:0.75rem">Category Mix</h3>
                        <span class="label-tag">SECTOR BREAKDOWN</span>
                    </div>
                    <div style="height:200px;position:relative"><canvas id="cmd-categoryDonutChart" role="img" aria-label="Signal category distribution donut chart"></canvas></div>
                </div>
                <div class="card" style="padding:1rem;cursor:zoom-in;transition:border-color 0.15s" onclick="openCmdChartModal('btccorr')"
                    onmouseover="this.style.borderColor='rgba(0,242,255,0.35)'" onmouseout="this.style.borderColor=''">
                    <div class="card-header" style="margin-bottom:8px">
                        <h3 style="font-size:0.75rem">BTC Correlation</h3>
                        <span class="label-tag">CORRELATION SPREAD</span>
                    </div>
                    <div style="height:200px;position:relative"><canvas id="cmd-btcCorrChart" role="img" aria-label="BTC correlation radar chart"></canvas></div>
                </div>
                <div class="card" style="padding:1rem;cursor:zoom-in;transition:border-color 0.15s" onclick="openCmdChartModal('alpha')"
                    onmouseover="this.style.borderColor='rgba(0,242,255,0.35)'" onmouseout="this.style.borderColor=''">
                    <div class="card-header" style="margin-bottom:8px">
                        <h3 style="font-size:0.75rem">Alpha Leaders</h3>
                        <span class="label-tag">TOP 8 BY ALPHA</span>
                    </div>
                    <div style="height:200px;position:relative"><canvas id="cmd-topAlphaChart" role="img" aria-label="Top alpha signals bar chart"></canvas></div>
                </div>
            </div>
        </div>

        <!-- Chart Zoom Modal -->
        <div id="cmdChartModal" onclick="if(event.target===this)closeCmdChartModal()"
            style="display:none;position:fixed;inset:0;z-index:9999;backdrop-filter:blur(12px);
                   -webkit-backdrop-filter:blur(12px);align-items:center;justify-content:center;padding:2rem">
            <div class="modal-inner-panel" style="position:relative;width:min(90vw,1100px);background:var(--bg-card);
                        border:1px solid var(--border);border-radius:16px;padding:1.5rem;
                        box-shadow:0 0 60px rgba(0,0,0,0.1)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                    <div>
                        <div id="cmdModalTitle" style="font-size:0.85rem;font-weight:900;color:var(--accent);letter-spacing:1px"></div>
                        <div id="cmdModalSubtitle" style="font-size:0.55rem;color:var(--text-dim);letter-spacing:2px;margin-top:2px"></div>
                    </div>
                    <button onclick="closeCmdChartModal()" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
                        color:#ef4444;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:0.7rem;font-weight:700
                        ">- CLOSE</button>
                </div>
                <div style="height:65vh;position:relative"><canvas id="cmdModalCanvas" role="img" aria-label="Signal detail chart"></canvas></div>
            </div>
        </div>

        <div class="command-main-grid" style="display:grid; grid-template-columns: 1fr 400px; gap:1.5rem; margin-bottom:1.5rem">
            <div class="card" style="cursor:zoom-in;transition:border-color 0.15s" onclick="openCmdChartModal('etf')"
                onmouseover="this.style.borderColor='rgba(0,242,255,0.35)'" onmouseout="this.style.borderColor=''">
                <div class="card-header" style="margin-bottom:1rem">
                    <h3>7D ETF NET FLOWS <span style="font-size:0.6rem; color:var(--text-dim)">($ Millions)</span></h3>
                    <span class="label-tag" style="cursor:zoom-in">CLICK TO EXPAND</span>
                </div>
                <div style="height:350px"><canvas id="cmd-etf-chart" role="img" aria-label="ETF flows bar chart"></canvas></div>
            </div>
            <div class="card" style="cursor:zoom-in;transition:border-color 0.15s" onclick="openCmdChartModal('corr')"
                onmouseover="this.style.borderColor='rgba(0,242,255,0.35)'" onmouseout="this.style.borderColor=''">
                <div class="card-header">
                    <h3>MACRO CORRELATION MATRIX</h3>
                    <span class="label-tag" style="cursor:zoom-in">CLICK TO EXPAND</span>
                </div>
                <div id="cmd-corr-matrix" style="height:350px; overflow:hidden"></div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr minmax(160px,220px);gap:1.5rem;align-items:start">
            <div class="card" style="border:1px solid rgba(0,242,255,0.12);cursor:zoom-in;transition:border-color 0.15s"
                onclick="openCmdChartModal('radar')"
                onmouseover="this.style.borderColor='rgba(0,242,255,0.35)'" onmouseout="this.style.borderColor=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                    <h3 style="margin:0;color:var(--accent);font-size:0.75rem;letter-spacing:1px">
                        <span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:5px">radar</span>CONFIDENCE RADAR
                    </h3>
                    <div style="display:flex;align-items:center;gap:8px">
                        <select id="cmd-radar-select" style="border:1px solid rgba(0,242,255,0.2);color:white;font-size:0.6rem;padding:2px 6px;border-radius:4px;font-family:'JetBrains Mono'" onchange="event.stopPropagation();loadCmdRadar(this.value)" onclick="event.stopPropagation()">
                            <option value="BTC-USD">BTC</option><option value="ETH-USD">ETH</option>
                            <option value="SOL-USD">SOL</option><option value="LINK-USD">LINK</option>
                            <option value="ADA-USD">ADA</option>
                        </select>
                        <span class="label-tag" style="cursor:zoom-in;font-size:0.4rem">CLICK TO EXPAND</span>
                    </div>
                </div>
                <div style="font-size:0.5rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:0.75rem">6-DIMENSION ML SIGNAL DECOMPOSITION</div>
                <div style="width:100%;height:520px"><canvas id="cmd-radar-chart" role="img" aria-label="Command center overview radar chart"></canvas></div>
            </div>
            <div class="card" style="cursor:zoom-in;transition:border-color 0.15s" onclick="switchView('gex-profile')"
                onmouseover="this.style.borderColor='rgba(139,92,246,0.35)'" onmouseout="this.style.borderColor=''">
                <div class="card-header" style="margin-bottom:0.75rem">
                    <h3 style="font-size:0.7rem;letter-spacing:1px">DEALER GEX PIVOT</h3>
                    <span class="premium-badge" style="background:rgba(139,92,246,0.2);color:#a78bfa">DERIVATIVES</span>
                </div>
                <div id="cmd-gex-status" style="text-align:center;padding:10px 0">
                    <div id="cmd-gex-val" style="font-size:1.8rem;font-weight:900;color:#8b5cf6">--</div>
                    <div id="cmd-gex-label" style="font-size:0.6rem;color:var(--text-dim);margin-top:4px;letter-spacing:1.5px">CALCULATING GAMMA...</div>
                </div>
                <div style="height:60px;margin-top:10px"><canvas id="cmd-gex-spark"></canvas></div>
            </div>
            <div class="card">
                <h3 style="margin-bottom:0.75rem;font-size:0.7rem">CME MAGNET GAPS</h3>
                <div id="cmd-cme-gaps"></div>
            </div>
            <div class="card" style="cursor:zoom-in;transition:border-color 0.15s" onclick="switchView('global-markets')"
                onmouseover="this.style.borderColor='rgba(239,68,68,0.35)'" onmouseout="this.style.borderColor=''">
                <div class="card-header" style="margin-bottom:0.75rem">
                    <h3 style="font-size:0.7rem;letter-spacing:1px">OPTIONS MAX PAIN</h3>
                    <span class="premium-badge" style="background:rgba(239,68,68,0.2);color:#ef4444">LIQUIDITY</span>
                </div>
                <div id="cmd-max-pain-status" style="text-align:center;padding:10px 0">
                    <div id="cmd-max-pain-val" style="font-size:1.8rem;font-weight:900;color:#ef4444">--</div>
                    <div id="cmd-max-pain-label" style="font-size:0.6rem;color:var(--text-dim);margin-top:4px;letter-spacing:1.5px">CALCULATING PAIN...</div>
                </div>
                <div id="cmd-liq-heatmap" style="margin-top:10px;font-size:0.65rem"></div>
            </div>
        </div>

    `;


    // Data Fetching & Rendering
    // Kick off AI widget immediately (non-blocking, separate from main Promise.all)
    fetchAITradeNow(false);

    try {
        const [macro, regime, fearGreed, signalsData, pulse] = await Promise.all([
            fetchAPI('/macro'),
            fetchAPI('/regime'),
            fetchAPI('/fear-greed'),
            fetchAPI('/signals'),
            fetchAPI('/market-pulse')
        ]);

        // Normalize signals: handle both raw array and object-wrapped {signals: [...]}
        const signals = signalsData?.signals || (Array.isArray(signalsData) ? signalsData : []);


        // 1. Fear & Greed Dial
        if (macro) {
            const fg = regime;
            initCommandGauges(macro, regime);
        }

        // 2. Market Pulse - BTC macro correlations + lead-lag
        if (macro) {
            const corrItems = macro.slice(0, 4);
            const statusColor = s => s === 'RISK-ON' ? '#22c55e' : s === 'RISK-OFF' ? '#ef4444' : '#94a3b8';
            const corrColor  = v => v > 0.4 ? '#22c55e' : v < -0.4 ? '#ef4444' : '#94a3b8';
            const corrRows = corrItems.map(m => {
                const v = parseFloat(m.correlation) || 0;
                const pct = Math.abs(v) * 100;
                const bar = `<div style="height:3px;background:${alphaColor(0.07)};border-radius:2px;margin-top:4px"><div style="height:3px;width:${pct.toFixed(0)}%;background:${corrColor(v)};border-radius:2px"></div></div>`;
                const badge = `<span style="font-size:0.45rem;padding:1px 5px;border-radius:3px;background:${statusColor(m.status)}22;color:${statusColor(m.status)};letter-spacing:1px">${m.status || 'NEUTRAL'}</span>`;
                return `
                    <div style="padding:7px 8px;background:${alphaColor(0.02)};border-radius:6px;margin-bottom:5px">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="font-size:0.7rem;font-weight:700">BTC / ${m.name}</span>
                            <div style="display:flex;align-items:center;gap:6px">
                                ${badge}
                                <span style="font-size:0.7rem;font-weight:900;color:${corrColor(v)};font-family:'JetBrains Mono'">${v >= 0 ? '+' : ''}${v.toFixed(2)}</span>
                            </div>
                        </div>
                        ${bar}
                    </div>`;
            }).join('');

            // Lead-Lag strip from /api/market-pulse
            let leadLagHTML = '';
            if (pulse?.leadLag) {
                const ll = pulse.leadLag;
                const llColor = ll.leader === 'BTC' ? '#7dd3fc' : '#a78bfa';
                leadLagHTML = `
                    <div style="margin-top:6px;padding:8px;border-radius:6px;border-left:3px solid ${llColor}">
                        <div style="font-size:0.5rem;color:${alphaColor(0.35)};letter-spacing:2px;margin-bottom:3px">LEAD-LAG SIGNAL</div>
                        <div style="font-size:0.75rem;font-weight:900;color:${llColor}">${ll.signal || ll.leader + ' LEADING'}</div>
                        <div style="font-size:0.55rem;color:${alphaColor(0.4)};margin-top:2px">${ll.divergence ? Math.abs(ll.divergence).toFixed(2) + '% divergence' : ''}</div>
                    </div>`;
            }

            const pulseEl = document.getElementById('cmd-pulse-vals');
            if (pulseEl) pulseEl.innerHTML = corrRows + leadLagHTML;
        }

        // 3. ETF Flows (Simplified version for dashboard)
        renderCommandETF();

        // 4. Correlation Matrix
        try {
            const corrData = await fetchAPI('/correlation-matrix');
            if (corrData) {
                window._cmdCorrData = corrData; // cache for modal
                renderCorrelationHeatmap('cmd-corr-matrix', corrData);
            }
        } catch(e) { console.error("Corr Matrix Error:", e); }

        // 5. Top Signals
        try {
            if (signals) {
                const csig = document.getElementById('cmd-top-signals');
                if (csig) csig.innerHTML = signals.slice(0, 5).map(s => `
                    <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border)">
                        <span style="font-size:0.75rem; font-weight:800">${s.ticker}</span>
                        <span style="color:var(--accent); font-weight:900">+${s.alpha.toFixed(2)}%</span>
                    </div>
                `).join('');
            }
        } catch(e) { console.error("Signals Error:", e); }

        // 5b. Confidence Radar - init with BTC
        const savedRadarTicker = localStorage.getItem('cmd_radar_ticker') || 'BTC-USD';
    setTimeout(() => {
        const sel = document.getElementById('cmd-radar-select');
        if (sel) sel.value = savedRadarTicker;
        loadCmdRadar(savedRadarTicker);
    }, 300);

        // 6. CME Gaps - live from /api/cme-gaps
        try {
            const cmeData = await fetch('/api/cme-gaps').then(r => r.ok ? r.json() : []).catch(() => []);
            const gapEl = document.getElementById('cmd-cme-gaps');
            if (gapEl) {
                if (!cmeData.length) {
                    gapEl.innerHTML = '<div style="color:var(--text-dim);font-size:0.7rem;padding:8px 0">No significant gaps detected</div>';
                } else {
                    // Show top 3 unfilled/partial gaps closest to current price
                    const topGaps = cmeData.filter(g => g.status !== 'FILLED').slice(0, 3);
                    gapEl.innerHTML = topGaps.map(g => {
                        const isUp = g.direction === 'UP';
                        const col  = g.status === 'UNFILLED' ? '#22c55e' : '#f59e0b';
                        const sign = g.distance >= 0 ? '+' : '';
                        return `
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
                                <div>
                                    <div style="font-size:0.75rem;font-weight:900">$${g.gap_low.toLocaleString()} - $${g.gap_high.toLocaleString()}</div>
                                    <div style="font-size:0.5rem;color:var(--text-dim);margin-top:2px">${isUp ? '&#9650;' : '&#9660;'} ${g.direction} GAP &middot; ${g.fri_date}</div>
                                </div>
                                <div style="text-align:right">
                                    <div style="font-size:0.7rem;font-weight:900;color:${col}">${g.status}</div>
                                    <div style="font-size:0.55rem;color:var(--text-dim);margin-top:2px">${sign}${g.distance}%</div>
                                </div>
                            </div>`;
                    }).join('');
                }
            }
        } catch(e) { console.error('CME Gaps Widget Error:', e); }

        // 6b. GEX Mini-Widget
        try {
            const gexData = await fetchAPI('/gex-profile?ticker=BTC');
            const gexVal = document.getElementById('cmd-gex-val');
            const gexLabel = document.getElementById('cmd-gex-label');
            if (gexData && !gexData.error) {
                const totalGex = gexData.profile.reduce((a, b) => a + b.gamma, 0);
                const isPos = totalGex >= 0;
                if (gexVal) gexVal.textContent = (isPos ? '+' : '') + (totalGex / 1000).toFixed(1) + 'k';
                if (gexLabel) {
                    gexLabel.textContent = isPos ? 'POSITIVE GAMMA (LONG)' : 'NEGATIVE GAMMA (SHORT)';
                    gexLabel.style.color = isPos ? '#22c55e' : '#ef4444';
                }
                
                const ctx = document.getElementById('cmd-gex-spark').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: gexData.profile.map(p => p.strike),
                        datasets: [{
                            data: gexData.profile.map(p => p.gamma),
                            backgroundColor: gexData.profile.map(p => p.gamma >= 0 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'),
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: { x: { display: false }, y: { display: false } },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        } catch(e) { console.error('GEX Widget Error:', e); }

        // 6c. Options Max Pain Widget
        try {
            const painData = await fetchAPI('/options-max-pain?ticker=BTC&cb=' + Date.now());
            const painVal = document.getElementById('cmd-max-pain-val');
            const painLabel = document.getElementById('cmd-max-pain-label');
            const heatEl = document.getElementById('cmd-liq-heatmap');
            if (painData && !painData.error) {
                if (painVal) painVal.textContent = '$' + painData.max_pain_strike.toLocaleString();
                if (painLabel) {
                    const diff = ((painData.max_pain_strike - painData.spot) / painData.spot * 100).toFixed(2);
                    painLabel.textContent = `TARGET: ${diff > 0 ? '+' : ''}${diff}% FROM SPOT`;
                }
                if (heatEl && painData.liquidations) {
                    heatEl.innerHTML = painData.liquidations.slice(0, 4).map(l => {
                        const color = l.type === 'LONG' ? '#22c55e' : '#ef4444';
                        return `
                            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                                <span style="color:var(--text-main)">$${l.price.toLocaleString()}</span>
                                <span style="color:${color}">${l.type} <span style="opacity:0.6">${l.leverage}</span></span>
                                <span style="color:var(--text-dim)">$${(l.volume/1000000).toFixed(1)}M</span>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch(e) { console.error('Max Pain Widget Error:', e); }

        // 7. Signal Analytics Charts - built from live signals data
        if (signals && signals.length) {
            const _sigs = signals;
            window._cmdSigs = _sigs; // cache for modal

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
                    c.font='bold 8px JetBrains Mono'; c.globalAlpha=0.35;
                    c.fillStyle='#22c55e'; c.fillText('QUALITY', mx+(right-mx)/2-20, top+14);
                    c.fillStyle='#7dd3fc'; c.fillText('HIDDEN GEM', left+8, top+14);
                    c.fillStyle='#94a3b8'; c.fillText('WEAK SHORT', left+8, my+(bottom-my)/2);
                    c.fillStyle='#ef4444'; c.fillText('OVEREXTENDED', mx+(right-mx)/2-28, my+(bottom-my)/2);
                    c.globalAlpha=1; c.restore();
                }};
                new Chart(el.getContext('2d'), {
                    type:'scatter', plugins:[quadPlugin],
                    data:{ datasets:[{ data:pts, pointRadius:5, pointHoverRadius:7,
                        backgroundColor: pts.map(p=> p.x>0&&p.y>0?'rgba(34,197,94,0.75)':p.x<0&&p.y>0?'rgba(0,242,255,0.75)':p.x>0&&p.y<0?'rgba(239,68,68,0.65)':'rgba(148,163,184,0.5)'),
                        borderWidth:0 }]},
                    options:{ responsive:true, maintainAspectRatio:false,
                        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(13,17,23,0.95)', titleColor:'#7dd3fc', bodyColor:'#e2e8f0',
                            callbacks:{ title:items=>items[0].raw.label, label:c=>`Z: ${c.raw.x.toFixed(2)}-  -: ${c.raw.y>=0?'+':''}${c.raw.y.toFixed(2)}%` }}},
                        scales:{
                            x:{ title:{display:true,text:'Z-Score (-)',color:alphaColor(0.3),font:{size:8,family:'JetBrains Mono'}}, grid:{color:alphaColor(0.06)}, ticks:{color:alphaColor(0.4),font:{family:'JetBrains Mono',size:8}} },
                            y:{ title:{display:true,text:'Alpha (%)',color:alphaColor(0.3),font:{size:8,family:'JetBrains Mono'}}, grid:{color:alphaColor(0.06)}, ticks:{color:alphaColor(0.4),font:{family:'JetBrains Mono',size:8},callback:v=>`${v>0?'+':''}${v.toFixed(1)}%`} }
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
                const palette=['#7dd3fc','#22c55e','#f59e0b','#8b5cf6','#ef4444','#60a5fa','#fb923c','#a78bfa','#34d399'];
                new Chart(el.getContext('2d'), {
                    type:'doughnut',
                    data:{ labels, datasets:[{ data:counts, backgroundColor:labels.map((_,i)=>palette[i%palette.length]+'cc'), borderColor:'rgba(5,7,30,1)', borderWidth:2, hoverOffset:6 }]},
                    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
                        plugins:{ legend:{display:true,position:'right',labels:{color:alphaColor(0.5),font:{family:'JetBrains Mono',size:8},boxWidth:10,padding:8}},
                            tooltip:{ backgroundColor:'rgba(13,17,23,0.95)', titleColor:'#7dd3fc', bodyColor:'#e2e8f0',
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
                        plugins:{ legend:{display:false}, tooltip:{backgroundColor:'rgba(13,17,23,0.95)',titleColor:'#7dd3fc',callbacks:{title:i=>`BTC Corr: ${i[0].label}`,label:c=>`${c.raw} signals`}}},
                        scales:{
                            x:{ grid:{display:false}, ticks:{color:c2=>{const v=parseFloat(binLabels[c2.index]);return Math.abs(v)>0.6?'rgba(239,68,68,0.8)':Math.abs(v)>0.3?'rgba(0,242,255,0.6)':alphaColor(0.3);},font:{family:'JetBrains Mono',size:7},maxTicksLimit:9,maxRotation:0} },
                            y:{ display:true, position:'right', grid:{color:alphaColor(0.04)}, ticks:{color:alphaColor(0.3),font:{family:'JetBrains Mono',size:8},maxTicksLimit:4} }
                        }
                    }
                });
            }, 140);

            // Alpha Leaders Horizontal Bar
            setTimeout(() => {
                const el = document.getElementById('cmd-topAlphaChart');
                if (!el) return;
                const existing = Chart.getChart('cmd-topAlphaChart'); if (existing) existing.destroy();
                const sorted=[..._sigs].filter(s=>s.alpha!==undefined).sort((a,b)=>parseFloat(b.alpha)-parseFloat(a.alpha)).slice(0,8);
                const labels=sorted.map(s=>s.ticker.replace('-USD','')), values=sorted.map(s=>parseFloat(s.alpha));
                const colors=values.map(v=>v>=0?'rgba(34,197,94,0.75)':'rgba(239,68,68,0.75)');
                new Chart(el.getContext('2d'), {
                    type:'bar',
                    data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderColor:colors.map(c=>c.replace(/[\d.]+\)$/,'1)')), borderWidth:1, borderRadius:4 }]},
                    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
                        plugins:{ legend:{display:false}, tooltip:{backgroundColor:'rgba(13,17,23,0.95)',titleColor:'#7dd3fc',bodyColor:'#e2e8f0',callbacks:{label:c=>` Alpha: ${c.raw>=0?'+':''}${parseFloat(c.raw).toFixed(2)}%`}}},
                        scales:{
                            x:{ grid:{color:alphaColor(0.05)}, ticks:{color:alphaColor(0.35),font:{family:'JetBrains Mono',size:8},callback:v=>`${v>0?'+':''}${v.toFixed(1)}%`} },
                            y:{ grid:{display:false}, ticks:{color:alphaColor(0.6),font:{family:'JetBrains Mono',size:9,weight:'700'}} }
                        }
                    }
                });
            }, 170);
        }

    } catch (e) {
        console.error("Command Center Synergy Error:", e);
    }
}

// - Chart Zoom Modal -
function openCmdChartModal(key) {
    const modal = document.getElementById('cmdChartModal');
    const titleEl = document.getElementById('cmdModalTitle');
    const subtitleEl = document.getElementById('cmdModalSubtitle');
    if (!modal) return;

    const sigs = window._cmdSigs || [];
    const existing = Chart.getChart('cmdModalCanvas'); if (existing) existing.destroy();
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const ttBg = isLight ? 'rgba(255,255,255,0.97)' : 'rgba(13,17,23,0.97)';
    const ttTitle = isLight ? '#0284c7' : '#7dd3fc';
    const ttBody = isLight ? '#334155' : '#e2e8f0';
    const gridCol = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)';
    const el = document.getElementById('cmdModalCanvas');
    if (!el) return;
    // For chart-based modals, require signals/etf/radar data. Corr modal uses corrData instead.
    if (key !== 'corr' && key !== 'etf' && key !== 'radar' && !sigs.length) return;
    if (key === 'etf'   && !window._cmdEtfData)   return;
    if (key === 'radar' && !window._cmdRadarData) return;

    const meta = {
        scatter:  { title: 'Alpha vs Z-Score',        subtitle: 'SIGNAL QUALITY - GREEN=QUALITY - CYAN=HIDDEN GEM - RED=OVEREXTENDED - GREY=WEAK' },
        donut:    { title: 'Category Mix',             subtitle: 'SECTOR BREAKDOWN - % DISTRIBUTION OF LIVE SIGNALS' },
        btccorr:  { title: 'BTC Correlation',          subtitle: 'CORRELATION SPREAD - SIGNAL UNIVERSE VS BITCOIN' },
        alpha:    { title: 'Alpha Leaders',            subtitle: 'TOP 12 BY RELATIVE ALPHA - VS CRYPTO MARKET AVERAGE' },
        corr:     { title: 'Macro Correlation Matrix', subtitle: 'PAIRWISE PEARSON CORRELATION - CYAN=POSITIVE - RED=NEGATIVE - OPACITY=STRENGTH' },
        etf:      { title: '10D ETF Net Flows',        subtitle: 'IBIT - FBTC - ARKB - BITB - STACKED DAILY FLOWS ($M) + CUMULATIVE NET' },
        radar:    { title: 'Signal Confidence Radar',  subtitle: '6-DIMENSION ML DECOMPOSITION - MOMENTUM - SENTIMENT - VOLATILITY - TREND - LIQUIDITY - NETWORK' },
    };
    titleEl.textContent    = meta[key]?.title    || '';
    subtitleEl.textContent = meta[key]?.subtitle || '';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Widen panel for ETF chart, reset for others
    const innerPanel = modal.querySelector('div');
    if (innerPanel) {
        innerPanel.style.width = key === 'etf' ? 'min(96vw, 1600px)' : 'min(90vw, 1100px)';
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCmdChartModal(); }, { once: true });

    // Correlation matrix is div-based - handle separately
    if (key === 'corr') {
        el.style.display = 'none'; // hide canvas
        let corrDiv = document.getElementById('cmdModalCorrDiv');
        if (!corrDiv) {
            corrDiv = document.createElement('div');
            corrDiv.id = 'cmdModalCorrDiv';
            el.parentNode.appendChild(corrDiv);
        }
        corrDiv.style.cssText = 'height:65vh;overflow:auto;padding:8px';
        const data = window._cmdCorrData;
        if (!data) { corrDiv.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:2rem">No correlation data cached yet - open Command Center first.</p>'; return; }

        const labels = data.tickers || data.assets || [];
        const matrix = data.matrix || [];
        const n = labels.length;
        const cellPx = Math.max(36, Math.min(60, Math.floor((window.innerWidth * 0.78) / (n + 1))));

        // Build labelled grid: top row = column headers (rotated), first col = row labels
        let html = `<div style="display:inline-grid;grid-template-columns:${cellPx*1.6}px repeat(${n},${cellPx}px);gap:1px;min-width:max-content">`;
        // Top-left empty corner
        html += `<div></div>`;
        // Column headers (rotated)
        labels.forEach(l => {
            html += `<div style="writing-mode:vertical-lr;transform:rotate(180deg);font-size:${Math.min(9,cellPx*0.22)}px;font-weight:700;
                color:${alphaColor(0.5)};font-family:'JetBrains Mono';text-align:center;padding:4px 0;white-space:nowrap">${l.replace('-USD','')}</div>`;
        });
        // Data rows
        labels.forEach((rowLabel, ri) => {
            // Row label
            html += `<div style="font-size:${Math.min(9,cellPx*0.22)}px;font-weight:700;color:${alphaColor(0.6)};
                font-family:'JetBrains Mono';display:flex;align-items:center;justify-content:flex-end;
                padding-right:6px;white-space:nowrap">${rowLabel.replace('-USD','')}</div>`;
            // Cells for this row
            labels.forEach((colLabel, ci) => {
                const cell = matrix.find(c => {
                    const cx = c.x || c.assetA, cy = c.y || c.assetB;
                    return cx === rowLabel && cy === colLabel;
                });
                const v = cell ? (cell.v !== undefined ? cell.v : cell.correlation) : 0;
                const isdiag = ri === ci;
                const opacity = isdiag ? 0.15 : Math.abs(v);
                const bg = isdiag ? alphaColor(0.08) : v > 0 ? `rgba(0,242,255,${opacity.toFixed(2)})` : `rgba(255,62,62,${opacity.toFixed(2)})`;
                const textColor = Math.abs(v) > 0.5 || isdiag ? 'white' : alphaColor(0.6);
                html += `<div title="${rowLabel.replace('-USD','')} vs ${colLabel.replace('-USD','')}: ${v.toFixed ? v.toFixed(2) : v}"
                    style="width:${cellPx}px;height:${cellPx}px;background:${bg};display:flex;align-items:center;justify-content:center;
                    font-size:${Math.min(9,cellPx*0.2)}px;font-weight:900;color:${textColor};
                    font-family:'JetBrains Mono';border:1px solid rgba(0,0,0,0.15);border-radius:2px">
                    ${isdiag ? rowLabel.replace('-USD','') : (v.toFixed ? v.toFixed(2) : '')}
                </div>`;
            });
        });
        html += '</div>';
        corrDiv.innerHTML = html;
        return; // skip the setTimeout below
    }

    // Hide any old corr div
    const oldCorrDiv = document.getElementById('cmdModalCorrDiv');
    if (oldCorrDiv) { oldCorrDiv.style.display = 'none'; }
    el.style.display = '';

    setTimeout(() => {
        const ctx = el.getContext('2d');
        if (key === 'scatter') {
            const pts = sigs.map(s => ({ x: parseFloat(s.zScore)||0, y: parseFloat(s.alpha)||0, label: s.ticker.replace('-USD','') }));
            const quadPlugin = { id:'modalQuadrants', beforeDraw(chart) {
                const {ctx:c,chartArea:{left,top,right,bottom},scales:{x,y}} = chart;
                const mx=x.getPixelForValue(0), my=y.getPixelForValue(0); c.save();
                c.fillStyle='rgba(34,197,94,0.05)';   c.fillRect(mx,top,right-mx,my-top);
                c.fillStyle='rgba(0,242,255,0.05)';   c.fillRect(left,top,mx-left,my-top);
                c.fillStyle='rgba(148,163,184,0.02)'; c.fillRect(left,my,mx-left,bottom-my);
                c.fillStyle='rgba(239,68,68,0.05)';   c.fillRect(mx,my,right-mx,bottom-my);
                // Quadrant labels - positioned at centre of each quadrant, not at the origin
                c.font='bold 10px JetBrains Mono'; c.globalAlpha = isLight ? 0.7 : 0.4;
                c.fillStyle= isLight ? '#16a34a' : '#22c55e'; c.fillText('QUALITY SIGNALS', mx+(right-mx)/2-55, top+20);
                c.fillStyle= isLight ? '#0284c7' : '#7dd3fc'; c.fillText('HIDDEN GEMS',     left+8,             top+20);
                c.fillStyle= isLight ? '#64748b' : '#94a3b8'; c.fillText('WEAK SHORT',      left+8,             my+(bottom-my)/2);
                c.fillStyle= isLight ? '#dc2626' : '#ef4444'; c.fillText('OVEREXTENDED',    mx+(right-mx)/2-46, my+(bottom-my)/2);
                c.globalAlpha=1; c.restore();
            }};
            new Chart(ctx, {
                type:'scatter', plugins:[quadPlugin],
                data:{ datasets:[{ data:pts, pointRadius:7, pointHoverRadius:10,
                    backgroundColor: pts.map(p=> p.x>0&&p.y>0?'rgba(34,197,94,0.8)':p.x<0&&p.y>0?'rgba(0,242,255,0.8)':p.x>0&&p.y<0?'rgba(239,68,68,0.7)':'rgba(148,163,184,0.55)'),
                    borderWidth:0 }]},
                options:{ responsive:true, maintainAspectRatio:false, animation:{duration:400},
                    plugins:{ legend:{display:false}, tooltip:{ backgroundColor:ttBg, titleColor:ttTitle, bodyColor:ttBody, titleFont:{family:'JetBrains Mono',size:13,weight:'700'}, bodyFont:{family:'JetBrains Mono',size:11}, padding:12,
                        callbacks:{ title:i=>i[0].raw.label, label:c=>`Z-Score: ${c.raw.x.toFixed(2)}-   Alpha: ${c.raw.y>=0?'+':''}${c.raw.y.toFixed(2)}%` }}},
                    scales:{
                        x:{ title:{display:true,text:'Z-Score (-)',color:alphaColor(0.8),font:{size:11,family:'JetBrains Mono',weight:'700'}}, grid:{color:gridCol}, ticks:{color:alphaColor(0.8),font:{family:'JetBrains Mono',size:10}} },
                        y:{ title:{display:true,text:'Relative Alpha (%)',color:alphaColor(0.8),font:{size:11,family:'JetBrains Mono',weight:'700'}}, grid:{color:gridCol}, ticks:{color:alphaColor(0.8),font:{family:'JetBrains Mono',size:10},callback:v=>`${v>0?'+':''}${v.toFixed(1)}%`} }
                    }
                }
            });
        } else if (key === 'donut') {
            const cats = {}; sigs.forEach(s=>{ cats[s.category]=(cats[s.category]||0)+1; });
            const labels=Object.keys(cats), counts=labels.map(k=>cats[k]);
            const palette=['#7dd3fc','#22c55e','#f59e0b','#8b5cf6','#ef4444','#60a5fa','#fb923c','#a78bfa','#34d399'];
            new Chart(ctx, {
                type:'doughnut',
                data:{ labels, datasets:[{ data:counts, backgroundColor:labels.map((_,i)=>palette[i%palette.length]+'cc'), borderColor:'rgba(5,7,30,1)', borderWidth:3, hoverOffset:12 }]},
                options:{ responsive:true, maintainAspectRatio:false, cutout:'55%', animation:{duration:600,animateRotate:true},
                    plugins:{ legend:{display:true,position:'right',labels:{color:alphaColor(0.7),font:{family:'JetBrains Mono',size:13},boxWidth:14,padding:14}},
                        tooltip:{ backgroundColor:ttBg, titleColor:ttTitle, bodyColor:ttBody, titleFont:{family:'JetBrains Mono',size:13}, bodyFont:{family:'JetBrains Mono',size:11}, padding:12,
                            callbacks:{label:c=>` ${c.label}: ${c.raw} signals (${Math.round(c.raw/sigs.length*100)}%)`}}}
                }
            });
        } else if (key === 'btccorr') {
            const bins=[], binLabels=[];
            for(let v=-1;v<=1+1e-9;v=parseFloat((v+0.1).toFixed(1))){ bins.push(v); binLabels.push(v.toFixed(1)); }
            const counts=new Array(bins.length).fill(0);
            sigs.forEach(s=>{ const corr=Math.max(-1,Math.min(1,parseFloat(s.btcCorrelation)||0)); const idx=Math.round((corr+1)/0.1); if(idx>=0&&idx<counts.length)counts[idx]++; });
            const barBg=bins.map(v=>v<-0.6?'rgba(239,68,68,0.85)':v<-0.3?'rgba(251,146,60,0.75)':v<0.3?'rgba(148,163,184,0.45)':v<0.6?'rgba(0,242,255,0.65)':'rgba(34,197,94,0.85)');
            new Chart(ctx, {
                type:'bar',
                data:{ labels:binLabels, datasets:[{ data:counts, backgroundColor:barBg, borderColor:barBg.map(c=>c.replace(/[\d.]+\)$/,'1)')), borderWidth:1, borderRadius:4 }]},
                options:{ responsive:true, maintainAspectRatio:false, animation:{duration:500},
                    plugins:{ legend:{display:false}, tooltip:{backgroundColor:ttBg,titleColor:ttTitle,bodyColor:ttBody,titleFont:{family:'JetBrains Mono',size:13},bodyFont:{family:'JetBrains Mono',size:11},padding:12,
                        callbacks:{title:i=>`BTC Correlation: ${i[0].label}`,label:c=>`${c.raw} signals in this bucket`}}},
                    scales:{
                        x:{ grid:{display:false}, ticks:{color:c2=>{const v=parseFloat(binLabels[c2.index]);return Math.abs(v)>0.6?'rgba(239,68,68,0.9)':Math.abs(v)>0.3?'rgba(0,242,255,0.7)':alphaColor(0.4);},font:{family:'JetBrains Mono',size:10},maxRotation:0} },
                        y:{ display:true, position:'right', grid:{color:alphaColor(0.05)}, ticks:{color:alphaColor(0.4),font:{family:'JetBrains Mono',size:10}} }
                    }
                }
            });
        } else if (key === 'alpha') {
            const sorted=[...sigs].filter(s=>s.alpha!==undefined).sort((a,b)=>parseFloat(b.alpha)-parseFloat(a.alpha)).slice(0,12);
            const labels=sorted.map(s=>s.ticker.replace('-USD','')), values=sorted.map(s=>parseFloat(s.alpha));
            const colors=values.map(v=>v>=0?'rgba(34,197,94,0.8)':'rgba(239,68,68,0.8)');
            new Chart(ctx, {
                type:'bar',
                data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderColor:colors.map(c=>c.replace(/[\d.]+\)$/,'1)')), borderWidth:1, borderRadius:6 }]},
                options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, animation:{duration:500},
                    plugins:{ legend:{display:false}, tooltip:{backgroundColor:ttBg,titleColor:ttTitle,bodyColor:ttBody,titleFont:{family:'JetBrains Mono',size:13},bodyFont:{family:'JetBrains Mono',size:11},padding:12,
                        callbacks:{label:c=>` Relative Alpha: ${c.raw>=0?'+':''}${parseFloat(c.raw).toFixed(2)}%`}}},
                    scales:{
                        x:{ grid:{color:alphaColor(0.06)}, ticks:{color:alphaColor(0.45),font:{family:'JetBrains Mono',size:10},callback:v=>`${v>0?'+':''}${v.toFixed(1)}%`} },
                        y:{ grid:{display:false}, ticks:{color:alphaColor(0.75),font:{family:'JetBrains Mono',size:11,weight:'700'}} }
                    }
                }
            });
        } else if (key === 'radar') {
            const rd = window._cmdRadarData;
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: rd.labels,
                    datasets: [{
                        label: (rd.ticker || 'BTC').replace('-USD','') + ' Confidence',
                        data: rd.values,
                        borderColor: '#7dd3fc',
                        backgroundColor: 'rgba(0,242,255,0.1)',
                        pointBackgroundColor: '#7dd3fc',
                        pointBorderColor: 'rgba(0,242,255,0.6)',
                        pointRadius: 6,
                        pointHoverRadius: 9,
                        borderWidth: 2.5
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: true, animation: { duration: 500 },
                    layout: { padding: -35 },
                    plugins: {
                        legend: { labels: { color: alphaColor(0.6), font: { family: 'JetBrains Mono', size: 11 }, padding: 8 } },
                        tooltip: {
                            backgroundColor: ttBg, titleColor: ttTitle, bodyColor: ttBody,
                            bodyFont: { family: 'JetBrains Mono', size: 11 }, padding: 12,
                            callbacks: { label: c => ` ${c.label}: ${c.raw}/100` }
                        }
                    },
                    scales: { r: {
                        min: 0, max: 100,
                        ticks: { stepSize: 25, color: alphaColor(0.3), backdropColor: 'transparent', font: { size: 10, family: 'JetBrains Mono' } },
                        grid: { color: alphaColor(0.08) },
                        angleLines: { color: alphaColor(0.08) },
                        pointLabels: { color: alphaColor(0.8), font: { size: 13, family: 'JetBrains Mono', weight: '700' }, padding: 6 }
                    }}
                }
            });
        } else if (key === 'etf') {
            const etf = window._cmdEtfData;
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: etf.labels,
                    datasets: [
                        ...etf.datasets.map(ds => ({
                            label: ds.name,
                            data: ds.data,
                            backgroundColor: ds.color + 'cc',
                            borderColor: ds.color,
                            borderWidth: 1,
                            borderRadius: 4,
                            stack: 'stack0'
                        })),
                        {
                            label: 'CUMULATIVE ($M)',
                            type: 'line',
                            data: etf.cumulative,
                            borderColor: alphaColor(0.6),
                            borderWidth: 2.5,
                            pointRadius: 5,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: 'rgba(0,242,255,0.8)',
                            pointBorderWidth: 2,
                            yAxisID: 'y1',
                            fill: false,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { labels: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 11 }, boxWidth: 12, padding: 16 } },
                        tooltip: {
                            backgroundColor: ttBg, titleColor: ttTitle, bodyColor: ttBody,
                            titleFont: { family: 'JetBrains Mono', size: 13 }, bodyFont: { family: 'JetBrains Mono', size: 11 }, padding: 12,
                            callbacks: { label: c => ` ${c.dataset.label}: ${c.raw >= 0 ? '+' : ''}${c.raw}M` }
                        }
                    },
                    scales: {
                        x: { stacked: true, grid: { display: false }, ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 }, maxRotation: 35 } },
                        y: { stacked: true, grid: { color: alphaColor(0.05) },
                             ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 10 }, callback: v => '$' + v + 'M' },
                             title: { display: true, text: 'DAILY FLOW ($M)', color: '#7dd3fc', font: { size: 10 } } },
                        y1: { position: 'right', grid: { display: false },
                              ticks: { color: alphaColor(0.4), font: { family: 'JetBrains Mono', size: 10 }, callback: v => '$' + v + 'M' },
                              title: { display: true, text: 'CUMULATIVE ($M)', color: alphaColor(0.3), font: { size: 10 } } }
                    }
                }
            });
        }
    }, 30);
}

function closeCmdChartModal() {
    const modal = document.getElementById('cmdChartModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    const existing = Chart.getChart('cmdModalCanvas'); if (existing) existing.destroy();
    const corrDiv = document.getElementById('cmdModalCorrDiv');
    if (corrDiv) corrDiv.style.display = 'none';
    const canvasEl = document.getElementById('cmdModalCanvas');
    if (canvasEl) canvasEl.style.display = '';
}

// ============= BTC Top-Bar Sparkline =============
let _btcSparkChartInst = null;
let _sparkPriceHistory = [];  // rolling 60-point price buffer fed from WebSocket
let _btcOpen24h = null;       // yesterday's close price - set once from /api/btc for accurate 24h %

// Called from the WS price handler to feed the sparkline in real-time
function pushSparklinePrice(price) {
    if (!price || isNaN(price)) return;
    _sparkPriceHistory.push(price);
    if (_sparkPriceHistory.length > 60) _sparkPriceHistory.shift();

    // - Live-update price text on every tick -
    const priceEl  = document.getElementById('btc-spark-price');
    const changeEl = document.getElementById('btc-spark-change');
    if (priceEl) priceEl.textContent = '$' + Math.round(price).toLocaleString('en-US');
    if (changeEl) {
        // Prefer the real 24h open set by initBTCSparkline; fall back to buffer start
        const baseline = _btcOpen24h || (_sparkPriceHistory.length >= 2 ? _sparkPriceHistory[0] : null);
        if (baseline) {
            const pct  = ((price - baseline) / baseline * 100).toFixed(2);
            const isUp = price >= baseline;
            changeEl.textContent = (isUp ? '+' : '') + pct + '%';
            changeEl.style.color = isUp ? '#22c55e' : '#ef4444';
        }
    }

    // Live-update canvas without re-fetching if chart already exists
    if (_btcSparkChartInst && _btcSparkChartInst.data) {
        try {
            const ds = _btcSparkChartInst.data.datasets[0];
            ds.data = _sparkPriceHistory.slice();
            _btcSparkChartInst.data.labels = _sparkPriceHistory.map((_, i) => i);
            const isUp = _sparkPriceHistory[_sparkPriceHistory.length - 1] >= _sparkPriceHistory[0];
            const color = isUp ? '#22c55e' : '#ef4444';
            ds.borderColor = color;
            ds.backgroundColor = isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            _btcSparkChartInst.update('none');
        } catch(e) {}
    }
}


async function initBTCSparkline(_retries) {
    const canvas = document.getElementById('btcSparklineChart');
    const priceEl = document.getElementById('btc-spark-price');
    const changeEl = document.getElementById('btc-spark-change');
    if (!canvas) return;

    // Guard: Chart.js must be loaded. Retry up to 5 times at 500ms intervals.
    if (typeof Chart === 'undefined') {
        if ((_retries || 0) < 5) setTimeout(() => initBTCSparkline((_retries || 0) + 1), 500);
        return;
    }

    // Ensure canvas has a valid draw surface
    canvas.width  = 80;
    canvas.height = 36;

    try {
        let prices = null, latest = null, prev = null;

        // Priority 1: Use WebSocket live price cache (zero latency)
        if (window.livePrices && window.livePrices.BTC) {
            latest = window.livePrices.BTC;
            // Build synthetic walk from rolling history or seed
            if (_sparkPriceHistory.length >= 2) {
                prices = _sparkPriceHistory.slice();
                prev   = prices[0];
            } else {
                prev = latest * 0.99;  // assume +1% from yesterday as placeholder
                prices = [];
                let v = prev, seed = Math.floor(latest) % 9999;
                const rng = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };
                const step = (latest - prev) / 48;
                for (let i = 0; i < 48; i++) { v += step + (rng() - 0.5) * (latest * 0.003); prices.push(v); }
                prices.push(latest);
            }
            // Always fetch real 24h open in background so % tag is accurate
            if (!_btcOpen24h) {
                fetch('/api/btc').then(r => r.json()).then(bd => {
                    if (bd.prev_close) {
                        _btcOpen24h = bd.prev_close;
                    } else if (bd.price && bd.change != null) {
                        _btcOpen24h = bd.price / (1 + bd.change / 100);
                    }
                }).catch(() => {});
            }
        }


        // Priority 2: Public /api/btc (no auth required)
        if (!latest) {
            try {
                const br = await fetch('/api/btc');
                if (br.ok) {
                    const bd = await br.json();
                    latest = bd.price || 0;
                    const chg = bd.change || 0;
                    if (latest > 0) {
                        prev = bd.prev_close || (latest / (1 + chg / 100));
                        _btcOpen24h = prev;  // store real 24h open for accurate % display
                        let seed = Math.floor(latest) % 9999;
                        const rng = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };
                        prices = [];
                        let v = prev;
                        const step = (latest - prev) / 48;
                        for (let i = 0; i < 48; i++) { v += step + (rng() - 0.5) * (latest * 0.003); prices.push(v); }
                        prices.push(latest);
                    }
                }
            } catch(e) { /* silent */ }
        }


        // If neither source has data yet, retry in 1s (server might still be warming up)
        if (!latest || !prices) {
            if ((_retries || 0) < 8) setTimeout(() => initBTCSparkline((_retries || 0) + 1), 1000);
            return;
        }

        const isUp = latest >= (prev || latest * 0.99);
        const pct  = prev ? ((latest - prev) / prev * 100).toFixed(2) : '0.00';
        const color = isUp ? '#22c55e' : '#ef4444';

        if (priceEl) priceEl.textContent = '$' + Math.round(latest).toLocaleString('en-US');
        if (changeEl) { changeEl.textContent = (isUp ? '+' : '') + pct + '%'; changeEl.style.color = color; }

        // Seed rolling history if empty
        if (_sparkPriceHistory.length < 2) _sparkPriceHistory = prices.slice();

        // Destroy any previous instance cleanly
        if (_btcSparkChartInst) { try { _btcSparkChartInst.destroy(); } catch(e) {} _btcSparkChartInst = null; }
        const existingChart = Chart.getChart ? Chart.getChart(canvas) : null;
        if (existingChart) { try { existingChart.destroy(); } catch(e) {} }

        _btcSparkChartInst = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: prices.map((_, i) => i),
                datasets: [{ data: prices, borderColor: color, borderWidth: 1.5, pointRadius: 0,
                    fill: true, backgroundColor: isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', tension: 0.35 }]
            },
            options: {
                responsive: false, maintainAspectRatio: false, animation: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });
    } catch(e) { console.warn('BTC Sparkline:', e); }
}



function initCommandGauges(macro, regime) {
    const fgCanvas = document.getElementById('cmd-gauge-fear');
    const fgValue  = document.getElementById('cmd-fear-val');
    if (!fgCanvas || !fgValue) return;

    // Fetch real Fear & Greed score from /api/fear-greed
    fetch('/api/fear-greed')
        .then(r => r.ok ? r.json() : null)
        .then(fg => {
            const score = fg?.score ?? 50;
            const label = fg?.label ?? 'NEUTRAL';
            const color = score >= 75 ? '#22c55e'
                        : score >= 55 ? '#86efac'
                        : score >= 45 ? '#facc15'
                        : score >= 25 ? '#fb923c'
                        : '#ef4444';
            fgValue.textContent = score;
            fgValue.style.color = color;
            // Small label below score
            let lbl = document.getElementById('cmd-fear-label');
            if (!lbl) {
                lbl = document.createElement('div');
                lbl.id = 'cmd-fear-label';
                lbl.style.cssText = 'font-size:0.55rem;letter-spacing:2px;color:${alphaColor(0.4)};margin-top:2px';
                fgValue.parentNode.appendChild(lbl);
            }
            lbl.textContent = label;
            const existing = Chart.getChart('cmd-gauge-fear'); if (existing) existing.destroy();
            new Chart(fgCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [score, 100 - score],
                        backgroundColor: [color, alphaColor(0.05)],
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
        })
        .catch(() => {
            fgValue.textContent = '--';
        });

    if (regime) {
        const regimeEl = document.getElementById('cmd-regime-status');
        if (regimeEl) {
            const r = regime.hmm_label || regime.current_regime || 'Compression';
            const rColors = {
                'Risk-On':     '#22c55e',
                'Compression': '#fbbf24',
                'Dislocation': '#ef4444',
            };
            regimeEl.textContent = r;
            regimeEl.style.color = rColors[r] || 'var(--accent)';
            // Sub-label: confidence + trend
            let sub = document.getElementById('cmd-regime-sub');
            if (!sub) {
                sub = document.createElement('div');
                sub.id = 'cmd-regime-sub';
                sub.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:8px';
                regimeEl.parentNode.appendChild(sub);
            }
            const pill = (label, bg, fg) =>
                `<span style="font-size:0.45rem;font-weight:700;letter-spacing:1px;padding:2px 7px;border-radius:20px;background:${bg};color:${fg};white-space:nowrap">${label}</span>`;
            const trendColor = { 'BULLISH': '#22c55e', 'BEARISH': '#ef4444', 'NEUTRAL': '#94a3b8' };
            const volColor   = { 'HIGH': '#f59e0b',   'LOW': '#7dd3fc',      'MEDIUM': '#94a3b8' };
            const tc = trendColor[regime.trend] || '#94a3b8';
            const vc = volColor[regime.volatility] || '#94a3b8';
            const pills = [];
            const conf = regime.hmm_confidence || (regime.confidence ? regime.confidence * 100 : null);
            if (conf != null)       pills.push(pill(`${Math.round(conf)}% CONF`, alphaColor(0.08), alphaColor(0.6)));
            if (regime.trend)       pills.push(pill(regime.trend, `${tc}22`, tc));
            if (regime.volatility)  pills.push(pill(`VOL ${regime.volatility}`, `${vc}22`, vc));
            sub.innerHTML = pills.join('');
        }
        renderRegimeHeatmap('cmd-regime-heatmap', regime.history || []);
    }
}

async function renderCommandETF() {
    const ctx = document.getElementById('cmd-etf-chart');
    if (!ctx) return;
    try {
        const r = await fetch('/api/etf-flows');
        const data = r.ok ? await r.json() : null;
        if (!data || !data.labels || !data.datasets) throw new Error('No ETF data');
        window._cmdEtfData = data; // cache for modal zoom
        const existing = Chart.getChart('cmd-etf-chart'); if (existing) existing.destroy();
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    ...data.datasets.map(ds => ({
                        label: ds.name,
                        data: ds.data,
                        backgroundColor: ds.color + 'cc',
                        borderColor: ds.color,
                        borderWidth: 1,
                        borderRadius: 3,
                        stack: 'stack0'
                    })),
                    {
                        label: 'CUMULATIVE ($M)',
                        type: 'line',
                        data: data.cumulative,
                        borderColor: alphaColor(0.5),
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: '#fff',
                        yAxisID: 'y1',
                        fill: false,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 9 }, boxWidth: 10 } },
                    tooltip: {
                        backgroundColor: 'rgba(13,17,23,0.95)', titleColor: '#7dd3fc', bodyColor: '#e2e8f0',
                        callbacks: { label: c => ` ${c.dataset.label}: ${c.raw >= 0 ? '+' : ''}${c.raw}M` }
                    }
                },
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { color: '#666', font: { family: 'JetBrains Mono', size: 8 }, maxRotation: 35 } },
                    y: { stacked: true, grid: { color: alphaColor(0.05) }, ticks: { color: '#666', callback: v => '$' + v + 'M' },
                       title: { display: true, text: 'DAILY FLOW ($M)', color: '#7dd3fc', font: { size: 9 } } },
                    y1: { position: 'right', grid: { display: false }, ticks: { color: alphaColor(0.4), callback: v => '$' + v + 'M' } }
                }
            }
        });
        // Update 7D header label to say data source
        const hdr = ctx.closest('.card')?.querySelector('h3');
        if (hdr && data.source) {
            const tag = data.source === 'yfinance_live' ? '- LIVE' : '- MODELLED';
            const tagColor = data.source === 'yfinance_live' ? '#22c55e' : '#f59e0b';
            if (!hdr.querySelector('.src-tag')) {
                const span = document.createElement('span');
                span.className = 'src-tag';
                span.style.cssText = `font-size:0.5rem;margin-left:8px;color:${tagColor};letter-spacing:1px`;
                span.textContent = tag;
                hdr.appendChild(span);
            }
        }
    } catch(e) {
        console.warn('ETF Flows chart error:', e);
        // Graceful degradation
        if (ctx) ctx.closest('.card') && (ctx.closest('.card').innerHTML += '<p style="color:var(--text-dim);font-size:0.7rem;text-align:center;padding:1rem">ETF flow data syncing...</p>');
    }
}

async function loadCmdRadar(ticker) {
    localStorage.setItem('cmd_radar_ticker', ticker);
    try {
        const data = await fetchAPI(`/signal-radar?ticker=${ticker}`);
        if (!data || !data.values) return;
        window._cmdRadarData = { ...data, ticker }; // cache for modal zoom
        const ctx = document.getElementById('cmd-radar-chart');
        if (!ctx) return;
        const existing = Chart.getChart('cmd-radar-chart'); if (existing) existing.destroy();
        new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: ticker.replace('-USD', '') + ' Confidence',
                    data: data.values,
                    borderColor: '#7dd3fc',
                    backgroundColor: 'rgba(0,242,255,0.08)',
                    pointBackgroundColor: '#7dd3fc',
                    pointRadius: 4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: alphaColor(0.5), font: { family: 'JetBrains Mono', size: 10 }, padding: 8 } } },
                scales: { r: {
                    min: 0, max: 100,
                    ticks: { stepSize: 25, color: alphaColor(0.25), backdropColor: 'transparent', font: { size: 9 } },
                    grid: { color: alphaColor(0.06) },
                    pointLabels: { color: alphaColor(0.75), font: { size: 12, family: 'JetBrains Mono' }, padding: 8 }
                }}
            }
        });
    } catch(e) { console.warn('Cmd Radar error:', e); }
}

// ============================================================
// AI "If I Were Trading Right Now" — widget fetch & render
// ============================================================
async function fetchAITradeNow(force = false) {
    const skeleton = document.getElementById('atn-skeleton');
    const content  = document.getElementById('atn-content');
    const errBox   = document.getElementById('atn-error');
    const metaEl   = document.getElementById('atn-meta');
    const btn      = document.getElementById('atn-refresh-btn');

    if (!skeleton) return; // widget not in current view

    // Show loading state
    if (skeleton) skeleton.style.display = 'flex';
    if (content)  content.style.display  = 'none';
    if (errBox)   errBox.style.display   = 'none';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:13px;animation:spin 1s linear infinite">refresh</span> LOADING';
    }
    if (metaEl) metaEl.textContent = 'QUERYING GPT-4o MARKET ENGINE...';

    try {
        const url = `/api/ai-trade-now${force ? '?force=true' : ''}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.error) throw new Error(data.error);

        // --- Direction chip config ---
        const dirChip = dir => {
            const map = {
                LONG:  { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#22c55e', icon: 'trending_up' },
                SHORT: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#ef4444', icon: 'trending_down' },
                HOLD:  { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', color: '#94a3b8', icon: 'horizontal_rule' },
            };
            const cfg = map[dir] || map['HOLD'];
            return `<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 10px;border-radius:5px;
                        background:${cfg.bg};border:1px solid ${cfg.border};color:${cfg.color};
                        font-size:0.7rem;font-weight:900;letter-spacing:1.5px;font-family:'JetBrains Mono',monospace;flex-shrink:0">
                        <span class="material-symbols-outlined" style="font-size:13px">${cfg.icon}</span>${dir}
                    </span>`;
        };

        const rankColor = r => r === 1 ? '#f59e0b' : r === 2 ? '#94a3b8' : '#78716c';
        const rankLabel = r => r === 1 ? '1ST' : r === 2 ? '2ND' : '3RD';

        // --- Render trades ---
        const tradesEl = document.getElementById('atn-trades');
        if (tradesEl && data.trades) {
            tradesEl.innerHTML = data.trades.map(t => `
                <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:8px;
                            background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);
                            transition:border-color 0.15s"
                     onmouseover="this.style.borderColor='rgba(0,242,255,0.12)'"
                     onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
                    <!-- Rank badge -->
                    <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.04);
                                border:1px solid ${rankColor(t.rank)}44;display:flex;flex-direction:column;
                                align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
                        <span style="font-size:0.6rem;color:${rankColor(t.rank)};font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:1px">${rankLabel(t.rank)}</span>
                    </div>
                    <!-- Trade details -->
                    <div style="flex:1;min-width:0">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap">
                            <span style="font-size:1rem;font-weight:900;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${t.asset || ''}</span>
                            ${dirChip(t.direction || 'HOLD')}
                        </div>
                        <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;margin-bottom:4px">${t.rationale || ''}</div>
                        <div style="font-size:0.7rem;color:rgba(239,68,68,0.65);display:flex;align-items:center;gap:4px">
                            <span class="material-symbols-outlined" style="font-size:10px">warning</span>
                            <span>${t.risk || ''}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // --- Headline & bottom line ---
        const headlineEl   = document.getElementById('atn-headline');
        const bottomLineEl = document.getElementById('atn-bottom-line');
        if (headlineEl)   headlineEl.textContent   = data.headline   || '';
        if (bottomLineEl) bottomLineEl.textContent = data.bottom_line || '';

        // --- Meta line ---
        const ttl     = data.cache_ttl_remaining || 0;
        const ttlMin  = ttl > 0 ? `· refreshes in ${Math.ceil(ttl / 60)}min` : '· live analysis';
        const cached  = data.cached ? ' · cached' : '';
        const src     = data.source === 'gpt-4o-mini' ? 'GPT-4o-mini' : data.source === 'static_fallback' ? 'static fallback' : data.source || '';
        if (metaEl) metaEl.textContent = `GENERATED ${data.generated_at || ''}${cached} · ${src}${ttlMin}`;

        // Show content, hide skeleton
        if (skeleton) skeleton.style.display = 'none';
        if (content)  content.style.display  = 'block';

    } catch (err) {
        console.error('[AITradeNow]', err);
        if (skeleton) skeleton.style.display = 'none';
        if (errBox)   errBox.style.display   = 'block';
        if (metaEl)   metaEl.textContent     = 'ANALYSIS UNAVAILABLE';
    } finally {
        // Restore refresh button
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:13px">refresh</span> REFRESH';
        }
    }
}
