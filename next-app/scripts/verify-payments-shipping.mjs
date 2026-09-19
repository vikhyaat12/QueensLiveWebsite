// Comprehensive verification test for Payment Gateway Management & Shipping Integration
import http from "http";

const BASE_URL = "http://localhost:3000";

async function req(urlPath, options = {}) {
  const url = new URL(urlPath, BASE_URL);
  return new Promise((resolve, reject) => {
    const r = http.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      }
    );
    r.on("error", reject);
    if (options.body) {
      r.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    r.end();
  });
}

async function runTests() {
  console.log("===============================================================");
  console.log("QUEENS CARE LABORATORIES — PAYMENTS & SHIPPING E2E TEST SUITE");
  console.log("===============================================================\n");

  let adminCookie = "";

  // 1. Authenticate as Admin
  console.log("1. Authenticating as Admin (admin@queenscare.in)...");
  const loginRes = await req("/api/auth/login", {
    method: "POST",
    body: { email: "admin@queenscare.in", password: "QueensCare#Admin2026" },
  });

  if (loginRes.status === 200) {
    const rawCookie = loginRes.headers["set-cookie"];
    adminCookie = Array.isArray(rawCookie) ? rawCookie[0].split(";")[0] : rawCookie.split(";")[0];
    console.log("   ✓ Admin authenticated successfully. Cookie:", adminCookie);
  } else {
    throw new Error(`Admin login failed: ${JSON.stringify(loginRes.body)}`);
  }

  // 2. Fetch Payment Gateways via Admin API
  console.log("\n2. Admin fetching Payment Gateways list (/api/admin/payments)...");
  const gwListRes = await req("/api/admin/payments", {
    headers: { Cookie: adminCookie },
  });
  console.log("   Status:", gwListRes.status);
  const gateways = gwListRes.body.gateways || [];
  console.log("   Gateways count:", gateways.length);
  gateways.forEach((g) => console.log(`   - [${g.provider}] ${g.displayName} (Status: ${g.status}, Mode: ${g.mode}, Enabled: ${g.enabled})`));

  const hasRazorpay = gateways.some((g) => g.provider === "razorpay");
  const hasStripe = gateways.some((g) => g.provider === "stripe");
  const hasCashfree = gateways.some((g) => g.provider === "cashfree");
  const hasPayU = gateways.some((g) => g.provider === "payu");
  const hasPhonePe = gateways.some((g) => g.provider === "phonepe");
  const hasCOD = gateways.some((g) => g.provider === "cod");

  if (!hasRazorpay || !hasStripe || !hasCashfree || !hasPayU || !hasPhonePe || !hasCOD) {
    throw new Error("Missing required gateway providers in list.");
  }
  console.log("   ✓ All required gateways (Razorpay, Stripe, Cashfree, PayU, PhonePe, COD) present.");

  // 3. Test Security: Public endpoint MUST NOT expose secret keys
  console.log("\n3. Testing Security: Public Payment Gateways endpoint (/api/payments/public-gateways)...");
  const publicGwRes = await req("/api/payments/public-gateways");
  console.log("   Status:", publicGwRes.status);
  const publicGws = publicGwRes.body.gateways || [];
  console.log("   Enabled public gateways count:", publicGws.length);

  for (const g of publicGws) {
    if (g.credentials || g.secretKey || g.keySecret || g.saltKey || g.merchantSalt) {
      throw new Error(`CRITICAL SECURITY FAILURE: Gateway ${g.provider} exposed private credentials in public API!`);
    }
  }
  console.log("   ✓ Verified: Zero private secrets/salts are exposed in public API.");

  // 4. Test Payment Gateway Configuration Update & Persistence
  console.log("\n4. Testing Payment Gateway update & connection test...");
  const patchGwRes = await req("/api/admin/payments", {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: {
      id: "gw-razorpay",
      mode: "test",
      enabled: true,
      credentials: {
        keyId: "rzp_test_qc1234567890ab",
        keySecret: "sec_qc_secret_key_verified_99",
      },
    },
  });
  console.log("   PATCH Status:", patchGwRes.status);
  console.log("   Updated Gateway isConfigured:", patchGwRes.body.gateway?.isConfigured);

  // Test Gateway Connection endpoint
  const testConnRes = await req("/api/admin/payments/test", {
    method: "POST",
    headers: { Cookie: adminCookie },
    body: { id: "gw-razorpay" },
  });
  console.log("   Test Connection Result:", testConnRes.body);
  if (!testConnRes.body.success) {
    throw new Error("Razorpay connection test failed with valid key format.");
  }
  console.log("   ✓ Razorpay test connection succeeded.");

  // 5. Test Shipping Providers Admin API
  console.log("\n5. Admin fetching Shipping Providers list (/api/admin/shipping/providers)...");
  const shipListRes = await req("/api/admin/shipping/providers", {
    headers: { Cookie: adminCookie },
  });
  console.log("   Status:", shipListRes.status);
  const providers = shipListRes.body.providers || [];
  console.log("   Shipping providers count:", providers.length);
  providers.forEach((p) => console.log(`   - [${p.provider}] ${p.name} (Default: ${p.isDefault}, Status: ${p.status}, Enabled: ${p.enabled})`));

  const hasShiprocket = providers.some((p) => p.provider === "shiprocket");
  const hasDelhivery = providers.some((p) => p.provider === "delhivery");
  const hasShipway = providers.some((p) => p.provider === "shipway");
  const hasPickrr = providers.some((p) => p.provider === "pickrr");
  const hasNimbus = providers.some((p) => p.provider === "nimbuspost");
  const hasLocal = providers.some((p) => p.provider === "local");

  if (!hasShiprocket || !hasDelhivery || !hasShipway || !hasPickrr || !hasNimbus || !hasLocal) {
    throw new Error("Missing required shipping providers in list.");
  }
  console.log("   ✓ All required shipping providers (Shiprocket, Delhivery, Shipway, Pickrr, NimbusPost, Local) present.");

  // 6. Test Shipping Provider Update & Test Connection
  console.log("\n6. Testing Shipping Provider update & connection test...");
  const patchShipRes = await req("/api/admin/shipping/providers", {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: {
      id: "ship-shiprocket",
      mode: "test",
      enabled: true,
      credentials: {
        email: "logistics@queenscare.in",
        password: "sr_password_verified",
        pickupLocation: "Central Hub Mumbai Bandra",
      },
    },
  });
  console.log("   PATCH Status:", patchShipRes.status);

  const testShipConn = await req("/api/admin/shipping/providers/test", {
    method: "POST",
    headers: { Cookie: adminCookie },
    body: { id: "ship-shiprocket" },
  });
  console.log("   Shiprocket Test Connection Result:", testShipConn.body);
  if (!testShipConn.body.success) {
    throw new Error("Shiprocket connection test failed.");
  }
  console.log("   ✓ Shiprocket test connection succeeded.");

  // 7. Test Shipping Rate / Rule Engine Configuration
  console.log("\n7. Testing Shipping Rate & Rule Engine update (/api/admin/shipping/rules)...");
  const patchRulesRes = await req("/api/admin/shipping/rules", {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: {
      freeShippingThreshold: 1200,
      standardShippingFee: 99,
      expressShippingFee: 199,
      codHandlingFee: 20,
      estimatedDaysMetro: "2-3 business days",
      estimatedDaysNonMetro: "4-5 business days",
    },
  });
  console.log("   PATCH Rules Status:", patchRulesRes.status);
  console.log("   Updated Rules:", patchRulesRes.body.rules);

  // Check public rules endpoint
  const pubRulesRes = await req("/api/shipping/rules");
  console.log("   Public rules response:", pubRulesRes.body);
  if (pubRulesRes.body.freeShippingThreshold !== 1200) {
    throw new Error(`Expected freeShippingThreshold 1200, got ${pubRulesRes.body.freeShippingThreshold}`);
  }
  console.log("   ✓ Verified: Free shipping threshold updated to ₹1200 dynamically across public store.");

  // 8. Test PIN Code Serviceability & Delivery Estimate API
  console.log("\n8. Testing PIN Code Serviceability & Delivery Estimate (/api/shipping/serviceability)...");
  const metroPinRes = await req("/api/shipping/serviceability?pincode=400001&subtotal=1500");
  console.log("   Mumbai Metro PIN 400001 (subtotal ₹1500):", metroPinRes.body);
  if (!metroPinRes.body.serviceable || !metroPinRes.body.freeShippingEligible || metroPinRes.body.shippingFee !== 0) {
    throw new Error("Pincode 400001 should be serviceable and eligible for free shipping above ₹1200.");
  }
  console.log("   ✓ Metro pincode correctly calculates free shipping and delivery window.");

  const nonMetroPinRes = await req("/api/shipping/serviceability?pincode=248001&subtotal=800");
  console.log("   Non-Metro PIN 248001 (subtotal ₹800):", nonMetroPinRes.body);
  if (nonMetroPinRes.body.shippingFee !== 99 || nonMetroPinRes.body.freeShippingEligible) {
    throw new Error("Pincode 248001 with ₹800 subtotal should charge ₹99 standard shipping.");
  }
  console.log("   ✓ Non-Metro pincode correctly calculates ₹99 shipping charge.");

  // 9. Test End-to-End Checkout Order Creation with Dynamic Payment Method & Shipping
  console.log("\n9. Testing Order Placement with dynamic Payment Method & dynamic Shipping...");
  const prodRes = await req("/api/products");
  const validProduct = (prodRes.body.products || [])[0] || { slug: "sample-product", name: "Sample" };
  console.log("   Using product for checkout test:", validProduct.slug);

  const orderRes = await req("/api/orders", {
    method: "POST",
    body: {
      lines: [{ productId: validProduct.slug, quantity: 1 }],
      shipping: {
        fullName: "Vikram Malhotra",
        email: "vikram@example.com",
        phone: "+91 98765 43210",
        address: "74 Marine Drive, Nariman Point",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
      paymentMethod: "cod",
      shippingMethod: "standard",
    },
    headers: { Cookie: adminCookie },
  });

  console.log("   Order Creation Status:", orderRes.status);
  console.log("   Order Result:", {
    orderId: orderRes.body.order?.id,
    subtotal: orderRes.body.order?.subtotal,
    shippingFee: orderRes.body.order?.shippingFee,
    total: orderRes.body.order?.total,
    paymentMethod: orderRes.body.order?.paymentMethod,
    paymentStatus: orderRes.body.order?.paymentStatus,
    trackingCode: orderRes.body.order?.trackingCode,
  });

  if (orderRes.status !== 201 || !orderRes.body.order?.id) {
    throw new Error(`Order creation failed: ${JSON.stringify(orderRes.body)}`);
  }
  console.log("   ✓ Order placed successfully with configured paymentMethod ('cod') and dynamic shipping calculation.");

  // 10. Test Payment Intent Route with Gateway
  console.log("\n10. Testing Payment Intent creation (/api/checkout/payment-intent)...");
  const payIntentRes = await req("/api/checkout/payment-intent", {
    method: "POST",
    body: {
      orderId: orderRes.body.order.id,
      provider: "cod",
    },
  });
  console.log("   Payment Intent Status:", payIntentRes.status);
  console.log("   Payment Intent Response:", payIntentRes.body);
  if (payIntentRes.body.status !== "ready") {
    throw new Error("Payment intent for COD should be ready.");
  }
  console.log("   ✓ Payment Intent flow verified.");

  console.log("\n===============================================================");
  console.log("🎉 ALL 10 PAYMENTS & SHIPPING VERIFICATION TESTS PASSED!");
  console.log("===============================================================\n");
}

runTests().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
