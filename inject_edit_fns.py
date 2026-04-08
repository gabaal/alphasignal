import pathlib
p = pathlib.Path('js/views/my-terminal.js')
c = p.read_text(encoding='utf-8')

MARKER = 'window.addToWatchlist = async function() {'

FNS = """window.toggleWatchlistEdit = function(id) {
    const panel = document.getElementById('wl-edit-' + id);
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) document.getElementById('wl-edit-target-' + id)?.focus();
};

window.saveWatchlistEdit = async function(id) {
    const targetEl = document.getElementById('wl-edit-target-' + id);
    const noteEl   = document.getElementById('wl-edit-note-'   + id);
    const target   = targetEl ? targetEl.value : '';
    const note     = noteEl   ? noteEl.value.trim() : '';
    try {
        const res = await fetchAPI('/watchlist/' + id, 'PATCH', {
            target_price: target ? parseFloat(target) : null,
            note: note || ''
        });
        if (res && res.success) {
            showToast('WATCHLIST', 'Target price saved', 'success');
            const el = document.getElementById('my-terminal-content');
            if (el) await renderWatchlistTab(el);
        } else {
            showToast('ERROR', (res && res.error) || 'Update failed', 'alert');
        }
    } catch(e) { showToast('ERROR', e.message, 'alert'); }
};

"""

if 'window.toggleWatchlistEdit' not in c:
    c = c.replace(MARKER, FNS + MARKER, 1)
    p.write_text(c, encoding='utf-8')
    print('OK: functions injected. Verify:', 'window.toggleWatchlistEdit' in c, 'window.saveWatchlistEdit' in c)
else:
    print('Already present (window. prefix)')
