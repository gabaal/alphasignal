/**
 * Pack I: High-Resolution Order Flow Simulation (Tape Reader)
 * High-speed L2 transaction stream for AlphaSignal detail view.
 */
class TapeReader {
    constructor(containerId, ticker) {
        this.container = document.getElementById(containerId);
        this.ticker = ticker;
        this.running = false;
        this.maxRows = 20;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.container.innerHTML = `
            <div class="tape-header">
                <div class="tape-col">TIME</div>
                <div class="tape-col">PRICE</div>
                <div class="tape-col">SIZE (BTC)</div>
                <div class="tape-col">SIDE</div>
            </div>
            <div id="tape-stream" class="tape-stream"></div>
        `;
        this.streamEl = document.getElementById('tape-stream');
        this.loop();
    }

    stop() {
        this.running = false;
    }

    async loop() {
        if (!this.running) return;

        // Simulate varying trade frequency
        const delay = Math.random() * 800 + 200;
        
        const price = window.lastBasePrice || 70000;
        const tick = (Math.random() - 0.5) * 50;
        const size = (Math.random() * 0.5 + 0.01).toFixed(4);
        const side = Math.random() > 0.48 ? 'BUY' : 'SELL';
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const row = document.createElement('div');
        row.className = `tape-row ${side.toLowerCase()}`;
        row.innerHTML = `
            <div class="tape-col">${now}</div>
            <div class="tape-col">$${(price + tick).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            <div class="tape-col">${size}</div>
            <div class="tape-col">${side}</div>
        `;

        if (this.streamEl.firstChild) {
            this.streamEl.insertBefore(row, this.streamEl.firstChild);
        } else {
            this.streamEl.appendChild(row);
        }

        if (this.streamEl.children.length > this.maxRows) {
            this.streamEl.removeChild(this.streamEl.lastChild);
        }

        setTimeout(() => this.loop(), delay);
    }
}

window.TapeReader = TapeReader;
