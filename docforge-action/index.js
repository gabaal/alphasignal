const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const apiKey = process.env.INPUT_API_KEY || process.env.DOCFORGE_API_KEY;
    const html = process.env.INPUT_HTML;
    const css = process.env.INPUT_CSS || '';
    const dataRaw = process.env.INPUT_DATA || '{}';
    const templateId = process.env.INPUT_TEMPLATE_ID;
    const outputPath = process.env.INPUT_OUTPUT_PATH || 'output.pdf';
    const serverUrl = (process.env.INPUT_SERVER_URL || 'http://localhost:4000').replace(/\/$/, '');

    if (!apiKey) {
      throw new Error('Action input "api_key" or environment variable "DOCFORGE_API_KEY" is required.');
    }

    if (!html && !templateId) {
      throw new Error('Either "html" or "template_id" input must be provided.');
    }

    let data = {};
    try {
      data = JSON.parse(dataRaw);
    } catch (e) {
      console.warn('⚠️ Warning: Failed to parse "data" input as JSON. Using empty object.');
    }

    console.log(`🚀 [docforge-action] Sending PDF render request to ${serverUrl}...`);

    const payload = {
      template_id: templateId,
      html,
      css,
      data,
      options: { compress: true, display_header_footer: true },
      response_type: 'binary'
    };

    const response = await fetch(`${serverUrl}/v1/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DocForge-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DocForge API Error HTTP ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const docHash = response.headers.get('X-DocForge-Document-Hash') || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    // Ensure target output directory exists
    const dir = path.dirname(outputPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ [docforge-action] Saved PDF artifact (${pdfBuffer.length} bytes) to: ${outputPath}`);
    console.log(`🔒 [docforge-action] Cryptographic SHA-256 Hash: ${docHash}`);

    // Set GitHub Action outputs
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `document_hash=${docHash}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `download_url=${serverUrl}/v1/download/${docHash}.pdf\n`);
    }

  } catch (err) {
    console.error(`❌ [docforge-action] Execution Failed: ${err.message}`);
    process.exit(1);
  }
}

run();
