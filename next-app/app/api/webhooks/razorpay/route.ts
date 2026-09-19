import { json } from "@/lib/http";
import { verifyWebhook } from "@/lib/razorpay";
import { store } from "@/lib/commerce/store";

export async function POST(request: Request) {
  const raw = await request.text();
  if (!(await verifyWebhook(raw, request.headers.get("x-razorpay-signature")))) return json({ error: "Invalid webhook signature" }, 401);
  try {
    const event = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; notes?: { orderId?: string } } } } };
    const orderId = event.payload?.payment?.entity?.notes?.orderId;
    if (event.event === "payment.captured" && orderId) await store.orders.update(orderId, { status: "paid", paymentId: event.payload?.payment?.entity?.id });
    return json({ ok: true });
  } catch {
    return json({ error: "Malformed webhook payload" }, 400);
  }
}

