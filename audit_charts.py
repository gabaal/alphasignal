import os

js_dir = 'js'
count = 0
for root, _, files in os.walk(js_dir):
    for f in files:
        if f.endswith('.js'):
            with open(os.path.join(root, f), 'r', encoding='utf-8') as file:
                text = file.read()
                import re
                matches = re.findall(r'rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)', text)
                if matches:
                    count += len(matches)
                    print(f"{f}: {len(matches)} matches")

print(f"Total: {count}")
