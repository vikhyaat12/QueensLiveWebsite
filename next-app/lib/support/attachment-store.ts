import "server-only";
import { randomUUID, createHash } from "crypto";
import { fileDb } from "@/lib/commerce/file-db";
import { storageProvider } from "@/lib/storage/storage-provider";
import { logAccessAuditEvent } from "@/lib/audit";

const now = () => new Date().toISOString();

export interface AttachmentRecord {
  id: string;
  storageKey: string;      // internal key — never exposed as a predictable public URL
  url?: string;            // populated only for authorized fetches
  filename: string;
  mimeType: string;
  size: number;
  conversationId?: string | null;
  messageId?: string | null;
  ticketId?: string | null;
  ownerId?: string | null; // customer userId (null for guests)
  visitorId?: string | null;
  createdAt: string;
}

export interface UploadAttachmentInput {
  file: File;
  conversationId?: string | null;
  messageId?: string | null;
  ticketId?: string | null;
  ownerId?: string | null;
  visitorId?: string | null;
  maxMb: number;
  allowedTypePrefixes: string[];
}

export const supportAttachmentStore = {
  async upload(input: UploadAttachmentInput): Promise<{ ok: true; record: AttachmentRecord } | { ok: false; error: string }> {
    const { file } = input;
    const mime = file.type || "";
    const ext = (file.name.split(".").pop() || "").toLowerCase().slice(0, 10);

    if (!mime || !input.allowedTypePrefixes.some((p) => mime.startsWith(p))) {
      return { ok: false, error: `Unsupported file type: ${mime || ext}. Allowed: images, video, PDF, documents.` };
    }
    if (file.size > input.maxMb * 1024 * 1024) {
      return { ok: false, error: `File too large (max ${input.maxMb}MB).` };
    }
    if (file.size === 0) {
      return { ok: false, error: "Empty file." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Sanitized, non-guessable storage name
    const safeBase = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 50) || "file";
    const filename = `${safeBase}-${Date.now().toString(36)}.${ext}`;
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);

    const uploadResult = await storageProvider.uploadFile({
      buffer,
      filename: `${hash}-${filename}`,
      folder: "support",
      mimeType: mime,
    });

    const record: AttachmentRecord = {
      id: `att-${randomUUID().slice(0, 8)}`,
      storageKey: uploadResult.key,
      filename: file.name.slice(0, 200),
      mimeType: mime,
      size: file.size,
      conversationId: input.conversationId || null,
      messageId: input.messageId || null,
      ticketId: input.ticketId || null,
      ownerId: input.ownerId || null,
      visitorId: input.visitorId || null,
      createdAt: now(),
    };
    fileDb.insert("supportAttachments", record as unknown as Record<string, unknown>);
    return { ok: true, record };
  },

  byId(id: string): AttachmentRecord | null {
    return (fileDb.findOne("supportAttachments", (a) => a.id === id) as unknown as AttachmentRecord) || null;
  },

  listByConversation(conversationId: string): AttachmentRecord[] {
    return (fileDb.findMany("supportAttachments", (a) => a.conversationId === conversationId) as unknown as AttachmentRecord[]) || [];
  },

  /** Authorization is the caller's job; this resolves the physical file path/URL. */
  resolveAuthorized(record: AttachmentRecord): { url: string; downloadName: string } {
    const url = storageProvider.getUrl(record.storageKey);
    return { url, downloadName: record.filename };
  },

  linkToTicket(ids: string[], ticketId: string): void {
    for (const id of ids) {
      const rec = this.byId(id);
      if (rec) {
        rec.ticketId = ticketId;
        fileDb.update("supportAttachments", { id }, { ticketId } as unknown as Record<string, unknown>);
      }
    }
  },

  logAccess(record: AttachmentRecord, actorName: string, actorId: string, authorized: boolean): void {
    logAccessAuditEvent({
      action: authorized ? "attachment_accessed" : "attachment_access_denied",
      actorId,
      actorName,
      actorEmail: "",
      targetId: record.id,
      targetName: record.filename.slice(0, 60),
      targetEmail: "",
      status: authorized ? "success" : "failure",
      details: authorized ? "Authorized attachment download" : "Blocked: no ownership",
    });
  },
};
