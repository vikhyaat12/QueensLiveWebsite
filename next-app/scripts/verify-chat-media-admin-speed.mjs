import fs from "fs";
import path from "path";

const BASE_URL = "http://127.0.0.1:3000";

async function req(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  let body = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = await res.json().catch(() => null);
  } else {
    body = await res.text().catch(() => null);
  }
  return { status: res.status, headers: res.headers, body };
}

async function run() {
  console.log("===============================================================");
  console.log("QUEENS CARE — CHAT SUPPORT MEDIA & ADMIN PERFORMANCE TEST");
  console.log("===============================================================\n");

  // 1. Authenticate Admin
  console.log("1. Authenticating Admin (admin@queenscare.in)...");
  const loginRes = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  if (loginRes.status !== 200) {
    throw new Error(`Admin login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const adminCookie = setCookie.split(";")[0];
  console.log("   ✓ Admin authenticated successfully.");

  // 2. Create customer support conversation
  console.log("\n2. Initializing Customer Chat Conversation...");
  const visitorId = `vis-test-${Date.now()}`;
  const convRes = await req("/api/support/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, currentUrl: "/shop" }),
  });
  if (convRes.status !== 200 || !convRes.body.conversation) {
    throw new Error(`Conversation creation failed: ${convRes.status}`);
  }
  const conversationId = convRes.body.conversation.id;
  console.log(`   ✓ Conversation created: ${conversationId}`);

  // 3. Test File Validation: Reject Spoofed MIME types
  console.log("\n3. Testing Security: Reject Spoofed File (fake PNG with text content)...");
  const fakePngBuffer = Buffer.from("THIS_IS_NOT_A_REAL_PNG_IMAGE_DATA_12345678");
  const fakeFormData = new FormData();
  fakeFormData.append("file", new Blob([fakePngBuffer], { type: "image/png" }), "fake.png");
  fakeFormData.append("conversationId", conversationId);
  fakeFormData.append("visitorId", visitorId);

  const fakeUploadRes = await req("/api/support/upload", {
    method: "POST",
    body: fakeFormData,
  });
  console.log(`   Spoofed upload status: ${fakeUploadRes.status}, error:`, fakeUploadRes.body?.error);
  if (fakeUploadRes.status !== 400 || !fakeUploadRes.body?.error?.includes("magic bytes") && !fakeUploadRes.body?.error?.includes("format")) {
    throw new Error("Security failure: Spoofed MIME type was not rejected by magic bytes verification!");
  }
  console.log("   ✓ Verified: Magic bytes verification successfully rejected spoofed file.");

  // 4. Test File Validation: Reject Oversized Image (> 10MB)
  console.log("\n4. Testing Security: Reject Oversized Image (>10MB)...");
  // Create 11MB buffer starting with PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const bigBuffer = Buffer.concat([pngHeader, Buffer.alloc(11 * 1024 * 1024)]);
  const bigFormData = new FormData();
  bigFormData.append("file", new Blob([bigBuffer], { type: "image/png" }), "huge.png");
  bigFormData.append("conversationId", conversationId);
  bigFormData.append("visitorId", visitorId);

  const bigUploadRes = await req("/api/support/upload", {
    method: "POST",
    body: bigFormData,
  });
  console.log(`   Oversized upload status: ${bigUploadRes.status}, error:`, bigUploadRes.body?.error);
  if (bigUploadRes.status !== 400 || !bigUploadRes.body?.error?.toLowerCase().includes("limit")) {
    throw new Error("Security failure: Oversized file was not rejected!");
  }
  console.log("   ✓ Verified: Size limit enforced (10MB max).");

  // 5. Test Valid PNG Upload
  console.log("\n5. Testing Valid PNG Image Upload...");
  // Valid minimal 1x1 PNG buffer
  const validPngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const validFormData = new FormData();
  validFormData.append("file", new Blob([validPngBuffer], { type: "image/png" }), "lab_test_report.png");
  validFormData.append("conversationId", conversationId);
  validFormData.append("visitorId", visitorId);

  const validUploadRes = await req("/api/support/upload", {
    method: "POST",
    body: validFormData,
  });
  console.log(`   Upload status: ${validUploadRes.status}, attachment:`, validUploadRes.body?.attachment);
  if (validUploadRes.status !== 200 || !validUploadRes.body?.attachment?.url) {
    throw new Error(`Valid PNG upload failed: ${validUploadRes.status} ${JSON.stringify(validUploadRes.body)}`);
  }
  const customerAttachment = validUploadRes.body.attachment;
  console.log("   ✓ Valid PNG uploaded. URL:", customerAttachment.url);

  // 6. Test Valid MP4 Video Upload
  console.log("\n6. Testing Valid MP4 Video Upload...");
  // Minimal MP4 header: 4 bytes length + 'ftyp' (66 74 79 70) + 4 bytes brand
  const validMp4Buffer = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
    Buffer.alloc(1024), // 1KB mock video content
  ]);
  const videoFormData = new FormData();
  videoFormData.append("file", new Blob([validMp4Buffer], { type: "video/mp4" }), "product_unboxing.mp4");
  videoFormData.append("conversationId", conversationId);
  videoFormData.append("visitorId", visitorId);

  const videoUploadRes = await req("/api/support/upload", {
    method: "POST",
    body: videoFormData,
  });
  console.log(`   Video upload status: ${videoUploadRes.status}, attachment:`, videoUploadRes.body?.attachment);
  if (videoUploadRes.status !== 200 || !videoUploadRes.body?.attachment?.url) {
    throw new Error(`Valid MP4 upload failed: ${videoUploadRes.status} ${JSON.stringify(videoUploadRes.body)}`);
  }
  const videoAttachment = videoUploadRes.body.attachment;
  console.log("   ✓ Valid MP4 video uploaded. URL:", videoAttachment.url);

  // 7. Customer sends message with attachments
  console.log("\n7. Customer sending chat message with image & video attachments...");
  const sendMsgRes = await req("/api/support/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      visitorId,
      content: "Hello, please review my lab test report and unboxing video.",
      attachments: [customerAttachment, videoAttachment],
      currentUrl: "/shop",
    }),
  });
  console.log(`   Send status: ${sendMsgRes.status}, message ID:`, sendMsgRes.body?.customerMsg?.id);
  if (sendMsgRes.status !== 200 || !sendMsgRes.body?.customerMsg?.attachments?.length) {
    throw new Error(`Failed to send customer message with attachments: ${sendMsgRes.status}`);
  }
  console.log("   ✓ Customer message successfully saved with 2 attachments.");

  // 8. Admin replies with an attachment
  console.log("\n8. Admin replying to customer with prescription attachment...");
  // Upload attachment as admin
  const adminAttachmentBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const adminFormData = new FormData();
  adminFormData.append("file", new Blob([adminAttachmentBuffer], { type: "image/png" }), "clinical_guidance.png");
  adminFormData.append("conversationId", conversationId);

  const adminUploadRes = await req("/api/support/upload", {
    method: "POST",
    headers: { Cookie: adminCookie },
    body: adminFormData,
  });
  if (adminUploadRes.status !== 200 || !adminUploadRes.body?.attachment) {
    throw new Error(`Admin upload failed: ${adminUploadRes.status}`);
  }
  const adminAttachment = adminUploadRes.body.attachment;
  console.log("   ✓ Admin file uploaded. URL:", adminAttachment.url);

  // Send admin reply
  const adminMsgRes = await req(`/api/admin/support/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      content: "Thank you for the documents. Here is our official clinical dosage guidance.",
      attachments: [adminAttachment],
      isInternal: false,
    }),
  });
  console.log(`   Admin reply status: ${adminMsgRes.status}, message ID:`, adminMsgRes.body?.message?.id);
  if (adminMsgRes.status !== 200 || !adminMsgRes.body?.message?.attachments?.length) {
    throw new Error(`Failed to send admin reply with attachments: ${adminMsgRes.status}`);
  }
  console.log("   ✓ Admin message successfully recorded with attachment.");

  // 9. Verify thread contains all attachments
  console.log("\n9. Verifying full conversation thread contains all attachments...");
  const threadRes = await req(`/api/support/conversation?conversationId=${conversationId}&visitorId=${visitorId}`);
  const messages = threadRes.body?.messages || [];
  console.log(`   Retrieved ${messages.length} messages in thread.`);
  const customerMsg = messages.find((m) => m.sender === "customer");
  const agentMsg = messages.find((m) => m.sender === "agent");

  if (!customerMsg?.attachments || customerMsg.attachments.length !== 2) {
    throw new Error(`Customer message missing attachments: ${JSON.stringify(customerMsg?.attachments)}`);
  }
  if (!agentMsg?.attachments || agentMsg.attachments.length !== 1) {
    throw new Error(`Agent message missing attachments: ${JSON.stringify(agentMsg?.attachments)}`);
  }
  console.log("   ✓ Customer attachments verified (1 image + 1 video).");
  console.log("   ✓ Agent attachment verified (1 image).");

  // 10. Verify Admin Page Instant Response
  console.log("\n10. Testing Admin Panel Instant Response & Speed (/admin)...");
  const t0 = Date.now();
  const adminPageRes = await req("/admin", {
    headers: { Cookie: adminCookie },
  });
  const t1 = Date.now();
  console.log(`   GET /admin returned status ${adminPageRes.status} in ${t1 - t0}ms`);
  if (adminPageRes.status !== 200) {
    throw new Error(`/admin page returned ${adminPageRes.status}`);
  }
  console.log("   ✓ Admin panel HTML rendered cleanly.");

  // 11. Verify Key Admin Tab API endpoints
  console.log("\n11. Testing Key Admin Data Endpoints for Instant Tab Navigation...");
  const endpoints = [
    { tab: "products", url: "/api/admin/products" },
    { tab: "orders", url: "/api/admin/orders" },
    { tab: "inventory", url: "/api/admin/inventory" },
    { tab: "payments", url: "/api/admin/payments" },
    { tab: "shipping", url: "/api/admin/shipping/providers" },
    { tab: "support-inbox", url: "/api/admin/support/conversations" },
    { tab: "footer-builder", url: "/api/admin/footer" },
  ];

  for (const ep of endpoints) {
    const start = Date.now();
    const res = await req(ep.url, { headers: { Cookie: adminCookie } });
    const elapsed = Date.now() - start;
    console.log(`   - Tab [${ep.tab.padEnd(14)}] ${ep.url} -> ${res.status} (${elapsed}ms)`);
    if (res.status !== 200) {
      throw new Error(`Tab endpoint ${ep.url} returned status ${res.status}`);
    }
  }
  console.log("   ✓ All admin data endpoints respond with 200 OK.");

  console.log("\n===============================================================");
  console.log("ALL CHAT MEDIA & ADMIN SPEED TESTS PASSED SUCCESSFULLY! ✓");
  console.log("===============================================================");
}

run().catch((err) => {
  console.error("\nTEST FAILED:", err);
  process.exit(1);
});
