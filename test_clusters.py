import requests
import json

try:
    cookies = {"sb-access-token": "test-token-premium"}
    r = requests.get("http://127.0.0.1:8006/api/narrative-clusters", cookies=cookies, timeout=10)
    if r.status_code == 200:
        data = r.json()
        anchors = data.get('anchors', {})
        for key, val in anchors.items():
            print(f"Category: {key}, Color: {val.get('color')}")
        
        l1_color = anchors.get('L1', {}).get('color')
        ex_color = anchors.get('EXCHANGE', {}).get('color')
        
        if l1_color != ex_color:
            print("SUCCESS: L1 and EXCHANGE colors are different.")
        else:
            print("FAILURE: L1 and EXCHANGE colors are still the same!")
    else:
        print(f"Error: {r.status_code}")
except Exception as e:
    print(f"Failed: {e}")
