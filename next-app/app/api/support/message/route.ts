import { json, requireUser, safeText } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const conversationId = safeText(body.conversationId, 100);
    const visitorId = safeText(body.visitorId, 100);
    const content = safeText(body.content, 2000);
    const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];
    const attachments = rawAttachments
      .filter((a: any) => a && typeof a.url === "string" && typeof a.filename === "string")
      .map((a: any) => ({
        id: safeText(a.id, 100),
        filename: safeText(a.filename, 255),
        mimeType: safeText(a.mimeType, 100),
        size: Number(a.size) || 0,
        url: safeText(a.url, 500),
      }));

    if (!conversationId || (!content && attachments.length === 0)) {
      return json({ error: "conversationId and content or attachments required" }, 400);
    }

    const conv = supportStore.getConversation(conversationId);
    if (!conv) {
      return json({ error: "Conversation not found" }, 404);
    }

    const user = await requireUser();
    // Security check: verify ownership
    if (user && conv.customerId && conv.customerId !== user.id) {
      return json({ error: "Unauthorized" }, 403);
    } else if (!user && visitorId && conv.visitorId !== visitorId) {
      return json({ error: "Unauthorized" }, 403);
    }

    const result = await supportStore.addCustomerMessage(
      conversationId,
      content,
      {
        currentUrl: safeText(body.currentUrl, 300),
      },
      attachments.length > 0 ? attachments : undefined
    );

    return json(result);
  } catch (err: any) {
    return json({ error: err.message || "Failed to send message" }, 500);
  }
}
