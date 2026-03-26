import re

file_path = r'C:/Users/geral/.gemini/antigravity/scratch/alphasignal/app.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define mapping from title keywords to their documentation view
docs_mapping = {
    'Signal Intelligence Dashboard': 'explain-signals',
    'Alpha Score': 'explain-alpha-score',
    'Risk Matrix': 'explain-risk',
    'Whale Pulse': 'explain-whales',
    'Correlation Matrix': 'explain-correlation',
    'Narrative Radar': 'explain-velocity', # Assuming velocity/narrative are overlapping or there is a specific one
    'Advanced Charting': 'explain-advanced-charting',
    'AI Briefing': 'explain-briefing',
    'Market Regime': 'explain-regimes',
    'Social Mindshare': 'explain-mindshare',
    'On-Chain Analytics': 'explain-onchain',
    'Order Flow': 'explain-liquidity',
    'Performance Dashboard': 'explain-performance',
    'Portfolio Lab': 'explain-portfolio-lab',
    'Signal Archive': 'explain-signal-archive',
    'Alert Hooks': 'explain-alerts',
    'Cross-Chain Velocity': 'explain-velocity',
    'Institutional Market Pulse': 'explain-briefing',
}

def replacer(match):
    header_block = match.group(0)
    title_text = match.group(2) # Group 2 contains the inner text of the h1 or similar
    
    # Try to find a matching doc key
    doc_key = None
    for key, value in docs_mapping.items():
        if key.lower() in title_text.lower():
            doc_key = value
            break
            
    if not doc_key:
        # If no mapping found, return original
        return header_block
        
    # Inject button right before closing h1 or after h1? 
    # Usually it's better to put them in a flex container.
    # Look for view-header exact structure
    btn_html = f'<button class="intel-action-btn mini outline" style="width:auto; padding:4px 8px; font-size:0.6rem; display:flex; align-items:center; gap:4px; margin-left: auto;" onclick="switchView(\'{doc_key}\')"><span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS</button>'
    
    # Check if view-header already has a flex layout style. If not, add one.
    if '<div class="view-header">' in header_block:
        new_block = header_block.replace('<div class="view-header">', '<div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">')
    else:
        new_block = header_block
        
    # Inject button after </h1>
    new_block = re.sub(r'(</h1>)', r'\1 ' + btn_html, new_block, count=1)
    
    return new_block

# Regular expression to find <div class="view-header"...> ... <h1> ... </h1>
pattern = re.compile(r'(<div class="view-header"[^>]*>.*?<h1[^>]*>(.*?)</h1>)', re.DOTALL | re.IGNORECASE)

new_content = pattern.sub(replacer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement complete.")
