import re

def clean_head_json_ld(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the <head> block
    head_match = re.search(r'<head>(.*?)</head>', content, re.DOTALL)
    if not head_match:
        print("No head found")
        return

    head_content = head_match.group(1)
    
    # Remove all JSON-LD scripts inside the head
    # We keep the one with id="ld-json-dynamic" if needed, but the user didn't ask to keep it.
    # Actually, I'll keep the dynamic one just in case.
    cleaned_head = re.sub(r'<script type="application/ld\+json"(?! id="ld-json-dynamic")>.*?</script>', '', head_content, flags=re.DOTALL)
    
    new_content = content.replace(head_content, cleaned_head)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Head JSON-LD cleaned.")

if __name__ == "__main__":
    clean_head_json_ld('index.html')
