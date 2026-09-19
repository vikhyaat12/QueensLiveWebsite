export type ConversationStatus =
  | "new"
  | "open"
  | "waiting_customer"
  | "waiting_support"
  | "resolved"
  | "closed";

export type HandlingMode = "ai" | "human";

export type ConversationPriority = "low" | "normal" | "high" | "urgent";

export type MessageSenderType = "customer" | "ai" | "agent" | "system";

export type MessageDeliveryStatus = "sent" | "delivered" | "failed";

export interface SupportProductAttachment {
  name: string;
  slug: string;
  image: string;
  price: number;
  category: string;
}

export interface SupportFileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  sender: MessageSenderType;
  senderId?: string;
  senderName: string;
  content: string;
  isInternal: boolean; // Internal notes only visible to admin/support
  deliveryStatus: MessageDeliveryStatus;
  products?: SupportProductAttachment[];
  attachments?: SupportFileAttachment[];
  createdAt: string;
}

export interface SupportAgent {
  id: string;
  name: string;
  email?: string;
  role: string;
}

export interface SupportConversation {
  id: string;
  visitorId: string; // Anonymous session identifier
  customerId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  channel: "website_chat";
  status: ConversationStatus;
  handlingMode: HandlingMode;
  humanRequested: boolean;
  assignedTo?: SupportAgent | null;
  priority: ConversationPriority;
  relevantOrderId?: string | null;
  unreadAdminCount: number;
  unreadCustomerCount: number;
  lastMessage: {
    text: string;
    sender: MessageSenderType;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedAt?: string | null;
  tags?: string[];
  ticketId?: string | null;      // Linked support ticket (real DB relationship)
  ticketNumber?: string | null;  // Denormalized for display, e.g. QC-2026-000001
  metadata?: {
    userAgent?: string;
    currentUrl?: string;
    ipHash?: string;
    csatScore?: number;
    csatComment?: string;
  };
}

export interface SupportHours {
  enabled: boolean;
  start: string; // e.g. "09:00"
  end: string;   // e.g. "20:00"
  timezone: string; // e.g. "Asia/Kolkata"
  days: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
}

export interface SupportSettings {
  chatEnabled: boolean;
  aiEnabled: boolean;
  humanSupportEnabled: boolean;
  humanHandoffEnabled: boolean;
  isOnline: boolean;
  supportHours: SupportHours;
  welcomeMessage: string;
  offlineMessage: string;
  humanHandoffMessage: string;
  resolutionMessage: string;
  awayMessage: string;
  csatEnabled: boolean;
  reopenOnCustomerMessage: boolean;
}

export interface SupportAuditLog {
  id: string;
  conversationId: string;
  actor: {
    id: string;
    name: string;
    role: string;
  };
  action:
    | "assigned"
    | "reassigned"
    | "takeover_human"
    | "returned_ai"
    | "status_changed"
    | "note_created"
    | "config_changed"
    | "resolved"
    | "reopened"
    | "closed";
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface SupportFilterParams {
  status?: string;
  handlingMode?: string;
  assignedTo?: string;
  search?: string;
  humanRequested?: boolean;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}
