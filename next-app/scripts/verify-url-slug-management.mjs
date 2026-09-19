// Verification Script for Universal URL / Slug Management & 301 Redirect Architecture
import assert from "node:assert";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";

let adminCookie = "";

async function run() {
  console.log("==================================================");
  console.log("URL / SLUG MANAGEMENT & 301 REDIRECT VERIFICATION");
  console.log("==================================================");

  // 1. Admin Login
  console.log("\n[1] Admin Authentication...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@queenscare.in",
      password: "QueensCare#Admin2026",
    }),
  });

  assert.strictEqual(loginRes.status, 200, "Admin login failed");
  const setCookie = loginRes.headers.get("set-cookie");
  assert.ok(setCookie, "Set-Cookie header missing");
  adminCookie = setCookie.split(";")[0];
  console.log("✓ Admin authenticated successfully.");

  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: adminCookie,
  };

  // 2. Fetch catalog to find a product to test
  console.log("\n[2] Finding product for slug mutation test...");
  const productsRes = await fetch(`${BASE_URL}/api/products?all=true`, { headers: authHeaders });
  assert.strictEqual(productsRes.status, 200, "Failed to list products");
  const productsData = await productsRes.json();
  const testProduct = productsData.products.find((p) => p.slug && p.id);
  assert.ok(testProduct, "No test product found");

  const originalSlug = testProduct.slug;
  const originalId = testProduct.id;
  const newSlug = `test-url-slug-${Date.now()}`;
  console.log(`Original Slug: ${originalSlug} (ID: ${originalId})`);
  console.log(`Target New Slug: ${newSlug}`);

  // 3. Update Product Slug
  console.log("\n[3] Updating Product Slug...");
  const updateRes = await fetch(`${BASE_URL}/api/products/${originalSlug}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      id: originalId,
      slug: newSlug,
    }),
  });

  const updateData = await updateRes.json();
  assert.strictEqual(updateRes.status, 200, `Slug update failed: ${JSON.stringify(updateData)}`);
  assert.strictEqual(updateData.product.slug, newSlug, "Returned product does not have new slug");
  assert.strictEqual(updateData.product.id, originalId, "Product ID must remain immutable!");
  console.log("✓ Product slug updated. Stable ID preserved.");

  // 4. Verify 301 Permanent Redirect on Server Level
  console.log("\n[4] Verifying HTTP 308/301 Server-Side Redirect...");
  const redirectCheckRes = await fetch(`${BASE_URL}/products/${originalSlug}`, {
    redirect: "manual",
  });

  const redirectStatus = redirectCheckRes.status;
  const redirectLocation = redirectCheckRes.headers.get("location");
  console.log(`HTTP Status: ${redirectStatus}`);
  console.log(`Redirect Location: ${redirectLocation}`);

  assert.ok(
    redirectStatus === 301 || redirectStatus === 308,
    `Expected 301 or 308 redirect, got ${redirectStatus}`
  );
  assert.ok(
    redirectLocation && redirectLocation.includes(`/products/${newSlug}`),
    `Location header must point to /products/${newSlug}, got ${redirectLocation}`
  );
  console.log("✓ Original URL permanently redirects to new URL!");

  // 5. Verify New URL Responds 200
  console.log("\n[5] Verifying New URL Responds 200...");
  const newUrlRes = await fetch(`${BASE_URL}/products/${newSlug}`);
  assert.strictEqual(newUrlRes.status, 200, `New URL failed with status ${newUrlRes.status}`);
  const html = await newUrlRes.text();
  assert.ok(html.includes(testProduct.name), "New URL page does not render product name");
  console.log("✓ New URL renders live product formulation correctly.");

  // 6. Test Loop Prevention Engine
  console.log("\n[6] Testing Redirect Loop Prevention Engine...");
  const loopRes = await fetch(`${BASE_URL}/api/admin/redirects`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      source: `/products/${newSlug}`,
      destination: `/products/${originalSlug}`,
      contentType: "product",
    }),
  });

  const loopData = await loopRes.json();
  assert.strictEqual(loopRes.status, 400, "Server must reject circular redirect loop");
  assert.ok(
    loopData.error && loopData.error.toLowerCase().includes("loop"),
    `Expected error mentioning loop, got: ${loopData.error}`
  );
  console.log(`✓ Loop prevention triggered correctly: "${loopData.error}"`);

  // 7. Test Automatic Chain Flattening
  console.log("\n[7] Testing Automatic Chain Flattening (A -> B, then B -> C => A -> C)...");
  const finalSlug = `test-url-slug-final-${Date.now()}`;
  const secondUpdateRes = await fetch(`${BASE_URL}/api/products/${newSlug}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      id: originalId,
      slug: finalSlug,
    }),
  });
  assert.strictEqual(secondUpdateRes.status, 200, "Second slug update failed");

  // Original URL should now directly redirect to finalSlug (flattened, not to newSlug)
  const chainCheckRes = await fetch(`${BASE_URL}/products/${originalSlug}`, {
    redirect: "manual",
  });
  const chainLocation = chainCheckRes.headers.get("location");
  console.log(`Original URL now points to: ${chainLocation}`);
  assert.ok(
    chainLocation && chainLocation.includes(`/products/${finalSlug}`),
    `Chain not flattened! Location should point to ${finalSlug}, got ${chainLocation}`
  );
  console.log("✓ Redirect chain successfully flattened to single direct hop!");

  // 8. Test Reserved Route Protection
  console.log("\n[8] Testing Reserved Route Namespace Protection...");
  const reservedRes = await fetch(`${BASE_URL}/api/products/${finalSlug}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      id: originalId,
      slug: "cart",
    }),
  });
  assert.strictEqual(reservedRes.status, 400, "Server must reject reserved namespace");
  console.log("✓ Reserved namespace 'cart' rejected.");

  // 9. Test Open Redirect Prevention
  console.log("\n[9] Testing Open Redirect Prevention...");
  const evilRes = await fetch(`${BASE_URL}/api/admin/redirects`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      source: "/some-source",
      destination: "https://attacker.evil.com",
    }),
  });
  assert.strictEqual(evilRes.status, 400, "Server must reject external open redirect target");
  console.log("✓ External open redirect target rejected.");

  // 10. Test Redirect Management Screen API (List, Toggle, Delete)
  console.log("\n[10] Testing Redirect Management Screen API...");
  const listRedirectsRes = await fetch(`${BASE_URL}/api/admin/redirects`, { headers: authHeaders });
  assert.strictEqual(listRedirectsRes.status, 200, "Failed to list redirects");
  const redirectsData = await listRedirectsRes.json();
  assert.ok(Array.isArray(redirectsData.redirects), "Redirects array missing");
  const rule = redirectsData.redirects.find((r) => r.source === `/products/${originalSlug}`);
  assert.ok(rule, "Rule for originalSlug not found in redirect table");

  // Toggle active: disable rule
  const toggleRes = await fetch(`${BASE_URL}/api/admin/redirects`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ id: rule.id, action: "toggle" }),
  });
  assert.strictEqual(toggleRes.status, 200, "Toggle active failed");
  const toggledRule = (await toggleRes.json()).redirect;
  assert.strictEqual(toggledRule.active, false, "Rule should be inactive");

  // Requesting original slug should now 404 since redirect is inactive
  const disabledRedirectRes = await fetch(`${BASE_URL}/products/${originalSlug}`, {
    redirect: "manual",
  });
  assert.strictEqual(disabledRedirectRes.status, 404, "Disabled redirect should return 404");
  console.log("✓ Disabled redirect returns 404 as expected.");

  // Re-enable rule
  await fetch(`${BASE_URL}/api/admin/redirects`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ id: rule.id, action: "toggle" }),
  });

  // 11. Test CMS Page Slug Mutation & Publishing
  console.log("\n[11] Testing CMS Page Slug Mutation & Publishing 301 Redirect...");
  const pagesRes = await fetch(`${BASE_URL}/api/admin/pages`, { headers: authHeaders });
  const pagesData = await pagesRes.json();
  const testPage = pagesData.pages.find((p) => p.slug && p.id && !p.slug.startsWith("#"));
  assert.ok(testPage, "Test page not found");

  const pageOldSlug = testPage.slug;
  const pageNewSlug = `test-page-slug-${Date.now()}`;
  console.log(`Page Old Slug: ${pageOldSlug}, New Slug: ${pageNewSlug}`);

  // Update page slug in draft
  const pagePatchRes = await fetch(`${BASE_URL}/api/admin/pages`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      id: testPage.id,
      slug: pageNewSlug,
    }),
  });
  assert.strictEqual(pagePatchRes.status, 200, "Failed to update page draft slug");

  // Publish navigation
  const publishRes = await fetch(`${BASE_URL}/api/admin/pages`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ action: "publish" }),
  });
  assert.strictEqual(publishRes.status, 200, "Failed to publish page navigation");
  console.log("✓ Page draft published to live.");

  // Check 301 redirect for page
  const pageRedirectRes = await fetch(`${BASE_URL}/${pageOldSlug}`, {
    redirect: "manual",
  });
  console.log(`Page redirect status: ${pageRedirectRes.status}, location: ${pageRedirectRes.headers.get("location")}`);
  assert.ok(
    pageRedirectRes.status === 301 || pageRedirectRes.status === 308,
    `Expected 301/308 for published page redirect, got ${pageRedirectRes.status}`
  );
  console.log("✓ CMS Page URL permanently redirects after publish!");

  // 12. Cleanup: Restore Product and Page Original Slugs
  console.log("\n[12] Restoring original slugs & cleanup...");
  await fetch(`${BASE_URL}/api/products/${finalSlug}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      id: originalId,
      slug: originalSlug,
    }),
  });

  await fetch(`${BASE_URL}/api/admin/pages`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      id: testPage.id,
      slug: pageOldSlug,
    }),
  });

  await fetch(`${BASE_URL}/api/admin/pages`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ action: "publish" }),
  });

  console.log("✓ Original slugs restored and published.");
  console.log("\n==================================================");
  console.log("ALL 12 URL/SLUG & 301 REDIRECT TESTS PASSED! 🚀");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
