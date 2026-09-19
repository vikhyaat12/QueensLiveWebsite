"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupportConversation, SupportMessage } from "@/lib/support/support-types";

/* ═══════════════════════════════════════════════════════════════
   ADMIN TICKET CENTER
   • All tickets + filters (status/priority/category/agent/date/search)
   • Status, priority, assignment, tags
   • Reply / internal note / resolution (customer-visible)
   • Create ticket from chat conversation (with attachment selection)
   • Merge duplicates (history preserved)
   • Export (CSV / JSON) — server-audited
   ═══════════════════════════════════════════════════════════════ */

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  customerId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  conversationId?: string | null;
  conversationIds?: string[];
  orderId?: string | null;
  productId?: string | null;
  assignedTo?: { id: string; name: string; email?: string } | null;
  tags: string[];
  attachments?: Array<{ id: string; filename: string; mimeType: string; size: number }>;
  resolutionNote?: string;
  resolutionVisibleToCustomer?: string;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  mergedIntoId?: string | null;
};

type TimelineEntry = {
  id: string;
  type: string;
  actorName: string;
  actorRole: string;
  content?: string;
  isInternal?: boolean;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
};

const STATUSES = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "WAITING_FOR_INTERNAL", "RESOLVED", "CLOSED"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  NEW: { bg: "#E0E7FF", fg: "#3730A3" },
  OPEN: { bg: "#DBEAFE", fg: "#1D4ED8" },
  IN_PROGRESS: { bg: "#FEF3C7", fg: "#92400E" },
  WAITING_FOR_CUSTOMER: { bg: "#FCE7F3", fg: "#9D174D" },
  WAITING_FOR_INTERNAL: { bg: "#F3E8FF", fg: "#6B21A8" },
  RESOLVED: { bg: "#DCFCE7", fg: "#15803D" },
  CLOSED: { bg: "#E2E8F0", fg: "#475569" },
};
const PRIORITY_STYLES: Record<string, { bg: string; fg: string }> = {
  LOW: { bg: "#F1F5F9", fg: "#475569" },
  NORMAL: { bg: "#E0F2FE", fg: "#0369A1" },
  HIGH: { bg: "#FEF3C7", fg: "#B45309" },
  URGENT: { bg: "#FEE2E2", fg: "#B91C1C" },
};

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function AdminTicketCenter({
  prefillConversationId,
  onNavigateToInbox,
}: {
  currentUser?: { name?: string; role?: string; email?: string; id?: string };
  prefillConversationId?: string | null;
  onNavigateToInbox?: () => void;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [config, setConfig] = useState<{ categories: Array<{ name: string; enabled: boolean }>; tags: Array<{ name: string; enabled: boolean }> } | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // Reply composer
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [showResolution, setShowResolution] = useState(false);

  // Merge
  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  const [mergeMode, setMergeMode] = useState(false);

  // Create-from-chat modal
  const [showCreateFromChat, setShowCreateFromChat] = useState(false);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>(prefillConversationId || "");
  const [convMessages, setConvMessages] = useState<SupportMessage[]>([]);
  const [selectedAttIds, setSelectedAttIds] = useState<string[]>([]);
  const [createState, setCreateState] = useState({ subject: "", description: "", category: "", priority: "NORMAL", orderId: "" });
  const [creating, setCreating] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);
    if (agentFilter !== "ALL") params.set("assignedTo", agentFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (search.trim()) params.set("search", search.trim());
    try {
      const res = await fetch(`/api/admin/support/tickets?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.tickets)) setTickets(data.tickets);
      if (data.config) setConfig(data.config);
    } catch {}
    setLoading(false);
  }, [statusFilter, priorityFilter, categoryFilter, agentFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Light polling so newly created/replied tickets appear without manual refresh
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (!selected && !showCreateFromChat) loadTickets();
    }, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadTickets, selected, showCreateFromChat]);

  useEffect(() => {
    fetch("/api/admin/employees")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.employees)) setAgents(d.employees.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })));
      })
      .catch(() => {});
  }, []);

  const openTicket = async (t: Ticket) => {
    setSelected(t);
    setTimeline([]);
    setNotice("");
    setShowResolution(false);
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(t.id)}`);
      const data = await res.json();
      if (data.ticket) {
        setSelected(data.ticket);
        setTimeline(data.timeline || []);
      }
    } catch {}
  };

  const flash = (msg: string, isError = false) => {
    setNotice(msg);
    setNoticeIsError(isError);
    setTimeout(() => setNotice(""), 4000);
  };

  const patchTicket = async (patch: Record<string, unknown>) => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${encodeURIComponent(selected.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) {
        setSelected(data.ticket);
        setTimeline(data.timeline || []);
        loadTickets();
        flash("Ticket updated.");
      } else {
        flash(data.error || "Update failed.", true);
      }
    } catch {
      flash("Network error.", true);
    }
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(selected.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim(), isInternal: isInternalNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplyText("");
        setTimeline(data.timeline || []);
        setSelected(data.ticket);
        loadTickets();
        flash(isInternalNote ? "Internal note saved (never visible to customer)." : "Reply sent to customer.");
      } else {
        flash(data.error || "Failed to send.", true);
      }
    } catch {
      flash("Network error.", true);
    }
    setSending(false);
  };

  const submitResolution = async () => {
    if (!selected || !resolutionText.trim()) return;
    await patchTicket({ status: "RESOLVED", resolutionNote: resolutionText, resolutionVisibleToCustomer: resolutionText });
    setResolutionText("");
    setShowResolution(false);
  };

  const doMerge = async () => {
    if (!selected || mergeSelection.length === 0) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${encodeURIComponent(selected.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "merge", mergeIds: mergeSelection }),
      });
      const data = await res.json();
      if (res.ok) {
        flash(`${mergeSelection.length} ticket(s) merged into ${selected.ticketNumber}. History preserved.`);
        setMergeMode(false);
        setMergeSelection([]);
        setSelected(data.ticket);
        loadTickets();
      } else {
        flash(data.error || "Merge failed.", true);
      }
    } catch {
      flash("Network error.", true);
    }
  };

  /* ── Create from chat ── */
  const openCreateFromChat = async (convId?: string) => {
    setShowCreateFromChat(true);
    setSelected(null);
    const cid = convId || selectedConvId;
    try {
      const res = await fetch("/api/admin/support/conversations?limit=50");
      const data = await res.json();
      if (Array.isArray(data.conversations)) setConversations(data.conversations);
    } catch {}
    if (cid) loadConversationForTicket(cid);
  };

  const loadConversationForTicket = async (cid: string) => {
    setSelectedConvId(cid);
    setSelectedAttIds([]);
    try {
      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(cid)}`);
      const data = await res.json();
      if (data.conversation) {
        setConvMessages(data.messages || []);
        const conv = data.conversation as SupportConversation;
        // Prefill subject/description from real conversation content
        const lastCustomer = (data.messages as SupportMessage[]).filter((m) => m.sender === "customer").slice(-1)[0];
        const excerpt = (data.messages as SupportMessage[])
          .filter((m) => !m.isInternal && m.sender !== "system")
          .slice(-4)
          .map((m) => `${m.sender === "customer" ? conv.customerName : "Support"}: ${m.content}`)
          .join("\n");
        setCreateState((s) => ({
          ...s,
          subject: conv.relevantOrderId ? `Issue with order ${conv.relevantOrderId}` : lastCustomer?.content?.slice(0, 80) || `Support follow-up — ${conv.customerName}`,
          description: excerpt || "",
          orderId: conv.relevantOrderId || "",
        }));
      }
    } catch {}
  };

  const submitCreateFromChat = async () => {
    if (!selectedConvId || !createState.subject.trim() || !createState.description.trim() || !createState.category || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/support/tickets/from-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          subject: createState.subject,
          description: createState.description,
          category: createState.category,
          priority: createState.priority,
          orderId: createState.orderId,
          attachmentIds: selectedAttIds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        flash(`Ticket ${data.ticket.ticketNumber} created and linked to the conversation.`);
        setShowCreateFromChat(false);
        setConvMessages([]);
        setSelectedConvId("");
        loadTickets();
        openTicket(data.ticket);
      } else {
        flash(data.error || "Failed to create ticket.", true);
      }
    } catch {
      flash("Network error.", true);
    }
    setCreating(false);
  };

  const exportUrl = (type: string, format: string) => {
    const params = new URLSearchParams({ type, format });
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);
    if (agentFilter !== "ALL") params.set("assignedTo", agentFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (search.trim()) params.set("search", search.trim());
    return `/api/admin/support/export?${params.toString()}`;
  };

  const chip = (active: boolean, label: string, onClick: () => void, activeBg = "var(--purple, #2A0F3A)", activeFg = "#fff") => (
    <button
      onClick={onClick}
      style={{
        padding: "5px 10px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
        background: active ? activeBg : "#F1F5F9", color: active ? activeFg : "#475569", whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  const inputStyle: React.CSSProperties = { padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 12.5, outline: "none", width: "100%", boxSizing: "border-box", background: "#fff" };

  return (
    <div style={{ color: "var(--ink, #222)" }}>
      <style>{`
        @media (max-width: 900px) {
          .atc-grid { grid-template-columns: 1fr !important; }
          .atc-filters { flex-direction: column !important; align-items: stretch !important; }
          .atc-meta { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--purple, #2A0F3A)" }}>🎫 Support Tickets</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => openCreateFromChat()} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "var(--purple, #2A0F3A)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            + Ticket from Chat
          </button>
          <a href={exportUrl("tickets", "csv")} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--line)", background: "#fff", fontSize: 12, fontWeight: 600, color: "var(--purple, #2A0F3A)", textDecoration: "none" }}>
            ⬇ Export CSV
          </a>
          <a href={exportUrl("tickets", "json")} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--line)", background: "#fff", fontSize: 12, fontWeight: 600, color: "var(--purple, #2A0F3A)", textDecoration: "none" }}>
            ⬇ JSON
          </a>
          <a href={exportUrl("conversations", "csv")} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--line)", background: "#fff", fontSize: 12, fontWeight: 600, color: "var(--purple, #2A0F3A)", textDecoration: "none" }}>
            ⬇ Chat Export
          </a>
        </div>
      </div>

      {notice && (
        <div style={{ padding: "9px 14px", marginBottom: 12, borderRadius: 6, fontSize: 12.5, background: noticeIsError ? "#FEF2F2" : "#F0FDF4", color: noticeIsError ? "#B91C1C" : "#166534" }}>
          {notice}
        </div>
      )}

      {/* Filters */}
      <div className="atc-filters" style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search ticket #, subject, customer, order…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: 260 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 160 }}>
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 140 }}>
          <option value="ALL">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }}>
          <option value="ALL">All categories</option>
          {config?.categories.filter((c) => c.enabled).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} style={{ ...inputStyle, maxWidth: 160 }}>
          <option value="ALL">All agents</option>
          <option value="unassigned">Unassigned</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...inputStyle, maxWidth: 150 }} title="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...inputStyle, maxWidth: 150 }} title="To date" />
      </div>

      {/* Two-column: list + detail */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: 16 }} className="atc-grid">
        {/* Ticket list */}
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden auto", maxHeight: "68vh", background: "#fff" }}>
          {loading ? (
            <p style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>Loading tickets…</p>
          ) : tickets.length === 0 ? (
            <p style={{ padding: 24, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>No tickets match the current filters.</p>
          ) : (
            tickets.map((t) => {
              const ss = STATUS_STYLES[t.status] || { bg: "#F1F5F9", fg: "#475569" };
              const ps = PRIORITY_STYLES[t.priority] || { bg: "#F1F5F9", fg: "#475569" };
              const isSelected = selected?.id === t.id;
              const canMergeTarget = mergeMode && selected && t.id !== selected.id && !t.mergedIntoId;
              return (
                <div
                  key={t.id}
                  onClick={() => (canMergeTarget ? setMergeSelection((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id])) : openTicket(t))}
                  style={{
                    padding: "12px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer",
                    background: isSelected ? "rgba(42,15,58,0.05)" : "#fff",
                    borderLeft: isSelected ? "4px solid var(--purple, #2A0F3A)" : "4px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <b style={{ fontSize: 12.5, color: "var(--purple, #2A0F3A)" }}>{t.ticketNumber}</b>
                    {mergeMode && canMergeTarget && (
                      <span style={{ fontSize: 11, color: mergeSelection.includes(t.id) ? "#15803D" : "var(--muted)" }}>
                        {mergeSelection.includes(t.id) ? "✓ selected for merge" : "select to merge"}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "3px 0 5px", fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: ss.bg, color: ss.fg }}>{t.status.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: ps.bg, color: ps.fg }}>{t.priority}</span>
                    <span style={{ fontSize: 10.5, color: "var(--muted)" }}>{t.customerName}</span>
                    {t.orderId && <span style={{ fontSize: 10, color: "#997B4D", fontWeight: 600 }}>#{t.orderId}</span>}
                    {t.attachments?.length ? <span style={{ fontSize: 10 }}>📎{t.attachments.length}</span> : null}
                    {t.conversationIds?.length ? <span style={{ fontSize: 10, color: "#0284C7" }}>💬{t.conversationIds.length}</span> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "#fff", padding: 18, maxHeight: "68vh", overflowY: "auto" }}>
          {!selected ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🎫</span>
              <p style={{ margin: 0, fontSize: 13.5 }}>Select a ticket to view its full timeline, or create one from a chat.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <b style={{ fontSize: 15, color: "var(--purple, #2A0F3A)" }}>{selected.ticketNumber}</b>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600 }}>{selected.subject}</p>
                  <span className="atc-meta" style={{ fontSize: 11, color: "var(--muted)" }}>
                    {selected.customerName} {selected.customerEmail ? `· ${selected.customerEmail}` : ""} · Created {fmt(selected.createdAt)}
                    {selected.firstResponseAt ? ` · First response ${fmt(selected.firstResponseAt)}` : " · No agent response yet"}
                    {selected.resolvedAt ? ` · Resolved ${fmt(selected.resolvedAt)}` : ""}
                  </span>
                </div>
                <button onClick={() => setMergeMode((v) => !v)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--line)", background: "#fff", fontSize: 11.5, cursor: "pointer", fontWeight: 600 }}>
                  {mergeMode ? "Cancel Merge" : "Merge Duplicates…"}
                </button>
              </div>

              {mergeMode && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12 }}>
                  Click tickets in the list to select duplicates, then merge. History, attachments and conversations are preserved on <b>{selected.ticketNumber}</b>.
                  <button onClick={doMerge} disabled={!mergeSelection.length} style={{ marginLeft: 10, padding: "5px 12px", borderRadius: 6, border: "none", background: mergeSelection.length ? "#B45309" : "#CBD5E1", color: "#fff", fontWeight: 700, fontSize: 11.5, cursor: mergeSelection.length ? "pointer" : "not-allowed" }}>
                    Merge {mergeSelection.length || ""} →
                  </button>
                </div>
              )}

              {/* Description */}
              <div style={{ background: "#FAF8F5", border: "1px solid var(--line)", borderRadius: 8, padding: 12, fontSize: 12.5, whiteSpace: "pre-wrap", marginBottom: 12 }}>
                {selected.description}
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <select value={selected.status} onChange={(e) => patchTicket({ status: e.target.value })} style={{ ...inputStyle, maxWidth: 190 }} data-testid="ticket-status-select">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
                <select value={selected.priority} onChange={(e) => patchTicket({ priority: e.target.value })} style={{ ...inputStyle, maxWidth: 130 }}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={selected.assignedTo?.id || ""} onChange={(e) => patchTicket({ assignedToId: e.target.value })} style={{ ...inputStyle, maxWidth: 170 }}>
                  <option value="">Unassigned</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value="" onChange={(e) => { const tag = e.target.value; if (tag && !selected.tags.includes(tag)) patchTicket({ tags: [...selected.tags, tag] }); }} style={{ ...inputStyle, maxWidth: 150 }}>
                  <option value="">+ Add tag</option>
                  {config?.tags.filter((tg) => tg.enabled && !selected.tags.includes(tg.name)).map((tg) => <option key={tg.name} value={tg.name}>{tg.name}</option>)}
                </select>
              </div>

              {selected.tags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {selected.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 12, background: "#F1F5F9", color: "#475569", display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {tag}
                      <button onClick={() => patchTicket({ tags: selected.tags.filter((x) => x !== tag) })} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 11, color: "#B91C1C", padding: 0 }} aria-label={`Remove tag ${tag}`}>✕</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Conversation links */}
              {selected.conversationIds && selected.conversationIds.length > 0 && (
                <div style={{ marginBottom: 12, fontSize: 12 }}>
                  <b style={{ color: "var(--purple, #2A0F3A)" }}>Linked conversations:</b>{" "}
                  {selected.conversationIds.map((cid) => (
                    <button key={cid} onClick={() => onNavigateToInbox?.()} style={{ margin: "0 6px 4px 0", padding: "3px 9px", borderRadius: 6, border: "1px solid #7DD3FC", background: "#F0F9FF", color: "#0369A1", fontSize: 11, cursor: "pointer" }}>
                      💬 {cid.slice(0, 16)}… ↗
                    </button>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {selected.attachments && selected.attachments.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <b style={{ fontSize: 12, color: "var(--purple, #2A0F3A)" }}>Attachments:</b>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    {selected.attachments.map((a) => (
                      <a key={a.id} href={`/api/support/attachment/${a.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, padding: "5px 10px", background: "#fff", border: "1px solid var(--line)", borderRadius: 6, color: "var(--purple, #2A0F3A)", textDecoration: "none" }}>
                        📎 {a.filename} <span style={{ color: "var(--muted)" }}>({Math.round(a.size / 1024)}kb)</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {timeline.map((e) => {
                  if (e.type === "internal_note") {
                    return (
                      <div key={e.id} style={{ background: "#FEF3C7", border: "1px dashed #D97706", borderRadius: 8, padding: "9px 13px" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>🔒 INTERNAL — {e.actorName} · {fmt(e.createdAt)}</div>
                        <div style={{ fontSize: 12, color: "#78350F", whiteSpace: "pre-wrap" }}>{e.content}</div>
                      </div>
                    );
                  }
                  const isEvent = ["ticket_created", "status_changed", "priority_changed", "assigned", "resolved", "reopened", "merged", "conversation_linked", "attachment_added"].includes(e.type);
                  if (isEvent) {
                    return (
                      <div key={e.id} style={{ display: "flex", justifyContent: "center" }}>
                        <span style={{ background: "#E2E8F0", borderRadius: 12, padding: "3px 12px", fontSize: 10.5, color: "#475569" }}>
                          {e.content || `${e.type.replace(/_/g, " ")}${e.oldValue ? `: ${e.oldValue} → ${e.newValue}` : ""}`} · {fmt(e.createdAt)}
                        </span>
                      </div>
                    );
                  }
                  const fromCustomer = e.actorRole === "customer";
                  return (
                    <div key={e.id} style={{ display: "flex", flexDirection: "column", alignItems: fromCustomer ? "flex-start" : "flex-end" }}>
                      <span style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 2 }}>
                        {fromCustomer ? selected.customerName : `${e.actorName} (Support)`} · {fmt(e.createdAt)}
                      </span>
                      <div style={{
                        maxWidth: "80%", padding: "9px 13px", borderRadius: fromCustomer ? "12px 12px 12px 2px" : "12px 12px 2px 12px",
                        background: fromCustomer ? "#fff" : "var(--purple, #2A0F3A)", color: fromCustomer ? "var(--ink, #222)" : "#fff",
                        border: fromCustomer ? "1px solid var(--line)" : "none", fontSize: 12.5, whiteSpace: "pre-wrap",
                      }}>
                        {e.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer: reply / internal note / resolution */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {chip(!isInternalNote, "💬 Customer Reply", () => setIsInternalNote(false))}
                  {chip(isInternalNote, "🔒 Internal Note", () => setIsInternalNote(true), "#D97706")}
                  {chip(showResolution, "✅ Resolve…", () => setShowResolution((v) => !v), "#15803D")}
                </div>
                {showResolution ? (
                  <div>
                    <textarea placeholder="Resolution summary — shown to the customer and stored on the ticket…" value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
                    <button onClick={submitResolution} disabled={!resolutionText.trim()} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: resolutionText.trim() ? "#15803D" : "#CBD5E1", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      Mark Resolved
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                      placeholder={isInternalNote ? "Private note — NEVER visible to the customer…" : "Reply to the customer…"}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                    <button onClick={sendReply} disabled={!replyText.trim() || sending} style={{ padding: "0 16px", borderRadius: 6, border: "none", background: isInternalNote ? "#D97706" : "var(--purple, #2A0F3A)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", height: "auto" }}>
                      {sending ? "…" : isInternalNote ? "Save Note" : "Send"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Create-from-chat modal ═══ */}
      {showCreateFromChat && (
        <div
          onClick={() => setShowCreateFromChat(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, width: "min(680px, 96vw)", maxHeight: "90vh", overflowY: "auto", padding: 22 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <b style={{ fontSize: 15, color: "var(--purple, #2A0F3A)" }}>Create Ticket from Conversation</b>
              <button onClick={() => setShowCreateFromChat(false)} style={{ border: "none", background: "none", fontSize: 17, cursor: "pointer" }} aria-label="Close">✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 3 }}>Conversation *</label>
                <select value={selectedConvId} onChange={(e) => loadConversationForTicket(e.target.value)} style={inputStyle} data-testid="conversation-select">
                  <option value="">Select a conversation…</option>
                  {conversations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerName} — {(c.lastMessage?.text || "").slice(0, 40)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 3 }}>Category *</label>
                <select value={createState.category} onChange={(e) => setCreateState((s) => ({ ...s, category: e.target.value }))} style={inputStyle}>
                  <option value="">Select…</option>
                  {config?.categories.filter((c) => c.enabled).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 3 }}>Subject *</label>
              <input value={createState.subject} onChange={(e) => setCreateState((s) => ({ ...s, subject: e.target.value }))} style={inputStyle} maxLength={200} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 3 }}>Description (prefilled from chat — editable) *</label>
              <textarea value={createState.description} onChange={(e) => setCreateState((s) => ({ ...s, description: e.target.value }))} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 3 }}>Priority</label>
                <select value={createState.priority} onChange={(e) => setCreateState((s) => ({ ...s, priority: e.target.value }))} style={inputStyle}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 3 }}>Order reference</label>
                <input value={createState.orderId} onChange={(e) => setCreateState((s) => ({ ...s, orderId: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {/* Attachment selection from the conversation */}
            {selectedConvId && convMessages.some((m) => m.attachments?.length) && (
              <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <b style={{ fontSize: 12, color: "#0369A1" }}>Attach conversation media (securely linked, not duplicated):</b>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {convMessages.flatMap((m) => (m.attachments || []).map((a) => (
                    <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedAttIds.includes(a.id)}
                        onChange={() => setSelectedAttIds((prev) => (prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]))}
                      />
                      📎 {a.filename} <span style={{ color: "var(--muted)" }}>({a.mimeType}, {Math.round(a.size / 1024)}kb)</span>
                    </label>
                  )))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreateFromChat(false)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--line)", background: "#fff", fontSize: 12.5, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={submitCreateFromChat}
                disabled={!selectedConvId || !createState.subject.trim() || !createState.description.trim() || !createState.category || creating}
                style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: creating ? "#94A3B8" : "var(--purple, #2A0F3A)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: creating ? "wait" : "pointer" }}
              >
                {creating ? "Creating…" : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
