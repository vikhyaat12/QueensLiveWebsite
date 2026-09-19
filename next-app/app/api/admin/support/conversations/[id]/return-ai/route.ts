import { json, requireUser } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

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

  const agent = {
    id: user.id,
    name: user.name || "Support Specialist",
    role: user.role,
  };

  const result = supportStore.returnToAi(id, agent);
  return json(result);
}
