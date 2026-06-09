"""
Composite Index Predictor Service v2
=====================================
Runs every 60 seconds as a daemon thread.
- Pulls live BTC data from yfinance (1-minute bars, last 90 minutes)
- Pulls whale data from Redis
- Computes a multi-factor Composite Index score (-100 to +100) including:
    RSI, Bollinger Band, MACD, Volume, Fear & Greed, Z-Score,
    MVRV proxy, Whale Score, Exchange Flow
- Writes the tick to composite_index_history
- Regime-conditioned pattern matching via match_current_pattern()
- Logs and resolves predictions in predictor_accuracy table
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

from .database import DB_PATH, redis_client


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

def build_composite_index(rsi, bb_pos, macd_norm, vol_change, fear_greed,
                          sentiment, z_score, mvrv_proxy=1.0,
                          whale_score=0.0, exch_flow=0.0):
    """
    Combine factors into a single Composite Index value in [-100, +100].

    Positive  = bullish pressure
    Negative  = bearish pressure

    Factors:
        RSI (−25..+25), BB pos (−15..+15), MACD (−15..+15),
        Volume change (−10..+10), Fear & Greed (−10..+10),
        Sentiment (−5..+5), Z-Score (−15..+15),
        MVRV proxy (−20..+20), Whale score (−15..+15),
        Exchange flow (−10..+10)
    """
    # RSI: oversold (<30) → positive, overbought (>70) → negative
    rsi_c    = -((rsi - 50.0) / 50.0) * 25.0

    # Bollinger: near lower band (0) = bullish, near upper (1) = bearish
    bb_c     = -(bb_pos - 0.5) * 30.0

    # MACD: normalised into -1..1 by caller
    macd_c   = macd_norm * 15.0

    # Volume change momentum
    vol_c    = float(np.clip(vol_change, -1.0, 1.0)) * 10.0

    # Fear & Greed: extreme fear (0) → contrarian bullish; extreme greed (100) → bearish
    fg_c     = -((fear_greed - 50.0) / 50.0) * 10.0

    # Sentiment: −1 (bearish) to +1 (bullish)
    sent_c   = float(np.clip(sentiment, -1.0, 1.0)) * 5.0

    # Z-Score: high z = expensive (bearish), low z = cheap (bullish)
    z_c      = float(np.clip(-z_score, -3.0, 3.0)) * 5.0

    # MVRV proxy: < 1.0 = deeply undervalued (+20 pts); > 3.5 = overvalued (-20 pts)
    # Neutral around 1.5 (fair value)
    mvrv_c   = float(np.clip(-(mvrv_proxy - 1.5) / 1.5, -1.0, 1.0)) * 20.0

    # Whale score: net whale buying = bullish
    whale_c  = float(np.clip(whale_score, -1.0, 1.0)) * 15.0

    # Exchange flow: outflow (negative) = coins leaving exchanges = bullish
    exch_c   = float(np.clip(-exch_flow, -1.0, 1.0)) * 10.0

    raw = rsi_c + bb_c + macd_c + vol_c + fg_c + sent_c + z_c + mvrv_c + whale_c + exch_c
    return float(np.clip(raw, -100.0, 100.0))


# ── main service ──────────────────────────────────────────────────────────────

class PredictorService:
    """Daemon thread that writes one composite index tick per minute."""

    INTERVAL   = 60          # seconds between ticks
    MAX_HISTORY = 10_000     # prune table beyond this

    def __init__(self):
        self.running       = True
        self._last_closes  = []
        self._last_volumes = []
        self._daily_closes = []   # cache for MVRV proxy

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
            print(f"[Predictor] yfinance 1m fetch error: {e}", flush=True)
            return None

    def _fetch_btc_daily(self):
        """Download last 250 days of BTC daily bars for MVRV proxy."""
        if not YF_AVAILABLE:
            return []
        try:
            df = yf.download(
                "BTC-USD",
                period="1y",
                interval="1d",
                auto_adjust=True,
                progress=False,
                threads=False,
            )
            if df is None or df.empty:
                return []
            closes = df["Close"].dropna().values.flatten().tolist()
            return [float(c) for c in closes]
        except Exception as e:
            print(f"[Predictor] yfinance daily fetch error: {e}", flush=True)
            return []

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
        """Current regime from HMM engine (authoritative), falling back to last DB row."""
        # 1. Try the live HMM engine first — same source the harvester uses
        try:
            from backend.routes.regime_hmm import HMM_ENGINE
            result = HMM_ENGINE.predict_regime('BTC-USD')
            label = result.get('current_label', '')
            # Ignore the placeholder value returned while training is in progress
            if label and label not in ('', 'Unknown') and not result.get('training'):
                return label
        except Exception:
            pass

        # 2. Fall back to last non-Unknown regime stored in composite_index_history
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                c = conn.cursor()
                c.execute("""
                    SELECT regime FROM composite_index_history
                    WHERE regime IS NOT NULL
                      AND regime != ''
                      AND regime != 'Unknown'
                    ORDER BY ts DESC LIMIT 1
                """)
                row = c.fetchone()
                if row and row[0]:
                    return row[0]
        except Exception:
            pass

        return "Unknown"

    def _get_mvrv_proxy(self, current_price):
        """
        MVRV proxy = current price / 200-day simple moving average.
        MVRV < 1.0 → deeply undervalued (historically good buy zone).
        MVRV > 3.5 → historically overvalued.
        Uses cached daily closes refreshed every 60 ticks (~1 hour).
        """
        try:
            if not self._daily_closes:
                self._daily_closes = self._fetch_btc_daily()
            if len(self._daily_closes) >= 20:
                period = min(200, len(self._daily_closes))
                avg_200 = float(np.mean(self._daily_closes[-period:]))
                if avg_200 > 0:
                    return round(current_price / avg_200, 4)
        except Exception:
            pass
        return 1.5   # neutral fallback

    def _get_whale_score(self):
        """
        Derive a net flow score from the Redis whale list.
        Score in [-1, +1]: positive = net buying, negative = net selling.
        """
        try:
            raw = redis_client.lrange('alphasignal:whales', 0, 49)
            if not raw:
                return 0.0
            buy_vol  = 0.0
            sell_vol = 0.0
            for item in raw:
                try:
                    w = json.loads(item)
                    val = float(w.get('value', 0))
                    if w.get('side') == 'buy':
                        buy_vol  += val
                    else:
                        sell_vol += val
                except Exception:
                    continue
            total = buy_vol + sell_vol
            if total < 1:
                return 0.0
            return float(np.clip((buy_vol - sell_vol) / total, -1.0, 1.0))
        except Exception:
            return 0.0

    def _get_exchange_flow(self, whale_score):
        """
        Simple exchange flow approximation derived from whale score.
        Net whale selling → coins flowing to exchanges (bearish).
        Net whale buying  → coins leaving exchanges (bullish).
        Returns value in [-1, +1], where positive = net outflow (bullish).
        """
        # Invert whale score slightly and add noise dampening
        return float(np.clip(whale_score * 0.8, -1.0, 1.0))

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

        rsi    = _safe(_compute_rsi(closes))
        bb_pos = _safe(_compute_bb_pos(closes))
        macd_v = _safe(_compute_macd(closes))

        # Normalise MACD by average price level so it's scale-free
        avg_price = float(np.mean(closes[-26:])) if len(closes) >= 26 else (closes[-1] or 1.0)
        macd_norm = float(np.clip(macd_v / (avg_price * 0.01 + 1e-8), -1.0, 1.0))

        # Volume change vs previous bar
        if len(volumes) >= 2 and volumes[-2] and volumes[-2] != 0:
            vol_change = _safe((volumes[-1] - volumes[-2]) / (volumes[-2] + 1e-8))
        else:
            vol_change = 0.0

        fear_greed  = _safe(self._get_fear_greed(), 50.0)
        z_score     = _safe(self._get_z_score_from_db(), 0.0)
        sentiment   = 0.0   # reserved — hook in NLP feed here if available
        regime      = self._get_regime_from_db()
        current_price = float(closes[-1]) if closes else 0.0

        # New v2 signals
        mvrv_proxy  = _safe(self._get_mvrv_proxy(current_price), 1.5)
        whale_score = _safe(self._get_whale_score(), 0.0)
        exch_flow   = _safe(self._get_exchange_flow(whale_score), 0.0)

        ci = build_composite_index(
            rsi, bb_pos, macd_norm, vol_change, fear_greed, sentiment, z_score,
            mvrv_proxy=mvrv_proxy, whale_score=whale_score, exch_flow=exch_flow
        )

        return {
            "ts":             datetime.utcnow().isoformat(timespec="seconds"),
            "ci_value":       round(ci, 4),
            "z_score":        round(z_score, 4),
            "rsi":            round(rsi, 4),
            "bb_pos":         round(bb_pos, 4),
            "macd":           round(macd_v, 6),
            "vol_change":     round(vol_change, 6),
            "fear_greed":     round(fear_greed, 2),
            "regime":         regime,
            "sentiment":      round(sentiment, 4),
            "btc_price":      round(current_price, 2),
            "mvrv_proxy":     round(mvrv_proxy, 4),
            "whale_score":    round(whale_score, 4),
            "exch_flow_score": round(exch_flow, 4),
        }

    # ── DB operations ────────────────────────────────────────────────────────

    def _store_tick(self, tick):
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                conn.execute("""
                    INSERT INTO composite_index_history
                        (ts, ci_value, z_score, rsi, bb_pos, macd,
                         vol_change, fear_greed, regime, sentiment, btc_price,
                         mvrv_proxy, whale_score, exch_flow_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    tick["ts"], tick["ci_value"], tick["z_score"],
                    tick["rsi"], tick["bb_pos"], tick["macd"],
                    tick["vol_change"], tick["fear_greed"], tick["regime"],
                    tick["sentiment"], tick["btc_price"],
                    tick["mvrv_proxy"], tick["whale_score"], tick["exch_flow_score"],
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

    def _log_prediction(self, prediction, current_price, lookback_minutes):
        """Record a new prediction in predictor_accuracy for later resolution."""
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                conn.execute("""
                    INSERT INTO predictor_accuracy
                        (predicted_at, lookback_minutes, regime, predicted_dir,
                         predicted_change, confidence, btc_price_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    datetime.utcnow().isoformat(timespec="seconds"),
                    lookback_minutes,
                    prediction.get("regime", "Unknown"),
                    prediction.get("direction", "NEUTRAL"),
                    prediction.get("predicted_change", 0.0),
                    prediction.get("confidence", 0.0),
                    current_price,
                ))
                conn.commit()
        except Exception as e:
            print(f"[Predictor] Accuracy log error: {e}", flush=True)

    def _resolve_accuracy(self, current_price):
        """
        Find pending predictions older than lookback_minutes and resolve them.
        was_correct = 1 if predicted direction matches actual move direction.
        """
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                conn.row_factory = sqlite3.Row
                # Find unresolved rows where enough time has passed
                pending = conn.execute("""
                    SELECT id, predicted_at, lookback_minutes, predicted_dir,
                           predicted_change, btc_price_at
                    FROM predictor_accuracy
                    WHERE was_correct IS NULL
                      AND btc_price_after IS NULL
                      AND predicted_at < datetime('now', '-' || lookback_minutes || ' minutes')
                    LIMIT 10
                """).fetchall()

                for row in pending:
                    price_at    = row["btc_price_at"] or 0.0
                    actual_chg  = 0.0
                    if price_at and price_at > 0 and current_price > 0:
                        actual_chg = round((current_price - price_at) / price_at * 100, 3)

                    pred_dir    = row["predicted_dir"]
                    actual_dir  = "BULLISH" if actual_chg > 0.05 else (
                                  "BEARISH" if actual_chg < -0.05 else "NEUTRAL")
                    # Correct if direction matches (NEUTRAL counts as correct if both are neutral)
                    was_correct = 1 if pred_dir == actual_dir else 0

                    conn.execute("""
                        UPDATE predictor_accuracy
                        SET btc_price_after = ?,
                            actual_change   = ?,
                            was_correct     = ?,
                            resolved_at     = ?
                        WHERE id = ?
                    """, (
                        round(current_price, 2),
                        actual_chg,
                        was_correct,
                        datetime.utcnow().isoformat(timespec="seconds"),
                        row["id"],
                    ))
                conn.commit()
        except Exception as e:
            print(f"[Predictor] Accuracy resolve error: {e}", flush=True)

    # ── pattern matching ──────────────────────────────────────────────────────

    @staticmethod
    def _extract_feature_matrix(rows):
        """
        Build a (N, 5) feature matrix from a list of DB rows.
        Features: [ci_value, rsi, bb_pos, whale_score, mvrv_proxy]
        Returns raw matrix; caller is responsible for z-score normalisation.
        """
        arr = np.array([
            [
                float(r["ci_value"]    or 0.0),
                float(r["rsi"]         or 50.0),
                float(r["bb_pos"]      or 0.5),
                float(r["whale_score"] or 0.0),
                float(r["mvrv_proxy"]  or 1.5),
            ]
            for r in rows
        ], dtype=float)
        return arr

    @staticmethod
    def _zscore_cols(matrix):
        """Z-score each column independently. Columns with zero std are left as-is."""
        mu    = matrix.mean(axis=0)
        sigma = matrix.std(axis=0)
        sigma[sigma < 1e-8] = 1.0
        return (matrix - mu) / sigma, mu, sigma

    @staticmethod
    def match_current_pattern(lookback_minutes=30, top_n=5, regime_filter=True):
        """
        Compare the current N-minute CI fingerprint against all stored
        windows of the same length, optionally filtered to the same regime.

        Fallback: if fewer than 20 regime-matched windows found, falls back
        to unfiltered search.

        Returns a dict with:
          current_ci   – list of recent CI values
          matches      – list of top_n best historical matches
          prediction   – aggregated directional prediction
          history_size – total rows in DB
          regime_filtered – bool, whether regime filter was applied
        """
        try:
            with sqlite3.connect(DB_PATH, timeout=15) as conn:
                conn.row_factory = sqlite3.Row
                all_rows = conn.execute("""
                    SELECT id, ts, ci_value, rsi, bb_pos, regime,
                           btc_price, mvrv_proxy, whale_score
                    FROM composite_index_history
                    ORDER BY ts ASC
                """).fetchall()

            if len(all_rows) < lookback_minutes + lookback_minutes:
                return {
                    "error": "insufficient_history",
                    "rows_available": len(all_rows),
                    "rows_needed": lookback_minutes * 2,
                }

            rows_list = list(all_rows)

            # Current window = last lookback_minutes rows
            current_window = rows_list[-lookback_minutes:]
            current_ci     = [r["ci_value"] for r in current_window]
            current_regime = current_window[-1]["regime"] if current_window else "Unknown"
            current_ids    = {r["id"] for r in current_window}

            # ── Multi-feature matching ────────────────────────────────────────
            # Build z-score normalised feature matrix over full history
            full_matrix_raw = PredictorService._extract_feature_matrix(rows_list)
            full_matrix, feat_mu, feat_sigma = PredictorService._zscore_cols(full_matrix_raw)

            # Current feature window (normalised using history stats)
            cur_raw = PredictorService._extract_feature_matrix(current_window)  # (L, 5)
            cur_norm = (cur_raw - feat_mu) / feat_sigma                          # (L, 5)
            cur_flat = cur_norm.flatten()                                         # (L*5,)

            # Trend direction vector (first-differences of CI, normalised)
            cur_trend = np.diff(cur_norm[:, 0])  # CI column deltas

            def _cosine(a, b):
                """Cosine similarity between two 1-D vectors."""
                na, nb = np.linalg.norm(a), np.linalg.norm(b)
                if na < 1e-8 or nb < 1e-8:
                    return 0.0
                return float(np.dot(a, b) / (na * nb))

            def _slide(rows, filter_regime=None):
                matches = []
                n = len(rows)
                for i in range(n - lookback_minutes - lookback_minutes):
                    window = rows[i: i + lookback_minutes]
                    if any(r["id"] in current_ids for r in window):
                        continue
                    if filter_regime and window[-1]["regime"] != filter_regime:
                        continue

                    # Multi-feature distance (z-score normalised, all 5 features)
                    win_raw  = full_matrix[i: i + lookback_minutes]  # already normalised
                    win_flat = win_raw.flatten()
                    eucl     = float(np.sqrt(np.mean((cur_flat - win_flat) ** 2)))

                    # Cosine similarity on flattened feature vectors
                    cos_sim  = _cosine(cur_flat, win_flat)  # -1..1

                    # Trend alignment bonus: CI first-differences
                    win_trend  = np.diff(win_raw[:, 0])
                    trend_sim  = _cosine(cur_trend, win_trend)  # -1..1

                    # Combined score: lower eucl = better; higher cos/trend = better
                    # Map to a single "closeness" score in [0, ∞) — higher is better
                    closeness = (0.5 * (1.0 / (eucl + 1e-6)) +
                                 0.3 * max(0.0, cos_sim) +
                                 0.2 * max(0.0, trend_sim))

                    future = rows[i + lookback_minutes: i + lookback_minutes + lookback_minutes]
                    if not future:
                        continue
                    fp_start = rows[i + lookback_minutes]["btc_price"]
                    fp_end   = future[-1]["btc_price"]
                    pct_chg  = 0.0
                    if fp_start and fp_start > 0:
                        pct_chg = round((fp_end - fp_start) / fp_start * 100, 3)

                    matches.append({
                        "distance":         round(eucl, 4),
                        "cosine_sim":       round(cos_sim, 4),
                        "trend_sim":        round(trend_sim, 4),
                        "closeness":        round(closeness, 6),
                        "window_start":     window[0]["ts"],
                        "window_end":       window[-1]["ts"],
                        "future_ci_mean":   round(float(np.mean([r["ci_value"] for r in future])), 4),
                        "price_change_pct": pct_chg,
                        "regime":           window[-1]["regime"],
                    })
                return matches

            # Try regime-filtered first
            used_regime_filter = False
            if regime_filter and current_regime and current_regime != "Unknown":
                best = _slide(rows_list, filter_regime=current_regime)
                if len(best) >= 20:
                    used_regime_filter = True
                else:
                    best = _slide(rows_list, filter_regime=None)
            else:
                best = _slide(rows_list, filter_regime=None)

            # Sort by closeness DESC (higher = better match)
            best.sort(key=lambda x: x["closeness"], reverse=True)
            top_matches = best[:top_n]

            # ── Smarter confidence + weighted prediction ──────────────────────
            if top_matches:
                # Weight by closeness² for sharper concentration on best matches
                weight_sum      = 0.0
                weighted_change = 0.0
                for m in top_matches:
                    w = m["closeness"] ** 2
                    weighted_change += w * m["price_change_pct"]
                    weight_sum      += w
                pred_change = weighted_change / weight_sum if weight_sum else 0.0
                direction   = ("BULLISH" if pred_change > 0.05 else
                               ("BEARISH" if pred_change < -0.05 else "NEUTRAL"))

                # Agreement: fraction of top matches pointing same direction
                match_dirs = ["BULLISH" if m["price_change_pct"] > 0.05 else
                              ("BEARISH" if m["price_change_pct"] < -0.05 else "NEUTRAL")
                              for m in top_matches]
                agreement = sum(1 for d in match_dirs if d == direction) / len(match_dirs)

                # Consistency: low std of outcomes = more predictable
                chg_vals = [m["price_change_pct"] for m in top_matches]
                mean_abs = np.mean(np.abs(chg_vals)) + 1e-8
                consistency = max(0.0, 1.0 - float(np.std(chg_vals)) / mean_abs)
                consistency = min(1.0, consistency)

                # Distance quality from best match
                dist_quality = max(0.0, min(1.0, top_matches[0]["closeness"] / 5.0))

                confidence = round(
                    0.4 * dist_quality +
                    0.35 * agreement +
                    0.25 * consistency,
                    3,
                )
                confidence = max(0.10, min(0.95, confidence))

                confidence_breakdown = {
                    "distance_quality": round(dist_quality, 3),
                    "match_agreement":  round(agreement, 3),
                    "outcome_consistency": round(consistency, 3),
                }
            else:
                pred_change          = 0.0
                direction            = "NEUTRAL"
                confidence           = 0.0
                confidence_breakdown = {}

            return {
                "current_ci":       [round(v, 3) for v in current_ci],
                "current_regime":   current_regime,
                "matches":          top_matches,
                "prediction": {
                    "direction":        direction,
                    "predicted_change": round(pred_change, 4),
                    "confidence":       confidence,
                    "confidence_breakdown": confidence_breakdown,
                    "lookback_minutes": lookback_minutes,
                    "matches_found":    len(top_matches),
                    "regime":           current_regime,
                },
                "history_size":      len(all_rows),
                "regime_filtered":   used_regime_filter,
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": str(e)}

    @staticmethod
    def ensemble_prediction(top_n=5, regime_filter=True):
        """
        Run pattern matching at three lookbacks (15m / 30m / 45m) and
        aggregate into a single ensemble prediction.

        Returns the standard match_current_pattern payload plus:
          ensemble_lookbacks   – per-lookback summary
          ensemble_agreement   – 0–1, fraction agreeing on same direction
        """
        lookbacks = [15, 30, 45]
        results   = {}
        for lb in lookbacks:
            r = PredictorService.match_current_pattern(
                lookback_minutes=lb, top_n=top_n, regime_filter=regime_filter
            )
            results[lb] = r

        # Collect valid predictions
        valid = [
            (lb, r["prediction"])
            for lb, r in results.items()
            if "prediction" in r and "error" not in r
        ]

        if not valid:
            # Return the 30m result as fallback
            base = results.get(30, {"error": "insufficient_history"})
            base["ensemble_lookbacks"] = {}
            base["ensemble_agreement"] = 0.0
            return base

        # Confidence-weighted ensemble
        total_weight    = 0.0
        weighted_change = 0.0
        for lb, pred in valid:
            w = pred["confidence"]
            weighted_change += w * pred["predicted_change"]
            total_weight    += w

        ens_change    = weighted_change / total_weight if total_weight else 0.0
        ens_direction = ("BULLISH" if ens_change > 0.05 else
                         ("BEARISH" if ens_change < -0.05 else "NEUTRAL"))

        # Agreement: fraction of lookbacks matching ensemble direction
        dirs = [pred["direction"] for _, pred in valid]
        agreement = sum(1 for d in dirs if d == ens_direction) / len(dirs)

        # Use the 30m result as base and overwrite prediction with ensemble
        base = results.get(30, results[valid[0][0]])
        base_pred = base.get("prediction", {})
        base_pred.update({
            "direction":        ens_direction,
            "predicted_change": round(ens_change, 4),
            "confidence":       round(total_weight / len(valid), 3),
            "ensemble":         True,
        })
        base["prediction"] = base_pred

        base["ensemble_lookbacks"] = {
            lb: {
                "direction":        pred["direction"],
                "predicted_change": pred["predicted_change"],
                "confidence":       pred["confidence"],
                "matches_found":    pred["matches_found"],
            }
            for lb, pred in valid
        }
        base["ensemble_agreement"] = round(agreement, 3)
        return base

    # ── accuracy stats ────────────────────────────────────────────────────────

    @staticmethod
    def get_accuracy_stats():
        """
        Return overall, rolling, and per-regime prediction accuracy.
        Only counts resolved rows (was_correct IS NOT NULL).
        """
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                conn.row_factory = sqlite3.Row

                # Overall stats
                overall = conn.execute("""
                    SELECT
                        COUNT(*) AS total,
                        SUM(was_correct) AS correct,
                        AVG(ABS(actual_change - predicted_change)) AS avg_error
                    FROM predictor_accuracy
                    WHERE was_correct IS NOT NULL
                """).fetchone()

                # Rolling 7-day accuracy
                roll_7d = conn.execute("""
                    SELECT COUNT(*) AS total, SUM(was_correct) AS correct
                    FROM predictor_accuracy
                    WHERE was_correct IS NOT NULL
                      AND resolved_at > datetime('now', '-7 days')
                """).fetchone()

                # Rolling 30-day accuracy
                roll_30d = conn.execute("""
                    SELECT COUNT(*) AS total, SUM(was_correct) AS correct
                    FROM predictor_accuracy
                    WHERE was_correct IS NOT NULL
                      AND resolved_at > datetime('now', '-30 days')
                """).fetchone()

                # Per-regime stats
                by_regime = conn.execute("""
                    SELECT regime,
                           COUNT(*) AS total,
                           SUM(was_correct) AS correct
                    FROM predictor_accuracy
                    WHERE was_correct IS NOT NULL
                    GROUP BY regime
                    ORDER BY total DESC
                """).fetchall()

                # Recent predictions (last 20, including pending)
                recent = conn.execute("""
                    SELECT predicted_at, predicted_dir, predicted_change,
                           confidence, actual_change, was_correct, regime
                    FROM predictor_accuracy
                    ORDER BY predicted_at DESC
                    LIMIT 20
                """).fetchall()

            def _rate(row):
                t = row["total"] or 0
                c = int(row["correct"] or 0)
                return round(c / t * 100, 1) if t > 0 else None

            total   = overall["total"] or 0
            correct = int(overall["correct"] or 0)
            rate    = round(correct / total * 100, 1) if total > 0 else None
            avg_err = round(float(overall["avg_error"] or 0), 3)

            return {
                "total_resolved":  total,
                "total_correct":   correct,
                "accuracy_pct":    rate,
                "avg_error_pct":   avg_err,
                "accuracy_7d_pct": _rate(roll_7d),
                "accuracy_30d_pct": _rate(roll_30d),
                "by_regime": [
                    {
                        "regime":       r["regime"],
                        "total":        r["total"],
                        "correct":      int(r["correct"] or 0),
                        "accuracy_pct": round(int(r["correct"] or 0) / r["total"] * 100, 1),
                    }
                    for r in by_regime
                ],
                "recent": [
                    {
                        "predicted_at":     r["predicted_at"],
                        "predicted_dir":    r["predicted_dir"],
                        "predicted_change": r["predicted_change"],
                        "confidence":       r["confidence"],
                        "actual_change":    r["actual_change"],
                        "was_correct":      r["was_correct"],
                        "regime":           r["regime"],
                    }
                    for r in recent
                ],
            }
        except Exception as e:
            return {"error": str(e)}

    # ── multi-timeframe query helpers ─────────────────────────────────────────

    @staticmethod
    def get_ci_timeframe(timeframe="1m", limit=120):
        """
        Return CI history at the requested timeframe:
          1m  → raw 1-minute rows (most recent first)
          1h  → GROUP BY hour, averaging CI
          1d  → GROUP BY day, averaging CI
        """
        try:
            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                conn.row_factory = sqlite3.Row

                if timeframe == "1h":
                    rows = conn.execute("""
                        SELECT
                            strftime('%Y-%m-%dT%H:00:00', ts) AS ts,
                            AVG(ci_value)        AS ci_value,
                            AVG(rsi)             AS rsi,
                            AVG(bb_pos)          AS bb_pos,
                            AVG(fear_greed)      AS fear_greed,
                            AVG(mvrv_proxy)      AS mvrv_proxy,
                            AVG(whale_score)     AS whale_score,
                            AVG(vol_change)      AS vol_change,
                            MAX(regime)          AS regime,
                            AVG(btc_price)       AS btc_price
                        FROM composite_index_history
                        GROUP BY strftime('%Y-%m-%dT%H', ts)
                        ORDER BY ts DESC
                        LIMIT ?
                    """, (limit,)).fetchall()

                elif timeframe == "1d":
                    rows = conn.execute("""
                        SELECT
                            strftime('%Y-%m-%d', ts) AS ts,
                            AVG(ci_value)        AS ci_value,
                            AVG(rsi)             AS rsi,
                            AVG(bb_pos)          AS bb_pos,
                            AVG(fear_greed)      AS fear_greed,
                            AVG(mvrv_proxy)      AS mvrv_proxy,
                            AVG(whale_score)     AS whale_score,
                            AVG(vol_change)      AS vol_change,
                            MAX(regime)          AS regime,
                            AVG(btc_price)       AS btc_price
                        FROM composite_index_history
                        GROUP BY strftime('%Y-%m-%d', ts)
                        ORDER BY ts DESC
                        LIMIT ?
                    """, (limit,)).fetchall()

                else:   # default: 1m
                    rows = conn.execute("""
                        SELECT ts, ci_value, rsi, bb_pos, fear_greed,
                               mvrv_proxy, whale_score, vol_change,
                               regime, btc_price
                        FROM composite_index_history
                        ORDER BY ts DESC
                        LIMIT ?
                    """, (limit,)).fetchall()

            return [dict(r) for r in reversed(rows)]

        except Exception as e:
            return {"error": str(e)}

    # ── one-time startup backfill ─────────────────────────────────────────────

    def _backfill_regime_labels(self):
        """Fix any predictor_accuracy rows that have regime = 'Unknown'.

        Tries to match each row against the nearest composite_index_history tick.
        Falls back to the current HMM label for rows with no close CI record.
        Safe to call repeatedly — only touches rows with 'Unknown' or NULL regime.
        """
        try:
            # Get current HMM label as fallback
            fallback = 'Dislocation'
            try:
                from backend.routes.regime_hmm import HMM_ENGINE
                res = HMM_ENGINE.predict_regime('BTC-USD')
                if res.get('current_label') and not res.get('training'):
                    fallback = res['current_label']
            except Exception:
                pass

            with sqlite3.connect(DB_PATH, timeout=30) as conn:
                conn.row_factory = sqlite3.Row
                c = conn.cursor()

                c.execute("""
                    SELECT id, predicted_at FROM predictor_accuracy
                    WHERE regime IS NULL OR regime = '' OR regime = 'Unknown'
                """)
                rows = c.fetchall()

                if not rows:
                    return

                print(f"[Predictor v2] Backfilling regime on {len(rows)} rows...", flush=True)
                fixed = 0
                for row in rows:
                    # Try closest CI tick within 90 minutes
                    ci = conn.execute("""
                        SELECT regime
                        FROM composite_index_history
                        WHERE regime IS NOT NULL
                          AND regime != ''
                          AND regime != 'Unknown'
                          AND ABS(strftime('%s', ts) - strftime('%s', ?)) < 5400
                        ORDER BY ABS(strftime('%s', ts) - strftime('%s', ?)) ASC
                        LIMIT 1
                    """, (row['predicted_at'], row['predicted_at'])).fetchone()

                    regime = ci['regime'] if ci else fallback
                    c.execute(
                        "UPDATE predictor_accuracy SET regime = ? WHERE id = ?",
                        (regime, row['id'])
                    )
                    fixed += 1

                conn.commit()
                print(f"[Predictor v2] Regime backfill complete: {fixed} rows updated.", flush=True)

        except Exception as e:
            print(f"[Predictor v2] Regime backfill error: {e}", flush=True)

    # ── main loop ─────────────────────────────────────────────────────────────

    def run(self):
        """Daemon loop — write one tick per INTERVAL seconds."""
        print(f"[Predictor v2] Service starting (interval={self.INTERVAL}s)...", flush=True)
        # Stagger start so boot isn't swamped
        time.sleep(30)
        # Backfill any Unknown regime rows from before the fix
        self._backfill_regime_labels()
        prune_counter = 0
        daily_refresh_counter = 0

        while self.running:
            try:
                tick = self._compute_tick()
                if tick:
                    self._store_tick(tick)
                    prune_counter        += 1
                    daily_refresh_counter += 1

                    # Prune once an hour
                    if prune_counter % 60 == 0:
                        self._prune_old_ticks()

                    # Refresh daily closes cache once an hour
                    if daily_refresh_counter % 60 == 0:
                        self._daily_closes = self._fetch_btc_daily()
                        daily_refresh_counter = 0

                    # Resolve pending accuracy predictions every tick
                    current_price = tick.get("btc_price", 0.0)
                    if current_price > 0:
                        self._resolve_accuracy(current_price)

                    # Auto-log a prediction every 30 ticks (30 min)
                    if prune_counter % 30 == 0:
                        try:
                            result = PredictorService.match_current_pattern(
                                lookback_minutes=30, top_n=5, regime_filter=True
                            )
                            if "prediction" in result and not result.get("error"):
                                self._log_prediction(
                                    result["prediction"],
                                    current_price,
                                    30
                                )
                        except Exception as pe:
                            print(f"[Predictor v2] Auto-log prediction error: {pe}", flush=True)

            except Exception as e:
                print(f"[Predictor v2] Tick error: {e}", flush=True)
            time.sleep(self.INTERVAL)


# Module-level singleton
PREDICTOR_SVC = PredictorService()
