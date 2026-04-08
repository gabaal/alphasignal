import pathlib

# ─── 1. my-terminal.js: add edit button + inline form + save/cancel functions ─
p = pathlib.Path('js/views/my-terminal.js')
c = p.read_text(encoding='utf-8')

# 1a. Add edit button next to the monitoring button, and add hidden inline edit row
OLD_BTNS = '''            <div style="display:flex;gap:6px;flex-shrink:0">
                <button onclick="openDetail('${item.ticker}','WATCHLIST')" title="View chart" aria-label="View ${item.ticker} chart"
                    style="background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.2);color:var(--accent);padding:6px 8px;border-radius:8px;cursor:pointer">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">monitoring</span>
                </button>
                <button onclick="removeWatchlistItem(${item.id})" aria-label="Remove ${item.ticker} from watchlist"
                    style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.7rem">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">delete</span>
                </button>
            </div>
        </div>`;'''

NEW_BTNS = '''            <div style="display:flex;gap:6px;flex-shrink:0">
                <button onclick="openDetail('${item.ticker}','WATCHLIST')" title="View chart" aria-label="View ${item.ticker} chart"
                    style="background:rgba(0,242,255,0.08);border:1px solid rgba(0,242,255,0.2);color:var(--accent);padding:6px 8px;border-radius:8px;cursor:pointer">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">monitoring</span>
                </button>
                <button onclick="toggleWatchlistEdit(${item.id})" title="Set target price" aria-label="Edit ${item.ticker} target"
                    style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#f59e0b;padding:6px 8px;border-radius:8px;cursor:pointer">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">edit</span>
                </button>
                <button onclick="removeWatchlistItem(${item.id})" aria-label="Remove ${item.ticker} from watchlist"
                    style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.7rem">
                    <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle">delete</span>
                </button>
            </div>
        </div>
        <!-- Inline edit row (hidden until pencil clicked) -->
        <div id="wl-edit-${item.id}" style="display:none;padding:0.75rem 1rem 0.75rem;border-top:1px solid rgba(245,158,11,0.15);background:rgba(245,158,11,0.04);margin-top:0">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <div style="font-size:0.55rem;color:#f59e0b;letter-spacing:1.5px;font-weight:700;flex-basis:100%;margin-bottom:4px">SET TARGET PRICE</div>
                <input id="wl-edit-target-${item.id}" type="number" step="any" placeholder="Target price"
                    value="${item.target_price || ''}"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(245,158,11,0.3);color:var(--text);padding:6px 10px;border-radius:8px;font-size:0.8rem;width:150px">
                <input id="wl-edit-note-${item.id}" type="text" placeholder="Note (optional)" maxlength="120"
                    value="${(item.note || '').replace(/Quick add from signal feed/g,'').trim()}"
                    style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--text);padding:6px 10px;border-radius:8px;font-size:0.8rem;flex:1;min-width:120px">
                <button onclick="saveWatchlistEdit(${item.id})"
                    style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#f59e0b;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.7rem;font-weight:700;letter-spacing:1px">SAVE</button>
                <button onclick="toggleWatchlistEdit(${item.id})"
                    style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--text-dim);padding:6px 10px;border-radius:8px;cursor:pointer;font-size:0.7rem">CANCEL</button>
            </div>
        </div>\`;'''

if OLD_BTNS in c:
    c = c.replace(OLD_BTNS, NEW_BTNS)
    print('OK: edit button + inline form added')
else:
    print('ERROR: button block not found')

# 1b. Add toggle + save functions before window.addToWatchlist
INJECT_BEFORE = 'window.addToWatchlist = async function()'

EDIT_FNS = '''window.toggleWatchlistEdit = function(id) {
    const panel = document.getElementById('wl-edit-' + id);
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        document.getElementById('wl-edit-target-' + id)?.focus();
    }
};

window.saveWatchlistEdit = async function(id) {
    const target = document.getElementById('wl-edit-target-' + id)?.value;
    const note   = document.getElementById('wl-edit-note-'   + id)?.value?.trim();
    try {
        const res = await fetchAPI('/watchlist/' + id, 'PATCH', {
            target_price: target ? parseFloat(target) : null,
            note: note || ''
        });
        if (res && res.success) {
            showToast('WATCHLIST', 'Target updated', 'success');
            const el = document.getElementById('my-terminal-content');
            if (el) await renderWatchlistTab(el);
        } else {
            showToast('ERROR', (res && res.error) || 'Update failed', 'alert');
        }
    } catch(e) {
        showToast('ERROR', e.message, 'alert');
    }
};

'''

if INJECT_BEFORE in c and 'saveWatchlistEdit' not in c:
    c = c.replace(INJECT_BEFORE, EDIT_FNS + INJECT_BEFORE)
    print('OK: edit/save functions injected')
else:
    print('WARN: injection skipped (already present or marker not found)')

pathlib.Path('js/views/my-terminal.js').write_text(c, encoding='utf-8')
print('my-terminal.js written')

# ─── 2. personal.py: add PATCH handler ────────────────────────────────────────
p2 = pathlib.Path('backend/routes/personal.py')
c2 = p2.read_text(encoding='utf-8')

PATCH_FN = '''
    def handle_watchlist_patch(self, auth_info, item_id, data):
        """PATCH /api/watchlist/{id} - update target_price and/or note for an existing item."""
        try:
            user_id = auth_info['user_id']
            payload = {}
            if 'target_price' in data:
                payload['target_price'] = data['target_price']  # may be None to clear
            if 'note' in data:
                payload['note'] = (data['note'] or '').strip()
            if not payload:
                return self.send_json({'error': 'nothing to update'})
            url = f"{SUPABASE_URL}/rest/v1/watchlist?id=eq.{item_id}&user_id=eq.{user_id}"
            headers = {**SUPABASE_HEADERS, 'Prefer': 'return=representation'}
            r = requests.patch(url, headers=headers, json=payload, timeout=5)
            result = r.json() if r.text else []
            self.send_json({'success': r.status_code in [200, 201], 'item': result[0] if isinstance(result, list) and result else payload})
        except Exception as e:
            self.send_json({'error': str(e)})

'''

INJECT_BEFORE_PATCH = '    def handle_watchlist_delete('
if INJECT_BEFORE_PATCH in c2 and 'handle_watchlist_patch' not in c2:
    c2 = c2.replace(INJECT_BEFORE_PATCH, PATCH_FN + INJECT_BEFORE_PATCH)
    p2.write_text(c2, encoding='utf-8')
    print('OK: PATCH handler added to personal.py')
else:
    print('WARN: PATCH handler already present or marker not found')
