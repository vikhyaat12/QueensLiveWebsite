import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'scratch', 'smoke_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const routesToTest = [
  { path: '/', name: 'Homepage' },
  { path: '/products', name: 'Products Catalog' },
  { path: '/shop', name: 'Shop' },
  { path: '/search', name: 'Search' },
  { path: '/cart', name: 'Cart' },
  { path: '/checkout', name: 'Checkout' },
  { path: '/login', name: 'Customer Login' },
  { path: '/account', name: 'Customer Account' },
  { path: '/about', name: 'About' },
  { path: '/people', name: 'Our People Directory' },
  { path: '/our-people', name: 'Our People Alias' },
  { path: '/blog', name: 'Blog' },
  { path: '/contact', name: 'Contact' },
  { path: '/faq', name: 'FAQ' },
  { path: '/careers', name: 'Careers' },
  { path: '/affiliate', name: 'Affiliate' },
  { path: '/admin/login', name: 'Admin Login' }
];

async function runMainRoutesTest() {
  console.log('--- STARTING MAIN ROUTES SMOKE TEST ---');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });

  const results = [];
  const globalConsoleErrors = [];

  for (const route of routesToTest) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 }
    });

    const pageConsoleErrors = [];
    const pageNetworkFailures = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // ignore benign third-party/favicon noise if any
        pageConsoleErrors.push(text);
        globalConsoleErrors.push({ route: route.path, text });
      }
    });

    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
        pageNetworkFailures.push({ url: res.url(), status: res.status() });
      }
    });

    const startTime = Date.now();
    let status = 'PASS';
    let notes = '';
    let pageTitle = '';
    let finalUrl = '';

    try {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        timeout: 45000,
        waitUntil: 'domcontentloaded'
      });

      // Wait a little for hydration/client rendering
      await page.waitForTimeout(1500);

      finalUrl = page.url();
      pageTitle = await page.title();
      const httpStatus = response ? response.status() : 0;

      // Check for blank page
      const bodyText = await page.innerText('body').catch(() => '');
      const hasContent = bodyText.trim().length > 20;

      // Check for Next.js error overlay
      const hasNextError = await page.locator('nextjs-portal, #__next-build-watcher, [data-nextjs-dialog-header]').count() > 0;
      const bodyHtml = await page.content();
      const hasUnhandledError = bodyHtml.includes('Application error: a client-side exception has occurred') ||
                                bodyHtml.includes('Internal Server Error') ||
                                bodyHtml.includes('Hydration failed');

      if (!hasContent) {
        status = 'FAIL';
        notes = 'Blank page or insufficient body text';
      } else if (hasNextError || hasUnhandledError) {
        status = 'FAIL';
        notes = 'Client-side exception or hydration error detected';
      } else if (httpStatus >= 400 && route.path !== '/account' && route.path !== '/checkout') {
        status = 'FAIL';
        notes = `HTTP ${httpStatus}`;
      } else {
        notes = `Rendered OK (Title: "${pageTitle.slice(0, 40)}...", Length: ${bodyText.length} chars)`;
        if (route.path === '/account' && finalUrl.includes('/login')) {
          notes += ' [Gracefully redirected to /login for unauthenticated user]';
        }
      }

      const safeName = route.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${safeName}_1440.png`), fullPage: false });

    } catch (err) {
      status = 'FAIL';
      notes = `Exception: ${err.message}`;
    }

    const elapsed = Date.now() - startTime;
    results.push({
      route: route.path,
      name: route.name,
      status,
      elapsed: `${elapsed}ms`,
      notes,
      consoleErrors: pageConsoleErrors.length,
      networkFailures: pageNetworkFailures.length
    });

    console.log(`[${status}] ${route.path} (${route.name}) - ${notes} [${elapsed}ms]`);

    await page.close();
  }

  // Responsive Mobile Checks
  console.log('\n--- RESPONSIVE MOBILE CHECKS ---');
  const viewports = [
    { width: 320, height: 568, label: '320px' },
    { width: 375, height: 667, label: '375px' },
    { width: 768, height: 1024, label: '768px' },
    { width: 1440, height: 900, label: '1440px' }
  ];

  const pagesForMobile = ['/', '/products', '/cart', '/checkout', '/login'];
  const mobileResults = [];

  for (const p of pagesForMobile) {
    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      try {
        await page.goto(`${BASE_URL}${p}`, { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        const safeP = p === '/' ? 'home' : p.replace(/\//g, '');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive_${safeP}_${vp.label}.png`) });

        mobileResults.push({
          page: p,
          viewport: vp.label,
          horizontalOverflow: overflow ? 'YES (OVERFLOW DETECTED)' : 'NO (FIT OK)',
          status: overflow ? 'WARN' : 'PASS'
        });
        console.log(`[RESPONSIVE] ${p} @ ${vp.label} -> Overflow: ${overflow ? 'YES' : 'NO'}`);
      } catch (err) {
        mobileResults.push({
          page: p,
          viewport: vp.label,
          horizontalOverflow: 'ERROR',
          status: 'FAIL',
          error: err.message
        });
      }
      await page.close();
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(process.cwd(), 'scratch', 'main_routes_results.json'),
    JSON.stringify({ results, mobileResults, globalConsoleErrors }, null, 2)
  );
  console.log('\nMain routes test completed and saved to scratch/main_routes_results.json');
}

runMainRoutesTest().catch(console.error);
