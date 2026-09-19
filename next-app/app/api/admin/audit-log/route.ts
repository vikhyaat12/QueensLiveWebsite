import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  const action = url.searchParams.get("action")?.trim();
  const actor = url.searchParams.get("actor")?.trim().toLowerCase();
  const target = url.searchParams.get("target")?.trim().toLowerCase();
  const role = url.searchParams.get("role")?.trim().toLowerCase();
  const format = url.searchParams.get("format");

  let logs = fileDb.findMany("auditLogs") as Array<Record<string, unknown>>;

  if (action) {
    logs = logs.filter((l) => String(l.action || "") === action);
  }

  if (actor) {
    logs = logs.filter((l) =>
      String(l.actorId || "").toLowerCase().includes(actor) ||
      String(l.actorName || "").toLowerCase().includes(actor) ||
      String(l.actorEmail || "").toLowerCase().includes(actor)
    );
  }

  if (target) {
    logs = logs.filter((l) =>
      String(l.targetId || "").toLowerCase().includes(target) ||
      String(l.targetName || "").toLowerCase().includes(target) ||
      String(l.targetEmail || "").toLowerCase().includes(target)
    );
  }

  if (role) {
    logs = logs.filter((l) =>
      String(l.newRole || "").toLowerCase() === role ||
      String(l.previousRole || "").toLowerCase() === role
    );
  }

  if (search) {
    logs = logs.filter((l) =>
      String(l.id || "").toLowerCase().includes(search) ||
      String(l.details || "").toLowerCase().includes(search) ||
      String(l.actorName || "").toLowerCase().includes(search) ||
      String(l.actorEmail || "").toLowerCase().includes(search) ||
      String(l.targetName || "").toLowerCase().includes(search) ||
      String(l.targetEmail || "").toLowerCase().includes(search) ||
      String(l.action || "").toLowerCase().includes(search) ||
      String(l.reason || "").toLowerCase().includes(search)
    );
  }

  logs.sort((a, b) =>
    new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime()
  );

  // CSV Export support
  if (format === "csv") {
    const headers = ["Event ID", "Timestamp", "Action", "Actor Name", "Actor Email", "Target Name", "Target Email", "Previous Role", "New Role", "Status", "IP", "Reason", "Details"];
    const rows = logs.map((l) => [
      `"${String(l.id || "").replace(/"/g, '""')}"`,
      `"${String(l.createdAt || "").replace(/"/g, '""')}"`,
      `"${String(l.action || "").replace(/"/g, '""')}"`,
      `"${String(l.actorName || l.actorId || "").replace(/"/g, '""')}"`,
      `"${String(l.actorEmail || "").replace(/"/g, '""')}"`,
      `"${String(l.targetName || l.targetId || "").replace(/"/g, '""')}"`,
      `"${String(l.targetEmail || "").replace(/"/g, '""')}"`,
      `"${String(l.previousRole || "").replace(/"/g, '""')}"`,
      `"${String(l.newRole || "").replace(/"/g, '""')}"`,
      `"${String(l.status || "success").replace(/"/g, '""')}"`,
      `"${String(l.ip || "").replace(/"/g, '""')}"`,
      `"${String(l.reason || "").replace(/"/g, '""')}"`,
      `"${String(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="queenscare-access-audit-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  const total = logs.length;
  const paged = logs.slice(offset, offset + limit);

  return json({ logs: paged, total, offset, limit });
}
