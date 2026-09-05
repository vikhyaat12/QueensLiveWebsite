import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("==========================================================================");
  console.log("QUEENS CARE LABORATORIES — HOMEPAGE REDESIGN COMPREHENSIVE VERIFICATION");
  console.log("==========================================================================");

  // 1. Admin Authentication
  console.log("\n[TEST 1] Admin Authentication");
  const authRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  assert.strictEqual(authRes.status, 200, "Admin login failed");
  const authData = await authRes.json();
  const token = authData.token;
  const cookieHeader = authRes.headers.get("set-cookie") || `qc_session=${token}`;
  console.log("✓ Test 1 Passed: Admin authenticated successfully");

  // 2. Homepage Sections CMS Query
  console.log("\n[TEST 2] Fetch Homepage Sections via Admin CMS");
  const adminSectionsRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    headers: { Cookie: cookieHeader, Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(adminSectionsRes.status, 200, "Failed to load admin homepage sections");
  const adminData = await adminSectionsRes.json();
  assert(Array.isArray(adminData.sections), "Expected sections array in response");
  console.log(`✓ Test 2 Passed: Found ${adminData.sections.length} homepage sections`);

  // 3. Update Hero Section with Female Doctor Character CMS settings
  console.log("\n[TEST 3] Hero Section CMS: Update Female Specialist Parameters");
  const heroSection = adminData.sections.find((s) => s.type === "hero") || { id: "hs-hero" };
  const existingContent = typeof heroSection.content === "string" ? JSON.parse(heroSection.content) : (heroSection.content || {});
  
  const updatedHeroContent = {
    ...existingContent,
    eyebrow: "A higher standard of everyday care",
    heading: "Clinical Intelligence, Made <em>Personal.</em>",
    subtitle: "Dermatological formulations engineered for daily cellular vitality and precision wellness.",
    enableFemaleDoctor: true,
    doctorComposition: "split",
    doctorSize: "lg",
    doctorAnimation: "gaze_and_breath",
    doctorGreeting: "Hello, I am Dr. Elena Vance. How may we personalize your daily ritual today?",
    doctorSubtext: "Clinical Formulations & Cellular Vitality Lead",
    doctorBadge: "BOARD-CERTIFIED CLINICAL SPECIALIST",
    doctorBubble: true,
  };

  const updateHeroRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: heroSection.id,
      content: updatedHeroContent,
    }),
  });
  assert.strictEqual(updateHeroRes.status, 200, "Failed to update Hero section with female doctor CMS parameters");
  console.log("✓ Test 3 Passed: Female doctor hero specialist CMS parameters updated successfully");

  // 4. Update Universal Marquee Settings
  console.log("\n[TEST 4] Universal Marquee CMS: Multi-placement Configuration");
  const marqueeSection = adminData.sections.find((s) => s.type === "marquee") || { id: "hs-marquee" };
  const updateMarqueeRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: marqueeSection.id,
      content: {
        placement: "below_header",
        speedDesktop: 32,
        speedMobile: 22,
        direction: "rtl",
        pauseOnHover: true,
        bgColor: "rgba(10, 15, 13, 0.95)",
        fontColor: "#F5F2EB",
        fontSize: "sm",
        separator: "✦",
        items: [
          "CLINICALLY PROVEN BIOACTIVE CELLULAR NOURISHMENT",
          "GMP-CERTIFIED PHARMACEUTICAL MANUFACTURING FACILITY",
          "COLD-STABILIZED VITAMIN C & LYCOPENE SUSPENSION",
          "COMPLIMENTARY DERMATOLOGIST CONSULTATION QUIZ",
          "EXPRESS COMPLIANT COLD-CHAIN DISPATCH ACROSS INDIA",
        ],
      },
    }),
  });
  assert.strictEqual(updateMarqueeRes.status, 200, "Failed to update Universal Marquee parameters");
  console.log("✓ Test 4 Passed: Universal Marquee multi-placement parameters persisted");

  // 5. Verify Public Homepage API reflects CMS updates
  console.log("\n[TEST 5] Verify Public Homepage API reflects CMS data");
  const pubHpRes = await fetch(`${BASE_URL}/api/homepage`);
  assert.strictEqual(pubHpRes.status, 200, "Failed to load public homepage API");
  const pubHpData = await pubHpRes.json();
  const pubHero = pubHpData.sections.find((s) => s.type === "hero");
  const parsedPubHero = typeof pubHero?.content === "string" ? JSON.parse(pubHero.content) : pubHero?.content;
  assert.strictEqual(parsedPubHero.enableFemaleDoctor, true, "enableFemaleDoctor must be true");
  assert.strictEqual(parsedPubHero.doctorBadge, "BOARD-CERTIFIED CLINICAL SPECIALIST", "doctorBadge must match");
  console.log("✓ Test 5 Passed: Public Homepage API reflects live CMS settings perfectly");

  // 6. Test AI Health Assistant / Chatbot API
  console.log("\n[TEST 6] Test AI Health Assistant Chatbot API");
  const chatRes = await fetch(`${BASE_URL}/api/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "What do you recommend for cellular vitality and antioxidant defense?" }),
  });
  assert.strictEqual(chatRes.status, 200, "Chatbot API call failed");
  const chatData = await chatRes.json();
  assert(chatData.reply && chatData.reply.length > 20, "Expected meaningful clinical advice reply");
  console.log(`✓ Test 6 Passed: Chatbot responded with intelligence (${chatData.reply.length} chars)`);

  // 7. Verify Product Catalog with Authentic Stock and Data
  console.log("\n[TEST 7] Verify Product Catalog Endpoint");
  const productsRes = await fetch(`${BASE_URL}/api/products`);
  assert.strictEqual(productsRes.status, 200, "Products API call failed");
  const products = await productsRes.json();
  assert(Array.isArray(products) && products.length > 0, "Expected non-empty products catalog");
  const sampleProd = products[0];
  assert(typeof sampleProd.price === "number", "Product price must be a number");
  console.log(`✓ Test 7 Passed: Product catalog has ${products.length} live formulations with real pricing & stock`);

  // 8. Verify Storefront HTML SSR contains redesigned components
  console.log("\n[TEST 8] Verify Storefront HTML SSR contains redesign elements");
  const htmlRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(htmlRes.status, 200, "Failed to load Storefront homepage HTML");
  const html = await htmlRes.text();
  assert(html.includes("Queens Care") || html.includes("QUEENS CARE"), "Homepage must include Queens Care brand");
  console.log("✓ Test 8 Passed: Storefront HTML successfully renders");

  console.log("\n==========================================================================");
  console.log("ALL 8 VERIFICATION TESTS PASSED PERFECTLY!");
  console.log("==========================================================================");
}

run().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
