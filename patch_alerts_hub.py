#!/usr/bin/env python3
"""Patch Alerts Hub headings — add H2 eyebrow to Price Alerts, Signal Leaderboard, Market Brief."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
H2 = 'font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px'

def patch(rel_path, old, new, label=''):
    path = os.path.join(BASE, rel_path)
    content = open(path, 'r', encoding='utf-8', errors='replace').read()
    if old in content:
        open(path, 'w', encoding='utf-8').write(content.replace(old, new, 1))
        print(f"  PATCHED [{label}]: {rel_path}")
    else:
        print(f"  NO MATCH [{label}]: {rel_path}")

# ── 1. price-alerts.js ────────────────────────────────────────────────────────
print("\nprice-alerts.js — Price Alerts")
patch(
    'js/views/price-alerts.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications_active</span>Price Alerts <span class="premium-badge">LIVE</span></h1>',
    f'<h2 style="{H2}">Alerts Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications_active</span>Price Alerts <span class="premium-badge">LIVE</span></h1>',
    'Price Alerts H2'
)

# ── 2. signal-leaderboard.js ──────────────────────────────────────────────────
print("\nsignal-leaderboard.js — Leaderboard")
patch(
    'js/views/signal-leaderboard.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">leaderboard</span>Signal Performance <span class="premium-badge">LIVE TRACK RECORD</span></h1>',
    f'<h2 style="{H2}">Alerts Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">leaderboard</span>Signal Leaderboard <span class="premium-badge">LIVE</span></h1>',
    'Leaderboard H2'
)

# ── 3. market-brief.js ────────────────────────────────────────────────────────
print("\nmarket-brief.js — Market Brief")
patch(
    'js/views/market-brief.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">article</span>AI Market Brief</h1>',
    f'<h2 style="{H2}">Alerts Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">article</span>AI Market Brief <span class="premium-badge">AI</span></h1>',
    'Market Brief H2'
)

print("\nDone.")
