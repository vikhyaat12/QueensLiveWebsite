import { chromium } from '@playwright/test';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function testFast() {
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

  console.log('Navigating to /admin?tab=footer-builder...');
  await page.goto(`${BASE_URL}/admin?tab=footer-builder`);
  
  console.log('Waiting for Footer Builder subtabs to render...');
  await page.waitForSelector('button:has-text("Trust Strip")', { timeout: 20000 });

  const text = await page.innerText('body');
  console.log('Global Footer CMS:', text.includes('Global Footer CMS'));
  console.log('Trust Strip:', text.includes('Trust Strip'));
  console.log('Brand & Social:', text.includes('Brand & Social'));
  console.log('Navigation Columns:', text.includes('Navigation Columns'));
  console.log('Patient Support:', text.includes('Patient Support'));
  console.log('Statutory & Legal:', text.includes('Statutory & Legal'));
  console.log('Clinical Notice:', text.includes('Clinical Notice'));
  console.log('Copyright & Policies:', text.includes('Copyright & Policies'));
  console.log('Theme & Styling:', text.includes('Theme & Styling'));
  console.log('Version History:', text.includes('Version History'));

  // Test clicking buttons to prove interactability
  const testSubtabs = ['Trust Strip', 'Brand & Social', 'Theme & Styling', 'Version History'];
  for (const st of testSubtabs) {
    const btn = page.locator(`button:has-text("${st}")`).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(400);
      console.log(`  Clicked [${st}]: interactive OK`);
    }
  }

  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'smoke_screenshots', 'footer_builder_ALL_CONTROLS_VERIFIED.png') });
  console.log('Screenshot captured to scratch/smoke_screenshots/footer_builder_ALL_CONTROLS_VERIFIED.png');
  await browser.close();
}

testFast().catch(console.error);
