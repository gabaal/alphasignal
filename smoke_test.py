import requests, json

tests = [
    ('Sectors (CoinGecko)',           'http://127.0.0.1:8006/api/sectors'),
    ('System Dials (Alternative.me)', 'http://127.0.0.1:8006/api/dials'),
    ('Trade Tape (Binance)',           'http://127.0.0.1:8006/api/tape?ticker=BTC-USD'),
    ('TVL (DefiLlama)',               'http://127.0.0.1:8006/api/tvl'),
    ('Correlation Matrix',            'http://127.0.0.1:8006/api/correlation-matrix'),
    ('Factor Web',                    'http://127.0.0.1:8006/api/factor-web?ticker=BTC-USD'),
    ('Execution Time Heatmap',        'http://127.0.0.1:8006/api/execution-time?ticker=BTC-USD'),
    ('Vol Surface (Deribit)',         'http://127.0.0.1:8006/api/volatility-surface?ticker=BTC-USD'),
    ('Funding Rate History',          'http://127.0.0.1:8006/api/funding-history?ticker=BTC-USD'),
    ('Wallet Attribution',            'http://127.0.0.1:8006/api/wallet-attribution?ticker=BTC-USD'),
    ('Sankey (Blockchain.info)',       'http://127.0.0.1:8006/api/sankey'),
]

print('\n=== AlphaSignal Real Data Smoke Tests ===\n')
all_ok = True
for name, url in tests:
    try:
        r = requests.get(url, timeout=20)
        data = r.json()
        source = data.get('source', data.get('_source', ''))
        if isinstance(data, list):
            source = data[0].get('source', 'list') if data else 'empty'
        status = 'OK' if r.status_code == 200 else f'HTTP {r.status_code}'
        print(f'  [{status}] {name}')
        print(f'         source={source!r}')
        if isinstance(data, dict):
            print(f'         keys={list(data.keys())[:6]}')
        else:
            print(f'         items={len(data)}')
        print()
    except Exception as e:
        all_ok = False
        print(f'  [FAIL] {name}: {e}\n')

print('=== Done ===')
