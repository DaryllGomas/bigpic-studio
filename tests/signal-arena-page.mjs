// Signal Arena on the studio site: its page, the home card, What's new, the trailer, the game from play/, the
// request deep link (opened and checked, never sent) and the arcade cabinet. Run on Atlas only:
//   atlas-run . tests/signal-arena-page.mjs <out-dir>
// Calls to the public stats service are blocked here so checks never count as visits.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out = process.env.OUT_DIR, base = process.env.SITE_URL;
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan', '--autoplay-policy=no-user-gesture-required'] });
const errors = [], results = [];
const ok = (m) => { results.push(m); console.log('✓', m); };
const ignorable = (t) => /pulse\.bigpicsolutions\.com|ERR_BLOCKED_BY_CLIENT|ERR_FAILED/.test(t);
const watch = (p, tag) => {
  p.on('pageerror', (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !ignorable(m.text())) errors.push(`[${tag}] console: ${m.text()}`); });
  p.on('response', (r) => { if (r.status() >= 400 && !ignorable(r.url())) errors.push(`[${tag}] ${r.status()} ${r.url()}`); });
};
const block = async (ctx) => { await ctx.route(/pulse\.bigpicsolutions\.com|formsubmit\.co/, (r) => r.abort('blockedbyclient')); };

// ---- 1. the page, desktop
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } }); await block(desk);
let p = await desk.newPage(); watch(p, 'page');
await p.goto(base + '/signal-arena/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.screenshot({ path: out + '/page-desktop-hero.png' });
assert.equal(await p.locator('h1').innerText(), 'SIGNAL ARENA'.toUpperCase());
assert.ok(await p.locator('a.btn-play[href="play/?map=study"]').count(), 'Play button');
await p.waitForFunction(() => document.querySelectorAll('#log .hub-rel').length > 0);
assert.equal(await p.locator('#log .hub-h').first().innerText(), "WHAT'S NEW".toUpperCase());
assert.equal(await p.locator('#log .hub-rel-title').first().innerText(), 'The Operator’s Study');
assert.equal(await p.locator('#log .hub-ver').first().innerText(), 'V0.3');
assert.equal(await p.locator('#log form, #log .hub-form').count(), 0, 'What\'s new only: no feedback form');
const broken = await p.evaluate(async () => { const bad = []; for (const im of document.images) { if (im.loading === 'lazy') { im.loading = 'eager'; } }
  await new Promise((r) => setTimeout(r, 1500)); for (const im of document.images) if (im.getAttribute("src") && (!im.complete || !im.naturalWidth)) bad.push(im.getAttribute('src')); return bad; });
assert.deepEqual(broken, [], 'every image loads');
await p.screenshot({ path: out + '/page-desktop-full.png', fullPage: true });
ok('page: hero, Play, What\'s new from devlog.json (shared hub, no form), every image loads (desktop 1440)');

// ---- 2. the trailer plays
const codec = await p.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"'));
await p.locator('#trailer').scrollIntoViewIfNeeded();
await p.locator('#cover').click();
let played = null;
if (codec) {
  await p.waitForFunction(() => { const v = document.getElementById('film'); return v.currentTime > 2.5 && !v.paused; }, null, { timeout: 15000 });
  played = await p.evaluate(() => { const v = document.getElementById('film'); return { t: +v.currentTime.toFixed(1), duration: +v.duration.toFixed(1), w: v.videoWidth, h: v.videoHeight }; });
  await p.locator('.player').screenshot({ path: out + '/trailer-playing.png' });
  ok(`trailer plays: ${JSON.stringify(played)}`);
} else ok('trailer: this Chromium has no H.264 (canPlayType empty); play check skipped, the file is checked with ffprobe instead');
await p.close();

// ---- 3. the page at phone width
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await block(phone);
p = await phone.newPage(); watch(p, 'phone');
await p.goto(base + '/signal-arena/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
assert.ok(overflow <= 0, `no sideways scroll on a phone (${overflow}px)`);
await p.screenshot({ path: out + '/page-phone-hero.png' });
await p.evaluate(async () => { document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }); await Promise.all([...document.images].filter((i) => i.getAttribute('src')).map((i) => i.decode().catch(() => {}))); });
await p.screenshot({ path: out + '/page-phone-full.png', fullPage: true });
ok('page at 390 wide: no sideways scroll');
await p.close();

// ---- 4. home: the card and What's new
p = await desk.newPage(); watch(p, 'home');
await p.goto(base + '/', { waitUntil: 'networkidle' });
const card = p.locator('#signal-arena');
await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
await p.waitForTimeout(600);
await card.screenshot({ path: out + '/home-card.png' });
assert.equal(await card.locator('a.u-game').getAttribute('href'), 'signal-arena/');
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
await p.locator('[data-whatsnew]').click(); await p.waitForTimeout(600);
const first = await p.locator('#wnModal li b').first().innerText();
assert.ok(first.startsWith('Signal Arena v0.3'), first);
await p.screenshot({ path: out + '/whats-new.png' });
ok(`home: card links to signal-arena/; What's new leads with "${first}"`);
await p.close();

// ---- 5. the request deep link opens the form pre-filled (never sent)
p = await desk.newPage(); watch(p, 'request');
let posted = false; p.on('request', (r) => { if (r.method() === 'POST' && /formsubmit|\/v1\/request/.test(r.url())) posted = true; });
await p.goto(base + '/#request?about=signal-arena-multiplayer', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
const form = await p.evaluate(() => ({ open: document.getElementById('reqModal').classList.contains('open'), kind: document.getElementById('reqKind').value, message: document.querySelector('#reqForm textarea').value }));
assert.deepEqual(form, { open: true, kind: 'request', message: 'Multiplayer for Signal Arena' });
await p.screenshot({ path: out + '/request-deep-link.png' });
assert.equal(posted, false);
ok(`deep link: ${JSON.stringify(form)}; nothing sent`);
await p.close();

// ---- 6. the game from play/: loads the study, no console errors; its multiplayer button opens the same form
p = await desk.newPage(); watch(p, 'game');
await p.goto(base + '/signal-arena/play/?map=study');
await p.waitForFunction(() => window.__GAME_DEBUG__, null, { timeout: 30000 });
await p.evaluate(() => window.__GAME_DEBUG__.mapReady()); await p.waitForTimeout(4000);
const mp = await p.locator('#mp-open').innerText();
assert.equal(mp.toLowerCase(), 'want multiplayer? ask for it');
await p.screenshot({ path: out + '/game-start.png' });
const [tab] = await Promise.all([desk.waitForEvent('page'), p.locator('#mp-open').click()]);
await tab.waitForLoadState('networkidle'); await tab.waitForTimeout(600);
const viaGame = await tab.evaluate(() => ({ url: location.pathname + location.hash, open: document.getElementById('reqModal').classList.contains('open'), message: document.querySelector('#reqForm textarea').value }));
assert.equal(viaGame.open, true); assert.equal(viaGame.message, 'Multiplayer for Signal Arena');
await tab.screenshot({ path: out + '/game-ask-for-it.png' }); await tab.close();
await p.evaluate(() => { window.__GAME_DEBUG__.start(); }); await p.waitForTimeout(2500);
await p.screenshot({ path: out + '/game-playing.png' });
ok(`game: study loads from /signal-arena/play/; "${mp}" opens ${viaGame.url} pre-filled`);
await p.close();

// ---- 7. the arcade: the Signal Arena cabinet on the STUDIO shelf
p = await desk.newPage(); watch(p, 'arcade');
await p.goto(base + '/arcade/?game=' + encodeURIComponent('studio:signal-arena'));
await p.waitForFunction(() => window.__junction); await p.waitForTimeout(3500);
assert.equal(await p.evaluate(() => __junction.selected), 'studio:signal-arena');
await p.screenshot({ path: out + '/arcade-cabinet.png' });
await p.setViewportSize({ width: 1600, height: 612 });
await p.goto(base + '/arcade/?embed=1'); await p.waitForFunction(() => window.__junction); await p.waitForTimeout(3000);
await p.screenshot({ path: out + '/arcade-embed-1600x612.png' });
ok('arcade: Signal Arena cabinet selectable on the STUDIO shelf');
await p.close();

await fs.writeFile(out + '/results.json', JSON.stringify({ results, errors, played }, null, 2));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
