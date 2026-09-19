import http from "http";

const BASE_URL = "http://127.0.0.1:3000";

function req(urlPath, options = {}) {
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
  console.log("==================================================");
  console.log("QUEENS CARE — GLOBAL FOOTER CMS TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. PUBLIC API GET
    console.log("--- 1. Testing Public GET /api/footer ---");
    const pubRes = await req("/api/footer");
    assert(pubRes.status === 200, `GET /api/footer returned status 200 (Got ${pubRes.status})`);
    const pubData = pubRes.body;
    assert(pubData.success === true, "Public response has success: true");
    assert(pubData.config && typeof pubData.config === "object", "Public response has config object");

    // Check brand
    assert(typeof pubData.config.brand.aboutText === "string" && pubData.config.brand.aboutText.length > 10, "Brand aboutText is configured");
    assert(pubData.config.brand.logoUrl.includes(".png"), "Brand logo URL is present");

    // Check Trust Strip
    assert(Array.isArray(pubData.config.trustStrip?.items) && pubData.config.trustStrip.items.length >= 4, "Trust strip contains at least 4 items");

    // Check Columns
    assert(Array.isArray(pubData.config.columns) && pubData.config.columns.length >= 2, "Columns array contains at least 2 columns");
    const firstCol = pubData.config.columns[0];
    assert(Array.isArray(firstCol.links) && firstCol.links.length >= 3, `First column '${firstCol.title}' has at least 3 links`);

    // Check Token Interpolation
    const copyright = pubData.config.copyright?.template || "";
    const currentYear = new Date().getFullYear().toString();
    assert(copyright.includes(currentYear), `Copyright contains interpolated current year '${currentYear}' (Got: '${copyright}')`);
    assert(!copyright.includes("{{YEAR}}"), "Copyright template tokens are fully resolved (no {{YEAR}} remaining)");

    // 2. UNAUTHORIZED ADMIN ACCESS
    console.log("\n--- 2. Testing Security & Admin RBAC ---");
    const unauthGet = await req("/api/admin/footer");
    assert(unauthGet.status === 401, `Unauthorized GET /api/admin/footer rejected with 401 (Got ${unauthGet.status})`);

    const unauthPut = await req("/api/admin/footer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: { action: "publish", config: pubData.config },
    });
    assert(unauthPut.status === 401 || unauthPut.status === 403, `Unauthorized PUT /api/admin/footer rejected with 401/403 (Got ${unauthPut.status})`);

    // 3. ADMIN AUTHENTICATED TESTS
    console.log("\n--- 3. Testing Admin Login & Footer Management ---");
    const loginRes = await req("/api/auth/login", {
      method: "POST",
      body: { email: "admin@queenscare.in", password: "QueensCare#Admin2026" },
    });
    assert(loginRes.status === 200, "Admin login successful");
    const setCookie = loginRes.headers["set-cookie"];
    const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie || "").split(";")[0];
    assert(cookie.includes("qc_session"), `Session cookie received: ${cookie.slice(0, 20)}...`);

    const authHeaders = {
      "Content-Type": "application/json",
      Cookie: cookie,
      Origin: BASE_URL,
      Referer: `${BASE_URL}/admin`,
    };

    // Admin GET
    const adminGet = await req("/api/admin/footer", { headers: authHeaders });
    assert(adminGet.status === 200, `Admin GET /api/admin/footer returned 200 (Got ${adminGet.status})`);
    const adminData = adminGet.body;
    assert(adminData.success === true, "Admin GET response has success: true");
    assert(Array.isArray(adminData.pages) && adminData.pages.length > 0, `Admin response includes CMS pages list (${adminData.pages?.length} pages)`);
    assert(Array.isArray(adminData.snapshots), "Admin response includes snapshots array");

    // Admin Save Draft
    console.log("\n--- 4. Testing Save Draft ---");
    const modifiedConfig = structuredClone(adminData.config);
    const testTagline = `Tested Live Draft @ ${Date.now()}`;
    modifiedConfig.trustStrip.tagline = testTagline;

    const draftRes = await req("/api/admin/footer", {
      method: "PUT",
      headers: authHeaders,
      body: {
        action: "save_draft",
        config: modifiedConfig,
      },
    });
    assert(draftRes.status === 200, `Save draft returned 200 (Got ${draftRes.status})`);
    const draftData = draftRes.body;
    assert(draftData.success === true, "Draft response has success: true");
    assert(draftData.config.isPublished === false, "Draft config has isPublished: false");

    // Admin Publish Live
    console.log("\n--- 5. Testing Publish Live & Snapshot Creation ---");
    const publishRes = await req("/api/admin/footer", {
      method: "PUT",
      headers: authHeaders,
      body: {
        action: "publish",
        config: modifiedConfig,
        summary: "Automated test publish verification",
      },
    });
    assert(publishRes.status === 200, `Publish returned 200 (Got ${publishRes.status})`);
    const publishData = publishRes.body;
    assert(publishData.success === true, "Publish response has success: true");
    assert(publishData.config.isPublished === true, "Published config has isPublished: true");
    assert(publishData.snapshots.length > 0, `Snapshot history updated (Count: ${publishData.snapshots.length})`);

    // Verify live public endpoint shows new published value
    const rePubRes = await req("/api/footer");
    const rePubData = rePubRes.body;
    assert(rePubData.config.trustStrip.tagline === testTagline, `Public endpoint immediately serves published tagline '${testTagline}'`);

    // Admin Snapshot Rollback
    console.log("\n--- 6. Testing 1-Click Rollback ---");
    const latestSnapshot = publishData.snapshots[0];
    const rollbackRes = await req("/api/admin/footer", {
      method: "PUT",
      headers: authHeaders,
      body: {
        action: "rollback",
        snapshotId: latestSnapshot.id,
      },
    });
    assert(rollbackRes.status === 200, `Rollback returned 200 (Got ${rollbackRes.status})`);
    const rollbackData = rollbackRes.body;
    assert(rollbackData.success === true, "Rollback response has success: true");

    // Reset to brand defaults
    console.log("\n--- 7. Testing Reset to Factory Defaults ---");
    const resetRes = await req("/api/admin/footer", {
      method: "PUT",
      headers: authHeaders,
      body: { action: "reset_defaults" },
    });
    assert(resetRes.status === 200, `Reset to defaults returned 200 (Got ${resetRes.status})`);
    const resetData = resetRes.body;
    assert(resetData.success === true, "Reset response has success: true");
    assert(resetData.config.trustStrip.tagline.includes("Together for a healthier tomorrow"), "Tagline successfully restored to factory default");

  } catch (err) {
    console.error("Test execution failed:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
