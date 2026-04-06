#!/usr/bin/env python3
"""Patch Institutional Hub headings across all files."""
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

# ── 1. global-markets.js: renderTokenUnlocks ──────────────────────────────────
# Has: stale h2 "Token Unlock Schedule" + old h2-with-icon "Institutional Hub LIVE"
# Fix: replace both with proper H2 eyebrow + H1
print("\nglobal-markets.js — renderTokenUnlocks")
patch(
    'js/views/global-markets.js',
    '            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">Token Unlock Schedule</h2>\n            <h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Institutional Hub <span class="premium-badge">LIVE</span></h2>',
    f'            <h2 style="{H2}">Institutional Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Token Unlocks <span class="premium-badge">PRO</span></h1>',
    'Token Unlocks'
)

# ── 2. global-markets.js: renderYieldLab ──────────────────────────────────────
# Has: stale h2 "DeFi Yield Lab" + old h2-with-icon "Institutional Hub BETA"
print("\nglobal-markets.js — renderYieldLab")
patch(
    'js/views/global-markets.js',
    '            <h2 style="font-size:0.75rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:1rem 0 1.5rem">DeFi Yield Lab</h2>\n            <h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Institutional Hub <span class="premium-badge">BETA</span></h2>',
    f'            <h2 style="{H2}">Institutional Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">biotech</span>Yield Lab <span class="premium-badge">BETA</span></h1>',
    'Yield Lab'
)

# ── 3. portfolio.js: renderPortfolioLab — Portfolio Optimizer ─────────────────
# Has: old h1 "Institutional Hub PRO" (hub name as H1, no H2)
print("\nportfolio.js — renderPortfolioLab (Portfolio Optimizer)")
patch(
    'js/views/portfolio.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Institutional Hub <span class="premium-badge">PRO</span></h1>',
    f'<h2 style="{H2}">Institutional Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">auto_mode</span>Portfolio Optimizer <span class="premium-badge">PRO</span></h1>',
    'Portfolio Optimizer'
)

# ── 4. trade-lab.js (renderTradeLab) — CRITICAL: H1 shows "Token Unlocks PRO" ─
# Has: H2 "Institutional Hub" (correct) but H1 "Token Unlocks PRO" (WRONG!)
print("\ntrade-lab.js — renderTradeLab (Trade Idea Lab CRITICAL FIX)")
patch(
    'js/views/trade-lab.js',
    '<h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Institutional Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Token Unlocks <span class="premium-badge">PRO</span></h1>',
    f'<h2 style="{H2}">Institutional Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">experiment</span>Trade Idea Lab <span class="premium-badge">PRO</span></h1>',
    'Trade Idea Lab CRITICAL FIX'
)

# ── 5. onchain.js: renderAIRebalancerView — AI Rebalancer ─────────────────────
# Has: old h2-with-icon "AI Portfolio Rebalancer AI" (no H2 eyebrow, H1 is h2)
print("\nonchain.js — renderAIRebalancerView (AI Rebalancer)")
patch(
    'js/views/onchain.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">smart_toy</span>AI Portfolio Rebalancer <span class="premium-badge">AI</span></h2>',
    f'<h2 style="{H2}">Institutional Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">smart_toy</span>AI Rebalancer <span class="premium-badge">AI</span></h1>',
    'AI Rebalancer'
)

print("\nDone.")
