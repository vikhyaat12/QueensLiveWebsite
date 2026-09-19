import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

async function run() {
  console.log("Preparing reference crops...");

  // 1. Copy generated executive library background
  const genSrc = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/executive_hero_bg_1788790661406.jpg";
  const heroDir = path.resolve("public/images/hero");
  if (!fs.existsSync(heroDir)) fs.mkdirSync(heroDir, { recursive: true });
  if (fs.existsSync(genSrc)) {
    fs.copyFileSync(genSrc, path.join(heroDir, "executive-library-bg.jpg"));
    console.log("Copied executive-library-bg.jpg");
  }

  // 2. Load reference image in Playwright to extract crops
  const refPath = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/.user_uploaded/media_1788789228289.jpg";
  if (!fs.existsSync(refPath)) {
    console.error("Reference image not found:", refPath);
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const refBase64 = fs.readFileSync(refPath).toString("base64");
  const dataUri = `data:image/jpeg;base64,${refBase64}`;

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;background:#000;">
        <img id="ref" src="${dataUri}" />
        <canvas id="c"></canvas>
      </body>
    </html>
  `);

  await page.waitForFunction(() => {
    const img = document.getElementById("ref");
    return img && img.complete && img.naturalWidth > 0;
  });

  const { naturalWidth, naturalHeight } = await page.evaluate(() => {
    const img = document.getElementById("ref");
    return { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
  });

  console.log(`Reference Image dimensions: ${naturalWidth} x ${naturalHeight}`);

  // In the reference image:
  // Top header: 0 to ~50px
  // Hero section: ~45px to ~445px (about 400px high in the full image)
  // Let's crop the exact hero backdrop (from top header down to before the subnav)
  // Hero area is approx y: 44px to y: 445px, x: 0 to 864px (or full width)
  const heroCropBase64 = await page.evaluate(({ nw, nh }) => {
    const img = document.getElementById("ref");
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");

    // Hero section runs roughly from 4% to 28% of total height
    const startY = Math.round(nh * 0.035); // skip top navbar
    const heroHeight = Math.round(nh * 0.25); // hero section

    canvas.width = nw;
    canvas.height = heroHeight;

    ctx.drawImage(img, 0, startY, nw, heroHeight, 0, 0, nw, heroHeight);
    return canvas.toDataURL("image/jpeg", 0.95);
  }, { nw: naturalWidth, nh: naturalHeight });

  const heroBuffer = Buffer.from(heroCropBase64.replace(/^data:image\/jpeg;base64,/, ""), "base64");
  fs.writeFileSync(path.join(heroDir, "sanjay-hero-reference-crop.jpg"), heroBuffer);
  console.log("Saved sanjay-hero-reference-crop.jpg, size:", heroBuffer.length);

  // Also crop the right-hand glowing Queens Care 3D emblem from the hero!
  const crestCropBase64 = await page.evaluate(({ nw, nh }) => {
    const img = document.getElementById("ref");
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");

    // The glowing gold Queens Care crest is located on the right of the hero
    // x: ~75% to 98%, y: ~5% to 15%
    const sx = Math.round(nw * 0.72);
    const sy = Math.round(nh * 0.05);
    const sw = Math.round(nw * 0.25);
    const sh = Math.round(nh * 0.12);

    canvas.width = sw;
    canvas.height = sh;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas.toDataURL("image/png");
  }, { nw: naturalWidth, nh: naturalHeight });

  const crestBuffer = Buffer.from(crestCropBase64.replace(/^data:image\/png;base64,/, ""), "base64");
  fs.writeFileSync(path.join(heroDir, "sanjay-hero-glowing-crest.png"), crestBuffer);
  console.log("Saved sanjay-hero-glowing-crest.png, size:", crestBuffer.length);

  // Also crop the bottom promo banner background (Strong People Build a Healthier Tomorrow)
  const promoCropBase64 = await page.evaluate(({ nw, nh }) => {
    const img = document.getElementById("ref");
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");

    // Promo banner is on the right sidebar near bottom
    // x: ~68% to 98%, y: ~81% to 89%
    const sx = Math.round(nw * 0.68);
    const sy = Math.round(nh * 0.81);
    const sw = Math.round(nw * 0.30);
    const sh = Math.round(nh * 0.095);

    canvas.width = sw;
    canvas.height = sh;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas.toDataURL("image/jpeg", 0.95);
  }, { nw: naturalWidth, nh: naturalHeight });

  const promoBuffer = Buffer.from(promoCropBase64.replace(/^data:image\/jpeg;base64,/, ""), "base64");
  fs.writeFileSync(path.join(heroDir, "sanjay-promo-card-bg.jpg"), promoBuffer);
  console.log("Saved sanjay-promo-card-bg.jpg, size:", promoBuffer.length);

  await browser.close();
  console.log("All reference crops prepared successfully!");
}

run().catch(console.error);
