# docforge

> **Official Python Client SDK for DocForge PDF API Engine**

[![PyPI version](https://img.shields.io/badge/pypi-1.4.0-blue.svg)](https://pypi.org/project/docforge/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)

**DocForge** is a high-speed, developer-first HTML/CSS to PDF rendering engine with persistent SQLite cryptographic ledger stamps, server-side template versioning, and asynchronous batch rendering queues.

---

## 📦 Installation

```bash
pip install docforge
```

---

## 🚀 Quick Start

```python
from docforge import DocForgeClient

client = DocForgeClient(
    api_key="df_live_your_api_key_here",
    base_url="http://localhost:4000"
)

# 1. Render PDF from raw HTML/CSS
result = client.render(
    html="<h1>Invoice #{{number}}</h1><p>Client: {{client}}</p>",
    css="h1 { color: #0284c7; }",
    data={"number": "INV-PY-2026", "client": "AlphaSignal Python Integration"},
    options={"theme": "dark", "watermark": "SAMPLE"},
    response_type="binary"
)

print("✅ PDF Rendered! Length:", len(result), "bytes")
print("   SHA-256 Hash Stamp:", result.document_hash)

# Save PDF to disk
result.save("output_invoice.pdf")

# 2. Verify Document Ledger Authenticity
verification = client.verify(result.document_hash)
print("✅ Ledger Verification Status:", "AUTHENTIC" if verification.get("is_valid") else "INVALID")
```

---

## 📑 Server-Side Templates API

Register reusable Handlebars HTML/CSS layout templates on the server with automatic sequential versioning (`v1`, `v2`...):

```python
# Register or Update a Template Version
tmpl = client.create_template(
    template_id="b2b_saas_invoice",
    name="B2B SaaS Monthly Invoice",
    html="<div class='inv'><h1>INVOICE #{{number}}</h1><p>Amount: ${{amount}}</p></div>",
    css="h1 { color: #4f46e5; }",
    default_options={"theme": "emerald", "watermark": "PAID"}
)

print("Created Template Version:", tmpl.get("template", {}).get("version"))

# Render PDF using Server-Side Template ID
pdf = client.render(
    template_id="b2b_saas_invoice",
    data={"number": "INV-PY-9901", "amount": "4,500.00"}
)
```

---

## ⚡ Asynchronous Batch PDF Queue

Render hundreds of PDFs asynchronously in background queues without HTTP timeouts:

```python
# Enqueue Batch Render Job
batch = client.render_batch(
    template_id="b2b_saas_invoice",
    items=[
        {"id": "doc_1", "data": {"number": "INV-001", "amount": "150.00"}},
        {"id": "doc_2", "data": {"number": "INV-002", "amount": "290.00"}}
    ],
    webhook_url="https://api.yourcompany.com/webhooks/docforge"
)

print("Batch Enqueued ID:", batch.get("batch_id"))

# Check Real-Time Job Progress
job_status = client.get_job_status(batch.get("batch_id"))
job = job_status.get("job", {})
print(f"Progress: {job.get('progress_percent')}% ({job.get('processed_items')}/{job.get('total_items')})")
```

---

## 🛡️ Public Cryptographic Ledger Verification

Verify SHA-256 document stamps against DocForge's persistent ledger:

```python
result = client.verify("37a7a69d1bc8f3d490b7564971fecc76a1013f8da97400c40d5b33cea4c667e8")
print(result)
```

---

## 📖 API Documentation

For complete interactive documentation, visit `http://localhost:4000/docs`.

License: [MIT](https://opensource.org/licenses/MIT) &copy; 2026 AlphaSignal Global.
