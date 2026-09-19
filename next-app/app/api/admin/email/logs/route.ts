import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10));
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  const status = url.searchParams.get("status")?.trim();
  const templateId = url.searchParams.get("templateId")?.trim();

  let logs = fileDb.findMany("emailLogs") as Array<Record<string, unknown>>;

  if (status) {
    logs = logs.filter((l) => String(l.status || "") === status);
  }

  if (templateId) {
    logs = logs.filter((l) => String(l.templateId || "") === templateId);
  }

  if (search) {
    logs = logs.filter((l) =>
      String(l.id || "").toLowerCase().includes(search) ||
      String(l.recipientEmail || "").toLowerCase().includes(search) ||
      String(l.recipientName || "").toLowerCase().includes(search) ||
      String(l.subject || "").toLowerCase().includes(search) ||
      String(l.templateId || "").toLowerCase().includes(search)
    );
  }

  logs.sort((a, b) =>
    new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime()
  );

  const total = logs.length;
  const paged = logs.slice(offset, offset + limit);

  return json({ logs: paged, total, offset, limit });
}
