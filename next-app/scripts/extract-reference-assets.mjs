import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_IMAGE = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/.user_uploaded/media_1788587830390.png";
const OUTPUT_DIR = path.join(process.cwd(), "public", "images", "reference");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function extract() {
  console.log("Extracting assets from reference image...");
  const meta = await sharp(SOURCE_IMAGE).metadata();
  console.log(`Source image dimensions: ${meta.width} x ${meta.height}`);

  // 1. Dr. Queens Hero Character (with tablet & gesture)
  // X: 140 to 290, Y: 28 to 175
  await sharp(SOURCE_IMAGE)
    .extract({ left: 140, top: 25, width: 145, height: 145 })
    .toFile(path.join(OUTPUT_DIR, "dr-queens-hero.png"));
  console.log("✓ Extracted dr-queens-hero.png");

  // 2. Hero Product Bottle (Immune Support+)
  // X: 285 to 415, Y: 45 to 165
  await sharp(SOURCE_IMAGE)
    .extract({ left: 285, top: 40, width: 130, height: 130 })
    .toFile(path.join(OUTPUT_DIR, "hero-immune-bottle.png"));
  console.log("✓ Extracted hero-immune-bottle.png");

  // 3. Quiz Doctor Avatar (from sidebar filter card)
  // X: 25 to 80, Y: 495 to 535
  await sharp(SOURCE_IMAGE)
    .extract({ left: 25, top: 495, width: 60, height: 40 })
    .toFile(path.join(OUTPUT_DIR, "dr-queens-quiz-avatar.png"));
  console.log("✓ Extracted dr-queens-quiz-avatar.png");

  // 4. Science Section Visual (beaker & microscope)
  // X: 170 to 430, Y: 460 to 545
  await sharp(SOURCE_IMAGE)
    .extract({ left: 170, top: 460, width: 260, height: 85 })
    .toFile(path.join(OUTPUT_DIR, "science-beaker-microscope.png"));
  console.log("✓ Extracted science-beaker-microscope.png");

  // 5. Trust Globe (India 3D Earth)
  // X: 15 to 90, Y: 560 to 625
  await sharp(SOURCE_IMAGE)
    .extract({ left: 15, top: 560, width: 75, height: 65 })
    .toFile(path.join(OUTPUT_DIR, "trust-globe-india.png"));
  console.log("✓ Extracted trust-globe-india.png");

  // 6. AI Banner Dr. Queens Character
  // X: 75 to 200, Y: 720 to 798
  await sharp(SOURCE_IMAGE)
    .extract({ left: 75, top: 720, width: 125, height: 78 })
    .toFile(path.join(OUTPUT_DIR, "dr-queens-ai-banner.png"));
  console.log("✓ Extracted dr-queens-ai-banner.png");

  // 7. Life Stages 4 cards
  // Card 1: Energy (X: 20 to 120, Y: 660 to 715)
  await sharp(SOURCE_IMAGE)
    .extract({ left: 20, top: 660, width: 100, height: 55 })
    .toFile(path.join(OUTPUT_DIR, "wellness-energy.png"));

  // Card 2: Sleep (X: 125 to 225, Y: 660 to 715)
  await sharp(SOURCE_IMAGE)
    .extract({ left: 125, top: 660, width: 100, height: 55 })
    .toFile(path.join(OUTPUT_DIR, "wellness-sleep.png"));

  // Card 3: Skin (X: 230 to 330, Y: 660 to 715)
  await sharp(SOURCE_IMAGE)
    .extract({ left: 230, top: 660, width: 100, height: 55 })
    .toFile(path.join(OUTPUT_DIR, "wellness-skin.png"));

  // Card 4: Kids (X: 335 to 435, Y: 660 to 715)
  await sharp(SOURCE_IMAGE)
    .extract({ left: 335, top: 660, width: 100, height: 55 })
    .toFile(path.join(OUTPUT_DIR, "wellness-kids.png"));
  console.log("✓ Extracted 4 wellness life stage cards");

  // 8. Blog Cards
  // Blog 1: Doctor (X: 20 to 120, Y: 820 to 895)
  await sharp(SOURCE_IMAGE)
    .extract({ left: 20, top: 820, width: 100, height: 75 })
    .toFile(path.join(OUTPUT_DIR, "blog-science-doc.png"));

  // Blog 2: Gut (X: 125 to 225, Y: 820 to 895)
  await sharp(SOURCE_IMAGE)
    .extract({ left: 125, top: 820, width: 100, height: 75 })
    .toFile(path.join(OUTPUT_DIR, "blog-gut-health.png"));

  // Blog 3: Skin (X: 230 to 330, Y: 820 to 895)
  await sharp(SOURCE_IMAGE)
    .extract({ left: 230, top: 820, width: 100, height: 75 })
    .toFile(path.join(OUTPUT_DIR, "blog-skin-science.png"));
  console.log("✓ Extracted 3 blog cards");

  console.log("All reference assets extracted successfully!");
}

extract().catch((err) => {
  console.error("Extraction error:", err);
  process.exit(1);
});
