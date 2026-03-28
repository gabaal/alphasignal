c = open('js/main.js', encoding='utf-8').read()
idx = c.find("'explain-portfolio-lab': { title:")
print('SEO dict explain-portfolio-lab at:', idx)
print(repr(c[idx:idx+300]))
