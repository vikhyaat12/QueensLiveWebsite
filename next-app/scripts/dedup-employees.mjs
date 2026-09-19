import fs from "fs";
import path from "path";

const dbPath = path.resolve("data/local-db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

const seen = new Set();
const unique = [];

// Sort by sortOrder so 1..12 reference members come in order
db.employees.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));

for (const emp of db.employees) {
  const normName = String(emp.name || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!seen.has(normName)) {
    seen.add(normName);
    unique.push(emp);
  }
}

console.log(`Deduplication complete: ${db.employees.length} -> ${unique.length} unique employees`);
db.employees = unique;
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
