import re

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# ViewMap Keys
viewMap = []
in_map = False
for line in text.split('\n'):
    if line.strip().startswith('const viewMap = {'):
        in_map = True
    elif in_map and line.strip().startswith('};'):
        break
    elif in_map:
        m = re.search(r'[\'"]?([a-zA-Z0-9_-]+)[\'"]?\s*:', line)
        if m: viewMap.append(m.group(1))

# ViewMetadata Keys
meta = []
in_meta = False
for line in text.split('\n'):
    if line.strip().startswith('const viewMetadata = {'):
        in_meta = True
    elif in_meta and 'const ldJsonEl =' in line:
        break
    elif in_meta:
        m = re.match(r'^\s*[\'"]?([a-zA-Z0-9_-]+)[\'"]?:\s*\{', line)
        if m: meta.append(m.group(1))

missing = [v for v in viewMap if v not in meta]
print("TOTAL VIEWS:", len(viewMap))
print("TOTAL META:", len(meta))
print("MISSING:", missing)
