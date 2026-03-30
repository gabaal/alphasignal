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
            self.send_json(rows or [])
        except Exception as e:
            self.send_json({'error': str(e)})

    def handle_watchlist_post(self, auth_info, data):
        try:
            ticker = (data.get('ticker') or '').upper().strip()
            if not ticker:
                return self.send_json({'error': 'ticker required'})
            user_id = auth_info['user_id']
            payload = {
                'user_id': user_id,
                'ticker': ticker,
                'target_price': data.get('target_price'),
                'note': data.get('note', ''),
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
