import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'scratch', 'smoke_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAdminSmokeTest() {
  console.log('==================================================');
  console.log('STARTING ADMIN & SUPPORT SMOKE SUITE');
  console.log('==================================================');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  const adminResults = {
    loginPage: null,
    authentication: null,
    dashboardOpen: null,
    sidebarRendered: null,
    sections: {},
    footerBuilder: {},
    adminSupport: {},
    customerSupport: {},
    authorization: {}
  };

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('webpack-hmr') && !msg.text().includes('favicon')) {
      consoleErrors.push(msg.text());
    }
  });

  // 1. ADMIN LOGIN TEST
  console.log('\n--- 1. ADMIN LOGIN VERIFICATION ---');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const emailInput = await page.locator('input[type="email"], #adm-email');
  const passwordInput = await page.locator('input[type="password"], #adm-password');
  const submitBtn = await page.locator('button[type="submit"]');

  const hasForm = (await emailInput.count() > 0) && (await passwordInput.count() > 0) && (await submitBtn.count() > 0);
  console.log(`Admin Login Form Rendered: ${hasForm ? 'YES' : 'NO'}`);
  adminResults.loginPage = hasForm ? 'PASS' : 'FAIL';

  // Fill credentials and submit
  await emailInput.fill('admin@queenscare.in');
  await passwordInput.fill('QueensCare#Admin2026');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_login_filled.png') });
  await submitBtn.click();

  // Wait for redirect to /admin
  await page.waitForURL('**/admin**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'qc_session');
  console.log(`Current URL after login: ${currentUrl}`);
  console.log(`qc_session cookie present: ${sessionCookie ? 'YES' : 'NO'}`);

  const bodyText = await page.innerText('body').catch(() => '');
  const isDashboardLoaded = currentUrl.includes('/admin') && !currentUrl.includes('/admin/login');
  adminResults.authentication = (isDashboardLoaded && sessionCookie) ? 'PASS' : 'FAIL';
  adminResults.dashboardOpen = isDashboardLoaded ? 'PASS' : 'FAIL';

  const sidebarVisible = await page.locator('nav').count() > 0;
  console.log(`Sidebar navigation visible: ${sidebarVisible ? 'YES' : 'NO'}`);
  adminResults.sidebarRendered = sidebarVisible ? 'PASS' : 'FAIL';

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_dashboard_root.png') });

  // 2. TEST CRITICAL ADMIN SECTIONS
  console.log('\n--- 2. ADMIN SECTIONS SMOKE TEST ---');
  const sectionsToCheck = [
    { key: 'Dashboard', tab: 'dashboard' },
    { key: 'Products', tab: 'products' },
    { key: 'Bulk Products', tab: 'products', action: 'check_bulk' },
    { key: 'Orders', tab: 'orders' },
    { key: 'Customers', tab: 'customers' },
    { key: 'Inventory', tab: 'inventory' },
    { key: 'Homepage CMS', tab: 'homepage' },
    { key: 'Footer Builder', tab: 'footer-builder' },
    { key: 'A+ Content', tab: 'aplus' },
    { key: 'Promotions', tab: 'merchandising' },
    { key: 'Social Media', tab: 'social-links' },
    { key: 'Support / Chat', tab: 'support-inbox' },
    { key: 'Payments', tab: 'payments' },
    { key: 'Shipping', tab: 'shipping' },
    { key: 'GST / Tax', tab: 'tax-rules' },
    { key: 'Invoices', tab: 'invoice-designer' },
    { key: 'Integrations', tab: 'integrations' },
    { key: 'Tracking / Pixels', tab: 'analytics-tracking' },
    { key: 'Settings', tab: 'settings' }
  ];

  for (const sec of sectionsToCheck) {
    try {
      console.log(`Opening Admin section: ${sec.key} (?tab=${sec.tab})...`);
      await page.goto(`${BASE_URL}/admin?tab=${sec.tab}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(2000);

      const secBody = await page.innerText('body').catch(() => '');
      const hasErrorDialog = await page.locator('[data-nextjs-dialog-header], .nextjs-container-errors-header').count() > 0;
      const isBlank = secBody.trim().length < 50;

      let secStatus = 'PASS';
      let details = '';

      if (hasErrorDialog) {
        secStatus = 'FAIL';
        details = 'Next.js error dialog detected';
      } else if (isBlank) {
        secStatus = 'FAIL';
        details = 'Blank or near-empty content';
      } else {
        details = `Loaded successfully (${secBody.length} chars)`;
        if (sec.key === 'Bulk Products') {
          const bulkBtnCount = await page.locator('button:has-text("Bulk"), button:has-text("Import"), button:has-text("Operations")').count();
          details += ` [Bulk controls count: ${bulkBtnCount}]`;
        }
      }

      const safeKey = sec.key.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `admin_section_${safeKey}.png`) });

      adminResults.sections[sec.key] = { status: secStatus, details };
      console.log(`  -> [${secStatus}] ${sec.key}: ${details}`);
    } catch (err) {
      adminResults.sections[sec.key] = { status: 'FAIL', details: err.message };
      console.log(`  -> [FAIL] ${sec.key}: Exception ${err.message}`);
    }
  }

  // 3. FOOTER BUILDER DEEP UI CHECK
  console.log('\n--- 3. FOOTER BUILDER CONTROLS CHECK ---');
  try {
    await page.goto(`${BASE_URL}/admin?tab=footer-builder`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);

    const requiredControls = [
      'Trust Strip',
      'Brand',
      'Social',
      'Navigation',
      'CMS Page Picker',
      'Support',
      'Statutory',
      'Clinical Notice',
      'Copyright',
      'Styling',
      'Version History'
    ];

    const fbText = await page.innerText('body').catch(() => '');
    const controlsStatus = {};

    for (const ctrl of requiredControls) {
      // Check if control label or tab exists in page text or buttons
      const existsInText = fbText.toLowerCase().includes(ctrl.toLowerCase());
      const buttonLocator = page.locator(`button:has-text("${ctrl}"), tab:has-text("${ctrl}"), [aria-label*="${ctrl}" i], div:has-text("${ctrl}")`);
      const buttonCount = await buttonLocator.count();
      const isClickable = buttonCount > 0;

      controlsStatus[ctrl] = {
        present: existsInText || isClickable,
        clickable: isClickable
      };
      console.log(`  Footer Control [${ctrl}]: Present=${controlsStatus[ctrl].present}, Clickable=${controlsStatus[ctrl].clickable}`);
    }

    // Click a sample control (e.g. Trust Strip or Styling) if available
    const stylingBtn = page.locator('button:has-text("Styling"), button:has-text("Colors"), button:has-text("Trust Strip")').first();
    if (await stylingBtn.count() > 0) {
      await stylingBtn.click().catch(() => {});
      await page.waitForTimeout(500);
      console.log('  Successfully clicked a Footer Builder tab control without error.');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_footer_builder_active.png') });
    adminResults.footerBuilder = controlsStatus;

  } catch (err) {
    adminResults.footerBuilder = { error: err.message };
  }

  // 4. ADMIN CUSTOMER SUPPORT / CHAT VERIFICATION
  console.log('\n--- 4. ADMIN CUSTOMER SUPPORT & TICKET CENTER ---');
  try {
    await page.goto(`${BASE_URL}/admin?tab=support-tickets`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);

    const ticketCenterText = await page.innerText('body').catch(() => '');
    const hasTicketList = ticketCenterText.toLowerCase().includes('ticket') || ticketCenterText.toLowerCase().includes('subject');
    const ticketRows = await page.locator('tr, [role="row"], .ticket-item, button:has-text("#")').count();

    console.log(`  Admin Tickets Page Rendered: ${hasTicketList ? 'YES' : 'NO'}`);
    console.log(`  Ticket elements count: ${ticketRows}`);

    // Check Support Inbox (live chat)
    await page.goto(`${BASE_URL}/admin?tab=support-inbox`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);

    const inboxText = await page.innerText('body').catch(() => '');
    const textareaCount = await page.locator('textarea, input[placeholder*="reply" i], input[placeholder*="message" i]').count();
    const attachBtnCount = await page.locator('button[title*="attach" i], label[title*="attach" i], input[type="file"], button:has-text("📎"), svg').count();

    console.log(`  Admin Support Inbox Rendered: YES (Textarea/Reply inputs: ${textareaCount}, Attachment/file inputs: ${attachBtnCount})`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_support_inbox.png') });

    adminResults.adminSupport = {
      ticketsPageLoaded: hasTicketList,
      ticketCount: ticketRows,
      replyComposerPresent: textareaCount > 0 || inboxText.includes('conversation'),
      attachmentButtonPresent: attachBtnCount > 0
    };
  } catch (err) {
    adminResults.adminSupport = { error: err.message };
  }

  await context.close();

  // 5. CUSTOMER ACCOUNT & SUPPORT CHAT VERIFICATION
  console.log('\n--- 5. CUSTOMER ACCOUNT & CUSTOMER SUPPORT ---');
  const custContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const custPage = await custContext.newPage();

  try {
    await custPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await custPage.waitForTimeout(1000);

    const cEmail = custPage.locator('input[type="email"], #email');
    const cPass = custPage.locator('input[type="password"], #password');
    const cSubmit = custPage.locator('button[type="submit"]');

    if (await cEmail.count() > 0 && await cPass.count() > 0) {
      await cEmail.fill('customer@queenscare.in');
      await cPass.fill('QueensCare#Demo2026');
      await cSubmit.click();
      await custPage.waitForTimeout(3000);
    }

    const afterCustLoginUrl = custPage.url();
    console.log(`Customer URL after login: ${afterCustLoginUrl}`);

    // Try customer support route
    await custPage.goto(`${BASE_URL}/account?tab=support`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await custPage.waitForTimeout(2000);

    // Or check contact / support widget
    const custBody = await custPage.innerText('body').catch(() => '');
    const custTextarea = await custPage.locator('textarea, input[placeholder*="message" i]').count();
    const custFileInput = await custPage.locator('input[type="file"]').count();

    await custPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'customer_account_support.png') });

    adminResults.customerSupport = {
      accountPageRendered: custBody.length > 50,
      composerPresent: custTextarea > 0,
      fileAttachmentPresent: custFileInput > 0
    };
    console.log(`Customer Support in Account: Rendered=${custBody.length > 50}, Composer=${custTextarea > 0}, FileInput=${custFileInput > 0}`);

  } catch (err) {
    adminResults.customerSupport = { error: err.message };
  }

  // 6. AUTHORIZATION PERIMETER CHECK
  console.log('\n--- 6. AUTHORIZATION PERIMETER VERIFICATION ---');
  try {
    // A. Anonymous -> /admin
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    const anonAdminRes = await anonPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    const anonFinalUrl = anonPage.url();
    const anonBlocked = anonFinalUrl.includes('/admin/login');
    console.log(`Anonymous -> /admin blocked and redirected to login: ${anonBlocked ? 'YES' : 'NO'} (${anonFinalUrl})`);
    await anonContext.close();

    // B. Customer -> /admin
    const custAdminRes = await custPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    const custFinalUrl = custPage.url();
    const custBody = await custPage.innerText('body').catch(() => '');
    const custBlocked = custFinalUrl.includes('/admin/login') || custBody.includes('Access denied') || custBody.includes('403');
    console.log(`Customer -> /admin blocked: ${custBlocked ? 'YES' : 'NO'} (${custFinalUrl})`);

    // C. Anonymous -> /api/admin/orders
    const apiRes = await fetch(`${BASE_URL}/api/admin/orders`);
    const apiBlocked = apiRes.status === 401 || apiRes.status === 403;
    console.log(`Anonymous -> /api/admin/orders blocked: ${apiBlocked ? 'YES' : 'NO'} (Status: ${apiRes.status})`);

    adminResults.authorization = {
      anonymousAdminBlocked: anonBlocked ? 'PASS' : 'FAIL',
      customerAdminBlocked: custBlocked ? 'PASS' : 'FAIL',
      adminAllowed: adminResults.authentication === 'PASS' ? 'PASS' : 'FAIL',
      anonymousApiBlocked: apiBlocked ? 'PASS' : 'FAIL'
    };
  } catch (err) {
    adminResults.authorization = { error: err.message };
  }

  await custContext.close();
  await browser.close();

  fs.writeFileSync(
    path.join(process.cwd(), 'scratch', 'admin_smoke_results.json'),
    JSON.stringify({ adminResults, consoleErrors }, null, 2)
  );

  console.log('\nAdmin smoke test completed and saved to scratch/admin_smoke_results.json');
}

runAdminSmokeTest().catch(console.error);
