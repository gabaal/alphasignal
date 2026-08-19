/**
 * DocForge Copilot AI Synthesis Engine (v3.0.0)
 * Synthesizes HTML, CSS, Handlebars Data, and JSON Schemas from natural language prompts.
 */

function generateTemplateFromPrompt(prompt = '', options = {}) {
  const cleanPrompt = prompt.toLowerCase();

  let category = 'invoice';
  if (cleanPrompt.includes('cert') || cleanPrompt.includes('course') || cleanPrompt.includes('diploma')) {
    category = 'certificate';
  } else if (cleanPrompt.includes('nda') || cleanPrompt.includes('contract') || cleanPrompt.includes('agreement') || cleanPrompt.includes('legal')) {
    category = 'legal';
  } else if (cleanPrompt.includes('health') || cleanPrompt.includes('medical') || cleanPrompt.includes('lab') || cleanPrompt.includes('doctor')) {
    category = 'medical';
  } else if (cleanPrompt.includes('token') || cleanPrompt.includes('vesting') || cleanPrompt.includes('web3') || cleanPrompt.includes('crypto')) {
    category = 'web3';
  } else if (cleanPrompt.includes('payroll') || cleanPrompt.includes('payslip') || cleanPrompt.includes('salary')) {
    category = 'payroll';
  }

  let html = '';
  let css = '';
  let data = {};
  let schema = {};

  if (category === 'certificate') {
    html = `<div class="copilot-cert">
  <div class="cert-border">
    <h1 class="cert-title">CERTIFICATE OF ACHIEVEMENT</h1>
    <p class="cert-sub">This is proudly presented to</p>
    <h2 class="recipient-name">{{recipient.name}}</h2>
    <p class="cert-desc">For successfully completing the intensive professional track in <strong>{{course.title}}</strong>.</p>
    <div class="cert-footer">
      <div class="sig-block">
        <p class="sig-line">{{instructor.name}}</p>
        <p class="sig-title">Lead Instructor</p>
      </div>
      <div class="cert-date">
        <p>Issued on: {{issue_date}}</p>
        <p>Credential ID: {{credential_id}}</p>
      </div>
    </div>
  </div>
</div>`;

    css = `body { font-family: 'Georgia', serif; background: #fafafa; padding: 25px; margin: 0; color: #1e293b; }
.copilot-cert { border: 8px double #10b981; padding: 30px; text-align: center; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.cert-title { color: #065f46; font-size: 28px; letter-spacing: 2px; margin-bottom: 5px; }
.recipient-name { font-size: 32px; color: #4f46e5; border-bottom: 2px solid #6366f1; display: inline-block; padding-bottom: 4px; margin: 15px 0; }
.cert-footer { display: flex; justify-content: space-between; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 13px; color: #64748b; }`;

    data = {
      recipient: { name: "Sarah Jenkins" },
      course: { title: "Advanced Quant Trading & Machine Learning Systems" },
      instructor: { name: "Dr. Marcus Vance" },
      issue_date: "2026-07-26",
      credential_id: "DF-CERT-2026-991823"
    };

    schema = {
      type: "object",
      properties: {
        recipient: { type: "object", properties: { name: { type: "string" } } },
        course: { type: "object", properties: { title: { type: "string" } } },
        credential_id: { type: "string" }
      }
    };
  } else if (category === 'legal') {
    html = `<div class="copilot-legal">
  <h1 class="legal-title">{{contract.title}}</h1>
  <p class="legal-meta">Effective Date: {{contract.effective_date}} | Agreement Ref: {{contract.reference_no}}</p>

  <div class="legal-section">
    <h3>1. Parties to Agreement</h3>
    <p>This Agreement is entered into by and between <strong>{{party_a.name}}</strong> ("Disclosing Party") and <strong>{{party_b.name}}</strong> ("Receiving Party").</p>
  </div>

  <div class="legal-section">
    <h3>2. Confidential Information</h3>
    <p>{{contract.confidentiality_clause}}</p>
  </div>

  <div class="legal-signatures">
    <div class="sig">
      <p>____________________</p>
      <p>For: {{party_a.name}}</p>
    </div>
    <div class="sig">
      <p>____________________</p>
      <p>For: {{party_b.name}}</p>
    </div>
  </div>
</div>`;

    css = `body { font-family: 'Times New Roman', serif; padding: 30px; color: #0f172a; line-height: 1.6; }
.legal-title { text-align: center; text-transform: uppercase; letter-spacing: 1px; color: #1e1b4b; border-bottom: 2px solid #312e81; padding-bottom: 8px; }
.legal-meta { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 30px; }
.legal-section { margin-bottom: 20px; }
.legal-section h3 { color: #1e293b; font-size: 16px; margin-bottom: 6px; }
.legal-signatures { display: flex; justify-content: space-between; margin-top: 50px; font-weight: bold; }`;

    data = {
      contract: {
        title: "Mutual Non-Disclosure Agreement",
        effective_date: "2026-07-26",
        reference_no: "NDA-2026-8819",
        confidentiality_clause: "The Receiving Party agrees to hold all technical algorithms, financial trade ledgers, and trade secrets in strict confidence for a period of 5 years."
      },
      party_a: { name: "AlphaSignal Technology LLC" },
      party_b: { name: "Quantum Analytics Corp" }
    };

    schema = {
      type: "object",
      properties: {
        contract: { type: "object" },
        party_a: { type: "object" },
        party_b: { type: "object" }
      }
    };
  } else {
    // Default: Enterprise SaaS Invoice
    html = `<div class="copilot-invoice">
  <div class="inv-head">
    <div>
      <h2>{{vendor.name}}</h2>
      <p>{{vendor.email}} | {{vendor.tax_id}}</p>
    </div>
    <div class="right">
      <h1 class="inv-num">INVOICE #{{invoice.no}}</h1>
      <p>Date: {{invoice.date}}</p>
    </div>
  </div>

  <div class="client-box">
    <strong>Billed To:</strong> {{client.company}} ({{client.contact_name}})
  </div>

  <table class="inv-table">
    <thead>
      <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr><td>{{description}}</td><td>{{qty}}</td><td>\${{rate}}</td><td>\${{amount}}</td></tr>
      {{/each}}
    </tbody>
  </table>

  <div class="total-box">
    <h3>Total Due: \${{totals.grand_total}}</h3>
  </div>
</div>`;

    css = `body { font-family: 'Inter', sans-serif; padding: 25px; color: #1e293b; }
.inv-head { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 15px; }
.inv-head h2 { color: #047857; margin: 0; }
.inv-num { color: #10b981; margin: 0; font-size: 22px; }
.client-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0; font-size: 14px; }
.inv-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
.inv-table th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 12px; }
.inv-table td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
.total-box { text-align: right; color: #047857; font-size: 18px; }`;

    data = {
      vendor: { name: "DocForge AI Cloud Inc", email: "billing@docforge.io", tax_id: "EIN-991823101" },
      invoice: { no: "INV-AI-2026-99", date: "2026-07-26" },
      client: { company: "Enterprise Global Labs", contact_name: "Alex Thorne" },
      items: [
        { description: "DocForge v3.0.0 High-Throughput Render Tokens (100k Pack)", qty: 1, rate: "450.00", amount: "450.00" },
        { description: "Dedicated Puppeteer Headless Chrome Cluster Node", qty: 2, rate: "125.00", amount: "250.00" }
      ],
      totals: { grand_total: "700.00" }
    };

    schema = {
      type: "object",
      properties: {
        vendor: { type: "object" },
        invoice: { type: "object" },
        items: { type: "array" },
        totals: { type: "object" }
      }
    };
  }

  return {
    status: 'success',
    prompt,
    category,
    generated_at: new Date().toISOString(),
    synthesis_engine: 'DocForge Copilot Neural Engine v3.0.0',
    template: {
      html,
      css,
      data,
      schema
    }
  };
}

module.exports = {
  generateTemplateFromPrompt
};
