/**
 * ft-proxy.js — LifeOS CORS Proxy
 * Handles: France Travail OAuth token, job offers search, Arbeitnow fallback
 *
 * Usage (local):          node ft-proxy.js
 * Usage (GitHub Codespace): node ft-proxy.js  — then set port 3001 to Public in the Ports tab
 *
 * No npm install needed — uses only Node.js built-ins (http, https, url)
 */

const http  = require('http');
const https = require('https');
const { URL, URLSearchParams } = require('url');

const PORT = process.env.PORT || 3001;

// ─── CORS headers added to every response ───────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─── Small helper: make an HTTPS request, return { status, body } ────────────
function httpsRequest(options, postBody) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (postBody) req.write(postBody);
    req.end();
  });
}

// ─── Route handlers ──────────────────────────────────────────────────────────

/**
 * POST /token
 * Body (urlencoded): grant_type, client_id, client_secret, scope
 * Forwards to France Travail OAuth endpoint and returns the token JSON.
 */
async function handleToken(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;

  const params = new URLSearchParams(body);
  const postData = new URLSearchParams({
    grant_type:    params.get('grant_type')    || 'client_credentials',
    client_id:     params.get('client_id')     || '',
    client_secret: params.get('client_secret') || '',
    scope:         params.get('scope')         || 'api_offresdemploiv2 o2dsoffre',
  }).toString();

  try {
    const { status, body: respBody } = await httpsRequest({
      hostname: 'entreprise.francetravail.fr',
      path:     '/connexion/oauth2/access_token?realm=%2Fpartenaire',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, postData);

    res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
    res.end(respBody);
  } catch (err) {
    console.error('[/token] error:', err.message);
    res.writeHead(502, CORS);
    res.end(JSON.stringify({ error: 'proxy_error', message: err.message }));
  }
}

/**
 * GET /offres?motsCles=...&lieuTravail=...&distance=...&range=0-19&sort=1
 * Requires Authorization: Bearer <token> header forwarded from the browser.
 * Proxies to France Travail Offres d'emploi v2 API.
 */
async function handleOffres(req, res) {
  const parsed   = new URL(req.url, `http://localhost:${PORT}`);
  const qs       = parsed.search; // e.g. "?motsCles=dev&range=0-19"
  const authHeader = req.headers['authorization'] || '';

  try {
    const { status, body: respBody } = await httpsRequest({
      hostname: 'api.francetravail.io',
      path:     `/partenaire/offresdemploi/v2/offres/search${qs}`,
      method:   'GET',
      headers: {
        'Authorization': authHeader,
        'Accept':        'application/json',
      },
    });

    res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
    res.end(respBody);
  } catch (err) {
    console.error('[/offres] error:', err.message);
    res.writeHead(502, CORS);
    res.end(JSON.stringify({ error: 'proxy_error', message: err.message }));
  }
}

/**
 * GET /arbeitnow?search=<keywords>
 * Proxies to Arbeitnow public API (no auth needed).
 */
async function handleArbeitnow(req, res) {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const search = parsed.searchParams.get('search') || '';
  const qs     = search ? `?search=${encodeURIComponent(search)}` : '';

  try {
    const { status, body: respBody } = await httpsRequest({
      hostname: 'www.arbeitnow.com',
      path:     `/api/job-board-api${qs}`,
      method:   'GET',
      headers:  { 'Accept': 'application/json' },
    });

    res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
    res.end(respBody);
  } catch (err) {
    console.error('[/arbeitnow] error:', err.message);
    res.writeHead(502, CORS);
    res.end(JSON.stringify({ error: 'proxy_error', message: err.message }));
  }
}

// ─── HTTP server ─────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, `http://localhost:${PORT}`).pathname;

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  // Health check
  if (path === '/' || path === '/health') {
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', proxy: 'LifeOS ft-proxy', port: PORT }));
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);

  try {
    if (path === '/token'     && req.method === 'POST') return await handleToken(req, res);
    if (path === '/offres'    && req.method === 'GET')  return await handleOffres(req, res);
    if (path === '/arbeitnow' && req.method === 'GET')  return await handleArbeitnow(req, res);

    // Unknown route
    res.writeHead(404, CORS);
    res.end(JSON.stringify({ error: 'not_found', path }));
  } catch (err) {
    console.error('Unhandled error:', err);
    res.writeHead(500, CORS);
    res.end(JSON.stringify({ error: 'internal', message: err.message }));
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ✅  LifeOS ft-proxy running');
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log('');
  console.log('  Routes:');
  console.log('    POST /token      → France Travail OAuth');
  console.log('    GET  /offres     → France Travail job search');
  console.log('    GET  /arbeitnow  → Arbeitnow remote jobs');
  console.log('    GET  /health     → status check');
  console.log('');
  console.log('  GitHub Codespaces:');
  console.log('    → Go to the Ports tab → port 3001 → set Visibility to Public');
  console.log('    → Copy the Forwarded Address URL into LifeOS → Career → ⚙️ Setup → URL Proxy');
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ❌  Port ${PORT} is already in use.`);
    console.error(`     Kill the existing process: lsof -ti:${PORT} | xargs kill`);
    console.error(`     Or use a different port:   PORT=3002 node ft-proxy.js\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
