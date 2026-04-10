from backend.database import get_db_connection
import json, urllib.parse
from datetime import datetime
from backend.database import SupabaseClient, SUPABASE_URL, SUPABASE_HEADERS
import requests

class PersonalRoutesMixin:
    """Handles /api/watchlist and /api/positions — stored in Supabase, per user_id."""

    # ── WATCHLIST ──────────────────────────────────────────────
    def handle_watchlist_get(self, auth_info):
        try:
            user_id = auth_info['user_id']
            rows = SupabaseClient.query('watchlist', filters=f'user_id=eq.{user_id}&order=added_at.desc')
            items = rows or []

            # ── Pass 1: price cache lookup (fast, in-memory, always safe) ──────
            missing = []   # items that still need a live price after cache lookup
            _IRM = None
            try:
                from backend.routes.institutional import InstitutionalRoutesMixin as _IRM
                import time as _time
                _cache = _IRM._price_cache
                _ttl   = _IRM._PRICE_CACHE_TTL
                _now   = _time.time()
                for item in items:
                    t = (item.get('ticker') or '').upper()
                    candidates = [t, t[:-4] if t.endswith('-USD') else t + '-USD']
                    found = False
                    for sym in candidates:
                        entry = _cache.get(sym)
                        if entry and (_now - entry.get('ts', 0)) < _ttl * 3:
                            item['live_price'] = entry.get('price')
                            found = True
                            break
                    if not found:
                        missing.append(item)
            except Exception:
                missing = list(items)  # cache unavailable — enrich all via yfinance

            # ── Pass 2: yfinance batch download for cache-miss tickers ──────────
            # Use yf.download() (one HTTP request for N tickers, ~2s) instead of
            # per-ticker fast_info calls which take ~6s each and would always
            # exceed the old 4-second timeout.
            if missing:
                try:
                    import yfinance as _yf
                    import time as _time2

                    # Build the set of yfinance symbols to fetch.
                    # Equities (RIOT, SMCI, VIRT…) use plain ticker;
                    # crypto (ETH, BTC…) need the -USD suffix.
                    sym_map = {}  # yf_sym -> [item, ...]
                    for item in missing:
                        t = (item.get('ticker') or '').upper()
                        # Prefer -USD for potential crypto tickers; we'll fall
                        # back to the plain ticker if -USD returns nothing.
                        for candidate in ([t] if t.endswith('-USD') else [t, t + '-USD']):
                            sym_map.setdefault(candidate, []).append(item)

                    unique_syms = list(sym_map.keys())
                    if unique_syms:
                        df = _yf.download(
                            unique_syms,
                            period='1d',
                            interval='1m',
                            progress=False,
                            auto_adjust=True,
                            threads=True,
                        )
                        # yf.download returns MultiIndex columns when >1 ticker
                        close_prices = {}
                        if df is not None and not df.empty:
                            import pandas as _pd
                            if isinstance(df.columns, _pd.MultiIndex):
                                close_df = df.xs('Close', axis=1, level=0) if 'Close' in df.columns.get_level_values(0) else None
                                if close_df is not None:
                                    for sym in close_df.columns:
                                        last = close_df[sym].dropna()
                                        if not last.empty and float(last.iloc[-1]) > 0:
                                            close_prices[sym] = round(float(last.iloc[-1]), 8)
                            elif 'Close' in df.columns:
                                # Single ticker — flat columns
                                last = df['Close'].dropna()
                                if not last.empty and len(unique_syms) == 1:
                                    close_prices[unique_syms[0]] = round(float(last.iloc[-1]), 8)

                        _now2 = _time2.time()
                        for sym, affected_items in sym_map.items():
                            px = close_prices.get(sym)
                            if not px:
                                continue
                            for item in affected_items:
                                # Only set if not already populated by a prior candidate
                                if not item.get('live_price'):
                                    item['live_price'] = px
                            # Write-back to shared institutional price cache
                            if _IRM is not None:
                                _IRM._price_cache[sym] = {'price': px, 'ts': _now2}
                except Exception:
                    pass  # yfinance unavailable — items returned without live_price

            self.send_json(items)
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_watchlist_post(self, auth_info, data):
        try:
            ticker = (data.get('ticker') or '').upper().strip()
            if not ticker:
                return self.send_json({'error': 'ticker required'})
            user_id = auth_info['user_id']

            # Fetch live price at time of add - stored for SINCE ADDED performance tracking
            price_at_add = None
            try:
                import yfinance as yf
                # Try the ticker as-is first (handles equities: WULF, VIRT, TSLA)
                # then try with -USD suffix (handles crypto: BTC-USD, ETH-USD)
                candidates = [ticker]
                if ticker.endswith('-USD'): candidates.append(ticker[:-4])
                else:                       candidates.append(ticker + '-USD')
                for sym in candidates:
                    try:
                        info = yf.Ticker(sym).fast_info
                        px = (getattr(info,'last_price',None) or getattr(info,'regular_market_price',None) or getattr(info,'previous_close',None))
                        if px and float(px) > 0:
                            price_at_add = round(float(px), 8)
                            break
                    except Exception:
                        continue
            except Exception:
                pass  # Non-blocking - watchlist still saves, just without entry price

            payload = {
                'user_id': user_id,
                'ticker': ticker,
                'target_price': data.get('target_price'),
                'note': data.get('note', ''),
                'price_at_add': price_at_add,
                'added_at': datetime.utcnow().isoformat()
            }
            # Upsert — update note/target if ticker already exists for this user
            url = f"{SUPABASE_URL}/rest/v1/watchlist"
            headers = {**SUPABASE_HEADERS, 'Prefer': 'return=representation,resolution=merge-duplicates'}
            r = requests.post(url, headers=headers, json=payload, timeout=5)
            result = r.json() if r.text else []
            self.send_json({'success': True, 'item': result[0] if isinstance(result, list) and result else payload})
        except Exception as e:
            self.send_json({'error': str(e)})



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

    def handle_watchlist_delete(self, auth_info, item_id):
        try:
            user_id = auth_info['user_id']
            url = f"{SUPABASE_URL}/rest/v1/watchlist?id=eq.{item_id}&user_id=eq.{user_id}"
            r = requests.delete(url, headers=SUPABASE_HEADERS, timeout=5)
            self.send_json({'success': r.status_code in [200, 204]})
        except Exception as e:
            self.send_json({'error': str(e)})

    # ── POSITIONS ──────────────────────────────────────────────
    def handle_positions_get(self, auth_info):
        try:
            user_id = auth_info['user_id']
            rows = SupabaseClient.query('positions', filters=f'user_id=eq.{user_id}&order=opened_at.desc')
            self.send_json(rows or [])
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_positions_post(self, auth_info, data):
        try:
            ticker = (data.get('ticker') or '').upper().strip()
            qty    = float(data.get('qty') or 0)
            entry  = float(data.get('entry_price') or 0)
            if not ticker or qty <= 0 or entry <= 0:
                return self.send_json({'error': 'ticker, qty and entry_price required'})
            user_id = auth_info['user_id']
            payload = {
                'user_id': user_id,
                'ticker': ticker,
                'side': data.get('side', 'LONG').upper(),
                'qty': qty,
                'entry_price': entry,
                'target_price': data.get('target_price'),
                'stop_price': data.get('stop_price'),
                'notes': data.get('notes', ''),
                'opened_at': datetime.utcnow().isoformat()
            }
            url = f"{SUPABASE_URL}/rest/v1/positions"
            headers = {**SUPABASE_HEADERS, 'Prefer': 'return=representation'}
            r = requests.post(url, headers=headers, json=payload, timeout=5)
            result = r.json() if r.text else []
            self.send_json({'success': True, 'item': result[0] if isinstance(result, list) and result else payload})
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_positions_delete(self, auth_info, item_id):
        try:
            user_id = auth_info['user_id']
            url = f"{SUPABASE_URL}/rest/v1/positions?id=eq.{item_id}&user_id=eq.{user_id}"
            r = requests.delete(url, headers=SUPABASE_HEADERS, timeout=5)
            self.send_json({'success': r.status_code in [200, 204]})
        except Exception as e:
            self.send_json({'error': str(e)})

    # ── INTEGRATIONS ──────────────────────────────────────────
    def handle_exchange_keys_get(self, auth_info):
        try:
            import sqlite3
            from backend.database import DB_PATH
            user_email = auth_info['email']
            conn = get_db_connection()
            c = conn.cursor()
            c.execute('SELECT id, exchange, api_key, created_at FROM exchange_keys WHERE user_email = ?', (user_email,))
            rows = c.fetchall()
            conn.close()
            keys = [{'id': r[0], 'exchange': r[1], 'api_key': r[2][:4] + '****' + r[2][-4:] if len(r[2]) > 8 else '****', 'created_at': r[3]} for r in rows]
            self.send_json(keys)
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_exchange_keys_post(self, auth_info, data):
        try:
            import sqlite3
            from backend.database import DB_PATH
            user_email = auth_info['email']
            exchange = data.get('exchange', '').upper()
            api_key = data.get('api_key', '')
            api_secret = data.get('api_secret', '')
            if not exchange or not api_key or not api_secret:
                return self.send_json({'error': 'exchange, api_key, and api_secret are required'})

            conn = get_db_connection()
            c = conn.cursor()
            c.execute('''INSERT OR REPLACE INTO exchange_keys (user_email, exchange, api_key, api_secret) VALUES (?, ?, ?, ?)''',
                      (user_email, exchange, api_key, api_secret))
            conn.commit()
            conn.close()
            self.send_json({'success': True})
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_exchange_keys_delete(self, auth_info, item_id):
        try:
            import sqlite3
            from backend.database import DB_PATH
            user_email = auth_info['email']
            conn = get_db_connection()
            c = conn.cursor()
            c.execute('DELETE FROM exchange_keys WHERE id = ? AND user_email = ?', (item_id, user_email))
            conn.commit()
            conn.close()
            self.send_json({'success': True})
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_execute_trade(self, auth_info, data):
        try:
            import sqlite3
            from backend.database import DB_PATH
            user_email = auth_info['email']
            ticker = data.get('ticker')
            action = data.get('action', 'BUY').upper()
            qty_or_size = data.get('size', '10%') # simulated

            # Validate they have at least one exchange key
            conn = get_db_connection()
            c = conn.cursor()
            c.execute('SELECT id FROM exchange_keys WHERE user_email = ? LIMIT 1', (user_email,))
            has_key = c.fetchone()
            if not has_key:
                conn.close()
                return self.send_json({'error': 'No Exchange API keys configured. Please add one in Integrations.'})

            # Insert simulated trade into trade_ledger
            c.execute('''INSERT INTO trade_ledger (user_email, ticker, action, price, target, stop, rr, slippage)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                      (user_email, ticker, f"{action} ({qty_or_size}) [API]", 0.0, 0.0, 0.0, 0.0, 0.0))
            conn.commit()
            conn.close()
            self.send_json({'success': True, 'message': f'Trade {action} {ticker} executed and logged.'})
        except Exception as e:
            self.send_json({'error': str(e)})
