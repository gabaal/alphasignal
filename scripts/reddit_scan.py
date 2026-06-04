import re
from datetime import datetime, timezone

files = {
    'Bitcoin':           r'C:\Users\geral\.gemini\antigravity-ide\brain\b27f9298-7733-4fad-aa95-66af41d2c256\.system_generated\steps\407\content.md',
    'technicalanalysis': r'C:\Users\geral\.gemini\antigravity-ide\brain\b27f9298-7733-4fad-aa95-66af41d2c256\.system_generated\steps\408\content.md',
    'CryptoCurrencyTrading': r'C:\Users\geral\.gemini\antigravity-ide\brain\b27f9298-7733-4fad-aa95-66af41d2c256\.system_generated\steps\395\content.md',
}

now_ts = datetime.now(timezone.utc).timestamp()

for sub, path in files.items():
    print(f'\n===== r/{sub} =====')
    try:
        with open(path, encoding='utf-8', errors='replace') as f:
            content = f.read()

        titles       = re.findall(r'"title":\s*"((?:[^"\\]|\\.)*)"', content)
        permalinks   = re.findall(r'"permalink":\s*"(/r/[^"]+)"', content)
        num_comments = re.findall(r'"num_comments":\s*(\d+)', content)
        created      = re.findall(r'"created_utc":\s*([\d.]+)', content)
        selftexts    = re.findall(r'"selftext":\s*"((?:[^"\\]|\\.){0,300})', content)

        found = 0
        for i, ts in enumerate(created):
            age_h = (now_ts - float(ts)) / 3600
            if age_h > 26:
                continue
            found += 1
            title   = (titles[i] if i < len(titles) else '?').replace('\\u2019',"'").replace('\\u2014','—').replace('\\u2026','...')
            link    = f"https://reddit.com{permalinks[i]}" if i < len(permalinks) else '?'
            cmts    = num_comments[i] if i < len(num_comments) else '?'
            preview = (selftexts[i] if i < len(selftexts) else '').replace('\\n',' ').replace('\\u2019',"'").strip()[:180]

            print(f'  [{age_h:.1f}h ago] [{cmts} cmts] {title[:90]}')
            print(f'    {link}')
            if preview and preview not in ('','\\n'):
                print(f'    > {preview}')

        if not found:
            print('  No posts in last 26h')
    except Exception as e:
        print(f'  Error: {e}')
