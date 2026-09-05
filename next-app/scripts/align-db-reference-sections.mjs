import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "data/local-db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

// Update Hero Section to exact reference copy and layout
const heroSection = db.homepageSections.find((s) => s.id === "hs-hero");
if (heroSection) {
  heroSection.sort = 0;
  heroSection.active = true;
  heroSection.visible = true;
  heroSection.content = {
    eyebrow: "SCIENCE-BACKED WELLNESS",
    heading: "Better<br/>Health<br/>Brighter <span style='color: #EC4899;'>💗</span><br/>Tomorrows",
    subtitle: "Premium pharmaceutical wellness solutions for you and your loved ones.",
    ctaText: "Explore Products",
    ctaLink: "/#collection",
    secondaryText: "Watch Our Story",
    secondaryLink: "/about",
    characterEnabled: true,
    characterPosition: "split",
    characterSize: "lg",
    characterAnimation: "gentle_breathing",
    characterGreeting: "Hi! I'm Dr. Queens 💙",
    characterSubtext: "Let me help you find the right products for your needs. 💙",
    characterBadge: "",
    characterBubble: true,
    characterImageUrl: "/images/reference/dr-queens-hero.png",
    heroVisual: {
      enabled: true,
      productName: "Immune Support+",
      subtitle: "VITAMIN C, D3 & ZINC",
      customImageUrl: "/images/reference/hero-immune-bottle.png",
      scale: 1.0,
      autoRotate: false,
      mouseInteraction: true,
      bgEffect: "transparent",
      showInfoPlate: false,
    },
  };
}

// Order mapping strictly matching media_1788587830390.png
const orderMap = {
  "hs-hero": 0,
  "hs-collection": 1,
  "hs-trust": 2,
  "hs-ritual": 3,
  "hs-consult": 4,
  "hs-newsletter": 5,
};

for (const sec of db.homepageSections) {
  if (orderMap[sec.id] !== undefined) {
    sec.sort = orderMap[sec.id];
    sec.active = true;
    sec.visible = true;
  } else {
    sec.active = false;
    sec.visible = false;
  }
}

// Sort in-place by sort index
db.homepageSections.sort((a, b) => {
  const sa = a.sort !== undefined ? Number(a.sort) : 999;
  const sb = b.sort !== undefined ? Number(b.sort) : 999;
  return sa - sb;
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
console.log("Successfully aligned homepageSections in local-db.json to reference layout!");
