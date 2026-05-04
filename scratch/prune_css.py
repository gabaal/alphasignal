import re

def prune_css(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to find :root blocks inside @media that contain the redundant variables
    # We look for the specific sequence of variables we saw
    pattern = r'@media\s*\([^)]+\)\s*{\s*:root\s*{[^}]+}\s*'
    
    # Let's be more specific to avoid removing valid overrides (though we didn't see any in the blocks)
    # The blocks we saw start with --bg-deep and end with --regime-volatile
    redundant_root_pattern = r':root\s*{\s*/\* == Core backgrounds ==.*?--regime-volatile:     #f87171;\s*}'
    
    # Remove these blocks
    # Using re.DOTALL to match across newlines
    new_content = re.sub(redundant_root_pattern, '', content, flags=re.DOTALL)
    
    # Also clean up the malformed footer
    malformed_footer_pattern = r'/\s*\*\s*P\s*W\s*A\s*T\s*o\s*u\s*c\s*h\s*&\s*N\s*a\s*v\s*i\s*g\s*a\s*t\s*i\s*o\s*n\s*B\s*e\s*h\s*a\s*v\s*i\s*o\s*r\s*s\s*\*\s*/.*?\}\s*\}'
    clean_footer = '/* PWA Touch & Navigation Behaviors */\nbody { overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; touch-action: pan-x pan-y; }\n.nav-item, .intel-action-btn, .action-btn-styled, .tab-btn, button, .signal-card, .glass-card, .tape-item { user-select: none; -webkit-user-select: none; }'
    
    # We'll just replace the whole mess at the end
    # Find the start of the mess
    mess_start = new_content.find('/ *   P W A')
    if mess_start != -1:
        new_content = new_content[:mess_start] + clean_footer + '\n'
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Pruning complete.")

if __name__ == "__main__":
    prune_css('styles.css')
