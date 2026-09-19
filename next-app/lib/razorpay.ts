import { createHmac, timingSafeEqual } from "crypto";
import { paymentGatewayStore } from "./commerce/store-extensions";

export async function createRazorpayOrder(receipt:string, amount:number) {
  const keyId=process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, secret=process.env.RAZORPAY_KEY_SECRET;
  if(!keyId||!secret) return { mode:"local" as const, id:`order_local_${receipt}`, amount, currency:"INR" };
  const authorization=Buffer.from(`${keyId}:${secret}`).toString("base64");
  const response=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:`Basic ${authorization}`,"Content-Type":"application/json"},body:JSON.stringify({amount,currency:"INR",receipt,payment_capture:1,notes:{orderId:receipt}})});
  if(!response.ok) throw new Error("Payment provider could not create an order.");
  const order=await response.json() as {id:string;amount:number;currency:string}; return { mode:"razorpay" as const, ...order, key:keyId };
}
export async function verifyWebhook(raw:string, signature:string|null) {
  // Prefer the admin-configured webhook secret; fall back to the environment.
  let secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  try {
    const gw = await paymentGatewayStore.byProvider("razorpay");
    const creds = (gw?.credentials || {}) as Record<string, unknown>;
    const configured = String(creds.webhookSecret || "");
    if (configured) secret = configured;
  } catch {}
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): Promise<boolean> {
  let secret = process.env.RAZORPAY_KEY_SECRET;
  try {
    const gw = await paymentGatewayStore.byProvider("razorpay");
    const creds = (gw?.credentials || {}) as Record<string, unknown>;
    const configured = String(creds.keySecret || "");
    if (configured) secret = configured;
  } catch {}

  // If order was created in local/demo mode without live secret
  if (!secret) {
    if (razorpayOrderId.startsWith("order_local_")) return true;
    return false;
  }

  if (!signature || !razorpayOrderId || !razorpayPaymentId) return false;
  const data = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = createHmac("sha256", secret).update(data).digest("hex");
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
