import { fileDb } from "@/lib/commerce/file-db";
import { randomBytes } from "crypto";

export type WhatsAppProviderType = "simulated" | "meta" | "gupshup" | "twilio" | "webhook" | "unconfigured";

export interface WhatsAppSendOptions {
  to: string; // E.164 phone number e.g. +919876543210
  templateName?: string;
  languageCode?: string; // default "en"
  components?: Array<Record<string, unknown>>; // Meta Cloud API components
  bodyText?: string; // Fallback plain text
  idempotencyKey?: string;
}

export interface WhatsAppDispatchResult {
  success: boolean;
  messageId: string;
  provider: WhatsAppProviderType;
  simulated: boolean;
  error?: string;
}

export interface WhatsAppConfig {
  provider: WhatsAppProviderType;
  enabled: boolean;
  phoneNumberId?: string; // Meta Cloud API
  accessToken?: string; // Meta Cloud API
  businessAccountId?: string; // Meta
  accountSid?: string; // Twilio
  authToken?: string; // Twilio
  fromNumber?: string; // Twilio / Gupshup sender
  apiKey?: string; // Gupshup
  appName?: string; // Gupshup App Name
  webhookUrl?: string; // Generic / WATI Webhook
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`;
  return cleaned;
}

export const whatsAppService = {
  getConfig: (): WhatsAppConfig => {
    try {
      const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "whatsapp_integration_config");
      if (s?.value) {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return {
          provider: parsed.provider || (process.env.WHATSAPP_PROVIDER as WhatsAppProviderType) || "simulated",
          enabled: Boolean(parsed.enabled ?? true),
          phoneNumberId: parsed.phoneNumberId || process.env.META_WA_PHONE_NUMBER_ID,
          accessToken: parsed.accessToken || process.env.META_WA_ACCESS_TOKEN,
          businessAccountId: parsed.businessAccountId || process.env.META_WA_BUSINESS_ID,
          accountSid: parsed.accountSid || process.env.TWILIO_ACCOUNT_SID,
          authToken: parsed.authToken || process.env.TWILIO_AUTH_TOKEN,
          fromNumber: parsed.fromNumber || process.env.TWILIO_WA_FROM || "whatsapp:+14155238886",
          apiKey: parsed.apiKey || process.env.GUPSHUP_API_KEY,
          appName: parsed.appName || process.env.GUPSHUP_APP_NAME,
          webhookUrl: parsed.webhookUrl || process.env.WHATSAPP_WEBHOOK_URL,
        };
      }
    } catch {}

    return {
      provider: (process.env.WHATSAPP_PROVIDER as WhatsAppProviderType) || "simulated",
      enabled: process.env.WHATSAPP_ENABLED !== "false",
      phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID,
      accessToken: process.env.META_WA_ACCESS_TOKEN,
      businessAccountId: process.env.META_WA_BUSINESS_ID,
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_WA_FROM || "whatsapp:+14155238886",
      apiKey: process.env.GUPSHUP_API_KEY,
      appName: process.env.GUPSHUP_APP_NAME,
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL,
    };
  },

  send: async (options: WhatsAppSendOptions): Promise<WhatsAppDispatchResult> => {
    const { to, templateName, languageCode = "en", components, bodyText, idempotencyKey } = options;
    const config = whatsAppService.getConfig();
    const formattedPhone = normalizePhone(to);
    const eventId = `WA-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    // Duplicate prevention
    if (idempotencyKey) {
      try {
        const existing = fileDb.findOne(
          "auditLogs",
          (l: Record<string, unknown>) => l.action === "whatsapp_dispatched" && String(l.details || "").includes(idempotencyKey)
        );
        if (existing) {
          return {
            success: true,
            messageId: String(existing.id || eventId),
            provider: config.provider,
            simulated: true,
          };
        }
      } catch {}
    }

    if (!config.enabled || config.provider === "unconfigured") {
      return {
        success: false,
        messageId: eventId,
        provider: "unconfigured",
        simulated: true,
        error: "WhatsApp provider is unconfigured or disabled.",
      };
    }

    try {
      // 1. Meta Cloud API (Official WhatsApp Business)
      if (config.provider === "meta" && config.phoneNumberId && config.accessToken) {
        const payload: Record<string, unknown> = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone.replace(/^\+/, ""),
        };

        if (templateName) {
          payload.type = "template";
          payload.template = {
            name: templateName,
            language: { code: languageCode },
            components: components || [],
          };
        } else {
          payload.type = "text";
          payload.text = { preview_url: false, body: bodyText || "Queens Care notification" };
        }

        const res = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
          throw new Error(data.error?.message || `Meta WhatsApp API error (HTTP ${res.status})`);
        }

        return {
          success: true,
          messageId: data.messages?.[0]?.id || eventId,
          provider: "meta",
          simulated: false,
        };
      }

      // 2. Twilio WhatsApp
      if (config.provider === "twilio" && config.accountSid && config.authToken) {
        const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
        const bodyParams = new URLSearchParams({
          To: `whatsapp:${formattedPhone}`,
          From: config.fromNumber?.startsWith("whatsapp:") ? config.fromNumber : `whatsapp:${config.fromNumber}`,
          Body: bodyText || `Queens Care update: ${templateName || "Order Notification"}`,
        });

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyParams.toString(),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Twilio WhatsApp dispatch failed (HTTP ${res.status})`);
        }

        return {
          success: true,
          messageId: data.sid || eventId,
          provider: "twilio",
          simulated: false,
        };
      }

      // 3. Gupshup WhatsApp Enterprise
      if (config.provider === "gupshup" && config.apiKey && config.appName) {
        const res = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
          method: "POST",
          headers: {
            apikey: config.apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            channel: "whatsapp",
            source: config.appName,
            destination: formattedPhone.replace(/^\+/, ""),
            message: JSON.stringify({ type: "text", text: bodyText || `Queens Care notification: ${templateName}` }),
          }).toString(),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status === "error") {
          throw new Error(data.message || `Gupshup dispatch failed (HTTP ${res.status})`);
        }

        return {
          success: true,
          messageId: data.messageId || eventId,
          provider: "gupshup",
          simulated: false,
        };
      }

      // 4. Generic Webhook / WATI
      if (config.provider === "webhook" && config.webhookUrl) {
        const res = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formattedPhone,
            templateName,
            components,
            bodyText,
            eventId,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!res.ok) {
          throw new Error(`WhatsApp Webhook returned status ${res.status}`);
        }

        return {
          success: true,
          messageId: eventId,
          provider: "webhook",
          simulated: false,
        };
      }

      // Default: Simulated / Development provider
      console.log(`[WHATSAPP SIMULATOR] Dispatch to ${formattedPhone} (${templateName || "text"}):\n"${bodyText || "Template message"}"`);
      return {
        success: true,
        messageId: eventId,
        provider: "simulated",
        simulated: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[WHATSAPP ERROR] Failed to send WhatsApp to ${formattedPhone}:`, errorMsg);
      return {
        success: false,
        messageId: eventId,
        provider: config.provider,
        simulated: false,
        error: errorMsg,
      };
    }
  },
};
