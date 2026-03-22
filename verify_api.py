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
            # print("Response structure: ", list(data.keys()))
            return data
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Connection failed: {e}")
    return None

if __name__ == "__main__":
    # 1. Test Correlation Matrix
    tickers = "BTC-USD,ETH-USD,SOL-USD,MARA,COIN"
    corr = test_endpoint(f"/correlation?tickers={tickers}&period=60d")
    if corr and 'matrix' in corr:
        matrix = corr['matrix']
        print(f"Matrix size: {len(matrix)}x{len(matrix[0])}")
        non_zero = sum(1 for row in matrix for val in row if val != 0 and val != 1.0)
        print(f"Non-zero off-diagonal correlations: {non_zero}")
        if non_zero > 0:
            print("SUCCESS: Correlation matrix is populating with non-zero values.")
        else:
            print("FAILURE: Correlation matrix is still all zeros.")

    # 2. Test Narrative Clusters (Verify filtering still works)
    clusters = test_endpoint("/narrative-clusters?chain=SOL")
    if clusters:
        tickers_sol = [c['ticker'] for c in clusters.get('clusters', [])]
        print(f"Tickers in SOL cluster view: {tickers_sol[:5]}")
