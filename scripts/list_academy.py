import re
import glob
import os

files = glob.glob('academy/*.html')
data = []
for fpath in files:
    with open(fpath, encoding='utf-8') as f:
        html = f.read()
    
    title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
    if title_match:
        title = title_match.group(1).split('-')[0].strip()
    else:
        title = os.path.basename(fpath)
        
    data.append((title, fpath))

data.sort(key=lambda x: x[0])
for i, (t, p) in enumerate(data):
    print(f"{i+1:02d}. {t} ({os.path.basename(p)})")
