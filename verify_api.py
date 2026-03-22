import requests
import json

BASE_URL = "http://127.0.0.1:8006/api"
HEADERS = {"Authorization": "Bearer test-token-premium"}

def test_endpoint(endpoint):
    print(f"Testing {endpoint}...")
    try:
        r = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print("Response structure: ", list(data.keys()))
            return data
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Connection failed: {e}")
    return None

if __name__ == "__main__":
    # 1. Test Narrative Clusters with Chain Filter
    clusters = test_endpoint("/narrative-clusters?chain=SOL")
    if clusters:
        tickers = [c['ticker'] for c in clusters.get('clusters', [])]
        print(f"Tickers in SOL cluster view: {tickers[:10]}")
    
    # 2. Test Chain Velocity
    velocity = test_endpoint("/chain-velocity")
    
    # 3. Test Alerts
    alerts = test_endpoint("/alerts")
    if alerts:
        print(f"Found {len(alerts)} alerts.")
        for a in alerts[:5]:
            print(f"- {a['type']}: {a.get('ticker','-')} - {a.get('title','-')}")
