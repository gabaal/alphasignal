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
            await checkAuthStatus();
            // Show onboarding for first-time users (localStorage flag prevents repeat)
            setTimeout(() => window.maybeShowOnboarding?.(), 600);
            // Land in Alerts Hub — richest retention view for returning users
            if (!window.maybeShowOnboarding || localStorage.getItem('alphasignal_onboarded')) {
                switchView('alerts-hub');
            }
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

