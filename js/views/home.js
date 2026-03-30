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
                        LIVE INSTITUTIONAL TERMINAL &mdash; v1.52
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

            <!-- ===== PRICING ===== -->
            <section id="pricing" style="padding:5rem 2rem;border-top:1px solid var(--border);background:rgba(0,0,0,0.2)">
                <div style="max-width:900px;margin:0 auto;text-align:center">
                    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.2);border-radius:100px;padding:4px 14px;margin-bottom:1rem;font-size:0.65rem;letter-spacing:2px;color:var(--accent)">SIMPLE PRICING</div>
                    <h2 style="font-size:2.2rem;font-weight:900;letter-spacing:-0.5px;margin-bottom:0.75rem">Institutional Intelligence.<br><span style="color:var(--accent)">One Flat Fee.</span></h2>
                    <p style="color:var(--text-dim);font-size:1rem;margin-bottom:3rem;max-width:500px;margin-left:auto;margin-right:auto">No seat fees. No data surcharges. Every hub, every signal, every AI feature — all included.</p>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;text-align:left">

                        <!-- FREE TIER -->
                        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:16px;padding:2rem;display:flex;flex-direction:column">
                            <div style="font-size:0.65rem;letter-spacing:2px;color:var(--text-dim);font-weight:700;margin-bottom:0.5rem">FREE</div>
                            <div style="font-size:2.5rem;font-weight:900;margin-bottom:0.25rem">$0<span style="font-size:1rem;font-weight:400;color:var(--text-dim)">/mo</span></div>
                            <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:2rem">No credit card required</div>
                            <div style="flex:1;display:flex;flex-direction:column;gap:12px;margin-bottom:2rem">
                                ${[
                                    ['check','Live Signal Feed (50 assets)'],
                                    ['check','Fear & Greed + Conviction Dials'],
                                    ['check','Basic Z-Score Signals'],
                                    ['check','Market Pulse Bar (BTC/ETH/SOL)'],
                                    ['check','Public Documentation Hub'],
                                    ['close','Strategy Backtester V2'],
                                    ['close','Options Flow Scanner'],
                                    ['close','On-Chain Intelligence Hub'],
                                    ['close','AI Portfolio Rebalancer'],
                                    ['close','Discord/Telegram Alerts'],
                                    ['close','Monte Carlo Simulator'],
                                ].map(([icon, label]) => `
                                <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem;color:${icon==='check'?'var(--text)':'var(--text-dim)'}">
                                    <span class="material-symbols-outlined" style="font-size:1rem;color:${icon==='check'?'var(--risk-low)':'rgba(255,255,255,0.2)'}">${icon}</span>
                                    ${label}
                                </div>`).join('')}
                            </div>
                            <button class="intel-action-btn" style="width:100%;background:rgba(255,255,255,0.04);border-color:var(--border);color:var(--text-dim)" onclick="switchView('signals')">
                                START FREE
                            </button>
                        </div>

                        <!-- PRO TIER -->
                        <div style="background:linear-gradient(135deg,rgba(0,242,255,0.07),rgba(188,19,254,0.05));border:2px solid rgba(0,242,255,0.4);border-radius:16px;padding:2rem;display:flex;flex-direction:column;position:relative;box-shadow:0 0 40px rgba(0,242,255,0.08)">
                            <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,var(--accent),#bc13fe);color:#000;font-size:0.6rem;font-weight:900;letter-spacing:2px;padding:4px 16px;border-radius:100px;white-space:nowrap">MOST POPULAR</div>
                            <div style="font-size:0.65rem;letter-spacing:2px;color:var(--accent);font-weight:700;margin-bottom:0.5rem">PRO</div>
                            <div style="font-size:2.5rem;font-weight:900;margin-bottom:0.25rem;color:var(--accent)">$7.99<span style="font-size:1rem;font-weight:400;color:var(--text-dim)">/mo</span></div>
                            <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:2rem">Cancel anytime · Billed monthly</div>
                            <div style="flex:1;display:flex;flex-direction:column;gap:12px;margin-bottom:2rem">
                                ${[
                                    'Everything in Free',
                                    'Strategy Backtester V2 (15 strategies)',
                                    'AI Portfolio Rebalancer (Monte Carlo)',
                                    'Options Flow Scanner (Deribit live)',
                                    'On-Chain Hub (MVRV, SOPR, NVT)',
                                    'Whale Pulse + Wallet Attribution',
                                    'Macro Calendar + AI Market Briefing',
                                    'Discord & Telegram Alert Webhooks',
                                    'AI Trade Thesis Generator',
                                    'Strategy Compare (all 15 strategies)',
                                    'Multi-Ticker Backtest Comparison',
                                    'Full PDF Research Report Export',
                                ].map(label => `
                                <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem;color:var(--text)">
                                    <span class="material-symbols-outlined" style="font-size:1rem;color:var(--risk-low)">check_circle</span>
                                    ${label}
                                </div>`).join('')}
                            </div>
                            <button class="intel-action-btn large" style="width:100%;background:linear-gradient(90deg,rgba(0,242,255,0.15),rgba(188,19,254,0.1));border-color:var(--accent);font-size:0.85rem" onclick="typeof handleSubscribe !== 'undefined' ? handleSubscribe() : switchView('signals')">
                                <span class="material-symbols-outlined" style="margin-right:8px">bolt</span>
                                UNLOCK PRO — $7.99/MO
                            </button>
                            <div style="text-align:center;margin-top:0.75rem;font-size:0.65rem;color:var(--text-dim)">Secure payment via Stripe · Instant access</div>
                        </div>

                    </div>

                    <!-- Reassurance bar -->
                    <div style="display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;margin-top:3rem">
                        ${[
                            ['lock','Bank-grade encryption'],
                            ['cancel','Cancel anytime'],
                            ['verified','No hidden fees'],
                            ['support_agent','Telegram support'],
                        ].map(([icon, label]) => `
                        <div style="display:flex;align-items:center;gap:8px;font-size:0.75rem;color:var(--text-dim)">
                            <span class="material-symbols-outlined" style="font-size:1rem;color:var(--accent)">${icon}</span>${label}
                        </div>`).join('')}
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
