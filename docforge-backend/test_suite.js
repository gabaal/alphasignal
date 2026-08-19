const http = require('http');
const fs = require('fs');
const path = require('path');

// 10 PRESET TEST SUITE DEFINITIONS
const TEST_PRESETS = [
  {
    id: 'saas_invoice',
    name: 'SaaS B2B Tax Invoice',
    html: '<h1>INVOICE #{{invoice.number}}</h1><p>Client: {{client.name}}</p><p>Total: ${{totals.grand_total}}</p>',
    data: { invoice: { number: 'INV-TEST-01' }, client: { name: 'Acme Corp' }, totals: { grand_total: '3133.48' } },
    options: { theme: 'light', watermark: 'PAID' }
  },
  {
    id: 'certificate',
    name: 'Course Completion Certificate',
    html: '<h1>CERTIFICATE OF ACHIEVEMENT</h1><h2>{{student.name}}</h2><p>{{course.title}}</p>',
    data: { student: { name: 'Sarah Jenkins' }, course: { title: 'Quantitative Algorithmic Trading' } },
    options: { theme: 'emerald', watermark: 'none' }
  },
  {
    id: 'freelance_receipt',
    name: 'Freelance Service Receipt',
    html: '<h3>RECEIPT #{{receipt_no}}</h3><p>Amount: ${{amount}}</p>',
    data: { receipt_no: 'REC-99120', amount: '4500.00' },
    options: { theme: 'light', watermark: 'PAID' }
  },
  {
    id: 'nda_agreement',
    name: 'Non-Disclosure Agreement (NDA)',
    html: '<h2>MUTUAL NON-DISCLOSURE AGREEMENT</h2><p>Party A: {{party_a.name}}</p><p>Party B: {{party_b.name}}</p>',
    data: { party_a: { name: 'DocForge Tech' }, party_b: { name: 'Horizon VC' } },
    options: { theme: 'dark', watermark: 'CONFIDENTIAL' }
  },
  {
    id: 'msa_statement',
    name: 'Master Services Agreement (Multi-Page)',
    html: '<h2>MASTER SERVICES AGREEMENT</h2><div class="page-break"></div><h2>STATEMENT OF WORK</h2>',
    data: { contract_id: 'MSA-2026-9901' },
    options: { theme: 'light', watermark: 'DRAFT' }
  },
  {
    id: 'token_grant',
    name: 'Web3 Token Vesting Grant',
    html: '<h2>OFFICIAL TOKEN VESTING GRANT</h2><p>Wallet: {{grant.wallet_address}}</p>',
    data: { grant: { wallet_address: '7xKXtg2CW87d97TXJSDp51jK5ZfY32zQ551kP99Xpump' } },
    options: { theme: 'dark', watermark: 'none' }
  },
  {
    id: 'healthcare_report',
    name: 'Medical Diagnostic & Lab Report',
    html: '<h2>LABORATORY TEST RESULTS</h2><p>Patient: {{patient.name}}</p>',
    data: { patient: { name: 'David K. Miller' } },
    options: { theme: 'light', watermark: 'CONFIDENTIAL' }
  },
  {
    id: 'realestate_deed',
    name: 'Real Estate Closing Statement',
    html: '<h2>REAL ESTATE CLOSING STATEMENT</h2><p>Address: {{property.address}}</p>',
    data: { property: { address: '450 Montgomery St, San Francisco, CA' } },
    options: { theme: 'light', watermark: 'SAMPLE' }
  },
  {
    id: 'payslip_statement',
    name: 'Employee Payroll Advice & Payslip',
    html: '<h2>EMPLOYEE PAYSLIP</h2><p>Name: {{employee.name}}</p><p>Net Pay: ${{pay.net_amount}}</p>',
    data: { employee: { name: 'Marcus Vance' }, pay: { net_amount: '5,840.50' } },
    options: { theme: 'emerald', watermark: 'none' }
  },
  {
    id: 'event_ticket',
    name: 'VIP Tech Summit Pass & Badge',
    html: '<h2>VIP ALL-ACCESS PASS</h2><p>Attendee: {{attendee.name}}</p>',
    data: { attendee: { name: 'Alexander Mercer' } },
    options: { theme: 'dark', watermark: 'none' }
  }
];

function makeRenderRequest(preset) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      html: preset.html,
      data: preset.data,
      options: preset.options,
      response_type: 'binary'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/v1/render',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DocForge-Key': 'df_live_test_suite_key_991823'
      }
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const totalTimeMs = Date.now() - startTime;
        const buffer = Buffer.concat(chunks);
        const hash = res.headers['x-docforge-document-hash'] || '';
        const serverLatency = parseInt(res.headers['x-docforge-render-time-ms'] || '0', 10);

        resolve({
          presetId: preset.id,
          name: preset.name,
          statusCode: res.statusCode,
          byteLength: buffer.length,
          hash: hash,
          serverLatencyMs: serverLatency,
          totalRoundTripMs: totalTimeMs,
          passed: res.statusCode === 200 && buffer.length > 5000 && hash.length === 64
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

function verifyLedgerRequest(hash) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/v1/verify/${hash}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ is_valid: false });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 DocForge API — Automated Test Suite & Latency Benchmark');
  console.log('================================================================\n');

  const results = [];
  let totalServerLatency = 0;
  let passedCount = 0;

  for (let i = 0; i < TEST_PRESETS.length; i++) {
    const preset = TEST_PRESETS[i];
    process.stdout.write(`[${i + 1}/10] Compiling "${preset.name}"... `);

    try {
      const res = await makeRenderRequest(preset);
      results.push(res);
      totalServerLatency += res.serverLatencyMs;

      if (res.passed) {
        passedCount++;
        console.log(`[PASS] (${res.serverLatencyMs}ms | ${res.byteLength} bytes)`);
      } else {
        console.log(`[FAIL] (Status ${res.statusCode})`);
      }
    } catch (err) {
      console.log(`[ERROR] (${err.message})`);
    }
  }

  const avgLatency = Math.round(totalServerLatency / TEST_PRESETS.length);

  console.log('\n================================================================');
  console.log('📊 BENCHMARK & TEST RESULTS SUMMARY');
  console.log('================================================================');
  console.log(`Test Pass Rate:      ${passedCount} / ${TEST_PRESETS.length} Passed (${(passedCount / TEST_PRESETS.length) * 100}%)`);
  console.log(`Average Cluster SLA: ${avgLatency} ms / document`);
  console.log('================================================================\n');

  // Verify first generated hash against ledger
  if (results.length > 0 && results[0].hash) {
    const sampleHash = results[0].hash;
    process.stdout.write(`Testing Ledger Verification for Hash: ${sampleHash.substring(0, 16)}... `);
    const verif = await verifyLedgerRequest(sampleHash);
    if (verif.is_valid) {
      console.log('[VERIFIED OK]');
    } else {
      console.log('[VERIFICATION FAILED]');
    }
  }

  console.log('\n🎉 Test Suite Execution Complete!');
}

runTestSuite();
