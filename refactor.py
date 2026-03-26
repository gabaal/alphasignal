import ast

with open('main.py', 'r', encoding='utf-8') as f:
    code = f.read()

tree = ast.parse(code)
with open('ast_dump.txt', 'w') as out:
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            out.write(f"Class: {node.name} (Lines {node.lineno}-{node.end_lineno})\n")
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    out.write(f"  Method: {item.name}\n")
        elif isinstance(node, ast.FunctionDef):
            out.write(f"Function: {node.name} (Lines {node.lineno}-{node.end_lineno})\n")
        elif isinstance(node, ast.Assign):
            targets = [t.id for t in node.targets if isinstance(t, ast.Name)]
            if targets:
                out.write(f"Assign: {', '.join(targets)} (Line {node.lineno})\n")
