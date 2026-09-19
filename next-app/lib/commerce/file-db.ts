import "server-only";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join, resolve } from "path";

import { DEFAULT_FOOTER_CONFIG } from "./footer-schema";

const DATA_DIR = resolve(process.cwd(), "data");
const DB_FILE = join(DATA_DIR, "local-db.json");

export interface LocalDbSchema {
  users: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  blogPosts: Array<Record<string, unknown>>;
  employees: Array<Record<string, unknown>>;
  coupons: Array<Record<string, unknown>>;
  b2bApplications: Array<Record<string, unknown>>;
  distributors: Array<Record<string, unknown>>;
  affiliates: Array<Record<string, unknown>>;
  affiliateLinks: Array<Record<string, unknown>>;
  affiliateClicks: Array<Record<string, unknown>>;
  affiliateCommissions: Array<Record<string, unknown>>;
  affiliateWithdrawals: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  homepageSections: Array<Record<string, unknown>>;
  settings: Array<Record<string, unknown>>;
  banners: Array<Record<string, unknown>>;
  faqs: Array<Record<string, unknown>>;
  testimonials: Array<Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
  media: Array<Record<string, unknown>>;
  doctors: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  content: Array<Record<string, unknown>>;
  wishlistItems: Array<Record<string, unknown>>;
  marketing: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  promoBanners: Array<Record<string, unknown>>;
  paymentGateways: Array<Record<string, unknown>>;
  shippingProviders: Array<Record<string, unknown>>;
  shippingRules: Array<Record<string, unknown>>;
  aplusTemplates: Array<Record<string, unknown>>;
  pushSubscriptions: Array<Record<string, unknown>>;
  pushNotificationHistory: Array<Record<string, unknown>>;
  pageSettings: Array<Record<string, unknown>>;
  socialMediaLinks: Array<Record<string, unknown>>;
  careerApplications: Array<Record<string, unknown>>;
  careerJobs: Array<Record<string, unknown>>;
  careerPageSettings: Record<string, unknown>;
  careerSections: Array<Record<string, unknown>>;
  newsletterSubscribers: Array<Record<string, unknown>>;
  contactEnquiries: Array<Record<string, unknown>>;
  notificationSettings: Array<Record<string, unknown>>;
  storeLocations: Array<Record<string, unknown>>;
  analyticsEvents: Array<Record<string, unknown>>;
  analyticsSessions: Array<Record<string, unknown>>;
  auditLogs: Array<Record<string, unknown>>;
  orderStatusHistory: Array<Record<string, unknown>>;
  sitePopups: Array<Record<string, unknown>>;
  models3d: Array<Record<string, unknown>>;
  addresses: Array<Record<string, unknown>>;
  passwordResets: Array<Record<string, unknown>>;
  emailTemplates: Array<Record<string, unknown>>;
  emailLogs: Array<Record<string, unknown>>;
  inventoryTransactions: Array<Record<string, unknown>>;
  backInStockSubscriptions: Array<Record<string, unknown>>;
  promotions: Array<Record<string, unknown>>;
  affiliateCampaigns: Array<Record<string, unknown>>;
  promotionSettings: Array<Record<string, unknown>>;
  promotionAnalytics: Array<Record<string, unknown>>;
  supportConversations: Array<Record<string, unknown>>;
  supportMessages: Array<Record<string, unknown>>;
  supportSettings: Record<string, unknown>;
  supportAuditLogs: Array<Record<string, unknown>>;
  supportTickets: Array<Record<string, unknown>>;
  supportTicketTimeline: Array<Record<string, unknown>>;
  supportAttachments: Array<Record<string, unknown>>;
  bulkProductSnapshots: Array<Record<string, unknown>>;
  footerConfig: Record<string, unknown>;
  footerSnapshots: Array<Record<string, unknown>>;
  publishedHeaderNav: Array<Record<string, unknown>>;
  navigationSnapshots: Array<Record<string, unknown>>;
  redirects: Array<Record<string, unknown>>;
}

const now = () => new Date().toISOString();

const initialSeedData: LocalDbSchema = {
  users: [
    {
      id: "usr-admin-1",
      email: "admin@queenscare.in",
      name: "Queens Care Admin",
      role: "admin",
      passwordHash: "scrypt$32947424c2c0266ad39c1e6b49a3b747$13558144f7b4dc502c70a6e6d4e8f2fa26c3a4d09981c70f2ec49248e0fa1225e26d46ccde3a68982277db05b0a28b90f9f7f3f060ddb7d4091d33abdc8875cf",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "usr-customer-1",
      email: "customer@queenscare.in",
      name: "Demo Customer",
      role: "customer",
      passwordHash: "scrypt$65855b94157eeb5fee02c02c1ed556f5$a39c011094df65d9e1d3fdeba4b016c66dd795f8a212221431c27b1c1da915695bd67f81703c6f7946262501a10fea3ea4ba09903aebd57b5998cf7c21a204bd",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "usr-employee-1",
      email: "employee@queenscare.in",
      name: "Dr. Vikram Singhania",
      role: "employee",
      permissions: ["orders", "products", "blog", "affiliates", "b2b", "employees"],
      passwordHash: "scrypt$088a21d3eda57dcd7d9f478f77462a08$e50998b2613a7116c91c6afa73f58b5f2063ae665509423985aa97d3a316f9c644341322e7d403cf0a78576c9fa2b56940537bda538cf39cc9111e213087068e",
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  products: [
    {
      id: "p-lumine",
      slug: "lumine-c-serum",
      name: "Lumine-C Serum",
      brand: "Queens Care",
      description: "A considered vitamin C ritual for daily radiance.",
      shortDescription: "Vitamin C radiance formula with ferulic acid & hyaluronic booster.",
      category: "Dermal care",
      price: 1490,
      mrp: 1890,
      discount: 21,
      stock: 46,
      lowStockThreshold: 10,
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85",
      images: [
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85",
        "https://images.unsplash.com/photo-1608248597359-216694602a84?auto=format&fit=crop&w=900&q=85"
      ],
      active: true,
      visible: true,
      featured: true,
      homepageVisible: true,
      benefits: ["Visible radiance", "Antioxidant protection", "Lightweight daily finish"],
      ingredients: "Aqua, 15% L-Ascorbic Acid, Tocopherol (Vitamin E), Ferulic Acid, Hyaluronic Acid, Sodium Citrate.",
      usage: "Apply 4–5 drops each morning after cleansing. Follow with broad-spectrum SPF 50.",
      safetyInfo: "For external use only. Patch test recommended before first application.",
      tags: "serum, vitamin c, skincare, radiance, antioxidant",
      seoTitle: "Lumine-C Radiance Serum | Queens Care Laboratories",
      seoDescription: "Clinical-strength Vitamin C serum formulated for everyday dermal health.",
      rating: 4.9,
      reviewCount: 212,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "p-biome",
      slug: "biome-balance",
      name: "Biome Balance",
      brand: "Queens Care",
      description: "Live-culture support formulated for everyday balance.",
      shortDescription: "30 billion CFU daily synbiotic blend for gut microbiome integrity.",
      category: "Digestive care",
      price: 1190,
      mrp: 1490,
      discount: 20,
      stock: 61,
      lowStockThreshold: 15,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85",
      images: [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85"
      ],
      active: true,
      visible: true,
      featured: true,
      homepageVisible: true,
      benefits: ["30 billion live cultures", "Gentle daily support", "Shelf-stable capsules"],
      ingredients: "Lactobacillus rhamnosus GG, Bifidobacterium lactis HN019, Inulin prebiotic fiber, Plant cellulose capsule.",
      usage: "Take 1 capsule daily with water, ideally 20 minutes before your first meal.",
      safetyInfo: "Store in a cool dry place below 25°C. No refrigeration required.",
      tags: "probiotics, gut health, digestion, synbiotic",
      rating: 4.8,
      reviewCount: 174,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "p-nocturne",
      slug: "nocturne-magnesium",
      name: "Nocturne Magnesium",
      brand: "Queens Care",
      description: "Gentle nightly mineral blend for restful sleep and recovery.",
      shortDescription: "High-absorption Magnesium Glycinate with L-Theanine and chamomile.",
      category: "Sleep & recovery",
      price: 990,
      mrp: 1250,
      discount: 20,
      stock: 38,
      lowStockThreshold: 10,
      image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=85",
      images: [
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=85"
      ],
      active: true,
      visible: true,
      featured: true,
      homepageVisible: true,
      benefits: ["Supports sleep quality", "Muscle recovery", "Calm evening ritual"],
      ingredients: "Magnesium Bisglycinate Chelate (200mg elemental), L-Theanine (100mg), Chamomile Extract, Organic Rice Flour.",
      usage: "Take 2 capsules with water 45 minutes before bedtime.",
      safetyInfo: "Do not exceed recommended dose. Consult physician if pregnant or nursing.",
      tags: "sleep, magnesium, recovery, relaxation",
      rating: 4.7,
      reviewCount: 96,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "p-sculpture",
      slug: "sculpture-spf-50",
      name: "Sculpture SPF 50",
      brand: "Queens Care",
      description: "Invisible broad spectrum shield for everyday dermal care.",
      shortDescription: "Broad spectrum PA++++ sunscreen with niacinamide & cica.",
      category: "Dermal care",
      price: 1290,
      mrp: 1590,
      discount: 19,
      stock: 52,
      lowStockThreshold: 10,
      image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85",
      images: [
        "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85"
      ],
      active: true,
      visible: true,
      featured: false,
      homepageVisible: true,
      benefits: ["Broad spectrum SPF 50", "Invisible finish", "Dermatologist tested"],
      ingredients: "Zinc Oxide (non-nano), Titanium Dioxide, Niacinamide 2%, Centella Asiatica Extract, Tocopherol.",
      usage: "Apply generously 15 minutes before sun exposure. Reapply every 2 hours.",
      safetyInfo: "Water resistant (80 mins). Avoid direct contact with eyes.",
      tags: "sunscreen, spf50, skincare, uv protection",
      rating: 4.8,
      reviewCount: 141,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  categories: [
    { id: "cat-1", name: "Dermal care", slug: "dermal-care", description: "Clinically formulated serums, barrier creams, and dermal rituals.", sort: 0, active: true, visible: true, createdAt: now(), updatedAt: now() },
    { id: "cat-2", name: "Digestive care", slug: "digestive-care", description: "Live-culture synbiotics and digestive enzyme complexes.", sort: 1, active: true, visible: true, createdAt: now(), updatedAt: now() },
    { id: "cat-3", name: "Sleep & recovery", slug: "sleep-recovery", description: "Chelated minerals and botanical compounds for restorative rest.", sort: 2, active: true, visible: true, createdAt: now(), updatedAt: now() },
    { id: "cat-4", name: "Daily vitamins", slug: "daily-vitamins", description: "Essential bioavailable micronutrients and lipid-soluble drops.", sort: 3, active: true, visible: true, createdAt: now(), updatedAt: now() },
  ],
  blogPosts: [
    {
      id: "bp-1",
      slug: "afternoon-slump-not-a-personality-flaw",
      title: "Why your afternoon slump is not a personality flaw",
      excerpt: "The 3pm dip is physiology, not a lack of willpower. Here is what is actually happening.",
      body: "<p>Most people blame themselves for the mid-afternoon crash. In reality it is a predictable dip in your circadian rhythm, compounded by blood-sugar swings and the cognitive cost of a busy morning.</p><p>Understanding the mechanism is the first step to working with your body instead of against it. Small, well-timed rituals — hydration, a short walk, and purposefully-dosed support — move the needle far more than another coffee.</p><h3>The science behind the dip</h3><p>Your body runs on a roughly 24-hour cycle. Between 1pm and 3pm, your core temperature drops slightly, and alertness follows. This is not a sign of poor health — it is a feature of human biology.</p><p>Add a high-glycemic lunch to the mix, and you get a blood-sugar spike followed by a sharp drop. The result: that foggy, can't-focus feeling that arrives like clockwork.</p><h3>What actually helps</h3><ul><li><strong>Hydrate first</strong> — Dehydration alone accounts for significant cognitive fatigue.</li><li><strong>Move briefly</strong> — A 10-minute walk resets circulation and cortisol.</li><li><strong>Choose steady energy</strong> — Protein-rich snacks and considered supplementation outperform caffeine.</li><li><strong>Embrace the dip</strong> — Schedule creative work for your peak hours and administrative tasks for the valley.</li></ul><p>Care is a practice, and energy is one of its most rewarding returns.</p>",
      category: "Wellness notes",
      author: "Queens Care Research Team",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80",
      tags: "wellness,energy,rhythm,circadian",
      featured: true,
      published: true,
      visible: true,
      seoTitle: "Why your afternoon slump is not a personality flaw | Queens Care",
      seoDescription: "Understanding the physiological science behind circadian energy dips and midday fatigue.",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "bp-2",
      slug: "what-clinically-studied-really-means",
      title: "The truth about what \"clinically studied\" really means",
      excerpt: "Not all evidence is equal. A short, honest guide to reading supplement claims like a scientist.",
      body: "<p>&ldquo;Clinically studied&rdquo; can mean anything from a rigorous randomised controlled trial to a single small study funded by the seller. The words that matter are sample size, control group, dose, and independence.</p><h2>What to look for</h2><p>When evaluating a supplement claim, ask these questions:</p><ol><li><strong>Sample size</strong> — Was the study conducted on 12 people or 1,200?</li><li><strong>Control group</strong> — Did it include a placebo comparison?</li><li><strong>Dose</strong> — Was the dose used in the study the same as what's in the product?</li><li><strong>Independence</strong> — Was the study funded by an unbiased third party?</li></ol><p>At Queens Care we start from a real need, formulate around a meaningful dose, and test independently for purity. This piece walks through the questions worth asking before any product earns a place on your shelf.</p>",
      category: "Expert series",
      author: "Dr. Priya Sharma",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
      tags: "science,evidence,supplements,education",
      featured: false,
      published: true,
      visible: true,
      seoTitle: "What 'Clinically Studied' Really Means | Queens Care Journal",
      seoDescription: "A doctor's guide to deciphering wellness ingredient claims and study methodologies.",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "bp-3",
      slug: "building-an-evening-ritual",
      title: "Building an evening ritual that actually helps you sleep",
      excerpt: "Sleep is downstream of the ninety minutes before bed. A calm, repeatable wind-down beats any single product.",
      body: "<p>Good sleep rarely comes from one heroic intervention. It comes from a repeatable wind-down that signals safety to your nervous system: dimmer light, a consistent time, less input, and gentle mineral support.</p><h2>The ninety-minute rule</h2><p>The period between 90 minutes before sleep and lights-out is the most consequential window for sleep quality. What you do here determines how quickly you fall asleep and how deep that sleep will be.</p><h3>Build your ritual</h3><ul><li><strong>Dim the lights</strong> — Reduce overhead lighting 90 minutes before bed.</li><li><strong>Lower input</strong> — No screens, no news, no problem-solving.</li><li><strong>Magnesium</strong> — Gentle mineral support helps signal relaxation to the nervous system.</li><li><strong>Consistency</strong> — The same time, the same steps, every night.</li></ul><p>Over a few weeks, a considered evening ritual compounds into deeper, more restorative rest.</p>",
      category: "Wellness notes",
      author: "Queens Care Research Team",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=900&q=80",
      tags: "sleep,ritual,evening,magnesium",
      featured: false,
      published: true,
      visible: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  employees: [
    {
      id: "emp-1042",
      name: "Dr. Vikram Singhania",
      employeeId: "QC-EMP-1042",
      designation: "Lead Research Scientist & Medical Affairs",
      department: "Research & Development",
      photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=85",
      phone: "+91 98111 44556",
      email: "dr.singhania@queenscare.in",
      bio: "Dr. Vikram Singhania leads clinical formulations and purity assays at Queens Care Laboratories with over 14 years of biochemical experience across dermal and metabolic therapeutics.",
      slug: "vikram-singhania",
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "emp-1",
      name: "Dr. Ananya Mehta",
      employeeId: "QCL-001",
      designation: "Chief Research Scientist",
      department: "R&D",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      phone: "+91 98765 43210",
      email: "ananya.mehta@queenscare.in",
      bio: "Leading research initiatives at Queens Care Laboratories with over 12 years of experience.",
      slug: "dr-ananya-mehta",
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "emp-2",
      name: "Rajesh Kumar",
      employeeId: "QCL-002",
      designation: "Head of Quality Assurance",
      department: "Quality",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      phone: "+91 98765 43211",
      email: "rajesh.kumar@queenscare.in",
      bio: "Ensuring every product meets the highest standards of quality and safety.",
      slug: "rajesh-kumar",
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  coupons: [
    { id: "c-1", code: "WELCOME10", type: "percentage", discount: 10, minOrder: 500, maxDiscount: 500, usedCount: 0, perUserLimit: 1, isActive: true, usageLimit: 1000, expiryDate: null, startDate: null, createdAt: now(), updatedAt: now() },
    { id: "c-2", code: "FLAT200", type: "flat", discount: 200, minOrder: 1500, maxDiscount: null, usedCount: 0, perUserLimit: 2, isActive: true, usageLimit: 500, expiryDate: null, startDate: null, createdAt: now(), updatedAt: now() },
    { id: "c-3", code: "QUEENS200", type: "flat", discount: 200, minOrder: 1500, maxDiscount: null, usedCount: 0, perUserLimit: 2, isActive: true, usageLimit: 500, expiryDate: null, startDate: null, createdAt: now(), updatedAt: now() },
  ],
  b2bApplications: [
    {
      id: "b2b-app-1",
      company: "Apex Wellness Clinics India",
      name: "Dr. Ananya Ray",
      email: "ananya.ray@apexwellness.in",
      phone: "+91 98765 43210",
      type: "Clinic Network / Doctor Prescription",
      message: "We operate 14 aesthetic and wellness clinics across Delhi, Mumbai, and Bengaluru.",
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  distributors: [
    {
      id: "dist-1",
      applicationId: "b2b-app-1",
      company: "Apex Wellness Clinics India",
      contactName: "Dr. Ananya Ray",
      email: "ananya.ray@apexwellness.in",
      phone: "+91 98765 43210",
      status: "approved",
      pricingTier: "Tier 1 - Wholesale (35% off MRP)",
      creditLimit: 250000,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  affiliates: [
    {
      id: "aff-1",
      userId: "usr-customer-1",
      affiliateCode: "QC123456",
      status: "active",
      commissionRate: 12,
      level: 1,
      totalSales: 48500,
      totalCommission: 5820,
      pendingCommission: 1200,
      approvedCommission: 4620,
      withdrawnCommission: 3000,
      wallet: 1620,
      customCoupon: "WELCOME10",
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  affiliateLinks: [
    {
      id: "afl-1",
      affiliateId: "aff-1",
      productId: "p-lumine",
      url: "/products/lumine-c-serum",
      shortCode: "QC123456",
      clicks: 142,
      conversions: 18,
      isActive: true,
      createdAt: now(),
    },
  ],
  affiliateClicks: [],
  affiliateCommissions: [
    {
      id: "afc-1",
      affiliateId: "aff-1",
      orderId: "QC-DEMO-101",
      amount: 450,
      status: "approved",
      createdAt: now(),
    },
  ],
  affiliateWithdrawals: [],
  orders: [],
  homepageSections: [
    {
      id: "hs-hero",
      title: "Hero",
      type: "hero",
      sort: 0,
      active: true,
      visible: true,
      content: {
        eyebrow: "A higher standard of everyday care",
        heading: "Science, made personal.",
        subtitle: "Intelligent formulations that turn your daily health rituals into small, powerful acts of self-respect.",
        ctaText: "Explore the collection",
        ctaLink: "/#collection",
        secondaryText: "How we formulate",
        secondaryLink: "/#science",
        rating: "4.9 / 5",
        ratingCount: "12,000+ care rituals",
      },
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "hs-trust",
      title: "Trust Strip",
      type: "trust",
      sort: 1,
      active: true,
      visible: true,
      content: {
        badges: ["Made in India", "Third-party tested", "Traceable ingredients", "Designed with doctors"],
      },
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "hs-collection",
      title: "Product Collection",
      type: "collection",
      sort: 2,
      active: true,
      visible: true,
      content: {
        eyebrow: "The care edit",
        heading: "Considered essentials for your whole self.",
        ctaText: "Shop all care",
      },
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "hs-science",
      title: "Our Science",
      type: "science",
      sort: 3,
      active: true,
      visible: true,
      content: {
        imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85",
        stat: "97%",
        statText: "of customers feel a difference within 30 days*",
        eyebrow: "The Queens Care standard",
        heading: "Precision you can feel. Proof you can see.",
        description: "We bring pharmaceutical rigor to the products that live on your shelf. Each formula begins with a real need, is built around meaningful dosage, and is independently tested for purity.",
        principles: [
          { number: "01", title: "Purposeful dosage", text: "Not marketing-magic ingredients." },
          { number: "02", title: "Radical clarity", text: "Every ingredient has a reason to be here." },
          { number: "03", title: "Better by design", text: "Elegant rituals, lower-impact choices." },
        ],
        ctaText: "Meet our standard",
        ctaLink: "/about",
      },
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "hs-announcement",
      title: "Announcement Bar",
      type: "banner",
      sort: 4,
      active: true,
      visible: true,
      content: {
        text: "Complimentary delivery on orders above ₹1,500",
        secondaryText: "For healthcare professionals",
        secondaryLink: "/doctors",
      },
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "hs-ritual",
      title: "Ritual Cards",
      type: "ritual",
      sort: 6,
      active: true,
      visible: true,
      content: {
        eyebrow: "Build your ritual",
        heading: "Care that meets you<br/><em>where you are.</em>",
        sideText: "Not sure where to begin? Let our guided care finder create a considered starting point in under two minutes.",
        cards: [
          { number: "01", heading: "I want to feel<br/>more <em>energised.</em>", cta: "Discover energy care →", link: "#collection", color: "amber" },
          { number: "02", heading: "I want a calmer<br/><em>evening.</em>", cta: "Discover sleep care →", link: "#collection", color: "lavender" },
          { number: "03", heading: "I want to glow<br/>from <em>within.</em>", cta: "Discover dermal care →", link: "#collection", color: "rose" },
        ],
      },
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "hs-affiliate",
      title: "Partnership / Affiliate",
      type: "affiliate",
      sort: 8,
      active: true,
      visible: true,
      content: {
        eyebrow: "PARTNERSHIP PROGRAMME",
        heading: "Partner with Queens Care Laboratories",
        description: "Share science-backed formulations you believe in and earn through your personalized referral link. Enjoy transparent tracking, dedicated creator support, and straightforward monthly withdrawals.",
        stats: [
          { value: "10%", label: "Commission" },
          { value: "30 Days", label: "Cookie Window" },
          { value: "Direct", label: "Monthly Payouts" },
        ],
        ctaText: "BECOME AN AFFILIATE",
        ctaLink: "/affiliate",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=85",
      },
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "hs-hero-visual",
      title: "Hero 3D Visual (LIKO-Q™)",
      type: "heroVisual",
      sort: 5,
      active: true,
      visible: true,
      content: {
        productName: "LIKO-Q™",
        subtitle: "Lycopene, Vitamins & Minerals Suspension",
        verticalLabel: "PHARMACEUTICAL RIGOR · 200ML",
        customImageUrl: "/uploads/liko-q-suspension.png",
        enabled: true,
        scale: 1.0,
        autoRotate: true,
        rotationSpeed: 1.0,
        mouseInteraction: true,
        lightingIntensity: 1.6,
        accentColor: "#D4AF37",
        bgEffect: "studio",
      },
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  settings: [
    { key: "site_name", value: "Queens Care Laboratories", group: "general", updatedAt: now() },
    { key: "site_tagline", value: "Science, made personal.", group: "general", updatedAt: now() },
    { key: "contact_email", value: "care@queenscare.in", group: "contact", updatedAt: now() },
    { key: "contact_phone", value: "", group: "contact", updatedAt: now() },
    { key: "theme_primary", value: "#2d1b4e", group: "theme", updatedAt: now() },
    { key: "theme_gold", value: "#d4ad65", group: "theme", updatedAt: now() },
    { key: "header_nav", value: JSON.stringify([
      { label: "Shop", href: "/#collection", visible: true, sort: 0 },
      { label: "About", href: "/about", visible: true, sort: 1 },
      { label: "Our science", href: "/#science", visible: true, sort: 2 },
      { label: "Blog", href: "/blog", visible: true, sort: 3 },
      { label: "Our team", href: "/employee", visible: false, sort: 4 },
      { label: "Contact", href: "/contact", visible: true, sort: 5 }
    ]), group: "navigation", updatedAt: now() },
    { key: "footer_links", value: JSON.stringify([
      { section: "Shop", links: [
        { label: "All care", href: "/#collection", visible: true, sort: 0 },
        { label: "Best sellers", href: "/shop", visible: true, sort: 1 },
        { label: "Store locator", href: "/store-locator", visible: true, sort: 2 },
        { label: "B2B portal", href: "/b2b", visible: true, sort: 3 }
      ]},
      { section: "About", links: [
        { label: "Our story", href: "/about", visible: true, sort: 0 },
        { label: "Journal", href: "/blog", visible: true, sort: 1 },
        { label: "Our team", href: "/employee", visible: false, sort: 2 },
        { label: "Careers", href: "/careers", visible: true, sort: 3 },
        { label: "Contact", href: "/contact", visible: true, sort: 4 }
      ]},
      { section: "Support", links: [
        { label: "FAQ", href: "/faq", visible: true, sort: 0 },
        { label: "Track order", href: "/track-order", visible: true, sort: 1 },
        { label: "Privacy", href: "/privacy", visible: true, sort: 2 },
        { label: "Terms", href: "/terms", visible: true, sort: 3 }
      ]},
      { section: "Partnerships", links: [
        { label: "Doctor portal", href: "/doctors", visible: true, sort: 0 },
        { label: "Distributor portal", href: "/b2b", visible: true, sort: 1 },
        { label: "Become an Affiliate", href: "/affiliate", visible: true, sort: 2 }
      ]}
    ]), group: "navigation", updatedAt: now() },
  ],
  banners: [
    {
      id: "bn-1",
      title: "Lumine-C Serum Radiance Ritual",
      subtitle: "Clinically dosed Vitamin C & Ferulic Acid",
      imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1400&q=85",
      linkUrl: "/products/lumine-c-serum",
      position: "hero",
      sort: 0,
      active: true,
      visible: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  faqs: [
    { id: "faq-1", question: "How are Queens Care products different?", answer: "Every formulation begins with a real need and a clinically meaningful dose, independently tested for purity.", category: "Products", sort: 0, visible: true, createdAt: now(), updatedAt: now() },
    { id: "faq-2", question: "Are your products tested on animals?", answer: "No. Queens Care is committed to cruelty-free practices and in-vitro testing methods.", category: "Products", sort: 1, visible: true, createdAt: now(), updatedAt: now() },
    { id: "faq-3", question: "How long does delivery take across India?", answer: "Standard delivery across India typically takes 3-5 business days with live tracking.", category: "Shipping", sort: 2, visible: true, createdAt: now(), updatedAt: now() },
    { id: "faq-4", question: "Can I return a product if unsatisfied?", answer: "Yes, our 14-day formulation satisfaction guarantee allows full returns or exchanges.", category: "Returns", sort: 3, visible: true, createdAt: now(), updatedAt: now() },
  ],
  testimonials: [
    { id: "t-1", name: "Dr. Priya Sharma", title: "Dermatologist, Mumbai", body: "Queens Care formulates with the kind of rigour and transparency I expect from clinical medicine.", rating: 5, image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80", visible: true, sort: 0, createdAt: now(), updatedAt: now() },
    { id: "t-2", name: "Ananya R.", title: "Customer since 2024", body: "For the first time, my daily skin and digestive routine feels less like a chore and more like a dependable ritual.", rating: 5, visible: true, sort: 1, createdAt: now(), updatedAt: now() },
    { id: "t-3", name: "Vikram Mehta", title: "Distributor, Delhi NCR", body: "Professional team, premium shelf appeal, and consistent reorders from doctors and pharmacies.", rating: 5, visible: true, sort: 2, createdAt: now(), updatedAt: now() },
  ],
  offers: [
    { id: "of-1", title: "Welcome Radiance Offer", description: "Enjoy 10% off your first order with code WELCOME10 at checkout.", type: "banner", discount: 10, couponCode: "WELCOME10", minOrder: 500, active: true, visible: true, createdAt: now(), updatedAt: now() },
  ],
  media: [
    { id: "m-1", filename: "lumine-c-serum.jpg", type: "image", url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85", alt: "Lumine-C Serum", size: 245000, visible: true, createdAt: now(), updatedAt: now() },
  ],
  doctors: [
    {
      id: "doc-1",
      name: "Dr. Rajesh Kothari",
      email: "dr.kothari@dermalcare.in",
      phone: "+91 98111 22334",
      clinic: "Kothari Skin & Wellness Clinic",
      specialty: "dermatology",
      qualification: "MBBS, MD (Dermatology)",
      regNumber: "MCI-489201",
      message: "Requesting clinical formulation data for Lumine-C.",
      status: "approved",
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  reviews: [],
  content: [],
  wishlistItems: [],
  marketing: [
    {
      id: "md-1",
      type: "flash_deal",
      title: "Lumine-C Serum Flash Sale",
      products: ["lumine-c-serum"],
      dealPrice: 1290,
      originalPrice: 1490,
      discount: 13,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quantityLimit: 50,
      maxPerUser: 2,
      active: true,
      badge: "FLASH DEAL",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "md-2",
      type: "limited_offer",
      title: "Welcome Radiance Offer",
      products: [],
      discount: 10,
      couponCode: "WELCOME10",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      badge: "10% OFF",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "md-3",
      type: "free_shipping",
      title: "Free Shipping on Orders Above ₹1,500",
      minCartValue: 1500,
      active: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  notifications: [
    {
      id: "ntf-1",
      type: "promotion",
      title: "Free delivery on orders above ₹1,500",
      message: "Enjoy complimentary shipping on your wellness essentials.",
      link: "/shop",
      active: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  promoBanners: [],
  paymentGateways: [
    {
      id: "gw-razorpay",
      provider: "razorpay",
      displayName: "Razorpay (UPI, Cards, Netbanking, Wallets)",
      description: "Accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Netbanking, and Wallets",
      icon: "⚡",
      mode: "test",
      enabled: true,
      isConfigured: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_SECRET),
      credentials: {
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        keySecret: process.env.RAZORPAY_KEY_SECRET || "",
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
      },
      sort: 1,
      supportedCurrencies: ["INR"],
      supportsRefunds: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "gw-stripe",
      provider: "stripe",
      displayName: "Stripe (International Cards & Apple Pay)",
      description: "Accept Visa, Mastercard, Amex, Apple Pay, and Global payment methods",
      icon: "💳",
      mode: "test",
      enabled: false,
      isConfigured: false,
      credentials: {
        publishableKey: "",
        secretKey: "",
        webhookSecret: "",
      },
      sort: 2,
      supportedCurrencies: ["INR", "USD", "EUR", "GBP", "AED", "SGD"],
      supportsRefunds: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "gw-cashfree",
      provider: "cashfree",
      displayName: "Cashfree Payments",
      description: "Seamless checkout for Indian cards, UPI, PayLater and Netbanking",
      icon: "💸",
      mode: "test",
      enabled: false,
      isConfigured: false,
      credentials: {
        appId: "",
        secretKey: "",
      },
      sort: 3,
      supportedCurrencies: ["INR"],
      supportsRefunds: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "gw-payu",
      provider: "payu",
      displayName: "PayU Money",
      description: "Direct debit, cards, EMI and popular Indian digital wallets",
      icon: "🏦",
      mode: "test",
      enabled: false,
      isConfigured: false,
      credentials: {
        merchantKey: "",
        merchantSalt: "",
      },
      sort: 4,
      supportedCurrencies: ["INR"],
      supportsRefunds: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "gw-phonepe",
      provider: "phonepe",
      displayName: "PhonePe PG (Direct UPI & QR)",
      description: "High-converting UPI and QR checkout flow directly powered by PhonePe",
      icon: "📱",
      mode: "test",
      enabled: false,
      isConfigured: false,
      credentials: {
        merchantId: "",
        saltKey: "",
        saltIndex: "1",
      },
      sort: 5,
      supportedCurrencies: ["INR"],
      supportsRefunds: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "gw-cod",
      provider: "cod",
      displayName: "Cash on Delivery (COD)",
      description: "Pay with cash or UPI QR upon package arrival at your doorstep",
      icon: "💵",
      mode: "live",
      enabled: true,
      isConfigured: true,
      credentials: {},
      sort: 6,
      codCharge: 0,
      minOrderValue: 0,
      maxOrderValue: 15000,
      instructions: "Please keep exact cash or UPI QR app ready when the delivery partner arrives.",
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  shippingProviders: [
    {
      id: "ship-shiprocket",
      provider: "shiprocket",
      name: "Shiprocket",
      description: "Multi-courier logistics aggregator (Bluedart, Delhivery, Shadowfax, DTDC, Ekart)",
      icon: "🚀",
      enabled: true,
      isDefault: true,
      mode: "test",
      isConfigured: false,
      credentials: {
        email: "",
        password: "",
        pickupLocation: "Primary Warehouse Mumbai",
        channelId: "",
      },
      sort: 1,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "ship-delhivery",
      provider: "delhivery",
      name: "Delhivery Direct",
      description: "Direct express & surface logistics across 18,500+ Indian pincodes",
      icon: "📦",
      enabled: false,
      isDefault: false,
      mode: "test",
      isConfigured: false,
      credentials: {
        apiToken: "",
        clientName: "",
        warehouseName: "QueensCare Main Hub",
      },
      sort: 2,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "ship-shipway",
      provider: "shipway",
      name: "Shipway",
      description: "E-commerce carrier tracking and NDR automation",
      icon: "🚚",
      enabled: false,
      isDefault: false,
      mode: "test",
      isConfigured: false,
      credentials: {
        username: "",
        licenseKey: "",
      },
      sort: 3,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "ship-pickrr",
      provider: "pickrr",
      name: "Pickrr / ClickPost",
      description: "AI-powered multi-courier dispatch and real-time tracking",
      icon: "📍",
      enabled: false,
      isDefault: false,
      mode: "test",
      isConfigured: false,
      credentials: {
        authToken: "",
      },
      sort: 4,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "ship-nimbuspost",
      provider: "nimbuspost",
      name: "NimbusPost",
      description: "Automated shipping engine with lowest shipping rates across India",
      icon: "☁️",
      enabled: false,
      isDefault: false,
      mode: "test",
      isConfigured: false,
      credentials: {
        email: "",
        password: "",
      },
      sort: 5,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "ship-local",
      provider: "local",
      name: "Queens Care Express Logistics (Local Engine)",
      description: "Built-in reliable rule-based shipping calculator and serviceability engine",
      icon: "🏷️",
      enabled: true,
      isDefault: false,
      mode: "live",
      isConfigured: true,
      credentials: {},
      sort: 6,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  shippingRules: [
    {
      id: "rule-default",
      name: "Standard Indian Shipping Policy",
      freeShippingThreshold: 1500,
      standardShippingFee: 99,
      expressShippingFee: 199,
      codHandlingFee: 0,
      minOrderValue: 0,
      maxOrderValue: 100000,
      estimatedDaysMetro: "2-3 business days",
      estimatedDaysNonMetro: "4-6 business days",
      serviceablePincodes: ["*"],
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  aplusTemplates: [
    {
      id: "aplus-clinical-rigor",
      title: "Pharmaceutical Rigor & Clinical Protocol",
      description: "Comprehensive scientific backing, clinical comparison, and multi-stage testing protocol.",
      category: "Science & Clinical",
      published: true,
      sections: [
        {
          id: "sec-hero-1",
          type: "hero",
          heading: "Science with Soul: Pharmaceutical Rigor in Every Batch",
          text: "Engineered in our state-of-the-art laboratory in Mumbai. Validated by clinical dermatologists and pharmacists for high bioavailability and unmatched safety.",
          imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1600&q=85",
          imageAlt: "Queens Care Laboratory Clinical Rigor",
          published: true,
        },
        {
          id: "sec-imgtext-1",
          type: "imageText",
          heading: "Molecular Precision Formulation",
          text: "Each active ingredient is stabilized using cold-process encapsulation. This shields vulnerable antioxidants like L-Ascorbic Acid and Hyaluronic polymers from oxidation, ensuring maximum cellular delivery upon topical application.",
          imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1000&q=85",
          imageAlt: "Molecular Precision",
          published: true,
        },
        {
          id: "sec-benefits-1",
          type: "benefits",
          heading: "The Queens Care Quality Standard",
          items: [
            "✦ 100% Traceable Botanical & Active Ingredients",
            "✦ Third-Party Multi-Heavy Metal & Microbiological Screened",
            "✦ 0% Parabens, Phthalates, Sulfates, or Synthetic Dyes",
            "✦ Cruelty-Free & Dermatologically Tested on Indian Skin Tones",
          ],
          published: true,
        },
        {
          id: "sec-comp-1",
          type: "comparison",
          heading: "How Queens Care Compares to Generic Market Alternatives",
          items: [
            "Queens Care: High-purity pharmaceutical grade actives",
            "Market Generic: Diluted cosmetic grade fillers",
            "Queens Care: Micro-encapsulated stable formulation",
            "Market Generic: Unshielded formulas prone to oxidation",
            "Queens Care: Third-party certificate of analysis for every batch",
            "Market Generic: Self-reported unverified claims",
          ],
          published: true,
        },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "aplus-botanical-purity",
      title: "Botanical Sourcing & Sustainable Extraction",
      description: "Highlighting organic harvest, sustainable sourcing, and gentle supercritical fluid extraction.",
      category: "Ingredients & Sourcing",
      published: true,
      sections: [
        {
          id: "sec-hero-2",
          type: "hero",
          heading: "Rooted in Nature. Perfected by Advanced Science.",
          text: "We harvest potent wildcrafted botanicals across sustainable Indian agricultural belts and refine them under cleanroom conditions.",
          imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1600&q=85",
          published: true,
        },
        {
          id: "sec-highlights-1",
          type: "highlights",
          heading: "Sustainable Extraction Highlights",
          items: [
            "Supercritical CO2 Extraction preserves fragile phytonutrients without chemical solvents.",
            "Direct Fair-Trade partnerships with generational herb farmers.",
            "Batch-level QR traceability right back to the harvest origin.",
          ],
          published: true,
        },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  pushSubscriptions: [],
  pushNotificationHistory: [],
  pageSettings: [
    { id: "pg-home", slug: "", title: "Home", label: "Home", headerVisible: true, footerVisible: true, sortOrder: 0, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-about", slug: "about", title: "About", label: "About", headerVisible: true, footerVisible: true, sortOrder: 1, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-science", slug: "#science", title: "Our Science", label: "Our science", headerVisible: true, footerVisible: true, sortOrder: 2, active: true, isAnchor: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-blog", slug: "blog", title: "Blog", label: "Blog", headerVisible: true, footerVisible: true, sortOrder: 3, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-contact", slug: "contact", title: "Contact", label: "Contact", headerVisible: true, footerVisible: true, sortOrder: 4, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-b2b", slug: "b2b", title: "Partners", label: "Partners", headerVisible: false, footerVisible: true, sortOrder: 5, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-affiliate", slug: "affiliate", title: "Affiliate", label: "Affiliate", headerVisible: false, footerVisible: true, sortOrder: 6, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-doctors", slug: "doctors", title: "Doctors", label: "Doctors", headerVisible: false, footerVisible: true, sortOrder: 7, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-employee", slug: "employee", title: "Our Team", label: "Our Team", headerVisible: false, footerVisible: true, sortOrder: 8, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-shop", slug: "#collection", title: "Shop", label: "Shop", headerVisible: true, footerVisible: true, sortOrder: 9, active: true, isAnchor: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-privacy", slug: "privacy", title: "Privacy Policy", label: "Privacy", headerVisible: false, footerVisible: true, sortOrder: 10, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
    { id: "pg-terms", slug: "terms", title: "Terms & Conditions", label: "Terms", headerVisible: false, footerVisible: true, sortOrder: 11, active: true, createdAt: "2026-07-30T00:00:00.000Z", updatedAt: "2026-07-30T00:00:00.000Z" },
  ],
  careerApplications: [],
  careerJobs: [],
  careerPageSettings: {},
  careerSections: [],
  newsletterSubscribers: [],
  contactEnquiries: [],
  notificationSettings: [],
  storeLocations: [],
  analyticsEvents: [],
  analyticsSessions: [],
  auditLogs: [],    orderStatusHistory: [],
    sitePopups: [],
    models3d: [],
    addresses: [],
    passwordResets: [],
    emailTemplates: [],
    emailLogs: [],
    inventoryTransactions: [],
    backInStockSubscriptions: [],
    promotions: [
      {
        id: "promo-global-announcement",
        name: "Global Header Announcement Ticker",
        type: "ticker",
        status: "published",
        enabled: true,
        placement: {
          slot: "global_announcement",
          priority: 100,
        },
        targeting: {
          pageType: ["all"],
          devices: ["desktop", "tablet", "mobile"],
          userAudience: "all",
        },
        content: {
          headline: "Storewide Clinical Announcement",
          items: [
            { id: "t1", text: "✦ Free Express Shipping on Orders Above ₹1,500" },
            { id: "t2", text: "✦ 100% Original Direct From Certified Laboratories" },
            { id: "t3", text: "✦ Formulated with Practicing Physicians & Dermatologists" },
            { id: "t4", text: "✦ Batch-Tested Bioactives & High-Absorption Minerals" },
            { id: "t5", text: "✦ Easy 7-Day Hassle-Free Returns" },
          ],
          tickerSpeed: 28,
          tickerMobileSpeed: 18,
          tickerDirection: "rtl",
          tickerSeparator: "•",
          pauseOnHover: true,
          styling: {
            backgroundColor: "#1A0D28",
            textColor: "#F7F1EB",
            accentColor: "#E9CA91",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.04em",
            padding: "8px 16px",
          },
        },
        analytics: { impressions: 0, clicks: 0 },
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "promo-hero-marquee",
        name: "Homepage Hero Trust & Science Marquee",
        type: "ticker",
        status: "published",
        enabled: true,
        placement: {
          slot: "home_hero_bottom",
          priority: 95,
        },
        targeting: {
          pageType: ["home"],
          devices: ["desktop", "tablet", "mobile"],
          userAudience: "all",
        },
        content: {
          headline: "Trust & Science Pillars",
          items: [
            { id: "h1", text: "Clinical Rigor" },
            { id: "h2", text: "Traceable Bioactives" },
            { id: "h3", text: "Physician Formulated" },
            { id: "h4", text: "Zero Added Toxins" },
            { id: "h5", text: "GMP Certified Purity" },
            { id: "h6", text: "Independent Batch Testing" },
          ],
          tickerSpeed: 22,
          tickerMobileSpeed: 15,
          tickerDirection: "rtl",
          tickerSeparator: "✦",
          pauseOnHover: true,
          styling: {
            backgroundColor: "linear-gradient(90deg, rgba(42,15,58,0.03) 0%, rgba(212,175,55,0.06) 50%, rgba(42,15,58,0.03) 100%)",
            textColor: "#2A0F3A",
            accentColor: "#D4AF37",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "10px 0",
            border: "1px solid rgba(212,175,55,0.18)",
          },
        },
        analytics: { impressions: 0, clicks: 0 },
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "promo-free-shipping-progress",
        name: "Authoritative Free Shipping Progress Bar",
        type: "gamification",
        status: "published",
        enabled: true,
        placement: {
          slot: "cart_top",
          priority: 100,
        },
        targeting: {
          pageType: ["cart"],
          devices: ["desktop", "tablet", "mobile"],
          userAudience: "all",
        },
        content: {
          headline: "Free Shipping Milestone",
          gamification: {
            gameType: "free_shipping_progress",
            thresholdType: "server_free_shipping",
            progressLabelFormat: "Add {remaining} more to unlock FREE express delivery",
            successTitle: "🎉 You have qualified for FREE Express Shipping!",
            barHeight: 8,
            barFillColor: "linear-gradient(90deg, #D4AF37 0%, #10B981 100%)",
            barBgColor: "#E5E7EB",
            animated: true,
          },
          styling: {
            backgroundColor: "#FDFBF7",
            textColor: "#2A0F3A",
            accentColor: "#D4AF37",
            padding: "14px 18px",
            borderRadius: "12px",
            border: "1px solid #EAE6DF",
          },
        },
        analytics: { impressions: 0, clicks: 0 },
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "promo-lab-verification-banner",
        name: "HPLC Certified Lab Verification Strip",
        type: "media_block",
        status: "published",
        enabled: true,
        placement: {
          slot: "home_before_testimonials",
          priority: 80,
        },
        targeting: {
          pageType: ["home"],
          devices: ["desktop", "tablet", "mobile"],
          userAudience: "all",
        },
        content: {
          headline: "Lab-Verified HPLC Purity in Every Batch",
          subheadline: "Every raw botanical and mineral is verified by high-performance liquid chromatography before release.",
          mediaType: "none",
          cta: {
            enabled: true,
            text: "Read Our Verification Protocol →",
            destination: "/#science",
            style: "pill",
            backgroundColor: "#2A0F3A",
            textColor: "#FFFFFF",
          },
          styling: {
            backgroundColor: "linear-gradient(135deg, #FAF8F5 0%, #F5F0E8 100%)",
            textColor: "#2A0F3A",
            padding: "24px 32px",
            borderRadius: "16px",
            border: "1px solid #EAE6DF",
            textAlign: "center",
          },
        },
        analytics: { impressions: 0, clicks: 0 },
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    affiliateCampaigns: [
      {
        id: "camp-physician-wellness",
        slug: "physician-wellness-collective",
        name: "Physician & Practitioner Wellness Collective",
        partnerId: "aff-dr-singhania",
        partnerName: "Dr. Vikram Singhania",
        status: "active",
        enabled: true,
        heroTitle: "Clinical Formulations Curated by Medical Practitioners",
        heroSubtitle: "Evidence-based wellness prescribed by leading clinical specialists for everyday vitality.",
        heroDescription: "Access physician-tested bioactive formulations with special partner privilege.",
        trackingKey: "dr-singhania",
        commissionRate: 15,
        couponCode: "DRSINGHANIA10",
        ctaText: "Explore Curated Formulations",
        ctaLink: "/shop",
        featuredProductIds: ["p-lumine", "p-biome", "p-nocturne", "p-sculpture"],
        trustBullets: [
          "Physician-developed clinical protocols",
          "Third-party batch chromatographic verification",
          "Exclusive partner privilege discount applied at checkout",
        ],
        faqs: [
          {
            question: "How do I ensure physician attribution?",
            answer: "Attribution is secured through your unique partner link or promo code DRSINGHANIA10 at checkout.",
          },
          {
            question: "Are these formulations identical to clinical lab batches?",
            answer: "Yes. All products originate directly from Queens Care certified GMP laboratories.",
          },
        ],
        seoTitle: "Physician Wellness Collective | Queens Care Laboratories",
        seoDescription: "Curated clinical formulations endorsed by medical practitioners.",
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    promotionSettings: [
      {
        id: "settings-promotions-global",
        globalEnabled: true,
        tickersEnabled: true,
        mediaEnabled: true,
        gamificationEnabled: true,
        affiliatePromosEnabled: true,
        auditLog: [
          {
            action: "INITIALIZE_PROMOTIONS_CMS",
            performedBy: "system",
            timestamp: now(),
            notes: "Zero-hardcode universal merchandising engine initialized.",
          },
        ],
        updatedAt: now(),
      },
    ],
    promotionAnalytics: [],
    socialMediaLinks: [
      {
        id: "sml-instagram",
        platform: "instagram",
        category: "social",
        label: "Instagram",
        tooltip: "Follow Queens Care on Instagram for clinical research insights",
        url: "https://instagram.com/queenscarelab",
        icon: "instagram",
        iconVariant: "official",
        visible: true,
        desktopVisible: true,
        mobileVisible: true,
        placements: ["header", "footer", "homepage", "contact", "about", "people", "blog", "affiliate", "all"],
        sortOrder: 1,
        desktopIconSize: 20,
        mobileIconSize: 18,
      },
      {
        id: "sml-linkedin",
        platform: "linkedin",
        category: "social",
        label: "LinkedIn",
        tooltip: "Connect with Queens Care Laboratories on LinkedIn",
        url: "https://linkedin.com/company/queenscare",
        icon: "linkedin",
        iconVariant: "official",
        visible: true,
        desktopVisible: true,
        mobileVisible: true,
        placements: ["header", "footer", "contact", "about", "people", "careers", "all"],
        sortOrder: 2,
        desktopIconSize: 20,
        mobileIconSize: 18,
      },
      {
        id: "sml-youtube",
        platform: "youtube",
        category: "social",
        label: "YouTube",
        tooltip: "Watch clinical trial overviews and formulation science on YouTube",
        url: "https://youtube.com/@queenscarelab",
        icon: "youtube",
        iconVariant: "official",
        visible: true,
        desktopVisible: true,
        mobileVisible: true,
        placements: ["footer", "homepage", "science", "about", "all"],
        sortOrder: 3,
        desktopIconSize: 20,
        mobileIconSize: 18,
      },
      {
        id: "sml-twitter",
        platform: "twitter",
        category: "social",
        label: "X (Twitter)",
        tooltip: "Follow clinical pharmacology updates on X",
        url: "https://x.com/queenscarelab",
        icon: "twitter",
        iconVariant: "official",
        visible: true,
        desktopVisible: true,
        mobileVisible: false,
        placements: ["header", "footer", "all"],
        sortOrder: 4,
        desktopIconSize: 20,
        mobileIconSize: 18,
      },
      {
        id: "sml-whatsapp",
        platform: "whatsapp",
        category: "social",
        label: "WhatsApp Clinical Desk",
        tooltip: "Consult with a certified clinical pharmacist on WhatsApp",
        url: "https://wa.me/919876543210?text=Hello%20Queens%20Care%20Pharmacist",
        icon: "whatsapp",
        iconVariant: "official",
        visible: true,
        desktopVisible: true,
        mobileVisible: true,
        placements: ["header", "footer", "contact", "homepage", "all"],
        sortOrder: 5,
        desktopIconSize: 20,
        mobileIconSize: 18,
      },
      {
        id: "sml-facebook",
        platform: "facebook",
        category: "social",
        label: "Facebook",
        tooltip: "Join our patient healthcare community on Facebook",
        url: "https://facebook.com/queenscarelab",
        icon: "facebook",
        iconVariant: "official",
        visible: true,
        desktopVisible: true,
        mobileVisible: true,
        placements: ["footer", "all"],
        sortOrder: 6,
        desktopIconSize: 20,
        mobileIconSize: 18,
      },
    ],
  supportSettings: {
    chatEnabled: true,
    aiEnabled: true,
    humanSupportEnabled: true,
    humanHandoffEnabled: true,
    isOnline: true,
    supportHours: {
      enabled: false,
      start: "09:00",
      end: "20:00",
      timezone: "Asia/Kolkata",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
    welcomeMessage: "Hello! 👋 Welcome to Queens Care Laboratories. I'm your clinical care assistant. How can I help you today?",
    offlineMessage: "Our clinical support team is currently away. Please leave a message, and our pharmacists will respond promptly during operational hours.",
    humanHandoffMessage: "Connecting you with our support team. An agent will join shortly.",
    resolutionMessage: "This support conversation has been resolved. If you need any further clinical assistance, feel free to message us anytime.",
    awayMessage: "All specialists are currently assisting other patients. We will respond shortly.",
    csatEnabled: true,
    reopenOnCustomerMessage: true,
  },
  supportConversations: [
    {
      id: "conv-demo-customer-1",
      visitorId: "vis-demo-1",
      customerId: "usr-customer-1",
      customerName: "Demo Customer",
      customerEmail: "customer@queenscare.in",
      customerPhone: "+91 98765 43210",
      channel: "website_chat",
      status: "open",
      handlingMode: "ai",
      humanRequested: false,
      assignedTo: null,
      priority: "normal",
      relevantOrderId: "ORD-QC-74391",
      unreadAdminCount: 1,
      unreadCustomerCount: 0,
      lastMessage: {
        text: "Could you tell me if Liko Q suspension can be taken after meals?",
        sender: "customer",
        timestamp: "2026-09-15T06:30:00.000Z",
      },
      createdAt: "2026-09-15T06:28:00.000Z",
      updatedAt: "2026-09-15T06:30:00.000Z",
      tags: ["Dosage", "Liko Q"],
      metadata: {
        currentUrl: "/products/liko-q-suspension",
      },
    },
  ],
  supportMessages: [
    {
      id: "msg-demo-1",
      conversationId: "conv-demo-customer-1",
      sender: "customer",
      senderName: "Demo Customer",
      content: "Hello! I received my order of Liko Q suspension.",
      isInternal: false,
      deliveryStatus: "delivered",
      createdAt: "2026-09-15T06:28:00.000Z",
    },
    {
      id: "msg-demo-2",
      conversationId: "conv-demo-customer-1",
      sender: "ai",
      senderName: "Dr. Queens AI",
      content: "Hello! Thank you for choosing Queens Care Laboratories. How can I assist you with your Liko Q suspension today?",
      isInternal: false,
      deliveryStatus: "delivered",
      createdAt: "2026-09-15T06:28:05.000Z",
    },
    {
      id: "msg-demo-3",
      conversationId: "conv-demo-customer-1",
      sender: "customer",
      senderName: "Demo Customer",
      content: "Could you tell me if Liko Q suspension can be taken after meals?",
      isInternal: false,
      deliveryStatus: "delivered",
      createdAt: "2026-09-15T06:30:00.000Z",
    },
  ],
  supportAuditLogs: [
    {
      id: "audit-demo-1",
      conversationId: "conv-demo-customer-1",
      actor: { id: "system", name: "System", role: "system" },
      action: "status_changed",
      oldValue: "new",
      newValue: "open",
      createdAt: "2026-09-15T06:28:00.000Z",
    },
  ],
  supportTickets: [],
  supportTicketTimeline: [],
  supportAttachments: [],
  bulkProductSnapshots: [],
  footerConfig: DEFAULT_FOOTER_CONFIG as unknown as Record<string, unknown>,
  footerSnapshots: [],
  publishedHeaderNav: [],
  navigationSnapshots: [],
  redirects: [],
};

/**
 * File-based database with disk-only reads.
 *
 * FIX: The previous implementation used a module-level `inMemoryData` singleton
 * which caused stale-data bugs in Turbopack dev mode — different worker threads
 * could hold separate copies of the cache, so writes in one thread weren't visible
 * in another.
 *
 * This version always reads from disk (using fs.stat mtime for a cheap staleness
 * check) and writes through to disk synchronously. Every `get()` call returns
 * the latest persisted state. The DB file is ~30KB which reads in <1ms on SSD.
 */
let _cachedData: LocalDbSchema | null = null;
let _cacheMtimeMs = 0;

function ensureDataDir() {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function readFromDisk(): LocalDbSchema {
  ensureDataDir();
  try {
    if (existsSync(DB_FILE)) {
      const raw = readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const merged: LocalDbSchema = {
          ...initialSeedData,
          ...parsed,
        };
        if (!Array.isArray(merged.socialMediaLinks) || merged.socialMediaLinks.length < 5) {
          merged.socialMediaLinks = initialSeedData.socialMediaLinks;
        }
        if (!merged.footerConfig || typeof merged.footerConfig !== "object" || Object.keys(merged.footerConfig).length === 0) {
          merged.footerConfig = structuredClone(initialSeedData.footerConfig);
        }
        if (!Array.isArray(merged.footerSnapshots)) {
          merged.footerSnapshots = [];
        }
        if (!Array.isArray(merged.publishedHeaderNav)) {
          merged.publishedHeaderNav = [];
        }
        if (!Array.isArray(merged.navigationSnapshots)) {
          merged.navigationSnapshots = [];
        }
        if (!Array.isArray(merged.redirects)) {
          merged.redirects = [];
        }
        return merged;
      }
    }
  } catch {}

  // First-time init: write seed data to DB_FILE
  const initialized: LocalDbSchema = structuredClone(initialSeedData);
  try {
    ensureDataDir();
    writeFileSync(DB_FILE, JSON.stringify(initialized, null, 2), "utf-8");
  } catch {}
  return initialized;
}

/**
 * Get current file modification time in ms, or 0 if unavailable.
 */
function getFileMtimeMs(): number {
  try {
    const st = statSync(DB_FILE);
    return st.mtimeMs;
  } catch {
    return 0;
  }
}

export const fileDb = {
  get(): LocalDbSchema {
    // Always check if the file on disk is newer than our cache.
    // This handles cross-thread/cross-worker writes seamlessly.
    const diskMtime = getFileMtimeMs();
    if (_cachedData && diskMtime === _cacheMtimeMs) {
      return _cachedData;
    }
    _cachedData = readFromDisk();
    _cacheMtimeMs = diskMtime;
    return _cachedData;
  },

  flush() {
    if (!_cachedData) return;
    ensureDataDir();
    try {
      writeFileSync(DB_FILE, JSON.stringify(_cachedData, null, 2), "utf-8");
      // Update our own mtime cache so we don't re-read what we just wrote
      _cacheMtimeMs = getFileMtimeMs();
    } catch {}
  },

  save(partial: Partial<LocalDbSchema>) {
    const current = this.get();
    _cachedData = { ...current, ...partial };
    this.flush();
  },

  collection<K extends keyof LocalDbSchema>(name: K): LocalDbSchema[K] {
    const data = this.get();
    if (!Array.isArray(data[name])) {
      data[name] = [] as unknown as LocalDbSchema[K];
    }
    return data[name];
  },

  insert<K extends keyof LocalDbSchema>(name: K, item: Record<string, unknown>) {
    const list = this.collection(name) as Array<Record<string, unknown>>;
    const record = {
      id: item.id || `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: item.createdAt || now(),
      updatedAt: now(),
      ...item,
    };
    list.push(record);
    this.flush();
    return record;
  },

  update<K extends keyof LocalDbSchema>(name: K, identifier: string | { id?: string; slug?: string; key?: string }, patch: Record<string, unknown>) {
    const list = this.collection(name) as Array<Record<string, unknown>>;
    const idx = list.findIndex((item) => {
      if (typeof identifier === "string") {
        return item.id === identifier || item.slug === identifier || item.key === identifier;
      }
      if (identifier.id && item.id === identifier.id) return true;
      if (identifier.slug && item.slug === identifier.slug) return true;
      if (identifier.key && item.key === identifier.key) return true;
      return false;
    });

    if (idx === -1) {
      // Upsert if not found
      return this.insert(name, {
        ...(typeof identifier === "string" ? { id: identifier } : identifier),
        ...patch,
      });
    }

    list[idx] = {
      ...list[idx],
      ...patch,
      updatedAt: now(),
    };
    this.flush();
    return list[idx];
  },

  remove<K extends keyof LocalDbSchema>(name: K, identifier: string | { id?: string; slug?: string; key?: string }) {
    const list = this.collection(name) as Array<Record<string, unknown>>;
    const idx = list.findIndex((item) => {
      if (typeof identifier === "string") {
        return item.id === identifier || item.slug === identifier || item.key === identifier;
      }
      if (identifier.id && item.id === identifier.id) return true;
      if (identifier.slug && item.slug === identifier.slug) return true;
      if (identifier.key && item.key === identifier.key) return true;
      return false;
    });

    if (idx !== -1) {
      const removed = list.splice(idx, 1);
      this.flush();
      return removed[0];
    }
    return null;
  },

  findOne<K extends keyof LocalDbSchema>(name: K, predicate: (item: Record<string, unknown>) => boolean) {
    const list = this.collection(name) as Array<Record<string, unknown>>;
    return list.find(predicate) || null;
  },

  findMany<K extends keyof LocalDbSchema>(name: K, predicate?: (item: Record<string, unknown>) => boolean) {
    const list = this.collection(name) as Array<Record<string, unknown>>;
    return predicate ? list.filter(predicate) : [...list];
  },
};
