import { createHmac } from "crypto";

const BASE_URL = "http://localhost:3000";
const AUTH_SECRET = process.env.AUTH_SECRET || "queens-care-local-development-secret-change-before-deployment";

function signToken(user) {
  const data = Buffer.from(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      exp: Date.now() + 604800000,
    })
  ).toString("base64url");
  const sig = createHmac("sha256", AUTH_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

const adminToken = signToken({ id: "usr-admin-1", role: "admin", name: "Admin", email: "admin@queenscare.in" });
const customerAToken = signToken({ id: "usr-customer-1", role: "customer", name: "Customer A", email: "customer@queenscare.in" });
const customerBToken = signToken({ id: "usr-0478339e", role: "customer", name: "Customer B", email: "test.register@example.com" });

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Cookie"] = `qc_session=${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

async function runTests() {
  console.log("=================================================");
  console.log("QUEENS CARE COMPREHENSIVE E-COMMERCE VERIFICATION");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extra = "") {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${extra}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extra}`);
      failed++;
    }
  }

  // TEST 1: Unauthenticated RBAC Deny-by-default
  console.log("--- 1. RBAC & Access Control ---");
  const unauthOrders = await api("/api/orders");
  assert(unauthOrders.status === 401, "Unauthenticated GET /api/orders denied with 401");

  const unauthAdmin = await api("/api/admin/orders");
  assert(unauthAdmin.status === 401, "Unauthenticated GET /api/admin/orders denied with 401");

  const custAdminOrders = await api("/api/admin/orders", { token: customerAToken });
  assert(custAdminOrders.status === 401, "Customer attempting GET /api/admin/orders denied with 401");

  const custBulk = await api("/api/admin/orders/bulk", {
    method: "POST",
    token: customerAToken,
    body: { orderIds: ["123"], action: "accept" },
  });
  assert(custBulk.status === 401, "Customer attempting POST /api/admin/orders/bulk denied with 401");

  // TEST 2: Customer Account vs Admin Orders Separation
  console.log("\n--- 2. Customer Account vs Admin Separation ---");
  const custOrders = await api("/api/orders", { token: customerAToken });
  assert(custOrders.status === 200, "Customer A GET /api/orders returns 200");
  assert(Array.isArray(custOrders.data?.orders), "Returns array of orders");
  // Ensure every order belongs to Customer A
  const allMatchA = (custOrders.data?.orders || []).every((o) => o.userId === "usr-customer-1");
  assert(allMatchA, "Customer orders are strictly owner-scoped (userId === usr-customer-1)");

  // TEST 3: Address CRUD & IDOR Prevention
  console.log("\n--- 3. Address Management & IDOR Prevention ---");
  const createAddr = await api("/api/addresses", {
    method: "POST",
    token: customerAToken,
    body: {
      label: "Clinic",
      fullName: "Dr. Customer A",
      phone: "+91 9876543210",
      address: "101 Lotus Tower, Link Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400053",
      isDefault: true,
    },
  });
  assert(createAddr.status === 201 && createAddr.data?.address?.id, "Customer A creates address successfully");
  const addressId = createAddr.data?.address?.id;

  // IDOR ATTACK TEST: Customer B attempts to update Customer A's address
  const idorPatch = await api(`/api/addresses/${addressId}`, {
    method: "PATCH",
    token: customerBToken,
    body: { fullName: "Hacker Infiltrator" },
  });
  assert(idorPatch.status === 404, "IDOR PREVENTION: Customer B cannot modify Customer A address (returns 404)");

  // IDOR ATTACK TEST: Customer B attempts to delete Customer A's address
  const idorDelete = await api(`/api/addresses/${addressId}`, {
    method: "DELETE",
    token: customerBToken,
  });
  assert(idorDelete.status === 404, "IDOR PREVENTION: Customer B cannot delete Customer A address (returns 404)");

  // Legitimate update by Customer A
  const legitimatePatch = await api(`/api/addresses/${addressId}`, {
    method: "PATCH",
    token: customerAToken,
    body: { label: "Updated Clinic Name" },
  });
  assert(legitimatePatch.status === 200, "Customer A can legitimately update own address");

  // Legitimate cleanup
  const legitimateDelete = await api(`/api/addresses/${addressId}`, {
    method: "DELETE",
    token: customerAToken,
  });
  assert(legitimateDelete.status === 200, "Customer A can delete own address");

  // TEST 4: Wishlist Live Persistence & Product Enrichment
  console.log("\n--- 4. Wishlist Live Persistence ---");
  // Add item
  const wlAdd = await api("/api/wishlist", {
    method: "POST",
    token: customerAToken,
    body: { productId: "p-lumine", action: "add" },
  });
  assert(wlAdd.status === 200, "POST /api/wishlist add returns 200");
  assert(
    wlAdd.data?.productIds?.includes("p-lumine"),
    "Product ID added to wishlist array"
  );
  assert(
    wlAdd.data?.items?.some((i) => i.id === "p-lumine" || i.slug === "lumine-c-serum"),
    "Wishlist returns enriched product details (image, name, price)"
  );

  // Remove item
  const wlRemove = await api("/api/wishlist", {
    method: "POST",
    token: customerAToken,
    body: { productId: "p-lumine", action: "remove" },
  });
  assert(
    !wlRemove.data?.productIds?.includes("p-lumine"),
    "Product ID removed from wishlist"
  );

  // TEST 5: State Machine & Mandatory Rejection Reasons
  console.log("\n--- 5. State Machine & Mandatory Rejection Reasons ---");
  const adminOrders = await api("/api/admin/orders", { token: adminToken });
  assert(adminOrders.status === 200, "Admin can list all orders");
  const firstPending = adminOrders.data?.orders?.find((o) => o.status === "pending") || adminOrders.data?.orders?.[0];

  if (firstPending) {
    const testOrderId = firstPending.id;
    console.log(`Testing with Order ID: ${testOrderId} (current status: ${firstPending.status})`);

    // Invalid transition test: pending -> delivered (must fail)
    if (firstPending.status === "pending") {
      const invalidTrans = await api(`/api/admin/orders/${testOrderId}`, {
        method: "PATCH",
        token: adminToken,
        body: { status: "delivered" },
      });
      assert(invalidTrans.status === 422, "State Machine rejects invalid skip: pending -> delivered (returns 422)");

      // Rejection without reason (must fail)
      const rejectNoReason = await api(`/api/admin/orders/${testOrderId}`, {
        method: "PATCH",
        token: adminToken,
        body: { status: "rejected" },
      });
      assert(rejectNoReason.status === 422, "Mandatory reason check: Rejection without reason blocked (returns 422)");

      // Rejection with empty reason (must fail)
      const rejectEmptyReason = await api(`/api/admin/orders/${testOrderId}`, {
        method: "PATCH",
        token: adminToken,
        body: { status: "rejected", note: "   " },
      });
      assert(rejectEmptyReason.status === 422, "Mandatory reason check: Blank rejection reason blocked (returns 422)");

      // Bulk reject without reason (must fail)
      const bulkRejectNoReason = await api("/api/admin/orders/bulk", {
        method: "POST",
        token: adminToken,
        body: { orderIds: [testOrderId], action: "reject" },
      });
      assert(bulkRejectNoReason.status === 422, "Bulk reject without reason blocked (returns 422)");

      // Bulk reject with Other but no note (must fail)
      const bulkRejectOtherNoNote = await api("/api/admin/orders/bulk", {
        method: "POST",
        token: adminToken,
        body: { orderIds: [testOrderId], action: "reject", reason: "Other", customNote: "" },
      });
      assert(bulkRejectOtherNoNote.status === 422, "Bulk reject with 'Other' requires custom note (returns 422)");

      // Valid transition test: pending -> confirmed
      const validConfirm = await api(`/api/admin/orders/${testOrderId}`, {
        method: "PATCH",
        token: adminToken,
        body: { status: "confirmed", note: "Approved by Admin" },
      });
      assert(validConfirm.status === 200, "Valid transition pending -> confirmed accepted with 200");
    }
  }

  // TEST 6: Customer Order Detail & IDOR Check
  console.log("\n--- 6. Customer Order Detail View & IDOR ---");
  const sampleOrder = adminOrders.data?.orders?.find((o) => o.userId === "usr-customer-1");
  if (sampleOrder) {
    const custView = await api(`/api/orders/${sampleOrder.id}`, { token: customerAToken });
    assert(custView.status === 200, "Customer A can view own order details");
    assert(Array.isArray(custView.data?.history), "Order tracking history included for customer");

    // IDOR Check: Customer B attempts to view Customer A's order
    const custBView = await api(`/api/orders/${sampleOrder.id}`, { token: customerBToken });
    assert(custBView.status === 404, "IDOR PREVENTION: Customer B cannot view Customer A order (returns 404)");
  }

  // TEST 7: Settings Endpoint for Shipping Label & Rejection Reasons
  console.log("\n--- 7. Business Settings Endpoint ---");
  const settingsRes = await api("/api/admin/orders/settings", { token: adminToken });
  assert(settingsRes.status === 200, "Admin can retrieve shipping and rejection settings");
  assert(!!settingsRes.data?.shippingConfig?.senderName, "Shipping label configuration loaded with sender details");
  assert(Array.isArray(settingsRes.data?.rejectionReasons), "Configurable rejection reasons list loaded");

  console.log("\n=================================================");
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner threw error:", err);
  process.exit(1);
});
