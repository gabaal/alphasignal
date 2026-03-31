let _briefData = null;

async function renderMarketBrief(tabs = null) {
    appEl.innerHTML = `<div class="skeleton-loader" style="height:400px"></div>`;

    if (!isAuthenticatedUser) {
        appEl.innerHTML = `
            <div class="view-header">
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">article</span>AI Market Brief</h1>
            </div>
            <div class="card" style="text-align:center;padding:48px;">
                <span class="material-symbols-outlined" style="font-size:48px;color:var(--accent);display:block;margin-bottom:16px;">lock</span>
                <h2 style="margin-bottom:8px;">Sign In to Access</h2>
                <p style="color:var(--text-dim);margin-bottom:24px;">The AI Market Brief is available to all registered users — free and premium.</p>
                <button class="intel-action-btn" onclick="showAuth(true)">SIGN IN / REGISTER</button>
            </div>`;
        return;
    }

    const data = await fetchAPI('/market-brief');
    if (!data || data.error) {
        appEl.innerHTML = `<div class="card" style="padding:32px;text-align:center;color:var(--risk-high);">Failed to generate brief. ${data?.error || ''}</div>`;
        return;
    }
    _briefData = data;

    const brief = data.brief || '';
    // Parse **Header** paragraphs into styled sections
    const paragraphs = brief.split(/\n\n+/).filter(p => p.trim());

    const renderedParagraphs = paragraphs.map(p => {
        const headerMatch = p.match(/^\*\*(.+?)\*\*/);
        if (headerMatch) {
            const header = headerMatch[1];
            const body = p.replace(/^\*\*.+?\*\*\s*[—\-]?\s*/, '');
            const icons = {
                'Macro Context': 'language', 'BTC Outlook': 'currency_bitcoin',
                'Top Signals': 'electric_bolt', 'Risk Factors': 'warning'
            };
            const colors = {
                'Macro Context': 'var(--accent)', 'BTC Outlook': '#f59e0b',
                'Top Signals': 'var(--risk-low)', 'Risk Factors': 'var(--risk-high)'
            };
            const icon = icons[header] || 'info';
            const color = colors[header] || 'var(--accent)';
            return `
                <div style="background:rgba(0,242,255,0.03);border:1px solid var(--border);border-left:3px solid ${color};border-radius:8px;padding:20px 22px;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                        <span class="material-symbols-outlined" style="font-size:18px;color:${color};">${icon}</span>
                        <span style="font-size:0.7rem;font-weight:900;letter-spacing:2px;color:${color};">${header.toUpperCase()}</span>
                    </div>
                    <p style="font-size:0.85rem;line-height:1.7;color:var(--text);margin:0;">${body}</p>
                </div>`;
        }
        return `<p style="font-size:0.85rem;line-height:1.7;color:var(--text);margin-bottom:12px;">${p}</p>`;
    }).join('');

    const sourceTag = data.source === 'gpt-4o-mini'
        ? `<span style="color:var(--risk-low);font-weight:700;">GPT-4o-mini</span>`
        : `<span style="color:var(--text-dim);">Static Template</span>`;

    appEl.innerHTML = `
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div>
                ${tabs ? renderHubTabs('market-brief', tabs) : ''}
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">article</span>AI Market Brief <span class="premium-badge">INSTITUTIONAL</span></h1>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:6px 14px;font-size:0.65rem;display:flex;align-items:center;gap:4px;" onclick="refreshMarketBrief()">
                <span class="material-symbols-outlined" style="font-size:13px;">refresh</span> REFRESH
            </button>
        </div>

        <!-- Meta bar -->
        <div style="display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap;">
            <div class="card" style="padding:12px 18px;display:flex;align-items:center;gap:10px;">
                <span class="material-symbols-outlined" style="color:var(--accent);font-size:16px;">schedule</span>
                <div>
                    <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px;">GENERATED AT</div>
                    <div style="font-size:0.78rem;font-weight:700;">${data.generated_at}</div>
                </div>
            </div>
            <div class="card" style="padding:12px 18px;display:flex;align-items:center;gap:10px;">
                <span class="material-symbols-outlined" style="color:var(--text-dim);font-size:16px;">update</span>
                <div>
                    <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px;">NEXT REFRESH</div>
                    <div style="font-size:0.78rem;font-weight:700;">${data.next_refresh}</div>
                </div>
            </div>
            <div class="card" style="padding:12px 18px;display:flex;align-items:center;gap:10px;">
                <span class="material-symbols-outlined" style="color:var(--text-dim);font-size:16px;">smart_toy</span>
                <div>
                    <div style="font-size:0.6rem;color:var(--text-dim);letter-spacing:1px;">AI ENGINE</div>
                    <div style="font-size:0.78rem;">${sourceTag}</div>
                </div>
            </div>
        </div>

        <!-- Brief content -->
        <div class="card" style="padding:28px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border);">
                <div style="width:40px;height:40px;background:linear-gradient(135deg,rgba(0,242,255,0.2),rgba(168,85,247,0.2));border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <span class="material-symbols-outlined" style="color:var(--accent);font-size:20px;">psychology</span>
                </div>
                <div>
                    <div style="font-size:0.95rem;font-weight:900;color:var(--text);">AlphaSignal Intelligence Desk</div>
                    <div style="font-size:0.7rem;color:var(--text-dim);">Institutional Morning Brief · ${data.generated_at}</div>
                </div>
            </div>
            ${renderedParagraphs}
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:12px;flex-wrap:wrap;">
                <button class="intel-action-btn mini outline" style="width:auto;padding:6px 14px;font-size:0.65rem;" onclick="copyBrief()">
                    <span class="material-symbols-outlined" style="font-size:13px;">content_copy</span> COPY
                </button>
            </div>
        </div>
    `;
}

async function refreshMarketBrief() {
    // Force-clear cache by including timestamp (future: dedicated /api/market-brief/refresh)
    // For now re-fetch; backend TTL is 4h — inform user if stale
    const btn = document.querySelector('[onclick="refreshMarketBrief()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'REFRESHING...'; }
    _briefData = null;
    await renderMarketBrief();
}

function copyBrief() {
    if (!_briefData) return;
    const text = _briefData.brief;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('[onclick="copyBrief()"]');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:13px;">check</span> COPIED';
            setTimeout(() => { btn.innerHTML = original; }, 2000);
        }
    });
}
