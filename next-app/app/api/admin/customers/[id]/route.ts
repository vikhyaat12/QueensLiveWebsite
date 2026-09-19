import { json, requireUser } from "@/lib/http";
import { customerStore } from "@/lib/commerce/store-extensions";
import { logAccessAuditEvent, extractClientMeta } from "@/lib/audit";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const admin = await requireUser(["admin"]);
  if (!admin) return json({ error: "Unauthorized" }, 401);

  const { id } = await props.params;
  const detail = await customerStore.byId(id);
  if (!detail) return json({ error: "Customer not found." }, 404);

  return json(detail);
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const admin = await requireUser(["admin"]);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const meta = extractClientMeta(request);

  const { id } = await props.params;
  const body = await request.json().catch(() => ({}));
  const status = body?.status || (body?.action === "disable" ? "disabled" : body?.action === "enable" ? "active" : null);

  if (status !== "active" && status !== "disabled") {
    return json({ error: "Status must be either 'active' or 'disabled'." }, 422);
  }

  const existing = await customerStore.byId(id);
  if (!existing) return json({ error: "Customer not found." }, 404);

  const updated = await customerStore.setStatus(id, status, admin.id);
  if (!updated) return json({ error: "Customer not found." }, 404);

  const targetUser = (existing.user || {}) as Record<string, unknown>;
  const isEnabled = status === "active";
  await logAccessAuditEvent({
    action: isEnabled ? "user_enabled" : "user_disabled",
    actorId: String(admin.id || admin.email),
    actorName: admin.name || "Administrator",
    actorEmail: admin.email || "",
    targetId: String(id),
    targetName: String(targetUser.name || "Customer"),
    targetEmail: String(targetUser.email || ""),
    previousRole: "customer",
    newRole: "customer",
    reason: body?.reason || (isEnabled ? "Customer account re-enabled by admin" : "Customer account disabled by admin"),
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: "success",
    details: `Admin ${admin.name || admin.email} ${isEnabled ? "re-enabled" : "disabled"} customer account for ${targetUser.name || targetUser.email || id}.`,
  });

  return json({ ok: true, user: updated });
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const admin = await requireUser(["admin"]);
  if (!admin) return json({ error: "Unauthorized" }, 401);
  const meta = extractClientMeta(request);

  const { id } = await props.params;
  const body = await request.json().catch(() => ({}));
  const existing = await customerStore.byId(id);
  if (!existing) return json({ error: "Customer not found." }, 404);

  const result = await customerStore.deactivate(id, admin.id);
  if (!result) return json({ error: "Customer not found." }, 404);

  const targetUser = (existing.user || {}) as Record<string, unknown>;
  await logAccessAuditEvent({
    action: "user_deactivated",
    actorId: String(admin.id || admin.email),
    actorName: admin.name || "Administrator",
    actorEmail: admin.email || "",
    targetId: String(id),
    targetName: String(targetUser.name || "Customer"),
    targetEmail: String(targetUser.email || ""),
    previousRole: "customer",
    reason: body?.reason || "Account GDPR / DPDP deactivation request",
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: "success",
    details: `Admin ${admin.name || admin.email} deactivated and anonymized customer ${targetUser.name || targetUser.email || id}. Retained ${result.historicalOrdersPreserved} orders.`,
  });

  return json({
    ok: true,
    message: `Account deactivated. ${result.historicalOrdersPreserved} historical orders preserved.`,
    retainedOrdersCount: result.historicalOrdersPreserved,
    historicalOrdersPreserved: result.historicalOrdersPreserved,
  });
}
