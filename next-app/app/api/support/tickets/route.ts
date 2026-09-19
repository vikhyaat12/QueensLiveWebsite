import { json, requireUser, safeText } from "@/lib/http";
import { ticketStore, ticketConfigStore } from "@/lib/support/ticket-store";
import { supportStore } from "@/lib/support/support-store";
import { supportAttachmentStore } from "@/lib/support/attachment-store";
import { fileDb } from "@/lib/commerce/file-db";
import type { TicketPriority } from "@/lib/support/ticket-types";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
   GET — list MY tickets (customer, ownership enforced)
   ───────────────────────────────────────────── */
export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Authentication required" }, 401);

  // Customers only ever see tickets tied to their own account
  const { tickets } = ticketStore.list({ customerId: user.id });
  return json({
    tickets: tickets.map((t) => ({ ...t, timeline: undefined })),
    config: {
      categories: ticketConfigStore.get().categories.filter((c) => c.enabled),
      reopenWindowDays: ticketConfigStore.get().reopenWindowDays,
    },
  });
}

/* ─────────────────────────────────────────────
   POST — create ticket (customer or guest-from-chat)
   Accepts JSON (no attachments) or multipart (with attachments).
   ───────────────────────────────────────────── */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const contentType = request.headers.get("content-type") || "";

    let subject: string, description: string, category: string, priority: string;
    let conversationId: string, orderId: string, productId: string, visitorId: string;
    let attachmentIds: string[] = [];
    let attachmentFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      subject = safeText(form.get("subject"), 200);
      description = safeText(form.get("description"), 5000);
      category = safeText(form.get("category"), 80);
      priority = safeText(form.get("priority"), 20);
      conversationId = safeText(form.get("conversationId"), 100);
      orderId = safeText(form.get("orderId"), 100);
      productId = safeText(form.get("productId"), 100);
      visitorId = safeText(form.get("visitorId"), 100);
      const idsRaw = safeText(form.get("attachmentIds"), 500);
      attachmentIds = idsRaw ? idsRaw.split(",").filter(Boolean).slice(0, 10) : [];
      attachmentFiles = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 5);
    } else {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      subject = safeText(body.subject, 200);
      description = safeText(body.description, 5000);
      category = safeText(body.category, 80);
      priority = safeText(body.priority, 20);
      conversationId = safeText(body.conversationId, 100);
      orderId = safeText(body.orderId, 100);
      productId = safeText(body.productId, 100);
      visitorId = safeText(body.visitorId, 100);
      const idsRaw = safeText(body.attachmentIds, 500);
      attachmentIds = idsRaw ? idsRaw.split(",").filter(Boolean).slice(0, 10) : [];
    }

    if (!subject || !description || !category) {
      return json({ error: "Subject, description and category are required." }, 400);
    }

    const cfg = ticketConfigStore.get();

    // Feature validation: attachments only when enabled
    if ((attachmentIds.length || attachmentFiles.length) && !cfg.attachmentsEnabled) {
      return json({ error: "Attachments are not enabled." }, 422);
    }

    // Category must be an enabled Admin category
    if (!cfg.categories.some((c) => c.enabled && c.name === category)) {
      return json({ error: "Invalid category." }, 422);
    }

    // Priority: only workflow priority, customers cannot set URGENT (medical-triage safety)
    let safePriority: TicketPriority = "NORMAL";
    const requested = priority.toUpperCase() as TicketPriority;
    if (user && ["LOW", "NORMAL", "HIGH"].includes(requested)) safePriority = requested;

    // Ownership verification of the conversation BEFORE linking
    const conversation = conversationId ? supportStore.getConversation(conversationId) : null;
    if (conversationId && !conversation) {
      return json({ error: "Conversation not found." }, 404);
    }
    if (conversation) {
      const ownsConv = (user && conversation!.customerId === user.id) || (!user && visitorId && conversation!.visitorId === visitorId);
      if (!ownsConv) {
        return json({ error: "You are not allowed to link this conversation." }, 403);
      }
    }

    // Order ownership check: order must belong to this user (or match chat email)
    let validatedOrderId: string | null = null;
    if (orderId) {
      const order = fileDb.findOne("orders", (o) => o.id === orderId || o.orderNumber === orderId);
      if (!order) {
        return json({ error: "Order not found." }, 404);
      }
      const orderOwned =
        (user && (order.userId === user.id || order.customerId === user.id)) ||
        (conversation && conversation.customerId && order.userId === conversation.customerId) ||
        (conversation?.customerEmail && (order.shipping as Record<string, unknown> | undefined)?.email === conversation.customerEmail);
      if (!orderOwned) {
        return json({ error: "You can only reference your own orders." }, 403);
      }
      validatedOrderId = String(order.id);
    }

    // Attachment-id ownership: each referenced attachment must belong to the
    // caller's conversation (or be theirs by ownerId)
    const ownedAttachments: Array<{ id: string; filename: string; mimeType: string; size: number; messageId?: string; conversationId?: string }> = [];
    for (const attId of attachmentIds) {
      const rec = supportAttachmentStore.byId(attId);
      if (!rec) return json({ error: "Attachment not found." }, 404);
      const ownsAtt =
        (user && (rec.ownerId === user.id || (conversation && rec.conversationId === conversation.id))) ||
        (!user && ((conversation && rec.conversationId === conversation.id) || rec.visitorId === visitorId));
      if (!ownsAtt) return json({ error: "Attachment is not yours." }, 403);
      ownedAttachments.push({ id: rec.id, filename: rec.filename, mimeType: rec.mimeType, size: rec.size, messageId: rec.messageId || undefined, conversationId: rec.conversationId || undefined });
    }

    const result = ticketStore.create({
      subject,
      description,
      category,
      priority: safePriority,
      customerId: user?.id || conversation?.customerId || null,
      customerName: user?.name || conversation?.customerName || "Guest",
      customerEmail: user?.email || conversation?.customerEmail || null,
      conversationId: conversation?.id || null,
      orderId: validatedOrderId,
      productId: productId || null,
      attachments: ownedAttachments,
      actor: user
        ? { id: user.id, name: user.name, role: user.role }
        : { id: visitorId || "guest", name: conversation?.customerName || "Guest", role: "customer" },
    });

    if (result.ticket) {
      supportAttachmentStore.linkToTicket(attachmentIds, result.ticket.id);

      // Upload any newly attached files directly
      for (const f of attachmentFiles) {
        if (!cfg.attachmentsEnabled || !cfg.attachmentsEnabledForCustomer) break;
        const up = await supportAttachmentStore.upload({
          file: f,
          conversationId: conversation?.id || null,
          ticketId: result.ticket.id,
          ownerId: user?.id || null,
          visitorId: visitorId || null,
          maxMb: cfg.maxAttachmentMb,
          allowedTypePrefixes: cfg.allowedAttachmentTypes,
        });
        if (up.ok) {
          supportAttachmentStore.linkToTicket([up.record.id], result.ticket.id);
        }
      }
    }

    return json({
      success: true,
      ticket: { ...result.ticket, timeline: undefined },
    }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create ticket";
    return json({ error: message }, 500);
  }
}
