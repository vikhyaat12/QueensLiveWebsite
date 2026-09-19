"use client";

import React, { useState, useEffect } from "react";
import type { OurPeoplePageConfig, OurPeopleSectionId } from "@/lib/commerce/store-extensions";

interface OurPeopleCMSManagerProps {
  onEditEmployee?: (emp: Record<string, unknown>) => void;
  onAddEmployee?: () => void;
  onRefresh?: () => void;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

export default function OurPeopleCMSManager({
  onEditEmployee,
  onAddEmployee,
  onRefresh,
  inputStyle: propInputStyle,
  labelStyle: propLabelStyle,
}: OurPeopleCMSManagerProps) {
  const [activeTab, setActiveTab] = useState<"sections" | "members" | "categories" | "seo" | "design" | "profile">("sections");
  const [activeSectionId, setActiveSectionId] = useState<OurPeopleSectionId>("hero");
  const [pageConfig, setPageConfig] = useState<OurPeoplePageConfig | null>(null);
  const [employees, setEmployees] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Member filtering
  const [memberSearch, setMemberSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const inputStyle: React.CSSProperties = propInputStyle || {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    color: "#1f2937",
    background: "#ffffff",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = propLabelStyle || {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, empRes] = await Promise.all([
        fetch("/api/admin/employees/page"),
        fetch("/api/admin/employees"),
      ]);

      if (configRes.ok) {
        const cd = await configRes.json();
        setPageConfig(cd.config);
      }
      if (empRes.ok) {
        const ed = await empRes.json();
        setEmployees(ed.employees || []);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to load Our People CMS data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePageConfig = async () => {
    if (!pageConfig) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/employees/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setPageConfig(data.config);
        setFeedback({ type: "success", msg: "Our People page CMS & settings saved successfully!" });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", msg: "Failed to save Our People settings." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentVal }),
      });
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === id ? { ...e, active: !currentVal } : e))
        );
        if (onRefresh) onRefresh();
      }
    } catch {}
  };

  const handleToggleFeatured = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, featured: !currentVal }),
      });
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === id ? { ...e, featured: !currentVal } : e))
        );
        if (onRefresh) onRefresh();
      }
    } catch {}
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/employees?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        setFeedback({ type: "success", msg: `Employee "${name}" deleted.` });
        setTimeout(() => setFeedback(null), 3000);
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: "error", msg: "Failed to delete employee." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error deleting employee." });
    }
  };

  // Section reordering
  const moveSection = (index: number, direction: "up" | "down") => {
    if (!pageConfig) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pageConfig.sections.length) return;

    const newSections = [...pageConfig.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    // re-assign order numbers
    newSections.forEach((s, idx) => {
      s.order = idx;
    });

    setPageConfig({
      ...pageConfig,
      sections: newSections,
    });
  };

  const toggleSectionVisibility = (id: OurPeopleSectionId) => {
    if (!pageConfig) return;
    setPageConfig({
      ...pageConfig,
      sections: pageConfig.sections.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s
      ),
    });
  };

  const filteredEmployees = employees.filter((e) => {
    const name = String(e.name || "").toLowerCase();
    const des = String(e.designation || "").toLowerCase();
    const dep = String(e.department || "").toLowerCase();
    const loc = String(e.location || "").toLowerCase();
    const query = memberSearch.toLowerCase();
    const matchesSearch = !query || name.includes(query) || des.includes(query) || dep.includes(query) || loc.includes(query);
    const matchesDept = deptFilter === "all" || String(e.department || "").toLowerCase() === deptFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  const availableDepts = Array.from(
    new Set(employees.map((e) => String(e.department || "")).filter(Boolean))
  );

  if (loading || !pageConfig) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading Our People CMS &amp; Team Data…</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 24 }}>
      {/* Top Banner & Quick Links */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em", background: "#FEF9C3", padding: "2px 8px", borderRadius: 4 }}>
              Section CMS &amp; Team Directory
            </span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              Total Members: <strong>{employees.length}</strong> (Active: {employees.filter((e) => e.active !== false).length})
            </span>
          </div>
          <h2 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "4px 0 0" }}>
            👥 Our People / Employee Experience Manager
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            Control the public &ldquo;Our People&rdquo; page layouts, Dr. Queens character animations, hero messaging, interactive filters, team cards, culture story, and SEO.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a
            href="/employee"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 14px",
              background: "#ffffff",
              color: "var(--purple)",
              border: "1px solid var(--purple)",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>👁️ Preview /employee</span>
            <span>↗</span>
          </a>
          <a
            href="/people"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 14px",
              background: "#ffffff",
              color: "#4f46e5",
              border: "1px solid #c7d2fe",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🔗 /people</span>
            <span>↗</span>
          </a>
          <button
            type="button"
            onClick={handleSavePageConfig}
            disabled={saving}
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg, #2A0F3A 0%, #4B1A66 100%)",
              color: "#ffffff",
              border: "1px solid #D4AF37",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {saving ? "Saving CMS Changes…" : "💾 Save All CMS Changes"}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 500,
            background: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: feedback.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${feedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
          }}
        >
          {feedback.type === "success" ? "✓ " : "✕ "}
          {feedback.msg}
        </div>
      )}

      {/* Top Nav Tabs */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid #e5e7eb", marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "sections", label: "🏗️ Section Builder & Visual CMS", badge: pageConfig.sections.length },
          { id: "members", label: "👥 Team Members Directory", badge: employees.length },
          { id: "categories", label: "🏷️ Category Chips & Filters", badge: pageConfig.categoryChips.length },
          { id: "design", label: "🎨 Design, Colors & Animations" },
          { id: "profile", label: "👤 Profile Page Settings" },
          { id: "seo", label: "🔍 SEO & Social Metadata" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as never)}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid #2A0F3A" : "3px solid transparent",
              background: activeTab === tab.id ? "#f5f3ff" : "transparent",
              color: activeTab === tab.id ? "#2A0F3A" : "#4b5563",
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: activeTab === tab.id ? "#2A0F3A" : "#e5e7eb",
                  color: activeTab === tab.id ? "#ffffff" : "#4b5563",
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: SECTIONS & VISUAL BUILDER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "sections" && (
        <div>
          {/* Section Ordering & Visibility Bar */}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
              📐 Page Layout &amp; Section Hierarchy (Drag / Reorder / Toggle)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pageConfig.sections.map((sec, idx) => {
                const isSelected = activeSectionId === sec.id;
                return (
                  <div
                    key={sec.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: isSelected ? "#f3e8ff" : "#ffffff",
                      border: `1px solid ${isSelected ? "#9333ea" : "#d1d5db"}`,
                      borderRadius: 6,
                      padding: "6px 10px",
                      opacity: sec.visible ? 1 : 0.6,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSectionId(sec.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: 12,
                        color: isSelected ? "#581c87" : "#1f2937",
                        textAlign: "left",
                        padding: 0,
                      }}
                    >
                      {sec.order + 1}. {sec.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility(sec.id)}
                      title={sec.visible ? "Section is Visible" : "Section is Hidden"}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        padding: 0,
                      }}
                    >
                      {sec.visible ? "👁️" : "🙈"}
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, "up")}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 8,
                          cursor: idx === 0 ? "not-allowed" : "pointer",
                          opacity: idx === 0 ? 0.3 : 1,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === pageConfig.sections.length - 1}
                        onClick={() => moveSection(idx, "down")}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 8,
                          cursor: idx === pageConfig.sections.length - 1 ? "not-allowed" : "pointer",
                          opacity: idx === pageConfig.sections.length - 1 ? 0.3 : 1,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section Specific Editors */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 20, background: "#ffffff" }}>
            {/* HERO SECTION */}
            {activeSectionId === "hero" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                      👑 Hero Stage Configuration
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                      Main headline, Dr. Queens character staging, speech bubble, cursive tagline, pill badges, and CTA triggers.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Eyebrow Badge</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.hero.eyebrow || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          hero: { ...pageConfig.hero, eyebrow: e.target.value },
                        })
                      }
                      placeholder="PEOPLE AT QUEENS CARE"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Highlighted Heading Word (Gold Accent)</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.hero.highlightedHeading || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          hero: { ...pageConfig.hero, highlightedHeading: e.target.value },
                        })
                      }
                      placeholder="Our Strength"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Main Heading Prefix</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.hero.heading || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          hero: { ...pageConfig.hero, heading: e.target.value },
                        })
                      }
                      placeholder="Our People"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Hero Description</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: 70 }}
                      value={pageConfig.hero.description || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          hero: { ...pageConfig.hero, description: e.target.value },
                        })
                      }
                      placeholder="A diverse team of passionate professionals..."
                    />
                  </div>
                </div>

                {/* Dr Queens Character Sub-Panel */}
                <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#6b21a8" }}>
                      👩‍⚕️ Dr. Queens Character &amp; Speech Bubble Settings
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={pageConfig.hero.character.enabled !== false}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              character: { ...pageConfig.hero.character, enabled: e.target.checked },
                            },
                          })
                        }
                      />
                      <span>Show Character in Hero</span>
                    </label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Character Main Image URL</label>
                      <input
                        style={inputStyle}
                        value={pageConfig.hero.character.imageUrl || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              character: { ...pageConfig.hero.character, imageUrl: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Blinking Eye Sprite URL (Optional)</label>
                      <input
                        style={inputStyle}
                        value={pageConfig.hero.character.blinkImageUrl || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              character: { ...pageConfig.hero.character, blinkImageUrl: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Speech Bubble Text</label>
                      <input
                        style={inputStyle}
                        value={pageConfig.hero.character.speechBubble || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              character: { ...pageConfig.hero.character, speechBubble: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Cursive Tagline</label>
                      <input
                        style={inputStyle}
                        value={pageConfig.hero.character.cursiveTagline || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              character: { ...pageConfig.hero.character, cursiveTagline: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Hero CTAs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "#f9fafb", padding: 12, borderRadius: 6, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Primary CTA Button</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        style={inputStyle}
                        placeholder="Button Label (e.g. Join Our Journey →)"
                        value={pageConfig.hero.primaryCta.label || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              primaryCta: { ...pageConfig.hero.primaryCta, label: e.target.value },
                            },
                          })
                        }
                      />
                      <input
                        style={inputStyle}
                        placeholder="Button URL (e.g. /careers)"
                        value={pageConfig.hero.primaryCta.url || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              primaryCta: { ...pageConfig.hero.primaryCta, url: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div style={{ background: "#f9fafb", padding: 12, borderRadius: 6, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Secondary CTA / Video Lightbox</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        style={inputStyle}
                        placeholder="Button Label (e.g. Watch Our Team Story)"
                        value={pageConfig.hero.secondaryCta.label || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              secondaryCta: { ...pageConfig.hero.secondaryCta, label: e.target.value },
                            },
                          })
                        }
                      />
                      <input
                        style={inputStyle}
                        placeholder="Video Lightbox URL (YouTube / MP4)"
                        value={pageConfig.hero.secondaryCta.videoUrl || pageConfig.hero.secondaryCta.url || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              secondaryCta: {
                                ...pageConfig.hero.secondaryCta,
                                url: e.target.value,
                                videoUrl: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Feature Pills */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>
                    Hero Feature Pills (Displayed directly under Dr. Queens &amp; Headline)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    {pageConfig.hero.features.map((feat, fIdx) => (
                      <div key={fIdx} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <input
                            style={{ ...inputStyle, width: 44, textAlign: "center" }}
                            value={feat.icon || ""}
                            onChange={(e) => {
                              const nextFeats = [...pageConfig.hero.features];
                              nextFeats[fIdx].icon = e.target.value;
                              setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, features: nextFeats } });
                            }}
                          />
                          <input
                            style={inputStyle}
                            placeholder="Title"
                            value={feat.title || ""}
                            onChange={(e) => {
                              const nextFeats = [...pageConfig.hero.features];
                              nextFeats[fIdx].title = e.target.value;
                              setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, features: nextFeats } });
                            }}
                          />
                        </div>
                        <input
                          style={inputStyle}
                          placeholder="Subtitle"
                          value={feat.subtitle || ""}
                          onChange={(e) => {
                            const nextFeats = [...pageConfig.hero.features];
                            nextFeats[fIdx].subtitle = e.target.value;
                            setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, features: nextFeats } });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Card & Values Plaque Editors */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Top Floating Card */}
                  <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>
                        💬 Floating Card (Above Dr. Queens)
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={pageConfig.hero.topCard?.enabled !== false}
                          onChange={(e) =>
                            setPageConfig({
                              ...pageConfig,
                              hero: {
                                ...pageConfig.hero,
                                topCard: {
                                  title: pageConfig.hero.topCard?.title || "Great ideas,",
                                  subtitle: pageConfig.hero.topCard?.subtitle || "dedicated people, healthier tomorrow!",
                                  icon: pageConfig.hero.topCard?.icon || "👑",
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                        <span>Visible</span>
                      </label>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          style={{ ...inputStyle, width: 44, textAlign: "center" }}
                          value={pageConfig.hero.topCard?.icon || "👑"}
                          onChange={(e) =>
                            setPageConfig({
                              ...pageConfig,
                              hero: {
                                ...pageConfig.hero,
                                topCard: {
                                  title: pageConfig.hero.topCard?.title || "",
                                  subtitle: pageConfig.hero.topCard?.subtitle || "",
                                  icon: e.target.value,
                                  enabled: pageConfig.hero.topCard?.enabled !== false,
                                },
                              },
                            })
                          }
                        />
                        <input
                          style={inputStyle}
                          placeholder="Heading (e.g. Great ideas,)"
                          value={pageConfig.hero.topCard?.title || ""}
                          onChange={(e) =>
                            setPageConfig({
                              ...pageConfig,
                              hero: {
                                ...pageConfig.hero,
                                topCard: {
                                  title: e.target.value,
                                  subtitle: pageConfig.hero.topCard?.subtitle || "",
                                  icon: pageConfig.hero.topCard?.icon || "👑",
                                  enabled: pageConfig.hero.topCard?.enabled !== false,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <input
                        style={inputStyle}
                        placeholder="Subtitle (e.g. dedicated people, healthier tomorrow!)"
                        value={pageConfig.hero.topCard?.subtitle || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              topCard: {
                                title: pageConfig.hero.topCard?.title || "",
                                subtitle: e.target.value,
                                icon: pageConfig.hero.topCard?.icon || "👑",
                                enabled: pageConfig.hero.topCard?.enabled !== false,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Values Plaque */}
                  <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>
                        🏛️ Corporate Values Plaque (Behind Character)
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={pageConfig.hero.plaque?.enabled !== false}
                          onChange={(e) =>
                            setPageConfig({
                              ...pageConfig,
                              hero: {
                                ...pageConfig.hero,
                                plaque: {
                                  eyebrow: pageConfig.hero.plaque?.eyebrow || "Core Ideals",
                                  title: pageConfig.hero.plaque?.title || "PEOPLE\nIDEAS\nSCIENCE\nCARE\nIMPACT",
                                  subtext: pageConfig.hero.plaque?.subtext || "QUEENS CARE LABORATORIES",
                                  icon: pageConfig.hero.plaque?.icon || "👑",
                                  companyName: pageConfig.hero.plaque?.companyName || "QUEENS CARE LABORATORIES",
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                        <span>Visible</span>
                      </label>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <input
                          style={inputStyle}
                          placeholder="Eyebrow (e.g. Core Ideals)"
                          value={pageConfig.hero.plaque?.eyebrow || ""}
                          onChange={(e) =>
                            setPageConfig({
                              ...pageConfig,
                              hero: {
                                ...pageConfig.hero,
                                plaque: {
                                  eyebrow: e.target.value,
                                  title: pageConfig.hero.plaque?.title || "",
                                  subtext: pageConfig.hero.plaque?.subtext || "",
                                  icon: pageConfig.hero.plaque?.icon || "👑",
                                  enabled: pageConfig.hero.plaque?.enabled !== false,
                                },
                              },
                            })
                          }
                        />
                        <input
                          style={inputStyle}
                          placeholder="Subtext / Brand"
                          value={pageConfig.hero.plaque?.subtext || ""}
                          onChange={(e) =>
                            setPageConfig({
                              ...pageConfig,
                              hero: {
                                ...pageConfig.hero,
                                plaque: {
                                  eyebrow: pageConfig.hero.plaque?.eyebrow || "",
                                  title: pageConfig.hero.plaque?.title || "",
                                  subtext: e.target.value,
                                  icon: pageConfig.hero.plaque?.icon || "👑",
                                  enabled: pageConfig.hero.plaque?.enabled !== false,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <textarea
                        style={{ ...inputStyle, minHeight: 60 }}
                        placeholder="Plaque Pillars (One word per line)"
                        value={pageConfig.hero.plaque?.title || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            hero: {
                              ...pageConfig.hero,
                              plaque: {
                                eyebrow: pageConfig.hero.plaque?.eyebrow || "",
                                title: e.target.value,
                                subtext: pageConfig.hero.plaque?.subtext || "",
                                icon: pageConfig.hero.plaque?.icon || "👑",
                                enabled: pageConfig.hero.plaque?.enabled !== false,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FILTER BAR SECTION */}
            {activeSectionId === "filterBar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                    🔍 Search &amp; Filter Bar Configuration
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    Configure the instant search input, department dropdown, location filter, role filter, and action button.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Search Input Placeholder</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.filterBar.searchPlaceholder || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          filterBar: { ...pageConfig.filterBar, searchPlaceholder: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Filter Button Label</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.filterBar.buttonLabel || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          filterBar: { ...pageConfig.filterBar, buttonLabel: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pageConfig.filterBar.showDepartmentDropdown !== false}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          filterBar: { ...pageConfig.filterBar, showDepartmentDropdown: e.target.checked },
                        })
                      }
                    />
                    <span>Show Department Dropdown</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pageConfig.filterBar.showLocationDropdown !== false}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          filterBar: { ...pageConfig.filterBar, showLocationDropdown: e.target.checked },
                        })
                      }
                    />
                    <span>Show Location Dropdown</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pageConfig.filterBar.showRoleDropdown !== false}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          filterBar: { ...pageConfig.filterBar, showRoleDropdown: e.target.checked },
                        })
                      }
                    />
                    <span>Show Role Dropdown</span>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Departments (One per line)</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: 120 }}
                      value={pageConfig.filterBar.departments.join("\n")}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          filterBar: {
                            ...pageConfig.filterBar,
                            departments: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Locations (One per line)</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: 120 }}
                      value={pageConfig.filterBar.locations.join("\n")}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          filterBar: {
                            ...pageConfig.filterBar,
                            locations: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY CHIPS */}
            {activeSectionId === "categoryChips" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                      🏷️ Team Category Carousel Chips
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                      Horizontal interactive pill badges that filter the directory grid with dynamic member counts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newChip = {
                        id: `cat-${Date.now()}`,
                        label: "New Category",
                        departmentKey: "all",
                        icon: "✦",
                        color: "#6B21A8",
                        visible: true,
                      };
                      setPageConfig({
                        ...pageConfig,
                        categoryChips: [...pageConfig.categoryChips, newChip],
                      });
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "#2A0F3A",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    + Add Category Chip
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pageConfig.categoryChips.map((chip, cIdx) => (
                    <div
                      key={chip.id || cIdx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "50px 1.5fr 1.5fr 1fr 60px 40px",
                        gap: 8,
                        alignItems: "center",
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        padding: "8px 12px",
                      }}
                    >
                      <input
                        style={{ ...inputStyle, textAlign: "center" }}
                        value={chip.icon || ""}
                        onChange={(e) => {
                          const updated = [...pageConfig.categoryChips];
                          updated[cIdx].icon = e.target.value;
                          setPageConfig({ ...pageConfig, categoryChips: updated });
                        }}
                      />
                      <input
                        style={inputStyle}
                        placeholder="Label"
                        value={chip.label}
                        onChange={(e) => {
                          const updated = [...pageConfig.categoryChips];
                          updated[cIdx].label = e.target.value;
                          setPageConfig({ ...pageConfig, categoryChips: updated });
                        }}
                      />
                      <input
                        style={inputStyle}
                        placeholder="Matches Dept (e.g. Leadership or all)"
                        value={chip.departmentKey}
                        onChange={(e) => {
                          const updated = [...pageConfig.categoryChips];
                          updated[cIdx].departmentKey = e.target.value;
                          setPageConfig({ ...pageConfig, categoryChips: updated });
                        }}
                      />
                      <input
                        style={inputStyle}
                        type="color"
                        value={chip.color || "#6B21A8"}
                        onChange={(e) => {
                          const updated = [...pageConfig.categoryChips];
                          updated[cIdx].color = e.target.value;
                          setPageConfig({ ...pageConfig, categoryChips: updated });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...pageConfig.categoryChips];
                          updated[cIdx].visible = updated[cIdx].visible === false ? true : false;
                          setPageConfig({ ...pageConfig, categoryChips: updated });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        {chip.visible !== false ? "👁️" : "🙈"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPageConfig({
                            ...pageConfig,
                            categoryChips: pageConfig.categoryChips.filter((_, idx) => idx !== cIdx),
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DIRECTORY GRID */}
            {activeSectionId === "directoryGrid" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                    📋 Directory Grid &amp; Card Presentation
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    Card layout columns, visible attributes, badges, and button labels.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Desktop Grid Columns</label>
                    <select
                      style={inputStyle}
                      value={pageConfig.directoryGrid.columnsDesktop}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, columnsDesktop: Number(e.target.value) },
                        })
                      }
                    >
                      <option value={4}>4 Columns (Recommended - Matches Reference)</option>
                      <option value={3}>3 Columns</option>
                      <option value={2}>2 Columns</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Max Cards Per Page</label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={pageConfig.directoryGrid.cardsPerPage}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, cardsPerPage: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, background: "#f9fafb", padding: 14, borderRadius: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pageConfig.directoryGrid.showDepartmentBadge !== false}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, showDepartmentBadge: e.target.checked },
                        })
                      }
                    />
                    <span>Show Department Badge</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pageConfig.directoryGrid.showQuote !== false}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, showQuote: e.target.checked },
                        })
                      }
                    />
                    <span>Show Quote</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pageConfig.directoryGrid.showSocialLinks !== false}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, showSocialLinks: e.target.checked },
                        })
                      }
                    />
                    <span>Show Social Links</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pageConfig.directoryGrid.showViewProfile !== false}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, showViewProfile: e.target.checked },
                        })
                      }
                    />
                    <span>Show &ldquo;View Profile →&rdquo; CTA</span>
                  </label>
                </div>

                {/* Custom Button Labels & Empty State Text */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>View Profile Button Text</label>
                    <input
                      style={inputStyle}
                      placeholder="e.g. View Profile →"
                      value={pageConfig.directoryGrid.viewProfileButtonLabel || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, viewProfileButtonLabel: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Verified Badge Label</label>
                    <input
                      style={inputStyle}
                      placeholder="e.g. ✓ Verified"
                      value={pageConfig.directoryGrid.verifiedBadgeLabel || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, verifiedBadgeLabel: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>
                    🔍 Empty State (When Filters Return 0 Members)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Empty State Heading</label>
                      <input
                        style={inputStyle}
                        placeholder="e.g. No Team Members Found"
                        value={pageConfig.directoryGrid.emptyStateTitle || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            directoryGrid: { ...pageConfig.directoryGrid, emptyStateTitle: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Reset Button Text</label>
                      <input
                        style={inputStyle}
                        placeholder="e.g. Reset All Filters"
                        value={pageConfig.directoryGrid.emptyStateResetButton || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            directoryGrid: { ...pageConfig.directoryGrid, emptyStateResetButton: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <label style={labelStyle}>Empty State Description</label>
                    <input
                      style={inputStyle}
                      placeholder="e.g. Try adjusting your search query or department filters."
                      value={pageConfig.directoryGrid.emptyStateDescription || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          directoryGrid: { ...pageConfig.directoryGrid, emptyStateDescription: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CULTURE SECTION */}
            {activeSectionId === "cultureSection" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                    🌍 Culture &amp; Team Story Section
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    Headline, narrative copy, glowing map graphic, and 3 key statistic counters.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Eyebrow</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.cultureSection.eyebrow || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          cultureSection: { ...pageConfig.cultureSection, eyebrow: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Section Heading</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.cultureSection.heading || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          cultureSection: { ...pageConfig.cultureSection, heading: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Narrative Description / Subtitle</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 70 }}
                    value={pageConfig.cultureSection.subtitle || ""}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        cultureSection: { ...pageConfig.cultureSection, subtitle: e.target.value },
                      })
                    }
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>CTA Button Label</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.cultureSection.cta.label || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          cultureSection: {
                            ...pageConfig.cultureSection,
                            cta: { ...pageConfig.cultureSection.cta, label: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CTA Button URL</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.cultureSection.cta.url || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          cultureSection: {
                            ...pageConfig.cultureSection,
                            cta: { ...pageConfig.cultureSection.cta, url: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Quote / Tagline Script</label>
                  <input
                    style={inputStyle}
                    value={pageConfig.cultureSection.quoteTagline || ""}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        cultureSection: { ...pageConfig.cultureSection, quoteTagline: e.target.value },
                      })
                    }
                  />
                </div>

                {/* 3 Stats */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>3 Core Metric Counters</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {pageConfig.cultureSection.stats.map((stat, sIdx) => (
                      <div key={sIdx} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: 10 }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <input
                            style={{ ...inputStyle, width: 44, textAlign: "center" }}
                            value={stat.icon || ""}
                            onChange={(e) => {
                              const updated = [...pageConfig.cultureSection.stats];
                              updated[sIdx].icon = e.target.value;
                              setPageConfig({
                                ...pageConfig,
                                cultureSection: { ...pageConfig.cultureSection, stats: updated },
                              });
                            }}
                          />
                          <input
                            style={inputStyle}
                            placeholder="Value (e.g. 50+)"
                            value={stat.value || ""}
                            onChange={(e) => {
                              const updated = [...pageConfig.cultureSection.stats];
                              updated[sIdx].value = e.target.value;
                              setPageConfig({
                                ...pageConfig,
                                cultureSection: { ...pageConfig.cultureSection, stats: updated },
                              });
                            }}
                          />
                        </div>
                        <input
                          style={inputStyle}
                          placeholder="Label (e.g. Team Members)"
                          value={stat.label || ""}
                          onChange={(e) => {
                            const updated = [...pageConfig.cultureSection.stats];
                            updated[sIdx].label = e.target.value;
                            setPageConfig({
                              ...pageConfig,
                              cultureSection: { ...pageConfig.cultureSection, stats: updated },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cursive Quote Card Editor */}
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>
                      ✒️ Cursive Quote Plaque (Featured Culture Statement)
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={pageConfig.cultureSection.quoteCard?.enabled !== false}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            cultureSection: {
                              ...pageConfig.cultureSection,
                              quoteCard: {
                                quote: pageConfig.cultureSection.quoteCard?.quote || "Together we make better health possible. ♡",
                                author: pageConfig.cultureSection.quoteCard?.author || "— Queens Care Laboratories",
                                cursiveFont: pageConfig.cultureSection.quoteCard?.cursiveFont !== false,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Statement / Quote Text</label>
                      <input
                        style={inputStyle}
                        placeholder="e.g. Together we make better health possible. ♡"
                        value={pageConfig.cultureSection.quoteCard?.quote || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            cultureSection: {
                              ...pageConfig.cultureSection,
                              quoteCard: {
                                quote: e.target.value,
                                author: pageConfig.cultureSection.quoteCard?.author || "— Queens Care Laboratories",
                                cursiveFont: pageConfig.cultureSection.quoteCard?.cursiveFont !== false,
                                enabled: pageConfig.cultureSection.quoteCard?.enabled !== false,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Author / Citation</label>
                      <input
                        style={inputStyle}
                        placeholder="e.g. — Queens Care Laboratories"
                        value={pageConfig.cultureSection.quoteCard?.author || ""}
                        onChange={(e) =>
                          setPageConfig({
                            ...pageConfig,
                            cultureSection: {
                              ...pageConfig.cultureSection,
                              quoteCard: {
                                quote: pageConfig.cultureSection.quoteCard?.quote || "",
                                author: e.target.value,
                                cursiveFont: pageConfig.cultureSection.quoteCard?.cursiveFont !== false,
                                enabled: pageConfig.cultureSection.quoteCard?.enabled !== false,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIFE AT QUEENS CARE */}
            {activeSectionId === "lifeSection" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                    ✨ Life at Queens Care (4 Interactive Cards)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    Configure the 4 core pillar cards: Collaborative Teams, World-Class Facilities, Meaningful Impact, and Positive Culture.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Section Heading</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.lifeSection.heading || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          lifeSection: { ...pageConfig.lifeSection, heading: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Section Subtitle</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.lifeSection.subtitle || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          lifeSection: { ...pageConfig.lifeSection, subtitle: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pageConfig.lifeSection.cards.map((card, cIdx) => (
                    <div key={card.id || cIdx} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "60px 1.5fr 1.5fr 2fr", gap: 10, marginBottom: 8 }}>
                        <div>
                          <label style={labelStyle}>Icon</label>
                          <input
                            style={{ ...inputStyle, textAlign: "center" }}
                            value={card.icon || ""}
                            onChange={(e) => {
                              const updated = [...pageConfig.lifeSection.cards];
                              updated[cIdx].icon = e.target.value;
                              setPageConfig({ ...pageConfig, lifeSection: { ...pageConfig.lifeSection, cards: updated } });
                            }}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Card Title</label>
                          <input
                            style={inputStyle}
                            value={card.title || ""}
                            onChange={(e) => {
                              const updated = [...pageConfig.lifeSection.cards];
                              updated[cIdx].title = e.target.value;
                              setPageConfig({ ...pageConfig, lifeSection: { ...pageConfig.lifeSection, cards: updated } });
                            }}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Card Subtitle / Tagline</label>
                          <input
                            style={inputStyle}
                            value={card.subtitle || ""}
                            onChange={(e) => {
                              const updated = [...pageConfig.lifeSection.cards];
                              updated[cIdx].subtitle = e.target.value;
                              setPageConfig({ ...pageConfig, lifeSection: { ...pageConfig.lifeSection, cards: updated } });
                            }}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Image URL</label>
                          <input
                            style={inputStyle}
                            value={card.imageUrl || ""}
                            onChange={(e) => {
                              const updated = [...pageConfig.lifeSection.cards];
                              updated[cIdx].imageUrl = e.target.value;
                              setPageConfig({ ...pageConfig, lifeSection: { ...pageConfig.lifeSection, cards: updated } });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Description</label>
                        <input
                          style={inputStyle}
                          value={card.description || ""}
                          onChange={(e) => {
                            const updated = [...pageConfig.lifeSection.cards];
                            updated[cIdx].description = e.target.value;
                            setPageConfig({ ...pageConfig, lifeSection: { ...pageConfig.lifeSection, cards: updated } });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RECRUITMENT CTA SECTION */}
            {activeSectionId === "ctaSection" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                    🎯 Bottom Recruitment CTA Section
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    Final invitation banner with Dr. Queens character, cursive script, and 4 trust badges.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Heading</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.ctaSection.heading || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          ctaSection: { ...pageConfig.ctaSection, heading: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Subtitle</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.ctaSection.subtitle || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          ctaSection: { ...pageConfig.ctaSection, subtitle: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>CTA Button Label</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.ctaSection.cta.label || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          ctaSection: {
                            ...pageConfig.ctaSection,
                            cta: { ...pageConfig.ctaSection.cta, label: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CTA Button URL</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.ctaSection.cta.url || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          ctaSection: {
                            ...pageConfig.ctaSection,
                            cta: { ...pageConfig.ctaSection.cta, url: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Dr. Queens Mascot Cursive Tagline</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.ctaSection.characterTagline || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          ctaSection: { ...pageConfig.ctaSection, characterTagline: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Character Avatar URL</label>
                    <input
                      style={inputStyle}
                      value={pageConfig.ctaSection.characterImageUrl || ""}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          ctaSection: { ...pageConfig.ctaSection, characterImageUrl: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* 4 Badges */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>4 Recruitment Trust Badges</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {pageConfig.ctaSection.badges.map((badge, bIdx) => (
                      <div key={bIdx} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: 8 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            style={{ ...inputStyle, width: 40, textAlign: "center" }}
                            value={badge.icon || ""}
                            onChange={(e) => {
                              const updated = [...pageConfig.ctaSection.badges];
                              updated[bIdx].icon = e.target.value;
                              setPageConfig({ ...pageConfig, ctaSection: { ...pageConfig.ctaSection, badges: updated } });
                            }}
                          />
                          <input
                            style={inputStyle}
                            value={badge.label || ""}
                            onChange={(e) => {
                              const updated = [...pageConfig.ctaSection.badges];
                              updated[bIdx].label = e.target.value;
                              setPageConfig({ ...pageConfig, ctaSection: { ...pageConfig.ctaSection, badges: updated } });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TRUST BADGES BAR SECTION */}
            {activeSectionId === "trustBadgesBar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                      🛡️ Trust Badges Strip (5 Executive Badges)
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                      Configure the 5 credibility credentials displayed on the public directory (Quality You Can Trust, GMP Certified, Doctor Formulated, Fast Delivery, Dedicated Support).
                    </p>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={pageConfig.trustBadgesBar?.enabled !== false}
                      onChange={(e) =>
                        setPageConfig({
                          ...pageConfig,
                          trustBadgesBar: {
                            badges: pageConfig.trustBadgesBar?.badges || [
                              { id: "tb-1", label: "Quality You Can Trust", subtitle: "Rigorous Testing Standards", icon: "🛡️", visible: true },
                              { id: "tb-2", label: "GMP Certified Facility", subtitle: "WHO-GMP Benchmark", icon: "🏭", visible: true },
                              { id: "tb-3", label: "Doctor Formulated", subtitle: "Clinical Grade Therapeutics", icon: "🩺", visible: true },
                              { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
                              { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
                            ],
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Section Enabled</span>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                  {(
                    pageConfig.trustBadgesBar?.badges || [
                      { id: "tb-1", label: "Quality You Can Trust", subtitle: "Rigorous Testing Standards", icon: "🛡️", visible: true },
                      { id: "tb-2", label: "GMP Certified Facility", subtitle: "WHO-GMP Benchmark", icon: "🏭", visible: true },
                      { id: "tb-3", label: "Doctor Formulated", subtitle: "Clinical Grade Therapeutics", icon: "🩺", visible: true },
                      { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
                      { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
                    ]
                  ).map((badge, bIdx) => (
                    <div
                      key={badge.id || bIdx}
                      style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
                          Badge {bIdx + 1}
                        </span>
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={badge.visible !== false}
                            onChange={(e) => {
                              const currentBadges = pageConfig.trustBadgesBar?.badges
                                ? [...pageConfig.trustBadgesBar.badges]
                                : [
                                    { id: "tb-1", label: "Quality You Can Trust", subtitle: "Rigorous Testing Standards", icon: "🛡️", visible: true },
                                    { id: "tb-2", label: "Quality Formulation", subtitle: "Controlled Lab Environment", icon: "🏭", visible: true },
                                    { id: "tb-3", label: "Scientific Research", subtitle: "Targeted Bioactive Formulas", icon: "🔬", visible: true },
                                    { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
                                    { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
                                  ];
                              currentBadges[bIdx] = { ...currentBadges[bIdx], visible: e.target.checked };
                              setPageConfig({
                                ...pageConfig,
                                trustBadgesBar: {
                                  enabled: pageConfig.trustBadgesBar?.enabled !== false,
                                  badges: currentBadges,
                                },
                              });
                            }}
                          />
                          <span>Show</span>
                        </label>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          style={{ ...inputStyle, width: 44, textAlign: "center" }}
                          value={badge.icon || ""}
                          onChange={(e) => {
                            const currentBadges = pageConfig.trustBadgesBar?.badges
                              ? [...pageConfig.trustBadgesBar.badges]
                              : [
                                  { id: "tb-1", label: "Quality You Can Trust", subtitle: "Rigorous Testing Standards", icon: "🛡️", visible: true },
                                  { id: "tb-2", label: "GMP Certified Facility", subtitle: "WHO-GMP Benchmark", icon: "🏭", visible: true },
                                  { id: "tb-3", label: "Doctor Formulated", subtitle: "Clinical Grade Therapeutics", icon: "🩺", visible: true },
                                  { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
                                  { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
                                ];
                            currentBadges[bIdx] = { ...currentBadges[bIdx], icon: e.target.value };
                            setPageConfig({
                              ...pageConfig,
                              trustBadgesBar: {
                                enabled: pageConfig.trustBadgesBar?.enabled !== false,
                                badges: currentBadges,
                              },
                            });
                          }}
                        />
                        <input
                          style={inputStyle}
                          placeholder="Badge Title"
                          value={badge.label || ""}
                          onChange={(e) => {
                            const currentBadges = pageConfig.trustBadgesBar?.badges
                              ? [...pageConfig.trustBadgesBar.badges]
                              : [
                                  { id: "tb-1", label: "Quality You Can Trust", subtitle: "Rigorous Testing Standards", icon: "🛡️", visible: true },
                                  { id: "tb-2", label: "GMP Certified Facility", subtitle: "WHO-GMP Benchmark", icon: "🏭", visible: true },
                                  { id: "tb-3", label: "Doctor Formulated", subtitle: "Clinical Grade Therapeutics", icon: "🩺", visible: true },
                                  { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
                                  { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
                                ];
                            currentBadges[bIdx] = { ...currentBadges[bIdx], label: e.target.value };
                            setPageConfig({
                              ...pageConfig,
                              trustBadgesBar: {
                                enabled: pageConfig.trustBadgesBar?.enabled !== false,
                                badges: currentBadges,
                              },
                            });
                          }}
                        />
                      </div>

                      <input
                        style={inputStyle}
                        placeholder="Subtitle / Tagline"
                        value={badge.subtitle || ""}
                        onChange={(e) => {
                          const currentBadges = pageConfig.trustBadgesBar?.badges
                            ? [...pageConfig.trustBadgesBar.badges]
                            : [
                                { id: "tb-1", label: "Quality You Can Trust", subtitle: "Rigorous Testing Standards", icon: "🛡️", visible: true },
                                { id: "tb-2", label: "GMP Certified Facility", subtitle: "WHO-GMP Benchmark", icon: "🏭", visible: true },
                                { id: "tb-3", label: "Doctor Formulated", subtitle: "Clinical Grade Therapeutics", icon: "🩺", visible: true },
                                { id: "tb-4", label: "Fast Pan-India Delivery", subtitle: "Direct to Your Doorstep", icon: "🚀", visible: true },
                                { id: "tb-5", label: "Dedicated Support", subtitle: "Pharmacist Advisory Line", icon: "💬", visible: true },
                              ];
                          currentBadges[bIdx] = { ...currentBadges[bIdx], subtitle: e.target.value };
                          setPageConfig({
                            ...pageConfig,
                            trustBadgesBar: {
                              enabled: pageConfig.trustBadgesBar?.enabled !== false,
                              badges: currentBadges,
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: TEAM MEMBERS DIRECTORY
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "members" && (
        <div>
          {/* Controls Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 300 }}>
              <input
                style={{ ...inputStyle, maxWidth: 280 }}
                placeholder="Search member by name, role, dept, or location…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              <select
                style={{ ...inputStyle, maxWidth: 200 }}
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments ({employees.length})</option>
                {availableDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {onAddEmployee && (
                <button
                  type="button"
                  onClick={onAddEmployee}
                  style={{
                    padding: "8px 16px",
                    background: "var(--purple)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add New Employee Profile
                </button>
              )}
            </div>
          </div>

          {/* Members Table */}
          <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
                  <th style={{ padding: "10px 14px", width: 60 }}>Photo</th>
                  <th style={{ padding: "10px 14px" }}>Name &amp; Slug</th>
                  <th style={{ padding: "10px 14px" }}>Designation</th>
                  <th style={{ padding: "10px 14px" }}>Department</th>
                  <th style={{ padding: "10px 14px" }}>Location</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>Featured</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 30, textAlign: "center", color: "#6b7280" }}>
                      No team members match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const id = String(emp.id || "");
                    const name = String(emp.name || "Unnamed");
                    const slug = String(emp.slug || id);
                    const photo = String(emp.profileImage || emp.photo || "/assets/placeholder-avatar.png");
                    const designation = String(emp.designation || "—");
                    const department = String(emp.department || "—");
                    const location = String(emp.location || "—");
                    const isActive = emp.active !== false;
                    const isFeatured = Boolean(emp.featured);

                    return (
                      <tr key={id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "10px 14px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt={name}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid #e5e7eb",
                            }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{name}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>/employee/{slug}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#374151" }}>{designation}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 11, background: "#f3e8ff", color: "#6b21a8", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                            {department}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#6b7280" }}>{location}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(id, isActive)}
                            style={{
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              borderRadius: 4,
                              border: `1px solid ${isActive ? "#a5d6a7" : "#ffcdd2"}`,
                              background: isActive ? "#e8f5e9" : "#ffebee",
                              color: isActive ? "#2e7d32" : "#c62828",
                              cursor: "pointer",
                            }}
                          >
                            {isActive ? "● ACTIVE" : "○ INACTIVE"}
                          </button>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(id, isFeatured)}
                            style={{
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 4,
                              border: `1px solid ${isFeatured ? "#fde68a" : "#e5e7eb"}`,
                              background: isFeatured ? "#fef3c7" : "#ffffff",
                              color: isFeatured ? "#92400e" : "#9ca3af",
                              cursor: "pointer",
                            }}
                          >
                            {isFeatured ? "⭐ FEATURED" : "☆ Standard"}
                          </button>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                            <a
                              href={`/employee/${slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "4px 8px",
                                background: "#f3f4f6",
                                color: "#374151",
                                borderRadius: 4,
                                textDecoration: "none",
                                fontSize: 12,
                              }}
                              title="Preview Profile Page"
                            >
                              👁️
                            </a>
                            {onEditEmployee && (
                              <button
                                type="button"
                                onClick={() => onEditEmployee(emp)}
                                style={{
                                  padding: "4px 10px",
                                  background: "#f5f3ff",
                                  border: "1px solid #ddd6fe",
                                  color: "#6d28d9",
                                  borderRadius: 4,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Edit ✏️
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(id, name)}
                              style={{
                                padding: "4px 8px",
                                background: "#fee2e2",
                                border: "1px solid #fca5a5",
                                color: "#b91c1c",
                                borderRadius: 4,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                              title="Delete Member"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: CATEGORIES & CHIPS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "categories" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                🏷️ Category Chips &amp; Departments
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                Define filterable categories shown in the horizontal carousel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newChip = {
                  id: `cat-${Date.now()}`,
                  label: "New Category",
                  departmentKey: "all",
                  icon: "✦",
                  color: "#6B21A8",
                  visible: true,
                };
                setPageConfig({
                  ...pageConfig,
                  categoryChips: [...pageConfig.categoryChips, newChip],
                });
              }}
              style={{
                padding: "8px 14px",
                background: "var(--purple)",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add Category
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {pageConfig.categoryChips.map((chip, idx) => (
              <div
                key={chip.id || idx}
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{chip.icon || "👥"}</span>
                    <strong style={{ color: "#1f2937" }}>{chip.label}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPageConfig({
                        ...pageConfig,
                        categoryChips: pageConfig.categoryChips.filter((_, cI) => cI !== idx),
                      });
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      fontSize: 14,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input
                      style={inputStyle}
                      value={chip.label}
                      onChange={(e) => {
                        const updated = [...pageConfig.categoryChips];
                        updated[idx].label = e.target.value;
                        setPageConfig({ ...pageConfig, categoryChips: updated });
                      }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Icon Emoji</label>
                    <input
                      style={inputStyle}
                      value={chip.icon || ""}
                      onChange={(e) => {
                        const updated = [...pageConfig.categoryChips];
                        updated[idx].icon = e.target.value;
                        setPageConfig({ ...pageConfig, categoryChips: updated });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Matches Department Name</label>
                  <input
                    style={inputStyle}
                    value={chip.departmentKey}
                    onChange={(e) => {
                      const updated = [...pageConfig.categoryChips];
                      updated[idx].departmentKey = e.target.value;
                      setPageConfig({ ...pageConfig, categoryChips: updated });
                    }}
                    placeholder="e.g. Leadership or all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: SEO & SOCIAL METADATA
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "seo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
              🔍 Search Engine Optimization &amp; Social Previews
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
              Manage title tags, meta descriptions, and OpenGraph social share cards for both /employee and /people.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Meta Title</label>
              <input
                style={inputStyle}
                value={pageConfig.seo.metaTitle || ""}
                onChange={(e) =>
                  setPageConfig({
                    ...pageConfig,
                    seo: { ...pageConfig.seo, metaTitle: e.target.value },
                  })
                }
                placeholder="Our People, Our Strength — Queens Care Laboratories"
              />
            </div>

            <div>
              <label style={labelStyle}>Meta Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: 75 }}
                value={pageConfig.seo.metaDescription || ""}
                onChange={(e) =>
                  setPageConfig({
                    ...pageConfig,
                    seo: { ...pageConfig.seo, metaDescription: e.target.value },
                  })
                }
                placeholder="Meet the visionary leaders, formulation scientists, regulatory directors..."
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Keywords (Comma-separated)</label>
                <input
                  style={inputStyle}
                  value={pageConfig.seo.keywords || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      seo: { ...pageConfig.seo, keywords: e.target.value },
                    })
                  }
                  placeholder="Queens Care Leadership, Pharmaceutical Scientists, Medical Directors"
                />
              </div>
              <div>
                <label style={labelStyle}>Social Share Image URL (og:image)</label>
                <input
                  style={inputStyle}
                  value={pageConfig.seo.ogImage || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      seo: { ...pageConfig.seo, ogImage: e.target.value },
                    })
                  }
                  placeholder="/images/hero/dr-queens-hd.webp"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: DESIGN, COLORS & ANIMATIONS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "design" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
              🎨 Visual Design, Colors &amp; Character Animations
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
              Full control over brand palette, gradients, typography, and Dr. Queens interactive animations.
            </p>
          </div>

          {/* Color Palette Panel */}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
              🌈 Brand Colors &amp; Section Gradients
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div>
                <label style={labelStyle}>Page Background Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    style={{ width: 40, height: 36, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }}
                    value={pageConfig.theme?.primaryBg || "#FAF8F5"}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        theme: { ...(pageConfig.theme || {}), primaryBg: e.target.value },
                      })
                    }
                  />
                  <input
                    style={inputStyle}
                    value={pageConfig.theme?.primaryBg || "#FAF8F5"}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        theme: { ...(pageConfig.theme || {}), primaryBg: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Gold Accent Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    style={{ width: 40, height: 36, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }}
                    value={pageConfig.theme?.goldAccent || "#D4AF37"}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        theme: { ...(pageConfig.theme || {}), goldAccent: e.target.value },
                      })
                    }
                  />
                  <input
                    style={inputStyle}
                    value={pageConfig.theme?.goldAccent || "#D4AF37"}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        theme: { ...(pageConfig.theme || {}), goldAccent: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Heading Text Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    style={{ width: 40, height: 36, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }}
                    value={pageConfig.theme?.headingColor || "#2A0F3A"}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        theme: { ...(pageConfig.theme || {}), headingColor: e.target.value },
                      })
                    }
                  />
                  <input
                    style={inputStyle}
                    value={pageConfig.theme?.headingColor || "#2A0F3A"}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        theme: { ...(pageConfig.theme || {}), headingColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Body Text Color</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    style={{ width: 40, height: 36, padding: 0, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer" }}
                    value={pageConfig.theme?.textColor || "#180927"}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        theme: { ...(pageConfig.theme || {}), textColor: e.target.value },
                      })
                    }
                  />
                  <input
                    style={inputStyle}
                    value={pageConfig.theme?.textColor || "#180927"}
                    onChange={(e) =>
                      setPageConfig({
                        ...pageConfig,
                        theme: { ...(pageConfig.theme || {}), textColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div>
                <label style={labelStyle}>Hero Stage Background CSS (Gradient or Solid)</label>
                <input
                  style={inputStyle}
                  value={pageConfig.theme?.heroBgGradient || "linear-gradient(135deg, #180927 0%, #2A0F3A 45%, #150522 100%)"}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      theme: { ...(pageConfig.theme || {}), heroBgGradient: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Culture Section Background CSS (Gradient or Solid)</label>
                <input
                  style={inputStyle}
                  value={pageConfig.theme?.cultureBgGradient || "linear-gradient(135deg, #1C0A2E 0%, #2A0F3A 50%, #150522 100%)"}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      theme: { ...(pageConfig.theme || {}), cultureBgGradient: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Character & Physics Animations Panel */}
          <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6b21a8", marginBottom: 12 }}>
              ✨ Interactive Character Animations &amp; Physics
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={pageConfig.animations?.masterEnabled !== false}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      animations: { ...(pageConfig.animations || {}), masterEnabled: e.target.checked },
                    })
                  }
                />
                <span>Master Animations Enabled</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={pageConfig.animations?.drQueensBlink !== false}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      animations: { ...(pageConfig.animations || {}), drQueensBlink: e.target.checked },
                    })
                  }
                />
                <span>Dr. Queens Eye Blinking Loop</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={pageConfig.animations?.particlesEnabled !== false}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      animations: { ...(pageConfig.animations || {}), particlesEnabled: e.target.checked },
                    })
                  }
                />
                <span>Floating Ambient Particles</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={Boolean(pageConfig.animations?.reducedMotion)}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      animations: { ...(pageConfig.animations || {}), reducedMotion: e.target.checked },
                    })
                  }
                />
                <span>Force Reduced Motion</span>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Animation Speed Multiplier ({pageConfig.animations?.speed ?? 1.0}x)</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  style={{ width: "100%" }}
                  value={pageConfig.animations?.speed ?? 1.0}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      animations: { ...(pageConfig.animations || {}), speed: Number(e.target.value) },
                    })
                  }
                />
              </div>

              <div>
                <label style={labelStyle}>Hero Parallax Depth ({pageConfig.animations?.parallaxAmount ?? 16}px)</label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  style={{ width: "100%" }}
                  value={pageConfig.animations?.parallaxAmount ?? 16}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      animations: { ...(pageConfig.animations || {}), parallaxAmount: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: PROFILE PAGE SETTINGS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
              👤 Individual Employee Detail Page Defaults (/employee/[slug] &amp; /people/[slug])
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
              Configure global defaults, breadcrumbs, action button labels, section headers, and QR verification modal copy.
            </p>
          </div>

          {/* Breadcrumbs & Verified Badge */}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
              🧭 Navigation Breadcrumbs &amp; Verified Credential Badge
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Breadcrumb Home Text</label>
                <input
                  style={inputStyle}
                  placeholder="Home"
                  value={pageConfig.profileDefaults?.breadcrumbHome || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        breadcrumbHome: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Breadcrumb People Text</label>
                <input
                  style={inputStyle}
                  placeholder="Our People"
                  value={pageConfig.profileDefaults?.breadcrumbPeople || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        breadcrumbPeople: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Verified Staff Badge Text</label>
                <input
                  style={inputStyle}
                  placeholder="Official Staff Credential • Verified"
                  value={pageConfig.profileDefaults?.verifiedBadgeText || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        verifiedBadgeText: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
              🔘 Profile Action Button Labels
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div>
                <label style={labelStyle}>Download PDF Button Label</label>
                <input
                  style={inputStyle}
                  placeholder="Download ID Card / Print PDF"
                  value={pageConfig.profileDefaults?.downloadPdfButtonText || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        downloadPdfButtonText: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Email Button Label Prefix</label>
                <input
                  style={inputStyle}
                  placeholder="Email"
                  value={pageConfig.profileDefaults?.emailButtonLabel || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        emailButtonLabel: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>LinkedIn Button Label</label>
                <input
                  style={inputStyle}
                  placeholder="Connect on LinkedIn"
                  value={pageConfig.profileDefaults?.linkedInButtonLabel || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        linkedInButtonLabel: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Add to Cart Button Label</label>
                <input
                  style={inputStyle}
                  placeholder="+ Add to Cart"
                  value={pageConfig.profileDefaults?.addToCartButtonText || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        addToCartButtonText: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section Headings */}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
              📑 Detail Page Section Titles
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Overview Section Heading</label>
                <input
                  style={inputStyle}
                  placeholder="Executive Overview & Clinical Journey"
                  value={pageConfig.profileDefaults?.aboutSectionTitle || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        aboutSectionTitle: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Media Section Heading</label>
                <input
                  style={inputStyle}
                  placeholder="Key Moments, Keynotes & Media Showcase"
                  value={pageConfig.profileDefaults?.mediaSectionTitle || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        mediaSectionTitle: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Formulations Section Heading</label>
                <input
                  style={inputStyle}
                  placeholder="Formulations Under Oversight"
                  value={pageConfig.profileDefaults?.productsSectionTitle || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        productsSectionTitle: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Verification Card Heading</label>
                <input
                  style={inputStyle}
                  placeholder="Official Employment Verification"
                  value={pageConfig.profileDefaults?.verificationSectionTitle || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        verificationSectionTitle: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Leadership Peers Section Heading</label>
                <input
                  style={inputStyle}
                  placeholder="Leadership & Team Peers"
                  value={pageConfig.profileDefaults?.teamSectionTitle || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        teamSectionTitle: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Key Stats Section Heading</label>
                <input
                  style={inputStyle}
                  placeholder="Key Performance & Research Milestones"
                  value={pageConfig.profileDefaults?.statsSectionTitle || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        statsSectionTitle: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* QR Verification Modal */}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
              📱 QR Verification Modal Content
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>QR Modal Title</label>
                <input
                  style={inputStyle}
                  placeholder="Queens Care Staff Authentication"
                  value={pageConfig.profileDefaults?.qrModalTitle || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        qrModalTitle: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>QR Modal Subtitle</label>
                <input
                  style={inputStyle}
                  placeholder="Official Staff Credential Verification"
                  value={pageConfig.profileDefaults?.qrModalSubtitle || ""}
                  onChange={(e) =>
                    setPageConfig({
                      ...pageConfig,
                      profileDefaults: {
                        ...(pageConfig.profileDefaults || {}),
                        qrModalSubtitle: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>QR Modal Instructions / Help Text</label>
              <textarea
                style={{ ...inputStyle, minHeight: 60 }}
                placeholder="Scan with any camera or QR reader to authenticate this employee's clinical credential on the Queens Care network."
                value={pageConfig.profileDefaults?.qrModalInstructions || ""}
                onChange={(e) =>
                  setPageConfig({
                    ...pageConfig,
                    profileDefaults: {
                      ...(pageConfig.profileDefaults || {}),
                      qrModalInstructions: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
