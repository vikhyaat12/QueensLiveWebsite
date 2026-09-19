import { json, requireUser, safeText } from "@/lib/http";
import { ticketStore, ticketConfigStore } from "@/lib/support/ticket-store";
import { supportStore } from "@/lib/support/support-store";
import { supportAttachmentStore } from "@/lib/support/attachment-store";
import { fileDb } from "@/lib/commerce/file-db";
void fileDb;

export const dynamic = "force-dynamic";

/**
 * POST — Admin creates a ticket FROM a customer conversation.
 * The conversation ownership is implicit (admin view); attachments are chosen
 * by the admin from the conversation's existing uploads. Customer details are
 * taken from the conversation record, not from the client payload.
 */
export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const conversationId = safeText(body.conversationId, 100);
  const subject = safeText(body.subject, 200);
  const description = safeText(body.description, 5000);
  const category = safeText(body.category, 80);
  const priority = safeText(body.priority, 20).toUpperCase();
  const orderId = safeText(body.orderId, 100);
  const productId = safeText(body.productId, 100);
  const attachmentIds = Array.isArray(body.attachmentIds)
    ? body.attachmentIds.map((a) => safeText(a, 100)).filter(Boolean).slice(0, 10)
    : [];

  if (!conversationId || !subject || !description || !category) {
    return json({ error: "conversationId, subject, description and category are required." }, 400);
  }

  const conv = supportStore.getConversation(conversationId);
  if (!conv) return json({ error: "Conversation not found." }, 404);

  const cfg = ticketConfigStore.get();
  if (!cfg.categories.some((c) => c.enabled && c.name === category)) {
    return json({ error: "Invalid category." }, 422);
  }

  // Every selected attachment must actually belong to this conversation
  const ownedAttachments: Array<{ id: string; filename: string; mimeType: string; size: number }> = [];
  for (const attId of attachmentIds) {
    const rec = supportAttachmentStore.byId(attId);
    if (!rec) return json({ error: "Attachment not found." }, 404);
    if (rec.conversationId !== conversationId) {
      return json({ error: "Attachment does not belong to this conversation." }, 403);
    }
    ownedAttachments.push({ id: rec.id, filename: rec.filename, mimeType: rec.mimeType, size: rec.size });
  }

  // Validate order reference if provided
  let validatedOrderId: string | null = null;
  if (orderId) {
    const order = fileDb.findOne("orders", (o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return json({ error: "Order not found." }, 404);
    validatedOrderId = String(order.id);
  }

  const { ticket } = ticketStore.create({
    subject,
    description,
    category,
    priority: ["LOW", "NORMAL", "HIGH", "URGENT"].includes(priority) ? (priority as "LOW" | "NORMAL" | "HIGH" | "URGENT") : "NORMAL",
    customerId: conv.customerId || null,
    customerName: conv.customerName,
    customerEmail: conv.customerEmail || null,
    conversationId,
    orderId: validatedOrderId,
    productId: productId || null,
    attachments: ownedAttachments,
    tags: [],
    actor: { id: user.id, name: user.name, role: user.role },
  });

  supportAttachmentStore.linkToTicket(attachmentIds, ticket.id);

  // System note inside the chat thread so the customer sees the linkage
  supportStore.addAgentMessage(
    conversationId,
    `A support ticket has been created for this conversation: ${ticket.ticketNumber}. Our team will keep the resolution updates there.`,
    { id: user.id, name: user.name, role: user.role },
    false
  );

  return json({ success: true, ticket }, 201);
}
