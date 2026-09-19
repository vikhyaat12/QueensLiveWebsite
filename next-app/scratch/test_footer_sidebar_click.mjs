import { chromium } from '@playwright/test';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function testFooterSidebar() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  
  await page.evaluate(async () => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@queenscare.in', password: 'QueensCare#Admin2026' })
    });
  });

  console.log('Navigating to admin...');
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Find Footer Builder button in sidebar
  const footerBtn = page.locator('button:has-text("Footer Builder")').first();
  console.log('Footer Builder button count in sidebar:', await footerBtn.count());
  if (await footerBtn.count() > 0) {
    await footerBtn.click();
    console.log('Clicked Footer Builder in sidebar. Waiting 2s...');
    await page.waitForTimeout(2000);

    const bodyText = await page.innerText('body');
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
    console.log('Screenshot saved to scratch/smoke_screenshots/footer_builder_subtabs_verified.png');
  } else {
    console.log('Sidebar button not found!');
  }

  await browser.close();
}

testFooterSidebar().catch(console.error);
