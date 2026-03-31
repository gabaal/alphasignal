async function renderPriceAlerts(tabs = null) {
    appEl.innerHTML = `<div class="skeleton-loader" style="height:300px"></div>`;

    let alerts = [];
    if (isAuthenticatedUser) {
        alerts = await fetchAPI('/price-alerts') || [];
    }

    appEl.innerHTML = `
        <div class="view-header">
            ${tabs ? renderHubTabs('price-alerts', tabs) : ''}
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications_active</span>Price Alerts <span class="premium-badge">LIVE</span></h1>
        </div>

        ${!isAuthenticatedUser ? `
        <div class="card" style="text-align:center;padding:40px;">
            <span class="material-symbols-outlined" style="font-size:48px;color:var(--accent);display:block;margin-bottom:12px;">lock</span>
            <h2 style="margin-bottom:8px;">Sign In Required</h2>
            <p style="color:var(--text-dim);margin-bottom:20px;">Price alerts are available to all registered users.</p>
            <button class="intel-action-btn" onclick="showAuth(true)">SIGN IN / REGISTER</button>
        </div>` : `

        <!-- Set New Alert -->
        <div class="card" style="margin-bottom:20px;">
            <div class="card-header" style="margin-bottom:16px;">
                <h2>Set New Price Alert</h2>
                <span class="label-tag">INSTANT EMAIL + TELEGRAM</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end;">
                <div>
                    <label style="font-size:0.65rem;color:var(--text-dim);letter-spacing:1px;display:block;margin-bottom:6px;">TICKER</label>
                    <input id="pa-ticker" type="text" placeholder="e.g. BTC-USD" style="width:100%;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font);font-size:0.8rem;">
                </div>
                <div>
                    <label style="font-size:0.65rem;color:var(--text-dim);letter-spacing:1px;display:block;margin-bottom:6px;">TARGET PRICE (USD)</label>
                    <input id="pa-price" type="number" step="any" placeholder="e.g. 95000" style="width:100%;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font);font-size:0.8rem;">
                </div>
                <div>
                    <label style="font-size:0.65rem;color:var(--text-dim);letter-spacing:1px;display:block;margin-bottom:6px;">DIRECTION</label>
                    <select id="pa-dir" style="width:100%;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font);font-size:0.8rem;">
                        <option value="ABOVE">ABOVE — Price rises to target</option>
                        <option value="BELOW">BELOW — Price drops to target</option>
                    </select>
                </div>
                <button class="intel-action-btn" style="white-space:nowrap;height:40px;" onclick="submitPriceAlert()">
                    <span class="material-symbols-outlined" style="font-size:14px;">add_alert</span> SET ALERT
                </button>
            </div>
            <div style="margin-top:12px;">
                <label style="font-size:0.65rem;color:var(--text-dim);letter-spacing:1px;display:block;margin-bottom:6px;">NOTE (OPTIONAL)</label>
                <input id="pa-note" type="text" placeholder="e.g. Break above key resistance" maxlength="200" style="width:100%;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font);font-size:0.8rem;box-sizing:border-box;">
            </div>
            <div id="pa-status" style="margin-top:10px;font-size:0.75rem;display:none;"></div>
        </div>

        <!-- Active Alerts Table -->
        <div class="card">
            <div class="card-header" style="margin-bottom:16px;">
                <h2>Active Alerts <span style="color:var(--accent);font-size:0.8rem;">(${alerts.length}/20)</span></h2>
                <span class="label-tag">AUTO-DELETE ON FIRE</span>
            </div>
            ${alerts.length === 0 ? `
                <div style="text-align:center;padding:40px;color:var(--text-dim);">
                    <span class="material-symbols-outlined" style="font-size:40px;display:block;margin-bottom:10px;opacity:0.4;">notifications_none</span>
                    No active alerts. Set one above to get notified instantly.
                </div>
            ` : `
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border);">
                        <th style="${thStyle()}">TICKER</th>
                        <th style="${thStyle()}">DIRECTION</th>
                        <th style="${thStyle()}">TARGET</th>
                        <th style="${thStyle()}">NOTE</th>
                        <th style="${thStyle()}">CREATED</th>
                        <th style="${thStyle()}">ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    ${alerts.map(a => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.2s;" onmouseenter="this.style.background='rgba(0,242,255,0.03)'" onmouseleave="this.style.background=''">
                        <td style="${tdStyle()}"><strong style="color:var(--accent);">${a.ticker.replace('-USD','')}</strong></td>
                        <td style="${tdStyle()}">
                            <span style="background:${a.direction==='ABOVE'?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)'};color:${a.direction==='ABOVE'?'var(--risk-low)':'var(--risk-high)'};padding:2px 8px;border-radius:4px;font-size:0.65rem;font-weight:700;">
                                ${a.direction === 'ABOVE' ? '▲' : '▼'} ${a.direction}
                            </span>
                        </td>
                        <td style="${tdStyle()}"><strong>$${parseFloat(a.target_price).toLocaleString(undefined,{minimumFractionDigits:2})}</strong></td>
                        <td style="${tdStyle()};color:var(--text-dim);font-style:italic;">${a.note || '—'}</td>
                        <td style="${tdStyle()};color:var(--text-dim);font-size:0.7rem;">${new Date(a.created_at).toLocaleDateString()}</td>
                        <td style="${tdStyle()}">
                            <button onclick="deletePriceAlert(${a.id})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:var(--risk-high);padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.65rem;font-family:var(--font);">
                                <span class="material-symbols-outlined" style="font-size:12px;vertical-align:middle;">delete</span> REMOVE
                            </button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>`}
        </div>`}
    `;
}

function thStyle() { return 'text-align:left;padding:8px 12px;font-size:0.6rem;letter-spacing:2px;color:var(--text-dim);font-weight:700;'; }
function tdStyle() { return 'padding:10px 12px;font-size:0.78rem;'; }

async function submitPriceAlert() {
    const ticker = (document.getElementById('pa-ticker')?.value || '').trim().toUpperCase();
    const targetPrice = parseFloat(document.getElementById('pa-price')?.value);
    const direction = document.getElementById('pa-dir')?.value || 'ABOVE';
    const note = document.getElementById('pa-note')?.value || '';
    const status = document.getElementById('pa-status');

    if (!ticker || isNaN(targetPrice) || targetPrice <= 0) {
        status.textContent = 'ERROR: Ticker and a valid target price are required.';
        status.style.color = 'var(--risk-high)';
        status.style.display = 'block';
        return;
    }

    const res = await fetchAPI('/price-alerts', 'POST', { ticker, target_price: targetPrice, direction, note });
    if (res && res.success) {
        status.textContent = `✓ Alert set: notify when ${ticker} goes ${direction} $${targetPrice.toLocaleString()}`;
        status.style.color = 'var(--risk-low)';
        status.style.display = 'block';
        setTimeout(() => renderPriceAlerts(), 1200);
    } else {
        status.textContent = `ERROR: ${res?.error || 'Could not create alert.'}`;
        status.style.color = 'var(--risk-high)';
        status.style.display = 'block';
    }
}

async function deletePriceAlert(id) {
    await fetchAPI(`/price-alerts/${id}`, 'DELETE');
    renderPriceAlerts();
}
