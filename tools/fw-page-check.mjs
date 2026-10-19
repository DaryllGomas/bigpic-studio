// Run with atlas-run <this-worktree> tools/fw-page-check.mjs <output>.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle','--use-angle=vulkan','--enable-gpu','--ignore-gpu-blocklist'] });
const report = [];
for (const [name, width, height] of [['desktop',1440,900],['mobile',390,844]]) {
 for (const [slug, path] of [['game','/the-first-world/'],['studio','/']]) {
  const p = await browser.newPage({viewport:{width,height}, reducedMotion:'reduce'});
  const errors=[];const failedRequests=[];
  p.on('requestfailed',r=>failedRequests.push({url:r.url().split('?')[0],error:r.failure()?.errorText}));
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('console',m=>{if(m.type()==='error') errors.push(m.text().replace(/visitor=[^'& ]+/g,'visitor=[anonymous]'));});
  await p.goto(process.env.SITE_URL+path,{waitUntil:'networkidle'});
  await p.evaluate(async()=>{for(const im of document.images) im.loading='eager'; await Promise.all([...document.images].filter(i=>i.getAttribute('src')).map(i=>i.decode().catch(()=>{})));});
  await p.waitForTimeout(4200);
  const checks=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth, broken:[...document.images].filter(i=>i.getAttribute('src')&&(!i.complete||!i.naturalWidth)).map(i=>i.getAttribute('src'))}));
  await p.screenshot({path:`${process.env.OUT_DIR}/${slug}-${name}.png`,fullPage:true});
  report.push({slug,name,...checks,errors,failedRequests});
  await p.close();
 }
}
await fs.writeFile(`${process.env.OUT_DIR}/report.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
await browser.close();
const failures = report.filter(r => r.overflow || r.broken.length ||
 r.failedRequests.some(f => new URL(f.url).hostname !== 'pulse.bigpicsolutions.com') ||
 r.errors.some(e => !e.includes('pulse.bigpicsolutions.com') && !e.includes('net::ERR_FAILED')));
if (failures.length) throw new Error(`Page checks failed: ${JSON.stringify(failures)}`);
