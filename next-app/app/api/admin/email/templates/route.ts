import { json, requireUser } from "@/lib/http";
import { emailService } from "@/lib/email/email-service";
import { fileDb } from "@/lib/commerce/file-db";
import { logAccessAuditEvent, extractClientMeta } from "@/lib/audit";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const templates = emailService.getAllTemplates();
  return json({ templates });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const meta = extractClientMeta(request);

  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "Template ID required" }, 422);

  const key = `email_template_${body.id}`;
  fileDb.update(
    "settings",
    { key },
    {
      key,
      value: JSON.stringify({
        subject: body.subject,
        html: body.html,
        text: body.text,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
      }),
      group: "email_templates",
      updatedAt: new Date().toISOString(),
    }
  );

  await logAccessAuditEvent({
    action: "email_template_updated",
    actorId: String(user.id || user.email),
    actorName: user.name || "Administrator",
    actorEmail: user.email || "",
    targetId: body.id,
    targetName: `Template: ${body.id}`,
    targetEmail: "",
    reason: "Admin updated transactional email template content",
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: "success",
    details: `Admin ${user.name || user.email} updated transactional email template: ${body.id}`,
  });

  return json({ ok: true, template: emailService.getTemplate(body.id) });
}

// Send Test Email
export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  const templateId = body?.templateId;
  const recipientEmail = body?.recipientEmail || user.email;

  if (!templateId || !recipientEmail) {
    return json({ error: "templateId and recipientEmail required" }, 422);
  }

  const sampleData: Record<string, string | number> = {
    customer_name: user.name || "Valued Customer",
    customer_email: recipientEmail,
    login_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account`,
    reset_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password?token=sample-test-token`,
    expiry_minutes: 30,
    order_id: "ORD-TEST-9921",
    order_total: 1499,
    payment_method: "Prepaid Razorpay / Net Banking",
    item_summary: "Queens Immuno-Shield Drops (x2), Hepato-Active Capsules (x1)",
    order_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account/orders`,
    carrier_name: "BlueDart Express Healthcare Cold-Chain",
    tracking_number: "BLD-998273618",
    tracking_url: "https://track.queenscare.in/BLD-998273618",
    invoice_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account/orders`,
    review_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/shop`,
    cancellation_reason: "Customer requested cancellation prior to packing",
    refund_amount: 1499,
    refund_reference: "RFND-RZP-882731",
    pharmacist_note: "Batch release certified under Schedule H protocol by Duty Pharmacist.",
    rejection_reason: "Prescription image blurry: doctor registration seal unreadable.",
    upload_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account/orders`,
    customer_city: "Mumbai, Maharashtra",
    items_count: 3,
    admin_order_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin`,
    admin_rx_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin`,
  };

  const result = await emailService.send({
    templateId,
    recipientEmail,
    recipientName: user.name || "Test Recipient",
    data: sampleData,
    idempotencyKey: `test_${Date.now()}`,
  });

  return json({ result });
}
