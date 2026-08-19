/**
 * Generates official Postman Collection v2.1.0 schema JSON for DocForge API Engine
 */
function generatePostmanCollection() {
  return {
    info: {
      name: "DocForge API Engine Collection (v2.5.0)",
      description: "Official 1-Click Postman Collection for DocForge API Engine. Render PDF documents, manage server-side templates, execute batch render queues, verify Merkle Tree cryptographic ledgers, inspect Dead Letter Queue webhooks, and export SOC2 compliance audit logs.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
      {
        key: "baseUrl",
        value: "http://localhost:4000",
        type: "string"
      },
      {
        key: "apiKey",
        value: "df_live_demo_key_991823",
        type: "string"
      }
    ],
    item: [
      {
        name: "1. Core Rendering",
        item: [
          {
            name: "POST /v1/render (Render PDF)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "X-DocForge-Key", value: "{{apiKey}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  html: "<h1>Invoice #{{no}}</h1><p>Client: {{client}}</p>",
                  data: { no: "INV-2026-99", client: "Acme Corp" },
                  options: {
                    theme: "emerald",
                    watermark: "PAID",
                    compress: true,
                    display_header_footer: true
                  },
                  response_type: "json"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/v1/render",
                host: ["{{baseUrl}}"],
                path: ["v1", "render"]
              }
            }
          }
        ]
      },
      {
        name: "2. Templates",
        item: [
          {
            name: "POST /v1/templates (Create Template)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "X-DocForge-Key", value: "{{apiKey}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  template_id: "b2b_receipt",
                  name: "B2B Payment Receipt",
                  html: "<h1>Receipt #{{receipt_no}}</h1><p>Amount: ${{amount}}</p>"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/v1/templates",
                host: ["{{baseUrl}}"],
                path: ["v1", "templates"]
              }
            }
          },
          {
            name: "GET /v1/templates (List Templates)",
            request: {
              method: "GET",
              header: [
                { key: "X-DocForge-Key", value: "{{apiKey}}" }
              ],
              url: {
                raw: "{{baseUrl}}/v1/templates",
                host: ["{{baseUrl}}"],
                path: ["v1", "templates"]
              }
            }
          }
        ]
      },
      {
        name: "3. Batch Jobs",
        item: [
          {
            name: "POST /v1/render/batch (Create Batch Render)",
            request: {
              method: "POST",
              header: [
                { key: "Content-Type", value: "application/json" },
                { key: "X-DocForge-Key", value: "{{apiKey}}" }
              ],
              body: {
                mode: "raw",
                raw: JSON.stringify({
                  html: "<h1>Invoice #{{number}}</h1>",
                  items: [
                    { id: "inv_1", data: { number: "1001" } },
                    { id: "inv_2", data: { number: "1002" } }
                  ],
                  webhook_url: "{{baseUrl}}/v1/webhooks/simulator"
                }, null, 2)
              },
              url: {
                raw: "{{baseUrl}}/v1/render/batch",
                host: ["{{baseUrl}}"],
                path: ["v1", "render", "batch"]
              }
            }
          }
        ]
      },
      {
        name: "4. Ledger & Merkle Verification",
        item: [
          {
            name: "POST /v1/ledger/anchor (Merkle Tree Anchor)",
            request: {
              method: "POST",
              header: [
                { key: "X-DocForge-Key", value: "{{apiKey}}" }
              ],
              url: {
                raw: "{{baseUrl}}/v1/ledger/anchor",
                host: ["{{baseUrl}}"],
                path: ["v1", "ledger", "anchor"]
              }
            }
          },
          {
            name: "GET /v1/verify/proof/:hash (Verify Merkle Proof)",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/v1/verify/proof/3ef82f5f480d4bfe6e10e4bb4a446e5b7db67abee7a565de78f12a46436010af",
                host: ["{{baseUrl}}"],
                path: ["v1", "verify", "proof", "3ef82f5f480d4bfe6e10e4bb4a446e5b7db67abee7a565de78f12a46436010af"]
              }
            }
          }
        ]
      },
      {
        name: "5. Webhooks & DLQ",
        item: [
          {
            name: "GET /v1/webhooks/dlq (List Dead Letter Items)",
            request: {
              method: "GET",
              header: [
                { key: "X-DocForge-Key", value: "{{apiKey}}" }
              ],
              url: {
                raw: "{{baseUrl}}/v1/webhooks/dlq",
                host: ["{{baseUrl}}"],
                path: ["v1", "webhooks", "dlq"]
              }
            }
          }
        ]
      },
      {
        name: "6. Audit & Telemetry",
        item: [
          {
            name: "GET /v1/audit/export (Export SOC2 Audit Logs)",
            request: {
              method: "GET",
              header: [
                { key: "X-DocForge-Key", value: "{{apiKey}}" }
              ],
              url: {
                raw: "{{baseUrl}}/v1/audit/export?format=json",
                host: ["{{baseUrl}}"],
                path: ["v1", "audit", "export"],
                query: [{ key: "format", value: "json" }]
              }
            }
          },
          {
            name: "GET /v1/health (Health Check)",
            request: {
              method: "GET",
              url: {
                raw: "{{baseUrl}}/v1/health",
                host: ["{{baseUrl}}"],
                path: ["v1", "health"]
              }
            }
          }
        ]
      }
    ]
  };
}

module.exports = {
  generatePostmanCollection
};
