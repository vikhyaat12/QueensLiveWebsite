"use client";

import { useEffect, useState } from "react";
import type { SupportTicketConfig } from "@/lib/support/ticket-types";

/* ═══════════════════════════════════════════════════════════════
   TICKET CONFIGURATION — Admin-managed, zero hardcoded business
   content. Categories, tags, numbering format, attachment rules,
   reopen policy. All persisted server-side and audit-logged.
   ═══════════════════════════════════════════════════════════════ */

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 6,
  fontSize: 12.5, outline: "none", width: "100%", boxSizing: "border-box", background: "#fff",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const,
  letterSpacing: ".05em", color: "var(--muted)", marginBottom: 4, display: "block",
};

export default function TicketConfigPanel() {
  const [cfg, setCfg] = useState<SupportTicketConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isErr, setIsErr] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    fetch("/api/admin/support/ticket-config")
      .then((r) => r.json())
      .then((d) => setCfg(d.config || null))
      .catch(() => {});
  }, []);

  const flash = (m: string, err = false) => {
    setMsg(m);
    setIsErr(err);
    setTimeout(() => setMsg(""), 3500);
  };

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/support/ticket-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setCfg(data.config);
        flash("Ticket configuration saved.");
      } else {
        flash(data.error || "Save failed.", true);
      }
    } catch {
      flash("Network error.", true);
    }
    setSaving(false);
  };

  if (!cfg) return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading ticket configuration…</p>;

  const section: React.CSSProperties = { background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: 18, marginBottom: 14 };
  const h = { margin: "0 0 12px", fontSize: 13.5, fontWeight: 700, color: "var(--purple, #2A0F3A)" } as const;

  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700, color: "var(--purple, #2A0F3A)" }}>⚙️ Ticket Configuration</h2>
      {msg && (
        <div style={{ padding: "9px 14px", marginBottom: 12, borderRadius: 6, fontSize: 12.5, background: isErr ? "#FEF2F2" : "#F0FDF4", color: isErr ? "#B91C1C" : "#166534" }}>{msg}</div>
      )}

      {/* Categories */}
      <div style={section}>
        <h3 style={h}>Categories</h3>
        <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--muted)" }}>
          Customers can only select enabled categories. Disabled ones stop appearing immediately (existing tickets keep their category).
        </p>
        {cfg.categories.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <input
              defaultValue={c.name}
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== c.name) save({ upsertCategory: { id: c.id, name: v } }); }}
              style={{ ...inputStyle, maxWidth: 240 }}
            />
            <label style={{ fontSize: 11.5, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={c.enabled}
                onChange={(e) => save({ upsertCategory: { id: c.id, name: c.name, enabled: e.target.checked } })}
              />
              Enabled
            </label>
            <button
              onClick={() => save({ deleteCategoryId: c.id })}
              style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #FECACA", background: "#fff", color: "#B91C1C", fontSize: 11, cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input placeholder="New category name…" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ ...inputStyle, maxWidth: 240 }} />
          <button
            onClick={() => { if (newCategory.trim()) { save({ upsertCategory: { name: newCategory.trim() } }); setNewCategory(""); } }}
            style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "var(--purple, #2A0F3A)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Tags */}
      <div style={section}>
        <h3 style={h}>Tags</h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {cfg.tags.map((t) => (
            <span key={t.id} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 12, background: t.enabled ? "#EDE9FE" : "#F1F5F9", color: t.enabled ? "#5B21B6" : "#94A3B8", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {t.name}
              <button onClick={() => save({ deleteTagId: t.id })} style={{ border: "none", background: "none", cursor: "pointer", color: "#B91C1C", fontSize: 11, padding: 0 }} aria-label={`Delete tag ${t.name}`}>✕</button>
              <button onClick={() => save({ upsertTag: { id: t.id, name: t.name, enabled: !t.enabled } })} style={{ border: "none", background: "none", cursor: "pointer", color: "#6D28D9", fontSize: 10, padding: 0 }} title={t.enabled ? "Disable" : "Enable"}>
                {t.enabled ? "◉" : "○"}
              </button>
            </span>
          ))}
          {cfg.tags.length === 0 && <span style={{ fontSize: 12, color: "var(--muted)" }}>No tags yet.</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="New tag…" value={newTag} onChange={(e) => setNewTag(e.target.value)} style={{ ...inputStyle, maxWidth: 240 }} />
          <button
            onClick={() => { if (newTag.trim()) { save({ upsertTag: { name: newTag.trim().toLowerCase() } }); setNewTag(""); } }}
            style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "var(--purple, #2A0F3A)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            + Add Tag
          </button>
        </div>
      </div>

      {/* Numbering */}
      <div style={section}>
        <h3 style={h}>Ticket Numbering</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Prefix</label>
            <input defaultValue={cfg.numbering.prefix} onBlur={(e) => save({ numbering: { ...cfg.numbering, prefix: e.target.value.trim().toUpperCase() || "QC" } })} style={inputStyle} maxLength={10} />
          </div>
          <div>
            <label style={labelStyle}>Include Year</label>
            <select value={cfg.numbering.includeYear ? "yes" : "no"} onChange={(e) => save({ numbering: { ...cfg.numbering, includeYear: e.target.value === "yes" } })} style={inputStyle}>
              <option value="yes">Yes (QC-2026-000001)</option>
              <option value="no">No (QC-000001)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Zero Padding</label>
            <input type="number" min={2} max={10} defaultValue={cfg.numbering.padLength} onBlur={(e) => save({ numbering: { ...cfg.numbering, padLength: Number(e.target.value) || 6 } })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Next Sequence #</label>
            <input type="number" min={1} defaultValue={cfg.numbering.nextSequence} onBlur={(e) => save({ numbering: { ...cfg.numbering, nextSequence: Math.max(1, Number(e.target.value) || 1) } })} style={inputStyle} />
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 11.5, color: "var(--muted)" }}>
          Preview: <b>{[cfg.numbering.prefix, cfg.numbering.includeYear ? new Date().getFullYear() : null, String(cfg.numbering.nextSequence).padStart(cfg.numbering.padLength, "0")].filter(Boolean).join("-")}</b> — numbers are unique and never reused.
        </p>
      </div>

      {/* Attachments & Reopen policy */}
      <div style={section}>
        <h3 style={h}>Attachments & Reopen Policy</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
          <label style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={cfg.attachmentsEnabled} onChange={(e) => save({ attachmentsEnabled: e.target.checked })} />
            Enable attachments (all users)
          </label>
          <label style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={cfg.attachmentsEnabledForCustomer} onChange={(e) => save({ attachmentsEnabledForCustomer: e.target.checked })} />
            Customers may attach files
          </label>
          <div>
            <label style={labelStyle}>Max file size (MB)</label>
            <input type="number" min={1} max={100} defaultValue={cfg.maxAttachmentMb} onBlur={(e) => save({ maxAttachmentMb: Number(e.target.value) || 25 })} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Reopen window (days, 0 = unlimited)</label>
            <input type="number" min={0} max={365} defaultValue={cfg.reopenWindowDays} onBlur={(e) => save({ reopenWindowDays: Math.max(0, Number(e.target.value) || 0) })} style={inputStyle} />
          </div>
        </div>
      </div>

      <button
        disabled={saving}
        style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: saving ? "#94A3B8" : "var(--gold, #d4af37)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
      >
        {saving ? "Saving…" : "Changes save automatically on edit"}
      </button>
    </div>
  );
}
