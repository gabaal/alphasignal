import sys

with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\api_router.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = "elif path.startswith('/api/macro'):"
replacement = "elif path == '/api/macro-regime':\n            self.handle_macro_regime()\n        elif path.startswith('/api/macro'):"

if target in text:
    text = text.replace(target, replacement)
    with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\api_router.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Mapped /api/macro-regime successfully!')
else:
    print('Target not found!')
