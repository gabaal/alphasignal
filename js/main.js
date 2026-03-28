
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
    'macro-calendar': renderMacroCalendar,
    whales: renderWhales,
    regime: renderRegime,
    'global-hub': renderGlobalHub,
    'macro-hub': renderMacroHub,
    'alpha-hub': renderAlphaHub,
    'institutional-hub': renderInstitutionalHub,
    'analytics-hub': renderAnalyticsHub,
    'audit-hub': renderAuditHub,
    'risk-hub': renderRiskHub,
    macro: renderMacroSync,
    'token-unlocks': renderTokenUnlocks,
    'yield-lab': renderYieldLab,
    rotation: renderRotation,
    velocity: renderChainVelocity,
    portfolio: renderPortfolioLab,
    'portfolio-optimizer': renderPortfolioOptimizer,
    'strategy-lab': renderStrategyLab,
    'backtester-v2': renderBacktesterV2,
    risk: renderRiskMatrix,
    stress: renderStressHub,
    narrative: renderNarrativeGalaxy,
    newsroom: renderNewsroom,
    alerts: renderAlerts,
    tradelab: renderTradeLab,
    liquidity: renderLiquidityView,
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
    'command-center': renderCommandCenter,
    'macro-hub': renderMacroHub,
    'alpha-hub': renderAlphaHub,
    'trade-ledger': renderTradeLedger,
    'ask-terminal': renderAskTerminal,
    'explain-ai-engine': renderDocsAIEngine,
    help: renderHelp
};

async function renderCommandCenter() {
    appEl.innerHTML = `
        <div class="view-header" style="margin-bottom:2rem">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">dashboard</span> Institutional Command Center <span class="premium-badge">MASTER VIEW</span></h1>
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
        const [macro, regime, etf, signals, catalysts] = await Promise.all([
            fetchAPI('/macro'),
            fetchAPI('/regime'),
            fetchAPI('/fear-greed'), // Reusing fear-greed endpoint for the dial
            fetchAPI('/signals'),
            fetchAPI('/macro-calendar')
        ]);

        // 1. Fear & Greed Dial
        if (macro) {
            const fg = regime; // FearGreed if available
            // Note: Since endpoints vary, we'll use placeholder logic or existing helpers
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

        // 6. CME Gaps
        try {
            if (catalysts) {
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
            }
        } catch(e) { console.error("Gaps Error:", e); }

    } catch (e) {
        console.error("Command Center Synergy Error:", e);
    }
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
    const group = (label, icon, cards) => `
        <div style="margin-bottom:2.5rem;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;padding-bottom:0.6rem;border-bottom:1px solid rgba(0,242,255,0.12);">
                <span class="material-symbols-outlined" style="color:var(--accent);font-size:1.2rem;">${icon}</span>
                <span style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;">${label}</span>
            </div>
            <div class="f-grid">${cards}</div>
        </div>`;
    const card = (view, icon, title, desc) => `
        <div class="f-card" onclick="switchView('${view}')">
            <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px;color:var(--accent);">${icon}</span></div>
            <h3>${title}</h3><p>${desc}</p>
        </div>`;

    appEl.innerHTML = `
        <div class="view-header"><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent);">help</span>Terminal Documentation</h1></div>
        <div class="doc-container" style="max-width:960px;margin:0 auto;padding-top:1.5rem;">
            <p style="font-size:1rem;color:var(--text-dim);margin-bottom:2.5rem;line-height:1.6;">Select a module below to view detailed methodology, data sources and analytical frameworks. Organised by sidebar hub.</p>

            ${group('Command Center & Signals', 'dashboard', `
                ${card('explain-signals', 'radar', 'Signal Intelligence', 'Understanding Z-Score deviations and alpha generation.')}
                ${card('explain-ml-engine', 'model_training', 'ML Alpha Engine', 'Neural feature synthesis and predictive modelling.')}
                ${card('explain-alpha-score', 'electric_bolt', 'Alpha Score', 'Composite ranking and scoring methodology.')}
                ${card('explain-signal-archive', 'history', 'Signal Archive', 'Historical signal record and PnL tracking.')}
                ${card('explain-zscore', 'insights', 'Z-Score Interpretation', 'Decoding statistical intensity and outlier detection.')}
                ${card('explain-alerts', 'event', 'Signal Alerts & Catalysts', 'Configuring alerts and tracking macro catalyst events.')}
                ${card('explain-telegram', 'notifications_active', 'Alert Hooks', 'Configuring Telegram & Push Intelligence.')}
            `)}

            ${group('Global Markets Hub', 'public', `
                ${card('explain-briefing', 'memory', 'Market Briefing (AI)', 'How global market trends are neutrally synthesised.')}
                ${card('explain-liquidity', 'bar_chart', 'Capital Flows & Order Flow', 'Interpreting liquidity walls and execution tape.')}
                ${card('explain-correlation', 'grid_4x4', 'Sector Rotation & Correlation', 'Identifying market decoupling and rotation events.')}
            `)}

            ${group('Macro Intel Hub', 'monitoring', `
                ${card('explain-regimes', 'layers', 'Market Regimes', 'Identifying institutional cycles and trends.')}
                ${card('explain-benchmark', 'science', 'Portfolio Simulation', 'Modelling and backtesting quant portfolios.')}
                ${card('explain-zscore', 'insights', 'Macro Z-Score', 'Interpreting statistical deviations across macro assets.')}
            `)}

            ${group('Alpha Strategy Hub', 'electric_bolt', `
                ${card('explain-alpha', 'trending_up', 'Alpha Strategy', 'Trading relative strength and market benchmarks.')}
                ${card('explain-alpha-score', 'bolt', 'Alpha Score Composite', 'Multi-factor ranking and composite scoring.')}
                ${card('explain-playbook', 'auto_stories', 'Trading Playbook', 'Advanced strategies and signal combinations.')}
                ${card('explain-performance', 'trending_up', 'Audit & Performance', 'Win rate, returns, and monthly breakdowns.')}
            `)}

            ${group('Institutional Hub', 'key', `
                ${card('explain-portfolio-lab', 'biotech', 'Portfolio Optimizer', 'ML rebalancing and Markowitz Efficient Frontier.')}
                ${card('explain-benchmark', 'science', 'Yield Lab & Token Unlocks', 'Modelling token unlock events and yield curves.')}
            `)}

            ${group('Analytics Hub', 'analytics', `
                ${card('explain-whales', 'waves', 'Whale Pulse', 'Detecting massive on-chain block transactions.')}
                ${card('explain-velocity', 'speed', 'Chain Velocity', 'Capital rotation tracking and volume acceleration.')}
                ${card('explain-onchain', 'link', 'On-Chain Analytics', 'Macro network metrics & MVRV modelling.')}
                ${card('explain-mindshare', 'hub', 'Narrative Galaxy & Mindshare', 'NLP-driven social cluster visualisation.')}
                ${card('explain-sentiment', 'psychology', 'Sentiment Synthesis', 'How we process social mindshare and news flow.')}
            `)}

            ${group('Advanced Charting', 'candlestick_chart', `
                ${card('explain-advanced-charting', 'candlestick_chart', 'Advanced Charting Suite', 'Depth, dynamic order flow overlays and 3D orderbook.')}
                ${card('explain-topologies', 'category', 'Funding Rate Heatmap', 'Reading cross-asset perpetual funding rate grids.')}
                ${card('explain-topologies', 'bar_chart', 'Tape Imbalance Histogram', 'Live 30-second buy/sell volume imbalance analysis.')}
                ${card('explain-topologies', 'stacked_line_chart', 'Volatility Surface (3D)', 'Implied volatility smile and term structure modelling.')}
            `)}

            ${group('Risk & Stress Hub', 'grid_on', `
                ${card('explain-risk', 'shield_with_heart', 'Risk Management', 'Using volatility and drawdowns for position sizing.')}
                ${card('explain-zscore', 'warning_amber', 'Stress Lab', 'Macro scenario stress-testing and tail risk modelling.')}
            `)}

            ${group('Order Flow & Liquidity', 'bar_chart', `
                ${card('explain-liquidity', 'bar_chart', 'Order Flow (GOMM)', 'Interpreting institutional liquidity walls and tape.')}
                ${card('explain-topologies', 'account_balance_wallet', 'Whale Wallet Flow Sankey', 'On-chain entity flow network and routing analytics.')}
                ${card('explain-topologies', 'show_chart', 'Yield Curve Spread Monitor', 'US Treasury 2Y/10Y/30Y spread and inversion signals.')}
                ${card('explain-topologies', 'donut_large', 'Capital Rotation Sunburst', 'Hierarchical capital allocation and 30D momentum view.')}
                ${card('explain-topologies', 'radar', 'Signal Confidence Radar', '6-axis ML signal decomposition per asset.')}
            `)}

            ${group('Reference & System', 'menu_book', `
                ${card('explain-api', 'terminal', 'Institutional API', 'Programmatic data access for quant desks.')}
                ${card('explain-glossary', 'menu_book', 'Terminal Glossary', 'Quick reference for all institutional metrics.')}
                ${card('explain-pwa', 'install_mobile', 'Mobile Terminal', 'PWA installation for iOS / Android.')}
            `)}
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
            { icon: 'bubble_chart', title: "Liquidation Pulse", desc: "High-fidelity canvas bubble map overlay visualizing highly-leveraged liquidation cascades and stop-loss clusters directly on the price action." },
            { icon: 'align_horizontal_left', title: "Volume Profile (VAP)", desc: "Left-anchored vertical histogram revealing the Volume-at-Price distribution to pinpoint institutional support and resistance zones." },
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
        "The AI Briefing module is a neural synthesis engine that consumes and correlates news flow, social mindshare, and macro catalyst data. Unlike generic news aggregators, our LLM framework is tuned specifically for institutional finance. It identifies 'hidden' connectionsâ€”such as how a specific regulatory shift in Asia might impact L2 liquidity in Europeâ€”and presents them in a concise, actionable format. It is designed to save analysts hours of manual research by highlighting the signal within the noise.",
        [
            { icon: 'memory', title: 'Neural Synthesis', desc: 'Millions of text nodes are processed daily to identify emerging narratives and shifts in institutional sentiment before they reach mainstream media.' },
            { icon: 'auto_graph', title: 'Sector Correlation', desc: 'The briefing automatically groups assets into thematic sectors (L1, DeFi, AI, Memes) to show where rotational capital is flowing in real-time.' },
            { icon: 'history_edu', title: 'Macro Translation', desc: 'Translating complex macro eventsâ€”like FOMC minutes or CPI printsâ€”into direct impact estimates for your tracked portfolio.' }
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
        "The Global Orderflow Magnitude Monitor (GOMM) provides a deep-dive into the exchange limit order books. By tracking the depth and density of bids and asks across the top 100 liquidity pairs, we can identify 'Liquidity Walls'â€”large clusters of orders that act as natural magnets or barriers for price action. Understanding where 'deep' liquidity sits allows professional traders to predict reversal points and identify where the most significant slippage is likely to occur.",
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
            { icon: 'analytics', title: 'Standard Deviation', desc: 'A Z-score of +3.0 indicates a move 3 standard deviations above the meanâ€”a statistical rarity that often precedes a price correction or "cooling off" period.' },
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
        "Alpha represents the 'excess return' of an asset relative to a benchmarkâ€”in our terminal, typically Bitcoin (BTC-USD). If Bitcoin moves up 5% and an asset moves up 8%, that asset has generated 3% Alpha. Our platform prioritizes assets with high positive Alpha because they represent true idiosyncratic strengthâ€”assets that are attracting capital even when the broader market is struggling. Trading Alpha-positive assets is one of the most effective ways to outperform the benchmark index.",
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
        "Correlation measures the degree to which two assets move in relation to each other. A correlation of +1.0 means they move in perfect lockstep. In crypto, most assets are highly correlated to Bitcoin. However, the most profitable opportunities often occur during 'Decoupling' eventsâ€”when an asset breaks its link with BTC and begins to move independently. The AlphaSignal terminal tracks these shifts to help you identify rotational capital moving into specific sectors or tokens.",
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
        "Sentiment Synthesis is the bridge between social noise and actionable momentum. Our proprietary NLP models don't just 'search' for keywords; they analyze the authority of the speaker, the velocity of the discourse, and the underlying emotional valence of the market. This creates a real-time 'heat' index that highlights assets which are currently experiencing a psychological shiftâ€”often a leading indicator for institutional capital flows.",
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
        "The true power of AlphaSignal lies in the 'Synthesis'â€”the ability to combine uncorrelated data points to confirm an institutional setup. This playbook outlines the standard operating procedures (SOPs) used by professional quant desks to identify, validate, and execute trades using our real-time intelligence feeds.",
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
        "The structural DNA of the marketâ€”identifying the macro environment.",
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
        "The terminal's ultimate composite signalâ€”collapsing complexity into actionable ranks.",
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
            { icon: 'database', title: 'Z-Score', desc: 'Statistical distance from the mean in standard deviations. Scores > Â±2.0 identify significant momentum or exhaustion outliers.' }
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
            desc: 'Monitoring unfilled price gaps in Chicago Mercantile Exchange Bitcoin Futuresâ€”key institutional pivot levels.'
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
            title: 'Documentation â€” Signal Archive',
            desc: 'Guide to interpreting the historical win-rate and probability engine records.'
        },
        'explain-topologies': {
            title: 'Documentation â€” Topologies & Geometries',
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
        'explain-signals': { title: 'Documentation â€” Signal Intelligence', desc: 'Learn how AlphaSignal utilizes Z-Score deviations and neural sentiment for alpha generation.' },
        'explain-briefing': { title: 'Documentation â€” AI Briefing', desc: 'Understand our dynamic neural synthesis and sector performance tracking.' },
        'explain-liquidity': { title: 'Documentation â€” Order Flow GOMM', desc: 'Documentation on interpreting liquidity walls and institutional tape.' },
        'explain-ml-engine': { title: 'Documentation â€” ML Alpha Engine', desc: 'Predictive modeling using Sentiment and Orderbook Imbalance.' },
        'explain-whales': { title: 'Documentation â€” Whale Pulse', desc: 'Learn how to detect and interpret massive on-chain transactions.' },
        'explain-mindshare': { title: 'Documentation â€” Narrative Galaxy', desc: 'Guide to using our NLP-driven social cluster visualization.' },
        'explain-benchmark': { title: 'Documentation â€” Portfolio Simulation', desc: 'How to model and backtest institutional crypto portfolios.' },
        'explain-alerts': { title: 'Documentation â€” Catalyst Monitor', desc: 'Tracking macro variables, token unlocks, and critical market events.' },
        'explain-zscore': { title: 'Documentation â€” Z-Score Interpretation', desc: 'Decoding statistical intensity and outlier detection for advanced volatility arbitrage.' },
        'explain-alpha': { title: 'Documentation â€” Alpha Strategy', desc: 'How to calculate and trade relative strength benchmarks vs Bitcoin to maximize institutional alpha.' },
        'explain-correlation': { title: 'Documentation â€” Market Correlation', desc: 'Understanding the mathematical relationship between assets and market-wide decoupling events.' },
        'explain-sentiment': { title: 'Documentation â€” Sentiment Synthesis', desc: 'How we process social mindshare and news flow using institutional-grade NLP.' },
        'explain-risk': { title: 'Documentation â€” Risk Management', desc: 'Institutional frameworks for protecting capital using volatility and drawdown modeling.' },
        'explain-playbook': { title: 'Documentation â€” Trading Playbook', desc: 'Advanced trading strategies and multi-signal institutional execution frameworks.' },
        'explain-regimes': { title: 'Documentation â€” Market Regimes', desc: 'Identifying market cycles through institutional flow, volatility, and sentiment analysis.' },
        'explain-advanced-charting': { title: 'Documentation â€” Advanced Charting', desc: 'Full institutional suite featuring orderbook liquidity and derivatives overlays.' },
        'explain-onchain': { title: 'Documentation â€” On-Chain Analytics', desc: 'Quantitative modeling of network MVRV, NVT, and internal blockchain metrics.' },
        'explain-api': { title: 'Documentation â€” Institutional API', desc: 'Programmatic access for real-time alpha signals, liquidity depth, and narrative intelligence.' },
        'explain-glossary': { title: 'Documentation â€” Terminal Glossary', desc: 'A quick-reference guide to all technical metrics used across the AlphaSignal platform.' },
        'explain-performance': { title: 'Documentation â€” Performance Analytics', desc: 'Track terminal win rates, return distributions, and institutional track records.' },
        'explain-alpha-score': { title: 'Documentation â€” Alpha Score Methodology', desc: 'Understanding composite rankings, Momentum Vectors, and the Neural ML Boost engine.' },
        'explain-telegram': { title: 'Documentation â€” Institutional Alert Hooks', desc: 'Setup guide for Telegram bot integration and the secure Safe Probe probe.' },
        'explain-pwa': { title: 'Documentation â€” Mobile PWA Terminal', desc: 'How to install AlphaSignal as a persistent terminal on your mobile device.' },
        'explain-portfolio-lab': { title: 'Documentation â€” Institutional Portfolio Lab', desc: 'Institutional methodology for ML rebalancing, VaR modeling, and correlation attribution.' },
        'explain-velocity': { title: 'Documentation â€” Chain Velocity', desc: 'Guide to volume acceleration and cross-chain capital rotation tracking.' },
    };

    const meta = viewMetadata[view] || {
        title: view.charAt(0).toUpperCase() + view.slice(1),
        desc: 'AlphaSignal Institutional Intelligence Terminal - Real-time signals and AI insights.'
    };

    const fullTitle = `${meta.title} | AlphaSignal â€” Institutional Crypto Intelligence`;
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
    const isFreeView = (
        view === 'signals' || view === 'help' || view === 'home' || 
        view?.startsWith('explain-') ||
        view === 'strategy-lab' || view === 'institutional-hub' ||
        view === 'alpha-hub' || view === 'global-hub' || view === 'macro-hub' ||
        view === 'analytics-hub' || view === 'risk-hub' || view === 'audit-hub' ||
        view === 'ask-terminal' || view === 'command-center'
    );
    
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
            const isSignup = toggleAuthLink.textContent.includes('REQUEST REGISTRATION');
            toggleAuthLink.textContent = isSignup ? 'ALREADY HAVE ACCESS? LOGIN' : 'NEED ACCESS? REQUEST REGISTRATION';
            document.getElementById('login-btn').textContent = isSignup ? 'REGISTER' : 'LOGIN';
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
    const text = `ðŸš¨ AlphaSignal Terminal Update: $${ticker}\n\n` +
                 `ðŸ“ˆ Relative Alpha: ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%\n` +
                 `ðŸ§  Sentiment Synthesis: ${sentimentLabel}\n` +
                 `âš¡ Z-Score Intensity: ${zScore.toFixed(2)}\n\n` +
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

function renderCorrelationHeatmap(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;
    
    // Normalize data structure (Handle both Portfolio and Macro formats)
    const labels = data.tickers || data.assets || [];
    if (!labels.length) return;
    
    const matrix = data.matrix || [];
    const n = labels.length;
    
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    
    container.innerHTML = matrix.map(cell => {
        // v = correlation value
        const v = cell.v !== undefined ? cell.v : cell.correlation;
        const xLabel = cell.x || cell.assetA;
        const yLabel = cell.y || cell.assetB;
        
        const opacity = Math.abs(v);
        const color = v > 0 ? `rgba(0, 242, 255, ${opacity})` : `rgba(255, 62, 62, ${opacity})`;
        return `<div style="aspect-ratio:1; background:${color}; display:flex; align-items:center; justify-content:center; font-size:0.4rem; font-weight:900; color:white; border:1px solid rgba(0,0,0,0.1)" title="${xLabel} vs ${yLabel}: ${v}">
            ${xLabel === yLabel ? xLabel : ''}
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
            { title: "System Conviction Dials (Analog Gauges)", icon: "speed", desc: "Positioned on the main dashboard. They utilize 180-degree Chart.js doughnuts overlayed with programmatic text to create analog speedometers representing overall market fear, network bloat, and retail FOMO parameters." },
            { title: "Asset Risk Profile (Scatter Plot)", icon: "scatter_plot", desc: "Located in the Correlation & Risk Matrix. Graphs 30D Volatility against Cumulative Return to instantly spot assets operating along the optimal risk-adjusted efficient frontier." },
            { title: "Cumulative Depth Profile (Stepped Area)", icon: "water_drop", desc: "Located in the Order Flow hub. Maps raw aggregate institutional bid and ask liquidity levels as a stepped histogram to expose structural market gravity." },
            { title: "Portfolio Web (Mathematical Radar)", icon: "account_tree", desc: "Located in the Portfolio Simulation Lab. Radially visualizes specific asset capital weightings dynamically optimized by the statistical ML backend." },
            { title: "Conviction Scatter Matrix (Bubble Chart)", icon: "bubble_chart", desc: "Located in the Whale Pulse dashboard. Multi-dimensional graph charting thousands of on-chain executions across Time Decay (X), Transaction Size (Y), and Volume Intensity (Radius)." }
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

function initLivePriceStream() {
    if (window.liveWS) return; // Prevent multiple connections
    let retryDelay = 2000;

    function connect() {
        try {
            ws = new WebSocket('ws://localhost:8007');

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    
                    if (msg.type === 'prices') {
                        const p = msg.data;
                        if (p.BTC) {
                            currentBTCPrice = p.BTC;
                            const btcText = `$${p.BTC.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                            
                            
                            const elLanding = document.getElementById('btc-price-landing');
                            if (elLanding) elLanding.textContent = `BTC: ${btcText}`;

                            const dot = document.getElementById('live-dot');
                            if (dot) { dot.style.opacity = '1'; setTimeout(() => { dot.style.opacity = '0.4'; }, 300); }
                        }
                        ['ETH', 'SOL'].forEach(sym => {
                            if (p[sym]) {
                                const els = document.querySelectorAll(`[data-live-price="${sym}"]`);
                                els.forEach(e => e.textContent = `$${p[sym].toLocaleString('en-US', {minimumFractionDigits: 2})}`);
                            }
                        });

                        // Feature 5: Live Signal Counter badge
                        if (msg.signal_count !== undefined) {
                            const badge = document.getElementById('signal-count-badge');
                            if (badge) {
                                badge.textContent = msg.signal_count;
                                badge.style.display = msg.signal_count > 0 ? 'inline-flex' : 'none';
                            }
                        }

                        // Feature 2: Bell badge removed per user feedback
                    } else if (msg.type === 'alert') {
                        showToast(`ðŸ“¡ ${msg.data.signal_type}`, msg.data.message, 'alert');
                    } else if (msg.type === 'regime_shift') {
                        showToast(`âš–ï¸ REGIME SHIFT`, `Market has shifted from ${msg.data.old} to ${msg.data.new}.`, 'regime');
                    }
                } catch(e) {}
            };

            ws.onclose = () => {
                retryDelay = Math.min(retryDelay * 1.5, 30000);
                setTimeout(connect, retryDelay);
            };

            ws.onerror = () => ws.close();

            window.liveWS = ws;
        } catch(e) {
            setTimeout(connect, retryDelay);
        }
    }

    connect();
}

function toggleOverlay(type) {
    window.activeOverlays[type] = !window.activeOverlays[type];
    const btn = event.target;
    btn.classList.toggle('active');
    renderChart(window.currentHistory);
}

// ============= Phase 15-B: AI Engine =============

function formatMemoMarkdown(text) {
    // Convert **bold** headers and newlines to HTML
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#bc13fe;letter-spacing:0.5px">$1</strong>')
        .replace(/\n\n/g, '</p><p style="margin-top:0.8rem">')
        .replace(/\n/g, '<br>');
}

async function loadAIMemo() {
    const body = document.getElementById('ai-memo-body');
    const meta = document.getElementById('ai-memo-meta');
    if (!body) return;
    try {
        const data = await fetchAPI('/ai-memo');
        if (data && data.memo) {
            const html = formatMemoMarkdown(data.memo);
            body.innerHTML = `<p>${html}</p>`;
            if (meta) meta.innerHTML = `Generated ${data.generated_at} &bull; <span style="color:${data.source === 'gpt-4o-mini' ? '#bc13fe' : '#888'}">${data.source === 'gpt-4o-mini' ? 'GPT-4o-mini' : 'Static Template'}</span>`;
        } else {
            body.innerHTML = '<p style="color:var(--text-dim)">Memo unavailable -- check API key configuration.</p>';
        }
    } catch(e) {
        body.innerHTML = '<p style="color:var(--text-dim)">Failed to load AI memo.</p>';
    }
}

async function refreshAIMemo() {
    const body = document.getElementById('ai-memo-body');
    if (!body) return;
    body.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:var(--text-dim)"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:18px">sync</span>Refreshing...</div>`;
    await loadAIMemo();
}

async function renderAskTerminal() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#bc13fe">smart_toy</span>Ask the Terminal <span class="premium-badge" style="background:#bc13fe;color:black">AI</span></h1>
                <p>Natural language queries answered with institutional terminal context. Powered by GPT-4o-mini.</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 8px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="switchView('explain-ai-engine')">
                <span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS
            </button>
        </div>

        <div style="max-width:780px;margin:0 auto">
            <!-- Suggested queries -->
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
                ${['What is the current Bitcoin regime?','Which strategy has the best Sharpe ratio?','Explain funding rate heatmap signals','What does a negative Z-Score mean?','Compare BTC vs ETH momentum'].map(q => `
                    <button onclick="submitAIQuery('${q}')" style="background:rgba(188,19,254,0.08);border:1px solid rgba(188,19,254,0.2);color:#bc13fe;padding:6px 14px;border-radius:20px;font-size:0.7rem;cursor:pointer;transition:all 0.2s ease" onmouseover="this.style.background='rgba(188,19,254,0.18)'" onmouseout="this.style.background='rgba(188,19,254,0.08)'">${q}</button>
                `).join('')}
            </div>

            <!-- Chat history -->
            <div id="ask-terminal-history" style="min-height:200px;max-height:60vh;overflow-y:auto;margin-bottom:1.5rem;display:flex;flex-direction:column;gap:1rem"></div>

            <!-- Input bar -->
            <div style="display:flex;gap:12px;align-items:flex-end;background:rgba(0,0,0,0.4);border:1px solid rgba(188,19,254,0.4);border-radius:12px;padding:12px;position:sticky;bottom:0">
                <span class="material-symbols-outlined" style="color:#bc13fe;font-size:22px;padding-top:2px">terminal</span>
                <textarea id="ask-terminal-input" placeholder="Ask anything about markets, strategies, signals, or on-chain data..." 
                    style="flex:1;min-height:44px;max-height:120px;background:none;border:none;color:white;font-family:'Outfit';font-size:0.9rem;resize:none;outline:none;line-height:1.5"
                    onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitAIQuery()}"></textarea>
                <button id="ask-terminal-send" onclick="submitAIQuery()" style="background:#bc13fe;border:none;color:white;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:0.75rem;font-weight:700;letter-spacing:1px;white-space:nowrap">
                    ASK →
                </button>
            </div>
            <div style="font-size:0.65rem;color:var(--text-dim);margin-top:8px;text-align:center">Press Enter to send &bull; Shift+Enter for new line &bull; Powered by GPT-4o-mini</div>
        </div>
    `;
}

async function submitAIQuery(prefill) {
    const input = document.getElementById('ask-terminal-input');
    const history = document.getElementById('ask-terminal-history');
    const btn = document.getElementById('ask-terminal-send');
    if (!input || !history) return;

    const query = prefill || input.value.trim();
    if (!query) return;

    // Add user message
    history.innerHTML += `
        <div style="display:flex;gap:12px;justify-content:flex-end">
            <div style="max-width:75%;background:rgba(188,19,254,0.15);border:1px solid rgba(188,19,254,0.2);border-radius:12px 12px 4px 12px;padding:12px 16px;font-size:0.85rem;line-height:1.6">${query}</div>
        </div>`;
    history.scrollTop = history.scrollHeight;
    input.value = '';
    if (btn) { btn.disabled = true; btn.textContent = '...'; }

    // Add loading AI response
    const respId = `ai-resp-${Date.now()}`;
    history.innerHTML += `
        <div style="display:flex;gap:12px" id="${respId}-wrap">
            <div style="width:32px;height:32px;border-radius:50%;background:rgba(188,19,254,0.2);border:1px solid rgba(188,19,254,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:16px;color:#bc13fe">smart_toy</span>
            </div>
            <div style="max-width:85%;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px 12px 12px 4px;padding:12px 16px;font-size:0.85rem;line-height:1.6" id="${respId}">
                <span style="animation:pulse 1s infinite;color:var(--text-dim)">Thinking...</span>
            </div>
        </div>`;
    history.scrollTop = history.scrollHeight;

    try {
        const resp = await fetch('/api/ask-terminal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const data = await resp.json();
        const el = document.getElementById(respId);
        if (el && data.answer) {
            el.innerHTML = formatMemoMarkdown(data.answer);
        } else if (el) {
            el.innerHTML = '<span style="color:#ef4444">No response</span>';
        }
    } catch(e) {
        const el = document.getElementById(respId);
        if (el) el.innerHTML = `<span style="color:#ef4444">Error: ${e.message}</span>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'ASK →'; }
        history.scrollTop = history.scrollHeight;
    }
}

async function openSignalThesisModal(ticker, signal, zscore) {
    // Create modal if not exists
    let modal = document.getElementById('thesis-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'thesis-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
        modal.innerHTML = `
            <div style="background:var(--bg-card);border:1px solid rgba(188,19,254,0.4);border-radius:16px;padding:2rem;max-width:520px;width:100%;position:relative">
                <button onclick="document.getElementById('thesis-modal').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1.2rem">&times;</button>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem">
                    <span class="material-symbols-outlined" style="color:#bc13fe">psychology</span>
                    <span style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:#bc13fe">AI TRADE THESIS</span>
                </div>
                <div style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem">${ticker} &bull; <span style="color:${signal === 'LONG' ? '#22c55e' : signal === 'SHORT' ? '#ef4444' : '#facc15'}">${signal}</span> &bull; Z-Score: ${zscore}σ</div>
                <div id="thesis-body" style="font-size:0.9rem;line-height:1.7;color:var(--text);min-height:80px;margin-top:1rem">
                    <div style="display:flex;align-items:center;gap:8px;color:var(--text-dim)">
                        <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:18px">sync</span>Generating thesis...
                    </div>
                </div>
                <div id="thesis-meta" style="font-size:0.6rem;color:var(--text-dim);margin-top:1rem;text-align:right"></div>
            </div>`;
        document.body.appendChild(modal);
    }

    try {
        const data = await fetchAPI(`/signal-thesis?ticker=${ticker}&signal=${signal}&zscore=${zscore}`);
        const el = document.getElementById('thesis-body');
        const meta = document.getElementById('thesis-meta');
        if (el && data.thesis) {
            el.innerHTML = `<p>${formatMemoMarkdown(data.thesis)}</p>`;
            if (meta) meta.textContent = `Source: ${data.source === 'gpt-4o-mini' ? 'GPT-4o-mini' : 'Template'}`;
        }
    } catch(e) {
        const el = document.getElementById('thesis-body');
        if (el) el.innerHTML = `<span style="color:#ef4444">Failed: ${e.message}</span>`;
    }
}

function renderDocsAIEngine() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#bc13fe">smart_toy</span>AI Narrative Engine</h1>
            <p>Phase 15-B documentation -- GPT-4o-mini powered institutional intelligence layer.</p>
        </div>
        <div style="max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:1rem">AI Daily Memo</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The AI Institutional Memo appears at the top of the Alpha Strategy Briefing. It is generated by GPT-4o-mini with live market context (BTC price, regime, fear/greed) and structured as three paragraphs: <strong>Macro Context</strong>, <strong>Key Opportunities</strong>, and <strong>Risk Warnings</strong>. Cached for 15 minutes to reduce API usage.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:1rem">Ask the Terminal</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Natural language query interface. Ask anything about markets, strategies, signals, or analytical concepts. The AI has context about AlphaSignal's capabilities and uses GPT-4o-mini for concise, actionable responses. Accessible via the <strong>Command Center</strong> sidebar item.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:1rem">Signal Thesis Generator</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Each signal card has a <strong>THESIS</strong> button that generates a 2-sentence GPT-powered trade rationale specific to that ticker, signal direction, and Z-Score deviation. Used to rapidly synthesise the technical and fundamental case for entering or avoiding a trade.</p>
            </div>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════
// Phase 15-C: Export / Sharing Engine
// ═══════════════════════════════════════════════════════════════

/**
 * Export any canvas element as a timestamped PNG download.
 * @param {HTMLCanvasElement|string} canvasOrId - Canvas element or its ID
 * @param {string} filename - Base filename (timestamp appended automatically)
 */
async function exportChartPNG(canvasOrId, filename = 'alphasignal-chart') {
    if (typeof html2canvas === 'undefined') {
        showToast('EXPORT', 'Export library loading, please try again in a moment.', 'info');
        return;
    }
    try {
        showToast('EXPORTING', 'Capturing chart…', 'info');
        const el = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
        if (!el) { showToast('ERROR', 'Chart element not found.', 'alert'); return; }
        const canvas = await html2canvas(el, {
            backgroundColor: '#05070a',
            scale: 2,
            logging: false,
            useCORS: true
        });
        const ts = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        link.download = `${filename}-${ts}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('EXPORTED', 'Chart saved as PNG (OK)', 'success');
    } catch (e) {
        console.error('[ExportPNG]', e);
        showToast('ERROR', 'PNG export failed: ' + e.message, 'alert');
    }
}

/**
 * Export the current view as an institutional PDF report.
 * @param {string} title - Report title shown in the header
 * @param {string} containerId - ID of the DOM element to capture (defaults to 'main-content')
 */
async function exportViewPDF(title = 'AlphaSignal Report', containerId = 'main-content') {
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        showToast('EXPORT', 'Export library loading, please try again in a moment.', 'info');
        return;
    }
    try {
        showToast('EXPORTING', 'Building PDF report…', 'info');
        const el = document.getElementById(containerId) || document.querySelector('.content');
        if (!el) { showToast('ERROR', 'Content element not found.', 'alert'); return; }

        const canvas = await html2canvas(el, {
            backgroundColor: '#05070a',
            scale: 1.5,
            logging: false,
            useCORS: true,
            windowWidth: el.scrollWidth,
            windowHeight: el.scrollHeight
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 10;

        // Header bar
        pdf.setFillColor(5, 7, 10);
        pdf.rect(0, 0, pageW, pageH, 'F');
        pdf.setFillColor(0, 212, 170);
        pdf.rect(0, 0, pageW, 12, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ALPHASIGNAL TERMINAL', margin, 8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date().toUTCString(), pageW - margin, 8, { align: 'right' });

        // Title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, 22);

        // Chart image
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgW = pageW - margin * 2;
        const imgH = (canvas.height / canvas.width) * imgW;
        let yPos = 28;
        let remainH = imgH;
        let srcY = 0;

        while (remainH > 0) {
            const sliceH = Math.min(remainH, pageH - yPos - margin);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = (sliceH / imgW) * canvas.width;
            const ctx = sliceCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, srcY * (canvas.height / imgH), canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
            pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, yPos, imgW, sliceH);
            remainH -= sliceH;
            srcY += sliceH;
            if (remainH > 0) { pdf.addPage(); yPos = margin; }
        }

        // Footer
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFillColor(0, 212, 170, 0.15);
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(7);
            pdf.text(`CONFIDENTIAL -- INSTITUTIONAL USE ONLY -- alphasignal.io -- Page ${i}/${pageCount}`, pageW / 2, pageH - 4, { align: 'center' });
        }

        const ts = new Date().toISOString().slice(0, 10);
        pdf.save(`alphasignal-${title.toLowerCase().replace(/\s+/g, '-')}-${ts}.pdf`);
        showToast('EXPORTED', 'PDF report saved (OK)', 'success');
    } catch (e) {
        console.error('[ExportPDF]', e);
        showToast('ERROR', 'PDF export failed: ' + e.message, 'alert');
    }
}

/**
 * Show a floating export action sheet anchored to a trigger element.
 * @param {Event} event - Click event from the export button
 * @param {string} chartId - ID of the canvas/chart to export as PNG
 * @param {string} viewTitle - Title for PDF export
 */
function showExportMenu(event, chartId, viewTitle) {
    event.stopPropagation();
    // Remove any existing menu
    const existing = document.getElementById('export-action-sheet');
    if (existing) { existing.remove(); return; }

    const btn = event.currentTarget || event.target;
    const rect = btn.getBoundingClientRect();

    const menu = document.createElement('div');
    menu.id = 'export-action-sheet';
    menu.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 8}px;
        left: ${rect.left}px;
        background: rgba(13,17,23,0.97);
        border: 1px solid rgba(0,212,170,0.25);
        border-radius: 12px;
        padding: 8px;
        z-index: 9998;
        min-width: 200px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        animation: fadeInDown 0.15s ease;
    `;
    menu.innerHTML = `
        <button onclick="exportChartPNG('${chartId}', '${viewTitle.toLowerCase().replace(/\s+/g,'-')}');document.getElementById('export-action-sheet')?.remove();"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:0.15s"
            onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='none'">
            <span class="material-symbols-outlined" style="font-size:18px;color:#00d4aa">image</span>
            Export Chart PNG
        </button>
        <button onclick="exportViewPDF('${viewTitle}');document.getElementById('export-action-sheet')?.remove();"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:0.15s"
            onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='none'">
            <span class="material-symbols-outlined" style="font-size:18px;color:#bc13fe">picture_as_pdf</span>
            Export View as PDF
        </button>
        <div style="height:1px;background:rgba(255,255,255,0.07);margin:4px 0"></div>
        <button onclick="if(typeof lastSignalsData!='undefined')exportCSV(lastSignalsData,'signals');document.getElementById('export-action-sheet')?.remove();"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:0.15s"
            onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='none'">
            <span class="material-symbols-outlined" style="font-size:18px;color:#ffd700">table_chart</span>
            Export Data CSV
        </button>
    `;

    document.body.appendChild(menu);

    // Reposition if off-screen right
    const mr = menu.getBoundingClientRect();
    if (mr.right > window.innerWidth - 16) {
        menu.style.left = `${window.innerWidth - mr.width - 16}px`;
    }

    // Auto-dismiss on outside click
    setTimeout(() => {
        document.addEventListener('click', () => document.getElementById('export-action-sheet')?.remove(), { once: true });
    }, 50);
}
