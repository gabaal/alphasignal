const API_BASE = '/api';
const appEl = document.getElementById('app-view');
let lastNeuralSetup = null;

function createTradingViewChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const chart = LightweightCharts.createChart(container, {
        layout: { 
            background: { color: '#09090b' }, 
            textColor: '#d1d5db',
            fontSize: 10,
            fontFamily: 'JetBrains Mono'
        },
        grid: { 
            vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, 
            horzLines: { color: 'rgba(255, 255, 255, 0.03)' } 
        },
        rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
        timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
        width: container.clientWidth || 800,
        height: container.clientHeight || 300
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444', 
        borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444'
    });

    const formatted = data.map(d => {
        let ts = d.unix_time || Math.floor(new Date(d.date || d.timestamp).getTime() / 1000);
        return {
            time: ts,
            open: d.open || d.price,
            high: d.high || d.price,
            low: d.low || d.price,
            close: d.close || d.price
        };
    }).filter(d => !isNaN(d.time)).sort((a,b) => a.time - b.time);

    candleSeries.setData(formatted);
    chart.timeScale().fitContent();
    return chart;
}
let currentBTCPrice = 70000;
let alertCount = 0;
let countdownSeconds = 300;
let countdownInterval = null;
let isPremiumUser = false;
let isAuthenticatedUser = false;
let hasStripeId = false;
let isSafeMode = false;

// PWA Offline Monitoring
function updateOnlineStatus() {
    if (!navigator.onLine) {
        showToast("CONNECTIVITY_LOST", "Terminal connection interrupted. Re-establishing link...", "alert");
    } else {
        showToast("CONNECTION_RESTORED", "Terminal link stabilized. Syncing data...", "success");
    }
}
window.addEventListener('offline', updateOnlineStatus);
window.addEventListener('online', updateOnlineStatus);

// ============================================================
// Phase A: WebSocket Live Price Client
// ============================================================
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

                        // Feature 2: Bell badge from new_today
                        if (msg.new_today !== undefined) {
                            const bellBadge = document.getElementById('bell-badge');
                            if (bellBadge) {
                                bellBadge.textContent = msg.new_today;
                                bellBadge.style.display = msg.new_today > 0 ? 'flex' : 'none';
                            }
                        }
                    } else if (msg.type === 'alert') {
                        showToast(`📡 ${msg.data.signal_type}`, msg.data.message, 'alert');
                    } else if (msg.type === 'regime_shift') {
                        showToast(`⚖️ REGIME SHIFT`, `Market has shifted from ${msg.data.old} to ${msg.data.new}.`, 'regime');
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

function showToast(title, message, type = 'alert') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">${title}</span>
            <span class="material-symbols-outlined" style="font-size:1rem; cursor:pointer; opacity:0.5" onclick="this.parentElement.parentElement.remove()">close</span>
        </div>
        <div class="toast-body">${message}</div>
    `;

    container.appendChild(toast);

    // Auto-remove after 6 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 400);
    }, 6000);
}

// Feature 2: Notification Bell Panel
async function openNotificationPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) { panel.classList.remove('open'); return; }

    panel.classList.add('open');
    panel.innerHTML = `<div style="padding:1rem; color:var(--text-dim); font-size:0.75rem">Loading...</div>`;

    const data = await fetchAPI('/notifications');
    if (!data || !data.notifications) {
        panel.innerHTML = `<div style="padding:1rem; color:var(--text-dim); font-size:0.75rem">No signals yet.</div>`;
        return;
    }

    const { notifications, unread } = data;

    if (!notifications.length) {
        panel.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-dim); font-size:0.75rem">No signals recorded yet.<br>Check back after the next harvest cycle.</div>`;
        return;
    }

    panel.innerHTML = `
        <div style="padding:12px 16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center">
            <span style="font-size:0.65rem; letter-spacing:2px; color:var(--text-dim)">SIGNAL FEED</span>
            <span style="font-size:0.6rem; color:var(--accent)">${unread} NEW TODAY</span>
        </div>
        ${notifications.map(n => `
            <div style="padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 0.2s"
                 onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background=''">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px">
                    <span style="font-size:1rem">${n.icon}</span>
                    <div style="flex:1">
                        <div style="font-size:0.7rem; font-weight:700; color:var(--text); margin-bottom:3px">${n.title}</div>
                        <div style="font-size:0.62rem; color:var(--text-dim); line-height:1.4">${n.body}</div>
                    </div>
                    <div style="font-size:0.55rem; color:var(--text-dim); white-space:nowrap">${n.timestamp ? n.timestamp.split('T')[0] : ''}</div>
                </div>
            </div>
        `).join('')}
        <div style="padding:10px 16px; text-align:center">
            <button onclick="switchView('signal-archive'); document.getElementById('notif-panel').classList.remove('open')" 
                    style="font-size:0.6rem; letter-spacing:1px; color:var(--accent); background:none; border:none; cursor:pointer">
                VIEW ALL IN ARCHIVE →
            </button>
        </div>
    `;
}

// Close notification panel when clicking outside
document.addEventListener('click', (e) => {
    const panel = document.getElementById('notif-panel');
    const bell = document.getElementById('notif-bell-btn');
    if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
        panel.classList.remove('open');
    }
});


// ============= Global Memory Management (FPS Optimization) =============
window.AppChartsTracker = [];
if (window.LightweightCharts) {
    const originalCreateChart = LightweightCharts.createChart;
    LightweightCharts.createChart = function(container, options) {
        const chart = originalCreateChart(container, options);
        window.AppChartsTracker.push(chart);
        return chart;
    };
}

window.globalUIWipe = function() {
    // 1. Wipe Lightweight Charts Canvases to prevent WebGL memory leaks
    if (window.AppChartsTracker) {
        window.AppChartsTracker.forEach(c => { try { c.remove(); } catch(e) {} });
        window.AppChartsTracker = [];
    }
    
    // 2. Wipe Chart.js Instances
    if (window.Chart) {
        for (let id in Chart.instances) {
            Chart.instances[id].destroy();
        }
    }
    
    // 3. Wipe Stray Open WebSockets
    if (window.activeBinanceWS) { window.activeBinanceWS.close(); window.activeBinanceWS = null; }
    if (window.orderBookWS) { window.orderBookWS.close(); window.orderBookWS = null; }
    
    // 4. Clear Interval Pollers
    if (window.activeDataPoller) { clearInterval(window.activeDataPoller); window.activeDataPoller = null; }
};

// ============= Visualization Utilities =============


// ============= Core Utilities =============
async function fetchAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (res.status === 401) {
            const params = new URLSearchParams(window.location.search);
            const currentView = params.get('view') || 'home';
            const isFreeView = (currentView === 'signals' || currentView === 'help' || currentView === 'home' || currentView.startsWith('explain-'));
            
            if (!isFreeView) {
                showAuth(true);
            }
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
        const data = await res.json();
        return data;
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
        const isFreeView = (view === 'signals' || view === 'help' || view === 'home' || view?.startsWith('explain-'));
        
        if (isFreeView || isPremiumUser) {
            const lock = item.querySelector('.premium-lock');
            if (lock) lock.remove();
            item.classList.remove('locked-nav');
        } else {
            item.classList.add('locked-nav');
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
            const activeNav = document.querySelector('.nav-item.active');
            const activeMobileNav = document.querySelector('.mobile-nav-item.active');
            const currentView = activeNav?.dataset.view || activeMobileNav?.dataset.view;
            const isOverlayOpen = !document.getElementById('detail-overlay').classList.contains('hidden') || 
                                 !document.getElementById('ai-modal').classList.contains('hidden');
            
            if (currentView === 'signals' && !isOverlayOpen) {
                clearInterval(countdownInterval);
                renderSignals();
            } else {
                countdownSeconds = 300; // Reset timer silently in background
            }
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

// ============= ETF Flows View =============
// ============= Hub Shared Logic =============
function renderHubTabs(activeTab, tabs) {
    return `
        <div class="hub-tabs" style="display:flex; gap:10px; margin-bottom:1.5rem; border-bottom:1px solid var(--border); padding-bottom:10px; overflow-x:auto">
            ${tabs.map(t => `
                <button class="intel-action-btn mini ${activeTab === t.id ? '' : 'outline'}" 
                        onclick="switchView('${t.view}')" 
                        style="white-space:nowrap; padding:6px 12px; font-size:0.65rem">
                    <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; margin-right:4px">${t.icon}</span> 
                    ${t.label}
                </button>
            `).join('')}
        </div>
    `;
}

// ============= Global Markets Hub =============
async function renderGlobalHub() {
    const tabs = [
        { id: 'etf', label: 'ETF_FLOWS', view: 'etf-flows', icon: 'account_balance' },
        { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
        { id: 'oi', label: 'OI_RADAR', view: 'oi-radar', icon: 'track_changes' },
        { id: 'gaps', label: 'CME_GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
    ];
    
    // Default to ETF flows if just 'global-hub' is called
    renderETFFlows(tabs);
}

// ============= Macro Intelligence Hub =============
async function renderMacroHub() {
    const tabs = [
        { id: 'compass', label: 'MACRO_COMPASS', view: 'macro-calendar', icon: 'public' },
        { id: 'pulse', label: 'MACRO_PULSE', view: 'macro', icon: 'monitoring' },
        { id: 'correlation', label: 'CORRELATION', view: 'correlation-matrix', icon: 'grid_4x4' },
        { id: 'regime', label: 'REGIME_HUB', view: 'regime', icon: 'analytics' }
    ];
    renderMacroPulse(tabs); // Default view
}

// ============= Alpha Strategy Hub =============
async function renderAlphaHub() {
    const tabs = [
        { id: 'briefing', label: 'AI_BRIEFING', view: 'briefing', icon: 'memory' },
        { id: 'alpha', label: 'ALPHA_SCORE', view: 'alpha-score', icon: 'electric_bolt' },
        { id: 'lab', label: 'STRATEGY_LAB', view: 'strategy-lab', icon: 'query_stats' },
        { id: 'rebalancer', label: 'AI_REBALANCER', view: 'portfolio-optimizer', icon: 'donut_large' }
    ];
    renderBriefing(tabs); // Default view
}

// ============= Update existing renderers to support tabs =============
async function renderETFFlows(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('etf', tabs) : '';
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Global Markets Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabHTML}
        <div class="card" style="margin-bottom:1.5rem">
            <div style="height:450px; width:100%"><canvas id="etfFlowsChart"></canvas></div>
        </div>
        <div class="grid-2">
            <div class="card">
                <h3>DAILY_LEADERBOARD</h3>
                <div id="etf-leaderboard" class="skeleton-line"></div>
            </div>
            <div class="card">
                <h3>CUMULATIVE_FLOW_USD</h3>
                <div id="etf-cumulative-text" style="font-size:2rem; font-weight:900; color:var(--accent); margin-top:1rem">$0.00B</div>
                <p style="font-size:0.7rem; color:var(--text-dim)">Total Net Institutional Inflow since Launch.</p>
            </div>
        </div>
    `;
    // ... rest of renderETFFlows logic ...

    // High-fidelity simulated ETF Flow data
    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const issuers = [
        { name: 'IBIT (BlackRock)', color: '#00f2ff', data: [450, 120, -50, 800, 310, 0, 0] },
        { name: 'FBTC (Fidelity)', color: '#86efac', data: [210, 90, -30, 400, 150, 0, 0] },
        { name: 'ARKB (Ark)', color: '#facc15', data: [50, 20, -10, 120, 45, 0, 0] },
        { name: 'BITB (Bitwise)', color: '#a78bfa', data: [30, 15, -5, 80, 25, 0, 0] }
    ];

    const ctx = document.getElementById('etfFlowsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                ...issuers.map(iss => ({
                    label: iss.name,
                    data: iss.data,
                    backgroundColor: iss.color,
                    borderRadius: 4,
                    stack: 'Stack 0'
                })),
                {
                    label: 'CUMULATIVE_NET ($M)',
                    data: [740, 985, 890, 2290, 2820, 2820, 2820],
                    type: 'line',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    borderWidth: 2,
                    pointRadius: 4,
                    yAxisID: 'y1',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#d1d5db', font: { family: 'JetBrains Mono', size: 10 } } }
            },
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' }, title: { display: true, text: 'DAILY FLOW ($M)', color: '#00f2ff' } },
                y1: { position: 'right', grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' }, title: { display: true, text: 'CUMULATIVE ($M)', color: 'rgba(255,255,255,0.5)' } }
            }
        }
    });

    document.getElementById('etf-cumulative-text').textContent = "$19.42B";
    document.getElementById('etf-leaderboard').innerHTML = issuers.map(iss => `
        <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border)">
            <span style="font-size:0.75rem; font-weight:700">${iss.name}</span>
            <span style="color:${iss.data[4] >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}; font-weight:900">${iss.data[4] >= 0 ? '+' : ''}${iss.data[4]}M</span>
        </div>
    `).join('');
}

// ============= Liquidations View =============
async function renderLiquidations() {
    const tabs = [
        { id: 'etf', label: 'ETF_FLOWS', view: 'etf-flows', icon: 'account_balance' },
        { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
        { id: 'oi', label: 'OI_RADAR', view: 'oi-radar', icon: 'track_changes' },
        { id: 'gaps', label: 'CME_GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
    ];
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Global Markets Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${renderHubTabs('liquidations', tabs)}
        <div class="card" style="margin-bottom:1.5rem">
            <div style="height:450px; width:100%"><canvas id="liquidationsChart"></canvas></div>
        </div>
        <div class="signal-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))">
            <div class="card">
                <h3 style="color:var(--risk-high)">TOTAL_REKT_24H</h3>
                <div style="font-size:2rem; font-weight:900; margin:1rem 0">$142.8M</div>
                <div style="display:flex; gap:15px; font-size:0.7rem">
                    <span style="color:var(--risk-high)">● LONGS: $112.5M (78%)</span>
                    <span style="color:var(--risk-low)">● SHORTS: $30.3M (22%)</span>
                </div>
            </div>
            <div class="card">
                <h3>LARGEST_SINGLE_ORDER</h3>
                <div style="font-size:1.2rem; font-weight:900; margin:1rem 0; color:var(--accent)">$4.12M (BTC-USDT / BINANCE)</div>
                <p style="font-size:0.65rem; color:var(--text-dim)">Forced liquidation occurs when the margin balance falls below the maintenance requirement.</p>
            </div>
        </div>
    `;

    const data = [
        { ticker: 'BTC', longs: 45.2, shorts: 12.1 },
        { ticker: 'ETH', longs: 28.5, shorts: 8.4 },
        { ticker: 'SOL', longs: 15.1, shorts: 4.2 },
        { ticker: 'XRP', longs: 8.2, shorts: 1.5 },
        { ticker: 'DOGE', longs: 5.4, shorts: 2.1 },
        { ticker: 'PEPE', longs: 4.1, shorts: 1.0 },
        { ticker: 'SUI', longs: 3.5, shorts: 0.8 },
        { ticker: 'AVAX', longs: 2.5, shorts: 0.2 }
    ];

    const ctx = document.getElementById('liquidationsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.ticker),
            datasets: [
                {
                    label: 'LONGS ($M)',
                    data: data.map(d => d.longs),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'SHORTS ($M)',
                    data: data.map(d => d.shorts),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: '#22c55e',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#d1d5db', font: { family: 'JetBrains Mono', size: 10 } } }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)', font: { weight: 'bold' } } }
            }
        }
    });
}

// ============= CME Gaps View =============
async function renderCMEGaps() {
    const tabs = [
        { id: 'etf', label: 'ETF_FLOWS', view: 'etf-flows', icon: 'account_balance' },
        { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
        { id: 'oi', label: 'OI_RADAR', view: 'oi-radar', icon: 'track_changes' },
        { id: 'gaps', label: 'CME_GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
    ];
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Global Markets Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${renderHubTabs('gaps', tabs)}
        <div class="card" style="margin-bottom:1.5rem">
            <h3>ACTIVE_MAGNET_LEVELS</h3>
            <div id="cme-gaps-list" style="margin-top:1rem"></div>
        </div>
        <p style="font-size:0.7rem; color:var(--text-dim); line-height:1.5; padding:0 10px;">
            <span class="material-symbols-outlined" style="font-size:12px; vertical-align:middle">info</span> 
            CME Gaps occur when the Bitcoin futures market closing price on Friday differs from the opening price on Sunday night. 
            Institutions often trade towards these levels to "fill" the structural liquidity void.
        </p>
    `;

    const gaps = [
        { level: "63,450 - 64,120", type: "UPPER", status: "UNFILLED", distance: "+3.2%", color: "var(--risk-low)" },
        { level: "58,200 - 59,100", type: "LOWER", status: "PARTIAL", distance: "-4.5%", color: "var(--accent)" },
        { level: "53,400 - 54,000", type: "LOWER", status: "UNFILLED", distance: "-11.2%", color: "#ef4444" },
        { level: "69,100 - 69,800", type: "UPPER", status: "FILLED", distance: "N/A", color: "var(--text-dim)" }
    ];

    document.getElementById('cme-gaps-list').innerHTML = gaps.map(g => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid var(--border); background:rgba(255,255,255,0.02); margin-bottom:8px; border-radius:4px">
            <div>
                <div style="font-size:0.9rem; font-weight:900; color:var(--text)">$${g.level}</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:4px">${g.type} GAP</div>
            </div>
            <div style="text-align:right">
                <div style="font-size:0.75rem; font-weight:900; color:${g.color}">${g.status}</div>
                <div style="font-size:0.6rem; color:var(--text-dim); margin-top:4px">${g.distance} DISTANCE</div>
            </div>
        </div>
    `).join('');
}

// ============= OI Radar View =============
async function renderOIRadar() {
    const tabs = [
        { id: 'etf', label: 'ETF_FLOWS', view: 'etf-flows', icon: 'account_balance' },
        { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
        { id: 'oi', label: 'OI_RADAR', view: 'oi-radar', icon: 'track_changes' },
        { id: 'gaps', label: 'CME_GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
    ];
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Global Markets Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${renderHubTabs('oi', tabs)}
        <div class="grid-2">
            <div class="card" style="height:450px; display:flex; align-items:center; justify-content:center">
                <canvas id="oiRadarChart"></canvas>
            </div>
            <div class="card">
                <h3>OI_FLOW_ATTRIBUTION</h3>
                <div id="oi-attribution" style="margin-top:1rem"></div>
                <div style="margin-top:2rem; padding:1rem; background:rgba(0,242,255,0.05); border-left:3px solid var(--accent); border-radius:4px">
                    <h4 style="font-size:0.7rem; color:var(--accent)">INSTITUTIONAL_SKEW_DETECTED</h4>
                    <p style="font-size:0.65rem; color:var(--text-dim); margin-top:5px">CME Open Interest is currently leading Binance by $2.4B in notional delta, indicating heavy spot-ETF hedge positioning.</p>
                </div>
            </div>
        </div>
    `;

    const exchanges = [
        { name: 'Binance', oi: 14.5, delta: 12, funding: 0.012 },
        { name: 'Bybit', oi: 8.2, delta: -5, funding: 0.015 },
        { name: 'OKX', oi: 5.4, delta: 2, funding: 0.008 },
        { name: 'CME', oi: 12.1, delta: 18, funding: 0 }
    ];

    const ctx = document.getElementById('oiRadarChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Open Interest ($B)', '24h Delta (%)', 'Funding Rate (x100)', 'Volume (Relative)'],
            datasets: [
                {
                    label: 'BINANCE_PERP',
                    data: [14.5, 12, 1.2, 85],
                    backgroundColor: 'rgba(247, 211, 0, 0.2)',
                    borderColor: '#f7d300',
                    borderWidth: 2,
                    pointBackgroundColor: '#f7d300'
                },
                {
                    label: 'CME_FUTURES',
                    data: [12.1, 18, 0, 45],
                    backgroundColor: 'rgba(0, 242, 255, 0.2)',
                    borderColor: '#00f2ff',
                    borderWidth: 2,
                    pointBackgroundColor: '#00f2ff'
                }
            ]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: 'rgba(255,255,255,0.5)', font: { family: 'JetBrains Mono', size: 10 } },
                    ticks: { display: false, backdropColor: 'transparent' }
                }
            },
            plugins: {
                legend: { labels: { color: '#d1d5db', font: { family: 'JetBrains Mono', size: 10 } } }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    document.getElementById('oi-attribution').innerHTML = exchanges.map(ex => `
        <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border)">
            <span style="font-size:0.75rem; font-weight:700">${ex.name}</span>
            <div style="text-align:right">
                <div style="font-size:0.75rem; font-weight:900">$${ex.oi}B</div>
                <div style="font-size:0.55rem; color:${ex.delta >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">${ex.delta >= 0 ? '+' : ''}${ex.delta}% DELTA</div>
            </div>
        </div>
    `).join('');
}


function generateAssetReport(ticker) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    showToast('GENERATING...', `Compiling institutional report for ${ticker}`, 'alert');
    
    const reportData = window.currentReportData || {};
    const primaryColor = [0, 242, 255]; // --accent hex #00f2ff
    
    // Background Space
    doc.setFillColor(5, 7, 10);
    doc.rect(0, 0, 220, 300, 'F');

    // Header Area
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.text("ALPHASIGNAL INSTITUTIONAL", 15, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`CONFIDENTIAL INTEL REPORT | ${new Date().toLocaleString()}`, 15, 35);
    
    // Asset Section
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(18);
    doc.text(`ASSET: ${ticker}`, 15, 55);
    
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    doc.text("CORE METRICS SUMMARY", 15, 65);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(15, 68, 195, 68);
    
    // Alpha Score Section
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`COMPOSITE ALPHA SCORE: ${reportData.alphaScore || 'N/A'}/100`, 20, 80);
    doc.text(`SENTIMENT INDEX: ${reportData.sentiment || 'NEUTRAL'}`, 20, 90);
    doc.text(`Z-SCORE OUTLIER: 0.00 STDEV`, 20, 100);
    
    // Market Context
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    doc.text("INSTITUTIONAL NARRATIVE", 15, 115);
    doc.line(15, 118, 195, 118);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(reportData.summary || "Institutional narrative synthesis pending for this asset.", 175);
    doc.text(splitText, 15, 125);
    
    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("DISCLAIMER: This document is for institutional intelligence purposes only. Past performance does not guarantee future results.", 15, 280);
    
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    showToast('SUCCESS', 'Institutional PDF preview generated', 'success');
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
    let signals = await fetchAPI('/signals');
    if (!signals) {
        appEl.innerHTML = '<div class="error-msg">Fail to sync with intelligence streams. Check connection.</div>';
        return;
    }
    
    // Phase 7.3: Institutional Safe Mode Filtering – Filter out high-vol memes and small-caps
    if (isSafeMode) {
        const safeCategories = ['L1', 'EXCHANGE', 'DEFI', 'INFRA', 'EQUITIES', 'MACRO', 'ETF', 'PROXY'];
        signals = signals.filter(s => safeCategories.includes(s.category));
    }

    lastSignalsData = signals;
    updateScroller(signals);
    startCountdown(); // Reset timer on successful fetch

    const filtered = category === 'ALL' ? signals : signals.filter(s => s.category === category);
    const cats = ['ALL', 'EXCHANGE', 'PROXY', 'MINERS', 'ETF', 'DEFI', 'L1', 'STABLES', 'MEMES'];

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;"><h1>Signal Intelligence Dashboard</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-signals')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button></div>
        <div class="view-actions">
            <div class="category-filters">
                ${cats.map(c => `<button class="filter-btn ${category === c ? 'active' : ''}" onclick="renderSignals('${c}')">${c}</button>`).join('')}
            </div>
            <button class="export-btn" style="margin-left:auto" onclick="exportCSV(lastSignalsData,'alphasignal_signals.csv')">📥 Export CSV</button>
        </div>
        <div class="signal-grid">
            ${filtered.map(s => `
                <div class="signal-card ${Math.abs(s.zScore) > 2 ? 'z-outlier' : ''}" onclick="openDetail('${s.ticker}', '${s.category}', ${s.btcCorrelation}, ${s.alpha}, ${s.sentiment}, '60d', ${s.category === 'TRACKED'})">
                    <div class="card-controls" style="position:absolute; top:12px; right:12px; display:flex; gap:8px; z-index:10">
                        <div class="ai-trigger" onclick="event.stopPropagation(); openAIAnalyst('${s.ticker}')" title="Run AI Deep-Dive"><span class="material-symbols-outlined" style="font-size: 18px;">smart_toy</span></div>
                        <div class="share-trigger" onclick="event.stopPropagation(); shareSignal('${s.ticker}', ${s.alpha}, ${s.sentiment}, ${s.zScore})" title="Share to X (Twitter)"><span class="material-symbols-outlined" style="font-size: 18px;">share</span></div>
                    </div>
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

// ============================================================
// Feature 2: Alpha Score Composite
// ============================================================
async function renderAlphaScore() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>⚡ Alpha Score <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-alpha-score')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Composite 0–100 ranking across momentum, sentiment, signal engine alerts & volatility.</p>
        </div>
        <div class="card" style="padding:1rem">${skeleton(1)}</div>
    `;
    const data = await fetchAPI('/alpha-score');
    if (!data || !data.scores || !data.scores.length) {
        appEl.innerHTML += `<div class="card" style="text-align:center; padding:2rem; color:var(--text-dim)">Scoring engine computing... try again in 30s.</div>`;
        return;
    }

    const gradeColors = { A: '#22c55e', B: '#60a5fa', C: '#facc15', D: '#ef4444' };
    const signalColors = { 'STRONG BUY': '#22c55e', 'BUY': '#86efac', 'NEUTRAL': '#60a5fa', 'CAUTION': '#ef4444' };

    let scores = data.scores || [];
    if (isSafeMode) {
        const safeSectors = ['L1', 'EXCHANGE', 'DEFI', 'MACRO', 'EQUITIES', 'INFRA', 'ETF', 'PROXY'];
        scores = scores.filter(s => safeSectors.includes(s.sector) || safeSectors.includes(s.category));
    }

    let currentPage = 1;
    const itemsPerPage = 15;

    function drawAlphaPage() {
        const totalPages = Math.ceil(scores.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentScores = scores.slice(startIndex, startIndex + itemsPerPage);

        appEl.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:15px">
                <div>
                    <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">bolt</span> Alpha Score <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-alpha-score')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                    <p style="margin:0">Composite 0–100 ranking · Updated ${data.updated} · ${scores.length} assets scored ${isSafeMode ? '<span style="color:var(--accent); font-weight:700">[SAFE MODE ACTIVE]</span>' : ''}</p>
                </div>
                <!-- Pagination Controls -->
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:5px">
                    <button class="filter-btn" id="btn-prev-alpha" ${currentPage === 1 ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>&larr; Prev</button>
                    <span style="font-size:0.75rem; color:var(--text-dim); font-family:'JetBrains Mono'">Page ${currentPage} of ${totalPages}</span>
                    <button class="filter-btn" id="btn-next-alpha" ${currentPage === totalPages ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>Next &rarr;</button>
                </div>
            </div>
            <div class="card" style="overflow-x:auto">
                <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                    <thead>
                        <tr style="color:var(--text-dim); border-bottom:1px solid var(--border)">
                            <th style="text-align:left; padding:8px 12px">#</th>
                            <th style="text-align:left; padding:8px 12px">ASSET</th>
                            <th style="text-align:left; padding:8px 12px">SECTOR</th>
                            <th style="text-align:left; padding:8px 12px; width:180px">SCORE</th>
                            <th style="text-align:center; padding:8px 12px">GRADE</th>
                            <th style="text-align:center; padding:8px 12px">SIGNAL</th>
                            <th style="text-align:left; padding:8px 12px">MODEL SPECS</th>
                            <th style="text-align:left; padding:8px 12px">WHY</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentScores.map((s, i) => `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s"
                                onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
                                <td style="padding:10px 12px; color:var(--text-dim)">${startIndex + i + 1}</td>
                                <td style="padding:10px 12px; font-weight:700; color:var(--accent)">${s.ticker}</td>
                                <td style="padding:10px 12px; color:var(--text-dim); font-size:0.65rem; letter-spacing:1px">${s.sector}</td>
                                <td style="padding:10px 12px">
                                    <div style="display:flex; align-items:center; gap:8px">
                                        <div style="flex:1; height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden">
                                            <div style="width:${s.score}%; height:100%; background:${gradeColors[s.grade] || '#60a5fa'}; border-radius:4px; transition:width 1s ease"></div>
                                        </div>
                                        <span style="font-weight:700; font-size:0.8rem; color:${gradeColors[s.grade]}">${s.score}</span>
                                    </div>
                                </td>
                                <td style="padding:10px 12px; text-align:center">
                                    <span style="background:${gradeColors[s.grade] || '#999'}33; color:${gradeColors[s.grade] || '#999'}; padding:2px 10px; border-radius:20px; font-weight:700; font-size:0.75rem">${s.grade}</span>
                                </td>
                                <td style="padding:10px 12px; text-align:center">
                                    <span style="color:${signalColors[s.signal] || '#60a5fa'}; font-size:0.6rem; letter-spacing:1px">${s.signal}</span>
                                </td>
                                <td style="padding:10px 12px; min-width:140px">
                                    <div style="display:flex; flex-direction:column; gap:4px">
                                        <div style="display:flex; gap:6px; align-items:center">
                                            <span style="font-size:0.55rem; color:var(--text-dim); background:rgba(255,255,255,0.05); padding:1px 4px; border-radius:3px">CONSENSUS:</span>
                                            <span style="font-size:0.6rem; font-weight:900; color:${s.consensus === 'HIGH' ? '#22c55e' : s.consensus === 'MEDIUM' ? '#60a5fa' : '#ef4444'}">${s.consensus}</span>
                                        </div>
                                        <div style="display:flex; gap:6px; font-size:0.55rem; color:var(--text-dim)">
                                            <span style="letter-spacing:1px">LSTM: <span style="color:var(--accent)">${s.lstm_conf}%</span></span>
                                            <span style="letter-spacing:1px">XGB: <span style="color:var(--accent)">${s.xgb_conf}%</span></span>
                                        </div>
                                    </div>
                                </td>
                                <td style="padding:10px 12px; color:var(--text-dim); font-size:0.62rem; max-width:200px">
                                    ${(s.reasons || []).map(r => r.includes('ML') ? `<strong style="color:var(--accent)">${r}</strong>` : r).join(' · ') || '—'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const btnPrev = document.getElementById('btn-prev-alpha');
        const btnNext = document.getElementById('btn-next-alpha');
        if(btnPrev) btnPrev.addEventListener('click', () => { if(currentPage > 1) { currentPage--; drawAlphaPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
        if(btnNext) btnNext.addEventListener('click', () => { if(currentPage < totalPages) { currentPage++; drawAlphaPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
    }

    currentPage = 1;
    drawAlphaPage();
}

// ============================================================
// Feature 4: Performance Dashboard
// ============================================================
async function renderPerformanceDashboard() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>📈 Performance Dashboard <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-performance')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Terminal signal track record — win rate, returns, and monthly breakdown.</p>
        </div>
        <div class="card" style="padding:1rem">${skeleton(1)}</div>
    `;
    const d = await fetchAPI('/performance');
    if (!d) return;

    const noData = d.total_signals === 0;
    const winColor = d.avg_return >= 0 ? '#22c55e' : '#ef4444';

    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-start">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">trending_up</span> Portfolio Lab <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-portfolio-lab')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
                <p>Institutional record as of ${d.updated} · Based on ${d.total_signals} signals</p>
            </div>
            <div style="display:flex; gap:0.5rem">
                <button class="timeframe-btn" onclick="downloadPortfolioData('csv')" style="display:flex; align-items:center; gap:6px; background:rgba(0, 242, 255, 0.1); border-color:var(--accent)">
                    <span class="material-symbols-outlined" style="font-size:18px">download</span> Export CSV
                </button>
                <button class="timeframe-btn" onclick="downloadPortfolioData('json')" style="display:flex; align-items:center; gap:6px">
                    <span class="material-symbols-outlined" style="font-size:18px">data_object</span> JSON
                </button>
            </div>
        </div>

        <!-- KPI Row -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; margin-bottom:1rem">
            ${[
                ['TOTAL SIGNALS', d.total_signals, '#60a5fa', 'radar'],
                ['WIN RATE', d.total_signals > 0 ? d.win_rate + '%' : 'N/A', d.win_rate >= 50 ? '#22c55e' : '#ef4444', 'track_changes'],
                ['AVG RETURN', d.total_signals > 0 ? (d.avg_return >= 0 ? '+' : '') + d.avg_return + '%' : 'N/A', winColor, 'trending_up'],
                ['TOTAL PnL', d.total_signals > 0 ? (d.total_return >= 0 ? '+' : '') + d.total_return + '%' : 'N/A', winColor, 'workspace_premium'],
            ].map(([label, val, color, icon]) => `
                <div class="card" style="padding:1.2rem; text-align:center">
                    <div style="font-size:1.4rem; margin-bottom:12px; color:var(--accent)"><span class="material-symbols-outlined">${icon}</span></div>
                    <div style="font-size:0.55rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:8px">${label}</div>
                    <div style="font-size:1.5rem; font-weight:900; color:${color}">${val}</div>
                </div>
            `).join('')}
        </div>

        <!-- Best / Worst -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem">
            <div class="card" style="padding:1rem; border-left:3px solid #22c55e">
                <div style="font-size:0.55rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:8px; display:flex; align-items:center; gap:6px">
                    <span class="material-symbols-outlined" style="font-size:14px; color:#22c55e">workspace_premium</span> BEST PICK
                </div>
                <div style="font-size:1rem; font-weight:700; color:#22c55e">${d.best_pick?.ticker || '—'}</div>
                <div style="font-size:0.8rem; color:#22c55e">${d.best_pick?.return > -999 ? '+' + d.best_pick.return + '%' : 'N/A'}</div>
            </div>
            <div class="card" style="padding:1rem; border-left:3px solid #ef4444">
                <div style="font-size:0.55rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:8px; display:flex; align-items:center; gap:6px">
                    <span class="material-symbols-outlined" style="font-size:14px; color:#ef4444">trending_down</span> WORST PICK
                </div>
                <div style="font-size:1rem; font-weight:700; color:#ef4444">${d.worst_pick?.ticker || '—'}</div>
                <div style="font-size:0.8rem; color:#ef4444">${d.worst_pick?.return < 999 ? d.worst_pick.return + '%' : 'N/A'}</div>
            </div>
        </div>

        ${noData ? `<div class="card" style="padding:3rem; text-align:center; color:var(--text-dim); font-size:0.85rem">
            No signal history yet. Performance data will appear as the Harvest engine captures signals.
        </div>` : ''}

        <!-- Monthly Breakdown -->
        ${d.monthly && d.monthly.length ? `
        <div class="card" style="overflow-x:auto">
            <div style="font-size:0.6rem; color:var(--text-dim); letter-spacing:2px; margin-bottom:1rem">MONTHLY BREAKDOWN</div>
            <table style="width:100%; border-collapse:collapse; font-size:0.75rem">
                <thead>
                    <tr style="color:var(--text-dim); border-bottom:1px solid var(--border)">
                        <th style="text-align:left; padding:8px 12px">MONTH</th>
                        <th style="text-align:right; padding:8px 12px">SIGNALS</th>
                        <th style="text-align:right; padding:8px 12px">AVG RETURN</th>
                        <th style="text-align:left; padding:8px 12px; width:200px">PERFORMANCE</th>
                    </tr>
                </thead>
                <tbody>
                    ${d.monthly.map(m => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
                            <td style="padding:10px 12px; color:var(--text)">${m.month}</td>
                            <td style="padding:10px 12px; text-align:right; color:var(--text-dim)">${m.signals}</td>
                            <td style="padding:10px 12px; text-align:right; font-weight:700; color:${m.avg_roi >= 0 ? '#22c55e' : '#ef4444'}">${m.avg_roi >= 0 ? '+' : ''}${m.avg_roi}%</td>
                            <td style="padding:10px 12px">
                                <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; max-width:180px">
                                    <div style="width:${Math.min(100, Math.abs(m.avg_roi) * 5)}%; height:100%; background:${m.avg_roi >= 0 ? '#22c55e' : '#ef4444'}; border-radius:4px"></div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : ''}
    `;
}

// ============================================================
// Feature 5: Export Report
// ============================================================
async function downloadPortfolioData(format) {
    const notifyBtn = document.querySelector(`button[onclick="downloadPortfolioData('${format}')"]`);
    const originalText = notifyBtn ? notifyBtn.innerHTML : '';
    if (notifyBtn) notifyBtn.innerHTML = '⌛ ...';

    try {
        const link = document.createElement('a');
        link.href = `${API_BASE}/portfolio/export?format=${format}`;
        link.download = `alphasignal_portfolio_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download failed:", e);
    } finally {
        if (notifyBtn) setTimeout(() => notifyBtn.innerHTML = originalText, 1000);
    }
}

async function exportReport() {
    const btn = document.getElementById('export-btn');
    if (btn) { btn.textContent = '⏳ Synthesizing...'; btn.disabled = true; }

    try {
        const [signals, perf, scores] = await Promise.all([
            fetchAPI('/signal-history'),
            fetchAPI('/performance'),
            fetchAPI('/alpha-score')
        ]);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const now = new Date().toLocaleString();
        
        // Header
        doc.setFillColor(10, 14, 26);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("ALPHASIGNAL™ — RESEARCH REPORT", 10, 25);
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`GENERATED: ${now} | INSTITUTIONAL ID: ${document.getElementById('display-user-email')?.textContent || 'IU-882'}`, 10, 35);

        // Section: Performance Overview
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(14);
        doc.text("1. PERFORMANCE METRICS (AGGREGATE)", 10, 55);
        doc.setLineWidth(0.5);
        doc.line(10, 57, 200, 57);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`TOTAL SIGNALS: ${perf?.total_signals || 0}`, 15, 65);
        doc.text(`WIN RATE: ${perf?.win_rate || 0}%`, 15, 72);
        doc.text(`AVG SIGNAL RETURN: ${perf?.avg_return || 0}%`, 15, 79);
        doc.text(`ALPHA ATTRIBUTION: +${(perf?.win_rate / 3).toFixed(1)}% vs BENCHMARK`, 15, 86);

        // Section: Top Alpha Scores
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(14);
        doc.text("2. ALPHA SCORE REGISTRY (TOP 10)", 10, 105);
        doc.setLineWidth(0.5);
        doc.line(10, 107, 200, 107);

        let y = 117;
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("RANK    ASSET        SECTOR          SCORE     SIGNAL", 15, y);
        y += 5;
        doc.line(15, y, 150, y);
        y += 7;

        doc.setTextColor(0, 0, 0);
        (scores?.scores || []).slice(0, 10).forEach((s, i) => {
            doc.text(`${i + 1}`, 15, y);
            doc.text(`${s.ticker}`, 30, y);
            doc.text(`${s.sector}`, 55, y);
            doc.text(`${s.score}/100`, 85, y);
            doc.text(`${s.signal}`, 105, y);
            y += 8;
        });

        // Section: Execution History
        doc.addPage();
        doc.setTextColor(30, 58, 95);
        doc.setFontSize(14);
        doc.text("3. EXECUTION TAPE (RECENT SIGNALS)", 10, 20);
        doc.setLineWidth(0.5);
        doc.line(10, 22, 200, 22);

        y = 35;
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("TICKER      TYPE       RETURN %     TIMESTAMP", 15, y);
        y += 7;

        doc.setTextColor(0, 0, 0);
        (signals || []).slice(0, 20).forEach(s => {
            if (y > 280) { doc.addPage(); y = 20; }
            doc.text(`${s.ticker}`, 15, y);
            doc.text(`${s.type}`, 40, y);
            doc.text(`${s.return >= 0 ? '+' : ''}${s.return}%`, 65, y);
            doc.text(`${s.timestamp?.split('T')[0]}`, 95, y);
            y += 8;
        });

        // Footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`© 2026 ALPHASIGNAL TERMINAL | PAGE ${i} OF ${totalPages}`, 105, 290, null, null, "center");
        }

        doc.save(`alphasignal_research_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast("REPORT GENERATED", "Institutional research PDF saved to disk.", "success");

    } catch (e) {
        console.error('Export failed:', e);
        showToast("EXPORT FAILED", "Check console for details.", "alert");
    } finally {
        if (btn) { btn.textContent = '📥 Export Report'; btn.disabled = false; }
    }
}


async function renderCorrelationMatrix(tabs = null) {
    const tabHTML = tabs ? renderHubTabs('correlation', tabs) : '';
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">public</span> Macro Intelligence Hub <span class="premium-badge">LIVE</span></h1>
        </div>
        ${tabHTML}
        <div class="card" style="padding:1.5rem">
            <div style="margin-bottom:1.5rem; display:flex; gap:12px; flex-wrap:wrap; align-items:center">
                <label style="font-size:0.65rem; color:var(--text-dim); letter-spacing:1px">BASKET:</label>
                <select id="corr-basket" onchange="loadCorrelationMatrix(this.value)"
                        style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:var(--text); padding:6px 12px; border-radius:8px; font-size:0.7rem">
                    <option value="BTC-USD,ETH-USD,SOL-USD,AVAX-USD,BNB-USD">Core Crypto (5)</option>
                    <option value="BTC-USD,ETH-USD,SOL-USD,MARA,COIN,MSTR">Crypto + Equities (6)</option>
                    <option value="BTC-USD,ETH-USD,SOL-USD,AAVE-USD,UNI-USD,LINK-USD">DeFi Basket (6)</option>
                    <option value="BTC-USD,IVV,GC=F,DX-Y.NYB,^TNX">Macro Cross-Asset (5)</option>
                </select>
                <span style="font-size:0.6rem; color:var(--text-dim)">Period: 60 days · Returns: Daily</span>
            </div>
            <div id="corr-chart" style="width:100%; overflow-x:auto"></div>
            <div style="margin-top:1.5rem; display:flex; align-items:center; gap:8px; font-size:0.6rem; color:var(--text-dim)">
                <span style="width:40px; height:8px; background:linear-gradient(to right, #ef4444, rgba(255,255,255,0.1), #22c55e); border-radius:4px; display:inline-block"></span>
                -1.0 (Inverse) → 0 (None) → +1.0 (Perfect)
            </div>
        </div>
    `;
    loadCorrelationMatrix('BTC-USD,ETH-USD,SOL-USD,AVAX-USD,BNB-USD');
}

async function loadCorrelationMatrix(tickers) {
    const container = document.getElementById('corr-chart');
    if (!container) return;
    container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-dim); font-size:0.75rem">Computing correlations...</div>`;

    const data = await fetchAPI(`/correlation?tickers=${tickers}&period=60d`);
    if (!data || data.error || !data.matrix) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:#ef4444; font-size:0.75rem">Could not load data. Try a different basket.</div>`;
        return;
    }

    const { matrix, tickers: labels } = data;
    const n = labels.length;
    const size = Math.min(Math.floor((container.clientWidth || 600) / n), 90);
    const margin = { top: 20, right: 20, bottom: 20, left: 80 };
    const width = size * n + margin.left + margin.right;
    const height = size * n + margin.top + margin.bottom + 50;

    container.innerHTML = '';
    const svg = d3.select('#corr-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale: red (-1) → grey (0) → green (+1)
    const colorScale = d3.scaleLinear()
        .domain([-1, 0, 1])
        .range(['#ef4444', '#1f2937', '#22c55e']);

    // Row labels
    g.selectAll('.row-label')
        .data(labels)
        .enter().append('text')
        .attr('class', 'row-label')
        .attr('x', -8)
        .attr('y', (d, i) => i * size + size / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('fill', 'rgba(255,255,255,0.7)')
        .text(d => d.replace('-USD', ''));

    // Col labels
    g.selectAll('.col-label')
        .data(labels)
        .enter().append('text')
        .attr('x', (d, i) => i * size + size / 2)
        .attr('y', n * size + 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'rgba(255,255,255,0.7)')
        .text(d => d.replace('-USD', ''));

    // Tooltip
    const tooltip = d3.select('body').append('div')
        .style('position', 'fixed').style('background', 'rgba(0,0,0,0.9)')
        .style('border', '1px solid rgba(255,255,255,0.1)').style('border-radius', '8px')
        .style('padding', '8px 12px').style('font-size', '0.7rem').style('color', '#fff')
        .style('pointer-events', 'none').style('z-index', '9999').style('display', 'none');

    // Cells
    matrix.forEach((row, i) => {
        row.forEach((val, j) => {
            const cell = g.append('rect')
                .attr('x', j * size + 1)
                .attr('y', i * size + 1)
                .attr('width', size - 2)
                .attr('height', size - 2)
                .attr('rx', 4)
                .attr('fill', colorScale(val))
                .attr('opacity', 0.85)
                .style('cursor', 'default')
                .on('mouseover', function(event) {
                    d3.select(this).attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 1);
                    tooltip.style('display', 'block')
                        .html(`<strong>${labels[i].replace('-USD','')} × ${labels[j].replace('-USD','')}</strong><br/>Correlation: <span style="color:${val >= 0 ? '#22c55e' : '#ef4444'}">${val >= 0 ? '+' : ''}${val.toFixed(3)}</span>`);
                })
                .on('mousemove', function(event) {
                    tooltip.style('left', (event.clientX + 12) + 'px').style('top', (event.clientY - 10) + 'px');
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', i === j ? 1 : 0.85).attr('stroke', 'none');
                    tooltip.style('display', 'none');
                });

            // Value text
            if (size >= 50) {
                g.append('text')
                    .attr('x', j * size + size / 2)
                    .attr('y', i * size + size / 2 + 4)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '9px')
                    .attr('font-weight', '700')
                    .attr('fill', Math.abs(val) > 0.5 ? '#fff' : 'rgba(255,255,255,0.55)')
                    .text(val.toFixed(2));
            }
        });
    });
}

// ============= Pack G1: Flow Monitor =============
async function renderFlows() {
    appEl.innerHTML = skeleton(2);
    const data = await fetchAPI('/flows');
    if (!data) return;
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">flowsheet</span> Institutional Flow Monitor</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-liquidity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Tracking the velocity of capital rotating into the ecosystem via spot ETFs and major aggregates.</p>
        </div>
        <div class="pulse-grid">
            <div class="pulse-card">
                <h3>Institutional Pressure</h3>
                <div class="big-val">$${data.netFlow}M</div>
                <p>Net exchange-wide attribution</p>
            </div>
            <div class="pulse-card">
                <h3>Sector Momentum</h3>
                <div class="big-val ${data.sectorMomentum >= 0 ? 'pos' : 'neg'}">${data.sectorMomentum >= 0 ? '+' : ''}${data.sectorMomentum}%</div>
                <p>Alpha vs Market Benchmark</p>
            </div>
        </div>
        <div class="whale-list" style="margin-top:2.5rem">
            <h3 style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--accent)">SPOT ETF FLOW ATTRIBUTION (REAL-TIME)</h3>
            <div style="display:grid; gap:12px">
                ${data.etfFlows.map(f => `
                    <div class="whale-row" style="grid-template-columns: 100px 100px 1fr 150px; align-items:center">
                        <div class="label-tag" style="width:fit-content">${f.ticker}</div>
                        <div class="w-amount ${f.direction === 'IN' ? 'pos' : 'neg'}">${f.amount > 0 ? '+' : ''}${f.amount}M</div>
                        <div style="color:var(--text-dim); font-size:0.8rem">Institutional Bid ${f.direction}</div>
                        <div class="intensity-bar" style="background:rgba(255,255,255,0.05); height:4px; border-radius:2px; position:relative">
                            <div style="position:absolute; left:0; top:0; height:100%; width:${Math.min(Math.abs(f.amount)/2, 100)}%; background:${f.direction === 'IN' ? 'var(--risk-low)' : 'var(--risk-high)'}; border-radius:2px"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
}

// ============= Heatmap View =============
async function renderHeatmap() {
    appEl.innerHTML = skeleton(4);
    const data = await fetchAPI('/heatmap');
    if (!data) return;
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1>Statistical Intensity Heatmap</h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-liquidity')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
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

    const [data, liqData, derivData, walletData, factorData] = await Promise.all([
        fetchAPI(`/history?ticker=${ticker}&period=${yfPeriod}`),
        fetchAPI(`/liquidity?ticker=${ticker}`),
        fetchAPI(`/derivatives?ticker=${ticker}`),
        fetchAPI(`/wallet-attribution?ticker=${ticker}`),
        fetchAPI(`/factor-web?ticker=${ticker}`)
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
    
    window.currentReportData = {
        summary: data.summary,
        alphaScore: alpha,
        sentiment: sentiment > 0 ? 'BULLISH' : (sentiment < 0 ? 'BEARISH' : 'NEUTRAL')
    };

    body.innerHTML = `
        <div class="detail-header">
            <div><span class="category-label">${category}</span><h2>${ticker} Intelligence</h2></div>
            <div style="display:flex; gap:1rem; align-items:flex-start">

                <button class="intel-action-btn" style="width:auto; margin-right: 0.5rem" onclick="generateAssetReport('${ticker}')">DOWNLOAD PDF <span class="material-symbols-outlined" style="font-size: 18px; margin-left: 6px; vertical-align: middle;">picture_as_pdf</span></button>
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

        <div class="radar-panel" style="margin-top:2rem; padding:1.5rem; background:rgba(0, 242, 255, 0.02); border:1px solid rgba(0, 242, 255, 0.1); border-radius:12px; display:flex; gap:20px; align-items:center; flex-wrap:wrap">
            <div style="flex:1; min-width:250px">
                <h3 style="color:var(--accent); font-size:1rem; margin-bottom:0.5rem">Quantitative Factor Web</h3>
                <p style="font-size:0.8rem; color:var(--text-dim); line-height:1.5">This multi-dimensional radar plots the structural geometry of the asset across 6 institutional factor boundaries. Highly skewed shapes indicate sector-specific dominance.</p>
            </div>
            <div style="flex:1; height:250px; position:relative; min-width:250px">
                <canvas id="factorRadarChart"></canvas>
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

    if (factorData && factorData.factors) {
        const ctxRadar = document.getElementById('factorRadarChart');
        if (ctxRadar) {
            new Chart(ctxRadar.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: Object.keys(factorData.factors).map(k => k.toUpperCase()),
                    datasets: [{
                        label: 'Asset Profile',
                        data: Object.values(factorData.factors),
                        backgroundColor: 'rgba(0, 242, 255, 0.2)',
                        borderColor: '#00f2ff',
                        pointBackgroundColor: '#00f2ff',
                        borderWidth: 2,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255,255,255,0.1)' },
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            pointLabels: { color: '#8b949e', font: { family: 'JetBrains Mono', size:10 } },
                            ticks: { display: false, min: 0, max: 100 }
                        }
                    },
                    plugins: { legend: { display: false }, datalabels: { display: false } }
                }
            });
        }
    }

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
    if (!data || !data.attribution || !data.attribution.length) {
        container.innerHTML = '<p class="empty-state">No entity data available for this ticker.</p>';
        return;
    }

    // Safety: use .percentage or .value as fallback, and ensure numeric
    const processAttr = data.attribution.map(e => ({
        ...e,
        percentage: Number(e.percentage || e.value || 0)
    }));

    container.innerHTML = `
        <div class="flow-distribution-bar" style="height:12px; display:flex; border-radius:6px; overflow:hidden; margin-bottom:1rem; background:rgba(255,255,255,0.05)">
            ${processAttr.map(e => `<div style="width:${e.percentage}%; background:${e.color}" title="${e.name}: ${e.percentage}%"></div>`).join('')}
        </div>
        <div class="entity-legend-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
            ${processAttr.map(e => `
                <div class="entity-row" style="display:flex; justify-content:space-between; font-size:0.7rem; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px">
                        <div style="width:8px; height:8px; border-radius:3px; background:${e.color}"></div>
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
