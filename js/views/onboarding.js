// ════════════════════════════════════════════════════════════════
// ONBOARDING MODAL — shown once per new user after first login
// ════════════════════════════════════════════════════════════════

const ONBOARD_KEY = 'alphasignal_onboarded';

// Top 10 most popular assets for quick-pick
const ONBOARD_ASSETS = [
    { t: 'BTC-USD', label: 'Bitcoin', icon: '₿' },
    { t: 'ETH-USD', label: 'Ethereum', icon: 'Ξ' },
    { t: 'SOL-USD', label: 'Solana', icon: '◎' },
    { t: 'BNB-USD', label: 'BNB', icon: '●' },
    { t: 'XRP-USD', label: 'XRP', icon: '✦' },
    { t: 'ADA-USD', label: 'Cardano', icon: '♦' },
    { t: 'LINK-USD', label: 'Chainlink', icon: '⬡' },
    { t: 'AVAX-USD', label: 'Avalanche', icon: '▲' },
    { t: 'DOGE-USD', label: 'Dogecoin', icon: 'Ð' },
    { t: 'DOT-USD', label: 'Polkadot', icon: '●' }
];

// Call this after a successful login if no onboard flag in localStorage
window.maybeShowOnboarding = function() {
    if (localStorage.getItem(ONBOARD_KEY)) return; // Already done
    showOnboardingModal();
};

window.showOnboardingModal = function() {
    // Remove any existing modal
    document.getElementById('onboard-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'onboard-modal';
    modal.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;
        background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);
        display:flex;align-items:center;justify-content:center;padding:1rem;
        animation:fadeIn 0.3s ease
    `;

    modal.innerHTML = `
        <div style="
            background:linear-gradient(135deg,rgba(5,7,30,0.98),rgba(10,15,40,0.98));
            border:1px solid rgba(0,242,255,0.2);border-radius:20px;
            padding:2.5rem;max-width:560px;width:100%;
            box-shadow:0 0 60px rgba(0,242,255,0.08);
            position:relative;overflow:hidden
        ">
            <!-- Background glow -->
            <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:radial-gradient(circle,rgba(0,242,255,0.06),transparent 70%);border-radius:50%;pointer-events:none"></div>

            <!-- Step indicator -->
            <div id="onboard-step-dots" style="display:flex;gap:6px;justify-content:center;margin-bottom:2rem">
                <div class="onboard-dot active" data-step="0"></div>
                <div class="onboard-dot" data-step="1"></div>
                <div class="onboard-dot" data-step="2"></div>
            </div>

            <!-- Step panels -->
            <div id="onboard-step-0">
                <div style="text-align:center;margin-bottom:2rem">
                    <span class="material-symbols-outlined" style="font-size:3rem;color:var(--accent);display:block;margin-bottom:1rem">waving_hand</span>
                    <h2 style="font-size:1.4rem;margin:0 0 0.75rem;font-weight:900">Welcome to AlphaSignal</h2>
                    <p style="color:var(--text-dim);font-size:0.85rem;line-height:1.7;max-width:400px;margin:0 auto">
                        Your institutional intelligence terminal is ready. Let's set up your personal watchlist in 60 seconds.
                    </p>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:2rem">
                    ${[
                        ['electric_bolt', '#00f2ff', 'Live Signals', '50+ assets tracked 24/7'],
                        ['add_circle', '#22c55e', 'My Watchlist', 'Track your favourite assets'],
                        ['notifications_active', '#f59e0b', 'Price Alerts', 'Get notified at your targets'],
                        ['psychology', '#bc13fe', 'AI Thesis', 'AI explains every signal']
                    ].map(([icon, color, title, desc]) => `
                        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:1rem">
                            <span class="material-symbols-outlined" style="color:${color};font-size:1.5rem;display:block;margin-bottom:6px">${icon}</span>
                            <div style="font-size:0.75rem;font-weight:800;margin-bottom:3px">${title}</div>
                            <div style="font-size:0.65rem;color:var(--text-dim)">${desc}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="intel-action-btn" style="width:100%" onclick="onboardNext(1)">
                    GET STARTED <span class="material-symbols-outlined" style="vertical-align:middle;font-size:1rem;margin-left:6px">arrow_forward</span>
                </button>
            </div>

            <div id="onboard-step-1" style="display:none">
                <div style="text-align:center;margin-bottom:1.5rem">
                    <span class="material-symbols-outlined" style="font-size:2.5rem;color:#22c55e;display:block;margin-bottom:0.75rem">add_circle</span>
                    <h2 style="font-size:1.2rem;margin:0 0 0.5rem">Pick Your Assets</h2>
                    <p style="color:var(--text-dim);font-size:0.8rem">Choose assets to add to your personal watchlist</p>
                </div>
                <div id="onboard-asset-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:1.5rem">
                    ${ONBOARD_ASSETS.map(a => `
                        <div class="onboard-asset-btn" data-ticker="${a.t}" onclick="toggleOnboardAsset(this,'${a.t}')"
                            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer;transition:all 0.15s">
                            <div style="font-size:1.2rem;margin-bottom:4px">${a.icon}</div>
                            <div style="font-size:0.6rem;font-weight:700;color:var(--text-dim)">${a.label.split(' ')[0]}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex;gap:10px">
                    <button class="intel-action-btn mini outline" style="flex:0" onclick="onboardNext(0)">← BACK</button>
                    <button class="intel-action-btn" style="flex:1" onclick="onboardNext(2)">
                        NEXT <span class="material-symbols-outlined" style="vertical-align:middle;font-size:1rem;margin-left:4px">arrow_forward</span>
                    </button>
                </div>
            </div>

            <div id="onboard-step-2" style="display:none">
                <div style="text-align:center;margin-bottom:1.5rem">
                    <span class="material-symbols-outlined" style="font-size:2.5rem;color:#f59e0b;display:block;margin-bottom:0.75rem">notifications_active</span>
                    <h2 style="font-size:1.2rem;margin:0 0 0.5rem">Enable Smart Alerts</h2>
                    <p style="color:var(--text-dim);font-size:0.8rem">Get notified when prices hit your targets — even when this tab is in the background</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:1.5rem">
                    <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:1rem;display:flex;align-items:center;gap:12px">
                        <span class="material-symbols-outlined" style="color:#22c55e;font-size:1.5rem">notifications</span>
                        <div>
                            <div style="font-size:0.75rem;font-weight:800;margin-bottom:3px">Browser Notifications</div>
                            <div style="font-size:0.65rem;color:var(--text-dim)">Alerts fire even when AlphaSignal is a background tab</div>
                        </div>
                        <button id="onboard-notif-btn" onclick="requestOnboardNotif()" style="margin-left:auto;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#22c55e;padding:6px 14px;border-radius:6px;font-size:0.65rem;font-weight:800;cursor:pointer;white-space:nowrap">
                            ENABLE
                        </button>
                    </div>
                    <div style="background:rgba(0,242,255,0.04);border:1px solid rgba(0,242,255,0.12);border-radius:10px;padding:1rem;display:flex;align-items:center;gap:12px">
                        <span class="material-symbols-outlined" style="color:var(--accent);font-size:1.5rem">send</span>
                        <div style="flex:1">
                            <div style="font-size:0.75rem;font-weight:800;margin-bottom:3px">Telegram Alerts</div>
                            <div style="font-size:0.65rem;color:var(--text-dim)">Set up in Alert Settings after completing onboarding</div>
                        </div>
                        <span style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px">LATER</span>
                    </div>
                </div>
                <button class="intel-action-btn" style="width:100%;background:linear-gradient(135deg,rgba(0,242,255,0.15),rgba(188,19,254,0.1))" onclick="finishOnboarding()">
                    <span class="material-symbols-outlined" style="vertical-align:middle;margin-right:6px">check_circle</span>
                    FINISH SETUP → GO TO MY TERMINAL
                </button>
                <button onclick="finishOnboarding(true)" style="display:block;width:100%;background:none;border:none;color:var(--text-dim);font-size:0.65rem;margin-top:10px;cursor:pointer">Skip for now</button>
            </div>
        </div>

        <style>
            .onboard-dot { width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.15);transition:all 0.3s }
            .onboard-dot.active { background:var(--accent);width:24px;border-radius:4px }
            .onboard-asset-btn.selected { background:rgba(0,242,255,0.12)!important;border-color:var(--accent)!important;color:var(--accent) }
            .onboard-asset-btn:hover { transform:scale(1.05) }
        </style>
    `;

    document.body.appendChild(modal);
    window._onboardSelected = new Set();
};

window.toggleOnboardAsset = function(el, ticker) {
    if (window._onboardSelected.has(ticker)) {
        window._onboardSelected.delete(ticker);
        el.classList.remove('selected');
    } else {
        window._onboardSelected.add(ticker);
        el.classList.add('selected');
    }
};

window.onboardNext = function(step) {
    [0, 1, 2].forEach(i => {
        const panel = document.getElementById(`onboard-step-${i}`);
        if (panel) panel.style.display = i === step ? 'block' : 'none';
        const dot = document.querySelector(`.onboard-dot[data-step="${i}"]`);
        if (dot) dot.classList.toggle('active', i === step);
    });
};

window.requestOnboardNotif = function() {
    const btn = document.getElementById('onboard-notif-btn');
    if (!('Notification' in window)) {
        if (btn) btn.textContent = 'NOT SUPPORTED';
        return;
    }
    Notification.requestPermission().then(perm => {
        if (btn) btn.textContent = perm === 'granted' ? '✓ ENABLED' : 'BLOCKED';
        if (btn) btn.style.color = perm === 'granted' ? '#22c55e' : '#ef4444';
    });
};

window.finishOnboarding = async function(skipped = false) {
    // Bulk-add selected assets to watchlist
    const tickers = Array.from(window._onboardSelected || []);
    if (tickers.length > 0 && isAuthenticatedUser) {
        await Promise.allSettled(
            tickers.map(t => fetchAPI('/watchlist', 'POST', { ticker: t, note: 'Added during setup' }))
        );
        // Invalidate digest cache so new items are picked up
        window._watchlistCache = null;
        window._alertCacheTs = 0;
    }

    // Track activation in the backend
    if (isAuthenticatedUser) {
        fetchAPI('/onboarding-complete', 'POST', {
            skipped: skipped,
            watchlist_count: tickers.length,
            completed_at: new Date().toISOString()
        }).catch(() => {});
    }

    localStorage.setItem(ONBOARD_KEY, '1');
    document.getElementById('onboard-modal')?.remove();

    // Navigate to My Terminal to see their new watchlist
    if (tickers.length > 0) {
        showToast('Watchlist ready!', `${tickers.length} asset${tickers.length > 1 ? 's' : ''} added to your terminal`, 'success');
        switchView('my-terminal');
    }
};
