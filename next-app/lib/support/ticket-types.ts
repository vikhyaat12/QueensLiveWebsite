/* Queens Care — Support Ticket types.
   Tickets are linked to chat conversations (real id references stored on both
   sides), customer, order and product. All config (categories, tags, numbering)
   is Admin-managed via the store — nothing hardcoded in UI logic. */

export type TicketStatus =
  | "NEW"
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_CUSTOMER"
  | "WAITING_FOR_INTERNAL"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface TicketAttachment {
  id: string;           // supportAttachments collection id
  filename: string;
  mimeType: string;
  size: number;
  // NOTE: never a predictable public URL — served via /api/support/attachment/[id]
  messageId?: string;   // chat message the attachment came from (if from chat)
  conversationId?: string;
}

export type TicketTimelineEntryType =
  | "ticket_created"
  | "customer_message"
  | "agent_reply"
  | "internal_note"
  | "status_changed"
  | "priority_changed"
  | "assigned"
  | "attachment_added"
  | "conversation_linked"
  | "resolved"
  | "reopened"
  | "merged";

export interface TicketTimelineEntry {
  id: string;
  type: TicketTimelineEntryType;
  actorId: string;
  actorName: string;
  actorRole: string; // customer | admin | employee | system
  content?: string;
  isInternal?: boolean; // internal entries NEVER returned to customers
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;      // e.g. QC-2026-000001 (configurable prefix/format)
  subject: string;
  description: string;
  category: string;          // Admin-managed category name
  priority: TicketPriority;
  status: TicketStatus;
  customerId?: string | null;   // null for guest chat tickets
  customerName: string;
  customerEmail?: string | null;
  conversationId?: string | null;   // primary linked conversation
  conversationIds: string[];        // all linked conversations
  orderId?: string | null;
  productId?: string | null;
  assignedTo?: { id: string; name: string; email?: string } | null;
  tags: string[];                   // Admin-managed tags
  attachments: TicketAttachment[];
  resolutionNote?: string;
  resolutionVisibleToCustomer?: string; // optional customer-visible response
  firstResponseAt?: string | null;      // SLA tracking (real data only)
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedAt?: string | null;
  mergedIntoId?: string | null;         // set when this ticket was merged away
  mergedFromIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportCategoryConfig {
  id: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
}

export interface SupportTagConfig {
  id: string;
  name: string;
  enabled: boolean;
}

export interface TicketNumberingConfig {
  prefix: string;          // e.g. "QC"
  includeYear: boolean;    // QC-2026-000001
  padLength: number;       // 6
  nextSequence: number;    // monotonic, never reused
}

export interface SupportTicketConfig {
  categories: SupportCategoryConfig[];
  tags: SupportTagConfig[];
  numbering: TicketNumberingConfig;
  attachmentsEnabled: boolean;
  attachmentsEnabledForCustomer: boolean;
  maxAttachmentMb: number;
  allowedAttachmentTypes: string[]; // mime prefixes, e.g. ["image/","video/","application/pdf"]
  reopenWindowDays: number;         // 0 = unlimited; otherwise days after close
}

export const DEFAULT_TICKET_CONFIG: SupportTicketConfig = {
  categories: [
    { id: "cat-order", name: "Order Issue", enabled: true, sortOrder: 1 },
    { id: "cat-delivery", name: "Delivery", enabled: true, sortOrder: 2 },
    { id: "cat-damaged", name: "Damaged Product", enabled: true, sortOrder: 3 },
    { id: "cat-return", name: "Return / Refund", enabled: true, sortOrder: 4 },
    { id: "cat-payment", name: "Payment", enabled: true, sortOrder: 5 },
    { id: "cat-product", name: "Product Information", enabled: true, sortOrder: 6 },
    { id: "cat-account", name: "Account", enabled: true, sortOrder: 7 },
    { id: "cat-technical", name: "Technical Issue", enabled: true, sortOrder: 8 },
    { id: "cat-other", name: "Other", enabled: true, sortOrder: 9 },
  ],
  tags: [
    { id: "tag-refund", name: "refund", enabled: true },
    { id: "tag-delivery", name: "delivery", enabled: true },
    { id: "tag-damaged", name: "damaged", enabled: true },
    { id: "tag-payment", name: "payment", enabled: true },
    { id: "tag-product", name: "product", enabled: true },
    { id: "tag-technical", name: "technical", enabled: true },
  ],
  numbering: { prefix: "QC", includeYear: true, padLength: 6, nextSequence: 1 },
  attachmentsEnabled: true,
  attachmentsEnabledForCustomer: true,
  maxAttachmentMb: 25,
  allowedAttachmentTypes: ["image/", "video/", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument"],
  reopenWindowDays: 0,
};

export const TICKET_STATUSES: TicketStatus[] = [
  "NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "WAITING_FOR_INTERNAL", "RESOLVED", "CLOSED",
];

export const TICKET_PRIORITIES: TicketPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

/** Public (customer-safe) projection of a ticket — strips internal timeline + internal fields */
export type PublicTicket = Omit<SupportTicket, "mergedIntoId"> & {};
