# The Block Radar: How to Watch What Institutions Are Actually Doing

## Big money leaves footprints. AlphaSignal tracks them in real time.

***

Retail traders watch price. Institutions *make* price.

This is the fundamental asymmetry that causes most retail traders to lose money. They are reacting to the outcome of institutional decisions rather than reading the decisions themselves.

There's a way to close that gap. Institutions move large amounts of capital, and when they do, they leave a very specific kind of footprint in the market data: **block trades**. AlphaSignal's Block Radar tracks these in real time, across every major exchange, for every major asset it covers.

This article explains what block trades are, how to read the Block Radar feed, and how to use it to sharpen your timing.

***

### What Is a Block Trade?

In traditional finance, a "block trade" is any transaction large enough to move the market. In crypto, there's no formal threshold, but the principle is the same: when a single order is large enough that it can't be filled at the best available price without eating through multiple levels of the order book, it qualifies as a block.

AlphaSignal's Block Radar monitors for trades above a defined notional threshold (varies by asset — larger for BTC, smaller for mid-caps) and logs them in real time.

Each entry in the Block Radar shows:

```
Time:       09:14:32 UTC
Asset:      BTC/USDT
Exchange:   Binance
Size:        $4,200,000
Direction:  BUY (Buy-side aggressor)
Price:      $67,420
Regime:     Trending Up
```

Let's unpack **Direction** — this is the most important field.

**Buy-side aggressor** means a large buyer hit the ask price — they paid the market price without waiting. This is urgency. Someone with $4.2M needed to own BTC *right now* and didn't want to wait for sellers to come to them. Institutional urgency is one of the clearest signals of conviction.

**Sell-side aggressor** is the inverse: a large seller hit the bid. Someone needed out, fast, at market price.

***

### Distribution vs. Accumulation: Reading the Flow

Individual block trades are interesting. Clusters of block trades are decisive.

**Accumulation** looks like this: multiple large buy-side blocks appearing at or near a known support level, often while retail sentiment is negative or neutral. Institutions are absorbing sell pressure and building a position. Price often remains flat or drifts slightly lower during accumulation — because the institution *wants* to buy more before the price moves.

```
Support Level: $66,800
────────────────────────────────────────
09:01  BUY $2.1M @ $66,850  ← Block
09:14  BUY $4.2M @ $67,420  ← Block
09:31  BUY $1.8M @ $66,900  ← Block
09:47  SELL $0.3M @ $67,100 (retail)
10:12  BUY $3.1M @ $67,200  ← Block
────────────────────────────────────────
→ Price breaks upward at 10:30
```

By the time the breakout happens on a retail chart, the informed position was built over an hour. The retail trader buys the breakout candle — the institutional trader was already in at $66,850.

**Distribution** is the mirror image: clusters of large sell-side blocks near resistance, often while retail sentiment is bullish. Institutions are offloading their position into the retail buying pressure. The price might still drift higher for a time — because retail FOMO is holding it up — but the smart money is already out.

This is why chasing breakouts without checking the Block Radar is dangerous. A breakout to a new local high accompanied by heavy sell-side blocks is a distribution trap. Price will fail and reverse — usually violently.

***

### How to Use Block Radar in Practice

**1. Check before you enter**
Before acting on any signal, pull up the Block Radar filtered for the asset in question. In the last 2–4 hours, has the block flow been predominantly buy-side or sell-side? This is your directional confirmation layer.

A Long signal with buy-side blocks clustered at your entry zone = high-conviction setup.
A Long signal with sell-side blocks dominating the recent feed = reconsider.

**2. Use it to time your entry**
If you're planning a long position at a support level, don't just set a limit order and walk away. Monitor the Block Radar. When you see a large buy-side block print at or near your support level, that's your timing cue — institutions are stepping in.

**3. Watch for regime confirmation**
The Block Radar entry includes the current regime state. A buy block during a Trending Up regime carries different weight than the same block during a Mean-Reverting regime. In a mean-reverting regime, even institutional buy blocks may be absorbed by the opposing resistance above — it's a tighter trade.

**4. Respect the anomalies**
Occasionally, you'll see a single block that dwarfs everything else on the feed — a $20M+ print on BTC or a disproportionately large block on a mid-cap. These are not normal institutional rebalancing. These are *intentional* moves by a very large player. Whatever direction that block prints, respect it. These events often precede significant price movements within the next 30–120 minutes.

***

### What Block Radar Won't Tell You

To be fair: block trades are not a crystal ball. A large buy block doesn't guarantee price will go up. Institutions can be wrong. Large players can also *hedge* — they might buy spot and short futures simultaneously, so a spot buy block isn't necessarily a directional bet.

What block flow tells you is **conviction** and **urgency**. It's one layer in a multi-layer system. Used alone, it's interesting. Used alongside regime data, Z-Scores, and volume profile, it becomes genuinely powerful.

***

### Try This

Open [alphasignal.digital](https://alphasignal.digital) and navigate to the Block Radar. Filter for BTC. Look at the last 4 hours of block prints.

Ask three questions:
1. Is the block flow predominantly buy-side or sell-side?
2. Are blocks clustering at a recognisable price level (support or resistance)?
3. What regime is BTC currently in?

Write down your read. Then check the price action over the next hour. Over time, this practice will sharpen your ability to read institutional intent faster than any indicator ever could.

In Part 5, we'll step back from real-time watching and talk about how to set up Z-Score alerts — so the market comes to *you* instead.

***

*Part 4 of the "Trading with AlphaSignal" series by [AlphaSignal](https://alphasignal.digital).*
