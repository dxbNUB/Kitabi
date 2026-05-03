import http from 'http';
import chatHandler from './api/chat.js';
import generateHandler from './api/generate.js';
import waitlistHandler from './api/waitlist.js';
import analyzeHandler from './api/analyze.js';
import usageHandler from './api/usage.js';
import rewriteHandler from './api/rewrite.js';

const routes = {
  '/api/chat':     chatHandler,
  '/api/generate': generateHandler,
  '/api/waitlist': waitlistHandler,
  '/api/analyze':  analyzeHandler,
  '/api/usage':    usageHandler,
  '/api/rewrite':  rewriteHandler,
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function makeRes(res) {
  const headers = {};
  return {
    statusCode: 200,
    setHeader(k, v) { headers[k] = v; res.setHeader(k, v); },
    status(code) { this.statusCode = code; return this; },
    json(obj) {
      if (!res.headersSent) {
        res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...headers });
      }
      res.end(JSON.stringify(obj));
    },
    write(chunk) { res.write(chunk); },
    end() { res.end(); },
    get headersSent() { return res.headersSent; },
    socket: res.socket,
  };
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const handler = routes[req.url?.split('?')[0]];
  if (!handler) { res.writeHead(404); res.end('Not found'); return; }

  try {
    // GET / HEAD never carry a JSON body — skip parse
    req.body = (req.method === 'GET' || req.method === 'HEAD') ? {} : await parseBody(req);
    await handler(req, makeRes(res));
  } catch (err) {
    // Log only the message — never the full err object, which can include
    // request bodies or SDK internals that occasionally carry sensitive data.
    console.error('[server]', err?.message || 'Unknown error');
    if (!res.headersSent) { res.writeHead(500); res.end('Server error'); }
  }
});

server.listen(3000, () => console.log('API server running on http://localhost:3000'));
