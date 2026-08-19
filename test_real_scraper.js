const https = require('https');
const querystring = require('querystring');

const postData = querystring.stringify({ q: 'plumbers in ipswich uk', b: '' });
const req = https.request('https://html.duckduckgo.com/html/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('HTML Length:', body.length);
    const links = body.match(/href="([^"]+)"/g) || [];
    console.log('Total hrefs:', links.length);
    const externalLinks = links.filter(l => l.includes('http') || l.includes('uddg'));
    console.log('Sample external links:', externalLinks.slice(0, 10));
  });
});
req.write(postData);
req.end();
