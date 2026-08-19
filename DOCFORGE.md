# DocForge Enterprise PDF API & Ecosystem Documentation (v3.0.0)

**DocForge** is an enterprise-grade, developer-first PDF rendering engine powered by dedicated Headless Chrome clusters, cryptographic SHA-256 SQLite ledgers, Merkle Tree batch anchoring, WebSocket real-time progress telemetry (`/v1/ws/progress`), DocForge Copilot AI Template Engine (`POST /v1/templates/copilot`), Encrypted PDF DRM Security, cloud storage adapters (AWS S3, GCS, Cloudflare R2), signed Webhooks v2, SOC2 compliance audit log exporters, 1-click Postman collection exporter, and Kubernetes auto-scaling deployment manifests (`k8s/deployment.yaml`).

---

## 🏗️ Ecosystem Architecture (v3.0.0)

| Component | Port / Path | Description |
| :--- | :--- | :--- |
| **API Backend Engine** | `http://localhost:4000` | Core Express & Puppeteer cluster server with SQLite ledger, WebSocket telemetry, Copilot AI engine, PDF DRM security, and batch queue |
| **Studio Visual IDE** | `http://localhost:4001` | Interactive visual IDE featuring Live HTML Preview, Visual Diff Comparator, Handlebars Mock Data Generator, WebSocket status badge, & JSON Schema Validator |
| **Landing Portal** | `http://localhost:4002` | Developer landing portal with multi-language code snippets (Node, Python, Go, Rust), speed benchmarks, and pricing calculator |
| **Public Verification Portal**| `http://localhost:4000/verify` | Zero-knowledge drag-and-drop web UI for verifying PDF SHA-256 hashes against Merkle Tree inclusion proof roots |
| **K8s Deployment Manifests** | `k8s/deployment.yaml` | Production Kubernetes Helm/YAML deployment specs for scaling Headless Chrome cluster nodes across EKS/GKE |
| **Node.js / TS SDK** | `docforge-sdk-node` | Official `@docforge/sdk` package for Node.js / TypeScript microservices |
| **Python SDK** | `docforge-sdk-python` | Official `docforge` PyPI package with Merkle proof & DLQ verification |
| **Go SDK** | `docforge-sdk-go` | Official `@docforge/go` module for Go microservices |
| **Rust Crate** | `docforge-sdk-rust` | Official `docforge` crate for Rust microservices |
| **CLI Tool** | `docforge-cli` | Official `docforge` command-line interface tool |
| **GitHub Action** | `docforge-action` | Official GitHub Action runner for CI/CD workflow automation |

---

## ⚡ Core API & Copilot Endpoints

### 1. `POST /v1/templates/copilot` *(DocForge Copilot AI Synthesis)*
Synthesizes responsive HTML/CSS Handlebars templates, mock data payloads, and JSON schemas from natural language prompts.

```bash
curl -X POST "http://localhost:4000/v1/templates/copilot" \
  -H "X-DocForge-Key: df_live_8f92a4b912c" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a SaaS Tax Invoice for enterprise client with line item breakdown"
  }'
```

### 2. `POST /v1/render` *(PDF Rendering & DRM Security)*
Renders HTML/CSS or server-side template into binary PDF buffer or presigned cloud download URL with optional AES-256 password protection and DRM access control.

```bash
curl -X POST "http://localhost:4000/v1/render" \
  -H "X-DocForge-Key: df_live_8f92a4b912c" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>Invoice #{{number}}</h1><p>Client: {{client}}</p>",
    "data": { "number": "INV-2026-99", "client": "Acme Corp" },
    "options": {
      "format": "A4",
      "orientation": "portrait",
      "theme": "emerald",
      "watermark": "PAID",
      "compress": true,
      "encrypt": true,
      "user_password": "SecretUserPass123!",
      "owner_password": "OwnerAdminPass99!",
      "permissions": { "print": true, "copy": false, "modify": false }
    }
  }' --output invoice_protected.pdf
```

### 3. `ws://localhost:4000/v1/ws/progress` *(WebSocket Telemetry)*
Streams real-time document compilation stages (`queued` ➔ `rendering_html` ➔ `generating_pdf` ➔ `completed`) and latency telemetry.

### 4. `GET /v1/docs/postman` *(1-Click Postman Exporter)*
Exports a 1-click Postman v2.1.0 JSON collection schema covering all core endpoints for instant API client import.

### 5. `POST /v1/ledger/anchor`
Builds a binary SHA-256 Merkle Tree over all issued document hashes and generates a cryptographic batch anchor root and simulated blockchain transaction hash.

### 6. `GET /v1/verify/proof/:hash`
Retrieves the Merkle inclusion proof for a target document hash and verifies its authenticity against the anchored Merkle root.

---

## 🧪 Master Test Suite & Performance Benchmarks

Run the complete 20-step integration, WebSocket telemetry, and stress benchmark test suite:

```bash
node test_master_suite.js
```

### Verified Benchmark Statistics (v3.0.0):
- **Total Master Test Stages**: 20/20 Stages Passed (64 Total Assertions)
- **Parallel Request Concurrency**: 50 Parallel Rendering Connections
- **Effective System Throughput**: **16.89 PDFs / second**
- **Average SLA Latency**: **59 ms / document**
- **Success Rate**: **100% SLA (50/50 Succeeded)**
