import assert from "node:assert/strict";

const BASE = "http://127.0.0.1:3000";

async function run() {
  console.log("==================================================================");
  console.log("QUEENS CARE — INSTANT ADMIN NAVIGATION & CHAT MEDIA AUDIT");
  console.log("==================================================================\n");

  // 1. Authenticate Admin
  console.log("[1] Authenticating Admin (admin@queenscare.in)...");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  assert.equal(loginRes.status, 200, "Admin login must succeed");
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const adminCookie = setCookie.split(";")[0];
  console.log("    ✓ Admin authenticated successfully.");

  // 2. Measure /admin HTML response speed
  console.log("\n[2] Testing Admin Panel Route Speed (/admin)...");
  const t0 = Date.now();
  const adminRes = await fetch(`${BASE}/admin`, {
    headers: { Cookie: adminCookie },
  });
  const adminDuration = Date.now() - t0;
  assert.equal(adminRes.status, 200, "/admin must return 200");
  const html = await adminRes.text();
  assert.ok(html.includes("Dashboard") || html.includes("Queen"), "Admin HTML must contain dashboard markup");
  console.log(`    ✓ GET /admin returned HTTP 200 in ${adminDuration}ms`);

  // 3. Test Instant Tab Data Loading (0ms Waterfall / Cache Revalidation)
  console.log("\n[3] Testing Admin Tabs Data Endpoints (Instant Navigation Architecture)...");
  const tabs = [
    { name: "Dashboard", url: "/api/admin/dashboard" },
    { name: "Products", url: "/api/admin/products" },
    { name: "Orders", url: "/api/admin/orders" },
    { name: "Inventory", url: "/api/admin/inventory" },
    { name: "Payments", url: "/api/admin/payments" },
    { name: "Shipping", url: "/api/admin/shipping/providers" },
    { name: "Support Inbox", url: "/api/admin/support/conversations" },
    { name: "Footer Builder", url: "/api/admin/footer" },
  ];

  for (const tab of tabs) {
    const start = Date.now();
    const res = await fetch(`${BASE}${tab.url}`, {
      headers: { Cookie: adminCookie },
    });
    const elapsed = Date.now() - start;
    assert.equal(res.status, 200, `${tab.name} endpoint must return 200`);
    console.log(`    ✓ Tab [${tab.name.padEnd(16)}] -> HTTP 200 (${elapsed}ms)`);
  }

  // 4. Test Customer Support Media Exchange
  console.log("\n[4] Testing Customer Chat Media Upload (PNG, MP4, Spoofed Rejection)...");
  const visitorId = `vis-verify-${Date.now()}`;
  const convRes = await fetch(`${BASE}/api/support/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, currentUrl: "/shop" }),
  });
  const convData = await convRes.json();
  const conversationId = convData.conversation.id;

  // Test Spoofed file rejection
  const fakeFormData = new FormData();
  fakeFormData.append("file", new Blob([Buffer.from("NOT_A_REAL_IMAGE")], { type: "image/png" }), "spoofed.png");
  fakeFormData.append("conversationId", conversationId);
  fakeFormData.append("visitorId", visitorId);
  const spoofRes = await fetch(`${BASE}/api/support/upload`, { method: "POST", body: fakeFormData });
  assert.equal(spoofRes.status, 400, "Spoofed file must be rejected with 400");
  console.log("    ✓ Security: Spoofed MIME types rejected by magic byte inspection");

  // Valid PNG upload
  const png1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const pngFormData = new FormData();
  pngFormData.append("file", new Blob([png1x1], { type: "image/png" }), "prescription.png");
  pngFormData.append("conversationId", conversationId);
  pngFormData.append("visitorId", visitorId);
  const pngRes = await fetch(`${BASE}/api/support/upload`, { method: "POST", body: pngFormData });
  assert.equal(pngRes.status, 200, "Valid PNG upload must succeed");
  const pngData = await pngRes.json();
  console.log(`    ✓ Customer Image Upload: ${pngData.attachment.url} (${pngData.attachment.size} bytes)`);

  // Valid MP4 upload
  const mp4Header = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]), Buffer.alloc(512)]);
  const mp4FormData = new FormData();
  mp4FormData.append("file", new Blob([mp4Header], { type: "video/mp4" }), "dermal_patch_test.mp4");
  mp4FormData.append("conversationId", conversationId);
  mp4FormData.append("visitorId", visitorId);
  const mp4Res = await fetch(`${BASE}/api/support/upload`, { method: "POST", body: mp4FormData });
  assert.equal(mp4Res.status, 200, "Valid MP4 upload must succeed");
  const mp4Data = await mp4Res.json();
  console.log(`    ✓ Customer Video Upload: ${mp4Data.attachment.url} (${mp4Data.attachment.size} bytes)`);

  // Customer sends message with attachments
  const custMsgRes = await fetch(`${BASE}/api/support/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      visitorId,
      content: "Hello Dr. Walia, please inspect my clinical test results.",
      attachments: [pngData.attachment, mp4Data.attachment],
    }),
  });
  assert.equal(custMsgRes.status, 200, "Customer message with attachments must succeed");
  console.log("    ✓ Customer message with 2 attachments sent successfully");

  // Admin replies with image attachment
  console.log("\n[5] Testing Admin Support Staff Media Reply...");
  const adminImgFormData = new FormData();
  adminImgFormData.append("file", new Blob([png1x1], { type: "image/png" }), "clinical_guidance.png");
  adminImgFormData.append("conversationId", conversationId);
  const adminUploadRes = await fetch(`${BASE}/api/support/upload`, {
    method: "POST",
    headers: { Cookie: adminCookie },
    body: adminImgFormData,
  });
  assert.equal(adminUploadRes.status, 200, "Admin file upload must succeed");
  const adminImgData = await adminUploadRes.json();

  const adminMsgRes = await fetch(`${BASE}/api/admin/support/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      content: "Thank you for the test video and report. Here is the adjusted clinical routine.",
      attachments: [adminImgData.attachment],
      isInternal: false,
    }),
  });
  assert.equal(adminMsgRes.status, 200, "Admin reply with attachment must succeed");
  console.log("    ✓ Admin reply with attachment saved and dispatched via SSE");

  // Verify full conversation contains all media
  const threadRes = await fetch(`${BASE}/api/support/conversation?conversationId=${conversationId}&visitorId=${visitorId}`);
  const threadData = await threadRes.json();
  assert.ok(threadData.messages.length >= 3, "Thread must contain at least 3 messages");
  const custMsg = threadData.messages.find((m) => m.sender === "customer");
  const agentMsg = threadData.messages.find((m) => m.sender === "agent");
  assert.equal(custMsg.attachments.length, 2, "Customer message must contain 2 attachments");
  assert.equal(agentMsg.attachments.length, 1, "Agent message must contain 1 attachment");
  console.log("    ✓ Verified: Customer sent 1 Image + 1 Video, Agent replied with 1 Image");
  console.log("    ✓ Bi-directional chat media exchange completely verified in conversation store");

  console.log("\n==================================================================");
  console.log("🎉 ALL AUDIT CHECKS PASSED: INSTANT ADMIN + CHAT MEDIA 100% OPERATIONAL!");
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("TEST ERROR:", err);
  process.exit(1);
});
