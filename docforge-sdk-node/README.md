# @docforge/sdk

> **Official Node.js & TypeScript Client SDK for DocForge PDF API Engine**

[![npm version](https://img.shields.io/badge/npm-1.4.0-blue.svg)](https://www.npmjs.com/package/@docforge/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)

**DocForge** is a high-speed, developer-first HTML/CSS to PDF rendering engine with persistent SQLite cryptographic ledger stamps, server-side template versioning, and asynchronous batch rendering queues.

---

## 📦 Installation

```bash
npm install @docforge/sdk
```

---

## 🚀 Quick Start

```javascript
const { DocForge } = require('@docforge/sdk');

const client = new DocForge({
  apiKey: 'df_live_your_api_key_here',
  baseUrl: 'http://localhost:4000'
});

async function main() {
  // 1. Render PDF from raw HTML/CSS
  const pdfBuffer = await client.render({
    html: '<h1>Invoice #{{number}}</h1><p>Client: {{client}}</p>',
    css: 'h1 { color: #059669; }',
    data: { number: 'INV-2026-99', client: 'Acme Corp' },
    options: { theme: 'emerald', watermark: 'PAID' },
    response_type: 'binary'
  });

  console.log('✅ PDF Rendered! Length:', pdfBuffer.length, 'bytes');
  console.log('   SHA-256 Hash Stamp:', pdfBuffer.hash);

  // 2. Verify Document Ledger Authenticity
  const verify = await client.verify(pdfBuffer.hash);
  console.log('✅ Ledger Status:', verify.is_valid ? 'AUTHENTIC' : 'INVALID');
}

main();
```

---

## 📑 Server-Side Templates API

Register reusable Handlebars HTML/CSS layout templates on the server with automatic sequential versioning (`v1`, `v2`...):

```javascript
// Register or Update a Template Version
const tmpl = await client.createTemplate({
  template_id: 'b2b_saas_invoice',
  name: 'B2B SaaS Monthly Invoice',
  html: '<div class="inv"><h1>INVOICE #{{number}}</h1><p>Amount: ${{amount}}</p></div>',
  css: 'h1 { color: #4f46e5; }',
  default_options: { theme: 'emerald', watermark: 'PAID' }
});

console.log('Created Template Version:', tmpl.template.version);

// Render PDF using Server-Side Template ID
const pdf = await client.render({
  template_id: 'b2b_saas_invoice',
  data: { number: 'INV-9901', amount: '4,500.00' }
});
```

---

## ⚡ Asynchronous Batch PDF Queue

Render hundreds of PDFs asynchronously in background queues without HTTP timeouts:

```javascript
// Enqueue Batch Render Job
const batch = await client.renderBatch({
  template_id: 'b2b_saas_invoice',
  items: [
    { id: 'doc_1', data: { number: 'INV-001', amount: '150.00' } },
    { id: 'doc_2', data: { number: 'INV-002', amount: '290.00' } }
  ],
  webhook_url: 'https://api.yourcompany.com/webhooks/docforge'
});

console.log('Batch Enqueued ID:', batch.batch_id);

// Check Real-Time Job Progress
const status = await client.getJobStatus(batch.batch_id);
console.log(`Progress: ${status.job.progress_percent}% (${status.job.processed_items}/${status.job.total_items})`);
```

---

## 🛡️ Public Cryptographic Ledger Verification

Verify SHA-256 document stamps against DocForge's persistent ledger:

```javascript
const result = await client.verify('e6e76cc339673a3dc30b593e97fba39ffdec8bbf49485314e2350d52e8321d40');
console.log(result);
// {
//   is_valid: true,
//   document_hash: "e6e76cc3...",
//   issued_at: "2026-07-23T09:43:37.704Z",
//   account_id: "acct_prod_991823",
//   tamper_check: "Passed (0 byte modifications)"
// }
```

---

## 📖 API Documentation

For complete interactive documentation, visit `http://localhost:4000/docs`.

License: [MIT](https://opensource.org/licenses/MIT) &copy; 2026 AlphaSignal Global.
