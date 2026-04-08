import pathlib

p = pathlib.Path('index.html')
c = p.read_text(encoding='utf-8')

INLINE = """    <!-- Global helpers: defined inline so service-worker/version caching never breaks them -->
    <script>
    window.addToWatchlist_quick = window.addToWatchlist_quick || async function(ticker) {
        if (!ticker) return;
        try {
            const res = await fetchAPI('/watchlist', 'POST', { ticker: ticker.toUpperCase(), note: 'Quick add from signal feed' });
            if (res && res.success) {
                showToast('WATCHLIST', ticker.toUpperCase() + ' added to your watchlist', 'success');
            } else {
                showToast('WATCHLIST', res && res.error ? res.error : 'Could not add ' + ticker, 'warning');
            }
        } catch(e) {
            showToast('ERROR', 'Watchlist add failed: ' + e.message, 'alert');
        }
    };
    </script>
"""

TARGET = '    <script src="js/views/signals.js?v=2.37" defer></script>'

if 'window.addToWatchlist_quick' not in c:
    c = c.replace(TARGET, INLINE + TARGET)
    p.write_text(c, encoding='utf-8')
    print('OK: inline script added before signals.js')
else:
    print('INFO: already present in index.html')
