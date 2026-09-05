import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Vikhyaat sikand\\.gemini\\antigravity\\brain\\ba7ff11c-20b8-4316-a446-7011631a55ff";

async function capture() {
  const browser = await chromium.launch();
  
  // Desktop
  console.log("Capturing Desktop screenshot (1440x900)...");
  const pageDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageDesktop.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);
  
  const desktopHeroPath = path.join(ARTIFACT_DIR, "screenshot_desktop_hero.png");
  await pageDesktop.screenshot({ path: desktopHeroPath, fullPage: false });
  console.log("Saved:", desktopHeroPath);

  const desktopFullPath = path.join(ARTIFACT_DIR, "screenshot_desktop_full.png");
  await pageDesktop.screenshot({ path: desktopFullPath, fullPage: true });
  console.log("Saved:", desktopFullPath);
  await pageDesktop.close();

  // Mobile
  console.log("Capturing Mobile screenshot (375x812)...");
  const pageMobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await pageMobile.goto("http://localhost:3000/", { waitUntil: "networkidle", timeout: 30000 });
  await pageMobile.waitForTimeout(2000);

  const mobileHeroPath = path.join(ARTIFACT_DIR, "screenshot_mobile_hero.png");
  await pageMobile.screenshot({ path: mobileHeroPath, fullPage: false });
  console.log("Saved:", mobileHeroPath);

  const mobileFullPath = path.join(ARTIFACT_DIR, "screenshot_mobile_full.png");
  await pageMobile.screenshot({ path: mobileFullPath, fullPage: true });
  console.log("Saved:", mobileFullPath);
  await pageMobile.close();

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
