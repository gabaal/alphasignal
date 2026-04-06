#!/usr/bin/env python3
H2_STYLE = 'font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px'

path = 'js/views/alerts-archive.js'
content = open(path, encoding='utf-8', errors='replace').read()

old = '<h2><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications_active</span>Live Intelligence Alerts <span class="premium-badge">LIVE</span></h2>'
new = f'<h2 style="{H2_STYLE}">Alerts Hub</h2>\n                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">notifications</span>Live Alerts <span class="premium-badge">LIVE</span></h1>'

# Try with the extra space variant too
old2 = old.replace('margin-right:8px;color', 'margin-right:8px; color')

if old in content:
    content = content.replace(old, new, 1)
    print("PATCHED (no space variant)")
elif old2 in content:
    content = content.replace(old2, new, 1)
    print("PATCHED (space variant)")
else:
    print("NO MATCH - showing context:")
    idx = content.find('notifications_active')
    print(repr(content[max(0,idx-80):idx+300]))

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
