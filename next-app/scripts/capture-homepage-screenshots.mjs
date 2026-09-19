import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Vikhyaat sikand\\.gemini\\antigravity\\brain\\ba7ff11c-20b8-4316-a446-7011631a55ff";

async function capture() {
  console.log("Launching headless Chromium...");
  const browser = await chromium.launch();

  // 1. Desktop Full HD 1920x1080
  console.log("Capturing 1920x1080 Desktop...");
  const page1920 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page1920.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 45000 });
  await page1920.waitForTimeout(3000);

  await page1920.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_1920_hero.png"), fullPage: false });
  await page1920.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_1920_full.png"), fullPage: true });
  console.log("Saved 1920 screenshots.");

  // Section closeups from 1920
  try {
    const heroEl = await page1920.$("section.hero");
    if (heroEl) await heroEl.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_hero_stage.png") });

    const trustEl = await page1920.$("section.trust-section");
    if (trustEl) await trustEl.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_trust_section.png") });

    const collectionEl = await page1920.$("section#collection");
    if (collectionEl) await collectionEl.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_collection_section.png") });

    const scienceEl = await page1920.$("section#science");
    if (scienceEl) await scienceEl.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_science_section.png") });

    const ritualEl = await page1920.$("section.ritual-reference-section");
    if (ritualEl) await ritualEl.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_ritual_section.png") });

    const consultEl = await page1920.$("section.ai-assistant-reference-banner");
    if (consultEl) await consultEl.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_assistant_section.png") });

    const journalEl = await page1920.$("section#journal");
    if (journalEl) await journalEl.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_journal_section.png") });

    const footerEl = await page1920.$("footer");
    if (footerEl) await footerEl.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_footer.png") });
  } catch (e) {
    console.warn("Could not capture some section closeups:", e.message);
  }
  await page1920.close();

  // 2. Desktop 1440x900
  console.log("Capturing 1440x900 Desktop...");
  const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page1440.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await page1440.waitForTimeout(2000);
  await page1440.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_desktop_hero.png"), fullPage: false });
  await page1440.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_desktop_full.png"), fullPage: true });
  await page1440.close();

  // 3. Tablet 768x1024
  console.log("Capturing 768x1024 Tablet...");
  const pageTablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await pageTablet.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await pageTablet.waitForTimeout(2000);
  await pageTablet.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_tablet_hero.png"), fullPage: false });
  await pageTablet.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_tablet_full.png"), fullPage: true });
  await pageTablet.close();

  // 4. Mobile 390x844 (iPhone 14/15 size)
  console.log("Capturing 390x844 Mobile...");
  const pageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pageMobile.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await pageMobile.waitForTimeout(2000);
  await pageMobile.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_mobile_hero.png"), fullPage: false });
  await pageMobile.screenshot({ path: path.join(ARTIFACT_DIR, "screenshot_mobile_full.png"), fullPage: true });
  await pageMobile.close();

  await browser.close();
  console.log("All multi-viewport screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
