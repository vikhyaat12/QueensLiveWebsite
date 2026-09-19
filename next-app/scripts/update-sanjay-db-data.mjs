import fs from "fs";
import path from "path";

const dbPath = path.resolve("data/local-db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

// Find or initialize Sanjay Walia record
let sanjay = db.employees.find((e) => e.slug === "sanjay-walia" || e.id === "emp-sanjay-walia");
if (!sanjay) {
  sanjay = { id: "emp-sanjay-walia", slug: "sanjay-walia" };
  db.employees.unshift(sanjay);
}

// Update with target reference data
Object.assign(sanjay, {
  id: "emp-sanjay-walia",
  name: "Sanjay Walia",
  slug: "sanjay-walia",
  employeeId: "1122",
  designation: "Founder & Chairman",
  heroSubtitle: "Founder, Chairman & Visionary Leader",
  eyebrow: "FOUNDER & CHAIRMAN",
  department: "Executive Leadership",
  photo: "/uploads/employees/chatgpt-image-sep-7-2026-12_18_49-am-1788722742789.png",
  profileImage: "/uploads/employees/chatgpt-image-sep-7-2026-12_18_49-am-1788722742789.png",
  phone: "+91 88812 15329",
  email: "sanjay.walia@queenscare.in",
  location: "Head Office, India",
  verified: true,
  active: true,
  featured: true,
  sortOrder: 1,

  // Reference visual fields
  heroQuote: "Building Better Health For Every Tomorrow",
  signatureText: "Sanjay Walia",
  heroPlaqueQuote: "Good health is not a privilege, it's a responsibility we all share.",
  heroPlaqueAuthor: "— Sanjay Walia",

  heroBadges: [
    { icon: "🏆", title: "30+ Years", subtitle: "Years of Industry Experience" },
    { icon: "👥", title: "People First", subtitle: "People First Leadership" },
    { icon: "💡", title: "Innovation", subtitle: "Innovation Driven" },
    { icon: "🛡️", title: "Millions", subtitle: "Trusted by Millions" },
  ],

  aboutIcon: "👤",
  aboutTitle: "About Mr. Sanjay Walia",
  aboutSubtitle: "A Purpose-Driven Leader in Pharmaceutical Wellness",
  aboutParagraph1: "Mr. Sanjay Walia is the Founder and Chairman of Queens Care Laboratories. With over 30 years of experience in the pharmaceutical industry, he has built the company on the pillars of quality, integrity, innovation and a genuine commitment to people's health.",
  aboutParagraph2: "Under his leadership, Queens Care has grown into a trusted name, delivering science-backed wellness solutions that touch millions of lives. His focus remains on creating a healthier, happier future through better products, stronger teams and a positive impact on society.",
  aboutCtaLabel: "Read Full Story →",
  aboutCtaUrl: "#journey",
  aboutQuoteText: "A healthier world is possible when science, people and purpose work together.",
  aboutQuoteAuthor: "— Sanjay Walia",

  keyStats: [
    { number: "30+", label: "Years of Experience", subtitle: "In Pharmaceutical Industry", icon: "🏆" },
    { number: "500+", label: "Products Launched", subtitle: "Across Therapeutic Categories", icon: "🧪" },
    { number: "100+", label: "Team Members", subtitle: "Driven by a Shared Purpose", icon: "👥" },
    { number: "Millions", label: "Lives Touched", subtitle: "Through Trusted Solutions", icon: "🌐" },
  ],

  featuredVideo: {
    id: "vid-sanjay-summit",
    title: "Our Journey",
    subtitle: "A Healthier Tomorrow",
    duration: "03:24",
    posterUrl: "/images/hero/sanjay-hero-reference-crop.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },

  momentsGrid: [
    { title: "Product Innovation", imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80" },
    { title: "Research & Development", imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80" },
    { title: "Team & Culture", imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80" },
    { title: "Global Impact", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80" },
  ],

  featuredProductIds: [
    "p-ref-immune-care",
    "p-ref-womens-vitality",
    "p-ref-respiracare",
    "p-ref-digestive-balance",
  ],

  sidebarPromo: {
    title: "Strong People Build a Healthier Tomorrow",
    subtitle: "Meet our dedicated executive and research team",
    ctaText: "Meet Our Team →",
    ctaUrl: "/employee",
    bgImage: "/images/hero/sanjay-promo-card-bg.jpg",
  },

  footerBadges: [
    { label: "Quality You Can Trust", subtitle: "In Every Product", icon: "🛡️" },
    { label: "Science-Backed", subtitle: "Formulations", icon: "⚛️" },
    { label: "People-Driven", subtitle: "Growth", icon: "👥" },
    { label: "A Healthier Tomorrow", subtitle: "For Everyone", icon: "❤️" },
  ],
  footerTagline: "Together for a healthier tomorrow ♡",

  privacySettings: {
    showEmail: true,
    showPhone: true,
    showLocation: true,
    showEmployeeId: true,
    showSocialLinks: true,
    showQR: true,
    showStats: true,
    showMedia: true,
    showProducts: true,
    showTeamMembers: true,
    showDownloadPdf: true,
  },

  socialLinks: {
    linkedin: { enabled: true, url: "https://linkedin.com/in/sanjay-walia-queenscare" },
    twitter: { enabled: true, url: "https://x.com/sanjaywalia_qc" },
    website: { enabled: true, url: "https://queenscare.in" },
    email: { enabled: true, url: "mailto:sanjay.walia@queenscare.in" },
  },

  updatedAt: new Date().toISOString(),
});

// Write safely back to local-db.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
console.log("Successfully updated emp-sanjay-walia in local-db.json with reference data!");
