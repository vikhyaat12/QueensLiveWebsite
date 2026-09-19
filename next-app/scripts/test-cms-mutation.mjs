import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const DB_PATH = 'c:/Project/QueensCareWebsite/next-app/data/local-db.json';
const PROFILE_URL = 'http://localhost:3000/employee/sanjay-walia';

async function testCMSMutation() {
  console.log('🧪 Starting Dynamic CMS Mutation & Privacy Toggle Test...');

  const dbRaw = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(dbRaw);

  const sanjayIndex = db.employees.findIndex((e) => e.slug === 'sanjay-walia');
  if (sanjayIndex === -1) {
    throw new Error('Sanjay Walia not found in local-db.json');
  }

  const originalSanjay = JSON.parse(JSON.stringify(db.employees[sanjayIndex]));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // 1. Test Mutation
    console.log('\n✏️ [Test 1] Mutating heroSubtitle and heroQuote in CMS database...');
    db.employees[sanjayIndex].heroSubtitle = 'TEST: Global Pioneer & Chairman Emeritus';
    db.employees[sanjayIndex].heroQuote = 'TEST: Advancing Human Longevity Through Exacting Phytochemical Science';
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    await page.goto(PROFILE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const bodyText1 = await page.textContent('body');
    const mutationSubtitleSuccess = bodyText1.includes('TEST: Global Pioneer & Chairman Emeritus');
    const mutationQuoteSuccess = bodyText1.includes('TEST: Advancing Human Longevity Through Exacting Phytochemical Science');

    console.log(`  Mutation Subtitle Live Update: ${mutationSubtitleSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Mutation Quote Live Update: ${mutationQuoteSuccess ? '✅ PASS' : '❌ FAIL'}`);

    // 2. Test Privacy Toggle (Hiding Phone & Download PDF)
    console.log('\n🛡️ [Test 2] Testing Privacy Settings Toggle (hiding phone and download PDF)...');
    db.employees[sanjayIndex].privacySettings = {
      ...db.employees[sanjayIndex].privacySettings,
      showPhone: false,
      showDownloadPdf: false,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    await page.goto(PROFILE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const bodyText2 = await page.textContent('body');
    const phoneHidden = !bodyText2.includes('+91 98111 23456');
    const pdfHidden = !bodyText2.includes('Download Profile (PDF)');

    console.log(`  Privacy Phone Hidden: ${phoneHidden ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Privacy Download PDF Hidden: ${pdfHidden ? '✅ PASS' : '❌ FAIL'}`);

  } finally {
    // Revert original data
    console.log('\n🔄 Reverting original employee data in CMS database...');
    const currentDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    currentDb.employees[sanjayIndex] = originalSanjay;
    fs.writeFileSync(DB_PATH, JSON.stringify(currentDb, null, 2), 'utf-8');
    console.log('✅ Original data cleanly restored.');

    await browser.close();
  }
}

testCMSMutation().catch((err) => {
  console.error('Mutation test error:', err);
  process.exit(1);
});
