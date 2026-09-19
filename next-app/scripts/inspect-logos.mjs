import fs from 'fs';
import path from 'path';

const files = [
  'C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/.user_uploaded/media_1788794764421.png',
  'c:/Project/QueensCareWebsite/next-app/public/images/brand/queens-care-official-original.png',
  'c:/Project/QueensCareWebsite/next-app/public/images/brand/queens-care-logo-original.png',
  'c:/Project/QueensCareWebsite/next-app/public/images/brand/queens-care-horizontal-gold.png',
  'c:/Project/QueensCareWebsite/next-app/public/images/brand/queens-care-crest.png',
];

for (const f of files) {
  if (fs.existsSync(f)) {
    const stat = fs.statSync(f);
    console.log(`${path.basename(f)}: size=${stat.size} bytes, path=${f}`);
  } else {
    console.log(`${path.basename(f)}: NOT FOUND`);
  }
}
