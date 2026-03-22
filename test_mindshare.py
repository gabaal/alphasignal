import requests
import json

try:
    cookies = {"sb-access-token": "test-token-premium"}
    r = requests.get("http://127.0.0.1:8006/api/mindshare", cookies=cookies, timeout=10)
    if r.status_code == 200:
        data = r.json()
        print(f"Received {len(data)} records")
        for item in data:
            print(f"Ticker: {item.get('ticker')}, Narrative: {item.get('narrative')}, Engineer: {item.get('engineer')}")
    else:
        print(f"Error: {r.status_code}")
except Exception as e:
    print(f"Failed: {e}")
