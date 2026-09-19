import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('data/local-db.json');
const PROFILE_URL = 'http://localhost:3000/employee/sanjay-walia';

async function test() {
  const rawDb = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(rawDb);
  const sIdx = db.employees.findIndex((e) => e.slug === 'sanjay-walia');
  const original = JSON.parse(JSON.stringify(db.employees[sIdx]));

  try {
    db.employees[sIdx].privacySettings = {
      ...db.employees[sIdx].privacySettings,
      showPhone: false,
      showDownloadPdf: false,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    // Wait 500ms for file timestamp
    await new Promise(r => setTimeout(r, 500));

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const text = await page.textContent('body');
    console.log('Includes "+91 88812 15329":', text.includes('+91 88812 15329'));
    console.log('Includes "Download Official Executive Credential PDF":', text.includes('Download Official Executive Credential PDF'));
    console.log('Includes "Download Profile (PDF)":', text.includes('Download Profile (PDF)'));

    const btn = await page.$('button:has-text("Download")');
    console.log('Any Download button found in DOM:', Boolean(btn));

    await browser.close();
  } finally {
    const curDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    curDb.employees[sIdx] = original;
    fs.writeFileSync(DB_PATH, JSON.stringify(curDb, null, 2), 'utf-8');
    console.log('Reverted');
  }
}
test();
