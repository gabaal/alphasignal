# DocForge Ecosystem v1.4.0

> **Developer-First HTML/CSS to PDF API Engine with Persistent Cryptographic Ledger, Server-Side Templates, Async Batch Queues, and Multi-Tenant Rate Limiting**

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://docforge.digital)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)

---

## 🏛️ Ecosystem Overview & Applications

| Application / Module | Port / Path | Purpose & Functionality |
| :--- | :--- | :--- |
| **`docforge-backend`** | `http://localhost:4000` | Core Express & Puppeteer cluster PDF rendering engine with SQLite ledger and rate limiting. |
| **`docforge-studio`** | `http://localhost:4001` | Live visual Web IDE with template saving, rendering playground, and webhook simulator. |
| **`docforge-landing`** | `http://localhost:4002` | Developer landing portal with feature demos and pricing. |
| **Verification Portal** | `http://localhost:4000/verify` | Standalone public drag-and-drop PDF SHA-256 cryptographic verification portal. |
| **Interactive API Docs** | `http://localhost:4000/docs` | Swagger UI interactive API testing suite. |
| **`docforge-cli`** | Binary `docforge` | Terminal & CI/CD CLI tool (`docforge render`, `docforge template push`, `docforge verify`). |
| **`@docforge/sdk`** | `docforge-sdk-node` | Official Node.js & TypeScript SDK (npm v1.4.0). |
| **`docforge`** | `docforge-sdk-python` | Official Python SDK (PyPI v1.4.0). |

---

## 🚀 Key Features

- **🚀 Sub-200ms PDF Rendering**: Powered by dedicated Headless Chrome rendering clusters.
- **🛡️ Persistent Cryptographic Ledger**: Zero-dependency `node:sqlite` database recording SHA-256 document hashes, timestamps, render latency telemetry, and HMAC signatures.
- **📑 Server-Side Template Storage & Versioning**: Auto-versioning layout storage (`v1`, `v2`...) via `POST /v1/templates`.
- **⚡ Asynchronous Batch Rendering Queue**: Bulk PDF processing via `POST /v1/render/batch` with real-time status polling (`GET /v1/jobs/:batch_id`) and webhooks.
- **🔒 Multi-Tenant API Keys & Rate Limiting**: Per-minute request quota enforcement (`X-RateLimit-*` headers) and API key revocation (`/v1/keys`).
- **🔍 Client-Side PDF Verification**: Public verification portal (`/verify`) using browser SubtleCrypto API for zero-transfer PDF authenticity checks.

---

## 💻 Quick Start & SDK Usage

### Node.js / TypeScript SDK

```bash
npm install @docforge/sdk
```

```javascript
const { DocForge } = require('@docforge/sdk');

const client = new DocForge({
  apiKey: 'df_live_swagger_demo_key_991823',
  baseUrl: 'http://localhost:4000'
});

async function main() {
  // Render using Server-Side Template ID
  const pdfBuffer = await client.render({
    template_id: 'b2b_saas_invoice',
    data: { number: 'INV-2026-99', amount: '1,500.00' }
  });

  console.log('Document SHA-256 Hash:', pdfBuffer.hash);

  // Verify Ledger Authenticity
  const verify = await client.verify(pdfBuffer.hash);
  console.log('Ledger Verification Status:', verify.is_valid ? 'AUTHENTIC' : 'INVALID');
}

main();
```

---

### Python SDK

```bash
pip install docforge
```

```python
from docforge import DocForgeClient

client = DocForgeClient(
    api_key="df_live_swagger_demo_key_991823",
    base_url="http://localhost:4000"
)

result = client.render(
    template_id="b2b_saas_invoice",
    data={"number": "INV-PY-2026", "amount": "2,400.00"}
)

print("PDF Byte Length:", len(result))
print("Document SHA-256 Hash:", result.document_hash)
```

---

## 💻 CLI Tool Usage

```bash
# Render PDF from local files
docforge render invoice.html --css style.css --data data.json --out invoice.pdf

# Push layout to server-side template database
docforge template push --id b2b_saas_invoice --name "B2B SaaS Monthly Invoice" --html layout.html

# Verify document hash against persistent ledger
docforge verify e6e76cc339673a3dc30b593e97fba39ffdec8bbf49485314e2350d52e8321d40
```

---

## 📖 API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/v1/render` | `POST` | Render PDF from inline HTML/CSS or server-side `template_id`. |
| `/v1/render/batch` | `POST` | Enqueue asynchronous batch PDF rendering job. |
| `/v1/jobs/:batch_id` | `GET` | Query batch job execution progress and item download URLs. |
| `/v1/templates` | `POST` / `GET` | Save/version server layout templates or list registered templates. |
| `/v1/templates/:id` | `GET` | Fetch template details and version history. |
| `/v1/keys` | `POST` / `GET` | Provision a new API key or list account keys. |
| `/v1/keys/:key_id` | `DELETE` | Revoke an API key. |
| `/v1/verify/:hash` | `GET` | Verify SHA-256 document hash against cryptographic ledger. |
| `/verify` | `GET` | Public drag-and-drop PDF verification web portal. |
| `/v1/health` | `GET` | API cluster health status & total document telemetry. |

---

License: [MIT](https://opensource.org/licenses/MIT) &copy; 2026 AlphaSignal Global.
