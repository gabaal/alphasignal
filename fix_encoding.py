import sys

with open('js/main.js', 'rb') as f:
    raw = f.read()

# Try to decode as UTF-8 strictly
try:
    content = raw.decode('utf-8')
    print('File is valid UTF-8, total chars:', len(content))
    # Check for any chars that would break JS
    lines = content.split('\n')
    print('Total lines:', len(lines))
    # Look specifically for the export section (lines 2183+)
    issues = []
    for i, line in enumerate(lines[2180:2370], start=2181):
        for j, ch in enumerate(line):
            o = ord(ch)
            if o > 127:
                issues.append((i, j, o, ch, line[max(0,j-10):j+10]))
    if issues:
        print(f'Non-ASCII in export section ({len(issues)} found):')
        for linenum, col, o, ch, ctx in issues[:10]:
            print(f'  Line {linenum} col {col}: U+{o:04X} ({ch!r}) near: {ctx!r}')
    else:
        print('Export section (lines 2181-2370): ALL ASCII CLEAN')
except UnicodeDecodeError as e:
    print('File is NOT valid UTF-8:', e)
    # Find bad position
    pos = e.start
    line_num = raw[:pos].count(b'\n') + 1
    print(f'Bad bytes at position {pos}, line {line_num}')
