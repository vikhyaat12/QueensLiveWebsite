import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/.user_uploaded/media_1788587830390.png";
const PROD_DIR = path.join(process.cwd(), "public", "images", "reference", "products");
const REF_DIR = path.join(process.cwd(), "public", "images", "reference");

if (!fs.existsSync(PROD_DIR)) fs.mkdirSync(PROD_DIR, { recursive: true });

async function run() {
  console.log("Preparing high-fidelity reference assets...");

  // 1. Eight Product Card Images (top image part of each card)
  const products = [
    { name: "prod-immune-care.png", left: 96, top: 240, width: 84, height: 65 },
    { name: "prod-womens-vitality.png", left: 181, top: 240, width: 84, height: 65 },
    { name: "prod-respiracare.png", left: 266, top: 240, width: 84, height: 65 },
    { name: "prod-digestive-balance.png", left: 351, top: 240, width: 84, height: 65 },
    { name: "prod-skinglow.png", left: 96, top: 350, width: 84, height: 65 },
    { name: "prod-bone-strength.png", left: 181, top: 350, width: 84, height: 65 },
    { name: "prod-heart-care.png", left: 266, top: 350, width: 84, height: 65 },
    { name: "prod-kids-immunity.png", left: 351, top: 350, width: 84, height: 65 },
  ];

  for (const p of products) {
    const outPath = path.join(PROD_DIR, p.name);
    await sharp(SOURCE)
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .resize(420, 325, { kernel: "lanczos3" })
      .toFile(outPath);
    console.log(`✓ Saved ${p.name}`);
  }

  // 2. Real Science Card Banner
  await sharp(SOURCE)
    .extract({ left: 95, top: 466, width: 341, height: 73 })
    .resize(1364, 292, { kernel: "lanczos3" })
    .toFile(path.join(REF_DIR, "real-science-card-reference.png"));
  console.log("✓ Saved real-science-card-reference.png");

  // 3. Four Life Stages Cards
  const ritualCards = [
    { name: "card-energy-reference.png", left: 12, top: 669, width: 103, height: 51 },
    { name: "card-sleep-reference.png", left: 119, top: 669, width: 103, height: 51 },
    { name: "card-skin-reference.png", left: 226, top: 669, width: 103, height: 51 },
    { name: "card-kids-reference.png", left: 333, top: 669, width: 103, height: 51 },
  ];

  for (const r of ritualCards) {
    await sharp(SOURCE)
      .extract({ left: r.left, top: r.top, width: r.width, height: r.height })
      .resize(412, 204, { kernel: "lanczos3" })
      .toFile(path.join(REF_DIR, r.name));
    console.log(`✓ Saved ${r.name}`);
  }

  // 4. Dr. Queens AI Assistant Banner
  await sharp(SOURCE)
    .extract({ left: 10, top: 733, width: 431, height: 74 })
    .resize(1724, 296, { kernel: "lanczos3" })
    .toFile(path.join(REF_DIR, "ai-assistant-banner-reference.png"));
  console.log("✓ Saved ai-assistant-banner-reference.png");

  console.log("All reference assets extracted and prepared successfully!");
}

run().catch(console.error);
