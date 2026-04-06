#!/usr/bin/env python3
"""Fix 4 heading issues found during browser verification."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
H2_STYLE = 'font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px'

def patch(rel_path, old, new, label=''):
    path = os.path.join(BASE, rel_path)
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    if old in content:
        updated = content.replace(old, new, 1)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f"  PATCHED: {rel_path} [{label}]")
    else:
        print(f"  NO MATCH: {rel_path} [{label}]")

# ── 1. trade-lab.js: remove redundant old h2 'Trade Intelligence Lab' above the correct pair ──
print("\ntrade-lab.js — remove stale h2 eyebrow")
patch(
    'js/views/trade-lab.js',
    '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Trade Intelligence Lab</h2>\n                <h2',
    f'<h2',
    'remove stale Trade Intelligence Lab eyebrow'
)

# ── 2. performance.js: remove redundant old h2 'Performance Analytics Dashboard' ──
print("\nperformance.js — remove stale h2 eyebrow")
patch(
    'js/views/performance.js',
    '<h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Performance Analytics Dashboard</h2>\n                <h2',
    f'<h2',
    'remove stale Performance Analytics Dashboard eyebrow'
)

# ── 3. performance.js: fix the loaded-state heading (line 26) - old h2 with icon ──
print("\nperformance.js — fix loaded-state h2")
patch(
    'js/views/performance.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">trending_up</span> Institutional Alpha Performance <span class="premium-badge">LIVE</span></h2>',
    f'<h2 style="{H2_STYLE}">Audit &amp; Performance</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">trending_up</span>Performance Dashboard <span class="premium-badge">LIVE</span></h1>',
    'fix loaded-state heading'
)

# ── 4. global-markets.js: add H2 eyebrow above H1 ──
print("\nglobal-markets.js — add H2 eyebrow")
patch(
    'js/views/global-markets.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">public</span>Global Markets <span class="premium-badge">LIVE</span></h1>',
    f'<h2 style="{H2_STYLE}">Global Markets Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">public</span>Global Markets <span class="premium-badge">LIVE</span></h1>',
    'add H2 eyebrow'
)

# ── 5. onchain.js: Backtester V2 H1 has text-transform:uppercase in its style — remove it ──
print("\nonchain.js — remove text-transform from Backtester V2 H1")
patch(
    'js/views/onchain.js',
    '<h1 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 1.5rem">Signal Backtester V2</h1>',
    '<h1 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin:0 0 1.5rem">Signal Backtester V2</h1>',
    'remove uppercase from H1'
)

print("\nDone.")
