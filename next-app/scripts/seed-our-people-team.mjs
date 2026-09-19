import fs from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "data/local-db.json");
const raw = fs.readFileSync(dbPath, "utf-8");
const db = JSON.parse(raw);

if (!db.employees) db.employees = [];

const referenceTeam = [
  {
    id: "emp-sanjay-walia",
    name: "Sanjay Walia",
    slug: "sanjay-walia",
    employeeId: "QC-EXEC-001",
    designation: "Chief Executive Officer",
    department: "Leadership",
    quote: "Leading with purpose, driving innovation, and building a healthier tomorrow for all.",
    bio: "Sanjay Walia brings over two decades of global pharmaceutical and healthcare enterprise leadership. He oversees Queens Care Laboratories' strategic expansion, clinical partnerships, and commitment to therapeutic purity.",
    photo: "/uploads/employees/52c9bbb63e4071f46fd871c4ef3ca67ac45e9a730dd6e0e7e2a0cb5a2f5f-1788081544369.png",
    profileImage: "/uploads/employees/52c9bbb63e4071f46fd871c4ef3ca67ac45e9a730dd6e0e7e2a0cb5a2f5f-1788081544369.png",
    phone: "+91 22 4050 8801",
    email: "sanjay.walia@queenscare.in",
    location: "Mumbai Central Hub",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 1,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/sanjay-walia" },
      email: { enabled: true, url: "mailto:sanjay.walia@queenscare.in" }
    },
    departmentIcon: "👑",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-neha-kapoor",
    name: "Neha Kapoor",
    slug: "neha-kapoor",
    employeeId: "QC-EXEC-002",
    designation: "Chief Operating Officer",
    department: "Operations",
    quote: "Turning strategy into action through people, process and performance.",
    bio: "Neha Kapoor directs corporate operations, manufacturing supply chains, and cross-functional quality execution across all Queens Care formulation hubs.",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8802",
    email: "neha.kapoor@queenscare.in",
    location: "Mumbai Central Hub",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 2,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/neha-kapoor" },
      email: { enabled: true, url: "mailto:neha.kapoor@queenscare.in" }
    },
    departmentIcon: "⚙️",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-rohit-malhotra",
    name: "Rohit Malhotra",
    slug: "rohit-malhotra",
    employeeId: "QC-EXEC-003",
    designation: "Chief Financial Officer",
    department: "Finance",
    quote: "Ensuring sustainable growth and long-term value for a healthier future.",
    bio: "Rohit Malhotra leads financial planning, capital allocation, and compliance economics, steering Queens Care's sustainable growth trajectory.",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8803",
    email: "rohit.malhotra@queenscare.in",
    location: "Mumbai Central Hub",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 3,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/rohit-malhotra" },
      email: { enabled: true, url: "mailto:rohit.malhotra@queenscare.in" }
    },
    departmentIcon: "📊",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-dr-ananya-mehta",
    name: "Dr. Ananya Mehta",
    slug: "dr-ananya-mehta",
    employeeId: "QCL-RND-001",
    designation: "Head of Research & Innovation",
    department: "Research & Innovation",
    quote: "Exploring new possibilities to bring better health solutions to life.",
    bio: "Dr. Ananya Mehta leads clinical research, bio-availability assays, and advanced molecular stabilization protocols with over 15 years of pharmaceutical innovation experience.",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8804",
    email: "ananya.mehta@queenscare.in",
    location: "Bengaluru R&D Centre",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 4,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/ananya-mehta" },
      email: { enabled: true, url: "mailto:ananya.mehta@queenscare.in" }
    },
    departmentIcon: "🧪",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-dr-vikram-singhania",
    name: "Dr. Vikram Singhania, M.D., Ph.D.",
    slug: "vikram-singhania",
    employeeId: "QCL-DIR-8801",
    designation: "Head of Quality Assurance & Medical Director",
    department: "Quality & Compliance",
    quote: "Upholding the highest standards of quality, safety and trust.",
    bio: "Dr. Vikram Singhania leads quality assurance and pharmaceutical purity verification at Queens Care Laboratories, with dual doctorates in Molecular Dermatology and Clinical Pharmacology from King's College London.",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=85",
    phone: "+91 98201 54321",
    email: "vikram.singhania@queenscare.in",
    location: "Mumbai Central Hub",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 5,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/vikram-singhania" },
      email: { enabled: true, url: "mailto:vikram.singhania@queenscare.in" }
    },
    departmentIcon: "🛡️",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-priya-sharma",
    name: "Priya Sharma",
    slug: "priya-sharma",
    employeeId: "QCL-REG-006",
    designation: "Head of Regulatory Affairs",
    department: "Regulatory Affairs",
    quote: "Navigating global compliance to ensure safe and reliable healthcare solutions.",
    bio: "Priya Sharma leads regulatory dossiers, statutory CDSCO filings, and international GMP certifications ensuring full pharmacopeia adherence.",
    photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8806",
    email: "priya.sharma@queenscare.in",
    location: "Delhi NCR Campus",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 6,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/priya-sharma" },
      email: { enabled: true, url: "mailto:priya.sharma@queenscare.in" }
    },
    departmentIcon: "📋",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-arjun-iyer",
    name: "Arjun Iyer",
    slug: "arjun-iyer",
    employeeId: "QCL-SCM-007",
    designation: "Head of Supply Chain",
    department: "Supply Chain",
    quote: "Delivering excellence through a resilient and efficient supply chain.",
    bio: "Arjun Iyer spearheads cold-chain logistics, raw material verification, and automated national fulfillment across 18,500+ Indian pincodes.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8807",
    email: "arjun.iyer@queenscare.in",
    location: "Hyderabad Formulation Labs",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 7,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/arjun-iyer" },
      email: { enabled: true, url: "mailto:arjun.iyer@queenscare.in" }
    },
    departmentIcon: "🚚",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-meera-joshi",
    name: "Meera Joshi",
    slug: "meera-joshi",
    employeeId: "QCL-HR-008",
    designation: "Head of Human Resources",
    department: "Human Resources",
    quote: "Empowering people, nurturing talent, and creating a workplace where everyone thrives.",
    bio: "Meera Joshi fosters our collaborative company culture, continuous talent learning academies, and workplace wellness initiatives across all branches.",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8808",
    email: "meera.joshi@queenscare.in",
    location: "Mumbai Central Hub",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 8,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/meera-joshi" },
      email: { enabled: true, url: "mailto:meera.joshi@queenscare.in" }
    },
    departmentIcon: "👥",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-karan-gupta",
    name: "Karan Gupta",
    slug: "karan-gupta",
    employeeId: "QCL-MKT-009",
    designation: "Head of Sales & Marketing",
    department: "Sales & Marketing",
    quote: "Building meaningful connections and making our solutions accessible to more people.",
    bio: "Karan Gupta drives brand presence, omni-channel retail distribution, and pharmacy clinic engagement programs across tier-1 and tier-2 healthcare corridors.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8809",
    email: "karan.gupta@queenscare.in",
    location: "Delhi NCR Campus",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 9,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/karan-gupta" },
      email: { enabled: true, url: "mailto:karan.gupta@queenscare.in" }
    },
    departmentIcon: "📢",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-simran-kaur",
    name: "Simran Kaur",
    slug: "simran-kaur",
    employeeId: "QCL-COM-010",
    designation: "Brand & Communications Lead",
    department: "Communications",
    quote: "Sharing our story, our purpose, and the impact we create every day.",
    bio: "Simran Kaur oversees brand editorial narratives, medical science communication, and patient-first educational campaigns across print, digital and medical seminars.",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8810",
    email: "simran.kaur@queenscare.in",
    location: "Mumbai Central Hub",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 10,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/simran-kaur" },
      email: { enabled: true, url: "mailto:simran.kaur@queenscare.in" }
    },
    departmentIcon: "💬",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-aditya-nair",
    name: "Aditya Nair",
    slug: "aditya-nair",
    employeeId: "QCL-TECH-011",
    designation: "IT & Digital Transformation Lead",
    department: "Information Technology",
    quote: "Building smart systems for a more connected and efficient tomorrow.",
    bio: "Aditya Nair architects our real-time inventory management engines, clinical prescription verification portal, and high-security enterprise systems.",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8811",
    email: "aditya.nair@queenscare.in",
    location: "Bengaluru R&D Centre",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 11,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/aditya-nair" },
      email: { enabled: true, url: "mailto:aditya.nair@queenscare.in" }
    },
    departmentIcon: "💻",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  },
  {
    id: "emp-kavya-reddy",
    name: "Kavya Reddy",
    slug: "kavya-reddy",
    employeeId: "QCL-BD-012",
    designation: "Business Development Manager",
    department: "Business Development",
    quote: "Exploring new opportunities to expand our reach and create greater impact.",
    bio: "Kavya Reddy leads institutional partnerships, hospital consortium contracts, and strategic distributor agreements across national healthcare networks.",
    photo: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=85",
    profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=85",
    phone: "+91 22 4050 8812",
    email: "kavya.reddy@queenscare.in",
    location: "Hyderabad Formulation Labs",
    verified: true,
    featured: true,
    active: true,
    sortOrder: 12,
    socialLinks: {
      linkedin: { enabled: true, url: "https://linkedin.com/in/kavya-reddy" },
      email: { enabled: true, url: "mailto:kavya.reddy@queenscare.in" }
    },
    departmentIcon: "📈",
    photoSettings: {
      desktopSize: 220,
      mobileSize: 140,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true
    }
  }
];

// Merge into db.employees without deleting any existing records, matching by slug
for (const member of referenceTeam) {
  const existingIdx = db.employees.findIndex(e => e.slug === member.slug || e.id === member.id);
  if (existingIdx >= 0) {
    db.employees[existingIdx] = { ...db.employees[existingIdx], ...member };
  } else {
    db.employees.push({
      ...member,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
console.log(`Successfully synced ${referenceTeam.length} reference team members to ${dbPath}! Total employees: ${db.employees.length}`);
