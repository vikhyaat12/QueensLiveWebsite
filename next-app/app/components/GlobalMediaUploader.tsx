"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export type MediaItem = {
  id?: string;
  url: string;
  type?: "image" | "video" | "gif" | "youtube" | "vimeo";
  title?: string;
  posterUrl?: string;
  alt?: string;
};

export type MediaPresets = "product_image" | "product_video" | "banner_desktop" | "banner_mobile" | "logo" | "testimonial" | "aplus_hero" | "blog_featured" | "employee_photo" | "general";

const PRESET_CONFIGS: Record<MediaPresets, { label: string; recommended: string; ratio: string; formats: string; maxSizeMB: number; isVideoAllowed: boolean }> = {
  product_image: {
    label: "Product Image",
    recommended: "1200 × 1200 px",
    ratio: "1:1 Square",
    formats: "WebP, PNG, JPG, GIF",
    maxSizeMB: 15,
    isVideoAllowed: false,
  },
  product_video: {
    label: "Product Video",
    recommended: "1920 × 1080 px (1080p) or YouTube/Vimeo link",
    ratio: "16:9 Landscape",
    formats: "MP4, WebM, MOV, YouTube, Vimeo",
    maxSizeMB: 100,
    isVideoAllowed: true,
  },
  banner_desktop: {
    label: "Desktop Hero Banner",
    recommended: "1920 × 600 px",
    ratio: "16:5 Widescreen",
    formats: "WebP, PNG, JPG, MP4 Video, YouTube",
    maxSizeMB: 100,
    isVideoAllowed: true,
  },
  banner_mobile: {
    label: "Mobile Banner",
    recommended: "800 × 800 px or 800 × 1000 px",
    ratio: "1:1 or 4:5 Portrait",
    formats: "WebP, PNG, JPG, GIF, MP4",
    maxSizeMB: 50,
    isVideoAllowed: true,
  },
  logo: {
    label: "Brand Logo",
    recommended: "400 × 120 px (Transparent Background)",
    ratio: "Wide (~3:1)",
    formats: "SVG, PNG, WebP",
    maxSizeMB: 5,
    isVideoAllowed: false,
  },
  testimonial: {
    label: "Testimonial Photo / Video",
    recommended: "800 × 800 px Square",
    ratio: "1:1 Square / 9:16 Video",
    formats: "JPG, PNG, WebP, MP4, YouTube, Vimeo",
    maxSizeMB: 100,
    isVideoAllowed: true,
  },
  aplus_hero: {
    label: "A+ Hero Banner",
    recommended: "1600 × 600 px",
    ratio: "8:3 Widescreen",
    formats: "WebP, JPG, PNG, MP4, YouTube",
    maxSizeMB: 100,
    isVideoAllowed: true,
  },
  blog_featured: {
    label: "Blog Featured Media",
    recommended: "1200 × 800 px",
    ratio: "3:2 Landscape",
    formats: "WebP, JPG, PNG, GIF, MP4, YouTube",
    maxSizeMB: 100,
    isVideoAllowed: true,
  },
  employee_photo: {
    label: "Employee Profile Photo",
    recommended: "600 × 600 px",
    ratio: "1:1 Square",
    formats: "WebP, PNG, JPG",
    maxSizeMB: 10,
    isVideoAllowed: false,
  },
  general: {
    label: "Media Asset",
    recommended: "High-resolution web optimized",
    ratio: "Free",
    formats: "JPG, PNG, WebP, GIF, SVG, MP4, WebM",
    maxSizeMB: 100,
    isVideoAllowed: true,
  },
};

export function parseMediaInfo(rawUrl: string): {
  type: "youtube" | "vimeo" | "video" | "gif" | "image";
  embedUrl: string;
  posterUrl?: string;
  isExternalVideo: boolean;
} {
  const url = (rawUrl || "").trim();
  if (!url) return { type: "image", embedUrl: "", isExternalVideo: false };

  // 1. YouTube Matchers
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`,
      posterUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      isExternalVideo: true,
    };
  }

  // 2. Vimeo Matchers
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=0`,
      isExternalVideo: true,
    };
  }

  // 3. Direct HTML5 Video
  if (url.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i) || url.includes("/uploads/videos/") || (url.includes("/uploads/") && (url.includes(".mp4") || url.includes(".webm") || url.includes(".mov")))) {
    return {
      type: "video",
      embedUrl: url,
      isExternalVideo: false,
    };
  }

  // 4. GIF Animation
  if (url.match(/\.gif(\?.*)?$/i)) {
    return {
      type: "gif",
      embedUrl: url,
      isExternalVideo: false,
    };
  }

  // 5. Default Image
  return {
    type: "image",
    embedUrl: url,
    isExternalVideo: false,
  };
}

export type GlobalMediaUploaderProps = {
  label: string;
  value?: string | string[] | MediaItem[];
  onChange?: (val: string | string[] | MediaItem[]) => void;
  preset?: MediaPresets;
  multiple?: boolean;
  folder?: string;
  allowVideo?: boolean;
  compact?: boolean;
  onSaveImmediate?: (val: string | string[] | MediaItem[]) => Promise<void> | void;
};

export default function GlobalMediaUploader({
  label,
  value,
  onChange,
  preset = "general",
  multiple = false,
  folder = "general",
  allowVideo = true,
  compact = false,
}: GlobalMediaUploaderProps) {
  const config = PRESET_CONFIGS[preset] || PRESET_CONFIGS.general;
  const isVideoPermitted = allowVideo && config.isVideoAllowed;

  // Normalize items array
  const [items, setItems] = useState<MediaItem[]>(() => {
    if (!value) return [];
    if (typeof value === "string") {
      if (!value.trim()) return [];
      const parsed = parseMediaInfo(value);
      return [{ id: `m-${Date.now()}`, url: value.trim(), type: parsed.type, posterUrl: parsed.posterUrl }];
    }
    if (Array.isArray(value)) {
      return value.map((v, i) => {
        if (typeof v === "string") {
          const parsed = parseMediaInfo(v);
          return { id: `m-${i}-${Date.now()}`, url: v, type: parsed.type, posterUrl: parsed.posterUrl };
        }
        return {
          id: v.id || `m-${i}-${Date.now()}`,
          url: v.url,
          type: v.type || parseMediaInfo(v.url).type,
          title: v.title,
          posterUrl: v.posterUrl,
          alt: v.alt,
        };
      });
    }
    return [];
  });

  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [inputPoster, setInputPoster] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "library">("upload");
  const [libraryFiles, setLibraryFiles] = useState<Array<{ id: string; url: string; title?: string; type?: string }>>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [dimensionWarnings, setDimensionWarnings] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external changes
  useEffect(() => {
    if (value === undefined) return;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) setItems([]);
      else {
        const parsed = parseMediaInfo(trimmed);
        setItems([{ id: "single-1", url: trimmed, type: parsed.type, posterUrl: parsed.posterUrl }]);
      }
    } else if (Array.isArray(value)) {
      setItems(value.map((v, i) => {
        if (typeof v === "string") {
          const parsed = parseMediaInfo(v);
          return { id: `m-${i}`, url: v, type: parsed.type, posterUrl: parsed.posterUrl };
        }
        return {
          id: v.id || `m-${i}`,
          url: v.url,
          type: v.type || parseMediaInfo(v.url).type,
          title: v.title,
          posterUrl: v.posterUrl,
          alt: v.alt,
        };
      }));
    }
  }, [value]);

  const emitChange = useCallback((updated: MediaItem[]) => {
    setItems(updated);
    if (!onChange) return;
    if (multiple) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        onChange(updated.map(u => u.url));
      } else {
        onChange(updated);
      }
    } else {
      onChange(updated[0]?.url || "");
    }
  }, [multiple, onChange, value]);

  // Handle File Upload
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.files?.length) {
        // Separate successful uploads from errors
        const errored = data.files.filter((f: { url?: string; error?: string }) => f.error && !f.url);
        const succeeded = data.files.filter((f: { url?: string; error?: string }) => f.url && !f.error);

        if (errored.length > 0 && succeeded.length === 0) {
          setError(errored.map((e: { name: string; error: string }) => `${e.name}: ${e.error}`).join('; '));
        } else {
          const newItems: MediaItem[] = succeeded.map((f: { url: string; name: string; type: string }, idx: number) => {
            const parsed = parseMediaInfo(f.url);
            return {
              id: `up-${Date.now()}-${idx}`,
              url: f.url,
              title: f.name,
              type: parsed.type,
              posterUrl: parsed.posterUrl,
            };
          });

          if (multiple) {
            emitChange([...items, ...newItems]);
          } else {
            emitChange([newItems[0]]);
          }
          if (errored.length > 0) {
            setError(`${succeeded.length} uploaded. ${errored.length} failed: ${errored[0].error}`);
          } else {
            setError("");
          }
        }
      } else {
        setError(data.error || "Upload failed. Please check file format and size.");
      }
    } catch {
      setError("Network error during file upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Add Direct URL / YouTube / Vimeo
  const handleAddUrl = () => {
    const cleanUrl = inputUrl.trim();
    if (!cleanUrl) {
      setError("Please enter a valid media URL.");
      return;
    }

    const parsed = parseMediaInfo(cleanUrl);
    const newItem: MediaItem = {
      id: `url-${Date.now()}`,
      url: cleanUrl,
      title: inputTitle.trim() || undefined,
      posterUrl: inputPoster.trim() || parsed.posterUrl,
      type: parsed.type,
    };

    if (multiple) {
      emitChange([...items, newItem]);
    } else {
      emitChange([newItem]);
    }

    setInputUrl("");
    setInputTitle("");
    setInputPoster("");
    setError("");
  };

  // Remove Item
  const handleRemove = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    emitChange(updated);
  };

  // Reorder Item
  const handleMove = (idx: number, dir: -1 | 1) => {
    const swap = idx + dir;
    if (swap < 0 || swap >= items.length) return;
    const arr = [...items];
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    emitChange(arr);
  };

  // Load from Media Library
  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (data.media) {
        setLibraryFiles(data.media);
      }
    } catch {
      // ignore
    } finally {
      setLoadingLibrary(false);
    }
  };

  return (
    <div style={{ marginBottom: compact ? 10 : 18, border: "1px solid var(--line)", background: "#fff", padding: compact ? 12 : 16 }}>
      {/* Header with Title & Recommended Specs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--purple)", display: "block" }}>
            {label}
          </label>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>📐 <b>{config.recommended}</b></span>
            <span>✦ Ratio: <b>{config.ratio}</b></span>
            <span>✦ Formats: <b>{config.formats}</b></span>
            <span>✦ Max: <b>{config.maxSizeMB}MB</b></span>
          </div>
        </div>
        {multiple && (
          <span style={{ fontSize: 11, background: "var(--paper)", border: "1px solid var(--line)", padding: "2px 8px", fontWeight: 600 }}>
            {items.length} media item{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: "8px 12px", background: "#fde8e8", color: "#b34141", border: "1px solid #f8b4b4", fontSize: 12, marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Media Items List / Previews */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: multiple ? "repeat(auto-fill, minmax(180px, 1fr))" : "1fr", gap: 12, marginBottom: 14 }}>
          {items.map((item, idx) => {
            const parsed = parseMediaInfo(item.url);
            const isYt = parsed.type === "youtube";
            const isVim = parsed.type === "vimeo";
            const isVid = parsed.type === "video";
            const isGif = parsed.type === "gif";

            return (
              <div
                key={item.id || idx}
                style={{
                  border: "1px solid var(--line)",
                  background: "#faf8f5",
                  padding: 8,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {/* Media Preview Viewport */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: isYt || isVim || isVid ? "16/9" : "4/3",
                    background: "#000",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isYt || isVim ? (
                    <iframe
                      src={parsed.embedUrl}
                      style={{ width: "100%", height: "100%", border: 0 }}
                      title={item.title || `Video ${idx + 1}`}
                      loading="lazy"
                    />
                  ) : isVid ? (
                    <video
                      src={item.url}
                      poster={item.posterUrl}
                      controls
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.alt || item.title || "Preview"}
                      style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fff" }}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        const nw = img.naturalWidth;
                        const nh = img.naturalHeight;
                        if (nw > 0 && nh > 0) {
                          const minDims: Record<string, { w: number; h: number }> = {
                            product_image: { w: 800, h: 800 },
                            banner_desktop: { w: 1600, h: 600 },
                            banner_mobile: { w: 800, h: 800 },
                            blog_featured: { w: 800, h: 500 },
                            employee_photo: { w: 600, h: 600 },
                            general: { w: 600, h: 400 },
                          };
                          const threshold = minDims[preset] || { w: 600, h: 400 };
                          if (nw < threshold.w || nh < threshold.h) {
                            setDimensionWarnings((prev) => ({
                              ...prev,
                              [item.url]: `⚠️ This image may appear blurry at the selected display size (Detected: ${nw}×${nh}px, Recommended: ${threshold.w}×${threshold.h}px or higher).`,
                            }));
                          }
                        }
                      }}
                    />
                  )}

                  {/* Badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      background: isYt ? "#cc0000" : isVim ? "#1ab7ea" : isVid ? "var(--purple)" : isGif ? "#1565c0" : "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontSize: 9,
                      padding: "2px 6px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    {isYt ? "YouTube" : isVim ? "Vimeo" : isVid ? "Video MP4" : isGif ? "GIF" : "Image"}
                  </span>
                </div>

                {/* Info & Meta */}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, wordBreak: "break-all" }}>
                    {item.title || item.url.split("/").pop()?.slice(0, 30) || "Media"}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "var(--muted)", wordBreak: "break-all" }}>
                    {item.url.length > 35 ? item.url.slice(0, 35) + "…" : item.url}
                  </p>
                  {item.posterUrl && (
                    <p style={{ margin: "2px 0 0", fontSize: 9, color: "var(--gold)" }}>
                      🖼️ Custom Poster Set
                    </p>
                  )}
                  {dimensionWarnings[item.url] && (
                    <div
                      style={{
                        margin: "5px 0 2px",
                        padding: "4px 8px",
                        background: "#FEF2F2",
                        border: "1px solid #FCA5A5",
                        borderRadius: 4,
                        color: "#B91C1C",
                        fontSize: 10.5,
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {dimensionWarnings[item.url]}
                    </div>
                  )}
                </div>

                {/* Controls (Reorder / Delete / Replace) */}
                <div style={{ display: "flex", gap: 4, borderTop: "1px solid var(--line)", paddingTop: 6, justifyContent: "space-between" }}>
                  {multiple && (
                    <div style={{ display: "flex", gap: 2 }}>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        title="Move Earlier"
                        style={{ padding: "3px 6px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.4 : 1 }}
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === items.length - 1}
                        title="Move Later"
                        style={{ padding: "3px 6px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", cursor: idx === items.length - 1 ? "not-allowed" : "pointer", opacity: idx === items.length - 1 ? 0.4 : 1 }}
                      >
                        ▶
                      </button>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      style={{ padding: "3px 8px", fontSize: 10, background: "#fff", color: "#b34141", border: "1px solid #f8b4b4", cursor: "pointer", fontWeight: 600 }}
                    >
                      Delete ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Upload Section */}
      {(multiple || items.length === 0) && (
        <div style={{ border: "1px dashed var(--line)", padding: 12, background: "#faf8f5" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 10, borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                background: activeTab === "upload" ? "var(--purple)" : "transparent",
                color: activeTab === "upload" ? "#fff" : "var(--ink)",
                border: "none",
                cursor: "pointer",
              }}
            >
              📤 Upload File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                background: activeTab === "url" ? "var(--purple)" : "transparent",
                color: activeTab === "url" ? "#fff" : "var(--ink)",
                border: "none",
                cursor: "pointer",
              }}
            >
              🔗 Direct URL / YouTube / Vimeo
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("library"); loadLibrary(); }}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                background: activeTab === "library" ? "var(--purple)" : "transparent",
                color: activeTab === "library" ? "#fff" : "var(--ink)",
                border: "none",
                cursor: "pointer",
              }}
            >
              🗄️ Media Library
            </button>
          </div>

          {/* 1. Upload Tab */}
          {activeTab === "upload" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUploadFiles(e.dataTransfer.files); }}
              style={{
                padding: "16px 12px",
                textAlign: "center",
                background: dragActive ? "#f0e6ff" : "#fff",
                border: dragActive ? "2px dashed var(--purple)" : "1px solid var(--line)",
                transition: "background 0.2s",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={isVideoPermitted ? "image/*,video/*" : "image/*"}
                onChange={(e) => handleUploadFiles(e.target.files)}
                style={{ display: "none" }}
              />
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--purple)" }}>
                {uploading ? "⏳ Uploading & Processing Media…" : "Drag & Drop media here, or browse files"}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "var(--muted)" }}>
                Supports {isVideoPermitted ? "Images (JPG, PNG, WebP, GIF, SVG) & Videos (MP4, WebM, MOV)" : "Images (JPG, PNG, WebP, GIF, SVG)"}
              </p>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "8px 18px",
                  background: "var(--gold)",
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: uploading ? "wait" : "pointer",
                }}
              >
                {uploading ? "Uploading…" : "Choose File(s) →"}
              </button>
            </div>
          )}

          {/* 2. Direct URL / YouTube / Vimeo Tab */}
          {activeTab === "url" && (
            <div style={{ background: "#fff", padding: 12, border: "1px solid var(--line)", display: "grid", gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 2 }}>
                  Media URL (Image, MP4, YouTube, Vimeo, or GIF) *
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 12 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 2 }}>
                    Title / Caption (Optional)
                  </label>
                  <input
                    type="text"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    placeholder="e.g. Clinical Application Guide"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 2 }}>
                    Poster / Thumbnail URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={inputPoster}
                    onChange={(e) => setInputPoster(e.target.value)}
                    placeholder="https://.../thumbnail.jpg"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 12 }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddUrl}
                disabled={!inputUrl.trim()}
                style={{
                  padding: "8px 16px",
                  background: "var(--purple)",
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: !inputUrl.trim() ? "not-allowed" : "pointer",
                  width: "fit-content",
                }}
              >
                Add Media URL ＋
              </button>
            </div>
          )}

          {/* 3. Media Library Tab */}
          {activeTab === "library" && (
            <div style={{ background: "#fff", padding: 12, border: "1px solid var(--line)" }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--muted)" }}>
                Select an existing uploaded asset from your media library:
              </p>
              {loadingLibrary ? (
                <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading media library…</p>
              ) : libraryFiles.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--muted)" }}>No media items found in library. Use the Upload tab above.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                  {libraryFiles.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        const parsed = parseMediaInfo(f.url);
                        const newItem: MediaItem = { id: `lib-${f.id}`, url: f.url, title: f.title, type: parsed.type };
                        if (multiple) emitChange([...items, newItem]);
                        else emitChange([newItem]);
                      }}
                      style={{
                        padding: 4,
                        border: "1px solid var(--line)",
                        background: "#faf8f5",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ width: "100%", height: 60, overflow: "hidden", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {f.type === "video" || f.url.includes(".mp4") ? (
                          <span style={{ fontSize: 20 }}>🎬</span>
                        ) : (
                          <img src={f.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>
                      <span style={{ fontSize: 9, color: "var(--ink)", marginTop: 2, wordBreak: "break-all", textAlign: "center" }}>
                        {(f.title || f.url.split("/").pop())?.slice(0, 16)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
