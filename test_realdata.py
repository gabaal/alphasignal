"""Direct test of realdata.py functions — bypasses the HTTP auth layer."""
import sys
sys.path.insert(0, r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal')

from backend.routes.realdata import (
    fetch_fear_greed, fetch_network_congestion, fetch_retail_fomo,
    fetch_defi_llama_chains, fetch_coingecko_categories, fetch_binance_trades,
    fetch_volume_by_hour, fetch_funding_rate_history, fetch_deribit_iv,
    fetch_github_commits, fetch_binance_klines
)

print('\n=== realdata.py direct function tests ===\n')

def test(name, fn, *args):
    try:
        result = fn(*args)
        if isinstance(result, list):
            preview = f'list[{len(result)}] first={str(result[0])[:80]}' if result else 'empty list'
        elif isinstance(result, dict):
            src = result.get('source', result.get('_source', ''))
            preview = f'source={src!r} keys={list(result.keys())[:5]}'
        else:
            preview = repr(result)[:100]
        print(f'  [OK] {name}')
        print(f'       {preview}\n')
    except Exception as e:
        print(f'  [FAIL] {name}: {e}\n')

test('Fear & Greed (Alternative.me)',  fetch_fear_greed)
test('Network Congestion (Blockchain)', fetch_network_congestion)
test('Retail FOMO (pytrends)',          fetch_retail_fomo, 'Bitcoin')
test('DefiLlama chains',               fetch_defi_llama_chains)
test('CoinGecko categories',           fetch_coingecko_categories)
test('Binance trades (BTCUSDT)',        fetch_binance_trades, 'BTCUSDT', 10)
test('Volume by hour (BTCUSDT)',       fetch_volume_by_hour, 'BTCUSDT')
test('Funding rate history (BTC)',     fetch_funding_rate_history, 'BTCUSDT', 30)
test('Deribit IV (BTC)',               fetch_deribit_iv, 'BTC')
test('GitHub commits (ETH)',           fetch_github_commits, 'ETH')
test('Binance klines (BTCUSDT 5m)',   fetch_binance_klines, 'BTCUSDT', '5m', 10)

print('=== Done ===')
