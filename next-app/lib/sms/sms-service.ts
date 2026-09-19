import { fileDb } from "@/lib/commerce/file-db";
import { randomBytes } from "crypto";

export type SmsProviderType = "simulated" | "twilio" | "msg91" | "fast2sms" | "webhook" | "unconfigured";

export interface SmsSendOptions {
  to: string; // E.164 phone number e.g. +919876543210 or 10-digit Indian mobile
  message: string;
  templateId?: string; // DLT template ID (mandatory for Indian SMS gateways)
  senderId?: string; // 6-character DLT Header / Sender ID
  idempotencyKey?: string;
}

export interface SmsDispatchResult {
  success: boolean;
  messageId: string;
  provider: SmsProviderType;
  simulated: boolean;
  error?: string;
}

export interface SmsConfig {
  provider: SmsProviderType;
  enabled: boolean;
  senderId?: string;
  accountSid?: string; // Twilio
  authToken?: string; // Twilio
  apiKey?: string; // MSG91 / Fast2SMS
  webhookUrl?: string; // Generic Webhook
  dltEntityId?: string; // Indian Telecom Compliance
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`;
  return cleaned;
}

export const smsService = {
  getConfig: (): SmsConfig => {
    try {
      const s = fileDb.findOne("settings", (item: Record<string, unknown>) => item.key === "sms_integration_config");
      if (s?.value) {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return {
          provider: parsed.provider || (process.env.SMS_PROVIDER as SmsProviderType) || "simulated",
          enabled: Boolean(parsed.enabled ?? true),
          senderId: parsed.senderId || process.env.SMS_SENDER_ID || "QCARE",
          accountSid: parsed.accountSid || process.env.TWILIO_ACCOUNT_SID,
          authToken: parsed.authToken || process.env.TWILIO_AUTH_TOKEN,
          apiKey: parsed.apiKey || process.env.MSG91_AUTH_KEY || process.env.FAST2SMS_API_KEY,
          webhookUrl: parsed.webhookUrl || process.env.SMS_WEBHOOK_URL,
          dltEntityId: parsed.dltEntityId || process.env.SMS_DLT_ENTITY_ID,
        };
      }
    } catch {}

    return {
      provider: (process.env.SMS_PROVIDER as SmsProviderType) || "simulated",
      enabled: process.env.SMS_ENABLED !== "false",
      senderId: process.env.SMS_SENDER_ID || "QCARE",
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      apiKey: process.env.MSG91_AUTH_KEY || process.env.FAST2SMS_API_KEY,
      webhookUrl: process.env.SMS_WEBHOOK_URL,
      dltEntityId: process.env.SMS_DLT_ENTITY_ID,
    };
  },

  send: async (options: SmsSendOptions): Promise<SmsDispatchResult> => {
    const { to, message, templateId, senderId, idempotencyKey } = options;
    const config = smsService.getConfig();
    const formattedPhone = normalizePhone(to);
    const eventId = `SMS-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    // Duplicate prevention
    if (idempotencyKey) {
      try {
        const existing = fileDb.findOne(
          "auditLogs",
          (l: Record<string, unknown>) => l.action === "sms_dispatched" && String(l.details || "").includes(idempotencyKey)
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
        error: "SMS provider is unconfigured or disabled.",
      };
    }

    try {
      if (config.provider === "twilio" && config.accountSid && config.authToken) {
        const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
        const bodyParams = new URLSearchParams({
          To: formattedPhone,
          From: config.senderId || "QueensCare",
          Body: message,
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
          throw new Error(data.message || `Twilio SMS dispatch failed (HTTP ${res.status})`);
        }

        return {
          success: true,
          messageId: data.sid || eventId,
          provider: "twilio",
          simulated: false,
        };
      }

      if (config.provider === "msg91" && config.apiKey) {
        const res = await fetch("https://control.msg91.com/api/v5/flow/", {
          method: "POST",
          headers: {
            authkey: config.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            template_id: templateId,
            sender: config.senderId || "QCARE",
            mobiles: formattedPhone.replace(/^\+/, ""),
            message,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.type === "error") {
          throw new Error(data.message || `MSG91 SMS dispatch failed (HTTP ${res.status})`);
        }

        return {
          success: true,
          messageId: data.message_id || eventId,
          provider: "msg91",
          simulated: false,
        };
      }

      if (config.provider === "fast2sms" && config.apiKey) {
        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: config.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "q",
            message,
            numbers: formattedPhone.replace(/^\+91/, "").replace(/^\+/, ""),
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.return === false) {
          throw new Error(data.message?.[0] || `Fast2SMS dispatch failed (HTTP ${res.status})`);
        }

        return {
          success: true,
          messageId: String(data.request_id || eventId),
          provider: "fast2sms",
          simulated: false,
        };
      }

      if (config.provider === "webhook" && config.webhookUrl) {
        const res = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formattedPhone,
            message,
            templateId,
            senderId: config.senderId,
            eventId,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!res.ok) {
          throw new Error(`SMS Webhook returned status ${res.status}`);
        }

        return {
          success: true,
          messageId: eventId,
          provider: "webhook",
          simulated: false,
        };
      }

      // Default: Simulated / Development provider
      console.log(`[SMS SIMULATOR] Dispatch to ${formattedPhone} (${config.senderId}):\n"${message}"`);
      return {
        success: true,
        messageId: eventId,
        provider: "simulated",
        simulated: true,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[SMS ERROR] Failed to send SMS to ${formattedPhone}:`, errorMsg);
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
