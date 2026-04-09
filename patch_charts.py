import os, re

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace layout:
    # layout: { background: { color: '#09090b' }, textColor: '#d1d5db',
    new_content = re.sub(r"color:\s*'#09090b'\s*\}\s*,\s*textColor:\s*'#(d1d5db|9ca3af)'", 
                         r"color: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#09090b' }, textColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#334155' : '#\1'",
                         content)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {filepath}")

for root, dirs, files in os.walk('js'):
    for file in files:
        if file.endswith('.js'):
            patch_file(os.path.join(root, file))
