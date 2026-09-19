import "server-only";
import { randomUUID } from "crypto";
import { fileDb } from "@/lib/commerce/file-db";
import { store } from "@/lib/commerce/store";
import { broadcastSupportEvent } from "./event-bus";
import type {
  SupportConversation,
  SupportMessage,
  SupportSettings,
  SupportAuditLog,
  SupportFilterParams,
  ConversationStatus,
  HandlingMode,
  MessageSenderType,
  SupportProductAttachment,
  SupportFileAttachment,
} from "./support-types";

const now = () => new Date().toISOString();

export const DEFAULT_SUPPORT_SETTINGS: SupportSettings = {
  chatEnabled: true,
  aiEnabled: true,
  humanSupportEnabled: true,
  humanHandoffEnabled: true,
  isOnline: true,
  supportHours: {
    enabled: false,
    start: "09:00",
    end: "20:00",
    timezone: "Asia/Kolkata",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  welcomeMessage: "Hello! 👋 Welcome to Queens Care Laboratories. I'm your clinical care assistant. How can I help you today?",
  offlineMessage: "Our clinical support team is currently away. Please leave a message, and our pharmacists will respond promptly during operational hours.",
  humanHandoffMessage: "Connecting you with our support team. An agent will join shortly.",
  resolutionMessage: "This support conversation has been resolved. If you need any further clinical assistance, feel free to message us anytime.",
  awayMessage: "All specialists are currently assisting other patients. We will respond shortly.",
  csatEnabled: true,
  reopenOnCustomerMessage: true,
};

// ─── PHARMACEUTICAL CLINICAL AI GENERATOR (SAFE & DETERMINISTIC) ───
function findRelevantProducts(query: string, products: Record<string, unknown>[]) {
  const lower = query.toLowerCase();
  const keywords = lower.split(/\s+/).filter((w) => w.length > 2);

  return products
    .map((p) => {
      const text = `${p.name} ${p.category} ${p.description || ""} ${p.benefits || ""}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score += 1;
      }
      if (String(p.name || "").toLowerCase().includes(lower)) score += 5;
      return { product: p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => r.product);
}

function generateSafeAiResponse(
  query: string,
  products: Record<string, unknown>[],
  settings: Record<string, unknown>[]
): { text: string; products?: SupportProductAttachment[] } {
  const lower = query.toLowerCase();

  // Safety filter for clinical advice / medical prescription
  const forbidden = ["diagnos", "prescri", "cure cancer", "cure disease", "fda approval", "dosage for children without doctor"];
  if (forbidden.some((f) => lower.includes(f))) {
    return {
      text: "I am a pharmaceutical care assistant. In adherence to Indian medical standards and clinical safety protocols, I cannot provide diagnoses, write prescriptions, or alter medical dosages. Please consult a registered medical practitioner.\n\nI am happy to provide official formulation details, excipient lists, or connect you with our human support desk.",
      products: [],
    };
  }

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|namaste)/i.test(lower)) {
    return {
      text: "Hello! 👋 Welcome to Queens Care Laboratories. How can I assist you today? You can ask about our clinical formulations, order tracking, shipping, or request human support.",
    };
  }

  // Product match
  const matched = findRelevantProducts(query, products);
  if (matched.length > 0) {
    const lines = matched.map((p) => {
      let line = `• **${p.name}** (₹${Number(p.price).toLocaleString("en-IN")})`;
      if (p.category) line += ` — ${p.category}`;
      return line;
    });

    const attachments: SupportProductAttachment[] = matched.slice(0, 3).map((p) => ({
      name: String(p.name || ""),
      slug: String(p.slug || ""),
      image: String(p.image || p.thumbnail || "/placeholder.png"),
      price: Number(p.price || 0),
      category: String(p.category || ""),
    }));

    return {
      text: `Here are the matching formulations from Queens Care Laboratories:\n\n${lines.join(
        "\n"
      )}\n\nWould you like more details on active ingredients or batch specifications?`,
      products: attachments,
    };
  }

  // Shipping & Delivery
  if (/ship|deliver|delivery|track|dispatch|pin.*code/i.test(lower)) {
    return {
      text: "We provide temperature-monitored courier delivery across 26,000+ Indian PIN codes. Orders over ₹1,500 qualify for FREE Express Delivery. Standard delivery timeline is 2–4 business days in metro regions, 4–6 days in other regions. You can track your shipment anytime with your Order ID.",
    };
  }

  // Return / Refund
  if (/return|refund|cancel|damage/i.test(lower)) {
    return {
      text: "Queens Care Laboratories provides a 7-day return guarantee for sealed, unopened formulations. If you received a damaged package or temperature-compromised shipment, please provide your Order ID and an image to our support team for immediate resolution.",
    };
  }

  // Contact / Human
  if (/human|agent|person|representative|help|support team/i.test(lower)) {
    return {
      text: "I can connect you directly with a Queens Care support specialist. Would you like me to notify our human support team now?",
    };
  }

  // Default fallback
  return {
    text: "I'm here to help with Queens Care formulations, order status, cold-chain shipping, and account details. If your inquiry requires specialist assistance, you can click 'Talk to a human' to alert our support desk.",
  };
}

export const supportStore = {
  // ─── SETTINGS ───
  getSettings(): SupportSettings {
    const data = fileDb.get();
    const stored = data.supportSettings as Partial<SupportSettings> | undefined;
    return {
      ...DEFAULT_SUPPORT_SETTINGS,
      ...(stored || {}),
      supportHours: {
        ...DEFAULT_SUPPORT_SETTINGS.supportHours,
        ...(stored?.supportHours || {}),
      },
    };
  },

  updateSettings(patch: Partial<SupportSettings>, agent: { id: string; name: string; role: string }): SupportSettings {
    const current = this.getSettings();
    const updated: SupportSettings = {
      ...current,
      ...patch,
      supportHours: {
        ...current.supportHours,
        ...(patch.supportHours || {}),
      },
    };
    fileDb.save({ supportSettings: updated as unknown as Record<string, unknown> });

    // Record audit log
    fileDb.insert("supportAuditLogs", {
      id: `audit-${randomUUID()}`,
      conversationId: "system",
      actor: agent,
      action: "config_changed",
      oldValue: JSON.stringify(current),
      newValue: JSON.stringify(updated),
      createdAt: now(),
    });

    return updated;
  },

  // ─── CONVERSATIONS ───
  getConversation(id: string): SupportConversation | null {
    const conv = fileDb.findOne("supportConversations", (c) => c.id === id);
    return (conv as unknown as SupportConversation) || null;
  },

  getOrCreateConversation(
    visitorId: string,
    customerUser?: { id: string; name: string; email?: string; phone?: string } | null,
    metadata?: Record<string, unknown>
  ): SupportConversation {
    const convs = fileDb.collection("supportConversations") as Array<Record<string, unknown>>;
    
    // Find active non-closed conversation for this visitor or customer
    let existing = convs.find((c) => {
      if (c.status === "closed") return false;
      if (customerUser?.id && c.customerId === customerUser.id) return true;
      return c.visitorId === visitorId;
    });

    if (existing) {
      // Sync customer user if recently authenticated
      if (customerUser?.id && !existing.customerId) {
        existing.customerId = customerUser.id;
        existing.customerName = customerUser.name || existing.customerName;
        existing.customerEmail = customerUser.email || existing.customerEmail;
        existing.customerPhone = customerUser.phone || existing.customerPhone;
        existing.updatedAt = now();
        fileDb.flush();
      }
      return existing as unknown as SupportConversation;
    }

    // Create new conversation
    const settings = this.getSettings();
    const newId = `conv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newConv: SupportConversation = {
      id: newId,
      visitorId,
      customerId: customerUser?.id || null,
      customerName: customerUser?.name || `Guest Visitor #${visitorId.slice(-4).toUpperCase()}`,
      customerEmail: customerUser?.email || null,
      customerPhone: customerUser?.phone || null,
      channel: "website_chat",
      status: "new",
      handlingMode: settings.aiEnabled ? "ai" : "human",
      humanRequested: false,
      assignedTo: null,
      priority: "normal",
      relevantOrderId: null,
      unreadAdminCount: 0,
      unreadCustomerCount: 0,
      lastMessage: {
        text: settings.welcomeMessage,
        sender: "ai",
        timestamp: now(),
      },
      createdAt: now(),
      updatedAt: now(),
      tags: [],
      metadata: {
        userAgent: typeof metadata?.userAgent === "string" ? metadata.userAgent : undefined,
        currentUrl: typeof metadata?.currentUrl === "string" ? metadata.currentUrl : undefined,
      },
    };

    fileDb.insert("supportConversations", newConv as unknown as Record<string, unknown>);

    // Insert initial greeting message
    fileDb.insert("supportMessages", {
      id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: newId,
      sender: "ai",
      senderName: "Dr. Queens AI",
      content: settings.welcomeMessage,
      isInternal: false,
      deliveryStatus: "delivered",
      createdAt: now(),
    });

    return newConv;
  },

  listConversations(params: SupportFilterParams = {}): {
    conversations: SupportConversation[];
    total: number;
    unreadTotal: number;
    humanRequestedTotal: number;
    openTotal: number;
  } {
    const list = (fileDb.collection("supportConversations") as unknown as SupportConversation[]) || [];
    
    // Global metrics
    const unreadTotal = list.reduce((acc, c) => acc + (c.unreadAdminCount > 0 ? 1 : 0), 0);
    const humanRequestedTotal = list.filter((c) => c.humanRequested && c.status !== "closed" && c.status !== "resolved").length;
    const openTotal = list.filter((c) => c.status === "open" || c.status === "new" || c.status === "waiting_support").length;

    let filtered = [...list];

    // Status Filter
    if (params.status && params.status !== "all") {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    // Handling Mode Filter
    if (params.handlingMode && params.handlingMode !== "all") {
      filtered = filtered.filter((c) => c.handlingMode === params.handlingMode);
    }

    // Assigned Agent Filter
    if (params.assignedTo) {
      if (params.assignedTo === "unassigned") {
        filtered = filtered.filter((c) => !c.assignedTo);
      } else {
        filtered = filtered.filter((c) => c.assignedTo?.id === params.assignedTo);
      }
    }

    // Human Requested Filter
    if (params.humanRequested) {
      filtered = filtered.filter((c) => c.humanRequested);
    }

    // Unread Only Filter
    if (params.unreadOnly) {
      filtered = filtered.filter((c) => c.unreadAdminCount > 0);
    }

    // Server-Side Search
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter((c) => {
        return (
          c.customerName?.toLowerCase().includes(q) ||
          c.customerEmail?.toLowerCase().includes(q) ||
          c.customerPhone?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.relevantOrderId?.toLowerCase().includes(q) ||
          c.lastMessage?.text?.toLowerCase().includes(q) ||
          c.assignedTo?.name?.toLowerCase().includes(q)
        );
      });
    }

    // Sort: unread & humanRequested first, then newest updatedAt
    filtered.sort((a, b) => {
      if (a.humanRequested && !b.humanRequested && a.status !== "resolved") return -1;
      if (!a.humanRequested && b.humanRequested && b.status !== "resolved") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 30));
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      conversations: paginated,
      total: filtered.length,
      unreadTotal,
      humanRequestedTotal,
      openTotal,
    };
  },

  // ─── MESSAGES ───
  getMessages(
    conversationId: string,
    options?: { includeInternal?: boolean; since?: string; limit?: number }
  ): SupportMessage[] {
    const all = (fileDb.collection("supportMessages") as unknown as SupportMessage[]) || [];
    let msgs = all.filter((m) => m.conversationId === conversationId);

    if (!options?.includeInternal) {
      msgs = msgs.filter((m) => !m.isInternal);
    }

    if (options?.since) {
      const sinceDate = new Date(options.since).getTime();
      msgs = msgs.filter((m) => new Date(m.createdAt).getTime() > sinceDate);
    }

    msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (options?.limit && options.limit > 0) {
      msgs = msgs.slice(-options.limit);
    }

    return msgs;
  },

  async addCustomerMessage(
    conversationId: string,
    content: string,
    metadata?: Record<string, unknown>,
    attachments?: SupportFileAttachment[]
  ): Promise<{
    customerMsg: SupportMessage;
    assistantMsg?: SupportMessage;
    conversation: SupportConversation;
  }> {
    const conv = this.getConversation(conversationId);
    if (!conv) throw new Error("Conversation not found");

    const settings = this.getSettings();

    // Check if conversation was resolved and auto-reopens
    let status = conv.status;
    let reopenedAt = conv.reopenedAt;
    if ((conv.status === "resolved" || conv.status === "closed") && settings.reopenOnCustomerMessage) {
      status = "open";
      reopenedAt = now();
    } else if (conv.status === "new" || conv.status === "waiting_customer") {
      status = "open";
    }

    // Check if customer asked for human handoff via text
    const lowerContent = (content || "").toLowerCase();
    const wantsHuman = /talk to.*human|speak to.*agent|human support|need human|real person/i.test(lowerContent);
    const humanRequested = conv.humanRequested || wantsHuman;

    // Detect potential Order ID in message (e.g. QC-12345 or ORD-12345)
    const orderMatch = (content || "").match(/\b(QC-[A-Z0-9]+|ORD-[A-Z0-9-]+)\b/i);
    const relevantOrderId = orderMatch ? orderMatch[1].toUpperCase() : conv.relevantOrderId;

    // Determine message text (fallback if only attachments sent)
    const trimmedText = (content || "").trim();
    let displayText = trimmedText;
    if (!displayText && attachments && attachments.length > 0) {
      displayText = attachments.length === 1
        ? `[Attachment: ${attachments[0].filename}]`
        : `[${attachments.length} Attachments]`;
    }

    // Save customer message
    const custId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const customerMsg: SupportMessage = {
      id: custId,
      conversationId,
      sender: "customer",
      senderName: conv.customerName,
      content: displayText,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      isInternal: false,
      deliveryStatus: "delivered",
      createdAt: now(),
    };
    fileDb.insert("supportMessages", customerMsg as unknown as Record<string, unknown>);

    // Update conversation record
    const updatedConv: SupportConversation = {
      ...conv,
      status: humanRequested ? "waiting_support" : status,
      humanRequested,
      relevantOrderId,
      unreadAdminCount: conv.unreadAdminCount + 1,
      lastMessage: {
        text: customerMsg.content,
        sender: "customer",
        timestamp: customerMsg.createdAt,
      },
      updatedAt: now(),
      reopenedAt,
      metadata: {
        ...conv.metadata,
        ...(metadata || {}),
      },
    };
    fileDb.update("supportConversations", { id: conversationId }, updatedConv as unknown as Record<string, unknown>);

    // Broadcast customer message
    broadcastSupportEvent({
      type: "message:created",
      conversationId,
      message: customerMsg,
    });
    broadcastSupportEvent({
      type: "conversation:updated",
      conversation: updatedConv,
    });

    let assistantMsg: SupportMessage | undefined;

    // If handling mode is AI and human has NOT taken over:
    if (updatedConv.handlingMode === "ai" && !updatedConv.humanRequested && settings.aiEnabled) {
      const products = await store.products.all();
      const siteSettings = fileDb.findMany("settings");
      const aiReply = generateSafeAiResponse(content, products, siteSettings);

      const aiMsgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      assistantMsg = {
        id: aiMsgId,
        conversationId,
        sender: "ai",
        senderName: "Dr. Queens AI",
        content: aiReply.text,
        products: aiReply.products,
        isInternal: false,
        deliveryStatus: "delivered",
        createdAt: now(),
      };
      fileDb.insert("supportMessages", assistantMsg as unknown as Record<string, unknown>);

      // Update conversation with AI response
      updatedConv.lastMessage = {
        text: assistantMsg.content,
        sender: "ai",
        timestamp: assistantMsg.createdAt,
      };
      updatedConv.updatedAt = now();
      fileDb.update("supportConversations", { id: conversationId }, updatedConv as unknown as Record<string, unknown>);

      // Broadcast AI message
      broadcastSupportEvent({
        type: "message:created",
        conversationId,
        message: assistantMsg,
      });
      broadcastSupportEvent({
        type: "conversation:updated",
        conversation: updatedConv,
      });
    } else if (wantsHuman && !conv.humanRequested) {
      // If customer requested human, post the handoff system reassurance
      const handoffMsgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      assistantMsg = {
        id: handoffMsgId,
        conversationId,
        sender: "system",
        senderName: "Queens Care System",
        content: settings.humanHandoffMessage,
        isInternal: false,
        deliveryStatus: "delivered",
        createdAt: now(),
      };
      fileDb.insert("supportMessages", assistantMsg as unknown as Record<string, unknown>);
      broadcastSupportEvent({
        type: "message:created",
        conversationId,
        message: assistantMsg,
      });
    }

    return { customerMsg, assistantMsg, conversation: updatedConv };
  },

  addAgentMessage(
    conversationId: string,
    content: string,
    agent: { id: string; name: string; role: string },
    isInternal = false,
    attachments?: SupportFileAttachment[]
  ): { message: SupportMessage; conversation: SupportConversation } {
    const conv = this.getConversation(conversationId);
    if (!conv) throw new Error("Conversation not found");

    const trimmedText = (content || "").trim();
    let displayText = trimmedText;
    if (!displayText && attachments && attachments.length > 0) {
      displayText = attachments.length === 1
        ? `[Attachment: ${attachments[0].filename}]`
        : `[${attachments.length} Attachments]`;
    }

    const msgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const msg: SupportMessage = {
      id: msgId,
      conversationId,
      sender: isInternal ? "system" : "agent",
      senderId: agent.id,
      senderName: isInternal ? `Internal Note by ${agent.name}` : agent.name,
      content: displayText,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      isInternal,
      deliveryStatus: "delivered",
      createdAt: now(),
    };
    fileDb.insert("supportMessages", msg as unknown as Record<string, unknown>);

    const patch: Partial<SupportConversation> = {
      updatedAt: now(),
    };

    if (!isInternal) {
      patch.handlingMode = "human"; // Ensure human handling
      patch.status = "waiting_customer"; // Agent replied, waiting for customer
      patch.unreadCustomerCount = (conv.unreadCustomerCount || 0) + 1;
      patch.lastMessage = {
        text: msg.content,
        sender: "agent",
        timestamp: msg.createdAt,
      };
    }

    fileDb.update("supportConversations", { id: conversationId }, patch);
    const updatedConv = this.getConversation(conversationId)!;

    // Record audit if internal note
    if (isInternal) {
      fileDb.insert("supportAuditLogs", {
        id: `audit-${randomUUID()}`,
        conversationId,
        actor: agent,
        action: "note_created",
        newValue: content.slice(0, 100),
        createdAt: now(),
      });
    }

    broadcastSupportEvent({
      type: "message:created",
      conversationId,
      message: msg,
    });
    broadcastSupportEvent({
      type: "conversation:updated",
      conversation: updatedConv,
    });

    return { message: msg, conversation: updatedConv };
  },

  // ─── ACTIONS: TAKEOVER, RETURN TO AI, ASSIGN, STATUS ───
  takeoverConversation(
    conversationId: string,
    agent: { id: string; name: string; role: string }
  ): { systemMsg: SupportMessage; conversation: SupportConversation } {
    const conv = this.getConversation(conversationId);
    if (!conv) throw new Error("Conversation not found");

    const systemMsgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const systemMsg: SupportMessage = {
      id: systemMsgId,
      conversationId,
      sender: "system",
      senderName: "Queens Care System",
      content: `You're now connected with ${agent.name} from Queens Care Support.`,
      isInternal: false,
      deliveryStatus: "delivered",
      createdAt: now(),
    };
    fileDb.insert("supportMessages", systemMsg as unknown as Record<string, unknown>);

    const patch: Partial<SupportConversation> = {
      handlingMode: "human",
      humanRequested: false,
      status: "open",
      assignedTo: conv.assignedTo || agent,
      updatedAt: now(),
      lastMessage: {
        text: systemMsg.content,
        sender: "system",
        timestamp: systemMsg.createdAt,
      },
    };
    fileDb.update("supportConversations", { id: conversationId }, patch);
    const updatedConv = this.getConversation(conversationId)!;

    fileDb.insert("supportAuditLogs", {
      id: `audit-${randomUUID()}`,
      conversationId,
      actor: agent,
      action: "takeover_human",
      oldValue: conv.handlingMode,
      newValue: "human",
      createdAt: now(),
    });

    broadcastSupportEvent({
      type: "message:created",
      conversationId,
      message: systemMsg,
    });
    broadcastSupportEvent({
      type: "takeover:changed",
      conversationId,
      handlingMode: "human",
      conversation: updatedConv,
    });

    return { systemMsg, conversation: updatedConv };
  },

  returnToAi(
    conversationId: string,
    agent: { id: string; name: string; role: string }
  ): { systemMsg: SupportMessage; conversation: SupportConversation } {
    const conv = this.getConversation(conversationId);
    if (!conv) throw new Error("Conversation not found");

    const systemMsgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const systemMsg: SupportMessage = {
      id: systemMsgId,
      conversationId,
      sender: "system",
      senderName: "Queens Care System",
      content: "Conversation has been returned to Dr. Queens AI Assistant.",
      isInternal: false,
      deliveryStatus: "delivered",
      createdAt: now(),
    };
    fileDb.insert("supportMessages", systemMsg as unknown as Record<string, unknown>);

    const patch: Partial<SupportConversation> = {
      handlingMode: "ai",
      humanRequested: false,
      updatedAt: now(),
      lastMessage: {
        text: systemMsg.content,
        sender: "system",
        timestamp: systemMsg.createdAt,
      },
    };
    fileDb.update("supportConversations", { id: conversationId }, patch);
    const updatedConv = this.getConversation(conversationId)!;

    fileDb.insert("supportAuditLogs", {
      id: `audit-${randomUUID()}`,
      conversationId,
      actor: agent,
      action: "returned_ai",
      oldValue: conv.handlingMode,
      newValue: "ai",
      createdAt: now(),
    });

    broadcastSupportEvent({
      type: "message:created",
      conversationId,
      message: systemMsg,
    });
    broadcastSupportEvent({
      type: "takeover:changed",
      conversationId,
      handlingMode: "ai",
      conversation: updatedConv,
    });

    return { systemMsg, conversation: updatedConv };
  },

  requestHandoff(conversationId: string): { systemMsg: SupportMessage; conversation: SupportConversation } {
    const conv = this.getConversation(conversationId);
    if (!conv) throw new Error("Conversation not found");

    const settings = this.getSettings();
    const systemMsgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const systemMsg: SupportMessage = {
      id: systemMsgId,
      conversationId,
      sender: "system",
      senderName: "Queens Care System",
      content: settings.humanHandoffMessage,
      isInternal: false,
      deliveryStatus: "delivered",
      createdAt: now(),
    };
    fileDb.insert("supportMessages", systemMsg as unknown as Record<string, unknown>);

    const patch: Partial<SupportConversation> = {
      humanRequested: true,
      status: "waiting_support",
      unreadAdminCount: conv.unreadAdminCount + 1,
      updatedAt: now(),
      lastMessage: {
        text: systemMsg.content,
        sender: "system",
        timestamp: systemMsg.createdAt,
      },
    };
    fileDb.update("supportConversations", { id: conversationId }, patch);
    const updatedConv = this.getConversation(conversationId)!;

    broadcastSupportEvent({
      type: "message:created",
      conversationId,
      message: systemMsg,
    });
    broadcastSupportEvent({
      type: "handoff:requested",
      conversationId,
      conversation: updatedConv,
    });

    return { systemMsg, conversation: updatedConv };
  },

  assignConversation(
    conversationId: string,
    targetAgent: { id: string; name: string; email: string; role: string } | null,
    actingAgent: { id: string; name: string; role: string }
  ): { conversation: SupportConversation } {
    const conv = this.getConversation(conversationId);
    if (!conv) throw new Error("Conversation not found");

    fileDb.update("supportConversations", { id: conversationId }, {
      assignedTo: targetAgent,
      updatedAt: now(),
    });
    const updatedConv = this.getConversation(conversationId)!;

    fileDb.insert("supportAuditLogs", {
      id: `audit-${randomUUID()}`,
      conversationId,
      actor: actingAgent,
      action: targetAgent ? (conv.assignedTo ? "reassigned" : "assigned") : "reassigned",
      oldValue: conv.assignedTo?.name || "Unassigned",
      newValue: targetAgent?.name || "Unassigned",
      createdAt: now(),
    });

    broadcastSupportEvent({
      type: "conversation:updated",
      conversation: updatedConv,
    });

    return { conversation: updatedConv };
  },

  updateStatus(
    conversationId: string,
    status: ConversationStatus,
    agent: { id: string; name: string; role: string }
  ): { systemMsg?: SupportMessage; conversation: SupportConversation } {
    const conv = this.getConversation(conversationId);
    if (!conv) throw new Error("Conversation not found");

    const settings = this.getSettings();
    const patch: Partial<SupportConversation> = {
      status,
      updatedAt: now(),
    };

    if (status === "resolved") {
      patch.resolvedAt = now();
      patch.humanRequested = false;
    } else if (status === "closed") {
      patch.closedAt = now();
      patch.humanRequested = false;
    }

    fileDb.update("supportConversations", { id: conversationId }, patch);
    const updatedConv = this.getConversation(conversationId)!;

    let systemMsg: SupportMessage | undefined;
    if (status === "resolved" && settings.resolutionMessage) {
      const msgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      systemMsg = {
        id: msgId,
        conversationId,
        sender: "system",
        senderName: "Queens Care System",
        content: settings.resolutionMessage,
        isInternal: false,
        deliveryStatus: "delivered",
        createdAt: now(),
      };
      fileDb.insert("supportMessages", systemMsg as unknown as Record<string, unknown>);
      broadcastSupportEvent({
        type: "message:created",
        conversationId,
        message: systemMsg,
      });
    }

    fileDb.insert("supportAuditLogs", {
      id: `audit-${randomUUID()}`,
      conversationId,
      actor: agent,
      action: status === "resolved" ? "resolved" : status === "closed" ? "closed" : "status_changed",
      oldValue: conv.status,
      newValue: status,
      createdAt: now(),
    });

    broadcastSupportEvent({
      type: "status:changed",
      conversationId,
      status,
      conversation: updatedConv,
    });

    return { systemMsg, conversation: updatedConv };
  },

  markReadByAdmin(conversationId: string): void {
    fileDb.update("supportConversations", { id: conversationId }, { unreadAdminCount: 0 });
    const conv = this.getConversation(conversationId);
    if (conv) {
      broadcastSupportEvent({
        type: "conversation:updated",
        conversation: conv,
      });
    }
  },

  markReadByCustomer(conversationId: string): void {
    fileDb.update("supportConversations", { id: conversationId }, { unreadCustomerCount: 0 });
    const conv = this.getConversation(conversationId);
    if (conv) {
      broadcastSupportEvent({
        type: "conversation:updated",
        conversation: conv,
      });
    }
  },

  // ─── ORDER & CUSTOMER CONTEXT ───
  getCustomerContext(conversationId: string): Record<string, unknown> {
    const conv = this.getConversation(conversationId);
    if (!conv) return {};

    let user: Record<string, unknown> | null = null;
    let orders: Record<string, unknown>[] = [];

    if (conv.customerId) {
      user = fileDb.findOne("users", (u) => u.id === conv.customerId);
      orders = fileDb.findMany("orders", (o) => o.userId === conv.customerId || o.customerId === conv.customerId);
    } else if (conv.customerEmail) {
      orders = fileDb.findMany("orders", (o) => (o.shipping as Record<string, unknown>)?.email === conv.customerEmail);
    }

    // Sort orders descending
    orders.sort((a, b) => new Date(String(b.createdAt || "")).getTime() - new Date(String(a.createdAt || "")).getTime());

    return {
      conversation: conv,
      customer: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
          }
        : null,
      recentOrders: orders.slice(0, 5).map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        itemsCount: Array.isArray(o.lines) ? o.lines.length : 0,
      })),
      totalOrdersCount: orders.length,
    };
  },

  getOrderDetails(orderId: string): Record<string, unknown> | null {
    const order = fileDb.findOne("orders", (o) => o.id === orderId || (o as Record<string, unknown>).orderNumber === orderId);
    return order || null;
  },

  // ─── ANALYTICS ───
  getAnalytics(): Record<string, unknown> {
    const convs = (fileDb.collection("supportConversations") as unknown as SupportConversation[]) || [];
    const total = convs.length;
    const open = convs.filter((c) => c.status === "open" || c.status === "new" || c.status === "waiting_support").length;
    const resolved = convs.filter((c) => c.status === "resolved").length;
    const closed = convs.filter((c) => c.status === "closed").length;
    const humanHandled = convs.filter((c) => c.handlingMode === "human").length;
    const aiHandled = convs.filter((c) => c.handlingMode === "ai").length;
    const humanRequested = convs.filter((c) => c.humanRequested).length;
    const unread = convs.reduce((acc, c) => acc + (c.unreadAdminCount > 0 ? 1 : 0), 0);

    return {
      total,
      open,
      resolved,
      closed,
      humanHandled,
      aiHandled,
      humanRequested,
      unread,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 100,
    };
  },
};
