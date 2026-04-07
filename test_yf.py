import yfinance as yf

# Test the exact tickers from the table
test_tickers = ['VIRT', 'XRP-USD', 'SOL-USD', 'WLD-USD', 'WULF']
yf_map = {t: (t if '-' in t else t + '-USD') for t in test_tickers}
print("yf_map:", yf_map)

for orig, sym in yf_map.items():
    try:
        t = yf.Ticker(sym)
        price = t.fast_info.get('last_price') or t.fast_info.get('lastPrice')
        print(f"{orig} ({sym}): {price}")
    except Exception as e:
        print(f"{orig} ({sym}): ERROR {e}")
