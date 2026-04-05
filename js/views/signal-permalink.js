async function renderSignalPermalink(signalId) {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">share</span>Signal Detail</h1>
            <p style="color:var(--text-dim);font-size:0.8rem">AlphaSignal Terminal · Institutional Intelligence</p>
        </div>
        <div id="signal-permalink-content">${skeleton(1)}</div>`;

    if (!signalId || signalId === 'null' || signalId === 'undefined') {
        switchView('signals'); return;
    }
    const data = await fetchAPI(`/signal/${signalId}`);


    const el = document.getElementById('signal-permalink-content');
    if (!el) return;

    if (!data || data.error) {
        el.innerHTML = `
            <div class="card" style="padding:2.5rem;text-align:center">
                <span class="material-symbols-outlined" style="font-size:3rem;opacity:0.3">signal_disconnected</span>
                <h3 style="margin:1rem 0 0.5rem">Signal Not Found</h3>
                <p style="color:var(--text-dim)">This signal may have expired or the ID is incorrect.</p>
                <button class="intel-action-btn" onclick="switchView('signals')" style="margin:1rem auto 0">VIEW LIVE SIGNALS</button>
            </div>`;
        return;
    }

    const s = data;
    const sevColor  = s.severity === 'CRITICAL' ? '#ef4444' : s.severity === 'HIGH' ? '#f59e0b' : '#60a5fa';
    const sevIcon   = s.severity === 'CRITICAL' ? '🔴' : s.severity === 'HIGH' ? '🟠' : '🟡';
    const livePx    = window.livePrices?.[s.ticker];
    const signalPx  = s.price ? Number(s.price) : null;
    const movePct   = (livePx && signalPx) ? (((livePx - signalPx) / signalPx) * 100).toFixed(2) : null;
    const moveColor = movePct === null ? 'var(--text-dim)' : movePct >= 0 ? '#22c55e' : '#ef4444';
    const shareUrl  = `${window.location.origin}/?view=signal&id=${s.id}`;
    const tickerClean = s.ticker.replace('-USD', '');

    el.innerHTML = `
        <!-- Signal Card -->
        <div class="card" style="padding:1.5rem;margin-bottom:1rem;border-left:3px solid ${sevColor}">
            <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1.2rem">
                <div style="font-size:2rem;font-weight:900;color:var(--accent)">${tickerClean}</div>
                <div style="padding:4px 12px;border-radius:6px;background:${sevColor}20;color:${sevColor};border:1px solid ${sevColor}40;font-size:0.6rem;font-weight:900;letter-spacing:2px">${sevIcon} ${s.severity}</div>
                <div style="padding:4px 12px;border-radius:6px;background:rgba(255,255,255,0.05);color:var(--text-dim);font-size:0.6rem;letter-spacing:1px">${s.type || 'SIGNAL'}</div>
                <div style="margin-left:auto;font-size:0.65rem;color:var(--text-dim)">${s.timestamp ? new Date(s.timestamp).toLocaleString() : ''}</div>
            </div>

            ${s.message ? `<p style="font-size:0.9rem;line-height:1.7;color:var(--text);margin-bottom:1.5rem;padding:1rem;background:rgba(0,242,255,0.04);border-radius:8px;border-left:2px solid var(--accent)">${s.message}</p>` : ''}

            <!-- KPI Row -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.5rem">
                ${signalPx ? `
                <div class="card" style="padding:0.8rem;text-align:center">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px">PRICE AT SIGNAL</div>
                    <div style="font-size:1.1rem;font-weight:900;color:#f59e0b">$${signalPx.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                </div>` : ''}
                ${livePx ? `
                <div class="card" style="padding:0.8rem;text-align:center">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px">LIVE PRICE NOW</div>
                    <div style="font-size:1.1rem;font-weight:900;color:var(--text)">$${livePx.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                </div>` : ''}
                ${movePct !== null ? `
                <div class="card" style="padding:0.8rem;text-align:center">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px">MOVE SINCE SIGNAL</div>
                    <div style="font-size:1.1rem;font-weight:900;color:${moveColor}">${movePct >= 0 ? '+' : ''}${movePct}%</div>
                </div>` : ''}
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="intel-action-btn mini" onclick="shareSignal('${shareUrl}','${tickerClean}','${s.type || 'Signal'}')">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">share</span> SHARE
                </button>
                <button class="intel-action-btn mini outline" onclick="switchView('signals')">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">arrow_back</span> ALL SIGNALS
                </button>
                ${s.ticker ? `
                <button class="intel-action-btn mini outline" onclick="addToWatchlist_quick('${s.ticker}')">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">add_circle</span> WATCH ${tickerClean}
                </button>` : ''}
            </div>
        </div>

        <!-- AI Thesis (loads async) -->
        <div id="signal-thesis-section" class="card" style="padding:1.2rem">
            <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:2px;margin-bottom:0.8rem">
                <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;color:var(--accent)">psychology</span> AI THESIS
            </div>
            <div id="thesis-body" style="color:var(--text-dim);font-size:0.8rem">Loading analysis...</div>
        </div>

        <!-- CTA for non-users -->
        ${!isAuthenticatedUser ? `
        <div class="card" style="padding:1.5rem;text-align:center;margin-top:1rem;background:linear-gradient(135deg,rgba(0,242,255,0.08),rgba(139,92,246,0.06));border:1px solid rgba(0,242,255,0.2)">
            <div style="font-size:0.6rem;color:var(--accent);letter-spacing:3px;margin-bottom:0.5rem">INSTITUTIONAL INTELLIGENCE</div>
            <h3 style="margin:0 0 0.5rem;font-size:1.1rem">Track 50+ assets live. Free to join.</h3>
            <p style="color:var(--text-dim);font-size:0.8rem;margin-bottom:1rem">Real-time signals, on-chain alerts, AI analysis, and your personal watchlist.</p>
            <button class="intel-action-btn" onclick="showAuth(true)" style="margin:0 auto">GET FREE ACCESS →</button>
        </div>` : ''}`;

    // Load AI thesis async (non-blocking)
    _loadSignalThesis(s.ticker, s.id);
}

async function _loadSignalThesis(ticker, alertId) {
    const el = document.getElementById('thesis-body');
    if (!el || !ticker) return;
    try {
        const data = await fetchAPI(`/signal-thesis?ticker=${ticker}&alert_id=${alertId}`);
        if (data?.summary) {
            el.innerHTML = `<div style="line-height:1.8;font-size:0.82rem;color:var(--text)">${data.summary}</div>`;
        } else {
            el.innerHTML = `<span style="color:var(--text-dim);font-style:italic">AI analysis unavailable for this signal.</span>`;
        }
    } catch {
        el.innerHTML = `<span style="color:var(--text-dim);font-style:italic">Could not load analysis.</span>`;
    }
}

window.shareSignal = function(url, ticker, type) {
    if (navigator.share) {
        navigator.share({
            title: `${ticker} ${type} — AlphaSignal Terminal`,
            text: `Check out this institutional signal for ${ticker} on AlphaSignal Terminal`,
            url
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showToast('LINK COPIED', `Signal permalink copied to clipboard`, 'success');
        });
    }
};

// Quick-add to watchlist from signal permalink (works if logged in)
window.addToWatchlist_quick = async function(ticker) {
    if (!isAuthenticatedUser) { showAuth(true); return; }
    const res = await fetchAPI('/watchlist', 'POST', { ticker, note: 'Added from signal' });
    if (res?.success) {
        showToast(`${ticker.replace('-USD','')} added to watchlist`, '', 'success');
    } else {
        showToast(res?.error || 'Already on watchlist', '', 'alert');
    }
};
