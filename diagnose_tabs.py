#!/usr/bin/env python3
"""
Manual fixes for the 5 remaining stranded tab blocks.
Each entry: (file, old_block, new_block)
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def patch(rel, old, new, label=''):
    path = os.path.join(BASE, rel)
    content = open(path, 'r', encoding='utf-8', errors='replace').read()
    if old in content:
        open(path, 'w', encoding='utf-8').write(content.replace(old, new, 1))
        print(f'  PATCHED [{label}]')
    else:
        print(f'  NO MATCH [{label}]')

# ── 1. global-markets.js: renderCMEGaps ───────────────────────────────────────
print('\nglobal-markets.js: CME Gaps')
patch('js/views/global-markets.js',
    '        ${renderHubTabs(\'gaps\', tabs)}\n            \n            </div>\n        </div>',
    '        </div>\n        ${renderHubTabs(\'gaps\', tabs)}',
    'CME Gaps')

# ── 2. macro-analytics.js: renderRotation ─────────────────────────────────────
print('\nmacro-analytics.js: Sector Rotation')
patch('js/views/macro-analytics.js',
    '                ${renderHubTabs(\'rotation\', tabs)}\n                </div>\n            </div>',
    '                </div>\n        </div>\n        ${renderHubTabs(\'rotation\', tabs)}',
    'Sector Rotation')

# ── 3. onchain.js: TradingView Hub or Custom Analytics ────────────────────────
# check what's at line 1182
lines = open('js/views/onchain.js', encoding='utf-8', errors='replace').readlines()
print(f'\nonchain.js ~1182: {lines[1181].strip()[:100]}')
print(f'  context: {lines[1183].strip()[:100]}')

# ── 4. signals.js: Alpha Score ─────────────────────────────────────────────────
print('\nsignals.js: Alpha Score')
lines_s = open('js/views/signals.js', encoding='utf-8', errors='replace').readlines()
print(f'  ~585: {lines_s[584].strip()[:120]}')
print(f'  ~586: {lines_s[585].strip()[:120]}')
print(f'  ~587: {lines_s[586].strip()[:120]}')

# ── 5. trade-lab.js ────────────────────────────────────────────────────────────
print('\ntrade-lab.js:')
lines_t = open('js/views/trade-lab.js', encoding='utf-8', errors='replace').readlines()
for i in range(5, 15):
    print(f'  {i+1}: {lines_t[i].strip()[:120]}')
