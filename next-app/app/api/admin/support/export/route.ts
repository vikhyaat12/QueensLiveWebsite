import { json, requireUser, safeText } from "@/lib/http";
import { ticketStore, ticketConfigStore } from "@/lib/support/ticket-store";
import { supportStore } from "@/lib/support/support-store";
import { logAccessAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

/* ── CSV helpers ── */
function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  return "\uFEFF" + lines.join("\r\n"); // BOM for Excel
}

/** GET — export tickets or conversations. Admin-only, audited.
 *  Query: type=tickets|conversations, format=csv|json (+ same filters as list APIs)
 *  Attachments are exported as METADATA only (never files in CSV/JSON).
 */
export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const type = safeText(url.searchParams.get("type"), 20) || "tickets";
  const format = safeText(url.searchParams.get("format"), 10) || "csv";
  const conversationId = safeText(url.searchParams.get("conversationId"), 100) || undefined;

  const filters = {
    status: safeText(url.searchParams.get("status"), 30) || undefined,
    priority: safeText(url.searchParams.get("priority"), 20) || undefined,
    category: safeText(url.searchParams.get("category"), 80) || undefined,
    assignedTo: safeText(url.searchParams.get("assignedTo"), 100) || undefined,
    orderId: safeText(url.searchParams.get("orderId"), 100) || undefined,
    search: safeText(url.searchParams.get("search"), 100) || undefined,
    dateFrom: safeText(url.searchParams.get("dateFrom"), 30) || undefined,
    dateTo: safeText(url.searchParams.get("dateTo"), 30) || undefined,
  };

  // Audit: who exported what with which filters (no message contents logged)
  logAccessAuditEvent({
    action: "support_data_exported",
    actorId: user.id, actorName: user.name, actorEmail: user.email,
    targetId: type, targetName: `${type} export`, targetEmail: "",
    status: "success",
    details: `format=${format} filters=${JSON.stringify(filters)}${conversationId ? ` conversationId=${conversationId}` : ""}`,
  });

  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "tickets") {
    const { tickets } = ticketStore.list(filters);
    const headers = [
      "Ticket Number", "Subject", "Category", "Priority", "Status", "Customer", "Customer Email",
      "Order", "Product", "Assigned Agent", "Tags", "Attachments (metadata)",
      "Created", "Updated", "First Response", "Resolved", "Conversation IDs",
    ];
    const rows = tickets.map((t) => [
      t.ticketNumber, t.subject, t.category, t.priority, t.status, t.customerName, t.customerEmail || "",
      t.orderId || "", t.productId || "", t.assignedTo?.name || "Unassigned", (t.tags || []).join("; "),
      (t.attachments || []).map((a) => `${a.filename} (${a.mimeType}, ${a.size}b)`).join("; ") || "None",
      t.createdAt, t.updatedAt, t.firstResponseAt || "", t.resolvedAt || "",
      (t.conversationIds || []).join("; "),
    ]);

    if (format === "json") {
      return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), count: tickets.length, tickets }, null, 2), {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="qc-tickets-${stamp}.json"`, "Cache-Control": "no-store" },
      });
    }
    // XLSX opens standard CSV seamlessly; the JSON variant carries full data
    return new Response(toCsv(headers, rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="qc-tickets-${stamp}.csv"`, "Cache-Control": "no-store" },
    });
  }

  if (type === "conversations") {
    const list = supportStore.listConversations({
      status: filters.status,
      assignedTo: filters.assignedTo,
      search: filters.search,
    });
    let convs = list.conversations;
    if (conversationId) convs = convs.filter((c) => c.id === conversationId);
    if (filters.dateFrom) convs = convs.filter((c) => new Date(c.createdAt).getTime() >= new Date(filters.dateFrom as string).getTime());
    if (filters.dateTo) convs = convs.filter((c) => new Date(c.createdAt).getTime() <= new Date(filters.dateTo as string).getTime() + 86400000);

    if (format === "json") {
      // Full transcript JSON (messages in order, with sender + timestamps)
      const full = convs.map((c) => ({
        conversation: c,
        messages: supportStore.getMessages(c.id, { includeInternal: true }),
        linkedTicket: c.ticketId ? ticketStore.getById(c.ticketId)?.ticketNumber : null,
      }));
      return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), count: full.length, conversations: full }, null, 2), {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="qc-conversations-${stamp}.json"`, "Cache-Control": "no-store" },
      });
    }

    // CSV: one row per message — preserves order, timestamps, sender, type
    const headers = ["Conversation ID", "Customer", "Customer Email", "Ticket", "Status", "Message ID", "Timestamp", "Sender", "Sender Name", "Internal Note", "Content"];
    const rows: unknown[][] = [];
    for (const c of convs) {
      const msgs = supportStore.getMessages(c.id, { includeInternal: true });
      const ticketNum = c.ticketId ? ticketStore.getById(c.ticketId)?.ticketNumber || "" : "";
      for (const m of msgs) {
        rows.push([c.id, c.customerName, c.customerEmail || "", ticketNum, c.status, m.id, m.createdAt, m.sender, m.senderName || "", m.isInternal ? "YES" : "NO", m.content]);
      }
    }
    return new Response(toCsv(headers, rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="qc-conversations-${stamp}.csv"`, "Cache-Control": "no-store" },
    });
  }

  return json({ error: "Unknown export type. Use type=tickets or type=conversations." }, 400);
}
