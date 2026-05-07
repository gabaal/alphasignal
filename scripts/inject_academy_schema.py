#!/usr/bin/env python3
"""
inject_academy_schema.py
------------------------
Scans every Academy article HTML and injects an Article JSON-LD schema block
into the <head>. This enables Google to display rich results for these pages.

Rules:
  - Parses <title> and <meta name="description"> to populate the schema.
  - Injects just before the closing </head> tag.
  - Skips if the schema is already present.
  - Creates backups in academy/backups/ (re-uses existing if present).
"""

import os
import re
import shutil
from pathlib import Path
from datetime import datetime

ACADEMY_DIR = Path(__file__).parent.parent / "academy"
BACKUP_DIR  = ACADEMY_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)

# Fixed publishing date for the current batch
PUB_DATE = "2024-05-01T08:00:00Z"
MOD_DATE = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

SCHEMA_TEMPLATE = """    <!-- Article JSON-LD Schema -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "{title}",
      "description": "{description}",
      "image": "https://alphasignal.digital/assets/social-preview.png",
      "author": {{
        "@type": "Organization",
        "name": "AlphaSignal Quant Academy",
        "url": "https://alphasignal.digital/"
      }},
      "publisher": {{
        "@type": "Organization",
        "name": "AlphaSignal",
        "logo": {{
          "@type": "ImageObject",
          "url": "https://alphasignal.digital/assets/pwa-icon-512.png"
        }}
      }},
      "datePublished": "{pub_date}",
      "dateModified": "{mod_date}",
      "mainEntityOfPage": {{
        "@type": "WebPage",
        "@id": "https://alphasignal.digital/academy/{slug}"
      }}
    }}
    </script>
"""

def process_all():
    html_files = sorted(ACADEMY_DIR.glob("*.html"))
    total_files = 0
    injected_count = 0

    print(f"Academy directory: {ACADEMY_DIR}")
    print(f"Found {len(html_files)} HTML files\n")
    print(f"{'File':<55} {'Status':>15}")
    print("-" * 72)

    for path in html_files:
        if path.name == "index.html":
            continue

        original = path.read_text(encoding="utf-8")

        # Skip if already injected
        if '"@type": "Article"' in original:
            print(f"  {path.name:<53} Skipped (exists)")
            continue

        # Extract Title
        title_match = re.search(r'<title>(.*?)</title>', original, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip().replace('"', '\\"') if title_match else "AlphaSignal Quant Academy Article"

        # Extract Description
        desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', original, re.IGNORECASE | re.DOTALL)
        if not desc_match:
            # Try alternative attribute order
            desc_match = re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', original, re.IGNORECASE | re.DOTALL)
        
        desc = desc_match.group(1).strip().replace('"', '\\"') if desc_match else title

        slug = path.stem

        schema_block = SCHEMA_TEMPLATE.format(
            title=title,
            description=desc,
            pub_date=PUB_DATE,
            mod_date=MOD_DATE,
            slug=slug
        )

        # Inject right before </head>
        if '</head>' in original:
            modified = original.replace('</head>', schema_block + '</head>')
            
            # Backup original
            backup_path = BACKUP_DIR / path.name
            if not backup_path.exists():
                shutil.copy2(path, backup_path)
                
            path.write_text(modified, encoding="utf-8")
            injected_count += 1
            print(f"  {path.name:<53} + Injected")
        else:
            print(f"  {path.name:<53} Failed (no </head>)")
            
        total_files += 1

    print("-" * 72)
    print(f"\n[DONE] Schema injected into {injected_count} of {total_files} articles.")


if __name__ == "__main__":
    process_all()
