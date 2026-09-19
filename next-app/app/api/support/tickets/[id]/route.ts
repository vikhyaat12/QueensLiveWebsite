import { json, requireUser, safeText } from "@/lib/http";
import { ticketStore, ticketConfigStore } from "@/lib/support/ticket-store";
import { supportAttachmentStore } from "@/lib/support/attachment-store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) return json({ error: "Authentication required" }, 401);

  const { id } = await params;
  const ticket = ticketStore.getById(id);
  if (!ticket || ticket.mergedIntoId) return json({ error: "Ticket not found" }, 404);

  // IDOR guard: customers can only read their own tickets
  if (user.role !== "admin" && user.role !== "employee") {
    if (ticket.customerId !== user.id) return json({ error: "Unauthorized" }, 403);
  }

  const includeInternal = user.role === "admin" || user.role === "employee";
  const timeline = ticketStore.getTimeline(id, includeInternal);

  return json({
    ticket,
    timeline,
    attachments: (ticket.attachments || []).map((a) => ({ ...a, storageKey: undefined })),
  });
}

/** Customer reply / admin note+reply / reopen */
export async function POST(request: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) return json({ error: "Authentication required" }, 401);

  const { id } = await params;
  const ticket = ticketStore.getById(id);
  if (!ticket || ticket.mergedIntoId) return json({ error: "Ticket not found" }, 404);

  const isAdmin = user.role === "admin" || user.role === "employee";
  if (!isAdmin && ticket.customerId !== user.id) {
    return json({ error: "Unauthorized" }, 403);
  }

  const contentType = request.headers.get("content-type") || "";
  let message = "", isInternal = false, reopen = false;
  let files: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    message = safeText(form.get("message"), 5000);
    isInternal = form.get("isInternal") === "true";
    reopen = form.get("reopen") === "true";
    files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 5);
  } else {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    message = safeText(body.message, 5000);
    isInternal = body.isInternal === true;
    reopen = body.reopen === true;
  }

  const cfg = ticketConfigStore.get();

  // Reopen rules
  if (reopen) {
    if (!ticketStore.canReopen(ticket)) {
      return json({ error: "This ticket can no longer be reopened." }, 422);
    }
    ticketStore.update(id, { status: "OPEN" }, { id: user.id, name: user.name, role: user.role });
  }

  const ticketNow = ticketStore.getById(id)!;
  if (["RESOLVED", "CLOSED"].includes(ticketNow.status) && message && !isAdmin) {
    return json({ error: "Ticket is closed. Reopen it to reply." }, 422);
  }

  if (message) {
    ticketStore.addTimeline(id, {
      type: isAdmin ? (isInternal ? "internal_note" : "agent_reply") : "customer_message",
      actor: { id: user.id, name: user.name, role: user.role },
      content: message,
      isInternal: isAdmin && isInternal,
    });
    if (isAdmin && !isInternal) {
      ticketStore.recordAgentReply(id);
      // Agent reply on a NEW ticket moves it to OPEN automatically
      if (ticketNow.status === "NEW") ticketStore.update(id, { status: "OPEN" }, { id: user.id, name: user.name, role: user.role });
    }
  }

  // Attachments on replies
  const uploadedNames: string[] = [];
  for (const f of files) {
    if (!cfg.attachmentsEnabled) break;
    if (!isAdmin && !cfg.attachmentsEnabledForCustomer) break;
    const up = await supportAttachmentStore.upload({
      file: f,
      ticketId: id,
      ownerId: user.id,
      maxMb: cfg.maxAttachmentMb,
      allowedTypePrefixes: cfg.allowedAttachmentTypes,
    });
    if (up.ok) {
      supportAttachmentStore.linkToTicket([up.record.id], id);
      uploadedNames.push(up.record.filename);
      ticketStore.addTimeline(id, {
        type: "attachment_added",
        actor: { id: user.id, name: user.name, role: user.role },
        content: `Attachment added: ${up.record.filename}`,
        isInternal: false,
      });
    }
  }

  const finalTicket = ticketStore.getById(id);
  return json({
    success: true,
    ticket: finalTicket,
    timeline: ticketStore.getTimeline(id, isAdmin),
  });
}
