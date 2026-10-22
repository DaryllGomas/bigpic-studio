// Mirror (TV = web), generated news, home band affordance. Run on Atlas only:
//   atlas-run ~/Projects/sites/bigpic-studio-meet tests/mirror-and-news.mjs <out-dir>
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out = process.env.OUT_DIR, base = process.env.SITE_URL;
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan'] });
const errors = [], results = [];
const ok = (m) => results.push(m);
// the studio page's own analytics calls to the public stats service are blocked by CORS from a test origin: not ours
const watch = (p) => { p.on('pageerror', (e) => errors.push(e.message)); p.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); }); };
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.addInitScript(() => { window.testPad = Array(18).fill(false); Object.defineProperty(navigator, 'getGamepads', { value: () => [{ buttons: window.testPad.map((pressed) => ({ pressed, value: +pressed })), axes: [0, 0], mapping: 'standard', index: 0 }] }); });
let p = await ctx.newPage(); watch(p);
const A = base + '/arcade/';
async function load(q = '') { await p.goto(A + q); await p.waitForFunction(() => window.__junction); await p.waitForTimeout(2200); }
const J = (fn, ...a) => p.evaluate(fn, ...a);
async function pad(i) { await p.evaluate((i) => (window.testPad[i] = true), i); await p.waitForTimeout(150); try { await p.evaluate((i) => (window.testPad[i] = false), i); } catch {} await p.waitForTimeout(1600); }
const rows = () => J(() => __junction.CATS.map((c) => ({ name: c.name, ids: c.list.map((g) => g.id) })));

// ---- 1. web: two rows, STUDIO first
await load();
assert.equal(await J(() => __junction.TV), false);
assert.equal(await J(() => __junction.category), 'STUDIO');
const web = await rows();
assert.deepEqual(web.map((r) => r.name), ['STUDIO', 'ARCADE']);
assert.equal(web[0].ids.length, 4); assert.equal(web[1].ids.length, 26);
await p.screenshot({ path: out + '/web-aisle-1920.png' });
await pad(13); assert.equal(await J(() => __junction.category), 'ARCADE'); await p.screenshot({ path: out + '/web-aisle-arcade-1920.png' });
await pad(12); assert.equal(await J(() => __junction.category), 'STUDIO');
ok('web rows STUDIO(4) + ARCADE(26); no NEW ARRIVALS / CLASSICS / INDIE GEMS; opens on STUDIO');

// ---- 2. TV mode: same rows; only the seven Path games extra
await load('?launcher=tv&home=http://127.0.0.1:8731/tv/');
assert.equal(await J(() => __junction.TV), true);
const tv = await rows();
assert.deepEqual(tv.map((r) => r.name), ['STUDIO', 'ARCADE']);
assert.equal(await J(() => __junction.category), 'STUDIO');
assert.deepEqual(tv[1].ids, web[1].ids, 'ARCADE row identical');
assert.equal(tv[0].ids.length, 11);
assert.deepEqual(tv[0].ids.filter((id) => !id.startsWith('studio:seven-')), web[0].ids, 'STUDIO identical minus the seven');
assert.equal(tv[0].ids.filter((id) => id.startsWith('studio:seven-')).length, 7);
await p.screenshot({ path: out + '/tv-aisle-1920.png' });
let body; await p.route('http://127.0.0.1:8731/games', async (r) => { body = r.request().postData(); await r.fulfill({ status: 200, body: '{}' }); });
await p.keyboard.press('Enter'); await p.waitForTimeout(500); assert.deepEqual(JSON.parse(body), { action: 'play', id: 'the-path' });
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1600); // THE FIRST WORLD
await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(1600);
await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(1600); // wraps to the last (a Path game, TV only)
assert.equal(await J(() => __junction.selected), 'studio:seven-constellation');
await p.screenshot({ path: out + '/tv-aisle-seven-1920.png' });
ok('TV rows identical to web (STUDIO + ARCADE), STUDIO = web 4 + seven Path games, A posts to the room agent');
await load('?launcher=tv');
assert.equal(await J(() => __junction.selected), 'warlordsroad'); assert.equal(await J(() => __junction.category), 'ARCADE');
await load('?launcher=tv&home=http://127.0.0.1:8731/tv/&game=studio:the-house'); assert.equal(await J(() => __junction.selected), 'studio:the-house');
ok('TV defaults kept: no-home opens Warlords Road, ?home opens STUDIO, ?game= selects');
p.unroute('http://127.0.0.1:8731/games');

// ---- 3. web launches (destinations intercepted)
const targets = { 'studio:the-path': 'https://thepath.bigpicsolutions.com/', 'studio:the-first-world': 'https://studio.bigpicsolutions.com/the-first-world/play/', 'studio:the-house': 'https://studio.bigpicsolutions.com/house/', 'studio:beyond-the-nexus': 'https://studio.bigpicsolutions.com/rpg/' };
await p.close(); p = await ctx.newPage(); watch(p);
let dest = null; await p.route(/.*/, async (route) => { const u = route.request().url(); if (route.request().isNavigationRequest() && Object.values(targets).includes(u)) { dest = u; await route.abort(); } else await route.continue(); });
for (const [id, url] of Object.entries(targets)) { await load('?game=' + encodeURIComponent(id)); dest = null; await pad(0); assert.equal(dest, url, id + ' url=' + p.url()); }
ok('web: A launches all four Studio public pages');
await load('?game=gridcycles&play=1'); await p.waitForTimeout(2500); assert.equal(await J(() => __junction.category), 'ARCADE'); assert.equal(await J(() => __junction.mode), 'play');
await p.keyboard.press('Escape'); await p.waitForTimeout(1800); assert.equal(await J(() => __junction.mode), 'aisle');
ok('web: ?game=<cart>&play=1 starts playing, Escape returns');
await p.unroute(/.*/);

// ---- 4. home: What's new is generated from every game's devlog
const hp = await ctx.newPage(); watch(hp); const homeErrs = []; hp.on('pageerror', (e) => homeErrs.push(e.message));
await hp.goto(base + '/', { waitUntil: 'networkidle' });
const news = await (await hp.request.get(base + '/news.json')).json();
assert.equal(news.newest, '2026-10-18');
const wnDate = await hp.locator('[data-whatsnew] time').getAttribute('datetime'); assert.equal(wnDate, news.newest);
await hp.locator('[data-whatsnew]').click(); await hp.waitForTimeout(500);
const wnItems = await hp.locator('#wnModal li').evaluateAll((ls) => ls.map((l) => ({ t: l.querySelector('b').textContent, href: l.querySelector('a').getAttribute('href'), d: l.querySelector('time').dateTime })));
assert.ok(wnItems.some((i) => i.t.startsWith('Beyond the Nexus Log 04') && i.href === 'rpg/'), 'Beyond the Nexus Log 04 listed');
assert.ok(wnItems.some((i) => i.t.startsWith('The Junction v1.4')), 'Junction update listed');
assert.ok(wnItems.some((i) => i.t.startsWith('The Path v0.3')), 'The Path listed');
assert.ok(wnItems.some((i) => i.t.startsWith('The First World v0.12')), 'First World listed');
assert.equal(wnItems.length, 8); assert.ok(wnItems.every((x, i) => i === 0 || x.d <= wnItems[i - 1].d), 'newest first');
await hp.screenshot({ path: out + '/whats-new-1920.png' });
await hp.keyboard.press('Escape');
const logTxt = await hp.locator('#log .log2').innerText(); assert.ok(logTxt.includes('Beyond the Nexus Log 04') && logTxt.includes('The Junction v1.4'), 'Lab log has the newest');
ok(`home What's new = ${wnItems.length} newest items across games (incl. Beyond the Nexus Log 04, Junction v1.4, The Path v0.3); button date = ${wnDate}; Lab log regenerated`);
assert.deepEqual(homeErrs, []);

// ---- 5. home band: chevrons, nudge, drag, wheel, click-to-centre, click-to-enter
await hp.evaluate(() => document.getElementById('junction').scrollIntoView({ block: 'center' }));
let fr = null; for (let i = 0; i < 40 && !fr; i++) { await hp.waitForTimeout(250); fr = hp.frames().find((f) => f.url().includes('embed=1')); }
assert.ok(fr, 'band iframe');
await fr.waitForFunction(() => window.__junction); 
let maxDev = 0; for (let i = 0; i < 24; i++) { await hp.waitForTimeout(250); maxDev = Math.max(maxDev, await fr.evaluate(() => Math.abs(__junction.pos - Math.round(__junction.pos)))); }
assert.ok(maxDev > 0.2, 'nudge on arrival, max deviation ' + maxDev); ok('band nudges once when it arrives (max drift ' + maxDev.toFixed(2) + ')');
await hp.waitForTimeout(2500);
const box = await hp.locator('#junction').boundingBox(); await hp.screenshot({ path: out + '/home-band-1920.png' });
const sel = () => fr.evaluate(() => __junction.selected);
assert.equal(await sel(), 'studio:the-path');
assert.ok(await fr.locator('#chevL').isVisible() && await fr.locator('#chevR').isVisible(), 'chevrons visible');
await fr.locator('#chevR').click(); await hp.waitForTimeout(1700); assert.equal(await sel(), 'studio:the-first-world');
await fr.locator('#chevL').click(); await hp.waitForTimeout(1700); assert.equal(await sel(), 'studio:the-path'); ok('chevrons spin right and left');
const cur = await fr.evaluate(() => getComputedStyle(document.getElementById('gl')).cursor); assert.equal(cur, 'grab');
const cx = box.x + box.width / 2, cy = box.y + box.height * 0.62;
// drag left spins to the next
await hp.mouse.move(cx, cy); await hp.mouse.down(); await hp.mouse.move(cx - 150, cy, { steps: 8 }); await hp.mouse.move(cx - 300, cy, { steps: 8 }); await hp.mouse.up(); await hp.waitForTimeout(1700);
assert.notEqual(await sel(), 'studio:the-path'); ok('horizontal drag spins (selected now ' + await sel() + ')');
await fr.evaluate(() => __junction.move(0)); 
// bring back to the path
await fr.evaluate(() => { const g = __junction; const i = g.CATS[0].list.findIndex((x) => x.id === 'studio:the-path'); const n = g.CATS[0].list.length; const cur = g.CATS[0].list.findIndex((x) => x.id === g.selected); g.move(((i - cur) % n + n) % n); }); await hp.waitForTimeout(1900);
// shift+wheel / sideways wheel spins, vertical wheel scrolls the page
const before = await sel(); await hp.mouse.move(cx, cy); await hp.mouse.wheel(300, 0); await hp.waitForTimeout(1700); assert.notEqual(await sel(), before); ok('sideways wheel spins');
const y0 = await hp.evaluate(() => scrollY); await hp.mouse.wheel(0, 400); await hp.waitForTimeout(800); const y1 = await hp.evaluate(() => scrollY); assert.ok(y1 > y0 + 100, `vertical wheel scrolls the page (${y0} -> ${y1})`); ok('vertical wheel still scrolls the page');
await hp.evaluate(() => document.getElementById('junction').scrollIntoView({ block: 'center' })); await hp.waitForTimeout(600);
const box2 = await hp.locator('#junction').boundingBox(); const cy2 = box2.y + box2.height * 0.62, cx2 = box2.x + box2.width / 2;
// click a non-centred cabinet: it comes to the centre
const b4 = await sel(); await hp.mouse.click(cx2 + box2.width * 0.12, cy2); await hp.waitForTimeout(1800); assert.notEqual(await sel(), b4); ok('click on a neighbour spins it to the centre');
// click centred studio cabinet enters its public page
let nav = null; await hp.route(/.*/, async (route) => { const r = route.request(); if (r.isNavigationRequest() && r.frame() === hp.mainFrame()) { nav = r.url(); if (!nav.startsWith(base)) { await route.abort(); return; } } await route.continue(); });
const selNow = await sel(); await hp.mouse.click(cx2, cy2); await hp.waitForTimeout(900); assert.equal(nav, targets[selNow], 'centred studio cabinet opens its page'); ok('click on the centred Studio cabinet opens ' + nav);
// ARCADE cart: down a row, click centred, goes to /arcade/?game=<id>&play=1
await hp.unroute(/.*/); await hp.goto(base + '/', { waitUntil: 'networkidle' }); await hp.evaluate(() => document.getElementById('junction').scrollIntoView({ block: 'center' }));
fr = null; for (let i = 0; i < 40 && !fr; i++) { await hp.waitForTimeout(250); fr = hp.frames().find((f) => f.url().includes('embed=1')); } await fr.waitForFunction(() => window.__junction); await hp.waitForTimeout(3500);
await fr.evaluate(() => __junction.switchCat(1)); await hp.waitForTimeout(2500);
const cart = await fr.evaluate(() => __junction.selected); const box3 = await hp.locator('#junction').boundingBox();
await hp.mouse.click(box3.x + box3.width / 2, box3.y + box3.height * 0.62); await hp.waitForURL(/\/arcade\/\?game=.*&play=1/, { timeout: 8000 });
assert.ok(hp.url().includes('game=' + cart)); ok('click on the centred arcade cart opens ' + hp.url().replace(base, ''));
await hp.waitForFunction(() => window.__junction && __junction.mode === 'play', null, { timeout: 12000 }); ok('...and that cabinet is playing');

// ---- 6. phone 390
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const m = await phone.newPage(); watch(m);
await m.goto(A); await m.waitForFunction(() => window.__junction); await m.waitForTimeout(2200); await m.screenshot({ path: out + '/phone-aisle-390.png' });
assert.equal(await m.evaluate(() => __junction.category), 'STUDIO');
await m.goto(base + '/', { waitUntil: 'networkidle' }); await m.evaluate(() => document.getElementById('junction').scrollIntoView({ block: 'center' })); await m.waitForTimeout(6000);
const mf = m.frames().find((f) => f.url().includes('embed=1')); assert.ok(mf, 'phone band iframe');
assert.ok(await mf.locator('#chevL').isVisible() && await mf.locator('#chevR').isVisible(), 'phone chevrons visible');
await m.screenshot({ path: out + '/phone-band-390.png' });
await mf.locator('#chevR').tap(); await m.waitForTimeout(1700); assert.equal(await mf.evaluate(() => __junction.selected), 'studio:the-first-world'); ok('phone: chevrons visible and tappable');
assert.ok(!(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'no horizontal overflow on phone');
await m.evaluate(() => scrollTo(0, 0)); await m.waitForTimeout(500); await m.locator('[data-whatsnew]').tap(); await m.waitForTimeout(600); await m.screenshot({ path: out + '/whats-new-390.png' });

// ---- 7. the home poster (embed mode, 1600x612), after the chevrons exist
await p.setViewportSize({ width: 1600, height: 612 }); await load('?embed=1'); await p.waitForTimeout(3500);
await p.screenshot({ path: out + '/aisle-poster.jpg', type: 'jpeg', quality: 92 });
await p.setViewportSize({ width: 1920, height: 1080 });

const real = errors.filter((e) => !/pulse\.bigpicsolutions\.com/.test(e));
await fs.writeFile(out + '/results.json', JSON.stringify({ results, errors: real, ignored: errors.length - real.length }, null, 2));
console.log(JSON.stringify({ results, errors: real }, null, 2));
assert.deepEqual(real, []);
await browser.close();
