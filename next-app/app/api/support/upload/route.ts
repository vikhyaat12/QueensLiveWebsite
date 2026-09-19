import { json, requireUser, safeText } from "@/lib/http";
import { saveSupportMedia } from "@/lib/support/support-media";
import { supportStore } from "@/lib/support/support-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ error: "Invalid Content-Type, expected multipart/form-data" }, 400);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const conversationId = safeText(formData.get("conversationId"), 100);
    const visitorId = safeText(formData.get("visitorId"), 100);

    if (!file || !(file instanceof File)) {
      return json({ error: "No file provided" }, 400);
    }

    // Check permissions if conversationId is provided
    if (conversationId) {
      const conv = supportStore.getConversation(conversationId);
      if (!conv) {
        return json({ error: "Conversation not found" }, 404);
      }

      const user = await requireUser();
      const isAdminOrStaff = user && (user.role === "admin" || user.role === "employee");

      if (!isAdminOrStaff) {
        if (user && conv.customerId && conv.customerId !== user.id) {
          return json({ error: "Unauthorized" }, 403);
        } else if (!user && visitorId && conv.visitorId !== visitorId) {
          return json({ error: "Unauthorized" }, 403);
        }
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await saveSupportMedia(buffer, file.name, file.type);
    if (!result.valid || !result.media) {
      return json({ error: result.error || "File upload validation failed" }, 400);
    }

    return json({
      success: true,
      attachment: {
        id: result.media.id,
        filename: result.media.originalFilename,
        mimeType: result.media.mimeType,
        size: result.media.size,
        url: result.media.url,
      },
    });
  } catch (err: any) {
    return json({ error: err.message || "Failed to upload file" }, 500);
  }
}
