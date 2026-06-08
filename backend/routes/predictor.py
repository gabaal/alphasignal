"""
Pattern Predictor API Route Mixin
===================================
GET /api/market-prediction  – returns pattern match + prediction for the frontend
GET /api/composite-index    – returns recent CI history for the sparkline chart
"""
import sqlite3
import json
from datetime import datetime

from backend.database import DB_PATH
from backend.predictor_service import PREDICTOR_SVC


class PredictorRoutesMixin:

    def handle_market_prediction(self, query_params):
        """
        GET /api/market-prediction?lookback=30&top_n=5

        Returns the current pattern match result from the predictor service.
        """
        try:
            lookback = int(query_params.get("lookback", ["30"])[0])
            top_n    = int(query_params.get("top_n",    ["5"])[0])
            lookback = max(5, min(lookback, 120))
            top_n    = max(1, min(top_n, 20))

            result = PREDICTOR_SVC.match_current_pattern(
                lookback_minutes=lookback,
                top_n=top_n,
            )
            self.send_json(result)
        except Exception as e:
            self.send_error_json(str(e))

    def handle_composite_index(self, query_params):
        """
        GET /api/composite-index?limit=120

        Returns the last N rows from composite_index_history for the sparkline.
        """
        try:
            limit = int(query_params.get("limit", ["120"])[0])
            limit = max(10, min(limit, 1440))    # 1 min to 24 h

            with sqlite3.connect(DB_PATH, timeout=10) as conn:
                conn.row_factory = sqlite3.Row
                rows = conn.execute("""
                    SELECT ts, ci_value, rsi, bb_pos, macd, vol_change,
                           fear_greed, regime, sentiment, btc_price
                    FROM composite_index_history
                    ORDER BY ts DESC
                    LIMIT ?
                """, (limit,)).fetchall()

            data = [dict(r) for r in reversed(rows)]
            self.send_json({
                "history": data,
                "count":   len(data),
                "latest":  data[-1] if data else None,
            })
        except Exception as e:
            self.send_error_json(str(e))
