"use client";

import { useState } from "react";
import GlobalMediaUploader from "../components/GlobalMediaUploader";

const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

/* ─── BANNER EDIT FORM ─── */
export function BannerEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/banners" : `/api/admin/banners/${form.id}`;
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Banner saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save banner.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 640, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Banner" : "Edit Banner"}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><label style={labelStyle}>Subtitle</label><input style={inputStyle} value={String(form.subtitle || "")} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
        
        {/* Global Desktop Media */}
        <GlobalMediaUploader
          label="Desktop Banner Media (Image / Video MP4 / YouTube / Vimeo / GIF)"
          preset="banner_desktop"
          allowVideo
          value={String(form.image || form.imageUrl || form.videoUrl || "")}
          onChange={(val) => {
            const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0]?.url) : "";
            setForm({ ...form, image: url, imageUrl: url, videoUrl: url.includes(".mp4") || url.includes("youtu") || url.includes("vimeo") ? url : "" });
          }}
          folder="banners"
        />

        {/* Global Mobile Media */}
        <GlobalMediaUploader
          label="Mobile Banner Media (optional vertical format)"
          preset="banner_mobile"
          allowVideo
          value={String(form.mobileImage || form.mobileImageUrl || "")}
          onChange={(val) => {
            const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0]?.url) : "";
            setForm({ ...form, mobileImage: url, mobileImageUrl: url });
          }}
          folder="banners"
        />

        <div><label style={labelStyle}>Link / CTA URL</label><input style={inputStyle} value={String(form.link || form.linkUrl || "")} onChange={e => setForm({ ...form, link: e.target.value, linkUrl: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Position</label><select style={inputStyle} value={String(form.position || "hero")} onChange={e => setForm({ ...form, position: e.target.value })}>
            <option value="hero">Hero (Homepage)</option><option value="top">Top Notice</option><option value="bottom">Bottom Promo</option><option value="sidebar">Sidebar</option><option value="shop">Shop Page</option>
          </select></div>
          <div><label style={labelStyle}>Sort order</label><input type="number" style={inputStyle} value={Number(form.sort || 0)} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></div>
          <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label></div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Banner →"}</button>
      </div>
    </div>
  );
}

/* ─── TESTIMONIAL EDIT FORM ─── */
export function TestimonialEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/testimonials" : `/api/admin/testimonials/${form.id}`;
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Testimonial saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save testimonial.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 640, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Testimonial" : "Edit Testimonial"}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Name *</label><input style={inputStyle} value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label style={labelStyle}>Title / Role</label><input style={inputStyle} value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        </div>
        <div><label style={labelStyle}>Review / Testimonial *</label><textarea style={{ ...inputStyle, minHeight: 90 }} value={String(form.body || "")} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
        
        {/* Testimonial Image / Video */}
        <GlobalMediaUploader
          label="Testimonial Photo or Video Review (Image / MP4 / YouTube / Vimeo)"
          preset="testimonial"
          allowVideo
          value={String(form.image || form.videoUrl || form.video || "")}
          onChange={(val) => {
            const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0]?.url) : "";
            if (url.includes(".mp4") || url.includes("youtu") || url.includes("vimeo")) {
              setForm({ ...form, videoUrl: url, video: url, image: url });
            } else {
              setForm({ ...form, image: url });
            }
          }}
          folder="testimonials"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Rating (1-5)</label><input type="number" min={1} max={5} style={inputStyle} value={Number(form.rating || 5)} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} /></div>
          <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.visible !== false} onChange={e => setForm({ ...form, visible: e.target.checked })} /> Visible on Public Site</label></div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Testimonial →"}</button>
      </div>
    </div>
  );
}

/* ─── OFFER EDIT FORM ─── */
export function OfferEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/offers" : `/api/admin/offers/${form.id}`;
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Offer saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save offer.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Offer" : "Edit Offer"}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Type</label><select style={inputStyle} value={String(form.type || "percentage")} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="percentage">Percentage</option><option value="flat">Flat amount</option><option value="buyXget">Buy X Get Y</option>
          </select></div>
          <div><label style={labelStyle}>Discount value</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Coupon code</label><input style={inputStyle} value={String(form.couponCode || "")} onChange={e => setForm({ ...form, couponCode: e.target.value })} /></div>
        </div>
        <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(form.image || "")} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Min order (₹)</label><input type="number" style={inputStyle} value={Number(form.minOrder || 0)} onChange={e => setForm({ ...form, minOrder: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Start date</label><input type="date" style={inputStyle} value={String(form.startDate || "")} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><label style={labelStyle}>End date</label><input type="date" style={inputStyle} value={String(form.endDate || "")} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label></div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Offer →"}</button>
      </div>
    </div>
  );
}

/* ─── SETTINGS EDIT FORM ─── */
export function SettingsEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isImageKey = ["logo_url", "favicon_url", "logo_mobile", "logo_footer", "seo_og_image"].includes(String(form.key || ""));
  const isColorKey = ["theme_primary", "theme_secondary", "theme_gold", "theme_bg", "theme_text"].includes(String(form.key || ""));

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: form.key, value: form.value, group: form.group }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Setting saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save setting.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 500, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Setting" : `Edit: ${String(form.key || "Setting")}`}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Key *</label><input style={inputStyle} value={String(form.key || "")} onChange={e => setForm({ ...form, key: e.target.value })} /></div>
          <div><label style={labelStyle}>Group</label><input style={inputStyle} value={String(form.group || "")} onChange={e => setForm({ ...form, group: e.target.value })} /></div>
        </div>

        {/* Image settings with upload button */}
        {isImageKey && (
          <GlobalMediaUploader
            label="Image Value (Upload / URL / Media Library)"
            preset="general"
            value={String(form.value || "")}
            onChange={(val) => {
              const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0]?.url) : "";
              setForm({ ...form, value: url });
            }}
            folder="logos"
          />
        )}

        {/* Color settings with color picker */}
        {isColorKey && (
          <div>
            <label style={labelStyle}>Color Value</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={String(form.value || "#000000")} onChange={e => setForm({ ...form, value: e.target.value })}
                style={{ width: 50, height: 40, border: "1px solid var(--line)", cursor: "pointer" }} />
              <input style={{ ...inputStyle, flex: 1 }} value={String(form.value || "")} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="#2A0F3A" />
            </div>
          </div>
        )}

        {/* Generic value field for non-image/non-color */}
        {!isImageKey && !isColorKey && (
          <div><label style={labelStyle}>Value *</label><textarea style={{ ...inputStyle, minHeight: 80 }} value={typeof form.value === "string" ? form.value : JSON.stringify(form.value || "")} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
        )}

        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Setting →"}</button>
      </div>
    </div>
  );
}

/* ─── REVIEW EDIT FORM ─── */
export function ReviewEditForm({ item, products, onSave }: { item: Record<string, unknown>; products?: Record<string, unknown>[]; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = "/api/admin/reviews";
    const body = form.isNew ? form : { reviewId: form.id, ...form };
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Review saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save review.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 640, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "Add Product Review" : "Edit Review"}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={labelStyle}>Product *</label>
          {products && products.length > 0 ? (
            <select
              style={inputStyle}
              value={String(form.productId || "")}
              onChange={e => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select a Product</option>
              {products.map(p => (
                <option key={String(p.id)} value={String(p.slug || p.id)}>
                  {String(p.name)} ({String(p.slug || p.id)})
                </option>
              ))}
            </select>
          ) : (
            <input
              style={inputStyle}
              placeholder="Product ID or Slug (e.g. lumine-c-serum)"
              value={String(form.productId || "")}
              onChange={e => setForm({ ...form, productId: e.target.value })}
            />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Customer / Reviewer Name *</label>
            <input
              style={inputStyle}
              value={String(form.customerName || (form.user as Record<string, unknown>)?.name || form.author || "")}
              onChange={e => setForm({ ...form, customerName: e.target.value, author: e.target.value })}
              placeholder="e.g. Dr. Priya Nair"
            />
          </div>
          <div>
            <label style={labelStyle}>Rating (1 - 5 Stars) *</label>
            <input
              type="number"
              min={1}
              max={5}
              style={inputStyle}
              value={Number(form.rating || 5)}
              onChange={e => setForm({ ...form, rating: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Review Headline / Title</label>
          <input
            style={inputStyle}
            value={String(form.title || "")}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Visible radiance in 2 weeks"
          />
        </div>

        <div>
          <label style={labelStyle}>Review Text / Feedback *</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90 }}
            value={String(form.body || form.text || "")}
            onChange={e => setForm({ ...form, body: e.target.value, text: e.target.value })}
            placeholder="Write clinical or customer review comments..."
          />
        </div>

        <GlobalMediaUploader
          label="Customer Review Photo / Media (optional)"
          preset="testimonial"
          value={String(form.image || "")}
          onChange={(val) => {
            const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0]?.url) : "";
            setForm({ ...form, image: url });
          }}
          folder="reviews"
        />

        <div>
          <label style={labelStyle}>Official Pharmacist / Medical Affairs Response (optional)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 70 }}
            value={String(form.response || form.pharmacistResponse || "")}
            onChange={e => setForm({ ...form, response: e.target.value, pharmacistResponse: e.target.value })}
            placeholder="Official clinical/formulation response from Queens Care Care Team..."
          />
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={Boolean(form.verified)}
              onChange={e => setForm({ ...form, verified: e.target.checked })}
            />
            <span>Verified Purchase Badge <span style={{ fontSize: 11, color: "var(--muted)" }}>(Require authenticated order match)</span></span>
          </label>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={form.visible !== false}
              onChange={e => setForm({ ...form, visible: e.target.checked })}
            />
            Visible on Public Product Page
          </label>
        </div>

        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>
          {saving ? "Saving…" : "Save Review →"}
        </button>
      </div>
    </div>
  );
}

/* ─── DOCTOR EDIT FORM ─── */
export function DoctorEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = "/api/admin/doctors";
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Doctor profile saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save doctor profile.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 680, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "Add Doctor / Specialist Profile" : "Edit Doctor Profile"}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input
              style={inputStyle}
              value={String(form.name || "")}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Dr. Rajesh Kothari"
            />
          </div>
          <div>
            <label style={labelStyle}>Medical Qualifications *</label>
            <input
              style={inputStyle}
              value={String(form.qualification || "")}
              onChange={e => setForm({ ...form, qualification: e.target.value })}
              placeholder="e.g. MBBS, MD (Dermatology)"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Medical Council Registration No. *</label>
            <input
              style={inputStyle}
              value={String(form.regNumber || form.councilRegNo || "")}
              onChange={e => setForm({ ...form, regNumber: e.target.value, councilRegNo: e.target.value })}
              placeholder="e.g. MCI-489201"
            />
          </div>
          <div>
            <label style={labelStyle}>Designation / Role</label>
            <input
              style={inputStyle}
              value={String(form.designation || "")}
              onChange={e => setForm({ ...form, designation: e.target.value })}
              placeholder="e.g. Senior Consultant Dermatologist"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Clinic / Hospital Affiliation</label>
            <input
              style={inputStyle}
              value={String(form.clinic || "")}
              onChange={e => setForm({ ...form, clinic: e.target.value })}
              placeholder="e.g. Kothari Skin & Wellness Clinic"
            />
          </div>
          <div>
            <label style={labelStyle}>Specialty</label>
            <input
              style={inputStyle}
              value={String(form.specialty || "dermatology")}
              onChange={e => setForm({ ...form, specialty: e.target.value })}
              placeholder="e.g. Dermatology, Cosmetology"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Clinical Experience</label>
            <input
              style={inputStyle}
              value={String(form.experience || "")}
              onChange={e => setForm({ ...form, experience: e.target.value })}
              placeholder="e.g. 14+ Years Clinical Practice"
            />
          </div>
          <div>
            <label style={labelStyle}>Contact Email</label>
            <input
              style={inputStyle}
              value={String(form.email || "")}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. dr.kothari@clinic.in"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Professional Bio / Clinical Focus</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80 }}
            value={String(form.bio || form.message || "")}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Specialization areas, clinical research, publication record..."
          />
        </div>

        <GlobalMediaUploader
          label="Doctor Profile Photo"
          preset="general"
          value={String(form.photo || form.image || "")}
          onChange={(val) => {
            const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0]?.url) : "";
            setForm({ ...form, photo: url, image: url });
          }}
          folder="doctors"
        />

        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={Boolean(form.verified)}
              onChange={e => setForm({ ...form, verified: e.target.checked })}
            />
            <span>Verified Specialist <span style={{ fontSize: 11, color: "var(--muted)" }}>(Credentials &amp; Registration Verified)</span></span>
          </label>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={form.visible !== false}
              onChange={e => setForm({ ...form, visible: e.target.checked })}
            />
            Publicly Visible on Portal
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <label>Status:</label>
            <select
              value={String(form.status || "approved")}
              onChange={e => setForm({ ...form, status: e.target.value })}
              style={{ padding: "4px 8px", border: "1px solid var(--line)", fontSize: 12 }}
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>
          {saving ? "Saving…" : "Save Doctor Profile →"}
        </button>
      </div>
    </div>
  );
}


