import { emailService } from "@/lib/email/email-service";
import { smsService } from "@/lib/sms/sms-service";
import { whatsAppService } from "@/lib/whatsapp/whatsapp-service";
import { notificationRulesStore, OrderNotificationEvent } from "@/lib/commerce/store-extensions";
import { fileDb } from "@/lib/commerce/file-db";

export type OmnichannelNotificationEvent =
  | OrderNotificationEvent
  | "prescription_received"
  | "prescription_approved"
  | "prescription_rejected"
  | "auth_welcome"
  | "auth_password_reset";

export interface RecipientProfile {
  name: string;
  email?: string;
  phone?: string;
  userId?: string;
}

export interface NotificationPayload {
  event: OmnichannelNotificationEvent;
  recipient: RecipientProfile;
  data: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface NotificationDispatchSummary {
  event: OmnichannelNotificationEvent;
  idempotencyKey?: string;
  email?: { sent: boolean; simulated?: boolean; messageId?: string; error?: string };
  sms?: { sent: boolean; simulated?: boolean; messageId?: string; error?: string };
  whatsapp?: { sent: boolean; simulated?: boolean; messageId?: string; error?: string };
  push?: { sent: boolean; count?: number; error?: string };
  timestamp: string;
}

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined && val !== null ? String(val) : "";
  });
}

export async function dispatchNotification(payload: NotificationPayload): Promise<NotificationDispatchSummary> {
  const { event, recipient, data, idempotencyKey } = payload;
  const summary: NotificationDispatchSummary = {
    event,
    idempotencyKey,
    timestamp: new Date().toISOString(),
  };

  // 1. Fetch channel rules for this event
  const allRules = await notificationRulesStore.get().catch(() => ({}));
  const rule = (allRules as Record<string, { email: boolean; sms: boolean; whatsapp: boolean; template?: string }>)[event] || {
    email: true,
    sms: false,
    whatsapp: false,
    template: "",
  };

  const plainMessage = rule.template ? interpolate(rule.template, data) : interpolate("Queens Care update for order #{{order_id}}", data);

  // 2. Email Channel
  if (rule.email && recipient.email) {
    try {
      const emailResult = await emailService.send({
        templateId: event,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        data,
        idempotencyKey: idempotencyKey ? `eml_${idempotencyKey}` : undefined,
      });

      summary.email = {
        sent: emailResult.success,
        simulated: emailResult.simulated,
        messageId: emailResult.eventId,
        error: emailResult.error,
      };
    } catch (e) {
      summary.email = { sent: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 3. SMS Channel
  if (rule.sms && recipient.phone) {
    try {
      const smsResult = await smsService.send({
        to: recipient.phone,
        message: plainMessage,
        idempotencyKey: idempotencyKey ? `sms_${idempotencyKey}` : undefined,
      });

      summary.sms = {
        sent: smsResult.success,
        simulated: smsResult.simulated,
        messageId: smsResult.messageId,
        error: smsResult.error,
      };
    } catch (e) {
      summary.sms = { sent: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 4. WhatsApp Channel
  if (rule.whatsapp && recipient.phone) {
    try {
      const waResult = await whatsAppService.send({
        to: recipient.phone,
        templateName: `queenscare_${event}`,
        bodyText: plainMessage,
        idempotencyKey: idempotencyKey ? `wa_${idempotencyKey}` : undefined,
      });

      summary.whatsapp = {
        sent: waResult.success,
        simulated: waResult.simulated,
        messageId: waResult.messageId,
        error: waResult.error,
      };
    } catch (e) {
      summary.whatsapp = { sent: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 5. Audit Log Entry
  try {
    fileDb.insert("auditLogs", {
      id: `NOTIF-${Date.now()}`,
      action: `notification_${event}`,
      actorId: "system",
      actorName: "Notification Orchestrator",
      actorEmail: "system@queenscare.in",
      targetId: recipient.email || recipient.phone || "unknown",
      targetName: recipient.name,
      targetEmail: recipient.email || "",
      status: "success",
      details: JSON.stringify({
        channels: {
          email: summary.email?.sent,
          sms: summary.sms?.sent,
          whatsapp: summary.whatsapp?.sent,
        },
        idempotencyKey,
      }),
      createdAt: summary.timestamp,
    });
  } catch {}

  return summary;
}
