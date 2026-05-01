import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
with open('academy/bollinger-bands-volatility.html', encoding='utf-8', errors='replace') as f:
    content = f.read()
MARKER = 'seo-crawler-nav'
idx = content.find(MARKER)
print('Injection point index:', idx)
print('Context:')
print(repr(content[idx-200:idx+50]))
