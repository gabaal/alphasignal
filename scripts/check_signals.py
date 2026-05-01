import urllib.request, json, urllib.error
url = 'http://localhost:8006/api/signal-history?days=30&page=1&limit=5'
req = urllib.request.Request(url, headers={'Origin': 'http://localhost:8006'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        body = r.read().decode()
        print('Status:', r.status)
        print('Response body preview:', body[:500])
        data = json.loads(body)
        print('Total:', data.get('pagination', {}).get('total', '?'))
        print('Data:', len(data.get('data', [])), 'rows')
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.reason)
    print('Body:', e.read().decode())
except Exception as e:
    print('Error:', type(e).__name__, e)
