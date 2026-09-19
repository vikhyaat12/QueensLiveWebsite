import { json, requireUser, safeText } from "@/lib/http";
import { ticketStore, ticketConfigStore } from "@/lib/support/ticket-store";
import type { TicketStatus, TicketPriority } from "@/lib/support/ticket-types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES: TicketStatus[] = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "WAITING_FOR_INTERNAL", "RESOLVED", "CLOSED"];
const VALID_PRIORITIES: TicketPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

/** PATCH — admin updates status / priority / assignment / resolution / tags */
export async function PATCH(request: Request, { params }: Params) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const status = safeText(body.status, 30).toUpperCase();
    if (!VALID_STATUSES.includes(status as TicketStatus)) return json({ error: "Invalid status." }, 422);
    patch.status = status;
  }
  if (body.priority !== undefined) {
    const priority = safeText(body.priority, 20).toUpperCase();
    if (!VALID_PRIORITIES.includes(priority as TicketPriority)) return json({ error: "Invalid priority." }, 422);
    patch.priority = priority;
  }
  if (body.assignedToId !== undefined) {
    const assignedToId = safeText(body.assignedToId, 100);
    if (assignedToId === "") {
      patch.assignedTo = null; // unassign
    } else {
      const fileDb = (await import("@/lib/commerce/file-db")).fileDb;
      const agent = fileDb.findOne("users", (u) => u.id === assignedToId && (u.role === "admin" || u.role === "employee"));
      if (!agent) return json({ error: "Agent not found." }, 404);
      patch.assignedTo = { id: agent.id, name: agent.name, email: agent.email };
    }
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) return json({ error: "tags must be an array." }, 422);
    const cfg = ticketConfigStore.get();
    const validTags = new Set(cfg.tags.filter((t) => t.enabled).map((t) => t.name));
    const tags = body.tags.map((t) => safeText(t, 40)).filter((t) => t && validTags.has(t)).slice(0, 10);
    patch.tags = tags;
  }
  if (body.resolutionNote !== undefined) patch.resolutionNote = safeText(body.resolutionNote, 5000);
  if (body.resolutionVisibleToCustomer !== undefined) patch.resolutionVisibleToCustomer = safeText(body.resolutionVisibleToCustomer, 5000);

  const updated = ticketStore.update(id, patch, { id: user.id, name: user.name, role: user.role });
  if (!updated) return json({ error: "Ticket not found." }, 404);

  return json({ success: true, ticket: updated, timeline: ticketStore.getTimeline(id, true) });
}

/** POST — admin actions: link conversation, merge tickets */
export async function POST(request: Request, { params }: Params) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const actor = { id: user.id, name: user.name, role: user.role };
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = safeText(body.action, 30);

  if (action === "link-conversation") {
    const conversationId = safeText(body.conversationId, 100);
    if (!conversationId) return json({ error: "conversationId required." }, 400);
    const ticket = ticketStore.linkConversation(id, conversationId, actor);
    if (!ticket) return json({ error: "Ticket or conversation not found." }, 404);
    return json({ success: true, ticket });
  }

  if (action === "merge") {
    const mergeIds = Array.isArray(body.mergeIds) ? body.mergeIds.map((m) => safeText(m, 100)).filter(Boolean) : [];
    if (!mergeIds.length) return json({ error: "mergeIds required." }, 400);
    const primary = ticketStore.merge(id, mergeIds, actor);
    if (!primary) return json({ error: "Merge failed: tickets not found." }, 404);
    return json({ success: true, ticket: primary });
  }

  return json({ error: "Unknown action." }, 422);
}
