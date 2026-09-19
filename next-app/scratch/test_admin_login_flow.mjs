import { chromium } from '@playwright/test';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function testAdminLogin() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to /admin/login...');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Monitor network requests
  page.on('request', req => {
    if (req.url().includes('/api/auth/')) {
      console.log('REQUEST:', req.method(), req.url());
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/auth/')) {
      console.log('RESPONSE:', res.status(), res.url());
    }
  });

  console.log('Filling form inputs...');
  await page.fill('#adm-email', 'admin@queenscare.in');
  await page.fill('#adm-password', 'QueensCare#Admin2026');
  await page.waitForTimeout(500);

  console.log('Submitting form...');
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login'), { timeout: 10000 }).catch(e => console.log('Response wait error:', e.message)),
    page.click('button[type="submit"]')
  ]);

  await page.waitForTimeout(3000);
  console.log('URL after submit:', page.url());
  const cookies = await context.cookies();
  console.log('Cookies:', cookies.map(c => c.name));

  if (!cookies.some(c => c.name === 'qc_session')) {
    console.log('Directly executing login via page.evaluate()...');
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@queenscare.in', password: 'QueensCare#Admin2026' })
      });
      return { status: r.status, data: await r.json() };
    });
    console.log('page.evaluate login result:', res);
  }

  console.log('Navigating to /admin...');
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Final URL:', page.url());
  const bodyText = await page.innerText('body');
  console.log('Admin Page Body Preview:', bodyText.slice(0, 300));
  await page.screenshot({ path: 'scratch/smoke_screenshots/admin_dashboard_authenticated.png' });

  await browser.close();
}

testAdminLogin().catch(console.error);
