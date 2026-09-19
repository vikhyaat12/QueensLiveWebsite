import { EventEmitter } from "events";
import type { SupportMessage, SupportConversation } from "./support-types";

declare global {
  // eslint-disable-next-line no-var
  var __queenscare_support_bus__: EventEmitter | undefined;
}

if (!globalThis.__queenscare_support_bus__) {
  globalThis.__queenscare_support_bus__ = new EventEmitter();
  globalThis.__queenscare_support_bus__.setMaxListeners(100);
}

export const supportEventBus = globalThis.__queenscare_support_bus__;

export type SupportEvent =
  | { type: "message:created"; conversationId: string; message: SupportMessage }
  | { type: "conversation:updated"; conversationId?: string; conversation: SupportConversation }
  | { type: "handoff:requested"; conversationId: string; conversation: SupportConversation }
  | { type: "takeover:changed"; conversationId: string; handlingMode: string; conversation: SupportConversation }
  | { type: "status:changed"; conversationId: string; status: string; conversation: SupportConversation };

export function broadcastSupportEvent(event: SupportEvent) {
  try {
    supportEventBus.emit("support-event", event);
    const convId =
      ("conversationId" in event && event.conversationId)
        ? event.conversationId
        : ("conversation" in event && event.conversation ? event.conversation.id : undefined);
    if (convId) {
      supportEventBus.emit(`conversation:${convId}`, event);
    }
  } catch (err) {
    console.error("[SupportEventBus] Failed to broadcast event:", err);
  }
}
