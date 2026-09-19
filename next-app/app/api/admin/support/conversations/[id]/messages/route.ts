import { json, requireUser, safeText } from "@/lib/http";
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
  const body = await request.json().catch(() => ({}));
  const content = safeText(body.content, 4000);
  const isInternal = Boolean(body.isInternal);
  const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];
  const attachments = rawAttachments
    .filter((a: any) => a && typeof a.url === "string" && typeof a.filename === "string")
    .map((a: any) => ({
      id: safeText(a.id, 100),
      filename: safeText(a.filename, 255),
      mimeType: safeText(a.mimeType, 100),
      size: Number(a.size) || 0,
      url: safeText(a.url, 500),
    }));

  if (!content && attachments.length === 0) {
    return json({ error: "Message content or attachments required" }, 400);
  }

  const conv = supportStore.getConversation(id);
  if (!conv) {
    return json({ error: "Conversation not found" }, 404);
  }

  const agent = {
    id: user.id,
    name: user.name || "Support Specialist",
    role: user.role,
  };

  const result = supportStore.addAgentMessage(
    id,
    content,
    agent,
    isInternal,
    attachments.length > 0 ? attachments : undefined
  );
  return json(result);
}
