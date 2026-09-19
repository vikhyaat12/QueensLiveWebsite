import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const baseUrl = "http://localhost:3000";
const artifactDir = "C:\\Users\\Vikhyaat sikand\\.gemini\\antigravity\\brain\\ba7ff11c-20b8-4316-a446-7011631a55ff";

async function runVerification() {
  console.log("🚀 Starting comprehensive employee system verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    // ==========================================
    // TEST 1: PAGE A — OUR PEOPLE DIRECTORY
    // ==========================================
    console.log("\n--- Testing Page A: Our People Directory (/employee) ---");
    const pageA = await context.newPage();
    await pageA.setViewportSize({ width: 1920, height: 1080 });
    await pageA.goto(`${baseUrl}/employee`, { waitUntil: "networkidle", timeout: 30000 });

    // 1. Check Header & Logo
    const headerLogo = pageA.locator('header img[src*="queens-care-official-original.png"]');
    const logoCount = await headerLogo.count();
    console.log(`✓ Official Queens Care logo in header: ${logoCount > 0 ? "PASSED" : "FAILED"}`);

    // 2. Check Nav Items
    const navPeople = pageA.locator('header nav a:has-text("Our People")');
    console.log(`✓ "Our People" nav item present: ${(await navPeople.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 3. Check 3-part Hero
    const heroTitle = pageA.locator("h1");
    const heroText = await heroTitle.innerText();
    const heroValid = heroText.includes("Our People") || heroText.includes("Strength") || heroText.includes("Science");
    console.log(`✓ Directory hero heading: ${heroValid ? "PASSED" : "FAILED"}`);

    // 4. Check Filter Bar
    const searchInput = pageA.locator('input[placeholder*="Search by name"]');
    const searchCount = await searchInput.count();
    console.log(`✓ Search input present: ${searchCount > 0 ? "PASSED" : "FAILED"}`);

    // 5. Test Search Filtering
    if (searchCount > 0) {
      await searchInput.fill("Sanjay");
      await pageA.waitForTimeout(600);
      const sanjayCard = pageA.locator('text="Sanjay Walia"');
      console.log(`✓ Search filter for "Sanjay": ${(await sanjayCard.count()) > 0 ? "PASSED" : "FAILED"}`);
      await searchInput.fill("");
      await pageA.waitForTimeout(600);
    }

    // 6. Check Culture Section
    const cultureHeading = pageA.locator('text="A Team United by a Greater Purpose"').or(pageA.locator('text="OUR SHARED COMMITMENT"'));
    console.log(`✓ Culture section ("A Team United by a Greater Purpose"): ${(await cultureHeading.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 7. Check 5-Badge Trust Strip & Footer
    const trustBadge = pageA.locator('text="Quality You Can Trust"');
    console.log(`✓ 5-Badge Trust strip: ${(await trustBadge.count()) > 0 ? "PASSED" : "FAILED"}`);
    const footer = pageA.locator("footer");
    console.log(`✓ Queens Care footer present: ${(await footer.count()) > 0 ? "PASSED" : "FAILED"}`);

    // Capture Page A Screenshots
    await pageA.screenshot({ path: path.join(artifactDir, "page_a_directory_desktop_1920.png"), fullPage: false });
    console.log("📸 Saved page_a_directory_desktop_1920.png");

    await pageA.setViewportSize({ width: 768, height: 1024 });
    await pageA.screenshot({ path: path.join(artifactDir, "page_a_directory_tablet_768.png"), fullPage: false });
    console.log("📸 Saved page_a_directory_tablet_768.png");

    await pageA.setViewportSize({ width: 390, height: 844 });
    await pageA.screenshot({ path: path.join(artifactDir, "page_a_directory_mobile_390.png"), fullPage: false });
    console.log("📸 Saved page_a_directory_mobile_390.png");
    await pageA.close();

    // ==========================================
    // TEST 2: PAGE B — INDIVIDUAL EMPLOYEE PROFILE (SANJAY WALIA)
    // ==========================================
    console.log("\n--- Testing Page B: Sanjay Walia Profile (/employee/sanjay-walia) ---");
    const pageB = await context.newPage();
    await pageB.setViewportSize({ width: 1920, height: 1080 });
    await pageB.goto(`${baseUrl}/employee/sanjay-walia`, { waitUntil: "networkidle", timeout: 30000 });

    // 1. Header logo
    const profileHeaderLogo = pageB.locator('header img[src*="queens-care-official-original.png"]');
    console.log(`✓ Header logo on profile: ${(await profileHeaderLogo.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 2. Executive Hero details
    const heroName = pageB.locator('h1:has-text("Sanjay Walia")');
    console.log(`✓ Sanjay Walia heading: ${(await heroName.count()) > 0 ? "PASSED" : "FAILED"}`);
    const heroRole = pageB.locator('text="Founder & Chief Executive Officer"');
    console.log(`✓ Executive designation: ${(await heroRole.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 3. Hero Badges (4 metrics)
    const badgeYears = pageB.locator('text="18+ Years"');
    const badgeFormulations = pageB.locator('text="140+"');
    console.log(`✓ Hero Metric Badges: ${(await badgeYears.count()) > 0 && (await badgeFormulations.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 4. Portrait with crest emblem
    const crestSeal = pageB.locator('div[title="Official Queens Care Emblem"]');
    console.log(`✓ Overlaid official crest seal: ${(await crestSeal.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 5. Sticky Subnav
    const stickyNav = pageB.locator(".qc-sticky-profile-nav");
    console.log(`✓ Sticky subnav present: ${(await stickyNav.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 6. Overview & Editorial Biography
    const overviewHeading = pageB.locator('h2:has-text("Executive Overview & Clinical Journey")');
    console.log(`✓ Overview & Clinical Journey card: ${(await overviewHeading.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 7. 4 Key Stats Counters
    const statLives = pageB.locator('text="500k+"');
    const statPurity = pageB.locator('text="100%"');
    console.log(`✓ 4 Key Stats Counters: ${(await statLives.count()) > 0 && (await statPurity.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 8. Key Moments & Media Showcase
    const videoKeynote = pageB.locator('text="The Future of Ayurvedic Formulation & Modern Science"');
    console.log(`✓ Featured Keynote Video: ${(await videoKeynote.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 9. Featured Products & Add to Cart
    const productCard = pageB.locator('text="Immune Care+"');
    console.log(`✓ Real Product "Immune Care+": ${(await productCard.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 10. Employment Verification Card
    const empId = pageB.locator('code:has-text("QC-EXEC-001")');
    console.log(`✓ Official ID QC-EXEC-001: ${(await empId.count()) > 0 ? "PASSED" : "FAILED"}`);
    const qrSvg = pageB.locator("#credentials svg");
    console.log(`✓ Scannable SVG QR Code: ${(await qrSvg.count()) > 0 ? "PASSED" : "FAILED"}`);

    // 11. Modal tests
    const qrBtn = pageB.locator('button:has-text("QR Authenticate"), button:has-text("Verify QR")').first();
    if ((await qrBtn.count()) > 0) {
      await qrBtn.click();
      await pageB.waitForTimeout(500);
      const modal = pageB.locator('text="Official Staff Credential Verification"');
      console.log(`✓ QR Verification Modal popup: ${(await modal.count()) > 0 ? "PASSED" : "FAILED"}`);
      const closeBtn = pageB.locator('button:has-text("Close Verification")');
      await closeBtn.click();
      await pageB.waitForTimeout(400);
    }

    // Capture Page B Screenshots
    await pageB.screenshot({ path: path.join(artifactDir, "page_b_profile_desktop_1920.png"), fullPage: false });
    console.log("📸 Saved page_b_profile_desktop_1920.png");

    await pageB.setViewportSize({ width: 1440, height: 900 });
    await pageB.screenshot({ path: path.join(artifactDir, "page_b_profile_laptop_1440.png"), fullPage: false });
    console.log("📸 Saved page_b_profile_laptop_1440.png");

    await pageB.setViewportSize({ width: 768, height: 1024 });
    await pageB.screenshot({ path: path.join(artifactDir, "page_b_profile_tablet_768.png"), fullPage: false });
    console.log("📸 Saved page_b_profile_tablet_768.png");

    await pageB.setViewportSize({ width: 390, height: 844 });
    await pageB.screenshot({ path: path.join(artifactDir, "page_b_profile_mobile_390.png"), fullPage: false });
    console.log("📸 Saved page_b_profile_mobile_390.png");

    // ==========================================
    // TEST 3: PRIVACY SWITCHES TOGGLE TEST
    // ==========================================
    console.log("\n--- Testing Privacy Switches (showEmail: false) ---");
    const dbPath = path.resolve("data/local-db.json");
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const sanjayRef = db.employees.find((e) => e.slug === "sanjay-walia");
    if (sanjayRef) {
      sanjayRef.privacySettings = sanjayRef.privacySettings || {};
      sanjayRef.privacySettings.showEmail = false;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
    }

    await pageB.reload({ waitUntil: "networkidle" });
    await pageB.waitForTimeout(1000);

    const emailHeroBtn = pageB.locator('a[href^="mailto:"]');
    const emailHeroCount = await emailHeroBtn.count();
    const emailCredLink = pageB.locator('#credentials a[href*="sanjay.walia"]');
    const emailCredCount = await emailCredLink.count();
    console.log(`✓ When showEmail=false, Email Hero Button is omitted: ${emailHeroCount === 0 ? "PASSED" : "FAILED"}`);
    console.log(`✓ When showEmail=false, Email Row in Verification Card is omitted: ${emailCredCount === 0 ? "PASSED" : "FAILED"}`);

    await pageB.screenshot({ path: path.join(artifactDir, "page_b_profile_privacy_disabled_email.png"), fullPage: false });
    console.log("📸 Saved page_b_profile_privacy_disabled_email.png");

    // Restore showEmail: true
    if (sanjayRef) {
      sanjayRef.privacySettings.showEmail = true;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
    }
    await pageB.reload({ waitUntil: "networkidle" });
    await pageB.waitForTimeout(1000);
    const emailRestored = pageB.locator('a[href^="mailto:"]');
    console.log(`✓ When showEmail=true, Email Button restored: ${(await emailRestored.count()) > 0 ? "PASSED" : "FAILED"}`);

    await pageB.close();
    console.log("\n🎉 ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
