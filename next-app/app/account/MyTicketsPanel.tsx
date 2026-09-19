"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   MY TICKETS — customer support portal.
   • List own tickets (server enforces ownership)
   • View timeline (internal notes never included server-side)
   • Reply / reopen / attach files (when Admin-enabled)
   • Create new ticket with category from Admin config
   ═══════════════════════════════════════════════════════════════ */

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  orderId?: string | null;
  attachments?: Array<{ id: string; filename: string; mimeType: string; size: number }>;
  resolutionVisibleToCustomer?: string | null;
  createdAt: string;
  updatedAt: string;
};

type TimelineEntry = {
  id: string;
  type: string;
  actorName: string;
  actorRole: string;
  content?: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  NEW: { bg: "#E0E7FF", fg: "#3730A3" },
  OPEN: { bg: "#DBEAFE", fg: "#1D4ED8" },
  IN_PROGRESS: { bg: "#FEF3C7", fg: "#92400E" },
  WAITING_FOR_CUSTOMER: { bg: "#FCE7F3", fg: "#9D174D" },
  WAITING_FOR_INTERNAL: { bg: "#F3E8FF", fg: "#6B21A8" },
  RESOLVED: { bg: "#DCFCE7", fg: "#15803D" },
  CLOSED: { bg: "#E2E8F0", fg: "#475569" },
};

function statusColor(status: string) {
  return STATUS_COLORS[status] || { bg: "#F1F5F9", fg: "#475569" };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function MyTicketsPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState({ subject: "", description: "", category: "", orderId: "" });
  const [createFiles, setCreateFiles] = useState<FileList | null>(null);
  const [creating, setCreating] = useState(false);
  const [attachEnabled] = useState(true);
  const fileInputKey = useRef(0);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        if (data.config?.categories) setCategories(data.config.categories.map((c: { name: string }) => c.name));
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTicket = async (t: Ticket) => {
    setSelected(t);
    setTimeline([]);
    setNotice("");
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(t.id)}`);
      const data = await res.json();
      if (data.ticket) {
        setSelected(data.ticket);
        setTimeline(data.timeline || []);
      } else if (data.error) {
        setNotice(data.error);
      }
    } catch {}
  };

  const sendReply = async (reopen = false) => {
    if (!selected || (!replyText.trim() && !replyFiles?.length) || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (replyText.trim()) fd.append("message", replyText.trim());
      if (reopen) fd.append("reopen", "true");
      if (replyFiles) for (const f of Array.from(replyFiles).slice(0, 5)) fd.append("files", f);
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(selected.id)}`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setReplyText("");
        setReplyFiles(null);
        fileInputKey.current++;
        if (data.timeline) setTimeline(data.timeline);
        if (data.ticket) setSelected(data.ticket);
        loadTickets();
      } else {
        setNotice(data.error || "Failed to send reply.");
      }
    } catch {
      setNotice("Network error. Please retry.");
    }
    setSending(false);
  };

  const createTicket = async () => {
    if (!createForm.subject.trim() || !createForm.description.trim() || !createForm.category || creating) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("subject", createForm.subject.trim());
      fd.append("description", createForm.description.trim());
      fd.append("category", createForm.category);
      if (createForm.orderId.trim()) fd.append("orderId", createForm.orderId.trim());
      if (createFiles) for (const f of Array.from(createFiles).slice(0, 5)) fd.append("files", f);
      const res = await fetch("/api/support/tickets", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setShowCreate(false);
        setCreateForm({ subject: "", description: "", category: "", orderId: "" });
        setCreateFiles(null);
        fileInputKey.current++;
        await loadTickets();
        openTicket(data.ticket);
      } else {
        setNotice(data.error || "Failed to create ticket.");
      }
    } catch {
      setNotice("Network error. Please retry.");
    }
    setCreating(false);
  };

  const canReply = selected && !["RESOLVED", "CLOSED"].includes(selected.status);
  const canReopen = selected && ["RESOLVED", "CLOSED"].includes(selected.status);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)",
    borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, font: "600 18px var(--font-display, serif)", color: "var(--purple, #240e35)" }}>Support Tickets</h2>
        <button
          onClick={() => { setShowCreate((v) => !v); setNotice(""); }}
          style={{
            padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "var(--purple, #240e35)", color: "#fff", fontSize: 13, fontWeight: 600,
          }}
        >
          {showCreate ? "Cancel" : "+ Create Support Ticket"}
        </button>
      </div>

      {notice && (
        <div style={{ padding: "10px 14px", background: "#FEF2F2", color: "#B91C1C", borderRadius: 8, fontSize: 12.5, marginBottom: 14 }}>{notice}</div>
      )}

      {showCreate && (
        <div style={{ background: "#FAF8F5", border: "1px solid var(--line, #e6e4ea)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
            <input placeholder="Subject *" value={createForm.subject} onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))} style={inputStyle} maxLength={200} />
            <select value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))} style={inputStyle}>
              <option value="">Select category *</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Order reference (optional)" value={createForm.orderId} onChange={(e) => setCreateForm((f) => ({ ...f, orderId: e.target.value }))} style={inputStyle} maxLength={100} />
          </div>
          <textarea placeholder="Describe your issue in detail… *" value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} rows={4} style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }} maxLength={5000} />
          {attachEnabled && (
            <input key={fileInputKey.current} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={(e) => setCreateFiles(e.target.files)} style={{ fontSize: 12, marginBottom: 12, display: "block" }} />
          )}
          <button
            onClick={createTicket}
            disabled={!createForm.subject.trim() || !createForm.description.trim() || !createForm.category || creating}
            style={{
              padding: "10px 22px", borderRadius: 8, border: "none",
              background: creating ? "#94A3B8" : "var(--gold, #d4af37)", color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: creating ? "wait" : "pointer",
            }}
          >
            {creating ? "Creating…" : "Submit Ticket"}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--muted, #666)", fontSize: 13 }}>Loading your tickets…</p>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted, #666)" }}>
          <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🎫</span>
          <p style={{ margin: 0, fontSize: 14 }}>No support tickets yet.</p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>Create one above, or start from the chat widget and attach your conversation.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tickets.map((t) => {
            const sc = statusColor(t.status);
            const isOpen = selected?.id === t.id;
            return (
              <div key={t.id} style={{ border: `1px solid ${isOpen ? "var(--gold, #d4af37)" : "var(--line, #e6e4ea)"}`, borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                <button
                  onClick={() => (isOpen ? setSelected(null) : openTicket(t))}
                  style={{ width: "100%", textAlign: "left", padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer", display: "block" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <b style={{ fontSize: 13, color: "var(--purple, #240e35)" }}>{t.ticketNumber}</b>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: sc.bg, color: sc.fg, textTransform: "capitalize" }}>
                          {t.status.replace(/_/g, " ").toLowerCase()}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--muted, #666)" }}>{t.category}</span>
                      </div>
                      <p style={{ margin: "6px 0 2px", fontSize: 13.5, fontWeight: 600, color: "var(--ink, #222)" }}>{t.subject}</p>
                      <span style={{ fontSize: 11.5, color: "var(--muted, #666)" }}>
                        Created {formatDate(t.createdAt)} · Updated {formatDate(t.updatedAt)}
                        {t.orderId ? ` · Order ${t.orderId}` : ""}
                        {t.attachments?.length ? ` · ${t.attachments.length} attachment(s)` : ""}
                      </span>
                    </div>
                    <span style={{ fontSize: 16, color: "var(--muted, #666)" }}>{isOpen ? "▾" : "▸"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--line, #e6e4ea)", padding: 16, background: "#FAF8F5" }}>
                    <div style={{ fontSize: 12.5, color: "var(--ink, #333)", whiteSpace: "pre-wrap", background: "#fff", border: "1px solid var(--line, #e6e4ea)", borderRadius: 8, padding: 12, marginBottom: 14 }}>
                      {t.description}
                    </div>

                    {/* Timeline */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                      {timeline.map((e) => {
                        const isCustomer = e.actorRole === "customer";
                        return (
                          <div key={e.id} style={{ display: "flex", flexDirection: "column", alignItems: isCustomer ? "flex-end" : "flex-start" }}>
                            <span style={{ fontSize: 10.5, color: "var(--muted, #666)", marginBottom: 2 }}>
                              {isCustomer ? "You" : `${e.actorName} (Support)`} · {formatDate(e.createdAt)}
                            </span>
                            <div style={{
                              maxWidth: "85%", padding: "9px 13px", borderRadius: isCustomer ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                              background: isCustomer ? "var(--purple, #240e35)" : "#fff", color: isCustomer ? "#fff" : "var(--ink, #222)",
                              fontSize: 12.5, border: isCustomer ? "none" : "1px solid var(--line, #e6e4ea)", whiteSpace: "pre-wrap",
                            }}>
                              {e.content}
                            </div>
                          </div>
                        );
                      })}
                      {timeline.length === 0 && <span style={{ fontSize: 12, color: "var(--muted, #666)" }}>No updates yet.</span>}
                    </div>

                    {t.resolutionVisibleToCustomer && (
                      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12.5, color: "#166534" }}>
                        <b>Resolution:</b> {t.resolutionVisibleToCustomer}
                      </div>
                    )}

                    {t.attachments && t.attachments.length > 0 && (
                      <div style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {t.attachments.map((a) => (
                          <a key={a.id} href={`/api/support/attachment/${a.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, padding: "5px 10px", background: "#fff", border: "1px solid var(--line, #e6e4ea)", borderRadius: 6, color: "var(--purple, #240e35)", textDecoration: "none" }}>
                            📎 {a.filename}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Reply / Reopen */}
                    {canReply && (
                      <div>
                        <textarea placeholder="Write your reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} maxLength={5000} />
                        {attachEnabled && (
                          <input key={`r-${fileInputKey.current}`} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={(e) => setReplyFiles(e.target.files)} style={{ fontSize: 12, marginBottom: 8, display: "block" }} />
                        )}
                        <button onClick={() => sendReply(false)} disabled={sending || (!replyText.trim() && !replyFiles?.length)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "var(--purple, #240e35)", color: "#fff", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                          {sending ? "Sending…" : "Send Reply"}
                        </button>
                      </div>
                    )}
                    {canReopen && (
                      <button onClick={() => sendReply(true)} disabled={sending} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid var(--gold, #d4af37)", background: "#fff", color: "var(--purple, #240e35)", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                        {sending ? "Working…" : "Reopen Ticket"}
                      </button>
                    )}
                    {!canReply && !canReopen && (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--muted, #666)" }}>This ticket is closed. Create a new ticket if you need further help.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
