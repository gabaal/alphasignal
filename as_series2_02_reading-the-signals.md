# How to Read an AlphaSignal Trade Signal (Without Blindly Following It)

## Every signal tells a story. Here's how to decode it.

***

A signal is only as good as your ability to understand what produced it.

Most traders treat signals like lottery tickets — you either follow them or you don't, and you have no idea why they win or lose. That's not trading. That's gambling with extra steps.

[AlphaSignal](https://alphasignal.digital) is built around the opposite philosophy: every signal comes with its full context baked in, so you can make an informed decision about whether to act on it. In this article, I'll walk you through the anatomy of a signal, the pipeline that generates it, and how to build your own filter on top of it.

***

### The Anatomy of a Signal

Every signal in the AlphaSignal feed contains the following fields:

```
Asset:         BTC/USDT
Direction:     LONG
Entry:         $67,400 – $67,800
Stop Loss:     $66,100
TP1:           $69,500
TP2:           $72,000
Confidence:    74%
Regime:        Trending Up (HMM State 1)
Z-Score:       -2.61
Trigger:       Volume Spike + Block Buy Cluster
Timeframe:     4H
```

Let's unpack each one.

**Asset & Direction** — Self-explanatory. Long = you expect the price to go up. Short = you expect it to go down.

**Entry Zone** — Not a single price, but a range. This is intentional. Markets are not precise. The entry zone represents the statistical area where the setup has historically had the best risk-to-reward. If price blows through this zone without filling you, the setup is invalidated — don't chase it.

**Stop Loss (SL)** — The price at which the trade is wrong. This is not optional. If you remove the SL, you've transformed a calculated bet into a hope trade. The SL is placed below a structural level (support, volume node, or key swing low) that, if broken, invalidates the original thesis.

**TP1 and TP2** — Two staged exit targets. TP1 is the conservative target — the nearest high-probability resistance. TP2 is the full extension. The standard approach: close 50–60% of your position at TP1, move your stop to breakeven, and let the remainder run to TP2.

**Confidence Score** — The ML model's estimated probability of the trade hitting TP1 before the Stop Loss. A score of 74% means: across statistically similar setups in the training and walk-forward data, 74% hit TP1 first. This is not a guarantee. It is a base rate.

**Regime** — The current HMM (Hidden Markov Model) state of the asset. This is one of the most important fields. A Long signal firing in a mean-reverting regime has a fundamentally different character than the same signal firing in a trending-up regime. More on regimes in Part 3.

**Z-Score** — How statistically extreme the current price is relative to its historical mean. A reading of -2.61 means price is 2.61 standard deviations below the mean — a statistical outlier that has historically preceded reversals.

**Trigger** — What specifically fired the signal at this moment. Common triggers include: volume spikes, block trade clusters, Z-Score threshold crossings, or multi-timeframe momentum alignment.

***

### The 5-Step Pipeline

Signals don't appear from thin air. Every signal that appears in the feed has passed through a strict 5-step pipeline:

```
[Step 1] Z-Score Scan
         Is the asset at a statistical extreme (±2.5σ)?
                  │
                  ▼
[Step 2] ML Probability Gate
         Does the XGBoost classifier estimate >65% chance
         of hitting TP1 before SL?
                  │
                  ▼
[Step 3] Market Regime Filter
         Is the current HMM regime compatible
         with this signal direction?
                  │
                  ▼
[Step 4] Volume & Block Flow Confluence
         Is there a volume spike AND institutional
         block trade activity supporting the direction?
                  │
                  ▼
[Step 5] Multi-Timeframe Alignment
         Does the 1H trend align with the 4H trend?
                  │
                  ▼
        [SIGNAL FIRES → Signal Feed]
```

If any single step fails, the signal is suppressed. The system keeps a **Suppression Log** — a record of every setup that nearly fired but was blocked by one of the filters. This is worth reviewing: it shows you what the market offered that day and why the system chose to stay out.

***

### The Suppression Log: Why It Matters

This is the feature that most users ignore and most professionals appreciate.

On any given day, the Z-Score scanner might flag 40 statistical anomalies across all tracked assets. After the ML gate, regime filter, volume confluence check, and timeframe alignment, 2–4 signals might actually fire.

The other 36 are in the Suppression Log.

Reviewing the log teaches you the filters. You'll start to develop intuition for *why* certain setups were suppressed — and that intuition becomes your own edge on top of the system's.

***

### Your Checklist Before Acting on a Signal

The signal is a recommendation, not an order. Before you execute, run your own filter:

1. **Do I understand the regime?** Check the regime panel. Is this a favourable environment for this trade direction?
2. **Is the entry zone still valid?** If price is already 2% above the entry zone, the setup has changed. Don't enter late.
3. **What's my actual position size?** Use the 1% rule: your maximum loss on this trade should be 1% of your total account. Work backwards from the stop loss to calculate your position size.
4. **Is there a macro event in the next 12 hours?** CPI releases, FOMC meetings, and major news events can invalidate any technical setup instantly. Check your economic calendar before every entry.
5. **Am I emotionally neutral right now?** If you just had a loss, or just had a big win, your judgement is compromised. Skip the next trade.

If you can check all five — proceed. If you can't — wait.

***

### Try This

Open the [AlphaSignal Signal Feed](https://alphasignal.digital) and look at the most recent signal. Read every field. Ask yourself: if I were going to take this trade, what is my entry, my stop, and my exact position size based on my account?

Don't trade it yet. Just practise reading it.

In Part 3, we go deeper into the charts themselves — the layers that make AlphaSignal's chart view different from a standard TradingView setup.

***

*Part 2 of the "Trading with AlphaSignal" series by [AlphaSignal](https://alphasignal.digital).*
