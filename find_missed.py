import re
import sys

# Ensure stdout uses utf-8
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'C:/Users/geral/.gemini/antigravity/scratch/alphasignal/app.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<h1[^>]*>(.*?)</h1>(.*?)</div>', re.DOTALL | re.IGNORECASE)

missed = []
for match in pattern.finditer(content):
    title_html = match.group(1)
    after_h1 = match.group(2)
    
    title_text = re.sub(r'<[^>]+>', '', title_html).strip()
    
    if 'DOCS</button>' not in after_h1 and 'DOCS</button>' not in title_html:
        if 'Terminal Documentation' not in title_text and 'Alpha Intelligence Analyst' not in title_text and 'ALPHASIGNAL' not in title_text:
            missed.append(title_text)

print("Missed headers without help links:")
for m in missed:
    print(m)
