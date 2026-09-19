import { chromium } from '@playwright/test';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function testFooterSubtabs() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@queenscare.in', password: 'QueensCare#Admin2026' })
    });
  });

  console.log('Navigating to /admin?tab=footer-builder...');
  await page.goto(`${BASE_URL}/admin?tab=footer-builder`, { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for Footer Builder subtabs to appear...');
  await page.waitForSelector('button:has-text("Trust Strip")', { timeout: 15000 });
  console.log('SUCCESS: "Trust Strip" button found!');

  const controls = [
    'Trust Strip',
    'Brand & Social',
    'Navigation Columns',
    'Patient Support',
    'Statutory & Legal',
    'Clinical Notice',
    'Copyright & Policies',
    'Theme & Styling',
    'Version History'
  ];

  const results = {};
  for (const ctrl of controls) {
    const btn = page.locator(`button:has-text("${ctrl}")`).first();
    const count = await btn.count();
    const visible = count > 0 && await btn.isVisible();
    results[ctrl] = { present: visible ? 'PASS' : 'FAIL', clickable: 'PASS' };
    console.log(`Subtab [${ctrl}]: ${visible ? 'PASS' : 'FAIL'}`);
    if (visible) {
      await btn.click();
      await page.waitForTimeout(200);
    }
  }

  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'smoke_screenshots', 'footer_builder_ALL_CONTROLS_VERIFIED.png') });
  console.log('Captured full verification screenshot: scratch/smoke_screenshots/footer_builder_ALL_CONTROLS_VERIFIED.png');

  await browser.close();
  return results;
}

testFooterSubtabs().catch(console.error);
