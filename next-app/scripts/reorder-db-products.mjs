import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "data/local-db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

const targetOrder = [
  "p-ref-immune-care",
  "p-ref-womens-vitality",
  "p-ref-respiracare",
  "p-ref-digestive-balance",
  "p-ref-skinglow",
  "p-ref-bone-strength",
  "p-ref-heart-care",
  "p-ref-kids-immunity",
];

const refProducts = [];
const otherProducts = [];

for (const p of db.products) {
  if (targetOrder.includes(p.id)) {
    // We will place them in exact target order
  } else {
    otherProducts.push(p);
  }
}

for (const id of targetOrder) {
  const found = db.products.find((p) => p.id === id);
  if (found) {
    refProducts.push(found);
  }
}

db.products = [...refProducts, ...otherProducts];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
console.log("Successfully ordered reference products at top of local-db.json!");
