import build_academy

html = '<nav aria-label="Quant Academy Crawler Sitemap" style="display:none;" id="seo-crawler-nav">\n'
html += '  <ul>\n'
for slug, data in build_academy.articles.items():
    html += f'    <li><a href="/academy/{slug}">{data["title"]}</a></li>\n'
html += '  </ul>\n'
html += '</nav>\n'

print(html)
