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
        // v1.56: Start ambient signal toast poller for PRO users
        if (typeof startSignalPoller === 'function') startSignalPoller();
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
            // Land in Command Center after login
            if (!window.maybeShowOnboarding || localStorage.getItem('alphasignal_onboarded')) {
                switchView('command-center');
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

// ============================================================
// Forgot Password — Supabase resetPasswordForEmail
// ============================================================

function initForgotPasswordLink() {
    const link = document.getElementById('forgot-password-link');
    if (!link) return;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordPanel();
    });
}

function showForgotPasswordPanel() {
    const container = document.getElementById('auth-form-container');
    if (!container) return;
    container.innerHTML = `
        <div style="text-align:center;margin-bottom:1.5rem">
            <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--accent);display:block;margin-bottom:0.5rem">lock_reset</span>
            <h3 style="font-size:1rem;font-weight:900;letter-spacing:1px;margin:0">RESET PASSWORD</h3>
            <p style="font-size:0.75rem;color:var(--text-dim);margin:0.5rem 0 0">Enter your email and we'll send a reset link</p>
        </div>

        <div class="auth-input-wrap">
            <span class="auth-input-icon material-symbols-outlined">mail</span>
            <input type="email" id="reset-email" placeholder="Email address" autocomplete="email" aria-label="Email address" />
        </div>

        <div id="reset-msg" class="auth-error hidden" role="alert"></div>

        <button id="send-reset-btn" class="intel-action-btn auth-submit" onclick="handleForgotPassword()">
            <span class="material-symbols-outlined" style="font-size:1rem">send</span>
            SEND RESET LINK
        </button>

        <div style="text-align:center;margin-top:1.25rem">
            <a href="#" onclick="restoreAuthPanel()" style="font-size:0.7rem;color:var(--text-dim);letter-spacing:0.5px;text-decoration:none;transition:color 0.2s" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-dim)'">← Back to sign in</a>
        </div>
    `;
}

async function handleForgotPassword() {
    const email = document.getElementById('reset-email')?.value?.trim();
    const msgEl = document.getElementById('reset-msg');
    const btn = document.getElementById('send-reset-btn');

    if (!email) {
        msgEl.textContent = 'REQUIRED: Please enter your email address.';
        msgEl.style.color = 'var(--risk-high)';
        msgEl.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'SENDING...';
    msgEl.classList.add('hidden');

    try {
        const { error } = await window._supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://alphasignal.digital/?view=reset-password'
        });

        if (error) throw error;

        msgEl.textContent = '✓ Reset link sent — check your inbox (including spam).';
        msgEl.style.color = 'var(--risk-low)';
        msgEl.classList.remove('hidden');
        btn.textContent = 'SENT ✓';
    } catch (err) {
        msgEl.textContent = err.message || 'Failed to send reset email. Try again.';
        msgEl.style.color = 'var(--risk-high)';
        msgEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem">send</span> SEND RESET LINK';
    }
}

function restoreAuthPanel() {
    // Reload the page to restore the original auth panel cleanly
    showAuth(true);
    location.reload();
}

// ============================================================
// Reset Password View — handles ?view=reset-password
// reads Supabase token from URL hash automatically
// ============================================================

async function renderResetPassword() {
    appEl.innerHTML = `
        <div style="display:flex;justify-content:center;align-items:center;min-height:60vh;padding:2rem">
            <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:3rem;width:100%;max-width:440px;text-align:center">
                <span class="material-symbols-outlined" style="font-size:3rem;color:var(--accent);display:block;margin-bottom:1rem">lock_reset</span>
                <h1 style="font-size:1.2rem;font-weight:900;letter-spacing:2px;margin:0 0 0.5rem">SET NEW PASSWORD</h1>
                <p style="font-size:0.8rem;color:var(--text-dim);margin:0 0 2rem">Choose a strong password for your AlphaSignal account</p>

                <div class="auth-input-wrap" style="margin-bottom:1rem">
                    <span class="auth-input-icon material-symbols-outlined">lock</span>
                    <input type="password" id="new-password" placeholder="New password (min 8 chars)" aria-label="New password" style="background:transparent;border:none;color:white;width:100%;outline:none;font-family:inherit" />
                </div>

                <div class="auth-input-wrap" style="margin-bottom:1.5rem">
                    <span class="auth-input-icon material-symbols-outlined">lock_clock</span>
                    <input type="password" id="confirm-password" placeholder="Confirm new password" aria-label="Confirm password" style="background:transparent;border:none;color:white;width:100%;outline:none;font-family:inherit" />
                </div>

                <div id="reset-pw-msg" class="auth-error hidden" role="alert" style="margin-bottom:1rem"></div>

                <button id="set-pw-btn" class="intel-action-btn auth-submit" style="width:100%" onclick="handleResetPassword()">
                    <span class="material-symbols-outlined" style="font-size:1rem">check_circle</span>
                    UPDATE PASSWORD
                </button>
            </div>
        </div>
    `;
}

async function handleResetPassword() {
    const newPw = document.getElementById('new-password')?.value;
    const confirmPw = document.getElementById('confirm-password')?.value;
    const msgEl = document.getElementById('reset-pw-msg');
    const btn = document.getElementById('set-pw-btn');

    msgEl.classList.add('hidden');

    if (!newPw || newPw.length < 8) {
        msgEl.textContent = 'Password must be at least 8 characters.';
        msgEl.style.color = 'var(--risk-high)';
        msgEl.classList.remove('hidden');
        return;
    }
    if (newPw !== confirmPw) {
        msgEl.textContent = 'Passwords do not match.';
        msgEl.style.color = 'var(--risk-high)';
        msgEl.classList.remove('hidden');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'UPDATING...';

    try {
        const { error } = await window._supabase.auth.updateUser({ password: newPw });
        if (error) throw error;

        msgEl.textContent = '✓ Password updated. Redirecting to sign in...';
        msgEl.style.color = 'var(--risk-low)';
        msgEl.classList.remove('hidden');

        setTimeout(() => {
            switchView('home');
            showAuth(true);
        }, 2000);
    } catch (err) {
        msgEl.textContent = err.message || 'Failed to update password. Link may have expired.';
        msgEl.style.color = 'var(--risk-high)';
        msgEl.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem">check_circle</span> UPDATE PASSWORD';
    }
}

// Init forgot password link when auth panel is rendered
document.addEventListener('DOMContentLoaded', () => {
    initForgotPasswordLink();
    // Re-init on auth toggle since panel can re-render
    document.getElementById('toggle-auth')?.addEventListener('click', () => {
        setTimeout(initForgotPasswordLink, 50);
    });
});


