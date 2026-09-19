import { json, requireUser, safeText } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";
import type { ConversationStatus } from "@/lib/support/support-types";

const VALID_STATUSES: ConversationStatus[] = [
  "new",
  "open",
  "waiting_customer",
  "waiting_support",
  "resolved",
  "closed",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { id } = await params;
  const conv = supportStore.getConversation(id);
  if (!conv) {
    return json({ error: "Conversation not found" }, 404);
  }

  const body = await request.json().catch(() => ({}));
  const status = safeText(body.status, 30) as ConversationStatus;

  if (!VALID_STATUSES.includes(status)) {
    return json({ error: "Invalid status value" }, 400);
  }

  const agent = {
    id: user.id,
    name: user.name || "Admin",
    role: user.role,
  };

  const result = supportStore.updateStatus(id, status, agent);
  return json(result);
}
