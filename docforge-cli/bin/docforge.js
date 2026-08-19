#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { DocForge } = require('../../docforge-sdk-node/index.js');

const DEFAULT_URL = process.env.DOCFORGE_API_URL || 'http://localhost:4000';
const DEFAULT_KEY = process.env.DOCFORGE_API_KEY || 'df_live_cli_default_key_991823';

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const subcommand = args[1];

  return { args, command, subcommand };
}

function getOption(args, flag, shortFlag, defaultValue = null) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag || (shortFlag && args[i] === shortFlag)) {
      return args[i + 1] !== undefined ? args[i + 1] : defaultValue;
    }
  }
  return defaultValue;
}

async function main() {
  const { args, command, subcommand } = parseArgs();

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    process.exit(0);
  }

  const apiKey = getOption(args, '--key', '-k', DEFAULT_KEY);
  const baseUrl = getOption(args, '--url', '-u', DEFAULT_URL);

  const client = new DocForge({ apiKey, baseUrl });

  try {
    // -------------------------------------------------------------
    // COMMAND: health
    // -------------------------------------------------------------
    if (command === 'health') {
      const status = await client.health();
      console.log('=================================================');
      console.log('🟢 DocForge API Cluster Health');
      console.log('=================================================');
      console.log(`Status:         ${status.status.toUpperCase()}`);
      console.log(`Rendering Engine: ${status.rendering_engine}`);
      console.log(`Ledger Store:   ${status.ledger_store || 'SQLite Persistent Ledger'}`);
      console.log(`Total Documents:${status.total_ledger_documents || 0}`);
      console.log(`Uptime:         ${Math.round(status.uptime_seconds)}s`);
      console.log(`Timestamp:      ${status.timestamp}`);
      return;
    }

    // -------------------------------------------------------------
    // COMMAND: verify <hash>
    // -------------------------------------------------------------
    if (command === 'verify') {
      const hash = subcommand;
      if (!hash) {
        console.error('❌ Error: SHA-256 document hash is required. Usage: docforge verify <hash>');
        process.exit(1);
      }
      const result = await client.verify(hash);
      console.log('=================================================');
      console.log('🔍 Cryptographic Ledger Verification');
      console.log('=================================================');
      console.log(`Status:            ${result.is_valid ? '✅ AUTHENTIC & VALID' : '❌ INVALID'}`);
      console.log(`Document Hash:     ${result.document_hash || hash}`);
      if (result.is_valid) {
        console.log(`Issued At:         ${result.issued_at}`);
        console.log(`Account ID:        ${result.account_id}`);
        console.log(`Render Latency:    ${result.render_time_ms} ms`);
        console.log(`Tamper Check:      ${result.tamper_check}`);
        console.log(`Tamper Signature:  ${result.tamper_signature}`);
      } else {
        console.log(`Message:           ${result.message}`);
      }
      return;
    }

    // -------------------------------------------------------------
    // COMMAND: copilot <prompt>
    // -------------------------------------------------------------
    if (command === 'copilot') {
      const prompt = subcommand;
      const outFile = getOption(args, '--out', '-o', 'copilot_output.pdf');
      if (!prompt) {
        console.error('❌ Error: Natural language prompt is required. Usage: docforge copilot "<prompt>" [-o output.pdf]');
        process.exit(1);
      }

      console.log(`🤖 Synthesizing AI template from prompt: "${prompt}"...`);
      const res = await fetch(`${baseUrl}/v1/templates/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-DocForge-Key': apiKey },
        body: JSON.stringify({ prompt })
      });
      const copilotData = await res.json();

      if (copilotData.status !== 'success') {
        console.error(`❌ Copilot AI Error: ${copilotData.message}`);
        process.exit(1);
      }

      console.log(`✨ Template category "${copilotData.category.toUpperCase()}" synthesized successfully! Rendering PDF...`);
      const pdfBuffer = await client.render({
        html: copilotData.template.html,
        css: copilotData.template.css,
        data: copilotData.template.data,
        options: { compress: true }
      });

      fs.writeFileSync(outFile, pdfBuffer);
      console.log(`✅ AI PDF Rendered & Saved to: ${outFile}`);
      return;
    }

    // -------------------------------------------------------------
    // COMMAND: template
    // -------------------------------------------------------------
    if (command === 'template') {
      if (subcommand === 'list') {
        const list = await client.listTemplates();
        console.log('=================================================');
        console.log('📖 Registered Server-Side Templates');
        console.log('=================================================');
        if (!list.templates || list.templates.length === 0) {
          console.log('No templates currently registered.');
          return;
        }
        console.table(list.templates);
        return;
      }

      if (subcommand === 'push') {
        const templateId = args[2];
        const htmlFile = args[3];
        const name = getOption(args, '--name', '-n', templateId);
        const cssFile = getOption(args, '--css', '-c', null);

        if (!templateId || !htmlFile) {
          console.error('❌ Error: Usage: docforge template push <template_id> <html_file> [--name <name>] [--css <css_file>]');
          process.exit(1);
        }

        if (!fs.existsSync(htmlFile)) {
          console.error(`❌ Error: HTML template file "${htmlFile}" does not exist.`);
          process.exit(1);
        }

        const html = fs.readFileSync(htmlFile, 'utf8');
        let css = '';
        if (cssFile && fs.existsSync(cssFile)) {
          css = fs.readFileSync(cssFile, 'utf8');
        }

        console.log(`Pushing template "${templateId}" (${name})...`);
        const result = await client.createTemplate({
          template_id: templateId,
          name,
          html,
          css
        });

        console.log(`✅ Template "${templateId}" version ${result.template.version} pushed successfully!`);
        console.log(`   Created At: ${result.template.created_at}`);
        return;
      }

      console.error(`❌ Unknown template command "${subcommand}". Use "list" or "push".`);
      process.exit(1);
    }

    // -------------------------------------------------------------
    // COMMAND: render
    // -------------------------------------------------------------
    if (command === 'render') {
      const templateId = getOption(args, '--template-id', null);
      const version = getOption(args, '--version', null);
      let htmlFile = args[1] && !args[1].startsWith('-') ? args[1] : null;

      const dataFile = getOption(args, '--data', '-d', null);
      const outFile = getOption(args, '--out', '-o', 'output.pdf');
      const theme = getOption(args, '--theme', '-t', 'light');
      const watermark = getOption(args, '--watermark', '-w', 'none');
      const format = getOption(args, '--format', '-f', 'A4');

      let html = null;
      let css = '';

      if (htmlFile) {
        if (!fs.existsSync(htmlFile)) {
          console.error(`❌ Error: HTML file "${htmlFile}" does not exist.`);
          process.exit(1);
        }
        html = fs.readFileSync(htmlFile, 'utf8');
      }

      const cssFile = getOption(args, '--css', '-c', null);
      if (cssFile && fs.existsSync(cssFile)) {
        css = fs.readFileSync(cssFile, 'utf8');
      }

      let data = {};
      if (dataFile) {
        if (!fs.existsSync(dataFile)) {
          console.error(`❌ Error: JSON data file "${dataFile}" does not exist.`);
          process.exit(1);
        }
        try {
          data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        } catch (e) {
          console.error(`❌ Error: Failed to parse JSON in "${dataFile}": ${e.message}`);
          process.exit(1);
        }
      }

      if (!html && !templateId) {
        console.error('❌ Error: Please specify a local HTML file or --template-id <id>.');
        console.error('   Example: docforge render index.html --data data.json --out result.pdf');
        process.exit(1);
      }

      console.log(`Compiling PDF via DocForge API Engine (${baseUrl})...`);
      const pdfBuffer = await client.render({
        template_id: templateId,
        version: version ? parseInt(version, 10) : undefined,
        html,
        css,
        data,
        options: { theme, watermark, format },
        response_type: 'binary'
      });

      fs.writeFileSync(outFile, pdfBuffer);
      console.log(`✅ PDF Rendered & Saved to: ${outFile}`);
      console.log(`   Byte Length:      ${pdfBuffer.length} bytes`);
      console.log(`   SHA-256 Hash:     ${pdfBuffer.hash}`);
      console.log(`   Render Latency:   ${pdfBuffer.renderTimeMs} ms`);
      return;
    }

    console.error(`❌ Unknown command "${command}". Run "docforge --help" for available commands.`);
    process.exit(1);

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
=================================================
🚀 DocForge Command-Line Interface (docforge-cli)
=================================================

Usage: docforge <command> [options]

Commands:
  render [html_file]               Compile HTML/CSS template to PDF
  template push <id> <html_file>   Register/version server-side template
  template list                    List registered server-side templates
  verify <hash>                    Verify document cryptographic ledger stamp
  health                           Check API cluster health status

Options:
  -d, --data <file>        JSON data payload file
  -o, --out <file>         Output PDF file destination (default: output.pdf)
  -c, --css <file>         Custom CSS stylesheet file
  -t, --theme <theme>      Color theme (light, dark, emerald)
  -w, --watermark <text>   Watermark text (none, PAID, DRAFT, CONFIDENTIAL)
  -f, --format <format>    Page size format (A4, Letter, Legal)
  --template-id <id>       Server-side template ID to render
  --version <num>          Specific template version number
  -k, --key <api_key>      DocForge API Key (or env DOCFORGE_API_KEY)
  -u, --url <api_url>      DocForge API Base URL (or env DOCFORGE_API_URL)

Examples:
  docforge render invoice.html --data input.json --out invoice.pdf
  docforge render --template-id b2b_saas_invoice --data input.json --out invoice.pdf
  docforge template push invoice_v1 invoice.html --name "Monthly Invoice"
  docforge template list
  docforge verify 41e622e8dcf8b5721a45957f6bebe4120f5cdf576e54b975e4d0dfbe079e626c
`);
}

main();
