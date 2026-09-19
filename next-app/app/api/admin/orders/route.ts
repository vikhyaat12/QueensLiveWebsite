import { json, requireUser } from "@/lib/http";
import { orderStoreExtended } from "@/lib/commerce/store-extensions";
import { store } from "@/lib/commerce/store";
import { emailService } from "@/lib/email/email-service";
import { inventoryService } from "@/lib/commerce/inventory";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const orders = await orderStoreExtended.all();
  return json({ orders });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.status) return json({ error: "id and status required." }, 422);

  const res = await orderStoreExtended.updateStatus(body.id, body.status, body.note, String(user.id || user.email));
  if (!res.success) return json({ error: res.error }, 422);

  if (body.status === "cancelled") {
    await inventoryService.releaseStock(
      body.id,
      body.note ? String(body.note).trim() : "Order cancelled by staff",
      String(user.id || user.email || "admin")
    ).catch((err) => {
      console.error("Release stock error in PATCH admin orders:", err);
    });
  }

  // Trigger Transactional Lifecycle Email based on new status
  try {
    const order = await store.orders.byId(body.id);
    const shipping = order?.shipping as Record<string, string> | undefined;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (shipping?.email) {
      const recipientEmail = shipping.email;
      const customerName = shipping.fullName || "Valued Customer";
      const status = String(body.status).toLowerCase();
      const idempotencyKey = `status_${body.id}_${status}`;

      if (status === "confirmed" || status === "processing") {
        emailService.send({
          templateId: "order_confirmed",
          recipientEmail,
          recipientName: customerName,
          data: {
            customer_name: customerName,
            order_id: String(body.id),
            order_url: `${siteUrl}/account/orders`,
          },
          idempotencyKey,
        }).catch((e) => console.error("Confirmed email error:", e));
      } else if (status === "dispatched" || status === "shipped") {
        emailService.send({
          templateId: "order_dispatched",
          recipientEmail,
          recipientName: customerName,
          data: {
            customer_name: customerName,
            order_id: String(body.id),
            carrier_name: (order as Record<string, unknown>)?.carrier || "BlueDart Express Healthcare",
            tracking_number: (order as Record<string, unknown>)?.trackingCode || "In Transit",
            tracking_url: `${siteUrl}/track-order?tracking=${(order as Record<string, unknown>)?.trackingCode || body.id}`,
          },
          idempotencyKey,
        }).catch((e) => console.error("Dispatched email error:", e));
      } else if (status === "delivered") {
        emailService.send({
          templateId: "order_delivered",
          recipientEmail,
          recipientName: customerName,
          data: {
            customer_name: customerName,
            order_id: String(body.id),
            invoice_url: `${siteUrl}/account/orders`,
            review_url: `${siteUrl}/shop`,
          },
          idempotencyKey,
        }).catch((e) => console.error("Delivered email error:", e));
      } else if (status === "cancelled") {
        emailService.send({
          templateId: "order_cancelled",
          recipientEmail,
          recipientName: customerName,
          data: {
            customer_name: customerName,
            order_id: String(body.id),
            cancellation_reason: body.note || "Order cancelled per customer request",
          },
          idempotencyKey,
        }).catch((e) => console.error("Cancelled email error:", e));
      } else if (status === "refunded") {
        emailService.send({
          templateId: "order_refunded",
          recipientEmail,
          recipientName: customerName,
          data: {
            customer_name: customerName,
            order_id: String(body.id),
            refund_amount: (order as Record<string, unknown>)?.total || 0,
            refund_reference: `RFND-${body.id}`,
          },
          idempotencyKey,
        }).catch((e) => console.error("Refunded email error:", e));
      }
    }
  } catch (err) {
    console.error("Status transition email error (non-fatal):", err);
  }

  return json({ ok: true });
}
