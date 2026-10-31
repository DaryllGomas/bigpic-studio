// The same as build.mjs, but on Atlas (no browser on thor): composes the studio cabinet art for the ids given and
// writes studio-<id>_{marquee,side,panel}.jpg to the out folder; copy them into arcade/cab/.
//   atlas-run . tools/cabinets/atlas-compose.mjs <out> <id> [id ...]   (painted art-in/<id>/ overrides aren't read here)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const ids = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM });
const page = await b.newPage();
page.on('pageerror', (e) => console.error('page error', e.message));
await page.goto(`${process.env.SITE_URL}/tools/cabinets/compose.html`);
await page.waitForFunction('window.ready === true');
for (const id of ids) for (const kind of ['marquee', 'side', 'panel']) {
  const url = await page.evaluate(([i, k]) => window.compose(i, k, {}), [id, kind]);
  fs.writeFileSync(`${process.env.OUT_DIR}/studio-${id}_${kind}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`studio-${id}_${kind}.jpg`);
}
await b.close();
