import requests
import json

BASE_URL = "http://localhost:8006"

def test_premium_gating():
    print("--- Testing Premium Gating ---")
    
    # These should require premium (402)
    endpoints = ["/api/history", "/api/backtest"]
    
    for endpoint in endpoints:
        print(f"Testing {endpoint} (Public)...")
        # Public call (No auth) -> 401
        r = requests.get(f"{BASE_URL}{endpoint}")
        if r.status_code == 401:
            print(f"  [PASS] {endpoint} returned 401 as expected.")
        else:
            print(f"  [FAIL] {endpoint} returned {r.status_code}, expected 401.")

    print("\nTesting with Basic Auth (Non-premium)...")
    # Simulate a basic user session
    # We'll use the 'signup' to get a session or just mock the header if the server allows it
    # Currently main.py uses a session cookie 'session_id'
    
    # We need to log in first.
    login_payload = {"email": "user@example.com", "password": "password"}
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    if r.status_code == 200:
        print("  LoggedIn as basic user.")
        for endpoint in endpoints:
            r_p = s.get(f"{BASE_URL}{endpoint}?ticker=BTC-USD&strategy=trend_regime")
            if r_p.status_code == 402:
                print(f"  [PASS] {endpoint} returned 402 Payment Required.")
            else:
                print(f"  [FAIL] {endpoint} returned {r_p.status_code}, expected 402.")
    else:
        print(f"  [FAIL] Login failed: {r.status_code}")

def test_whale_intelligence():
    print("\n--- Testing Whale Intelligence ---")
    r = requests.get(f"{BASE_URL}/api/whales")
    if r.status_code == 200:
        data = r.json()
        print(f"  Received {len(data)} whale transactions.")
        assets = set(w.get('asset') for w in data)
        flows = set(w.get('flow') for w in data)
        print(f"  Assets found: {assets}")
        print(f"  Flows found: {flows}")
        
        if "ETH-USD" in assets or "SOL-USD" in assets:
            print("  [PASS] Multi-chain support confirmed.")
        else:
            print("  [FAIL] Only BTC found or no multi-chain data.")
            
        if "INFLOW" in flows or "OUTFLOW" in flows or "NEUTRAL" in flows:
            print("  [PASS] Flow labels confirmed.")
        else:
            print("  [FAIL] Flow labels missing.")
    else:
        print(f"  [FAIL] Whale API error: {r.status_code}")

if __name__ == "__main__":
    test_premium_gating()
    test_whale_intelligence()
