#!/usr/bin/env python3
"""Patch H1/H2 headings across remaining view files."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def patch(rel_path, old, new):
    path = os.path.join(BASE, rel_path)
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    if old in content:
        updated = content.replace(old, new, 1)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f"  PATCHED: {rel_path}")
    else:
        print(f"  NO MATCH: {rel_path}")

H2_STYLE = 'font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px'

# ── narrative.js ──────────────────────────────────────────────────────────────
print("\nnarrative.js")
patch(
    'js/views/narrative.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">NLP</span></h1>',
    f'<h2 style="{H2_STYLE}">Alpha Strategy Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">hub</span>Narrative Galaxy <span class="premium-badge">NLP</span></h1>'
)

# ── liquidity-archive.js (Signal Archive) ─────────────────────────────────────
print("\nliquidity-archive.js")
patch(
    'js/views/liquidity-archive.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">electric_bolt</span>Alpha Strategy <span class="premium-badge">LIVE</span></h2>',
    f'<h2 style="{H2_STYLE}">Alpha Strategy Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">archive</span>Signal Archive <span class="premium-badge">LIVE</span></h1>'
)

# ── trade-lab.js (Institutional Hub — Token Unlocks entry) ───────────────────
print("\ntrade-lab.js — renderTokenUnlocks")
patch(
    'js/views/trade-lab.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Institutional Hub <span class="premium-badge">PRO</span></h1>',
    f'<h2 style="{H2_STYLE}">Institutional Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">key</span>Token Unlocks <span class="premium-badge">PRO</span></h1>'
)
# Trade Ledger h2 inside trade-lab
print("trade-lab.js — Trade Ledger h2 eyebrow")
patch(
    'js/views/trade-lab.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">assignment</span>Audit &amp; Performance <span class="premium-badge">AUDIT</span></h2>',
    f'<h2 style="{H2_STYLE}">Audit &amp; Performance</h2>\n                    <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">list_alt</span>Trade Ledger <span class="premium-badge">AUDIT</span></h1>'
)

# ── performance.js ────────────────────────────────────────────────────────────
print("\nperformance.js — renderPerformanceDashboard")
patch(
    'js/views/performance.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">assignment</span>Audit &amp; Performance <span class="premium-badge">LIVE</span></h1>',
    f'<h2 style="{H2_STYLE}">Audit &amp; Performance</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">trending_up</span>Performance Dashboard <span class="premium-badge">LIVE</span></h1>'
)
# Also fix the two Macro Intel h2s inside performance.js
print("performance.js — Macro Intel placeholders")
patch(
    'js/views/performance.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">LIVE</span></h2>',
    f'<h2 style="{H2_STYLE}">Audit &amp; Performance</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Market Intelligence <span class="premium-badge">LIVE</span></h1>'
)

# ── alerts-archive.js — renderAlerts skeleton placeholder ─────────────────────
print("\nalerts-archive.js — skeleton placeholder")
patch(
    'js/views/alerts-archive.js',
    'appEl.innerHTML = `<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">LIVE</span></h1>${skeleton(2)}`;',
    f'appEl.innerHTML = `<h2 style="{H2_STYLE}">Alerts Hub</h2><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications</span>Live Alerts <span class="premium-badge">LIVE</span></h1>${{skeleton(2)}}`;'
)
# renderAlerts main heading
print("alerts-archive.js — Live Alerts h2")
patch(
    'js/views/alerts-archive.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">notifications_active</span>Live Intelligence Alerts <span class="premium-badge">LIVE</span></h2>',
    f'<h2 style="{H2_STYLE}">Alerts Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications</span>Live Alerts <span class="premium-badge">LIVE</span></h1>'
)
# Market Regime skeleton placeholder
print("alerts-archive.js — Market Regime skeleton")
patch(
    'js/views/alerts-archive.js',
    'appEl.innerHTML = `<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">ML</span></h2>',
    f'appEl.innerHTML = `<h2 style="{H2_STYLE}">Alerts Hub</h2><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">layers</span>Market Regime <span class="premium-badge">ML</span></h1>'
)

print("\nDone.")
