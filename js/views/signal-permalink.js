// ─────────────────────────────────────────────────────────────────────────────
// Signal Permalink View  (?view=signal&ticker=BTC-USD)
// Public shareable page: live vs signal price, AI thesis, Add to Watchlist
// ─────────────────────────────────────────────────────────────────────────────

async function renderSignalPermalink(id) {
    // id can be a ticker (from the signals grid) or a numeric alert id (future)
    const ticker = id || new URLSearchParams(window.location.search).get('ticker') || 'BTC-USD';

    appEl.innerHTML = `
        <div style="max-width:680px;margin:0 auto;padding:2rem 1rem">
            <!-- Back button -->
            <button onclick="switchView('signals')" style="background:none;border:none;color:var(--accent);
                font-size:0.7rem;font-weight:900;letter-spacing:2px;cursor:pointer;display:flex;
                align-items:center;gap:6px;margin-bottom:2rem;padding:0;opacity:0.7;transition:opacity 0.2s"
                onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                <span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>
                BACK TO SIGNALS
            </button>

            <!-- Header badge -->
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,242,255,0.08);
                border:1px solid rgba(0,242,255,0.2);border-radius:100px;padding:4px 14px;
                margin-bottom:1.5rem;font-size:0.65rem;letter-spacing:2px;color:var(--accent)">
                <span style="width:6px;height:6px;border-radius:50%;background:var(--accent);animation:pulse-dot 1.5s infinite"></span>
                ALPHASIGNAL — LIVE SIGNAL PERMALINK
            </div>

            <!-- Loading card -->
            <div id="permalink-card" class="glass-card" style="padding:2rem;border-radius:20px;border:1px solid rgba(0,242,255,0.15)">
                <div style="display:flex;align-items:center;gap:8px;color:var(--text-dim)">
                    <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:18px">sync</span>
                    <span style="font-size:0.8rem;letter-spacing:1px">LOADING SIGNAL DATA...</span>
                </div>
            </div>
        </div>`;

    try {
        // Fetch live signal data for this ticker
        const [data, thesis] = await Promise.allSettled([
            fetchAPI(`/signal-permalink?ticker=${encodeURIComponent(ticker)}`),
            fetchAPI(`/signal-thesis?ticker=${encodeURIComponent(ticker)}&signal=${ticker}&zscore=1.0`)
        ]);

        const sig = data.status === 'fulfilled' && data.value ? data.value : null;
        const t   = thesis.status === 'fulfilled' && thesis.value?.thesis ? thesis.value.thesis : null;

        if (!sig) {
            document.getElementById('permalink-card').innerHTML = `
                <p style="color:var(--text-dim)">Signal data unavailable for <strong style="color:var(--accent)">${ticker}</strong>. The asset may not be in the tracked universe.</p>
                <button class="intel-action-btn outline" style="margin-top:1rem" onclick="switchView('signals')">VIEW ALL SIGNALS</button>`;
            return;
        }

        const dir        = sig.alpha >= 0 ? 'LONG' : 'SHORT';
        const dirColor   = sig.alpha >= 0 ? '#22c55e' : '#ef4444';
        const zColor     = Math.abs(sig.zScore) >= 1.75 ? '#ef4444' : Math.abs(sig.zScore) >= 1.0 ? '#fb923c' : Math.abs(sig.zScore) >= 0.5 ? '#7dd3fc' : '#94a3b8';
        const sentLabel  = sig.sentiment > 0.1 ? 'BULLISH' : sig.sentiment < -0.1 ? 'BEARISH' : 'NEUTRAL';
        const sentColor  = sig.sentiment > 0.1 ? '#22c55e' : sig.sentiment < -0.1 ? '#ef4444' : '#94a3b8';
        const shareUrl   = `https://alphasignal.digital/?view=signal&ticker=${encodeURIComponent(ticker)}`;
        const localUrl   = `${window.location.origin}/?view=signal&ticker=${encodeURIComponent(ticker)}`;
        const tweetText  = `🚨 AlphaSignal: $${ticker} ${dir} signal\n\n📊 Alpha: ${sig.alpha >= 0 ? '+' : ''}${sig.alpha.toFixed(2)}%\n⚡ Z-Score: ${sig.zScore.toFixed(2)}σ\n🧠 ${sentLabel}\n\nFull analysis:`;

        document.getElementById('permalink-card').innerHTML = `
            <!-- Ticker hero -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
                <div>
                    <div style="font-size:2.5rem;font-weight:900;color:var(--accent);letter-spacing:-1px;line-height:1">${ticker}</div>
                    <div style="font-size:0.7rem;color:var(--text-dim);margin-top:4px;letter-spacing:1px">${sig.name || ticker}</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
                        <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;padding:3px 10px;border-radius:100px;
                            background:${dirColor}18;border:1px solid ${dirColor}44;color:${dirColor}">${dir}</span>
                        <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;padding:3px 10px;border-radius:100px;
                            background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.2);color:var(--accent)">${sig.category}</span>
                        <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;padding:3px 10px;border-radius:100px;
                            background:rgba(148,163,184,0.1);color:var(--text-dim)">LIVE</span>
                    </div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:1.8rem;font-weight:900;color:white">${formatPrice(sig.price)}</div>
                    <div style="font-size:0.85rem;font-weight:700;color:${sig.change >= 0 ? '#22c55e' : '#ef4444'};margin-top:4px">
                        ${sig.change >= 0 ? '+' : ''}${sig.change.toFixed(2)}% 24h
                    </div>
                </div>
            </div>

            <!-- Key metrics grid -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:1.5rem">
                ${[
                    ['Z-Score', `${sig.zScore >= 0 ? '+' : ''}${sig.zScore.toFixed(2)}σ`, zColor],
                    ['Relative Alpha', `${sig.alpha >= 0 ? '+' : ''}${sig.alpha.toFixed(2)}%`, sig.alpha >= 0 ? '#22c55e' : '#ef4444'],
                    ['BTC Correlation', sig.btcCorrelation.toFixed(2), '#7dd3fc'],
                    ['Sentiment', sentLabel, sentColor],
                ].map(([label, val, color]) => `
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
                        border-radius:12px;padding:1rem;text-align:center">
                        <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:6px">${label}</div>
                        <div style="font-size:1.1rem;font-weight:900;color:${color}">${val}</div>
                    </div>`).join('')}
            </div>

            <!-- AI Thesis -->
            <div style="background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.2);
                border-radius:12px;padding:1.25rem;margin-bottom:1.5rem">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#8b5cf6">psychology</span>
                    <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#8b5cf6">AI THESIS · ${ticker}</span>
                    <span style="font-size:0.55rem;color:rgba(139,92,246,0.5);margin-left:auto">GPT-4o-mini</span>
                </div>
                <div id="permalink-thesis" style="font-size:0.82rem;line-height:1.7;color:var(--text-dim)">
                    ${t ? t : `<span style="display:flex;align-items:center;gap:6px;color:rgba(139,92,246,0.6)">
                        <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:14px">sync</span>
                        <span style="font-size:0.7rem;letter-spacing:1px">GENERATING THESIS...</span>
                    </span>`}
                </div>
            </div>

            <!-- Action buttons -->
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <!-- Add to Watchlist -->
                <button onclick="addToWatchlist_quick('${ticker}')"
                    style="flex:1;min-width:140px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);
                    color:#22c55e;padding:10px 16px;border-radius:10px;cursor:pointer;font-size:0.7rem;
                    font-weight:900;letter-spacing:1px;display:flex;align-items:center;justify-content:center;gap:6px;
                    transition:all 0.2s" onmouseover="this.style.background='rgba(34,197,94,0.22)'"
                    onmouseout="this.style.background='rgba(34,197,94,0.12)'">
                    <span class="material-symbols-outlined" style="font-size:16px">add_circle</span>
                    ADD TO WATCHLIST
                </button>

                <!-- Copy link -->
                <button id="permalink-copy-btn" onclick="
                    navigator.clipboard.writeText('${shareUrl}').then(() => {
                        const b = document.getElementById('permalink-copy-btn');
                        b.innerHTML = '<span class=\\'material-symbols-outlined\\' style=\\'font-size:16px\\'>check</span> COPIED!';
                        b.style.color='#22c55e';b.style.borderColor='rgba(34,197,94,0.4)';
                        setTimeout(()=>{b.innerHTML='<span class=\\'material-symbols-outlined\\' style=\\'font-size:16px\\'>link</span> COPY LINK';b.style.color='';b.style.borderColor='';},2000);
                    })"
                    style="flex:1;min-width:120px;background:rgba(0,242,255,0.06);border:1px solid rgba(0,242,255,0.2);
                    color:var(--accent);padding:10px 16px;border-radius:10px;cursor:pointer;font-size:0.7rem;
                    font-weight:900;letter-spacing:1px;display:flex;align-items:center;justify-content:center;gap:6px;
                    transition:all 0.2s" onmouseover="this.style.background='rgba(0,242,255,0.12)'"
                    onmouseout="this.style.background='rgba(0,242,255,0.06)'">
                    <span class="material-symbols-outlined" style="font-size:16px">link</span>
                    COPY LINK
                </button>

                <!-- Share to X -->
                <button onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}','_blank')"
                    style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
                    color:var(--text);padding:10px 14px;border-radius:10px;cursor:pointer;font-size:0.7rem;
                    font-weight:900;letter-spacing:1px;display:flex;align-items:center;gap:6px;
                    transition:all 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.08)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.04)'">
                    <span style="font-size:14px;font-weight:900">𝕏</span>
                    SHARE
                </button>

                <!-- View all signals -->
                <button onclick="switchView('signals')"
                    style="background:none;border:1px solid rgba(255,255,255,0.06);
                    color:var(--text-dim);padding:10px 14px;border-radius:10px;cursor:pointer;font-size:0.7rem;
                    font-weight:900;letter-spacing:1px;display:flex;align-items:center;gap:6px;
                    transition:all 0.2s" onmouseover="this.style.borderColor='rgba(255,255,255,0.15)'"
                    onmouseout="this.style.borderColor='rgba(255,255,255,0.06)'">
                    <span class="material-symbols-outlined" style="font-size:16px">radar</span>
                    ALL SIGNALS
                </button>
            </div>

            <!-- Footer disclaimer -->
            <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border);
                font-size:0.6rem;color:var(--text-dim);letter-spacing:0.5px;line-height:1.6">
                AlphaSignal — Institutional Intelligence Terminal · alphasignal.digital<br>
                Signal data is computed from live market feeds. Not financial advice.
                <a href="/?view=signals" style="color:var(--accent);margin-left:8px">View all live signals →</a>
            </div>
        `;

        // Lazy-load thesis if it wasn't pre-fetched
        if (!t) {
            try {
                const dir2 = sig.alpha >= 0 ? 'LONG' : 'SHORT';
                const z2   = Math.abs(sig.zScore).toFixed(1);
                const fresh = await fetchAPI(`/signal-thesis?ticker=${encodeURIComponent(ticker)}&signal=${dir2}&zscore=${z2}`);
                const thesisEl = document.getElementById('permalink-thesis');
                if (thesisEl && fresh?.thesis) thesisEl.textContent = fresh.thesis;
                else if (thesisEl) thesisEl.textContent = 'Thesis generation unavailable — check AI engine configuration.';
            } catch (_) {}
        }

    } catch (err) {
        console.error('[Permalink] Error:', err);
        const card = document.getElementById('permalink-card');
        if (card) card.innerHTML = `<p style="color:#ef4444">Failed to load signal data. <a href="/?view=signals" style="color:var(--accent)">Return to signals →</a></p>`;
    }
}

// ── copySignalPermalink: called from signal card share button ─────────────────
function copySignalPermalink(ticker, event) {
    if (event) event.stopPropagation();
    const url = `${window.location.origin}/?view=signal&ticker=${encodeURIComponent(ticker)}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('LINK COPIED', `Permalink for ${ticker} copied to clipboard.`, 'success');
    }).catch(() => {
        // Fallback for non-HTTPS
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('LINK COPIED', `Permalink for ${ticker} copied to clipboard.`, 'success');
    });
}
