"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  SupportConversation,
  SupportMessage,
  ConversationStatus,
  SupportFileAttachment,
} from "@/lib/support/support-types";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

interface StagedAttachment {
  file: File;
  previewUrl: string;
  type: "image" | "video";
  name: string;
  size: number;
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN SUPPORT INBOX & CONVERSATION COMMAND CONSOLE
   • Real-Time Server-Sent Events (SSE) synchronization
   • Desktop 3-pane layout & Mobile-first single-pane drawer navigation
   • Human takeover, AI handoff, agent assignment, status management
   • Customer context, order lookups, and private internal notes
   • Media support: customer & admin image & video exchange
   ═══════════════════════════════════════════════════════════════ */

interface CustomerContextData {
  conversation?: SupportConversation;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    createdAt: string;
  } | null;
  recentOrders?: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
    itemsCount: number;
  }>;
  totalOrdersCount?: number;
}

export default function AdminSupportInbox({
  currentUser,
}: {
  currentUser?: { name?: string; role?: string; email?: string; id?: string };
}) {
  // State: Conversation List
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [humanOnly, setHumanOnly] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State: Active Conversation Details
  const [activeConversation, setActiveConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [customerContext, setCustomerContext] = useState<CustomerContextData | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);

  // Composer
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string; type: "image" | "video" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staff / Agents List for assignment
  const [agents, setAgents] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);

  // Modals & Mobile Drawers
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [showMobileContext, setShowMobileContext] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Create-ticket-from-chat modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketModalMsg, setTicketModalMsg] = useState("");
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", category: "", priority: "NORMAL", orderId: "" });
  const [ticketCategories, setTicketCategories] = useState<Array<{ name: string }>>([]);
  const [ticketAttIds, setTicketAttIds] = useState<string[]>([]);
  const [ticketCreating, setTicketCreating] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  const openTicketModal = async () => {
    if (!activeConversation) return;
    const lastCustomer = [...messages].reverse().find((m) => m.sender === "customer");
    const excerpt = messages
      .filter((m) => !m.isInternal && (m.sender === "customer" || m.sender === "agent"))
      .slice(-4)
      .map((m) => `${m.sender === "customer" ? activeConversation.customerName : "Support"}: ${m.content}`)
      .join("\n");
    setTicketForm({
      subject: activeConversation.relevantOrderId ? `Issue with order ${activeConversation.relevantOrderId}` : lastCustomer?.content?.slice(0, 80) || `Support follow-up — ${activeConversation.customerName}`,
      description: excerpt || "",
      category: "",
      priority: "NORMAL",
      orderId: activeConversation.relevantOrderId || "",
    });
    // Collect conversation attachments for selection
    const atts: Array<{ id: string; filename: string }> = [];
    for (const m of messages) {
      for (const a of m.attachments || []) atts.push({ id: a.id, filename: a.filename });
    }
    setTicketAttIds([]);
    setTicketModalMsg("");
    setShowTicketModal(true);
    setCreatedTicketNumber(null);
    if (ticketCategories.length === 0) {
      fetch("/api/admin/support/tickets")
        .then((r) => r.json())
        .then((d) => {
          if (d.config?.categories) setTicketCategories(d.config.categories.filter((c: { enabled: boolean }) => c.enabled));
        })
        .catch(() => {});
    }
  };

  const submitTicketFromChat = async () => {
    if (!selectedId || ticketCreating) return;
    setTicketCreating(true);
    try {
      const res = await fetch("/api/admin/support/tickets/from-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          subject: ticketForm.subject,
          description: ticketForm.description,
          category: ticketForm.category,
          priority: ticketForm.priority,
          orderId: ticketForm.orderId,
          attachmentIds: ticketAttIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setCreatedTicketNumber(data.ticket.ticketNumber);
        setTicketModalMsg("");
        // Refresh thread so the system link message appears
        loadConversationDetails(selectedId);
      } else {
        setTicketModalMsg(data.error || "Failed to create ticket.");
      }
    } catch {
      setTicketModalMsg("Network error.");
    }
    setTicketCreating(false);
  };

  // Fetch available agents for assignment
  useEffect(() => {
    fetch("/api/admin/employees")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.employees)) {
          setAgents(d.employees.map((e: any) => ({ id: e.id, name: e.name, email: e.email, role: "employee" })));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (humanOnly) params.set("humanRequested", "true");
      if (unreadOnly) params.set("unreadOnly", "true");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/support/conversations?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (!selectedId && data.conversations.length > 0) {
          setSelectedId(data.conversations[0].id);
        }
      }
    } catch {}
    setLoadingList(false);
  }, [statusFilter, humanOnly, unreadOnly, searchQuery, selectedId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load active conversation messages & context
  const loadConversationDetails = useCallback(async (id: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
        setCustomerContext(data.context || null);

        // Update list to clear unread locally
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadAdminCount: 0 } : c))
        );
      }
    } catch {}
    setLoadingThread(false);
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadConversationDetails(selectedId);
    }
  }, [selectedId, loadConversationDetails]);

  // Connect to Admin SSE stream for real-time live events
  useEffect(() => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    try {
      const es = new EventSource("/api/admin/support/stream");
      sseRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "message:created" && data.message) {
            // If message is for currently active conversation, append it
            if (data.conversationId === selectedId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
            }

            // Update conversation list item last message
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === data.conversationId);
              if (idx !== -1) {
                const updated = [...prev];
                const item = { ...updated[idx] };
                item.lastMessage = {
                  text: data.message.content,
                  sender: data.message.sender,
                  timestamp: data.message.createdAt,
                };
                item.updatedAt = data.message.createdAt;
                if (data.conversationId !== selectedId && data.message.sender === "customer") {
                  item.unreadAdminCount = (item.unreadAdminCount || 0) + 1;
                }
                updated.splice(idx, 1);
                return [item, ...updated];
              } else {
                // Fetch list if new conversation appeared
                fetchConversations();
                return prev;
              }
            });
          } else if (data.type === "conversation:updated" && data.conversation) {
            setConversations((prev) =>
              prev.map((c) => (c.id === data.conversation.id ? data.conversation : c))
            );
            if (selectedId === data.conversation.id) {
              setActiveConversation(data.conversation);
            }
          } else if (data.type === "takeover:changed" && data.conversation) {
            if (selectedId === data.conversationId) {
              setActiveConversation(data.conversation);
            }
          } else if (data.type === "status:changed" && data.conversation) {
            if (selectedId === data.conversationId) {
              setActiveConversation(data.conversation);
            }
          }
        } catch {}
      };

      es.onerror = () => {
        es.close();
      };
    } catch {}

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [selectedId, fetchConversations]);

  // Periodic poll fallback every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // File selection handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadError("");

    const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedVideos = ["video/mp4", "video/webm"];
    const newStaged: StagedAttachment[] = [];

    for (const file of files) {
      const isImg = allowedImages.includes(file.type.toLowerCase());
      const isVid = allowedVideos.includes(file.type.toLowerCase());

      if (!isImg && !isVid) {
        setUploadError(`"${file.name}" is not a supported format. Please select JPG, PNG, WebP, GIF, MP4, or WebM.`);
        continue;
      }

      const maxMb = isImg ? 10 : 50;
      const maxSize = maxMb * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError(`"${file.name}" exceeds the ${maxMb}MB size limit.`);
        continue;
      }

      newStaged.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type: isImg ? "image" : "video",
        name: file.name,
        size: file.size,
      });
    }

    if (newStaged.length > 0) {
      setStagedAttachments((prev) => [...prev, ...newStaged]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeStagedAttachment = (index: number) => {
    setStagedAttachments((prev) => {
      const item = prev[index];
      if (item?.previewUrl) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {}
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Send message or internal note
  const handleSendMessage = async () => {
    const hasText = Boolean(replyText.trim());
    const hasMedia = stagedAttachments.length > 0;
    if ((!hasText && !hasMedia) || !selectedId || sending) return;

    setSending(true);
    setUploadError("");
    const currentStaged = [...stagedAttachments];

    try {
      // Upload staged attachments
      const uploadedAttachments: SupportFileAttachment[] = [];
      for (const staged of currentStaged) {
        try {
          const fd = new FormData();
          fd.append("file", staged.file);
          fd.append("conversationId", selectedId);

          const uRes = await fetch("/api/support/upload", {
            method: "POST",
            body: fd,
          });
          const uData = await uRes.json();
          if (uData.success && uData.attachment) {
            uploadedAttachments.push(uData.attachment);
          } else if (uData.error) {
            setUploadError(uData.error);
          }
        } catch {
          setUploadError("Failed to upload attachment.");
        } finally {
          try {
            URL.revokeObjectURL(staged.previewUrl);
          } catch {}
        }
      }

      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(selectedId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText.trim(),
          isInternal: isInternalNote,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        if (data.conversation) {
          setActiveConversation(data.conversation);
        }
        setReplyText("");
        setStagedAttachments([]);
        textareaRef.current?.focus();
      }
    } catch {
      setUploadError("Failed to send message.");
    }
    setSending(false);
  };

  // Take Over Chat Action
  const handleTakeover = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(selectedId)}/takeover`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
        if (data.systemMsg) {
          setMessages((prev) => [...prev, data.systemMsg]);
        }
      }
    } catch {}
  };

  // Return to AI Action
  const handleReturnToAi = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(selectedId)}/return-ai`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
        if (data.systemMsg) {
          setMessages((prev) => [...prev, data.systemMsg]);
        }
      }
    } catch {}
  };

  // Status Change Action
  const handleStatusChange = async (newStatus: ConversationStatus) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(selectedId)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
        if (data.systemMsg) {
          setMessages((prev) => [...prev, data.systemMsg]);
        }
      }
    } catch {}
  };

  // Assign Agent Action
  const handleAssignAgent = async (agentId: string) => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${encodeURIComponent(selectedId)}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAgentId: agentId }),
      });
      const data = await res.json();
      if (data.conversation) {
        setActiveConversation(data.conversation);
      }
    } catch {}
  };

  // View Order Details Modal Action
  const handleViewOrder = async (orderId: string) => {
    if (!selectedId) return;
    setLoadingOrder(true);
    try {
      const res = await fetch(
        `/api/admin/support/conversations/${encodeURIComponent(selectedId)}/order?orderId=${encodeURIComponent(orderId)}`
      );
      const data = await res.json();
      if (data.order) {
        setViewingOrder(data.order);
      }
    } catch {}
    setLoadingOrder(false);
  };

  // Helper formatting
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 40px)",
        background: "#FAF8F5",
        fontFamily: "var(--font-geist, sans-serif)",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid rgba(42,15,58,0.12)",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .qc-support-desktop-panel { display: none !important; }
          .qc-support-mobile-show { display: block !important; }
        }
        @media (min-width: 901px) {
          .qc-support-desktop-panel { display: flex !important; }
          .qc-support-mobile-show { display: none !important; }
        }
        .qc-conv-item:hover {
          background: rgba(42,15,58,0.04) !important;
        }
      `}</style>

      {/* Top Header Bar */}
      <header
        style={{
          padding: "12px 20px",
          background: "linear-gradient(135deg, #1E1638 0%, #2A0F3A 100%)",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Clinical Support Command Desk
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#D7CDDD" }}>
              Unified Real-Time Inbox · Live Patient Care &amp; Formulation Inquiries
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22C55E",
                display: "inline-block",
              }}
            />
            <span style={{ color: "#E9CA91", fontWeight: 600 }}>Active Agent:</span>
            <span>{currentUser?.name || "Support Team"}</span>
          </div>
        </div>
      </header>

      {/* 3-Pane Workspace (Desktop) & Switchable View (Mobile) */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ═══════════ LEFT PANE: CONVERSATIONS LIST ═══════════ */}
        <aside
          style={{
            width: 340,
            flexShrink: 0,
            background: "#FFFFFF",
            borderRight: "1px solid rgba(42,15,58,0.1)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          className={mobileView === "thread" ? "qc-support-desktop-panel" : ""}
        >
          {/* Search Box */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(42,15,58,0.08)" }}>
            <input
              type="text"
              placeholder="Search by customer, phone, order, ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(42,15,58,0.15)",
                fontSize: 12.5,
                outline: "none",
                background: "#FAF8F5",
              }}
            />

            {/* Quick Status Filter Pills */}
            <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", paddingBottom: 2 }}>
              {[
                { id: "all", label: "All" },
                { id: "open", label: "Open" },
                { id: "waiting_support", label: "Needs Help" },
                { id: "resolved", label: "Resolved" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 12,
                    border: "none",
                    background: statusFilter === pill.id ? "var(--purple, #2A0F3A)" : "#F1F5F9",
                    color: statusFilter === pill.id ? "#fff" : "#475569",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pill.label}
                </button>
              ))}

              <button
                onClick={() => setHumanOnly(!humanOnly)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 12,
                  border: "none",
                  background: humanOnly ? "#F59E0B" : "#FEF3C7",
                  color: humanOnly ? "#fff" : "#92400E",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ⚡ Human Req
              </button>
            </div>
          </div>

          {/* Conversations Items */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingList ? (
              <div style={{ padding: 24, textAlign: "center", color: "#64748B", fontSize: 13 }}>
                Loading conversations…
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 13 }}>
                No conversations match current filters.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === selectedId;
                const isHuman = c.handlingMode === "human";

                return (
                  <div
                    key={c.id}
                    data-testid={`conversation-item-${c.id}`}
                    onClick={() => {
                      setSelectedId(c.id);
                      setMobileView("thread");
                    }}
                    className="qc-conv-item"
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(42,15,58,0.06)",
                      cursor: "pointer",
                      background: isSelected ? "rgba(42,15,58,0.06)" : "#FFFFFF",
                      borderLeft: isSelected ? "4px solid var(--purple, #2A0F3A)" : "4px solid transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <b style={{ fontSize: 13, color: "#1E293B" }}>{c.customerName}</b>
                        {c.unreadAdminCount > 0 && (
                          <span
                            style={{
                              background: "#EF4444",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: 10,
                            }}
                          >
                            {c.unreadAdminCount}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 10.5, color: "#94A3B8" }}>
                        {formatTime(c.lastMessage?.timestamp || c.updatedAt)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "4px 0 6px",
                        fontSize: 12,
                        color: "#64748B",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.lastMessage?.text || "Started conversation"}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: isHuman ? "#FEF3C7" : "#EFF6FF",
                          color: isHuman ? "#92400E" : "#1D4ED8",
                          textTransform: "uppercase",
                        }}
                      >
                        {isHuman ? "Human" : "AI"}
                      </span>

                      {c.humanRequested && (
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#FEE2E2",
                            color: "#DC2626",
                            textTransform: "uppercase",
                          }}
                        >
                          Alert 🚨
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background:
                            c.status === "resolved"
                              ? "#DCFCE7"
                              : c.status === "waiting_support"
                              ? "#FEF3C7"
                              : "#F1F5F9",
                          color:
                            c.status === "resolved"
                              ? "#15803D"
                              : c.status === "waiting_support"
                              ? "#B45309"
                              : "#475569",
                          textTransform: "capitalize",
                        }}
                      >
                        {c.status.replace("_", " ")}
                      </span>

                      {c.relevantOrderId && (
                        <span style={{ fontSize: 10, color: "#997B4D", fontWeight: 600 }}>
                          #{c.relevantOrderId}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ═══════════ CENTER PANE: CHAT THREAD ═══════════ */}
        <section
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#FAF8F5",
            overflow: "hidden",
          }}
          className={mobileView === "list" ? "qc-support-desktop-panel" : ""}
        >
          {selectedId && activeConversation ? (
            <>
              {/* Thread Header & Command Controls */}
              <div
                style={{
                  padding: "10px 16px",
                  background: "#FFFFFF",
                  borderBottom: "1px solid rgba(42,15,58,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    data-testid="mobile-back-button"
                    onClick={() => setMobileView("list")}
                    style={{
                      padding: "6px 10px",
                      background: "#F1F5F9",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "none",
                    }}
                    className="qc-support-mobile-show"
                  >
                    ← All Chats
                  </button>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <b style={{ fontSize: 14, color: "#2A0F3A" }}>{activeConversation.customerName}</b>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: activeConversation.handlingMode === "human" ? "#FEF3C7" : "#E0E7FF",
                          color: activeConversation.handlingMode === "human" ? "#92400E" : "#3730A3",
                        }}
                      >
                        {activeConversation.handlingMode === "human" ? "Human Handling" : "AI Mode"}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748B" }}>
                      ID: {activeConversation.id} · Channel: Website Chat
                    </span>
                  </div>
                </div>

                {/* Tactical Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {/* Takeover / Return to AI */}
                  {activeConversation.handlingMode === "ai" ? (
                    <button
                      type="button"
                      data-testid="takeover-button"
                      onClick={handleTakeover}
                      style={{
                        padding: "6px 12px",
                        background: "var(--purple, #2A0F3A)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>⚡</span> Take Over Chat
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid="return-ai-button"
                      onClick={handleReturnToAi}
                      style={{
                        padding: "6px 12px",
                        background: "#E2E8F0",
                        color: "#334155",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>🤖</span> Return to AI
                    </button>
                  )}

                  {/* Status Dropdown */}
                  <select
                    data-testid="status-select"
                    value={activeConversation.status}
                    onChange={(e) => handleStatusChange(e.target.value as ConversationStatus)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(42,15,58,0.15)",
                      background: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#2A0F3A",
                      cursor: "pointer",
                    }}
                  >
                    <option value="open">Status: Open</option>
                    <option value="waiting_customer">Waiting on Customer</option>
                    <option value="waiting_support">Waiting on Support</option>
                    <option value="resolved">Mark Resolved</option>
                    <option value="closed">Close</option>
                  </select>

                  {/* Assign Agent Dropdown */}
                  <select
                    value={activeConversation.assignedTo?.id || "unassigned"}
                    onChange={(e) => handleAssignAgent(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(42,15,58,0.15)",
                      background: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#2A0F3A",
                      cursor: "pointer",
                    }}
                  >
                    <option value="unassigned">Assigned: None</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>

                  {/* Create Ticket from this conversation */}
                  {activeConversation.ticketNumber ? (
                    <button
                      type="button"
                      data-testid="view-linked-ticket"
                      onClick={() => window.open("/admin/support?tab=support-tickets", "_blank")}
                      style={{
                        padding: "6px 12px",
                        background: "#F0FDF4",
                        color: "#15803D",
                        border: "1px solid #BBF7D0",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      🎫 {activeConversation.ticketNumber}
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid="create-ticket-from-chat"
                      onClick={openTicketModal}
                      style={{
                        padding: "6px 12px",
                        background: "#FFF7E6",
                        color: "#B45309",
                        border: "1px solid #FDE68A",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      🎫 Create Ticket
                    </button>
                  )}

                  {/* Mobile Context Drawer Trigger */}
                  <button
                    type="button"
                    data-testid="mobile-context-toggle"
                    onClick={() => setShowMobileContext(true)}
                    style={{
                      padding: "6px 10px",
                      background: "#FAF8F5",
                      border: "1px solid rgba(42,15,58,0.15)",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                      display: "none",
                    }}
                    className="qc-support-mobile-show"
                  >
                    ℹ️ Context
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {loadingThread ? (
                  <div style={{ textAlign: "center", padding: 30, color: "#64748B", fontSize: 13 }}>
                    Loading conversation messages…
                  </div>
                ) : (
                  messages.map((m) => {
                    if (m.isInternal) {
                      // Internal Note Box
                      return (
                        <div
                          key={m.id}
                          style={{
                            background: "#FEF3C7",
                            border: "1px dashed #D97706",
                            borderRadius: 8,
                            padding: "10px 14px",
                            margin: "4px 0",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E" }}>
                              🔒 {m.senderName}
                            </span>
                            <span style={{ fontSize: 10, color: "#B45309" }}>{formatTime(m.createdAt)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12.5, color: "#78350F", whiteSpace: "pre-wrap" }}>
                            {m.content}
                          </p>
                        </div>
                      );
                    }

                    if (m.sender === "system") {
                      return (
                        <div key={m.id} style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                          <span
                            style={{
                              background: "#E2E8F0",
                              color: "#475569",
                              fontSize: 11,
                              padding: "4px 12px",
                              borderRadius: 12,
                            }}
                          >
                            {m.content}
                          </span>
                        </div>
                      );
                    }

                    const isAgent = m.sender === "agent";
                    const isAi = m.sender === "ai";
                    const isCustomer = m.sender === "customer";

                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isAgent ? "flex-end" : "flex-start",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: isAgent ? "var(--purple, #2A0F3A)" : isAi ? "#0284C7" : "#475569",
                            marginBottom: 2,
                            padding: "0 4px",
                          }}
                        >
                          {isAgent
                            ? `You (${m.senderName})`
                            : isAi
                            ? "🤖 Dr. Queens AI"
                            : m.senderName || "Customer"} · {formatTime(m.createdAt)}
                        </span>

                        <div
                          style={{
                            maxWidth: "75%",
                            padding: "10px 14px",
                            borderRadius: isAgent ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                            background: isAgent ? "var(--purple, #2A0F3A)" : isAi ? "#F0F9FF" : "#FFFFFF",
                            color: isAgent ? "#FFFFFF" : "#1E293B",
                            fontSize: 13,
                            lineHeight: 1.55,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                            border: isAgent ? "none" : "1px solid rgba(42,15,58,0.08)",
                          }}
                        >
                          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>

                          {/* Attachments (Images & Videos) */}
                          {m.attachments && m.attachments.length > 0 && (
                            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                              {m.attachments.map((att) => {
                                const isImg = att.mimeType.startsWith("image/");
                                const isVid = att.mimeType.startsWith("video/");
                                return (
                                  <div
                                    key={att.id || att.url}
                                    style={{
                                      borderRadius: 8,
                                      overflow: "hidden",
                                      background: isAgent ? "rgba(255,255,255,0.15)" : "#F8FAFC",
                                      border: isAgent ? "1px solid rgba(255,255,255,0.25)" : "1px solid #E2E8F0",
                                      padding: 6,
                                    }}
                                  >
                                    {isImg && (
                                      <div
                                        onClick={() => setPreviewMedia({ url: att.url, title: att.filename, type: "image" })}
                                        style={{ cursor: "pointer", position: "relative" }}
                                        title="Click to view full image"
                                      >
                                        <img
                                          src={att.url}
                                          alt={att.filename}
                                          style={{
                                            width: "100%",
                                            maxHeight: 260,
                                            objectFit: "cover",
                                            borderRadius: 6,
                                            display: "block",
                                          }}
                                          loading="lazy"
                                        />
                                        <div
                                          style={{
                                            position: "absolute",
                                            bottom: 4,
                                            right: 4,
                                            background: "rgba(0,0,0,0.65)",
                                            color: "#fff",
                                            fontSize: 10,
                                            padding: "2px 6px",
                                            borderRadius: 4,
                                            pointerEvents: "none",
                                          }}
                                        >
                                          🔍 Enlarge
                                        </div>
                                      </div>
                                    )}
                                    {isVid && (
                                      <video
                                        src={att.url}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        style={{
                                          width: "100%",
                                          maxHeight: 260,
                                          borderRadius: 6,
                                          display: "block",
                                          background: "#000",
                                        }}
                                      />
                                    )}
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginTop: 4,
                                        fontSize: 10.5,
                                        opacity: 0.9,
                                      }}
                                    >
                                      <span
                                        style={{
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          maxWidth: 180,
                                        }}
                                        title={att.filename}
                                      >
                                        {att.filename}
                                      </span>
                                      <span>{formatBytes(att.size)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {m.products && m.products.length > 0 && (
                            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                              {m.products.map((p) => (
                                <div
                                  key={p.slug}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "6px 8px",
                                    background: "#fff",
                                    borderRadius: 6,
                                    border: "1px solid #E2E8F0",
                                  }}
                                >
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1E293B" }}>
                                      {p.name}
                                    </span>
                                    <span style={{ display: "block", fontSize: 10, color: "#64748B" }}>
                                      ₹{p.price}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderTop: "1px solid rgba(42,15,58,0.1)",
                  padding: "12px 16px",
                  flexShrink: 0,
                }}
              >
                {/* Mode Selector Tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button
                    type="button"
                    data-testid="reply-mode-toggle"
                    onClick={() => setIsInternalNote(false)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      border: "none",
                      background: !isInternalNote ? "var(--purple, #2A0F3A)" : "#F1F5F9",
                      color: !isInternalNote ? "#fff" : "#475569",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    💬 Reply to Customer
                  </button>
                  <button
                    type="button"
                    data-testid="internal-note-toggle"
                    onClick={() => setIsInternalNote(true)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      border: "none",
                      background: isInternalNote ? "#D97706" : "#FEF3C7",
                      color: isInternalNote ? "#fff" : "#92400E",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🔒 Internal Note (Private)
                  </button>

                  {/* Canned Shortcuts */}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                    {[
                      { label: "Track", text: "You can track your dispatch directly using your Order ID on our tracking page." },
                      { label: "Cold-Chain", text: "Queens Care formulations are dispatched in certified temperature-monitored shippers." },
                    ].map((can, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReplyText((prev) => (prev ? `${prev} ${can.text}` : can.text))}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid rgba(42,15,58,0.15)",
                          background: "#fff",
                          fontSize: 10,
                          cursor: "pointer",
                          color: "#64748B",
                        }}
                      >
                        +{can.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Error Banner */}
                {uploadError && (
                  <div
                    style={{
                      background: "#FEF2F2",
                      color: "#B91C1C",
                      fontSize: 11,
                      padding: "6px 12px",
                      borderRadius: 6,
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #FCA5A5",
                    }}
                  >
                    <span>⚠️ {uploadError}</span>
                    <button
                      onClick={() => setUploadError("")}
                      style={{ background: "none", border: "none", color: "#B91C1C", cursor: "pointer", fontSize: 12 }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Staged Attachments Tray */}
                {stagedAttachments.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      overflowX: "auto",
                      padding: "8px 10px",
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    {stagedAttachments.map((att, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 8px",
                          background: "#fff",
                          border: "1px solid #CBD5E1",
                          borderRadius: 6,
                          fontSize: 11,
                          color: "#334155",
                          flexShrink: 0,
                        }}
                      >
                        {att.type === "image" ? (
                          <img
                            src={att.previewUrl}
                            alt={att.name}
                            style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4 }}
                          />
                        ) : (
                          <span style={{ fontSize: 16 }}>🎬</span>
                        )}
                        <span
                          style={{
                            maxWidth: 110,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={att.name}
                        >
                          {att.name}
                        </span>
                        <span style={{ fontSize: 9.5, color: "#64748B" }}>({formatBytes(att.size)})</span>
                        <button
                          type="button"
                          onClick={() => removeStagedAttachment(idx)}
                          style={{
                            border: "none",
                            background: "#E2E8F0",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            fontSize: 10,
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                            color: "#475569",
                          }}
                          aria-label="Remove attachment"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    data-testid="admin-attach-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid rgba(42,15,58,0.15)",
                      background: stagedAttachments.length > 0 ? "rgba(42,15,58,0.08)" : "#FAF8F5",
                      color: "var(--purple, #2A0F3A)",
                      cursor: sending ? "not-allowed" : "pointer",
                      fontSize: 15,
                      display: "grid",
                      placeItems: "center",
                      height: 44,
                      flexShrink: 0,
                    }}
                    aria-label="Attach photo or video"
                    title="Attach photo or video (Max 10MB image, 50MB video)"
                  >
                    📎
                  </button>

                  <textarea
                    ref={textareaRef}
                    data-testid="admin-composer-input"
                    rows={2}
                    placeholder={
                      isInternalNote
                        ? "Add private note for support staff only (never sent to customer)…"
                        : "Type your reply to the customer (Enter to send, Shift+Enter for newline)…"
                    }
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: isInternalNote ? "1px solid #D97706" : "1px solid rgba(42,15,58,0.15)",
                      background: isInternalNote ? "#FFFBEB" : "#FFFFFF",
                      fontSize: 13,
                      outline: "none",
                      resize: "none",
                      fontFamily: "inherit",
                    }}
                  />

                  <button
                    type="button"
                    data-testid="admin-send-button"
                    onClick={handleSendMessage}
                    disabled={(!replyText.trim() && stagedAttachments.length === 0) || sending}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 6,
                      border: "none",
                      background: isInternalNote ? "#D97706" : "var(--purple, #2A0F3A)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: (replyText.trim() || stagedAttachments.length > 0) && !sending ? "pointer" : "not-allowed",
                      opacity: (replyText.trim() || stagedAttachments.length > 0) && !sending ? 1 : 0.6,
                      flexShrink: 0,
                      height: 44,
                    }}
                  >
                    {sending ? "Sending…" : isInternalNote ? "Save Note" : "Send Reply →"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#94A3B8" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>💬</span>
                <p style={{ margin: 0, fontSize: 14 }}>Select a conversation from the left to begin support.</p>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════ RIGHT PANE: CUSTOMER CONTEXT & RECENT ORDERS (Desktop) ═══════════ */}
        <aside
          style={{
            width: 320,
            flexShrink: 0,
            background: "#FFFFFF",
            borderLeft: "1px solid rgba(42,15,58,0.1)",
            padding: "16px",
            overflowY: "auto",
          }}
          className="qc-support-desktop-panel"
        >
          {customerContext && activeConversation ? (
            <div>
              <h3 style={{ margin: "0 0 14px", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "#997B4D" }}>
                Customer Profile
              </h3>

              <div
                style={{
                  background: "#FAF8F5",
                  padding: 12,
                  borderRadius: 6,
                  border: "1px solid rgba(42,15,58,0.08)",
                  marginBottom: 18,
                }}
              >
                <b style={{ fontSize: 14, color: "#2A0F3A", display: "block", marginBottom: 4 }}>
                  {activeConversation.customerName}
                </b>
                <span style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 2 }}>
                  ✉️ {activeConversation.customerEmail || "No email on record (Guest)"}
                </span>
                <span style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 6 }}>
                  📞 {activeConversation.customerPhone || "No phone provided"}
                </span>

                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: customerContext.customer ? "#DCFCE7" : "#F1F5F9",
                      color: customerContext.customer ? "#15803D" : "#64748B",
                    }}
                  >
                    {customerContext.customer ? "Registered Customer" : "Anonymous Guest"}
                  </span>
                </div>
              </div>

              {/* Order History */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "#475569" }}>
                    Recent Orders ({customerContext.totalOrdersCount || 0})
                  </h4>
                </div>

                {customerContext.recentOrders && customerContext.recentOrders.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {customerContext.recentOrders.map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          padding: "8px 10px",
                          background: "#FAF8F5",
                          borderRadius: 6,
                          border: "1px solid rgba(42,15,58,0.08)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <b style={{ fontSize: 12, color: "#2A0F3A" }}>{ord.id}</b>
                          <span style={{ display: "block", fontSize: 10.5, color: "#64748B" }}>
                            ₹{ord.total} · {ord.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewOrder(ord.id)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid rgba(42,15,58,0.15)",
                            background: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "var(--purple, #2A0F3A)",
                          }}
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>No recent orders found.</p>
                )}
              </div>

              {/* Visitor Metadata */}
              <div>
                <h4 style={{ margin: "0 0 8px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "#475569" }}>
                  Session Insights
                </h4>
                <div style={{ fontSize: 11, color: "#64748B", display: "grid", gap: 4 }}>
                  <div>
                    <b>Current Page:</b> {activeConversation.metadata?.currentUrl || "/"}
                  </div>
                  <div>
                    <b>Visitor ID:</b> {activeConversation.visitorId}
                  </div>
                  <div>
                    <b>Created:</b> {new Date(activeConversation.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#94A3B8" }}>Select a conversation to view customer context.</p>
          )}
        </aside>
      </div>

      {/* ═══════════ CREATE TICKET FROM CHAT MODAL ═══════════ */}
      {showTicketModal && activeConversation && (
        <div
          onClick={() => setShowTicketModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, width: "min(620px, 96vw)", maxHeight: "90vh", overflowY: "auto", padding: 22, fontFamily: "inherit" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <b style={{ fontSize: 15, color: "#2A0F3A" }}>🎫 Create Support Ticket</b>
              <button onClick={() => setShowTicketModal(false)} style={{ border: "none", background: "none", fontSize: 17, cursor: "pointer" }} aria-label="Close">✕</button>
            </div>

            {createdTicketNumber ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <span style={{ fontSize: 34, display: "block", marginBottom: 8 }}>✅</span>
                <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#15803D" }}>Ticket {createdTicketNumber} created</p>
                <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "#64748B" }}>
                  It is linked to this conversation and visible to the customer in Account → Support Tickets.
                </p>
                <button
                  onClick={() => window.open("/admin/support?tab=support-tickets", "_blank")}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "var(--purple, #2A0F3A)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}
                >
                  Open Ticket Center ↗
                </button>
              </div>
            ) : (
              <>
                {ticketModalMsg && (
                  <div style={{ background: "#FEF2F2", color: "#B91C1C", fontSize: 12, padding: "8px 12px", borderRadius: 6, marginBottom: 10 }}>{ticketModalMsg}</div>
                )}
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                  Customer: <b>{activeConversation.customerName}</b>{activeConversation.customerEmail ? ` · ${activeConversation.customerEmail}` : ""}
                </div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>Subject *</label>
                <input
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
                  maxLength={200}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", fontSize: 12.5, marginBottom: 10, outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>Category *</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm((f) => ({ ...f, category: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", fontSize: 12.5, outline: "none", background: "#fff", boxSizing: "border-box" }}
                    >
                      <option value="">Select…</option>
                      {ticketCategories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm((f) => ({ ...f, priority: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", fontSize: 12.5, outline: "none", background: "#fff", boxSizing: "border-box" }}
                    >
                      {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>Description (prefilled from chat — editable) *</label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
                  rows={6}
                  maxLength={5000}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", fontSize: 12.5, marginBottom: 10, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>Order reference</label>
                <input
                  value={ticketForm.orderId}
                  onChange={(e) => setTicketForm((f) => ({ ...f, orderId: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", fontSize: 12.5, marginBottom: 12, outline: "none", boxSizing: "border-box" }}
                />
                {messages.some((m) => m.attachments?.length) && (
                  <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <b style={{ fontSize: 12, color: "#0369A1" }}>Attach conversation media (securely linked):</b>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      {messages.flatMap((m) => (m.attachments || []).map((a) => (
                        <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={ticketAttIds.includes(a.id)}
                            onChange={() => setTicketAttIds((prev) => (prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]))}
                          />
                          📎 {a.filename} <span style={{ color: "#64748B" }}>({a.mimeType})</span>
                        </label>
                      )))}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowTicketModal(false)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", background: "#fff", fontSize: 12.5, cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button
                    onClick={submitTicketFromChat}
                    disabled={ticketCreating || !ticketForm.subject.trim() || !ticketForm.description.trim() || !ticketForm.category}
                    style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: ticketCreating ? "#94A3B8" : "var(--purple, #2A0F3A)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: ticketCreating ? "wait" : "pointer" }}
                  >
                    {ticketCreating ? "Creating…" : "Create Ticket"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ MOBILE CONTEXT DRAWER / BOTTOM SHEET ═══════════ */}
      {showMobileContext && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setShowMobileContext(false)}
        >
          <div
            style={{
              width: "min(340px, 85vw)",
              height: "100%",
              background: "#fff",
              padding: 20,
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#2A0F3A" }}>Customer Context</h3>
              <button
                type="button"
                onClick={() => setShowMobileContext(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {activeConversation && customerContext && (
              <div>
                <b style={{ fontSize: 15, color: "#2A0F3A", display: "block", marginBottom: 4 }}>
                  {activeConversation.customerName}
                </b>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748B" }}>
                  {activeConversation.customerEmail || "Guest visitor"}
                </p>

                <h4 style={{ margin: "16px 0 8px", fontSize: 12, textTransform: "uppercase", color: "#997B4D" }}>
                  Orders
                </h4>
                {customerContext.recentOrders?.map((ord) => (
                  <div
                    key={ord.id}
                    style={{
                      padding: "8px",
                      border: "1px solid #E2E8F0",
                      borderRadius: 6,
                      marginBottom: 6,
                      fontSize: 12,
                    }}
                  >
                    <b>{ord.id}</b> — ₹{ord.total} ({ord.status})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ 1-CLICK ORDER DETAILS MODAL ═══════════ */}
      {viewingOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 10000,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
          onClick={() => setViewingOrder(null)}
        >
          <div
            style={{
              width: "min(500px, 95vw)",
              background: "#fff",
              borderRadius: 10,
              padding: 24,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2A0F3A" }}>
                Order Details: {viewingOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 10, fontSize: 13, color: "#1E293B" }}>
              <div>
                <b>Status:</b> <span style={{ textTransform: "capitalize" }}>{viewingOrder.status}</span>
              </div>
              <div>
                <b>Date:</b> {new Date(viewingOrder.createdAt).toLocaleString()}
              </div>
              <div>
                <b>Total Amount:</b> ₹{viewingOrder.total}
              </div>
              <div>
                <b>Payment Method:</b> {viewingOrder.paymentMethod || "COD"}
              </div>

              {viewingOrder.shipping && (
                <div style={{ background: "#FAF8F5", padding: 10, borderRadius: 6 }}>
                  <b style={{ display: "block", marginBottom: 4 }}>Shipping Address:</b>
                  <span>{viewingOrder.shipping.fullName}</span>
                  <br />
                  <span>{viewingOrder.shipping.address}, {viewingOrder.shipping.city}, {viewingOrder.shipping.state} - {viewingOrder.shipping.pincode}</span>
                </div>
              )}

              {Array.isArray(viewingOrder.lines) && (
                <div>
                  <b style={{ display: "block", margin: "10px 0 6px" }}>Line Items:</b>
                  {viewingOrder.lines.map((line: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: "1px solid #F1F5F9",
                        fontSize: 12,
                      }}
                    >
                      <span>{line.name || line.productId} (x{line.quantity})</span>
                      <b>₹{line.unitPrice ? line.unitPrice * line.quantity : "-"}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Media Modal */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "92vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "8px 4px",
                color: "#fff",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "80%",
                }}
              >
                {previewMedia.title}
              </span>
              <button
                onClick={() => setPreviewMedia(null)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  fontSize: 16,
                  display: "grid",
                  placeItems: "center",
                }}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            {previewMedia.type === "image" ? (
              <img
                src={previewMedia.url}
                alt={previewMedia.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: 8,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                }}
              />
            ) : (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                playsInline
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  borderRadius: 8,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
