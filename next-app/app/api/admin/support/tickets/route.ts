import { json, requireUser, safeText } from "@/lib/http";
import { ticketStore, ticketConfigStore } from "@/lib/support/ticket-store";

export const dynamic = "force-dynamic";

/** GET — admin ticket list with full filters + config */
export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const cfg = ticketConfigStore.get();

  const { tickets, total } = ticketStore.list({
    status: safeText(url.searchParams.get("status"), 30) || undefined,
    priority: safeText(url.searchParams.get("priority"), 20) || undefined,
    category: safeText(url.searchParams.get("category"), 80) || undefined,
    assignedTo: safeText(url.searchParams.get("assignedTo"), 100) || undefined,
    orderId: safeText(url.searchParams.get("orderId"), 100) || undefined,
    tag: safeText(url.searchParams.get("tag"), 40) || undefined,
    search: safeText(url.searchParams.get("search"), 100) || undefined,
    dateFrom: safeText(url.searchParams.get("dateFrom"), 30) || undefined,
    dateTo: safeText(url.searchParams.get("dateTo"), 30) || undefined,
  });

  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const start = (page - 1) * limit;

  return json({
    tickets: tickets.slice(start, start + limit),
    total,
    page,
    config: cfg,
  });
}
