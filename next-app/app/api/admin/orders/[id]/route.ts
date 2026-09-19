import { json, requireUser } from "@/lib/http";
import { orderStoreExtended, ORDER_VALID_TRANSITIONS, settingStore } from "@/lib/commerce/store-extensions";
import { store } from "@/lib/commerce/store";
import { fileDb } from "@/lib/commerce/file-db";
import { emailService } from "@/lib/email/email-service";
import { inventoryService } from "@/lib/commerce/inventory";
import { dispatchNotification } from "@/lib/notifications/notification-orchestrator";

const VALID_TRANSITIONS = ORDER_VALID_TRANSITIONS;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const orders = await orderStoreExtended.all();
  const order = orders.find((o: Record<string, unknown>) => o.id === id) as Record<string, unknown> | undefined;
  if (!order) return json({ error: "Order not found" }, 404);

  // Get customer info
  const users = fileDb.findMany("users");
  const customer = users.find((u: Record<string, unknown>) => u.id === order.userId) as Record<string, unknown> | undefined;

  // Get product details for order lines
  const products = await store.products.all();
  const lines = Array.isArray(order.lines) ? order.lines : [];
  const enrichedLines = lines.map((line: Record<string, unknown>) => {
    const product = products.find((p) => p.id === line.productId || p.slug === line.productId);
    return {
      ...line,
      name: product?.name || "Unknown Product",
      image: product?.image || "",
      price: product?.price || 0,
      sku: product?.slug || "",
    };
  });

  // Get status history
  const history = await orderStoreExtended.history(id);

  // Get shipping info
  const shipping = order.shipping as Record<string, unknown> | undefined;

  let invoiceSnapshot: Record<string, unknown> | null = null;
  try {
    const s = await settingStore.get(`invoice_snapshot_${id}`);
    if (s?.value) {
      invoiceSnapshot = typeof s.value === "string" ? JSON.parse(String(s.value)) : (s.value as Record<string, unknown>);
    }
  } catch {}

  return json({
    order: {
      ...order,
      lines: enrichedLines,
      invoiceSnapshot,
    },
    customer: customer ? {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
    } : null,
    shipping: shipping ? {
      fullName: shipping.fullName || "",
      email: shipping.email || "",
      phone: shipping.phone || "",
      address: shipping.address || "",
      city: shipping.city || "",
      state: shipping.state || "",
      pincode: shipping.pincode || "",
    } : null,
    history: history || [],
    validTransitions: VALID_TRANSITIONS[String(order.status)] || [],
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const order = await store.orders.byId(id);
  if (!order) return json({ error: "Order not found" }, 404);
  const shipping = order.shipping as Record<string, string> | undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // If updating prescription status or notes
  if (body?.prescriptionStatus || body?.prescriptionNotes !== undefined) {
    const patch: Record<string, unknown> = {};
    if (body.prescriptionStatus) patch.prescriptionStatus = body.prescriptionStatus;
    if (body.prescriptionNotes !== undefined) patch.prescriptionNotes = body.prescriptionNotes;
    await store.orders.update(id, patch);

    fileDb.insert("auditLogs", {
      action: "order_prescription_reviewed",
      actorId: String(user.id || user.email),
      actorName: user.name || "Pharmacist / Staff",
      targetType: "order",
      targetId: id,
      details: `Prescription review decision: ${body.prescriptionStatus || "notes updated"} by ${user.name || user.email}. Notes: ${body.prescriptionNotes || "None"}`,
      createdAt: new Date().toISOString(),
    });

    // Trigger Prescription Decision Transactional Email
    if (shipping?.email && body.prescriptionStatus) {
      const rxStatus = String(body.prescriptionStatus).toLowerCase();
      const customerName = shipping.fullName || "Valued Patient";

      if (rxStatus === "approved") {
        emailService.send({
          templateId: "prescription_approved",
          recipientEmail: shipping.email,
          recipientName: customerName,
          data: {
            customer_name: customerName,
            order_id: id,
            pharmacist_note: body.prescriptionNotes ? `<p><strong>Pharmacist Note:</strong> ${body.prescriptionNotes}</p>` : "",
            order_url: `${siteUrl}/account/orders`,
          },
          idempotencyKey: `rx_approved_${id}`,
        }).catch((e) => console.error("Rx approved email error:", e));
      } else if (rxStatus === "rejected") {
        emailService.send({
          templateId: "prescription_rejected",
          recipientEmail: shipping.email,
          recipientName: customerName,
          data: {
            customer_name: customerName,
            order_id: id,
            rejection_reason: body.prescriptionNotes || "Prescription unreadable or missing physician registration details.",
            upload_url: `${siteUrl}/account/orders`,
          },
          idempotencyKey: `rx_rejected_${id}`,
        }).catch((e) => console.error("Rx rejected email error:", e));
      }
    }

    if (!body.status) {
      return json({ ok: true, message: "Prescription review updated" });
    }
  }

  if (!body?.status) return json({ error: "Status is required." }, 422);

  if (body.status === "rejected" && (!body.note || !String(body.note).trim())) {
    return json({ error: "A rejection reason is mandatory." }, 422);
  }

  const res = await orderStoreExtended.updateStatus(
    id,
    body.status,
    body.note ? String(body.note).trim() : undefined,
    String(user.id || user.email)
  );

  if (!res.success) {
    return json({ error: res.error }, 422);
  }

  // Release stock upon order cancellation (audit ledger recorded automatically)
  if (body.status === "cancelled") {
    await inventoryService.releaseStock(
      id,
      body.note ? String(body.note).trim() : "Order cancelled by admin",
      String(user.id || user.email || "admin")
    ).catch((err) => {
      console.error("Stock release on order cancellation error:", err);
    });
  }

  // Trigger Omnichannel Status Transition Notifications (Email, SMS, WhatsApp)
  if (shipping?.email || shipping?.phone) {
    const newStatus = String(body.status).toLowerCase();
    const customerName = shipping.fullName || "Valued Customer";
    const idempotencyKey = `status_${id}_${newStatus}`;

    let eventKey: "order_confirmed" | "order_dispatched" | "order_delivered" | "order_cancelled" | "order_refunded" | null = null;
    let dataPayload: Record<string, unknown> = {
      customer_name: customerName,
      order_id: id,
    };

    if (newStatus === "confirmed" || newStatus === "processing") {
      eventKey = "order_confirmed";
      dataPayload = {
        ...dataPayload,
        order_url: `${siteUrl}/account/orders`,
      };
    } else if (newStatus === "dispatched" || newStatus === "shipped") {
      eventKey = "order_dispatched";
      dataPayload = {
        ...dataPayload,
        carrier_name: String((order as Record<string, unknown>)?.carrier || "BlueDart Express Healthcare"),
        tracking_number: String((order as Record<string, unknown>)?.trackingCode || body.trackingCode || "In Transit"),
        tracking_url: `${siteUrl}/track-order?tracking=${(order as Record<string, unknown>)?.trackingCode || id}`,
      };
    } else if (newStatus === "delivered") {
      eventKey = "order_delivered";
      dataPayload = {
        ...dataPayload,
        invoice_url: `${siteUrl}/account/orders`,
        review_url: `${siteUrl}/shop`,
      };
    } else if (newStatus === "cancelled") {
      eventKey = "order_cancelled";
      dataPayload = {
        ...dataPayload,
        cancellation_reason: body.note || "Order cancelled per request",
      };
    } else if (newStatus === "refunded") {
      eventKey = "order_refunded";
      dataPayload = {
        ...dataPayload,
        refund_amount: Number((order as Record<string, unknown>)?.total || 0),
        refund_reference: `RFND-${id}`,
      };
    }

    if (eventKey) {
      dispatchNotification({
        event: eventKey,
        recipient: {
          name: customerName,
          email: shipping.email,
          phone: shipping.phone,
        },
        data: dataPayload,
        idempotencyKey,
      }).catch((e) => console.error("Omnichannel status notification error:", e));
    }
  }

  return json({ ok: true });
}
