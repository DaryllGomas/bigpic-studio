#!/usr/bin/env node
// Builds the home page's "What's new" modal and its Lab log strip from the newest entries across every game's own
// devlog.json, so nothing is hand-copied. Writes news.json (the data) and rewrites the two marked regions in
// index.html (so the lists work with JavaScript off). Plain node, no npm.
//   node tools/hub/build-news.mjs           rebuild
//   node tools/hub/build-news.mjs --check   exit 1 if news.json / index.html are out of date (writes nothing)
// Sources (repo-relative): the-first-world/, rpg/, arcade/ devlogs, and THE PATH's devlog. THE PATH's lives in its own
// site repo (~/Projects/sites/thepath-site/devlog.json); a copy is kept at tools/hub/sources/the-path.devlog.json
// and refreshed from it automatically when that repo is next to this one. Studio-level items: tools/hub/news-extra.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECK = process.argv.includes('--check');
const MODAL_N = 8, MODAL_PER_GAME = 3, LOG_N = 12, LOG_PER_GAME = 4;

const GAMES = [   // order = tie-break for entries on the same day
  { slug: 'beyond-the-nexus', name: 'Beyond the Nexus', file: 'rpg/devlog.json', href: 'rpg/' },
  { slug: 'the-first-world', name: 'The First World', file: 'the-first-world/devlog.json', href: 'the-first-world/' },
  { slug: 'the-junction', name: 'The Junction', file: 'arcade/devlog.json', href: 'arcade/' },
  { slug: 'the-path', name: 'The Path', file: 'tools/hub/sources/the-path.devlog.json', href: 'https://thepath.bigpicsolutions.com/',
    live: resolve(ROOT, '..', 'thepath-site', 'devlog.json') },
];

// keep THE PATH's copy fresh when its repo is beside this one (read only on that side)
const pathGame = GAMES[3];
if (!CHECK && existsSync(pathGame.live)) {
  mkdirSync(dirname(join(ROOT, pathGame.file)), { recursive: true });
  const fresh = readFileSync(pathGame.live, 'utf8');
  const have = existsSync(join(ROOT, pathGame.file)) ? readFileSync(join(ROOT, pathGame.file), 'utf8') : '';
  if (fresh !== have) writeFileSync(join(ROOT, pathGame.file), fresh);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (s, n) => { s = s.replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const cut = s.slice(0, n); const dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! ')); return dot > n * 0.5 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…'; };
const fmt = (d) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(d));

const entries = [];
GAMES.forEach((g, gi) => {
  const d = JSON.parse(readFileSync(join(ROOT, g.file), 'utf8'));
  d.releases.forEach((r, ri) => {
    const first = (r.items || []).map((it) => typeof it === 'string' ? it : (it.t || it.h || '')).find(Boolean) || '';
    entries.push({ game: g.slug, gameName: g.name, version: r.version, date: r.date, title: r.title, href: g.href,
      text: clamp(r.summary || first || r.title, 200), label: `${g.name} ${r.version}: ${r.title}`, short: `${g.name} ${r.version}`, _o: gi * 1000 + ri });
  });
});
const extras = JSON.parse(readFileSync(join(ROOT, 'tools/hub/news-extra.json'), 'utf8')).items
  .map((x, i) => ({ game: 'studio', gameName: 'BigPic Studios', version: '', date: x.date, title: x.title, href: x.href || '', trailer: !!x.trailer, text: '', label: x.title, short: x.title, _o: 9000 + i }));
const byDate = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a._o - b._o);
const pick = (list, n, per) => { const seen = {}; return list.filter((e) => (seen[e.game] = (seen[e.game] || 0) + 1) <= per).slice(0, n); };
const all = [...entries].sort(byDate);
const modal = pick(all, MODAL_N, MODAL_PER_GAME);
const log = pick([...entries, ...extras].sort(byDate), LOG_N, LOG_PER_GAME);
const newest = all[0].date;

const clean = (e) => { const { _o, ...r } = e; return r; };
const news = { newest, modal: modal.map(clean), log: log.map(clean) };

const modalHtml = '\n' + modal.map((e) => `      <li><time datetime="${e.date}">${fmt(e.date)}</time><b><a href="${esc(e.href)}">${esc(e.label)}</a></b><p>${esc(e.text)}</p></li>`).join('\n') + '\n    ';
const logHtml = log.map((e) => {
  const when = `<time datetime="${e.date}">${fmt(e.date)}</time>`;
  if (e.trailer) return `<li class="reveal" data-trailer role="button" tabindex="0" aria-label="Watch THE NEXUS trailer">${when}<span>${esc(e.label)}</span></li>`;
  const inner = e.href ? `<a href="${esc(e.href)}">${esc(e.label)}</a>` : esc(e.label);
  return `<li class="reveal">${when}<span>${inner}</span></li>`;
}).join('');

const region = (html, name, body) => {
  const a = `<!-- news:${name}:start -->`, b = `<!-- news:${name}:end -->`;
  const i = html.indexOf(a), j = html.indexOf(b);
  if (i < 0 || j < 0) throw new Error(`index.html is missing the ${a} ... ${b} markers`);
  return html.slice(0, i + a.length) + body + html.slice(j);
};
const idx = join(ROOT, 'index.html'), jsonPath = join(ROOT, 'news.json');
let html = readFileSync(idx, 'utf8');
html = region(html, 'modal', modalHtml);
html = region(html, 'log', logHtml);
const json = JSON.stringify(news, null, 2) + '\n';

if (CHECK) {
  const stale = readFileSync(idx, 'utf8') !== html || !existsSync(jsonPath) || readFileSync(jsonPath, 'utf8') !== json;
  console.log(stale ? 'news is OUT OF DATE: run node tools/hub/build-news.mjs' : `news is current (newest ${newest})`);
  process.exit(stale ? 1 : 0);
}
writeFileSync(idx, html); writeFileSync(jsonPath, json);
console.log(`news rebuilt: newest ${newest}; What's new = ${modal.length} items, Lab log = ${log.length} items`);
for (const e of modal) console.log(`  ${e.date}  ${e.label}`);
