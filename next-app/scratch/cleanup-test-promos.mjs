import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'local-db.json');
const raw = readFileSync(DB_PATH, 'utf-8');
const db = JSON.parse(raw);

if (Array.isArray(db.promotions)) {
  const before = db.promotions.length;
  db.promotions = db.promotions.filter(p => {
    if (p.name === 'Updated Immunity Ticker') return false;
    if (p.name?.includes('Test')) return false;
    if (p.id?.startsWith('promo-test')) return false;
    return true;
  });
  console.log(`Cleaned promotions: ${before} -> ${db.promotions.length}`);
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}
