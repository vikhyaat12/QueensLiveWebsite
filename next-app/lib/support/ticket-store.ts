import "server-only";
import { fileDb } from "@/lib/commerce/file-db";
import {
  DEFAULT_TICKET_CONFIG,
  type SupportTicket,
  type SupportTicketConfig,
  type TicketPriority,
  type TicketTimelineEntry,
} from "./ticket-types";
import { logAccessAuditEvent } from "@/lib/audit";

const now = () => new Date().toISOString();
const shortId = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export interface TicketFilterParams {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  customerId?: string;
  orderId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

type Actor = { id: string; name: string; role: string };

/* ────────────────────────────────────────────────────────────────
   CONFIG (Admin-managed categories, tags, numbering, attachments)
   ──────────────────────────────────────────────────────────────── */
export const ticketConfigStore = {
  get(): SupportTicketConfig {
    const s = fileDb.findOne("settings", (item) => item.key === "support_ticket_config") as Record<string, unknown> | undefined;
    if (s?.value) {
      try {
        const parsed = typeof s.value === "string" ? JSON.parse(s.value) : s.value;
        return { ...DEFAULT_TICKET_CONFIG, ...parsed };
      } catch { /* fall through */ }
    }
    return DEFAULT_TICKET_CONFIG;
  },

  save(patch: Partial<SupportTicketConfig>): SupportTicketConfig {
    const merged = { ...this.get(), ...patch };
    fileDb.update(
      "settings",
      { key: "support_ticket_config" },
      { key: "support_ticket_config", value: JSON.stringify(merged), group: "support", updatedAt: now() }
    );
    return merged;
  },

  /** Reorderable / editable category list */
  upsertCategory(cat: { id?: string; name: string; enabled?: boolean; sortOrder?: number }): SupportTicketConfig {
    const cfg = this.get();
    if (cat.id) {
      const existing = cfg.categories.find((c) => c.id === cat.id);
      if (existing) {
        existing.name = cat.name;
        if (cat.enabled !== undefined) existing.enabled = cat.enabled;
        if (cat.sortOrder !== undefined) existing.sortOrder = cat.sortOrder;
      }
    } else {
      cfg.categories.push({
        id: `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: cat.name,
        enabled: cat.enabled !== false,
        sortOrder: cat.sortOrder ?? cfg.categories.length + 1,
      });
    }
    return this.save({ categories: cfg.categories });
  },

  deleteCategory(id: string): SupportTicketConfig {
    const cfg = this.get();
    return this.save({ categories: cfg.categories.filter((c) => c.id !== id) });
  },

  upsertTag(tag: { id?: string; name: string; enabled?: boolean }): SupportTicketConfig {
    const cfg = this.get();
    if (tag.id) {
      const existing = cfg.tags.find((t) => t.id === tag.id);
      if (existing) {
        existing.name = tag.name;
        if (tag.enabled !== undefined) existing.enabled = tag.enabled;
      }
    } else {
      cfg.tags.push({ id: `tag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, name: tag.name, enabled: tag.enabled !== false });
    }
    return this.save({ tags: cfg.tags });
  },

  deleteTag(id: string): SupportTicketConfig {
    const cfg = this.get();
    return this.save({ tags: cfg.tags.filter((t) => t.id !== id) });
  },
};

/* ────────────────────────────────────────────────────────────────
   TICKET STORE
   ──────────────────────────────────────────────────────────────── */
export const ticketStore = {
  /* ── Numbering: unique, monotonic, config-driven format ── */
  nextTicketNumber(): string {
    const cfg = ticketConfigStore.get();
    const seq = cfg.numbering.nextSequence;
    const year = new Date().getFullYear();
    const parts = [cfg.numbering.prefix || "QC"];
    if (cfg.numbering.includeYear) parts.push(String(year));
    parts.push(String(seq).padStart(Math.max(1, cfg.numbering.padLength), "0"));
    ticketConfigStore.save({ numbering: { ...cfg.numbering, nextSequence: seq + 1 } });
    return parts.join("-");
  },

  getById(id: string): SupportTicket | null {
    return (fileDb.findOne("supportTickets", (t) => t.id === id) as unknown as SupportTicket) || null;
  },

  getByTicketNumber(num: string): SupportTicket | null {
    return (fileDb.findOne("supportTickets", (t) => t.ticketNumber === num) as unknown as SupportTicket) || null;
  },

  list(filters: TicketFilterParams = {}): { tickets: SupportTicket[]; total: number } {
    let all = (fileDb.findMany("supportTickets", () => true) as unknown as SupportTicket[]) || [];
    // Never show merged-away tickets in the main list
    all = all.filter((t) => !t.mergedIntoId);

    if (filters.status && filters.status !== "ALL") all = all.filter((t) => t.status === filters.status);
    if (filters.priority && filters.priority !== "ALL") all = all.filter((t) => t.priority === filters.priority);
    if (filters.category && filters.category !== "ALL") all = all.filter((t) => t.category === filters.category);
    if (filters.tag) all = all.filter((t) => t.tags?.includes(filters.tag as string));
    if (filters.customerId) all = all.filter((t) => t.customerId === filters.customerId);
    if (filters.orderId) all = all.filter((t) => t.orderId === filters.orderId || t.ticketNumber === filters.orderId);
    if (filters.assignedTo) {
      all = filters.assignedTo === "unassigned"
        ? all.filter((t) => !t.assignedTo)
        : all.filter((t) => t.assignedTo?.id === filters.assignedTo);
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      all = all.filter((t) => new Date(t.createdAt).getTime() >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 24 * 3600 * 1000;
      all = all.filter((t) => new Date(t.createdAt).getTime() <= to);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      all = all.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q) ||
          t.customerEmail?.toLowerCase().includes(q) ||
          t.orderId?.toLowerCase().includes(q)
      );
    }

    all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { tickets: all, total: all.length };
  },

  /**
   * Create a ticket. `conversationId` links the chat; ownership of that
   * conversation must be verified by the API layer BEFORE calling this.
   */
  create(input: {
    subject: string;
    description: string;
    category: string;
    priority?: TicketPriority;
    customerId?: string | null;
    customerName: string;
    customerEmail?: string | null;
    conversationId?: string | null;
    orderId?: string | null;
    productId?: string | null;
    attachments?: SupportTicket["attachments"];
    tags?: string[];
    actor: Actor;
  }): { ticket: SupportTicket; conversationUpdated: boolean } {
    const cfg = ticketConfigStore.get();
    const category = cfg.categories.find((c) => c.enabled && c.name === input.category) ? input.category : (cfg.categories.find((c) => c.enabled) ? input.category : input.category);

    let conversationLinked = false;
    let conversationIds: string[] = [];
    if (input.conversationId) {
      const conv = fileDb.findOne("supportConversations", (c) => c.id === input.conversationId);
      if (conv) {
        conversationIds = [input.conversationId];
        conversationLinked = true;
      }
    }

    const id = shortId("tkt");
    const ticket: SupportTicket = {
      id,
      ticketNumber: this.nextTicketNumber(),
      subject: input.subject.slice(0, 200),
      description: input.description.slice(0, 5000),
      category,
      priority: input.priority || "NORMAL",
      status: "NEW",
      customerId: input.customerId || null,
      customerName: input.customerName.slice(0, 120),
      customerEmail: input.customerEmail || null,
      conversationId: conversationIds[0] || null,
      conversationIds,
      orderId: input.orderId || null,
      productId: input.productId || null,
      assignedTo: null,
      tags: (input.tags || []).slice(0, 10),
      attachments: (input.attachments || []).slice(0, 10),
      createdAt: now(),
      updatedAt: now(),
    };

    fileDb.insert("supportTickets", ticket as unknown as Record<string, unknown>);

    // Timeline entry
    this.addTimeline(id, {
      type: "ticket_created",
      actor: input.actor,
      content: "Ticket created",
      isInternal: false,
    });

    // Write the real link back onto the conversation (bidirectional)
    if (conversationLinked && input.conversationId) {
      fileDb.update("supportConversations", { id: input.conversationId }, { ticketId: id, ticketNumber: ticket.ticketNumber, updatedAt: now() });
    }

    return { ticket, conversationUpdated: conversationLinked };
  },

  addTimeline(
    ticketId: string,
    entry: {
      type: TicketTimelineEntry["type"];
      actor: Actor;
      content?: string;
      isInternal?: boolean;
      oldValue?: string;
      newValue?: string;
    }
  ): TicketTimelineEntry {
    const e: TicketTimelineEntry = {
      id: shortId("tl"),
      type: entry.type,
      actorId: entry.actor.id,
      actorName: entry.actor.name,
      actorRole: entry.actor.role,
      content: entry.content,
      isInternal: Boolean(entry.isInternal),
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      createdAt: now(),
    };
    fileDb.insert("supportTicketTimeline", { ...e, ticketId } as unknown as Record<string, unknown>);
    fileDb.update("supportTickets", { id: ticketId }, { updatedAt: now() });
    return e;
  },

  getTimeline(ticketId: string, includeInternal: boolean): TicketTimelineEntry[] {
    let entries = (fileDb.findMany("supportTicketTimeline", (e) => (e as unknown as TicketTimelineEntry & { ticketId: string }).ticketId === ticketId) as unknown as TicketTimelineEntry[]) || [];
    if (!includeInternal) entries = entries.filter((e) => !e.isInternal);
    entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return entries;
  },

  /** Updates + audit trail. Returns updated ticket or null if invalid transition. */
  update(
    id: string,
    patch: Partial<Pick<SupportTicket, "status" | "priority" | "category" | "assignedTo" | "tags" | "resolutionNote" | "resolutionVisibleToCustomer" | "orderId" | "productId">>,
    actor: Actor
  ): SupportTicket | null {
    const ticket = this.getById(id);
    if (!ticket) return null;

    const auditBits: string[] = [];

    if (patch.status && patch.status !== ticket.status) {
      ticket.status = patch.status;
      if (patch.status === "RESOLVED") {
        ticket.resolvedAt = now();
        ticket.reopenedAt = null;
      }
      if (patch.status === "CLOSED") ticket.closedAt = now();
      if (patch.status === "OPEN" || patch.status === "IN_PROGRESS") {
        ticket.reopenedAt = ticket.resolvedAt || ticket.closedAt ? now() : ticket.reopenedAt;
      }
      auditBits.push(`status ${ticket.status}→${patch.status}`);
      this.addTimeline(id, { type: patch.status === "RESOLVED" ? "resolved" : patch.status === "OPEN" ? "reopened" : "status_changed", actor, oldValue: ticket.status, newValue: patch.status });
    } else if (patch.priority && patch.priority !== ticket.priority) {
      auditBits.push(`priority ${ticket.priority}→${patch.priority}`);
      this.addTimeline(id, { type: "priority_changed", actor, oldValue: ticket.priority, newValue: patch.priority });
      ticket.priority = patch.priority;
    } else if (patch.assignedTo !== undefined) {
      auditBits.push(`assigned→${patch.assignedTo?.name || "unassigned"}`);
      this.addTimeline(id, { type: "assigned", actor, oldValue: ticket.assignedTo?.name || "Unassigned", newValue: patch.assignedTo?.name || "Unassigned" });
      ticket.assignedTo = patch.assignedTo;
    }

    if (patch.category && patch.category !== ticket.category) ticket.category = patch.category;
    if (patch.tags) ticket.tags = patch.tags.slice(0, 10);
    if (patch.resolutionNote !== undefined) ticket.resolutionNote = patch.resolutionNote;
    if (patch.resolutionVisibleToCustomer !== undefined) ticket.resolutionVisibleToCustomer = patch.resolutionVisibleToCustomer;
    if (patch.orderId !== undefined) ticket.orderId = patch.orderId;
    if (patch.productId !== undefined) ticket.productId = patch.productId;

    fileDb.update("supportTickets", { id }, ticket as unknown as Record<string, unknown>);

    if (auditBits.length) {
      logAccessAuditEvent({
        action: "ticket_updated",
        actorId: actor.id, actorName: actor.name, actorEmail: "",
        targetId: ticket.ticketNumber, targetName: ticket.subject.slice(0, 60), targetEmail: "",
        status: "success",
        details: auditBits.join("; "),
      });
    }
    return ticket;
  },

  /** First agent reply stamps firstResponseAt (for real SLA tracking) */
  recordAgentReply(id: string): void {
    const t = this.getById(id);
    if (t && !t.firstResponseAt) {
      t.firstResponseAt = now();
      fileDb.update("supportTickets", { id }, { firstResponseAt: t.firstResponseAt } as unknown as Record<string, unknown>);
    }
  },

  /** Admin links an additional (later) conversation to an existing ticket */
  linkConversation(id: string, conversationId: string, actor: Actor): SupportTicket | null {
    const ticket = this.getById(id);
    if (!ticket) return null;
    const conv = fileDb.findOne("supportConversations", (c) => c.id === conversationId);
    if (!conv) return null;
    if (!ticket.conversationIds.includes(conversationId)) {
      ticket.conversationIds.push(conversationId);
      if (!ticket.conversationId) ticket.conversationId = conversationId;
      fileDb.update("supportTickets", { id }, ticket as unknown as Record<string, unknown>);
      fileDb.update("supportConversations", { id: conversationId }, { ticketId: id, ticketNumber: ticket.ticketNumber, updatedAt: now() });
      this.addTimeline(id, { type: "conversation_linked", actor, content: `Linked conversation ${conversationId}` });
    }
    return ticket;
  },

  /**
   * Merge duplicate tickets into a primary. History is preserved: the merged
   * tickets are marked mergedIntoId (never deleted) and their timeline +
   * conversations are re-pointed to the primary.
   */
  merge(primaryId: string, mergeIds: string[], actor: Actor): SupportTicket | null {
    const primary = this.getById(primaryId);
    if (!primary) return null;
    const valid = mergeIds.filter((mid) => mid !== primaryId && this.getById(mid));
    if (!valid.length) return null;

    for (const mid of valid) {
      const dup = this.getById(mid)!;
      // Move attachments & conversations over
      primary.attachments = [...(primary.attachments || []), ...(dup.attachments || [])].slice(0, 20);
      for (const cid of dup.conversationIds || []) {
        if (!primary.conversationIds.includes(cid)) primary.conversationIds.push(cid);
        fileDb.update("supportConversations", { id: cid }, { ticketId: primaryId, ticketNumber: primary.ticketNumber, updatedAt: now() });
      }
      primary.tags = Array.from(new Set([...(primary.tags || []), ...(dup.tags || [])])).slice(0, 10);
      if (!primary.orderId && dup.orderId) primary.orderId = dup.orderId;

      dup.mergedIntoId = primaryId;
      fileDb.update("supportTickets", { id: mid }, dup as unknown as Record<string, unknown>);
      primary.mergedFromIds = [...(primary.mergedFromIds || []), mid];

      this.addTimeline(mid, { type: "merged", actor, content: `Merged into ${primary.ticketNumber}` });
    }

    this.addTimeline(primaryId, { type: "merged", actor, content: `Merged ${valid.length} ticket(s): ${valid.map((m) => this.getById(m)?.ticketNumber).join(", ")}` });
    fileDb.update("supportTickets", { id: primaryId }, primary as unknown as Record<string, unknown>);

    logAccessAuditEvent({
      action: "tickets_merged",
      actorId: actor.id, actorName: actor.name, actorEmail: "",
      targetId: primary.ticketNumber, targetName: primary.subject.slice(0, 60), targetEmail: "",
      status: "success",
      details: `Merged: ${valid.map((m) => this.getById(m)?.ticketNumber).join(", ")}`,
    });

    return primary;
  },

  /** Customer/admin reopen within configured window */
  canReopen(ticket: SupportTicket): boolean {
    if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") return false;
    const cfg = ticketConfigStore.get();
    if (!cfg.reopenWindowDays) return true;
    const ref = ticket.resolvedAt || ticket.closedAt;
    if (!ref) return true;
    return Date.now() - new Date(ref).getTime() <= cfg.reopenWindowDays * 24 * 3600 * 1000;
  },

  /* ── Reports (real data only) ── */
  reports(): Record<string, unknown> {
    const all = ((fileDb.findMany("supportTickets", () => true) as unknown as SupportTicket[]) || []).filter((t) => !t.mergedIntoId);
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    const byProduct: Record<string, number> = {};
    const byOrder: Record<string, number> = {};
    let firstResponseSum = 0, firstResponseCount = 0;
    let resolutionSum = 0, resolutionCount = 0;

    for (const t of all) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      if (t.assignedTo) byAgent[t.assignedTo.name] = (byAgent[t.assignedTo.name] || 0) + 1;
      if (t.productId) byProduct[t.productId] = (byProduct[t.productId] || 0) + 1;
      if (t.orderId) byOrder[t.orderId] = (byOrder[t.orderId] || 0) + 1;
      if (t.firstResponseAt) {
        firstResponseSum += new Date(t.firstResponseAt).getTime() - new Date(t.createdAt).getTime();
        firstResponseCount++;
      }
      if (t.resolvedAt) {
        resolutionSum += new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
        resolutionCount++;
      }
    }

    const convs = (fileDb.findMany("supportConversations", () => true) as unknown as Array<{ id: string; ticketId?: string }>) || [];
    const conversationsWithTickets = convs.filter((c) => c.ticketId).length;
    const avgH = (ms: number, c: number) => (c ? Math.round((ms / c) / 3600000 * 10) / 10 : 0);

    return {
      totalTickets: all.length,
      openTickets: all.filter((t) => ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "WAITING_FOR_INTERNAL"].includes(t.status)).length,
      resolvedTickets: all.filter((t) => t.status === "RESOLVED").length,
      closedTickets: all.filter((t) => t.status === "CLOSED").length,
      totalConversations: convs.length,
      chatToTicketConversion: convs.length ? Math.round((conversationsWithTickets / convs.length) * 100) : 0,
      avgFirstResponseHours: avgH(firstResponseSum, firstResponseCount),
      avgResolutionHours: avgH(resolutionSum, resolutionCount),
      byStatus, byCategory, byPriority, byAgent, byProduct, byOrder,
      attachmentCount: all.reduce((n, t) => n + (t.attachments?.length || 0), 0),
    };
  },
};
