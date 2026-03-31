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

        system_prompt = (
            "You are AlphaSignal Terminal — an institutional-grade crypto intelligence platform. "
            "Answer user questions about crypto markets, trading strategies, on-chain data, and "
            "the signals shown in the terminal. Be concise (max 150 words), precise, and actionable. "
            "Use markdown for formatting. Never give financial advice disclaimers — this is a professional tool."
        )

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
        ticker = query.get('ticker', ['BTC'])[0]
        signal = query.get('signal', ['LONG'])[0]
        zscore = query.get('zscore', ['2.1'])[0]

        client = _get_client()
        if not client:
            self.send_json({
                'thesis': (
                    f"**{ticker} {signal} Setup:** Statistical Z-Score deviation of {zscore}σ "
                    f"indicates a high-conviction momentum expansion phase. "
                    f"Institutional accumulation patterns corroborate directional bias — "
                    f"target the next liquidity band with a 2:1 risk-reward profile."
                ),
                'source': 'template'
            })
            return

        system_prompt = (
            "You are an institutional crypto analyst. Write exactly 2 sentences. "
            "First sentence: explain the technical setup driving this signal. "
            "Second sentence: the tactical entry rationale and key risk. "
            "Be specific. No generic statements. Max 80 words total."
        )
        user_prompt = f"Generate a trade thesis for: {ticker}, Signal={signal}, Z-Score={zscore}σ"

        try:
            resp = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user',   'content': user_prompt}
                ],
                max_tokens=120,
                temperature=0.7
            )
            thesis = resp.choices[0].message.content.strip()
            self.send_json({'thesis': thesis, 'ticker': ticker, 'signal': signal, 'source': 'gpt-4o-mini'})
        except Exception as e:
            print(f'[Signal Thesis] GPT error: {e}')
            self.send_json({'thesis': f'Analysis unavailable: {str(e)}', 'source': 'error'})

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

