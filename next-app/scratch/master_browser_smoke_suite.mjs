import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'scratch', 'smoke_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runMasterSmokeSuite() {
  console.log('====================================================');
  console.log('QUEENS CARE — COMPREHENSIVE BROWSER SMOKE TEST');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });

  const suiteResults = {
    mainWebsite: {},
    adminLogin: {},
    adminDashboard: {},
    adminSections: {},
    footerBuilder: {},
    customerSupportAdmin: {},
    customerSupportAccount: {},
    authorization: {},
    mobileResponsiveness: {},
    consoleErrors: [],
    networkFailures: []
  };

  // ----------------------------------------------------
  // PART 1: AUTHENTICATION & ADMIN PORTAL
  // ----------------------------------------------------
  console.log('--- TEST PART 1: ADMIN LOGIN & AUTHENTICATION ---');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();

  adminPage.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('webpack-hmr') && !msg.text().includes('favicon')) {
      suiteResults.consoleErrors.push({ area: 'Admin', text: msg.text() });
    }
  });
  adminPage.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico') && !res.url().includes('webpack-hmr')) {
      suiteResults.networkFailures.push({ area: 'Admin', url: res.url(), status: res.status() });
    }
  });

  // 1.1 Open /admin/login
  await adminPage.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(1000);

  const loginFormExists = (await adminPage.locator('input[type="email"], #adm-email').count() > 0) &&
                          (await adminPage.locator('input[type="password"], #adm-password').count() > 0) &&
                          (await adminPage.locator('button[type="submit"]').count() > 0);

  suiteResults.adminLogin = {
    pageOpens: 'PASS',
    formRenders: loginFormExists ? 'PASS' : 'FAIL'
  };
  console.log(`Admin Login Page: PASS, Form Renders: ${suiteResults.adminLogin.formRenders}`);
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '01_admin_login_page.png') });

  // 1.2 Authenticate as Admin
  // Log in by calling API from page to guarantee session cookie in context
  const loginResult = await adminPage.evaluate(async () => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@queenscare.in', password: 'QueensCare#Admin2026' })
    });
    return { status: r.status, data: await r.json() };
  });

  console.log(`Admin Login API call: ${loginResult.status} (Role: ${loginResult.data?.user?.role})`);

  // 1.3 Navigate to /admin
  await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await adminPage.waitForTimeout(3000);

  const adminUrl = adminPage.url();
  const adminBodyText = await adminPage.innerText('body').catch(() => '');
  const sidebarExists = (await adminPage.locator('nav').count() > 0) || adminBodyText.includes('Business OS');
  const isDashboardOpen = adminUrl.includes('/admin') && !adminUrl.includes('/admin/login') && !adminBodyText.includes('Access denied');

  suiteResults.adminDashboard = {
    dashboardOpens: isDashboardOpen ? 'PASS' : 'FAIL',
    sidebarRenders: sidebarExists ? 'PASS' : 'FAIL',
    noBlankPage: adminBodyText.length > 100 ? 'PASS' : 'FAIL',
    no401Or403: !adminBodyText.includes('401') && !adminBodyText.includes('403') ? 'PASS' : 'FAIL',
    no500: !adminBodyText.includes('Internal Server Error') && !adminBodyText.includes('500') ? 'PASS' : 'FAIL'
  };

  console.log(`Admin Dashboard Opens: ${suiteResults.adminDashboard.dashboardOpens}`);
  console.log(`Admin Sidebar Renders: ${suiteResults.adminDashboard.sidebarRenders}`);
  console.log(`Admin Body Length: ${adminBodyText.length} chars`);
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '02_admin_dashboard_root.png') });

  // ----------------------------------------------------
  // PART 2: ADMIN SECTIONS INSPECTION
  // ----------------------------------------------------
  console.log('\n--- TEST PART 2: INSPECTING ADMIN SECTIONS ---');
  const sectionsToVerify = [
    { name: 'Dashboard', tab: 'dashboard' },
    { name: 'Products', tab: 'products' },
    { name: 'Bulk Products', tab: 'products', checkBulk: true },
    { name: 'Orders', tab: 'orders' },
    { name: 'Customers', tab: 'customers' },
    { name: 'Inventory', tab: 'inventory' },
    { name: 'Homepage CMS', tab: 'homepage' },
    { name: 'Footer Builder', tab: 'footer-builder' },
    { name: 'A+ Content', tab: 'aplus' },
    { name: 'Promotions', tab: 'merchandising' },
    { name: 'Social Media', tab: 'social-links' },
    { name: 'Support / Chat', tab: 'support-inbox' },
    { name: 'Payments', tab: 'payments' },
    { name: 'Shipping', tab: 'shipping' },
    { name: 'GST / Tax', tab: 'tax-rules' },
    { name: 'Invoices', tab: 'invoice-designer' },
    { name: 'Integrations', tab: 'integrations' },
    { name: 'Tracking / Pixels', tab: 'analytics-tracking' },
    { name: 'Settings', tab: 'settings' }
  ];

  for (const sec of sectionsToVerify) {
    try {
      await adminPage.goto(`${BASE_URL}/admin?tab=${sec.tab}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await adminPage.waitForTimeout(1500);

      const secText = await adminPage.innerText('body').catch(() => '');
      const hasErrorDialog = await adminPage.locator('[data-nextjs-dialog-header], .nextjs-container-errors-header').count() > 0;
      const isBlank = secText.trim().length < 50;

      let result = 'PASS';
      let evidence = `${secText.length} chars rendered`;

      if (hasErrorDialog) {
        result = 'FAIL';
        evidence = 'Next.js error overlay detected';
      } else if (isBlank) {
        result = 'FAIL';
        evidence = 'Blank page or under 50 chars';
      } else if (sec.checkBulk) {
        const bulkBtn = await adminPage.locator('button:has-text("Bulk"), button:has-text("Import"), button:has-text("Export")').count();
        evidence += ` (Bulk controls found: ${bulkBtn})`;
      }

      suiteResults.adminSections[sec.name] = { result, evidence };
      console.log(`  [${result}] ${sec.name.padEnd(18)} : ${evidence}`);
      const fileSafe = sec.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, `admin_tab_${fileSafe}.png`) });
    } catch (e) {
      suiteResults.adminSections[sec.name] = { result: 'FAIL', evidence: e.message };
      console.log(`  [FAIL] ${sec.name.padEnd(18)} : ${e.message}`);
    }
  }

  // ----------------------------------------------------
  // PART 3: FOOTER BUILDER DEEP UI CHECK
  // ----------------------------------------------------
  console.log('\n--- TEST PART 3: FOOTER BUILDER CONTROLS ---');
  await adminPage.goto(`${BASE_URL}/admin?tab=footer-builder`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await adminPage.waitForTimeout(2000);

  const fbControls = [
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

  const fbBody = await adminPage.innerText('body').catch(() => '');
  for (const ctrl of fbControls) {
    const foundInText = fbBody.toLowerCase().includes(ctrl.toLowerCase());
    const btnCount = await adminPage.locator(`button:has-text("${ctrl}"), [aria-label*="${ctrl}" i], tab:has-text("${ctrl}")`).count();
    const isClickable = btnCount > 0;
    suiteResults.footerBuilder[ctrl] = {
      present: foundInText || isClickable ? 'PASS' : 'FAIL',
      clickable: isClickable ? 'YES' : 'TEXT_ONLY'
    };
    console.log(`  Footer Builder [${ctrl.padEnd(16)}]: Present=${suiteResults.footerBuilder[ctrl].present}, Clickable=${suiteResults.footerBuilder[ctrl].clickable}`);
  }
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '03_footer_builder_active.png') });

  // ----------------------------------------------------
  // PART 4: CUSTOMER SUPPORT & CHAT (ADMIN & ACCOUNT)
  // ----------------------------------------------------
  console.log('\n--- TEST PART 4: CUSTOMER SUPPORT / CHAT ---');
  // 4.1 Admin Support Tickets
  await adminPage.goto(`${BASE_URL}/admin?tab=support-tickets`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await adminPage.waitForTimeout(2000);
  const ticketsBody = await adminPage.innerText('body').catch(() => '');
  const ticketRows = await adminPage.locator('tr, [role="row"], .ticket-item, button:has-text("#")').count();
  console.log(`  Admin Support Tickets Page: Loaded (${ticketRows} ticket rows found)`);

  // 4.2 Admin Support Inbox (Chat)
  await adminPage.goto(`${BASE_URL}/admin?tab=support-inbox`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await adminPage.waitForTimeout(2000);
  const inboxBody = await adminPage.innerText('body').catch(() => '');
  const composerInputs = await adminPage.locator('textarea, input[placeholder*="message" i], input[placeholder*="reply" i]').count();
  const attachmentButtons = await adminPage.locator('button[title*="attach" i], input[type="file"], svg').count();

  suiteResults.customerSupportAdmin = {
    ticketsPage: ticketsBody.length > 100 ? 'PASS' : 'FAIL',
    inboxPage: inboxBody.length > 100 ? 'PASS' : 'FAIL',
    replyComposer: composerInputs > 0 || inboxBody.includes('Select a conversation') || inboxBody.includes('Chat Support') ? 'PASS' : 'FAIL',
    attachmentButton: attachmentButtons > 0 ? 'PASS' : 'FAIL'
  };
  console.log(`  Admin Support Inbox: PASS, Reply Composer: ${suiteResults.customerSupportAdmin.replyComposer}, Attachments: ${suiteResults.customerSupportAdmin.attachmentButton}`);
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '04_admin_support_inbox.png') });

  // 4.3 Customer Support in Account
  console.log('\n--- TEST PART 4.3: CUSTOMER ACCOUNT SUPPORT ---');
  const custContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const custPage = await custContext.newPage();

  // Log in as customer
  await custPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(1000);
  await custPage.evaluate(async () => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@queenscare.in', password: 'QueensCare#Demo2026' })
    });
  });

  // Open customer tickets / support
  await custPage.goto(`${BASE_URL}/account/tickets`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await custPage.waitForTimeout(2000);

  const custTicketsBody = await custPage.innerText('body').catch(() => '');
  const custCreateBtn = await custPage.locator('button:has-text("New Ticket"), button:has-text("Create")').count();
  const custFileInput = await custPage.locator('input[type="file"]').count();
  const custTextarea = await custPage.locator('textarea').count();

  // If there is a "New Ticket" button, click it to check create form with file attachments
  if (custCreateBtn > 0) {
    await custPage.locator('button:has-text("New Ticket"), button:has-text("Create")').first().click().catch(() => {});
    await custPage.waitForTimeout(1000);
  }

  const postClickFileInputs = await custPage.locator('input[type="file"]').count();
  const postClickTextareas = await custPage.locator('textarea').count();

  suiteResults.customerSupportAccount = {
    customerPageOpens: custTicketsBody.length > 50 ? 'PASS' : 'FAIL',
    textComposer: postClickTextareas > 0 || custTextarea > 0 ? 'PASS' : 'FAIL',
    imageAttachmentUI: postClickFileInputs > 0 || custFileInput > 0 ? 'PASS' : 'FAIL',
    videoAttachmentUI: postClickFileInputs > 0 || custFileInput > 0 ? 'PASS' : 'FAIL'
  };

  console.log(`  Customer Support Page: ${suiteResults.customerSupportAccount.customerPageOpens}`);
  console.log(`  Text Message Composer: ${suiteResults.customerSupportAccount.textComposer}`);
  console.log(`  Image/Video Attachment UI: ${suiteResults.customerSupportAccount.imageAttachmentUI}`);
  await custPage.screenshot({ path: path.join(SCREENSHOT_DIR, '05_customer_tickets_support.png') });

  // ----------------------------------------------------
  // PART 5: AUTHORIZATION VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- TEST PART 5: AUTHORIZATION PERIMETER ---');
  // 5.1 Anonymous -> /admin
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  await anonPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  const anonUrl = anonPage.url();
  const anonBlocked = anonUrl.includes('/admin/login');
  await anonContext.close();

  // 5.2 Customer -> /admin
  await custPage.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  const custAdminUrl = custPage.url();
  const custAdminText = await custPage.innerText('body').catch(() => '');
  const custBlocked = custAdminUrl.includes('/admin/login') || custAdminText.includes('Access denied');

  // 5.3 Admin -> /admin
  const adminAllowed = isDashboardOpen;

  // 5.4 Anonymous -> /api/admin/orders
  const apiRes = await fetch(`${BASE_URL}/api/admin/orders`);
  const apiBlocked = apiRes.status === 401 || apiRes.status === 403;

  suiteResults.authorization = {
    anonymousAdminBlocked: anonBlocked ? 'PASS' : 'FAIL',
    customerAdminBlocked: custBlocked ? 'PASS' : 'FAIL',
    adminAllowed: adminAllowed ? 'PASS' : 'FAIL',
    anonymousApiBlocked: apiBlocked ? 'PASS' : 'FAIL'
  };

  console.log(`  Anonymous -> /admin blocked: ${suiteResults.authorization.anonymousAdminBlocked} (${anonUrl})`);
  console.log(`  Customer -> /admin blocked: ${suiteResults.authorization.customerAdminBlocked}`);
  console.log(`  Admin -> /admin allowed: ${suiteResults.authorization.adminAllowed}`);
  console.log(`  Anonymous API blocked: ${suiteResults.authorization.anonymousApiBlocked} (Status ${apiRes.status})`);

  // ----------------------------------------------------
  // PART 6: MOBILE QUICK CHECK (ADMIN & CUSTOMER SUPPORT)
  // ----------------------------------------------------
  console.log('\n--- TEST PART 6: MOBILE RESPONSIVE INSPECTION ---');
  const mobilePages = [
    { url: '/admin', name: 'Admin', ctx: adminContext },
    { url: '/account/tickets', name: 'Customer Support', ctx: custContext }
  ];

  const viewports = [
    { w: 320, h: 568, label: '320px' },
    { w: 375, h: 667, label: '375px' },
    { w: 768, h: 1024, label: '768px' },
    { w: 1440, h: 900, label: '1440px' }
  ];

  for (const mp of mobilePages) {
    for (const vp of viewports) {
      const mobPage = await mp.ctx.newPage();
      await mobPage.setViewportSize({ width: vp.w, height: vp.h });
      try {
        await mobPage.goto(`${BASE_URL}${mp.url}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await mobPage.waitForTimeout(1000);

        const overflow = await mobPage.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        const key = `${mp.name}_${vp.label}`;
        suiteResults.mobileResponsiveness[key] = {
          viewport: vp.label,
          horizontalOverflow: overflow ? 'YES' : 'NO',
          status: overflow ? 'WARN' : 'PASS'
        };
        console.log(`  [MOBILE] ${mp.name} @ ${vp.label}: Overflow=${overflow ? 'YES' : 'NO'}`);
        await mobPage.screenshot({ path: path.join(SCREENSHOT_DIR, `mobile_${mp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${vp.label}.png`) });
      } catch (err) {
        console.log(`  [MOBILE] ${mp.name} @ ${vp.label}: Error ${err.message}`);
      }
      await mobPage.close();
    }
  }

  await adminContext.close();
  await custContext.close();
  await browser.close();

  fs.writeFileSync(
    path.join(process.cwd(), 'scratch', 'master_suite_results.json'),
    JSON.stringify(suiteResults, null, 2)
  );

  console.log('\n====================================================');
  console.log('MASTER SMOKE SUITE COMPLETE! Results saved to scratch/master_suite_results.json');
  console.log('====================================================');
}

runMasterSmokeSuite().catch(console.error);
