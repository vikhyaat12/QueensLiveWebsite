import { json, requireUser } from "@/lib/http";
import { supportStore } from "@/lib/support/support-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { id } = await params;
  const conversation = supportStore.getConversation(id);
  if (!conversation) {
    return json({ error: "Conversation not found" }, 404);
  }

  // Mark as read by admin
  supportStore.markReadByAdmin(id);

  // Return full messages including internal notes
  const messages = supportStore.getMessages(id, { includeInternal: true });
  const context = supportStore.getCustomerContext(id);

  return json({
    conversation: supportStore.getConversation(id),
    messages,
    context,
  });
}
