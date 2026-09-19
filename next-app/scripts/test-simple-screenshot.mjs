import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff';

async function main() {
  console.log('Testing simple screenshot on http://localhost:3000/employee/sanjay-walia ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('Navigating...');
  const t0 = Date.now();
  const resp = await page.goto('http://localhost:3000/employee/sanjay-walia', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log(`Navigation finished in ${Date.now() - t0}ms, status:`, resp?.status());

  await page.waitForTimeout(2000);
  const shotPath = path.join(ARTIFACT_DIR, 'test_live_sanjay.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Screenshot saved to:', shotPath);

  const title = await page.title();
  console.log('Page Title:', title);

  const bodyText = await page.textContent('body');
  console.log('Body length:', bodyText.length);
  console.log('Contains "FOUNDER & CHAIRMAN":', bodyText.includes('FOUNDER & CHAIRMAN'));
  console.log('Contains "Sanjay Walia":', bodyText.includes('Sanjay Walia'));

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
