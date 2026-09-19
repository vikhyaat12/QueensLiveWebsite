import { fileDb } from "@/lib/commerce/file-db";
import { DEFAULT_EMAIL_TEMPLATES, EmailTemplateDefinition } from "./email-templates";
import { randomBytes } from "crypto";

export interface SendEmailOptions {
  templateId: string;
  recipientEmail: string;
  recipientName?: string;
  data: Record<string, unknown>;
  idempotencyKey?: string;
  overrideSubject?: string;
  overrideHtml?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  simulated: boolean;
  eventId: string;
  recipient: string;
  subject: string;
  error?: string;
}

export interface EmailLogEntry {
  id: string;
  templateId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: "sent" | "simulated" | "failed" | "skipped_duplicate";
  idempotencyKey?: string;
  provider: "resend" | "smtp" | "simulated";
  error?: string;
  createdAt: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTemplateString(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const val = data[key];
    if (val === undefined || val === null) return "";
    return escapeHtml(String(val));
  });
}

function renderTemplateRaw(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    const val = data[key];
    if (val === undefined || val === null) return "";
    return String(val);
  });
}

export const emailService = {
  getTemplate: (templateId: string): EmailTemplateDefinition | undefined => {
    const defaultTpl = DEFAULT_EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!defaultTpl) return undefined;

    // Check if custom override exists in settings
    try {
      const custom = fileDb.findOne("settings", (s: Record<string, unknown>) => s.key === `email_template_${templateId}`);
      if (custom?.value) {
        const parsed = typeof custom.value === "string" ? JSON.parse(custom.value) : custom.value;
        return {
          ...defaultTpl,
          subject: parsed.subject || defaultTpl.subject,
          defaultHtml: parsed.html || defaultTpl.defaultHtml,
          defaultText: parsed.text || defaultTpl.defaultText,
        };
      }
    } catch {}

    return defaultTpl;
  },

  getAllTemplates: (): EmailTemplateDefinition[] => {
    return DEFAULT_EMAIL_TEMPLATES.map((t) => emailService.getTemplate(t.id) || t);
  },

  send: async (options: SendEmailOptions): Promise<EmailDispatchResult> => {
    const { templateId, recipientEmail, recipientName = "", data, idempotencyKey } = options;
    const eventId = `EML-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    // 1. Idempotency Check: Prevent duplicate email dispatches
    if (idempotencyKey) {
      const existing = fileDb.findOne(
        "emailLogs",
        (l: Record<string, unknown>) => l.idempotencyKey === idempotencyKey && l.status !== "failed"
      );
      if (existing) {
        return {
          success: true,
          simulated: Boolean(existing.provider === "simulated"),
          eventId: String(existing.id || eventId),
          recipient: recipientEmail,
          subject: String(existing.subject || ""),
        };
      }
    }

    // 2. Resolve template
    const template = emailService.getTemplate(templateId);
    if (!template) {
      const errorMsg = `Template "${templateId}" not found.`;
      fileDb.insert("emailLogs", {
        id: eventId,
        templateId,
        recipientEmail,
        recipientName,
        subject: "Unknown",
        status: "failed",
        idempotencyKey,
        provider: "simulated",
        error: errorMsg,
        createdAt: new Date().toISOString(),
      });
      return { success: false, simulated: true, eventId, recipient: recipientEmail, subject: "Unknown", error: errorMsg };
    }

    // 3. Render content
    const subject = options.overrideSubject || renderTemplateRaw(template.subject, data);
    const html = options.overrideHtml || renderTemplateString(template.defaultHtml, data);
    const text = renderTemplateRaw(template.defaultText, data);

    const fromEmail = process.env.EMAIL_FROM || "Queens Care Laboratories <care@queenscare.in>";
    let provider: "resend" | "smtp" | "simulated" = "simulated";
    let dispatchError: string | undefined;

    // 4. Attempt Delivery via configured provider
    try {
      if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("your-")) {
        provider = "resend";
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipientEmail],
            subject,
            html,
            text,
          }),
        });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Resend API Error: ${errBody}`);
        }
      } else {
        // Safe simulated delivery in local/development or when unconfigured
        provider = "simulated";
      }
    } catch (e) {
      dispatchError = (e as Error).message;
    }

    const isSuccess = !dispatchError;
    const status = isSuccess ? (provider === "simulated" ? "simulated" : "sent") : "failed";

    // 5. Immutable Event Log
    fileDb.insert("emailLogs", {
      id: eventId,
      templateId,
      recipientEmail,
      recipientName,
      subject,
      status,
      idempotencyKey,
      provider,
      error: dispatchError,
      createdAt: new Date().toISOString(),
    });

    return {
      success: isSuccess,
      simulated: provider === "simulated",
      eventId,
      recipient: recipientEmail,
      subject,
      error: dispatchError,
    };
  },
};
