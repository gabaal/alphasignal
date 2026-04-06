#!/usr/bin/env python3
"""Fix the remaining 2 no-match headings."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
H2_STYLE = 'font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px'

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
        # Show what line 8 actually contains for debug
        for i, line in enumerate(content.split('\n')):
            if 'h1' in line.lower() and 'audit' in line.lower():
                print(f"    Line {i+1} repr: {repr(line[:200])}")

# performance.js line 8 uses a literal & not &amp;
patch(
    'js/views/performance.js',
    '<h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">assignment</span>Audit & Performance <span class="premium-badge">LIVE</span></h1>',
    f'<h2 style="{H2_STYLE}">Audit &amp; Performance</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">trending_up</span>Performance Dashboard <span class="premium-badge">LIVE</span></h1>'
)

# alerts-archive main renderAlerts heading (the h2 with notifications_active icon)
patch(
    'js/views/alerts-archive.js',
    '<h2><span class="material-symbols-outlined" style="vertical-align:middle; margin-right:8px; color:var(--accent)">notifications_active</span>Live Intelligence Alerts <span class="premium-badge">LIVE</span></h2>',
    f'<h2 style="{H2_STYLE}">Alerts Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications</span>Live Alerts <span class="premium-badge">LIVE</span></h1>'
)

print("Done.")
