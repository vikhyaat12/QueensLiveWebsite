import { chromium } from '@playwright/test';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

async function testCustomerSupport() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging into customer account...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@queenscare.in', password: 'QueensCare#Demo2026' })
    });
  });

  console.log('Navigating to customer /account...');
  await page.goto(`${BASE_URL}/account`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click Support Tickets
  const ticketsBtn = page.locator('button:has-text("Support Tickets")').first();
  console.log('Support tickets button count in account:', await ticketsBtn.count());
  if (await ticketsBtn.count() > 0) {
    await ticketsBtn.click();
    await page.waitForTimeout(2000);
  }

  const bodyText = await page.innerText('body');
  console.log('Body includes Support Tickets:', bodyText.includes('Support Tickets'));
  console.log('Body includes New Ticket:', bodyText.includes('New Ticket') || bodyText.includes('Create Ticket'));

  // Check file inputs
  const fileInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type="file"]')).map(i => ({
      accept: i.getAttribute('accept'),
      multiple: i.hasAttribute('multiple'),
      id: i.id || null
    }));
  });
  console.log('FILE INPUTS:', fileInputs);

  // Check if New Ticket button opens modal with message composer
  const newTicketBtn = page.locator('button:has-text("New Ticket"), button:has-text("+ Create Ticket"), button:has-text("Create Ticket")').first();
  if (await newTicketBtn.count() > 0) {
    console.log('Found New Ticket button, clicking...');
    await newTicketBtn.click();
    await page.waitForTimeout(1000);
    const modalText = await page.innerText('body');
    console.log('Modal includes Subject:', modalText.includes('Subject'));
    console.log('Modal includes Message:', modalText.includes('Message') || modalText.includes('Describe'));
  }

  await page.screenshot({ path: path.join(process.cwd(), 'scratch', 'smoke_screenshots', 'customer_support_active_verified.png') });
  console.log('Screenshot saved to scratch/smoke_screenshots/customer_support_active_verified.png');

  await browser.close();
}

testCustomerSupport().catch(console.error);
