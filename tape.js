class TapeReader {
    constructor(containerId, ticker) {
        this.containerId = containerId;
        this.ticker = ticker;
        this.interval = null;
        this.lastRenderedIds = new Set();
        this.el = document.getElementById(this.containerId);
        
        if (this.el) {
            this.el.innerHTML = `
                <div class="tape-reader-wrapper" style="background:var(--bg-card); border-radius:8px; border:1px solid rgba(255,255,255,0.05); overflow:hidden; display:flex; flex-direction:column; height:350px;">
                    <div style="display:flex; justify-content:space-between; padding:8px 12px; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.6rem; font-weight:900; letter-spacing:1px; color:var(--text-dim);">
                        <div style="flex:1">TIME</div>
                        <div style="flex:2; text-align:right">PRICE</div>
                        <div style="flex:2; text-align:right">SIZE / VALUE <span style="font-size:8px;opacity:0.6">(USD)</span></div>
                    </div>
                    <div id="tape-rows-container" style="flex:1; overflow-y:auto; scrollbar-width:none"></div>
                </div>
            `;
            this.rowsContainer = document.getElementById('tape-rows-container');
        }
    }

    async poll() {
        if (!this.el || !this.rowsContainer) return;
        try {
            const data = await fetchAPI(`/tape?ticker=${this.ticker}`);
            if (data && data.trades) {
                this.renderTrades(data.trades);
            }
        } catch (e) {
            console.error('[TapeReader] Error polling tape:', e);
        }
    }

    renderTrades(trades) {
        // Reverse trades if they come newest-first, we usually want to prepend newest
        
        let newHtml = '';
        let newCount = 0;
        
        trades.forEach(t => {
            const rowId = t.id || `${t.time}-${t.price}-${t.size}`;
            
            // Highlight styling
            const isBuy = t.side === 'BUY';
            const color = isBuy ? 'var(--risk-low)' : 'var(--risk-high)';
            const bgHover = isBuy ? 'rgba(74, 222, 128, 0.05)' : 'rgba(248, 113, 113, 0.05)';
            
            // Format numbers
            const p = window.formatCurrency ? window.formatCurrency(t.price) : `$${t.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`;
            const v = window.formatCompactCurrency ? window.formatCompactCurrency(t.value) : `$${(t.value/1000).toFixed(1)}k`;
            const s = t.size.toLocaleString(undefined, {maximumFractionDigits:4});
            
            // Institutional Flag (large print)
            const isLargePrint = t.institutional || t.value > 100000;
            const whaleIcon = isLargePrint ? `<span class="material-symbols-outlined" style="font-size:0.75rem; vertical-align:middle; margin-right:4px; color:${color}">waves</span>` : '';
            
            // Anim class for new rows
            const animClass = this.lastRenderedIds.has(rowId) ? '' : 'tape-row-flash';
            
            newHtml += `
                <div class="tape-row ${animClass}" style="display:flex; justify-content:space-between; align-items:center; padding:6px 12px; font-family:'JetBrains Mono', monospace; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.03); transition:background 0.2s" onmouseover="this.style.background='${bgHover}'" onmouseout="this.style.background='transparent'">
                    <div style="flex:1; color:var(--text-dim); font-size:0.65rem">${t.time}</div>
                    <div style="flex:2; text-align:right; font-weight:700; color:${color}">${whaleIcon}${p}</div>
                    <div style="flex:2; text-align:right;">
                        <div style="color:var(--text-main); font-weight:900;">${s}</div>
                        <div style="font-size:0.55rem; color:var(--text-dim); margin-top:2px">${v}</div>
                    </div>
                </div>
            `;
            
            this.lastRenderedIds.add(rowId);
        });

        // Add a simple fade-in flash for new execution rows
        if (!document.getElementById('tape-styles')) {
            const style = document.createElement('style');
            style.id = 'tape-styles';
            style.innerHTML = `
                @keyframes tapeFlash {
                    0% { background: rgba(255,255,255,0.1); }
                    100% { background: transparent; }
                }
                .tape-row-flash {
                    animation: tapeFlash 1s ease-out;
                }
            `;
            document.head.appendChild(style);
        }

        this.rowsContainer.innerHTML = newHtml;
    }

    start() {
        this.poll(); // Initial load
        this.interval = setInterval(() => this.poll(), 3000); // Polling every 3s
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
