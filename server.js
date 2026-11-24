// Run: node server.js   (no npm install needed)
// Admin password is below; set ADMIN_KEY in the environment only if you want a different one.
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000, KEY = process.env.ADMIN_KEY || 'Dhanu@5130';
const DB = path.join(__dirname, 'data', 'timeline.json');
const SEED = [
    ['old3', '', 'Gym meeting'],
    ['old4', '', 'Our first bike ride'],
    ['old5', '', 'Our first movie date'],
    ['seed0', '', 'The first time I came to Santhosh’s house ❤️'],
    ['old1', '2025-11-11', 'Our first phone call'],
    ['old2', '2025-11-17', 'Our first meeting at the temple'],
    ['old6', '2026-03-14', 'Ooty trip'],
    ['old7', '2026-07-03', 'Chennai trip'],
    ['old8', '2026-08-10', 'Our first kiss on the long bike ride'],
    ['old9', '2026-08-14', 'Car kiss'],
    ['seed1', '2026-08-30', 'The first time Prasithya bought a wish for me ❤️'],
    ['seed2', '2026-09-12', 'Our first honeymoon in Vallapi ❤️'],
    ['seed3', '2026-09-28', 'Our first night of separation after marriage — I was in Tiruppur, missing you'],
    ['seed4', '2026-10-16', 'Took Ammachi to the hospital, spent the night apart, and sent each other “Miss you” messages ❤️'],
    ['seed5', '2026-10-26', 'The day Santhosh stood up for me during a fight with my mother']
  ].map(([id, date, text]) => ({ id, date, text }));

const write = d => {   /* safe write: keep a .bak copy, write to a temp file, then swap */
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  if (fs.existsSync(DB)) fs.copyFileSync(DB, DB + '.bak');
  fs.writeFileSync(DB + '.tmp', JSON.stringify(d, null, 2)); fs.renameSync(DB + '.tmp', DB);
};
const read = () => {   /* seed ONLY when the file does not exist; never overwrite real data */
  if (!fs.existsSync(DB)) { write(SEED); return SEED.slice(); }
  for (const f of [DB, DB + '.bak']) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch {} }
  throw new Error('timeline.json is unreadable and no backup could be used: ' + DB);
};
/* One-time import: adds the older timeline moments to an existing data file (never again, so deletes stay deleted) */
(function migrate() {
  const flag = path.join(path.dirname(DB), '.old-imported');
  if (fs.existsSync(flag) || !fs.existsSync(DB)) { if (!fs.existsSync(DB)) { read(); fs.writeFileSync(flag, '1'); } return; }
  let all; try { all = read(); } catch { return; }
  const have = new Set(all.map(i => i.id)), texts = new Set(all.map(i => i.text));
  const add = SEED.filter(i => i.id.startsWith('old') && !have.has(i.id) && !texts.has(i.text));
  if (add.length) write(add.concat(all));
  fs.writeFileSync(flag, '1');
})();
const sorted = a => a.sort((x, y) => (x.date || '').localeCompare(y.date || '')); // undated first

const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const authed = req => !KEY || req.headers['x-admin-key'] === KEY;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  /* CORS: lets the pages work when opened from file:// or another port (e.g. Live Server) */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-key');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (url.pathname.toLowerCase() === '/api/timeline') {
    try { read(); } catch (e) { console.error(e.message); return send(res, 500, { error: 'Data file problem — see server log' }); }
    if (req.method === 'GET' && url.searchParams.get('check')) return authed(req) ? send(res, 200, { ok: true }) : send(res, 401, { error: 'Wrong admin key' });
    if (req.method === 'GET') return send(res, 200, { items: sorted(read()) });
    if (!authed(req)) return send(res, 401, { error: 'Wrong admin key' });
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 1e5) req.destroy(); });
      req.on('end', () => {
        let j; try { j = JSON.parse(body); } catch { return send(res, 400, { error: 'Bad JSON' }); }
        const text = String(j.text || '').trim().slice(0, 500), date = String(j.date || '').trim();
        if (!text) return send(res, 400, { error: 'Text is required' });
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: 'Date must be YYYY-MM-DD' });
        const item = { id: Date.now().toString(36), date, text };
        const all = read(); all.push(item); write(all);
        send(res, 201, item);
      });
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 1e5) req.destroy(); });
      req.on('end', () => {
        let j; try { j = JSON.parse(body); } catch { return send(res, 400, { error: 'Bad JSON' }); }
        const text = String(j.text || '').trim().slice(0, 500), date = String(j.date || '').trim();
        if (!text) return send(res, 400, { error: 'Text is required' });
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: 'Date must be YYYY-MM-DD' });
        const all = read(), it = all.find(i => i.id === url.searchParams.get('id'));
        if (!it) return send(res, 404, { error: 'Not found' });
        it.date = date; it.text = text; write(all);
        send(res, 200, it);
      });
      return;
    }
    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id'), all = read(), left = all.filter(i => i.id !== id);
      if (left.length === all.length) return send(res, 404, { error: 'Not found' });
      write(left); return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: 'Method not allowed' });
  }
  // static files (the HTML pages + image folder)
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
  const file = path.join(__dirname, p);
  if (!file.startsWith(__dirname) || /[\\/](data|server\.js)/.test(p)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, () => console.log('http://localhost:' + PORT));
