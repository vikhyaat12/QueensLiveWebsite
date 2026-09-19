"use client";

import { useState, useEffect, useCallback } from "react";
import StoryCMSManager from "./StoryCMSManager";

type PageSetting = Record<string, unknown> & {
  id: string;
  slug: string;
  title: string;
  label: string;
  headerVisible: boolean;
  footerVisible: boolean;
  sortOrder: number;
  active: boolean;
  isAnchor?: boolean;
};

export default function PageManagement() {
  const [pages, setPages] = useState<PageSetting[]>([]);
  const [publishStatus, setPublishStatus] = useState<{
    isDraftModified: boolean;
    draftCount: number;
    publishedCount: number;
    lastPublishedAt: string | null;
    publishedBy: string | null;
  } | null>(null);
  const [liveNav, setLiveNav] = useState<Array<{ id: string; label: string; href: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState<PageSetting | null>(null);
  const [showStoryCms, setShowStoryCms] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSeoModal, setShowSeoModal] = useState(false);
  const [msg, setMsg] = useState("");
  const [isErr, setIsErr] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/pages");
      const d = await r.json();
      setPages(d.pages || []);
      if (d.publishStatus) setPublishStatus(d.publishStatus);
      if (d.liveNav) setLiveNav(d.liveNav);
    } catch {
      setPages([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async () => {
    setPublishing(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsErr(false);
        setMsg("✓ Navigation successfully published to live storefront! Customers will see changes immediately with zero flash.");
        await load();
      } else {
        setIsErr(true);
        setMsg(data.error || "Failed to publish navigation.");
      }
    } catch {
      setIsErr(true);
      setMsg("Network error publishing navigation.");
    }
    setPublishing(false);
  };

  const handleDiscardDraft = async () => {
    if (!confirm("Are you sure you want to discard draft changes and restore the live published navigation?")) return;
    setPublishing(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard_draft" }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsErr(false);
        setMsg("Draft changes discarded. Reverted to live published navigation.");
        await load();
      } else {
        setIsErr(true);
        setMsg(data.error || "Failed to discard draft.");
      }
    } catch {
      setIsErr(true);
      setMsg("Network error discarding draft.");
    }
    setPublishing(false);
  };

  const startNew = () => {
    setIsNew(true);
    setEditing({ id: "new", slug: "", title: "", label: "", headerVisible: true, footerVisible: true, sortOrder: pages.length, active: true } as PageSetting);
    setForm({ slug: "", title: "", label: "", headerVisible: true, footerVisible: true, sortOrder: pages.length, active: true });
    setMsg("");
  };

  const handleSaveClick = () => {
    if (!form.slug && !form.title) { setMsg("Title and slug are required."); setIsErr(true); return; }
    const oldSlug = String(editing?.slug || "").trim().toLowerCase();
    const newSlug = String(form.slug || "").trim().toLowerCase();
    if (!isNew && oldSlug && newSlug && oldSlug !== newSlug) {
      setShowSeoModal(true);
      return;
    }
    executeSave();
  };

  const executeSave = async () => {
    if (!form.slug && !form.title) { setMsg("Title and slug are required."); setIsErr(true); return; }
    setSaving(true);
    setMsg("");
    try {
      const endpoint = "/api/admin/pages";
      const method = isNew ? "POST" : "PATCH";
      const payload = { ...form, id: isNew ? undefined : form.id };
      const r = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok) {
        setIsErr(false);
        setMsg("Page saved successfully!");
        setEditing(null);
        setIsNew(false);
        load();
      } else {
        setIsErr(true);
        setMsg(d.error || "Failed to save.");
      }
    } catch {
      setIsErr(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  const del = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/pages?id=${id}`, { method: "DELETE" });
    load();
  };

  const toggleHeader = async (page: PageSetting) => {
    await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id, headerVisible: !page.headerVisible }),
    });
    load();
  };

  const toggleFooter = async (page: PageSetting) => {
    await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id, footerVisible: !(page.footerVisible !== false) }),
    });
    load();
  };

  const toggleActive = async (page: PageSetting) => {
    await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id, active: !page.active }),
    });
    load();
  };

  const moveUp = async (page: PageSetting, idx: number) => {
    if (idx === 0) return;
    const prev = pages[idx - 1];
    await fetch("/api/admin/pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: page.id, sortOrder: Number(prev.sortOrder) - 1 }) });
    load();
  };

  const moveDown = async (page: PageSetting, idx: number) => {
    if (idx >= pages.length - 1) return;
    const next = pages[idx + 1];
    await fetch("/api/admin/pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: page.id, sortOrder: Number(next.sortOrder) + 1 }) });
    load();
  };

  // ─── OUR STORY CMS ───────────────────────────────────────────────────
  if (showStoryCms) {
    return <StoryCMSManager onBack={() => setShowStoryCms(false)} />;
  }

  // ─── EDITOR ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, font: "20px var(--font-display)" }}>{isNew ? "Create New" : "Edit"} Page</h3>
          <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Back</button>
        </div>
        {msg && <p style={{ padding: "8px 12px", background: isErr ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: isErr ? "#b34141" : "#2e7d32", marginBottom: 16 }}>{msg}</p>}

        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Page Title *</label>
                <input style={inputStyle} value={String(form.title || "")} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="About Us" />
              </div>
              <div>
                <label style={labelStyle}>URL Slug *</label>
                <input
                  style={inputStyle}
                  value={String(form.slug || "")}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/[^a-z0-9-\/#]/g, "").toLowerCase() })}
                  placeholder="about"
                />
                <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted)" }}>
                  Public URL: <code>https://queenscare.in/{String(form.slug || "")}</code>
                </div>
                {!isNew && editing?.slug && String(form.slug || "").toLowerCase() !== String(editing.slug).toLowerCase() && (
                  <div style={{ marginTop: 6, padding: "5px 8px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 4, fontSize: 11, color: "#92400e" }}>
                    🔄 URL modified: <code>/{String(editing.slug)}</code> → <code>/{String(form.slug)}</code>. A 301 redirect will be created upon publishing navigation.
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Navigation Label</label>
                <input style={inputStyle} value={String(form.label || "")} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="About" />
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)" }}>Text shown in navigation (defaults to title)</p>
              </div>
              <div>
                <label style={labelStyle}>Sort Order</label>
                <input type="number" style={inputStyle} value={Number(form.sortOrder || 0)} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Active (Page exists)
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.headerVisible !== false} onChange={(e) => setForm({ ...form, headerVisible: e.target.checked })} />
                Show in Header Navigation
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.footerVisible !== false} onChange={(e) => setForm({ ...form, footerVisible: e.target.checked })} />
                Show in Footer
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={handleSaveClick} disabled={saving} style={{ padding: "12px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving…" : "Save Page"}</button>
          <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: "12px 24px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
        </div>

        {/* ── SEO CONFIRMATION MODAL ── */}
        {showSeoModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 16
          }}>
            <div style={{
              background: "#fff", borderRadius: 8, padding: 24, maxWidth: 500, width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>⚠️</span>
                <h3 style={{ margin: 0, font: "20px var(--font-display)", color: "#991b1b" }}>
                  Confirm Page URL / Slug Change
                </h3>
              </div>
              <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, margin: "0 0 16px" }}>
                You are modifying the public URL path for this page.
              </p>
              <div style={{ background: "#f8fafc", border: "1px solid var(--line)", borderRadius: 6, padding: 12, marginBottom: 18, fontSize: 12 }}>
                <div style={{ marginBottom: 6 }}>
                  <strong style={{ color: "#64748B" }}>Current Path:</strong>{" "}
                  <code style={{ color: "#dc2626" }}>/{String(editing?.slug)}</code>
                </div>
                <div>
                  <strong style={{ color: "#64748B" }}>New Path:</strong>{" "}
                  <code style={{ color: "#16a34a" }}>/{String(form.slug)}</code>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: 4, margin: "0 0 20px" }}>
                ✓ Once navigation changes are published, an authoritative <strong>301 Permanent Redirect</strong> will forward all traffic from the previous URL to the new URL.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowSeoModal(false)}
                  style={{ padding: "9px 16px", border: "1px solid var(--line)", background: "#fff", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSeoModal(false);
                    executeSave();
                  }}
                  style={{ padding: "9px 20px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  Confirm &amp; Save Page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, font: "18px var(--font-display)" }}>Page & Navigation Management ({pages.length} pages)</h3>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowStoryCms(true)}
            style={{
              padding: "8px 16px",
              background: "#f3e8f7",
              color: "var(--purple)",
              border: "1px solid var(--purple)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✨ Manage "Our Story" CMS
          </button>
          <button onClick={startNew} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>+ Create Page</button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", background: isErr ? "#fde8e8" : "#e9f7e9", border: `1px solid ${isErr ? "#fca5a5" : "#86efac"}`, color: isErr ? "#b34141" : "#166534", fontSize: 12, borderRadius: 6, marginBottom: 16 }}>
          {msg}
        </div>
      )}

      {/* Live Publishing Bar */}
      <div
        style={{
          marginBottom: 20,
          padding: "16px 20px",
          background: publishStatus?.isDraftModified ? "#fffbeb" : "#f8fafc",
          border: `1px solid ${publishStatus?.isDraftModified ? "#fcd34d" : "#cbd5e1"}`,
          borderRadius: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: publishStatus?.isDraftModified ? "#f59e0b" : "#10b981",
              }}
            />
            <strong style={{ fontSize: 14, color: publishStatus?.isDraftModified ? "#92400e" : "#065f46" }}>
              {publishStatus?.isDraftModified
                ? "Unpublished Navigation Draft Pending"
                : "Customer Storefront Navigation Synced (Live)"}
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
            {publishStatus?.isDraftModified
              ? "Draft changes detected. The public header will keep serving the live snapshot until you publish."
              : `Live customer navigation is active. Last published: ${publishStatus?.lastPublishedAt ? new Date(publishStatus.lastPublishedAt).toLocaleString("en-IN") : "Initial setup"}${publishStatus?.publishedBy ? ` by ${publishStatus.publishedBy}` : ""}`}
          </p>
          <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>
            Currently Live in Customer Header:{" "}
            <strong>
              {liveNav.length > 0 ? liveNav.map((n) => n.label).join("  •  ") : "None (All hidden)"}
            </strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {publishStatus?.isDraftModified && (
            <button
              onClick={handleDiscardDraft}
              disabled={publishing}
              style={{
                padding: "8px 14px",
                background: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              ↺ Discard Draft
            </button>
          )}
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{
              padding: "8px 18px",
              background: publishStatus?.isDraftModified ? "#16a34a" : "var(--purple)",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              cursor: publishing ? "not-allowed" : "pointer",
              boxShadow: publishStatus?.isDraftModified ? "0 2px 6px rgba(22,163,74,0.3)" : "none",
            }}
          >
            {publishing ? "Publishing…" : "🚀 Publish Navigation to Live"}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 30 }}>Loading…</p>
      ) : pages.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 30 }}>No pages found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Page</th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Slug</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Live Header</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Draft Header</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Active</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Footer</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Order</th>
              <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, idx) => {
              const isLive = liveNav.some((n) => n.href === `/${page.slug}` || n.href === page.slug || (page.slug === "home" && n.href === "/"));
              return (
              <tr key={page.id} style={{ borderBottom: "1px solid var(--line)", opacity: page.active === false ? 0.5 : 1 }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{page.label || page.title}</td>
                <td style={{ padding: "10px 12px" }}><code style={{ fontSize: 11, background: "#f0eeeb", padding: "2px 6px" }}>/{page.slug}</code></td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: isLive ? "#16a34a" : "#94a3b8" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLive ? "#16a34a" : "#cbd5e1" }} />
                    {isLive ? "Live" : "Hidden"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <button onClick={() => toggleHeader(page)} style={{ padding: "3px 10px", fontSize: 11, border: "1px solid var(--line)", background: page.headerVisible !== false ? "#e8f5e9" : "#fff", color: page.headerVisible !== false ? "#2e7d32" : "var(--muted)", cursor: "pointer", borderRadius: 4 }}>
                    {page.headerVisible !== false ? "ON" : "OFF"}
                  </button>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <button onClick={() => toggleActive(page)} style={{ padding: "3px 10px", fontSize: 11, border: "1px solid var(--line)", background: page.active !== false ? "#e8f5e9" : "#fff", color: page.active !== false ? "#2e7d32" : "var(--muted)", cursor: "pointer", borderRadius: 4 }}>
                    {page.active !== false ? "ON" : "OFF"}
                  </button>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <button onClick={() => toggleFooter(page)} style={{ padding: "3px 10px", fontSize: 11, border: "1px solid var(--line)", background: page.footerVisible !== false ? "#e8f5e9" : "#fff", color: page.footerVisible !== false ? "#2e7d32" : "var(--muted)", cursor: "pointer", borderRadius: 4 }}>
                    {page.footerVisible !== false ? "ON" : "OFF"}
                  </button>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <button onClick={() => moveUp(page, idx)} disabled={idx === 0} style={{ padding: "2px 6px", fontSize: 10, border: "1px solid var(--line)", background: "#fff", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveDown(page, idx)} disabled={idx >= pages.length - 1} style={{ padding: "2px 6px", fontSize: 10, border: "1px solid var(--line)", background: "#fff", cursor: idx >= pages.length - 1 ? "default" : "pointer", opacity: idx >= pages.length - 1 ? 0.3 : 1 }}>↓</button>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                  {(page.slug === "about" || page.id === "pg-about") && (
                    <button
                      onClick={() => setShowStoryCms(true)}
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        border: "1px solid var(--purple)",
                        background: "#f3e8f7",
                        color: "var(--purple)",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Story CMS ✍️
                    </button>
                  )}
                  <button onClick={() => { setEditing(page); setForm({ ...page }); setIsNew(false); setMsg(""); }} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid var(--line)", background: "#fff", cursor: "pointer" }}>Edit</button>
                  {!page.isAnchor && (
                    <button onClick={() => del(page.id, page.title)} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer" }}>Del</button>
                  )}
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 20, padding: "14px 18px", background: "#f5f3f0", border: "1px solid var(--line)", borderRadius: 8 }}>
        <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>📋 How Page Management Works</h4>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          <li><strong>Header ON</strong> = page appears in public top navigation</li>
          <li><strong>Header OFF</strong> = page is hidden from public navigation (but URL still works)</li>
          <li><strong>Active OFF</strong> = page is completely disabled</li>
          <li><strong>Footer</strong> = visibility in footer links</li>
          <li>Use ↑↓ arrows to reorder navigation items</li>
          <li>Deleting a page removes it permanently — use Active OFF to temporarily hide</li>
        </ul>
      </div>
    </div>
  );
}
