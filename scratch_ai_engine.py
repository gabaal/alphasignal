import re

with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\routes\ai_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update variables
text = re.sub(
    r"put_oi = post_data\.get\('put_oi', 'N/A'\)",
    "skew = post_data.get('skew', 'N/A')\n        exp_move = post_data.get('exp_move', 'N/A')\n        zero_gamma = post_data.get('zero_gamma', 'N/A')\n        anomalies = post_data.get('anomalies', 0)",
    text
)

# 2. Update context string
text = re.sub(
    r"f\"Call OI: \{call_oi\}\\n\"\s+f\"Put OI: \{put_oi\}\\n\"",
    "f\"Zero-Gamma Pivot: ${zero_gamma}\\n\"\n            f\"Expected 7D Move: -${exp_move}\\n\"\n            f\"25-Delta Skew: {skew}%\\n\"\n            f\"Unusual Flow Anomalies: {anomalies} strikes\\n\"",
    text
)

# 3. Update system prompt
text = re.sub(
    r"First paragraph: Summarize the current positioning based on the Put/Call Ratio, Max Pain, and Implied Volatility\.\s+\"Second paragraph: Give an actionable takeaway for a trader based on the IV Rank and Open Interest imbalance \(\w+\.\w+\., are options cheap/expensive, are institutions bidding calls for a breakout or puts for a hedge\?\)\.",
    "First paragraph: Summarize institutional positioning based on PCR, the Expected Move boundaries, and whether they are pinned at the Zero-Gamma strike. \"\n            \"Second paragraph: Give an actionable structural takeaway based on the Skew (are they heavily bidding puts for fear or calls for FOMO?) and identify if there is unusual volume anomalous flow occurring today.",
    text
)

with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\routes\ai_engine.py', 'w', encoding='utf-8') as f:
    f.write(text)
