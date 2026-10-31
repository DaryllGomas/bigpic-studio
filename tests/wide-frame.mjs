// Wide-screen framing check: full-page shots of the home page, Beyond the Nexus, Signal Arena and (for reference)
// The First World at 3440x1440, 2560x1440, 1920x1080 and a 390 phone, plus a measurement of how wide the content runs.
// Run on Atlas only:  atlas-run . tests/wide-frame.mjs <out-dir>
// Pass ONLY=<page> (home|rpg|sa|tfw) to shoot one page. Calls to the public stats service are blocked.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
const out = process.env.OUT_DIR, base = process.env.SITE_URL;
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan'] });
const pages = { home: '/', rpg: '/rpg/', sa: '/signal-arena/', tfw: '/the-first-world/' };
const views = [
  { tag: '3440', viewport: { width: 3440, height: 1440 } },
  { tag: '2560', viewport: { width: 2560, height: 1440 } },
  { tag: '1920', viewport: { width: 1920, height: 1080 } },
  { tag: '390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const only = process.argv[2] || process.env.ONLY;
const report = {};
for (const v of views) {
  const ctx = await browser.newContext(v);
  await ctx.route(/pulse\.bigpicsolutions\.com|formsubmit\.co/, (r) => r.abort('blockedbyclient'));
  for (const [name, path] of Object.entries(pages)) {
    if (only && only !== name) continue;
    const p = await ctx.newPage();
    await p.goto(base + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    // walk down the page so scroll-triggered reveals and lazy images fire, then force the rest
    await p.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
      document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; });
      await Promise.all([...document.images].filter((i) => i.getAttribute('src')).map((i) => i.decode().catch(() => {})));
      scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1200));
    });
    const m = await p.evaluate(() => {
      const W = innerWidth, wide = [];
      let minL = Infinity, maxR = -Infinity;
      const fixedUp = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return true; } return false; };
      for (const el of document.body.querySelectorAll('*')) {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || /^(IMG|VIDEO|CANVAS|IFRAME)$/.test(el.tagName);
        if (!own) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || fixedUp(el)) continue;
        if (el.closest('dialog,[role=dialog],.modal')) continue;
        minL = Math.min(minL, r.left); maxR = Math.max(maxR, r.right);
        if (r.width > Math.min(1300, W * 0.9)) wide.push({ tag: el.tagName, cls: String(el.className).slice(0, 40), id: el.id, text: (el.innerText || el.alt || '').trim().slice(0, 40), left: Math.round(r.left), width: Math.round(r.width) });
      }
      return { viewport: W, scrollWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, contentLeft: Math.round(minL), contentRight: Math.round(maxR), contentSpan: Math.round(maxR - minL), wide: wide.slice(0, 40) };
    });
    report[`${name}-${v.tag}`] = m;
    console.log(name, v.tag, `span ${m.contentSpan}px (${m.contentLeft}..${m.contentRight}) of ${m.viewport}; sideways ${m.scrollWidth - m.viewport}; wide blocks ${m.wide.length}`);
    await p.screenshot({ path: `${out}/${name}-${v.tag}.png`, fullPage: true });
    await p.close();
  }
  await ctx.close();
}
await fs.writeFile(out + '/measure.json', JSON.stringify(report, null, 1));
await browser.close();
