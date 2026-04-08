import pathlib, re
p = pathlib.Path('index.html')
c = p.read_text(encoding='utf-8')
files = ['signals.js', 'liquidity-archive.js', 'alerts-archive.js', 'my-terminal.js', 'signal-permalink.js']
for f in files:
    for old_v in ['2.34', '2.35', '2.36']:
        c = c.replace(f + '?v=' + old_v + '"', f + '?v=2.37"')
p.write_text(c, encoding='utf-8')
for f in files:
    m = re.search(f.replace('.', r'\.') + r'\?v=([^"]+)', c)
    print(f, '->', m.group(1) if m else 'NOT FOUND')
