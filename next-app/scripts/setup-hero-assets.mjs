import fs from "fs";
import path from "path";

const src = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/executive_hero_bg_1788790661406.jpg";
const destDir = path.resolve("public/images/hero");
const dest = path.join(destDir, "executive-library-bg.jpg");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log("Successfully copied executive-library-bg.jpg to public/images/hero!");
} else {
  console.error("Source file does not exist:", src);
}

// Also copy reference image to public/images/reference/sanjay-reference-master.jpg for safe asset access
const refSrc = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/.user_uploaded/media_1788789228289.jpg";
const refDestDir = path.resolve("public/images/reference");
if (!fs.existsSync(refDestDir)) {
  fs.mkdirSync(refDestDir, { recursive: true });
}
const refDest = path.join(refDestDir, "sanjay-reference-master.jpg");
if (fs.existsSync(refSrc)) {
  fs.copyFileSync(refSrc, refDest);
  console.log("Successfully copied sanjay-reference-master.jpg to public/images/reference!");
}
