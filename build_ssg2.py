import json
import os
import re

def build():
    # load docs
    with open('extracted_docs.json', 'r', encoding='utf-8') as f:
        docs = json.load(f)
        
    # load index template
    with open('index.html', 'r', encoding='utf-8') as f:
        html_template = f.read()
        
    os.makedirs('docs', exist_ok=True)
    
    # Strip <base> if exists, add it if not so relative paths work from /docs/
    h_idx = html_template.find('<head>')
    template_with_base = html_template[:h_idx+6] + '\n    <base href="/">\n' + html_template[h_idx+6:]

    for doc in docs:
        view_id = doc.get('viewId')
        if not view_id:
            continue
            
        seo_title = f"{doc.get('title', view_id)} - Check Live Execution Metrics | AlphaSignal System"
        seo_desc = doc.get('summary', '')[:160]
        
        # Build document HTML
        html_content = [f"<div class='docs-container seo-pre-render' style='padding:4rem 2rem; max-width:800px; margin:0 auto;'>"]
        html_content.append(f"<div style='color:{doc.get('hubColor', '#fff')}'>{doc.get('hub', 'Documentation')}</div>")
        html_content.append(f"<h1 style='font-size:2.5rem; margin-bottom:1rem'>{doc.get('title')} Guide & Analytics</h1>")
        html_content.append(f"<p style='font-size:1.1rem; line-height:1.7'>{doc.get('summary')}</p>")
        
        components = doc.get('components', [])
        for comp in components:
            if not isinstance(comp, dict):
                continue
            html_content.append(f"<section style='margin-top:3rem'>")
            html_content.append(f"<h2 style='font-size:1.5rem; border-bottom:1px solid #333; padding-bottom:0.5rem'>{comp.get('name')}</h2>")
            
            if comp.get('description'):
                html_content.append(f"<h3>Overview</h3>")
                html_content.append(f"<p>{comp.get('description')}</p>")
                
            if comp.get('howToRead'):
                html_content.append(f"<h3>How to Read</h3>")
                html_content.append(f"<p>{comp.get('howToRead')}</p>")
                
            if comp.get('strategy'):
                html_content.append(f"<h3>Execution Strategy</h3>")
                html_content.append(f"<p>{comp.get('strategy')}</p>")
                
            html_content.append("</section>")

        html_content.append("</div>")
        
        inner_html = "\n".join(html_content)
        
        # Replace title
        out_html = re.sub(r'<title>.*?</title>', f'<title>{seo_title}</title>', template_with_base)
        # Replace description
        out_html = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{seo_desc}">', out_html)
        
        # Replace body app-view
        # We find <div id="app-view"> and replace everything until </div> <!-- end app view -->?
        # A simpler way: string replace
        app_view_idx = out_html.find('<div id="app-view"')
        if app_view_idx != -1:
            end_app_view = out_html.find('</div>', app_view_idx)
            # Find next script tag to be safe
            next_script = out_html.find('<script>', app_view_idx)
            if next_script != -1:
                # remove the <div id="app-view">... </script> block and insert our <div id="app-view"> + content + </script>
                # Actually, index.html has:
                # <div id="app-view" style="min-height:100vh">
                #   <div id="home-prerender"> ... </div>
                # </div>
                # <script> (inline loader dismiss)
                
                # We can just run a crude replace:
                start_div = '<div id="app-view" style="min-height:100vh">'
                end_div = '<!-- Static hero pre-render:'
                
                # Actually, replacing the exact content of home-prerender is safest
                out_html = re.sub(
                    r'<div id="home-prerender".*?</div>\s*</div>',
                    f'{inner_html}</div>', 
                    out_html, flags=re.DOTALL
                )

        with open(f"docs/{view_id}.html", 'w', encoding='utf-8') as f:
            f.write(out_html)

    print(f"Generated {len(docs)} HTML files successfully.")

if __name__ == '__main__':
    build()
