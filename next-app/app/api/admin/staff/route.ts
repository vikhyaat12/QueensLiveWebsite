import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";
import { createHash } from "crypto";
import { logAccessAuditEvent, extractClientMeta } from "@/lib/audit";

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

const DEFAULT_PERMISSIONS = [
  "orders", "products", "customers", "homepage", "pages", "blog",
  "reviews", "marketing", "notifications", "analytics", "employees",
  "b2b", "careers", "settings", "payments", "shipping", "media",
  "social_links", "coupons", "staff",
];

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const users = fileDb.findMany("users");
  const admins = users.filter((u) => u.role === "admin" || u.role === "staff" || u.role === "employee");
  const safe = admins.map((u) => {
    const { password, passwordHash, ...rest } = u as Record<string, unknown> & { password?: string; passwordHash?: string };
    return rest;
  });
  return json({ staff: safe });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const meta = extractClientMeta(request);

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password) {
    return json({ error: "Name, email, and password are required." }, 422);
  }
  const existing = fileDb.findOne("users", (u: Record<string, unknown>) => u.email === body.email);
  if (existing) return json({ error: "An account with this email already exists." }, 409);

  const assignedRole = body.role === "employee" ? "employee" : body.role === "staff" ? "staff" : "admin";
  const assignedPermissions = Array.isArray(body.permissions) ? body.permissions : DEFAULT_PERMISSIONS;

  const staffUser = fileDb.insert("users", {
    name: body.name,
    email: body.email,
    password: hashPassword(body.password),
    role: assignedRole,
    permissions: assignedPermissions,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await logAccessAuditEvent({
    action: "staff_created",
    actorId: String(user.id || user.email),
    actorName: user.name || "Administrator",
    actorEmail: user.email || "",
    targetId: String(staffUser.id),
    targetName: String(body.name),
    targetEmail: String(body.email),
    previousRole: undefined,
    newRole: assignedRole,
    previousPermissions: undefined,
    newPermissions: assignedPermissions,
    reason: body.reason || "Staff account onboarding",
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: "success",
    details: `Admin ${user.name || user.email} created ${assignedRole} account for ${body.name} (${body.email}).`,
  });

  const { password: _, passwordHash: __, ...safe } = staffUser as Record<string, unknown> & { password?: string; passwordHash?: string };
  return json({ staff: safe }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const meta = extractClientMeta(request);

  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "User ID is required." }, 422);

  const existing = fileDb.findOne("users", (u: Record<string, unknown>) => String(u.id) === String(body.id)) as Record<string, unknown> | null;
  if (!existing) return json({ error: "User not found." }, 404);

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.name) updateData.name = body.name;
  if (body.email) updateData.email = body.email;
  if (body.role) updateData.role = body.role;
  if (body.permissions) updateData.permissions = body.permissions;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.password) updateData.password = hashPassword(body.password);

  fileDb.update("users", body.id, updateData);

  // Role transition audit
  if (body.role && body.role !== existing.role) {
    await logAccessAuditEvent({
      action: "role_changed",
      actorId: String(user.id || user.email),
      actorName: user.name || "Administrator",
      actorEmail: user.email || "",
      targetId: String(body.id),
      targetName: String(existing.name || body.name || "User"),
      targetEmail: String(existing.email || body.email || ""),
      previousRole: String(existing.role || "unknown"),
      newRole: String(body.role),
      reason: body.reason || "Administrative role adjustment",
      ip: meta.ip,
      userAgent: meta.userAgent,
      status: "success",
      details: `Admin ${user.name || user.email} changed ${existing.name || existing.email} from ${existing.role} → ${body.role}.`,
    });
  }

  // Permission modification audit
  if (body.permissions && JSON.stringify(body.permissions) !== JSON.stringify(existing.permissions)) {
    await logAccessAuditEvent({
      action: "permissions_updated",
      actorId: String(user.id || user.email),
      actorName: user.name || "Administrator",
      actorEmail: user.email || "",
      targetId: String(body.id),
      targetName: String(existing.name || "User"),
      targetEmail: String(existing.email || ""),
      previousPermissions: (existing.permissions as string[]) || [],
      newPermissions: body.permissions as string[],
      reason: body.reason || "Permission policy update",
      ip: meta.ip,
      userAgent: meta.userAgent,
      status: "success",
      details: `Admin ${user.name || user.email} modified access permissions for ${existing.name || existing.email}.`,
    });
  }

  // Account disable/enable audit
  if (body.isActive !== undefined && body.isActive !== existing.isActive) {
    const isNowActive = Boolean(body.isActive);
    await logAccessAuditEvent({
      action: isNowActive ? "user_enabled" : "user_disabled",
      actorId: String(user.id || user.email),
      actorName: user.name || "Administrator",
      actorEmail: user.email || "",
      targetId: String(body.id),
      targetName: String(existing.name || "User"),
      targetEmail: String(existing.email || ""),
      previousRole: String(existing.role),
      newRole: String(existing.role),
      reason: body.reason || (isNowActive ? "Account restored" : "Account suspended"),
      ip: meta.ip,
      userAgent: meta.userAgent,
      status: "success",
      details: `Admin ${user.name || user.email} ${isNowActive ? "re-enabled" : "disabled"} ${existing.name || existing.email}.`,
    });
  }

  return json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const meta = extractClientMeta(request);

  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "User ID is required." }, 422);
  if (String(body.id) === String(user.id)) {
    return json({ error: "Security restriction: Cannot delete your own active administrator account." }, 400);
  }

  const existing = fileDb.findOne("users", (u: Record<string, unknown>) => String(u.id) === String(body.id)) as Record<string, unknown> | null;
  if (!existing) return json({ error: "User not found." }, 404);

  fileDb.remove("users", body.id);

  await logAccessAuditEvent({
    action: "staff_deleted",
    actorId: String(user.id || user.email),
    actorName: user.name || "Administrator",
    actorEmail: user.email || "",
    targetId: String(body.id),
    targetName: String(existing.name || "User"),
    targetEmail: String(existing.email || ""),
    previousRole: String(existing.role || "staff"),
    reason: body.reason || "Staff account de-provisioning",
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: "success",
    details: `Admin ${user.name || user.email} removed staff account for ${existing.name || existing.email} (${existing.role}).`,
  });

  return json({ ok: true });
}
