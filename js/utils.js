const API_BASE = '/api';
// ================================================================
// THEME MANAGER � Light / Dark mode
// ================================================================
(function initTheme() {
    const saved = localStorage.getItem('alpha-theme') || 'dark';
    applyTheme(saved, false);
})();

function applyTheme(theme, animate) {
    const root = document.documentElement;
    if (animate) {
        root.style.transition = 'background 0.3s, color 0.3s';
        setTimeout(() => { root.style.transition = ''; }, 400);
    }
    if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
    } else {
        root.removeAttribute('data-theme');
    }
    // Update toggle button UI
    const icon  = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon)  icon.textContent  = theme === 'light' ? 'dark_mode'  : 'light_mode';
    if (label) label.textContent = theme === 'light' ? 'DARK MODE'  : 'LIGHT MODE';

    // Persist
    localStorage.setItem('alpha-theme', theme);
    window._currentTheme = theme;
}

window.toggleTheme = function() {
    const current = localStorage.getItem('alpha-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    showToast('THEME', next === 'light' ? 'Light mode activated' : 'Dark mode activated', 'success');
};

// Expose current theme for TradingView widget colour injection
window.getTVTheme = function() {
    return (localStorage.getItem('alpha-theme') || 'dark') === 'light' ? 'light' : 'dark';
};
const appEl = document.getElementById('app-view');
let lastNeuralSetup = null;

// Global State & Auth Variables
var isPremiumUser = false;
var isAuthenticatedUser = false;
var hasStripeId = false;

var currentBTCPrice = 70000;
var alertCount = 0;
var countdownSeconds = 30;
var countdownInterval = null;

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
function showToast(title, message, type = 'alert') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // B12: cap at 5 simultaneous toasts — evict oldest when full
    const MAX_TOASTS = 5;
    const existing = container.querySelectorAll('.toast');
    if (existing.length >= MAX_TOASTS) {
        existing[0].style.transition = 'opacity 0.2s';
        existing[0].style.opacity = '0';
        setTimeout(() => existing[0].remove(), 200);
    }

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

// ════════════════════════════════════════════════════════════════
// v1.56 Feature: Live Signal Alert Toast
// Fires a rich branded notification when a new signal is detected.
// ════════════════════════════════════════════════════════════════
function showSignalToast(signal) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // B12: cap at 5 simultaneous toasts — evict oldest when full
    const MAX_TOASTS = 5;
    const existing = container.querySelectorAll('.toast');
    if (existing.length >= MAX_TOASTS) {
        existing[0].style.transition = 'opacity 0.2s';
        existing[0].style.opacity = '0';
        setTimeout(() => existing[0].remove(), 200);
    }

    const dir = (signal.direction || 'LONG').toUpperCase();
    const ticker = (signal.ticker || signal.asset || 'BTC').toUpperCase();
    const zscore = signal.z_score != null ? parseFloat(signal.z_score).toFixed(2) : '—';
    const isLong = dir === 'LONG' || dir === 'BUY';
    const dirColor = isLong ? '#00d4aa' : '#ef4444';
    const dirArrow = isLong ? '▲' : '▼';
    const dirBg   = isLong ? 'rgba(0,212,170,0.12)' : 'rgba(239,68,68,0.12)';

    const toast = document.createElement('div');
    toast.className = 'toast signal-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <div style="width:8px;height:8px;border-radius:50%;background:${dirColor};box-shadow:0 0 8px ${dirColor};flex-shrink:0;animation:pulse-live 1.2s infinite"></div>
            <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;color:${dirColor}">NEW SIGNAL DETECTED</span>
            <span style="margin-left:auto;font-size:1rem;cursor:pointer;opacity:0.4;color:#fff" onclick="this.closest('.toast').remove()">✕</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
            <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:6px 12px;font-size:1rem;font-weight:900;font-family:'JetBrains Mono',monospace;color:#fff;flex-shrink:0">${ticker}</div>
            <div style="background:${dirBg};border:1px solid ${dirColor};border-radius:6px;padding:4px 10px;font-size:0.8rem;font-weight:900;color:${dirColor}">${dirArrow} ${dir}</div>
            <div style="background:rgba(188,19,254,0.12);border:1px solid rgba(188,19,254,0.35);border-radius:6px;padding:4px 10px;font-size:0.8rem;font-weight:700;color:#bc13fe;font-family:'JetBrains Mono',monospace">Z: ${zscore}</div>
        </div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <span style="font-size:0.65rem;color:rgba(255,255,255,0.4);flex:1">High-confidence alpha detected by ML engine</span>
            <button onclick="switchView('alerts');this.closest('.toast').remove()" style="background:linear-gradient(135deg,rgba(0,212,170,0.25),rgba(0,212,170,0.1));border:1px solid rgba(0,212,170,0.4);color:#00d4aa;padding:4px 10px;border-radius:6px;font-size:0.6rem;font-weight:900;cursor:pointer;letter-spacing:1px;white-space:nowrap">VIEW ALERT →</button>
        </div>
    `;

    container.appendChild(toast);

    // Auto-dismiss after 8s
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 8000);
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
    if (window.BinanceSocketManager) { window.BinanceSocketManager.closeAll(); }
    
    // 4. Clear Interval Pollers
    if (window.activeDataPoller) { clearInterval(window.activeDataPoller); window.activeDataPoller = null; }
};

// ============= WebSocket Global Manager =============
window.BinanceSocketManager = {
    sockets: {},
    callbacks: {},
    
    subscribe: function(symbol, streamName, callback) {
        const streamId = `${symbol.toLowerCase()}@${streamName}`;
        if (this.sockets[streamId] && this.sockets[streamId].readyState === WebSocket.OPEN) {
            this.callbacks[streamId] = callback;
            return;
        }
        
        try {
            const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamId}`);
            this.sockets[streamId] = ws;
            this.callbacks[streamId] = callback;
            
            ws.onmessage = (e) => {
                if (this.callbacks[streamId]) this.callbacks[streamId](JSON.parse(e.data));
            };
            ws.onerror = (e) => console.error(`[WS Error] ${streamId}`, e);
            ws.onclose = () => { delete this.sockets[streamId]; };
        } catch (err) {
            console.error(`[WS Connection Failed] ${streamId}`, err);
        }
    },
    
    closeAll: function() {
        Object.keys(this.sockets).forEach(id => {
            try { this.sockets[id].close(); } catch(e) {}
        });
        this.sockets = {};
        this.callbacks = {};
        console.log("[BinanceSocketManager] All Background OrderBook Streams Paused.");
    }
};

// ============= Visualization Utilities =============


// ============= Core Utilities =============
async function fetchAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (res.status === 401) {
            // Auth endpoints return 401 for bad credentials — don't redirect, let the caller handle it
            const isAuthEndpoint = endpoint.startsWith('/auth/');
            if (isAuthEndpoint) {
                // Return the error body so handleAuth() can display it
                return await res.json().catch(() => ({ error: 'Invalid credentials.' }));
            }

            const params = new URLSearchParams(window.location.search);
            const currentView = params.get('view') || 'home';
            // PUBLIC: no auth needed at all
            const isPublicView = (
                currentView === 'signals' || currentView === 'home' ||
                currentView === 'help' || currentView.startsWith('explain-')
            );
            if (!isPublicView) {
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
        
        // PUBLIC: always visible, no lock
        const isPublicView = (
            view === 'signals' || view === 'home' || view === 'help' ||
            view?.startsWith('explain-')
        );
        // FREE: visible only when logged in
        const isFreeView = isPublicView || view === 'command-center' || view === 'free-tier';
        
        const canAccess = isPremiumUser || isFreeView || (isAuthenticatedUser && isFreeView);
        
        if (isPremiumUser || isPublicView) {
            // Premium or public — fully unlock, remove all locks
            const lock = item.querySelector('.premium-lock');
            if (lock) lock.remove();
            item.classList.remove('locked-nav');
        } else if (isAuthenticatedUser && isFreeView) {
            // Logged-in free user can access free-tier views
            const lock = item.querySelector('.premium-lock');
            if (lock) lock.remove();
            item.classList.remove('locked-nav');
        } else if (!isAuthenticatedUser && isFreeView && !isPublicView) {
            // Not logged in, free-tier view — show login lock
            item.classList.add('locked-nav');
            if (!item.querySelector('.premium-lock')) {
                const lock = document.createElement('span');
                lock.className = 'premium-lock material-symbols-outlined';
                lock.setAttribute('aria-label', 'Login required');
                lock.textContent = 'login';
                item.appendChild(lock);
            }
        } else {
            // Premium-gated view
            item.classList.add('locked-nav');
            if (!item.querySelector('.premium-lock')) {
                const lock = document.createElement('span');
                lock.className = 'premium-lock material-symbols-outlined';
                lock.setAttribute('aria-label', 'Premium required');
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
    countdownSeconds = 30;
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
                countdownSeconds = 30; // Reset timer silently in background
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
    if (val == null || isNaN(val)) return '$—';
    const abs = Math.abs(val);
    let decimals;
    if      (abs === 0)      decimals = 2;
    else if (abs >= 1)       decimals = 2;
    else if (abs >= 0.01)    decimals = 4;
    else if (abs >= 0.0001)  decimals = 6;
    else                     decimals = 8;
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(val);
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
    if (!window.isPremiumUser) {
        showPaywall(true);
        return;
    }
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
