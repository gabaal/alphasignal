async function renderAlgoHub() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:-4px;margin-right:8px;color:var(--accent)">smart_toy</span>Algo Hub</h1>
            <p style="color:var(--text-dim)">Construct no-code algorithmic trading bots. When AI signals trigger your logic, trades are automatically routed to your connected KeyVault exchange.</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1.5fr; gap:2rem; max-width:1200px; margin:0 auto;">
            <!-- Builder Form -->
            <div class="glass-panel" style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:2rem; height:fit-content;">
                <h2 style="font-size:1.1rem;margin-bottom:1.5rem;color:var(--accent);letter-spacing:1px">Bot Builder</h2>
                
                <div class="input-group" style="margin-bottom:1rem">
                    <label for="bot-name">BOT NAME</label>
                    <input type="text" id="bot-name" placeholder="e.g. BTC Breakout Scalper" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-ui);font-size:0.85rem">
                </div>

                <div class="input-group" style="margin-bottom:1rem">
                    <label for="bot-asset">TARGET ASSET</label>
                    <input type="text" id="bot-asset" placeholder="e.g. BTC-USD or ANY" value="ANY" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-mono);font-size:0.85rem">
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
                    <div class="input-group">
                        <label for="bot-zscore">MIN ALPHA SCORE (%)</label>
                        <input type="number" id="bot-zscore" value="2.0" step="0.1" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-mono);font-size:0.85rem">
                    </div>
                    <div class="input-group">
                        <label for="bot-regime">REGIME FILTER</label>
                        <select id="bot-regime" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-ui);font-size:0.85rem;cursor:pointer">
                            <option value="ANY">Any Regime</option>
                            <option value="High-Vol Expansion">High-Vol Expansion</option>
                            <option value="Low-Vol Compression">Low-Vol Compression</option>
                        </select>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:2rem">
                    <div class="input-group">
                        <label for="bot-side">ACTION SIDE</label>
                        <select id="bot-side" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-ui);font-size:0.85rem;cursor:pointer">
                            <option value="MATCH_SIGNAL">Match Signal (+/-)</option>
                            <option value="BUY">Always Buy</option>
                            <option value="SELL">Always Sell</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="bot-amount">USD SIZE</label>
                        <input type="number" id="bot-amount" value="1000" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-mono);font-size:0.85rem">
                    </div>
                    <div class="input-group">
                        <label for="bot-exchange">EXCHANGE</label>
                        <select id="bot-exchange" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-ui);font-size:0.85rem;cursor:pointer">
                        </select>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem">
                    <div class="input-group">
                        <label for="bot-tp">TAKE PROFIT (%)</label>
                        <input type="number" id="bot-tp" value="5.0" step="0.5" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-mono);font-size:0.85rem">
                    </div>
                    <div class="input-group">
                        <label for="bot-sl">STOP LOSS (%)</label>
                        <input type="number" id="bot-sl" value="2.0" step="0.5" style="width:100%;padding:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;color:white;font-family:var(--font-mono);font-size:0.85rem">
                    </div>
                </div>

                <div style="display:flex;gap:1rem">
                    <button class="intel-action-btn outline" style="flex:1" onclick="runAlgoBacktest()">RUN BACKTEST (90d)</button>
                    <button class="intel-action-btn" style="flex:1" onclick="saveAlgoBot()">DEPLOY BOT</button>
                </div>
            </div>

            <!-- Backtest Statistics Modal Placeholder -->
            <div id="backtest-results-container"></div>

            <!-- Active Bots List -->
            <div class="glass-panel" style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:2rem;">
                <h2 style="font-size:1.1rem;margin-bottom:1.5rem;color:var(--text);letter-spacing:1px">Active Strategies</h2>
                
                <div id="algo-bots-list" style="display:flex;flex-direction:column;gap:1rem">
                    <div style="height:80px;background:rgba(255,255,255,0.03);border-radius:8px;animation:pulse 2s infinite"></div>
                </div>
            </div>
        </div>
    `;

    loadExchangeDropdown();
    loadAlgoBots();
}

async function loadExchangeDropdown() {
    const sel = document.getElementById('bot-exchange');
    try {
        const keys = await fetchAPI('/user/exchange-keys');
        if (keys && keys.length > 0) {
            sel.innerHTML = keys.map(k => `<option value="${k.exchange}">${k.exchange}</option>`).join('');
        } else {
            sel.innerHTML = `<option value="">-- No Exchanges Linked --</option>`;
        }
    } catch {
        sel.innerHTML = `<option value="">Error loading</option>`;
    }
}

async function loadAlgoBots() {
    const listEl = document.getElementById('algo-bots-list');
    if (!listEl) return;

    try {
        const bots = await fetchAPI('/algo-bots');
        if (bots && bots.length > 0) {
            listEl.innerHTML = bots.map(b => {
                const isActive = b.status === 'active';
                const statusColor = isActive ? 'var(--risk-low)' : 'var(--text-dim)';
                
                let triggeredText = 'Never triggered';
                if (b.last_triggered) {
                    const d = new Date(b.last_triggered);
                    triggeredText = 'Last: ' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
                }

                return `
                <div style="display:flex;flex-direction:column;gap:1rem;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05);padding:1.5rem;border-radius:8px; border-left:3px solid ${statusColor}">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start">
                        <div>
                            <div style="font-size:1.1rem;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
                                ${b.name}
                                <span style="font-size:0.65rem;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.1);color:white">${b.status.toUpperCase()}</span>
                            </div>
                            <div style="font-size:0.75rem;color:var(--text-dim);margin-top:6px;font-family:var(--font-mono)">
                                IF [Alpha >= ${b.condition_zscore}%] ON [${b.asset}] THEN [${b.action_side} $${b.action_amount} via ${b.action_exchange}]
                                <br>
                                <span style="color:var(--risk-low)">TP: ${b.take_profit_pct > 0 ? b.take_profit_pct + '%' : 'None'}</span> | 
                                <span style="color:var(--risk-high)">SL: ${b.stop_loss_pct > 0 ? b.stop_loss_pct + '%' : 'None'}</span>
                            </div>
                            <div style="font-size:0.7rem;color:var(--text-dim);margin-top:4px">
                                ${triggeredText}
                            </div>
                        </div>
                        <div style="display:flex;gap:0.5rem">
                            <button class="intel-action-btn outline" style="padding:6px 12px;font-size:0.7rem;color:${isActive ? 'var(--risk-med)' : 'var(--risk-low)'};border-color:rgba(255,255,255,0.1)" onclick="toggleAlgoBot(${b.id})">
                                ${isActive ? 'PAUSE' : 'RESUME'}
                            </button>
                            <button class="intel-action-btn outline" style="color:var(--risk-high);border-color:rgba(239,68,68,0.3);padding:6px 12px;font-size:0.7rem" onclick="deleteAlgoBot(${b.id})">
                                DESTRUCT
                            </button>
                        </div>
                    </div>
                </div>
            `}).join('');
        } else {
            listEl.innerHTML = `
                <div style="text-align:center;padding:3rem 1rem;color:var(--text-dim)">
                    <span class="material-symbols-outlined" style="font-size:2rem;opacity:0.5;margin-bottom:1rem">smart_toy</span>
                    <p style="font-size:0.85rem">No active strategies running.</p>
                </div>
            `;
        }
    } catch (e) {
        listEl.innerHTML = `<p style="color:var(--risk-high);font-size:0.85rem">Failed to load active bots.</p>`;
    }
}

async function saveAlgoBot() {
    const name = document.getElementById('bot-name').value.trim();
    const asset = document.getElementById('bot-asset').value.trim() || 'ANY';
    const zscore = document.getElementById('bot-zscore').value;
    const regime = document.getElementById('bot-regime').value;
    const side = document.getElementById('bot-side').value;
    const amount = document.getElementById('bot-amount').value;
    const exchange = document.getElementById('bot-exchange').value;
    const tp = document.getElementById('bot-tp').value;
    const sl = document.getElementById('bot-sl').value;

    if (!name) return showToast('ERROR', 'Bot name is required', 'alert');
    if (!exchange) return showToast('ERROR', 'You must select an exchange to route orders to. Link one in KeyVault.', 'alert');

    const payload = {
        name: name,
        asset: asset,
        condition_zscore: zscore,
        condition_regime: regime,
        action_side: side,
        action_amount: amount,
        action_exchange: exchange,
        take_profit_pct: tp,
        stop_loss_pct: sl
    };

    try {
        const res = await fetchAPI('/algo-bots', 'POST', payload);

        if (res && res.success) {
            showToast('DEPLOYED', `Strategy ${name} is now live.`, 'success');
            document.getElementById('bot-name').value = '';
            loadAlgoBots();
        } else {
            throw new Error(res?.error || 'Failed to deploy bot');
        }
    } catch (e) {
        showToast('ERROR', e.message, 'alert');
    }
}

async function runAlgoBacktest() {
    const asset = document.getElementById('bot-asset').value.trim() || 'ANY';
    const zscore = document.getElementById('bot-zscore').value;
    const regime = document.getElementById('bot-regime').value;
    const side = document.getElementById('bot-side').value;
    const tp = document.getElementById('bot-tp').value;
    const sl = document.getElementById('bot-sl').value;

    const payload = {
        asset: asset,
        condition_zscore: zscore,
        condition_regime: regime,
        action_side: side,
        take_profit_pct: tp,
        stop_loss_pct: sl
    };

    showToast('SIMULATING', 'Running 90-day strategy backtest...', 'info');

    try {
        const res = await fetchAPI('/algo-bots/backtest', 'POST', payload);
        if (res && !res.error) {
            renderBacktestResults(res);
        } else {
            throw new Error(res?.error || 'Failed to backtest');
        }
    } catch (e) {
        showToast('ERROR', e.message, 'alert');
    }
}

function renderBacktestResults(data) {
    const container = document.getElementById('backtest-results-container');
    if (!container) return;

    const tradesList = data.trades.map(t => {
        const color = t.pnl_pct > 0 ? 'var(--risk-low)' : 'var(--risk-high)';
        return `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.8rem;font-family:var(--font-mono)">
            <span style="color:var(--text-dim)">${t.date} | ${t.side}</span>
            <span>$${t.entry.toFixed(2)} &rarr; $${t.exit.toFixed(2)}</span>
            <span style="color:${color};font-weight:bold">${t.pnl_pct > 0 ? '+' : ''}${t.pnl_pct.toFixed(2)}% ($${t.gross.toFixed(2)})</span>
        </div>`;
    }).join('');

    container.innerHTML = `
        <div class="glass-panel" style="background:var(--bg-card); border:1px solid var(--accent); border-radius:12px; padding:2rem; margin-top:2rem;">
            <h2 style="font-size:1.1rem;margin-bottom:1rem;color:var(--text);display:flex;align-items:center;gap:8px">
                <span class="material-symbols-outlined" style="color:var(--risk-low)">query_stats</span> Backtest Simulation (90d)
            </h2>
            
            <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:1rem;margin-bottom:1.5rem">
                <div style="background:rgba(255,255,255,0.02);padding:1rem;border-radius:8px;border:1px solid var(--border)">
                    <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:4px">NET PROFIT</div>
                    <div style="font-size:1.4rem;font-weight:700;color:${data.stats.net_profit > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}">$${data.stats.net_profit.toFixed(2)}</div>
                </div>
                <div style="background:rgba(255,255,255,0.02);padding:1rem;border-radius:8px;border:1px solid var(--border)">
                    <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:4px">WIN RATE</div>
                    <div style="font-size:1.4rem;font-weight:700;color:var(--text)">${data.stats.win_rate.toFixed(1)}%</div>
                </div>
                <div style="background:rgba(255,255,255,0.02);padding:1rem;border-radius:8px;border:1px solid var(--border)">
                    <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:4px">TOTAL TRADES</div>
                    <div style="font-size:1.4rem;font-weight:700;color:var(--text)">${data.stats.total_trades}</div>
                </div>
                <div style="background:rgba(255,255,255,0.02);padding:1rem;border-radius:8px;border:1px solid var(--border)">
                    <div style="font-size:0.7rem;color:var(--text-dim);margin-bottom:4px">MAX DRAWDOWN</div>
                    <div style="font-size:1.4rem;font-weight:700;color:var(--risk-high)">${data.stats.max_drawdown.toFixed(1)}%</div>
                </div>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;padding:1rem;max-height:250px;overflow-y:auto;background:rgba(0,0,0,0.2)">
                <h3 style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.5rem;letter-spacing:1px">LAST 15 TRADES (MOCK)</h3>
                ${tradesList || '<div style="font-size:0.8rem;color:var(--text-dim)">No trades triggered in this period. Lower Z-Score threshold.</div>'}
            </div>
        </div>
    `;
    
    // Scroll to results easily
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function toggleAlgoBot(id) {
    try {
        const res = await fetchAPI('/algo-bots/toggle', 'POST', { id: id });
        if (res && res.success) {
            showToast('STATUS UPDATED', `Bot is now ${res.status}.`, 'info');
            loadAlgoBots();
        } else {
            throw new Error(res?.error || 'Failed to toggle status');
        }
    } catch (e) {
        showToast('ERROR', e.message, 'alert');
    }
}

async function deleteAlgoBot(id) {
    if (!confirm('Permanently delete this strategy?')) return;
    try {
        const res = await fetchAPI(`/algo-bots?id=${id}`, 'DELETE');
        if (res && res.success) {
            showToast('DELETED', 'Strategy removed successfully.', 'success');
            loadAlgoBots();
        } else {
            throw new Error(res?.error || 'Failed to delete bot');
        }
    } catch (e) {
        showToast('ERROR', e.message, 'alert');
    }
}
