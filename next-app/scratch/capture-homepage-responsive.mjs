import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('c:/Project/QueensCareWebsite/next-app/node_modules/@playwright/test');

const OUT_DIR = 'C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/scratch/screenshots';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 },
  ];

  const consoleErrors = [];

  for (const vp of viewports) {
    console.log(`Capturing ${vp.name}...`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(`[${vp.name}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      consoleErrors.push(`[${vp.name} PAGEERROR] ${err.message}`);
    });

    try {
      await page.goto('http://127.0.0.1:3000', { waitUntil: 'commit', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      // Wait for products to load and splash screen to dismiss
      await page.waitForSelector('article[style*="border-radius"]', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2500);

      // Full page
      await page.screenshot({ path: path.join(OUT_DIR, `phase2-homepage-${vp.name}-full.png`), fullPage: true });

      // Viewport / Hero
      await page.screenshot({ path: path.join(OUT_DIR, `phase2-homepage-${vp.name}-hero.png`) });

      console.log(`Saved ${vp.name} screenshots`);
    } catch (err) {
      console.error(`Error on ${vp.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('--- CAPTURE FINISHED ---');
  if (consoleErrors.length > 0) {
    console.log('Console errors encountered:\n' + consoleErrors.join('\n'));
  } else {
    console.log('Zero console errors detected!');
  }
}

capture().catch(console.error);
