// Run against a production build: node tests/analytics.browser.mjs https://www.tokrace.com
// Sends one verification pageview to the existing Vercel project.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:3124';
const browser = await chromium.launch({ headless: false });
try {
  const page = await browser.newPage();
  // Vercel intentionally skips automation; enable collection for this smoke check.
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  const script = page.waitForResponse(r => r.url().endsWith('/_vercel/insights/script.js'));
  const view = page.waitForResponse(r => r.url().endsWith('/_vercel/insights/view') && r.request().method() === 'POST');
  await page.goto(`${base}/zh-CN`, { waitUntil: 'domcontentloaded' });
  assert.equal((await script).status(), 200);
  const response = await view;
  assert.equal(response.status(), 200);
  assert.equal(response.request().postDataJSON().o, `${base}/zh-CN`);
  const speed = await page.request.get(`${base}/_vercel/speed-insights/script.js`);
  assert.equal(speed.status(), 200);
  assert.match(speed.headers()['content-type'], /javascript/);
  console.log(JSON.stringify({ base, analyticsScript: 200, pageview: response.status(), speedScript: 200 }));
} finally {
  await browser.close();
}
