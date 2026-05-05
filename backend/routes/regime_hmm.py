"""
AlphaSignal — Gaussian HMM Regime Predictor (vectorised numpy, no C compiler)

States (auto-labeled by mean return after training):
  Risk-On      — trending up, low vol
  Compression  — sideways / uncertain
  Dislocation  — high vol, negative returns

Features (all price-derived, no external APIs):
  [0] ret_5d    — 5-day compounded return
  [1] vol_20d   — 20-day realised vol, annualised
  [2] skew_20d  — 20-day return skewness
  [3] dvol_5d   — 5-day vol acceleration
"""

import os, time, pickle, threading
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
from scipy.special import logsumexp          # scipy already installed

_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'regime_hmm.pkl')


# ── Helpers ───────────────────────────────────────────────────────────────────
def _skew(x):
    m, s = x.mean(), x.std()
    return float(((x - m) ** 3).mean() / (s ** 3 + 1e-300))


def _build_features(prices: np.ndarray) -> np.ndarray:
    rets = np.diff(prices) / prices[:-1]
    rows = []
    for i in range(20, len(rets)):
        w    = rets[i-20:i]
        r5   = float(np.prod(1 + rets[i-5:i]) - 1)
        v20  = float(w.std() * np.sqrt(252))
        sk20 = _skew(w)
        dv5  = float(w[-5:].std() - w[-10:-5].std())
        rows.append([r5, v20, sk20, dv5])
    return np.array(rows, dtype=np.float64)


def _zscore(X, mu=None, sigma=None):
    if mu is None:
        mu, sigma = X.mean(0), X.std(0) + 1e-8
    return (X - mu) / sigma, mu, sigma


# ── Fully-vectorised Gaussian HMM ─────────────────────────────────────────────
class GaussianHMM:
    """
    Diagonal-covariance Gaussian HMM.
    All inner loops replaced with numpy broadcasting — typically < 5 s for 500 rows.
    """

    def __init__(self, n_components=3, n_iter=80, tol=1e-3, seed=42):
        self.K      = n_components
        self.n_iter = n_iter
        self.tol    = tol
        self.rng    = np.random.default_rng(seed)
        self.pi = self.A = self.mu = self.sigma2 = None
        self.state_labels: dict[int, str] = {}
        self.score_ = None

    # ── emission log-prob [T, K] ──────────────────────────────────────────────
    def _log_emit(self, X):
        # X: [T, d], mu: [K, d], sigma2: [K, d]
        d   = X.shape[1]
        # diff[T, K, d]
        diff  = X[:, None, :] - self.mu[None, :, :]
        ldet  = np.log(self.sigma2).sum(-1)                  # [K]
        maha  = (diff ** 2 / self.sigma2[None]).sum(-1)      # [T, K]
        return -0.5 * (d * np.log(2 * np.pi) + ldet + maha)

    # ── forward (log-space, vectorised over K) ────────────────────────────────
    def _forward(self, log_p):
        T, K  = log_p.shape
        log_A = np.log(self.A + 1e-300)
        la    = np.empty((T, K))
        la[0] = np.log(self.pi + 1e-300) + log_p[0]
        for t in range(1, T):
            # [K_from, K_to]: la[t-1,:,None] + log_A  → logsumexp over axis 0
            la[t] = logsumexp(la[t-1, :, None] + log_A, axis=0) + log_p[t]
        return la, float(logsumexp(la[-1]))

    # ── backward (log-space, vectorised over K) ───────────────────────────────
    def _backward(self, log_p):
        T, K  = log_p.shape
        log_A = np.log(self.A + 1e-300)
        lb    = np.zeros((T, K))
        for t in range(T - 2, -1, -1):
            # [K_from, K_to]: log_A + log_p[t+1] + lb[t+1] → logsumexp over axis 1
            lb[t] = logsumexp(log_A + log_p[t+1] + lb[t+1], axis=1)
        return lb

    # ── EM ────────────────────────────────────────────────────────────────────
    def _e_step(self, X):
        log_p  = self._log_emit(X)
        la, ll = self._forward(log_p)
        lb     = self._backward(log_p)

        # gamma [T, K]
        lg = la + lb
        lg -= logsumexp(lg, axis=1, keepdims=True)
        gamma = np.exp(lg)

        # xi [T-1, K, K]  — fully vectorised
        log_A  = np.log(self.A + 1e-300)
        # shape: [T-1, K, K]
        log_xi = (la[:-1, :, None] + log_A[None] +
                  log_p[1:, None, :] + lb[1:, None, :])
        T1 = log_xi.shape[0]
        log_xi -= logsumexp(log_xi.reshape(T1, -1), axis=1)[:, None, None]
        xi = np.exp(log_xi)
        return gamma, xi, ll

    def _m_step(self, X, gamma, xi):
        K, d = self.K, X.shape[1]
        self.pi = gamma[0] / (gamma[0].sum() + 1e-300)
        xs      = xi.sum(0)                                     # [K, K]
        self.A  = xs / (xs.sum(1, keepdims=True) + 1e-300)
        gs      = gamma.sum(0)                                   # [K]
        # mu: [K, d]
        self.mu     = (gamma.T @ X) / (gs[:, None] + 1e-300)
        # sigma2: [K, d]
        diff         = X[:, None, :] - self.mu[None, :, :]      # [T, K, d]
        self.sigma2  = ((gamma[:, :, None] * diff ** 2).sum(0)
                        / (gs[:, None] + 1e-300)) + 1e-6

    def fit(self, X):
        K, d = self.K, X.shape[1]
        T    = len(X)
        # init pi, A
        self.pi = np.ones(K) / K
        self.A  = np.full((K, K), 0.05 / (K - 1))
        np.fill_diagonal(self.A, 0.95)
        # init mu by percentile slices of first feature
        idx  = np.argsort(X[:, 0])
        c    = T // K
        self.mu     = np.array([X[idx[i*c:(i+1)*c]].mean(0) for i in range(K)])
        self.sigma2 = np.tile(X.var(0) + 1e-6, (K, 1))

        prev = -np.inf
        for _ in range(self.n_iter):
            gamma, xi, ll = self._e_step(X)
            self._m_step(X, gamma, xi)
            if abs(ll - prev) < self.tol:
                break
            prev = ll

        self.score_ = ll
        # label by descending mean return (feature 0)
        order = np.argsort(self.mu[:, 0])[::-1]
        labels = ['Risk-On', 'Compression', 'Dislocation']
        self.state_labels = {int(order[i]): labels[i] for i in range(K)}
        return self

    def predict(self, X):
        """Viterbi decoding."""
        log_p = self._log_emit(X)
        T, K  = log_p.shape
        log_A = np.log(self.A + 1e-300)
        delta = np.empty((T, K))
        psi   = np.empty((T, K), int)
        delta[0] = np.log(self.pi + 1e-300) + log_p[0]
        for t in range(1, T):
            trans      = delta[t-1, :, None] + log_A  # [K, K]
            psi[t]     = trans.argmax(0)
            delta[t]   = trans.max(0) + log_p[t]
        states = np.empty(T, int)
        states[-1] = delta[-1].argmax()
        for t in range(T - 2, -1, -1):
            states[t] = psi[t+1, states[t+1]]
        return states

    def predict_proba(self, X):
        log_p  = self._log_emit(X)
        la, _  = self._forward(log_p)
        lb     = self._backward(log_p)
        lg     = la + lb
        lg    -= logsumexp(lg, axis=1, keepdims=True)
        return np.exp(lg)


# ── Engine ────────────────────────────────────────────────────────────────────
class RegimeHMMEngine:
    RETRAIN_INTERVAL = 7 * 24 * 3600
    TRAINING_TICKER  = 'BTC-USD'
    TRAINING_PERIOD  = '2y'
    _PRED_TTL        = 300
    _training_in_progress = False

    def __init__(self):
        self.model  = None
        self.mu     = None
        self.sigma  = None
        self.trained_at = 0.0
        self._lock  = threading.Lock()
        self._cache: dict = {}

    # ── public ────────────────────────────────────────────────────────────────
    def predict_regime(self, ticker='BTC-USD') -> dict:
        now    = time.time()
        cached = self._cache.get(ticker)
        if cached and now - cached[1] < self._PRED_TTL:
            return cached[0]

        if self.model is None:
            if not RegimeHMMEngine._training_in_progress:
                self.force_retrain()
            return {'ticker': ticker, 'current_state': 1,
                    'current_label': 'Compression', 'confidence': 0.0,
                    'probabilities': {'Risk-On': 33.3, 'Compression': 33.4, 'Dislocation': 33.3},
                    'training': True, 'note': 'HMM training in background (~60s). Refresh soon.'}

        payload = self._infer(ticker)
        self._cache[ticker] = (payload, now)
        return payload

    def force_retrain(self):
        if not RegimeHMMEngine._training_in_progress:
            threading.Thread(target=self._train, daemon=True).start()

    def start_background_retraining(self):
        threading.Thread(target=self._boot, daemon=True).start()

    # ── internals ─────────────────────────────────────────────────────────────
    def _boot(self):
        self._load_or_train()
        while True:
            time.sleep(self.RETRAIN_INTERVAL)
            self._train()

    def _load_or_train(self):
        if os.path.exists(_MODEL_PATH):
            try:
                with open(_MODEL_PATH, 'rb') as f:
                    s = pickle.load(f)
                if time.time() - s.get('trained_at', 0) < self.RETRAIN_INTERVAL:
                    self.model, self.mu, self.sigma = s['model'], s['mu'], s['sigma']
                    self.trained_at = s['trained_at']
                    print(f"[HMM] Loaded model (score {self.model.score_:.2f}, "
                          f"labels {self.model.state_labels})")
                    return
            except Exception as e:
                print(f'[HMM] Load failed: {e}')
        self._train()

    def _train(self):
        RegimeHMMEngine._training_in_progress = True
        print(f'[HMM] Training on BTC-USD ({self.TRAINING_PERIOD})…')
        try:
            raw = yf.download(self.TRAINING_TICKER, period=self.TRAINING_PERIOD,
                              interval='1d', progress=False)
            prices = raw['Close']
            if hasattr(prices, 'columns'):
                prices = prices.iloc[:, 0]
            prices = prices.dropna().values.astype(np.float64)

            X       = _build_features(prices)
            Xn, mu, sigma = _zscore(X)

            model = GaussianHMM(n_components=3, n_iter=80)
            model.fit(Xn)

            with self._lock:
                self.model, self.mu, self.sigma = model, mu, sigma
                self.trained_at = time.time()
                self._cache.clear()

            with open(_MODEL_PATH, 'wb') as f:
                pickle.dump({'model': model, 'mu': mu, 'sigma': sigma,
                             'trained_at': self.trained_at}, f)

            print(f'[HMM] Done. Score={model.score_:.2f}  Labels={model.state_labels}')
        except Exception as e:
            print(f'[HMM] Training failed: {e}')
        finally:
            RegimeHMMEngine._training_in_progress = False

    def _infer(self, ticker):
        try:
            raw = yf.download(ticker, period='90d', interval='1d', progress=False)
            prices = raw['Close']
            if hasattr(prices, 'columns'):
                prices = prices.iloc[:, 0]
            prices = prices.dropna().values.astype(np.float64)
            X  = _build_features(prices)
            Xn, _, _ = _zscore(X, self.mu, self.sigma)

            states = self.model.predict(Xn)
            probs  = self.model.predict_proba(Xn)
            cur    = int(states[-1])
            label  = self.model.state_labels.get(cur, 'Compression')
            conf   = round(float(probs[-1, cur]) * 100, 1)

            history = []
            for i, (s, p) in enumerate(zip(states[-30:], probs[-30:])):
                d = (datetime.utcnow() - timedelta(days=len(states[-30:])-1-i)).strftime('%Y-%m-%d')
                history.append({'date': d, 'state': int(s),
                                'label': self.model.state_labels.get(int(s), 'Compression'),
                                'confidence': round(float(p[s])*100, 1)})
            return {
                'ticker': ticker, 'current_state': cur,
                'current_label': label, 'confidence': conf,
                'probabilities': {self.model.state_labels.get(k, str(k)): round(float(v)*100,1)
                                  for k, v in enumerate(probs[-1])},
                'model_score': round(float(self.model.score_), 2),
                'trained_at':  datetime.utcfromtimestamp(self.trained_at).isoformat()+'Z',
                'history':     history,
            }
        except Exception as e:
            print(f'[HMM] Inference error {ticker}: {e}')
            return {'ticker': ticker, 'current_label': 'Compression',
                    'confidence': 0, 'error': str(e)}


HMM_ENGINE = RegimeHMMEngine()
