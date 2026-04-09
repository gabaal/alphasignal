async function renderWebhooks() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:-4px;margin-right:8px;color:var(--accent)">webhook</span>Algorithmic Webhooks</h1>
            <p style="color:var(--text-dim)">Stream raw JSON signal intelligence payloads to your custom trading endpoints.</p>
        </div>

        <div class="glass-panel" style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:2rem; max-width:800px; margin:0 auto;">
            <h2 style="font-size:1.1rem;margin-bottom:1rem;color:var(--accent);letter-spacing:1px">Outbound Webhook Configuration</h2>
            <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:1.5rem;line-height:1.6">
                When the ML engine fires an alpha signal (exceeding your Z-Score threshold), the terminal can map a raw JSON payload directly to a custom endpoint.
            </p>
            
            <div class="input-group">
                <label for="algo-webhook-input">WEBHOOK DESTINATION URL</label>
                <input type="url" id="algo-webhook-input" placeholder="https://your-bot-domain.com/incoming-signal" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-mono);font-size:0.85rem">
            </div>

            <div style="margin-top:2rem;display:flex;gap:12px">
                <button class="intel-action-btn" onclick="saveAlgoWebhook()">SAVE ENDPOINT</button>
                <button class="intel-action-btn secondary" onclick="testAlgoWebhook()" style="background:rgba(0,242,255,0.1);color:var(--accent);border:1px solid rgba(0,242,255,0.3)">TEST PAYLOAD</button>
            </div>

            <div style="margin-top:3rem; border-top:1px solid rgba(255,255,255,0.05); padding-top:2rem;">
                <h3 style="font-size:0.85rem;letter-spacing:2px;color:var(--text-dim);margin-bottom:1rem">PAYLOAD SCHEMA</h3>
                <pre style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.05);padding:1rem;border-radius:8px;font-family:var(--font-mono);font-size:0.75rem;color:var(--text);line-height:1.5;overflow-x:auto;">
{
  "action": "BUY", <span style="color:#64748b">// or "SELL"</span>
  "ticker": "BTC-USD",
  "price": 89500.25,
  "signal_type": "ML_ALPHA",
  "alpha_score": 5.42,
  "timestamp": "2024-03-22T14:30:00Z"
}</pre>
            </div>
        </div>
    `;

    try {
        const settings = await fetchAPI('/user/settings');
        if (settings && settings.algo_webhook) {
            document.getElementById('algo-webhook-input').value = settings.algo_webhook;
        }
    } catch (e) {
        console.error('Failed to load webhook URL');
    }
}

async function saveAlgoWebhook() {
    const url = document.getElementById('algo-webhook-input').value.trim();
    try {
        const res = await fetchAPI('/user/settings', 'POST', { algo_webhook: url });
        if (res && res.success) {
            showToast('SAVED', 'Webhook integration updated.', 'success');
        } else {
            throw new Error(res?.error || 'Failed to save');
        }
    } catch(e) {
        showToast('ERROR', e.message, 'alert');
    }
}

async function testAlgoWebhook() {
    const url = document.getElementById('algo-webhook-input').value.trim();
    if (!url) {
        showToast('ERROR', 'Please enter a webhook URL first.', 'alert');
        return;
    }
    showToast('DISPATCHING', `Sending test payload to ${url}`, 'info');
    
    const payload = {
        action: "BUY",
        ticker: "TEST-USD",
        price: 1337.00,
        signal_type: "TEST_PING",
        alpha_score: 99.99,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showToast('SUCCESS', 'Test payload received 200 OK from endpoint.', 'success');
        } else {
            showToast('WARNING', `Test completed but returned HTTP ${response.status}`, 'warning');
        }
    } catch (e) {
        showToast('ERROR', `CORS or Network error: ${e.message}`, 'alert');
    }
}
