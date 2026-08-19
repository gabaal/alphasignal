const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createStaticServer(rootDir, port, name) {
  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';
    
    let filePath = path.join(rootDir, reqUrl);
    
    if (!filePath.startsWith(rootDir)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        filePath = path.join(rootDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.statusCode = 500;
          return res.end('Server Error');
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
      });
    });
  });

  server.listen(port, () => {
    console.log(`🚀 ${name} live at http://localhost:${port}`);
  });
}

const rootDir = path.resolve(__dirname, '..');
createStaticServer(path.join(rootDir, 'docforge-studio'), 4001, 'DocForge Studio');
createStaticServer(path.join(rootDir, 'docforge-landing'), 4002, 'DocForge Landing Portal');
