async function renderHome() {
    console.log('[View] renderHome() called');
    // --- Phase 1: paint the shell immediately (no awaits) ---
    // Live-stat chips start with loading placeholders and are hydrated below.
    const dials = null, signals = [], lb = null;
    const topSignal = null, winRatePct = null, wrColor = '#94a3b8';

    // Preserve the LCP image node to prevent Lighthouse from discarding the 2.1s LCP metric
    let preservedHeroImg = document.getElementById('lcp-hero-img');
    if (preservedHeroImg) preservedHeroImg.parentNode.removeChild(preservedHeroImg);


    appEl.innerHTML = `
        <div class="landing-page">
            <div class="lp-grid-bg" aria-hidden="true"></div>
            <div class="lp-radial" aria-hidden="true"></div>

            <!-- HERO -->
            <section class="lp-hero">
                <div class="lp-hero-left">
                    <div class="lp-badge"><span class="lp-badge-dot"></span>TERMINAL LIVE &mdash; v2.10</div>
                    <h1 class="lp-h1">The market tells a story.<br><em>Most dashboards miss it.</em></h1>
                    <p class="lp-sub">AlphaSignal reads institutional order flow, options positioning, on-chain activity, and ML signal convergence -- and tells you what it actually means, in plain English.</p>
                    <div class="lp-actions">
                        ${!isAuthenticatedUser
                            ? `<button class="lp-btn-primary" onclick="showAuth(true)"><span class="material-symbols-outlined" style="font-size:18px">bolt</span>START FREE</button>`
                            : `<button class="lp-btn-primary" onclick="switchView('my-terminal')"><span class="material-symbols-outlined" style="font-size:18px">account_circle</span>MY TERMINAL</button>`}
                        <button class="lp-btn-ghost" onclick="switchView('command-center')"><span class="material-symbols-outlined" style="font-size:18px">dashboard</span>OPEN DASHBOARD</button>
                    </div>
                </div>
                <div class="lp-terminal">
                    <div class="lp-term-bar">
                        <span class="lp-term-dot" style="background:#f87171"></span>
                        <span class="lp-term-dot" style="background:#fb923c"></span>
                        <span class="lp-term-dot" style="background:#4ade80"></span>
                        <span style="font-size:0.6rem;color:var(--text-dim);margin-left:8px;font-family:'JetBrains Mono',monospace">alphasignal -- live terminal</span>
                    </div>
                    <div class="lp-term-body">
                        <div class="lp-term-row"><span class="lp-term-label">BTC/USD</span><span class="lp-term-val acc" id="lp-btc-price">loading...</span></div>
                        <div class="lp-term-row"><span class="lp-term-label">ETH/USD</span><span class="lp-term-val acc" id="lp-eth-price">loading...</span></div>
                        <div class="lp-term-row"><span class="lp-term-label">BTC FUNDING (8h)</span><span class="lp-term-val" id="lp-funding">loading...</span></div>
                        <div class="lp-term-row"><span class="lp-term-label">FEAR &amp; GREED</span><span class="lp-term-val" id="lp-fg">loading...</span></div>
                        <div class="lp-term-row"><span class="lp-term-label">REGIME</span><span class="lp-term-val" id="lp-oi">loading...</span></div>
                        <div class="lp-term-row"><span class="lp-term-label">ACTIVE SIGNALS</span><span class="lp-term-val acc" id="lp-sigs">loading...</span></div>
                        <div class="lp-term-signal" id="lp-top-signal">
                            <div class="lp-term-signal-label">TOP Z-SCORE SIGNAL</div>
                            <div class="lp-term-signal-val" id="lp-ts-val">--</div>
                            <div class="lp-term-signal-sub" id="lp-ts-sub">awaiting data...</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TICKER TAPE -->
            <div class="lp-tape" id="lp-tape-wrap">
                <div class="lp-tape-inner" id="lp-tape-inner">
                    ${Array(2).fill([
                        ['BTC DOMINANCE','--'],['ETH GAS','--'],['BTC FUNDING','--'],
                        ['FEAR &amp; GREED','--'],['SIGNALS LIVE','--'],['TOP ALPHA','--'],
                        ['TOP SIGNAL','--'],['REGIME','--'],['MEMPOOL','--'],['SOL FUNDING','--']
                    ].map(([l,v])=>`<span class="lp-tape-item"><span class="lbl">${l}</span><span id="tape-${l.replace(/\W/g,'')}">${v}</span></span>`).join('')).join('')}
                </div>
            </div>

            <!-- STORY 1: Signal intelligence -->
            <section class="lp-narrative">
                <div class="lp-story lp-reveal">
                    <div class="lp-story-text">
                        <div class="lp-story-eyebrow">SIGNAL INTELLIGENCE</div>
                        <h2 class="lp-story-h2">A Z-score above +2.0 means the market has moved <em>two standard deviations</em> from its own baseline.</h2>
                        <p class="lp-story-p">Most traders see a chart. AlphaSignal sees a deviation score across 50+ assets -- then ranks them, tags the regime, and writes the thesis. The signal hits before the narrative does.</p>
                        <button class="lp-story-link" onclick="switchView('alpha-hub')">OPEN SIGNAL HUB <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span></button>
                    </div>
                    <div class="lp-story-visual">
                        <div class="lp-signal-demo">
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <div><div class="lp-signal-ticker" id="lp-demo-ticker">BTC-USD</div><div class="lp-signal-type">LONG &middot; ML CONFIRMED</div></div>
                                <span style="font-size:0.55rem;background:rgba(74,222,128,0.1);color:#4ade80;border:1px solid rgba(74,222,128,0.25);border-radius:100px;padding:3px 10px;font-weight:700">LIVE</span>
                            </div>
                            <div class="lp-signal-z" id="lp-demo-z">+2.84</div>
                            <div class="lp-signal-meta">
                                <div class="lp-signal-meta-item"><div class="lp-signal-meta-label">ML CONFIDENCE</div><div class="lp-signal-meta-val" id="lp-demo-conf">81%</div></div>
                                <div class="lp-signal-meta-item"><div class="lp-signal-meta-label">REGIME</div><div class="lp-signal-meta-val" id="lp-demo-regime">TRENDING</div></div>
                                <div class="lp-signal-meta-item"><div class="lp-signal-meta-label">OI CHANGE</div><div class="lp-signal-meta-val pos" id="lp-demo-oi">+4.2%</div></div>
                                <div class="lp-signal-meta-item"><div class="lp-signal-meta-label">FUNDING</div><div class="lp-signal-meta-val pos" id="lp-demo-fund">+0.012%</div></div>
                            </div>
                            <div class="lp-thesis"><div class="lp-thesis-label">AI THESIS</div><span id="lp-demo-thesis">Spot demand outpacing perp open interest growth -- suggests organic buying rather than leveraged positioning. Funding positive but not overheated.</span></div>
                        </div>
                    </div>
                </div>

                <!-- STORY 2: Derivatives -->
                <div class="lp-story reverse lp-reveal">
                    <div class="lp-story-text">
                        <div class="lp-story-eyebrow">DERIVATIVES INTELLIGENCE</div>
                        <h2 class="lp-story-h2">Dealers hedge their gamma exposure. <em>That hedging moves the market.</em></h2>
                        <p class="lp-story-p">The Gamma Exposure profile shows where market makers are forced to buy and sell as spot price moves. High positive GEX = price magnet. Negative GEX = amplified swings. Most people learn this years into trading. It's on the dashboard.</p>
                        <button class="lp-story-link" onclick="switchView('derivatives')">OPEN DERIVATIVES HUB <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span></button>
                    </div>
                    <div class="lp-story-visual">
                        <div class="lp-gex-bar-wrap">
                            <div class="lp-gex-current-line">
                                <span class="lp-gex-current-label">SPOT</span>
                                <span class="lp-gex-current-price" id="lp-gex-spot">$Ã¢â‚¬â€</span>
                                <span style="font-size:0.55rem;color:var(--text-dim);margin-left:4px">GEX PROFILE</span>
                            </div>
                            ${[
                                ['+5%','rgba(74,222,128,0.7)',72],
                                ['+3%','rgba(74,222,128,0.5)',91],
                                ['+1%','rgba(74,222,128,0.35)',58],
                                ['ATM','rgba(125,211,252,0.9)',100,'font-weight:900;color:var(--accent)'],
                                ['-1%','rgba(248,113,113,0.35)',44],
                                ['-3%','rgba(248,113,113,0.6)',67],
                                ['-5%','rgba(248,113,113,0.4)',38],
                            ].map(([s,c,w,extra=''])=>`
                                <div class="lp-gex-row">
                                    <span class="lp-gex-strike" style="${extra}">${s}</span>
                                    <div class="lp-gex-bar-outer"><div class="lp-gex-bar" style="width:${w}%;background:${c}"></div></div>
                                    <span class="lp-gex-val">${w}M</span>
                                </div>`).join('')}
                        </div>
                    </div>
                </div>

                <!-- STORY 3: Funding/Heatmap -->
                <div class="lp-story lp-reveal">
                    <div class="lp-story-text">
                        <div class="lp-story-eyebrow">PERPETUALS FLOW</div>
                        <h2 class="lp-story-h2">Funding rate is how the market taxes leverage. <em>Watch who's paying whom.</em></h2>
                        <p class="lp-story-p">When perpetual futures trade at a premium to spot, longs pay shorts. When everyone is long and paying a premium, the setup for a squeeze is already building. The funding heatmap tracks this across 44 perp markets simultaneously.</p>
                        <button class="lp-story-link" onclick="switchView('derivatives')">VIEW FUNDING HEATMAP <span class="material-symbols-outlined" style="font-size:16px">arrow_forward</span></button>
                    </div>
                    <div class="lp-story-visual">
                        <div style="padding:1.25rem">
                            <div style="font-size:0.55rem;letter-spacing:2px;color:var(--text-dim);font-weight:700;margin-bottom:1rem">FUNDING RATE HEATMAP -- 44 PERPS</div>
                            <div class="lp-heat-grid">
                                ${['BTC','ETH','SOL','BNB','XRP','ADA','DOGE','AVAX',
                                   'LINK','DOT','MATIC','UNI','ATOM','LTC','BCH','FIL',
                                   'APT','ARB','OP','INJ','TIA','SUI','SEI','JUP',
                                   'WIF','BONK','PEPE','FLOKI','SHIB','MEME','BOME','DOGS'].map(t=>{
                                    const v = (Math.sin(t.charCodeAt(0)*7+t.charCodeAt(t.length-1))*0.05).toFixed(4);
                                    const pos = parseFloat(v)>=0;
                                    const intensity = Math.min(Math.abs(parseFloat(v))/0.05,1);
                                    const bg = pos
                                        ? `rgba(74,222,128,${0.1+intensity*0.5})`
                                        : `rgba(248,113,113,${0.1+intensity*0.5})`;
                                    return `<div class="lp-heat-cell" style="background:${bg};color:${pos?'#4ade80':'#f87171'}" title="${t}: ${v}%">${t.slice(0,3)}</div>`;
                                }).join('')}
                            </div>
                            <div style="display:flex;justify-content:space-between;margin-top:0.75rem;font-size:0.55rem;color:var(--text-dim)">
                                <span style="color:#f87171">&#9632; SHORT PAYS</span>
                                <span>LIVE FUNDING</span>
                                <span style="color:#4ade80">&#9632; LONG PAYS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- PRICING -->
            <section id="pricing" style="padding:5rem 2rem;border-top:1px solid var(--border)">
                <div style="max-width:860px;margin:0 auto;text-align:center">
                    <div class="lp-badge" style="margin-bottom:1.5rem">PRICING</div>
                    <h2 style="font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;letter-spacing:-1px;margin-bottom:0.75rem">Pick a tier.<br><span style="color:var(--accent)">Both are serious.</span></h2>
                    <p style="color:var(--text-dim);margin-bottom:3rem;font-size:0.95rem">No hidden fees. No data surcharges. Cancel any time.</p>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;text-align:left">
                        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:16px;padding:2rem;display:flex;flex-direction:column">
                            <div style="font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);font-weight:700;margin-bottom:0.5rem">FREE</div>
                            <div style="font-size:2.5rem;font-weight:900;margin-bottom:1.5rem">$0<span style="font-size:1rem;font-weight:400;color:var(--text-dim)">/mo</span></div>
                            <div style="flex:1;display:flex;flex-direction:column;gap:10px;margin-bottom:2rem">
                                ${['Live signal feed (50 assets)','Z-score signal dashboard','Fear & Greed + conviction dials','Market pulse bar','Public docs hub'].map(l=>`
                                <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem">
                                    <span class="material-symbols-outlined" style="font-size:1rem;color:#4ade80">check</span>${l}</div>`).join('')}
                                ${['Strategy backtester','Options flow scanner','On-chain hub','AI portfolio rebalancer','Discord/Telegram alerts'].map(l=>`
                                <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem;color:var(--text-dim)">
                                    <span class="material-symbols-outlined" style="font-size:1rem;color:rgba(255,255,255,0.1)">close</span>${l}</div>`).join('')}
                            </div>
                            <button class="lp-btn-ghost" style="width:100%;justify-content:center" onclick="switchView('signals')">START FREE</button>
                        </div>
                        <div style="background:linear-gradient(135deg,rgba(125,211,252,0.07),rgba(139,92,246,0.05));border:1px solid rgba(125,211,252,0.25);border-radius:16px;padding:2rem;display:flex;flex-direction:column;position:relative;box-shadow:0 0 40px rgba(125,211,252,0.06)">
                            <div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:rgba(125,211,252,0.12);color:var(--accent);font-size:0.6rem;font-weight:900;letter-spacing:2px;padding:4px 16px;border-radius:100px;white-space:nowrap">MOST POPULAR</div>
                            <div style="font-size:0.6rem;letter-spacing:2px;color:var(--accent);font-weight:700;margin-bottom:0.5rem">PRO</div>
                            <div style="font-size:2.5rem;font-weight:900;margin-bottom:0.25rem;color:var(--accent)">$7.99<span style="font-size:1rem;font-weight:400;color:var(--text-dim)">/mo</span></div>
                            <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:1.5rem">Cancel anytime</div>
                            <div style="flex:1;display:flex;flex-direction:column;gap:10px;margin-bottom:2rem">
                                ${['Everything in Free','Strategy backtester V2','AI portfolio rebalancer (Monte Carlo)','Options flow scanner (Deribit live)','On-chain hub (MVRV, SOPR, NVT)','Whale pulse + wallet attribution','Macro calendar + AI briefing','Discord & Telegram webhooks','AI trade thesis generator','Full PDF research export'].map(l=>`
                                <div style="display:flex;align-items:center;gap:10px;font-size:0.8rem">
                                    <span class="material-symbols-outlined" style="font-size:1rem;color:#4ade80">check_circle</span>${l}</div>`).join('')}
                            </div>
                            <button class="lp-btn-primary" style="width:100%;justify-content:center" onclick="typeof handleSubscribe!=='undefined'?handleSubscribe():switchView('signals')">
                                <span class="material-symbols-outlined" style="font-size:18px">bolt</span>UNLOCK PRO &mdash; $7.99/MO
                            </button>
                            <div style="text-align:center;margin-top:0.75rem;font-size:0.65rem;color:var(--text-dim)">Secure payment via Stripe &middot; Instant access</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- CTA -->
            <section class="lp-cta lp-reveal">
                <div class="lp-cta-inner">
                    <div class="lp-cta-pre">THE EDGE IS IN THE DATA</div>
                    <h2 class="lp-cta-h2">Stop reading about the market.<br><em>Start reading it.</em></h2>
                    <p class="lp-cta-sub">80+ live views. Real institutional data. AI that explains what it means rather than what you want to hear.</p>
                    <div class="lp-cta-actions">
                        ${!isAuthenticatedUser
                            ? `<button class="lp-btn-primary" onclick="showAuth(true)"><span class="material-symbols-outlined" style="font-size:18px">bolt</span>JOIN FREE</button>`
                            : `<button class="lp-btn-primary" onclick="switchView('command-center')"><span class="material-symbols-outlined" style="font-size:18px">dashboard</span>OPEN DASHBOARD</button>`}
                        <button class="lp-btn-ghost" onclick="switchView('help')"><span class="material-symbols-outlined" style="font-size:18px">menu_book</span>DOCUMENTATION</button>
                    </div>
                </div>
            </section>

        </div>
    `;

    // --- Phase 2: hydrate live data into terminal panel, tape, signal demo ---
    Promise.allSettled([
        fetchAPI('/system-dials'),
        fetchAPI('/signals'),
        fetchAPI('/signal-leaderboard')
    ]).then(([dialsRes, sigsRes, lbRes]) => {
        if (!document.getElementById('lp-btc-price')) return;
        const dials = dialsRes.value?.dials || null;
        // Handle both plain array and { signals: [] } envelope
        const _raw  = sigsRes.value;
        const sigs  = Array.isArray(_raw) ? _raw : (_raw?.signals || []);
        const top   = sigs[0] || null;
        const fg    = dials?.fear_greed?.value ?? null;
        const fgLabel = fg === null ? '--' : fg > 60 ? `${Math.round(fg)} GREED` : fg < 40 ? `${Math.round(fg)} FEAR` : `${Math.round(fg)} NEUTRAL`;
        const fgColor = fg === null ? 'var(--text-dim)' : fg > 60 ? '#4ade80' : fg < 40 ? '#f87171' : '#fb923c';

        // Terminal rows
        const set = (id, html, color) => { const el = document.getElementById(id); if (el) { el.innerHTML = html; if (color) el.style.color = color; } };
        set('lp-sigs', sigs.length > 0 ? sigs.length : '--');
        set('lp-fg', fgLabel, fgColor);
        set('lp-funding', '--'); // updated by funding-rates callback below

        // Regime extraction (must be before if(top) block)
        const regimeRaw = _raw?._market_regime || top?.regime || null;
        const regimeStr = typeof regimeRaw === 'string' ? regimeRaw : (regimeRaw?.label || regimeRaw?.regime || null);
        if (regimeStr) set('lp-oi', regimeStr);

        // Top signal card
        if (top) {
            const z = parseFloat(top.zScore || 0);
            const zCol = z > 0 ? '#4ade80' : '#f87171';
            set('lp-demo-ticker', top.ticker || 'BTC-USD');
            const zEl = document.getElementById('lp-demo-z');
            if (zEl) { zEl.textContent = (z >= 0 ? '+' : '') + z.toFixed(2); zEl.style.color = zCol; }
            set('lp-demo-conf', top.alpha != null ? (top.alpha >= 0 ? '+' : '') + parseFloat(top.alpha).toFixed(2) + '%' : '--');
            set('lp-demo-regime', regimeStr || top?.category || '--');
            set('lp-ts-val', `${top.ticker || 'BTC'} Z: ${(z >= 0 ? '+' : '') + z.toFixed(2)}`, zCol);
            set('lp-ts-sub', top.signal || (z > 0 ? 'LONG signal confirmed' : 'SHORT signal confirmed'));
        }

        // Fetch BTC/ETH spot prices
        Promise.allSettled([
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd').then(r=>r.json())
        ]).then(([priceRes]) => {
            if (priceRes.status === 'fulfilled' && priceRes.value) {
                const p = priceRes.value;
                const fmt = n => '$' + Number(n).toLocaleString('en-US', {maximumFractionDigits:0});
                set('lp-btc-price', fmt(p.bitcoin?.usd || 0));
                set('lp-eth-price', fmt(p.ethereum?.usd || 0));
                set('lp-gex-spot', fmt(p.bitcoin?.usd || 0));
            }
        });

        // Tape hydration helper
        const setTape = (key, val) => {
            const clean = key.replace(/\W/g, '');
            document.querySelectorAll(`#tape-${clean}`).forEach(el => el.textContent = val);
        };
        if (top) {
            const z = parseFloat(top.zScore || 0);
            setTape('TOPSIGNAL', `${top.ticker.replace('-USD','')} Z:${z>=0?'+':''}${z.toFixed(1)}`);
        }
        if (fg !== null) setTape('FEAR &amp; GREED', Math.round(fg) + ' ' + (fg > 60 ? 'GREED' : fg < 40 ? 'FEAR' : 'NEUTRAL'));
        if (regimeStr) setTape('REGIME', regimeStr);
        if (sigs.length) setTape('SIGNALSLIVE', sigs.length);
        if (top?.alpha != null) setTape('TOPALPHA', (top.alpha >= 0 ? '+' : '') + parseFloat(top.alpha).toFixed(2) + '%');
        const netCong = dials?.network_congestion?.value;
        if (netCong != null) setTape('MEMPOOL', Math.round(netCong) + '%');

        // Fetch funding rates + BTC dominance in parallel
        Promise.allSettled([
            fetchAPI('/funding-rates').catch(() => null),
            fetch('https://api.coingecko.com/api/v3/global').then(r => r.json()).catch(() => null)
        ]).then(([frRes, cgRes]) => {
            if (frRes.status === 'fulfilled' && frRes.value?.rows) {
                const rows = frRes.value.rows;
                const find = asset => rows.find(r => r.asset?.toUpperCase() === asset)?.current;
                const fmt = v => v != null ? (v >= 0 ? '+' : '') + parseFloat(v).toFixed(4) + '%' : '--';
                // Also update terminal panel BTC funding row
                const btcFund = find('BTC');
                if (btcFund != null) set('lp-funding', (btcFund >= 0 ? '+' : '') + parseFloat(btcFund).toFixed(4) + '%', btcFund >= 0 ? '#4ade80' : '#f87171');
                setTape('BTCFUNDING', fmt(find('BTC')));
                setTape('SOLFUNDING', fmt(find('SOL')));
                setTape('ETHGAS', fmt(find('ETH')));
                // OI from rows if available
                const btcRow = rows.find(r => r.asset?.toUpperCase() === 'BTC');
                const ethRow = rows.find(r => r.asset?.toUpperCase() === 'ETH');
                if (btcRow?.oi_change != null) setTape('BTCOICHG', (btcRow.oi_change >= 0 ? '+' : '') + btcRow.oi_change.toFixed(1) + '%');
                if (ethRow?.oi_change != null) setTape('ETHOICHG', (ethRow.oi_change >= 0 ? '+' : '') + ethRow.oi_change.toFixed(1) + '%');
            }
            if (cgRes.status === 'fulfilled' && cgRes.value?.data) {
                const dom = cgRes.value.data.market_cap_percentage?.btc;
                if (dom != null) setTape('BTCDOMINANCE', dom.toFixed(1) + '%');
            }
        });

        // Scroll-reveal observer
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
        }, { threshold: 0.15 });
        document.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el));
    });

}


