// ============================================================
// Institutional Trade Ledger Audit
// ============================================================

async function renderTradeLedger(tabs = null) {
    // Rely on global auditHubTabs if none provided.
    if (!tabs) tabs = window.auditHubTabs || [
        { id: 'performance',      label: 'PERFORMANCE',     view: 'performance-dashboard', icon: 'trending_up' },
        { id: 'ledger',           label: 'TRADE LEDGER',    view: 'trade-ledger',          icon: 'list_alt' },
        { id: 'strategy-report',  label: 'STRATEGY REPORT', view: 'strategy-report',       icon: 'insert_chart' }
    ];

    appEl.innerHTML = skeleton();
    
    try {
        const res = await fetchAPI('/trade-ledger');
        if (!res || res.error) {
            appEl.innerHTML = `
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Audit &amp; Performance Hub</h2>
                        <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">receipt_long</span>Trade Ledger <span class="premium-badge">AUDIT</span></h1>
                    </div>
                </div>
                ${renderHubTabs('ledger', tabs)}
                <div class="card" style="padding:2.5rem;text-align:center;color:var(--text-dim);border:1px solid rgba(239, 68, 68, 0.2)">
                    <span class="material-symbols-outlined" style="font-size:3rem;opacity:0.5;color:var(--risk-high)">vpn_key_off</span>
                    <h3 style="margin:1rem 0 0.5rem;color:white">Live Exchange Unreachable</h3>
                    <p style="margin:0 0 1.5rem;color:var(--risk-high);font-size:0.8rem">${res?.error || 'Failed to connect to OMS Gateway.'}</p>
                    <div>
                        <button class="intel-action-btn" onclick="switchView('exchange-keys')"><span class="material-symbols-outlined" style="vertical-align:middle;font-size:16px;margin-right:6px">settings</span> CONFIGURE EXCHANGE KEYS</button>
                    </div>
                </div>
            `;
            return;
        }

        let trades = Array.isArray(res) ? res : (res.data || []);
        let currentPage = 1;
        const itemsPerPage = 15;

        // KPI Aggregations
        const totalVolume = trades.reduce((sum, t) => sum + (t.qty * t.entry_price), 0);
        const totalFees = trades.reduce((sum, t) => sum + t.fee_paid, 0);
        const netPnl = trades.reduce((sum, t) => sum + t.realised_pnl, 0);
        const closedTrades = trades.filter(t => t.realised_pnl !== 0);
        const winRate = closedTrades.length > 0 ? (closedTrades.filter(t => t.realised_pnl > 0).length / closedTrades.length) * 100 : 0;

        const kpiHtml = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem">
                <div class="card" style="padding:1.2rem;text-align:center;background:rgba(0,0,0,0.2)">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:6px">CUMULATIVE VOLUME</div>
                    <div style="font-size:1.3rem;font-weight:900;color:white;font-family:var(--font-mono)">$${totalVolume.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                </div>
                <div class="card" style="padding:1.2rem;text-align:center;background:rgba(0,0,0,0.2)">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:6px">TOTAL FEES PAID</div>
                    <div style="font-size:1.3rem;font-weight:900;color:#f59e0b;font-family:var(--font-mono)">$${totalFees.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                </div>
                <div class="card" style="padding:1.2rem;text-align:center;background:rgba(0,0,0,0.2)">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:6px">NET REALISED P&L</div>
                    <div style="font-size:1.3rem;font-weight:900;color:${netPnl >= 0 ? 'var(--risk-low)' : 'var(--risk-high)'};font-family:var(--font-mono)">
                        ${netPnl >= 0 ? '+' : ''}$${netPnl.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </div>
                </div>
                <div class="card" style="padding:1.2rem;text-align:center;background:rgba(0,0,0,0.2)">
                    <div style="font-size:0.55rem;color:var(--text-dim);letter-spacing:1.5px;margin-bottom:6px">EXECUTION WIN RATE</div>
                    <div style="font-size:1.3rem;font-weight:900;color:var(--text);font-family:var(--font-mono)">${winRate.toFixed(1)}%</div>
                </div>
            </div>
        `;

        // Pagination State Wrapper
        window._ledgerTrades = trades;
        
        window.drawAuditLedgerPage = function(pageOverride) {
            if (pageOverride) currentPage = pageOverride;
            
            const totalPages = Math.ceil(trades.length / itemsPerPage) || 1;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const currentTrades = trades.slice(startIndex, startIndex + itemsPerPage);

            appEl.innerHTML = `
                <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:15px">
                    <div>
                        <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Audit &amp; Performance Hub</h2>
                        <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">receipt_long</span>Trade Ledger <span class="premium-badge">AUDIT</span></h1>
                        <p class="subtitle" style="margin:4px 0 0 0">Immutable tax & execution receipt ledger synchronized from Exchange API.</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px; margin-bottom:5px">
                        <button class="filter-btn" id="btn-prev-ledger" aria-label="Go to previous ledger page" ${currentPage === 1 ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>&larr; Prev</button>
                        <span style="font-size:0.75rem; color:var(--text-dim); font-family:'JetBrains Mono'">Page ${currentPage} of ${totalPages}</span>
                        <button class="filter-btn" id="btn-next-ledger" aria-label="Go to next ledger page" ${currentPage === totalPages ? 'disabled style="opacity:0.3; cursor:not-allowed"' : ''}>Next &rarr;</button>
                        
                        <button class="intel-action-btn mini outline" onclick="exportLedgerCSV()" style="margin-left:10px; display:flex; align-items:center; gap:4px">
                            <span class="material-symbols-outlined" style="font-size:14px">download</span> EXPORT 1099 CSV
                        </button>
                    </div>
                </div>
                ${renderHubTabs('ledger', tabs)}
                
                ${kpiHtml}

                <div class="ledger-container">
                    <table class="ledger-table">
                        <thead>
                            <tr>
                                <th>TIME / RECEIPT</th>
                                <th>TICKER</th>
                                <th>SIDE</th>
                                <th>FILL PRICE</th>
                                <th>FILLED QTY</th>
                                <th>FEE (USDT)</th>
                                <th>REALISED P&L</th>
                                <th>VENUE</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${currentTrades.length ? currentTrades.map(t => `
                                <tr>
                                    <td>
                                        <div style="color:var(--text); font-size:0.75rem; font-family:var(--font-mono)">${t.timestamp}</div>
                                        <div style="color:var(--text-dim); font-size:0.5rem; font-family:var(--font-mono)">ID: ${t.id}</div>
                                    </td>
                                    <td style="font-weight:900; font-family:var(--font-ui)">${t.ticker}</td>
                                    <td>
                                        <span style="padding:3px 6px; border-radius:4px; font-size:0.6rem; font-weight:900; letter-spacing:1px; background:${t.side === 'BUY' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; color:${t.side === 'BUY' ? '#22c55e' : '#ef4444'}; border:1px solid ${t.side === 'BUY' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}">
                                            ${t.side}
                                        </span>
                                    </td>
                                    <td style="font-family:var(--font-mono)">$${t.entry_price.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                                    <td style="font-family:var(--font-mono); color:var(--text-dim)">${t.qty}</td>
                                    <td style="font-family:var(--font-mono); color:#f59e0b">$${t.fee_paid.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                    <td style="font-family:var(--font-mono); font-weight:900; color:${t.realised_pnl > 0 ? 'var(--risk-low)' : (t.realised_pnl < 0 ? 'var(--risk-high)' : 'var(--text-dim)')}">
                                        ${t.realised_pnl !== 0 ? (t.realised_pnl > 0 ? '+' : '') + '$' + t.realised_pnl.toLocaleString(undefined, {minimumFractionDigits:2}) : '-'}
                                    </td>
                                    <td>
                                        <div style="font-size:0.65rem; color:var(--text-dim); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; display:inline-block">
                                            ${t.exchange}
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-dim)">No executions found on connected OMS sequence.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            const btnPrev = document.getElementById('btn-prev-ledger');
            const btnNext = document.getElementById('btn-next-ledger');
            if(btnPrev) btnPrev.addEventListener('click', () => { if(currentPage > 1) { currentPage--; window.drawAuditLedgerPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
            if(btnNext) btnNext.addEventListener('click', () => { if(currentPage < totalPages) { currentPage++; window.drawAuditLedgerPage(); window.scrollTo({top:0, behavior:'smooth'}); }});
        }

        window.drawAuditLedgerPage();

    } catch (e) {
        appEl.innerHTML = `<div class="card" style="padding:2rem;text-align:center;color:var(--risk-high)">Failed to load Trade Ledger Audit: ${e.message}</div>`;
    }
}

window.exportLedgerCSV = function() {
    if (!window._ledgerTrades || window._ledgerTrades.length === 0) {
        showToast('CSV EXPORT', 'No data to export.', 'alert');
        return;
    }
    
    // Headers matching the grid
    const headers = ['Receipt ID', 'Timestamp', 'Ticker', 'Action Side', 'Fill Price', 'Filled Quantity', 'Fee Paid (USDT)', 'Realised PNL', 'Exchange Venue', 'Fee Tier'];
    
    // Build CSV content
    const csvRows = [headers.join(',')];
    window._ledgerTrades.forEach(t => {
        const row = [
            t.id,
            t.timestamp,
            t.ticker,
            t.side,
            t.entry_price,
            t.qty,
            t.fee_paid,
            t.realised_pnl,
            t.exchange,
            t.is_maker ? 'Maker' : 'Taker'
        ];
        csvRows.push(row.join(','));
    });
    
    const csvData = csvRows.join('\\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `AlphaSignal_Institutional_Tax_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
    showToast('DOWNLOAD COMPLETE', 'Institutional CSV exported successfully.', 'success');
};
