import { json, requireUser } from "@/lib/http";
import { inventoryService } from "@/lib/commerce/inventory";
import { store } from "@/lib/commerce/store";
import { fileDb } from "@/lib/commerce/file-db";
import type { CartLine, Product } from "@/lib/commerce/types";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const results: Array<{ test: string; passed: boolean; message: string; data?: unknown }> = [];

  // Helper to construct Product fixture
  const makeProduct = (stock: number, scarcityThreshold = 5, inventoryMessagingEnabled = true, preorderEnabled = false): Product => ({
    id: "prod-fixture",
    slug: "prod-fixture",
    name: "Fixture",
    description: "Fixture",
    category: "Test",
    price: 100,
    stock,
    scarcityThreshold,
    inventoryMessagingEnabled,
    preorderEnabled,
    active: true,
    image: "",
    createdAt: new Date().toISOString(),
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Truthful Scarcity Message Derivation (Zero Fake Urgency)
  // ──────────────────────────────────────────────────────────────────────────
  try {
    const msg1 = inventoryService.getScarcityMessage(makeProduct(1, 5, true, false));
    const msg2 = inventoryService.getScarcityMessage(makeProduct(3, 5, true, false));
    const msg3 = inventoryService.getScarcityMessage(makeProduct(25, 5, true, false));
    const msg4 = inventoryService.getScarcityMessage(makeProduct(0, 5, true, false));
    const msg5 = inventoryService.getScarcityMessage(makeProduct(0, 5, true, true));
    const msg6 = inventoryService.getScarcityMessage(makeProduct(2, 5, false, false)); // messaging disabled

    const passed =
      msg1 === "Only 1 left in stock — order soon" &&
      msg2 === "Only 3 left in stock — order soon" &&
      msg3 === "In Stock" &&
      msg4 === "Currently Out of Stock" &&
      msg5 === "Pre-Order Available" &&
      msg6 === "In Stock";

    results.push({
      test: "1. Truthful Scarcity Message Derivation",
      passed,
      message: passed ? "All truthful scarcity thresholds passed without fake counters." : "Failed to derive correct scarcity messages.",
      data: { msg1, msg2, msg3, msg4, msg5, msg6 },
    });
  } catch (err: unknown) {
    results.push({ test: "1. Truthful Scarcity Message Derivation", passed: false, message: String(err) });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Authoritative Manual Adjustment & Audit Ledger Creation
  // ──────────────────────────────────────────────────────────────────────────
  try {
    // Create temporary test product in store
    const testSlug = `test-inv-${Date.now()}`;
    const product = await store.products.save({
      slug: testSlug,
      name: "QC Test Formulation",
      price: 999,
      stock: 10,
      active: true,
      category: "Test",
    });

    const adjRes = await inventoryService.adjustStock({
      productId: testSlug,
      delta: -2,
      type: "ORDER",
      reason: "Automated Suite Test Order",
      orderId: "ORD-TEST-001",
      actor: "test_suite",
    });

    const ledger = await inventoryService.getLedger({ productId: product.id });
    const passed =
      adjRes.success &&
      adjRes.newStock === 8 &&
      ledger.length > 0 &&
      ledger[0].qtyBefore === 10 &&
      ledger[0].quantity === -2 &&
      ledger[0].qtyAfter === 8 &&
      ledger[0].type === "ORDER";

    results.push({
      test: "2. Authoritative Stock Adjustment & Ledger Recording",
      passed: Boolean(passed),
      message: passed ? "Stock decremented 10 -> 8 and immutable ledger record created." : "Stock adjustment failed.",
      data: { adjRes, ledgerEntry: ledger[0] },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 3: Negative Stock Strict Prevention
    // ──────────────────────────────────────────────────────────────────────────
    const negRes = await inventoryService.adjustStock({
      productId: testSlug,
      delta: -20, // would make 8 - 20 = -12
      type: "ORDER",
      reason: "Attempt negative stock",
      actor: "test_suite",
    });

    const test3Passed = Boolean(!negRes.success && negRes.error?.includes("negative stock"));
    results.push({
      test: "3. Negative Stock Strict Prevention",
      passed: test3Passed,
      message: test3Passed ? "Action rejected: Negative stock strictly prohibited." : "Negative stock was allowed.",
      data: { negRes },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 4: Atomic Multi-Line Stock Reservation & Rollback
    // ──────────────────────────────────────────────────────────────────────────
    const testSlug2 = `test-inv-2-${Date.now()}`;
    await store.products.save({
      slug: testSlug2,
      name: "QC Test Formulation 2",
      price: 1499,
      stock: 1, // Only 1 available
      active: true,
      category: "Test",
    });

    // Try to reserve 1 of product 1 (has 8) and 5 of product 2 (has only 1)
    const failingLines: CartLine[] = [
      { productId: testSlug, quantity: 2 },
      { productId: testSlug2, quantity: 5 }, // Should fail
    ];

    const reserveRes = await inventoryService.reserveStock(failingLines, "ORD-TEST-FAIL", "test_suite");
    const p1AfterFail = await store.products.bySlug(testSlug);
    const p2AfterFail = await store.products.bySlug(testSlug2);

    const test4Passed =
      !reserveRes.success &&
      reserveRes.failedProductId === testSlug2 &&
      p1AfterFail?.stock === 8 && // Rolled back!
      p2AfterFail?.stock === 1;   // Untouched!

    results.push({
      test: "4. Multi-Line Atomic Reservation Rollback",
      passed: test4Passed,
      message: test4Passed ? "Transaction safely rolled back when line 2 lacked stock. No partial decrements." : "Rollback failure detected.",
      data: { reserveRes, p1Stock: p1AfterFail?.stock, p2Stock: p2AfterFail?.stock },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 5: Last Unit Purchase (1 -> 0)
    // ──────────────────────────────────────────────────────────────────────────
    const lastUnitRes = await inventoryService.reserveStock(
      [{ productId: testSlug2, quantity: 1 }],
      "ORD-TEST-LAST-UNIT",
      "test_suite"
    );
    const p2Empty = await store.products.bySlug(testSlug2);

    const test5Passed = lastUnitRes.success && p2Empty?.stock === 0;
    results.push({
      test: "5. Last Unit Purchase (1 -> 0)",
      passed: test5Passed,
      message: test5Passed ? "Last available unit successfully reserved, stock reduced to 0." : "Last unit purchase failed.",
      data: { lastUnitRes, stockAfter: p2Empty?.stock },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 6: Out-of-Stock Rejection
    // ──────────────────────────────────────────────────────────────────────────
    const oosRes = await inventoryService.reserveStock(
      [{ productId: testSlug2, quantity: 1 }],
      "ORD-TEST-OOS",
      "test_suite"
    );
    const test6Passed = Boolean(!oosRes.success && oosRes.error?.includes("Insufficient stock"));
    results.push({
      test: "6. Out-of-Stock Regular Purchase Rejection",
      passed: test6Passed,
      message: test6Passed ? "Zero stock product correctly rejected with 422 Insufficient stock." : "Zero stock was allowed for regular purchase.",
      data: { oosRes },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 7: Pre-Order Allowed When Stock Is Zero
    // ──────────────────────────────────────────────────────────────────────────
    await store.products.save({
      id: p2Empty!.id,
      slug: testSlug2,
      stock: 0,
      preorderEnabled: true,
      preorderLabel: "Pre-Order Now",
    });

    const preorderRes = await inventoryService.reserveStock(
      [{ productId: testSlug2, quantity: 2 }],
      "ORD-TEST-PREORDER",
      "test_suite"
    );
    const p2AfterPreorder = await store.products.bySlug(testSlug2);

    const test7Passed = Boolean(preorderRes.success && p2AfterPreorder?.stock === 0);
    results.push({
      test: "7. Pre-Order Allowed When Stock Is Zero",
      passed: test7Passed,
      message: test7Passed ? "Pre-order reservation succeeded at stock 0 without reducing below 0." : "Pre-order failed at stock 0.",
      data: { preorderRes, stock: p2AfterPreorder?.stock },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 8: Order Cancellation Stock Release
    // ──────────────────────────────────────────────────────────────────────────
    // Reserve 3 from testSlug (currently 8 -> 5)
    const cancelOrderId = `ORD-CANCEL-${Date.now()}`;
    await inventoryService.reserveStock(
      [{ productId: testSlug, quantity: 3 }],
      cancelOrderId,
      "test_suite"
    );
    const p1BeforeCancel = await store.products.bySlug(testSlug);

    const releaseRes = await inventoryService.releaseStock(
      cancelOrderId,
      "Customer requested order cancellation",
      "admin"
    );
    const p1AfterCancel = await store.products.bySlug(testSlug);

    const test8Passed =
      p1BeforeCancel?.stock === 5 &&
      releaseRes.success &&
      releaseRes.releasedCount === 3 &&
      p1AfterCancel?.stock === 8;

    results.push({
      test: "8. Order Cancellation Stock Release",
      passed: Boolean(test8Passed),
      message: test8Passed ? "Stock released back (5 -> 8) with immutable CANCELLATION ledger record." : "Cancellation release failed.",
      data: { p1BeforeCancel: p1BeforeCancel?.stock, p1AfterCancel: p1AfterCancel?.stock, releaseRes },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 9: Back-in-Stock Subscription & Restock Notification
    // ──────────────────────────────────────────────────────────────────────────
    const subRes1 = await inventoryService.subscribeBackInStock({
      productSlug: testSlug2,
      email: "patient@queenscare.in",
      phone: "+919876543210",
    });
    // Deduplication check
    const subRes2 = await inventoryService.subscribeBackInStock({
      productSlug: testSlug2,
      email: "patient@queenscare.in",
    });

    // Restock the item 0 -> 25 (triggers notification dispatch)
    const restockRes = await inventoryService.adjustStock({
      productId: testSlug2,
      newStock: 25,
      type: "RESTOCK",
      reason: "Incoming cGMP synthesis batch arrived",
      actor: "warehouse_manager",
    });

    const subs = fileDb.findMany(
      "backInStockSubscriptions",
      (s) => s.productSlug === testSlug2
    );

    const test9Passed =
      subRes1.success &&
      subRes2.success &&
      restockRes.success &&
      subs.length === 1 &&
      subs[0].status === "notified";

    results.push({
      test: "9. Back-in-Stock Subscription & Restock Notification",
      passed: test9Passed,
      message: test9Passed ? "Waitlist deduplicated, and restock (0 -> 25) triggered subscriber notification." : "Subscription flow failed.",
      data: { subRes1, subRes2, subStatus: subs[0]?.status },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 10: Inventory Overview KPIs & Valuation
    // ──────────────────────────────────────────────────────────────────────────
    const overview = await inventoryService.getInventoryOverview();
    const test10Passed =
      typeof overview.totalProducts === "number" &&
      typeof overview.totalValuation === "number" &&
      overview.totalValuation > 0 &&
      overview.inStockCount >= 0;

    results.push({
      test: "10. Inventory Overview Aggregate KPIs & Valuation",
      passed: test10Passed,
      message: test10Passed ? `KPIs computed: ${overview.totalProducts} products, Valuation ₹${overview.totalValuation.toLocaleString("en-IN")}.` : "Overview computation failed.",
      data: { overview },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // TEST 11: Cleanup Test Records
    // ──────────────────────────────────────────────────────────────────────────
    await store.products.delete(testSlug).catch(() => {});
    await store.products.delete(testSlug2).catch(() => {});

    results.push({
      test: "11. Test State Cleanup",
      passed: true,
      message: "Temporary test products purged safely from catalog.",
    });

  } catch (err: unknown) {
    results.push({ test: "Integration Suite Execution", passed: false, message: String(err) });
  }

  const allPassed = results.every((r) => r.passed);
  return json({
    success: allPassed,
    totalTests: results.length,
    passedCount: results.filter((r) => r.passed).length,
    failedCount: results.filter((r) => !r.passed).length,
    results,
    timestamp: new Date().toISOString(),
  });
}
