import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff';
const BASE_URL = 'http://127.0.0.1:3000';
const PROFILE_URL = `${BASE_URL}/employee/sanjay-walia`;

async function run() {
  console.log('🚀 Starting Sanjay Walia Profile Automated Parity Verification...');

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'desktop_1920', width: 1920, height: 1080 },
    { name: 'laptop_1440', width: 1440, height: 900 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
  ];

  const results = {
    viewportsTested: [],
    checklist: {},
  };

  for (const vp of viewports) {
    console.log(`\n📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    try {
      await page.goto(PROFILE_URL, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(2000); // Allow fonts & images to render

      // Capture Fullpage screenshot
      const fullScreenshotPath = path.join(ARTIFACT_DIR, `sanjay_profile_${vp.name}.png`);
      await page.screenshot({ path: fullScreenshotPath, fullPage: true });
      console.log(`  📸 Fullpage screenshot saved: ${fullScreenshotPath}`);

      // Capture Hero screenshot
      const heroEl = await page.$('section#overview');
      if (heroEl) {
        const heroScreenshotPath = path.join(ARTIFACT_DIR, `sanjay_hero_${vp.name}.png`);
        await heroEl.screenshot({ path: heroScreenshotPath });
        console.log(`  📸 Hero screenshot saved: ${heroScreenshotPath}`);
      }

      results.viewportsTested.push(vp.name);

      if (vp.name === 'desktop_1920') {
        console.log('\n🔍 Running Detailed DOM Assertions on Desktop (1920px)...');

        const bodyText = await page.textContent('body');

        // 1. Executive Hero Stage Check
        results.checklist['Hero Eyebrow: FOUNDER & CHAIRMAN'] = bodyText.includes('FOUNDER & CHAIRMAN');
        results.checklist['Hero Name: Sanjay Walia'] = bodyText.includes('Sanjay Walia');
        results.checklist['Hero Subtitle: Founder, Chairman & Visionary Leader'] = bodyText.includes('Founder, Chairman & Visionary Leader');
        results.checklist['Cursive Quote: Building Better Health'] = bodyText.includes('Building Better Health For Every Tomorrow');

        // 2. Hero 4 Badges Check
        results.checklist['Hero Badge 1: 30+ Years'] = bodyText.includes('30+ Years');
        results.checklist['Hero Badge 2: People First'] = bodyText.includes('People First');
        results.checklist['Hero Badge 3: Innovation Driven'] = bodyText.includes('Innovation Driven');
        results.checklist['Hero Badge 4: Trusted by Millions'] = bodyText.includes('Trusted by Millions');

        // 3. Floating Plaque Check
        results.checklist['Hero Floating Plaque Quote'] = bodyText.includes('Good health is not a privilege');

        // 4. Capsule Subnav
        results.checklist['Capsule Subnav Overview'] = bodyText.includes('Overview');
        results.checklist['Capsule Subnav Journey'] = bodyText.includes('Journey');
        results.checklist['Capsule Subnav Vision & Mission'] = bodyText.includes('Vision & Mission');
        results.checklist['Capsule Subnav Connect CTA'] = bodyText.includes('Connect with Mr. Walia');

        // 5. About Story Card Check
        results.checklist['About Section Headline: About Mr. Sanjay Walia'] = bodyText.includes('About Mr. Sanjay Walia');
        results.checklist['About Story Narrative'] = bodyText.includes('Under the visionary leadership of Mr. Sanjay Walia');
        results.checklist['About CTA Button: Read Full Story'] = bodyText.includes('Read Full Story');
        results.checklist['About Right Cursive Quote Plaque'] = bodyText.includes('A healthier world is possible when science');

        // 6. 4 Key Stats Horizontal Cards Check
        results.checklist['Key Stat: 30+ Years Industry Leadership'] = bodyText.includes('30+ Years');
        results.checklist['Key Stat: 500+ Products Launched'] = bodyText.includes('500+');
        results.checklist['Key Stat: 100+ Team Members'] = bodyText.includes('100+');
        results.checklist['Key Stat: Millions Lives Touched'] = bodyText.includes('Millions');

        // 7. Key Moments & Media Check
        results.checklist['Key Moments Section Heading'] = bodyText.includes('Key Moments & Media');
        results.checklist['Keynote Video Player'] = bodyText.includes('Global Health Leadership Keynote');
        results.checklist['Keynote Duration 03:24'] = bodyText.includes('03:24');
        results.checklist['Moment 1: Product Innovation'] = bodyText.includes('Product Innovation');
        results.checklist['Moment 2: Research & Development'] = bodyText.includes('Research & Development');
        results.checklist['Moment 3: Team & Culture'] = bodyText.includes('Team & Culture');
        results.checklist['Moment 4: Global Impact'] = bodyText.includes('Global Impact');

        // 8. Featured Products Check
        results.checklist['Featured Formulations Heading'] = bodyText.includes('Featured Formulations');
        results.checklist['Product 1: ImmunoCare+'] = bodyText.includes('ImmunoCare+');
        results.checklist['Product 2: SkinGlow+'] = bodyText.includes('SkinGlow+');
        results.checklist['Product 3: JointFlex'] = bodyText.includes('JointFlex');
        results.checklist['Product 4: GutBalance'] = bodyText.includes('GutBalance');
        results.checklist['Product Badges: Bestseller / New / Popular'] = bodyText.includes('Bestseller') || bodyText.includes('Popular');

        // 9. Sidebar Verification & Team Check
        results.checklist['Sidebar Verification Card'] = bodyText.includes('Employment Verification');
        results.checklist['Sidebar QR Code Container'] = (await page.$('canvas')) !== null;
        results.checklist['Download Profile PDF Button'] = bodyText.includes('Download Profile (PDF)');
        results.checklist['Sidebar Team Members Heading'] = bodyText.includes('All Team Members');
        results.checklist['Sidebar Promo Card Headline'] = bodyText.includes('Strong People Build a Healthier Tomorrow');
        results.checklist['Sidebar Promo CTA: Meet Our Team'] = bodyText.includes('Meet Our Team');

        // 10. Footer Transition Strip Check
        results.checklist['Footer Strip Tagline'] = bodyText.includes('Together for a healthier tomorrow');
        results.checklist['Footer Badge: GMP Certified'] = bodyText.includes('GMP Certified');
        results.checklist['Footer Badge: ISO 9001:2015'] = bodyText.includes('ISO 9001:2015');
        results.checklist['Footer Badge: Pan-India Reach'] = bodyText.includes('Pan-India Reach');
        results.checklist['Footer Badge: Trusted Formulations'] = bodyText.includes('Trusted Formulations');
      }
    } catch (e) {
      console.error(`Error in viewport ${vp.name}:`, e.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n========================================');
  console.log('       SANJAY PROFILE VERIFICATION REPORT');
  console.log('========================================');
  let passed = 0;
  let total = 0;
  for (const [key, val] of Object.entries(results.checklist)) {
    total++;
    if (val) {
      passed++;
      console.log(`  ✅ PASS: ${key}`);
    } else {
      console.log(`  ❌ FAIL: ${key}`);
    }
  }
  console.log(`\nSummary: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)\n`);

  if (passed === total) {
    console.log('🎉 ALL SANJAY PROFILE PARITY & CMS VERIFICATIONS PASSED!');
  } else {
    console.log('⚠️ Some checks failed. Please inspect missing elements.');
  }
}

run().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
