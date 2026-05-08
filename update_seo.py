import os
import json
import datetime
import xml.sax.saxutils as saxutils

# Paths
academy_dir = r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\academy'
data_file = r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\js\views\academy_videos_data.js'
sitemap_path = r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\sitemap.xml'
video_sitemap_path = r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\video-sitemap.xml'

# Load extracted videos
with open(data_file, 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.split('const ACADEMY_VIDEOS_EXTRACTED = ')[1].rstrip(';')
    videos = json.loads(json_str)

today = datetime.date.today().isoformat()

# --- 1. Generate video-sitemap.xml ---
video_xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">'
]

# Add Cinema Hub as a main entry
video_xml.append(f'  <url>')
video_xml.append(f'    <loc>https://alphasignal.digital/academy-watch</loc>')
video_xml.append(f'    <lastmod>{today}</lastmod>')
video_xml.append(f'    <changefreq>daily</changefreq>')
video_xml.append(f'    <priority>0.9</priority>')
video_xml.append(f'  </url>')

for v in videos:
    # Duration in seconds
    parts = v["duration"].split(":")
    duration_sec = int(parts[0]) * 60 + int(parts[1])
    
    # Escape XML entities
    safe_title = saxutils.escape(v["title"])
    safe_desc = saxutils.escape(v["desc"])
    
    video_xml.append(f'  <url>')
    video_xml.append(f'    <loc>https://alphasignal.digital/{v["route"]}</loc>')
    video_xml.append(f'    <video:video>')
    video_xml.append(f'      <video:thumbnail_loc>{v["thumb"]}</video:thumbnail_loc>')
    video_xml.append(f'      <video:title>{safe_title}</video:title>')
    video_xml.append(f'      <video:description>{safe_desc}</video:description>')
    video_xml.append(f'      <video:player_loc>https://www.youtube.com/embed/{v["youtubeId"]}</video:player_loc>')
    video_xml.append(f'      <video:duration>{duration_sec}</video:duration>')
    video_xml.append(f'      <video:publication_date>2024-05-01T00:00:00Z</video:publication_date>')
    video_xml.append(f'    </video:video>')
    video_xml.append(f'  </url>')

video_xml.append('</urlset>')

with open(video_sitemap_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(video_xml))

# --- 2. Update sitemap.xml ---
# We'll read the current sitemap and ensure academy URLs are present
with open(sitemap_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Filter out existing academy URLs to prevent duplicates
new_lines = []
for line in lines:
    if '</urlset>' in line: continue
    new_lines.append(line)

# Add academy-watch
if 'https://alphasignal.digital/academy-watch' not in "".join(new_lines):
    new_lines.append(f'  <url>\n    <loc>https://alphasignal.digital/academy-watch</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n')

# Add all academy articles from the academy directory
for filename in os.listdir(academy_dir):
    if filename.endswith(".html") and filename != "index.html":
        url = f"https://alphasignal.digital/academy/{filename.replace('.html', '')}"
        if url not in "".join(new_lines):
            new_lines.append(f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n')

new_lines.append('</urlset>')

with open(sitemap_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"SEO Update Complete:")
print(f"- {video_sitemap_path} generated ({len(videos)} videos)")
print(f"- {sitemap_path} updated with academy articles")
