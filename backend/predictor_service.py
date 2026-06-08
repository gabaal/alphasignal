"""
Composite Index Predictor Service
==================================
Runs every 60 seconds as a daemon thread.
- Pulls live BTC data from yfinance (1-minute bars, last 60 minutes)
- Computes a multi-factor Composite Index score (-100 to +100)
- Writes the tick to composite_index_history
- Pattern matching logic exposed via match_current_pattern()
"""

import sqlite3
import time
import math
import json
from datetime import datetime, timedelta

import numpy as np

try:
    import yfinance as yf
    YF_AVAILABLE = True
except ImportError:
    YF_AVAILABLE = False

from .database import DB_PATH


# ── helpers ───────────────────────────────────────────────────────────────────

def _safe(v, fallback=0.0):
    """Return v if it's a finite float, else fallback."""
    try:
        f = float(v)
        return f if math.isfinite(f) else fallback
    except Exception:
        return fallback


def _compute_rsi(closes, period=14):
    """Classic Wilder RSI from a list/array of closes."""
    if len(closes) < period + 1:
        return 50.0
    deltas = np.diff(closes)
    gains  = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])
    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def _compute_bb_pos(closes, period=20):
    """Position of last close within Bollinger Band (0 = lower, 1 = upper)."""
    if len(closes) < period:
        return 0.5
    arr   = np.array(closes[-period:], dtype=float)
    mean  = np.mean(arr)
    std   = np.std(arr)
    if std < 1e-8:
        return 0.5
    upper = mean + 2 * std
    lower = mean - 2 * std
    return float(np.clip((closes[-1] - lower) / (upper - lower + 1e-8), 0.0, 1.0))


def _compute_macd(closes, fast=12, slow=26):
    """MACD line value (EMA fast - EMA slow) on the last close."""
    if len(closes) < slow:
        return 0.0
    arr = np.array(closes, dtype=float)
    ema_f = arr[0]
    ema_s = arr[0]
    for p in arr[1:]:
        ema_f = ema_f + (2 / (fast + 1)) * (p - ema_f)
        ema_s = ema_s + (2 / (slow + 1)) * (p - ema_s)
    return float(ema_f - ema_s)


# ── composite index formula ───────────────────────────────────────────────────

def build_composite_index(rsi, bb_pos, macd_norm, vol_change, fear_greed, sentiment, z_score):
    """
    Combine factors into a single Composite Index value in [-100, +100].

    Positive  = bullish pressure
    Negative  = bearish pressure
    """
    # RSI contribution: oversold (<30) → strong positive, overbought (>70) → strong negative
    rsi_c = -((rsi - 50.0) / 50.0) * 25.0          # range ≈ -25 to +25

    # Bollinger Band position: near lower band (0) = bullish, near upper (1) = bearish
    bb_c  = -(bb_pos - 0.5) * 30.0                  # range ≈ -15 to +15

    # MACD: already normalised into -1..1 by caller
    macd_c = macd_norm * 15.0                        # range ≈ -15 to +15

    # Volume change: positive spike = momentum, negative = caution
    vol_c  = float(np.clip(vol_change, -1.0, 1.0)) * 10.0

    # Fear & Greed: extreme fear (0) → contrarian bullish; extreme greed (100) → bearish
    fg_c   = -((fear_greed - 50.0) / 50.0) * 10.0

    # Sentiment: -1 (bearish) to +1 (bullish)
    sent_c = float(np.clip(sentiment, -1.0, 1.0)) * 5.0

    # Z-Score: high positive z = oversold asset cheap, strong positive signal
    z_c    = float(np.clip(z_score, -3.0, 3.0)) * 5.0

    raw = rsi_c + bb_c + macd_c + vol_c + fg_c + sent_c + z_c
    return float(np.clip(raw, -100.0, 100.0))


# ── main service ──────────────────────────────────────────────────────────────

class PredictorService:
    """Daemon thread that writes one composite index tick per minute."""

    INTERVAL = 60          # seconds between ticks
    MAX_HISTORY = 10_000   # prune table beyond this

    def __init__(self):
        self.running = True
        self._last_closes = []
        self._last_volumes = []

    # ── data acquisition ─────────────────────────────────────────────────────

    def _fetch_btc_1m(self):
        """Download last 90 minutes of BTC 1-minute bars via yfinance."""
        if not YF_AVAILABLE:
            return None
        try:
            df = yf.download(
                "BTC-USD",
                period="2d",
                interval="1m",
                auto_adjust=True,
                progress=False,
                threads=False,
            )
            if df is None or df.empty:
                return None
            return df.tail(90)
        except Exception as e:
            print(f"[Predictor] yfinance fetch error: {e}", flush=True)
            return None

    def _get_fear_greed(self):
        """Pull from alternative.me API (tiny JSON, free)."""
        try:
            import requests
            r = requests.get(
                "https://api.alternative.me/fng/?limit=1",
                timeout=5
            )
            if r.status_code == 200:
                data = r.json()
                return float(data["data"][0]["value"])
        except Exception:
            pass
        return 50.0

    def _get_z_score_from_db(self):
        """Pull the average z-score from recent signals in the local DB."""
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT AVG(z_score) FROM alerts_history
                    WHERE status='active'
                      AND timestamp > datetime('now', '-2 hours')
                      AND z_score IS NOT NULL
                """)
                row = c.fetchone()
                if row and row[0] is not None:
                    return float(row[0])
        except Exception:
            pass
        return 0.0

    def _get_regime_from_db(self):
        """Latest HMM regime label from the signals table."""
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT type FROM alerts_history
                    WHERE type LIKE 'REGIME%'
                    ORDER BY timestamp DESC LIMIT 1
                """)
                row = c.fetchone()
                if row:
                    return row[0].replace('REGIME_', '')
        except Exception:
            pass
        return "Unknown"

    # ── tick computation ──────────────────────────────────────────────────────

    def _compute_tick(self):
        """Compute one complete composite index tick."""
        df = self._fetch_btc_1m()
        if df is None or len(df) < 30:
            return None

        try:
            closes  = df["Close"].dropna().values.flatten().tolist()
            volumes = df["Volume"].dropna().values.flatten().tolist()
        except Exception:
            return None

        if len(closes) < 30:
            return None

        rsi     = _safe(_compute_rsi(closes))
        bb_pos  = _safe(_compute_bb_pos(closes))
        macd_v  = _safe(_compute_macd(closes))

        # Normalise MACD by average price level so it's scale-free
        avg_price = float(np.mean(closes[-26:])) if len(closes) >= 26 else (closes[-1] or 1.0)
        macd_norm = float(np.clip(macd_v / (avg_price * 0.01 + 1e-8), -1.0, 1.0))

        # Volume change vs previous bar
        if len(volumes) >= 2 and volumes[-2] and volumes[-2] != 0:
            vol_change = _safe((volumes[-1] - volumes[-2]) / (volumes[-2] + 1e-8))
        else:
            vol_change = 0.0

        fear_greed = _safe(self._get_fear_greed(), 50.0)
        z_score    = _safe(self._get_z_score_from_db(), 0.0)
        sentiment  = 0.0   # placeholder; real sentiment can be hooked in later
        regime     = self._get_regime_from_db()

        ci = build_composite_index(rsi, bb_pos, macd_norm, vol_change,
                                   fear_greed, sentiment, z_score)

        return {
            "ts":         datetime.utcnow().isoformat(timespec="seconds"),
            "ci_value":   round(ci, 4),
            "z_score":    round(z_score, 4),
            "rsi":        round(rsi, 4),
            "bb_pos":     round(bb_pos, 4),
            "macd":       round(macd_v, 6),
            "vol_change": round(vol_change, 6),
            "fear_greed": round(fear_greed, 2),
            "regime":     regime,
            "sentiment":  round(sentiment, 4),
            "btc_price":  round(float(closes[-1]), 2) if closes else 0.0,
        }

    # ── DB operations ────────────────────────────────────────────────────────

    def _store_tick(self, tick):
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                conn.execute("""
                    INSERT INTO composite_index_history
                        (ts, ci_value, z_score, rsi, bb_pos, macd,
                         vol_change, fear_greed, regime, sentiment, btc_price)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    tick["ts"], tick["ci_value"], tick["z_score"],
                    tick["rsi"], tick["bb_pos"], tick["macd"],
                    tick["vol_change"], tick["fear_greed"], tick["regime"],
                    tick["sentiment"], tick["btc_price"],
                ))
                conn.commit()
        except Exception as e:
            print(f"[Predictor] DB store error: {e}", flush=True)

    def _prune_old_ticks(self):
        """Keep only the most recent MAX_HISTORY rows."""
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                conn.execute(f"""
                    DELETE FROM composite_index_history
                    WHERE id NOT IN (
                        SELECT id FROM composite_index_history
                        ORDER BY ts DESC LIMIT {self.MAX_HISTORY}
                    )
                """)
                conn.commit()
        except Exception as e:
            print(f"[Predictor] Prune error: {e}", flush=True)

    # ── pattern matching ──────────────────────────────────────────────────────

    @staticmethod
    def match_current_pattern(lookback_minutes=30, top_n=5):
        """
        Compare the current N-minute CI fingerprint against all stored
        windows of the same length.

        Returns a dict with:
          current    – list of recent CI values
          matches    – list of top_n best historical matches
          prediction – aggregated directional prediction
        """
        try:
            with sqlite3.connect(DB_PATH, timeout=15) as conn:
                conn.row_factory = sqlite3.Row
                # Fetch last (lookback * 2) rows to have current + search space
                rows = conn.execute("""
                    SELECT id, ts, ci_value, rsi, bb_pos, regime, btc_price
                    FROM composite_index_history
                    ORDER BY ts DESC
                    LIMIT ?
                """, (lookback_minutes * 2 + 10,)).fetchall()

            if len(rows) < lookback_minutes + 5:
                return {"error": "insufficient_history",
                        "rows_available": len(rows),
                        "rows_needed": lookback_minutes}

            rows = list(reversed(rows))   # oldest first

            # Current window = last `lookback_minutes` rows
            current_window = rows[-lookback_minutes:]
            current_ci = [r["ci_value"] for r in current_window]

            # Fetch entire history for sliding window search
            with sqlite3.connect(DB_PATH, timeout=15) as conn:
                conn.row_factory = sqlite3.Row
                all_rows = conn.execute("""
                    SELECT id, ts, ci_value, rsi, bb_pos, regime, btc_price
                    FROM composite_index_history
                    ORDER BY ts ASC
                """).fetchall()

            if len(all_rows) < lookback_minutes + lookback_minutes:
                return {"error": "insufficient_history",
                        "rows_available": len(all_rows),
                        "rows_needed": lookback_minutes * 2}

            # Sliding window DTW-lite: Euclidean distance on CI values
            current_arr = np.array(current_ci, dtype=float)
            current_ids = {r["id"] for r in current_window}

            best = []
            n = len(all_rows)
            for i in range(n - lookback_minutes - lookback_minutes):
                window = all_rows[i: i + lookback_minutes]
                # Skip if this overlaps with the current window
                if any(r["id"] in current_ids for r in window):
                    continue
                window_ci = np.array([r["ci_value"] for r in window], dtype=float)
                dist = float(np.sqrt(np.mean((current_arr - window_ci) ** 2)))

                # What happened *after* this window?
                future_rows = all_rows[i + lookback_minutes: i + lookback_minutes + lookback_minutes]
                if not future_rows:
                    continue
                future_ci = [r["ci_value"] for r in future_rows]
                future_price_start = all_rows[i + lookback_minutes]["btc_price"]
                future_price_end   = future_rows[-1]["btc_price"]
                price_change_pct   = 0.0
                if future_price_start and future_price_start != 0:
                    price_change_pct = round(
                        (future_price_end - future_price_start) / future_price_start * 100, 3
                    )

                best.append({
                    "distance":         round(dist, 4),
                    "window_start":     window[0]["ts"],
                    "window_end":       window[-1]["ts"],
                    "future_ci_mean":   round(float(np.mean(future_ci)), 4),
                    "price_change_pct": price_change_pct,
                    "regime":           window[-1]["regime"],
                })

            best.sort(key=lambda x: x["distance"])
            top_matches = best[:top_n]

            # Aggregate prediction
            if top_matches:
                avg_change = float(np.mean([m["price_change_pct"] for m in top_matches]))
                weight_sum = 0.0
                weighted_change = 0.0
                for m in top_matches:
                    w = 1.0 / (m["distance"] + 1e-8)
                    weighted_change += w * m["price_change_pct"]
                    weight_sum += w
                pred_change = weighted_change / weight_sum if weight_sum else avg_change
                direction = "BULLISH" if pred_change > 0.05 else ("BEARISH" if pred_change < -0.05 else "NEUTRAL")
                confidence = min(0.95, max(0.20, 1.0 - (top_matches[0]["distance"] / 20.0)))
            else:
                pred_change = 0.0
                direction   = "NEUTRAL"
                confidence  = 0.0

            return {
                "current_ci":   [round(v, 3) for v in current_ci],
                "matches":      top_matches,
                "prediction": {
                    "direction":        direction,
                    "predicted_change": round(pred_change, 4),
                    "confidence":       round(confidence, 3),
                    "lookback_minutes": lookback_minutes,
                    "matches_found":    len(top_matches),
                },
                "history_size": len(all_rows),
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": str(e)}

    # ── main loop ─────────────────────────────────────────────────────────────

    def run(self):
        """Daemon loop — write one tick per INTERVAL seconds."""
        print(f"[Predictor] Service starting (interval={self.INTERVAL}s)...", flush=True)
        # Stagger start so boot isn't swamped
        time.sleep(30)
        prune_counter = 0
        while self.running:
            try:
                tick = self._compute_tick()
                if tick:
                    self._store_tick(tick)
                    prune_counter += 1
                    if prune_counter % 60 == 0:   # prune once an hour
                        self._prune_old_ticks()
            except Exception as e:
                print(f"[Predictor] Tick error: {e}", flush=True)
            time.sleep(self.INTERVAL)


# Module-level singleton
PREDICTOR_SVC = PredictorService()
