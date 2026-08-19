// DocForge Landing Page — Interactive Application Engine

// 1. HERO TERMINAL CODE SNIPPETS
const HERO_SNIPPETS = {
  curl: `curl -X POST "http://localhost:4000/v1/render" \\
  -H "X-DocForge-Key: df_live_8f92a4b912c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<h1>Invoice #{{no}}</h1><p>Client: {{client}}</p>",
    "data": { "no": "INV-2026-99", "client": "Apex Systems" },
    "options": { "theme": "emerald", "compress": true, "display_header_footer": true }
  }' --output invoice.pdf`,

  node: `import { DocForge } from '@docforge/sdk';

const client = new DocForge({ apiKey: 'df_live_8f92a4b912c' });
const pdfBuffer = await client.render({
  html: '<h1>Invoice #{{no}}</h1>',
  data: { no: 'INV-2026-99' },
  options: { theme: 'emerald', compress: true }
});

const anchor = await client.anchorLedger();
console.log('Merkle Root:', anchor.merkle_root);`,

  python: `from docforge import DocForgeClient

client = DocForgeClient(api_key="df_live_8f92a4b912c")
result = client.render(
    html="<h1>Invoice #{{no}}</h1>",
    data={"no": "INV-2026-99"},
    options={"theme": "emerald", "compress": True}
)

anchor = client.anchor_ledger()
print(f"Merkle Root: {anchor['merkle_root']}")`,

  go: `package main
import "github.com/docforge/docforge-go"

func main() {
    client := docforge.NewClient("df_live_8f92a4b912c", "")
    res, _ := client.Render(docforge.RenderPayload{
        HTML: "<h1>Invoice #{{no}}</h1>",
        Options: docforge.RenderOptions{Theme: "emerald", Compress: true},
    })
    anchor, _ := client.AnchorLedger()
    _ = res
}`,

  rust: `use docforge::DocForgeClient;

let client = DocForgeClient::new("df_live_8f92a4b912c", None);
let health_url = client.health_endpoint();
let anchor_url = client.anchor_endpoint();`
};

// 2. SDK SHOWCASE CODE SNIPPETS
const SDK_SNIPPETS = {
  node: `// 1. Install official Node.js / TypeScript SDK
npm install @docforge/sdk

// 2. Render PDF & Verify Merkle Root
import { DocForge } from '@docforge/sdk';

const client = new DocForge({ apiKey: process.env.DOCFORGE_API_KEY });
const pdfBuffer = await client.render({
  html: '<h1>Order #{{id}}</h1>',
  data: { id: '991823' },
  options: { format: 'A4', compress: true }
});
const proof = await client.verifyProof(pdfBuffer.hash);`,

  python: `# 1. Install official Python SDK
pip install docforge

# 2. Render PDF & Verify Merkle Root
from docforge import DocForgeClient

client = DocForgeClient(api_key=os.environ["DOCFORGE_API_KEY"])
result = client.render(
    html="<h1>Order #{{id}}</h1>",
    data={"id": "991823"},
    options={"format": "A4", "compress": True}
)
proof = client.verify_proof(result.document_hash)`,

  go: `// 1. Import official Go SDK
import "github.com/docforge/docforge-go"

// 2. Render PDF & Verify Merkle Root
client := docforge.NewClient(os.Getenv("DOCFORGE_API_KEY"), "")
res, _ := client.Render(docforge.RenderPayload{
    HTML: "<h1>Order #{{id}}</h1>",
    Options: docforge.RenderOptions{Format: "A4", Compress: true},
})
proof, _ := client.VerifyProof(res.DocumentHash)`,

  rust: `// 1. Add docforge to Cargo.toml
// docforge = "2.2.0"

// 2. Initialize Rust Client
use docforge::DocForgeClient;

let client = DocForgeClient::new(std::env::var("DOCFORGE_API_KEY").unwrap(), None);
let proof_url = client.verify_proof_endpoint("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");`
};

let currentHeroLang = 'curl';
let currentSdkLang = 'node';

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  setupHeroTerminalTabs();
  setupSdkTabs();
  updateHeroSnippetDisplay();
  updateSdkCodeDisplay();
  updatePricingCalculator();
});

// HERO TERMINAL TAB LOGIC
function setupHeroTerminalTabs() {
  const tabs = document.querySelectorAll('.term-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentHeroLang = tab.getAttribute('data-lang');
      updateHeroSnippetDisplay();
    });
  });
}

function updateHeroSnippetDisplay() {
  const codeEl = document.getElementById('heroCodeSnippet');
  if (codeEl) codeEl.innerText = HERO_SNIPPETS[currentHeroLang];
}

// SDK TAB LOGIC
function setupSdkTabs() {
  const tabs = document.querySelectorAll('.sdk-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSdkLang = tab.getAttribute('data-sdk');
      updateSdkCodeDisplay();
    });
  });
}

function updateSdkCodeDisplay() {
  const codeEl = document.getElementById('sdkCodeDisplay');
  if (codeEl) codeEl.innerText = SDK_SNIPPETS[currentSdkLang];
}

// INTERACTIVE PRICING CALCULATOR LOGIC
function updatePricingCalculator() {
  const slider = document.getElementById('pdfSlider');
  if (!slider) return;

  const vol = parseInt(slider.value, 10);
  
  const displayVolEl = document.getElementById('sliderVolDisplay');
  const tierNameEl = document.getElementById('calcTierName');
  const priceEl = document.getElementById('calcMonthlyPrice');
  const perDocEl = document.getElementById('calcPerDocCost');
  const docforgeCostEl = document.getElementById('docforgeCostVal');
  const selfHostCostEl = document.getElementById('selfHostCostVal');

  if (displayVolEl) displayVolEl.innerText = `${vol.toLocaleString()} PDFs / mo`;

  let tierName = "Free Tier";
  let monthlyPrice = 0;
  let perDoc = 0.000;

  if (vol <= 2500) {
    tierName = "Developer Free";
    monthlyPrice = 0;
    perDoc = 0.000;
  } else if (vol <= 50000) {
    tierName = "Growth Plan";
    monthlyPrice = Math.round(19 + (vol / 50000) * 60);
    perDoc = (monthlyPrice / vol);
  } else if (vol <= 250000) {
    tierName = "Scale Tier";
    monthlyPrice = Math.round(79 + (vol / 250000) * 170);
    perDoc = (monthlyPrice / vol);
  } else {
    tierName = "Enterprise Cluster";
    monthlyPrice = Math.round(249 + ((vol - 250000) / 250000) * 250);
    perDoc = (monthlyPrice / vol);
  }

  // Calculate self-hosting AWS costs (EC2 worker + Lambda invocation + Engineer time)
  const selfHostCost = Math.round(monthlyPrice * 3.2 + 80);

  if (tierNameEl) tierNameEl.innerText = tierName;
  if (priceEl) priceEl.innerHTML = `$${monthlyPrice} <span class="period">/ month</span>`;
  if (perDocEl) perDocEl.innerText = `$${perDoc.toFixed(4)} per PDF`;
  if (docforgeCostEl) docforgeCostEl.innerText = `$${monthlyPrice} / mo`;
  if (selfHostCostEl) selfHostCostEl.innerText = `$${selfHostCost} / mo`;
}

// COPY CODE HELPERS
function copyHeroCode() {
  const codeEl = document.getElementById('heroCodeSnippet');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.innerText);
    alert('Copied hero code snippet to clipboard!');
  }
}

function copySdkCode() {
  const codeEl = document.getElementById('sdkCodeDisplay');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.innerText);
    alert('Copied SDK quickstart snippet to clipboard!');
  }
}
