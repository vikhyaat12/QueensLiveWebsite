import { json } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { verifyCsrf } from "@/lib/csrf";

export async function POST(request: Request) {
  const csrfResult = verifyCsrf(request);
  if (!csrfResult.valid) {
    return json({ error: "CSRF validation failed" }, 403);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.orderId) {
      return json({ error: "Missing required order information" }, 400);
    }

    const { orderId, provider, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const order = await store.orders.byId(orderId);
    if (!order) {
      return json({ error: "Order not found" }, 404);
    }

    // Idempotency: if order is already marked paid, return success immediately
    if (order.status === "paid" || order.paymentStatus === "paid") {
      return json({ ok: true, orderId: order.id, status: "paid", alreadyVerified: true });
    }

    if (provider === "razorpay") {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return json({ error: "Incomplete Razorpay payment response tokens" }, 400);
      }

      const isValid = await verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        return json({ error: "Payment verification failed: cryptographic signature mismatch" }, 400);
      }

      // Authoritative state update
      await store.orders.update(orderId, {
        status: "paid",
        paymentStatus: "paid",
        paymentId: razorpay_payment_id,
        notes: `${order.notes || ""} [Paid via Razorpay: ${razorpay_payment_id}]`.trim(),
      });

      return json({
        ok: true,
        orderId: order.id,
        status: "paid",
        paymentId: razorpay_payment_id,
      });
    }

    return json({ error: `Unsupported payment provider: ${provider}` }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error verifying payment";
    return json({ error: msg }, 500);
  }
}
