import sys

with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\js\views\onchain.js', 'r', encoding='utf-8') as f:
    text = f.read()

target_html = """        ${renderHubTabs('macro-cal', tabs)}
        <div id="macro-cal-loading" style="text-align:center;padding:3rem"><div class="loader" style="margin:0 auto"></div></div>
        <div id="macro-cal-content" style="display:none"></div>
    `;
    try {"""

replacement_html = """        ${renderHubTabs('macro-cal', tabs)}
            <!-- Advanced Macro Regime Trackers -->
            <div id="macro-regime-widgets" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem; margin-top:20px; margin-bottom:2rem;">
                <div class="glass-card" style="padding:1.5rem">
                    <div class="card-header">
                        <h3>CME FedWatch Target Rate</h3>
                        <span class="label-tag">CENTRAL BANK PROXY</span>
                        <span id="fedwatch-badge" style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;padding:2px 8px;border-radius:100px;background:rgba(148,163,184,0.1);color:#94a3b8;margin-left:8px">LOADING…</span>
                    </div>
                    <div style="font-size:3rem;font-weight:900;color:var(--accent);margin:20px 0 10px;display:flex;align-items:flex-end;gap:10px">
                        <span id="live-fed-rate">--</span><span style="font-size:1.5rem;color:var(--text-dim);margin-bottom:8px">%</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-dim)">
                        Implied target interest rate based on real-time pricing of ZQ=F (30-Day Fed Funds Futures).
                    </div>
                </div>

                <div class="glass-card" style="padding:1.5rem">
                    <div class="card-header">
                        <h3>Bitcoin / DXY Correlation</h3>
                        <span class="label-tag">GLOBAL LIQUIDITY</span>
                        <span id="dxy-badge" style="font-size:0.5rem;font-weight:900;letter-spacing:1.5px;padding:2px 8px;border-radius:100px;background:rgba(148,163,184,0.1);color:#94a3b8;margin-left:8px">LOADING…</span>
                    </div>
                    <div style="font-size:2.5rem;font-weight:900;color:#ef4444;margin:20px 0 10px;display:flex;align-items:center;gap:15px">
                        <span id="live-dxy-corr">--</span>
                        <div id="dxy-momentum-bar" style="height:40px;width:100px;background:linear-gradient(90deg, #ef4444, transparent);border-radius:20px;opacity:0.3"></div>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-dim)" id="live-dxy-desc">
                        Rolling 90-Day Pearson correlation mapping Bitcoin sensitivity against the US Dollar Index.
                    </div>
                </div>
            </div>
            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 -0.5rem">Macro Event Calendar</h2>
        <div id="macro-cal-loading" style="text-align:center;padding:3rem"><div class="loader" style="margin:0 auto"></div></div>
        <div id="macro-cal-content" style="display:none"></div>
    `;

    setTimeout(async () => {
        try {
            const mrData = await fetchAPI('/macro-regime');
            if (mrData && !mrData.error) {
                const fedBadge = document.getElementById('fedwatch-badge');
                if (fedBadge) { fedBadge.textContent = '● LIVE CME'; fedBadge.style.color = '#22c55e'; fedBadge.style.background = 'rgba(34,197,94,0.12)'; }
                
                const dxyBadge = document.getElementById('dxy-badge');
                if (dxyBadge) { dxyBadge.textContent = '● LIVE DXY'; dxyBadge.style.color = '#ef4444'; dxyBadge.style.background = 'rgba(239,68,68,0.12)'; }

                const fedEl = document.getElementById('live-fed-rate');
                if (fedEl) fedEl.textContent = mrData.implied_fed_rate.toFixed(3);

                const corrEl = document.getElementById('live-dxy-corr');
                if (corrEl) {
                    corrEl.textContent = mrData.btc_dxy_correlation_90d.toFixed(3);
                    corrEl.style.color = mrData.btc_dxy_correlation_90d < -0.5 ? '#ef4444' : (mrData.btc_dxy_correlation_90d > 0.5 ? '#22c55e' : '#8b5cf6');
                }
                
                const dxyDesc = document.getElementById('live-dxy-desc');
                if (dxyDesc) dxyDesc.innerHTML = `<span style="font-weight:900;color:${mrData.btc_dxy_correlation_90d < -0 ? '#ef4444' : '#22c55e'}">${mrData.status.toUpperCase()}</span> · Rolling 90-Day Pearson correlation mapping Bitcoin sensitivity against the US Dollar Index.`;
            }
        } catch(e) { console.error('Macro regime error', e); }
    }, 100);

    try {"""

if "id=\"macro-regime-widgets\"" not in text:
    text = text.replace(target_html, replacement_html)
    with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\js\views\onchain.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fix applied to onchain.js")
else:
    print("Fix already applied!")
