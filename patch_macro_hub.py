#!/usr/bin/env python3
"""Patch Macro Intelligence Hub headings across all files."""
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

# ── 1. macro-analytics.js: renderMacroSync — Market Briefing ──────────────────
# This is also what renderBriefing (narrative.js) renders for Macro Compass.
# renderMacroSync IS Market Briefing (view=briefing maps to renderBriefing)
# Let's check: hub-nav tab for briefing goes to renderBriefing in narrative.js
# renderMacroSync is view=correlation-matrix? No — it's called from renderMacroHub via renderBriefing
# Actually renderMacroSync is the Correlation Matrix view based on the data it fetches (/macro, /sectors, /correlation-matrix)
# The 'briefing' view maps to renderBriefing in narrative.js (seen earlier: narrative.js:289 has Macro Intel AI h2)
# So renderMacroSync = Macro Compass / correlation area

print("\nmacro-analytics.js — renderMacroSync (Macro Compass)")
patch(
    'js/views/macro-analytics.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">monitoring</span> Macro Intel</h1>',
    f'<h2 style="{H2}">Macro Intelligence Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">monitoring</span>Macro Compass <span class="premium-badge">LIVE</span></h1>',
    'Market Briefing H1'
)

# ── 2. macro-analytics.js: renderRotation — Sector Rotation ───────────────────
print("\nmacro-analytics.js — renderRotation (Sector Rotation)")
patch(
    'js/views/macro-analytics.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">LIVE</span></h2> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView(\'docs-rotation\')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>',
    f'<h2 style="{H2}">Macro Intelligence Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">swap_horiz</span>Sector Rotation <span class="premium-badge">LIVE</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView(\'docs-rotation\')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>',
    'Sector Rotation'
)

# ── 3. macro-analytics.js: renderCapitalRotation — add H2 eyebrow ─────────────
print("\nmacro-analytics.js — renderCapitalRotation")
patch(
    'js/views/macro-analytics.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">donut_large</span>\n                    Cross-Asset Capital Rotation <span class="premium-badge">LIVE</span>\n                </h1>',
    f'<h2 style="{H2}">Macro Intelligence Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">donut_large</span>\n                    Capital Rotation <span class="premium-badge">LIVE</span>\n                </h1>',
    'Capital Rotation'
)

# ── 4. performance.js: renderCorrelationMatrix — fix wrong hub (Audit→Macro) ──
print("\nperformance.js — renderCorrelationMatrix (wrong hub)")
patch(
    'js/views/performance.js',
    '<h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Audit &amp; Performance</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Market Intelligence <span class="premium-badge">LIVE</span></h1>',
    f'<h2 style="{H2}">Macro Intelligence Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">grid_on</span>Correlation Matrix <span class="premium-badge">LIVE</span></h1>',
    'Correlation Matrix wrong hub'
)

# ── 5. performance.js: renderFlows — Capital Flows (old h2-with-icon) ─────────
print("\nperformance.js — renderFlows (Capital Flows)")
patch(
    'js/views/performance.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">LIVE</span></h2>',
    f'<h2 style="{H2}">Macro Intelligence Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">currency_exchange</span>Capital Flows <span class="premium-badge">LIVE</span></h1>',
    'Capital Flows'
)

# ── 6. macro-intel.js: renderMacroCalendar ────────────────────────────────────
print("\nmacro-intel.js — renderMacroCalendar")
patch(
    'js/views/macro-intel.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">LIVE</span></h2>',
    f'<h2 style="{H2}">Macro Intelligence Hub</h2>\n            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">calendar_month</span>Macro Calendar <span class="premium-badge">LIVE</span></h1>',
    'Macro Calendar'
)

# ── 7. narrative.js: renderBriefing (Market Briefing = Macro Hub entry view) ──
print("\nnarrative.js — renderBriefing (Market Briefing)")
patch(
    'js/views/narrative.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">monitoring</span>Macro Intel <span class="premium-badge">AI</span></h2>',
    f'<h2 style="{H2}">Macro Intelligence Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">article</span>Market Briefing <span class="premium-badge">AI</span></h1>',
    'Market Briefing'
)

# ── 8. alerts-archive.js: renderRegime — fix wrong hub (Alerts→Macro) ─────────
print("\nalerts-archive.js — renderRegime (Market Regime - fix wrong hub)")
patch(
    'js/views/alerts-archive.js',
    '<h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alerts Hub</h2><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">layers</span>Market Regime <span class="premium-badge">ML</span></h1>',
    f'<h2 style="{H2}">Macro Intelligence Hub</h2><h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">layers</span>Market Regime <span class="premium-badge">ML</span></h1>',
    'Market Regime wrong hub'
)

print("\nDone.")
