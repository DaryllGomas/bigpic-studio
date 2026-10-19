import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
const out = process.env.OUT_DIR;
const assert = (value, message) => { if (!value) throw Error(message); };
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist','--use-angle=vulkan'] });
const results = [];
for (const width of [1920,1366,820,390]) {
  const page = await browser.newPage({ viewport: { width, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const errors = [], consoleErrors = [], failedRequests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if(m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', r => failedRequests.push({url:r.url(), error:r.failure()?.errorText}));
  await page.goto(process.env.SITE_URL, {waitUntil:'networkidle'});
  const row = page.locator('.u-meet');
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await row.screenshot({path:`${out}/${width}-meet-row.png`});
  const keys = await row.locator('[data-info]').evaluateAll(cards => cards.map(c=>c.dataset.info));
  const galleries=[];
  const updated = keys.includes('current');
  assert(await row.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete && img.naturalWidth>0)), 'Card art failed to load');
  for (const key of keys) {
    await row.locator(`[data-info="${key}"]`).click();
    await page.locator('#infoMain').evaluate(async img=>{await img.decode();});
    await page.waitForTimeout(300);
    await page.locator('#infoModal').screenshot({path:`${out}/${width}-${key}-popup.png`});
    if(updated) assert(await page.locator('#infoMain').evaluate(img=>getComputedStyle(img).objectFit === 'contain'), `${key}: character gallery crops art`);
    const buttons = page.locator('#infoThumbs button');
    for(let i=0;i<await buttons.count();i++) {
      await buttons.nth(i).click();
      await page.locator('#infoMain').evaluate(async img=>{await img.decode();});
      galleries.push(await page.locator('#infoMain').evaluate(img=>({key:img.alt,src:img.getAttribute('src'),fit:getComputedStyle(img).objectFit,loaded:img.naturalWidth>0})));
      if(i>0) await page.locator('#infoModal').screenshot({path:`${out}/${width}-${key}-popup-${i+1}.png`});
    }
    await page.keyboard.press('Escape');
    if(await page.locator('#infoModal').evaluate(m=>m.classList.contains('open'))) throw Error('Escape did not close');
  }
  if(updated) {
    await page.locator('[data-info="w1"]').click();
    assert(await page.locator('#infoMain').evaluate(img=>getComputedStyle(img).objectFit === 'cover'), 'World gallery inherited character styling');
    await page.keyboard.press('Escape');
  }
  assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth), 'Horizontal page overflow');
  results.push({width,errors,consoleErrors,failedRequests,galleries, horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  await page.close();
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
await browser.close();
if(results.some(r=>r.errors.length)) throw Error('Page errors detected');
