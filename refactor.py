import os
import re

def run():
    print("Reading app.js...")
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    os.makedirs('js', exist_ok=True)

    # 1. Extract the initialization at the very end
    # Everything from `const viewMap = {` down to the EOF goes into main.js
    main_match = re.search(r'(\n// ============= Initialization =============\nconst viewMap = {.*)', content, flags=re.DOTALL)
    if not main_match:
        # Fallback if comment not found
        main_match = re.search(r'(\nconst viewMap = {.*)', content, flags=re.DOTALL)
    
    main_code = main_match.group(1) if main_match else ""
    content_without_main = content.replace(main_code, '')

    # 2. Split the rest by top level functions
    parts = re.split(r'\n(?=(?:async )?function )', content_without_main)
    
    core_code = []
    views_code = []
    charts_code = []

    for part in parts:
        if not part.strip(): continue
        
        # Categorize part
        if part.startswith('async function render') or part.startswith('function render') and 'Chart' not in part.split('(')[0]:
            # This is a view renderer (e.g. renderPortfolioLab)
            # Exception: renderWhaleFlowChart is a chart helper
            func_name = part.split('(')[0].split(' ')[-1]
            if 'Chart' in func_name or 'Heatmap' in func_name:
                charts_code.append(part)
            else:
                views_code.append(part)
        elif part.startswith('function render') or 'Chart' in part.split('(')[0]:
            charts_code.append(part)
        elif part.startswith('function init'):
            # initLivePriceStream, etc. -> core or main
            main_code += '\n' + part
        elif part.startswith('function toggle') or part.startswith('window.'):
            main_code += '\n' + part
        else:
            core_code.append(part)

    with open('js/core.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(core_code))
        
    with open('js/views.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(views_code))
        
    with open('js/charts.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(charts_code))
        
    with open('js/main.js', 'w', encoding='utf-8') as f:
        f.write(main_code)

    print("Successfully generated files: core.js, views.js, charts.js, main.js")

    # Re-write index.html to include scripts
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    old_script = r'<script src="app.js.*?(?></script>|\/>)'
    new_script = """<script src="js/core.js"></script>
    <script src="js/charts.js"></script>
    <script src="js/views.js"></script>
    <script src="js/main.js"></script>"""
    
    html = re.sub(old_script, new_script, html)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("index.html updated to reference modular js structure")

if __name__ == '__main__':
    run()
