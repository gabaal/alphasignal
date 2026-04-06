#!/usr/bin/env python3
"""
Fix tab-before-heading issue globally.

Pattern A (tabs inside view-header > div before h2):
  <div>
      ${renderHubTabs('xxx', tabs)}
      <h2 style="font-size:0.65rem...

→ Remove tabs from inside div, inject ${tabHTML} AFTER the </div> closing the view-header.

Pattern B (tabs inside view-header directly before h2):
  <div class="view-header">
      ${renderHubTabs('xxx', tabs)}  or  ${tabs ? renderHubTabs(...) : ''}
      <h2 style="font-size:0.65rem...

→ Same: remove tabs from view-header, put after.

Strategy: use regex to find and reorder these blocks file-by-file.
"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))
VIEWS = os.path.join(BASE, 'js', 'views')

# Pattern: ${renderHubTabs('xxx', tabs)} or ${tabs ? renderHubTabs('xxx', tabs) : ''}
# followed (within ~10 lines) by <h2 style="font-size:0.65rem
# We want to:
#   1. Capture the full hub-tabs expression (any variant)
#   2. Remove it from its current position
#   3. Insert it after the closing </div> of the view-header block

TAB_EXPR  = re.compile(
    r'(\s*)\$\{(?:tabs \? )?renderHubTabs\([^)]+\)(?:\s*:\s*\'\')?\}(?:\s*\n)?'
)
EYEBROW   = '<h2 style="font-size:0.65rem'  # marker that the move is needed
CLOSE_VH  = '</div>'

files_patched = []

for fname in sorted(os.listdir(VIEWS)):
    if not fname.endswith('.js'):
        continue
    path = os.path.join(VIEWS, fname)
    text  = open(path, 'r', encoding='utf-8', errors='replace').read()
    orig  = text

    changed = True
    passes  = 0
    while changed and passes < 10:
        changed = False
        passes += 1
        for m in TAB_EXPR.finditer(text):
            tab_expr = m.group(0)          # the full ${renderHubTabs(...)} line
            after    = text[m.end():]

            # Is the EYEBROW within the next ~600 chars? If so, tabs are before heading.
            if EYEBROW not in after[:600]:
                continue

            # Find the raw tab call (without leading whitespace / newline)
            raw = m.group(0).strip()

            # 1. Remove the tabs expression from its current location
            text = text[:m.start()] + text[m.end():]

            # 2. Find the next </div> after where we just removed (this closes the
            #    view-header or its inner div that now only contains heading + p)
            #    We look from m.start() forward.
            close_pos = text.find(CLOSE_VH, m.start())
            if close_pos == -1:
                # Couldn't find close — skip (shouldn't happen)
                text = orig
                break

            # Insert the tabs expression after that </div>, on its own line
            insert_at = close_pos + len(CLOSE_VH)
            indent = '        '   # consistent 8-space indent (matches view body)
            text = (
                text[:insert_at]
                + f'\n{indent}{raw}'
                + text[insert_at:]
            )
            changed = True
            break   # restart the scan after each replacement

    if text != orig:
        open(path, 'w', encoding='utf-8').write(text)
        files_patched.append(fname)
        print(f'  PATCHED ({passes} pass(es)): {fname}')
    else:
        print(f'  SKIP:    {fname}')

print(f'\nDone. {len(files_patched)} file(s) patched.')
