import { chromium } from '@playwright/test';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function testScriptLoad() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('response', res => {
    if (res.url().includes('chunks')) {
      console.log('CHUNK:', res.status(), res.url().split('/').pop());
    }
  });

  page.on('console', msg => {
    console.log('PAGE LOG:', msg.type(), msg.text());
  });

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
  await page.waitForTimeout(5000);

  console.log('Page title:', await page.title());
  await browser.close();
}

testScriptLoad().catch(console.error);
