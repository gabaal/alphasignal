"""Patch script v2: inject signal store + drawer into liquidity-archive.js"""
import pathlib

ar = pathlib.Path('js/views/liquidity-archive.js').read_text(encoding='utf-8')

# ─── 1. Signal store before renderRows ────────────────────────────────────
STORE_OLD = '        function renderRows(d) {'
STORE_NEW = '''        // Signal store: populated each render so drawer can look up by id
        window._archiveSignals = window._archiveSignals || {};

        function renderRows(d) {
            sortedData(d).forEach(s => { window._archiveSignals[String(s.id)] = s; });'''

if STORE_OLD in ar and 'window._archiveSignals' not in ar:
    ar = ar.replace(STORE_OLD, STORE_NEW, 1)
    print('OK: signal store injected')
elif 'window._archiveSignals' in ar:
    print('INFO: signal store already present')
else:
    print('ERROR: renderRows(d) marker not found')

# ─── 2. Drawer code before apply-filters ──────────────────────────────────
INJECT_MARKER = "    document.getElementById('apply-filters').onclick"

DRAWER = """
    // ── Signal Detail Drawer ─────────────────────────────────────────────
    (function _initDrawer() {
        if (document.getElementById('sig-drawer')) return;
        const st = document.createElement('style');
        st.textContent = [
            '#sig-drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9998;opacity:0;pointer-events:none;transition:opacity .3s}',
            '#sig-drawer-overlay.open{opacity:1;pointer-events:all}',
            '#sig-drawer{position:fixed;top:0;right:0;width:440px;max-width:100vw;height:100vh;z-index:9999;',
            'background:#0a1628;border-left:1px solid rgba(0,242,255,0.15);',
            'padding:2rem 1.5rem 4rem;overflow-y:auto;',
            'transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1)}',
            '#sig-drawer.open{transform:translateX(0)}',
            '.sdw-label{font-size:.48rem;font-weight:900;letter-spacing:1.5px;color:#6b7280;margin-bottom:4px}',
            '.sdw-val{font-size:1.05rem;font-weight:900;font-family:monospace}',
            '.sdw-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:.85rem 1rem;text-align:center}',
            '.sdw-tp{display:flex;align-items:center;gap:8px;padding:.5rem .75rem;border-radius:8px;margin-bottom:6px;font-size:.72rem}',
        ].join('');
        document.head.appendChild(st);
        const ov = document.createElement('div');
        ov.id = 'sig-drawer-overlay';
        ov.onclick = () => window._closeSignalDrawer();
        document.body.appendChild(ov);
        const dr = document.createElement('div');
        dr.id = 'sig-drawer';
        document.body.appendChild(dr);
    })();

    window._closeSignalDrawer = function() {
        document.getElementById('sig-drawer')?.classList.remove('open');
        document.getElementById('sig-drawer-overlay')?.classList.remove('open');
    };

    window._openSignalDrawer = function(rawId) {
        const id = String(rawId);
        const s  = (window._archiveSignals || {})[id];
        if (!s) { console.warn('[Drawer] signal not found:', id, Object.keys(window._archiveSignals||{}).slice(0,5)); return; }
        const drawer = document.getElementById('sig-drawer');
        const isClosed  = s.state === 'CLOSED';
        const roi       = isClosed && s.final_roi != null ? s.final_roi : s.return;
        const roiColor  = roi >= 0 ? '#22c55e' : '#ef4444';
        const exitPx    = isClosed && s.exit_price ? s.exit_price : s.current;
        const SC        = {ACTIVE:'#60a5fa',HIT_TP1:'#22c55e',HIT_TP2:'#16a34a',STOPPED:'#ef4444',CLOSED:'#94a3b8'};
        const SI        = {ACTIVE:'\\u26a1',HIT_TP1:'\\uD83C\\uDFAF',HIT_TP2:'\\uD83C\\uDFC6',STOPPED:'\\uD83D\\uDED1',CLOSED:'\\uD83D\\uDD12'};
        const sc        = SC[s.state] || '#60a5fa';
        const entry     = Number(s.entry || 0);
        const tp2px     = entry > 0 ? formatPrice(entry * 1.10) : '-';
        const tp1px     = entry > 0 ? formatPrice(entry * 1.05) : '-';
        const slpx      = entry > 0 ? formatPrice(entry * 0.97) : '-';
        const sym       = s.ticker.replace('-USD','');
        const tsStr     = (s.timestamp||'').replace('T',' ').slice(0,16);
        const closedStr = (s.closed_at||'').slice(0,16);
        const metaClosed = isClosed ? `<div><span style="opacity:.6">CLOSED AT</span><br><b style="color:#94a3b8">${closedStr}</b></div>` : '';
        const actionHtml = !isClosed
            ? `<button onclick="window._archiveCloseSignal(${s.id},this);window._closeSignalDrawer()"
                style="width:100%;padding:.85rem;background:linear-gradient(135deg,rgba(239,68,68,.15),rgba(239,68,68,.05));border:1px solid rgba(239,68,68,.3);color:#ef4444;border-radius:10px;cursor:pointer;font-size:.75rem;font-weight:700;letter-spacing:1.5px">
                CLOSE SIGNAL &#x26; LOCK ROI
               </button>`
            : `<div style="text-align:center;padding:.75rem;background:rgba(148,163,184,.06);border:1px solid rgba(148,163,184,.1);border-radius:10px;font-size:.7rem;color:#94a3b8;letter-spacing:1px">
                \\uD83D\\uDD12 SIGNAL CLOSED &nbsp;&middot;&nbsp; ROI LOCKED AT ${s.final_roi!=null?(s.final_roi>=0?'+':'')+s.final_roi+'%':'-'}
               </div>`;
        const thesisHtml = s.message
            ? `<div style="margin-bottom:1.2rem">
                 <div style="font-size:.5rem;font-weight:900;letter-spacing:2px;color:#6b7280;margin-bottom:8px">AI THESIS</div>
                 <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:1rem;font-size:.75rem;color:#94a3b8;line-height:1.6">${s.message}</div>
               </div>` : '';

        drawer.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">
            <div>
              <div style="font-size:1.6rem;font-weight:900;color:#00f2ff;letter-spacing:-0.5px">${sym}</div>
              <div style="font-size:.6rem;color:#6b7280;margin-top:2px">${s.ticker} &nbsp;&middot;&nbsp; ${(s.type||'').replace(/_/g,' ')}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="background:${sc}22;color:${sc};padding:4px 12px;border-radius:20px;font-size:.6rem;font-weight:700;letter-spacing:1px">${SI[s.state]||''} ${s.state}</span>
              <button onclick="window._closeSignalDrawer()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#6b7280;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;line-height:1">&#x2715;</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:1.2rem">
            <div class="sdw-card"><div class="sdw-label">ENTRY</div><div class="sdw-val" style="color:#e2e8f0">${s.entry ? formatPrice(s.entry) : '-'}</div></div>
            <div class="sdw-card"><div class="sdw-label">${isClosed ? 'EXIT' : 'CURRENT'}</div><div class="sdw-val" style="color:${isClosed?'#94a3b8':'#e2e8f0'}">${exitPx ? formatPrice(exitPx) : '-'}</div></div>
            <div class="sdw-card"><div class="sdw-label">ROI</div><div class="sdw-val" style="color:${roiColor}">${isClosed ? '\\uD83D\\uDD12 ' : ''}${roi >= 0 ? '+' : ''}${roi}%</div></div>
          </div>
          <div style="margin-bottom:1.2rem">
            <div style="font-size:.5rem;font-weight:900;letter-spacing:2px;color:#6b7280;margin-bottom:8px">SIGNAL LEVELS</div>
            <div class="sdw-tp" style="background:rgba(22,163,74,.12);border:1px solid rgba(22,163,74,.2)"><span style="color:#16a34a;font-weight:900;min-width:36px">TP2</span><span style="color:#6b7280">+10%</span><span style="margin-left:auto;color:#16a34a;font-family:monospace">${tp2px}</span></div>
            <div class="sdw-tp" style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.15)"><span style="color:#22c55e;font-weight:900;min-width:36px">TP1</span><span style="color:#6b7280">+5%</span><span style="margin-left:auto;color:#22c55e;font-family:monospace">${tp1px}</span></div>
            <div class="sdw-tp" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.15)"><span style="color:#ef4444;font-weight:900;min-width:36px">SL</span><span style="color:#6b7280">-3%</span><span style="margin-left:auto;color:#ef4444;font-family:monospace">${slpx}</span></div>
          </div>
          ${thesisHtml}
          <div style="margin-bottom:1.5rem">
            <div style="font-size:.5rem;font-weight:900;letter-spacing:2px;color:#6b7280;margin-bottom:8px">METADATA</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.7rem;color:#94a3b8">
              <div><span style="opacity:.6">GENERATED</span><br><b style="color:#e2e8f0">${tsStr} UTC</b></div>
              <div><span style="opacity:.6">AGE</span><br><b style="color:#e2e8f0">${s.age_days != null ? s.age_days + ' days' : '-'}</b></div>
              <div><span style="opacity:.6">SEVERITY</span><br><b style="color:#e2e8f0">${(s.severity||'').toUpperCase()}</b></div>
              ${metaClosed}
            </div>
          </div>
          ${actionHtml}
        `;
        drawer.classList.add('open');
        document.getElementById('sig-drawer-overlay')?.classList.add('open');
    };

"""

if INJECT_MARKER in ar and '_initDrawer' not in ar:
    ar = ar.replace(INJECT_MARKER, DRAWER + INJECT_MARKER, 1)
    print('OK: drawer injected')
elif '_initDrawer' in ar:
    print('INFO: drawer already injected')
else:
    print('ERROR: apply-filters marker not found')

pathlib.Path('js/views/liquidity-archive.js').write_text(ar, encoding='utf-8')
print(f'DONE: archive written ({len(ar)} bytes)')
