"""Extract article body text from the 5 Batch 2 academy files."""
import re, os

files = [
    ("academy/ai-narrative-velocity-sentiment.html", "ai-narrative-velocity-sentiment"),
    ("academy/algorithmic-ai-trade-signals.html", "algorithmic-ai-trade-signals"),
    ("academy/capital-sector-rotation.html", "capital-sector-rotation"),
    ("academy/cme-futures-gaps-bitcoin.html", "cme-futures-gaps-bitcoin"),
    ("academy/crypto-liquidations-tracker.html", "crypto-liquidations-tracker"),
]

for fpath, slug in files:
    with open(fpath, encoding='utf-8') as f:
        html = f.read()

    # Title
    title = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    title = re.sub(r'<[^>]+>', '', title.group(1)).strip() if title else slug

    # Intro paragraph
    intro = re.search(r"<p style='font-size:1\.35rem[^>]*>(.*?)</p>", html, re.S)
    intro = re.sub(r'<[^>]+>', '', intro.group(1)).strip() if intro else ''

    # Article body div
    body_match = re.search(r"<div class='academy-article-dynamic'[^>]*>(.*?)</div>\s*\n\s*<div style='margin-top:5rem", html, re.S)
    if not body_match:
        body_match = re.search(r"academy-article-dynamic'[^>]*>(.*?)</div>\s*(?=\s*<div|\s*</div>)", html, re.S)
    body_html = body_match.group(1) if body_match else ''

    # Strip HTML tags for Markdown-ish text
    # Convert h2/h3 to markdown
    body = re.sub(r'<h2[^>]*>(.*?)</h2>', r'\n## \1\n', body_html, flags=re.S)
    body = re.sub(r'<h3[^>]*>(.*?)</h3>', r'\n### \1\n', body, flags=re.S)
    body = re.sub(r'<strong>(.*?)</strong>', r'**\1**', body, flags=re.S)
    body = re.sub(r'<li>(.*?)</li>', r'- \1', body, flags=re.S)
    body = re.sub(r'<ul>|</ul>|<ol>|</ol>', '', body)
    body = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n', body, flags=re.S)
    # img tags -> note for editor
    body = re.sub(r'<img[^>]*alt="([^"]*)"[^>]*/>', r'\n*[Image: \1]*\n', body)
    body = re.sub(r'<[^>]+>', '', body)
    body = re.sub(r'\n{3,}', '\n\n', body).strip()

    # Images referenced
    imgs = re.findall(r'/academy/images/([^"\']+)', html)

    print(f"===== {slug} =====")
    print(f"TITLE: {title}")
    print(f"INTRO: {intro[:200]}")
    print(f"IMAGES: {imgs}")
    print(f"BODY PREVIEW (first 800 chars):\n{body[:800]}")
    print()
