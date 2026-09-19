"use client";

import { useState, useEffect, useRef } from "react";

type MediaItem = {
  name: string;
  url: string;
  size: number;
  type: string;
  modified: string;
};

type FolderStats = {
  folder: string;
  count: number;
  items: MediaItem[];
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
};

const getMediaType = (name: string): "image" | "video" | "gif" | "other" => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "gif") return "gif";
  if (["mp4", "webm", "avi", "mov"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "webp", "svg"].includes(ext)) return "image";
  return "other";
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "image": return { bg: "#e8f5e9", color: "#2e7d32" };
    case "gif": return { bg: "#fff3e0", color: "#e65100" };
    case "video": return { bg: "#f3e5f5", color: "var(--purple)" };
    default: return { bg: "#f5f5f5", color: "#666" };
  }
};

export default function MediaLibrary() {
  const [stats, setStats] = useState<FolderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "gif" | "video">("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("general");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      setStats(data.folders || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchMedia(); }, []);

  const showMsg = (text: string, isError = false) => {
    setActionMsg({ text, isError });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const allItems: (MediaItem & { folder: string })[] = [];
  stats.forEach(f => f.items.forEach(item => allItems.push({ ...item, folder: f.folder })));
  const filtered = allItems
    .filter(item => {
      if (filter !== "all") {
        const t = getMediaType(item.name);
        if (filter === "gif" && t !== "gif") return false;
        if (filter === "image" && t !== "image") return false;
        if (filter === "video" && t !== "video") return false;
      }
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.url.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleDelete = async (url: string) => {
    try {
      const res = await fetch(`/api/admin/media?url=${encodeURIComponent(url)}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showMsg("Asset deleted successfully.");
        setDeleteConfirm(null);
        fetchMedia();
      } else {
        showMsg(data.error || "Failed to delete asset.", true);
      }
    } catch {
      showMsg("Network error deleting asset.", true);
    }
  };

  const handleUpload = async (files: FileList | null, folder = uploadFolder) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("folder", folder);
    Array.from(files).forEach(f => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.files?.length) {
        showMsg(`Uploaded ${data.files.length} asset(s) to ${folder}/`);
        fetchMedia();
      } else {
        showMsg(data.error || "Upload failed", true);
      }
    } catch {
      showMsg("Upload failed due to network error", true);
    }
    setUploading(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ font: "18px var(--font-display)", margin: 0, color: "#2A0F3A" }}>🖼️ Media Library & Asset Management</h3>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
            {allItems.length} files indexed · {stats.reduce((s, f) => s + f.count, 0)} total in uploads
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchMedia} style={{ padding: "7px 16px", background: "#f0f0f0", color: "#333", border: "1px solid var(--line)", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4 }}>
            ↻ Refresh
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: "7px 18px", background: "var(--purple, #2A0F3A)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 4 }}>
            + Upload New Media
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: "10px 14px", marginBottom: 16, borderRadius: 6, fontSize: 12, fontWeight: 600, background: actionMsg.isError ? "#fee2e2" : "#e0f2fe", color: actionMsg.isError ? "#991b1b" : "#0369a1", border: `1px solid ${actionMsg.isError ? "#f87171" : "#7dd3fc"}` }}>
          {actionMsg.text}
        </div>
      )}

      {/* Direct Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          handleUpload(e.dataTransfer.files);
        }}
        style={{
          border: "2px dashed #CBD5E1",
          borderRadius: 8,
          padding: "20px",
          textAlign: "center",
          background: "#F8FAFC",
          marginBottom: 16,
          cursor: "pointer",
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#334155" }}>
          {uploading ? "⏳ Uploading and processing assets..." : "📁 Drag & drop images/videos here or click to upload"}
        </p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "#64748B" }}>Target folder:</span>
          <select
            value={uploadFolder}
            onChange={(e) => { e.stopPropagation(); setUploadFolder(e.target.value); }}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: "3px 8px", fontSize: 11, borderRadius: 4, border: "1px solid #CBD5E1" }}
          >
            <option value="general">general</option>
            <option value="products">products</option>
            <option value="logos">logos</option>
            <option value="blog">blog</option>
            <option value="banners">banners</option>
            <option value="employees">employees</option>
          </select>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>· Supported: WebP, PNG, JPG, SVG, MP4</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {(["all", "image", "gif", "video"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", borderRadius: 4,
              background: filter === f ? "var(--purple, #2A0F3A)" : "#f0f0f0",
              color: filter === f ? "#fff" : "var(--muted)",
            }}>
            {f === "all" ? "All Files" : f === "image" ? "📷 Images" : f === "gif" ? "🎨 GIFs" : "🎬 Videos"}
          </button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by filename or folder…"
          style={{ flex: 1, minWidth: 160, padding: "7px 12px", border: "1px solid var(--line)", fontSize: 12, borderRadius: 4 }}
        />
      </div>

      {/* Media Grid */}
      {loading ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading assets…</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)", borderRadius: 8 }}>
          <p style={{ fontSize: 14 }}>No media files matched.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {filtered.map(item => {
            const mediaType = getMediaType(item.name);
            const tc = getTypeColor(mediaType);
            const isDeleting = deleteConfirm === item.url;
            return (
              <div key={item.url} style={{ border: "1px solid var(--line)", background: "#fff", borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Preview */}
                <div style={{ height: 140, background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                  {mediaType === "video" ? (
                    <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted preload="metadata" />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      loading="lazy"
                    />
                  )}
                  <span style={{ position: "absolute", top: 6, left: 6, fontSize: 9, padding: "2px 6px", borderRadius: 3, ...tc, fontWeight: 700, textTransform: "uppercase" }}>
                    {mediaType}
                  </span>
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
                      <span>{item.folder}</span>
                      <span>{formatSize(item.size)}</span>
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.name}>
                      {item.name}
                    </p>
                  </div>

                  {/* Actions */}
                  <div>
                    {isDeleting ? (
                      <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 4, padding: 6, textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: "#991b1b", margin: "0 0 6px", fontWeight: 600 }}>Permanently delete asset?</p>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => handleDelete(item.url)} style={{ flex: 1, padding: "4px 8px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                            Yes, Delete
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "4px 8px", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 3, fontSize: 10, cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                        <button onClick={() => copyUrl(item.url)}
                          style={{ padding: "5px 6px", fontSize: 10, background: copied === item.url ? "#e9f7e9" : "#f1f5f9", border: "none", cursor: "pointer", fontWeight: 600, borderRadius: 3 }}>
                          {copied === item.url ? "✓ Copied" : "Copy URL"}
                        </button>
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          style={{ padding: "5px 6px", fontSize: 10, background: "#f1f5f9", textDecoration: "none", color: "#334155", textAlign: "center", fontWeight: 600, borderRadius: 3 }}>
                          Preview ↗
                        </a>
                        <button
                          onClick={() => {
                            setReplaceTarget(item.url);
                            replaceInputRef.current?.click();
                          }}
                          style={{ padding: "4px 6px", fontSize: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", cursor: "pointer", borderRadius: 3 }}
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.url)}
                          style={{ padding: "4px 6px", fontSize: 10, background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", cursor: "pointer", borderRadius: 3, fontWeight: 600 }}
                        >
                          Delete 🗑
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden input for replace action */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          if (e.target.files?.length && replaceTarget) {
            const folder = replaceTarget.split("/")[2] || "general";
            await handleUpload(e.target.files, folder);
            setReplaceTarget(null);
          }
        }}
      />
    </div>
  );
}
