import { json, requireUser, safeText } from "@/lib/http";
import { ticketConfigStore, ticketStore } from "@/lib/support/ticket-store";
import { logAccessAuditEvent } from "@/lib/audit";
import type { SupportTicketConfig } from "@/lib/support/ticket-types";

export const dynamic = "force-dynamic";

/** GET — full admin ticket configuration */
export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ config: ticketConfigStore.get() });
}

/** PUT — save config patches; every change is audit-logged with old→new */
export async function PUT(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized — admin only." }, 401);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const before = ticketConfigStore.get();
  const actor = { id: user.id, name: user.name, role: user.role };

  // Simple scalar patches
  const scalarPatch: Partial<SupportTicketConfig> = {};
  if (body.attachmentsEnabled !== undefined) scalarPatch.attachmentsEnabled = Boolean(body.attachmentsEnabled);
  if (body.attachmentsEnabledForCustomer !== undefined) scalarPatch.attachmentsEnabledForCustomer = Boolean(body.attachmentsEnabledForCustomer);
  if (body.maxAttachmentMb !== undefined) {
    const mb = Number(body.maxAttachmentMb);
    if (!Number.isFinite(mb) || mb < 1 || mb > 100) return json({ error: "maxAttachmentMb must be 1–100." }, 422);
    scalarPatch.maxAttachmentMb = Math.round(mb);
  }
  if (body.reopenWindowDays !== undefined) {
    const d = Number(body.reopenWindowDays);
    if (!Number.isInteger(d) || d < 0 || d > 365) return json({ error: "reopenWindowDays must be 0–365." }, 422);
    scalarPatch.reopenWindowDays = d;
  }
  if (body.numbering !== undefined) {
    const n = body.numbering as Record<string, unknown>;
    scalarPatch.numbering = {
      prefix: safeText(n.prefix, 10) || "QC",
      includeYear: n.includeYear !== false,
      padLength: Math.min(10, Math.max(2, Number(n.padLength) || 6)),
      nextSequence: Math.max(1, Number(n.nextSequence) || before.numbering.nextSequence),
    };
  }
  if (body.allowedAttachmentTypes !== undefined && Array.isArray(body.allowedAttachmentTypes)) {
    scalarPatch.allowedAttachmentTypes = body.allowedAttachmentTypes.map((t) => safeText(t, 60)).filter(Boolean).slice(0, 12);
  }

  if (Object.keys(scalarPatch).length) {
    ticketConfigStore.save(scalarPatch);
    logAccessAuditEvent({
      action: "ticket_config_updated",
      actorId: actor.id, actorName: actor.name, actorEmail: user.email,
      targetId: "support_ticket_config", targetName: "Ticket configuration", targetEmail: "",
      status: "success",
      details: `Changed: ${Object.keys(scalarPatch).join(", ")}`,
    });
  }

  // Category/tag mutations
  if (body.upsertCategory && typeof body.upsertCategory === "object") {
    const c = body.upsertCategory as Record<string, unknown>;
    ticketConfigStore.upsertCategory({ name: safeText(c.name, 60), enabled: c.enabled !== false, sortOrder: Number(c.sortOrder) || undefined, id: safeText(c.id, 60) || undefined });
  }
  if (body.deleteCategoryId) ticketConfigStore.deleteCategory(safeText(body.deleteCategoryId, 60));
  if (body.upsertTag && typeof body.upsertTag === "object") {
    const t = body.upsertTag as Record<string, unknown>;
    ticketConfigStore.upsertTag({ name: safeText(t.name, 40), enabled: t.enabled !== false, id: safeText(t.id, 60) || undefined });
  }
  if (body.deleteTagId) ticketConfigStore.deleteTag(safeText(body.deleteTagId, 60));

  return json({ success: true, config: ticketConfigStore.get() });
}

/** Sanity: expose count for the settings UI */
export async function POST() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ total: ticketStore.list({}).total });
}
