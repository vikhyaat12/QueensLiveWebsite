import { json, requireUser, safeText } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";
import { fileDb } from "@/lib/commerce/file-db";

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
  const targetAgentId = safeText(body.targetAgentId, 100);

  let targetAgent: { id: string; name: string; email: string; role: string } | null = null;
  if (targetAgentId && targetAgentId !== "unassigned") {
    const foundUser = fileDb.findOne("users", (u) => u.id === targetAgentId);
    if (!foundUser) {
      return json({ error: "Target agent not found" }, 404);
    }
    targetAgent = {
      id: String(foundUser.id),
      name: String(foundUser.name || "Agent"),
      email: String(foundUser.email || ""),
      role: String(foundUser.role || "employee"),
    };
  }

  const actingAgent = {
    id: user.id,
    name: user.name || "Admin",
    role: user.role,
  };

  const result = supportStore.assignConversation(id, targetAgent, actingAgent);
  return json(result);
}
