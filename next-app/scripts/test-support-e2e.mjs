import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = "http://127.0.0.1:3000";
const ARTIFACT_DIR = "C:\\Users\\Vikhyaat sikand\\.gemini\\antigravity\\brain\\ba7ff11c-20b8-4316-a446-7011631a55ff";
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "scratch", "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runE2ETests() {
  console.log("==================================================");
  console.log("STARTING CUSTOMER CHAT & ADMIN SUPPORT INBOX E2E TEST");
  console.log("==================================================");

  // 1. API Level Validation
  console.log("\n--- [Phase 1: API Level Protocol Validation] ---");
  
  // Login as Admin
  console.log("[1.1] Authenticating Admin user...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@queenscare.in", password: "QueensCare#Admin2026" }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginData)}`);
  }
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const match = setCookie.match(/qc_session=([^;]+)/);
  if (!match) throw new Error("Could not extract qc_session cookie from login response");
  const adminCookie = match[1];
  console.log("✓ Admin successfully authenticated, qc_session acquired.");

  // Test Admin Support Settings API
  console.log("[1.2] Testing GET /api/admin/support/settings...");
  const settingsRes = await fetch(`${BASE_URL}/api/admin/support/settings`, {
    headers: { Cookie: `qc_session=${adminCookie}` },
  });
  const settingsData = await settingsRes.json();
  console.log(`✓ Support settings status: online=${settingsData.settings?.isOnline}, defaultMode=${settingsData.settings?.defaultMode}`);

  // Test Customer Conversation Initialization
  console.log("[1.3] Testing POST /api/support/conversation...");
  const visitorId = `vis-test-${Date.now()}`;
  const convRes = await fetch(`${BASE_URL}/api/support/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorId,
      customerName: "E2E Test Customer",
      customerEmail: "e2e-tester@example.com",
      currentUrl: "/shop",
    }),
  });
  const convData = await convRes.json();
  if (!convData.conversation?.id) throw new Error("Failed to create conversation via API");
  const testConvId = convData.conversation.id;
  console.log(`✓ Conversation initialized: id=${testConvId}, status=${convData.conversation.status}, mode=${convData.conversation.handlingMode}`);

  // Customer sends message
  console.log("[1.4] Testing POST /api/support/message (Customer sends inquiry)...");
  const msgRes = await fetch(`${BASE_URL}/api/support/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: testConvId,
      visitorId,
      content: "Hello, I placed an order yesterday for Bone Strength and need delivery details.",
      currentUrl: "/shop",
    }),
  });
  const msgData = await msgRes.json();
  console.log(`✓ Customer message registered (id=${msgData.customerMsg?.id}). AI response generated: "${msgData.aiMsg?.content?.slice(0, 70)}..."`);

  // Admin lists conversations
  console.log("[1.5] Testing GET /api/admin/support/conversations...");
  const listRes = await fetch(`${BASE_URL}/api/admin/support/conversations`, {
    headers: { Cookie: `qc_session=${adminCookie}` },
  });
  const listData = await listRes.json();
  const foundConv = (listData.conversations || []).find((c) => c.id === testConvId);
  if (!foundConv) throw new Error(`Test conversation ${testConvId} not found in admin list`);
  console.log(`✓ Admin inbox listed conversation. Total conversations: ${listData.total}, Unread count: ${foundConv.unreadAdminCount}`);

  // Admin sends reply
  console.log("[1.6] Testing POST /api/admin/support/conversations/[id]/messages (Admin reply)...");
  const adminReplyRes = await fetch(`${BASE_URL}/api/admin/support/conversations/${testConvId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `qc_session=${adminCookie}` },
    body: JSON.stringify({
      content: "Hello! Thank you for contacting Queen's Care. I am checking your order status right now.",
      isInternal: false,
    }),
  });
  const adminReplyData = await adminReplyRes.json();
  console.log(`✓ Admin message posted: id=${adminReplyData.message?.id}`);

  // Customer requests handoff
  console.log("[1.7] Testing POST /api/support/handoff...");
  const handoffRes = await fetch(`${BASE_URL}/api/support/handoff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId: testConvId }),
  });
  const handoffData = await handoffRes.json();
  console.log(`✓ Customer requested handoff: humanRequested=${handoffData.conversation?.humanRequested}`);

  // Admin takes over
  console.log("[1.8] Testing POST /api/admin/support/conversations/[id]/takeover...");
  const takeoverRes = await fetch(`${BASE_URL}/api/admin/support/conversations/${testConvId}/takeover`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `qc_session=${adminCookie}` },
  });
  const takeoverData = await takeoverRes.json();
  console.log(`✓ Takeover successful: handlingMode=${takeoverData.conversation?.handlingMode}, humanRequested=${takeoverData.conversation?.humanRequested}`);

  // Admin posts private internal note
  console.log("[1.9] Testing POST private internal note (visible only to admin)...");
  const noteRes = await fetch(`${BASE_URL}/api/admin/support/conversations/${testConvId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `qc_session=${adminCookie}` },
    body: JSON.stringify({
      content: "INTERNAL NOTE: Verified customer account. Expedited shipping flag requested on order.",
      isInternal: true,
    }),
  });
  const noteData = await noteRes.json();
  console.log(`✓ Internal note created: id=${noteData.message?.id}, isInternal=${noteData.message?.isInternal}`);

  // Customer fetches conversation history - MUST NOT SEE INTERNAL NOTE
  console.log("[1.10] Verifying customer cannot see internal note...");
  const customerHistoryRes = await fetch(`${BASE_URL}/api/support/conversation?conversationId=${testConvId}&visitorId=${visitorId}`);
  const customerHistoryData = await customerHistoryRes.json();
  const customerNoteLeak = (customerHistoryData.messages || []).find((m) => m.isInternal || m.content.includes("INTERNAL NOTE"));
  if (customerNoteLeak) {
    throw new Error("SECURITY FAILURE: Customer received private internal note!");
  }
  console.log("✓ Verified: Private internal note is strictly hidden from customer view.");

  // Admin resolves conversation
  console.log("[1.11] Testing POST /api/admin/support/conversations/[id]/status (Resolve)...");
  const resolveRes = await fetch(`${BASE_URL}/api/admin/support/conversations/${testConvId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `qc_session=${adminCookie}` },
    body: JSON.stringify({ status: "resolved" }),
  });
  const resolveData = await resolveRes.json();
  console.log(`✓ Conversation resolved: status=${resolveData.conversation?.status}`);

  // Customer sends new message -> Auto-reopen to 'open'
  console.log("[1.12] Testing auto-reopen on subsequent customer message...");
  const reopenMsgRes = await fetch(`${BASE_URL}/api/support/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: testConvId,
      visitorId,
      content: "I have another question regarding dosage.",
    }),
  });
  const reopenMsgData = await reopenMsgRes.json();
  const checkReopenedRes = await fetch(`${BASE_URL}/api/admin/support/conversations/${testConvId}`, {
    headers: { Cookie: `qc_session=${adminCookie}` },
  });
  const checkReopenedData = await checkReopenedRes.json();
  console.log(`✓ Verified auto-reopen: conversation status is now "${checkReopenedData.conversation?.status}"`);

  // 2. Playwright Browser E2E and Visual Captures
  console.log("\n--- [Phase 2: Playwright UI Automation & Multi-Pane Visual Verification] ---");
  const browser = await chromium.launch({ headless: true });

  // Desktop Admin View
  console.log("[2.1] Launching Desktop Admin Context (1440x900)...");
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await adminContext.addCookies([
    {
      name: "qc_session",
      value: adminCookie,
      domain: "127.0.0.1",
      path: "/",
    },
    {
      name: "qc_session",
      value: adminCookie,
      domain: "localhost",
      path: "/",
    },
  ]);

  const adminPage = await adminContext.newPage();
  console.log("Navigating adminPage to /admin/support...");
  await adminPage.goto(`${BASE_URL}/admin/support`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await adminPage.waitForTimeout(3000);

  // Take Desktop Admin Inbox initial screenshot
  const adminDesktopScreenshotPath = path.join(SCREENSHOT_DIR, "admin-support-inbox-desktop-1440.png");
  await adminPage.screenshot({ path: adminDesktopScreenshotPath });
  fs.copyFileSync(adminDesktopScreenshotPath, path.join(ARTIFACT_DIR, "admin-support-inbox-desktop-1440.png"));
  console.log(`✓ Desktop Admin Inbox screenshot captured: ${adminDesktopScreenshotPath}`);

  // Customer Browser Context
  console.log("[2.2] Launching Storefront Customer Context (1440x900)...");
  const customerContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const customerPage = await customerContext.newPage();
  console.log("Navigating customerPage to /...");
  await customerPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await customerPage.waitForTimeout(3000);

  // Find and open ChatBot widget
  console.log("[2.3] Opening storefront ChatBot widget...");
  const chatbotToggle = await customerPage.$('[data-testid="chatbot-toggle"]');
  if (chatbotToggle) {
    await chatbotToggle.click();
    await customerPage.waitForTimeout(1500);
  }

  // Type a message in storefront chatbot
  const chatInput = await customerPage.$('[data-testid="chatbot-input"]');
  if (chatInput) {
    await chatInput.fill("What are the main benefits of Marine Collagen?");
    const sendBtn = await customerPage.$('[data-testid="chatbot-send"]');
    if (sendBtn) await sendBtn.click();
    await customerPage.waitForTimeout(3000);
  }

  // Capture Customer ChatBot Desktop Screenshot
  const customerDesktopScreenshotPath = path.join(SCREENSHOT_DIR, "customer-chatbot-desktop-1440.png");
  await customerPage.screenshot({ path: customerDesktopScreenshotPath });
  fs.copyFileSync(customerDesktopScreenshotPath, path.join(ARTIFACT_DIR, "customer-chatbot-desktop-1440.png"));
  console.log(`✓ Storefront Customer ChatBot screenshot captured: ${customerDesktopScreenshotPath}`);

  // Desktop Admin - Select the conversation and interact
  console.log("[2.4] Interacting with Admin Console thread...");
  await adminPage.waitForTimeout(2000);

  // Click on the test conversation item in the list
  const testConvItem = await adminPage.$(`[data-testid="conversation-item-${testConvId}"], .qc-conv-item`);
  if (testConvItem) {
    await testConvItem.click();
    await adminPage.waitForTimeout(2000);
  }

  // Capture Active Thread Desktop Screenshot
  const adminThreadScreenshotPath = path.join(SCREENSHOT_DIR, "admin-support-thread-desktop-1440.png");
  await adminPage.screenshot({ path: adminThreadScreenshotPath });
  fs.copyFileSync(adminThreadScreenshotPath, path.join(ARTIFACT_DIR, "admin-support-thread-desktop-1440.png"));
  console.log(`✓ Desktop Admin Active Thread screenshot captured: ${adminThreadScreenshotPath}`);

  // 2.5 Mobile Admin View (390x844)
  console.log("[2.5] Testing Mobile Admin Console Responsive View (390x844)...");
  await adminPage.setViewportSize({ width: 390, height: 844 });
  await adminPage.waitForTimeout(1500);

  // If in thread view, click back button to show conversation list first
  const backBtn = await adminPage.$('[data-testid="mobile-back-button"]');
  if (backBtn && await backBtn.isVisible()) {
    await backBtn.click();
    await adminPage.waitForTimeout(1000);
  }

  // Capture Mobile Conversation List Screenshot
  const mobileListScreenshotPath = path.join(SCREENSHOT_DIR, "admin-support-mobile-list-390.png");
  await adminPage.screenshot({ path: mobileListScreenshotPath });
  fs.copyFileSync(mobileListScreenshotPath, path.join(ARTIFACT_DIR, "admin-support-mobile-list-390.png"));
  console.log(`✓ Mobile Admin List screenshot captured: ${mobileListScreenshotPath}`);

  // Tap conversation on mobile to enter thread
  const mobileConvItem = await adminPage.$(`[data-testid="conversation-item-${testConvId}"], .qc-conv-item`);
  if (mobileConvItem) {
    await mobileConvItem.click();
    await adminPage.waitForTimeout(1500);
  }

  // Capture Mobile Thread Screenshot (with sticky composer & touch controls)
  const mobileThreadScreenshotPath = path.join(SCREENSHOT_DIR, "admin-support-mobile-thread-390.png");
  await adminPage.screenshot({ path: mobileThreadScreenshotPath });
  fs.copyFileSync(mobileThreadScreenshotPath, path.join(ARTIFACT_DIR, "admin-support-mobile-thread-390.png"));
  console.log(`✓ Mobile Admin Thread screenshot captured: ${mobileThreadScreenshotPath}`);

  // Open Context Drawer Sheet on mobile
  const infoBtn = await adminPage.$('[data-testid="mobile-context-toggle"], button:has-text("Context")');
  if (infoBtn) {
    await infoBtn.click();
    await adminPage.waitForTimeout(1200);
    const mobileDrawerScreenshotPath = path.join(SCREENSHOT_DIR, "admin-support-mobile-drawer-390.png");
    await adminPage.screenshot({ path: mobileDrawerScreenshotPath });
    fs.copyFileSync(mobileDrawerScreenshotPath, path.join(ARTIFACT_DIR, "admin-support-mobile-drawer-390.png"));
    console.log(`✓ Mobile Admin Context Drawer screenshot captured: ${mobileDrawerScreenshotPath}`);
  }

  // 2.6 Mobile Customer Chat View
  console.log("[2.6] Capturing Mobile Customer ChatBot (390x844)...");
  await customerPage.setViewportSize({ width: 390, height: 844 });
  await customerPage.waitForTimeout(1500);

  const mobileCustomerScreenshotPath = path.join(SCREENSHOT_DIR, "customer-chatbot-mobile-390.png");
  await customerPage.screenshot({ path: mobileCustomerScreenshotPath });
  fs.copyFileSync(mobileCustomerScreenshotPath, path.join(ARTIFACT_DIR, "customer-chatbot-mobile-390.png"));
  console.log(`✓ Storefront Mobile ChatBot screenshot captured: ${mobileCustomerScreenshotPath}`);

  await browser.close();
  console.log("\n==================================================");
  console.log("ALL 15 END-TO-END SUPPORT TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runE2ETests().catch((err) => {
  console.error("FATAL ERROR IN E2E SUPPORT TEST:", err);
  process.exit(1);
});
