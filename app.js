const API_BASE = '/api';
const appEl = document.getElementById('app-view');
let currentBTCPrice = 70000;
let alertCount = 0;
let countdownSeconds = 300;
let countdownInterval = null;
let isPremiumUser = false;
let isAuthenticatedUser = false;
let hasStripeId = false;

// ============= Core Utilities =============
async function fetchAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (res.status === 401) {
            // Only redirect to auth if not on a public-friendly view or if explicitly required
            // For now, let's keep it simple: if auth fails, show auth overlay
            showAuth(true);
            return null;
        }

        if (res.status === 402) {
            showPaywall(true);
            return null;
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (e) { 
        console.error('API Error:', e); 
        return null; 
    }
}

async function checkAuthStatus() {
    const status = await fetchAPI('/auth/status');
    if (status && status.authenticated) {
        isAuthenticatedUser = true;
        isPremiumUser = status.is_premium || false;
        hasStripeId = status.has_stripe_id || false;
        showAuth(false);
        
        // Populate New Profile Card
        const emailEl = document.getElementById('display-user-email');
        const initialsEl = document.getElementById('user-initials');
        if (status.email) {
            if (emailEl) emailEl.textContent = status.email;
            if (initialsEl) initialsEl.textContent = status.email.substring(0, 2).toUpperCase();
        }
        
        updatePremiumUI();
        return true;
    } else {
        isAuthenticatedUser = false;
        isPremiumUser = false;
        // Don't force auth immediately, allow viewing signals
        showAuth(false); 
        updatePremiumUI();
        return false;
    }
}

function updatePremiumUI() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const view = item.getAttribute('data-view');
        // Views that are ALWAYS free
        const isFreeView = (view === 'signals' || view === 'help' || view === 'home' || view?.startsWith('explain-'));
        
        if (isFreeView || isPremiumUser) {
            const lock = item.querySelector('.premium-lock');
            if (lock) lock.remove();
        } else {
            if (!item.querySelector('.premium-lock')) {
                const lock = document.createElement('span');
                lock.className = 'premium-lock material-symbols-outlined';
                lock.setAttribute('aria-label', 'Locked');
                lock.textContent = 'lock';
                item.appendChild(lock);
            }
        }
    });

    // Update Profile Card Tier & Actions
    const tierBadge = document.getElementById('user-tier-badge');
    const manageBtn = document.getElementById('manage-sub-btn');
    
    if (tierBadge) {
        if (isPremiumUser) {
            tierBadge.textContent = 'INSTITUTIONAL';
            tierBadge.className = 'tier-badge institutional';
            if (manageBtn) {
                if (hasStripeId) manageBtn.classList.remove('hidden');
                else manageBtn.classList.add('hidden');
            }
        } else {
            tierBadge.textContent = 'FREE TIER';
            tierBadge.className = 'tier-badge free';
            if (manageBtn) manageBtn.classList.add('hidden');
        }
    }
}

function showPaywall(visible) {
    const overlay = document.getElementById('paywall-overlay');
    if (visible) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showAuth(visible) {
    const overlay = document.getElementById('auth-overlay');
    const layout = document.querySelector('.layout');
    
    if (visible) {
        overlay.classList.remove('hidden');
        if (layout) {
            layout.classList.add('hidden');
            layout.style.filter = 'blur(10px)';
        }
    } else {
        overlay.classList.add('hidden');
        if (layout) {
            layout.classList.remove('hidden');
            layout.style.filter = 'none';
        }
    }
}

async function handleAuth(isSignup) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');

    if (!email || !password) {
        errorEl.textContent = "REQUIRED: Credentials missing.";
        errorEl.classList.remove('hidden');
        return false;
    }

    errorEl.classList.add('hidden');
    const endpoint = isSignup ? '/auth/signup' : '/auth/login';
    
    const res = await fetchAPI(endpoint, 'POST', { email, password });
    
    if (res && (res.success || res.access_token)) {
        if (isSignup) {
            errorEl.textContent = "SUCCESS: Check email for confirmation.";
            errorEl.classList.remove('hidden');
            errorEl.style.color = "var(--risk-low)";
        } else {
            showAuth(false);
            location.reload();
        }
        return true;
    } else {
        errorEl.textContent = res?.error || "ACCESS_DENIED: Invalid credentials.";
        errorEl.style.color = "var(--risk-high)";
        errorEl.classList.remove('hidden');
        return false;
    }
}

async function logout() {
    console.log("Logout initiated...");
    try {
        await fetchAPI('/auth/logout', 'POST');
        console.log("Logout API success, reloading...");
        location.reload(); 
    } catch (e) {
        console.error("Logout failed", e);
        showAuth(true); 
    }
}

async function handleSubscribe() {
    try {
        const config = await fetchAPI('/config');
        if (!config || !config.stripe_publishable_key) {
            throw new Error("Missing Stripe configuration on server.");
        }
        
        const stripe = Stripe(config.stripe_publishable_key);
        const session = await fetchAPI('/stripe/create-checkout-session', 'POST');
        if (!session || !session.id) {
            throw new Error(session?.error || "Could not create checkout session.");
        }
        
        const result = await stripe.redirectToCheckout({ sessionId: session.id });
        if (result.error) alert(result.error.message);
    } catch (e) {
        console.error("Subscription error:", e);
        alert(`SUBSCRIPTION_ERROR: ${e.message}`);
    }
}

async function manageSubscription() {
    console.log("Portal redirect initiated...");
    try {
        const res = await fetchAPI('/stripe/create-portal-session', 'POST');
        if (res && res.url) {
            window.location.href = res.url;
        } else {
            throw new Error(res?.error || "Could not generate portal session.");
        }
    } catch (e) {
        console.error("Portal error:", e);
        alert(`BILLING_ERROR: ${e.message}`);
    }
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownSeconds = 300;
    updateCountdownDisplay();
    
    countdownInterval = setInterval(() => {
        countdownSeconds--;
        if (countdownSeconds < 0) {
            clearInterval(countdownInterval);
            renderSignals();
            return;
        }
        updateCountdownDisplay();
    }, 1000);
}

function updateCountdownDisplay() {
    const el = document.getElementById('countdown-value');
    if (!el) return;
    const m = Math.floor(countdownSeconds / 60);
    const s = countdownSeconds % 60;
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

function updateScroller(signals) {
    const scroller = document.getElementById('alpha-scroller');
    if (!scroller || !signals || !signals.length) return;
    const content = signals.slice(0, 10).map(s => `
        <span style="color:${s.alpha >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}; margin-right:3rem; font-weight:700">
            ${s.ticker} ${s.alpha >= 0 ? '▲' : '▼'}${Math.abs(s.alpha).toFixed(2)}% ALPHA
        </span>
    `).join('');
    scroller.innerHTML = content + content; // Duplicate for smooth loop
}

function formatPrice(val) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function getSentimentLabel(score) {
    if (score > 0.1) return 'Bullish <span class="material-symbols-outlined" style="font-size: 16px; margin-left: 4px; vertical-align: middle;">trending_up</span>';
    if (score < -0.1) return 'Bearish <span class="material-symbols-outlined" style="font-size: 16px; margin-left: 4px; vertical-align: middle;">trending_down</span>';
    return 'Neutral <span class="material-symbols-outlined" style="font-size: 16px; margin-left: 4px; vertical-align: middle;">drag_handle</span>';
}

function getSentimentClass(score) {
    if (score > 0.1) return 'pos';
    if (score < -0.1) return 'neg';
    return 'dim';
}

function skeleton(count = 6) {
    return `<div class="skeleton-grid">${Array(count).fill('<div class="skeleton-card"><div class="sk-line sk-title"></div><div class="sk-line sk-text"></div><div class="sk-line sk-text short"></div><div class="sk-line sk-bar"></div></div>').join('')}</div>`;
}

function exportCSV(data, filename) {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
            const val = row[h];
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



// ============= AI Analyst =============
async function openAIAnalyst(ticker) {
    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-content');
    modal.classList.remove('hidden');
    content.innerHTML = '<div class="loader"></div><p style="text-align:center">Synthesizing multidimensional intelligence...</p>';
    
    const data = await fetchAPI(`/ai_analyst?ticker=${ticker}`);
    if (data) {
        content.innerHTML = `<div class="ai-report-box">${data.summary.replace(/\n/g, '<br>')}</div>`;
    }
}

// ============= Global Search Logic =============
async function executeSearch() {
    const input = document.getElementById('global-search');
    const ticker = input.value.trim().toUpperCase();
    if (!ticker) return;

    input.disabled = true;
    input.placeholder = "SYNCING WITH YFINANCE...";
    
    const data = await fetchAPI(`/search?ticker=${ticker}`);
    input.disabled = false;
    input.placeholder = "SEARCH TICKER (e.g. AAPL, TSLA, SOL-USD)...";
    
    if (data && !data.error) {
        input.value = '';
        openDetail(data.ticker, data.category, data.btcCorrelation, data.alpha, data.sentiment, '60d', data.isTracked);
    } else {
        alert(data?.error || "Institutional Fetch Failed");
    }
}


// ============= Signals View =============
let lastSignalsData = null;
let currentSignalCategory = 'ALL';

async function renderSignals(category = 'ALL') {
    currentSignalCategory = category;
    appEl.innerHTML = skeleton(8);
    const signals = await fetchAPI('/signals');
    if (!signals) {
        appEl.innerHTML = '<div class="error-msg">Fail to sync with intelligence streams. Check connection.</div>';
        return;
    }
    lastSignalsData = signals;
    updateScroller(signals);
    startCountdown(); // Reset timer on successful fetch

    const filtered = category === 'ALL' ? signals : signals.filter(s => s.category === category);
    const cats = ['ALL', 'EXCHANGE', 'PROXY', 'MINERS', 'ETF', 'DEFI', 'L1', 'STABLES', 'MEMES'];

    appEl.innerHTML = `
        <div class="view-header"><h1>Signal Intelligence Dashboard</h1></div>
        <div class="view-actions">
            <div class="category-filters">
                ${cats.map(c => `<button class="filter-btn ${category === c ? 'active' : ''}" onclick="renderSignals('${c}')">${c}</button>`).join('')}
            </div>
            <button class="export-btn" style="margin-left:auto" onclick="exportCSV(lastSignalsData,'alphasignal_signals.csv')">📥 Export CSV</button>
        </div>
        <div class="signal-grid">
            ${filtered.map(s => `
                <div class="signal-card ${Math.abs(s.zScore) > 2 ? 'z-outlier' : ''}" onclick="openDetail('${s.ticker}', '${s.category}', ${s.btcCorrelation}, ${s.alpha}, ${s.sentiment}, '60d', ${s.category === 'TRACKED'})">
                    <div class="ai-trigger" onclick="event.stopPropagation(); openAIAnalyst('${s.ticker}')"><span class="material-symbols-outlined" style="font-size: 18px;">smart_toy</span></div>
                    <div class="card-header">
                        <div>
                            <div class="ticker">${s.ticker}</div>
                            <div class="label-tag cat-${s.category.toLowerCase()}">${s.category}</div>
                        </div>
                        <div class="price-box" style="text-align:right">
                            <div style="font-weight:700">${formatPrice(s.price)}</div>
                            <div class="${s.change >= 0 ? 'pos' : 'neg'}">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</div>
                        </div>
                    </div>
                    <div class="delta-stat">
                        <div class="delta-label">BTC CORRELATION</div>
                        <div class="delta-value">${s.btcCorrelation.toFixed(2)}</div>
                    </div>
                    <div class="metrics">
                        <div class="metric-line"><span>Relative Alpha</span><span class="${s.alpha >= 0 ? 'pos' : 'neg'}">${s.alpha >= 0 ? '+' : ''}${s.alpha.toFixed(2)}%</span></div>
                        <div class="metric-line"><span>Sentiment</span><span class="${getSentimentClass(s.sentiment)}">${getSentimentLabel(s.sentiment)}</span></div>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

// ============= Miners View =============
async function renderMiners() {
    renderSignals('MINERS');
}

// ============= Pack G1: Flow Monitor =============
async function renderFlows() {
    appEl.innerHTML = skeleton(2);
    const data = await fetchAPI('/flows');
    if (!data) return;
    appEl.innerHTML = `
        <div class="view-header"><h1>Institutional Flow Monitor</h1></div>
        <div class="pulse-grid">
            <div class="pulse-card"><h3>Net ETF Inflow</h3><div class="big-val">$${data.netFlow}M</div><p>Aggregated spot volume</p></div>
            <div class="pulse-card"><h3>Sector Momentum</h3><div class="big-val ${data.sectorMomentum >= 0 ? 'pos' : 'neg'}">${data.sectorMomentum >= 0 ? '+' : ''}${data.sectorMomentum}%</div><p>Miner vs Proxy divergence</p></div>
        </div>
        <div class="whale-list" style="margin-top:2rem">
            ${data.etfFlows.map(f => `
                <div class="whale-row" style="grid-template-columns: 100px 100px 1fr">
                    <div class="w-amount ${f.direction === 'IN' ? 'pos' : 'neg'}">${f.amount}M</div>
                    <div class="label-tag">${f.ticker}</div>
                    <div style="color:var(--text-dim)">Spot Exposure ${f.direction}</div>
                </div>
            `).join('')}
        </div>`;
}

// ============= Heatmap View =============
async function renderHeatmap() {
    appEl.innerHTML = skeleton(4);
    const data = await fetchAPI('/heatmap');
    if (!data) return;
    
    appEl.innerHTML = `
        <div class="view-header">
            <h1>Statistical Intensity Heatmap</h1>
            <p>Visualizing real-time Z-score deviations across the institutional universe.</p>
        </div>
        
        <div class="heatmap-legend">
            <div class="legend-labels">
                <span class="neg">EXTREME BREAKDOWN (-3SD)</span>
                <span class="pos">EXTREME BREAKOUT (+3SD)</span>
            </div>
            <div class="legend-bar"></div>
        </div>

        <div class="heatmap-grid">
            ${data.map(sec => `
                <div class="heatmap-sector">
                    <h3>${sec.sector}</h3>
                    <div class="heatmap-assets">
                        ${sec.assets.map(a => {
                            const intensity = Math.min(Math.abs(a.zScore) / 3, 1);
                            const color = a.zScore >= 0 ? `rgba(0,255,136,${0.2 + intensity * 0.7})` : `rgba(255,62,62,${0.2 + intensity * 0.7})`;
                            // White text for intense backgrounds, dark for light
                            const textColor = intensity > 0.5 ? '#fff' : '#000';
                            const border = Math.abs(a.zScore) > 2.5 ? `1px solid ${a.zScore > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}` : '1px solid var(--border)';
                            
                            return `
                                <div class="heatmap-box" 
                                     onclick="openDetail('${a.ticker}', '${sec.sector}')"
                                     style="background: ${color}; border: ${border}; color: ${textColor};" 
                                     title="${a.ticker}: ${a.change > 0 ? '+' : ''}${a.change}% (Z=${a.zScore}, Div=${a.divergence})">
                                    ${a.ticker.split('-')[0]}
                                    ${Math.abs(a.divergence) > 0.5 ? `<div class="divergence-dot" title="Sentiment Divergence Detected: ${a.divergence}"></div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>`;
}

// ============= Detail Overlay =============
async function openDetail(ticker, category, correlation = 0, alpha = 0, sentiment = 0, period = '60d', isTracked = false) {
    const overlay = document.getElementById('detail-overlay');
    const body = document.getElementById('detail-body');
    overlay.classList.remove('hidden');
    body.innerHTML = '<div class="loader"></div><p style="text-align:center;margin-top:1rem">Fetching institutional history...</p>';

    // Map UI labels to yfinance periods
    const periodMap = { '1W': '5d', '1M': '1mo', '60d': '60d', '3M': '3mo', '6M': '6mo' };
    const yfPeriod = periodMap[period] || '60d';

    const [data, liqData, derivData, walletData] = await Promise.all([
        fetchAPI(`/history?ticker=${ticker}&period=${yfPeriod}`),
        fetchAPI(`/liquidity?ticker=${ticker}`),
        fetchAPI(`/derivatives?ticker=${ticker}`),
        fetchAPI(`/wallet-attribution?ticker=${ticker}`)
    ]);
    
    if (!data || data.error || !data.history) {
        body.innerHTML = `
            <div style="text-align:center;padding:2rem">
                <h3 class="neg">Intelligence Fetch Failed</h3>
                <p style="margin:1rem 0;color:var(--text-dim)">Could not retrieve historical data for ${ticker}.</p>
                <button class="filter-btn active" onclick="document.getElementById('detail-overlay').classList.add('hidden')">CLOSE TERMINAL</button>
            </div>`;
        return;
    }
    const { history } = data;

    body.innerHTML = `
        <div class="detail-header">
            <div><span class="category-label">${category}</span><h2>${ticker} Intelligence</h2></div>
            <div style="display:flex; gap:1rem; align-items:flex-start">

                <button class="intel-action-btn" style="width:auto" onclick="openAIAnalyst('${ticker}')">RUN AI DEEP-DIVE <span class="material-symbols-outlined" style="font-size: 18px; margin-left: 6px; vertical-align: middle;">smart_toy</span></button>
            </div>
        </div>

        <div class="ticker-narrative-box" style="margin-bottom:1.5rem; padding:1.2rem; background:rgba(0, 242, 255, 0.03); border:1px solid rgba(0, 242, 255, 0.1); border-radius:8px">
            <h3 style="font-size:0.8rem; color:var(--accent); margin-bottom:0.5rem">TICKER NARRATIVE</h3>
            <p style="font-size:0.9rem; line-height:1.4; color:var(--text)">${data.summary}</p>
            <div class="asset-metrics" style="display:flex; gap:2rem; margin-top:1rem; border-top:1px solid rgba(255,255,255,0.05); padding-top:1rem">
                <div><label style="display:block; font-size:0.6rem; color:var(--text-dim)">MARKET CAP</label><span style="font-weight:700">${data.metrics.market_cap}</span></div>
                <div><label style="display:block; font-size:0.6rem; color:var(--text-dim)">24H VOLUME</label><span style="font-weight:700">${data.metrics.vol_24h}</span></div>
                <div><label style="display:block; font-size:0.6rem; color:var(--text-dim)">DOMINANCE</label><span style="font-weight:700">${data.metrics.dominance}</span></div>
            </div>
        </div>

        <div class="timeframe-bar">
            ${['1W','1M','60d','3M','6M'].map(tf => `<button class="tf-btn ${tf === period ? 'active' : ''}" onclick="openDetail('${ticker}','${category}',${correlation},${alpha},${sentiment},'${tf}',${isTracked})">${tf}</button>`).join('')}
        </div>
        <div class="chart-container"><canvas id="priceChart"></canvas></div>
        
        <div class="institutional-timeline" style="margin-top:2rem">
            <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">INSTITUTIONAL EVENT TIMELINE</h3>
            <div class="catalyst-list">
                ${data.timeline.map(item => `
                    <div class="catalyst-item">
                        <div class="cat-date">${item.date}</div>
                        <div class="cat-card">
                            <div class="cat-event">${item.event}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="stats-panel" style="margin-top:2rem">
            <div class="stat-box"><label>Correlation</label><span>${correlation.toFixed(2)}</span></div>
            <div class="stat-box"><label>Alpha</label><span class="${alpha >= 0 ? 'pos' : 'neg'}">${alpha.toFixed(2)}%</span></div>
            <div class="stat-box"><label>Z-Score (Stats)</label><span class="${Math.abs(data.stats.zScore) > 2 ? 'neg' : 'pos'}">${data.stats.zScore.toFixed(2)}</span></div>
            <div class="stat-box" style="position:relative">
                <label>Sentiment Div.</label>
                <div class="div-meter">
                    <div class="div-fill" style="width: ${Math.min(Math.abs(data.divergence || 0) * 100, 100)}%; background: ${data.divergence > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}"></div>
                </div>
                <span style="font-size:0.6rem; color:var(--text-dim); margin-top:2px">${data.divergence > 0 ? 'PRICE LEAD' : data.divergence < 0 ? 'SENT. LEAD' : 'SYNCED'}</span>
            </div>
        </div>

        <div class="liquidity-derivatives-grid" style="margin-top:2rem; display:grid; grid-template-columns: 1fr 1fr; gap:20px; border-top:1px solid var(--border); padding-top:1.5rem">
            <div class="liquidity-section">
                <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">LIQUIDITY DEPTH (S/R WALLS)</h3>
                <div id="liquidity-map"></div>
            </div>
            <div class="derivatives-section">
                <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">DERIVATIVES MONITOR</h3>
                <div class="derivatives-grid">
                    <div class="deriv-box"><label>Funding Rate</label><span>${derivData.fundingRate}%</span></div>
                    <div class="deriv-box"><label>Open Interest</label><span>${derivData.openInterest}</span></div>
                    <div class="deriv-box"><label>OI 24h Change</label><span class="${derivData.oiChange >= 0 ? 'pos' : 'neg'}">${derivData.oiChange}%</span></div>
                    <div class="deriv-box"><label>Long/Short Ratio</label><span>${derivData.longShortRatio}</span></div>
                </div>
            </div>
        </div>
        <div class="overlay-controls" style="margin-top:1.5rem; display:flex; gap:10px; align-items:center">
            <label style="font-size:0.7rem; color:var(--text-dim); font-weight:700">ADVANCED OVERLAYS:</label>
            <button class="timeframe-btn" onclick="toggleOverlay('ema')">EMA (12/26)</button>
            <button class="timeframe-btn" onclick="toggleOverlay('vol')">VOL RIBBONS</button>
        </div>
        
        <div class="tape-reader-section" style="margin-top:2rem; border-top:1px solid var(--border); padding-top:1.5rem">
            <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">ENTITY FLOW ATTRIBUTION (ON-CHAIN)</h3>
            <div id="flow-attribution-container"></div>
            
            <h3 style="margin-top:2rem; margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">LIVE EXECUTION TAPE (L2 SIM)</h3>
            <div id="tape-container"></div>
        </div>
`;
    
    // Store data for chart toggling
    window.currentHistory = data.history;
    window.activeOverlays = { ema: false, vol: false };

    if (data.news && data.news.length) {
        window.lastNewsData = data.news; // Store for article view
        body.innerHTML += `
            <div class="detail-news-section" style="margin-top:2rem; border-top:1px solid var(--border); padding-top:1.5rem">
                <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">LATEST INSTITUTIONAL NARRATIVE</h3>
                <div class="news-card" onclick="openNewsArticle(0)" style="padding:1.2rem; background:rgba(0, 242, 255, 0.02); border-color: rgba(0, 242, 255, 0.2)">
                    <div class="news-header" style="margin-bottom:0.5rem">
                        <div class="news-time">${data.news[0].time}</div>
                        <div class="news-tag tag-${data.news[0].sentiment.toLowerCase()}">${data.news[0].sentiment}</div>
                    </div>
                    <div class="news-headline" style="font-size:1rem; margin-bottom:0.5rem">${data.news[0].headline}</div>
                    <div class="news-summary" style="font-size:0.8rem">${data.news[0].summary}</div>
                </div>
            </div>`;
    }

    renderChart(history);
    renderDetailLiquidity(liqData);
    renderFlowAttribution(walletData);

    // Initialize Tape Reader
    if (window.activeTape) window.activeTape.stop();
    window.lastBasePrice = history[history.length-1].price;
    window.activeTape = new TapeReader('tape-container', ticker);
    window.activeTape.start();
}

function renderDetailLiquidity(data) {
    const container = document.getElementById('liquidity-map');
    if (!data.levels || !data.levels.length) {
        container.innerHTML = '<p class="empty-state">No depth data available.</p>';
        return;
    }

    const bids = data.levels.filter(l => l.side === 'BID');
    const asks = data.levels.filter(l => l.side === 'ASK');
    const totalBid = bids.reduce((acc, l) => acc + l.size, 0);
    const totalAsk = asks.reduce((acc, l) => acc + l.size, 0);
    const imbalance = (totalBid / (totalBid + totalAsk)) * 100;

    const maxSideSize = Math.max(...data.levels.map(l => l.size));
    
    // Sort levels descending by price for vertical map
    const sorted = [...data.levels].sort((a,b) => b.price - a.price);

    container.innerHTML = `
        <div class="obd-meter-section" style="margin-bottom:1.5rem">
            <div style="display:flex; justify-content:space-between; font-size:0.6rem; margin-bottom:4px; font-weight:700">
                <span class="pos">BUY PRESSURE</span>
                <span class="neg">SELL PRESSURE</span>
            </div>
            <div class="div-meter" style="height:6px">
                <div class="div-fill" style="width: ${imbalance}%; background: var(--risk-low); border-radius: 3px 0 0 3px"></div>
                <div class="div-fill" style="width: ${100 - imbalance}%; background: var(--risk-high); border-radius: 0 3px 3px 0"></div>
            </div>
            <div style="text-align:center; font-size:0.6rem; color:var(--text-dim); margin-top:4px">BOOK IMBALANCE: ${imbalance.toFixed(1)}% / ${(100-imbalance).toFixed(1)}%</div>
        </div>
        ${sorted.map(l => {
            const width = (l.size / maxSideSize) * 100;
            const color = l.side === 'ASK' ? 'rgba(255, 68, 68, 0.4)' : 'rgba(0, 242, 255, 0.4)';
            return `
                <div class="liq-level">
                    <div class="liq-price">${l.price.toLocaleString()}</div>
                    <div class="liq-bar-bg">
                        <div class="liq-bar" style="width: ${width}%; background: ${color}"></div>
                    </div>
                    <div class="liq-size">${l.size}</div>
                </div>
            `;
        }).join('')}
    `;
}

function renderFlowAttribution(data) {
    const container = document.getElementById('flow-attribution-container');
    if (!data.attribution) {
        container.innerHTML = '<p class="empty-state">No entity data available.</p>';
        return;
    }

    container.innerHTML = `
        <div class="flow-distribution-bar" style="height:12px; display:flex; border-radius:6px; overflow:hidden; margin-bottom:1rem; background:rgba(255,255,255,0.05)">
            ${data.attribution.map(e => `<div style="width:${e.percentage}%; background:${e.color}" title="${e.name}: ${e.percentage}%"></div>`).join('')}
        </div>
        <div class="entity-legend-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
            ${data.attribution.map(e => `
                <div class="entity-row" style="display:flex; justify-content:space-between; font-size:0.7rem; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px">
                        <div style="width:8px; height:8px; border-radius:2px; background:${e.color}"></div>
                        <span style="color:var(--text-dim)">${e.name}</span>
                    </div>
                    <span style="font-weight:700">${e.percentage}%</span>
                </div>
            `).join('')}
        </div>
    `;
}

function toggleOverlay(type) {
    window.activeOverlays[type] = !window.activeOverlays[type];
    const btn = event.target;
    btn.classList.toggle('active');
    renderChart(window.currentHistory);
}

function renderChart(history) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (window.detailChart) window.detailChart.destroy();

    const datasets = [{
        label: 'Price',
        data: history.map(h => h.price),
        borderColor: '#00f2ff',
        backgroundColor: 'rgba(0,242,255,0.05)',
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        tension: 0.2
    }];

    if (window.activeOverlays.ema) {
        datasets.push({
            label: 'EMA 12',
            data: history.map(h => h.ema12),
            borderColor: '#ff00ff',
            borderWidth: 1.5,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
        });
        datasets.push({
            label: 'EMA 26',
            data: history.map(h => h.ema26),
            borderColor: '#ff8800',
            borderWidth: 1.5,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
        });
    }

    if (window.activeOverlays.vol) {
        datasets.push({
            label: 'Upper Band',
            data: history.map(h => h.upper),
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            fill: '+1',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            pointRadius: 0
        });
        datasets.push({
            label: 'Lower Band',
            data: history.map(h => h.lower),
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            fill: false,
            pointRadius: 0
        });
    }

    window.detailChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => h.date),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: window.activeOverlays.ema || window.activeOverlays.vol, labels: { color: 'white', font: { size: 10, family: 'JetBrains Mono' } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { 
                        color: '#888', 
                        font: { family: 'JetBrains Mono' },
                        callback: function(value) {
                            return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(value);
                        }
                    } 
                },
                x: { grid: { display: false }, ticks: { color: '#888', font: { family: 'JetBrains Mono' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } }
            }
        }
    });
}

// ============= Pack G2: Mindshare View =============
async function renderMindshare() {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/mindshare');
    if (!data) return;
    appEl.innerHTML = `
        <div class="view-header"><h1>Mindshare Scatter Plot</h1><p>Mapping Narrative Momentum vs Developer Engineering Activity.</p></div>
        <div class="mindshare-container">
            <div class="chart-container" style="height:550px"><canvas id="mindshareChart"></canvas></div>
            <div class="mindshare-legend">
                <div class="zone zone-alpha"><span>Alpha Quadrant</span>High Narrative, High Engineering</div>
                <div class="zone zone-hype"><span>Hype Quadrant</span>High Narrative, Low Engineering</div>
                <div class="zone zone-under"><span>Underlying Quadrant</span>Low Narrative, High Engineering</div>
            </div>
        </div>
        <div class="mindshare-guide">
            <div class="guide-box">
                <h4><span class="icon">📊</span> NARRATIVE MOMENTUM (Y-AXIS)</h4>
                <p>Quantifies institutional mindshare and news-driven sentiment. A high score suggests dominant public visibility and professional accumulation chatter.</p>
            </div>
            <div class="guide-box">
                <h4><span class="icon">🛠️</span> ENGINEERING MINDSHARE (X-AXIS)</h4>
                <p>Proxies developer activity and technical infrastructure growth. High scores indicate robust protocol stability and long-term utility build-out.</p>
            </div>
            <div class="guide-box full">
                <h4><span class="icon">🧭</span> STRATEGIC INTERPRETATION</h4>
                <div class="interpretation-grid">
                    <div class="inter-item"><strong>ALPHA:</strong> Leading protocols with both social dominance and technical vigor. The "Gold Standard" for institutional portfolios.</div>
                    <div class="inter-item"><strong>HYPE:</strong> Potential "Retail Traps" where mindshare exceeds technical merit. High risk of mean reversion.</div>
                    <div class="inter-item"><strong>UNDERLYING:</strong> Hidden gems. Technical infrastructure is growing silently while price/narrative remains depressed. <i>Prime Alpha Opportunity.</i></div>
                </div>
            </div>
        </div>`;
    const ctx = document.getElementById('mindshareChart').getContext('2d');
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Asset Mindshare',
                data: data.map(d => ({ x: d.engineer, y: d.narrative, label: d.ticker })),
                backgroundColor: 'rgba(0, 242, 255, 0.6)',
                borderColor: '#00f2ff',
                pointRadius: 8,
                pointHoverRadius: 12
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'ENGINEERING MINDSHARE', color: '#8b949e' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { title: { display: true, text: 'NARRATIVE MOMENTUM', color: '#8b949e' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                tooltip: { callbacks: { label: ctx => ctx.raw.label } },
                legend: { display: false }
            }
        }
    });
}



// ============= Catalysts View =============
async function renderCatalysts() {
    appEl.innerHTML = skeleton(2);
    const data = await fetchAPI('/catalysts');
    if (!data) return;
    appEl.innerHTML = `
        <div class="view-header"><h1>Upcoming Intelligence Catalysts</h1></div>
        <div class="catalyst-list">
            ${data.map(c => `
                <div class="catalyst-item">
                    <div class="cat-date">${c.date}</div>
                    <div class="cat-card">
                        <div class="cat-type">${c.type}</div>
                        <h3>${c.event}</h3>
                        <p style="margin-top:0.5rem; color:var(${c.impact === 'Extreme' ? '--risk-high' : '--accent'})">IMPACT: ${c.impact}</p>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

// ============= Whale Pulse =============
async function renderMacroCalendar() {
    appEl.innerHTML = skeleton(6);
    const data = await fetchAPI('/macro-calendar');
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header">
            <h1>Institutional Macro Compass</h1>
            <p>Real-time synthesis of global economic catalysts and their projected impact on liquidity.</p>
        </div>
        
        <div class="macro-stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:2rem">
            ${Object.entries(data.yields || {}).map(([label, val]) => `
                <div class="stat-card" style="background:var(--bg-card); padding:1.2rem; border:1px solid var(--border); border-radius:12px">
                    <div style="font-size:0.7rem; color:var(--text-dim); margin-bottom:5px">${label.toUpperCase()}</div>
                    <div style="font-size:1.5rem; font-weight:800; color:var(--accent)">${val}</div>
                </div>
            `).join('')}
            <div class="stat-card" style="background:var(--bg-card); padding:1.2rem; border:1px solid var(--border); border-radius:12px">
                <div style="font-size:0.7rem; color:var(--text-dim); margin-bottom:5px">ENGINE_STATUS</div>
                <div style="font-size:1.5rem; font-weight:800; color:var(--risk-low)">${data.status}</div>
            </div>
        </div>

        <div class="card-grid">
            <div class="glass-card" style="grid-column: 1 / -1">
                <div class="card-header">
                    <h3>Economic Intelligence Calendar</h3>
                    <span class="label-tag">WEEKLYWIDE_SYNC</span>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>EVENT</th>
                                <th>IMPACT</th>
                                <th>FORECAST</th>
                                <th>PREVIOUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.events.map(e => `
                                <tr>
                                    <td style="font-family:'JetBrains Mono'">${e.date} <span style="color:var(--text-dim); font-size:0.7rem">${e.time}</span></td>
                                    <td style="font-weight:700">${e.event}</td>
                                    <td><span class="impact-badge impact-${e.impact.toLowerCase()}">${e.impact}</span></td>
                                    <td>${e.forecast}</td>
                                    <td style="color:var(--text-dim)">${e.previous}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

async function renderWhales() {
    appEl.innerHTML = skeleton(5);
    const data = await fetchAPI('/whales');
    if (!data) return;
    appEl.innerHTML = `
        <div class="view-header">
            <h1>Institutional Whale Pulse</h1>
            <p>Real-time monitor of unconfirmed large-scale transfers (> 50 BTC) on the Bitcoin network.</p>
        </div>
        <div class="whale-list">
            ${data.map(w => `
                <div class="whale-row">
                    <div class="w-main">
                        <div class="w-amount">${w.amount} BTC <span class="usd-val">(${w.usdValue})</span></div>
                        <div class="w-meta">
                            <span class="w-hash">${w.hash}</span>
                            <span class="w-time">${w.timestamp}</span>
                        </div>
                    </div>
                    <div class="w-paths">
                        <div><label class="label-tag">FROM</label> <span>${w.from}</span></div>
                        <div><label class="label-tag">TO</label> <span>${w.to}</span></div>
                    </div>
                    <div class="w-actions">
                        <div class="impact-badge impact-${w.impact.toLowerCase()}">${w.impact} IMPACT</div>
                        <button class="timeframe-btn" onclick="openDetail('${w.asset}')">VIEW CHART</button>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

// ============= Market Pulse =============
async function renderMarketPulse() {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/market-pulse');
    if (!data || !data.leadLag) return;
    appEl.innerHTML = `
        <div class="view-header"><h1>Institutional Market Pulse</h1></div>
        <div class="pulse-grid">
            <div class="pulse-card"><h3>Fear & Greed Index</h3><div class="big-val">${data.fgIndex}</div><p>${data.fgLabel}</p></div>
            <div class="pulse-card"><h3>Lead-Lag Signal</h3><div class="big-val" style="font-size:2rem">${data.leadLag.leader} ${data.leadLag.divergence}%</div><p>${data.leadLag.signal}</p></div>
        </div>`;
}

// ============= Pack G Rotation & Macro Sync =============
async function renderMacroSync() {
    appEl.innerHTML = skeleton(2);
    const data = await fetchAPI('/macro');
    if (!data) return;

    appEl.innerHTML = `
        <div class="view-header">
            <h1>Market Pulse: Macro Sync</h1>
            <p>Real-time correlation analytics between Bitcoin and traditional macro assets.</p>
        </div>
        <div class="macro-sync-container">
            <div class="macro-grid">
                ${data.map(m => {
                    const absCorr = Math.abs(m.correlation);
                    const color = m.correlation >= 0 ? `rgba(0, 242, 255, ${0.1 + absCorr * 0.5})` : `rgba(255, 62, 62, ${0.1 + absCorr * 0.5})`;
                    return `
                        <div class="macro-card" style="border-top: 4px solid ${m.correlation >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">
                            <div class="m-asset">${m.name}</div>
                            <div class="m-corr" style="color: ${color}">${m.correlation.toFixed(2)}</div>
                            <div class="m-status">${m.status}</div>
                            <div class="m-interpretation">
                                ${m.name === 'DXY' ? (m.correlation < -0.3 ? 'Strong Inverse: BTC acting as non-fiat debasement hedge.' : 'Decoupled: Dollar strength currently neutral for BTC.') : 
                                  m.name === 'GOLD' ? (m.correlation > 0.3 ? 'Digital Gold: Positively correlated with flight-to-safety.' : 'Decoupled from traditional hedges.') :
                                  (m.correlation > 0.3 ? 'Risk-On: Trading in sync with tech equity momentum.' : 'Decoupled from equities.')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="macro-education" style="margin-top:2rem; padding:1.5rem; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid var(--border)">
                <h4 style="color:var(--accent); margin-bottom:0.5rem">Institutional Macro Correlation Guide</h4>
                <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.6">
                    Professional traders monitor these correlations to identify "Narrative Shifts." 
                    A high correlation with **GOLD** confirms the "Safe Haven" thesis, while high correlation with the **SPX** classifies BTC as a "High-Beta Tech" asset. 
                    The **DXY** correlation is the most critical: a strong negative value suggests Bitcoin is absorbing liquidity from fiat debasement.
                </p>
            </div>
        </div>
    `;
}

async function renderRotation() {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/rotation');
    if (!data || !data.matrix) return;
    
    appEl.innerHTML = `
        <div class="view-header">
            <h1>Sector Correlation Matrix</h1>
            <p>Institutional synchronization levels across core market indices using a 30-day Pearson rolling window.</p>
        </div>
        
        <div class="heatmap-legend" style="margin-bottom: 1.5rem">
            <div class="legend-labels">
                <span class="neg">INVERSE SYNC (-1.0)</span>
                <span style="color:var(--text-dim)">DECOUPLED (0.00)</span>
                <span class="pos">FULL SYNCHRONIZATION (+1.0)</span>
            </div>
            <div class="legend-bar" style="background: linear-gradient(to right, #ff3e3e, #222, var(--accent))"></div>
        </div>

        <div class="intel-guide-card" style="margin-bottom: 2rem">
            <div style="display:flex; gap:1.5rem; align-items:flex-start">
                <div class="guide-icon">ℹ️</div>
                <div class="guide-text">
                    <h4 style="color:var(--accent); margin-bottom:0.5rem">How to Read Correlation Dynamics</h4>
                    <p style="font-size:0.85rem; line-height:1.6; color:var(--text-dim)">
                        This matrix tracks 30-day **Pearson Correlation** between synthetic sector indices. 
                        Values near <b>+1.00</b> (Bright Turquoise) indicate sectors moving in lockstep, suggesting broad institutional consensus. 
                        Values near <b>0.00</b> (Dark) indicate decoupled price action, highlighting alpha opportunities. 
                        Negative values (Red) suggest inverse rotation, where capital is exiting one sector to enter another.
                    </p>
                </div>
            </div>
        </div>

        <div class="rotation-matrix-container">
            <div class="matrix-grid" style="grid-template-columns: 140px repeat(${data.sectors.length}, 1fr)">
                <div></div>
                ${data.sectors.map(s => `<div class="matrix-label horizontal">${s}</div>`).join('')}
                ${data.matrix.map((row, i) => `
                    <div class="matrix-label vertical">${data.sectors[i]}</div>
                    ${row.map(val => {
                        const intensity = Math.abs(val);
                        const color = val >= 0 ? `rgba(0, 242, 255, ${intensity * 0.8})` : `rgba(255, 62, 62, ${intensity * 0.8})`;
                        const textColor = intensity > 0.5 ? '#fff' : 'var(--text-dim)';
                        const border = intensity > 0.8 ? '1px solid rgba(255,255,255,0.2)' : 'none';
                        return `<div class="matrix-cell" style="background:${color}; color:${textColor}; border:${border}" title="${data.sectors[i]} vs ${data.sectors[row.indexOf(val)]}: ${val}">${val.toFixed(2)}</div>`;
                    }).join('')}
                `).join('')}
            </div>
        </div>`;
}

async function renderBacktest() {
    appEl.innerHTML = skeleton(1);
    // Initial load with defaults
    runOptimizationLab(1.5, 7, 5);
}

async function runOptimizationLab(z, rebalance, count) {
    const data = await fetchAPI(`/backtest?z_threshold=${z}&rebalance=${rebalance}&count=${count}`);
    if (!data || !data.summary) return;
    
    appEl.innerHTML = `
        <div class="view-header">
            <h1>Strategy Optimization Lab</h1>
            <p>Fine-tune quantitative parameters to maximize Alpha vs Bitcoin benchmark.</p>
        </div>

        <div class="lab-workspace" style="display:grid; grid-template-columns: 350px 1fr; gap:30px">
            <div class="lab-controls">
                <div class="control-box">
                    <div style="display:flex; justify-content:space-between">
                        <label>Z-SCORE INTENSITY</label>
                        <span class="ctrl-val" id="z-val">${z}</span>
                    </div>
                    <input type="range" min="0.5" max="3.0" step="0.1" value="${z}" oninput="document.getElementById('z-val').textContent=this.value" onchange="runOptimizationLab(this.value, document.getElementById('reb-input').value, document.getElementById('count-input').value)">
                    <p class="ctrl-desc">Entry conviction bar. Lower = more trades, Higher = elite quality.</p>
                </div>

                <div class="control-box">
                    <div style="display:flex; justify-content:space-between">
                        <label>REBALANCE FREQUENCY</label>
                        <span class="ctrl-val" id="reb-val">${rebalance}d</span>
                    </div>
                    <input type="range" id="reb-input" min="1" max="30" step="1" value="${rebalance}" oninput="document.getElementById('reb-val').textContent=this.value+'d'" onchange="runOptimizationLab(document.getElementById('z-val').textContent, this.value, document.getElementById('count-input').value)">
                    <p class="ctrl-desc">Days between portfolio re-calibration.</p>
                </div>

                <div class="control-box">
                    <div style="display:flex; justify-content:space-between">
                        <label>PORTFOLIO CONCENTRATION</label>
                        <span class="ctrl-val" id="count-val">${count}</span>
                    </div>
                    <input type="range" id="count-input" min="3" max="15" step="1" value="${count}" oninput="document.getElementById('count-val').textContent=this.value" onchange="runOptimizationLab(document.getElementById('z-val').textContent, document.getElementById('reb-input').value, this.value)">
                    <p class="ctrl-desc">Max number of assets in the portfolio.</p>
                </div>
                
                <div class="lab-metrics-grid" style="margin-top:2rem">
                    <div class="mini-stat">
                        <label>SHARPE RATIO</label>
                        <div class="val">${data.summary.sharpe}</div>
                    </div>
                    <div class="mini-stat">
                        <label>MAX DRAWDOWN</label>
                        <div class="val neg">-${data.summary.maxDrawdown}%</div>
                    </div>
                </div>
            </div>

            <div class="lab-results">
                <div class="backtest-summary" style="margin-bottom:1.5rem">
                    <div class="summary-box">
                        <label>STRATEGY RETURN</label>
                        <div class="val ${data.summary.totalReturn >= 0 ? 'pos' : 'neg'}">${data.summary.totalReturn}%</div>
                    </div>
                    <div class="summary-box">
                        <label>ALPHA (EXCESS)</label>
                        <div class="val pos">+${data.summary.alpha}%</div>
                    </div>
                </div>
                <div class="chart-container" style="height: 400px">
                    <canvas id="backtestChart"></canvas>
                </div>
            </div>
        </div>
        
        <div class="attribution-header" style="margin-top:3rem; margin-bottom:1rem">
            <h3>Sector Alpha Attribution</h3>
        </div>
        <div class="attribution-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:1rem">
            ${Object.entries(data.attribution).map(([sector, impact]) => `
                <div class="p-stat-card">
                    <label>${sector}</label>
                    <div class="val ${impact >= 0 ? 'pos' : 'neg'}">${impact >= 0 ? '+' : ''}${impact}%</div>
                </div>
            `).join('')}
        </div>`;
    
    const ctx = document.getElementById('backtestChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.weeklyReturns.map(d => d.date),
            datasets: [
                { label: 'Optimized Strategy', data: data.weeklyReturns.map(d => d.portfolio), borderColor: '#00f2ff', borderWidth: 3, fill: true, backgroundColor: 'rgba(0, 242, 255, 0.1)', tension: 0.4, pointRadius: 0 },
                { label: 'BTC Benchmark', data: data.weeklyReturns.map(d => d.btc), borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderDash: [5,5], fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, 
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { labels: { color: 'white', font: { family: 'JetBrains Mono', size: 10 } } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', font: { size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', font: { size: 10 } } }
            }
        }
    });
}
// ============= Newsroom View =============
async function renderNewsroom() {
    appEl.innerHTML = skeleton(4);
    const data = await fetchAPI('/news');
    if (!data) return;
    window.lastNewsData = data;
    
    appEl.innerHTML = `
        <div class="view-header">
            <div style="display:flex; align-items:center; gap:10px">
                <div class="live-indicator"></div>
                <h1>Live Intelligence Newsroom</h1>
            </div>
            <p>Real-time institutional narrative stream correlated with AlphaSignal intensity.</p>
        </div>
        <div class="news-feed">
            ${data.map((n, i) => `
                <div class="news-card" onclick="openNewsArticle(${i})">
                    <div class="news-header">
                        <div class="news-time">${n.time}</div>
                        <div class="news-tag tag-${n.sentiment.toLowerCase()}">${n.sentiment}</div>
                    </div>
                    <div class="news-headline">${n.headline}</div>
                    <div class="news-summary">${n.summary}</div>
                    <div class="news-source">Source: AlphaSignal Institutional Feed // ${n.ticker}</div>
                </div>
            `).join('')}
        </div>`;
}

function openNewsArticle(index) {
    const news = window.lastNewsData[index];
    if (!news) return;

    const modal = document.getElementById('news-modal');
    const body = document.getElementById('news-article-body');
    
    modal.classList.remove('hidden');
    body.innerHTML = `
        <div class="article-header">
            <div class="article-meta">
                <div class="news-tag tag-${news.sentiment.toLowerCase()}">${news.sentiment}</div>
                <div class="news-time">${news.time} // ${news.ticker}</div>
            </div>
            <h2 class="article-title">${news.headline}</h2>
        </div>
        <div class="article-content">
            ${news.content || `<p>${news.summary}</p><p>Full intelligence report is currently being synthesized by AlphaSignal Prime. Check back shortly for deep-dive analysis into the institutional flow dynamics of ${news.ticker}.</p>`}
        </div>
        <div class="article-footer">
            <span>© 2026 AlphaSignal Institutional</span>
            <button class="timeframe-btn" onclick="document.getElementById('news-modal').classList.add('hidden')">CLOSE INTEL</button>
        </div>
    `;
}

async function renderRiskIntelligence() {
    appEl.innerHTML = skeleton(2);
    const data = await fetchAPI('/risk');
    if (!data || data.error) return;

    appEl.innerHTML = `
        <div class="view-header">
            <h1>Global Risk Intelligence</h1>
            <p>Quantitative monitoring of systemic stability, VaR exposure, and stress-test liquidations.</p>
        </div>
        
        <div class="risk-top-grid" style="display:grid; grid-template-columns: 1fr 1.5fr; gap:30px; margin-bottom:2rem">
            <div class="risk-summary-card">
                <div class="risk-gauge-container">
                    <div class="risk-label">SYSTEMIC RISK INDEX</div>
                    <div class="risk-value" style="color:${data.systemic_risk > 70 ? 'var(--risk-high)' : data.systemic_risk > 40 ? '#fffa00' : 'var(--risk-low)'}">
                        ${data.systemic_risk}<span>/100</span>
                    </div>
                    <div class="risk-status">${data.systemic_risk > 70 ? 'CRITICAL' : data.systemic_risk > 40 ? 'ELEVATED' : 'STABLE'}</div>
                </div>
                <div class="var-box" style="margin-top:2rem; padding:1.5rem; background:rgba(255,255,255,0.03); border-radius:12px">
                    <label style="font-size:0.65rem; color:var(--text-dim); letter-spacing:1px">PORTFOLIO VaR (95% / 24H)</label>
                    <div style="font-size:2rem; font-weight:800; font-family:'Outfit'; color:var(--risk-high)">${data.var_1d_95}%</div>
                    <p style="font-size:0.75rem; color:var(--text-dim); margin-top:8px">Statistically anticipated drawdown under normal conditions.</p>
                </div>
            </div>

            <div class="stress-test-container">
                <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent)">STRESS TEST SCENARIOS</h3>
                <div class="stress-grid">
                    ${data.scenarios.map(s => `
                        <div class="stress-card">
                            <div class="s-top">
                                <span class="s-name">${s.name}</span>
                                <span class="s-prob">Prob: ${s.prob}</span>
                            </div>
                            <div class="s-impact" style="color:${s.impact < 0 ? 'var(--risk-high)' : 'var(--risk-low)'}">
                                ${s.impact > 0 ? '+' : ''}${s.impact}% Portfolio Impact
                            </div>
                            <div class="s-outcome">${s.outcome}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="risk-bottom-grid" style="display:grid; grid-template-columns: 1fr; gap:30px">
            <div class="asset-risk-table">
                <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent)">ASSET-SPECIFIC RISK ATTRIBUTION</h3>
                <div class="risk-table-header">
                    <span>ASSET</span>
                    <span>1D VaR (95%)</span>
                    <span>ANN. VOLATILITY</span>
                    <span>STATUS</span>
                </div>
                <div class="risk-table-body">
                    ${data.asset_risk.map(a => `
                        <div class="risk-row">
                            <span class="r-ticker">${a.ticker}</span>
                            <span class="r-var neg">${a.var_pct}%</span>
                            <span class="r-vol">${a.annual_vol}%</span>
                            <span class="r-status status-${a.status.toLowerCase()}">${a.status}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

async function renderNarrativeGalaxy() {
    appEl.innerHTML = skeleton(1);
    const data = await fetchAPI('/narrative-clusters');
    if (!data || !data.clusters) return;

    appEl.innerHTML = `
        <div class="view-header">
            <h1>Narrative Cluster Galaxy V2</h1>
            <p>Spatial mapping using real-time news synthesis and sentiment velocity. Anchors represent core institutional narratives.</p>
        </div>
        
        <div class="hot-topics-ticker" style="background:rgba(0, 242, 255, 0.05); border:1px solid var(--accent); padding:10px; border-radius:8px; margin-bottom:1.5rem; display:flex; gap:15px; align-items:center; overflow:hidden">
            <span style="font-size:0.6rem; font-weight:900; color:var(--accent); white-space:nowrap">EMERGING NARRATIVES:</span>
            <div style="display:flex; gap:20px; animation: scroll-left 40s linear infinite">
                ${data.hot_topics.map(t => `<span style="font-size:0.75rem; font-weight:800; color:white; white-space:nowrap"># ${t}</span>`).join('')}
            </div>
        </div>

        <div class="galaxy-container" style="position:relative; width:100%; height:600px; background:radial-gradient(circle at center, #0a0b1e 0%, #000 100%); border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.05)">
            <canvas id="galaxyCanvas" style="width:100%; height:100%"></canvas>
            <div id="galaxyTooltip" class="galaxy-tooltip" style="display:none; position:absolute; pointer-events:none; z-index:1000"></div>
            
            <div class="galaxy-legend" style="position:absolute; bottom:20px; right:20px; display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; background:rgba(0,0,0,0.8); padding:1rem; border-radius:8px; border:1px solid var(--border)">
                ${Object.entries(data.anchors).map(([key, val]) => `
                    <div style="display:flex; align-items:center; gap:8px; font-size:0.6rem; color:var(--text-dim)">
                        <div style="width:10px; height:10px; border-radius:2px; background:${val.color}"></div>
                        <div>
                            <div style="color:white; font-weight:800">${key}</div>
                            <div style="font-size:0.5rem">${val.topic}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="galaxy-timestamp" style="position:absolute; top:20px; right:20px; font-size:0.6rem; color:var(--accent); font-weight:900">
                SYNC_TIME: ${data.timestamp}
            </div>
        </div>
    `;

    const canvas = document.getElementById('galaxyCanvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('galaxyTooltip');
    
    // Set internal resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const stars = data.clusters;
    const hoverScale = 1.2;
    let hoveredStar = null;

    function draw() {
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Draw connection lines to cluster centers (subtle)
        Object.entries(data.anchors).forEach(([key, anchor]) => {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,0.02)`;
            ctx.lineWidth = 1;
            stars.filter(s => s.category === key).forEach(s => {
                ctx.moveTo(anchor.x, anchor.y);
                ctx.lineTo(s.x, s.y);
            });
            ctx.stroke();
        });

        // Draw stars
        stars.forEach(star => {
            const isHovered = star === hoveredStar;
            const size = star.size * (isHovered ? hoverScale : 1);
            
            // Outer glow
            const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, size * 3);
            grad.addColorStop(0, star.color);
            grad.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.fillStyle = grad;
            ctx.globalAlpha = isHovered ? 0.6 : 0.2;
            ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.fillStyle = star.color;
            ctx.globalAlpha = 1;
            ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Label if hovered or high momentum
            if (isHovered || Math.abs(star.momentum) > 10) {
                ctx.fillStyle = 'white';
                ctx.font = isHovered ? 'bold 12px Inter' : '10px Inter';
                ctx.fillText(star.ticker, star.x + size + 5, star.y + 5);
            }
        });
    }

    canvas.onmousemove = (e) => {
        const mx = e.offsetX;
        const my = e.offsetY;
        
        hoveredStar = stars.find(s => Math.hypot(s.x - mx, s.y - my) < 15);
        
        if (hoveredStar) {
            canvas.style.cursor = 'pointer';
            tooltip.style.display = 'block';
            tooltip.style.left = (mx + 20) + 'px';
            tooltip.style.top = (my + 20) + 'px';
            tooltip.innerHTML = `
                <div style="background:rgba(10,11,30,0.95); border:1px solid ${hoveredStar.color}; padding:12px; border-radius:8px; backdrop-filter:blur(10px); min-width:140px">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px">
                        <span style="font-weight:900; color:white; font-size:1rem">${hoveredStar.ticker}</span>
                        <span style="font-size:0.6rem; color:var(--text-dim)">${hoveredStar.category}</span>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px">
                        <div>
                            <div style="font-size:0.55rem; color:var(--text-dim)">MOMENTUM</div>
                            <div style="font-weight:800; color:${hoveredStar.momentum >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">${hoveredStar.momentum > 0 ? '+' : ''}${hoveredStar.momentum}%</div>
                        </div>
                        <div>
                            <div style="font-size:0.55rem; color:var(--text-dim)">SENTIMENT</div>
                            <div style="font-weight:800; color:${hoveredStar.sentiment >= 0 ? 'var(--accent)' : 'var(--risk-high)'}">${hoveredStar.sentiment >= 0 ? '+' : ''}${hoveredStar.sentiment}</div>
                        </div>
                    </div>
                    ${hoveredStar.meta && hoveredStar.meta.length ? `
                        <div style="display:flex; flex-wrap:wrap; gap:4px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px">
                            ${hoveredStar.meta.map(m => `<span style="font-size:0.5rem; background:rgba(0,242,255,0.1); color:var(--accent); padding:2px 5px; border-radius:3px; font-weight:900">${m}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            canvas.style.cursor = 'default';
            tooltip.style.display = 'none';
        }
        draw();
    };

    canvas.onclick = () => {
        if (hoveredStar) openDetail(hoveredStar.ticker);
    };

    draw();
}

async function renderBriefing() {
    appEl.innerHTML = skeleton(2);
    try {
        const data = await fetchAPI('/briefing');
        if (!data || data.error) {
            appEl.innerHTML = `<div class="empty-state">Briefing error: ${data?.error || 'Intelligence engine offline'}</div>`;
            return;
        }

        appEl.innerHTML = `
            <div class="view-header">
                <h1>Institutional Intelligence Briefing</h1>
                <p>AI-powered narrative synthesis across Mindshare, Flow, and Technical data streams.</p>
            </div>
            
            <div class="briefing-container" style="max-width:900px; margin:0 auto">
                <div class="brief-hero" style="background:linear-gradient(135deg, rgba(0, 242, 255, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%); border:1px solid var(--accent); border-radius:16px; padding:2.5rem; margin-bottom:2rem; position:relative; overflow:hidden">
                    <div style="position:absolute; top:-50px; right:-50px; font-size:10rem; opacity:0.05; pointer-events:none">🤖</div>
                    <div class="brief-sentiment-tag" style="background:var(--risk-low); color:black; font-weight:900; font-size:0.6rem; padding:4px 12px; border-radius:100px; width:fit-content; margin-bottom:1.5rem">
                        ${data.market_sentiment}
                    </div>
                    <h3 style="font-size:2.5rem; font-weight:900; line-height:1.1; margin-bottom:1rem; letter-spacing:-1px">${data.headline}</h3>
                    <p style="font-size:1.1rem; line-height:1.6; color:var(--text); opacity:0.9">${data.summary}</p>
                    <div style="margin-top:2rem; display:flex; gap:20px; font-size:0.8rem; color:var(--text-dim)">
                        <span><strong>MACRO:</strong> ${data.macro_context}</span>
                    </div>
                </div>

                <h3 style="margin-bottom:1.5rem; font-size:1rem; color:var(--accent); letter-spacing:1px">HIGH-CONVICTION PROTOCOLS</h3>
                <div class="ideas-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem">
                    ${data.top_ideas.map(idea => `
                        <div class="idea-card" onclick="openDetail('${idea.ticker}')" style="background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:12px; padding:1.5rem; cursor:pointer; transition:all 0.2s ease">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem">
                                <span style="font-size:1.5rem; font-weight:900">${idea.ticker}</span>
                                <span style="font-size:0.6rem; font-weight:700; color:black; background:${idea.conviction === 'HIGH' ? 'var(--accent)' : 'var(--text-dim)'}; padding:2px 8px; border-radius:4px">
                                    ${idea.conviction} CONVICTION
                                </span>
                            </div>
                            <div style="font-size:0.85rem; color:var(--text); line-height:1.5; margin-bottom:1rem">${idea.reason}</div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-end">
                                <div style="font-size:0.65rem; color:var(--text-dim)">ALPHA TARGET</div>
                                <div style="font-size:1.2rem; font-weight:800; color:var(--risk-low)">$${idea.target}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="ai-footer" style="margin-top:4rem; padding:2rem; border-top:1px solid var(--border); text-align:center; color:var(--text-dim); font-size:0.75rem">
                    Synthesized by AlphaSignal AI Core v4.2. Institutional review recommended before execution.
                </div>
            </div>
        `;
    } catch (e) {
        appEl.innerHTML = `<div class="empty-state">Failed to load briefing: ${e.message}</div>`;
    }
}

// Utility function for formatting prices
function formatPrice(price) {
    return `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function renderTradeLab() {
    appEl.innerHTML = `
        <h1 class="view-title">Trade Idea Lab</h1>
        <p class="view-desc">Synthesize institutional data into actionable trade setups.</p>
        
        <div class="card">
            <h3 class="card-title">Institutional Setup Synthesis</h3>
            <p class="view-desc">Run our neural engine to generate a high-probability trade plan based on current Macro and GOMM data.</p>
            <button class="setup-generator-btn" id="generate-setup-btn">GENERATE NEURAL SETUP</button>
            <div id="setup-display-area"></div>
        </div>
        
        <div style="margin-top:20px; color:var(--text-dim); font-size:0.8rem">
            * Setups are generated using cross-exchange liquidity walls and systemic risk markers. Always verify against personal risk parameters.
        </div>`;

    document.getElementById('generate-setup-btn').onclick = async () => {
        const btn = document.getElementById('generate-setup-btn');
        const area = document.getElementById('setup-display-area');
        
        btn.textContent = "SYNTHESIZING MARKET DATA...";
        btn.disabled = true;
        
        const setup = await fetchAPI('/generate-setup?ticker=BTC-USD');
        
        if (setup) {
            area.innerHTML = `
                <div class="setup-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                        <span style="font-weight:900; color:var(--accent)">${setup.ticker} / ${setup.bias}</span>
                        <span class="tier-badge institutional" style="margin:0">${setup.conviction} CONVICTION</span>
                    </div>
                    
                    <div class="setup-param-grid">
                        <div class="setup-param"><span class="label">Entry Zone</span><span class="value">${formatPrice(setup.parameters.entry)}</span></div>
                        <div class="setup-param"><span class="label">Stop Loss</span><span class="value">${formatPrice(setup.parameters.stop_loss)}</span></div>
                        <div class="setup-param"><span class="label">Target 1</span><span class="value">${formatPrice(setup.parameters.take_profit_1)}</span></div>
                        <div class="setup-param"><span class="label">Target 2</span><span class="value">${formatPrice(setup.parameters.take_profit_2)}</span></div>
                    </div>
                    
                    <div style="margin-bottom:20px">
                        <span class="label" style="display:block; font-size:0.65rem; color:var(--text-dim); margin-bottom:8px; text-transform:uppercase; font-weight:900">Institutional Rationale</span>
                        <ul style="margin:0; padding-left:20px; color:var(--text-header); font-size:0.9rem">
                            ${setup.rationale.map(r => `<li style="margin-bottom:8px">${r}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div style="background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.2); padding:10px; border-radius:8px; font-size:0.75rem; color:var(--risk-high)">
                        <strong>RISK WARNING:</strong> ${setup.risk_warning}
                    </div>
                </div>`;
        }
        
        btn.textContent = "GENERATE NEURAL SETUP";
        btn.disabled = false;
    };
}

async function renderLiquidityView() {
    appEl.innerHTML = `<h1 class="view-title">Order Flow Magnitude Monitor (GOMM)</h1>${skeleton(3)}`;
    
    // Sidebar + Layout
    appEl.innerHTML = `
    <div class="gomm-container">
        <div class="sidebar-panel">
            <h1 class="view-title" style="margin:0">Order Flow (GOMM)</h1>
            <div class="stat-card">
                <div class="label">GLOBAL IMBALANCE</div>
                <div class="value" id="gomm-imbalance">--%</div>
            </div>
            <div class="stat-card" style="margin-top:10px">
                <div class="label">TOTAL BOOK DEPTH</div>
                <div class="value" id="gomm-depth">-- BTC</div>
            </div>

            <div style="margin-top:20px; display:flex; flex-direction:column; gap:8px">
                <button class="setup-generator-btn" id="mode-walls" style="width:100%; border-radius:8px">DEPTH WALLS</button>
                <button class="profile-action-btn" id="mode-heatmap" style="width:100%; border-radius:8px">TEMPORAL HEATMAP</button>
                <button class="profile-action-btn" id="mode-liquidation" style="width:100%; border-radius:8px">LIQUIDATION FLUX</button>
            </div>
            
            <div class="stat-card" style="margin-top:20px; background:rgba(0, 242, 255, 0.03); border:1px solid var(--accent)">
                <div class="label" style="color:var(--accent); font-weight:900">⚡ WHALE WATCH (LIVE)</div>
                <div id="whale-watch-content" class="whale-watch-list">
                    <div style="font-size:0.6rem; color:var(--text-dim); text-align:center; padding:10px">Scanning entities...</div>
                </div>
            </div>
        </div>
        <div id="gomm-main-display" style="flex:1">
            <div class="skeleton-card"></div>
        </div>
        <div class="tape-sidebar">
            <div class="tape-header">INSTITUTIONAL LEDGER (LIVE)</div>
            <div id="tape-content" class="tape-list"></div>
        </div>
    </div>`;

    // Concurrent Fetches
    const [data, tapeData, whaleData, liqData] = await Promise.all([
        fetchAPI('/liquidity?ticker=BTC-USD'),
        fetchAPI('/tape?ticker=BTC-USD'),
        fetchAPI('/whales?ticker=BTC-USD'),
        fetchAPI('/liquidations?ticker=BTC-USD')
    ]);
    
    if (!data) return;

    // Update Stats
    const imbEl = document.getElementById('gomm-imbalance');
    imbEl.textContent = `${data.imbalance > 0 ? '+' : ''}${data.imbalance}%`;
    imbEl.style.color = data.imbalance > 0 ? 'var(--risk-low)' : 'var(--risk-high)';
    document.getElementById('gomm-depth').textContent = `${data.metrics.total_depth} BTC`;

    const display = document.getElementById('gomm-main-display');

    function renderWallsMode() {
        display.innerHTML = `
            <div class="card" style="height:100%; border:none; background:transparent">
                <h3 class="card-title">Global Liquidity Walls (Cross-Exchange)</h3>
                <div class="liquidity-chart">
                    ${data.walls.map(w => {
                        const maxSideDepth = Math.max(...data.walls.map(wall => wall.size));
                        const width = (w.size / maxSideDepth) * 100;
                        const exchClass = (w.exchange || 'Binance').toLowerCase();
                        return `
                        <div class="liquidity-bar-row">
                            <div class="price-label ${w.side}">${formatPrice(w.price)}</div>
                            <div class="bar-container">
                                <div class="liquidity-bar ${w.side} ${exchClass}" style="width:${width}%"></div>
                                <span class="bar-val">${w.size} <small>BTC</small></span>
                            </div>
                            <div class="exch-tag">${(w.exchange || 'Binance').toUpperCase()}</div>
                        </div>`;
                    }).join('')}
                    <div class="mid-price-line">GLOBAL MID PRICE: ${formatPrice(data.current_price)}</div>
                </div>
            </div>`;
    }

    function renderHeatmapMode() {
        display.innerHTML = `
            <div class="card" style="height:100%; display:flex; flex-direction:column">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem">
                    <h3 class="card-title" style="margin:0">Temporal Liquidity Heatmap (1H History)</h3>
                    <span style="font-size:0.55rem; background:rgba(34, 197, 94, 0.1); color:var(--risk-low); padding:2px 8px; border-radius:4px; font-weight:900; letter-spacing:1px">HISTORICAL PERSISTENCE ACTIVE</span>
                </div>
                <div class="heatmap-grid" style="flex:1">
                    ${data.history.map(snap => `
                        <div class="heatmap-row">
                             <div class="label" style="font-size:0.6rem; width:50px; color:var(--text-dim)">${snap.time}</div>
                             <div class="heatmap-cells">
                                ${snap.walls.sort((a,b) => a.price - b.price).map(w => {
                                    const opacity = Math.min(w.size / 500, 1);
                                    const color = w.side === 'ask' ? `rgba(239, 68, 68, ${opacity})` : `rgba(34, 197, 94, ${opacity})`;
                                    return `<div class="hm-cell" title="${formatPrice(w.price)}: ${w.size} BTC" style="background:${color}"></div>`;
                                }).join('')}
                             </div>
                        </div>
                    `).join('')}
                </div>
                <div style="font-size:0.65rem; color:var(--text-dim); margin-top:15px; text-align:center; padding:10px; background:rgba(255,255,255,0.02); border-radius:4px">
                    <span style="color:var(--risk-low)">█</span> BID DEPTH | <span style="color:var(--risk-high)">█</span> ASK DEPTH (INTENSITY = MAGNITUDE)
                </div>
            </div>`;
    }

    function renderLiquidationMode() {
        display.innerHTML = `
            <div class="card" style="height:100%; display:flex; flex-direction:column">
                <h2 class="card-title">Liquidation Flux & Leverage Risk</h2>
                <div class="liquidity-chart" style="flex:1">
                    ${liqData.clusters.map(c => `
                        <div class="liq-flux-row" title="Liquidation Cluster at ${formatPrice(c.price)}">
                            <div class="price-label ${c.side === 'LONG' ? 'ask' : 'bid'}" style="width:100px">${formatPrice(c.price)}</div>
                            <div class="liq-flux-bar">
                                <div class="liq-intensity ${c.side}" style="width:${c.intensity * 100}%"></div>
                                <span class="liq-val">${c.magnitude} <small>LIQ. VELOCITY</small></span>
                            </div>
                        </div>
                    `).join('')}
                    <div class="mid-price-line">CURRENT FUNDING: <span style="color:#fff">${liqData.funding_rate}</span></div>
                </div>
            </div>`;
    }

    // Default Mode
    renderWallsMode();

    // Mode Commutation
    const btnWalls = document.getElementById('mode-walls');
    const btnHeat = document.getElementById('mode-heatmap');
    const btnLiq = document.getElementById('mode-liquidation');

    const updateBtns = (active) => {
        [btnWalls, btnHeat, btnLiq].forEach(b => {
            b.className = 'profile-action-btn';
            b.style.background = 'rgba(255,255,255,0.05)';
        });
        active.className = 'setup-generator-btn';
        active.style.background = '';
    };

    btnWalls.onclick = () => { renderWallsMode(); updateBtns(btnWalls); };
    btnHeat.onclick = () => { renderHeatmapMode(); updateBtns(btnHeat); };
    btnLiq.onclick = () => { renderLiquidationMode(); updateBtns(btnLiq); };

    // Whale Pulse Sidebar
    if (whaleData && whaleData.entities) {
        document.getElementById('whale-watch-content').innerHTML = whaleData.entities.map(e => `
            <div class="whale-item">
                <div class="whale-header">
                    <span class="whale-name">${e.name}</span>
                    <span class="whale-type">${e.type}</span>
                </div>
                <div class="whale-status">
                    <span class="status-${e.status.toLowerCase()}">${e.status.toUpperCase()}</span>
                    <span style="color:var(--text-dim)">${e.last_tx}</span>
                </div>
            </div>
        `).join('');
    }

    // Tape
    const tapeContent = document.getElementById('tape-content');
    if (tapeData && tapeData.trades) {
        tapeContent.innerHTML = tapeData.trades.map(t => `
            <div class="tape-item ${t.institutional ? 'institutional' : ''}">
                <div style="font-size:0.6rem; color:var(--text-dim)">${t.time.split(':')[1]}:${t.time.split(':')[2]}</div>
                <div class="tape-val ${t.side === 'BUY' ? 'tape-buy' : 'tape-sell'}">
                    ${t.side} ${t.size} <small>@</small> ${Math.round(t.price)}
                </div>
                <div style="text-align:right; font-size:0.6rem; color:var(--text-dim)">${t.exchange.toUpperCase()}</div>
            </div>
        `).join('');
    }
}

async function renderMacroView() {
    appEl.innerHTML = `<h1 class="view-title">Macro Catalyst Compass</h1>${skeleton(2)}`;
    try {
        const data = await fetchAPI('/macro-calendar');
        if (!data) return;

        appEl.innerHTML = `
            <h1 class="view-title">🌏 Macro Catalyst Compass</h1>
            <p class="view-desc">Tracking high-impact economic drivers and global liquidity shifts.</p>
            <div class="macro-grid" style="display:grid; grid-template-columns: 1fr 350px; gap:20px">
                <div>
                    <div class="card">
                        <h3 class="card-title">Upcoming Volatility Triggers</h3>
                        <div style="display:flex; flex-direction:column; gap:12px">
                            ${data.events.map(e => `
                                <div style="display:flex; gap:15px; padding:15px; background:rgba(255,255,255,0.02); border-radius:12px; border-left: 4px solid var(--${e.impact === 'CRITICAL' ? 'risk-high' : (e.impact === 'HIGH' ? 'accent' : 'text-dim')})">
                                    <div style="width:60px; text-align:center">
                                        <div style="font-size:0.65rem; color:var(--text-dim)">${e.date.split('-').slice(1).join('/')}</div>
                                        <div style="font-size:0.85rem; font-weight:900">${e.time}</div>
                                    </div>
                                    <div style="flex:1">
                                        <div style="font-size:0.95rem; font-weight:800; margin-bottom:4px">${e.event}</div>
                                        <div style="font-size:0.7rem; color:var(--text-dim)">FCST: <span style="color:var(--text)">${e.forecast}</span> | PREV: ${e.previous}</div>
                                    </div>
                                    <div style="text-align:right">
                                        <div class=" impacto-badge impact-${e.impact.toLowerCase()}" style="font-size:0.6rem">${e.impact}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <aside style="display:flex; flex-direction:column; gap:20px">
                    <div class="card">
                        <h3 class="card-title">Treasury Yields</h3>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                            ${Object.entries(data.yields).map(([lbl, val]) => `
                                <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; text-align:center">
                                    <div style="font-size:0.6rem; color:var(--text-dim); margin-bottom:4px">${lbl}</div>
                                    <div style="font-size:1.1rem; font-weight:900; color:var(--accent)">${val}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="card" style="border-top: 4px solid var(--accent)">
                        <h3 class="card-title">Institutional Briefing</h3>
                        <p style="font-size:0.8rem; line-height:1.5; color:var(--text-dim)">Monitor Core PCE and GDP Final estimates for risk-on confirmation. Yield compression typically precedes volatility regime shifts.</p>
                        <div style="margin-top:15px; font-size:0.6rem; color:var(--accent); font-weight:900">STATUS: ${data.status}</div>
                    </div>
                </aside>
            </div>`;
    } catch (e) {
        appEl.innerHTML = `<div class="empty-state">Macro Engine offline: ${e.message}</div>`;
    }
}

// ============= Core Features =============
async function updateBTC() {
    const data = await fetchAPI('/btc');
    if (data && data.price) {
        const el = document.getElementById('btc-price');
        el.textContent = `$${data.price.toLocaleString(undefined, {maximumFractionDigits:0})}`;
        el.className = data.change >= 0 ? 'pos' : 'neg';
    }
}



async function renderAlerts() {
    appEl.innerHTML = skeleton(3);
    const data = await fetchAPI('/alerts');
    
    appEl.innerHTML = `
        <div class="view-header">
            <h1>Live Intelligence Alerts</h1>
            <p>Real-time monitoring of statistical outliers, de-peg events, and institutional-scale movements.</p>
        </div>
        <div class="alert-list" style="display:flex; flex-direction:column; gap:1.5rem">
            ${data.length ? data.map(a => `
                <div class="alert-card ${a.severity}" style="background:var(--bg-card); border:1px solid var(--border); border-left:4px solid ${a.severity === 'high' ? 'var(--risk-high)' : (a.severity === 'medium' ? 'var(--accent)' : 'var(--text-dim)')}; border-radius:12px; padding:1.5rem; position:relative; overflow:hidden">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                        <span style="font-size:0.7rem; font-weight:900; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; color:${a.severity === 'high' ? 'var(--risk-high)' : 'var(--accent)'}">${a.type}</span>
                        <span style="font-size:0.7rem; color:var(--text-dim)">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <div style="font-size:1.1rem; font-weight:800; margin-bottom:8px">${a.title}</div>
                    <div style="font-size:0.85rem; color:var(--text-dim); line-height:1.4">${a.content}</div>
                </div>
            `).join('') : '<p class="empty-state">No active high-severity threats detected.</p>'}
        </div>`;
    
    // Clear badge when viewing alerts
    document.getElementById('alert-badge').style.display = 'none';
}

async function syncAlerts() {
    const data = await fetchAPI('/alerts');
    if (data && data.length) {
        const highSeverity = data.filter(a => a.severity === 'extreme' || a.severity === 'high').length;
        const badge = document.getElementById('alert-badge');
        if (highSeverity > 0) {
            badge.textContent = highSeverity;
            badge.style.display = 'flex';
        } else if (data.length > 0) {
            badge.textContent = data.length;
            badge.style.backgroundColor = 'var(--accent)';
            badge.style.display = 'flex';
        }
    }
}

// ============= Initialization =============
const viewMap = {
    signals: renderSignals, 
    briefing: renderBriefing,
    mindshare: renderMindshare, 
    flow: renderFlows,
    heatmap: renderHeatmap,
    catalysts: renderCatalysts,
    'macro-calendar': renderMacroCalendar,
    whales: renderWhales,

    pulse: renderMarketPulse,
    rotation: renderRotation,
    backtest: renderBacktest,
    risk: renderRiskIntelligence,
    narrative: renderNarrativeGalaxy,
    newsroom: renderNewsroom,
    alerts: renderAlerts,
    tradelab: renderTradeLab,
    liquidity: renderLiquidityView,
    'macro-calendar': renderMacroView,
    home: renderHome,
    'explain-signals': renderDocsSignals,
    'explain-briefing': renderDocsBriefing,
    'explain-liquidity': renderDocsLiquidity,
    'explain-whales': renderDocsWhales,
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
    'explain-api': renderDocsAPI,
    'explain-glossary': renderDocsGlossary,
    help: renderHelp
};

async function renderHome() {
    appEl.innerHTML = `
        <div class="landing-page">
            <div class="landing-bg-overlay" style="background-image: url('landing_hero_abstract.png')"></div>
            <section class="hero-section">
                <div class="hero-content">
                    <h1>Institutional Intelligence Terminal. <span>Live.</span></h1>
                    <p class="hero-subtitle">
                        AlphaSignal provides real-time multi-asset intelligence across crypto, equities, and forex. 
                        Synthesized by AI. Verified by institutional order flow.
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
                <div class="f-grid">
                    <div class="f-card" onclick="switchView('signals')">
                        <div class="f-icon"><img src="icon_signal.png" alt="Signal Intelligence" width="48" height="48" loading="lazy"></div>
                        <h3>Signal Intelligence</h3>
                        <p>Real-time Z-score deviations and relative alpha across 500+ institutional assets.</p>
                    </div>
                    <div class="f-card" onclick="switchView('briefing')">
                        <div class="f-icon"><img src="icon_ai.png" alt="AI Briefing" width="48" height="48" loading="lazy"></div>
                        <h3>AI Briefing</h3>
                        <p>Daily neural synthesis of global market trends and institutional narrative shifts.</p>
                    </div>
                    <div class="f-card" onclick="switchView('liquidity')">
                        <div class="f-icon"><img src="icon_flow.png" alt="Order Flow (GOMM)" width="48" height="48" loading="lazy"></div>
                        <h3>Order Flow (GOMM)</h3>
                        <p>Visualizing professional liquidity walls and execution tape from 15+ exchanges.</p>
                    </div>
                    <div class="f-card" onclick="switchView('whales')">
                        <div class="f-icon"><img src="icon_whale.png" alt="Whale Pulse" width="48" height="48" loading="lazy"></div>
                        <h3>Whale Pulse</h3>
                        <p>Institutional-sized transaction tracking and exchange flow alerts.</p>
                    </div>
                </div>
            </section>

            <section class="app-status-bar">
                <div class="status-item">
                    <span class="s-label">SYSTEM_STATUS:</span>
                    <span class="s-value status-online">OPTIMAL</span>
                </div>
                <div class="status-item">
                    <span class="s-label">DATA_STREAMS:</span>
                    <span class="s-value">1,248 LIVE EPS</span>
                </div>
                <div class="status-item">
                    <span class="s-label">NEURAL_SYNTH:</span>
                    <span class="s-value">ACTIVE</span>
                </div>
            </section>
        </div>
    `;
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
    appEl.innerHTML = `
        <div class="view-header"><h1>Terminal Documentation</h1></div>
        <div class="doc-container" style="max-width: 900px; margin: 0 auto; padding-top: 2rem;">
            <p style="font-size: 1.1rem; color: var(--text-dim); margin-bottom: 2rem; line-height: 1.6;">Select a module below to view detailed methodology, data sources, and analytical frameworks.</p>
            <div class="f-grid">
                <div class="f-card" onclick="switchView('explain-signals')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">radar</span></div>
                    <h3>Signal Intelligence</h3>
                    <p>Understanding Z-Score deviations and alpha generation.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-briefing')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">memory</span></div>
                    <h3>AI Briefing</h3>
                    <p>How global market trends are neutrally synthesized.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-liquidity')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">bar_chart</span></div>
                    <h3>Order Flow (GOMM)</h3>
                    <p>Interpreting liquidity walls and execution tape.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-whales')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">waves</span></div>
                    <h3>Whale Pulse</h3>
                    <p>Detecting massive on-chain block transactions.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-mindshare')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">hub</span></div>
                    <h3>Narrative Galaxy</h3>
                    <p>Using NLP-driven social cluster visualization.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-benchmark')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">science</span></div>
                    <h3>Portfolio Simulation</h3>
                    <p>Modeling and backtesting quant portfolios.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-alerts')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">event</span></div>
                    <h3>Catalyst Monitor</h3>
                    <p>Tracking macro variables and critical events.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-zscore')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">insights</span></div>
                    <h3>Z-Score Interpretation</h3>
                    <p>Decoding statistical intensity and outlier detection.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-alpha')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">trending_up</span></div>
                    <h3>Alpha Strategy</h3>
                    <p>Trading relative strength and market benchmarks.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-correlation')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">link</span></div>
                    <h3>Correlation Analysis</h3>
                    <p>Identifying market decoupling and rotation events.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-sentiment')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">psychology</span></div>
                    <h3>Sentiment Synthesis</h3>
                    <p>How we process social mindshare and news flow.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-risk')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">shield_with_heart</span></div>
                    <h3>Risk Management</h3>
                    <p>Using volatility and drawdowns for sizing.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-glossary')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">menu_book</span></div>
                    <h3>Terminal Glossary</h3>
                    <p>Quick reference for all institutional metrics.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-playbook')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">auto_stories</span></div>
                    <h3>Trading Playbook</h3>
                    <p>Advanced strategies and signal combinations.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-regimes')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">layers</span></div>
                    <h3>Market Regimes</h3>
                    <p>Identifying institutional cycles and trends.</p>
                </div>
                <div class="f-card" onclick="switchView('explain-api')">
                    <div class="f-icon"><span class="material-symbols-outlined" style="font-size:48px; color:var(--accent);">terminal</span></div>
                    <h3>Institutional API</h3>
                    <p>Programmatic data access for quant desks.</p>
                </div>
            </div>
        </div>
    `;
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
        "The AI Briefing module is a neural synthesis engine that consumes and correlates news flow, social mindshare, and macro catalyst data. Unlike generic news aggregators, our LLM framework is tuned specifically for institutional finance. It identifies 'hidden' connections—such as how a specific regulatory shift in Asia might impact L2 liquidity in Europe—and presents them in a concise, actionable format. It is designed to save analysts hours of manual research by highlighting the signal within the noise.",
        [
            { icon: 'memory', title: 'Neural Synthesis', desc: 'Millions of text nodes are processed daily to identify emerging narratives and shifts in institutional sentiment before they reach mainstream media.' },
            { icon: 'auto_graph', title: 'Sector Correlation', desc: 'The briefing automatically groups assets into thematic sectors (L1, DeFi, AI, Memes) to show where rotational capital is flowing in real-time.' },
            { icon: 'history_edu', title: 'Macro Translation', desc: 'Translating complex macro events—like FOMC minutes or CPI prints—into direct impact estimates for your tracked portfolio.' }
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
        "The Global Orderflow Magnitude Monitor (GOMM) provides a deep-dive into the exchange limit order books. By tracking the depth and density of bids and asks across the top 100 liquidity pairs, we can identify 'Liquidity Walls'—large clusters of orders that act as natural magnets or barriers for price action. Understanding where 'deep' liquidity sits allows professional traders to predict reversal points and identify where the most significant slippage is likely to occur.",
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
            { icon: 'analytics', title: 'Standard Deviation', desc: 'A Z-score of +3.0 indicates a move 3 standard deviations above the mean—a statistical rarity that often precedes a price correction or "cooling off" period.' },
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
        "Alpha represents the 'excess return' of an asset relative to a benchmark—in our terminal, typically Bitcoin (BTC-USD). If Bitcoin moves up 5% and an asset moves up 8%, that asset has generated 3% Alpha. Our platform prioritizes assets with high positive Alpha because they represent true idiosyncratic strength—assets that are attracting capital even when the broader market is struggling. Trading Alpha-positive assets is one of the most effective ways to outperform the benchmark index.",
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
        "Correlation measures the degree to which two assets move in relation to each other. A correlation of +1.0 means they move in perfect lockstep. In crypto, most assets are highly correlated to Bitcoin. However, the most profitable opportunities often occur during 'Decoupling' events—when an asset breaks its link with BTC and begins to move independently. The AlphaSignal terminal tracks these shifts to help you identify rotational capital moving into specific sectors or tokens.",
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
        "Sentiment Synthesis is the bridge between social noise and actionable momentum. Our proprietary NLP models don't just 'search' for keywords; they analyze the authority of the speaker, the velocity of the discourse, and the underlying emotional valence of the market. This creates a real-time 'heat' index that highlights assets which are currently experiencing a psychological shift—often a leading indicator for institutional capital flows.",
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
            { icon: 'warning', title: 'Drawdown Modeling', desc: 'Simulating worst-case scenarios for your active positions. Understand your "VaR" (Value at Risk) in real-time as market conditions shift.' },
            { icon: 'balance', title: 'Exposure Balancing', desc: 'Analyzing cross-asset correlations to ensure your portfolio isn\'t unintentionally over-exposed to a single risk factor or thematic sector.' }
        ],
        [
            { title: 'Dynamic Sizing via Z-Score', text: 'When an asset\'s Z-score exceeded 4.0, the Risk module suggested a 60% reduction in new position sizing. This defensive posture saved users from a subsequent 12% volatility shake-out.' },
            { title: 'The Correlation Hedge', text: 'Identifying that three "independent" assets had spiked to a 0.98 correlation allowed users to reduce their net exposure by 30%, effectively neutralizing a cross-sector liquidation event.' }
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
        "The true power of AlphaSignal lies in the 'Synthesis'—the ability to combine uncorrelated data points to confirm an institutional setup. This playbook outlines the standard operating procedures (SOPs) used by professional quant desks to identify, validate, and execute trades using our real-time intelligence feeds.",
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
        "The structural DNA of the market—identifying the macro environment.",
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
            { icon: 'code', title: '/api/signals', desc: 'Get the latest Momentum Vector, Z-Score, and Alpha ranks for the entire 2,000+ asset universe in a single JSON payload.' },
            { icon: 'data_object', title: '/api/history', desc: 'Retrieve historical signal snapshots to train your own ML models or backtest custom strategy combinations.' },
            { icon: 'dataset', title: '/api/liquidity', desc: 'Access granular GOMM orderbook snapshots (Bids/Asks depth) across 15+ top-tier exchanges via a unified schema.' },
            { icon: 'security', title: 'Authentication', desc: 'Institutional API keys are encrypted with AES-256 and restricted by CIDR-based IP whitelisting for maximum security.' }
        ],
        [
            { title: 'Algorithmic Integration', text: 'A leading HF integrated our /api/signals into their execution engine to automatically toggle "Limit" vs "Market" orders based on real-time Z-Score volatility intensity.' }
        ],
        "Server-grade REST architecture with global CDN caching and 99.99% uptime for institutional endpoints."
    );
}

function renderDocsGlossaryImplementation() {
    renderExplainPage(
        "Terminal Glossary",
        "Institutional metrics and terminology for the modern quant trader.",
        "The AlphaSignal terminal utilizes proprietary and institutional-standard metrics. This glossary provides technical definitions for the most critical terms used across the platform.",
        [
            { icon: 'terminal', title: 'Alpha (%)', desc: 'Excess return relative to the BTC-USD benchmark. Positive Alpha indicates market leadership and idiosyncratic strength.' },
            { icon: 'database', title: 'Z-Score', desc: 'Statistical distance from the mean in standard deviations. Scores > ±2.0 identify significant momentum or exhaustion outliers.' },
            { icon: 'waves', title: 'Whale Flow', desc: 'Proprietary filtering of the trade tape to show only significant capital commitments (>$100k) from institutional-labeled entities.' },
            { icon: 'calculate', title: 'Sharpe Ratio', desc: 'Measure of risk-adjusted return. Calculated as (Portfolio Return - Risk-Free Rate) / Standard Deviation.' },
            { icon: 'show_chart', title: 'Beta', desc: 'Market sensitivity metric. A Beta of 1.5 means the asset is expected to move 1.5% for every 1% move in the BTC benchmark.' },
            { icon: 'timer', title: 'VWAP', desc: 'Volume Weighted Average Price. The definitive institutional benchmark for determining execution quality and fair value.' },
            { icon: 'analytics', title: 'Sortino Ratio', desc: 'Differentiated from Sharpe by only penalizing downside volatility, providing a clearer view of "bad" risk.' },
            { icon: 'view_list', title: 'Order Flow', desc: 'The real-time stream of buy/sell intents hitting the limit order books. High orderflow intensity often precedes price breaks.' }
        ],
        [],
        "Proprietary definitions derived from institutional trading desk standards and quantitative finance academic frameworks."
    );
}

function updateSEOMeta(view) {
    const viewMetadata = {
        'signals': {
            title: 'Live Alpha Signals',
            desc: 'Real-time multi-asset trading signals across crypto, equities, and forex derived from institutional data feeds.'
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
            title: 'Whale Pulse Monitor',
            desc: 'Institutional-sized transaction tracking and exchange flow alerts for rapid market insight.'
        },
        'pulse': {
            title: 'Institutional Market Pulse',
            desc: 'Real-time monitoring of Fear & Greed index, Lead-Lag signals, and systemic market health.'
        },
        'rotation': {
            title: 'Sector Rotation Matrix',
            desc: 'Advanced analysis of capital flows between asset classes and sectors to identify the next trend.'
        },
        'backtest': {
            title: 'Strategy Backtest Lab',
            desc: 'Quant-grade backtesting environment for validating trading strategies against historical institutional data.'
        },
        'risk': {
            title: 'Global Systemic Risk',
            desc: 'Real-time systemic risk monitoring, correlation spikes, and volatility regime detection.'
        },
        'narrative': {
            title: 'Narrative Galaxy Search',
            desc: 'Explore emerging market narratives and cluster shifts using NLP-driven trend analysis.'
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
        'home': {
            title: 'Institutional Intelligence Terminal',
            desc: 'AlphaSignal provides real-time multi-asset intelligence across crypto, equities, and forex. AI-driven alpha synthesis for the modern institution.'
        },
        'help': {
            title: 'Help & Documentation Hub',
            desc: 'Complete documentation on AlphaSignal methodologies, data sources, and analytical frameworks.'
        },
        'explain-signals': { title: 'Documentation — Signal Intelligence', desc: 'Learn how AlphaSignal utilizes Z-Score deviations and neural sentiment for alpha generation.' },
        'explain-briefing': { title: 'Documentation — AI Briefing', desc: 'Understand our dynamic neural synthesis and sector performance tracking.' },
        'explain-liquidity': { title: 'Documentation — Order Flow GOMM', desc: 'Documentation on interpreting liquidity walls and institutional tape.' },
        'explain-whales': { title: 'Documentation — Whale Pulse', desc: 'Learn how to detect and interpret massive on-chain transactions.' },
        'explain-mindshare': { title: 'Documentation — Narrative Galaxy', desc: 'Guide to using our NLP-driven social cluster visualization.' },
        'explain-benchmark': { title: 'Documentation — Portfolio Simulation', desc: 'How to model and backtest institutional crypto portfolios.' },
        'explain-alerts': { title: 'Documentation — Catalyst Monitor', desc: 'Tracking macro variables, token unlocks, and critical market events.' },
        'explain-zscore': { title: 'Documentation — Z-Score Interpretation', desc: 'Decoding statistical intensity and outlier detection for advanced volatility arbitrage.' },
        'explain-alpha': { title: 'Documentation — Alpha Strategy', desc: 'How to calculate and trade relative strength benchmarks vs Bitcoin to maximize institutional alpha.' },
        'explain-correlation': { title: 'Documentation — Market Correlation', desc: 'Understanding the mathematical relationship between assets and market-wide decoupling events.' },
        'explain-sentiment': { title: 'Documentation — Sentiment Synthesis', desc: 'How we process social mindshare and news flow using institutional-grade NLP.' },
        'explain-risk': { title: 'Documentation — Risk Management', desc: 'Institutional frameworks for protecting capital using volatility and drawdown modeling.' },
        'explain-playbook': { title: 'Documentation — Trading Playbook', desc: 'Advanced trading strategies and multi-signal institutional execution frameworks.' },
        'explain-regimes': { title: 'Documentation — Market Regimes', desc: 'Identifying market cycles through institutional flow, volatility, and sentiment analysis.' },
        'explain-api': { title: 'Documentation — Institutional API', desc: 'Programmatic access for real-time alpha signals, liquidity depth, and narrative intelligence.' },
        'explain-glossary': { title: 'Documentation — Terminal Glossary', desc: 'A quick-reference guide to all technical metrics used across the AlphaSignal platform.' }
    };

    const meta = viewMetadata[view] || {
        title: view.charAt(0).toUpperCase() + view.slice(1),
        desc: 'AlphaSignal Institutional Intelligence Terminal - Real-time signals and AI insights.'
    };

    const fullTitle = `${meta.title} | AlphaSignal — Institutional Crypto Intelligence`;
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

    // 4. Update JSON-LD (Breadcrumbs)
    const ldJsonEl = document.getElementById('ld-json');
    if (ldJsonEl) {
        const breadcrumb = {
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
        };
        ldJsonEl.textContent = JSON.stringify(breadcrumb);
    }

    console.log(`SEO Update: Full synchronization complete for view "${view}"`);
}

function switchView(view) {
    // Update SEO Meta
    updateSEOMeta(view);

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
            document.getElementById('sidebar').classList.remove('open');
        }
    }
}

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
            const isSignup = toggleAuthLink.textContent.includes('REQUEST_REGISTRATION');
            toggleAuthLink.textContent = isSignup ? 'ALREADY_HAVE_ACCESS? LOGIN' : 'NEED ACCESS? REQUEST_REGISTRATION';
            document.getElementById('login-btn').textContent = isSignup ? 'REGISTER_ACCOUNT' : 'LOGIN';
        });
    }

    document.querySelectorAll('.close-overlay').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('detail-overlay').classList.add('hidden');
            if (window.activeTape) window.activeTape.stop();
        });
    });

    document.getElementById('refresh-btn').addEventListener('click', () => renderSignals(currentSignalCategory));

    document.getElementById('global-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeSearch();
    });

    // Run auth check before data sync
    await checkAuthStatus();
    
    // Always start these for basic access (Signals and BTC are free)
    updateBTC();
    
    // Support deep-linking via URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = viewMap[urlParams.get('view')] ? urlParams.get('view') : 'home';
    switchView(initialView);
    startCountdown(); 
    
    // Intervals
    setInterval(updateBTC, 60000);
    if (isAuthenticatedUser && isPremiumUser) {
        syncAlerts(); 
        setInterval(syncAlerts, 60000);
    }
    
    // Debug hooks
    window.terminalLogout = logout;
    window.terminalSwitchView = switchView;
});
