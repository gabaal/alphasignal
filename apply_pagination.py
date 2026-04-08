"""
Re-apply pagination changes to the clean alerts-archive.js without encoding corruption.
This replaces the old inline card render with a clean shell + _renderAlertsPage pattern.
"""

PATH = 'js/views/alerts-archive.js'

with open(PATH, encoding='utf-8') as f:
    src = f.read()

# ── 1. Fix the template section: close container shell properly ────────────────
# Old: opens <div id="alert-cards-container"> but doesn't close it - leaves old inline render
OLD_SHELL_END = '''                <div id="alert-page-bar-top"></div>
                <div id="alert-cards-container" style="display:flex;flex-direction:column;gap:1.5rem">\`;
            })() : ''}'''

NEW_SHELL_END = '''                <div id="alert-page-bar-top"></div>
                <div id="alert-cards-container" style="display:flex;flex-direction:column;gap:1.5rem"></div>
                <div id="alert-page-bar-bottom"></div>\`;
            })() : `
            <div class="card" style="padding:3rem;text-align:center">
                <span class="material-symbols-outlined" style="font-size:3rem;color:var(--risk-low);display:block;margin-bottom:1rem">check_circle</span>
                <h3 style="color:var(--risk-low);margin-bottom:0.5rem">ALL CLEAR</h3>
                <p style="color:var(--text-dim);font-size:0.85rem">No active high-severity threats detected. All trigger conditions within normal parameters.</p>
            </div>`}
        </div>`;'''

if OLD_SHELL_END in src:
    # Now find the end of the old inline render block that follows
    # It ends with: '}).join('') : `...ALL CLEAR...`}\n            ${window._alertsCache ? ...}\n        </div>`;
    start_idx = src.index(OLD_SHELL_END)
    # Find the closing sentinel of the old inline block
    old_block_close = "            ${window._alertsCache ? '</div><div id=\"alert-page-bar-bottom\"></div>' : ''}\n        </div>`;"
    if old_block_close in src:
        end_idx = src.index(old_block_close) + len(old_block_close)
        src = src[:start_idx] + NEW_SHELL_END + src[end_idx:]
        print('✓ Template shell updated')
    else:
        print('✗ Could not find old block close sentinel')
        # Try alternate ending
        alt_close = "        </div>`;"
        # Find it after the shell start
        search_from = start_idx + len(OLD_SHELL_END)
        alt_idx = src.index(alt_close, search_from)
        end_idx = alt_idx + len(alt_close)
        src = src[:start_idx] + NEW_SHELL_END + src[end_idx:]
        print('✓ Template shell updated (alt method)')
else:
    print('Shell already updated or not found - checking current state...')
    if 'alert-page-bar-bottom' in src and 'ALL CLEAR' in src:
        print('  Already has correct structure')

# ── 2. Add pagination state + helpers after the badge clear block ──────────────
BADGE_BLOCK = '''// Clear badge when viewing alerts
    const badge = document.getElementById('alert-badge');
    if (badge) badge.style.display = 'none';'''

PAGINATION_BLOCK = '''// Clear badge when viewing alerts
    const badge = document.getElementById('alert-badge');
    if (badge) badge.style.display = 'none';

    // ── Pagination state ─────────────────────────────────────────────────
    const ALERTS_PER_PAGE = 25;
    window._alertsPage = 1;

    function _alertPageBar(currentPage, totalPages) {
        if (totalPages <= 1) return '';
        const btnStyle = (disabled, active) =>
            `font-size:0.6rem;font-weight:900;padding:5px 12px;border-radius:6px;cursor:${disabled?'default':'pointer'};` +
            `border:1px solid ${active?'rgba(0,242,255,0.5)':disabled?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.12)'};` +
            `background:${active?'rgba(0,242,255,0.12)':'rgba(255,255,255,0.03)'};` +
            `color:${active?'var(--accent)':disabled?'rgba(255,255,255,0.2)':'var(--text-dim)'};letter-spacing:1px;transition:all 0.15s`;

        const pages = Array.from({length: totalPages}, (_,i) => i+1);
        let show = pages;
        if (totalPages > 7) {
            const near = new Set([1, totalPages, currentPage, currentPage-1, currentPage+1].filter(p => p>=1 && p<=totalPages));
            show = [...near].sort((a,b)=>a-b);
        }
        let btns = '', prev = 0;
        for (const p of show) {
            if (prev && p - prev > 1) btns += `<span style="color:var(--text-dim);font-size:0.7rem;padding:0 4px">...</span>`;
            const active = p === currentPage;
            btns += `<button style="${btnStyle(false,active)}" onclick="window._alertsGoPage(${p})">${p}</button>`;
            prev = p;
        }
        return `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 0;justify-content:center">
            <button style="${btnStyle(currentPage<=1,false)}" ${currentPage<=1?'disabled':''} onclick="window._alertsGoPage(${currentPage-1})">
                &laquo; PREV
            </button>
            ${btns}
            <button style="${btnStyle(currentPage>=totalPages,false)}" ${currentPage>=totalPages?'disabled':''} onclick="window._alertsGoPage(${currentPage+1})">
                NEXT &raquo;
            </button>
        </div>`;
    }

    function _renderAlertsPage(filtered) {
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / ALERTS_PER_PAGE));
        if (window._alertsPage > totalPages) window._alertsPage = totalPages;
        const offset = (window._alertsPage - 1) * ALERTS_PER_PAGE;
        const slice  = filtered.slice(offset, offset + ALERTS_PER_PAGE);

        const countLabel = document.getElementById('alert-count-label');
        if (countLabel) countLabel.textContent = `${total} alert${total!==1?'s':''} - page ${window._alertsPage}/${totalPages}`;

        const container = document.getElementById('alert-cards-container');
        if (!container) return;

        if (!slice.length) {
            container.innerHTML = `<div class="card" style="padding:2rem;text-align:center"><p style="color:var(--text-dim)">No alerts match this filter.</p></div>`;
        } else {
            container.innerHTML = slice.map(a => _buildAlertCard(a)).join('');
            _upgradePendingPnl();
            setTimeout(_fetchFallbackPrices, 200);
        }

        const barHTML = _alertPageBar(window._alertsPage, totalPages);
        const top = document.getElementById('alert-page-bar-top');
        const bot = document.getElementById('alert-page-bar-bottom');
        if (top) top.innerHTML = barHTML;
        if (bot) bot.innerHTML = barHTML;
    }

    window._alertsGoPage = function(p) {
        window._alertsPage = p;
        const type = document.querySelector('.alert-filter-btn.active')?.dataset?.afilter || 'ALL';
        const tq   = document.getElementById('alert-ticker-search')?.value || '';
        window.filterAlerts(type, null, tq);
        document.getElementById('alert-filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // filterAlerts - client-side filter using cached data
    window.filterAlerts = function(type, btn, tickerQ) {
        const data = window._alertsCache || [];
        const tickerVal = tickerQ !== undefined ? tickerQ : (document.getElementById('alert-ticker-search')?.value || '');
        const tq = tickerVal.trim().toUpperCase();

        if (btn) {
            document.querySelectorAll('.alert-filter-btn').forEach(b => {
                b.style.background = 'rgba(255,255,255,0.04)'; b.style.color = 'var(--text-dim)'; b.classList.remove('active');
            });
            btn.style.background = 'rgba(0,242,255,0.12)'; btn.style.color = 'var(--accent)'; btn.classList.add('active');
            window._alertsPage = 1;
        }

        const filtered = data.filter(a => {
            const typeMatch = type === 'ALL' || (a.type || '').toUpperCase().includes(type);
            const tickerMatch = !tq || (a.ticker || '').toUpperCase().includes(tq);
            return typeMatch && tickerMatch;
        });

        _renderAlertsPage(filtered);
    };

    // _buildAlertCard - shared card builder used by pagination
    function _buildAlertCard(a) {
        const ts = a.timestamp ? new Date(a.timestamp) : null;
        const tsDisplay = ts ? ts.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'SYNC';
        const sev = a.severity || 'medium';
        const sevColor = sev === 'high' || sev === 'critical' ? 'var(--risk-high)' : sev === 'medium' ? 'var(--accent)' : 'var(--text-dim)';
        const ageMs = ts ? (Date.now() - ts.getTime()) : null;
        const ageLabel = ageMs !== null ? (
            ageMs < 3600000 ? `${Math.round(ageMs/60000)}m ago` :
            ageMs < 86400000 ? `${Math.round(ageMs/3600000)}h ago` :
            `${Math.round(ageMs/86400000)}d ago`) : '';
        const sym = a.ticker ? a.ticker.replace('-USD','').toUpperCase() : null;
        const livePrice  = sym && window.livePrices ? window.livePrices[sym] : null;
        const entryPrice = a.price && parseFloat(a.price) > 0 ? parseFloat(a.price) : null;
        let pnlHtml = '';
        if (entryPrice && livePrice) {
            const pct = ((livePrice - entryPrice) / entryPrice * 100);
            const col = pct > 0 ? 'var(--risk-low)' : pct < 0 ? 'var(--risk-high)' : 'var(--text-dim)';
            pnlHtml = `<div style="display:flex;gap:12px;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px;flex-wrap:wrap">
                <div style="font-size:0.65rem;color:var(--text-dim)"><span style="font-weight:700;letter-spacing:1px">ENTRY</span><br>
                <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${entryPrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span></div>
                <span style="color:var(--text-dim);font-size:0.8rem">&#8594;</span>
                <div style="font-size:0.65rem;color:var(--text-dim)"><span style="font-weight:700;letter-spacing:1px">NOW</span><br>
                <span style="font-family:var(--font-mono);font-weight:700;color:var(--text)">$${livePrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span></div>
                <div style="margin-left:auto;text-align:right">
                    <div style="font-size:1rem;font-weight:900;color:${col};font-family:var(--font-mono)">${pct>0?'+':''}${pct.toFixed(2)}%</div>
                    <div style="font-size:0.55rem;color:var(--text-dim)">since signal</div>
                </div></div>`;
        } else if (entryPrice) {
            pnlHtml = `<div class="pnl-pending" data-ticker="${a.ticker||''}" data-entry="${entryPrice}" style="display:inline-flex;align-items:center;gap:8px;padding:4px 10px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px">
                <span style="font-size:0.6rem;color:var(--text-dim);font-weight:700;letter-spacing:1px">ENTRY</span>
                <span style="font-family:var(--font-mono);font-size:0.8rem;font-weight:700">$${entryPrice.toLocaleString('en-US',{maximumFractionDigits:4})}</span>
                <span style="font-size:0.6rem;color:var(--text-dim);opacity:0.5;margin-left:4px">fetching live...</span></div>`;
        }
        return `<div class="alert-card ${sev}" style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid ${sevColor};border-radius:12px;padding:1.5rem;position:relative;transition:transform 0.2s ease,box-shadow 0.2s ease" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'" onmouseleave="this.style.transform='';this.style.boxShadow=''">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:8px">
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                    <span style="font-size:0.7rem;font-weight:900;background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;color:${sevColor}">${a.type}</span>
                    <span style="font-size:0.65rem;padding:3px 8px;border-radius:100px;font-weight:800;background:${sev==='high'||sev==='critical'?'rgba(239,68,68,0.15)':'rgba(0,242,255,0.1)'};color:${sevColor};border:1px solid ${sevColor}33;letter-spacing:1px">${sev.toUpperCase()}</span>
                    ${a.ticker && a.ticker!=='SYSTEM' ? `<span style="font-size:0.65rem;font-weight:900;color:var(--accent)">${a.ticker.replace('-USD','')}</span>` : ''}
                </div>
                <div style="text-align:right">
                    <div style="font-size:0.7rem;color:var(--text-dim);font-family:var(--font-mono)">${tsDisplay}</div>
                    ${ageLabel ? `<div style="font-size:0.6rem;color:var(--text-dim);opacity:0.6">${ageLabel}</div>` : ''}
                </div>
            </div>
            <div style="font-size:1.1rem;font-weight:800;margin-bottom:8px">${a.title||(a.ticker+' SIGNAL')}</div>
            <div style="font-size:0.85rem;color:var(--text-dim);line-height:1.4;margin-bottom:1rem">${a.content||a.message}</div>
            ${pnlHtml}
            <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button class="intel-action-btn mini" onclick="showSignalDetail('${a.id}','${a.ticker}')" style="font-size:0.6rem;padding:4px 10px">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">psychology</span>AI REASONING
                </button>
                ${a.ticker && a.ticker!=='SYSTEM' ? `
                <button class="intel-action-btn mini outline" onclick="openDetail('${a.ticker}','ALERT')" style="font-size:0.6rem;padding:4px 10px">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">monitoring</span>CHART
                </button>
                <button class="intel-action-btn mini outline" onclick="addToWatchlist_quick('${a.ticker}')" style="font-size:0.6rem;padding:4px 10px;color:#22c55e;border-color:rgba(34,197,94,0.3)">
                    <span class="material-symbols-outlined" style="font-size:14px;margin-right:4px;color:#22c55e">add_circle</span>WATCH
                </button>` : ''}
            </div>
        </div>`;
    }

    // Trigger initial page render
    if (data && data.length) {
        _renderAlertsPage(data);
    }'''

if BADGE_BLOCK in src and 'ALERTS_PER_PAGE' not in src:
    src = src.replace(BADGE_BLOCK, PAGINATION_BLOCK, 1)
    print('Pagination block added')
elif 'ALERTS_PER_PAGE' in src:
    print('Pagination already present')
else:
    print('ERROR: badge block not found')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)
print('Done. File saved.')
