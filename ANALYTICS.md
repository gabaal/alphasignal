# AlphaSignal: Advanced Analytics & Risk Management

This document provides a technical overview of the institutional-grade risk metrics and correlation analytics implemented in Phase 6 of the AlphaSignal project.

## 1. Portfolio Risk Engine

The Risk Engine calculates key performance and safety metrics for the simulated Alpha-weighted portfolio vs. a BTC-USD benchmark.

### Value at Risk (VaR) 95%
- **Definition**: The maximum expected loss of the portfolio over a 1-day horizon with 95% confidence.
- **Logic**: Uses the Historical Simulation method on the last 30 days of realized returns.
- **Interpretation**: A VaR of -2.5% means there is a 5% chance the portfolio will lose more than 2.5% in a single day.

### Portfolio Beta
- **Definition**: A measure of the portfolio's volatility relative to the BTC-USD benchmark.
- **Logic**: Calculated as `Covariance(Portfolio, Benchmark) / Variance(Benchmark)` using daily returns.
- **Interpretation**: A Beta of 1.1 implies the portfolio is 10% more volatile than Bitcoin and tends to move in the same direction.

### Sortino Ratio
- **Definition**: A risk-adjusted return metric that only penalizes "downside" volatility (returns below 0).
- **Logic**: `(Annualized Return - Risk-Free Rate) / Downside Deviation`.
- **Interpretation**: A higher Sortino ratio indicates more efficient returns per unit of bad risk.

---

## 2. Correlation Analytics

The **Cross-Asset Correlation Matrix** provides a real-time heatmap of internal dependencies between the 15 highest-ranked assets in the AlphaSignal universe.

### Methodology
- **Type**: Pearson Correlation Coefficient.
- **Window**: 30-day rolling returns.
- **Visualization**: 
    - **Cyan (Blue)**: Positive Correlation (Assets move together).
    - **Red**: Negative Correlation (Assets move in opposition).
    - **Intensity**: Stronger colors indicate higher absolute correlation values (`|r| -> 1`).

---

## 3. API Reference

### GET `/api/portfolio/risk`
Returns current risk metrics for the dynamic fund.
```json
{
  "metrics": {
    "var_95": -2.4,
    "beta": 0.85,
    "sortino": 1.92,
    "volatility_ann": 42.1
  }
}
```

### GET `/api/portfolio/correlations`
Returns a flattened matrix of asset-to-asset correlation values.
```json
{
  "matrix": [
    {"x": "BTC", "y": "ETH", "v": 0.92},
    {"x": "BTC", "y": "SOL", "v": 0.74}
  ],
  "tickers": ["BTC", "ETH", "SOL", "..."]
}
```
