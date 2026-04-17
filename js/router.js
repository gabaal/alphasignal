function switchView(view, pushState = true) {
    // Clean up view-specific live intervals
    if (window._gommLiveInterval) { clearInterval(window._gommLiveInterval); window._gommLiveInterval = null; }

    // Global Memory Wipe for 60FPS Optimization
    if (typeof window.globalUIWipe === 'function') {
        window.globalUIWipe();
    }

    // 1. Check Access Rights - three-tier model
    // PUBLIC: no auth required
    const isPublicView = (
        view === 'signals' || view === 'home' || view === 'help' ||
        view?.startsWith('explain-') || view?.startsWith('docs-') || view === 'signal' ||
        view === 'reset-password'
    );
    // FREE: login required, no subscription needed
    const isFreeView = isPublicView || view === 'command-center' || view === 'free-tier' || view === 'my-terminal' || view === 'price-alerts' || view === 'market-brief' || view === 'signal-leaderboard' || view === 'alerts-hub' || view === 'price-alerts-hub' || view === 'leaderboard-hub' || view === 'market-brief-hub';

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
        // Semantic URL rewrite (Clean URLs)
        if (view === 'home') {
            window.history.pushState({ view }, '', '/');
        } else if (view === 'signal') {
            const existing = new URLSearchParams(window.location.search);
            existing.set('view', 'signal');
            window.history.pushState({ view }, '', '?' + existing.toString());
        } else if (view.startsWith('docs-')) {
            window.history.pushState({ view }, '', `/docs/${view.replace('docs-', '')}`);
        } else {
            window.history.pushState({ view }, '', `/${view}`);
        }
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
        const pathView = window.location.pathname.substring(1);
        
        let targetView = 'home';
        
        // Static SEO Academy Bypass - Do not hijack hydration
        if (pathView.startsWith('academy/')) {
            console.log('[Router] Bypassing SPA logic for Academy static view.');
            return;
        }
        if (urlParams.get('view')) targetView = urlParams.get('view');
        else if (pathView && pathView !== 'index.html') {
            let processed = pathView.replace('docs/', 'docs-');
            if (viewMap[processed]) targetView = processed;
            else if (viewMap[pathView]) targetView = pathView;
        }
        switchView(targetView, false);
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
            const isSignup = document.getElementById('auth-btn-label')?.textContent.trim() === 'REGISTER';
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
                    const isSignup = document.getElementById('auth-btn-label')?.textContent.trim() === 'REGISTER';
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
            const isInLoginMode = toggleAuthLink.textContent.includes('Create account');
            const btnLabel = document.getElementById('auth-btn-label');
            if (isInLoginMode) {
                // Switch TO register mode
                if (btnLabel) btnLabel.textContent = 'REGISTER';
                toggleAuthLink.textContent = 'Sign in';
                document.getElementById('auth-password').setAttribute('autocomplete', 'new-password');
            } else {
                // Switch TO login mode
                if (btnLabel) btnLabel.textContent = 'SIGN IN';
                toggleAuthLink.textContent = 'Create account';
                document.getElementById('auth-password').setAttribute('autocomplete', 'current-password');
            }
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
            if (e.target.id === 'auth-overlay') {
                // Dismiss auth form and land on Welcome page
                showAuth(false);
                switchView('home');
                return;
            }
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
    
    // Support deep-linking via clean URL paths or legacy parameters
    const urlParams = new URLSearchParams(window.location.search);
    const pathView = window.location.pathname.substring(1);
    
    // Static SEO Academy Bypass
    if (pathView.startsWith('academy/')) {
        console.log('[Router] Bypassing SPA logic for initial Academy page load.');
        return;
    }
    
    let initialView = 'home';
    if (urlParams.get('view')) {
        initialView = viewMap[urlParams.get('view')] ? urlParams.get('view') : 'home';
    } else if (pathView && pathView !== 'index.html' && pathView !== '') {
        const processed = pathView.replace('docs/', 'docs-');
        if (viewMap[processed]) initialView = processed;
        else if (viewMap[pathView]) initialView = pathView;
    }
    
    // Replace state on initial load - preserve ticker param if view=signal
    if (initialView === 'signal') {
        const existing = new URLSearchParams(window.location.search);
        existing.set('view', 'signal');
        window.history.replaceState({ view: initialView }, '', '?' + existing.toString());
    } else if (initialView === 'home') {
        window.history.replaceState({ view: initialView }, '', '/');
    } else if (initialView.startsWith('docs-')) {
        window.history.replaceState({ view: initialView }, '', `/docs/${initialView.replace('docs-', '')}`);
    } else {
        window.history.replaceState({ view: initialView }, '', `/${initialView}`);
    }
    switchView(initialView, false);
    
    startCountdown(); 
    
    // - Onboarding Tour (first-run only) -
    window.startTour = function() {
        const steps = [
            { target: '#sidebar .nav-item[data-view="home"], .hero-section h1, .landing-page h1', title: '- Welcome to AlphaSignal', body: 'An institutional-grade intelligence terminal with 8 hubs, 60+ live views, and AI-powered signals. Let\'s take a 30-second tour.', action: null },
            { target: '.nav-item[data-view="signals"], [data-view="signals"]', title: '- Alpha Signals', body: 'Your real-time signal feed. Z-score deviations, ML alpha predictions, and RSI/MACD alerts across 50 assets - live.', action: "switchView('signals')" },
            { target: '.nav-item[data-view="alpha-hub"], [data-view="alpha-hub"]', title: '- Strategy Lab', body: 'Test any strategy on any asset. Choose from 15 quant strategies, tune fast/slow parameters, and compare against Buy & Hold.', action: null },
            { target: '.nav-item[data-view="alerts"], [data-view="alerts"]', title: '- Live Alerts', body: 'Real-time signal alerts pushed via WebSocket. Filter by type, search tickers, and track P&L from entry price to now.', action: "switchView('alerts')" },
        ];

        let step = 0;
        const overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:19999;pointer-events:none';
        document.body.appendChild(overlay);

        const backdrop = document.createElement('div');
        backdrop.style.cssText = 'position:fixed;inset:0;backdrop-filter:blur(2px);z-index:19998;pointer-events:all';
        document.body.appendChild(backdrop);

        const card = document.createElement('div');
        card.style.cssText = 'position:fixed;background:var(--bg-card);border:1px solid rgba(0,242,255,0.4);border-radius:16px;padding:1.5rem;max-width:320px;z-index:20000;box-shadow:0 0 40px rgba(0,242,255,0.15),0 20px 60px rgba(0,0,0,0.8);pointer-events:all;transition:all 0.3s ease';
        document.body.appendChild(card);

        function renderStep() {
            const s = steps[step];
            const total = steps.length;
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
                    <span style="font-size:0.6rem;color:var(--accent);font-weight:700;letter-spacing:2px">TOUR ${step+1} / ${total}</span>
                    <button onclick="endTour()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1rem;line-height:1">-</button>
                </div>
                <h3 style="font-size:1rem;margin:0 0 0.5rem;font-weight:800">${s.title}</h3>
                <p style="font-size:0.8rem;color:var(--text-dim);line-height:1.6;margin:0 0 1rem">${s.body}</p>
                <div style="display:flex;gap:8px;justify-content:flex-end">
                    ${step > 0 ? '<button onclick="prevTourStep()" style="background:${alphaColor(0.05)};border:1px solid var(--border);color:var(--text-dim);padding:6px 14px;border-radius:8px;cursor:pointer;font-family:var(--font-ui);font-size:0.75rem">- BACK</button>' : ''}
                    <button onclick="${step < total-1 ? 'nextTourStep()' : 'endTour()'}" style="background:linear-gradient(90deg,rgba(0,242,255,0.15),rgba(188,19,254,0.1));border:1px solid rgba(0,242,255,0.4);color:var(--text);padding:6px 18px;border-radius:8px;cursor:pointer;font-family:var(--font-ui);font-size:0.75rem;font-weight:700">
                        ${step < total-1 ? 'NEXT -' : '- DONE'}
                    </button>
                </div>
                <div style="display:flex;gap:4px;justify-content:center;margin-top:0.75rem">
                    ${Array.from({length:total},(_,i)=>`<div style="width:${i===step?'18px':'6px'};height:6px;border-radius:100px;background:${i===step?'var(--accent)':alphaColor(0.15)};transition:all 0.3s"></div>`).join('')}
                </div>`;

            // Position card at bottom-right on mobile, smart-position on desktop
            const vw = window.innerWidth;
            if (vw < 700) {
                card.style.left = '1rem'; card.style.right = '1rem'; card.style.bottom = '90px'; card.style.top = 'auto'; card.style.maxWidth = 'none';
            } else {
                card.style.bottom = '2rem'; card.style.right = '2rem'; card.style.left = 'auto'; card.style.top = 'auto';
            }

            if (s.action) try { eval(s.action); } catch(e) {}
        }

        window.nextTourStep = function() { if (step < steps.length-1) { step++; renderStep(); } };
        window.prevTourStep = function() { if (step > 0) { step--; renderStep(); } };
        window.endTour = function() {
            [overlay, backdrop, card].forEach(el => el.remove());
            localStorage.setItem('alphasignal_toured', '1');
            delete window.nextTourStep; delete window.prevTourStep;
        };

        backdrop.onclick = window.endTour;
        renderStep();
    };

    // Fire tour for first-time visitors (after 2s delay)
    if (!localStorage.getItem('alphasignal_toured')) {
        setTimeout(window.startTour, 2000);
    }
    // - End Tour -

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
        const backdrop = document.getElementById('sidebar-backdrop');
        if (window.innerWidth <= 900) {
            const isOpen = sidebar.classList.toggle('open');
            if (backdrop) backdrop.classList.toggle('active', isOpen);
        } else {
            layout.classList.toggle('collapsed');
        }
    };

    // Backdrop tap: close sidebar
    const bd = document.getElementById('sidebar-backdrop');
    if (bd) bd.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.remove('open');
        bd.classList.remove('active');
    });
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

