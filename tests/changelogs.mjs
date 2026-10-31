// Changelogs on every studio game page: Signal Arena, Beyond the Nexus and The First World each show their own
// devlog.json as a "What's new" list (the shared game hub), every release newest first with version, date and title,
// the latest one open. Shoots each page's What's new block at 1920 and on a 390 phone. Run on Atlas only:
//   atlas-run . tests/changelogs.mjs <out-dir>            (checks and shots)
//   atlas-run . tests/changelogs.mjs <out-dir> before     (shots only, no checks: for a before/after pair)
// Calls to the public stats service are blocked here so checks never count as visits.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out = process.env.OUT_DIR, base = process.env.SITE_URL;
const before = process.argv.includes('before');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan'] });
const pages = { sa: '/signal-arena/', rpg: '/rpg/', tfw: '/the-first-world/' };
const views = [
  { tag: '1920', viewport: { width: 1920, height: 1080 } },
  { tag: '390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const errors = [], report = {};
const ignorable = (t) => /pulse\.bigpicsolutions\.com|ERR_BLOCKED_BY_CLIENT|ERR_FAILED/.test(t);
for (const v of views) {
  const ctx = await browser.newContext(v);
  await ctx.route(/pulse\.bigpicsolutions\.com|formsubmit\.co/, (r) => r.abort('blockedbyclient'));
  for (const [name, path] of Object.entries(pages)) {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`[${name}-${v.tag}] pageerror: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error' && !ignorable(m.text())) errors.push(`[${name}-${v.tag}] console: ${m.text()}`); });
    await p.goto(base + path, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => document.querySelector('.hub-rel, #log li h3, .hub-empty'), null, { timeout: 15000 });
    await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
    const devlog = await (await p.request.get(base + path + 'devlog.json')).json();
    const seen = await p.evaluate(() => {
      const news = document.querySelector('.hub-news');
      if (!news) return { hub: false };
      return {
        hub: true,
        heading: news.querySelector('.hub-h')?.textContent.trim(),
        rows: [...news.querySelectorAll('.hub-rel')].map((li) => ({
          version: li.querySelector('.hub-ver')?.textContent.trim(),
          date: li.querySelector('.hub-date')?.getAttribute('datetime'),
          dateText: li.querySelector('.hub-date')?.textContent.trim(),
          title: li.querySelector('.hub-rel-title')?.textContent.trim(),
          latest: li.classList.contains('is-latest'),
          open: li.querySelector('details')?.open,
        })),
        sideways: document.documentElement.scrollWidth - innerWidth,
      };
    });
    report[`${name}-${v.tag}`] = seen;
    if (!before) {
      assert.equal(seen.hub, true, `${name}: What's new comes from the shared hub`);
      assert.equal(seen.heading, "What's new", `${name}: heading`);
      assert.equal(seen.rows.length, devlog.releases.length, `${name}: every release listed`);
      seen.rows.forEach((r, i) => {
        const d = devlog.releases[i];
        assert.equal(r.version, d.version, `${name} row ${i} version`); assert.equal(r.date, d.date, `${name} row ${i} date`);
        assert.equal(r.title, d.title, `${name} row ${i} title`); assert.ok(r.dateText, `${name} row ${i} shows a date`);
        if (i) assert.ok(r.date <= seen.rows[i - 1].date, `${name}: newest first`);
      });
      assert.ok(seen.rows[0].latest && seen.rows[0].open, `${name}: the latest release is marked and open`);
      assert.ok(seen.sideways <= 0, `${name}-${v.tag}: no sideways scroll (${seen.sideways}px)`);
      console.log('✓', name, v.tag, `What's new: ${seen.rows.length} release(s), latest ${seen.rows[0].version} ${seen.rows[0].date}`);
    }
    const target = p.locator('.hub-news').first();
    const box = (await target.count()) ? target : p.locator('#devlog').first();
    // fixed and sticky page bars would sit over an element shot; hide them for the picture only
    await p.addStyleTag({ content: '.bar,.top,.topbar,header.nav,[class*=sticky]{visibility:hidden!important}' });
    await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const pos = getComputedStyle(e).position; if (pos === 'fixed' || pos === 'sticky') e.style.visibility = 'hidden'; } });
    await box.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
    await box.screenshot({ path: `${out}/${name}-${v.tag}.png` });
    await p.close();
  }
  await ctx.close();
}
await fs.writeFile(out + '/report.json', JSON.stringify({ report, errors }, null, 1));
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
if (errors.length && !before) process.exit(1);
