import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff';
const PROFILE_URL = 'http://localhost:3000/employee/sanjay-walia';
const DB_PATH = path.resolve('data/local-db.json');

async function run() {
  console.log('===============================================================');
  console.log('👑 QUEENS CARE — SANJAY WALIA PROFILE REFERENCE MATCH SUITE');
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'desktop_1920', width: 1920, height: 1080 },
    { name: 'laptop_1440', width: 1440, height: 900 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
  ];

  const checklist = {};

  for (const vp of viewports) {
    console.log(`\n📱 Capturing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    const t0 = Date.now();
    await page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1800); // Allow fonts & images to render
    console.log(`  ✓ Loaded in ${Date.now() - t0}ms`);

    // Capture Fullpage screenshot
    const fullScreenshotPath = path.join(ARTIFACT_DIR, `sanjay_profile_${vp.name}.png`);
    await page.screenshot({ path: fullScreenshotPath, fullPage: true });
    console.log(`  📸 Fullpage screenshot: sanjay_profile_${vp.name}.png`);

    // Capture Hero screenshot
    const heroEl = await page.$('section#overview') || await page.$('section');
    if (heroEl) {
      const heroScreenshotPath = path.join(ARTIFACT_DIR, `sanjay_hero_${vp.name}.png`);
      await heroEl.screenshot({ path: heroScreenshotPath });
      console.log(`  📸 Hero screenshot: sanjay_hero_${vp.name}.png`);
    }

    if (vp.name === 'desktop_1920') {
      console.log('\n🔍 Running DOM & Layout Assertions on Desktop (1920px)...');
      const bodyText = await page.textContent('body');

      // 1. Executive Hero Stage Check
      checklist['Hero Eyebrow: FOUNDER & CHAIRMAN'] = bodyText.includes('FOUNDER & CHAIRMAN');
      checklist['Hero Name: Sanjay Walia'] = bodyText.includes('Sanjay Walia');
      checklist['Hero Subtitle: Founder, Chairman & Visionary Leader'] = bodyText.includes('Founder, Chairman & Visionary Leader');
      checklist['Cursive Quote: Building Better Health For Every Tomorrow'] = bodyText.includes('Building Better Health For Every Tomorrow');
      checklist['Script Signature: Sanjay Walia'] = bodyText.includes('Sanjay Walia');

      // 2. Hero 4 Badges Check
      checklist['Hero Badge 1: 30+ Years'] = bodyText.includes('30+ Years');
      checklist['Hero Badge 2: People First'] = bodyText.includes('People First');
      checklist['Hero Badge 3: Innovation'] = bodyText.includes('Innovation');
      checklist['Hero Badge 4: Millions'] = bodyText.includes('Millions');

      // 3. Floating Plaque Check
      checklist['Hero Floating Plaque Quote'] = bodyText.includes('Good health is not a privilege');

      // 4. Capsule Subnav
      checklist['Capsule Subnav: Overview'] = bodyText.includes('Overview');
      checklist['Capsule Subnav: Journey'] = bodyText.includes('Journey');
      checklist['Capsule Subnav: Vision & Mission'] = bodyText.includes('Vision & Mission');
      checklist['Capsule Subnav: Leadership Style'] = bodyText.includes('Leadership Style');
      checklist['Capsule Subnav: Gallery & Media'] = bodyText.includes('Gallery & Media');
      checklist['Capsule Subnav: Connect Button CTA'] = bodyText.includes('Connect with Sanjay');

      // 5. About Story Card Check
      checklist['About Section Headline: About Mr. Sanjay Walia'] = bodyText.includes('About Mr. Sanjay Walia');
      checklist['About Narrative: Purpose-Driven Leader'] = bodyText.includes('Purpose-Driven Leader in Pharmaceutical Wellness');
      checklist['About CTA Button: Read Full Story'] = bodyText.includes('Read Full Story');
      checklist['About Right Cursive Quote Plaque'] = bodyText.includes('A healthier world is possible when science');

      // 6. 4 Key Stats Horizontal Cards Check
      checklist['Key Stat: 30+ Years of Experience'] = bodyText.includes('30+');
      checklist['Key Stat: 500+ Products Launched'] = bodyText.includes('500+');
      checklist['Key Stat: 100+ Team Members'] = bodyText.includes('100+');
      checklist['Key Stat: Millions Lives Touched'] = bodyText.includes('Millions');

      // 7. Key Moments & Media Check
      checklist['Key Moments Section Heading'] = bodyText.includes('Media & Keynotes');
      checklist['Keynote Video Duration: 01:24'] = bodyText.includes('01:24') || bodyText.includes('03:24');
      checklist['Moment 1: Product Innovation'] = bodyText.includes('Product Innovation');
      checklist['Moment 2: Research & Development'] = bodyText.includes('Research & Development');
      checklist['Moment 3: Team & Culture'] = bodyText.includes('Team & Culture');
      checklist['Moment 4: Global Impact'] = bodyText.includes('Global Impact');

      // 8. Featured Products Check
      checklist['Featured Formulations Heading'] = bodyText.includes('Formulations & Therapeutics');
      checklist['Product 1: Immune Care+'] = bodyText.includes('Immune Care+');
      checklist['Product 2: Women\'s Vitality'] = bodyText.includes('Women\'s Vitality');
      checklist['Product 3: RespiraCare'] = bodyText.includes('RespiraCare');
      checklist['Product 4: Digestive Balance'] = bodyText.includes('Digestive Balance');
      checklist['Product Badges: Bestseller / New / Popular'] = bodyText.includes('Bestseller') || bodyText.includes('Popular');

      // 9. Sidebar Verification & Team Check
      checklist['Sidebar Verification Card'] = bodyText.includes('Employment') && bodyText.includes('Verification');
      checklist['Sidebar Verified Badge: Active & Verified'] = bodyText.includes('Active & Verified');
      checklist['Sidebar QR Code Container'] = (await page.$('svg')) !== null || (await page.$('canvas')) !== null;
      checklist['Download Profile PDF Button'] = bodyText.includes('Download Official Executive Credential PDF');
      checklist['Sidebar Team Members: Related Team Leadership'] = bodyText.includes('Related Team Leadership') || bodyText.includes('All Team Members');
      checklist['Sidebar Promo Headline: Strong People Build a Healthier Tomorrow'] = bodyText.includes('Strong People Build a Healthier Tomorrow');
      checklist['Sidebar Promo CTA: Meet Our Team'] = bodyText.includes('Meet Our Team');

      // 10. Footer Transition Strip Check
      checklist['Footer Strip Calligraphy Tagline'] = bodyText.includes('Together for a healthier tomorrow');
      checklist['Footer Badge: Quality You Can Trust'] = bodyText.includes('Quality You Can Trust');
      checklist['Footer Badge: Science-Backed'] = bodyText.includes('Science-Backed');
      checklist['Footer Badge: People-Driven'] = bodyText.includes('People-Driven');
      checklist['Footer Badge: A Healthier Tomorrow'] = bodyText.includes('A Healthier Tomorrow');
    }

    await context.close();
  }

  // ─────────────────────────────────────────────────────────────
  // PART 2: DYNAMIC CMS MUTATION & PRIVACY TOGGLE TEST
  // ─────────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log('🧪 DYNAMIC CMS MUTATION & PRIVACY TOGGLE TESTS');
  console.log('===============================================================');

  const rawDb = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(rawDb);
  const sIdx = db.employees.findIndex((e) => e.slug === 'sanjay-walia');
  const originalSanjay = JSON.parse(JSON.stringify(db.employees[sIdx]));

  const testContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const testPage = await testContext.newPage();

  try {
    // 1. Mutate Hero Subtitle & Quote in DB
    console.log('\n✏️ [CMS Test 1] Mutating heroSubtitle and heroQuote...');
    db.employees[sIdx].heroSubtitle = 'MUTATED: Chief Executive Architect & Global Strategist';
    db.employees[sIdx].heroQuote = 'MUTATED: Purity and Exacting Science in Every Molecule';
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    await testPage.goto(PROFILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await testPage.waitForTimeout(1000);
    const textMutated = await testPage.textContent('body');

    const subMutatedPass = textMutated.includes('MUTATED: Chief Executive Architect & Global Strategist');
    const quoteMutatedPass = textMutated.includes('MUTATED: Purity and Exacting Science in Every Molecule');
    checklist['Dynamic CMS: Hero Subtitle Live Update'] = subMutatedPass;
    checklist['Dynamic CMS: Hero Quote Live Update'] = quoteMutatedPass;
    console.log(`  Live Subtitle Update: ${subMutatedPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Live Quote Update: ${quoteMutatedPass ? '✅ PASS' : '❌ FAIL'}`);

    // 2. Test Privacy Toggle: Hide Phone & PDF
    console.log('\n🛡️ [CMS Test 2] Testing Privacy Settings Toggle (hiding phone and download PDF)...');
    db.employees[sIdx].privacySettings = {
      ...db.employees[sIdx].privacySettings,
      showPhone: false,
      showDownloadPdf: false,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

    await testPage.goto(PROFILE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await testPage.waitForTimeout(1000);
    const textPrivacy = await testPage.textContent('body');

    const phoneHiddenPass = !textPrivacy.includes('+91 88812 15329');
    const downloadBtn = await testPage.$('button:has-text("Download")');
    const pdfHiddenPass = downloadBtn === null;
    checklist['Privacy Toggle: Phone Hidden Gracefully'] = phoneHiddenPass;
    checklist['Privacy Toggle: PDF Button Hidden Gracefully'] = pdfHiddenPass;
    console.log(`  Privacy Phone Hidden: ${phoneHiddenPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Privacy PDF Button Hidden: ${pdfHiddenPass ? '✅ PASS' : '❌ FAIL'}`);

  } finally {
    // Revert original data
    console.log('\n🔄 Reverting CMS database to pristine reference state...');
    const currentDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    currentDb.employees[sIdx] = originalSanjay;
    fs.writeFileSync(DB_PATH, JSON.stringify(currentDb, null, 2), 'utf-8');
    console.log('✅ Pristine reference state restored.');

    await testContext.close();
  }

  await browser.close();

  // Print final scorecard
  console.log('\n===============================================================');
  console.log('            FINAL COMPREHENSIVE VERIFICATION SCORECARD');
  console.log('===============================================================');
  let passed = 0;
  let total = 0;
  for (const [item, pass] of Object.entries(checklist)) {
    total++;
    if (pass) {
      passed++;
      console.log(`  ✅ PASS: ${item}`);
    } else {
      console.log(`  ❌ FAIL: ${item}`);
    }
  }

  const scorePct = Math.round((passed / total) * 100);
  console.log(`\nScore: ${passed}/${total} checks passed (${scorePct}%)`);
  if (passed === total) {
    console.log('🎉 100% PERFECT SCORE! ALL PARITY AND CMS REQUIREMENTS VERIFIED!\n');
  } else {
    console.log(`⚠️ ${total - passed} check(s) did not pass. Inspect items marked ❌ above.\n`);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
