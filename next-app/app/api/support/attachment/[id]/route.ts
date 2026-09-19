import { requireUser } from "@/lib/http";
import { supportAttachmentStore } from "@/lib/support/attachment-store";
import { readFile } from "fs/promises";
import { join, normalize } from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * GET — stream a support attachment to an AUTHORIZED viewer only.
 * Access rules:
 *  - owner (customer) or same-visitor (guest) → allowed
 *  - admin / employee → allowed
 *  - anyone else → 403 (IDOR-safe: no predictable public URLs exist)
 * Local storage only: files under public/uploads/support are also blocked from
 * direct browsing by the non-guessable hashed filename, but the canonical
 * access path is this authorized endpoint.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireUser();

  const url = new URL(request.url);
  const visitorId = (url.searchParams.get("visitorId") || "").slice(0, 100);

  const record = supportAttachmentStore.byId(id);
  if (!record) return new Response("Not found", { status: 404 });

  let authorized = false;
  if (user) {
    if (user.role === "admin" || user.role === "employee") authorized = true;
    else if (record.ownerId === user.id) authorized = true;
    else if (record.conversationId) {
      // Customer who owns the conversation can fetch its attachments
      const { supportStore } = await import("@/lib/support/support-store");
      const conv = supportStore.getConversation(record.conversationId);
      if (conv && conv.customerId === user.id) authorized = true;
    }
  } else if (visitorId && record.visitorId === visitorId) {
    authorized = true;
  }

  supportAttachmentStore.logAccess(record, user?.name || visitorId || "anonymous", user?.id || visitorId || "anonymous", authorized);

  if (!authorized) return new Response("Forbidden", { status: 403 });

  const { url: fileUrl, downloadName } = supportAttachmentStore.resolveAuthorized(record);

  // Serve the local file directly (local storage provider)
  if (fileUrl.startsWith("/uploads/")) {
    const safePath = normalize(join(process.cwd(), "public", fileUrl));
    if (!safePath.startsWith(normalize(join(process.cwd(), "public"))) || !existsSync(safePath)) {
      return new Response("Not found", { status: 404 });
    }
    const data = await readFile(safePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": record.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${downloadName.replace(/[^\w.\- ]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Cloud storage: redirect (signed URLs would be preferred in production)
  return Response.redirect(fileUrl, 302);
}
