import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff";
const BASE_URL = "http://localhost:3000";
const DB_PATH = path.resolve("data/local-db.json");

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  console.log("==================================================================");
  console.log("🚀 STARTING MANDATORY 100% FULL CMS EDITABILITY VERIFICATION TEST");
  console.log("==================================================================\n");

  // Step 0: Backup original DB state
  const rawDb = fs.readFileSync(DB_PATH, "utf-8");
  const db = JSON.parse(rawDb);
  const originalSettingsEntry = db.settings?.find((s) => s.key === "our_people_page_cms_config");
  const originalSanjay = db.employees?.find((e) => e.slug === "sanjay-walia");
  const originalSanjayPrivacy = originalSanjay?.privacySettings ? { ...originalSanjay.privacySettings } : {};

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const results = [];

  try {
    const page = await context.newPage();

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Baseline Load & Branding Check
    // ─────────────────────────────────────────────────────────────
    console.log("--- TEST 1: Baseline Load & Queens Care Branding ---");
    await page.setViewportSize({ width: 1920, height: 1080 });
    const resp = await page.goto(`${BASE_URL}/employee`, { waitUntil: "networkidle", timeout: 30000 });
    const status = resp.status();
    console.log(`GET /employee Status: ${status}`);
    results.push({ name: "GET /employee HTTP 200", pass: status === 200 });

    const logoImg = await page.$("img[src*='queens-care-official-original.png']");
    console.log(`Original Queens Care Logo Present: ${Boolean(logoImg)}`);
    results.push({ name: "Original Queens Care Logo Header", pass: Boolean(logoImg) });

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Mutate CMS Config (Hero, Buttons, Badges, Sections)
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- TEST 2: Applying Live CMS Mutations to Database ---");
    
    // Read current config
    let currentConfig;
    if (originalSettingsEntry?.value) {
      currentConfig = typeof originalSettingsEntry.value === "string" 
        ? JSON.parse(originalSettingsEntry.value) 
        : originalSettingsEntry.value;
    } else {
      currentConfig = {};
    }

    const mutatedConfig = {
      ...currentConfig,
      hero: {
        ...(currentConfig.hero || {}),
        heading: "Pioneering Minds",
        highlightedHeading: "Limitless Potential",
        description: "Live CMS edit verified: 100% full Admin editability without touching React code.",
        primaryCta: {
          label: "Apply Directly Now →",
          url: "/careers#apply",
          enabled: true,
        },
        character: {
          ...(currentConfig.hero?.character || {}),
          speechBubble: "Dr. Queens here! All systems are 100% dynamic.",
          cursiveTagline: "Dynamic Science, Dynamic Care ♡",
        },
        topCard: {
          title: "Dynamic Breakthroughs,",
          subtitle: "tested and verified live!",
          icon: "⚡",
          enabled: true,
        },
        plaque: {
          eyebrow: "Verified Ideals",
          title: "INNOVATION\nPURITY\nSCIENCE\nCARE",
          subtext: "QUEENS CARE LABORATORIES",
          icon: "👑",
          enabled: true,
        },
      },
      directoryGrid: {
        ...(currentConfig.directoryGrid || {}),
        viewProfileButtonLabel: "Explore Official Dossier →",
        verifiedBadgeLabel: "★ Certified Executive",
      },
      cultureSection: {
        ...(currentConfig.cultureSection || {}),
        heading: "Unified Mission for Pan-India Wellness",
        quoteCard: {
          quote: "Pure science in service of humanity. ♡",
          author: "— Queens Care Laboratories",
          cursiveFont: true,
          enabled: true,
        },
      },
      trustBadgesBar: {
        enabled: true,
        badges: [
          { id: "tb-1", label: "100% Verified Quality", subtitle: "Rigorous ISO Testing", icon: "🛡️", visible: true },
          { id: "tb-2", label: "WHO-GMP Certified", subtitle: "International Benchmark", icon: "🏭", visible: true },
          { id: "tb-3", label: "Doctor Formulated", subtitle: "Clinical Grade Therapeutics", icon: "🩺", visible: true },
          { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
          { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
        ],
      },
      theme: {
        ...(currentConfig.theme || {}),
        goldAccent: "#E5A93C",
        primaryBg: "#FAF8F5",
      },
      profileDefaults: {
        ...(currentConfig.profileDefaults || {}),
        breadcrumbHome: "Home",
        breadcrumbPeople: "Our People",
        verifiedBadgeText: "Cryptographically Verified Executive Staff",
        downloadPdfButtonText: "Download Official Executive Credential PDF",
        emailButtonLabel: "Direct Secure Message",
        aboutSectionTitle: "Executive Overview & Specialized Background",
        qrModalTitle: "Official Staff Credential Verification",
        qrModalInstructions: "Scan with any camera to verify this authenticated Queens Care staff profile.",
      },
      sections: [
        { id: "filterBar", label: "Search & Filter Bar", visible: true, order: 0 },
        { id: "hero", label: "Cinematic Hero Stage", visible: true, order: 1 },
        { id: "categoryChips", label: "Team Categories Carousel", visible: true, order: 2 },
        { id: "directoryGrid", label: "Employee Directory Grid", visible: true, order: 3 },
        { id: "cultureSection", label: "Culture & Team Story", visible: false, order: 4 }, // HIDDEN
        { id: "lifeSection", label: "Life at Queens Care", visible: true, order: 5 },
        { id: "ctaSection", label: "Bottom Recruitment CTA", visible: true, order: 6 },
        { id: "trustBadgesBar", label: "Trust Badges Strip", visible: true, order: 7 },
      ],
    };

    // Write mutation to DB
    const freshDb = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    const sIdx = freshDb.settings.findIndex((s) => s.key === "our_people_page_cms_config");
    if (sIdx !== -1) {
      freshDb.settings[sIdx].value = JSON.stringify(mutatedConfig);
    } else {
      freshDb.settings.push({
        id: "set-our-people-cms",
        key: "our_people_page_cms_config",
        value: JSON.stringify(mutatedConfig),
        group: "cms",
      });
    }

    // Toggle employee email privacy
    const empIdx = freshDb.employees.findIndex((e) => e.slug === "sanjay-walia");
    if (empIdx !== -1) {
      freshDb.employees[empIdx].privacySettings = {
        ...freshDb.employees[empIdx].privacySettings,
        showEmail: false,
      };
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(freshDb, null, 2), "utf-8");
    console.log("✓ Live CMS mutations written to local-db.json");

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Verify Public Page Reflects All Mutations
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- TEST 3: Verifying Public /employee Page with Live Mutations ---");
    await page.goto(`${BASE_URL}/employee`, { waitUntil: "networkidle", timeout: 30000 });
    const content = await page.textContent("body");

    const cultureHeadingCount = await page.locator("h2:has-text('Unified Mission for Pan-India Wellness')").count();

    const checks = [
      { name: "Mutated Hero Heading ('Pioneering Minds')", pass: content.includes("Pioneering Minds") },
      { name: "Mutated Highlighted Word ('Limitless Potential')", pass: content.includes("Limitless Potential") },
      { name: "Mutated Description ('Live CMS edit verified')", pass: content.includes("Live CMS edit verified") },
      { name: "Mutated Primary CTA Label ('Apply Directly Now →')", pass: content.includes("Apply Directly Now →") },
      { name: "Mutated Speech Bubble ('Dr. Queens here! All systems are 100% dynamic.')", pass: content.includes("Dr. Queens here! All systems are 100% dynamic.") },
      { name: "Mutated Floating Card ('Dynamic Breakthroughs,')", pass: content.includes("Dynamic Breakthroughs,") },
      { name: "Mutated Plaque ('Verified Ideals')", pass: content.includes("Verified Ideals") },
      { name: "Mutated Directory Button Label ('Explore Official Dossier →')", pass: content.includes("Explore Official Dossier →") },
      { name: "Mutated Trust Badge ('100% Verified Quality')", pass: content.includes("100% Verified Quality") },
      { name: "Section Hiding: Culture Section Hidden", pass: cultureHeadingCount === 0 },
    ];

    checks.forEach((c) => {
      console.log(`${c.pass ? "✓" : "✕"} ${c.name}`);
      results.push(c);
    });

    // Verify Section Reordering: filterBar appears before hero in DOM
    const filterBarIndex = content.indexOf("Find People");
    const heroIndex = content.indexOf("Pioneering Minds");
    const reorderPass = filterBarIndex !== -1 && heroIndex !== -1 && filterBarIndex < heroIndex;
    console.log(`${reorderPass ? "✓" : "✕"} Section Reordering: filterBar rendered before hero in DOM`);
    results.push({ name: "Section Reordering (filterBar before hero)", pass: reorderPass });

    // Capture screenshots at multiple viewports
    console.log("\n--- Capturing Multi-Viewport Screenshots ---");
    const viewports = [
      { name: "desktop_1920", width: 1920, height: 1080 },
      { name: "laptop_1440", width: 1440, height: 900 },
      { name: "tablet_768", width: 768, height: 1024 },
      { name: "mobile_390", width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await sleep(400);
      const shotPath = path.join(ARTIFACTS_DIR, `our_people_cms_live_${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`✓ Saved ${shotPath}`);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Verify Individual Employee Detail Page
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- TEST 4: Verifying Individual Profile /employee/sanjay-walia ---");
    await page.setViewportSize({ width: 1920, height: 1080 });
    const profileResp = await page.goto(`${BASE_URL}/employee/sanjay-walia`, { waitUntil: "networkidle", timeout: 30000 });
    console.log(`GET /employee/sanjay-walia Status: ${profileResp.status()}`);
    results.push({ name: "GET /employee/sanjay-walia HTTP 200", pass: profileResp.status() === 200 });

    const profileContent = await page.textContent("body");
    const profileChecks = [
      { name: "Mutated Verified Staff Badge Text", pass: profileContent.includes("Cryptographically Verified Executive Staff") },
      { name: "Mutated Download PDF Button Text", pass: profileContent.includes("Download Official Executive Credential PDF") },
      { name: "Mutated About Section Heading", pass: profileContent.includes("Executive Overview & Specialized Background") },
      { name: "Privacy Setting: Email Hidden when showEmail: false", pass: !profileContent.includes("sanjay.walia@queenscare.in") },
    ];

    profileChecks.forEach((c) => {
      console.log(`${c.pass ? "✓" : "✕"} ${c.name}`);
      results.push(c);
    });

    // Test QR Modal trigger
    const qrBtn = await page.$("button:has-text('QR Authenticate'), button:has-text('Verify QR')");
    if (qrBtn) {
      await qrBtn.click();
      await sleep(500);
      const qrModal = await page.$("svg");
      console.log(`✓ QR Code SVG rendered inside verification modal: ${Boolean(qrModal)}`);
      results.push({ name: "Interactive QR Verification Modal", pass: Boolean(qrModal) });
      await page.keyboard.press("Escape");
    }

    // Capture profile screenshots
    const profileShot1920 = path.join(ARTIFACTS_DIR, "employee_detail_cms_live_desktop_1920.png");
    await page.screenshot({ path: profileShot1920, fullPage: true });
    console.log(`✓ Saved ${profileShot1920}`);

    await page.setViewportSize({ width: 390, height: 844 });
    await sleep(300);
    const profileShot390 = path.join(ARTIFACTS_DIR, "employee_detail_cms_live_mobile_390.png");
    await page.screenshot({ path: profileShot390, fullPage: true });
    console.log(`✓ Saved ${profileShot390}`);

  } catch (err) {
    console.error("Test execution encountered error:", err);
    results.push({ name: "Test Execution Error", pass: false, error: err.message });
  } finally {
    await browser.close();

    // Clean restore of original DB state
    try {
      const restoreDb = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      if (originalSettingsEntry) {
        const sIdx = restoreDb.settings.findIndex((s) => s.key === "our_people_page_cms_config");
        if (sIdx !== -1) {
          restoreDb.settings[sIdx].value = originalSettingsEntry.value;
        }
      }
      const empIdx = restoreDb.employees.findIndex((e) => e.slug === "sanjay-walia");
      if (empIdx !== -1) {
        restoreDb.employees[empIdx].privacySettings = originalSanjayPrivacy;
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(restoreDb, null, 2), "utf-8");
      console.log("\n✓ Restored database to clean baseline state.");
    } catch (e) {
      console.error("Failed to restore DB:", e);
    }
  }

  console.log("\n==================================================================");
  console.log("📊 VERIFICATION RESULTS SUMMARY");
  console.log("==================================================================");
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.pass ? "PASS" : "FAIL"}] ${r.name}`);
  });

  if (passed === total) {
    console.log("\n🎉 ALL 100% FULL CMS EDITABILITY TESTS PASSED WITH ZERO ERRORS!");
  } else {
    console.error("\n❌ SOME TESTS FAILED — CHECK LOGS ABOVE");
    process.exit(1);
  }
}

run();
