import requests
r = requests.get('http://localhost:8006/api/capital-rotation', timeout=30)
if r.ok:
    d = r.json()
    if 'error' in d:
        print('ERROR:', d['error'])
    else:
        for s in d.get('children', []):
            print(f"{s['name']:15} weight={s['value']:5.1f}%  perf={s['perf']:+.2f}%")
            for c in s.get('children', []):
                print(f"  {c['name']:13} weight={c['value']:5.1f}%  perf={c['perf']:+.2f}%")
else:
    print('HTTP', r.status_code, r.text[:200])
