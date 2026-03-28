import re

with open('js/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

view_match = re.search(r'const viewMap\s*=\s*\{([\s\S]*?)\};', content)
if not view_match:
    print('viewMap not found')
    exit(1)

views = re.findall(r'\'([a-zA-Z0-9_-]+)\':', view_match.group(1))

xml = ['<?xml version="1.0" encoding="UTF-8"?>']
xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

# Base URL
xml.append('   <url>')
xml.append('      <loc>https://alphasignal.digital/</loc>')
xml.append('      <lastmod>2026-03-28</lastmod>')
xml.append('      <changefreq>daily</changefreq>')
xml.append('      <priority>1.0</priority>')
xml.append('   </url>')

for view in views:
    xml.append('   <url>')
    xml.append(f'      <loc>https://alphasignal.digital/?view={view}</loc>')
    xml.append('      <lastmod>2026-03-28</lastmod>')
    
    if view in ['signals', 'whales', 'trade-ledger']:
        xml.append('      <changefreq>always</changefreq>')
        xml.append('      <priority>0.9</priority>')
    elif view in ['briefing', 'macro-calendar', 'newsroom']:
        xml.append('      <changefreq>daily</changefreq>')
        xml.append('      <priority>0.8</priority>')
    else:
        xml.append('      <changefreq>monthly</changefreq>')
        xml.append('      <priority>0.5</priority>')
    
    xml.append('   </url>')
    
xml.append('</urlset>')

with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write('\n'.join(xml))

print(f"Generated sitemap with {len(views) + 1} URLs")
