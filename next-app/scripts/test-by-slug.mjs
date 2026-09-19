import { readFileSync } from "fs";

const db = JSON.parse(readFileSync("data/local-db.json", "utf8"));
const found = db.products.filter(p => p.slug === "immune-care-plus" || p.id === "immune-care-plus");
console.log("Found in db.products:", found);

const redirect = db.redirects.filter(r => r.source === "/products/immune-care-plus");
console.log("Found in db.redirects:", redirect);
