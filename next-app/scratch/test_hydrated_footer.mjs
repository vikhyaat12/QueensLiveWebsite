import { chromium } from '@playwright/test';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function testHydratedFooter() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Logging in...');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@queenscare.in', password: 'QueensCare#Admin2026' })
    });
  });

  console.log('2. Navigating to /admin...');
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  
  // Wait for search input to be interactive to guarantee hydration
  console.log('3. Waiting for search input hydration...');
  const searchInput = page.locator('input[placeholder*="Search"]');
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });
  // Type in search input to verify React state is active
  await searchInput.fill('Footer');
  await page.waitForTimeout(500);

  console.log('4. Clicking Footer Builder button...');
  const footerBtn = page.locator('button:has-text("Footer Builder")').first();
  await footerBtn.click();
  await page.waitForTimeout(2000);

  const bodyText = await page.innerText('body');
  console.log('Current H2 header:', await page.locator('h2').allInnerTexts());

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

  console.log('--- FOOTER BUILDER CONTROLS CHECK ---');
  for (const ctrl of controls) {
    const found = bodyText.includes(ctrl);
    console.log(`${ctrl}: ${found ? 'PASS' : 'FAIL'}`);
    if (found) {
      const btn = page.locator(`button:has-text("${ctrl}")`).first();
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(200);
        console.log(`  -> Clicked [${ctrl}] successfully`);
      }
    }
  }

  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'smoke_screenshots', 'footer_builder_subtabs_verified.png') });
  console.log('Saved screenshot to scratch/smoke_screenshots/footer_builder_subtabs_verified.png');
  await browser.close();
}

testHydratedFooter().catch(console.error);
