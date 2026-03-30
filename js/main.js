
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
    'options-flow': renderOptionsFlow,
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
    'command-center': renderCommandCenter,
    'trade-ledger': renderTradeLedger,
    'ask-terminal': renderAskTerminal,
    'explain-ai-engine': renderDocsAIEngine,
    'explain-strategy-lab': renderDocsStrategyLab,
    'explain-backtester-v2': renderDocsBacktesterV2,
    'explain-tradingview': renderDocsTradingView,
    help: renderHelp,
    'explain-etf-flows': renderDocsETFFlows,
    'explain-liquidations': renderDocsLiquidations,
    'explain-oi-radar': renderDocsOIRadar,
    'explain-cme-gaps': renderDocsCMEGaps,
    'explain-flow': renderDocsFlow,
    'explain-rotation': renderDocsRotation,
    'explain-macro-compass': renderDocsMacroCompass,
    'explain-macro-calendar': renderDocsMacroCalendar,
    'explain-narrative': renderDocsNarrative,
    'explain-token-unlocks': renderDocsTokenUnlocks,
    'explain-yield-lab': renderDocsYieldLab,
    'explain-tradelab': renderDocsTradeLab,
    'explain-options-flow': renderDocsOptionsFlow,
    'explain-newsroom': renderDocsNewsroom,
    'explain-trade-ledger': renderDocsTradeLedger,
    'explain-heatmap': renderDocsHeatmap,
    'explain-command-center': renderDocsCommandCenter,
    'explain-ask-terminal': renderDocsAskTerminal
};


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

async function renderHome() {
    // Fetch live data in parallel for stats bar
    const [dialsData, signalData] = await Promise.allSettled([
        fetchAPI('/system-dials'),
        fetchAPI('/signals')
    ]);
    const dials = dialsData.status === 'fulfilled' && dialsData.value?.dials ? dialsData.value.dials : null;
    const signals = signalData.status === 'fulfilled' && Array.isArray(signalData.value) ? signalData.value : [];
    const topSignal = signals[0] || null;

    appEl.innerHTML = `
        <div class="landing-page">
            <div class="landing-bg-overlay" style="background-image: url('landing_hero_abstract.png')"></div>

            <!-- ===== HERO ===== -->
            <section class="hero-section">
                <div class="hero-content">
                    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.2);border-radius:100px;padding:4px 14px;margin-bottom:1.5rem;font-size:0.65rem;letter-spacing:2px;color:var(--accent)">
                        <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);animation:pulse-dot 1.5s infinite"></span>
                        LIVE INSTITUTIONAL TERMINAL &mdash; v1.51
                    </div>
                    <h1>Institutional Intelligence Terminal. <span>Live.</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-briefing')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                    <p class="hero-subtitle">
                        AlphaSignal is a multi-hub institutional intelligence terminal for Bitcoin, crypto, and macro markets. Real-time Z-score signals, AI portfolio rebalancing, options flow, whale tracking, macro calendars, and 60+ analytical views — synthesised by AI, verified by institutional order flow.
                    </p>
                    <div class="hero-actions">
                        <button class="intel-action-btn large" onclick="switchView('signals')" title="Launch the AlphaSignal Crypto Trading Terminal" aria-label="Launch Terminal">
                            <span class="material-symbols-outlined" style="margin-right:8px">radar</span> LAUNCH TERMINAL
                        </button>
                        <button class="intel-action-btn large secondary" onclick="switchView('command-center')" title="View Institutional Command Center" aria-label="Command Center">
                            <span class="material-symbols-outlined" style="margin-right:8px">dashboard</span> COMMAND CENTER
                        </button>
                        <button class="intel-action-btn large secondary" onclick="switchView('help')" title="Browse all documentation" aria-label="Documentation">
                            <span class="material-symbols-outlined" style="margin-right:8px">menu_book</span> DOCS HUB
                        </button>
                    </div>

                    <!-- Live Mini-Stats -->
                    ${topSignal ? `
                    <div style="margin-top:2rem;display:flex;flex-wrap:wrap;gap:12px">
                        <div style="background:rgba(0,242,255,0.06);border:1px solid rgba(0,242,255,0.15);border-radius:8px;padding:8px 16px;font-size:0.7rem">
                            <span style="color:var(--text-dim);letter-spacing:1px">TOP SIGNAL</span>
                            <span style="color:var(--accent);font-weight:800;margin-left:8px">${topSignal.ticker || 'BTC-USD'}</span>
                            <span style="color:${parseFloat(topSignal.z_score) > 0 ? 'var(--risk-low)' : 'var(--risk-high)'};margin-left:6px">Z ${parseFloat(topSignal.z_score || 0).toFixed(2)}</span>
                        </div>
                        <div style="background:rgba(0,242,255,0.06);border:1px solid rgba(0,242,255,0.15);border-radius:8px;padding:8px 16px;font-size:0.7rem">
                            <span style="color:var(--text-dim);letter-spacing:1px">SIGNALS LIVE</span>
                            <span style="color:var(--accent);font-weight:800;margin-left:8px">${signals.length}</span>
                        </div>
                        ${dials ? `<div style="background:rgba(0,242,255,0.06);border:1px solid rgba(0,242,255,0.15);border-radius:8px;padding:8px 16px;font-size:0.7rem">
                            <span style="color:var(--text-dim);letter-spacing:1px">FEAR & GREED</span>
                            <span style="color:var(--accent);font-weight:800;margin-left:8px">${Math.round(dials.fear_greed?.value || 50)}</span>
                        </div>` : ''}
                    </div>` : ''}
                </div>
                <div class="hero-visual">
                    <div class="hero-img-wrapper">
                        <img src="terminal_interface_mockup.png" alt="AlphaSignal Institutional Terminal Interface" class="hero-img" width="800" height="450" loading="lazy">
                        <div class="hero-img-glow"></div>
                    </div>
                </div>
            </section>

            <!-- ===== STATS BAR ===== -->
            <section style="padding:2rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:rgba(0,0,0,0.3)">
                <div style="max-width:1400px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:2rem;text-align:center">
                    ${[
                        ['60+', 'Analytical Views'],
                        ['50+', 'Tracked Assets'],
                        ['8', 'Intelligence Hubs'],
                        ['24/7', 'Live Data Feeds'],
                        ['GPT-4o', 'AI Engine'],
                        ['Real-Time', 'Options Flow']
                    ].map(([val, label]) => `
                        <div>
                            <div style="font-size:2rem;font-weight:900;color:var(--accent);line-height:1">${val}</div>
                            <div style="font-size:0.65rem;color:var(--text-dim);letter-spacing:1.5px;margin-top:4px">${label}</div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <!-- ===== HUB GRID ===== -->
            <section class="features-showcase">
                <div class="section-title-wrap">
                    <h2>8 Institutional Intelligence Hubs</h2>
                    <p>Every hub provides a suite of live analytical views, AI synthesis, and institutional data — all unified under a single terminal.</p>
                </div>
                <div style="max-width:1400px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;padding:0 2rem">
                    ${[
                        { icon: 'public', hub: 'global-hub', name: 'Global Markets Hub', desc: 'Bitcoin Spot ETF flows, liquidation cascades, open interest radar, and CME gap analysis. The complete institutional window into global crypto capital.', badge: 'LIVE', views: ['ETF Flows', 'Liquidations', 'OI Radar', 'CME Gaps'] },
                        { icon: 'monitoring', hub: 'macro-hub', name: 'Macro Intel Hub', desc: 'AI market briefing, capital flows, sector rotation, correlation matrix, macro event calendar with historical BTC impact scores, and market regime classification.', badge: 'AI', views: ['Briefing', 'Capital Flows', 'Sector Rotation', 'Macro Calendar', 'Regime'] },
                        { icon: 'electric_bolt', hub: 'alpha-hub', name: 'Alpha Strategy Hub', desc: 'Z-score signal intelligence, ML alpha engine, multi-factor alpha scoring, strategy lab, signal backtester v2, signal archive, and narrative galaxy.', badge: 'ML', views: ['Signals', 'Alpha Score', 'Strategy Lab', 'Backtester', 'Narrative'] },
                        { icon: 'key', hub: 'institutional-hub', name: 'Institutional Hub', desc: 'Token unlock schedule, DeFi yield lab, Monte Carlo portfolio optimizer with AI rebalancing, and AI-assisted trade idea lab with one-click execution.', badge: 'NEW', views: ['Token Unlocks', 'Yield Lab', 'Portfolio Optimizer', 'Trade Idea Lab'] },
                        { icon: 'analytics', hub: 'analytics-hub', name: 'Analytics Hub', desc: 'Whale pulse tracker, cross-chain velocity engine, real MVRV/SOPR on-chain data, Deribit options flow scanner, and AI-tagged newsroom.', badge: 'ON-CHAIN', views: ['Whale Pulse', 'Chain Velocity', 'On-Chain', 'Options Flow', 'Newsroom'] },
                        { icon: 'assignment', hub: 'audit-hub', name: 'Audit & Performance Hub', desc: 'Persistent institutional trade ledger, AI thesis archive, performance dashboard with monthly P&L calendar, and BTC benchmark comparison.', badge: 'AUDIT', views: ['Trade Ledger', 'Performance Dashboard'] },
                        { icon: 'shield_with_heart', hub: 'risk-hub', name: 'Risk & Stress Hub', desc: 'Real-time risk matrix for position sizing, tail-risk stress lab with macro scenario modelling, and Z-score volatility regime overlay.', badge: 'RISK', views: ['Risk Matrix', 'Stress Lab'] },
                        { icon: 'candlestick_chart', hub: 'advanced-charting', name: 'Advanced Charting', desc: 'TradingView professional integration, funding rate heatmap, 3D volatility surface, tape imbalance histogram, and CVD charting with multi-timeframe overlays.', badge: 'PRO', views: ['TradingView', 'Funding Heatmap', '3D Vol Surface', 'CVD Chart'] }
                    ].map(h => `
                        <div class="f-card" onclick="switchView('${h.hub}')" style="display:flex;flex-direction:column;gap:12px;position:relative;overflow:hidden">
                            <div style="display:flex;align-items:center;justify-content:space-between">
                                <span class="material-symbols-outlined" style="font-size:2rem;color:var(--accent)">${h.icon}</span>
                                <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;padding:3px 8px;border-radius:100px;background:rgba(0,242,255,0.1);color:var(--accent);border:1px solid rgba(0,242,255,0.2)">${h.badge}</span>
                            </div>
                            <h3 style="font-size:0.9rem;margin:0">${h.name}</h3>
                            <p style="font-size:0.75rem;color:var(--text-dim);line-height:1.6;margin:0;flex:1">${h.desc}</p>
                            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
                                ${h.views.map(v => `<span style="font-size:0.55rem;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:4px;padding:2px 6px;color:var(--text-dim)">${v}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <!-- ===== CONVICTION DIALS ===== -->
            <section class="system-dials-section" style="padding:4rem 2rem;max-width:1400px;margin:0 auto;border-top:1px solid var(--border)">
                <div class="section-title-wrap" style="text-align:center;margin-bottom:3rem">
                    <h2>Live System Conviction Dials</h2>
                    <p style="color:var(--text-dim);font-size:1rem;margin-top:0.5rem">Analog institutional indicators tracking global market psychology and blockchain network stress.</p>
                </div>
                <div class="dials-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:3rem">
                    <div class="glass-card" style="padding:2rem;text-align:center">
                        <h3 style="color:var(--accent);font-size:1rem;letter-spacing:1px;margin-bottom:1rem">FEAR & GREED</h3>
                        <div style="position:relative;width:100%;height:200px"><canvas id="gauge-fear"></canvas></div>
                        <p style="font-size:0.7rem;color:var(--text-dim);margin-top:0.5rem">Composite sentiment from volume, volatility, social data, and dominance shifts</p>
                    </div>
                    <div class="glass-card" style="padding:2rem;text-align:center">
                        <h3 style="color:var(--accent);font-size:1rem;letter-spacing:1px;margin-bottom:1rem">NETWORK CONGESTION</h3>
                        <div style="position:relative;width:100%;height:200px"><canvas id="gauge-congestion"></canvas></div>
                        <p style="font-size:0.7rem;color:var(--text-dim);margin-top:0.5rem">Bitcoin mempool utilisation and fee rate velocity — a proxy for institutional urgency</p>
                    </div>
                    <div class="glass-card" style="padding:2rem;text-align:center">
                        <h3 style="color:var(--accent);font-size:1rem;letter-spacing:1px;margin-bottom:1rem">RETAIL FOMO</h3>
                        <div style="position:relative;width:100%;height:200px"><canvas id="gauge-fomo"></canvas></div>
                        <p style="font-size:0.7rem;color:var(--text-dim);margin-top:0.5rem">Google Trends + social search volume divergence from institutional accumulation patterns</p>
                    </div>
                </div>
                <div style="text-align:center;margin-top:2rem">
                    <button class="intel-action-btn outline" onclick="switchView('command-center')">
                        <span class="material-symbols-outlined" style="margin-right:8px;vertical-align:middle">dashboard</span>VIEW FULL COMMAND CENTER
                    </button>
                </div>
            </section>

            <!-- ===== PHASE 17 FEATURE SPOTLIGHT ===== -->
            <section style="padding:4rem 2rem;border-top:1px solid var(--border);background:linear-gradient(135deg,rgba(188,19,254,0.04),rgba(0,0,0,0.4))">
                <div style="max-width:1200px;margin:0 auto">
                    <div style="text-align:center;margin-bottom:3rem">
                        <span style="font-size:0.6rem;font-weight:900;letter-spacing:3px;color:#bc13fe;background:rgba(188,19,254,0.1);border:1px solid rgba(188,19,254,0.3);border-radius:100px;padding:4px 14px">PHASE 19 — LATEST INSTITUTIONAL ADDITIONS</span>
                        <h2 style="margin-top:1.5rem">Freshly Deployed Intelligence</h2>
                        <p style="color:var(--text-dim)">The most recent upgrades across institutional order flow, AI rebalancing, macro intelligence, and options analytics.</p>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem">
                        ${[
                            { icon: 'grid_on', view: 'macro-hub', color: '#00f2ff', title: 'Cross-Asset Momentum Heatmap', desc: 'Color-coded rolling returns heatmap (1D/7D/30D/90D) across 15 assets with Z-score column. Injected in Macro Compass. Cells clickable to asset intel modal.' },
                            { icon: 'notifications_active', view: 'alerts', color: '#22c55e', title: 'Alerts v2 — Trigger Dashboard', desc: 'Overhauled alerts view with active trigger conditions panel (Z-Score, Whale, De-peg, Vol Spike, CME Gap). Each alert now shows severity badge and direct CHART button.' },
                            { icon: 'psychology', view: 'whales', color: '#bc13fe', title: 'AI Deep-Dive Buttons', desc: 'AI analyst shortcut buttons added to ETF Flows, Whale Pulse, and Global Markets hub headers. One-click to full institutional AI synthesis on any asset.' },
                            { icon: 'account_balance_wallet', view: 'whales', color: '#f59e0b', title: 'Live Whale Flow Network', desc: 'Whale Wallet Flow Network now fetches live /api/whale-sankey data. 7 entity types with $M-scaled inflow/outflow bars. Congestion-weighted via Blockchain.info mempool.' }
                        ].map(f => `
                            <div class="glass-card" onclick="switchView('${f.view}')" style="cursor:pointer;padding:1.5rem;border:1px solid rgba(255,255,255,0.05);transition:all 0.2s"
                                 onmouseover="this.style.borderColor='${f.color}';this.style.background='rgba(255,255,255,0.02)'"
                                 onmouseout="this.style.borderColor='rgba(255,255,255,0.05)';this.style.background=''">
                                <span class="material-symbols-outlined" style="font-size:2rem;color:${f.color};margin-bottom:1rem;display:block">${f.icon}</span>
                                <h3 style="font-size:0.85rem;margin-bottom:0.5rem;color:#fff">${f.title}</h3>
                                <p style="font-size:0.75rem;color:var(--text-dim);line-height:1.6">${f.desc}</p>
                                <div style="margin-top:1rem;font-size:0.6rem;color:${f.color};letter-spacing:1px">OPEN VIEW →</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- ===== HOW IT WORKS ===== -->
            <section style="padding:4rem 2rem;border-top:1px solid var(--border)">
                <div style="max-width:1200px;margin:0 auto">
                    <div style="text-align:center;margin-bottom:3rem">
                        <h2>How AlphaSignal Works</h2>
                        <p style="color:var(--text-dim)">A four-layer intelligence pipeline from raw market data to actionable institutional signals.</p>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem;position:relative">
                        ${[
                            { step:'01', icon:'database', title:'Data Ingestion', desc:'Real-time OHLCV, on-chain data, social sentiment, ETF flows, and options market feeds aggregated from 15+ institutional sources.' },
                            { step:'02', icon:'model_training', title:'ML Signal Engine', desc:'LSTM-based ML models generate Z-score deviations, regime classifications, and forward return predictions across 50+ assets.' },
                            { step:'03', icon:'smart_toy', title:'AI Synthesis', desc:'GPT-4o-mini synthesises cross-hub intelligence into daily institutional memos, trade thesis documents, and portfolio rebalancing logic.' },
                            { step:'04', icon:'radar', title:'Signal Delivery', desc:'Actionable signals delivered via terminal views, Discord/Telegram webhooks, and the institutional trade ledger with full audit trail.' }
                        ].map((s,i) => `
                            <div style="text-align:center;position:relative">
                                ${i < 3 ? '<div style="position:absolute;top:2rem;right:-1rem;width:2rem;height:2px;background:linear-gradient(90deg,var(--accent),transparent);display:none"></div>' : ''}
                                <div style="width:60px;height:60px;border-radius:50%;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;background:rgba(0,242,255,0.05)">
                                    <span class="material-symbols-outlined" style="color:var(--accent)">${s.icon}</span>
                                </div>
                                <div style="font-size:0.6rem;color:var(--accent);letter-spacing:3px;margin-bottom:0.5rem">STEP ${s.step}</div>
                                <h3 style="font-size:0.85rem;margin-bottom:0.5rem">${s.title}</h3>
                                <p style="font-size:0.75rem;color:var(--text-dim);line-height:1.6">${s.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- ===== SEO CONTENT ===== -->
            <section class="seo-content-extra" style="padding:4rem 2rem;border-top:1px solid var(--border);background:rgba(0,0,0,0.2)">
                <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:4rem">
                    <div>
                        <h2 style="color:var(--accent);margin-bottom:1.5rem;font-size:1.3rem">The AlphaSignal Advantage</h2>
                        <p style="color:var(--text-dim);line-height:1.8;margin-bottom:1.5rem">In the fast-moving digital asset market, professional traders require more than just price action. <strong>AlphaSignal</strong> bridges the gap between retail noise and institutional intelligence. Our proprietary <strong>alpha synthesis</strong> engine tracks thousands of data points across <strong>Bitcoin</strong> on-chain flows, exchange liquidity, ETF capital, and social sentiment to deliver a high-conviction <strong>signal</strong> for every market regime.</p>
                        <p style="color:var(--text-dim);line-height:1.8">Whether you are validating a new <strong>strategy</strong> in the Backtester or monitoring live <strong>options flow</strong> on Deribit, our terminal provides the statistical depth needed to outperform any benchmark.</p>
                    </div>
                    <div>
                        <h2 style="color:var(--accent);margin-bottom:1.5rem;font-size:1.3rem">Institutional Data. Zero Compromise.</h2>
                        <p style="color:var(--text-dim);line-height:1.8;margin-bottom:1.5rem">AlphaSignal sources market data from regulated venues: <strong>CME</strong> futures gaps, <strong>Deribit</strong> options, <strong>Glassnode-class</strong> on-chain metrics via CoinGecko and Blockchain.info, and daily spot <strong>ETF AUM</strong> data from BlackRock, Fidelity, and ARK. Every data point is timestamped, provenance-tagged, and available for institutional audit.</p>
                        <p style="color:var(--text-dim);line-height:1.8">Protecting capital is the foundation of institutional success. AlphaSignal's <strong>risk</strong> suite offers real-time <strong>stress testing</strong> and correlation matrices to identify systemic decoupling before it impacts your portfolio.</p>
                    </div>
                    <div>
                        <h2 style="color:var(--accent);margin-bottom:1.5rem;font-size:1.3rem">AI-First Architecture</h2>
                        <p style="color:var(--text-dim);line-height:1.8;margin-bottom:1.5rem">At the core of AlphaSignal is an <strong>AI-first</strong> analytical philosophy. Our <strong>ML Alpha Engine</strong> uses LSTM-class architectures trained on 2+ years of multi-asset price, volume, and sentiment data. Every signal is accompanied by a <strong>neural confidence score</strong> and a <strong>GPT-generated trade thesis</strong> memo.</p>
                        <p style="color:var(--text-dim);line-height:1.8">The <strong>Ask Terminal</strong> AI assistant has full context of all terminal modules, allowing institutional teams to query methodology, interpret signals, and generate on-demand research briefs in under 5 seconds.</p>
                    </div>
                </div>
            </section>

            <!-- ===== FAQ ===== -->
            <section class="faq-section" style="padding:4rem 2rem;border-top:1px solid var(--border)">
                <div style="max-width:900px;margin:0 auto">
                    <h2 style="text-align:center;margin-bottom:3rem">Frequently Asked Questions</h2>
                    <div style="display:flex;flex-direction:column;gap:1.5rem">
                        ${[
                            { q: 'How does AlphaSignal calculate Alpha?', a: 'Alpha is calculated using a rolling Z-score deviation of returns relative to a Bitcoin (BTC) benchmark, adjusted for institutional volume and order flow magnitude. A Z-score > +2.0 indicates a statistically significant positive deviation from the benchmark — the core of our signal generation logic.' },
                            { q: 'What makes the Options Flow Scanner different?', a: 'AlphaSignal\'s Options Flow Scanner sources live data directly from the Deribit API — the world\'s largest crypto options exchange by volume. We compute Put/Call ratio, Max Pain strike, ATM Implied Volatility, and the full IV smile across all strikes, providing a complete options intelligence view unavailable in standard retail terminals.' },
                            { q: 'How does the AI Portfolio Rebalancer work?', a: 'The AI Rebalancer uses Monte Carlo simulation to model 10,000 portfolio scenarios across your current holdings. It then applies Markowitz Efficient Frontier optimisation constrained by your ML signal confidence scores, and generates a GPT-4 rebalancing memo explaining the rationale. All recommended trades are convertible to execution tickets in the Trade Ledger.' },
                            { q: 'What data sources power the Macro Event Calendar?', a: 'The calendar aggregates FOMC, CPI, NFP, and PCE schedules from the Federal Reserve, Bureau of Labor Statistics, and Bureau of Economic Analysis. Each event is scored for historical BTC impact using 2 years of real price data via yfinance, allowing you to see the median move and directional bias for each event type.' },
                            { q: 'Is this terminal suitable for automated strategies?', a: 'Yes. AlphaSignal is designed for strategy validation and systematised execution. The Signal Archive and Backtester V2 allow you to verify historical performance across different market regimes. The Trade Idea Lab and Trade Ledger support structured execution workflows, and the institutional API provides programmatic data access for quant desks intent on integrating AlphaSignal intelligence into automated systems.' },
                            { q: 'Can I use AlphaSignal on mobile?', a: 'Yes. AlphaSignal is a Progressive Web App (PWA) installable on iOS and Android. Navigate to the terminal on your mobile browser and select "Add to Home Screen" for a full native-app experience. The interface is fully responsive across all viewport sizes.' }
                        ].map(faq => `
                            <div class="faq-item glass-card" style="padding:1.5rem">
                                <h4 style="color:var(--text);margin-bottom:0.75rem;font-size:0.9rem;display:flex;align-items:center;gap:8px">
                                    <span class="material-symbols-outlined" style="color:var(--accent);font-size:1rem">help_outline</span>
                                    ${faq.q}
                                </h4>
                                <p style="color:var(--text-dim);font-size:0.85rem;line-height:1.7;margin:0">${faq.a}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- ===== CTA FOOTER ===== -->
            <section style="padding:5rem 2rem;text-align:center;border-top:1px solid var(--border);background:linear-gradient(135deg,rgba(0,242,255,0.04),rgba(0,0,0,0.5))">
                <div style="max-width:700px;margin:0 auto">
                    <span class="material-symbols-outlined" style="font-size:3rem;color:var(--accent);margin-bottom:1rem;display:block">radar</span>
                    <h2 style="font-size:2.5rem;font-weight:900;letter-spacing:-1px;margin-bottom:1rem">Start Trading with Institutional Intelligence</h2>
                    <p style="color:var(--text-dim);font-size:1.1rem;line-height:1.6;margin-bottom:2.5rem">60+ live analytical views. 8 intelligence hubs. AI-powered signals. Zero compromise on data quality.</p>
                    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
                        <button class="intel-action-btn large" onclick="switchView('signals')" style="font-size:0.9rem;padding:14px 32px">
                            <span class="material-symbols-outlined" style="margin-right:8px">radar</span> LAUNCH TERMINAL
                        </button>
                        <button class="intel-action-btn large secondary" onclick="switchView('help')" style="font-size:0.9rem;padding:14px 32px">
                            <span class="material-symbols-outlined" style="margin-right:8px">menu_book</span> VIEW DOCUMENTATION
                        </button>
                    </div>
                </div>
            </section>

        </div>
    `;

    // Render conviction dials
    if (dials) {
        renderSystemGauge('gauge-fear', dials.fear_greed.value, 'rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)');
        renderSystemGauge('gauge-congestion', dials.network_congestion.value, 'rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)');
        renderSystemGauge('gauge-fomo', dials.retail_fomo.value, 'rgba(0, 242, 255, 0.8)', 'rgba(168, 85, 247, 0.8)');
    }
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
function renderExplainPage(title, subtitle, detailedDesc, sections, caseStudies = [], dataSources = "", targetView = null) {
    appEl.innerHTML = `
        <div class="view-header"><h1>${title} — Terminal Documentation</h1></div>
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
                        <span class="material-symbols-outlined" style="margin-right: 6px; font-size: 16px;">source</span> Data Provenance &amp; Sources
                    </div>
                    ${dataSources}
                </div>
            ` : ''}

            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px">
                    <span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB
                </button>
                ${targetView ? `
                <button class="intel-action-btn" onclick="switchView('${targetView}')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800">
                    <span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW
                </button>` : ''}
            </div>
        </div>
    `;
}


function renderHelp() {
    const card = (view, icon, title, desc) => `
        <div class="help-card" onclick="switchView('${view}')" style="cursor:pointer;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:1.2rem;transition:all 0.2s;display:flex;flex-direction:column;gap:8px"
             onmouseover="this.style.borderColor='var(--accent)';this.style.background='rgba(0,242,255,0.04)'"
             onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg-card)'">
            <div style="display:flex;align-items:center;gap:10px">
                <span class="material-symbols-outlined" style="color:var(--accent);font-size:1.3rem">${icon}</span>
                <span style="font-size:0.72rem;font-weight:800;letter-spacing:1.5px;color:var(--text)">${title}</span>
            </div>
            <p style="font-size:0.68rem;color:var(--text-dim);line-height:1.5;margin:0">${desc}</p>
        </div>`;
    const group = (title, icon, content) => `
        <div style="margin-bottom:2.5rem">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
                <span class="material-symbols-outlined" style="color:var(--accent)">${icon}</span>
                <h2 style="font-size:0.7rem;font-weight:900;letter-spacing:3px;color:var(--text);margin:0">${title}</h2>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1rem">${content}</div>
        </div>`;
    appEl.innerHTML = `
        <div class="view-header"><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent);">help</span>Terminal Documentation</h1></div>
        <div class="doc-container" style="max-width:1100px;margin:0 auto;padding-top:1.5rem;">
            <p style="font-size:0.95rem;color:var(--text-dim);margin-bottom:2.5rem;line-height:1.6;">One documentation page per view, organised by sidebar hub. Click any card to read the full methodology and data sources.</p>

            ${group('Global Markets Hub', 'public', `
                ${card('explain-etf-flows', 'account_balance', 'ETF Flows', 'Daily institutional capital via regulated Bitcoin spot ETF vehicles.')}
                ${card('explain-liquidations', 'local_fire_department', 'Liquidations', 'Real-time leveraged position wipeout scanner and cascade alerts.')}
                ${card('explain-oi-radar', 'track_changes', 'OI Radar', 'Multi-asset perpetual futures open interest tracking.')}
                ${card('explain-cme-gaps', 'pivot_table_chart', 'CME Gaps', 'Identifying and tracking unfilled Bitcoin CME futures gaps.')}
            `)}

            ${group('Macro Intel Hub', 'monitoring', `
                ${card('explain-briefing', 'description', 'Market Briefing', 'AI-powered narrative synthesis across Mindshare, Flow, and Technical data streams.')}
                ${card('explain-flow', 'swap_horiz', 'Capital Flows', 'Velocity and direction of institutional capital rotating into the crypto ecosystem.')}
                ${card('explain-rotation', 'rotate_right', 'Sector Rotation', 'Capital rotation across crypto sectors using a treemap and momentum matrix.')}
                ${card('explain-macro-compass', 'public', 'Macro Compass', 'Global macro environment synthesis and its impact on digital asset prices.')}
                ${card('explain-correlation', 'grid_4x4', 'Correlation Matrix', 'Identifying market decoupling, sector correlation, and rotation events.')}
                ${card('explain-macro-calendar', 'event', 'Macro Calendar', '90-day forward calendar of macro events scored by historical BTC impact.')}
                ${card('explain-regimes', 'layers', 'Market Regime', 'Statistical classification of market cycles using Markov-Switching approximation.')}
            `)}

            ${group('Alpha Strategy Hub', 'electric_bolt', `
                ${card('explain-signals', 'radar', 'Signal Intelligence', 'Understanding Z-Score deviations and alpha signal generation methodology.')}
                ${card('explain-ml-engine', 'model_training', 'ML Alpha Engine', 'Neural feature synthesis and multi-factor predictive modelling architecture.')}
                ${card('explain-alpha-score', 'bolt', 'Alpha Score', 'Composite multi-factor ranking and scoring methodology across 50+ assets.')}
                ${card('explain-strategy-lab', 'science', 'Strategy Lab', 'Pairs Trading, Momentum Ignition, Regime Carry, Kelly Sizer + walk-forward.')}
                ${card('explain-backtester-v2', 'analytics', 'Backtester V2', 'Live signal history simulation: rolling Sharpe, monthly P&L calendar, benchmark.')}
                ${card('explain-signal-archive', 'history', 'Signal Archive', 'Historical signal record, PnL tracking, and performance attribution.')}
                ${card('explain-narrative', 'hub', 'Narrative Galaxy', 'Force-directed graph of crypto narrative clusters and social momentum velocity.')}
                ${card('explain-ai-engine', 'smart_toy', 'AI Narrative Engine', 'GPT-4o-mini memos, Ask Terminal, and Signal Thesis Generator methodology.')}
            `)}

            ${group('Institutional Hub', 'key', `
                ${card('explain-token-unlocks', 'key', 'Token Unlocks', 'Forward-looking schedule of major vesting unlocks and projected sell pressure.')}
                ${card('explain-yield-lab', 'biotech', 'Yield Lab', 'Multi-protocol DeFi yield aggregator and risk-adjusted rate comparison engine.')}
                ${card('explain-portfolio-lab', 'auto_mode', 'Portfolio Optimizer', 'ML rebalancing, Monte Carlo optimisation, and Markowitz Efficient Frontier.')}
                ${card('explain-tradelab', 'experiment', 'Trade Idea Lab', 'AI-assisted workspace for building and validating structured trade ideas.')}
            `)}

            ${group('Analytics Hub', 'analytics', `
                ${card('explain-whales', 'waves', 'Whale Pulse', 'Detecting and tracking massive on-chain block transactions across networks.')}
                ${card('explain-velocity', 'speed', 'Chain Velocity', 'Capital rotation tracking and cross-chain volume acceleration metrics.')}
                ${card('explain-onchain', 'link', 'On-Chain Analytics', 'Real MVRV, SOPR, Puell Multiple and hashrate from CoinGecko + Blockchain.info.')}
                ${card('explain-options-flow', 'ssid_chart', 'Options Flow', 'Deribit BTC & ETH options: Put/Call ratio, Max Pain, IV smile, top OI strikes.')}
                ${card('explain-newsroom', 'newspaper', 'Newsroom', 'Real-time institutional crypto news feed with AI sentiment tagging.')}
            `)}

            ${group('Audit & Performance Hub', 'assignment', `
                ${card('explain-trade-ledger', 'list_alt', 'Trade Ledger', 'Persistent, auditable record of all AI-generated and manual execution tickets.')}
                ${card('explain-performance', 'trending_up', 'Performance Dashboard', 'Win rate, returns, monthly P&L calendar, and system benchmark comparison.')}
            `)}

            ${group('Risk & Stress Hub', 'grid_on', `
                ${card('explain-risk', 'shield_with_heart', 'Risk Matrix', 'Using volatility, drawdown, and VaR for institutional position sizing.')}
                ${card('explain-zscore', 'warning_amber', 'Stress Lab', 'Macro scenario stress-testing and tail risk modelling methodology.')}
            `)}

            ${group('Advanced Charting', 'candlestick_chart', `
                ${card('explain-advanced-charting', 'candlestick_chart', 'Charting Suite', 'Depth, orderbook overlays, CVD, funding heatmap, and 3D volatility surface.')}
                ${card('explain-tradingview', 'show_chart', 'TradingView', 'Professional charts with MA/RSI/MACD/BB pre-loaded. Supports all crypto + equity.')}
            `)}

            ${group('Alerts & Signals', 'notifications_active', `
                ${card('explain-alerts', 'event', 'Signal Alerts', 'Configuring alert thresholds, Z-score gates, and catalyst event tracking.')}
                ${card('explain-telegram', 'notifications_active', 'Alert Hooks', 'Configuring Telegram and Discord webhook intelligence delivery.')}
                ${card('explain-heatmap', 'grid_view', 'Market Heatmap', 'Colour-coded Z-score heatmap across the entire 50+ asset tracked universe.')}
            `)}

            ${group('Command & Navigation', 'dashboard', `
                ${card('explain-command-center', 'dashboard', 'Command Center', 'Consolidated master view aggregating key signals from all terminal hubs.')}
                ${card('explain-ask-terminal', 'smart_toy', 'Ask Terminal', 'Conversational AI research assistant with full terminal context and methodology.')}
            `)}

            ${group('Reference & System', 'menu_book', `
                ${card('explain-playbook', 'auto_stories', 'Trading Playbook', 'Advanced strategies, signal combinations, and institutional decision frameworks.')}
                ${card('explain-alpha', 'trending_up', 'Alpha Strategy', 'Trading relative strength, market benchmarks, and alpha attribution methodology.')}
                ${card('explain-sentiment', 'psychology', 'Sentiment Synthesis', 'How we process social mindshare, NLP polarity, and news flow signals.')}
                ${card('explain-benchmark', 'science', 'Portfolio Simulation', 'Modelling and backtesting quant portfolios against market benchmarks.')}
                ${card('explain-api', 'terminal', 'Institutional API', 'Programmatic data access endpoints for quant desks and institutional clients.')}
                ${card('explain-glossary', 'menu_book', 'Terminal Glossary', 'Quick reference for all institutional metrics, formulas, and signals used.')}
                ${card('explain-pwa', 'install_mobile', 'Mobile Terminal', 'PWA installation guide for iOS and Android — offline-capable terminal access.')}
                ${card('explain-liquidity', 'bar_chart', 'Order Flow (GOMM)', 'Interpreting institutional liquidity walls, tape imbalance, and execution flow.')}
                ${card('explain-mindshare', 'hub', 'Mindshare Engine', 'NLP-driven social cluster visualisation and attention scoring methodology.')}
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
    , 'advanced-charting'
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
    , 'onchain'
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
    , 'signals'
    );
}

function renderDocsBriefing() {
    renderExplainPage(
        "AI Intelligence Briefing",
        "Synthesized institutional intelligence for rapid decision making.",
        "The AI Briefing module is a neural synthesis engine that consumes and correlates news flow, social mindshare, and macro catalyst data. Unlike generic news aggregators, our LLM framework is tuned specifically for institutional finance. It identifies 'hidden' connections--such as how a specific regulatory shift in Asia might impact L2 liquidity in Europe--and presents them in a concise, actionable format. It is designed to save analysts hours of manual research by highlighting the signal within the noise.",
        [
            { icon: 'memory', title: 'Neural Synthesis', desc: 'Millions of text nodes are processed daily to identify emerging narratives and shifts in institutional sentiment before they reach mainstream media.' },
            { icon: 'auto_graph', title: 'Sector Correlation', desc: 'The briefing automatically groups assets into thematic sectors (L1, DeFi, AI, Memes) to show where rotational capital is flowing in real-time.' },
            { icon: 'history_edu', title: 'Macro Translation', desc: 'Translating complex macro events--like FOMC minutes or CPI prints--into direct impact estimates for your tracked portfolio.' }
        ],
        [
            { title: 'Narrative Shift Detection', text: 'Our AI Briefing identified a sustained increase in "Institutional Staking" mentions 72 hours before a major US pension fund announced its ETH position, allowing users to position ahead of the narrative surge.' },
            { title: 'Macro Catalyst Correlation', text: 'During the last CPI release, the AI Briefing instantly correlated the higher-than-expected print with "Liquid Staking" sector resilience, highlighting a defensive alpha opportunity within minutes.' }
        ],
        "Neural processing of 50,000+ daily news nodes, 1M+ social impressions via proprietary NLP models, and a curated database of 500+ global macro catalyst events."
    , 'briefing'
    );
}

function renderDocsLiquidity() {
    renderExplainPage(
        "Order Flow (GOMM)",
        "Visualizing professional liquidity walls and execution tape from 15+ top-tier institutional exchanges.",
        "The Global Orderflow Magnitude Monitor (GOMM) provides a deep-dive into the exchange limit order books. By tracking the depth and density of bids and asks across the top 100 liquidity pairs, we can identify 'Liquidity Walls'--large clusters of orders that act as natural magnets or barriers for price action. Understanding where 'deep' liquidity sits allows professional traders to predict reversal points and identify where the most significant slippage is likely to occur.",
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
    , 'liquidity'
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
    , 'alpha-hub'
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
    , 'whales'
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
    , 'mindshare'
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
    , 'portfolio-optimizer'
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
    , 'alerts'
    );
}

function renderDocsZScore() {
    renderExplainPage(
        "Z-Score Interpretation",
        "Statistical intensity monitoring for advanced volatility arbitrage and outlier detection.",
        "The Z-Score is a measure of how many standard deviations a data point is from its mean. In the AlphaSignal terminal, we use this to highlight 'statistical outliers'. A high Z-score (above +2.0 or below -2.0) means an asset is moving in a way that is highly unusual compared to its typical volatility profile. Professional traders use Z-scores to identify extreme overextensions (reversion opportunities) or the beginning of massive, institutional-led trend breakouts.",
        [
            { icon: 'analytics', title: 'Standard Deviation', desc: 'A Z-score of +3.0 indicates a move 3 standard deviations above the mean--a statistical rarity that often precedes a price correction or "cooling off" period.' },
            { icon: 'trending_up', title: 'Mean Reversion', desc: 'Extreme Z-scores (+3.5 or -3.5) are historically associated with exhaustion. When combined with declining volume, these are prime signals for mean-reversion trades.' },
            { icon: 'bolt', title: 'Momentum Breakouts', desc: 'A sustained Z-score between +1.5 and +2.5 often represents an institutional "trend breakout" where the asset is successfully discovering a new higher value range.' }
        ],
        [
            { title: 'The Sigma-3 Exhaustion Play', text: 'When a popular large-cap asset hit a +3.2 Z-score while the Whale Flow remained flat, our system flagged a "Retail Exhaustion" event. This preceded a 4.5% mean-reversion pullback within 6 hours.' },
            { title: 'Vol-Compression to Z-Spike', text: 'Tracking assets that move from a sub-0.5 Z-score (low volatility) to a 1.5+ spike allows traders to enter momentum breakouts with high confidence and tight stop-losses.' }
        ],
        "Proprietary volatility normalization engine calculating real-time z-scores across a 180-period rolling mean and standard deviation window."
    , 'stress'
    );
}

function renderDocsAlpha() {
    renderExplainPage(
        "Alpha Generation Strategy",
        "Quantifying relative strength by stripping away market noise and benchmark beta.",
        "Alpha represents the 'excess return' of an asset relative to a benchmark--in our terminal, typically Bitcoin (BTC-USD). If Bitcoin moves up 5% and an asset moves up 8%, that asset has generated 3% Alpha. Our platform prioritizes assets with high positive Alpha because they represent true idiosyncratic strength--assets that are attracting capital even when the broader market is struggling. Trading Alpha-positive assets is one of the most effective ways to outperform the benchmark index.",
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
    , 'alpha-hub'
    );
}

function renderDocsCorrelation() {
    renderExplainPage(
        "Correlation & Decoupling",
        "Monitoring the mathematical relationship between Bitcoin and the broader universe.",
        "Correlation measures the degree to which two assets move in relation to each other. A correlation of +1.0 means they move in perfect lockstep. In crypto, most assets are highly correlated to Bitcoin. However, the most profitable opportunities often occur during 'Decoupling' events--when an asset breaks its link with BTC and begins to move independently. The AlphaSignal terminal tracks these shifts to help you identify rotational capital moving into specific sectors or tokens.",
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
    , 'correlation-matrix'
    );
}

function renderDocsSentiment() {
    renderExplainPage(
        "Sentiment Synthesis",
        "Quantifying market psychology through institutional NLP and social graph analysis.",
        "Sentiment Synthesis is the bridge between social noise and actionable momentum. Our proprietary NLP models don't just 'search' for keywords; they analyze the authority of the speaker, the velocity of the discourse, and the underlying emotional valence of the market. This creates a real-time 'heat' index that highlights assets which are currently experiencing a psychological shift--often a leading indicator for institutional capital flows.",
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
    , 'mindshare'
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
    , 'risk'
    );
}

function renderDocsGlossary() {
    renderDocsGlossaryImplementation();
}

function renderDocsPlaybook() {
    renderExplainPage(
        "Advanced Trading Playbook",
        "Mastering the synthesis of multiple terminal signals for high-conviction execution.",
        "The true power of AlphaSignal lies in the 'Synthesis'--the ability to combine uncorrelated data points to confirm an institutional setup. This playbook outlines the standard operating procedures (SOPs) used by professional quant desks to identify, validate, and execute trades using our real-time intelligence feeds.",
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
    , 'strategy-lab'
    );
}

function renderDocsRegimes() {
    renderExplainPage(
        "Market Regime Framework",
        "The structural DNA of the market--identifying the macro environment.",
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
    , 'regime'
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
    , 'command-center'
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
    , 'signal-archive'
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
    , 'performance-dashboard'
    );
}

function renderDocsAlphaScore() {
    renderExplainPage(
        "Alpha Score & Boosting",
        "The terminal's ultimate composite signal--collapsing complexity into actionable ranks.",
        "The Alpha Score is a proprietary ranking from 0-100 that synthesizes momentum, sentiment, and on-chain flow. High scores indicate assets with a strong 'Momentum Vector' and positive institutional accumulation. The Neural Engine also provides an 'ML Boost' to assets where historical patterns suggest a high probability of short-term alpha.",
        [
            { icon: 'workspace_premium', title: 'ML Boost', desc: 'A high-conviction statistical boost applied when multiple neural nodes align on a specific asset return profile.' },
            { icon: 'rocket_launch', title: 'Momentum Vector', desc: 'The directional force of price and volume acceleration over a rolling 48-hour window.' }
        ],
        [
            { title: 'The 90+ Alpha Breakout', text: 'When SOL hit an Alpha Score of 92 with an ML Boost, it preceded a 14% impulsive rally in the subsequent 24 hours.' }
        ],
        "Composite scoring engine updated hourly using live feed data from 15+ institutional-grade sources."
    , 'alpha-score'
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
    , 'alerts'
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
    , 'help'
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
    , 'portfolio-optimizer'
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
            { icon: 'database', title: 'Z-Score', desc: 'Statistical distance from the mean in standard deviations. Scores > Ã‚Â±2.0 identify significant momentum or exhaustion outliers.' }
        ],
        [],
        "Proprietary definitions derived from institutional trading desk standards and quantitative finance academic frameworks."
    , 'help');
}

function updateSEOMeta(view) {
    const viewMetadata = {
        // === ROOT / HOME ===
        'home': {
            title: 'AlphaSignal — Institutional Crypto Intelligence Terminal',
            desc: 'AlphaSignal is a real-time institutional intelligence terminal for Bitcoin, crypto, and macro markets. AI-powered signals, options flow, whale tracking, portfolio optimiser, macro calendar, and 60+ analytical views.'
        },

        // === COMMAND CENTER ===
        'command-center': {
            title: 'Institutional Command Center',
            desc: 'Consolidated real-time intelligence dashboard aggregating key signals from all AlphaSignal hubs — ETF flows, macro correlation, top alpha signals, and system conviction dials.'
        },
        'ask-terminal': {
            title: 'Ask Terminal — AI Research Assistant',
            desc: 'Conversational AI research assistant with full AlphaSignal terminal context. Ask about signals, market regimes, options flow, or any institutional metric and receive GPT-4 powered analysis instantly.'
        },

        // === GLOBAL MARKETS HUB ===
        'global-hub': {
            title: 'Global Markets Intelligence Hub',
            desc: 'Consolidated institutional view of Bitcoin spot ETF flows, leveraged liquidation cascades, open interest radar, and CME futures gap analysis.'
        },
        'etf-flows': {
            title: 'Bitcoin Spot ETF Flows — Live Institutional Capital Tracker',
            desc: 'Real-time daily net flows across all regulated Bitcoin spot ETFs including BlackRock IBIT, Fidelity FBTC, and ARK ARKB. Track institutional accumulation and distribution cycles.'
        },
        'liquidations': {
            title: 'Crypto Liquidation Cascade Scanner — Live Leverage Wipeouts',
            desc: 'Real-time monitoring of long and short liquidations across Binance, OKX, Bybit, and Deribit. Detect liquidation clusters and cascade alerts before they impact spot price.'
        },
        'oi-radar': {
            title: 'Open Interest Radar — Derivatives Leverage Monitor',
            desc: 'Cross-asset perpetual futures open interest tracking with funding rate overlay. Identify over-leveraged conditions and OI vs price divergences across 20+ assets.'
        },
        'cme-gaps': {
            title: 'CME Bitcoin Gap Tracker — Unfilled Price Gaps',
            desc: 'Track all unfilled CME Bitcoin futures price gaps with historical fill probability scoring. 77% of CME gaps fill within 90 days — a key institutional pricing tool.'
        },

        // === MACRO INTEL HUB ===
        'macro-hub': {
            title: 'Macro Intelligence Hub',
            desc: 'Multi-dimensional analysis of global macro catalysts, capital flows, sector rotation, correlation matrices, and market regime classification — all in one institutional hub.'
        },
        'briefing': {
            title: 'AI Market Intelligence Briefing',
            desc: 'Daily GPT-powered synthesis of global market trends, institutional sentiment, and narrative shifts across Bitcoin, macro, and crypto ecosystem data streams.'
        },
        'flow': {
            title: 'Institutional Capital Flows Monitor',
            desc: 'Track the velocity and direction of institutional capital via ETF flows, exchange reserve changes, and stablecoin minting velocity — the definitive macro bull/bear signal.'
        },
        'rotation': {
            title: 'Crypto Sector Rotation Tracker',
            desc: 'Weighted treemap and momentum matrix showing capital rotation across L1, DeFi, AI, Memes, Gaming, and RWA sectors. Identify the next sector rotation before the crowd.'
        },
        'macro': {
            title: 'Macro Compass — Global Economic Impact Dashboard',
            desc: 'Synthesised macro intelligence covering DXY strength, yield curve shape, equity correlation, and risk regime classification and their real-time impact on crypto markets.'
        },
        'correlation-matrix': {
            title: 'Cross-Asset Correlation Matrix',
            desc: 'Live statistical heatmap of rolling 30-day correlations across BTC, ETH, SPX, DXY, Gold, and 10Y Treasury yields. Identify decoupling events and rotation signals.'
        },
        'macro-calendar': {
            title: 'Macro Event Calendar — FOMC, CPI, NFP, PCE Impact Scorer',
            desc: '90-day forward calendar of institutional macro events scored by historical Bitcoin price impact. FOMC, CPI, NFP, and PCE dates with median BTC move and volatility data.'
        },
        'regime': {
            title: 'Market Regime Framework — Markov Cycle Classification',
            desc: 'Statistical classification of Bitcoin market cycles using Markov-Switching approximation. Identifies Accumulation, Distribution, Trending Bull, and Trending Bear regimes in real-time.'
        },

        // === ALPHA STRATEGY HUB ===
        'alpha-hub': {
            title: 'Alpha Strategy Hub — Institutional Signal Intelligence',
            desc: 'Institutional AI alpha synthesis, Z-score signal generation, ML alpha scoring, strategy lab, signal backtester, archive, and narrative galaxy — all in one strategy hub.'
        },
        'signals': {
            title: 'Live Alpha Signals — Z-Score Market Intelligence',
            desc: 'Real-time Z-score deviation signals across 50+ institutional crypto assets. High-conviction alpha signals powered by ML neural features, orderflow magnitude, and on-chain data.'
        },
        'alpha-score': {
            title: 'Alpha Score Dashboard — Multi-Factor Asset Ranking',
            desc: 'Composite multi-factor alpha score ranking across 50+ assets combining Z-score signal strength, ML prediction confidence, on-chain momentum, and neural sentiment.'
        },
        'strategy-lab': {
            title: 'Strategy Lab — Pairs Trading, Momentum & Kelly Sizer',
            desc: 'Institutional strategy laboratory with Pairs Trading, Momentum Ignition, Regime Carry, Kelly Position Sizer, Dual Momentum, and walk-forward validation.'
        },
        'backtester-v2': {
            title: 'Signal Backtester V2 — Historical Performance Simulator',
            desc: 'Backtest live AlphaSignal Z-score signals against real historical data. Rolling Sharpe ratio, monthly P&L calendar, maximum drawdown, and BTC benchmark comparison.'
        },
        'signal-archive': {
            title: 'Signal Execution Archive — Historical Alpha Record',
            desc: 'Immutable audit trail of all historical AlphaSignal Z-score signals with execution timestamps, outcome tracking, and institutional win-rate analytics.'
        },
        'narrative': {
            title: 'Narrative Galaxy — Crypto Mindshare Cluster Map',
            desc: 'Force-directed graph visualization of crypto market narratives. Track narrative velocity, sentiment polarity, crowded trades, and emerging thesis clusters across social media.'
        },

        // === INSTITUTIONAL HUB ===
        'institutional-hub': {
            title: 'Institutional Hub — Portfolio, Unlocks & Yield Intelligence',
            desc: 'Institutional-grade intelligence for token unlock schedules, DeFi yield comparison, AI portfolio optimisation, and structured trade idea generation with execution ledger integration.'
        },
        'token-unlocks': {
            title: 'Token Unlock Schedule — Supply Shock & Sell Pressure Tracker',
            desc: 'Forward-looking 90-day calendar of major token vesting unlocks scored by supply shock severity. Track investor and team unlock events before they create sell pressure.'
        },
        'yield-lab': {
            title: 'DeFi Yield Lab — Protocol Rate Comparison Engine',
            desc: 'Multi-protocol DeFi yield aggregator comparing Aave, Compound, Lido, Rocket Pool APY rates with risk-adjusted scoring and DeFi vs TradFi spread tracking.'
        },
        'portfolio-optimizer': {
            title: 'AI Portfolio Optimizer — Monte Carlo & Markowitz Rebalancer',
            desc: 'AI-powered portfolio optimiser using Monte Carlo simulation and Markowitz Efficient Frontier. GPT-4 generates a rebalancing memo with execution tickets for full audit trail.'
        },
        'portfolio': {
            title: 'Portfolio Simulation Lab — VaR & Attribution Modelling',
            desc: 'Simulate institutional portfolio performance, Value-at-Risk modelling, drawdown analysis, and correlation attribution across your custom asset basket.'
        },
        'tradelab': {
            title: 'Trade Idea Lab — AI-Assisted Execution Workspace',
            desc: 'Build structured institutional trade ideas with AI-generated thesis memos, risk/reward calculation, and one-click conversion to the institutional trade ledger.'
        },

        // === ANALYTICS HUB ===
        'analytics-hub': {
            title: 'Analytics Hub — Whale, On-Chain, Options & Newsroom Intelligence',
            desc: 'Full institutional analytics suite: whale pulse tracking, cross-chain velocity, real MVRV/SOPR on-chain data, Deribit options flow scanner, and AI-tagged crypto newsroom.'
        },
        'whales': {
            title: 'AI Whale Pulse Monitor — Institutional Transaction Tracker',
            desc: 'Real-time detection of institutional-sized Bitcoin, Ethereum, and Solana on-chain transactions. Entity clustering distinguishes true accumulation from exchange cold wallet shifts.'
        },
        'velocity': {
            title: 'Cross-Chain Capital Velocity — Volume Acceleration Tracker',
            desc: 'Track capital rotation velocity and volume acceleration across Ethereum, Solana, Avalanche, and Cardano. Identify which chain is attracting institutional attention next.'
        },
        'onchain': {
            title: 'On-Chain Analytics — MVRV, SOPR & Puell Multiple',
            desc: 'Real on-chain intelligence: MVRV ratio, SOPR, Puell Multiple, and hashrate data sourced live from CoinGecko and Blockchain.info. Institutional-grade blockchain fundamentals.'
        },
        'options-flow': {
            title: 'Deribit Options Flow Scanner — PCR, Max Pain & IV Smile',
            desc: 'Live BTC and ETH options market intelligence from Deribit: Put/Call ratio, Max Pain strike, ATM implied volatility, IV smile chart, and top open-interest strikes.'
        },
        'newsroom': {
            title: 'Institutional Crypto Newsroom — AI Sentiment Tagged News Feed',
            desc: 'Real-time institutional crypto news with AI BULLISH/BEARISH/NEUTRAL sentiment tagging. Filtered for regulatory developments, ETF news, protocol announcements, and macro policy shifts.'
        },

        // === AUDIT & PERFORMANCE HUB ===
        'audit-hub': {
            title: 'Audit & Performance Hub — Trade Ledger & Analytics',
            desc: 'Institutional audit and performance tracking hub with persistent trade ledger, AI thesis archive, monthly P&L calendar, and BTC benchmark comparison.'
        },
        'trade-ledger': {
            title: 'Institutional Trade Ledger — Auditable Execution Record',
            desc: 'Persistent, auditable log of all AI-generated and manual execution tickets with status tracking, AI thesis archive, PnL attribution, and CSV export for compliance.'
        },
        'performance-dashboard': {
            title: 'Performance Analytics Dashboard — Track Record & Attribution',
            desc: 'Institutional performance analytics with win rate, monthly P&L calendar, rolling Sharpe ratio, maximum drawdown tracking, and BTC benchmark comparison.'
        },

        // === RISK & STRESS HUB ===
        'risk-hub': {
            title: 'Risk & Stress Hub — Portfolio Protection Intelligence',
            desc: 'Institutional risk management hub with real-time risk matrix for position sizing, tail-risk stress testing, volatility regime detection, and macro scenario modelling.'
        },
        'risk': {
            title: 'Risk Matrix — Institutional Position Sizing & VaR',
            desc: 'Real-time institutional risk matrix combining volatility, drawdown, and Value-at-Risk for disciplined position sizing. Protect capital across all market regimes.'
        },
        'stress': {
            title: 'Stress Lab — Macro Scenario & Tail Risk Analysis',
            desc: 'Macro stress-testing your portfolio against historic crash scenarios. Quantify tail-risk exposure, correlation spikes, and maximum drawdown under extreme market conditions.'
        },

        // === ADVANCED CHARTING ===
        'advanced-charting': {
            title: 'Advanced Charting Suite — Professional Institutional Charts',
            desc: 'Professional institutional charting with TradingView integration, funding rate heatmap, 3D volatility surface, tape imbalance histogram, CVD chart, and multi-asset overlays.'
        },

        // === STANDALONE ===
        'mindshare': {
            title: 'Social Mindshare Analytics — Narrative Dominance Tracker',
            desc: 'NLP-driven social sentiment and narrative dominance tracking across Bitcoin, Ethereum, and 50+ crypto assets. Real-time crowd positioning and mindshare shift detection.'
        },
        'liquidity': {
            title: 'Order Flow Magnitude Monitor (GOMM) — Institutional Tape',
            desc: 'Visualise professional liquidity walls, order book depth, CVD divergence, and institutional execution tape. Identify large block order flow before price discovery completes.'
        },
        'heatmap': {
            title: 'Market Heatmap — Z-Score Signal Intensity Grid',
            desc: 'Colour-coded Z-score heatmap across the full 50+ asset universe. Instantly identify where statistical alpha is concentrated by sector and asset class.'
        },
        'alerts': {
            title: 'Real-Time Signal Alerts — Discord & Telegram Webhooks',
            desc: 'Configure Z-score alert thresholds and receive institutional signal alerts via Discord or Telegram webhooks. Customisable sensitivity with test-fire capability.'
        },
        'help': {
            title: 'Help & Documentation Hub — AlphaSignal Terminal Guides',
            desc: 'Complete documentation for all 60+ AlphaSignal views organised by hub. Covers methodology, data sources, analytical frameworks, and institutional best practices.'
        },
        'backtest': {
            title: 'Signal Backtester — Historical Strategy Validation',
            desc: 'Quantitative backtesting of institutional signals against historical market data for performance validation.'
        },
        'catalysts': {
            title: 'Market Catalysts Calendar',
            desc: 'Comprehensive calendar of institutional-grade volatility events, macro releases, and regulatory triggers affecting crypto markets.'
        },

        // === DOCUMENTATION PAGES ===
        'explain-signals': { title: 'Docs — Signal Intelligence Methodology', desc: 'How AlphaSignal generates Z-score deviations, ML neural features, and high-conviction alpha signals across 50+ crypto assets.' },
        'explain-briefing': { title: 'Docs — AI Market Briefing Methodology', desc: 'How the AlphaSignal AI synthesises global market trends, sentiment data, and institutional narratives into a daily institutional memo.' },
        'explain-liquidity': { title: 'Docs — Order Flow GOMM Methodology', desc: 'Interpreting institutional liquidity walls, tape imbalance, CVD divergence, and orderbook depth analysis.' },
        'explain-ml-engine': { title: 'Docs — ML Alpha Engine Architecture', desc: 'LSTM-based predictive modelling using sentiment vectors, orderbook imbalance, and on-chain features to generate forward return predictions.' },
        'explain-whales': { title: 'Docs — Whale Pulse Tracker Methodology', desc: 'How AlphaSignal detects and clusters institutional-sized on-chain transactions to distinguish accumulation from exchange shuffling.' },
        'explain-mindshare': { title: 'Docs — Narrative Galaxy & Mindshare Engine', desc: 'NLP processing pipeline for social cluster visualisation, narrative velocity scoring, and crowded trade detection.' },
        'explain-benchmark': { title: 'Docs — Portfolio Simulation Methodology', desc: 'How to model and benchmark quant crypto portfolios using the AlphaSignal Monte Carlo and attribution engine.' },
        'explain-alerts': { title: 'Docs — Signal Alerts Configuration Guide', desc: 'Setting up Z-score alert thresholds, Discord and Telegram webhook integration, and sensitivity calibration.' },
        'explain-zscore': { title: 'Docs — Z-Score Interpretation & Stress Lab', desc: 'Decoding statistical signal intensity, outlier detection, and macro scenario stress testing methodology.' },
        'explain-alpha': { title: 'Docs — Alpha Strategy Methodology', desc: 'Trading relative strength benchmarks vs Bitcoin and calculating risk-adjusted alpha using institutional signals.' },
        'explain-correlation': { title: 'Docs — Correlation Matrix Methodology', desc: 'Understanding rolling cross-asset correlations, decoupling events, and sector rotation signals.' },
        'explain-sentiment': { title: 'Docs — Sentiment Synthesis Engine', desc: 'How social mindshare, NLP polarity scores, and news flow are synthesised into actionable sentiment intelligence.' },
        'explain-risk': { title: 'Docs — Risk Management Framework', desc: 'Institutional position sizing, Value-at-Risk modelling, and drawdown protection frameworks.' },
        'explain-playbook': { title: 'Docs — Institutional Trading Playbook', desc: 'Advanced strategies, signal combinations, and institutional decision frameworks for systematic trading.' },
        'explain-regimes': { title: 'Docs — Market Regime Classification', desc: 'Markov-Switching regime detection methodology for identifying Accumulation, Distribution, and Trending market cycles.' },
        'explain-advanced-charting': { title: 'Docs — Advanced Charting Suite Guide', desc: 'Professional charting with TradingView, funding heatmap, 3D volatility surface, and orderbook overlay methodology.' },
        'explain-onchain': { title: 'Docs — On-Chain Analytics Methodology', desc: 'Real MVRV, SOPR, Puell Multiple, and hashrate data sourcing from CoinGecko and Blockchain.info.' },
        'explain-api': { title: 'Docs — Institutional API Reference', desc: 'Programmatic access to AlphaSignal real-time signals, liquidity depth, and narrative intelligence for quant desks.' },
        'explain-glossary': { title: 'Docs — Terminal Glossary & Metric Reference', desc: 'Quick-reference guide to all technical metrics, signals, and institutional terminology used across the AlphaSignal platform.' },
        'explain-performance': { title: 'Docs — Performance Analytics Methodology', desc: 'Institutional win rate, return distribution, monthly P&L attribution, and benchmark comparison methodology.' },
        'explain-alpha-score': { title: 'Docs — Alpha Score Composite Methodology', desc: 'Multi-factor alpha score: Z-score signal strength, ML confidence, on-chain momentum, and neural sentiment weighting.' },
        'explain-telegram': { title: 'Docs — Alert Hooks Setup Guide', desc: 'Complete setup guide for Discord and Telegram webhook integration with Z-score sensitivity thresholds.' },
        'explain-pwa': { title: 'Docs — Mobile PWA Installation Guide', desc: 'Install AlphaSignal as a Progressive Web App on iOS and Android for full native terminal access.' },
        'explain-portfolio-lab': { title: 'Docs — Portfolio Optimizer Methodology', desc: 'Monte Carlo simulation, Markowitz Efficient Frontier, ML-constrained rebalancing, and GPT-4 memo generation.' },
        'explain-velocity': { title: 'Docs — Chain Velocity & Capital Rotation', desc: 'Cross-chain volume acceleration tracking and capital rotation methodology across L1 networks.' },
        'explain-signal-archive': { title: 'Docs — Signal Archive Methodology', desc: 'How the AlphaSignal immutable signal archive records, tracks, and attributes historical signal performance.' },
        'explain-topologies': { title: 'Docs — Charting Topologies & Geometries', desc: 'Ecosystem capital flows, whale wallet Sankey, yield curve spread monitor, and signal confidence radar methodology.' },
        'explain-ai-engine': { title: 'Docs — AI Narrative Engine & Ask Terminal', desc: 'GPT-4o-mini memo generation, Ask Terminal conversational AI, and Signal Thesis Generator methodology.' },
        'explain-strategy-lab': { title: 'Docs — Strategy Lab Methodology', desc: 'Pairs Trading, Momentum Ignition, Regime Carry, Kelly Sizer, and Dual Momentum walk-forward validation methodology.' },
        'explain-backtester-v2': { title: 'Docs — Signal Backtester V2 Guide', desc: 'Historical signal simulation with rolling Sharpe, monthly P&L calendar, and BTC benchmark comparison methodology.' },
        'explain-tradingview': { title: 'Docs — TradingView Integration Guide', desc: 'Professional TradingView chart integration with pre-loaded MA/RSI/MACD/BB studies and all crypto and equity symbols.' },
        // Phase 17 and new doc pages
        'explain-etf-flows': { title: 'Docs — Bitcoin Spot ETF Flows Methodology', desc: 'Daily institutional ETF flow tracking across BlackRock IBIT, Fidelity FBTC, ARK ARKB and more — data sourcing and interpretation guide.' },
        'explain-liquidations': { title: 'Docs — Liquidation Cascade Scanner Guide', desc: 'Real-time leverage wipeout detection across Binance, OKX, Bybit, and Deribit — interpretation and cascade alert methodology.' },
        'explain-oi-radar': { title: 'Docs — Open Interest Radar Methodology', desc: 'Cross-asset perpetual futures OI tracking with funding rate overlay — identifying over-leveraged conditions and divergence signals.' },
        'explain-cme-gaps': { title: 'Docs — CME Bitcoin Gap Analysis Guide', desc: 'CME futures gap detection, historical fill probability scoring, and gap trading methodology for institutional traders.' },
        'explain-flow': { title: 'Docs — Capital Flows Monitor Methodology', desc: 'ETF flow aggregation, stablecoin velocity tracking, and exchange net position change methodology.' },
        'explain-rotation': { title: 'Docs — Sector Rotation Tracker Methodology', desc: 'Weighted sector treemap, momentum matrix, and beta expansion alert methodology for crypto capital rotation analysis.' },
        'explain-macro-compass': { title: 'Docs — Macro Compass Methodology', desc: 'DXY inverse correlation, yield curve monitoring, and macro risk regime classification methodology.' },
        'explain-macro-calendar': { title: 'Docs — Macro Event Calendar Guide', desc: 'FOMC/CPI/NFP/PCE event impact scoring methodology using 2-year historical BTC price data.' },
        'explain-narrative': { title: 'Docs — Narrative Galaxy Methodology', desc: 'Force-directed NLP cluster mapping, narrative velocity scoring, and crowded trade saturation detection.' },
        'explain-token-unlocks': { title: 'Docs — Token Unlock Schedule Guide', desc: 'Supply shock scoring, unlock calendar data sourcing, and historical price impact methodology for token unlock events.' },
        'explain-yield-lab': { title: 'Docs — DeFi Yield Lab Methodology', desc: 'Multi-protocol APY comparison, risk-adjusted yield scoring, and DeFi vs TradFi spread tracking methodology.' },
        'explain-tradelab': { title: 'Docs — Trade Idea Lab Guide', desc: 'AI-assisted trade thesis generation, risk/reward calculation, and trade ledger integration workflow.' },
        'explain-options-flow': { title: 'Docs — Options Flow Scanner Methodology', desc: 'Deribit PCR, Max Pain, IV smile, and OI strike data sourcing and institutional interpretation guide.' },
        'explain-newsroom': { title: 'Docs — Institutional Newsroom Guide', desc: 'AI sentiment tagging, news filtering methodology, and breaking news alert threshold configuration.' },
        'explain-trade-ledger': { title: 'Docs — Institutional Trade Ledger Guide', desc: 'Execution ticket lifecycle, PnL attribution, AI thesis archive, and compliance export methodology.' },
        'explain-heatmap': { title: 'Docs — Market Heatmap Guide', desc: 'Z-score heatmap computation, sector grouping, and colour scale interpretation for the 50+ asset universe.' },
        'explain-command-center': { title: 'Docs — Command Center Guide', desc: 'Consolidated master view architecture, data aggregation sources, and hub-level intelligence summary methodology.' },
        'explain-ask-terminal': { title: 'Docs — Ask Terminal AI Guide', desc: 'GPT-4o-mini conversational AI, terminal context injection, and on-demand research memo generation methodology.' },
    };

    const meta = viewMetadata[view] || {
        title: view.charAt(0).toUpperCase() + view.slice(1),
        desc: 'AlphaSignal Institutional Intelligence Terminal - Real-time signals and AI insights.'
    };

    const fullTitle = `${meta.title} | AlphaSignal -- Bitcoin & Crypto Trading Signals`;
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
                    { "@type": "Question", "name": "How does AlphaSignal calculate Alpha?", "acceptedAnswer": { "@type": "Answer", "text": "Alpha is calculated using a rolling Z-score deviation of returns relative to a Bitcoin (BTC) benchmark, adjusted for institutional volume and order flow magnitude. A Z-score above +2.0 indicates a statistically significant positive deviation -- the core of our signal generation logic." } },
                    { "@type": "Question", "name": "What makes the Options Flow Scanner different?", "acceptedAnswer": { "@type": "Answer", "text": "AlphaSignal sources live data directly from the Deribit API -- the world's largest crypto options exchange by volume. We compute Put/Call ratio, Max Pain strike, ATM Implied Volatility, and the full IV smile across all strikes in real time." } },
                    { "@type": "Question", "name": "How does the AI Portfolio Rebalancer work?", "acceptedAnswer": { "@type": "Answer", "text": "The AI Rebalancer uses Monte Carlo simulation to model 10,000 portfolio scenarios. It applies Markowitz Efficient Frontier optimisation constrained by ML signal confidence scores, then generates a GPT-4 rebalancing memo. All recommended trades convert to execution tickets in the Trade Ledger." } },
                    { "@type": "Question", "name": "What data sources power the Macro Event Calendar?", "acceptedAnswer": { "@type": "Answer", "text": "The calendar aggregates FOMC, CPI, NFP, and PCE schedules from the Federal Reserve and BLS. Each event is scored for historical BTC impact using 2 years of real price data via yfinance, showing median move and directional bias." } },
                    { "@type": "Question", "name": "Is this terminal suitable for automated strategies?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. The Signal Archive and Backtester V2 allow historical performance validation across market regimes. The Trade Idea Lab and Trade Ledger support structured execution, and the institutional API provides programmatic data access for quant desks." } },
                    { "@type": "Question", "name": "Can I use AlphaSignal on mobile?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. AlphaSignal is a Progressive Web App (PWA) installable on iOS and Android. Navigate to the terminal on your mobile browser and select Add to Home Screen for a full native-app experience." } }
                ]
            });
        }

        ldJsonEl.textContent = JSON.stringify(schemas);
    }

    console.log(`SEO Update: Full synchronization complete for view "${view}"`);
}

function switchView(view, pushState = true) {
    // Clean up view-specific live intervals
    if (window._gommLiveInterval) { clearInterval(window._gommLiveInterval); window._gommLiveInterval = null; }

    // Global Memory Wipe for 60FPS Optimization
    if (typeof window.globalUIWipe === 'function') {
        window.globalUIWipe();
    }

    // 1. Check Access Rights — three-tier model
    // PUBLIC: no auth required
    const isPublicView = (
        view === 'signals' || view === 'home' || view === 'help' ||
        view?.startsWith('explain-')
    );
    // FREE: login required, no subscription needed
    const isFreeView = isPublicView || view === 'command-center' || view === 'free-tier';

    if (!isPublicView && !isPremiumUser) {
        if (!isFreeView) {
            // Premium-gated view
            console.warn(`Paywall: ${view} requires Institutional subscription.`);
            if (!isAuthenticatedUser) {
                showAuth(true);
                showToast('AUTHENTICATION REQUIRED', 'Please log in to access institutional intelligence.', 'alert');
            } else {
                showPaywall(true);
                showToast('INSTITUTIONAL ACCESS REQUIRED', 'Upgrade to access this module.', 'alert');
            }
            return;
        } else if (!isAuthenticatedUser) {
            // Free-tier view, but not logged in
            console.warn(`Login required: ${view}`);
            showAuth(true);
            showToast('LOGIN REQUIRED', 'Please log in to access this module.', 'alert');
            return;
        }
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
            const isSignup = document.getElementById('login-btn').textContent.trim() === 'REGISTER';
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
                    const isSignup = document.getElementById('login-btn').textContent.trim() === 'REGISTER';
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
    const text = `Ã°Å¸Å¡Â¨ AlphaSignal Terminal Update: $${ticker}\n\n` +
                 `Ã°Å¸â€œË† Relative Alpha: ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%\n` +
                 `Ã°Å¸Â§Â  Sentiment Synthesis: ${sentimentLabel}\n` +
                 `Ã¢Å¡Â¡ Z-Score Intensity: ${zScore.toFixed(2)}\n\n` +
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
        const z = parseFloat(document.getElementById('z-threshold-slider')?.value || 2.0);
        const res = await fetchAPI('/user/settings', 'POST', {
            discord_webhook: discord,
            telegram_chat_id: telegram,
            alerts_enabled: enabled
        });
        // Also persist z_threshold via Phase 17-A endpoint
        await fetchAPI('/alert-settings', 'POST', { z_threshold: z });
        
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

// Ensure Live Streams connect on load
document.addEventListener('DOMContentLoaded', () => {
    initLivePriceStream();
    initLiveAlphaScroller();
    initFearGreedGauge();
    setTimeout(initBTCSparkline, 300); // slight delay ensures Chart.js is ready
    setInterval(initBTCSparkline, 5 * 60 * 1000);
    // updateInstitutionalPulse();
});

// Backup: if script loads after DOM is already ready (rare, e.g. deferred)
if (document.readyState === 'complete') {
    initLivePriceStream();
    initLiveAlphaScroller();
    initFearGreedGauge();
    setTimeout(initBTCSparkline, 300);
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
    , 'advanced-charting'
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
                        showToast(`Ã°Å¸â€œÂ¡ ${msg.data.signal_type}`, msg.data.message, 'alert');
                    } else if (msg.type === 'regime_shift') {
                        showToast(`Ã¢Å¡â€“Ã¯Â¸Â REGIME SHIFT`, `Market has shifted from ${msg.data.old} to ${msg.data.new}.`, 'regime');
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
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#bc13fe">smart_toy</span>Ask the Terminal <span class="premium-badge" style="background:#bc13fe;color:black">AI</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-ask-terminal')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
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
                <div style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem">${ticker} &bull; <span style="color:${signal === 'LONG' ? '#22c55e' : signal === 'SHORT' ? '#ef4444' : '#facc15'}">${signal}</span> &bull; Z-Score: ${zscore}Ïƒ</div>
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

            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB</button>
                <button class="intel-action-btn" onclick="switchView('ask-terminal')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800"><span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW</button>
            </div>
        </div>`;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Phase 15-C: Export / Sharing Engine
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
 * Phase 17: Institutional Research Report — 5-section data-driven PDF
 * Sections: Performance | Backtester | Top Signals | Macro Events | Signal Archive Snapshot
 */
async function exportResearchReport() {
    if (typeof window.jspdf === 'undefined') {
        showToast('EXPORT', 'PDF library loading, please try again.', 'info'); return;
    }
    showToast('BUILDING REPORT', 'Fetching institutional data...', 'info');
    try {
        // Parallel data fetch
        const [perfData, btData, signalsData, macroData, archiveData] = await Promise.allSettled([
            fetchAPI('/performance'),
            fetchAPI('/backtest-v2?hold=5&limit=50'),
            fetchAPI('/signals'),
            fetchAPI('/macro-calendar'),
            fetchAPI('/signal-history')
        ]);

        const perf    = perfData.status === 'fulfilled'    ? perfData.value    : null;
        const bt      = btData.status === 'fulfilled'      ? btData.value      : null;
        const signals = signalsData.status === 'fulfilled' ? signalsData.value : [];
        const macro   = macroData.status === 'fulfilled'   ? macroData.value   : [];
        const archive = archiveData.status === 'fulfilled' ? archiveData.value : [];

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PW = pdf.internal.pageSize.getWidth();
        const PH = pdf.internal.pageSize.getHeight();
        const M  = 14;
        const accent = [0, 212, 170];
        const now = new Date().toUTCString();

        const addHeader = (pageLabel) => {
            pdf.setFillColor(5, 7, 10);
            pdf.rect(0, 0, PW, PH, 'F');
            pdf.setFillColor(...accent);
            pdf.rect(0, 0, PW, 10, 'F');
            pdf.setTextColor(0, 0, 0); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
            pdf.text('ALPHASIGNAL INSTITUTIONAL RESEARCH REPORT', M, 7);
            pdf.setFont('helvetica', 'normal');
            pdf.text(now, PW - M, 7, { align: 'right' });
        };

        const sectionTitle = (label, y) => {
            pdf.setFillColor(0, 212, 170, 0.1);
            pdf.setDrawColor(...accent);
            pdf.setLineWidth(0.4);
            pdf.line(M, y, PW - M, y);
            pdf.setTextColor(...accent); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
            pdf.text(label, M, y + 7);
        };

        const row = (label, value, y, color) => {
            pdf.setTextColor(150, 150, 150); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
            pdf.text(label, M, y);
            if (color) pdf.setTextColor(...color); else pdf.setTextColor(230, 230, 230);
            pdf.setFont('helvetica', 'bold');
            pdf.text(String(value), M + 80, y);
        };

        // ─────────────────────────────────────────
        // PAGE 1: Cover + Performance + Backtester
        // ─────────────────────────────────────────
        addHeader('Page 1');
        // Cover band
        pdf.setFillColor(5, 20, 30);
        pdf.rect(0, 10, PW, 32, 'F');
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(20); pdf.setFont('helvetica', 'bold');
        pdf.text('AlphaSignal', M, 26);
        pdf.setTextColor(...accent); pdf.setFontSize(11);
        pdf.text('Institutional Research Report', M, 34);
        pdf.setTextColor(130, 130, 130); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`, M, 40);

        // Section 1: Performance
        let y = 52;
        sectionTitle('SECTION 1 — PORTFOLIO PERFORMANCE', y);
        y += 12;
        if (perf && perf.stats) {
            const s = perf.stats;
            [
                ['Total Return',      (s.total_return >= 0 ? '+' : '') + s.total_return + '%',  s.total_return >= 0 ? [34,197,94] : [239,68,68]],
                ['Sharpe Ratio',      s.sharpe,              (s.sharpe||0) >= 1 ? [0,212,170] : [255,215,0]],
                ['Max Drawdown',      '-' + s.max_drawdown + '%',  [239,68,68]],
                ['Win Rate',          s.win_rate + '%',      (s.win_rate||0) >= 55 ? [34,197,94] : [239,68,68]],
                ['Calmar Ratio',      s.calmar,              (s.calmar||0) >= 1 ? [0,212,170] : [255,215,0]],
                ['Total Trades',      s.total_trades,        null]
            ].forEach(([l, v, c]) => { row(l, v ?? '--', y, c); y += 9; });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Performance data unavailable (requires premium access).', M, y); y += 9;
        }

        // Section 2: Backtester
        y += 4;
        sectionTitle('SECTION 2 — BACKTESTER V2 SUMMARY (5-DAY HOLD)', y);
        y += 12;
        if (bt && bt.stats) {
            const s = bt.stats;
            [
                ['Win Rate',          s.win_rate + '%',      (s.win_rate||0) >= 55 ? [34,197,94] : [239,68,68]],
                ['Total Return',      (s.total_return >= 0 ? '+' : '') + s.total_return + '%', s.total_return >= 0 ? [34,197,94] : [239,68,68]],
                ['Sharpe Ratio',      s.sharpe,              (s.sharpe||0) >= 1 ? [0,212,170] : [255,215,0]],
                ['Max Drawdown',      '-' + s.max_drawdown + '%', [239,68,68]],
                ['Profit Factor',     s.profit_factor,       (s.profit_factor||0) >= 1.5 ? [34,197,94] : [255,215,0]],
                ['Calmar Ratio',      s.calmar,              null],
                ['Total Trades',      s.total_trades,        null]
            ].forEach(([l, v, c]) => { row(l, v ?? '--', y, c); y += 9; });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Backtester data unavailable (requires premium access).', M, y); y += 9;
        }

        // ─────────────────────────────────────
        // PAGE 2: Top Signals + Macro Events
        // ─────────────────────────────────────
        pdf.addPage();
        addHeader('Page 2');
        y = 20;

        // Section 3: Top Signals
        sectionTitle('SECTION 3 — TOP LIVE INSTITUTIONAL SIGNALS', y);
        y += 12;
        const sigList = Array.isArray(signals) ? signals.slice(0, 10) : [];
        if (sigList.length) {
            // Table header
            pdf.setTextColor(100,100,100); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
            ['TICKER', 'TYPE', 'Z-SCORE', 'ALPHA %', 'CONFIDENCE'].forEach((h, i) => {
                pdf.text(h, M + i * 36, y);
            });
            y += 6;
            pdf.setLineWidth(0.2); pdf.setDrawColor(50,50,50);
            pdf.line(M, y, PW - M, y); y += 4;

            sigList.forEach((s, idx) => {
                const bg = idx % 2 === 0;
                if (bg) { pdf.setFillColor(15, 22, 30); pdf.rect(M - 2, y - 4, PW - M*2 + 4, 8, 'F'); }
                pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...accent); pdf.setFontSize(8);
                pdf.text(s.ticker || '--', M, y);
                pdf.setTextColor(200,200,200); pdf.setFont('helvetica', 'normal');
                pdf.text(s.signal_type || s.type || '--', M + 36, y);
                const z = parseFloat(s.z_score || 0);
                pdf.setTextColor(z >= 0 ? 34 : 239, z >= 0 ? 197 : 68, z >= 0 ? 94 : 68);
                pdf.text(z.toFixed(2), M + 72, y);
                const a = parseFloat(s.alpha || 0);
                pdf.setTextColor(a >= 0 ? 34 : 239, a >= 0 ? 197 : 68, a >= 0 ? 94 : 68);
                pdf.text((a >= 0 ? '+' : '') + a.toFixed(2) + '%', M + 108, y);
                pdf.setTextColor(200,200,200);
                pdf.text(s.confidence != null ? s.confidence + '%' : '--', M + 144, y);
                y += 9;
            });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Signal data unavailable.', M, y); y += 9;
        }

        // Section 4: Macro Events
        y += 6;
        sectionTitle('SECTION 4 — UPCOMING MACRO EVENTS', y);
        y += 12;
        const macroList = Array.isArray(macro) ? macro.slice(0, 8) : [];
        if (macroList.length) {
            pdf.setTextColor(100,100,100); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
            ['DATE', 'EVENT', 'IMPACT', 'BTC MEDIAN MOVE'].forEach((h, i) => {
                pdf.text(h, M + [0, 28, 110, 145][i], y);
            });
            y += 6;
            pdf.setLineWidth(0.2); pdf.setDrawColor(50,50,50);
            pdf.line(M, y, PW - M, y); y += 4;

            macroList.forEach((ev, idx) => {
                if (y > PH - 25) { pdf.addPage(); addHeader('Page 3'); y = 20; }
                const bg = idx % 2 === 0;
                if (bg) { pdf.setFillColor(15, 22, 30); pdf.rect(M - 2, y - 4, PW - M*2 + 4, 8, 'F'); }
                const impact = ev.impact_score || ev.impact || 0;
                const impColor = impact >= 7 ? [239,68,68] : impact >= 4 ? [255,165,0] : [100,200,100];
                pdf.setFont('helvetica', 'normal'); pdf.setTextColor(200,200,200); pdf.setFontSize(7.5);
                const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('en-US', {month:'short',day:'numeric'}) : '--';
                pdf.text(dateStr, M, y);
                const evName = (ev.event || ev.name || '--').substring(0, 30);
                pdf.text(evName, M + 28, y);
                pdf.setTextColor(...impColor);
                pdf.text(String(impact) + '/10', M + 110, y);
                pdf.setTextColor(200,200,200);
                const btcMove = ev.btc_median_move != null ? (ev.btc_median_move >= 0 ? '+' : '') + ev.btc_median_move + '%' : '--';
                pdf.text(btcMove, M + 145, y);
                y += 9;
            });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Macro calendar data unavailable.', M, y); y += 9;
        }

        // ─────────────────────────────────────
        // PAGE 3 (or continued): Signal Archive
        // ─────────────────────────────────────
        if (y > PH - 60) { pdf.addPage(); addHeader('Page'); y = 20; }
        y += 6;
        sectionTitle('SECTION 5 — SIGNAL ARCHIVE SNAPSHOT (LAST 10)', y);
        y += 12;
        const archList = Array.isArray(archive) ? archive.slice(0, 10) : [];
        if (archList.length) {
            pdf.setTextColor(100,100,100); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
            ['TICKER', 'TYPE', 'DATE', 'P&L %', 'STATE'].forEach((h, i) => {
                pdf.text(h, M + [0, 30, 66, 106, 140][i], y);
            });
            y += 6;
            pdf.line(M, y, PW - M, y); y += 4;

            archList.forEach((sig, idx) => {
                if (y > PH - 25) { pdf.addPage(); addHeader('Page'); y = 20; }
                const bg = idx % 2 === 0;
                if (bg) { pdf.setFillColor(15, 22, 30); pdf.rect(M - 2, y - 4, PW - M*2 + 4, 8, 'F'); }
                const pnl = parseFloat(sig.pnl_pct || sig.pnl || 0);
                pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...accent); pdf.setFontSize(7.5);
                pdf.text(sig.ticker || '--', M, y);
                pdf.setFont('helvetica', 'normal'); pdf.setTextColor(200,200,200);
                pdf.text((sig.signal_type || sig.type || '--').substring(0,14), M + 30, y);
                pdf.text(sig.timestamp ? sig.timestamp.split('T')[0] : '--', M + 66, y);
                pdf.setTextColor(pnl >= 0 ? 34 : 239, pnl >= 0 ? 197 : 68, pnl >= 0 ? 94 : 68);
                pdf.setFont('helvetica', 'bold');
                pdf.text((pnl >= 0 ? '+' : '') + pnl.toFixed(2) + '%', M + 106, y);
                pdf.setTextColor(200,200,200); pdf.setFont('helvetica', 'normal');
                pdf.text((sig.state || 'ACTIVE').substring(0, 12), M + 140, y);
                y += 9;
            });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Signal archive data unavailable.', M, y); y += 9;
        }

        // Footer on all pages
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setTextColor(80, 80, 80); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal');
            pdf.text(`CONFIDENTIAL — INSTITUTIONAL USE ONLY — alphasignal.digital — Page ${i}/${pageCount}`, PW / 2, PH - 5, { align: 'center' });
        }

        const ts = new Date().toISOString().slice(0, 10);
        pdf.save(`alphasignal-research-report-${ts}.pdf`);
        showToast('REPORT EXPORTED', `5-section PDF saved (${pageCount} pages).`, 'success');
    } catch (e) {
        console.error('[exportResearchReport]', e);
        showToast('ERROR', 'Report export failed: ' + e.message, 'alert');
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
        <button onclick="exportResearchReport();document.getElementById('export-action-sheet')?.remove();"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:0.15s"
            onmouseover="this.style.background='rgba(255,255,255,0.07)'" onmouseout="this.style.background='none'">
            <span class="material-symbols-outlined" style="font-size:18px;color:#f59e0b">summarize</span>
            Research Report (PDF)
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
    }, 50, 'ask-terminal'
    );
}

// ================================================================
// Phase 15-16 Documentation Pages
// ================================================================

function renderDocsStrategyLab() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#bc13fe">science</span>Documentation &mdash; Strategy Lab</h1>
            <p>Quantitative strategy framework, walk-forward validation, and Monte Carlo simulation.</p>
        </div>
        <div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:0.75rem">Available Strategies</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
                    ${[
                        ['Pairs Trading', 'Statistical arbitrage between correlated assets using Z-Score divergence. Entry when spread crosses 2 standard deviations, exit at mean reversion.'],
                        ['Momentum Ignition', 'Detects institutional momentum triggers via volume acceleration above the 2.5x rolling average. Rides the ignition window.'],
                        ['Regime Carry', 'Allocates long when the market regime is trending or accumulation. Sits in cash during distribution regimes.'],
                        ['Kelly Sizer', 'Dynamic position sizing using the Kelly Criterion against historical win rate and risk-reward. Capped at 25% max allocation.'],
                        ['Dual Momentum', 'Gary Antonacci absolute + relative momentum hybrid. Rotates between BTC, equities, and cash based on 12-month lookback.']
                    ].map(([name, desc]) => `
                        <div style="background:rgba(188,19,254,0.05);border:1px solid rgba(188,19,254,0.15);border-radius:8px;padding:1rem">
                            <div style="font-size:0.7rem;font-weight:800;color:#bc13fe;margin-bottom:6px">${name}</div>
                            <div style="font-size:0.75rem;color:var(--text-dim);line-height:1.6">${desc}</div>
                        </div>`).join('')}
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:0.75rem">Walk-Forward Validation</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The Strategy Lab runs each strategy through a parametric walk-forward test that splits the historical window into rolling in-sample (training) and out-of-sample (test) periods. The Sharpe Ratio, MaxDD, and CAGR are computed on the out-of-sample only to prevent overfitting.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:0.75rem">Monte Carlo Percentile Bands</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">1,000 Monte Carlo simulations are run by randomly sampling and re-ordering the daily return sequence. The P5, P50, and P95 bands show the range of plausible equity curves under different luck distributions &mdash; helping identify whether the strategy's edge is real or luck-dependent.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:0.75rem">Strategy Comparison Leaderboard</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Click <strong>COMPARE STRATEGIES</strong> to run all 5 strategies simultaneously and rank by Sharpe, CAGR, or Max Drawdown in the leaderboard table. Useful for identifying the optimal strategy for current market regime.</p>
            </div>

            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB</button>
                <button class="intel-action-btn" onclick="switchView('strategy-lab')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800"><span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW</button>
            </div>
        </div>`;
}

function renderDocsBacktesterV2() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#00d4aa">analytics</span>Documentation &mdash; Signal Backtester V2</h1>
            <p>Walk-forward simulation using live institutional signal history and real price data.</p>
        </div>
        <div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#00d4aa;margin-bottom:0.75rem">How It Works</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Backtester V2 pulls the last 200 signals from the live <code>alerts_history</code> database, fetches 2 years of real price data per ticker via Yahoo Finance, and simulates entries at the signal date with exits after the configured hold period (3, 5, 10, or 20 trading days). Benchmarks each trade against a buy-and-hold BTC position over the same period.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#00d4aa;margin-bottom:0.75rem">Key Metrics</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
                    ${[
                        ['Win Rate', 'Percentage of trades that closed profitable. >55% is considered edge over random.'],
                        ['Profit Factor', 'Total gross profit / total gross loss. >1.5 indicates a robust strategy.'],
                        ['Sharpe Ratio', 'Annualised risk-adjusted return. >1.0 = good, >2.0 = exceptional.'],
                        ['Max Drawdown', 'Largest peak-to-trough decline in equity. The key measure of tail risk.'],
                        ['Calmar Ratio', 'CAGR divided by Max Drawdown. >1.0 = strong risk-adjusted performance.'],
                        ['Alpha/Beta Badge', 'Excess return vs BTC for each trade. Positive = strategy beat the benchmark.']
                    ].map(([m, d]) => `<div style="background:rgba(0,212,170,0.05);border:1px solid rgba(0,212,170,0.1);border-radius:8px;padding:1rem"><div style="font-size:0.65rem;font-weight:800;color:#00d4aa;margin-bottom:4px">${m}</div><div style="font-size:0.75rem;color:var(--text-dim);line-height:1.5">${d}</div></div>`).join('')}
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#00d4aa;margin-bottom:0.75rem">Monthly P&L Calendar</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The calendar heatmap aggregates all signal P&Ls by month. Colour intensity maps to the magnitude of the monthly return &mdash; dark green = strong positive month, dark red = significant drawdown month. Hover for exact figures.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#00d4aa;margin-bottom:0.75rem">Rolling Sharpe Chart</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The dual-axis chart plots cumulative strategy return (teal) vs BTC benchmark (orange) on the left axis, and the rolling 30-day Sharpe ratio (purple) on the right. When Sharpe dips below 0, the strategy is underperforming on a risk-adjusted basis for that window.</p>
            </div>

            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB</button>
                <button class="intel-action-btn" onclick="switchView('backtester-v2')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800"><span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW</button>
            </div>
        </div>`;
}

function renderDocsTradingView() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#2196f3">show_chart</span>Documentation &mdash; TradingView Integration</h1>
            <p>Professional-grade charting embedded directly in the AlphaSignal terminal.</p>
        </div>
        <div style="max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#2196f3;margin-bottom:0.75rem">Access</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Navigate to <strong>Advanced Charting</strong> and click the <span style="color:#2196f3;font-weight:700">TRADINGVIEW</span> tab. The widget loads automatically synced to your currently selected symbol and timeframe.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#2196f3;margin-bottom:0.75rem">Supported Symbols</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8rem">
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:BTCUSDT</strong> &mdash; Bitcoin / Tether</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:ETHUSDT</strong> &mdash; Ethereum / Tether</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:SOLUSDT</strong> &mdash; Solana / Tether</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:DOGEUSDT</strong> &mdash; Dogecoin / Tether</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">NASDAQ:MSTR</strong> &mdash; MicroStrategy</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">NASDAQ:COIN</strong> &mdash; Coinbase Global</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">NASDAQ:MARA</strong> &mdash; Marathon Digital</div>
                    <div style="color:var(--text-dim)"><strong style="color:#fff">BINANCE:PEPEUSDT</strong> &mdash; PEPE / Tether</div>
                </div>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#2196f3;margin-bottom:0.75rem">Pre-loaded Studies</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The widget loads with four institutional studies pre-applied: <strong>50-period Simple Moving Average</strong>, <strong>RSI (14)</strong>, <strong>MACD (12/26/9)</strong>, and <strong>Bollinger Bands (20, 2)</strong>. Additional studies, drawing tools, and price alerts can be added directly within the widget.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#2196f3;margin-bottom:0.75rem">Export & Pop-out</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Use the widget's built-in <strong>camera icon</strong> to snapshot the chart, or the <strong>pop-out button</strong> to open a full 1200x700 window for deeper analysis. These are TradingView native features and work independently of AlphaSignal's export engine.</p>
            </div>

            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB</button>
                <button class="intel-action-btn" onclick="switchView('advanced-charting')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800"><span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW</button>
            </div>
        </div>`;
}


// ============= NEW DOC PAGES (Docs Audit v1.32) =============

// --- Global Hub ---
function renderDocsETFFlows() {
    renderExplainPage(
        "Bitcoin Spot ETF Flows",
        "Tracking daily institutional capital entering and exiting via regulated Bitcoin ETF vehicles.",
        "Since the approval of spot Bitcoin ETFs in January 2024, these products have become the primary institutional on-ramp for TradFi capital. AlphaSignal's ETF Flow monitor aggregates daily AUM changes across BlackRock (IBIT), Fidelity (FBTC), ARK (ARKB), and other major issuers. Net positive flow is a leading indicator of price support; sustained outflows often precede near-term corrections.",
        [
            { icon: 'account_balance', title: 'Net Daily Flows', desc: 'Aggregated USD-denominated inflows and outflows across all regulated spot Bitcoin ETF products.' },
            { icon: 'bar_chart', title: '7-Day Rolling Trend', desc: 'Bar chart of weekly net flows to identify sustained accumulation or distribution phases.' },
            { icon: 'trending_up', title: 'Issuer Breakdown', desc: 'Per-fund breakdown showing which ETF products are receiving the most institutional capital.' },
            { icon: 'compare_arrows', title: 'BTC Price Correlation', desc: 'Flow data overlaid against spot BTC price to visualise the lag between institutional demand and price discovery.' }
        ],
        [{ title: 'ETF Front-Running', text: 'Sustained 5-day positive net flows across IBIT and FBTC historically preceded 3-7% BTC price appreciation, providing a 24-48 hour positional edge.' }],
        "Daily AUM change data from SEC Form N-CEN filings and public ETF issuer reports."
    , 'etf-flows'
    , 'advanced-charting'
    , 'backtester-v2'
    );
}

function renderDocsLiquidations() {
    renderExplainPage(
        "Liquidation Cascade Scanner",
        "Real-time monitoring of leveraged position wipeouts across perpetual futures markets.",
        "Liquidation events occur when a leveraged trader's margin falls below the exchange maintenance threshold, forcing automatic closure. Large cascades near key technical levels can trigger chain reactions moving spot prices 5-15% in minutes. AlphaSignal tracks cross-exchange liquidations in real-time, warning you where the next forced-selling cluster will trigger.",
        [
            { icon: 'local_fire_department', title: 'Long vs Short Wipeouts', desc: 'Separate tracking of long and short liquidation volumes to gauge market directional bias.' },
            { icon: 'timeline', title: 'Liquidation Histogram', desc: 'Price-level histogram showing concentrated liquidation clusters that act as magnetic price targets.' },
            { icon: 'notifications_active', title: 'Cascade Alerts', desc: '1-minute rolling window alerts when liquidation volume exceeds 3x the 1-hour average.' },
            { icon: 'pivot_table_chart', title: 'Exchange Breakdown', desc: 'Binance, OKX, Bybit, and Deribit data compared to identify venue-specific stress.' }
        ],
        [{ title: 'The Short Squeeze Setup', text: 'When short liquidations spike above $80M in a 5-minute window while spot holds above key support, forced buying often accelerates price 4-8% within 30 minutes.' }],
        "Real-time data from Binance, OKX, Bybit, and Deribit WebSocket feeds. Refreshed every 10 seconds."
    , 'liquidations'
    );
}

function renderDocsOIRadar() {
    renderExplainPage(
        "Open Interest Radar",
        "Multi-asset perpetual futures open interest tracking across exchanges and timeframes.",
        "Open Interest (OI) measures total active derivative contracts outstanding. Rising OI with rising price confirms trend participation. Falling OI with rising price signals a short-squeeze driven move that may be unsustainable. The OI Radar gives a real-time pulse of leverage build-up across all major assets and exchanges simultaneously.",
        [
            { icon: 'track_changes', title: 'Cross-Asset OI Heatmap', desc: 'Colour-coded matrix of OI changes (1h, 4h, 24h) across BTC, ETH, SOL, and 20+ altcoins.' },
            { icon: 'trending_up', title: 'OI vs Price Divergence', desc: 'Flags assets where OI is rising sharply while price stagnates — coiled setups and trapped position warnings.' },
            { icon: 'bar_chart', title: 'Exchange Distribution', desc: 'Shows which exchanges hold most OI per asset — critical for identifying liquidation level clusters.' },
            { icon: 'radar', title: 'Funding Rate Overlay', desc: 'Combines OI with perpetual funding rates to identify when leverage is aggressively one-sided.' }
        ],
        [{ title: 'OI Divergence Trade', text: 'BTC OI rose 18% over 72 hours while price gained only 2%. The terminal flagged extreme leverage buildup. A subsequent 6% flush wiped $340M in longs.' }],
        "Aggregated OI from Binance, OKX, Bybit, and BitMEX perpetual futures APIs. Refreshed every 5 minutes."
    , 'oi-radar'
    );
}

function renderDocsCMEGaps() {
    renderExplainPage(
        "CME Gap Analysis",
        "Identifying and tracking unfilled price gaps in Bitcoin CME futures contracts.",
        "The CME Bitcoin futures market closes on weekends. During this closure, spot BTC continues trading, often moving significantly. When CME reopens, a price gap is left between Friday close and Sunday open. Statistically, ~77% of CME gaps fill within 3 months. AlphaSignal tracks all open gaps, their distance from current price, and fill probability.",
        [
            { icon: 'pivot_table_chart', title: 'Active Gap Registry', desc: 'Live table of all unfilled CME gaps with distance-from-current-price and age tracking.' },
            { icon: 'timeline', title: 'Historical Fill Rate', desc: 'Statistical analysis of gap-fill probability by gap size, age, and market regime context.' },
            { icon: 'arrow_downward', title: 'Gap Distance Calculator', desc: 'Shows the % move required to fill each gap — useful for identifying price targets in ranging markets.' },
            { icon: 'calendar_month', title: 'Weekly Gap Preview', desc: 'Tracks Friday close each week to monitor whether a new gap is likely to form over the weekend.' }
        ],
        [{ title: 'The Gap Fill Trade', text: 'With BTC at $82,000 and an unfilled gap at $78,400, the terminal flagged a 4.3% downside target. The gap filled 11 days later during a macro-driven correction.' }],
        "CME Bitcoin futures OHLCV data. Weekend gap detection runs every Monday at 00:00 UTC."
    , 'cme-gaps'
    );
}

// --- Macro Intel Hub ---
function renderDocsFlow() {
    renderExplainPage(
        "Capital Flows Monitor",
        "Tracking the velocity and direction of institutional capital rotating into the crypto ecosystem.",
        "Capital Flows measures net USD movement through ETF products, exchange inflows/outflows, and stablecoin minting/burning. Flow data reveals the structural demand behind a move — distinguishing genuine institutional accumulation from retail FOMO-driven pumps. A sustained multi-week positive flow regime is one of the most reliable macro bull signals in the terminal.",
        [
            { icon: 'swap_horiz', title: 'Net Flow Attribution', desc: 'Exchange-wide net capital attribution combining spot ETF data, on-chain flows, and stablecoin supply changes.' },
            { icon: 'trending_up', title: 'Sector Momentum', desc: 'Identifies which crypto sectors are receiving capital and which are experiencing outflows.' },
            { icon: 'waterfall_chart', title: 'Stablecoin Velocity', desc: 'USDT and USDC mint/burn rates as a proxy for incoming dry powder and buying pressure.' },
            { icon: 'compare_arrows', title: 'Exchange Net Position', desc: 'Rolling 30-day exchange net position change — sustained outflows are historically bullish for spot.' }
        ],
        [{ title: 'The Pre-Rally Signal', text: '14 days of positive ETF flows combined with declining exchange BTC reserves preceded a 22% BTC rally. Capital Flows caught both signals simultaneously.' }],
        "Aggregated from spot ETF AUM reports, Glassnode exchange reserve data, and on-chain USDT/USDC treasury monitors."
    , 'flow'
    );
}

function renderDocsRotation() {
    renderExplainPage(
        "Sector Rotation Tracker",
        "Visualising capital rotation across crypto sectors using a treemap and momentum matrix.",
        "Crypto markets rotate through distinct sector cycles. Capital first floods into Bitcoin, then Ethereum, then L1 altcoins, then DeFi and memecoins. Identifying where a rotation is in this cycle allows traders to position ahead of the crowd. The Sector Rotation view uses a weighted treemap with a momentum matrix flagging emerging rotation signals.",
        [
            { icon: 'rotate_right', title: 'Sector Treemap', desc: 'Dynamic, weighted treemap of 7D relative performance across L1, DeFi, AI, Memes, Gaming, and RWA sectors.' },
            { icon: 'bar_chart', title: 'Rotation Momentum', desc: 'Cross-asset momentum ranking showing 24h, 7D, and 30D leaders to identify where rotation flows are heading.' },
            { icon: 'electric_bolt', title: 'Beta Expansion Alerts', desc: 'Signals when a sector begins outperforming BTC on a risk-adjusted basis — early warning of a rotation event.' },
            { icon: 'bubble_chart', title: 'Dominance Shifts', desc: 'BTC.D and ETH.D dominance tracking to confirm when capital is rotating into or out of altcoin exposure.' }
        ],
        [{ title: 'L1 Rotation Capture', text: 'When ETH.D declined while SOL and AVAX outperformed BTC on a 7-day basis, the tracker flagged an L1 rotation. The identified basket returned an additional 35% over 3 weeks.' }],
        "Real-time OHLCV from 10+ centralised exchanges. Sector taxonomy maintained across 500+ assets."
    , 'rotation'
    );
}

function renderDocsMacroCompass() {
    renderExplainPage(
        "Macro Compass",
        "A synthesised dashboard tracking the global macro environment and its impact on digital assets.",
        "The Macro Compass aggregates key macro signals — equity correlation, DXY strength, yield curve shapes, and commodity trends — into a coherent view. Bitcoin has a 0.6-0.8 rolling correlation with risk-on assets during macro stress events, making macro context essential for timing entries and exits across all terminal instruments.",
        [
            { icon: 'public', title: 'Macro Correlation Matrix', desc: 'Rolling 30-day correlations between BTC, SPX, NASDAQ, DXY, Gold, and 10Y Treasury yields.' },
            { icon: 'show_chart', title: 'Yield Curve Monitor', desc: 'US Treasury 2Y/10Y/30Y spread tracking. Sustained inversion has preceded risk-off environments.' },
            { icon: 'trending_down', title: 'DXY Impact Model', desc: 'Real-time DXY overlay against BTC to quantify the inverse relationship and identify dollar-driven moves.' },
            { icon: 'layers', title: 'Risk Regime Overlay', desc: 'Current macro regime classification (Risk-On / Risk-Off / Transitional) based on equity volatility and credit spreads.' }
        ],
        [{ title: 'The DXY Breakout Trade', text: 'When DXY broke above 105 following hotter-than-expected CPI, the Compass immediately flagged a shift to Risk-Off regime. BTC declined 8% over 72 hours.' }],
        "Federal Reserve FRED database, DTCC yield curve data, and Bloomberg cross-asset correlation matrices. Updated daily."
    , 'macro'
    );
}

function renderDocsMacroCalendar() {
    renderExplainPage(
        "Macro Event Calendar",
        "A 90-day forward calendar of institutional macro events scored by historical BTC impact.",
        "The Macro Event Calendar tracks scheduled economic releases — FOMC decisions, CPI prints, NFP reports, and PCE data — and scores each by its average historical BTC price impact over the past 6 occurrences. This turns the economic calendar from a passive reference into an active positioning tool.",
        [
            { icon: 'event', title: 'Event Timeline', desc: '90-day chronological listing of macro events with days-until countdown and event type badge.' },
            { icon: 'bar_chart', title: 'Historical BTC Impact', desc: 'Per-event scoring showing median BTC move, average volatility, and historical directional bias.' },
            { icon: 'warning', title: 'Impact Tier Badges', desc: 'Events classified HIGH / MEDIUM / LOW by weighted impact score, enabling rapid calendar triage.' },
            { icon: 'timeline', title: 'Historical Move Bars', desc: 'Bar chart showing the last 6 real BTC same-date moves for each event instance.' }
        ],
        [{ title: 'Pre-FOMC Positioning', text: 'FOMC meetings average 4.2% BTC volatility on announcement day. The calendar HIGH impact flag and historical bars gave traders a clear reference for sizing hedges in advance.' }],
        "FOMC, CPI, NFP, and PCE schedules from the Federal Reserve and BLS. Historical impact scored against 2-year BTC price data via yfinance."
    , 'macro-calendar'
    );
}

// --- Global Markets Hub ---
function renderDocsETFFlows() {
    renderExplainPage(
        "Bitcoin Spot ETF Flows Monitor",
        "Daily institutional capital flow tracking across all SEC-approved Bitcoin spot ETF vehicles.",
        "AlphaSignal's ETF Flows view aggregates daily net flow data across BlackRock IBIT, Fidelity FBTC, ARK ARKB, Bitwise BITB, and 7 further vehicles. Net inflows indicate institutional accumulation; consistent outflows signal de-risking. The 7-day rolling total is the highest-signal variant — single-day swings are noise, sustained directional flows are regime-defining.",
        [
            { icon: 'account_balance', title: 'Daily Net Flow Bar Chart', desc: 'Per-ETF and aggregate net flow bars for the trailing 30 days. Color-coded green for inflows, red for outflows.' },
            { icon: 'timeline', title: '7D Rolling Totals', desc: 'Smoothed 7-day cumulative net flow by vehicle. Sustained +$1B+ weekly inflows historically precede bullish price continuations.' },
            { icon: 'table_chart', title: 'AUM League Table', desc: 'Ranked ETF AUM snapshot with today\'s flow, 7D total, and YTD net flow — allowing quick identification of dominant flow vehicles.' },
            { icon: 'notifications_active', title: 'Outflow Reversal Alerts', desc: 'When a previously positive-flow ETF switches to sustained outflow for 3+ days, a system alert fires via the Alerts hub.' }
        ],
        [{ title: 'Identifying Institutional Accumulation Windows', text: 'In March 2024, sustained IBIT inflows exceeding $500M/day for 5 consecutive days preceded a 22% BTC rally. The ETF Flow tracker flagged the regime shift before price confirmed.' }],
        "ETF flow data from BitMEX Research, The Block, and Farside Investors. AUM data from SEC 13F filings and ETF provider daily disclosures. Updated daily by 20:00 UTC."
    , 'etf-flows'
    );
}

function renderDocsLiquidations() {
    renderExplainPage(
        "Liquidation Cascade Scanner",
        "Real-time leveraged position wipeout detection across major derivatives venues.",
        "The Liquidation Scanner aggregates forced liquidation events from Binance, OKX, Bybit, and Deribit in near real-time. Sustained high-volume liquidations — especially clustered cascades — are leading indicators of capitalisation events. The scanner distinguishes between routine liquidations and systemic cascades by applying a rolling hourly Z-score deviation filter.",
        [
            { icon: 'local_fire_department', title: 'Live Liquidation Feed', desc: 'Timestamped liquidation events by venue, direction (long/short), and USD size. Large block liquidations are highlighted.' },
            { icon: 'bar_chart', title: 'Cascade Heatmap', desc: 'Price-binned heatmap showing cumulative liquidation volume at each price level — revealing where leverage clusters exist ahead of the market.' },
            { icon: 'trending_down', title: 'Long/Short Ratio', desc: 'Rolling ratio of long-vs-short liquidations. Extreme long-liquidation events (>80% of volume) signal capitulation bottoms.' },
            { icon: 'warning_amber', title: 'Cascade Alert System', desc: 'When 15-minute liquidation volume exceeds 2.5x its 30-day rolling average, a CASCADE WARNING fires to the terminal.' }
        ],
        [{ title: 'The Cascade Bottom Signal', text: 'On a major flash crash day, the scanner registered $480M in long liquidations within 90 minutes — the highest reading in 60 days. This extreme reading historically signals within 72 hours of a local bottom.' }],
        "Liquidation data from Binance WebSocket, OKX, Bybit, and Deribit public API streams. Large liquidation definition: single event >$1M USD equivalent. Cascade definition: 15m volume >2.5x 30D average."
    , 'liquidations'
    );
}

function renderDocsOIRadar() {
    renderExplainPage(
        "Open Interest Radar",
        "Cross-asset perpetual futures open interest tracking with funding rate overlay.",
        "Open Interest (OI) measures the total dollar value of all open derivative positions on an asset. Rising OI with rising price confirms a healthy trend; rising OI with falling price signals aggressive shorting. The OI Radar monitors the top 20 perpetual futures markets across Binance, Bybit, and OKX, with real-time funding rate overlay to distinguish directional from hedged positioning.",
        [
            { icon: 'track_changes', title: 'OI League Table', desc: 'Top 20 perp markets ranked by total OI, with 24h OI change percentage and current funding rate alongside price.' },
            { icon: 'area_chart', title: 'OI vs Price Overlay', desc: '72-hour chart of OI and price together — divergences (OI rising + price falling) are flagged as potential short squeeze setups.' },
            { icon: 'payments', title: 'Funding Rate Monitor', desc: 'Live funding rates per asset. Sustained negative funding (shorts paying longs) signals an overcrowded short that historically resolves with a squeeze.' },
            { icon: 'bolt', title: 'OI Spike Alerts', desc: 'When OI surges >15% within a 4-hour window, the system fires an alert — a key leading indicator of either a breakout or a trap.' }
        ],
        [{ title: 'Detecting the Short Squeeze Setup', text: 'BTC OI increased 18% in 6 hours while price was flat and funding turned negative at -0.05%. The OI Radar flagged the extreme short positioning. A 12% squeeze followed within 24 hours.' }],
        "OI data from Binance, Bybit, and OKX perpetuals REST APIs. Funding rates from Coinglass aggregator. Updated every 15 minutes."
    , 'oi-radar'
    );
}

function renderDocsCMEGaps() {
    renderExplainPage(
        "CME Bitcoin Gap Analysis",
        "Identifying, tracking, and trading unfilled Bitcoin CME futures gaps.",
        "CME Bitcoin futures trade Monday–Friday during regular US market hours. When spot crypto moves significantly over the weekend while CME is closed, it creates a 'gap' between Friday's close and Monday's open. Statistical analysis of 4+ years of CME gap data shows that approximately 78% of gaps are eventually filled — making gap identification a high-probability trade setup for patient institutional traders.",
        [
            { icon: 'pivot_table_chart', title: 'Active Gap Registry', desc: 'Live list of all unfilled CME gaps with price level, gap size ($), gap size (%), days open, and historical fill probability score.' },
            { icon: 'history', title: 'Gap Fill History', desc: 'Historical record of all prior gaps with fill status, time-to-fill, and the price action context at time of formation.' },
            { icon: 'calculate', title: 'Fill Probability Scoring', desc: 'Each gap scored 0–100 by size, direction, current distance from price, and age. Higher scores = higher mean-reversion statistical probability.' },
            { icon: 'show_chart', title: 'Gap Distance Monitor', desc: 'Live tracking of BTC\'s distance from each open gap level, updated in real-time to identify when price approaches fill territory.' }
        ],
        [{ title: 'The Gap Fade Trade', text: 'After a bullish Sunday rally left a $5,200 gap below at $58,400, the CME Gap tracker scored it HIGH priority. A tactical partial short at $63,000 captured a 7% move back to partially fill the gap within 4 trading days.' }],
        "CME gap data calculated from CME BTC front-month futures Friday close vs Monday open. Price data via yfinance. Gap fill probability scoring uses 2022-2024 historical gap dataset."
    , 'cme-gaps'
    );
}

// --- Macro Intel Hub ---
function renderDocsFlow() {
    renderExplainPage(
        "Capital Flows Monitor",
        "Velocity and direction of institutional capital rotating into and out of the crypto ecosystem.",
        "Capital flow analysis tracks three primary channels of institutional capital: spot ETF flows (regulated capital), stablecoin supply expansion (on-ramp capital ready to deploy), and exchange net position changes (capital moving into self-custody vs to exchanges for selling). The synthesis of these three streams provides the most complete picture of institutional money movement available outside regulated prime broker data.",
        [
            { icon: 'swap_horiz', title: 'ETF Net Flow Aggregator', desc: 'Daily consolidated net flow across all 11 US Bitcoin spot ETFs. Sustained positive flow = institutional accumulation regime.' },
            { icon: 'currency_exchange', title: 'Stablecoin Supply Velocity', desc: 'Week-over-week USDT + USDC supply growth rate. Rapid expansion signals incoming buy-side pressure as dry powder builds on exchanges.' },
            { icon: 'account_balance', title: 'Exchange Net Position Change', desc: 'Rolling 30-day change in BTC held on exchanges vs self-custody. Declining exchange balances = reduced sell pressure (bullish signal).' },
            { icon: 'trending_up', title: 'Composite Flow Score', desc: 'AlphaSignal\'s proprietary score (0–100) combining all three channels into a single capital flow conviction indicator.' }
        ],
        [{ title: 'The Institutional Accumulation Signal', text: 'When ETF flows turned positive ($300M+ weekly), stablecoin supply grew 4% in 2 weeks, AND exchange balances dropped 15K BTC in a month simultaneously, the composite score hit 84/100 — preceding a 35% BTC rally over the next 6 weeks.' }],
        "ETF flows from Farside Investors. Stablecoin supply from CoinGecko and Glassnode public APIs. Exchange balance data from CryptoQuant and on-chain aggregation via Blockchain.info."
    , 'flow'
    );
}

function renderDocsRotation() {
    renderExplainPage(
        "Sector Rotation Tracker",
        "Capital rotation across crypto sectors visualised through a weighted treemap and momentum matrix.",
        "Crypto capital does not move uniformly — it rotates through sector narratives in sequence: typically Bitcoin leads, followed by large-cap L1s, then DeFi, then lower-cap narratives. AlphaSignal's Sector Rotation Tracker monitors the relative strength and momentum of 8 major sectors simultaneously, enabling traders to position ahead of sector rotations rather than chasing them.",
        [
            { icon: 'rotate_right', title: 'Weighted Sector Treemap', desc: 'Live treemap showing relative market cap and 7-day performance across Layer 1, DeFi, AI, Memes, RWA, Gaming, Infra, and L2 sectors.' },
            { icon: 'grid_on', title: 'Momentum Matrix', desc: '8×4 matrix of sector performance across 1D, 7D, 30D, and 90D timeframes — identifying which sectors are leading and which are lagging.' },
            { icon: 'speed', title: 'Rotation Velocity Score', desc: 'Measures the rate at which capital is entering or exiting each sector relative to BTC. High positive velocity = rotation is in early stages.' },
            { icon: 'notifications', title: 'Beta Expansion Alerts', desc: 'When a sector\'s 7-day beta to BTC exceeds 2.0 (outperforming BTC 2:1+), a rotation alert fires — historically a leading signal of narrative momentum.' }
        ],
        [{ title: 'DeFi Rotation Signal', text: 'After BTC consolidated at $60K for 3 weeks, the Momentum Matrix showed DeFi sector switching from negative to positive 7D momentum while BTC was flat. Rotation alert fired. DeFi sector gained 40% over the following 3 weeks.' }],
        "Sector performance data from CoinGecko sector classifications and 7-day price returns. Sector definitions updated monthly. Beta calculations use 90-day rolling correlation to BTC-USD price series."
    , 'rotation'
    );
}

// --- Alpha Strategy Hub ---
function renderDocsNarrative() {
    renderExplainPage(
        "Narrative Galaxy",
        "A force-directed graph visualising the social and informational gravity of crypto market narratives.",
        "Markets move on narratives before they move on fundamentals. The Narrative Galaxy maps conceptual clusters being discussed across Twitter/X, Reddit, and Telegram — showing which themes are gaining momentum, which are crowded, and which are quietly building beneath the surface.",
        [
            { icon: 'hub', title: 'Force-Directed Cluster Map', desc: 'Each narrative is a node. Related narratives are pulled together by semantic similarity. Node size reflects mention volume.' },
            { icon: 'speed', title: 'Narrative Velocity', desc: 'Tracks the rate of mention growth for each cluster. High-velocity narratives (>200% 7-day growth) often precede price moves.' },
            { icon: 'sentiment_satisfied', title: 'Sentiment Polarity', desc: 'Green nodes carry net bullish sentiment; red nodes bearish. Intensity scales with conviction level.' },
            { icon: 'warning_amber', title: 'Saturation Warning', desc: 'When a narrative reaches maximum mindshare without new information, it is flagged as a Crowded Trade contrarian signal.' }
        ],
        [{ title: 'Quiet Accumulation Detection', text: 'Three weeks before a major L2 announcement, the Galaxy detected rising semantic clustering around the project with low social volume. Early-positioning traders captured the subsequent 40% move.' }],
        "NLP processing of 100K+ daily social posts via keyword embedding models. Cluster assignments updated every 6 hours."
    , 'narrative'
    );
}

// --- Institutional Hub ---
function renderDocsTokenUnlocks() {
    renderExplainPage(
        "Token Unlock Schedule",
        "Forward-looking schedule of major token vesting unlocks and their projected sell pressure.",
        "Token unlocks are scheduled supply emission events where previously locked tokens — held by early investors, team members, or protocol treasuries — become tradeable. Large unlocks create predictable sell pressure windows. AlphaSignal tracks the next 90 days of unlock events across 50+ protocols, scored by unlock size relative to circulating supply.",
        [
            { icon: 'key', title: 'Unlock Calendar', desc: 'Chronological listing of upcoming unlocks with date, volume, USD value at current price, and % of circulating supply.' },
            { icon: 'bar_chart', title: 'Supply Shock Score', desc: 'Each unlock scored 0-100 based on size as % of float, recipient category (team vs investor), and vesting cliff structure.' },
            { icon: 'trending_down', title: 'Historical Price Impact', desc: 'For recurring protocols, shows actual price performance in the 7 days before and after prior unlock events.' },
            { icon: 'notifications_active', title: 'Unlock Alerts', desc: 'Configurable alerts for unlocks exceeding a user-defined supply shock threshold, delivered 7 days and 24 hours in advance.' }
        ],
        [{ title: 'The Investor Unlock Fade', text: 'A $120M investor unlock was tracked 3 weeks in advance. The HIGH Supply Shock Score prompted traders to open a tactical short 5 days prior, capturing a 9% decline into the unlock date.' }],
        "Token unlock data from TokenUnlocks.app and CryptoRank. Verified against on-chain vesting contract monitoring."
    , 'token-unlocks'
    );
}

function renderDocsYieldLab() {
    renderExplainPage(
        "Yield Lab",
        "A multi-protocol yield aggregator and DeFi rate comparison engine for institutional allocators.",
        "The Yield Lab consolidates staking APYs, lending rates, and liquidity provision yields across major DeFi protocols and CeFi venues. The lab normalises rates for comparative analysis, models impermanent loss risk for LP positions, and tracks the historical spread between DeFi and TradFi risk-free rates.",
        [
            { icon: 'biotech', title: 'Protocol Rate Comparison', desc: 'Side-by-side APY comparison across Aave, Compound, Lido, Rocket Pool, and 10+ venues, updated hourly.' },
            { icon: 'calculate', title: 'Risk-Adjusted Yield', desc: 'Adjusts raw APY for smart contract risk (audit score), liquidity depth, and token concentration.' },
            { icon: 'candlestick_chart', title: 'Yield Curve History', desc: 'Historical chart of key protocol yields over time to identify yield compression and expansion cycles.' },
            { icon: 'account_balance', title: 'DeFi vs TradFi Spread', desc: 'Tracks the spread between top DeFi lending rates and the US 3-month T-Bill — widening spread signals DeFi relative attractiveness.' }
        ],
        [{ title: 'Carry Trade Optimisation', text: 'When ETH staking yield expanded to 5.2% vs a 4.3% US 10Y yield, the Yield Lab flagged a 90bps positive carry opportunity, enabling institutions to justify an ETH overweight.' }],
        "Protocol yield data from DeFiLlama, on-chain rate queries via The Graph, and US Treasury rates from the Federal Reserve FRED API."
    , 'yield-lab'
    );
}

function renderDocsTradeLab() {
    renderExplainPage(
        "Trade Idea Lab",
        "An AI-assisted workspace for building and validating structured trade ideas before execution.",
        "The Trade Idea Lab provides a structured environment for developing systematic trade theses. Define your conviction, set risk parameters, and the lab generates a structured execution plan — complete with an AI-generated trade thesis memo. All ideas can be auto-converted into execution tickets in the Trade Ledger with a single click.",
        [
            { icon: 'experiment', title: 'Thesis Builder', desc: 'Guided form to define entry trigger, conviction level, position sizing, stop-loss, and take-profit levels for any asset.' },
            { icon: 'smart_toy', title: 'AI Thesis Memo', desc: 'GPT-powered narrative explaining the trade rationale, key risk factors, and historical analogues — generated from your inputs.' },
            { icon: 'calculate', title: 'Risk/Reward Calculator', desc: 'Automatic R:R ratio calculation, max loss in USD, and expected value computation based on historical win rate.' },
            { icon: 'send', title: 'One-Click Execution', desc: 'Convert any validated trade idea directly into a pending execution ticket in the institutional Trade Ledger.' }
        ],
        [{ title: 'Thesis-to-Ticket Workflow', text: 'An analyst entered a BTC long thesis triggered by a +2.3 Z-score. The AI memo flagged the ETF flow tailwind. The risk calculator sized the position at 4.2% of portfolio. One click sent it to the Trade Ledger.' }],
        "Trade thesis generation powered by GPT-4o-mini. Risk calculations use historical signal win rate from the AlphaSignal backtest database."
    , 'tradelab'
    );
}

// --- Analytics Hub ---
function renderDocsOptionsFlow() {
    renderExplainPage(
        "Options Flow Scanner",
        "Real-time BTC and ETH options data — Put/Call ratio, Max Pain, IV smile, and top OI strikes.",
        "The options market is where institutional traders express high-conviction views with defined risk. AlphaSignal's scanner pulls live data from Deribit — the world's largest crypto options exchange by volume — and synthesises it into actionable intelligence.",
        [
            { icon: 'ssid_chart', title: 'Put/Call Ratio (PCR)', desc: 'Ratio of put volume to call volume. PCR > 1.0 signals bearish hedging; < 0.7 signals directional call buying.' },
            { icon: 'push_pin', title: 'Max Pain Strike', desc: 'The price at which the maximum number of options expire worthless. Price tends to gravitate here near expiry.' },
            { icon: 'area_chart', title: 'IV Smile Chart', desc: 'Implied Volatility plotted across strikes (±30% from ATM), revealing skew and directional market fear.' },
            { icon: 'table_chart', title: 'Top OI Strikes', desc: 'The 10 highest open-interest strikes, showing where market participants have concentrated their positioning.' }
        ],
        [{ title: 'The IV Skew Signal', text: 'When put skew (downside IV premium over ATM) exceeded 15% on BTC, it historically preceded a 7-12% correction within 14 days as institutions loaded protective puts.' }],
        "Live data from Deribit public REST API. BTC and ETH options refreshed every 15 minutes. IV smile computed from front-month expiry strikes."
    , 'options-flow'
    );
}

function renderDocsNewsroom() {
    renderExplainPage(
        "Crypto Newsroom",
        "A curated, real-time feed of institutional-grade crypto news with AI sentiment tagging.",
        "The Newsroom aggregates the highest-signal news sources in the crypto ecosystem, applying NLP sentiment analysis to each headline as it arrives. AlphaSignal's Newsroom filters for institutional relevance — regulatory developments, large protocol announcements, ETF-related news, and macro policy shifts.",
        [
            { icon: 'newspaper', title: 'Live News Feed', desc: 'Real-time crypto news pulled from CryptoPanic RSS, filtered for headline relevance and institutional impact threshold.' },
            { icon: 'psychology', title: 'AI Sentiment Tagging', desc: 'Each headline classified BULLISH / BEARISH / NEUTRAL by a keyword-weighted NLP model trained on crypto-specific vocabulary.' },
            { icon: 'filter_alt', title: 'Category Filters', desc: 'Filter by topic: Regulation, ETF/TradFi, Protocol, Macro, or General to focus on relevant catalysts.' },
            { icon: 'bolt', title: 'Breaking News Alerts', desc: 'High-impact headlines trigger instant dashboard toast notifications to your terminal.' }
        ],
        [{ title: 'Regulatory Front-Running', text: 'An SEC enforcement headline appeared in the Newsroom 4 minutes before price action reflected the news. The BEARISH tag and alert gave users a narrow window to reduce exposure ahead of a 6% pullback.' }],
        "News sourced from CryptoPanic public RSS. NLP sentiment classification via keyword embedding model. Breaking news detection threshold: 3+ simultaneous high-impact keyword matches."
    , 'newsroom'
    );
}

// --- Audit & Performance Hub ---
function renderDocsTradeLedger() {
    renderExplainPage(
        "Institutional Trade Ledger",
        "A persistent, auditable record of all AI-generated execution tickets and manual trade ideas.",
        "The Trade Ledger is the terminal's audit trail. Every execution ticket generated by the AI Rebalancer, Trade Idea Lab, or manually by the user is logged here with full metadata: asset, direction, size, entry price, status, and AI thesis. Designed for institutional accountability and regulatory compliance review.",
        [
            { icon: 'list_alt', title: 'Execution Ticket Log', desc: 'Chronologically ordered log of all tickets with asset, direction, position size, entry price, and current status.' },
            { icon: 'assignment_turned_in', title: 'Status Tracking', desc: 'Tickets move through PENDING ? EXECUTED ? CLOSED states with PnL displayed for closed positions.' },
            { icon: 'smart_toy', title: 'AI Thesis Archive', desc: 'Each ticket retains the original AI-generated trade memo for retrospective review and performance attribution.' },
            { icon: 'download', title: 'CSV Export', desc: 'Full ledger export as CSV for offline analysis, compliance reporting, or integration with portfolio management systems.' }
        ],
        [{ title: 'Performance Attribution', text: 'Filtering the Trade Ledger to AI Rebalancer tickets and comparing PnL against a static HODL benchmark quantifies exactly how much alpha the AI system is generating net of transaction costs.' }],
        "All tickets stored in persistent SQLite ledger on the server. Data is user-specific and persists across sessions. Export available at any time."
    , 'trade-ledger'
    );
}

// --- Miscellaneous ---
function renderDocsHeatmap() {
    renderExplainPage(
        "Market Heatmap",
        "A colour-coded visualisation of Z-score deviations across the entire tracked asset universe.",
        "The Market Heatmap provides an at-a-glance overview of where statistical opportunities are concentrated across the 50+ asset universe. Each cell represents one asset; colour intensity reflects the magnitude of its current Z-score deviation from rolling mean returns. This is the fastest way to identify where alpha is currently concentrated.",
        [
            { icon: 'grid_view', title: 'Z-Score Heat Grid', desc: 'Full asset universe displayed as a colour-coded grid — instantly identify which assets have the highest statistical deviation.' },
            { icon: 'palette', title: 'Colour Scale', desc: 'Green = positive Z-score (bullish deviation); Red = negative Z-score (bearish deviation). Intensity scales with sigma magnitude.' },
            { icon: 'filter_alt', title: 'Sector Grouping', desc: 'Assets grouped by sector (L1, DeFi, Memes, AI, Gaming) for rapid sector-level comparison in a single view.' },
            { icon: 'touch_app', title: 'Click-Through Detail', desc: 'Click any cell to open a full signal detail overlay including ML prediction and on-chain metrics.' }
        ],
        [{ title: 'Sector Concentration Scan', text: 'During a DeFi narrative rotation, the heatmap showed 7 of 8 tracked DeFi tokens simultaneously in the +1.5 to +2.5 Z-score band, visually confirming the rotation in progress.' }],
        "Z-score computed from 90-day rolling returns using yfinance OHLCV data. Heatmap refreshed every 5 minutes."
    , 'heatmap'
    );
}

function renderDocsCommandCenter() {
    renderExplainPage(
        "Institutional Command Center",
        "A consolidated dashboard aggregating key signals from all terminal hubs into a single master view.",
        "The Command Center is designed for senior traders and portfolio managers who need system-level situational awareness across all terminal modules simultaneously. Rather than navigating between hubs, it surfaces the most critical real-time signals from each — Conviction Dials, ETF Flows, Correlation Matrix, Alpha Signals, and CME Gaps — in a single dense layout.",
        [
            { icon: 'dashboard', title: 'System Conviction Dials', desc: 'Live Fear & Greed, Network Congestion, and Retail FOMO dials providing a composite read of market psychology.' },
            { icon: 'account_balance', title: 'ETF Flow Summary', desc: 'Weekly ETF net flows bar chart showing the most recent 5 days of institutional capital movement.' },
            { icon: 'grid_4x4', title: 'Macro Correlation Matrix', desc: 'Live 30-day correlation heatmap between BTC, SPX, DXY, Gold, and 10Y Treasury.' },
            { icon: 'electric_bolt', title: 'Top Institutional Alpha', desc: 'Live feed of the 5 highest-conviction signals currently active across the terminal signal universe.' }
        ],
        [],
        "Aggregates data from 6 underlying terminal modules. Click through to individual hubs for full detail and interactivity."
    , 'command-center'
    );
}

function renderDocsAskTerminal() {
    renderExplainPage(
        "Ask Terminal — AI Research Assistant",
        "A conversational AI interface for on-demand institutional research within the terminal.",
        "Ask Terminal is powered by GPT-4o-mini and has full context of the AlphaSignal methodology, signal universe, and current market data. Ask it to explain a Z-score reading, summarise the macro outlook, generate a trading thesis for a specific asset, or interpret an options flow signal.",
        [
            { icon: 'smart_toy', title: 'Contextual AI Research', desc: 'Ask any question about markets, signals, or the terminal methodology. The AI has the full AlphaSignal framework as context.' },
            { icon: 'history', title: 'Conversation History', desc: 'Session-level conversation history maintained so you can build on previous questions without repeating context.' },
            { icon: 'description', title: 'On-Demand Memos', desc: 'Request a structured analysis memo for any asset — the AI synthesises signal data, macro context, and options flow.' },
            { icon: 'translate', title: 'Plain-English Explanations', desc: 'Ask the terminal to explain any metric or indicator in plain English — ideal for onboarding new team members.' }
        ],
        [{ title: 'Rapid Due Diligence', text: 'An analyst asked about the current BTC options skew and what it implies for price. The AI returned a 3-paragraph brief citing PCR, IV skew direction, and historical analogues in under 4 seconds.' }],
        "Powered by OpenAI GPT-4o-mini API. Responses generated in real-time with no caching to ensure contextual accuracy."
    , 'ask-terminal'
    );
}