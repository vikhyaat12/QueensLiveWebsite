import { fileDb } from "@/lib/commerce/file-db";
import { randomBytes } from "crypto";

export interface AccessAuditEvent {
  id: string;
  action:
    | "staff_created"
    | "staff_deleted"
    | "role_granted"
    | "role_changed"
    | "permissions_updated"
    | "user_disabled"
    | "user_enabled"
    | "user_deactivated"
    | "password_reset_by_admin"
    | string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetId: string;
  targetName: string;
  targetEmail: string;
  previousRole?: string;
  newRole?: string;
  previousPermissions?: string[];
  newPermissions?: string[];
  reason?: string;
  ip?: string;
  userAgent?: string;
  status: "success" | "failure";
  details: string;
  createdAt: string;
}

export function extractClientMeta(request?: Request): { ip: string; userAgent: string } {
  if (!request) return { ip: "127.0.0.1", userAgent: "Internal System" };
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (request.headers.get("x-real-ip") || "127.0.0.1");
  const userAgent = request.headers.get("user-agent") || "Unknown Device";
  return { ip, userAgent };
}

export async function logAccessAuditEvent(event: Omit<AccessAuditEvent, "id" | "createdAt">): Promise<AccessAuditEvent> {
  const auditId = `AUD-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const record: AccessAuditEvent = {
    ...event,
    id: auditId,
    createdAt: new Date().toISOString(),
  };

  try {
    fileDb.insert("auditLogs", record as unknown as Record<string, unknown>);
  } catch (e) {
    console.error("Failed to write access audit log:", e);
  }

  return record;
}
