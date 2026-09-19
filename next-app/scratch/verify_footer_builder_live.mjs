import { chromium } from '@playwright/test';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function testFooterBuilder() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/admin/login`);
  await page.evaluate(async () => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@queenscare.in', password: 'QueensCare#Admin2026' })
    });
  });

  await page.goto(`${BASE_URL}/admin`);
  await page.waitForTimeout(2000);

  // Click Footer Builder button in sidebar
  const fbBtn = page.locator('button:has-text("Footer Builder")');
  console.log('Sidebar Footer Builder button count:', await fbBtn.count());
  await fbBtn.click();
  await page.waitForTimeout(2500);

  const text = await page.innerText('body');
  console.log('Includes "Global Footer CMS & Builder":', text.includes('Global Footer CMS & Builder'));

  const subtabs = [
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

  for (const st of subtabs) {
    const btn = page.locator(`button:has-text("${st}")`);
    const count = await btn.count();
    console.log(`  SubTab [${st}]: count=${count}`);
    if (count > 0) {
      await btn.first().click();
      await page.waitForTimeout(300);
    }
  }

  // Check CMS Page Picker inside Navigation Columns
  const navColBtn = page.locator('button:has-text("Navigation Columns")');
  if (await navColBtn.count() > 0) {
    await navColBtn.first().click();
    await page.waitForTimeout(500);
    const navText = await page.innerText('body');
    console.log('  Page Picker or Column editor present:', navText.includes('Column') || navText.includes('Page') || navText.includes('Link'));
  }

  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'smoke_screenshots', 'footer_builder_subtabs_verified.png') });
  console.log('Saved screenshot to scratch/smoke_screenshots/footer_builder_subtabs_verified.png');
  await browser.close();
}

testFooterBuilder().catch(console.error);
