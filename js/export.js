async function exportChartPNG(canvasOrId, filename = 'alphasignal-chart') {
    if (typeof html2canvas === 'undefined') {
        showToast('EXPORT', 'Export library loading, please try again in a moment.', 'info');
        return;
    }
    try {
        showToast('EXPORTING', 'Capturing chart-', 'info');
        const el = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
        if (!el) { showToast('ERROR', 'Chart element not found.', 'alert'); return; }
        const canvas = await html2canvas(el, {
            backgroundColor: '#05070a',
            scale: 2,
            logging: false,
            useCORS: true
        });
        const ts = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        link.download = `${filename}-${ts}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('EXPORTED', 'Chart saved as PNG (OK)', 'success');
    } catch (e) {
        console.error('[ExportPNG]', e);
        showToast('ERROR', 'PNG export failed: ' + e.message, 'alert');
    }
}

/**
 * Phase 17: Institutional Research Report - 5-section data-driven PDF
 * Sections: Performance | Backtester | Top Signals | Macro Events | Signal Archive Snapshot
 */
async function exportResearchReport() {
    if (!window.isPremiumUser) { showPaywall(true); return; }
    if (typeof window.jspdf === 'undefined') {
        showToast('EXPORT', 'PDF library loading, please try again.', 'info'); return;
    }
    showToast('BUILDING REPORT', 'Fetching institutional data...', 'info');
    try {
        // Parallel data fetch
        const [perfData, btData, signalsData, macroData, archiveData] = await Promise.allSettled([
            fetchAPI('/performance'),
            fetchAPI('/backtest-v2?hold=5&limit=50'),
            fetchAPI('/signals'),
            fetchAPI('/macro-calendar'),
            fetchAPI('/signal-history')
        ]);

        const perf    = perfData.status === 'fulfilled'    ? perfData.value    : null;
        const bt      = btData.status === 'fulfilled'      ? btData.value      : null;
        const signals = signalsData.status === 'fulfilled' ? signalsData.value : [];
        const macro   = macroData.status === 'fulfilled'   ? macroData.value   : [];
        const archive = archiveData.status === 'fulfilled' ? archiveData.value : [];

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PW = pdf.internal.pageSize.getWidth();
        const PH = pdf.internal.pageSize.getHeight();
        const M  = 14;
        const accent = [0, 212, 170];
        const now = new Date().toUTCString();

        const addHeader = (pageLabel) => {
            pdf.setFillColor(5, 7, 10);
            pdf.rect(0, 0, PW, PH, 'F');
            pdf.setFillColor(...accent);
            pdf.rect(0, 0, PW, 10, 'F');
            pdf.setTextColor(0, 0, 0); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
            pdf.text('ALPHASIGNAL INSTITUTIONAL RESEARCH REPORT', M, 7);
            pdf.setFont('helvetica', 'normal');
            pdf.text(now, PW - M, 7, { align: 'right' });
        };

        const sectionTitle = (label, y) => {
            pdf.setFillColor(0, 212, 170, 0.1);
            pdf.setDrawColor(...accent);
            pdf.setLineWidth(0.4);
            pdf.line(M, y, PW - M, y);
            pdf.setTextColor(...accent); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
            pdf.text(label, M, y + 7);
        };

        const row = (label, value, y, color) => {
            pdf.setTextColor(150, 150, 150); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
            pdf.text(label, M, y);
            if (color) pdf.setTextColor(...color); else pdf.setTextColor(230, 230, 230);
            pdf.setFont('helvetica', 'bold');
            pdf.text(String(value), M + 80, y);
        };

        // -
        // PAGE 1: Cover + Performance + Backtester
        // -
        addHeader('Page 1');
        // Cover band
        pdf.setFillColor(5, 20, 30);
        pdf.rect(0, 10, PW, 32, 'F');
        pdf.setTextColor(255, 255, 255); pdf.setFontSize(20); pdf.setFont('helvetica', 'bold');
        pdf.text('AlphaSignal', M, 26);
        pdf.setTextColor(...accent); pdf.setFontSize(11);
        pdf.text('Institutional Research Report', M, 34);
        pdf.setTextColor(130, 130, 130); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`, M, 40);

        // Section 1: Performance
        let y = 52;
        sectionTitle('SECTION 1 - PORTFOLIO PERFORMANCE', y);
        y += 12;
        if (perf && perf.stats) {
            const s = perf.stats;
            [
                ['Total Return',      (s.total_return >= 0 ? '+' : '') + s.total_return + '%',  s.total_return >= 0 ? [34,197,94] : [239,68,68]],
                ['Sharpe Ratio',      s.sharpe,              (s.sharpe||0) >= 1 ? [0,212,170] : [255,215,0]],
                ['Max Drawdown',      '-' + s.max_drawdown + '%',  [239,68,68]],
                ['Win Rate',          s.win_rate + '%',      (s.win_rate||0) >= 55 ? [34,197,94] : [239,68,68]],
                ['Calmar Ratio',      s.calmar,              (s.calmar||0) >= 1 ? [0,212,170] : [255,215,0]],
                ['Total Trades',      s.total_trades,        null]
            ].forEach(([l, v, c]) => { row(l, v ?? '--', y, c); y += 9; });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Performance data unavailable (requires premium access).', M, y); y += 9;
        }

        // Section 2: Backtester
        y += 4;
        sectionTitle('SECTION 2 - BACKTESTER V2 SUMMARY (5-DAY HOLD)', y);
        y += 12;
        if (bt && bt.stats) {
            const s = bt.stats;
            [
                ['Win Rate',          s.win_rate + '%',      (s.win_rate||0) >= 55 ? [34,197,94] : [239,68,68]],
                ['Total Return',      (s.total_return >= 0 ? '+' : '') + s.total_return + '%', s.total_return >= 0 ? [34,197,94] : [239,68,68]],
                ['Sharpe Ratio',      s.sharpe,              (s.sharpe||0) >= 1 ? [0,212,170] : [255,215,0]],
                ['Max Drawdown',      '-' + s.max_drawdown + '%', [239,68,68]],
                ['Profit Factor',     s.profit_factor,       (s.profit_factor||0) >= 1.5 ? [34,197,94] : [255,215,0]],
                ['Calmar Ratio',      s.calmar,              null],
                ['Total Trades',      s.total_trades,        null]
            ].forEach(([l, v, c]) => { row(l, v ?? '--', y, c); y += 9; });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Backtester data unavailable (requires premium access).', M, y); y += 9;
        }

        // -
        // PAGE 2: Top Signals + Macro Events
        // -
        pdf.addPage();
        addHeader('Page 2');
        y = 20;

        // Section 3: Live P&L Snapshot
        sectionTitle('SECTION 3 - LIVE ALERT P&L TRACKER', y);
        y += 12;
        const alertPnlData = (window._alertsCache || []).filter(a => a.price && parseFloat(a.price) > 0).slice(0, 10);
        if (alertPnlData.length) {
            pdf.setTextColor(100,100,100); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
            ['TICKER', 'TYPE', 'ENTRY $', 'LIVE $', 'P&L %', 'DATE'].forEach((h, i) => {
                pdf.text(h, M + [0, 28, 60, 96, 130, 155][i], y);
            });
            y += 6;
            pdf.setLineWidth(0.2); pdf.setDrawColor(50,50,50);
            pdf.line(M, y, PW - M, y); y += 4;
            const lp = window.livePrices || {};
            alertPnlData.forEach((a, idx) => {
                if (y > PH - 25) { pdf.addPage(); addHeader('P&L'); y = 20; }
                const bg = idx % 2 === 0;
                if (bg) { pdf.setFillColor(15, 22, 30); pdf.rect(M - 2, y - 4, PW - M*2 + 4, 8, 'F'); }
                const ep = parseFloat(a.price);
                const livep = lp[a.ticker] || lp[(a.ticker||'').replace('-USD','')] || null;
                const pct = livep ? ((livep - ep) / ep * 100) : null;
                pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...accent); pdf.setFontSize(7.5);
                pdf.text((a.ticker||'--').replace('-USD',''), M, y);
                pdf.setFont('helvetica', 'normal'); pdf.setTextColor(200,200,200);
                pdf.text((a.type||'--').substring(0,10), M + 28, y);
                pdf.text('$' + ep.toLocaleString('en-US', {maximumFractionDigits:4}), M + 60, y);
                pdf.text(livep ? ('$' + livep.toLocaleString('en-US', {maximumFractionDigits:4})) : '--', M + 96, y);
                if (pct !== null) {
                    pdf.setTextColor(pct >= 0 ? 34 : 239, pct >= 0 ? 197 : 68, pct >= 0 ? 94 : 68);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text((pct >= 0 ? '+' : '') + pct.toFixed(2) + '%', M + 130, y);
                } else {
                    pdf.setTextColor(100,100,100); pdf.text('N/A', M + 130, y);
                }
                pdf.setFont('helvetica', 'normal'); pdf.setTextColor(200,200,200);
                pdf.text(a.timestamp ? a.timestamp.split('T')[0] : '--', M + 155, y);
                y += 9;
            });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('P&L data unavailable. View Alerts tab to seed prices.', M, y); y += 9;
        }

        // Section 4: Top Signals
        y += 6;
        sectionTitle('SECTION 4 - TOP LIVE INSTITUTIONAL SIGNALS', y);
        y += 12;
        const sigList = Array.isArray(signals) ? signals.slice(0, 10) : [];
        if (sigList.length) {
            // Table header
            pdf.setTextColor(100,100,100); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
            ['TICKER', 'TYPE', 'Z-SCORE', 'ALPHA %', 'CONFIDENCE'].forEach((h, i) => {
                pdf.text(h, M + i * 36, y);
            });
            y += 6;
            pdf.setLineWidth(0.2); pdf.setDrawColor(50,50,50);
            pdf.line(M, y, PW - M, y); y += 4;

            sigList.forEach((s, idx) => {
                const bg = idx % 2 === 0;
                if (bg) { pdf.setFillColor(15, 22, 30); pdf.rect(M - 2, y - 4, PW - M*2 + 4, 8, 'F'); }
                pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...accent); pdf.setFontSize(8);
                pdf.text(s.ticker || '--', M, y);
                pdf.setTextColor(200,200,200); pdf.setFont('helvetica', 'normal');
                pdf.text(s.signal_type || s.type || '--', M + 36, y);
                const z = parseFloat(s.z_score || 0);
                pdf.setTextColor(z >= 0 ? 34 : 239, z >= 0 ? 197 : 68, z >= 0 ? 94 : 68);
                pdf.text(z.toFixed(2), M + 72, y);
                const a = parseFloat(s.alpha || 0);
                pdf.setTextColor(a >= 0 ? 34 : 239, a >= 0 ? 197 : 68, a >= 0 ? 94 : 68);
                pdf.text((a >= 0 ? '+' : '') + a.toFixed(2) + '%', M + 108, y);
                pdf.setTextColor(200,200,200);
                pdf.text(s.confidence != null ? s.confidence + '%' : '--', M + 144, y);
                y += 9;
            });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Signal data unavailable.', M, y); y += 9;
        }

        // Section 5: Macro Events
        y += 6;
        sectionTitle('SECTION 5 - UPCOMING MACRO EVENTS', y);
        y += 12;
        const macroList = Array.isArray(macro) ? macro.slice(0, 8) : [];
        if (macroList.length) {
            pdf.setTextColor(100,100,100); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
            ['DATE', 'EVENT', 'IMPACT', 'BTC MEDIAN MOVE'].forEach((h, i) => {
                pdf.text(h, M + [0, 28, 110, 145][i], y);
            });
            y += 6;
            pdf.setLineWidth(0.2); pdf.setDrawColor(50,50,50);
            pdf.line(M, y, PW - M, y); y += 4;

            macroList.forEach((ev, idx) => {
                if (y > PH - 25) { pdf.addPage(); addHeader('Page 3'); y = 20; }
                const bg = idx % 2 === 0;
                if (bg) { pdf.setFillColor(15, 22, 30); pdf.rect(M - 2, y - 4, PW - M*2 + 4, 8, 'F'); }
                const impact = ev.impact_score || ev.impact || 0;
                const impColor = impact >= 7 ? [239,68,68] : impact >= 4 ? [255,165,0] : [100,200,100];
                pdf.setFont('helvetica', 'normal'); pdf.setTextColor(200,200,200); pdf.setFontSize(7.5);
                const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('en-US', {month:'short',day:'numeric'}) : '--';
                pdf.text(dateStr, M, y);
                const evName = (ev.event || ev.name || '--').substring(0, 30);
                pdf.text(evName, M + 28, y);
                pdf.setTextColor(...impColor);
                pdf.text(String(impact) + '/10', M + 110, y);
                pdf.setTextColor(200,200,200);
                const btcMove = ev.btc_median_move != null ? (ev.btc_median_move >= 0 ? '+' : '') + ev.btc_median_move + '%' : '--';
                pdf.text(btcMove, M + 145, y);
                y += 9;
            });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Macro calendar data unavailable.', M, y); y += 9;
        }

        // -
        // PAGE 3 (or continued): Signal Archive
        // -
        if (y > PH - 60) { pdf.addPage(); addHeader('Page'); y = 20; }
        y += 6;
        sectionTitle('SECTION 6 - SIGNAL ARCHIVE SNAPSHOT (LAST 10)', y);
        y += 12;
        const archList = Array.isArray(archive) ? archive.slice(0, 10) : [];
        if (archList.length) {
            pdf.setTextColor(100,100,100); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
            ['TICKER', 'TYPE', 'DATE', 'P&L %', 'STATE'].forEach((h, i) => {
                pdf.text(h, M + [0, 30, 66, 106, 140][i], y);
            });
            y += 6;
            pdf.line(M, y, PW - M, y); y += 4;

            archList.forEach((sig, idx) => {
                if (y > PH - 25) { pdf.addPage(); addHeader('Page'); y = 20; }
                const bg = idx % 2 === 0;
                if (bg) { pdf.setFillColor(15, 22, 30); pdf.rect(M - 2, y - 4, PW - M*2 + 4, 8, 'F'); }
                const pnl = parseFloat(sig.pnl_pct || sig.pnl || 0);
                pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...accent); pdf.setFontSize(7.5);
                pdf.text(sig.ticker || '--', M, y);
                pdf.setFont('helvetica', 'normal'); pdf.setTextColor(200,200,200);
                pdf.text((sig.signal_type || sig.type || '--').substring(0,14), M + 30, y);
                pdf.text(sig.timestamp ? sig.timestamp.split('T')[0] : '--', M + 66, y);
                pdf.setTextColor(pnl >= 0 ? 34 : 239, pnl >= 0 ? 197 : 68, pnl >= 0 ? 94 : 68);
                pdf.setFont('helvetica', 'bold');
                pdf.text((pnl >= 0 ? '+' : '') + pnl.toFixed(2) + '%', M + 106, y);
                pdf.setTextColor(200,200,200); pdf.setFont('helvetica', 'normal');
                pdf.text((sig.state || 'ACTIVE').substring(0, 12), M + 140, y);
                y += 9;
            });
        } else {
            pdf.setTextColor(100,100,100); pdf.setFontSize(8);
            pdf.text('Signal archive data unavailable.', M, y); y += 9;
        }

        // Footer on all pages
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setTextColor(80, 80, 80); pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal');
            pdf.text(`CONFIDENTIAL - INSTITUTIONAL USE ONLY - alphasignal.digital - Page ${i}/${pageCount}`, PW / 2, PH - 5, { align: 'center' });
        }

        const ts = new Date().toISOString().slice(0, 10);
        pdf.save(`alphasignal-research-report-${ts}.pdf`);
        showToast('REPORT EXPORTED', `6-section PDF saved (${pageCount} pages).`, 'success');
    } catch (e) {
        console.error('[exportResearchReport]', e);
        showToast('ERROR', 'Report export failed: ' + e.message, 'alert');
    }
}

/**
 * Export the current view as an institutional PDF report.
 * @param {string} title - Report title shown in the header
 * @param {string} containerId - ID of the DOM element to capture (defaults to 'main-content')
 */
async function exportViewPDF(title = 'AlphaSignal Report', containerId = 'main-content') {
    if (!window.isPremiumUser) { showPaywall(true); return; }
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        showToast('EXPORT', 'Export library loading, please try again in a moment.', 'info');
        return;
    }
    try {
        showToast('EXPORTING', 'Building PDF report-', 'info');
        const el = document.getElementById(containerId) || document.querySelector('.content');
        if (!el) { showToast('ERROR', 'Content element not found.', 'alert'); return; }

        const canvas = await html2canvas(el, {
            backgroundColor: '#05070a',
            scale: 1.5,
            logging: false,
            useCORS: true,
            windowWidth: el.scrollWidth,
            windowHeight: el.scrollHeight
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 10;

        // Header bar
        pdf.setFillColor(5, 7, 10);
        pdf.rect(0, 0, pageW, pageH, 'F');
        pdf.setFillColor(0, 212, 170);
        pdf.rect(0, 0, pageW, 12, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ALPHASIGNAL TERMINAL', margin, 8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date().toUTCString(), pageW - margin, 8, { align: 'right' });

        // Title
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, 22);

        // Chart image
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgW = pageW - margin * 2;
        const imgH = (canvas.height / canvas.width) * imgW;
        let yPos = 28;
        let remainH = imgH;
        let srcY = 0;

        while (remainH > 0) {
            const sliceH = Math.min(remainH, pageH - yPos - margin);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = (sliceH / imgW) * canvas.width;
            const ctx = sliceCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, srcY * (canvas.height / imgH), canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
            pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, yPos, imgW, sliceH);
            remainH -= sliceH;
            srcY += sliceH;
            if (remainH > 0) { pdf.addPage(); yPos = margin; }
        }

        // Footer
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFillColor(0, 212, 170, 0.15);
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(7);
            pdf.text(`CONFIDENTIAL -- INSTITUTIONAL USE ONLY -- alphasignal.io -- Page ${i}/${pageCount}`, pageW / 2, pageH - 4, { align: 'center' });
        }

        const ts = new Date().toISOString().slice(0, 10);
        pdf.save(`alphasignal-${title.toLowerCase().replace(/\s+/g, '-')}-${ts}.pdf`);
        showToast('EXPORTED', 'PDF report saved (OK)', 'success');
    } catch (e) {
        console.error('[ExportPDF]', e);
        showToast('ERROR', 'PDF export failed: ' + e.message, 'alert');
    }
}

/**
 * Show a floating export action sheet anchored to a trigger element.
 * @param {Event} event - Click event from the export button
 * @param {string} chartId - ID of the canvas/chart to export as PNG
 * @param {string} viewTitle - Title for PDF export
 */
function showExportMenu(event, chartId, viewTitle) {
    event.stopPropagation();
    // Remove any existing menu
    const existing = document.getElementById('export-action-sheet');
    if (existing) { existing.remove(); return; }

    const btn = event.currentTarget || event.target;
    const rect = btn.getBoundingClientRect();

    const menu = document.createElement('div');
    menu.id = 'export-action-sheet';
    menu.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 8}px;
        left: ${rect.left}px;
        background: rgba(13,17,23,0.97);
        border: 1px solid rgba(0,212,170,0.25);
        border-radius: 12px;
        padding: 8px;
        z-index: 9998;
        min-width: 200px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        animation: fadeInDown 0.15s ease;
    `;

    // - PAYWALL GATE -
    if (!window.isPremiumUser) {
        menu.innerHTML = `
            <div style="padding:14px 16px 10px;text-align:center">
                <span class="material-symbols-outlined" style="font-size:2rem;color:#facc15;display:block;margin-bottom:8px">workspace_premium</span>
                <div style="font-size:0.75rem;font-weight:900;letter-spacing:1px;color:#fff;margin-bottom:4px">INSTITUTIONAL EXPORT</div>
                <div style="font-size:0.65rem;color:${alphaColor(0.45)};margin-bottom:14px;line-height:1.5">CSV, PDF &amp; chart exports are<br>available on the Institutional plan.</div>
                <button onclick="document.getElementById('export-action-sheet')?.remove(); showPaywall(true);"
                    style="width:100%;padding:9px 0;background:linear-gradient(135deg,#facc15,#f59e0b);border:none;border-radius:8px;color:#000;font-size:0.7rem;font-weight:900;letter-spacing:1px;cursor:pointer">
                    UPGRADE NOW
                </button>
                <button onclick="document.getElementById('export-action-sheet')?.remove();"
                    style="width:100%;padding:6px 0;background:none;border:none;color:${alphaColor(0.3)};font-size:0.65rem;cursor:pointer;margin-top:4px">
                    Maybe later
                </button>
            </div>
        `;
        document.body.appendChild(menu);
        // Reposition if off-screen right
        const mr = menu.getBoundingClientRect();
        if (mr.right > window.innerWidth - 16) {
            menu.style.left = `${window.innerWidth - mr.width - 16}px`;
        }
        document.addEventListener('click', () => menu.remove(), { once: true });
        return;
    }
    // - PREMIUM: full export menu -
    menu.innerHTML = `
        <button onclick="exportChartPNG('${chartId}', '${viewTitle.toLowerCase().replace(/\s+/g,'-')}');document.getElementById('export-action-sheet')?.remove();"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:0.15s"
            onmouseover="this.style.background=alphaColor(0.07)" onmouseout="this.style.background='none'">
            <span class="material-symbols-outlined" style="font-size:18px;color:#00d4aa">image</span>
            Export Chart PNG
        </button>
        <button onclick="exportViewPDF('${viewTitle}');document.getElementById('export-action-sheet')?.remove();"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:0.15s"
            onmouseover="this.style.background=alphaColor(0.07)" onmouseout="this.style.background='none'">
            <span class="material-symbols-outlined" style="font-size:18px;color:#bc13fe">picture_as_pdf</span>
            Export View as PDF
        </button>
        <button onclick="exportResearchReport();document.getElementById('export-action-sheet')?.remove();"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:0.15s"
            onmouseover="this.style.background=alphaColor(0.07)" onmouseout="this.style.background='none'">
            <span class="material-symbols-outlined" style="font-size:18px;color:#f59e0b">summarize</span>
            Research Report (PDF)
        </button>
        <div style="height:1px;background:${alphaColor(0.07)};margin:4px 0"></div>
        <button onclick="if(typeof lastSignalsData!='undefined')exportCSV(lastSignalsData,'signals');document.getElementById('export-action-sheet')?.remove();"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:#fff;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:0.15s"
            onmouseover="this.style.background=alphaColor(0.07)" onmouseout="this.style.background='none'">
            <span class="material-symbols-outlined" style="font-size:18px;color:#ffd700">table_chart</span>
            Export Data CSV
        </button>
    `;

    document.body.appendChild(menu);

    // Reposition if off-screen right
    const mr = menu.getBoundingClientRect();
    if (mr.right > window.innerWidth - 16) {
        menu.style.left = `${window.innerWidth - mr.width - 16}px`;
    }

    // Auto-dismiss on outside click
    setTimeout(() => {
        document.addEventListener('click', () => document.getElementById('export-action-sheet')?.remove(), { once: true });
    }, 50, 'ask-terminal'
    );
}

// ================================================================
// Phase 15-16 Documentation Pages
// ================================================================

