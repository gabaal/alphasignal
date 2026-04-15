// ─────────────────────────────────────────────────────────────────────────────
// Signal Permalink View
// Handles two modes:
//   • ?view=signal&id=1234   → Historical snapshot (frozen at time of firing)
//   • ?view=signal&ticker=X  → Live view (fresh data for that ticker)
// ─────────────────────────────────────────────────────────────────────────────

async function renderSignalPermalink(id) {
    const params  = new URLSearchParams(window.location.search);
    const alertId = params.get('id');
    const ticker  = id || params.get('ticker') || 'BTC-USD';

    const isSnapshotMode = !!alertId;

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
                ${isSnapshotMode ? 'ALPHASIGNAL — SIGNAL SNAPSHOT' : 'ALPHASIGNAL — LIVE SIGNAL PERMALINK'}
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
        let sig = null;
        let t   = null;

        if (isSnapshotMode) {
            // ── Snapshot mode: fetch frozen historical record ──────────────
            const [snapData, thesisData] = await Promise.allSettled([
                fetchAPI(`/signal-permalink?id=${encodeURIComponent(alertId)}`),
                fetchAPI(`/signal-thesis?ticker=${encodeURIComponent(ticker)}&signal=LONG&zscore=1.0`)
            ]);
            sig = snapData.status === 'fulfilled' && snapData.value && !snapData.value.error
                ? snapData.value : null;
            t   = thesisData.status === 'fulfilled' && thesisData.value?.thesis
                ? thesisData.value.thesis : null;
        } else {
            // ── Live mode: compute fresh signal for ticker ─────────────────
            const [liveData, thesisData] = await Promise.allSettled([
                fetchAPI(`/signal-permalink?ticker=${encodeURIComponent(ticker)}`),
                fetchAPI(`/signal-thesis?ticker=${encodeURIComponent(ticker)}&signal=${ticker}&zscore=1.0`)
            ]);
            sig = liveData.status === 'fulfilled' && liveData.value ? liveData.value : null;
            t   = thesisData.status === 'fulfilled' && thesisData.value?.thesis
                ? thesisData.value.thesis : null;
        }

        if (!sig) {
            document.getElementById('permalink-card').innerHTML = `
                <p style="color:var(--text-dim)">Signal data unavailable for <strong style="color:var(--accent)">${alertId || ticker}</strong>. The asset may not be in the tracked universe.</p>
                <button class="intel-action-btn outline" style="margin-top:1rem" onclick="switchView('signals')">VIEW ALL SIGNALS</button>`;
            return;
        }

        const activeTicker = sig.ticker || ticker;
        const dir          = sig.direction || (sig.alpha >= 0 ? 'LONG' : 'SHORT');
        const dirColor     = dir === 'LONG' ? '#22c55e' : dir === 'SHORT' ? '#ef4444' : '#94a3b8';
        const zColor       = Math.abs(sig.zScore) >= 1.75 ? '#ef4444' : Math.abs(sig.zScore) >= 1.0 ? '#fb923c' : Math.abs(sig.zScore) >= 0.5 ? '#7dd3fc' : '#94a3b8';
        const sentLabel    = sig.sentiment > 0.1 ? 'BULLISH' : sig.sentiment < -0.1 ? 'BEARISH' : 'NEUTRAL';
        const sentColor    = sig.sentiment > 0.1 ? '#22c55e' : sig.sentiment < -0.1 ? '#ef4444' : '#94a3b8';

        // Share URL: always use the snapshot id if available so recipient sees the exact same signal
        const shareUrl  = isSnapshotMode
            ? `https://alphasignal.digital/?view=signal&id=${alertId}`
            : `https://alphasignal.digital/?view=signal&ticker=${encodeURIComponent(activeTicker)}`;
        const localUrl  = isSnapshotMode
            ? `${window.location.origin}/?view=signal&id=${alertId}`
            : `${window.location.origin}/?view=signal&ticker=${encodeURIComponent(activeTicker)}`;
        const tweetText = `🚨 AlphaSignal: $${activeTicker} ${dir} signal\n\n📊 Alpha: ${(sig.alpha >= 0 ? '+' : '')}${(sig.alpha || 0).toFixed(2)}%\n⚡ Z-Score: ${(sig.zScore || 0).toFixed(2)}σ\n🧠 ${sentLabel}\n\nFull analysis:`;

        // Snapshot banner (only in snapshot mode)
        const snapshotBanner = isSnapshotMode && sig.fired_at ? `
            <div style="background:rgba(251,146,60,0.07);border:1px solid rgba(251,146,60,0.25);
                border-radius:10px;padding:10px 14px;margin-bottom:1.25rem;
                display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <span class="material-symbols-outlined" style="font-size:16px;color:#fb923c">history</span>
                <div>
                    <div style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#fb923c">HISTORICAL SNAPSHOT</div>
                    <div style="font-size:0.72rem;color:var(--text-dim);margin-top:2px">
                        Signal fired: <strong style="color:var(--text)">${new Date(sig.fired_at).toLocaleString('en-GB', {dateStyle:'medium',timeStyle:'short'})}</strong>
                        · Entry price: <strong style="color:var(--accent)">${formatPrice(sig.price)}</strong>
                    </div>
                </div>
            </div>` : '';

        document.getElementById('permalink-card').innerHTML = `
            ${snapshotBanner}
            <!-- Ticker hero -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
                <div>
                    <div style="font-size:2.5rem;font-weight:900;color:var(--accent);letter-spacing:-1px;line-height:1">${activeTicker}</div>
                    <div style="font-size:0.7rem;color:var(--text-dim);margin-top:4px;letter-spacing:1px">${sig.name || activeTicker}</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
                        <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;padding:3px 10px;border-radius:100px;
                            background:${dirColor}18;border:1px solid ${dirColor}44;color:${dirColor}">${dir}</span>
                        <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;padding:3px 10px;border-radius:100px;
                            background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.2);color:var(--accent)">${sig.category || 'SIGNAL'}</span>
                        <span style="font-size:0.55rem;font-weight:900;letter-spacing:2px;padding:3px 10px;border-radius:100px;
                            background:rgba(148,163,184,0.1);color:var(--text-dim)">${isSnapshotMode ? 'SNAPSHOT' : 'LIVE'}</span>
                    </div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:1.8rem;font-weight:900;color:white">${formatPrice(sig.price)}</div>
                    ${sig.change != null ? `<div style="font-size:0.85rem;font-weight:700;color:${sig.change >= 0 ? '#22c55e' : '#ef4444'};margin-top:4px">
                        ${sig.change >= 0 ? '+' : ''}${sig.change.toFixed(2)}% 24h</div>` : ''}
                </div>
            </div>

            <!-- Key metrics grid -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:1.5rem">
                ${[
                    ['Z-Score', `${(sig.zScore || 0) >= 0 ? '+' : ''}${(sig.zScore || 0).toFixed(2)}σ`, zColor],
                    ['Relative Alpha', `${(sig.alpha || 0) >= 0 ? '+' : ''}${(sig.alpha || 0).toFixed(2)}%`, (sig.alpha || 0) >= 0 ? '#22c55e' : '#ef4444'],
                    ['BTC Correlation', (sig.btcCorrelation || 0).toFixed(2), '#7dd3fc'],
                    ['Sentiment', sentLabel, sentColor],
                ].map(([label, val, color]) => `
                    <div style="background:${alphaColor(0.03)};border:1px solid ${alphaColor(0.06)};
                        border-radius:12px;padding:1rem;text-align:center">
                        <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:6px">${label}</div>
                        <div style="font-size:1.1rem;font-weight:900;color:${color}">${val}</div>
                    </div>`).join('')}
            </div>

            <!-- Signal message (snapshot only) -->
            ${isSnapshotMode && sig.message ? `
            <div style="background:${alphaColor(0.03)};border:1px solid ${alphaColor(0.06)};
                border-radius:12px;padding:1rem;margin-bottom:1.25rem;
                font-size:0.78rem;color:var(--text-dim);line-height:1.6">
                <div style="font-size:0.55rem;letter-spacing:2px;color:var(--text-dim);margin-bottom:6px">SIGNAL TRIGGER</div>
                ${sig.message}
            </div>` : ''}

            <!-- AI Thesis -->
            <div style="background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.2);
                border-radius:12px;padding:1.25rem;margin-bottom:1.5rem">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem">
                    <span class="material-symbols-outlined" style="font-size:16px;color:#8b5cf6">psychology</span>
                    <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;color:#8b5cf6">AI THESIS · ${activeTicker}</span>
                    <span style="font-size:0.55rem;color:rgba(139,92,246,0.5);margin-left:auto">GPT-4o-mini</span>
                </div>
                <div id="permalink-thesis" style="font-size:0.82rem;line-height:1.7;color:var(--text-dim)">
                    ${t ? t : `<span style="display:flex;align-items:center;gap:6px;color:rgba(139,92,246,0.6)">
                        <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:14px">sync</span>
                        <span style="font-size:0.7rem;letter-spacing:1px">GENERATING THESIS...</span>
                    </span>`}
                </div>
            </div>

            <!-- Price Chart -->
            <div style="margin-bottom:1.5rem">
                <div style="font-size:0.55rem;letter-spacing:2px;color:var(--text-dim);margin-bottom:8px">PRICE HISTORY (60D)</div>
                <div id="permalink-chart-container" style="width:100%;height:250px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.2)"></div>
            </div>


            <!-- Action buttons -->
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button onclick="addToWatchlist_quick('${activeTicker}')"
                    style="flex:1;min-width:140px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);
                    color:#22c55e;padding:10px 16px;border-radius:10px;cursor:pointer;font-size:0.7rem;
                    font-weight:900;letter-spacing:1px;display:flex;align-items:center;justify-content:center;gap:6px;
                    transition:all 0.2s" onmouseover="this.style.background='rgba(34,197,94,0.22)'"
                    onmouseout="this.style.background='rgba(34,197,94,0.12)'">
                    <span class="material-symbols-outlined" style="font-size:16px">add_circle</span>
                    ADD TO WATCHLIST
                </button>

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

                <button onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}','_blank')"
                    style="background:${alphaColor(0.04)};border:1px solid ${alphaColor(0.1)};
                    color:var(--text);padding:10px 14px;border-radius:10px;cursor:pointer;font-size:0.7rem;
                    font-weight:900;letter-spacing:1px;display:flex;align-items:center;gap:6px;
                    transition:all 0.2s" onmouseover="this.style.background=alphaColor(0.08)"
                    onmouseout="this.style.background=alphaColor(0.04)">
                    <span style="font-size:14px;font-weight:900">𝕏</span>
                    SHARE
                </button>

                <button onclick="switchView('signals')"
                    style="background:none;border:1px solid ${alphaColor(0.06)};
                    color:var(--text-dim);padding:10px 14px;border-radius:10px;cursor:pointer;font-size:0.7rem;
                    font-weight:900;letter-spacing:1px;display:flex;align-items:center;gap:6px;
                    transition:all 0.2s" onmouseover="this.style.borderColor=alphaColor(0.15)"
                    onmouseout="this.style.borderColor=alphaColor(0.06)">
                    <span class="material-symbols-outlined" style="font-size:16px">radar</span>
                    ALL SIGNALS
                </button>
            </div>

            <!-- Footer -->
            <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border);
                font-size:0.6rem;color:var(--text-dim);letter-spacing:0.5px;line-height:1.6">
                AlphaSignal — Institutional Intelligence Terminal · alphasignal.digital<br>
                ${isSnapshotMode
                    ? 'This is a historical snapshot frozen at the time the signal fired. Current market conditions may differ.'
                    : 'Signal data is computed from live market feeds. Not financial advice.'}
                <a href="/?view=signals" style="color:var(--accent);margin-left:8px">View all live signals →</a>
            </div>
        `;

        // Lazy-load thesis if not yet available
        if (!t) {
            try {
                const dir2  = dir;
                const z2    = Math.abs(sig.zScore || 0).toFixed(1);
                const fresh = await fetchAPI(`/signal-thesis?ticker=${encodeURIComponent(activeTicker)}&signal=${dir2}&zscore=${z2}`);
                const thesisEl = document.getElementById('permalink-thesis');
                if (thesisEl && fresh?.thesis) thesisEl.textContent = fresh.thesis;
                else if (thesisEl) thesisEl.textContent = 'Thesis generation unavailable — check AI engine configuration.';
            } catch (_) {}
        }
        
        // Render Lightweight Chart
        try {
            const chartContainer = document.getElementById('permalink-chart-container');
            if (chartContainer && window.LightweightCharts) {
                const chart = window.LightweightCharts.createChart(chartContainer, {
                    layout: { background: { type: 'solid', color: 'transparent' }, textColor: 'rgba(255,255,255,0.5)' },
                    grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
                    timeScale: { borderColor: 'rgba(255,255,255,0.05)' },
                    rightPriceScale: { borderColor: 'rgba(255,255,255,0.05)' },
                    crosshair: { mode: window.LightweightCharts.CrosshairMode.Normal }
                });
                
                const candlestickSeries = chart.addCandlestickSeries({
                    upColor: '#22c55e', downColor: '#ef4444', 
                    borderVisible: false, 
                    wickUpColor: '#22c55e', wickDownColor: '#ef4444'
                });
                
                const klinesData = await fetchAPI(`/klines?ticker=${encodeURIComponent(activeTicker)}&period=60d`);
                if (klinesData && klinesData.length > 0) {
                    candlestickSeries.setData(klinesData);
                    chart.timeScale().fitContent();
                    
                    // Add a ResizeObserver to adapt to modal resizes
                    const ro = new ResizeObserver(entries => {
                        if (entries.length === 0 || entries[0].target !== chartContainer) return;
                        const newRect = entries[0].contentRect;
                        chart.applyOptions({ height: newRect.height, width: newRect.width });
                    });
                    ro.observe(chartContainer);
                } else {
                    chartContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-size:0.7rem;">Chart data unavailable</div>';
                }
            }
        } catch (e) {
            console.error('[Permalink Chart] Error:', e);
        }



    } catch (err) {
        console.error('[Permalink] Error:', err);
        const card = document.getElementById('permalink-card');
        if (card) card.innerHTML = `<p style="color:#ef4444">Failed to load signal data. <a href="/?view=signals" style="color:var(--accent)">Return to signals →</a></p>`;
    }
}

// ── copySignalPermalink ───────────────────────────────────────────────────────
// Looks up the most recent alerts_history id for this ticker, then copies a
// snapshot permalink (?view=signal&id=NNN) so the recipient sees the exact
// same signal that fired — not today's live data.
async function copySignalPermalink(ticker, event) {
    if (event) event.stopPropagation();

    try {
        // Try to get the latest DB id for this ticker's most recent alert
        const data = await fetchAPI(`/alerts?ticker=${encodeURIComponent(ticker)}&limit=1`);
        const id   = Array.isArray(data) && data.length > 0 ? data[0].id : null;

        const url = id
            ? `${window.location.origin}/?view=signal&id=${id}`
            : `${window.location.origin}/?view=signal&ticker=${encodeURIComponent(ticker)}`;

        navigator.clipboard.writeText(url).then(() => {
            showToast('LINK COPIED', `Snapshot permalink for ${ticker} copied to clipboard.`, 'success');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('LINK COPIED', `Snapshot permalink for ${ticker} copied to clipboard.`, 'success');
        });
    } catch (_) {
        // Fallback to ticker-based live link
        const url = `${window.location.origin}/?view=signal&ticker=${encodeURIComponent(ticker)}`;
        navigator.clipboard.writeText(url).catch(() => {});
        showToast('LINK COPIED', `Live permalink for ${ticker} copied to clipboard.`, 'success');
    }
}

// Shared quick-add helper (defined here in case signals.js hasn't loaded yet)
window.addToWatchlist_quick = window.addToWatchlist_quick || async function(ticker) {
    if (!ticker) return;
    try {
        const res = await fetchAPI('/watchlist', 'POST', { ticker: ticker.toUpperCase(), note: 'Quick add from signal feed' });
        if (res && res.success) {
            showToast('WATCHLIST', ticker.toUpperCase() + ' added to your watchlist', 'success');
        } else {
            showToast('WATCHLIST', res && res.error ? res.error : 'Could not add ' + ticker, 'warning');
        }
    } catch(e) {
        showToast('ERROR', 'Watchlist add failed: ' + e.message, 'alert');
    }
};
