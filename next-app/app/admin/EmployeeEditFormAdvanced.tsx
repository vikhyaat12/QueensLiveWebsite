"use client";

import React, { useState, useEffect } from "react";
import GlobalMediaUploader, { MediaItem } from "../components/GlobalMediaUploader";

export type PhotoSettings = {
  desktopSize: number;
  mobileSize: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  objectFit: "cover" | "contain";
  shadow: boolean;
  zoom: number;
  positionX: number;
  positionY: number;
  rotation: number;
};

export type EmployeeFormProps = {
  item: Record<string, unknown>;
  onSave: () => void;
  onCancel?: () => void;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
};

export default function EmployeeEditFormAdvanced({
  item,
  onSave,
  onCancel,
  inputStyle: customInputStyle,
  labelStyle: customLabelStyle,
}: EmployeeFormProps) {
  const [form, setForm] = useState<Record<string, unknown>>({
    name: "",
    employeeId: "",
    designation: "",
    department: "",
    email: "",
    phone: "",
    bio: "",
    slug: "",
    active: true,
    photo: "",
    profileImage: "",
    gallery: [],
    videos: [],
    photoSettings: {
      desktopSize: 180,
      mobileSize: 130,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true,
    },
    verified: true,
    privacySettings: {
      showEmail: true,
      showPhone: true,
      showLocation: true,
      showEmployeeId: true,
      showSocialLinks: true,
      showQR: true,
      showStats: true,
      showMedia: true,
      showProducts: true,
      showTeamMembers: true,
      showDownloadPdf: true,
    },
    keyStats: [
      { number: "18+", label: "Years in Leadership", subtitle: "Pharmaceutical & Clinical Excellence", icon: "🛡️" },
      { number: "140+", label: "Formulations Certified", subtitle: "Rigorous GMP & ISO Compliance", icon: "🔬" },
      { number: "500k+", label: "Lives Impacted Annually", subtitle: "Trusted by Indian Families", icon: "❤️" },
      { number: "100%", label: "Purity & Safety Record", subtitle: "Zero Compromise Standards", icon: "🏛️" },
    ],
    heroBadges: [
      { title: "18+ Years", subtitle: "Leadership", icon: "🛡️" },
      { title: "140+", subtitle: "Formulations", icon: "🔬" },
      { title: "ISO & GMP", subtitle: "Oversight", icon: "🏛️" },
      { title: "Pan-India", subtitle: "Reach", icon: "🇮🇳" },
    ],
    quote: "",
    eyebrow: "",
    heroSubtitle: "",
    heroQuote: "",
    signatureText: "",
    heroPlaqueQuote: "",
    heroPlaqueAuthor: "",
    aboutTitle: "",
    aboutSubtitle: "",
    aboutParagraph1: "",
    aboutParagraph2: "",
    aboutCtaLabel: "",
    aboutCtaUrl: "",
    aboutQuoteText: "",
    aboutQuoteAuthor: "",
    location: "",
    featuredProductIds: [],
    featuredVideo: {
      title: "Global Health Leadership Keynote",
      subtitle: "Annual Healthcare & Formulation Summit",
      duration: "03:24",
      videoUrl: "",
      posterUrl: "/images/hero/executive-library-bg.jpg",
    },
    momentsGrid: [
      { id: "m-1", title: "Product Innovation", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80" },
      { id: "m-2", title: "Research & Development", image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80" },
      { id: "m-3", title: "Team & Culture", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80" },
      { id: "m-4", title: "Global Impact", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80" },
    ],
    sidebarPromo: {
      title: "Strong People Build a Healthier Tomorrow",
      subtitle: "Join our mission to advance pharmaceutical excellence and wellness for families across India.",
      buttonText: "Meet Our Team →",
      buttonUrl: "/our-people",
      bgImage: "/images/hero/sanjay-promo-card-bg.jpg",
    },
    footerBadges: [
      { title: "Quality-Controlled", subtitle: "Batch verified", icon: "🏛️" },
      { title: "Laboratory Standard", subtitle: "Rigorous testing", icon: "🔬" },
      { title: "Pan-India Reach", subtitle: "Across 28 states", icon: "🇮🇳" },
      { title: "Trusted Formulations", subtitle: "Clinical grade herbs", icon: "🛡️" },
    ],
    footerTagline: "Together for a healthier tomorrow ♡",
    heroBannerImage: "/images/hero/executive-library-bg.jpg",
    heroBannerPosition: "center 30%",
    heroBannerOpacity: 0.38,
    heroBannerVisible: true,
    journeyHtml: "",
    visionHtml: "",
    leadershipHtml: "",
    initiativesHtml: "",
    newsHtml: "",
    themeColors: {
      primary: "",
      gold: "",
      background: "",
      cardBg: "",
      text: "",
      badgeBg: "",
      buttonBg: "",
      gradient: "",
    },
    ...item,
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "photo" | "privacy" | "stats" | "gallery" | "videos" | "products" | "theme">("general");
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string; slug: string; price: number; category?: string; image?: string }>>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.products)) setAvailableProducts(d.products);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      ...item,
      photo: item.photo || item.profileImage || "",
      profileImage: item.photo || item.profileImage || "",
      gallery: Array.isArray(item.gallery) ? item.gallery : [],
      videos: Array.isArray(item.videos) ? item.videos : [],
      privacySettings: {
        showEmail: true,
        showPhone: true,
        showLocation: true,
        showEmployeeId: true,
        showSocialLinks: true,
        showQR: true,
        showStats: true,
        showMedia: true,
        showProducts: true,
        showTeamMembers: true,
        showDownloadPdf: true,
        ...((item.privacySettings as Record<string, boolean>) || {}),
      },
      keyStats:
        Array.isArray(item.keyStats) && item.keyStats.length > 0
          ? item.keyStats
          : [
              { number: "18+", label: "Years in Leadership", subtitle: "Pharmaceutical & Clinical Excellence", icon: "🛡️" },
              { number: "140+", label: "Formulations Certified", subtitle: "Rigorous GMP & ISO Compliance", icon: "🔬" },
              { number: "500k+", label: "Lives Impacted Annually", subtitle: "Trusted by Indian Families", icon: "❤️" },
              { number: "100%", label: "Purity & Safety Record", subtitle: "Zero Compromise Standards", icon: "🏛️" },
            ],
      heroBadges:
        Array.isArray(item.heroBadges) && item.heroBadges.length > 0
          ? item.heroBadges
          : [
              { title: "18+ Years", subtitle: "Leadership", icon: "🛡️" },
              { title: "140+", subtitle: "Formulations", icon: "🔬" },
              { title: "ISO & GMP", subtitle: "Oversight", icon: "🏛️" },
              { title: "Pan-India", subtitle: "Reach", icon: "🇮🇳" },
            ],
      quote: item.quote || "",
      eyebrow: item.eyebrow || "",
      heroSubtitle: item.heroSubtitle || "",
      heroQuote: item.heroQuote || item.quote || "",
      signatureText: item.signatureText || "",
      heroPlaqueQuote: item.heroPlaqueQuote || "",
      heroPlaqueAuthor: item.heroPlaqueAuthor || "",
      aboutTitle: item.aboutTitle || "",
      aboutSubtitle: item.aboutSubtitle || "",
      aboutParagraph1: item.aboutParagraph1 || "",
      aboutParagraph2: item.aboutParagraph2 || "",
      aboutCtaLabel: item.aboutCtaLabel || "",
      aboutCtaUrl: item.aboutCtaUrl || "",
      aboutQuoteText: item.aboutQuoteText || "",
      aboutQuoteAuthor: item.aboutQuoteAuthor || "",
      location: item.location || "",
      featuredProductIds: Array.isArray(item.featuredProductIds) ? item.featuredProductIds : [],
      featuredVideo: item.featuredVideo || {
        title: "Global Health Leadership Keynote",
        subtitle: "Annual Healthcare & Formulation Summit",
        duration: "03:24",
        videoUrl: "",
        posterUrl: "/images/hero/executive-library-bg.jpg",
      },
      momentsGrid: Array.isArray(item.momentsGrid) && item.momentsGrid.length > 0 ? item.momentsGrid : [
        { id: "m-1", title: "Product Innovation", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80" },
        { id: "m-2", title: "Research & Development", image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80" },
        { id: "m-3", title: "Team & Culture", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80" },
        { id: "m-4", title: "Global Impact", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80" },
      ],
      sidebarPromo: item.sidebarPromo || {
        title: "Strong People Build a Healthier Tomorrow",
        subtitle: "Join our mission to advance pharmaceutical excellence and wellness for families across India.",
        buttonText: "Meet Our Team →",
        buttonUrl: "/our-people",
        bgImage: "/images/hero/sanjay-promo-card-bg.jpg",
      },
      footerBadges: Array.isArray(item.footerBadges) && item.footerBadges.length > 0 ? item.footerBadges : [
        { title: "Quality-Controlled", subtitle: "Batch verified", icon: "🏛️" },
        { title: "Laboratory Standard", subtitle: "Rigorous testing", icon: "🔬" },
        { title: "Pan-India Reach", subtitle: "Across 28 states", icon: "🇮🇳" },
        { title: "Trusted Formulations", subtitle: "Clinical grade herbs", icon: "🛡️" },
      ],
      footerTagline: typeof item.footerTagline === "string" ? item.footerTagline : "Together for a healthier tomorrow ♡",
      photoSettings: {
        desktopSize: 180,
        mobileSize: 130,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: "#D4AF37",
        objectFit: "cover",
        shadow: true,
        zoom: 1,
        positionX: 50,
        positionY: 50,
        rotation: 0,
        ...((item.photoSettings as Partial<PhotoSettings>) || {}),
      },
      verified: item.verified !== undefined ? item.verified : true,
      heroBannerImage: typeof item.heroBannerImage === "string" ? item.heroBannerImage : "/images/hero/executive-library-bg.jpg",
      heroBannerPosition: typeof item.heroBannerPosition === "string" ? item.heroBannerPosition : "center 30%",
      heroBannerOpacity: typeof item.heroBannerOpacity === "number" ? item.heroBannerOpacity : 0.38,
      heroBannerVisible: item.heroBannerVisible !== false,
      journeyHtml: typeof item.journeyHtml === "string" ? item.journeyHtml : "",
      visionHtml: typeof item.visionHtml === "string" ? item.visionHtml : "",
      leadershipHtml: typeof item.leadershipHtml === "string" ? item.leadershipHtml : "",
      initiativesHtml: typeof item.initiativesHtml === "string" ? item.initiativesHtml : "",
      newsHtml: typeof item.newsHtml === "string" ? item.newsHtml : "",
      themeColors: {
        primary: "",
        gold: "",
        background: "",
        cardBg: "",
        text: "",
        badgeBg: "",
        buttonBg: "",
        gradient: "",
        ...((item.themeColors as Record<string, string>) || {}),
      },
    }));
  }, [item]);

  const photoSettings = (form.photoSettings as PhotoSettings) || {
    desktopSize: 180,
    mobileSize: 130,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#D4AF37",
    objectFit: "cover",
    shadow: true,
  };

  const updatePhotoSettings = (updates: Partial<PhotoSettings>) => {
    setForm((prev) => ({
      ...prev,
      photoSettings: {
        ...(prev.photoSettings as PhotoSettings),
        ...updates,
      },
    }));
  };

  const save = async () => {
    if (!form.name || !String(form.name).trim()) {
      setIsError(true);
      setMsg("Full name is required.");
      return;
    }

    setSaving(true);
    setIsError(false);
    setMsg("");

    const isNew = Boolean(form.isNew);
    const method = isNew ? "POST" : "PATCH";
    const payload = {
      ...form,
      photo: form.photo || form.profileImage || null,
      profileImage: form.photo || form.profileImage || null,
      id: form.id,
    };

    try {
      const res = await fetch("/api/admin/employees", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Employee saved successfully!");
        setTimeout(() => {
          onSave();
        }, 500);
      } else {
        setIsError(true);
        setMsg(data.error || "Failed to save employee profile.");
      }
    } catch {
      setIsError(true);
      setMsg("Network connection error.");
    }
    setSaving(false);
  };

  const defaultInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    color: "#1f2937",
    outline: "none",
    ...customInputStyle,
  };

  const defaultLabelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#4b5563",
    marginBottom: 6,
    ...customLabelStyle,
  };

  // Gallery Helpers
  const gallery = (Array.isArray(form.gallery) ? form.gallery : []) as Array<string | { url: string; caption?: string }>;
  const addGalleryImage = (url: string) => {
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      gallery: [...(Array.isArray(prev.gallery) ? prev.gallery : []), { url, caption: "" }],
    }));
  };

  const removeGalleryImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery: (Array.isArray(prev.gallery) ? prev.gallery : []).filter((_, i) => i !== index),
    }));
  };

  const moveGalleryImage = (index: number, direction: "up" | "down") => {
    const list = [...(Array.isArray(form.gallery) ? form.gallery : [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setForm((prev) => ({ ...prev, gallery: list }));
  };

  // Video Helpers
  const videos = (Array.isArray(form.videos) ? form.videos : []) as Array<{ id: string; url: string; title?: string; posterUrl?: string }>;
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoPoster, setNewVideoPoster] = useState("");

  const addVideo = () => {
    if (!newVideoUrl.trim()) return;
    const newEntry = {
      id: `vid-${Date.now().toString(36)}`,
      url: newVideoUrl.trim(),
      title: newVideoTitle.trim() || "Professional Profile Feature",
      posterUrl: newVideoPoster.trim() || undefined,
    };
    setForm((prev) => ({
      ...prev,
      videos: [...(Array.isArray(prev.videos) ? prev.videos : []), newEntry],
    }));
    setNewVideoUrl("");
    setNewVideoTitle("");
    setNewVideoPoster("");
  };

  const removeVideo = (id: string) => {
    setForm((prev) => ({
      ...prev,
      videos: (Array.isArray(prev.videos) ? prev.videos : []).filter((v) => v.id !== id),
    }));
  };

  const publicUrl = form.slug ? `/employee/${String(form.slug)}` : "";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
      {/* Top Banner Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Queens Care Laboratories</div>
          <h2 style={{ font: "22px var(--font-display)", color: "#2A0F3A", margin: "4px 0 0 0" }}>{form.isNew ? "Create New Employee Profile" : `Edit Profile: ${String(form.name || "Employee")}`}</h2>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {publicUrl && !form.isNew && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#f3f4f6",
                color: "#2A0F3A",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span>↗</span> Preview Public Profile
            </a>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "8px 14px",
                background: "#ffffff",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: "linear-gradient(135deg, #2A0F3A 0%, #4A1A66 100%)",
              color: "#ffffff",
              border: "1px solid #2A0F3A",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(42,15,58,0.2)",
            }}
          >
            {saving ? "Saving Changes…" : "Save Employee →"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 16px",
            background: isError ? "#fde8e8" : "#ecfdf5",
            color: isError ? "#b91c1c" : "#047857",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 20,
            border: isError ? "1px solid #fca5a5" : "1px solid #a7f3d0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>{isError ? "✕" : "✓"}</span>
          <span>{msg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid #e5e7eb", marginBottom: 24, overflowX: "auto" }}>
        {[
          { id: "general", label: "1. Identity & Info", icon: "👤" },
          { id: "photo", label: "2. Photo & Framing", icon: "🖼️" },
          { id: "privacy", label: "3. Privacy & Visibility", icon: "🛡️" },
          { id: "stats", label: "4. Key Stats & Badges", icon: "📊" },
          { id: "gallery", label: `5. Gallery (${gallery.length})`, icon: "📸" },
          { id: "videos", label: `6. Videos (${videos.length})`, icon: "🎬" },
          { id: "products", label: `7. Featured Products (${((form.featuredProductIds as string[]) || []).length})`, icon: "💊" },
          { id: "theme", label: "8. Theme & Branding", icon: "🎨" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid #2A0F3A" : "3px solid transparent",
              background: activeTab === tab.id ? "#f9fafb" : "transparent",
              color: activeTab === tab.id ? "#2A0F3A" : "#6b7280",
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: "6px 6px 0 0",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: GENERAL INFORMATION */}
      {activeTab === "general" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Full Name *</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Dr. Vikram Singhania"
                value={String(form.name || "")}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Employee ID</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. QC-EMP-1048"
                value={String(form.employeeId || "")}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Designation / Role</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Principal Formulations Lead"
                value={String(form.designation || "")}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Department</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Clinical Research & Formulation"
                value={String(form.department || "")}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Email Address</label>
              <input
                type="email"
                style={defaultInputStyle}
                placeholder="e.g. vikram.s@queenscare.in"
                value={String(form.email || "")}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Direct Phone Number</label>
              <input
                type="tel"
                style={defaultInputStyle}
                placeholder="e.g. +91 98200 12345"
                value={String(form.phone || "")}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={defaultLabelStyle}>URL Slug</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>/employee/</span>
              <input
                style={{ ...defaultInputStyle, flex: 1 }}
                placeholder="dr-vikram-singhania"
                value={String(form.slug || "")}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "") })}
              />
            </div>
          </div>

          <div>
            <label style={defaultLabelStyle}>Professional Bio & Background</label>
            <textarea
              style={{ ...defaultInputStyle, minHeight: 110, lineHeight: 1.6 }}
              placeholder="Detail the employee's clinical certifications, research publications, education, and pharmaceutical expertise..."
              value={String(form.bio || "")}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Hero Eyebrow Tag</label>
              <input
                style={defaultInputStyle}
                placeholder="QUEENS CARE LABORATORIES • EXECUTIVE LEADERSHIP"
                value={String(form.eyebrow || "")}
                onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Office / Lab Location</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Mumbai Central Hub / Delhi R&D"
                value={String(form.location || "")}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Hero Subtitle</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Founder, Chairman & Visionary Leader"
                value={String(form.heroSubtitle || "")}
                onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Cursive Signature Text</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Sanjay Walia"
                value={String(form.signatureText || "")}
                onChange={(e) => setForm({ ...form, signatureText: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={defaultLabelStyle}>Hero Flowing Script Quote</label>
            <input
              style={defaultInputStyle}
              placeholder="e.g. Building Better Health For Every Tomorrow"
              value={String(form.heroQuote || form.quote || "")}
              onChange={(e) => setForm({ ...form, heroQuote: e.target.value, quote: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Hero Floating Plaque Quote</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Good health is not a privilege, it's a responsibility we all share."
                value={String(form.heroPlaqueQuote || "")}
                onChange={(e) => setForm({ ...form, heroPlaqueQuote: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Hero Plaque Author Attribution</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. — Sanjay Walia"
                value={String(form.heroPlaqueAuthor || "")}
                onChange={(e) => setForm({ ...form, heroPlaqueAuthor: e.target.value })}
              />
            </div>
          </div>

          {/* Section: Editorial Narrative / About Section */}
          <div style={{ padding: 18, background: "#fdf8ee", borderRadius: 8, border: "1px solid #e8dfcf" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📜 Editorial Story & Narrative Section
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={defaultLabelStyle}>About Section Title</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. About Mr. Sanjay Walia"
                  value={String(form.aboutTitle || "")}
                  onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })}
                />
              </div>
              <div>
                <label style={defaultLabelStyle}>About Section Subtitle</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. A Purpose-Driven Leader in Pharmaceutical Wellness"
                  value={String(form.aboutSubtitle || "")}
                  onChange={(e) => setForm({ ...form, aboutSubtitle: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={defaultLabelStyle}>Narrative Paragraph 1 (with Gold Accent Bar)</label>
              <textarea
                style={{ ...defaultInputStyle, minHeight: 70, lineHeight: 1.6 }}
                placeholder="First narrative paragraph..."
                value={String(form.aboutParagraph1 || "")}
                onChange={(e) => setForm({ ...form, aboutParagraph1: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={defaultLabelStyle}>Narrative Paragraph 2</label>
              <textarea
                style={{ ...defaultInputStyle, minHeight: 70, lineHeight: 1.6 }}
                placeholder="Second narrative paragraph..."
                value={String(form.aboutParagraph2 || "")}
                onChange={(e) => setForm({ ...form, aboutParagraph2: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={defaultLabelStyle}>Narrative Button Label</label>
                <input
                  style={defaultInputStyle}
                  placeholder="Read Full Story →"
                  value={String(form.aboutCtaLabel || "")}
                  onChange={(e) => setForm({ ...form, aboutCtaLabel: e.target.value })}
                />
              </div>
              <div>
                <label style={defaultLabelStyle}>Narrative Button Link / Anchor</label>
                <input
                  style={defaultInputStyle}
                  placeholder="#journey"
                  value={String(form.aboutCtaUrl || "")}
                  onChange={(e) => setForm({ ...form, aboutCtaUrl: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
              <div>
                <label style={defaultLabelStyle}>Right-Hand Quote Box Text</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. A healthier world is possible when science, people and purpose work together."
                  value={String(form.aboutQuoteText || "")}
                  onChange={(e) => setForm({ ...form, aboutQuoteText: e.target.value })}
                />
              </div>
              <div>
                <label style={defaultLabelStyle}>Quote Box Author Attribution</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. — Sanjay Walia"
                  value={String(form.aboutQuoteAuthor || "")}
                  onChange={(e) => setForm({ ...form, aboutQuoteAuthor: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Narrative Content for Profile Tabs */}
          <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📖 Profile Navigation Sections & Stories
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 14px 0", lineHeight: 1.5 }}>
              Custom rich narrative content for each capsule navigation tab. Leave empty to use the luxury default presentation.
            </p>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={defaultLabelStyle}>1. Executive Journey & Milestones (Custom HTML / Text)</label>
                <textarea
                  style={{ ...defaultInputStyle, minHeight: 60, fontFamily: "monospace", fontSize: 11 }}
                  placeholder="Optional custom HTML or narrative milestones for the #journey tab..."
                  value={String(form.journeyHtml || "")}
                  onChange={(e) => setForm({ ...form, journeyHtml: e.target.value })}
                />
              </div>

              <div>
                <label style={defaultLabelStyle}>2. Vision & Mission (Custom HTML / Text)</label>
                <textarea
                  style={{ ...defaultInputStyle, minHeight: 60, fontFamily: "monospace", fontSize: 11 }}
                  placeholder="Optional custom HTML or vision statement for the #vision tab..."
                  value={String(form.visionHtml || "")}
                  onChange={(e) => setForm({ ...form, visionHtml: e.target.value })}
                />
              </div>

              <div>
                <label style={defaultLabelStyle}>3. Leadership Philosophy (Custom HTML / Text)</label>
                <textarea
                  style={{ ...defaultInputStyle, minHeight: 60, fontFamily: "monospace", fontSize: 11 }}
                  placeholder="Optional custom HTML or leadership pillars for the #leadership tab..."
                  value={String(form.leadershipHtml || "")}
                  onChange={(e) => setForm({ ...form, leadershipHtml: e.target.value })}
                />
              </div>

              <div>
                <label style={defaultLabelStyle}>4. Key Initiatives (Custom HTML / Text)</label>
                <textarea
                  style={{ ...defaultInputStyle, minHeight: 60, fontFamily: "monospace", fontSize: 11 }}
                  placeholder="Optional custom HTML or strategic programs for the #initiatives tab..."
                  value={String(form.initiativesHtml || "")}
                  onChange={(e) => setForm({ ...form, initiativesHtml: e.target.value })}
                />
              </div>

              <div>
                <label style={defaultLabelStyle}>5. News & Insights (Custom HTML / Text)</label>
                <textarea
                  style={{ ...defaultInputStyle, minHeight: 60, fontFamily: "monospace", fontSize: 11 }}
                  placeholder="Optional custom HTML or press highlights for the #news tab..."
                  value={String(form.newsHtml || "")}
                  onChange={(e) => setForm({ ...form, newsHtml: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Social Media & Professional Links */}
          <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🔗 Social Media & Professional Links
            </div>
            {([
              { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
              { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
              { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
              { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
              { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/..." },
              { key: "website", label: "Personal Website", placeholder: "https://example.com" },
            ] as const).map((s) => {
              const social = ((form.socialLinks as Record<string, { url: string; enabled: boolean }>) || {})[s.key] || { url: "", enabled: false };
              return (
                <div key={s.key} style={{ marginBottom: 10, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
                  <input
                    style={{ ...defaultInputStyle, fontSize: 12 }}
                    placeholder={s.placeholder}
                    value={social.url}
                    onChange={(e) => {
                      const sl = { ...((form.socialLinks as Record<string, { url: string; enabled: boolean }>) || {}), [s.key]: { ...social, url: e.target.value } };
                      setForm({ ...form, socialLinks: sl });
                    }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280", cursor: "pointer", whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={social.enabled}
                      onChange={(e) => {
                        const sl = { ...((form.socialLinks as Record<string, { url: string; enabled: boolean }>) || {}), [s.key]: { ...social, enabled: e.target.checked } };
                        setForm({ ...form, socialLinks: sl });
                      }}
                      style={{ accentColor: "#2A0F3A" }}
                    />
                    Show
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", minWidth: 80 }}>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: 14, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
              <input
                type="checkbox"
                checked={form.active !== false}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#2A0F3A" }}
              />
              <span>Active Employee (Profile is publicly accessible)</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
              <input
                type="checkbox"
                checked={form.verified !== false}
                onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#2A0F3A" }}
              />
              <span>Queens Care Verified Employee (Blue verification badge)</span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE PHOTO & SIZE CONTROLS */}
      {activeTab === "photo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <GlobalMediaUploader
                label="Profile Photo (Upload from Computer, URL, or Media Library)"
                value={String(form.photo || form.profileImage || "")}
                onChange={(val) => {
                  const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0].url) : "";
                  setForm((prev) => ({ ...prev, photo: url, profileImage: url }));
                }}
                folder="employees"
                preset="employee_photo"
                compact={false}
              />
            </div>

            <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🎨 Profile Photo Presentation Controls
              </div>

              {/* Desktop Photo Size */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  <span>Desktop Photo Size</span>
                  <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.desktopSize} px</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="300"
                  step="5"
                  value={photoSettings.desktopSize}
                  onChange={(e) => updatePhotoSettings({ desktopSize: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#2A0F3A" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
                  <span>Compact (100px)</span>
                  <span>Standard (180px)</span>
                  <span>Prominent (300px)</span>
                </div>
              </div>

              {/* Mobile Photo Size */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  <span>Mobile Photo Size</span>
                  <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.mobileSize} px</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="200"
                  step="5"
                  value={photoSettings.mobileSize}
                  onChange={(e) => updatePhotoSettings({ mobileSize: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#2A0F3A" }}
                />
              </div>

              {/* Border Radius */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  <span>Corner Radius / Shape</span>
                  <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.borderRadius}% {photoSettings.borderRadius === 50 ? "(Circular)" : photoSettings.borderRadius === 0 ? "(Square)" : "(Rounded Square)"}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="2"
                  value={photoSettings.borderRadius}
                  onChange={(e) => updatePhotoSettings({ borderRadius: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#2A0F3A" }}
                />
              </div>

              {/* Border Width & Color */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Border Thickness</label>
                  <select
                    value={photoSettings.borderWidth}
                    onChange={(e) => updatePhotoSettings({ borderWidth: Number(e.target.value) })}
                    style={defaultInputStyle}
                  >
                    <option value="0">None (0px)</option>
                    <option value="1">Thin (1px)</option>
                    <option value="2">Subtle (2px)</option>
                    <option value="3">Gold Ring (3px)</option>
                    <option value="4">Bold (4px)</option>
                    <option value="6">Luxury Heavy (6px)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Border Color</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="color"
                      value={photoSettings.borderColor || "#D4AF37"}
                      onChange={(e) => updatePhotoSettings({ borderColor: e.target.value })}
                      style={{ width: 36, height: 36, border: "none", cursor: "pointer", borderRadius: 4 }}
                    />
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#4b5563" }}>{photoSettings.borderColor || "#D4AF37"}</span>
                  </div>
                </div>
              </div>

              {/* Photo Adjustment Controls */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14, marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🔧 Photo Adjustment
                </div>

                {/* Zoom */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>Zoom</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>{((photoSettings.zoom || 1) * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min="1" max="2" step="0.05" value={photoSettings.zoom || 1} onChange={(e) => updatePhotoSettings({ zoom: Number(e.target.value) })} style={{ width: "100%", accentColor: "#2A0F3A" }} />
                </div>

                {/* Position X */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>Horizontal Position</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.positionX ?? 50}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={photoSettings.positionX ?? 50} onChange={(e) => updatePhotoSettings({ positionX: Number(e.target.value) })} style={{ width: "100%", accentColor: "#2A0F3A" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}><span>Left</span><span>Center</span><span>Right</span></div>
                </div>

                {/* Position Y */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>Vertical Position</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.positionY ?? 50}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={photoSettings.positionY ?? 50} onChange={(e) => updatePhotoSettings({ positionY: Number(e.target.value) })} style={{ width: "100%", accentColor: "#2A0F3A" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}><span>Top</span><span>Center</span><span>Bottom</span></div>
                </div>

                {/* Rotation */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>Rotation</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.rotation ?? 0}°</span>
                  </div>
                  <input type="range" min="-5" max="5" step="0.5" value={photoSettings.rotation ?? 0} onChange={(e) => updatePhotoSettings({ rotation: Number(e.target.value) })} style={{ width: "100%", accentColor: "#2A0F3A" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}><span>-5°</span><span>0°</span><span>+5°</span></div>
                </div>

                <button
                  type="button"
                  onClick={() => updatePhotoSettings({ zoom: 1, positionX: 50, positionY: 50, rotation: 0 })}
                  style={{ padding: "6px 12px", fontSize: 11, background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", color: "#6b7280", width: "100%" }}
                >
                  🔄 Reset Photo Adjustment
                </button>
              </div>

              {/* Object Fit & Shadow */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Image Fit</label>
                  <select
                    value={photoSettings.objectFit || "cover"}
                    onChange={(e) => updatePhotoSettings({ objectFit: e.target.value as "cover" | "contain" })}
                    style={defaultInputStyle}
                  >
                    <option value="cover">Cover (Fill & Crop Center)</option>
                    <option value="contain">Contain (Full Image Visible)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Ambient Shadow</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={photoSettings.shadow !== false}
                      onChange={(e) => updatePhotoSettings({ shadow: e.target.checked })}
                      style={{ accentColor: "#2A0F3A" }}
                    />
                    <span>Luxury Ambient Shadow</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Dedicated Hero Background Banner (Behind Profile Photo) */}
            <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🏛️ Hero Background Banner (Behind Profile Photo)
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#1f2937", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.heroBannerVisible !== false}
                    onChange={(e) => setForm({ ...form, heroBannerVisible: e.target.checked })}
                    style={{ accentColor: "#2A0F3A" }}
                  />
                  <span>Show Banner</span>
                </label>
              </div>

              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 14px 0", lineHeight: 1.5 }}>
                Upload or select an executive environment / office backdrop to render behind the profile photo. The profile photo and background banner remain completely separate.
              </p>

              <div style={{ marginBottom: 14 }}>
                <GlobalMediaUploader
                  label="Hero Banner Image (Upload, Media Library, or Image URL)"
                  value={String(form.heroBannerImage || "")}
                  onChange={(val) => {
                    const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0].url) : "";
                    setForm((prev) => ({ ...prev, heroBannerImage: url }));
                  }}
                  folder="hero"
                  preset="banner_desktop"
                  compact={false}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>
                    Banner Alignment / Position
                  </label>
                  <select
                    value={String(form.heroBannerPosition || "center 30%")}
                    onChange={(e) => setForm({ ...form, heroBannerPosition: e.target.value })}
                    style={defaultInputStyle}
                  >
                    <option value="center 30%">Center 30% (Executive Default)</option>
                    <option value="center center">Center Center</option>
                    <option value="center top">Center Top</option>
                    <option value="center bottom">Center Bottom</option>
                    <option value="top left">Top Left</option>
                    <option value="top right">Top Right</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: "#4b5563" }}>Banner Opacity / Overlay</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>
                      {Math.round((typeof form.heroBannerOpacity === "number" ? form.heroBannerOpacity : 0.38) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.01"
                    value={typeof form.heroBannerOpacity === "number" ? form.heroBannerOpacity : 0.38}
                    onChange={(e) => setForm({ ...form, heroBannerOpacity: parseFloat(e.target.value) })}
                    style={{ width: "100%", accentColor: "#2A0F3A" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
                    <span>Subtle (10%)</span>
                    <span>Standard (38%)</span>
                    <span>Vivid (100%)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      heroBannerImage: "/images/hero/executive-library-bg.jpg",
                      heroBannerPosition: "center 30%",
                      heroBannerOpacity: 0.38,
                      heroBannerVisible: true,
                    }))
                  }
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "#4b5563",
                    fontWeight: 600,
                  }}
                >
                  🏛️ Reset to Executive Library
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, heroBannerImage: "" }))}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    background: "#fff",
                    border: "1px solid #fca5a5",
                    borderRadius: 4,
                    cursor: "pointer",
                    color: "#b91c1c",
                    fontWeight: 600,
                  }}
                >
                  🗑️ Remove Banner
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: 10 }}>
              👁️ Live Profile Avatar Preview
            </div>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                background:
                  form.heroBannerVisible !== false && form.heroBannerImage
                    ? `linear-gradient(rgba(28,8,40,${1 - (typeof form.heroBannerOpacity === "number" ? form.heroBannerOpacity : 0.38)}), rgba(21,5,32,0.92)), url('${form.heroBannerImage}') ${form.heroBannerPosition || "center 30%"}/cover`
                    : "linear-gradient(135deg, #1c0828 0%, #2A0F3A 50%, #150520 100%)",
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
                color: "#ffffff",
                border: "1px solid rgba(212,175,55,0.3)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ position: "relative", display: "inline-block", margin: "0 auto 16px" }}>
                {form.photo || form.profileImage ? (
                  <div style={{ width: photoSettings.desktopSize, height: photoSettings.desktopSize, borderRadius: `${photoSettings.borderRadius}%`, overflow: "hidden", border: `${photoSettings.borderWidth}px solid ${photoSettings.borderColor}`, boxShadow: photoSettings.shadow ? "0 12px 32px rgba(0,0,0,0.4)" : "none", display: "block" }}>
                    <img
                      src={String(form.photo || form.profileImage)}
                      alt={String(form.name || "Preview")}
                      style={{
                        width: `${(photoSettings.zoom || 1) * 100}%`,
                        height: `${(photoSettings.zoom || 1) * 100}%`,
                        objectPosition: `${photoSettings.positionX ?? 50}% ${photoSettings.positionY ?? 50}%`,
                        borderRadius: 0,
                        objectFit: "cover",
                        border: "none",
                        display: "block",
                        transform: `rotate(${photoSettings.rotation ?? 0}deg)`,
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: photoSettings.desktopSize,
                      height: photoSettings.desktopSize,
                      borderRadius: `${photoSettings.borderRadius}%`,
                      background: "linear-gradient(135deg, #4A1A66 0%, #2A0F3A 100%)",
                      color: "#D4AF37",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 48,
                      fontWeight: 700,
                      border: `${photoSettings.borderWidth}px solid ${photoSettings.borderColor}`,
                    }}
                  >
                    {String(form.name || "QC").charAt(0)}
                  </div>
                )}
                {form.active !== false && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      background: "#10b981",
                      color: "#ffffff",
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: "bold",
                      border: "2px solid #ffffff",
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>

              <div style={{ font: "18px var(--font-display)", fontWeight: 700, color: "#ffffff" }}>{String(form.name || "Employee Name")}</div>
              <div style={{ fontSize: 13, color: "#D4AF37", fontWeight: 600, marginTop: 4 }}>{String(form.designation || "Designation")}</div>
              <div style={{ fontSize: 12, color: "#d1d5db", marginTop: 2 }}>{String(form.department || "Department")}</div>

              <div
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  padding: "4px 12px",
                  background: "rgba(212,175,55,0.15)",
                  border: "1px solid #D4AF37",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                }}
              >
                ID: {String(form.employeeId || form.slug || "QC-EMP")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVACY & VISIBILITY SWITCHES */}
      {activeTab === "privacy" && (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🛡️</span> Granular Privacy & Public Visibility Controls
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 18px 0", lineHeight: 1.5 }}>
              Control exactly which contact details, verification credentials, and content sections are shown on this employee&apos;s public profile. When disabled, elements are completely omitted without leaving empty gaps.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "showEmail", label: "Email Address", desc: "Hero email button & verification card email row", icon: "✉" },
                { key: "showPhone", label: "Phone Number", desc: "Hero call button & verification card phone row", icon: "📞" },
                { key: "showLocation", label: "Office Location", desc: "Office / hub location row in verification card", icon: "📍" },
                { key: "showEmployeeId", label: "Employee ID", desc: "Hero ID badge & verification card ID row", icon: "🏷️" },
                { key: "showSocialLinks", label: "Social Media Row", desc: "LinkedIn, Twitter, and other social links block", icon: "🔗" },
                { key: "showQR", label: "QR Code & Modal", desc: "Scannable QR box and hero QR verification modal", icon: "📱" },
                { key: "showStats", label: "4 Key Stats Counters", desc: "The 4 leadership and formulation metric counters", icon: "📊" },
                { key: "showMedia", label: "Media & Videos Showcase", desc: "Featured keynote video player and photo gallery", icon: "🎬" },
                { key: "showProducts", label: "Featured Formulations", desc: "Clinically formulated and endorsed products grid", icon: "💊" },
                { key: "showTeamMembers", label: "Team Peers Sidebar", desc: "Sidebar card listing fellow team members", icon: "👥" },
                { key: "showDownloadPdf", label: "Download Profile PDF", desc: "PDF download button in hero and verification card", icon: "📄" },
              ].map((sw) => {
                const currentVal = ((form.privacySettings as Record<string, boolean>) || {})[sw.key] !== false;
                return (
                  <div
                    key={sw.key}
                    style={{
                      background: "#ffffff",
                      border: `1.5px solid ${currentVal ? "#D4AF37" : "#e5e7eb"}`,
                      borderRadius: 8,
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      boxShadow: currentVal ? "0 2px 8px rgba(212,175,55,0.12)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{sw.icon}</span>
                        <span>{sw.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{sw.desc}</div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, flexShrink: 0, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={currentVal}
                        onChange={(e) => {
                          const newPs = { ...((form.privacySettings as Record<string, boolean>) || {}), [sw.key]: e.target.checked };
                          setForm({ ...form, privacySettings: newPs });
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: currentVal ? "#10b981" : "#d1d5db",
                          borderRadius: 24,
                          transition: "0.2s",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            height: 18,
                            width: 18,
                            left: currentVal ? 23 : 3,
                            bottom: 3,
                            background: "#ffffff",
                            borderRadius: "50%",
                            transition: "0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                          }}
                        />
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KEY STATS & BADGES */}
      {activeTab === "stats" && (
        <div style={{ display: "grid", gap: 20 }}>
          {/* 4 Key Metric Counters */}
          <div style={{ padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📊</span> 4 Key Leadership & Formulation Metric Counters
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px 0" }}>
              Displayed in a prominent 4-card grid on the public profile. Numbers, labels, and subtitles can be fully customized.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {(((form.keyStats as Array<Record<string, string>>) || []).slice(0, 4)).map((st, idx) => (
                <div key={idx} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#D4AF37", marginBottom: 8 }}>Stat Counter #{idx + 1}</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Icon</label>
                        <input
                          style={defaultInputStyle}
                          placeholder="Icon"
                          value={st.icon || ""}
                          onChange={(e) => {
                            const updated = [...((form.keyStats as Array<Record<string, string>>) || [])];
                            updated[idx] = { ...updated[idx], icon: e.target.value };
                            setForm({ ...form, keyStats: updated });
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Value / Number</label>
                        <input
                          style={defaultInputStyle}
                          placeholder="e.g. 18+"
                          value={st.number || ""}
                          onChange={(e) => {
                            const updated = [...((form.keyStats as Array<Record<string, string>>) || [])];
                            updated[idx] = { ...updated[idx], number: e.target.value };
                            setForm({ ...form, keyStats: updated });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Primary Label</label>
                      <input
                        style={defaultInputStyle}
                        placeholder="e.g. Years in Leadership"
                        value={st.label || ""}
                        onChange={(e) => {
                          const updated = [...((form.keyStats as Array<Record<string, string>>) || [])];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setForm({ ...form, keyStats: updated });
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Subtitle / Context</label>
                      <input
                        style={defaultInputStyle}
                        placeholder="e.g. Pharmaceutical Excellence"
                        value={st.subtitle || ""}
                        onChange={(e) => {
                          const updated = [...((form.keyStats as Array<Record<string, string>>) || [])];
                          updated[idx] = { ...updated[idx], subtitle: e.target.value };
                          setForm({ ...form, keyStats: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Hero Stage Icon Badges */}
          <div style={{ padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🛡️</span> 4 Hero Stage Icon Badges (Featured Under Hero Quote)
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px 0" }}>
              Displayed in the executive hero banner directly beneath the script quote and signature.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {(((form.heroBadges as Array<Record<string, string>>) || []).slice(0, 4)).map((badge, idx) => (
                <div key={idx} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#D4AF37", marginBottom: 8 }}>Hero Badge #{idx + 1}</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Icon</label>
                        <input
                          style={defaultInputStyle}
                          placeholder="Icon"
                          value={badge.icon || ""}
                          onChange={(e) => {
                            const updated = [...((form.heroBadges as Array<Record<string, string>>) || [])];
                            updated[idx] = { ...updated[idx], icon: e.target.value };
                            setForm({ ...form, heroBadges: updated });
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Badge Title</label>
                        <input
                          style={defaultInputStyle}
                          placeholder="e.g. 30+ Years"
                          value={badge.title || ""}
                          onChange={(e) => {
                            const updated = [...((form.heroBadges as Array<Record<string, string>>) || [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setForm({ ...form, heroBadges: updated });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Badge Subtitle</label>
                      <input
                        style={defaultInputStyle}
                        placeholder="e.g. Industry Experience"
                        value={badge.subtitle || ""}
                        onChange={(e) => {
                          const updated = [...((form.heroBadges as Array<Record<string, string>>) || [])];
                          updated[idx] = { ...updated[idx], subtitle: e.target.value };
                          setForm({ ...form, heroBadges: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROFESSIONAL GALLERY */}
      {activeTab === "gallery" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <GlobalMediaUploader
              label="Add Photo to Professional Gallery (Upload from Computer or Media Library)"
              value=""
              onChange={(val) => {
                const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0].url) : "";
                if (url) addGalleryImage(url);
              }}
              folder="employees"
              preset="employee_photo"
              compact={false}
            />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 12 }}>
            Current Gallery Images ({gallery.length})
          </div>

          {gallery.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", background: "#f9fafb", borderRadius: 8, border: "1px dashed #d1d5db", color: "#6b7280", fontSize: 13 }}>
              No additional gallery images uploaded yet. Use the uploader above to add lab photos, certifications, or clinical field images.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              {gallery.map((img, idx) => {
                const url = typeof img === "string" ? img : img.url;
                return (
                  <div key={idx} style={{ position: "relative", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
                    <img src={url} alt={`Gallery ${idx + 1}`} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>#{idx + 1}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {idx > 0 && (
                          <button type="button" onClick={() => moveGalleryImage(idx, "up")} style={{ padding: "3px 6px", fontSize: 10, background: "#e5e7eb", border: "none", borderRadius: 4, cursor: "pointer" }}>
                            ▲
                          </button>
                        )}
                        {idx < gallery.length - 1 && (
                          <button type="button" onClick={() => moveGalleryImage(idx, "down")} style={{ padding: "3px 6px", fontSize: 10, background: "#e5e7eb", border: "none", borderRadius: 4, cursor: "pointer" }}>
                            ▼
                          </button>
                        )}
                        <button type="button" onClick={() => removeGalleryImage(idx)} style={{ padding: "3px 6px", fontSize: 10, background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 4, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: VIDEOS & KEY MOMENTS */}
      {activeTab === "videos" && (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Featured Keynote Video Player Section */}
          <div style={{ padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🎬</span> Featured Leadership Keynote Video
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px 0" }}>
              Displayed prominently as the full-width featured media player in the Key Moments section.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={defaultLabelStyle}>Keynote Headline</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. Global Health Leadership Keynote"
                  value={String(((form.featuredVideo as Record<string, string>) || {}).title || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      featuredVideo: { ...((form.featuredVideo as Record<string, string>) || {}), title: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label style={defaultLabelStyle}>Keynote Subtitle</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. Annual Healthcare & Formulation Summit"
                  value={String(((form.featuredVideo as Record<string, string>) || {}).subtitle || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      featuredVideo: { ...((form.featuredVideo as Record<string, string>) || {}), subtitle: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={defaultLabelStyle}>Video URL (MP4, YouTube, Vimeo)</label>
                <input
                  style={defaultInputStyle}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={String(((form.featuredVideo as Record<string, string>) || {}).videoUrl || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      featuredVideo: { ...((form.featuredVideo as Record<string, string>) || {}), videoUrl: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label style={defaultLabelStyle}>Duration</label>
                <input
                  style={defaultInputStyle}
                  placeholder="03:24"
                  value={String(((form.featuredVideo as Record<string, string>) || {}).duration || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      featuredVideo: { ...((form.featuredVideo as Record<string, string>) || {}), duration: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label style={defaultLabelStyle}>Poster / Backdrop Image URL</label>
              <input
                style={defaultInputStyle}
                placeholder="/images/hero/executive-library-bg.jpg"
                value={String(((form.featuredVideo as Record<string, string>) || {}).posterUrl || "")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    featuredVideo: { ...((form.featuredVideo as Record<string, string>) || {}), posterUrl: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Key Moments 2x2 Grid */}
          <div style={{ padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📸</span> Key Moments Media Grid (2x2 Grid)
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px 0" }}>
              Displayed directly below the keynote video player in a polished 2x2 photographic grid.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {(((form.momentsGrid as Array<Record<string, string>>) || []).slice(0, 4)).map((item, idx) => (
                <div key={idx} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#D4AF37", marginBottom: 8 }}>Moment Card #{idx + 1}</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Title / Caption</label>
                      <input
                        style={defaultInputStyle}
                        placeholder="e.g. Product Innovation"
                        value={item.title || ""}
                        onChange={(e) => {
                          const updated = [...((form.momentsGrid as Array<Record<string, string>>) || [])];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setForm({ ...form, momentsGrid: updated });
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Image URL</label>
                      <input
                        style={defaultInputStyle}
                        placeholder="https://images.unsplash.com/..."
                        value={item.image || ""}
                        onChange={(e) => {
                          const updated = [...((form.momentsGrid as Array<Record<string, string>>) || [])];
                          updated[idx] = { ...updated[idx], image: e.target.value };
                          setForm({ ...form, momentsGrid: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 12 }}>
              Add Professional Video (MP4 / WebM / YouTube / Vimeo)
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={defaultLabelStyle}>Video URL (MP4, YouTube, or Vimeo)</label>
                <input
                  style={defaultInputStyle}
                  placeholder="https://www.youtube.com/watch?v=... or /uploads/employees/video.mp4"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={defaultLabelStyle}>Video Title</label>
                  <input
                    style={defaultInputStyle}
                    placeholder="e.g. Clinical Formulation Walkthrough"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label style={defaultLabelStyle}>Poster / Thumbnail Image URL</label>
                  <input
                    style={defaultInputStyle}
                    placeholder="https://... (Optional video thumbnail)"
                    value={newVideoPoster}
                    onChange={(e) => setNewVideoPoster(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addVideo}
                disabled={!newVideoUrl.trim()}
                style={{
                  padding: "8px 16px",
                  background: "#2A0F3A",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: newVideoUrl.trim() ? "pointer" : "not-allowed",
                  width: "fit-content",
                }}
              >
                + Add Video to Profile
              </button>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 12 }}>
            Attached Videos ({videos.length})
          </div>

          {videos.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", background: "#f9fafb", borderRadius: 8, border: "1px dashed #d1d5db", color: "#6b7280", fontSize: 13 }}>
              No videos added yet. Add interview clips, laboratory demonstrations, or keynote lectures.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {videos.map((vid) => (
                <div key={vid.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1f2937" }}>🎬 {vid.title || "Video Feature"}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, wordBreak: "break-all" }}>{vid.url}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(vid.id)}
                    style={{ padding: "6px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: FEATURED PRODUCTS */}
      {activeTab === "products" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>💊</span> Featured Formulations & Products
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Select specific products from the Queens Care Laboratories catalog to display on this employee&apos;s public profile. If none are selected, the top 4 products from the catalog are automatically displayed.
            </p>

            {availableProducts.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                Loading product catalog…
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {availableProducts.map((prod) => {
                  const isSelected =
                    ((form.featuredProductIds as string[]) || []).includes(prod.id) ||
                    ((form.featuredProductIds as string[]) || []).includes(prod.slug);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        const cur = (form.featuredProductIds as string[]) || [];
                        const next = isSelected
                          ? cur.filter((id) => id !== prod.id && id !== prod.slug)
                          : [...cur, prod.id];
                        setForm({ ...form, featuredProductIds: next });
                      }}
                      style={{
                        border: `1.5px solid ${isSelected ? "#D4AF37" : "#e5e7eb"}`,
                        background: isSelected ? "rgba(212, 175, 55, 0.08)" : "#ffffff",
                        borderRadius: 8,
                        padding: "12px 14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        boxShadow: isSelected ? "0 2px 8px rgba(212, 175, 55, 0.15)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by container click
                        style={{ accentColor: "#2A0F3A", width: 18, height: 18 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#1F2937",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {prod.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                          ₹{prod.price.toLocaleString("en-IN")} • {prod.category || "Therapeutic"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: THEME & BRANDING */}
      {activeTab === "theme" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          <div>
            <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🎨 Employee Profile Theme Colors
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, lineHeight: 1.5 }}>
                Customize the visual theme of this employee's public profile page. Leave empty to use the global Queens Care default theme.
              </p>

              {([
                { key: "primary", label: "Primary Color", default: "#2A0F3A" },
                { key: "gold", label: "Gold / Accent Color", default: "#C19A6B" },
                { key: "background", label: "Background Color", default: "#FAF8F5" },
                { key: "cardBg", label: "Card Background", default: "#FFFFFF" },
                { key: "text", label: "Text Color", default: "#333333" },
                { key: "badgeBg", label: "Badge Color", default: "#D4AF37" },
                { key: "buttonBg", label: "Button Color", default: "#2A0F3A" },
              ] as const).map((c) => {
                const tc = (form.themeColors as Record<string, string>) || {};
                const val = tc[c.key] || "";
                return (
                  <div key={c.key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>{c.label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="color"
                        value={val || c.default}
                        onChange={(e) => setForm({ ...form, themeColors: { ...((form.themeColors as Record<string, string>) || {}), [c.key]: e.target.value } })}
                        style={{ width: 36, height: 36, border: "none", cursor: "pointer", borderRadius: 4 }}
                      />
                      <input
                        style={{ ...defaultInputStyle, flex: 1 }}
                        placeholder={c.default}
                        value={val}
                        onChange={(e) => setForm({ ...form, themeColors: { ...((form.themeColors as Record<string, string>) || {}), [c.key]: e.target.value } })}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const tc2 = { ...((form.themeColors as Record<string, string>) || {}) };
                          delete tc2[c.key];
                          setForm({ ...form, themeColors: tc2 });
                        }}
                        style={{ padding: "6px 10px", fontSize: 11, background: "#e5e7eb", border: "none", borderRadius: 4, cursor: "pointer", color: "#6b7280" }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Optional Gradient CSS</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. linear-gradient(135deg, #2A0F3A 0%, #4A1A66 100%)"
                  value={String(((form.themeColors as Record<string, string>) || {}).gradient || "")}
                  onChange={(e) => setForm({ ...form, themeColors: { ...((form.themeColors as Record<string, string>) || {}), gradient: e.target.value } })}
                />
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, themeColors: { primary: "#2A0F3A", gold: "#C19A6B", background: "#FAF8F5", cardBg: "#FFFFFF", text: "#333333", badgeBg: "#D4AF37", buttonBg: "#2A0F3A", gradient: "" } })}
                  style={{ padding: "8px 14px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                >
                  🔄 Reset to Queens Care Default
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, themeColors: { primary: "", gold: "", background: "", cardBg: "", text: "", badgeBg: "", buttonBg: "", gradient: "" } })}
                  style={{ padding: "8px 14px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >
                  Clear All (Use Global Theme)
                </button>
              </div>
            </div>
          </div>

          {/* Live Theme Preview */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: 10 }}>
              👁️ Live Theme Preview
            </div>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
              <div style={{ padding: 16, background: ((form.themeColors as Record<string, string>) || {}).gradient || ((form.themeColors as Record<string, string>) || {}).primary || "#2A0F3A", color: "#fff", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", opacity: 0.8 }}>QUEENS CARE LABORATORIES</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{String(form.name || "Employee Name")}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{String(form.designation || "Designation")}</div>
              </div>
              <div style={{ padding: 16, background: ((form.themeColors as Record<string, string>) || {}).background || "#FAF8F5" }}>
                <div style={{ background: ((form.themeColors as Record<string, string>) || {}).cardBg || "#FFFFFF", padding: 14, borderRadius: 8, border: "1px solid #eae5db" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ((form.themeColors as Record<string, string>) || {}).primary || "#2A0F3A", marginBottom: 6, textTransform: "uppercase" }}>Employment Verification</div>
                  <div style={{ fontSize: 11, color: ((form.themeColors as Record<string, string>) || {}).text || "#333333", marginBottom: 4 }}>ID: {String(form.employeeId || "QC-EMP")}</div>
                  <div style={{ fontSize: 11, color: ((form.themeColors as Record<string, string>) || {}).text || "#333333", marginBottom: 8 }}>Dept: {String(form.department || "Department")}</div>
                  {form.active !== false && form.verified !== false && (
                    <div style={{ display: "inline-block", padding: "3px 10px", background: ((form.themeColors as Record<string, string>) || {}).badgeBg || "#D4AF37", color: "#fff", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>
                      ✓ VERIFIED
                    </div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "inline-block", padding: "6px 14px", background: ((form.themeColors as Record<string, string>) || {}).buttonBg || "#2A0F3A", color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      Email Employee
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Promo Card Editor */}
          <div style={{ gridColumn: "1 / -1", padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🚀</span> Sidebar Bottom Promo Card
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px 0" }}>
              Displayed at the bottom of the right-hand sidebar beneath the team members directory.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={defaultLabelStyle}>Promo Headline</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. Strong People Build a Healthier Tomorrow"
                  value={String(((form.sidebarPromo as Record<string, string>) || {}).title || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sidebarPromo: { ...((form.sidebarPromo as Record<string, string>) || {}), title: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label style={defaultLabelStyle}>Promo Subtitle / Body</label>
                <input
                  style={defaultInputStyle}
                  placeholder="Join our mission to advance pharmaceutical excellence..."
                  value={String(((form.sidebarPromo as Record<string, string>) || {}).subtitle || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sidebarPromo: { ...((form.sidebarPromo as Record<string, string>) || {}), subtitle: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: 14 }}>
              <div>
                <label style={defaultLabelStyle}>Button Label</label>
                <input
                  style={defaultInputStyle}
                  placeholder="Meet Our Team →"
                  value={String(((form.sidebarPromo as Record<string, string>) || {}).buttonText || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sidebarPromo: { ...((form.sidebarPromo as Record<string, string>) || {}), buttonText: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label style={defaultLabelStyle}>Button Link URL</label>
                <input
                  style={defaultInputStyle}
                  placeholder="/our-people"
                  value={String(((form.sidebarPromo as Record<string, string>) || {}).buttonUrl || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sidebarPromo: { ...((form.sidebarPromo as Record<string, string>) || {}), buttonUrl: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label style={defaultLabelStyle}>Card Background Image URL</label>
                <input
                  style={defaultInputStyle}
                  placeholder="/images/hero/sanjay-promo-card-bg.jpg"
                  value={String(((form.sidebarPromo as Record<string, string>) || {}).bgImage || "")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sidebarPromo: { ...((form.sidebarPromo as Record<string, string>) || {}), bgImage: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Footer Transition Strip Editor */}
          <div style={{ gridColumn: "1 / -1", padding: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2A0F3A", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <span>✨</span> Footer Transition Strip & Trust Badges
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 16px 0" }}>
              Displayed in the dark plum transition strip directly above the global website footer.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={defaultLabelStyle}>Footer Calligraphy Tagline (Script Font)</label>
              <input
                style={defaultInputStyle}
                placeholder="Together for a healthier tomorrow ♡"
                value={String(form.footerTagline || "")}
                onChange={(e) => setForm({ ...form, footerTagline: e.target.value })}
              />
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", marginBottom: 10 }}>4 Footer Circular Trust Badges</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {(((form.footerBadges as Array<Record<string, string>>) || []).slice(0, 4)).map((badge, idx) => (
                <div key={idx} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#D4AF37", marginBottom: 8 }}>Footer Badge #{idx + 1}</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Icon</label>
                        <input
                          style={defaultInputStyle}
                          placeholder="Icon"
                          value={badge.icon || ""}
                          onChange={(e) => {
                            const updated = [...((form.footerBadges as Array<Record<string, string>>) || [])];
                            updated[idx] = { ...updated[idx], icon: e.target.value };
                            setForm({ ...form, footerBadges: updated });
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Title</label>
                        <input
                          style={defaultInputStyle}
                          placeholder="e.g. GMP Certified"
                          value={badge.title || ""}
                          onChange={(e) => {
                            const updated = [...((form.footerBadges as Array<Record<string, string>>) || [])];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setForm({ ...form, footerBadges: updated });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 2 }}>Subtitle</label>
                      <input
                        style={defaultInputStyle}
                        placeholder="e.g. Zero defect policy"
                        value={badge.subtitle || ""}
                        onChange={(e) => {
                          const updated = [...((form.footerBadges as Array<Record<string, string>>) || [])];
                          updated[idx] = { ...updated[idx], subtitle: e.target.value };
                          setForm({ ...form, footerBadges: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 18px",
              background: "#ffffff",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #2A0F3A 0%, #4A1A66 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(42,15,58,0.25)",
          }}
        >
          {saving ? "Saving Changes…" : "Save Employee →"}
        </button>
      </div>
    </div>
  );
}
