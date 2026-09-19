import { json, requireUser, safeText } from "@/lib/http";
import { supportAttachmentStore } from "@/lib/support/attachment-store";
import { ticketConfigStore } from "@/lib/support/ticket-store";
import { supportStore } from "@/lib/support/support-store";

export const dynamic = "force-dynamic";

/**
 * POST — upload a chat/ticket attachment (customer or guest).
 * Files are stored privately and only served through /api/support/attachment/[id]
 * after an ownership check. No predictable public URLs.
 */
export async function POST(request: Request) {
  const user = await requireUser();
  const cfg = ticketConfigStore.get();

  if (!cfg.attachmentsEnabled) return json({ error: "Attachments are disabled." }, 422);
  if (!user && !cfg.attachmentsEnabledForCustomer) {
    return json({ error: "Authentication required for attachments." }, 401);
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "file required." }, 400);

    const conversationId = safeText(form.get("conversationId"), 100);
    const visitorId = safeText(form.get("visitorId"), 100);

    // Conversation ownership check when attaching to a chat
    if (conversationId) {
      const conv = supportStore.getConversation(conversationId);
      if (!conv) return json({ error: "Conversation not found." }, 404);
      const owns = (user && conv.customerId === user.id) || (!user && visitorId && conv.visitorId === visitorId);
      if (!owns) return json({ error: "Unauthorized" }, 403);
    }

    const result = await supportAttachmentStore.upload({
      file,
      conversationId: conversationId || null,
      ownerId: user?.id || null,
      visitorId: visitorId || null,
      maxMb: cfg.maxAttachmentMb,
      allowedTypePrefixes: cfg.allowedAttachmentTypes,
    });

    if (!result.ok) return json({ error: result.error }, 422);

    return json({
      success: true,
      attachment: {
        id: result.record.id,
        filename: result.record.filename,
        mimeType: result.record.mimeType,
        size: result.record.size,
      },
    }, 201);
  } catch {
    return json({ error: "Upload failed." }, 500);
  }
}
