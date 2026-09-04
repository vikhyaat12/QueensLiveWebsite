"use client";

import React, { useState, useEffect } from "react";
import GlobalMediaUploader from "../components/GlobalMediaUploader";

export default function StoryCMSManager({ onBack }: { onBack?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const [form, setForm] = useState<Record<string, any>>({
    title: "Our Story — Science Made Personal",
    subtitle: "The founding conviction of Queens Care Laboratories.",
    heroEyebrow: "QUEENS CARE LABORATORIES",
    heroHeading: "Born from clinical rigor. <em>Formulated for life.</em>",
    heroLead: "We founded Queens Care Laboratories on a singular conviction: that the products living on your vanity, medicine cabinet, and bedside table should be held to the same unyielding pharmaceutical benchmarks as hospital-grade medicine.",
    heroImage: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=85",
    heroVideo: "",
    originHeading: "The Queens Care Origin",
    originText: "In 2023, our founding team of pharmaceutical formulation chemists and clinical investigators observed an alarming divergence: wellness products were flooded with marketing claims but under-dosed actives, while traditional pharmaceuticals felt clinical, impersonal, and distant.\n\nWe set out to unite both worlds — therapeutic purity, precision concentration, and considered daily ritual.",
    stat1Number: "100%",
    stat1Label: "Batch Verified Purity",
    stat2Number: "100%",
    stat2Label: "Full INCI Disclosure",
    stat3Number: "0.0%",
    stat3Label: "Synthetic Diluents",
    sections: [
      { heading: "Pharmaceutical Rigor", text: "Every formula begins with double-blind peer-reviewed literature, validated dosing protocols, and stringent heavy-metal assays." },
      { heading: "Uncompromising Transparency", text: "Full batch disclosure, certificates of analysis on demand, and active ingredient percentages printed clearly on every bottle." },
      { heading: "Considered Sensory Ritual", text: "Health is sustained by habits. We craft textures, aromas, and packaging that elevate self-care into a moment of intentional pause." }
    ],
    milestones: [
      { year: "2023", title: "Laboratory Inception", description: "Established advanced formulation R&D cleanroom in New Delhi." },
      { year: "2024", title: "Clinical Partner Network", description: "Established collaboration network with certified dermatologists and clinic practitioners." },
      { year: "2025", title: "Therapeutic Portfolio Expansion", description: "Formulated LUMINE-C™, LIKO-Q™, and cellular antioxidant suspensions." },
      { year: "2026", title: "Cold-Chain Direct Distribution", description: "Direct-to-consumer and clinic distribution across major Indian metro networks." }
    ],
    ctaHeading: "Experience pharmaceutical-grade personal care.",
    ctaText: "Explore Our Formulations",
    ctaLink: "/shop",
    backgroundColor: "",
    textColor: ""
  });

  useEffect(() => {
    fetch("/api/content/about")
      .then((r) => r.json())
      .then((d) => {
        if (d.content && d.content.value) {
          setForm((prev) => ({ ...prev, ...d.content.value }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg("");
    setIsError(false);
    try {
      const res = await fetch("/api/content/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: form }),
      });
      if (res.ok) {
        setMsg("Our Story CMS saved successfully!");
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error || "Failed to save.");
        setIsError(true);
      }
    } catch {
      setMsg("Network error while saving.");
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--line, #ddd)",
    borderRadius: 4,
    fontSize: 13,
    background: "#fff",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".06em",
    color: "var(--purple, #2A0F3A)",
    marginBottom: 4,
  };

  if (loading) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--muted)" }}>Loading Our Story CMS…</div>;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: 24 }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          {onBack && (
            <button
              onClick={onBack}
              style={{ background: "none", border: "none", color: "var(--purple)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, marginBottom: 4 }}
            >
              ← Back to Pages
            </button>
          )}
          <h3 style={{ font: "22px var(--font-display, serif)", color: "var(--purple)", margin: 0 }}>
            Our Story CMS — Flagship Brand Page
          </h3>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>
            Fully manage the public &ldquo;/about&rdquo; page narrative, clinical pillars, milestones, laboratory imagery, and CTAs.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 16px",
              background: "#fff",
              color: "var(--purple)",
              border: "1px solid var(--purple)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>👁️ Preview Our Story</span>
            <span>↗</span>
          </a>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: "var(--purple)",
              color: "#D4AF37",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: 20,
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            background: isError ? "#ffebee" : "#e8f5e9",
            color: isError ? "#c62828" : "#2e7d32",
            border: `1px solid ${isError ? "#ffcdd2" : "#a5d6a7"}`,
          }}
        >
          {msg}
        </div>
      )}

      {/* Hero Banner Section */}
      <div style={{ marginBottom: 24, padding: 18, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
          1. Hero Header & Headline
        </h4>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>Hero Eyebrow</label>
            <input
              style={inputStyle}
              value={form.heroEyebrow || ""}
              onChange={(e) => setForm({ ...form, heroEyebrow: e.target.value })}
              placeholder="QUEENS CARE LABORATORIES"
            />
          </div>
          <div>
            <label style={labelStyle}>Hero Heading (supports &lt;em&gt;)</label>
            <input
              style={inputStyle}
              value={form.heroHeading || ""}
              onChange={(e) => setForm({ ...form, heroHeading: e.target.value })}
              placeholder="Born from clinical rigor. <em>Formulated for life.</em>"
            />
          </div>
          <div>
            <label style={labelStyle}>Hero Lead Paragraph</label>
            <textarea
              style={{ ...inputStyle, minHeight: 70 }}
              value={form.heroLead || ""}
              onChange={(e) => setForm({ ...form, heroLead: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <GlobalMediaUploader
                label="Hero Laboratory Photo"
                preset="banner_desktop"
                value={form.heroImage || ""}
                onChange={(url) => setForm({ ...form, heroImage: url })}
                folder="about"
              />
            </div>
            <div>
              <label style={labelStyle}>Hero Video URL (Optional MP4)</label>
              <input
                style={inputStyle}
                value={form.heroVideo || ""}
                onChange={(e) => setForm({ ...form, heroVideo: e.target.value })}
                placeholder="https://example.com/video.mp4"
              />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>If provided, video will play instead of static image.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Stats */}
      <div style={{ marginBottom: 24, padding: 18, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
          2. Clinical Verification Stats
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Stat 1 Value</label>
            <input
              style={inputStyle}
              value={form.stat1Number || ""}
              onChange={(e) => setForm({ ...form, stat1Number: e.target.value })}
              placeholder="100%"
            />
            <label style={{ ...labelStyle, marginTop: 6 }}>Stat 1 Label</label>
            <input
              style={inputStyle}
              value={form.stat1Label || ""}
              onChange={(e) => setForm({ ...form, stat1Label: e.target.value })}
              placeholder="Batch Verified Purity"
            />
          </div>
          <div>
            <label style={labelStyle}>Stat 2 Value</label>
            <input
              style={inputStyle}
              value={form.stat2Number || ""}
              onChange={(e) => setForm({ ...form, stat2Number: e.target.value })}
              placeholder="GMP / ISO"
            />
            <label style={{ ...labelStyle, marginTop: 6 }}>Stat 2 Label</label>
            <input
              style={inputStyle}
              value={form.stat2Label || ""}
              onChange={(e) => setForm({ ...form, stat2Label: e.target.value })}
              placeholder="Certified Laboratory"
            />
          </div>
          <div>
            <label style={labelStyle}>Stat 3 Value</label>
            <input
              style={inputStyle}
              value={form.stat3Number || ""}
              onChange={(e) => setForm({ ...form, stat3Number: e.target.value })}
              placeholder="0.0%"
            />
            <label style={{ ...labelStyle, marginTop: 6 }}>Stat 3 Label</label>
            <input
              style={inputStyle}
              value={form.stat3Label || ""}
              onChange={(e) => setForm({ ...form, stat3Label: e.target.value })}
              placeholder="Synthetic Diluents"
            />
          </div>
        </div>
      </div>

      {/* Origin Narrative */}
      <div style={{ marginBottom: 24, padding: 18, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
          3. Origin & Founding Narrative
        </h4>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>Origin Heading</label>
            <input
              style={inputStyle}
              value={form.originHeading || ""}
              onChange={(e) => setForm({ ...form, originHeading: e.target.value })}
              placeholder="The Queens Care Origin"
            />
          </div>
          <div>
            <label style={labelStyle}>Origin Narrative (supports line breaks)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 100 }}
              value={form.originText || ""}
              onChange={(e) => setForm({ ...form, originText: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Formulation Pillars / Sections */}
      <div style={{ marginBottom: 24, padding: 18, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: 0 }}>
            4. Formulation Pillars ({(form.sections || []).length})
          </h4>
          <button
            type="button"
            onClick={() => {
              const secs = [...(form.sections || [])];
              secs.push({ heading: "New Pillar", text: "Pillar description." });
              setForm({ ...form, sections: secs });
            }}
            style={{ padding: "4px 10px", fontSize: 11, background: "var(--purple)", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}
          >
            + Add Pillar
          </button>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {(form.sections || []).map((sec: any, sIdx: number) => (
            <div key={sIdx} style={{ padding: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)" }}>Pillar 0{sIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const secs = form.sections.filter((_: any, i: number) => i !== sIdx);
                    setForm({ ...form, sections: secs });
                  }}
                  style={{ padding: "2px 6px", fontSize: 10, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", cursor: "pointer" }}
                >
                  ✕ Remove
                </button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <input
                  style={inputStyle}
                  value={sec.heading || ""}
                  onChange={(e) => {
                    const secs = [...form.sections];
                    secs[sIdx] = { ...secs[sIdx], heading: e.target.value };
                    setForm({ ...form, sections: secs });
                  }}
                  placeholder="Pillar Title"
                />
                <textarea
                  style={{ ...inputStyle, minHeight: 50 }}
                  value={sec.text || ""}
                  onChange={(e) => {
                    const secs = [...form.sections];
                    secs[sIdx] = { ...secs[sIdx], text: e.target.value };
                    setForm({ ...form, sections: secs });
                  }}
                  placeholder="Pillar Description"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Timeline */}
      <div style={{ marginBottom: 24, padding: 18, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: 0 }}>
            5. Milestone Timeline ({(form.milestones || []).length})
          </h4>
          <button
            type="button"
            onClick={() => {
              const ms = [...(form.milestones || [])];
              ms.push({ year: "2026", title: "New Milestone", description: "Milestone description." });
              setForm({ ...form, milestones: ms });
            }}
            style={{ padding: "4px 10px", fontSize: 11, background: "var(--purple)", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}
          >
            + Add Milestone
          </button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {(form.milestones || []).map((m: any, mIdx: number) => (
            <div key={mIdx} style={{ display: "grid", gridTemplateColumns: "80px 200px 1fr 30px", gap: 8, alignItems: "center", background: "#fff", padding: 8, border: "1px solid var(--line)", borderRadius: 4 }}>
              <input
                style={inputStyle}
                value={m.year || ""}
                onChange={(e) => {
                  const ms = [...form.milestones];
                  ms[mIdx] = { ...ms[mIdx], year: e.target.value };
                  setForm({ ...form, milestones: ms });
                }}
                placeholder="2026"
              />
              <input
                style={inputStyle}
                value={m.title || ""}
                onChange={(e) => {
                  const ms = [...form.milestones];
                  ms[mIdx] = { ...ms[mIdx], title: e.target.value };
                  setForm({ ...form, milestones: ms });
                }}
                placeholder="Milestone Title"
              />
              <input
                style={inputStyle}
                value={m.description || ""}
                onChange={(e) => {
                  const ms = [...form.milestones];
                  ms[mIdx] = { ...ms[mIdx], description: e.target.value };
                  setForm({ ...form, milestones: ms });
                }}
                placeholder="Description"
              />
              <button
                type="button"
                onClick={() => {
                  const ms = form.milestones.filter((_: any, i: number) => i !== mIdx);
                  setForm({ ...form, milestones: ms });
                }}
                style={{ padding: "4px 6px", fontSize: 10, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Banner */}
      <div style={{ marginBottom: 24, padding: 18, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 6 }}>
        <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
          6. Bottom Call to Action
        </h4>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={labelStyle}>CTA Heading</label>
            <input
              style={inputStyle}
              value={form.ctaHeading || ""}
              onChange={(e) => setForm({ ...form, ctaHeading: e.target.value })}
              placeholder="Experience pharmaceutical-grade personal care."
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Button Label</label>
              <input
                style={inputStyle}
                value={form.ctaText || ""}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                placeholder="Explore Our Formulations"
              />
            </div>
            <div>
              <label style={labelStyle}>Button Link</label>
              <input
                style={inputStyle}
                value={form.ctaLink || ""}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                placeholder="/shop"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "10px 24px",
            background: "var(--purple)",
            color: "#D4AF37",
            border: "none",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving…" : "💾 Save Our Story CMS"}
        </button>
      </div>
    </div>
  );
}
