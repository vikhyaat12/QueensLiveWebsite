"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type {
  SupportConversation,
  SupportMessage,
  SupportProductAttachment,
  SupportFileAttachment,
} from "@/lib/support/support-types";

/* ═══════════════════════════════════════════════════════════════
   QUEENS CARE UNIFIED CHATBOT & LIVE SUPPORT WIDGET
   Directly connected to Admin Support Console.
   Supports AI assistance, real-time agent replies via SSE,
   human handoff, unread badges, product cards, images and videos.
   ═══════════════════════════════════════════════════════════════ */

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

const SUGGESTED_QUESTIONS = [
  "What products do you have?",
  "Tell me about Liko Q",
  "How do I track my order?",
  "What is your return policy?",
];

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "vis-ssr";
  let visId = window.localStorage.getItem("qc_chat_visitor_id");
  if (!visId) {
    visId = `vis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    window.localStorage.setItem("qc_chat_visitor_id", visId);
  }
  return visId;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [previewMedia, setPreviewMedia] = useState<{ url: string; title: string; type: "image" | "video" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Keep ref in sync
  useEffect(() => {
    conversationIdRef.current = conversation?.id || null;
  }, [conversation?.id]);

  // Load conversation & initial messages
  const initConversation = useCallback(async () => {
    try {
      const visitorId = getOrCreateVisitorId();
      const storedConvId = window.localStorage.getItem("qc_chat_conv_id");

      const query = storedConvId
        ? `conversationId=${encodeURIComponent(storedConvId)}&visitorId=${encodeURIComponent(visitorId)}`
        : `visitorId=${encodeURIComponent(visitorId)}`;

      const res = await fetch(`/api/support/conversation?${query}`);
      const data = await res.json();

      if (!res.ok) {
        // 403 = stored conversation belongs to another account (e.g. a
        // different user signed in on this browser). Drop the stale id so
        // the widget starts a fresh conversation instead of retrying forever.
        if (res.status === 403 && storedConvId) {
          window.localStorage.removeItem("qc_chat_conv_id");
          conversationIdRef.current = null;
        }
        return;
      }

      if (data.conversation) {
        setConversation(data.conversation);
        setMessages(data.messages || []);
        window.localStorage.setItem("qc_chat_conv_id", data.conversation.id);

        if (data.settings?.chatEnabled === false) {
          setEnabled(false);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    initConversation();
  }, [initConversation]);

  // Establish SSE stream whenever conversation exists
  useEffect(() => {
    const convId = conversation?.id;
    if (!convId) return;

    if (sseRef.current) {
      sseRef.current.close();
    }

    try {
      const es = new EventSource(`/api/support/stream?conversationId=${encodeURIComponent(convId)}`);
      sseRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message:created" && data.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });

            if (!open && data.message.sender !== "customer") {
              setUnreadCount((c) => c + 1);
            }
          } else if (data.type === "takeover:changed") {
            setConversation((prev) => (prev ? { ...prev, handlingMode: data.handlingMode, humanRequested: false } : null));
          } else if (data.type === "status:changed") {
            setConversation((prev) => (prev ? { ...prev, status: data.status } : null));
          } else if (data.type === "conversation:updated" && data.conversation) {
            setConversation(data.conversation);
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
  }, [conversation?.id, open]);

  // Periodic fallback sync when chat is open (in case SSE drops on mobile)
  useEffect(() => {
    if (!open || !conversation?.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/support/conversation?conversationId=${encodeURIComponent(conversation.id)}`);
        if (res.status === 403) {
          // Conversation ownership changed (account switch) — stop polling.
          clearInterval(interval);
          return;
        }
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
        if (data.conversation) {
          setConversation(data.conversation);
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [open, conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input & clear unread count when opened
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

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

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      const hasText = Boolean(text.trim());
      const hasMedia = stagedAttachments.length > 0;
      if ((!hasText && !hasMedia) || loading) return;

      const visitorId = getOrCreateVisitorId();
      let convId = conversation?.id;
      const currentStaged = [...stagedAttachments];

      // Optimistic user message
      const tempId = `temp-${Date.now()}`;
      const userMsg: SupportMessage = {
        id: tempId,
        conversationId: convId || "pending",
        sender: "customer",
        senderName: conversation?.customerName || "You",
        content: hasText
          ? text.trim()
          : currentStaged.length === 1
          ? `[Attachment: ${currentStaged[0].name}]`
          : `[${currentStaged.length} Attachments]`,
        isInternal: false,
        deliveryStatus: "delivered",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setStagedAttachments([]);
      setUploadError("");
      setLoading(true);

      try {
        // If no conversation yet, create one
        if (!convId) {
          const cRes = await fetch("/api/support/conversation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitorId, currentUrl: window.location.pathname }),
          });
          const cData = await cRes.json();
          if (cData.conversation) {
            convId = cData.conversation.id;
            setConversation(cData.conversation);
            window.localStorage.setItem("qc_chat_conv_id", cData.conversation.id);
          }
        }

        // Upload any staged files
        const uploadedAttachments: SupportFileAttachment[] = [];
        for (const staged of currentStaged) {
          try {
            const fd = new FormData();
            fd.append("file", staged.file);
            if (convId) fd.append("conversationId", convId);
            fd.append("visitorId", visitorId);

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
            setUploadError("Failed to upload file attachment.");
          } finally {
            try {
              URL.revokeObjectURL(staged.previewUrl);
            } catch {}
          }
        }

        const res = await fetch("/api/support/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: convId,
            visitorId,
            content: text.trim(),
            attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
            currentUrl: window.location.pathname,
          }),
        });

        const data = await res.json();
        if (data.customerMsg) {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== tempId);
            const next = [...filtered, data.customerMsg];
            if (data.assistantMsg && !next.some((m) => m.id === data.assistantMsg.id)) {
              next.push(data.assistantMsg);
            }
            return next;
          });
        }
        if (data.conversation) {
          setConversation(data.conversation);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            conversationId: convId || "err",
            sender: "system",
            senderName: "Queens Care System",
            content: "Sorry, we had trouble sending your message. Please try again.",
            isInternal: false,
            deliveryStatus: "failed",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setLoading(false);
    },
    [conversation, loading, stagedAttachments]
  );

  // Request human support
  const requestHumanSupport = useCallback(async () => {
    if (handoffLoading || !conversation?.id) return;
    setHandoffLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      const res = await fetch("/api/support/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          visitorId,
        }),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        setConversation(data.conversation);
        if (data.systemMsg) {
          setMessages((prev) => [...prev, data.systemMsg]);
        }
      }
    } catch {}
    setHandoffLoading(false);
  }, [conversation?.id, handoffLoading]);

  /* ── Create Support Ticket from chat (prefilled, fully editable) ── */
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketCategories, setTicketCategories] = useState<Array<{ name: string }>>([]);
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", category: "" });
  const [ticketCreating, setTicketCreating] = useState(false);
  const [ticketNotice, setTicketNotice] = useState("");

  const openTicketForm = () => {
    // Prefill from real conversation context — nothing fabricated.
    const lastCustomerMsg = [...messages].reverse().find((m) => m.sender === "customer");
    const chatExcerpt = messages
      .filter((m) => m.sender === "customer" || m.sender === "agent")
      .slice(-4)
      .map((m) => `${m.sender === "customer" ? "Customer" : "Support"}: ${m.content}`)
      .join("\n");
    setTicketForm({
      subject: conversation?.relevantOrderId ? `Issue with order ${conversation.relevantOrderId}` : lastCustomerMsg?.content.slice(0, 80) || "Support request from chat",
      description: chatExcerpt ? `From my chat with Queens Care support:\n\n${chatExcerpt}\n\n---\nAdd details here:` : "",
      category: conversation?.relevantOrderId ? "Order Issue" : "",
    });
    setTicketNotice("");
    setShowTicketForm(true);
    if (ticketCategories.length === 0) {
      fetch("/api/support/tickets")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.config?.categories)) setTicketCategories(d.config.categories);
        })
        .catch(() => {});
    }
  };

  const submitTicketFromChat = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim() || !ticketForm.category || ticketCreating) return;
    setTicketCreating(true);
    try {
      const visitorId = getOrCreateVisitorId();
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticketForm,
          conversationId: conversation?.id,
          visitorId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setShowTicketForm(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `tkt-${Date.now()}`,
            conversationId: conversation?.id || "",
            sender: "system",
            senderName: "Queens Care System",
            content: `✅ Support ticket ${data.ticket.ticketNumber} created. Track it in Account → Support Tickets.`,
            isInternal: false,
            deliveryStatus: "delivered",
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setTicketNotice(data.error || "Failed to create ticket.");
      }
    } catch {
      setTicketNotice("Network error. Please retry.");
    }
    setTicketCreating(false);
  };

  if (!enabled) return null;

  // Determine current handling badge
  const isHumanHandling = conversation?.handlingMode === "human";
  const isHumanRequested = conversation?.humanRequested && !isHumanHandling;
  const isResolved = conversation?.status === "resolved" || conversation?.status === "closed";

  return (
    <>
      <style>{`
        @keyframes chatbotIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes chatbotPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(42,15,58,0.3); } 50% { box-shadow: 0 0 0 10px rgba(42,15,58,0); } }
        @keyframes typingDot { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        @media (prefers-reduced-motion: reduce) {
          .chatbot-panel { animation: none !important; }
          .chatbot-fab { animation: none !important; }
        }
        .qc-chat-handoff-btn:hover {
          background: #3e1654 !important;
          color: #fff !important;
          border-color: #3e1654 !important;
        }
      `}</style>

      {/* Chat Panel */}
      {open && (
        <div
          className="chatbot-panel"
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: "min(420px, calc(100vw - 32px))",
            height: "min(600px, calc(100vh - 120px))",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 16px 56px rgba(0,0,0,0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9995,
            animation: "chatbotIn 0.3s ease-out",
            border: "1px solid rgba(42,15,58,0.12)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg, #2A0F3A 0%, #3e1654 100%)",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: isHumanHandling ? "#D4AF37" : "rgba(255,255,255,0.15)",
                  color: isHumanHandling ? "#2A0F3A" : "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {isHumanHandling ? "👩‍⚕️" : "🤖"}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                    {isHumanHandling
                      ? conversation?.assignedTo?.name || "Queens Care Support"
                      : "Queens Care Clinical Chat"}
                  </p>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#22C55E",
                      display: "inline-block",
                    }}
                    title="Live Support Active"
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: 10,
                      background: isHumanHandling
                        ? "rgba(212, 175, 55, 0.25)"
                        : isHumanRequested
                        ? "rgba(245, 158, 11, 0.25)"
                        : "rgba(255,255,255,0.15)",
                      color: isHumanHandling ? "#E9CA91" : "#fff",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {isHumanHandling
                      ? "Human Handling (Live)"
                      : isHumanRequested
                      ? "Connecting Support..."
                      : isResolved
                      ? "Resolved"
                      : "AI Assistant"}
                  </span>
                  {conversation?.relevantOrderId && (
                    <span style={{ fontSize: 10, color: "#D7CDDD" }}>
                      Order: {conversation.relevantOrderId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                display: "grid",
                placeItems: "center",
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Status banner (Handoff requested / Resolved) */}
          {isHumanRequested && (
            <div
              style={{
                padding: "8px 14px",
                background: "#FEF3C7",
                color: "#92400E",
                fontSize: 11.5,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid #FDE68A",
              }}
            >
              <span>⏳</span>
              <span>Our support desk has been alerted. An agent will take over shortly.</span>
            </div>
          )}

          {isResolved && (
            <div
              style={{
                padding: "8px 14px",
                background: "#F1F5F9",
                color: "#475569",
                fontSize: 11.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <span>✓ Conversation marked as resolved.</span>
              <span style={{ fontSize: 10.5, color: "#64748B" }}>Reply to reopen anytime</span>
            </div>
          )}

          {/* Messages container */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "#FAF8F5",
            }}
          >
            {messages.map((msg, i) => {
              if (msg.sender === "system") {
                return (
                  <div key={msg.id || i} style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                    <div
                      style={{
                        padding: "4px 12px",
                        background: "#E2E8F0",
                        borderRadius: 12,
                        fontSize: 11,
                        color: "#475569",
                        textAlign: "center",
                        maxWidth: "90%",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const isUser = msg.sender === "customer";
              const isAgent = msg.sender === "agent";

              return (
                <div
                  key={msg.id || i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  {!isUser && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: isAgent ? "#997B4D" : "#64748B",
                        marginBottom: 3,
                        paddingLeft: 4,
                      }}
                    >
                      {isAgent ? `👩‍⚕️ ${msg.senderName || "Support Specialist"}` : "🤖 Dr. Queens AI"}
                    </span>
                  )}

                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      background: isUser ? "var(--purple, #2A0F3A)" : "#FFFFFF",
                      color: isUser ? "#FFFFFF" : "#1E293B",
                      fontSize: 13,
                      lineHeight: 1.55,
                      boxShadow: isUser ? "0 2px 8px rgba(42,15,58,0.18)" : "0 2px 6px rgba(0,0,0,0.04)",
                      border: isUser ? "none" : "1px solid rgba(42,15,58,0.08)",
                    }}
                  >
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>

                    {/* Attachments (Images & Videos) */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                        {msg.attachments.map((att) => {
                          const isImg = att.mimeType.startsWith("image/");
                          const isVid = att.mimeType.startsWith("video/");
                          return (
                            <div
                              key={att.id || att.url}
                              style={{
                                borderRadius: 8,
                                overflow: "hidden",
                                background: isUser ? "rgba(255,255,255,0.12)" : "#F8FAFC",
                                border: isUser ? "1px solid rgba(255,255,255,0.2)" : "1px solid #E2E8F0",
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
                                      maxHeight: 220,
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
                                    maxHeight: 240,
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
                                    maxWidth: 160,
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

                    {/* Product cards */}
                    {msg.products && msg.products.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        {msg.products.map((p) => (
                          <Link
                            key={p.slug}
                            href={`/products/${p.slug}`}
                            onClick={() => setOpen(false)}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "44px 1fr auto",
                              gap: 10,
                              alignItems: "center",
                              padding: "8px 10px",
                              background: "#FAF8F5",
                              borderRadius: 8,
                              border: "1px solid rgba(42,15,58,0.1)",
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.png";
                              }}
                            />
                            <div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#2A0F3A" }}>{p.name}</p>
                              <p style={{ margin: 0, fontSize: 10, color: "#64748B", textTransform: "capitalize" }}>
                                {p.category}
                              </p>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#2A0F3A" }}>
                              ₹{Number(p.price).toLocaleString("en-IN")}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "14px 14px 14px 2px",
                    background: "#FFFFFF",
                    border: "1px solid rgba(42,15,58,0.08)",
                  }}
                >
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#997B4D",
                          animation: `typingDot 1.2s infinite`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Talk to Human + Create Ticket Quick Actions */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              {!isHumanHandling && !isHumanRequested && (
                <button
                  type="button"
                  onClick={requestHumanSupport}
                  disabled={handoffLoading}
                  className="qc-chat-handoff-btn"
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "1px solid #997B4D",
                    background: "#FFFFFF",
                    color: "#2A0F3A",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: handoffLoading ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>👩‍💼</span>
                  <span>{handoffLoading ? "Connecting..." : "Talk to a human specialist"}</span>
                </button>
              )}
              <button
                type="button"
                data-testid="chatbot-create-ticket"
                onClick={openTicketForm}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1px solid var(--purple, #2A0F3A)",
                  background: "#FFFFFF",
                  color: "var(--purple, #2A0F3A)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                }}
              >
                <span>🎫</span>
                <span>Create Support Ticket</span>
              </button>
            </div>

            {/* Suggested questions (only show on fresh conversation) */}
            {messages.length <= 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "1px solid rgba(42,15,58,0.15)",
                      background: "#fff",
                      fontSize: 11,
                      cursor: "pointer",
                      color: "var(--purple, #2A0F3A)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--purple, #2A0F3A)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.color = "var(--purple, #2A0F3A)";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Create Ticket form (prefilled from chat, fully editable) */}
          {showTicketForm && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.98)",
                zIndex: 20,
                display: "flex",
                flexDirection: "column",
                padding: 16,
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <b style={{ fontSize: 14, color: "#2A0F3A" }}>🎫 Create Support Ticket</b>
                <button onClick={() => setShowTicketForm(false)} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer" }} aria-label="Close ticket form">✕</button>
              </div>
              {ticketNotice && (
                <div style={{ background: "#FEF2F2", color: "#B91C1C", fontSize: 11.5, padding: "8px 10px", borderRadius: 6, marginBottom: 8 }}>{ticketNotice}</div>
              )}
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 3 }}>Subject *</label>
              <input
                value={ticketForm.subject}
                onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
                maxLength={200}
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", fontSize: 12.5, marginBottom: 10, outline: "none" }}
              />
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 3 }}>Category *</label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm((f) => ({ ...f, category: e.target.value }))}
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", fontSize: 12.5, marginBottom: 10, outline: "none", background: "#fff" }}
              >
                <option value="">Select a category…</option>
                {ticketCategories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 3 }}>Description (editable chat context)</label>
              <textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
                rows={7}
                maxLength={5000}
                style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", fontSize: 12.5, marginBottom: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={submitTicketFromChat}
                  disabled={ticketCreating || !ticketForm.subject.trim() || !ticketForm.description.trim() || !ticketForm.category}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                    background: ticketCreating ? "#94A3B8" : "var(--purple, #2A0F3A)", color: "#fff",
                    fontWeight: 700, fontSize: 12.5, cursor: ticketCreating ? "wait" : "pointer",
                  }}
                >
                  {ticketCreating ? "Creating…" : "Submit Ticket"}
                </button>
                <button
                  onClick={() => setShowTicketForm(false)}
                  style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(42,15,58,0.15)", background: "#fff", fontSize: 12.5, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div
              style={{
                background: "#FEF2F2",
                color: "#B91C1C",
                fontSize: 11,
                padding: "6px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #FCA5A5",
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

          {/* Staged Attachments Preview Tray */}
          {stagedAttachments.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                padding: "8px 14px",
                background: "#F8FAFC",
                borderTop: "1px solid rgba(42,15,58,0.08)",
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
                    borderRadius: 8,
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
                      maxWidth: 100,
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

          {/* Input Composer */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid rgba(42,15,58,0.08)",
              background: "#FFFFFF",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
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
              data-testid="chatbot-attach-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1px solid rgba(42,15,58,0.15)",
                background: stagedAttachments.length > 0 ? "rgba(42,15,58,0.06)" : "#fff",
                color: "var(--purple, #2A0F3A)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 16,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              aria-label="Attach image or video"
              title="Attach image or video (Max: 10MB image, 50MB video)"
            >
              📎
            </button>
            <input
              ref={inputRef}
              data-testid="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={
                isHumanHandling
                  ? "Message Queens Care support team…"
                  : "Ask about products, orders, or delivery…"
              }
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 24,
                border: "1px solid rgba(42,15,58,0.15)",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              data-testid="chatbot-send"
              onClick={() => sendMessage(input)}
              disabled={(!input.trim() && stagedAttachments.length === 0) || loading}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "none",
                background: (input.trim() || stagedAttachments.length > 0) ? "var(--purple, #2A0F3A)" : "#CBD5E1",
                color: "#fff",
                cursor: (input.trim() || stagedAttachments.length > 0) && !loading ? "pointer" : "not-allowed",
                fontSize: 16,
                display: "grid",
                placeItems: "center",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
              aria-label="Send message"
            >
              {loading ? "…" : "→"}
            </button>
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

      {/* Floating Action Button (FAB) */}
      <button
        data-testid="chatbot-toggle"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            setUnreadCount(0);
            setTimeout(() => inputRef.current?.focus(), 150);
          }
        }}
        className="chatbot-fab"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #2A0F3A, #3e1654)",
          color: "#D4AF37",
          cursor: "pointer",
          fontSize: 24,
          boxShadow: "0 4px 20px rgba(42,15,58,0.35)",
          zIndex: 9996,
          display: "grid",
          placeItems: "center",
          animation: open ? "none" : "chatbotPulse 3s infinite",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        aria-label={open ? "Close clinical chat" : "Open clinical support chat"}
      >
        {open ? "✕" : "💬"}

        {/* Unread indicator badge */}
        {!open && unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#EF4444",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              width: 22,
              height: 22,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              border: "2px solid #fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
