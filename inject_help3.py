import re
import sys

# Ensure stdout uses utf-8
sys.stdout.reconfigure(encoding='utf-8')

file_path = r'C:/Users/geral/.gemini/antigravity/scratch/alphasignal/app.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

docs_mapping = {
    'Macro Catalyst Compass': 'explain-briefing',
    'Advanced Visualizations': 'explain-advanced-charting',
    'Institutional Intelligence Terminal': 'explain-signals'
}

def replacer(match):
    header_block = match.group(0)
    title_text = match.group(2)
    
    if 'DOCS</button>' in header_block:
        return header_block
    
    doc_key = None
    for key, value in docs_mapping.items():
        if key.lower() in title_text.lower():
            doc_key = value
            break
            
    if not doc_key:
        return header_block
        
    btn_html = f'<button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView(\'{doc_key}\')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>'
    
    if '<div class="view-header">' in header_block:
        new_block = header_block.replace('<div class="view-header">', '<div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">')
    else:
        new_block = header_block
        
    new_block = re.sub(r'(</h1>)', r'\1 ' + btn_html, new_block, count=1)
    
    return new_block

pattern = re.compile(r'(<div class="view-header"[^>]*>.*?<h1[^>]*>(.*?)</h1>)', re.DOTALL | re.IGNORECASE)

new_content = pattern.sub(replacer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Third replacement complete.")
