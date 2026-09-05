import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_IMAGE = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/.user_uploaded/media_1788587830390.png";
const OUT_DIR = path.join(process.cwd(), "public", "images", "reference", "products");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function extractProducts() {
  console.log("Extracting 8 reference product bottle images...");

  const productsCoords = [
    // Row 1
    { name: "prod-immune-care.png", left: 102, top: 238, width: 72, height: 55 },
    { name: "prod-womens-vitality.png", left: 186, top: 238, width: 72, height: 55 },
    { name: "prod-respiracare.png", left: 272, top: 238, width: 72, height: 55 },
    { name: "prod-digestive-balance.png", left: 356, top: 238, width: 72, height: 55 },
    // Row 2
    { name: "prod-skinglow.png", left: 102, top: 348, width: 72, height: 55 },
    { name: "prod-bone-strength.png", left: 186, top: 348, width: 72, height: 55 },
    { name: "prod-heart-care.png", left: 272, top: 348, width: 72, height: 55 },
    { name: "prod-kids-immunity.png", left: 356, top: 348, width: 72, height: 55 },
  ];

  for (const p of productsCoords) {
    const outPath = path.join(OUT_DIR, p.name);
    await sharp(SOURCE_IMAGE)
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .toFile(outPath);
    console.log(`✓ Saved ${p.name}`);
  }

  // Now enrich data/local-db.json with these 8 reference products
  const dbPath = path.resolve(process.cwd(), "data/local-db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

  const referenceProducts = [
    {
      id: "p-ref-immune-care",
      slug: "immune-care-plus",
      name: "Immune Care+",
      brand: "Queens Care",
      subtitle: "Daily Immunity Support",
      category: "Immunity",
      price: 499,
      originalPrice: 699,
      rating: 4.8,
      reviewCount: 1210,
      badge: "Bestseller",
      badgeColor: "#F59E0B",
      images: ["/images/reference/products/prod-immune-care.png"],
      thumbnail: "/images/reference/products/prod-immune-care.png",
      inStock: true,
      stock: 150,
      sku: "QC-IMM-01",
      formulation: "Tablet",
      dosage: "1 Tablet daily after breakfast",
      description: "Advanced daily immunity support engineered with cold-stabilized Vitamin C, Zinc Gluconate, and botanical bioactives.",
      tags: ["Immunity", "Bestseller", "Vitamin C", "Zinc"],
      status: "published",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "p-ref-womens-vitality",
      slug: "womens-vitality",
      name: "Women's Vitality",
      brand: "Queens Care",
      subtitle: "Hormonal Balance & Natural Support",
      category: "Women's Health",
      price: 599,
      originalPrice: 799,
      rating: 4.7,
      reviewCount: 856,
      badge: "New",
      badgeColor: "#10B981",
      images: ["/images/reference/products/prod-womens-vitality.png"],
      thumbnail: "/images/reference/products/prod-womens-vitality.png",
      inStock: true,
      stock: 120,
      sku: "QC-WOM-01",
      formulation: "Capsule",
      dosage: "1 Capsule daily with water",
      description: "Specialized formulation for female hormonal rhythm, cellular energy, and daily wellness.",
      tags: ["Women's Health", "Hormonal Balance", "Energy"],
      status: "published",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "p-ref-respiracare",
      slug: "respiracare",
      name: "RespiraCare",
      brand: "Queens Care",
      subtitle: "Breathe Better, Live Freer",
      category: "Respiratory",
      price: 549,
      originalPrice: 699,
      rating: 4.8,
      reviewCount: 934,
      badge: undefined,
      images: ["/images/reference/products/prod-respiracare.png"],
      thumbnail: "/images/reference/products/prod-respiracare.png",
      inStock: true,
      stock: 85,
      sku: "QC-RES-01",
      formulation: "Syrup",
      dosage: "10ml twice daily",
      description: "Phytomedicinal bronchial relief and lung vitality formula for clean, clear respiratory passages.",
      tags: ["Respiratory", "Lungs", "Breathe"],
      status: "published",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "p-ref-digestive-balance",
      slug: "digestive-balance",
      name: "Digestive Balance",
      brand: "Queens Care",
      subtitle: "For a Happier Gut",
      category: "Digestive",
      price: 499,
      originalPrice: 649,
      rating: 4.7,
      reviewCount: 642,
      badge: "Popular",
      badgeColor: "#F97316",
      images: ["/images/reference/products/prod-digestive-balance.png"],
      thumbnail: "/images/reference/products/prod-digestive-balance.png",
      inStock: true,
      stock: 95,
      sku: "QC-DIG-01",
      formulation: "Capsule",
      dosage: "1 Capsule before meals",
      description: "Live-culture symbiotic digestive balance complex targeting gut microbiome resilience.",
      tags: ["Digestive", "Gut Health", "Probiotic"],
      status: "published",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "p-ref-skinglow",
      slug: "skinglow-plus",
      name: "SkinGlow+",
      brand: "Queens Care",
      subtitle: "Healthy Skin, Hair & Nails",
      category: "Skin",
      price: 599,
      originalPrice: 799,
      rating: 4.8,
      reviewCount: 521,
      badge: undefined,
      images: ["/images/reference/products/prod-skinglow.png"],
      thumbnail: "/images/reference/products/prod-skinglow.png",
      inStock: true,
      stock: 110,
      sku: "QC-SKN-01",
      formulation: "Tablet",
      dosage: "1 Tablet with evening meal",
      description: "Cellular radiance formula with Marine Collagen peptides, Biotin, and antioxidant phyto-compounds.",
      tags: ["Skin", "Hair", "Nails", "Glow"],
      status: "published",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "p-ref-bone-strength",
      slug: "bone-strength",
      name: "Bone Strength",
      brand: "Queens Care",
      subtitle: "Stronger Bones, Active Life",
      category: "Bone",
      price: 549,
      originalPrice: 699,
      rating: 4.7,
      reviewCount: 408,
      badge: undefined,
      images: ["/images/reference/products/prod-bone-strength.png"],
      thumbnail: "/images/reference/products/prod-bone-strength.png",
      inStock: true,
      stock: 75,
      sku: "QC-BON-01",
      formulation: "Tablet",
      dosage: "1 Tablet daily after lunch",
      description: "High-absorption Calcium Citrate Malate + Vitamin D3 + K2 (MK-7) bone density support.",
      tags: ["Bone", "Joint", "Calcium", "D3"],
      status: "published",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "p-ref-heart-care",
      slug: "heart-care",
      name: "Heart Care",
      brand: "Queens Care",
      subtitle: "For a Healthier Tomorrow",
      category: "Cardiovascular",
      price: 649,
      originalPrice: 849,
      rating: 4.8,
      reviewCount: 387,
      badge: undefined,
      images: ["/images/reference/products/prod-heart-care.png"],
      thumbnail: "/images/reference/products/prod-heart-care.png",
      inStock: true,
      stock: 60,
      sku: "QC-HRT-01",
      formulation: "Capsule",
      dosage: "1 Capsule daily with meal",
      description: "CoQ10 + Omega-3 + Arjuna bark extract for endothelial function and myocardial strength.",
      tags: ["Heart Care", "Cardio", "CoQ10", "Omega-3"],
      status: "published",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "p-ref-kids-immunity",
      slug: "kids-immunity",
      name: "Kids Immunity",
      brand: "Queens Care",
      subtitle: "Everyday Defense",
      category: "Children",
      price: 449,
      originalPrice: 598,
      rating: 4.7,
      reviewCount: 202,
      badge: "Kids",
      badgeColor: "#8B5CF6",
      images: ["/images/reference/products/prod-kids-immunity.png"],
      thumbnail: "/images/reference/products/prod-kids-immunity.png",
      inStock: true,
      stock: 140,
      sku: "QC-KID-01",
      formulation: "Syrup",
      dosage: "5ml once daily",
      description: "Gentle elderberry + Vitamin C pediatrician-approved defense formulation for growing children.",
      tags: ["Children", "Kids Immunity", "Elderberry"],
      status: "published",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Insert or update reference products
  for (const refProd of referenceProducts) {
    const idx = db.products.findIndex((p) => p.id === refProd.id);
    if (idx >= 0) {
      db.products[idx] = { ...db.products[idx], ...refProd };
    } else {
      db.products.unshift(refProd); // Put at top so they appear first in shop
    }
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  console.log("✓ Enriched local-db.json with 8 reference products!");
}

extractProducts().catch(console.error);
