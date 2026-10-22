import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
const out=process.env.OUT_DIR; await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM,args:['--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist','--use-angle=vulkan']});
const results=[];
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
for(const width of [1920,390]){
 const page=await browser.newPage({viewport:{width,height:1080},reducedMotion:'reduce'});
 const errors=[],consoleErrors=[]; page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 await page.goto(`${process.env.SITE_URL}/rpg/`,{waitUntil:'networkidle'});
 await page.getByText('The Current wakes, and the music gets real',{exact:true}).waitFor();
 check(await page.locator('.hub-ver').first().textContent()==='Log 04','Latest log missing');
 check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'Horizontal overflow');
 await page.locator('#shots').scrollIntoViewIfNeeded();
 await page.locator('.note').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>[...document.querySelectorAll('#shots img')].every(i=>i.complete&&i.naturalWidth>0));
 check(await page.locator('#shots .shot').count()===15,'Missing shots');
 await page.screenshot({path:`${out}/${width}-page.png`,fullPage:true});
 await page.locator('[data-i="13"]').click();
 check(await page.locator('#lb').evaluate(e=>e.classList.contains('open')),'Lightbox failed');
 await page.screenshot({path:`${out}/${width}-lightbox.png`});
 await page.keyboard.press('Escape');
 check(!await page.locator('#lb').evaluate(e=>e.classList.contains('open')),'Escape failed');
 check(await page.locator('.btn-gold').getAttribute('href')==='/the-first-world/','Play button changed');
 check(errors.length===0,'Page errors');results.push({width,errors,consoleErrors,shots:15,devlog:'Log 04'});await page.close();
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close();
