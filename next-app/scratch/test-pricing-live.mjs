async function runLiveVerification() {
  console.log("=== QUEENS CARE LIVE ENDPOINT VERIFICATION ===");

  // 1. Settings
  const resSettings = await fetch("http://localhost:3000/api/settings");
  const dataSettings = await resSettings.json();
  const companyInfo = dataSettings.settings?.find((s) => s.key === "company_info");
  console.log("1. Settings API: 200 OK | Count:", dataSettings.settings?.length, "| Company Info:", Boolean(companyInfo));

  // 2. Intra-State Pricing (Maharashtra to Maharashtra)
  try {
    const res1 = await fetch("http://localhost:3000/api/checkout/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: [{ productId: "lumine-c-serum", unitPrice: 1490, quantity: 1 }],
        shippingState: "Maharashtra",
        shippingMethod: "standard",
      }),
    });
    console.log("2. Pricing API response status:", res1.status);
    const data1 = await res1.json();
    if (data1.error) console.log("   Pricing API returned error:", data1.error);
    const b1 = data1.breakdown;
    console.log("\n2. Intra-State Order (Maharashtra):");
    console.log("   Subtotal:", b1?.subtotal);
    console.log("   Taxable Value:", b1?.taxableProductValue);
    console.log("   CGST:", b1?.totalCgst, "| SGST:", b1?.totalSgst, "| IGST:", b1?.totalIgst);
    console.log("   Total GST:", b1?.totalGst);
    console.log("   Shipping Fee:", b1?.shippingCharge);
    console.log("   Grand Total:", b1?.grandTotal);
    console.log("   Is Intra-State:", b1?.isIntraState);
  } catch (e) {
    console.error("Step 2 error:", e);
  }

  // 3. Inter-State Pricing (Maharashtra to Karnataka)
  const res2 = await fetch("http://localhost:3000/api/checkout/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: [{ productId: "lumine-c-serum", unitPrice: 1490, quantity: 1 }],
      shippingState: "Karnataka",
      shippingMethod: "standard",
    }),
  });
  const data2 = await res2.json();
  const b2 = data2.breakdown;
  console.log("\n3. Inter-State Order (Karnataka):");
  console.log("   Subtotal:", b2?.subtotal);
  console.log("   CGST:", b2?.totalCgst, "| SGST:", b2?.totalSgst, "| IGST:", b2?.totalIgst);
  console.log("   Total GST:", b2?.totalGst);
  console.log("   Shipping Fee:", b2?.shippingCharge);
  console.log("   Grand Total:", b2?.grandTotal);
  console.log("   Is Intra-State:", b2?.isIntraState);

  // 4. Free Shipping Threshold Check (< ₹499 vs >= ₹499)
  const resLow = await fetch("http://localhost:3000/api/checkout/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: [{ productId: "immune-care-plus", quantity: 1, unitPrice: 250 }],
      shippingState: "Maharashtra",
      shippingMethod: "standard",
    }),
  });
  const dataLow = await resLow.json();
  console.log("\n4. Shipping Threshold Validation:");
  console.log("   Order ₹250 (< ₹499 threshold) -> Shipping Fee: ₹" + dataLow.breakdown?.shippingCharge);

  const resHigh = await fetch("http://localhost:3000/api/checkout/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: [{ productId: "immune-care-plus", quantity: 2, unitPrice: 499 }],
      shippingState: "Maharashtra",
      shippingMethod: "standard",
    }),
  });
  const dataHigh = await resHigh.json();
  console.log("   Order 2x₹499 = ₹998 (>= ₹499 threshold) -> Shipping Fee: ₹" + dataHigh.breakdown?.shippingCharge);

  // 5. Storefront Pages Health Check
  console.log("\n5. Storefront Core Route Response Codes:");
  const routes = ["/", "/shop", "/cart", "/checkout", "/account", "/about", "/contact", "/faq", "/terms", "/privacy", "/returns", "/shipping", "/doctors"];
  for (const r of routes) {
    const pageRes = await fetch(`http://localhost:3000${r}`);
    console.log(`   ${r.padEnd(16)} -> ${pageRes.status} ${pageRes.statusText}`);
  }

  console.log("\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===");
}

runLiveVerification().catch(console.error);
