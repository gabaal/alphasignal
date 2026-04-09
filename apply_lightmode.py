import os
import re

js_dir = 'js'
count = 0
files_modified = 0

def replace_match(m):
    opacity = m.group(1)
    return f"alphaColor({opacity})"

def replace_template(m):
    opacity = m.group(1)
    return f"${{alphaColor({opacity})}}"

for root, _, files in os.walk(js_dir):
    for f in files:
        if f.endswith('.js'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                text = file.read()
                
            original_text = text
            
            # Match explicit string declarations like 'rgba(255, 255, 255, 0.5)'
            text = re.sub(r"'rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)'", replace_match, text)
            text = re.sub(r'"rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)"', replace_match, text)
            
            # Match implicit templates like <div style="background:rgba(255,255,255,0.5)">
            text = re.sub(r"rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)", replace_template, text)
            
            if text != original_text:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(text)
                files_modified += 1
                count += 1

print(f"Successfully patched {files_modified} JS files.")
