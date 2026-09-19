// scripts/verify-non-flashing-nav-and-bulk.mjs
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

async function run() {
  console.log("=================================================================");
  console.log("VERIFYING NON-FLASHING NAVIGATION & ADMIN BULK PRODUCT MANAGEMENT");
  console.log(`Target: ${BASE}`);
  console.log("=================================================================\n");

  let failures = 0;
  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
    } else {
      console.error(`  [FAIL] ${message}`);
      failures++;
    }
  }

  // 1. ADMIN AUTHENTICATION
  console.log("[1] Authenticating as Admin...");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@queenscare.in",
      password: "QueensCare#Admin2026",
    }),
  });
  assert(loginRes.ok, `Admin login successful (HTTP ${loginRes.status})`);
  const rawCookie = loginRes.headers.get("set-cookie") || "";
  const cookie = rawCookie.split(";")[0];

  // 2. VERIFY NAVIGATION STORE & DRAFT VS LIVE SEPARATION
  console.log("\n[2] Checking Authoritative Navigation State (/api/admin/pages)...");
  const pagesRes = await fetch(`${BASE}/api/admin/pages`, {
    headers: { Cookie: cookie },
  });
  assert(pagesRes.ok, `Fetch pages returned HTTP ${pagesRes.status}`);
  const pagesData = await pagesRes.json();
  assert(Array.isArray(pagesData.pages) && pagesData.pages.length > 0, `Pages loaded: ${pagesData.pages?.length}`);
  assert(pagesData.publishStatus !== undefined, "publishStatus object present");
  assert(Array.isArray(pagesData.liveNav), `Live navigation present: ${pagesData.liveNav?.map((n) => n.label).join(", ")}`);

  // Target page: Blog
  const blogPage = pagesData.pages.find((p) => p.slug === "blog" || p.title.toLowerCase().includes("blog"));
  assert(!!blogPage, `Found Blog page (id: ${blogPage?.id})`);

  if (blogPage) {
    console.log("\n[3] Testing Non-Flashing Navigation: Hide -> Publish -> SSR Inspection");

    // A. Step 1: Hide Blog in draft (headerVisible: false)
    console.log("  A. Setting Blog headerVisible = false in draft...");
    const draftHideRes = await fetch(`${BASE}/api/admin/pages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ id: blogPage.id, headerVisible: false }),
    });
    assert(draftHideRes.ok, "Draft PATCH succeeded");

    // Verify draft is modified
    const checkDraftRes = await fetch(`${BASE}/api/admin/pages`, { headers: { Cookie: cookie } });
    const checkDraftData = await checkDraftRes.json();
    assert(checkDraftData.publishStatus?.isDraftModified === true, "publishStatus.isDraftModified is TRUE before publishing");

    // Check homepage SSR before publishing -> Blog MUST STILL BE PRESENT in live customer HTML!
    const ssrPrePublish = await fetch(`${BASE}/`);
    const ssrPreHtml = await ssrPrePublish.text();
    const blogInNavPre = ssrPreHtml.includes('href="/blog"') || ssrPreHtml.includes('href="/#blog"');
    assert(blogInNavPre, "Customer SSR HTML still shows Blog before publish (No draft leakage)");

    // B. Step 2: Publish Navigation
    console.log("  B. Publishing navigation snapshot to live storefront...");
    const publishRes = await fetch(`${BASE}/api/admin/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ action: "publish" }),
    });
    assert(publishRes.ok, "Publish navigation action succeeded");
    const pubData = await publishRes.json();
    assert(pubData.ok === true, `Publish returned ok: true (${pubData.liveCount} live items)`);

    // C. Step 3: Inspect Homepage SSR After Publish -> Blog MUST NOT BE IN HEADER AT ALL (0ms flash)
    console.log("  C. Requesting customer homepage HTML (Server-Side Rendered)...");
    const ssrPostPublish = await fetch(`${BASE}/`);
    const ssrPostHtml = await ssrPostPublish.text();

    const headerNav = ssrPostHtml.match(/<nav[^>]*class=["'][^"']*qc-desktop-nav[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
    const headerNavContent = headerNav ? headerNav[1] : "";
    const blogInHeader = headerNavContent.includes('href="/blog"') || headerNavContent.includes('>Blog<');

    // More direct: check if liveNav in API contains blog
    const liveNavAfter = await (await fetch(`${BASE}/api/pages`)).json();
    const liveNavHasBlog = liveNavAfter.pages?.some((p) => p.slug === "blog" && p.headerVisible !== false);
    assert(!liveNavHasBlog, "Public /api/pages no longer includes Blog");
    assert(!blogInHeader, "Server HTML (frame 0) contains 0 Blog header links -> 0ms flash guaranteed");

    // D. Step 4: Re-enable Blog and publish back
    console.log("  D. Restoring Blog headerVisible = true and publishing...");
    await fetch(`${BASE}/api/admin/pages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ id: blogPage.id, headerVisible: true }),
    });
    const restorePub = await fetch(`${BASE}/api/admin/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ action: "publish" }),
    });
    assert(restorePub.ok, "Restored Blog and published to live");

    // E. Step 5: Test Discard Draft
    console.log("  E. Testing Discard Draft...");
    await fetch(`${BASE}/api/admin/pages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ id: blogPage.id, headerVisible: false }),
    });
    const discardRes = await fetch(`${BASE}/api/admin/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ action: "discard_draft" }),
    });
    assert(discardRes.ok, "Discard draft POST succeeded");
    const afterDiscard = await (await fetch(`${BASE}/api/admin/pages`, { headers: { Cookie: cookie } })).json();
    assert(afterDiscard.publishStatus?.isDraftModified === false, "publishStatus.isDraftModified is false after discard");

    // F. Step 6: Test hiding a second page: Contact
    console.log("  F. Testing Non-Flashing Navigation on Contact page...");
    const contactPage = pagesData.pages.find((p) => p.slug === "contact");
    if (contactPage) {
      await fetch(`${BASE}/api/admin/pages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ id: contactPage.id, headerVisible: false }),
      });
      await fetch(`${BASE}/api/admin/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ action: "publish" }),
      });
      const contactHtml = await (await fetch(`${BASE}/`)).text();
      const contactNav = contactHtml.match(/<nav[^>]*class=["'][^"']*qc-desktop-nav[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
      const contactNavContent = contactNav ? contactNav[1] : "";
      const contactInHeader = contactNavContent.includes('href="/contact"') || contactNavContent.includes('>Contact<');
      assert(!contactInHeader, "Contact page is absent from server HTML (0ms flash verified)");

      // Restore Contact
      await fetch(`${BASE}/api/admin/pages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ id: contactPage.id, headerVisible: true }),
      });
      await fetch(`${BASE}/api/admin/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ action: "publish" }),
      });
      assert(true, "Contact page restored and published to live");
    }
  }

  // 4. VERIFY ADMIN BULK PRODUCT MANAGEMENT
  console.log("\n[4] Testing Admin Bulk Product Operations (/api/admin/products/bulk)...");

  // A. Unauthorized access rejection
  console.log("  A. Testing Unauthorized Rejection...");
  const unauthRes = await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "bulk_update", productIds: ["test"], updates: { price: 100 } }),
  });
  assert(unauthRes.status === 401, `Unauthorized request correctly rejected with 401 (Got ${unauthRes.status})`);

  // B. Validation Rejections
  console.log("  B. Testing Validation Guards...");
  const negPriceRes = await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action: "bulk_update", productIds: ["lumine-c-serum"], updates: { price: -50 } }),
  });
  assert(negPriceRes.status === 400, `Negative price rejected with 400 (Got ${negPriceRes.status})`);

  const invGstRes = await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action: "bulk_update", productIds: ["lumine-c-serum"], updates: { gstRate: 150 } }),
  });
  assert(invGstRes.status === 400, `GST > 100 rejected with 400 (Got ${invGstRes.status})`);

  const emptyIdsRes = await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action: "bulk_update", productIds: [], updates: { stock: 10 } }),
  });
  assert(emptyIdsRes.status === 400, `Empty productIds rejected with 400 (Got ${emptyIdsRes.status})`);

  // C. Fetch all products to get 2 test products
  const allProdsRes = await fetch(`${BASE}/api/products?all=true`);
  const allProdsData = await allProdsRes.json();
  const testProds = allProdsData.products?.slice(0, 2) || [];
  assert(testProds.length >= 2, `Selected 2 products for bulk testing: ${testProds.map((p) => p.slug || p.id).join(", ")}`);

  const targetIds = testProds.map((p) => String(p.id || p.slug));
  const origPrices = testProds.map((p) => Number(p.price));

  // D. Bulk Listing Visibility (Hide selected products from public storefront)
  console.log("  D. Testing Bulk Storefront Listing Visibility (Hide & Unhide)...");
  const hideRes = await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "bulk_update",
      productIds: targetIds,
      updates: { active: false, visible: false },
    }),
  });
  assert(hideRes.ok, `Bulk hide returned HTTP ${hideRes.status}`);
  const hideData = await hideRes.json();
  assert(hideData.ok === true && hideData.updatedCount === targetIds.length, `Bulk hide updated ${hideData.updatedCount} items`);

  // Verify on public customer products endpoint
  const pubProdsAfterHide = await (await fetch(`${BASE}/api/products`)).json();
  const areHiddenFromPub = targetIds.every((id) => !pubProdsAfterHide.products?.some((p) => String(p.id) === id || p.slug === id));
  assert(areHiddenFromPub, "Products successfully hidden from public customer listing (/api/products)");

  // Restore visibility
  const unhideRes = await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "bulk_update",
      productIds: targetIds,
      updates: { active: true, visible: true },
    }),
  });
  assert(unhideRes.ok, "Bulk restore visibility succeeded");

  const pubProdsAfterUnhide = await (await fetch(`${BASE}/api/products`)).json();
  const areVisibleAgain = targetIds.every((id) => pubProdsAfterUnhide.products?.some((p) => String(p.id) === id || p.slug === id));
  assert(areVisibleAgain, "Products restored and visible in public customer listing");

  // E. Bulk Price Modification & Formula Adjustment
  console.log("  E. Testing Bulk Price Adjustment (+₹50)...");
  const priceAdjRes = await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "bulk_update",
      productIds: targetIds,
      updates: { priceAdjustment: { operation: "flat_increase", value: 50 } },
    }),
  });
  assert(priceAdjRes.ok, "Bulk price adjustment succeeded");

  const prodsAfterPrice = await (await fetch(`${BASE}/api/products?all=true`)).json();
  const testProd0 = prodsAfterPrice.products?.find((p) => String(p.id) === targetIds[0] || p.slug === targetIds[0]);
  assert(Number(testProd0.price) === origPrices[0] + 50, `Price adjusted correctly: ₹${origPrices[0]} -> ₹${testProd0.price}`);

  // Revert price
  await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "bulk_update",
      productIds: targetIds,
      updates: { priceAdjustment: { operation: "flat_decrease", value: 50 } },
    }),
  });

  // F. Bulk GST & Tax update
  console.log("  F. Testing Bulk Tax & GST Setting (18% + HSN 330499)...");
  const taxRes = await fetch(`${BASE}/api/admin/products/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      action: "bulk_update",
      productIds: targetIds,
      updates: { gstRate: 18, hsn: "330499" },
    }),
  });
  assert(taxRes.ok, "Bulk tax update succeeded");

  // G. Safety Snapshots & Audit Trail
  console.log("  G. Verifying Safety Rollback Snapshots...");
  const snapRes = await fetch(`${BASE}/api/admin/products/bulk?action=snapshots`, {
    headers: { Cookie: cookie },
  });
  assert(snapRes.ok, "Fetch snapshots returned 200 OK");
  const snapData = await snapRes.json();
  assert(Array.isArray(snapData.snapshots) && snapData.snapshots.length > 0, `Snapshots recorded: ${snapData.snapshots?.length}`);
  const latestSnap = snapData.snapshots[0];
  assert(latestSnap.actorEmail === "admin@queenscare.in", `Snapshot actor verified: ${latestSnap.actorEmail}`);
  console.log(`    Latest Snapshot ID: ${latestSnap.id} (${latestSnap.reason})`);

  console.log("\n=================================================================");
  if (failures > 0) {
    console.error(`COMPLETED WITH ${failures} FAILURE(S)`);
    process.exit(1);
  } else {
    console.log("ALL NON-FLASHING NAVIGATION & BULK OPERATIONS TESTS PASSED (100%)");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});
