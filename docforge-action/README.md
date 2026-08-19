# DocForge GitHub Action (`docforge-action`)

Official GitHub Action for compiling dynamic HTML/CSS templates into cryptographic PDF documents using **DocForge API Engine**.

---

## ⚡ Quickstart Recipe

Add this step to your GitHub Actions workflow file (e.g. `.github/workflows/generate-docs.yml`):

```yaml
name: Generate Release PDF

on:
  push:
    branches: [ main ]

jobs:
  build-pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate Release Notes PDF
        uses: ./docforge-action
        with:
          api_key: ${{ secrets.DOCFORGE_API_KEY }}
          html: '<h1>Release Notes v2.4.0</h1><p>Build Commit: ${{ github.sha }}</p>'
          output_path: 'build/release-notes.pdf'
          server_url: 'http://localhost:4000'

      - name: Upload PDF Artifact
        uses: actions/upload-artifact@v4
        with:
          name: release-pdf
          path: build/release-notes.pdf
```

---

## ⚙️ Inputs

| Input Name | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `api_key` | **Yes** | — | DocForge API Secret Key (`df_live_...`) |
| `html` | No | — | Inline HTML markup or Handlebars template |
| `css` | No | — | Custom CSS stylesheet rules |
| `data` | No | `{}` | JSON string of variable bindings |
| `template_id` | No | — | Registered server-side template ID |
| `output_path` | No | `output.pdf` | Target path to save generated PDF binary |
| `server_url` | No | `http://localhost:4000` | Target DocForge server endpoint |

---

## 📤 Outputs

| Output Name | Description |
| :--- | :--- |
| `document_hash` | Cryptographic SHA-256 hash of the generated PDF document |
| `download_url` | Direct presigned download URL for the artifact |
