#!/usr/bin/env node
/*
 * Render assets/og-image.png, the 1200x630 picture shown when a link to the
 * site is shared (Open Graph / Twitter cards). Run by hand when the design
 * changes; it needs Playwright with Chromium.
 *
 *   node scripts/make-og-image.js
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const icon = fs.readFileSync(path.join(__dirname, '..', 'assets', 'app-icon.svg'), 'utf8');
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; }
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, system-ui, sans-serif; color: #cdccca;
    background: radial-gradient(circle at 0% 0%, rgba(79,152,163,0.28), transparent 45%), radial-gradient(circle at 100% 100%, rgba(79,152,163,0.12), transparent 40%), #171614;
    display: flex; align-items: center; gap: 64px; padding: 0 88px;
  }
  .icon { width: 280px; height: 280px; flex: 0 0 auto; filter: drop-shadow(0 24px 48px rgba(0,0,0,0.45)); }
  .icon svg { width: 100%; height: 100%; }
  .copy { display: grid; gap: 22px; }
  .eyebrow { display: inline-block; width: fit-content; padding: 10px 20px; border-radius: 999px; background: rgba(79,152,163,0.16); color: #4f98a3; font-size: 22px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  h1 { margin: 0; font-size: 82px; line-height: 1.02; letter-spacing: -0.03em; color: #ecebe8; }
  .lede { margin: 0; font-size: 34px; color: #9a9996; }
  .he { font-size: 34px; color: #6daa45; font-weight: 700; direction: rtl; }
  .url { margin-top: 6px; font-size: 26px; color: #4f98a3; font-weight: 600; }
</style></head><body>
  <div class="icon">${icon}</div>
  <div class="copy">
    <div class="eyebrow">Daily Tachanun Checker</div>
    <h1>Is there Tachanun today?</h1>
    <p class="lede">According to Chabad customs · <span class="he">תחנון</span></p>
    <div class="url">istheretachanun.com</div>
  </div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  const out = path.join(__dirname, '..', 'assets', 'og-image.png');
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log(`Wrote ${path.relative(process.cwd(), out)}`);
})();
