"""
Predictor Routes Mixin
======================
Provides:
  GET /api/composite-index  → CI history (1m / 1h / 1d timeframes)
  GET /api/market-prediction → Regime-conditioned pattern match + prediction
  GET /api/predictor-accuracy → Accuracy stats and recent prediction log
"""
import json
from datetime import datetime

from backend.predictor_service import PREDICTOR_SVC, PredictorService


class PredictorRoutesMixin:

    # ── GET /api/composite-index ──────────────────────────────────────────────
    def handle_composite_index(self, query_params):
        """
        Returns CI history for the sparkline.
        Query params:
          limit     – number of rows (default 120)
          timeframe – '1m' | '1h' | '1d' (default '1m')
        """
        try:
            limit     = int(query_params.get('limit', ['120'])[0])
            timeframe = str(query_params.get('timeframe', ['1m'])[0]).strip()
            if timeframe not in ('1m', '1h', '1d'):
                timeframe = '1m'
            limit = max(10, min(limit, 2000))

            rows = PredictorService.get_ci_timeframe(timeframe=timeframe, limit=limit)

            if isinstance(rows, dict) and 'error' in rows:
                self.send_json({'error': rows['error'], 'ticks': []})
                return

            self.send_json({
                'ticks':     rows,
                'count':     len(rows),
                'timeframe': timeframe,
            })

        except Exception as e:
            self.send_json({'error': str(e), 'ticks': []})

    # ── GET /api/market-prediction ────────────────────────────────────────────
    def handle_market_prediction(self, query_params):
        """
        Pattern-matches current CI fingerprint against history.
        Query params:
          lookback      – window size in minutes (default 30); ignored when ensemble=1
          top_n         – number of top matches to return (default 5)
          regime_filter – '1' (default) | '0' to disable
          ensemble      – '1' (default) | '0' to use single lookback instead
        """
        try:
            lookback      = int(query_params.get('lookback', ['30'])[0])
            top_n         = int(query_params.get('top_n',    ['5'])[0])
            regime_filter = query_params.get('regime_filter', ['1'])[0] != '0'
            use_ensemble  = query_params.get('ensemble', ['1'])[0] != '0'

            lookback = max(5, min(lookback, 120))
            top_n    = max(1, min(top_n, 20))

            if use_ensemble:
                result = PredictorService.ensemble_prediction(
                    top_n=top_n,
                    regime_filter=regime_filter,
                )
            else:
                result = PredictorService.match_current_pattern(
                    lookback_minutes=lookback,
                    top_n=top_n,
                    regime_filter=regime_filter,
                )

            self.send_json(result)

        except Exception as e:
            self.send_json({'error': str(e)})


    # ── GET /api/predictor-accuracy ───────────────────────────────────────────
    def handle_predictor_accuracy(self, query_params=None):
        """
        Returns prediction accuracy stats and recent prediction log.
        """
        try:
            stats = PredictorService.get_accuracy_stats()
            self.send_json(stats)
        except Exception as e:
            self.send_json({'error': str(e)})
