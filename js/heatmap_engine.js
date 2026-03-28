/**
 * AlphaSignal Heatmap Engine v1.1
 * Specialized Canvas-based overlay for LightweightCharts v3.8
 * Features: Relative Scaling, HSL Gradients, and Persistence Detection ("Gold Walls").
 */
class HeatmapOverlay {
    constructor(chart, mainSeries, options = {}) {
        this.chart = chart;
        this.mainSeries = mainSeries;
        this.data = []; // [{t: timestamp, p: price, s: size, side: 'bid'|'ask'}]
        this.persistenceMap = {};
        this.canvas = null;
        this.ctx = null;
        this.intensity = options.intensity || 0.6;
        this.isRendering = false; // Throttle flag
        
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none'; 
        this.canvas.id = 'heatmap-overlay-canvas';
        this.ctx = this.canvas.getContext('2d');
        
        const chartContainer = document.querySelector('#advanced-chart-container div');
        if (chartContainer) {
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(this.canvas);
        }

        // Throttle high-frequency chart events
        const throttledRender = () => {
            if (this.isRendering) return;
            this.isRendering = true;
            requestAnimationFrame(() => {
                this.render();
                this.isRendering = false;
            });
        };

        this.chart.timeScale().subscribeVisibleTimeRangeChange(throttledRender);
        this.chart.timeScale().subscribeVisibleLogicalRangeChange(throttledRender);
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        const pane = document.querySelector('#advanced-chart-container canvas');
        if (!pane) return;
        this.canvas.width = pane.width;
        this.canvas.height = pane.height;
        this.canvas.style.width = pane.style.width;
        this.canvas.style.height = pane.style.height;
        this.render();
    }

    setData(data) {
        this.data = data;
        
        // 1. Analyze for Persistence (Gold Walls)
        this.persistenceMap = {};
        const timestamps = new Set(data.map(d => d.t));
        const totalSnapshots = timestamps.size || 1;
        
        data.forEach(d => {
            const key = `${d.side}_${d.p.toFixed(2)}`;
            this.persistenceMap[key] = (this.persistenceMap[key] || 0) + 1;
        });

        // Flag persistent data points
        this.data = data.map(d => {
            const key = `${d.side}_${d.p.toFixed(2)}`;
            const persistenceRatio = this.persistenceMap[key] / totalSnapshots;
            return {
                ...d,
                isPersistent: persistenceRatio > 0.15, // structural structural
                persistenceRatio
            };
        });

        this.render();
    }

    setIntensity(val) {
        this.intensity = val;
        this.render();
    }

    getColor(side, ratio, isPersistent) {
        const op = Math.min(1, ratio * this.intensity * 2.0); 
        
        if (isPersistent) {
            // Premium Gold Flare for structural support
            return `hsla(45, 100%, 55%, ${op * 1.3})`;
        }

        if (side === 'bid') {
            // Bid Spectrum: Deep Navy -> Neon Cyan -> Electric White
            if (ratio < 0.3) return `hsla(200, 100%, 25%, ${op})`;
            if (ratio < 0.7) return `hsla(180, 100%, 50%, ${op})`;
            return `hsla(180, 100%, 85%, ${op})`;
        } else {
            // Ask Spectrum: Blood Red -> Vibrant Orange -> Golden Flare
            if (ratio < 0.3) return `hsla(0, 100%, 30%, ${op})`;
            if (ratio < 0.7) return `hsla(25, 100%, 55%, ${op})`;
            return `hsla(45, 100%, 75%, ${op})`;
        }
    }

    render() {
        if (!this.ctx || !this.data.length) return;

        const timeScale = this.chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        if (!visibleRange) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let maxVolume = 1;
        const visibleData = this.data.filter(d => d.t >= visibleRange.from && d.t <= visibleRange.to);
        if (visibleData.length === 0) return;

        visibleData.forEach(d => { if (d.s > maxVolume) maxVolume = d.s; });

        // Calculate bar width based on timescale
        const p1 = timeScale.timeToCoordinate(visibleRange.from);
        const p2 = timeScale.timeToCoordinate(visibleRange.from + 60);
        const barWidth = Math.abs((p2 || p1 + 10) - p1) * 0.95; 

        visibleData.forEach(d => {
            const x = timeScale.timeToCoordinate(d.t);
            const y = this.mainSeries.priceToCoordinate(d.p);
            
            if (x === null || y === null || isNaN(y)) return;

            const ratio = d.s / maxVolume;
            const color = this.getColor(d.side, ratio, d.isPersistent);
            
            this.ctx.fillStyle = color;
            
            if (d.isPersistent) {
                // Multi-layered structural glow
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
            } else if (ratio > 0.8) {
                // Secondary glow for massive instantaneous walls
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = color;
            } else {
                this.ctx.shadowBlur = 0;
            }

            const hShift = Math.max(1, Math.round(ratio * 2));
            this.ctx.fillRect(x - barWidth / 2, y - hShift, barWidth, hShift * 2 + 1);
        });
        
        this.ctx.shadowBlur = 0;
    }

    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

window.HeatmapOverlay = HeatmapOverlay;
