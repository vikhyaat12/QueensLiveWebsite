async function runTests() {
  console.log("=== QUEENS CARE EMAIL & AUDIT VERIFICATION ===");
  const baseUrl = "http://localhost:3000";

  // 1. Check Email Templates API
  try {
    const res = await fetch(`${baseUrl}/api/admin/email/templates`);
    console.log("1. Email Templates API:", res.status);
    if (res.ok) {
      const d = await res.json();
      console.log(`   Templates loaded: ${d.templates?.length} templates available.`);
      const expected = ["auth_welcome", "auth_password_reset", "order_placed", "order_confirmed", "order_dispatched", "order_delivered", "prescription_approved", "prescription_rejected", "admin_order_alert"];
      const missing = expected.filter(id => !d.templates?.some(t => t.id === id));
      console.log("   Missing critical templates:", missing.length === 0 ? "NONE (All present)" : missing);
    }
  } catch (e) {
    console.log("   Error checking email templates:", e.message);
  }

  // 2. Test Audit Log API
  try {
    const res = await fetch(`${baseUrl}/api/admin/audit-log`);
    console.log("\n2. Audit Log API:", res.status);
    if (res.ok) {
      const d = await res.json();
      console.log(`   Total audit logs in system: ${d.total}`);
      if (d.logs?.length > 0) {
        console.log(`   Latest audit action: "${d.logs[0].action}" by ${d.logs[0].actorName || d.logs[0].actorId}`);
      }
    }
  } catch (e) {
    console.log("   Error checking audit log:", e.message);
  }

  // 3. Test Audit Filter by Action
  try {
    const res = await fetch(`${baseUrl}/api/admin/audit-log?action=role_changed`);
    console.log("\n3. Audit Log Filter (action=role_changed):", res.status);
  } catch (e) {
    console.log("   Error testing audit filter:", e.message);
  }

  // 4. Test Email Dispatch Logs API
  try {
    const res = await fetch(`${baseUrl}/api/admin/email/logs`);
    console.log("\n4. Email Logs API:", res.status);
    if (res.ok) {
      const d = await res.json();
      console.log(`   Total dispatched email logs: ${d.total}`);
    }
  } catch (e) {
    console.log("   Error checking email logs:", e.message);
  }

  console.log("\n=== VERIFICATION RUN COMPLETE ===");
}

runTests().catch(console.error);
