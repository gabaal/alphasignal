#!/usr/bin/env python3
import os, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DOCS_DIR = 'docs'
files = sorted(f for f in os.listdir(DOCS_DIR) if f.endswith('.html'))

print(f"{'FILE':<32} {'LEN':>4}  STATUS  DESCRIPTION")
print('-'*110)

problems = []
for fname in files:
    path = os.path.join(DOCS_DIR, fname)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            html = f.read()
    except UnicodeDecodeError:
        with open(path, 'r', encoding='latin-1') as f:
            html = f.read()

    m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html)
    desc = m.group(1).strip() if m else '[MISSING]'
    slug = fname[:-5]
    length = len(desc)

    # Detect issues
    last_char = desc[-1] if desc else ''
    truncated = last_char not in '.!?)"' and length > 80
    too_short = length < 60
    too_long  = length > 160

    if truncated:
        status = 'TRUNCATED'
        problems.append((slug, path, desc, 'truncated'))
    elif too_short:
        status = 'SHORT    '
        problems.append((slug, path, desc, 'short'))
    elif too_long:
        status = 'LONG     '
        problems.append((slug, path, desc, 'long'))
    else:
        status = 'OK       '

    preview = desc[:85] + ('...' if len(desc) > 85 else '')
    print(f"{slug:<32} {length:>4}  {status}  {preview}")

print()
print(f"Total issues: {len(problems)}")
