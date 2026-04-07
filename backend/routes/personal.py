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
            # Enrich each item with the current live price from the in-memory price cache.
            # This means the frontend doesn't need window.livePrices to be pre-populated
            # (e.g. when the user navigates directly to My Terminal).
            try:
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
                pass  # Non-blocking — items still returned without live_price
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
                        px = info.get('last_price') or info.get('lastPrice') or info.get('regularMarketPrice')
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
