import urllib.request, json, http.cookiejar

# Hit the API directly - this simulates what the browser does without auth
req = urllib.request.Request("http://localhost:8006/api/signal-history?days=30&page=1&limit=25")
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read())
        print("Status:", resp.status)
        print("Data length:", len(data.get("data", [])))
        print("Summary:", data.get("summary"))
        print("Keys:", list(data.keys()))
except Exception as e:
    print("Error:", e)
