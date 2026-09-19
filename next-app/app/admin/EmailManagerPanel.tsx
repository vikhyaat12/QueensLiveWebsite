"use client";

import React, { useState, useEffect } from "react";
import type { EmailTemplateDefinition } from "@/lib/email/email-templates";

interface EmailLogEntry {
  id: string;
  templateId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: string;
  provider: string;
  error?: string;
  createdAt: string;
}

export default function EmailManagerPanel() {
  const [templates, setTemplates] = useState<EmailTemplateDefinition[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateDefinition | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "logs">("editor");
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedHtml, setEditedHtml] = useState("");
  const [editedText, setEditedText] = useState("");

  const selectTemplate = (tpl: EmailTemplateDefinition) => {
    setSelectedTemplate(tpl);
    setEditedSubject(tpl.subject);
    setEditedHtml(tpl.defaultHtml);
    setEditedText(tpl.defaultText);
    setMessage(null);
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/admin/email/templates");
      const d = await res.json();
      if (Array.isArray(d.templates)) {
        setTemplates(d.templates);
        if (!selectedTemplate && d.templates.length > 0) {
          selectTemplate(d.templates[0]);
        }
      }
    } catch {}
  };

  const loadLogs = async () => {
    try {
      const res = await fetch("/api/admin/email/logs");
      const d = await res.json();
      if (Array.isArray(d.logs)) {
        setLogs(d.logs);
      }
    } catch {}
  };

  useEffect(() => {
    Promise.all([loadTemplates(), loadLogs()]).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTemplate.id,
          subject: editedSubject,
          html: editedHtml,
          text: editedText,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `Template "${selectedTemplate.name}" updated successfully.` });
        loadTemplates();
      } else {
        setMessage({ type: "error", text: d.error || "Failed to update template." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error saving template." });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !testEmail) return;
    setTestSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipientEmail: testEmail,
        }),
      });
      const d = await res.json();
      if (res.ok && d.result?.success) {
        setMessage({
          type: "success",
          text: `Test email dispatched to ${testEmail} (Mode: ${d.result.simulated ? "Simulated / Dev Log" : "Live Provider"}).`,
        });
        loadLogs();
      } else {
        setMessage({ type: "error", text: d.result?.error || "Error dispatching test email." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during test send." });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ─── HEADER ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--purple, #2A0F3A)" }}>
              ✉️ Transactional Email &amp; Communications Engine
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(42, 15, 58, 0.08)", color: "var(--purple, #2A0F3A)", padding: "2px 8px", borderRadius: 12 }}>
              13 Core Lifecycle Templates
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted, #666)" }}>
            Manage branded customer and operational email notifications. All templates feature responsive HTML, plain-text fallback, and idempotency protection.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveTab("editor")}
            style={{
              padding: "7px 14px",
              background: activeTab === "editor" ? "var(--purple, #2A0F3A)" : "#fff",
              color: activeTab === "editor" ? "#fff" : "var(--ink, #1a1a1a)",
              border: "1px solid var(--line, #e2d9e6)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Templates Editor
          </button>
          <button
            onClick={() => { setActiveTab("logs"); loadLogs(); }}
            style={{
              padding: "7px 14px",
              background: activeTab === "logs" ? "var(--purple, #2A0F3A)" : "#fff",
              color: activeTab === "logs" ? "#fff" : "var(--ink, #1a1a1a)",
              border: "1px solid var(--line, #e2d9e6)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Dispatch Audit Logs ({logs.length})
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            background: message.type === "success" ? "#e8f5e9" : "#ffebee",
            color: message.type === "success" ? "#2e7d32" : "#c62828",
            border: message.type === "success" ? "1px solid #c8e6c9" : "1px solid #ffcdd2",
          }}
        >
          {message.text}
        </div>
      )}

      {/* ─── TAB 1: TEMPLATE EDITOR ─── */}
      {activeTab === "editor" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, minHeight: 650 }}>
          {/* Sidebar Template Picker */}
          <div style={{ background: "#fff", border: "1px solid var(--line, #e2d9e6)", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 14px", background: "#fbf9f6", borderBottom: "1px solid var(--line, #e2d9e6)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--muted, #666)" }}>
              Email Lifecycle Events
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
              {templates.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => selectTemplate(tpl)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: isSelected ? "1px solid var(--purple, #2A0F3A)" : "1px solid transparent",
                      background: isSelected ? "rgba(42, 15, 58, 0.05)" : "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--gold, #D4AF37)" }}>
                        {tpl.category}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: isSelected ? "var(--purple, #2A0F3A)" : "#333" }}>
                      {tpl.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Template Workstation */}
          {selectedTemplate ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Top Controls */}
              <div style={{ background: "#fff", border: "1px solid var(--line, #e2d9e6)", borderRadius: 8, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, color: "var(--purple, #2A0F3A)" }}>
                      {selectedTemplate.name}
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted, #666)" }}>
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: "8px 18px",
                        background: "var(--purple, #2A0F3A)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {saving ? "Saving…" : "Save Template"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid var(--line, #e2d9e6)",
                        borderRadius: 4,
                        fontSize: 13,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                      Available Variables (Click to copy)
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedTemplate.variables.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`{{${v}}}`);
                            setMessage({ type: "success", text: `Copied {{${v}}} to clipboard` });
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: 11,
                            background: "#f3eff6",
                            border: "1px solid #e0d4e8",
                            borderRadius: 4,
                            cursor: "pointer",
                            color: "var(--purple, #2A0F3A)",
                            fontFamily: "monospace",
                          }}
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview & Code Split */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
                {/* HTML Source Editor */}
                <div style={{ background: "#fff", border: "1px solid var(--line, #e2d9e6)", borderRadius: 8, display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "10px 14px", background: "#fbf9f6", borderBottom: "1px solid var(--line, #e2d9e6)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--muted, #666)" }}>
                    HTML Template Markup
                  </div>
                  <textarea
                    value={editedHtml}
                    onChange={(e) => setEditedHtml(e.target.value)}
                    style={{
                      flex: 1,
                      width: "100%",
                      padding: 12,
                      fontFamily: "monospace",
                      fontSize: 11,
                      border: "none",
                      resize: "none",
                      outline: "none",
                      boxSizing: "border-box",
                      minHeight: 340,
                    }}
                  />
                </div>

                {/* Rendered Live Preview */}
                <div style={{ background: "#fff", border: "1px solid var(--line, #e2d9e6)", borderRadius: 8, display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "10px 14px", background: "#fbf9f6", borderBottom: "1px solid var(--line, #e2d9e6)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--muted, #666)", display: "flex", justifyContent: "space-between" }}>
                    <span>Rendered Client Preview</span>
                    <span style={{ fontSize: 10, color: "var(--gold, #D4AF37)", fontWeight: 700 }}>600px Viewport</span>
                  </div>
                  <div style={{ flex: 1, padding: 12, overflowY: "auto", background: "#f8f6f2" }}>
                    <iframe
                      srcDoc={editedHtml.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, "[SAMPLE_$1]")}
                      style={{ width: "100%", height: "100%", minHeight: 340, border: "none", borderRadius: 4, background: "#fff" }}
                      title="Email Live Preview"
                    />
                  </div>
                </div>
              </div>

              {/* Test Send Section */}
              <div style={{ background: "#fff", border: "1px solid var(--line, #e2d9e6)", borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--purple, #2A0F3A)" }}>
                  🧪 Send Test Verification Email
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter recipient email (e.g. your-email@domain.com)"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: "1px solid var(--line, #e2d9e6)",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={testSending || !testEmail}
                    style={{
                      padding: "8px 18px",
                      background: "#fff",
                      color: "var(--purple, #2A0F3A)",
                      border: "1px solid var(--purple, #2A0F3A)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {testSending ? "Sending…" : "Send Test Now"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted, #666)" }}>Select a template</div>
          )}
        </div>
      )}

      {/* ─── TAB 2: DISPATCH AUDIT LOGS ─── */}
      {activeTab === "logs" && (
        <div style={{ background: "#fff", border: "1px solid var(--line, #e2d9e6)", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#fbf9f6", borderBottom: "1px solid var(--line, #e2d9e6)" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>Event ID / Time</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>Template</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>Recipient</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>Subject</th>
                <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--muted, #666)" }}>Status &amp; Provider</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f0edf2" }}>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: "var(--muted, #888)" }}>{log.id}</div>
                    <div style={{ fontSize: 11, color: "#444" }}>
                      {new Date(log.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "2px 6px", background: "#f0e8f8", color: "var(--purple, #2A0F3A)", borderRadius: 3, fontWeight: 600, fontSize: 11 }}>
                      {log.templateId}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600 }}>{log.recipientEmail}</div>
                    {log.recipientName && <div style={{ fontSize: 11, color: "var(--muted, #666)" }}>{log.recipientName}</div>}
                  </td>
                  <td style={{ padding: "10px 14px", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.subject}
                  </td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: log.status === "sent" ? "#e8f5e9" : log.status === "simulated" ? "#e0f2fe" : "#ffebee",
                        color: log.status === "sent" ? "#2e7d32" : log.status === "simulated" ? "#0369a1" : "#c62828",
                      }}
                    >
                      {log.status} ({log.provider})
                    </span>
                    {log.error && <div style={{ fontSize: 10, color: "#c62828", marginTop: 2 }}>{log.error}</div>}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--muted, #888)" }}>
                    No transactional emails dispatched yet. Send a test email above to verify delivery.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
