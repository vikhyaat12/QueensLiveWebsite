import { json, requireUser, safeText } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

export async function GET(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const status = safeText(url.searchParams.get("status"), 30);
  const handlingMode = safeText(url.searchParams.get("handlingMode"), 30);
  const assignedTo = safeText(url.searchParams.get("assignedTo"), 50);
  const search = safeText(url.searchParams.get("search"), 100);
  const humanRequested = url.searchParams.get("humanRequested") === "true";
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "30", 10);

  const result = supportStore.listConversations({
    status: status || undefined,
    handlingMode: handlingMode || undefined,
    assignedTo: assignedTo || undefined,
    search: search || undefined,
    humanRequested: humanRequested || undefined,
    unreadOnly: unreadOnly || undefined,
    page,
    limit,
  });

  return json(result);
}
