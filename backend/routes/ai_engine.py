"""
Phase 15-B: AI Narrative Engine
Provides GPT-4o-mini powered endpoints:
  - /api/ai-memo       GET  — Daily institutional market memo (15min cache)
  - /api/ask-terminal  POST — Natural language query with terminal context
  - /api/signal-thesis GET  — 2-sentence trade thesis for a specific signal
"""
import json, urllib.parse, os, time
from datetime import datetime

try:
    from openai import OpenAI
    _openai_available = True
except ImportError:
    _openai_available = False

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

_memo_cache = {'ts': 0, 'content': None}
_brief_cache = {'ts': 0, 'content': None}
_MEMO_TTL = 900  # 15 minutes


def _get_client():
    key = os.environ.get('OPENAI_API_KEY', '')
    if not key or not _openai_available:
        return None
    return OpenAI(api_key=key)


def _static_fallback_memo():
    now = datetime.utcnow().strftime('%d %b %Y %H:%M UTC')
    return {
        'generated_at': now,
        'memo': (
            "**Macro Context** — Global risk appetite remains compressed as central bank "
            "forward guidance continues to weigh on leveraged positioning. Bitcoin dominance "
            "is consolidating near cycle highs, suggesting altcoin capital has not yet "
            "rotated in earnest. Watch for a DXY weakening catalyst.\n\n"
            "**Key Opportunities** — On-chain accumulation patterns for BTC and ETH suggest "
            "institutional wallets are absorbing spot supply at current levels. "
            "The 180-day EMA crossover signal on SOL has historically preceded a 40–60% "
            "expansion phase. Risk-adjusted entries on crypto proxies (MSTR, MARA) "
            "offer favourable leverage to a BTC breakout.\n\n"
            "**Risk Warnings** — Macro tail risks include unexpected CPI prints, geopolitical "
            "escalation affecting energy prices, and regulatory clarity timelines in the EU. "
            "Funding rates on major perp pairs remain positive — a crowded long trade "
            "could unwind rapidly on any negative catalyst."
        ),
        'source': 'static_template'
    }


class AIEngineRoutesMixin:

    def handle_ai_memo(self):
        global _memo_cache
        now_ts = time.time()
        if _memo_cache['content'] and (now_ts - _memo_cache['ts']) < _MEMO_TTL:
            self.send_json(_memo_cache['content'])
            return

        client = _get_client()
        if not client:
            self.send_json(_static_fallback_memo())
            return

        # Build context from live data (best-effort, graceful on failure)
        context_lines = []
        try:
            import yfinance as yf
            btc = yf.download('BTC-USD', period='5d', interval='1d', progress=False)
            if not btc.empty:
                close = btc['Close'].iloc[-1]
                chg = (btc['Close'].iloc[-1] / btc['Close'].iloc[-5] - 1) * 100
                context_lines.append(f"BTC price: ${close:,.0f} ({chg:+.1f}% 5-day)")
        except Exception:
            pass

        context = '\n'.join(context_lines) if context_lines else 'Live data unavailable — use general crypto market knowledge.'
        system_prompt = (
            "You are an elite institutional crypto market analyst writing for a professional trading desk. "
            "Write in a concise, authoritative style. No bullet points. Three paragraphs only. "
            "Each paragraph has a bold header: **Macro Context**, **Key Opportunities**, **Risk Warnings**. "
            "Keep total length under 250 words. Be specific with levels, percentages, and indicators."
        )
        user_prompt = (
            f"Today is {datetime.utcnow().strftime('%A, %d %B %Y')}.\n"
            f"Market snapshot:\n{context}\n\n"
            "Write today's institutional morning memo."
        )

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=400,
                temperature=0.7
            )
            memo_text = resp.choices[0].message.content.strip()
            result = {
                'generated_at': datetime.utcnow().strftime('%d %b %Y %H:%M UTC'),
                'memo': memo_text,
                'source': 'gpt-4o-mini'
            }
            _memo_cache = {'ts': now_ts, 'content': result}
            self.send_json(result)
        except Exception as e:
            print(f'[AI Memo] GPT error: {e}')
            self.send_json(_static_fallback_memo())

    def handle_ask_terminal(self, post_data):
        query = post_data.get('query', '').strip()
        if not query:
            self.send_json({'error': 'No query provided'})
            return

        client = _get_client()
        if not client:
            self.send_json({
                'answer': (
                    "The AI engine is not configured yet. Add your **OPENAI_API_KEY** to the "
                    "environment variables to enable natural language terminal queries."
                ),
                'source': 'fallback'
            })
            return

        # --- Fetch Proprietary Firm Memory (RAG) ---
        proprietary_memory = ""
        auth_info = self.is_authenticated() if hasattr(self, 'is_authenticated') else None
        if auth_info and auth_info.get('email'):
            try:
                import sqlite3
                from backend.database import DB_PATH
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT title, content FROM ai_knowledge_base WHERE user_email=?", (auth_info['email'],))
                rows = c.fetchall()
                conn.close()
                if rows:
                    proprietary_memory = "\n\n<proprietary_firm_memory>\nUse the following institutional firm guidelines and research unconditionally:\n"
                    for r in rows:
                        proprietary_memory += f"Title: {r[0]}\n{r[1]}\n\n"
                    proprietary_memory += "</proprietary_firm_memory>\n"
            except Exception as e:
                print(f"[RAG Error] Failed to fetch ai_knowledge_base: {e}")

        system_prompt = (
            "You are AlphaSignal Terminal — an institutional-grade crypto intelligence platform. "
            "Answer user questions about crypto markets, trading strategies, on-chain data, and "
            "the signals shown in the terminal. Be concise (max 150 words), precise, and actionable. "
            "Use markdown for formatting. Never give financial advice disclaimers — this is a professional tool."
        ) + proprietary_memory

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': query}
                ],
                max_tokens=300,
                temperature=0.6
            )
            answer = resp.choices[0].message.content.strip()
            self.send_json({'answer': answer, 'source': 'gpt-4o-mini'})
        except Exception as e:
            print(f'[Ask Terminal] GPT error: {e}')
            self.send_json({'answer': f'Error: {str(e)}', 'source': 'error'})

    def handle_signal_thesis(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        ticker  = query.get('ticker', ['BTC'])[0]
        signal  = query.get('signal', ['LONG'])[0]
        zscore  = query.get('zscore', ['2.1'])[0]

        # ── Fetch live price so the LLM is grounded to the actual current price ──
        live_price = None
        try:
            import sqlite3
            from backend.database import DB_PATH
            db = sqlite3.connect(DB_PATH)
            cur = db.cursor()
            cur.execute(
                "SELECT price FROM market_ticks WHERE symbol=? AND price>0 ORDER BY timestamp DESC LIMIT 1",
                (ticker,)
            )
            row = cur.fetchone()
            db.close()
            if row:
                live_price = round(float(row[0]), 4)
        except Exception:
            pass

        if live_price is None:
            try:
                import yfinance as yf
                info = yf.Ticker(ticker).fast_info
                px = info.get('last_price') or info.get('lastPrice') or info.get('regularMarketPrice')
                if px and float(px) > 0:
                    live_price = round(float(px), 4)
            except Exception:
                pass

        client = _get_client()
        if not client:
            price_str = f"${live_price:,.2f}" if live_price else "current market price"
            self.send_json({
                'thesis': (
                    f"**{ticker} {signal} Setup:** Statistical Z-Score deviation of {zscore}\u03c3 "
                    f"indicates a high-conviction momentum expansion phase at {price_str}. "
                    f"Institutional accumulation patterns corroborate directional bias — "
                    f"target the next liquidity band with a 2:1 risk-reward profile."
                ),
                'source': 'template'
            })
            return

        price_anchor = (
            f" The current live price is ${live_price:,.4f} — ALL price levels, entries, "
            f"stop-losses, and targets in your thesis MUST be quoted relative to this live price."
        ) if live_price else ""

        # --- Fetch Proprietary Firm Memory (RAG) ---
        proprietary_memory = ""
        auth_info = self.is_authenticated() if hasattr(self, 'is_authenticated') else None
        if auth_info and auth_info.get('email'):
            try:
                import sqlite3
                from backend.database import DB_PATH
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT title, content FROM ai_knowledge_base WHERE user_email=?", (auth_info['email'],))
                rows = c.fetchall()
                conn.close()
                if rows:
                    proprietary_memory = " <proprietary_firm_memory> Use the following firm bias for trading logic: "
                    for r in rows:
                        proprietary_memory += f"[{r[0]}: {r[1]}] "
                    proprietary_memory += "</proprietary_firm_memory>"
            except Exception as e:
                pass


        system_prompt = (
            "You are an institutional crypto/equity analyst. Write exactly 2 sentences. "
            "First sentence: explain the technical setup driving this signal. "
            "Second sentence: the tactical entry rationale and key risk. "
            "CRITICAL: Use ONLY the live price given in the prompt for any price references. "
            "Never invent or use historical price levels. Max 80 words total."
        ) + proprietary_memory
        user_prompt = (
            f"Generate a trade thesis for: {ticker}, Signal={signal}, Z-Score={zscore}\u03c3.{price_anchor}"
        )

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=120,
                temperature=0.5
            )
            thesis = resp.choices[0].message.content.strip()
            self.send_json({'thesis': thesis, 'ticker': ticker, 'signal': signal, 'source': 'gpt-4o-mini'})
        except Exception as e:
            print(f'[Signal Thesis] GPT error: {e}')
            self.send_json({'thesis': f'Analysis unavailable: {str(e)}', 'source': 'error'})

    def handle_explain_chart(self, post_data):
        client = _get_client()
        if not client:
            self.send_json({
                'explanation': "AI processing is offline. Please configure your OPENAI_API_KEY to enable chart translations.",
                'source': 'fallback'
            })
            return

        chart_type = post_data.get('chart_type')
        data = post_data.get('data')

        if not chart_type or not data:
            self.send_json({'explanation': "Missing chart_type or data.", 'source': 'error'})
            return

        personas = {
            'funding': "You are an institutional crypto yield arbitrageur analyzing global perpetual funding rates.",
            'pulse': "You are a derivatives risk manager analyzing live liquidation clusters overlaid on price action.",
            'cvd': "You are a macro order flow analyst dissecting Cumulative Volume Delta against price.",
            'exchange': "You are an on-chain analyst monitoring macro exchange net position flows.",
            'derivatives': "You are a crypto whale tracker monitoring live large block-trade flux and option derivatives flow.",
            'comparative': "You are a macro portfolio manager benchmarking an active asset against BTC.",
            'depth': "You are an institutional market maker analyzing resting order book liquidity and spoof walls. The data passed contains the top 3 thickest bid/ask walls and overall volume imbalance. Do not ask for raw levels.",
            'stress': "You are a quantitative portfolio risk manager. Analyze the asset-specific beta, alpha, and overall systemic tension, explaining the relative drawdown risk in plain English.",
            'macro': "You are a macro-economist and bond strategist. Analyze the incoming economic catalysts and the shape of the Treasury Yield Curve, explaining the impact on risk-asset liquidity in plain English.",
            'matrix': "You are a quantitative portfolio manager analyzing a 60-day cross-asset correlation matrix. Explain which assets are highly correlated, which provide diversification (decoupled), and how a retail trader should adjust their portfolio based on these relationships. Keep it under 100 words in plain English.",
            'regime': "You are an institutional quant researcher specializing in Markov-Switching market cycles. Analyze the current regime, trend bias, volatility, and SMA variance, and explain what tactical shifts a trader should make based on this phase. Keep it under 100 words in plain English.",
            'narrative': "You are an institutional Crypto Narrative & Sector Rotation Analyst. Digest the underlying cluster velocity data and explain where capital flow is pivoting toward (e.g., L1s vs. Memes vs. AI). Conclude with a clear actionable thesis on current market direction based on the structural volume.",
            'sankey': "You are an On-Chain Liquidity Flow Analyst. Analyze the capital flow diagram (fiat to L1s to yield destinations) and identify which ecosystems or protocols are capturing the largest share of fresh liquidity right now, and what that signals for asset outperformance. Keep it under 100 words in plain English.",
            'options': "You are an Institutional Volatility & Derivatives Desk Trader. Synthesize the Put/Call ratio, Max Pain, IV Smile skew, and heavy Open Interest strikes. Explain what structural bets whales are making in plain English, and provide a clear thesis on what this means for near-term spot price gravity."
        }

        persona = personas.get(chart_type, "You are a quantitative financial analyst.")

        system_prompt = (
            f"{persona} "
            "Write exactly two concise paragraphs in plain English (max 100 words total). "
            "First paragraph: Detail analytically what the data structure is showing right now. "
            "Second paragraph: What is the high-level, actionable takeaway for a retail trader? "
            "Never use financial advice disclaimers. Use a crisp, authoritative tone."
        )

        user_prompt = f"Chart Type: {chart_type.upper()}\nRaw Datastream:\n{json.dumps(data)}\n\nTranslate this structural data into an actionable plain English summary."

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=250,
                temperature=0.6
            )
            val = resp.choices[0].message.content.strip()
            self.send_json({'explanation': val, 'source': 'gpt-4o-mini'})
        except Exception as e:
            print(f'[Explain Chart] GPT error: {e}')
            self.send_json({'explanation': f'Analysis unavailable: {str(e)}', 'source': 'error'})

    def handle_explain_tape(self, post_data):
        client = _get_client()
        if not client:
            self.send_json({
                'explanation': "AI processing is offline. Please configure your OPENAI_API_KEY to enable tape translations.",
                'source': 'fallback'
            })
            return

        buckets = post_data.get('buckets', [])
        symbol = post_data.get('symbol', 'the asset')

        # Format context for LLM
        # Buckets represent net volume (buy_vol - sell_vol) in 5-second intervals over the last 150 seconds.
        # Older data at index 0, most recent data at the end.
        context = (
            f"Asset: {symbol}\n"
            f"Net Volume Imbalance per 5-second bucket (oldest to newest): {', '.join([str(v) for v in buckets]) if buckets else 'Empty'}\n"
        )

        system_prompt = (
            "You are AlphaSignal's high-frequency order flow analyst. "
            "The user is looking at a Live Tape Imbalance histogram representing net volume flux (Buy Volume - Sell Volume) in 5-second buckets "
            "over the last 150 seconds. Positive values signify aggressive buying; negative values signify aggressive selling. "
            "Write exactly two short paragraphs in plain English (max 100 words total). "
            "First paragraph: Summarize the immediate order flow action based on the size and sequence of these buckets, particularly focusing on the most recent prints (end of the array). "
            "Second paragraph: What is the actionable takeaway? (e.g. is there a sudden block liquidation, or steady accumulation?) "
            "DO NOT give financial advice disclaimers. Use a crisp, professional, high-frequency trading desk tone."
        )

        user_prompt = f"Here is the raw tape imbalance array:\n{context}\nDiagnose this order flow in plain English."

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=250,
                temperature=0.6
            )
            val = resp.choices[0].message.content.strip()
            self.send_json({'explanation': val, 'source': 'gpt-4o-mini'})
        except Exception as e:
            print(f'[Explain Tape] GPT error: {e}')
            self.send_json({'explanation': f'Analysis unavailable: {str(e)}', 'source': 'error'})

    def handle_explain_rebalance(self, post_data):
        client = _get_client()
        if not client:
            self.send_json({
                'explanation': "AI processing is offline. Please configure your OPENAI_API_KEY to enable rebalancing strategies.",
                'source': 'fallback'
            })
            return

        basket = post_data.get('basket', 'Unknown Basket')
        metrics = post_data.get('metrics', {})
        weights = post_data.get('weights', [])

        context = (
            f"Portfolio Basket: {basket}\n"
            f"Risk & Performance Metrics: {json.dumps(metrics)}\n"
            f"Mathematical Markowitz Optimal Allocation: {json.dumps(weights)}\n"
        )

        system_prompt = (
            "You are a Chief Investment Officer at a premier quantitative hedge fund. "
            "A portfolio manager has structured a custom basket of assets and passed them through a Markowitz Efficient Frontier engine. "
            "Write exactly two concise paragraphs in plain English (max 120 words total). "
            "First paragraph: Provide the theoretical rationale for the generated weights. Explain WHY certain assets were heavily allocated (e.g., strong momentum, low correlation/variance) versus others that received low allocations. Reference the provided Sharpe, VaR, or Beta metrics if relevant. "
            "Second paragraph: Provide a strict, actionable execution mandate (e.g., 'Execute this optimal weighting to cap portfolio Volatility while capturing isolated Alpha'). "
            "DO NOT give financial advice disclaimers. Maintain a crisp, authoritative institutional tone."
        )

        user_prompt = f"Here is the portfolio state:\n{context}\nIssue a clear rebalancing memo based entirely on these risk metrics and optimal weight structure."

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=250,
                temperature=0.6
            )
            val = resp.choices[0].message.content.strip()
            self.send_json({'explanation': val, 'source': 'gpt-4o-mini'})
        except Exception as e:
            print(f'[Explain Rebalance] GPT error: {e}')
            self.send_json({'explanation': f'Analysis unavailable: {str(e)}', 'source': 'error'})

    def handle_explain_surface(self, post_data):
        client = _get_client()
        if not client:
            self.send_json({
                'explanation': "AI processing is offline. Please configure your OPENAI_API_KEY to enable plain English surface translations.",
                'source': 'fallback'
            })
            return

        atm_iv = post_data.get('atm_iv', [])
        skew = post_data.get('skew', [])
        expiries = post_data.get('expiries', [])

        # Format context for LLM
        context = (
            f"Expiries: {', '.join(expiries) if expiries else 'Unknown'}\n"
            f"ATM IV (%): {', '.join([str(v) for v in atm_iv]) if atm_iv else 'Unknown'}\n"
            f"25Delta Skew (Puts vs Calls %): {', '.join([str(v) for v in skew]) if skew else 'Unknown'}\n"
        )

        system_prompt = (
            "You are AlphaSignal's quantitative volatility analyst. "
            "The user is looking at a 3D Implied Volatility Surface chart. "
            "Write exactly two short paragraphs in plain English (max 100 words total). "
            "First paragraph: Summarize what the data (ATM IV curve and Skew) is showing. Negative skew means calls are favoured, positive means puts. "
            "Second paragraph: What is the actionable takeaway for a retail trader (e.g. are options cheap/expensive, are traders buying crash protection or breakout FOMO)? "
            "DO NOT give financial advice disclaimers. Use an engaging, professional tone."
        )

        user_prompt = f"Here is the raw options surface data:\n{context}\nTranslate this into plain English insights."

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=250,
                temperature=0.6
            )
            val = resp.choices[0].message.content.strip()
            self.send_json({'explanation': val, 'source': 'gpt-4o-mini'})
        except Exception as e:
            print(f'[Explain Surface] GPT error: {e}')
            self.send_json({'explanation': f'Analysis unavailable: {str(e)}', 'source': 'error'})

    def handle_market_brief(self):
        """AI Daily Market Brief — 4h cached, all logged-in users."""
        global _brief_cache
        now_ts = time.time()
        _BRIEF_TTL = 4 * 3600  # 4 hours

        if _brief_cache['content'] and (now_ts - _brief_cache['ts']) < _BRIEF_TTL:
            self.send_json(_brief_cache['content'])
            return

        client = _get_client()

        # Build live context
        context_lines = []
        try:
            import sqlite3, os as _os
            from backend.database import DB_PATH as _DB_PATH
            db = sqlite3.connect(_DB_PATH)
            cur = db.cursor()
            # BTC price
            cur.execute("SELECT price FROM market_ticks WHERE symbol='BTC-USD' AND price>0 ORDER BY timestamp DESC LIMIT 1")
            row = cur.fetchone()
            if row:
                context_lines.append(f"BTC current price: ${float(row[0]):,.0f}")
            # Top 3 recent signals
            cur.execute("""
                SELECT type, ticker, message, severity FROM alerts_history
                WHERE timestamp > datetime('now', '-24 hours')
                ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END
                LIMIT 3
            """)
            sigs = cur.fetchall()
            for sig in sigs:
                context_lines.append(f"Signal: {sig[1]} {sig[0]} ({sig[3]}) — {(sig[2] or '')[:80]}")
            db.close()
        except Exception:
            pass

        context = '\n'.join(context_lines) if context_lines else 'Use current general crypto market knowledge.'
        now_str = datetime.utcnow().strftime('%A, %d %B %Y')

        if not client:
            result = {
                'brief': (
                    "**Macro Context** — Global risk appetite remains measured as institutional capital "
                    "continues to rotate selectively into high-conviction crypto infrastructure plays. "
                    "Bitcoin dominance holds above 50%, signalling a defensive posture among large allocators.\n\n"
                    "**BTC Outlook** — Price action is consolidating within a well-defined accumulation range. "
                    "On-chain data points to long-term holder supply absorption at current levels, with exchange "
                    "reserves continuing their multi-month decline — a structurally bullish backdrop.\n\n"
                    "**Top Signals** — The AlphaSignal engine flagged elevated RSI readings across L1 assets and "
                    "ML-alpha predictions on select DeFi tokens. Volume spikes on ETH and SOL suggest institutional "
                    "rebalancing ahead of a narrative catalyst window.\n\n"
                    "**Risk Factors** — Key macro risk remains the Fed's forward guidance trajectory. "
                    "A hawkish surprise on this week's PCE print could trigger a short-term risk-off flush. "
                    "Manage position sizing accordingly and maintain stop discipline."
                ),
                'generated_at': datetime.utcnow().strftime('%d %b %Y %H:%M UTC'),
                'next_refresh': datetime.utcfromtimestamp(now_ts + _BRIEF_TTL).strftime('%d %b %Y %H:%M UTC'),
                'source': 'static'
            }
            _brief_cache = {'ts': now_ts, 'content': result}
            self.send_json(result)
            return

        system_prompt = (
            "You are an elite institutional crypto market analyst. "
            "Write exactly 4 paragraphs, each with a bold header. "
            "Headers: **Macro Context**, **BTC Outlook**, **Top Signals**, **Risk Factors**. "
            "Style: concise, authoritative, data-driven. No bullet points. Max 300 words total. "
            "Be specific with price levels, percentages, and indicator names where relevant."
        )
        user_prompt = (
            f"Today is {now_str}. Market data:\n{context}\n\n"
            "Write today's institutional morning brief."
        )

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            brief_text = resp.choices[0].message.content.strip()
            result = {
                'brief': brief_text,
                'generated_at': datetime.utcnow().strftime('%d %b %Y %H:%M UTC'),
                'next_refresh': datetime.utcfromtimestamp(now_ts + _BRIEF_TTL).strftime('%d %b %Y %H:%M UTC'),
                'source': 'gpt-4o-mini'
            }
            _brief_cache = {'ts': now_ts, 'content': result}
            self.send_json(result)
        except Exception as e:
            print(f'[Market Brief] GPT error: {e}')
            self.send_json({'error': str(e)})

    def handle_explain_options(self, post_data):
        client = _get_client()
        if not client:
            self.send_json({
                'explanation': "AI processing is offline. Please configure your OPENAI_API_KEY to enable options synthesis.",
                'source': 'fallback'
            })
            return

        ticker = post_data.get('ticker', 'Unknown')
        pcr = post_data.get('pcr', 'N/A')
        max_pain = post_data.get('max_pain', 'N/A')
        atm_iv = post_data.get('atm_iv', 'N/A')
        iv_rank = post_data.get('iv_rank', 'N/A')
        call_oi = post_data.get('call_oi', 'N/A')
        skew = post_data.get('skew', 'N/A')
        exp_move = post_data.get('exp_move', 'N/A')
        zero_gamma = post_data.get('zero_gamma', 'N/A')
        anomalies = post_data.get('anomalies', 0)
        
        context = (
            f"Asset: {ticker}\n"
            f"Put/Call Ratio: {pcr}\n"
            f"Max Pain: {max_pain}\n"
            f"ATM IV: {atm_iv}%\n"
            f"IV Rank: {iv_rank}\n"
            f"Zero-Gamma Pivot: ${zero_gamma}
"
            f"Expected 7D Move: ±${exp_move}
"
            f"25-Delta Skew: {skew}%
"
            f"Unusual Flow Anomalies: {anomalies} strikes
"
        )
        
        system_prompt = (
            "You are AlphaSignal's quantitative volatility analyst. "
            "The user is viewing the Options Flow Scanner. "
            "Write exactly two short paragraphs in plain English (max 100 words total). "
            "First paragraph: Summarize institutional positioning based on PCR, the Expected Move boundaries, and whether they are pinned at the Zero-Gamma strike. "
            "Second paragraph: Give an actionable structural takeaway based on the Skew (are they heavily bidding puts for fear or calls for FOMO?) and identify if there is unusual volume anomalous flow occurring today. "
            "Keep it highly professional, quantitative, and engaging. DO NOT give financial advice disclaimers."
        )
        
        user_prompt = f"Here is the current options flow data for {ticker}:\n{context}\nProvide your synthesis."
        
        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=350,
                temperature=0.7
            )
            explanation = resp.choices[0].message.content.strip()
            self.send_json({
                'explanation': explanation,
                'source': 'gpt-4o-mini'
            })
        except Exception as e:
            print(f'[AI Engine] Options Explain Error: {e}')
            self.send_json({'error': str(e)})
