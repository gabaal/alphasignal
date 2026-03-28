const API_BASE = '/api';
const appEl = document.getElementById('app-view');
let lastNeuralSetup = null;

// Global State & Auth Variables
var isPremiumUser = false;
var isAuthenticatedUser = false;
var hasStripeId = false;
var isSafeMode = false;
var currentBTCPrice = 70000;
var alertCount = 0;
var countdownSeconds = 300;
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
    if (!isAuthenticatedUser) {
        showAuth(true);
        showToast("AUTHENTICATION REQUIRED", "Please login to run AI research deep-dives.", "alert");
        return;
    }

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
async function openDetail(ticker, category, correlation = 0, alpha = 0, sentiment = 0, period = '60d', isTracked = false) {
    if (!isAuthenticatedUser) {
        showAuth(true);
        showToast("AUTHENTICATION REQUIRED", "Please login to access institutional intelligence.", "alert");
        return;
    }

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

async function runStrategyBacktest(ticker, strategy, fast = 20, slow = 50) {
    const data = await fetchAPI(`/backtest?ticker=${ticker}&strategy=${strategy}&fast=${fast}&slow=${slow}`);
    if (!data || !data.summary) return;
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">science</span> Strategy Lab <span class="premium-badge pulse">PRO</span></h1> <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView('explain-playbook')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
            <p>Validate quantitative alphas using high-fidelity historical simulations.</p>
        </div>

        <div class="strategy-workspace" style="display:grid; grid-template-columns: 320px 1fr; gap:30px">
            <div class="strategy-controls">
                <div class="control-box">
                    <label>ASSET SELECTION</label>
                    <select id="strat-ticker" class="strat-select" onchange="runStrategyBacktest(this.value, document.getElementById('strat-type').value, document.getElementById('strat-fast')?.value || 20, document.getElementById('strat-slow')?.value || 50)">
                        <option value="BTC-USD" ${ticker === 'BTC-USD' ? 'selected' : ''}>BTC-USD (Bitcoin)</option>
                        <option value="ETH-USD" ${ticker === 'ETH-USD' ? 'selected' : ''}>ETH-USD (Ethereum)</option>
                        <option value="SOL-USD" ${ticker === 'SOL-USD' ? 'selected' : ''}>SOL-USD (Solana)</option>
                        <option value="MSTR" ${ticker === 'MSTR' ? 'selected' : ''}>MSTR (MicroStrategy)</option>
                        <option value="COIN" ${ticker === 'COIN' ? 'selected' : ''}>COIN (Coinbase)</option>
                        <option value="MARA" ${ticker === 'MARA' ? 'selected' : ''}>MARA (Marathon)</option>
                    </select>
                </div>

                <div class="control-box">
                    <label>QUANT STRATEGY</label>
                    <select id="strat-type" class="strat-select" onchange="runStrategyBacktest(document.getElementById('strat-ticker').value, this.value, document.getElementById('strat-fast')?.value || 20, document.getElementById('strat-slow')?.value || 50)">
                        <option value="trend_regime" ${strategy === 'trend_regime' ? 'selected' : ''}>EMA Crossover (Custom)</option>
                        <option value="volatility_breakout" ${strategy === 'volatility_breakout' ? 'selected' : ''}>Volatility Breakout (Keltner)</option>
                        <option value="rsi_mean_revert" ${strategy === 'rsi_mean_revert' ? 'selected' : ''}>RSI Mean Reversion (Trend-Filtered)</option>
                        <option value="bollinger_bands" ${strategy === 'bollinger_bands' ? 'selected' : ''}>Bollinger Band Mean Reversion</option>
                        <option value="vwap_cross" ${strategy === 'vwap_cross' ? 'selected' : ''}>VWAP Crossover (EMA5 Anchor)</option>
                        <option value="macd_momentum" ${strategy === 'macd_momentum' ? 'selected' : ''}>MACD Momentum (12/26/9)</option>
                        <option value="stochastic_cross" ${strategy === 'stochastic_cross' ? 'selected' : ''}>Stochastic Oscillator Cross</option>
                        <option value="z_score" ${strategy === 'z_score' ? 'selected' : ''}>Statistical Arbitrage (Z-Score Core)</option>
                        <option value="supertrend" ${strategy === 'supertrend' ? 'selected' : ''}>Adaptive Supertrend Volatility System</option>
                        <option value="obv_flow" ${strategy === 'obv_flow' ? 'selected' : ''}>Smart Money Flow Divergence (OBV/CVD)</option>
                    </select>
                </div>
                
                <div class="control-box" style="margin-top: 15px; display: flex; gap: 10px;">
                    <div style="flex:1">
                        <label>FAST MA</label>
                        <input type="number" id="strat-fast" class="strat-input" value="${fast}" style="width:100%; border-radius:8px; padding:10px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:white; font-family:'Outfit'" onchange="runStrategyBacktest(document.getElementById('strat-ticker').value, document.getElementById('strat-type').value, this.value, document.getElementById('strat-slow').value)">
                    </div>
                    <div style="flex:1">
                        <label>SLOW MA</label>
                        <input type="number" id="strat-slow" class="strat-input" value="${slow}" style="width:100%; border-radius:8px; padding:10px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:white; font-family:'Outfit'" onchange="runStrategyBacktest(document.getElementById('strat-ticker').value, document.getElementById('strat-type').value, document.getElementById('strat-fast').value, this.value)">
                    </div>
                </div>
                
                <div class="lab-metrics-grid" style="margin-top:2rem">
                    <div class="mini-stat">
                        <label>SHARPE RATIO</label>
                        <div class="val">${data.summary.sharpe}</div>
                    </div>
                    <div class="mini-stat">
                        <label>MAX DRAWDOWN</label>
                        <div class="val neg">-${Math.abs(data.summary.maxDrawdown)}%</div>
                    </div>
                    <div class="mini-stat">
                        <label>WIN RATE</label>
                        <div class="val">${data.summary.winRate}%</div>
                    </div>
                </div>

                <button class="intel-action-btn" style="margin-top: 2rem; width: 100%" onclick="shareStrategyResult('${ticker}', ${data.summary.totalReturn})">
                    <span class="material-symbols-outlined">share</span> SHARE PERFORMANCE
                </button>
                <button class="intel-action-btn" style="margin-top: 10px; width: 100%; background:rgba(0, 242, 255, 0.05); border-color:var(--accent); color:var(--accent)" onclick="window.downloadBacktestCSV('${ticker}', '${strategy}')">
                    <span class="material-symbols-outlined" style="font-size:16px">download</span> EXPORT CSV
                </button>
            </div>

            <div class="strategy-results">
                <div class="backtest-summary-cards" style="display:flex; gap:20px; margin-bottom:20px">
                    <div class="summary-card main-return">
                        <label>STRATEGY RETURN (180D)</label>
                        <div class="val ${data.summary.totalReturn >= 0 ? 'pos' : 'neg'}">${data.summary.totalReturn >= 0 ? '+' : ''}${data.summary.totalReturn}%</div>
                    </div>
                    <div class="summary-card bench-return">
                        <label>BENCHMARK (BTC)</label>
                        <div class="val ${data.summary.benchmarkReturn !== undefined ? (data.summary.benchmarkReturn >= 0 ? 'pos' : 'neg') : (data.summary.btcReturn >= 0 ? 'pos' : 'neg')}">${data.summary.benchmarkReturn !== undefined ? (data.summary.benchmarkReturn >= 0 ? '+' : '') + data.summary.benchmarkReturn : (data.summary.btcReturn >= 0 ? '+' : '') + data.summary.btcReturn}%</div>
                    </div>
                    <div class="summary-card alpha-card">
                        <label>EXCESS ALPHA</label>
                        <div class="val pos">${data.summary.alpha >= 0 ? '+' : ''}${data.summary.alpha}%</div>
                    </div>
                </div>

                <div id="strat-tv-container" style="height: 300px; margin-bottom: 20px; background:rgba(0,0,0,0.3); border-radius:12px; border:1px solid rgba(255,255,255,0.05); overflow:hidden"></div>
                <div class="chart-container" style="height: 250px; background: rgba(0,0,0,0.1); border-radius:16px; border:1px solid var(--border); padding: 20px">
                    <canvas id="strategyChart"></canvas>
                </div>

                <div class="glass-card" style="margin-top: 20px; padding: 20px">
                    <div class="card-header" style="margin-bottom:15px">
                        <h3>Monte Carlo Trajectory Matrix</h3>
                        <span class="label-tag">PROBABILITY</span>
                    </div>
                    <div style="height: 350px; position:relative;">
                        <canvas id="monteCarloChart"></canvas>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 15px; display:flex; gap:20px; text-align:center">
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px"><span style="color:#00f2ff">SIMULATIONS:</span><br>20 Paths</div>
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px"><span style="color:#facc15">HORIZON:</span><br>30 Days</div>
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px" id="mc-sigma-label"><span style="color:#bc13fe">VOLATILITY:</span><br>--</div>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px; padding: 20px">
                    <div class="card-header" style="margin-bottom:15px">
                        <h3>Guppy Multiple Moving Average (GMMA)</h3>
                        <span class="label-tag">TREND MECHANICS</span>
                    </div>
                    <div style="height:350px; width:100%; position:relative; border-radius:8px; overflow:hidden">
                        <canvas id="guppyChart"></canvas>
                    </div>
                    <div style="margin-top:15px; font-size:0.75rem; color:var(--text-dim); line-height:1.5">
                        The Guppy Density Ribbon stacks an array of 15 overlapping Exponential Moving Averages. Structural compression signals imminent breakout probability across institutional limits.
                    </div>
                </div>

            </div>
        </div>
    `;

    // Initialize Institutional Visuals
    const curve = data.equityCurve || data.weeklyReturns;
    window.lastBacktestData = curve;
    const histResp = await fetchAPI(`/history?ticker=${ticker}&period=180d`);
    if (histResp && histResp.history && histResp.history.length > 0) {
        createTradingViewChart('strat-tv-container', histResp.history);
        renderGuppyRibbon(histResp.history);
    }
    renderStrategyChart(curve);

    try {
        const mcData = await fetchAPI(`/monte-carlo?ticker=${ticker}`);
        if (mcData && mcData.paths) {
            document.getElementById('mc-sigma-label').innerHTML = `<span style="color:#bc13fe">VOLATILITY:</span><br>${mcData.sigma}% (Ann.)`;
            renderMonteCarloChart(mcData);
        }
    } catch(e) {}
}

function shareStrategyResult(ticker, returns) {
    const text = `Validating my alpha on ${ticker} with AlphaSignal Strategy Lab. Strategy Return: ${returns}% (180D). 🚀 #AlphaSignal #CryptoIntelligence`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
}

// ============= Newsroom View =============
let currentNewsPage = 1;
const newsPerPage = 5;

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

async function loadRiskMatrix(tickers = null) {
    if (tickers) window.currentRiskTickers = tickers;
    const currentTickers = window.currentRiskTickers || 'BTC-USD,ETH-USD,SOL-USD,MARA,COIN,MSTR,BNB-USD,XRP-USD,ADA-USD,DOGE-USD';
    const period = document.getElementById('matrix-period')?.value || '60d';
    
    // UI Update for buttons
    const btns = document.querySelectorAll('#risk-matrix-filters .filter-btn');
    btns.forEach(b => {
        if (b.getAttribute('onclick')?.includes(currentTickers)) b.classList.add('active');
        else b.classList.remove('active');
    });

    const container = document.getElementById('matrix-container');
    const data = await fetchAPI(`/correlation?tickers=${currentTickers}&period=${period}`);
    
    if (!data || data.error) {
        container.innerHTML = `<div class="error-msg">Matrix Load Failed: ${data?.error || 'Unknown Error'}</div>`;
        return;
    }

    const tks = currentTickers.split(',');
    container.innerHTML = `
        <div style="margin-bottom:2rem; padding:1.5rem; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:12px">
            <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">ASSET RISK PROFILE (EFFICIENT FRONTIER)</h3>
            <div style="height:250px; position:relative">
                <canvas id="riskScatterChart"></canvas>
            </div>
        </div>
        <div class="rotation-matrix-container">
            <div class="matrix-grid" style="grid-template-columns: 100px repeat(${tks.length}, 1fr)">
                <div></div>
                ${tks.map(t => `<div class="matrix-label horizontal" style="font-size:0.6rem">${t.split('-')[0]}</div>`).join('')}
                ${data.matrix.map((row, i) => `
                    <div class="matrix-label vertical" style="font-size:0.6rem; height:40px">${tks[i].split('-')[0]}</div>
                    ${row.map(val => {
                        const intensity = Math.abs(val);
                        const color = val >= 0 ? `rgba(0, 242, 255, ${intensity * 0.8})` : `rgba(255, 107, 107, ${intensity * 0.8})`;
                        return `<div class="matrix-cell" style="background:${color}; height:40px; font-size:0.7rem; border:0.5px solid rgba(255,255,255,0.05)" title="${tks[i]} vs ${tks[row.indexOf(val)]}: ${val}">${val.toFixed(2)}</div>`;
                    }).join('')}
                `).join('')}
            </div>
        </div>
        <div style="margin-top:2rem; padding:1.5rem; background:rgba(0,242,255,0.05); border:1px solid var(--accent); border-radius:12px">
            <h4 style="color:var(--accent); margin-bottom:0.5rem">Institutional Insight</h4>
            <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.6">
                A correlation above <b>0.85</b> indicates high institutional synchronization. When systemic correlation spikes across all sectors, it often signals a <b>"Risk-Off"</b> regime where alpha is compressed. Conversely, decoupling (low correlation) highlights idiosyncratic opportunities.
            </p>
            </p>
        </div>
    `;

    // Initialize the Risk Scatter Plot
    setTimeout(() => {
        const scatterCtx = document.getElementById('riskScatterChart');
        if (scatterCtx) {
            const syntheticScatter = tks.map(t => {
                const isBTC = t.includes('BTC');
                const isETH = t.includes('ETH');
                const isMiner = ['MARA','RIOT','CLSK','HIVE','CAN','WULF','IREN'].includes(t.split('-')[0]);
                
                let baseVol = isBTC ? 40 : isETH ? 55 : isMiner ? 90 : 70;
                let baseRet = isBTC ? 15 : isETH ? 22 : isMiner ? 45 : 30;
                
                baseVol += (t.length * 2.1) % 15 - 7;
                baseRet += (t.length * 3.7) % 20 - 10;

                return {
                    x: baseVol,
                    y: baseRet,
                    ticker: t.split('-')[0]
                };
            });

            new Chart(scatterCtx.getContext('2d'), {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Asset Profile',
                        data: syntheticScatter,
                        backgroundColor: 'rgba(0, 242, 255, 0.6)',
                        borderColor: '#00f2ff',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(13, 17, 23, 0.95)',
                            callbacks: {
                                label: (ctx) => `${ctx.raw.ticker}: ${ctx.raw.y.toFixed(1)}% Ret / ${ctx.raw.x.toFixed(1)}% Vol`
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: '30D Annualized Volatility (%)', color: '#8b949e' },
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#8b949e' }
                        },
                        y: {
                            title: { display: true, text: '30D Cumulative Return (%)', color: '#8b949e' },
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#8b949e' }
                        }
                    }
                }
            });
        }
    }, 50);
}

function formatPrice(price) {
    return `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function runNeuralSetup(ticker) {
    const btn = document.getElementById('generate-setup-btn');
    const area = document.getElementById('setup-display-area');
    
    // Provide immediate feedback if triggered via "View Analysis"
    if (area) {
        area.innerHTML = `<div class="loading-state" style="padding:40px; text-align:center">
            <div class="spinner" style="margin-bottom:15px"></div>
            <p>SYNTHESIZING NEURAL SETUP FOR ${ticker.toUpperCase()}...</p>
        </div>`;
    }

    if (btn) {
        btn.textContent = "SYNTHESIZING...";
        btn.disabled = true;
    }
    
    try {
        const setup = await fetchAPI(`/generate-setup?ticker=${ticker.toUpperCase()}`);
        
        if (!setup || setup.error) {
            if (area) {
                area.innerHTML = `
                    <div class="error-card" style="padding:20px; border:1px solid var(--neg); background:rgba(255,59,48,0.1); border-radius:12px; text-align:center">
                        <span class="material-symbols-outlined" style="font-size:3rem; color:var(--neg); margin-bottom:10px">warning</span>
                        <h4 style="color:var(--text-header)">SYNTHESIS FAILED</h4>
                        <p style="color:var(--text-dim); font-size:0.8rem">${setup?.error || 'Market data stream interrupted. Ticker may be invalid or halted.'}</p>
                    </div>`;
            }
            return;
        }
        
        area.innerHTML = `
            <div class="setup-card animate-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                    <span style="font-weight:900; color:var(--accent); font-size:1.1rem">${setup.ticker} / ${setup.bias}</span>
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
                    <ul class="rationale-list">
                        ${setup.rationale.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="risk-notice">
                    <strong>RISK WARNING:</strong> ${setup.risk_warning}
                </div>
                
                <div style="margin-top:20px; border-top:1px solid var(--border); padding-top:20px; display:flex; gap:15px">
                    <button class="intel-action-btn" id="ticket-gen-btn" style="flex:1; background:var(--accent); color:white" onclick="showTradeTicket()">
                        <span class="material-symbols-outlined" style="vertical-align:middle; font-size:1.2rem; margin-right:5px">receipt_long</span>
                        GENERATE EXECUTION TICKET
                    </button>
                </div>
            </div>`;
        area.innerHTML += `
            <div style="margin-top:20px; text-align:center">
                <button class="intel-action-btn mini outline" style="width:auto; padding:8px 20px" onclick="switchView('trade-ledger')">
                    <span class="material-symbols-outlined" style="font-size:1rem; margin-right:5px">list_alt</span> VIEW AUDIT LEDGER
                </button>
            </div>
        `;
        lastNeuralSetup = setup;
        area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
        console.error('Setup Gen Error:', e);
    } finally {
        if (btn) {
            btn.textContent = "GENERATE NEURAL SETUP";
            btn.disabled = false;
        }
    }
}

async function generateTicket(ticker) {
    try {
        showToast("Processing", `Generating Execution Ticket for ${ticker}...`, "alert");
        const setup = await fetchAPI(`/generate-setup?ticker=${ticker.toUpperCase()}`);
        if (setup && !setup.error) {
            showTradeTicket(setup);
        } else {
            showToast("Error", "Failed to generate ticket metadata.", "alert");
        }
    } catch (e) {
        showToast("Error", "Connection to Neural Engine failed.", "alert");
    }
}

function showTradeTicket(setup = null) {
    const s = setup || lastNeuralSetup;
    if (!s) {
        showToast("Error", "No active setup to ticket.", "alert");
        return;
    }

    // Auto-persist to Ledger in background
    fetchAPI('/trade-ledger', 'POST', {
        ticker: s.ticker,
        action: s.action,
        price: s.parameters?.entry || 0,
        target: s.parameters?.take_profit_1 || 0,
        stop: s.parameters?.stop_loss || 0,
        rr: s.parameters?.rr_ratio || 0,
        slippage: s.parameters?.slippage_est || 0
    }).then(res => console.log("[AlphaSignal] Ticket persisted to Ledger:", res))
      .catch(err => console.error("[AlphaSignal] Ledger Persistence Failed:", err));

    const ticketId = `AS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const ticketText = `ALPHASIGNAL EXECUTION TICKET\nID: ${ticketId}\nASSET: ${s.ticker}\nACTION: ${s.action}\nENTRY: ${s.parameters.entry}\nTP1: ${s.parameters.take_profit_1}\nTP2: ${s.parameters.take_profit_2}\nSL: ${s.parameters.stop_loss}\nR/R: ${s.parameters.rr_ratio}\nSOURCE: AlphaSignal Neural Engine v4.2`;

    const area = document.getElementById('setup-display-area');
    if (!area) return;

    area.innerHTML = `
        <div class="trade-ticket animate-in">
            <div class="ticket-id">ORDER ID: ${ticketId} | SYSTEM TIME: ${s.timestamp}</div>
            <div class="ticket-main">
                <div class="ticket-info">
                    <div class="ticket-action ${s.action.toLowerCase()}">${s.action}</div>
                    <div class="ticket-symbol">${s.ticker} / USD</div>
                </div>
                <div class="ticket-meta" style="text-align:right">
                    <div style="color:var(--accent); font-weight:900">CONVICTION: ${s.conviction}</div>
                    <div>EST. SLIPPAGE: ${s.parameters.slippage_est}</div>
                </div>
            </div>
            
            <div class="ticket-grid">
                <div class="ticket-item"><label>ENTRY ZONE</label><span>${formatPrice(s.parameters.entry)}</span></div>
                <div class="ticket-item"><label>R/R RATIO</label><span>${s.parameters.rr_ratio} : 1</span></div>
                <div class="ticket-item"><label>TARGET 1</label><span class="pos">${formatPrice(s.parameters.take_profit_1)}</span></div>
                <div class="ticket-item"><label>STOP LOSS</label><span class="neg">${formatPrice(s.parameters.stop_loss)}</span></div>
                <div class="ticket-item"><label>TARGET 2</label><span class="pos">${formatPrice(s.parameters.take_profit_2)}</span></div>
                <div class="ticket-item"><label>EXP. VOLATILITY</label><span>HIGH (ADAPTIVE)</span></div>
            </div>

            <div class="ticket-footer">
                <div class="ticket-meta">
                    <div style="font-weight:700">INSTRUCTION: LIMIT ORDER / GTC</div>
                    <div>Verified by AlphaSignal Intelligence Hub</div>
                </div>
                <button class="ticket-copy-btn" id="copy-ticket-btn" onclick="copyTicketToClipboard('${ticketId}')">
                    COPY TO CLIPBOARD
                </button>
            </div>
            <input type="hidden" id="raw-ticket-${ticketId}" value="${ticketText}">
        </div>
        <button class="intel-action-btn" style="margin-top:1rem; width:100%" onclick="runNeuralSetup('${s.ticker}')">BACK TO ANALYSIS</button>
    `;
    
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function copyTicketToClipboard(id) {
    const text = document.getElementById(`raw-ticket-${id}`).value;
    const btn = document.getElementById('copy-ticket-btn');
    
    try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "COPIED!";
        btn.classList.add('copied');
        showToast("Success", "Execution ticket copied to clipboard.", "alert");
        setTimeout(() => {
            btn.textContent = "COPY TO CLIPBOARD";
            btn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        showToast("Error", "Could not access clipboard.", "alert");
    }
}

async function updateBTC() {
    const data = await fetchAPI('/btc');
    if (data && data.price) {
        // Updated elsewhere or removed
    }
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


async function fetchBinanceKlines(symbol, interval, limit=500) {
    try {
        // Phase 10: Robust Institutional vs Crypto Detection
        const sym = (symbol || 'BTC-USD').toUpperCase().replace('-USD', '').replace('USDT', '');
        const institutionalProxies = ['MSTR', 'COIN', 'MARA', 'RIOT', 'CLSK'];
        const isEquity = institutionalProxies.includes(sym);
        
        if (isEquity) {
            // Institutional Hub Proxy (Local Backend -> yfinance)
            const res = await fetch(`/api/equity-klines?symbol=${sym}&interval=${interval}&limit=${limit}`);
            return await res.json();
        } else {
            // Standard Binance Crypto Feed (External -> Binance API)
            // Normalize: BTC-USD or BTC -> BTCUSDT
            const binanceSym = sym.endsWith('USDT') ? sym : (sym + 'USDT');
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=${interval}&limit=${limit}`);
            if (!res.ok) throw new Error(`Binance API ${res.status}`);
            
            const data = await res.json();
            return data.map(d => ({
                time: d[0] / 1000, 
                open: parseFloat(d[1]), 
                high: parseFloat(d[2]),
                low: parseFloat(d[3]), 
                close: parseFloat(d[4]), 
                value: parseFloat(d[5]),
                color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#26a69a' : '#ef5350'
            }));
        }
    } catch (e) { 
        console.error(`Kline Universal Fetch Error (${symbol}):`, e);
        return []; 
    }
}

// TAB 1: Overview (Price + Volume + EMA 20/50 + RSI Placeholder)