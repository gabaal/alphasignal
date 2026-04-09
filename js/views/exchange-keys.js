async function renderExchangeKeys() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:-4px;margin-right:8px;color:var(--accent)">api</span>Exchange Keys</h1>
            <p style="color:var(--text-dim)">Securely connect external exchange APIs for 1-Click execution from the AlphaSignal Terminal.</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; max-width:1100px; margin:0 auto;">
            <!-- Add Key Form -->
            <div class="glass-panel" style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:2rem;">
                <h2 style="font-size:1.1rem;margin-bottom:1.5rem;color:var(--accent);letter-spacing:1px">Link New Exchange</h2>
                
                <div class="input-group" style="margin-bottom:1rem">
                    <label for="exchange-select">EXCHANGE PROVIDER</label>
                    <select id="exchange-select" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-ui);font-size:0.85rem;cursor:pointer">
                        <option value="BINANCE">Binance</option>
                        <option value="BYBIT">Bybit</option>
                        <option value="OKX">OKX</option>
                        <option value="KRAKEN">Kraken</option>
                        <option value="COINBASE">Coinbase Advanced</option>
                    </select>
                </div>

                <div class="input-group" style="margin-bottom:1rem">
                    <label for="api-key-input">API KEY</label>
                    <input type="text" id="api-key-input" placeholder="Paste your API Key..." style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-mono);font-size:0.85rem">
                </div>

                <div class="input-group" style="margin-bottom:2rem">
                    <label for="api-secret-input">API SECRET</label>
                    <input type="password" id="api-secret-input" placeholder="Paste your API Secret..." style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-mono);font-size:0.85rem">
                </div>

                <button class="intel-action-btn" style="width:100%" onclick="saveExchangeKey()">SECURE & LINK ACCOUNT</button>

                <p style="font-size:0.7rem;color:var(--text-dim);margin-top:1.5rem;display:flex;gap:6px;align-items:flex-start">
                    <span class="material-symbols-outlined" style="font-size:14px;color:var(--risk-low)">lock</span>
                    Keys are encrypted at rest. We recommend creating an API key restricted to ONLY 'Trade' permissions, disabling 'Withdrawal' access entirely.
                </p>
            </div>

            <!-- Managed Keys List -->
            <div class="glass-panel" style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:2rem;">
                <h2 style="font-size:1.1rem;margin-bottom:1.5rem;color:var(--text);letter-spacing:1px">Linked Exchanges</h2>
                
                <div id="exchange-keys-list" style="display:flex;flex-direction:column;gap:1rem">
                    <!-- Skeleton Loader -->
                    <div style="height:60px;background:rgba(255,255,255,0.03);border-radius:8px;animation:pulse 2s infinite"></div>
                    <div style="height:60px;background:rgba(255,255,255,0.03);border-radius:8px;animation:pulse 2s infinite"></div>
                </div>
            </div>
        </div>
    `;

    loadExchangeKeys();
}

async function loadExchangeKeys() {
    const listEl = document.getElementById('exchange-keys-list');
    if (!listEl) return;

    try {
        const keys = await fetchAPI('/user/exchange-keys');
        if (keys && keys.length > 0) {
            listEl.innerHTML = keys.map(k => `
                <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05);padding:1rem;border-radius:8px">
                    <div>
                        <div style="font-size:0.9rem;font-weight:700;color:var(--accent);letter-spacing:1px">${k.exchange}</div>
                        <div style="font-size:0.7rem;color:var(--text-dim);font-family:var(--font-mono);margin-top:4px">${k.api_key}</div>
                    </div>
                    <button class="intel-action-btn outline" style="color:var(--risk-high);border-color:rgba(239,68,68,0.3);padding:6px 12px;font-size:0.7rem" onclick="deleteExchangeKey(${k.id})">
                        REVOKE
                    </button>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-dim)">
                    <span class="material-symbols-outlined" style="font-size:2rem;opacity:0.5;margin-bottom:1rem">lock_open</span>
                    <p style="font-size:0.85rem">No exchanges linked yet.</p>
                </div>
            `;
        }
    } catch (e) {
        listEl.innerHTML = `<p style="color:var(--risk-high);font-size:0.85rem">Failed to load configured keys.</p>`;
    }
}

async function saveExchangeKey() {
    const exchange = document.getElementById('exchange-select').value;
    const apiKey = document.getElementById('api-key-input').value.trim();
    const apiSecret = document.getElementById('api-secret-input').value.trim();

    if (!apiKey || !apiSecret) {
        showToast('ERROR', 'Both API Key and Secret are required.', 'alert');
        return;
    }

    try {
        const res = await fetchAPI('/user/exchange-keys', 'POST', {
            exchange: exchange,
            api_key: apiKey,
            api_secret: apiSecret
        });

        if (res && res.success) {
            showToast('LINKED', `${exchange} API connected securely.`, 'success');
            document.getElementById('api-key-input').value = '';
            document.getElementById('api-secret-input').value = '';
            loadExchangeKeys();
        } else {
            throw new Error(res?.error || 'Failed to link account');
        }
    } catch (e) {
        showToast('ERROR', e.message, 'alert');
    }
}

async function deleteExchangeKey(id) {
    if (!confirm('Revoke access to this exchange? AlphaSignal will no longer be able to route trades to it.')) return;

    try {
        const res = await fetchAPI(`/user/exchange-keys?id=${id}`, 'DELETE');
        if (res && res.success) {
            showToast('REVOKED', 'Exchange key removed successfully.', 'success');
            loadExchangeKeys();
        } else {
            throw new Error(res?.error || 'Failed to revoke key');
        }
    } catch (e) {
        showToast('ERROR', e.message, 'alert');
    }
}
