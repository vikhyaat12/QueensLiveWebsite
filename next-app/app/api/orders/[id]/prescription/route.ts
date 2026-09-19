import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { fileDb } from "@/lib/commerce/file-db";
import { resolve, join } from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { emailService } from "@/lib/email/email-service";
import { dispatchNotification } from "@/lib/notifications/notification-orchestrator";
import { logAccessAuditEvent, extractClientMeta } from "@/lib/audit";

const SECURE_DIR = resolve(process.cwd(), "data", "secure-prescriptions");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireUser().catch(() => null);

  const order = await store.orders.byId(id);
  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  // Authorization check: Admin, Employee, or Order Owner
  const isStaff = Boolean(user && (user.role === "admin" || user.role === "employee"));
  const isOwner = Boolean(user && order.userId && user.id === order.userId);

  // Private medical document access requires authenticated staff or verified order owner
  if (!isStaff && !isOwner) {
    return new Response("Unauthorized access to medical document", { status: 403 });
  }

  const orderRx = (order as Record<string, unknown>).prescriptionKey as string | undefined;
  if (!orderRx) {
    return new Response("No prescription attached to this order", { status: 404 });
  }

  // Sanitize key against path traversal
  const cleanKey = orderRx.replace(/[^a-zA-Z0-9._-]/g, "");
  const filePath = join(SECURE_DIR, cleanKey);

  if (!existsSync(filePath)) {
    return new Response("Prescription file not found on storage", { status: 404 });
  }

  const fileBuffer = await readFile(filePath);
  const ext = cleanKey.split(".").pop()?.toLowerCase() || "";
  let contentType = "application/octet-stream";
  if (ext === "pdf") contentType = "application/pdf";
  else if (["jpg", "jpeg"].includes(ext)) contentType = "image/jpeg";
  else if (ext === "png") contentType = "image/png";
  else if (ext === "webp") contentType = "image/webp";

  const originalName = (order as Record<string, unknown>).prescriptionFilename as string || `prescription_${id}.${ext}`;

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(originalName)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized access" }, 401);
  const meta = extractClientMeta(request);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const decision = body?.decision || body?.prescriptionStatus;
  const note = body?.note || body?.prescriptionNote || "";

  if (decision !== "approved" && decision !== "rejected") {
    return json({ error: "Decision must be either 'approved' or 'rejected'." }, 422);
  }

  const order = await store.orders.byId(id);
  if (!order) return json({ error: "Order not found" }, 404);

  const reviewedAt = new Date().toISOString();
  await store.orders.update(id, {
    prescriptionStatus: decision,
    prescriptionNotes: note,
    prescriptionReviewedAt: reviewedAt,
    prescriptionReviewedBy: user.email,
  });

  await logAccessAuditEvent({
    action: "order_prescription_reviewed",
    actorId: String(user.id || user.email),
    actorName: user.name || "Duty Pharmacist",
    actorEmail: user.email || "",
    targetId: id,
    targetName: `Order #${id}`,
    targetEmail: "",
    reason: `Prescription ${decision}. Note: ${note || "None"}`,
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: "success",
    details: `Pharmacist ${user.name || user.email} marked prescription ${decision.toUpperCase()} for Order #${id}.`,
  });

  // Dispatch Omnichannel Notification to Customer (Email, SMS, WhatsApp)
  const shipping = order.shipping as Record<string, string> | undefined;
  if (shipping?.email || shipping?.phone) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const customerName = shipping?.fullName || "Valued Patient";

    if (decision === "approved") {
      dispatchNotification({
        event: "prescription_approved",
        recipient: {
          name: customerName,
          email: shipping?.email,
          phone: shipping?.phone,
        },
        data: {
          customer_name: customerName,
          order_id: id,
          pharmacist_note: note ? `<p><strong>Pharmacist Observation:</strong> ${note}</p>` : "",
          order_url: `${siteUrl}/account/orders`,
        },
        idempotencyKey: `rx_approved_${id}`,
      }).catch((e) => console.error("Rx approval notification error:", e));
    } else if (decision === "rejected") {
      dispatchNotification({
        event: "prescription_rejected",
        recipient: {
          name: customerName,
          email: shipping?.email,
          phone: shipping?.phone,
        },
        data: {
          customer_name: customerName,
          order_id: id,
          rejection_reason: note || "Prescription image blurry or doctor registration credentials unreadable.",
          upload_url: `${siteUrl}/account/orders`,
        },
        idempotencyKey: `rx_rejected_${id}`,
      }).catch((e) => console.error("Rx rejection notification error:", e));
    }
  }

  return json({
    ok: true,
    message: `Prescription successfully marked ${decision}.`,
    prescriptionStatus: decision,
    prescriptionNote: note,
  });
}
