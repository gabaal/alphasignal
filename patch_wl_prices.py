import pathlib

p = pathlib.Path('backend/routes/personal.py')
c = p.read_text(encoding='utf-8')

OLD = '''            try:
                from backend.routes.institutional import InstitutionalRoutesMixin as _IRM
                import time as _time
                _cache = _IRM._price_cache
                _ttl   = _IRM._PRICE_CACHE_TTL
                _now   = _time.time()
                for item in items:
                    t = (item.get('ticker') or '').upper()
                    # Try as stored, then try with -USD appended (crypto), then try without -USD (equity)
                    candidates = [t]
                    if t.endswith('-USD'): candidates.append(t[:-4])
                    else:                  candidates.append(t + '-USD')
                    for sym in candidates:
                        entry = _cache.get(sym)
                        if entry and (_now - entry.get('ts', 0)) < _ttl * 3:  # 3x TTL tolerance
                            item['live_price'] = entry.get('price')
                            break
            except Exception:
                pass  # Non-blocking — items still returned without live_price'''

NEW = '''            try:
                from backend.routes.institutional import InstitutionalRoutesMixin as _IRM
                import time as _time
                import yfinance as _yf
                _cache = _IRM._price_cache
                _ttl   = _IRM._PRICE_CACHE_TTL
                _now   = _time.time()
                for item in items:
                    t = (item.get('ticker') or '').upper()
                    # 1) Check price cache (crypto universe tickers - fast, in-memory)
                    candidates = [t]
                    if t.endswith('-USD'): candidates.append(t[:-4])
                    else:                  candidates.append(t + '-USD')
                    found = False
                    for sym in candidates:
                        entry = _cache.get(sym)
                        if entry and (_now - entry.get('ts', 0)) < _ttl * 3:
                            item['live_price'] = entry.get('price')
                            found = True
                            break
                    # 2) Cache miss fallback: yfinance fast_info (handles equities like RIOT, WULF)
                    if not found:
                        for sym in candidates:
                            try:
                                info = _yf.Ticker(sym).fast_info
                                px = info.get('last_price') or info.get('lastPrice') or info.get('regularMarketPrice')
                                if px and float(px) > 0:
                                    item['live_price'] = round(float(px), 8)
                                    break
                            except Exception:
                                continue
            except Exception:
                pass  # Non-blocking — items still returned without live_price'''

if OLD in c:
    c = c.replace(OLD, NEW)
    p.write_text(c, encoding='utf-8')
    print('OK: yfinance fallback added to handle_watchlist_get')
else:
    print('ERROR: target block not found')
    # Show what's there
    idx = c.find('_cache = _IRM._price_cache')
    print('Context:', repr(c[max(0,idx-50):idx+100]))
