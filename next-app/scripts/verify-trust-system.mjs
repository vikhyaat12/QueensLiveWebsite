import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

console.log("=== QUEENS CARE TRUST & CREDIBILITY SYSTEM AUDIT ===");

// 1. Data Purity in local-db.json
console.log("\n[1] Checking local database integrity...");
const db = JSON.parse(fs.readFileSync(path.join(root, "data/local-db.json"), "utf8"));

const syntheticReviews = (db.reviews || []).filter(r => r.id && r.id.startsWith("rev-mt"));
assert(syntheticReviews.length === 0, `No synthetic test reviews in database (found: ${syntheticReviews.length})`);

const syntheticTestimonials = (db.testimonials || []).filter(t => t.id && t.id.startsWith("rec-mt"));
assert(syntheticTestimonials.length === 0, `No synthetic test testimonials in database (found: ${syntheticTestimonials.length})`);

const dbRaw = JSON.stringify(db);
const rickAstleyCount = (dbRaw.match(/dQw4w9WgXcQ/g) || []).length;
assert(rickAstleyCount === 0, `Zero occurrences of dummy video dQw4w9WgXcQ (found: ${rickAstleyCount})`);

const doc1 = (db.doctors || []).find(d => d.id === "doc-1");
assert(Boolean(doc1), "Doctor doc-1 exists in database");
assert(doc1 && doc1.verified === true, "doc-1 has verified: true");
assert(doc1 && doc1.qualification === "MBBS, MD (Dermatology)", "doc-1 has medical qualifications");
assert(doc1 && Boolean(doc1.regNumber), `doc-1 has medical registration number (${doc1?.regNumber})`);

const about = (db.content || []).find(c => c.key === "about");
const aboutStr = JSON.stringify(about || {});
assert(!aboutStr.includes("12,000+ member rituals"), "No fabricated '12,000+ member rituals' in about content");
assert(!aboutStr.includes("250+ dermatologists"), "No fabricated '250+ dermatologists' in about content");
assert(!aboutStr.includes("GMP / ISO"), "No unverified 'GMP / ISO' badge in about content");

// 2. Storefront Hero & Testimonial Truth
console.log("\n[2] Checking Storefront Experience (QueensCareExperience.tsx)...");
const qcExp = fs.readFileSync(path.join(root, "app/components/QueensCareExperience.tsx"), "utf8");

assert(!qcExp.includes("4.9 / 5"), "No hardcoded '4.9 / 5' in QueensCareExperience.tsx");
assert(!qcExp.includes("12,000+ care rituals"), "No hardcoded '12,000+ care rituals' in QueensCareExperience.tsx");
assert(!qcExp.includes("Meera Shah"), "No hardcoded fictional 'Meera Shah' customer quote");
assert(qcExp.includes("STATUTORY HEALTHCARE") && qcExp.includes("FORMULATION DISCLAIMER"), "Statutory medical & formulation disclaimer present in footer");
assert(qcExp.includes('href: "/trust"'), "Trust Center link present in footer");
assert(qcExp.includes("Formulation & Quality Committee"), "Honest formulation committee pledge when testimonials are empty");

// 3. Product Page & Reviews Transparency
console.log("\n[3] Checking Product Pages & Reviews Trust...");
const prodPage = fs.readFileSync(path.join(root, "app/products/[slug]/page.tsx"), "utf8");
const prodTabs = fs.readFileSync(path.join(root, "app/products/[slug]/ProductTabs.tsx"), "utf8");

assert(!prodPage.includes('product.rating || "5.0"'), "No fallback to 5.0 in page.tsx avgRating");
assert(!prodPage.includes("128 verified clinical reviews"), "No hardcoded '128 verified clinical reviews' in page.tsx");
assert(prodPage.includes("Be the first to review this formulation"), "Honest empty state link when reviews are empty");
assert(prodPage.includes("Formulation Safety") && prodPage.includes("Batch Traceability"), "Product Safety & Batch Traceability card present");
assert(prodPage.includes("100% INCI Disclosure"), "Factual 100% INCI Disclosure badge in ticker");
assert(!prodPage.includes("ISO 9001 Cleanroom Certified"), "Removed unverified ISO 9001 cleanroom certification claim");

assert(prodTabs.includes("No customer reviews yet"), "Honest empty state for reviews in ProductTabs.tsx");
assert(prodTabs.includes("✓ Verified Purchase"), "Verified Purchase badge in ProductTabs.tsx");
assert(prodTabs.includes("Queens Care Formulation Team Response"), "Pharmacist/Formulation Team official response support in ProductTabs.tsx");
assert(prodTabs.includes("Queens Care Review Authenticity Policy"), "Review authenticity policy notice in ProductTabs.tsx");

// 4. Review Verification Engine & Moderation
console.log("\n[4] Checking Review Verification & Store Logic...");
const storeCode = fs.readFileSync(path.join(root, "lib/commerce/store.ts"), "utf8");
const reviewApi = fs.readFileSync(path.join(root, "app/api/reviews/route.ts"), "utf8");
const adminReviewApi = fs.readFileSync(path.join(root, "app/api/admin/reviews/route.ts"), "utf8");

assert(storeCode.includes("isVerifiedPurchase = true"), "Purchase validation against orders in store.reviews.create");
assert(!adminReviewApi.includes("verified !== false"), "Admin reviews do not default verified to true without order proof");
assert(adminReviewApi.includes("updates.response"), "Admin review PATCH supports official response");

// 5. Doctor Management & Portal
console.log("\n[5] Checking Doctor Management & Credibility Portal...");
const storeExt = fs.readFileSync(path.join(root, "lib/commerce/store-extensions.ts"), "utf8");
const adminDocApi = fs.readFileSync(path.join(root, "app/api/admin/doctors/route.ts"), "utf8");
const adminDash = fs.readFileSync(path.join(root, "app/admin/dashboard.tsx"), "utf8");
const docPage = fs.readFileSync(path.join(root, "app/doctors/page.tsx"), "utf8");

assert(storeExt.includes("listPublic: async"), "doctorStore has listPublic method");
assert(adminDocApi.includes("export async function POST"), "admin/doctors supports POST (add doctor)");
assert(adminDocApi.includes("export async function DELETE"), "admin/doctors supports DELETE (remove doctor)");
assert(adminDash.includes("DoctorEditForm"), "Admin dashboard includes DoctorEditForm");
assert(adminDash.includes("+ Add Doctor / Specialist"), "Admin dashboard has Add Doctor button");
assert(docPage.includes("Verified Partner Specialists"), "Doctors page renders Verified Partner Specialists section");
assert(docPage.includes("Statutory Collaboration Statement"), "Doctors page has statutory disclosure on independent clinical practice");

// 6. Dedicated Trust Center & Policy Pages
console.log("\n[6] Checking Dedicated Trust Center & Policy Pages...");
assert(fs.existsSync(path.join(root, "app/trust/page.tsx")), "Trust Center page app/trust/page.tsx exists");
const trustPage = fs.readFileSync(path.join(root, "app/trust/page.tsx"), "utf8");
assert(trustPage.includes("Queens Care Laboratories Private Limited"), "Trust Center contains legal corporate entity name");
assert(trustPage.includes("HPLC Active Potency Assay"), "Trust Center contains laboratory HPLC testing details");
assert(trustPage.includes("100% INCI Disclosure"), "Trust Center contains ingredient transparency charter");
assert(trustPage.includes("Authentic Review & Testimonial Policy"), "Trust Center contains review integrity guarantee");
assert(trustPage.includes("Statutory Healthcare") && trustPage.includes("Wellness Disclaimer"), "Trust Center contains statutory healthcare disclaimer");

const qaPage = fs.readFileSync(path.join(root, "app/quality-assurance/page.tsx"), "utf8");
assert(qaPage.includes("Analytical Testing"), "Quality Assurance page contains analytical testing specifications");
assert(!qaPage.includes("Built for people"), "Quality Assurance page does not use generic placeholder sentences");

const mfgPage = fs.readFileSync(path.join(root, "app/manufacturing/page.tsx"), "utf8");
assert(mfgPage.includes("Clean Air Handling"), "Manufacturing page contains HEPA and clean air specifications");
assert(!mfgPage.includes("Designed for trust"), "Manufacturing page does not use generic placeholder sentences");

console.log(`\n========================================`);
console.log(`TOTAL AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL TRUST & CREDIBILITY AUDIT CHECKS PASSED PERFECTLY!");
  process.exit(0);
}
