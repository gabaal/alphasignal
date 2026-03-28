    def handle_backtest_v2(self):
        """Phase 16-E: Signal Backtester v2 — live signal history + real price data."""
        try:
            query     = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            hold_bars = int(query.get('hold', ['5'])[0])
            limit     = int(query.get('limit', ['200'])[0])

            # 1. Pull signal history from DB
            conn = sqlite3.connect(DB_PATH)
            c    = conn.cursor()
            c.execute('''SELECT ticker, type, price, timestamp
                         FROM alerts_history
                         WHERE price > 0
                         ORDER BY timestamp DESC LIMIT ?''', (limit,))
            rows = c.fetchall()
            conn.close()

            if not rows:
                self.send_json({'error': 'No signal history', 'trades': [], 'stats': {}})
                return

            # 2. Fetch price data per ticker
            unique_tickers = list({r[0] for r in rows})
            price_cache = {}
            for tk in unique_tickers:
                try:
                    df = CACHE.download(tk, period='2y', interval='1d', progress=False)
                    if df is not None and not df.empty:
                        closes = self._get_price_series(df, tk)
                        price_cache[tk] = {
                            int(pd.Timestamp(idx).timestamp()): float(v)
                            for idx, v in zip(df.index, closes)
                        }
                except Exception:
                    pass

            # BTC benchmark
            btc_df = CACHE.download('BTC-USD', period='2y', interval='1d', progress=False)
            btc_prices = {}
            if btc_df is not None and not btc_df.empty:
                btc_closes = self._get_price_series(btc_df, 'BTC-USD')
                for d, p in zip(btc_df.index, btc_closes):
                    btc_prices[int(pd.Timestamp(d).timestamp())] = float(p)

            # 3. Simulate trades
            trades = []
            for ticker, sig_type, entry_price, ts_str in rows:
                if ticker not in price_cache:
                    continue
                prices_dict = price_cache[ticker]
                sorted_ts   = sorted(prices_dict.keys())
                try:
                    entry_ts = int(datetime.fromisoformat(ts_str.replace('Z', '')).timestamp()) \
                               if isinstance(ts_str, str) else int(ts_str)
                except Exception:
                    continue

                future_ts = [t for t in sorted_ts if t >= entry_ts]
                if len(future_ts) < 2:
                    continue

                exit_idx  = min(hold_bars, len(future_ts) - 1)
                exit_ts   = future_ts[exit_idx]
                entry_pr  = prices_dict[future_ts[0]]
                exit_pr   = prices_dict[exit_ts]
                direction = 1 if any(k in sig_type.upper() for k in ('LONG', 'BULL', 'BUY')) else -1
                pnl_pct   = direction * (exit_pr - entry_pr) / entry_pr * 100

                btc_entry = min(btc_prices, key=lambda t: abs(t - entry_ts), default=None)
                btc_exit  = min(btc_prices, key=lambda t: abs(t - exit_ts),  default=None)
                btc_pnl   = 0.0
                if btc_entry and btc_exit and btc_prices.get(btc_entry):
                    btc_pnl = (btc_prices[btc_exit] - btc_prices[btc_entry]) / btc_prices[btc_entry] * 100

                trades.append({
                    'ticker':      ticker,
                    'signal':      sig_type,
                    'entry_date':  datetime.utcfromtimestamp(future_ts[0]).strftime('%Y-%m-%d'),
                    'exit_date':   datetime.utcfromtimestamp(exit_ts).strftime('%Y-%m-%d'),
                    'entry_price': round(entry_pr, 4),
                    'exit_price':  round(exit_pr, 4),
                    'pnl_pct':     round(pnl_pct, 3),
                    'btc_pnl':     round(btc_pnl, 3),
                    'win':         pnl_pct > 0,
                    'year_month':  datetime.utcfromtimestamp(future_ts[0]).strftime('%Y-%m'),
                    'ts':          future_ts[0]
                })

            if not trades:
                self.send_json({'error': 'Insufficient data', 'trades': [], 'stats': {}})
                return

            trades.sort(key=lambda x: x['ts'])
            pnls   = [t['pnl_pct'] for t in trades]
            wins   = [p for p in pnls if p > 0]
            losses = [p for p in pnls if p <= 0]

            win_rate      = round(len(wins) / len(pnls) * 100, 1)
            profit_factor = round(abs(sum(wins)) / max(abs(sum(losses)), 0.001), 3)
            total_return  = round(sum(pnls), 2)

            equity = [100.0]
            for p in pnls:
                equity.append(equity[-1] * (1 + p / 100))
            peak   = equity[0]
            max_dd = 0.0
            for e in equity:
                if e > peak: peak = e
                dd = (peak - e) / peak * 100
                if dd > max_dd: max_dd = dd

            mean_r = sum(pnls) / max(len(pnls), 1)
            std_r  = (sum((p - mean_r) ** 2 for p in pnls) / max(len(pnls), 1)) ** 0.5 + 1e-9
            sharpe = round(mean_r / std_r * (252 ** 0.5), 3)
            calmar = round(total_return / max(max_dd, 0.001), 3)

            rolling_sharpe = []
            for i in range(30, len(pnls) + 1):
                win_pnl = pnls[i-30:i]
                mn  = sum(win_pnl) / 30
                sd  = (sum((x - mn) ** 2 for x in win_pnl) / 30) ** 0.5 + 1e-9
                rolling_sharpe.append({
                    'date':              trades[i-1]['entry_date'],
                    'sharpe':            round(mn / sd * (252 ** 0.5), 3),
                    'strat_cumulative':  round(sum(pnls[:i]), 2),
                    'btc_cumulative':    round(sum(t['btc_pnl'] for t in trades[:i]), 2)
                })

            monthly = {}
            for t in trades:
                ym = t['year_month']
                monthly[ym] = round(monthly.get(ym, 0) + t['pnl_pct'], 2)

            self.send_json({
                'trades':          trades[-50:],
                'rolling_sharpe':  rolling_sharpe,
                'monthly_returns': monthly,
                'equity_curve':    [round(e, 2) for e in equity],
                'stats': {
                    'win_rate':      win_rate,
                    'total_trades':  len(trades),
                    'total_return':  total_return,
                    'avg_win':       round(sum(wins) / max(len(wins), 1), 3),
                    'avg_loss':      round(sum(losses) / max(len(losses), 1), 3),
                    'profit_factor': profit_factor,
                    'max_drawdown':  round(max_dd, 2),
                    'sharpe':        sharpe,
                    'calmar':        calmar,
                    'hold_bars':     hold_bars
                }
            })
        except Exception as e:
            print(f'[BacktesterV2] {e}')
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e), 'trades': [], 'stats': {}})
