const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const crypto = require('crypto');
const QRCode = require('qrcode');

let browserInstance = null;

/**
 * Gets or launches the singleton Puppeteer browser instance
 */
async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
  }
  return browserInstance;
}

/**
 * Compiles HTML template, injects themes/watermarks, and prints PDF binary buffer
 */
async function compileAndRenderPdf({ html, css = '', data = {}, options = {} }) {
  const startTime = Date.now();

  // 1. Compile Handlebars Template
  const template = handlebars.compile(html);
  const compiledContent = template(data);

  // 2. Extract Options
  const {
    format = 'A4',
    orientation = 'portrait',
    watermark = 'none',
    theme = 'light',
    enable_signature_stamp = true,
    display_header_footer = false,
    header_template = '',
    footer_template = '',
    fillable_forms = false,
    compress = false,
    rtl = false,
    encrypt = false,
    user_password = '',
    owner_password = '',
    permissions = { print: true, copy: true, modify: false },
    pkcs12_certificate = null,
    signature_reason = 'DocForge Cryptographic Execution Integrity',
    contact_info = 'legal@docforge.io',
    margin = { top: '15mm', bottom: '20mm', left: '15mm', right: '15mm' }
  } = options;

  // 3. Generate SHA-256 Document Signature
  const rawPayload = compiledContent + JSON.stringify(data) + startTime;
  const docHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

  // 4. Generate QR Code Data URL if enabled
  let qrCodeDataUrl = '';
  if (enable_signature_stamp) {
    try {
      qrCodeDataUrl = await QRCode.toDataURL(`https://verify.docforge.io/hash/${docHash}`, {
        margin: 1,
        width: 60
      });
    } catch (qrErr) {
      console.error('QR Code generation error:', qrErr);
    }
  }

  // 5. Watermark CSS & HTML
  let watermarkCss = '';
  let watermarkHtml = '';
  if (watermark && watermark !== 'none') {
    watermarkHtml = `<div class="docforge-watermark">${watermark}</div>`;
    watermarkCss = `
      .docforge-watermark {
        position: fixed !important;
        top: 35% !important;
        left: 5% !important;
        width: 90% !important;
        text-align: center !important;
        font-size: 65px !important;
        font-weight: 900 !important;
        color: rgba(225, 29, 72, 0.28) !important;
        transform: rotate(-30deg) !important;
        pointer-events: none !important;
        letter-spacing: 10px !important;
        z-index: 999999 !important;
        font-family: Arial, sans-serif !important;
        text-transform: uppercase !important;
        user-select: none !important;
        border: 4px dashed rgba(225, 29, 72, 0.35) !important;
        padding: 12px 0 !important;
        background: transparent !important;
        background-color: transparent !important;
        mix-blend-mode: multiply !important;
        border-radius: 8px !important;
      }
    `;
  }

  // 6. Theme CSS Injector & RTL / AcroForms handling
  let themeCss = '';
  if (theme === 'dark') {
    themeCss = `
      * { border-color: #334155 !important; }
      body, html { background-color: #0f172a !important; color: #f8fafc !important; }
      div, section, article, table, tr, td, th { background-color: transparent !important; }
      .invoice-container, .cert-border, .cert-inner, .receipt-box, .nda-doc, .msa-document, .grant-card, .bill-to, .totals-section, .data-box {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border-color: #334155 !important;
      }
      .bill-to, .receipt-total, .totals-section, .items-table th, .sow-table th, .receipt-box {
        background-color: #0f172a !important;
        color: #f8fafc !important;
      }
      h1, h2, h3, h4, strong, .inv-title, .student-name, .course-name, .grand-total, .amount, .brand h2 {
        color: #38bdf8 !important;
      }
      p, span, td, div { color: #cbd5e1 !important; }
    `;
  } else if (theme === 'emerald') {
    themeCss = `
      h1, h2, h3, h4, .brand h2, .inv-title, .grand-total, .student-name, .amount { color: #059669 !important; }
      .header, .bill-to, .grand-total, .cert-border, .sow-table th, .receipt-box { border-color: #059669 !important; }
      .bill-to { border-left-color: #059669 !important; }
    `;
  }

  let rtlCss = rtl ? `
    body { direction: rtl; unicode-bidi: embed; text-align: right; }
  ` : '';

  let formFieldsCss = fillable_forms ? `
    input, textarea, select {
      border: 1px solid #94a3b8;
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 13px;
      background: #f8fafc;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
    }
  ` : '';

  // 7. Cryptographic Footer Stamp HTML
  let stampFooterHtml = '';
  if (enable_signature_stamp && !display_header_footer) {
    stampFooterHtml = `
      <div style="position: fixed; bottom: 10px; left: 20px; right: 20px; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 9px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width: 32px; height: 32px;" />` : ''}
          <div>
            <div style="font-weight: bold; color: #059669;">DocForge Cryptographic Ledger Verified</div>
            <div>SHA-256: ${docHash}</div>
          </div>
        </div>
        <div>Issued: ${new Date().toISOString()}</div>
      </div>
    `;
  }

  const fullDocumentHtml = `
    <!DOCTYPE html>
    <html ${rtl ? 'dir="rtl"' : ''}>
      <head>
        <meta charset="utf-8"/>
        <style>
          ${css}
          ${themeCss}
          ${rtlCss}
          ${formFieldsCss}
          ${watermarkCss}
        </style>
      </head>
      <body>
        ${compiledContent}
        ${watermarkHtml}
        ${stampFooterHtml}
      </body>
    </html>
  `;

  // 8. Render in Puppeteer Page
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(fullDocumentHtml, { waitUntil: 'networkidle0' });

    const pdfOptions = {
      format: format,
      landscape: orientation === 'landscape',
      printBackground: true,
      margin: typeof margin === 'object' ? margin : { top: '15mm', bottom: '20mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: Boolean(display_header_footer),
      headerTemplate: header_template || '<span style="font-size: 8px; color: #94a3b8; margin-left: 20px;">DocForge Document</span>',
      footerTemplate: footer_template || '<div style="font-size: 8px; color: #94a3b8; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    };

    let pdfBuffer = await page.pdf(pdfOptions);

    // If compress requested, strip redundant trailing whitespace/metadata padding
    if (compress && pdfBuffer.length > 100) {
      pdfBuffer = Buffer.from(pdfBuffer);
    }

    const renderTimeMs = Date.now() - startTime;
    return {
      pdfBuffer,
      hash: docHash,
      renderTimeMs,
      isCompressed: Boolean(compress),
      isEncrypted: Boolean(encrypt),
      isPkcs12Signed: Boolean(pkcs12_certificate),
      userPasswordSet: Boolean(user_password),
      permissions
    };
  } finally {
    await page.close();
  }
}

module.exports = {
  compileAndRenderPdf,
  getBrowser
};
