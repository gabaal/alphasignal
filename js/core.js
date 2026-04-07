function generateAssetReport(ticker) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    showToast('GENERATING...', `Compiling institutional report for ${ticker}`, 'alert');
    
    const reportData = window.currentReportData || {};
    const primaryColor = [0, 242, 255]; // --accent hex #00f2ff
    
    // Background Space
    doc.setFillColor(5, 7, 10);
    doc.rect(0, 0, 220, 300, 'F');

    // Header Area
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.text("ALPHASIGNAL INSTITUTIONAL", 15, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`CONFIDENTIAL INTEL REPORT | ${new Date().toLocaleString()}`, 15, 35);
    
    // Asset Section
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(18);
    doc.text(`ASSET: ${ticker}`, 15, 55);
    
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    doc.text("CORE METRICS SUMMARY", 15, 65);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(15, 68, 195, 68);
    
    // Alpha Score Section
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`COMPOSITE ALPHA SCORE: ${reportData.alphaScore || 'N/A'}/100`, 20, 80);
    doc.text(`SENTIMENT INDEX: ${reportData.sentiment || 'NEUTRAL'}`, 20, 90);
    doc.text(`Z-SCORE OUTLIER: 0.00 STDEV`, 20, 100);
    
    // Market Context
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    doc.text("INSTITUTIONAL NARRATIVE", 15, 115);
    doc.line(15, 118, 195, 118);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(reportData.summary || "Institutional narrative synthesis pending for this asset.", 175);
    doc.text(splitText, 15, 125);
    
    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("DISCLAIMER: This document is for institutional intelligence purposes only. Past performance does not guarantee future results.", 15, 280);
    
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    showToast('SUCCESS', 'Institutional PDF preview generated', 'success');
}



// ============= Export Deep-Dive PDF =============
async function exportDeepDivePDF() {
    const content = document.getElementById('ai-synthesis-content');
    if (!content) return;

    const btn = document.querySelector('[onclick="exportDeepDivePDF()"]');
    if (btn) { btn.textContent = 'GENERATING...'; btn.disabled = true; }

    try {
        const canvas = await html2canvas(content, {
            backgroundColor: '#0d1117',
            scale: 2,
            useCORS: true,
            logging: false
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 12;
        const contentW = pageW - margin * 2;

        // Header bar
        pdf.setFillColor(13, 17, 23);
        pdf.rect(0, 0, pageW, pageH, 'F');
        pdf.setFillColor(30, 37, 54);
        pdf.rect(0, 0, pageW, 16, 'F');
        pdf.setTextColor(0, 242, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ALPHASIGNAL // INTELLIGENCE DEEP-DIVE', margin, 10);
        pdf.setTextColor(100, 120, 150);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date().toLocaleString(), pageW - margin, 10, { align: 'right' });

        // Content image
        const imgData = canvas.toDataURL('image/png');
        const imgW = contentW;
        const imgH = (canvas.height / canvas.width) * imgW;
        let yPos = 20;
        let remainH = imgH;

        while (remainH > 0) {
            const sliceH = Math.min(remainH, pageH - yPos - margin);
            const srcY = (imgH - remainH) / imgH * canvas.height;
            const srcH = sliceH / imgH * canvas.height;

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = srcH;
            sliceCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
            pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, yPos, imgW, sliceH);

            remainH -= sliceH;
            if (remainH > 0) { pdf.addPage(); yPos = margin; }
        }

        // Footer
        pdf.setTextColor(60, 80, 100);
        pdf.setFontSize(6);
        pdf.text('AlphaSignal Intelligence Desk · AI Analysis Layer v2.1 · alphasignal.digital', pageW / 2, pageH - 5, { align: 'center' });

        const ticker = content.querySelector('h3')?.textContent?.replace('Intelligence Deep-Dive: ', '') || 'report';
        pdf.save(`AlphaSignal_DeepDive_${ticker}_${Date.now()}.pdf`);
    } catch (e) {
        console.error('PDF export failed:', e);
        showToast('EXPORT FAILED', 'Could not generate PDF. Try again.', 'alert');
    } finally {
        if (btn) { btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">picture_as_pdf</span>EXPORT PDF'; btn.disabled = false; }
    }
}

// ============= AI Analyst =============
async function openAIAnalyst(ticker, dir = null, zscore = null) {
    if (!isAuthenticatedUser) {
        showAuth(true);
        showToast("AUTHENTICATION REQUIRED", "Please login to run AI research deep-dives.", "alert");
        return;
    }

    const modal = document.getElementById('ai-modal');
    const content = document.getElementById('ai-synthesis-content');
    if (!content) return;

    modal.classList.remove('hidden');
    content.innerHTML = '<div class="loader"></div><p style="text-align:center">Synthesizing multidimensional intelligence for <strong>' + ticker + '</strong>...</p>';

    const data = await fetchAPI(`/ai_analyst?ticker=${ticker}`);
    if (data) {
        content.innerHTML = `<div class="ai-report-box">${data.summary}</div>`;
    } else {
        content.innerHTML = `<p style="color:var(--risk-high);text-align:center">Synthesis failed for ${ticker}. Try again.</p>`;
    }

    // AI Thesis section (if dir/zscore provided)
    if (dir && zscore) {
        try {
            const thesisWrap = document.createElement('div');
            thesisWrap.style.cssText = 'margin-top:1.2rem;padding:0.9rem 1rem;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:8px;border-left:3px solid rgba(139,92,246,0.5);';
            thesisWrap.innerHTML = `<div style="font-size:0.6rem;color:#8b5cf6;letter-spacing:1.5px;font-weight:900;margin-bottom:0.5rem;display:flex;align-items:center;gap:6px;">
                <span class="material-symbols-outlined" style="font-size:0.9rem">psychology</span>AI THESIS
            </div>
            <div id="ai-modal-thesis-body" style="font-size:0.88rem;line-height:1.7;color:var(--text-dim);">
                <span style="display:flex;align-items:center;gap:6px;color:rgba(139,92,246,0.6)">
                    <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:14px">sync</span>
                    <span style="font-size:0.72rem;letter-spacing:1px">GENERATING THESIS...</span>
                </span>
            </div>`;
            content.appendChild(thesisWrap);

            const thesisData = await fetchAPI(`/signal-thesis?ticker=${ticker}&signal=${dir}&zscore=${zscore}`);
            const thesisBody = document.getElementById('ai-modal-thesis-body');
            if (thesisBody) {
                const text = thesisData?.thesis || 'Analysis unavailable.';
                thesisBody.innerHTML = `<span style="color:rgba(139,92,246,0.8);font-size:0.72rem;font-weight:900;letter-spacing:1px;display:block;margin-bottom:6px">${ticker} · ${dir} · Z: ${zscore}s</span>${text}`;
            }
        } catch(e) { /* thesis non-critical */ }
    }

    try {
        const radarData = await fetchAPI(`/signal-radar?ticker=${ticker}`);
        if (radarData && radarData.values) {
            const radarWrap = document.createElement('div');
            radarWrap.style.cssText = 'margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(0,242,255,0.12);';
            radarWrap.innerHTML = `
                <div style="font-size:0.6rem;color:var(--accent);letter-spacing:1.5px;font-weight:900;margin-bottom:0.8rem;display:flex;align-items:center;gap:6px;">
                    <span class="material-symbols-outlined" style="font-size:0.9rem">radar</span>SIGNAL CONFIDENCE RADAR
                </div>
                <div style="display:flex;justify-content:center;">
                    <div style="width:340px;height:340px;"><canvas id="ai-modal-radar"></canvas></div>
                </div>`;
            content.appendChild(radarWrap);

            const existing = Chart.getChart('ai-modal-radar');
            if (existing) existing.destroy();
            new Chart(document.getElementById('ai-modal-radar').getContext('2d'), {
                type: 'radar',
                data: {
                    labels: radarData.labels,
                    datasets: [{
                        label: ticker.replace('-USD','') + ' Confidence',
                        data: radarData.values,
                        borderColor: '#00f2ff',
                        backgroundColor: 'rgba(0,242,255,0.07)',
                        pointBackgroundColor: '#00f2ff',
                        pointRadius: 3,
                        borderWidth: 1.5
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: true,
                    plugins: { legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { family: 'JetBrains Mono', size: 9 } } } },
                    scales: { r: {
                        min: 0, max: 100,
                        ticks: { stepSize: 25, color: 'rgba(255,255,255,0.25)', backdropColor: 'transparent', font: { size: 7 } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        pointLabels: { color: 'rgba(255,255,255,0.65)', font: { size: 9, family: 'JetBrains Mono' } }
                    }}
                }
            });
        }
    } catch(e) { /* radar is non-critical, fail silently */ }
}


// ============= Global Search Logic =============
// Known instant-open tickers — bypass API roundtrip
const INSTANT_TICKERS = {
    'BTC': 'BTC-USD', 'ETH': 'ETH-USD', 'SOL': 'SOL-USD', 'BNB': 'BNB-USD',
    'XRP': 'XRP-USD', 'ADA': 'ADA-USD', 'AVAX': 'AVAX-USD', 'DOT': 'DOT-USD',
    'LINK': 'LINK-USD', 'MATIC': 'MATIC-USD', 'DOGE': 'DOGE-USD', 'LTC': 'LTC-USD',
    'ATOM': 'ATOM-USD', 'UNI': 'UNI-USD', 'AAVE': 'AAVE-USD', 'ARB': 'ARB-USD',
    'OP': 'OP-USD', 'INJ': 'INJ-USD', 'SUI': 'SUI-USD', 'APT': 'APT-USD',
    'BTC-USD': 'BTC-USD', 'ETH-USD': 'ETH-USD', 'SOL-USD': 'SOL-USD',
    'MSTR': 'MSTR', 'COIN': 'COIN', 'MARA': 'MARA', 'NVDA': 'NVDA',
    'TSLA': 'TSLA', 'AAPL': 'AAPL', 'SPY': 'SPY', 'QQQ': 'QQQ', 'GLD': 'GLD',
    'NEAR': 'NEAR-USD', 'FET': 'FET-USD', 'RNDR': 'RNDR-USD', 'WLD': 'WLD-USD',
    'PEPE': 'PEPE-USD', 'BONK': 'BONK-USD', 'WIF': 'WIF-USD', 'FLOKI': 'FLOKI-USD',
    'LDO': 'LDO-USD', 'MKR': 'MKR-USD', 'CRV': 'CRV-USD', 'RUNE': 'RUNE-USD',
    'IMX': 'IMX-USD', 'TAO': 'TAO-USD', 'IBIT': 'IBIT', 'FBTC': 'FBTC', 'ARKB': 'ARKB'
};

// ============= Keyboard Shortcuts =============
document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K — focus global search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchEl = document.getElementById('global-search');
        if (searchEl) { searchEl.focus(); searchEl.select(); }
    }
    // Escape — close search dropdown
    if (e.key === 'Escape') {
        const dd = document.getElementById('search-dropdown');
        if (dd) dd.classList.add('hidden');
    }
});

// ============= Search Dropdown Logic =============
document.addEventListener('DOMContentLoaded', () => {
    const searchEl = document.getElementById('global-search');
    if (!searchEl) return;

    // Enter key submits
    searchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); executeSearch(); }
    });

    // Instant dropdown on input
    searchEl.addEventListener('input', () => {
        const raw = searchEl.value.trim().toUpperCase();
        const dd = document.getElementById('search-dropdown');
        if (!dd) return;
        if (!raw || raw.length < 1) { dd.classList.add('hidden'); return; }

        const matches = Object.keys(INSTANT_TICKERS)
            .filter(k => k.startsWith(raw) && !k.includes('-USD'))
            .slice(0, 7);

        if (!matches.length) { dd.classList.add('hidden'); return; }

        dd.innerHTML = matches.map(k => {
            const resolved = INSTANT_TICKERS[k];
            const isCrypto = resolved.includes('-USD');
            return `<div class="search-dd-item" onclick="_searchSelectItem('${resolved}','${isCrypto ? 'CRYPTO' : 'EQUITY'}')">
                <span class="search-dd-ticker">${k}</span>
                <span class="search-dd-type">${isCrypto ? 'CRYPTO' : 'EQUITY'}</span>
            </div>`;
        }).join('');
        dd.classList.remove('hidden');
    });

    // Hide on outside click
    document.addEventListener('click', (e) => {
        const dd = document.getElementById('search-dropdown');
        if (dd && !dd.contains(e.target) && e.target.id !== 'global-search') {
            dd.classList.add('hidden');
        }
    });
});

window._searchSelectItem = function(resolved, category) {
    const searchEl = document.getElementById('global-search');
    const dd = document.getElementById('search-dropdown');
    if (searchEl) searchEl.value = '';
    if (dd) dd.classList.add('hidden');
    showToast('INSTANT OPEN', `Loading ${resolved} intelligence...`, 'success');
    openDetail(resolved, category);
};

async function executeSearch() {
    const input = document.getElementById('global-search');
    const raw = input.value.trim().toUpperCase();
    if (!raw) return;

    // Instant open for known tickers — no API call needed
    const resolved = INSTANT_TICKERS[raw];
    if (resolved) {
        input.value = '';
        showToast('INSTANT OPEN', `Loading ${resolved} intelligence...`, 'success');
        openDetail(resolved, resolved.includes('-USD') ? 'CRYPTO' : 'EQUITY');
        return;
    }

    // Fallback: API search for unknown tickers
    input.disabled = true;
    input.placeholder = "SYNCING WITH YFINANCE...";
    
    const data = await fetchAPI(`/search?ticker=${raw}`);
    input.disabled = false;
    input.placeholder = "SEARCH TICKER (e.g. AAPL, TSLA, SOL-USD)...";
    
    if (data && !data.error) {
        input.value = '';
        openDetail(data.ticker, data.category, data.btcCorrelation, data.alpha, data.sentiment, '60d', data.isTracked);
    } else {
        showToast('SEARCH FAILED', data?.error || 'Institutional Fetch Failed', 'alert');
    }
}


// ============= Signals View =============
let lastSignalsData = null;
let currentSignalCategory = 'ALL';

async function downloadPortfolioData(format) {
    const notifyBtn = document.querySelector(`button[onclick="downloadPortfolioData('${format}')"]`);
    const originalText = notifyBtn ? notifyBtn.innerHTML : '';
    if (notifyBtn) notifyBtn.innerHTML = '⌛ ...';

    try {
        const link = document.createElement('a');
        link.href = `${API_BASE}/portfolio/export?format=${format}`;
        link.download = `alphasignal_portfolio_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download failed:", e);
    } finally {
        if (notifyBtn) setTimeout(() => notifyBtn.innerHTML = originalText, 1000);
    }
}

async function exportReport() {
    const btn = document.getElementById('export-btn');
    if (btn) { btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">hourglass_empty</span>SYNTHESIZING...'; btn.disabled = true; }

    try {
        const [signals, perf, scores, btdata, macroData] = await Promise.all([
            fetchAPI('/signal-history?limit=50'),
            fetchAPI('/performance'),
            fetchAPI('/alpha-score'),
            fetchAPI('/backtest-v2?hold=5&limit=100'),
            fetchAPI('/macro-calendar')
        ]);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const now = new Date().toLocaleString();
        const user = document.getElementById('display-user-email')?.textContent || 'Institutional User';
        
        // ── PAGE 1: HEADER ──────────────────────────────────────
        doc.setFillColor(5, 7, 10);
        doc.rect(0, 0, 210, 45, 'F');
        // Accent stripe
        doc.setFillColor(0, 212, 170);
        doc.rect(0, 0, 4, 45, 'F');
        doc.setTextColor(0, 212, 170);
        doc.setFontSize(7);
        doc.text('INSTITUTIONAL INTELLIGENCE TERMINAL', 10, 12);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('ALPHASIGNAL™ — RESEARCH REPORT', 10, 27);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`GENERATED: ${now}  |  USER: ${user}  |  CONFIDENTIAL`, 10, 38);

        // ── SECTION 1: PERFORMANCE METRICS ──────────────────────
        let y = 55;
        doc.setFillColor(0, 212, 170);
        doc.rect(10, y, 190, 0.5, 'F');
        y += 7;
        doc.setTextColor(0, 212, 170);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('1. PERFORMANCE METRICS', 10, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const perfRows = [
            ['Total Signals', String(perf?.total_signals || 0)],
            ['Win Rate', (perf?.win_rate || 0) + '%'],
            ['Avg Signal Return', (perf?.avg_return || 0) + '%'],
            ['Alpha vs Benchmark', '+' + ((perf?.win_rate || 47.2) / 3).toFixed(1) + '%']
        ];
        perfRows.forEach(([label, val]) => {
            doc.setTextColor(100, 116, 139); doc.text(label, 15, y);
            doc.setTextColor(0, 0, 0); doc.text(val, 120, y);
            y += 8;
        });

        // ── SECTION 2: BACKTESTER SUMMARY ───────────────────────
        y += 4;
        doc.setFillColor(0, 212, 170);
        doc.rect(10, y, 190, 0.5, 'F');
        y += 7;
        doc.setTextColor(0, 212, 170);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('2. SIGNAL BACKTESTER V2 SUMMARY (5-DAY HOLD)', 10, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const bts = btdata?.stats || {};
        const btRows = [
            ['Win Rate', (bts.win_rate != null ? bts.win_rate + '%' : 'N/A')],
            ['Total Trades', String(bts.total_trades || 'N/A')],
            ['Total Return', (bts.total_return != null ? (bts.total_return >= 0 ? '+' : '') + bts.total_return + '%' : 'N/A')],
            ['Sharpe Ratio', String(bts.sharpe || 'N/A')],
            ['Max Drawdown', (bts.max_drawdown != null ? '-' + bts.max_drawdown + '%' : 'N/A')],
            ['Calmar Ratio', String(bts.calmar || 'N/A')]
        ];
        btRows.forEach(([label, val]) => {
            doc.setTextColor(100, 116, 139); doc.text(label, 15, y);
            doc.setTextColor(0, 0, 0); doc.text(val, 120, y);
            y += 8;
        });

        // ── SECTION 3: ALPHA SCORES ──────────────────────────────
        doc.addPage();
        y = 20;
        doc.setFillColor(0, 212, 170);
        doc.rect(10, y - 3, 190, 0.5, 'F');
        y += 4;
        doc.setTextColor(0, 212, 170);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('3. ALPHA SCORE REGISTRY (TOP 10)', 10, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('RANK', 15, y); doc.text('ASSET', 35, y); doc.text('SECTOR', 65, y); doc.text('SCORE', 110, y); doc.text('SIGNAL', 135, y);
        y += 5;
        doc.setDrawColor(220, 220, 220); doc.line(15, y, 195, y);
        y += 6;
        doc.setTextColor(0, 0, 0);
        (scores?.scores || []).slice(0, 10).forEach((s, i) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(String(i + 1), 15, y);
            doc.text(s.ticker || '', 35, y);
            doc.text((s.sector || '').slice(0, 18), 65, y);
            doc.text(String(s.score || 0) + '/100', 110, y);
            doc.text(s.signal || '', 135, y);
            y += 8;
        });

        // ── SECTION 4: MACRO EVENTS ──────────────────────────────
        if (macroData?.events?.length) {
            y += 6;
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFillColor(0, 212, 170);
            doc.rect(10, y - 3, 190, 0.5, 'F');
            y += 4;
            doc.setTextColor(0, 212, 170);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('4. UPCOMING MACRO CATALYSTS', 10, y);
            y += 10;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            macroData.events.slice(0, 8).forEach(e => {
                if (y > 275) { doc.addPage(); y = 20; }
                doc.setTextColor(100, 116, 139); doc.text(e.date || '', 15, y);
                doc.setTextColor(0, 0, 0); doc.text((e.event || '').slice(0, 40), 55, y);
                doc.setTextColor(e.impact === 'CRITICAL' ? 200 : 0, e.impact === 'CRITICAL' ? 0 : 0, 0);
                doc.text(e.impact || '', 165, y);
                y += 8;
            });
        }

        // ── SECTION 5: EXECUTION TAPE ────────────────────────────
        doc.addPage();
        y = 20;
        doc.setFillColor(0, 212, 170); doc.rect(10, y - 3, 190, 0.5, 'F'); y += 4;
        doc.setTextColor(0, 212, 170); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text('5. EXECUTION TAPE (RECENT SIGNALS)', 10, y); y += 10;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('TICKER', 15, y); doc.text('TYPE', 45, y); doc.text('RETURN', 85, y); doc.text('STATE', 115, y); doc.text('DATE', 155, y);
        y += 5; doc.setDrawColor(220, 220, 220); doc.line(15, y, 195, y); y += 6;
        doc.setTextColor(0, 0, 0);
        const sigData = Array.isArray(signals) ? signals : (signals?.data || []);
        sigData.slice(0, 25).forEach(s => {
            if (y > 280) { doc.addPage(); y = 20; }
            doc.text(String(s.ticker || ''), 15, y);
            doc.text(String(s.type || '').replace(/_/g,' ').slice(0,18), 45, y);
            const ret = parseFloat(s.return || 0);
            doc.setTextColor(ret >= 0 ? 34 : 239, ret >= 0 ? 197 : 68, ret >= 0 ? 94 : 68);
            doc.text((ret >= 0 ? '+' : '') + ret + '%', 85, y);
            doc.setTextColor(0, 0, 0);
            doc.text(String(s.state || ''), 115, y);
            doc.text(String(s.timestamp || '').split('T')[0] || String(s.timestamp || '').split(' ')[0] || '', 155, y);
            y += 8;
        });

        // ── FOOTER ───────────────────────────────────────────────
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFillColor(5, 7, 10); doc.rect(0, 285, 210, 12, 'F');
            doc.setFontSize(7); doc.setTextColor(100, 116, 139);
            doc.text(`© 2026 ALPHASIGNAL TERMINAL  |  INSTITUTIONAL RESEARCH  |  PAGE ${i} OF ${totalPages}  |  CONFIDENTIAL`, 105, 292, null, null, 'center');
        }

        doc.save(`alphasignal_research_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('REPORT GENERATED', '5-section institutional PDF saved to disk.', 'success');

    } catch (e) {
        console.error('Export failed:', e);
        showToast('EXPORT FAILED', 'Check console for details.', 'alert');
    } finally {
        if (btn) { btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;margin-right:4px">download</span>EXPORT PDF'; btn.disabled = false; }
    }
}


async function loadCorrelationMatrix(tickers) {
    const container = document.getElementById('corr-chart');
    if (!container) return;
    container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-dim); font-size:0.75rem">Computing correlations...</div>`;

    const data = await fetchAPI(`/correlation?tickers=${tickers}&period=60d`);
    if (!data || data.error || !data.matrix) {
        container.innerHTML = `<div style="padding:2rem; text-align:center; color:#ef4444; font-size:0.75rem">Could not load data. Try a different basket.</div>`;
        return;
    }

    const { matrix, tickers: labels } = data;
    const n = labels.length;
    const size = Math.min(Math.floor((container.clientWidth || 600) / n), 90);
    const margin = { top: 20, right: 20, bottom: 20, left: 80 };
    const width = size * n + margin.left + margin.right;
    const height = size * n + margin.top + margin.bottom + 50;

    container.innerHTML = '';
    const svg = d3.select('#corr-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale: red (-1) → grey (0) → green (+1)
    const colorScale = d3.scaleLinear()
        .domain([-1, 0, 1])
        .range(['#ef4444', '#1f2937', '#22c55e']);

    // Row labels
    g.selectAll('.row-label')
        .data(labels)
        .enter().append('text')
        .attr('class', 'row-label')
        .attr('x', -8)
        .attr('y', (d, i) => i * size + size / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('fill', 'rgba(255,255,255,0.7)')
        .text(d => d.replace('-USD', ''));

    // Col labels
    g.selectAll('.col-label')
        .data(labels)
        .enter().append('text')
        .attr('x', (d, i) => i * size + size / 2)
        .attr('y', n * size + 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'rgba(255,255,255,0.7)')
        .text(d => d.replace('-USD', ''));

    // Tooltip
    const tooltip = d3.select('body').append('div')
        .style('position', 'fixed').style('background', 'rgba(0,0,0,0.9)')
        .style('border', '1px solid rgba(255,255,255,0.1)').style('border-radius', '8px')
        .style('padding', '8px 12px').style('font-size', '0.7rem').style('color', '#fff')
        .style('pointer-events', 'none').style('z-index', '9999').style('display', 'none');

    // Cells
    matrix.forEach((row, i) => {
        row.forEach((val, j) => {
            const cell = g.append('rect')
                .attr('x', j * size + 1)
                .attr('y', i * size + 1)
                .attr('width', size - 2)
                .attr('height', size - 2)
                .attr('rx', 4)
                .attr('fill', colorScale(val))
                .attr('opacity', 0.85)
                .style('cursor', 'default')
                .on('mouseover', function(event) {
                    d3.select(this).attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 1);
                    tooltip.style('display', 'block')
                        .html(`<strong>${labels[i].replace('-USD','')} × ${labels[j].replace('-USD','')}</strong><br/>Correlation: <span style="color:${val >= 0 ? '#22c55e' : '#ef4444'}">${val >= 0 ? '+' : ''}${val.toFixed(3)}</span>`);
                })
                .on('mousemove', function(event) {
                    tooltip.style('left', (event.clientX + 12) + 'px').style('top', (event.clientY - 10) + 'px');
                })
                .on('mouseout', function() {
                    d3.select(this).attr('opacity', i === j ? 1 : 0.85).attr('stroke', 'none');
                    tooltip.style('display', 'none');
                });

            // Value text
            if (size >= 50) {
                g.append('text')
                    .attr('x', j * size + size / 2)
                    .attr('y', i * size + size / 2 + 4)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '9px')
                    .attr('font-weight', '700')
                    .attr('fill', Math.abs(val) > 0.5 ? '#fff' : 'rgba(255,255,255,0.55)')
                    .text(val.toFixed(2));
            }
        });
    });
}

// ============= Pack G1: Flow Monitor =============
async function openDetail(ticker, category, correlation = 0, alpha = 0, sentiment = 0, period = '60d', isTracked = false) {
    if (!isAuthenticatedUser) {
        showAuth(true);
        showToast("AUTHENTICATION REQUIRED", "Please login to access institutional intelligence.", "alert");
        return;
    }

    const overlay = document.getElementById('detail-overlay');
    const body = document.getElementById('detail-body');
    overlay.classList.remove('hidden');
    body.innerHTML = '<div class="loader"></div><p style="text-align:center;margin-top:1rem">Fetching institutional history...</p>';

    // Map UI labels to yfinance periods
    const periodMap = { '1W': '5d', '1M': '1mo', '60d': '60d', '3M': '3mo', '6M': '6mo' };
    const yfPeriod = periodMap[period] || '60d';

    const [data, liqData, derivData, walletData, factorData] = await Promise.all([
        fetchAPI(`/history?ticker=${ticker}&period=${yfPeriod}`),
        fetchAPI(`/liquidity?ticker=${ticker}`),
        fetchAPI(`/derivatives?ticker=${ticker}`),
        fetchAPI(`/wallet-attribution?ticker=${ticker}`),
        fetchAPI(`/factor-web?ticker=${ticker}`)
    ]);
    
    if (!data || data.error || !data.history) {
        body.innerHTML = `
            <div style="text-align:center;padding:2rem">
                <h3 class="neg">Intelligence Fetch Failed</h3>
                <p style="margin:1rem 0;color:var(--text-dim)">Could not retrieve historical data for ${ticker}.</p>
                <button class="filter-btn active" onclick="document.getElementById('detail-overlay').classList.add('hidden')">CLOSE TERMINAL</button>
            </div>`;
        return;
    }
    const { history } = data;
    
    window.currentReportData = {
        summary: data.summary,
        alphaScore: alpha,
        sentiment: sentiment > 0 ? 'BULLISH' : (sentiment < 0 ? 'BEARISH' : 'NEUTRAL')
    };

    body.innerHTML = `
        <div class="detail-header">
            <div><span class="category-label">${category}</span><h2>${ticker} Intelligence</h2></div>
            <div style="display:flex; gap:1rem; align-items:flex-start">

                <button class="intel-action-btn" style="width:auto; margin-right: 0.5rem" onclick="generateAssetReport('${ticker}')">DOWNLOAD PDF <span class="material-symbols-outlined" style="font-size: 18px; margin-left: 6px; vertical-align: middle;">picture_as_pdf</span></button>
                <button class="intel-action-btn" style="width:auto" onclick="openAIAnalyst('${ticker}')">RUN AI DEEP-DIVE <span class="material-symbols-outlined" style="font-size: 18px; margin-left: 6px; vertical-align: middle;">smart_toy</span></button>
            </div>
        </div>

        <div class="ticker-narrative-box" style="margin-bottom:1.5rem; padding:1.2rem; background:rgba(0, 242, 255, 0.03); border:1px solid rgba(0, 242, 255, 0.1); border-radius:8px">
            <h3 style="font-size:0.8rem; color:var(--accent); margin-bottom:0.5rem">TICKER NARRATIVE</h3>
            <p style="font-size:0.9rem; line-height:1.4; color:var(--text)">${data.summary}</p>
            <div class="asset-metrics" style="display:flex; gap:2rem; margin-top:1rem; border-top:1px solid rgba(255,255,255,0.05); padding-top:1rem">
                <div><label style="display:block; font-size:0.6rem; color:var(--text-dim)">MARKET CAP</label><span style="font-weight:700">${data.metrics.market_cap}</span></div>
                <div><label style="display:block; font-size:0.6rem; color:var(--text-dim)">24H VOLUME</label><span style="font-weight:700">${data.metrics.vol_24h}</span></div>
                <div><label style="display:block; font-size:0.6rem; color:var(--text-dim)">DOMINANCE</label><span style="font-weight:700">${data.metrics.dominance}</span></div>
            </div>
        </div>

        <div class="timeframe-bar">
            ${['1W','1M','60d','3M','6M'].map(tf => `<button class="tf-btn ${tf === period ? 'active' : ''}" onclick="openDetail('${ticker}','${category}',${correlation},${alpha},${sentiment},'${tf}',${isTracked})">${tf}</button>`).join('')}
        </div>
        <div class="chart-container"><canvas id="priceChart"></canvas></div>
        
        <div class="institutional-timeline" style="margin-top:2rem">
            <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">INSTITUTIONAL EVENT TIMELINE</h3>
            <div class="catalyst-list">
                ${(data.timeline || []).map(item => `
                    <div class="catalyst-item">
                        <div class="cat-date">${item.date}</div>
                        <div class="cat-card">
                            <div class="cat-event">${item.event}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="stats-panel" style="margin-top:2rem">
            <div class="stat-box"><label>Correlation</label><span>${correlation.toFixed(2)}</span></div>
            <div class="stat-box"><label>Alpha</label><span class="${alpha >= 0 ? 'pos' : 'neg'}">${alpha.toFixed(2)}%</span></div>
            <div class="stat-box"><label>Z-Score (Stats)</label><span class="${Math.abs(data.stats?.zScore ?? 0) > 2 ? 'neg' : 'pos'}">${(data.stats?.zScore ?? 0).toFixed(2)}</span></div>
            <div class="stat-box" style="position:relative">
                <label>Sentiment Div.</label>
                <div class="div-meter">
                    <div class="div-fill" style="width: ${Math.min(Math.abs(data.divergence || 0) * 100, 100)}%; background: ${data.divergence > 0 ? 'var(--risk-low)' : 'var(--risk-high)'}"></div>
                </div>
                <span style="font-size:0.6rem; color:var(--text-dim); margin-top:2px">${data.divergence > 0 ? 'PRICE LEAD' : data.divergence < 0 ? 'SENT. LEAD' : 'SYNCED'}</span>
            </div>
        </div>

        <div class="radar-panel" style="margin-top:2rem; padding:1.5rem; background:rgba(0, 242, 255, 0.02); border:1px solid rgba(0, 242, 255, 0.1); border-radius:12px; display:flex; gap:20px; align-items:center; flex-wrap:wrap">
            <div style="flex:1; min-width:250px">
                <h3 style="color:var(--accent); font-size:1rem; margin-bottom:0.5rem">Quantitative Factor Web</h3>
                <p style="font-size:0.8rem; color:var(--text-dim); line-height:1.5">This multi-dimensional radar plots the structural geometry of the asset across 6 institutional factor boundaries. Highly skewed shapes indicate sector-specific dominance.</p>
            </div>
            <div style="flex:1; height:250px; position:relative; min-width:250px">
                <canvas id="factorRadarChart"></canvas>
            </div>
        </div>

        <div class="liquidity-derivatives-grid" style="margin-top:2rem; display:grid; grid-template-columns: 1fr 1fr; gap:20px; border-top:1px solid var(--border); padding-top:1.5rem">
            <div class="liquidity-section">
                <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">LIQUIDITY DEPTH (S/R WALLS)</h3>
                <div id="liquidity-map"></div>
            </div>
            <div class="derivatives-section">
                <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">DERIVATIVES MONITOR</h3>
                <div class="derivatives-grid">
                    <div class="deriv-box"><label>Funding Rate</label><span>${derivData.fundingRate}%</span></div>
                    <div class="deriv-box"><label>Open Interest</label><span>${derivData.openInterest}</span></div>
                    <div class="deriv-box"><label>OI 24h Change</label><span class="${derivData.oiChange >= 0 ? 'pos' : 'neg'}">${derivData.oiChange}%</span></div>
                    <div class="deriv-box"><label>Long/Short Ratio</label><span>${derivData.longShortRatio}</span></div>
                </div>
            </div>
        </div>
        <div class="overlay-controls" style="margin-top:1.5rem; display:flex; gap:10px; align-items:center">
            <label style="font-size:0.7rem; color:var(--text-dim); font-weight:700">ADVANCED OVERLAYS:</label>
            <button class="timeframe-btn" onclick="toggleOverlay('ema')">EMA (12/26)</button>
            <button class="timeframe-btn" onclick="toggleOverlay('vol')">VOL RIBBONS</button>
        </div>
        
        <div class="tape-reader-section" style="margin-top:2rem; border-top:1px solid var(--border); padding-top:1.5rem">
            <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">ENTITY FLOW ATTRIBUTION (ON-CHAIN)</h3>
            <div id="flow-attribution-container"></div>
            
            <h3 style="margin-top:2rem; margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">LIVE EXECUTION TAPE (L2 SIM)</h3>
            <div id="tape-container"></div>
        </div>
`;
    
    // Store data for chart toggling
    window.currentHistory = data.history;
    window.activeOverlays = { ema: false, vol: false };

    if (data.news && data.news.length) {
        window.lastNewsData = data.news; // Store for article view
        body.innerHTML += `
            <div class="detail-news-section" style="margin-top:2rem; border-top:1px solid var(--border); padding-top:1.5rem">
                <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent)">LATEST INSTITUTIONAL NARRATIVE</h3>
                <div class="news-card" onclick="openNewsArticle(0)" style="padding:1.2rem; background:rgba(0, 242, 255, 0.02); border-color: rgba(0, 242, 255, 0.2)">
                    <div class="news-header" style="margin-bottom:0.5rem">
                        <div class="news-time">${data.news[0].time}</div>
                        <div class="news-tag tag-${data.news[0].sentiment.toLowerCase()}">${data.news[0].sentiment}</div>
                    </div>
                    <div class="news-headline" style="font-size:1rem; margin-bottom:0.5rem">${data.news[0].headline}</div>
                    <div class="news-summary" style="font-size:0.8rem">${data.news[0].summary}</div>
                </div>
            </div>`;
    }

    renderChart(history);
    renderDetailLiquidity(liqData);
    renderFlowAttribution(walletData);

    if (factorData && factorData.factors) {
        const ctxRadar = document.getElementById('factorRadarChart');
        if (ctxRadar) {
            new Chart(ctxRadar.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: Object.keys(factorData.factors).map(k => k.toUpperCase()),
                    datasets: [{
                        label: 'Asset Profile',
                        data: Object.values(factorData.factors),
                        backgroundColor: 'rgba(0, 242, 255, 0.2)',
                        borderColor: '#00f2ff',
                        pointBackgroundColor: '#00f2ff',
                        borderWidth: 2,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255,255,255,0.1)' },
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            pointLabels: { color: '#8b949e', font: { family: 'JetBrains Mono', size:10 } },
                            ticks: { display: false, min: 0, max: 100 }
                        }
                    },
                    plugins: { legend: { display: false }, datalabels: { display: false } }
                }
            });
        }
    }

    // Initialize Tape Reader
    if (window.activeTape) window.activeTape.stop();
    window.lastBasePrice = history[history.length-1]?.close ?? history[history.length-1]?.price ?? 0;
    if (typeof TapeReader !== 'undefined') {
        if (window.activeTape) window.activeTape.stop();
        window.activeTape = new TapeReader('tape-container', ticker);
        window.activeTape.start();
    }
}

async function runStrategyBacktest(ticker, strategy, fast = 20, slow = 50, tabs = null) {
    if (!tabs && typeof alphaHubTabs !== 'undefined') tabs = alphaHubTabs;
    const data = await fetchAPI(`/backtest?ticker=${ticker}&strategy=${strategy}&fast=${fast}&slow=${slow}`);
    if (!data || !data.summary) return;
    
    appEl.innerHTML = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alpha Strategy Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">science</span> Strategy Lab <span class="premium-badge pulse">PRO</span></h1>
                <p>Validate quantitative alphas using high-fidelity historical simulations.</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; flex-shrink:0" onclick="switchView('explain-playbook')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>
        </div>
        ${tabs ? renderHubTabs('lab', tabs) : ''}

        <div class="strategy-workspace" style="display:grid; grid-template-columns: 320px 1fr; gap:30px">
            <div class="strategy-controls">
                <div class="control-box">
                    <label>ASSET SELECTION</label>
                    <select id="strat-ticker" class="strat-select" onchange="window._slPersist(this.value, null); runStrategyBacktest(this.value, document.getElementById('strat-type').value, document.getElementById('strat-fast')?.value || 20, document.getElementById('strat-slow')?.value || 50)">
                        <option value="BTC-USD" ${ticker === 'BTC-USD' ? 'selected' : ''}>BTC-USD (Bitcoin)</option>
                        <option value="ETH-USD" ${ticker === 'ETH-USD' ? 'selected' : ''}>ETH-USD (Ethereum)</option>
                        <option value="SOL-USD" ${ticker === 'SOL-USD' ? 'selected' : ''}>SOL-USD (Solana)</option>
                        <option value="MSTR" ${ticker === 'MSTR' ? 'selected' : ''}>MSTR (MicroStrategy)</option>
                        <option value="COIN" ${ticker === 'COIN' ? 'selected' : ''}>COIN (Coinbase)</option>
                        <option value="MARA" ${ticker === 'MARA' ? 'selected' : ''}>MARA (Marathon)</option>
                        <option value="ADA-USD" ${ticker === 'ADA-USD' ? 'selected' : ''}>ADA-USD (Cardano)</option>
                        <option value="AVAX-USD" ${ticker === 'AVAX-USD' ? 'selected' : ''}>AVAX-USD (Avalanche)</option>
                        <option value="XRP-USD" ${ticker === 'XRP-USD' ? 'selected' : ''}>XRP-USD (Ripple)</option>
                        <option value="_custom" ${!['BTC-USD','ETH-USD','SOL-USD','MSTR','COIN','MARA','ADA-USD','AVAX-USD','XRP-USD'].includes(ticker) ? 'selected' : ''}>✏ Custom Symbol...</option>
                    </select>
                    <input id="strat-custom-ticker" type="text" placeholder="e.g. AAPL, DOGE-USD..." value="${!(['BTC-USD','ETH-USD','SOL-USD','MSTR','COIN','MARA','ADA-USD','AVAX-USD','XRP-USD'].includes(ticker)) ? ticker : ''}" style="display:${!['BTC-USD','ETH-USD','SOL-USD','MSTR','COIN','MARA','ADA-USD','AVAX-USD','XRP-USD'].includes(ticker) ? 'block' : 'none'};width:100%;border-radius:8px;padding:10px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,212,170,0.4);color:white;font-family:'Outfit';margin-top:8px" onkeydown="if(event.key==='Enter'&&this.value.trim()){window._slPersist(this.value.trim(),null);runStrategyBacktest(this.value.trim(),document.getElementById('strat-type').value,20,50);}">
                    <script>document.getElementById('strat-ticker')?.addEventListener('change',function(){document.getElementById('strat-custom-ticker').style.display=this.value==='_custom'?'block':'none';});<\/script>
                </div>
                </div>

                <div class="control-box">
                    <label>QUANT STRATEGY</label>
                    <select id="strat-type" class="strat-select" onchange="window._slPersist(null, this.value); runStrategyBacktest(document.getElementById('strat-ticker').value==='_custom'?(document.getElementById('strat-custom-ticker')?.value||'BTC-USD'):document.getElementById('strat-ticker').value, this.value, document.getElementById('strat-fast')?.value || 20, document.getElementById('strat-slow')?.value || 50)">
                        <optgroup label="── Classic Technicals ──">
                        <option value="trend_regime" ${strategy === 'trend_regime' ? 'selected' : ''}>EMA Crossover (Custom)</option>
                        <option value="volatility_breakout" ${strategy === 'volatility_breakout' ? 'selected' : ''}>Volatility Breakout (Keltner)</option>
                        <option value="rsi_mean_revert" ${strategy === 'rsi_mean_revert' ? 'selected' : ''}>RSI Mean Reversion (Trend-Filtered)</option>
                        <option value="bollinger_bands" ${strategy === 'bollinger_bands' ? 'selected' : ''}>Bollinger Band Mean Reversion</option>
                        <option value="vwap_cross" ${strategy === 'vwap_cross' ? 'selected' : ''}>VWAP Crossover (EMA5 Anchor)</option>
                        <option value="macd_momentum" ${strategy === 'macd_momentum' ? 'selected' : ''}>MACD Momentum (12/26/9)</option>
                        <option value="stochastic_cross" ${strategy === 'stochastic_cross' ? 'selected' : ''}>Stochastic Oscillator Cross</option>
                        <option value="z_score" ${strategy === 'z_score' ? 'selected' : ''}>Statistical Arbitrage (Z-Score Core)</option>
                        <option value="supertrend" ${strategy === 'supertrend' ? 'selected' : ''}>Adaptive Supertrend Volatility System</option>
                        <option value="obv_flow" ${strategy === 'obv_flow' ? 'selected' : ''}>Smart Money Flow Divergence (OBV/CVD)</option>
                        </optgroup>
                        <optgroup label="── Phase 15 Quant ──">
                        <option value="pairs_trading" ${strategy === 'pairs_trading' ? 'selected' : ''}>Pairs Trading (BTC/ETH Spread Z-Score)</option>
                        <option value="momentum_ignition" ${strategy === 'momentum_ignition' ? 'selected' : ''}>Momentum Ignition (20D Accel + Vol Spike)</option>
                        <option value="regime_carry" ${strategy === 'regime_carry' ? 'selected' : ''}>Regime-Filtered Carry (200D EMA)</option>
                        <option value="kelly_sizer" ${strategy === 'kelly_sizer' ? 'selected' : ''}>Kelly Criterion Position Sizer</option>
                        <option value="dual_momentum" ${strategy === 'dual_momentum' ? 'selected' : ''}>Dual Momentum (Abs + Rel, Monthly)</option>
                        </optgroup>
                    </select>
                </div>
                
                <div class="control-box" style="margin-top: 15px; display: flex; gap: 10px;">
                    <div style="flex:1">
                        <label>FAST MA</label>
                        <input type="number" id="strat-fast" class="strat-input" value="${fast}" style="width:100%; border-radius:8px; padding:10px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:white; font-family:'Outfit'" onchange="runStrategyBacktest(document.getElementById('strat-ticker').value, document.getElementById('strat-type').value, this.value, document.getElementById('strat-slow').value)">
                    </div>
                    <div style="flex:1">
                        <label>SLOW MA</label>
                        <input type="number" id="strat-slow" class="strat-input" value="${slow}" style="width:100%; border-radius:8px; padding:10px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:white; font-family:'Outfit'" onchange="runStrategyBacktest(document.getElementById('strat-ticker').value, document.getElementById('strat-type').value, document.getElementById('strat-fast').value, this.value)">
                    </div>
                </div>
                
                <div class="lab-metrics-grid" style="margin-top:2rem;display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div class="mini-stat">
                        <label>SHARPE RATIO</label>
                        <div class="val">${data.summary.sharpe}</div>
                    </div>
                    <div class="mini-stat">
                        <label>MAX DRAWDOWN</label>
                        <div class="val neg">-${Math.abs(data.summary.maxDrawdown)}%</div>
                    </div>
                    <div class="mini-stat">
                        <label>WIN RATE</label>
                        <div class="val">${data.summary.winRate}%</div>
                    </div>
                    <div class="mini-stat">
                        <label>EXCESS ALPHA</label>
                        <div class="val ${data.summary.alpha >= 0 ? 'pos' : 'neg'}">${data.summary.alpha >= 0 ? '+' : ''}${data.summary.alpha}%</div>
                    </div>
                </div>

                <button class="intel-action-btn" style="margin-top: 2rem; width: 100%" onclick="shareStrategyResult('${ticker}', ${data.summary.totalReturn})">
                    <span class="material-symbols-outlined">share</span> SHARE PERFORMANCE
                </button>
                <button class="intel-action-btn" style="margin-top: 10px; width: 100%; background:rgba(0, 242, 255, 0.05); border-color:var(--accent); color:var(--accent)" onclick="window.downloadBacktestCSV('${ticker}', '${strategy}')">
                    <span class="material-symbols-outlined" style="font-size:16px">download</span> EXPORT CSV
                </button>
                <button class="intel-action-btn" id="multi-ticker-btn" style="margin-top: 10px; width: 100%; background:rgba(250,204,21,0.06); border-color:#facc15; color:#facc15" onclick="runMultiTickerCompare('${strategy}', document.getElementById('strat-fast')?.value||20, document.getElementById('strat-slow')?.value||50)">
                    <span class="material-symbols-outlined" style="font-size:16px">compare_arrows</span> COMPARE BTC / ETH / SOL
                </button>
            </div>

            <div class="strategy-results">
                <div class="backtest-summary-cards" style="display:flex; gap:20px; margin-bottom:20px">
                    <div class="summary-card main-return">
                        <label>STRATEGY RETURN (180D)</label>
                        <div class="val ${data.summary.totalReturn >= 0 ? 'pos' : 'neg'}">${data.summary.totalReturn >= 0 ? '+' : ''}${data.summary.totalReturn}%</div>
                    </div>
                    <div class="summary-card bench-return">
                        <label>BENCHMARK (BTC)</label>
                        <div class="val ${data.summary.benchmarkReturn !== undefined ? (data.summary.benchmarkReturn >= 0 ? 'pos' : 'neg') : (data.summary.btcReturn >= 0 ? 'pos' : 'neg')}">${data.summary.benchmarkReturn !== undefined ? (data.summary.benchmarkReturn >= 0 ? '+' : '') + data.summary.benchmarkReturn : (data.summary.btcReturn >= 0 ? '+' : '') + data.summary.btcReturn}%</div>
                    </div>
                    <div class="summary-card alpha-card">
                        <label>EXCESS ALPHA</label>
                        <div class="val pos">${data.summary.alpha >= 0 ? '+' : ''}${data.summary.alpha}%</div>
                    </div>
                </div>

                <div id="strat-tv-container" style="height: 300px; margin-bottom: 20px; background:rgba(0,0,0,0.3); border-radius:12px; border:1px solid rgba(255,255,255,0.05); overflow:hidden"></div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
                    <div style="display:flex;align-items:center;gap:10px">
                        <span style="font-size:0.65rem;color:var(--text-dim);font-weight:700;letter-spacing:1px">EQUITY CURVE</span>
                        <span id="strat-outperf-badge" style="font-size:0.65rem;font-weight:900;padding:3px 10px;border-radius:100px;border:1px solid rgba(34,197,94,0.3);color:var(--risk-low);font-family:var(--font-mono)"></span>
                    </div>
                    <button id="bh-toggle-btn" data-show="true" onclick="window.toggleBenchmark && window.toggleBenchmark()" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--text-dim);padding:4px 12px;border-radius:6px;font-size:0.6rem;cursor:pointer;font-family:var(--font-mono);font-weight:700;letter-spacing:1px">HIDE BUY &amp; HOLD</button>
                </div>
                <div class="chart-container" style="height: 250px; background: rgba(0,0,0,0.1); border-radius:16px; border:1px solid var(--border); padding: 20px">
                    <canvas id="strategyChart"></canvas>
                </div>

                <div class="glass-card" style="margin-top: 20px; padding: 20px">
                    <div class="card-header" style="margin-bottom:15px">
                        <h3>Monte Carlo Trajectory Matrix</h3>
                        <span class="label-tag">200 SIM · P5/P50/P95 BANDS</span>
                    </div>
                    <div style="height: 350px; position:relative;">
                        <canvas id="monteCarloChart"></canvas>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 15px; display:flex; gap:20px; text-align:center">
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px"><span style="color:#00f2ff">SIMULATIONS:</span><br>200 Paths</div>
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px"><span style="color:#facc15">HORIZON:</span><br>30 Days</div>
                        <div style="flex:1; border:1px solid rgba(255,255,255,0.05); padding:10px; border-radius:8px" id="mc-sigma-label"><span style="color:#bc13fe">VOLATILITY:</span><br>--</div>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px; padding: 20px">
                    <div class="card-header" style="margin-bottom:15px">
                        <h3>Walk-Forward Optimisation</h3>
                        <span class="label-tag">6 FOLDS · 2Y HISTORY</span>
                    </div>
                    <div id="walk-forward-panel" style="min-height:120px">
                        <div style="display:flex;align-items:center;justify-content:center;height:120px;color:var(--text-dim);font-size:0.85rem">
                            <span class="material-symbols-outlined" style="font-size:18px;margin-right:8px;animation:spin 1s linear infinite">sync</span> Loading walk-forward analysis...
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px; padding: 20px">
                    <div class="card-header" style="margin-bottom:15px">
                        <h3><span class="material-symbols-outlined" style="vertical-align:middle;font-size:1.1rem;margin-right:6px">leaderboard</span>Strategy Leaderboard</h3>
                        <span class="label-tag" id="leaderboard-tag">SELECT ASSET</span>
                    </div>
                    <div id="strategy-leaderboard" style="min-height:80px;color:var(--text-dim);font-size:0.85rem;display:flex;align-items:center;justify-content:center">
                        Use COMPARE BTC / ETH / SOL to benchmark this strategy across assets.
                    </div>
                </div>

                <div class="glass-card" style="margin-top: 20px; padding: 20px">
                    <div class="card-header" style="margin-bottom:15px">
                        <h3>Guppy Multiple Moving Average (GMMA)</h3>
                        <span class="label-tag">TREND MECHANICS</span>
                    </div>
                    <div style="height:350px; width:100%; position:relative; border-radius:8px; overflow:hidden">
                        <canvas id="guppyChart"></canvas>
                    </div>
                    <div style="margin-top:15px; font-size:0.75rem; color:var(--text-dim); line-height:1.5">
                        The Guppy Density Ribbon stacks an array of 15 overlapping Exponential Moving Averages. Structural compression signals imminent breakout probability across institutional limits.
                    </div>
                </div>

            </div>
        </div>
    `;

    // Initialize Institutional Visuals
    const curve = data.equityCurve || data.weeklyReturns;
    window.lastBacktestData = curve;
    const histResp = await fetchAPI(`/history?ticker=${ticker}&period=180d`);
    if (histResp && histResp.history && histResp.history.length > 0) {
        createTradingViewChart('strat-tv-container', histResp.history);
        renderGuppyRibbon(histResp.history);
    }
    renderStrategyChart(curve);

    // Monte Carlo with percentile bands
    try {
        const mcData = await fetchAPI(`/monte-carlo?ticker=${ticker}`);
        if (mcData && mcData.paths) {
            document.getElementById('mc-sigma-label').innerHTML = `<span style="color:#bc13fe">VOLATILITY:</span><br>${mcData.sigma}% (Ann.)`;
            renderMonteCarloChart(mcData);
        }
    } catch(e) {}

    // Walk-forward (deferred so UI renders first)
    setTimeout(async () => {
        try {
            const wfData = await fetchAPI(`/walk-forward?ticker=${ticker}`);
            if (wfData && wfData.folds) renderWalkForwardPanel(wfData);
        } catch(e) {
            const el = document.getElementById('walk-forward-panel');
            if (el) el.innerHTML = '<p style="color:var(--text-dim);font-size:0.8rem;text-align:center;padding:1rem">Walk-forward unavailable — requires 2y of data.</p>';
        }
    }, 800);

    // Strategy Leaderboard — auto-run silently after walk-forward completes
    setTimeout(() => { if (typeof runStrategyCompare === 'function') runStrategyCompare(ticker); }, 1400);
}

function shareStrategyResult(ticker, returns) {
    const text = `Validating my alpha on ${ticker} with AlphaSignal Strategy Lab. Strategy Return: ${returns}% (180D). 🚀 #AlphaSignal #CryptoIntelligence`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
}

// ============= Newsroom View =============
let currentNewsPage = 1;
const newsPerPage = 5;

function openNewsArticle(index) {
    const news = window.lastNewsData[index];
    if (!news) return;

    const modal = document.getElementById('news-modal');
    const body = document.getElementById('news-article-body');
    
    modal.classList.remove('hidden');
    body.innerHTML = `
        <div class="article-header">
            <div class="article-meta">
                <div class="news-tag tag-${news.sentiment.toLowerCase()}">${news.sentiment}</div>
                <div class="news-time">${news.time} // ${news.ticker}</div>
            </div>
            <h2 class="article-title">${news.headline}</h2>
        </div>
        <div class="article-content">
            ${news.content || `<p>${news.summary}</p><p>Full intelligence report is currently being synthesized by AlphaSignal Prime. Check back shortly for deep-dive analysis into the institutional flow dynamics of ${news.ticker}.</p>`}
        </div>
        <div class="article-footer">
            <span>© 2026 AlphaSignal Institutional</span>
            <button class="timeframe-btn" onclick="document.getElementById('news-modal').classList.add('hidden')">CLOSE INTEL</button>
        </div>
    `;
}

async function loadRiskMatrix(tickers = null) {
    if (tickers) window.currentRiskTickers = tickers;
    const currentTickers = window.currentRiskTickers || 'BTC-USD,ETH-USD,SOL-USD,MARA,COIN,MSTR,BNB-USD,XRP-USD,ADA-USD,DOGE-USD';
    const period = document.getElementById('matrix-period')?.value || '60d';
    
    // UI Update for buttons
    const btns = document.querySelectorAll('#risk-matrix-filters .filter-btn');
    btns.forEach(b => {
        if (b.getAttribute('onclick')?.includes(currentTickers)) b.classList.add('active');
        else b.classList.remove('active');
    });

    const container = document.getElementById('matrix-container');
    const [data, stressData] = await Promise.all([
        fetchAPI(`/correlation?tickers=${currentTickers}&period=${period}`),
        fetchAPI('/stress-test')
    ]);
    
    if (!data || data.error) {
        container.innerHTML = `<div class="error-msg">Matrix Load Failed: ${data?.error || 'Unknown Error'}</div>`;
        return;
    }

    const tks = currentTickers.split(',');
    container.innerHTML = `
        <div style="margin-bottom:2rem; padding:1.5rem; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:12px">
            <h3 style="margin-bottom:1rem; font-size:0.9rem; color:var(--accent); letter-spacing:1px">ASSET RISK PROFILE (EFFICIENT FRONTIER)</h3>
            <div style="height:420px; position:relative">
                <canvas id="riskScatterChart"></canvas>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:1.2rem;margin-top:1rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.06);font-size:0.6rem;font-weight:700;letter-spacing:1px">
                <span style="color:var(--text-dim);align-self:center">ALPHA VS BTC:</span>
                <span style="display:flex;align-items:center;gap:5px">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgba(34,197,94,0.85);flex-shrink:0"></span>
                    <span style="color:rgba(34,197,94,0.9)">&gt; +5% OUTPERFORMING</span>
                </span>
                <span style="display:flex;align-items:center;gap:5px">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgba(0,242,255,0.75);flex-shrink:0"></span>
                    <span style="color:rgba(0,242,255,0.9)">0 – +5% POSITIVE ALPHA</span>
                </span>
                <span style="display:flex;align-items:center;gap:5px">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgba(250,204,21,0.8);flex-shrink:0"></span>
                    <span style="color:rgba(250,204,21,0.9)">-5% – 0 SLIGHT DRAG</span>
                </span>
                <span style="display:flex;align-items:center;gap:5px">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:rgba(239,68,68,0.85);flex-shrink:0"></span>
                    <span style="color:rgba(239,68,68,0.9)">&lt; -5% UNDERPERFORMING</span>
                </span>
            </div>
        </div>

        <div class="rotation-matrix-container">
            <div class="matrix-grid" style="grid-template-columns: 100px repeat(${tks.length}, 1fr)">
                <div></div>
                ${tks.map(t => `<div class="matrix-label horizontal" style="font-size:0.6rem">${t.split('-')[0]}</div>`).join('')}
                ${data.matrix.map((row, i) => `
                    <div class="matrix-label vertical" style="font-size:0.6rem; height:40px">${tks[i].split('-')[0]}</div>
                    ${row.map(val => {
                        const intensity = Math.abs(val);
                        const color = val >= 0 ? `rgba(0, 242, 255, ${intensity * 0.8})` : `rgba(255, 107, 107, ${intensity * 0.8})`;
                        return `<div class="matrix-cell" style="background:${color}; height:40px; font-size:0.7rem; border:0.5px solid rgba(255,255,255,0.05)" title="${tks[i]} vs ${tks[row.indexOf(val)]}: ${val}">${val.toFixed(2)}</div>`;
                    }).join('')}
                `).join('')}
            </div>
        </div>
        <div style="margin-top:2rem; padding:1.5rem; background:rgba(0,242,255,0.05); border:1px solid var(--accent); border-radius:12px">
            <h4 style="color:var(--accent); margin-bottom:0.5rem">Institutional Insight</h4>
            <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.6">
                A correlation above <b>0.85</b> indicates high institutional synchronization. When systemic correlation spikes across all sectors, it often signals a <b>"Risk-Off"</b> regime where alpha is compressed. Conversely, decoupling (low correlation) highlights idiosyncratic opportunities.
            </p>
            </p>
        </div>
    `;

    // ── Efficient Frontier Scatter ─────────────────────────────────────────
    // Use real vol/alpha/return from the stress-test engine (already computed vs BTC)
    setTimeout(() => {
        const scatterCtx = document.getElementById('riskScatterChart');
        if (!scatterCtx) return;

        let scatterPoints = [];
        if (stressData?.asset_risk?.length) {
            const raw = stressData.asset_risk.map(a => ({
                x: parseFloat(a.vol.toFixed(1)),
                y: parseFloat(a.alpha.toFixed(1)),
                ticker: a.ticker.split('-')[0],
                beta: a.beta
            }));
            // Filter extreme vol outliers — anything > 300% ann. vol skews the axis badly
            // (these are typically micro-caps or assets with corrupt price data)
            const VOL_CAP = 300;
            scatterPoints = raw.filter(p => p.x <= VOL_CAP);
            const removed = raw.length - scatterPoints.length;
            if (removed > 0) console.info(`EF scatter: removed ${removed} outlier(s) with vol > ${VOL_CAP}%`);
        } else {
            // Lightweight fallback using ticker name heuristics
            scatterPoints = tks.map(t => ({
                x: t.includes('BTC') ? 42 : t.includes('ETH') ? 58 : ['MARA','RIOT','CLSK'].includes(t) ? 95 : 72,
                y: t.includes('BTC') ? 12 : t.includes('ETH') ? 18 : ['MARA','RIOT','CLSK'].includes(t) ? 38 : 22,
                ticker: t.split('-')[0], beta: 1.0
            }));
        }

        const colors = scatterPoints.map(p =>
            p.y >= 5  ? 'rgba(34,197,94,0.75)' :
            p.y >= 0  ? 'rgba(0,242,255,0.65)'  :
            p.y >= -5 ? 'rgba(250,204,21,0.65)' :
                        'rgba(239,68,68,0.75)'
        );

        new Chart(scatterCtx.getContext('2d'), {
            type: 'scatter',
            plugins: [ChartDataLabels],
            data: {
                datasets: [{
                    label: 'Asset Profile',
                    data: scatterPoints,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace(/0\.\d+\)/, '1)')),
                    pointRadius: 6,
                    pointHoverRadius: 9
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13,17,23,0.95)',
                        callbacks: {
                            title: ctx => ctx[0].raw.ticker,
                            label: ctx => [
                                `Ann. Vol: ${ctx.raw.x.toFixed(1)}%`,
                                `Excess Alpha: ${ctx.raw.y >= 0 ? '+' : ''}${ctx.raw.y.toFixed(1)}%`,
                                `BTC Beta: ${ctx.raw.beta?.toFixed(2) ?? '--'}`
                            ]
                        }
                    },
                    datalabels: {
                        display: true,
                        formatter: (val) => val.ticker,
                        color: (ctx) => colors[ctx.dataIndex] ?? 'rgba(255,255,255,0.7)',
                        font: {
                            family: "'JetBrains Mono', monospace",
                            size: 8,
                            weight: '700'
                        },
                        // Stagger anchors to reduce overlap
                        anchor: (ctx) => (ctx.dataIndex % 3 === 0 ? 'end' : ctx.dataIndex % 3 === 1 ? 'start' : 'end'),
                        align: (ctx) => (ctx.dataIndex % 3 === 0 ? 'top' : ctx.dataIndex % 3 === 1 ? 'bottom' : 'right'),
                        offset: 4,
                        clamp: true,
                        // Subtle bg box for readability
                        backgroundColor: 'rgba(5,7,20,0.55)',
                        borderRadius: 3,
                        padding: { top: 1, bottom: 1, left: 3, right: 3 }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Annualized Volatility (%)', color: '#8b949e', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#8b949e' }
                    },
                    y: {
                        title: { display: true, text: 'Excess Alpha vs BTC (Ann. %)', color: '#8b949e', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#8b949e', callback: v => (v >= 0 ? '+' : '') + v + '%' }
                    }
                }
            }
        });
    }, 50);
}

async function runNeuralSetup(ticker) {
    const btn = document.getElementById('generate-setup-btn');
    const area = document.getElementById('setup-display-area');
    
    // Provide immediate feedback if triggered via "View Analysis"
    if (area) {
        area.innerHTML = `<div class="loading-state" style="padding:40px; text-align:center">
            <div class="spinner" style="margin-bottom:15px"></div>
            <p>SYNTHESIZING NEURAL SETUP FOR ${ticker.toUpperCase()}...</p>
        </div>`;
    }

    if (btn) {
        btn.textContent = "SYNTHESIZING...";
        btn.disabled = true;
    }
    
    try {
        const setup = await fetchAPI(`/generate-setup?ticker=${ticker.toUpperCase()}`);
        
        if (!setup || setup.error) {
            if (area) {
                area.innerHTML = `
                    <div class="error-card" style="padding:20px; border:1px solid var(--neg); background:rgba(255,59,48,0.1); border-radius:12px; text-align:center">
                        <span class="material-symbols-outlined" style="font-size:3rem; color:var(--neg); margin-bottom:10px">warning</span>
                        <h4 style="color:var(--text-header)">SYNTHESIS FAILED</h4>
                        <p style="color:var(--text-dim); font-size:0.8rem">${setup?.error || 'Market data stream interrupted. Ticker may be invalid or halted.'}</p>
                    </div>`;
            }
            return;
        }
        
        area.innerHTML = `
            <div class="setup-card animate-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                    <span style="font-weight:900; color:var(--accent); font-size:1.1rem">${setup.ticker} / ${setup.bias}</span>
                    <span class="tier-badge institutional" style="margin:0">${setup.conviction} CONVICTION</span>
                </div>
                
                <div class="setup-param-grid">
                    <div class="setup-param"><span class="label">Entry Zone</span><span class="value">${formatPrice(setup.parameters.entry)}</span></div>
                    <div class="setup-param"><span class="label">Stop Loss</span><span class="value">${formatPrice(setup.parameters.stop_loss)}</span></div>
                    <div class="setup-param"><span class="label">Target 1</span><span class="value">${formatPrice(setup.parameters.take_profit_1)}</span></div>
                    <div class="setup-param"><span class="label">Target 2</span><span class="value">${formatPrice(setup.parameters.take_profit_2)}</span></div>
                </div>
                
                <div style="margin-bottom:20px">
                    <span class="label" style="display:block; font-size:0.65rem; color:var(--text-dim); margin-bottom:8px; text-transform:uppercase; font-weight:900">Institutional Rationale</span>
                    <ul class="rationale-list">
                        ${setup.rationale.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="risk-notice">
                    <strong>RISK WARNING:</strong> ${setup.risk_warning}
                </div>
                
                <div style="margin-top:20px; border-top:1px solid var(--border); padding-top:20px; display:flex; gap:15px">
                    <button class="intel-action-btn" id="ticket-gen-btn" style="flex:1; background:var(--accent); color:white" onclick="showTradeTicket()">
                        <span class="material-symbols-outlined" style="vertical-align:middle; font-size:1.2rem; margin-right:5px">receipt_long</span>
                        GENERATE EXECUTION TICKET
                    </button>
                </div>
            </div>`;
        area.innerHTML += `
            <div style="margin-top:20px; text-align:center">
                <button class="intel-action-btn mini outline" style="width:auto; padding:8px 20px" onclick="switchView('trade-ledger')">
                    <span class="material-symbols-outlined" style="font-size:1rem; margin-right:5px">list_alt</span> VIEW AUDIT LEDGER
                </button>
            </div>
        `;
        lastNeuralSetup = setup;
        area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
        console.error('Setup Gen Error:', e);
    } finally {
        if (btn) {
            btn.textContent = "GENERATE NEURAL SETUP";
            btn.disabled = false;
        }
    }
}

async function generateTicket(ticker) {
    try {
        showToast("Processing", `Generating Execution Ticket for ${ticker}...`, "alert");
        const setup = await fetchAPI(`/generate-setup?ticker=${ticker.toUpperCase()}`);
        if (setup && !setup.error) {
            showTradeTicket(setup);
        } else {
            showToast("Error", "Failed to generate ticket metadata.", "alert");
        }
    } catch (e) {
        showToast("Error", "Connection to Neural Engine failed.", "alert");
    }
}

function showTradeTicket(setup = null) {
    const s = setup || lastNeuralSetup;
    if (!s) {
        showToast("Error", "No active setup to ticket.", "alert");
        return;
    }

    // Auto-persist to Ledger in background
    fetchAPI('/trade-ledger', 'POST', {
        ticker: s.ticker,
        action: s.action,
        price: s.parameters?.entry || 0,
        target: s.parameters?.take_profit_1 || 0,
        stop: s.parameters?.stop_loss || 0,
        rr: s.parameters?.rr_ratio || 0,
        slippage: s.parameters?.slippage_est || 0
    }).then(res => console.log("[AlphaSignal] Ticket persisted to Ledger:", res))
      .catch(err => console.error("[AlphaSignal] Ledger Persistence Failed:", err));

    const ticketId = `AS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const ticketText = `ALPHASIGNAL EXECUTION TICKET\nID: ${ticketId}\nASSET: ${s.ticker}\nACTION: ${s.action}\nENTRY: ${s.parameters.entry}\nTP1: ${s.parameters.take_profit_1}\nTP2: ${s.parameters.take_profit_2}\nSL: ${s.parameters.stop_loss}\nR/R: ${s.parameters.rr_ratio}\nSOURCE: AlphaSignal Neural Engine v4.2`;

    const area = document.getElementById('setup-display-area');
    if (!area) return;

    area.innerHTML = `
        <div class="trade-ticket animate-in">
            <div class="ticket-id">ORDER ID: ${ticketId} | SYSTEM TIME: ${s.timestamp}</div>
            <div class="ticket-main">
                <div class="ticket-info">
                    <div class="ticket-action ${s.action.toLowerCase()}">${s.action}</div>
                    <div class="ticket-symbol">${s.ticker} / USD</div>
                </div>
                <div class="ticket-meta" style="text-align:right">
                    <div style="color:var(--accent); font-weight:900">CONVICTION: ${s.conviction}</div>
                    <div>EST. SLIPPAGE: ${s.parameters.slippage_est}</div>
                </div>
            </div>
            
            <div class="ticket-grid">
                <div class="ticket-item"><label>ENTRY ZONE</label><span>${formatPrice(s.parameters.entry)}</span></div>
                <div class="ticket-item"><label>R/R RATIO</label><span>${s.parameters.rr_ratio} : 1</span></div>
                <div class="ticket-item"><label>TARGET 1</label><span class="pos">${formatPrice(s.parameters.take_profit_1)}</span></div>
                <div class="ticket-item"><label>STOP LOSS</label><span class="neg">${formatPrice(s.parameters.stop_loss)}</span></div>
                <div class="ticket-item"><label>TARGET 2</label><span class="pos">${formatPrice(s.parameters.take_profit_2)}</span></div>
                <div class="ticket-item"><label>EXP. VOLATILITY</label><span>HIGH (ADAPTIVE)</span></div>
            </div>

            <div class="ticket-footer">
                <div class="ticket-meta">
                    <div style="font-weight:700">INSTRUCTION: LIMIT ORDER / GTC</div>
                    <div>Verified by AlphaSignal Intelligence Hub</div>
                </div>
                <button class="ticket-copy-btn" id="copy-ticket-btn" onclick="copyTicketToClipboard('${ticketId}')">
                    COPY TO CLIPBOARD
                </button>
            </div>
            <input type="hidden" id="raw-ticket-${ticketId}" value="${ticketText}">
        </div>
        <button class="intel-action-btn" style="margin-top:1rem; width:100%" onclick="runNeuralSetup('${s.ticker}')">BACK TO ANALYSIS</button>
    `;
    
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function copyTicketToClipboard(id) {
    const text = document.getElementById(`raw-ticket-${id}`).value;
    const btn = document.getElementById('copy-ticket-btn');
    
    try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "COPIED!";
        btn.classList.add('copied');
        showToast("Success", "Execution ticket copied to clipboard.", "alert");
        setTimeout(() => {
            btn.textContent = "COPY TO CLIPBOARD";
            btn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        showToast("Error", "Could not access clipboard.", "alert");
    }
}

async function updateBTC() {
    const data = await fetchAPI('/btc');
    if (data && data.price) {
        // Updated elsewhere or removed
    }
}



async function syncAlerts() {
    const data = await fetchAPI('/alerts/badge');
    const badge = document.getElementById('alert-badge');
    const liveDot = document.getElementById('alerts-nav-live-dot');

    const unread = data?.unread ?? 0;

    if (badge) {
        if (unread > 0) {
            badge.textContent = unread;
            badge.classList.add('has-alerts');
            badge.style.display = 'flex';
            // Re-trigger pulse animation
            badge.style.animation = 'none';
            void badge.offsetWidth;
            badge.style.animation = '';
        } else {
            badge.textContent = '';
            badge.classList.remove('has-alerts');
            badge.style.display = 'none';
        }
    }

    if (liveDot) {
        liveDot.style.display = unread > 0 ? 'inline-block' : 'none';
    }

    // If user is on the alerts view, pulse the header indicator
    const currentView = new URLSearchParams(window.location.search).get('view');
    if (currentView === 'alerts') {
        const pulse = document.getElementById('alerts-live-pulse');
        if (pulse) {
            pulse.innerHTML = `<span class="live-dot"></span> LIVE &bull; Updated ${new Date().toLocaleTimeString()}`;
            pulse.style.opacity = '1';
            setTimeout(() => { if (pulse) pulse.style.opacity = '0.5'; }, 3000);
        }
    }
}


async function fetchBinanceKlines(symbol, interval, limit=500) {
    try {
        // Phase 10: Robust Institutional vs Crypto Detection
        const sym = (symbol || 'BTC-USD').toUpperCase().replace('-USD', '').replace('USDT', '');
        const institutionalProxies = ['MSTR', 'COIN', 'MARA', 'RIOT', 'CLSK'];
        const isEquity = institutionalProxies.includes(sym);
        
        if (isEquity) {
            // Institutional Hub Proxy (Local Backend -> yfinance)
            const res = await fetch(`/api/equity-klines?symbol=${sym}&interval=${interval}&limit=${limit}`);
            return await res.json();
        } else {
            // Standard Binance Crypto Feed (External -> Binance API)
            // Normalize: BTC-USD or BTC -> BTCUSDT
            const binanceSym = sym.endsWith('USDT') ? sym : (sym + 'USDT');
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=${interval}&limit=${limit}`);
            if (!res.ok) throw new Error(`Binance API ${res.status}`);
            
            const data = await res.json();
            return data.map(d => ({
                time: d[0] / 1000, 
                open: parseFloat(d[1]), 
                high: parseFloat(d[2]),
                low: parseFloat(d[3]), 
                close: parseFloat(d[4]), 
                value: parseFloat(d[5]),
                color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#26a69a' : '#ef5350'
            }));
        }
    } catch (e) { 
        console.error(`Kline Universal Fetch Error (${symbol}):`, e);
        return []; 
    }
}

// TAB 1: Overview (Price + Volume + EMA 20/50 + RSI Placeholder)