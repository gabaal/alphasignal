# AlphaSignal's Charts Are Different. Here's Why That Matters.

## TradingView shows you price. AlphaSignal shows you what's happening underneath it.

***

Open any crypto chart and you'll see the same thing: candlesticks, maybe a moving average or two, an RSI at the bottom. This is the standard retail setup, and it's been the standard retail setup for thirty years.

The problem is that retail traders are looking at a summary of what already happened. They're reading the minutes *after* the meeting. The institutional players who moved the price read the agenda *before* it.

The data that drives institutional decisions — order flow, volume distribution, market regime classification — is available. It's just not on the standard chart. The [AlphaSignal](https://alphasignal.digital) chart view adds it. This article explains what each layer means and how to use it.

***

### Layer 1: Volume Profile — Where Price Actually Lives

Standard volume bars tell you *when* trading happened. **Volume Profile** tells you *where*.

Instead of a bar at the bottom of your chart showing total volume per candle, Volume Profile rotates the data and shows you how much volume traded at each **price level** — creating a horizontal histogram on the right side of the chart.

Three concepts you need to understand:

**Point of Control (POC)** — The price level where the most volume has traded in the current period. This is the market's centre of gravity. Price has a strong tendency to return to the POC after extended moves away from it.

**High Volume Nodes (HVN)** — Areas where a large amount of trading occurred. Price tends to slow down, consolidate, and chop around these zones. If you're entering a trade and a major HVN is sitting just above your entry, expect resistance there.

**Low Volume Nodes (LVN) — the "Air Pockets"** — Zones where very little trading occurred. Price moves through these zones *fast* — there's no liquidity to slow it down. When price breaks out of consolidation into an LVN, that's when you get the explosive vertical moves that look shocking on a standard chart but make complete sense on a Volume Profile.

```
Price │  Volume
──────┼──────────────────────────
72K   │ ████ (HVN - resistance)
71K   │ ██
70K   │ █ (LVN - air pocket)
69K   │ ██
68K   │ ████████████ (POC)
67K   │ ██████
66K   │ ████ (HVN - support)
```

If price breaks above 68K (the POC) in this example, the thin zone around 70K means it could reach 71K–72K very quickly. That's the air pocket in action.

***

### Layer 2: CVD — The Invisible Indicator

**Cumulative Volume Delta (CVD)** is the single most underused tool in retail trading. Almost no one talks about it. Almost every professional monitors it.

CVD measures the running difference between buying volume and selling volume at the market (the "delta"). When someone buys at the ask price, that's positive delta — aggressive buying. When someone sells at the bid, that's negative delta — aggressive selling.

CVD tracks this and accumulates it over time. The result is a line that tells you whether the net pressure in the market is buying or selling, *regardless of what price is doing*.

Why does this matter? Because price and CVD can diverge — and divergences are where the real edge is.

**Bearish CVD Divergence:** Price makes a new high, but CVD makes a lower high. This means price went up, but the buying pressure that drove it is weakening. Someone is selling into the strength. This setup precedes some of the sharpest reversals in the market.

**Bullish CVD Divergence:** Price makes a new low, but CVD makes a higher low. Despite price falling, fewer sellers are aggressively hitting the bid. Buying pressure is quietly increasing underneath the surface.

```
Price:  ↗ New High         ↗↗ Higher High
CVD:    ↗ Initial High     ↘  Lower High   ← DIVERGENCE
                                              (distribution)
```

AlphaSignal renders CVD directly on the chart so you can spot these divergences without any manual calculation.

***

### Layer 3: The Market Regime Overlay

This is the layer that changes how you interpret everything else.

The **Hidden Markov Model (HMM)** runs continuously on every tracked asset, classifying the current market state into one of three regimes:

- **State 1 — Trending Up:** The asset is in a confirmed uptrend. Momentum is positive, volatility is expanding in the upward direction. Long signals are highest-probability here. Short signals should be avoided or sized down significantly.

- **State 2 — Mean-Reverting (Choppy):** The asset is range-bound. Price oscillates around a mean without directional conviction. Breakout trades will fail here. Mean-reversion plays (buy support, sell resistance) are higher-probability. This is also the regime where most beginners get destroyed chasing breakouts.

- **State 3 — Trending Down:** The inverse of State 1. Short signals are highest-probability. Long signals should be avoided. This is not the place to "buy the dip."

The regime overlay appears as a background colour on the chart:
- **Green background:** State 1 (Trending Up)
- **Grey/neutral background:** State 2 (Mean-Reverting)
- **Red background:** State 3 (Trending Down)

When a signal fires, the regime it fired in is embedded in the signal card. A Long signal that fires in a State 2 regime has a lower confidence score than the same signal firing in State 1. The system knows. The system adjusts. You should too.

***

### Layer 4: Signal Markers — The Audit Trail

Every time a signal fires, it places a marker directly on the chart: a small flag at the entry price, with a dotted line showing the TP1, TP2, and SL levels.

This creates an instant audit trail. You can scroll back through any chart and see exactly where every signal fired, what the targets were, and what price did afterwards.

This is not about cherry-picking wins. It's about pattern recognition. Over time, you start to notice which setups on which assets in which regimes have the best follow-through. That's how you build your own signal filter on top of the system's.

***

### Try This

Open [alphasignal.digital](https://alphasignal.digital) and pull up the BTC/USDT chart.

1. Find the Point of Control on the current Volume Profile — is BTC above or below it right now?
2. Look at the CVD line — is it trending in the same direction as price, or diverging?
3. Check the regime overlay — what colour is the background? What does that tell you about which type of trades to favour today?

Answer all three before you look at a single signal.

In Part 4, we go off the chart entirely and into the Block Radar — the real-time feed of what institutions are actually doing with their money.

***

*Part 3 of the "Trading with AlphaSignal" series by [AlphaSignal](https://alphasignal.digital).*
