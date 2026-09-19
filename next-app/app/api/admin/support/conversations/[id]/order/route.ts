import { json, requireUser, safeText } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { id } = await params;
  const conv = supportStore.getConversation(id);
  if (!conv) {
    return json({ error: "Conversation not found" }, 404);
  }

  const url = new URL(request.url);
  const orderId = safeText(url.searchParams.get("orderId"), 50);

  if (!orderId) {
    return json({ error: "orderId required" }, 400);
  }

  const order = supportStore.getOrderDetails(orderId);
  if (!order) {
    return json({ error: "Order not found" }, 404);
  }

  // IDOR check: if customerId exists on conversation, verify order relates to customer
  if (conv.customerId && order.userId && order.userId !== conv.customerId) {
    return json({ error: "Order does not belong to this customer" }, 403);
  }

  return json({ order });
}
