const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const BillingService = require('./billingService');
const LeadEngine = require('./leadEngine');

const PORT = process.env.PORT || 4050;
const billing = new BillingService();
const leadEngine = new LeadEngine();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) { // 2MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
          resolve(JSON.parse(body));
        } else {
          resolve(querystring.parse(body));
        }
      } catch (err) {
        reject(err);
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }

  try {
    // API Routes
    if (pathname === '/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'OK', service: 'MapLeads Engine', version: '1.0.0', port: PORT });
    }

    if (pathname === '/api/stats' && method === 'GET') {
      const stats = billing.getStats();
      return sendJson(res, 200, { success: true, stats });
    }

    if (pathname === '/api/keys/verify' && method === 'GET') {
      const key = req.headers['x-api-key'] || parsedUrl.query.key;
      if (!key) {
        return sendJson(res, 400, { success: false, error: 'Missing API key' });
      }
      const info = billing.getKey(key);
      if (!info) {
        return sendJson(res, 404, { success: false, error: 'API Key not found' });
      }
      return sendJson(res, 200, { success: true, keyInfo: info });
    }

    if (pathname === '/api/keys/generate' && method === 'POST') {
      const body = await parseBody(req);
      const owner = body.owner || 'SaaS Customer';
      const tier = body.tier || 'Starter Growth';
      const credits = parseInt(body.credits, 10) || 250;

      const newKeyInfo = billing.generateKey(owner, tier, credits);
      return sendJson(res, 201, { success: true, message: 'API Key created successfully', keyInfo: newKeyInfo });
    }

    if (pathname === '/api/leads/search' && method === 'POST') {
      const body = await parseBody(req);
      const query = body.query || body.keyword || 'Plumbers';
      const location = body.location || body.city || 'Austin, TX';
      const limit = Math.min(parseInt(body.limit, 10) || 10, 50);
      const apiKey = req.headers['x-api-key'] || body.apiKey || null;

      // Verify billing / credits
      const verification = billing.verifyAndDeductCredits(apiKey, limit);
      if (!verification.allowed) {
        return sendJson(res, 402, {
          success: false,
          error: verification.reason || 'Credit verification failed',
          remainingCredits: verification.remainingCredits || 0
        });
      }

      const leads = await leadEngine.searchLeads(query, location, { limit });

      return sendJson(res, 200, {
        success: true,
        query,
        location,
        totalExtracted: leads.length,
        billing: {
          tier: verification.tier,
          creditsDeducted: leads.length,
          remainingCredits: verification.remainingCredits
        },
        leads
      });
    }

    if (pathname === '/api/leads/export' && method === 'POST') {
      const body = await parseBody(req);
      const leads = body.leads || [];
      const format = (body.format || 'csv').toLowerCase();

      if (!Array.isArray(leads) || leads.length === 0) {
        return sendJson(res, 400, { success: false, error: 'No leads provided for export' });
      }

      if (format === 'json') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="map_leads_export.json"'
        });
        return res.end(JSON.stringify(leads, null, 2));
      } else {
        // CSV Export
        const headers = ['Business Name', 'Category', 'Address', 'Phone', 'Website', 'Emails', 'Email Status', 'Rating', 'Review Count', 'LinkedIn', 'Facebook', 'Instagram', 'Twitter'];
        const csvRows = [headers.join(',')];

        for (const lead of leads) {
          const row = [
            `"${(lead.name || '').replace(/"/g, '""')}"`,
            `"${(lead.category || '').replace(/"/g, '""')}"`,
            `"${(lead.location || '').replace(/"/g, '""')}"`,
            `"${(lead.phone || '').replace(/"/g, '""')}"`,
            `"${(lead.website || '').replace(/"/g, '""')}"`,
            `"${(Array.isArray(lead.emails) ? lead.emails.join('; ') : '').replace(/"/g, '""')}"`,
            `"${(lead.emailStatus || '').replace(/"/g, '""')}"`,
            lead.rating || 0,
            lead.userRatingsTotal || 0,
            `"${(lead.social && lead.social.linkedin || '').replace(/"/g, '""')}"`,
            `"${(lead.social && lead.social.facebook || '').replace(/"/g, '""')}"`,
            `"${(lead.social && lead.social.instagram || '').replace(/"/g, '""')}"`,
            `"${(lead.social && lead.social.twitter || '').replace(/"/g, '""')}"`
          ];
          csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\n');
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="map_leads_export.csv"',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(csvContent);
      }
    }

    // Static Files (Frontend App)
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(__dirname, 'public', 'index.html');
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'text/plain';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);

  } catch (err) {
    console.error('[Server Error]', err);
    sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`[MapLeads SaaS] Server running at http://localhost:${PORT}`);
});

module.exports = server;
