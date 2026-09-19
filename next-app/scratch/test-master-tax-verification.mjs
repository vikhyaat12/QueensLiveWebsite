import assert from "node:assert";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

// Stub server-only so Node.js can import server-side modules outside Next.js runtime
const require = createRequire(import.meta.url);
try {
  const serverOnlyPath = require.resolve("server-only", { paths: ["c:\\Project\\QueensCareWebsite\\next-app"] });
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  };
} catch (e) {
  // Ignore if not resolvable
}

const NEXT_APP_DIR = "c:\\Project\\QueensCareWebsite\\next-app";

async function runTestSuite() {
  console.log("================================================================");
  console.log("QUEENS CARE — 20-TEST COMPREHENSIVE TAX & PRICING VERIFICATION");
  console.log("================================================================");

  const {
    calculateOrderPricing,
    validateDonation,
    getBusinessInfo,
    getTaxConfig,
  } = await import(pathToFileURL(path.join(NEXT_APP_DIR, "lib/commerce/pricing-engine.ts")).href);

  const {
    listTaxRules,
    getTaxRuleById,
    saveTaxRule,
    retireTaxRule,
    resolveProductTax,
    getDefaultTaxRule,
    DEFAULT_TAX_RULES,
  } = await import(pathToFileURL(path.join(NEXT_APP_DIR, "lib/commerce/tax-rules.ts")).href);

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

  // -------------------------------------------------------------------------
  // TEST 1: Intra-state 50/50 CGST + SGST split
  // -------------------------------------------------------------------------
  await test("TEST 1: Intra-state (MH -> MH) 50/50 CGST + SGST split", async () => {
    const res = await calculateOrderPricing({
      lines: [
        {
          productId: "med-1",
          name: "Pharma Syrup",
          unitPrice: 1000,
          quantity: 1,
          gstRate: 12,
          taxMode: "taxable",
          taxInclusive: false,
          hsnCode: "3004",
        },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "prepaid",
    });

    assert.strictEqual(res.isIntraState, true, "Must be intra-state");
    assert.strictEqual(res.totalIgst, 0, "IGST must be 0 for intra-state");
    assert.strictEqual(res.totalGst, 120, "Total GST must be ₹120 (12% of 1000)");
    assert.strictEqual(res.totalCgst, 60, "CGST must be exactly ₹60 (6%)");
    assert.strictEqual(res.totalSgst, 60, "SGST must be exactly ₹60 (6%)");
    assert.strictEqual(res.totalCgst + res.totalSgst, res.totalGst, "CGST + SGST must equal total GST");
  });

  // -------------------------------------------------------------------------
  // TEST 2: Inter-state 100% IGST verification
  // -------------------------------------------------------------------------
  await test("TEST 2: Inter-state (MH -> KA/DL) 100% IGST verification", async () => {
    const res = await calculateOrderPricing({
      lines: [
        {
          productId: "med-1",
          name: "Pharma Syrup",
          unitPrice: 1000,
          quantity: 1,
          gstRate: 12,
          taxMode: "taxable",
          taxInclusive: false,
          hsnCode: "3004",
        },
      ],
      shippingState: "Karnataka",
      shippingMethod: "free",
      paymentMethod: "prepaid",
    });

    assert.strictEqual(res.isIntraState, false, "Must be inter-state");
    assert.strictEqual(res.totalCgst, 0, "CGST must be 0 for inter-state");
    assert.strictEqual(res.totalSgst, 0, "SGST must be 0 for inter-state");
    assert.strictEqual(res.totalIgst, 120, "IGST must be exactly ₹120 (12% of 1000)");
    assert.strictEqual(res.totalGst, 120, "Total GST must match IGST");
  });

  // -------------------------------------------------------------------------
  // TEST 3: Tax-exclusive pricing verification
  // -------------------------------------------------------------------------
  await test("TEST 3: Tax-exclusive pricing (Taxable = Net, GST added on top)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        {
          productId: "item-ex",
          name: "Exclusive Formulation",
          unitPrice: 500,
          quantity: 2,
          gstRate: 18,
          taxMode: "taxable",
          taxInclusive: false,
        },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "prepaid",
    });

    // 2 * 500 = 1000 taxable. 18% GST = 180. Grand total = 1180
    assert.strictEqual(res.taxableProductValue, 1000, "Taxable product value must equal net price ₹1000");
    assert.strictEqual(res.totalGst, 180, "GST must be ₹180");
    assert.strictEqual(res.grandTotal, 1180, "Grand total must be ₹1180");
  });

  // -------------------------------------------------------------------------
  // TEST 4: Tax-inclusive pricing verification
  // -------------------------------------------------------------------------
  await test("TEST 4: Tax-inclusive pricing (Taxable = Net / (1 + Rate), Grand Total unchanged)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        {
          productId: "item-inc",
          name: "Inclusive Formulation",
          unitPrice: 1120,
          quantity: 1,
          gstRate: 12,
          taxMode: "taxable",
          taxInclusive: true,
        },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "prepaid",
    });

    // 1120 / 1.12 = 1000 taxable. GST = 120 (CGST 60, SGST 60). Grand total must remain 1120.
    assert.strictEqual(res.taxableProductValue, 1000, "Taxable product value must be ₹1000");
    assert.strictEqual(res.totalGst, 120, "GST must be ₹120");
    assert.strictEqual(res.totalCgst, 60, "CGST must be ₹60");
    assert.strictEqual(res.totalSgst, 60, "SGST must be ₹60");
    assert.strictEqual(res.grandTotal, 1120, "Customer pays exactly ₹1120 (not double taxed)");
  });

  // -------------------------------------------------------------------------
  // TEST 5: 0% Tax / Exempt product verification
  // -------------------------------------------------------------------------
  await test("TEST 5: 0% Tax / Exempt product verification", async () => {
    const res = await calculateOrderPricing({
      lines: [
        {
          productId: "exempt-1",
          name: "Life Saving Formulation",
          unitPrice: 400,
          quantity: 2,
          taxMode: "exempt",
          gstRate: 0,
        },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "prepaid",
    });

    assert.strictEqual(res.lines[0].taxTreatment, "exempt", "Tax treatment must be exempt");
    assert.strictEqual(res.totalGst, 0, "Total GST must be 0");
    assert.strictEqual(res.totalCgst, 0, "CGST must be 0");
    assert.strictEqual(res.totalSgst, 0, "SGST must be 0");
    assert.strictEqual(res.totalIgst, 0, "IGST must be 0");
    assert.strictEqual(res.taxableProductValue, 800, "Taxable/base product value equals ₹800");
    assert.strictEqual(res.grandTotal, 800, "Grand total equals base ₹800");
  });

  // -------------------------------------------------------------------------
  // TEST 6: Multi-rate cart verification
  // -------------------------------------------------------------------------
  await test("TEST 6: Multi-rate cart verification (0%, 5%, 12%, 18% in same cart)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "l0", name: "Exempt", unitPrice: 100, quantity: 1, gstRate: 0, taxMode: "exempt" },
        { productId: "l5", name: "Vaccine 5%", unitPrice: 200, quantity: 1, gstRate: 5, taxMode: "taxable", taxInclusive: false },
        { productId: "l12", name: "Medicine 12%", unitPrice: 300, quantity: 1, gstRate: 12, taxMode: "taxable", taxInclusive: false },
        { productId: "l18", name: "Skincare 18%", unitPrice: 400, quantity: 1, gstRate: 18, taxMode: "taxable", taxInclusive: false },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "prepaid",
    });

    // Taxes: 0% on 100 = 0
    // 5% on 200 = 10
    // 12% on 300 = 36
    // 18% on 400 = 72
    // Total GST = 0 + 10 + 36 + 72 = 118
    // Subtotal = 100 + 200 + 300 + 400 = 1000
    // Grand Total = 1000 + 118 = 1118
    assert.strictEqual(res.subtotal, 1000, "Subtotal must be ₹1000");
    assert.strictEqual(res.totalGst, 118, "Total GST must be ₹118");
    assert.strictEqual(res.totalCgst, 59, "CGST must be ₹59 (half of 118)");
    assert.strictEqual(res.totalSgst, 59, "SGST must be ₹59 (half of 118)");
    assert.strictEqual(res.grandTotal, 1118, "Grand total must be ₹1118");
  });

  // -------------------------------------------------------------------------
  // TEST 7: Product-level tax rate override verification
  // -------------------------------------------------------------------------
  await test("TEST 7: Product-level tax rate override verification", async () => {
    const resolved = await resolveProductTax({
      taxRuleId: "rule-pharma-12",
      gstRate: 5,
    });

    assert.strictEqual(resolved.isOverride, true, "Must flag as override");
    assert.strictEqual(resolved.gstRate, 5, "Effective GST rate must be overridden to 5%");
    assert.strictEqual(resolved.cgstRate, 2.5, "CGST rate must be 2.5%");
    assert.strictEqual(resolved.sgstRate, 2.5, "SGST rate must be 2.5%");
  });

  // -------------------------------------------------------------------------
  // TEST 8: Product-level tax category override verification
  // -------------------------------------------------------------------------
  await test("TEST 8: Product-level tax category override (exempt)", async () => {
    const resolved = await resolveProductTax({
      taxRuleId: "rule-pharma-12",
      taxCategory: "exempt",
    });

    assert.strictEqual(resolved.taxMode, "exempt", "Tax mode must resolve to exempt");
    assert.strictEqual(resolved.gstRate, 0, "GST rate must be 0 for exempt override");
  });

  // -------------------------------------------------------------------------
  // TEST 9: Missing tax rate fallback to default active rule
  // -------------------------------------------------------------------------
  await test("TEST 9: Missing tax rate fallback to active default rule", async () => {
    const defaultRule = await getDefaultTaxRule();
    const resolved = await resolveProductTax({});

    assert.strictEqual(resolved.gstRate, defaultRule.gstRate, "Must fallback to default rule GST rate");
    assert.strictEqual(resolved.ruleId, defaultRule.id, "Must link to default rule ID");
  });

  // -------------------------------------------------------------------------
  // TEST 10: Inactive / retired tax rule fallback
  // -------------------------------------------------------------------------
  await test("TEST 10: Inactive / retired tax rule fallback to default active rule", async () => {
    const defaultRule = await getDefaultTaxRule();
    const resolved = await resolveProductTax({ taxRuleId: "non-existent-retired-rule-xyz" });

    assert.strictEqual(resolved.gstRate, defaultRule.gstRate, "Must safely fallback to default rule rate");
    assert.strictEqual(resolved.ruleId, defaultRule.id, "Must safely link to active default rule");
  });

  // -------------------------------------------------------------------------
  // TEST 11: Free shipping threshold verification
  // -------------------------------------------------------------------------
  await test("TEST 11: Free shipping threshold verification (subtotal >= ₹999 -> free)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "P1", unitPrice: 1000, quantity: 1, gstRate: 0, taxMode: "exempt" },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "standard",
      paymentMethod: "prepaid",
    });

    assert.strictEqual(res.shippingCharge, 0, "Shipping charge must be ₹0 when subtotal >= ₹999 threshold");
  });

  // -------------------------------------------------------------------------
  // TEST 12: Paid shipping charge & shipping taxability verification
  // -------------------------------------------------------------------------
  await test("TEST 12: Paid shipping charge & shipping taxability verification", async () => {
    // Under free threshold (unitPrice: 400)
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "P1", unitPrice: 400, quantity: 1, gstRate: 0, taxMode: "exempt" },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "standard",
      paymentMethod: "prepaid",
    });

    assert.ok(res.shippingCharge > 0, "Standard shipping charge must be > 0 under threshold");
    const expectedTax = Math.round(res.shippingCharge * 0.18);
    assert.strictEqual(res.shippingTax, expectedTax, "Shipping tax must be 18% of shipping charge");
  });

  // -------------------------------------------------------------------------
  // TEST 13: Shipping override verification
  // -------------------------------------------------------------------------
  await test("TEST 13: Shipping override verification (shippingChargeOverride)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "P1", unitPrice: 400, quantity: 1, gstRate: 0, taxMode: "exempt" },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "standard",
      shippingChargeOverride: 49,
      paymentMethod: "prepaid",
    });

    assert.strictEqual(res.shippingCharge, 49, "Shipping charge must strictly match override ₹49");
  });

  // -------------------------------------------------------------------------
  // TEST 14: Non-COD payment method cod fee = ₹0
  // -------------------------------------------------------------------------
  await test("TEST 14: Non-COD payment method cod fee = ₹0 verification", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "P1", unitPrice: 1000, quantity: 1, gstRate: 0, taxMode: "exempt" },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "razorpay",
    });

    assert.strictEqual(res.codFee, 0, "COD fee must be ₹0 for non-COD payment methods");
  });

  // -------------------------------------------------------------------------
  // TEST 15: COD fee verification
  // -------------------------------------------------------------------------
  await test("TEST 15: COD fee verification (cod fee applied on COD, codFeeOverride)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "P1", unitPrice: 1000, quantity: 1, gstRate: 0, taxMode: "exempt" },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "cod",
      codFeeOverride: 75,
    });

    assert.strictEqual(res.codFee, 75, "COD fee must match configured/overridden fee ₹75");
  });

  // -------------------------------------------------------------------------
  // TEST 16: Coupon discount verification
  // -------------------------------------------------------------------------
  await test("TEST 16: Coupon discount verification (applied proportionally across lines)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "P1", unitPrice: 600, quantity: 1, gstRate: 12, taxMode: "taxable", taxInclusive: false },
        { productId: "p2", name: "P2", unitPrice: 400, quantity: 1, gstRate: 12, taxMode: "taxable", taxInclusive: false },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      couponDiscount: 100,
      paymentMethod: "prepaid",
    });

    assert.strictEqual(res.totalDiscount, 100, "Total discount must be ₹100");
    assert.strictEqual(res.taxableProductValue, 900, "Taxable product value must be ₹900");
    assert.strictEqual(res.totalGst, 108, "Total GST must be ₹108");
    assert.strictEqual(res.grandTotal, 1008, "Grand total must be ₹1008");
  });

  // -------------------------------------------------------------------------
  // TEST 17: Donation validation verification
  // -------------------------------------------------------------------------
  await test("TEST 17: Donation validation (disabled = 0 valid, >0 rejected; enabled = bounded)", async () => {
    const vDisabled0 = validateDonation(0, { enabled: false });
    assert.strictEqual(vDisabled0.valid, true, "0 donation must be valid when disabled");

    const vDisabled50 = validateDonation(50, { enabled: false });
    assert.strictEqual(vDisabled50.valid, false, ">0 donation must be rejected when disabled");

    const vEnabledValid = validateDonation(100, {
      enabled: true,
      customAmountEnabled: true,
      customMin: 10,
      customMax: 500,
      presetAmounts: [10, 50, 100],
    });
    assert.strictEqual(vEnabledValid.valid, true, "100 donation must be valid");
    assert.strictEqual(vEnabledValid.amount, 100, "Amount must be 100");

    const vEnabledTooHigh = validateDonation(1000, {
      enabled: true,
      customAmountEnabled: true,
      customMin: 10,
      customMax: 500,
      presetAmounts: [10, 50, 100],
    });
    assert.strictEqual(vEnabledTooHigh.valid, false, "1000 donation must be rejected when max is 500");
  });

  // -------------------------------------------------------------------------
  // TEST 18: Invoice snapshot preservation verification
  // -------------------------------------------------------------------------
  await test("TEST 18: Invoice snapshot preservation (frozen snapshot immutability)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "Formulation Alpha", unitPrice: 500, quantity: 2, gstRate: 12, taxMode: "taxable", taxInclusive: true, hsnCode: "3004" },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "prepaid",
    });

    const snapshot = {
      version: 3,
      orderId: "ord-test-snap",
      lines: res.lines,
      totalGst: res.totalGst,
      grandTotal: res.grandTotal,
    };

    assert.strictEqual(snapshot.lines.length, 1);
    assert.strictEqual(snapshot.lines[0].hsnCode, "3004");
    assert.strictEqual(snapshot.totalGst, res.totalGst);
    assert.strictEqual(snapshot.grandTotal, res.grandTotal);
  });

  // -------------------------------------------------------------------------
  // TEST 19: HSN grouping summary verification
  // -------------------------------------------------------------------------
  await test("TEST 19: HSN grouping summary (gstBreakdown groups by HSN and rate)", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "Item 1", unitPrice: 500, quantity: 1, gstRate: 12, hsnCode: "3004", taxMode: "taxable", taxInclusive: false },
        { productId: "p2", name: "Item 2", unitPrice: 300, quantity: 1, gstRate: 12, hsnCode: "3004", taxMode: "taxable", taxInclusive: false },
        { productId: "p3", name: "Item 3", unitPrice: 400, quantity: 1, gstRate: 18, hsnCode: "3304", taxMode: "taxable", taxInclusive: false },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "free",
      paymentMethod: "prepaid",
    });

    assert.strictEqual(res.gstBreakdown.length, 2, "Must group into exactly 2 HSN+Rate entries");
    const g1 = res.gstBreakdown.find((g) => g.hsnCode === "3004");
    const g2 = res.gstBreakdown.find((g) => g.hsnCode === "3304");

    assert.ok(g1, "HSN 3004 group must exist");
    assert.strictEqual(g1?.taxableValue, 800, "HSN 3004 taxable must be ₹800");
    assert.strictEqual(g1?.totalTax, 96, "HSN 3004 tax must be ₹96");

    assert.ok(g2, "HSN 3304 group must exist");
    assert.strictEqual(g2?.taxableValue, 400, "HSN 3304 taxable must be ₹400");
    assert.strictEqual(g2?.totalTax, 72, "HSN 3304 tax must be ₹72");
  });

  // -------------------------------------------------------------------------
  // TEST 20: Mathematical integrity of grand total
  // -------------------------------------------------------------------------
  await test("TEST 20: Mathematical integrity of grand total formula", async () => {
    const res = await calculateOrderPricing({
      lines: [
        { productId: "p1", name: "Item 1", unitPrice: 450, quantity: 1, gstRate: 12, taxMode: "taxable", taxInclusive: true },
        { productId: "p2", name: "Item 2", unitPrice: 350, quantity: 1, gstRate: 18, taxMode: "taxable", taxInclusive: false },
      ],
      shippingState: "Maharashtra",
      shippingMethod: "standard",
      shippingChargeOverride: 50,
      paymentMethod: "cod",
      codFeeOverride: 40,
    });

    assert.strictEqual(res.grandTotal, 962, `Grand total must be 962, got ${res.grandTotal}`);
    assert.strictEqual(res.codFee, 40, "COD fee must be 40");
    assert.strictEqual(res.shippingCharge, 50, "Shipping charge must be 50");
  });

  console.log("================================================================");
  console.log(`VERIFICATION SUMMARY: ${passedCount}/20 TESTS PASSED (${failedCount} failed)`);
  console.log("================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
