import re
import os
import glob

already_done = {
    "bollinger-bands-volatility.html",
    "breakout-trading-strategies.html",
    "candlestick-patterns.html",
    "options-flow-dark-pools.html",
    "divergence-trading-strategies.html",
    "ai-narrative-velocity-sentiment.html",
    "algorithmic-ai-trade-signals.html",
    "capital-sector-rotation.html",
    "cme-futures-gaps-bitcoin.html",
    "crypto-liquidations-tracker.html"
}

all_files = glob.glob('academy/*.html')
remaining_files = []

for fpath in all_files:
    fname = os.path.basename(fpath)
    if fname not in already_done:
        remaining_files.append(fpath)

# Sort alphabetically by filename
remaining_files.sort(key=lambda x: os.path.basename(x))

desktop_path = os.path.join(os.environ['USERPROFILE'], 'OneDrive', 'Desktop')
if not os.path.exists(desktop_path):
    desktop_path = os.path.join(os.environ['USERPROFILE'], 'Desktop')

def process_batch(batch_num, files_in_batch):
    out_lines = []
    out_lines.append(f"# Medium Syndication — Batch {batch_num}")
    out_lines.append(f"*AlphaSignal Quant Academy | {len(files_in_batch)} Articles | Ready to post*")
    out_lines.append("")
    out_lines.append("> **Rate limit reminder:** Medium allows max **2 posts per 24 hours**. Post 2 today, 2 tomorrow, 1 the day after.")
    out_lines.append("> Images live at: `alphasignal.digital/academy/images/[filename]`")
    out_lines.append("> **Canonical URL:** Set in Medium → `···` menu → Story settings → Advanced settings → Canonical link — **before** publishing.")
    out_lines.append("")
    out_lines.append("---")
    out_lines.append("")
    
    all_images = []
    
    for idx, fpath in enumerate(files_in_batch):
        fname = os.path.basename(fpath)
        slug = fname.replace('.html', '')
        with open(fpath, encoding='utf-8') as f:
            html = f.read()

        title = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
        title = re.sub(r'<[^>]+>', '', title.group(1)).strip() if title else slug
        
        # Subtitle could be the first paragraph or description meta
        intro_match = re.search(r"<p style='font-size:1\.35rem[^>]*>(.*?)</p>", html, re.S)
        if not intro_match:
            intro_match = re.search(r'<meta name="description" content="([^"]+)">', html, re.IGNORECASE)
        intro = re.sub(r'<[^>]+>', '', intro_match.group(1)).strip() if intro_match else ''

        body_match = re.search(r"<div class='academy-article-dynamic'[^>]*>(.*?)</div>\s*\n\s*<div style='margin-top:5rem", html, re.S)
        if not body_match:
            body_match = re.search(r"academy-article-dynamic'[^>]*>(.*?)</div>\s*(?=\s*<div|\s*</div>)", html, re.S)
        body_html = body_match.group(1) if body_match else ''

        body = re.sub(r'<h2[^>]*>(.*?)</h2>', r'\n## \1\n', body_html, flags=re.S)
        body = re.sub(r'<h3[^>]*>(.*?)</h3>', r'\n### \1\n', body, flags=re.S)
        body = re.sub(r'<strong>(.*?)</strong>', r'**\1**', body, flags=re.S)
        body = re.sub(r'<li>(.*?)</li>', r'- \1', body, flags=re.S)
        body = re.sub(r'<ul>|</ul>|<ol>|</ol>', '', body)
        body = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n', body, flags=re.S)
        
        # Replace images with marker
        body = re.sub(r'<img[^>]*src="[^"]*/images/([^"]+)"[^>]*>', r'\n*[INSERT IMAGE: \1]*\n', body)
        body = re.sub(r'<img[^>]*alt="([^"]*)"[^>]*/>', r'\n*[INSERT IMAGE: \1]*\n', body)
        
        body = re.sub(r'<[^>]+>', '', body)
        body = re.sub(r'\n{3,}', '\n\n', body).strip()

        imgs = re.findall(r'/academy/images/([^"\']+)', html)
        all_images.append((title, imgs))
        
        hero_img = imgs[0] if imgs else 'social-preview.png'
        
        out_lines.append(f"## Article {idx+1} of {len(files_in_batch)}")
        out_lines.append("")
        out_lines.append(f"# {title}")
        out_lines.append("")
        out_lines.append(f"**Subtitle:** {intro}")
        out_lines.append("")
        out_lines.append(f"**Hero image:** `{hero_img}`")
        out_lines.append(f"**Canonical URL:** `https://alphasignal.digital/academy/{slug}`")
        out_lines.append("")
        out_lines.append("---")
        out_lines.append("")
        out_lines.append(body)
        out_lines.append("")
        out_lines.append("---")
        out_lines.append("")
        out_lines.append("*This article is part of the AlphaSignal Quant Academy — institutional-grade trading education for serious crypto traders.*")
        out_lines.append("")
        out_lines.append(f"*Originally published at [alphasignal.digital/academy/{slug}](https://alphasignal.digital/academy/{slug})*")
        out_lines.append("")
        out_lines.append("---")
        out_lines.append("---")
        out_lines.append("")
        
    out_lines.append("## All Images")
    out_lines.append("")
    out_lines.append("All images are in: `alphasignal.digital/academy/images/`")
    out_lines.append("")
    out_lines.append("| Article | Images |")
    out_lines.append("|---------|--------|")
    for idx, (t, imgs) in enumerate(all_images):
        imgs_str = ", ".join([f"`{img}`" for img in imgs]) if imgs else "None"
        out_lines.append(f"| {idx+1} — {t} | {imgs_str} |")
        
    out_lines.append("")
    out_lines.append("## Posting Schedule")
    out_lines.append("")
    out_lines.append("| Day | Articles |")
    out_lines.append("|-----|----------|")
    if len(files_in_batch) >= 2:
        out_lines.append("| Day 1 | Article 1 + Article 2 |")
    if len(files_in_batch) >= 4:
        out_lines.append("| Day 2 | Article 3 + Article 4 |")
    if len(files_in_batch) == 5:
        out_lines.append("| Day 3 | Article 5 |")
        
    out_lines.append("")
    out_lines.append("## Medium Checklist (per article)")
    out_lines.append("- [ ] Title + subtitle set")
    out_lines.append("- [ ] Hero image uploaded (filename listed above each article)")
    out_lines.append("- [ ] Body pasted, inline images inserted at each `[INSERT IMAGE: filename]` marker")
    out_lines.append("- [ ] **SEO → Canonical URL** set **before** publishing (`···` → Story settings → Advanced settings → Canonical link)")
    out_lines.append("- [ ] Tags: `Bitcoin`, `Crypto Trading`, `Technical Analysis`, `Cryptocurrency`, `Investing`")
    out_lines.append("- [ ] Submit to **Coinmonks** publication")
    
    out_path = os.path.join(desktop_path, f"medium_syndication_batch_{batch_num}.md")
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(out_lines))
    print(f"Generated {out_path} with {len(files_in_batch)} articles.")

# Split remaining into batches of 5
batch_size = 5
batch_num = 3

for i in range(0, len(remaining_files), batch_size):
    batch_files = remaining_files[i:i+batch_size]
    process_batch(batch_num, batch_files)
    batch_num += 1

print("All batches generated successfully on Desktop!")
