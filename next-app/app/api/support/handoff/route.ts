import { json, requireUser, safeText } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const conversationId = safeText(body.conversationId, 100);
    const visitorId = safeText(body.visitorId, 100);

    if (!conversationId) {
      return json({ error: "conversationId required" }, 400);
    }

    const conv = supportStore.getConversation(conversationId);
    if (!conv) {
      return json({ error: "Conversation not found" }, 404);
    }

    const user = await requireUser();
    if (user && conv.customerId && conv.customerId !== user.id) {
      return json({ error: "Unauthorized" }, 403);
    } else if (!user && visitorId && conv.visitorId !== visitorId) {
      return json({ error: "Unauthorized" }, 403);
    }

    const result = supportStore.requestHandoff(conversationId);
    return json({ success: true, ...result });
  } catch (err: any) {
    return json({ error: err.message || "Failed to request handoff" }, 500);
  }
}
