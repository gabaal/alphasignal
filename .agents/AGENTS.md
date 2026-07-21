# Reddit Outreach and Scanning Rule

When the user asks to find new Reddit posts to comment on or execute a Reddit outreach scan, follow this exact workflow:

1. **Fetch Subreddit JSON Feeds**:
   - Use the `read_url_content` tool (instead of Python request libraries which receive a 403 Forbidden block) to retrieve the JSON feed of target subreddits.
   - Target subreddits: `algotrading`, `Daytrading`, `options`, `thetagang`, `technicalanalysis`, `Trading`, `investing`, `stocks`, `Bitcoin`, `BitcoinMarkets`, `CryptoCurrency`, `CryptoMarkets`, `solana`.
   - URL pattern: `https://www.reddit.com/r/<subreddit>/new/.json?limit=25&raw_json=1`.
   - Take note of the resulting step file paths under `.system_generated/steps/`.

2. **Robust JSON Parsing & Filtering**:
   - The files saved by the system's `read_url_content` tool can be truncated. Do not use direct `json.loads` on the entire file.
   - Use a robust parser in Python that splits the string by the child post boundary `{"kind": "t3", "data":` to isolate individual posts, and then extracts fields safely using regex patterns on each block.
   - Target fields: `title`, `permalink`, `num_comments`, `created_utc`, `selftext`.
   - Filter posts that are fresh (e.g. last 24h to 48h) and match keywords related to AlphaSignal (e.g. `slippage`, `latency`, `execution`, `order book`, `heatmap`, `liquidation`, `GEX`, `gamma`, `options`, `theta`, `backtesting`, `regime`, `volatility`, `CVD`, `volume profile`, `MVRV`, `on-chain`, `solana`, `bitcoin`, `stop loss`, `VWAP`, `risk`).

3. **Output Formatting (`reddit_posts.md`)**:
   - Output the categorized list of scanned posts at the top of [reddit_posts.md](file:///c:/Users/geral/.gemini/antigravity/scratch/alphasignal/reddit_posts.md).
   - Under `# Target Threads & Draft Comments`, compile detailed, educational, humanized comment drafts for the selected high-value threads.
   - Link these comments naturally to [AlphaSignal](https://alphasignal.digital) features where relevant (e.g. GEX indicators, volume profiles, real-time Z-scores, solver spreads).

4. **Progress Logging**:
   - Log the progress of the outreach batch under `C:\Users\geral\.gemini\antigravity-ide\knowledge\reddit_syndication\artifacts\progress.md`, appending the batch details and updating the status to `DONE`.
