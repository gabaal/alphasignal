import os, re
def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(r"background:#0d1117", "background:var(--bg-input)", content)
    new_content = re.sub(r"color-scheme:dark", "color-scheme: ${document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'}", new_content)
    new_content = re.sub(r"backgroundColor:\s*'#0d1117'", "backgroundColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#f8fafc' : '#0d1117'", new_content)
    new_content = re.sub(r"borderColor:\s*'#09090b'", "borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b'", new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filepath}")

for root, dirs, files in os.walk('js'):
    for file in files:
        if file.endswith('.js'):
            patch_file(os.path.join(root, file))
