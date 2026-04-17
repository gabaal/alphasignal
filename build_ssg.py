import os
import re
import esprima
import json
import ast

def extract_strings_from_ast(node):
    if not node:
        return ""
    if getattr(node, 'type', None) == 'Literal':
        return str(node.value)
    
    if getattr(node, 'type', None) == 'Property':
        key = node.key.name if getattr(node.key, 'type', None) == 'Identifier' else extract_strings_from_ast(node.key)
        val = extract_strings_from_ast(node.value)
        return {key: val}
        
    if getattr(node, 'type', None) == 'ObjectExpression':
        obj = {}
        for prop in node.properties:
            k = prop.key.name if getattr(prop.key, 'type', None) == 'Identifier' else extract_strings_from_ast(prop.key)
            obj[k] = extract_strings_from_ast(prop.value)
        return obj
        
    if getattr(node, 'type', None) == 'ArrayExpression':
        return [extract_strings_from_ast(el) for el in node.elements]
        
    return ""

def parse_docs(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
        
    # extract everything inside renderViewDocPage({...})
    # it's tricky with esprima to parse broken fragments, let's parse the full JS using esprima.parseScript
    tree = esprima.parseScript(code)
    docs = []
    
    def traverse(node):
        if getattr(node, 'type', None) == 'CallExpression':
            if getattr(node.callee, 'name', None) == 'renderViewDocPage':
                args = node.arguments
                if args and args[0].type == 'ObjectExpression':
                    doc_obj = extract_strings_from_ast(args[0])
                    docs.append(doc_obj)
        
        for key, value in node.__dict__.items():
            if hasattr(value, 'type'):
                traverse(value)
            elif isinstance(value, list):
                for item in value:
                    if hasattr(item, 'type'):
                        traverse(item)

    traverse(tree)
    return docs

all_docs = []
for f in ['js/docs-a.js', 'js/docs-b.js', 'js/docs-c.js']:
    print(f"Parsing {f}...")
    if os.path.exists(f):
        all_docs.extend(parse_docs(f))

print(f"Extracted {len(all_docs)} documentation items.")
with open('extracted_docs.json', 'w') as f:
    json.dump(all_docs, f, indent=2)
