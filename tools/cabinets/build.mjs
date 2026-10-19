#!/usr/bin/env node
// Rebuild the studio cabinet art: arcade/cab/studio-<id>_{marquee,side,panel}.jpg
//   node tools/cabinets/build.mjs [id ...]        (no ids = all 11)
// Source art: art-in/<id>/{marquee,side,panel}.{png,jpg,jpeg,webp} replaces that piece outright (cover-fit to the exact size);
// art-in/<id>/{hero,source}.{png,jpg,jpeg,webp} replaces the game's backdrop image in the built pieces;
// otherwise the game's own art (see compose.html). Needs playwright-core (npm i playwright-core in a scratch folder,
// set CAB_TOOLS to it) and Google Chrome; fonts load from Google Fonts like the site does.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(process.env.CAB_TOOLS || path.join(process.env.HOME, 'work/cab-tools'), 'x.js'));
const { chromium } = require('playwright-core');
const ALL = ['the-path', 'the-first-world', 'the-house', 'beyond-the-nexus', 'seven-hearth', 'seven-beacon', 'seven-labyrinth', 'seven-resonance', 'seven-ascent', 'seven-tunnel', 'seven-constellation'];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const MIME = { '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
const port = srv.address().port;
const find = (id, name) => { for (const e of ['png', 'jpg', 'jpeg', 'webp']) { const p = `art-in/${id}/${name}.${e}`; if (fs.existsSync(path.join(root, p))) return p; } return null; };
const b = await chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await b.newPage();
page.on('pageerror', (e) => console.error('page error', e.message));
await page.goto(`http://127.0.0.1:${port}/tools/cabinets/compose.html`);
await page.waitForFunction('window.ready === true');
for (const id of ids) for (const kind of ['marquee', 'side', 'panel']) {
  const over = {}; for (const k of ['marquee', 'side', 'panel']) { const p = find(id, k); if (p && k === kind) over[k] = p; }
  const src = find(id, 'hero') || find(id, 'source'); if (src) over.src = src;
  const url = await page.evaluate(([i, k, o]) => window.compose(i, k, o), [id.replace(/^/, ''), kind, over]);
  const out = path.join(root, `arcade/cab/studio-${id}_${kind}.jpg`);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); console.log(path.relative(root, out), over[kind] ? '(from ' + over[kind] + ')' : '');
}
await b.close(); srv.close();
