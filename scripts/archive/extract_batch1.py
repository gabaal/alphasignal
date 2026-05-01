"""Extract article body text from the 5 Batch 1 academy files."""
import re

files = [
    ("academy/bollinger-bands-volatility.html", "bollinger-bands-volatility"),
    ("academy/breakout-trading-strategies.html", "breakout-trading-strategies"),
    ("academy/candlestick-patterns.html", "candlestick-patterns"),
    ("academy/options-flow-dark-pools.html", "options-flow-dark-pools"),
    ("academy/divergence-trading-strategies.html", "divergence-trading-strategies"),
]

for fpath, slug in files:
    with open(fpath, encoding='utf-8') as f:
        html = f.read()

    title = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    title = re.sub(r'<[^>]+>', '', title.group(1)).strip() if title else slug

    intro = re.search(r"<p style='font-size:1\.35rem[^>]*>(.*?)</p>", html, re.S)
    intro = re.sub(r'<[^>]+>', '', intro.group(1)).strip() if intro else ''

    body_match = re.search(r"<div class='academy-article-dynamic'[^>]*>(.*?)</div>\s*\n\s*<div style='margin-top:5rem", html, re.S)
    body_html = body_match.group(1) if body_match else ''

    body = re.sub(r'<h2[^>]*>(.*?)</h2>', r'\n## \1\n', body_html, flags=re.S)
    body = re.sub(r'<h3[^>]*>(.*?)</h3>', r'\n### \1\n', body, flags=re.S)
    body = re.sub(r'<strong>(.*?)</strong>', r'**\1**', body, flags=re.S)
    body = re.sub(r'<li>(.*?)</li>', r'- \1', body, flags=re.S)
    body = re.sub(r'<ul>|</ul>|<ol>|</ol>', '', body)
    body = re.sub(r'<p[^>]*>(.*?)</p>', r'\1\n', body, flags=re.S)
    body = re.sub(r'<img[^>]*alt="([^"]*)"[^>]*/>', r'[IMG:\1]', body)
    body = re.sub(r'<[^>]+>', '', body)
    body = re.sub(r'\n{3,}', '\n\n', body).strip()

    imgs = re.findall(r'/academy/images/([^"\']+)', html)

    print(f"===== {slug} =====")
    print(f"TITLE: {title}")
    print(f"INTRO: {intro}")
    print(f"IMAGES: {imgs}")
    print(f"BODY:\n{body}")
    print("\n\n")
