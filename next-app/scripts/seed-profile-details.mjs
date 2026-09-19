import fs from "fs";
import path from "path";

const dbPath = path.resolve("data/local-db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

let sanjay = (db.employees || []).find((e) => e.slug === "sanjay-walia");
if (sanjay) {
  sanjay.eyebrow = "QUEENS CARE LABORATORIES • EXECUTIVE LEADERSHIP";
  sanjay.designation = "Founder & Chief Executive Officer";
  sanjay.department = "Executive Leadership";
  sanjay.quote = "Pioneering integrity, trust, and advanced therapeutic health solutions for every family.";
  sanjay.bio =
    "Sanjay Walia brings over eighteen years of global pharmaceutical and integrative healthcare enterprise leadership. As Founder and Chief Executive Officer of Queens Care Laboratories, he spearheads the company's clinical research governance, strategic formulations pipeline, and national expansion across India. Under his guidance, Queens Care Laboratories has formulated more than 140 standardized therapeutic products, uniting classical botanical wisdom with stringent modern analytical chemistry and HPLC purity certifications.";
  sanjay.location = "Mumbai Central Hub / Delhi R&D";
  sanjay.email = "sanjay.walia@queenscare.in";
  sanjay.phone = "+91 22 4050 8801";
  sanjay.verified = true;
  sanjay.active = true;
  sanjay.employeeId = "QC-EXEC-001";
  sanjay.heroBadges = [
    { title: "18+ Years", subtitle: "Leadership", icon: "🛡️" },
    { title: "140+", subtitle: "Formulations", icon: "🔬" },
    { title: "ISO & GMP", subtitle: "Oversight", icon: "🏛️" },
    { title: "Pan-India", subtitle: "Reach", icon: "🇮🇳" },
  ];
  sanjay.keyStats = [
    { number: "18+", label: "Years in Leadership", subtitle: "Pharmaceutical & Clinical Excellence", icon: "🛡️" },
    { number: "140+", label: "Formulations Certified", subtitle: "Rigorous GMP & ISO Compliance", icon: "🔬" },
    { number: "500k+", label: "Lives Impacted Annually", subtitle: "Trusted by Indian Families", icon: "❤️" },
    { number: "100%", label: "Purity & Safety Record", subtitle: "Zero Compromise Standards", icon: "🏛️" },
  ];
  sanjay.featuredProductIds = ["p-ref-immune-care", "p-ref-womens-vitality", "p-ref-respiracare", "p-ref-digestive-balance"];
  sanjay.privacySettings = {
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
  };
  sanjay.featuredVideo = {
    id: "vid-sanjay-keynote",
    title: "The Future of Ayurvedic Formulation & Modern Science",
    duration: "03:24 • Corporate Keynote",
    posterUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=85",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  };
  sanjay.gallery = [
    {
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      caption: "Modern Formulation & Analytical Chemistry Lab at Queens Care Laboratories",
    },
    {
      url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
      caption: "Active Botanical Extraction & Purity Verification Under High-Performance Chromatography",
    },
    {
      url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
      caption: "Clinical Research Team Reviewing Pharmacological Bio-Availability Trials",
    },
    {
      url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
      caption: "Annual Executive Scientific Advisory Board Meeting on Standardized Therapeutics",
    },
  ];
  sanjay.socialLinks = {
    linkedin: { enabled: true, url: "https://linkedin.com/in/sanjay-walia-queenscare" },
    twitter: { enabled: true, url: "https://x.com/sanjaywalia_qc" },
    website: { enabled: true, url: "https://queenscare.in" },
  };
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
console.log("Seeded Sanjay Walia successfully!");
