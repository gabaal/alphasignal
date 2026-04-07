"""
realdata.py — AlphaSignal Real Data Fetcher Layer
Centralises all external API calls that replaced synthetic/random data.
Every function has an in-process TTL cache so hot endpoints never hit rate limits.
"""
import time, requests, threading
import numpy as np

# ─── Thread-safe TTL Cache ────────────────────────────────────────────────────
_cache: dict = {}
_cache_lock = threading.Lock()

def _get(key):
    with _cache_lock:
        entry = _cache.get(key)
        if entry and (time.time() - entry['ts']) < entry['ttl']:
            return entry['data']
    return None

def _set(key, data, ttl=3600):
    with _cache_lock:
        _cache[key] = {'data': data, 'ts': time.time(), 'ttl': ttl}

# ─── Fear & Greed Index ───────────────────────────────────────────────────────
def fetch_fear_greed() -> dict:
    """Alternative.me Fear & Greed Index — cached 6h."""
    cached = _get('fear_greed')
    if cached is not None:
        return cached
    try:
        r = requests.get(
            'https://api.alternative.me/fng/?limit=30&format=json',
            timeout=6,
            headers={'User-Agent': 'AlphaSignal/2.0'}
        )
        if r.status_code == 200:
            data = r.json().get('data', [])
            result = {
                'value': int(data[0]['value']),
                'label': data[0]['value_classification'],
                'history': [{'value': int(d['value']), 'label': d['value_classification'],
                              'timestamp': d['timestamp']} for d in data],
                'source': 'alternative.me'
            }
            _set('fear_greed', result, ttl=21600)
            return result
    except Exception as e:
        print(f'[FearGreed/alternative.me] {e}')
    return {'value': 50, 'label': 'Neutral', 'history': [], 'source': 'fallback'}


# ─── Network Congestion (BTC mempool fee rate + tx count) ─────────────────────
def fetch_network_congestion() -> int:
    """
    0-100 composite congestion score — cached 5 min.
    Primary source: mempool.space (fee rates + mempool depth).
    Fallback:       blockchain.info unconfirmed tx count.

    Scoring model:
      fee_score  = log-scaled 1h-confirmation fee rate (sat/vbyte), capped at 200
                   1 sat/vb → ~13   20 sat/vb → ~57   100 sat/vb → ~87   200 sat/vb → 100
      count_score = linear, capped at 150k unconfirmed txs   (150k → 100)
      composite  = fee_score * 0.65 + count_score * 0.35
    """
    import math
    cached = _get('btc_congestion')
    if cached is not None:
        return cached

    try:
        # ── 1. Fee rates from mempool.space ──────────────────────────────────
        fee_r = requests.get(
            'https://mempool.space/api/v1/fees/recommended',
            timeout=5,
            headers={'Accept': 'application/json'}
        )
        # ── 2. Mempool depth (tx count + vsize) from mempool.space ───────────
        mem_r = requests.get(
            'https://mempool.space/api/mempool',
            timeout=5,
            headers={'Accept': 'application/json'}
        )

        if fee_r.status_code == 200 and mem_r.status_code == 200:
            fees = fee_r.json()
            mem  = mem_r.json()

            # Use 1-hour confirmation fee as the primary congestion signal
            # (represents what you need to pay to reliably confirm in ~1h)
            hour_fee = float(fees.get('hourFee', fees.get('halfHourFee', 5)))

            # Log-scale: 200 sat/vbyte = 100% congestion (Ordinals-era extreme)
            # log1p(200) ≈ 5.298 — anchors the top of the scale
            fee_score = min(100, int(math.log1p(hour_fee) / math.log1p(200) * 100))

            # Linear tx-count score capped at 150k txs
            tx_count   = int(mem.get('count', 0))
            count_score = min(100, int(tx_count / 1500))

            # Composite: fee rate carries 65% weight, tx count 35%
            score = int(fee_score * 0.65 + count_score * 0.35)
            score = max(0, min(100, score))

            print(f'[NetworkCongestion/mempool.space] hourFee={hour_fee} sat/vb '
                  f'txs={tx_count:,} → fee_score={fee_score} count_score={count_score} composite={score}')
            _set('btc_congestion', score, ttl=300)
            return score

    except Exception as e:
        print(f'[NetworkCongestion/mempool.space] {e}')

    # ── Fallback: blockchain.info tx count only ───────────────────────────────
    try:
        r = requests.get('https://blockchain.info/q/unconfirmedcount', timeout=4)
        if r.status_code == 200:
            unconf = int(r.text.strip())
            score = min(100, int(unconf / 1500))
            _set('btc_congestion', score, ttl=300)
            return score
    except Exception as e:
        print(f'[NetworkCongestion/blockchain.info] {e}')

    return 35  # conservative static fallback


# ─── Retail FOMO (Google Trends via pytrends) ─────────────────────────────────
def fetch_retail_fomo(keyword: str = 'Bitcoin') -> dict:
    """Google Trends interest 0-100 — cached 1h (Trends itself updates hourly).
    Returns {'value': int, 'source': 'google_trends' | 'fear_greed_fallback'}.
    Falls back to Fear & Greed if pytrends is rate-limited."""
    cache_key = f'fomo_{keyword}'
    cached = _get(cache_key)
    if cached is not None:
        return cached
    try:
        from pytrends.request import TrendReq
        pt = TrendReq(hl='en-US', tz=0, timeout=(4, 10))
        pt.build_payload([keyword], timeframe='now 7-d')
        df = pt.interest_over_time()
        if not df.empty and keyword in df.columns:
            weekly_avg = int(round(df[keyword].mean()))
            result = {'value': weekly_avg, 'source': 'google_trends'}
            _set(cache_key, result, ttl=3600)   # 1h — matches Google Trends update cadence
            return result
    except Exception as e:
        print(f'[FOMO/pytrends] {e}')
    # Fallback: derive from Fear & Greed index (cached separately at 6h)
    fg = fetch_fear_greed()
    result = {'value': fg['value'], 'source': 'fear_greed_fallback'}
    _set(cache_key, result, ttl=900)  # cache fallback 15min so it retries pytrends sooner
    return result


# ─── DefiLlama — TVL by Chain ─────────────────────────────────────────────────
def fetch_defi_llama_chains() -> list:
    """Returns list of {name, tvl} sorted by TVL — cached 1h."""
    cached = _get('defi_llama_chains')
    if cached is not None:
        return cached
    try:
        r = requests.get('https://api.llama.fi/chains', timeout=8,
                         headers={'Accept': 'application/json'})
        if r.status_code == 200:
            chains = r.json()
            # Sort by TVL descending, take top 12
            chains_sorted = sorted(
                [c for c in chains if c.get('tvl', 0) > 0],
                key=lambda x: x['tvl'],
                reverse=True
            )[:12]
            result = [{'name': c['name'], 'tvl': round(c['tvl'] / 1e9, 2)} for c in chains_sorted]
            _set('defi_llama_chains', result, ttl=3600)
            return result
    except Exception as e:
        print(f'[DefiLlama] {e}')
    # Static fallback (approximate order)
    return [
        {'name': 'Ethereum', 'tvl': 48.5}, {'name': 'Tron', 'tvl': 8.1},
        {'name': 'Solana', 'tvl': 6.2}, {'name': 'Arbitrum', 'tvl': 3.1},
        {'name': 'Base', 'tvl': 1.5}, {'name': 'Polygon', 'tvl': 1.1},
        {'name': 'Sui', 'tvl': 0.8}, {'name': 'Aptos', 'tvl': 0.4},
    ]


# ─── CoinGecko Categories (Sector Rotations) ──────────────────────────────────
def fetch_coingecko_categories() -> list:
    """Returns top 6 crypto categories with real market cap change — cached 1h."""
    cached = _get('cg_categories')
    if cached is not None:
        return cached
    try:
        r = requests.get(
            'https://api.coingecko.com/api/v3/coins/categories',
            params={'order': 'market_cap_desc'},
            timeout=10,
            headers={'Accept': 'application/json'}
        )
        if r.status_code == 200:
            cats = r.json()
            # Map CoinGecko category names to our sector labels
            name_map = {
                'Layer 1 (L1)': 'Layer-1s',
                'Decentralized Finance (DeFi)': 'DeFi',
                'Artificial Intelligence (AI)': 'AI/Compute',
                'Meme': 'Memecoins',
                'Gaming (GameFi)': 'Gaming',
                'Real World Assets (RWA)': 'RWA/Tokens',
                'Infrastructure': 'Infra',
                'Layer 2 (L2)': 'Layer-2s',
            }
            wanted = list(name_map.keys())
            result = []
            seen_labels = set()
            for cat in cats:
                label = name_map.get(cat.get('name', ''))
                if label and label not in seen_labels:
                    seen_labels.add(label)
                    result.append({
                        'name': label,
                        'value': round(cat.get('market_cap', 0) / 1e9, 1),  # $B
                        'perf': round(cat.get('market_cap_change_24h', 0), 2)
                    })
                if len(result) >= 6:
                    break
            if result:
                _set('cg_categories', result, ttl=3600)
                return result
    except Exception as e:
        print(f'[CoinGecko/categories] {e}')
    # Static fallback
    return [
        {'name': 'Layer-1s', 'value': 55.0, 'perf': 1.2},
        {'name': 'DeFi',     'value': 14.0, 'perf': -0.8},
        {'name': 'AI/Compute','value': 12.0, 'perf': 5.4},
        {'name': 'Memecoins', 'value': 9.0,  'perf': 12.1},
        {'name': 'Gaming',    'value': 6.0,  'perf': -2.3},
        {'name': 'RWA/Tokens','value': 4.0,  'perf': 0.5},
    ]


# ─── Binance REST — Live Trade Tape ──────────────────────────────────────────
def fetch_binance_trades(symbol: str = 'BTCUSDT', limit: int = 50) -> list:
    """Returns real recent trades from Binance spot — cached 5s."""
    cache_key = f'trades_{symbol}_{limit}'
    cached = _get(cache_key)
    if cached is not None:
        return cached
    try:
        r = requests.get(
            f'https://api.binance.com/api/v3/trades',
            params={'symbol': symbol, 'limit': limit},
            timeout=3
        )
        if r.status_code == 200:
            trades = r.json()
            _set(cache_key, trades, ttl=5)
            return trades
    except Exception as e:
        print(f'[BinanceTrades] {e}')
    return []


# ─── Binance FAPI — Funding Rate History ──────────────────────────────────────
def fetch_funding_rate_history(symbol: str = 'BTCUSDT', limit: int = 90) -> list:
    """Real 8h funding rate snapshots from Binance FAPI — cached 1h."""
    cache_key = f'funding_hist_{symbol}_{limit}'
    cached = _get(cache_key)
    if cached is not None:
        return cached
    try:
        r = requests.get(
            'https://fapi.binance.com/fapi/v1/fundingRate',
            params={'symbol': symbol, 'limit': limit},
            timeout=5
        )
        if r.status_code == 200:
            data = r.json()
            result = [
                {
                    'time': int(d['fundingTime']) // 1000,
                    'rate': round(float(d['fundingRate']) * 100, 4)
                }
                for d in data
            ]
            _set(cache_key, result, ttl=3600)
            return result
    except Exception as e:
        print(f'[FundingHistory/{symbol}] {e}')
    return []


# ─── Binance aggTrades — Volume by Hour ───────────────────────────────────────
def fetch_volume_by_hour(symbol: str = 'BTCUSDT') -> list:
    """24 slots of real traded USD volume bucketed by hour (last 24h) — cached 30min."""
    cache_key = f'vol_hour_{symbol}'
    cached = _get(cache_key)
    if cached is not None:
        return cached
    try:
        now_ms = int(time.time() * 1000)
        day_ago_ms = now_ms - 86400 * 1000
        volumes = [0.0] * 24

        # Use 1h klines which gives volume per hour natively
        r = requests.get(
            'https://api.binance.com/api/v3/klines',
            params={'symbol': symbol, 'interval': '1h', 'limit': 24},
            timeout=5
        )
        if r.status_code == 200:
            klines = r.json()
            for i, k in enumerate(klines):
                # k[5] = volume (base asset), k[7] = quote asset volume (USD)
                volumes[i] = round(float(k[7]) / 1e6, 2)  # USD millions
            labels = []
            for i, k in enumerate(klines):
                from datetime import datetime, timezone
                dt = datetime.fromtimestamp(k[0] / 1000, tz=timezone.utc)
                labels.append(f'{dt.hour:02d}:00')
            result = {'labels': labels, 'volumes': volumes, 'source': 'binance_klines'}
            _set(cache_key, result, ttl=1800)
            return result
    except Exception as e:
        print(f'[VolumeByHour/{symbol}] {e}')
    return {'labels': [f'{i:02d}:00' for i in range(24)], 'volumes': [0.0] * 24, 'source': 'fallback'}


# ─── Binance klines — OHLC Candle Fallback ────────────────────────────────────
def fetch_binance_klines(symbol: str = 'BTCUSDT', interval: str = '5m', limit: int = 48) -> list:
    """Real OHLCV candles via Binance REST — cached 60s."""
    cache_key = f'klines_{symbol}_{interval}_{limit}'
    cached = _get(cache_key)
    if cached is not None:
        return cached
    try:
        r = requests.get(
            'https://api.binance.com/api/v3/klines',
            params={'symbol': symbol, 'interval': interval, 'limit': limit},
            timeout=4
        )
        if r.status_code == 200:
            raw = r.json()
            candles = []
            for k in raw:
                ts = int(k[0]) // 1000
                from datetime import datetime
                candles.append({
                    'unix_time': ts,
                    'timestamp':  datetime.fromtimestamp(ts).isoformat(),
                    'time':  datetime.fromtimestamp(ts).strftime('%H:%M'),
                    'open':  float(k[1]),
                    'high':  float(k[2]),
                    'low':   float(k[3]),
                    'close': float(k[4]),
                    'price': float(k[4]),
                    'walls': []
                })
            _set(cache_key, candles, ttl=60)
            return candles
    except Exception as e:
        print(f'[BinanceKlines/{symbol}] {e}')
    return []


# ─── Deribit Public — Options IV Surface ─────────────────────────────────────
def fetch_deribit_iv(currency: str = 'BTC') -> dict:
    """Real implied volatility by expiry from Deribit public book — cached 10min."""
    cache_key = f'deribit_iv_{currency}'
    cached = _get(cache_key)
    if cached is not None:
        return cached
    try:
        r = requests.get(
            'https://www.deribit.com/api/v2/public/get_book_summary_by_currency',
            params={'currency': currency, 'kind': 'option'},
            timeout=8,
            headers={'Accept': 'application/json'}
        )
        if r.status_code == 200:
            data = r.json().get('result', [])
            # Group by expiry, find ATM options (bid_iv nearest to mark_iv)
            expiry_iv: dict = {}
            for opt in data:
                instr = opt.get('instrument_name', '')
                mark_iv = opt.get('mark_iv')
                if mark_iv is None or mark_iv <= 0:
                    continue
                # Instrument format: BTC-DDMMMYY-STRIKE-C/P
                parts = instr.split('-')
                if len(parts) < 4:
                    continue
                expiry_key = parts[1]  # e.g. "4APR25"
                if expiry_key not in expiry_iv:
                    expiry_iv[expiry_key] = []
                expiry_iv[expiry_key].append(float(mark_iv))

            if expiry_iv:
                # Sort expiries chronologically
                from datetime import datetime as _dt
                def parse_deribit_expiry(s):
                    try:
                        return _dt.strptime(s, '%d%b%y')
                    except:
                        return _dt.max
                sorted_expiries = sorted(expiry_iv.keys(), key=parse_deribit_expiry)[:6]
                expiry_labels = []
                atm_ivs = []
                skews = []
                for exp in sorted_expiries:
                    ivs = sorted(expiry_iv[exp])
                    median_iv = float(np.median(ivs))
                    skew_val = round(float(np.percentile(ivs, 75)) - float(np.percentile(ivs, 25)), 1)
                    # Map date to label like "7D", "14D"
                    try:
                        exp_dt = parse_deribit_expiry(exp)
                        days = max(1, (exp_dt - _dt.now()).days)
                        label = f'{days}D'
                    except:
                        label = exp
                    expiry_labels.append(label)
                    atm_ivs.append(round(median_iv, 1))
                    skews.append(skew_val)
                result = {'expiries': expiry_labels, 'atm_iv': atm_ivs, 'skew': skews, 'source': 'deribit'}
                _set(cache_key, result, ttl=600)
                return result
    except Exception as e:
        print(f'[Deribit/{currency}] {e}')
    return {'expiries': [], 'atm_iv': [], 'skew': [], 'source': 'unavailable'}


# ─── Deribit Public — Full IV Surface Grid ───────────────────────────────────
def fetch_deribit_iv_surface(currency: str = 'BTC') -> dict:
    """
    Returns a full implied-volatility surface as a (moneyness × expiry) grid.
    Moneyness bins: 0.70 → 1.30 in 20 steps (deep ITM put to deep OTM call).
    Expiry bins: the next 6 calendar expiries listed on Deribit.
    Cached 10 minutes.  Falls back to parametric smile on failure.
    """
    cache_key = f'deribit_surface_{currency}'
    cached = _get(cache_key)
    if cached is not None:
        return cached

    try:
        r = requests.get(
            'https://www.deribit.com/api/v2/public/get_book_summary_by_currency',
            params={'currency': currency, 'kind': 'option'},
            timeout=10,
            headers={'Accept': 'application/json'}
        )
        if r.status_code != 200:
            raise ValueError(f'Deribit HTTP {r.status_code}')

        data = r.json().get('result', [])
        if not data:
            raise ValueError('Empty Deribit response')

        from datetime import datetime as _dt
        now = _dt.utcnow()

        # Get underlying price (use first option that has it)
        underlying = None
        for opt in data:
            if opt.get('underlying_price'):
                underlying = float(opt['underlying_price'])
                break
        if not underlying or underlying <= 0:
            raise ValueError('No underlying price from Deribit')

        # ── Parse options into (expiry_dt, moneyness, iv) tuples ──────────────
        points = []
        for opt in data:
            iv = opt.get('mark_iv')
            if not iv or iv <= 0 or iv > 500:
                continue
            instr = opt.get('instrument_name', '')
            parts = instr.split('-')
            if len(parts) < 4:
                continue
            try:
                exp_dt = _dt.strptime(parts[1], '%d%b%y')
                strike = float(parts[2])
            except Exception:
                continue
            days = (exp_dt - now).days
            if days < 1 or days > 365:
                continue
            moneyness = round(strike / underlying, 4)
            points.append({'exp_dt': exp_dt, 'days': days, 'moneyness': moneyness, 'iv': float(iv)})

        if len(points) < 10:
            raise ValueError(f'Not enough option points: {len(points)}')

        # ── Choose the next 6 distinct expiry dates ───────────────────────────
        seen_expiries = sorted(set(p['exp_dt'] for p in points))[:6]
        expiry_labels = []
        for ed in seen_expiries:
            d = (ed - now).days
            expiry_labels.append(f'{d}D')

        # ── Define 20 moneyness buckets from 0.70 to 1.30 ───────────────────
        N_STRIKES = 20
        money_steps = [round(0.70 + i * (0.60 / (N_STRIKES - 1)), 4) for i in range(N_STRIKES)]

        # ── Build grid: for each (expiry, moneyness_bin) find median IV ───────
        TOLERANCE = 0.035  # ±3.5% moneyness bucket width
        grid = []          # list of N_STRIKES lists, each of len(expiries)
        for m in money_steps:
            row = []
            for exp_dt in seen_expiries:
                # Find matching recorded points
                candidates = [
                    p['iv'] for p in points
                    if p['exp_dt'] == exp_dt and abs(p['moneyness'] - m) <= TOLERANCE
                ]
                if candidates:
                    row.append(round(float(np.median(candidates)), 2))
                else:
                    row.append(None)  # gap — will interpolate below
            grid.append(row)

        # ── Interpolate gaps along the moneyness axis per expiry ─────────────
        for exp_idx in range(len(seen_expiries)):
            col = [grid[mi][exp_idx] for mi in range(N_STRIKES)]
            # Fill interior NaN with linear interpolation
            known_x = [i for i, v in enumerate(col) if v is not None]
            known_y = [col[i] for i in known_x]
            if len(known_x) < 2:
                # Fall back to ATM smile for this expiry
                for mi in range(N_STRIKES):
                    if grid[mi][exp_idx] is None:
                        atm_iv = np.median(known_y) if known_y else 60.0
                        smile = atm_iv * (1 + 0.5 * (money_steps[mi] - 1.0) ** 2)
                        grid[mi][exp_idx] = round(smile, 2)
            else:
                for mi in range(N_STRIKES):
                    if grid[mi][exp_idx] is None:
                        grid[mi][exp_idx] = round(float(np.interp(mi, known_x, known_y)), 2)

        result = {
            'currency':       currency,
            'underlying':     round(underlying, 2),
            'moneyness_axis': money_steps,       # len=20
            'expiry_labels':  expiry_labels,      # len=6
            'expiry_days':    [(exp - now).days for exp in seen_expiries],
            'iv_grid':        grid,               # grid[strike_idx][expiry_idx] = iv%
            'point_count':    len(points),
            'source':         'deribit_live',
            'timestamp':      now.strftime('%Y-%m-%dT%H:%M:%SZ'),
        }
        _set(cache_key, result, ttl=600)
        print(f'[IVSurface/{currency}] OK — {len(points)} options → {N_STRIKES}×{len(seen_expiries)} grid, underlying=${underlying:,.0f}')
        return result

    except Exception as e:
        print(f'[IVSurface/Deribit] {e}')
        return {'source': 'unavailable', 'error': str(e)}




# ─── GitHub — Dev Commit Activity ─────────────────────────────────────────────
_GITHUB_REPOS = {
    'BTC': ('bitcoin', 'bitcoin'),
    'ETH': ('ethereum', 'go-ethereum'),
    'SOL': ('solana-labs', 'solana'),
    'DOT': ('paritytech', 'polkadot'),
    'ADA': ('IntersectMBO', 'cardano-node'),
    'AVAX': ('ava-labs', 'avalanchego'),
    'LINK': ('smartcontractkit', 'chainlink'),
}

def fetch_github_commits(ticker_sym: str) -> int:
    """Weekly commit count from GitHub public API — cached 24h. Returns 0–100 score."""
    sym = ticker_sym.replace('-USD', '').upper()
    if sym not in _GITHUB_REPOS:
        return 50  # neutral default for unknown repos
    cache_key = f'gh_commits_{sym}'
    cached = _get(cache_key)
    if cached is not None:
        return cached
    owner, repo = _GITHUB_REPOS[sym]
    try:
        r = requests.get(
            f'https://api.github.com/repos/{owner}/{repo}/stats/commit_activity',
            timeout=8,
            headers={'Accept': 'application/vnd.github+json'}
        )
        if r.status_code == 200:
            weeks = r.json()
            if weeks:
                recent_weeks = weeks[-4:]  # last 4 weeks
                avg_commits = sum(w.get('total', 0) for w in recent_weeks) / max(len(recent_weeks), 1)
                # Normalise: top repos like ethereum/go-ethereum avg ~200/week
                score = min(100, int(avg_commits / 2))
                _set(cache_key, score, ttl=86400)
                return score
        elif r.status_code == 202:
            # GitHub is computing stats — return cached or default
            pass
    except Exception as e:
        print(f'[GitHub/{sym}] {e}')
    _set(cache_key, 50, ttl=3600)
    return 50
