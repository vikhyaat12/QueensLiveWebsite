import assert from "node:assert";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const NEXT_APP_DIR = "c:\\Project\\QueensCareWebsite\\next-app";

// Stub server-only so Node.js can import server-side modules outside Next.js runtime
try {
  const serverOnlyPath = require.resolve("server-only", { paths: [NEXT_APP_DIR] });
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  };
} catch (e) {
  // Ignore
}

const { createJiti } = require(path.join(NEXT_APP_DIR, "node_modules/jiti/lib/jiti.cjs"));
const jiti = createJiti(__filename, {
  alias: {
    "@": NEXT_APP_DIR,
    "server-only": path.join(__dirname, "server-only-stub.js"),
  },
  interopDefault: true,
});

async function runPromotionsTestSuite() {
  console.log("==================================================================");
  console.log("QUEENS CARE — 10-TEST UNIVERSAL MERCHANDISING & CMS ENGINE SUITE");
  console.log("==================================================================");

  const { promotionsStore } = jiti(path.join(NEXT_APP_DIR, "lib/commerce/promotions-store.ts"));
  const { fileDb } = jiti(path.join(NEXT_APP_DIR, "lib/commerce/file-db.ts"));

  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error("  ", err?.message || err);
      failedCount++;
    }
  }

  // TEST 1: Component Creation, Retrieval, and Updates
  await test("1. Component Creation, Retrieval, and Updates", async () => {
    const created = await promotionsStore.savePromotion({
      name: "Test Immunity Ticker",
      type: "ticker",
      status: "published",
      enabled: true,
      placement: { slot: "global_top", priority: 120 },
      content: {
        headline: "Immunity Boosters",
        items: [{ id: "it-1", text: "Zinc & Vitamin C Synergies" }],
        styling: { backgroundColor: "#111827", textColor: "#F3F4F6" },
      },
    });

    assert.ok(created.id, "Created component must have an ID");
    const retrieved = await promotionsStore.getPromotionById(created.id);
    assert.strictEqual(retrieved?.name, "Test Immunity Ticker");

    // Update
    const updated = await promotionsStore.savePromotion({
      id: created.id,
      name: "Updated Immunity Ticker",
      placement: { slot: "global_top", priority: 140 },
    });
    assert.strictEqual(updated.name, "Updated Immunity Ticker");
  });

  // TEST 2: Component State Machine (draft, published, paused, expired)
  await test("2. State Machine: draft/paused components excluded from public customer feed", async () => {
    const draft = await promotionsStore.savePromotion({
      name: "Draft Campaign",
      type: "media_block",
      status: "draft",
      enabled: true,
      placement: { slot: "home_hero_top", priority: 90 },
      content: { styling: {} },
    });

    const publicItems = await promotionsStore.listPromotions({ slot: "home_hero_top", admin: false });
    assert.ok(
      !publicItems.some((p) => p.id === draft.id),
      "Draft components must never be returned in public customer feed"
    );

    const adminItems = await promotionsStore.listPromotions({ slot: "home_hero_top", admin: true });
    assert.ok(
      adminItems.some((p) => p.id === draft.id),
      "Draft components must be visible to admin"
    );

    await promotionsStore.deletePromotion(draft.id);
  });

  // TEST 3: Scheduling Rules (Start/End Date Window)
  await test("3. Scheduling: Time-window filtering works authoritatively", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // +1 day
    const pastDate = new Date(Date.now() - 86400000).toISOString();   // -1 day

    // Future component
    const futurePromo = await promotionsStore.savePromotion({
      name: "Future Scheduled Promo",
      type: "ticker",
      status: "published",
      enabled: true,
      placement: { slot: "home_between_sections", priority: 80 },
      schedule: { startDate: futureDate },
      content: { styling: {} },
    });

    const publicList = await promotionsStore.listPromotions({ slot: "home_between_sections", admin: false });
    assert.ok(
      !publicList.some((p) => p.id === futurePromo.id),
      "Future scheduled promo must NOT be rendered yet"
    );

    await promotionsStore.deletePromotion(futurePromo.id);
  });

  // TEST 4: Targeting Engine (Devices, Routes, Page Types)
  await test("4. Targeting Engine: Device and Route filtering", async () => {
    const mobileOnlyPromo = await promotionsStore.savePromotion({
      name: "Mobile Exclusive Alert",
      type: "ticker",
      status: "published",
      enabled: true,
      placement: { slot: "category_top", priority: 90 },
      targeting: { devices: ["mobile"], pageType: ["category"] },
      content: { styling: {} },
    });

    // Test querying on desktop
    const desktopList = await promotionsStore.listPromotions({
      slot: "category_top",
      device: "desktop",
      admin: false,
    });
    assert.ok(
      !desktopList.some((p) => p.id === mobileOnlyPromo.id),
      "Mobile-only promo must not be returned on desktop"
    );

    // Test querying on mobile
    const mobileList = await promotionsStore.listPromotions({
      slot: "category_top",
      device: "mobile",
      admin: false,
    });
    assert.ok(
      mobileList.some((p) => p.id === mobileOnlyPromo.id),
      "Mobile-only promo MUST be returned on mobile"
    );

    await promotionsStore.deletePromotion(mobileOnlyPromo.id);
  });

  // TEST 5: Deterministic Priority Ordering
  await test("5. Priority Ordering: Highest priority renders first", async () => {
    const promoLow = await promotionsStore.savePromotion({
      name: "Low Priority Strip",
      type: "ticker",
      status: "published",
      enabled: true,
      placement: { slot: "search_top", priority: 40 },
      content: { styling: {} },
    });

    const promoHigh = await promotionsStore.savePromotion({
      name: "High Priority Strip",
      type: "ticker",
      status: "published",
      enabled: true,
      placement: { slot: "search_top", priority: 160 },
      content: { styling: {} },
    });

    const list = await promotionsStore.listPromotions({ slot: "search_top", admin: false });
    assert.ok(list.length >= 2, "Must return at least 2 components");
    const highIdx = list.findIndex((p) => p.id === promoHigh.id);
    const lowIdx = list.findIndex((p) => p.id === promoLow.id);

    assert.ok(highIdx < lowIdx, `High priority (idx: ${highIdx}) must appear before low priority (idx: ${lowIdx})`);

    await promotionsStore.deletePromotion(promoLow.id);
    await promotionsStore.deletePromotion(promoHigh.id);
  });

  // TEST 6: Authoritative Server-Side Free Shipping Calculation
  await test("6. Authoritative Free Shipping: Correct calculation from shipping rules, zero client trust", async () => {
    const gameConfig = {
      gameType: "free_shipping_progress",
      thresholdType: "server_free_shipping",
      progressLabelFormat: "Add {remaining} for Free Delivery",
      successTitle: "Free Delivery Unlocked!",
    };

    const shippingRules = fileDb.findMany("shippingRules");
    const authoritativeThreshold = Number(shippingRules[0]?.freeShippingThreshold || 1500);

    // Test under-threshold subtotal
    const testSubtotalUnder = Math.max(0, authoritativeThreshold - 200);
    const resUnder = await promotionsStore.calculateGamificationProgress(gameConfig, testSubtotalUnder);
    assert.strictEqual(resUnder.computedThreshold, authoritativeThreshold, "Threshold must equal authoritative server rule");
    assert.strictEqual(resUnder.computedRemaining, 200, "Remaining must be exact difference");
    assert.strictEqual(resUnder.computedIsUnlocked, false, "Must not be unlocked when subtotal < threshold");

    // Test over-threshold subtotal
    const testSubtotalOver = authoritativeThreshold + 300;
    const resOver = await promotionsStore.calculateGamificationProgress(gameConfig, testSubtotalOver);
    assert.strictEqual(resOver.computedRemaining, 0, "Remaining must be 0 when unlocked");
    assert.strictEqual(resOver.computedProgressPercent, 100, "Progress must be 100% when unlocked");
    assert.strictEqual(resOver.computedIsUnlocked, true, "Must be unlocked when subtotal >= threshold");
  });

  // TEST 7: Global Emergency Kill Switches
  await test("7. Global Emergency Kill Switches: Master and component toggles work immediately", async () => {
    // 7.1 Master kill switch OFF
    await promotionsStore.updateGlobalSettings({ globalEnabled: false }, "audit-tester");
    const itemsOff = await promotionsStore.listPromotions({ admin: false });
    assert.strictEqual(itemsOff.length, 0, "When master switch is OFF, zero promotions must be returned");

    // 7.2 Turn master back ON, turn tickers OFF
    await promotionsStore.updateGlobalSettings({ globalEnabled: true, tickersEnabled: false }, "audit-tester");
    const itemsNoTickers = await promotionsStore.listPromotions({ admin: false });
    assert.ok(
      !itemsNoTickers.some((p) => p.type === "ticker"),
      "When tickersEnabled is false, no tickers may be returned"
    );

    // 7.3 Restore all switches to ON
    await promotionsStore.updateGlobalSettings(
      {
        globalEnabled: true,
        tickersEnabled: true,
        mediaEnabled: true,
        gamificationEnabled: true,
        affiliatePromosEnabled: true,
      },
      "audit-tester"
    );
    const restored = await promotionsStore.getGlobalSettings();
    assert.strictEqual(restored.globalEnabled, true);
    assert.strictEqual(restored.tickersEnabled, true);
  });

  // TEST 8: Component Duplication / Cloning
  await test("8. Duplication: Cloning creates independent draft with '(Copy)' suffix", async () => {
    const original = await promotionsStore.savePromotion({
      name: "Original Master Strip",
      type: "ticker",
      status: "published",
      enabled: true,
      placement: { slot: "global_above_footer", priority: 75 },
      content: { styling: { backgroundColor: "#2A0F3A" } },
    });

    const clone = await promotionsStore.duplicatePromotion(original.id);
    assert.notStrictEqual(clone.id, original.id, "Cloned component must receive new ID");
    assert.strictEqual(clone.name, "Original Master Strip (Copy)");
    assert.strictEqual(clone.status, "draft");
    assert.strictEqual(clone.enabled, false);

    await promotionsStore.deletePromotion(original.id);
    await promotionsStore.deletePromotion(clone.id);
  });

  // TEST 9: Affiliate Campaign CMS Management
  await test("9. Affiliate CMS: Campaign creation, retrieval, and partner attribution", async () => {
    const campaign = await promotionsStore.saveAffiliateCampaign({
      name: "Dr. Nair Functional Medicine",
      partnerId: "aff-dr-nair",
      partnerName: "Dr. Ananya Nair",
      status: "active",
      enabled: true,
      trackingKey: "dr-ananya-nair",
      commissionRate: 12,
      couponCode: "DRNAIR12",
      heroTitle: "Holistic Gut Health & Metabolic Clinical Protocols",
    });

    assert.ok(campaign.slug, "Campaign must have a generated slug");
    const fetched = await promotionsStore.getAffiliateCampaignBySlug(campaign.slug);
    assert.strictEqual(fetched?.name, "Dr. Nair Functional Medicine");
    assert.strictEqual(fetched?.couponCode, "DRNAIR12");

    await promotionsStore.deleteAffiliateCampaign(campaign.id);
  });

  // TEST 10: Impression & Click Analytics Tracking
  await test("10. Analytics: Impression and click tracking increment counters", async () => {
    const promo = await promotionsStore.savePromotion({
      name: "Analytics Track Target",
      type: "ticker",
      status: "published",
      enabled: true,
      placement: { slot: "global_top", priority: 100 },
      content: { styling: {} },
    });

    await promotionsStore.recordAnalytics(promo.id, "impression");
    await promotionsStore.recordAnalytics(promo.id, "impression");
    await promotionsStore.recordAnalytics(promo.id, "click");

    const after = await promotionsStore.getPromotionById(promo.id);
    assert.strictEqual(after?.analytics?.impressions, 2, "Impressions must be 2");
    assert.strictEqual(after?.analytics?.clicks, 1, "Clicks must be 1");

    await promotionsStore.deletePromotion(promo.id);
  });

  console.log("==================================================================");
  console.log(`TEST RUN COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPromotionsTestSuite().catch((err) => {
  console.error("Fatal test runner crash:", err);
  process.exit(1);
});
